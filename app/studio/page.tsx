"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FlaskConical, ArrowRight, FileText, Database, Sparkles, TrendingUp,
  CheckCircle2, Clock, Upload,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Stat } from "@/components/ui/stat";
import { Panel, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface RecentItem { id: string; name: string; rows: number; cols: number; createdAt: string }

export default function StudioHome() {
  const [recent, setRecent] = useState<RecentItem[]>([]);
  const [profile, setProfile] = useState<{ name: string; plan: string; credits: number } | null>(null);

  useEffect(() => {
    try {
      setRecent(JSON.parse(localStorage.getItem("analystai-recent") || "[]"));
      const p = JSON.parse(localStorage.getItem("analystai-profile") || "null");
      if (p) setProfile(p);
    } catch {}
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <div className="flex flex-col gap-1">
        <div className="font-mono text-xs uppercase tracking-[0.2em] text-cyan/80">// workspace home</div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">
          Welcome back{profile ? `, ${profile.name}` : ""}.
        </h1>
        <p className="text-sm text-muted">Drop a file and let the analyst go to work.</p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Credits" value={profile?.credits.toLocaleString() ?? "N/A"} sub="AI usage this cycle" tone="amber" />
        <Stat label="Plan" value={profile?.plan ?? "N/A"} sub="renews monthly" tone="cyan" />
        <Stat label="Datasets" value={recent.length} sub="in this workspace" tone="purple" />
        <Stat label="Reports" value={recent.length ? recent.length : 0} sub="generated" tone="green" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="neu-inset grid h-12 w-12 place-items-center rounded-xl">
                <FlaskConical className="text-cyan" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-ink">Start a new analysis</h2>
                <p className="text-sm text-muted">Upload CSV/JSON, paste data, or load the sample SaaS revenue dataset.</p>
              </div>
              <Link href="/studio/analyze" className={cn(buttonVariants({ variant: "accent" }))}>
                Open analyzer <ArrowRight size={15} />
              </Link>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {[
                { icon: Upload, t: "Upload a file", d: "CSV or JSON" },
                { icon: Database, t: "Load sample", d: "SaaS revenue" },
                { icon: Sparkles, t: "Ask the analyst", d: "Plain English" },
              ].map((q) => (
                <Link key={q.t} href="/studio/analyze" className="neu group rounded-xl p-4 transition-transform hover:-translate-y-0.5">
                  <q.icon size={18} className="text-cyan" />
                  <div className="mt-2 text-sm font-medium text-ink">{q.t}</div>
                  <div className="text-xs text-muted">{q.d}</div>
                </Link>
              ))}
            </div>
          </CardBody>
        </Panel>

        <Panel>
          <CardBody>
            <h3 className="prompt text-sm font-semibold">activity</h3>
            <ul className="mt-4 space-y-3">
              {[
                { icon: CheckCircle2, c: "var(--green)", t: "Report generated", s: "sample_saas_revenue.csv", a: "2m ago" },
                { icon: TrendingUp, c: "var(--cyan)", t: "Forecast updated", s: "6-month horizon", a: "2m ago" },
                { icon: FileText, c: "var(--purple)", t: "Insights refreshed", s: "10 findings", a: "2m ago" },
                { icon: Clock, c: "var(--amber)", t: "Workspace created", s: "free tier", a: "today" },
              ].map((x, i) => (
                <li key={i} className="flex items-start gap-3">
                  <x.icon size={15} style={{ color: x.c }} className="mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-ink">{x.t}</div>
                    <div className="truncate font-mono text-[11px] text-muted">{x.s}</div>
                  </div>
                  <span className="font-mono text-[10px] text-muted">{x.a}</span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Panel>
      </div>

      <Panel className="mt-4">
        <CardBody>
          <div className="flex items-center justify-between">
            <h3 className="prompt text-sm font-semibold">recent uploads</h3>
            <Badge tone="cyan">{recent.length}</Badge>
          </div>
          {recent.length === 0 ? (
            <div className="mt-4 flex flex-col items-center justify-center rounded-xl border border-dashed border-line py-12 text-center">
              <Database size={26} className="text-muted" />
              <p className="mt-3 text-sm text-muted">No datasets yet.</p>
              <Link href="/studio/analyze" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-4")}>
                Analyze your first dataset
              </Link>
            </div>
          ) : (
            <div className="mt-4 overflow-hidden rounded-xl border border-line">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-2/60 font-mono text-[11px] uppercase tracking-wider text-muted">
                  <tr>
                    <th className="px-4 py-2.5">Name</th>
                    <th className="px-4 py-2.5">Rows</th>
                    <th className="px-4 py-2.5">Cols</th>
                    <th className="px-4 py-2.5">When</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {recent.map((r) => (
                    <tr key={r.id} className="hover:bg-surface-2/40">
                      <td className="px-4 py-2.5 font-mono text-ink">{r.name}</td>
                      <td className="px-4 py-2.5 text-muted">{r.rows.toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-muted">{r.cols}</td>
                      <td className="px-4 py-2.5 font-mono text-[11px] text-muted">{new Date(r.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Panel>
    </div>
  );
}
