import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";


export type AnnouncementRow = {
  id: string; title: string; body: string; pinned: boolean; created_at: string;
  image_url: string | null; images: string[]; /** storage paths of every photo (old single photo included) */ paths: string[]; /** signed urls, same order as paths */ photos: string[];
};

const signAnnouncementPath = async (saved: string): Promise<string | null> => {
  const isBucketUrl = saved.includes("/announcement-images/");
  const path = isBucketUrl ? saved.split("/announcement-images/")[1]?.split("?")[0] : saved;
  if (!path || (saved.startsWith("http") && !isBucketUrl)) return saved.startsWith("http") ? saved : null;
  const { data } = await supabase.storage.from("announcement-images").createSignedUrl(decodeURIComponent(path), 60 * 60 * 24 * 7);
  return data?.signedUrl ?? null;
};

export function useAnnouncements() {
  return useQuery({
    queryKey: ["announcements"],
    queryFn: async (): Promise<AnnouncementRow[]> => {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("pinned", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return Promise.all(
        (data as unknown as (Omit<AnnouncementRow, "photos" | "images" | "paths"> & { images?: string[] | null })[]).map(async (a) => {
          const all = [...new Set([...(a.image_url ? [a.image_url] : []), ...(a.images ?? [])])];
          const signed = await Promise.all(all.map(signAnnouncementPath));
          const pairs = all.map((path, i) => ({ path, url: signed[i] })).filter((x): x is { path: string; url: string } => !!x.url);
          return { ...a, images: a.images ?? [], paths: pairs.map((x) => x.path), photos: pairs.map((x) => x.url), image_url: pairs[0]?.url ?? null };
        }),
      );
    },
  });
}


export function usePlayers() {
  return useQuery({
    queryKey: ["players"],
    queryFn: async () => {
      const { data, error } = await supabase.from("players").select("*").order("created_at");
      if (error) throw error;
      return data;
    },
  });
}


export function useHours() {
  return useQuery({
    queryKey: ["hours"],
    queryFn: async () => {
      const { data, error } = await supabase.from("opening_hours").select("*").order("sort");
      if (error) throw error;
      return data;
    },
  });
}


export const fmtDate = (d: string | null) =>
  d
    ? new Date(d).toLocaleString("nl-BE", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "";


export function useTrailers() {
  return useQuery({
    queryKey: ["trailers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("trailers").select("*").order("released_at", { ascending: false });
      if (error) throw error;
      return Promise.all(
        data.map(async (t) => {
          let src: string | null = null;
          if (t.video_url) {
            const { data: s } = await supabase.storage.from("trailers").createSignedUrl(t.video_url, 60 * 60 * 24);
            src = s?.signedUrl ?? null;
          }
          return { ...t, src };
        }),
      );
    },
  });
}


export function useDonations() {
  return useQuery({
    queryKey: ["donations"],
    queryFn: async () => {
      const { data, error } = await supabase.from("donations").select("*").order("amount", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}


export const fmtEuro = (n: number) => new Intl.NumberFormat("nl-BE", { style: "currency", currency: "EUR" }).format(n);

