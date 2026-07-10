"use client";

import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip } from "recharts";
import { Sparkles, TrendingUp, MapPin, CalendarRange } from "lucide-react";

const REVENUE = [
  { m: "Jan", v: 182 }, { m: "Feb", v: 168 }, { m: "Mar", v: 205 },
  { m: "Apr", v: 224 }, { m: "May", v: 246 }, { m: "Jun", v: 271 },
  { m: "Jul", v: 263 }, { m: "Aug", v: 298 }, { m: "Sep", v: 332 },
  { m: "Oct", v: 351 }, { m: "Nov", v: 388 }, { m: "Dec", v: 412 },
];

const INSIGHTS = [
  { icon: TrendingUp, tone: "var(--cyan)", text: "Revenue is up 42% over 12 months", meta: "R²=0.91 · 88% conf" },
  { icon: MapPin, tone: "var(--purple)", text: "North America leads with 38% of revenue", meta: "concentration risk: low" },
  { icon: CalendarRange, tone: "var(--amber)", text: "Seasonality: peak Nov, trough Feb (±18%)", meta: "detected · 0.6 strength" },
];

export function NotebookPreview() {
  return (
    <div className="panel scanlines relative overflow-hidden rounded-2xl">
      {/* window chrome */}
      <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[var(--red)]/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-[var(--amber)]/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-[var(--green)]/80" />
        <span className="ml-2 truncate font-mono text-[11px] text-muted">
          galactic-revenue.csv · notebook
        </span>
        <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-2 py-0.5 font-mono text-[10px] text-neon">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--green)] opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--green)]" />
          </span>
          live
        </span>
      </div>

      <div className="space-y-4 p-4">
        {/* chart cell */}
        <div className="rounded-xl border border-line bg-surface-2/50 p-3">
          <div className="mb-1 flex items-center justify-between">
            <span className="font-mono text-[11px] text-muted"># Revenue over time</span>
            <span className="font-mono text-[11px] text-cyan">+42%</span>
          </div>
          <ResponsiveContainer width="100%" height={132}>
            <AreaChart data={REVENUE} margin={{ top: 6, right: 4, bottom: 0, left: 4 }}>
              <defs>
                <linearGradient id="revStroke" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="var(--magenta)" />
                  <stop offset="50%" stopColor="var(--purple)" />
                  <stop offset="100%" stopColor="var(--cyan)" />
                </linearGradient>
                <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--purple)" stopOpacity={0.38} />
                  <stop offset="100%" stopColor="var(--purple)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="m"
                tick={{ fill: "var(--text-faint)", fontSize: 10, fontFamily: "var(--font-mono)" }}
                axisLine={false}
                tickLine={false}
                minTickGap={16}
              />
              <Tooltip
                cursor={{ stroke: "var(--border-strong)" }}
                contentStyle={{
                  background: "var(--surface-2)",
                  border: "1px solid var(--border-strong)",
                  borderRadius: 8,
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                }}
                formatter={(v: number) => [`$${v}K`, "Revenue"]}
              />
              <Area
                type="monotone"
                dataKey="v"
                stroke="url(#revStroke)"
                strokeWidth={2.5}
                fill="url(#revFill)"
                dot={false}
                activeDot={{ r: 3, fill: "var(--cyan)" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* insights cell */}
        <div className="rounded-xl border border-line bg-surface-2/50 p-3">
          <div className="mb-2 font-mono text-[11px] text-muted"># Insights</div>
          <ul className="space-y-2.5">
            {INSIGHTS.map((ins, i) => (
              <li
                key={ins.text}
                className="flex items-start gap-2.5 animate-fade-up"
                style={{ animationDelay: `${0.15 + i * 0.18}s` }}
              >
                <span
                  className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md"
                  style={{ background: `color-mix(in srgb, ${ins.tone} 14%, transparent)`, color: ins.tone }}
                >
                  <ins.icon size={13} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] leading-tight text-ink">{ins.text}</div>
                  <div className="font-mono text-[10px] text-muted">{ins.meta}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* chat cell */}
        <div
          className="rounded-xl border border-line bg-surface-2/50 p-3 animate-fade-up"
          style={{ animationDelay: "0.7s" }}
        >
          <div className="mb-2 font-mono text-[11px] text-muted"># Ask the analyst</div>
          <div className="rounded-lg rounded-bl-sm bg-surface-3/70 px-3 py-2 text-[13px] text-ink">
            Why did revenue dip in February?
          </div>
          <div className="mt-2 flex items-start gap-2">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-brand-gradient text-white">
              <Sparkles size={12} />
            </span>
            <div className="rounded-lg rounded-bl-sm border border-line bg-surface px-3 py-2 text-[13px] leading-snug text-muted">
              Feb is the seasonal trough (−18% vs trend). Discounting and a 7-day sales freeze
              explain 64% of the gap. <span className="text-cyan">[insight · confidence 81%]</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
