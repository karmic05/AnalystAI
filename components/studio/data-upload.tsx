"use client";

import { useRef, useState } from "react";
import { Upload, FileText, Sparkles, ClipboardPaste, AlertCircle, Database, Loader2 } from "lucide-react";
import { parseFile, parseText } from "@/lib/data/parse";
import { buildSampleDataset, SAMPLE_CSV_HINT } from "@/lib/data/sample";
import type { Dataset } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function DataUpload({ onLoaded }: { onLoaded: (d: Dataset) => void }) {
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [paste, setPaste] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setBusy(true);
    setError(null);
    const res = await parseFile(file);
    setBusy(false);
    if (res.error) return setError(res.error);
    if (res.dataset) onLoaded(res.dataset);
  }

  function handleSample() {
    setError(null);
    onLoaded(buildSampleDataset());
  }

  function handlePaste() {
    setError(null);
    const res = parseText(paste, "pasted_data.csv");
    if (res.error) return setError(res.error);
    if (res.dataset) {
      onLoaded(res.dataset);
      setPasteOpen(false);
      setPaste("");
    }
  }

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault(); setDrag(false);
          const f = e.dataTransfer.files?.[0];
          if (f) handleFile(f);
        }}
        className={cn(
          "panel relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-all",
          drag ? "glow-border-cyan border-cyan/60" : "border-line",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.json,.txt,text/csv,application/json"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.currentTarget.value = ""; }}
        />
        <div className="neu-inset mb-4 grid h-14 w-14 place-items-center rounded-2xl">
          {busy ? <Loader2 className="animate-spin text-cyan" /> : <Upload size={22} className="text-cyan" />}
        </div>
        <h3 className="text-lg font-semibold text-ink">Drop a file to analyze</h3>
        <p className="mt-1.5 max-w-md text-sm text-muted">
          CSV or JSON up to ~1M rows. Everything is processed in your browser, so nothing is uploaded to a server.
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
          <Button variant="accent" onClick={() => inputRef.current?.click()} disabled={busy}>
            <FileText size={15} /> Choose file
          </Button>
          <Button variant="default" onClick={handleSample} disabled={busy}>
            <Sparkles size={15} /> Load sample dataset
          </Button>
          <Button variant="outline" onClick={() => setPasteOpen((v) => !v)}>
            <ClipboardPaste size={15} /> Paste data
          </Button>
        </div>
        <p className="mt-3 font-mono text-[11px] text-muted">{SAMPLE_CSV_HINT}</p>
      </div>

      {pasteOpen && (
        <div className="panel rounded-2xl p-4">
          <label className="font-mono text-xs uppercase tracking-widest text-muted">paste CSV or JSON</label>
          <textarea
            value={paste}
            onChange={(e) => setPaste(e.target.value)}
            placeholder="date,product,revenue,cost&#10;2024-01-01,Atlas Pro,1200,400&#10;..."
            rows={6}
            className="neu-inset mt-2 w-full rounded-xl p-3 font-mono text-xs text-ink outline-none focus:ring-2 focus:ring-cyan/40"
          />
          <div className="mt-2 flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setPasteOpen(false)}>Cancel</Button>
            <Button variant="accent" size="sm" onClick={handlePaste} disabled={!paste.trim()}>Analyze paste</Button>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-[color-mix(in_srgb,var(--red)_40%,transparent)] bg-[color-mix(in_srgb,var(--red)_10%,transparent)] p-3.5 text-sm text-[var(--red)]">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "CSV / JSON", on: true },
          { label: "Paste", on: true },
          { label: "Excel .xlsx", on: false },
          { label: "SQL dump", on: false },
          { label: "Google Sheets", on: false },
          { label: "PostgreSQL", on: false },
          { label: "MySQL / SQL Server", on: false },
          { label: "REST API", on: false },
        ].map((s) => (
          <div key={s.label} className={cn("neu flex items-center justify-between rounded-xl px-3.5 py-2.5", !s.on && "opacity-50")}>
            <span className="flex items-center gap-2 text-sm text-ink"><Database size={14} className="text-muted" />{s.label}</span>
            <Badge tone={s.on ? "green" : "muted"}>{s.on ? "ready" : "roadmap"}</Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
