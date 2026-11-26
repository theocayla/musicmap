// Visual art: painters, sculptors, illustrators, printmakers, photographers, comics artists.
const CATS = [
  ['Medieval & Gothic', '#d9b36a', /medieval|gothic|byzantine|romanesque|trecento|carolingian|ottonian|insular art|proto-renaissance/i],
  ['Renaissance', '#e0603f', /renaissance|mannerism|quattrocento|cinquecento|venetian school|florentine|sienese|danube school|early netherlandish|fontainebleau/i],
  ['Baroque & Rococo', '#9b6bff', /baroque|rococo|caravagg|dutch golden age|golden age|flemish|bolognese/i],
  ['Neoclassicism & Romanticism', '#5b8cff', /neoclassic|romantic|academic art|academicism|hudson river|biedermeier|nazarene|orientalis|düsseldorf school|history painting/i],
  ['Realism & Impressionism', '#6fcf6a', /\brealism|barbizon|impressionis|pointillis|divisionis|nabis|luminis|peredvizhniki|wanderers|cloisonnis|pont-aven|naturalism|macchiaioli|tonalism|heidelberg school|hague school|skagen/i],
  ['Symbolism & Art Nouveau', '#2ec4b6', /symbolis|art nouveau|secession|jugendstil|pre-raphaelite|arts and crafts|aestheticism|modernisme|decaden|mir iskusstva|world of art/i],
  ['Expressionism & Fauvism', '#ff4f7b', /expressionis|fauvis|die brücke|blaue reiter|blue rider|new objectivity|neue sachlichkeit|school of paris|école de paris/i],
  ['Cubism & Avant-garde', '#ffa53d', /cubis|futuris|constructivis|suprematis|de stijl|bauhaus|orphism|vorticism|rayonism|purism|precisionism|avant-garde|section d'or|neo-plasticism|modernism/i],
  ['Dada & Surrealism', '#ff8fe0', /dada|surreal|metaphysical/i],
  ['Abstract & Postwar', '#a9b8ff', /abstract|informel|tachis|cobra|colou?r field|minimalis|op art|kinetic|zero|hard-edge|gutai|concrete art|art brut|outsider/i],
  ['Pop & Contemporary', '#fff06a', /pop art|conceptual|fluxus|neo-dada|nouveau réalisme|new realism|young british|street art|graffiti|contemporary art|installation|performance art|neo-expressionism|video art|land art|photorealism|hyperrealism|postmodern|neo-pop|superflat|lowbrow|digital art|body art/i],
  ['Photography', '#b0b7c9', /photograph|pictorialism|new topographics/i],
  ['Comics & Illustration', '#8ee8ff', /comic|manga|cartoon|bande dessinée|illustrat|animation|animator|ligne claire/i],
  ['Asian traditions', '#c98d6b', /ukiyo|nihonga|kanō|rinpa|literati|chinese painting|shan shui|ink wash|sumi-e|yamato-e|mughal|rajput|persian miniature|bengal school|guohua|shanghai school|wu school|zhe school|orthodox school/i],
  ['Other', '#69708a', null],
];
const ASIA = /china|japan|korea|qing|ming|song dynasty|tang|yuan dynasty|edo|tokugawa|joseon|goryeo|india|mughal|persia|iran|safavid|ottoman|vietnam/i;
// major visual artists whose Wikidata description names another role first
const ALSO = new Set(['William Blake', 'Taras Shevchenko', 'Michelangelo']);
const NOT_VISUAL = /recording artist|martial artist|make-?up artist|tattoo|trapeze|circus|singer|rapper|musician|actor|actress/i;
const VISUAL = /painter|sculpt|illustrat|photograph|engraver|printmaker|cartoon|comic|manga|draughts|drafts|designer|caricatur|muralist|potter|ceramic|calligraph|watercolo|lithograph|etcher|miniaturist|mangaka|animator|\bartist|\bart\b/i;

export default {
  id: 'art',
  wiki: 'en',
  meta: {
    title: 'Art',
    noun: 'artist', nouns: 'artists',
    groupRole: 'Collective',
    styleLabel: 'Movement',
    subtitle: 'Every star is a painter, sculptor, illustrator, photographer or comics artist. A line joins two artists when one’s Wikipedia article links to the other.',
    axis: { years: [null, 1400, 1850, null], ts: [0, 0.15, 0.5, 1] },
    presets: [['All time', null, null], ['Before 1500', null, 1499], ['1500–1700', 1500, 1700], ['1700–1850', 1700, 1850], ['1850–1914', 1850, 1914], ['1914–45', 1914, 1945], ['1945–80', 1945, 1980], ['1980–now', 1980, null]],
  },
  persons: {
    min: 16,
    // painter, sculptor, illustrator, printmaker, photographer, comics artist, cartoonist, manga artist, engraver, draughtsperson, visual artist, graphic designer
    occupations: ['Q1028181', 'Q1281618', 'Q644687', 'Q11569986', 'Q33231', 'Q715301', 'Q1114448', 'Q191633', 'Q329439', 'Q15296811', 'Q3391743', 'Q1925963'],
  },
  // the first role named in the description must be a visual one ("Russian writer, poet and painter" is left out)
  keep: d => {
    const first = (d.desc || '').replace(/\(.*?\)/g, '').split(/,| and |;/)[0];
    return ALSO.has(d.title) || /polymath/i.test(first) || (VISUAL.test(first) && !NOT_VISUAL.test(first));
  },
  descRegex: null,
  categories: CATS.map(([name, color]) => ({ name, color })),
  anchorOrder: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
  roleRegex: /painter|sculpt|illustrat|photograph|engraver|printmaker|cartoon|comic|manga|draughts|drafts|designer|caricatur|muralist|ceramic|calligraph|artist|architect|animator/i,
  categorize(d, L) {
    const w = new Array(CATS.length).fill(0);
    const add = (lab, weight) => CATS.forEach(([, , re], c) => {
      if (!re || !re.test(lab)) return;
      if (c === 6 && /abstract expressionism|neo-expressionism/i.test(lab)) return;
      w[c] += weight;
    });
    d.movements.forEach((m, i) => add(L[m] || '', 1 / (1 + 0.35 * i)));
    d.genres.forEach((g, i) => add(L[g] || '', 0.4 / (1 + 0.35 * i)));
    const occ = d.occ.map(o => L[o] || '');
    if (occ.some(o => /comics artist|cartoonist|manga|mangaka|comic/i.test(o))) w[12] += 1.6;
    else if (occ.some(o => /illustrator|animator/i.test(o))) w[12] += 0.35;
    if (occ[0] && /photographer/i.test(occ[0])) w[11] += 1.2;
    else if (occ.some(o => /photographer/i.test(o))) w[11] += 0.3;
    if (!w.some(x => x > 0)) {
      const s = d.start ?? 9999, country = L[d.country] || '';
      if (ASIA.test(country) && s < 1900) w[13] = 1;
      else if (s < 1400) w[0] = 1;
      else if (s < 1580) w[1] = 1;
      else if (s < 1770) w[2] = 1;
      else if (s < 1840) w[3] = 1;
    }
    return w;
  },
  tags: d => d.movements.concat(d.genres),
};
