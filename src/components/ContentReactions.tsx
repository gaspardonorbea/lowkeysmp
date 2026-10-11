import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { Heart, MessageCircle, Send, Trash2, LogIn } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fmtDate } from "@/lib/smp";

const commentSchema = z.object({
  name: z.string().trim().min(1, "Vul je naam in.").max(32),
  body: z.string().trim().min(1, "Schrijf eerst een reactie.").max(1000),
});

export function ContentReactions({ kind, id }: { kind: "announcement" | "trailer"; id: string }) {
  const qc = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [signup, setSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [limit, setLimit] = useState(20);
  const column = kind === "announcement" ? "announcement_id" : "trailer_id";
  const key = ["reactions", kind, id, session?.user.id, limit];

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    setName(localStorage.getItem("lk_comment_name") ?? "");
    return () => data.subscription.unsubscribe();
  }, []);

  const reactions = useQuery({
    queryKey: key,
    refetchInterval: 15000,
    queryFn: async () => {
      const [comments, likes, own, role] = await Promise.all([
        supabase.from("content_comments").select("*", { count: "exact" }).eq(column, id).order("created_at", { ascending: false }).limit(limit),
        supabase.from("content_likes").select("id", { count: "exact", head: true }).eq(column, id),
        session ? supabase.from("content_likes").select("id").eq(column, id).eq("user_id", session.user.id).maybeSingle() : Promise.resolve({ data: null, error: null }),
        session ? supabase.from("user_roles").select("role").eq("user_id", session.user.id) : Promise.resolve({ data: [], error: null }),
      ]);
      for (const result of [comments, likes, own, role]) if (result.error) throw result.error;
      return { comments: comments.data ?? [], count: comments.count ?? 0, likes: likes.count ?? 0, ownId: own.data?.id, admin: role.data?.some((r) => r.role === "admin") ?? false };
    },
  });

  async function toggleLike() {
    if (!session) { setAuthOpen(true); return; }
    setBusy(true); setError("");
    const result = reactions.data?.ownId
      ? await supabase.from("content_likes").delete().eq("id", reactions.data.ownId)
      : await supabase.from("content_likes").insert({ announcement_id: kind === "announcement" ? id : null, trailer_id: kind === "trailer" ? id : null, user_id: session.user.id });
    if (result.error) setError("Je like kon niet opgeslagen worden. Probeer opnieuw.");
    await qc.invalidateQueries({ queryKey: ["reactions", kind, id] });
    setBusy(false);
  }

  async function postComment(e: React.FormEvent) {
    e.preventDefault();
    if (!session) { setAuthOpen(true); return; }
    const parsed = commentSchema.safeParse({ name, body });
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Controleer je reactie."); return; }
    setBusy(true); setError("");
    const result = await supabase.from("content_comments").insert({ announcement_id: kind === "announcement" ? id : null, trailer_id: kind === "trailer" ? id : null, user_id: session.user.id, display_name: parsed.data.name, body: parsed.data.body });
    if (result.error) setError("Reactie niet geplaatst. Wacht enkele seconden en probeer opnieuw.");
    else { setBody(""); localStorage.setItem("lk_comment_name", parsed.data.name); await qc.invalidateQueries({ queryKey: ["reactions", kind, id] }); }
    setBusy(false);
  }

  async function authenticate(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setAuthMessage("");
    const result = signup
      ? await supabase.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: window.location.origin } })
      : await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (result.error) setAuthMessage(signup ? "Account aanmaken lukt niet. Controleer je gegevens of probeer in te loggen." : "Inloggen lukt niet. Controleer je e-mail en wachtwoord.");
    else if (result.data.session) { setAuthOpen(false); setPassword(""); }
    else setAuthMessage("Controleer je e-mail om je account te bevestigen. Daarna kun je inloggen.");
  }

  return (
    <div className="mt-4 border-t-2 border-border pt-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" aria-label={reactions.data?.ownId ? "Like verwijderen" : "Like"} aria-pressed={!!reactions.data?.ownId} disabled={busy || reactions.isPending || reactions.isError} onClick={toggleLike} className={`font-pixel ${reactions.data?.ownId ? "text-primary" : "text-muted-foreground"}`}>
          <Heart key={String(!!reactions.data?.ownId)} className={reactions.data?.ownId ? "reaction-pop fill-current" : ""} /> {reactions.data?.likes ?? 0}
        </Button>
        <Button variant="ghost" aria-expanded={expanded} onClick={() => setExpanded(!expanded)} className="font-pixel text-muted-foreground"><MessageCircle /> {reactions.data?.count ?? 0} reacties</Button>
      </div>
      {(error || reactions.isError) && <p role="alert" className="mt-2 text-sm text-destructive">{error || "Reacties laden niet. Probeer later opnieuw."}</p>}
      {expanded && (
        <div className="discussion-enter mt-4 space-y-4">
          {session ? (
            <form onSubmit={postComment} className="space-y-2">
              <input aria-label="Naam bij reactie" className="field max-w-xs" value={name} onChange={(e) => setName(e.target.value)} maxLength={32} placeholder="Je Minecraft-naam" required />
              <textarea aria-label="Reactie" className="field min-h-20 resize-y" value={body} onChange={(e) => setBody(e.target.value)} maxLength={1000} placeholder="Wat vind jij?" required />
              <Button type="submit" disabled={busy} className="font-pixel"><Send /> Plaatsen</Button>
            </form>
          ) : <Button variant="outline" onClick={() => setAuthOpen(true)} className="font-pixel"><LogIn /> Inloggen om te reageren</Button>}
          {reactions.isPending && <p className="text-sm text-muted-foreground">Reacties laden…</p>}
          {reactions.data?.count === 0 && <p className="text-sm text-muted-foreground">Nog geen reacties.</p>}
          <ul className="divide-y divide-border">
            {reactions.data?.comments.map((comment) => (
              <li key={comment.id} className="discussion-enter py-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0"><p className="break-words font-pixel font-bold">{comment.display_name}</p><p className="text-xs text-muted-foreground">{fmtDate(comment.created_at)}</p></div>
                  {(session?.user.id === comment.user_id || reactions.data?.admin) && <Button variant="ghost" size="icon" aria-label="Reactie verwijderen" title="Reactie verwijderen" disabled={busy} onClick={async () => {
                    setBusy(true);
                    const result = await supabase.from("content_comments").delete().eq("id", comment.id);
                    if (result.error) setError("Verwijderen lukt niet. Probeer opnieuw.");
                    await qc.invalidateQueries({ queryKey: ["reactions", kind, id] }); setBusy(false);
                  }}><Trash2 className="text-destructive" /></Button>}
                </div>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm text-muted-foreground">{comment.body}</p>
              </li>
            ))}
          </ul>
          {(reactions.data?.count ?? 0) > limit && <Button variant="outline" onClick={() => setLimit(limit + 20)}>Meer reacties</Button>}
        </div>
      )}
      <Dialog open={authOpen} onOpenChange={setAuthOpen}>
        <DialogContent className="border-2 border-border">
          <DialogHeader><DialogTitle className="font-pixel text-2xl">{signup ? "Account aanmaken" : "Inloggen"}</DialogTitle></DialogHeader>
          <form onSubmit={authenticate} className="space-y-4">
            <label className="block space-y-1 text-sm"><span>E-mail</span><input className="field" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={254} /></label>
            <label className="block space-y-1 text-sm"><span>Wachtwoord</span><input className="field" type="password" autoComplete={signup ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} maxLength={128} /></label>
            {authMessage && <p role="status" className="text-sm text-muted-foreground">{authMessage}</p>}
            <Button type="submit" disabled={busy} className="w-full font-pixel">{signup ? "Account aanmaken" : "Inloggen"}</Button>
            <Button type="button" variant="link" onClick={() => { setSignup(!signup); setAuthMessage(""); }}>{signup ? "Al een account? Inloggen" : "Nog geen account? Aanmaken"}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}