"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function Tabs({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: { id: string; label: string; icon?: React.ReactNode; badge?: string | number }[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)} role="tablist">
      {tabs.map((t) => {
        const active = t.id === value;
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.id)}
            className={cn(
              "group inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-medium transition-all",
              active
                ? "neu-inset text-cyan glow-border-cyan"
                : "btn-neu text-muted hover:text-ink",
            )}
          >
            {t.icon}
            <span className="tracking-wide">{t.label}</span>
            {t.badge !== undefined && (
              <span className="ml-1 rounded bg-surface-3 px-1.5 py-0.5 font-mono text-[10px] text-muted">
                {t.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
