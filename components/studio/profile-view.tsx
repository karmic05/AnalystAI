"use client";

import type { Dataset, DatasetProfile, QualityIssue } from "@/lib/types";
import type { AnalysisIntent } from "@/lib/analysis/intent";
import { BriefBanner } from "@/components/studio/brief-bar";
import { Stat } from "@/components/ui/stat";
import { Panel, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fmt, pct, titleCase } from "@/lib/utils";
import { CheckCircle2, AlertTriangle, Wand2, Zap } from "lucide-react";

export function ProfileView({
  dataset,
  profile,
  quality,
  onApplyFix,
  onApplyAll,
  intent,
}: {
  dataset: Dataset;
  profile: DatasetProfile;
  quality: QualityIssue[];
  onApplyFix: (q: QualityIssue) => void;
  onApplyAll: () => void;
  intent?: AnalysisIntent | null;
}) {
  return (
    <div className="space-y-4">
      <BriefBanner intent={intent} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label="Records" value={dataset.rowCount.toLocaleString()} tone="cyan" />
        <Stat label="Columns" value={dataset.columns.length} tone="purple" />
        <Stat label="Completeness" value={pct(profile.completeness)} tone={profile.completeness > 0.95 ? "green" : "amber"} />
        <Stat label="Duplicates" value={profile.duplicateRows} tone={profile.duplicateRows ? "red" : "green"} />
        <Stat label="Numeric / Cat / Date" value={`${profile.numericColumns.length}/${profile.categoricalColumns.length}/${profile.dateColumns.length}`} tone="muted" />
      </div>

      <Panel>
        <CardBody>
          <div className="flex items-center justify-between">
            <h3 className="prompt text-sm font-semibold">schema &amp; column profiles</h3>
            <Badge tone="cyan">{dataset.columns.length} cols</Badge>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {dataset.schema.map((c) => (
              <div key={c.name} className="neu rounded-xl p-3.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm text-ink">{titleCase(c.name)}</span>
                  <Badge tone={c.type === "number" ? "cyan" : c.type === "date" ? "green" : c.type === "boolean" ? "amber" : "purple"}>
                    {c.type}
                  </Badge>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-y-1 font-mono text-[11px] text-muted">
                  <span>missing</span><span className="text-right text-ink">{c.missing} ({pct(c.missing / dataset.rowCount)})</span>
                  <span>unique</span><span className="text-right text-ink">{c.unique.toLocaleString()}</span>
                  {c.type === "number" && c.mean !== undefined && (
                    <>
                      <span>min / max</span><span className="text-right text-ink">{fmt(c.min)} · {fmt(c.max)}</span>
                      <span>mean ± std</span><span className="text-right text-ink">{fmt(c.mean)} · {fmt(c.std ?? 0)}</span>
                      <span>median</span><span className="text-right text-ink">{fmt(c.median)}</span>
                    </>
                  )}
                  {c.type === "date" && (
                    <>
                      <span>range</span><span className="text-right text-ink">{c.minDate?.slice(0, 10)} → {c.maxDate?.slice(0, 10)}</span>
                    </>
                  )}
                  {c.type === "string" && c.topValues && c.topValues.length > 0 && (
                    <>
                      <span>top</span>
                      <span className="text-right text-ink">{c.topValues[0].value} ({pct(c.topValues[0].share)})</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Panel>

      <Panel glow={quality.some((q) => q.severity === "high") ? "magenta" : undefined}>
        <CardBody>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="prompt text-sm font-semibold">data quality &amp; cleaning</h3>
            {quality.length > 0 && (
              <Button variant="accent" size="sm" onClick={onApplyAll}>
                <Zap size={14} /> Apply all fixes
              </Button>
            )}
          </div>

          {quality.length === 0 ? (
            <div className="mt-5 flex flex-col items-center rounded-xl border border-dashed border-line py-10 text-center">
              <CheckCircle2 className="text-green" />
              <p className="mt-2 text-sm text-ink">No issues detected. The dataset is clean.</p>
              <p className="font-mono text-[11px] text-muted">no missing values · no duplicates · no outliers</p>
            </div>
          ) : (
            <div className="mt-4 space-y-2.5">
              {quality.map((q) => (
                <div key={q.id} className="neu flex flex-col gap-3 rounded-xl p-4 sm:flex-row sm:items-center">
                  <div className={q.severity === "high" ? "text-[var(--red)]" : q.severity === "medium" ? "text-[var(--amber)]" : "text-muted"}>
                    <AlertTriangle size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-ink">{q.title}</span>
                      <Badge tone={q.severity === "high" ? "red" : q.severity === "medium" ? "amber" : "muted"}>{q.severity}</Badge>
                      <Badge tone="muted">{q.kind}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted">{q.detail}</p>
                    <p className="mt-1 text-xs text-cyan">→ {q.recommendation}</p>
                  </div>
                  <Button variant="default" size="sm" onClick={() => onApplyFix(q)} className="shrink-0">
                    <Wand2 size={13} /> {q.autoFix.label}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Panel>
    </div>
  );
}
