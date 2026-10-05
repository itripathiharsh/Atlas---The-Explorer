/**
 * Basemap strategy (PLAN.md D8): zero-cost dark basemap = the fog.
 * 1. MapTiler (if VITE_MAPTILER_KEY is set) — vector dark style.
 * 2. OpenFreeMap "dark" style — free, keyless vector tiles.
 * Explored hexes are drawn on top as the reveal layer.
 */

export function basemapStyle(key: string | undefined): string {
  if (key) return `https://api.maptiler.com/maps/night/style.json?key=${key}`;
  return "https://tiles.openfreemap.org/styles/dark";
}
