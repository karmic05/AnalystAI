"use client";

import Link from "next/link";
import { BarChart3, Github } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LandingNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/60 bg-bg/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2.5">
          <Logo />
          <span className="font-mono text-sm font-semibold tracking-widest text-ink">
            ANALYST<span className="text-cyan">AI</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {[
            ["Product", "/product"],
            ["How it works", "/how"],
            ["Capabilities", "/capabilities"],
            ["Pricing", "/pricing"],
          ].map(([label, href]) => (
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
            className="btn-neu grid h-9 w-9 place-items-center rounded-xl text-muted hover:text-cyan"
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
        </div>
      </div>
    </header>
  );
}

function Logo() {
  return (
    <div className="neu-sm grid h-8 w-8 place-items-center rounded-lg glow-border-cyan">
      <BarChart3 size={16} className="text-cyan" />
    </div>
  );
}
