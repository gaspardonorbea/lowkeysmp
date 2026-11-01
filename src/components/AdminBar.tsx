import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { ArrowDown, ArrowUp, CalendarDays, LayoutGrid, Pencil, Plus, Settings, Trash2, X } from "lucide-react";
import { useContent, useEdit, useSaveContent } from "@/lib/cms";
import { CUSTOM_LABELS, useBlocks, type Block } from "@/lib/blocks";
import { DEFAULT_EVENTS, TIMELINE_ICONS, type TlEvent } from "@/components/Timeline";

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="block-card max-h-[88vh] w-full max-w-3xl overflow-y-auto p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-pixel text-xl font-bold text-primary">{title}</h3>
          <button onClick={onClose} aria-label="Sluiten" className="p-1 text-muted-foreground hover:text-foreground"><X className="size-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

const toLocalInput = (iso: string) => {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

function EventsEditor({ onClose }: { onClose: () => void }) {
  const stored = useContent<TlEvent[]>("timeline.events", DEFAULT_EVENTS);
  const save = useSaveContent();
  const [rows, setRows] = useState<TlEvent[]>(() => stored.map((e) => ({ ...e })));
  const set = (i: number, patch: Partial<TlEvent>) => setRows((r) => r.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const move = (i: number, d: number) => setRows((r) => { const n = [...r]; const j = i + d; if (j < 0 || j >= n.length) return r; [n[i], n[j]] = [n[j]!, n[i]!]; return n; });
  return (
    <Modal title="Tijdlijn events" onClose={onClose}>
      <p className="mb-4 text-sm text-muted-foreground">Elk event krijgt een bubbel boven de tijdlijn op de dag die je kiest. De volgorde maakt niet uit, de datum bepaalt de plek.</p>
      <div className="space-y-3">
        {rows.map((r, i) => (
          <div key={r.id} className="grid gap-2 border-2 border-border p-3 sm:grid-cols-[1fr_1fr_auto]">
            <input className="field" value={r.title} onChange={(e) => set(i, { title: e.target.value })} placeholder="Titel" />
            <input className="field" type="datetime-local" value={toLocalInput(r.date)} onChange={(e) => e.target.value && set(i, { date: new Date(e.target.value).toISOString() })} />
            <div className="flex items-center gap-1">
              <button className="p-1.5 hover:text-primary" onClick={() => move(i, -1)} aria-label="Omhoog"><ArrowUp className="size-4" /></button>
              <button className="p-1.5 hover:text-primary" onClick={() => move(i, 1)} aria-label="Omlaag"><ArrowDown className="size-4" /></button>
              <button className="p-1.5 text-destructive" onClick={() => setRows((x) => x.filter((_, j) => j !== i))} aria-label="Verwijderen"><Trash2 className="size-4" /></button>
            </div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">Icoon
              <select className="field !w-auto" value={r.icon} onChange={(e) => set(i, { icon: e.target.value })}>
                {Object.keys(TIMELINE_ICONS).map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm text-muted-foreground"><input type="checkbox" checked={!!r.gold} onChange={(e) => set(i, { gold: e.target.checked })} /> Gouden stip (finale)</label>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <button className="btn-block btn-block-secondary" onClick={() => setRows((r) => [...r, { id: `ev-${Date.now().toString(36)}`, date: new Date().toISOString(), title: "Nieuw event", icon: "door" }])}><Plus className="size-4" /> Event toevoegen</button>
        <button className="btn-block" onClick={async () => { await save("timeline.events", rows); onClose(); }}>Opslaan</button>
        <button className="btn-block btn-block-secondary" onClick={async () => { if (confirm("Terug naar de standaard events?")) { await save("timeline.events", DEFAULT_EVENTS); onClose(); } }}>Standaard terugzetten</button>
      </div>
    </Modal>
  );
}

function AddBlock({ onClose }: { onClose: () => void }) {
  const { blocks, update } = useBlocks("home");
  const add = async (kind: string) => {
    const b: Block = { id: `${kind}-${Date.now().toString(36)}`, kind, visible: true, props: {} };
    await update([...blocks, b]);
    onClose();
  };
  return (
    <Modal title="Blok toevoegen" onClose={onClose}>
      <p className="mb-4 text-sm text-muted-foreground">Het blok komt onderaan de hoofdpagina. Sleep hem daarna naar de plek die je wilt.</p>
      <div className="grid gap-3 sm:grid-cols-3">
        {Object.entries(CUSTOM_LABELS).map(([kind, name]) => (
          <button key={kind} className="btn-block justify-center" onClick={() => add(kind)}><Plus className="size-4" /> {name}</button>
        ))}
      </div>
    </Modal>
  );
}

/** Floating toolbar for the admin. Visitors never see it. */
export function AdminBar() {
  const { isAdmin, editing, setEditing } = useEdit();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [dlg, setDlg] = useState<null | "events" | "add">(null);
  if (!isAdmin || path.startsWith("/beheer")) return null;
  return (
    <>
      <div className="fixed inset-x-0 bottom-3 z-40 flex justify-center px-3" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        <div className="flex max-w-full flex-wrap items-center justify-center gap-2 border-2 border-border bg-background/95 p-2 shadow-2xl backdrop-blur">
          <button className={`btn-block !px-3 !py-1.5 text-xs ${editing ? "" : "btn-block-secondary"}`} onClick={() => setEditing(!editing)}>
            <Pencil className="size-3.5" /> {editing ? "Bewerkmodus: aan" : "Bewerken"}
          </button>
          {editing && path === "/" && <button className="btn-block btn-block-secondary !px-3 !py-1.5 text-xs" onClick={() => setDlg("add")}><LayoutGrid className="size-3.5" /> Blok toevoegen</button>}
          {editing && <button className="btn-block btn-block-secondary !px-3 !py-1.5 text-xs" onClick={() => setDlg("events")}><CalendarDays className="size-3.5" /> Tijdlijn events</button>}
          <Link to="/beheer" className="btn-block btn-block-secondary !px-3 !py-1.5 text-xs"><Settings className="size-3.5" /> Beheer</Link>
        </div>
      </div>
      {dlg === "events" && <EventsEditor onClose={() => setDlg(null)} />}
      {dlg === "add" && <AddBlock onClose={() => setDlg(null)} />}
    </>
  );
}
