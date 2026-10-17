import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const likeInput = z.object({
  kind: z.enum(["announcement", "trailer"]),
  targetId: z.string().uuid(),
  visitorId: z.string().uuid(),
  likeId: z.string().uuid().optional(),
});

// Anonieme like aan/uit. visitor_id is niet leesbaar via de API, dus alleen
// het toestel dat de like plaatste kan hem ook weer verwijderen.
export const toggleAnonLike = createServerFn({ method: "POST" })
  .inputValidator((data) => likeInput.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const col = data.kind === "announcement" ? "announcement_id" : "trailer_id";
    if (data.likeId) {
      const { error } = await supabaseAdmin
        .from("content_likes")
        .delete()
        .eq("id", data.likeId)
        .eq("visitor_id", data.visitorId);
      if (error) throw new Error("Like verwijderen mislukt");
      return { liked: false as const, likeId: null };
    }
    const like =
      data.kind === "announcement"
        ? { announcement_id: data.targetId, trailer_id: null, visitor_id: data.visitorId, user_id: null }
        : { announcement_id: null, trailer_id: data.targetId, visitor_id: data.visitorId, user_id: null };
    const { data: row, error } = await supabaseAdmin
      .from("content_likes")
      .insert(like)
      .select("id")
      .single();
    if (error) throw new Error("Like plaatsen mislukt");
    return { liked: true as const, likeId: row.id as string };
  });

const deleteInput = z.object({
  commentId: z.string().uuid(),
  token: z.string().uuid(),
});

// Anoniem een eigen reactie verwijderen met het geheime token dat bij het
// plaatsen op het toestel werd opgeslagen.
export const deleteAnonComment = createServerFn({ method: "POST" })
  .inputValidator((data) => deleteInput.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error, count } = await supabaseAdmin
      .from("content_comments")
      .delete({ count: "exact" })
      .eq("id", data.commentId)
      .eq("delete_token", data.token);
    if (error) throw new Error("Verwijderen mislukt");
    if (!count) throw new Error("Reactie niet gevonden of geen toestemming");
    return { ok: true };
  });
