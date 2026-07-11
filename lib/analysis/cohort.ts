/* ============================================================
   Cohort analysis — group customers by their first-period cohort
   and track metric contribution + active-customer retention across
   subsequent periods. Deterministic. Requires date + customer +
   metric columns.
   ============================================================ */

import type { ColumnSchema, Dataset, Insight, CohortResult, CohortGroup } from "@/lib/types";
import { pickPrimaryDate, pickPrimaryMetric } from "./profile";
import { toDate, toNumber } from "@/lib/data/schema";
import { pct, titleCase, uid } from "@/lib/utils";

export function pickCustomer(dataset: Dataset, preferred?: string): ColumnSchema | null {
  if (preferred) {
    const hit = dataset.schema.find((c) => c.name === preferred) ?? dataset.schema.find((c) => c.name.toLowerCase() === preferred.toLowerCase());
    if (hit) return hit;
  }
  const roleHit = dataset.schema.find((c) => c.role === "customer");
  if (roleHit) return roleHit;
  const nameHit = dataset.schema.find((c) => (c.type === "string" || c.type === "number") && /(customer|client|user|account|reviewer)/i.test(c.name));
  return nameHit ?? null;
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function monthsBetween(a: string, b: string): number {
  const [ay, am] = a.split("-").map(Number);
  const [by, bm] = b.split("-").map(Number);
  return (ay - by) * 12 + (am - bm);
}

export function analyzeCohort(
  dataset: Dataset,
  opts?: { date?: string; customer?: string; metric?: string },
): CohortResult | null {
  const date = pickPrimaryDate(dataset, opts?.date);
  const metric = pickPrimaryMetric(dataset, opts?.metric);
  const customer = pickCustomer(dataset, opts?.customer);
  if (!date || !metric || !customer) return null;

  // first period per customer
  const firstPeriod = new Map<string, string>();
  for (const row of dataset.rows) {
    const d = toDate(row[date.name]);
    const cust = row[customer.name];
    if (!d || cust === null || cust === undefined || cust === "") continue;
    const key = String(cust);
    const mk = monthKey(d);
    const prev = firstPeriod.get(key);
    if (!prev || mk < prev) firstPeriod.set(key, mk);
  }
  if (!firstPeriod.size) return null;

  // cohort size
  const cohortSize = new Map<string, number>();
  for (const mk of firstPeriod.values()) cohortSize.set(mk, (cohortSize.get(mk) ?? 0) + 1);

  // accumulate per cohort × period
  const cohorts = new Map<string, Map<number, { value: number; active: Set<string> }>>();
  for (const row of dataset.rows) {
    const d = toDate(row[date.name]);
    const v = toNumber(row[metric.name]);
    const cust = row[customer.name];
    if (!d || Number.isNaN(v) || cust === null || cust === undefined || cust === "") continue;
    const ck = String(cust);
    const cohort = firstPeriod.get(ck);
    if (!cohort) continue;
    const idx = monthsBetween(monthKey(d), cohort);
    if (idx < 0) continue;
    const grp = cohorts.get(cohort) ?? new Map();
    const slot = grp.get(idx) ?? { value: 0, active: new Set<string>() };
    slot.value += v;
    slot.active.add(ck);
    grp.set(idx, slot);
    cohorts.set(cohort, grp);
  }

  const labels = [...cohorts.keys()].sort();
  const groups: CohortGroup[] = labels.map((label) => {
    const grp = cohorts.get(label)!;
    const size = cohortSize.get(label) ?? 0;
    const maxIdx = Math.max(...grp.keys(), 0);
    const periods = [];
    for (let i = 0; i <= maxIdx; i++) {
      const slot = grp.get(i);
      periods.push({
        index: i,
        value: slot?.value ?? 0,
        active: slot?.active.size ?? 0,
        retention: size ? (slot?.active.size ?? 0) / size : 0,
      });
    }
    return { label, size, periods };
  });

  const capped = groups.slice(-15); // most recent 15 cohorts for a readable table
  const maxPeriods = capped.reduce((m, g) => Math.max(m, g.periods.length), 0);
  const earliest = capped[0];
  const latestRetention = earliest?.periods[earliest.periods.length - 1]?.retention ?? 0;
  const summary = `${capped.length} ${titleCase(customer.name)} cohorts by ${date.name}. The ${earliest?.label ?? "first"} cohort retained ${pct(latestRetention)} through period ${earliest?.periods.length ? earliest.periods.length - 1 : 0}.`;

  return {
    dateColumn: date.name,
    customerColumn: customer.name,
    metric: metric.name,
    period: "month",
    cohorts: capped,
    maxPeriods,
    summary,
  };
}

export function cohortInsight(r: CohortResult): Insight {
  const first = r.cohorts[0];
  const retention = first?.periods[first.periods.length - 1]?.retention ?? 0;
  return {
    id: uid("ins"),
    category: "cohort",
    title: `Cohort retention: ${first?.label ?? "first"} cohort holds ${pct(retention)} by period ${first ? first.periods.length - 1 : 0}`,
    summary: r.summary,
    confidence: 0.7,
    metrics: [
      { label: "Cohorts", value: String(r.cohorts.length) },
      { label: "First cohort size", value: String(first?.size ?? 0) },
      { label: "End retention", value: pct(retention) },
    ],
    impact: retention < 0.3 ? "high" : "medium",
    impactReason: "Cohort retention shows whether later-period revenue depends on repeat customers or constant new acquisition.",
    action: retention < 0.3
      ? "Retention is low — prioritize onboarding and re-engagement for the first 1-2 periods before spending more on acquisition."
      : "Retention is healthy; scale acquisition knowing the cohort base compounds.",
  };
}
