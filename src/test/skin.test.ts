import { describe, expect, it } from "vitest";
import { skinCandidates } from "@/lib/skin";

describe("skin provider fallback", () => {
  it("requests current heads by trimmed player name", () => {
    expect(skinCandidates(" donutgaspa ", "head", 48)).toEqual([
      "https://crafthead.net/avatar/donutgaspa/48",
      "https://mc-heads.net/avatar/donutgaspa/48",
      "https://minotar.net/helm/donutgaspa/48.png",
    ]);
  });
});