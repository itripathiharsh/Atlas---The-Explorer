import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, X, ChevronRight, ThumbsUp, Compass, MapPin } from "lucide-react";
import { api } from "../api/client";
import type { Discovery } from "../api/types";

interface Props {
  center: { lat: number; lng: number };
  onClose: () => void;
  onSelect: (d: Discovery) => void;
  onRecenter?: () => void;
}

const CATEGORIES = ["All", "Monument", "Park", "Museum", "Food", "Historic", "Nature", "Culture"];

// Curated high quality scenic backdrops by category when no user photos exist
const CATEGORY_IMAGES: Record<string, string> = {
  monument: "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=400&q=80",
  park: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80",
  museum: "https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?auto=format&fit=crop&w=400&q=80",
  food: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=80",
  historic: "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=400&q=80",
  nature: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=400&q=80",
  culture: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80",
};

function getPlaceImage(d: Discovery): string {
  if (d.photos && d.photos.length > 0) return d.photos[0];
  const cat = (d.category || "").toLowerCase();
  return CATEGORY_IMAGES[cat] || "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=400&q=80";
}

function fmtDist(m: number | null): string {
  if (m === null) return "";
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;
}

export default function NearbySheet({ center, onClose, onSelect, onRecenter }: Props) {
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState("All");

  const key = `${center.lat.toFixed(2)},${center.lng.toFixed(2)}`;
  const nearby = useQuery<Discovery[]>({
    queryKey: ["nearby-list", key],
    queryFn: () => api(`/discoveries/nearby?lat=${center.lat}&lng=${center.lng}&radius_m=25000`),
    refetchInterval: 60_000,
  });

  const rawItems = nearby.data ?? [];

  const items = useMemo(() => {
    return rawItems.filter((d) => {
      const matchCat =
        selectedCat === "All" || d.category?.toLowerCase() === selectedCat.toLowerCase();
      const matchSearch =
        !search.trim() ||
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        (d.description && d.description.toLowerCase().includes(search.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [rawItems, search, selectedCat]);

  return (
    <>
      <div className="absolute inset-0 z-30 bg-black/60 backdrop-blur-xs" onClick={onClose} />

      <section
        aria-label="Explore Nearby"
        className="parchment-sheet safe-b absolute inset-x-0 bottom-0 z-40 max-h-[82dvh] overflow-y-auto pt-3 pb-6 flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300"
      >
        {/* Drag handle */}
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-stone-300" />

        <div className="px-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 font-display flex items-center gap-1">
                <Compass size={13} className="text-emerald-700" />
                Exploration Field Guide
              </span>
              <h2 className="font-display text-2xl font-bold tracking-tight text-neutral-900 mt-0.5">
                Explore Nearby
              </h2>
            </div>
            <button
              onClick={onClose}
              className="grid h-9 w-9 place-items-center rounded-full bg-stone-200/80 hover:bg-stone-300 text-stone-700 transition active:scale-95"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* Search Box */}
          <div className="relative mt-3.5">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500">
              <Search size={16} />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search places, landmarks, food..."
              className="w-full bg-[#E8E4DA] text-neutral-900 placeholder:text-stone-500 text-xs sm:text-[13px] rounded-full pl-10 pr-4 py-2.5 border border-transparent focus:border-emerald-700 focus:bg-white focus:outline-none transition-all shadow-inner"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-700"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Category Filter Chips */}
          <nav
            aria-label="Filter chips"
            className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCat(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all active:scale-95 ${
                  selectedCat === cat
                    ? "bg-[#0F2D20] text-white shadow-sm"
                    : "bg-[#E9E5DB] text-stone-700 hover:bg-[#DDD8CD] border border-[#DFDAD0]"
                }`}
              >
                {cat}
              </button>
            ))}
          </nav>
        </div>

        {/* List Content */}
        <div className="px-5 space-y-3 mt-1 overflow-y-auto">
          {nearby.isLoading && (
            <div className="space-y-3 py-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="shimmer h-24 rounded-2xl bg-stone-200" />
              ))}
            </div>
          )}

          {nearby.isError && (
            <div className="p-4 rounded-2xl bg-red-100 text-red-800 text-xs">
              Could not load discoveries from this area.
            </div>
          )}

          {!nearby.isLoading && items.length === 0 && (
            <div className="py-10 text-center flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-stone-200 flex items-center justify-center text-stone-500 mb-3">
                <MapPin size={24} />
              </div>
              <h3 className="font-display text-base font-bold text-neutral-800">
                No discoveries in this area yet
              </h3>
              <p className="mt-1 text-xs text-stone-600 max-w-[280px] leading-relaxed">
                Be the pioneer who charts it — tap below to scan for encyclopedic landmarks, or tap (+) to record this spot!
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                <button
                  onClick={() => void nearby.refetch()}
                  className="px-5 py-2.5 text-xs font-bold bg-[#0F2D20] text-white rounded-full transition shadow hover:bg-[#194532] active:scale-95 flex items-center gap-1.5"
                >
                  <Compass size={14} />
                  Scan for Area Landmarks
                </button>
                {onRecenter && (
                  <button
                    onClick={onRecenter}
                    className="px-4 py-2.5 text-xs font-bold bg-stone-200 text-stone-700 hover:bg-stone-300 rounded-full transition active:scale-95"
                  >
                    Center on My GPS
                  </button>
                )}
              </div>
            </div>
          )}

          {items.map((d) => (
            <article
              key={d.id}
              onClick={() => onSelect(d)}
              className="parchment-card rounded-2xl p-3 flex gap-3.5 cursor-pointer hover:border-emerald-700/60 transition-all active:scale-[0.99] group"
            >
              {/* Thumbnail with rounded border */}
              <div className="w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-stone-200 relative shadow-sm border border-stone-300/60">
                <img
                  src={getPlaceImage(d)}
                  alt={d.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                {d.distance_m !== null && (
                  <span className="absolute bottom-1 right-1 bg-black/70 backdrop-blur-xs text-white text-[9px] font-mono font-bold px-1 py-0.5 rounded">
                    {fmtDist(d.distance_m)}
                  </span>
                )}
              </div>

              {/* Info Column */}
              <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full capitalize">
                      {d.category}
                    </span>
                    {d.score_pct !== null && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800">
                        <ThumbsUp size={10} className="text-emerald-700" />
                        {d.score_pct}% Worth It
                      </span>
                    )}
                  </div>

                  <h3 className="font-display font-bold text-sm text-neutral-900 mt-1 truncate group-hover:text-emerald-800 transition-colors">
                    {d.name}
                  </h3>

                  {d.description && (
                    <p className="text-[11px] text-stone-600 line-clamp-1 mt-0.5 leading-snug">
                      {d.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1">
                  <span className="text-amber-700 font-bold font-display text-[11px]">
                    +15 XP visit
                  </span>
                  <div className="flex items-center gap-1 text-emerald-800 font-semibold group-hover:translate-x-0.5 transition-transform">
                    <span>View details</span>
                    <ChevronRight size={14} />
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
