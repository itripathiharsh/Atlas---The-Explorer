from fastapi import APIRouter

from ..schemas import UserOut
from .deps import UserDep

router = APIRouter(prefix="/me", tags=["me"])


@router.get("", response_model=UserOut)
def me(user: UserDep):
    return user
