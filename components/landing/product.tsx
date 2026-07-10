import Link from "next/link";
import {
  Brain,
  Bot,
  Cpu,
  Server,
  Cloud,
  Lock,
  ShieldCheck,
  GitBranch,
  Network,
  Gauge,
  LineChart,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const TWO_PARTS: { icon: LucideIcon; tag: string; title: string; body: string; tone: string }[] = [
  {
    icon: Brain,
    tag: "lib/analysis",
    title: "The engine",
    body:
      "Pure TypeScript functions for statistics, schema inference, profiling, data quality, correlation, insights, forecasting, chat, and KPIs. The same input always produces the same output. It runs in the browser today and can move to a server worker for large files without changing any call site.",
    tone: "var(--green)",
  },
  {
    icon: Bot,
    tag: "lib/ai",
    title: "The AI layer",
    body:
      "A task router. Each task has a route that names a provider, a model, and a token budget. The local provider wraps the engine. The LLM provider rewrites prose from a compact context. One config object controls the entire map.",
    tone: "var(--cyan)",
  },
];

const RUNS_WHERE: { icon: LucideIcon; title: string; body: string; tone: string }[] = [
  {
    icon: Cpu,
    title: "In your browser",
    body:
      "CSV and JSON parsing, schema inference, profiling, quality checks, correlation, insights, forecasting, KPIs, dashboards, and report generation. None of it needs a round trip.",
    tone: "var(--cyan)",
  },
  {
    icon: Server,
    title: "On the server",
    body:
      "Only /api/ai. It receives a compact, row-free context and calls the orchestrator. The local analyst returns in milliseconds, and the LLM call is the single network dependency.",
    tone: "var(--purple)",
  },
  {
    icon: Cloud,
    title: "On the roadmap",
    body:
      "Auth, multi-tenant storage, background jobs for large files, billing, and observability. Each piece is itemized in the production stack below.",
    tone: "var(--amber)",
  },
];

const INFRA: { icon: LucideIcon; title: string; body: string; tone: string }[] = [
  {
    icon: Lock,
    title: "Offline by default",
    body:
      "No API key, no account, and no network required for the core loop. Add a key only when you want LLM-grade report and chat prose.",
    tone: "var(--green)",
  },
  {
    icon: ShieldCheck,
    title: "Private by default",
    body:
      "When the LLM is enabled, the request carries schema, aggregate statistics, insight titles, and forecast summaries. Raw rows never leave the browser.",
    tone: "var(--cyan)",
  },
  {
    icon: GitBranch,
    title: "Graceful fallback",
    body:
      "If a key is missing or an LLM call fails, the orchestrator returns the local result. The UI never blanks, and a bad key never breaks a deploy.",
    tone: "var(--magenta)",
  },
  {
    icon: Network,
    title: "Pluggable providers",
    body:
      "Any OpenAI-compatible chat completions endpoint works: OpenAI, the Vercel AI Gateway, or a self-hosted model. Swap endpoints without touching app code.",
    tone: "var(--purple)",
  },
  {
    icon: Server,
    title: "Single entry point",
    body:
      "/api/ai is the only server route. One place to add auth, rate limits, logging, and tracing when you harden the product.",
    tone: "var(--cyan)",
  },
  {
    icon: Gauge,
    title: "Deterministic numbers",
    body:
      "Every metric and insight is computed by pure functions with no model in the path. Forecast accuracy is measured with a holdout MAPE, so you know how far to trust a projection.",
    tone: "var(--amber)",
  },
];

const PIPELINE: { n: string; title: string; body: string }[] = [
  { n: "01", title: "Ingest", body: "CSV or JSON through PapaParse, pasted text, or the built-in SaaS-revenue sample. Rows stay in memory." },
  { n: "02", title: "Schema", body: "Type inference picks number, date, boolean, or string. Role detection labels columns as revenue, cost, date, category, region, product, customer, or id." },
  { n: "03", title: "Profile and clean", body: "Missing values, duplicates, IQR outliers, skew, and case inconsistencies are flagged. Fixes such as impute, winsorize, title-case, and dedupe are one click and reversible." },
  { n: "04", title: "Correlate", body: "A Pearson matrix and the strongest pairs, so you can see what moves together before reading a generated insight." },
  { n: "05", title: "Insights", body: "Rule-based detection for trend, seasonality, segmentation, concentration risk, correlation, distribution, and outliers. Each insight ships with a confidence score, supporting metrics, business impact, and a recommended action." },
  { n: "06", title: "Forecast", body: "Pick a metric, an aggregation of day, week, or month, and a horizon. Holt's linear-trend projection runs with 95 percent confidence bands and a holdout MAPE from a train and test split." },
  { n: "07", title: "Ask and build", body: "Chat is intent-routed and grounded in your numbers with citations. The KPI builder compiles a phrase like revenue divided by distinct customers into a live calculation." },
  { n: "08", title: "Deliver", body: "Auto KPI cards, a charts grid, print to PDF, and a board-ready Markdown report with copy, .md, .html, and PDF export." },
];

const ROUTING: { n: string; title: string; body: string }[] = [
  { n: "01", title: "Request", body: "A task is raised: report-writing, chat, chart-explanation, forecast-interpretation, kpi-generation, or similar." },
  { n: "02", title: "Route lookup", body: "The orchestrator checks the route for that task and reads its provider, model, and max tokens." },
  { n: "03", title: "Default mapping", body: "Everything routes to the local provider by default. Only report-writing goes to the LLM, for the best prose. You can override any task." },
  { n: "04", title: "Compact context", body: "For an LLM task, a row-free context is serialized: schema, aggregate stats, insight titles, and a forecast summary. Raw rows stay local." },
  { n: "05", title: "Return or fall back", body: "On success the enriched result returns. On any error, the local result returns in its place." },
  { n: "06", title: "Render", body: "The UI renders the result either way. A failed LLM call looks the same as a local one, minus the polish." },
];

const ROADMAP: { label: string; value: string }[] = [
  { label: "Compute", value: "Vercel Fluid Compute on Node 24, with the 300s default timeout." },
  { label: "Auth", value: "Clerk or Auth.js with OAuth, MFA, and role-based access control." },
  { label: "Database", value: "PostgreSQL on Neon, with one row-level-security policy per workspace." },
  { label: "Cache and queue", value: "Redis for hot caches and the job queue." },
  { label: "Ingest", value: "Vercel Queues for large-file processing, Vercel Blob or S3 for uploads." },
  { label: "Billing", value: "Stripe plans with credit-metered AI usage." },
  { label: "Observability", value: "Sentry for errors, OpenTelemetry and Prometheus for metrics." },
  { label: "Self-host", value: "Docker and Kubernetes manifests for enterprise." },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function ProductDetail() {
  return (
    <div>
      {/* Intro */}
      <section className="relative mx-auto max-w-7xl px-5 pt-20">
        <SectionHead
          eyebrow="// product"
          title="How AnalystAI is built, and how it runs."
        />
        <div className="mt-6 max-w-3xl space-y-4 text-base leading-relaxed text-muted">
          <p>
            AnalystAI has two working parts. A deterministic analysis engine computes every
            number: summary statistics, correlations, forecasts, insights, KPIs, and the report
            structure. An AI orchestration layer sits on top of it and routes specific tasks to a
            language model when you want better prose. Because the numbers always come from the
            engine, they cannot be hallucinated.
          </p>
          <p>
            The core loop runs in your browser, so it is fast and private by default. A single
            optional server route handles LLM calls. This page documents what runs where, how
            requests flow, and what the production stack looks like.
          </p>
        </div>
      </section>

      {/* Two parts */}
      <section className="relative mx-auto max-w-7xl px-5 py-16">
        <div className="grid gap-4 md:grid-cols-2">
          {TWO_PARTS.map((p) => (
            <div key={p.title} className="panel rounded-2xl p-6">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-xl" style={{ background: `color-mix(in srgb, ${p.tone} 13%, transparent)`, color: p.tone }}>
                  <p.icon size={20} />
                </div>
                <div>
                  <div className="font-mono text-xs uppercase tracking-widest text-muted">{p.tag}</div>
                  <h3 className="text-lg font-semibold text-ink">{p.title}</h3>
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* What runs where */}
      <section className="relative mx-auto max-w-7xl px-5 py-12">
        <SectionHead eyebrow="// placement" title="What runs where" />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {RUNS_WHERE.map((c) => (
            <PanelCard key={c.title} icon={c.icon} title={c.title} body={c.body} tone={c.tone} />
          ))}
        </div>
      </section>

      {/* Infrastructure */}
      <section className="relative border-y border-line bg-surface/30">
        <div className="absolute inset-0 grid-bg opacity-40" />
        <div className="relative mx-auto max-w-7xl px-5 py-20">
          <SectionHead eyebrow="// infrastructure" title="The properties that matter." />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {INFRA.map((c) => (
              <PanelCard key={c.title} icon={c.icon} title={c.title} body={c.body} tone={c.tone} />
            ))}
          </div>
        </div>
      </section>

      {/* Workflows */}
      <section className="relative mx-auto max-w-7xl px-5 py-20">
        <SectionHead eyebrow="// workflows" title="From a raw file to a board report." />

        <div className="mt-10">
          <SubHead icon={LineChart} title="The analysis pipeline" tone="var(--green)" />
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PIPELINE.map((s) => (
              <StepCard key={s.n} n={s.n} title={s.title} body={s.body} />
            ))}
          </div>
        </div>

        <div className="mt-12">
          <SubHead icon={GitBranch} title="The AI routing flow" tone="var(--cyan)" />
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ROUTING.map((s) => (
              <StepCard key={s.n} n={s.n} title={s.title} body={s.body} />
            ))}
          </div>
        </div>
      </section>

      {/* Production roadmap */}
      <section className="relative mx-auto max-w-7xl px-5 py-12">
        <SectionHead eyebrow="// production target" title="The stack we are building toward." />
        <div className="panel mt-8 rounded-2xl p-2 sm:p-4">
          <ul className="divide-y divide-line">
            {ROADMAP.map((r) => (
              <li key={r.label} className="flex flex-col gap-1 px-4 py-4 sm:flex-row sm:items-center sm:gap-6">
                <span className="font-mono text-xs uppercase tracking-widest text-cyan/80 sm:w-44 shrink-0">
                  {r.label}
                </span>
                <span className="text-sm leading-relaxed text-muted">{r.value}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted">
          This prototype implements the client-side slice of that graph end to end. The pieces
          above are scaffolded in the architecture, not wired into this build.
        </p>
      </section>

      {/* CTA */}
      <section className="relative mx-auto max-w-7xl px-5 py-16">
        <div className="panel flex flex-col items-center gap-4 rounded-2xl p-8 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <h3 className="text-lg font-semibold text-ink">See it on real data.</h3>
            <p className="mt-1 text-sm text-muted">
              Load the built-in sample and run the full pipeline in the Studio. No signup needed.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <Link href="/capabilities" className={cn(buttonVariants({ variant: "ghost", size: "md" }))}>
              Capabilities
            </Link>
            <Link href="/studio" className={cn(buttonVariants({ variant: "accent", size: "lg" }))}>
              Launch the Studio <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Pieces                                                             */
/* ------------------------------------------------------------------ */

function SectionHead({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="max-w-2xl">
      <div className="eyebrow">{eyebrow}</div>
      <h2 className="mt-4 text-3xl font-bold tracking-tight text-ink sm:text-4xl">{title}</h2>
    </div>
  );
}

function SubHead({ icon: Icon, title, tone }: { icon: LucideIcon; title: string; tone: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon size={18} style={{ color: tone }} />
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
    </div>
  );
}

function PanelCard({
  icon: Icon,
  title,
  body,
  tone,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  tone: string;
}) {
  return (
    <div className="panel card-hover group rounded-2xl p-6">
      <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl" style={{ background: `color-mix(in srgb, ${tone} 13%, transparent)`, color: tone }}>
        <Icon size={20} />
      </div>
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
    </div>
  );
}

function StepCard({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="neu rounded-2xl p-5">
      <div className="font-display text-3xl font-bold text-gradient">{n}</div>
      <h3 className="mt-3 text-sm font-semibold text-ink">{title}</h3>
      <p className="mt-2 text-xs leading-relaxed text-muted">{body}</p>
    </div>
  );
}
