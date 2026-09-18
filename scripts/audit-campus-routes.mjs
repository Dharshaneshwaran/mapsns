import fs from 'node:fs/promises';
import ts from 'typescript';

const boundaryModule = { exports: {} };
new Function('exports', ts.transpileModule(await fs.readFile('data/campusBoundary.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText)(boundaryModule.exports);
const { isInsideCampus, CAMPUS_BOUNDARY } = boundaryModule.exports;
const reportOnly = process.argv.includes('--report-only');
const saved = reportOnly ? JSON.parse(await fs.readFile('reports/campus-route-audit.json', 'utf8')) : null;
const document = reportOnly ? null : await fetch('https://mapsns.vercel.app/api/map-images', { signal: AbortSignal.timeout(15000) }).then(r => { if (!r.ok) throw Error(`Published map HTTP ${r.status}`); return r.json(); });
const places = saved?.places ?? document.images.map(({ id, name, lat, lng }) => ({ id, name, lat, lng, inside: isInsideCampus(lat, lng) }));
const report = saved ?? { checkedAt: new Date().toISOString(), revision: document.revision, boundary: CAMPUS_BOUNDARY, places, modes: {} };
await fs.mkdir('reports', { recursive: true });
let lastRequest = 0;
async function query(url) {
  await new Promise(resolve => setTimeout(resolve, Math.max(0, 1150 - (Date.now() - lastRequest))));
  lastRequest = Date.now();
  const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (response.status === 429) throw Error('Routing service rate limit: audit stopped');
  const data = await response.json();
  if (!response.ok && !['NoSegment', 'NoRoute'].includes(data.code)) throw Error(`Routing service HTTP ${response.status}`);
  return data;
}
async function save() { await fs.writeFile('reports/campus-route-audit.json', JSON.stringify(report, null, 2)); }
for (const [mode, profile, limit] of reportOnly ? [] : [['walking', 'foot', 30], ['vehicle', 'car', 50]]) {
  const base = `https://routing.openstreetmap.de/routed-${profile}`;
  const apiProfile = profile === 'car' ? 'driving' : 'foot';
  const result = report.modes[mode] = { endpoint: base, snapLimitMeters: limit, markers: [], routes: [] };
  for (const place of places) {
    const data = await query(`${base}/nearest/v1/${apiProfile}/${place.lng},${place.lat}?number=1`);
    const waypoint = data.waypoints?.[0];
    result.markers.push({ id: place.id, name: place.name, distance: waypoint?.distance ?? null, snapped: waypoint?.location ?? null, reachable: data.code === 'Ok' && waypoint?.distance <= limit, snappedInside: waypoint ? isInsideCampus(waypoint.location[1], waypoint.location[0]) : null });
  }
  console.log(mode, 'marker checks:', JSON.stringify(result.markers));
  for (const start of places) for (const end of places) {
    if (start.id === end.id) continue;
    const record = { from: start.name, to: end.name };
    if (![start, end].every(p => result.markers.find(m => m.id === p.id).reachable)) record.status = 'endpoint-too-far';
    else {
      const data = await query(`${base}/route/v1/${apiProfile}/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson&radiuses=${limit};${limit}`);
      const route = data.routes?.[0];
      if (data.code !== 'Ok' || !route) record.status = data.code || 'invalid-response';
      else {
        record.distanceMeters = route.distance;
        record.durationSeconds = route.duration;
        record.coordinates = route.geometry.coordinates;
        // This campus polygon is convex; endpoints inside imply each segment stays inside.
        record.outsidePoints = record.coordinates.filter(([lng, lat]) => !isInsideCampus(lat, lng)).length;
        record.status = record.outsidePoints ? 'leaves-campus' : 'inside-campus';
      }
    }
    result.routes.push(record);
    await save();
    if (result.routes.length % 30 === 0) console.log(mode, result.routes.length, '/', places.length * (places.length - 1));
  }
  result.counts = result.routes.reduce((counts, row) => ({ ...counts, [row.status]: (counts[row.status] || 0) + 1 }), {});
  console.log(mode, JSON.stringify(result.counts));
}
await save();
const lines = ['# Campus route audit', '', `Checked: ${report.checkedAt}`, `Published revision: ${report.revision}`, '', 'Uses the published destination pins, the repository campus boundary, and the default walking/vehicle routing services. Both directions are checked. Missing endpoints are classified from nearest-path distances without requesting an impossible route. This does not verify physical accessibility or routes from every possible GPS position.', '', `Destinations inside boundary: ${places.filter(p => p.inside).length}/${places.length}`, ''];
for (const [mode, data] of Object.entries(report.modes)) {
  lines.push(`## ${mode}`, '', JSON.stringify(data.counts), '', '| Destination | Nearest mapped path (m) | Within snap limit | Snapped inside campus |', '|---|---:|---|---|');
  for (const p of data.markers) lines.push(`| ${p.name} | ${p.distance?.toFixed(1) ?? 'unavailable'} | ${p.reachable ? 'yes' : 'no'} | ${p.snappedInside ? 'yes' : 'no'} |`);
  lines.push('', '### Routes leaving campus', '');
  const outside = data.routes.filter(r => r.status === 'leaves-campus');
  lines.push(...(outside.length ? outside.map(r => `- ${r.from} → ${r.to}: ${Math.round(r.distanceMeters)} m`) : ['None among returned routes.']), '');
  lines.push('### All destination pairs', '', 'I = inside campus; O = leaves campus; E = endpoint beyond snap limit; N = no connected route; ? = other service result.', '', '| From / To | ' + places.map((_, i) => i + 1).join(' | ') + ' |', '|---|' + places.map(() => '---|').join(''));
  for (const [i, start] of places.entries()) lines.push(`| ${i + 1}. ${start.name} | ` + places.map(end => {
    if (start.id === end.id) return '—';
    const route = data.routes.find(r => r.from === start.name && r.to === end.name);
    return ({ 'inside-campus': 'I', 'leaves-campus': 'O', 'endpoint-too-far': 'E', NoRoute: 'N', NoSegment: 'E' })[route?.status] || '?';
  }).join(' | ') + ' |');
  lines.push('');
}
await fs.writeFile('reports/campus-route-audit.md', lines.join('\n'));
console.log('Audit complete: reports/campus-route-audit.md');
