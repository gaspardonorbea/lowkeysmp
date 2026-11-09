export const IGNORED_STAT_NAME = "lowkey_smp";

export type PluginPlayerStats = {
  uuid: string; name: string; playtimeSeconds: number; kills?: number;
  totemPops: number; jumps: number; kmWalked: number;
};

/** Kill totals are deliberately omitted: the database applies manual totals. */
export function pluginStatRows(players: PluginPlayerStats[], now: string) {
  return players.filter((p) => p.name.trim().toLowerCase() !== IGNORED_STAT_NAME).map((p) => ({
    uuid: p.uuid, name: p.name, playtime_seconds: p.playtimeSeconds,
    totem_pops: p.totemPops, jumps: p.jumps, km_walked: p.kmWalked, updated_at: now,
  }));
}