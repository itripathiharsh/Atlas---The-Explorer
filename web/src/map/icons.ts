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

/** Kite-pin with glowing core, in the explorer accent. */
function drawPin(ctx: CanvasRenderingContext2D, s: number, core: string, glow: string) {
  const cx = s / 2;
  const cy = s / 2;
  const r = s * 0.34;

  ctx.shadowColor = glow;
  ctx.shadowBlur = s * 0.22;

  // kite shape
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.lineTo(cx + r * 0.62, cy);
  ctx.lineTo(cx, cy + r);
  ctx.lineTo(cx - r * 0.62, cy);
  ctx.closePath();
  ctx.fillStyle = "rgba(8, 12, 18, 0.95)";
  ctx.fill();
  ctx.lineWidth = s * 0.055;
  ctx.strokeStyle = glow;
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.24, 0, Math.PI * 2);
  ctx.fillStyle = core;
  ctx.fill();
}

export function registerSprites(map: maplibregl.Map) {
  if (!map.hasImage("pin-brand")) {
    map.addImage("pin-brand", makeSprite((c, s) => drawPin(c, s, "#f2ecd9", "#f2ecd9"), 44));
  }
  if (!map.hasImage("pin-gold")) {
    map.addImage("pin-gold", makeSprite((c, s) => drawPin(c, s, "#FFC24B", "#FFC24B"), 48));
  }
}
