"""Geographic helpers. The server is the source of truth (RULES.md #2)."""

import math
from datetime import datetime

import h3
from sqlalchemy.orm import Session

from ..config import get_settings
from ..models import Cell, City


def haversine_m(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    r = 6371000.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lng2 - lng1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def point_in_ring(lng: float, lat: float, ring: list[list[float]]) -> bool:
    """Ray casting. ring = [[lng, lat], …] (GeoJSON order)."""
    inside = False
    n = len(ring)
    for i in range(n):
        x1, y1 = ring[i][0], ring[i][1]
        x2, y2 = ring[(i + 1) % n][0], ring[(i + 1) % n][1]
        if (y1 > lat) != (y2 > lat):
            xin = (x2 - x1) * (lat - y1) / (y2 - y1) + x1
            if lng < xin:
                inside = not inside
    return inside


def fix_issues(
    lat: float,
    lng: float,
    accuracy_m: float,
    recorded_at: datetime,
    now: datetime,
    last_lat: float | None,
    last_lng: float | None,
    last_fix_at: datetime | None,
) -> list[str]:
    """Validation pipeline from PLAN.md §6. Empty list = accepted."""
    s = get_settings()
    issues: list[str] = []
    if accuracy_m > s.max_accuracy_m:
        issues.append("accuracy")
    age = (now - recorded_at).total_seconds()
    if age > s.max_fix_age_s or age < -30:
        issues.append("stale")
    if last_fix_at is not None and last_lat is not None and last_lng is not None:
        dt = (recorded_at - last_fix_at).total_seconds()
        # speed is only meaningful between fixes at least a second apart —
        # same-burst fixes (dt < 1 s) would imply absurd velocities
        if dt >= 1.0:
            speed_kmh = haversine_m(last_lat, last_lng, lat, lng) / dt * 3.6
            if speed_kmh > s.max_speed_kmh:
                issues.append("speed")
    return issues


def latlng_to_h3_int(lat: float, lng: float) -> tuple[int, str]:
    h = h3.latlng_to_cell(lat, lng, get_settings().h3_resolution)
    return int(h, 16), h


def cell_boundary_geojson(h: str) -> list[list[float]]:
    """Closed GeoJSON ring [[lng, lat], …] for an h3 cell."""
    ring = [[lng, lat] for lat, lng in h3.cell_to_boundary(h)]
    ring.append(ring[0])
    return ring


def get_or_create_cell(db: Session, lat: float, lng: float) -> Cell:
    """Find or insert the Cell row for a point, assigning city membership."""
    h_int, h_str = latlng_to_h3_int(lat, lng)
    cell = db.get(Cell, h_int)
    if cell is not None:
        return cell
    center_lat, center_lng = h3.cell_to_latlng(h_str)
    city = (
        db.query(City)
        .filter(City.name.isnot(None))
        .all()
    )
    city_id = next(
        (c.id for c in city if point_in_ring(center_lng, center_lat, c.boundary)), None
    )
    cell = Cell(
        h3_index=h_int,
        resolution=get_settings().h3_resolution,
        center_lat=center_lat,
        center_lng=center_lng,
        boundary=cell_boundary_geojson(h_str),
        city_id=city_id,
    )
    db.add(cell)
    db.flush()
    return cell
