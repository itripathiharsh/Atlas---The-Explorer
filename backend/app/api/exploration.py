import time
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException
from sqlalchemy import select

from ..config import get_settings, level_for_xp
from ..models import UserCell
from ..schemas import (
    AchievementOut,
    PingIn,
    PingOut,
    RejectedFixOut,
    UnlockedCellOut,
)
from ..services.gamification import award_xp, check_achievements
from ..services.geo import fix_issues, get_or_create_cell, latlng_to_h3_int
from .deps import DbDep, UserDep

router = APIRouter(prefix="/exploration", tags=["exploration"])

_last_ping: dict[int, float] = {}


@router.post("/ping", response_model=PingOut)
def ping(body: PingIn, user: UserDep, db: DbDep):
    s = get_settings()
    now_ts = time.time()
    if now_ts - _last_ping.get(user.id, 0.0) < s.ping_min_interval_s:
        raise HTTPException(429, "Pinging too fast — slow down, explorer")
    _last_ping[user.id] = now_ts

    now = datetime.now(timezone.utc)
    fixes = sorted(body.fixes, key=lambda f: f.recorded_at)

    # keep user's fastest accepted fix bookkeeping coherent
    last_lat, last_lng, last_fix_at = user.last_lat, user.last_lng, user.last_fix_at
    level_before = user.level
    unlocked: list[UnlockedCellOut] = []
    rejected: list[RejectedFixOut] = []
    xp_awarded = 0
    accepted = 0

    for fix in fixes:
        reasons = fix_issues(
            fix.lat, fix.lng, fix.accuracy_m, fix.recorded_at, now,
            last_lat, last_lng, last_fix_at,
        )
        if reasons:
            rejected.append(RejectedFixOut(lat=fix.lat, lng=fix.lng, reasons=reasons))
            continue

        accepted += 1
        h3_int, _ = latlng_to_h3_int(fix.lat, fix.lng)
        already = db.scalar(
            select(UserCell).where(UserCell.user_id == user.id, UserCell.h3_index == h3_int)
        )
        if already is None:
            cell = get_or_create_cell(db, fix.lat, fix.lng)
            db.add(
                UserCell(
                    user_id=user.id,
                    h3_index=cell.h3_index,
                    verification={
                        "accuracy_m": fix.accuracy_m,
                        "recorded_at": fix.recorded_at.isoformat(),
                    },
                )
            )
            award_xp(db, user, "cell_unlock", s.xp_unlock, ref_id=cell.h3_index)
            xp_awarded += s.xp_unlock
            unlocked.append(UnlockedCellOut(h3=cell_str(cell.h3_index), boundary=cell.boundary))
        # every accepted fix advances the plausibility trail
        last_lat, last_lng, last_fix_at = fix.lat, fix.lng, fix.recorded_at

    user.last_lat, user.last_lng, user.last_fix_at = last_lat, last_lng, last_fix_at
    db.commit()
    db.refresh(user)
    new_achievements = check_achievements(db, user)
    db.commit()

    return PingOut(
        accepted=accepted,
        rejected=rejected,
        unlocked=unlocked,
        xp_awarded=xp_awarded,
        xp=user.xp,
        level=user.level,
        level_up=user.level > level_before,
        new_achievements=[AchievementOut.model_validate(a) for a in new_achievements],
    )


def cell_str(h3_int: int) -> str:
    import h3

    return h3.int_to_str(h3_int)
