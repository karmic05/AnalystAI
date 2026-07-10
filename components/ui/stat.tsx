import * as React from "react";
import { cn } from "@/lib/utils";

export function Stat({
  label,
  value,
  sub,
  tone = "cyan",
  className,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  tone?: "cyan" | "magenta" | "purple" | "green" | "amber" | "red" | "muted";
  className?: string;
}) {
  const color = `var(--${tone === "muted" ? "text-dim" : tone})`;
  return (
    <div className={cn("neu rounded-2xl p-4", className)}>
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">{label}</div>
      <div className="mt-1.5 font-mono text-2xl font-semibold" style={{ color }}>
        {value}
      </div>
      {sub && <div className="mt-1 text-xs text-muted">{sub}</div>}
    </div>
  );
}
