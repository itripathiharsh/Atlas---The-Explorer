from fastapi import APIRouter

from ..models import Report
from ..schemas import ReportIn
from .deps import DbDep, UserDep

router = APIRouter(prefix="/reports", tags=["reports"])


@router.post("", status_code=201)
def create_report(body: ReportIn, user: UserDep, db: DbDep):
    report = Report(
        reporter_id=user.id,
        target_type=body.target_type,
        target_id=body.target_id,
        reason=body.reason,
        details=body.details,
    )
    db.add(report)
    db.commit()
    return {"status": "received", "report_id": report.id}
