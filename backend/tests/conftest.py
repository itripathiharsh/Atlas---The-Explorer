import os
from pathlib import Path

import pytest

# Test database must be configured before app modules import settings.
ROOT = Path(__file__).resolve().parents[2]
os.environ.setdefault("DATABASE_URL", "postgresql+psycopg://explorer:explorer@localhost:5433/worldgame_test")

from sqlalchemy import create_engine, text  # noqa: E402
from sqlalchemy.exc import OperationalError  # noqa: E402

from app.db import Base  # noqa: E402
from app.main import app  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

ADMIN_DB = "postgresql+psycopg://explorer:explorer@localhost:5433/postgres"
TEST_DB_URL = os.environ["DATABASE_URL"]


@pytest.fixture(scope="session", autouse=True)
def test_database():
    admin = create_engine(ADMIN_DB, isolation_level="AUTOCOMMIT")
    try:
        admin.connect()
    except OperationalError as e:
        pytest.exit(
            f"\nPostgreSQL is not reachable — run scripts\\setup_db.ps1 first.\n{e}",
            returncode=1,
        )
    with admin.connect() as conn:
        conn.execute(text("CREATE DATABASE worldgame_test"))
    admin.dispose()

    engine = create_engine(TEST_DB_URL)
    Base.metadata.create_all(engine)
    yield engine
    engine.dispose()
    admin = create_engine(ADMIN_DB, isolation_level="AUTOCOMMIT")
    with admin.connect() as conn:
        conn.execute(text("DROP DATABASE worldgame_test WITH (FORCE)"))
    admin.dispose()


@pytest.fixture()
def db(test_database):
    """Clean session: every table emptied before the test starts."""
    from app.db import SessionLocal

    session = SessionLocal()
    for table in reversed(Base.metadata.sorted_tables):
        session.execute(table.delete())
    session.commit()
    yield session
    session.rollback()
    session.close()


@pytest.fixture()
def client(db):
    def override_get_db():
        yield db

    app.dependency_overrides["app.db.get_db"] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


def register(client, username="harsh", email="harsh@example.com", password="hunter2hunter2"):
    r = client.post(
        "/api/auth/register",
        json={"username": username, "email": email, "password": password},
    )
    assert r.status_code == 200, r.text
    return r.json()


def auth_headers(client, **kwargs):
    data = register(client, **kwargs)
    return {"Authorization": f"Bearer {data['token']}"}, data["user"]
