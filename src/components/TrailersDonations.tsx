import { useState } from "react";
import { useTrailers, useDonations, fmtDate, fmtEuro } from "@/lib/smp";
import { ContentReactions } from "@/components/ContentReactions";

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
   const current = data.find((t) => t.id === active) ?? data[0];
   if (!current) return null;
  const others = data.filter((t) => t.id !== current.id);
  return (
    <div className="space-y-4">
      <div className="block-card overflow-hidden">
        <Player key={current.id} t={current} />
        <div className="flex flex-wrap items-center justify-between gap-2 p-4">
          <h3 className="font-pixel text-xl font-bold">{current.title}</h3>
          <span className="text-xs text-muted-foreground">{fmtDate(current.released_at)}</span>
        </div>
        <div className="px-4 pb-4"><ContentReactions key={current.id} kind="trailer" id={current.id} /></div>
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
  const [top, second, third, ...rest] = data;
  const podium = [second, third].filter((donor) => donor !== undefined);
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="block-card flex items-center justify-between gap-3 border border-gold/35 px-4 py-3">
          <span className="font-pixel text-xs uppercase tracking-wider text-muted-foreground">Samen opgehaald</span>
          <span className="font-pixel text-xl font-bold text-gold">{fmtEuro(total)}</span>
        </div>
        <div className="block-card flex items-center justify-between gap-3 border border-primary/25 px-4 py-3">
          <span className="font-pixel text-xs uppercase tracking-wider text-muted-foreground">Donaties</span>
          <span className="font-pixel text-xl font-bold text-primary">{data.length}</span>
        </div>
      </div>
      {top && (
        <article className="block-card relative grid items-center gap-4 overflow-hidden border-2 border-gold/70 bg-gradient-to-r from-gold/10 via-card to-primary/10 p-5 sm:grid-cols-[auto_1fr_auto] sm:gap-6 sm:p-6">
          <div className="pointer-events-none absolute -right-12 -top-16 size-48 rounded-full border-[18px] border-gold/5" aria-hidden="true" />
          <img
            src={`https://minotar.net/armor/body/${encodeURIComponent(top.ign.trim())}/120.png`}
            alt={top.ign}
            loading="lazy"
            className="mx-auto h-32 [image-rendering:pixelated] sm:mx-0 sm:h-36"
          />
          <div className="min-w-0 text-center sm:text-left">
            <p className="mb-2 inline-flex items-center gap-2 border border-gold/40 bg-gold/10 px-2 py-1 font-pixel text-[10px] uppercase tracking-widest text-gold"><span aria-hidden="true">♛</span> Nummer 1</p>
            <h3 className="truncate font-pixel text-2xl font-bold sm:text-3xl">{top.ign}</h3>
            {top.irl_name && <p className="mt-1 text-sm text-muted-foreground">{top.irl_name}</p>}
          </div>
          <div className="relative text-center sm:text-right">
            <p className="font-pixel text-[10px] uppercase tracking-widest text-muted-foreground">Totaal gedoneerd</p>
            <p className="mt-1 font-pixel text-3xl font-bold text-gold">{fmtEuro(Number(top.amount))}</p>
          </div>
        </article>
      )}
      {podium.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {podium.map((d, i) => {
            const rank = i + 2;
            return (
              <article key={d.id} className="block-card flex min-w-0 items-center gap-3 border border-border p-3 sm:p-4">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center border font-pixel text-sm font-bold ${rank === 2 ? "border-slate-300/50 bg-slate-300/10 text-slate-200" : "border-orange-300/50 bg-orange-300/10 text-orange-200"}`}>#{rank}</span>
                <img src={`https://minotar.net/helm/${encodeURIComponent(d.ign.trim())}/48.png`} alt="" loading="lazy" className="h-11 w-11 shrink-0 [image-rendering:pixelated]" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-pixel font-bold">{d.ign}</p>
                  {d.irl_name && <p className="truncate text-xs text-muted-foreground">{d.irl_name}</p>}
                </div>
                <span className="shrink-0 font-pixel text-sm text-gold">{fmtEuro(Number(d.amount))}</span>
              </article>
            );
          })}
        </div>
      )}
      {rest.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-pixel text-sm font-bold uppercase tracking-wider text-muted-foreground">Ook bedankt</h3>
          <ol className="block-card divide-y divide-border px-3">
            {rest.map((d, i) => (
              <li key={d.id} className="flex min-w-0 items-center gap-3 py-3">
                <span className="w-8 shrink-0 text-center font-pixel text-xs text-muted-foreground">#{i + 4}</span>
                <img src={`https://minotar.net/helm/${encodeURIComponent(d.ign.trim())}/40.png`} alt="" loading="lazy" className="h-9 w-9 shrink-0 [image-rendering:pixelated]" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-pixel text-sm font-bold">{d.ign}</p>
                  {d.irl_name && <p className="truncate text-xs text-muted-foreground">{d.irl_name}</p>}
                </div>
                <span className="shrink-0 font-pixel text-xs text-gold">{fmtEuro(Number(d.amount))}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
