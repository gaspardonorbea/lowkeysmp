import { useEffect, useState } from "react";
import { Skin } from "@/components/Skin";
import { T, useContent } from "@/lib/cms";
import { supabase } from "@/integrations/supabase/client";

export const SERVER_IP = "170.23.139.89:25606";
// 7 november 14:00 Belgische tijd (CET, UTC+1)
export const LAUNCH_AT = new Date("2026-11-07T14:00:00+01:00").getTime();

/** The IP and the opening moment can be changed in the beheer (Instellingen). */
export const useServerIp = () => useContent<string>("server.ip", SERVER_IP);
export const useLaunchAt = () => {
  const iso = useContent<string>("server.opens", "");
  const t = iso ? new Date(iso).getTime() : NaN;
  return Number.isFinite(t) ? t : LAUNCH_AT;
};

export function ServerIp() {
  const ip = useServerIp();
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(ip);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="block-card flex flex-wrap items-center gap-3 p-6">
      <code className="border-2 border-border px-3 py-2 font-pixel text-secondary">{ip}</code>
      <button onClick={copy} className="btn-block">{copied ? "Gekopieerd!" : "Kopieer IP"}</button>
    </div>
  );
}

export function Countdown() {
  const LAUNCH = useLaunchAt();
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (now === null || now >= LAUNCH) return null;
  const d = LAUNCH - now;
  const parts = [
    [Math.floor(d / 864e5), "dagen"],
    [Math.floor(d / 36e5) % 24, "uren"],
    [Math.floor(d / 6e4) % 60, "min"],
    [Math.floor(d / 1e3) % 60, "sec"],
  ] as const;
  return (
    <div className="mt-8">
      <p className="mb-3 font-pixel text-sm text-muted-foreground"><T k="hero.countdown.label" def="Server opent over" /></p>
      <div className="flex justify-center gap-3">
        {parts.map(([v, l]) => (
          <div key={l} className="block-card w-20 px-2 py-3">
            <p className="font-pixel text-3xl text-primary">{String(v).padStart(2, "0")}</p>
            <p className="text-xs text-muted-foreground"><T k={`hero.countdown.${l}`} def={l} /></p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function WhitelistForm() {
  const [mc, setMc] = useState("");
  const [irl, setIrl] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const valid = /^[A-Za-z0-9_]{3,16}$/.test(mc);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!valid) return setMsg({ ok: false, text: "Ongeldige Minecraft username (3 tot 16 tekens, letters, cijfers of _)." });
    if (irl.trim().length < 2) return setMsg({ ok: false, text: "Vul je echte naam in." });
    setBusy(true);
    const { error } = await supabase.from("whitelist_requests").insert({ mc_name: mc, irl_name: irl.trim().slice(0, 60) });
    setBusy(false);
    if (error) setMsg({ ok: false, text: "Er ging iets mis, probeer opnieuw." });
    else { setMsg({ ok: true, text: "Aanvraag verstuurd! De admin bekijkt hem zo snel mogelijk." }); setMc(""); setIrl(""); }
  };
  return (
    <form onSubmit={submit} className="block-card grid gap-5 p-6 sm:grid-cols-[auto_1fr_auto] sm:items-end">
      <Skin name={mc} size={64}
        alt=""
        className="mx-auto h-16 w-16 [image-rendering:pixelated] sm:mx-0 sm:self-center"
      />
      <div className="flex min-w-0 flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm text-muted-foreground">
          Minecraft username (Java)
          <input className="field" placeholder="bv. Steve" value={mc} onChange={(e) => setMc(e.target.value.trim())} required maxLength={16} autoComplete="off" />
        </label>
        <label className="flex flex-col gap-1 text-sm text-muted-foreground">
          Echte naam
          <input className="field" placeholder="Voornaam" value={irl} onChange={(e) => setIrl(e.target.value)} required maxLength={60} autoComplete="name" />
        </label>
      </div>
      <button className="btn-block justify-center" disabled={busy}>{busy ? "Versturen..." : "Aanmelden"}</button>
      {msg && <p className={`text-sm sm:col-span-3 ${msg.ok ? "text-success" : "text-destructive"}`} role="status">{msg.text}</p>}
    </form>
  );
}
