from datetime import timedelta

import pytest

from app.models import Discovery, Visit, XpEvent
from conftest import auth_headers

LUCKNOW_CENTER = (26.8467, 80.9462)


@pytest.fixture()
def disc(db, city):
    def make(name="Test Viewpoint", lat=26.8467, lng=80.9462, category="Viewpoint"):
        import h3

        d = Discovery(
            name=name,
            description="test place",
            category=category,
            lat=lat,
            lng=lng,
            h3_index=int(h3.latlng_to_cell(lat, lng, 8), 16),
            city_id=city.id,
            source="seed",
        )
        db.add(d)
        db.commit()
        return d

    return make


def now_iso(offset_s=0):
    from datetime import datetime, timedelta, timezone

    return (datetime.now(timezone.utc) + timedelta(seconds=offset_s)).isoformat()


def good_fix(lat, lng, acc=10.0, off=0):
    return {"lat": lat, "lng": lng, "accuracy_m": acc, "recorded_at": now_iso(off)}


def test_nearby_sorted_by_distance(client, disc):
    headers, _ = auth_headers(client, username="walker", email="w@x.com")
    d1 = disc(name="Near", lat=26.8475, lng=80.9470)
    d2 = disc(name="Far", lat=26.8500, lng=80.9500)
    r = client.get(
        "/api/discoveries/nearby",
        params={"lat": LUCKNOW_CENTER[0], "lng": LUCKNOW_CENTER[1], "radius_m": 2000},
        headers=headers,
    )
    assert r.status_code == 200
    items = r.json()
    names = [i["name"] for i in items]
    assert names.index("Near") < names.index("Far")
    assert items[0]["distance_m"] is not None


def test_create_discovery_requires_good_fix(client, city):
    headers, _ = auth_headers(client, username="maker", email="m@x.com")
    base = {"name": "My Spot", "category": "Park", "lat": 26.8467, "lng": 80.9462}
    # accuracy too poor
    r = client.post(
        "/api/discoveries",
        json={**base, "fix_lat": 26.8467, "fix_lng": 80.9462, "accuracy_m": 500, "recorded_at": now_iso()},
        headers=headers,
    )
    assert r.status_code == 422
    # pin too far from the player's fix
    r = client.post(
        "/api/discoveries",
        json={**base, "lat": 26.95, "lng": 81.0, "fix_lat": 26.8467, "fix_lng": 80.9462,
              "accuracy_m": 10, "recorded_at": now_iso()},
        headers=headers,
    )
    assert r.status_code == 422


def test_create_discovery_success_and_xp(client, city):
    headers, user = auth_headers(client, username="maker2", email="m2@x.com")
    r = client.post(
        "/api/discoveries",
        json={"name": "Secret Courtyard", "category": "Culture",
              "description": "a quiet courtyard", "lat": 26.8467, "lng": 80.9462,
              "fix_lat": 26.8467, "fix_lng": 80.9462, "accuracy_m": 10, "recorded_at": now_iso()},
        headers=headers,
    )
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["created_by_me"] is True
    assert body["name"] == "Secret Courtyard"


def test_create_rate_limited(client, city):
    headers, _ = auth_headers(client, username="spammy", email="s@x.com")
    for i in range(5):
        r = client.post(
            "/api/discoveries",
            json={"name": f"Place {i}", "category": "Park",
                  "lat": LUCKNOW_CENTER[0] + i * 0.002, "lng": LUCKNOW_CENTER[1],
                  "fix_lat": LUCKNOW_CENTER[0] + i * 0.002, "fix_lng": LUCKNOW_CENTER[1],
                  "accuracy_m": 10, "recorded_at": now_iso()},
            headers=headers,
        )
        assert r.status_code == 201, r.text
    r = client.post(
        "/api/discoveries",
        json={"name": "Place 6", "category": "Park",
              "lat": LUCKNOW_CENTER[0] + 0.012, "lng": LUCKNOW_CENTER[1],
              "fix_lat": LUCKNOW_CENTER[0] + 0.012, "fix_lng": LUCKNOW_CENTER[1],
              "accuracy_m": 10, "recorded_at": now_iso()},
        headers=headers,
    )
    assert r.status_code == 429


