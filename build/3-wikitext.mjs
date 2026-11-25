// Polite single-worker crawl of raw wikitext (CDN-cached) + page summaries.
import fs from 'fs';
const keep=JSON.parse(fs.readFileSync('keep.json')).map(k=>k.title);
const UA={'User-Agent':'MusicMapBuilder/1.0 (personal visualization project)'};
const sleep=ms=>new Promise(s=>setTimeout(s,ms));
const cache=fs.existsSync('wiki.json')?JSON.parse(fs.readFileSync('wiki.json')):{links:{}}; cache.extract=cache.extract||{}; cache.alias=cache.alias||{};
const enc=t=>encodeURIComponent(t.replace(/ /g,'_'));
async function get(url,json){
  for(let i=0;i<6;i++){
    try{
      const r=await fetch(url,{headers:UA});
      if(r.ok) return json?await r.json():await r.text();
      if(r.status===404) return null;
      const ra=+r.headers.get('retry-after')||0; console.error(r.status,ra);
      await sleep((ra||5*(i+1))*1000);
    }catch(e){ await sleep(3000*(i+1)); }
  }
  return null;
}
const linkRe=/\[\[([^\]\|#\n]+)(?:#[^\]\|]*)?(?:\|[^\]]*)?\]\]/g;
const nt=t=>{t=t.trim().replace(/_/g,' ').replace(/\s+/g,' '); return t.charAt(0).toUpperCase()+t.slice(1);};
function lead(txt){
  let s=txt;
  for(let i=0;i<6;i++) s=s.replace(/\{\{[^{}]*\}\}/g,'');
  s=s.replace(/<ref[^>]*\/>/g,'').replace(/<ref[\s\S]*?<\/ref>/g,'').replace(/<!--[\s\S]*?-->/g,'').replace(/\{\|[\s\S]*?\|\}/g,'');
  s=s.replace(/\[\[(?:File|Image):[^\[\]]*(?:\[\[[^\]]*\]\][^\[\]]*)*\]\]/gi,'');
  s=s.replace(/\[\[[^\]|]*\|([^\]]*)\]\]/g,'$1').replace(/\[\[([^\]]*)\]\]/g,'$1').replace(/'{2,}/g,'').replace(/<[^>]+>/g,'');
  const para=s.split(/\n\s*\n/).map(p=>p.trim()).find(p=>p.length>80&&!/^[=*#|!{}]/.test(p)&&!/^__/.test(p))||'';
  const sent=para.replace(/\s+/g,' ').replace(/\s+([,.;])/g,'$1').replace(/\(\s*[;,]?\s*\)/g,'').match(/[^.!?]+[.!?]+(\s|$)/g)||[para];
  let out=''; for(const x of sent){ if((out+x).length>420&&out) break; out+=x; }
  return out.trim();
}
const todo=keep.filter(t=>!cache.links[t]);
cache.lead=cache.lead||{};
console.error('todo',todo.length);
let done=0;
for(const t of todo){
  if(!cache.links[t]){
    let txt=await get(`https://en.wikipedia.org/w/index.php?title=${enc(t)}&action=raw`);
    const m=txt&&txt.match(/^#REDIRECT\s*\[\[([^\]|#]+)/i);
    if(m){ cache.alias[t]=nt(m[1]); txt=await get(`https://en.wikipedia.org/w/index.php?title=${enc(nt(m[1]))}&action=raw`); }
    if(txt) cache.lead[t]=lead(txt);
    if(txt){ const set=new Set(); for(const mm of txt.matchAll(linkRe)){ const x=nt(mm[1]); if(!x.includes(':')) set.add(x);} cache.links[t]=[...set]; }
  }
  await sleep(100);
  if(++done%200==0){ console.error('progress',done,'/',todo.length); fs.writeFileSync('wiki.json',JSON.stringify(cache)); }
}
fs.writeFileSync('wiki.json',JSON.stringify(cache));
console.error('done', Object.keys(cache.links).length);
