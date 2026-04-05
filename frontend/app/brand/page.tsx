"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Palette, Upload, Save } from "lucide-react";
import { useEditorStore } from "@/lib/store";
import { HexColorPicker } from "react-colorful";

export default function BrandPage() {
  const { uiLanguage } = useEditorStore();
  const [primaryColor, setPrimaryColor] = useState("#7C3AED");
  const [secondaryColor, setSecondaryColor] = useState("#06B6D4");
  const [outroText, setOutroText] = useState("Follow for more! 🔥");
  const [font, setFont] = useState("Inter");
  const [showPrimary, setShowPrimary] = useState(false);
  const [showSecondary, setShowSecondary] = useState(false);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center gap-3 px-6 py-4 border-b border-border bg-background/80">
          <Palette className="w-5 h-5 text-primary" />
          <h1 className="font-display text-2xl font-bold text-foreground">Brand Kit</h1>
        </header>

        <main className="flex-1 overflow-y-auto p-6 max-w-2xl">
          <div className="space-y-6">
            {/* Logo */}
            <section className="glass-card p-5 space-y-4">
              <h2 className="font-semibold text-foreground border-b border-border pb-3">Logo</h2>
              <div className="border-2 border-dashed border-border rounded-xl p-8 text-center
                              hover:border-primary/50 transition-colors cursor-pointer">
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Upload your logo (PNG/SVG)</p>
              </div>
            </section>

            {/* Colors */}
            <section className="glass-card p-5 space-y-4">
              <h2 className="font-semibold text-foreground border-b border-border pb-3">Brand Colors</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="field-label">Primary Color</label>
                  <button onClick={() => setShowPrimary(!showPrimary)}
                    className="w-full h-10 rounded-lg border-2 border-border"
                    style={{ backgroundColor: primaryColor }} />
                  {showPrimary && (
                    <div className="mt-2">
                      <HexColorPicker color={primaryColor} onChange={setPrimaryColor}
                        style={{ width: "100%", height: 120 }} />
                    </div>
                  )}
                </div>
                <div>
                  <label className="field-label">Secondary Color</label>
                  <button onClick={() => setShowSecondary(!showSecondary)}
                    className="w-full h-10 rounded-lg border-2 border-border"
                    style={{ backgroundColor: secondaryColor }} />
                  {showSecondary && (
                    <div className="mt-2">
                      <HexColorPicker color={secondaryColor} onChange={setSecondaryColor}
                        style={{ width: "100%", height: 120 }} />
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Font */}
            <section className="glass-card p-5 space-y-4">
              <h2 className="font-semibold text-foreground border-b border-border pb-3">Typography</h2>
              <div>
                <label className="field-label">Brand Font</label>
                <select value={font} onChange={e => setFont(e.target.value)} className="field-select">
                  <option value="Inter">Inter</option>
                  <option value="Montserrat">Montserrat</option>
                  <option value="Poppins">Poppins</option>
                  <option value="Noto Sans Devanagari">Noto Sans Devanagari (Hindi)</option>
                </select>
              </div>
            </section>

            {/* Outro */}
            <section className="glass-card p-5 space-y-4">
              <h2 className="font-semibold text-foreground border-b border-border pb-3">Outro / Watermark Text</h2>
              <input
                value={outroText}
                onChange={e => setOutroText(e.target.value)}
                className="field-input w-full"
                placeholder="Your channel / social handle"
              />
              <p className="text-xs text-muted-foreground">
                This text appears at the end of exported clips.
              </p>
            </section>

            <button className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground
                               rounded-xl font-medium hover:bg-primary/90 transition-colors">
              <Save className="w-4 h-4" /> Save Brand Kit
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
