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

type TimelinePlayer = {
  id?: string;
  name: string;
  died_at?: string | null;
  death_cause?: string | null;
  death_location?: string | null;
  revived_at?: string | null;
};

type AvatarEvent = {
  date: string;
  day: string;
  kind: "death" | "revival";
  location: "season" | "island";
  players: TimelinePlayer[];
};

const timelineDayKey = (value: string) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Brussels",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(value));
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
};

const timelineDayLabel = (value: string) =>
  new Date(value).toLocaleDateString("nl-BE", { timeZone: "Europe/Brussels", day: "numeric", month: "short" }).replace(".", "");

function getAvatarEvents(players: TimelinePlayer[]): AvatarEvent[] {
  const groups = new Map<string, AvatarEvent>();
  const add = (player: TimelinePlayer, date: string, kind: AvatarEvent["kind"], location: AvatarEvent["location"]) => {
    const key = `${timelineDayKey(date)}-${kind}-${location}`;
    const group = groups.get(key) ?? { date, day: timelineDayLabel(date), kind, location, players: [] };
    group.players.push(player);
    groups.set(key, group);
  };

  players.forEach((player) => {
    if (player.died_at) {
      add(player, player.died_at, "death", player.death_location === "island" ? "island" : "season");
    }
    if (player.revived_at) add(player, player.revived_at, "revival", "island");
  });

  return [...groups.values()].sort((a, b) => +new Date(a.date) - +new Date(b.date));
}

const describeAvatarEvent = (event: AvatarEvent) => event.players.map((player) => {
  const place = event.kind === "revival" ? "herleefd bij de finale van Verliezers-eiland" : event.location === "season" ? "overleden op het hoofdeiland" : "overleden op Verliezers-eiland";
  return `${player.name} — ${place}${event.kind === "death" ? `; ${player.death_cause || "onbekende doodsoorzaak"}` : ""}`;
}).join("\n");

function AvatarStack({ event, compact = false }: { event: AvatarEvent; compact?: boolean }) {
  const revived = event.kind === "revival";
  const label = `${event.day}: ${describeAvatarEvent(event)}`;
  return (
    <div className="group relative flex flex-col items-center">
      <button type="button" title={label} aria-label={label} className="relative flex items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
        {event.players.slice(0, 5).map((player, index) => (
          <img
            key={player.id ?? player.name}
            src={`https://mc-heads.net/avatar/${encodeURIComponent(player.name)}/48`}
            alt={player.name}
            loading="lazy"
            className={`relative size-10 shrink-0 rounded-md border-2 object-cover shadow-lg [image-rendering:pixelated] ${revived ? "timeline-revival" : "timeline-avatar"} ${index ? "-ml-3" : ""} ${revived ? "border-emerald-300 shadow-emerald-500/30" : event.location === "island" ? "border-secondary shadow-secondary/25" : "border-primary shadow-primary/25"}`}
            style={{ zIndex: index + 1, animationDelay: `${index * 90}ms` }}
          />
        ))}
        {event.players.length > 5 && <span className={`-ml-3 z-10 grid size-9 place-items-center rounded-md border-2 bg-card font-pixel text-[10px] ${revived ? "border-emerald-300 text-emerald-300" : "border-primary text-primary"}`}>+{event.players.length - 5}</span>}
      </button>
      <div className="timeline-tooltip pointer-events-none absolute left-1/2 top-full z-50 mt-2 w-60 -translate-x-1/2 rounded-lg border border-border bg-card/95 p-3 text-left shadow-2xl backdrop-blur-md group-hover:opacity-100 group-focus-within:opacity-100">
        <p className={`mb-2 font-pixel text-xs ${revived ? "text-emerald-300" : event.location === "island" ? "text-secondary" : "text-primary"}`}>
          {revived ? "Herrezen · Verliezers-eiland" : event.location === "island" ? "Death · Verliezers-eiland" : "Death · Hoofdeiland"} · {event.day}
        </p>
        <ul className="space-y-2 text-xs text-foreground">
          {event.players.map((player) => (
            <li key={player.id ?? player.name} className="flex items-center gap-2">
              <img src={`https://mc-heads.net/avatar/${encodeURIComponent(player.name)}/32`} alt="" className="size-7 [image-rendering:pixelated]" />
              <span><strong>{player.name}</strong>{event.kind === "death" && <span className="block text-muted-foreground">{player.death_cause || "Onbekende oorzaak"}</span>}</span>
            </li>
          ))}
        </ul>
      </div>
      {!compact && <time dateTime={event.date} className={`mt-1 whitespace-nowrap font-pixel text-[10px] ${revived ? "text-emerald-300" : event.location === "island" ? "text-secondary" : "text-primary"}`}>{event.day}</time>}
    </div>
  );
}

