/* ============================================================
   Sentiment analysis — deterministic, lexicon-based scoring of
   a text column. Each row is scored with an AFINN-style lexicon
   (with negation + intensifier handling), then aggregated into a
   positive / negative / neutral distribution with examples.
   Numbers come from a fixed lexicon, so they are reproducible and
   trustworthy; the LLM (Groq) only writes the interpretation.
   ============================================================ */

import type { ColumnSchema, Dataset, Insight, SentimentResult } from "@/lib/types";
import { LEXICON, NEGATORS, INTENSIFIERS } from "./sentiment-lexicon";
import { clamp, pct, titleCase, uid } from "@/lib/utils";

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/n['’]t\b/g, " not")
    .replace(/[^a-z0-9\s']/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

/** Score a single string with the lexicon (negation + intensifiers). */
export function scoreText(text: string): number {
  const toks = tokenize(text);
  let sum = 0;
  for (let i = 0; i < toks.length; i++) {
    const w = toks[i];
    const s = LEXICON[w];
    if (s === undefined) continue;
    const prev = toks[i - 1];
    const prev2 = toks[i - 2];
    let v = s;
    const negated = !!prev && NEGATORS.has(prev) || (!!prev2 && NEGATORS.has(prev2));
    if (negated) v = -v;
    if (prev && INTENSIFIERS[prev]) v = v * INTENSIFIERS[prev];
    sum += v;
  }
  return sum;
}

const TEXT_NAME_RE = /(review|feedback|comment|text|message|tweet|description|testimonial|note)/i;

/** Pick the best text column: preferred → name match → longest-average-length string column. */
export function detectTextColumn(dataset: Dataset, preferred?: string): ColumnSchema | null {
  const strs = dataset.schema.filter((c) => c.type === "string");
  if (!strs.length) return null;
  if (preferred) {
    const hit = strs.find((c) => c.name === preferred) ?? strs.find((c) => c.name.toLowerCase() === preferred.toLowerCase());
    if (hit) return hit;
  }
  const nameHit = strs.find((c) => TEXT_NAME_RE.test(c.name));
  if (nameHit) return nameHit;
  let best: ColumnSchema | null = null;
  let bestAvg = 0;
  for (const c of strs) {
    let sum = 0, n = 0;
    for (const row of dataset.rows) {
      const v = row[c.name];
      if (v === null || v === undefined || v === "") continue;
      sum += String(v).length;
      n++;
    }
    const avg = n ? sum / n : 0;
    if (avg > bestAvg) { bestAvg = avg; best = c; }
  }
  return bestAvg >= 15 ? best : null;
}

export function analyzeSentiment(dataset: Dataset, opts?: { column?: string }): SentimentResult | null {
  const col = detectTextColumn(dataset, opts?.column);
  if (!col) return null;

  let positive = 0, negative = 0, neutral = 0, scored = 0, total = 0, sum = 0;
  const posEx: { text: string; score: number }[] = [];
  const negEx: { text: string; score: number }[] = [];

  for (const row of dataset.rows) {
    const v = row[col.name];
    if (v === null || v === undefined || v === "") continue;
    total++;
    const text = String(v);
    const s = scoreText(text);
    scored++;
    sum += s;
    if (s > 0) positive++;
    else if (s < 0) negative++;
    else neutral++;
    if (s > 0) posEx.push({ text: text.slice(0, 160), score: s });
    else if (s < 0) negEx.push({ text: text.slice(0, 160), score: s });
  }

  if (!scored) return null;

  posEx.sort((a, b) => b.score - a.score);
  negEx.sort((a, b) => a.score - b.score);
  const posShare = positive / scored;
  const negShare = negative / scored;
  const neuShare = neutral / scored;
  const avgScore = sum / scored;
  const lean = posShare > negShare + 0.05 ? "positive" : negShare > posShare + 0.05 ? "negative" : "mixed";

  const summary = `${titleCase(col.name)} sentiment leans ${lean}: ${pct(posShare)} positive, ${pct(negShare)} negative, ${pct(neuShare)} neutral across ${scored.toLocaleString()} scored rows (avg score ${avgScore.toFixed(2)}).`;

  return {
    column: col.name,
    total,
    scored,
    positive,
    negative,
    neutral,
    posShare,
    negShare,
    neuShare,
    avgScore,
    examples: { positive: posEx.slice(0, 3), negative: negEx.slice(0, 3) },
    summary,
  };
}

export function sentimentInsight(r: SentimentResult): Insight {
  const lean = r.posShare > r.negShare + 0.05 ? "positive" : r.negShare > r.posShare + 0.05 ? "negative" : "mixed";
  return {
    id: uid("ins"),
    category: "sentiment",
    title: `Sentiment leans ${lean} — ${pct(r.posShare)} positive, ${pct(r.negShare)} negative`,
    summary: r.summary,
    confidence: clamp(0.55 + Math.min(r.scored, 500) / 500 * 0.35, 0.55, 0.9),
    metrics: [
      { label: "Positive", value: pct(r.posShare) },
      { label: "Negative", value: pct(r.negShare) },
      { label: "Neutral", value: pct(r.neuShare) },
      { label: "Avg score", value: r.avgScore.toFixed(2) },
    ],
    impact: r.scored > 100 ? "high" : "medium",
    impactReason: "Aggregate sentiment signals how customers feel about the product and is a leading indicator of churn and advocacy.",
    action: lean === "negative"
      ? "Triage the themes in the most negative reviews (see Keywords) and route them to support; close the loop with affected customers."
      : "Amplify the themes driving positive reviews in marketing and deflect the negative ones in product messaging.",
  };
}
