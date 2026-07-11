/* ============================================================
   LocalAnalyst provider — the offline, deterministic analyst.
   Implements every AITask with real computed numbers from the
   engine. No network, no keys, no cost. This is the default.
   ============================================================ */

import type { AIContext, AIResult, AITask, Insight } from "@/lib/types";
import { answerQuestion } from "@/lib/analysis/chat";
import { generateInsights } from "@/lib/analysis/insights";
import { forecast as runForecast } from "@/lib/analysis/forecast";
import { detectQuality } from "@/lib/analysis/quality";
import { buildProfile, pickPrimaryCategory, pickPrimaryDate, pickPrimaryMetric, aggregateBy } from "@/lib/analysis/profile";
import { numericSeries } from "@/lib/analysis/profile";
import { mean, sum } from "@/lib/analysis/stats";
import { fmt, pct, titleCase } from "@/lib/utils";

export function localComplete(task: AITask, ctx: AIContext): AIResult {
  switch (task) {
    case "chat":
      return chat(ctx);
    case "report-writing":
      return { task, provider: "local", text: writeReport(ctx) };
    case "forecast-interpretation":
      return { task, provider: "local", text: interpretForecast(ctx) };
    case "chart-explanation":
      return { task, provider: "local", text: explainChart(ctx) };
    case "kpi-generation":
      return { task, provider: "local", text: suggestKpis(ctx) };
    case "sql":
      return { task, provider: "local", text: generateSql(ctx) };
    case "cleaning":
      return { task, provider: "local", text: cleaningPlan(ctx) };
    case "insight-generation": {
      const ins = ctx.insights ?? generateInsights(ctx.dataset);
      return { task, provider: "local", text: ins.map((i) => `• ${i.title} — ${i.action}`).join("\n") };
    }
    case "reasoning":
    default:
      return { task, provider: "local", text: reasoning(ctx) };
  }
}

function chat(ctx: AIContext): AIResult {
  const q = ctx.question ?? ctx.history?.filter((m) => m.role === "user").slice(-1)[0]?.content ?? "";
  const ans = answerQuestion(q, ctx);
  return { task: "chat", provider: "local", text: ans.text, citations: ans.citations };
}

function reasoning(ctx: AIContext): string {
  const metric = pickPrimaryMetric(ctx.dataset);
  const date = pickPrimaryDate(ctx.dataset);
  const cat = pickPrimaryCategory(ctx.dataset);
  const ins = ctx.insights ?? generateInsights(ctx.dataset);
  const top = ins.slice(0, 3).map((i) => `  - ${i.title} (${Math.round(i.confidence * 100)}% confidence, ${i.impact} impact)`).join("\n");
  return `Analytical read on ${ctx.dataset.name} (${ctx.dataset.rowCount.toLocaleString()} rows):

Headline metric: ${metric ? titleCase(metric.name) : "none detected"}
Time dimension:  ${date ? date.name : "none detected"}
Primary cut:     ${cat ? cat.name : "none detected"}

Top findings:
${top}

Recommended next step: pressure-test the highest-impact finding within a segment before committing budget — correlation and trend findings especially can hide when you slice them.`;
}

function interpretForecast(ctx: AIContext): string {
  const fc = ctx.forecast ?? runForecast(ctx.dataset);
  if (!fc) return "No date + numeric metric found to forecast.";
  const next = fc.horizon[0];
  const last = fc.history[fc.history.length - 1];
  const acc = (1 - fc.metrics.mape) * 100;
  return `Forecast interpretation — ${titleCase(fc.valueColumn)} by ${fc.period}:

The model expects the next ${fc.period} to land near ${fmt(next?.forecast ?? 0, { compact: true })}, versus ${fmt(last?.actual ?? 0, { compact: true })} most recently. The 95% confidence band is ${fmt(next?.lower ?? 0, { compact: true })}–${fmt(next?.upper ?? 0, { compact: true })} — plan to that range, not the point estimate.

Trend component: ${fmt(fc.metrics.trend, { compact: true })}/${fc.period} (${fc.metrics.trend >= 0 ? "growth" : "decay"}).
Backtest accuracy: ${(acc).toFixed(0)}% (1 - MAPE). ${acc > 80 ? "Reliable enough to anchor a plan." : acc > 65 ? "Directionally useful — pair with a judgemental overlay." : "Weak — treat as a baseline only and investigate the volatility."}

Caveat: Holt's linear trend extrapolates the recent slope indefinitely. If the trend is driven by a one-off (a launch, a price change), override the horizon in the Forecast tab.`;
}

