// Step 5: filter, sort into styles, build the link graph, run the force layout and write ../data/<topic>.js
// Usage: node 5-layout.mjs <topic>      Optional env: CH (repulsion), R (style-area radius), GS (pull to style areas), TICKS
import fs from 'fs';
import path from 'path';
import * as d3 from 'd3-force';
import { loadTopic, ROOT } from './lib.mjs';
const { T, id, readJSON } = await loadTopic();

const { items, labels: L } = readJSON('details.json');
const wiki = readJSON('wiki.json');
const keepSet = new Set(readJSON('keep.json').map(k => k.title));
const NOW = new Date().getFullYear();
const OTHER = T.categories.length - 1;

const titleOf = t => wiki.alias?.[t] || wiki.redir?.[wiki.norm?.[t] || t] || wiki.norm?.[t] || t;
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const nodes = [], byTitle = new Map();

for (const d of items) {
  if (!keepSet.has(d.title)) continue;
  if (T.descRegex && !T.descRegex.test(d.desc || '')) continue;
  if (d.kind === 'group' && T.groupDescExclude?.test(d.desc || '')) continue;
  // active period
  let start = d.ws ?? (T.positions ? d.ps : null) ?? d.inc ?? (d.birth != null ? d.birth + (T.startAge || 20) : null);
  if (start == null) continue;
  if (d.kind === 'person' && d.birth != null && start < d.birth) start = d.birth + 15;
  let end = d.we ?? d.diss ?? d.death ?? NOW;
  if (d.death != null && end > d.death) end = d.death;
  if (d.kind === 'person' && d.death == null && d.birth != null && d.birth < NOW - 105) end = Math.min(end, d.birth + 80); // missing death date
  if (end < start) end = start;
  if (start > NOW) continue;
  d.start = start;
  // style
  const w = T.categorize(d, L);
  let prim = OTHER, best = 0;
  w.forEach((x, i) => { if (x > best) { best = x; prim = i; } });
  const mask = w.reduce((m, x, i) => x > 0 ? m | (1 << i) : m, 0) || (1 << OTHER);
  const title = titleOf(d.title);
  if (byTitle.has(title)) continue;
  const role = d.kind === 'group' ? T.meta.groupRole
    : cap(d.occ.map(o => L[o]).filter(o => o && T.roleRegex.test(o)).slice(0, 2).join(', ') || (d.occ[0] && L[d.occ[0]]) || T.meta.noun);
  const n = {
    id: d.id, title, orig: d.title, name: d.title.replace(/ \([^)]*\)$/, ''),
    kind: d.kind, sl: d.sl, start, end, prim, mask, birth: d.birth, death: d.death,
    country: d.country ? (L[d.country] || '') : '', role,
    tags: [...new Set(T.tags(d).map(t => L[t]).filter(Boolean))].slice(0, 6),
    text: (wiki.lead?.[d.title] || wiki.extract?.[d.title] || wiki.extract?.[title] || d.desc || '').replace(/\s+/g, ' ').slice(0, 520),
  };
  nodes.push(n); byTitle.set(title, n); byTitle.set(d.title, n);
}
for (const [r, t] of Object.entries(wiki.into || {})) { const n = byTitle.get(t); if (n && !byTitle.has(r)) byTitle.set(r, n); }
for (const [t, rs] of Object.entries(wiki.redirectsIn || {})) { const n = byTitle.get(t); if (n) rs.forEach(r => { if (!byTitle.has(r)) byTitle.set(r, n); }); }

// links (undirected; weight 2 when both articles cite each other)
const ekey = new Map();
for (const n of nodes) {
  const ls = wiki.links[n.orig] || wiki.links[n.title];
  if (!ls) continue;
  for (const t of ls) {
    const m = byTitle.get(t) || (wiki.redir?.[t] && byTitle.get(wiki.redir[t]));
    if (!m || m === n) continue;
    const a = n.id < m.id ? n : m, b = a === n ? m : n, k = a.id + '|' + b.id;
    ekey.set(k, (ekey.get(k) || 0) + 1);
  }
}
const edges = [...ekey.entries()].map(([k, w]) => { const [a, b] = k.split('|'); return { source: a, target: b, w }; });
const deg = new Map();
edges.forEach(e => { deg.set(e.source, (deg.get(e.source) || 0) + 1); deg.set(e.target, (deg.get(e.target) || 0) + 1); });
const keep = nodes.filter(n => deg.get(n.id));
console.error(id, 'nodes', nodes.length, 'connected', keep.length, 'edges', edges.length);

// layout: links pull together, everyone repels, each style is drawn gently towards its own area
const R = +process.env.R || 1100, GS = +process.env.GS || 0.035, CH = +process.env.CH || -90, TICKS = +process.env.TICKS || 500;
const anc = {};
T.anchorOrder.forEach((c, i) => { const a = i / T.anchorOrder.length * 2 * Math.PI - Math.PI / 2; anc[c] = [Math.cos(a) * R, Math.sin(a) * R]; });
T.categories.forEach((_, c) => { if (!anc[c]) anc[c] = [0, 0]; });
const sim = d3.forceSimulation(keep)
  .force('link', d3.forceLink(edges).id(n => n.id).distance(e => e.w > 1 ? 18 : 30).strength(e => (e.w > 1 ? 1 : 0.6) / Math.min(deg.get(e.source.id), deg.get(e.target.id))))
  .force('charge', d3.forceManyBody().strength(CH).theta(0.95).distanceMax(900))
  .force('collide', d3.forceCollide(n => 2 + Math.sqrt(n.sl) * 0.6).iterations(1))
  .force('x', d3.forceX(n => anc[n.prim][0]).strength(GS))
  .force('y', d3.forceY(n => anc[n.prim][1]).strength(GS))
  .stop();
for (let i = 0; i < TICKS; i++) { sim.tick(); if (i % 100 === 0) console.error('tick', i); }

const idx = new Map(keep.map((n, i) => [n.id, i]));
const N = keep.map(n => [n.name, Math.round(n.x), Math.round(n.y), n.sl, n.start, n.end, n.prim, n.mask, n.kind === 'group' ? 1 : 0,
  n.birth, n.death, n.country, n.tags.join(', '), n.text, n.title.replace(/ /g, '_'), n.role]);
const E = [];
edges.forEach(e => E.push(idx.get(e.source.id), idx.get(e.target.id)));
const month = new Date().toLocaleString('en', { month: 'short', year: 'numeric' });
const data = { meta: { ...T.meta, id, wiki: T.wiki, built: month }, cats: T.categories.map(c => c.name), colors: T.categories.map(c => c.color), nodes: N, edges: E };
const outDir = path.join(ROOT, '..', 'data');
fs.mkdirSync(outDir, { recursive: true });
const out = path.join(outDir, id + '.js');
fs.writeFileSync(out, `(window.ATLAS=window.ATLAS||{})[${JSON.stringify(id)}]=${JSON.stringify(data)};\n`);
console.error('wrote', path.relative(process.cwd(), out), (fs.statSync(out).size / 1e6).toFixed(1) + ' MB');
