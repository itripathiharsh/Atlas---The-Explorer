import { useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import type { Fix } from "./useGeolocation";
import type { PingResponse, UnlockedCell } from "../api/types";
import { emitFx } from "../state/fx";

const PING_EVERY_MS = 4000;
const MAX_BATCH = 20;

/**
 * Buffers GPS fixes and flushes them to /exploration/ping at most every 4 s.
 * Fires game feedback (XP, achievements, level-ups) and returns unlocked cells
 * to the caller for map animation.
 */
export function useExploration(enabled: boolean, onUnlocked: (cells: UnlockedCell[]) => void) {
  const buffer = useRef<Fix[]>([]);
  const lastPing = useRef(0);
  const inFlight = useRef(false);
  const queryClient = useQueryClient();
  const cbRef = useRef(onUnlocked);
  cbRef.current = onUnlocked;

  const flush = useCallback(async () => {
    if (inFlight.current || buffer.current.length === 0) return;
    const fixes = buffer.current.slice(-MAX_BATCH);
    buffer.current = [];
    inFlight.current = true;
    lastPing.current = Date.now();
    try {
      const res = await api<PingResponse>("/exploration/ping", {
        method: "POST",
        body: {
          fixes: fixes.map((f) => ({
            lat: f.lat,
            lng: f.lng,
            accuracy_m: f.accuracy,
            recorded_at: new Date(f.ts).toISOString(),
          })),
        },
      });
      if (res.unlocked.length > 0) {
        cbRef.current(res.unlocked);
        queryClient.invalidateQueries({ queryKey: ["stats"] });
        queryClient.invalidateQueries({ queryKey: ["summary"] });
        emitFx({ kind: "xp", amount: res.xp_awarded });
      }
      for (const a of res.new_achievements) {
        emitFx({ kind: "achievement", name: a.name, description: a.description });
      }
      if (res.level_up) emitFx({ kind: "level", level: res.level });
      if (res.rejected.some((r) => r.reasons.includes("accuracy"))) {
        emitFx({ kind: "toast", text: "Weak GPS signal — move somewhere open", tone: "bad" });
      }
    } catch {
      // network hiccup — fixes are lost, the next batch will catch up
    } finally {
      inFlight.current = false;
    }
  }, [queryClient]);

  const push = useCallback(
    (fix: Fix) => {
      if (!enabled) return;
      buffer.current.push(fix);
      if (Date.now() - lastPing.current >= PING_EVERY_MS) void flush();
    },
    [enabled, flush],
  );

  return { push };
}
