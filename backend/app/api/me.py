from fastapi import APIRouter
from sqlalchemy.orm import joinedload

from ..models import Achievement, UserAchievement
from ..schemas import StatsOut, UserAchievementOut, UserOut
from ..services.gamification import check_achievements, stats_payload
from .deps import DbDep, UserDep

router = APIRouter(prefix="/me", tags=["me"])


@router.get("", response_model=UserOut)
def me(user: UserDep):
    return user


@router.get("/stats", response_model=StatsOut)
def stats(user: UserDep, db: DbDep):
    return stats_payload(db, user)


@router.get("/achievements", response_model=list[UserAchievementOut])
def achievements(user: UserDep, db: DbDep):
    # evaluate before listing so the profile is always current
    check_achievements(db, user)
    db.commit()
    all_a = db.query(Achievement).all()
    earned = {
        ua.achievement_id: ua.earned_at
        for ua in db.query(UserAchievement)
        .options(joinedload(UserAchievement.achievement))
        .filter(UserAchievement.user_id == user.id)
    }
    out = []
    for a in all_a:
        out.append(
            UserAchievementOut(
                code=a.code,
                name=a.name,
                description=a.description,
                earned_at=earned.get(a.id),
            )
        )
    return out
