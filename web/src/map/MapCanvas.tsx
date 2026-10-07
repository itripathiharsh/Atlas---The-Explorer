import { useEffect, useRef, useState } from "react";
import maplibregl, { Map as MlMap, GeoJSONSource } from "maplibre-gl";
import type { GeoFC, UnlockedCell, WorldPin } from "../api/types";
import type { Fix } from "../hooks/useGeolocation";
import { basemapStyle } from "./style";
import { registerSprites } from "./icons";
import { emitFx } from "../state/fx";

const EMPTY_FC: GeoJSON.FeatureCollection<GeoJSON.Geometry> = { type: "FeatureCollection", features: [] };

interface Props {
  explored: GeoFC | null;
  pulse: UnlockedCell[];
  discoveries: WorldPin[];
  userPos: Fix | null;
  onSelectDiscovery: (id: number) => void;
  flyTo: { lat: number; lng: number; zoom?: number; bearing?: number; pitch?: number } | null;
  onMove?: (center: { lat: number; lng: number }) => void;
  categoryFilter: string | null;
  selectedId: number | null;
}

export default function MapCanvas({
  explored,
  pulse,
  discoveries,
  userPos,
  onSelectDiscovery,
  flyTo,
  onMove,
  categoryFilter,
  selectedId,
}: Props) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [ready, setReady] = useState(false);
  const selectRef = useRef(onSelectDiscovery);
  selectRef.current = onSelectDiscovery;
  const onMoveRef = useRef(onMove);
  onMoveRef.current = onMove;
  const meMarker = useRef<maplibregl.Marker | null>(null);

  // --- create map once ---
  useEffect(() => {
    if (!container.current || mapRef.current) return;
    let initCenter: [number, number] = [80.9462, 26.8467];
    let initZoom = 13.5;
    try {
      const saved = localStorage.getItem("wg_last_pos");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.lat === "number" && typeof parsed.lng === "number") {
          initCenter = [parsed.lng, parsed.lat];
        }
      }
    } catch {
      // ignore
    }

    const map = new MlMap({
      container: container.current,
      style: basemapStyle(import.meta.env.VITE_MAPTILER_KEY),
      center: initCenter,
      zoom: initZoom,
      attributionControl: { compact: true },
      dragRotate: false,
      pitchWithRotate: false,
      preserveDrawingBuffer: true,
    });
    mapRef.current = map;

    // Fast city resolution if no previous position stored
    if (!localStorage.getItem("wg_last_pos")) {
      fetch("https://ipwho.is/")
        .then((r) => r.json())
        .then((data) => {
          if (data && data.latitude && data.longitude && mapRef.current) {
            mapRef.current.easeTo({
              center: [data.longitude, data.latitude],
              zoom: 13.5,
              duration: 900,
            });
          }
        })
        .catch(() => {});
    }
    // dev/testing hook — screenshot scripts drive the map through this
    (window as unknown as { __map?: MlMap }).__map = map;

    // report the viewport center (throttled to one update per frame)
    let rafPending = false;
    map.on("move", () => {
      if (rafPending) return;
      rafPending = true;
      requestAnimationFrame(() => {
        rafPending = false;
        const c = map.getCenter();
        onMoveRef.current?.({ lat: c.lat, lng: c.lng });
      });
    });

    map.on("load", () => {
      registerSprites(map);

      // explored hexes
      map.addSource("explored", { type: "geojson", data: EMPTY_FC });
      map.addLayer({
        id: "explored-fill",
        type: "fill",
        source: "explored",
        paint: {
          "fill-color": "#f2ecd9",
          "fill-opacity": ["interpolate", ["linear"], ["zoom"], 10, 0.34, 16, 0.24],
        },
      });
      map.addLayer({
        id: "explored-glow",
        type: "line",
        source: "explored",
        paint: {
          "line-color": "#f2ecd9",
          "line-width": ["interpolate", ["linear"], ["zoom"], 10, 6, 16, 14],
          "line-opacity": 0.16,
        },
      });
      map.addLayer({
        id: "explored-line",
        type: "line",
        source: "explored",
        paint: {
          "line-color": "#fdfaf0",
          "line-width": ["interpolate", ["linear"], ["zoom"], 10, 1, 16, 1.8],
          "line-opacity": 0.9,
        },
      });

      // unlock pulse flash
      map.addSource("pulse", { type: "geojson", data: EMPTY_FC });
      map.addLayer({
        id: "pulse-fill",
        type: "fill",
        source: "pulse",
        paint: { "fill-color": "#ffffff", "fill-opacity": 0 },
      });

      // discovery pins — clustered at low zoom, kite pins + name labels up close
      map.addSource("discoveries", {
        type: "geojson",
        data: EMPTY_FC,
        cluster: true,
        clusterMaxZoom: 12,
        clusterRadius: 45,
      });
      map.addLayer({
        id: "cluster-halo",
        type: "circle",
        source: "discoveries",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": "#f2ecd9",
          "circle-opacity": 0.1,
          "circle-radius": ["step", ["get", "point_count"], 24, 10, 32, 40, 42],
        },
      });
      map.addLayer({
        id: "clusters",
        type: "circle",
        source: "discoveries",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": "#0a1a2b",
          "circle-opacity": 0.85,
          "circle-stroke-color": "#f2ecd9",
          "circle-stroke-width": 1.4,
          "circle-radius": ["step", ["get", "point_count"], 14, 10, 19, 40, 25],
        },
      });
      map.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "discoveries",
        filter: ["has", "point_count"],
        layout: {
          "text-field": ["get", "point_count_abbreviated"],
          "text-font": ["Noto Sans Bold"],
          "text-size": 12,
        },
        paint: { "text-color": "#f2ecd9" },
      });
      map.addLayer({
        id: "disc-layer",
        type: "symbol",
        source: "discoveries",
        filter: ["!", ["has", "point_count"]],
        layout: {
          "icon-image": ["case", ["==", ["get", "rec"], true], "pin-gold", "pin-brand"],
          "icon-size": ["interpolate", ["linear"], ["zoom"], 11, 0.42, 15, 0.62, 18, 0.8],
          "icon-allow-overlap": true,
          "icon-ignore-placement": true,
        },
      });
      map.addLayer({
        id: "disc-active",
        type: "symbol",
        source: "discoveries",
        filter: ["!", ["has", "point_count"]],
        layout: {
          "icon-image": "pin-active",
          "icon-size": ["interpolate", ["linear"], ["zoom"], 11, 0.42, 15, 0.62, 18, 0.8],
          "icon-allow-overlap": true,
          "icon-ignore-placement": true,
        },
      });
      map.addLayer({
        id: "disc-label",
        type: "symbol",
        source: "discoveries",
        filter: ["!", ["has", "point_count"]],
        minzoom: 13,
        layout: {
          "text-field": ["get", "name"],
          "text-font": ["Noto Sans Bold"],
          "text-size": 11,
          "text-offset": [0, 1.5],
          "text-anchor": "top",
        },
        paint: {
          "text-color": "#f5f2e9",
          "text-halo-color": "#061623",
          "text-halo-width": 1.6,
        },
      });

      map.on("click", "disc-layer", (e) => {
        const f = e.features?.[0];
        if (!f) return;
        selectRef.current(f.properties?.id as number);
      });
      for (const layer of ["disc-layer", "disc-label", "clusters"]) {
        map.on("mouseenter", layer, () => (map.getCanvas().style.cursor = "pointer"));
        map.on("mouseleave", layer, () => (map.getCanvas().style.cursor = ""));
      }
      map.on("click", "clusters", (e) => {
        const f = e.features?.[0];
        if (!f) return;
        const c = f.geometry as GeoJSON.Point;
        map.easeTo({ center: c.coordinates as [number, number], zoom: (map.getZoom() ?? 3) + 2.5 });
      });

      // tapping a revealed hex (not a pin) shows when it was unlocked
      map.on("click", (e) => {
        const pinHit = map.queryRenderedFeatures(e.point, { layers: ["disc-layer", "clusters"] });
        if (pinHit.length > 0) return;
        const hexHit = map.queryRenderedFeatures(e.point, { layers: ["explored-fill"] });
        if (hexHit.length > 0) {
          const at = hexHit[0].properties?.explored_at;
          const day = at ? new Date(String(at)).toLocaleDateString() : "your journey";
          emitFx({ kind: "toast", text: `Unlocked ${day}` });
        }
      });

      setLoaded(true);
    });
    map.once("idle", () => setReady(true));
    return () => {
      map.remove();
      mapRef.current = null;
      meMarker.current?.remove();
      meMarker.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- explored cells ---
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded || !explored) return;
    (map.getSource("explored") as GeoJSONSource).setData(explored);
  }, [explored, loaded]);

  // --- unlock pulse animation ---
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded || pulse.length === 0) return;
    const fc = {
      type: "FeatureCollection" as const,
      features: pulse.map((c) => ({
        type: "Feature" as const,
        geometry: { type: "Polygon" as const, coordinates: [c.boundary] },
        properties: {},
      })),
    };
    (map.getSource("pulse") as GeoJSONSource).setData(fc);
    const start = performance.now();
    const dur = 1200;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const opacity = t < 0.25 ? (t / 0.25) * 0.9 : 0.9 * (1 - (t - 0.25) / 0.75);
      map.setPaintProperty("pulse-fill", "fill-opacity", opacity);
      if (t < 1) raf = requestAnimationFrame(tick);
      else (map.getSource("pulse") as GeoJSONSource).setData(EMPTY_FC);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [pulse, loaded]);

  // --- discovery markers (with the active category filter) ---
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded) return;
    const fc = {
      type: "FeatureCollection" as const,
      features: discoveries.map((d) => ({
        type: "Feature" as const,
        geometry: { type: "Point" as const, coordinates: [d.lng, d.lat] },
        properties: { id: d.id, name: d.name, cat: d.category, rec: d.recommendation_count > 0 },
      })),
    };
    (map.getSource("discoveries") as GeoJSONSource).setData(fc);
    const catExpr = (categoryFilter
      ? ["==", ["get", "cat"], categoryFilter]
      : ["!", ["has", "point_count"]]) as unknown as maplibregl.FilterSpecification;
    map.setFilter("disc-layer", catExpr);
    map.setFilter("disc-label", catExpr);
    map.setFilter("disc-active", [
      "all",
      ["!", ["has", "point_count"]],
      ["==", ["get", "id"], selectedId ?? -1],
    ]);
  }, [discoveries, loaded, categoryFilter, selectedId]);

  // selected pin swaps to the active sprite
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded) return;
    map.setFilter("disc-active", [
      "all",
      ["!", ["has", "point_count"]],
      ["==", ["get", "id"], selectedId ?? -1],
    ]);
  }, [selectedId, loaded]);

  // pins fade in on their first arrival
  const pinsShown = useRef(false);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded || pinsShown.current || discoveries.length === 0) return;
    pinsShown.current = true;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.max(0, Math.min(1, (now - start) / 450));
      map.setPaintProperty("disc-layer", "icon-opacity", t);
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [discoveries, loaded]);

  // --- user marker ---
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded || !userPos) return;
    if (!meMarker.current) {
      const el = document.createElement("div");
      el.className = "me-marker";
      meMarker.current = new maplibregl.Marker({ element: el })
        .setLngLat([userPos.lng, userPos.lat])
        .addTo(map);
      map.easeTo({ center: [userPos.lng, userPos.lat], zoom: 13.5, duration: 1200 });
      try {
        localStorage.setItem("wg_last_pos", JSON.stringify({ lat: userPos.lat, lng: userPos.lng }));
      } catch {
        // ignore
      }
    } else {
      meMarker.current.setLngLat([userPos.lng, userPos.lat]);
      try {
        localStorage.setItem("wg_last_pos", JSON.stringify({ lat: userPos.lat, lng: userPos.lng }));
      } catch {
        // ignore
      }
    }
  }, [userPos, loaded]);

  // --- external fly ---
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded || !flyTo) return;
    map.easeTo({
      center: [flyTo.lng, flyTo.lat],
      zoom: flyTo.zoom ?? 15.5,
      bearing: flyTo.bearing ?? 0,
      pitch: flyTo.pitch ?? 0,
      duration: 900,
    });
  }, [flyTo, loaded]);

  return (
    <div className="absolute inset-0">
      <div ref={container} style={{ position: "absolute", inset: 0 }} />
      <div className="vignette" />
      {!ready && (
        <div className="splash absolute inset-0 z-50 grid place-items-center bg-[#061623]">
          <div className="flex flex-col items-center gap-5">
            <img src="/icons/icon-192.png" alt="" className="h-20 w-20 rounded-3xl splash-pulse" />
            <div className="hud-label animate-pulse">Charting the world</div>
          </div>
        </div>
      )}
    </div>
  );
}
