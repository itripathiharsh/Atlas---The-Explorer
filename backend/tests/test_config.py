from conftest import auth_headers


def test_config_shape(client, city):
    headers, _ = auth_headers(client, username="cfg", email="cfg@x.com")
    r = client.get("/api/config", headers=headers)
    assert r.status_code == 200
    body = r.json()
    assert body["gps_dev_mode"] is False  # suite pins strict GPS mode
    assert body["max_accuracy_m"] == 50.0
    assert body["visit_radius_m"] == 150.0
    assert body["create_radius_m"] == 300.0


def test_config_requires_auth(client):
    assert client.get("/api/config").status_code == 401


def test_gps_dev_mode_relaxes_accuracy(client, city, monkeypatch):
    """Desktop demo mode: poor-accuracy fixes unlock cells and the config says so."""
    from datetime import datetime, timedelta, timezone

    from app import config as app_config

    monkeypatch.setenv("GPS_DEV_MODE", "true")
    app_config.get_settings.cache_clear()
    try:
        headers, _ = auth_headers(client, username="devgps", email="dg@x.com")
        now = datetime.now(timezone.utc)
        r = client.post(
            "/api/exploration/ping",
            json={"fixes": [{
                "lat": 26.8467, "lng": 80.9462, "accuracy_m": 800,
                "recorded_at": now.isoformat(),
            }]},
            headers=headers,
        )
        body = r.json()
        assert body["accepted"] == 1, body
        assert body["xp_awarded"] == 10

        cfg = client.get("/api/config", headers=headers).json()
        assert cfg["gps_dev_mode"] is True
        assert cfg["max_accuracy_m"] == 5000.0
    finally:
        monkeypatch.undo()
        app_config.get_settings.cache_clear()
