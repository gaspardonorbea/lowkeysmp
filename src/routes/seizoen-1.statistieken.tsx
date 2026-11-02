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

function PlayerStatsTable() {
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
  const rows = useMemo(
    () => (stats.data ?? [])
      .filter((r) => r.name.toLowerCase().includes(q.trim().toLowerCase()))
      .sort((a, b) => Number(b[sort]) - Number(a[sort])),
    [stats.data, q, sort],
  );
  return (
    <div className="block-card p-5">
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Zoek een speler..." aria-label="Zoek een speler"
        className="mb-4 w-full border-2 border-border bg-background px-3 py-2 text-foreground" />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-border text-left">
              <th className="py-2 pr-3">#</th>
              <th className="py-2 pr-3">Speler</th>
              {COLS.map((c) => (
                <th key={c.key} className="py-2 pr-3 text-right">
                  <button onClick={() => setSort(c.key)} className={`font-pixel ${sort === c.key ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                    {c.label}{sort === c.key ? " ▼" : ""}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {stats.isLoading && <tr><td colSpan={7} className="py-4 text-center text-muted-foreground">Laden...</td></tr>}
            {!stats.isLoading && rows.length === 0 && <tr><td colSpan={7} className="py-4 text-center text-muted-foreground">Geen spelers gevonden.</td></tr>}
            {rows.map((r, i) => (
              <tr key={r.uuid} className="border-b border-border/50">
                <td className="py-2 pr-3 font-pixel text-muted-foreground">{i + 1}</td>
                <td className="py-2 pr-3">
                  <div className="flex items-center gap-2"><Skin name={r.name} size={28} className="h-7 w-7" /><span className="font-pixel">{r.name}</span></div>
                </td>
                <td className="py-2 pr-3 text-right">{fmtTime(r.playtime_seconds)}</td>
                <td className="py-2 pr-3 text-right">{r.totem_pops}</td>
                <td className="py-2 pr-3 text-right">{r.kills}</td>
                <td className="py-2 pr-3 text-right">{r.jumps}</td>
                <td className="py-2 pr-3 text-right">{Number(r.km_walked).toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
