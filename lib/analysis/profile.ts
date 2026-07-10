/* ============================================================
   Dataset profiling + column selectors used across the engine.
   ============================================================ */

import type { ColumnSchema, Dataset, DatasetProfile } from "@/lib/types";
import { toNumber } from "@/lib/data/schema";

export function buildProfile(dataset: Dataset): DatasetProfile {
  const numericColumns = dataset.schema.filter((c) => c.type === "number").map((c) => c.name);
  const categoricalColumns = dataset.schema
    .filter((c) => c.type === "string" || c.type === "boolean")
    .map((c) => c.name);
  const dateColumns = dataset.schema.filter((c) => c.type === "date").map((c) => c.name);

  let totalCells = 0;
  let presentCells = 0;
  for (const row of dataset.rows) {
    for (const col of dataset.columns) {
      totalCells++;
      const v = row[col];
      if (v !== null && v !== undefined && v !== "") presentCells++;
    }
  }
  const duplicateRows = countDuplicates(dataset);

  return {
    rowCount: dataset.rowCount,
    columnCount: dataset.columns.length,
    numericColumns,
    categoricalColumns,
    dateColumns,
    completeness: totalCells ? presentCells / totalCells : 0,
    duplicateRows,
  };
}

function countDuplicates(dataset: Dataset): number {
  const seen = new Set<string>();
  let dupes = 0;
  for (const row of dataset.rows) {
    const key = JSON.stringify(dataset.columns.map((c) => row[c]));
    if (seen.has(key)) dupes++;
    else seen.add(key);
  }
  return dupes;
}

export function columnValues(dataset: Dataset, name: string): unknown[] {
  return dataset.rows.map((r) => r[name]);
}

export function numericSeries(dataset: Dataset, name: string): number[] {
  const out: number[] = [];
  for (const v of columnValues(dataset, name)) {
    if (v === null || v === undefined || v === "") continue;
    const n = toNumber(v);
    if (!Number.isNaN(n)) out.push(n);
  }
  return out;
}

export function numericColumnNames(dataset: Dataset): string[] {
  return dataset.schema.filter((c) => c.type === "number").map((c) => c.name);
}

export function dateColumnNames(dataset: Dataset): string[] {
  return dataset.schema.filter((c) => c.type === "date").map((c) => c.name);
}

export function categoricalColumnNames(dataset: Dataset): string[] {
  return dataset.schema.filter((c) => c.type === "string" || c.type === "boolean").map((c) => c.name);
}

const ROLE_PRIORITY_METRIC: ColumnSchema["role"][] = ["revenue", "profit", "quantity", "price", "cost", "metric"];
const ROLE_PRIORITY_CATEGORY: ColumnSchema["role"][] = ["region", "product", "category", "customer"];

export function pickPrimaryDate(dataset: Dataset): ColumnSchema | null {
  const dates = dataset.schema.filter((c) => c.type === "date");
  if (!dates.length) return null;
  dates.sort((a, b) => {
    const ra = a.role === "date" ? 0 : 1;
    const rb = b.role === "date" ? 0 : 1;
    return ra - rb;
  });
  return dates[0];
}

export function pickPrimaryMetric(dataset: Dataset): ColumnSchema | null {
  const nums = dataset.schema.filter((c) => c.type === "number");
  for (const role of ROLE_PRIORITY_METRIC) {
    const found = nums.find((c) => c.role === role);
    if (found) return found;
  }
  return nums[0] ?? null;
}

export function pickPrimaryCategory(dataset: Dataset): ColumnSchema | null {
  const cats = dataset.schema.filter((c) => c.type === "string" || c.type === "boolean");
  for (const role of ROLE_PRIORITY_CATEGORY) {
    const found = cats.find((c) => c.role === role);
    if (found) return found;
  }
  return cats[0] ?? null;
}

/** Aggregate a numeric column grouped by another column. */
export function aggregateBy(
  dataset: Dataset,
  groupCol: string,
  valueCol: string,
  agg: "sum" | "mean" | "count" = "sum",
): { key: string; value: number; count: number }[] {
  const map = new Map<string, { sum: number; count: number }>();
  for (const row of dataset.rows) {
    const g = row[groupCol];
    if (g === null || g === undefined || g === "") continue;
    const key = String(g);
    const slot = map.get(key) ?? { sum: 0, count: 0 };
    if (agg === "count") {
      slot.count += 1;
    } else {
      const n = toNumber(row[valueCol]);
      if (!Number.isNaN(n)) {
        slot.sum += n;
        slot.count += 1;
      }
    }
    map.set(key, slot);
  }
  const out = [...map.entries()].map(([key, s]) => ({
    key,
    value: agg === "count" ? s.count : agg === "mean" ? (s.count ? s.sum / s.count : 0) : s.sum,
    count: s.count,
  }));
  out.sort((a, b) => b.value - a.value);
  return out;
}
