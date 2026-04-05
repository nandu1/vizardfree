"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Scissors, Zap, Download, Trash2, Play, Plus, Loader2,
  CheckCircle2, AlertCircle, TrendingUp, Clock,
} from "lucide-react";
import { clipsApi, formatDuration, viralScoreColor } from "@/lib/api";
import { useEditorStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { Clip } from "@/lib/types";

interface Props {
  videoId: string;
}

export function ClipsPanel({ videoId }: Props) {
  const [creating, setCreating] = useState(false);
  const { aspectRatio, exportQuality, subtitleStyle, smartFraming, editedWords, uiLanguage } =
    useEditorStore();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["clips", videoId],
    queryFn: () => clipsApi.listForVideo(videoId).then(r => r.data),
    refetchInterval: (d) => {
      const rendering = d?.state.data?.clips.some(c => c.status === "rendering");
      return rendering ? 2000 : false;
    },
  });

  const exportMutation = useMutation({
    mutationFn: async (clip: Clip) => {
      // First update clip settings
      await clipsApi.update(clip.id, {
        aspect_ratio: aspectRatio,
        export_quality: exportQuality,
        subtitle_style: subtitleStyle,
        smart_framing: smartFraming,
      });
      return clipsApi.export(clip.id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clips", videoId] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => clipsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clips", videoId] }),
  });

  const createMutation = useMutation({
    mutationFn: (data: { start: number; end: number; title: string }) =>
      clipsApi.create({
        video_id: videoId,
        title: data.title,
        start_time: data.start,
        end_time: data.end,
        aspect_ratio: aspectRatio,
        export_quality: exportQuality,
        subtitle_style: subtitleStyle,
        smart_framing: smartFraming,
        transcript: { words: editedWords },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clips", videoId] });
      setCreating(false);
    },
  });

  const clips = data?.clips ?? [];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
            <Scissors className="w-4 h-4 text-primary" />
          </div>
          <span className="font-semibold text-sm text-foreground">
            Clip Library
          </span>
          <span className="text-xs text-muted-foreground">({clips.length})</span>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary
                     text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          New Clip
        </button>
      </div>

      {/* Export settings bar */}
      <div className="flex items-center gap-3 px-4 py-2 bg-secondary/50 border-b border-border flex-shrink-0 flex-wrap">
        <span className="text-xs text-muted-foreground">Export as:</span>
        <span className="text-xs font-medium text-primary">{aspectRatio}</span>
        <span className="text-muted-foreground/40">·</span>
        <span className="text-xs font-medium text-foreground">{exportQuality}</span>
        <span className="text-muted-foreground/40">·</span>
        <span className="text-xs text-muted-foreground">
          {smartFraming ? "🪄 Smart Framing" : "📐 Manual Crop"}
        </span>
      </div>

      {/* Clips list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}

        {!isLoading && clips.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Zap className="w-7 h-7 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">No clips yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                AI clips are auto-generated when your video is processed.
              </p>
            </div>
          </div>
        )}

        <AnimatePresence mode="popLayout">
          {clips.map((clip) => (
            <ClipCard
              key={clip.id}
              clip={clip}
              onExport={() => exportMutation.mutate(clip)}
              onDelete={() => deleteMutation.mutate(clip.id)}
              exporting={exportMutation.isPending && exportMutation.variables?.id === clip.id}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* New Clip Form */}
      <AnimatePresence>
        {creating && (
          <NewClipForm
            onSubmit={(d) => createMutation.mutate(d)}
            onCancel={() => setCreating(false)}
            isPending={createMutation.isPending}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ClipCard({
  clip, onExport, onDelete, exporting,
}: {
  clip: Clip;
  onExport: () => void;
  onDelete: () => void;
  exporting: boolean;
}) {
  const scoreColor = viralScoreColor(clip.viral_score);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="glass-card p-3 hover:border-primary/20 transition-all"
    >
      <div className="flex items-start gap-3">
        {/* Viral Score Badge */}
        {clip.viral_score !== null && (
          <div className={`viral-badge ${scoreColor} flex-shrink-0`}>
            <TrendingUp className="w-3 h-3" />
            {Math.round(clip.viral_score)}
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-foreground truncate">{clip.title}</h4>
          {clip.hook && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">🎣 {clip.hook}</p>
          )}
          {clip.suggested_title_hi && (
            <p className="text-xs text-primary/70 font-devanagari mt-0.5 truncate">
              {clip.suggested_title_hi}
            </p>
          )}
          <div className="flex items-center gap-2 mt-1.5">
            <Clock className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-mono">
              {formatDuration(clip.start_time)} → {formatDuration(clip.end_time)}
              <span className="ml-1 text-muted-foreground/50">({formatDuration(clip.duration)})</span>
            </span>
          </div>
        </div>

        {/* Status & Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {clip.status === "ready" ? (
            <>
              <a
                href={clipsApi.downloadUrl(clip.id)}
                download
                className="p-1.5 rounded-lg bg-vf-green/20 text-vf-green hover:bg-vf-green/30 transition-colors"
                title="Download"
              >
                <Download className="w-4 h-4" />
              </a>
            </>
          ) : clip.status === "rendering" ? (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-primary/10">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
              <span className="text-xs text-primary">{clip.progress}%</span>
            </div>
          ) : clip.status === "error" ? (
            <div className="p-1.5 rounded-lg bg-destructive/20" title={clip.error_message || ""}>
              <AlertCircle className="w-4 h-4 text-destructive" />
            </div>
          ) : (
            <button
              onClick={onExport}
              disabled={exporting}
              className="p-1.5 rounded-lg bg-primary/20 text-primary hover:bg-primary/30
                         disabled:opacity-50 transition-colors"
              title="Export clip"
            >
              {exporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </button>
          )}
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress bar for rendering */}
      {clip.status === "rendering" && (
        <div className="mt-2 h-1 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${clip.progress}%` }}
          />
        </div>
      )}
    </motion.div>
  );
}

function NewClipForm({
  onSubmit, onCancel, isPending,
}: {
  onSubmit: (d: { start: number; end: number; title: string }) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [title, setTitle] = useState("My Clip");
  const [start, setStart] = useState("0");
  const [end, setEnd] = useState("60");
  const { currentTime } = useEditorStore();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="border-t border-border p-4 bg-card/50 space-y-3"
    >
      <h3 className="text-sm font-semibold text-foreground">Create New Clip</h3>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Clip title…"
        className="field-input w-full"
      />
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="field-label">Start (s)</label>
          <div className="flex gap-1">
            <input value={start} onChange={(e) => setStart(e.target.value)}
              type="number" min="0" step="0.1" className="field-input flex-1" />
            <button onClick={() => setStart(String(Math.round(currentTime * 10) / 10))}
              className="px-2 py-1.5 text-xs bg-secondary rounded-lg border border-border hover:border-primary/30">
              Now
            </button>
          </div>
        </div>
        <div className="flex-1">
          <label className="field-label">End (s)</label>
          <div className="flex gap-1">
            <input value={end} onChange={(e) => setEnd(e.target.value)}
              type="number" min="0" step="0.1" className="field-input flex-1" />
            <button onClick={() => setEnd(String(Math.round(currentTime * 10) / 10))}
              className="px-2 py-1.5 text-xs bg-secondary rounded-lg border border-border hover:border-primary/30">
              Now
            </button>
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={onCancel}
          className="flex-1 py-2 text-sm border border-border rounded-lg hover:bg-secondary transition-colors">
          Cancel
        </button>
        <button
          onClick={() => onSubmit({ title, start: parseFloat(start), end: parseFloat(end) })}
          disabled={isPending}
          className="flex-1 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90
                     disabled:opacity-50 transition-colors font-medium"
        >
          {isPending ? "Creating…" : "Create Clip"}
        </button>
      </div>
    </motion.div>
  );
}
