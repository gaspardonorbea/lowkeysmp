import { usePlayers, fmtDate } from "@/lib/smp";

const START = new Date("2026-11-07T00:00:00+01:00").getTime();
const END = new Date("2026-11-22T00:00:00+01:00").getTime();
const pos = (d: string) => Math.min(100, Math.max(0, ((new Date(d).getTime() - START) / (END - START)) * 100));

const TOP = [
  { d: "2026-11-07T12:00:00+01:00", icon: "🚪", label: "Server Open", day: "7 nov" },
  { d: "2026-11-13T12:00:00+01:00", icon: "🧊", label: "IJsmuur smelt", day: "13 nov" },
  { d: "2026-11-14T12:00:00+01:00", icon: "🟣", label: "Nether open", day: "14 nov" },
  { d: "2026-11-15T12:00:00+01:00", icon: "🌌", label: "End open", day: "15 nov" },
  { d: "2026-11-21T12:00:00+01:00", icon: "👑", label: "Hoofdfinale", day: "21 nov" },
];
const ISLAND = { from: "2026-11-11T12:00:00+01:00", to: "2026-11-18T12:00:00+01:00" };

export function Timeline() {
  const players = usePlayers();
  const now = Date.now();
  const progress = Math.min(100, Math.max(0, ((now - START) / (END - START)) * 100));
  const dead = (players.data ?? []).filter((p) => p.is_dead && p.died_at && +new Date(p.died_at) >= START && +new Date(p.died_at) < END);
  const islandL = pos(ISLAND.from), islandR = pos(ISLAND.to);

  return (
    <div className="block-card p-4">
      <div className="overflow-x-auto pb-2">
        <div className="relative mx-6 min-w-[760px] pt-24 pb-36">
          {TOP.map((m, i) => (
            <div key={m.label} className="tl-pop absolute top-0 -translate-x-1/2 text-center" style={{ left: `${pos(m.d)}%`, animationDelay: `${i * 120}ms` }}>
              <div className="tl-bob text-2xl">{m.icon}</div>
              <p className="font-pixel text-xs text-primary">{m.day}</p>
              <p className="whitespace-nowrap font-pixel text-xs">{m.label}</p>
              <div className="mx-auto mt-1 h-4 w-0.5 bg-primary" />
            </div>
          ))}
          <div className="tl-grow relative h-12 overflow-hidden rounded bg-primary shadow-[var(--shadow-glow)]">
            <div className="absolute inset-y-0 left-0 bg-foreground/20" style={{ width: `${progress}%` }} />
            <span className="relative flex h-full items-center px-4 font-pixel text-primary-foreground">LowkeySMP Seizoen 1</span>
          </div>
          <div className="tl-grow absolute mt-3 h-10 rounded bg-secondary" style={{ left: `${islandL}%`, width: `${islandR - islandL}%`, animationDelay: "300ms" }}>
            <span className="flex h-full items-center px-3 font-pixel text-sm text-secondary-foreground">Verliezerseiland</span>
          </div>
          {[{ d: ISLAND.from, icon: "💀", label: "Verliezerseiland start", day: "11 nov" }, { d: ISLAND.to, icon: "❤️", label: "Finale Verliezerseiland", day: "18 nov" }].map((m, i) => (
            <div key={m.label} className="tl-pop absolute top-[10.5rem] -translate-x-1/2 text-center" style={{ left: `${pos(m.d)}%`, animationDelay: `${600 + i * 120}ms` }}>
              <div className="tl-bob text-xl">{m.icon}</div>
              <p className="font-pixel text-xs text-secondary">{m.day}</p>
              <p className="whitespace-nowrap font-pixel text-xs">{m.label}</p>
            </div>
          ))}
          {dead.map((p, i) => {
            const toIsland = +new Date(p.died_at!) >= +new Date(ISLAND.from);
            return (
              <div key={p.id} className="tl-pop group absolute -translate-x-1/2" style={{ left: `${pos(p.died_at!)}%`, top: `${7.25 - (i % 2) * 2}rem`, animationDelay: `${800 + i * 100}ms`, zIndex: 5 }}>
                <img src={`https://minotar.net/helm/${encodeURIComponent(p.name)}/32.png`} alt={p.name} className="h-8 w-8 border-2 border-destructive [image-rendering:pixelated] transition-transform group-hover:scale-125" />
                <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-max max-w-[200px] -translate-x-1/2 scale-90 opacity-0 transition group-hover:scale-100 group-hover:opacity-100 block-card p-2 text-xs">
                  <p className="font-pixel font-bold">☠ {p.name}</p>
                  <p className="text-muted-foreground">{p.death_cause || "Onbekende oorzaak"}</p>
                  <p className="text-destructive">{fmtDate(p.died_at)}</p>
                  {toIsland && <p className="text-secondary">→ Verliezerseiland</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <a href="/tijdlijn.jpg" target="_blank" rel="noreferrer" className="btn-block mt-2 text-sm">Toon originele afbeelding</a>
    </div>
  );
}
