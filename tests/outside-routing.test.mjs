import test from 'node:test';
import assert from 'node:assert/strict';
import { requestRoute } from '../lib/requestRoute.ts';
import { campusWalkingRoute } from '../lib/campusRouting.ts';

const start = { lat: 11.11, lng: 77.02 };
const end = { lat: 11.100089171110856, lng: 77.0273713924278 };
const approaches = [{ lat: 11.1006791, lng: 77.0246707 }, { lat: 11.1037733, lng: 77.0245577 }];

test('Directions joins outside roads to campus after NoRoute and minimizes total distance', async () => {
  const original = globalThis.fetch;
  let requests = 0;
  const totals = approaches.map((p, i) => (i ? 100 : 2000) + campusWalkingRoute(p, end).distanceMeters);
  globalThis.fetch = async url => {
    requests++;
    const coordinates = new URL(url).pathname.split('/').at(-1).split(';').map(p => p.split(',').map(Number));
    const target = coordinates.at(-1);
    const i = approaches.findIndex(p => p.lng === target[0] && p.lat === target[1]);
    if (i < 0) return Response.json({ code: 'NoRoute' }, { status: 400 });
    return Response.json({ code: 'Ok', routes: [{ distance: i ? 100 : 2000, duration: 80, geometry: { coordinates } }] });
  };
  try {
    const route = await requestRoute(start, end, 'walking', new AbortController().signal);
    assert.equal(requests, 3);
    assert.ok(Math.abs(route.distanceMeters - Math.min(...totals)) < 1);
    assert.deepEqual(route.points[0], start);
    assert.ok(route.points.length > 3);
    assert.ok(route.destinationGapMeters < 30);
  } finally { globalThis.fetch = original; }
});

test('aborting approach fallback stops further requests', async () => {
  const original = globalThis.fetch;
  const controller = new AbortController();
  let requests = 0;
  globalThis.fetch = async () => { requests++; controller.abort(); return Response.json({ code: 'NoRoute' }); };
  try {
    await assert.rejects(requestRoute(start, end, 'walking', controller.signal), { name: 'AbortError' });
    assert.equal(requests, 1);
  } finally { globalThis.fetch = original; }
});
