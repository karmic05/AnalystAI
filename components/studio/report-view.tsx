"use client";

import { useEffect, useMemo, useState } from "react";
import type { Dataset, ForecastResult, Insight } from "@/lib/types";
import type { AnalysisIntent } from "@/lib/analysis/intent";
import { writeReport } from "@/lib/ai/local-provider";
import { buildProfile } from "@/lib/analysis/profile";
import { Panel, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Printer, FileText, Copy, Sparkles } from "lucide-react";

export function ReportView({
  dataset,
  insights,
  forecast,
  intent,
}: {
  dataset: Dataset;
  insights: Insight[];
  forecast: ForecastResult | null;
  intent?: AnalysisIntent | null;
}) {
  // Local deterministic report — instant, and the fallback when Groq is off.
  const localMd = useMemo(() => {
    const base = writeReport({ dataset, profile: buildProfile(dataset), insights, forecast: forecast ?? undefined, intent });
    if (!intent || !intent.focusTopics.length) return base;
    const focus = intent.focusTopics.map((t) => `- ${t}`).join("\n");
    return `## Your brief\n\n> ${intent.brief.replace(/\n/g, " ")}\n\n**Focus:**\n\n${focus}\n\n---\n\n${base}`;
  }, [dataset, insights, forecast, intent]);

  const [llmMd, setLlmMd] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Try to upgrade the prose with Groq; keep the local report on any error.
  useEffect(() => {
    let cancelled = false;
    setLlmMd(null);
    setBusy(true);
    (async () => {
      try {
        const res = await fetch("/api/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            task: "report-writing",
            dataset,
            intent,
            includeInsights: true,
            includeForecast: true,
          }),
        });
        if (res.ok && !cancelled) {
          const data = (await res.json()) as { text?: string; provider?: string };
          if (data.provider === "llm" && data.text?.trim()) {
            const brief = intent?.focusTopics.length
              ? `## Your brief\n\n> ${intent.brief.replace(/\n/g, " ")}\n\n---\n\n`
              : "";
            setLlmMd(brief + data.text.trim());
          }
        }
      } catch {
        // keep local
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();
    return () => { cancelled = true; };
  }, [dataset, intent]);

  const md = llmMd ?? localMd;
  const isGroq = !!llmMd;

  function download(name: string, content: string, mime: string) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = name; a.click();
    URL.revokeObjectURL(url);
  }

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${dataset.name} · Executive Brief</title>
<style>
:root{--ink:#1a1a2e;--dim:#54546b;--faint:#8a8aa0;--line:#e6e6ef;--surf:#f6f6fb}
body{font-family:'Source Serif 4',Georgia,serif;max-width:720px;margin:44px auto;padding:0 28px;color:var(--dim);line-height:1.65}
h1{font-family:'Bricolage Grotesque',system-ui,sans-serif;font-size:27px;line-height:1.15;letter-spacing:-.02em;color:var(--ink);margin:0 0 6px}
h2{font-family:'Bricolage Grotesque',system-ui,sans-serif;font-size:12px;text-transform:uppercase;letter-spacing:.14em;color:var(--dim);margin:30px 0 10px;padding-bottom:6px;border-bottom:1px solid var(--line)}
h3{font-size:15px;color:var(--ink);margin:16px 0 4px}
p{margin:8px 0} em{color:var(--faint)} strong{color:var(--ink);font-weight:600}
ul{list-style:none;margin:8px 0;padding:0}
li{position:relative;padding:5px 0 5px 20px;border-bottom:1px dashed #eee}
li:last-child{border-bottom:none}
li::before{content:"";position:absolute;left:2px;top:12px;width:6px;height:6px;border-radius:50%;background:#7c3aed}
code{font-family:ui-monospace,monospace;font-size:.85em;background:var(--surf);border:1px solid var(--line);padding:1px 5px;border-radius:5px;color:var(--ink)}
hr{border:none;border-top:1px solid var(--line);margin:26px 0 10px}
hr+p{font-size:12.5px;color:var(--faint)}
</style></head>
<body>${mdToHtml(md)}</body></html>`;

  return (
    <div className="space-y-4">
      <Panel>
        <CardBody>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-gradient text-white shadow-sm"><FileText size={16} /></span>
              <div>
                <h3 className="prompt text-sm font-semibold">executive brief</h3>
                <p className="font-mono text-[10px] text-muted">
                  {busy ? "polishing with Groq…" : isGroq ? "Groq-authored · grounded in your data" : "auto-generated · grounded in your data"}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => navigator.clipboard?.writeText(md)}><Copy size={13} /> Copy</Button>
              <Button variant="outline" size="sm" onClick={() => download("analystai-brief.md", md, "text/markdown")}>.md</Button>
              <Button variant="outline" size="sm" onClick={() => download("analystai-brief.html", html, "text/html")}>.html</Button>
              <Button variant="accent" size="sm" onClick={() => window.print()}><Printer size={13} /> Print / PDF</Button>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {isGroq && <Badge tone="purple"><Sparkles size={11} /> Groq</Badge>}
            {busy && !isGroq && <Badge tone="amber">polishing…</Badge>}
            <Badge tone="muted">Markdown</Badge>
            <Badge tone="cyan">print → PDF</Badge>
            <Badge tone="muted">Word/PPTX · roadmap</Badge>
          </div>
        </CardBody>
      </Panel>

      <Panel>
        <CardBody>
          <article className="report max-w-3xl text-sm leading-relaxed text-muted" dangerouslySetInnerHTML={{ __html: mdToHtml(md) }} />
        </CardBody>
      </Panel>
    </div>
  );
}

/** Minimal, safe markdown → HTML (headings, bold, lists, hr, code, paragraphs). */
export function mdToHtml(md: string): string {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const lines = md.split("\n");
  const out: string[] = [];
  let inList = false;
  let inCode = false;
  for (const raw of lines) {
    let line = raw;
    if (line.trim().startsWith("```")) { inCode = !inCode; continue; }
    if (inCode) { out.push(`<pre>${esc(line)}</pre>`); continue; }
    if (/^---\s*$/.test(line)) { if (inList) { out.push("</ul>"); inList = false; } out.push("<hr/>"); continue; }
    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) { if (inList) { out.push("</ul>"); inList = false; } const lvl = h[1].length; out.push(`<h${lvl}>${inline(esc(h[2]))}</h${lvl}>`); continue; }
    if (/^\s*[-•]\s+/.test(line)) { if (!inList) { out.push("<ul>"); inList = true; } out.push(`<li>${inline(esc(line.replace(/^\s*[-•]\s+/, "")))}</li>`); continue; }
    if (line.trim() === "") { if (inList) { out.push("</ul>"); inList = false; } out.push(""); continue; }
    if (inList) { out.push("</ul>"); inList = false; }
    out.push(`<p>${inline(esc(line))}</p>`);
  }
  if (inList) out.push("</ul>");
  return out.join("\n");
}

function inline(s: string): string {
  return s
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}
