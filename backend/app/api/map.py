import h3
from fastapi import APIRouter, Query
from sqlalchemy import func, select

from ..config import get_settings
from ..models import Cell, City, UserCell
from ..schemas import MapSummaryOut
from ..services.gamification import city_percent
from .deps import DbDep, UserDep

router = APIRouter(prefix="/map", tags=["map"])

# default viewport ≈ the Lucknow seed area
DEFAULT_BBOX = (80.60, 26.60, 81.25, 27.10)


@router.get("/explored")
def explored(user: UserDep, db: DbDep, bbox: str | None = Query(None)):
    """GeoJSON FeatureCollection of cells the user has unlocked inside a bbox."""
    west, south, east, north = DEFAULT_BBOX
    if bbox:
        try:
            west, south, east, north = (float(v) for v in bbox.split(","))
        except ValueError:
            raise ValueError("bbox must be west,south,east,north")

    rows = (
        db.query(Cell, UserCell.first_explored_at)
        .join(UserCell, UserCell.h3_index == Cell.h3_index)
        .filter(
            UserCell.user_id == user.id,
            Cell.center_lat >= south,
            Cell.center_lat <= north,
            Cell.center_lng >= west,
            Cell.center_lng <= east,
        )
        .all()
    )
    features = [
        {
            "type": "Feature",
            "geometry": {"type": "Polygon", "coordinates": [cell.boundary]},
            "properties": {
                "h3": h3.int_to_str(cell.h3_index),
                "explored_at": explored.isoformat(),
            },
        }
        for cell, explored in rows
    ]
    return {"type": "FeatureCollection", "features": features}


@router.get("/summary", response_model=MapSummaryOut)
def summary(
    user: UserDep,
    db: DbDep,
    lat: float | None = Query(None, ge=-90, le=90),
    lng: float | None = Query(None, ge=-180, le=180),
):
    s = get_settings()
    target_lat = lat if lat is not None else user.last_lat
    target_lng = lng if lng is not None else user.last_lng

    current_city_out = None
    if target_lat is not None and target_lng is not None:
        try:
            from ..services.places import resolve_or_create_city
            curr_c = resolve_or_create_city(db, target_lat, target_lng)
            if curr_c:
                current_city_out = {
                    "name": curr_c.name,
                    "display_name": curr_c.display_name,
                    "pct": city_percent(db, user.id, curr_c),
                    "center_lat": curr_c.center_lat,
                    "center_lng": curr_c.center_lng,
                }
        except Exception:
            pass

    cities = db.query(City).all()
    cells = (
        db.query(func.count(UserCell.id)).filter(UserCell.user_id == user.id).scalar() or 0
    )
    city_items = [
        {
            "name": c.name,
            "display_name": c.display_name,
            "pct": city_percent(db, user.id, c),
            "center_lat": c.center_lat,
            "center_lng": c.center_lng,
        }
        for c in cities
    ]
    if current_city_out:
        city_items = [c for c in city_items if c["name"] != current_city_out["name"]]
        city_items.insert(0, current_city_out)

    return MapSummaryOut(
        cities=city_items,
        world_pct=round(cells / s.world_total_cells * 100, 4),
        current_city=current_city_out,
    )
