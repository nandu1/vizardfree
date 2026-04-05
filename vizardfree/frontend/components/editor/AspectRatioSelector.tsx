"use client";

import { useEditorStore } from "@/lib/store";
import { ASPECT_RATIOS, type AspectRatio } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Wand2 } from "lucide-react";

export function AspectRatioSelector() {
  const { aspectRatio, setAspectRatio, smartFraming, setSmartFraming } = useEditorStore();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Aspect Ratio
        </span>
        {/* Smart Framing toggle */}
        <button
          onClick={() => setSmartFraming(!smartFraming)}
          className={cn(
            "flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-all",
            smartFraming
              ? "border-primary/50 bg-primary/10 text-primary"
              : "border-border text-muted-foreground hover:border-primary/30"
          )}
        >
          <Wand2 className="w-3 h-3" />
          Smart Framing
        </button>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {ASPECT_RATIOS.map((ar) => {
          const [w, h] = ar.value.split(":").map(Number);
          const isSelected = aspectRatio === ar.value;
          // Normalize to a consistent height
          const previewH = 40;
          const previewW = Math.min(Math.round((w / h) * previewH), 64);

          return (
            <button
              key={ar.value}
              onClick={() => setAspectRatio(ar.value as AspectRatio)}
              className={cn(
                "ratio-card flex-shrink-0 flex flex-col items-center gap-1.5 p-2 min-w-[56px]",
                isSelected && "selected"
              )}
            >
              {/* Preview box */}
              <div
                className={cn(
                  "rounded-sm border-2 transition-colors",
                  isSelected ? "border-primary bg-primary/20" : "border-border bg-secondary"
                )}
                style={{ width: previewW, height: previewH }}
              />
              <span
                className={cn(
                  "text-[10px] font-semibold",
                  isSelected ? "text-primary" : "text-muted-foreground"
                )}
              >
                {ar.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Description of selected ratio */}
      <p className="text-xs text-muted-foreground">
        {ASPECT_RATIOS.find(a => a.value === aspectRatio)?.description}
        {smartFraming && " · Auto-centered with Smart Framing 🪄"}
      </p>
    </div>
  );
}
