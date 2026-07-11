/* ============================================================
   Seed sample dataset — a realistic SaaS revenue ledger so the
   product is useful with zero upload (the "try it instantly" path).
   Deterministic: seeded PRNG, no Math.random at module-eval beyond uid.
   ============================================================ */

import type { Dataset } from "@/lib/types";
import { inferSchema } from "./schema";
import { uid } from "@/lib/utils";

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const REGIONS = ["North America", "Europe", "Asia Pacific", "LATAM", "Middle East"];
const PRODUCTS = ["Atlas Pro", "Atlas Core", "Pulse Analytics", "Insight Cloud", "Vault Secure"];
const SEGMENTS = ["Enterprise", "Mid-Market", "SMB"];
const CHANNELS = ["Direct", "Partner", "Self-Serve", "Marketplace"];

/** Generate ~2.5 years of monthly SaaS revenue records. */
export function buildSampleDataset(): Dataset {
  const rng = mulberry32(20260710);
  const rows: Record<string, unknown>[] = [];
  const start = new Date("2024-01-01");
  // ~760 transactions across 31 months
  for (let m = 0; m < 31; m++) {
    const monthDate = new Date(start.getFullYear(), start.getMonth() + m, 1);
    const seasonal = 1 + 0.18 * Math.sin((m / 12) * Math.PI * 2 - Math.PI / 3);
    const growth = 1 + m * 0.022; // steady MoM growth
    const txns = 24 + Math.floor(rng() * 8);
    for (let t = 0; t < txns; t++) {
      const day = 1 + Math.floor(rng() * 27);
      const date = new Date(monthDate.getFullYear(), monthDate.getMonth(), day);
      const product = PRODUCTS[Math.floor(rng() * PRODUCTS.length)];
      const region = REGIONS[Math.floor(rng() * REGIONS.length)];
      const segment = SEGMENTS[Math.floor(rng() * SEGMENTS.length)];
      const channel = CHANNELS[Math.floor(rng() * CHANNELS.length)];
      const units = 1 + Math.floor(rng() * 12);
      const basePrice = product === "Atlas Pro" ? 1200 : product === "Pulse Analytics" ? 900 : product === "Insight Cloud" ? 650 : product === "Vault Secure" ? 480 : 320;
      const segmentMult = segment === "Enterprise" ? 1.6 : segment === "Mid-Market" ? 1.15 : 1;
      const revenue = Math.round(units * basePrice * segmentMult * seasonal * growth * (0.8 + rng() * 0.4));
      const cost = Math.round(revenue * (0.32 + rng() * 0.18));
      rows.push({
        date: date.toISOString().slice(0, 10),
        product,
        region,
        segment,
        channel,
        units,
        unit_price: basePrice,
        revenue,
        cost,
        profit: revenue - cost,
        customer_id: `C-${1000 + Math.floor(rng() * 480)}`,
      });
    }
  }
  // sprinkle a few missing values + a couple of duplicates to exercise cleaning
  rows[3].units = "";
  rows[12].region = "";
  rows[20].revenue = "";
  rows.push({ ...rows[7] });

  const columns = Object.keys(rows[0]);
  const schema = inferSchema(columns, rows);
  return {
    id: uid("ds"),
    name: "sample_saas_revenue.csv",
    columns,
    rows,
    schema,
    rowCount: rows.length,
    createdAt: new Date().toISOString(),
  };
}

/** Compact CSV preview for the "load sample" action. */
export const SAMPLE_CSV_HINT = "SaaS revenue ledger · 31 months · 5 products · 5 regions";

/* ── Product reviews sample (for sentiment / keywords / cohort) ── */

const REVIEW_PRODUCTS = ["Atlas Pro", "Pulse Analytics", "Insight Cloud", "Vault Secure"];
const REVIEW_REGIONS = ["North America", "Europe", "Asia Pacific", "LATAM"];

const POSITIVE_REVIEWS = [
  "Absolutely love this product, the dashboards are excellent and incredibly easy to use.",
  "Fantastic experience — fast, reliable and the support team is wonderful and helpful.",
  "Great value for money. The interface is intuitive and the forecasts are impressively accurate.",
  "This is the best analytics tool we have used. Setup was smooth and the results are amazing.",
  "Really happy with the reporting features, they are polished and save us so much time.",
  "Excellent onboarding and a beautiful, elegant design. Highly recommend to any team.",
  "The insights are brilliant and the export is seamless. A superb, stellar upgrade for us.",
  "Wonderful customer service and a reliable, stable platform. We are very satisfied.",
];
const NEGATIVE_REVIEWS = [
  "Terrible experience, the app is slow and crashes constantly. Very disappointed.",
  "Poor support and a confusing interface. The dashboards are buggy and hard to use.",
  "Worst tool I have tried — expensive, unreliable and full of annoying bugs.",
  "Disappointing quality. The reports are broken and the export always fails with errors.",
  "Frustrating and complicated. Setup was painful and the product feels outdated.",
  "Awful performance, laggy and cluttered. A complete waste of money, would not recommend.",
  "The forecast is misleading and the whole thing is a buggy mess. Cancelled our plan.",
  "Horrible onboarding, unhelpful support and constant glitches. Very unhappy with this.",
];
const NEUTRAL_REVIEWS = [
  "The product works as described. Nothing special but it does the job.",
  "Average tool. Some features are useful, others feel unfinished.",
  "It is okay. The dashboards load and the data is there, no strong opinion either way.",
  "Does what it says. The setup took a while but it runs fine now.",
];

/** ~420 product reviews across 18 months, with mixed sentiment. */
export function buildSampleReviewsDataset(): Dataset {
  const rng = mulberry32(20260711);
  const rows: Record<string, unknown>[] = [];
  const start = new Date("2024-07-01");
  for (let m = 0; m < 18; m++) {
    const monthDate = new Date(start.getFullYear(), start.getMonth() + m, 1);
    const count = 20 + Math.floor(rng() * 8);
    for (let t = 0; t < count; t++) {
      const day = 1 + Math.floor(rng() * 27);
      const date = new Date(monthDate.getFullYear(), monthDate.getMonth(), day);
      const product = REVIEW_PRODUCTS[Math.floor(rng() * REVIEW_PRODUCTS.length)];
      const region = REVIEW_REGIONS[Math.floor(rng() * REVIEW_REGIONS.length)];
      // skew positive over time (product improving) so cohorts/trends have signal
      const r = rng();
      const posBias = 0.5 + m * 0.008;
      let review: string, rating: number;
      if (r < posBias) {
        review = POSITIVE_REVIEWS[Math.floor(rng() * POSITIVE_REVIEWS.length)];
        rating = 4 + Math.round(rng());
      } else if (r < posBias + 0.28) {
        review = NEGATIVE_REVIEWS[Math.floor(rng() * NEGATIVE_REVIEWS.length)];
        rating = 1 + Math.round(rng());
      } else {
        review = NEUTRAL_REVIEWS[Math.floor(rng() * NEUTRAL_REVIEWS.length)];
        rating = 3;
      }
      rows.push({
        date: date.toISOString().slice(0, 10),
        product,
        region,
        rating,
        review,
        customer_id: `U-${1000 + Math.floor(rng() * 260)}`,
      });
    }
  }

  const columns = Object.keys(rows[0]);
  const schema = inferSchema(columns, rows);
  return {
    id: uid("ds"),
    name: "sample_product_reviews.csv",
    columns,
    rows,
    schema,
    rowCount: rows.length,
    createdAt: new Date().toISOString(),
  };
}

export const REVIEWS_CSV_HINT = "Product reviews · 18 months · 4 products · sentiment + keywords";
