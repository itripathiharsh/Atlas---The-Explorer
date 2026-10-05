import { useCallback, useEffect, useRef, useState } from "react";

export interface Fix {
  lat: number;
  lng: number;
  accuracy: number;
  ts: number;
}

export type GeoStatus = "idle" | "locating" | "live" | "denied" | "error";

const ACCURACY_LIMIT = 10_000;

/**
 * Location acquisition that refuses to stall:
 *  - a continuous watchPosition (ideal, gives the live stream)
 *  - plus a getCurrentPosition retry every 8 s (often succeeds on desktops
 *    where the watch never delivers a first fix)
 * Status becomes "denied" only on an explicit permission denial and "error"
 * after several failed attempts with no fix — "locating" otherwise.
 */
export function useGeolocation(onFix: (f: Fix) => void, enabled: boolean) {
  const [status, setStatus] = useState<GeoStatus>("idle");
  const [pos, setPos] = useState<Fix | null>(null);
  const cbRef = useRef(onFix);
  cbRef.current = onFix;
  const watchId = useRef<number | null>(null);
  const retryId = useRef<number | null>(null);
  const misses = useRef(0);

  const handle = useCallback((p: GeolocationPosition) => {
    misses.current = 0;
    const fix: Fix = {
      lat: p.coords.latitude,
      lng: p.coords.longitude,
      accuracy: p.coords.accuracy,
      ts: p.timestamp,
    };
    if (fix.accuracy <= ACCURACY_LIMIT) {
      setPos(fix);
      setStatus("live");
      cbRef.current(fix);
    }
  }, []);

  const fail = useCallback((err: GeolocationPositionError) => {
    if (err.code === err.PERMISSION_DENIED) {
      setStatus("denied");
      return;
    }
    misses.current += 1;
    setStatus((s) => (s === "live" ? s : misses.current >= 3 ? "error" : s));
  }, []);

  const start = useCallback(() => {
    if (watchId.current !== null || retryId.current !== null) return;
    if (!("geolocation" in navigator)) {
      setStatus("error");
      return;
    }
    setStatus("locating");

    const once = () =>
      navigator.geolocation.getCurrentPosition(
        handle,
        fail,
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 15000 },
      );
    once();
    retryId.current = window.setInterval(once, 8000);

    watchId.current = navigator.geolocation.watchPosition(
      handle,
      fail,
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 5000 },
    );
  }, [handle, fail]);

  useEffect(() => {
    if (enabled) start();
    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
      if (retryId.current !== null) {
        window.clearInterval(retryId.current);
        retryId.current = null;
      }
    };
  }, [enabled, start]);

  return { status, pos, start };
}
