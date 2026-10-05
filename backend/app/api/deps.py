from typing import Annotated

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import User
from ..services.security import decode_token

bearer = HTTPBearer(auto_error=False)
DbDep = Annotated[Session, Depends(get_db)]


def get_current_user(
    creds: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)],
    db: DbDep,
) -> User:
    if creds is None:
        raise HTTPException(401, "Missing bearer token")
    user_id = decode_token(creds.credentials)
    if user_id is None:
        raise HTTPException(401, "Invalid or expired token")
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(401, "Unknown user")
    if user.is_banned:
        raise HTTPException(403, "Account suspended")
    return user


UserDep = Annotated[User, Depends(get_current_user)]


def get_current_admin(user: UserDep) -> User:
    if not user.is_admin:
        raise HTTPException(403, "Admin access required")
    return user


AdminDep = Annotated[User, Depends(get_current_admin)]
