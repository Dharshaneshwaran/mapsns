import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, rm, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

// Run after npm run build. A separately installed Playwright can be provided here.
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : "playwright");
const directory = await mkdtemp(path.join(tmpdir(), "sns-map-browser-test-"));
const base = "http://localhost:3218";
const key = "browser-map-test-key";
const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", "3218"], { cwd: process.cwd(), env: { ...process.env, ADMIN_MAP_TOKEN: key, MAP_IMAGES_DATA_DIR: directory, MAP_IMAGES_UPLOAD_DIR: path.join(directory, "uploads") }, stdio: "ignore", windowsHide: true });
let browser;
let page;
try {
  for (let attempt = 0; attempt < 100; attempt++) {
    try { if ((await fetch(`${base}/api/map-images`)).ok) break; } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  browser = await chromium.launch({ headless: true, ...(process.env.TEST_BROWSER_PATH ? { executablePath: process.env.TEST_BROWSER_PATH } : {}) });
  page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${base}/admin`);
  await page.locator(".map-image-overlay").first().waitFor({ timeout: 30000 });
  assert.equal(await page.locator(".map-image-overlay").count(), 4);
  const canvas = page.getByRole("region", { name: "Map", exact: true });
  const bounds = await canvas.boundingBox();
  assert.ok(bounds);
  await page.mouse.click(bounds.x + bounds.width * 0.65, bounds.y + bounds.height * 0.62, { button: "right" });
  const chooserEvent = page.waitForEvent("filechooser");
  await page.getByRole("menuitem", { name: "Add image" }).click();
  await (await chooserEvent).setFiles({ name: "browser-building.png", mimeType: "image/png", buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aZgAAAABJRU5ErkJggg==", "base64") });
  const image = page.locator('.map-image-overlay[title="browser-building"]');
  await image.waitFor();
  assert.equal(await page.locator(".map-image-overlay").count(), 5);
  assert.equal((await (await fetch(`${base}/api/map-images`)).json()).images.length, 4, "Unpublished image must remain private");
  const start = await image.boundingBox();
  await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2);
  await page.mouse.down();
  await page.mouse.move(start.x + start.width / 2 + 35, start.y + start.height / 2 + 25, { steps: 10 });
  await page.mouse.up();
  const moved = await image.boundingBox();
  assert.ok(Math.abs(moved.x - start.x - 35) < 3, "Image should move with pointer");
  const corner = await image.locator('[data-mode="se"]').boundingBox();
  await page.mouse.move(corner.x + corner.width / 2, corner.y + corner.height / 2);
  await page.mouse.down();
  await page.mouse.move(corner.x + corner.width / 2 + 20, corner.y + corner.height / 2 + 10, { steps: 10 });
  await page.mouse.up();
  const resized = await image.boundingBox();
  assert.ok(resized.width > moved.width + 30, "Corner must stretch width");
  assert.ok(resized.height > moved.height + 10, "Corner must stretch height");
  const rotate = await image.locator('[data-mode="rotate"]').boundingBox();
  await page.mouse.move(rotate.x + rotate.width / 2, rotate.y + rotate.height / 2);
  await page.mouse.down();
  await page.mouse.move(resized.x + resized.width + 35, resized.y + resized.height / 2, { steps: 10 });
  await page.mouse.up();
  const rotation = Number(await page.getByRole("slider", { name: "Image rotation" }).inputValue());
  assert.ok(rotation > 60 && rotation < 120, "Rotation handle should turn image about 90 degrees");
  await page.getByText("Admin publish key", { exact: true }).click();
  await page.getByRole("textbox", { name: "Admin publish key" }).fill(key);
  await page.getByRole("button", { name: "Save / Publish" }).click();
  await page.getByRole("status").filter({ hasText: "Published." }).waitFor();
  const published = await (await fetch(`${base}/api/map-images`)).json();
  assert.equal(published.images.length, 5);
  assert.ok(published.images.at(-1).rotation > 60);
  await mkdir("test-results", { recursive: true });
  await page.screenshot({ path: "test-results/map-image-editor.png", fullPage: true });
  const publicPage = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await publicPage.goto(base);
  await publicPage.locator('.map-image-overlay[title="browser-building"]').waitFor({ timeout: 30000 });
  const publicRotation = await publicPage.locator('.map-image-overlay[title="browser-building"]').evaluate((element) => element.style.transform);
  assert.match(publicRotation, /rotate\(/);
  await page.reload();
  await page.locator('.map-image-overlay[title="browser-building"]').waitFor({ timeout: 30000 });
  await page.getByRole("button", { name: "browser-building", exact: true }).click();
  assert.ok(Number(await page.getByRole("slider", { name: "Image rotation" }).inputValue()) > 60);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Add image", exact: true }).click();
  await page.getByText("Click the map where you want the image.", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Cancel placement" }).click();
  assert.deepEqual(errors, [], "No uncaught browser errors");
  console.log("PASS: real Google Maps right-click upload, private draft, drag, stretch, rotation, publish, public display, reload persistence and mobile placement.");
} catch (error) {
  if (page) {
    await mkdir("test-results", { recursive: true });
    await page.screenshot({ path: "test-results/map-image-editor-failure.png", fullPage: true });
    console.error((await page.locator("main").innerText()).slice(0, 1400));
  }
  throw error;
} finally {
  await browser?.close();
  if (server.exitCode === null) { const exited = new Promise((resolve) => server.once("exit", resolve)); server.kill(); await exited; }
  if (path.dirname(directory) === path.resolve(tmpdir()) && path.basename(directory).startsWith("sns-map-browser-test-")) await rm(directory, { recursive: true, force: true });
}
