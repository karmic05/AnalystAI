/* ============================================================
   AFINN-style sentiment lexicon (curated subset, scores -5..5)
   + negators that flip the polarity of the following word.
   Used by lib/analysis/sentiment.ts for deterministic, offline
   sentiment scoring. Numbers come from a fixed lexicon, never a
   model, so they are reproducible and trustworthy.
   ============================================================ */

export const LEXICON: Record<string, number> = {
  // ── positive ──────────────────────────────────────────────
  good: 3, great: 3, excellent: 5, amazing: 4, awesome: 4, fantastic: 4,
  wonderful: 4, fabulous: 4, terrific: 4, superb: 4, outstanding: 5,
  love: 3, loved: 3, loves: 3, loving: 2, like: 2, liked: 2, likes: 2,
  best: 4, better: 2, brilliant: 4, perfect: 5, perfectly: 4, happy: 3,
  happier: 3, happiest: 4, glad: 3, pleased: 3, delight: 3, delighted: 4,
  enjoyable: 3, enjoyed: 3, enjoy: 3, enjoying: 2, pleasant: 3, pleasing: 3,
  nice: 3, sweet: 2, cool: 2, fun: 3, beautiful: 3, gorgeous: 4, stunning: 4,
  impressive: 4, remarkable: 4, exceptional: 5, positive: 2, favorable: 2,
  recommend: 4, recommended: 4, reliable: 3, helpful: 3, easy: 2, intuitive: 3,
  smooth: 2, fast: 1, quick: 1, value: 2, worth: 2, win: 3, winning: 3,
  wins: 3, won: 3, success: 3, successful: 4, bonus: 2, benefit: 2,
  benefits: 2, improvement: 2, improved: 2, upgrade: 2, boost: 2, growth: 2,
  growing: 2, gain: 2, gains: 2, profit: 2, profitable: 3, thrive: 3,
  thriving: 3, quality: 3, sleek: 2, elegant: 3, polished: 2, refresh: 2,
  refreshing: 3, satisfying: 3, satisfied: 3, satisfaction: 3, stellar: 4,
  solid: 2, stable: 2, strong: 2, thanks: 2, thank: 2, appreciate: 3,
  appreciation: 3, comfortable: 2, convenient: 2, friendly: 3, supportive: 3,

  // ── negative ──────────────────────────────────────────────
  bad: -3, terrible: -4, awful: -4, horrible: -5, horrendous: -5,
  worst: -5, worse: -3, poor: -3, poorly: -3, hate: -4, hated: -4,
  hates: -4, disliking: -2, dislike: -2, disliked: -2, disgusting: -5,
  gross: -3, nasty: -3, ugly: -3, disappointed: -3, disappointing: -3,
  disappointment: -3, frustrating: -3, frustrated: -3, frustration: -3,
  annoying: -3, annoyed: -2, slow: -2, sluggish: -2, boring: -2,
  bored: -2, confusing: -2, confused: -2, complicated: -2, complex: -1,
  difficult: -2, hard: -1, broken: -3, bug: -3, buggy: -3, crash: -4,
  crashes: -4, crashed: -4, failing: -3, fails: -3, failed: -3, failure: -3,
  error: -2, errors: -2, issue: -2, issues: -2, problem: -3, problems: -3,
  complaint: -3, complaints: -3, complain: -2, complaining: -2, angry: -3,
  anger: -3, sad: -2, unhappy: -3, miserable: -4, painful: -3, pain: -2,
  useless: -4, worthless: -4, waste: -3, wasted: -3, expensive: -2,
  overpriced: -3, cheap: -2, flimsy: -2, unreliable: -3, unhelpful: -3,
  unclear: -2, vague: -1, misleading: -3, wrong: -2,
  lacks: -2, lacking: -2, missing: -2, dropped: -2, drop: -2, decline: -3,
  declining: -3, declined: -3, decrease: -2, falling: -2, fell: -2,
  loss: -3, lost: -3, losing: -3, weak: -2, weaker: -2, unstable: -3,
  risky: -2, risk: -2, threat: -3, churn: -3, cancel: -2, cancelled: -2,
  cancellation: -2, refund: -2, negative: -2, unfavorable: -2,
  mediocre: -2, subpar: -3, unacceptable: -4, disaster: -5, catastrophic: -5,
  lag: -2, laggy: -3, glitch: -3, glitches: -3, outdated: -2, obsolete: -2,
  cluttered: -2, overwhelming: -2, regret: -3, regretted: -3,
};

/** Words that flip the polarity of the following scored word. */
export const NEGATORS = new Set([
  "not", "no", "never", "none", "n't", "cannot", "cant", "without",
  "hardly", "barely", "scarcely", "neither", "nor", "dont", "doesnt",
  "didnt", "isnt", "wasnt", "arent", "werent", "wont", "wouldnt",
  "couldnt", "shouldnt",
]);

/** Intensifiers that amplify the following word's score. */
export const INTENSIFIERS: Record<string, number> = {
  very: 1.5, really: 1.4, extremely: 1.8, so: 1.2, super: 1.5, totally: 1.4,
  absolutely: 1.6, incredibly: 1.6, highly: 1.4, quite: 1.2, too: 1.2,
};
