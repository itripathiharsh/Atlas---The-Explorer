/**
 * Visual QA: drives the app in headless Edge with a simulated GPS walk
 * and saves screenshots to data/shots/. Uses system Edge — nothing on C:.
 *
 * Run:  node scripts/shot.mjs [baseURL]
 * Requires backend (:8000) + vite dev server (:5173) running.
 */
import puppeteer from "puppeteer-core";
import { mkdirSync, existsSync } from "node:fs";

const BASE = process.argv[2] ?? "https://localhost:5173";
const OUT = "../data/shots";
mkdirSync(OUT, { recursive: true });

const EDGE = [
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
].find((p) => existsSync(p));

if (!EDGE) throw new Error("Edge not found");

const browser = await puppeteer.launch({
  executablePath: EDGE,
  headless: true,
  acceptInsecureCerts: true,
  args: ["--window-size=430,920", "--use-fake-ui-for-media-stream"],
});

const page = await browser.newPage();
await page.setViewport({ width: 412, height: 880, deviceScaleFactor: 2 });
const origin = new URL(BASE).origin;
await browser.defaultBrowserContext().overridePermissions(origin, ["geolocation"]);
await page.setGeolocation({ latitude: 26.8467, longitude: 80.9462, accuracy: 10 });

const username = "shot" + Math.floor(Math.random() * 1e6);
const shot = (name) => page.screenshot({ path: `${OUT}/${name}.png` });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 1 — auth screen
await page.goto(BASE, { waitUntil: "networkidle2", timeout: 60000 });
await sleep(1500);
await shot("01-auth");

// 2 — register
await page.type('input[placeholder="Username"]', username);
await page.type('input[placeholder="Email"]', `${username}@example.com`);
await page.type('input[placeholder^="Password"]', "shotshot123");
await page.click("button[type=submit]");
await page.waitForSelector("h2", { timeout: 15000 });
await sleep(800);
await shot("02-onboarding-1");

// 3 — onboarding step 2 (hexes lighting up)
const nextBtn = await page.waitForSelector("button.btn-lime", { timeout: 5000 });
await nextBtn.click();
await sleep(1600);
await shot("03-onboarding-2");

// 4 — finish onboarding, land on the map (click the CTA only while onboarding is up)
for (let i = 0; i < 4; i++) {
  const b = await page.$('[data-onboarding] button.btn-lime');
  if (!b) break;
  await b.click();
  await sleep(700);
}
await page.waitForFunction(() => window.__map && window.__map.isStyleLoaded(), { timeout: 30000 });
// wait for first ping → unlock → XP chip
await sleep(6500);
await shot("04-map-first-unlock");

// 5 — open a discovery sheet by clicking a visible pin (before walking away)
const diag = await page.evaluate(() => {
  const m = window.__map;
  const feats = m.querySourceFeatures("discoveries") ?? [];
  const w = window.innerWidth;
  const h = window.innerHeight;
  const proj = feats.map((f) => ({ f, p: m.project(f.geometry.coordinates) }));
  const visible = proj.filter(({ p }) => p.x > 40 && p.x < w - 40 && p.y > 120 && p.y < h - 260);
  return { total: feats.length, visible: visible.length, center: m.getCenter(), zoom: m.getZoom() };
});
console.log("pins:", JSON.stringify(diag));
const pt = await page.evaluate(() => {
  const m = window.__map;
  const feats = m.querySourceFeatures("discoveries") ?? [];
  const w = window.innerWidth;
  const h = window.innerHeight;
  const visible = feats
    .map((f) => ({ f, p: m.project(f.geometry.coordinates) }))
    .filter(({ p }) => p.x > 40 && p.x < w - 40 && p.y > 120 && p.y < h - 260);
  if (visible.length === 0) return null;
  const { p } = visible[0];
  return { x: p.x, y: p.y };
});
if (pt) {
  await page.mouse.click(pt.x, pt.y);
  await sleep(1200);
  await shot("06-discovery-sheet");
  await page.keyboard.press("Escape");
  await page.mouse.click(10, 300); // dismiss any overlay
  await sleep(600);
} else {
  console.log("no discovery pins rendered");
}

// 6 — simulate a walk (~110 km/h so the server's speed check accepts it)
const WALK = [
  [26.8500, 80.9502],
  [26.8530, 80.9540],
  [26.8562, 80.9575],
  [26.8595, 80.9610],
  [26.8628, 80.9648],
  [26.8660, 80.9685],
];
for (const [lat, lng] of WALK) {
  await page.setGeolocation({ latitude: lat, longitude: lng, accuracy: 9 });
  await sleep(12000);
}
// pan the camera to where the walker ended up, wider view of the revealed cluster
await page.evaluate(() => {
  window.__map.easeTo({ center: [80.9605, 26.8600], zoom: 14.4, duration: 1600 });
});
await sleep(2200);
await shot("05-map-explored");

// 7 — profile
await page.evaluate(() => document.querySelector('button[aria-label="Profile"]')?.click());
await sleep(1000);
await shot("07-profile");

console.log("username:", username);
await browser.close();