function explainChart(ctx: AIContext): string {
  const spec = ctx.chartSpec;
  const metric = pickPrimaryMetric(ctx.dataset);
  const date = pickPrimaryDate(ctx.dataset);
  if (spec?.kind === "trend" && date && metric) {
    return `This trend chart shows ${titleCase(metric.name)} over ${date.name}. The line's slope is the period-over-period change; spikes/divots usually map to seasonality or known events. Read the area under the curve as the cumulative total, and the end-of-line angle as the current momentum.`;
  }
  if (spec?.kind === "bar" || spec?.kind === "category") {
    const cat = pickPrimaryCategory(ctx.dataset);
    return `This chart compares ${titleCase(metric?.name ?? "the metric")} across ${titleCase(cat?.name ?? "categories")}. Bar height = total per group; the gap between the tallest and shortest bars is the opportunity spread. A long tail of short bars suggests consolidation potential.`;
  }
  return `This chart summarizes ${titleCase(metric?.name ?? "the dataset")}. Look for (1) the overall level, (2) the spread between high and low, and (3) any single bar/point that breaks the pattern — that outlier is usually the story.`;
}

function suggestKpis(ctx: AIContext): string {
  const metric = pickPrimaryMetric(ctx.dataset);
  const cat = pickPrimaryCategory(ctx.dataset);
  const lines: string[] = [];
  if (metric) {
    lines.push(`• Total ${titleCase(metric.name)} — SUM(${metric.name})`);
    lines.push(`• Average ${titleCase(metric.name)} per record — AVG(${metric.name})`);
    if (cat) lines.push(`• ${titleCase(metric.name)} concentration — top ${cat.name} share of total`);
  }
  const cust = ctx.dataset.schema.find((c) => c.role === "customer");
  if (metric && cust) {
    lines.push(`• ${titleCase(metric.name)} per active customer — SUM(${metric.name}) ÷ COUNT(DISTINCT ${cust.name})`);
  }
  const profit = ctx.dataset.schema.find((c) => c.role === "profit");
  const revenue = ctx.dataset.schema.find((c) => c.role === "revenue");
  if (revenue && profit) lines.push(`• Net margin — SUM(${profit.name}) ÷ SUM(${revenue.name})`);
  lines.push(`• Record count — COUNT(*)`);
  return `Suggested KPIs you can define in natural language in the KPI Builder:\n\n${lines.join("\n")}`;
}

function generateSql(ctx: AIContext): string {
  const q = (ctx.question ?? "").toLowerCase();
  const metric = pickPrimaryMetric(ctx.dataset);
  const cat = pickPrimaryCategory(ctx.dataset);
  const date = pickPrimaryDate(ctx.dataset);

  if (/trend|over time|by month|monthly/.test(q) && date && metric) {
    return `-- ${titleCase(metric.name)} trend by month
SELECT
  DATE_TRUNC('month', "${date.name}") AS period,
  SUM("${metric.name}") AS total_${metric.name}
FROM data
GROUP BY 1
ORDER BY 1;`;
  }
  if (/top|best|rank|by (segment|category|region|product)|breakdown/.test(q) && cat && metric) {
    return `-- ${titleCase(metric.name)} by ${titleCase(cat.name)}
SELECT
  "${cat.name}",
  SUM("${metric.name}") AS total_${metric.name},
  ROUND(SUM("${metric.name}") * 100.0 / SUM(SUM("${metric.name}")) OVER (), 1) AS share_pct
FROM data
GROUP BY 1
ORDER BY 2 DESC;`;
  }
  if (metric) {
    return `-- ${titleCase(metric.name)} summary
SELECT
  COUNT(*) AS rows,
  SUM("${metric.name}") AS total,
  AVG("${metric.name}") AS avg,
  MIN("${metric.name}") AS min,
  MAX("${metric.name}") AS max
FROM data;`;
  }
  return `SELECT * FROM data LIMIT 100;`;
}

