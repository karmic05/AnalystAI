/* Shared chart helpers — neon palette + correlation heat color. */

export const CHART_COLORS = ["#22d3ee", "#ff3da6", "#a855f7", "#43f9a0", "#ffb020", "#ff5c7a", "#3b82f6", "#f97316"];

export const AXIS = {
  stroke: "var(--text-faint)",
  tick: { fill: "var(--text-dim)", fontSize: 11, fontFamily: "var(--font-mono)" },
};

export const GRID_STROKE = "var(--border)";

/** Diverging color for a correlation in [-1, 1]: red → neutral → cyan. */
export function correlationColor(r: number): string {
  if (Number.isNaN(r)) return "var(--surface-3)";
  const t = (r + 1) / 2; // 0..1
  // interpolate red(0) -> purple(0.5) -> cyan(1)
  const stops = [
    { p: 0, c: [255, 92, 122] },
    { p: 0.5, c: [60, 60, 90] },
    { p: 1, c: [34, 211, 238] },
  ];
  let lo = stops[0], hi = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (t >= stops[i].p && t <= stops[i + 1].p) { lo = stops[i]; hi = stops[i + 1]; break; }
  }
  const f = (t - lo.p) / (hi.p - lo.p || 1);
  const c = lo.c.map((v, i) => Math.round(v + (hi.c[i] - v) * f));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

export function compactTick(n: number): string {
  if (Math.abs(n) >= 1000) return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n);
  return String(n);
}
