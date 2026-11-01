import { useEffect, useState } from "react";
import { Copy, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Skin } from "@/components/Skin";
import { isValidMcName, lookupMinecraftName, type SkinLookup as Result } from "@/lib/skin";

const FAMOUS = ["Notch", "jeb_", "Dinnerbone", "Dream", "Technoblade", "Grian", "GeorgeNotFound", "Skeppy", "Wilbur_Soot", "Tubbo_"];

/** Type a Minecraft name and see the real skin (head, bust, full body), the UUID, and add the player in one click. */
export function SkinLookup() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [result, setResult] = useState<Result | "loading" | null>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    setMsg("");
    if (!name.trim()) return setResult(null);
    if (!isValidMcName(name)) return setResult({ status: "missing" });
    setResult("loading");
    const ctl = new AbortController();
    const t = window.setTimeout(() => lookupMinecraftName(name, ctl.signal).then((r) => !ctl.signal.aborted && setResult(r)), 350);
    return () => { window.clearTimeout(t); ctl.abort(); };
  }, [name]);

  const ok = result && result !== "loading" && result.status === "ok" ? result : null;
  const shown = ok?.name ?? name.trim();
  const copy = (text: string) => navigator.clipboard?.writeText(text);
  const addPlayer = async () => {
    if (!ok) return;
    const { error } = await supabase.from("players").insert({ name: ok.name, role: "Speler" });
    setMsg(error ? "Toevoegen lukte niet." : `${ok.name} staat nu in de spelerslijst.`);
    qc.invalidateQueries({ queryKey: ["players"] });
  };

  return (
    <section className="space-y-5">
      <div className="block-card p-5">
        <h2 className="mb-1 text-2xl font-bold">Skin zoeken</h2>
        <p className="mb-4 text-sm text-muted-foreground">Typ een Minecraft naam. De skin komt rechtstreeks van de Minecraft servers.</p>
        <input className="field max-w-md" placeholder="bv. Notch" value={name} onChange={(e) => setName(e.target.value.trim())} maxLength={16} autoComplete="off" spellCheck={false} />
        <div className="mt-3 flex flex-wrap gap-2">
          {FAMOUS.map((n) => <button key={n} className="border border-border px-2 py-1 font-pixel text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary" onClick={() => setName(n)}>{n}</button>)}
        </div>
      </div>

      {result === "loading" && <p className="text-sm text-muted-foreground">Zoeken…</p>}
      {result && result !== "loading" && result.status === "missing" && name.trim() && <p className="text-sm text-destructive">Deze naam bestaat niet (3 tot 16 tekens, letters, cijfers of _).</p>}
      {result && result !== "loading" && result.status === "error" && <p className="text-sm text-gold">De profielservice antwoordt niet. De skin hieronder kan nog wel kloppen.</p>}

      {name.trim() && result !== "loading" && result?.status !== "missing" && (
        <div className="block-card grid gap-6 p-5 sm:grid-cols-[auto_auto_1fr] sm:items-center">
          <Skin name={shown} kind="body" size={200} className="mx-auto h-56 w-auto" />
          <div className="flex flex-col items-center gap-3">
            <Skin name={shown} kind="bust" size={160} className="size-32 object-contain" />
            <Skin name={shown} size={96} className="size-16" />
          </div>
          <div className="min-w-0 space-y-3">
            <p className="font-pixel text-2xl font-bold text-primary">{shown}</p>
            {ok && <p className="break-all text-xs text-muted-foreground">UUID {ok.uuid}</p>}
            <div className="flex flex-wrap gap-2">
              {ok && <button className="btn-block !py-1.5 text-xs" onClick={addPlayer}>Toevoegen als speler</button>}
              <button className="btn-block btn-block-secondary !py-1.5 text-xs" onClick={() => copy(shown)}><Copy className="size-3.5" /> Naam</button>
              {ok && <button className="btn-block btn-block-secondary !py-1.5 text-xs" onClick={() => copy(ok.uuid)}><Copy className="size-3.5" /> UUID</button>}
              <a className="btn-block btn-block-secondary !py-1.5 text-xs" href={`https://mc-heads.net/download/${encodeURIComponent(shown)}`} target="_blank" rel="noreferrer"><Download className="size-3.5" /> Skin downloaden</a>
            </div>
            {msg && <p className="text-sm text-success">{msg}</p>}
          </div>
        </div>
      )}
    </section>
  );
}
