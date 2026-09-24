import { test } from "node:test";
import assert from "node:assert/strict";
import { VisitorPresence, approximateArea, ACTIVE_WINDOW_MS } from "../lib/visitorPresence.ts";

test("repeat heartbeats from the same browser count once", () => {
  const store = new VisitorPresence();
  store.heartbeat("a", null, 1000);
  store.heartbeat("a", null, 2000);
  store.heartbeat("b", null, 2000);
  assert.equal(store.summary(2000).online, 2);
  assert.equal(store.summary(2000).sharing, 0);
});
test("inactive visitors and their locations expire at two minutes", () => {
  const store = new VisitorPresence();
  store.heartbeat("a", { lat: 11.1, lng: 77.02 }, 1000);
  assert.equal(store.summary(1000 + ACTIVE_WINDOW_MS - 1).sharing, 1);
  assert.deepEqual(store.summary(1000 + ACTIVE_WINDOW_MS), { online: 0, sharing: 0, cells: [], updatedAt: 121000 });
});
test("locations are rounded, aggregated, replaced when moving, and removed on opt-out", () => {
  const store = new VisitorPresence();
  const area = approximateArea({ lat: 11.10012, lng: 77.02713, accuracy: 20 });
  assert.deepEqual(area, { lat: 11.10012, lng: 77.02713 });
  store.heartbeat("a", area, 1000);
  store.heartbeat("b", area, 1000);
  assert.deepEqual(store.summary(1000).cells, [{ ...area, count: 2 }]);
  store.heartbeat("a", { lat: 11.102, lng: 77.028 }, 2000);
  assert.equal(store.summary(2000).cells.length, 2);
  store.heartbeat("a", null, 3000);
  const summary = store.summary(3000);
  assert.equal(summary.online, 2);
  assert.equal(summary.sharing, 1);
  assert.deepEqual(summary.cells, [{ ...area, count: 1 }]);
  assert.equal(JSON.stringify(summary).includes('"id"'), false);
});
test("inaccurate positions are omitted and malformed coordinates rejected", () => {
  assert.equal(approximateArea(null), null);
  assert.equal(approximateArea({ lat: 11.1, lng: 77, accuracy: 151 }), null);
  for (const location of ["invalid", { lat: NaN, lng: 77, accuracy: 10 }, { lat: 91, lng: 77, accuracy: 10 }, { lat: 11, lng: 181, accuracy: 10 }, { lat: 11, lng: 77, accuracy: -1 }]) assert.throws(() => approximateArea(location));
});
