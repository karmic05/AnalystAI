import * as React from "react";
import { cn } from "@/lib/utils";

type Tone = "cyan" | "magenta" | "purple" | "green" | "amber" | "red" | "muted";

const toneClass: Record<Tone, string> = {
  cyan: "text-[var(--cyan)] border-[color-mix(in_srgb,var(--cyan)_40%,transparent)]",
  magenta: "text-[var(--magenta)] border-[color-mix(in_srgb,var(--magenta)_40%,transparent)]",
  purple: "text-[var(--purple)] border-[color-mix(in_srgb,var(--purple)_40%,transparent)]",
  green: "text-[var(--green)] border-[color-mix(in_srgb,var(--green)_40%,transparent)]",
  amber: "text-[var(--amber)] border-[color-mix(in_srgb,var(--amber)_40%,transparent)]",
  red: "text-[var(--red)] border-[color-mix(in_srgb,var(--red)_40%,transparent)]",
  muted: "text-muted border-line",
};

export function Badge({
  tone = "muted",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border bg-surface-2/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider",
        toneClass[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
