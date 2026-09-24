import { test } from "node:test";
import assert from "node:assert/strict";
import { readLiveVisitors } from "../lib/liveVisitorSource.ts";

const origin = "https://map.gdta2026.com";
test("fetches live summary server-side with redirects disabled and strips extra fields", async () => {
  const data = await readLiveVisitors(origin, "test-token", async (url, options) => {
    assert.equal(url, `${origin}/api/visitors`);
    assert.equal(options.headers.Authorization, "Bearer test-token");
    assert.equal(options.redirect, "error");
    assert.equal(options.cache, "no-store");
    return Response.json({ online: 3, sharing: 1, updatedAt: 1000, secret: "discard", cells: [{ lat: 11.1, lng: 77.02, count: 1, id: "discard" }] });
  });
  assert.deepEqual(data, { online: 3, sharing: 1, updatedAt: 1000, source: origin, cells: [{ lat: 11.1, lng: 77.02, count: 1 }] });
});
test("missing token and unapproved destinations never make a request", async () => {
  const neverFetch = () => { assert.fail("Must not send a request"); };
  await assert.rejects(readLiveVisitors(origin, "", neverFetch), /LIVE_VISITORS_ADMIN_TOKEN/);
  await assert.rejects(readLiveVisitors("https://example.com", "test-token", neverFetch), /must be/);
});
test("auth failures and invalid responses are errors rather than zero visitors", async () => {
  await assert.rejects(readLiveVisitors(origin, "test-token", async () => new Response(null, { status: 401 })), /rejected/);
  await assert.rejects(readLiveVisitors(origin, "test-token", async () => Response.json({ online: 3, sharing: 4, updatedAt: 1000, cells: [] })), /invalid visitor data/);
});
