import Link from "next/link";
import { Cloud, Database, FileText, Network, ArrowRight, type LucideIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import {
  CONNECTORS,
  BRAND_CATEGORIES,
  ingestConnectors,
  type Connector,
  type ConnectorCategory,
  type ConnectorStatus,
} from "@/lib/data/connectors";

const CATEGORY_META: Record<ConnectorCategory, { icon: LucideIcon; tone: string }> = {
  "Cloud & Warehouse": { icon: Cloud, tone: "var(--cyan)" },
  Database: { icon: Database, tone: "var(--purple)" },
  "Files & Collaboration": { icon: FileText, tone: "var(--green)" },
  "Enterprise & Streaming": { icon: Network, tone: "var(--amber)" },
  Ingest: { icon: FileText, tone: "var(--cyan)" },
};

export function DataSources() {
  const ingest = ingestConnectors();

  return (
    <section className="relative mx-auto max-w-7xl px-5 py-20">
      <SectionHead eyebrow="// data sources" title="Connect your data, wherever it lives." />
      <p className="mt-6 max-w-3xl text-base leading-relaxed text-muted">
        Bring data in from cloud warehouses, transactional databases, collaboration tools, and
        streaming platforms. Every connector feeds the same profiling pipeline, so the analysis
        engine never has to know where the rows came from.
      </p>

      {/* Available now */}
      <div className="mt-10">
        <CategoryHead icon={FileText} title="Available now" tone="var(--green)" />
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {ingest.map((c) => (
            <IngestChip key={c.id} c={c} />
          ))}
        </div>
      </div>

      {/* Brand connector catalog, grouped */}
      {BRAND_CATEGORIES.map((cat) => {
        const meta = CATEGORY_META[cat];
        const items = CONNECTORS.filter((c) => c.kind === "brand" && c.category === cat);
        if (!items.length) return null;
        return (
          <div className="mt-12" key={cat}>
            <CategoryHead icon={meta.icon} title={cat} tone={meta.tone} />
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((c) => (
                <ConnectorCard key={c.id} c={c} />
              ))}
            </div>
          </div>
        );
      })}

      <p className="mt-8 max-w-3xl text-sm leading-relaxed text-muted">
        This build ships the file and paste ingestors today. The connectors above are on the
        production roadmap, and each one maps to the same schema, profiler, and analysis engine.
      </p>

      {/* CTA */}
      <div className="panel mt-8 flex flex-col items-center gap-4 rounded-2xl p-8 text-center sm:flex-row sm:justify-between sm:text-left">
        <div>
          <h3 className="text-lg font-semibold text-ink">Need a source we did not list?</h3>
          <p className="mt-1 text-sm text-muted">
            The connector model is uniform. If it can expose rows, it can feed the engine.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <Link href="/studio/analyze" className={cn(buttonVariants({ variant: "ghost", size: "md" }))}>
            Try ingest now
          </Link>
          <a
            href="mailto:connectors@analystai.local?subject=Connector%20request"
            className={cn(buttonVariants({ variant: "accent", size: "md" }))}
          >
            Request a connector <ArrowRight size={16} />
          </a>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Pieces                                                             */
/* ------------------------------------------------------------------ */

function SectionHead({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="max-w-2xl">
      <div className="eyebrow">{eyebrow}</div>
      <h2 className="mt-4 text-3xl font-bold tracking-tight text-ink sm:text-4xl">{title}</h2>
    </div>
  );
}

function CategoryHead({ icon: Icon, title, tone }: { icon: LucideIcon; title: string; tone: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon size={18} style={{ color: tone }} />
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
    </div>
  );
}

function StatusPill({ status }: { status: ConnectorStatus }) {
  const dot = status === "available" ? "var(--green)" : "var(--text-faint)";
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line bg-surface-2 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider",
        status === "available" ? "text-neon" : "text-muted",
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: dot }} />
      {status === "available" ? "Available" : "Planned"}
    </span>
  );
}

function IngestChip({ c }: { c: Connector }) {
  return (
    <div className="neu rounded-xl p-4">
      <div className="flex items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-lg" style={{ background: `color-mix(in srgb, ${c.color} 14%, transparent)`, color: c.color }}>
          <c.logo size={16} title={c.name} />
        </span>
        <span className="text-sm font-semibold text-ink">{c.name}</span>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-muted">{c.blurb}</p>
    </div>
  );
}

function ConnectorCard({ c }: { c: Connector }) {
  return (
    <div className="panel card-hover group rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-8 min-w-0 items-center" style={{ color: c.color }}>
          <c.logo size={24} title={c.name} />
        </div>
        <StatusPill status={c.status} />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-ink">{c.name}</h3>
      <p className="mt-2 text-xs leading-relaxed text-muted">{c.blurb}</p>
    </div>
  );
}
