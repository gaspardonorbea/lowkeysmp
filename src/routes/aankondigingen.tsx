import { createFileRoute } from "@tanstack/react-router";
import { useAnnouncements, fmtDate } from "@/lib/smp";
import { ContentReactions } from "@/components/ContentReactions";
import { PageShell, Reveal } from "@/components/page";

export const Route = createFileRoute("/aankondigingen")({
  head: () => ({
    meta: [
      { title: "Aankondigingen — LowkeySMP" },
      { name: "description", content: "Al het nieuws en alle aankondigingen van LowkeySMP." },
      { property: "og:title", content: "Aankondigingen — LowkeySMP" },
      { property: "og:description", content: "Al het nieuws en alle aankondigingen van LowkeySMP." },
      { name: "twitter:card", content: "summary" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Aankondigingen,
});

function Aankondigingen() {
  const ann = useAnnouncements();
  return (
    <PageShell title="Aankondigingen" subtitle="Al het nieuws van de server.">
      <div className="mx-auto max-w-3xl space-y-4">
        {ann.data?.length === 0 && <p className="text-center text-muted-foreground">Nog geen nieuws.</p>}
        {ann.data?.map((a, i) => (
          <Reveal key={a.id} delay={i * 80}>
            <article className="announcement-card block-card card-hover overflow-hidden p-5 sm:p-6">
              <div className="mb-3 flex flex-wrap items-center gap-3">
                {a.pinned && <span className="bg-primary px-2 py-0.5 font-pixel text-xs text-primary-foreground">PINNED</span>}
                <span className="text-xs text-muted-foreground">{fmtDate(a.created_at)}</span>
              </div>
              <h3 className="text-xl font-bold">{a.title}</h3>
              <p className="mt-2 whitespace-pre-line text-muted-foreground">{a.body}</p>
              {a.photos.length > 0 && (
                <div className={`mt-4 grid gap-2 ${a.photos.length > 1 ? "sm:grid-cols-2" : ""}`}>
                  {a.photos.map((src) => <a key={src} href={src} target="_blank" rel="noreferrer"><img src={src} alt="" className="max-h-[28rem] w-full rounded object-cover" loading="lazy" /></a>)}
                </div>
              )}
              <ContentReactions kind="announcement" id={a.id} />
            </article>
          </Reveal>
        ))}
      </div>
    </PageShell>
  );
}
