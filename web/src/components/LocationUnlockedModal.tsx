import { Sparkles, Trophy, X } from "lucide-react";

interface Props {
  title: string;
  subtitle?: string;
  xpAwarded: number;
  imageUrl?: string;
  onClose: () => void;
}

export default function LocationUnlockedModal({
  title,
  subtitle = "Expedition Milestone Reached",
  xpAwarded,
  imageUrl,
  onClose,
}: Props) {
  const fallbackImg =
    "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=600&q=80";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 select-none bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-[400px] h-[100dvh] max-h-[880px] bg-[#071714] overflow-hidden flex flex-col justify-between shadow-2xl border border-emerald-950/40">
        {/* Ambient golden aura background */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="gold-radial-light absolute top-[36%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 blur-2xl rounded-full" />
          {/* Sparkle dots */}
          <div className="absolute top-[28%] left-[22%] w-2 h-2 bg-amber-200 rounded-full opacity-60 blur-[0.5px] animate-pulse" />
          <div className="absolute top-[22%] right-[24%] w-2 h-2 bg-amber-400 rounded-full opacity-50 blur-[0.5px] animate-pulse delay-75" />
          <div className="absolute top-[48%] left-[16%] w-1.5 h-1.5 bg-amber-300 rounded-full opacity-70 animate-pulse delay-150" />
        </div>

        {/* Top Header / Dismiss */}
        <header className="relative z-20 flex justify-end items-center px-6 pt-10 pb-2">
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white/80 transition"
            aria-label="Dismiss"
          >
            <X size={18} />
          </button>
        </header>

        {/* Celebration Body */}
        <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
          {/* Hexagonal Medal Badge */}
          <div className="relative flex items-center justify-center my-4">
            {/* Radiant Background Burst */}
            <div className="absolute inset-0 scale-125 bg-amber-500/25 blur-xl rounded-full" />

            {/* Hexagon Border */}
            <div className="relative w-52 h-60 p-[3px] bg-gradient-to-b from-[#FAD67B] via-[#D4AF37] to-[#8C5D14] hex-cell flex items-center justify-center filter drop-shadow-[0_10px_25px_rgba(212,175,55,0.4)]">
              {/* Inner Hexagon Frame */}
              <div className="w-full h-full p-[2.5px] bg-[#071714] hex-cell flex items-center justify-center">
                {/* Image holder */}
                <div className="relative w-full h-full hex-cell overflow-hidden">
                  <img
                    src={imageUrl || fallbackImg}
                    alt={title}
                    className="w-full h-full object-cover scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-amber-500/20" />
                  {/* Center Star / Trophy Icon Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-md border border-amber-400/50 flex items-center justify-center text-amber-300 shadow-lg">
                      <Trophy size={22} className="text-amber-400 drop-shadow" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Typography Headline */}
          <div className="text-center w-full mt-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-600/50 text-emerald-300 text-[10px] font-bold font-display uppercase tracking-widest mb-2">
              <Sparkles size={11} className="text-amber-400" />
              <span>Location Unlocked!</span>
            </div>

            <h1 className="text-2xl font-bold font-display tracking-tight text-white drop-shadow">
              {title}
            </h1>

            <p className="text-xs text-stone-300 mt-1 font-medium">{subtitle}</p>

            {/* XP Award Pill */}
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/15 border border-amber-400/50 shadow-[0_0_16px_rgba(212,175,55,0.3)]">
              <span className="text-amber-400 font-black font-display text-sm">
                +{xpAwarded} XP AWARDED
              </span>
            </div>
          </div>
        </main>

        {/* Bottom CTA */}
        <footer className="relative z-20 px-6 pb-12 pt-4 w-full">
          <button
            onClick={onClose}
            className="w-full py-4 px-6 bg-gradient-to-r from-emerald-600 via-emerald-500 to-amber-400 hover:brightness-110 active:scale-[0.98] transition rounded-full shadow-[0_10px_25px_rgba(0,0,0,0.5)] text-white font-bold font-display text-[15px] uppercase tracking-wider text-center"
          >
            Continue Exploring
          </button>
        </footer>
      </div>
    </div>
  );
}
