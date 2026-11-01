import { createFileRoute } from "@tanstack/react-router";
import hero from "@/assets/hero-lowkeysmp.jpg";
import logo from "@/assets/logo-smp.png.asset.json";
import { usePlayers, useHours } from "@/lib/smp";
import { TOPICS } from "@/lib/notify";
import { track } from "@/lib/track";
import { useEffect, type ReactNode } from "react";
import { ServerIp, Countdown, WhitelistForm } from "@/components/ServerExtras";
import { DonationBoard, useHasDonations } from "@/components/TrailersDonations";
import { HomeVideo, HomeAnnouncement } from "@/components/HomeHighlights";
import { SiteLayout } from "@/components/SiteLayout";
import { Reveal, Section } from "@/components/page";
import { DonationInstructions } from "@/components/DonationInstructions";
import { T, useEdit } from "@/lib/cms";
import { BlockFrame, moveBlock, useBlocks, type Block } from "@/lib/blocks";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LowkeySMP — lowkey peak" },
      { name: "description", content: "De Minecraft SMP van de vriendengroep: aankondigingen, spelers, deaths en openingsuren." },
      { property: "og:title", content: "LowkeySMP — lowkey peak" },
      { property: "og:description", content: "Aankondigingen, spelers, deaths en openingsuren van LowkeySMP." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function youtubeId(url: string) {
  const m = url.match(/(?:youtu\.be\/|v=|embed\/)([A-Za-z0-9_-]{11})/);
  return m?.[1] ?? null;
}

/** A block the admin added: its texts are editable like everything else, the image or video link is set with the button. */
function CustomBlock({ block, onProps }: { block: Block; onProps: (p: Record<string, string>) => void }) {
  const { editing } = useEdit();
  const url = block.props?.url ?? "";
  const ask = () => {
    const next = prompt(block.kind === "image" ? "Link naar de afbeelding (https://...)" : "Link naar de video (mp4 of YouTube)", url);
    if (next !== null) onProps({ ...(block.props ?? {}), url: next.trim() });
  };
  const yt = block.kind === "video" ? youtubeId(url) : null;
  return (
    <Section id={block.id} title="Nieuwe sectie">
      <Reveal>
        {block.kind === "text" && (
          <T k={`block.${block.id}.body`} def="Klik in bewerkmodus op deze tekst om hem aan te passen." as="p" className="text-muted-foreground" multiline />
        )}
        {block.kind === "image" && (url
          ? <img src={url} alt="" className="mx-auto max-h-[36rem] w-full object-contain" loading="lazy" />
          : <p className="text-muted-foreground">Nog geen afbeelding gekozen.</p>)}
        {block.kind === "video" && (url
          ? yt
            ? <div className="aspect-video"><iframe className="size-full" src={`https://www.youtube-nocookie.com/embed/${yt}`} title="Video" allowFullScreen /></div>
            : <video src={url} controls className="w-full" />
          : <p className="text-muted-foreground">Nog geen video gekozen.</p>)}
        {editing && block.kind !== "text" && <button className="btn-block btn-block-secondary mt-4" onClick={ask}>{block.kind === "image" ? "Afbeelding kiezen" : "Video kiezen"}</button>}
      </Reveal>
    </Section>
  );
}

function Index() {
  const players = usePlayers();
  const hours = useHours();
  const hasDonations = useHasDonations();
  const { blocks, update } = useBlocks("home");
  useEffect(() => track("visit"), []);
  const alive = players.data?.filter((p) => !p.is_dead) ?? [];
  const dead = players.data?.filter((p) => p.is_dead) ?? [];

  const render: Record<string, () => ReactNode> = {
    hero: () => (
      <header id="top" className="hero-shell relative flex min-h-[64vh] items-center justify-center overflow-hidden border-b-2 border-border/60 pt-20">
        <img src={hero} alt="" width={1920} height={1088} className="absolute inset-0 h-full w-full object-cover" />
        <div className="hero-shade absolute inset-0" />
        <div className="hero-glow pointer-events-none absolute -left-24 top-20 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="relative z-10 px-5 py-12 text-center">
          <div className="pop-in"><img src={logo.url} onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = "/logo-smp-local.png"; }} alt="LowkeySMP" className="float-slow mx-auto w-[min(440px,80vw)] drop-shadow-[0_10px_36px_rgba(0,0,0,0.55)]" /></div>
          <T k="hero.tagline" def="lowkey peak." as="p" className="pop-in mt-3 block font-pixel text-3xl text-foreground md:text-4xl" />
          <Countdown />
          <div className="pop-in mt-8 flex flex-wrap justify-center gap-4" style={{ animationDelay: "300ms" }}>
            <a href="#aanmelden" className="btn-block"><T k="hero.button1" def="Meld je aan ↓" /></a>
            <a href="#server" className="btn-block btn-block-secondary"><T k="hero.button2" def="Server IP ↗" /></a>
          </div>
          <div className="pop-in mx-auto mt-8 grid max-w-sm grid-cols-2 gap-3 font-pixel text-sm" style={{ animationDelay: "450ms" }}>
            <span className="hero-stat"><span className="text-success">{alive.length}</span> <T k="hero.alive" def="levend" /></span>
            <span className="hero-stat"><span className="text-destructive">{dead.length}</span> <T k="hero.dead" def="dood" /></span>
          </div>
        </div>
      </header>
    ),
    media: () => (
      <section className="mx-auto max-w-6xl px-5 py-10 sm:py-14">
        <Reveal>
          <div className="grid items-stretch gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <HomeVideo />
            <HomeAnnouncement />
          </div>
        </Reveal>
      </section>
    ),
    timeline: () => null,
    server: () => (
      <Section id="server" title="Server">
        <Reveal><ServerIp /></Reveal>
      </Section>
    ),
    aanmelden: () => (
      <Section id="aanmelden" title="Aanmelden">
        <Reveal>
          <T k="aanmelden.intro" def="Wil je mee doen aan seizoen 1? Vul je Minecraft username en je echte naam in, dan zet de admin je op de whitelist." as="p" className="mb-5 block text-muted-foreground" multiline />
          <WhitelistForm />
        </Reveal>
      </Section>
    ),
    donaties: () => (
      <Section id="donaties" title="💛 Donateurs Hall of Fame">
        <Reveal><DonationInstructions /></Reveal>
        {hasDonations && <Reveal><DonationBoard /></Reveal>}
      </Section>
    ),
    uren: () => (
      <Section id="uren" title="Openingsuren">
        <Reveal>
          <div className="block-card divide-y-2 divide-border">
            {hours.data?.map((h) => (
              <div key={h.id} className="flex justify-between p-4 font-pixel">
                <span>{h.day}</span>
                <span className="text-primary">{h.hours}</span>
              </div>
            ))}
          </div>
        </Reveal>
      </Section>
    ),
    meldingen: () => (
      <Section id="meldingen" title="Meldingen op je gsm">
        <Reveal>
          <div className="block-card space-y-5 p-6">
            <ol className="list-decimal space-y-1 pl-5 text-muted-foreground">
              <li><T k="notify.step1" def="Download de gratis app ntfy (Android of iPhone)." />{" "}
                <a className="underline" href="https://play.google.com/store/apps/details?id=io.heckel.ntfy" target="_blank" rel="noreferrer">Android</a> /{" "}
                <a className="underline" href="https://apps.apple.com/app/ntfy/id1625396347" target="_blank" rel="noreferrer">iPhone</a></li>
              <li><T k="notify.step2" def="Tik hieronder op wat je wilt volgen, of voeg de naam toe in de app met de +." /></li>
            </ol>
            <div className="grid gap-4 sm:grid-cols-2">
              {([["nieuws", "📢 Aankondigingen"], ["deaths", "☠ Dood meldingen"]] as const).map(([k, label]) => (
                <div key={k} className="border-2 border-border p-4">
                  <T k={`notify.${k}.title`} def={label} as="p" className="block font-pixel font-bold" />
                  <code className="mt-1 block break-all text-xs text-secondary">{TOPICS[k]}</code>
                  <a href={`ntfy://ntfy.sh/${TOPICS[k]}`} onClick={() => track(k === "nieuws" ? "sub_nieuws" : "sub_deaths")} className="btn-block mt-3"><T k="notify.button" def="Aanzetten" /></a>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </Section>
    ),
  };

  return (
    <SiteLayout>
      {blocks.map((block, i) => {
        const inner = render[block.kind]?.() ?? (
          ["text", "image", "video"].includes(block.kind)
            ? <CustomBlock block={block} onProps={(props) => update(blocks.map((b) => (b.id === block.id ? { ...b, props } : b)))} />
            : null
        );
        if (!inner) return null;
        return (
          <BlockFrame
            key={block.id}
            block={block}
            index={i}
            total={blocks.length}
            onMove={(from, to) => update(moveBlock(blocks, from, to))}
            onToggle={() => update(blocks.map((b) => (b.id === block.id ? { ...b, visible: !b.visible } : b)))}
            onDelete={() => update(blocks.filter((b) => b.id !== block.id))}
          >
            {inner}
          </BlockFrame>
        );
      })}
    </SiteLayout>
  );
}
