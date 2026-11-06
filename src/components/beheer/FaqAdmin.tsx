import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Row = { id: string; question: string; answer: string | null; asker_name: string | null; published: boolean; sort: number; created_at: string };

export function FaqAdmin() {
  const [rows, setRows] = useState<Row[]>([]);
  const [newQ, setNewQ] = useState("");
  const load = () => supabase.from("faq").select("*").order("published").order("sort").order("created_at").then(({ data }) => setRows(data ?? []));
  useEffect(() => { load(); }, []);
  const pending = rows.filter((r) => !r.published);
  const live = rows.filter((r) => r.published);
  const add = async () => {
    if (newQ.trim().length < 3) return;
    await supabase.from("faq").insert({ question: newQ.trim() });
    setNewQ(""); load();
  };
  return (
    <section className="scroll-mt-28 space-y-8">
      <div>
        <h2 className="mb-4 text-2xl font-bold">Nieuwe vragen ({pending.length})</h2>
        {pending.length === 0 && <p className="text-muted-foreground">Geen openstaande vragen.</p>}
        <div className="space-y-3">{pending.map((r) => <Item key={r.id} r={r} reload={load} />)}</div>
      </div>
      <div className="block-card flex gap-2 p-4">
        <input value={newQ} onChange={(e) => setNewQ(e.target.value)} placeholder="Zelf een vraag toevoegen..." className="flex-1 border-2 border-border bg-background px-3 py-2" />
        <button className="btn-block" onClick={add}>Toevoegen</button>
      </div>
      <div>
        <h2 className="mb-4 text-2xl font-bold">Online op de site ({live.length})</h2>
        <div className="space-y-3">{live.map((r) => <Item key={r.id} r={r} reload={load} />)}</div>
      </div>
    </section>
  );
}

function Item({ r, reload }: { r: Row; reload: () => void }) {
  const [q, setQ] = useState(r.question);
  const [a, setA] = useState(r.answer ?? "");
  const [sort, setSort] = useState(r.sort);
  const save = async (published: boolean) => {
    if (published && !a.trim()) return alert("Schrijf eerst een antwoord.");
    await supabase.from("faq").update({ question: q, answer: a.trim() || null, published, sort }).eq("id", r.id);
    reload();
  };
  const del = async () => { if (confirm("Vraag verwijderen?")) { await supabase.from("faq").delete().eq("id", r.id); reload(); } };
  return (
    <div className={`block-card space-y-2 p-4 ${r.published ? "" : "border-primary"}`}>
      <p className="text-xs text-muted-foreground">{r.asker_name ? `Van ${r.asker_name} · ` : ""}{new Date(r.created_at).toLocaleString("nl-BE")}</p>
      <input value={q} onChange={(e) => setQ(e.target.value)} className="w-full border-2 border-border bg-background px-3 py-2 font-bold" />
      <textarea value={a} onChange={(e) => setA(e.target.value)} rows={3} placeholder="Antwoord..." className="w-full border-2 border-border bg-background px-3 py-2" />
      <div className="flex flex-wrap items-center gap-3">
        <button className="btn-block" onClick={() => save(true)}>{r.published ? "Opslaan" : "Beantwoorden & publiceren"}</button>
        {r.published && <button className="text-sm underline" onClick={() => save(false)}>Offline halen</button>}
        <label className="text-sm text-muted-foreground">Volgorde <input type="number" value={sort} onChange={(e) => setSort(+e.target.value)} className="w-16 border-2 border-border bg-background px-1" /></label>
        <button className="ml-auto text-sm text-destructive underline" onClick={del}>Verwijder</button>
      </div>
    </div>
  );
}
