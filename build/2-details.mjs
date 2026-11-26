// Step 2: fetch details for each candidate from Wikidata (dates, genres, movements, parties,
// occupations, country, description), then decide who to keep.
// Usage: node 2-details.mjs <topic> [--refilter]   (--refilter re-applies the topic's keep rule to the saved details)
import { loadTopic, sparql, qid } from './lib.mjs';
const { T, readJSON, writeJSON } = await loadTopic();
if (process.argv.includes('--refilter')) {
  const { items, labels } = readJSON('details.json');
  const keep = items.filter(d => T.keep(d, labels));
  writeJSON('keep.json', keep.map(d => ({ title: d.title })));
  console.error('kept', keep.length, 'of', items.length);
  process.exit(0);
}

const cands = readJSON('candidates.json');
const L = {}, det = {};
cands.forEach(c => det[c.id] = { ...c, desc: '', genres: [], movements: [], parties: [], occ: [], labels: 0,
  birth: null, death: null, inc: null, diss: null, ws: null, we: null, ps: null, pe: null, country: null });
const yr = v => { const m = v.match(/^(-?)(\d+)/); return m ? (m[1] ? -1 : 1) * +m[2] : null; };
const B = 250;
for (let i = 0; i < cands.length; i += B) {
  const vals = cands.slice(i, i + B).map(c => 'wd:' + c.id).join(' ');
  const id = b => qid(b.x.value);
  for (const [p, key] of [['P569', 'birth'], ['P570', 'death'], ['P571', 'inc'], ['P576', 'diss'], ['P2031', 'ws'], ['P2032', 'we']]) {
    const rows = await sparql(`SELECT ?x (MIN(STR(?v)) AS ?t) WHERE { VALUES ?x {${vals}} ?x wdt:${p} ?v . } GROUP BY ?x`);
    rows.forEach(b => { det[id(b)][key] = yr(b.t.value); });
  }
  // multi-valued items with English labels, in statement order
  for (const [p, key] of [['P136', 'genres'], ['P135', 'movements'], ['P102', 'parties'], ['P106', 'occ']]) {
    const rows = await sparql(`SELECT ?x ?v ?vl WHERE { VALUES ?x {${vals}} ?x p:${p} ?st . ?st ps:${p} ?v . ?st wikibase:rank ?r . FILTER(?r != wikibase:DeprecatedRank) OPTIONAL{?v rdfs:label ?vl FILTER(LANG(?vl)='en')} }`);
    rows.forEach(b => { const v = qid(b.v.value); det[id(b)][key].push(v); if (b.vl) L[v] = b.vl.value; });
  }
  if (T.positions) {
    const rows = await sparql(`SELECT ?x (MIN(STR(?s)) AS ?s0) (MAX(STR(?e)) AS ?e0) WHERE { VALUES ?x {${vals}} ?x p:P39 ?st . OPTIONAL{?st pq:P580 ?s} OPTIONAL{?st pq:P582 ?e} } GROUP BY ?x`);
    rows.forEach(b => { if (b.s0) det[id(b)].ps = yr(b.s0.value); if (b.e0) det[id(b)].pe = yr(b.e0.value); });
  }
  let rows = await sparql(`SELECT ?x (COUNT(?l) AS ?n) WHERE { VALUES ?x {${vals}} ?x wdt:P264 ?l . } GROUP BY ?x`);
  rows.forEach(b => det[id(b)].labels = +b.n.value);
  rows = await sparql(`SELECT ?x ?d WHERE { VALUES ?x {${vals}} ?x schema:description ?d FILTER(LANG(?d)='en') }`);
  rows.forEach(b => det[id(b)].desc = b.d.value);
  rows = await sparql(`SELECT ?x ?c ?cl ?p WHERE { VALUES ?x {${vals}} VALUES ?p {wdt:P27 wdt:P495 wdt:P740} ?x ?p ?c . ?c rdfs:label ?cl FILTER(LANG(?cl)='en') }`);
  const pr = { P495: 0, P740: 1, P27: 2 };
  rows.forEach(b => {
    const d = det[id(b)], p = pr[qid(b.p.value)];
    if (d.country == null || p < d._cp) { d.country = qid(b.c.value); d._cp = p; L[d.country] = b.cl.value; }
  });
  console.error(Math.min(i + B, cands.length), '/', cands.length);
}
const items = Object.values(det);
for (const d of items) { for (const k of ['genres', 'movements', 'parties', 'occ']) d[k] = [...new Set(d[k])]; delete d._cp; }
writeJSON('details.json', { items, labels: L });

const keep = items.filter(d => T.keep(d, L));
writeJSON('keep.json', keep.map(d => ({ title: d.title })));
console.error('kept', keep.length, 'of', items.length);
