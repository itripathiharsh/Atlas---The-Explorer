from datetime import datetime, timedelta, timezone

import pytest

from app.models import City, User, UserCell, XpEvent
from app.seed.base import seed_cities
from app.config import level_for_xp
from conftest import auth_headers, register  # noqa: F401 — city fixture comes from conftest

LUCKNOW_CENTER = (26.8467, 80.9462)


def now_iso(offset_s=0):
    return (datetime.now(timezone.utc) + timedelta(seconds=offset_s)).isoformat()


def ping(client, headers, fixes):
    return client.post("/api/exploration/ping", json={"fixes": fixes}, headers=headers)


def make_fix(lat, lng, accuracy=10.0, offset_s=0):
    return {"lat": lat, "lng": lng, "accuracy_m": accuracy, "recorded_at": now_iso(offset_s)}


def test_ping_unlocks_cell_and_awards_xp(client, db, city):
    headers, user = auth_headers(client)
    r = ping(client, headers, [make_fix(*LUCKNOW_CENTER)])
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["accepted"] == 1
    assert len(body["unlocked"]) == 1
    assert body["xp_awarded"] == 10
    assert body["xp"] == 10
    assert body["level_up"] is False
    codes = [a["code"] for a in body["new_achievements"]]
    assert "first_steps" in codes

    db_cell = db.query(UserCell).filter(UserCell.user_id == user["id"]).one()
    assert db_cell.h3_index > 0


def test_duplicate_unlock_grants_no_xp(client, city):
    headers, user = auth_headers(client)
    fix = make_fix(*LUCKNOW_CENTER)
    first = ping(client, headers, [fix])
    assert first.json()["xp_awarded"] == 10
    second = ping(client, headers, [fix])
    body = second.json()
    assert body["accepted"] == 1
    assert body["unlocked"] == []
    assert body["xp_awarded"] == 0
    assert body["xp"] == 10


def test_accuracy_rejection(client, city):
    headers, _ = auth_headers(client)
    r = ping(client, headers, [make_fix(*LUCKNOW_CENTER, accuracy=200)])
    body = r.json()
    assert body["accepted"] == 0
    assert body["rejected"][0]["reasons"] == ["accuracy"]
    assert body["xp"] == 0


def test_stale_fix_rejection(client, city):
    headers, _ = auth_headers(client)
    r = ping(client, headers, [make_fix(*LUCKNOW_CENTER, offset_s=-3600)])
    body = r.json()
    assert body["accepted"] == 0
    assert "stale" in body["rejected"][0]["reasons"]


def test_impossible_speed_rejection(client, city):
    headers, _ = auth_headers(client)
    # Delhi, ~440 km from Lucknow, 60 s after the first accepted fix
    delhi = (28.6139, 77.2090)
    ok = ping(client, headers, [make_fix(*LUCKNOW_CENTER, offset_s=-120)])
    assert ok.json()["accepted"] == 1
    r = ping(client, headers, [make_fix(*delhi, offset_s=-60)])
    body = r.json()
    assert body["accepted"] == 0
    assert "speed" in body["rejected"][0]["reasons"]


def test_invalid_coordinates_rejected_422(client):
    headers, _ = auth_headers(client)
    r = ping(client, headers, [{"lat": 999, "lng": 80.9, "accuracy_m": 10, "recorded_at": now_iso()}])
    assert r.status_code == 422


def test_ping_requires_auth(client):
    r = client.post("/api/exploration/ping", json={"fixes": [make_fix(*LUCKNOW_CENTER)]})
    assert r.status_code == 401


def test_level_curve_and_level_up(client, city):
    # pure function sanity
    assert level_for_xp(0) == 1
    assert level_for_xp(99) == 1
    assert level_for_xp(100) == 2
    assert level_for_xp(300) == 3

    headers, _ = auth_headers(client)
    lat, lng = LUCKNOW_CENTER
    # two distinct points ~1.6 km apart (safely different res-8 cells)
    fixes = [
        make_fix(lat, lng, offset_s=0),
        make_fix(lat + 0.012, lng + 0.009, offset_s=0),
    ]
    r = ping(client, headers, fixes)
    assert r.json()["xp_awarded"] == 20
    # nine more points, each ~1.5 km further NE
    fixes2 = [
        make_fix(lat + 0.024 + 0.012 * i, lng + 0.018 + 0.009 * i, offset_s=0)
        for i in range(9)
    ]
    r2 = ping(client, headers, fixes2)
    body = r2.json()
    assert body["xp"] == 110
    assert body["level"] == 2
    assert body["level_up"] is True


def test_map_explored_returns_unlocked_hexes(client, city):
    headers, _ = auth_headers(client)
    ping(client, headers, [make_fix(*LUCKNOW_CENTER)])
    r = client.get("/api/map/explored", headers=headers)
    assert r.status_code == 200
    fc = r.json()
    assert fc["type"] == "FeatureCollection"
    assert len(fc["features"]) == 1
    ring = fc["features"][0]["geometry"]["coordinates"][0]
    assert ring[0] == ring[-1]  # closed ring


def test_map_summary_percent(client, city, db):
    headers, _ = auth_headers(client)
    city.total_cells = 100
    db.commit()
    ping(client, headers, [make_fix(*LUCKNOW_CENTER)])
    r = client.get("/api/map/summary", headers=headers)
    body = r.json()
    luck = [c for c in body["cities"] if c["name"] == "lucknow"][0]
    assert luck["pct"] == 1.0
    assert body["world_pct"] < 0.001


def test_stats_endpoint(client, city):
    headers, _ = auth_headers(client)
    ping(client, headers, [make_fix(*LUCKNOW_CENTER)])
    r = client.get("/api/me/stats", headers=headers)
    body = r.json()
    assert body["cells_unlocked"] == 1
    assert body["xp"] == 10
    assert body["next_level_xp"] == 100
    assert body["cities_explored"] == 1


def test_xp_events_audit_trail(client, db, city):
    headers, user = auth_headers(client)
    ping(client, headers, [make_fix(*LUCKNOW_CENTER)])
    events = db.query(XpEvent).filter(XpEvent.user_id == user["id"]).all()
    assert len(events) == 1
    assert events[0].kind == "cell_unlock"
    assert events[0].amount == 10
