/* ============================================================
   Correlation analysis (Pearson) across numeric columns.
   ============================================================ */

import type { CorrelationMatrix, Dataset } from "@/lib/types";
import { numericSeries, numericColumnNames } from "./profile";
import { pearson } from "./stats";

export function correlationMatrix(dataset: Dataset): CorrelationMatrix {
  const cols = numericColumnNames(dataset);
  const series = cols.map((c) => numericSeries(dataset, c));
  // Align lengths to the min non-null length per pair lazily; for the matrix we
  // use pairwise-complete observations up to the shortest series.
  const minLen = series.length ? Math.min(...series.map((s) => s.length)) : 0;
  const matrix: number[][] = cols.map((_, i) =>
    cols.map((__, j) => {
      if (i === j) return 1;
      if (!minLen) return NaN;
      const a = series[i].slice(0, minLen);
      const b = series[j].slice(0, minLen);
      return round(pearson(a, b), 3);
    }),
  );
  return { columns: cols, matrix };
}

export interface CorrelationPair {
  a: string;
  b: string;
  r: number;
  absR: number;
}

export function topCorrelations(dataset: Dataset, limit = 5, anchor?: string): CorrelationPair[] {
  const { columns, matrix } = correlationMatrix(dataset);
  const pairs: CorrelationPair[] = [];
  for (let i = 0; i < columns.length; i++) {
    for (let j = i + 1; j < columns.length; j++) {
      const r = matrix[i][j];
      if (Number.isNaN(r)) continue;
      pairs.push({ a: columns[i], b: columns[j], r: round(r, 3), absR: Math.abs(r) });
    }
  }
  pairs.sort((a, b) => {
    // When an anchor metric is given, surface pairs involving it first.
    if (anchor) {
      const ai = a.a === anchor || a.b === anchor ? 1 : 0;
      const bi = b.a === anchor || b.b === anchor ? 1 : 0;
      if (ai !== bi) return bi - ai;
    }
    return b.absR - a.absR;
  });
  return pairs.slice(0, limit);
}

function round(n: number, d: number): number {
  const f = 10 ** d;
  return Math.round(n * f) / f;
}
