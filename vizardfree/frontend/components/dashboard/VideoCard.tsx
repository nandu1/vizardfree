"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { MoreVertical, Trash2, Edit2, ExternalLink, Clock, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import type { Video } from "@/lib/types";
import { videosApi, formatDuration, formatFileSize } from "@/lib/api";

interface Props {
  video: Video;
  onDelete: () => void;
}

export function VideoCard({ video, onDelete }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);

  const statusIcon = {
    pending: <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />,
    uploading: <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />,
    processing: <Loader2 className="w-3.5 h-3.5 animate-spin text-vf-purple-light" />,
    transcribing: <Loader2 className="w-3.5 h-3.5 animate-spin text-vf-cyan" />,
    ready: <CheckCircle2 className="w-3.5 h-3.5 text-vf-green" />,
    error: <AlertCircle className="w-3.5 h-3.5 text-destructive" />,
  }[video.status];

  const statusLabel = {
    pending: "Pending",
    uploading: "Uploading…",
    processing: "Processing…",
    transcribing: "Transcribing…",
    ready: "Ready",
    error: "Error",
  }[video.status];

  const isReady = video.status === "ready";

  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
      className="group glass-card overflow-hidden hover:border-primary/30 transition-all duration-200"
    >
      {/* Thumbnail */}
      <Link href={isReady ? `/editor/${video.id}` : "#"}>
        <div className="relative aspect-video bg-vf-surface-2 overflow-hidden cursor-pointer">
          {video.thumbnail_path ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={videosApi.thumbnailUrl(video.id)}
              alt={video.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <span className="text-2xl">🎬</span>
              </div>
            </div>
          )}

          {/* Processing overlay */}
          {!isReady && video.status !== "error" && (
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="text-xs text-white font-medium">{statusLabel}</span>
              {video.progress > 0 && (
                <div className="w-24 h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${video.progress}%` }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Duration badge */}
          {video.duration && (
            <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm
                            text-white text-xs px-1.5 py-0.5 rounded font-mono">
              {formatDuration(video.duration)}
            </div>
          )}

          {/* Language badge */}
          {video.language && (
            <div className="absolute top-2 left-2 bg-primary/80 backdrop-blur-sm
                            text-white text-xs px-1.5 py-0.5 rounded-full uppercase font-medium">
              {video.language}
            </div>
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-foreground truncate" title={video.title}>
              {video.title}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              {statusIcon}
              <span className="text-xs text-muted-foreground">{statusLabel}</span>
              {video.file_size && (
                <>
                  <span className="text-muted-foreground/40">·</span>
                  <span className="text-xs text-muted-foreground">{formatFileSize(video.file_size)}</span>
                </>
              )}
            </div>
          </div>

          {/* Menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1 rounded hover:bg-secondary transition-colors"
            >
              <MoreVertical className="w-4 h-4 text-muted-foreground" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-6 z-20 w-40 bg-popover border border-border
                                rounded-lg shadow-xl py-1 animate-pop">
                  {isReady && (
                    <Link href={`/editor/${video.id}`}>
                      <button className="flex items-center gap-2 w-full px-3 py-2 text-sm
                                         text-foreground hover:bg-secondary transition-colors">
                        <Edit2 className="w-3.5 h-3.5" /> Edit
                      </button>
                    </Link>
                  )}
                  {video.source_url && (
                    <a href={video.source_url} target="_blank" rel="noreferrer">
                      <button className="flex items-center gap-2 w-full px-3 py-2 text-sm
                                         text-foreground hover:bg-secondary transition-colors">
                        <ExternalLink className="w-3.5 h-3.5" /> Source
                      </button>
                    </a>
                  )}
                  <button
                    onClick={() => { onDelete(); setMenuOpen(false); }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm
                               text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
