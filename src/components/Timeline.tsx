import { useEffect, useState } from "react";
import door from "@/assets/tl/door.png";
import ice from "@/assets/tl/ice.png";
import nether from "@/assets/tl/nether.png";
import end from "@/assets/tl/end.png";
import crown from "@/assets/tl/crown.png";
import skull from "@/assets/tl/skull.png";
import heart from "@/assets/tl/heart.png";

type Milestone = { date: string; day: string; title: string; icon: string; group: "seizoen" | "eiland" };

const season: Milestone[] = [
  { date: "2026-11-07T14:00:00+01:00", day: "7 nov", title: "Server open", icon: door, group: "seizoen" },
  { date: "2026-11-13T12:00:00+01:00", day: "13 nov", title: "IJsmuur smelt", icon: ice, group: "seizoen" },
  { date: "2026-11-14T12:00:00+01:00", day: "14 nov", title: "Nether open", icon: nether, group: "seizoen" },
  { date: "2026-11-15T12:00:00+01:00", day: "15 nov", title: "End open", icon: end, group: "seizoen" },
  { date: "2026-11-21T18:00:00+01:00", day: "21 nov", title: "Hoofdfinale", icon: crown, group: "seizoen" },
];

const island: Milestone[] = [
  { date: "2026-11-11T12:00:00+01:00", day: "11 nov", title: "Verliezers-eiland start", icon: skull, group: "eiland" },
  { date: "2026-11-18T12:00:00+01:00", day: "18 nov", title: "Finale Verliezers-eiland", icon: heart, group: "eiland" },
];

const start = new Date(season[0]!.date).getTime();
const finish = new Date(season[season.length - 1]!.date).getTime();
const position = (date: string) => Math.min(100, Math.max(0, ((new Date(date).getTime() - start) / (finish - start)) * 100));

function EventLabel({ event, now, align = "center", row = "above" }: { event: Milestone; now: number | null; align?: "left" | "center" | "right"; row?: "above" | "below" }) {
  const remaining = now === null ? null : Math.ceil((new Date(event.date).getTime() - now) / 86_400_000);
  const isFinale = event.title.includes("Finale");
  const anchor = align === "left" ? "translateX(0)" : align === "right" ? "translateX(-100%)" : "translateX(-50%)";
  return (
    <div className={`absolute z-10 flex h-[92px] w-28 flex-col items-center justify-center gap-1 rounded-md border bg-card/95 px-2 py-1.5 text-center shadow-[0_4px_14px_-5px_oklch(0.05_0.03_300/0.8)] backdrop-blur-sm ${event.group === "eiland" ? "border-secondary/55" : "border-primary/50"} ${isFinale ? "border-gold/80" : ""}`} style={{ left: 0, top: row === "above" ? "0px" : "124px", transform: anchor }}>
      <img src={event.icon} alt="" className={`milestone-art object-contain ${event.title === "Server open" || event.title === "Finale Verliezers-eiland" ? "h-7 w-7" : "h-6 w-6"}`} />
      <time dateTime={event.date} className={`font-pixel text-[11px] font-bold ${isFinale ? "text-gold" : event.group === "eiland" ? "text-secondary" : "text-primary"}`}>{event.day}</time>
      <span className="font-pixel text-[11px] leading-tight">{event.title}</span>
      <span className="text-[9px] leading-none text-muted-foreground">
        {remaining === null ? "" : remaining < 0 ? "Voorbij" : remaining === 0 ? "Vandaag" : `Over ${remaining}d`}
      </span>
    </div>
  );
}

function RailMarker({ event, now, row }: { event: Milestone; now: number | null; row: "above" | "below" }) {
  const left = position(event.date);
  const align = left < 4 ? "left" : left > 96 ? "right" : "center";
  const lineTop = row === "above" ? 92 : 112;
  const lineHeight = 12;
  return (
    <div className="absolute inset-y-0 w-0">
      <span className={`absolute left-0 z-[1] w-px ${event.group === "eiland" ? "bg-secondary/75" : "bg-primary/75"}`} style={{ top: lineTop, height: lineHeight }} aria-hidden="true" />
      <span className={`absolute left-[-6px] top-[101px] z-[2] h-3 w-3 rounded-full border-2 border-background ${event.group === "eiland" ? "bg-secondary" : "bg-primary"}`} aria-hidden="true" />
      <EventLabel event={event} now={now} align={align} row={row} />
    </div>
  );
}

