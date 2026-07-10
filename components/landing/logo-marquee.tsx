import type { CSSProperties } from "react";
import { brandConnectors } from "@/lib/data/connectors";

/**
 * Infinite scrolling strip of data-source provider logos. Renders on every
 * landing page via the (landing) layout. Pure CSS animation (no JS), pauses on
 * hover, and honors prefers-reduced-motion. The track is duplicated so the
 * translateX(-50%) loop is seamless.
 */
export function LogoMarquee() {
  const brands = brandConnectors();

  return (
    <section aria-label="Supported data sources" className="border-y border-line bg-surface/30">
      <div className="mx-auto max-w-7xl px-5 py-8">
        <div className="mb-5 text-center font-mono text-xs uppercase tracking-[0.2em] text-muted">
          Connects to your data, wherever it lives
        </div>

        <div className="logo-marquee">
          <div className="logo-marquee__track">
            {[0, 1].map((rep) => (
              <div className="logo-marquee__group" key={rep} aria-hidden={rep === 1}>
                {brands.map((c) => (
                  <span
                    key={`${c.id}-${rep}`}
                    className="logo-marquee__item"
                    style={{ "--brand": c.color } as CSSProperties}
                  >
                    <c.logo size={26} title={c.name} />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
