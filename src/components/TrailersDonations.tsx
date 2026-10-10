import { useState } from "react";
import { useTrailers, useDonations, fmtDate, fmtEuro } from "@/lib/smp";

type Trailer = NonNullable<ReturnType<typeof useTrailers>["data"]>[number];

function Player({ t }: { t: Trailer }) {
  if (t.youtube_id)
    return (
      <iframe
        className="aspect-video w-full"
        src={`https://www.youtube-nocookie.com/embed/${t.youtube_id}?vq=hd1080`}
        title={t.title}
        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
      />
    );
  if (t.src) return <video className="aspect-video w-full bg-background" src={t.src} controls preload="metadata" playsInline />;
  return null;
}

export function useHasTrailers() {
  const { data } = useTrailers();
  return (data?.length ?? 0) > 0;
}

export function Trailers() {
  const { data } = useTrailers();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  if (!data?.length) return null;
  const current = data.find((t) => t.id === active) ?? data[0]!;
  const others = data.filter((t) => t.id !== current.id);
  return (
    <div className="space-y-4">
      <div className="block-card overflow-hidden">
        <Player key={current.id} t={current} />
        <div className="flex flex-wrap items-center justify-between gap-2 p-4">
          <h3 className="font-pixel text-xl font-bold">{current.title}</h3>
          <span className="text-xs text-muted-foreground">{fmtDate(current.released_at)}</span>
        </div>
      </div>
      {others.length > 0 && (
        <div>
          <button className="btn-block" onClick={() => setOpen(!open)}>
            {open ? "▲ Verberg trailers" : `▼ Toon alle trailers (${data.length})`}
          </button>
          {open && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {others.map((t) => (
                <button
                  key={t.id}
                  onClick={() => { setActive(t.id); setOpen(false); }}
                  className="block-card card-hover p-4 text-left"
                >
                  <p className="font-pixel font-bold">▶ {t.title}</p>
                  <p className="text-xs text-muted-foreground">{fmtDate(t.released_at)}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function useHasDonations() {
  const { data } = useDonations();
  return (data?.length ?? 0) > 0;
}

export function DonationBoard() {
  const { data } = useDonations();
  if (!data?.length) return null;
  const total = data.reduce((s, d) => s + Number(d.amount), 0);
  const [top, ...rest] = data;
  return (
    <div className="space-y-6">
      <p className="text-center font-pixel text-lg text-muted-foreground">
        Samen al <span className="text-3xl text-gold">{fmtEuro(total)}</span> gedoneerd. Legends. 💛
      </p>
      {top && (
        <div className="block-card gold-glow relative mx-auto max-w-md border-4 p-8 text-center">
          <span className="crown-bob absolute -top-7 left-1/2 -ml-5 text-5xl">👑</span>
          <img
            src={`https://mc-heads.net/body/${encodeURIComponent(top.ign)}/120`}
            alt={top.ign}
            className="mx-auto mb-4 h-40 [image-rendering:pixelated]"
          />
          <p className="font-pixel text-xs uppercase tracking-widest text-gold">#1 Top donateur</p>
          <p className="font-pixel text-3xl font-bold">{top.ign}</p>
          {top.irl_name && <p className="text-muted-foreground">{top.irl_name}</p>}
          <p className="mt-3 font-pixel text-4xl text-gold">{fmtEuro(Number(top.amount))}</p>
        </div>
      )}
      {rest.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {rest.map((d, i) => (
            <div key={d.id} className={`block-card card-hover flex items-center gap-4 p-4 ${i < 2 ? "border-gold" : ""}`}>
              <span className="font-pixel text-2xl text-gold">{i === 0 ? "🥈" : i === 1 ? "🥉" : `#${i + 2}`}</span>
              <img src={`https://mc-heads.net/avatar/${encodeURIComponent(d.ign)}/48`} alt="" className="h-12 w-12 [image-rendering:pixelated]" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-pixel font-bold">{d.ign}</p>
                {d.irl_name && <p className="truncate text-xs text-muted-foreground">{d.irl_name}</p>}
              </div>
              <span className="font-pixel text-gold">{fmtEuro(Number(d.amount))}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
