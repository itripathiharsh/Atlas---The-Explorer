from fastapi import APIRouter, HTTPException
from sqlalchemy import or_, select

from ..db import get_db
from ..models import User
from ..schemas import AuthOut, LoginIn, RegisterIn, UserOut
from ..services.security import create_token, hash_password, verify_password
from .deps import DbDep

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=AuthOut)
def register(body: RegisterIn, db: DbDep):
    existing = db.scalar(
        select(User).where(or_(User.username == body.username, User.email == body.email))
    )
    if existing is not None:
        raise HTTPException(409, "Username or email already taken")
    user = User(
        username=body.username,
        email=body.email,
        password_hash=hash_password(body.password),
        privacy={"profile": "public"},
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return AuthOut(token=create_token(user.id), user=UserOut.model_validate(user))


@router.post("/login", response_model=AuthOut)
def login(body: LoginIn, db: DbDep):
    user = db.scalar(
        select(User).where(or_(User.username == body.username_or_email, User.email == body.username_or_email))
    )
    if user is None or not verify_password(body.password, user.password_hash):
        raise HTTPException(401, "Invalid credentials")
    if user.is_banned:
        raise HTTPException(403, "Account suspended")
    return AuthOut(token=create_token(user.id), user=UserOut.model_validate(user))
