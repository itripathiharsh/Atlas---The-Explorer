import { useEffect, useState } from "react";
import { onFx } from "../state/fx";
import type { Fx } from "../state/fx";
import { Award, TriangleAlert, Zap } from "lucide-react";

type Item = Fx & { id: number };

let nextId = 1;

/** Floating game feedback: +XP chips, achievement banners, toasts, level-ups. */
export default function XPFX() {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(
    () =>
      onFx((fx) => {
        const item = { ...fx, id: nextId++ };
        setItems((cur) => [...cur.slice(-4), item]);
        const ttl = fx.kind === "achievement" || fx.kind === "level" ? 4200 : 1700;
        window.setTimeout(() => {
          setItems((cur) => cur.filter((i) => i.id !== item.id));
        }, ttl);
      }),
    [],
  );

  return (
    <div className="pointer-events-none absolute inset-x-0 top-20 z-50 flex flex-col items-center gap-2">
      {items.map((item) => {
        if (item.kind === "xp")
          return (
            <div
              key={item.id}
              className="fx-xp font-display text-[26px] font-bold text-lime drop-shadow-[0_0_18px_rgba(200,241,53,0.65)]"
            >
              <span className="inline-flex items-center gap-1.5">
                <Zap size={20} strokeWidth={2.6} /> +{item.amount} XP
              </span>
            </div>
            );
        if (item.kind === "achievement")
          return (
            <div key={item.id} className="toast glass flex items-center gap-3 rounded-2xl px-5 py-3.5">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-gold/15">
                <Award size={20} className="text-gold" />
              </div>
              <div>
                <div className="hud-label text-gold">Achievement unlocked</div>
                <div className="font-display text-[15px] font-bold">{item.name}</div>
                <div className="text-[12px] text-mute">{item.description}</div>
              </div>
            </div>
          );
        if (item.kind === "level")
          return (
            <div
              key={item.id}
              className="toast glass rounded-2xl px-6 py-4 text-center"
              style={{ borderColor: "rgba(200,241,53,.5)" }}
            >
              <div className="hud-label text-lime">Level up</div>
              <div className="font-display text-[24px] font-bold">Level {item.level}</div>
            </div>
          );
        return (
          <div key={item.id} className="toast glass flex items-center gap-2 rounded-full px-4 py-2.5">
            {item.tone === "bad" && <TriangleAlert size={14} className="text-danger" />}
            <span className="text-[13px]">{item.text}</span>
          </div>
        );
      })}
    </div>
  );
}
