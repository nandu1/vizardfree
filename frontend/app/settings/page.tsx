"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { useEditorStore } from "@/lib/store";
import { useTranslation } from "@/lib/i18n";
import { Settings, Globe, Palette, HardDrive } from "lucide-react";

export default function SettingsPage() {
  const { uiLanguage, setUiLanguage, exportQuality, setExportQuality } = useEditorStore();
  const tr = useTranslation(uiLanguage);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center gap-3 px-6 py-4 border-b border-border bg-background/80">
          <Settings className="w-5 h-5 text-primary" />
          <h1 className="font-display text-2xl font-bold text-foreground">
            {tr("settings")}
          </h1>
        </header>

        <main className="flex-1 overflow-y-auto p-6 max-w-2xl">
          <div className="space-y-6">
            {/* Interface Language */}
            <section className="glass-card p-5 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-border">
                <Globe className="w-4 h-4 text-primary" />
                <h2 className="font-semibold text-foreground">Interface Language</h2>
              </div>
              <div className="flex gap-3">
                {(["en", "hi"] as const).map(lang => (
                  <button
                    key={lang}
                    onClick={() => setUiLanguage(lang)}
                    className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                      uiLanguage === lang
                        ? "bg-primary/20 border-primary text-primary"
                        : "border-border text-muted-foreground hover:border-primary/30"
                    }`}
                  >
                    {lang === "en" ? "🇬🇧 English" : "🇮🇳 हिंदी"}
                  </button>
                ))}
              </div>
            </section>

            {/* Export Defaults */}
            <section className="glass-card p-5 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-border">
                <HardDrive className="w-4 h-4 text-primary" />
                <h2 className="font-semibold text-foreground">Export Defaults</h2>
              </div>
              <div>
                <label className="field-label">Default Quality</label>
                <select
                  value={exportQuality}
                  onChange={e => setExportQuality(e.target.value as "720p" | "1080p" | "4k")}
                  className="field-select"
                >
                  <option value="720p">720p – Fast</option>
                  <option value="1080p">1080p – Recommended</option>
                  <option value="4k">4K – High Quality</option>
                </select>
              </div>
            </section>

            {/* About */}
            <section className="glass-card p-5 space-y-2">
              <div className="flex items-center gap-2 pb-3 border-b border-border">
                <Palette className="w-4 h-4 text-primary" />
                <h2 className="font-semibold text-foreground">About VizardFree</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                VizardFree v1.0.0 – Open-source, no watermark, fully self-hosted.
              </p>
              <p className="text-sm text-muted-foreground">
                Built for Hindi, Hinglish & Indian creators. 🇮🇳
              </p>
              <a
                href="https://github.com/vizardfree/vizardfree"
                target="_blank"
                rel="noreferrer"
                className="text-primary text-sm hover:underline inline-flex items-center gap-1 mt-2"
              >
                GitHub Repository →
              </a>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
