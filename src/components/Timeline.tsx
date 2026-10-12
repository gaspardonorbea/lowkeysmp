import { useEffect, useRef, useState } from "react";
import { usePlayers, fmtDate } from "@/lib/smp";
import door from "@/assets/tl/door.png";
import ice from "@/assets/tl/ice.png";
import nether from "@/assets/tl/nether.png";
import end from "@/assets/tl/end.png";
import crown from "@/assets/tl/crown.png";
import skull from "@/assets/tl/skull.png";
import heart from "@/assets/tl/heart.png";

const START = new Date("2026-11-07T00:00:00+01:00").getTime();
const END = new Date("2026-11-22T00:00:00+01:00").getTime();
const ROLL = 2200; // ms voor de volledige balk
const pos = (d: string | number) => Math.min(100, Math.max(0, ((new Date(d).getTime() - START) / (END - START)) * 100));
const at = (p: number) => (p / 100) * ROLL;

type M = { d: string; icon: string; label: string; day: string; high?: boolean };
const TOP: M[] = [
  { d: "2026-11-07T06:00:00+01:00", icon: door, label: "Server Open", day: "7 nov" },
  { d: "2026-11-13T12:00:00+01:00", icon: ice, label: "IJsmuur smelt", day: "13 nov" },
  { d: "2026-11-14T12:00:00+01:00", icon: nether, label: "Nether open", day: "14 nov", high: true },
  { d: "2026-11-15T12:00:00+01:00", icon: end, label: "End open", day: "15 nov" },
  { d: "2026-11-21T18:00:00+01:00", icon: crown, label: "Hoofdfinale", day: "21 nov" },
];
const ISL_FROM = "2026-11-11T12:00:00+01:00";
const ISL_TO = "2026-11-18T12:00:00+01:00";
const BOTTOM: M[] = [
  { d: ISL_FROM, icon: skull, label: "Verliezerseiland start", day: "11 nov" },
  { d: ISL_TO, icon: heart, label: "Finale Verliezerseiland", day: "18 nov" },
];

function useInView<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e?.isIntersecting) { setSeen(true); io.disconnect(); } }, { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, seen] as const;
}

function Icon({ src, size = 32 }: { src: string; size?: number }) {
  return <img src={src} alt="" className="tl-icon mx-auto object-contain [image-rendering:pixelated]" style={{ height: size, width: size }} />;
}

