import { useState } from "react";
import { PlusCircle, Sparkles, X } from "lucide-react";
import { api } from "../api/client";
import { emitFx } from "../state/fx";

const CATEGORIES = [
  "Monument",
  "Park",
  "Viewpoint",
  "Museum",
  "Food",
  "Historic",
  "Nature",
  "Culture",
  "Hidden gem",
];

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

  const isGpsWeak = pos.accuracy > maxAccuracyM;

  async function submit() {
    if (!category) return setError("Please select a place category");
    if (name.trim().length < 3) return setError("Name must be at least 3 characters");
    setBusy(true);
    setError(null);
    try {
      await api<{ id: number }>("/discoveries", {
        method: "POST",
        body: {
          name: name.trim(),
          category,
          description: description.trim(),
          lat: pos.lat,
          lng: pos.lng,
          fix_lat: pos.lat,
          fix_lng: pos.lng,
          accuracy_m: pos.accuracy,
          recorded_at: new Date().toISOString(),
        },
      });
      emitFx({ kind: "toast", text: "Discovery registered! +25 XP" });
      onCreated(pos.lat, pos.lng);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish discovery");
      emitFx({ kind: "toast", text: "Could not publish discovery", tone: "bad" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs" onClick={onClose} />
      <main
        aria-label="Create Discovery"
        className="parchment-sheet safe-b fixed inset-x-0 bottom-0 z-50 max-h-[88dvh] overflow-y-auto rounded-t-[32px] pt-3 pb-8 px-5 shadow-2xl animate-in slide-in-from-bottom duration-300"
      >
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-stone-300" />

        <div className="flex items-center justify-between pb-2">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-800 font-display">
              <PlusCircle size={13} className="text-emerald-700" />
              <span>Chart New Landmark</span>
            </div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-neutral-900 mt-0.5">
              Add a Discovery
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-200/80 hover:bg-stone-300 flex items-center justify-center text-stone-700 active:scale-95 transition"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <p className="text-xs text-stone-600 mt-0.5">
          Pinned at your current coordinates with {Math.round(pos.accuracy)}m GPS accuracy.
        </p>

        {isGpsWeak && (
          <div className="mt-3 p-3 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs leading-relaxed">
            GPS accuracy ({Math.round(pos.accuracy)}m) is outside the verification threshold (≤{Math.round(maxAccuracyM)}m). Move near an open window or step outdoors to establish an expedition lock.
          </div>
        )}

        <div className="mt-4 space-y-3.5">
          <div>
            <label className="block text-[11px] font-bold font-display uppercase tracking-wider text-stone-600 mb-1">
              Place Name *
            </label>
            <input
              placeholder="e.g. Pine Ridge Viewpoint or Rooftop Café"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={120}
              className="w-full bg-[#E8E4DA] text-neutral-900 placeholder:text-stone-500 rounded-xl px-3.5 py-3 text-sm border border-transparent focus:border-emerald-700 focus:bg-white focus:outline-none transition-all shadow-inner"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold font-display uppercase tracking-wider text-stone-600 mb-1.5">
              Category *
            </label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition active:scale-95 ${
                    category === c
                      ? "bg-[#0F2D20] text-white shadow-sm"
                      : "bg-[#E9E5DB] text-stone-700 hover:bg-[#DDD8CD] border border-[#DFDAD0]"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold font-display uppercase tracking-wider text-stone-600 mb-1">
              Field Notes (Optional)
            </label>
            <textarea
              placeholder="What makes this place worth a detour? Best time to visit, hidden features..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={2000}
              className="w-full bg-[#E8E4DA] text-neutral-900 placeholder:text-stone-500 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm border border-transparent focus:border-emerald-700 focus:bg-white focus:outline-none transition-all shadow-inner resize-none"
            />
          </div>

          {error && <p className="text-xs text-red-600 font-semibold">{error}</p>}

          <button
            onClick={submit}
            disabled={busy || name.trim().length < 3 || !category || isGpsWeak}
            className="w-full mt-2 py-3.5 px-6 bg-gradient-to-r from-emerald-600 via-emerald-500 to-amber-400 hover:brightness-110 active:scale-[0.98] transition rounded-full shadow-lg text-white font-bold font-display text-sm uppercase tracking-wider disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
          >
            <Sparkles size={16} />
            <span>{busy ? "Registering on Grid…" : "Publish Discovery (+25 XP)"}</span>
          </button>
        </div>
      </main>
    </>
  );
}
