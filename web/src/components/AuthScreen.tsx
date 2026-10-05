import { useState } from "react";
import { Compass } from "lucide-react";
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
      setError(err instanceof Error ? err.message : "Something went wrong");
      emitFx({ kind: "toast", text: "Could not sign in", tone: "bad" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fade-in relative grid h-full place-items-center overflow-hidden px-6">
      {/* ambient glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 40% at 50% 0%, rgba(200,241,53,0.09), transparent 70%), radial-gradient(50% 35% at 50% 100%, rgba(200,241,53,0.05), transparent 70%)",
        }}
      />
      <div className="relative w-full max-w-sm">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl border border-lime/40 bg-lime/10">
            <Compass size={30} className="text-lime" strokeWidth={2.2} />
          </div>
          <h1 className="font-display text-[44px] font-bold leading-none tracking-tight">
            ATLAS
          </h1>
          <p className="mt-3 text-[14px] leading-relaxed text-mute">
            The world starts unexplored.
            <br />
            <span className="text-ink">Walk to reveal it.</span>
          </p>
        </div>

        <form onSubmit={submit} className="glass space-y-3 rounded-3xl p-5">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMode("register")}
              className={`chip flex-1 py-2 ${mode === "register" ? "active" : ""}`}
            >
              New explorer
            </button>
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`chip flex-1 py-2 ${mode === "login" ? "active" : ""}`}
            >
              Sign in
            </button>
          </div>

          <input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
            minLength={3}
          />
          {mode === "register" && (
            <input
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          )}
          <input
            placeholder="Password (8+ characters)"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
            minLength={8}
          />

          {error && <p className="text-[13px] text-danger">{error}</p>}

          <button type="submit" disabled={busy} className="btn-lime w-full py-3.5 text-[14px]">
            {busy ? "…" : mode === "register" ? "Begin expedition" : "Continue"}
          </button>
        </form>

        <p className="mt-6 text-center text-[11px] leading-relaxed text-mute/70">
          Your location is only used to verify exploration.
          <br />
          Never shown to other players.
        </p>
      </div>
    </div>
  );
}
