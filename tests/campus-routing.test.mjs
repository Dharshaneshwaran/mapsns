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

test("CGC and Plane View route to nearby campus paths without the public router", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error("Must calculate on campus"); };
  const start = { lat: 11.103914, lng: 77.026619 };
  try {
    for (const end of [
      { lat: 11.101219626213846, lng: 77.02653910308507 },
      { lat: 11.100921772483286, lng: 77.02626854855808 },
    ]) {
      const route = await requestRoute(start, end, "walking", new AbortController().signal);
      assert.ok(route.destinationGapMeters > 40 && route.destinationGapMeters < 50);
      assert.ok(route.points.every(p => isInsideCampus(p.lat, p.lng)));
      assert.notDeepEqual(route.points.at(-1), end, "Do not draw an unmapped last leg");
      assert.ok(route.distanceMeters > 0);
    }
  } finally { globalThis.fetch = original; }
});

test("A* chooses the shorter campus branch", () => {
  const route = campusWalkingRoute({ lat: 11.10109, lng: 77.027072 }, { lat: 11.100151, lng: 77.027518 });
  assert.ok(route);
  // The six-vertex eastern road is 142.83 m; the western loop is longer.
  assert.ok(Math.abs(route.distanceMeters - 142.831) < 0.01);
  assert.ok(route.points.every(p => p.lng >= 77.027072), "Do not take the longer western loop");
});

test("destination tolerance does not increase GPS tolerance or allow distant pins", () => {
  const road = { lat: 11.100151, lng: 77.027518 };
  const cgc = { lat: 11.101219626213846, lng: 77.02653910308507 };
  assert.equal(campusWalkingRoute(cgc, road), null);
  assert.equal(campusWalkingRoute(road, { lat: 11.101355438524013, lng: 77.02610243953112 }), null);
});
