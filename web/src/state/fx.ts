/** Tiny event bus for game feedback (XP chips, toasts, banners). */

export type Fx =
  | { kind: "xp"; amount: number }
  | { kind: "achievement"; name: string; description: string }
  | { kind: "level"; level: number }
  | { kind: "toast"; text: string; tone?: "good" | "bad" };

type Listener = (fx: Fx) => void;
const listeners = new Set<Listener>();

export function emitFx(fx: Fx) {
  listeners.forEach((l) => l(fx));
}

export function onFx(l: Listener): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}
