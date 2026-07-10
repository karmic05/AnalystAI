"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { NotebookPreview } from "./notebook-preview";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 radial-glow" />
      <div className="relative mx-auto grid max-w-7xl gap-12 px-5 pb-24 pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:pt-28">
        <div className="flex flex-col justify-center">
          <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-line bg-surface/70 px-3 py-1 font-mono text-[11px] text-muted shadow-sm backdrop-blur">
            <Sparkles size={12} className="text-purple" />
            <span>v0.1 · public beta · works offline, no signup to try</span>
          </div>

          <h1 className="font-display text-4xl font-bold leading-[1.04] tracking-tight sm:text-5xl lg:text-[3.75rem]">
            Your AI <span className="text-gradient">Business Analyst</span>.
            <br />
            Drop a file. Get the story.
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
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

          <p className="mt-6 font-script text-2xl text-purple/90">your AI analyst, standing by.</p>

          <dl className="mt-12 grid max-w-lg grid-cols-3 gap-4">
            {[
              ["11", "analysis modules"],
              ["<5s", "to first insight"],
              ["0", "API keys required"],
            ].map(([n, l]) => (
              <div key={l} className="neu rounded-2xl p-4">
                <div className="font-display text-3xl font-bold text-gradient">{n}</div>
                <div className="mt-1 text-xs text-muted">{l}</div>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative lg:animate-floaty">
          <div className="absolute -inset-4 rounded-[2rem] bg-brand-gradient-soft blur-2xl" />
          <div className="relative">
            <NotebookPreview />
          </div>
        </div>
      </div>
    </section>
  );
}
