import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ElementType, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

// site_content is not part of the generated types yet, so this client is loosely typed on purpose.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db = supabase as unknown as SupabaseClient<any, "public", any>;

type Content = Record<string, unknown>;

/** Every editable thing on the site lives in one table: key -> json value. Missing keys fall back to the default in the code. */
export function useSiteContent() {
  return useQuery({
    queryKey: ["site_content"],
    staleTime: 30_000,
    queryFn: async (): Promise<Content> => {
      const { data, error } = await db.from("site_content").select("key,value");
      if (error) return {}; // table not created yet: the site just uses its defaults
      return Object.fromEntries((data ?? []).map((r: { key: string; value: unknown }) => [r.key, r.value]));
    },
  });
}

export function useContent<V>(key: string, def: V): V {
  const { data } = useSiteContent();
  const v = data?.[key];
  return v === undefined || v === null ? def : (v as V);
}

export function useSaveContent() {
  const qc = useQueryClient();
  return useCallback(
    async (key: string, value: unknown) => {
      qc.setQueryData<Content>(["site_content"], (old) => ({ ...(old ?? {}), [key]: value }));
      const { error } = await db.from("site_content").upsert({ key, value, updated_at: new Date().toISOString() });
      if (error) {
        qc.invalidateQueries({ queryKey: ["site_content"] });
        alert("Opslaan lukt niet. Heb je de SQL 0008_site_cms.sql al uitgevoerd en ben je ingelogd als admin?");
      }
    },
    [qc],
  );
}

type EditState = { isAdmin: boolean; editing: boolean; setEditing: (v: boolean) => void };
const EditCtx = createContext<EditState>({ isAdmin: false, editing: false, setEditing: () => {} });
export const useEdit = () => useContext(EditCtx);

export function EditProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [editing, setEditingState] = useState(false);

  useEffect(() => {
    let alive = true;
    const check = async (uid?: string) => {
      if (!uid) return alive && setIsAdmin(false);
      const { data } = await db.from("user_roles").select("role").eq("user_id", uid).eq("role", "admin").maybeSingle();
      if (alive) setIsAdmin(!!data);
    };
    supabase.auth.getSession().then(({ data }) => check(data.session?.user.id));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => check(s?.user.id));
    try { setEditingState(localStorage.getItem("lk_edit") === "1"); } catch { /* ignore */ }
    return () => { alive = false; sub.subscription.unsubscribe(); };
  }, []);

  const setEditing = useCallback((v: boolean) => {
    setEditingState(v);
    try { localStorage.setItem("lk_edit", v ? "1" : "0"); } catch { /* ignore */ }
  }, []);

  const value = useMemo(() => ({ isAdmin, editing: isAdmin && editing, setEditing }), [isAdmin, editing, setEditing]);
  return <EditCtx.Provider value={value}>{children}</EditCtx.Provider>;
}

/** Editable text. Visitors see plain text; an admin in edit mode clicks it and types. */
export function T({
  k, def, as, className = "", multiline = false,
}: { k: string; def: string; as?: ElementType; className?: string; multiline?: boolean }) {
  const Tag = (as ?? "span") as ElementType;
  const value = useContent<string>(k, def);
  const save = useSaveContent();
  const { editing } = useEdit();
  const base = `${className} ${multiline ? "whitespace-pre-line" : ""}`;
  if (!editing) return <Tag className={base}>{value}</Tag>;
  return (
    <Tag
      className={`${base} cursor-text outline-dashed outline-1 outline-offset-2 outline-primary/60 hover:outline-primary focus:outline-solid focus:outline-2`}
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      onClick={(e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); }}
      onKeyDown={(e: React.KeyboardEvent) => {
        e.stopPropagation();
        if (e.key === "Enter" && !multiline) { e.preventDefault(); (e.currentTarget as HTMLElement).blur(); }
      }}
      onBlur={(e: React.FocusEvent<HTMLElement>) => {
        const next = e.currentTarget.innerText.replace(/\u00a0/g, " ").trim();
        if (next && next !== value) save(k, next);
        else e.currentTarget.innerText = value;
      }}
    >
      {value}
    </Tag>
  );
}
