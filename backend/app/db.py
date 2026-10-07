import os
import sys
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from .config import get_settings

if sys.platform == "win32":
    tools_pg = Path(__file__).resolve().parents[2] / "tools" / "pg" / "bin"
    if tools_pg.exists():
        pg_bin = str(tools_pg)
        if pg_bin not in os.environ.get("PATH", ""):
            os.environ["PATH"] = pg_bin + os.pathsep + os.environ.get("PATH", "")
        if hasattr(os, "add_dll_directory"):
            try:
                os.add_dll_directory(pg_bin)
            except OSError:
                pass
    if "PSYCOPG_IMPL" not in os.environ:
        os.environ["PSYCOPG_IMPL"] = "python"

_db_url = get_settings().database_url
if _db_url.startswith("postgresql://"):
    _db_url = _db_url.replace("postgresql://", "postgresql+psycopg://", 1)

engine = create_engine(_db_url, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
