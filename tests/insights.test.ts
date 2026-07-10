import { describe, it, expect } from "vitest";
import { buildSampleDataset } from "@/lib/data/sample";
import { generateInsights } from "@/lib/analysis/insights";
import { buildProfile, pickPrimaryMetric, pickPrimaryDate, pickPrimaryCategory } from "@/lib/analysis/profile";
import { detectQuality } from "@/lib/analysis/quality";
import { correlationMatrix } from "@/lib/analysis/correlation";
import { forecast } from "@/lib/analysis/forecast";
import { parseKpi } from "@/lib/analysis/kpi";
import { answerQuestion } from "@/lib/analysis/chat";

const ds = buildSampleDataset();

describe("sample dataset shape", () => {
  it("has expected columns and rows", () => {
    expect(ds.rowCount).toBeGreaterThan(700);
    expect(ds.columns).toContain("revenue");
    expect(ds.columns).toContain("date");
    expect(ds.columns).toContain("region");
  });
  it("infers roles", () => {
    expect(pickPrimaryMetric(ds)?.role).toBe("revenue");
    expect(pickPrimaryDate(ds)?.type).toBe("date");
    expect(pickPrimaryCategory(ds)?.role).toBe("region");
  });
});

describe("profile & quality", () => {
  it("builds a profile", () => {
    const p = buildProfile(ds);
    expect(p.rowCount).toBe(ds.rowCount);
    expect(p.numericColumns.length).toBeGreaterThan(0);
    expect(p.completeness).toBeLessThan(1); // we injected missing values
    expect(p.duplicateRows).toBeGreaterThanOrEqual(1); // we injected a duplicate
  });
  it("detects quality issues including the injected ones", () => {
    const q = detectQuality(ds);
    expect(q.some((i) => i.kind === "duplicate")).toBe(true);
    expect(q.some((i) => i.kind === "missing")).toBe(true);
  });
});

describe("insights", () => {
  it("generates grounded insights with valid confidence", () => {
    const ins = generateInsights(ds);
    expect(ins.length).toBeGreaterThanOrEqual(3);
    for (const i of ins) {
      expect(i.confidence).toBeGreaterThan(0);
      expect(i.confidence).toBeLessThanOrEqual(1);
      expect(i.title.length).toBeGreaterThan(0);
      expect(i.action.length).toBeGreaterThan(0);
      expect(i.metrics.length).toBeGreaterThan(0);
    }
    // the SaaS sample is growing → at least one trend insight
    expect(ins.some((i) => i.category === "trend")).toBe(true);
  });
});

describe("correlation & forecast", () => {
  it("builds a square correlation matrix", () => {
    const m = correlationMatrix(ds);
    expect(m.columns.length).toBe(m.matrix.length);
    expect(m.columns).toContain("revenue");
    expect(m.matrix[0].length).toBe(m.columns.length);
  });
  it("forecasts the next period with a band", () => {
    const f = forecast(ds);
    expect(f).not.toBeNull();
    expect(f!.horizon.length).toBe(6);
    const next = f!.horizon[0];
    expect(next.forecast).not.toBeNull();
    expect(next.lower!).toBeLessThanOrEqual(next.forecast!);
    expect(next.upper!).toBeGreaterThanOrEqual(next.forecast!);
  });
});

describe("kpi builder", () => {
  it("parses a sum", () => {
    const k = parseKpi("total revenue", ds);
    expect(k.valid).toBe(true);
    expect(k.value).toBeGreaterThan(0);
  });
  it("parses a distinct count", () => {
    const k = parseKpi("distinct customer_id", ds);
    expect(k.valid).toBe(true);
    expect(k.value).toBeGreaterThan(0);
  });
  it("parses a ratio", () => {
    const k = parseKpi("total revenue divided by distinct customer_id", ds);
    expect(k.valid).toBe(true);
    expect(k.value).toBeGreaterThan(0);
  });
});

describe("chat", () => {
  it("answers a trend question with real numbers", () => {
    const a = answerQuestion("what is the trend?", { dataset: ds });
    expect(a.text.length).toBeGreaterThan(20);
    expect(a.citations.length).toBeGreaterThan(0);
  });
  it("routes a forecast question to the forecast", () => {
    const a = answerQuestion("predict next month", { dataset: ds });
    expect(a.text.toLowerCase()).toMatch(/project|holt|forecast|next/);
  });
});
