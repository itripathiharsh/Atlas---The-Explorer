import { User as UserIcon } from "lucide-react";
import type { Stats, User } from "../api/types";

export default function HUD({ user, stats, onProfile }: { user: User; stats: Stats | undefined; onProfile: () => void }) {
  const level = stats?.level ?? user.level ?? 1;
  const xp = stats?.xp ?? user.xp ?? 0;
  const next = stats?.next_level_xp ?? 100;
  const prev = Math.max(0, next - (50 * level)); // xp needed for the current level segment
  const pct = Math.min(100, Math.max(2, ((xp - prev) / Math.max(1, next - prev)) * 100));

  return (
    <div className="safe-t absolute inset-x-0 top-0 z-20 px-3">
      <div className="glass flex items-center gap-3 rounded-2xl px-4 py-3">
        {/* level hex */}
        <div
          className="grid h-10 w-9 place-items-center font-[600]"
          style={{
            clipPath: "polygon(25% 0, 75% 0, 100% 50%, 75% 100%, 25% 100%, 0 50%)",
            background: "linear-gradient(180deg, #f7f2e3, #b6ad97)",
          }}
        >
          <span className="font-display text-[15px] font-bold text-[#061623]">{level}</span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="hud-label">Explorer</span>
            <span className="font-display text-[11px] font-semibold text-brand">
              {xp.toLocaleString()} XP
            </span>
          </div>
          <div className="mt-1 h-[5px] w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-brand transition-[width] duration-700 ease-out"
              style={{ width: `${pct}%`, boxShadow: "0 0 8px rgba(242,236,218,.7)" }}
            />
          </div>
        </div>

        <button
          onClick={onProfile}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/15 bg-white/5 transition hover:border-white/40"
          aria-label="Profile"
        >
          <UserIcon size={16} className="text-ink/80" />
        </button>
      </div>
    </div>
  );
}
