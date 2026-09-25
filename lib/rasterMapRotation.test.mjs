import test from "node:test";
import assert from "node:assert/strict";
import { rotationSize, shortestHeadingDelta } from "./rasterMapRotation.ts";

test("heading crosses north using the short turn in either direction", () => {
  assert.equal(shortestHeadingDelta(359, 1), 2);
  assert.equal(shortestHeadingDelta(1, 359), -2);
  assert.equal(shortestHeadingDelta(720, 90), 90);
  assert.equal(shortestHeadingDelta(-720, 270), -90);
});

test("rotated map covers every viewport corner without changing map scale", () => {
  for (const [width, height] of [[360, 800], [800, 360], [1920, 1080]]) {
    const half = rotationSize(width, height) / 2;
    for (let angle = 0; angle < 360; angle++) {
      const radians = angle * Math.PI / 180;
      for (const x of [-width / 2, width / 2]) for (const y of [-height / 2, height / 2]) {
        assert.ok(Math.abs(x * Math.cos(radians) - y * Math.sin(radians)) < half);
        assert.ok(Math.abs(x * Math.sin(radians) + y * Math.cos(radians)) < half);
      }
    }
  }
});
