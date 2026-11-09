import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { BarChart3, Eye, EyeOff, Heart, Clock, LogOut, Megaphone, Pencil, Search, Settings as Cog, ShieldCheck, Skull, Users, Video, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BEHEER_EMAIL } from "@/lib/beheer-config";
import logo from "@/assets/logo-smp.png.asset.json";
import hero from "@/assets/hero-lowkeysmp.jpg";
import { Overview } from "@/components/beheer/Overview";
import { SkinLookup } from "@/components/beheer/SkinLookup";
import { Donations, Hours, Players, Whitelist } from "@/components/beheer/sections";
import { AnnouncementsAdmin } from "@/components/beheer/Announcements";
import { VideosAdmin } from "@/components/beheer/Videos";
import { DeathReports, usePendingDeaths } from "@/components/beheer/DeathReports";
import { Settings } from "@/components/beheer/Settings";
import { FaqAdmin } from "@/components/beheer/FaqAdmin";
import { HelpCircle } from "lucide-react";

export const Route = createFileRoute("/beheer")({
  head: () => ({
    meta: [
      { title: "Beheer — LowkeySMP" },
      { name: "robots", content: "noindex" },
      { name: "description", content: "Beheerpaneel van LowkeySMP." },
      { property: "og:title", content: "Beheer — LowkeySMP" },
      { property: "og:description", content: "Beheerpaneel van LowkeySMP." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Beheer,
});

const TABS = [
  { id: "overzicht", label: "Overzicht", icon: BarChart3 },
  { id: "deaths", label: "Deaths goedkeuren", icon: Skull },
  { id: "whitelist", label: "Whitelist", icon: ShieldCheck },
  { id: "spelers", label: "Spelers & deaths", icon: Users },
  { id: "aankondigingen", label: "Aankondigingen", icon: Megaphone },
  { id: "trailers", label: "Video's", icon: Video },
  { id: "donaties", label: "Donaties", icon: Heart },
  { id: "uren", label: "Openingsuren", icon: Clock },
  { id: "vragen", label: "Vragen", icon: HelpCircle },
  { id: "skins", label: "Skin zoeken", icon: Search },
  { id: "instellingen", label: "Instellingen", icon: Cog },
] as const;
type TabId = (typeof TABS)[number]["id"];

function Logo({ className = "" }: { className?: string }) {
  return <img src={logo.url} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/logo-smp-local.png"; }} alt="LowkeySMP" className={className} />;
}

function Beheer() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
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

  if (session === undefined) return <div className="grid min-h-screen place-items-center text-muted-foreground">Laden…</div>;
  if (!session) return <Login />;
  if (isAdmin === null) return <div className="grid min-h-screen place-items-center text-muted-foreground">Laden…</div>;
  if (!isAdmin) return <NoAccess />;
  return <Dashboard />;
}

function Login() {
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [other, setOther] = useState(true);
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (err) setError(/invalid/i.test(err.message) ? "Dat wachtwoord klopt niet." : err.message);
  };

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden px-4">
      <img src={hero} alt="" className="absolute inset-0 h-full w-full scale-110 object-cover blur-md" />
      <div className="absolute inset-0 bg-background/80" />
      <form onSubmit={submit} className="pop-in block-card relative z-10 w-full max-w-sm space-y-5 p-7 text-center">
        <Logo className="mx-auto h-16 w-auto" />
        <div>
          <h1 className="font-pixel text-3xl font-bold text-primary">Welkom terug</h1>
          <p className="mt-1 text-sm text-muted-foreground">Vul het wachtwoord in om naar het beheer te gaan.</p>
        </div>
        {other && <input className="field" type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" />}
        <div className="relative">
          <input
            className="field pr-11"
            type={show ? "text" : "password"}
            placeholder="Wachtwoord"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            required
            autoComplete="current-password"
          />
          <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Verberg wachtwoord" : "Toon wachtwoord"} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground">
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        <button className="btn-block w-full justify-center" disabled={busy}>{busy ? "Bezig…" : "Inloggen"}</button>
        {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <Link to="/" className="underline hover:text-foreground">← Naar de site</Link>
          <button type="button" className="underline hover:text-foreground" onClick={() => setOther((o) => !o)}>{other ? "Standaard account" : "Ander account"}</button>
        </div>
      </form>
    </main>
  );
}

function NoAccess() {
  return (
    <main className="grid min-h-screen place-items-center px-4">
      <div className="block-card max-w-md space-y-4 border-l-4 border-l-destructive p-6">
        <h1 className="font-pixel text-xl">Geen beheerrechten</h1>
        <p className="text-sm text-muted-foreground">Je bent ingelogd, maar dit account is nog niet als beheerder aangemeld. Voer de SQL uit het bestand 0009_beheer_account.sql uit in Lovable.</p>
        <button onClick={() => supabase.auth.signOut()} className="btn-block btn-block-secondary"><LogOut className="size-4" /> Uitloggen</button>
      </div>
    </main>
  );
}

function Dashboard() {
  const read = (): TabId => {
    const h = typeof window !== "undefined" ? window.location.hash.slice(1) : "";
    return (TABS.find((t) => t.id === h)?.id ?? "overzicht") as TabId;
  };
  const [tab, setTab] = useState<TabId>("overzicht");
  useEffect(() => {
    setTab(read());
    const on = () => setTab(read());
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  const pending = usePendingDeaths();
  const go = (id: string) => { window.location.hash = id; };
  const current = TABS.find((t) => t.id === tab)!;
  const editSite = () => { try { localStorage.setItem("lk_edit", "1"); } catch { /* ignore */ } };

  return (
    <div className="admin-shell min-h-screen lg:grid lg:grid-cols-[15rem_1fr]">
      <aside className="border-b border-border bg-card/60 lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
        <div className="flex items-center gap-3 px-4 py-3 lg:flex-col lg:items-stretch lg:gap-5 lg:py-6">
          <Link to="/" className="shrink-0"><Logo className="h-10 w-auto lg:mx-auto lg:h-14" /></Link>
          <nav className="flex flex-1 gap-1 overflow-x-auto lg:flex-col lg:overflow-visible" aria-label="Beheer menu">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => go(id)}
                className={`flex shrink-0 items-center gap-2.5 px-3 py-2 text-left font-pixel text-sm transition-colors ${tab === id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}
              >
                <Icon className="size-4" /> <span className="whitespace-nowrap">{label}</span>{id === "deaths" && pending.n > 0 && <span className="ml-auto rounded-full bg-destructive px-1.5 text-[10px] text-white">{pending.n}</span>}
              </button>
            ))}
          </nav>
          <div className="hidden flex-col gap-1 border-t border-border pt-4 lg:flex">
            <Link to="/" onClick={editSite} className="flex items-center gap-2.5 px-3 py-2 font-pixel text-sm text-muted-foreground hover:bg-accent hover:text-foreground"><Pencil className="size-4" /> Site bewerken</Link>
            <Link to="/" className="flex items-center gap-2.5 px-3 py-2 font-pixel text-sm text-muted-foreground hover:bg-accent hover:text-foreground"><ExternalLink className="size-4" /> Naar de site</Link>
            <button onClick={() => supabase.auth.signOut()} className="flex items-center gap-2.5 px-3 py-2 text-left font-pixel text-sm text-muted-foreground hover:bg-destructive/15 hover:text-destructive"><LogOut className="size-4" /> Uitloggen</button>
          </div>
        </div>
      </aside>

      <main className="min-w-0 px-4 py-6 sm:px-8 sm:py-10">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-pixel text-[10px] uppercase tracking-[0.22em] text-secondary">LowkeySMP beheer</p>
            <h1 className="mt-1 flex items-center gap-2 text-3xl font-bold text-primary"><current.icon className="size-7" /> {current.label}</h1>
          </div>
          <div className="flex gap-2 lg:hidden">
            <Link to="/" onClick={editSite} className="btn-block btn-block-secondary !px-3 !py-1.5 text-xs"><Pencil className="size-3.5" /> Site bewerken</Link>
            <button onClick={() => supabase.auth.signOut()} className="btn-block btn-block-secondary !px-3 !py-1.5 text-xs"><LogOut className="size-3.5" /> Uitloggen</button>
          </div>
        </header>
        {tab === "overzicht" && <Overview go={go} />}
        {tab === "deaths" && <DeathReports onChange={pending.reload} />}
        {tab === "whitelist" && <Whitelist />}
        {tab === "spelers" && <Players />}
        {tab === "aankondigingen" && <AnnouncementsAdmin />}
        {tab === "trailers" && <VideosAdmin />}
        {tab === "donaties" && <Donations />}
        {tab === "uren" && <Hours />}
        {tab === "vragen" && <FaqAdmin />}
        {tab === "skins" && <SkinLookup />}
        {tab === "instellingen" && <Settings />}
      </main>
    </div>
  );
}
