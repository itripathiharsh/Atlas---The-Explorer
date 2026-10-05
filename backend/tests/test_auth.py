import pytest

from conftest import auth_headers, register


def test_register_and_me(client):
    headers, user = auth_headers(client, username="explorer1", email="e1@x.com")
    assert user["username"] == "explorer1"
    assert user["level"] == 1 and user["xp"] == 0

    r = client.get("/api/me", headers=headers)
    assert r.status_code == 200
    assert r.json()["username"] == "explorer1"


def test_register_duplicate_rejected(client):
    register(client, username="dup", email="dup@x.com")
    r = client.post(
        "/api/auth/register",
        json={"username": "dup", "email": "other@x.com", "password": "hunter2hunter2"},
    )
    assert r.status_code == 409
    r = client.post(
        "/api/auth/register",
        json={"username": "other", "email": "dup@x.com", "password": "hunter2hunter2"},
    )
    assert r.status_code == 409


def test_register_invalid_username(client):
    r = client.post(
        "/api/auth/register",
        json={"username": "no spaces!", "email": "x@x.com", "password": "hunter2hunter2"},
    )
    assert r.status_code == 422


def test_register_short_password(client):
    r = client.post(
        "/api/auth/register",
        json={"username": "shorty", "email": "s@x.com", "password": "short"},
    )
    assert r.status_code == 422


def test_login_success_and_failure(client):
    register(client, username="logger", email="log@x.com", password="hunter2hunter2")

    ok = client.post(
        "/api/auth/login", json={"username_or_email": "logger", "password": "hunter2hunter2"}
    )
    assert ok.status_code == 200
    ok = client.post(
        "/api/auth/login", json={"username_or_email": "log@x.com", "password": "hunter2hunter2"}
    )
    assert ok.status_code == 200

    bad = client.post(
        "/api/auth/login", json={"username_or_email": "logger", "password": "wrong-password"}
    )
    assert bad.status_code == 401
    bad = client.post(
        "/api/auth/login", json={"username_or_email": "ghost", "password": "hunter2hunter2"}
    )
    assert bad.status_code == 401


def test_me_requires_token(client):
    assert client.get("/api/me").status_code == 401


def test_me_rejects_garbage_token(client):
    r = client.get("/api/me", headers={"Authorization": "Bearer not.a.token"})
    assert r.status_code == 401
