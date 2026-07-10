"use client";

import { useMemo } from "react";
import type { Dataset, ForecastResult, Insight } from "@/lib/types";
import type { AnalysisIntent } from "@/lib/analysis/intent";
import { writeReport } from "@/lib/ai/local-provider";
import { buildProfile, pickPrimaryMetric } from "@/lib/analysis/profile";
import { Panel, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Printer, FileText, Copy } from "lucide-react";

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
  const md = useMemo(() => {
    const base = writeReport({ dataset, profile: buildProfile(dataset), insights, forecast: forecast ?? undefined });
    if (!intent || !intent.focusTopics.length) return base;
    const focus = intent.focusTopics.map((t) => `- ${t}`).join("\n");
    return `## Your brief\n\n> ${intent.brief.replace(/\n/g, " ")}\n\n**Focus:**\n\n${focus}\n\n---\n\n${base}`;
  }, [dataset, insights, forecast, intent]);

  function download(name: string, content: string, mime: string) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = name; a.click();
    URL.revokeObjectURL(url);
  }

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${dataset.name} · Executive Report</title>
<style>body{font-family:Inter,system-ui,sans-serif;max-width:760px;margin:40px auto;padding:0 24px;color:#111;line-height:1.6}
h1{font-size:26px}h2{font-size:18px;border-bottom:1px solid #ddd;padding-bottom:4px;margin-top:28px}h3{font-size:15px}
code,pre{font-family:ui-monospace,monospace;background:#f4f4f6;padding:2px 5px;border-radius:4px}
hr{border:none;border-top:1px solid #ddd;margin:24px 0}</style></head>
<body>${mdToHtml(md)}</body></html>`;

  return (
    <div className="space-y-4">
      <Panel>
        <CardBody>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="neu-inset grid h-9 w-9 place-items-center rounded-lg"><FileText size={16} className="text-cyan" /></span>
              <div>
                <h3 className="prompt text-sm font-semibold">executive report</h3>
                <p className="font-mono text-[10px] text-muted">auto-generated · grounded in your data</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => navigator.clipboard?.writeText(md)}><Copy size={13} /> Copy</Button>
              <Button variant="outline" size="sm" onClick={() => download("analystai-report.md", md, "text/markdown")}>.md</Button>
              <Button variant="outline" size="sm" onClick={() => download("analystai-report.html", html, "text/html")}>.html</Button>
              <Button variant="accent" size="sm" onClick={() => window.print()}><Printer size={13} /> Print / PDF</Button>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
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
