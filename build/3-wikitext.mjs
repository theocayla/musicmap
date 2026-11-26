// Step 3: download the raw wikitext of each kept article, one page at a time, and record
// the links it contains plus a short intro text. Safe to stop and restart.
// Usage: node 3-wikitext.mjs <topic>
import { loadTopic, get, sleep, normTitle } from './lib.mjs';
const { T, readJSON, writeJSON } = await loadTopic();

const keep = readJSON('keep.json').map(k => k.title);
const cache = readJSON('wiki.json', { links: {} });
cache.lead = cache.lead || {}; cache.alias = cache.alias || {};
const host = `https://${T.wiki}.wikipedia.org`;
const enc = t => encodeURIComponent(t.replace(/ /g, '_'));
const linkRe = /\[\[([^\]\|#\n]+)(?:#[^\]\|]*)?(?:\|[^\]]*)?\]\]/g;

/** First paragraph of prose, stripped of templates, references and markup, cut to ~420 characters. */
function lead(txt) {
  let s = txt;
  for (let i = 0; i < 6; i++) s = s.replace(/\{\{[^{}]*\}\}/g, '');
  s = s.replace(/<ref[^>]*\/>/g, '').replace(/<ref[\s\S]*?<\/ref>/g, '').replace(/<!--[\s\S]*?-->/g, '').replace(/\{\|[\s\S]*?\|\}/g, '');
  s = s.replace(/\[\[(?:File|Image|Fichier):[^\[\]]*(?:\[\[[^\]]*\]\][^\[\]]*)*\]\]/gi, '');
  s = s.replace(/\[\[[^\]|]*\|([^\]]*)\]\]/g, '$1').replace(/\[\[([^\]]*)\]\]/g, '$1').replace(/'{2,}/g, '').replace(/<[^>]+>/g, '');
  const para = s.split(/\n\s*\n/).map(p => p.trim()).find(p => p.length > 80 && !/^[=*#|!{}]/.test(p) && !/^__/.test(p)) || '';
  const sent = para.replace(/\s+/g, ' ').replace(/\s+([,.;])/g, '$1').replace(/\(\s*[;,]?\s*\)/g, '').match(/[^.!?]+[.!?]+(\s|$)/g) || [para];
  let out = ''; for (const x of sent) { if ((out + x).length > 420 && out) break; out += x; }
  return out.trim();
}

const todo = keep.filter(t => !cache.links[t]);
console.error('to fetch', todo.length, 'of', keep.length);
let done = 0;
for (const t of todo) {
  let txt = await get(`${host}/w/index.php?title=${enc(t)}&action=raw`);
  const m = txt && txt.match(/^#(?:REDIRECT|REDIRECTION)\s*\[\[([^\]|#]+)/i);
  if (m) { cache.alias[t] = normTitle(m[1]); txt = await get(`${host}/w/index.php?title=${enc(normTitle(m[1]))}&action=raw`); }
  if (txt) {
    cache.lead[t] = lead(txt);
    const set = new Set();
    for (const mm of txt.matchAll(linkRe)) { const x = normTitle(mm[1]); if (!x.includes(':')) set.add(x); }
    cache.links[t] = [...set];
  }
  await sleep(100);
  if (++done % 200 === 0) { console.error('progress', done, '/', todo.length); writeJSON('wiki.json', cache); }
}
writeJSON('wiki.json', cache);
console.error('done', Object.keys(cache.links).length);
