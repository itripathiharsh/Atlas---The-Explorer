import { useRef, useState } from "react";
import { Camera, Flag, Star, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { api, uploadPhoto } from "../api/client";
import type { Discovery } from "../api/types";
import { emitFx } from "../state/fx";

interface Props {
  discovery: Discovery;
  onClose: () => void;
}

export default function DiscoverySheet({ discovery, onClose }: Props) {
  const qc = useQueryClient();
  const [d, setD] = useState<Discovery>(discovery);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showReport, setShowReport] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function run(action: "visit" | "recommend", fn: () => Promise<{ xp_awarded: number }>) {
    setBusy(action);
    setError(null);
    try {
      await fn();
      const fresh = await api<Discovery>(`/discoveries/${d.id}`);
      setD(fresh);
      qc.invalidateQueries({ queryKey: ["nearby"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed";
      setError(msg);
      emitFx({ kind: "toast", text: msg, tone: "bad" });
    } finally {
      setBusy(null);
    }
  }

  const visit = () =>
    run("visit", async () => {
      const pos = await currentPos();
      return api(`/discoveries/${d.id}/visit`, {
        method: "POST",
        body: { ...pos, recorded_at: new Date().toISOString() },
      });
    });

  const recommend = () =>
    run("recommend", () => api(`/discoveries/${d.id}/recommend`, { method: "POST" }));

  async function report(reason: string) {
    setShowReport(false);
    try {
      await api("/reports", {
        method: "POST",
        body: { target_type: "discovery", target_id: d.id, reason },
      });
      emitFx({ kind: "toast", text: "Report sent — thank you" });
    } catch {
      emitFx({ kind: "toast", text: "Could not send report", tone: "bad" });
    }
  }

  async function onPhoto(file: File) {
    setBusy("photo");
    try {
      const { url } = await uploadPhoto(d.id, file);
      setD((cur) => ({ ...cur, photos: [...cur.photos, url] }));
      emitFx({ kind: "toast", text: "Photo added" });
    } catch (err) {
      emitFx({ kind: "toast", text: err instanceof Error ? err.message : "Upload failed", tone: "bad" });
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <div className="absolute inset-0 z-30 bg-black/40" onClick={onClose} />
      <div className="sheet safe-b glass absolute inset-x-0 bottom-0 z-40 max-h-[78dvh] overflow-y-auto rounded-t-3xl px-5 pt-3">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="chip">{d.category}</span>
            <h2 className="mt-2 font-display text-[24px] font-bold leading-tight">{d.name}</h2>
            {d.distance_m !== null && (
              <p className="mt-1 text-[13px] text-mute">{Math.round(d.distance_m)} m away</p>
            )}
          </div>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full border border-white/10">
            <X size={16} />
          </button>
        </div>

        {d.description && (
          <p className="mt-3 text-[14px] leading-relaxed text-ink/85">{d.description}</p>
        )}

        {/* community */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3 text-center">
            <div className="hud-label">Explored</div>
            <div className="font-display text-lg font-bold">{d.visit_count}</div>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3 text-center">
            <div className="hud-label">Recommended</div>
            <div className="font-display text-lg font-bold">{d.recommendation_count}</div>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3 text-center">
            <div className="hud-label">Worth it</div>
            <div className={`font-display text-lg font-bold ${d.score_pct !== null && d.score_pct >= 70 ? "text-lime" : "text-ink"}`}>
              {d.score_pct === null ? "—" : `${d.score_pct}%`}
            </div>
          </div>
        </div>

        {/* photos */}
        {d.photos.length > 0 && (
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {d.photos.map((p) => (
              <img
                key={p}
                src={p}
                alt=""
                className="h-20 w-20 shrink-0 rounded-xl border border-white/10 object-cover"
              />
            ))}
          </div>
        )}

        {error && <p className="mt-3 text-[13px] text-danger">{error}</p>}

        {/* actions */}
        <div className="mt-4 flex gap-2 pb-2">
          {d.visited_by_me ? (
            <div className="btn-ghost flex flex-1 items-center justify-center gap-2 border-lime/50 py-3.5 text-[13px] text-lime">
              <Star size={15} className="fill-lime" /> Visited
            </div>
          ) : (
            <button onClick={visit} disabled={busy !== null} className="btn-lime flex-1 py-3.5 text-[13px]">
              {busy === "visit" ? "Verifying…" : "I'm here — mark visited"}
            </button>
          )}
          <button
            onClick={recommend}
            disabled={busy !== null || !d.visited_by_me || d.recommended_by_me}
            className={`btn-ghost flex items-center gap-2 px-5 py-3.5 text-[13px] ${
              d.recommended_by_me ? "border-gold/60 text-gold" : ""
            }`}
            title={d.visited_by_me ? "Recommend this place" : "Visit first to recommend"}
          >
            <Star size={15} className={d.recommended_by_me ? "fill-gold" : ""} />
            {d.recommended_by_me ? "Recommended" : "Worth visiting"}
          </button>
          <button
            onClick={() => setShowReport(true)}
            className="btn-ghost grid w-12 place-items-center px-0"
            aria-label="Report"
          >
            <Flag size={15} />
          </button>
        </div>

        <div className="mt-1 flex gap-2 pb-1">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && onPhoto(e.target.files[0])}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={busy === "photo"}
            className="btn-ghost flex flex-1 items-center justify-center gap-2 py-3 text-[12px] text-mute"
          >
            <Camera size={14} /> {busy === "photo" ? "Uploading…" : "Add a photo"}
          </button>
        </div>
      </div>

      {showReport && (
        <div className="absolute inset-0 z-50 grid place-items-center bg-black/60 px-6" onClick={() => setShowReport(false)}>
          <div className="glass w-full max-w-xs rounded-3xl p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-[16px] font-bold">Report this place</h3>
            <div className="mt-3 space-y-2">
              {["Unsafe location", "Private property", "Inaccurate info", "Inappropriate"].map((r) => (
                <button
                  key={r}
                  onClick={() => report(r.toLowerCase().replace(/ /g, "_"))}
                  className="btn-ghost w-full py-2.5 text-[12px]"
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function currentPos(): Promise<{ lat: number; lng: number; accuracy_m: number }> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) return reject(new Error("No GPS available"));
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy_m: p.coords.accuracy }),
      (e) => reject(new Error(e.code === 1 ? "Location permission denied" : "Could not get your location")),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 3000 },
    );
  });
}
