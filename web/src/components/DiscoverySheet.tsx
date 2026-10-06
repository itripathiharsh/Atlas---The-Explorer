import { useRef, useState } from "react";
import {
  Camera,
  CheckCircle2,
  Flag,
  MapPin,
  Share2,
  ThumbsUp,
  X,
  Sparkles,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { api, uploadPhoto } from "../api/client";
import type { Discovery } from "../api/types";
import { emitFx } from "../state/fx";
import CheckInReticleModal from "./CheckInReticleModal";
import LocationUnlockedModal from "./LocationUnlockedModal";

export interface Fix3 {
  lat: number;
  lng: number;
  accuracy_m: number;
}

interface Props {
  discovery: Discovery;
  onClose: () => void;
  getFix: () => Promise<Fix3>;
  visitRadiusM: number;
}

const CATEGORY_IMAGES: Record<string, string> = {
  monument: "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=800&q=80",
  park: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
  museum: "https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?auto=format&fit=crop&w=800&q=80",
  food: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
  historic: "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80",
  nature: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80",
  culture: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80",
};

function getHeroImage(d: Discovery): string {
  if (d.photos && d.photos.length > 0) return d.photos[0];
  const cat = (d.category || "").toLowerCase();
  return CATEGORY_IMAGES[cat] || "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=800&q=80";
}

function fmtDist(m: number | null): string {
  if (m === null) return "";
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;
}

type TabKey = "about" | "photos" | "community";

export default function DiscoverySheet({ discovery, onClose, getFix, visitRadiusM }: Props) {
  const qc = useQueryClient();
  const [d, setD] = useState<Discovery>(discovery);
  const [activeTab, setActiveTab] = useState<TabKey>("about");
  const [busy, setBusy] = useState<string | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [showReticle, setShowReticle] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const heroImage = getHeroImage(d);
  const isCloseEnough = d.distance_m !== null && d.distance_m <= visitRadiusM;

  async function handleVerifiedCheckIn() {
    setBusy("visit");
    try {
      const pos = await getFix();
      await api(`/discoveries/${d.id}/visit`, {
        method: "POST",
        body: { ...pos, recorded_at: new Date().toISOString() },
      });
      const fresh = await api<Discovery>(`/discoveries/${d.id}`);
      setD(fresh);
      qc.invalidateQueries({ queryKey: ["nearby"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      setShowReticle(false);
      setShowCelebration(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed";
      emitFx({ kind: "toast", text: msg, tone: "bad" });
    } finally {
      setBusy(null);
    }
  }

  async function handleRecommend() {
    setBusy("recommend");
    try {
      await api(`/discoveries/${d.id}/recommend`, { method: "POST" });
      const fresh = await api<Discovery>(`/discoveries/${d.id}`);
      setD(fresh);
      qc.invalidateQueries({ queryKey: ["nearby"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      emitFx({ kind: "toast", text: "Recommendation recorded! +20 XP" });
    } catch (err) {
      emitFx({ kind: "toast", text: err instanceof Error ? err.message : "Failed", tone: "bad" });
    } finally {
      setBusy(null);
    }
  }

  async function handlePhotoUpload(file: File) {
    setBusy("photo");
    try {
      const { url } = await uploadPhoto(d.id, file);
      setD((cur) => ({ ...cur, photos: [...cur.photos, url] }));
      emitFx({ kind: "toast", text: "Photo uploaded successfully!" });
    } catch (err) {
      emitFx({ kind: "toast", text: err instanceof Error ? err.message : "Upload failed", tone: "bad" });
    } finally {
      setBusy(null);
    }
  }

  async function handleReport(reason: string) {
    setShowReport(false);
    try {
      await api("/reports", {
        method: "POST",
        body: { target_type: "discovery", target_id: d.id, reason },
      });
      emitFx({ kind: "toast", text: "Report submitted — thank you for keeping ATLAS safe" });
    } catch {
      emitFx({ kind: "toast", text: "Could not send report", tone: "bad" });
    }
  }

  function handleShare() {
    if (navigator.share) {
      navigator
        .share({
          title: `ATLAS Discovery: ${d.name}`,
          text: `Check out ${d.name} on ATLAS Exploration Game!`,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(`${d.name} (${d.category}) on ATLAS`);
      emitFx({ kind: "toast", text: "Discovery copied to clipboard" });
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs" onClick={onClose} />

      <main
        aria-label="Discovery details"
        className="parchment-sheet safe-b fixed inset-x-0 bottom-0 z-50 max-h-[92dvh] h-[88dvh] overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300"
      >
        {/* Top Hero Photo Section */}
        <header className="relative w-full h-[36%] shrink-0 overflow-hidden bg-black">
          <img
            src={heroImage}
            alt={d.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/40 pointer-events-none" />

          {/* Floating Navigation Controls */}
          <nav className="absolute top-0 inset-x-0 pt-4 px-4 flex items-center justify-between z-10">
            <button
              onClick={onClose}
              aria-label="Close"
              className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/70 active:scale-95 transition"
            >
              <X size={17} />
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                aria-label="Share"
                className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/70 active:scale-95 transition"
              >
                <Share2 size={16} />
              </button>
              <button
                onClick={() => setShowReport(!showReport)}
                aria-label="Report"
                className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-md text-white/80 hover:text-white flex items-center justify-center hover:bg-black/70 active:scale-95 transition"
              >
                <Flag size={15} />
              </button>
            </div>
          </nav>
        </header>

        {/* Bottom Content Sheet in Warm Parchment */}
        <section className="flex-1 bg-atlas-cream -mt-5 rounded-t-[28px] pt-4 px-5 flex flex-col justify-between overflow-y-auto no-scrollbar relative z-20 shadow-lg">
          <div>
            {/* Drag Handle */}
            <div className="w-12 h-1.5 bg-stone-300 rounded-full mx-auto mb-3" />

            {/* Title & Metadata */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full capitalize">
                  {d.category}
                </span>
                <h1 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-neutral-900 mt-1 truncate">
                  {d.name}
                </h1>
                <p className="text-xs text-stone-600 flex items-center gap-1 mt-1 font-medium">
                  <MapPin size={13} className="text-emerald-700" />
                  <span>
                    {d.distance_m !== null
                      ? `${fmtDist(d.distance_m)} away`
                      : "Location recorded"}
                  </span>
                </p>
              </div>

              {/* Worth Visiting Score Badge */}
              <div className="shrink-0 text-right">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                  <ThumbsUp size={12} className="text-emerald-700" />
                  <span>{d.score_pct !== null ? `${d.score_pct}%` : "100%"} Worth It</span>
                </div>
              </div>
            </div>

            {/* Segmented Tabs */}
            <nav className="flex border-b border-stone-200 mt-4 text-xs font-bold">
              <button
                onClick={() => setActiveTab("about")}
                className={`pb-2.5 px-3 transition-colors ${
                  activeTab === "about"
                    ? "text-[#0F2D20] border-b-2 border-[#0F2D20] font-extrabold"
                    : "text-stone-400 hover:text-stone-700"
                }`}
              >
                About
              </button>
              <button
                onClick={() => setActiveTab("photos")}
                className={`pb-2.5 px-3 transition-colors flex items-center gap-1.5 ${
                  activeTab === "photos"
                    ? "text-[#0F2D20] border-b-2 border-[#0F2D20] font-extrabold"
                    : "text-stone-400 hover:text-stone-700"
                }`}
              >
                <span>Photos</span>
                <span className="text-[10px] font-mono bg-stone-200 px-1.5 rounded-full text-stone-700">
                  {d.photos.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab("community")}
                className={`pb-2.5 px-3 transition-colors ${
                  activeTab === "community"
                    ? "text-[#0F2D20] border-b-2 border-[#0F2D20] font-extrabold"
                    : "text-stone-400 hover:text-stone-700"
                }`}
              >
                Expedition Stats
              </button>
            </nav>

            {/* Tab: About */}
            {activeTab === "about" && (
              <div className="mt-3.5 space-y-3.5 animate-in fade-in duration-150">
                <p className="text-xs sm:text-sm text-stone-700 leading-relaxed font-normal">
                  {d.description ||
                    "A notable point of interest recorded on the ATLAS world map. Walk within proximity to verify your visit and unlock exploration accolades."}
                </p>

                {/* Quick Community Stats Row */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="parchment-card rounded-xl p-2.5 text-center">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-stone-500 font-display">
                      Explorers
                    </span>
                    <p className="font-display font-extrabold text-base text-neutral-900 mt-0.5">
                      {d.visit_count}
                    </p>
                  </div>
                  <div className="parchment-card rounded-xl p-2.5 text-center">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-stone-500 font-display">
                      Endorsed
                    </span>
                    <p className="font-display font-extrabold text-base text-amber-700 mt-0.5">
                      {d.recommendation_count}
                    </p>
                  </div>
                  <div className="parchment-card rounded-xl p-2.5 text-center">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-stone-500 font-display">
                      Reward
                    </span>
                    <p className="font-display font-extrabold text-base text-emerald-800 mt-0.5">
                      +15 XP
                    </p>
                  </div>
                </div>

                {/* Photo Previews */}
                <div className="pt-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-neutral-800 font-display uppercase tracking-wider">
                      Expedition Photos
                    </span>
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="text-[11px] font-bold text-emerald-800 hover:underline flex items-center gap-1"
                    >
                      <Camera size={13} />
                      <span>Add photo</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
                    {d.photos.map((p, i) => (
                      <div
                        key={i}
                        className="w-20 h-16 shrink-0 rounded-xl overflow-hidden shadow-xs border border-stone-300"
                      >
                        <img src={p} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="w-16 h-16 shrink-0 rounded-xl border border-dashed border-stone-300 bg-stone-100/80 flex flex-col items-center justify-center text-stone-500 hover:border-emerald-600 transition"
                    >
                      <Camera size={16} />
                      <span className="text-[9px] mt-0.5 font-bold">Upload</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Photos */}
            {activeTab === "photos" && (
              <div className="mt-3.5 space-y-3 animate-in fade-in duration-150">
                <div className="grid grid-cols-3 gap-2">
                  {d.photos.map((p, i) => (
                    <div
                      key={i}
                      className="aspect-square rounded-xl overflow-hidden shadow-xs border border-stone-300"
                    >
                      <img src={p} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="aspect-square rounded-xl border-2 border-dashed border-stone-300 bg-stone-100 flex flex-col items-center justify-center text-stone-500 hover:border-emerald-600 transition"
                  >
                    <Camera size={20} />
                    <span className="text-[10px] font-bold mt-1">Upload Photo</span>
                  </button>
                </div>
              </div>
            )}

            {/* Tab: Community / Expedition Stats */}
            {activeTab === "community" && (
              <div className="mt-3.5 space-y-3 animate-in fade-in duration-150">
                <div className="parchment-card rounded-2xl p-4">
                  <h3 className="font-display font-bold text-sm text-neutral-900">
                    Expedition History
                  </h3>
                  <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                    This location was charted on the global grid with Uber H3 resolution 8.
                    Visitors who physically reach within {visitRadiusM}m can verify their visit
                    and leave recommendations for fellow adventurers.
                  </p>
                  <div className="mt-3 flex items-center justify-between text-xs text-stone-700 pt-2 border-t border-stone-200">
                    <span>Unique Visitors</span>
                    <span className="font-bold font-display">{d.visit_count} explorers</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs text-stone-700">
                    <span>Endorsement Rate</span>
                    <span className="font-bold font-display text-emerald-800">
                      {d.score_pct !== null ? `${d.score_pct}%` : "100%"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Report Drawer */}
            {showReport && (
              <div className="mt-3 p-3.5 rounded-2xl bg-stone-100 border border-stone-300">
                <p className="text-xs font-bold text-neutral-800 mb-2">Report this place:</p>
                <div className="flex flex-wrap gap-1.5">
                  {["Wrong location", "Duplicate", "Closed / Inaccessible", "Inappropriate"].map(
                    (r) => (
                      <button
                        key={r}
                        onClick={() => handleReport(r)}
                        className="px-2.5 py-1 rounded-full bg-white border border-stone-300 text-[11px] font-semibold text-stone-700 hover:bg-red-50 hover:text-red-700 transition"
                      >
                        {r}
                      </button>
                    )
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Action Bar docked at bottom of sheet */}
          <footer className="pt-3 pb-6 border-t border-stone-200/80 mt-3 flex flex-col gap-2">
            {/* Primary Action Button */}
            {d.visited_by_me ? (
              <div className="flex gap-2">
                <button
                  disabled
                  className="flex-1 py-3 px-4 rounded-full bg-emerald-100 text-emerald-800 font-bold font-display text-xs flex items-center justify-center gap-1.5 cursor-default"
                >
                  <CheckCircle2 size={16} />
                  <span>Visited ✓</span>
                </button>
                <button
                  onClick={handleRecommend}
                  disabled={d.recommended_by_me || busy === "recommend"}
                  className={`flex-1 py-3 px-4 rounded-full font-bold font-display text-xs flex items-center justify-center gap-1.5 transition active:scale-95 ${
                    d.recommended_by_me
                      ? "bg-amber-100 text-amber-800 cursor-default"
                      : "bg-[#0F2D20] text-white hover:bg-[#194A36]"
                  }`}
                >
                  <ThumbsUp size={15} />
                  <span>{d.recommended_by_me ? "Recommended ★" : "Worth Visiting (+20 XP)"}</span>
                </button>
              </div>
            ) : isCloseEnough ? (
              <button
                onClick={() => setShowReticle(true)}
                disabled={busy === "visit"}
                className="w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-emerald-600 via-emerald-500 to-amber-400 hover:brightness-110 active:scale-98 text-white font-bold font-display text-sm tracking-wider uppercase flex items-center justify-center gap-2 shadow-md shadow-emerald-950/40"
              >
                <Sparkles size={16} />
                <span>Verify Visit (+15 XP)</span>
              </button>
            ) : (
              <button
                onClick={() => setShowReticle(true)}
                className="w-full py-3 px-4 rounded-full bg-stone-200/90 hover:bg-stone-300 text-stone-800 font-bold font-display text-xs flex items-center justify-center gap-2 transition"
              >
                <MapPin size={15} className="text-stone-600" />
                <span>
                  Walk closer to check in ({fmtDist(d.distance_m)} / {visitRadiusM}m)
                </span>
              </button>
            )}

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handlePhotoUpload(f);
              }}
            />
          </footer>
        </section>
      </main>

      {/* Reticle Viewfinder Check-in Modal */}
      {showReticle && (
        <CheckInReticleModal
          discovery={d}
          distanceM={d.distance_m}
          allowedRadiusM={visitRadiusM}
          onConfirm={handleVerifiedCheckIn}
          onClose={() => setShowReticle(false)}
          busy={busy === "visit"}
        />
      )}

      {/* Location Unlocked Celebration Modal */}
      {showCelebration && (
        <LocationUnlockedModal
          title={d.name}
          subtitle={`Visited ${d.category} · Sector Verified`}
          xpAwarded={15}
          imageUrl={heroImage}
          onClose={() => setShowCelebration(false)}
        />
      )}
    </>
  );
}
