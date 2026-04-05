"use client";

import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/Sidebar";
import { Scissors, TrendingUp, Download, Loader2 } from "lucide-react";
import { clipsApi, formatDuration, viralScoreColor } from "@/lib/api";
import type { Clip } from "@/lib/types";
import { useEditorStore } from "@/lib/store";
import { useTranslation } from "@/lib/i18n";
import Link from "next/link";

// Fetch all clips across all videos (top-level view)
async function fetchAllClips(): Promise<{ clips: Clip[] }> {
  // We get clips from all videos by querying the API.
  // In this simplified implementation we won't have a global endpoint,
  // so we show a placeholder here.
  return { clips: [] };
}

export default function ClipsPage() {
  const { uiLanguage } = useEditorStore();
  const tr = useTranslation(uiLanguage);

  const { data, isLoading } = useQuery({
    queryKey: ["all-clips"],
    queryFn: fetchAllClips,
  });

  const clips = data?.clips ?? [];

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-background/80">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
              <Scissors className="w-6 h-6 text-primary" />
              {tr("clip_library")}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              All your exported and AI-generated clips
            </p>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : clips.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Scissors className="w-8 h-8 text-primary" />
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground">No clips yet</p>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                  Upload a video and generate AI clips — they'll appear here.
                </p>
              </div>
              <Link href="/">
                <button className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors">
                  Go to Dashboard
                </button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {clips.map(clip => (
                <div key={clip.id} className="glass-card p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-foreground">{clip.title}</h3>
                    {clip.viral_score !== null && (
                      <span className={`viral-badge ${viralScoreColor(clip.viral_score)}`}>
                        <TrendingUp className="w-3 h-3" />
                        {Math.round(clip.viral_score)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground font-mono">
                    {formatDuration(clip.duration)} · {clip.aspect_ratio}
                  </p>
                  {clip.suggested_title_hi && (
                    <p className="text-xs text-primary/70 font-devanagari">{clip.suggested_title_hi}</p>
                  )}
                  {clip.status === "ready" && clip.output_path && (
                    <a href={clipsApi.downloadUrl(clip.id)} download
                      className="flex items-center gap-2 text-xs text-vf-green hover:underline">
                      <Download className="w-3.5 h-3.5" /> Download
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
