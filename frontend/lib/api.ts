import axios from "axios";
import type { Video, Clip, SubtitleStyle } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: API_URL,
  timeout: 60_000,
});

// ── Videos ────────────────────────────────────────────────────────────────

export const videosApi = {
  list: (page = 1, limit = 20) =>
    api.get<{ videos: Video[]; page: number; limit: number }>("/api/videos", {
      params: { page, limit },
    }),

  get: (id: string) => api.get<Video>(`/api/videos/${id}`),

  upload: (
    file: File,
    options: { title?: string; language?: string },
    onProgress?: (pct: number) => void
  ) => {
    const form = new FormData();
    form.append("file", file);
    if (options.title) form.append("title", options.title);
    if (options.language) form.append("language", options.language);
    return api.post<Video>("/api/videos", form, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (e) => {
        if (onProgress && e.total) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      },
    });
  },

  importYoutube: (url: string, language?: string) =>
    api.post<Video>("/api/videos/import-youtube", { url, language }),

  update: (id: string, data: Partial<Pick<Video, "title" | "language" | "transcript" | "subtitle_style" | "brand_kit">>) =>
    api.patch<Video>(`/api/videos/${id}`, data),

  delete: (id: string) => api.delete(`/api/videos/${id}`),

  thumbnailUrl: (id: string) => `${API_URL}/api/videos/${id}/thumbnail`,

  streamUrl: (id: string) => `${API_URL}/api/videos/${id}/stream`,
};

// ── Clips ─────────────────────────────────────────────────────────────────

export const clipsApi = {
  listForVideo: (videoId: string) =>
    api.get<{ clips: Clip[] }>(`/api/clips/video/${videoId}`),

  get: (id: string) => api.get<Clip>(`/api/clips/${id}`),

  create: (data: {
    video_id: string;
    title: string;
    start_time: number;
    end_time: number;
    aspect_ratio?: string;
    export_quality?: string;
    subtitle_style?: SubtitleStyle | null;
    smart_framing?: boolean;
    transcript?: object | null;
  }) => api.post<Clip>("/api/clips", data),

  update: (id: string, data: Partial<Clip>) =>
    api.patch<Clip>(`/api/clips/${id}`, data),

  delete: (id: string) => api.delete(`/api/clips/${id}`),

  export: (id: string) => api.post(`/api/clips/${id}/export`),

  downloadUrl: (id: string) => `${API_URL}/api/clips/${id}/download`,
};

// ── Subtitle Presets ──────────────────────────────────────────────────────

export const subtitleApi = {
  getPresets: () =>
    api.get<{ presets: Record<string, SubtitleStyle> }>("/api/subtitle-presets"),
};

// ── Utilities ─────────────────────────────────────────────────────────────

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1_073_741_824) return `${(bytes / 1_048_576).toFixed(1)} MB`;
  return `${(bytes / 1_073_741_824).toFixed(2)} GB`;
}

export function viralScoreColor(score: number | null): "high" | "medium" | "low" {
  if (!score) return "low";
  if (score >= 70) return "high";
  if (score >= 45) return "medium";
  return "low";
}
