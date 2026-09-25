import test from "node:test";
import assert from "node:assert/strict";
import { createRasterMapRotation, rotationSize, shortestHeadingDelta } from "./rasterMapRotation.ts";

test("raster rotation preserves SDK pan transforms and batches tile mutations", (t) => {
  class Element {
    style = { transform: "translate3d(12px, 8px, 0)", rotate: "", transformOrigin: "", maxWidth: "" };
  }
  let mutation;
  const pending = new Map();
  let nextFrame = 0;
  const globals = {
    HTMLElement: Element,
    MutationObserver: class { constructor(callback) { mutation = callback; } observe() {} disconnect() {} },
    ResizeObserver: class { observe() {} disconnect() {} },
    requestAnimationFrame: (callback) => { pending.set(++nextFrame, callback); return nextFrame; },
    cancelAnimationFrame: (id) => pending.delete(id),
  };
  const previous = new Map(Object.keys(globals).map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  Object.assign(globalThis, globals);
  t.after(() => previous.forEach((descriptor, key) => {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else delete globalThis[key];
  }));
  const surface = new Element();
  const root = { firstElementChild: surface, children: [surface] };
  const container = { style: {}, querySelector: () => root };
  let resizes = 0;
  const rotation = createRasterMapRotation(container, { clientWidth: 360, clientHeight: 800 }, () => resizes++);
  rotation.setHeading(90);
  assert.equal(surface.style.rotate, "-90deg");
  assert.equal(surface.style.transform, "translate3d(12px, 8px, 0)");
  surface.style.transform = "translate3d(24px, 16px, 0)";
  rotation.setHeading(100);
  mutation(); mutation(); mutation();
  assert.equal(pending.size, 1);
  assert.equal(resizes, 1);
  rotation.dispose();
  assert.equal(surface.style.transform, "translate3d(24px, 16px, 0)");
  assert.equal(surface.style.rotate, "");
  assert.equal(pending.size, 0);
});

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
