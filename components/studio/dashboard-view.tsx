"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from "recharts";
import type { Dataset, ForecastResult, Insight, KpiDefinition } from "@/lib/types";
import type { AnalysisIntent } from "@/lib/analysis/intent";
import { BriefBanner } from "@/components/studio/brief-bar";
import { Panel, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Stat } from "@/components/ui/stat";
import { Button } from "@/components/ui/button";
import { aggregateBy, numericSeries, pickPrimaryCategory, pickPrimaryDate, pickPrimaryMetric } from "@/lib/analysis/profile";
import { toNumber } from "@/lib/data/schema";
import { toDate } from "@/lib/data/schema";
import { AXIS, GRID_STROKE, CHART_COLORS, compactTick } from "@/lib/viz";
import { fmt, titleCase } from "@/lib/utils";
import { Printer, LayoutDashboard, LineChart as LineIcon, BarChart3 } from "lucide-react";

export function DashboardView({
  dataset,
  insights,
  forecast,
  savedKpis,
  intent,
}: {
  dataset: Dataset;
  insights: Insight[];
  forecast: ForecastResult | null;
  savedKpis: KpiDefinition[];
  intent?: AnalysisIntent | null;
}) {
  const metric = pickPrimaryMetric(dataset);
  const date = pickPrimaryDate(dataset);
  const cat = pickPrimaryCategory(dataset);
  const isCurrency = metric ? metric.role === "revenue" || metric.role === "cost" || metric.role === "profit" : false;

  const series = useMemo(() => (metric ? numericSeries(dataset, metric.name) : []), [dataset, metric]);
  const total = series.length ? series.reduce((a, b) => a + b, 0) : 0;
  const avg = series.length ? total / series.length : 0;

  const trend = useMemo(() => {
    if (!date || !metric) return [];
    const map = new Map<string, number>();
    for (const row of dataset.rows) {
      const d = toDate(row[date.name]); const v = toNumber(row[metric.name]);
      if (!d || Number.isNaN(v)) continue;
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      map.set(k, (map.get(k) ?? 0) + v);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([label, value]) => ({ label, value }));
  }, [dataset, date, metric]);

  const catData = useMemo(() => {
    if (!cat || !metric) return [];
    return aggregateBy(dataset, cat.name, metric.name, "sum").slice(0, 8).map((a) => ({ label: a.key, value: a.value }));
  }, [dataset, cat, metric]);

  return (
    <div className="space-y-4">
      <BriefBanner intent={intent} />
      <div className="no-print flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted"><LayoutDashboard size={15} className="text-cyan" /> auto-dashboard from your data</div>
        <Button variant="outline" size="sm" onClick={() => window.print()}><Printer size={14} /> Export PDF</Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label={metric ? `Total ${titleCase(metric.name)}` : "Total"} value={fmt(total, { compact: true, currency: isCurrency })} tone="cyan" />
        <Stat label="Average / record" value={fmt(avg, { compact: true, currency: isCurrency })} tone="purple" />
        <Stat label="Records" value={dataset.rowCount.toLocaleString()} tone="green" />
        <Stat label={forecast ? `Next ${forecast.period}` : "Forecast"} value={forecast ? fmt(forecast.horizon[0]?.forecast ?? 0, { compact: true, currency: isCurrency }) : "N/A"} tone="amber" sub={forecast ? `±${fmt(forecast.horizon[0]?.upper ?? 0, { compact: true })}` : undefined} />
      </div>

      {savedKpis.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {savedKpis.map((k) => (
            <Stat key={k.id} label={k.label} value={k.display} tone="muted" />
          ))}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {trend.length > 0 && (
          <Panel className="lg:col-span-2">
            <CardHeader><CardTitle prompt><span className="flex items-center gap-2"><LineIcon size={15} className="text-cyan" /> {titleCase(metric?.name ?? "")} over time</span></CardTitle></CardHeader>
            <CardBody>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={trend} margin={{ top: 6, right: 12, bottom: 0, left: -8 }}>
                  <CartesianGrid stroke={GRID_STROKE} vertical={false} />
                  <XAxis dataKey="label" {...AXIS} tick={{ ...AXIS.tick, fontSize: 10 }} minTickGap={28} />
                  <YAxis {...AXIS} tickFormatter={compactTick} width={56} />
                  <Tooltip contentStyle={tipStyle} formatter={(v: number) => [fmt(v, { compact: true }), titleCase(metric?.name ?? "")]} />
                  <Line type="monotone" dataKey="value" stroke="#22d3ee" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardBody>
          </Panel>
        )}

        {catData.length > 0 && (
          <Panel>
            <CardHeader><CardTitle><span className="flex items-center gap-2"><BarChart3 size={15} className="text-purple" /> by {titleCase(cat?.name ?? "")}</span></CardTitle></CardHeader>
            <CardBody>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={catData} margin={{ top: 4, right: 12, bottom: 0, left: -16 }}>
                  <CartesianGrid stroke={GRID_STROKE} vertical={false} />
                  <XAxis dataKey="label" {...AXIS} tick={{ ...AXIS.tick, fontSize: 10 }} interval={0} angle={-12} textAnchor="end" height={50} />
                  <YAxis {...AXIS} tickFormatter={compactTick} width={48} />
                  <Tooltip contentStyle={tipStyle} formatter={(v: number) => [fmt(v, { compact: true }), "total"]} />
                  <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                    {catData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardBody>
          </Panel>
        )}

        <Panel>
          <CardBody>
            <h3 className="prompt text-sm font-semibold">top insights</h3>
            <ul className="mt-3 space-y-2.5">
              {insights.slice(0, 5).map((i) => (
                <li key={i.id} className="flex items-start gap-2.5">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan" />
                  <div>
                    <div className="text-sm text-ink">{i.title}</div>
                    <div className="font-mono text-[10px] text-muted">{Math.round(i.confidence * 100)}% conf · {i.impact} impact</div>
                  </div>
                </li>
              ))}
            </ul>
          </CardBody>
        </Panel>
      </div>
    </div>
  );
}

const tipStyle = { background: "var(--surface-2)", border: "1px solid var(--border-strong)", borderRadius: 8, fontFamily: "var(--font-mono)", fontSize: 12 };
