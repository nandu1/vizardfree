"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

let _setToasts: React.Dispatch<React.SetStateAction<Toast[]>> | null = null;

export function toast(message: string, type: ToastType = "info") {
  if (!_setToasts) return;
  const id = Math.random().toString(36).slice(2);
  _setToasts(prev => [...prev, { id, type, message }]);
  setTimeout(() => {
    _setToasts?.(prev => prev.filter(t => t.id !== id));
  }, 4000);
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  useEffect(() => { _setToasts = setToasts; return () => { _setToasts = null; }; }, []);

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-vf-green" />,
    error: <AlertCircle className="w-4 h-4 text-destructive" />,
    info: <Info className="w-4 h-4 text-vf-cyan" />,
  };

  const colors = {
    success: "border-vf-green/30 bg-vf-green/10",
    error: "border-destructive/30 bg-destructive/10",
    info: "border-vf-cyan/30 bg-vf-cyan/10",
  };

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 60, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl",
              "min-w-[240px] max-w-[360px]",
              colors[t.type]
            )}
          >
            {icons[t.type]}
            <p className="text-sm text-foreground flex-1">{t.message}</p>
            <button
              onClick={() => setToasts(p => p.filter(x => x.id !== t.id))}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
