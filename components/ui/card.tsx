import * as React from "react";
import { cn } from "@/lib/utils";

export function Panel({ className, children, glow, ...props }: React.HTMLAttributes<HTMLDivElement> & { glow?: "cyan" | "magenta" | "purple" }) {
  return (
    <div
      className={cn(
        "panel rounded-2xl",
        glow === "cyan" && "glow-border-cyan",
        glow === "magenta" && "glow-border-magenta",
        glow === "purple" && "glow-border-purple",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function Neu({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("neu rounded-2xl", className)} {...props}>
      {children}
    </div>
  );
}

export const Card = Panel;

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex items-center justify-between gap-3 px-5 pt-4 pb-3 border-b border-line", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, prompt }: React.HTMLAttributes<HTMLHeadingElement> & { prompt?: boolean }) {
  return (
    <h3 className={cn("text-sm font-semibold tracking-wide text-ink", prompt && "prompt", className)}>{children}</h3>
  );
}

export function CardBody({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-5", className)} {...props}>
      {children}
    </div>
  );
}
