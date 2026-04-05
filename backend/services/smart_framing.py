"""
VizardFree – Smart Framing Service
Uses MediaPipe Face Detection + Pose Estimation to center the
main speaker when changing aspect ratios.
"""

import cv2
import numpy as np
from typing import Optional
from loguru import logger


def compute_smart_crop(
    video_path: str,
    target_aspect: str,
    sample_interval: float = 2.0,
) -> dict:
    """
    Analyze video frames to find the dominant face/person position,
    then compute crop parameters to center them in the target aspect ratio.

    Args:
        video_path: Path to input video
        target_aspect: "9:16" | "16:9" | "1:1" | "4:5" | "21:9"
        sample_interval: Sample every N seconds

    Returns:
        {
          "x": int,      # crop x offset (pixels in original video)
          "y": int,      # crop y offset
          "w": int,      # crop width
          "h": int,      # crop height
          "face_x": float,   # normalized face center x
          "face_y": float,   # normalized face center y
        }
    """
    import mediapipe as mp

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise RuntimeError(f"Cannot open video: {video_path}")

    orig_w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    orig_h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS) or 30
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    sample_every = max(1, int(fps * sample_interval))

    # MediaPipe Face Detection
    mp_face = mp.solutions.face_detection
    face_detector = mp_face.FaceDetection(
        model_selection=1,  # 1 = full range model
        min_detection_confidence=0.5,
    )

    face_centers_x = []
    face_centers_y = []
    frame_idx = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break
        if frame_idx % sample_every == 0:
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = face_detector.process(rgb)
            if results.detections:
                # Use the most prominent (largest) face
                best = max(
                    results.detections,
                    key=lambda d: d.location_data.relative_bounding_box.width
                    * d.location_data.relative_bounding_box.height,
                )
                bb = best.location_data.relative_bounding_box
                cx = bb.xmin + bb.width / 2
                cy = bb.ymin + bb.height / 2
                face_centers_x.append(cx)
                face_centers_y.append(cy)
        frame_idx += 1

    cap.release()
    face_detector.close()

    # Fallback: center of frame
    if not face_centers_x:
        logger.warning("No faces detected, using frame center for smart framing.")
        center_x_norm = 0.5
        center_y_norm = 0.4  # slightly above center
    else:
        center_x_norm = float(np.median(face_centers_x))
        center_y_norm = float(np.median(face_centers_y))

    # Compute target dimensions
    crop_w, crop_h = compute_crop_dimensions(orig_w, orig_h, target_aspect)

    # Compute crop origin (ensuring bounds)
    cx_px = int(center_x_norm * orig_w)
    cy_px = int(center_y_norm * orig_h)

    x = cx_px - crop_w // 2
    y = cy_px - crop_h // 2

    # Clamp to frame bounds
    x = max(0, min(x, orig_w - crop_w))
    y = max(0, min(y, orig_h - crop_h))

    return {
        "x": x,
        "y": y,
        "w": crop_w,
        "h": crop_h,
        "face_x": center_x_norm,
        "face_y": center_y_norm,
        "orig_w": orig_w,
        "orig_h": orig_h,
    }


def compute_crop_dimensions(orig_w: int, orig_h: int, aspect: str) -> tuple[int, int]:
    """
    Compute the largest crop box that fits within (orig_w, orig_h)
    for the given aspect ratio.
    """
    ratios = {
        "9:16": (9, 16),
        "16:9": (16, 9),
        "1:1": (1, 1),
        "4:5": (4, 5),
        "21:9": (21, 9),
    }
    ar_w, ar_h = ratios.get(aspect, (9, 16))

    # Fit by width
    cw = orig_w
    ch = int(cw * ar_h / ar_w)
    if ch > orig_h:
        ch = orig_h
        cw = int(ch * ar_w / ar_h)

    # Ensure even dimensions (FFmpeg requirement)
    cw = cw - (cw % 2)
    ch = ch - (ch % 2)
    return cw, ch


def apply_crop_ffmpeg_filter(crop: dict, aspect: str, output_resolution: str) -> str:
    """
    Build an FFmpeg video filter string for crop + scale.

    Args:
        crop: dict from compute_smart_crop()
        aspect: target aspect ratio string
        output_resolution: "720p" | "1080p" | "4k"

    Returns:
        FFmpeg -vf filter string
    """
    res_map = {
        "720p":  {"9:16": (720, 1280),  "16:9": (1280, 720),  "1:1": (720, 720),  "4:5": (720, 900),  "21:9": (1280, 549)},
        "1080p": {"9:16": (1080, 1920), "16:9": (1920, 1080), "1:1": (1080, 1080), "4:5": (1080, 1350), "21:9": (1920, 823)},
        "4k":    {"9:16": (2160, 3840), "16:9": (3840, 2160), "1:1": (2160, 2160), "4:5": (2160, 2700), "21:9": (3840, 1646)},
    }
    out_w, out_h = res_map.get(output_resolution, res_map["1080p"]).get(aspect, (1080, 1920))

    x, y, w, h = crop["x"], crop["y"], crop["w"], crop["h"]
    return f"crop={w}:{h}:{x}:{y},scale={out_w}:{out_h}:flags=lanczos"
