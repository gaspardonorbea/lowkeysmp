import { createFileRoute } from "@tanstack/react-router";
import { Skin } from "@/components/Skin";
import { usePlayers, fmtDate } from "@/lib/smp";
import { PageShell, Reveal } from "@/components/page";

export const Route = createFileRoute("/seizoen-1/deaths")({
  head: () => ({
    meta: [
      { title: "Deaths — LowkeySMP" },
      { name: "description", content: "Het death log van seizoen 1: wie ging dood, wanneer en waarom." },
      { property: "og:title", content: "Deaths — LowkeySMP" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Deaths,
});

function Deaths() {
  const players = usePlayers();
  const dead = (players.data?.filter((p) => p.is_dead) ?? []).sort(
    (a, b) => +new Date(b.died_at ?? 0) - +new Date(a.died_at ?? 0),
  );
  return (
    <PageShell title="Death log" subtitle={dead.length === 0 ? undefined : `${dead.length} ${dead.length === 1 ? "speler" : "spelers"} uitgeschakeld.`}>
      <div className="mx-auto max-w-3xl">
        {dead.length === 0 ? (
          <p className="text-center text-muted-foreground">Nog niemand dood. Lowkey peak.</p>
        ) : (
          <ol className="space-y-3">
            {dead.map((p, i) => (
              <Reveal key={p.id} delay={Math.min(i, 10) * 70}>
                <li className="block-card card-hover flex items-center gap-4 p-4">
                  <Skin name={p.name} size={40} alt="" className="h-10 w-10 [image-rendering:pixelated]" />
                  <div className="flex-1">
                    <p className="font-pixel font-bold">{p.name}</p>
                    <p className="text-sm text-muted-foreground">{p.death_cause || "Onbekende oorzaak"}</p>
                  </div>
                  <span className="text-right text-xs text-destructive">{fmtDate(p.died_at)}</span>
                </li>
              </Reveal>
            ))}
          </ol>
        )}
      </div>
    </PageShell>
  );
}
