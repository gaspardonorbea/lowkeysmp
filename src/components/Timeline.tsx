import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import door from "@/assets/tl/door.png";
import ice from "@/assets/tl/ice.png";
import nether from "@/assets/tl/nether.png";
import end from "@/assets/tl/end.png";
import crown from "@/assets/tl/crown.png";
import skull from "@/assets/tl/skull.png";
import heart from "@/assets/tl/heart.png";
import { T, useContent } from "@/lib/cms";
import { Skin } from "@/components/Skin";

export const TIMELINE_ICONS: Record<string, string> = { door, ice, nether, end, crown, skull, heart };

/** One event on the rail. Everything here is editable in the admin bar (saved as timeline.events). */
export type TlEvent = { id: string; date: string; title: string; icon: string; big?: boolean; gold?: boolean };

export const DEFAULT_EVENTS: TlEvent[] = [
  { id: "open", date: "2026-11-07T14:00:00+01:00", title: "Server open", icon: "door" },
  { id: "island", date: "2026-11-11T12:00:00+01:00", title: "Verliezers-eiland start", icon: "skull" },
  { id: "ice", date: "2026-11-13T12:00:00+01:00", title: "IJsmuur smelt", icon: "ice" },
  { id: "nether", date: "2026-11-14T12:00:00+01:00", title: "Nether open", icon: "nether" },
  { id: "end", date: "2026-11-15T12:00:00+01:00", title: "End open", icon: "end" },
  { id: "islandfinale", date: "2026-11-18T12:00:00+01:00", title: "Finale Verliezers-eiland", icon: "heart" },
  { id: "finale", date: "2026-11-21T18:00:00+01:00", title: "Hoofdfinale", icon: "crown", gold: true },
];

type TimelinePlayer = {
  id?: string;
  name: string;
  died_at?: string | null;
  death_cause?: string | null;
  death_location?: string | null;
  main_died_at?: string | null;
  main_death_cause?: string | null;
  island_died_at?: string | null;
  island_death_cause?: string | null;
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
    if (player.main_died_at) {
      add({ ...player, death_cause: player.main_death_cause ?? player.death_cause ?? null }, player.main_died_at, "death", "season");
    }
    if (player.island_died_at) {
      add({ ...player, death_cause: player.island_death_cause ?? player.death_cause ?? null }, player.island_died_at, "death", "island");
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
          <Skin
            key={player.id ?? player.name}
            name={player.name}
            size={48}
            alt={player.name}
            loading="lazy"
            className={`relative size-10 shrink-0 rounded-md border-2 object-cover shadow-lg [image-rendering:pixelated] ${revived ? "timeline-revival" : "timeline-avatar"} ${index ? "-ml-3" : ""} ${revived ? "border-emerald-300 shadow-emerald-500/30" : event.location === "island" ? "border-secondary shadow-secondary/25" : "border-primary shadow-primary/25"}`}
            style={{ zIndex: index + 1, animationDelay: `${index * 90}ms` }}
          />
        ))}
        {event.players.length > 5 && <span className={`-ml-3 z-10 grid size-9 place-items-center rounded-md border-2 bg-card font-pixel text-[10px] ${revived ? "border-emerald-300 text-emerald-300" : "border-primary text-primary"}`}>+{event.players.length - 5}</span>}
      </button>
      <div className="timeline-tooltip pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-60 -translate-x-1/2 rounded-lg border border-border bg-card/95 p-3 text-left shadow-2xl backdrop-blur-md group-hover:opacity-100 group-focus-within:opacity-100">
        <p className={`mb-2 font-pixel text-xs ${revived ? "text-emerald-300" : event.location === "island" ? "text-secondary" : "text-primary"}`}>
          {revived ? "Herrezen · Verliezers-eiland" : event.location === "island" ? "Death · Verliezers-eiland" : "Death · Hoofdeiland"} · {event.day}
        </p>
        <ul className="space-y-2 text-xs text-foreground">
          {event.players.map((player) => (
            <li key={player.id ?? player.name} className="flex items-center gap-2">
              <Skin name={player.name} size={32} alt="" className="size-7 [image-rendering:pixelated]" />
              <span><strong>{player.name}</strong>{event.kind === "death" && <span className="block text-muted-foreground">{player.death_cause || "Onbekende oorzaak"}</span>}</span>
            </li>
          ))}
        </ul>
      </div>
      {!compact && <time dateTime={event.date} className={`mt-1 whitespace-nowrap font-pixel text-[10px] ${revived ? "text-emerald-300" : event.location === "island" ? "text-secondary" : "text-primary"}`}>{event.day}</time>}
    </div>
  );
}


