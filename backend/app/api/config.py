from fastapi import APIRouter

from ..config import eff_max_accuracy_m, get_settings
from .deps import UserDep

router = APIRouter(prefix="/config", tags=["config"])


@router.get("")
def config(user: UserDep):
    s = get_settings()
    return {
        "gps_dev_mode": s.gps_dev_mode,
        "max_accuracy_m": eff_max_accuracy_m(),
        "visit_radius_m": s.visit_radius_m,
        "create_radius_m": s.create_radius_m,
    }
