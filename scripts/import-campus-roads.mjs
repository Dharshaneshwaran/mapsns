import fs from 'node:fs/promises';

// Input is the highway ways extracted from the OSM map API response.
const ways = JSON.parse((await fs.readFile('reports/campus-osm-roads.json', 'utf8')).replace(/^\uFEFF/, ''));
const roads = [], wayIds = [];
for (const way of ways) {
  const tags = Object.fromEntries(way.tags.map(({ k, v }) => [k, v]));
  if (['construction', 'proposed', 'motorway', 'motorway_link'].includes(tags.highway) || tags.foot === 'no') continue;
  // Preserve complete ways and shared junctions outside the visual boundary.
  // Clipping here disconnects the campus entrances from surrounding roads.
  if (way.points.length >= 2) { roads.push(way.points); wayIds.push(way.id); }
}
await fs.writeFile('data/campus-roads.json', JSON.stringify({
  origin: [77.02738435124179, 11.100145424602546],
  source: 'https://api.openstreetmap.org/api/0.6/map?bbox=77.0258,11.0994,77.0289,11.1044',
  attribution: '© OpenStreetMap contributors, ODbL 1.0',
  wayIds, roads,
}, null, 2) + '\n');
console.log(`Imported ${roads.length} complete road sections including campus approaches.`);
