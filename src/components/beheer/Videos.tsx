import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Trash2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { db } from "@/lib/cms";
import { fmtDate, useTrailers } from "@/lib/smp";
import { sendPush } from "@/lib/notify";

type Kind = "trailer" | "explainer";
const KIND_LABEL: Record<Kind, string> = { trailer: "Main trailer", explainer: "Uitlegvideo" };

export function VideosAdmin() {
  const { data } = useTrailers();
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: ["trailers"] });
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<Kind>("trailer");
  const [yt, setYt] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const ytId = yt.match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([\w-]{11})/)?.[1] ?? (/^[\w-]{11}$/.test(yt) ? yt : null);
    if (!file && !ytId) return setMsg("Kies een videobestand of plak een geldige YouTube-link.");
    setBusy(true);
    let path: string | null = null;
    if (file) {
      setMsg(`Uploaden van ${(file.size / 1048576).toFixed(0)} MB… laat dit tabblad open staan.`);
      path = `${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g, "_")}`;
      const { error } = await supabase.storage.from("trailers").upload(path, file, { contentType: file.type });
      if (error) { setBusy(false); return setMsg("Upload mislukt: " + error.message); }
    }
    const { error } = await db.from("trailers").insert({ title: title.trim().slice(0, 120), kind, video_url: path, youtube_id: path ? null : ytId });
    setBusy(false);
    if (error) return setMsg("Plaatsen mislukt: " + error.message);
    sendPush("nieuws", `🎬 Nieuw: ${title.trim()}`, "Bekijk hem op de site!");
    setTitle(""); setYt(""); setFile(null); setMsg("Geplaatst!"); refresh();
  };

  return (
    <section className="space-y-5">
      <form onSubmit={add} className="block-card space-y-3 p-4">
        <h2 className="text-xl font-bold">Video toevoegen</h2>
        <input className="field" placeholder="Titel" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <div className="flex gap-2" role="radiogroup" aria-label="Soort video">
          {(Object.keys(KIND_LABEL) as Kind[]).map((k) => (
            <button key={k} type="button" role="radio" aria-checked={kind === k} onClick={() => setKind(k)} className={`flex-1 border-2 px-3 py-2 font-pixel text-sm ${kind === k ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}>{KIND_LABEL[k]}</button>
          ))}
        </div>
        <label className="block text-sm text-muted-foreground">Videobestand uploaden (mp4, volle kwaliteit)
          <input className="field mt-2" type="file" accept="video/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </label>
        {file && <video src={URL.createObjectURL(file)} controls className="max-h-56 w-full bg-black" />}
        <input className="field" placeholder="of een YouTube-link (optioneel)" value={yt} onChange={(e) => setYt(e.target.value)} />
        <button className="btn-block" disabled={busy}><Upload className="size-4" /> {busy ? "Bezig…" : "Plaatsen"}</button>
        {msg && <p role="status" className="text-sm text-primary">{msg}</p>}
      </form>
      <div className="space-y-3">
        {data?.length === 0 && <p className="text-muted-foreground">Nog geen video's.</p>}
        {data?.map((t) => {
          const k: Kind = (t as { kind?: string }).kind === "explainer" || /uitleg/i.test(t.title) ? "explainer" : "trailer";
          return (
            <div key={t.id} className="block-card flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="truncate font-pixel font-bold">{t.title}</p>
                <p className="text-xs text-muted-foreground">{fmtDate(t.released_at)} · {t.youtube_id ? "YouTube" : "upload"}</p>
              </div>
              <select className="field !w-auto" value={k} onChange={async (e) => { await db.from("trailers").update({ kind: e.target.value }).eq("id", t.id); refresh(); }} aria-label="Soort video">
                {(Object.keys(KIND_LABEL) as Kind[]).map((x) => <option key={x} value={x}>{KIND_LABEL[x]}</option>)}
              </select>
              <button className="btn-block !bg-destructive !px-3 !py-1.5 text-xs text-white" onClick={async () => {
                if (!confirm(`"${t.title}" verwijderen?`)) return;
                if (t.video_url) await supabase.storage.from("trailers").remove([t.video_url]);
                await supabase.from("trailers").delete().eq("id", t.id); refresh();
              }}><Trash2 className="size-3.5" /> Verwijderen</button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
