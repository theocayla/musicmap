import {sparql} from './sparql.mjs';
import fs from 'fs';
const cands = JSON.parse(fs.readFileSync('candidates.json'));
const L={}; const det={};
cands.forEach(c=>det[c.id]={...c,desc:'',genres:[],occ:[],labels:0,birth:null,death:null,inc:null,diss:null,ws:null,we:null,country:null});
const yr=v=>{const m=v.match(/^(-?)(\d+)/); return m?(m[1]?-1:1)*+m[2]:null;};
const B=250;
for(let i=0;i<cands.length;i+=B){
  const vals=cands.slice(i,i+B).map(c=>'wd:'+c.id).join(' ');
  const id=b=>b.x.value.split('/').pop();
  // dates
  for(const [p,key] of [['P569','birth'],['P570','death'],['P571','inc'],['P576','diss'],['P2031','ws'],['P2032','we']]){
    const rows=await sparql(`SELECT ?x (MIN(STR(?v)) AS ?t) WHERE { VALUES ?x {${vals}} ?x wdt:${p} ?v . } GROUP BY ?x`);
    rows.forEach(b=>{ det[id(b)][key]=yr(b.t.value); });
  }
  let rows=await sparql(`SELECT ?x ?g ?gl WHERE { VALUES ?x {${vals}} ?x p:P136 ?st . ?st ps:P136 ?g . ?st wikibase:rank ?r . FILTER(?r != wikibase:DeprecatedRank) OPTIONAL{?g rdfs:label ?gl FILTER(LANG(?gl)='en')} }`);
  rows.forEach(b=>{ const g=b.g.value.split('/').pop(); det[id(b)].genres.push(g); if(b.gl) L[g]=b.gl.value; });
  rows=await sparql(`SELECT ?x ?o WHERE { VALUES ?x {${vals}} ?x wdt:P106 ?o . }`);
  rows.forEach(b=>det[id(b)].occ.push(b.o.value.split('/').pop()));
  rows=await sparql(`SELECT ?x (COUNT(?l) AS ?n) WHERE { VALUES ?x {${vals}} ?x wdt:P264 ?l . } GROUP BY ?x`);
  rows.forEach(b=>det[id(b)].labels=+b.n.value);
  rows=await sparql(`SELECT ?x ?d WHERE { VALUES ?x {${vals}} ?x schema:description ?d FILTER(LANG(?d)='en') }`);
  rows.forEach(b=>det[id(b)].desc=b.d.value);
  rows=await sparql(`SELECT ?x ?c ?cl ?p WHERE { VALUES ?x {${vals}} VALUES ?p {wdt:P27 wdt:P495 wdt:P740} ?x ?p ?c . ?c rdfs:label ?cl FILTER(LANG(?cl)='en') }`);
  const pr={'P495':0,'P740':1,'P27':2};
  rows.forEach(b=>{ const d=det[id(b)]; const p=pr[b.p.value.split('/').pop()]; if(d.country==null||p<d._cp){ d.country=b.c.value.split('/').pop(); d._cp=p; L[d.country]=b.cl.value; } });
  console.error(i+B,'/',cands.length);
}
for(const d of Object.values(det)){ d.genres=[...new Set(d.genres)]; delete d._cp; }
fs.writeFileSync('details.json', JSON.stringify({items:Object.values(det), labels:L}));
// Keep people who are clearly musicians (have a genre or record label, or are pre-1910 composers/performers) and all groups
const MUSIC_OCC=new Set(['Q36834','Q486748','Q158852','Q1259917','Q806349','Q386854']);
const keep=Object.values(det).filter(d=>d.kind==='group'||d.genres.length||d.labels||(d.birth!=null&&d.birth<1910&&d.occ.some(o=>MUSIC_OCC.has(o))));
fs.writeFileSync('keep.json', JSON.stringify(keep.map(d=>({title:d.title}))));
console.error('done', keep.length, 'artists kept');
