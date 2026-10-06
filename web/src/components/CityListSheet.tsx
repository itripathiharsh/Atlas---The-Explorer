import { Globe, Navigation, X } from "lucide-react";
import type { MapSummary } from "../api/types";

interface Props {
  summary: MapSummary | undefined;
  onClose: () => void;
  onFly: (lat: number, lng: number, zoom?: number) => void;
}

export default function CityListSheet({ summary, onClose, onFly }: Props) {
  const cities = summary?.cities ?? [];
  const worldPct = summary?.world_pct ?? 0;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs" onClick={onClose} />
      <main
        aria-label="World Cities"
        className="safe-b fixed inset-x-0 bottom-0 z-50 max-h-[80dvh] overflow-y-auto rounded-t-[32px] bg-[#071714] text-white border-t border-emerald-950/80 px-5 pt-3 pb-8 shadow-2xl animate-in slide-in-from-bottom duration-300"
      >
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-white/20" />

        <div className="flex items-center justify-between pb-3">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-400 font-display">
              <Globe size={13} />
              <span>World Expeditions</span>
            </div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-white mt-0.5">
              Charted Territories
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 active:scale-95 transition"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Global summary card */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-[#0F2D20] to-[#071714] border border-emerald-600/40 mb-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 font-display">
              Global Earth Coverage
            </span>
            <p className="text-xs text-stone-300 mt-0.5">Uber H3 res-8 sectors</p>
          </div>
          <div className="text-right">
            <span className="font-display text-2xl font-black text-white">{worldPct}%</span>
          </div>
        </div>

        {/* Cities List */}
        <div className="space-y-2.5">
          {cities.map((c) => {
            const isCurrent = summary?.current_city?.name === c.name;
            return (
            <button
              key={c.name}
              onClick={() => {
                if (c.center_lat != null && c.center_lng != null) {
                  onFly(c.center_lat, c.center_lng, 13);
                  onClose();
                }
              }}
              className={`w-full flex items-center gap-4 rounded-2xl border p-3.5 text-left transition active:scale-[0.99] group ${
                isCurrent
                  ? "border-emerald-500/80 bg-[#0e2621] shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-500/50"
                  : "border-emerald-950/70 bg-[#0e2621]/60 hover:bg-[#0e2621] hover:border-emerald-500/50"
              }`}
            >
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-colors ${
                isCurrent ? "bg-emerald-600/30 border-emerald-400 text-amber-300" : "bg-[#0F2D20] border-emerald-600/40 text-emerald-400 group-hover:text-amber-300"
              }`}>
                <Navigation size={18} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-display text-[15px] font-bold text-white group-hover:text-emerald-300 transition-colors">
                      {c.display_name}
                    </span>
                    {isCurrent && (
                      <span className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-300 bg-emerald-900/80 px-2 py-0.5 rounded-full border border-emerald-500/50">
                        Current
                      </span>
                    )}
                  </div>
                  <span
                    className={`font-mono text-xs font-bold ${
                      c.pct > 0 ? "text-amber-300" : "text-stone-400"
                    }`}
                  >
                    {c.pct}%
                  </span>
                </div>

                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-black/50 border border-white/5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-amber-400 transition-all duration-700"
                    style={{ width: `${Math.min(100, Math.max(3, c.pct))}%` }}
                  />
                </div>
              </div>
            </button>
          );})}
        </div>
      </main>
    </>
  );
}
