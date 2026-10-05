from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from ..models import Discovery, Report, User
from .deps import AdminDep, DbDep

router = APIRouter(prefix="/admin", tags=["admin"])


class StatusIn(BaseModel):
    status: str = Field(pattern="^(active|hidden|removed)$")


class BanIn(BaseModel):
    banned: bool


@router.get("/reports")
def report_queue(admin: AdminDep, db: DbDep):
    return [
        {
            "id": r.id,
            "target_type": r.target_type,
            "target_id": r.target_id,
            "reason": r.reason,
            "details": r.details,
            "status": r.status,
            "reporter_id": r.reporter_id,
            "created_at": r.created_at.isoformat(),
        }
        for r in db.query(Report).order_by(Report.created_at.desc()).limit(200)
    ]


@router.post("/reports/{report_id}/resolve")
def resolve_report(report_id: int, admin: AdminDep, db: DbDep):
    r = db.get(Report, report_id)
    if r is None:
        raise HTTPException(404, "Report not found")
    r.status = "resolved"
    db.commit()
    return {"status": "resolved"}


@router.post("/discoveries/{discovery_id}/status")
def set_discovery_status(discovery_id: int, body: StatusIn, admin: AdminDep, db: DbDep):
    d = db.get(Discovery, discovery_id)
    if d is None:
        raise HTTPException(404, "Discovery not found")
    d.status = body.status
    db.commit()
    return {"id": d.id, "status": d.status}


@router.post("/users/{user_id}/ban")
def ban_user(user_id: int, body: BanIn, admin: AdminDep, db: DbDep):
    u = db.get(User, user_id)
    if u is None:
        raise HTTPException(404, "User not found")
    if u.id == admin.id:
        raise HTTPException(422, "You cannot ban yourself")
    u.is_banned = body.banned
    db.commit()
    return {"id": u.id, "is_banned": u.is_banned}


@router.get("/overview")
def overview(admin: AdminDep, db: DbDep):
    from sqlalchemy import func

    return {
        "users": db.query(func.count(User.id)).scalar(),
        "discoveries": db.query(func.count(Discovery.id)).scalar(),
        "open_reports": db.query(func.count(Report.id)).filter(Report.status == "open").scalar(),
    }
