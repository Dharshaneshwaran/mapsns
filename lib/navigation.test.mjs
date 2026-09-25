import test from "node:test";
import assert from "node:assert/strict";
import { interpolateRoutePosition, routeDeviation } from "./routeDeviation.ts";
import { requestRoute } from "./requestRoute.ts";
import { isRerouteDue } from "./rerouteTiming.ts";

test("vehicle wrong turns react to consecutive fixes without the walking delay", () => {
  assert.equal(isRerouteDue("vehicle", 1, 2000, 20000), false);
  assert.equal(isRerouteDue("vehicle", 2, 500, 20000), false);
  assert.equal(isRerouteDue("vehicle", 2, 1000, 20000), true);
  // A second wrong turn can reroute before the old ten-second cooldown.
  assert.equal(isRerouteDue("vehicle", 2, 1000, 3000), true);
  assert.equal(isRerouteDue("vehicle", 3, 2000, 2000), false);
});

test("walking retains its existing confirmation and cooldown", () => {
  assert.equal(isRerouteDue("walking", 2, 3000, 11000), false);
  assert.equal(isRerouteDue("walking", 3, 2000, 11000), false);
  assert.equal(isRerouteDue("walking", 3, 3000, 9000), false);
  assert.equal(isRerouteDue("walking", 3, 3000, 11000), true);
});

const points = [{ lat: 0, lng: 0 }, { lat: 0.001, lng: 0 }];

test("display position follows both legs of a turn without cutting the corner", () => {
  const route = [{ lat: 0, lng: 0 }, { lat: 0.001, lng: 0 }, { lat: 0.001, lng: 0.001 }];
  for (let step = 0; step <= 20; step++) {
    const position = interpolateRoutePosition(route[0], route[2], route, step / 20);
    assert.ok(routeDeviation(position, route, null).distance < 0.001);
  }
  const corner = interpolateRoutePosition(route[0], route[2], route, 0.5);
  assert.ok(Math.abs(corner.lat - 0.001) < 0.000001);
  assert.ok(Math.abs(corner.lng) < 0.000001);
});

test("off-route display movement preserves the real location", () => {
  const from = { lat: 0, lng: 0.001 }, to = { lat: 0.001, lng: 0.001 };
  assert.deepEqual(interpolateRoutePosition(from, to, points, 0.5), { lat: 0.0005, lng: 0.001 });
  assert.deepEqual(interpolateRoutePosition(from, to, points, 1), to);
});

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
