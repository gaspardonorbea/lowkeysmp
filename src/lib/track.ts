import { supabase } from "@/integrations/supabase/client";

export function visitorId() {
  let id = localStorage.getItem("lk_vid");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("lk_vid", id);
  }
  return id;
}

export function track(kind: "visit" | "sub_nieuws" | "sub_deaths") {
  try {
    const key = `lk_${kind}_${new Date().toDateString()}`;
    // one visit per day per device; subscribe clicks once per device
    const onceKey = kind === "visit" ? key : `lk_${kind}`;
    if (localStorage.getItem(onceKey)) return;
    localStorage.setItem(onceKey, "1");
    supabase.from("site_events").insert({ kind, visitor_id: visitorId() }).then(() => {});
  } catch {
    /* ignore */
  }
}
