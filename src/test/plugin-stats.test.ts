import { describe, expect, it } from "vitest";
import { pluginStatRows } from "@/lib/plugin-stats";

const player = { uuid: "test-uuid", name: "DonutGaspa", kills: 11, playtimeSeconds: 3600, totemPops: 2, jumps: 123, kmWalked: 4.5 };
describe("manual kills during plugin sync", () => {
  it.each(["stats", "statsReset"])("ignores server kills for %s", () => {
    expect(pluginStatRows([player], "now")[0]).not.toHaveProperty("kills");
  });
  it("keeps all other server stats", () => {
    expect(pluginStatRows([player], "now")).toEqual([{ uuid: "test-uuid", name: "DonutGaspa", playtime_seconds: 3600, totem_pops: 2, jumps: 123, km_walked: 4.5, updated_at: "now" }]);
  });
  it("still excludes the server account", () => {
    expect(pluginStatRows([{ ...player, name: "Lowkey_SMP" }], "now")).toEqual([]);
  });
});