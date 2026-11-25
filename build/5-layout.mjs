import fs from 'fs';
import * as d3 from 'd3-force';
const {items, labels:L} = JSON.parse(fs.readFileSync('details.json'));
const wiki = JSON.parse(fs.readFileSync(process.env.WIKI||'wiki.json'));
const NOW=2026;
const CATS=[
 ['Classical',/classical|opera|baroque|romantic music|romanticism|symphon|chamber music|art song|requiem|sacred music|oratorio|concerto|ballet|renaissance music|church music|lied|film score|impressionism in music|minimalis|cantata|madrigal|serialism|neoclassic|sonata|polyphony|medieval music|mass |motet|orchestral|choral/i],
 ['Rock',/rock|grunge|new wave|shoegaze|britpop|psychedelia|garage|krautrock|post-punk/i],
 ['Pop',/pop|schlager|chanson|easy listening|traditional pop|vocal music|musical theatre|show tune|cabaret|teen|bubblegum|adult contemporary|enka|cantopop|mandopop/i],
 ['Hip hop',/hip hop|hip-hop|rap|trap music|grime|drill|gangsta|crunk|boom bap|horrorcore/i],
 ['R&B & Soul',/rhythm and blues|r&b|soul|funk|motown|gospel|new jack|quiet storm|disco|doo-wop|boogie/i],
 ['Electronic',/electronic|house|techno|trance|dubstep|drum and bass|edm|ambient|electro|industrial|idm|big beat|downtempo|trip hop|dance music|eurodance|breakbeat|uk garage|synth|hardstyle|jungle|chiptune|vaporwave|hyperpop|experimental/i],
 ['Metal',/metal|metalcore|grindcore|djent|thrash/i],
 ['Punk',/punk|hardcore|emo|riot grrrl|oi!/i],
 ['Jazz',/jazz|swing|bebop|big band|ragtime|bossa nova|fusion|dixieland/i],
 ['Blues',/blues/i],
 ['Country & Folk',/country|bluegrass|americana|honky|western|folk|singer-songwriter|traditional music|celtic|skiffle|cajun|zydeco/i],
 ['Latin',/latin|salsa|reggaeton|samba|tango|bachata|merengue|cumbia|mariachi|ranchera|flamenco|música popular brasileira|mpb|bolero|norteño|banda|son cubano|mambo|bossa|tropical|regional mexican|sertanejo|vallenato|fado/i],
 ['Reggae & Caribbean',/reggae|ska|dancehall|\bdub\b|rocksteady|calypso|soca|afrobeat|afropop|highlife|world music|zouk|kompa|rai|bhangra|qawwali|filmi/i],
];
const catsOf=label=>{ const out=[]; CATS.forEach(([n,re],i)=>{ if(re.test(label)) out.push(i); }); if(/rhythm and blues|r&b/i.test(label)) return out.filter(i=>i!==9); return out; };
const MUSIC_DESC=/music|singer|compos|band|rapper|rap |pian|violin|guitar|conduct|\bDJ\b|disc jockey|songwrit|record producer|drummer|vocal|organist|cellist|bass|group|duo|trio|quartet|orchestra|ensemble|idol|trumpet|sax|lyric|opera|hip hop|tenor|soprano|baritone|mezzo|contralto|musician|chanteu|cantante|flaut|harpsichord|lutenist|troubadour|minstrel|choir|keyboardist|percussion|beatbox|producer|K-pop|J-pop|record/i;
const MUSIC_OCC=new Set(['Q36834','Q486748','Q158852','Q1259917','Q806349','Q386854']); // composer, pianist, conductor, violinist, organist, cellist
// title resolution
const titleOf=t=> wiki.alias?.[t] || wiki.redir?.[wiki.norm?.[t]||t] || wiki.norm?.[t] || t;
const nodes=[]; const byTitle=new Map();
for(const d of items){
  const isClassicalEra = d.birth!=null && d.birth<1910 && d.occ.some(o=>MUSIC_OCC.has(o));
  if(d.kind==='person' && !(d.genres.length || d.labels || isClassicalEra)) continue;
  if(!MUSIC_DESC.test(d.desc||'')) continue;
  let start = d.ws ?? d.inc ?? (d.birth!=null? d.birth+20 : null);
  if(start==null) continue;
  if(d.kind==='person' && d.birth!=null && start<d.birth) start=d.birth+15;
  let end = d.we ?? d.diss ?? d.death ?? NOW;
  if(d.death!=null && end>d.death) end=d.death;
  if(end<start) end=start;
  if(start>NOW) continue;
  const w=new Array(CATS.length).fill(0);
  d.genres.forEach((g,i)=>catsOf(L[g]||'').forEach(c=>w[c]+=1/(1+0.35*i)));
  if(isClassicalEra && !w.some(x=>x>0)) w[0]=1;
  let prim=-1, best=0; w.forEach((x,i)=>{ if(x>best){best=x;prim=i;} });
  const mask=w.reduce((m,x,i)=>x>0?m|(1<<i):m,0);
  const title=titleOf(d.title);
  if(byTitle.has(title)) continue;
  const n={id:d.id,title,orig:d.title,name:d.title.replace(/ \((band|musician|singer|composer|group|rapper|American band|British band|English band|DJ|producer|entertainer|pianist|conductor|singer-songwriter)\)$/,''),
    kind:d.kind, sl:d.sl, start, end, prim, mask, birth:d.birth, death:d.death, inc:d.inc, diss:d.diss,
    country:d.country?L[d.country]:'', genres:d.genres.map(g=>L[g]).filter(Boolean).slice(0,6), desc:d.desc,
    extract:(wiki.lead?.[d.title]||wiki.extract?.[d.title]||wiki.extract?.[title]||'')};
  nodes.push(n); byTitle.set(title,n); byTitle.set(d.title,n);
}
for(const [r,t] of Object.entries(wiki.into||{})){ const n=byTitle.get(t); if(n&&!byTitle.has(r)) byTitle.set(r,n); }
for(const [t,rs] of Object.entries(wiki.redirectsIn||{})){ const n=byTitle.get(t); if(n) rs.forEach(r=>{ if(!byTitle.has(r)) byTitle.set(r,n); }); }
// edges
const ekey=new Map();
for(const n of nodes){
  const ls=wiki.links[n.orig]||wiki.links[n.title]; if(!ls) continue;
  for(const t of ls){ const m=byTitle.get(t)||(wiki.redir?.[t]&&byTitle.get(wiki.redir[t])); if(!m||m===n) continue;
    const a=n.id<m.id?n:m, b=a===n?m:n; const k=a.id+'|'+b.id; ekey.set(k,(ekey.get(k)||0)+1); }
}
let edges=[...ekey.entries()].map(([k,w])=>{ const [a,b]=k.split('|'); return {source:a,target:b,w}; });
const deg=new Map(); edges.forEach(e=>{deg.set(e.source,(deg.get(e.source)||0)+1);deg.set(e.target,(deg.get(e.target)||0)+1);});
let keep=nodes.filter(n=>deg.get(n.id));
console.error('nodes',nodes.length,'connected',keep.length,'edges',edges.length);
// layout
const ORDER=[0,8,9,10,1,6,7,5,2,11,12,3,4];
const R=+process.env.R||1100, anc={}; ORDER.forEach((c,i)=>{const a=i/ORDER.length*2*Math.PI; anc[c]=[Math.cos(a)*R,Math.sin(a)*R];}); anc[-1]=[0,0];
const GS=+process.env.GS||0.035;
const sim=d3.forceSimulation(keep)
  .force('link',d3.forceLink(edges).id(n=>n.id).distance(e=>e.w>1?18:30).strength(e=>(e.w>1?1:0.6)/Math.min(deg.get(e.source.id),deg.get(e.target.id))))
  .force('charge',d3.forceManyBody().strength(+process.env.CH||-90).theta(0.95).distanceMax(900))
  .force('collide',d3.forceCollide(n=>2+Math.sqrt(n.sl)*0.6).iterations(1))
  .force('x',d3.forceX(n=>anc[n.prim][0]).strength(GS)).force('y',d3.forceY(n=>anc[n.prim][1]).strength(GS))
  .stop();
const T=+process.argv[2]||500;
for(let i=0;i<T;i++){ sim.tick(); if(i%50==0) console.error('tick',i); }
const idx=new Map(keep.map((n,i)=>[n.id,i]));
// order nodes by id index; compact
const N=keep.map(n=>[n.name, Math.round(n.x), Math.round(n.y), n.sl, n.start, n.end, n.prim, n.mask, n.kind==='group'?1:0, n.birth, n.death, n.country, n.genres.join(', '), (n.extract||n.desc).replace(/\s+/g,' ').slice(0,520), n.title.replace(/ /g,'_')]);
const E=[]; edges.forEach(e=>{E.push(idx.get(e.source.id),idx.get(e.target.id));});
fs.writeFileSync('data.js','window.MUSIC_DATA='+JSON.stringify({cats:CATS.map(c=>c[0]),nodes:N,edges:E})+';');
console.error('written', fs.statSync('data.js').size);
