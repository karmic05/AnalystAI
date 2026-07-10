"use client";

import { useEffect, useRef, useState } from "react";

const LINES = [
  { p: ">", t: "analyst analyze sample_saas_revenue.csv", c: "var(--green)" },
  { p: "", t: "► profiling 786 records · 11 columns · completeness 99.6%", c: "var(--text-dim)" },
  { p: "", t: "► detected: revenue (sum), date (monthly), segment, region, product", c: "var(--text-dim)" },
  { p: "", t: "► generating insights…", c: "var(--text-dim)" },
  { p: "▸", t: "Revenue is growing: +42% over 31 months (R²=0.91, 88% conf)", c: "var(--cyan)" },
  { p: "▸", t: "North America leads regions with 38% of revenue", c: "var(--purple)" },
  { p: "▸", t: "Seasonality detected: peak in Nov, trough in Feb (±18%)", c: "var(--amber)" },
  { p: "▸", t: "Next month projected at $412K (band $388K–$436K, MAPE 6.2%)", c: "var(--green)" },
  { p: ">", t: "analyst report --format executive", c: "var(--green)" },
  { p: "", t: "► writing board-ready report… done ✓", c: "var(--text-dim)" },
];

export function TerminalDemo() {
  const [count, setCount] = useState(0);
  const [typed, setTyped] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (count >= LINES.length) return;
    const line = LINES[count];
    let i = 0;
    const typer = setInterval(() => {
      i++;
      setTyped(line.t.slice(0, i));
      if (i >= line.t.length) {
        clearInterval(typer);
        setTimeout(() => {
          setCount((c) => c + 1);
          setTyped("");
        }, 280);
      }
    }, 18);
    return () => clearInterval(typer);
  }, [count]);

  useEffect(() => {
    if (containerRef.current) containerRef.current.scrollTop = containerRef.current.scrollHeight;
  }, [count, typed]);

  return (
    <div className="panel scanlines relative overflow-hidden rounded-2xl">
      <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[var(--red)]/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-[var(--amber)]/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-[var(--green)]/80" />
        <span className="ml-2 font-mono text-[11px] text-muted">analystai · studio · live session</span>
      </div>
      <div ref={containerRef} className="h-[280px] overflow-y-auto px-4 py-3 font-mono text-[12.5px] leading-relaxed">
        {LINES.slice(0, count).map((l, idx) => (
          <div key={idx} className="flex gap-2">
            {l.p && <span style={{ color: l.c === "var(--text-dim)" ? "var(--text-faint)" : l.c }}>{l.p}</span>}
            <span style={{ color: l.c }}>{l.t}</span>
          </div>
        ))}
        {count < LINES.length && (
          <div className="flex gap-2">
            {LINES[count].p && <span style={{ color: LINES[count].c }}>{LINES[count].p}</span>}
            <span style={{ color: LINES[count].c }} className="cursor">
              {typed}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
