"use client";

import Link from "next/link";
import {
  Area, AreaChart, Bar, BarChart, Cell, ResponsiveContainer, XAxis,
} from "recharts";
import {
  Brain, LineChart, Sparkles, FileText, Bot, ShieldCheck, Zap, Table2, Wand2, Download, Check,
  ArrowRight, UploadCloud, Wrench, MessageSquare, TrendingUp, MapPin, CalendarRange,
  ArrowDown, Terminal,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { NotebookPreview } from "@/components/landing/notebook-preview";
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

/* ------------------------------------------------------------------ */
/*  How it works — elaborate, visual walkthrough                       */
/* ------------------------------------------------------------------ */

const REVENUE_MINI = [
  { m: "Jan", v: 182 }, { m: "Feb", v: 168 }, { m: "Mar", v: 205 }, { m: "Apr", v: 224 },
  { m: "May", v: 246 }, { m: "Jun", v: 271 }, { m: "Jul", v: 263 }, { m: "Aug", v: 298 },
  { m: "Sep", v: 332 }, { m: "Oct", v: 351 }, { m: "Nov", v: 388 }, { m: "Dec", v: 412 },
];
const FORECAST_MINI = [
  { m: "Oct", v: 351, f: null }, { m: "Nov", v: 388, f: null }, { m: "Dec", v: 412, f: 412 },
  { m: "Jan", v: null, f: 431 }, { m: "Feb", v: null, f: 449 }, { m: "Mar", v: null, f: 470 },
];
const CATEGORY_MINI = [
  { k: "N. America", v: 38 }, { k: "Europe", v: 27 }, { k: "APAC", v: 19 }, { k: "LATAM", v: 10 }, { k: "MEA", v: 6 },
];

const HOW_STEPS: {
  n: string; eyebrow: string; title: string; body: string; bullets: string[];
  tone: string; icon: LucideIconType; visual: React.ReactNode;
}[] = [
  {
    n: "01", eyebrow: "ingest", tone: "var(--cyan)", icon: UploadCloud,
    title: "Drop a file — it's understood instantly",
    body: "Upload a CSV or JSON, paste a table, or load a built-in sample. Everything is parsed in your browser, so nothing leaves your machine. AnalystAI infers each column's type and its business role, and flags quality issues before you ever run an analysis.",
    bullets: ["Schema + type inference", "Role detection (revenue, date, region…)", "Missing-value & duplicate scan"],
    visual: <IngestVisual />,
  },
  {
    n: "02", eyebrow: "clean", tone: "var(--purple)", icon: Wrench,
    title: "One-click, reversible cleaning",
    body: "The engine surfaces outliers, skew, case inconsistencies, missing values and duplicates — each with a plain-English recommendation and a one-click fix. Every fix is reversible, and the numbers recompute the moment you apply one.",
    bullets: ["IQR outliers & skew", "Impute / winsorize / dedupe", "Every fix reversible"],
    visual: <CleanVisual />,
  },
  {
    n: "03", eyebrow: "analyze", tone: "var(--magenta)", icon: Brain,
    title: "Deterministic analysis, grounded in your numbers",
    body: "Trend, seasonality, segmentation, concentration risk, correlations, distributions and outliers — plus deep analyses like sentiment, keywords, Pareto and cohort retention. Every insight carries a confidence score, an impact rating and a recommended action.",
    bullets: ["11 analysis modules", "Confidence + impact on every insight", "Numbers computed, never hallucinated"],
    visual: <InsightVisual />,
  },
  {
    n: "04", eyebrow: "forecast", tone: "var(--amber)", icon: TrendingUp,
    title: "Project the next quarter, with honest error bars",
    body: "Holt's linear-trend forecasting projects your headline metric forward with 95% confidence bands, and reports its own backtest accuracy (MAPE) so you know exactly how far to trust it. Tune the metric, aggregation and horizon.",
    bullets: ["95% confidence bands", "Holdout MAPE + R²", "Tunable horizon & period"],
    visual: <ForecastVisual />,
  },
  {
    n: "05", eyebrow: "ask", tone: "var(--green)", icon: MessageSquare,
    title: "Ask in plain English — every section responds",
    body: "Type a question and the analyst answers with your real numbers and citations. A prompt also re-focuses the whole workspace: ask about “revenue by region” and Insights, EDA, Forecast and the dashboard all re-derive to match. With a Groq key, the prose is LLM-authored over those computed figures.",
    bullets: ["Prompt-driven cross-section focus", "Grounded, cited answers", "Groq-powered prose (optional)"],
    visual: <ChatVisual />,
  },
  {
    n: "06", eyebrow: "report", tone: "var(--cyan)", icon: FileText,
    title: "A board-ready report in one click",
    body: "Everything rolls up into an executive report — summary, insights, KPIs, forecast, risks, opportunities and an action plan. Copy it, export Markdown/HTML, or print straight to PDF.",
    bullets: ["Executive Markdown report", "Copy · .md · .html · PDF", "Auto KPI cards + charts grid"],
    visual: <ReportVisual />,
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="relative border-y border-line bg-surface-2/40">
      <div className="absolute inset-0 grid-bg opacity-40" />
      <div className="relative mx-auto max-w-7xl px-5 py-24">
        {/* Intro */}
        <div className="max-w-3xl">
          <div className="eyebrow">// how it works</div>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-ink sm:text-5xl">
            From a raw file to a board report,
            <br className="hidden sm:block" /> <span className="text-gradient">without a data team.</span>
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-muted">
            AnalystAI runs the whole analyst loop for you — ingest, clean, analyze, forecast, ask and report.
            The numbers are computed by a deterministic engine (so they can&apos;t be hallucinated); the AI
            writes the story around them. Here&apos;s the full pipeline, end to end.
          </p>
          <p className="mt-4 font-script text-2xl text-purple/90">watch it think out loud ↓</p>
        </div>

        {/* Live notebook preview — the real product surface */}
        <div className="mt-10 grid items-center gap-8 lg:grid-cols-[1fr_0.9fr]">
          <div className="order-2 lg:order-1">
            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted">
              <Terminal size={13} className="text-cyan" /> live preview · the actual studio notebook
            </div>
            <h3 className="mt-3 text-2xl font-bold tracking-tight text-ink">One screen, the whole story</h3>
            <p className="mt-3 leading-relaxed text-muted">
              This is a real AnalystAI notebook: a trend chart, ranked insights and a grounded chat answer,
              all stitched from the same dataset. No dashboards to wire, no SQL to write — you read the story
              top to bottom.
            </p>
            <ul className="mt-5 space-y-2.5">
              {["Charts + insights + chat in one flow", "Every figure traces back to your data", "Runs offline; Groq only polishes the prose"].map((t) => (
                <li key={t} className="flex items-start gap-2.5 text-sm text-muted">
                  <Check size={15} className="mt-0.5 shrink-0 text-cyan" /> {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative order-1 lg:order-2">
            <div className="absolute -inset-4 rounded-[2rem] bg-brand-gradient-soft blur-2xl" />
            <div className="relative">
              <NotebookPreview />
            </div>
          </div>
        </div>

        {/* The pipeline, step by step */}
        <div className="mt-20">
          <div className="flex items-center gap-3">
            <div className="eyebrow">// the pipeline</div>
            <div className="h-px flex-1 bg-line" />
          </div>

          <div className="mt-10 space-y-5">
            {HOW_STEPS.map((s, i) => (
              <div key={s.n} className="relative">
                <StepRow step={s} flip={i % 2 === 1} />
                {i < HOW_STEPS.length - 1 && (
                  <div className="flex justify-center py-1">
                    <ArrowDown size={18} className="text-line" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="panel mt-16 flex flex-col items-center gap-4 rounded-2xl p-8 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <h3 className="text-lg font-semibold text-ink">See the whole loop on your own data.</h3>
            <p className="mt-1 text-sm text-muted">Load the built-in sample and run every step in the Studio. No signup needed.</p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <Link href="/capabilities" className={cn(buttonVariants({ variant: "ghost", size: "md" }))}>Capabilities</Link>
            <Link href="/studio" className={cn(buttonVariants({ variant: "accent", size: "lg" }))}>
              Launch the Studio <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

type LucideIconType = typeof Brain;

function StepRow({ step, flip }: { step: (typeof HOW_STEPS)[number]; flip: boolean }) {
  return (
    <div className="panel grid gap-6 rounded-2xl p-6 sm:p-7 lg:grid-cols-2 lg:gap-10">
      <div className={cn("flex flex-col justify-center", flip && "lg:order-2")}>
        <div className="flex items-center gap-3">
          <span
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl"
            style={{ background: `color-mix(in srgb, ${step.tone} 14%, transparent)`, color: step.tone }}
          >
            <step.icon size={20} />
          </span>
          <div>
            <div className="font-mono text-[11px] uppercase tracking-widest text-muted">
              step {step.n} · {step.eyebrow}
            </div>
            <h3 className="text-xl font-bold tracking-tight text-ink">{step.title}</h3>
          </div>
        </div>
        <p className="mt-4 leading-relaxed text-muted">{step.body}</p>
        <ul className="mt-4 flex flex-wrap gap-2">
          {step.bullets.map((b) => (
            <li key={b} className="rounded-lg border border-line bg-surface-2/60 px-2.5 py-1 font-mono text-[11px] text-muted">
              {b}
            </li>
          ))}
        </ul>
      </div>
      <div className={cn("flex items-center", flip && "lg:order-1")}>
        <div className="w-full">{step.visual}</div>
      </div>
    </div>
  );
}

/* ── Step visuals (real-looking product surfaces) ─────────────────── */

function CellFrame({ label, accent, children }: { label: string; accent?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-surface-2/50 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[11px] text-muted">{label}</span>
        {accent && <span className="font-mono text-[10px]" style={{ color: accent }}>●</span>}
      </div>
      {children}
    </div>
  );
}

function IngestVisual() {
  const cols = [
    ["date", "date", "var(--cyan)"], ["region", "category · region", "var(--purple)"],
    ["revenue", "number · revenue", "var(--green)"], ["units", "number", "var(--amber)"],
  ];
  return (
    <CellFrame label="# detected schema · sample_saas_revenue.csv">
      <div className="space-y-1.5">
        {cols.map(([name, role, tone]) => (
          <div key={name} className="flex items-center justify-between rounded-md bg-surface/70 px-2.5 py-1.5">
            <span className="font-mono text-xs text-ink">{name}</span>
            <span className="rounded px-1.5 py-0.5 font-mono text-[10px]" style={{ background: `color-mix(in srgb, ${tone} 15%, transparent)`, color: tone as string }}>{role}</span>
          </div>
        ))}
      </div>
      <div className="mt-2.5 flex items-center gap-2 font-mono text-[10px] text-muted">
        <span className="text-neon">✓ 786 rows</span> · <span>11 columns</span> · <span className="text-amber">3 quality flags</span>
      </div>
    </CellFrame>
  );
}

function CleanVisual() {
  const fixes = [
    ["3 missing in units", "impute median", "var(--amber)"],
    ["1 duplicate row", "dedupe", "var(--purple)"],
    ["revenue right-skewed", "winsorize 1%", "var(--cyan)"],
  ];
  return (
    <CellFrame label="# data quality" accent="var(--amber)">
      <ul className="space-y-2">
        {fixes.map(([issue, fix, tone]) => (
          <li key={issue} className="flex items-center justify-between rounded-md bg-surface/70 px-2.5 py-1.5">
            <span className="flex items-center gap-2 text-[13px] text-ink">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: tone as string }} /> {issue}
            </span>
            <span className="inline-flex items-center gap-1 rounded-md border border-line px-2 py-0.5 font-mono text-[10px] text-muted">
              <Wand2 size={10} /> {fix}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-2.5 font-mono text-[10px] text-neon">✓ all fixes reversible · numbers recompute live</div>
    </CellFrame>
  );
}

function InsightVisual() {
  const insights = [
    { icon: TrendingUp, tone: "var(--cyan)", text: "Revenue up 42% over 12 months", meta: "R²=0.91 · high impact · 88%" },
    { icon: MapPin, tone: "var(--purple)", text: "N. America leads with 38%", meta: "concentration risk · low" },
    { icon: CalendarRange, tone: "var(--amber)", text: "Peak Nov, trough Feb (±18%)", meta: "seasonality · 0.6 strength" },
  ];
  return (
    <CellFrame label="# insights · ranked by impact × confidence">
      <ul className="space-y-2">
        {insights.map((ins) => (
          <li key={ins.text} className="flex items-start gap-2.5 rounded-md bg-surface/70 px-2.5 py-1.5">
            <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md" style={{ background: `color-mix(in srgb, ${ins.tone} 14%, transparent)`, color: ins.tone }}>
              <ins.icon size={13} />
            </span>
            <div className="min-w-0">
              <div className="text-[13px] leading-tight text-ink">{ins.text}</div>
              <div className="font-mono text-[10px] text-muted">{ins.meta}</div>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {["sentiment", "pareto", "cohort", "keywords"].map((t) => (
          <span key={t} className="rounded bg-surface-3/70 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-muted">+ {t}</span>
        ))}
      </div>
    </CellFrame>
  );
}

function ForecastVisual() {
  return (
    <CellFrame label="# forecast · next 3 months" accent="var(--amber)">
      <ResponsiveContainer width="100%" height={128}>
        <AreaChart data={FORECAST_MINI} margin={{ top: 6, right: 4, bottom: 0, left: 4 }}>
          <defs>
            <linearGradient id="howFcFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--amber)" stopOpacity={0.32} />
              <stop offset="100%" stopColor="var(--amber)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="m" tick={{ fill: "var(--text-faint)", fontSize: 10, fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} />
          <Area type="monotone" dataKey="v" stroke="var(--cyan)" strokeWidth={2.5} fill="none" dot={false} connectNulls />
          <Area type="monotone" dataKey="f" stroke="var(--amber)" strokeWidth={2.5} strokeDasharray="4 3" fill="url(#howFcFill)" dot={false} connectNulls />
        </AreaChart>
      </ResponsiveContainer>
      <div className="mt-1.5 flex items-center justify-between font-mono text-[10px]">
        <span className="text-cyan">— actual</span>
        <span className="text-amber">-- forecast · MAPE 6.2%</span>
        <span className="text-muted">next: $431K ±22K</span>
      </div>
    </CellFrame>
  );
}

function ChatVisual() {
  return (
    <CellFrame label="# ask the analyst" accent="var(--green)">
      <div className="rounded-lg rounded-bl-sm bg-surface-3/70 px-3 py-2 text-[13px] text-ink">
        Analyze revenue by region and flag any risk.
      </div>
      <div className="mt-2 flex items-start gap-2">
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-brand-gradient text-white"><Sparkles size={12} /></span>
        <div className="rounded-lg rounded-bl-sm border border-line bg-surface px-3 py-2 text-[13px] leading-snug text-muted">
          N. America drives 38% of revenue — healthy, but watch the 65% top-3 concentration.{" "}
          <span className="text-cyan">[insight · 84%]</span>
        </div>
      </div>
      <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-md bg-green/5 px-2.5 py-1.5 font-mono text-[10px] text-green">
        ▸ reflected across
        {["insights", "eda", "forecast", "dashboard"].map((t) => (
          <span key={t} className="text-cyan">{t}</span>
        ))}
      </div>
    </CellFrame>
  );
}

function ReportVisual() {
  return (
    <CellFrame label="# executive report.md" accent="var(--cyan)">
      <div className="space-y-2">
        <div className="h-2.5 w-2/5 rounded bg-surface-3" />
        <div className="flex items-center gap-2">
          <span className="rounded bg-brand-gradient px-1.5 py-0.5 font-mono text-[9px] text-white">✦ Groq</span>
          <div className="h-2 flex-1 rounded bg-surface-3/70" />
        </div>
        <div className="h-2 w-full rounded bg-surface-3/60" />
        <div className="h-2 w-11/12 rounded bg-surface-3/60" />
        <div className="grid grid-cols-3 gap-2 pt-1">
          {[["Total", "$3.4M"], ["Avg/mo", "$284K"], ["Next Q", "+9%"]].map(([l, v]) => (
            <div key={l} className="rounded-md border border-line bg-surface/70 p-2">
              <div className="font-mono text-[9px] uppercase tracking-wider text-muted">{l}</div>
              <div className="font-display text-sm font-bold text-gradient">{v}</div>
            </div>
          ))}
        </div>
        <div className="mt-1">
          <ResponsiveContainer width="100%" height={54}>
            <BarChart data={CATEGORY_MINI} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
              <Bar dataKey="v" radius={[2, 2, 0, 0]}>
                {CATEGORY_MINI.map((_, i) => <Cell key={i} fill={CHART_TONES[i % CHART_TONES.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {["copy", ".md", ".html", "PDF"].map((t) => (
          <span key={t} className="rounded border border-line px-1.5 py-0.5 font-mono text-[9px] text-muted">{t}</span>
        ))}
      </div>
    </CellFrame>
  );
}

const CHART_TONES = ["var(--cyan)", "var(--magenta)", "var(--purple)", "var(--green)", "var(--amber)"];

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
