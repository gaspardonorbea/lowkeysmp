import { createFileRoute } from "@tanstack/react-router";
import { usePlayers, fmtDate } from "@/lib/smp";
import { PageShell, Reveal } from "@/components/page";

export const Route = createFileRoute("/seizoen-1/statistieken")({
  head: () => ({
    meta: [
      { title: "Statistieken — LowkeySMP" },
      { name: "description", content: "Statistieken van seizoen 1: levend, dood, teams en doodsoorzaken." },
      { property: "og:title", content: "Statistieken — LowkeySMP" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Statistieken,
});

function Stat({ label, value, tone = "text-primary" }: { label: string; value: string | number; tone?: string }) {
  return (
    <div className="block-card p-5 text-center">
      <p className={`font-pixel text-4xl font-bold ${tone}`}>{value}</p>
      <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
    </div>
  );
}

function TeamBar({ name, color, alive, dead }: { name: string; color: string; alive: number; dead: number }) {
  const total = alive + dead;
  return (
    <div className="block-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className={`px-3 py-1 font-pixel text-sm text-foreground ${color}`}>{name}</span>
        <span className="text-sm text-muted-foreground">{alive} levend, {dead} dood</span>
      </div>
      <div className="flex h-4 overflow-hidden border-2 border-border bg-background" role="img" aria-label={`${name}: ${alive} levend en ${dead} dood`}>
        <div className="bg-success transition-all" style={{ width: total ? `${(alive / total) * 100}%` : "0%" }} />
        <div className="bg-destructive transition-all" style={{ width: total ? `${(dead / total) * 100}%` : "0%" }} />
      </div>
    </div>
  );
}

function Statistieken() {
  const players = usePlayers();
  const all = players.data ?? [];
  const dead = all.filter((p) => p.is_dead);
  const alive = all.length - dead.length;
  const pct = all.length ? Math.round((alive / all.length) * 100) : 0;
  const byDate = [...dead].sort((a, b) => +new Date(a.died_at ?? 0) - +new Date(b.died_at ?? 0));
  const first = byDate[0];
  const last = byDate[byDate.length - 1];

  const causes = new Map<string, number>();
  for (const p of dead) {
    const c = (p.death_cause || "Onbekend").trim();
    causes.set(c, (causes.get(c) ?? 0) + 1);
  }
  const topCauses = [...causes.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxCause = topCauses[0]?.[1] ?? 1;

  const team = (t: string) => all.filter((p) => p.team === t);
  const noord = team("noord");
  const zuid = team("zuid");

  return (
    <PageShell title="Statistieken" subtitle="Hoe staat seizoen 1 ervoor?">
      {players.isLoading ? (
        <p className="text-center text-muted-foreground">Laden...</p>
      ) : (
        <div className="space-y-10">
          <Reveal>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <Stat label="Deelnemers" value={all.length} />
              <Stat label="Levend" value={alive} tone="text-success" />
              <Stat label="Dood" value={dead.length} tone="text-destructive" />
              <Stat label="Overlevenden" value={`${pct}%`} tone="text-gold" />
            </div>
          </Reveal>

          <Reveal>
            <h2 className="mb-4 text-2xl font-bold text-primary">Teams</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <TeamBar name="Team Noord" color="bg-team-noord" alive={noord.filter((p) => !p.is_dead).length} dead={noord.filter((p) => p.is_dead).length} />
              <TeamBar name="Team Zuid" color="bg-team-zuid" alive={zuid.filter((p) => !p.is_dead).length} dead={zuid.filter((p) => p.is_dead).length} />
            </div>
          </Reveal>

          <div className="grid gap-6 lg:grid-cols-2">
            <Reveal>
              <h2 className="mb-4 text-2xl font-bold text-primary">Doodsoorzaken</h2>
              <div className="block-card space-y-4 p-5">
                {topCauses.length === 0 && <p className="text-muted-foreground">Nog geen deaths.</p>}
                {topCauses.map(([cause, n]) => (
                  <div key={cause}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="truncate pr-3">{cause}</span>
                      <span className="font-pixel text-destructive">{n}</span>
                    </div>
                    <div className="h-2 bg-background"><div className="h-full bg-destructive" style={{ width: `${(n / maxCause) * 100}%` }} /></div>
                  </div>
                ))}
              </div>
            </Reveal>
            <Reveal delay={100}>
              <h2 className="mb-4 text-2xl font-bold text-primary">Eerste en laatste death</h2>
              <div className="space-y-3">
                {[["Eerste death", first], ["Laatste death", last]].map(([label, p]) => (
                  <div key={label as string} className="block-card flex items-center gap-4 p-4">
                    {p ? (
                      <>
                        <img src={`https://mc-heads.net/avatar/${encodeURIComponent((p as typeof first)!.name)}/40`} alt="" className="h-10 w-10 [image-rendering:pixelated]" />
                        <div className="flex-1">
                          <p className="text-xs uppercase tracking-widest text-muted-foreground">{label as string}</p>
                          <p className="font-pixel font-bold">{(p as typeof first)!.name}</p>
                          <p className="text-sm text-muted-foreground">{(p as typeof first)!.death_cause || "Onbekende oorzaak"}</p>
                        </div>
                        <span className="text-right text-xs text-destructive">{fmtDate((p as typeof first)!.died_at)}</span>
                      </>
                    ) : (
                      <p className="text-muted-foreground">{label as string}: nog niemand.</p>
                    )}
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      )}
    </PageShell>
  );
}
