import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type {
  Video,
  Clip,
  SubtitleStyle,
  AspectRatio,
  ExportQuality,
  TranscriptWord,
} from "./types";
import { DEFAULT_SUBTITLE_STYLE } from "./types";

// ── Editor Store ──────────────────────────────────────────────────────────

interface EditorState {
  // Current video being edited
  activeVideo: Video | null;
  setActiveVideo: (v: Video | null) => void;

  // Selected clip
  activeClip: Clip | null;
  setActiveClip: (c: Clip | null) => void;

  // Playback
  currentTime: number;
  setCurrentTime: (t: number) => void;
  isPlaying: boolean;
  setIsPlaying: (p: boolean) => void;
  duration: number;
  setDuration: (d: number) => void;

  // Active editor tab
  editorTab: "transcript" | "subtitles" | "clips" | "brand";
  setEditorTab: (t: EditorState["editorTab"]) => void;

  // Aspect ratio
  aspectRatio: AspectRatio;
  setAspectRatio: (a: AspectRatio) => void;

  // Export quality
  exportQuality: ExportQuality;
  setExportQuality: (q: ExportQuality) => void;

  // Subtitle style
  subtitleStyle: SubtitleStyle;
  setSubtitleStyle: (s: Partial<SubtitleStyle>) => void;
  resetSubtitleStyle: () => void;

  // Transcript editing
  editedWords: TranscriptWord[];
  setEditedWords: (w: TranscriptWord[]) => void;
  deleteWord: (index: number) => void;
  updateWord: (index: number, text: string) => void;
  restoreWord: (index: number) => void;

  // Smart framing
  smartFraming: boolean;
  setSmartFraming: (v: boolean) => void;

  // UI language
  uiLanguage: "en" | "hi";
  setUiLanguage: (l: "en" | "hi") => void;

  // Sidebar
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;
}

export const useEditorStore = create<EditorState>()(
  subscribeWithSelector((set, get) => ({
    activeVideo: null,
    setActiveVideo: (v) => {
      set({
        activeVideo: v,
        editedWords: v?.transcript?.words ?? [],
        duration: v?.duration ?? 0,
      });
    },

    activeClip: null,
    setActiveClip: (c) => set({ activeClip: c }),

    currentTime: 0,
    setCurrentTime: (t) => set({ currentTime: t }),
    isPlaying: false,
    setIsPlaying: (p) => set({ isPlaying: p }),
    duration: 0,
    setDuration: (d) => set({ duration: d }),

    editorTab: "transcript",
    setEditorTab: (t) => set({ editorTab: t }),

    aspectRatio: "9:16",
    setAspectRatio: (a) => set({ aspectRatio: a }),

    exportQuality: "1080p",
    setExportQuality: (q) => set({ exportQuality: q }),

    subtitleStyle: DEFAULT_SUBTITLE_STYLE,
    setSubtitleStyle: (s) =>
      set((state) => ({ subtitleStyle: { ...state.subtitleStyle, ...s } })),
    resetSubtitleStyle: () => set({ subtitleStyle: DEFAULT_SUBTITLE_STYLE }),

    editedWords: [],
    setEditedWords: (w) => set({ editedWords: w }),
    deleteWord: (index) =>
      set((state) => {
        const words = [...state.editedWords];
        words[index] = { ...words[index], deleted: true };
        return { editedWords: words };
      }),
    updateWord: (index, text) =>
      set((state) => {
        const words = [...state.editedWords];
        words[index] = { ...words[index], word: text };
        return { editedWords: words };
      }),
    restoreWord: (index) =>
      set((state) => {
        const words = [...state.editedWords];
        words[index] = { ...words[index], deleted: false };
        return { editedWords: words };
      }),

    smartFraming: true,
    setSmartFraming: (v) => set({ smartFraming: v }),

    uiLanguage: "en",
    setUiLanguage: (l) => set({ uiLanguage: l }),

    sidebarCollapsed: false,
    setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
  }))
);
