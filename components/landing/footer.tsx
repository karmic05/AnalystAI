import Link from "next/link";
import { BarChart3 } from "lucide-react";

const FOOTER_LINKS: { label: string; href: string }[] = [
  { label: "Product", href: "/product" },
  { label: "About", href: "/about" },
  { label: "Pricing", href: "/pricing" },
  { label: "Docs", href: "#" },
  { label: "Changelog", href: "#" },
  { label: "Security", href: "#" },
  { label: "Status", href: "#" },
];

export function LandingFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto max-w-7xl px-5 py-12">
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row">
          <div className="max-w-sm">
            <Link href="/" className="flex items-center gap-2.5 hover:opacity-80" aria-label="AnalystAI home">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand-gradient text-white shadow-sm">
                <BarChart3 size={16} />
              </div>
              <span className="font-display text-base font-bold tracking-tight text-ink">
                Analyst<span className="font-script text-gradient ml-0.5 text-xl leading-none">ai</span>
              </span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              The AI business analyst that turns a spreadsheet into a story. Built for operators,
              founders and analysts who need answers, not infrastructure.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-12 gap-y-2 font-mono text-xs text-muted sm:grid-cols-3">
            {FOOTER_LINKS.map((x) =>
              x.href === "#" ? (
                <a key={x.label} href="#" className="transition-colors hover:text-cyan">{x.label}</a>
              ) : (
                <Link key={x.label} href={x.href} className="transition-colors hover:text-cyan">{x.label}</Link>
              ),
            )}
          </div>
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-line pt-6 text-xs text-muted sm:flex-row">
          <span className="font-mono">© {new Date().getFullYear().toString()} AnalystAI · prototype build</span>
          <span className="font-script text-lg text-purple/90">— made for analysts</span>
        </div>
      </div>
    </footer>
  );
}
