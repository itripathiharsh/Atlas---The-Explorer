import json
import math
import re
import urllib.parse
import urllib.request
from typing import Any
from sqlalchemy.orm import Session

from ..models import City, Discovery, Photo, User
from .geo import haversine_m, latlng_to_h3_int, point_in_ring

_GEODECODE_CACHE: dict[str, str] = {}
_DISCOVERY_FETCHED_COORDS: set[str] = set()

HEADERS = {"User-Agent": "AtlasExplorer/1.0 (https://github.com/itripathiharsh/Atlas---The-Explorer; contact@atlas.local)"}


def reverse_geocode_city(lat: float, lng: float) -> tuple[str, str]:
    """Resolve city name and display name using OpenStreetMap Nominatim with graceful fallback."""
    cache_key = f"{round(lat, 2)},{round(lng, 2)}"
    if cache_key in _GEODECODE_CACHE:
        raw = _GEODECODE_CACHE[cache_key]
        parts = raw.split("|", 1)
        return parts[0], parts[1] if len(parts) > 1 else parts[0]

    city_name = ""
    display_name = ""
    try:
        url = f"https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lng}&format=json&zoom=10"
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=3.5) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            addr: dict[str, Any] = data.get("address", {})
            city_name = (
                addr.get("city")
                or addr.get("town")
                or addr.get("municipality")
                or addr.get("suburb")
                or addr.get("county")
                or addr.get("state_district")
                or addr.get("state")
                or ""
            )
            state_country = ", ".join(filter(None, [addr.get("state"), addr.get("country")]))
            if city_name and state_country:
                display_name = f"{city_name}, {state_country}"
            elif city_name:
                display_name = city_name
    except Exception:
        pass

    if not city_name:
        city_name = f"Zone_{int(abs(lat) * 100)}_{int(abs(lng) * 100)}"
        display_name = f"Expedition Sector ({lat:.2f}, {lng:.2f})"

    _GEODECODE_CACHE[cache_key] = f"{city_name}|{display_name}"
    return city_name, display_name


def resolve_or_create_city(db: Session, lat: float, lng: float) -> City:
    """Find the existing city covering (lat, lng), or create a dynamic territory on-demand."""
    # 1. Check existing cities by polygon boundary or close center
    cities = db.query(City).all()
    for c in cities:
        if c.boundary and point_in_ring(lng, lat, c.boundary):
            return c
        if haversine_m(lat, lng, c.center_lat, c.center_lng) <= 30_000:
            return c

    # 2. Reverse geocode to find real name
    city_name, display_name = reverse_geocode_city(lat, lng)
    base_slug = re.sub(r"[^a-z0-9]+", "_", city_name.lower()).strip("_")[:50]
    if not base_slug:
        base_slug = f"city_{int(abs(lat) * 100)}_{int(abs(lng) * 100)}"

    slug = base_slug
    counter = 1
    while db.query(City).filter(City.name == slug).first() is not None:
        slug = f"{base_slug}_{counter}"[:60]
        counter += 1

    # 3. Create an octagon boundary for the new exploration territory (~25 km radius)
    r_lat = 0.22
    r_lng = 0.22 / max(0.2, math.cos(math.radians(lat)))
    angles = [i * math.pi / 4 for i in range(8)]
    boundary = [[round(lng + r_lng * math.cos(a), 4), round(lat + r_lat * math.sin(a), 4)] for a in angles]
    boundary.append(boundary[0])

    new_city = City(
        name=slug,
        display_name=display_name,
        boundary=boundary,
        center_lat=lat,
        center_lng=lng,
        total_cells=1200,  # Standard density for ~45 km urban area
    )
    db.add(new_city)
    db.flush()
    return new_city


def categorize_poi(title: str, extract: str) -> str:
    """Derive appropriate category based on encyclopedic title and description."""
    text = f"{title} {extract}".lower()
    if any(k in text for k in ["food", "restaurant", "cafe", "bazaar", "market", "dhaba", "sweets", "chaat", "bakery"]):
        return "Food"
    if any(k in text for k in ["park", "garden", "botanical", "zoological", "reserve"]):
        return "Park"
    if any(k in text for k in ["lake", "river", "waterfall", "wildlife", "sanctuary", "forest", "nature"]):
        return "Nature"
    if any(k in text for k in ["museum", "gallery", "exhibition", "planetarium"]):
        return "Museum"
    if any(k in text for k in ["monument", "memorial", "tomb", "pillar", "statue", "mausoleum"]):
        return "Monument"
    if any(k in text for k in ["temple", "church", "cathedral", "mosque", "gurdwara", "ashram", "monastery", "theatre", "palace", "fort", "heritage"]):
        return "Culture"
    if any(k in text for k in ["viewpoint", "lookout", "rooftop", "cliff", "tower", "observatory", "hill"]):
        return "Viewpoint"
    if any(k in text for k in ["avenue", "street", "road", "boulevard", "chowk", "square", "bridge", "ghat"]):
        return "Street"
    if any(k in text for k in ["gate", "station", "building", "hall", "clock tower", "stadium"]):
        return "Landmark"
    return "Hidden gem"


