import { describe, it, expect } from "vitest";
import { buildSampleDataset, buildSampleReviewsDataset } from "@/lib/data/sample";
import { analyzeSentiment, scoreText } from "@/lib/analysis/sentiment";
import { analyzePareto } from "@/lib/analysis/pareto";
import { analyzeCohort } from "@/lib/analysis/cohort";
import { analyzeKeywords } from "@/lib/analysis/text";
import { parseBrief } from "@/lib/analysis/intent";

const revenue = buildSampleDataset();
const reviews = buildSampleReviewsDataset();

describe("sentiment", () => {
  it("scores obvious polarity correctly", () => {
    expect(scoreText("this is excellent and wonderful")).toBeGreaterThan(0);
    expect(scoreText("this is terrible and awful")).toBeLessThan(0);
    expect(scoreText("the sky is blue today")).toBe(0);
  });

  it("handles negation", () => {
    expect(scoreText("not good")).toBeLessThan(0);
    expect(scoreText("not terrible")).toBeGreaterThan(0);
  });

  it("aggregates a text column into a distribution", () => {
    const r = analyzeSentiment(reviews);
    expect(r).not.toBeNull();
    expect(r!.column).toBe("review");
    expect(r!.scored).toBeGreaterThan(100);
    expect(r!.positive + r!.negative + r!.neutral).toBe(r!.scored);
    expect(r!.posShare + r!.negShare + r!.neuShare).toBeCloseTo(1, 5);
    expect(r!.examples.positive.length).toBeGreaterThan(0);
  });

  it("returns null when there is no text column", () => {
    expect(analyzeSentiment(revenue)).toBeNull();
  });
});

describe("keywords", () => {
  it("surfaces top terms from the text column", () => {
    const r = analyzeKeywords(reviews);
    expect(r).not.toBeNull();
    expect(r!.topTerms.length).toBeGreaterThan(0);
    expect(r!.topTerms[0].count).toBeGreaterThanOrEqual(r!.topTerms[r!.topTerms.length - 1].count);
  });
});

describe("pareto", () => {
  it("computes an 80-20 concentration on the revenue sample", () => {
    const r = analyzePareto(revenue);
    expect(r).not.toBeNull();
    expect(r!.buckets.length).toBeGreaterThan(1);
    // cumulative share is monotonic and ends at ~1
    const last = r!.buckets[r!.buckets.length - 1];
    expect(last.cumulative).toBeCloseTo(1, 3);
    expect(r!.vitalFewShare).toBeGreaterThanOrEqual(0.8 - 1e-9);
    expect(r!.vitalFewCount).toBeLessThanOrEqual(r!.buckets.length);
  });

  it("honors a metric + category override", () => {
    const r = analyzePareto(revenue, { metric: "profit", category: "product" });
    expect(r!.metric).toBe("profit");
    expect(r!.category).toBe("product");
  });
});

describe("cohort", () => {
  it("builds cohorts from date + customer + metric", () => {
    const r = analyzeCohort(reviews, { metric: "rating" });
    expect(r).not.toBeNull();
    expect(r!.cohorts.length).toBeGreaterThan(0);
    // period 0 retention is 100% by construction
    expect(r!.cohorts[0].periods[0].retention).toBeCloseTo(1, 5);
  });
});

describe("intent detection for new analyses", () => {
  it("detects sentiment + keyword intents", () => {
    const i = parseBrief("analyze the sentiment and top keywords in the reviews", reviews);
    expect(i!.analyses).toContain("sentiment");
    expect(i!.analyses).toContain("text");
    expect(i!.primaryTab).toBe("advanced");
  });

  it("detects pareto and cohort", () => {
    const p = parseBrief("show me a pareto of revenue by region", revenue);
    expect(p!.analyses).toContain("pareto");
    const c = parseBrief("cohort retention over time", revenue);
    expect(c!.analyses).toContain("cohort");
  });
});
