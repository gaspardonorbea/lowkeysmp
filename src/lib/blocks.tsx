import { useCallback, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, GripVertical, Trash2 } from "lucide-react";
import { useContent, useEdit, useSaveContent } from "@/lib/cms";

export type Block = { id: string; kind: string; visible: boolean; props?: Record<string, string> };

export const BUILTIN_LABELS: Record<string, string> = {
  hero: "Header met logo",
  media: "Video en aankondiging",
  timeline: "Tijdlijn",
  server: "Server IP",
  aanmelden: "Aanmelden",
  donaties: "Donateurs",
  uren: "Openingsuren",
  meldingen: "Meldingen op je gsm",
};

export const CUSTOM_LABELS: Record<string, string> = { text: "Tekstblok", image: "Afbeelding", video: "Video" };

export const HOME_DEFAULT: Block[] = Object.keys(BUILTIN_LABELS).map((id) => ({ id, kind: id, visible: true }));

/** The saved order plus any built-in block that is not saved yet (so new blocks never go missing). */
export function useBlocks(page: string) {
  const saved = useContent<Block[] | null>(`blocks.${page}`, null);
  const save = useSaveContent();
  const base = HOME_DEFAULT;
  const blocks = saved ? [...saved, ...base.filter((b) => !saved.some((s) => s.id === b.id))] : base;
  const update = useCallback((next: Block[]) => save(`blocks.${page}`, next), [save, page]);
  return { blocks, update };
}

const label = (b: Block) => BUILTIN_LABELS[b.kind] ?? CUSTOM_LABELS[b.kind] ?? b.kind;

/** Wraps a block. Visitors see only the block itself; in edit mode it gets a bar to move, hide and delete it. */
export function BlockFrame({
  block, index, total, onMove, onToggle, onDelete, children,
}: {
  block: Block; index: number; total: number;
  onMove: (from: number, to: number) => void; onToggle: () => void; onDelete: () => void; children: ReactNode;
}) {
  const { editing } = useEdit();
  const [over, setOver] = useState(false);
  if (!editing) return block.visible ? <>{children}</> : null;
  const custom = !(block.kind in BUILTIN_LABELS);
  return (
    <div
      className={`relative border-2 border-dashed ${over ? "border-gold bg-gold/5" : "border-primary/40"} ${block.visible ? "" : "opacity-45"}`}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault(); setOver(false);
        const from = Number(e.dataTransfer.getData("text/block"));
        if (!Number.isNaN(from) && from !== index) onMove(from, index);
      }}
    >
      <div className="sticky top-16 z-10 flex flex-wrap items-center gap-1 border-b-2 border-dashed border-primary/40 bg-background/95 px-2 py-1 font-pixel text-xs backdrop-blur">
        <span
          draggable
          onDragStart={(e) => e.dataTransfer.setData("text/block", String(index))}
          className="flex cursor-grab items-center gap-1 px-1 text-primary active:cursor-grabbing"
          title="Sleep om te verplaatsen"
        >
          <GripVertical className="size-4" /> {label(block)}
        </span>
        <button className="p-1 hover:text-primary disabled:opacity-30" disabled={index === 0} onClick={() => onMove(index, index - 1)} title="Omhoog"><ArrowUp className="size-4" /></button>
        <button className="p-1 hover:text-primary disabled:opacity-30" disabled={index === total - 1} onClick={() => onMove(index, index + 1)} title="Omlaag"><ArrowDown className="size-4" /></button>
        <button className="p-1 hover:text-primary" onClick={onToggle} title={block.visible ? "Verbergen" : "Tonen"}>{block.visible ? <Eye className="size-4" /> : <EyeOff className="size-4" />}</button>
        {custom && <button className="p-1 text-destructive hover:brightness-125" onClick={() => { if (confirm("Dit blok verwijderen?")) onDelete(); }} title="Verwijderen"><Trash2 className="size-4" /></button>}
        {!block.visible && <span className="ml-1 text-muted-foreground">verborgen voor bezoekers</span>}
      </div>
      {children}
    </div>
  );
}

export function moveBlock(blocks: Block[], from: number, to: number): Block[] {
  const next = [...blocks];
  const [item] = next.splice(from, 1);
  if (item) next.splice(Math.max(0, Math.min(next.length, to)), 0, item);
  return next;
}
