"""
VizardFree – AI Clip Engine
Detects high-engagement segments based on audio energy, speech
patterns, keyword salience, and transcript content.
Generates catchy Hindi/English titles & hooks.
"""

import re
import numpy as np
import librosa
from pathlib import Path
from typing import Optional
from loguru import logger


# ── Keyword sets for engagement detection ─────────────────────────────────
VIRAL_KEYWORDS_EN = [
    "secret", "never told", "shocking", "you won't believe", "actually",
    "important", "listen", "biggest mistake", "truth", "exposed", "hack",
    "mindset", "success", "failure", "change", "literally", "honestly",
    "game changer", "exactly", "seriously", "amazing", "incredible",
]
VIRAL_KEYWORDS_HI = [
    "sunlo", "dhyan se", "sach", "galti", "zaroori", "paise", "kamyabi",
    "raaz", "sach baat", "important", "must", "bilkul", "seedha",
    "asli", "yahan", "dekho", "suno", "seriously", "pakka",
]


def analyze_audio_energy(audio_path: str, sr: int = 16000) -> np.ndarray:
    """
    Load audio and compute RMS energy in 1-second windows.
    Returns array of (time, rms_energy) pairs.
    """
    y, sr = librosa.load(audio_path, sr=sr, mono=True)
    hop_length = sr  # 1-second windows
    rms = librosa.feature.rms(y=y, hop_length=hop_length)[0]
    times = librosa.times_like(rms, sr=sr, hop_length=hop_length)
    return np.column_stack([times, rms])


def score_segment(
    start: float,
    end: float,
    transcript_words: list[dict],
    energy_data: np.ndarray,
) -> float:
    """
    Score a segment 0-100 based on:
    - Audio energy (loudness / speech intensity)
    - Speech density (words per second)
    - Viral keyword presence
    - Duration suitability (ideal: 30-90 seconds)
    """
    duration = end - start
    score = 0.0

    # 1. Duration score (prefer 30-90s)
    if 30 <= duration <= 90:
        score += 20
    elif 15 <= duration <= 120:
        score += 10
    elif duration > 120:
        score -= 10

    # 2. Audio energy score
    mask = (energy_data[:, 0] >= start) & (energy_data[:, 0] <= end)
    if mask.any():
        seg_energy = energy_data[mask, 1]
        mean_energy = float(np.mean(seg_energy))
        peak_energy = float(np.max(seg_energy))
        energy_score = min(30, mean_energy * 500)  # normalize
        score += energy_score

    # 3. Word density
    seg_words = [w for w in transcript_words if w["start"] >= start and w["end"] <= end]
    if duration > 0 and seg_words:
        wps = len(seg_words) / duration
        if wps > 2.5:
            score += 15
        elif wps > 1.5:
            score += 8

    # 4. Viral keywords
    seg_text = " ".join(w["word"].lower() for w in seg_words)
    keyword_hits = 0
    for kw in VIRAL_KEYWORDS_EN + VIRAL_KEYWORDS_HI:
        if kw in seg_text:
            keyword_hits += 1
    score += min(25, keyword_hits * 5)

    # 5. Question sentences (usually high engagement)
    if "?" in seg_text or "kya" in seg_text or "why" in seg_text:
        score += 5

    return round(min(100, max(0, score)), 1)


