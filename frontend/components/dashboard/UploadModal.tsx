"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Upload, Link2, Loader2, CheckCircle2, AlertCircle, Youtube
} from "lucide-react";
import { videosApi } from "@/lib/api";

interface Props {
  open: boolean;
  onClose: () => void;
}

type Tab = "local" | "youtube";

export function UploadModal({ open, onClose }: Props) {
  const [tab, setTab] = useState<Tab>("local");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [language, setLanguage] = useState("auto");
  const [uploadProgress, setUploadProgress] = useState(0);
  const qc = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: ({ file, title }: { file: File; title: string }) =>
      videosApi.upload(file, { title, language: language !== "auto" ? language : undefined }, setUploadProgress),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["videos"] });
      onClose();
      setUploadProgress(0);
    },
  });

  const ytMutation = useMutation({
    mutationFn: () =>
      videosApi.importYoutube(youtubeUrl, language !== "auto" ? language : undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["videos"] });
      onClose();
      setYoutubeUrl("");
    },
  });

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;
      uploadMutation.mutate({ file, title: file.name.replace(/\.[^/.]+$/, "") });
    },
    [uploadMutation]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "video/*": [".mp4", ".mov", ".avi", ".mkv", ".webm", ".m4v"] },
    maxSize: 2 * 1024 * 1024 * 1024, // 2GB
    multiple: false,
    disabled: uploadMutation.isPending,
  });

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
          className="relative w-full max-w-lg glass-card p-6 z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-foreground">Add Video</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Upload a file or import from YouTube
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-secondary rounded-lg p-1 mb-6">
            {(["local", "youtube"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md
                            text-sm font-medium transition-all ${
                              tab === t
                                ? "bg-card text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
              >
                {t === "local" ? <Upload className="w-4 h-4" /> : <Youtube className="w-4 h-4" />}
                {t === "local" ? "Upload File" : "YouTube"}
              </button>
            ))}
          </div>

          {/* Language Selector */}
          <div className="mb-4">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
              Language
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2
                         text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="auto">🌐 Auto Detect</option>
              <option value="hi">🇮🇳 Hindi (हिंदी)</option>
              <option value="hinglish">🎤 Hinglish</option>
              <option value="en">🇬🇧 English</option>
              <option value="ur">اردو Urdu</option>
              <option value="ta">தமிழ் Tamil</option>
              <option value="te">తెలుగు Telugu</option>
              <option value="bn">বাংলা Bengali</option>
            </select>
          </div>

          {/* Tab Content */}
          {tab === "local" ? (
            <div>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
                             transition-all duration-200 ${
                               isDragActive
                                 ? "border-primary bg-primary/5"
                                 : "border-border hover:border-primary/50 hover:bg-secondary/50"
                             } ${uploadMutation.isPending ? "pointer-events-none opacity-60" : ""}`}
              >
                <input {...getInputProps()} />
                {uploadMutation.isPending ? (
                  <div className="space-y-3">
                    <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
                    <p className="text-sm font-medium text-foreground">Uploading…</p>
                    <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">{uploadProgress}%</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                      <Upload className="w-7 h-7 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {isDragActive ? "Drop it!" : "Drop your video here or click to browse"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        MP4, MOV, AVI, MKV, WebM · Max 2GB
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {uploadMutation.isError && (
                <div className="mt-3 flex items-center gap-2 text-destructive text-sm bg-destructive/10 rounded-lg px-3 py-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  Upload failed. Please try again.
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
                  YouTube URL
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      placeholder="https://youtube.com/watch?v=..."
                      className="w-full bg-secondary border border-border rounded-lg pl-9 pr-4 py-2.5
                                 text-sm text-foreground placeholder:text-muted-foreground
                                 focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={() => ytMutation.mutate()}
                disabled={!youtubeUrl.trim() || ytMutation.isPending}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg
                           bg-primary text-primary-foreground font-medium text-sm
                           hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed
                           transition-colors"
              >
                {ytMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Importing…</>
                ) : (
                  <><Youtube className="w-4 h-4" /> Import from YouTube</>
                )}
              </button>

              {ytMutation.isSuccess && (
                <div className="flex items-center gap-2 text-vf-green text-sm bg-vf-green/10 rounded-lg px-3 py-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Import started! Processing in background.
                </div>
              )}
              {ytMutation.isError && (
                <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 rounded-lg px-3 py-2">
                  <AlertCircle className="w-4 h-4" />
                  Import failed. Check the URL and try again.
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
