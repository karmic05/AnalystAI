/* ============================================================
   Schema inference + semantic role detection.
   ============================================================ */

import type { ColumnSchema, ColumnType, ColumnRole } from "@/lib/types";
import { max, mean, median, min, quantile, std } from "@/lib/analysis/stats";

const DATE_RE = /^\d{4}[-/]\d{1,2}[-/]\d{1,2}([ T]\d{1,2}:\d{2}(:\d{2})?)?$/;
const US_DATE_RE = /^\d{1,2}[-/]\d{1,2}[-/]\d{2,4}$/;

export function inferSchema(columns: string[], rows: Record<string, unknown>[]): ColumnSchema[] {
  return columns.map((col) => inferColumn(col, rows));
}

function inferColumn(name: string, rows: Record<string, unknown>[]): ColumnSchema {
  const values = rows.map((r) => r[name]);
  const nonNull = values.filter((v) => v !== null && v !== undefined && v !== "");
  const missing = values.length - nonNull.length;
  const type = detectType(nonNull);
  const role = detectRole(name, type);
  const unique = new Set(nonNull.map((v) => String(v))).size;

  const base: ColumnSchema = { name, type, missing, unique, role };

  if (type === "number") {
    const nums = nonNull.map(toNumber).filter((n): n is number => !Number.isNaN(n));
    if (nums.length) {
      base.min = min(nums);
      base.max = max(nums);
      base.mean = mean(nums);
      base.median = median(nums);
      base.std = std(nums);
      base.q1 = quantile(nums, 0.25);
      base.q3 = quantile(nums, 0.75);
    }
  } else if (type === "date") {
    const dates = nonNull.map(toDate).filter((d): d is Date => d !== null).sort((a, b) => a.getTime() - b.getTime());
    if (dates.length) {
      base.minDate = dates[0].toISOString();
      base.maxDate = dates[dates.length - 1].toISOString();
    }
  } else if (type === "string" || type === "boolean") {
    const counts = new Map<string, number>();
    for (const v of nonNull) {
      const key = String(v);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const top = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([value, count]) => ({ value, count, share: count / nonNull.length }));
    base.topValues = top;
  }

  return base;
}

function detectType(values: unknown[]): ColumnType {
  if (!values.length) return "string";
  const sample = values.slice(0, Math.min(values.length, 200));
  let num = 0;
  let date = 0;
  let bool = 0;
  for (const v of sample) {
    const s = String(v).trim();
    if (s === "") continue;
    if (s === "true" || s === "false" || s === "yes" || s === "no" || s === "True" || s === "False") {
      bool++;
      continue;
    }
    if (DATE_RE.test(s) || US_DATE_RE.test(s) || isParsableDate(s)) {
      date++;
      continue;
    }
    if (isNumeric(s)) {
      num++;
      continue;
    }
  }
  const n = sample.length;
  if (num / n > 0.8) return "number";
  if (date / n > 0.7) return "date";
  if (bool / n > 0.8) return "boolean";
  return "string";
}

function isNumeric(s: string): boolean {
  if (s === "") return false;
  const cleaned = s.replace(/[$,%\s]/g, "");
  return cleaned !== "" && !Number.isNaN(Number(cleaned));
}

export function toNumber(v: unknown): number {
  if (typeof v === "number") return v;
  const s = String(v).replace(/[$,%\s]/g, "");
  const n = Number(s);
  return Number.isNaN(n) ? NaN : n;
}

function isParsableDate(s: string): boolean {
  // Avoid treating plain numbers as dates.
  if (/^\d+(\.\d+)?$/.test(s)) return false;
  const d = new Date(s);
  return !Number.isNaN(d.getTime()) && s.length >= 8 && /[/-]/.test(s);
}

export function toDate(v: unknown): Date | null {
  if (v instanceof Date) return v;
  const s = String(v).trim();
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function detectRole(name: string, type: ColumnType): ColumnRole {
  const n = name.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (type === "date" || /date|day|month|year|time|timestamp|created|updated/.test(n)) return "date";
  if (/revenue|sales|amount|gross|income|turnover/.test(n)) return "revenue";
  if (/cost|expense|spend|cogs/.test(n)) return "cost";
  if (/profit|margin|net/.test(n)) return "profit";
  if (/qty|quantity|units|volume|count/.test(n)) return "quantity";
  if (/price|rate|unitprice/.test(n)) return "price";
  if (/region|country|state|city|geo|market|territory/.test(n)) return "region";
  if (/product|item|sku|category/.test(n)) return "product";
  if (/customer|client|account|company/.test(n)) return "customer";
  if (/segment|channel|type|status|tier|label/.test(n)) return "category";
  if (type === "number") return "metric";
  if (/(^|_)id$|guid|uuid/.test(n)) return "id";
  return "unknown";
}