function DeathTrack({ players, location }: { players: TimelinePlayer[]; location: "season" | "island" }) {
  const events = getAvatarEvents(players).filter((event) => event.location === location);
  if (!events.length) return null;
  return (
    <div className="relative mt-1 h-[76px] border-t border-dashed border-border/40" aria-label={location === "season" ? "Deaths op het hoofdeiland" : "Deaths en herlevingen op Verliezers-eiland"}>
      {events.map((event) => {
        const left = position(event.date);
        const transform = left < 7 ? "translateX(0)" : left > 93 ? "translateX(-100%)" : "translateX(-50%)";
        return (
          <div key={`${event.day}-${event.kind}-${event.location}`} className="absolute top-2" style={{ left: `${left}%`, transform }}>
            <AvatarStack event={event} />
          </div>
        );
      })}
    </div>
  );
}

function MobileAvatarEvents({ players }: { players: TimelinePlayer[] }) {
  const events = getAvatarEvents(players);
  if (!events.length) return null;
  return (
    <div className="grid gap-2 lg:hidden">
      {events.map((event) => (
        <article key={`mobile-${event.day}-${event.kind}-${event.location}`} className={`flex items-center gap-3 border-2 bg-card/80 p-3 ${event.kind === "revival" ? "border-emerald-400/60" : event.location === "island" ? "border-secondary/50" : "border-primary/40"}`}>
          <AvatarStack event={event} compact />
          <div className="min-w-0 flex-1">
            <p className={`font-pixel text-xs ${event.kind === "revival" ? "text-emerald-300" : event.location === "island" ? "text-secondary" : "text-primary"}`}>
              {event.kind === "revival" ? "Herrezen · Verliezers-eiland" : event.location === "island" ? "Death · Verliezers-eiland" : "Death · Hoofdeiland"}
            </p>
            <p className="mt-1 text-xs font-semibold">{event.day} · {event.players.map((player) => player.name).join(", ")}</p>
            {event.kind === "death" && <p className="mt-0.5 truncate text-xs text-muted-foreground">{event.players.map((player) => player.death_cause || "Onbekende oorzaak").join(" · ")}</p>}
          </div>
        </article>
      ))}
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

export function Timeline({ players = [] }: { players?: TimelinePlayer[] }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const update = () => setNow(Date.now());
    update();
    const timer = window.setInterval(update, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="block-card overflow-hidden">
      <style>{`
        @keyframes timeline-spawn { 0% { opacity: 0; transform: translateY(18px) scale(.4) rotate(-12deg); } 68% { opacity: 1; transform: translateY(-4px) scale(1.12) rotate(3deg); } 100% { opacity: 1; transform: translateY(0) scale(1) rotate(0); } }
        @keyframes timeline-revive { 0% { opacity: 0; transform: translateY(22px) scale(.6); filter: brightness(2); } 65% { opacity: 1; transform: translateY(-5px) scale(1.13); filter: brightness(1.4); } 100% { opacity: 1; transform: translateY(0) scale(1); filter: brightness(1); } }
        @keyframes timeline-glow { 0%,100% { box-shadow: 0 0 0 rgba(52,211,153,0); } 50% { box-shadow: 0 0 18px rgba(52,211,153,.7); } }
        .timeline-avatar { animation: timeline-spawn .65s cubic-bezier(.2,.85,.25,1.2) both; transition: transform .2s ease, filter .2s ease; }
        .timeline-revival { animation: timeline-revive .8s cubic-bezier(.2,.85,.25,1.2) both, timeline-glow 2.4s ease-in-out 3; }
        .timeline-avatar:hover { transform: translateY(-5px) scale(1.12) rotate(-4deg); filter: brightness(1.2); }
        .timeline-tooltip { opacity: 0; transform: translate(-50%, 8px) scale(.96); transition: opacity .18s ease, transform .18s ease; }
        .group:hover .timeline-tooltip, .group:focus-within .timeline-tooltip { opacity: 1; transform: translate(-50%, 0) scale(1); }
        @media (prefers-reduced-motion: reduce) { .timeline-avatar, .timeline-revival, .timeline-tooltip { animation: none !important; transition: none !important; } }
      `}</style>
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
          <DeathTrack players={players} location="season" />
        </section>

        <section className="border-t border-dashed border-border pt-4" aria-label="Verliezers-eiland">
          <h4 className="mb-2 font-pixel text-lg font-bold text-secondary">Verliezers-eiland</h4>
          <DesktopRail events={island} now={now} kind="eiland" />
          <DeathTrack players={players} location="island" />
        </section>

        <MobileEvents now={now} />
        <MobileAvatarEvents players={players} />
      </div>
    </div>
  );
}
