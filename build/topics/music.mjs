// Music: composers, musicians and bands.
const CATS = [
  ['Classical', '#e6c88a', /classical|opera|baroque|romantic music|romanticism|symphon|chamber music|art song|requiem|sacred music|oratorio|concerto|ballet|renaissance music|church music|lied|film score|impressionism in music|minimalis|cantata|madrigal|serialism|neoclassic|sonata|polyphony|medieval music|mass |motet|orchestral|choral/i],
  ['Rock', '#e5484d', /rock|grunge|new wave|shoegaze|britpop|psychedelia|garage|krautrock|post-punk/i],
  ['Pop', '#ff8cc6', /pop|schlager|chanson|easy listening|traditional pop|vocal music|musical theatre|show tune|cabaret|teen|bubblegum|adult contemporary|enka|cantopop|mandopop/i],
  ['Hip hop', '#a873ff', /hip hop|hip-hop|rap|trap music|grime|drill|gangsta|crunk|boom bap|horrorcore/i],
  ['R&B & Soul', '#f5913b', /rhythm and blues|r&b|soul|funk|motown|gospel|new jack|quiet storm|disco|doo-wop|boogie/i],
  ['Electronic', '#2fd9c8', /electronic|house|techno|trance|dubstep|drum and bass|edm|ambient|electro|industrial|idm|big beat|downtempo|trip hop|dance music|eurodance|breakbeat|uk garage|synth|hardstyle|jungle|chiptune|vaporwave|hyperpop|experimental/i],
  ['Metal', '#8f9bb3', /metal|metalcore|grindcore|djent|thrash/i],
  ['Punk', '#c4f25a', /punk|hardcore|emo|riot grrrl|oi!/i],
  ['Jazz', '#4aa3ff', /jazz|swing|bebop|big band|ragtime|bossa nova|fusion|dixieland/i],
  ['Blues', '#7c78ff', /blues/i],
  ['Country & Folk', '#c08f5a', /country|bluegrass|americana|honky|western|folk|singer-songwriter|traditional music|celtic|skiffle|cajun|zydeco/i],
  ['Latin', '#ffe15c', /latin|salsa|reggaeton|samba|tango|bachata|merengue|cumbia|mariachi|ranchera|flamenco|música popular brasileira|mpb|bolero|norteño|banda|son cubano|mambo|bossa|tropical|regional mexican|sertanejo|vallenato|fado/i],
  ['Reggae & Caribbean', '#3fbf62', /reggae|ska|dancehall|\bdub\b|rocksteady|calypso|soca|afrobeat|afropop|highlife|world music|zouk|kompa|rai|bhangra|qawwali|filmi/i],
  ['Other', '#69708a', null],
];
const MUSIC_OCC = new Set(['Q36834', 'Q486748', 'Q158852', 'Q1259917', 'Q806349', 'Q386854']); // composer, pianist, conductor, violinist, organist, cellist
const classicalEra = d => d.birth != null && d.birth < 1910 && d.occ.some(o => MUSIC_OCC.has(o));

export default {
  id: 'music',
  wiki: 'en',
  meta: {
    title: 'Music',
    noun: 'artist', nouns: 'artists',
    groupRole: 'Band / group',
    styleLabel: 'Style',
    subtitle: 'Every star is a composer, musician or band. A line joins two artists when one’s Wikipedia article links to the other.',
    axis: { years: [null, 1600, 1900, null], ts: [0, 0.07, 0.33, 1] },
    presets: [['All time', null, null], ['Before 1800', null, 1799], ['1800s', 1800, 1899], ['1900–49', 1900, 1949], ['1950s–70s', 1950, 1979], ['1980s–90s', 1980, 1999], ['2000s', 2000, 2009], ['2010s–now', 2010, null]],
  },
  persons: {
    min: 30,
    occupations: ['Q639669', 'Q177220', 'Q36834', 'Q753110', 'Q488205', 'Q2252262', 'Q130857', 'Q486748', 'Q855091', 'Q158852', 'Q1259917', 'Q806349', 'Q386854', 'Q2643890', 'Q183945'],
  },
  groups: {
    min: 18,
    classes: ['Q215380', 'Q5741069', 'Q2088357', 'Q9212979', 'Q216337', 'Q641066', 'Q56816954', 'Q281643', 'Q14946528', 'Q1191899'],
  },
  keep: d => d.kind === 'group' || d.genres.length > 0 || d.labels > 0 || classicalEra(d),
  descRegex: /music|singer|compos|band|rapper|rap |pian|violin|guitar|conduct|\bDJ\b|disc jockey|songwrit|record producer|drummer|vocal|organist|cellist|bass|group|duo|trio|quartet|orchestra|ensemble|idol|trumpet|sax|lyric|opera|hip hop|tenor|soprano|baritone|mezzo|contralto|musician|chanteu|cantante|flaut|harpsichord|lutenist|troubadour|minstrel|choir|keyboardist|percussion|beatbox|producer|K-pop|J-pop|record/i,
  // non-bands that slip in through the group classes (a genre article, films, software…); groups only
  groupDescExclude: /\bgenre of\b|\bfilm by\b|\b\d{4} film\b|manga|anime|software|video game|given name|Wikimedia|coat of arms|^art of/i,
  categories: CATS.map(([name, color]) => ({ name, color })),
  anchorOrder: [0, 8, 9, 10, 1, 6, 7, 5, 2, 11, 12, 3, 4],
  roleRegex: /music|singer|compos|rapper|pian|violin|guitar|conduct|DJ|songwrit|producer|drummer|organist|cellist|bass|trumpet|sax|lyric|tenor|soprano|baritone/i,
  categorize(d, L) {
    const w = new Array(CATS.length).fill(0);
    d.genres.forEach((g, i) => {
      const lab = L[g] || '';
      CATS.forEach(([, , re], c) => {
        if (!re || !re.test(lab)) return;
        if (c === 9 && /rhythm and blues|r&b/i.test(lab)) return; // R&B is not Blues
        w[c] += 1 / (1 + 0.35 * i);
      });
    });
    if (classicalEra(d) && !w.some(x => x > 0)) w[0] = 1;
    return w;
  },
  tags: d => d.genres,
};
