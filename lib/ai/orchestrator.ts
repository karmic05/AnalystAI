/* ============================================================
   AI Orchestrator — the configurable abstraction layer.
   Routes a task to the best provider/model, with a per-task
   model map that can be swapped without touching call sites.
   Falls back to the local provider when an LLM key is absent.
   ============================================================ */

import type { AIContext, AIResult, AITask } from "@/lib/types";
import { localComplete } from "./local-provider";

export interface TaskRoute {
  provider: "local" | "llm";
  /** model id used when provider === "llm" */
  model?: string;
  /** max tokens hint for the llm provider */
  maxTokens?: number;
}

/**
 * Default routing. Every task prefers the LLM (Groq) when a key is
 * configured — the deterministic engine still computes all numbers and
 * passes them as grounded context, so prose is LLM-authored but figures
 * can't be hallucinated. When no key is set (or the call errors) the
 * orchestrator transparently falls back to the local provider, so the
 * product stays fully functional offline.
 */
export const DEFAULT_TASK_ROUTES: Record<AITask, TaskRoute> = {
  reasoning: { provider: "llm", model: "ANALYSTAI_LLM_MODEL_REASONING", maxTokens: 900 },
  sql: { provider: "llm", model: "ANALYSTAI_LLM_MODEL_SQL", maxTokens: 500 },
  cleaning: { provider: "llm", model: "ANALYSTAI_LLM_MODEL_REASONING", maxTokens: 700 },
  "chart-explanation": { provider: "llm", model: "ANALYSTAI_LLM_MODEL_REASONING", maxTokens: 500 },
  "forecast-interpretation": { provider: "llm", model: "ANALYSTAI_LLM_MODEL_REASONING", maxTokens: 700 },
  "report-writing": { provider: "llm", model: "ANALYSTAI_LLM_MODEL_REPORT", maxTokens: 1800 },
  "kpi-generation": { provider: "llm", model: "ANALYSTAI_LLM_MODEL_REASONING", maxTokens: 600 },
  "insight-generation": { provider: "llm", model: "ANALYSTAI_LLM_MODEL_REASONING", maxTokens: 800 },
  chat: { provider: "llm", model: "ANALYSTAI_LLM_MODEL_REASONING", maxTokens: 900 },
};

export interface OrchestratorConfig {
  routes?: Partial<Record<AITask, TaskRoute>>;
  /** force every task to a single provider (e.g. "local" in tests) */
  forceProvider?: "local" | "llm";
  /** inject an llm completer (server-side). If absent, llm routes fall back to local. */
  llmComplete?: (task: AITask, ctx: AIContext, route: TaskRoute) => Promise<AIResult>;
}

export function createOrchestrator(config: OrchestratorConfig = {}) {
  const routes = { ...DEFAULT_TASK_ROUTES, ...config.routes };

  async function run(task: AITask, ctx: AIContext): Promise<AIResult> {
    const route = routes[task];
    const wantLlm = (config.forceProvider === "llm" || (config.forceProvider !== "local" && route.provider === "llm")) && config.llmComplete;
    if (wantLlm) {
      try {
        return await wantLlm(task, ctx, route);
      } catch (err) {
        // graceful degradation — never let an LLM outage blank the UI
        console.warn("[orchestrator] LLM failed, falling back to local:", err);
      }
    }
    return localComplete(task, ctx);
  }

  return { run, routes };
}

/** Convenience singleton using the default config (local-only on the client). */
export const orchestrator = createOrchestrator();
