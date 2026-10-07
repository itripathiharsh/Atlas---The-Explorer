"""Master seed script to populate Supabase PostgreSQL with authentic real-world tourism data.

Covers:
1. All 14 major world & US cities.
2. Lucknow: 44 curated monuments, culture spots, parks, and legendary Awadhi food spots.
3. World: 248 authentic landmarks across Delhi, Mumbai, Jaipur, Kolkata, London, Paris, Tokyo, Dubai, Singapore.
4. USA: 34 iconic landmarks across New York City, Los Angeles, San Francisco, Chicago.
"""

import json
import os
import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(backend_dir))

import h3
from sqlalchemy import text
from app.db import create_engine
from app.seed.base import CITIES, octagon
from app.seed.lucknow_places import DISCOVERIES as LUCKNOW_DISCOVERIES

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql+psycopg://postgres.ijllyjpqgsxhekpfkefn:OseUJ0DFIxSo8Qnk@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?sslmode=require",
)


def seed_all():
    print("Connecting to Supabase database...")
    engine = create_engine(DATABASE_URL)
    conn = engine.connect()

    # 1. Ensure all cities exist in `cities`
    print("\n1. Syncing cities...")
    city_map = {}  # name -> id
    for c in CITIES:
        boundary_json = json.dumps(c["boundary"])
        # Check if city exists
        row = conn.execute(
            text("SELECT id FROM cities WHERE name = :name"),
            {"name": c["name"]}
        ).fetchone()
        if row:
            city_id = row[0]
            conn.execute(
                text("""
                    UPDATE cities 
                    SET display_name = :display_name, center_lat = :lat, center_lng = :lng, boundary = CAST(:boundary AS json)
                    WHERE id = :id
                """),
                {
                    "display_name": c["display_name"],
                    "lat": c["center_lat"],
                    "lng": c["center_lng"],
                    "boundary": boundary_json,
                    "id": city_id,
                }
            )
        else:
            ins = conn.execute(
                text("""
                    INSERT INTO cities (name, display_name, boundary, center_lat, center_lng, total_cells)
                    VALUES (:name, :display_name, CAST(:boundary AS json), :lat, :lng, 1200)
                    RETURNING id
                """),
                {
                    "name": c["name"],
                    "display_name": c["display_name"],
                    "boundary": boundary_json,
                    "lat": c["center_lat"],
                    "lng": c["center_lng"],
                }
            )
            city_id = ins.fetchone()[0]
        city_map[c["name"]] = city_id
        print(f"  City '{c['name']}' ready (id: {city_id})")

    conn.commit()

    # Get admin or default user id for photos
    user_row = conn.execute(text("SELECT id FROM users ORDER BY id ASC LIMIT 1")).fetchone()
    admin_user_id = user_row[0] if user_row else None

    # Helper function to insert a discovery with photo
    def insert_discovery(name, category, description, lat, lng, city_name, photo_url=None):
        city_id = city_map.get(city_name)
        h3_cell = h3.latlng_to_cell(lat, lng, 8)
        h3_int = int(h3_cell, 16)

        # Check if already exists by name or very close proximity
        existing = conn.execute(
            text("""
                SELECT id FROM discoveries 
                WHERE name = :name 
                   OR (lat BETWEEN :lat_min AND :lat_max AND lng BETWEEN :lng_min AND :lng_max)
                LIMIT 1
            """),
            {
                "name": name,
                "lat_min": lat - 0.0005,
                "lat_max": lat + 0.0005,
                "lng_min": lng - 0.0005,
                "lng_max": lng + 0.0005,
            }
        ).fetchone()

        if existing:
            disc_id = existing[0]
            # Update description / category if updated
            conn.execute(
                text("""
                    UPDATE discoveries
                    SET description = :description, category = :category, city_id = :city_id
                    WHERE id = :id
                """),
                {
                    "description": description,
                    "category": category,
                    "city_id": city_id,
                    "id": disc_id,
                }
            )
        else:
            ins = conn.execute(
                text("""
                    INSERT INTO discoveries (name, category, description, lat, lng, h3_index, city_id, source, status, created_at)
                    VALUES (:name, :category, :description, :lat, :lng, :h3_index, :city_id, 'seed', 'active', NOW())
                    RETURNING id
                """),
                {
                    "name": name[:120],
                    "category": category[:40],
                    "description": description,
                    "lat": lat,
                    "lng": lng,
                    "h3_index": h3_int,
                    "city_id": city_id,
                }
            )
            disc_id = ins.fetchone()[0]

        # Add photo if given and not already present
        if photo_url and admin_user_id:
            photo_exists = conn.execute(
                text("SELECT id FROM photos WHERE discovery_id = :disc_id LIMIT 1"),
                {"disc_id": disc_id}
            ).fetchone()
            if not photo_exists:
                conn.execute(
                    text("""
                        INSERT INTO photos (user_id, discovery_id, url, moderation, created_at)
                        VALUES (:user_id, :disc_id, :url, 'approved', NOW())
                    """),
                    {
                        "user_id": admin_user_id,
                        "disc_id": disc_id,
                        "url": photo_url,
                    }
                )

        return disc_id

    # 2. Seed curated Lucknow places
    print("\n2. Seeding Lucknow attractions...")
    # Curated photo mapping for iconic Lucknow spots
    LUCKNOW_PHOTOS = {
        "Bara Imambara": "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80",
        "Rumi Darwaza": "https://images.unsplash.com/photo-1588714477688-cf28a50e94f7?auto=format&fit=crop&w=800&q=80",
        "Chhota Imambara": "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=800&q=80",
        "The Residency": "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80",
        "Dilkusha Kothi": "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=800&q=80",
        "Ambedkar Memorial Park": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80",
        "Janeshwar Mishra Park": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
        "Tunday Kababi, Aminabad": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
        "Royal Cafe, Hazratganj": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
        "Prakash Kulfi, Aminabad": "https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=800&q=80",
        "Hazratganj": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80",
    }
    lko_count = 0
    for d in LUCKNOW_DISCOVERIES:
        photo = LUCKNOW_PHOTOS.get(d["name"])
        insert_discovery(
            name=d["name"],
            category=d["category"],
            description=d["description"],
            lat=d["lat"],
            lng=d["lng"],
            city_name="lucknow",
            photo_url=photo,
        )
        lko_count += 1
    conn.commit()
    print(f"  Inserted/Updated {lko_count} Lucknow places.")

    # 3. Seed USA places (New York, Los Angeles, San Francisco, Chicago)
    print("\n3. Seeding USA attractions...")
    usa_path = backend_dir / "app" / "seed" / "usa_places.json"
    usa_data = json.load(open(usa_path, "r", encoding="utf-8"))
    usa_count = 0
    for d in usa_data:
        insert_discovery(
            name=d["name"],
            category=d["category"],
            description=d["description"],
            lat=d["lat"],
            lng=d["lng"],
            city_name=d["city"],
            photo_url=d.get("photo_url"),
        )
        usa_count += 1
    conn.commit()
    print(f"  Inserted/Updated {usa_count} USA places.")

    # 4. Seed World Places (Delhi, Mumbai, Jaipur, Kolkata, London, Paris, Tokyo, Dubai, Singapore)
    print("\n4. Seeding World attractions...")
    world_path = backend_dir / "app" / "seed" / "world_places.json"
    world_data = json.load(open(world_path, "r", encoding="utf-8"))
    world_count = 0
    for d in world_data:
        insert_discovery(
            name=d["name"],
            category=d["category"],
            description=d["description"],
            lat=d["lat"],
            lng=d["lng"],
            city_name=d.get("city"),
            photo_url=None,
        )
        world_count += 1
    conn.commit()
    print(f"  Inserted/Updated {world_count} World places.")

    total_discoveries = conn.execute(text("SELECT count(*) FROM discoveries")).scalar()
    total_photos = conn.execute(text("SELECT count(*) FROM photos")).scalar()
    print(f"\n Seeding complete! Total discoveries in Supabase: {total_discoveries}, Photos: {total_photos}")
    conn.close()


if __name__ == "__main__":
    seed_all()
