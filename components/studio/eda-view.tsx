"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Cell,
} from "recharts";
import type { CorrelationMatrix, Dataset } from "@/lib/types";
import type { AnalysisIntent } from "@/lib/analysis/intent";
import { BriefBanner } from "@/components/studio/brief-bar";
import { Panel, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { aggregateBy, numericSeries, pickPrimaryCategory, pickPrimaryDate, pickPrimaryMetric } from "@/lib/analysis/profile";
import { histogram } from "@/lib/analysis/stats";
import { toNumber } from "@/lib/data/schema";
import { toDate } from "@/lib/data/schema";
import { correlationColor, CHART_COLORS, AXIS, GRID_STROKE, compactTick } from "@/lib/viz";
import { fmt, titleCase } from "@/lib/utils";
import { LineChart as LineIcon, BarChart3, Grid3x3, Activity } from "lucide-react";

export function EDAView({ dataset, correlation, intent }: { dataset: Dataset; correlation: CorrelationMatrix; intent?: AnalysisIntent | null }) {
  const metric = pickPrimaryMetric(dataset);
  const date = pickPrimaryDate(dataset);
  const cat = pickPrimaryCategory(dataset);

  const trendData = useMemo(() => {
    if (!date || !metric) return [];
    const map = new Map<string, number>();
    for (const row of dataset.rows) {
      const d = toDate(row[date.name]);
      const v = toNumber(row[metric.name]);
      if (!d || Number.isNaN(v)) continue;
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      map.set(k, (map.get(k) ?? 0) + v);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([label, value]) => ({ label, value }));
  }, [dataset, date, metric]);

  const catData = useMemo(() => {
    if (!cat || !metric) return [];
    return aggregateBy(dataset, cat.name, metric.name, "sum").slice(0, 10).map((a) => ({ label: a.key, value: a.value }));
  }, [dataset, cat, metric]);

  const histData = useMemo(() => {
    if (!metric) return [];
    const series = numericSeries(dataset, metric.name);
    return histogram(series, 12).map((b) => ({ label: b.label, value: b.count }));
  }, [dataset, metric]);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {intent && (
        <div className="lg:col-span-2">
          <BriefBanner intent={intent} />
        </div>
      )}
      {trendData.length > 0 && (
        <Panel className="lg:col-span-2">
          <CardHeader><CardTitle prompt><span className="flex items-center gap-2"><LineIcon size={15} className="text-cyan" /> {titleCase(metric?.name ?? "")} trend by month</span></CardTitle></CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={trendData} margin={{ top: 8, right: 12, bottom: 0, left: -8 }}>
                <CartesianGrid stroke={GRID_STROKE} vertical={false} />
                <XAxis dataKey="label" {...AXIS} tick={{ ...AXIS.tick, fontSize: 10 }} interval="preserveStartEnd" minTickGap={28} />
                <YAxis {...AXIS} tickFormatter={compactTick} width={56} />
                <Tooltip
                  contentStyle={{ background: "var(--surface-2)", border: "1px solid var(--border-strong)", borderRadius: 8, fontFamily: "var(--font-mono)", fontSize: 12 }}
                  labelStyle={{ color: "var(--text-dim)" }}
                  formatter={(v: number) => [fmt(v, { compact: true }), titleCase(metric?.name ?? "")]}
                />
                <Line type="monotone" dataKey="value" stroke="#22d3ee" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: "#22d3ee" }} />
              </LineChart>
            </ResponsiveContainer>
          </CardBody>
        </Panel>
      )}

      {catData.length > 0 && (
        <Panel>
          <CardHeader><CardTitle><span className="flex items-center gap-2"><BarChart3 size={15} className="text-purple" /> {titleCase(cat?.name ?? "")} by {titleCase(metric?.name ?? "")}</span></CardTitle></CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={catData} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 8 }}>
                <CartesianGrid stroke={GRID_STROKE} horizontal={false} />
                <XAxis type="number" {...AXIS} tickFormatter={compactTick} />
                <YAxis type="category" dataKey="label" {...AXIS} width={92} tick={{ ...AXIS.tick, fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ background: "var(--surface-2)", border: "1px solid var(--border-strong)", borderRadius: 8, fontFamily: "var(--font-mono)", fontSize: 12 }}
                  formatter={(v: number) => [fmt(v, { compact: true }), "total"]}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {catData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Panel>
      )}

      {histData.length > 0 && (
        <Panel>
          <CardHeader><CardTitle><span className="flex items-center gap-2"><Activity size={15} className="text-green" /> {titleCase(metric?.name ?? "")} distribution</span></CardTitle></CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={histData} margin={{ top: 4, right: 12, bottom: 0, left: -16 }}>
                <CartesianGrid stroke={GRID_STROKE} vertical={false} />
                <XAxis dataKey="label" {...AXIS} tick={{ ...AXIS.tick, fontSize: 9 }} interval={1} />
                <YAxis {...AXIS} width={40} />
                <Tooltip
                  contentStyle={{ background: "var(--surface-2)", border: "1px solid var(--border-strong)", borderRadius: 8, fontFamily: "var(--font-mono)", fontSize: 12 }}
                  formatter={(v: number) => [v, "records"]}
                />
                <Bar dataKey="value" fill="#43f9a0" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Panel>
      )}

      {correlation.columns.length >= 2 && (
        <Panel className="lg:col-span-2">
          <CardHeader><CardTitle><span className="flex items-center gap-2"><Grid3x3 size={15} className="text-magenta" /> correlation matrix</span></CardTitle></CardHeader>
          <CardBody>
            <Heatmap matrix={correlation} />
            <p className="mt-3 font-mono text-[11px] text-muted">
              Pearson r across numeric columns · cyan = positive, red = negative, opacity scales with |r|.
            </p>
          </CardBody>
        </Panel>
      )}

      {trendData.length === 0 && catData.length === 0 && histData.length === 0 && (
        <Panel className="lg:col-span-2">
          <CardBody>
            <p className="text-sm text-muted">Add a numeric or date column to generate exploratory charts.</p>
          </CardBody>
        </Panel>
      )}
    </div>
  );
}

function Heatmap({ matrix }: { matrix: CorrelationMatrix }) {
  const { columns, matrix: m } = matrix;
  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-full">
        <div className="grid" style={{ gridTemplateColumns: `120px repeat(${columns.length}, minmax(54px, 1fr))` }}>
          <div />
          {columns.map((c) => (
            <div key={c} className="px-1 pb-1 text-center font-mono text-[10px] text-muted" title={c}>
              {c.length > 8 ? c.slice(0, 7) + "…" : c}
            </div>
          ))}
          {m.map((row, i) => (
            <FragmentRow key={columns[i]} label={columns[i]} row={row} />
          ))}
        </div>
      </div>
    </div>
  );
}

function FragmentRow({ label, row }: { label: string; row: number[] }) {
  return (
    <>
      <div className="flex items-center truncate pr-2 font-mono text-[10px] text-muted" title={label}>
        {label.length > 14 ? label.slice(0, 13) + "…" : label}
      </div>
      {row.map((r, j) => (
        <div
          key={j}
          className="m-0.5 grid h-9 place-items-center rounded font-mono text-[10px]"
          style={{
            background: correlationColor(r),
            color: Math.abs(r) > 0.5 ? "#07070d" : "var(--text)",
            opacity: 0.45 + Math.abs(r) * 0.55,
          }}
          title={`r = ${r}`}
        >
          {Number.isNaN(r) ? "N/A" : r.toFixed(2)}
        </div>
      ))}
    </>
  );
}
