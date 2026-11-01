import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { T } from "@/lib/cms";

export function Reveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e?.isIntersecting) { el.classList.add("reveal-in"); io.disconnect(); } },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`reveal ${className}`} style={{ "--reveal-delay": `${delay}ms` } as CSSProperties}>
      {children}
    </div>
  );
}

export function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="site-section mx-auto max-w-6xl scroll-mt-24 px-5 py-12 sm:py-16 lg:py-20">
      <Reveal>
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4 sm:mb-10">
          <h2 className="text-3xl font-bold text-primary md:text-4xl"><T k={`section.${id}.title`} def={title} /></h2>
        </div>
      </Reveal>
      {children}
    </section>
  );
}

/** A normal sub page: the top bar, a big title and the content. */
export function PageShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <SiteLayout>
      <div className="mx-auto max-w-6xl px-5 pb-20 pt-28 sm:pt-32">
        <div className="pop-in mb-10 text-center">
          <h1 className="font-pixel text-4xl font-bold text-primary md:text-5xl"><T k={`page.${path}.title`} def={title} /></h1>
          {subtitle && <p className="mt-3 text-muted-foreground"><T k={`page.${path}.subtitle`} def={subtitle} /></p>}
        </div>
        {children}
      </div>
    </SiteLayout>
  );
}