def test_visit_requires_proximity(client, disc):
    headers, _ = auth_headers(client, username="visitor", email="v@x.com")
    d = disc(name="Far Away Fort", lat=26.86, lng=80.94)
    # 2 km away — too far
    r = client.post(
        f"/api/discoveries/{d.id}/visit",
        json=good_fix(26.8467, 80.9462),
        headers=headers,
    )
    assert r.status_code == 422
    # standing on it
    r = client.post(
        f"/api/discoveries/{d.id}/visit",
        json=good_fix(d.lat, d.lng),
        headers=headers,
    )
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "verified"
    assert body["visit_count"] == 1
    assert body["xp_awarded"] == 15


def test_duplicate_visit_grants_no_xp(client, disc):
    headers, _ = auth_headers(client, username="visitor2", email="v2@x.com")
    d = disc()
    for _ in range(2):
        r = client.post(f"/api/discoveries/{d.id}/visit", json=good_fix(d.lat, d.lng), headers=headers)
    body = r.json()
    assert body["visit_count"] == 1
    assert body["xp_awarded"] == 0


def test_recommend_requires_visit_first(client, disc):
    headers, _ = auth_headers(client, username="rec1", email="r1@x.com")
    d = disc()
    r = client.post(f"/api/discoveries/{d.id}/recommend", headers=headers)
    assert r.status_code == 403


def test_recommend_flow_and_score(client, db, disc):
    h1, u1 = auth_headers(client, username="rec2", email="r2@x.com")
    h2, u2 = auth_headers(client, username="rec3", email="r3@x.com")
    d = disc()

    client.post(f"/api/discoveries/{d.id}/visit", json=good_fix(d.lat, d.lng), headers=h1)
    client.post(f"/api/discoveries/{d.id}/visit", json=good_fix(d.lat, d.lng), headers=h2)
    r1 = client.post(f"/api/discoveries/{d.id}/recommend", headers=h1)
    assert r1.status_code == 200
    assert r1.json()["xp_awarded"] == 20
    r2 = client.post(f"/api/discoveries/{d.id}/recommend", headers=h2)
    assert r2.status_code == 200

    # duplicate recommend → no extra XP
    r1b = client.post(f"/api/discoveries/{d.id}/recommend", headers=h1)
    assert r1b.json()["xp_awarded"] == 0

    detail = client.get(f"/api/discoveries/{d.id}", headers=h1).json()
    assert detail["visit_count"] == 2
    assert detail["recommendation_count"] == 2
    assert detail["score_pct"] == 100
    assert detail["recommended_by_me"] is True

    evs = db.query(XpEvent).filter(XpEvent.user_id == u1["id"], XpEvent.kind == "recommend").all()
    assert len(evs) == 1


def test_discovery_404(client, city):
    headers, _ = auth_headers(client, username="lost", email="l@x.com")
    r = client.get("/api/discoveries/9999", headers=headers)
    assert r.status_code == 404


def test_photo_upload_and_validation(client, disc, tmp_path):
    headers, _ = auth_headers(client, username="photo", email="p@x.com")
    d = disc()
    # non-image rejected
    r = client.post(
        f"/api/discoveries/{d.id}/photos",
        files={"file": ("x.txt", b"hello", "text/plain")},
        headers=headers,
    )
    assert r.status_code == 422
    # real image accepted
    png = bytes.fromhex(
        "89504e470d0a1a0a0000000d494844520000000100000001080600000"
        "01f15c4890000000d49444154789c6260000000060005"
        "27de49bb0000000049454e44ae426082"
    )
    r = client.post(
        f"/api/discoveries/{d.id}/photos",
        files={"file": ("x.png", png, "image/png")},
        headers=headers,
    )
    assert r.status_code == 200, r.text
    url = r.json()["url"]
    assert url.startswith("/uploads/")
    detail = client.get(f"/api/discoveries/{d.id}", headers=headers).json()
    assert url in detail["photos"]
