import test from "node:test";
import assert from "node:assert/strict";
import { isWalkingMotion } from "./walkingMotion.ts";

test("coordinate movement starts walking even with zero or missing GPS speed", () => {
  for (const speed of [0, null, NaN, -1, 0.2]) {
    assert.equal(isWalkingMotion(speed, 5, 4), true);
    assert.equal(isWalkingMotion(speed, 1, 4), false);
  }
});

test("slow fixes accumulate against the same anchor until walking is detected", () => {
  assert.deepEqual([1, 2, 3, 4].map(distance => isWalkingMotion(0, distance, 4)), [false, false, false, true]);
});

test("GPS noise and unreliable fixes do not animate a stationary character", () => {
  assert.equal(isWalkingMotion(0, 2, 3), false);
  assert.equal(isWalkingMotion(null, 5, 10), false);
  assert.equal(isWalkingMotion(1, 10, 30), false);
  assert.equal(isWalkingMotion(1, 10, NaN), false);
  assert.equal(isWalkingMotion(1, 0, 5), true);
});
