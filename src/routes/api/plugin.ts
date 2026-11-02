import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const Death = z.object({
  type: z.literal("death"),
  player: z.string().trim().min(1).max(32),
  uuid: z.string().max(64).optional(),
  diedAt: z.string().datetime({ offset: true }).optional(),
  cause: z.string().max(300).optional().default(""),
  location: z.enum(["main", "island"]).default("main"),
});
const Stats = z.object({
  type: z.literal("stats"),
  players: z
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
    .max(500),
});
const Body = z.discriminatedUnion("type", [z.object({ type: z.literal("ping") }), Death, Stats]);

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
          const since = new Date(Date.now() - 2 * 60 * 1000).toISOString();
          const { data: recent, error: e1 } = await supabaseAdmin
            .from("death_reports").select("id")
            .eq("player_name", body.player).eq("status", "pending").gte("created_at", since).limit(1);
          if (e1) return Response.json({ error: e1.message }, { status: 500 });
          if (recent && recent.length) return Response.json({ ok: true, skipped: true });
          const { error } = await supabaseAdmin.from("death_reports").insert({
            player_name: body.player,
            died_at: body.diedAt ?? new Date().toISOString(),
            cause: body.cause,
            location: body.location,
            status: "pending",
          });
          if (error) return Response.json({ error: error.message }, { status: 500 });
          return Response.json({ ok: true });
        }

        const now = new Date().toISOString();
        const rows = body.players.map((p) => ({
          uuid: p.uuid, name: p.name, playtime_seconds: p.playtimeSeconds, kills: p.kills,
          totem_pops: p.totemPops, jumps: p.jumps, km_walked: p.kmWalked, updated_at: now,
        }));
        if (rows.length) {
          const { error } = await supabaseAdmin.from("player_stats").upsert(rows, { onConflict: "uuid" });
          if (error) return Response.json({ error: error.message }, { status: 500 });
        }
        return Response.json({ ok: true, count: rows.length });
      },
    },
  },
});
