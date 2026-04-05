"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Video, Scissors, Palette, Settings,
  ChevronLeft, ChevronRight, Zap, Globe
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEditorStore } from "@/lib/store";
import { useTranslation } from "@/lib/i18n";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { href: "/", icon: LayoutDashboard, labelKey: "dashboard" as const },
  { href: "/videos", icon: Video, labelKey: "my_videos" as const },
  { href: "/clips", icon: Scissors, labelKey: "clip_library" as const },
  { href: "/brand", icon: Palette, labelKey: "brand_kit" as const },
  { href: "/settings", icon: Settings, labelKey: "settings" as const },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, setSidebarCollapsed, uiLanguage, setUiLanguage } =
    useEditorStore();
  const tr = useTranslation(uiLanguage);

  return (
    <motion.aside
      animate={{ width: sidebarCollapsed ? 64 : 220 }}
      transition={{ type: "spring", stiffness: 400, damping: 35 }}
      className="flex flex-col h-screen bg-[#0D1117] border-r border-vf-border relative z-20 flex-shrink-0"
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-vf-border overflow-hidden">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-vf-purple to-vf-cyan flex items-center justify-center flex-shrink-0">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="font-display text-lg font-bold text-gradient whitespace-nowrap"
            >
              VizardFree
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto no-scrollbar">
        {navItems.map(({ href, icon: Icon, labelKey }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link key={href} href={href}>
              <div
                className={cn(
                  "sidebar-item",
                  active && "active",
                  sidebarCollapsed && "justify-center px-2"
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <AnimatePresence>
                  {!sidebarCollapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="truncate"
                    >
                      {tr(labelKey)}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Language Toggle */}
      <div className={cn("px-2 pb-2", sidebarCollapsed && "flex justify-center")}>
        <button
          onClick={() => setUiLanguage(uiLanguage === "en" ? "hi" : "en")}
          className={cn(
            "sidebar-item w-full",
            sidebarCollapsed && "justify-center px-2"
          )}
          title="Toggle Hindi / English UI"
        >
          <Globe className="w-5 h-5 flex-shrink-0" />
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs truncate"
              >
                {uiLanguage === "en" ? "हिंदी में" : "English"}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        className="absolute -right-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full
                   bg-vf-surface-2 border border-vf-border flex items-center justify-center
                   hover:bg-vf-surface-3 transition-colors z-30"
      >
        {sidebarCollapsed ? (
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
        ) : (
          <ChevronLeft className="w-3.5 h-3.5 text-muted-foreground" />
        )}
      </button>
    </motion.aside>
  );
}
