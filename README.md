# AnalystAI

> Your AI Business Analyst. Drop a file, get the story — insights, dashboards, forecasts and a board-ready report in seconds.

AnalystAI is an AI-powered business-analyst SaaS. You upload business data and it profiles it, surfaces the insights that matter, forecasts the next period, answers questions in plain English, and writes an executive report — with no SQL, spreadsheets or data team.

This repository is a **working vertical-slice prototype** of the core product loop. It runs fully in the browser with **zero API keys**, and has a pluggable AI orchestration layer that can route to any OpenAI-compatible LLM when you add a key.

---

## What works in this build (real, not mocked)

- **Landing page** — PromptQL-style instant-try: launch straight into the Studio, no signup required.
- **Auth gate** — one-click guest / email continue (simulated; real OAuth is on the roadmap).
- **Data ingest** — CSV, JSON, paste, and a built-in SaaS-revenue sample. Schema detection, type inference, missing-value & duplicate detection.
- **Data quality & cleaning** — outlier (IQR), skew, case-inconsistency, missing-value and duplicate detection with **one-click reversible fixes** (impute / winsorize / title-case / dedupe).
- **Exploratory analysis** — summary statistics, per-column profiles, correlation matrix heatmap, histograms, category bars, trend line.
- **AI business insights** — rule-based analyst that mines real insights (trend, seasonality, segmentation, concentration risk, correlation, distribution, outliers, forecast teaser), each with **confidence, supporting metrics, business impact and a recommended action**.
- **Chat analyst** — intent-routed, context-aware answers grounded in your numbers (trend, ranking, correlation, forecast, KPIs, quality, churn-proxy), with citations and conversation memory.
- **Predictive analytics** — Holt's linear-trend forecasting with 95% confidence bands, backtest accuracy (MAPE) and R²; tunable metric / aggregation / period / horizon.
- **KPI builder** — natural language → executable calculation (`"total revenue divided by distinct customer_id"`), with synonym/role resolution.
- **Dashboard** — auto KPI cards + charts grid + print-to-PDF export.
- **Executive report** — generated Markdown report (summary, insights, KPIs, forecast, risks, opportunities, action plan) with **copy / `.md` / `.html` / print-to-PDF** export.
- **AI orchestration layer** — task-based routing (`reasoning`, `sql`, `cleaning`, `chart-explanation`, `forecast-interpretation`, `report-writing`, `kpi-generation`, `chat`) with a per-task model map, a deterministic **local provider** (default) and an OpenAI-compatible **LLM provider** that falls back to local on error.
- **Design system** — neumorphism × cyberpunk × terminal dark, with light mode. Terminal typing demo, scanlines, neon hairlines, corner-bracket panels.
- **Tests** — unit tests for the statistics, parsing, insights, KPI and chat engines.

## On the roadmap (scaffolded in the architecture, not wired in this build)

Real OAuth (Google/Microsoft/SAML) + MFA · Stripe billing & credits · PostgreSQL multi-tenant schema with row-level security · DB connectors (Postgres/MySQL/SQL Server) · Google Sheets & REST API ingestion · Excel `.xlsx` parsing · Celery/background jobs · Redis caching · drag-and-drop dashboard builder · collaboration (comments, approvals, mentions, version history) · admin panel · Word/PPTX export · Docker/K8s · OpenTelemetry/Sentry/Prometheus.

The Studio sidebar links to **Reports / Datasets / Settings** placeholder pages that list exactly what each will contain.

---

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000
```

Open the site → **Launch Studio** → **Continue as guest** → **Load sample dataset** → explore the tabs.

### Scripts

| command | what it does |
| --- | --- |
| `npm run dev` | start the dev server |
| `npm run build` | production build |
| `npm run start` | run the production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | run the vitest suite |
| `npm run lint` | next lint |

### Enable the LLM (optional)

Everything works offline with the local analyst. To route `report-writing` (and any task you re-route) to an LLM, copy `.env.example` → `.env.local` and set:

```env
ANALYSTAI_AI_PROVIDER=llm
ANALYSTAI_LLM_BASE_URL=https://api.openai.com/v1
ANALYSTAI_LLM_API_KEY=sk-...
ANALYSTAI_LLM_MODEL_REPORT=gpt-4o
```

Any OpenAI-compatible chat-completions endpoint works (OpenAI, Vercel AI Gateway, etc.). When no key is present, every task uses the local provider; if an LLM call fails at runtime, it falls back to local so the UI never blanks.

---

## Architecture

```
app/                      Next.js App Router
  page.tsx                Landing (PromptQL-style instant try)
  studio/                 Auth-gated product shell + analyzer
    analyze/page.tsx      The full analyst experience (9 tabs)
  api/ai/route.ts         Server entry to the AI orchestrator (LLM when keyed)

components/
  ui/                     Neumorphic primitives (Button, Panel, Badge, Tabs, Stat…)
  landing/                Hero, terminal demo, capabilities, pricing
  studio/                 Shell, auth gate, upload, table, profile, EDA,
                          insights, chat, forecast, dashboard, report, KPI builder

lib/
  data/                   parse (CSV/JSON), schema inference, sample dataset
  analysis/               stats, profile, quality, correlation, insights,
                          forecast, chat, kpi  ← the deterministic analyst engine
  ai/                     orchestrator (task routing) + local/llm providers
  viz.ts                  chart palette + correlation heat color
  types.ts                shared domain types

tests/                    vitest unit tests for the engine
```

**Key idea:** the numbers always come from the deterministic engine in `lib/analysis`. The AI layer (`lib/ai`) is an orchestration abstraction on top — the local provider wraps the engine; the LLM provider rewrites prose using a compact, **row-free** context (schema + stats + insights + forecast summary). This keeps the product useful offline, cheap to run, and private by default.

See **[ARCHITECTURE.md](./ARCHITECTURE.md)** for the full design and **[DEPLOYMENT.md](./DEPLOYMENT.md)** for the Vercel deploy guide.

---

## Tech stack

Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS · Recharts · PapaParse · lucide-react · vitest.

## Design language

Neumorphism (soft extruded dark surfaces) × cyberpunk (neon hairlines, glow, grid) × terminal (monospace readouts, `>_` prompts, scanlines). Dark is the signature mode; light mode is fully supported via a toggle.

## License

Prototype — provided as-is for evaluation.
