import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useAnnouncements, usePlayers, useHours, useTrailers, useDonations, fmtEuro } from "@/lib/smp";
import { sendPush } from "@/lib/notify";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Beheer — LowkeySMP" },
      { name: "description", content: "Beheer aankondigingen, spelers, deaths en openingsuren van LowkeySMP." },
      { property: "og:title", content: "Beheer — LowkeySMP" },
      { property: "og:description", content: "Beheerpaneel van LowkeySMP." },
    ],
  }),
  component: Admin,
});

function Admin() {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return setIsAdmin(null);
    supabase.rpc("claim_admin").then(({ data }) => setIsAdmin(!!data));
  }, [session]);

  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-primary">Beheer</h1>
        <div className="flex gap-4 text-sm">
          <Link to="/" className="underline">← Site</Link>
          {session && <button onClick={() => supabase.auth.signOut()} className="underline">Uitloggen</button>}
        </div>
      </div>
      {!session ? <Login /> : isAdmin === null ? <p>Laden…</p> : !isAdmin ? (
        <p className="block-card p-5">Je bent ingelogd maar geen beheerder. Vraag de owner om toegang.</p>
      ) : (
        <div className="space-y-12">
          <Stats />
          <Whitelist />
          <Announcements />
          <TrailersAdmin />
          <Donations />
          <Players />
          <Hours />
        </div>
      )}
    </main>
  );
}

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"in" | "up">("in");
  const [msg, setMsg] = useState("");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    const { error, data } =
      mode === "in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/admin` } });
    if (error) setMsg(error.message);
    else if (mode === "up" && !data.session) setMsg("Check je mail om je account te bevestigen.");
  };
  return (
    <form onSubmit={submit} className="block-card space-y-4 p-6">
      <p className="text-sm text-muted-foreground">De eerste persoon die een account maakt wordt automatisch beheerder.</p>
      <input className="field" type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <input className="field" type="password" placeholder="Wachtwoord" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
      <button className="btn-block">{mode === "in" ? "Inloggen" : "Account maken"}</button>
      <button type="button" className="ml-4 text-sm underline" onClick={() => setMode(mode === "in" ? "up" : "in")}>
        {mode === "in" ? "Nog geen account?" : "Al een account?"}
      </button>
      {msg && <p className="text-sm text-primary">{msg}</p>}
    </form>
  );
}

function useRefresh() {
  const qc = useQueryClient();
  return (key: string) => qc.invalidateQueries({ queryKey: [key] });
}

function Announcements() {
  const { data } = useAnnouncements();
  const refresh = useRefresh();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("announcements").insert({ title: title.trim().slice(0, 200), body: body.slice(0, 5000) });
    if (!error) sendPush("nieuws", `📢 ${title.trim()}`, body.slice(0, 300));
    setTitle(""); setBody(""); refresh("announcements");
  };
  return (
    <section>
      <h2 className="mb-4 text-2xl font-bold">Aankondigingen</h2>
      <form onSubmit={add} className="block-card mb-4 space-y-3 p-4">
        <input className="field" placeholder="Titel" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <textarea className="field" rows={3} placeholder="Bericht" value={body} onChange={(e) => setBody(e.target.value)} />
        <button className="btn-block">Plaatsen</button>
      </form>
      {data?.map((a) => (
        <div key={a.id} className="flex items-center justify-between border-b-2 border-border py-2">
          <span>{a.pinned && "📌 "}{a.title}</span>
          <div className="flex gap-3 text-sm">
            <button className="underline" onClick={async () => { await supabase.from("announcements").update({ pinned: !a.pinned }).eq("id", a.id); refresh("announcements"); }}>{a.pinned ? "Unpin" : "Pin"}</button>
            <button className="text-destructive underline" onClick={async () => { await supabase.from("announcements").delete().eq("id", a.id); refresh("announcements"); }}>Verwijder</button>
          </div>
        </div>
      ))}
    </section>
  );
}

