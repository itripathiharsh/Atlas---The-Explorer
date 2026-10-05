import os
from pathlib import Path

import pytest

# Test database must be configured before app modules import settings.
ROOT = Path(__file__).resolve().parents[2]
os.environ.setdefault("DATABASE_URL", "postgresql+psycopg://explorer:explorer@localhost:5433/worldgame_test")
os.environ.setdefault("PING_MIN_INTERVAL_S", "0")
# tests always run in strict-GPS mode regardless of the developer's .env
os.environ["GPS_DEV_MODE"] = "false"

from sqlalchemy import create_engine, text  # noqa: E402
from sqlalchemy.exc import OperationalError  # noqa: E402

from app.db import Base  # noqa: E402
from app.main import app  # noqa: E402
from app.seed.base import seed_achievements, seed_city_cells, seed_cities  # noqa: E402
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
        exists = conn.execute(
            text("SELECT 1 FROM pg_database WHERE datname = 'worldgame_test'")
        ).scalar()
        if not exists:
            conn.execute(text("CREATE DATABASE worldgame_test"))
        else:
            conn.execute(text("DROP DATABASE worldgame_test WITH (FORCE)"))
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


@pytest.fixture()
def city(db):
    """Lucknow with its res-8 cells polyfilled + achievements seeded."""
    lucknow = next(c for c in seed_cities(db) if c.name == "lucknow")
    seed_city_cells(db, lucknow)
    seed_achievements(db)
    return lucknow


def auth_headers(client, **kwargs):
    data = register(client, **kwargs)
    return {"Authorization": f"Bearer {data['token']}"}, data["user"]
