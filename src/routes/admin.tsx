import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useAnnouncements, usePlayers, useHours } from "@/lib/smp";
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
          <Announcements />
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
    patch: { name?: string; role?: string; is_dead?: boolean; died_at?: string | null; death_cause?: string | null },
  ) => {
    await supabase.from("players").update(patch).eq("id", id);
    refresh("players");
  };
  return (
    <section>
      <h2 className="mb-4 text-2xl font-bold">Namenblad & deaths</h2>
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
