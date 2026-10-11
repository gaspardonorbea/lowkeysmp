import { useState } from "react";
import { Heart, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DonationInstructions() {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);
  return (
    <div className="mb-12 border-y-2 border-gold/40 py-8">
      <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
        <div>
          <Heart className="donation-heart mb-3 size-7 text-gold" />
          <h3 className="text-2xl font-bold text-gold">Help LowkeySMP groeien</h3>
          <p className="mt-2 text-muted-foreground">Doneer via overschrijving. Elk bedrag helpt. 💛</p>
          <p className="mt-4 text-xs uppercase text-muted-foreground">Rekeningnummer</p>
          <p className="mt-1 break-words font-pixel text-xl font-bold sm:text-2xl">BE63 0019 8760 8408</p>
        </div>
        <Button variant="outline" className="shrink-0 border-gold text-gold font-pixel" onClick={async () => {
          try { await navigator.clipboard.writeText("BE63001987608408"); setCopied(true); setError(false); }
          catch { setError(true); }
        }}>{copied ? <Check /> : <Copy />} {copied ? "Gekopieerd" : "Kopieer rekeningnummer"}</Button>
      </div>
      {error && <p role="alert" className="mt-3 text-sm text-destructive">Kopiëren lukt niet. Je kunt het rekeningnummer hierboven selecteren.</p>}
    </div>
  );
}