"""
VizardFree – Background Music Suggestion Service
Recommends royalty-free tracks based on video mood/language.
Music files are placeholders – users can replace with their own.
"""

from typing import Optional

# Royalty-free track database (placeholder entries)
# In production: link to actual audio files in /data/music/
MUSIC_LIBRARY = [
    {
        "id": "upbeat_hindi_1",
        "title": "Desi Beats",
        "mood": "energetic",
        "language_hint": "hi",
        "bpm": 128,
        "duration": 180,
        "file": "desi_beats.mp3",
        "tags": ["bollywood", "upbeat", "hindi", "dance"],
    },
    {
        "id": "chill_lofi_1",
        "title": "Study Lofi",
        "mood": "calm",
        "language_hint": "en",
        "bpm": 75,
        "duration": 240,
        "file": "study_lofi.mp3",
        "tags": ["lofi", "chill", "focus", "background"],
    },
    {
        "id": "motivational_1",
        "title": "Rise Up",
        "mood": "motivational",
        "language_hint": "en",
        "bpm": 100,
        "duration": 150,
        "file": "rise_up.mp3",
        "tags": ["motivational", "podcast", "talk"],
    },
    {
        "id": "hindi_classical_1",
        "title": "Sitar Vibes",
        "mood": "calm",
        "language_hint": "hi",
        "bpm": 60,
        "duration": 200,
        "file": "sitar_vibes.mp3",
        "tags": ["classical", "sitar", "indian", "ambient"],
    },
    {
        "id": "reels_hype_1",
        "title": "Viral Hype",
        "mood": "energetic",
        "language_hint": "hinglish",
        "bpm": 140,
        "duration": 60,
        "file": "viral_hype.mp3",
        "tags": ["reels", "viral", "hype", "shorts"],
    },
    {
        "id": "emotional_1",
        "title": "Dil Ki Baat",
        "mood": "emotional",
        "language_hint": "hi",
        "bpm": 70,
        "duration": 180,
        "file": "dil_ki_baat.mp3",
        "tags": ["emotional", "hindi", "story", "sentimental"],
    },
]


def suggest_music(
    language: Optional[str] = None,
    mood: Optional[str] = None,
    content_type: Optional[str] = "reels",
    max_results: int = 4,
) -> list[dict]:
    """
    Suggest background music tracks based on video characteristics.
    
    Args:
        language: 'hi', 'en', 'hinglish', etc.
        mood: 'energetic', 'calm', 'motivational', 'emotional'
        content_type: 'reels', 'youtube', 'podcast'
        max_results: Number of suggestions
    
    Returns:
        List of track suggestions
    """
    scored = []

    for track in MUSIC_LIBRARY:
        score = 0

        # Language match
        if language and track["language_hint"] == language:
            score += 40
        elif language and language == "hinglish" and track["language_hint"] in ("hi", "hinglish"):
            score += 30

        # Mood match
        if mood and track["mood"] == mood:
            score += 30

        # Content type hints
        if content_type == "reels" and "reels" in track["tags"]:
            score += 20
        if content_type == "reels" and track["bpm"] >= 100:
            score += 10
        if content_type == "podcast" and track["mood"] == "calm":
            score += 20
        if content_type == "youtube" and 75 <= track["bpm"] <= 120:
            score += 10

        scored.append({**track, "_score": score})

    scored.sort(key=lambda x: x["_score"], reverse=True)

    return [
        {k: v for k, v in t.items() if k != "_score"}
        for t in scored[:max_results]
    ]
