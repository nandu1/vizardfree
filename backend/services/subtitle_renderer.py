"""
VizardFree – Subtitle Renderer
Burns subtitles into video using FFmpeg drawtext / ASS subtitles.
Full support for Hindi (Devanagari) via Noto Sans Devanagari font.
"""

import os
import re
import subprocess
import tempfile
from pathlib import Path
from typing import Optional
from loguru import logger

# Default style presets
SUBTITLE_PRESETS = {
    "viral_reels": {
        "font": "Montserrat",
        "font_size": 52,
        "font_weight": "Bold",
        "primary_color": "&H00FFFFFF",
        "outline_color": "&H00000000",
        "back_color": "&H00000000",
        "outline": 3,
        "shadow": 1,
        "bold": 1,
        "position": "bottom",
        "animation": "pop",
        "background": False,
        "bg_color": "&H80000000",
        "margin_v": 60,
    },
    "youtube_clean": {
        "font": "Inter",
        "font_size": 38,
        "font_weight": "Regular",
        "primary_color": "&H00FFFFFF",
        "outline_color": "&H00000000",
        "back_color": "&H40000000",
        "outline": 2,
        "shadow": 1,
        "bold": 0,
        "position": "bottom",
        "animation": "fade",
        "background": True,
        "bg_color": "&H80000000",
        "margin_v": 40,
    },
    "hindi_cinema": {
        "font": "Noto Sans Devanagari",
        "font_size": 48,
        "font_weight": "Bold",
        "primary_color": "&H00FFD700",
        "outline_color": "&H00000000",
        "back_color": "&H00000000",
        "outline": 3,
        "shadow": 2,
        "bold": 1,
        "position": "bottom",
        "animation": "fade",
        "background": False,
        "bg_color": "&H80000000",
        "margin_v": 50,
    },
    "tiktok_style": {
        "font": "Poppins",
        "font_size": 60,
        "font_weight": "ExtraBold",
        "primary_color": "&H00FFFFFF",
        "outline_color": "&H000000FF",
        "back_color": "&H00000000",
        "outline": 4,
        "shadow": 0,
        "bold": 1,
        "position": "middle",
        "animation": "typewriter",
        "background": False,
        "bg_color": "&H00000000",
        "margin_v": 0,
    },
    "minimal": {
        "font": "Inter",
        "font_size": 34,
        "font_weight": "Light",
        "primary_color": "&H00FFFFFF",
        "outline_color": "&H00000000",
        "back_color": "&H00000000",
        "outline": 1,
        "shadow": 0,
        "bold": 0,
        "position": "bottom",
        "animation": "fade",
        "background": True,
        "bg_color": "&HB0000000",
        "margin_v": 30,
    },
    "bold": {
        "font": "Montserrat",
        "font_size": 70,
        "font_weight": "Black",
        "primary_color": "&H00FFFF00",
        "outline_color": "&H00000000",
        "back_color": "&H00000000",
        "outline": 5,
        "shadow": 2,
        "bold": 1,
        "position": "bottom",
        "animation": "bounce",
        "background": False,
        "bg_color": "&H00000000",
        "margin_v": 60,
    },
}

# Map font names to system font files
FONT_FILE_MAP = {
    "Noto Sans Devanagari": "/usr/share/fonts/truetype/noto/NotoSansDevanagari-Regular.ttf",
    "Noto Sans Devanagari Bold": "/usr/share/fonts/truetype/noto/NotoSansDevanagari-Bold.ttf",
    "Montserrat": "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    "Inter": "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
    "Poppins": "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    "Arial": "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
}


def words_to_ass(words: list[dict], style: dict, video_w: int, video_h: int) -> str:
    """
    Convert word-level timestamps to ASS subtitle format.
    Supports karaoke-style word highlighting.
    """
    font_name = style.get("font", "Inter")
    font_size = style.get("font_size", 40)
    bold = style.get("bold", 0)
    primary_color = style.get("primary_color", "&H00FFFFFF")
    outline_color = style.get("outline_color", "&H00000000")
    back_color = style.get("bg_color", "&H80000000")
    outline = style.get("outline", 2)
    shadow = style.get("shadow", 1)
    position = style.get("position", "bottom")
    margin_v = style.get("margin_v", 40)

    # ASS alignment: 1=bottom-left, 2=bottom-center, 3=bottom-right
    # 4=mid-left, 5=mid-center, 6=mid-right, 7=top-left, 8=top-center, 9=top-right
    align_map = {"bottom": 2, "middle": 5, "top": 8}
    alignment = align_map.get(position, 2)

    header = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {video_w}
PlayResY: {video_h}
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,{font_name},{font_size},{primary_color},&H000000FF,{outline_color},{back_color},{bold},0,0,0,100,100,0,0,1,{outline},{shadow},{alignment},10,10,{margin_v},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""

    def fmt_time(t: float) -> str:
        h = int(t // 3600)
        m = int((t % 3600) // 60)
        s = int(t % 60)
        cs = int((t % 1) * 100)
        return f"{h}:{m:02d}:{s:02d}.{cs:02d}"

    # Group words into lines (max ~7 words per line)
    lines = []
    current_line = []
    for w in words:
        current_line.append(w)
        if len(current_line) >= 7 or w["word"].endswith((".", "?", "!", "।", "…")):
            lines.append(current_line)
            current_line = []
    if current_line:
        lines.append(current_line)

    events = []
    for line in lines:
        if not line:
            continue
        start = line[0]["start"]
        end = line[-1]["end"]
        text = "".join(w["word"] for w in line).strip()
        events.append(
            f"Dialogue: 0,{fmt_time(start)},{fmt_time(end)},Default,,0,0,0,,{text}"
        )

    return header + "\n".join(events) + "\n"


def burn_subtitles(
    input_video: str,
    words: list[dict],
    output_video: str,
    style: dict,
    video_w: int,
    video_h: int,
) -> str:
    """
    Burn subtitles into video using FFmpeg ASS filter.

    Args:
        input_video: Source video path
        words: List of word dicts with timestamps
        output_video: Output path
        style: Subtitle style dict
        video_w/h: Video dimensions

    Returns:
        Output video path
    """
    # Write ASS file
    with tempfile.NamedTemporaryFile(suffix=".ass", delete=False, mode="w", encoding="utf-8") as f:
        ass_content = words_to_ass(words, style, video_w, video_h)
        f.write(ass_content)
        ass_path = f.name

    try:
        cmd = [
            "ffmpeg", "-y",
            "-i", input_video,
            "-vf", f"ass={ass_path}",
            "-c:v", "libx264",
            "-preset", "fast",
            "-crf", "18",
            "-c:a", "aac",
            "-b:a", "192k",
            output_video,
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=1800)
        if result.returncode != 0:
            raise RuntimeError(f"FFmpeg subtitle burn failed: {result.stderr[-500:]}")
        logger.info(f"Subtitles burned: {output_video}")
    finally:
        os.unlink(ass_path)

    return output_video


def create_thumbnail(video_path: str, output_path: str, time: float = 1.0) -> str:
    """Extract a thumbnail from the video at given time."""
    cmd = [
        "ffmpeg", "-y",
        "-ss", str(time),
        "-i", video_path,
        "-vframes", "1",
        "-q:v", "2",
        output_path,
    ]
    subprocess.run(cmd, capture_output=True, check=True)
    return output_path
