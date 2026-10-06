from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class RegisterIn(BaseModel):
    username: str = Field(min_length=3, max_length=20, pattern=r"^[a-zA-Z0-9_]+$")
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class LoginIn(BaseModel):
    username_or_email: str = Field(min_length=3, max_length=255)
    password: str = Field(min_length=1, max_length=128)


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    email: str
    avatar_url: str | None = None
    level: int
    xp: int
    is_admin: bool
    created_at: datetime


class AuthOut(BaseModel):
    token: str
    user: UserOut


# --- exploration ---


class FixIn(BaseModel):
    lat: float = Field(ge=-90, le=90)
    lng: float = Field(ge=-180, le=180)
    accuracy_m: float = Field(gt=0, le=100_000)
    recorded_at: datetime


class PingIn(BaseModel):
    fixes: list[FixIn] = Field(min_length=1, max_length=20)


class RejectedFixOut(BaseModel):
    lat: float
    lng: float
    reasons: list[str]


class UnlockedCellOut(BaseModel):
    h3: str
    boundary: list[list[float]]


class AchievementOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    code: str
    name: str
    description: str


class PingOut(BaseModel):
    accepted: int
    rejected: list[RejectedFixOut]
    unlocked: list[UnlockedCellOut]
    xp_awarded: int
    xp: int
    level: int
    level_up: bool
    new_achievements: list[AchievementOut]


# --- map / stats ---


class CityPctOut(BaseModel):
    name: str
    display_name: str
    pct: float
    center_lat: float | None = None
    center_lng: float | None = None


class MapSummaryOut(BaseModel):
    cities: list[CityPctOut]
    world_pct: float
    current_city: CityPctOut | None = None


class StatsOut(BaseModel):
    level: int
    xp: int
    next_level_xp: int
    cells_unlocked: int
    cities_explored: int
    discoveries_visited: int
    recommendations_made: int
    discoveries_created: int
    per_city: list[CityPctOut]
    world_pct: float


class UserAchievementOut(BaseModel):
    code: str
    name: str
    description: str
    earned_at: datetime | None = None


# --- discoveries ---


class DiscoveryIn(BaseModel):
    name: str = Field(min_length=3, max_length=120)
    category: str = Field(min_length=3, max_length=40)
    description: str = Field(default="", max_length=2000)
    # pinned discovery position (may be up to create_radius_m from the player)
    lat: float = Field(ge=-90, le=90)
    lng: float = Field(ge=-180, le=180)
    # the player's own GPS fix proving presence
    fix_lat: float = Field(ge=-90, le=90)
    fix_lng: float = Field(ge=-180, le=180)
    accuracy_m: float = Field(gt=0)
    recorded_at: datetime


class DiscoveryOut(BaseModel):
    id: int
    name: str
    category: str
    description: str
    lat: float
    lng: float
    distance_m: float | None = None
    visit_count: int = 0
    recommendation_count: int = 0
    score_pct: int | None = None
    visited_by_me: bool = False
    recommended_by_me: bool = False
    created_by_me: bool = False
    photos: list[str] = []


class WorldPinOut(BaseModel):
    id: int
    name: str
    category: str
    lat: float
    lng: float
    recommendation_count: int


class DiscoveryDetailOut(DiscoveryOut):
    pass


class VisitIn(BaseModel):
    lat: float = Field(ge=-90, le=90)
    lng: float = Field(ge=-180, le=180)
    accuracy_m: float = Field(gt=0)
    recorded_at: datetime


class VisitOut(BaseModel):
    status: str
    visit_count: int
    xp_awarded: int


class RecommendOut(BaseModel):
    status: str
    recommendation_count: int
    score_pct: int
    xp_awarded: int


# --- reports ---


class ReportIn(BaseModel):
    target_type: str = Field(pattern="^(discovery|photo|recommendation|user)$")
    target_id: int = Field(gt=0)
    reason: str = Field(min_length=3, max_length=60)
    details: str = Field(default="", max_length=2000)
