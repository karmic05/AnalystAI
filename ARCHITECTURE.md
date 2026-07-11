# Architecture

## Design principles

1. **The numbers are deterministic.** Every metric, insight, forecast and chat answer is computed by the pure engine in `lib/analysis`. There is no hallucination risk on the data itself.
2. **AI is an orchestration layer on top.** `lib/ai` routes *tasks* to *providers*. The default provider is `local` (wraps the engine); an `llm` provider rewrites prose using a compact, **row-free** context.
3. **Offline-first.** The product is fully useful with no API key. The LLM is an optional upgrade for richer report/chat prose.
4. **Privacy by default.** When the LLM is enabled, only schema + aggregate stats + insight titles + forecast summaries are sent — never raw rows.

## The analysis engine (`lib/analysis`)

| module | responsibility |
| --- | --- |
| `stats.ts` | mean, median, quantile, std, Pearson, OLS linear regression, MAPE, Holt's linear-trend forecast, IQR outlier mask, skewness, histogram |
| `data/schema.ts` | type inference (number/date/boolean/string) + semantic role detection (revenue/cost/profit/quantity/price/date/category/region/product/customer/id) |
| `data/parse.ts` | CSV (PapaParse) + JSON ingestion |
| `data/sample.ts` | deterministic seed datasets: SaaS revenue + product reviews |
| `profile.ts` | dataset profile, column selectors, group-by aggregation |
| `quality.ts` | missing/duplicate/outlier/skew/inconsistency detection + reversible auto-fixes |
| `correlation.ts` | Pearson correlation matrix + top pairs (optional anchor metric) |
| `insights.ts` | rule-based insight generation (trend, seasonality, segmentation, concentration, correlation, distribution, outliers, forecast teaser) with confidence/impact/action |
| `forecast.ts` | period aggregation (day/week/month) + Holt forecasting + holdout MAPE + 95% bands |
| `sentiment.ts` + `sentiment-lexicon.ts` | AFINN-style lexicon sentiment scoring (negation + intensifiers) → pos/neg/neutral distribution + examples |
| `text.ts` | word-frequency keyword/theme extraction on a text column (stopword-filtered) |
| `pareto.ts` | Pareto / 80-20 concentration (vital few, cumulative share) |
| `cohort.ts` | first-period customer cohorts × metric contribution + retention over time |
| `chat.ts` | intent-routed, context-aware Q&A with citations |
| `kpi.ts` | natural-language → executable KPI (sum/avg/count/distinct/min/max/ratio + synonyms) |
| `intent.ts` | `parseBrief` — plain-text prompt → `AnalysisIntent` (analyses, metric, groupBy, textColumn, horizon, period); routes which analyses run and which tab to land on |

The four **deep analyses** (sentiment, text/keywords, pareto, cohort) are **prompt-triggered**: `parseBrief` detects the intent kind, and the analyze page runs the matching `analyze*` function (each accepts optional focus overrides), renders it in the **Advanced** tab, emits an insight, and passes the result into `AIContext` so the LLM interprets real numbers.

## The AI orchestration layer (`lib/ai`)

```
createOrchestrator(config)  ──►  run(task, ctx)  ──►  AIResult
        │
        ├── routes: { [task]: { provider, model, maxTokens } }
        ├── llmComplete?  ──►  llm-provider.ts  (OpenAI-compatible, server-only)
        └── fallback      ──►  local-provider.ts (deterministic, isomorphic)
```

- **Tasks**: `reasoning`, `sql`, `cleaning`, `chart-explanation`, `forecast-interpretation`, `report-writing`, `kpi-generation`, `insight-generation`, `chat`.
- **Default routing**: every task prefers `llm` (**Groq**, free tier, `GROQ_API_KEY`, base `https://api.groq.com/openai/v1`, default model `llama-3.3-70b-versatile`). Override per task/model via `config.routes` and the `ANALYSTAI_LLM_MODEL_*` envs.
- **Grounded prose, not invented numbers**: `buildContextBlock` serializes schema + stats + insights + forecast + the deep analyses (sentiment/pareto/cohort/keywords) as a compact **row-free** context. The LLM writes prose over those figures; it never sees raw rows and never sources the numbers.
- **Graceful degradation**: if no key is set or `llmComplete` throws, the orchestrator returns the local deterministic result — the UI never blanks, and the app is fully functional offline.
- **`/api/ai` route**: the only server entry point. Accepts `{ task, dataset, question, intent, includeInsights, includeForecast }`, computes the intent-relevant deep analyses into `AIContext`, and calls the orchestrator with `llmComplete` wired to `llm-provider.ts`. The client wires chat (`sendMessage`) and the executive report (`report-view`) to it, each with an instant local fallback.

