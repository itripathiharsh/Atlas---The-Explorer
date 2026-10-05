import { Compass, Crosshair, MapPin } from "lucide-react";
import type { MapSummary, Stats } from "../api/types";

interface Props {
  stats: Stats | undefined;
  summary: MapSummary | undefined;
  onRecenter: () => void;
  onNearby: () => void;
  onNearbyList: () => void;
}

export default function StatsDock({ stats, summary, onRecenter, onNearby, onNearbyList }: Props) {
  const city = summary?.cities?.[0];
  const pct = city ? city.pct : summary ? null : undefined;

  return (
    <div className="safe-b absolute inset-x-0 bottom-0 z-20 flex items-end gap-3 px-3 pb-3">
      <div className="glass slide-in min-w-0 flex-1 rounded-2xl px-5 py-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="hud-label">{city ? city.display_name : "World"} explored</div>
            <div className="mt-0.5 flex items-baseline gap-2">
              <span className="font-display text-[34px] font-bold leading-none tracking-tight text-ink">
                {pct === undefined ? "—" : pct === null ? `${summary!.world_pct}%` : `${pct}%`}
              </span>
              {pct !== null && pct !== undefined && (
                <span className="font-display text-[11px] font-semibold text-mute">
                  world {summary?.world_pct ?? 0}%
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-5 pb-1 text-right">
            <div>
              <div className="hud-label">Cells</div>
              <div className="font-display text-lg font-bold leading-tight text-brand">
                {stats?.cells_unlocked ?? "—"}
              </div>
            </div>
            <div>
              <div className="hud-label">Visited</div>
              <div className="font-display text-lg font-bold leading-tight text-ink">
                {stats?.discoveries_visited ?? "—"}
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={onNearby}
          className="btn-brand mt-3 flex w-full items-center justify-center gap-2 py-3 text-[13px]"
        >
          <Compass size={15} strokeWidth={2.6} />
          Reveal what's nearby
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <button
          onClick={onRecenter}
          className="glass grid h-12 w-12 place-items-center rounded-2xl transition hover:border-brand/50"
          aria-label="Center on me"
          title="Center on me"
        >
          <Crosshair size={19} className="text-brand" />
        </button>
        <button
          onClick={onNearbyList}
          className="glass grid h-12 w-12 place-items-center rounded-2xl transition hover:border-brand/50"
          aria-label="Discoveries nearby"
          title="Discoveries near map view"
        >
          <MapPin size={17} className="text-ink" />
        </button>
      </div>
    </div>
  );
}
