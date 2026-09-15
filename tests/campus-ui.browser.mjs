import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { pathToFileURL } from "node:url";
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", "3219"], { stdio: "ignore", windowsHide: true });
let browser;
try {
  for (let i = 0; i < 100; i++) { try { if ((await fetch("http://localhost:3219")).ok) break; } catch {} await new Promise((resolve) => setTimeout(resolve, 100)); }
  browser = await chromium.launch({ headless: true, executablePath: process.env.TEST_BROWSER_PATH });
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
  // Exercise app controls independently of external map credentials/network.
  await page.route("https://maps.googleapis.com/**", (route) => route.abort());
  await page.goto("http://localhost:3219");
  await page.getByRole("heading", { name: "Your campus, connected." }).waitFor();
  await page.getByRole("button", { name: "Admin Building" }).click();
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await page.getByRole("button", { name: "Saved", exact: true }).waitFor();
  await page.getByRole("button", { name: "Close location details" }).click();
  await page.getByRole("button", { name: "Saved places" }).click();
  await page.getByRole("button", { name: "Admin Building" }).waitFor();
  await page.goto("http://localhost:3219/?place=admin-building");
  await page.getByRole("heading", { name: "Admin Building", exact: true }).waitFor();
  await page.getByRole("button", { name: "Saved", exact: true }).waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  const panel = page.locator(".explore-panel");
  const before = await panel.boundingBox();
  await page.getByRole("button", { name: "Expand panel" }).click();
  const expanded = await panel.boundingBox();
  assert.ok(expanded.height > before.height + 200);
  const grip = await page.locator(".sheet-grip").boundingBox();
  await page.mouse.move(grip.x + grip.width / 2, grip.y + grip.height / 2);
  await page.mouse.down();
  await page.mouse.move(grip.x + grip.width / 2, grip.y + 360, { steps: 10 });
  await page.mouse.up();
  assert.ok((await panel.boundingBox()).height < expanded.height - 150);
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  console.log("PASS: desktop explore, save, saved list, deep links, reload persistence, mobile expand, swipe collapse and no horizontal overflow.");
} finally {
  await browser?.close();
  if (server.exitCode === null) { const exited = new Promise((resolve) => server.once("exit", resolve)); server.kill(); await exited; }
}
