"use client";

import { useMemo, useState } from "react";
import {
  Table2, ScanSearch, Lightbulb, BarChart3, Bot, TrendingUp, LayoutDashboard, FileText, Calculator,
  Layers, RefreshCw, Check, AlertTriangle,
} from "lucide-react";
import type { ChatMessage, Dataset, Insight, KpiDefinition, QualityIssue } from "@/lib/types";
import { buildProfile } from "@/lib/analysis/profile";
import { generateInsights } from "@/lib/analysis/insights";
import { forecast as runForecast } from "@/lib/analysis/forecast";
import { detectQuality, applyFix } from "@/lib/analysis/quality";
import { correlationMatrix } from "@/lib/analysis/correlation";
import { analyzeSentiment, sentimentInsight } from "@/lib/analysis/sentiment";
import { analyzePareto, paretoInsight } from "@/lib/analysis/pareto";
import { analyzeCohort, cohortInsight } from "@/lib/analysis/cohort";
import { analyzeKeywords, keywordInsight } from "@/lib/analysis/text";
import { answerQuestion, makeMessage } from "@/lib/analysis/chat";
import { parseBrief, type AnalysisIntent } from "@/lib/analysis/intent";
import { buildSampleDataset, buildSampleReviewsDataset } from "@/lib/data/sample";
import { uid } from "@/lib/utils";

import { DataUpload } from "@/components/studio/data-upload";
import { DataTable } from "@/components/studio/data-table";
import { ProfileView } from "@/components/studio/profile-view";
import { EDAView } from "@/components/studio/eda-view";
import { InsightsView } from "@/components/studio/insights-view";
import { ChatView } from "@/components/studio/chat-view";
import { ForecastView } from "@/components/studio/forecast-view";
import { DashboardView } from "@/components/studio/dashboard-view";
import { ReportView } from "@/components/studio/report-view";
import { KpiBuilder } from "@/components/studio/kpi-builder";
import { AdvancedView } from "@/components/studio/advanced-view";
import { BriefBar } from "@/components/studio/brief-bar";
import { Tabs } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type TabId = "data" | "overview" | "insights" | "eda" | "advanced" | "chat" | "forecast" | "dashboard" | "report" | "kpi";

