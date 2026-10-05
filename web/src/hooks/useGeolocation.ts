import { useCallback, useEffect, useRef, useState } from "react";

export interface Fix {
  lat: number;
  lng: number;
  accuracy: number;
  ts: number;
}

export type GeoStatus = "idle" | "locating" | "live" | "denied" | "error";

/**
 * Wraps watchPosition. Calls `onFix` for every fresh fix while `enabled`.
 * Filters out anything wildly inaccurate (> 200 m) — the server enforces the
 * real thresholds, the client just avoids wasting battery and pings.
 */
export function useGeolocation(onFix: (f: Fix) => void, enabled: boolean) {
  const [status, setStatus] = useState<GeoStatus>("idle");
  const [pos, setPos] = useState<Fix | null>(null);
  const cbRef = useRef(onFix);
  cbRef.current = onFix;
  const watchId = useRef<number | null>(null);

  const start = useCallback(() => {
    if (watchId.current !== null) return;
    if (!("geolocation" in navigator)) {
      setStatus("error");
      return;
    }
    setStatus("locating");
    watchId.current = navigator.geolocation.watchPosition(
      (p) => {
        const fix: Fix = {
          lat: p.coords.latitude,
          lng: p.coords.longitude,
          accuracy: p.coords.accuracy,
          ts: p.timestamp,
        };
        if (fix.accuracy <= 200) {
          setPos(fix);
          setStatus("live");
          cbRef.current(fix);
        }
      },
      (err) => {
        setStatus(err.code === err.PERMISSION_DENIED ? "denied" : "error");
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 },
    );
  }, []);

  useEffect(() => {
    if (enabled) start();
    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
    };
  }, [enabled, start]);

  return { status, pos, start };
}
