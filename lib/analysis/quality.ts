/* ============================================================
   Data-quality detection → actionable cleaning recommendations.
   ============================================================ */

import type { Dataset, QualityIssue } from "@/lib/types";
import { numericSeries } from "./profile";
import { outlierMask, skewness, std } from "./stats";
import { uid, pct } from "@/lib/utils";

export function detectQuality(dataset: Dataset): QualityIssue[] {
  const issues: QualityIssue[] = [];
  const n = dataset.rowCount || 1;

  for (const col of dataset.schema) {
    if (col.missing > 0) {
      const ratio = col.missing / n;
      issues.push({
        id: uid("q"),
        severity: ratio > 0.1 ? "high" : ratio > 0.03 ? "medium" : "low",
        column: col.name,
        kind: "missing",
        title: `${col.missing} missing value${col.missing === 1 ? "" : "s"} in "${col.name}"`,
        detail: `${pct(ratio)} of rows are blank. ${col.type === "number" ? "Numeric column — imputation recommended." : "Categorical/text column — fill or flag recommended."}`,
        affected: col.missing,
        recommendation:
          col.type === "number"
            ? "Impute with the median (robust to outliers) or flag as a sentinel 0 with a missing indicator."
            : "Fill with the mode, an 'Unknown' label, or drop rows if the column is critical.",
        autoFix:
          col.type === "number"
            ? { label: "Impute with median", description: `Replace blanks with the median of "${col.name}".` }
            : { label: "Fill with 'Unknown'", description: `Replace blanks with the literal label "Unknown".` },
      });
    }

    if (col.type === "number") {
      const series = numericSeries(dataset, col.name);
      const mask = outlierMask(series);
      const outlierCount = mask.filter(Boolean).length;
      if (outlierCount > 0) {
        const ratio = outlierCount / series.length;
        issues.push({
          id: uid("q"),
          severity: ratio > 0.05 ? "high" : "medium",
          column: col.name,
          kind: "outlier",
          title: `${outlierCount} outlier${outlierCount === 1 ? "" : "s"} detected in "${col.name}"`,
          detail: `Using the 1.5×IQR rule on ${series.length} values. Outliers can distort averages and forecasts.`,
          affected: outlierCount,
          recommendation: "Review outliers — keep if genuine, cap (winsorize) at the 1st/99th percentile if they are data-entry errors.",
          autoFix: { label: "Winsorize at 5/95", description: `Cap "${col.name}" values below the 5th and above the 95th percentile.` },
        });
      }

      const sk = skewness(series);
      if (Math.abs(sk) > 1) {
        issues.push({
          id: uid("q"),
          severity: "low",
          column: col.name,
          kind: "skewed",
          title: `"${col.name}" is ${sk > 0 ? "right" : "left"}-skewed (skew=${sk.toFixed(2)})`,
          detail: "Heavy skew can mislead models that assume normality and compress small values on charts.",
          affected: series.length,
          recommendation: "Consider a log transform for modeling, or report the median instead of the mean in summaries.",
          autoFix: { label: "Add log transform", description: `Create a log1p copy of "${col.name}" for modeling.` },
        });
      }
    }

    if (col.type === "string" && col.topValues) {
      // detect case inconsistency: same value with different casing
      const lower = new Map<string, Set<string>>();
      for (const tv of col.topValues) {
        const k = tv.value.toLowerCase();
        const set = lower.get(k) ?? new Set();
        set.add(tv.value);
        lower.set(k, set);
      }
      let inconsistent = 0;
      for (const set of lower.values()) if (set.size > 1) inconsistent++;
      if (inconsistent > 0) {
        const sampleSet = [...lower.values()].find((s) => s.size > 1);
        const sample = sampleSet ? [...sampleSet].join(" / ") : "";
        issues.push({
          id: uid("q"),
          severity: "medium",
          column: col.name,
          kind: "inconsistent",
          title: `${inconsistent} value${inconsistent === 1 ? "" : "s"} in "${col.name}" differ only by case`,
          detail: `e.g. variants like ${sample}. These inflate your category count.`,
          affected: inconsistent,
          recommendation: "Normalize to a canonical case (title-case) so categories group correctly.",
          autoFix: { label: "Title-case normalize", description: `Standardize "${col.name}" values to title case.` },
        });
      }
    }
  }

  // duplicate rows (whole-row)
  const dupes = countDuplicateRows(dataset);
  if (dupes > 0) {
    issues.push({
      id: uid("q"),
      severity: dupes / n > 0.05 ? "high" : "medium",
      column: "(entire row)",
      kind: "duplicate",
      title: `${dupes} duplicate row${dupes === 1 ? "" : "s"} found`,
      detail: `${pct(dupes / n)} of rows are exact duplicates of another row.`,
      affected: dupes,
      recommendation: "Remove exact duplicate rows to avoid double-counting in aggregations.",
      autoFix: { label: "Remove duplicates", description: "Drop exact duplicate rows, keeping the first occurrence." },
    });
  }

  issues.sort((a, b) => sevRank(b.severity) - sevRank(a.severity));
  return issues;
}

