import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";


export function useAnnouncements() {
  return useQuery({
    queryKey: ["announcements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("pinned", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return Promise.all(
        data.map(async (announcement) => {
          if (!announcement.image_url) return announcement;
          const savedImage = announcement.image_url;
          const isBucketUrl = savedImage.includes("/announcement-images/");
          const imagePath = isBucketUrl
            ? savedImage.split("/announcement-images/")[1]?.split("?")[0]
            : savedImage;
          if (!imagePath || (savedImage.startsWith("http") && !isBucketUrl)) return announcement;
          const { data: signedImage } = await supabase.storage
            .from("announcement-images")
            .createSignedUrl(decodeURIComponent(imagePath), 60 * 60 * 24 * 7);
          return { ...announcement, image_url: signedImage?.signedUrl ?? null };
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

