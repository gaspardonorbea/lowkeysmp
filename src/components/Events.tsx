import { useEffect, useState } from "react";

export type Ev = { at: string; title: string; island: "hoofd" | "verliezers" };
export const EVENTS: Ev[] = [
  { at: "2026-11-07T14:00:00+01:00", title: "Server Open", island: "hoofd" },
  { at: "2026-11-11T19:00:00+01:00", title: "Verliezerseiland start", island: "verliezers" },
  { at: "2026-11-13T18:00:00+01:00", title: "IJsmuur smelt", island: "hoofd" },
  { at: "2026-11-14T14:00:00+01:00", title: "Nether open", island: "hoofd" },
  { at: "2026-11-15T18:00:00+01:00", title: "End open", island: "hoofd" },
  { at: "2026-11-18T19:00:00+01:00", title: "Finale Verliezerseiland", island: "verliezers" },
  { at: "2026-11-21T19:00:00+01:00", title: "Hoofdfinale", island: "hoofd" },
];
export const DAY = 86400000;
export const tm = (d: Date) => d.toLocaleTimeString("nl-BE", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Brussels" });
export const fmt = (d: Date) => d.toLocaleDateString("nl-BE", { weekday: "short", day: "numeric", month: "short", timeZone: "Europe/Brussels" });

export function Events() {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => { setNow(Date.now()); const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  if (now === null) return null;
  const next = EVENTS.find((e) => new Date(e.at).getTime() > now);
  const left = next ? new Date(next.at).getTime() - now : 0;
  const parts = [Math.floor(left / DAY), Math.floor(left / 3600000) % 24, Math.floor(left / 60000) % 60, Math.floor(left / 1000) % 60];
  return (
    <div className="space-y-6">
      {next && (
        <div className="block-card pop-in border-primary p-6 text-center shadow-[0_0_40px_hsl(var(--primary)/0.25)]">
          <p className="font-pixel text-xs uppercase tracking-widest text-secondary">Volgend event</p>
          <h3 className="mt-2 font-pixel text-3xl text-primary">{next.title}</h3>
          <p className="mt-1 text-muted-foreground">{fmt(new Date(next.at))} · {tm(new Date(next.at))}</p>
          <div className="mt-4 flex justify-center gap-3 font-pixel">
            {parts.map((v, i) => (
              <span key={i} className="min-w-14 border-2 border-border bg-background/60 px-2 py-1"><span className="block text-2xl">{v}</span><span className="text-[10px] text-muted-foreground">{["dagen", "uur", "min", "sec"][i]}</span></span>
            ))}
          </div>
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {EVENTS.map((e) => {
          const t = new Date(e.at).getTime();
          const done = t + DAY <= now;
          const live = t <= now && !done;
          const days = Math.ceil((t - now) / DAY);
          return (
            <div key={e.at} className={`block-card card-hover border-l-4 p-4 ${e.island === "hoofd" ? "border-l-primary" : "border-l-secondary"} ${done ? "opacity-50" : ""} ${live ? "ring-2 ring-success animate-pulse" : ""}`}>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{fmt(new Date(e.at))}</span>
                <span className={e.island === "hoofd" ? "text-primary" : "text-secondary"}>{e.island === "hoofd" ? "Hoofdeiland" : "Verliezerseiland"}</span>
              </div>
              <p className="mt-1 font-pixel text-lg">{e.title}</p>
              <p className="text-xs text-muted-foreground">{done ? "✔ Voltooid" : live ? "🟢 Nu bezig" : `over ${days} dag${days === 1 ? "" : "en"}`}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
