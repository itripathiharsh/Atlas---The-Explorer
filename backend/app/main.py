from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .api import admin, auth, discoveries, exploration, me, map as map_api, reports
from .config import get_settings

settings = get_settings()

app = FastAPI(title="World Game API", version="0.1.0")

origins = ["http://localhost:5173", "https://localhost:5173"]
allow_origin_regex = None
if settings.cors_allow_lan:
    allow_origin_regex = r"https?://(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?"

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=allow_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(me.router, prefix="/api")
app.include_router(map_api.router, prefix="/api")
app.include_router(exploration.router, prefix="/api")
app.include_router(discoveries.router, prefix="/api")
app.include_router(reports.router, prefix="/api")
app.include_router(admin.router, prefix="/api")

uploads_dir = settings.uploads_dir
uploads_dir.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")


@app.get("/health")
def health():
    return {"status": "ok", "time": datetime.now(timezone.utc).isoformat()}
