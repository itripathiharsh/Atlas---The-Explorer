import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, File, HTTPException, Query, UploadFile
from sqlalchemy import func

from ..config import get_settings
from ..models import Discovery, Photo, Recommendation, Visit
from ..schemas import (
    DiscoveryDetailOut,
    DiscoveryIn,
    DiscoveryOut,
    RecommendOut,
    VisitIn,
    VisitOut,
    WorldPinOut,
)
from ..services.gamification import award_xp, check_achievements
from ..services.geo import fix_issues, get_or_create_cell, haversine_m
from .deps import DbDep, UserDep

router = APIRouter(prefix="/discoveries", tags=["discoveries"])

DAILY_CREATE_LIMIT = 5


def _counts_for(db, discovery_ids: list[int], user_id: int):
    visits = dict(
        db.query(Visit.discovery_id, func.count(Visit.id))
        .filter(Visit.discovery_id.in_(discovery_ids), Visit.verification == "verified")
        .group_by(Visit.discovery_id)
        .all()
    ) if discovery_ids else {}
    recs = dict(
        db.query(Recommendation.discovery_id, func.count(Recommendation.id))
        .filter(Recommendation.discovery_id.in_(discovery_ids), Recommendation.status == "active")
        .group_by(Recommendation.discovery_id)
        .all()
    ) if discovery_ids else {}
    mine_v = set(
        v for (v,) in db.query(Visit.discovery_id).filter(
            Visit.user_id == user_id, Visit.verification == "verified",
            Visit.discovery_id.in_(discovery_ids),
        )
    ) if discovery_ids else set()
    mine_r = set(
        r for (r,) in db.query(Recommendation.discovery_id).filter(
            Recommendation.user_id == user_id, Recommendation.status == "active",
            Recommendation.discovery_id.in_(discovery_ids),
        )
    ) if discovery_ids else set()
    return visits, recs, mine_v, mine_r


def _to_out(db, d: Discovery, user_id: int, distance_m: float | None = None) -> DiscoveryOut:
    visits, recs, mine_v, mine_r = _counts_for(db, [d.id], user_id)
    vc, rc = visits.get(d.id, 0), recs.get(d.id, 0)
    return DiscoveryOut(
        id=d.id,
        name=d.name,
        category=d.category,
        description=d.description,
        lat=d.lat,
        lng=d.lng,
        distance_m=round(distance_m) if distance_m is not None else None,
        visit_count=vc,
        recommendation_count=rc,
        score_pct=round(rc / vc * 100) if vc > 0 else None,
        visited_by_me=d.id in mine_v,
        recommended_by_me=d.id in mine_r,
        created_by_me=d.created_by == user_id,
        photos=[p.url for p in db.query(Photo).filter(Photo.discovery_id == d.id, Photo.moderation != "rejected")],
    )


def _validated_fix(user, lat, lng, accuracy_m, recorded_at) -> tuple[float, float]:
    """Validate a single client fix for visit/create actions."""
    s = get_settings()
    now = datetime.now(timezone.utc)
    reasons = fix_issues(lat, lng, accuracy_m, recorded_at, now, user.last_lat, user.last_lng, user.last_fix_at)
    if reasons:
        code = 422 if "accuracy" in reasons else 400
        raise HTTPException(code, f"Location fix rejected: {', '.join(reasons)}")
    return lat, lng


