import { Search, Globe } from "lucide-react";
import type { Stats, User } from "../api/types";

interface Props {
  user: User;
  stats: Stats | undefined;
  onProfile: () => void;
  onSearch: () => void;
  onCityList: () => void;
  categoryFilter: string | null;
  onSelectCategory: (cat: string | null) => void;
  categories: string[];
}

export default function HUD({
  user,
  stats,
  onProfile,
  onSearch,
  onCityList,
  categoryFilter,
  onSelectCategory,
  categories,
}: Props) {
  const level = stats?.level ?? user.level ?? 1;
  const xp = stats?.xp ?? user.xp ?? 0;
  const next = stats?.next_level_xp ?? 100;
  const prev = Math.max(0, next - 50 * level);
  const pct = Math.min(100, Math.max(3, ((xp - prev) / Math.max(1, next - prev)) * 100));

  const username = user.username || "Explorer";
  const initial = username.charAt(0).toUpperCase();

  return (
    <header className="safe-t absolute inset-x-0 top-0 z-20 px-3 pt-1 pointer-events-none">
      <div className="glass pointer-events-auto rounded-3xl p-3 border border-emerald-950/60 shadow-[0_12px_32px_rgba(0,0,0,0.6)]">
        {/* Top Row: User Avatar, Level, XP & Quick Actions */}
        <div className="flex items-center justify-between gap-3">
          {/* User Profile Avatar & XP Progression */}
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={onProfile}
              className="relative shrink-0 group focus:outline-none"
              aria-label="Open profile"
              title="Open profile"
            >
              <div className="w-10 h-10 rounded-full p-0.5 bg-gradient-to-tr from-emerald-600 to-amber-400 shadow-md">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={username}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-[#071714] flex items-center justify-center font-display font-bold text-sm text-brand">
                    {initial}
                  </div>
                )}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#071714] rounded-full flex items-center justify-center text-[7px] font-black text-black">
                ✓
              </span>
            </button>

            <div className="min-w-0 flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-[13px] tracking-wide text-white truncate max-w-[110px] sm:max-w-[150px]">
                  {username}
                </span>
                <span className="bg-emerald-950/90 border border-emerald-800/60 text-amber-300 font-display px-1.5 py-0.5 rounded-full text-[9px] font-bold">
                  Lv. {level}
                </span>
              </div>

              {/* XP Level Bar & Indicator */}
              <div className="flex items-center gap-2 mt-1">
                <div className="w-20 sm:w-28 h-1.5 bg-black/50 border border-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-600 via-emerald-400 to-amber-400 transition-all duration-700 ease-out"
                    style={{ width: `${pct}%`, boxShadow: "0 0 6px rgba(212,175,55,0.8)" }}
                  />
                </div>
                <span className="font-display text-[9px] font-semibold text-brand/80 tracking-tight whitespace-nowrap">
                  {xp.toLocaleString()} XP
                </span>
              </div>
            </div>
          </div>

          {/* Right Quick Controls: Search & World Cities */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={onSearch}
              aria-label="Search places"
              title="Search places nearby"
              className="w-9 h-9 rounded-full bg-[#0a1e1a]/90 border border-emerald-900/60 flex items-center justify-center text-white/80 hover:text-white hover:border-emerald-600 active:scale-95 transition-all shadow-md backdrop-blur-md"
            >
              <Search size={15} strokeWidth={2.4} />
            </button>

            <button
              onClick={onCityList}
              aria-label="World Cities"
              title="Explore World Cities"
              className="w-9 h-9 rounded-full bg-[#0a1e1a]/90 border border-emerald-900/60 flex items-center justify-center text-white/80 hover:text-white hover:border-emerald-600 active:scale-95 transition-all shadow-md backdrop-blur-md"
            >
              <Globe size={15} strokeWidth={2.4} />
            </button>
          </div>
        </div>

        {/* Category Filter Chips Carousel */}
        <nav
          aria-label="Place categories"
          className="mt-2.5 flex items-center gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          <button
            onClick={() => onSelectCategory(null)}
            className={`chip shrink-0 px-3 py-1 text-[10px] font-semibold transition-all ${
              categoryFilter === null
                ? "bg-emerald-600 border-emerald-500 text-white shadow-sm"
                : "bg-black/30 border-white/10 text-white/70 hover:text-white hover:border-white/20"
            }`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => onSelectCategory(categoryFilter === c ? null : c)}
              className={`chip shrink-0 px-3 py-1 text-[10px] font-semibold transition-all ${
                categoryFilter === c
                  ? "bg-emerald-600 border-emerald-500 text-white shadow-sm"
                  : "bg-black/30 border-white/10 text-white/70 hover:text-white hover:border-white/20"
              }`}
            >
              {c}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
