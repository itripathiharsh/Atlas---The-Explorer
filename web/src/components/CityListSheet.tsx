import { X, Navigation } from "lucide-react";
import type { MapSummary } from "../api/types";

interface Props {
  summary: MapSummary | undefined;
  onClose: () => void;
  onFly: (lat: number, lng: number, zoom?: number) => void;
}

/** Every explorable city, with your progress and a one-tap jump. */
export default function CityListSheet({ summary, onClose, onFly }: Props) {
  const cities = summary?.cities ?? [];

  return (
    <>
      <div className="absolute inset-0 z-30 bg-black/40" onClick={onClose} />
      <div className="sheet safe-b glass absolute inset-x-0 bottom-0 z-40 max-h-[75dvh] overflow-y-auto rounded-t-3xl px-5 pb-6 pt-3">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />
        <div className="flex items-start justify-between">
          <div>
            <div className="hud-label">The expedition map</div>
            <h2 className="font-display text-[22px] font-bold leading-tight">Explore the world</h2>
          </div>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full border border-white/10">
            <X size={16} />
          </button>
        </div>

        <div className="mt-4 space-y-2">
          {cities.map((c) => (
            <button
              key={c.name}
              onClick={() => c.center_lat != null && c.center_lng != null && onFly(c.center_lat, c.center_lng, 13)}
              className="fade-in flex w-full items-center gap-4 rounded-2xl border border-white/8 bg-white/[0.03] p-4 text-left transition hover:border-brand/40 hover:bg-white/[0.05]"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-display text-[16px] font-bold">{c.display_name}</span>
                  <span className={`font-display text-[13px] font-bold ${c.pct > 0 ? "text-brand" : "text-mute"}`}>
                    {c.pct}%
                  </span>
                </div>
                <div className="mt-1.5 h-[4px] overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-brand transition-[width] duration-700"
                    style={{ width: `${Math.min(100, c.pct)}%` }}
                  />
                </div>
              </div>
              <Navigation size={15} className="shrink-0 text-mute" />
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
