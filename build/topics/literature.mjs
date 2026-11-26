// Literature: novelists, poets, playwrights, essayists.
const CATS = [
  ['Classical & Epic', '#d9b36a', /epic|mytholog|saga|ancient greek|latin literature|classical antiquity|homeric|hagiograph|chanson de geste/i],
  ['Poetry', '#ff8fc7', /poet|poetry|sonnet|haiku|lyric poetry|verse|\bode\b|elegy|ballad|tanka|ghazal|poem/i],
  ['Drama', '#e5484d', /playwright|dramatist|drama|theatre|theater|tragedy|comedy|screenwrit|librett|\bplay\b/i],
  ['Fiction', '#6aa6ff', /novel|short story|fiction|bildungsroman|picaresque|literary realism|naturalism|magic realism|stream of consciousness|prose/i],
  ['Sci-fi & Fantasy', '#2fd9c8', /science fiction|fantasy|speculative|cyberpunk|dystop|utopia|space opera|steampunk|sword and sorcery|weird fiction/i],
  ['Crime, Mystery & Horror', '#9b6bff', /crime|mystery|detective|thriller|horror|gothic|noir|spy fiction|suspense|ghost stor|whodunit/i],
  ["Children's & Young adult", '#fff06a', /children|young adult|fairy tale|picture book|juvenile|nursery/i],
  ['Essays & Philosophy', '#ffa53d', /essay|philosoph|aphoris|literary critic|criticism|moralist|treatise/i],
  ['Non-fiction & Journalism', '#b0b7c9', /journalis|non-?fiction|biograph|historian|historiograph|memoir|travel lit|travel writ|autobiograph|reportage|diarist|chronicler/i],
  ['Satire & Humour', '#6fcf6a', /satir|humou?r|comic novel|parody|absurd|fable|nonsense/i],
  ['Religious & Spiritual', '#c98d6b', /religio|theolog|mystic|spiritual|devotional|hymn|sermon|scripture|sufi/i],
  ['Other', '#69708a', null],
];
const GENRE_FICTION = /science|speculative|crime|detective|horror|mystery|fantasy|children|young adult/i;

const WRITER = /novelist|poet|playwright|dramatist|\bwriter|\bauthor|essayist|man of letters|woman of letters|literary|fabulist|satirist|librettist|short[- ]story|storyteller|diarist|memoirist|humorist|mangaka|chronicler|hymnwriter|philosopher|critic|translator|journalist|historian|lyricist|troubadour|scholar|bard/i;
/** The roles in a Wikidata description: "French poet, novelist and dramatist (1802–1885)" → ["French poet", "novelist", "dramatist"]. */
const roles = desc => (desc || '').replace(/\(.*?\)/g, '').split(/,| and |;/).map(x => x.trim()).filter(Boolean);

export default {
  id: 'literature',
  wiki: 'en',
  meta: {
    title: 'Literature',
    noun: 'writer', nouns: 'writers',
    groupRole: 'Collective',
    styleLabel: 'Genre',
    subtitle: 'Every star is a novelist, poet, playwright or essayist. A line joins two writers when one’s Wikipedia article links to the other.',
    axis: { years: [null, 1500, 1850, null], ts: [0, 0.2, 0.45, 1] },
    presets: [['All time', null, null], ['Antiquity', null, 600], ['600–1500', 600, 1500], ['1500–1800', 1500, 1800], ['1800s', 1800, 1899], ['1900–45', 1900, 1945], ['1945–80', 1945, 1980], ['1980–now', 1980, null]],
  },
  persons: {
    min: 35,
    // writer, novelist, poet, playwright, essayist, short story writer, children's writer, science fiction writer, literary critic
    occupations: ['Q36180', 'Q6625963', 'Q49757', 'Q214917', 'Q11774202', 'Q15949613', 'Q4853732', 'Q18844224', 'Q4263842'],
  },
  // the first role named in the description must be a writing one ("American singer, songwriter, and actress" is left out)
  keep: d => WRITER.test((d.desc || '').replace(/\(.*?\)/g, '').split(/[,;]/)[0]),
  descRegex: null,
  categories: CATS.map(([name, color]) => ({ name, color })),
  anchorOrder: [0, 10, 1, 2, 9, 3, 6, 4, 5, 8, 7],
  roleRegex: /writer|novelist|poet|playwright|dramatist|essayist|author|critic|journalist|philosopher|librettist|screenwriter|translator|satirist/i,
  categorize(d, L) {
    const w = new Array(CATS.length).fill(0);
    const add = (lab, weight) => CATS.forEach(([, , re], c) => {
      if (!re || !re.test(lab)) return;
      if (c === 3 && GENRE_FICTION.test(lab)) return;
      w[c] += weight;
    });
    d.genres.forEach((g, i) => add(L[g] || '', 1 / (1 + 0.3 * i)));
    d.movements.forEach(m => add(L[m] || '', 0.3));
    roles(d.desc).slice(0, 4).forEach((r, i) => add(r, 1.2 / (1 + i)));   // roles in the description, first ones count most
    if (!w.some(x => x > 0)) d.occ.forEach(o => add(L[o] || '', 0.5));   // nothing specific: fall back on all listed occupations
    if ((d.start ?? 9999) < 600) w[0] += 1.5;
    return w;
  },
  tags: d => d.genres.concat(d.movements),
};
