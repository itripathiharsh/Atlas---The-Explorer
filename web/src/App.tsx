import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./state/auth";
import { emitFx } from "./state/fx";
import { api } from "./api/client";
import type { ApiConfig, Discovery, GeoFC, MapSummary, Stats, UnlockedCell, WorldPin } from "./api/types";
import { useGeolocation } from "./hooks/useGeolocation";
import { useExploration } from "./hooks/useExploration";
import MapCanvas from "./map/MapCanvas";
import { haversineM } from "./utils/geo";
import HUD from "./components/HUD";
import StatsDock from "./components/StatsDock";
import BottomNav, { NavTab } from "./components/BottomNav";
import AuthScreen from "./components/AuthScreen";
import Onboarding from "./components/Onboarding";
import DiscoverySheet from "./components/DiscoverySheet";
import CreateDiscoverySheet from "./components/CreateDiscoverySheet";
import NearbySheet from "./components/NearbySheet";
import CityListSheet from "./components/CityListSheet";
import ProfileSheet from "./components/ProfileSheet";
import XPFX from "./components/XPFX";

const ONBOARD_KEY = "wg_onboarded_v1";
const CATEGORIES = ["Food", "Park", "Monument", "Culture", "Nature", "Viewpoint", "Museum", "Street", "Landmark", "Hidden gem"];

