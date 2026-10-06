import { useState } from "react";
import { Sparkles } from "lucide-react";
import { useAuth } from "../state/auth";
import { emitFx } from "../state/fx";

export default function AuthScreen() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("register");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === "login") await login(username, password);
      else await register(username, email, password);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg);
      emitFx({ kind: "toast", text: "Could not sign in", tone: "bad" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 overflow-hidden bg-[#071714]">
      {/* Scenic Mountain Valley Background with dark expedition vignette */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=80"
          alt="Scenic Mountain Valley"
          className="w-full h-full object-cover brightness-[0.38] contrast-[1.15]"
        />
        {/* Ambient mist and atmospheric gradients (matching 01_splash_welcome_screen) */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 50% 35%, rgba(7, 23, 20, 0.4) 0%, rgba(7, 23, 20, 0.85) 65%, rgba(7, 23, 20, 0.98) 100%)",
          }}
        />
      </div>

      {/* Main Glass Card */}
      <main className="relative z-10 w-full max-w-sm flex flex-col items-center">
        {/* Brand Center Section */}
        <div className="mb-6 text-center flex flex-col items-center">
          {/* Official ATLAS Emblem with Golden Ring */}
          <div className="relative w-28 h-28 mb-4 flex items-center justify-center">
            {/* Golden glow */}
            <div className="absolute inset-0 rounded-full bg-amber-400/15 blur-xl animate-pulse" />

            {/* Circular dashed accent */}
            <svg
              className="absolute inset-0 w-full h-full text-amber-400/60"
              viewBox="0 0 100 100"
              fill="none"
            >
              <circle
                cx="50"
                cy="50"
                r="46"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeDasharray="4 3"
              />
            </svg>

            {/* Brand Logo Image */}
            <img
              src="/icons/icon-192.png"
              alt="ATLAS"
              className="relative w-20 h-20 rounded-2xl shadow-[0_8px_20px_rgba(0,0,0,0.6)] border border-white/10 object-cover"
            />
          </div>

          <h1 className="font-display text-4xl sm:text-[44px] font-black tracking-[0.25em] text-white pl-2 drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] uppercase">
            ATLAS
          </h1>

          {/* Tagline */}
          <div className="mt-2 flex items-center justify-center space-x-2 text-[10px] sm:text-[11px] font-semibold tracking-[0.32em] text-stone-300 font-display uppercase">
            <span>EXPLORE</span>
            <span className="text-amber-400 text-[8px]">•</span>
            <span>UNLOCK</span>
            <span className="text-amber-400 text-[8px]">•</span>
            <span>DISCOVER</span>
          </div>

          {/* Subtitle */}
          <p className="mt-3 text-xs sm:text-[13px] text-stone-300/90 max-w-[280px] leading-relaxed">
            The world starts in darkness.
            <br />
            <span className="text-white font-semibold">Physically explore to reveal it.</span>
          </p>
        </div>

        {/* Authentication Card Form */}
        <div className="w-full glass rounded-3xl p-5 border border-emerald-950/70 shadow-2xl backdrop-blur-xl">
          {/* Tab Selector */}
          <div className="flex gap-2 p-1 bg-black/40 rounded-full border border-white/10 mb-4">
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setError(null);
              }}
              className={`flex-1 py-2 text-xs font-bold font-display uppercase tracking-wider rounded-full transition-all ${
                mode === "register"
                  ? "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-sm"
                  : "text-stone-400 hover:text-white"
              }`}
            >
              Get Started
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError(null);
              }}
              className={`flex-1 py-2 text-xs font-bold font-display uppercase tracking-wider rounded-full transition-all ${
                mode === "login"
                  ? "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-sm"
                  : "text-stone-400 hover:text-white"
              }`}
            >
              Sign In
            </button>
          </div>

          <form onSubmit={submit} className="space-y-3">
            <div>
              <input
                placeholder="Explorer Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
                minLength={3}
                className="bg-black/40 border-white/10 text-white placeholder:text-stone-500 rounded-xl px-3.5 py-3 text-sm focus:border-emerald-500"
              />
            </div>

            {mode === "register" && (
              <div>
                <input
                  placeholder="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  className="bg-black/40 border-white/10 text-white placeholder:text-stone-500 rounded-xl px-3.5 py-3 text-sm focus:border-emerald-500"
                />
              </div>
            )}

            <div>
              <input
                placeholder="Password (8+ characters)"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                required
                minLength={8}
                className="bg-black/40 border-white/10 text-white placeholder:text-stone-500 rounded-xl px-3.5 py-3 text-sm focus:border-emerald-500"
              />
            </div>

            {error && (
              <p className="text-xs text-red-400 px-1 font-medium">{error}</p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full mt-2 py-3.5 px-6 bg-gradient-to-r from-emerald-600 via-emerald-500 to-amber-400 hover:brightness-110 active:scale-[0.98] transition rounded-full shadow-[0_10px_25px_rgba(0,0,0,0.5)] flex items-center justify-center gap-2 text-white font-bold font-display text-sm tracking-wider uppercase"
            >
              <Sparkles size={16} />
              <span>{busy ? "Entering…" : mode === "register" ? "Begin Expedition" : "Resume Journey"}</span>
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-[10px] text-stone-400 max-w-[280px] leading-relaxed">
          GPS coordinates are validated on the server for exploration milestones.
          <br />
          Your precise location is never shared with other explorers.
        </p>
      </main>
    </div>
  );
}
