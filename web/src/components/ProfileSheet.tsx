import { LogOut, Trophy, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import type { Achievement, Stats, User } from "../api/types";
import { useAuth } from "../state/auth";

export default function ProfileSheet({ user, onClose }: { user: User; onClose: () => void }) {
  const { logout } = useAuth();
  const stats = useQuery<Stats>({ queryKey: ["stats"], queryFn: () => api("/me/stats") });
  const achievements = useQuery<Achievement[]>({
    queryKey: ["achievements"],
    queryFn: () => api("/me/achievements"),
  });

  const pct = stats.data
    ? Math.min(100, (stats.data.xp / Math.max(1, stats.data.next_level_xp)) * 100)
    : 0;

  return (
    <>
      <div className="absolute inset-0 z-40 bg-black/50" onClick={onClose} />
      <div className="sheet safe-b glass absolute inset-x-0 bottom-0 z-50 max-h-[85dvh] overflow-y-auto rounded-t-3xl px-6 pb-6 pt-4">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />
        <div className="flex items-start justify-between">
          <div>
            <div className="hud-label">Explorer</div>
            <h2 className="font-display text-[28px] font-bold leading-tight">{user.username}</h2>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-display text-[15px] font-bold text-brand">
                Level {stats.data?.level ?? user.level}
              </span>
              <span className="text-[12px] text-mute">
                {(stats.data?.xp ?? user.xp).toLocaleString()} XP
              </span>
            </div>
            <div className="mt-2 h-[5px] w-44 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-brand transition-[width] duration-700" style={{ width: `${pct}%` }} />
            </div>
          </div>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full border border-white/10">
            <X size={16} />
          </button>
        </div>

        {/* stats grid */}
        <div className="mt-5 grid grid-cols-2 gap-2">
          <Stat label="Areas unlocked" value={stats.data?.cells_unlocked} accent />
          <Stat label="Discoveries visited" value={stats.data?.discoveries_visited} />
          <Stat label="Places discovered" value={stats.data?.discoveries_created} />
          <Stat label="Recommendations" value={stats.data?.recommendations_made} />
        </div>

        {/* city progress */}
        <div className="mt-5">
          <div className="hud-label mb-2">Exploration</div>
          <div className="space-y-2.5">
            {stats.data?.per_city.map((c) => (
              <div key={c.name}>
                <div className="mb-1 flex justify-between text-[12px]">
                  <span className="font-display font-semibold">{c.display_name}</span>
                  <span className="text-mute">{c.pct}%</span>
                </div>
                <div className="h-[5px] overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-brand transition-[width] duration-700"
                    style={{ width: `${Math.min(100, c.pct)}%` }}
                  />
                </div>
              </div>
            ))}
            <div className="flex justify-between pt-1 text-[12px] text-mute">
              <span>World</span>
              <span className="font-display font-semibold text-ink">
                {stats.data?.world_pct ?? 0}%
              </span>
            </div>
          </div>
        </div>

        {/* achievements */}
        <div className="mt-5">
          <div className="hud-label mb-2 flex items-center gap-1.5">
            <Trophy size={12} className="text-gold" /> Achievements
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(achievements.data ?? []).map((a) => (
              <div
                key={a.code}
                className={`rounded-2xl border p-3 ${
                  a.earned_at ? "border-gold/40 bg-gold/[0.06]" : "border-white/8 bg-white/[0.02] opacity-45"
                }`}
              >
                <div className={`font-display text-[13px] font-bold ${a.earned_at ? "text-gold" : ""}`}>
                  {a.name}
                </div>
                <div className="mt-0.5 text-[11px] leading-snug text-mute">{a.description}</div>
              </div>
            ))}
          </div>
        </div>

        <button onClick={logout} className="btn-ghost mt-6 flex w-full items-center justify-center gap-2 py-3 text-[12px] text-danger" style={{ borderColor: "rgba(255,93,93,.35)" }}>
          <LogOut size={14} /> Sign out
        </button>
      </div>
    </>
  );
}

function Stat({ label, value, accent }: { label: string; value: number | undefined; accent?: boolean }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3.5">
      <div className="hud-label">{label}</div>
      <div className={`mt-0.5 font-display text-[22px] font-bold leading-none ${accent ? "text-brand" : ""}`}>
        {value ?? "—"}
      </div>
    </div>
  );
}