function cleaningPlan(ctx: AIContext): string {
  const issues = detectQuality(ctx.dataset);
  if (!issues.length) return "No data-quality issues detected — the dataset is clean by the automated checks.";
  const high = issues.filter((i) => i.severity === "high");
  const lines = issues.slice(0, 6).map((i) => `• [${i.severity.toUpperCase()}] ${i.title}\n    → ${i.recommendation}  (auto-fix: ${i.autoFix.label})`).join("\n");
  return `Cleaning plan — ${issues.length} issue${issues.length === 1 ? "" : "s"} (${high.length} high priority):\n\n${lines}\n\nApply fixes one-by-one in the Overview tab; each is reversible.`;
}

/** Trim an engine sentence to a tight, board-ready clause (no trailing filler). */
function brief(s: string, max = 130): string {
  const first = s.split(/(?<=[.!?])\s/)[0].trim();
  const out = first.length > max ? first.slice(0, max - 1).trimEnd() + "…" : first;
  return out.replace(/\s+/g, " ");
}

export function writeReport(ctx: AIContext): string {
  const ds = ctx.dataset;
  const profile = ctx.profile ?? buildProfile(ds);
  const ins = ctx.insights ?? generateInsights(ds);
  const fc = ctx.forecast ?? runForecast(ds);
  const metric = pickPrimaryMetric(ds);
  const cat = pickPrimaryCategory(ds);
  const series = metric ? numericSeries(ds, metric.name) : [];
  const isCurrency = metric ? metric.role === "revenue" || metric.role === "cost" || metric.role === "profit" : false;
  // Board-ready number: currency/compact for money, otherwise a clean rounded value
  // (no noisy trailing decimals like "3.333" or "78.431").
  const money = (n: number) => {
    if (isCurrency || Math.abs(n) >= 1000) return fmt(n, { compact: true, currency: isCurrency });
    const rounded = Math.abs(n) >= 100 ? Math.round(n) : Math.round(n * 10) / 10;
    return rounded.toLocaleString("en-US");
  };

  const top = ins.slice(0, 5);
  const risks = ins.filter((i) => i.impact !== "low" && /risk|decline|declining|outlier|skew|concentrat|duplicate|missing|negative|churn/i.test(i.title + i.impactReason));
  const opps = ins.filter((i) => /lead|leads|grow|growing|top|driver|strong|peak|positive|opportunit/i.test(i.title + i.impactReason));

  // Leading segment (for the at-a-glance strip)
  let leader = "";
  if (cat && metric) {
    const agg = aggregateBy(ds, cat.name, metric.name, "sum");
    const total = sum(agg.map((a) => a.value));
    if (agg.length && total) leader = `${agg[0].key} (${pct(agg[0].value / total)})`;
  }

  // At-a-glance KPI line
  const kpis: string[] = [];
  if (metric) {
    kpis.push(`**${titleCase(metric.name)}** ${money(sum(series))}`);
    kpis.push(`**Avg/record** ${money(mean(series))}`);
  }
  kpis.push(`**Records** ${ds.rowCount.toLocaleString()}`);
  if (fc?.horizon[0]) kpis.push(`**Next ${fc.period}** ${money(fc.horizon[0].forecast ?? 0)}`);
  if (leader) kpis.push(`**Leader** ${leader}`);
  kpis.push(`**Data quality** ${pct(profile.completeness)}`);

  // TL;DR — 3 tightest, highest-impact takeaways
  const tldr = top.slice(0, 3).map((i) => `- ${brief(i.title)}`);

  // Deep-analysis one-liners, only when present
  const deep: string[] = [];
  if (ctx.sentiment) {
    const s = ctx.sentiment;
    deep.push(`- **Sentiment** — ${pct(s.posShare)} positive / ${pct(s.negShare)} negative (avg ${s.avgScore.toFixed(2)}, ${s.scored.toLocaleString()} rows)`);
  }
  if (ctx.keywords) deep.push(`- **Top themes** — ${ctx.keywords.topTerms.slice(0, 5).map((t) => t.term).join(", ")}`);
  if (ctx.pareto) deep.push(`- **Concentration** — ${ctx.pareto.vitalFewCount} of ${ctx.pareto.buckets.length} ${titleCase(ctx.pareto.category)} = ${pct(ctx.pareto.vitalFewShare)} of ${titleCase(ctx.pareto.metric)}`);
  if (ctx.cohort) {
    const c0 = ctx.cohort.cohorts[0];
    deep.push(`- **Retention** — first cohort holds ${pct(c0?.periods[c0.periods.length - 1]?.retention ?? 0)} by period ${c0 ? c0.periods.length - 1 : 0}`);
  }

  const findings = top.map((i) => `- **${brief(i.title, 90)}** — ${brief(i.summary, 150)} _(${i.impact} impact · ${Math.round(i.confidence * 100)}% conf)_`);

  const md = `# ${titleCase(ds.name.replace(/\.[a-z]+$/i, "").replace(/[_-]+/g, " "))} — Executive Brief

_AnalystAI · ${new Date().toDateString()} · ${ds.rowCount.toLocaleString()} records × ${ds.columns.length} columns_

## At a glance
${kpis.map((k) => `- ${k}`).join("\n")}

## TL;DR
${tldr.join("\n") || "- Not enough signal to summarize; add a numeric and a date/category column."}
${deep.length ? `\n## Deep analysis\n${deep.join("\n")}` : ""}

## Key findings
${findings.join("\n") || "- No findings surfaced."}

## Forecast
${fc ? `- Next ${fc.period}: **${money(fc.horizon[0]?.forecast ?? 0)}** (95% band ${money(fc.horizon[0]?.lower ?? 0)}–${money(fc.horizon[0]?.upper ?? 0)})\n- Backtest accuracy: **${((1 - fc.metrics.mape) * 100).toFixed(0)}%** (MAPE ${pct(fc.metrics.mape)}) · trend ${money(fc.metrics.trend)}/${fc.period}` : "- No time series available to forecast."}

## Risks
${risks.length ? risks.slice(0, 3).map((i) => `- ${brief(i.title, 90)} — ${brief(i.impactReason, 120)}`).join("\n") : "- None flagged by the automated checks."}${profile.duplicateRows ? `\n- ${profile.duplicateRows} duplicate row${profile.duplicateRows === 1 ? "" : "s"} — resolve before trusting totals.` : ""}

## Opportunities
${opps.length ? opps.slice(0, 3).map((i) => `- ${brief(i.title, 90)}`).join("\n") : "- Review segmentation to surface growth headroom."}

## Recommended actions
${top.slice(0, 3).map((i, idx) => `${idx + 1}. ${brief(i.action, 150)}`).join("\n") || "1. Load a richer dataset to generate an action plan."}

---
_Figures are computed deterministically from your data. Confidence reflects sample size and effect strength — validate high-stakes calls with a segment-level check._
`;
  return md;
}

export function _insightsForReport(ins: Insight[]): string {
  return ins.map((i) => i.title).join("; ");
}
