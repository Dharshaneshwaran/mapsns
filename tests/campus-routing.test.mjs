import test from "node:test";
import assert from "node:assert/strict";
import { campusWalkingRoute } from "../lib/campusRouting.ts";
import { requestRoute } from "../lib/requestRoute.ts";
import { isInsideCampus } from "../data/campusBoundary.ts";

test("saved campus roads connect the northern campus to iHub without network access", async () => {
  const start = { lat: 11.103914, lng: 77.026619 };
  const end = { lat: 11.100089171110856, lng: 77.0273713924278 };
  const original = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error("Network must not be used"); };
  try {
    const route = await requestRoute(start, end, "walking", new AbortController().signal);
    assert.ok(route.points.length > 5);
    assert.ok(route.points.every(p => isInsideCampus(p.lat, p.lng)));
    assert.ok(route.distanceMeters > 400 && route.distanceMeters < 800);
    console.log(`Northern campus to iHub: ${Math.round(route.distanceMeters)} m, entirely inside campus`);
  } finally { globalThis.fetch = original; }
});

test("local graph does not invent paths to distant or outside positions", () => {
  const end = { lat: 11.100151, lng: 77.027518 };
  assert.equal(campusWalkingRoute({ lat: 11.104, lng: 77.028 }, end), null);
  assert.equal(campusWalkingRoute({ lat: 11.099, lng: 77.027 }, end), null);
});

test("two positions on the same road take its direct segment", () => {
  const route = campusWalkingRoute({ lat: 11.10017, lng: 77.027517 }, { lat: 11.10020, lng: 77.027516 });
  assert.ok(route);
  assert.ok(route.distanceMeters < 5);
});
