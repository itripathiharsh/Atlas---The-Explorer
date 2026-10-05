"""Seed data: city boundaries and achievement definitions."""

# Rough administrative blob for Lucknow (GeoJSON ring, [lng, lat]).
LUCKNOW_BOUNDARY = [
    [80.795, 26.800], [80.800, 26.860], [80.830, 26.905], [80.870, 26.935],
    [80.910, 26.950], [80.955, 26.945], [80.995, 26.925], [81.030, 26.900],
    [81.055, 26.860], [81.050, 26.815], [81.020, 26.780], [80.970, 26.755],
    [80.920, 26.748], [80.870, 26.760], [80.830, 26.775],
]

CITIES = [
    {
        "name": "lucknow",
        "display_name": "Lucknow",
        "boundary": LUCKNOW_BOUNDARY,
        "center_lat": 26.8467,
        "center_lng": 80.9462,
    }
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
