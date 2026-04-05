"""
VizardFree – Video ORM Model
"""

import uuid
from datetime import datetime
from sqlalchemy import String, Integer, Float, JSON, Text, DateTime, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from database import Base


class Video(Base):
    __tablename__ = "videos"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title: Mapped[str] = mapped_column(String(512), nullable=False)
    original_filename: Mapped[str] = mapped_column(String(512), nullable=False)
    file_path: Mapped[str] = mapped_column(String(1024), nullable=False)
    thumbnail_path: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    source_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)  # YouTube URL

    # Metadata
    duration: Mapped[float | None] = mapped_column(Float, nullable=True)  # seconds
    width: Mapped[int | None] = mapped_column(Integer, nullable=True)
    height: Mapped[int | None] = mapped_column(Integer, nullable=True)
    fps: Mapped[float | None] = mapped_column(Float, nullable=True)
    file_size: Mapped[int | None] = mapped_column(Integer, nullable=True)  # bytes
    codec: Mapped[str | None] = mapped_column(String(64), nullable=True)

    # Processing
    status: Mapped[str] = mapped_column(
        String(32), nullable=False, default="pending"
    )
    # pending | uploading | processing | transcribing | ready | error
    progress: Mapped[int] = mapped_column(Integer, default=0)  # 0-100
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Transcription
    language: Mapped[str | None] = mapped_column(String(16), nullable=True)  # e.g. "hi", "en", "hinglish"
    transcript: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    # Format: {"words": [{"word": str, "start": float, "end": float, "speaker": str|None}]}

    # Brand Kit
    brand_kit: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # Subtitle Style
    subtitle_style: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "title": self.title,
            "original_filename": self.original_filename,
            "thumbnail_path": self.thumbnail_path,
            "source_url": self.source_url,
            "duration": self.duration,
            "width": self.width,
            "height": self.height,
            "fps": self.fps,
            "file_size": self.file_size,
            "status": self.status,
            "progress": self.progress,
            "error_message": self.error_message,
            "language": self.language,
            "transcript": self.transcript,
            "brand_kit": self.brand_kit,
            "subtitle_style": self.subtitle_style,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }
