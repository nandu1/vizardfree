"""
VizardFree – Clips Router
CRUD for clips, trigger export, get download URL.
"""

import os
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from pydantic import BaseModel

from database import get_db
from models.clip import Clip
from config import get_settings
from workers.queue import get_queue

router = APIRouter(prefix="/api/clips", tags=["clips"])
settings = get_settings()


class ClipCreate(BaseModel):
    video_id: str
    title: str
    start_time: float
    end_time: float
    aspect_ratio: str = "9:16"
    export_quality: str = "1080p"
    subtitle_style: Optional[dict] = None
    smart_framing: bool = True
    crop_params: Optional[dict] = None
    transcript: Optional[dict] = None


class ClipUpdate(BaseModel):
    title: Optional[str] = None
    start_time: Optional[float] = None
    end_time: Optional[float] = None
    aspect_ratio: Optional[str] = None
    export_quality: Optional[str] = None
    subtitle_style: Optional[dict] = None
    smart_framing: Optional[bool] = None
    crop_params: Optional[dict] = None
    transcript: Optional[dict] = None


@router.get("/video/{video_id}")
async def list_clips_for_video(video_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Clip)
        .where(Clip.video_id == video_id)
        .order_by(desc(Clip.viral_score))
    )
    clips = result.scalars().all()
    return {"clips": [c.to_dict() for c in clips]}


@router.post("")
async def create_clip(body: ClipCreate, db: AsyncSession = Depends(get_db)):
    clip = Clip(
        video_id=body.video_id,
        title=body.title,
        start_time=body.start_time,
        end_time=body.end_time,
        duration=body.end_time - body.start_time,
        aspect_ratio=body.aspect_ratio,
        export_quality=body.export_quality,
        subtitle_style=body.subtitle_style,
        smart_framing=body.smart_framing,
        crop_params=body.crop_params,
        transcript=body.transcript,
        status="pending",
    )
    db.add(clip)
    await db.commit()
    return clip.to_dict()


@router.get("/{clip_id}")
async def get_clip(clip_id: str, db: AsyncSession = Depends(get_db)):
    clip = await _get_clip_or_404(clip_id, db)
    return clip.to_dict()


@router.patch("/{clip_id}")
async def update_clip(clip_id: str, body: ClipUpdate, db: AsyncSession = Depends(get_db)):
    clip = await _get_clip_or_404(clip_id, db)
    for field, val in body.model_dump(exclude_none=True).items():
        setattr(clip, field, val)
    if body.start_time is not None or body.end_time is not None:
        clip.duration = clip.end_time - clip.start_time
    clip.status = "pending"  # reset for re-export
    await db.commit()
    return clip.to_dict()


@router.delete("/{clip_id}")
async def delete_clip(clip_id: str, db: AsyncSession = Depends(get_db)):
    clip = await _get_clip_or_404(clip_id, db)
    if clip.output_path and os.path.exists(clip.output_path):
        try:
            os.unlink(clip.output_path)
        except Exception:
            pass
    await db.delete(clip)
    await db.commit()
    return {"deleted": True}


@router.post("/{clip_id}/export")
async def export_clip(clip_id: str, db: AsyncSession = Depends(get_db)):
    clip = await _get_clip_or_404(clip_id, db)
    clip.status = "rendering"
    clip.progress = 0
    await db.commit()

    q = get_queue("high")
    q.enqueue("workers.tasks.task_export_clip", clip_id, job_timeout=1800)
    return {"queued": True, "clip_id": clip_id}


@router.get("/{clip_id}/download")
async def download_clip(clip_id: str, db: AsyncSession = Depends(get_db)):
    clip = await _get_clip_or_404(clip_id, db)
    if clip.status != "ready" or not clip.output_path:
        raise HTTPException(400, "Clip not ready for download")
    if not os.path.exists(clip.output_path):
        raise HTTPException(404, "Output file not found")
    filename = f"{clip.title.replace(' ', '_')}.mp4"
    return FileResponse(
        clip.output_path,
        media_type="video/mp4",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


async def _get_clip_or_404(clip_id: str, db: AsyncSession) -> Clip:
    result = await db.execute(select(Clip).where(Clip.id == clip_id))
    clip = result.scalar_one_or_none()
    if not clip:
        raise HTTPException(404, f"Clip {clip_id} not found")
    return clip
