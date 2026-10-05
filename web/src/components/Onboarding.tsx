import { useEffect, useMemo, useState } from "react";
import { Compass, Footprints, Gem } from "lucide-react";

/** Three beats, then hand over to the map and ask for location. */
export default function Onboarding({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [lit, setLit] = useState<number[]>([]);

  const cells = useMemo(() => Array.from({ length: 36 }, (_, i) => i), []);

  useEffect(() => {
    if (step !== 1) return;
    const timers: number[] = [];
    const order = [7, 8, 14, 15, 21, 20, 26, 27, 28, 22, 16, 10, 9, 15 + 12, 29, 34, 35, 33, 32];
    order.forEach((idx, i) => {
      timers.push(
        window.setTimeout(() => setLit((l) => (l.includes(idx) ? l : [...l, idx])), 260 * i),
      );
    });
    return () => timers.forEach(clearTimeout);
  }, [step]);

  const steps = [
    {
      icon: <Compass size={26} className="text-brand" />,
      title: "THE WORLD IS DARK",
      body: (
        <div className="hex-grid mx-auto mt-6">
          {cells.map((c) => (
            <div key={c} className="hex border border-white/10" />
          ))}
        </div>
      ),
      hint: "Every street, park and hidden corner — locked.",
    },
    {
      icon: <Footprints size={26} className="text-brand" />,
      title: "WALK TO REVEAL IT",
      body: (
        <div className="hex-grid mx-auto mt-6">
          {cells.map((c) => (
            <div key={c} className={`hex ${lit.includes(c) ? "on" : "border border-white/10"}`} />
          ))}
        </div>
      ),
      hint: "Physically move and the map lights up around you.",
    },
    {
      icon: <Gem size={26} className="text-brand" />,
      title: "FIND WHAT OTHERS MISS",
      body: (
        <div className="glass mx-auto mt-6 max-w-[260px] rounded-2xl p-4 text-left">
          <div className="hud-label">Hidden gem · Viewpoint</div>
          <div className="mt-1 font-display text-[16px] font-bold">Bhool Bhulaiyaa Rooftop</div>
          <div className="mt-2 flex items-center gap-2 text-[12px] text-mute">
            <span className="text-gold">★ 92% worth visiting</span>
            <span>· 1,240 explorers</span>
          </div>
        </div>
      ),
      hint: "Collect discoveries. Recommend the ones that matter.",
    },
  ];

  const s = steps[step];

  return (
    <div data-onboarding className="fade-in absolute inset-0 z-40 flex flex-col items-center justify-between bg-[#06080d]/97 px-6 py-12 backdrop-blur">
      <div />
      <div className="flex flex-col items-center text-center">
        <div className="mb-6 grid h-14 w-14 place-items-center rounded-2xl border border-brand/40 bg-brand/10">
          {s.icon}
        </div>
        <h2 className="font-display text-[26px] font-bold tracking-tight">{s.title}</h2>
        {s.body}
        <p className="mt-6 max-w-[280px] text-[13.5px] leading-relaxed text-mute">{s.hint}</p>
      </div>
      <div className="w-full max-w-sm">
        <div className="mb-4 flex justify-center gap-1.5">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1 w-6 rounded-full transition ${i === step ? "bg-brand" : "bg-white/15"}`}
            />
          ))}
        </div>
        <button
          onClick={() => (step < steps.length - 1 ? setStep(step + 1) : onDone())}
          className="btn-brand w-full py-3.5 text-[14px]"
        >
          {step < steps.length - 1 ? "Next" : "Start exploring"}
        </button>
      </div>
    </div>
  );
}
