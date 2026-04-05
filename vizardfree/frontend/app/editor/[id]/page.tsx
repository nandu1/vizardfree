"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2 } from "lucide-react";
import { videosApi } from "@/lib/api";
import { useEditorStore } from "@/lib/store";
import { Sidebar } from "@/components/layout/Sidebar";
import { VideoPlayer } from "@/components/editor/VideoPlayer";
import { EditorTabs } from "@/components/editor/EditorTabs";
import { TranscriptPanel } from "@/components/editor/TranscriptPanel";
import { SubtitleStudio } from "@/components/editor/SubtitleStudio";
import { ClipsPanel } from "@/components/editor/ClipsPanel";
import { AspectRatioSelector } from "@/components/editor/AspectRatioSelector";
import { ExportPanel } from "@/components/editor/ExportPanel";

export default function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { setActiveVideo, editorTab, activeVideo } = useEditorStore();

  const { data: video, isLoading, error } = useQuery({
    queryKey: ["video", id],
    queryFn: () => videosApi.get(id).then((r) => r.data),
    enabled: !!id,
    refetchInterval: (data) => {
      const status = data?.state.data?.status;
      return status === "processing" || status === "transcribing" ? 2000 : false;
    },
  });

  useEffect(() => {
    if (video) setActiveVideo(video);
  }, [video, setActiveVideo]);

  if (isLoading) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading editor…</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <p className="text-destructive text-lg">Video not found</p>
            <button onClick={() => router.push("/")} className="text-primary hover:underline text-sm">
              ← Back to dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />

      {/* Editor Layout */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="flex items-center gap-4 px-4 py-3 border-b border-border bg-background/80 backdrop-blur-sm flex-shrink-0">
          <button
            onClick={() => router.push("/")}
            className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-semibold text-foreground truncate">{video.title}</h1>
            <p className="text-xs text-muted-foreground capitalize">{video.status} · {video.language ?? "unknown"}</p>
          </div>
          <EditorTabs />
          <ExportPanel videoId={id} />
        </header>

        {/* Main Editor Area */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Left: Video Player + Aspect Ratio */}
          <div className="flex flex-col w-[420px] flex-shrink-0 border-r border-border bg-[#0A0E14]">
            <div className="flex-1 flex items-center justify-center p-4 min-h-0">
              <VideoPlayer videoId={id} />
            </div>
            <div className="border-t border-border p-3">
              <AspectRatioSelector />
            </div>
          </div>

          {/* Right: Panel */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <motion.div
              key={editorTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-1 overflow-hidden"
            >
              {editorTab === "transcript" && <TranscriptPanel />}
              {editorTab === "subtitles" && <SubtitleStudio />}
              {editorTab === "clips" && <ClipsPanel videoId={id} />}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
