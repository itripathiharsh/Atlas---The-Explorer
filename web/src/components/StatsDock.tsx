import { Compass, Crosshair, MapPin } from "lucide-react";
import type { MapSummary, Stats } from "../api/types";

interface Props {
  stats: Stats | undefined;
  summary: MapSummary | undefined;
  onRecenter: () => void;
  onNearbyList: () => void;
  onCityList: () => void;
  onAlignNorth?: () => void;
}

export default function StatsDock({
  stats,
  summary,
  onRecenter,
  onNearbyList,
  onCityList,
  onAlignNorth,
}: Props) {
  const city = summary?.current_city || summary?.cities?.[0];
  const pct = city ? city.pct : summary ? null : undefined;
  const displayPct = pct === undefined ? "—" : pct === null ? `${summary!.world_pct}%` : `${pct}%`;

  return (
    <>
      {/* Floating Map Controls (Right edge) */}
      <aside
        aria-label="Map Controls"
        className="absolute right-3 bottom-36 z-20 flex flex-col gap-2.5 pointer-events-auto"
      >
        {/* Compass / Align North */}
        <button
          onClick={onAlignNorth || onRecenter}
          aria-label="Align North"
          title="Align North"
          className="w-10 h-10 rounded-full bg-[#071714]/90 border border-emerald-900/60 shadow-lg backdrop-blur-md flex items-center justify-center text-white hover:border-emerald-500 active:scale-90 transition-all"
        >
          <Compass size={18} className="text-red-400 -rotate-45" strokeWidth={2.4} />
        </button>

        {/* Nearby Discoveries pin trigger */}
        <button
          onClick={onNearbyList}
          aria-label="Discoveries nearby"
          title="Discoveries near map view"
          className="w-10 h-10 rounded-full bg-[#071714]/90 border border-emerald-900/60 shadow-lg backdrop-blur-md flex items-center justify-center text-white hover:border-emerald-500 active:scale-90 transition-all"
        >
          <MapPin size={18} className="text-emerald-400" strokeWidth={2.4} />
        </button>

        {/* Re-center GPS */}
        <button
          onClick={onRecenter}
          aria-label="Center on my location"
          title="Center on my location"
          className="w-10 h-10 rounded-full bg-emerald-600 border border-emerald-400/50 shadow-lg shadow-emerald-950/60 backdrop-blur-md flex items-center justify-center text-white hover:bg-emerald-500 active:scale-90 transition-all"
        >
          <Crosshair size={18} strokeWidth={2.4} />
        </button>
      </aside>

      {/* Floating 3-Stat Banner (Docked above BottomNav) */}
      <section
        aria-label="Exploration Overview"
        className="absolute inset-x-0 bottom-[84px] z-20 px-3 pointer-events-none"
      >
        <div className="mx-auto max-w-md pointer-events-auto">
          <div className="glass rounded-2xl py-2.5 px-4 border border-emerald-950/70 shadow-xl flex items-center justify-between backdrop-blur-xl">
            {/* Stat Item 1: Explored % */}
            <button
              onClick={onCityList}
              className="flex-1 flex flex-col items-center group text-center focus:outline-none"
              title="Click to view all cities"
            >
              <span className="hud-label text-[9px] group-hover:text-emerald-300 transition-colors">
                {city ? city.display_name.split(",")[0] : "World"} Explored 🗺️
              </span>
              <span className="font-display text-base font-extrabold text-white mt-0.5">
                {displayPct}
              </span>
            </button>

            <div className="h-6 w-px bg-white/10" />

            {/* Stat Item 2: Cells Unlocked */}
            <div className="flex-1 flex flex-col items-center text-center">
              <span className="hud-label text-[9px]">Cells</span>
              <span className="font-display text-base font-extrabold text-emerald-400 mt-0.5">
                {stats?.cells_unlocked ?? 0}
              </span>
            </div>

            <div className="h-6 w-px bg-white/10" />

            {/* Stat Item 3: Visited */}
            <button
              onClick={onNearbyList}
              className="flex-1 flex flex-col items-center group text-center focus:outline-none"
              title="View visited discoveries"
            >
              <span className="hud-label text-[9px] group-hover:text-amber-300 transition-colors">
                Visited
              </span>
              <span className="font-display text-base font-extrabold text-amber-300 mt-0.5">
                {stats?.discoveries_visited ?? 0}
              </span>
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
