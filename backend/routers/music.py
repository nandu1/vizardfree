"""
VizardFree – Music Suggestions Router
"""

from fastapi import APIRouter
from typing import Optional
from services.music_service import suggest_music

router = APIRouter(prefix="/api/music", tags=["music"])


@router.get("/suggestions")
async def get_music_suggestions(
    language: Optional[str] = None,
    mood: Optional[str] = None,
    content_type: Optional[str] = "reels",
):
    tracks = suggest_music(language=language, mood=mood, content_type=content_type)
    return {"tracks": tracks}
