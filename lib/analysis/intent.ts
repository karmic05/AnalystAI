/* ============================================================
   Brief parser — turns a natural-language "what do you want to
   learn" prompt into a structured intent that routes the analysis.
   Deterministic keyword matching (no model), so it is cheap, fast,
   and offline. The views use the result to focus their outputs.
   ============================================================ */

import type { Dataset, InsightCategory } from "@/lib/types";
import { matchColumn } from "./kpi";
import { pickPrimaryMetric } from "./profile";

export type IntentKind =
  | "forecast"
  | "trend"
  | "seasonality"
  | "segmentation"
  | "correlation"
  | "outliers"
  | "distribution"
  | "kpi"
  | "churn"
  | "report"
  | "ranking"
  | "quality"
  | "sentiment"
  | "pareto"
  | "cohort"
  | "text";

export interface AnalysisIntent {
  /** the original brief, trimmed */
  brief: string;
  /** human-readable keywords caught from the brief, for display */
  keywords: string[];
  /** ordered list of requested analyses, in the order first mentioned */
  analyses: IntentKind[];
  /** target metric column, if one could be resolved */
  metric?: string;
  /** segmentation column, if "by X" / "per X" was detected */
  groupBy?: string;
  /** forecast horizon in periods, clamped to 3..12 */
  horizon?: number;
  /** forecast period */
  period?: "day" | "week" | "month";
  /** a KPI expression extracted from the brief, if any */
  kpiExpression?: string;
  /** text column for sentiment / keyword analysis, if one was named */
  textColumn?: string;
  /** human-readable focus topics, used by the report */
  focusTopics: string[];
  /** the tab the analyzer should land on after Analyze */
  primaryTab: string;
}

/** Map an intent kind to the insight categories it should prioritize. */
export const KIND_TO_INSIGHT_CATEGORIES: Record<IntentKind, InsightCategory[]> = {
  forecast: ["forecast"],
  trend: ["trend"],
  seasonality: ["seasonality"],
  segmentation: ["segmentation", "geographic", "product"],
  correlation: ["correlation"],
  outliers: ["outlier"],
  distribution: ["distribution"],
  kpi: ["summary"],
  churn: ["churn"],
  quality: ["quality"],
  report: [],
  ranking: ["segmentation", "geographic", "product"],
  sentiment: ["sentiment"],
  pareto: ["pareto"],
  cohort: ["cohort"],
  text: ["text"],
};

const KIND_LABEL: Record<IntentKind, string> = {
  forecast: "forecast",
  trend: "trend",
  seasonality: "seasonality",
  segmentation: "segmentation",
  correlation: "correlation",
  outliers: "outliers",
  distribution: "distribution",
  kpi: "kpi",
  churn: "churn",
  report: "report",
  ranking: "ranking",
  quality: "data quality",
  sentiment: "sentiment",
  pareto: "pareto / 80-20",
  cohort: "cohort retention",
  text: "text / keywords",
};

const ROLE_KEYWORDS: { role: string; words: RegExp }[] = [
  { role: "revenue", words: /\b(revenue|sales|mrr|arr|income|turnover|gross|topline)\b/ },
  { role: "profit", words: /\b(profit|margin|net|earnings)\b/ },
  { role: "cost", words: /\b(cost|expense|spend|cogs)\b/ },
  { role: "quantity", words: /\b(units?|qty|quantity|volume)\b/ },
  { role: "price", words: /\b(price|pricing)\b/ },
];

