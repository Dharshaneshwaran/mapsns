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

test("coordinate-only walking continues across anchor resets on a second device", () => {
  let withSpeed = false;
  let withoutSpeed = false;
  for (const displacement of [4, 1.2, 2.4, 3.6, 1.2]) {
    withSpeed = isWalkingMotion(1.2, displacement, 4, withSpeed, 1.2);
    withoutSpeed = isWalkingMotion(null, displacement, 4, withoutSpeed, 1.2);
    assert.equal(withSpeed, true);
    assert.equal(withoutSpeed, true);
  }
  assert.equal(isWalkingMotion(0, 1.3, 4, withSpeed, 0.1), false);
  assert.equal(isWalkingMotion(null, 2.4, 4, withoutSpeed, 1.2), true);
});

test("continued walking still rejects stationary jitter and weak GPS", () => {
  assert.equal(isWalkingMotion(null, 0.3, 4, true, 0.3), false);
  assert.equal(isWalkingMotion(0, 1.2, 4, true, 1.2), true);
  assert.equal(isWalkingMotion(null, 1.2, 30, true, 1.2), false);
  assert.equal(isWalkingMotion(null, 1.2, 4, false, 1.2), false);
});
