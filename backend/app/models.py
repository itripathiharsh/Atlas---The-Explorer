from datetime import datetime, timezone

from sqlalchemy import (
    BigInteger,
    Boolean,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Index,
    Integer,
    SmallInteger,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    username: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    level: Mapped[int] = mapped_column(Integer, default=1)
    xp: Mapped[int] = mapped_column(Integer, default=0)
    privacy: Mapped[dict] = mapped_column(JSON, default=dict)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False)
    is_banned: Mapped[bool] = mapped_column(Boolean, default=False)
    # last accepted fix — used for speed-plausibility checks
    last_lat: Mapped[float | None] = mapped_column(Float, nullable=True)
    last_lng: Mapped[float | None] = mapped_column(Float, nullable=True)
    last_fix_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class City(Base):
    __tablename__ = "cities"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(80), unique=True)
    display_name: Mapped[str] = mapped_column(String(120))
    boundary: Mapped[list] = mapped_column(JSON)  # GeoJSON ring [[lng, lat], …]
    center_lat: Mapped[float] = mapped_column(Float)
    center_lng: Mapped[float] = mapped_column(Float)
    total_cells: Mapped[int] = mapped_column(Integer, default=0)


class Cell(Base):
    __tablename__ = "cells"

    h3_index: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    resolution: Mapped[int] = mapped_column(SmallInteger)
    center_lat: Mapped[float] = mapped_column(Float)
    center_lng: Mapped[float] = mapped_column(Float)
    boundary: Mapped[list] = mapped_column(JSON)  # GeoJSON ring [[lng, lat], …]
    city_id: Mapped[int | None] = mapped_column(ForeignKey("cities.id"), nullable=True)

    __table_args__ = (
        Index("ix_cells_center", "center_lat", "center_lng"),
        Index("ix_cells_city", "city_id"),
    )


class UserCell(Base):
    __tablename__ = "user_cells"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    h3_index: Mapped[int] = mapped_column(ForeignKey("cells.h3_index"))
    first_explored_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    verification: Mapped[dict] = mapped_column(JSON, default=dict)

    __table_args__ = (UniqueConstraint("user_id", "h3_index", name="uq_user_cell"),)


class Discovery(Base):
    __tablename__ = "discoveries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    description: Mapped[str] = mapped_column(Text, default="")
    category: Mapped[str] = mapped_column(String(40))
    lat: Mapped[float] = mapped_column(Float)
    lng: Mapped[float] = mapped_column(Float)
    h3_index: Mapped[int] = mapped_column(BigInteger, index=True)
    city_id: Mapped[int | None] = mapped_column(ForeignKey("cities.id"), nullable=True)
    created_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    source: Mapped[str] = mapped_column(Enum("seed", "user", name="discovery_source"), default="seed")
    status: Mapped[str] = mapped_column(
        Enum("active", "hidden", "removed", name="discovery_status"), default="active"
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    __table_args__ = (Index("ix_discovery_latlng", "lat", "lng"),)


class Visit(Base):
    __tablename__ = "visits"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    discovery_id: Mapped[int] = mapped_column(ForeignKey("discoveries.id"), index=True)
    visited_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    lat: Mapped[float] = mapped_column(Float)
    lng: Mapped[float] = mapped_column(Float)
    accuracy_m: Mapped[float] = mapped_column(Float)
    verification: Mapped[str] = mapped_column(
        Enum("verified", "rejected", name="visit_verification"), default="verified"
    )

    __table_args__ = (UniqueConstraint("user_id", "discovery_id", name="uq_visit"),)


class Recommendation(Base):
    __tablename__ = "recommendations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    discovery_id: Mapped[int] = mapped_column(ForeignKey("discoveries.id"), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    status: Mapped[str] = mapped_column(Enum("active", "removed", name="rec_status"), default="active")

    __table_args__ = (UniqueConstraint("user_id", "discovery_id", name="uq_recommendation"),)


class Photo(Base):
    __tablename__ = "photos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    discovery_id: Mapped[int] = mapped_column(ForeignKey("discoveries.id"), index=True)
    url: Mapped[str] = mapped_column(String(500))
    moderation: Mapped[str] = mapped_column(
        Enum("pending", "approved", "rejected", name="photo_moderation"), default="approved"
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class Achievement(Base):
    __tablename__ = "achievements"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    code: Mapped[str] = mapped_column(String(60), unique=True)
    name: Mapped[str] = mapped_column(String(120))
    description: Mapped[str] = mapped_column(String(300))
    criteria: Mapped[dict] = mapped_column(JSON)  # {"metric": "cells_unlocked", "value": 10}


class UserAchievement(Base):
    __tablename__ = "user_achievements"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    achievement_id: Mapped[int] = mapped_column(ForeignKey("achievements.id"))
    earned_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    __table_args__ = (UniqueConstraint("user_id", "achievement_id", name="uq_user_achievement"),)


class XpEvent(Base):
    __tablename__ = "xp_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    kind: Mapped[str] = mapped_column(String(40))
    amount: Mapped[int] = mapped_column(Integer)
    ref_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    reporter_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    target_type: Mapped[str] = mapped_column(
        Enum("discovery", "photo", "recommendation", "user", name="report_target"),
    )
    target_id: Mapped[int] = mapped_column(Integer, index=True)
    reason: Mapped[str] = mapped_column(String(60))
    details: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(Enum("open", "resolved", name="report_status"), default="open")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
