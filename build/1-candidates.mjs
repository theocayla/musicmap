import {sparql} from './sparql.mjs';
import fs from 'fs';
const occs = ['Q639669','Q177220','Q36834','Q753110','Q488205','Q2252262','Q130857','Q486748','Q855091','Q158852','Q1259917','Q806349','Q386854','Q2643890','Q183945'];
const groups = ['Q215380','Q5741069','Q2088357','Q9212979','Q216337','Q641066','Q56816954','Q281643','Q14946528','Q1191899'];
// Usage: node 1-candidates.mjs [minSitelinks=30]
const MIN = +process.argv[2]||30;
const out = new Map();
async function run(q,kind){
  const rows = await sparql(q);
  for (const b of rows){ const id=b.x.value.split('/').pop(); out.set(id,{id,kind,sl:+b.sl.value,title:decodeURIComponent(b.art.value.split('/wiki/')[1]).replace(/_/g,' ')}); }
  console.error(kind, rows.length);
}
for (const o of occs){
  await run(`SELECT DISTINCT ?x ?sl ?art WHERE { ?x wdt:P106 wd:${o}; wdt:P31 wd:Q5; wikibase:sitelinks ?sl . FILTER(?sl >= ${MIN}) ?art schema:about ?x; schema:isPartOf <https://en.wikipedia.org/> . }`, 'person');
}
for (const g of groups){
  await run(`SELECT DISTINCT ?x ?sl ?art WHERE { ?x wdt:P31 wd:${g}; wikibase:sitelinks ?sl . FILTER(?sl >= ${Math.round(MIN*0.6)}) ?art schema:about ?x; schema:isPartOf <https://en.wikipedia.org/> . }`, 'group');
}
fs.writeFileSync('candidates.json', JSON.stringify([...out.values()]));
console.error('total', out.size);