@router.get("/nearby", response_model=list[DiscoveryOut])
def nearby(
    user: UserDep,
    db: DbDep,
    lat: float = Query(ge=-90, le=90),
    lng: float = Query(ge=-180, le=180),
    radius_m: float = Query(default=25000, gt=0, le=50_000),
):
    query_radius = max(radius_m, 20_000)
    lat_deg = query_radius / 111_320
    lng_deg = query_radius / (111_320 * max(0.1, __import__("math").cos(__import__("math").radians(lat))))
    candidates = (
        db.query(Discovery)
        .filter(
            Discovery.status == "active",
            Discovery.lat >= lat - lat_deg,
            Discovery.lat <= lat + lat_deg,
            Discovery.lng >= lng - lng_deg,
            Discovery.lng <= lng + lng_deg,
        )
        .all()
    )

    # If the area is sparse or new, dynamically discover notable encyclopedic places around this coordinate
    if len(candidates) < 5:
        try:
            from ..services.places import fetch_and_populate_global_discoveries
            fetch_and_populate_global_discoveries(db, lat, lng, radius_m=query_radius, user_id=user.id)
            candidates = (
                db.query(Discovery)
                .filter(
                    Discovery.status == "active",
                    Discovery.lat >= lat - lat_deg,
                    Discovery.lat <= lat + lat_deg,
                    Discovery.lng >= lng - lng_deg,
                    Discovery.lng <= lng + lng_deg,
                )
                .all()
            )
        except Exception:
            pass

    # If still sparse, also check if coordinates belong to an existing mapped city
    if len(candidates) < 5:
        try:
            from ..services.places import resolve_or_create_city
            city = resolve_or_create_city(db, lat, lng)
            if city:
                city_candidates = (
                    db.query(Discovery)
                    .filter(Discovery.status == "active", Discovery.city_id == city.id)
                    .all()
                )
                existing_ids = {c.id for c in candidates}
                for c in city_candidates:
                    if c.id not in existing_ids:
                        candidates.append(c)
        except Exception:
            pass

    scored = sorted(
        ((haversine_m(lat, lng, d.lat, d.lng), d) for d in candidates),
        key=lambda t: t[0],
    )
    max_return_dist = max(radius_m, 35_000)
    return [
        _to_out(db, d, user.id, distance_m=dist)
        for dist, d in scored
        if dist <= max_return_dist
    ][:50]


@router.get("/all", response_model=list[WorldPinOut])
def all_pins(user: UserDep, db: DbDep):
    """Thin pin layer for the whole world map (single aggregated query)."""
    visits = dict(
        db.query(Visit.discovery_id, func.count(Visit.id))
        .filter(Visit.verification == "verified")
        .group_by(Visit.discovery_id)
        .all()
    )
    rows = (
        db.query(
            Discovery.id,
            Discovery.name,
            Discovery.category,
            Discovery.lat,
            Discovery.lng,
        )
        .filter(Discovery.status == "active")
        .all()
    )
    recs = dict(
        db.query(Recommendation.discovery_id, func.count(Recommendation.id))
        .filter(Recommendation.status == "active")
        .group_by(Recommendation.discovery_id)
        .all()
    )
    return [
        WorldPinOut(
            id=id,
            name=name,
            category=category,
            lat=lat,
            lng=lng,
            recommendation_count=recs.get(id, 0),
        )
        for id, name, category, lat, lng in rows
    ]


@router.get("/{discovery_id}", response_model=DiscoveryDetailOut)
def detail(discovery_id: int, user: UserDep, db: DbDep):
    d = db.get(Discovery, discovery_id)
    if d is None or d.status == "removed":
        raise HTTPException(404, "Discovery not found")
    return _to_out(db, d, user.id)


@router.post("", response_model=DiscoveryDetailOut, status_code=201)
def create(body: DiscoveryIn, user: UserDep, db: DbDep):
    s = get_settings()
    lat, lng = _validated_fix(user, body.fix_lat, body.fix_lng, body.accuracy_m, body.recorded_at)

    recent = (
        db.query(func.count(Discovery.id))
        .filter(
            Discovery.created_by == user.id,
            Discovery.created_at >= datetime.now(timezone.utc) - timedelta(hours=24),
        )
        .scalar()
    )
    if recent >= DAILY_CREATE_LIMIT:
        raise HTTPException(429, "Daily discovery limit reached — come back tomorrow")

    dist = haversine_m(lat, lng, body.lat, body.lng)
    if dist > s.create_radius_m:
        raise HTTPException(422, f"Discovery must be within {int(s.create_radius_m)} m of you")

    cell = get_or_create_cell(db, body.lat, body.lng)
    d = Discovery(
        name=body.name.strip(),
        description=body.description.strip(),
        category=body.category.strip(),
        lat=body.lat,
        lng=body.lng,
        h3_index=cell.h3_index,
        city_id=cell.city_id,
        created_by=user.id,
        source="user",
    )
    db.add(d)
    db.flush()
    award_xp(db, user, "discovery_create", s.xp_discover, ref_id=d.id)
    user.last_lat, user.last_lng, user.last_fix_at = lat, lng, body.recorded_at
    db.commit()
    db.refresh(user)
    check_achievements(db, user)
    db.commit()
    out = _to_out(db, d, user.id)
    db.refresh(d)
    return out


