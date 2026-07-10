# Deployment Guide

AnalystAI is a standard Next.js 14 App Router app — it deploys to **Vercel** (recommended) or any Node host with zero configuration.

## 1. Local production build

```bash
npm install
npm run build
npm run start          # serves on http://localhost:3000
```

Verify the build is clean:

```bash
npm run typecheck      # tsc --noEmit
npm run test           # vitest unit tests
```

## 2. Deploy to Vercel

### Option A — Dashboard

1. Push this repo to GitHub/GitLab/Bitbucket.
2. In Vercel, **Add New… → Project** and import the repo.
3. Framework preset: **Next.js** (auto-detected). Build command `next build`, output handled automatically.
4. **Environment variables** (all optional — the app runs offline):
   - `ANALYSTAI_AI_PROVIDER` = `llm` (to enable the LLM)
   - `ANALYSTAI_LLM_BASE_URL`, `ANALYSTAI_LLM_API_KEY`, `ANALYSTAI_LLM_MODEL_REPORT`
   - (roadmap) `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
5. **Deploy.** Vercel builds and gives you a preview URL; promote to production when ready.

> The Vercel CLI (`npm i -g vercel`) lets you do this from the terminal: `vercel` to preview, `vercel --prod` to ship. Use `vercel env pull` to sync env vars locally.

### Option B — CLI

```bash
npm i -g vercel
vercel            # link + deploy a preview
vercel env add ANALYSTAI_LLM_API_KEY
vercel --prod     # production
```

## 3. Runtime notes

- **Fluid Compute / Node.js** is the right target — the `/api/ai` route is a Node serverless function. The default 300s timeout is more than enough; the local analyst returns in milliseconds.
- **No database required** for the prototype. The roadmap's multi-tenant PostgreSQL is not wired here, so there are no connection limits to worry about.
- **Client-side analysis**: parsing and the analysis engine run in the browser, so the only server cost is static delivery + the optional `/api/ai` LLM proxy. This scales cheaply.
- **Fonts**: loaded via `<link>` from Google Fonts in `app/layout.tsx` (build-safe; falls back to system fonts if unreachable).

## 4. Enabling the LLM in production

Set the env vars in the Vercel project settings (Production + Preview + Development as needed). The orchestrator only calls the LLM for tasks routed to `llm` (by default: `report-writing`); everything else stays local. On any LLM error the request falls back to the local provider, so deploys are safe even if a key is missing or a provider is down.

## 5. Roadmap production concerns (not in this build)

When you wire the full product, plan for:
- **Auth**: Clerk or Auth.js (OAuth, MFA, RBAC).
- **DB**: PostgreSQL (Neon via Vercel Marketplace) with row-level security per workspace.
- **Queue**: Vercel Queues or Celery for large-file processing.
- **Object storage**: Vercel Blob / S3 for uploads.
- **Billing**: Stripe with credit-based AI usage metering.
- **Observability**: Sentry (errors) + OpenTelemetry/Prometheus (metrics).
- **Deploy**: Docker + Kubernetes manifests for self-hosted enterprise.