function countDuplicateRows(dataset: Dataset): number {
  const seen = new Set<string>();
  let dupes = 0;
  for (const row of dataset.rows) {
    const key = JSON.stringify(dataset.columns.map((c) => row[c]));
    if (seen.has(key)) dupes++;
    else seen.add(key);
  }
  return dupes;
}

function sevRank(s: QualityIssue["severity"]): number {
  return s === "high" ? 3 : s === "medium" ? 2 : 1;
}

/** Apply a chosen auto-fix and return a new dataset (immutable). */
export function applyFix(dataset: Dataset, issue: QualityIssue): Dataset {
  const rows = dataset.rows.map((r) => ({ ...r }));
  const cols = dataset.columns;

  if (issue.kind === "duplicate") {
    const seen = new Set<string>();
    const deduped = rows.filter((r) => {
      const key = JSON.stringify(cols.map((c) => r[c]));
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    return { ...dataset, rows: deduped, rowCount: deduped.length };
  }

  if (issue.column === "(entire row)") return dataset;
  const col = issue.column;

  if (issue.kind === "missing") {
    const schemaCol = dataset.schema.find((c) => c.name === col);
    if (schemaCol?.type === "number") {
      const vals = rows.map((r) => r[col]).filter((v) => v !== null && v !== undefined && v !== "").map(Number).filter((n) => !Number.isNaN(n));
      vals.sort((a, b) => a - b);
      const med = vals[Math.floor(vals.length / 2)] ?? 0;
      for (const r of rows) if (r[col] === null || r[col] === undefined || r[col] === "") r[col] = med;
    } else {
      for (const r of rows) if (r[col] === null || r[col] === undefined || r[col] === "") r[col] = "Unknown";
    }
    return { ...dataset, rows };
  }

  if (issue.kind === "outlier") {
    const vals = rows.map((r) => Number(r[col])).filter((n) => !Number.isNaN(n)).sort((a, b) => a - b);
    if (!vals.length) return dataset;
    const lo = vals[Math.floor(vals.length * 0.05)];
    const hi = vals[Math.floor(vals.length * 0.95)];
    for (const r of rows) {
      const n = Number(r[col]);
      if (Number.isNaN(n)) continue;
      r[col] = Math.min(Math.max(n, lo), hi);
    }
    return { ...dataset, rows };
  }

  if (issue.kind === "inconsistent") {
    for (const r of rows) {
      const v = r[col];
      if (typeof v === "string" && v) {
        r[col] = v.replace(/\b\w/g, (c) => c.toUpperCase()).replace(/_/g, " ");
      }
    }
    return { ...dataset, rows };
  }

  return dataset;
}
