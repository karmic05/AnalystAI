"use client";

import { Sparkles, Zap } from "lucide-react";
import type { AnalysisIntent } from "@/lib/analysis/intent";
import { Panel, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const EXAMPLES = [
  "Forecast revenue for the next 2 quarters",
  "What drives profit? Find the correlations.",
  "Segment revenue by region and detect anomalies",
  "Revenue per active customer",
  "Summarize the data in an executive report",
];

export function BriefBar({
  brief,
  onBriefChange,
  onAnalyze,
  intent,
  ctaLabel = "Analyze",
  placeholder = "e.g. Forecast revenue for the next 2 quarters, segment by region, and find what drives profit.",
}: {
  brief: string;
  onBriefChange: (s: string) => void;
  onAnalyze: () => void;
  intent?: AnalysisIntent | null;
  ctaLabel?: string;
  placeholder?: string;
}) {
  return (
    <Panel>
      <CardBody>
        <div className="flex items-center gap-2.5">
          <span className="neu-inset grid h-9 w-9 place-items-center rounded-lg">
            <Sparkles size={16} className="text-cyan" />
          </span>
          <div className="min-w-0">
            <h3 className="prompt text-sm font-semibold">describe what you want to learn</h3>
            <p className="font-mono text-[10px] text-muted">natural language · keywords route the analysis</p>
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
            className="max-h-40 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-ink outline-none placeholder:text-muted"
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
              className="btn-neu rounded-lg px-2.5 py-1 font-mono text-[11px] text-muted hover:text-cyan"
            >
              {ex}
            </button>
          ))}
        </div>

        {intent && intent.keywords.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted">caught</span>
            {intent.keywords.map((k) => (
              <Badge key={k} tone="cyan">
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
  title = "from your brief",
}: {
  intent?: AnalysisIntent | null;
  className?: string;
  title?: string;
}) {
  if (!intent || (!intent.keywords.length && !intent.analyses.length)) return null;
  return (
    <div
      className={cn(
        "no-print flex flex-wrap items-center gap-2 rounded-xl border border-cyan/30 bg-surface/40 px-3.5 py-2.5",
        className,
      )}
    >
      <Sparkles size={14} className="text-cyan" />
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted">{title}</span>
      {intent.keywords.slice(0, 6).map((k) => (
        <span key={k} className="rounded-md bg-surface-2 px-2 py-0.5 font-mono text-[10px] text-cyan">
          {k}
        </span>
      ))}
    </div>
  );
}
