import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { db } from "@/lib/cms";
import { sendPush } from "@/lib/notify";
import { Skin } from "@/components/Skin";

export type DeathReport = { id: string; player_name: string; died_at: string; cause: string | null; location: "main" | "island"; status: string; created_at: string };

const toLocal = (iso: string) => new Date(new Date(iso).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);

/** The number of deaths waiting for a yes or no (also shown as a badge in the menu). */
export function usePendingDeaths() {
  const [n, setN] = useState(0);
  const load = useCallback(() => {
    db.from("death_reports").select("id", { count: "exact", head: true }).eq("status", "pending").then(({ count }: { count: number | null }) => setN(count ?? 0));
  }, []);
  useEffect(() => { load(); const t = window.setInterval(load, 20_000); return () => window.clearInterval(t); }, [load]);
  return { n, reload: load };
}

function Row({ r, done }: { r: DeathReport; done: () => void }) {
  const qc = useQueryClient();
  const [when, setWhen] = useState(toLocal(r.died_at));
  const [cause, setCause] = useState(r.cause ?? "");
  const [loc, setLoc] = useState<"main" | "island">(r.location);
  const [busy, setBusy] = useState(false);

  const approve = async () => {
    setBusy(true);
    const at = new Date(when).toISOString();
    const text = cause.trim().slice(0, 200) || null;
    const { data: found } = await supabase.from("players").select("id").ilike("name", r.player_name).limit(1);
    const patch = {
      is_dead: true, died_at: at, death_cause: text, death_location: loc,
      ...(loc === "main" ? { main_died_at: at, main_death_cause: text } : { island_died_at: at, island_death_cause: text }),
    };
    const id = found?.[0]?.id;
    if (id) await supabase.from("players").update(patch).eq("id", id);
    else await supabase.from("players").insert({ name: r.player_name, role: "Speler", ...patch });
    await db.from("death_reports").update({ status: "approved", died_at: at, cause: text, location: loc }).eq("id", r.id);
    sendPush("deaths", `☠ ${r.player_name} is dood`, text ?? `${r.player_name} is gestorven op LowkeySMP.`);
    qc.invalidateQueries({ queryKey: ["players"] });
    setBusy(false); done();
  };
  const reject = async () => { await db.from("death_reports").update({ status: "rejected" }).eq("id", r.id); done(); };

  return (
    <div className="block-card space-y-3 p-4">
      <div className="flex items-center gap-3">
        <Skin name={r.player_name} size={48} className="size-12" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-pixel text-lg font-bold">{r.player_name}</p>
          <p className="text-xs text-muted-foreground">Gemeld door de server</p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-[auto_1fr_auto]">
        <input className="field" type="datetime-local" aria-label="Tijdstip" value={when} onChange={(e) => setWhen(e.target.value)} />
        <input className="field" aria-label="Doodsoorzaak" placeholder="Doodsoorzaak" value={cause} onChange={(e) => setCause(e.target.value)} />
        <select className="field" aria-label="Waar" value={loc} onChange={(e) => setLoc(e.target.value as "main" | "island")}>
          <option value="main">Hoofdeiland</option>
          <option value="island">Verliezers-eiland</option>
        </select>
      </div>
      <div className="flex flex-wrap gap-2">
        <button className="btn-block !py-1.5 text-xs" disabled={busy} onClick={approve}><Check className="size-4" /> Goedkeuren</button>
        <button className="btn-block btn-block-secondary !py-1.5 text-xs" onClick={reject}><X className="size-4" /> Weigeren</button>
      </div>
    </div>
  );
}

export function DeathReports({ onChange }: { onChange?: () => void }) {
  const [rows, setRows] = useState<DeathReport[] | null>(null);
  const [name, setName] = useState("");
  const load = useCallback(() => {
    db.from("death_reports").select("*").eq("status", "pending").order("died_at").then(({ data }: { data: DeathReport[] | null }) => setRows(data ?? []));
  }, []);
  useEffect(() => { load(); const t = window.setInterval(load, 20_000); return () => window.clearInterval(t); }, [load]);
  const done = () => { load(); onChange?.(); };
  const addManual = async (e: React.FormEvent) => {
    e.preventDefault();
    await db.from("death_reports").insert({ player_name: name.trim().slice(0, 32), died_at: new Date().toISOString() });
    setName(""); done();
  };

  return (
    <section className="space-y-4">
      <p className="text-sm text-muted-foreground">Elke death die de server doorgeeft komt hier met het echte tijdstip en de echte oorzaak. Pas het aan als het nodig is en keur goed: de speler gaat op dood en komt op de tijdlijn.</p>
      {rows === null && <p className="text-muted-foreground">Laden…</p>}
      {rows?.length === 0 && <div className="block-card p-6 text-center text-muted-foreground">Geen deaths die wachten.</div>}
      {rows?.map((r) => <Row key={r.id} r={r} done={done} />)}
      <form onSubmit={addManual} className="block-card flex flex-wrap gap-3 p-4">
        <input className="field min-w-0 flex-1" placeholder="Death zelf toevoegen: Minecraft naam" value={name} onChange={(e) => setName(e.target.value)} required />
        <button className="btn-block btn-block-secondary">Toevoegen</button>
      </form>
    </section>
  );
}