## Frontend (`app`, `components`)

- **App Router**, server shell + client islands. All interactive surfaces (`studio/*`, charts, terminal demo) are `"use client"`.
- **State**: the analyzer page owns `dataset`, `messages`, `savedKpis` and memoizes `profile / insights / forecast / quality / correlation`. Cleaning fixes produce a new immutable `Dataset`, which re-runs every memo.
- **Persistence**: workspace profile + recent-upload metadata live in `localStorage` (prototype). The production design uses PostgreSQL with row-level security.

## Design system (`app/globals.css`, `tailwind.config.ts`)

CSS custom properties drive theming (`data-theme="dark|light"`). The default is route-aware: **paper** (light) on marketing pages, **terminal** (dark) in the Studio (`components/theme-provider.tsx` + a no-flash inline script in `app/layout.tsx`), with a per-surface override. The light theme paints a warm off-white paper texture (`--app-texture`: dot-grid + SVG grain + vignette); the dark theme paints a near-black terminal canvas with a faint green grid + glow. Reusable classes: `.neu`, `.neu-inset`, `.panel` (clean card + soft shadow + top hairline), `.terminal-cell` (monospace + scanlines, for studio readouts/chat), `.btn-neu[-accent]` (gradient primary), `.text-gradient` / `.bg-brand-gradient` (magenta→purple→cyan), `.eyebrow`, `.font-script`, `.prompt`, `.cursor`, `.grid-bg`, `.radial-glow`, `.scanlines`. Fonts: Bricolage Grotesk (display, `--font-display`), Dancing Script (cursive accent, `--font-script`), Source Serif 4 (formal body, `--font-formal`), Space Mono (terminal/code/data, `--font-mono`). Charts consume a shared palette in `lib/viz.ts`.

**Prompt-driven focus:** `parseBrief` (lib/analysis/intent.ts) turns a brief-bar or chat prompt into an `AnalysisIntent` (`metric`, `groupBy`, `horizon`, `period`). The analyze page stores it in `intent` state and threads it into the engine: `generateInsights(dataset, {metric, category})`, `forecast(dataset, {valueColumn, period, horizon})`, `topCorrelations(dataset, limit, anchor)`, and `pickPrimary{Metric,Date,Category}(dataset, preferred?)` accept optional overrides, and `AIContext.intent` carries the focus into `answerQuestion`. The top-level `useMemo` hooks depend on `intent`, so Insights/Forecast/EDA/Dashboard/KPI/Report all re-derive to reflect the prompt; `sendMessage` parses each chat prompt and `setIntent`s it. A focus banner + clear button surface the active scope.

## Production roadmap (target architecture)

```
Next.js (Vercel Fluid Compute)
  ├─ Clerk / Auth.js          OAuth + MFA + RBAC
  ├─ /api/ai                  orchestrator → local | LLM (OpenAI-compatible / Vercel AI Gateway)
  ├─ /api/ingest              upload → object storage (Vercel Blob/S3) → Vercel Queues
  ├─ workers (Celery/Queues)  parse → profile → insights → forecast (Pandas/Polars/DuckDB, Prophet, sklearn)
  └─ Stripe                   plans + credit metering

PostgreSQL (Neon)            workspaces, datasets, dashboards, reports, audit — row-level security
Redis                        caching + job queue
Sentry / OpenTelemetry       errors + metrics
Docker / K8s                 self-hosted enterprise option
```

This prototype implements the client-side slice of that graph (parse → profile → insights → forecast → report) deterministically, with the LLM layer abstracted and optional.
