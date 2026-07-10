/* ============================================================
   Shared domain types for the AnalystAI analysis engine.
   ============================================================ */

import type { AnalysisIntent } from "./analysis/intent";

export type ColumnType = "number" | "string" | "date" | "boolean";

export interface ColumnSchema {
  name: string;
  type: ColumnType;
  /** rows where this column is null/empty */
  missing: number;
  /** distinct non-null values */
  unique: number;
  /** numeric-only stats */
  min?: number;
  max?: number;
  mean?: number;
  median?: number;
  std?: number;
  q1?: number;
  q3?: number;
  /** categorical-only */
  topValues?: { value: string; count: number; share: number }[];
  /** date-only */
  minDate?: string;
  maxDate?: string;
  /** heuristic semantic role inferred from the column name */
  role?: ColumnRole;
}

export type ColumnRole =
  | "revenue"
  | "cost"
  | "profit"
  | "quantity"
  | "price"
  | "date"
  | "category"
  | "region"
  | "product"
  | "customer"
  | "metric"
  | "id"
  | "unknown";

export interface Dataset {
  id: string;
  name: string;
  columns: string[];
  rows: Record<string, unknown>[];
  schema: ColumnSchema[];
  rowCount: number;
  createdAt: string;
}

/* ── Data quality ─────────────────────────────────────────── */
export interface QualityIssue {
  id: string;
  severity: "high" | "medium" | "low";
  column: string;
  kind: "missing" | "duplicate" | "outlier" | "type-mismatch" | "inconsistent" | "skewed";
  title: string;
  detail: string;
  affected: number;
  recommendation: string;
  autoFix: AutoFix;
}

export interface AutoFix {
  label: string;
  description: string;
}

/* ── Insights ─────────────────────────────────────────────── */
export type InsightCategory =
  | "revenue"
  | "trend"
  | "segmentation"
  | "seasonality"
  | "product"
  | "correlation"
  | "quality"
  | "distribution"
  | "outlier"
  | "geographic"
  | "churn"
  | "forecast"
  | "summary";

export interface InsightMetric {
  label: string;
  value: string;
}

export interface Insight {
  id: string;
  category: InsightCategory;
  title: string;
  summary: string;
  confidence: number; // 0..1
  metrics: InsightMetric[];
  impact: "high" | "medium" | "low";
  impactReason: string;
  action: string;
}

/* ── Forecast ─────────────────────────────────────────────── */
export interface ForecastPoint {
  label: string;
  actual: number | null;
  forecast: number | null;
  lower: number | null;
  upper: number | null;
}

export interface ForecastResult {
  dateColumn: string;
  valueColumn: string;
  aggregation: "sum" | "mean";
  period: "day" | "week" | "month";
  history: ForecastPoint[];
  horizon: ForecastPoint[];
  metrics: { mape: number; r2: number; level: number; trend: number };
  summary: string;
}

/* ── EDA ──────────────────────────────────────────────────── */
export interface CorrelationMatrix {
  columns: string[];
  matrix: number[][];
}

export interface Histogram {
  column: string;
  bins: { label: string; count: number; x0: number; x1: number }[];
}

/* ── Chat ─────────────────────────────────────────────────── */
export interface ChatMessage {
  id: string;
  role: "user" | "analyst";
  content: string;
  citations?: { label: string; value: string }[];
  ts: number;
}

/* ── KPI ──────────────────────────────────────────────────── */
export interface KpiDefinition {
  id: string;
  label: string;
  expression: string;
  value: number;
  display: string;
  formula: string;
  valid: boolean;
  error?: string;
}

/* ── AI orchestration ─────────────────────────────────────── */
export type AITask =
  | "reasoning"
  | "sql"
  | "cleaning"
  | "chart-explanation"
  | "forecast-interpretation"
  | "report-writing"
  | "kpi-generation"
  | "insight-generation"
  | "chat";

export interface DatasetProfile {
  rowCount: number;
  columnCount: number;
  numericColumns: string[];
  categoricalColumns: string[];
  dateColumns: string[];
  completeness: number; // 0..1 overall
  duplicateRows: number;
}

export interface AIContext {
  dataset: Dataset;
  profile?: DatasetProfile;
  insights?: Insight[];
  forecast?: ForecastResult;
  history?: ChatMessage[];
  /** the user's current natural-language request (chat / sql / kpi) */
  question?: string;
  /** optional chart spec for the chart-explanation task */
  chartSpec?: { kind: string; title: string; series?: string[] };
  /** active analysis focus derived from a prompt — scopes metric/dimension picks */
  intent?: AnalysisIntent | null;
}

export interface AIResult {
  text: string;
  task: AITask;
  provider: "local" | "llm";
  citations?: { label: string; value: string }[];
}
