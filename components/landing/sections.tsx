"use client";

import Link from "next/link";
import {
  Brain, LineChart, Sparkles, FileText, Bot, ShieldCheck, Zap, Table2, Wand2, Download, Check,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const CAPABILITIES = [
  { icon: Table2, title: "Smart ingest", body: "CSV, JSON, paste. Auto schema detection, type inference, missing-value & duplicate detection.", tone: "var(--cyan)" },
  { icon: Wand2, title: "AI data cleaning", body: "Detects outliers, skew, case inconsistencies, and missing values, then offers one-click reversible fixes.", tone: "var(--purple)" },
  { icon: LineChart, title: "Exploratory analysis", body: "Summary stats, a correlation matrix, histograms, distributions, and trend and seasonality detection, all auto-generated.", tone: "var(--green)" },
  { icon: Brain, title: "Business insights", body: "Revenue drivers, segmentation, concentration risk, and correlations, each with a confidence score, an impact rating, and a recommended action.", tone: "var(--magenta)" },
  { icon: Bot, title: "Chat analyst", body: "Ask in plain English. Answers are context-aware and grounded in your numbers, and the analyst remembers the conversation.", tone: "var(--cyan)" },
  { icon: Sparkles, title: "Predictive analytics", body: "Holt's-trend forecasting with 95% confidence bands and backtest accuracy (MAPE). Tune horizon & aggregation.", tone: "var(--amber)" },
  { icon: Zap, title: "KPI builder", body: "Describe a KPI in words, such as \"revenue divided by active customers,\" and it compiles to a live calculation.", tone: "var(--purple)" },
  { icon: FileText, title: "Executive reports", body: "A board-ready Markdown report: summary, insights, KPIs, forecast, risks, opportunities, action plan.", tone: "var(--green)" },
  { icon: Download, title: "Dashboards & export", body: "KPI cards + charts grid, print-to-PDF and Markdown/HTML export. Dark signature theme + light mode.", tone: "var(--cyan)" },
];

const STEPS = [
  { n: "01", title: "Upload or paste", body: "Drop a CSV/JSON or load the built-in sample. Schema, types and quality are detected instantly." },
  { n: "02", title: "AnalystAI reasons", body: "The engine profiles, correlates, detects seasonality and computes insights with confidence scores." },
  { n: "03", title: "Ask, forecast, report", body: "Chat in plain English, project the next quarter, and export a board-ready report." },
];

const PRICING = [
  { name: "Free", price: "$0", tag: "forever", feats: ["3 datasets", "Full analysis engine", "Chat & forecasts", "Markdown export"], cta: "Launch Studio", accent: false },
  { name: "Professional", price: "$29", tag: "/mo", feats: ["Unlimited datasets", "LLM-powered reports & chat", "Executive PDF/Word export", "Saved dashboards", "1M-row datasets"], cta: "Start Pro", accent: true },
  { name: "Enterprise", price: "Custom", tag: "", feats: ["SSO + RBAC", "Dedicated forecasting models", "DB connectors & API ingestion", "Audit logs & SLA", "On-prem option"], cta: "Talk to us", accent: false },
];

export function Capabilities() {
  return (
    <section id="capabilities" className="relative mx-auto max-w-7xl px-5 py-24">
      <SectionHead eyebrow="// capabilities" title="One analyst. Every angle on your data." />
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CAPABILITIES.map((c) => (
          <div key={c.title} className="panel card-hover group rounded-2xl p-6">
            <div
              className="mb-4 grid h-11 w-11 place-items-center rounded-xl"
              style={{ background: `color-mix(in srgb, ${c.tone} 13%, transparent)`, color: c.tone }}
            >
              <c.icon size={20} />
            </div>
            <h3 className="text-base font-semibold text-ink">{c.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{c.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function HowItWorks() {
  return (
    <section id="how" className="relative border-y border-line bg-surface-2/40">
      <div className="absolute inset-0 grid-bg opacity-40" />
      <div className="relative mx-auto max-w-7xl px-5 py-24">
        <SectionHead eyebrow="// how it works" title="From raw file to board report in three steps." />
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="neu rounded-2xl p-6">
              <div className="font-display text-4xl font-bold text-gradient">{s.n}</div>
              <h3 className="mt-4 text-lg font-semibold text-ink">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Pricing() {
  return (
    <section id="pricing" className="relative mx-auto max-w-7xl px-5 py-24">
      <SectionHead eyebrow="// pricing" title="Start free. Upgrade when you need the LLM." />
      <div className="mt-12 grid items-start gap-4 lg:grid-cols-3">
        {PRICING.map((p) => (
          <div
            key={p.name}
            className={cn(
              "panel relative rounded-2xl p-6",
              p.accent ? "border-gradient shadow-glow-purple" : "card-hover",
            )}
          >
            {p.accent && (
              <span className="absolute -top-3 left-6 inline-flex items-center gap-1 rounded-full bg-brand-gradient px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-white shadow-sm">
                most popular
              </span>
            )}
            <div className="font-mono text-xs uppercase tracking-widest text-muted">{p.name}</div>
            <div className="mt-3 flex items-end gap-1">
              <span className="font-display text-4xl font-bold text-ink">{p.price}</span>
              <span className="mb-1.5 text-sm text-muted">{p.tag}</span>
            </div>
            <ul className="mt-6 space-y-3">
              {p.feats.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-muted">
                  <Check size={15} className={cn("mt-0.5 shrink-0", p.accent ? "text-purple" : "text-cyan")} />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/studio"
              className={cn(buttonVariants({ variant: p.accent ? "accent" : "default" }), "mt-7 w-full")}
            >
              {p.cta}
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}

export function TrustBar() {
  return (
    <section id="product" className="mx-auto max-w-7xl px-5 pt-20">
      <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 font-mono text-xs uppercase tracking-widest text-muted">
        <span className="flex items-center gap-2"><ShieldCheck size={14} className="text-green" /> encryption in transit</span>
        <span className="flex items-center gap-2"><Zap size={14} className="text-amber" /> 1M+ row datasets</span>
        <span className="flex items-center gap-2"><Bot size={14} className="text-cyan" /> multi-model routing</span>
        <span className="flex items-center gap-2"><FileText size={14} className="text-purple" /> PDF · Word · Markdown</span>
      </div>
    </section>
  );
}

function SectionHead({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="max-w-2xl">
      <div className="eyebrow">{eyebrow}</div>
      <h2 className="mt-4 text-3xl font-bold tracking-tight text-ink sm:text-4xl">{title}</h2>
    </div>
  );
}
