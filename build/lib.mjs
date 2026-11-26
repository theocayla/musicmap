// Shared helpers for the build scripts.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

export const ROOT = path.dirname(fileURLToPath(import.meta.url));
export const UA = { 'User-Agent': 'ConstellationsAtlasBuilder/1.0 (personal visualization project)' };
export const sleep = ms => new Promise(s => setTimeout(s, ms));

/** Load the topic config named on the command line (`node 1-candidates.mjs art`). */
export async function loadTopic() {
  const id = process.argv[2];
  const avail = fs.readdirSync(path.join(ROOT, 'topics')).map(f => f.replace('.mjs', ''));
  if (!id || !avail.includes(id)) {
    console.error(`Usage: node ${path.basename(process.argv[1])} <topic>   (topics: ${avail.join(', ')})`);
    process.exit(1);
  }
  const T = (await import(`./topics/${id}.mjs`)).default;
  const dir = path.join(ROOT, 'cache', id);
  fs.mkdirSync(dir, { recursive: true });
  const file = name => path.join(dir, name);
  const readJSON = (name, fallback) => fs.existsSync(file(name)) ? JSON.parse(fs.readFileSync(file(name))) : fallback;
  const writeJSON = (name, v) => fs.writeFileSync(file(name), JSON.stringify(v));
  return { T, id, file, readJSON, writeJSON };
}

/** Wikidata SPARQL query with retries. */
export async function sparql(q) {
  for (let i = 0; i < 5; i++) {
    try {
      const r = await fetch('https://query.wikidata.org/sparql', {
        method: 'POST',
        headers: { ...UA, Accept: 'application/sparql-results+json', 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'query=' + encodeURIComponent(q),
      });
      if (r.ok) return (await r.json()).results.bindings;
      const ra = +r.headers.get('retry-after') || 0;
      console.error('sparql', r.status, (await r.text()).slice(0, 200));
      await sleep((ra || 5 * (i + 1)) * 1000);
    } catch (e) { console.error('sparql', e.message); await sleep(5000 * (i + 1)); }
  }
  throw new Error('SPARQL query failed repeatedly');
}

/** GET with polite retries that honour Retry-After. Returns text, JSON, or null on 404/failure. */
export async function get(url, json = false) {
  for (let i = 0; i < 6; i++) {
    try {
      const r = await fetch(url, { headers: UA });
      if (r.ok) return json ? await r.json() : await r.text();
      if (r.status === 404) return null;
      const ra = +r.headers.get('retry-after') || 0;
      console.error(r.status, ra, url.slice(0, 90));
      await sleep((ra || 5 * (i + 1)) * 1000);
    } catch (e) { await sleep(3000 * (i + 1)); }
  }
  return null;
}

export const qid = uri => uri.split('/').pop();
export const normTitle = t => { t = t.trim().replace(/_/g, ' ').replace(/\s+/g, ' '); return t.charAt(0).toUpperCase() + t.slice(1); };
