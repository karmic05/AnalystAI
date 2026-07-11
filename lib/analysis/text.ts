/* ============================================================
   Text / keyword analysis — word frequency on a text column,
   surfacing the themes customers mention most. Deterministic.
   Reuses the text-column detector from sentiment.ts.
   ============================================================ */

import type { Dataset, Insight, KeywordResult } from "@/lib/types";
import { detectTextColumn } from "./sentiment";
import { pct, titleCase, uid } from "@/lib/utils";

const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "but", "if", "then", "else", "for", "of", "to", "in",
  "on", "at", "by", "with", "from", "as", "is", "are", "was", "were", "be", "been", "being",
  "this", "that", "these", "those", "it", "its", "i", "you", "he", "she", "we", "they",
  "my", "your", "his", "her", "our", "their", "me", "him", "us", "them",
  "have", "has", "had", "do", "does", "did", "will", "would", "can", "could", "should",
  "may", "might", "must", "shall", "not", "no", "yes", "so", "very", "too", "also",
  "just", "than", "then", "there", "here", "when", "where", "which", "who", "whom",
  "what", "why", "how", "all", "any", "both", "each", "few", "more", "most", "other",
  "some", "such", "only", "own", "same", "up", "down", "out", "over", "under", "again",
  "into", "about", "after", "before", "between", "through", "during", "above", "below",
  "am", "now", "get", "got", "getting", "really", "one", "two", "three", "use", "using",
  "used", "like", "want", "needs", "need", "good", "bad", "great", "product", "service",
  "app", "application", "company", "time", "ever", "even", "much", "make", "makes", "made",
]);

export function analyzeKeywords(dataset: Dataset, opts?: { column?: string }): KeywordResult | null {
  const col = detectTextColumn(dataset, opts?.column);
  if (!col) return null;

  const freq = new Map<string, number>();
  let totalTokens = 0;
  for (const row of dataset.rows) {
    const v = row[col.name];
    if (v === null || v === undefined || v === "") continue;
    const toks = String(v).toLowerCase().replace(/[^a-z\s]/g, " ").split(/\s+/);
    for (const t of toks) {
      if (t.length < 3 || STOPWORDS.has(t)) continue;
      totalTokens++;
      freq.set(t, (freq.get(t) ?? 0) + 1);
    }
  }

  if (!totalTokens) return null;

  const topTerms = [...freq.entries()]
    .map(([term, count]) => ({ term, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  const lead = topTerms[0];
  const summary = `Top themes in ${titleCase(col.name)}: "${lead.term}" (${lead.count}), followed by ${topTerms.slice(1, 4).map((t) => `"${t.term}" (${t.count})`).join(", ")}. ${totalTokens.toLocaleString()} content tokens analyzed.`;

  return { column: col.name, totalTokens, topTerms, summary };
}

export function keywordInsight(r: KeywordResult): Insight {
  const top = r.topTerms.slice(0, 3).map((t) => t.term).join(", ");
  return {
    id: uid("ins"),
    category: "text",
    title: `Top themes in ${titleCase(r.column)}: ${top}`,
    summary: r.summary,
    confidence: 0.75,
    metrics: r.topTerms.slice(0, 4).map((t) => ({ label: t.term, value: String(t.count) })),
    impact: "medium",
    impactReason: "Recurring themes in customer text reveal what drives sentiment and what to fix or amplify.",
    action: "Pair the top themes with the sentiment tab — positive themes become marketing hooks; negative themes become the product backlog.",
  };
}
