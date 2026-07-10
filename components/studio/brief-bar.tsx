"use client";

import { Sparkles, Zap, X } from "lucide-react";
import type { AnalysisIntent } from "@/lib/analysis/intent";
import { Panel, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, titleCase } from "@/lib/utils";

const EXAMPLES = [
  "Forecast revenue for the next 2 quarters",
  "What drives profit? Find the correlations.",
  "Segment revenue by region and detect anomalies",
  "Revenue per active customer",
  "Summarize the data in an executive report",
];

const REFLECTED_TABS = ["insights", "eda", "forecast", "kpi", "dashboard"] as const;

export function BriefBar({
  brief,
  onBriefChange,
  onAnalyze,
  intent,
  onClearFocus,
  onJumpTab,
  ctaLabel = "Analyze",
  placeholder = "e.g. Forecast revenue for the next 2 quarters, segment by region, and find what drives profit.",
}: {
  brief: string;
  onBriefChange: (s: string) => void;
  onAnalyze: () => void;
  intent?: AnalysisIntent | null;
  onClearFocus?: () => void;
  onJumpTab?: (id: string) => void;
  ctaLabel?: string;
  placeholder?: string;
}) {
  const hasFocus = !!intent && (!!intent.metric || !!intent.groupBy || intent.analyses.length > 0);

  return (
    <Panel>
      <CardBody>
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-lg" style={{ background: "color-mix(in srgb, var(--green) 14%, transparent)", color: "var(--green)" }}>
            <Sparkles size={16} />
          </span>
          <div className="min-w-0">
            <h3 className="prompt text-sm font-semibold">describe what you want to learn</h3>
            <p className="font-mono text-[10px] text-muted">natural language · keywords route the analysis · prompts reflect across every section</p>
          </div>
        </div>

        <div className="mt-3 neu-inset flex items-end gap-2 rounded-xl p-2">
          <textarea
            value={brief}
            onChange={(e) => onBriefChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onAnalyze();
              }
            }}
            placeholder={placeholder}
            rows={2}
            className="font-mono max-h-40 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-ink outline-none placeholder:text-muted"
          />
          <Button variant="accent" size="sm" onClick={onAnalyze} disabled={!brief.trim()} className="mb-0.5">
            <Zap size={14} /> {ctaLabel}
          </Button>
        </div>

        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => onBriefChange(ex)}
              className="btn-neu rounded-lg px-2.5 py-1 font-mono text-[11px] text-muted hover:text-green"
            >
              {ex}
            </button>
          ))}
        </div>

        {hasFocus && (
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-green/30 bg-green/5 px-3 py-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-green">▸ focus</span>
            <span className="text-sm text-ink">
              {intent!.metric ? titleCase(intent!.metric) : "primary metric"}
              {intent!.groupBy ? ` by ${titleCase(intent!.groupBy)}` : ""}
            </span>

            {onJumpTab && (
              <span className="ml-auto flex flex-wrap items-center gap-1 font-mono text-[11px] text-muted">
                <span className="text-muted/70">reflected in</span>
                {REFLECTED_TABS.map((id) => (
                  <button
                    key={id}
                    onClick={() => onJumpTab(id)}
                    className="rounded px-1.5 py-0.5 text-cyan capitalize transition-colors hover:bg-surface-2"
                  >
                    {id === "kpi" ? "KPI" : id}
                  </button>
                ))}
              </span>
            )}

            {onClearFocus && (
              <button
                onClick={onClearFocus}
                className="btn-neu inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-mono text-[11px] text-muted hover:text-[var(--red)]"
              >
                <X size={11} /> clear
              </button>
            )}
          </div>
        )}

        {intent && intent.keywords.length > 0 && !hasFocus && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted">caught</span>
            {intent.keywords.map((k) => (
              <Badge key={k} tone="green">
                {k}
              </Badge>
            ))}
          </div>
        )}
      </CardBody>
    </Panel>
  );
}

/** Small acknowledgment rendered at the top of a tailored section. */
export function BriefBanner({
  intent,
  className,
  title = "from your prompt",
}: {
  intent?: AnalysisIntent | null;
  className?: string;
  title?: string;
}) {
  if (!intent || (!intent.keywords.length && !intent.analyses.length && !intent.metric && !intent.groupBy)) return null;
  const focusLabel = [intent.metric, intent.groupBy ? `by ${intent.groupBy}` : null].filter(Boolean).join(" ");
  return (
    <div
      className={cn(
        "no-print flex flex-wrap items-center gap-2 rounded-xl border border-green/30 bg-green/5 px-3.5 py-2.5",
        className,
      )}
    >
      <Sparkles size={14} className="text-green" />
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted">{title}</span>
      {focusLabel && (
        <span className="font-mono text-[11px] text-ink">
          ▸ <span className="text-green">{titleCase(focusLabel)}</span>
        </span>
      )}
      {intent.keywords.slice(0, 6).map((k) => (
        <span key={k} className="rounded-md bg-surface-2 px-2 py-0.5 font-mono text-[10px] text-cyan">
          {k}
        </span>
      ))}
    </div>
  );
}
