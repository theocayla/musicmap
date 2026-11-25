export async function sparql(q){
  for (let i=0;i<4;i++){
    const r = await fetch('https://query.wikidata.org/sparql', {method:'POST', headers:{'Accept':'application/sparql-results+json','Content-Type':'application/x-www-form-urlencoded','User-Agent':'MusicMapBuilder/1.0 (research script)'}, body:'query='+encodeURIComponent(q)});
    if (r.ok) return (await r.json()).results.bindings;
    console.error('sparql fail', r.status, (await r.text()).slice(0,300)); await new Promise(s=>setTimeout(s,5000));
  }
  throw new Error('sparql failed');
}
