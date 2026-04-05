"""
VizardFree – Videos Router
Handles video upload (local file + YouTube URL), listing, detail, update, delete.
"""

import os
import uuid
import shutil
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from pydantic import BaseModel

from database import get_db
from models.video import Video
from config import get_settings
from workers.queue import get_queue

router = APIRouter(prefix="/api/videos", tags=["videos"])
settings = get_settings()


# ── Schemas ───────────────────────────────────────────────────────────────

class VideoUpdate(BaseModel):
    title: Optional[str] = None
    language: Optional[str] = None
    transcript: Optional[dict] = None
    subtitle_style: Optional[dict] = None
    brand_kit: Optional[dict] = None


class YouTubeImport(BaseModel):
    url: str
    language: Optional[str] = None


# ── Routes ────────────────────────────────────────────────────────────────

@router.get("")
async def list_videos(
    page: int = 1,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
):
    offset = (page - 1) * limit
    result = await db.execute(
        select(Video).order_by(desc(Video.created_at)).offset(offset).limit(limit)
    )
    videos = result.scalars().all()
    return {"videos": [v.to_dict() for v in videos], "page": page, "limit": limit}


@router.post("")
async def upload_video(
    file: UploadFile = File(...),
    title: str = Form(None),
    language: str = Form(None),
    db: AsyncSession = Depends(get_db),
):
    if file.size and file.size > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(413, "File too large (max 2GB)")

    video_id = str(uuid.uuid4())
    ext = Path(file.filename).suffix.lower() or ".mp4"
    dest_path = Path(settings.UPLOAD_DIR) / f"{video_id}{ext}"

    with open(dest_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    video = Video(
        id=video_id,
        title=title or Path(file.filename).stem,
        original_filename=file.filename,
        file_path=str(dest_path),
        language=language,
        status="pending",
    )
    db.add(video)
    await db.commit()

    # Enqueue processing job
    q = get_queue()
    q.enqueue("workers.tasks.task_process_video", video_id, job_timeout=3600)

    return video.to_dict()


@router.post("/import-youtube")
async def import_youtube(body: YouTubeImport, db: AsyncSession = Depends(get_db)):
    video_id = str(uuid.uuid4())
    video = Video(
        id=video_id,
        title="YouTube Import – Processing…",
        original_filename="youtube.mp4",
        file_path="",
        source_url=body.url,
        language=body.language,
        status="pending",
        progress=0,
    )
    db.add(video)
    await db.commit()

    q = get_queue()
    q.enqueue("workers.tasks.task_download_and_process_youtube", video_id, body.url, job_timeout=7200)

    return video.to_dict()


@router.get("/{video_id}")
async def get_video(video_id: str, db: AsyncSession = Depends(get_db)):
    video = await _get_video_or_404(video_id, db)
    return video.to_dict()


@router.patch("/{video_id}")
async def update_video(video_id: str, body: VideoUpdate, db: AsyncSession = Depends(get_db)):
    video = await _get_video_or_404(video_id, db)
    for field, val in body.model_dump(exclude_none=True).items():
        setattr(video, field, val)
    await db.commit()
    return video.to_dict()


@router.delete("/{video_id}")
async def delete_video(video_id: str, db: AsyncSession = Depends(get_db)):
    video = await _get_video_or_404(video_id, db)
    # Clean up files
    for path in [video.file_path, video.thumbnail_path]:
        if path and os.path.exists(path):
            try:
                os.unlink(path)
            except Exception:
                pass
    await db.delete(video)
    await db.commit()
    return {"deleted": True}


@router.get("/{video_id}/thumbnail")
async def get_thumbnail(video_id: str, db: AsyncSession = Depends(get_db)):
    video = await _get_video_or_404(video_id, db)
    if not video.thumbnail_path or not os.path.exists(video.thumbnail_path):
        raise HTTPException(404, "Thumbnail not found")
    return FileResponse(video.thumbnail_path, media_type="image/jpeg")


@router.get("/{video_id}/stream")
async def stream_video(video_id: str, db: AsyncSession = Depends(get_db)):
    video = await _get_video_or_404(video_id, db)
    if not os.path.exists(video.file_path):
        raise HTTPException(404, "Video file not found")
    return FileResponse(video.file_path, media_type="video/mp4")


# ── Helpers ───────────────────────────────────────────────────────────────

async def _get_video_or_404(video_id: str, db: AsyncSession) -> Video:
    result = await db.execute(select(Video).where(Video.id == video_id))
    video = result.scalar_one_or_none()
    if not video:
        raise HTTPException(404, f"Video {video_id} not found")
    return video
