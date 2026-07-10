"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
} from "recharts";
import type { Dataset } from "@/lib/types";
import type { AnalysisIntent } from "@/lib/analysis/intent";
import { BriefBanner } from "@/components/studio/brief-bar";
import { forecast as runForecast } from "@/lib/analysis/forecast";
import { dateColumnNames, numericColumnNames } from "@/lib/analysis/profile";
import { Panel, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Stat } from "@/components/ui/stat";
import { Badge } from "@/components/ui/badge";
import { AXIS, GRID_STROKE, compactTick } from "@/lib/viz";
import { fmt, pct, titleCase } from "@/lib/utils";
import { TrendingUp } from "lucide-react";

export function ForecastView({ dataset, intent }: { dataset: Dataset; intent?: AnalysisIntent | null }) {
  const dates = dateColumnNames(dataset);
  const nums = numericColumnNames(dataset);
  const [dateCol, setDateCol] = useState(dates[0] ?? "");
  const [valueCol, setValueCol] = useState(nums[0] ?? "");
  const [agg, setAgg] = useState<"sum" | "mean">("sum");
  const [period, setPeriod] = useState<"day" | "week" | "month">("month");
  const [horizon, setHorizon] = useState(6);

  // Apply the brief's forecast config when the user clicks Analyze.
  useEffect(() => {
    if (!intent || !intent.analyses.includes("forecast")) return;
    if (intent.metric && nums.includes(intent.metric)) setValueCol(intent.metric);
    if (intent.period) setPeriod(intent.period);
    if (intent.horizon) setHorizon(intent.horizon);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intent]);

  const result = useMemo(
    () => runForecast(dataset, { dateColumn: dateCol, valueColumn: valueCol, aggregation: agg, period, horizon }),
    [dataset, dateCol, valueCol, agg, period, horizon],
  );

  const chartData = useMemo(() => {
    if (!result) return [];
    const hist = result.history.map((h) => ({ label: h.label, actual: h.actual, forecast: null as number | null, lower: null as number | null, upper: null as number | null, band: null as number | null }));
    if (hist.length) hist[hist.length - 1].forecast = hist[hist.length - 1].actual; // connect lines
    const hor = result.horizon.map((h) => ({ label: h.label, actual: null, forecast: h.forecast, lower: h.lower, upper: h.upper, band: h.upper != null && h.lower != null ? h.upper - h.lower : null }));
    return [...hist, ...hor];
  }, [result]);

  if (!dates.length || !nums.length) {
    return (
      <Panel><CardBody>
        <p className="text-sm text-muted">Forecasting needs a date column and a numeric metric. Your dataset is missing one of them.</p>
      </CardBody></Panel>
    );
  }

  const acc = result ? (1 - result.metrics.mape) * 100 : 0;
  const next = result?.horizon[0];

  return (
    <div className="space-y-4">
      <BriefBanner intent={intent} />
      <Panel>
        <CardBody>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Field label="date column">
              <select value={dateCol} onChange={(e) => setDateCol(e.target.value)} className="neu-inset h-9 rounded-lg px-2 text-sm text-ink outline-none">
                {dates.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </Field>
            <Field label="value column">
              <select value={valueCol} onChange={(e) => setValueCol(e.target.value)} className="neu-inset h-9 rounded-lg px-2 text-sm text-ink outline-none">
                {nums.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </Field>
            <Field label="aggregation">
              <select value={agg} onChange={(e) => setAgg(e.target.value as "sum" | "mean")} className="neu-inset h-9 rounded-lg px-2 text-sm text-ink outline-none">
                <option value="sum">sum</option><option value="mean">mean</option>
              </select>
            </Field>
            <Field label="period">
              <select value={period} onChange={(e) => setPeriod(e.target.value as "day" | "week" | "month")} className="neu-inset h-9 rounded-lg px-2 text-sm text-ink outline-none">
                <option value="month">month</option><option value="week">week</option><option value="day">day</option>
              </select>
            </Field>
            <Field label={`horizon · ${horizon}`}>
              <input type="range" min={3} max={12} value={horizon} onChange={(e) => setHorizon(Number(e.target.value))} className="h-9 w-full accent-[var(--cyan)]" />
            </Field>
          </div>
        </CardBody>
      </Panel>

      {result ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label={`Next ${period}`} value={fmt(next?.forecast ?? 0, { compact: true })} sub={`band ${fmt(next?.lower ?? 0, { compact: true })} – ${fmt(next?.upper ?? 0, { compact: true })}`} tone="cyan" />
            <Stat label="Backtest accuracy" value={pct(acc / 100, 0)} sub={`MAPE ${(result.metrics.mape * 100).toFixed(1)}%`} tone={acc > 80 ? "green" : acc > 65 ? "amber" : "red"} />
            <Stat label="Trend / period" value={fmt(result.metrics.trend, { compact: true })} sub={result.metrics.trend >= 0 ? "growth" : "decay"} tone={result.metrics.trend >= 0 ? "green" : "red"} />
            <Stat label="Fit (R²)" value={result.metrics.r2.toFixed(2)} sub="linear trend strength" tone="purple" />
          </div>

          <Panel>
            <CardHeader>
              <CardTitle prompt><span className="flex items-center gap-2"><TrendingUp size={15} className="text-cyan" /> {titleCase(valueCol)} forecast: {agg} by {period}</span></CardTitle>
              <div className="flex gap-2">
                <Badge tone="cyan">actual</Badge>
                <Badge tone="magenta">forecast</Badge>
                <Badge tone="muted">95% band</Badge>
              </div>
            </CardHeader>
            <CardBody>
              <ResponsiveContainer width="100%" height={320}>
                <ComposedChart data={chartData} margin={{ top: 8, right: 16, bottom: 0, left: -8 }}>
                  <CartesianGrid stroke={GRID_STROKE} vertical={false} />
                  <XAxis dataKey="label" {...AXIS} tick={{ ...AXIS.tick, fontSize: 10 }} interval="preserveStartEnd" minTickGap={24} />
                  <YAxis {...AXIS} tickFormatter={compactTick} width={56} />
                  <Tooltip
                    contentStyle={{ background: "var(--surface-2)", border: "1px solid var(--border-strong)", borderRadius: 8, fontFamily: "var(--font-mono)", fontSize: 12 }}
                    formatter={(v: number, name: string) => [v === null ? "N/A" : fmt(v, { compact: true }), name]}
                  />
                  <ReferenceLine x={result.history[result.history.length - 1]?.label} stroke="var(--border-strong)" strokeDasharray="3 3" />
                  {/* confidence band: stacked transparent base + visible width */}
                  <Area dataKey="lower" stackId="band" stroke="none" fill="none" connectNulls />
                  <Area dataKey="band" stackId="band" stroke="none" fill="#22d3ee" fillOpacity={0.14} connectNulls name="band" />
                  <Line type="monotone" dataKey="actual" stroke="#22d3ee" strokeWidth={2} dot={false} connectNulls name="actual" />
                  <Line type="monotone" dataKey="forecast" stroke="#ff3da6" strokeWidth={2} strokeDasharray="5 4" dot={false} connectNulls name="forecast" />
                </ComposedChart>
              </ResponsiveContainer>
              <p className="mt-3 text-sm leading-relaxed text-muted">{result.summary}</p>
            </CardBody>
          </Panel>
        </>
      ) : (
        <Panel><CardBody><p className="text-sm text-muted">Not enough time-series points (need ≥6 {period}s) to forecast with these columns. Try a different period.</p></CardBody></Panel>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block font-mono text-[10px] uppercase tracking-widest text-muted">{label}</span>
      {children}
    </label>
  );
}
