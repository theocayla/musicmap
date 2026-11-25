// Fetch redirect titles pointing INTO each artist page (titles only), one request at a time.
import fs from 'fs';
const cache=JSON.parse(fs.readFileSync('wiki.json'));
const titles=JSON.parse(fs.readFileSync('keep.json')).map(k=>cache.alias?.[k.title]||k.title);
const UA={'User-Agent':'MusicMapBuilder/1.0 (personal visualization project)'};
const sleep=ms=>new Promise(s=>setTimeout(s,ms));
const into={};
for(let i=0;i<titles.length;i+=50){
  const batch=titles.slice(i,i+50); let cont={};
  while(true){
    const qs=new URLSearchParams({action:'query',format:'json',formatversion:'2',prop:'redirects',rdlimit:'max',rdnamespace:'0',titles:batch.join('|'),...cont});
    let j=null;
    for(let a=0;a<6&&!j;a++){ try{ const r=await fetch('https://en.wikipedia.org/w/api.php?'+qs,{headers:UA}); if(r.ok) j=await r.json(); else { const ra=+r.headers.get('retry-after')||5; console.error(r.status,ra); await sleep(ra*1000);} }catch(e){ await sleep(3000);} }
    if(!j) break;
    const norm={}; (j.query?.normalized||[]).forEach(n=>norm[n.to]=n.from);
    (j.query?.pages||[]).forEach(p=>{ (p.redirects||[]).forEach(r=>{ into[r.title]=norm[p.title]||p.title; }); });
    await sleep(200);
    if(!j.continue) break; cont=j.continue;
  }
  if((i/50)%20==0) console.error('batch',i,'/',titles.length);
}
cache.into=into;
fs.writeFileSync('wiki.json',JSON.stringify(cache));
console.error('done', Object.keys(into).length);
