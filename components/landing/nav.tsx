"use client";

import { useState } from "react";
import Link from "next/link";
import { BarChart3, Github, Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const LINKS: [string, string][] = [
  ["Product", "/product"],
  ["How it works", "/how"],
  ["Capabilities", "/capabilities"],
  ["Pricing", "/pricing"],
  ["About", "/about"],
];

export function LandingNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <Logo />
          <span className="font-display text-base font-bold tracking-tight text-ink">
            Analyst<span className="font-script text-gradient ml-0.5 text-xl leading-none">ai</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {LINKS.map(([label, href]) => (
            <Link key={href} href={href} className="text-sm text-muted transition-colors hover:text-ink">
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="btn-neu hidden h-9 w-9 place-items-center rounded-xl text-muted hover:text-ink sm:grid"
            aria-label="GitHub"
          >
            <Github size={16} />
          </a>
          <ThemeToggle />
          <Link href="/studio" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "hidden sm:inline-flex")}>
            Sign in
          </Link>
          <Link href="/studio" className={cn(buttonVariants({ variant: "accent", size: "sm" }))}>
            Launch Studio
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="btn-neu grid h-9 w-9 place-items-center rounded-xl text-muted hover:text-ink md:hidden"
          >
            {open ? <X size={17} /> : <Menu size={17} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <nav className="border-t border-line bg-bg/95 backdrop-blur-xl md:hidden">
          <div className="mx-auto max-w-7xl px-5 py-3">
            {LINKS.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between rounded-xl px-3 py-3 text-[15px] text-ink transition-colors hover:bg-surface-2/60"
              >
                {label}
                <span className="font-mono text-xs text-muted">→</span>
              </Link>
            ))}
            <div className="mt-2 flex items-center gap-2 border-t border-line pt-3">
              <Link
                href="/studio"
                onClick={() => setOpen(false)}
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "flex-1")}
              >
                Sign in
              </Link>
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                onClick={() => setOpen(false)}
                className="btn-neu grid h-9 w-9 place-items-center rounded-xl text-muted hover:text-ink"
                aria-label="GitHub"
              >
                <Github size={16} />
              </a>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}

function Logo() {
  return (
    <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand-gradient text-white shadow-sm">
      <BarChart3 size={16} />
    </div>
  );
}
