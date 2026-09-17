import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser = await chromium.launch({ headless: true, executablePath: process.env.TEST_BROWSER_PATH });
try {
  const context = await browser.newContext({ geolocation: { latitude: 11.1005, longitude: 77.0265, accuracy: 5 }, permissions: ["geolocation"] });
  await context.addInitScript(() => {
    localStorage.setItem("sns-campus-profile", JSON.stringify({ gender: "female", pointerStyle: "character", mapStyle: "roadmap" }));
    navigator.geolocation.watchPosition = callback => { window.sendPosition = callback; return 1; };
    navigator.geolocation.clearWatch = () => {};
  });
  const page = await context.newPage();
  await page.route("https://routing.openstreetmap.de/**", r => r.fulfill({ json: { code: "Ok", routes: [{ distance: 200, duration: 100, geometry: { coordinates: [[77.0265, 11.1005], [77.026641, 11.100094]] } }] } }));
  await page.goto(`${process.env.TEST_BASE_URL || "http://localhost:3000"}/?place=admin-building`);
  await page.waitForFunction(() => Boolean(document.querySelector(".gm-style")));
  await page.getByText("Loading campus map...", { exact: true }).waitFor({ state: "hidden" });
  await page.getByRole("button", { name: "Directions", exact: true }).click();
  await page.getByRole("button", { name: "Start", exact: true }).click();
  const female = page.getByAltText("Female walking pointer", { exact: true });
  await female.waitFor({ state: "visible" });
  await page.waitForFunction(() => document.querySelector('img[alt="Female walking pointer"]')?.naturalWidth > 0);
  assert.equal(await female.getAttribute("src"), "/female/1.png");
  await page.evaluate(() => window.sendPosition({ timestamp: Date.now(), coords: { latitude: 11.10055, longitude: 77.0265, accuracy: 5, speed: 1.2, heading: 0 } }));
  await page.waitForFunction(() => document.querySelector('img[alt="Female walking pointer"]')?.getAttribute("src") !== "/female/1.png");
  await page.waitForTimeout(2600);
  assert.equal(await female.getAttribute("src"), "/female/1.png");
  console.log("PASS: saved Female preference renders its image, animates during GPS movement, and stops when idle.");
} finally { await browser.close(); }
