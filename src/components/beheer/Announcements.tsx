import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Pin, PinOff, Trash2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { db } from "@/lib/cms";
import { fmtDate, useAnnouncements, type AnnouncementRow } from "@/lib/smp";
import { sendPush } from "@/lib/notify";

const BUCKET = "announcement-images";
const MAX = 5 * 1024 * 1024;

async function uploadPhotos(files: File[]): Promise<{ paths: string[]; error?: string }> {
  const paths: string[] = [];
  for (const f of files) {
    if (!f.type.startsWith("image/") || f.size > MAX) return { paths, error: `${f.name}: kies een afbeelding van maximaal 5 MB.` };
    const path = `${crypto.randomUUID()}-${f.name.replace(/[^\w.-]/g, "_")}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, f, { contentType: f.type });
    if (error) return { paths, error: `Uploaden mislukt: ${error.message}` };
    paths.push(path);
  }
  return { paths };
}

function Photos({ files, onRemove }: { files: File[]; onRemove: (i: number) => void }) {
  if (!files.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {files.map((f, i) => (
        <div key={`${f.name}-${i}`} className="relative">
          <img src={URL.createObjectURL(f)} alt="" className="size-20 border-2 border-border object-cover" />
          <button type="button" onClick={() => onRemove(i)} aria-label="Foto weghalen" className="absolute -right-2 -top-2 rounded-full bg-destructive p-0.5 text-white"><X className="size-3.5" /></button>
        </div>
      ))}
    </div>
  );
}

function Item({ a, refresh }: { a: AnnouncementRow; refresh: () => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(a.title);
  const [body, setBody] = useState(a.body);
  const [add, setAdd] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const paths = a.paths; // every photo as a storage path, so one photo can be removed and the rest stays

  const save = async () => {
    setBusy(true); setMsg("");
    const up = await uploadPhotos(add);
    if (up.error) { setMsg(up.error); setBusy(false); return; }
    const images = [...paths, ...up.paths];
    const { error } = await db.from("announcements").update({ title: title.trim().slice(0, 200), body: body.slice(0, 5000), images, image_url: null }).eq("id", a.id);
    setBusy(false);
    if (error) return setMsg(error.message);
    setAdd([]); setOpen(false); refresh();
  };
  const removePhoto = async (path: string) => {
    await supabase.storage.from(BUCKET).remove([path]);
    await db.from("announcements").update({ images: paths.filter((p) => p !== path), image_url: null }).eq("id", a.id);
    refresh();
  };
  const del = async () => {
    if (!confirm(`"${a.title}" verwijderen?`)) return;
    if (paths.length) await supabase.storage.from(BUCKET).remove(paths.map((p) => (p.includes("/announcement-images/") ? decodeURIComponent(p.split("/announcement-images/")[1]!.split("?")[0]!) : p)));
    await supabase.from("announcements").delete().eq("id", a.id);
    refresh();
  };

  return (
    <article className="block-card p-4">
      <div className="flex flex-wrap items-start gap-3">
        {a.photos[0] && <img src={a.photos[0]} alt="" className="size-16 shrink-0 border-2 border-border object-cover" />}
        <div className="min-w-0 flex-1">
          <p className="truncate font-pixel text-lg font-bold">{a.pinned && "📌 "}{a.title}</p>
          <p className="text-xs text-muted-foreground">{fmtDate(a.created_at)} · {a.photos.length} {a.photos.length === 1 ? "foto" : "foto's"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn-block btn-block-secondary !px-3 !py-1.5 text-xs" onClick={() => setOpen((o) => !o)}>{open ? "Sluiten" : "Aanpassen"}</button>
          <button className="btn-block btn-block-secondary !px-3 !py-1.5 text-xs" onClick={async () => { await supabase.from("announcements").update({ pinned: !a.pinned }).eq("id", a.id); refresh(); }}>{a.pinned ? <PinOff className="size-3.5" /> : <Pin className="size-3.5" />}{a.pinned ? "Unpin" : "Pin"}</button>
          <button className="btn-block !bg-destructive !px-3 !py-1.5 text-xs text-white" onClick={del}><Trash2 className="size-3.5" /> Verwijderen</button>
        </div>
      </div>
      {open && (
        <div className="mt-4 space-y-3 border-t border-border pt-4">
          <input className="field" value={title} onChange={(e) => setTitle(e.target.value)} />
          <textarea className="field" rows={4} value={body} onChange={(e) => setBody(e.target.value)} />
          {paths.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {paths.map((path, i) => (
                <div key={path} className="relative">
                  <img src={a.photos[i]} alt="" className="size-20 border-2 border-border object-cover" />
                  <button type="button" onClick={() => removePhoto(path)} aria-label="Foto verwijderen" className="absolute -right-2 -top-2 rounded-full bg-destructive p-0.5 text-white"><Trash2 className="size-3.5" /></button>
                </div>
              ))}
            </div>
          )}
          <Photos files={add} onRemove={(i) => setAdd((f) => f.filter((_, j) => j !== i))} />
          <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => { setAdd((f) => [...f, ...Array.from(e.target.files ?? [])]); e.target.value = ""; }} />
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-block btn-block-secondary !py-1.5 text-xs" onClick={() => input.current?.click()}><ImagePlus className="size-4" /> Foto's toevoegen</button>
            <button type="button" className="btn-block !py-1.5 text-xs" disabled={busy} onClick={save}>{busy ? "Bezig…" : "Opslaan"}</button>
          </div>
          {msg && <p className="text-sm text-destructive">{msg}</p>}
        </div>
      )}
    </article>
  );
}

export function AnnouncementsAdmin() {
  const { data } = useAnnouncements();
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: ["announcements"] });
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const input = useRef<HTMLInputElement>(null);

  const post = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setMsg("");
    const up = await uploadPhotos(files);
    if (up.error) { setMsg(up.error); setBusy(false); return; }
    const { error } = await db.from("announcements").insert({ title: title.trim().slice(0, 200), body: body.slice(0, 5000), images: up.paths });
    if (error) {
      if (up.paths.length) await supabase.storage.from(BUCKET).remove(up.paths);
      setMsg(`Plaatsen mislukt: ${error.message}`);
    } else {
      sendPush("nieuws", `📢 ${title.trim()}`, body.slice(0, 300));
      setTitle(""); setBody(""); setFiles([]); setMsg("Aankondiging geplaatst."); refresh();
    }
    setBusy(false);
  };

  return (
    <section className="space-y-5">
      <form onSubmit={post} className="block-card space-y-3 p-4">
        <h2 className="text-xl font-bold">Nieuwe aankondiging</h2>
        <input className="field" placeholder="Titel" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <textarea className="field" rows={4} placeholder="Bericht" value={body} onChange={(e) => setBody(e.target.value)} />
        <Photos files={files} onRemove={(i) => setFiles((f) => f.filter((_, j) => j !== i))} />
        <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => { setFiles((f) => [...f, ...Array.from(e.target.files ?? [])]); e.target.value = ""; }} />
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-block btn-block-secondary" onClick={() => input.current?.click()}><ImagePlus className="size-4" /> Foto's kiezen</button>
          <button className="btn-block" disabled={busy}>{busy ? "Bezig…" : "Plaatsen"}</button>
        </div>
        {msg && <p role="status" className="text-sm text-primary">{msg}</p>}
      </form>
      <div className="space-y-3">
        {data?.length === 0 && <p className="text-muted-foreground">Nog geen aankondigingen.</p>}
        {data?.map((a) => <Item key={a.id} a={a} refresh={refresh} />)}
      </div>
    </section>
  );
}
