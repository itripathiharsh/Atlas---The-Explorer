"""Seed data: city boundaries and achievement definitions."""

import math


def octagon(lat: float, lng: float, radius_km: float) -> list[list[float]]:
    """Rough city boundary: an octagon of the given radius around the center."""
    ring = []
    for k in range(8):
        theta = math.radians(22.5 + 45 * k)
        ring.append([
            round(lng + radius_km * math.cos(theta) / (111.32 * math.cos(math.radians(lat))), 4),
            round(lat + radius_km * math.sin(theta) / 110.57, 4),
        ])
    return ring


# Rough administrative blob for Lucknow (GeoJSON ring, [lng, lat]).
LUCKNOW_BOUNDARY = [
    [80.795, 26.800], [80.800, 26.860], [80.830, 26.905], [80.870, 26.935],
    [80.910, 26.950], [80.955, 26.945], [80.995, 26.925], [81.030, 26.900],
    [81.055, 26.860], [81.050, 26.815], [81.020, 26.780], [80.970, 26.755],
    [80.920, 26.748], [80.870, 26.760], [80.830, 26.775],
]

CITIES = [
    {"name": "lucknow", "display_name": "Lucknow", "boundary": LUCKNOW_BOUNDARY,
     "center_lat": 26.8467, "center_lng": 80.9462},
    {"name": "delhi", "display_name": "Delhi", "boundary": octagon(28.6139, 77.2090, 18),
     "center_lat": 28.6139, "center_lng": 77.2090},
    {"name": "mumbai", "display_name": "Mumbai", "boundary": octagon(19.0760, 72.8777, 15),
     "center_lat": 19.0760, "center_lng": 72.8777},
    {"name": "jaipur", "display_name": "Jaipur", "boundary": octagon(26.9124, 75.7873, 12),
     "center_lat": 26.9124, "center_lng": 75.7873},
    {"name": "kolkata", "display_name": "Kolkata", "boundary": octagon(22.5726, 88.3639, 13),
     "center_lat": 22.5726, "center_lng": 88.3639},
    {"name": "new_york", "display_name": "New York", "boundary": octagon(40.7128, -74.0060, 15),
     "center_lat": 40.7128, "center_lng": -74.0060},
    {"name": "london", "display_name": "London", "boundary": octagon(51.5074, -0.1278, 15),
     "center_lat": 51.5074, "center_lng": -0.1278},
    {"name": "paris", "display_name": "Paris", "boundary": octagon(48.8566, 2.3522, 10),
     "center_lat": 48.8566, "center_lng": 2.3522},
    {"name": "tokyo", "display_name": "Tokyo", "boundary": octagon(35.6762, 139.6503, 18),
     "center_lat": 35.6762, "center_lng": 139.6503},
    {"name": "dubai", "display_name": "Dubai", "boundary": octagon(25.2048, 55.2708, 13),
     "center_lat": 25.2048, "center_lng": 55.2708},
    {"name": "singapore", "display_name": "Singapore", "boundary": octagon(1.3521, 103.8198, 10),
     "center_lat": 1.3521, "center_lng": 103.8198},
    {"name": "los_angeles", "display_name": "Los Angeles", "boundary": octagon(34.0522, -118.2437, 20),
     "center_lat": 34.0522, "center_lng": -118.2437},
    {"name": "san_francisco", "display_name": "San Francisco", "boundary": octagon(37.7749, -122.4194, 12),
     "center_lat": 37.7749, "center_lng": -122.4194},
    {"name": "chicago", "display_name": "Chicago", "boundary": octagon(41.8781, -87.6298, 16),
     "center_lat": 41.8781, "center_lng": -87.6298},
]

ACHIEVEMENTS = [
    {
        "code": "first_steps",
        "name": "First Steps",
        "description": "Unlock your first area.",
        "criteria": {"metric": "cells_unlocked", "value": 1},
    },
    {
        "code": "explorer",
        "name": "Explorer",
        "description": "Explore 10 different areas.",
        "criteria": {"metric": "cells_unlocked", "value": 10},
    },
    {
        "code": "city_walker",
        "name": "City Walker",
        "description": "Explore 25% of Lucknow.",
        "criteria": {"metric": "city_pct", "value": 25},
    },
    {
        "code": "local",
        "name": "Local",
        "description": "Explore 50% of Lucknow.",
        "criteria": {"metric": "city_pct", "value": 50},
    },
    {
        "code": "gem_hunter",
        "name": "Hidden Gem Hunter",
        "description": "Visit 3 places the community recommends.",
        "criteria": {"metric": "gems_visited", "value": 3},
    },
    {
        "code": "completionist",
        "name": "Completionist",
        "description": "Reach 100% exploration of Lucknow.",
        "criteria": {"metric": "city_pct", "value": 100},
    },
]


def seed_cities(db):
    from ..models import City

    created = []
    for c in CITIES:
        existing = db.query(City).filter(City.name == c["name"]).first()
        if existing:
            created.append(existing)
            continue
        city = City(
            name=c["name"],
            display_name=c["display_name"],
            boundary=c["boundary"],
            center_lat=c["center_lat"],
            center_lng=c["center_lng"],
            total_cells=0,
        )
        db.add(city)
        created.append(city)
    db.commit()
    return created


def seed_city_cells(db, city) -> int:
    """Polyfill the city boundary into the cells table and set total_cells."""
    import h3

    from ..config import get_settings
    from ..models import Cell
    from ..services.geo import cell_boundary_geojson

    poly = h3.LatLngPoly([(p[1], p[0]) for p in city.boundary])  # (lat, lng)
    for hs in h3.polygon_to_cells(poly, get_settings().h3_resolution):
        h_int = int(hs, 16)
        if db.get(Cell, h_int) is not None:
            continue
        lat, lng = h3.cell_to_latlng(hs)
        db.add(
            Cell(
                h3_index=h_int,
                resolution=get_settings().h3_resolution,
                center_lat=lat,
                center_lng=lng,
                boundary=cell_boundary_geojson(hs),
                city_id=city.id,
            )
        )
    db.flush()
    city.total_cells = db.query(Cell).filter(Cell.city_id == city.id).count()
    db.commit()
    return city.total_cells


def seed_achievements(db):
    from ..models import Achievement

    for a in ACHIEVEMENTS:
        existing = db.query(Achievement).filter(Achievement.code == a["code"]).first()
        if existing:
            existing.criteria = a["criteria"]
            existing.name = a["name"]
            existing.description = a["description"]
        else:
            db.add(Achievement(code=a["code"], name=a["name"], description=a["description"], criteria=a["criteria"]))
    db.commit()
