"""XP awards, level curve, and achievement checks."""

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..config import level_for_xp, xp_for_next_level
from ..models import (
    Achievement,
    Cell,
    City,
    Discovery,
    Recommendation,
    User,
    UserAchievement,
    UserCell,
    Visit,
    XpEvent,
)


def award_xp(db: Session, user: User, kind: str, amount: int, ref_id: int | None = None) -> XpEvent:
    user.xp += amount
    user.level = level_for_xp(user.xp)
    ev = XpEvent(user_id=user.id, kind=kind, amount=amount, ref_id=ref_id)
    db.add(ev)
    return ev


def city_percent(db: Session, user_id: int, city: City) -> float:
    if city.total_cells == 0:
        return 0.0
    unlocked = (
        db.query(func.count(UserCell.id))
        .join(Cell, Cell.h3_index == UserCell.h3_index)
        .filter(UserCell.user_id == user_id, Cell.city_id == city.id)
        .scalar()
    )
    return round((unlocked or 0) / city.total_cells * 100, 2)


def user_metrics(db: Session, user: User) -> dict:
    """Counters the achievement system (and stats) are built on."""
    cities = db.query(City).all()
    per_city = {c.name: city_percent(db, user.id, c) for c in cities}
    cells_unlocked = (
        db.query(func.count(UserCell.id)).filter(UserCell.user_id == user.id).scalar() or 0
    )
    discoveries_visited = (
        db.query(func.count(func.distinct(Visit.discovery_id)))
        .filter(Visit.user_id == user.id, Visit.verification == "verified")
        .scalar()
        or 0
    )
    # lesser-known = community has recommended it (small threshold for MVP scale)
    gems_visited = (
        db.query(func.count(func.distinct(Visit.discovery_id)))
        .join(Discovery, Discovery.id == Visit.discovery_id)
        .join(Recommendation, (Recommendation.discovery_id == Discovery.id) & (Recommendation.status == "active"))
        .filter(Visit.user_id == user.id, Visit.verification == "verified")
        .scalar()
        or 0
    )
    recommendations_made = (
        db.query(func.count(Recommendation.id))
        .filter(Recommendation.user_id == user.id, Recommendation.status == "active")
        .scalar()
        or 0
    )
    discoveries_created = (
        db.query(func.count(Discovery.id))
        .filter(Discovery.created_by == user.id)
        .scalar()
        or 0
    )
    return {
        "cells_unlocked": cells_unlocked,
        "city_pct": max(per_city.values(), default=0.0),
        "discoveries_visited": discoveries_visited,
        "gems_visited": gems_visited,
        "recommendations_made": recommendations_made,
        "discoveries_created": discoveries_created,
    }


def check_achievements(db: Session, user: User) -> list[Achievement]:
    metrics = user_metrics(db, user)
    earned_ids = {
        ua.achievement_id
        for ua in db.query(UserAchievement).filter(UserAchievement.user_id == user.id)
    }
    newly: list[Achievement] = []
    for a in db.query(Achievement).all():
        if a.id in earned_ids:
            continue
        c = a.criteria
        if metrics.get(c["metric"], 0) >= c["value"]:
            db.add(UserAchievement(user_id=user.id, achievement_id=a.id))
            newly.append(a)
    return newly


def stats_payload(db: Session, user: User) -> dict:
    m = user_metrics(db, user)
    cities = db.query(City).all()
    return {
        "level": user.level,
        "xp": user.xp,
        "next_level_xp": xp_for_next_level(user.xp),
        "cells_unlocked": m["cells_unlocked"],
        "cities_explored": sum(1 for c in cities if city_percent(db, user.id, c) > 0),
        "discoveries_visited": m["discoveries_visited"],
        "recommendations_made": m["recommendations_made"],
        "discoveries_created": m["discoveries_created"],
        "per_city": [
            {"name": c.name, "display_name": c.display_name, "pct": city_percent(db, user.id, c)}
            for c in cities
        ],
        "world_pct": round(m["cells_unlocked"] / 202_000_000 * 100, 4),
    }
