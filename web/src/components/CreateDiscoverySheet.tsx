import { useState } from "react";
import { X } from "lucide-react";
import { api } from "../api/client";
import { emitFx } from "../state/fx";

const CATEGORIES = ["Viewpoint", "Park", "Monument", "Culture", "Nature", "Food", "Street", "Museum", "Hidden gem"];

interface Props {
  pos: { lat: number; lng: number; accuracy: number };
  maxAccuracyM: number;
  onClose: () => void;
  onCreated: (lat: number, lng: number) => void;
}

export default function CreateDiscoverySheet({ pos, maxAccuracyM, onClose, onCreated }: Props) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!category) return setError("Pick a category");
    setBusy(true);
    setError(null);
    try {
      const d = await api<{ id: number }>("/discoveries", {
        method: "POST",
        body: {
          name,
          category,
          description,
          lat: pos.lat,
          lng: pos.lng,
          fix_lat: pos.lat,
          fix_lng: pos.lng,
          accuracy_m: pos.accuracy,
          recorded_at: new Date().toISOString(),
        },
      });
      emitFx({ kind: "toast", text: "Discovery published" });
      onCreated(pos.lat, pos.lng);
      void d;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish");
      emitFx({ kind: "toast", text: "Could not publish discovery", tone: "bad" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="absolute inset-0 z-30 bg-black/40" onClick={onClose} />
      <div className="sheet safe-b glass absolute inset-x-0 bottom-0 z-40 rounded-t-3xl px-5 pb-6 pt-3">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />
        <div className="flex items-center justify-between">
          <h2 className="font-display text-[20px] font-bold">Add a discovery</h2>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full border border-white/10">
            <X size={16} />
          </button>
        </div>
        <p className="mt-1 text-[12.5px] text-mute">
          Pinned at your current location ({Math.round(pos.accuracy)} m GPS accuracy).
        </p>
        {pos.accuracy > maxAccuracyM && (
          <p className="mt-2 rounded-xl border border-gold/30 bg-gold/[0.07] px-3 py-2 text-[12.5px] leading-relaxed text-gold">
            GPS is too weak to publish (needs ≤ {Math.round(maxAccuracyM)} m). Step outside or
            near a window, then come back — this keeps fake places off the map.
          </p>
        )}

        <div className="mt-4 space-y-3">
          <input placeholder="Name — e.g. Rooftop with a view" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((c) => (
              <button key={c} onClick={() => setCategory(c)} className={`chip px-3 py-1.5 ${category === c ? "active" : ""}`}>
                {c}
              </button>
            ))}
          </div>
          <textarea
            placeholder="Why is it worth a detour? (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            maxLength={2000}
            className="resize-none"
          />
          {error && <p className="text-[13px] text-danger">{error}</p>}
          <button
            onClick={submit}
            disabled={busy || name.trim().length < 3 || !category || pos.accuracy > maxAccuracyM}
            className="btn-brand w-full py-3.5 text-[13px]"
          >
            {busy ? "Publishing…" : "Publish discovery"}
          </button>
        </div>
      </div>
    </>
  );
}
