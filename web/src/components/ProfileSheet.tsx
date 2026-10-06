import { useState } from "react";
import { Compass, Footprints, LogOut, MapPin, Sparkles, Star, Trophy, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import type { Achievement, Stats, User } from "../api/types";
import { useAuth } from "../state/auth";

interface Props {
  user: User;
  onClose: () => void;
}

const ACHIEVEMENT_ICONS: Record<string, React.ReactNode> = {
  first_steps: <Footprints size={20} className="text-amber-300" />,
  explorer: <Compass size={20} className="text-emerald-300" />,
  city_walker: <MapPin size={20} className="text-amber-300" />,
  local: <Star size={20} className="text-emerald-300" />,
  gem_hunter: <Sparkles size={20} className="text-amber-300" />,
  completionist: <Trophy size={20} className="text-amber-300" />,
};

export default function ProfileSheet({ user, onClose }: Props) {
  const { logout } = useAuth();
  const [filter, setFilter] = useState<"all" | "unlocked" | "locked">("all");

  const stats = useQuery<Stats>({ queryKey: ["stats"], queryFn: () => api("/me/stats") });
  const achievements = useQuery<Achievement[]>({
    queryKey: ["achievements"],
    queryFn: () => api("/me/achievements"),
  });

  const level = stats.data?.level ?? user.level ?? 1;
  const xp = stats.data?.xp ?? user.xp ?? 0;
  const next = stats.data?.next_level_xp ?? 100;
  const prev = Math.max(0, next - 50 * level);
  const pct = Math.min(100, Math.max(3, ((xp - prev) / Math.max(1, next - prev)) * 100));

  const allAchievements = achievements.data ?? [];
  const unlockedCount = allAchievements.filter((a) => !!a.earned_at).length;

  const filteredAchievements = allAchievements.filter((a) => {
    if (filter === "unlocked") return !!a.earned_at;
    if (filter === "locked") return !a.earned_at;
    return true;
  });

  const username = user.username || "Explorer";
  const initial = username.charAt(0).toUpperCase();

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs" onClick={onClose} />

      <main
        aria-label="Explorer Profile"
        className="safe-b fixed inset-x-0 bottom-0 z-50 max-h-[90dvh] overflow-y-auto rounded-t-[32px] bg-[#071714] text-white border-t border-emerald-950/80 px-5 pt-3 pb-8 shadow-2xl animate-in slide-in-from-bottom duration-300"
      >
        {/* Drag handle */}
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-white/20" />

        {/* Top Dismiss Button */}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 active:scale-95 transition"
            aria-label="Close profile"
          >
            <X size={16} />
          </button>
        </div>

        {/* User Profile Header (matching 09_profile_progress) */}
        <section className="flex flex-col items-center justify-center -mt-2 pb-4 text-center">
          {/* Avatar with active border badge */}
          <div className="relative mb-3">
            <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-[#1F5B46] to-[#D4AF37] shadow-lg">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={username}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-[#050f0d] flex items-center justify-center font-display font-black text-2xl text-amber-300">
                  {initial}
                </div>
              )}
            </div>
            {/* Verified Compass Pin Badge */}
            <div className="absolute bottom-0 right-0 bg-[#0F2D20] text-amber-300 p-1.5 rounded-full border-2 border-[#071714] shadow-md">
              <Compass size={14} />
            </div>
          </div>

          <h2 className="text-xl font-bold font-display tracking-tight text-white">{username}</h2>
          <div className="mt-1 inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-700/50">
            <span className="text-[11px] font-bold text-amber-300 font-display">
              Lv. {level} Explorer
            </span>
          </div>

          {/* XP Progress Tracker */}
          <div className="w-full max-w-[280px] mt-3">
            <div className="flex justify-between items-center text-[10px] font-medium text-stone-400 mb-1 px-1">
              <span className="text-emerald-400 font-bold">EXPEDITION PROGRESS</span>
              <span className="font-mono text-white/80">
                {xp.toLocaleString()} / {next.toLocaleString()} XP
              </span>
            </div>
            <div className="h-2 w-full bg-black/60 border border-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-600 via-emerald-400 to-amber-400 rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, boxShadow: "0 0 8px rgba(212,175,55,0.7)" }}
              />
            </div>
          </div>
        </section>

        {/* 4-Stat Exploration Grid */}
        <section className="grid grid-cols-2 gap-2.5 mt-2">
          <div className="glass rounded-2xl p-3.5 border border-emerald-950/70">
            <span className="hud-label text-[9px] text-emerald-400">Cells Unlocked</span>
            <p className="font-display text-2xl font-black text-white mt-0.5">
              {stats.data?.cells_unlocked ?? 0}
            </p>
          </div>
          <div className="glass rounded-2xl p-3.5 border border-emerald-950/70">
            <span className="hud-label text-[9px] text-amber-400">Places Visited</span>
            <p className="font-display text-2xl font-black text-white mt-0.5">
              {stats.data?.discoveries_visited ?? 0}
            </p>
          </div>
          <div className="glass rounded-2xl p-3.5 border border-emerald-950/70">
            <span className="hud-label text-[9px] text-stone-400">Places Discovered</span>
            <p className="font-display text-2xl font-black text-white mt-0.5">
              {stats.data?.discoveries_created ?? 0}
            </p>
          </div>
          <div className="glass rounded-2xl p-3.5 border border-emerald-950/70">
            <span className="hud-label text-[9px] text-stone-400">Endorsements</span>
            <p className="font-display text-2xl font-black text-white mt-0.5">
              {stats.data?.recommendations_made ?? 0}
            </p>
          </div>
        </section>

        {/* Hexagonal Achievements Showcase (matching 11_achievements) */}
        <section className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Trophy size={16} className="text-amber-400" />
              <h3 className="font-display text-base font-bold text-white tracking-tight">
                Accolades & Medallions
              </h3>
            </div>
            <span className="bg-emerald-950 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-amber-300 border border-emerald-800">
              {unlockedCount} / {allAchievements.length} Unlocked
            </span>
          </div>

          {/* Filter Pills */}
          <div className="flex gap-1.5 mb-3">
            {(["all", "unlocked", "locked"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`px-3 py-1 rounded-full text-[10px] font-bold font-display uppercase tracking-wider transition ${
                  filter === t
                    ? "bg-emerald-600 text-white"
                    : "bg-white/5 text-stone-400 hover:text-white border border-white/10"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Badges Grid */}
          <div className="grid grid-cols-2 gap-3">
            {filteredAchievements.map((a) => {
              const isUnlocked = !!a.earned_at;
              return (
                <article
                  key={a.code}
                  className={`rounded-2xl p-3.5 flex flex-col items-center text-center transition border ${
                    isUnlocked
                      ? "bg-gradient-to-b from-[#0F2D20]/80 to-[#071714] border-emerald-500/40 shadow-md"
                      : "bg-black/30 border-white/5 opacity-40"
                  }`}
                >
                  {/* Hexagonal Medal Badge */}
                  <div className="relative w-14 h-16 mb-2 flex items-center justify-center">
                    <div
                      className={`absolute inset-0 p-[2px] hex-cell flex items-center justify-center ${
                        isUnlocked
                          ? "bg-gradient-to-br from-[#E2B75B] via-[#C9922C] to-[#8C5D14] drop-shadow-md"
                          : "bg-stone-700"
                      }`}
                    >
                      <div
                        className={`w-full h-full hex-cell flex items-center justify-center ${
                          isUnlocked
                            ? "bg-gradient-to-b from-[#1C372A] to-[#12231A]"
                            : "bg-[#0a1e16]"
                        }`}
                      >
                        {ACHIEVEMENT_ICONS[a.code] || (
                          <Star
                            size={18}
                            className={isUnlocked ? "text-amber-300" : "text-stone-500"}
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  <h4 className="text-xs font-bold font-display text-white mt-1">{a.name}</h4>
                  <p className="text-[10px] text-stone-400 mt-0.5 leading-snug line-clamp-2">
                    {a.description}
                  </p>

                  {isUnlocked && (
                    <span className="mt-2 text-[9px] font-mono text-emerald-400 font-bold uppercase">
                      Unlocked ✓
                    </span>
                  )}
                </article>
              );
            })}
          </div>
        </section>

        {/* Global City Exploration Summary */}
        <section className="mt-6">
          <div className="hud-label text-stone-400 mb-2">City Exploration Progress</div>
          <div className="space-y-2.5">
            {stats.data?.per_city.map((c) => (
              <div key={c.name} className="glass rounded-xl p-2.5 border border-white/5">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-display font-semibold text-white">{c.display_name}</span>
                  <span className="font-mono text-emerald-400 font-bold">{c.pct}%</span>
                </div>
                <div className="h-1.5 w-full bg-black/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(100, c.pct)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Sign out button */}
        <footer className="mt-8 pt-4 border-t border-white/10">
          <button
            onClick={logout}
            className="w-full py-3 px-4 rounded-full border border-red-500/30 hover:bg-red-500/10 text-red-400 font-bold font-display text-xs flex items-center justify-center gap-2 transition"
          >
            <LogOut size={15} />
            <span>Sign Out of ATLAS</span>
          </button>
        </footer>
      </main>
    </>
  );
}
