import test from "node:test";
import assert from "node:assert/strict";
import { adminAccess, adminWriteAccess } from "../lib/adminAuth.ts";
import { BodyTooLarge, readLimitedBody, isImageSignature } from "../lib/requestBody.ts";

test("admin authentication fails closed and rejects forged origins", () => {
  const saved = process.env.ADMIN_MAP_TOKEN;
  try {
    delete process.env.ADMIN_MAP_TOKEN;
    assert.equal(adminAccess(new Request("http://localhost/admin")).status, 503);
    process.env.ADMIN_MAP_TOKEN = "test-secret-only";
    const headers = { Authorization: "Bearer test-secret-only" };
    assert.equal(adminAccess(new Request("https://campus.test/admin", { headers })), null);
    assert.equal(adminAccess(new Request("https://campus.test/admin")).status, 401);
    for (const origin of ["null", "invalid", "https://evil.test", "http://campus.test"]) {
      assert.equal(adminWriteAccess(new Request("https://campus.test/api/ads", { headers: { ...headers, Origin: origin } })).status, 403);
    }
    assert.equal(adminWriteAccess(new Request("https://campus.test/api/ads", { headers: { ...headers, Origin: "https://campus.test" } })), null);
    assert.equal(adminWriteAccess(new Request("http://localhost:3000/api/ads", { headers: { ...headers, Host: "admin.localhost:3000", Origin: "http://admin.localhost:3000" } })), null);
    assert.equal(adminWriteAccess(new Request("http://localhost:3000/api/ads", { headers: { ...headers, Host: "admin.localhost:3000", Origin: "http://evil.test:3000" } })).status, 403);
    assert.equal(adminWriteAccess(new Request("https://campus.test/api/ads", { headers: { ...headers, "Sec-Fetch-Site": "cross-site" } })).status, 403);
  } finally {
    if (saved === undefined) delete process.env.ADMIN_MAP_TOKEN;
    else process.env.ADMIN_MAP_TOKEN = saved;
  }
});

test("body limits reject oversized streams without Content-Length", async () => {
  const request = new Request("https://campus.test/api/ads", { method: "PUT", body: "123456" });
  await assert.rejects(readLimitedBody(request, 5), BodyTooLarge);
  const small = new Request("https://campus.test/api/ads", { method: "PUT", body: "12345" });
  assert.equal((await readLimitedBody(small, 5)).toString(), "12345");
});

test("upload type cannot disguise HTML as an image", () => {
  for (const type of ["image/png", "image/jpeg", "image/webp"]) assert.equal(isImageSignature(Buffer.from("<script>alert(1)</script>"), type), false);
  assert.equal(isImageSignature(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), "image/png"), true);
});
