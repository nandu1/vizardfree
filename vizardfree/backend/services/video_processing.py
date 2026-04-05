"""
VizardFree – Video Processing Service
Handles FFmpeg-based video operations: export, crop, trim, concat.
"""

import os
import subprocess
import tempfile
from pathlib import Path
from loguru import logger
from config import get_settings

settings = get_settings()


def get_video_info(video_path: str) -> dict:
    """Get video metadata using FFprobe."""
    import json
    cmd = [
        "ffprobe", "-v", "quiet",
        "-print_format", "json",
        "-show_streams",
        "-show_format",
        video_path,
    ]
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
    if result.returncode != 0:
        raise RuntimeError(f"FFprobe failed: {result.stderr}")

    data = json.loads(result.stdout)
    video_stream = next(
        (s for s in data.get("streams", []) if s.get("codec_type") == "video"), {}
    )
    audio_stream = next(
        (s for s in data.get("streams", []) if s.get("codec_type") == "audio"), {}
    )

    duration = float(data.get("format", {}).get("duration", 0))
    fps_str = video_stream.get("r_frame_rate", "30/1")
    fps_num, fps_den = (int(x) for x in fps_str.split("/"))
    fps = fps_num / fps_den if fps_den else 30

    return {
        "width": int(video_stream.get("width", 0)),
        "height": int(video_stream.get("height", 0)),
        "duration": duration,
        "fps": round(fps, 3),
        "codec": video_stream.get("codec_name", "unknown"),
        "file_size": int(data.get("format", {}).get("size", 0)),
        "has_audio": bool(audio_stream),
    }


def trim_video(
    input_path: str,
    output_path: str,
    start: float,
    end: float,
    re_encode: bool = False,
) -> str:
    """Trim video between start and end seconds."""
    duration = end - start
    if re_encode:
        cmd = [
            "ffmpeg", "-y",
            "-ss", str(start),
            "-i", input_path,
            "-t", str(duration),
            "-c:v", "libx264", "-preset", "fast", "-crf", "18",
            "-c:a", "aac", "-b:a", "192k",
            output_path,
        ]
    else:
        cmd = [
            "ffmpeg", "-y",
            "-ss", str(start),
            "-i", input_path,
            "-t", str(duration),
            "-c", "copy",
            output_path,
        ]
    _run_ffmpeg(cmd)
    return output_path


def export_clip(
    input_path: str,
    output_path: str,
    start: float,
    end: float,
    video_filter: str,
    quality: str = "1080p",
    subtitle_words: list | None = None,
    subtitle_style: dict | None = None,
    video_w: int = 1920,
    video_h: int = 1080,
) -> str:
    """
    Full clip export pipeline:
    1. Trim
    2. Apply video filter (crop + scale for aspect ratio)
    3. Burn subtitles (if provided)
    4. Encode to output
    """
    from services.subtitle_renderer import burn_subtitles, words_to_ass
    import shutil

    quality_crf = {"720p": 22, "1080p": 18, "4k": 15}.get(quality, 18)

    # Step 1: Trim + apply video filter
    with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tf:
        trimmed_path = tf.name

    duration = end - start
    cmd = [
        "ffmpeg", "-y",
        "-ss", str(start),
        "-i", input_path,
        "-t", str(duration),
        "-vf", video_filter,
        "-c:v", "libx264", "-preset", "fast", f"-crf", str(quality_crf),
        "-c:a", "aac", "-b:a", "192k",
        trimmed_path,
    ]
    _run_ffmpeg(cmd)

    # Step 2: Burn subtitles if requested
    if subtitle_words and subtitle_style:
        # Adjust word timestamps to be relative to clip start
        adjusted_words = [
            {**w, "start": w["start"] - start, "end": w["end"] - start}
            for w in subtitle_words
            if w["start"] >= start and w["end"] <= end
        ]
        if adjusted_words:
            # Get output dimensions from video filter
            out_w, out_h = _extract_output_dims(video_filter)
            burn_subtitles(trimmed_path, adjusted_words, output_path, subtitle_style, out_w, out_h)
            os.unlink(trimmed_path)
            return output_path

    shutil.move(trimmed_path, output_path)
    return output_path


def download_youtube(url: str, output_dir: str, progress_callback=None) -> str:
    """Download YouTube video using yt-dlp."""
    import yt_dlp

    out_template = str(Path(output_dir) / "%(id)s.%(ext)s")
    downloaded_path = [None]

    def on_progress(d):
        if d["status"] == "finished":
            downloaded_path[0] = d["filename"]
        elif d["status"] == "downloading" and progress_callback:
            pct = d.get("_percent_str", "0%").replace("%", "").strip()
            try:
                progress_callback(int(float(pct) * 0.8))
            except Exception:
                pass

    ydl_opts = {
        "outtmpl": out_template,
        "format": "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
        "merge_output_format": "mp4",
        "progress_hooks": [on_progress],
        "quiet": True,
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=True)
        if not downloaded_path[0]:
            # reconstruct path
            downloaded_path[0] = ydl.prepare_filename(info)

    return downloaded_path[0]


def _run_ffmpeg(cmd: list, timeout: int = 3600):
    """Run FFmpeg command with error handling."""
    logger.debug(f"FFmpeg: {' '.join(cmd)}")
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
    if result.returncode != 0:
        raise RuntimeError(f"FFmpeg error: {result.stderr[-1000:]}")


def _extract_output_dims(vf_string: str) -> tuple[int, int]:
    """Extract output width/height from a scale= filter string."""
    import re
    m = re.search(r"scale=(\d+):(\d+)", vf_string)
    if m:
        return int(m.group(1)), int(m.group(2))
    return 1080, 1920
