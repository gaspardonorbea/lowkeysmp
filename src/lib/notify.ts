// Phone push notifications via the free ntfy app (Android/iOS).
export const TOPICS = {
  nieuws: "lowkeysmp-nieuws-k7q2x9",
  deaths: "lowkeysmp-deaths-k7q2x9",
} as const;

export async function sendPush(topic: keyof typeof TOPICS, title: string, message: string) {
  try {
    await fetch(`https://ntfy.sh/${TOPICS[topic]}`, {
      method: "POST",
      body: message || title,
      headers: {
        Title: title.replace(/[^\x20-\x7E]/g, "").trim() || "LowkeySMP",
        Tags: topic === "deaths" ? "skull" : "loudspeaker",
      },
    });
  } catch {
    /* notifications are best-effort */
  }
}
