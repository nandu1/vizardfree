"use client";

/**
 * VizardFree – Global editor keyboard shortcuts
 * Uses react-hotkeys-hook for clean shortcut management.
 */

import { useHotkeys } from "react-hotkeys-hook";
import { useEditorStore } from "@/lib/store";

export function useEditorHotkeys() {
  const {
    deleteWord,
    editedWords,
    currentTime,
    setCurrentTime,
    isPlaying,
    setIsPlaying,
    setEditorTab,
    aspectRatio,
    setAspectRatio,
  } = useEditorStore();

  // Space → play/pause
  useHotkeys(
    "space",
    () => {
      const vid = document.querySelector("video") as HTMLVideoElement | null;
      if (!vid) return;
      if (vid.paused) { vid.play(); setIsPlaying(true); }
      else { vid.pause(); setIsPlaying(false); }
    },
    { preventDefault: true, enableOnFormTags: false }
  );

  // ← / → seek
  useHotkeys("left", () => {
    const vid = document.querySelector("video") as HTMLVideoElement | null;
    if (vid) vid.currentTime = Math.max(0, vid.currentTime - 5);
  }, { preventDefault: true, enableOnFormTags: false });

  useHotkeys("right", () => {
    const vid = document.querySelector("video") as HTMLVideoElement | null;
    if (vid) vid.currentTime = Math.min(vid.duration || 0, vid.currentTime + 5);
  }, { preventDefault: true, enableOnFormTags: false });

  // J K L (video editing standard)
  useHotkeys("j", () => {
    const vid = document.querySelector("video") as HTMLVideoElement | null;
    if (vid) vid.currentTime = Math.max(0, vid.currentTime - 10);
  }, { enableOnFormTags: false });

  useHotkeys("l", () => {
    const vid = document.querySelector("video") as HTMLVideoElement | null;
    if (vid) vid.currentTime = Math.min(vid.duration || 0, vid.currentTime + 10);
  }, { enableOnFormTags: false });

  // Ctrl+1/2/3 → switch editor tabs
  useHotkeys("ctrl+1", () => setEditorTab("transcript"), { preventDefault: true });
  useHotkeys("ctrl+2", () => setEditorTab("subtitles"),  { preventDefault: true });
  useHotkeys("ctrl+3", () => setEditorTab("clips"),      { preventDefault: true });

  // Ctrl+Shift+R → cycle aspect ratio
  useHotkeys("ctrl+shift+r", () => {
    const ratios = ["9:16", "16:9", "1:1", "4:5", "21:9"] as const;
    const idx = ratios.indexOf(aspectRatio as any);
    setAspectRatio(ratios[(idx + 1) % ratios.length]);
  }, { preventDefault: true });
}
