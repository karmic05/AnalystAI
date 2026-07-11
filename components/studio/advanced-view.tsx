"use client";

import {
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from "recharts";
import type { Dataset, SentimentResult, ParetoResult, CohortResult, KeywordResult } from "@/lib/types";
import type { AnalysisIntent } from "@/lib/analysis/intent";
import { BriefBanner } from "@/components/studio/brief-bar";
import { Panel, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { AXIS, GRID_STROKE, CHART_COLORS, compactTick } from "@/lib/viz";
import { pct, titleCase, fmt } from "@/lib/utils";
import { MessageSquare, BarChart3, Users, Hash } from "lucide-react";

const MAX_PERIOD_COLS = 12;

export function AdvancedView({
  dataset,
  sentiment,
  pareto,
  cohort,
  keywords,
  intent,
}: {
  dataset: Dataset;
  sentiment: SentimentResult | null;
  pareto: ParetoResult | null;
  cohort: CohortResult | null;
  keywords: KeywordResult | null;
  intent?: AnalysisIntent | null;
}) {
  const hasAny = sentiment || pareto || cohort || keywords;
  const hasTextCol = dataset.schema.some((c) => c.type === "string" && (() => {
    let sum = 0, n = 0;
    for (const row of dataset.rows) { const v = row[c.name]; if (v == null || v === "") continue; sum += String(v).length; n++; }
    return n ? sum / n : 0;
  })() >= 15);

  return (
    <div className="space-y-4">
      {intent && <BriefBanner intent={intent} />}

      {!hasAny && (
        <Panel>
          <CardBody>
            <p className="text-sm text-muted">
              No deep analyses ran on this dataset yet.{" "}
              {hasTextCol
                ? "Ask the analyst about “sentiment” or “top keywords”, or request a “pareto of revenue by region” or “cohort retention”."
                : "Upload data with a free-text column (reviews/feedback) for sentiment and keyword analysis, or ask for “pareto” or “cohort retention”."}
            </p>
          </CardBody>
        </Panel>
      )}

      {sentiment && <SentimentPanel result={sentiment} />}
      {keywords && <KeywordsPanel result={keywords} />}
      {pareto && <ParetoPanel result={pareto} />}
      {cohort && <CohortPanel result={cohort} />}
    </div>
  );
}

/* ── Sentiment ──────────────────────────────────────────── */
function SentimentPanel({ result: r }: { result: SentimentResult }) {
  return (
    <Panel>
      <CardHeader>
        <CardTitle prompt>
          <span className="flex items-center gap-2"><MessageSquare size={15} className="text-purple" /> Sentiment · {titleCase(r.column)}</span>
        </CardTitle>
      </CardHeader>
      <CardBody>
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-surface-3">
          <div style={{ width: `${r.posShare * 100}%` }} className="bg-green" />
          <div style={{ width: `${r.neuShare * 100}%` }} className="bg-surface-3" />
          <div style={{ width: `${r.negShare * 100}%` }} className="bg-[var(--red)]" />
        </div>
        <div className="mt-2 flex flex-wrap justify-between gap-2 font-mono text-xs">
          <span className="text-green">▲ {pct(r.posShare)} positive</span>
          <span className="text-muted">— {pct(r.neuShare)} neutral</span>
          <span className="text-[var(--red)]">▼ {pct(r.negShare)} negative</span>
        </div>
        <div className="mt-3 font-mono text-[11px] text-muted">
          avg score {r.avgScore.toFixed(2)} · {r.scored.toLocaleString()} scored rows
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <div className="eyebrow mb-2">most positive</div>
            <ul className="space-y-2">
              {r.examples.positive.map((e, i) => (
                <li key={i} className="rounded-lg border border-green/20 bg-green/5 p-2.5 text-xs leading-relaxed text-ink">
                  &ldquo;{e.text}&rdquo; <span className="ml-1 font-mono text-green">+{e.score}</span>
                </li>
              ))}
              {!r.examples.positive.length && <li className="text-xs text-muted">None scored positive.</li>}
            </ul>
          </div>
          <div>
            <div className="eyebrow mb-2">most negative</div>
            <ul className="space-y-2">
              {r.examples.negative.map((e, i) => (
                <li key={i} className="rounded-lg border border-[var(--red)]/20 bg-[var(--red)]/5 p-2.5 text-xs leading-relaxed text-ink">
                  &ldquo;{e.text}&rdquo; <span className="ml-1 font-mono text-[var(--red)]">{e.score}</span>
                </li>
              ))}
              {!r.examples.negative.length && <li className="text-xs text-muted">None scored negative.</li>}
            </ul>
          </div>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-muted">{r.summary}</p>
      </CardBody>
    </Panel>
  );
}

/* ── Keywords ───────────────────────────────────────────── */
function KeywordsPanel({ result: r }: { result: KeywordResult }) {
  const max = r.topTerms[0]?.count ?? 1;
  return (
    <Panel>
      <CardHeader>
        <CardTitle prompt>
          <span className="flex items-center gap-2"><Hash size={15} className="text-cyan" /> Top themes · {titleCase(r.column)}</span>
        </CardTitle>
      </CardHeader>
      <CardBody>
        <ul className="space-y-2">
          {r.topTerms.slice(0, 16).map((t) => (
            <li key={t.term} className="flex items-center gap-3">
              <span className="w-28 shrink-0 truncate font-mono text-xs text-ink">{t.term}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-3">
                <div className="h-full rounded-full bg-brand-gradient" style={{ width: `${(t.count / max) * 100}%` }} />
              </div>
              <span className="w-10 shrink-0 text-right font-mono text-[11px] text-muted">{t.count}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm leading-relaxed text-muted">{r.summary}</p>
      </CardBody>
    </Panel>
  );
}

/* ── Pareto ─────────────────────────────────────────────── */
function ParetoPanel({ result: r }: { result: ParetoResult }) {
  const data = r.buckets.map((b) => ({ key: b.key.length > 10 ? b.key.slice(0, 9) + "…" : b.key, value: b.value, cumulative: b.cumulative }));
  return (
    <Panel>
      <CardHeader>
        <CardTitle prompt>
          <span className="flex items-center gap-2"><BarChart3 size={15} className="text-amber" /> Pareto · {titleCase(r.metric)} by {titleCase(r.category)}</span>
        </CardTitle>
      </CardHeader>
      <CardBody>
        <div className="mb-3 flex flex-wrap items-center gap-2 font-mono text-xs">
          <span className="rounded-md border border-amber/30 bg-amber/10 px-2 py-0.5 text-amber">
            vital few: {r.vitalFewCount} of {r.buckets.length} = {pct(r.vitalFewShare)}
          </span>
          <span className="text-muted">top {r.buckets[0].key}: {pct(r.topShare)}</span>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: -8 }}>
            <CartesianGrid stroke={GRID_STROKE} vertical={false} />
            <XAxis dataKey="key" {...AXIS} tick={{ ...AXIS.tick, fontSize: 10 }} interval={0} angle={-12} textAnchor="end" height={48} />
            <YAxis yAxisId="left" {...AXIS} tickFormatter={compactTick} width={56} />
            <YAxis yAxisId="right" orientation="right" {...AXIS} domain={[0, 1]} tickFormatter={(v) => pct(v)} width={44} />
            <Tooltip
              contentStyle={{ background: "var(--surface-2)", border: "1px solid var(--border-strong)", borderRadius: 8, fontFamily: "var(--font-mono)", fontSize: 12 }}
              formatter={(v: number, name: string) => [name === "cumulative" ? pct(v) : fmt(v, { compact: true }), name === "cumulative" ? "cumulative" : titleCase(r.metric)]}
            />
            <Bar yAxisId="left" dataKey="value" radius={[3, 3, 0, 0]}>
              {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
            </Bar>
            <Line yAxisId="right" type="monotone" dataKey="cumulative" stroke="var(--amber)" strokeWidth={2} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
        <p className="mt-3 text-sm leading-relaxed text-muted">{r.summary}</p>
      </CardBody>
    </Panel>
  );
}

/* ── Cohort ─────────────────────────────────────────────── */
function CohortPanel({ result: r }: { result: CohortResult }) {
  const periods = Math.min(r.maxPeriods, MAX_PERIOD_COLS);
  return (
    <Panel>
      <CardHeader>
        <CardTitle prompt>
          <span className="flex items-center gap-2"><Users size={15} className="text-green" /> Cohort retention · {titleCase(r.customerColumn)} by {r.period}</span>
        </CardTitle>
      </CardHeader>
      <CardBody>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-center font-mono text-[11px]">
            <thead>
              <tr className="text-muted">
                <th className="sticky left-0 z-10 bg-surface px-2 py-1.5 text-left">cohort</th>
                <th className="px-2 py-1.5">size</th>
                {Array.from({ length: periods }, (_, i) => (
                  <th key={i} className="px-2 py-1.5">M{i}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {r.cohorts.map((g) => (
                <tr key={g.label}>
                  <td className="sticky left-0 z-10 bg-surface px-2 py-1 text-left text-ink">{g.label}</td>
                  <td className="px-2 py-1 text-muted">{g.size}</td>
                  {Array.from({ length: periods }, (_, i) => {
                    const p = g.periods[i];
                    const ret = p?.retention ?? 0;
                    return (
                      <td
                        key={i}
                        className="px-1 py-1"
                        style={{ background: `color-mix(in srgb, var(--green) ${Math.round(ret * 55)}%, var(--surface-2))`, color: ret > 0.4 ? "var(--text)" : "var(--text-dim)" }}
                        title={`period ${i}: ${p ? p.active + " active" : "—"}`}
                      >
                        {p ? pct(ret) : "—"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-muted">{r.summary}</p>
      </CardBody>
    </Panel>
  );
}