def fetch_and_populate_global_discoveries(
    db: Session,
    lat: float,
    lng: float,
    radius_m: float = 3000,
    user_id: int | None = None,
) -> int:
    """On-demand discovery spawner: fetches encyclopedic landmarks anywhere on Earth via Wikipedia geosearch."""
    coord_key = f"{round(lat, 2)},{round(lng, 2)}"
    if coord_key in _DISCOVERY_FETCHED_COORDS:
        return 0
    _DISCOVERY_FETCHED_COORDS.add(coord_key)

    city = resolve_or_create_city(db, lat, lng)

    try:
        search_radius = min(10000, max(2500, int(radius_m * 1.5)))
        url = (
            f"https://en.wikipedia.org/w/api.php?action=query&list=geosearch"
            f"&gscoord={lat}|{lng}&gsradius={search_radius}&gslimit=15&format=json"
        )
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=4.0) as resp:
            geo_data = json.loads(resp.read().decode("utf-8"))

        items = geo_data.get("query", {}).get("geosearch", [])
        if not items:
            return 0

        # Filter items and batch-fetch extracts and photos
        page_ids = [str(item["pageid"]) for item in items[:12]]
        if not page_ids:
            return 0

        details_url = (
            f"https://en.wikipedia.org/w/api.php?action=query&pageids={'|'.join(page_ids)}"
            f"&prop=extracts|pageimages&exintro=1&explaintext=1&pithumbsize=800&format=json"
        )
        req2 = urllib.request.Request(details_url, headers=HEADERS)
        with urllib.request.urlopen(req2, timeout=4.5) as resp2:
            pages_data = json.loads(resp2.read().decode("utf-8")).get("query", {}).get("pages", {})

        photo_author_id = user_id
        if not photo_author_id:
            first_user = db.query(User.id).first()
            photo_author_id = first_user[0] if first_user else None

        created_count = 0
        for item in items:
            pid = str(item["pageid"])
            page = pages_data.get(pid, {})
            title = item.get("title", "").strip()
            item_lat = float(item["lat"])
            item_lng = float(item["lon"])

            # Skip generic administrative regions or districts
            if any(term in title.lower() for term in ["district", "constituency", "division", "census town", "subdivision"]):
                continue

            # Check if discovery already exists nearby (within 50 meters or same name)
            existing = (
                db.query(Discovery)
                .filter(
                    (Discovery.name == title)
                    | (
                        (Discovery.lat >= item_lat - 0.0006)
                        & (Discovery.lat <= item_lat + 0.0006)
                        & (Discovery.lng >= item_lng - 0.0006)
                        & (Discovery.lng <= item_lng + 0.0006)
                    )
                )
                .first()
            )
            if existing:
                continue

            extract = page.get("extract", "").strip()
            # Truncate extract to first two sentences or ~280 chars for clean card presentation
            if extract:
                sentences = re.split(r"(?<=[.!?])\s+", extract)
                short_desc = " ".join(sentences[:2]) if len(sentences) >= 2 else extract
                if len(short_desc) > 300:
                    short_desc = short_desc[:297] + "..."
            else:
                short_desc = f"A notable exploration landmark located in {city.display_name}."

            category = categorize_poi(title, extract)
            photo_url = page.get("thumbnail", {}).get("source")
            h3_int, _ = latlng_to_h3_int(item_lat, item_lng)

            disc = Discovery(
                name=title[:120],
                category=category[:40],
                description=short_desc,
                lat=item_lat,
                lng=item_lng,
                h3_index=h3_int,
                created_by=None,
                city_id=city.id,
                source="seed",
                status="active",
            )
            db.add(disc)
            db.flush()

            if photo_url and photo_author_id:
                db.add(
                    Photo(
                        user_id=photo_author_id,
                        discovery_id=disc.id,
                        url=photo_url,
                        moderation="approved",
                    )
                )
            created_count += 1

        db.commit()
        return created_count
    except Exception:
        db.rollback()
        return 0
