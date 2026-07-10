"use client";

import { useEffect, useState } from "react";
import { Calculator, Plus, Trash2, CheckCircle2, XCircle } from "lucide-react";
import type { Dataset, KpiDefinition } from "@/lib/types";
import { parseKpi, KPI_EXAMPLES } from "@/lib/analysis/kpi";
import type { AnalysisIntent } from "@/lib/analysis/intent";
import { BriefBanner } from "@/components/studio/brief-bar";
import { Panel, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function KpiBuilder({
  dataset,
  saved,
  onSave,
  onRemove,
  intent,
}: {
  dataset: Dataset;
  saved: KpiDefinition[];
  onSave: (k: KpiDefinition) => void;
  onRemove: (id: string) => void;
  intent?: AnalysisIntent | null;
}) {
  const [expr, setExpr] = useState("");
  const [result, setResult] = useState<KpiDefinition | null>(null);

  function run(text: string) {
    setExpr(text);
    setResult(parseKpi(text, dataset));
  }

  // Pre-fill a KPI from the brief when the user clicks Analyze.
  useEffect(() => {
    if (intent?.kpiExpression) run(intent.kpiExpression);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intent]);

  return (
    <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
      {intent && (
        <div className="lg:col-span-2">
          <BriefBanner intent={intent} />
        </div>
      )}
      <Panel>
        <CardBody>
          <h3 className="prompt text-sm font-semibold">describe a KPI in plain English</h3>
          <p className="mt-1 text-xs text-muted">The builder compiles your description into a live calculation over the dataset.</p>

          <div className="mt-4 neu-inset flex items-center gap-2 rounded-xl p-2">
            <input
              value={expr}
              onChange={(e) => run(e.target.value)}
              placeholder="e.g. total revenue divided by distinct customer_id"
              className="flex-1 bg-transparent px-2 py-1.5 text-sm text-ink outline-none placeholder:text-muted"
            />
            <Button variant="accent" size="sm" onClick={() => result?.valid && onSave({ ...result, id: result.id })} disabled={!result?.valid}>
              <Plus size={14} /> Add
            </Button>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {KPI_EXAMPLES.map((ex) => (
              <button key={ex} onClick={() => run(ex)} className="btn-neu rounded-lg px-2.5 py-1 font-mono text-[11px] text-muted hover:text-cyan">
                {ex}
              </button>
            ))}
          </div>

          {result && (
            <div className="mt-4 neu rounded-xl p-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted">result</span>
                {result.valid ? <Badge tone="green"><CheckCircle2 size={11} /> valid</Badge> : <Badge tone="red"><XCircle size={11} /> unparseable</Badge>}
              </div>
              {result.valid ? (
                <>
                  <div className="mt-2 font-mono text-3xl font-semibold text-cyan">{result.display}</div>
                  <div className="mt-2 rounded-lg bg-surface-2/50 p-2.5 font-mono text-[11px] text-muted">{result.formula}</div>
                </>
              ) : (
                <p className="mt-2 text-sm text-[var(--red)]">{result.error}</p>
              )}
            </div>
          )}
        </CardBody>
      </Panel>

      <Panel>
        <CardBody>
          <div className="flex items-center justify-between">
            <h3 className="prompt text-sm font-semibold">saved KPIs</h3>
            <Badge tone="cyan">{saved.length}</Badge>
          </div>
          {saved.length === 0 ? (
            <div className="mt-4 flex flex-col items-center rounded-xl border border-dashed border-line py-10 text-center">
              <Calculator className="text-muted" />
              <p className="mt-2 text-sm text-muted">No KPIs yet.</p>
              <p className="font-mono text-[11px] text-muted">define one and hit Add</p>
            </div>
          ) : (
            <div className="mt-4 space-y-2.5">
              {saved.map((k) => (
                <div key={k.id} className="neu flex items-center gap-3 rounded-xl p-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm text-ink">{k.label}</div>
                    <div className="truncate font-mono text-[10px] text-muted">{k.formula}</div>
                  </div>
                  <div className="font-mono text-lg font-semibold text-cyan">{k.display}</div>
                  <button onClick={() => onRemove(k.id)} className="btn-neu grid h-7 w-7 place-items-center rounded-lg text-muted hover:text-[var(--red)]" aria-label="Remove">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Panel>
    </div>
  );
}
