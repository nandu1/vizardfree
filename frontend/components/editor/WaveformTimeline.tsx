"use client";

import { useEffect, useRef } from "react";
import { useEditorStore } from "@/lib/store";

interface Props {
  videoId: string;
  audioUrl?: string;
}

export function WaveformTimeline({ videoId, audioUrl }: Props) {
  const waveRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<any>(null);
  const { currentTime, duration, setCurrentTime, isPlaying } = useEditorStore();

  useEffect(() => {
    if (!waveRef.current || !audioUrl) return;

    // Lazy import WaveSurfer (it's client-only)
    import("wavesurfer.js").then(({ default: WaveSurfer }) => {
      if (wsRef.current) { wsRef.current.destroy(); }

      wsRef.current = WaveSurfer.create({
        container: waveRef.current!,
        waveColor: "#374151",
        progressColor: "#7C3AED",
        cursorColor: "#A78BFA",
        barWidth: 2,
        barRadius: 2,
        height: 48,
        normalize: true,
        interact: true,
        backend: "WebAudio",
      });

      wsRef.current.load(audioUrl);

      wsRef.current.on("seek", (progress: number) => {
        const t = progress * (wsRef.current?.getDuration() || duration);
        setCurrentTime(t);
        // Sync video element
        const vid = document.querySelector("video") as HTMLVideoElement | null;
        if (vid) vid.currentTime = t;
      });
    });

    return () => { wsRef.current?.destroy(); };
  }, [audioUrl]);

  // Sync playhead
  useEffect(() => {
    if (!wsRef.current || !duration) return;
    const progress = currentTime / duration;
    try { wsRef.current.seekTo(Math.min(Math.max(progress, 0), 1)); } catch {}
  }, [currentTime, duration]);

  return (
    <div className="w-full px-2">
      <div
        ref={waveRef}
        id="waveform"
        className="waveform-container rounded-lg overflow-hidden"
      />
      {!audioUrl && (
        <div className="h-12 bg-secondary rounded-lg flex items-center justify-center">
          <span className="text-xs text-muted-foreground">Waveform loads after transcription</span>
        </div>
      )}
    </div>
  );
}
