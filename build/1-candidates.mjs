// Step 1: query Wikidata for people (and groups) of the topic above a fame threshold.
// Usage: node 1-candidates.mjs <topic>
import { loadTopic, sparql, qid } from './lib.mjs';
const { T, writeJSON } = await loadTopic();

const out = new Map();
const site = `<https://${T.wiki}.wikipedia.org/>`;
async function run(where, min, kind) {
  const rows = await sparql(`SELECT DISTINCT ?x ?sl ?art WHERE { ${where} ?x wikibase:sitelinks ?sl . FILTER(?sl >= ${min}) ?art schema:about ?x; schema:isPartOf ${site} . }`);
  for (const b of rows) {
    const id = qid(b.x.value);
    if (out.has(id)) continue;
    out.set(id, { id, kind, sl: +b.sl.value, title: decodeURIComponent(b.art.value.split('/wiki/')[1]).replace(/_/g, ' ') });
  }
  console.error(kind, rows.length, '→ total', out.size);
}
for (const o of T.persons.occupations)
  await run(`?x wdt:P106 wd:${o}; wdt:P31 wd:Q5 . ${T.persons.where || ''}`, T.persons.min, 'person');
for (const g of T.groups?.classes || [])
  await run(`?x wdt:P31 wd:${g} .`, T.groups.min, 'group');

writeJSON('candidates.json', [...out.values()]);
console.error('candidates:', out.size);
