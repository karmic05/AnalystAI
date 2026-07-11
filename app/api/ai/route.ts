/* ============================================================
   /api/ai · server-side entry to the AI orchestrator.
   Serializes a compact context (no raw rows) and routes the task.
   Uses the LLM provider (Groq) when a key is configured, else the
   local deterministic engine. Works offline by default.
   ============================================================ */

import { NextResponse } from "next/server";
import { createOrchestrator } from "@/lib/ai/orchestrator";
import { llmComplete } from "@/lib/ai/llm-provider";
import { buildProfile } from "@/lib/analysis/profile";
import { generateInsights } from "@/lib/analysis/insights";
import { forecast as runForecast } from "@/lib/analysis/forecast";
import { analyzeSentiment } from "@/lib/analysis/sentiment";
import { analyzePareto } from "@/lib/analysis/pareto";
import { analyzeCohort } from "@/lib/analysis/cohort";
import { analyzeKeywords } from "@/lib/analysis/text";
import type { AIContext, AITask, Dataset } from "@/lib/types";
import type { AnalysisIntent } from "@/lib/analysis/intent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RequestBody {
  task: AITask;
  dataset: Dataset;
  question?: string;
  intent?: AnalysisIntent | null;
  includeInsights?: boolean;
  includeForecast?: boolean;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RequestBody;
    if (!body?.dataset?.rows?.length || !body.task) {
      return NextResponse.json({ error: "dataset and task are required" }, { status: 400 });
    }

    const ds = body.dataset;
    const intent = body.intent ?? undefined;
    const kinds = new Set(intent?.analyses ?? []);

    const ctx: AIContext = {
      dataset: ds,
      profile: buildProfile(ds),
      insights: body.includeInsights
        ? generateInsights(ds, { metric: intent?.metric, category: intent?.groupBy })
        : undefined,
      forecast: body.includeForecast
        ? runForecast(ds, { valueColumn: intent?.metric, period: intent?.period, horizon: intent?.horizon }) ?? undefined
        : undefined,
      question: body.question,
      intent,
    };

    // Attach the deep analyses the prompt asked for (or that are cheap + relevant),
    // so the LLM interprets real computed numbers rather than inventing them.
    if (kinds.has("sentiment") || kinds.has("text") || body.task === "chat") {
      ctx.sentiment = analyzeSentiment(ds, { column: intent?.textColumn }) ?? undefined;
      ctx.keywords = analyzeKeywords(ds, { column: intent?.textColumn }) ?? undefined;
    }
    if (kinds.has("pareto")) {
      ctx.pareto = analyzePareto(ds, { metric: intent?.metric, category: intent?.groupBy }) ?? undefined;
    }
    if (kinds.has("cohort")) {
      ctx.cohort = analyzeCohort(ds, { metric: intent?.metric }) ?? undefined;
    }

    const orch = createOrchestrator({ llmComplete });
    const result = await orch.run(body.task, ctx);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
