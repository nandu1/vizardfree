"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize2 } from "lucide-react";
import { useEditorStore } from "@/lib/store";
import { videosApi, formatDuration } from "@/lib/api";
import { cn } from "@/lib/utils";
import { ASPECT_RATIOS } from "@/lib/types";

interface Props {
  videoId: string;
}

export function VideoPlayer({ videoId }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isDragging, setIsDragging] = useState(false);

  const {
    currentTime, setCurrentTime,
    isPlaying, setIsPlaying,
    duration, setDuration,
    aspectRatio,
    editedWords,
  } = useEditorStore();

  // Get aspect ratio CSS
  const ratioMeta = ASPECT_RATIOS.find(r => r.value === aspectRatio);
  const [arW, arH] = aspectRatio.split(":").map(Number);
  const paddingBottom = `${(arH / arW) * 100}%`;

  // Sync video to store time
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    const onTime = () => setCurrentTime(el.currentTime);
    const onDur = () => setDuration(el.duration);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("loadedmetadata", onDur);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    return () => {
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("loadedmetadata", onDur);
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
    };
  }, [setCurrentTime, setDuration, setIsPlaying]);

  // Play/pause toggle
  const togglePlay = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) el.play();
    else el.pause();
  }, []);

  // Keyboard shortcut: Space
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === "Space") { e.preventDefault(); togglePlay(); }
      if (e.code === "ArrowLeft") { if (videoRef.current) videoRef.current.currentTime -= 5; }
      if (e.code === "ArrowRight") { if (videoRef.current) videoRef.current.currentTime += 5; }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [togglePlay]);

  // Seek on progress bar click
  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const frac = (e.clientX - rect.left) / rect.width;
    const t = frac * duration;
    if (videoRef.current) videoRef.current.currentTime = t;
  }, [duration]);

  // Active subtitle word
  const activeWord = editedWords.find(
    w => !w.deleted && currentTime >= w.start && currentTime < w.end
  );
  const subtitleLine = editedWords
    .filter(w => !w.deleted && currentTime >= w.start && currentTime < w.end + 2)
    .slice(0, 8)
    .map(w => w.word)
    .join(" ")
    .trim();

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-[340px]">
      {/* Video wrapper with correct aspect ratio */}
      <div
        ref={containerRef}
        className="relative w-full rounded-xl overflow-hidden bg-black shadow-2xl"
        style={{ paddingBottom }}
      >
        <video
          ref={videoRef}
          src={videosApi.streamUrl(videoId)}
          className="absolute inset-0 w-full h-full object-cover"
          preload="metadata"
          muted={muted}
          playsInline
          onClick={togglePlay}
          style={{ cursor: "pointer" }}
        />

        {/* Subtitle overlay */}
        {subtitleLine && (
          <div className="absolute bottom-6 left-2 right-2 flex justify-center pointer-events-none">
            <div className="bg-black/70 backdrop-blur-sm text-white text-sm font-semibold
                            px-3 py-1.5 rounded-lg text-center leading-snug max-w-full
                            font-devanagari">
              {subtitleLine}
            </div>
          </div>
        )}

        {/* Play overlay */}
        {!isPlaying && (
          <button
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center
                       bg-black/30 transition-opacity hover:bg-black/40"
          >
            <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-sm border border-white/20
                            flex items-center justify-center">
              <Play className="w-7 h-7 text-white fill-white ml-1" />
            </div>
          </button>
        )}

        {/* Aspect ratio label */}
        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm rounded-md px-2 py-0.5">
          <span className="text-xs text-white font-mono">{aspectRatio}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="w-full space-y-2">
        {/* Progress bar */}
        <div
          className="w-full h-2 bg-secondary rounded-full cursor-pointer group"
          onClick={handleSeek}
        >
          <div
            className="h-full bg-primary rounded-full relative transition-all"
            style={{ width: `${progressPct}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full
                            bg-white shadow opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Time + buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={togglePlay} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
              {isPlaying
                ? <Pause className="w-4 h-4 text-foreground" />
                : <Play className="w-4 h-4 text-foreground" />
              }
            </button>
            <button onClick={() => setMuted(!muted)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
              {muted
                ? <VolumeX className="w-4 h-4 text-muted-foreground" />
                : <Volume2 className="w-4 h-4 text-muted-foreground" />
              }
            </button>
          </div>
          <span className="text-xs font-mono text-muted-foreground">
            {formatDuration(currentTime)} / {formatDuration(duration)}
          </span>
        </div>
      </div>
    </div>
  );
}
