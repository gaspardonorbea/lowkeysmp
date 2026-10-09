import { createFileRoute, Link } from "@tanstack/react-router";
import hero from "@/assets/hero.jpg";
import logo from "@/assets/logo-smp.png.asset.json";
import { useAnnouncements, usePlayers, useHours, fmtDate } from "@/lib/smp";
import { TOPICS } from "@/lib/notify";
import { track } from "@/lib/track";
import { useEffect, useRef } from "react";
import { ServerIp, Countdown, WhitelistForm } from "@/components/ServerExtras";

function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add("reveal-in"); io.disconnect(); } },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`reveal ${className}`} style={{ "--reveal-delay": `${delay}ms` } as React.CSSProperties}>
      {children}
    </div>
  );
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LowkeySMP — lowkey peak" },
      { name: "description", content: "De Minecraft SMP van de vriendengroep: aankondigingen, spelers, deaths en openingsuren." },
      { property: "og:title", content: "LowkeySMP — lowkey peak" },
      { property: "og:description", content: "Aankondigingen, spelers, deaths en openingsuren van LowkeySMP." },
    ],
  }),
  component: Index,
});

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mx-auto max-w-5xl px-5 py-16">
      <h2 className="mb-8 text-3xl font-bold text-primary md:text-4xl">{title}</h2>
      {children}
    </section>
  );
}

function Index() {
  const ann = useAnnouncements();
  const players = usePlayers();
  const hours = useHours();
  useEffect(() => track("visit"), []);
  const alive = players.data?.filter((p) => !p.is_dead) ?? [];
  const dead = (players.data?.filter((p) => p.is_dead) ?? []).sort(
    (a, b) => +new Date(b.died_at ?? 0) - +new Date(a.died_at ?? 0),
  );

  return (
    <main>
      <nav className="fixed inset-x-0 top-0 z-20 border-b-2 border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3 font-pixel">
          <a href="#top" className="text-lg font-bold text-primary">LowkeySMP</a>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <a href="#nieuws" className="hover:text-foreground">Nieuws</a>
            <a href="#server" className="hover:text-foreground">Server</a>
            <a href="#spelers" className="hover:text-foreground">Spelers</a>
            <a href="#deaths" className="hover:text-foreground">Deaths</a>
            <a href="#uren" className="hover:text-foreground">Uren</a>
          </div>
        </div>
      </nav>

      <header id="top" className="relative flex min-h-[92vh] items-center justify-center overflow-hidden">
        <img src={hero} alt="" width={1920} height={1088} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/40 to-background" />
        <div className="relative z-10 px-5 text-center">
          <img src={logo.url} alt="LowkeySMP" className="float-slow mx-auto w-[min(520px,85vw)] drop-shadow-2xl" />
          <p className="mt-6 font-pixel text-2xl text-foreground md:text-3xl">lowkey peak.</p>
          <Countdown />
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <a href="#server" className="btn-block">Server IP</a>
            <a href="#nieuws" className="btn-block">Laatste nieuws</a>
          </div>
          <div className="mt-8 flex justify-center gap-6 font-pixel text-sm">
            <span className="block-card px-4 py-2"><span className="text-success">{alive.length}</span> levend</span>
            <span className="block-card px-4 py-2"><span className="text-destructive">{dead.length}</span> dood</span>
          </div>
        </div>
      </header>

      <Section id="nieuws" title="Aankondigingen">
        <div className="space-y-4">
          {ann.data?.length === 0 && <p className="text-muted-foreground">Nog geen nieuws.</p>}
          {ann.data?.map((a) => (
            <article key={a.id} className="block-card p-5">
              <div className="mb-2 flex items-center gap-3">
                {a.pinned && <span className="bg-primary px-2 py-0.5 font-pixel text-xs text-primary-foreground">PINNED</span>}
                <span className="text-xs text-muted-foreground">{fmtDate(a.created_at)}</span>
              </div>
              <h3 className="text-xl font-bold">{a.title}</h3>
              <p className="mt-2 whitespace-pre-line text-muted-foreground">{a.body}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section id="server" title="Server">
        <ServerStatus />
      </Section>

      <Section id="whitelist" title="Whitelist aanvragen">
        <WhitelistForm />
      </Section>

      <Section id="spelers" title="Spelers">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {players.data?.map((p) => (
            <div key={p.id} className={`block-card p-4 text-center ${p.is_dead ? "opacity-50 grayscale" : ""}`}>
              <img
                src={`https://mc-heads.net/avatar/${encodeURIComponent(p.name)}/64`}
                alt={p.name}
                className="mx-auto mb-3 h-16 w-16 [image-rendering:pixelated]"
                loading="lazy"
              />
              <p className="font-pixel font-bold">{p.name}</p>
              <p className="text-xs text-secondary">{p.role}</p>
              {p.is_dead && <p className="mt-1 text-xs text-destructive">☠ dood</p>}
            </div>
          ))}
        </div>
      </Section>

      <Section id="deaths" title="Death log">
        {dead.length === 0 ? (
          <p className="text-muted-foreground">Nog niemand dood. Lowkey peak.</p>
        ) : (
          <ol className="space-y-3">
            {dead.map((p) => (
              <li key={p.id} className="block-card flex items-center gap-4 p-4">
                <img src={`https://mc-heads.net/avatar/${encodeURIComponent(p.name)}/40`} alt="" className="h-10 w-10 [image-rendering:pixelated]" />
                <div className="flex-1">
                  <p className="font-pixel font-bold">{p.name}</p>
                  <p className="text-sm text-muted-foreground">{p.death_cause || "Onbekende oorzaak"}</p>
                </div>
                <span className="text-right text-xs text-destructive">{fmtDate(p.died_at)}</span>
              </li>
            ))}
          </ol>
        )}
      </Section>

      <Section id="uren" title="Openingsuren">
        <div className="block-card divide-y-2 divide-border">
          {hours.data?.map((h) => (
            <div key={h.id} className="flex justify-between p-4 font-pixel">
              <span>{h.day}</span>
              <span className="text-primary">{h.hours}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section id="meldingen" title="Meldingen op je gsm">
        <div className="block-card space-y-5 p-6">
          <ol className="list-decimal space-y-1 pl-5 text-muted-foreground">
            <li>Download de gratis app <b className="text-foreground">ntfy</b> (
              <a className="underline" href="https://play.google.com/store/apps/details?id=io.heckel.ntfy" target="_blank" rel="noreferrer">Android</a> /{" "}
              <a className="underline" href="https://apps.apple.com/app/ntfy/id1625396347" target="_blank" rel="noreferrer">iPhone</a>).</li>
            <li>Tik hieronder op wat je wilt volgen, of voeg de naam toe in de app met de +.</li>
          </ol>
          <div className="grid gap-4 sm:grid-cols-2">
            {([["nieuws", "📢 Aankondigingen"], ["deaths", "☠ Dood meldingen"]] as const).map(([k, label]) => (
              <div key={k} className="border-2 border-border p-4">
                <p className="font-pixel font-bold">{label}</p>
                <code className="mt-1 block break-all text-xs text-secondary">{TOPICS[k]}</code>
                <a href={`ntfy://ntfy.sh/${TOPICS[k]}`} onClick={() => track(k === "nieuws" ? "sub_nieuws" : "sub_deaths")} className="btn-block mt-3">Aanzetten</a>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <footer className="border-t-2 border-border py-8 text-center text-sm text-muted-foreground">
        LowkeySMP · lowkey peak ·{" "}
        <Link to="/admin" className="underline hover:text-foreground">beheer</Link>
      </footer>
    </main>
  );
}
