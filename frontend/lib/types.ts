// ── Video ─────────────────────────────────────────────────────────────────

export type VideoStatus =
  | "pending"
  | "uploading"
  | "processing"
  | "transcribing"
  | "ready"
  | "error";

export interface TranscriptWord {
  word: string;
  start: number;
  end: number;
  speaker: string | null;
  probability?: number;
  deleted?: boolean; // frontend-only
}

export interface TranscriptSegment {
  text: string;
  start: number;
  end: number;
}

export interface Transcript {
  language: string;
  words: TranscriptWord[];
  segments: TranscriptSegment[];
}

export interface Video {
  id: string;
  title: string;
  original_filename: string;
  thumbnail_path: string | null;
  source_url: string | null;
  duration: number | null;
  width: number | null;
  height: number | null;
  fps: number | null;
  file_size: number | null;
  status: VideoStatus;
  progress: number;
  error_message: string | null;
  language: string | null;
  transcript: Transcript | null;
  brand_kit: BrandKit | null;
  subtitle_style: SubtitleStyle | null;
  created_at: string;
  updated_at: string;
}

// ── Clip ──────────────────────────────────────────────────────────────────

export type ClipStatus = "pending" | "rendering" | "ready" | "error";
export type AspectRatio = "9:16" | "16:9" | "1:1" | "4:5" | "21:9";
export type ExportQuality = "720p" | "1080p" | "4k";

export interface CropParams {
  x: number;
  y: number;
  w: number;
  h: number;
  face_x?: number;
  face_y?: number;
  orig_w?: number;
  orig_h?: number;
}

export interface Clip {
  id: string;
  video_id: string;
  title: string;
  start_time: number;
  end_time: number;
  duration: number;
  viral_score: number | null;
  hook: string | null;
  suggested_title_en: string | null;
  suggested_title_hi: string | null;
  aspect_ratio: AspectRatio;
  export_quality: ExportQuality;
  subtitle_style: SubtitleStyle | null;
  smart_framing: boolean;
  crop_params: CropParams | null;
  output_path: string | null;
  thumbnail_path: string | null;
  status: ClipStatus;
  progress: number;
  error_message: string | null;
  transcript: Transcript | null;
  created_at: string;
  updated_at: string;
}

// ── Subtitle Style ────────────────────────────────────────────────────────

export type SubtitlePosition = "bottom" | "middle" | "top";
export type SubtitleAnimation = "fade" | "pop" | "typewriter" | "highlight" | "bounce" | "none";
export type SubtitlePreset =
  | "viral_reels"
  | "youtube_clean"
  | "hindi_cinema"
  | "tiktok_style"
  | "minimal"
  | "bold";

export interface SubtitleStyle {
  preset?: SubtitlePreset;
  font: string;
  font_size: number;
  font_weight: string;
  primary_color: string;
  outline_color: string;
  bg_color: string;
  outline: number;
  shadow: number;
  bold: number;
  position: SubtitlePosition;
  animation: SubtitleAnimation;
  background: boolean;
  margin_v: number;
}

export const DEFAULT_SUBTITLE_STYLE: SubtitleStyle = {
  font: "Inter",
  font_size: 42,
  font_weight: "Bold",
  primary_color: "#FFFFFF",
  outline_color: "#000000",
  bg_color: "#00000080",
  outline: 2,
  shadow: 1,
  bold: 1,
  position: "bottom",
  animation: "pop",
  background: false,
  margin_v: 50,
};

// ── Brand Kit ─────────────────────────────────────────────────────────────

export interface BrandKit {
  logo_path?: string;
  primary_color: string;
  secondary_color: string;
  font: string;
  outro_text?: string;
  outro_duration?: number;
}

// ── UI State ──────────────────────────────────────────────────────────────

export interface AppLanguage {
  code: "en" | "hi";
  label: string;
}

export const ASPECT_RATIOS: Array<{
  value: AspectRatio;
  label: string;
  icon: string;
  description: string;
}> = [
  { value: "9:16", label: "9:16", icon: "📱", description: "Reels / Shorts / TikTok" },
  { value: "16:9", label: "16:9", icon: "🖥️", description: "YouTube / Landscape" },
  { value: "1:1", label: "1:1", icon: "⬜", description: "Instagram Square" },
  { value: "4:5", label: "4:5", icon: "📷", description: "Instagram Portrait" },
  { value: "21:9", label: "21:9", icon: "🎬", description: "Cinematic Wide" },
];

export const FONT_OPTIONS = [
  { value: "Inter", label: "Inter", preview: "Clean" },
  { value: "Montserrat", label: "Montserrat", preview: "Modern" },
  { value: "Poppins", label: "Poppins", preview: "Friendly" },
  { value: "Noto Sans Devanagari", label: "Noto Devanagari", preview: "हिंदी" },
  { value: "Arial", label: "Arial", preview: "Classic" },
];

export const PRESET_LABELS: Record<SubtitlePreset, string> = {
  viral_reels: "Viral Reels 🔥",
  youtube_clean: "YouTube Clean",
  hindi_cinema: "Hindi Cinema 🎬",
  tiktok_style: "TikTok Style",
  minimal: "Minimal",
  bold: "Bold Impact",
};