function Game() {
  const { user, loading } = useAuth();
  const [onboarded, setOnboarded] = useState(
    () => localStorage.getItem(ONBOARD_KEY) === "1",
  );
  const [activeTab, setActiveTab] = useState<NavTab>("map");
  const [selected, setSelected] = useState<Discovery | null>(null);
  const [creating, setCreating] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [nearbyOpen, setNearbyOpen] = useState(false);
  const [cityListOpen, setCityListOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const [mapCenter, setMapCenter] = useState({ lat: 26.8467, lng: 80.9462 });
  const [pulse, setPulse] = useState<UnlockedCell[]>([]);
  const [merged, setMerged] = useState<GeoFC | null>(null);
  const [flyTo, setFlyTo] = useState<{
    lat: number;
    lng: number;
    zoom?: number;
    bearing?: number;
    pitch?: number;
  } | null>(null);

  const showOnboarding = !!user && !onboarded;
  const tracking = !!user && onboarded;

  const exploration = useExploration(tracking, (cells) => {
    setPulse(cells);
    setMerged((cur) => (cur ? mergeCells(cur, cells) : cur));
  });
  const geo = useGeolocation((fix) => exploration.push(fix), tracking);

  const gpsHint = () =>
    emitFx({
      kind: "toast",
      text:
        geo.status === "denied"
          ? "Location blocked — enable GPS in your browser"
          : "Finding your location…",
      tone: geo.status === "denied" ? "bad" : "good",
    });

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
  // the whole world's pins — clustered on the map
  const worldPins = useQuery<WorldPin[]>({
    queryKey: ["worldpins"],
    queryFn: () => api("/discoveries/all"),
    enabled: !!user,
    staleTime: 60_000,
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
      else if (cityListOpen) setCityListOpen(false);
      else if (profileOpen) setProfileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, creating, nearbyOpen, cityListOpen, profileOpen]);

  // Sync active tab to map when all sheets close
  useEffect(() => {
    if (!nearbyOpen && !cityListOpen && !profileOpen && !creating && !selected) {
      setActiveTab("map");
    }
  }, [nearbyOpen, cityListOpen, profileOpen, creating, selected]);

  const openDiscovery = useCallback(
    async (id: number) => {
      try {
        setSelected(await api<Discovery>(`/discoveries/${id}`));
      } catch {
        emitFx({ kind: "toast", text: "Could not open that discovery", tone: "bad" });
      }
    },
    [],
  );

  // distance shown in the detail sheet is always from *you* (display-only)
  const selectedWithDist = useMemo(() => {
    if (!selected) return null;
    if (!geo.pos) return selected;
    return { ...selected, distance_m: haversineM(geo.pos, selected) };
  }, [selected, geo.pos]);

  if (loading) {
    return (
      <div className="grid h-full place-items-center bg-[#071714]">
        <div className="hud-label text-emerald-400 animate-pulse font-display text-sm">
          Preparing expedition…
        </div>
      </div>
    );
  }

  if (!user) return <AuthScreen />;

  return (
    <div className="relative h-full overflow-hidden bg-[#071714]">
      {/* 1. Map Canvas Layer */}
      <MapCanvas
        explored={merged}
        pulse={pulse}
        discoveries={worldPins.data ?? []}
        userPos={geo.pos}
        onSelectDiscovery={openDiscovery}
        flyTo={flyTo}
        onMove={setMapCenter}
        categoryFilter={categoryFilter}
        selectedId={selected?.id ?? null}
      />

      {/* 2. Top HUD Bar */}
      <HUD
        user={user}
        stats={stats.data}
        onProfile={() => {
          setActiveTab("profile");
          setProfileOpen(true);
        }}
        onSearch={() => {
          setActiveTab("explore");
          setNearbyOpen(true);
        }}
        onCityList={() => {
          setActiveTab("cities");
          setCityListOpen(true);
        }}
        categoryFilter={categoryFilter}
        onSelectCategory={setCategoryFilter}
        categories={CATEGORIES}
      />

      {/* 3. Floating Map Controls & Docked 3-Stat Banner */}
      <StatsDock
        stats={stats.data}
        summary={summary.data}
        onCityList={() => {
          setActiveTab("cities");
          setCityListOpen(true);
        }}
        onRecenter={() => {
          if (geo.pos) setFlyTo({ lat: geo.pos.lat, lng: geo.pos.lng, zoom: 15.5 });
          else gpsHint();
        }}
        onNearbyList={() => {
          setActiveTab("explore");
          setNearbyOpen(true);
        }}
        onAlignNorth={() => {
          if (geo.pos) {
            setFlyTo({ lat: geo.pos.lat, lng: geo.pos.lng, bearing: 0, pitch: 0 });
          } else {
            setFlyTo({ lat: mapCenter.lat, lng: mapCenter.lng, bearing: 0, pitch: 0 });
          }
        }}
      />

      {/* 4. Persistent 5-Tab Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          if (tab === "map") {
            setSelected(null);
            setNearbyOpen(false);
            setCityListOpen(false);
            setProfileOpen(false);
            setCreating(false);
            if (geo.pos) setFlyTo({ lat: geo.pos.lat, lng: geo.pos.lng, zoom: 15.5 });
          } else if (tab === "explore") {
            setNearbyOpen(true);
          } else if (tab === "create") {
            if (geo.pos) setCreating(true);
            else gpsHint();
          } else if (tab === "cities") {
            setCityListOpen(true);
          } else if (tab === "profile") {
            setProfileOpen(true);
          }
        }}
      />

      {/* GPS status pill */}
      {tracking && geo.status !== "live" && (
        <div className="glass absolute left-3 top-[108px] z-20 max-w-[75%] rounded-2xl px-3.5 py-2 border border-emerald-950/70 shadow-lg">
          <span className="hud-label text-stone-300 leading-relaxed text-[10px]">
            {geo.status === "denied"
              ? "Location blocked — allow it from the address bar, then reload"
              : geo.status === "error"
                ? "Acquiring GPS fix — step outdoors for best accuracy"
                : "Locating explorer on expedition grid…"}
          </span>
        </div>
      )}

      {/* Onboarding Dialog */}
      {showOnboarding && (
        <Onboarding
          onDone={() => {
            localStorage.setItem(ONBOARD_KEY, "1");
            setOnboarded(true);
            geo.start();
          }}
        />
      )}

      {/* Discovery Detail Sheet */}
      {selectedWithDist && (
        <DiscoverySheet
          discovery={selectedWithDist}
          onClose={() => setSelected(null)}
          getFix={getFix}
          visitRadiusM={gameConfig.data?.visit_radius_m ?? 150}
        />
      )}

      {/* Nearby Discoveries Sheet */}
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
            emitFx({ kind: "toast", text: "Flying to Lucknow expedition center" });
          }}
        />
      )}

      {/* World Cities Sheet */}
      {cityListOpen && (
        <CityListSheet
          summary={summary.data}
          onClose={() => setCityListOpen(false)}
          onFly={(lat, lng, zoom) => {
            setCityListOpen(false);
            setFlyTo({ lat, lng, zoom });
          }}
        />
      )}

      {/* Create Discovery Sheet */}
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

      {/* Profile Sheet */}
      {profileOpen && <ProfileSheet user={user} onClose={() => setProfileOpen(false)} />}

      {/* Visual FX Toasts & XP Popups */}
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
