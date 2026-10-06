import { CheckCircle2, Navigation, X } from "lucide-react";
import type { Discovery } from "../api/types";

interface Props {
  discovery: Discovery;
  distanceM: number | null;
  allowedRadiusM: number;
  onConfirm: () => Promise<void>;
  onClose: () => void;
  busy: boolean;
}

export default function CheckInReticleModal({
  discovery,
  distanceM,
  allowedRadiusM,
  onConfirm,
  onClose,
  busy,
}: Props) {
  const isCloseEnough = distanceM !== null && distanceM <= allowedRadiusM;
  const distText =
    distanceM !== null
      ? distanceM >= 1000
        ? `${(distanceM / 1000).toFixed(1)} km`
        : `${Math.round(distanceM)} m`
      : "Calculating...";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 select-none bg-black/90 backdrop-blur-md">
      {/* Viewfinder background with dark mountain overlay */}
      <div className="relative w-full max-w-[420px] h-[100dvh] max-h-[880px] flex flex-col justify-between overflow-hidden shadow-2xl bg-gradient-to-b from-[#071714] via-[#0f2d20]/50 to-[#071714]">
        {/* Top Banner */}
        <header className="relative z-20 pt-10 px-5 flex items-center justify-between">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-black/50 border border-white/20 text-white flex items-center justify-center active:scale-95 transition"
            aria-label="Back"
          >
            <X size={18} />
          </button>
          <div className="text-center">
            <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 font-display">
              Field Verification
            </span>
            <h2 className="text-sm font-bold text-white truncate max-w-[220px]">
              {discovery.name}
            </h2>
          </div>
          <div className="w-10" />
        </header>

        {/* Central Tactical Reticle */}
        <main className="relative flex-1 flex flex-col items-center justify-center px-6">
          <div className="relative w-64 h-64 flex items-center justify-center">
            {/* 4 corner brackets */}
            <div className="reticle-corner reticle-tl" />
            <div className="reticle-corner reticle-tr" />
            <div className="reticle-corner reticle-bl" />
            <div className="reticle-corner reticle-br" />

            {/* Radar ring & central beacon */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-48 rounded-full border border-emerald-500/30 ping-ring" />
              <div className="w-36 h-36 rounded-full border border-dashed border-amber-400/40" />
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-400/60 flex items-center justify-center">
                <Navigation size={22} className="text-emerald-400 animate-pulse" />
              </div>
            </div>

            {/* Distance badge over reticle */}
            <div className="absolute -bottom-4 z-20 bg-black/80 border border-emerald-500/40 px-3.5 py-1 rounded-full backdrop-blur-md shadow-lg">
              <span className="text-xs font-mono font-bold text-emerald-300">
                {distText} away
              </span>
            </div>
          </div>

          <p className="mt-8 text-center text-xs text-stone-300 max-w-[260px] leading-relaxed">
            {isCloseEnough
              ? "GPS lock verified within target perimeter. Ready to log your expedition visit!"
              : `You are currently ${distText} away. Move within ${allowedRadiusM}m to mark this location visited.`}
          </p>
        </main>

        {/* Bottom Actions */}
        <footer className="relative z-20 px-6 pb-12 pt-4 flex flex-col items-center w-full">
          {isCloseEnough ? (
            <button
              onClick={onConfirm}
              disabled={busy}
              className="w-full py-4 px-6 bg-gradient-to-r from-emerald-600 via-emerald-500 to-amber-400 hover:brightness-110 active:scale-[0.98] transition rounded-full shadow-[0_10px_25px_rgba(32,119,90,0.5)] flex items-center justify-center gap-2 text-white font-bold font-display text-base uppercase tracking-wider"
            >
              <CheckCircle2 size={20} />
              <span>{busy ? "Verifying Check-in…" : "Confirm Check-in (+15 XP)"}</span>
            </button>
          ) : (
            <button
              onClick={onClose}
              className="w-full py-3.5 px-6 bg-white/10 hover:bg-white/20 active:scale-[0.98] transition rounded-full border border-white/20 text-white font-medium text-sm text-center"
            >
              Walk Closer & Try Again
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}
