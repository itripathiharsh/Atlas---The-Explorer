/**
 * Visual QA: drives the app in headless Edge with a simulated GPS walk
 * and saves screenshots to data/shots/. Uses system Edge — nothing on C:.
 *
 * Run:  node scripts/shot.mjs [baseURL]
 * Requires backend (:8777) + vite dev server (:5173) running.
 */
import puppeteer from "puppeteer-core";
import { mkdirSync, existsSync } from "node:fs";

const BASE = process.argv[2] ?? "http://localhost:5173";
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

page.on("console", (msg) => console.log("PAGE LOG:", msg.text()));
page.on("pageerror", (err) => console.log("PAGE ERR:", err.message));
page.on("requestfailed", (req) => console.log("REQ FAILED:", req.url(), req.failure()?.errorText));

const username = "expedition" + Math.floor(Math.random() * 1e6);
const shot = (name) => page.screenshot({ path: `${OUT}/${name}.png` });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

console.log("Navigating to", BASE);
await page.goto(BASE, { waitUntil: "networkidle2", timeout: 60000 });
await sleep(1500);

// 1 — auth screen
await shot("01-auth");
console.log("Captured 01-auth");

// 2 — register
await page.type('input[placeholder*="Username"]', username);
await page.type('input[placeholder*="Email"]', `${username}@example.com`);
await page.type('input[type="password"]', "password123");
await page.click("button[type=submit]");
await page.waitForSelector("h2", { timeout: 15000 });
await sleep(800);
await shot("02-onboarding-1");
console.log("Captured 02-onboarding-1");

// 3 — finish onboarding
while (await page.$('[data-onboarding]')) {
  const b = await page.$('[data-onboarding] button');
  if (!b) break;
  await b.click();
  await sleep(900);
}
console.log("Onboarding completed, waiting for map canvas...");
await page.waitForFunction(() => window.__map && window.__map.isStyleLoaded(), { timeout: 30000 });
await sleep(3500);

// 4 — Map screen: HUD + Controls + 3-Stat capsule + BottomNav
await shot("04-map-screen");
console.log("Captured 04-map-screen");

// 5 — Explore Nearby sheet (via Explore tab in BottomNav)
const exploreTab = await page.$('button[aria-label="Explore nearby discoveries"]');
if (exploreTab) {
  await exploreTab.click();
  await sleep(1500);
  await shot("05-nearby-sheet");
  console.log("Captured 05-nearby-sheet");

  // click the first discovery card to open the Place Details sheet
  const firstCard = await page.waitForSelector('article.parchment-card', { timeout: 5000 }).catch(() => null);
  if (firstCard) {
    await firstCard.click();
    await sleep(1500);
    await shot("06-place-details-sheet");
    console.log("Captured 06-place-details-sheet");

    // Close detail sheet
    const closeBtn = await page.$('section[aria-label="Discovery Detail"] button[aria-label="Close"]');
    if (closeBtn) await closeBtn.click();
    else await page.keyboard.press("Escape");
    await sleep(700);
  }

  // Close nearby sheet
  const closeNearby = await page.$('section[aria-label="Explore Nearby"] button[aria-label="Close"]');
  if (closeNearby) await closeNearby.click();
  else await page.keyboard.press("Escape");
  await sleep(700);
}

// 6 — World Cities sheet (via Cities tab in BottomNav)
const citiesTab = await page.$('button[aria-label="World cities"]');
if (citiesTab) {
  await citiesTab.click();
  await sleep(1200);
  await shot("07-world-cities-sheet");
  console.log("Captured 07-world-cities-sheet");

  const closeCities = await page.$('section[aria-label="World Expeditions"] button[aria-label="Close"]');
  if (closeCities) await closeCities.click();
  else await page.keyboard.press("Escape");
  await sleep(700);
}

// 7 — Profile sheet (via Profile tab in BottomNav)
const profileTab = await page.$('button[aria-label="Explorer profile"]');
if (profileTab) {
  await profileTab.click();
  await sleep(1500);
  await shot("08-profile-sheet");
  console.log("Captured 08-profile-sheet");

  const closeProfile = await page.$('section[aria-label="Explorer Profile"] button[aria-label="Close"]');
  if (closeProfile) await closeProfile.click();
  else await page.keyboard.press("Escape");
  await sleep(700);
}

// 8 — Simulate exploration walk to trigger cell unlocks and map reveal
console.log("Simulating exploration walk...");
const WALK = [
  [26.8500, 80.9502],
  [26.8530, 80.9540],
  [26.8562, 80.9575],
  [26.8595, 80.9610],
  [26.8628, 80.9648],
];
for (const [lat, lng] of WALK) {
  await page.setGeolocation({ latitude: lat, longitude: lng, accuracy: 8 });
  await sleep(5000);
}

await page.evaluate(() => {
  if (window.__map) {
    window.__map.easeTo({ center: [80.9605, 26.8600], zoom: 14.8, duration: 1200 });
  }
});
await sleep(2000);
await shot("09-map-explored-reveal");
console.log("Captured 09-map-explored-reveal");

console.log("Visual QA completed successfully! Explorer:", username);
await browser.close();
