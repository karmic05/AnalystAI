/* ============================================================
   AI Business Insights — a rule-based analyst that mines real,
   data-grounded insights from the dataset. Each insight carries
   confidence, supporting metrics, business impact and an action.
   The LLM provider (lib/ai) can rewrite the prose but the numbers
   always come from here.
   ============================================================ */

import type { Dataset, Insight, InsightCategory } from "@/lib/types";
import { aggregateBy, numericSeries, pickPrimaryCategory, pickPrimaryDate, pickPrimaryMetric } from "./profile";
import { topCorrelations } from "./correlation";
import { linreg, max, mean, outlierMask, skewness, std, sum } from "./stats";
import { toNumber } from "@/lib/data/schema";
import { toDate } from "@/lib/data/schema";
import { clamp, fmt, pct, titleCase, uid } from "@/lib/utils";

interface MonthlyPoint { key: string; label: string; value: number; t: number }

function monthlySeries(dataset: Dataset, dateCol: string, valueCol: string): MonthlyPoint[] {
  const map = new Map<string, { sum: number; count: number; ts: number }>();
  for (const row of dataset.rows) {
    const d = toDate(row[dateCol]);
    const v = toNumber(row[valueCol]);
    if (!d || Number.isNaN(v)) continue;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const slot = map.get(key) ?? { sum: 0, count: 0, ts: new Date(d.getFullYear(), d.getMonth(), 1).getTime() };
    slot.sum += v;
    slot.count += 1;
    map.set(key, slot);
  }
  const pts = [...map.entries()]
    .map(([key, s]) => ({ key, label: key, value: s.sum, t: s.ts }))
    .sort((a, b) => a.t - b.t);
  return pts;
}

function confidenceFromN(n: number): number {
  return clamp(0.45 + Math.min(n, 1000) / 1000 * 0.45, 0.45, 0.92);
}

