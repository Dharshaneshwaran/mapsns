import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { validateMapDocument } from "../lib/mapImageValidation.ts";

const port = 3217;
const base = `http://localhost:${port}`;
const key = "map-editor-isolated-test-key";
let directory;
let server;
let original;
let saved;
let output = "";
const png = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aZgAAAABJRU5ErkJggg==";

before(async () => {
  directory = await mkdtemp(path.join(tmpdir(), "sns-map-images-test-"));
  server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", String(port)], { cwd: process.cwd(), env: { ...process.env, ADMIN_MAP_TOKEN: key, MAP_IMAGES_DATA_DIR: directory }, stdio: ["ignore", "pipe", "pipe"], windowsHide: true });
  server.stdout.on("data", (chunk) => { output += chunk; });
  server.stderr.on("data", (chunk) => { output += chunk; });
  for (let attempt = 0; attempt < 100; attempt++) {
    try { const response = await fetch(`${base}/api/map-images`); if (response.ok) { original = await response.json(); return; } } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Test server did not start: ${output}`);
});

after(async () => {
  if (server && server.exitCode === null) { const exited = new Promise((resolve) => server.once("exit", resolve)); server.kill(); await exited; }
  if (directory && path.dirname(directory) === path.resolve(tmpdir()) && path.basename(directory).startsWith("sns-map-images-test-")) await rm(directory, { recursive: true, force: true });
});

function publish(document, headers = {}) {
  return fetch(`${base}/api/map-images`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}`, ...headers }, body: JSON.stringify(document) });
}

test("initial public map preserves the four original images", () => {
  assert.equal(original.images.length, 4);
  assert.equal(original.images.find((image) => image.id === "ihub").width, 0.0005);
});

test("public reads require no key; anonymous and cross-origin publishes fail", async () => {
  assert.equal((await publish(original, { Authorization: "" })).status, 401);
  assert.equal((await publish(original, { Origin: "https://another-site.example" })).status, 403);
});

test("invalid coordinates, duplicate IDs and disguised image files are rejected", () => {
  const bad = structuredClone(original);
  bad.images[0].lat = NaN;
  assert.throws(() => validateMapDocument(bad), /position/);
  bad.images = [original.images[0], original.images[0]];
  assert.throws(() => validateMapDocument(bad), /duplicate/);
  bad.images = [{ ...original.images[0], src: "data:image/png;base64,PHNjcmlwdD4=" }];
  assert.throws(() => validateMapDocument(bad), /supported image/);
});

test("publish persists uploaded pixels, movement, independent stretch and rotation", async () => {
  const draft = structuredClone(original);
  draft.images.push({ id: "test-upload", name: "Uploaded building", src: png, lat: 11.101, lng: 77.027, width: 0.0008, height: 0.0003, rotation: 47, opacity: 0.65 });
  const response = await publish(draft);
  assert.equal(response.status, 200, await response.clone().text());
  saved = await response.json();
  assert.notEqual(saved.revision, original.revision);
  const publicDocument = await (await fetch(`${base}/api/map-images`)).json();
  assert.deepEqual(publicDocument, saved);
  assert.deepEqual(publicDocument.images.at(-1), draft.images.at(-1));
  assert.deepEqual(JSON.parse(await readFile(path.join(directory, "images.json"), "utf8")), saved);
});

test("conditional reads skip unchanged data, and stale drafts cannot overwrite it", async () => {
  assert.equal((await fetch(`${base}/api/map-images`, { headers: { "If-None-Match": `"${saved.revision}"` } })).status, 304);
  assert.equal((await publish(original)).status, 409);
  assert.equal((await (await fetch(`${base}/api/map-images`)).json()).revision, saved.revision);
});

test("invalid API payload leaves published data intact", async () => {
  const invalid = structuredClone(saved);
  invalid.images[0].height = -1;
  assert.equal((await publish(invalid)).status, 400);
  assert.equal((await (await fetch(`${base}/api/map-images`)).json()).revision, saved.revision);
});

test("deleting an overlay is persisted without restoring default images", async () => {
  const response = await publish({ revision: saved.revision, images: [] });
  assert.equal(response.status, 200);
  assert.deepEqual((await (await fetch(`${base}/api/map-images`)).json()).images, []);
});

test("admin and public pages render", async () => {
  assert.match(await (await fetch(`${base}/admin`)).text(), /Campus image editor/);
  assert.equal((await fetch(base)).status, 200);
});
