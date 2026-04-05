"""
Additional worker task for YouTube import.
Add this to workers/tasks.py or import separately.
"""


def task_download_and_process_youtube(video_id: str, url: str):
    """Download YouTube video, update DB path, then run processing pipeline."""
    from pathlib import Path
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from config import get_settings
    from models.video import Video
    from services.video_processing import download_youtube, get_video_info
    from services.subtitle_renderer import create_thumbnail
    import os

    settings = get_settings()
    engine = create_engine(
        settings.DATABASE_URL.replace("+aiosqlite", ""),
        connect_args={"check_same_thread": False},
    )
    Session = sessionmaker(bind=engine)
    db = Session()

    try:
        video: Video = db.query(Video).filter(Video.id == video_id).first()
        if not video:
            return

        video.status = "processing"
        video.progress = 5
        db.commit()

        def on_progress(pct: int):
            video.progress = pct
            db.commit()

        # Download
        file_path = download_youtube(url, settings.UPLOAD_DIR, on_progress)
        video.file_path = file_path
        video.title = Path(file_path).stem.replace("_", " ")
        video.progress = 20
        db.commit()

        # Now run the standard processing pipeline
        from workers.tasks import task_process_video as _process
        db.close()
        _process(video_id)

    except Exception as e:
        from loguru import logger
        logger.exception(f"YouTube import failed: {video_id}: {e}")
        db.query(Video).filter(Video.id == video_id).update({
            "status": "error",
            "error_message": str(e)[:500],
        })
        db.commit()
        db.close()