export function generateInsights(
  dataset: Dataset,
  opts?: { metric?: string; date?: string; category?: string },
): Insight[] {
  const insights: Insight[] = [];
  const n = dataset.rowCount;
  const metric = pickPrimaryMetric(dataset, opts?.metric);
  const date = pickPrimaryDate(dataset, opts?.date);
  const cat = pickPrimaryCategory(dataset, opts?.category);

  // 1 — Summary KPI snapshot
  if (metric) {
    const series = numericSeries(dataset, metric.name);
    const total = sum(series);
    const avg = mean(series);
    insights.push({
      id: uid("ins"),
      category: "summary",
      title: `Dataset snapshot — ${titleCase(metric.name)}`,
      summary: `${fmt(total, { compact: true, currency: metric.role === "revenue" || metric.role === "cost" || metric.role === "profit" })} total ${metric.name} across ${n.toLocaleString()} records (avg ${fmt(avg, { compact: true })}/record).`,
      confidence: confidenceFromN(n),
      metrics: [
        { label: "Total", value: fmt(total, { compact: true }) },
        { label: "Average", value: fmt(avg, { compact: true }) },
        { label: "Records", value: n.toLocaleString() },
      ],
      impact: "medium",
      impactReason: "Establishes the baseline every downstream insight is measured against.",
      action: "Use this total as the denominator for share/concentration analysis and as the forecast base.",
    });
  }

  // 2 — Trend (date + metric)
  if (date && metric) {
    const monthly = monthlySeries(dataset, date.name, metric.name);
    if (monthly.length >= 4) {
      const ys = monthly.map((p) => p.value);
      const reg = linreg(monthly.map((_, i) => i), ys);
      const first = ys[0];
      const last = ys[ys.length - 1];
      const growth = first !== 0 ? (last - first) / Math.abs(first) : NaN;
      const dir = reg.slope > 0 ? "growing" : reg.slope < 0 ? "declining" : "flat";
      const cConf = clamp(confidenceFromN(n) * (0.6 + reg.r2 * 0.4), 0.4, 0.95);
      insights.push({
        id: uid("ins"),
        category: "trend",
        title: `${titleCase(metric.name)} is ${dir} — ${Number.isNaN(growth) ? "see chart" : pct(growth, 0) + " over the period"}`,
        summary: `Over ${monthly.length} months, ${metric.name} moved from ${fmt(first, { compact: true, currency: metric.role === "revenue" })} to ${fmt(last, { compact: true, currency: metric.role === "revenue" })} per month, a slope of ${fmt(reg.slope, { compact: true })}/month (R²=${reg.r2.toFixed(2)}).`,
        confidence: cConf,
        metrics: [
          { label: "Start/mo", value: fmt(first, { compact: true }) },
          { label: "Latest/mo", value: fmt(last, { compact: true }) },
          { label: "Slope/mo", value: fmt(reg.slope, { compact: true }) },
          { label: "R²", value: reg.r2.toFixed(2) },
        ],
        impact: reg.r2 > 0.6 ? "high" : "medium",
        impactReason: dir === "growing"
          ? "Sustained growth compounds — small monthly gains become material annually."
          : dir === "declining"
            ? "A negative trend, if real, directly erodes the topline each month."
            : "A flat trend means growth must come from mix or new acquisition, not volume.",
        action: dir === "growing"
          ? "Protect the drivers of this growth (see segmentation) and pressure-test whether it is volume, price, or mix."
          : dir === "declining"
            ? "Isolate the segment/channel where the decline concentrates before cutting broad spend."
            : "Run a mix-shift analysis: which segment or product is quietly growing while another declines?",
      });

      // 3 — Seasonality
      if (monthly.length >= 14) {
        const byMonth = new Map<number, number[]>();
        for (const p of monthly) {
          const m = Number(p.label.slice(5, 7)) - 1;
          const arr = byMonth.get(m) ?? [];
          arr.push(p.value);
          byMonth.set(m, arr);
        }
        const overall = mean(monthly.map((p) => p.value));
        const indices: { m: number; idx: number; avg: number }[] = [];
        byMonth.forEach((arr, m) => indices.push({ m, avg: mean(arr), idx: mean(arr) / overall }));
        indices.sort((a, b) => b.idx - a.idx);
        const peak = indices[0];
        const trough = indices[indices.length - 1];
        const amp = peak.idx - trough.idx;
        if (amp > 0.08) {
          insights.push({
            id: uid("ins"),
            category: "seasonality",
            title: `Seasonality detected — peak in ${monthName(peak.m)}, trough in ${monthName(trough.m)}`,
            summary: `Demand swings ${pct(amp / 2)} above/below the annual average. ${monthName(peak.m)} runs at ${pct(peak.idx)} of typical; ${monthName(trough.m)} at ${pct(trough.idx)}.`,
            confidence: clamp(confidenceFromN(n) * 0.9, 0.4, 0.9),
            metrics: [
              { label: "Peak month", value: `${monthName(peak.m)} (${pct(peak.idx)})` },
              { label: "Trough month", value: `${monthName(trough.m)} (${pct(trough.idx)})` },
              { label: "Amplitude", value: pct(amp / 2) },
            ],
            impact: amp > 0.25 ? "high" : "medium",
            impactReason: "Seasonal swings mislead naive forecasts and cause inventory/cash misalignment if unplanned.",
            action: "Build the forecast with a seasonal model, pre-shift inventory and marketing spend into the trough-to-peak ramp.",
          });
        }
      }
    }
  }

  // 4 — Segmentation / top performer (category + metric)
  if (cat && metric) {
    const agg = aggregateBy(dataset, cat.name, metric.name, "sum");
    if (agg.length >= 2) {
      const totalVal = sum(agg.map((a) => a.value));
      const top = agg[0];
      const topShare = top.value / totalVal;
      const top3Share = sum(agg.slice(0, 3).map((a) => a.value)) / totalVal;
      insights.push({
        id: uid("ins"),
        category: cat.role === "region" ? "geographic" : cat.role === "product" ? "product" : "segmentation",
        title: `${top.key} leads ${titleCase(cat.name)} with ${pct(topShare)} of ${titleCase(metric.name)}`,
        summary: `Top 3 of ${agg.length} ${cat.name} values account for ${pct(top3Share)} of total ${metric.name}. ${agg.length > 3 ? "The long tail contributes " + pct(1 - top3Share) + "." : ""}`,
        confidence: confidenceFromN(n),
        metrics: [
          { label: "Leader", value: `${top.key} (${pct(topShare)})` },
          { label: "Top-3 share", value: pct(top3Share) },
          { label: "Categories", value: String(agg.length) },
          { label: "Runner-up", value: agg[1] ? `${agg[1].key} (${pct(agg[1].value / totalVal)})` : "—" },
        ],
        impact: topShare > 0.5 ? "high" : "medium",
        impactReason: topShare > 0.5
          ? `Single-${cat.name} concentration above 50% is a dependency risk — a shock to "${top.key}" hits the whole number.`
          : "Mix is reasonably diversified; growth can be pursued without outsized single-segment risk.",
        action: topShare > 0.5
          ? `Diversify: set an explicit goal to grow the #2 ${cat.name} and reduce ${top.key}'s share below 45% over 2 quarters.`
          : `Double down on ${top.key} for margin while investing the #2-3 ${cat.name} for growth headroom.`,
      });
    }
  }

  // 5 — Correlation
  const corr = topCorrelations(dataset, 1, opts?.metric)[0];
  if (corr && corr.absR > 0.4) {
    const dir = corr.r > 0 ? "together" : "in opposite directions";
    insights.push({
      id: uid("ins"),
      category: "correlation",
      title: `${titleCase(corr.a)} and ${titleCase(corr.b)} move ${dir} (r=${corr.r.toFixed(2)})`,
      summary: `A ${Math.abs(corr.r) > 0.7 ? "strong" : "moderate"} ${corr.r > 0 ? "positive" : "negative"} relationship (r=${corr.r.toFixed(2)}). When ${titleCase(corr.a)} rises, ${titleCase(corr.b)} tends to ${corr.r > 0 ? "rise" : "fall"}.`,
      confidence: clamp(corr.absR, 0.4, 0.9),
      metrics: [
        { label: "Correlation", value: corr.r.toFixed(2) },
        { label: "Strength", value: Math.abs(corr.r) > 0.7 ? "strong" : "moderate" },
        { label: "Direction", value: corr.r > 0 ? "positive" : "negative" },
      ],
      impact: Math.abs(corr.r) > 0.7 ? "high" : "medium",
      impactReason: "Strong correlations reveal leverage: moving one metric likely moves the other — useful for forecasting and for spotting redundant or proxy metrics.",
      action: "Confirm the relationship isn't spurious by checking it holds within each segment, then use it as a leading indicator in the forecast.",
    });
  }

  // 6 — Distribution skew of primary metric
  if (metric) {
    const series = numericSeries(dataset, metric.name);
    const sk = skewness(series);
    if (Math.abs(sk) > 0.7) {
      insights.push({
        id: uid("ins"),
        category: "distribution",
        title: `${titleCase(metric.name)} is ${sk > 0 ? "right" : "left"}-skewed — mean ≠ typical`,
        summary: `Skew=${sk.toFixed(2)}. The mean (${fmt(mean(series), { compact: true })}) is ${sk > 0 ? "above" : "below"} the median (${fmt(series.length ? series.slice().sort((a, b) => a - b)[Math.floor(series.length / 2)] : 0, { compact: true })}), so a few ${sk > 0 ? "large" : "small"} records pull the average.`,
        confidence: clamp(confidenceFromN(n) * 0.85, 0.4, 0.85),
        metrics: [
          { label: "Skew", value: sk.toFixed(2) },
          { label: "Mean", value: fmt(mean(series), { compact: true }) },
          { label: "Std dev", value: fmt(std(series) || 0, { compact: true }) },
        ],
        impact: "low",
        impactReason: "Reporting the mean on skewed data overstates the typical case and can mislead targets and bonuses.",
        action: "Report the median alongside the mean, and segment the analysis so outliers are visible rather than averaged away.",
      });
    }
  }

  // 7 — Outliers in primary metric
  if (metric) {
    const series = numericSeries(dataset, metric.name);
    const outliers = outlierMask(series).filter(Boolean).length;
    if (outliers > 0) {
      insights.push({
        id: uid("ins"),
        category: "outlier",
        title: `${outliers} outlier record${outliers === 1 ? "" : "s"} in ${titleCase(metric.name)}`,
        summary: `${pct(outliers / series.length)} of values fall outside 1.5×IQR. These may be key accounts worth retaining or errors worth correcting.`,
        confidence: 0.7,
        metrics: [
          { label: "Outliers", value: String(outliers) },
          { label: "Share", value: pct(outliers / series.length) },
          { label: "Max", value: fmt(max(series), { compact: true }) },
        ],
        impact: outliers > series.length * 0.03 ? "medium" : "low",
        impactReason: "Outliers disproportionately influence averages, regressions and forecasts if left unchecked.",
        action: "Inspect the outlier rows — keep genuine enterprise deals, correct or cap data-entry errors.",
      });
    }
  }

  // 8 — Forecast teaser
  if (date && metric) {
    const monthly = monthlySeries(dataset, date.name, metric.name);
    if (monthly.length >= 6) {
      const ys = monthly.map((p) => p.value);
      const reg = linreg(monthly.map((_, i) => i), ys);
      const next = reg.intercept + reg.slope * ys.length;
      insights.push({
        id: uid("ins"),
        category: "forecast",
        title: `Next month projected at ${fmt(next, { compact: true, currency: metric.role === "revenue" })}`,
        summary: `Linear projection of the ${monthly.length}-month trend puts next ${date.name}'s ${metric.name} near ${fmt(next, { compact: true })}. See the Forecast tab for a model with confidence bands and accuracy.`,
        confidence: clamp(0.5 + reg.r2 * 0.3, 0.4, 0.8),
        metrics: [
          { label: "Projected", value: fmt(next, { compact: true }) },
          { label: "Trend/mo", value: fmt(reg.slope, { compact: true }) },
          { label: "Fit (R²)", value: reg.r2.toFixed(2) },
        ],
        impact: "medium",
        impactReason: "A defensible near-term forecast lets you pre-align inventory, hiring and spend.",
        action: "Open the Forecast tab, pick the horizon, and set a target ± the confidence band for the next planning cycle.",
      });
    }
  }

  // rank: high impact & high confidence first
  insights.sort((a, b) => impactRank(b.impact) + b.confidence - (impactRank(a.impact) + a.confidence));
  return insights.slice(0, 10);
}

function impactRank(i: Insight["impact"]): number {
  return i === "high" ? 1 : i === "medium" ? 0.5 : 0.2;
}

function monthName(m: number): string {
  return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][m] ?? String(m);
}

export const INSIGHT_CATEGORY_META: Record<InsightCategory, { label: string; color: string }> = {
  revenue: { label: "Revenue", color: "var(--green)" },
  trend: { label: "Trend", color: "var(--cyan)" },
  segmentation: { label: "Segmentation", color: "var(--purple)" },
  seasonality: { label: "Seasonality", color: "var(--amber)" },
  product: { label: "Product", color: "var(--purple)" },
  correlation: { label: "Correlation", color: "var(--magenta)" },
  quality: { label: "Data Quality", color: "var(--amber)" },
  distribution: { label: "Distribution", color: "var(--cyan)" },
  outlier: { label: "Outliers", color: "var(--red)" },
  geographic: { label: "Geographic", color: "var(--green)" },
  churn: { label: "Churn", color: "var(--red)" },
  forecast: { label: "Forecast", color: "var(--cyan)" },
  summary: { label: "Snapshot", color: "var(--text-dim)" },
};
