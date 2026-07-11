"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Bot, User, Sparkles } from "lucide-react";
import type { ChatMessage } from "@/lib/types";
import type { AnalysisIntent } from "@/lib/analysis/intent";
import { SUGGESTED_PROMPTS } from "@/lib/analysis/chat";
import { Panel } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const REFLECTED_TABS = ["insights", "eda", "advanced", "forecast", "kpi", "dashboard"] as const;

export function ChatView({
  messages,
  onSend,
  thinking,
  intent,
  onJumpTab,
}: {
  messages: ChatMessage[];
  onSend: (text: string) => void;
  thinking: boolean;
  intent?: AnalysisIntent | null;
  onJumpTab?: (id: string) => void;
}) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasFocus = !!intent && (!!intent.metric || !!intent.groupBy || intent.analyses.length > 0);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking, hasFocus]);

  function submit() {
    const t = input.trim();
    if (!t || thinking) return;
    onSend(t);
    setInput("");
  }

  return (
    <Panel className="flex h-[620px] flex-col overflow-hidden rounded-2xl">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg" style={{ background: "color-mix(in srgb, var(--green) 14%, transparent)", color: "var(--green)" }}>
            <Bot size={15} />
          </span>
          <div>
            <div className="prompt text-sm font-semibold">analyst</div>
            <div className="font-mono text-[10px] text-muted">context-aware · grounded in your data</div>
          </div>
        </div>
        <span className="font-mono text-[10px] text-muted">{messages.length} msgs</span>
      </div>

      {hasFocus && onJumpTab && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-line bg-green/5 px-4 py-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-green">▸ reflected across</span>
          {REFLECTED_TABS.map((id) => (
            <button
              key={id}
              onClick={() => onJumpTab(id)}
              className="font-mono text-[11px] text-cyan capitalize transition-colors hover:underline"
            >
              {id === "kpi" ? "KPI" : id}
            </button>
          ))}
        </div>
      )}

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl" style={{ background: "color-mix(in srgb, var(--green) 14%, transparent)", color: "var(--green)" }}>
              <Sparkles size={20} />
            </div>
            <p className="text-sm text-ink">Ask your data anything.</p>
            <p className="mt-1 max-w-xs text-xs text-muted">Answers use the real numbers from your dataset — and every prompt re-focuses EDA, Insights, Forecast and KPI too.</p>
            <div className="mt-4 flex max-w-md flex-wrap justify-center gap-2">
              {intent?.brief && (
                <button
                  onClick={() => onSend(intent.brief)}
                  className="btn-neu-accent rounded-lg px-3 py-1.5 text-xs"
                >
                  Ask your brief
                </button>
              )}
              {SUGGESTED_PROMPTS.slice(0, 4).map((p) => (
                <button key={p} onClick={() => onSend(p)} className="btn-neu rounded-lg px-3 py-1.5 font-mono text-xs text-muted hover:text-green">
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className={cn("flex gap-3", m.role === "user" && "flex-row-reverse")}>
            <div className={cn("neu-sm grid h-8 w-8 shrink-0 place-items-center rounded-lg", m.role === "user" ? "text-purple" : "text-green")}>
              {m.role === "user" ? <User size={15} /> : <Bot size={15} />}
            </div>
            <div className={cn("max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed", m.role === "user" ? "neu-inset text-ink" : "neu text-muted")}>
              <div className="whitespace-pre-wrap">{m.content}</div>
              {m.citations && m.citations.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1.5 border-t border-line pt-2.5">
                  {m.citations.map((c, i) => (
                    <span key={i} className="rounded bg-surface-3/60 px-2 py-0.5 font-mono text-[10px] text-muted">
                      {c.label}: <span className="text-cyan">{c.value}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {thinking && (
          <div className="flex gap-3">
            <div className="neu-sm grid h-8 w-8 place-items-center rounded-lg text-green"><Bot size={15} /></div>
            <div className="neu rounded-2xl px-4 py-3 text-sm text-muted">
              <span className="cursor">analyzing</span>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-line p-3">
        <div className="neu-inset flex items-end gap-2 rounded-xl p-2">
          <span className="prompt mb-1.5 select-none px-1 font-mono text-sm text-green">&gt;_</span>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
            placeholder="ask: why did revenue drop? which segment is best? predict next month…"
            rows={1}
            className="font-mono max-h-28 flex-1 resize-none bg-transparent px-1 py-1.5 text-sm text-ink outline-none placeholder:text-muted"
          />
          <Button variant="accent" size="sm" onClick={submit} disabled={thinking || !input.trim()} className="mb-0.5">
            <Send size={14} /> Send
          </Button>
        </div>
        <p className="mt-1.5 px-1 font-mono text-[10px] text-muted">Enter to send · Shift+Enter for newline · answers computed locally by default</p>
      </div>
    </Panel>
  );
}
