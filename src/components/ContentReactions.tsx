import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { Heart, MessageCircle, Send, Trash2 } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { fmtDate } from "@/lib/smp";
import { visitorId } from "@/lib/track";
import { toggleAnonLike, deleteAnonComment } from "@/lib/reactions.functions";

const commentSchema = z.object({
  name: z.string().trim().min(1, "Vul je naam in.").max(32),
  body: z.string().trim().min(1, "Schrijf eerst een reactie.").max(1000),
});

const likeKey = (kind: string, id: string) => `lk_like_${kind}_${id}`;
const tokenKey = (commentId: string) => `lk_ctok_${commentId}`;

export function ContentReactions({ kind, id }: { kind: "announcement" | "trailer"; id: string }) {
  const qc = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [limit, setLimit] = useState(20);
  const [ownLikeId, setOwnLikeId] = useState<string | null>(null);
  const column = kind === "announcement" ? "announcement_id" : "trailer_id";
  const key = ["reactions", kind, id, session?.user.id, limit];

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    setName(localStorage.getItem("lk_comment_name") ?? "");
    setOwnLikeId(localStorage.getItem(likeKey(kind, id)));
    return () => data.subscription.unsubscribe();
  }, [kind, id]);

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

  const liked = !!reactions.data?.ownId || !!ownLikeId;

  async function toggleLike() {
    setBusy(true); setError("");
    try {
      if (session) {
        const result = reactions.data?.ownId
          ? await supabase.from("content_likes").delete().eq("id", reactions.data.ownId)
          : await supabase.from("content_likes").insert({ announcement_id: kind === "announcement" ? id : null, trailer_id: kind === "trailer" ? id : null, user_id: session.user.id });
        if (result.error) throw result.error;
      } else {
        const result = await toggleAnonLike({ data: { kind, targetId: id, visitorId: visitorId(), likeId: ownLikeId ?? undefined } });
        if (result.liked && result.likeId) {
          localStorage.setItem(likeKey(kind, id), result.likeId);
          setOwnLikeId(result.likeId);
        } else {
          localStorage.removeItem(likeKey(kind, id));
          setOwnLikeId(null);
        }
      }
    } catch {
      setError("Je like kon niet opgeslagen worden. Probeer opnieuw.");
    }
    await qc.invalidateQueries({ queryKey: ["reactions", kind, id] });
    setBusy(false);
  }

  async function postComment(e: React.FormEvent) {
    e.preventDefault();
    const parsed = commentSchema.safeParse({ name, body });
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Controleer je reactie."); return; }
    setBusy(true); setError("");
    const token = crypto.randomUUID();
    const result = await supabase.from("content_comments").insert({
      announcement_id: kind === "announcement" ? id : null,
      trailer_id: kind === "trailer" ? id : null,
      user_id: session?.user.id ?? null,
      visitor_id: session ? null : visitorId(),
      delete_token: token,
      display_name: parsed.data.name,
      body: parsed.data.body,
    }).select("id").single();
    if (result.error) setError("Reactie niet geplaatst. Wacht enkele seconden en probeer opnieuw.");
    else {
      if (result.data?.id) localStorage.setItem(tokenKey(result.data.id), token);
      setBody("");
      localStorage.setItem("lk_comment_name", parsed.data.name);
      await qc.invalidateQueries({ queryKey: ["reactions", kind, id] });
    }
    setBusy(false);
  }

  async function removeComment(commentId: string, commentUserId: string | null) {
    setBusy(true); setError("");
    const token = localStorage.getItem(tokenKey(commentId));
    try {
      if (session && (session.user.id === commentUserId || reactions.data?.admin)) {
        const result = await supabase.from("content_comments").delete().eq("id", commentId);
        if (result.error) throw result.error;
      } else if (token) {
        await deleteAnonComment({ data: { commentId, token } });
        localStorage.removeItem(tokenKey(commentId));
      } else {
        setError("Je kunt deze reactie niet verwijderen.");
        setBusy(false);
        return;
      }
    } catch {
      setError("Verwijderen lukt niet. Probeer opnieuw.");
    }
    await qc.invalidateQueries({ queryKey: ["reactions", kind, id] });
    setBusy(false);
  }

  return (
    <div className="mt-4 border-t-2 border-border pt-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" aria-label={liked ? "Like verwijderen" : "Like"} aria-pressed={liked} disabled={busy || reactions.isPending || reactions.isError} onClick={toggleLike} className={`font-pixel ${liked ? "text-primary" : "text-muted-foreground"}`}>
          <Heart key={String(liked)} className={liked ? "reaction-pop fill-current" : ""} /> {reactions.data?.likes ?? 0}
        </Button>
        <Button variant="ghost" aria-expanded={expanded} onClick={() => setExpanded(!expanded)} className="font-pixel text-muted-foreground"><MessageCircle /> {reactions.data?.count ?? 0} reacties</Button>
      </div>
      {(error || reactions.isError) && <p role="alert" className="mt-2 text-sm text-destructive">{error || "Reacties laden niet. Probeer later opnieuw."}</p>}
      {expanded && (
        <div className="discussion-enter mt-4 space-y-4">
          <form onSubmit={postComment} className="space-y-2">
            <input aria-label="Naam bij reactie" className="field max-w-xs" value={name} onChange={(e) => setName(e.target.value)} maxLength={32} placeholder="Je Minecraft-naam" required />
            <textarea aria-label="Reactie" className="field min-h-20 resize-y" value={body} onChange={(e) => setBody(e.target.value)} maxLength={1000} placeholder="Wat vind jij?" required />
            <Button type="submit" disabled={busy} className="font-pixel"><Send /> Plaatsen</Button>
          </form>
          {reactions.isPending && <p className="text-sm text-muted-foreground">Reacties laden…</p>}
          {reactions.data?.count === 0 && <p className="text-sm text-muted-foreground">Nog geen reacties.</p>}
          <ul className="divide-y divide-border">
            {reactions.data?.comments.map((comment) => {
              const canDelete =
                (session && (session.user.id === comment.user_id || reactions.data?.admin)) ||
                !!localStorage.getItem(tokenKey(comment.id));
              return (
                <li key={comment.id} className="discussion-enter py-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0"><p className="break-words font-pixel font-bold">{comment.display_name}</p><p className="text-xs text-muted-foreground">{fmtDate(comment.created_at)}</p></div>
                    {canDelete && <Button variant="ghost" size="icon" aria-label="Reactie verwijderen" title="Reactie verwijderen" disabled={busy} onClick={() => removeComment(comment.id, comment.user_id)}><Trash2 className="text-destructive" /></Button>}
                  </div>
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm text-muted-foreground">{comment.body}</p>
                </li>
              );
            })}
          </ul>
          {(reactions.data?.count ?? 0) > limit && <Button variant="outline" onClick={() => setLimit(limit + 20)}>Meer reacties</Button>}
        </div>
      )}
    </div>
  );
}
