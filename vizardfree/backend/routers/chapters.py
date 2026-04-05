"""
VizardFree – Chapter Suggestions Router
Generates chapter timestamps + Hindi/English titles from transcript.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from database import get_db
from models.video import Video

router = APIRouter(prefix="/api/chapters", tags=["chapters"])


@router.get("/{video_id}")
async def suggest_chapters(video_id: str, db: AsyncSession = Depends(get_db)):
    """
    Auto-suggest chapter timestamps and titles from the video transcript.
    Returns chapters with English and Hindi titles.
    """
    result = await db.execute(select(Video).where(Video.id == video_id))
    video = result.scalar_one_or_none()
    if not video:
        raise HTTPException(404, "Video not found")
    if not video.transcript:
        raise HTTPException(400, "Transcript not available yet")

    chapters = _generate_chapters(video.transcript, video.duration or 0)
    return {"chapters": chapters, "video_id": video_id}


def _generate_chapters(transcript: dict, total_duration: float) -> list[dict]:
    """
    Simple chapter generation based on long pauses + sentence boundaries.
    Groups content into ~3-7 chapters.
    """
    segments = transcript.get("segments", [])
    words = transcript.get("words", [])

    if not segments:
        return []

    # Find natural break points (long pauses > 2 seconds)
    chapters = []
    chapter_start = 0.0
    chapter_words: list[str] = []

    PAUSE_THRESHOLD = 2.5  # seconds
    MIN_CHAPTER_DURATION = 30.0
    MAX_CHAPTERS = 7

    for i, seg in enumerate(segments):
        chapter_words.extend(seg["text"].split())

        next_seg = segments[i + 1] if i + 1 < len(segments) else None
        pause = (next_seg["start"] - seg["end"]) if next_seg else 999

        chapter_dur = seg["end"] - chapter_start
        is_natural_break = (pause > PAUSE_THRESHOLD and chapter_dur >= MIN_CHAPTER_DURATION)
        is_last = (next_seg is None)

        if is_natural_break or is_last:
            # Generate title from first few words
            sample = " ".join(chapter_words[:12]).strip()
            title_en = _title_from_text_en(sample, len(chapters) + 1)
            title_hi = _title_from_text_hi(sample, len(chapters) + 1)

            chapters.append({
                "index": len(chapters) + 1,
                "start_time": round(chapter_start, 2),
                "end_time": round(seg["end"], 2),
                "title_en": title_en,
                "title_hi": title_hi,
                "youtube_timestamp": _fmt_yt_timestamp(chapter_start),
            })

            chapter_start = next_seg["start"] if next_seg else seg["end"]
            chapter_words = []

            if len(chapters) >= MAX_CHAPTERS:
                break

    return chapters


def _title_from_text_en(text: str, idx: int) -> str:
    templates = [
        "Introduction",
        "Key Points",
        "Main Discussion",
        "Deep Dive",
        "Summary & Takeaways",
        "Q&A / Extras",
        "Conclusion",
    ]
    # Use first few meaningful words
    words = [w for w in text.split()[:5] if len(w) > 3]
    if words:
        return " ".join(words[:4]).title()
    return templates[min(idx - 1, len(templates) - 1)]


def _title_from_text_hi(text: str, idx: int) -> str:
    templates = [
        "परिचय",
        "मुख्य बातें",
        "विस्तृत चर्चा",
        "गहरी जानकारी",
        "निष्कर्ष",
        "प्रश्नोत्तर",
        "समापन",
    ]
    return templates[min(idx - 1, len(templates) - 1)]


def _fmt_yt_timestamp(seconds: float) -> str:
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    if h > 0:
        return f"{h}:{m:02d}:{s:02d}"
    return f"{m}:{s:02d}"
