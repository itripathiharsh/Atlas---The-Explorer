import pytest
from app.models import City, Discovery
from conftest import auth_headers


def test_resolve_or_create_dynamic_city(db):
    from app.services.places import resolve_or_create_city

    # Coordinates for a point in Bengaluru (outside the 11 pre-seeded cities)
    bengaluru_lat, bengaluru_lng = 12.9716, 77.5946
    city = resolve_or_create_city(db, bengaluru_lat, bengaluru_lng)
    assert city is not None
    assert city.id is not None
    assert "bengaluru" in city.name or "zone" in city.name or "city" in city.name
    assert city.total_cells > 0
    assert len(city.boundary) >= 8

    # Querying the same location returns the existing city record
    city2 = resolve_or_create_city(db, bengaluru_lat + 0.005, bengaluru_lng + 0.005)
    assert city2.id == city.id


def test_map_summary_with_current_city(client, db):
    headers, _ = auth_headers(client)
    # Query summary without coordinates
    r = client.get("/api/map/summary", headers=headers)
    assert r.status_code == 200
    data = r.json()
    assert "cities" in data
    assert "world_pct" in data

    # Query summary with user location coordinates
    r2 = client.get("/api/map/summary?lat=12.9716&lng=77.5946", headers=headers)
    assert r2.status_code == 200
    data2 = r2.json()
    assert data2.get("current_city") is not None
    assert data2["current_city"]["name"] == data2["cities"][0]["name"]


def test_discoveries_nearby_dynamic_fallback(client, db):
    headers, _ = auth_headers(client)
    # Querying a location returns a list of discoveries
    r = client.get("/api/discoveries/nearby?lat=26.8467&lng=80.9462&radius_m=3000", headers=headers)
    assert r.status_code == 200
    assert isinstance(r.json(), list)
