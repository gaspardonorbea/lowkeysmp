import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const SERVER_IP = "170.23.139.89:25606";
// 7 november 14:00 Belgische tijd (CET, UTC+1)
export const LAUNCH_AT = new Date("2026-11-07T14:00:00+01:00").getTime();

export function ServerIp() {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(SERVER_IP);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="block-card flex flex-wrap items-center gap-3 p-6">
      <code className="border-2 border-border px-3 py-2 font-pixel text-secondary">{SERVER_IP}</code>
      <button onClick={copy} className="btn-block">{copied ? "Gekopieerd!" : "Kopieer IP"}</button>
    </div>
  );
}

export function Countdown() {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (now === null || now >= LAUNCH_AT) return null;
  const d = LAUNCH_AT - now;
  const parts = [
    [Math.floor(d / 864e5), "dagen"],
    [Math.floor(d / 36e5) % 24, "uren"],
    [Math.floor(d / 6e4) % 60, "min"],
    [Math.floor(d / 1e3) % 60, "sec"],
  ] as const;
  return (
    <div className="mt-8">
      <p className="mb-3 font-pixel text-sm text-muted-foreground">Server opent over</p>
      <div className="flex justify-center gap-3">
        {parts.map(([v, l]) => (
          <div key={l} className="block-card w-20 px-2 py-3">
            <p className="font-pixel text-3xl text-primary">{String(v).padStart(2, "0")}</p>
            <p className="text-xs text-muted-foreground">{l}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function WhitelistForm() {
  const [mc, setMc] = useState("");
  const [irl, setIrl] = useState("");
  const [msg, setMsg] = useState("");
  const valid = /^[A-Za-z0-9_]{3,16}$/.test(mc);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return setMsg("Ongeldige Minecraft naam (3-16 tekens, letters/cijfers/_).");
    const { error } = await supabase.from("whitelist_requests").insert({ mc_name: mc, irl_name: irl.trim().slice(0, 60) });
    if (error) setMsg("Er ging iets mis, probeer opnieuw.");
    else { setMsg("Aanvraag verstuurd! De admin bekijkt hem zo snel mogelijk."); setMc(""); setIrl(""); }
  };
  return (
    <form onSubmit={submit} className="block-card flex flex-wrap items-center gap-4 p-6">
      <img
        src={`https://mc-heads.net/avatar/${valid ? encodeURIComponent(mc) : "MHF_Question"}/64`}
        alt=""
        className="h-16 w-16 [image-rendering:pixelated]"
      />
      <div className="flex min-w-[200px] flex-1 flex-col gap-3">
        <input className="field" placeholder="Minecraft naam (Java)" value={mc} onChange={(e) => setMc(e.target.value.trim())} required maxLength={16} />
        <input className="field" placeholder="Echte naam" value={irl} onChange={(e) => setIrl(e.target.value)} required maxLength={60} />
      </div>
      <button className="btn-block">Aanvragen</button>
      {msg && <p className="w-full text-sm text-primary">{msg}</p>}
    </form>
  );
}
