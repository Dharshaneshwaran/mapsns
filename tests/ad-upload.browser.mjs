import assert from "node:assert/strict";
import { readFile, unlink } from "node:fs/promises";
import { pathToFileURL } from "node:url";
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const env = await readFile(".env.local", "utf8");
const password = /^ADMIN_MAP_TOKEN=(.+)$/m.exec(env)?.[1].trim();
assert.ok(password, "Configure a local admin token before testing.");
const browser = await chromium.launch({ headless: true, executablePath: process.env.TEST_BROWSER_PATH });
let uploaded;
try {
  const context = await browser.newContext({ httpCredentials: { username: "admin", password } });
  const page = await context.newPage();
  await page.route("https://maps.googleapis.com/**", route => route.abort());
  await page.goto(process.env.TEST_BASE_URL || "http://localhost:3000/admin");
  const section = page.locator("section").filter({ has: page.getByRole("heading", { name: "Ad banners", exact: true }) });
  await section.getByTitle("Expand", { exact: true }).first().click();
  const remove = section.getByTitle("Remove image", { exact: true });
  if (await remove.count()) await remove.first().click();
  assert.equal(await section.getByLabel("Admin publish key (if configured)").count(), 0);
  const file = { name: "test.png", mimeType: "image/png", buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aZgAAAABJRU5ErkJggg==", "base64") };
  await page.route("**/api/ads/upload", route => route.fulfill({ status: 401, json: { error: "Unauthorized" } }));
  await section.locator('input[type="file"]').setInputFiles(file);
  await section.getByRole("alert").filter({ hasText: "Sign in again" }).waitFor();
  await page.unroute("**/api/ads/upload");
  const responsePromise = page.waitForResponse(r => r.url().endsWith("/api/ads/upload"));
  await section.locator('input[type="file"]').setInputFiles(file);
  const response = await responsePromise;
  assert.equal(response.status(), 200);
  uploaded = (await response.json()).url;
  const preview = section.getByAltText("Banner preview", { exact: true });
  await preview.waitFor();
  await page.waitForFunction(() => { const img = document.querySelector('img[alt="Banner preview"]'); return img?.complete && img.naturalWidth > 0; });
  assert.equal(await preview.getAttribute("src"), uploaded);
  console.log("PASS: upload errors visible; authenticated retry uploads and displays the real image.");
} finally {
  await browser.close();
  if (/^\/uploads\/ads\/[a-f0-9]{64}\.png$/.test(uploaded || "")) await unlink(`public${uploaded}`);
}
