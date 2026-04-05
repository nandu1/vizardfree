"use client";

import { useState } from "react";
import { Download, ChevronDown } from "lucide-react";
import { useEditorStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { ExportQuality } from "@/lib/types";

const QUALITIES: ExportQuality[] = ["720p", "1080p", "4k"];

interface Props {
  videoId: string;
}

export function ExportPanel({ videoId }: Props) {
  const { exportQuality, setExportQuality } = useEditorStore();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-vf-green/20
                   text-vf-green text-sm font-medium hover:bg-vf-green/30 transition-colors"
      >
        <Download className="w-4 h-4" />
        <span className="hidden sm:inline">Export</span>
        <ChevronDown className="w-3.5 h-3.5" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 z-20 w-40 bg-popover border border-border
                          rounded-lg shadow-xl py-1 animate-pop">
            <p className="px-3 pt-2 pb-1 text-xs text-muted-foreground font-semibold uppercase tracking-wider">
              Quality
            </p>
            {QUALITIES.map(q => (
              <button
                key={q}
                onClick={() => { setExportQuality(q); setOpen(false); }}
                className={cn(
                  "flex items-center justify-between w-full px-3 py-2 text-sm transition-colors",
                  exportQuality === q
                    ? "text-primary bg-primary/10"
                    : "text-foreground hover:bg-secondary"
                )}
              >
                {q}
                {q === "1080p" && <span className="text-xs text-muted-foreground">Recommended</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
