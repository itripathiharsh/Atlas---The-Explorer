import { useEffect, useRef, useState } from "react";
import maplibregl, { Map as MlMap, GeoJSONSource } from "maplibre-gl";
import type { Discovery, GeoFC, UnlockedCell } from "../api/types";
import type { Fix } from "../hooks/useGeolocation";
import { basemapStyle } from "./style";
import { registerSprites } from "./icons";

const EMPTY_FC: GeoJSON.FeatureCollection<GeoJSON.Geometry> = { type: "FeatureCollection", features: [] };

interface Props {
  explored: GeoFC | null;
  pulse: UnlockedCell[];
  discoveries: Discovery[];
  userPos: Fix | null;
  onSelectDiscovery: (d: Discovery) => void;
  flyTo: { lat: number; lng: number; zoom?: number } | null;
}

export default function MapCanvas({ explored, pulse, discoveries, userPos, onSelectDiscovery, flyTo }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [ready, setReady] = useState(false);
  const selectRef = useRef(onSelectDiscovery);
  selectRef.current = onSelectDiscovery;
  const meMarker = useRef<maplibregl.Marker | null>(null);

  // --- create map once ---
  useEffect(() => {
    if (!container.current || mapRef.current) return;
    const map = new MlMap({
      container: container.current,
      style: basemapStyle(import.meta.env.VITE_MAPTILER_KEY),
      center: [80.9462, 26.8467], // Lucknow until the first GPS fix arrives
      zoom: 12.5,
      attributionControl: { compact: true },
      dragRotate: false,
      pitchWithRotate: false,
      preserveDrawingBuffer: true, // headless screenshots / future canvas exports
    });
    mapRef.current = map;
    // dev/testing hook — screenshot scripts drive the map through this
    (window as unknown as { __map?: MlMap }).__map = map;
    map.on("load", () => {
      registerSprites(map);

      map.addSource("explored", { type: "geojson", data: EMPTY_FC });
      map.addLayer({
        id: "explored-fill",
        type: "fill",
        source: "explored",
        paint: {
          "fill-color": "#b8e83c",
          "fill-opacity": ["interpolate", ["linear"], ["zoom"], 10, 0.34, 16, 0.24],
        },
      });
      map.addLayer({
        id: "explored-line",
        type: "line",
        source: "explored",
        paint: {
          "line-color": "#e4ff8a",
          "line-width": ["interpolate", ["linear"], ["zoom"], 10, 1, 16, 1.8],
          "line-opacity": 0.9,
        },
      });

      map.addSource("pulse", { type: "geojson", data: EMPTY_FC });
      map.addLayer({
        id: "pulse-fill",
        type: "fill",
        source: "pulse",
        paint: { "fill-color": "#eaff9e", "fill-opacity": 0 },
      });

      map.addSource("discoveries", { type: "geojson", data: EMPTY_FC });
      map.addLayer({
        id: "disc-layer",
        type: "symbol",
        source: "discoveries",
        layout: {
          "icon-image": ["case", ["==", ["get", "rec"], true], "pin-gold", "pin-lime"],
          "icon-size": ["interpolate", ["linear"], ["zoom"], 11, 0.42, 15, 0.62, 18, 0.8],
          "icon-allow-overlap": true,
          "icon-ignore-placement": true,
        },
      });

      map.on("click", "disc-layer", (e) => {
        const f = e.features?.[0];
        if (!f) return;
        const id = f.properties?.id as number;
        const disc = discoveriesRef.current.find((d) => d.id === id);
        if (disc) selectRef.current(disc);
      });
      map.on("mouseenter", "disc-layer", () => (map.getCanvas().style.cursor = "pointer"));
      map.on("mouseleave", "disc-layer", () => (map.getCanvas().style.cursor = ""));

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

  const discoveriesRef = useRef(discoveries);
  discoveriesRef.current = discoveries;

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
      const opacity = t < 0.25 ? t / 0.25 * 0.9 : 0.9 * (1 - (t - 0.25) / 0.75);
      map.setPaintProperty("pulse-fill", "fill-opacity", opacity);
      if (t < 1) raf = requestAnimationFrame(tick);
      else (map.getSource("pulse") as GeoJSONSource).setData(EMPTY_FC);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [pulse, loaded]);

  // --- discovery markers ---
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded) return;
    const fc = {
      type: "FeatureCollection" as const,
      features: discoveries.map((d) => ({
        type: "Feature" as const,
        geometry: { type: "Point" as const, coordinates: [d.lng, d.lat] },
        properties: { id: d.id, rec: d.recommendation_count > 0 },
      })),
    };
    (map.getSource("discoveries") as GeoJSONSource).setData(fc);
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
      map.easeTo({ center: [userPos.lng, userPos.lat], zoom: 15.2, duration: 1400 });
    } else {
      meMarker.current.setLngLat([userPos.lng, userPos.lat]);
    }
  }, [userPos, loaded]);

  // --- external fly ---
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded || !flyTo) return;
    map.easeTo({ center: [flyTo.lng, flyTo.lat], zoom: flyTo.zoom ?? 15.5, duration: 900 });
  }, [flyTo, loaded]);

  return (
    <div className="absolute inset-0">
      {/* inline positioning beats maplibre-gl.css's unlayered .maplibregl-map{position:relative} */}
      <div ref={container} style={{ position: "absolute", inset: 0 }} />
      <div className="vignette" />
      {!ready && (
        <div className="absolute inset-0 grid place-items-center bg-[#06080d]">
          <div className="hud-label animate-pulse">Mapping the world…</div>
        </div>
      )}
    </div>
  );
}
