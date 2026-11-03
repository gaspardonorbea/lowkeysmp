import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const Death = z.object({
  type: z.literal("death"),
  player: z.string().trim().min(1).max(32),
  uuid: z.string().max(64).optional(),
  eventId: z.string().trim().min(1).max(128).optional(),
  diedAt: z.string().datetime({ offset: true }).optional(),
  cause: z.string().max(300).optional().default(""),
  location: z.enum(["main", "island"]).default("main"),
});
const StatPlayers = z
  .array(
    z.object({
      uuid: z.string().min(1).max(64),
      name: z.string().min(1).max(32),
      playtimeSeconds: z.number().int().min(0).default(0),
      kills: z.number().int().min(0).default(0),
      totemPops: z.number().int().min(0).default(0),
      jumps: z.number().int().min(0).default(0),
      kmWalked: z.number().min(0).default(0),
    }),
  )
  .max(500);
const Stats = z.object({ type: z.literal("stats"), players: StatPlayers });
const StatsReset = z.object({ type: z.literal("statsReset"), players: StatPlayers });
const Body = z.discriminatedUnion("type", [z.object({ type: z.literal("ping") }), Death, Stats, StatsReset]);

/** The server's own account never counts as a player. */
export const IGNORED_STAT_NAME = "lowkey_smp";

async function authorized(request: Request) {
  const secret = process.env["PLUGIN_TOKEN"];
  if (!secret) return false;
  const m = /^Bearer (\S+)$/.exec(request.headers.get("authorization") ?? "");
  if (!m) return false;
  const { createHash, timingSafeEqual } = await import("node:crypto");
  const d = (v: string) => createHash("sha256").update(v, "utf8").digest();
  return timingSafeEqual(d(m[1] ?? ""), d(secret));
}

export const Route = createFileRoute("/api/plugin")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!(await authorized(request))) return Response.json({ error: "unauthorized" }, { status: 401 });
        let json: unknown;
        try { json = await request.json(); } catch { return Response.json({ error: "invalid json" }, { status: 400 }); }
        const parsed = Body.safeParse(json);
        if (!parsed.success) return Response.json({ error: "invalid body", issues: parsed.error.issues }, { status: 400 });
        const body = parsed.data;
        if (body.type === "ping") return Response.json({ ok: true });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        if (body.type === "death") {
          const diedAt = new Date(body.diedAt ?? Date.now()).toISOString();
          // Duplicate = same eventId, or same player + location + exact death time.
          const sameEvent = body.eventId
            ? await supabaseAdmin.from("death_reports").select("id").eq("event_id", body.eventId).limit(1)
            : { data: [], error: null };
          if (sameEvent.error) return Response.json({ error: sameEvent.error.message }, { status: 500 });
          const sameDeath = await supabaseAdmin.from("death_reports").select("id")
            .eq("player_name", body.player).eq("location", body.location).eq("died_at", diedAt).limit(1);
          if (sameDeath.error) return Response.json({ error: sameDeath.error.message }, { status: 500 });
          if (sameEvent.data?.length || sameDeath.data?.length) return Response.json({ ok: true, skipped: true });
          const { error } = await supabaseAdmin.from("death_reports").insert({
            player_name: body.player,
            died_at: diedAt,
            cause: body.cause,
            location: body.location,
            event_id: body.eventId ?? null,
            status: "pending",
          });
          if (error) return Response.json({ error: error.message }, { status: 500 });
          return Response.json({ ok: true });
        }

        const now = new Date().toISOString();
        const rows = body.players
          .filter((p) => p.name.trim().toLowerCase() !== IGNORED_STAT_NAME)
          .map((p) => ({
            uuid: p.uuid, name: p.name, playtime_seconds: p.playtimeSeconds, kills: p.kills,
            totem_pops: p.totemPops, jumps: p.jumps, km_walked: p.kmWalked, updated_at: now,
          }));
        if (body.type === "statsReset") {
          const { error } = await supabaseAdmin.from("player_stats").delete().not("uuid", "is", null);
          if (error) return Response.json({ error: error.message }, { status: 500 });
        }
        if (rows.length) {
          const { error } = await supabaseAdmin.from("player_stats").upsert(rows, { onConflict: "uuid" });
          if (error) return Response.json({ error: error.message }, { status: 500 });
        }
        return Response.json({ ok: true, count: rows.length, ...(body.type === "statsReset" ? { reset: true } : {}) });
      },
    },
  },
});
