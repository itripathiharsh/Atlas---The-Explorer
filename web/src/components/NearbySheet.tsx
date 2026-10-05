import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Star, X } from "lucide-react";
import { api } from "../api/client";
import type { Discovery } from "../api/types";

interface Props {
  center: { lat: number; lng: number };
  onClose: () => void;
  onSelect: (d: Discovery) => void;
  onJumpLucknow: () => void;
}

/** What's worth seeing around wherever you're looking on the map. */
export default function NearbySheet({ center, onClose, onSelect, onJumpLucknow }: Props) {
  const key = `${center.lat.toFixed(2)},${center.lng.toFixed(2)}`;
  const nearby = useQuery<Discovery[]>({
    queryKey: ["nearby-list", key],
    queryFn: () =>
      api(`/discoveries/nearby?lat=${center.lat}&lng=${center.lng}&radius_m=5000`),
    refetchInterval: 60_000,
  });

  const items = nearby.data ?? [];

  return (
    <>
      <div className="absolute inset-0 z-30 bg-black/40" onClick={onClose} />
      <div className="sheet safe-b glass absolute inset-x-0 bottom-0 z-40 max-h-[72dvh] overflow-y-auto rounded-t-3xl px-5 pb-6 pt-3">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />
        <div className="flex items-start justify-between">
          <div>
            <div className="hud-label">Around map view</div>
            <h2 className="font-display text-[22px] font-bold leading-tight">
              Discoveries nearby
            </h2>
          </div>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full border border-white/10">
            <X size={16} />
          </button>
        </div>

        {nearby.isLoading && (
          <div className="mt-6 space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="shimmer h-[68px] rounded-2xl" />
            ))}
          </div>
        )}

        {nearby.isError && (
          <p className="mt-6 text-[13px] text-danger">Could not load discoveries — check the server.</p>
        )}

        {!nearby.isLoading && items.length === 0 && (
          <div className="mt-8 mb-4 text-center">
            <p className="font-display text-[15px] font-bold">Nothing recorded here yet</p>
            <p className="mt-1 text-[13px] leading-relaxed text-mute">
              Be the first — hit + and add what others are missing.
            </p>
            <button onClick={onJumpLucknow} className="btn-lime mt-4 px-6 py-3 text-[12px]">
              Take me to Lucknow instead
            </button>
          </div>
        )}

        <div className="mt-4 space-y-2">
          {items.map((d) => (
            <button
              key={d.id}
              onClick={() => onSelect(d)}
              className="fade-in flex w-full items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] p-3.5 text-left transition hover:border-lime/40 hover:bg-white/[0.05]"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="chip px-2 py-0.5">{d.category}</span>
                  {d.distance_m !== null && (
                    <span className="text-[12px] text-mute">
                      {d.distance_m >= 1000
                        ? `${(d.distance_m / 1000).toFixed(1)} km`
                        : `${Math.round(d.distance_m)} m`}
                    </span>
                  )}
                </div>
                <div className="mt-1 truncate font-display text-[15px] font-bold">{d.name}</div>
                {d.recommendation_count > 0 && (
                  <div className="mt-0.5 flex items-center gap-1.5 text-[12px] text-gold">
                    <Star size={11} className="fill-gold" />
                    {d.recommendation_count} recommend
                    {d.score_pct !== null && ` · ${d.score_pct}% worth it`}
                  </div>
                )}
              </div>
              <ChevronRight size={16} className="shrink-0 text-mute" />
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