@router.post("/{discovery_id}/visit", response_model=VisitOut)
def visit(discovery_id: int, body: VisitIn, user: UserDep, db: DbDep):
    s = get_settings()
    d = db.get(Discovery, discovery_id)
    if d is None or d.status != "active":
        raise HTTPException(404, "Discovery not found")

    lat, lng = _validated_fix(user, body.lat, body.lng, body.accuracy_m, body.recorded_at)
    dist = haversine_m(lat, lng, d.lat, d.lng)
    if dist > s.visit_radius_m:
        raise HTTPException(
            422,
            f"Too far from the discovery ({int(dist)} m — you need to be within {int(s.visit_radius_m)} m)",
        )

    existing = (
        db.query(Visit)
        .filter(Visit.user_id == user.id, Visit.discovery_id == d.id)
        .first()
    )
    xp_awarded = 0
    if existing is None:
        db.add(
            Visit(
                user_id=user.id,
                discovery_id=d.id,
                lat=lat,
                lng=lng,
                accuracy_m=body.accuracy_m,
                verification="verified",
            )
        )
        award_xp(db, user, "discovery_visit", s.xp_visit, ref_id=d.id)
        xp_awarded = s.xp_visit
        user.last_lat, user.last_lng, user.last_fix_at = lat, lng, body.recorded_at
        db.commit()
        db.refresh(user)
        check_achievements(db, user)
        db.commit()
    vc = (
        db.query(func.count(Visit.id))
        .filter(Visit.discovery_id == d.id, Visit.verification == "verified")
        .scalar()
    )
    return VisitOut(status="verified", visit_count=vc, xp_awarded=xp_awarded)


@router.post("/{discovery_id}/recommend", response_model=RecommendOut)
def recommend(discovery_id: int, user: UserDep, db: DbDep):
    s = get_settings()
    d = db.get(Discovery, discovery_id)
    if d is None or d.status != "active":
        raise HTTPException(404, "Discovery not found")

    visited = (
        db.query(Visit)
        .filter(Visit.user_id == user.id, Visit.discovery_id == d.id, Visit.verification == "verified")
        .first()
    )
    if visited is None:
        raise HTTPException(403, "Visit a place before recommending it")

    existing = (
        db.query(Recommendation)
        .filter(Recommendation.user_id == user.id, Recommendation.discovery_id == d.id)
        .first()
    )
    xp_awarded = 0
    if existing is None:
        db.add(Recommendation(user_id=user.id, discovery_id=d.id))
        award_xp(db, user, "recommend", s.xp_recommend, ref_id=d.id)
        xp_awarded = s.xp_recommend
        db.commit()
        check_achievements(db, user)
        db.commit()
    elif existing.status == "removed":
        existing.status = "active"
        db.commit()

    vc = (
        db.query(func.count(Visit.id))
        .filter(Visit.discovery_id == d.id, Visit.verification == "verified")
        .scalar()
    )
    rc = (
        db.query(func.count(Recommendation.id))
        .filter(Recommendation.discovery_id == d.id, Recommendation.status == "active")
        .scalar()
    )
    return RecommendOut(
        status="active",
        recommendation_count=rc,
        score_pct=round(rc / vc * 100) if vc > 0 else 0,
        xp_awarded=xp_awarded,
    )


@router.post("/{discovery_id}/photos")
def upload_photo(
    discovery_id: int,
    user: UserDep,
    db: DbDep,
    file: UploadFile = File(...),
):
    s = get_settings()
    d = db.get(Discovery, discovery_id)
    if d is None or d.status != "active":
        raise HTTPException(404, "Discovery not found")

    if file.content_type is None or not file.content_type.startswith("image/"):
        raise HTTPException(422, "Only image uploads are allowed")

    data = file.file.read(s.max_photo_mb * 1024 * 1024 + 1)
    if len(data) > s.max_photo_mb * 1024 * 1024:
        raise HTTPException(413, f"Image larger than {s.max_photo_mb} MB")
    if len(data) == 0:
        raise HTTPException(422, "Empty file")

    ext = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
        "image/heic": ".heic",
    }.get(file.content_type, ".jpg")
    name = f"{uuid.uuid4().hex}{ext}"
    s.uploads_dir.mkdir(parents=True, exist_ok=True)
    (s.uploads_dir / name).write_bytes(data)

    photo = Photo(user_id=user.id, discovery_id=d.id, url=f"/uploads/{name}")
    db.add(photo)
    db.commit()
    return {"url": photo.url}
