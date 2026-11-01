import { useEffect, useState } from "react";
import { skinCandidates, type SkinKind } from "@/lib/skin";

const PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 8 8' shape-rendering='crispEdges'><rect width='8' height='8' fill='#c68863'/><rect width='8' height='2' fill='#3b2a1a'/><rect y='2' width='1' height='2' fill='#3b2a1a'/><rect x='7' y='2' width='1' height='2' fill='#3b2a1a'/><rect x='2' y='4' width='1' height='1' fill='#223'/><rect x='5' y='4' width='1' height='1' fill='#223'/></svg>`,
  );

/** A Minecraft skin picture that falls back to the next skin server and finally to a plain face. */
export function Skin({
  name, kind = "head", size = 64, alt = "", className = "", loading = "lazy", style,
}: { name: string; kind?: SkinKind; size?: number; alt?: string; className?: string; loading?: "lazy" | "eager"; style?: React.CSSProperties }) {
  const urls = skinCandidates(name || "MHF_Steve", kind, size);
  const [i, setI] = useState(0);
  useEffect(() => setI(0), [name, kind, size]);
  return (
    <img
      src={i < urls.length ? urls[i] : PLACEHOLDER}
      alt={alt}
      width={kind === "body" ? undefined : size}
      height={kind === "body" ? undefined : size}
      loading={loading}
      style={style}
      onError={() => setI((v) => v + 1)}
      className={`${kind === "head" ? "[image-rendering:pixelated]" : ""} ${className}`}
    />
  );
}
