// French politics: politicians, monarchs, revolutionaries and statespeople with French citizenship.
// Links and intro texts come from the French Wikipedia, which covers French politicians far better.
const POL = /politic|minister|statesm|stateswom|deputy|député|parliament|senator|mayor|president|king|queen|monarch|emperor|empress|regent|dauphin|prince|duke|duchess|count|revolutionar|jacobin|diplomat|ambassador|trade unionist|syndicalist|activist|resistance|militant|lawmaker|\bMEP\b|councillor|prefect|governor|consul|chancellor|regicide|conventionnel|first lady|feminist|anarchist|communard|ruler|lord|cardinal|bishop|marshal|general|nobleman|noblewoman|courtier|royal|official|civil servant|magistrate|lawyer|jurist|economist|leader|founder|mistress/i;
const CATS = [
  ['Monarchy & Ancien Régime', '#e6d3a3', /royalis|legitimis|ultra-royalis|monarchis|\bultras?\b|orléanis|orleanis|chevau-légers/i],
  ['Revolution', '#ff5a36', /jacobin|girondin|montagn|cordelier|feuillant|the mountain|the plain|hébertist|enragés|thermidor|sans-culottes/i],
  ['Bonapartism', '#b388ff', /bonapart|appel au peuple/i],
  ['Far left', '#d1303a', /communis|trotsk|maoist|anarch|insoumise|unbowed|lutte ouvrière|workers' struggle|anticapitalist|unified socialist party|left party|parti de gauche|blanquis|paris commune/i],
  ['Socialist', '#ff7aa8', /socialis|sfio|social democra|workers' international|place publique|génération\.s/i],
  ['Ecologist', '#45c46b', /green|ecolog|écolog|les verts/i],
  ['Radical & centre-left', '#f5a43d', /radical|opportunist|gauche républicaine|democratic and socialist union of the resistance|udsr/i],
  ['Centre', '#f5d547', /centr|popular republican|mouvement républicain populaire|union for french democracy|\budf\b|democratic movement|modem|en marche|renaissance|horizons|christian democra|democratic force|agir|union of democrats and independents|\budi\b|territories of progress/i],
  ['Gaullist & Right', '#4a90e2', /gaull|rally of the french people|union for the new republic|union of democrats for the republic|rally for the republic|union for a popular movement|the republicans|les républicains|debout|france arise/i],
  ['Liberal & conservative right', '#8cc8ff', /independent republicans|national centre of independents|democratic alliance|republican federation|liberal democracy|conservative|moderate|liberal|independents|action libérale|progressistes/i],
  ['Far right', '#a07a60', /national front|national rally|rassemblement national|reconquête|reconquest|action française|french popular party|croix-de-feu|french social party|national popular rally|francisme|collaborat|poujad|nationalis|national republican movement|boulang|ligue des patriotes|identit/i],
  ['Unaffiliated', '#69708a', null],
];

export default {
  id: 'politics',
  wiki: 'fr',
  meta: {
    title: 'French politics',
    noun: 'politician', nouns: 'politicians',
    groupRole: 'Group',
    styleLabel: 'Political family',
    subtitle: 'Every star is a French politician, monarch or revolutionary. A line joins two people when one’s French Wikipedia article links to the other.',
    axis: { years: [null, 1789, 1900, null], ts: [0, 0.22, 0.45, 1] },
    presets: [['All time', null, null], ['Ancien Régime', null, 1788], ['Revolution & Empire', 1789, 1815], ['1815–70', 1815, 1870], ['Third Republic', 1870, 1940], ['1940–58', 1940, 1958], ['Fifth Republic', 1958, null], ['Since 2000', 2000, null]],
  },
  persons: {
    min: 7,
    // politician, monarch, statesperson, revolutionary, diplomat, trade unionist
    occupations: ['Q82955', 'Q116', 'Q372436', 'Q3242115', 'Q193391', 'Q15627169'],
    where: '?x wdt:P27 ?ctry . VALUES ?ctry { wd:Q142 wd:Q70972 }',
  },
  positions: true,   // use "position held" (P39) dates for the active period
  startAge: 25,
  // the description must name a political role, and people described as a foreign head of state
  // or as another nationality only ("Gabonese politician", "Russian revolutionary") are left out
  keep: d => {
    const t = (d.desc || '').replace(/\(.*?\)/g, '');
    if (!POL.test(t)) return false;
    if (/(?:minister|president|king|queen|emperor|empress|chancellor|monarch|governor) of (?!France|Navarre|the French|French|Paris|the Franks|West Francia|the European)/i.test(t)
      && !/France|French|Frank|Francia|Napoleon|Bonaparte|Senegal|Ivory Coast|Louis X/.test(t)) return false;
    const nat = t.match(/^(?:former )?([A-Z][\w-]+)\s/);
    if (nat && /(?:an|ese|ish|ic|i)$/.test(nat[1]) && !/French|Fren|Franco|Breton|Corsican|Alsatian|Norman|Frankish|Occitan|Catalan|Basque|Savoyard|Monegasque|Martiniquais|Guadeloupean|Réunionese|Senegal|Algerian/.test(t)) return false;
    return true;
  },
  descRegex: null,
  categories: CATS.map(([name, color]) => ({ name, color })),
  anchorOrder: [3, 4, 5, 6, 7, 9, 8, 10, 0, 2, 1],
  roleRegex: /politic|monarch|king|queen|emperor|revolution|diplomat|statesperson|minister|trade union|lawyer|journalist|military|officer|resistance|activist/i,
  categorize(d, L) {
    const w = new Array(CATS.length).fill(0);
    d.parties.forEach(p => {
      const lab = L[p] || '';
      CATS.forEach(([, , re], c) => {
        if (!re || !re.test(lab)) return;
        if (c === 4 && /radical/i.test(lab)) return;      // Radical-Socialist party is Radical, not Socialist
        if (c === 9 && /national republican movement/i.test(lab)) return;
        w[c] += 1;
      });
    });
    if (!w.some(x => x > 0)) {
      const s = d.start ?? 9999;
      const monarch = d.occ.includes('Q116');
      if (monarch || s < 1789) w[0] = 1;
      else if (s < 1800) w[1] = 1;
      else if (s < 1815) w[2] = 1;
    }
    return w;
  },
  tags: d => d.parties,
};
