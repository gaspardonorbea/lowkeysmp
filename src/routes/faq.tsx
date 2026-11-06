import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronDown, Search, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageShell, Reveal } from "@/components/page";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "Veelgestelde vragen — LowkeySMP" },
      { name: "description", content: "Alle antwoorden over LowkeySMP: regels, grace, Verliezerseiland, finales. Stel ook zelf je vraag." },
      { property: "og:title", content: "Veelgestelde vragen — LowkeySMP" },
      { property: "og:description", content: "Alle antwoorden over LowkeySMP, of stel zelf een vraag." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Faq,
});

type Row = { id: string; question: string; answer: string | null };

function Faq() {
  const [rows, setRows] = useState<Row[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [q, setQ] = useState("");
  useEffect(() => {
    supabase.from("faq").select("id,question,answer").order("sort").order("created_at").then(({ data }) => setRows(data ?? []));
  }, []);
  const list = rows.filter((r) => (r.question + " " + r.answer).toLowerCase().includes(q.toLowerCase()));

  return (
    <PageShell title="Veelgestelde vragen" subtitle="Alles wat je moet weten. Staat je vraag er niet bij? Stel hem hieronder.">
      <div className="mx-auto max-w-3xl">
        <label className="block-card mb-6 flex items-center gap-3 px-4 py-3">
          <Search className="size-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Zoek een vraag..." className="flex-1 bg-transparent outline-none" />
        </label>
        <div className="space-y-3">
          {list.map((r, i) => {
            const isOpen = open === r.id;
            return (
              <Reveal key={r.id} delay={Math.min(i, 8) * 40}>
                <div className={`block-card transition-colors ${isOpen ? "border-primary" : ""}`}>
                  <button onClick={() => setOpen(isOpen ? null : r.id)} className="flex w-full items-center gap-3 p-4 text-left" aria-expanded={isOpen}>
                    <span className="font-pixel flex-1 font-bold">{r.question}</span>
                    <ChevronDown className={`size-5 shrink-0 transition-transform ${isOpen ? "rotate-180 text-primary" : ""}`} />
                  </button>
                  <div className={`grid transition-all duration-300 ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                    <p className="overflow-hidden whitespace-pre-line px-4 text-muted-foreground"><span className="block pb-4">{r.answer}</span></p>
                  </div>
                </div>
              </Reveal>
            );
          })}
          {list.length === 0 && <p className="text-center text-muted-foreground">Geen vragen gevonden.</p>}
        </div>
        <AskForm />
      </div>
    </PageShell>
  );
}

function AskForm() {
  const [name, setName] = useState("");
  const [question, setQuestion] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "err">("idle");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (question.trim().length < 3) return;
    setState("busy");
    const { error } = await supabase.from("faq").insert({ question: question.trim().slice(0, 500), asker_name: name.trim().slice(0, 40) || null });
    setState(error ? "err" : "done");
    if (!error) setQuestion("");
  };
  return (
    <form onSubmit={submit} className="block-card mt-12 space-y-3 border-secondary p-6">
      <h2 className="font-pixel text-2xl font-bold">Stel zelf een vraag</h2>
      <p className="text-sm text-muted-foreground">De crew beantwoordt je vraag. Goede vragen komen hierboven in de lijst.</p>
      <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder="Je naam (optioneel)" className="w-full border-2 border-border bg-background px-3 py-2" />
      <textarea value={question} onChange={(e) => setQuestion(e.target.value)} maxLength={500} rows={3} required placeholder="Je vraag..." className="w-full border-2 border-border bg-background px-3 py-2" />
      <button disabled={state === "busy"} className="btn-block inline-flex items-center gap-2"><Send className="size-4" /> Versturen</button>
      {state === "done" && <p className="text-sm text-primary">Bedankt! Je vraag is verstuurd.</p>}
      {state === "err" && <p className="text-sm text-destructive">Versturen mislukt, probeer opnieuw.</p>}
    </form>
  );
}