function DesktopRail({ events, now, kind }: { events: Milestone[]; now: number | null; kind: "seizoen" | "eiland" }) {
  const isIsland = kind === "eiland";
  const railStart = isIsland ? position(island[0]!.date) : 0;
  const railEnd = isIsland ? position(island[island.length - 1]!.date) : 100;
  const progress = now === null ? 0 : position(new Date(now).toISOString());
  const fill = isIsland ? Math.max(0, Math.min(100, ((progress - railStart) / (railEnd - railStart)) * 100)) : progress;
  return (
    <div className="relative hidden h-[236px] lg:block" role="list" aria-label={isIsland ? "Mijlpalen van Verliezers-eiland" : "Mijlpalen van seizoen 1"}>
      <span className={`absolute top-[104px] h-2 rounded-full ${isIsland ? "bg-secondary/20" : "bg-primary/20"}`} style={{ left: `${railStart}%`, width: `${railEnd - railStart}%` }} aria-hidden="true" />
      <span className={`absolute top-[104px] h-2 rounded-full ${isIsland ? "bg-secondary" : "bg-gradient-to-r from-primary to-secondary"}`} style={{ left: `${railStart}%`, width: `${(railEnd - railStart) * fill / 100}%` }} aria-hidden="true" />
      {events.map((event, index) => (
        <div key={event.title} role="listitem" className="absolute inset-y-0 w-0" style={{ left: `${position(event.date)}%` }}>
          <RailMarker event={event} now={now} row={isIsland ? (index === 0 ? "above" : "below") : (index % 2 === 0 ? "above" : "below")} />
        </div>
      ))}
      <div className="absolute inset-x-0 top-[118px] flex justify-between font-pixel text-[10px] uppercase tracking-widest text-muted-foreground" aria-hidden="true">
        <span>7 nov</span><span>21 nov</span>
      </div>
    </div>
  );
}

function MobileEvents({ now }: { now: number | null }) {
  const events = [...season, ...island].sort((a, b) => +new Date(a.date) - +new Date(b.date));
  return (
    <ol className="relative space-y-3 pl-7 before:absolute before:bottom-5 before:left-3 before:top-5 before:w-1 before:rounded-full before:bg-gradient-to-b before:from-primary before:to-secondary lg:hidden">
      {events.map((event) => {
        const remaining = now === null ? null : Math.ceil((new Date(event.date).getTime() - now) / 86_400_000);
        const isFinale = event.title.includes("Finale");
        return (
          <li key={event.title} className={`relative flex min-h-20 items-center gap-3 border-2 bg-card p-3 shadow-[3px_3px_0_0_oklch(0.1_0.04_300)] before:absolute before:-left-[23px] before:top-1/2 before:h-3 before:w-3 before:-translate-y-1/2 before:rounded-full before:border-2 before:border-background ${event.group === "eiland" ? "border-secondary/50 before:bg-secondary" : "border-primary/40 before:bg-primary"} ${isFinale ? "border-gold/70" : ""}`}>
            <div className="flex w-[58px] shrink-0 items-center justify-center border-r border-border pr-2 text-center">
              <time dateTime={event.date} className={`whitespace-nowrap font-pixel text-xs font-bold ${isFinale ? "text-gold" : event.group === "eiland" ? "text-secondary" : "text-primary"}`}>{event.day}</time>
            </div>
            <span className="relative flex h-9 w-9 shrink-0 items-center justify-center">
              <img src={event.icon} alt="" className={`milestone-art absolute left-1/2 top-1/2 max-w-none -translate-x-1/2 -translate-y-1/2 object-contain ${event.title === "Server open" || event.title === "Finale Verliezers-eiland" ? "h-11 w-11" : "h-9 w-9"}`} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-pixel text-sm leading-tight">{event.title}</p>
              <span className="mt-1 block text-xs text-muted-foreground">{remaining === null ? "" : remaining < 0 ? "Voorbij" : remaining === 0 ? "Vandaag" : `Over ${remaining} dagen`}</span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function Timeline() {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const update = () => setNow(Date.now());
    update();
    const timer = window.setInterval(update, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="block-card overflow-hidden">
      <div className="relative overflow-hidden bg-gradient-to-r from-primary via-primary/90 to-secondary px-5 py-6 sm:px-7">
        <div className="pointer-events-none absolute -right-8 -top-12 size-40 rounded-full border-[18px] border-white/10" />
        <div className="pointer-events-none absolute -right-1 top-7 size-16 rounded-full border-[8px] border-white/10" />
        <p className="font-pixel text-xs uppercase tracking-[0.2em] text-primary-foreground/80">LowkeySMP · 2026</p>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-2">
          <h3 className="text-2xl font-bold text-primary-foreground sm:text-3xl">Seizoen 1</h3>
          <p className="font-pixel text-sm text-primary-foreground">7 – 21 november</p>
        </div>
      </div>

      <div className="space-y-6 p-4 sm:p-6">
        <section aria-label="Seizoen 1">
          <h4 className="mb-2 font-pixel text-lg font-bold text-primary">Seizoen 1</h4>
          <DesktopRail events={season} now={now} kind="seizoen" />
        </section>

        <section className="border-t border-dashed border-border pt-4" aria-label="Verliezers-eiland">
          <h4 className="mb-2 font-pixel text-lg font-bold text-secondary">Verliezers-eiland</h4>
          <DesktopRail events={island} now={now} kind="eiland" />
        </section>

        <MobileEvents now={now} />
      </div>
    </div>
  );
}
