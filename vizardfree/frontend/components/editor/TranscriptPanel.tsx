"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Undo2, Trash2, RotateCcw, Save, Search, AlignLeft } from "lucide-react";
import { useEditorStore } from "@/lib/store";
import { videosApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { TranscriptWord } from "@/lib/types";

export function TranscriptPanel() {
  const {
    editedWords, setEditedWords,
    deleteWord, updateWord, restoreWord,
    currentTime, activeVideo,
  } = useEditorStore();

  const [search, setSearch] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const qc = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: () =>
      videosApi.update(activeVideo!.id, {
        transcript: {
          ...activeVideo!.transcript!,
          words: editedWords,
        },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["video", activeVideo?.id] }),
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Seek video when clicking a word
  const seekTo = useCallback((time: number) => {
    const vid = document.querySelector("video") as HTMLVideoElement | null;
    if (vid) {
      vid.currentTime = time;
      vid.play().catch(() => {});
    }
  }, []);

  // Group words by sentence (ending with punctuation)
  const groupedSentences = groupIntoSentences(editedWords);
  const filteredSentences = search
    ? groupedSentences.filter(s =>
        s.some(w => w.word.toLowerCase().includes(search.toLowerCase()))
      )
    : groupedSentences;

  // Active word index
  const activeWordIdx = editedWords.findIndex(
    w => !w.deleted && currentTime >= w.start && currentTime < w.end
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border flex-shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search transcript…"
            className="w-full bg-secondary border border-border rounded-lg pl-8 pr-3 py-1.5
                       text-sm text-foreground placeholder:text-muted-foreground
                       focus:outline-none focus:ring-1 focus:ring-primary/30"
          />
        </div>
        <button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary
                     text-primary-foreground text-xs font-medium hover:bg-primary/90
                     disabled:opacity-50 transition-colors"
        >
          <Save className="w-3.5 h-3.5" />
          {saveMutation.isPending ? "Saving…" : "Save"}
        </button>
      </div>

      {/* Hint */}
      <div className="px-4 py-2 bg-primary/5 border-b border-border flex-shrink-0">
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <AlignLeft className="w-3 h-3" />
          Click word to seek · Double-click to edit · Del key to remove
        </p>
      </div>

      {/* Transcript */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {filteredSentences.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-sm">No transcript available.</p>
            <p className="text-xs mt-1">Process the video to generate subtitles.</p>
          </div>
        )}

        {filteredSentences.map((sentence, si) => (
          <div key={si} className="group leading-relaxed">
            <div className="flex flex-wrap gap-x-0.5 gap-y-1">
              {sentence.map((word) => {
                const globalIdx = editedWords.findIndex(
                  w => w.start === word.start && w.word === word.word
                );
                const isActive = globalIdx === activeWordIdx;
                const isEditing = editingIndex === globalIdx;

                if (isEditing) {
                  return (
                    <input
                      key={globalIdx}
                      autoFocus
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onBlur={() => {
                        if (editText.trim()) updateWord(globalIdx, editText.trim());
                        setEditingIndex(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          if (editText.trim()) updateWord(globalIdx, editText.trim());
                          setEditingIndex(null);
                        }
                        if (e.key === "Escape") setEditingIndex(null);
                        if (e.key === "Delete" || e.key === "Backspace") {
                          if (!editText) {
                            deleteWord(globalIdx);
                            setEditingIndex(null);
                          }
                        }
                      }}
                      className="inline-block bg-primary/20 border border-primary/40 rounded px-1
                                 text-sm text-foreground focus:outline-none min-w-[20px]"
                      style={{ width: `${Math.max(editText.length, 2)}ch` }}
                    />
                  );
                }

                return (
                  <span
                    key={globalIdx}
                    className={cn(
                      "transcript-word text-sm",
                      isActive && "active",
                      word.deleted && "deleted"
                    )}
                    onClick={() => seekTo(word.start)}
                    onDoubleClick={() => {
                      setEditingIndex(globalIdx);
                      setEditText(word.word);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Delete" && !word.deleted) deleteWord(globalIdx);
                      if (e.key === "z" && e.ctrlKey && word.deleted) restoreWord(globalIdx);
                    }}
                    tabIndex={0}
                    title={`${word.start.toFixed(2)}s - ${word.end.toFixed(2)}s`}
                  >
                    {word.word}
                    {word.deleted && (
                      <button
                        onClick={(e) => { e.stopPropagation(); restoreWord(globalIdx); }}
                        className="ml-0.5 text-primary/70 hover:text-primary"
                      >
                        <RotateCcw className="w-2.5 h-2.5 inline" />
                      </button>
                    )}
                  </span>
                );
              })}
            </div>
            {/* Sentence timing */}
            {sentence[0] && (
              <span className="text-[10px] text-muted-foreground/50 ml-1">
                {sentence[0].start.toFixed(1)}s
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Group words into sentences based on punctuation / pauses
function groupIntoSentences(words: TranscriptWord[]): TranscriptWord[][] {
  const sentences: TranscriptWord[][] = [];
  let current: TranscriptWord[] = [];

  for (const word of words) {
    current.push(word);
    const text = word.word.trim();
    const endsWithPunct = /[.!?।…]$/.test(text);
    const hasLongPause =
      current.length > 0 &&
      words[words.indexOf(word) + 1] &&
      words[words.indexOf(word) + 1].start - word.end > 1.5;
    if ((endsWithPunct || hasLongPause) && current.length >= 3) {
      sentences.push(current);
      current = [];
    } else if (current.length >= 12) {
      sentences.push(current);
      current = [];
    }
  }
  if (current.length) sentences.push(current);
  return sentences;
}