def detect_viral_clips(
    transcript: dict,
    audio_path: str,
    min_duration: float = 20,
    max_duration: float = 120,
    num_clips: int = 12,
) -> list[dict]:
    """
    Detect the top viral clip segments from a video.

    Args:
        transcript: {"words": [...], "segments": [...]}
        audio_path: Path to audio file
        min_duration: Minimum clip length in seconds
        max_duration: Maximum clip length in seconds
        num_clips: How many clips to return

    Returns:
        List of clip dicts sorted by viral_score descending
    """
    words = transcript.get("words", [])
    segments = transcript.get("segments", [])

    if not segments:
        return []

    logger.info(f"Analyzing {len(segments)} segments for viral clips…")
    energy_data = analyze_audio_energy(audio_path)

    # Candidate windows using sentence boundaries
    candidates = []
    for i, seg_start in enumerate(segments):
        for j in range(i + 1, len(segments)):
            seg_end = segments[j]
            duration = seg_end["end"] - seg_start["start"]
            if duration < min_duration:
                continue
            if duration > max_duration:
                break
            candidates.append((seg_start["start"], seg_end["end"], duration))

    # Score all candidates
    scored = []
    for start, end, duration in candidates:
        s = score_segment(start, end, words, energy_data)
        if s > 30:  # minimum quality threshold
            scored.append({"start": start, "end": end, "duration": duration, "score": s})

    # Sort by score
    scored.sort(key=lambda x: x["score"], reverse=True)

    # Remove overlapping clips (greedy NMS)
    selected = []
    used_ranges = []
    for clip in scored:
        overlap = False
        for ur_start, ur_end in used_ranges:
            overlap_start = max(clip["start"], ur_start)
            overlap_end = min(clip["end"], ur_end)
            if overlap_end - overlap_start > 10:  # 10s overlap threshold
                overlap = True
                break
        if not overlap:
            selected.append(clip)
            used_ranges.append((clip["start"], clip["end"]))
        if len(selected) >= num_clips:
            break

    # Build clip dicts with titles
    result = []
    for idx, c in enumerate(selected):
        seg_words = [w for w in words if w["start"] >= c["start"] and w["end"] <= c["end"]]
        clip_text = " ".join(w["word"] for w in seg_words[:30]).strip()

        title_en, title_hi, hook = generate_clip_titles(clip_text, idx + 1)

        result.append({
            "rank": idx + 1,
            "start_time": round(c["start"], 2),
            "end_time": round(c["end"], 2),
            "duration": round(c["duration"], 2),
            "viral_score": c["score"],
            "suggested_title_en": title_en,
            "suggested_title_hi": title_hi,
            "hook": hook,
        })

    return result


def generate_clip_titles(clip_text: str, idx: int) -> tuple[str, str, str]:
    """
    Generate catchy English and Hindi titles for a clip.
    Uses simple rule-based generation (replace with LLM for better results).
    """
    text_lower = clip_text.lower()

    hooks_en = [
        "You NEED to hear this 🔥",
        "This changed everything…",
        "Nobody talks about this!",
        "Watch till the end 👀",
        "This is the TRUTH 💥",
        "I wish I knew this earlier",
        "This is going VIRAL 🚀",
        "Stop what you're doing…",
        "The SECRET nobody shares 🤫",
        "Real talk. No BS.",
        "This hit different 🎯",
        "Your life will change after this",
    ]
    hooks_hi = [
        "Yeh sun lo dhyan se 🔥",
        "Sach baat bol raha hoon 💯",
        "Yeh koi nahi batata!",
        "Antt tak dekho zaroor 👀",
        "Yeh toh sach hai bhai 💥",
        "Kash pehle pata hota",
        "Yeh clip viral ho rahi hai 🚀",
        "Ek minute ruko…",
        "Yeh raaz koi nahi jaanta 🤫",
        "Bina bakwaas ke seedhi baat",
        "Dil se baat kar raha hoon 🎯",
        "Zindagi badal jaayegi isse",
    ]

    en_templates = [
        f"Clip {idx}: Why This Matters",
        f"The Truth About This 💡",
        f"#{idx} Most Viral Moment",
        f"This Will Blow Your Mind",
        f"Key Insight #{idx}",
    ]
    hi_templates = [
        f"Clip {idx}: Kyun Hai Yeh Zaruri",
        f"Sach baat #{idx} 💡",
        f"#{idx} Sabse Viral Moment",
        f"Yeh Sun Ke Chaunk Jaoge",
        f"Key Insight #{idx}",
    ]

    hook_idx = (idx - 1) % len(hooks_en)
    t_idx = (idx - 1) % len(en_templates)

    return (
        en_templates[t_idx],
        hi_templates[t_idx],
        hooks_en[hook_idx],
    )
