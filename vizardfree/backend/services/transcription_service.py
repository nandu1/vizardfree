"""
VizardFree – Transcription Service
Uses faster-whisper (large-v3) for multi-language transcription.
Special support for Hinglish (Hindi + English mix).
"""

import os
import re
from pathlib import Path
from typing import Optional
from loguru import logger
from langdetect import detect
from config import get_settings

settings = get_settings()

# Lazy-loaded model (loaded once per worker process)
_whisper_model = None


def get_whisper_model():
    global _whisper_model
    if _whisper_model is None:
        from faster_whisper import WhisperModel
        device = settings.WHISPER_DEVICE
        if device == "auto":
            import torch
            device = "cuda" if torch.cuda.is_available() else "cpu"
        compute_type = "float16" if device == "cuda" else "int8"
        logger.info(f"Loading Whisper model: {settings.WHISPER_MODEL} on {device}")
        _whisper_model = WhisperModel(
            settings.WHISPER_MODEL,
            device=device,
            compute_type=compute_type,
            download_root=settings.MODELS_DIR,
        )
        logger.info("Whisper model loaded.")
    return _whisper_model


def detect_language(audio_path: str) -> str:
    """
    Detect audio language with special Hinglish detection.
    Returns ISO code: 'hi', 'en', 'hinglish', or other.
    """
    model = get_whisper_model()
    # Transcribe first 30 seconds for detection
    segments, info = model.transcribe(audio_path, beam_size=1, language=None, vad_filter=True)
    text_sample = " ".join([s.text for s in list(segments)[:10]])

    detected = info.language
    prob = info.language_probability

    # Check for Hinglish: if we have devanagari + latin characters mixed
    has_devanagari = bool(re.search(r'[\u0900-\u097F]', text_sample))
    has_latin = bool(re.search(r'[a-zA-Z]', text_sample))

    if detected == "hi" and has_latin and has_devanagari:
        return "hinglish"
    elif detected == "hi" and has_latin and not has_devanagari:
        return "hinglish"  # Roman Hindi (Hinglish written in Latin)
    else:
        return detected


def transcribe_audio(
    audio_path: str,
    language: Optional[str] = None,
    progress_callback=None,
) -> dict:
    """
    Transcribe audio file. Returns word-level timestamps.

    Args:
        audio_path: Path to audio file (WAV/MP3/MP4)
        language: Force language code, or None for auto-detect
        progress_callback: Optional callable(progress: int)

    Returns:
        {
          "language": str,
          "words": [{"word": str, "start": float, "end": float, "speaker": str|None}],
          "segments": [{"text": str, "start": float, "end": float}]
        }
    """
    model = get_whisper_model()
    logger.info(f"Starting transcription: {audio_path}, language={language}")

    # Determine language code
    whisper_lang = None
    if language == "hinglish":
        whisper_lang = "hi"  # Whisper processes as Hindi, we post-process
    elif language and language != "auto":
        whisper_lang = language

    # Transcribe with word timestamps
    segments_iter, info = model.transcribe(
        audio_path,
        language=whisper_lang,
        beam_size=5,
        word_timestamps=True,
        vad_filter=True,
        vad_parameters={"min_silence_duration_ms": 500},
    )

    segments = []
    words = []
    total_duration = info.duration or 1

    for i, seg in enumerate(segments_iter):
        seg_dict = {"text": seg.text.strip(), "start": seg.start, "end": seg.end}
        segments.append(seg_dict)

        if seg.words:
            for w in seg.words:
                words.append({
                    "word": w.word,
                    "start": round(w.start, 3),
                    "end": round(w.end, 3),
                    "speaker": None,  # diarization placeholder
                    "probability": round(w.probability, 3),
                })

        if progress_callback:
            pct = int(min((seg.end / total_duration) * 100, 99))
            progress_callback(pct)

    # Detect final language
    final_lang = language or info.language
    if final_lang == "hi":
        # Check if Hinglish
        all_text = " ".join(s["text"] for s in segments)
        if re.search(r'[a-zA-Z]', all_text) and re.search(r'[\u0900-\u097F]', all_text):
            final_lang = "hinglish"

    if progress_callback:
        progress_callback(100)

    return {
        "language": final_lang,
        "words": words,
        "segments": segments,
    }


def extract_audio_from_video(video_path: str, output_path: str) -> str:
    """Extract audio from video using FFmpeg."""
    import subprocess
    cmd = [
        "ffmpeg", "-y",
        "-i", video_path,
        "-vn",
        "-ar", "16000",
        "-ac", "1",
        "-c:a", "pcm_s16le",
        output_path,
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"FFmpeg audio extraction failed: {result.stderr}")
    return output_path
