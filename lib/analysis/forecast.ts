/* ============================================================
   Time-series forecasting — period aggregation + Holt's linear
   trend, residual-based confidence bands, and a holdout MAPE.
   ============================================================ */

import type { Dataset, ForecastPoint, ForecastResult } from "@/lib/types";
import { pickPrimaryDate, pickPrimaryMetric, numericSeries } from "./profile";
import { toNumber } from "@/lib/data/schema";
import { toDate } from "@/lib/data/schema";
import { holtForecast, linreg, mape, std } from "./stats";
import { fmt, pct } from "@/lib/utils";

interface SeriesPoint { ts: number; label: string; value: number }

function periodKey(d: Date, period: "day" | "week" | "month"): { key: string; ts: number } {
  if (period === "month") {
    const ts = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
    return { key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, ts };
  }
  if (period === "week") {
    const tmp = new Date(d);
    const day = (tmp.getDay() + 6) % 7; // Monday=0
    tmp.setDate(tmp.getDate() - day);
    const ts = new Date(tmp.getFullYear(), tmp.getMonth(), tmp.getDate()).getTime();
    return { key: new Date(ts).toISOString().slice(0, 10), ts };
  }
  const ts = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  return { key: d.toISOString().slice(0, 10), ts };
}

function periodLabel(key: string, period: "day" | "week" | "month"): string {
  if (period === "month") {
    const [y, m] = key.split("-");
    return `${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][Number(m) - 1]} ${y}`;
  }
  return key;
}

export interface ForecastOptions {
  dateColumn?: string;
  valueColumn?: string;
  aggregation?: "sum" | "mean";
  period?: "day" | "week" | "month";
  horizon?: number;
}

export function forecast(dataset: Dataset, opts: ForecastOptions = {}): ForecastResult | null {
  const dateCol = opts.dateColumn ?? pickPrimaryDate(dataset)?.name;
  const valueCol = opts.valueColumn ?? pickPrimaryMetric(dataset)?.name;
  if (!dateCol || !valueCol) return null;

  const aggregation = opts.aggregation ?? "sum";
  const period = opts.period ?? "month";
  const horizon = opts.horizon ?? 6;

  const buckets = new Map<string, { ts: number; sum: number; count: number }>();
  for (const row of dataset.rows) {
    const d = toDate(row[dateCol]);
    const v = toNumber(row[valueCol]);
    if (!d || Number.isNaN(v)) continue;
    const { key, ts } = periodKey(d, period);
    const slot = buckets.get(key) ?? { ts, sum: 0, count: 0 };
    slot.sum += v;
    slot.count += 1;
    buckets.set(key, slot);
  }

  const series: SeriesPoint[] = [...buckets.entries()]
    .map(([key, s]) => ({
      ts: s.ts,
      key,
      label: periodLabel(key, period),
      value: aggregation === "mean" ? (s.count ? s.sum / s.count : 0) : s.sum,
    }))
    .sort((a, b) => a.ts - b.ts);

  if (series.length < 6) return null;

  const ys = series.map((p) => p.value);

  // holdout: fit on first 80%, measure MAPE on last 20%
  const split = Math.max(4, Math.floor(ys.length * 0.8));
  const train = ys.slice(0, split);
  const test = ys.slice(split);
  const holdoutFit = holtForecast(train, test.length);
  const holdoutMape = test.length ? mape(test, holdoutFit.forecast.slice(0, test.length)) : NaN;

  // full fit for the actual forecast
  const full = holtForecast(ys, horizon);
  const band = 1.96 * (full.residualStd || std(ys) || 0); // 95% interval

  const history: ForecastPoint[] = series.map((p, i) => ({
    label: p.label,
    actual: p.value,
    forecast: full.fitted[i] ?? null,
    lower: null,
    upper: null,
  }));

  let lastTs = series[series.length - 1].ts;
  const horizonPts: ForecastPoint[] = full.forecast.map((f) => {
    const nextTs = nextPeriodTs(lastTs, period);
    lastTs = nextTs;
    return {
      label: periodLabel(formatTs(nextTs, period), period),
      actual: null,
      forecast: Math.max(0, f),
      lower: Math.max(0, f - band),
      upper: f + band,
    };
  });

  const r2 = linreg(series.map((_, i) => i), ys).r2;
  const next = full.forecast[0];
  const last = ys[ys.length - 1];
  const deltaPct = last !== 0 ? (next - last) / Math.abs(last) : 0;
  const summary = `Projected ${valueCol} for the next ${horizon} ${period}s ${deltaPct >= 0 ? "rises" : "falls"} from ${fmt(last, { compact: true })} to ~${fmt(next, { compact: true })} (${deltaPct >= 0 ? "+" : ""}${pct(deltaPct, 0)}). Model accuracy MAPE=${(Number.isNaN(holdoutMape) ? 0 : holdoutMape * 100).toFixed(1)}%, trend ${full.trend >= 0 ? "+" : ""}${fmt(full.trend, { compact: true })}/${period}.`;

  return {
    dateColumn: dateCol,
    valueColumn: valueCol,
    aggregation,
    period,
    history,
    horizon: horizonPts,
    metrics: {
      mape: Number.isNaN(holdoutMape) ? 0 : holdoutMape,
      r2,
      level: full.level,
      trend: full.trend,
    },
    summary,
  };
}

function nextPeriodTs(ts: number, period: "day" | "week" | "month"): number {
  const d = new Date(ts);
  if (period === "month") return new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();
  if (period === "week") return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7).getTime();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).getTime();
}

function formatTs(ts: number, period: "day" | "week" | "month"): string {
  const d = new Date(ts);
  if (period === "month") return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  return d.toISOString().slice(0, 10);
}
