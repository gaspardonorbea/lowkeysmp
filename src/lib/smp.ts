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
      return data;
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
