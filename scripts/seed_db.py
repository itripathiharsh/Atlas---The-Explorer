"""Seed the dev database: city boundaries + cells, achievements, discoveries.

Sources:
  - app/seed/lucknow_places.py  (hand-curated Lucknow)
  - app/seed/world_places.json  (fetched from Wikipedia — see scripts/fetch_places.py)
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))

import h3  # noqa: E402

from app.config import get_settings  # noqa: E402
from app.db import SessionLocal  # noqa: E402
from app.models import Achievement, Discovery  # noqa: E402
from app.seed.base import seed_achievements, seed_city_cells, seed_cities  # noqa: E402
from app.seed.lucknow_places import DISCOVERIES  # noqa: E402
from app.services.geo import point_in_ring  # noqa: E402


def import_world_places(db, cities) -> int:
    path = Path(__file__).resolve().parents[1] / "backend" / "app" / "seed" / "world_places.json"
    if not path.exists():
        print("world_places.json not found — skipping world import")
        return 0
    places = json.loads(path.read_text(encoding="utf-8"))
    added = 0
    for p in places:
        exists = db.query(Discovery).filter(Discovery.name == p["name"]).first()
        if exists:
            continue
        city = next(
            (c for c in cities if point_in_ring(p["lng"], p["lat"], c.boundary)), None
        )
        h_int = int(h3.latlng_to_cell(p["lat"], p["lng"], get_settings().h3_resolution), 16)
        db.add(
            Discovery(
                name=p["name"],
                description=p["description"],
                category=p["category"],
                lat=p["lat"],
                lng=p["lng"],
                h3_index=h_int,
                city_id=city.id if city else None,
                source="seed",
            )
        )
        added += 1
    db.commit()
    return added


def run():
    db = SessionLocal()
    try:
        cities = seed_cities(db)
        seed_achievements(db)

        for city in cities:
            total = seed_city_cells(db, city)
            print(f"{city.display_name}: {total} cells")

        for d in DISCOVERIES:
            if not any(point_in_ring(d["lng"], d["lat"], c.boundary) for c in cities):
                continue
            exists = (
                db.query(Discovery)
                .filter(Discovery.name == d["name"], Discovery.category == d["category"])
                .first()
            )
            if exists:
                continue
            h_int = int(
                h3.latlng_to_cell(d["lat"], d["lng"], get_settings().h3_resolution), 16
            )
            lucknow = next(c for c in cities if c.name == "lucknow")
            db.add(
                Discovery(
                    name=d["name"],
                    description=d["description"],
                    category=d["category"],
                    lat=d["lat"],
                    lng=d["lng"],
                    h3_index=h_int,
                    city_id=lucknow.id,
                    source="seed",
                )
            )
        db.commit()
        added = import_world_places(db, cities)
        print(f"world places added: {added}")
        print(f"Discoveries total: {db.query(Discovery).count()}")
        print(f"Achievements: {db.query(Achievement).count()}")
        print("Seed complete.")
    finally:
        db.close()


if __name__ == "__main__":
    run()
