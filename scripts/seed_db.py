"""Seed the dev database: city boundaries + cells, achievements, discoveries."""
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


def run():
    db = SessionLocal()
    try:
        cities = seed_cities(db)
        seed_achievements(db)

        for city in cities:
            total = seed_city_cells(db, city)
            print(f"{city.display_name}: {total} cells")

            for d in DISCOVERIES:
                if not point_in_ring(d["lng"], d["lat"], city.boundary):
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
                db.add(
                    Discovery(
                        name=d["name"],
                        description=d["description"],
                        category=d["category"],
                        lat=d["lat"],
                        lng=d["lng"],
                        h3_index=h_int,
                        city_id=city.id,
                        source="seed",
                    )
                )
        db.commit()
        print(f"Discoveries: {db.query(Discovery).count()}")
        print(f"Achievements: {db.query(Achievement).count()}")
        print("Seed complete.")
    finally:
        db.close()


if __name__ == "__main__":
    run()
