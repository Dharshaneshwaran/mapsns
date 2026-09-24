import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";

const base = "http://localhost:3236";
const key = "isolated-presence-test-key";
let server;
let output = "";
before(async () => {
  server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", "3236"], { env: { ...process.env, ADMIN_MAP_TOKEN: key }, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
  server.stdout.on("data", chunk => { output += chunk; });
  server.stderr.on("data", chunk => { output += chunk; });
  for (let attempt = 0; attempt < 100; attempt++) {
    try { if ((await fetch(`${base}/api/visitors`)).status === 401) return; } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error(`Server failed to start: ${output}`);
});
after(async () => {
  if (server && server.exitCode === null) {
    const exited = new Promise(resolve => server.once("exit", resolve));
    server.kill();
    await exited;
  }
});
const summary = () => fetch(`${base}/api/visitors`, { headers: { Authorization: `Bearer ${key}` } });
const heartbeat = (id, location, headers = {}) => fetch(`${base}/api/visitors`, { method: "POST", headers: { "Content-Type": "application/json", "X-Visitor-Id": id, ...headers }, body: JSON.stringify({ location }) });

test("public heartbeats, protected aggregate counts, deduplication and location opt-out", async () => {
  assert.equal((await fetch(`${base}/api/visitors`)).status, 401);
  assert.equal((await fetch(`${base}/admin`)).status, 401);
  const id = randomUUID();
  assert.equal((await heartbeat(id, null)).status, 204);
  assert.equal((await heartbeat(id, { lat: 11.10012, lng: 77.02713, accuracy: 10 })).status, 204);
  const response = await summary();
  assert.equal(response.headers.get("cache-control"), "no-store");
  const data = await response.json();
  assert.equal(data.online, 1);
  assert.equal(data.sharing, 1);
  assert.deepEqual(data.cells, [{ lat: 11.1, lng: 77.027, count: 1 }]);
  assert.equal(JSON.stringify(data).includes(id), false);
  assert.equal((await heartbeat(id, null)).status, 204);
  assert.equal((await (await summary()).json()).sharing, 0);
});
test("invalid input and cross-site requests cannot add visitors", async () => {
  const count = (await (await summary()).json()).online;
  assert.equal((await heartbeat("bad-id", null)).status, 400);
  assert.equal((await heartbeat(randomUUID(), { lat: 999, lng: 0, accuracy: 1 })).status, 400);
  assert.equal((await heartbeat(randomUUID(), null, { "Sec-Fetch-Site": "cross-site" })).status, 403);
  assert.equal((await heartbeat(randomUUID(), "x".repeat(2000))).status, 413);
  assert.equal((await (await summary()).json()).online, count);
});
