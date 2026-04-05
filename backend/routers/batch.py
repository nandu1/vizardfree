"""
VizardFree – Batch Processing Router
Export multiple clips in one request with shared settings.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional

from database import get_db
from models.clip import Clip
from workers.queue import get_queue

router = APIRouter(prefix="/api/batch", tags=["batch"])


class BatchExportRequest(BaseModel):
    clip_ids: list[str]
    aspect_ratio: Optional[str] = "9:16"
    export_quality: Optional[str] = "1080p"
    subtitle_style: Optional[dict] = None
    smart_framing: bool = True


@router.post("/export")
async def batch_export(body: BatchExportRequest, db: AsyncSession = Depends(get_db)):
    """
    Queue multiple clips for export simultaneously.
    All clips get the same aspect ratio / quality / subtitle settings.
    """
    if len(body.clip_ids) > 20:
        raise HTTPException(400, "Max 20 clips per batch")

    q = get_queue("default")
    results = []

    for clip_id in body.clip_ids:
        result = await db.execute(select(Clip).where(Clip.id == clip_id))
        clip = result.scalar_one_or_none()
        if not clip:
            results.append({"clip_id": clip_id, "queued": False, "error": "Not found"})
            continue

        # Update settings
        clip.aspect_ratio = body.aspect_ratio or clip.aspect_ratio
        clip.export_quality = body.export_quality or clip.export_quality
        if body.subtitle_style:
            clip.subtitle_style = body.subtitle_style
        clip.smart_framing = body.smart_framing
        clip.status = "rendering"
        clip.progress = 0

        q.enqueue("workers.tasks.task_export_clip", clip_id, job_timeout=1800)
        results.append({"clip_id": clip_id, "queued": True})

    await db.commit()
    return {"results": results, "total": len(results)}


@router.get("/status")
async def batch_status(clip_ids: str, db: AsyncSession = Depends(get_db)):
    """
    Check status of multiple clips at once.
    clip_ids: comma-separated list of clip IDs
    """
    ids = [cid.strip() for cid in clip_ids.split(",") if cid.strip()]
    result = await db.execute(select(Clip).where(Clip.id.in_(ids)))
    clips = result.scalars().all()

    return {
        "clips": [
            {
                "id": c.id,
                "status": c.status,
                "progress": c.progress,
                "output_path": c.output_path,
            }
            for c in clips
        ]
    }
