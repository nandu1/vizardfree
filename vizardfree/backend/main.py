"""
VizardFree – FastAPI Main Application
Open-source Vizard.ai clone for Hindi/Hinglish Indian creators.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from pathlib import Path

from config import get_settings
from database import init_db
from routers import videos, clips, batch, chapters, music

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    settings.ensure_dirs()
    yield


app = FastAPI(
    title="VizardFree API",
    version="1.0.0",
    description="Open-source Vizard.ai clone for Indian creators. No watermark. Fully self-hosted.",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(videos.router)
app.include_router(clips.router)
app.include_router(batch.router)
app.include_router(chapters.router)
app.include_router(music.router)

for static_dir, mount_path in [
    (settings.UPLOAD_DIR, "/uploads"),
    (settings.OUTPUT_DIR, "/outputs"),
]:
    Path(static_dir).mkdir(parents=True, exist_ok=True)
    app.mount(mount_path, StaticFiles(directory=static_dir), name=mount_path.lstrip("/"))


@app.get("/health", tags=["meta"])
async def health():
    return {"status": "ok", "version": settings.APP_VERSION}


@app.get("/api/subtitle-presets", tags=["subtitles"])
async def get_subtitle_presets():
    from services.subtitle_renderer import SUBTITLE_PRESETS
    return {"presets": SUBTITLE_PRESETS}


@app.post("/api/smart-crop-preview", tags=["framing"])
async def smart_crop_preview(video_id: str, aspect_ratio: str = "9:16"):
    from database import AsyncSessionLocal
    from models.video import Video
    from sqlalchemy import select
    from services.smart_framing import compute_smart_crop
    from fastapi import HTTPException
    import asyncio

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Video).where(Video.id == video_id))
        video = result.scalar_one_or_none()
        if not video:
            raise HTTPException(404, "Video not found")
        if not video.file_path or not Path(video.file_path).exists():
            raise HTTPException(400, "Video file not available")
        file_path = video.file_path

    loop = asyncio.get_event_loop()
    crop = await loop.run_in_executor(None, compute_smart_crop, file_path, aspect_ratio)
    return crop
