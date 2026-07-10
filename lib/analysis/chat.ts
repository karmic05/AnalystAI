/* ============================================================
   Conversational analyst — intent routing over the user's
   question, answered with real computed numbers from the dataset.
   Works fully offline (the default provider). The LLM provider can
   take over with the same context for richer prose.
   ============================================================ */

import type { AIContext, ChatMessage } from "@/lib/types";
import { generateInsights } from "./insights";
import { forecast as runForecast } from "./forecast";
import { topCorrelations } from "./correlation";
import { aggregateBy, numericSeries, pickPrimaryCategory, pickPrimaryDate, pickPrimaryMetric } from "./profile";
import { detectQuality } from "./quality";
import { linreg, max, mean, min, sum } from "./stats";
import { fmt, pct, titleCase, uid } from "@/lib/utils";
import { toDate, toNumber } from "@/lib/data/schema";

export interface ChatAnswer {
  text: string;
  citations: { label: string; value: string }[];
}

export function answerQuestion(question: string, ctx: AIContext): ChatAnswer {
  const q = question.toLowerCase();
  const ds = ctx.dataset;
  const metric = pickPrimaryMetric(ds, ctx.intent?.metric);
  const date = pickPrimaryDate(ds);
  const cat = pickPrimaryCategory(ds, ctx.intent?.groupBy);
  const isCurrency = metric ? metric.role === "revenue" || metric.role === "cost" || metric.role === "profit" : false;
  const cur = (n: number) => fmt(n, { compact: true, currency: isCurrency });

  // intent: forecast / predict
  if (/\b(predict|forecast|next month|next quarter|future|projection|will (be|rise|fall|grow))\b/.test(q)) {
    const fc = ctx.forecast ?? runForecast(ds, { valueColumn: ctx.intent?.metric, period: ctx.intent?.period, horizon: ctx.intent?.horizon });
    if (fc) {
      const next = fc.horizon[0];
      const last = fc.history[fc.history.length - 1];
      return {
        text: `Based on a Holt's linear-trend model on ${fc.valueColumn} by ${fc.period}, the next ${fc.period} is projected at ${fmt(next?.forecast ?? 0, { compact: true, currency: isCurrency })} (95% band ${fmt(next?.lower ?? 0, { compact: true, currency: isCurrency })}–${fmt(next?.upper ?? 0, { compact: true, currency: isCurrency })}). The latest actual ${fc.period} was ${fmt(last?.actual ?? 0, { compact: true, currency: isCurrency })}, so the model expects ${next && last && (next.forecast ?? 0) >= (last.actual ?? 0) ? "growth" : "a decline"}. Holdout accuracy: MAPE=${(fc.metrics.mape * 100).toFixed(1)}% (lower is better). Open the Forecast tab to tune the horizon and aggregation.`,
        citations: [
          { label: "Next period", value: fmt(next?.forecast ?? 0, { compact: true }) },
          { label: "95% lower", value: fmt(next?.lower ?? 0, { compact: true }) },
          { label: "95% upper", value: fmt(next?.upper ?? 0, { compact: true }) },
          { label: "MAPE", value: `${(fc.metrics.mape * 100).toFixed(1)}%` },
        ],
      };
    }
    return { text: "I couldn't find a date column and a numeric metric to forecast. Upload data with a date and a value column, or pick them in the Forecast tab.", citations: [] };
  }

  // intent: top / best / worst / rank
  if (/\b(top|best|worst|rank|leading|leader|perform|highest|lowest|bottom)\b/.test(q) && cat && metric) {
    const agg = aggregateBy(ds, cat.name, metric.name, "sum");
    const total = sum(agg.map((a) => a.value));
    const top3 = agg.slice(0, 3).map((a) => `${a.key} (${pct(a.value / total)})`).join(", ");
    const direction = /worst|lowest|bottom/.test(q);
    const pick = direction ? agg[agg.length - 1] : agg[0];
    return {
      text: `By total ${titleCase(metric.name)}, the ${direction ? "lowest" : "top"} ${titleCase(cat.name)} is ${pick.key} at ${cur(pick.value)} (${pct(pick.value / total)} of the total). The top 3 are: ${top3}. ${agg.length > 3 ? `The long tail of ${agg.length - 3} other ${cat.name}s makes up ${pct(1 - sum(agg.slice(0, 3).map((a) => a.value)) / total)}.` : ""}`,
      citations: [
        { label: direction ? "Lowest" : "Top", value: `${pick.key} · ${cur(pick.value)}` },
        { label: "Share", value: pct(pick.value / total) },
        { label: "Segments", value: String(agg.length) },
      ],
    };
  }

  // intent: correlation / relationship / driver
  if (/\b(correlat|relationship|driver|related|link|affect|impact of)\b/.test(q)) {
    const corr = topCorrelations(ds, 3, ctx.intent?.metric);
    if (!corr.length) return { text: "There aren't at least two numeric columns to correlate.", citations: [] };
    const top = corr[0];
    const lines = corr.map((c) => `${titleCase(c.a)} ↔ ${titleCase(c.b)}: r=${c.r.toFixed(2)} (${Math.abs(c.r) > 0.7 ? "strong" : Math.abs(c.r) > 0.4 ? "moderate" : "weak"} ${c.r > 0 ? "positive" : "negative"})`).join("\n");
    return {
      text: `Here are the strongest numeric relationships in your data:\n\n${lines}\n\nThe top one — ${titleCase(top.a)} and ${titleCase(top.b)} (r=${top.r.toFixed(2)}) — means when ${titleCase(top.a)} moves, ${titleCase(top.b)} tends to ${top.r > 0 ? "move the same way" : "move the opposite way"}. Correlation ≠ causation: validate within each segment before acting.`,
      citations: corr.slice(0, 3).map((c) => ({ label: `${c.a} ↔ ${c.b}`, value: `r=${c.r.toFixed(2)}` })),
    };
  }

  // intent: trend / growth / decline / why down / why up
  if (/\b(trend|growth|decline|decreas|increas|why.*down|why.*up|why.*drop|why.*fall|why.*rise|growing|shrinking)\b/.test(q) && date && metric) {
    const monthly = buildMonthly(ds, date.name, metric.name);
    if (monthly.length >= 4) {
      const ys = monthly.map((m) => m.value);
      const reg = linreg(monthly.map((_, i) => i), ys);
      const first = ys[0];
      const last = ys[ys.length - 1];
      const growth = first !== 0 ? (last - first) / Math.abs(first) : 0;
      const why = /why/.test(q) ? ` The dominant driver is likely ${reg.r2 > 0.6 ? "a steady time trend" : "volatility/mix rather than a clean trend"} (R²=${reg.r2.toFixed(2)}); check the Segmentation tab to see which ${cat ? cat.name : "segment"} is pulling the number.` : "";
      return {
        text: `${titleCase(metric.name)} ${reg.slope > 0 ? "trends up" : reg.slope < 0 ? "trends down" : "is flat"}: from ${cur(first)} to ${cur(last)} per ${date.name} across ${monthly.length} periods (${growth >= 0 ? "+" : ""}${pct(growth, 0)}), a slope of ${fmt(reg.slope, { compact: true })}/${date.name} (R²=${reg.r2.toFixed(2)}).${why}`,
        citations: [
          { label: "Start", value: cur(first) },
          { label: "Latest", value: cur(last) },
          { label: "Change", value: `${growth >= 0 ? "+" : ""}${pct(growth, 0)}` },
          { label: "R²", value: reg.r2.toFixed(2) },
        ],
      };
    }
  }

  // intent: data quality / missing / clean
  if (/\b(missing|clean|quality|duplicate|null|blank|outlier|dirty|fix)\b/.test(q)) {
    const issues = detectQuality(ds);
    const top = issues.slice(0, 3);
    if (!top.length) return { text: "Data quality looks clean — no missing values, duplicates, or outliers detected by the automated checks.", citations: [{ label: "Issues", value: "0" }] };
    const lines = top.map((i) => `• ${i.title} — ${i.recommendation}`).join("\n");
    return {
      text: `I found ${issues.length} data-quality issue${issues.length === 1 ? "" : "s"}. Top priorities:\n\n${lines}\n\nYou can review and apply each fix in the Overview tab.`,
      citations: [
        { label: "Total issues", value: String(issues.length) },
        { label: "High severity", value: String(issues.filter((i) => i.severity === "high").length) },
      ],
    };
  }

  // intent: KPI / summary / overview / executive
  if (/\b(kpi|summary|overview|executive|headline|tl;dr|snapshot|top metric)\b/.test(q) && metric) {
    const series = numericSeries(ds, metric.name);
    const total = sum(series);
    const avg = mean(series);
    const mn = min(series);
    const mx = max(series);
    return {
      text: `Headline KPIs for ${titleCase(metric.name)}: total ${cur(total)}, average ${cur(avg)} per record, range ${cur(mn)}–${cur(mx)} across ${ds.rowCount.toLocaleString()} records.${date ? ` Span: ${date.name}.` : ""}${cat ? ` Primary cut: ${cat.name}.` : ""} For a board-ready version, open the Report tab.`,
      citations: [
        { label: "Total", value: cur(total) },
        { label: "Average", value: cur(avg) },
        { label: "Min", value: cur(mn) },
        { label: "Max", value: cur(mx) },
      ],
    };
  }

  // intent: churn (heuristic: if a 'segment'/'status' col exists, flag smallest-growing)
  if (/\b(churn|retention|at risk|leave|cancel)\b/.test(q)) {
    const ins = ctx.insights ?? generateInsights(ds, { metric: ctx.intent?.metric, category: ctx.intent?.groupBy });
    const seg = ds.schema.find((c) => c.role === "category" || c.role === "customer" || c.type === "string");
    return {
      text: `Churn signals are inferred, not measured, in this dataset (no explicit churn column). A useful proxy: look for ${seg ? `the ${seg.name} segment with the lowest growth and smallest recent contribution` : "segments with declining contribution and rising count"} — those are the at-risk cohorts. For a real churn model, add a column like \`is_churned\` or \`last_active_date\` and re-upload.`,
      citations: ins.slice(0, 2).map((i) => ({ label: i.title.slice(0, 24), value: `${Math.round(i.confidence * 100)}% conf` })),
    };
  }

  // fallback: general summary + suggest follow-ups
  if (metric) {
    const series = numericSeries(ds, metric.name);
    const ins = ctx.insights ?? generateInsights(ds, { metric: ctx.intent?.metric, category: ctx.intent?.groupBy });
    const top = ins[0];
    return {
      text: `I analyzed ${ds.rowCount.toLocaleString()} rows. The headline metric is ${titleCase(metric.name)} (total ${cur(sum(series))}, avg ${cur(mean(series))}). ${top ? `Most notable finding: ${top.title.toLowerCase()} (${Math.round(top.confidence * 100)}% confidence).` : ""}\n\nTry asking: "what's the trend?", "which ${cat ? cat.name : "segment"} is best?", "predict next month", "show correlations", or "summarize the KPIs".`,
      citations: top ? top.metrics.slice(0, 3) : [],
    };
  }

  return {
    text: "I can see your dataset but couldn't identify a numeric metric to analyze. Ask about trends, rankings, correlations, forecasts, or data quality — or pick a value column in the dataset.",
    citations: [],
  };
}

function buildMonthly(ds: import("@/lib/types").Dataset, dateCol: string, valueCol: string) {
  const map = new Map<string, { ts: number; value: number }>();
  for (const row of ds.rows) {
    const d = toDate(row[dateCol]);
    const v = toNumber(row[valueCol]);
    if (!d || Number.isNaN(v)) continue;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const slot = map.get(key) ?? { ts: new Date(d.getFullYear(), d.getMonth(), 1).getTime(), value: 0 };
    slot.value += v;
    map.set(key, slot);
  }
  return [...map.entries()].map(([label, s]) => ({ label, ts: s.ts, value: s.value })).sort((a, b) => a.ts - b.ts);
}

/** Suggested starter prompts surfaced in the chat UI. */
export const SUGGESTED_PROMPTS = [
  "What's the trend in the headline metric?",
  "Which segment performs best?",
  "Predict next month.",
  "Show the strongest correlations.",
  "Summarize the KPIs for a board update.",
  "What data-quality issues should I fix first?",
];

/** Build a ChatMessage (used by the chat view). */
export function makeMessage(role: ChatMessage["role"], content: string, citations?: ChatMessage["citations"]): ChatMessage {
  return { id: uid("msg"), role, content, citations, ts: Date.now() };
}
