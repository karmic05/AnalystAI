/* ============================================================
   Pareto / 80-20 analysis — how much of a metric the "vital few"
   categories account for versus the long tail. Deterministic.
   ============================================================ */

import type { Dataset, Insight, ParetoResult } from "@/lib/types";
import { aggregateBy, pickPrimaryCategory, pickPrimaryMetric } from "./profile";
import { pct, titleCase, uid } from "@/lib/utils";

export function analyzePareto(
  dataset: Dataset,
  opts?: { metric?: string; category?: string },
): ParetoResult | null {
  const metric = pickPrimaryMetric(dataset, opts?.metric);
  const category = pickPrimaryCategory(dataset, opts?.category);
  if (!metric || !category) return null;

  const agg = aggregateBy(dataset, category.name, metric.name, "sum");
  if (agg.length < 2) return null;

  const total = agg.reduce((a, b) => a + b.value, 0);
  if (!total) return null;

  let cum = 0;
  const buckets = agg.map((a) => {
    cum += a.value;
    return { key: a.key, value: a.value, share: a.value / total, cumulative: cum / total };
  });

  const vitalFewIndex = buckets.findIndex((b) => b.cumulative >= 0.8);
  const vitalFewCount = vitalFewIndex >= 0 ? vitalFewIndex + 1 : buckets.length;
  const vitalFewShare = buckets[vitalFewCount - 1]?.cumulative ?? 1;
  const topShare = buckets[0].share;

  const summary = `${vitalFewCount} of ${buckets.length} ${titleCase(category.name)} account for ${pct(vitalFewShare)} of ${titleCase(metric.name)} — a ${vitalFewShare >= 0.8 ? "classic 80/20" : "moderate"} concentration. The top category, ${buckets[0].key}, alone is ${pct(topShare)}.`;

  return {
    metric: metric.name,
    category: category.name,
    buckets,
    vitalFewCount,
    vitalFewShare,
    topShare,
    total,
    summary,
  };
}

export function paretoInsight(r: ParetoResult): Insight {
  return {
    id: uid("ins"),
    category: "pareto",
    title: `${r.vitalFewCount} ${titleCase(r.category)} make up ${pct(r.vitalFewShare)} of ${titleCase(r.metric)} (80/20)`,
    summary: r.summary,
    confidence: 0.85,
    metrics: [
      { label: "Vital few", value: `${r.vitalFewCount} of ${r.buckets.length}` },
      { label: "Vital-few share", value: pct(r.vitalFewShare) },
      { label: "Top category", value: `${r.buckets[0].key} (${pct(r.topShare)})` },
    ],
    impact: r.vitalFewShare >= 0.8 ? "high" : "medium",
    impactReason: r.vitalFewShare >= 0.8
      ? "Heavy concentration means a shock to the vital few moves the whole number — a dependency risk and a focus opportunity."
      : "Concentration is moderate; growth can be pursued across several categories without outsized single-category risk.",
    action: r.vitalFewShare >= 0.8
      ? `Defend the top ${r.vitalFewCount} ${r.category} while deliberately diversifying into the strongest long-tail candidates.`
      : `Double down on the top ${r.vitalFewCount} for margin; invest in the long tail for growth headroom.`,
  };
}
