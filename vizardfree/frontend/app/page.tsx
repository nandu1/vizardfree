"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Plus, Search, SlidersHorizontal, Zap } from "lucide-react";
import { videosApi } from "@/lib/api";
import { useEditorStore } from "@/lib/store";
import { useTranslation } from "@/lib/i18n";
import { Sidebar } from "@/components/layout/Sidebar";
import { VideoCard } from "@/components/dashboard/VideoCard";
import { UploadModal } from "@/components/dashboard/UploadModal";
import { VideoCardSkeleton } from "@/components/dashboard/VideoCardSkeleton";

export default function DashboardPage() {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { uiLanguage } = useEditorStore();
  const tr = useTranslation(uiLanguage);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["videos"],
    queryFn: () => videosApi.list(1, 50).then((r) => r.data),
    refetchInterval: (data) => {
      // Poll every 3s while any video is processing
      const processing = data?.state.data?.videos.some(
        (v) => v.status === "processing" || v.status === "transcribing" || v.status === "pending"
      );
      return processing ? 3000 : false;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => videosApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["videos"] }),
  });

  const videos = data?.videos ?? [];
  const filtered = videos.filter((v) =>
    v.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0 bg-background/80 backdrop-blur-sm">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">
              {tr("my_videos")}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {videos.length} video{videos.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search videos…"
                className="bg-secondary border border-border rounded-lg pl-9 pr-4 py-2 text-sm
                           text-foreground placeholder:text-muted-foreground w-52
                           focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            {/* Upload Button */}
            <button
              onClick={() => setUploadOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary
                         text-primary-foreground text-sm font-medium
                         hover:bg-primary/90 transition-colors animate-pulse-glow"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">{tr("upload_video")}</span>
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <VideoCardSkeleton key={i} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState onUpload={() => setUploadOpen(true)} message={tr("no_videos")} />
          ) : (
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.06 } },
              }}
            >
              {filtered.map((video) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  onDelete={() => deleteMutation.mutate(video.id)}
                />
              ))}
            </motion.div>
          )}
        </main>
      </div>

      <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} />
    </div>
  );
}

function EmptyState({
  onUpload,
  message,
}: {
  onUpload: () => void;
  message: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-6">
      <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
        <Zap className="w-10 h-10 text-primary" />
      </div>
      <div className="text-center">
        <p className="text-muted-foreground text-lg">{message}</p>
      </div>
      <button
        onClick={onUpload}
        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary
                   text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Upload Your First Video
      </button>
    </div>
  );
}
