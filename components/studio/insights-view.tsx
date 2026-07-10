"use client";

import { useMemo } from "react";
import type { Insight } from "@/lib/types";
import { INSIGHT_CATEGORY_META } from "@/lib/analysis/insights";
import { KIND_TO_INSIGHT_CATEGORIES, type AnalysisIntent } from "@/lib/analysis/intent";
import { BriefBanner } from "@/components/studio/brief-bar";
import { Panel, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, TrendingUp, ArrowRight } from "lucide-react";

export function InsightsView({ insights, intent }: { insights: Insight[]; intent?: AnalysisIntent | null }) {
  const ordered = useMemo(() => {
    if (!intent || !intent.analyses.length) return insights;
    const preferred = new Set(intent.analyses.flatMap((k) => KIND_TO_INSIGHT_CATEGORIES[k]));
    if (!preferred.size) return insights;
    const want = (ins: Insight) => (preferred.has(ins.category) ? 1 : 0);
    return [...insights].sort((a, b) => want(b) - want(a) || b.confidence - a.confidence);
  }, [insights, intent]);

  if (!insights.length) {
    return (
      <Panel><CardBody>
        <p className="text-sm text-muted">No insights yet. Load a dataset with a numeric column and a date or category column.</p>
      </CardBody></Panel>
    );
  }
  return (
    <div className="grid gap-3.5 md:grid-cols-2">
      {intent && (
        <div className="md:col-span-2">
          <BriefBanner intent={intent} />
        </div>
      )}
      {ordered.map((ins) => {
        const meta = INSIGHT_CATEGORY_META[ins.category];
        return (
          <Panel key={ins.id} className="flex flex-col">
            <CardBody className="flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="neu-inset grid h-8 w-8 place-items-center rounded-lg">
                    <Lightbulb size={15} style={{ color: meta.color }} />
                  </span>
                  <Badge tone={ins.impact === "high" ? "red" : ins.impact === "medium" ? "amber" : "muted"}>{ins.impact} impact</Badge>
                  <span className="font-mono text-[10px] uppercase tracking-wider" style={{ color: meta.color }}>{meta.label}</span>
                </div>
              </div>

              <h3 className="mt-3 text-[15px] font-semibold leading-snug text-ink">{ins.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{ins.summary}</p>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {ins.metrics.map((m) => (
                  <span key={m.label} className="neu-inset rounded-lg px-2.5 py-1 font-mono text-[11px]">
                    <span className="text-muted">{m.label}: </span>
                    <span className="text-ink">{m.value}</span>
                  </span>
                ))}
              </div>

              <div className="mt-3.5">
                <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-muted">
                  <span>confidence</span>
                  <span style={{ color: meta.color }}>{Math.round(ins.confidence * 100)}%</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-3">
                  <div className="h-full rounded-full" style={{ width: `${Math.round(ins.confidence * 100)}%`, background: meta.color }} />
                </div>
              </div>

              <div className="mt-3.5 rounded-xl border border-line bg-surface-2/40 p-3">
                <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-cyan">
                  <TrendingUp size={12} /> impact
                </div>
                <p className="mt-1 text-xs text-muted">{ins.impactReason}</p>
                <div className="mt-2 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-green">
                  <ArrowRight size={12} /> recommended action
                </div>
                <p className="mt-1 text-xs text-ink">{ins.action}</p>
              </div>
            </CardBody>
          </Panel>
        );
      })}
    </div>
  );
}
