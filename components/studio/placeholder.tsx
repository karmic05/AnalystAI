import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { ArrowRight, Hammer } from "lucide-react";
import { Panel, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

export function StudioPlaceholder({
  title,
  blurb,
  icon: Icon,
  roadmap,
}: {
  title: string;
  blurb: string;
  icon: LucideIcon;
  roadmap: string[];
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 lg:px-8">
      <div className="eyebrow">// {title.toLowerCase()}</div>
      <h1 className="mt-1 flex items-center gap-3 text-2xl font-bold text-ink">
        <span className="grid h-10 w-10 place-items-center rounded-xl" style={{ background: "color-mix(in srgb, var(--cyan) 13%, transparent)", color: "var(--cyan)" }}><Icon size={18} /></span>
        {title}
      </h1>
      <p className="mt-2 text-sm text-muted">{blurb}</p>

      <Panel className="mt-6">
        <CardBody>
          <div className="flex items-center gap-2">
            <Hammer size={15} className="text-amber" />
            <span className="prompt text-sm font-semibold">on the roadmap</span>
            <Badge tone="amber">prototype</Badge>
          </div>
          <ul className="mt-4 space-y-2.5">
            {roadmap.map((r) => (
              <li key={r} className="flex items-start gap-2.5 text-sm text-muted">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber" />
                {r}
              </li>
            ))}
          </ul>
          <p className="mt-5 text-xs text-muted">
            This prototype focuses on the core analyst loop: upload → analyze → insights → forecast → report.
            Everything below is scaffolded in the architecture but not yet wired in this build.
          </p>
          <Link href="/studio/analyze" className={cn(buttonVariants({ variant: "accent", size: "sm" }), "mt-5")}>
            Back to the analyzer <ArrowRight size={14} />
          </Link>
        </CardBody>
      </Panel>
    </div>
  );
}
