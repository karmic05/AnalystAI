/* ============================================================
   LLM provider — OpenAI-compatible chat-completions adapter.
   SERVER-ONLY. Never imported on the client (uses process.env +
   network). Falls back to the local provider when no key is set,
   so the app always works.
   ============================================================ */

import type { AIContext, AIResult, AITask } from "@/lib/types";
import { localComplete } from "./local-provider";
import { buildProfile, pickPrimaryCategory, pickPrimaryDate, pickPrimaryMetric } from "@/lib/analysis/profile";
import { fmt, pct, titleCase } from "@/lib/utils";

const TASK_INSTRUCTIONS: Record<AITask, string> = {
  reasoning: "You are a senior business analyst. Reason about the dataset context provided and give a concise, actionable analytical read.",
  sql: "You are a SQL expert. Given the user's question and the table schema, return a single ANSI SQL query (no prose) that answers it. Use the column names exactly as given.",
  cleaning: "You are a data engineer. Given the quality findings, return a concise prioritized cleaning plan.",
  "chart-explanation": "Explain the chart to a non-technical executive in 2-3 sentences, focused on the business takeaway.",
  "forecast-interpretation": "Interpret the forecast for an executive: expected value, confidence band, accuracy, and one caveat.",
  "report-writing": "Write a polished executive report in Markdown with sections: Executive Summary, Key Insights, KPI Overview, Forecast, Risks, Opportunities, Recommendations. Use only the provided numbers.",
  "kpi-generation": "Suggest 5-7 KPIs relevant to this dataset, each as a one-line natural-language definition a KPI builder could parse.",
  "insight-generation": "Summarize the key insights as a tight bulleted list for an executive.",
  chat: "You are AnalystAI, an AI business analyst. Answer the user's question using ONLY the provided dataset facts. If the answer isn't in the data, say so and suggest what to ask. Be concise, specific, and cite numbers.",
};

export interface LLMConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  maxTokens?: number;
}

export function readLLMConfig(taskRouteModel?: string): LLMConfig | null {
  const apiKey = process.env.ANALYSTAI_LLM_API_KEY;
  const baseUrl = process.env.ANALYSTAI_LLM_BASE_URL || "https://api.openai.com/v1";
  const modelEnv = taskRouteModel ? process.env[taskRouteModel] : undefined;
  const model = modelEnv || process.env.ANALYSTAI_LLM_MODEL_REASONING || "gpt-4o-mini";
  if (!apiKey) return null;
  return { baseUrl, apiKey, model };
}

/** Compact, privacy-conscious context: schema + stats, never raw rows. */
export function buildContextBlock(ctx: AIContext): string {
  const { dataset } = ctx;
  const profile = ctx.profile ?? buildProfile(dataset);
  const metric = pickPrimaryMetric(dataset);
  const date = pickPrimaryDate(dataset);
  const cat = pickPrimaryCategory(dataset);

  const schemaLines = dataset.schema
    .map((c) => `- ${c.name} (${c.type}${c.role && c.role !== "unknown" ? `, ${c.role}` : ""}${c.missing ? `, ${c.missing} missing` : ""}${c.mean !== undefined ? `, mean=${fmt(c.mean, { compact: true })}` : ""})`)
    .join("\n");

  const insightLines = (ctx.insights ?? []).slice(0, 6).map((i) => `- ${i.title} [conf ${Math.round(i.confidence * 100)}%, ${i.impact} impact]`).join("\n");

  const forecastLine = ctx.forecast
    ? `Forecast: next ${ctx.forecast.period} ${fmt(ctx.forecast.horizon[0]?.forecast ?? 0, { compact: true })} (band ${fmt(ctx.forecast.horizon[0]?.lower ?? 0, { compact: true })}–${fmt(ctx.forecast.horizon[0]?.upper ?? 0, { compact: true })}), MAPE=${pct(ctx.forecast.metrics.mape)}, trend=${fmt(ctx.forecast.metrics.trend, { compact: true })}/${ctx.forecast.period}`
    : "Forecast: none";

  return `DATASET: ${dataset.name}
ROWS: ${dataset.rowCount.toLocaleString()}  ·  COLUMNS: ${dataset.columns.length}  ·  COMPLETENESS: ${pct(profile.completeness)}  ·  DUPLICATES: ${profile.duplicateRows}
PRIMARY METRIC: ${metric ? titleCase(metric.name) : "none"}  ·  TIME: ${date ? date.name : "none"}  ·  SEGMENT: ${cat ? cat.name : "none"}

SCHEMA:
${schemaLines}

INSIGHTS:
${insightLines || "(none)"}

${forecastLine}`;
}

export async function llmComplete(task: AITask, ctx: AIContext, route: { model?: string; maxTokens?: number }): Promise<AIResult> {
  const cfg = readLLMConfig(route.model);
  if (!cfg) return localComplete(task, ctx); // no key → local fallback

  const system = TASK_INSTRUCTIONS[task];
  const contextBlock = buildContextBlock(ctx);
  const question = ctx.question ? `\n\nUSER QUESTION:\n${ctx.question}` : "";
  const userMsg = `${contextBlock}${question}\n\n${task === "sql" ? "Return only SQL." : ""}`;

  const res = await fetch(`${cfg.baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cfg.apiKey}`,
    },
    body: JSON.stringify({
      model: cfg.model,
      max_tokens: route.maxTokens ?? 800,
      temperature: task === "sql" ? 0 : 0.4,
      messages: [
        { role: "system", content: system },
        { role: "user", content: userMsg },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`LLM HTTP ${res.status}: ${await res.text().catch(() => res.statusText)}`);
  }
  const json = await res.json();
  const text: string = json?.choices?.[0]?.message?.content ?? "";
  if (!text) throw new Error("LLM returned empty content");
  return { task, provider: "llm", text };
}
