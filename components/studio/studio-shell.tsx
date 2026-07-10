"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3, LayoutDashboard, FlaskConical, FileText, Database, Settings,
  Bell, Search, LogOut, Sparkles, ChevronRight, Zap,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Kbd } from "@/components/ui/kbd";
import { cn } from "@/lib/utils";

interface Profile {
  name: string;
  email: string;
  plan: string;
  credits: number;
}

const STORE_KEY = "analystai-profile";

const NAV = [
  { href: "/studio", label: "Dashboard", icon: LayoutDashboard },
  { href: "/studio/analyze", label: "Analyze", icon: FlaskConical },
  { href: "/studio/reports", label: "Reports", icon: FileText },
  { href: "/studio/datasets", label: "Datasets", icon: Database },
  { href: "/studio/settings", label: "Settings", icon: Settings },
];

export function StudioShell({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ready, setReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) setProfile(JSON.parse(raw));
    } catch {}
    setReady(true);
  }, []);

  function signIn(p: Profile) {
    localStorage.setItem(STORE_KEY, JSON.stringify(p));
    setProfile(p);
  }

  function signOut() {
    localStorage.removeItem(STORE_KEY);
    setProfile(null);
    router.push("/");
  }

  if (!ready) {
    return <div className="grid min-h-screen place-items-center"><div className="skeleton h-6 w-40 rounded" /></div>;
  }
  if (!profile) return <AuthGate onSignIn={signIn} />;

  return <Shell profile={profile} onSignOut={signOut}>{children}</Shell>;
}

function Shell({ profile, onSignOut, children }: { profile: Profile; onSignOut: () => void; children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="flex min-h-screen bg-bg">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line bg-surface/40 lg:flex">
        <Link href="/" className="flex h-16 items-center gap-2.5 px-5 hover:opacity-80" aria-label="AnalystAI home">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand-gradient text-white shadow-sm">
            <BarChart3 size={16} />
          </div>
          <span className="font-display text-base font-bold tracking-tight text-ink">
            Analyst<span className="text-gradient">AI</span>
          </span>
        </Link>

        <div className="mx-3 mb-3 neu-inset rounded-xl px-3 py-2.5">
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted">workspace</div>
          <div className="mt-0.5 flex items-center justify-between text-sm text-ink">
            <span>{profile.name}&apos;s org</span>
            <ChevronRight size={14} className="text-muted" />
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {NAV.map((n) => {
            const active = pathname === n.href;
            return (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all",
                  active ? "bg-surface-2 text-cyan" : "text-muted hover:text-ink hover:bg-surface-2/50",
                )}
              >
                {active && <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-brand-gradient" />}
                <n.icon size={16} />
                {n.label}
              </Link>
            );
          })}
        </nav>

        <div className="m-3 neu rounded-xl p-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted">credits</span>
            <Zap size={12} className="text-amber" />
          </div>
          <div className="mt-1 font-mono text-lg font-semibold text-ink">{profile.credits.toLocaleString()}</div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-3">
            <div className="h-full w-3/4 rounded-full bg-brand-gradient" />
          </div>
          <div className="mt-2 text-[11px] text-muted">Plan: <span className="text-cyan">{profile.plan}</span></div>
        </div>

        <div className="border-t border-line p-3">
          <div className="flex items-center gap-2.5 rounded-xl px-2 py-2">
            <div className="grid h-8 w-8 place-items-center rounded-full bg-brand-gradient font-display text-xs font-bold text-white">
              {profile.name.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm text-ink">{profile.name}</div>
              <div className="truncate text-[11px] text-muted">{profile.email}</div>
            </div>
            <button onClick={onSignOut} aria-label="Sign out" className="btn-neu grid h-8 w-8 place-items-center rounded-lg text-muted hover:text-[var(--red)]">
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-bg/70 px-4 backdrop-blur-xl lg:px-6">
          <Link href="/" className="btn-neu grid h-9 w-9 place-items-center rounded-xl text-muted lg:hidden">
            <BarChart3 size={16} className="text-cyan" />
          </Link>
          <div className="hidden items-center gap-2 sm:flex">
            <span className="prompt font-mono text-sm text-muted">studio</span>
            <span className="text-muted">/</span>
            <span className="font-mono text-sm text-ink">{currentLabel(pathname)}</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button className="btn-neu hidden items-center gap-2 rounded-xl px-3 py-2 text-xs text-muted hover:text-ink md:flex">
              <Search size={14} />
              <span>Search</span>
              <Kbd className="ml-2">⌘K</Kbd>
            </button>
            <button className="btn-neu grid h-9 w-9 place-items-center rounded-xl text-muted hover:text-cyan" aria-label="Notifications">
              <Bell size={16} />
            </button>
            <ThemeToggle />
          </div>
        </header>

        <main className="min-w-0 flex-1 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}

function currentLabel(path: string): string {
  if (path === "/studio") return "dashboard";
  const seg = path.split("/").filter(Boolean).pop() ?? "";
  return seg;
}

function AuthGate({ onSignIn }: { onSignIn: (p: Profile) => void }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  function go(name: string, email: string, plan: string, credits: number) {
    setBusy(true);
    setTimeout(() => onSignIn({ name, email, plan, credits }), 350);
  }

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden p-5">
      <div className="absolute inset-0 grid-bg opacity-50" />
      <div className="absolute inset-0 radial-glow" />
      <div className="relative w-full max-w-md">
        <Link href="/" className="mb-6 flex items-center justify-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand-gradient text-white shadow-sm">
            <BarChart3 size={18} />
          </div>
          <span className="font-display text-lg font-bold tracking-tight text-ink">
            Analyst<span className="text-gradient">AI</span>
          </span>
        </Link>

        <div className="panel rounded-2xl p-7">
          <h1 className="text-xl font-semibold text-ink">Welcome to the Studio</h1>
          <p className="mt-1.5 text-sm text-muted">
            Sign in to save datasets and dashboards, or skip it and try the full analyst now.
          </p>

          <div className="mt-6 grid gap-2.5">
            <button
              onClick={() => go("Guest", "guest@analystai.local", "free", 1000)}
              disabled={busy}
              className="btn-neu-accent flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-medium"
            >
              <Sparkles size={15} /> Continue as guest, no signup
            </button>

            <div className="my-1 flex items-center gap-3 text-[11px] text-muted">
              <div className="h-px flex-1 bg-line" />
              <span className="font-mono uppercase tracking-widest">or</span>
              <div className="h-px flex-1 bg-line" />
            </div>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="neu-inset h-11 rounded-xl px-3.5 text-sm text-ink outline-none placeholder:text-muted focus:ring-2 focus:ring-cyan/40"
            />
            <button
              onClick={() => go(email.split("@")[0] || "Analyst", email || "analyst@local", "professional", 10000)}
              disabled={busy || !email}
              className="btn-neu flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-medium text-ink disabled:opacity-40"
            >
              Continue with email
            </button>

            <p className="mt-1 text-center text-[11px] text-muted">
              Demo auth, no password needed. Real OAuth (Google, Microsoft, SAML) is on the roadmap.
            </p>
          </div>
        </div>
        <p className="mt-4 text-center text-[11px] text-muted">
          By continuing you agree to the prototype terms. Your data stays in your browser.
        </p>
      </div>
    </div>
  );
}
