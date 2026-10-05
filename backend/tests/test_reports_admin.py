from conftest import auth_headers, register


def test_report_submission(client, city):
    headers, _ = auth_headers(client, username="reporter", email="rep@x.com")
    r = client.post(
        "/api/reports",
        json={"target_type": "discovery", "target_id": 1, "reason": "unsafe_location",
              "details": "This is inside a restricted area"},
        headers=headers,
    )
    assert r.status_code == 201
    assert r.json()["status"] == "received"


def test_report_requires_auth(client):
    r = client.post(
        "/api/reports",
        json={"target_type": "discovery", "target_id": 1, "reason": "spam"},
    )
    assert r.status_code == 401


def test_admin_endpoints_gated(client, city):
    headers, _ = auth_headers(client, username="pleb", email="pl@x.com")
    assert client.get("/api/admin/reports", headers=headers).status_code == 403
    assert client.get("/api/admin/overview", headers=headers).status_code == 403


def test_admin_flow(client, db, city):
    h_reg, user = auth_headers(client, username="regular", email="reg@x.com")
    headers, admin = auth_headers(client, username="chief", email="chief@x.com")
    # make admin via DB
    from app.models import User

    u = db.query(User).filter(User.id == admin["id"]).one()
    u.is_admin = True
    db.commit()

    r = client.get("/api/admin/overview", headers=headers)
    assert r.status_code == 200
    assert r.json()["users"] >= 2

    # ban the regular user, then their existing token stops working
    r = client.post(f"/api/admin/users/{user['id']}/ban", json={"banned": True}, headers=headers)
    assert r.status_code == 200
    other = client.get("/api/me", headers=h_reg)
    assert other.status_code == 403
