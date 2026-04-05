"use client";

import { FileText, Subtitles, Scissors } from "lucide-react";
import { useEditorStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";

type Tab = "transcript" | "subtitles" | "clips";

const TABS: Array<{ id: Tab; icon: React.ReactNode; labelKey: "transcript" | "subtitle_studio" | "clips" }> = [
  { id: "transcript", icon: <FileText className="w-4 h-4" />, labelKey: "transcript" },
  { id: "subtitles", icon: <span className="text-xs font-bold">CC</span>, labelKey: "subtitle_studio" },
  { id: "clips", icon: <Scissors className="w-4 h-4" />, labelKey: "clips" },
];

export function EditorTabs() {
  const { editorTab, setEditorTab, uiLanguage } = useEditorStore();
  const tr = useTranslation(uiLanguage);

  return (
    <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
      {TABS.map(({ id, icon, labelKey }) => (
        <button
          key={id}
          onClick={() => setEditorTab(id)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
            editorTab === id
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {icon}
          <span className="hidden md:inline">{tr(labelKey)}</span>
        </button>
      ))}
    </div>
  );
}
