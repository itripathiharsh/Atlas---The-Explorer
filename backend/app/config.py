from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

ROOT = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=ROOT / ".env", extra="ignore")

    database_url: str = "postgresql+psycopg://explorer:explorer@localhost:5433/worldgame"
    jwt_secret: str = "dev-secret-change-me"
    jwt_exp_days: int = 30
    cors_allow_lan: bool = True

    h3_resolution: int = 8

    uploads_dir: Path = ROOT / "data" / "uploads"
    max_photo_mb: int = 6

    # verification (PLAN.md §6)
    max_accuracy_m: float = 50.0
    max_fix_age_s: int = 300
    max_speed_kmh: float = 160.0
    ping_min_interval_s: float = 4.0
    visit_radius_m: float = 150.0
    create_radius_m: float = 300.0

    # XP values (PLAN.md D9)
    xp_unlock: int = 10
    xp_visit: int = 15
    xp_discover: int = 25
    xp_recommend: int = 20
    xp_city_milestone: int = 200

    # world % denominator: Earth land area / average res-8 cell area (~0.737 km²)
    world_total_cells: int = 202_000_000


@lru_cache
def get_settings() -> Settings:
    return Settings()


def level_for_xp(xp: int) -> int:
    """Level n reached at cumulative XP 50·n·(n−1): L2@100, L3@300, L4@600 …"""
    lvl = 1
    while 50 * (lvl + 1) * lvl <= xp:
        lvl += 1
    return lvl


def xp_for_next_level(xp: int) -> int:
    lvl = level_for_xp(xp)
    return 50 * (lvl + 1) * lvl
