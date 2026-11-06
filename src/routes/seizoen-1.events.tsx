import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { PageShell, Reveal } from "@/components/page";
import { EVENTS, DAY, fmt, tm } from "@/components/Events";
import door from "@/assets/tl/door.png";
import skull from "@/assets/tl/skull.png";
import ice from "@/assets/tl/ice.png";
import nether from "@/assets/tl/nether.png";
import end from "@/assets/tl/end.png";
import heart from "@/assets/tl/heart.png";
import crown from "@/assets/tl/crown.png";

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
  "Server Open": door,
  "Verliezerseiland start": skull,
  "IJsmuur smelt": ice,
  "Nether open": nether,
  "End open": end,
  "Finale Verliezerseiland": heart,
  "Hoofdfinale": crown,
};

function EventArt({ title, className }: { title: string; className?: string }) {
  return <img src={ICON[title]} alt="" aria-hidden className={`milestone-art object-contain ${className ?? ""}`} />;
}

function StatusLine({ state, days }: { state: "done" | "live" | "soon"; days: number }) {
  if (state === "done") {
    return (
      <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Check className="size-4 text-success" strokeWidth={3} />
        Voltooid
      </p>
    );
  }
  if (state === "live") {
    return (
      <p className="mt-1 flex items-center gap-1.5 text-sm text-success">
        <span className="inline-block size-2.5 animate-pulse rounded-full bg-success" />
        Nu bezig
      </p>
    );
  }
  return <p className="mt-1 text-sm text-muted-foreground">Over {days} dag{days === 1 ? "" : "en"}</p>;
}

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
          <div className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2">
            <EventArt title={next.title} className="h-64 w-64 opacity-[0.08]" />
          </div>
          <div className="relative">
            <div className="mx-auto grid size-20 place-items-center border-4 border-border bg-background/70">
              <EventArt title={next.title} className="size-12" />
            </div>
            <p className="mt-3 font-pixel text-xs uppercase tracking-widest text-secondary">Volgend event</p>
            <h2 className="mt-2 font-pixel text-4xl text-primary md:text-5xl">{next.title}</h2>
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
                <span className={`absolute -left-[3.05rem] top-4 grid size-10 place-items-center border-4 bg-background ${done ? "border-muted grayscale" : main ? "border-primary" : "border-secondary"} ${isNext || live ? "animate-pulse" : ""}`}>
                  <EventArt title={e.title} className="size-6" />
                </span>
                <div className={`block-card card-hover p-5 ${done ? "opacity-50" : ""} ${isNext ? "border-primary" : ""} ${live ? "ring-2 ring-success" : ""}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-pixel uppercase tracking-widest text-muted-foreground">{fmt(new Date(e.at))} · {tm(new Date(e.at))}</span>
                    <span className={`border-2 px-2 py-0.5 font-pixel ${main ? "border-primary text-primary" : "border-secondary text-secondary"}`}>{main ? "Hoofdeiland" : "Verliezerseiland"}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <EventArt title={e.title} className="size-9 shrink-0" />
                    <p className="font-pixel text-2xl">{e.title}</p>
                  </div>
                  {now !== null && <StatusLine state={done ? "done" : live ? "live" : "soon"} days={days} />}
                </div>
              </li>
            </Reveal>
          );
        })}
      </ol>
    </PageShell>
  );
}
