"""
VizardFree – Clip ORM Model
"""

import uuid
from datetime import datetime
from sqlalchemy import String, Integer, Float, JSON, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base


class Clip(Base):
    __tablename__ = "clips"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    video_id: Mapped[str] = mapped_column(String(36), ForeignKey("videos.id", ondelete="CASCADE"), nullable=False)

    # Clip Info
    title: Mapped[str] = mapped_column(String(512), nullable=False)
    start_time: Mapped[float] = mapped_column(Float, nullable=False)  # seconds
    end_time: Mapped[float] = mapped_column(Float, nullable=False)
    duration: Mapped[float] = mapped_column(Float, nullable=False)

    # AI Score
    viral_score: Mapped[float | None] = mapped_column(Float, nullable=True)  # 0-100
    hook: Mapped[str | None] = mapped_column(String(512), nullable=True)     # Catchy hook text
    suggested_title_en: Mapped[str | None] = mapped_column(String(512), nullable=True)
    suggested_title_hi: Mapped[str | None] = mapped_column(String(512), nullable=True)

    # Export Settings
    aspect_ratio: Mapped[str] = mapped_column(String(16), default="9:16")  # 9:16, 16:9, 1:1, 4:5, 21:9
    export_quality: Mapped[str] = mapped_column(String(16), default="1080p")
    subtitle_style: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    smart_framing: Mapped[bool] = mapped_column(Boolean, default=True)
    crop_params: Mapped[dict | None] = mapped_column(JSON, nullable=True)  # manual crop

    # Output
    output_path: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    thumbnail_path: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="pending")
    # pending | rendering | ready | error
    progress: Mapped[int] = mapped_column(Integer, default=0)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Edited transcript for this clip
    transcript: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "video_id": self.video_id,
            "title": self.title,
            "start_time": self.start_time,
            "end_time": self.end_time,
            "duration": self.duration,
            "viral_score": self.viral_score,
            "hook": self.hook,
            "suggested_title_en": self.suggested_title_en,
            "suggested_title_hi": self.suggested_title_hi,
            "aspect_ratio": self.aspect_ratio,
            "export_quality": self.export_quality,
            "subtitle_style": self.subtitle_style,
            "smart_framing": self.smart_framing,
            "crop_params": self.crop_params,
            "output_path": self.output_path,
            "thumbnail_path": self.thumbnail_path,
            "status": self.status,
            "progress": self.progress,
            "error_message": self.error_message,
            "transcript": self.transcript,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }
