import { test } from "node:test";
import assert from "node:assert/strict";
import { requestRoute } from "../lib/requestRoute.ts";
import { routeDeviation } from "../lib/routeDeviation.ts";

test("remaining distance follows the route around a corner", () => {
  const points = [{ lat: 0, lng: 0 }, { lat: 0.001, lng: 0 }, { lat: 0.001, lng: 0.001 }];
  assert.ok(Math.abs(routeDeviation(points[1], points, null).remainingFraction - 0.5) < 0.01);
  assert.equal(routeDeviation(points[2], points, null).remainingFraction, 0);
  assert.equal(routeDeviation({ lat: 0.0005, lng: 0 }, points, 180).wrongWay, true);
});
test("walking route keeps service distance and duration; no artificial fallback", async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async (url) => {
      assert.match(url, /routed-foot/);
      return Response.json({ code: "Ok", routes: [{ distance: 250, duration: 190, geometry: { coordinates: [[77, 11], [77.001, 11.001]] } }] });
    };
    const route = await requestRoute({ lat: 11, lng: 77 }, { lat: 11.001, lng: 77.001 }, "walking", new AbortController().signal);
    assert.equal(route.distanceMeters, 250); assert.equal(route.durationSeconds, 190);
    globalThis.fetch = async () => Response.json({ code: "NoRoute" });
    await assert.rejects(requestRoute({ lat: 11, lng: 77 }, { lat: 11.001, lng: 77.001 }, "walking", new AbortController().signal), /No mapped route/);
  } finally { globalThis.fetch = original; }
});
