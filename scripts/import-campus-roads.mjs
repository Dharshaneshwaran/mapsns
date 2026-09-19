import fs from 'node:fs/promises';
import { isInsideCampus } from '../data/campusBoundary.ts';

// Input is the highway ways extracted from the OSM map API response.
const ways = JSON.parse((await fs.readFile('reports/campus-osm-roads.json', 'utf8')).replace(/^\uFEFF/, ''));
const roads = [], wayIds = [];
for (const way of ways) {
  const tags = Object.fromEntries(way.tags.map(({ k, v }) => [k, v]));
  if (['construction', 'proposed', 'motorway', 'motorway_link'].includes(tags.highway) || tags.foot === 'no') continue;
  let current = [];
  const finish = () => {
    if (current.length >= 2) { roads.push(current); wayIds.push(way.id); }
    current = [];
  };
  for (const point of way.points) {
    if (isInsideCampus(point[1], point[0])) current.push(point);
    else finish();
  }
  finish();
}
await fs.writeFile('data/campus-roads.json', JSON.stringify({
  origin: [77.02738435124179, 11.100145424602546],
  source: 'https://api.openstreetmap.org/api/0.6/map?bbox=77.0258,11.0994,77.0289,11.1044',
  attribution: '© OpenStreetMap contributors, ODbL 1.0',
  wayIds, roads,
}, null, 2) + '\n');
console.log(`Imported ${roads.length} internal road sections without adding connections across gaps.`);
