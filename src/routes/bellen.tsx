import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Lock, Mic, MicOff, PhoneOff, Users } from "lucide-react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/page";

export const Route = createFileRoute("/bellen")({
  head: () => ({
    meta: [
      { title: "Bellen — LowkeySMP" },
      { name: "description", content: "Praat samen in openbare of privé voice kamers van LowkeySMP." },
      { property: "og:title", content: "Bellen — LowkeySMP" },
      { property: "og:description", content: "Openbare en privé voice calls met wachtwoord." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BellenPage,
});

type Room = { id: string; name: string; is_private: boolean };
const ICE = { iceServers: [{ urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] }] };
const myId = () => crypto.randomUUID();

function BellenPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [name, setName] = useState("");
  const [roomName, setRoomName] = useState("");
  const [pw, setPw] = useState("");
  const [active, setActive] = useState<{ room: Room; key: string } | null>(null);
  const [err, setErr] = useState("");

  const load = async () => {
    const { data } = await supabase.from("voice_rooms_public").select("id,name,is_private").order("created_at", { ascending: false });
    setRooms((data ?? []) as Room[]);
  };
  useEffect(() => { setName(localStorage.getItem("voice.name") ?? ""); load(); }, []);

  const needName = () => { if (name.trim().length < 2) { setErr("Vul eerst je naam in."); return true; } localStorage.setItem("voice.name", name.trim()); return false; };

  const create = async (e: React.FormEvent) => {
    e.preventDefault(); setErr("");
    if (needName() || roomName.trim().length < 2) return setErr((x) => x || "Geef de kamer een naam.");
    const { data, error } = await supabase.rpc("create_voice_room", { _name: roomName.trim().slice(0, 40), _password: pw });
    if (error || !data) return setErr("Kamer maken lukte niet, probeer opnieuw.");
    const d = data as { id: string; channel_key: string };
    setActive({ room: { id: d.id, name: roomName.trim(), is_private: !!pw }, key: d.channel_key });
    setRoomName(""); setPw(""); load();
  };

  const join = async (room: Room) => {
    setErr("");
    if (needName()) return;
    const pass = room.is_private ? prompt(`Wachtwoord voor "${room.name}"`) : "";
    if (pass === null) return;
    const { data } = await supabase.rpc("join_voice_room", { _id: room.id, _password: pass });
    if (!data) return setErr("Verkeerd wachtwoord.");
    setActive({ room, key: data as string });
  };

  if (active) return <PageShell title={active.room.name} subtitle="Voice call"><Call channelKey={active.key} name={name.trim()} onLeave={() => setActive(null)} /></PageShell>;

  return (
    <PageShell title="Bellen" subtitle="Maak een kamer of spring in een gesprek.">
      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <form onSubmit={create} className="block-card space-y-4 p-6">
          <h2 className="font-pixel text-xl text-primary">Nieuwe kamer</h2>
          <label className="flex flex-col gap-1 text-sm text-muted-foreground">Jouw naam
            <input className="field" value={name} maxLength={24} onChange={(e) => setName(e.target.value)} placeholder="bv. Steve" /></label>
          <label className="flex flex-col gap-1 text-sm text-muted-foreground">Naam van de kamer
            <input className="field" value={roomName} maxLength={40} onChange={(e) => setRoomName(e.target.value)} placeholder="bv. Team Noord" /></label>
          <label className="flex flex-col gap-1 text-sm text-muted-foreground">Wachtwoord (leeg = openbaar)
            <input className="field" type="password" value={pw} maxLength={40} onChange={(e) => setPw(e.target.value)} /></label>
          <button className="btn-block">Kamer maken</button>
          {err && <p className="text-sm text-destructive" role="status">{err}</p>}
        </form>
        <div className="block-card p-6">
          <h2 className="mb-4 font-pixel text-xl text-primary">Kamers</h2>
          {rooms.length === 0 && <p className="text-muted-foreground">Nog geen kamers. Maak de eerste!</p>}
          <div className="space-y-2">
            {rooms.map((r) => (
              <button key={r.id} onClick={() => join(r)} className="flex w-full items-center justify-between border-2 border-border p-3 text-left transition-colors hover:bg-accent">
                <span className="font-pixel">{r.name}</span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">{r.is_private ? <><Lock className="size-3.5" /> Privé</> : "Openbaar"}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </PageShell>
  );
}

type Peer = { id: string; name: string };

function Call({ channelKey, name, onLeave }: { channelKey: string; name: string; onLeave: () => void }) {
  const [peers, setPeers] = useState<Peer[]>([]);
  const [muted, setMuted] = useState(false);
  const [status, setStatus] = useState("Microfoon starten...");
  const [speaking, setSpeaking] = useState<Record<string, boolean>>({});
  const stream = useRef<MediaStream | null>(null);
  const me = useRef(myId());
  const pcs = useRef(new Map<string, RTCPeerConnection>());
  const audioBox = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ch: RealtimeChannel | null = null;
    let stopped = false;
    const meters: (() => void)[] = [];

    const watch = (id: string, s: MediaStream) => {
      try {
        const ctx = new AudioContext(); const an = ctx.createAnalyser();
        ctx.createMediaStreamSource(s).connect(an);
        const buf = new Uint8Array(an.frequencyBinCount);
        const t = setInterval(() => { an.getByteFrequencyData(buf); const v = buf.reduce((a, b) => a + b, 0) / buf.length; setSpeaking((p) => (p[id] === v > 12 ? p : { ...p, [id]: v > 12 })); }, 150);
        meters.push(() => { clearInterval(t); ctx.close(); });
      } catch { /* ignore */ }
    };

    const makePc = (peer: string) => {
      const pc = new RTCPeerConnection(ICE);
      stream.current?.getTracks().forEach((t) => pc.addTrack(t, stream.current!));
      pc.onicecandidate = (e) => { if (e.candidate) ch?.send({ type: "broadcast", event: "ice", payload: { from: me.current, to: peer, c: e.candidate.toJSON() } }); };
      pc.ontrack = (e) => {
        const s = e.streams[0]; if (!s || !audioBox.current) return;
        let a = audioBox.current.querySelector<HTMLAudioElement>(`[data-p="${peer}"]`);
        if (!a) { a = document.createElement("audio"); a.dataset["p"] = peer; a.autoplay = true; audioBox.current.appendChild(a); }
        a.srcObject = s; watch(peer, s);
      };
      pcs.current.set(peer, pc);
      return pc;
    };
    const drop = (peer: string) => {
      pcs.current.get(peer)?.close(); pcs.current.delete(peer);
      audioBox.current?.querySelector(`[data-p="${peer}"]`)?.remove();
    };

    (async () => {
      try {
        stream.current = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      } catch { setStatus("Geen toegang tot je microfoon. Sta het toe in je browser."); return; }
      if (stopped) { stream.current.getTracks().forEach((t) => t.stop()); return; }
      watch(me.current, stream.current);
      ch = supabase.channel(`voice:${channelKey}`, { config: { presence: { key: me.current }, broadcast: { self: false } } });
      ch.on("presence", { event: "sync" }, () => {
        const st = ch!.presenceState<{ name: string }>();
        const list = Object.entries(st).map(([id, v]) => ({ id, name: v[0]?.name ?? "?" }));
        setPeers(list);
        const ids = new Set(list.map((p) => p.id));
        for (const id of pcs.current.keys()) if (!ids.has(id)) drop(id);
      });
      ch.on("presence", { event: "join" }, async ({ key }) => {
        if (key === me.current || pcs.current.has(key)) return;
        // the newest person waits; existing members call them (only the one with the bigger id, to avoid double calls)
        if (me.current < key) return;
        const pc = makePc(key);
        const offer = await pc.createOffer(); await pc.setLocalDescription(offer);
        ch!.send({ type: "broadcast", event: "offer", payload: { from: me.current, to: key, sdp: offer } });
      });
      ch.on("broadcast", { event: "offer" }, async ({ payload }) => {
        if (payload.to !== me.current) return;
        drop(payload.from);
        const pc = makePc(payload.from);
        await pc.setRemoteDescription(payload.sdp);
        const ans = await pc.createAnswer(); await pc.setLocalDescription(ans);
        ch!.send({ type: "broadcast", event: "answer", payload: { from: me.current, to: payload.from, sdp: ans } });
      });
      ch.on("broadcast", { event: "answer" }, async ({ payload }) => {
        if (payload.to === me.current) await pcs.current.get(payload.from)?.setRemoteDescription(payload.sdp);
      });
      ch.on("broadcast", { event: "ice" }, async ({ payload }) => {
        if (payload.to === me.current) try { await pcs.current.get(payload.from)?.addIceCandidate(payload.c); } catch { /* ignore */ }
      });
      ch.subscribe(async (s) => {
        if (s === "SUBSCRIBED") { await ch!.track({ name }); setStatus(""); }
      });
    })();

    return () => {
      stopped = true;
      meters.forEach((m) => m());
      pcs.current.forEach((pc) => pc.close()); pcs.current.clear();
      stream.current?.getTracks().forEach((t) => t.stop());
      if (ch) supabase.removeChannel(ch);
    };
  }, [channelKey, name]);

  const toggleMute = () => {
    const next = !muted; setMuted(next);
    stream.current?.getAudioTracks().forEach((t) => (t.enabled = !next));
  };

  return (
    <div className="block-card mx-auto max-w-3xl p-6">
      {status && <p className="mb-4 text-center text-muted-foreground">{status}</p>}
      <p className="mb-4 flex items-center gap-2 font-pixel text-sm text-muted-foreground"><Users className="size-4" /> {peers.length} in gesprek</p>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {peers.map((p) => {
          const talk = speaking[p.id] && !(p.id === me.current && muted);
          return (
            <div key={p.id} className={`flex flex-col items-center gap-2 border-2 p-4 transition-colors ${talk ? "border-success" : "border-border"}`}>
              <div className={`grid size-14 place-items-center bg-accent font-pixel text-2xl ${talk ? "pop-in" : ""}`}>{p.name.slice(0, 1).toUpperCase()}</div>
              <span className="truncate font-pixel text-sm">{p.name}{p.id === me.current ? " (jij)" : ""}</span>
              {p.id === me.current && muted && <MicOff className="size-4 text-destructive" />}
            </div>
          );
        })}
      </div>
      <div className="mt-6 flex justify-center gap-3">
        <button onClick={toggleMute} className="btn-block btn-block-secondary">{muted ? <><MicOff className="size-4" /> Unmute</> : <><Mic className="size-4" /> Mute</>}</button>
        <button onClick={onLeave} className="btn-block"><PhoneOff className="size-4" /> Ophangen</button>
      </div>
      <div ref={audioBox} className="hidden" />
    </div>
  );
}
