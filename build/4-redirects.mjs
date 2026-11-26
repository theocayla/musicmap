// Step 4: fetch the alternative page names (redirects) pointing to each kept article,
// so links such as [[Beatles]] count for "The Beatles". Titles only, one request at a time.
// Usage: node 4-redirects.mjs <topic>
import { loadTopic, get, sleep } from './lib.mjs';
const { T, readJSON, writeJSON } = await loadTopic();

const cache = readJSON('wiki.json');
const titles = readJSON('keep.json').map(k => cache.alias?.[k.title] || k.title);
const api = `https://${T.wiki}.wikipedia.org/w/api.php?`;
const into = {};
for (let i = 0; i < titles.length; i += 50) {
  const batch = titles.slice(i, i + 50);
  let cont = {};
  while (true) {
    const qs = new URLSearchParams({ action: 'query', format: 'json', formatversion: '2', prop: 'redirects', rdlimit: 'max', rdnamespace: '0', titles: batch.join('|'), ...cont });
    const j = await get(api + qs, true);
    if (!j) break;
    const norm = {}; (j.query?.normalized || []).forEach(n => norm[n.to] = n.from);
    (j.query?.pages || []).forEach(p => (p.redirects || []).forEach(r => { into[r.title] = norm[p.title] || p.title; }));
    await sleep(200);
    if (!j.continue) break;
    cont = j.continue;
  }
  if ((i / 50) % 20 === 0) console.error('batch', i, '/', titles.length);
}
cache.into = into;
writeJSON('wiki.json', cache);
console.error('done', Object.keys(into).length, 'redirects');
