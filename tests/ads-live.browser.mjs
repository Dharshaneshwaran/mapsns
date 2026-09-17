import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser = await chromium.launch({ headless: true, executablePath: process.env.TEST_BROWSER_PATH });
try {
  const page = await browser.newPage();
  await page.route("https://maps.googleapis.com/**", route => route.abort());
  let banners = [{ id: "live-test", enabled: true, placements: ["placeCard"], title: "First published title", description: "First description", eyebrow: "Event", buttonLabel: "Open", imageUrl: "", linkUrl: "", order: 0 }];
  await page.route("**/api/ads", route => route.fulfill({ json: { banners } }));
  await page.goto(`${process.env.TEST_BASE_URL || "http://localhost:3000"}/?place=heritage-courtyard`);
  await page.getByRole("heading", { name: "First published title" }).waitFor();
  assert.equal(await page.getByAltText("First published title").count(), 0);
  banners = [{ ...banners[0], title: "Updated published title", description: "Updated description" }];
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await page.getByRole("heading", { name: "Updated published title" }).waitFor();
  banners = [];
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await page.getByRole("heading", { name: "Updated published title" }).waitFor({ state: "hidden" });
  console.log("PASS: published ads refresh without reopening the card; removed ads disappear; empty images have no hardcoded fallback.");
} finally { await browser.close(); }
