import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePlayers } from "@/lib/smp";
import { PageShell, Reveal } from "@/components/page";
import { Skin } from "@/components/Skin";

export const Route = createFileRoute("/seizoen-1/statistieken")({
  head: () => ({
    meta: [
      { title: "Statistieken — LowkeySMP" },
      { name: "description", content: "Statistieken van seizoen 1: levend, dood, teams en spelersstats." },
      { property: "og:title", content: "Statistieken — LowkeySMP" },
      { property: "og:description", content: "Statistieken van seizoen 1: levend, dood, teams en spelersstats." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
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

type SortKey = "playtime_seconds" | "totem_pops" | "kills" | "jumps" | "km_walked";
const COLS: { key: SortKey; label: string }[] = [
  { key: "playtime_seconds", label: "Speeltijd" },
  { key: "totem_pops", label: "Totem pops" },
  { key: "kills", label: "Kills" },
  { key: "jumps", label: "Sprongen" },
  { key: "km_walked", label: "Km gelopen" },
];
const fmtTime = (s: number) => { const h = Math.floor(s / 3600); const m = Math.floor((s % 3600) / 60); return `${h}u ${m}m`; };

const fmtVal = (k: SortKey, v: number) =>
  k === "playtime_seconds" ? fmtTime(v) : k === "km_walked" ? `${v.toFixed(1)} km` : `${v} ${COLS.find((c) => c.key === k)!.label.toLowerCase()}`;

function Seg<T extends string>({ value, set, opts }: { value: T; set: (v: T) => void; opts: [T, string][] }) {
  return (
    <div className="flex overflow-hidden border-2 border-border">
      {opts.map(([v, l]) => (
        <button key={v} type="button" aria-pressed={value === v} onClick={() => set(v)}
          className={`px-3 py-1.5 text-xs font-semibold transition-colors ${value === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>{l}</button>
      ))}
    </div>
  );
}

function PlayerStatsTable({ players }: { players: NonNullable<ReturnType<typeof usePlayers>["data"]> }) {
  const stats = useQuery({
    queryKey: ["player_stats"],
    queryFn: async () => {
      const { data, error } = await supabase.from("player_stats").select("*");
      if (error) throw error;
      return data;
    },
  });
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("playtime_seconds");
  const [team, setTeam] = useState<"all" | "noord" | "zuid">("all");
  const [life, setLife] = useState<"all" | "alive" | "dead">("all");
  const byName = useMemo(() => new Map(players.map((p) => [p.name.toLowerCase(), p])), [players]);
  const ranked = useMemo(() => (stats.data ?? [])
    .map((r) => ({ ...r, p: byName.get(r.name.toLowerCase()) }))
    .filter((r) => team === "all" || r.p?.team === team)
    .filter((r) => life === "all" || !!r.p?.is_dead === (life === "dead"))
    .sort((a, b) => Number(b[sort]) - Number(a[sort])), [stats.data, byName, team, life, sort]);
  const shown = ranked.map((r, i) => ({ r, rank: i + 1 })).filter(({ r }) => r.name.toLowerCase().includes(q.trim().toLowerCase()));
  const badge = (n: number) => n === 1 ? "bg-gold text-background" : n === 2 ? "bg-muted-foreground text-background" : n === 3 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground";
  return (
    <div className="space-y-4">
      <div className="block-card flex flex-wrap items-center gap-3 p-4">
        <select className="field w-auto" aria-label="Sorteer op" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
          {COLS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
        </select>
        <Seg value={team} set={setTeam} opts={[["all", "Alle"], ["noord", "🔴 Noord"], ["zuid", "🔵 Zuid"]]} />
        <Seg value={life} set={setLife} opts={[["all", "Alle"], ["alive", "Levend"], ["dead", "Uitgeschakeld"]]} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="🔍 Zoek speler" aria-label="Zoek een speler" className="field ml-auto w-40" />
      </div>
      {stats.isLoading && <p className="text-center text-muted-foreground">Laden...</p>}
      {!stats.isLoading && shown.length === 0 && <p className="text-center text-muted-foreground">Geen spelers gevonden.</p>}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {shown.map(({ r, rank }) => (
          <div key={r.uuid} className={`block-card card-hover relative p-4 text-center ${r.p?.is_dead ? "opacity-60 grayscale" : ""}`}>
            <span className={`absolute left-3 top-3 grid size-6 place-items-center rounded-full text-xs font-bold ${badge(rank)}`}>{rank}</span>
            <Skin name={r.name} size={48} className="mx-auto mb-2 size-12 [image-rendering:pixelated]" />
            <p className="truncate font-pixel font-bold">{r.name}</p>
            <p className="text-sm font-semibold text-primary">{fmtVal(sort, Number(r[sort]))}</p>
            {r.p?.main_died_at && !r.p.revived_at && (
              <p className="text-xs text-destructive">{r.p.island_died_at ? "Uitgeschakeld" : "Verliezerseiland"}</p>
            )}
          </div>
        ))}
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
          <Reveal>
            <h2 className="mb-4 text-2xl font-bold text-primary">Spelers opzoeken</h2>
            <PlayerStatsTable />
          </Reveal>
        </div>
      )}
    </PageShell>
  );
}
