"use client";

import { useQuery } from "@tanstack/react-query";
import { HexColorPicker } from "react-colorful";
import { useState } from "react";
import { Sliders, Type, Palette, AlignCenter, Zap, RotateCcw } from "lucide-react";
import { useEditorStore } from "@/lib/store";
import { subtitleApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  FONT_OPTIONS, PRESET_LABELS, type SubtitlePreset,
  type SubtitlePosition, type SubtitleAnimation,
} from "@/lib/types";

const POSITION_OPTIONS: SubtitlePosition[] = ["bottom", "middle", "top"];
const ANIMATION_OPTIONS: SubtitleAnimation[] = ["none", "fade", "pop", "typewriter", "highlight", "bounce"];

export function SubtitleStudio() {
  const { subtitleStyle, setSubtitleStyle, resetSubtitleStyle, uiLanguage } = useEditorStore();
  const [colorTarget, setColorTarget] = useState<"primary" | "outline" | "bg" | null>(null);

  const { data: presetsData } = useQuery({
    queryKey: ["subtitle-presets"],
    queryFn: () => subtitleApi.getPresets().then(r => r.data),
  });

  const presets = presetsData?.presets || {};

  function applyPreset(presetKey: string) {
    const preset = presets[presetKey];
    if (preset) {
      setSubtitleStyle({
        ...preset,
        // Convert ASS color (&H00RRGGBB) to hex if needed
        primary_color: assToHex(preset.primary_color as string) || preset.primary_color as string,
        outline_color: assToHex(preset.outline_color as string) || preset.outline_color as string,
        bg_color: assToHex(preset.bg_color as string) || preset.bg_color as string,
      });
    }
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
            <span className="text-xs font-bold text-primary">CC</span>
          </div>
          <span className="font-semibold text-sm text-foreground">Subtitle Studio</span>
        </div>
        <button
          onClick={resetSubtitleStyle}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground
                     px-2 py-1 rounded hover:bg-secondary transition-colors"
        >
          <RotateCcw className="w-3 h-3" /> Reset
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">

        {/* ── Presets ── */}
        <Section icon={<Zap className="w-4 h-4" />} title="Style Presets">
          <div className="grid grid-cols-2 gap-2">
            {Object.keys(PRESET_LABELS).map((key) => (
              <button
                key={key}
                onClick={() => applyPreset(key)}
                className="px-3 py-2 text-xs font-medium rounded-lg border border-border
                           hover:border-primary/50 hover:bg-primary/5 text-foreground
                           transition-all text-left"
              >
                {PRESET_LABELS[key as SubtitlePreset]}
              </button>
            ))}
          </div>
        </Section>

        {/* ── Typography ── */}
        <Section icon={<Type className="w-4 h-4" />} title="Typography">
          {/* Font */}
          <div>
            <label className="field-label">Font Family</label>
            <select
              value={subtitleStyle.font}
              onChange={(e) => setSubtitleStyle({ font: e.target.value })}
              className="field-select"
            >
              {FONT_OPTIONS.map(f => (
                <option key={f.value} value={f.value}>{f.label} – {f.preview}</option>
              ))}
            </select>
          </div>

          {/* Font Size */}
          <div>
            <label className="field-label flex items-center justify-between">
              Font Size <span className="text-primary font-semibold">{subtitleStyle.font_size}px</span>
            </label>
            <input
              type="range" min={20} max={100} step={1}
              value={subtitleStyle.font_size}
              onChange={(e) => setSubtitleStyle({ font_size: Number(e.target.value) })}
              className="range-slider"
            />
          </div>

          {/* Bold toggle */}
          <div className="flex items-center justify-between">
            <label className="field-label !mb-0">Bold</label>
            <button
              onClick={() => setSubtitleStyle({ bold: subtitleStyle.bold ? 0 : 1 })}
              className={cn(
                "w-10 h-5 rounded-full transition-colors relative",
                subtitleStyle.bold ? "bg-primary" : "bg-secondary border border-border"
              )}
            >
              <span className={cn(
                "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform",
                subtitleStyle.bold ? "translate-x-5" : "translate-x-0.5"
              )} />
            </button>
          </div>
        </Section>

        {/* ── Colors ── */}
        <Section icon={<Palette className="w-4 h-4" />} title="Colors">
          <div className="space-y-3">
            {[
              { key: "primary" as const, label: "Text Color", color: subtitleStyle.primary_color },
              { key: "outline" as const, label: "Outline Color", color: subtitleStyle.outline_color },
              { key: "bg" as const, label: "Background Color", color: subtitleStyle.bg_color },
            ].map(({ key, label, color }) => (
              <div key={key}>
                <label className="field-label">{label}</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setColorTarget(colorTarget === key ? null : key)}
                    className="w-8 h-8 rounded-lg border-2 border-border flex-shrink-0 shadow-inner"
                    style={{ backgroundColor: color }}
                  />
                  <input
                    value={color}
                    onChange={(e) => {
                      const updates: Record<string, string> = {
                        primary: "primary_color", outline: "outline_color", bg: "bg_color"
                      };
                      setSubtitleStyle({ [updates[key]]: e.target.value });
                    }}
                    className="flex-1 bg-secondary border border-border rounded-lg px-2 py-1.5
                               text-xs font-mono text-foreground focus:outline-none"
                    placeholder="#FFFFFF"
                  />
                </div>
                {colorTarget === key && (
                  <div className="mt-2">
                    <HexColorPicker
                      color={color}
                      onChange={(c) => {
                        const map: Record<string, keyof typeof subtitleStyle> = {
                          primary: "primary_color", outline: "outline_color", bg: "bg_color"
                        };
                        setSubtitleStyle({ [map[key]]: c });
                      }}
                      style={{ width: "100%", height: 140 }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>

        {/* ── Effects ── */}
        <Section icon={<Sliders className="w-4 h-4" />} title="Effects">
          <div>
            <label className="field-label flex items-center justify-between">
              Outline <span className="text-primary font-semibold">{subtitleStyle.outline}</span>
            </label>
            <input type="range" min={0} max={8} step={0.5}
              value={subtitleStyle.outline}
              onChange={(e) => setSubtitleStyle({ outline: Number(e.target.value) })}
              className="range-slider"
            />
          </div>
          <div>
            <label className="field-label flex items-center justify-between">
              Shadow <span className="text-primary font-semibold">{subtitleStyle.shadow}</span>
            </label>
            <input type="range" min={0} max={6} step={0.5}
              value={subtitleStyle.shadow}
              onChange={(e) => setSubtitleStyle({ shadow: Number(e.target.value) })}
              className="range-slider"
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="field-label !mb-0">Box Background</label>
            <button
              onClick={() => setSubtitleStyle({ background: !subtitleStyle.background })}
              className={cn(
                "w-10 h-5 rounded-full transition-colors relative",
                subtitleStyle.background ? "bg-primary" : "bg-secondary border border-border"
              )}
            >
              <span className={cn(
                "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform",
                subtitleStyle.background ? "translate-x-5" : "translate-x-0.5"
              )} />
            </button>
          </div>
        </Section>

        {/* ── Position & Animation ── */}
        <Section icon={<AlignCenter className="w-4 h-4" />} title="Position & Animation">
          <div>
            <label className="field-label">Position</label>
            <div className="flex gap-2">
              {POSITION_OPTIONS.map(pos => (
                <button key={pos} onClick={() => setSubtitleStyle({ position: pos })}
                  className={cn(
                    "flex-1 py-1.5 text-xs font-medium rounded-lg border transition-all capitalize",
                    subtitleStyle.position === pos
                      ? "bg-primary/20 border-primary text-primary"
                      : "border-border text-muted-foreground hover:border-primary/30"
                  )}
                >
                  {pos}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="field-label">Animation</label>
            <div className="grid grid-cols-3 gap-2">
              {ANIMATION_OPTIONS.map(anim => (
                <button key={anim} onClick={() => setSubtitleStyle({ animation: anim })}
                  className={cn(
                    "py-1.5 text-xs font-medium rounded-lg border transition-all capitalize",
                    subtitleStyle.animation === anim
                      ? "bg-primary/20 border-primary text-primary"
                      : "border-border text-muted-foreground hover:border-primary/30"
                  )}
                >
                  {anim}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="field-label flex items-center justify-between">
              Margin <span className="text-primary font-semibold">{subtitleStyle.margin_v}px</span>
            </label>
            <input type="range" min={0} max={200} step={5}
              value={subtitleStyle.margin_v}
              onChange={(e) => setSubtitleStyle({ margin_v: Number(e.target.value) })}
              className="range-slider"
            />
          </div>
        </Section>

        {/* Preview text */}
        <div className="rounded-xl bg-black p-4 min-h-[80px] flex items-end justify-center">
          <span
            style={{
              fontFamily: subtitleStyle.font,
              fontSize: Math.min(subtitleStyle.font_size * 0.4, 28),
              fontWeight: subtitleStyle.bold ? "bold" : "normal",
              color: subtitleStyle.primary_color,
              textShadow: subtitleStyle.shadow > 0
                ? `${subtitleStyle.shadow}px ${subtitleStyle.shadow}px ${subtitleStyle.shadow * 2}px ${subtitleStyle.outline_color}`
                : undefined,
              WebkitTextStroke: subtitleStyle.outline > 0
                ? `${subtitleStyle.outline * 0.3}px ${subtitleStyle.outline_color}`
                : undefined,
              backgroundColor: subtitleStyle.background ? subtitleStyle.bg_color : undefined,
              padding: subtitleStyle.background ? "4px 10px" : undefined,
              borderRadius: subtitleStyle.background ? 6 : undefined,
            }}
            className="font-devanagari"
          >
            यह preview है — This is the preview 🔥
          </span>
        </div>
      </div>
    </div>
  );
}

function Section({ icon, title, children }: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 pb-2 border-b border-border">
        <span className="text-primary">{icon}</span>
        <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">{title}</h3>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

// Helper: convert ASS color format to hex
function assToHex(assColor: string): string | null {
  const m = assColor?.match(/&H[0-9A-Fa-f]{6,8}/);
  if (!m) return null;
  const hex = m[0].replace("&H", "");
  // ASS is BBGGRR, we need RRGGBB
  if (hex.length >= 6) {
    const bb = hex.slice(-6, -4);
    const gg = hex.slice(-4, -2);
    const rr = hex.slice(-2);
    return `#${rr}${gg}${bb}`;
  }
  return null;
}
