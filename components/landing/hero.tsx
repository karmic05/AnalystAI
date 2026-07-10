"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TerminalDemo } from "./terminal-demo";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-60" />
      <div className="absolute inset-0 radial-glow" />
      <div className="relative mx-auto grid max-w-7xl gap-12 px-5 pb-20 pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:pt-24">
        <div className="flex flex-col justify-center">
          <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-line bg-surface/60 px-3 py-1 font-mono text-[11px] text-muted">
            <Sparkles size={12} className="text-cyan" />
            <span>v0.1 · public beta · works offline, no signup to try</span>
          </div>

          <h1 className="font-sans text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            Your AI <span className="neon-cyan">Business Analyst</span>.
            <br />
            Drop a file. Get the story.
          </h1>

          <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
            Upload a CSV and AnalystAI profiles your data, surfaces the insights that matter,
            forecasts the next period, and writes the board report in seconds. No SQL,
            no spreadsheets, no data team.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/studio" className={cn(buttonVariants({ variant: "accent", size: "lg" }))}>
              Launch the Studio <ArrowRight size={16} />
            </Link>
            <Link href="/how" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
              See how it works
            </Link>
          </div>

          <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4">
            {[
              ["11", "analysis modules"],
              ["<5s", "to first insight"],
              ["0", "API keys required"],
            ].map(([n, l]) => (
              <div key={l} className="neu rounded-xl p-3">
                <div className="font-mono text-2xl font-semibold text-cyan">{n}</div>
                <div className="mt-0.5 text-xs text-muted">{l}</div>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative lg:animate-floaty">
          <div className="absolute -inset-3 rounded-3xl bg-cyan/10 blur-2xl" />
          <div className="relative">
            <TerminalDemo />
          </div>
        </div>
      </div>
    </section>
  );
}
