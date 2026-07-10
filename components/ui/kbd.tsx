import * as React from "react";
import { cn } from "@/lib/utils";

export function Kbd({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        "neu-inset inline-flex h-6 min-w-6 items-center justify-center rounded-md px-1.5 font-mono text-[11px] text-muted",
        className,
      )}
    >
      {children}
    </kbd>
  );
}
