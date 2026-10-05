/**
 * Verifies every action in the discovery detail sheet, end to end:
 *   near case:  visit (+15 XP) → recommend (+20 XP, gold) → photo upload → report
 *   far case:   check-in replaced by "Walk closer to check in"
 * Screenshots → data/shots/2x-*.png
 */
import puppeteer from "puppeteer-core";
import { mkdirSync, writeFileSync } from "node:fs";

const BASE = process.argv[2] ?? "http://localhost:5173";
const OUT = "../data/shots";
mkdirSync(OUT, { recursive: true });

// 1x1 transparent PNG
writeFileSync(
  `${OUT}/probe.png`,
  Buffer.from(
    "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d49444154789c62600100000005000157b2bd0e0000000049454e44ae426082",
    "hex",
  ),
);

const browser = await puppeteer.launch({
  executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  headless: true,
  acceptInsecureCerts: true,
});
const page = await browser.newPage();
await page.setViewport({ width: 412, height: 880, deviceScaleFactor: 2 });

const PARK = { lat: 26.8521, lng: 80.9449 }; // Begum Hazrat Mahal Park
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const shot = (name) => page.screenshot({ path: `${OUT}/${name}.png` });

async function setup(geo) {
  const origin = new URL(BASE).origin;
  await browser.defaultBrowserContext().overridePermissions(origin, ["geolocation"]);
  await page.setGeolocation(geo);
  await page.goto(BASE, { waitUntil: "networkidle2", timeout: 60000 });
  await sleep(1200);
  const u = "v" + Math.floor(Math.random() * 1e6);
  await page.type('input[placeholder="Username"]', u);
  await page.type('input[placeholder="Email"]', `${u}@x.com`);
  await page.type('input[placeholder^="Password"]', "probepass1");
  await page.click("button[type=submit]");
  await sleep(1200);
  for (let i = 0; i < 4; i++) {
    const btn = await page.$("[data-onboarding] button.btn-brand");
    if (!btn) break;
    await btn.click();
    await sleep(500);
  }
  await sleep(2500);
  return u;
}

async function openNearestSheet() {
  await page.click('button[aria-label="Discoveries nearby"]');
  await page.waitForSelector(".sheet button.fade-in", { timeout: 10000 });
  const rows = await page.$$(".sheet button.fade-in");
  await rows[0].click(); // sorted by distance — first is nearest
  await sleep(1300);
}

// ---------- NEAR: standing in the park ----------
await setup({ latitude: PARK.lat, longitude: PARK.lng, accuracy: 10 });
await openNearestSheet();
await shot("20-sheet-near-ready");

console.log("clicking mark visited…");
await page.evaluate(() => {
  const btn = [...document.querySelectorAll(".sheet button")].find((b) =>
    b.textContent.includes("mark visited"),
  );
  if (!btn) throw new Error("mark-visited button not found");
  btn.click();
});
await sleep(2500);
await shot("21-sheet-visited");

console.log("clicking worth visiting…");
await page.evaluate(() => {
  const btn = [...document.querySelectorAll(".sheet button")].find((b) =>
    b.textContent.includes("Worth visiting"),
  );
  if (!btn || btn.disabled) throw new Error("recommend button not enabled");
  btn.click();
});
await sleep(2200);
await shot("22-sheet-recommended");

console.log("uploading photo…");
const fileInput = await page.$('.sheet input[type="file"]');
await fileInput.uploadFile(`${OUT}/probe.png`);
await sleep(2500);
await shot("23-sheet-photo");

console.log("submitting report…");
await page.click('button[aria-label="Report"]');
await sleep(700);
await page.evaluate(() => {
  const btn = [...document.querySelectorAll("button")].find((b) =>
    b.textContent.includes("Unsafe location"),
  );
  btn?.click();
});
await sleep(1000);
await shot("24-sheet-reported");

// ---------- FAR: across the country ----------
await page.evaluate(() => document.querySelector("button[aria-label='Profile']")?.click());
await sleep(600);
await page.evaluate(() => {
  const btn = [...document.querySelectorAll("button")].find((b) => b.textContent.includes("Sign out"));
  btn?.click();
});
await sleep(1200);
await setup({ latitude: 26.78, longitude: 84.35, accuracy: 25 }); // Mairwa, Bihar
// pan the map back to Lucknow so the list has content — but the USER is still far away
await page.evaluate(() =>
  window.__map.easeTo({ center: [80.9449, 26.8521], zoom: 15.5, duration: 0 }),
);
await sleep(1200);
await openNearestSheet();
await sleep(400);
await shot("25-sheet-far-gate");

console.log("done");
await browser.close();