export default function AnalyzePage() {
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [tab, setTab] = useState<TabId>("overview");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [thinking, setThinking] = useState(false);
  const [savedKpis, setSavedKpis] = useState<KpiDefinition[]>([]);
  const [appliedFixes, setAppliedFixes] = useState(0);
  const [brief, setBrief] = useState("");
  const [intent, setIntent] = useState<AnalysisIntent | null>(null);

  const profile = useMemo(() => (dataset ? buildProfile(dataset) : null), [dataset]);
  const sentiment = useMemo(
    () => (dataset ? analyzeSentiment(dataset, { column: intent?.textColumn }) : null),
    [dataset, intent],
  );
  const pareto = useMemo(
    () => (dataset ? analyzePareto(dataset, { metric: intent?.metric, category: intent?.groupBy }) : null),
    [dataset, intent],
  );
  const cohort = useMemo(
    () => (dataset ? analyzeCohort(dataset, { metric: intent?.metric }) : null),
    [dataset, intent],
  );
  const keywords = useMemo(
    () => (dataset ? analyzeKeywords(dataset, { column: intent?.textColumn }) : null),
    [dataset, intent],
  );
  const insights = useMemo(() => {
    if (!dataset) return [];
    const base = generateInsights(dataset, { metric: intent?.metric, category: intent?.groupBy });
    const deep: Insight[] = [];
    if (sentiment) deep.push(sentimentInsight(sentiment));
    if (pareto) deep.push(paretoInsight(pareto));
    if (cohort) deep.push(cohortInsight(cohort));
    if (keywords) deep.push(keywordInsight(keywords));
    return deep.length ? [...deep, ...base] : base;
  }, [dataset, intent, sentiment, pareto, cohort, keywords]);
  const forecast = useMemo(
    () =>
      dataset
        ? runForecast(dataset, { valueColumn: intent?.metric, period: intent?.period, horizon: intent?.horizon })
        : null,
    [dataset, intent],
  );
  const quality = useMemo(() => (dataset ? detectQuality(dataset) : []), [dataset]);
  const corr = useMemo(() => (dataset ? correlationMatrix(dataset) : { columns: [], matrix: [] as number[][] }), [dataset]);

  function remember(d: Dataset) {
    try {
      const raw = localStorage.getItem("analystai-recent");
      const list: { id: string; name: string; rows: number; cols: number; createdAt: string }[] = raw ? JSON.parse(raw) : [];
      const next = [{ id: d.id, name: d.name, rows: d.rowCount, cols: d.columns.length, createdAt: d.createdAt }, ...list].slice(0, 8);
      localStorage.setItem("analystai-recent", JSON.stringify(next));
    } catch {}
  }

  function adoptDataset(d: Dataset) {
    setDataset(d);
    setTab("overview");
    setMessages([]);
    setAppliedFixes(0);
    remember(d);
  }

  function handleLoaded(d: Dataset) {
    adoptDataset(d);
  }

  /** Parse the brief into an intent and route the analyzer to the result. */
  function runAnalyze() {
    const text = brief.trim();
    if (!text) return;
    let ds = dataset;
    if (!ds) {
      // Nothing connected yet: pick the sample that best fits the prompt so the
      // relevant visuals actually render — reviews for sentiment/keyword/text
      // prompts (they need a text column), revenue otherwise.
      const wantsText = /\b(sentiment|feedback|review|reviews|opinion|nps|satisfaction|keyword|keywords|theme|themes|word)\b/i.test(text);
      ds = wantsText ? buildSampleReviewsDataset() : buildSampleDataset();
      adoptDataset(ds);
    }
    const parsed = parseBrief(text, ds);
    setIntent(parsed);
    if (parsed) setTab(parsed.primaryTab as TabId);
  }

  /** Clear the active focus so sections revert to the default analysis. */
  function clearFocus() {
    setIntent(null);
  }

  function handleApplyFix(q: QualityIssue) {
    if (!dataset) return;
    setDataset(applyFix(dataset, q));
    setAppliedFixes((n) => n + 1);
  }
  function handleApplyAll() {
    if (!dataset) return;
    let next = dataset;
    for (const q of quality) next = applyFix(next, q);
    setDataset(next);
    setAppliedFixes((n) => n + quality.length);
  }

  async function sendMessage(text: string) {
    if (!dataset) return;
    const userMsg = makeMessage("user", text);
    setMessages((m) => [...m, userMsg]);
    setThinking(true);

    // A chat prompt re-focuses the whole analysis: parse it into an intent
    // and set it so every section (EDA, Advanced, Forecast…) re-derives.
    const parsed = parseBrief(text, dataset);
    if (parsed) setIntent(parsed);
    const focus = parsed ?? intent ?? null;

    // Local deterministic answer — instant, and the fallback if Groq is unavailable.
    const scopedInsights = generateInsights(dataset, { metric: focus?.metric, category: focus?.groupBy });
    const scopedForecast =
      runForecast(dataset, { valueColumn: focus?.metric, period: focus?.period, horizon: focus?.horizon }) ?? undefined;
    const local = answerQuestion(text, {
      dataset,
      profile: profile ?? undefined,
      insights: scopedInsights,
      forecast: scopedForecast,
      history: [...messages, userMsg],
      intent: focus,
    });

    // Prefer Groq (LLM-authored prose grounded in the computed context); fall back to local.
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: "chat",
          dataset,
          question: text,
          intent: focus,
          includeInsights: true,
          includeForecast: true,
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as { text?: string; provider?: string };
        const answer = data.text?.trim();
        if (answer) {
          setMessages((m) => [...m, makeMessage("analyst", answer, local.citations)]);
          setThinking(false);
          return;
        }
      }
    } catch {
      // network/LLM error → fall through to the local answer
    }
    setMessages((m) => [...m, makeMessage("analyst", local.text, local.citations)]);
    setThinking(false);
  }

  if (!dataset) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 lg:px-8">
        <Header />
        <div className="mt-6 space-y-4">
          <DataUpload onLoaded={handleLoaded} />
          <BriefBar
            brief={brief}
            onBriefChange={setBrief}
            onAnalyze={runAnalyze}
            intent={intent}
            onClearFocus={clearFocus}
            onJumpTab={(id) => setTab(id as TabId)}
            ctaLabel="Analyze with sample"
            placeholder="Describe what you want to learn, then load data or hit Analyze to try it on the sample."
          />
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "overview" as TabId, label: "Overview", icon: <ScanSearch size={14} />, badge: quality.length || undefined },
    { id: "insights" as TabId, label: "Insights", icon: <Lightbulb size={14} />, badge: insights.length || undefined },
    { id: "eda" as TabId, label: "EDA", icon: <BarChart3 size={14} /> },
    { id: "advanced" as TabId, label: "Advanced", icon: <Layers size={14} />, badge: [sentiment, pareto, cohort, keywords].filter(Boolean).length || undefined },
    { id: "chat" as TabId, label: "Chat", icon: <Bot size={14} />, badge: messages.length || undefined },
    { id: "forecast" as TabId, label: "Forecast", icon: <TrendingUp size={14} /> },
    { id: "dashboard" as TabId, label: "Dashboard", icon: <LayoutDashboard size={14} /> },
    { id: "report" as TabId, label: "Report", icon: <FileText size={14} /> },
    { id: "kpi" as TabId, label: "KPI Builder", icon: <Calculator size={14} />, badge: savedKpis.length || undefined },
    { id: "data" as TabId, label: "Data", icon: <Table2 size={14} /> },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="eyebrow">// analysis session</div>
          <h1 className="mt-0.5 flex items-center gap-2 truncate text-xl font-bold text-ink">
            {dataset.name}
            <Badge tone="cyan">{dataset.rowCount.toLocaleString()} rows</Badge>
            <Badge tone="purple">{dataset.columns.length} cols</Badge>
            {appliedFixes > 0 && <Badge tone="green"><Check size={11} /> {appliedFixes} fixes</Badge>}
          </h1>
        </div>
        <Button variant="outline" size="sm" onClick={() => { setDataset(null); setMessages([]); setIntent(null); }}>
          <RefreshCw size={13} /> New dataset
        </Button>
      </div>

      <div className="mt-5">
        <BriefBar brief={brief} onBriefChange={setBrief} onAnalyze={runAnalyze} intent={intent} onClearFocus={clearFocus} onJumpTab={(id) => setTab(id as TabId)} ctaLabel="Analyze" />
      </div>

      <div className="mt-5">
        <Tabs tabs={tabs} value={tab} onChange={(id) => setTab(id as TabId)} />
      </div>

      <div className="mt-5">
        {tab === "overview" && profile && (
          <ProfileView dataset={dataset} profile={profile} quality={quality} onApplyFix={handleApplyFix} onApplyAll={handleApplyAll} intent={intent} />
        )}
        {tab === "insights" && <InsightsView insights={insights} intent={intent} />}
        {tab === "eda" && <EDAView dataset={dataset} correlation={corr} intent={intent} />}
        {tab === "advanced" && (
          <AdvancedView
            dataset={dataset}
            sentiment={sentiment}
            pareto={pareto}
            cohort={cohort}
            keywords={keywords}
            intent={intent}
            onLoadReviews={() => adoptDataset(buildSampleReviewsDataset())}
          />
        )}
        {tab === "chat" && <ChatView messages={messages} onSend={sendMessage} thinking={thinking} intent={intent} onJumpTab={(id) => setTab(id as TabId)} />}
        {tab === "forecast" && <ForecastView dataset={dataset} intent={intent} />}
        {tab === "dashboard" && <DashboardView dataset={dataset} insights={insights} forecast={forecast} savedKpis={savedKpis} intent={intent} />}
        {tab === "report" && <ReportView dataset={dataset} insights={insights} forecast={forecast} intent={intent} />}
        {tab === "kpi" && (
          <KpiBuilder
            dataset={dataset}
            saved={savedKpis}
            onSave={(k) => setSavedKpis((s) => [...s.filter((x) => x.id !== k.id), { ...k, id: uid("kpi") }])}
            onRemove={(id) => setSavedKpis((s) => s.filter((x) => x.id !== id))}
            intent={intent}
          />
        )}
        {tab === "data" && <DataTable dataset={dataset} />}
      </div>

      {quality.length > 0 && tab !== "overview" && (
        <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2.5 rounded-xl border border-[color-mix(in_srgb,var(--amber)_40%,transparent)] bg-surface/90 px-3.5 py-2.5 text-xs text-[var(--amber)] backdrop-blur no-print">
          <AlertTriangle size={14} />
          <span>{quality.length} data-quality issue{quality.length === 1 ? "" : "s"} ·</span>
          <button onClick={() => setTab("overview")} className="font-medium underline-offset-2 hover:underline">review</button>
        </div>
      )}
    </div>
  );
}

function Header() {
  return (
    <div>
      <div className="eyebrow">// analyzer</div>
      <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink">Analyze a dataset</h1>
      <p className="mt-1 text-sm text-muted">
        Upload a CSV or JSON, paste data, or load the sample. AnalystAI profiles, finds insights, forecasts, and writes the report instantly.
      </p>
    </div>
  );
}
