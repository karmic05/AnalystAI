import { describe, it, expect } from "vitest";
import { parseBrief } from "@/lib/analysis/intent";
import { parseKpi } from "@/lib/analysis/kpi";
import { buildSampleDataset } from "@/lib/data/sample";

const ds = buildSampleDataset();

describe("parseBrief", () => {
  it("returns null for empty input", () => {
    expect(parseBrief("", ds)).toBeNull();
    expect(parseBrief("   ", ds)).toBeNull();
  });

  it("catches forecast intent with horizon, period and metric", () => {
    const i = parseBrief("Forecast revenue for the next 2 quarters", ds)!;
    expect(i.analyses).toContain("forecast");
    expect(i.metric).toBe("revenue");
    expect(i.period).toBe("month");
    expect(i.horizon).toBe(6); // 2 quarters -> 6 months
    expect(i.primaryTab).toBe("forecast");
    expect(i.keywords).toContain("forecast");
  });

  it("catches segmentation + outliers and resolves the group-by column", () => {
    const i = parseBrief("Segment revenue by region and detect anomalies", ds)!;
    expect(i.analyses).toContain("segmentation");
    expect(i.analyses).toContain("outliers");
    expect(i.groupBy).toBe("region");
    expect(i.metric).toBe("revenue");
  });

  it("extracts a KPI expression, routes to the kpi tab, and the expression compiles", () => {
    const i = parseBrief("Revenue per active customer", ds)!;
    expect(i.analyses).toContain("kpi");
    expect(i.kpiExpression?.toLowerCase()).toBe("revenue per active customer");
    expect(i.primaryTab).toBe("kpi");
    expect(parseKpi(i.kpiExpression!, ds).valid).toBe(true);
  });

  it("catches correlation and routes to eda", () => {
    const i = parseBrief("What drives profit? Find the correlations.", ds)!;
    expect(i.analyses).toContain("correlation");
    expect(i.metric).toBe("profit");
    expect(i.primaryTab).toBe("eda");
  });

  it("catches report intent and routes to the report tab", () => {
    const i = parseBrief("Summarize the data in an executive report", ds)!;
    expect(i.analyses).toContain("report");
    expect(i.primaryTab).toBe("report");
  });
});
