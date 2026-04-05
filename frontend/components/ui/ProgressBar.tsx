import { cn } from "@/lib/utils";

interface Props {
  value: number; // 0-100
  className?: string;
  color?: "primary" | "green" | "cyan";
  label?: string;
  showValue?: boolean;
}

const colors = {
  primary: "bg-primary",
  green: "bg-vf-green",
  cyan: "bg-vf-cyan",
};

export function ProgressBar({ value, className, color = "primary", label, showValue }: Props) {
  return (
    <div className={cn("space-y-1", className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between">
          {label && <span className="text-xs text-muted-foreground">{label}</span>}
          {showValue && <span className="text-xs font-mono text-muted-foreground">{Math.round(value)}%</span>}
        </div>
      )}
      <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-300", colors[color])}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
}
