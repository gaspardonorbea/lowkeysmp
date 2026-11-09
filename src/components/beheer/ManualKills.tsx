import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Save, Swords } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export function ManualKills() {
  const qc = useQueryClient();
  const stats = useQuery({ queryKey: ["player_stats"], queryFn: async () => {
    const { data, error } = await supabase.from("player_stats").select("uuid,name,kills").order("name");
    if (error) throw error;
    return data;
  }});
  const [uuid, setUuid] = useState("");
  const [kills, setKills] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    const total = Number(kills);
    if (!uuid || kills === "" || !Number.isInteger(total) || total < 0 || busy) return;
    setBusy(true); setMessage("");
    const { error } = await supabase.rpc("set_player_kills", { _uuid: uuid, _kills: total });
    setBusy(false);
    setMessage(error ? `Opslaan mislukt: ${error.message}` : "Kills opgeslagen.");
    if (!error) await qc.invalidateQueries({ queryKey: ["player_stats"] });
  };
  return <section className="mb-6 border-y border-border py-4">
    <h3 className="mb-3 flex items-center gap-2 font-pixel text-primary"><Swords className="size-4" /> Kills</h3>
    <form onSubmit={save} className="flex flex-wrap items-end gap-3">
      <label className="w-full min-w-0 text-sm sm:w-auto sm:flex-1">Speler
        <select aria-label="Speler voor kills" className="field mt-1" value={uuid} onChange={(e) => {
          setUuid(e.target.value); setKills(String(stats.data?.find((p) => p.uuid === e.target.value)?.kills ?? 0)); setMessage("");
        }} disabled={busy} required>
          <option value="">Kies speler</option>
          {stats.data?.map((p) => <option key={p.uuid} value={p.uuid}>{p.name} · {p.kills} kills</option>)}
        </select>
      </label>
      <label className="text-sm">Totaal kills
        <input aria-label="Totaal kills" className="field mt-1 w-28" type="number" min="0" max="2147483647" step="1" value={kills} onChange={(e) => setKills(e.target.value)} required disabled={!uuid || busy} />
      </label>
      <Button type="submit" disabled={!uuid || busy}><Save /> {busy ? "Opslaan…" : "Opslaan"}</Button>
    </form>
    {stats.isPending && <p className="mt-2 text-sm text-muted-foreground">Spelers laden…</p>}
    {stats.isError && <p role="alert" className="mt-2 text-sm text-destructive">Spelers laden mislukt.</p>}
    {message && <p role="status" className="mt-2 text-sm">{message}</p>}
  </section>;
}