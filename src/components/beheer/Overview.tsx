import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePlayers, fmtDate } from "@/lib/smp";
import { Skin } from "@/components/Skin";

type EventRow = { kind: string; visitor_id: string; created_at: string };
const dayKey = (iso: string | number) => new Date(iso).toLocaleDateString("sv-SE", { timeZone: "Europe/Brussels" });

export function Overview({ go }: { go: (tab: string) => void }) {
  const players = usePlayers();
  const [rows, setRows] = useState<EventRow[] | null>(null);
  const [pending, setPending] = useState<number | null>(null);

  useEffect(() => {
    supabase.from("site_events").select("kind, visitor_id, created_at").limit(10000).then(({ data }) => setRows((data ?? []) as EventRow[]));
    supabase.from("whitelist_requests").select("id", { count: "exact", head: true }).eq("status", "pending").then(({ count }) => setPending(count ?? 0));
  }, []);

  const stats = useMemo(() => {
    const visits = (rows ?? []).filter((r) => r.kind === "visit");
    const days: { key: string; label: string; n: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86_400_000);
      const key = dayKey(d.getTime());
      days.push({ key, label: d.toLocaleDateString("nl-BE", { day: "numeric", month: "short", timeZone: "Europe/Brussels" }), n: 0 });
    }
    const perDay = new Map<string, Set<string>>();
    visits.forEach((v) => {
      const k = dayKey(v.created_at);
      perDay.set(k, (perDay.get(k) ?? new Set()).add(v.visitor_id));
    });
    days.forEach((d) => (d.n = perDay.get(d.key)?.size ?? 0));
    const uniq = (since: number) => new Set(visits.filter((v) => +new Date(v.created_at) >= since).map((v) => v.visitor_id)).size;
    const today = days[days.length - 1]!.n;
    return {
      days,
      today,
      yesterday: days[days.length - 2]!.n,
      week: uniq(Date.now() - 7 * 86_400_000),
      total: new Set(visits.map((v) => v.visitor_id)).size,
      pushNews: new Set((rows ?? []).filter((r) => r.kind === "sub_nieuws").map((r) => r.visitor_id)).size,
      pushDeaths: new Set((rows ?? []).filter((r) => r.kind === "sub_deaths").map((r) => r.visitor_id)).size,
    };
  }, [rows]);

  const all = players.data ?? [];
  const dead = all.filter((p) => p.is_dead);
  const lastDeaths = [...dead].sort((a, b) => +new Date(b.died_at ?? 0) - +new Date(a.died_at ?? 0)).slice(0, 5);
  const max = Math.max(1, ...stats.days.map((d) => d.n));
  const card = "block-card p-4";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className={card}><p className="font-pixel text-3xl text-primary">{rows ? stats.today : "…"}</p><p className="text-xs text-muted-foreground">Bezoekers vandaag</p><p className="mt-1 text-[11px] text-muted-foreground/70">gisteren {rows ? stats.yesterday : "…"}</p></div>
        <div className={card}><p className="font-pixel text-3xl text-primary">{rows ? stats.week : "…"}</p><p className="text-xs text-muted-foreground">Bezoekers laatste 7 dagen</p></div>
        <div className={card}><p className="font-pixel text-3xl text-primary">{rows ? stats.total : "…"}</p><p className="text-xs text-muted-foreground">Bezoekers totaal</p></div>
        <div className={card}><p className="font-pixel text-3xl text-gold">{pending ?? "…"}</p><p className="text-xs text-muted-foreground">Whitelist aanvragen wachten</p></div>
      </div>

      <div className={card}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-pixel text-lg font-bold">Bezoekers per dag</h3>
          <span className="text-xs text-muted-foreground">laatste 14 dagen</span>
        </div>
        <div className="flex h-40 items-end gap-1.5" role="img" aria-label="Bezoekers per dag, laatste 14 dagen">
          {stats.days.map((d, i) => (
            <div key={d.key} className="group flex h-full flex-1 flex-col items-center justify-end gap-1" title={`${d.label}: ${d.n}`}>
              <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100">{d.n}</span>
              <div className={`w-full min-h-[3px] ${i === stats.days.length - 1 ? "bg-primary" : "bg-primary/45"} transition-all group-hover:bg-primary`} style={{ height: `${(d.n / max) * 100}%` }} />
            </div>
          ))}
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-muted-foreground"><span>{stats.days[0]!.label}</span><span>vandaag</span></div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className={card}>
          <h3 className="mb-3 font-pixel text-lg font-bold">Spelers</h3>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div><p className="font-pixel text-2xl">{all.length}</p><p className="text-xs text-muted-foreground">totaal</p></div>
            <div><p className="font-pixel text-2xl text-success">{all.length - dead.length}</p><p className="text-xs text-muted-foreground">levend</p></div>
            <div><p className="font-pixel text-2xl text-destructive">{dead.length}</p><p className="text-xs text-muted-foreground">dood</p></div>
          </div>
          <div className="mt-3 h-3 overflow-hidden border-2 border-border bg-background"><div className="h-full bg-success" style={{ width: all.length ? `${((all.length - dead.length) / all.length) * 100}%` : "0%" }} /></div>
          <button className="btn-block btn-block-secondary mt-4 !py-1.5 text-xs" onClick={() => go("spelers")}>Spelers beheren →</button>
        </div>
        <div className={card}>
          <h3 className="mb-3 font-pixel text-lg font-bold">Laatste deaths</h3>
          {lastDeaths.length === 0 ? <p className="text-sm text-muted-foreground">Nog niemand dood.</p> : (
            <ul className="space-y-2">
              {lastDeaths.map((p) => (
                <li key={p.id} className="flex items-center gap-3">
                  <Skin name={p.name} size={32} className="size-8" />
                  <div className="min-w-0 flex-1"><p className="truncate font-pixel text-sm">{p.name}</p><p className="truncate text-xs text-muted-foreground">{p.death_cause || "Onbekende oorzaak"}</p></div>
                  <span className="text-xs text-destructive">{fmtDate(p.died_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className={card}><p className="font-pixel text-2xl text-primary">{stats.pushNews}</p><p className="text-xs text-muted-foreground">📢 toestellen met nieuws meldingen</p></div>
        <div className={card}><p className="font-pixel text-2xl text-primary">{stats.pushDeaths}</p><p className="text-xs text-muted-foreground">☠ toestellen met dood meldingen</p></div>
        <button className={`${card} text-left transition-colors hover:border-primary`} onClick={() => go("deaths")}><p className="font-pixel text-lg text-destructive">Deaths goedkeuren →</p><p className="text-xs text-muted-foreground">Meldingen van de server</p></button>
        <button className={`${card} text-left transition-colors hover:border-primary`} onClick={() => go("whitelist")}><p className="font-pixel text-lg text-gold">Whitelist →</p><p className="text-xs text-muted-foreground">Aanvragen goedkeuren</p></button>
      </div>
    </div>
  );
}
