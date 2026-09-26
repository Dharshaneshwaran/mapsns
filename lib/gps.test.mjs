import test from "node:test";
import assert from "node:assert/strict";
import { isUsableGpsFix, gpsErrorMessage, isArrivalFix } from "./gps.ts";

const now = 100000;
const fix = (coords = {}, timestamp = now) => ({ timestamp, coords: { latitude: 11.1, longitude: 77.02, accuracy: 5, ...coords } });

test("arrival includes seven metres and requires a fresh accurate GPS fix", () => {
  for (const distance of [0, 5, 6.9, 7]) assert.equal(isArrivalFix(fix(), distance, now), true);
  for (const distance of [7.01, 8, -1, NaN, Infinity]) assert.equal(isArrivalFix(fix(), distance, now), false);
  assert.equal(isArrivalFix(fix({ accuracy: 15 }), 7, now), true);
  assert.equal(isArrivalFix(fix({ accuracy: 16 }), 7, now), false);
  assert.equal(isArrivalFix(fix({}, now - 15001), 7, now), false);
});

test("GPS accepts fresh accurate fixes and rejects stale, inaccurate or invalid locations", () => {
  assert.equal(isUsableGpsFix(fix(), 25, now), true);
  for (const sample of [fix({}, now - 15001), fix({}, now + 1), fix({}, NaN), fix({ accuracy: 26 }), fix({ accuracy: -1 }), fix({ accuracy: NaN }), fix({ latitude: 91 }), fix({ longitude: Infinity })]) {
    assert.equal(isUsableGpsFix(sample, 25, now), false);
  }
});

test("native browser GPS errors receive distinct actionable messages", () => {
  assert.match(gpsErrorMessage({ code: 1 }), /permission was denied/);
  assert.match(gpsErrorMessage({ code: 2 }), /unavailable/);
  assert.match(gpsErrorMessage({ code: 3 }), /timed out/);
  assert.equal(gpsErrorMessage(new Error("Routing failed")), "Routing failed");
});