function Players() {
  const { data } = usePlayers();
  const refresh = useRefresh();
  const [name, setName] = useState("");
  const [role, setRole] = useState("Speler");
  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from("players").insert({ name: name.trim().slice(0, 32), role: role.trim().slice(0, 40) || "Speler" });
    setName(""); refresh("players");
  };
  const update = async (
    id: string,
    patch: { name?: string; role?: string; team?: string | null; is_dead?: boolean; died_at?: string | null; death_cause?: string | null },
  ) => {
    await supabase.from("players").update(patch).eq("id", id);
    refresh("players");
  };
  return (
    <section>
      <h2 className="mb-4 text-2xl font-bold">Spelers & deaths</h2>
      <form onSubmit={add} className="block-card mb-4 flex flex-wrap gap-3 p-4">
        <input className="field flex-1" placeholder="Minecraft naam" value={name} onChange={(e) => setName(e.target.value)} required />
        <input className="field w-32" placeholder="Rol" value={role} onChange={(e) => setRole(e.target.value)} />
        <button className="btn-block">Toevoegen</button>
      </form>
      <div className="space-y-3">
        {data?.map((p) => (
          <div key={p.id} className="block-card space-y-2 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <input className="field flex-1" defaultValue={p.name} onBlur={(e) => e.target.value !== p.name && update(p.id, { name: e.target.value.slice(0, 32) })} />
              <input className="field w-32" defaultValue={p.role} onBlur={(e) => e.target.value !== p.role && update(p.id, { role: e.target.value.slice(0, 40) })} />
              <select className="field w-28" value={p.team ?? ""} onChange={(e) => update(p.id, { team: e.target.value || null })}>
                <option value="">Geen team</option>
                <option value="noord">Noord (rood)</option>
                <option value="zuid">Zuid (blauw)</option>
              </select>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={p.is_dead} onChange={(e) => {
                  update(p.id, { is_dead: e.target.checked, died_at: e.target.checked ? new Date().toISOString() : null, death_cause: e.target.checked ? p.death_cause : null });
                  if (e.target.checked) sendPush("deaths", `☠ ${p.name} is dood`, `${p.name} is gestorven op LowkeySMP.`);
                }} />
                Dood
              </label>
              <button className="text-sm text-destructive underline" onClick={async () => { await supabase.from("players").delete().eq("id", p.id); refresh("players"); }}>Verwijder</button>
            </div>
            {p.is_dead && (
              <div className="flex flex-wrap gap-2">
                <input
                  type="datetime-local"
                  className="field w-auto"
                  defaultValue={p.died_at ? new Date(new Date(p.died_at).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ""}
                  onBlur={(e) => e.target.value && update(p.id, { died_at: new Date(e.target.value).toISOString() })}
                />
                <input className="field flex-1" placeholder="Doodsoorzaak (bv. Creeper)" defaultValue={p.death_cause ?? ""} onBlur={(e) => update(p.id, { death_cause: e.target.value.slice(0, 200) })} />
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function Hours() {
  const { data } = useHours();
  const refresh = useRefresh();
  const [day, setDay] = useState("");
  const [hours, setHours] = useState("");
  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from("opening_hours").insert({ day: day.slice(0, 60), hours: hours.slice(0, 60), sort: (data?.length ?? 0) + 1 });
    setDay(""); setHours(""); refresh("hours");
  };
  return (
    <section>
      <h2 className="mb-4 text-2xl font-bold">Openingsuren</h2>
      <div className="space-y-2">
        {data?.map((h) => (
          <div key={h.id} className="flex gap-2">
            <input className="field" defaultValue={h.day} onBlur={async (e) => { await supabase.from("opening_hours").update({ day: e.target.value.slice(0, 60) }).eq("id", h.id); refresh("hours"); }} />
            <input className="field" defaultValue={h.hours} onBlur={async (e) => { await supabase.from("opening_hours").update({ hours: e.target.value.slice(0, 60) }).eq("id", h.id); refresh("hours"); }} />
            <button className="text-sm text-destructive underline" onClick={async () => { await supabase.from("opening_hours").delete().eq("id", h.id); refresh("hours"); }}>✕</button>
          </div>
        ))}
      </div>
      <form onSubmit={add} className="mt-3 flex gap-2">
        <input className="field" placeholder="Dag" value={day} onChange={(e) => setDay(e.target.value)} required />
        <input className="field" placeholder="Uren" value={hours} onChange={(e) => setHours(e.target.value)} required />
        <button className="btn-block">+</button>
      </form>
    </section>
  );
}

function Whitelist() {
  const qc = useQueryClient();
  const [rows, setRows] = useState<{ id: string; mc_name: string; irl_name: string; status: string; created_at: string }[]>([]);
  const [copied, setCopied] = useState("");
  const load = () =>
    supabase.from("whitelist_requests").select("*").eq("status", "pending").order("created_at").then(({ data }) => setRows(data ?? []));
  useEffect(() => { load(); }, []);
  const accept = async (r: (typeof rows)[number]) => {
    setRows((x) => x.filter((y) => y.id !== r.id));
    await supabase.from("whitelist_requests").update({ status: "approved" }).eq("id", r.id);
    await supabase.from("players").insert({ name: r.mc_name, role: "Speler" });
    navigator.clipboard?.writeText(`/whitelist add ${r.mc_name}`);
    setCopied(r.mc_name);
    qc.invalidateQueries({ queryKey: ["players"] });
    load();
  };
  const reject = async (id: string) => {
    setRows((x) => x.filter((y) => y.id !== id));
    await supabase.from("whitelist_requests").update({ status: "rejected" }).eq("id", id);
    load();
  };
  return (
    <section>
      <h2 className="mb-4 text-2xl font-bold">Whitelist aanvragen</h2>
      {copied && <p className="mb-3 text-sm text-primary">"/whitelist add {copied}" gekopieerd — plak het in de serverconsole.</p>}
      {rows.length === 0 && <p className="text-muted-foreground">Geen openstaande aanvragen.</p>}
      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.id} className="block-card flex flex-wrap items-center gap-3 p-4">
            <img src={`https://mc-heads.net/avatar/${encodeURIComponent(r.mc_name)}/40`} alt="" className="h-10 w-10 [image-rendering:pixelated]" />
            <div className="flex-1">
              <p className="font-pixel font-bold">{r.mc_name}</p>
              <p className="text-sm text-muted-foreground">{r.irl_name}</p>
            </div>
            <button className="btn-block" onClick={() => accept(r)}>Toegevoegd</button>
            <button className="text-sm text-destructive underline" onClick={() => reject(r.id)}>Weiger</button>
          </div>
        ))}
      </div>
    </section>
  );
}

function Stats() {
  const [s, setS] = useState<{ label: string; value: number }[] | null>(null);
  useEffect(() => {
    supabase
      .from("site_events")
      .select("kind, visitor_id, created_at")
      .limit(10000)
      .then(({ data }) => {
        const rows = data ?? [];
        const uniq = (k: string, since = 0) =>
          new Set(rows.filter((r) => r.kind === k && +new Date(r.created_at) >= since).map((r) => r.visitor_id)).size;
        const today = new Date(); today.setHours(0, 0, 0, 0);
        setS([
          { label: "Bezoekers vandaag", value: uniq("visit", +today) },
          { label: "Bezoekers totaal", value: uniq("visit") },
          { label: "Bezoeken totaal", value: rows.filter((r) => r.kind === "visit").length },
          { label: "📢 Meldingen aan", value: uniq("sub_nieuws") },
          { label: "☠ Dood meldingen aan", value: uniq("sub_deaths") },
        ]);
      });
  }, []);
  return (
    <section>
      <h2 className="mb-4 text-2xl font-bold">Statistieken</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {(s ?? []).map((x) => (
          <div key={x.label} className="block-card p-4">
            <p className="font-pixel text-3xl text-primary">{x.value}</p>
            <p className="text-xs text-muted-foreground">{x.label}</p>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Meldingen = aantal toestellen dat op "Aanzetten" tikte.</p>
    </section>
  );
}

function TrailersAdmin() {
  const { data } = useTrailers();
  const refresh = useRefresh();
  const [title, setTitle] = useState("");
  const [yt, setYt] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState("");
  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const ytId = yt.match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([\w-]{11})/)?.[1] ?? (/^[\w-]{11}$/.test(yt) ? yt : null);
    if (!file && !ytId) return setBusy("Kies een videobestand of plak een geldige YouTube-link.");
    let path: string | null = null;
    if (file) {
      setBusy("Uploaden… (kan even duren bij grote video's)");
      path = `${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g, "_")}`;
      const { error } = await supabase.storage.from("trailers").upload(path, file, { contentType: file.type });
      if (error) return setBusy("Upload mislukt: " + error.message);
    }
    await supabase.from("trailers").insert({ title: title.trim().slice(0, 120), video_url: path, youtube_id: path ? null : ytId });
    sendPush("nieuws", `🎬 Nieuwe trailer: ${title.trim()}`, "Bekijk hem op de site!");
    setTitle(""); setYt(""); setFile(null); setBusy("Geplaatst!"); refresh("trailers");
  };
  return (
    <section>
      <h2 className="mb-4 text-2xl font-bold">Trailers</h2>
      <form onSubmit={add} className="block-card mb-4 space-y-3 p-4">
        <input className="field" placeholder="Titel" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <p className="text-sm text-muted-foreground">Upload een videobestand in volle kwaliteit (mp4, max 2 GB) — of plak een YouTube-link.</p>
        <input className="field" type="file" accept="video/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        <input className="field" placeholder="YouTube-link (optioneel)" value={yt} onChange={(e) => setYt(e.target.value)} />
        <button className="btn-block" disabled={busy.startsWith("Uploaden")}>Plaatsen</button>
        {busy && <p className="text-sm text-primary">{busy}</p>}
      </form>
      {data?.map((t, i) => (
        <div key={t.id} className="flex items-center justify-between border-b-2 border-border py-2">
          <span>{i === 0 && "⭐ "}{t.title} <span className="text-xs text-muted-foreground">({t.youtube_id ? "YouTube" : "upload"})</span></span>
          <button className="text-sm text-destructive underline" onClick={async () => {
            if (t.video_url) await supabase.storage.from("trailers").remove([t.video_url]);
            await supabase.from("trailers").delete().eq("id", t.id); refresh("trailers");
          }}>Verwijder</button>
        </div>
      ))}
    </section>
  );
}

function Donations() {
  const { data } = useDonations();
  const refresh = useRefresh();
  const [ign, setIgn] = useState("");
  const [irl, setIrl] = useState("");
  const [amount, setAmount] = useState("");
  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from("donations").insert({ ign: ign.trim().slice(0, 32), irl_name: irl.trim().slice(0, 60), amount: Math.max(0, Number(amount) || 0) });
    setIgn(""); setIrl(""); setAmount(""); refresh("donations");
  };
  const update = async (id: string, patch: { ign?: string; irl_name?: string; amount?: number }) => {
    await supabase.from("donations").update(patch).eq("id", id); refresh("donations");
  };
  return (
    <section>
      <h2 className="mb-4 text-2xl font-bold">💛 Donatiebord</h2>
      <form onSubmit={add} className="block-card mb-4 flex flex-wrap gap-3 p-4">
        <input className="field flex-1" placeholder="IGN" value={ign} onChange={(e) => setIgn(e.target.value)} required />
        <input className="field flex-1" placeholder="Echte naam" value={irl} onChange={(e) => setIrl(e.target.value)} />
        <input className="field w-28" type="number" min="0" step="0.01" placeholder="€" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        <button className="btn-block">Toevoegen</button>
      </form>
      <div className="space-y-2">
        {data?.map((d) => (
          <div key={d.id} className="flex flex-wrap items-center gap-2">
            <input className="field flex-1" defaultValue={d.ign} onBlur={(e) => e.target.value !== d.ign && update(d.id, { ign: e.target.value.slice(0, 32) })} />
            <input className="field flex-1" defaultValue={d.irl_name} onBlur={(e) => e.target.value !== d.irl_name && update(d.id, { irl_name: e.target.value.slice(0, 60) })} />
            <input className="field w-28" type="number" min="0" step="0.01" defaultValue={Number(d.amount)} onBlur={(e) => Number(e.target.value) !== Number(d.amount) && update(d.id, { amount: Math.max(0, Number(e.target.value) || 0) })} />
            <span className="w-20 text-right text-sm text-muted-foreground">{fmtEuro(Number(d.amount))}</span>
            <button className="text-sm text-destructive underline" onClick={async () => { await supabase.from("donations").delete().eq("id", d.id); refresh("donations"); }}>✕</button>
          </div>
        ))}
      </div>
    </section>
  );
}
