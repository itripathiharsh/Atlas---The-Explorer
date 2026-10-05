import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { AuthProvider, useAuth } from "./state/auth";
import { emitFx } from "./state/fx";
import { api } from "./api/client";
import type { ApiConfig, Discovery, GeoFC, MapSummary, Stats, UnlockedCell } from "./api/types";
import { useGeolocation } from "./hooks/useGeolocation";
import { useExploration } from "./hooks/useExploration";
import MapCanvas from "./map/MapCanvas";
import { haversineM } from "./utils/geo";
import HUD from "./components/HUD";
import StatsDock from "./components/StatsDock";
import AuthScreen from "./components/AuthScreen";
import Onboarding from "./components/Onboarding";
import DiscoverySheet from "./components/DiscoverySheet";
import CreateDiscoverySheet from "./components/CreateDiscoverySheet";
import NearbySheet from "./components/NearbySheet";
import ProfileSheet from "./components/ProfileSheet";
import XPFX from "./components/XPFX";

const ONBOARD_KEY = "wg_onboarded_v1";

function Game() {
  const { user, loading } = useAuth();
  const [onboarded, setOnboarded] = useState(
    () => localStorage.getItem(ONBOARD_KEY) === "1",
  );
  const [selected, setSelected] = useState<Discovery | null>(null);
  const [creating, setCreating] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [nearbyOpen, setNearbyOpen] = useState(false);
  const [mapCenter, setMapCenter] = useState({ lat: 26.8467, lng: 80.9462 });
  const [pulse, setPulse] = useState<UnlockedCell[]>([]);
  const [merged, setMerged] = useState<GeoFC | null>(null);
  const [flyTo, setFlyTo] = useState<{ lat: number; lng: number; zoom?: number } | null>(null);

  const gpsHint = () =>
    emitFx({
      kind: "toast",
      text:
        geo.status === "denied"
          ? "Location blocked — enable GPS in your browser"
          : "Finding your location…",
      tone: geo.status === "denied" ? "bad" : "good",
    });

  const showOnboarding = !!user && !onboarded;
  const tracking = !!user && onboarded;

  const exploration = useExploration(tracking, (cells) => {
    setPulse(cells);
    setMerged((cur) => (cur ? mergeCells(cur, cells) : cur));
  });
  const geo = useGeolocation((fix) => exploration.push(fix), tracking);

  // live position for check-ins — reuses the tracker, falls back to a fresh read
  const getFix = useCallback(async (): Promise<{
    lat: number;
    lng: number;
    accuracy_m: number;
  }> => {
    if (geo.pos && Date.now() - geo.pos.ts < 20_000) {
      return { lat: geo.pos.lat, lng: geo.pos.lng, accuracy_m: geo.pos.accuracy };
    }
    return new Promise((resolve, reject) => {
      if (!("geolocation" in navigator)) return reject(new Error("No GPS available"));
      navigator.geolocation.getCurrentPosition(
        (p) =>
          resolve({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy_m: p.coords.accuracy }),
        (e) =>
          reject(
            new Error(
              e.code === 1 ? "Location permission denied" : "Could not get your location",
            ),
          ),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 },
      );
    });
  }, [geo.pos]);

  const stats = useQuery<Stats>({
    queryKey: ["stats"],
    queryFn: () => api("/me/stats"),
    enabled: !!user,
  });
  const gameConfig = useQuery<ApiConfig>({
    queryKey: ["config"],
    queryFn: () => api("/config"),
    enabled: !!user,
    staleTime: Infinity,
  });
  const summary = useQuery<MapSummary>({
    queryKey: ["summary"],
    queryFn: () => api("/map/summary"),
    enabled: !!user,
  });
  const explored = useQuery<GeoFC>({
    queryKey: ["explored"],
    queryFn: () => api("/map/explored"),
    enabled: !!user,
  });
  const nearby = useQuery<Discovery[]>({
    queryKey: ["nearby", geo.pos ? geo.pos.lat.toFixed(3) + "," + geo.pos.lng.toFixed(3) : "none"],
    queryFn: () =>
      api(`/discoveries/nearby?lat=${geo.pos!.lat}&lng=${geo.pos!.lng}&radius_m=3000`),
    enabled: !!user && !!geo.pos,
    refetchInterval: 45_000,
  });

  // merge server-explored cells with live unlocks
  useEffect(() => {
    if (explored.data) setMerged(explored.data);
  }, [explored.data]);

  // fly to the user the first time a fix arrives
  const firstFix = useRef(true);
  useEffect(() => {
    if (geo.pos && firstFix.current) {
      firstFix.current = false;
      setFlyTo({ lat: geo.pos.lat, lng: geo.pos.lng, zoom: 15.5 });
    }
  }, [geo.pos]);

  // Escape closes the top-most sheet (desktop nicety)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (selected) setSelected(null);
      else if (creating) setCreating(false);
      else if (nearbyOpen) setNearbyOpen(false);
      else if (profileOpen) setProfileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, creating, nearbyOpen, profileOpen]);

  const discoveries = useMemo(() => nearby.data ?? [], [nearby.data]);

  // distance shown in the detail sheet is always from *you* (display-only)
  const selectedWithDist = useMemo(() => {
    if (!selected) return null;
    if (!geo.pos) return selected;
    return { ...selected, distance_m: haversineM(geo.pos, selected) };
  }, [selected, geo.pos]);

  if (loading) {
    return (
      <div className="grid h-full place-items-center">
        <div className="hud-label animate-pulse">Preparing expedition…</div>
      </div>
    );
  }

  if (!user) return <AuthScreen />;

  return (
    <div className="relative h-full overflow-hidden">
      <MapCanvas
        explored={merged}
        pulse={pulse}
        discoveries={discoveries}
        userPos={geo.pos}
        onSelectDiscovery={setSelected}
        flyTo={flyTo}
        onMove={setMapCenter}
      />

      <HUD user={user} stats={stats.data} onProfile={() => setProfileOpen(true)} />

      <StatsDock
        stats={stats.data}
        summary={summary.data}
        onRecenter={() => {
          if (geo.pos) setFlyTo({ lat: geo.pos.lat, lng: geo.pos.lng, zoom: 15.5 });
          else gpsHint();
        }}
        onNearby={() => setNearbyOpen(true)}
        onNearbyList={() => setNearbyOpen(true)}
      />

      {/* add discovery */}
      <button
        onClick={() => (geo.pos ? setCreating(true) : gpsHint())}
        className="glass absolute right-3 top-1/2 z-20 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-2xl transition hover:border-lime/50"
        aria-label="Add discovery"
        title="Add a discovery here"
      >
        <Plus size={20} className="text-lime" />
      </button>

      {/* GPS status pill */}
      {tracking && geo.status !== "live" && (
        <div className="glass absolute left-3 top-[76px] z-20 rounded-full px-3.5 py-1.5">
          <span className="hud-label">
            {geo.status === "denied"
              ? "Location blocked — enable GPS"
              : geo.status === "locating"
                ? "Finding you…"
                : "Waiting for GPS…"}
          </span>
        </div>
      )}

      {showOnboarding && (
        <Onboarding
          onDone={() => {
            localStorage.setItem(ONBOARD_KEY, "1");
            setOnboarded(true);
            geo.start();
          }}
        />
      )}

      {selectedWithDist && (
        <DiscoverySheet
          discovery={selectedWithDist}
          onClose={() => setSelected(null)}
          getFix={getFix}
          visitRadiusM={gameConfig.data?.visit_radius_m ?? 150}
        />
      )}
      {nearbyOpen && (
        <NearbySheet
          center={mapCenter}
          onClose={() => setNearbyOpen(false)}
          onSelect={(d) => {
            setNearbyOpen(false);
            setSelected(d);
            setFlyTo({ lat: d.lat, lng: d.lng, zoom: 16 });
          }}
          onJumpLucknow={() => {
            setFlyTo({ lat: 26.8467, lng: 80.9462, zoom: 13.5 });
            emitFx({ kind: "toast", text: "Flying to Lucknow — where the story starts" });
          }}
        />
      )}
      {creating && geo.pos && (
        <CreateDiscoverySheet
          pos={{ lat: geo.pos.lat, lng: geo.pos.lng, accuracy: geo.pos.accuracy }}
          maxAccuracyM={gameConfig.data?.max_accuracy_m ?? 50}
          onClose={() => setCreating(false)}
          onCreated={() => {
            setCreating(false);
            void nearby.refetch();
          }}
        />
      )}
      {profileOpen && <ProfileSheet user={user} onClose={() => setProfileOpen(false)} />}

      <XPFX />
    </div>
  );
}

function mergeCells(fc: GeoFC, cells: UnlockedCell[]): GeoFC {
  const known = new Set(fc.features.map((f) => f.properties.h3));
  const fresh = cells
    .filter((c) => !known.has(c.h3))
    .map((c) => ({
      type: "Feature" as const,
      geometry: { type: "Polygon" as const, coordinates: [c.boundary] },
      properties: { h3: c.h3 },
    }));
  return { type: "FeatureCollection", features: [...fc.features, ...fresh] };
}

export default function App() {
  return (
    <AuthProvider>
      <Game />
    </AuthProvider>
  );
}