const DAY = 86_400_000;
const keyToUtc = (key: string) => Date.UTC(+key.slice(0, 4), +key.slice(5, 7) - 1, +key.slice(8, 10));

export function Timeline({ players = [] }: { players?: TimelinePlayer[] }) {
  const events = useContent<TlEvent[]>("timeline.events", DEFAULT_EVENTS);
  const [zoom, setZoom] = useState(1);
  const [now, setNow] = useState<number | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = () => setNow(Date.now());
    update();
    const timer = window.setInterval(update, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const sorted = useMemo(() => [...events].sort((a, b) => +new Date(a.date) - +new Date(b.date)), [events]);
  const avatarEvents = useMemo(() => getAvatarEvents(players), [players]);

  const model = useMemo(() => {
    const firstKey = timelineDayKey(sorted[0]?.date ?? new Date().toISOString());
    const lastKey = timelineDayKey(sorted[sorted.length - 1]?.date ?? new Date().toISOString());
    const dayKeys: string[] = [];
    for (let t = keyToUtc(firstKey); t <= keyToUtc(lastKey); t += DAY) dayKeys.push(new Date(t).toISOString().slice(0, 10));
    const deathsByDay = new Map<string, AvatarEvent[]>();
    avatarEvents.forEach((e) => {
      const k = timelineDayKey(e.date);
      deathsByDay.set(k, [...(deathsByDay.get(k) ?? []), e]);
    });
    return { dayKeys, deathsByDay, firstKey };
  }, [sorted, avatarEvents]);

  const dayW = 76 * zoom;
  const PAD = 70;
  const width = Math.max(model.dayKeys.length * dayW + PAD * 2, 320);
  const x = (key: string) => PAD + model.dayKeys.indexOf(key) * dayW + dayW / 2;
  const todayKey = now === null ? null : timelineDayKey(new Date(now).toISOString());

  // bubbles that sit close together alternate between two heights so they never overlap
  const placed = sorted.map((ev, i) => {
    const left = x(timelineDayKey(ev.date));
    const prevLeft = i ? x(timelineDayKey(sorted[i - 1]!.date)) : -999;
    return { ev, left, row: i && left - prevLeft < 150 ? 1 : 0 };
  });
  for (let i = 1; i < placed.length; i++) {
    if (placed[i]!.row === 1 && placed[i - 1]!.row === 1) placed[i]!.row = 0;
  }

  const scrollBy = (dir: number) => scroller.current?.scrollBy({ left: dir * 420, behavior: "smooth" });
  const remainingText = (date: string) => {
    if (now === null) return "";
    const d = Math.ceil((new Date(date).getTime() - now) / DAY);
    return d < 0 ? "Afgelopen" : d === 0 ? "Vandaag" : `Over ${d}d`;
  };

  return (
    <div className="block-card overflow-hidden">
      <style>{`
        @keyframes timeline-spawn { 0% { opacity: 0; transform: translateY(18px) scale(.4) rotate(-12deg); } 68% { opacity: 1; transform: translateY(-4px) scale(1.12) rotate(3deg); } 100% { opacity: 1; transform: translateY(0) scale(1) rotate(0); } }
        @keyframes timeline-revive { 0% { opacity: 0; transform: translateY(22px) scale(.6); filter: brightness(2); } 65% { opacity: 1; transform: translateY(-5px) scale(1.13); filter: brightness(1.4); } 100% { opacity: 1; transform: translateY(0) scale(1); filter: brightness(1); } }
        .timeline-avatar { animation: timeline-spawn .65s cubic-bezier(.2,.85,.25,1.2) both; transition: transform .2s ease, filter .2s ease; }
        .timeline-revival { animation: timeline-revive .8s cubic-bezier(.2,.85,.25,1.2) both; }
        .timeline-avatar:hover { transform: translateY(-5px) scale(1.12) rotate(-4deg); filter: brightness(1.2); }
        .timeline-tooltip { opacity: 0; transform: translate(-50%, 8px) scale(.96); transition: opacity .18s ease, transform .18s ease; }
        .group:hover .timeline-tooltip, .group:focus-within .timeline-tooltip { opacity: 1; transform: translate(-50%, 0) scale(1); }
        @media (prefers-reduced-motion: reduce) { .timeline-avatar, .timeline-revival, .timeline-tooltip { animation: none !important; transition: none !important; } }
      `}</style>

      <div className="relative">
        <div ref={scroller} className="overflow-x-auto px-2 pb-2 pt-6" style={{ scrollbarWidth: "thin" }}>
          <div className="relative mx-auto" style={{ width, height: 330 }}>
            {/* the rail */}
            <div className="absolute top-[150px] h-1 bg-gold" style={{ left: PAD, right: PAD }} />

            {/* event bubbles above the rail */}
            {placed.map(({ ev, left, row }) => {
              const color = ev.gold ? "text-gold border-gold/60" : "text-primary border-border";
              const top = row === 0 ? 62 : 0;
              return (
                <div key={ev.id} className="absolute" style={{ left, top: 0, transform: "translateX(-50%)" }}>
                  <div className={`absolute left-1/2 w-px -translate-x-1/2 bg-gold/70`} style={{ top: top + 62, height: 150 - top - 62 }} />
                  <div className={`absolute left-1/2 w-36 -translate-x-1/2 rounded-xl border bg-card/90 px-3 py-2 text-center ${color}`} style={{ top }}>
                    <span className="block font-pixel text-[10px] font-bold uppercase tracking-widest text-gold/90">{remainingText(ev.date)}</span>
                    <span className="block font-pixel text-sm font-bold leading-tight text-foreground">{ev.title}</span>
                  </div>
                </div>
              );
            })}

            {/* a dot per day */}
            {model.dayKeys.map((key) => {
              const ev = sorted.filter((e) => timelineDayKey(e.date) === key);
              const big = ev.length > 0;
              const hasDeaths = model.deathsByDay.has(key);
              const dayNum = +key.slice(8, 10);
              const month = new Date(keyToUtc(key)).toLocaleDateString("nl-BE", { month: "short", timeZone: "UTC" }).replace(".", "").toUpperCase();
              const isToday = key === todayKey;
              return (
                <div key={key} className="absolute" style={{ left: x(key), top: 0, transform: "translateX(-50%)" }}>
                  <span
                    className={`absolute left-1/2 -translate-x-1/2 rounded-full border-2 border-card ${big ? "size-6" : "size-4"} ${hasDeaths || big ? "bg-destructive" : "bg-gold"} ${ev.some((e) => e.gold) ? "!bg-gold" : ""} ${isToday ? "ring-2 ring-foreground" : ""}`}
                    style={{ top: 152 - (big ? 12 : 8) }}
                  />
                  <span className="absolute left-1/2 top-[172px] -translate-x-1/2 text-center font-pixel text-[11px] leading-tight text-muted-foreground">
                    {dayNum}<span className="block text-[8px] tracking-widest text-muted-foreground/70">{month}</span>
                  </span>
                  {hasDeaths && (
                    <div className="absolute left-1/2 top-[218px] flex -translate-x-1/2 flex-col items-center gap-2">
                      <span className="h-3 w-px bg-destructive/60" />
                      {model.deathsByDay.get(key)!.map((e) => <AvatarStack key={`${e.kind}-${e.location}`} event={e} compact />)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <button onClick={() => scrollBy(-1)} aria-label="Naar links" className="absolute left-1 top-[150px] hidden size-8 items-center justify-center rounded-full border border-border bg-card/90 text-muted-foreground hover:text-foreground sm:flex"><ChevronLeft className="size-5" /></button>
        <button onClick={() => scrollBy(1)} aria-label="Naar rechts" className="absolute right-1 top-[150px] hidden size-8 items-center justify-center rounded-full border border-border bg-card/90 text-muted-foreground hover:text-foreground sm:flex"><ChevronRight className="size-5" /></button>
      </div>

      <div className="flex items-center justify-center gap-3 border-t border-border px-4 py-3">
        <button onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))} aria-label="Uitzoomen" className="rounded border border-border p-2 text-muted-foreground hover:text-foreground"><ZoomOut className="size-4" /></button>
        <span className="w-14 text-center font-pixel text-xs text-muted-foreground">{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom((z) => Math.min(2, +(z + 0.25).toFixed(2)))} aria-label="Inzoomen" className="rounded border border-border p-2 text-muted-foreground hover:text-foreground"><ZoomIn className="size-4" /></button>
        <span className="ml-3 hidden text-xs text-muted-foreground sm:inline"><T k="timeline.hint" def="Beweeg over een hoofdje om te zien wie er dood ging." /></span>
      </div>
    </div>
  );
}
