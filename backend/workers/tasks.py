"""
VizardFree – Background Workers (RQ Tasks)
All heavy processing tasks run here, out of the request lifecycle.
"""

import os
import tempfile
from pathlib import Path
from loguru import logger
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from config import get_settings

settings = get_settings()

# Synchronous engine for worker processes
_engine = create_engine(
    settings.DATABASE_URL.replace("+aiosqlite", ""),
    connect_args={"check_same_thread": False},
)
SessionLocal = sessionmaker(bind=_engine, autoflush=False, autocommit=False)


def _get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ── Task: Process uploaded video ─────────────────────────────────────────────
def task_process_video(video_id: str):
    """
    Full video processing pipeline:
    1. Extract metadata
    2. Generate thumbnail
    3. Extract audio
    4. Transcribe
    5. Detect viral clips
    """
    from models.video import Video
    from services.video_processing import get_video_info, download_youtube
    from services.transcription_service import transcribe_audio, extract_audio_from_video
    from services.clip_engine import detect_viral_clips
    from services.subtitle_renderer import create_thumbnail

    db = SessionLocal()
    try:
        video: Video = db.query(Video).filter(Video.id == video_id).first()
        if not video:
            logger.error(f"Video not found: {video_id}")
            return

        def update_progress(pct: int, status: str | None = None):
            video.progress = pct
            if status:
                video.status = status
            db.commit()

        update_progress(5, "processing")

        # 1. Get video info
        info = get_video_info(video.file_path)
        video.width = info["width"]
        video.height = info["height"]
        video.duration = info["duration"]
        video.fps = info["fps"]
        video.file_size = info["file_size"]
        video.codec = info["codec"]
        db.commit()

        # 2. Thumbnail
        thumb_path = str(Path(settings.UPLOAD_DIR) / f"{video_id}_thumb.jpg")
        create_thumbnail(video.file_path, thumb_path, time=min(3.0, info["duration"] * 0.1))
        video.thumbnail_path = thumb_path
        db.commit()
        update_progress(20)

        # 3. Extract audio
        audio_path = str(Path(settings.UPLOAD_DIR) / f"{video_id}.wav")
        extract_audio_from_video(video.file_path, audio_path)
        update_progress(35, "transcribing")

        # 4. Transcribe
        def transcription_progress(pct: int):
            update_progress(35 + int(pct * 0.5))

        transcript = transcribe_audio(
            audio_path,
            language=video.language,
            progress_callback=transcription_progress,
        )
        video.transcript = transcript
        video.language = transcript.get("language", "en")
        db.commit()
        update_progress(90)

        # 5. Detect viral clips (store suggestions)
        try:
            clips = detect_viral_clips(transcript, audio_path, num_clips=12)
            from models.clip import Clip
            for c in clips:
                clip = Clip(
                    video_id=video.id,
                    title=c["suggested_title_en"],
                    start_time=c["start_time"],
                    end_time=c["end_time"],
                    duration=c["duration"],
                    viral_score=c["viral_score"],
                    hook=c["hook"],
                    suggested_title_en=c["suggested_title_en"],
                    suggested_title_hi=c["suggested_title_hi"],
                    transcript={"words": [
                        w for w in transcript.get("words", [])
                        if w["start"] >= c["start_time"] and w["end"] <= c["end_time"]
                    ]},
                )
                db.add(clip)
            db.commit()
        except Exception as e:
            logger.warning(f"Clip detection error (non-fatal): {e}")

        # Clean up audio
        try:
            os.unlink(audio_path)
        except Exception:
            pass

        update_progress(100, "ready")
        logger.info(f"Video processing complete: {video_id}")

    except Exception as e:
        logger.exception(f"Video processing failed: {video_id}: {e}")
        db.query(Video).filter(Video.id == video_id).update({
            "status": "error",
            "error_message": str(e)[:500],
        })
        db.commit()
    finally:
        db.close()


# ── Task: Export a clip ────────────────────────────────────────────────────
def task_export_clip(clip_id: str):
    """
    Export a clip with all settings:
    - Aspect ratio crop (smart framing or manual)
    - Subtitle burn-in
    - Resolution scaling
    """
    from models.clip import Clip
    from models.video import Video
    from services.video_processing import export_clip
    from services.smart_framing import compute_smart_crop, apply_crop_ffmpeg_filter, compute_crop_dimensions
    from services.subtitle_renderer import SUBTITLE_PRESETS

    db = SessionLocal()
    try:
        clip: Clip = db.query(Clip).filter(Clip.id == clip_id).first()
        if not clip:
            return
        video: Video = db.query(Video).filter(Video.id == clip.video_id).first()

        def update(pct: int, status: str | None = None):
            clip.progress = pct
            if status:
                clip.status = status
            db.commit()

        update(5, "rendering")

        # Determine crop parameters
        if clip.smart_framing and not clip.crop_params:
            crop = compute_smart_crop(video.file_path, clip.aspect_ratio)
            clip.crop_params = crop
            db.commit()
        elif clip.crop_params:
            crop = clip.crop_params
        else:
            # Default center crop
            info_w = video.width or 1920
            info_h = video.height or 1080
            from services.smart_framing import compute_crop_dimensions
            cw, ch = compute_crop_dimensions(info_w, info_h, clip.aspect_ratio)
            crop = {
                "x": (info_w - cw) // 2,
                "y": (info_h - ch) // 2,
                "w": cw,
                "h": ch,
                "orig_w": info_w,
                "orig_h": info_h,
            }

        update(30)

        video_filter = apply_crop_ffmpeg_filter(crop, clip.aspect_ratio, clip.export_quality)

        # Subtitle style
        style = clip.subtitle_style or video.subtitle_style or SUBTITLE_PRESETS["viral_reels"]
        words = (clip.transcript or {}).get("words") or (video.transcript or {}).get("words", [])

        # Output path
        out_dir = Path(settings.OUTPUT_DIR)
        out_dir.mkdir(parents=True, exist_ok=True)
        output_path = str(out_dir / f"{clip_id}.mp4")

        update(40)

        export_clip(
            input_path=video.file_path,
            output_path=output_path,
            start=clip.start_time,
            end=clip.end_time,
            video_filter=video_filter,
            quality=clip.export_quality,
            subtitle_words=words if style else None,
            subtitle_style=style,
            video_w=crop.get("w", 1080),
            video_h=crop.get("h", 1920),
        )

        clip.output_path = output_path
        update(100, "ready")
        logger.info(f"Clip exported: {clip_id}")

    except Exception as e:
        logger.exception(f"Clip export failed: {clip_id}: {e}")
        db.query(Clip).filter(Clip.id == clip_id).update({
            "status": "error",
            "error_message": str(e)[:500],
        })
        db.commit()
    finally:
        db.close()
