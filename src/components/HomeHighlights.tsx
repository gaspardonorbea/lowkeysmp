import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useAnnouncements, useTrailers, fmtDate } from "@/lib/smp";
import { Player } from "@/components/TrailersDonations";
import { ContentReactions } from "@/components/ContentReactions";
import { T } from "@/lib/cms";

type Video = NonNullable<ReturnType<typeof useTrailers>["data"]>[number];

/** A video whose title has "uitleg" in it is the explainer, everything else is the main trailer. */
const isExplainer = (t: Video) => (t as { kind?: string }).kind === "explainer" || /uitleg/i.test(t.title);

/** The big video on the home page, with a switch between the main trailer and the explainer. */
export function HomeVideo() {
  const { data, isLoading } = useTrailers();
  const [which, setWhich] = useState<"trailer" | "uitleg">("trailer");

  const trailer = data?.find((t) => !isExplainer(t));
  const explainer = data?.find(isExplainer);
  const current = which === "uitleg" ? (explainer ?? trailer) : (trailer ?? explainer);
  const active: "trailer" | "uitleg" = current && isExplainer(current) ? "uitleg" : "trailer";

  if (isLoading) {
    return <div className="block-card aspect-video w-full animate-pulse" aria-hidden="true" />;
  }
  if (!current) {
    return (
      <div className="block-card flex aspect-video w-full flex-col items-center justify-center gap-2 p-6 text-center">
        <p className="font-pixel text-2xl text-primary"><T k="home.video.empty.title" def="Trailer komt eraan" /></p>
        <p className="text-sm text-muted-foreground"><T k="home.video.empty.text" def="Hier verschijnt straks de trailer en de uitlegvideo van seizoen 1." /></p>
      </div>
    );
  }

  const tabs: { id: "trailer" | "uitleg"; label: string; key: string; available: boolean }[] = [
    { id: "trailer", label: "Main trailer", key: "home.tab.trailer", available: !!trailer },
    { id: "uitleg", label: "Uitlegvideo", key: "home.tab.explainer", available: !!explainer },
  ];

  return (
    <div className="block-card overflow-hidden">
      {tabs.every((t) => t.available) && (
        <div className="flex gap-2 border-b-2 border-border bg-background/40 p-2" role="tablist" aria-label="Kies een video">
          {tabs.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={active === t.id}
              onClick={() => setWhich(t.id)}
              className={`flex-1 px-3 py-2 font-pixel text-sm uppercase tracking-wider transition-colors ${
                active === t.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              <T k={t.key} def={t.label} />
            </button>
          ))}
        </div>
      )}
      <Player key={current.id} t={current} />
      <div className="flex flex-wrap items-center justify-between gap-2 p-4">
        <h3 className="font-pixel text-xl font-bold">{current.title}</h3>
        <span className="text-xs text-muted-foreground">{fmtDate(current.released_at)}</span>
      </div>
      <div className="px-4 pb-4"><ContentReactions key={current.id} kind="trailer" id={current.id} /></div>
    </div>
  );
}

/** The newest announcement (pinned first) in a card next to the video. */
export function HomeAnnouncement() {
  const { data, isLoading } = useAnnouncements();
  const a = data?.[0];
  return (
    <aside className="announcement-card block-card flex h-full min-h-64 flex-col p-5 sm:p-6">
      <p className="mb-4 font-pixel text-sm font-bold uppercase tracking-widest text-primary"><T k="home.announcement.label" def="📢 Aankondiging" /></p>
      {isLoading ? (
        <div className="space-y-3" aria-hidden="true">
          <div className="h-6 w-2/3 animate-pulse bg-muted" />
          <div className="h-4 w-full animate-pulse bg-muted" />
          <div className="h-4 w-5/6 animate-pulse bg-muted" />
        </div>
      ) : !a ? (
        <p className="text-muted-foreground"><T k="home.announcement.empty" def="Nog geen nieuws. Lowkey peak." /></p>
      ) : (
        <>
          <h3 className="text-xl font-bold uppercase">{a.title}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{fmtDate(a.created_at)}</p>
          {a.photos[0] && <img src={a.photos[0]} alt="" className="mt-3 max-h-40 w-full rounded object-cover" loading="lazy" />}
          <p className="mt-3 line-clamp-[7] whitespace-pre-line text-sm text-muted-foreground">{a.body}</p>
        </>
      )}
      <Link to="/aankondigingen" className="mt-auto inline-flex pt-5 font-pixel text-sm font-bold text-primary hover:underline">
        <T k="home.announcement.more" def="Lees meer →" />
      </Link>
    </aside>
  );
}
