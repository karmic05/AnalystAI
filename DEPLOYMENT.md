# Deployment Guide

AnalystAI is a standard Next.js 14 App Router app — it deploys to **Render.com**, **Vercel**, or any Node host with zero configuration.

## 0. Deploy to Render.com (one-click via `render.yaml`)

The repo ships a [`render.yaml`](render.yaml) blueprint, so Render provisions everything for you.

1. Push this repo to GitHub (already done if you're reading this on GitHub).
2. In Render: **New → Blueprint**, connect the repo. Render reads `render.yaml` and creates a **Node web service**:
   - Build: `npm install && npm run build`
   - Start: `npm run start` (Next.js binds to Render's `$PORT` automatically)
   - Health check: `/`
3. When prompted, set the one secret env var:
   - **`GROQ_API_KEY`** — your Groq key from <https://console.groq.com/keys> (marked `sync: false` in the blueprint, so it's entered in the dashboard, never stored in git).
   - The model/base-URL vars are pre-filled by the blueprint; override them if you like.
4. **Create.** Render builds and gives you a public `*.onrender.com` URL. `autoDeploy: true` means every push to the default branch redeploys.

> Without `GROQ_API_KEY` the site still runs — it falls back to the deterministic local engine. Set the key to make chat, reports, and interpretations Groq-authored.
>
> **Free plan note:** Render's free web service sleeps after ~15 min idle and cold-starts on the next request (a few seconds). Upgrade to a paid instance to keep it always-on.

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
4. **Environment variables** (all optional — the app runs offline, falling back to the local engine):
   - `GROQ_API_KEY` — enables Groq-authored chat, reports, and interpretations (free tier at <https://console.groq.com/keys>).
   - `ANALYSTAI_LLM_BASE_URL` (defaults to Groq), `ANALYSTAI_LLM_MODEL_REASONING`, `ANALYSTAI_LLM_MODEL_REPORT`, `ANALYSTAI_LLM_MODEL_SQL`.
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

Set `GROQ_API_KEY` (and optionally the model vars) in your host's env settings (Render dashboard, or Vercel Production + Preview + Development). Every AI task routes to Groq when the key is present; the deterministic engine still computes all figures and passes them as grounded context, so prose is LLM-authored but numbers can't be hallucinated. On any LLM error — or a missing key — the request falls back to the local provider, so deploys are safe even if the key is absent or the provider is down.

## 5. Roadmap production concerns (not in this build)

When you wire the full product, plan for:
- **Auth**: Clerk or Auth.js (OAuth, MFA, RBAC).
- **DB**: PostgreSQL (Neon via Vercel Marketplace) with row-level security per workspace.
- **Queue**: Vercel Queues or Celery for large-file processing.
- **Object storage**: Vercel Blob / S3 for uploads.
- **Billing**: Stripe with credit-based AI usage metering.
- **Observability**: Sentry (errors) + OpenTelemetry/Prometheus (metrics).
- **Deploy**: Docker + Kubernetes manifests for self-hosted enterprise.
