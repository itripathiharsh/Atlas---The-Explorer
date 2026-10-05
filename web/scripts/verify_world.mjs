/** Visual verification of the interactive world map:
 *  world clusters → Paris pins + labels → category filter → city sheet → hex tap. */
import puppeteer from "puppeteer-core";

const BASE = "http://localhost:5173";
const browser = await puppeteer.launch({
  executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  headless: true,
  acceptInsecureCerts: true,
});
const page = await browser.newPage();
await page.setViewport({ width: 412, height: 880, deviceScaleFactor: 2 });
await browser.defaultBrowserContext().overridePermissions(BASE, ["geolocation"]);
await page.setGeolocation({ latitude: 26.8467, longitude: 80.9462, accuracy: 30 });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const shot = (n) => page.screenshot({ path: `../data/shots/${n}.png` });

await page.goto(BASE, { waitUntil: "networkidle2", timeout: 60000 });
await sleep(1200);
const u = "world" + Math.floor(Math.random() * 1e6);
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
await page.waitForFunction(() => window.__map && window.__map.isStyleLoaded(), { timeout: 30000 });
// let the world pins + clusters render (camera stays on world briefly before user-fix fly)
await sleep(3500);
await page.evaluate(() => window.__map.easeTo({ center: [20, 15], zoom: 2.4, duration: 1200 }));
await sleep(2500);
await shot("40-world-clusters");

// zoom into Paris → individual pins with labels
await page.evaluate(() => window.__map.easeTo({ center: [2.2945, 48.8584], zoom: 14.5, duration: 2000 }));
await sleep(3200);
await shot("41-paris-pins-labels");

// category filter: Monument only
await page.evaluate(() => {
  const chip = [...document.querySelectorAll("button.chip")].find((c) => c.textContent === "Monument");
  chip?.click();
});
await sleep(1200);
await shot("42-filter-monument");
await page.evaluate(() => {
  const chip = [...document.querySelectorAll("button.chip")].find((c) => c.textContent === "All");
  chip?.click();
});

// city list sheet via the dock label
await page.evaluate(() => {
  const btn = [...document.querySelectorAll("button.hud-label")].find((b) => b.textContent.includes("explored"));
  btn?.click();
});
await sleep(1200);
await shot("43-city-list");
await page.keyboard.press("Escape");
await sleep(500);

// hex tap info (fly back to Lucknow where dev-DB has unlocked hexes? fresh user has none — expect no toast)
console.log("done");
await browser.close();
