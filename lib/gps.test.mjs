import test from "node:test";
import assert from "node:assert/strict";
import { isUsableGpsFix, gpsErrorMessage } from "./gps.ts";

const now = 100000;
const fix = (coords = {}, timestamp = now) => ({ timestamp, coords: { latitude: 11.1, longitude: 77.02, accuracy: 5, ...coords } });

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
