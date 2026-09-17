import test from "node:test";
import assert from "node:assert/strict";
import { routeDeviation } from "./routeDeviation.ts";
import { requestRoute } from "./requestRoute.ts";

const points = [{ lat: 0, lng: 0 }, { lat: 0.001, lng: 0 }];

test("route progress distinguishes backtracking from heading changes", () => {
  const forward = routeDeviation({ lat: 0.0007, lng: 0 }, points, 0);
  const turned = routeDeviation({ lat: 0.0007, lng: 0 }, points, 180);
  const backward = routeDeviation({ lat: 0.0004, lng: 0 }, points, 180);
  assert.ok(forward.distance < 0.001);
  assert.equal(forward.wrongWay, false);
  assert.equal(turned.progressMeters, forward.progressMeters);
  assert.equal(backward.wrongWay, true);
  assert.ok(forward.progressMeters - backward.progressMeters > 30);
  assert.ok(backward.remainingFraction > forward.remainingFraction);
});

test("off-route distance measures the nearest path segment", () => {
  const result = routeDeviation({ lat: 0.0005, lng: 0.0003 }, points, null);
  assert.ok(result.distance > 33 && result.distance < 34);
  assert.ok(Math.abs(result.remainingFraction - 0.5) < 0.001);
});

test("walking reroutes do not constrain snapping to the GPS heading", async () => {
  const originalFetch = globalThis.fetch;
  let requested;
  globalThis.fetch = async (url) => {
    requested = String(url);
    return Response.json({ code: "Ok", routes: [{ distance: 111, duration: 80, geometry: { coordinates: [[0, 0], [0, 0.001]] } }] });
  };
  try {
    await requestRoute(points[0], points[1], "walking", new AbortController().signal, 180);
    assert.equal(new URL(requested).searchParams.has("bearings"), false);
    const cancellations = Array.from({ length: 5 }, () => {
      const controller = new AbortController();
      const pending = requestRoute(points[0], points[1], "vehicle", controller.signal);
      controller.abort();
      return assert.rejects(pending, { name: "AbortError" });
    });
    await Promise.all(cancellations);
    // Cancelled selections must not add five seconds of queue debt.
    await requestRoute(points[0], points[1], "vehicle", AbortSignal.timeout(2500), 90);
    assert.equal(new URL(requested).searchParams.get("bearings"), "90,90;");
  } finally { globalThis.fetch = originalFetch; }
});
