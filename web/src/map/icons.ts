/** Canvas-drawn map sprites — no image assets needed. */

function makeSprite(draw: (ctx: CanvasRenderingContext2D, s: number) => void, size: number) {
  const dpr = 2;
  const canvas = document.createElement("canvas");
  canvas.width = size * dpr;
  canvas.height = size * dpr;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(dpr, dpr);
  draw(ctx, size);
  const img = ctx.getImageData(0, 0, size * dpr, size * dpr);
  return { width: size * dpr, height: size * dpr, data: img.data };
}

/** Kite-pin: soft drop shadow, gradient body, glowing core. */
function drawPin(
  ctx: CanvasRenderingContext2D,
  s: number,
  core: string,
  glow: string,
  selected = false,
) {
  const cx = s / 2;
  const cy = s / 2;
  const r = s * (selected ? 0.4 : 0.34);

  // soft shadow
  ctx.shadowColor = "rgba(0,0,0,0.55)";
  ctx.shadowBlur = s * 0.14;
  ctx.shadowOffsetY = s * 0.05;

  // kite body with vertical gradient
  const grad = ctx.createLinearGradient(0, cy - r, 0, cy + r);
  grad.addColorStop(0, "rgba(28, 42, 60, 0.98)");
  grad.addColorStop(1, "rgba(10, 20, 32, 0.98)");
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.lineTo(cx + r * 0.62, cy);
  ctx.lineTo(cx, cy + r);
  ctx.lineTo(cx - r * 0.62, cy);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.shadowColor = "transparent";

  // rim
  ctx.lineWidth = s * (selected ? 0.075 : 0.055);
  ctx.strokeStyle = glow;
  ctx.stroke();

  if (selected) {
    // selection halo
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.28, 0, Math.PI * 2);
    ctx.lineWidth = s * 0.035;
    ctx.strokeStyle = glow;
    ctx.globalAlpha = 0.5;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // glowing core
  ctx.shadowColor = glow;
  ctx.shadowBlur = s * 0.18;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.24, 0, Math.PI * 2);
  ctx.fillStyle = core;
  ctx.fill();
  ctx.shadowBlur = 0;
}

const IVORY = "#f2ecd9";

export function registerSprites(map: maplibregl.Map) {
  if (!map.hasImage("pin-brand")) {
    map.addImage("pin-brand", makeSprite((c, s) => drawPin(c, s, IVORY, IVORY), 44));
  }
  if (!map.hasImage("pin-gold")) {
    map.addImage("pin-gold", makeSprite((c, s) => drawPin(c, s, "#FFC24B", "#FFC24B"), 48));
  }
  if (!map.hasImage("pin-active")) {
    map.addImage("pin-active", makeSprite((c, s) => drawPin(c, s, "#FFC24B", IVORY, true), 56));
  }
}
