/* ============================================================
   Statistical primitives — pure functions, fully testable.
   No external deps. Everything operates on number[] arrays.
   ============================================================ */

export function mean(xs: number[]): number {
  if (!xs.length) return NaN;
  let s = 0;
  for (const x of xs) s += x;
  return s / xs.length;
}

export function sum(xs: number[]): number {
  let s = 0;
  for (const x of xs) s += x;
  return s;
}

export function variance(xs: number[]): number {
  if (xs.length < 2) return NaN;
  const m = mean(xs);
  let s = 0;
  for (const x of xs) s += (x - m) ** 2;
  return s / (xs.length - 1);
}

export function std(xs: number[]): number {
  return Math.sqrt(variance(xs));
}

export function median(xs: number[]): number {
  if (!xs.length) return NaN;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/** Quantile q in [0,1] via linear interpolation (type-7, R/NumPy default). */
export function quantile(xs: number[], q: number): number {
  if (!xs.length) return NaN;
  const s = [...xs].sort((a, b) => a - b);
  if (q <= 0) return s[0];
  if (q >= 1) return s[s.length - 1];
  const pos = (s.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  if (lo === hi) return s[lo];
  return s[lo] + (s[hi] - s[lo]) * (pos - lo);
}

export function min(xs: number[]): number {
  if (!xs.length) return NaN;
  let m = xs[0];
  for (const x of xs) if (x < m) m = x;
  return m;
}

export function max(xs: number[]): number {
  if (!xs.length) return NaN;
  let m = xs[0];
  for (const x of xs) if (x > m) m = x;
  return m;
}

/** Pearson correlation. Returns NaN if either series has zero variance. */
export function pearson(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length < 2) return NaN;
  const mx = mean(x);
  const my = mean(y);
  let cov = 0;
  let vx = 0;
  let vy = 0;
  for (let i = 0; i < x.length; i++) {
    const dx = x[i] - mx;
    const dy = y[i] - my;
    cov += dx * dy;
    vx += dx * dx;
    vy += dy * dy;
  }
  const denom = Math.sqrt(vx * vy);
  if (denom === 0) return NaN;
  return cov / denom;
}

export interface LinReg {
  slope: number;
  intercept: number;
  r2: number;
}

/** Ordinary least squares linear regression y ~ x (x as index or provided). */
export function linreg(x: number[], y: number[]): LinReg {
  if (x.length !== y.length || x.length < 2) return { slope: NaN, intercept: NaN, r2: NaN };
  const mx = mean(x);
  const my = mean(y);
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (let i = 0; i < x.length; i++) {
    sxy += (x[i] - mx) * (y[i] - my);
    sxx += (x[i] - mx) ** 2;
    syy += (y[i] - my) ** 2;
  }
  const slope = sxx === 0 ? 0 : sxy / sxx;
  const intercept = my - slope * mx;
  const r2 = syy === 0 ? 1 : (sxy * sxy) / (sxx * syy);
  return { slope, intercept, r2 };
}

/** Mean absolute percentage error (bounded; ignores zero-actual points). */
export function mape(actual: number[], pred: number[]): number {
  let s = 0;
  let n = 0;
  for (let i = 0; i < actual.length; i++) {
    if (actual[i] === 0 || Number.isNaN(actual[i]) || Number.isNaN(pred[i])) continue;
    s += Math.abs((actual[i] - pred[i]) / actual[i]);
    n++;
  }
  return n ? s / n : NaN;
}

/**
 * Holt's linear trend exponential smoothing.
 * Produces a forecast of `horizon` steps with a residual-based band.
 */
export function holtForecast(
  series: number[],
  horizon: number,
  opts?: { alpha?: number; beta?: number },
): {
  level: number;
  trend: number;
  fitted: number[];
  forecast: number[];
  residualStd: number;
} {
  const alpha = opts?.alpha ?? 0.5;
  const beta = opts?.beta ?? 0.2;
  if (series.length < 4) {
    const last = series[series.length - 1] ?? 0;
    return { level: last, trend: 0, fitted: series.slice(), forecast: Array(horizon).fill(last), residualStd: 0 };
  }
  let level = series[0];
  let trend = series[1] - series[0];
  const fitted: number[] = [series[0], series[1]];
  const resid: number[] = [0, 0];
  for (let t = 2; t < series.length; t++) {
    const pred = level + trend;
    fitted.push(pred);
    resid.push(series[t] - pred);
    const newLevel = alpha * series[t] + (1 - alpha) * pred;
    trend = beta * (newLevel - level) + (1 - beta) * trend;
    level = newLevel;
  }
  const forecast: number[] = [];
  for (let h = 1; h <= horizon; h++) forecast.push(level + h * trend);
  const residClean = resid.slice(2);
  const residualStd = std(residClean.length ? residClean : resid) || 0;
  return { level, trend, fitted, forecast, residualStd };
}

/** IQR-based outlier mask for a numeric series. */
export function outlierMask(xs: number[]): boolean[] {
  if (xs.length < 4) return xs.map(() => false);
  const q1 = quantile(xs, 0.25);
  const q3 = quantile(xs, 0.75);
  const iqr = q3 - q1;
  const lo = q1 - 1.5 * iqr;
  const hi = q3 + 1.5 * iqr;
  return xs.map((x) => x < lo || x > hi);
}

/** Skewness (Fisher-Pearson, adjusted). */
export function skewness(xs: number[]): number {
  if (xs.length < 3) return NaN;
  const m = mean(xs);
  const sd = std(xs);
  if (sd === 0) return 0;
  let s = 0;
  for (const x of xs) s += ((x - m) / sd) ** 3;
  const n = xs.length;
  return (n / ((n - 1) * (n - 2))) * s;
}

/** Histogram bins (Freedman-Diaconis-ish fallback to sqrt rule). */
export function histogram(xs: number[], bins?: number): { label: string; count: number; x0: number; x1: number }[] {
  if (!xs.length) return [];
  const lo = min(xs);
  const hi = max(xs);
  const n = bins ?? Math.max(5, Math.min(20, Math.ceil(Math.sqrt(xs.length))));
  const width = (hi - lo) / n || 1;
  const out = Array.from({ length: n }, (_, i) => {
    const x0 = lo + i * width;
    const x1 = i === n - 1 ? hi : x0 + width;
    return { label: "", count: 0, x0, x1 };
  });
  for (const x of xs) {
    let idx = Math.floor((x - lo) / width);
    if (idx >= n) idx = n - 1;
    if (idx < 0) idx = 0;
    out[idx].count++;
  }
  for (const b of out) b.label = `${b.x0.toFixed(1)}–${b.x1.toFixed(1)}`;
  return out;
}
