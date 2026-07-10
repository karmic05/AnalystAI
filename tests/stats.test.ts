import { describe, it, expect } from "vitest";
import {
  mean, median, quantile, std, pearson, linreg, mape, outlierMask, skewness, histogram, sum,
} from "@/lib/analysis/stats";

describe("stats basics", () => {
  it("mean/sum", () => {
    expect(mean([1, 2, 3, 4])).toBe(2.5);
    expect(sum([1, 2, 3, 4])).toBe(10);
    expect(Number.isNaN(mean([]))).toBe(true);
  });

  it("median", () => {
    expect(median([1, 2, 3, 4])).toBe(2.5);
    expect(median([1, 2, 3])).toBe(2);
  });

  it("quantile (type-7)", () => {
    expect(quantile([1, 2, 3, 4], 0)).toBe(1);
    expect(quantile([1, 2, 3, 4], 1)).toBe(4);
    expect(quantile([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 0.5)).toBeCloseTo(5.5, 5);
  });

  it("std is sample std (n-1)", () => {
    // population std of [2,4,4,4,5,5,7,9] = 2, sample std ≈ 2.138
    const s = std([2, 4, 4, 4, 5, 5, 7, 9]);
    expect(s).toBeCloseTo(2.138, 2);
  });
});

describe("correlation & regression", () => {
  it("pearson perfect positive", () => {
    expect(pearson([1, 2, 3, 4, 5], [2, 4, 6, 8, 10])).toBeCloseTo(1, 8);
  });
  it("pearson perfect negative", () => {
    expect(pearson([1, 2, 3, 4, 5], [10, 8, 6, 4, 2])).toBeCloseTo(-1, 8);
  });
  it("linreg slope/intercept/r2", () => {
    const r = linreg([0, 1, 2, 3, 4], [1, 3, 5, 7, 9]);
    expect(r.slope).toBeCloseTo(2, 8);
    expect(r.intercept).toBeCloseTo(1, 8);
    expect(r.r2).toBeCloseTo(1, 8);
  });
  it("mape ignores zero actuals", () => {
    expect(mape([100, 200], [110, 190])).toBeCloseTo(0.075, 5);
    expect(mape([0, 100], [10, 110])).toBeCloseTo(0.1, 5);
  });
});

describe("outliers & distribution", () => {
  it("flags IQR outliers", () => {
    const mask = outlierMask([1, 1, 1, 1, 1, 1, 100]);
    expect(mask[mask.length - 1]).toBe(true);
    expect(mask.slice(0, -1).every((m) => !m)).toBe(true);
  });
  it("skewness sign", () => {
    // right-skewed: a few large values
    expect(skewness([1, 1, 1, 1, 1, 1, 1, 20])).toBeGreaterThan(1);
  });
  it("histogram buckets all values", () => {
    const h = histogram([0, 1, 2, 3, 4], 5);
    expect(h.reduce((a, b) => a + b.count, 0)).toBe(5);
    expect(h.length).toBe(5);
  });
});