export function parseBrief(brief: string, dataset: Dataset | null): AnalysisIntent | null {
  const text = brief.trim();
  if (!text) return null;
  const lower = text.toLowerCase();

  const analyses: IntentKind[] = [];
  const keywords: string[] = [];
  const add = (kind: IntentKind) => {
    if (!analyses.includes(kind)) analyses.push(kind);
  };
  const kw = (s: string) => {
    if (s && !keywords.includes(s)) keywords.push(s);
  };

  if (/\b(forecast|predict|projection|project|future|upcoming|next\s+\w+)/.test(lower)) {
    add("forecast");
    kw("forecast");
  }
  if (/\b(trend|growth|growing|decline|declining|dropped|drop\b|decreas|increas|over time|trajectory)/.test(lower)) {
    add("trend");
    kw("trend");
  }
  if (/\b(seasonal|seasonality|cyclic|cycle|periodic|rhythm|monthly pattern|quarterly pattern)/.test(lower)) {
    add("seasonality");
    kw("seasonality");
  }
  if (/\b(segment|breakdown|break down|group by|grouped by|split by|cut by|slice by|by\s+[a-z])/.test(lower)) {
    add("segmentation");
    kw("segmentation");
  }
  if (/\b(correlat|driver|drivers|drives|relationship|associated with|factors|impact of|what drives|levers)/.test(lower)) {
    add("correlation");
    kw("correlation");
  }
  if (/\b(outlier|anomaly|anomalies|unusual|abnormal|spike|spikes)/.test(lower)) {
    add("outliers");
    kw("outliers");
  }
  if (/\b(distribut|spread|histogram|variance|skew|long tail)/.test(lower)) {
    add("distribution");
    kw("distribution");
  }
  if (/\b(kpi|metric|ratio|per customer|per user|per record|revenue per|divided by|average.*per|conversion|arpu)/.test(lower)) {
    add("kpi");
    kw("kpi");
  }
  if (/\b(churn|retention|retain|attrition|lost customers)/.test(lower)) {
    add("churn");
    kw("churn");
  }
  if (/\b(report|summary|executive|board|presentation|document|memo|deck|brief)/.test(lower)) {
    add("report");
    kw("report");
  }
  if (/\b(top|best|largest|biggest|highest|ranking|rank|leader|winners)/.test(lower)) {
    add("ranking");
    kw("ranking");
  }
  if (/\b(clean|missing|duplicate|duplicates|data quality|impute)/.test(lower)) {
    add("quality");
    kw("data quality");
  }
  if (/\b(sentiment|feedback|review|reviews|opinion|opinions|nps|satisfaction|feeling|feelings|tone)/.test(lower)) {
    add("sentiment");
    kw("sentiment");
  }
  if (/\b(pareto|80\/?20|80-20|concentration|vital few|long tail|long-tail)/.test(lower)) {
    add("pareto");
    kw("pareto");
  }
  if (/\b(cohort|retention|retain|repeating|repeat customers|lifecycle|retained)/.test(lower)) {
    add("cohort");
    kw("cohort");
  }
  if (/\b(keyword|keywords|themes|theme|word frequency|top words|top terms|word cloud|topics)/.test(lower)) {
    add("text");
    kw("keywords");
  }

  // target metric
  let metric: string | undefined;
  if (dataset) {
    for (const { role, words } of ROLE_KEYWORDS) {
      if (words.test(lower)) {
        const col = dataset.schema.find((c) => c.role === role && c.type === "number");
        if (col) {
          metric = col.name;
          kw(role);
          break;
        }
      }
    }
    if (!metric) {
      for (const col of dataset.columns) {
        const sc = dataset.schema.find((c) => c.name === col);
        if (sc?.type === "number" && lower.includes(col.toLowerCase())) {
          metric = col;
          kw(col);
          break;
        }
      }
    }
    if (!metric) metric = pickPrimaryMetric(dataset)?.name;
  }

  // segmentation column
  let groupBy: string | undefined;
  if (dataset) {
    const m = lower.match(/\b(?:by|per|segment(?:ed)? by|group(?:ed)? by|split by|cut by|slice by)\s+([a-z_ ]+)/);
    if (m) {
      const col = matchColumn(m[1].trim(), dataset);
      if (col) {
        groupBy = col;
        kw(col);
      }
    }
    if (!groupBy) {
      if (/\bregion\b/.test(lower)) groupBy = dataset.schema.find((c) => c.role === "region")?.name;
      else if (/\bproduct\b/.test(lower)) groupBy = dataset.schema.find((c) => c.role === "product")?.name;
      else if (/\bcustomer\b/.test(lower)) groupBy = dataset.schema.find((c) => c.role === "customer")?.name;
      else if (/\bsegment\b/.test(lower)) groupBy = matchColumn("segment", dataset) ?? undefined;
      if (groupBy) kw(groupBy);
    }
  }

  // text column (for sentiment / keyword analysis) — only when named in the prompt;
  // otherwise the analysis auto-detects the longest text column.
  let textColumn: string | undefined;
  if (dataset && (analyses.includes("sentiment") || analyses.includes("text"))) {
    const strs = dataset.schema.filter((c) => c.type === "string");
    for (const c of strs) {
      if (c.name.length > 2 && lower.includes(c.name.toLowerCase())) {
        textColumn = c.name;
        kw(c.name);
        break;
      }
    }
  }

  // forecast horizon + period
  let horizon: number | undefined;
  let period: "day" | "week" | "month" | undefined;
  const hm = lower.match(/\bnext\s+(\d+)\s+(month|week|day|quarter|year)s?\b/);
  const sm = !hm && lower.match(/\bnext\s+(month|week|day|quarter|year)\b/);
  if (hm) {
    const n = Number(hm[1]);
    const unit = hm[2];
    if (unit === "quarter") {
      period = "month";
      horizon = n * 3;
    } else if (unit === "year") {
      period = "month";
      horizon = n * 12;
    } else {
      period = unit as "day" | "week" | "month";
      horizon = n;
    }
    kw(`next ${n} ${unit}${n > 1 ? "s" : ""}`);
  } else if (sm) {
    const unit = sm[1];
    if (unit === "quarter") {
      period = "month";
      horizon = 3;
    } else if (unit === "year") {
      period = "month";
      horizon = 12;
    } else {
      period = unit as "day" | "week" | "month";
      horizon = unit === "month" ? 1 : unit === "week" ? 4 : 7;
    }
    kw(`next ${unit}`);
  }
  if (horizon !== undefined) horizon = Math.max(3, Math.min(12, horizon));

  // KPI expression: "X per/divided by/over Y" is the clearest KPI signal
  let kpiExpression: string | undefined;
  const ratio = text.match(
    /\b([a-z_]+(?:\s+[a-z_]+)?)\s+(?:per|divided by|over)\s+([a-z_]+(?:\s+[a-z_]+){0,2})\b/i,
  );
  if (ratio) {
    kpiExpression = `${ratio[1].trim()} per ${ratio[2].trim()}`;
    add("kpi");
    kw("kpi");
  }

  // focus topics for the report
  const focusTopics = analyses
    .filter((a) => a !== "quality")
    .map((a) => {
      switch (a) {
        case "forecast":
          return `Forecast ${metric ?? "the primary metric"}${
            horizon ? ` for the next ${horizon} ${period ?? "month"}${horizon > 1 ? "s" : ""}` : ""
          }`;
        case "segmentation":
          return `Segmentation${groupBy ? ` by ${groupBy}` : ""}`;
        case "correlation":
          return "Correlation and drivers";
        case "outliers":
          return "Outlier and anomaly detection";
        case "trend":
          return "Trend over time";
        case "seasonality":
          return "Seasonality";
        case "distribution":
          return "Distribution shape";
        case "kpi":
          return kpiExpression ? `KPI: ${kpiExpression}` : "KPI metrics";
        case "churn":
          return "Churn and retention";
        case "ranking":
          return "Top performers and ranking";
        case "report":
          return "Executive report";
        case "sentiment":
          return `Sentiment of ${textColumn ?? "the text column"}`;
        case "pareto":
          return `Pareto / 80-20 of ${metric ?? "the primary metric"}`;
        case "cohort":
          return "Cohort retention";
        case "text":
          return "Top themes / keywords";
        default:
          return KIND_LABEL[a];
      }
    });

  // where to land after Analyze
  const DEEP = new Set<IntentKind>(["sentiment", "pareto", "cohort", "text"]);
  let primaryTab = "overview";
  if (analyses.includes("report")) primaryTab = "report";
  else if (analyses.includes("forecast")) primaryTab = "forecast";
  else if (analyses.some((a) => DEEP.has(a))) primaryTab = "advanced";
  else if (analyses.includes("kpi")) primaryTab = "kpi";
  else if (analyses.includes("correlation")) primaryTab = "eda";
  else if (analyses.length) primaryTab = "insights";

  return {
    brief: text,
    keywords,
    analyses,
    metric,
    groupBy,
    horizon,
    period,
    kpiExpression,
    textColumn,
    focusTopics,
    primaryTab,
  };
}
