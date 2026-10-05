/** Desktop demo-mode playthrough from Mairwa (weak GPS):
 *  unlock cells → add a discovery at your location → see it in the nearby list. */
import puppeteer from "puppeteer-core";
import { mkdirSync } from "node:fs";

const BASE = process.argv[2] ?? "http://localhost:5173";
mkdirSync("../data/shots", { recursive: true });

const browser = await puppeteer.launch({
  executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  headless: true,
  acceptInsecureCerts: true,
});
const page = await browser.newPage();
await page.setViewport({ width: 412, height: 880, deviceScaleFactor: 2 });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const shot = (n) => page.screenshot({ path: `../data/shots/${n}.png` });

// Mairwa, Bihar — with desktop-grade (bad) accuracy
const MAIRWA = { latitude: 26.78, longitude: 84.35, accuracy: 800 };
await browser.defaultBrowserContext().overridePermissions(new URL(BASE).origin, ["geolocation"]);
await page.setGeolocation(MAIRWA);

await page.goto(BASE, { waitUntil: "networkidle2", timeout: 60000 });
await sleep(1200);
const u = "mairwa" + Math.floor(Math.random() * 1e6);
await page.type('input[placeholder="Username"]', u);
await page.type('input[placeholder="Email"]', `${u}@x.com`);
await page.type('input[placeholder^="Password"]', "probepass1");
await page.click("button[type=submit]");
await sleep(1200);
for (let i = 0; i < 4; i++) {
  const btn = await page.$("[data-onboarding] button.btn-lime");
  if (!btn) break;
  await btn.click();
  await sleep(500);
}
await page.waitForFunction(() => window.__map && window.__map.isStyleLoaded(), { timeout: 30000 });
await sleep(6500);
await shot("30-mairwa-unlocked"); // first cells unlocked around Mairwa despite weak GPS

// "Reveal what's nearby" now opens the list — Mairwa is empty → jump offered
await page.evaluate(() => {
  const btn = [...document.querySelectorAll("button")].find((b) =>
    b.textContent.includes("Reveal what's nearby"),
  );
  btn?.click();
});
await sleep(1800);
await shot("31-mairwa-empty-state");

// jump to Lucknow → list fills
await page.evaluate(() => {
  const btn = [...document.querySelectorAll("button")].find((b) =>
    b.textContent.includes("Take me to Lucknow"),
  );
  btn?.click();
});
await sleep(2500);
await shot("32-lucknow-list");

// close, add a discovery right here in Mairwa with weak GPS
await page.keyboard.press("Escape");
await sleep(600);
await page.click('button[aria-label="Add discovery"]');
await sleep(900);
await page.type('input[placeholder^="Name"]', "Mairwa Ghat at dusk");
const cat = await page.evaluateHandle(() => {
  return [...document.querySelectorAll(".sheet .chip")].find((c) => c.textContent === "Viewpoint");
});
await cat.asElement().click();
await sleep(300);
await page.evaluate(() => {
  const btn = [...document.querySelectorAll("button")].find((b) =>
    b.textContent.includes("Publish discovery"),
  );
  btn?.click();
});
await sleep(2500);
await shot("33-mairwa-created");

// reopen nearby list — our Mairwa place should be there
await page.click('button[aria-label="Discoveries nearby"]');
await sleep(2000);
await shot("34-mairwa-nearby-has-place");

console.log("user:", u);
await browser.close();
