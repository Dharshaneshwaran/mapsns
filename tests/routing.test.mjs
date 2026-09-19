import { test } from "node:test";
import assert from "node:assert/strict";
import { requestRoute } from "../lib/requestRoute.ts";
import { routeDeviation, remainingRoute } from "../lib/routeDeviation.ts";

test("campus trips reject outside detours and select an inside alternative", async () => {
  const original = globalThis.fetch;
  const start = { lat: 11.1040, lng: 77.0279 };
  const end = { lat: 11.1038, lng: 77.0279 };
  const inside = { distance: 100, duration: 80, geometry: { coordinates: [[start.lng, start.lat], [end.lng, end.lat]] } };
  const outside = { distance: 520, duration: 420, geometry: { coordinates: [[start.lng, start.lat], [77.0255, 11.0995], [end.lng, end.lat]] } };
  let routes = [outside];
  try {
    globalThis.fetch = async () => Response.json({ code: "Ok", routes });
    for (const mode of ["walking", "vehicle"]) {
      await assert.rejects(requestRoute(start, end, mode, new AbortController().signal), /No mapped route stays inside campus/);
    }
    routes = [outside, inside];
    assert.equal((await requestRoute(start, end, "walking", new AbortController().signal)).distanceMeters, 100);
    routes = [inside];
    assert.equal((await requestRoute(start, end, "walking", new AbortController().signal)).distanceMeters, 100);
  } finally { globalThis.fetch = original; }
});

test("completed route disappears through corners without mutating navigation geometry", () => {
  const points = [{ lat: 0, lng: 0 }, { lat: 0.001, lng: 0 }, { lat: 0.001, lng: 0.001 }];
  const halfway = remainingRoute({ lat: 0.0005, lng: 0 }, points);
  assert.deepEqual(halfway.points, [{ lat: 0.0005, lng: 0 }, ...points.slice(1)]);
  const aroundCorner = remainingRoute({ lat: 0.001, lng: 0.0005 }, points, halfway.progress);
  assert.deepEqual(aroundCorner.points, [{ lat: 0.001, lng: 0.0005 }, points[2]]);
  assert.deepEqual(remainingRoute({ lat: 0.001, lng: 0.0004 }, points, aroundCorner.progress), aroundCorner);
  assert.deepEqual(remainingRoute({ lat: 0.003, lng: 0.001 }, points, aroundCorner.progress), aroundCorner);
  assert.deepEqual(remainingRoute(points[2], points, aroundCorner.progress).points, []);
  assert.equal(points.length, 3);
  assert.deepEqual(remainingRoute(points[0], points).points, points);
});

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

test("rejects routes snapped away from either endpoint and explains missing paths", async () => {
  const original = globalThis.fetch;
  const start = { lat: 11, lng: 77 }, end = { lat: 11.001, lng: 77.001 };
  let coordinates = [[77.002, 11], [77.001, 11.001]];
  try {
    globalThis.fetch = async (url) => {
      assert.equal(new URL(url).searchParams.get("radiuses"), "30;30");
      return Response.json({ code: "Ok", routes: [{ distance: 250, duration: 190, geometry: { coordinates } }] });
    };
    await assert.rejects(requestRoute(start, end, "walking", new AbortController().signal), /does not reach/);
    coordinates = [[77, 11], [77.003, 11.001]];
    await assert.rejects(requestRoute(start, end, "walking", new AbortController().signal), /does not reach/);
    globalThis.fetch = async () => Response.json({ code: "NoSegment" }, { status: 400 });
    await assert.rejects(requestRoute(start, end, "walking", new AbortController().signal), /campus footpaths may be missing/);
    globalThis.fetch = async () => Response.json({ code: "NoRoute" }, { status: 400 });
    await assert.rejects(requestRoute(start, end, "walking", new AbortController().signal), /walkways may be missing or disconnected/);
    globalThis.fetch = async () => new Response("Bad Gateway", { status: 502 });
    await assert.rejects(requestRoute(start, end, "walking", new AbortController().signal), /HTTP 502/);
  } finally { globalThis.fetch = original; }
});
