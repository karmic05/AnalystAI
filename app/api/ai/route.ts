/* ============================================================
   /api/ai · server-side entry to the AI orchestrator.
   Serializes a compact context (no raw rows) and routes the task.
   Uses the LLM provider when a key is configured, else the local
   deterministic engine. Works offline by default.
   ============================================================ */

import { NextResponse } from "next/server";
import { createOrchestrator } from "@/lib/ai/orchestrator";
import { llmComplete } from "@/lib/ai/llm-provider";
import { buildProfile } from "@/lib/analysis/profile";
import { generateInsights } from "@/lib/analysis/insights";
import { forecast as runForecast } from "@/lib/analysis/forecast";
import type { AIContext, AITask, Dataset } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RequestBody {
  task: AITask;
  dataset: Dataset;
  question?: string;
  includeInsights?: boolean;
  includeForecast?: boolean;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RequestBody;
    if (!body?.dataset?.rows?.length || !body.task) {
      return NextResponse.json({ error: "dataset and task are required" }, { status: 400 });
    }

    const ctx: AIContext = {
      dataset: body.dataset,
      profile: buildProfile(body.dataset),
      insights: body.includeInsights ? generateInsights(body.dataset) : undefined,
      forecast: body.includeForecast ? runForecast(body.dataset) ?? undefined : undefined,
      question: body.question,
    };

    const orch = createOrchestrator({ llmComplete });
    const result = await orch.run(body.task, ctx);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
