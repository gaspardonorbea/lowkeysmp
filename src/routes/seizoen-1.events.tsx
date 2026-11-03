import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageShell, Reveal } from "@/components/page";
import { EVENTS, DAY, fmt, tm } from "@/components/Events";

export const Route = createFileRoute("/seizoen-1/events")({
  head: () => ({
    meta: [
      { title: "Events — LowkeySMP" },
      { name: "description", content: "Alle events van seizoen 1 met datum, uur en live countdown." },
      { property: "og:title", content: "Events — LowkeySMP" },
      { property: "og:description", content: "Alle events van seizoen 1 met datum, uur en live countdown." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EventsPage,
});

const ICON: Record<string, string> = {
  "Server Open": "🚪", "Verliezerseiland start": "💀", "IJsmuur smelt": "🧊",
  "Nether open": "🔥", "End open": "🌌", "Finale Verliezerseiland": "⚔️", "Hoofdfinale": "👑",
};

function EventsPage() {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => { setNow(Date.now()); const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const n = now ?? 0;
  const next = now === null ? undefined : EVENTS.find((e) => new Date(e.at).getTime() > n);
  const left = next ? new Date(next.at).getTime() - n : 0;
  const parts = [Math.floor(left / DAY), Math.floor(left / 3600000) % 24, Math.floor(left / 60000) % 60, Math.floor(left / 1000) % 60];
  const start = new Date(EVENTS[0]!.at).getTime();
  const end = new Date(EVENTS[EVENTS.length - 1]!.at).getTime();
  const progress = now === null ? 0 : Math.min(100, Math.max(0, ((n - start) / (end - start)) * 100));

  return (
    <PageShell title="Events" subtitle="Alle mijlpalen van seizoen 1. Zet je wekker.">
      {next && (
        <div className="block-card pop-in relative mx-auto mb-12 max-w-3xl overflow-hidden border-primary p-8 text-center">
          <div className="pointer-events-none absolute -top-10 left-1/2 text-[10rem] opacity-10 -translate-x-1/2">{ICON[next.title]}</div>
          <p className="font-pixel text-xs uppercase tracking-widest text-secondary">Volgend event</p>
          <h2 className="mt-2 font-pixel text-4xl text-primary md:text-5xl">{ICON[next.title]} {next.title}</h2>
          <p className="mt-2 text-muted-foreground">{fmt(new Date(next.at))} · {tm(new Date(next.at))}</p>
          <div className="mt-6 flex justify-center gap-3 font-pixel">
            {parts.map((v, i) => (
              <span key={i} className="min-w-16 border-2 border-border bg-background/60 px-3 py-2">
                <span className="block text-3xl text-foreground md:text-4xl">{String(v).padStart(2, "0")}</span>
                <span className="text-[10px] uppercase text-muted-foreground">{["dagen", "uur", "min", "sec"][i]}</span>
              </span>
            ))}
          </div>
          <div className="mt-6 h-3 border-2 border-border bg-background">
            <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Seizoen {Math.round(progress)}% voltooid</p>
        </div>
      )}

      <ol className="relative mx-auto max-w-3xl border-l-4 border-border pl-8">
        {EVENTS.map((e, i) => {
          const t = new Date(e.at).getTime();
          const done = now !== null && t + DAY <= n;
          const live = now !== null && t <= n && !done;
          const isNext = next?.at === e.at;
          const days = Math.ceil((t - n) / DAY);
          const main = e.island === "hoofd";
          return (
            <Reveal key={e.at} delay={i * 80}>
              <li className="relative mb-6">
                <span className={`absolute -left-[3.05rem] top-4 grid size-10 place-items-center border-4 bg-background text-lg ${done ? "border-muted grayscale" : main ? "border-primary" : "border-secondary"} ${isNext || live ? "animate-pulse" : ""}`}>{ICON[e.title]}</span>
                <div className={`block-card card-hover p-5 ${done ? "opacity-50" : ""} ${isNext ? "border-primary" : ""} ${live ? "ring-2 ring-success" : ""}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-pixel uppercase tracking-widest text-muted-foreground">{fmt(new Date(e.at))} · {tm(new Date(e.at))}</span>
                    <span className={`border-2 px-2 py-0.5 font-pixel ${main ? "border-primary text-primary" : "border-secondary text-secondary"}`}>{main ? "Hoofdeiland" : "Verliezerseiland"}</span>
                  </div>
                  <p className="mt-2 font-pixel text-2xl">{e.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {now === null ? "" : done ? "✔ Voltooid" : live ? "🟢 Nu bezig" : `Over ${days} dag${days === 1 ? "" : "en"}`}
                  </p>
                </div>
              </li>
            </Reveal>
          );
        })}
      </ol>
    </PageShell>
  );
}
