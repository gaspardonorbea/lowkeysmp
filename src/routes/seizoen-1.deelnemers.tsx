import { createFileRoute } from "@tanstack/react-router";
import { Skin } from "@/components/Skin";
import { usePlayers } from "@/lib/smp";
import { PageShell, Reveal } from "@/components/page";

export const Route = createFileRoute("/seizoen-1/deelnemers")({
  head: () => ({
    meta: [
      { title: "Deelnemers — LowkeySMP" },
      { name: "description", content: "Alle deelnemers van seizoen 1 van LowkeySMP, per team." },
      { property: "og:title", content: "Deelnemers — LowkeySMP" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Deelnemers,
});

type P = NonNullable<ReturnType<typeof usePlayers>["data"]>[number];

function Card({ p, i }: { p: P; i: number }) {
  return (
    <Reveal delay={Math.min(i, 12) * 50}>
      <div className={`block-card card-hover p-4 text-center ${p.is_dead ? "opacity-50 grayscale" : ""}`}>
        <Skin name={p.name} size={64}
          alt={p.name}
          className="mx-auto mb-3 h-16 w-16 [image-rendering:pixelated]"
          loading="lazy"
        />
        <p className="font-pixel font-bold">{p.name}</p>
        <p className="text-xs text-secondary">{p.role}</p>
        {p.is_dead && <p className="mt-1 text-xs text-destructive">☠ dood</p>}
      </div>
    </Reveal>
  );
}

function Group({ title, color, list }: { title: string; color: string; list: P[] }) {
  if (list.length === 0) return null;
  const alive = list.filter((p) => !p.is_dead).length;
  return (
    <section className="mb-12">
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <span className={`px-3 py-1 font-pixel text-sm text-foreground ${color}`}>{title}</span>
        <span className="text-sm text-muted-foreground">{alive} van {list.length} levend</span>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {list.map((p, i) => <Card key={p.id} p={p} i={i} />)}
      </div>
    </section>
  );
}

function Deelnemers() {
  const players = usePlayers();
  const all = players.data ?? [];
  return (
    <PageShell title="Deelnemers" subtitle={`${all.length} spelers doen mee aan seizoen 1.`}>
      {players.isLoading && <p className="text-center text-muted-foreground">Laden...</p>}
      {!players.isLoading && all.length === 0 && <p className="text-center text-muted-foreground">Nog geen deelnemers.</p>}
      <Group title="Team Noord" color="bg-team-noord" list={all.filter((p) => p.team === "noord")} />
      <Group title="Team Zuid" color="bg-team-zuid" list={all.filter((p) => p.team === "zuid")} />
      <Group title="Zonder team" color="bg-muted" list={all.filter((p) => p.team !== "noord" && p.team !== "zuid")} />
    </PageShell>
  );
}