export function Timeline() {
  const players = usePlayers();
  const [ref, seen] = useInView<HTMLDivElement>();
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => setNow(Date.now()), []);
  const progress = now ? pos(now) : 0;
  const dead = (players.data ?? []).filter((p) => p.is_dead && p.died_at && +new Date(p.died_at) >= START && +new Date(p.died_at) < END);
  const iL = pos(ISL_FROM), iR = pos(ISL_TO);
  const islDelay = at(iL);

  return (
    <div ref={ref} className={`tl block-card relative overflow-hidden p-6 md:p-8 ${seen ? "tl-on" : ""}`}>
      <div className="tl-stars pointer-events-none absolute inset-0" />

      {/* Desktop: horizontaal */}
      <div className="relative hidden md:block">
        <div className="relative h-36">
          {TOP.map((m) => {
            const p = pos(m.d);
            return (
              <div key={m.label} className="tl-ms absolute bottom-0 -translate-x-1/2 text-center" style={{ left: `${p}%`, "--d": `${at(p)}ms` } as React.CSSProperties}>
                <div className="tl-bob"><Icon src={m.icon} /></div>
                <p className="mt-1 font-pixel text-xs text-primary">{m.day}</p>
                <p className="whitespace-nowrap font-pixel text-xs">{m.label}</p>
                <div className="tl-tick mx-auto mt-1 w-0.5 bg-primary" style={{ height: m.high ? 56 : 12 }} />
              </div>
            );
          })}
        </div>

        <div className="relative">
          <div className="tl-roll relative h-14 rounded-md bg-primary" style={{ "--dur": `${ROLL}ms` } as React.CSSProperties}>
            <div className="tl-sheen absolute inset-0 rounded-md" />
            <div className="absolute inset-y-0 left-0 rounded-md bg-foreground/25" style={{ width: `${progress}%` }} />
            <span className="relative flex h-full items-center whitespace-nowrap px-5 font-pixel text-lg text-primary-foreground">LowkeySMP Seizoen 1</span>
            <span className="tl-edge" />
          </div>
          {dead.map((p, i) => {
            const x = pos(p.died_at!);
            return (
              <div key={p.id} className="tl-death group absolute top-1/2 z-10 -translate-x-1/2 -translate-y-1/2" style={{ left: `${x}%`, "--d": `${ROLL + 200 + i * 150}ms` } as React.CSSProperties}>
                <DeathHead p={p} />
              </div>
            );
          })}
        </div>

        <div className="relative mt-3 h-12">
          <div className="absolute inset-y-0" style={{ left: `${iL}%`, width: `${iR - iL}%` }}>
            <div className="tl-roll relative h-full rounded-md bg-secondary" style={{ "--dur": `${at(iR - iL) * 1.4}ms`, "--d": `${islDelay}ms` } as React.CSSProperties}>
              <div className="tl-sheen absolute inset-0 rounded-md" />
              <span className="relative flex h-full items-center whitespace-nowrap px-4 font-pixel text-secondary-foreground">Verliezerseiland</span>
              <span className="tl-edge" />
            </div>
          </div>
        </div>
        <div className="relative h-24">
          {BOTTOM.map((m, i) => {
            const p = pos(m.d);
            return (
              <div key={m.label} className="tl-ms absolute top-0 -translate-x-1/2 text-center" style={{ left: `${p}%`, "--d": `${islDelay + i * at(iR - iL) * 1.4}ms` } as React.CSSProperties}>
                <div className="tl-tick mx-auto mb-1 h-3 w-0.5 bg-secondary" />
                <div className="tl-bob"><Icon src={m.icon} size={28} /></div>
                <p className="mt-1 font-pixel text-xs text-secondary">{m.day}</p>
                <p className="whitespace-nowrap font-pixel text-xs">{m.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobiel: verticaal */}
      <div className="relative md:hidden">
        <div className="tl-vroll absolute bottom-0 left-5 top-0 w-1.5 rounded bg-primary" />
        <ol className="space-y-5">
          {[...TOP, ...BOTTOM.map((b) => ({ ...b, island: true }))]
            .concat(dead.map((p) => ({ d: p.died_at!, icon: "", label: p.name, day: fmtDate(p.died_at), dead: p })) as never[])
            .sort((a, b) => +new Date(a.d) - +new Date(b.d))
            .map((m: M & { island?: boolean; dead?: (typeof dead)[number] }, i) => (
              <li key={m.label + i} className="tl-ms relative flex items-center gap-4 pl-0" style={{ "--d": `${200 + i * 140}ms` } as React.CSSProperties}>
                <div className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-md border-2 border-border bg-card">
                  {m.dead ? <img src={`https://minotar.net/helm/${encodeURIComponent(m.dead.name)}/28.png`} alt="" className="h-7 w-7 [image-rendering:pixelated]" /> : <Icon src={m.icon} size={26} />}
                </div>
                <div>
                  <p className={`font-pixel text-xs ${m.dead ? "text-destructive" : m.island ? "text-secondary" : "text-primary"}`}>{m.day}</p>
                  <p className="font-pixel text-sm">{m.dead ? `☠ ${m.label}` : m.label}</p>
                  {m.dead && <p className="text-xs text-muted-foreground">{m.dead.death_cause || "Onbekende oorzaak"}</p>}
                </div>
              </li>
            ))}
        </ol>
      </div>

      <a href="/tijdlijn.jpg" target="_blank" rel="noreferrer" className="btn-block relative mt-6 text-sm">Toon originele afbeelding</a>
    </div>
  );
}

function DeathHead({ p }: { p: { name: string; death_cause: string | null; died_at: string | null } }) {
  const island = +new Date(p.died_at!) >= +new Date(ISL_FROM);
  return (
    <>
      <img src={`https://minotar.net/helm/${encodeURIComponent(p.name)}/32.png`} alt={p.name} className="h-9 w-9 border-2 border-destructive bg-card [image-rendering:pixelated] transition-transform duration-200 group-hover:-translate-y-1 group-hover:scale-125" />
      <div className="block-card pointer-events-none absolute bottom-full left-1/2 mb-3 w-max max-w-[220px] -translate-x-1/2 translate-y-1 p-2 text-xs opacity-0 transition duration-200 group-hover:translate-y-0 group-hover:opacity-100">
        <p className="font-pixel font-bold">☠ {p.name}</p>
        <p className="text-muted-foreground">{p.death_cause || "Onbekende oorzaak"}</p>
        <p className="text-destructive">{fmtDate(p.died_at)}</p>
        {island && <p className="text-secondary">→ Verliezerseiland</p>}
      </div>
    </>
  );
}
