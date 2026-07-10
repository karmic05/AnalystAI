/* ============================================================
   KPI builder — convert a short natural-language definition into
   an executable calculation over the dataset. Supports sums,
   averages, counts, distinct counts, min/max/median, and a
   two-term ratio ("X divided by Y").
   ============================================================ */

import type { Dataset, KpiDefinition } from "@/lib/types";
import { numericSeries } from "./profile";
import { toNumber } from "@/lib/data/schema";
import { mean, max, median, min, sum } from "./stats";
import { fmt, titleCase, uid } from "@/lib/utils";

const SYNONYMS: Record<string, string[]> = {
  revenue: ["revenue", "sales", "mrr", "arr", "amount", "income", "turnover", "gross"],
  customers: ["customer", "client", "account", "user", "active", "subscriber"],
  cost: ["cost", "expense", "spend", "cogs"],
  profit: ["profit", "margin", "net", "earnings"],
  units: ["unit", "qty", "quantity", "volume", "count"],
};

export function parseKpi(expression: string, dataset: Dataset): KpiDefinition {
  const id = uid("kpi");
  const text = expression.toLowerCase().trim();
  const label = expression.trim();

  try {
    const node = parseExpression(text, dataset);
    if (!node) throw new Error("I couldn't find a metric or aggregation in that definition.");

    const value = node.compute();
    const isCurrency = node.currency;
    return {
      id,
      label,
      expression,
      value,
      display: fmt(value, { compact: true, currency: isCurrency }),
      formula: node.formula,
      valid: true,
    };
  } catch (e) {
    return {
      id,
      label,
      expression,
      value: NaN,
      display: "—",
      formula: "",
      valid: false,
      error: e instanceof Error ? e.message : "Could not parse this KPI.",
    };
  }
}

interface KpiNode {
  compute: () => number;
  formula: string;
  currency: boolean;
}

function parseExpression(text: string, dataset: Dataset): KpiNode | null {
  // ratio: "X divided by Y" or "X / Y"
  const divMatch = text.match(/^(.*?)\s+(?:divided by|over|per|\/)\s+(.*)$/);
  if (divMatch) {
    const left = parseExpression(divMatch[1], dataset);
    const right = parseExpression(divMatch[2], dataset);
    if (left && right) {
      const lv = left.compute();
      const rv = right.compute();
      return {
        compute: () => (rv === 0 ? NaN : lv / rv),
        formula: `(${left.formula}) ÷ (${right.formula})`,
        currency: false,
      };
    }
  }

  // count of rows
  if (/\b(total rows|row count|number of rows|count of rows|records|count)\b/.test(text) && !/of [a-z]/.test(text.replace(/of rows|of records/, ""))) {
    return { compute: () => dataset.rowCount, formula: `COUNT(*) = ${dataset.rowCount}`, currency: false };
  }

  // distinct / unique count of a column
  let m = text.match(/\b(?:distinct|unique|number of)\s+(?:values?\s+(?:in|of)\s+)?(.+)/);
  if (m) {
    const col = matchColumn(m[1], dataset);
    if (col) {
      const distinct = new Set(dataset.rows.map((r) => String(r[col])).filter((v) => v && v !== "null")).size;
      return { compute: () => distinct, formula: `COUNT(DISTINCT ${col}) = ${distinct}`, currency: false };
    }
  }

  // count of <col> (non-null)
  m = text.match(/\bcount\s+of\s+(.+)/);
  if (m) {
    const col = matchColumn(m[1], dataset);
    if (col) {
      const n = dataset.rows.filter((r) => r[col] !== null && r[col] !== undefined && r[col] !== "").length;
      return { compute: () => n, formula: `COUNT(${col}) = ${n}`, currency: false };
    }
  }

  // active customers → distinct customer id
  if (/active.*(customer|client|user|subscriber)/.test(text) || /(customer|client|user|subscriber).*active/.test(text)) {
    const col = matchColumnByRole(dataset, "customer") ?? matchColumn("customer", dataset);
    if (col) {
      const distinct = new Set(dataset.rows.map((r) => String(r[col])).filter(Boolean)).size;
      return { compute: () => distinct, formula: `COUNT(DISTINCT ${col}) [active] = ${distinct}`, currency: false };
    }
  }

  // aggregation of a numeric column
  const aggMatch = text.match(/\b(sum|total|average|avg|mean|median|min|maximum|max|maximum)\s+(?:of\s+)?(.+)/);
  if (aggMatch) {
    const verb = aggMatch[1];
    const colName = matchColumn(aggMatch[2], dataset);
    if (colName) {
      const col = dataset.schema.find((c) => c.name === colName)!;
      const series = numericSeries(dataset, colName);
      const isCurrency = col.role === "revenue" || col.role === "cost" || col.role === "profit";
      return aggNode(verb, colName, series, isCurrency);
    }
  }

  // bare column name → sum by default
  const col = matchColumn(text, dataset);
  if (col) {
    const series = numericSeries(dataset, col);
    const schemaCol = dataset.schema.find((c) => c.name === col)!;
    const isCurrency = schemaCol.role === "revenue" || schemaCol.role === "cost" || schemaCol.role === "profit";
    return aggNode("sum", col, series, isCurrency);
  }

  return null;
}

function aggNode(verb: string, col: string, series: number[], currency: boolean): KpiNode {
  const v = verb.toLowerCase();
  let value: number;
  let fn: string;
  if (v === "sum" || v === "total") { value = sum(series); fn = "SUM"; }
  else if (v === "average" || v === "avg" || v === "mean") { value = mean(series); fn = "AVG"; }
  else if (v === "median") { value = median(series); fn = "MEDIAN"; }
  else if (v === "min") { value = min(series); fn = "MIN"; }
  else if (v === "max" || v === "maximum") { value = max(series); fn = "MAX"; }
  else { value = sum(series); fn = "SUM"; }
  return { compute: () => value, formula: `${fn}(${col}) = ${fmt(value, { compact: true, currency })}`, currency };
}

/** Match a phrase to a column name using direct + synonym + token overlap. */
export function matchColumn(phrase: string, dataset: Dataset): string | null {
  const p = phrase.replace(/[^a-z0-9 ]/g, " ").trim();
  if (!p) return null;
  const tokens = p.split(/\s+/);

  // 1. exact/substring column name
  for (const col of dataset.columns) {
    const norm = col.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (norm === p.replace(/\s+/g, "") || p.includes(norm) || norm.includes(p.replace(/\s+/g, ""))) {
      if (norm.length >= 3) return col;
    }
  }

  // 2. synonym → role → first column of that role
  for (const [role, syns] of Object.entries(SYNONYMS)) {
    if (tokens.some((t) => syns.includes(t))) {
      const byRole = dataset.schema.find((c) => c.role === role);
      if (byRole) return byRole.name;
    }
  }

  // 3. best token overlap
  let best: { col: string; score: number } | null = null;
  for (const col of dataset.columns) {
    const colTokens = col.toLowerCase().replace(/[^a-z0-9]/g, " ").split(/\s+/).filter(Boolean);
    const overlap = tokens.filter((t) => t.length > 2 && colTokens.includes(t)).length;
    if (overlap > 0 && (!best || overlap > best.score)) best = { col, score: overlap };
  }
  return best?.col ?? null;
}

function matchColumnByRole(dataset: Dataset, role: string): string | null {
  return dataset.schema.find((c) => c.role === role)?.name ?? null;
}

export const KPI_EXAMPLES = [
  "total revenue",
  "average revenue per record",
  "distinct customer_id",
  "total revenue divided by distinct customer_id",
  "average profit",
  "max revenue",
];
