import { useEffect, useState } from "react";
import { useContent, useSaveContent } from "@/lib/cms";
import { SERVER_IP, LAUNCH_AT } from "@/components/ServerExtras";

const toLocal = (ms: number) => new Date(ms - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);

export function Settings() {
  const ip = useContent<string>("server.ip", SERVER_IP);
  const opens = useContent<string>("server.opens", "");
  const save = useSaveContent();
  const eventsOn = useContent<boolean>("events.enabled", true);
  const [ipDraft, setIpDraft] = useState(ip);
  const [opensDraft, setOpensDraft] = useState(toLocal(opens ? new Date(opens).getTime() : LAUNCH_AT));
  const [msg, setMsg] = useState("");
  useEffect(() => setIpDraft(ip), [ip]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await save("server.ip", ipDraft.trim());
    await save("server.opens", new Date(opensDraft).toISOString());
    setMsg("Opgeslagen. De site toont het meteen.");
  };
  return (
    <form onSubmit={submit} className="block-card max-w-xl space-y-4 p-5">
      <label className="block text-sm text-muted-foreground">Server IP
        <input className="field mt-1" value={ipDraft} onChange={(e) => setIpDraft(e.target.value)} required placeholder="bv. play.lowkeysmp.nl" />
      </label>
      <label className="block text-sm text-muted-foreground">Server opent op
        <input className="field mt-1" type="datetime-local" value={opensDraft} onChange={(e) => setOpensDraft(e.target.value)} required />
      </label>
      <p className="text-xs text-muted-foreground">Het IP staat in de bovenbalk, bij Server en in de kopieerknop. De datum bepaalt de aftelklok.</p>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={eventsOn} onChange={(e) => save("events.enabled", e.target.checked)} /> Evenementen tonen op de startpagina</label>
      <button className="btn-block">Opslaan</button>
      {msg && <p role="status" className="text-sm text-success">{msg}</p>}
    </form>
  );
}
