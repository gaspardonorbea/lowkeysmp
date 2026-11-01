export type SkinKind = "head" | "bust" | "body";

/** Several skin servers in a row: when one is down or does not know the name, the next one is tried. */
export function skinCandidates(name: string, kind: SkinKind, size: number): string[] {
  const n = encodeURIComponent(name.trim());
  if (kind === "head") return [`https://mc-heads.net/avatar/${n}/${size}`, `https://minotar.net/helm/${n}/${size}.png`, `https://crafatar.com/avatars/${n}?size=${size}&overlay`];
  if (kind === "bust") return [`https://minotar.net/armor/bust/${n}/${size}.png`, `https://mc-heads.net/head/${n}/${size}`];
  return [`https://mc-heads.net/body/${n}/${size}`, `https://minotar.net/armor/body/${n}/${size}.png`];
}

export type SkinLookup =
  | { status: "ok"; name: string; uuid: string; rawId: string }
  | { status: "missing" }
  | { status: "error" };

const NAME_OK = /^[A-Za-z0-9_]{3,16}$/;
export const isValidMcName = (name: string) => NAME_OK.test(name.trim());

/** Asks a public Minecraft profile service (CORS friendly) if this name exists and what its UUID is. */
export async function lookupMinecraftName(name: string, signal?: AbortSignal): Promise<SkinLookup> {
  if (!isValidMcName(name)) return { status: "missing" };
  try {
    const res = await fetch(`https://playerdb.co/api/player/minecraft/${encodeURIComponent(name.trim())}`, signal ? { signal } : {});
    if (res.status === 404 || res.status === 400) return { status: "missing" };
    if (!res.ok) return { status: "error" };
    const json = await res.json();
    const p = json?.data?.player;
    if (!json?.success || !p) return { status: "missing" };
    return { status: "ok", name: p.username as string, uuid: p.id as string, rawId: (p.raw_id ?? "") as string };
  } catch {
    return { status: "error" };
  }
}
