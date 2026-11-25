# Music Artist Atlas

An interactive map of **5,544 music artists**, from medieval composers to today's pop stars. Each dot is a composer, musician or band. A line joins two artists when one's English Wikipedia article links to the other's, which gives **85,970 links**. The layout puts artists that link to each other close together, so musical families form their own regions: classical, jazz and blues, rock and metal, pop, hip hop, K-pop and so on.

**Open `index.html` in any modern browser.** It's one self-contained file, with no install and no server needed.

## Using the map

| Action | How |
| --- | --- |
| Move around | Drag the map, or swipe on a phone |
| Zoom | Scroll the mouse wheel, pinch, or use the **+ / − / ⤢** buttons (⤢ fits the whole map) |
| See an artist | Click a dot to open its card on the right |
| Follow a connection | Click a name under **Linked artists** in the card to jump to that artist |
| Find someone | Type a name in **Find an artist…**, then use ↑/↓ and Enter |
| Close the card | Click **×** or press Esc |

More names appear as you zoom in. When an artist is selected, its links are highlighted and the rest of the map is dimmed.

### The artist card

- Life dates (or formation and split dates for bands), years active and country
- Genres as listed on Wikidata
- The opening lines of the artist's Wikipedia article
- **Fame**: the number of Wikipedia language editions with an article on the artist
- Every linked artist, most famous first
- A link to the full Wikipedia article

### Filters

- **Active between**: drag the two handles, or click a preset such as *1800s* or *1980s–90s*. An artist is shown if their active years overlap the range at all. The small chart above the slider counts artists by the year their career started, coloured by style. Years before 1900 are squeezed onto a shorter part of the slider, because most artists are from after 1950.
- **Style**: click a style to show or hide it. **All** and **None** select everything or nothing. Alt-click (Option-click on Mac) shows only that style. An artist with several styles shows up while any of them is selected, and the dot's colour is its main style.
- **Size dots by fame**: when ticked, the dot size grows with the number of Wikipedia language editions with an article on the artist. When unticked, all dots are the same size.
- **Show links**: hides or shows the lines between artists.

Filtered-out artists stay on the map as faint grey dots, so the overall shape of the map is kept.

## How the data was built

The data is a snapshot from **November 2026**.

1. **Artists.** [Wikidata](https://www.wikidata.org) was queried for people with a music occupation (musician, singer, composer, rapper, DJ, conductor, pianist and similar) with articles in at least 30 Wikipedia language editions. Groups (bands, duos, orchestras, girl and boy groups) needed at least 18.
2. **Musicians only.** People were kept if they have a music genre or a record label on Wikidata, or are composers or performers born before 1910. Their Wikidata description also had to mention music. This removes painters, writers and actors who happen to be listed with a music occupation.
3. **Styles.** Wikidata's 1,000+ detailed genres were sorted into 14 broad styles by keyword. For example, "progressive metal" goes to Metal and "bebop" goes to Jazz.
4. **Dates.** The active period uses Wikidata's *work period* when it exists. Otherwise it uses the band's formation and split dates, or the person's birth year + 20 up to their death.
5. **Links.** The raw text of each English Wikipedia article was scanned for links to other artists on the map. Only links in the article body and infobox count. The navigation boxes at the bottom of pages are left out, because they link hundreds of loosely related artists. Links through alternative page names, like "Beatles" for The Beatles, are resolved to the right artist. The links are shown both ways, so a popular artist's count includes everyone who cites them.
6. **Layout.** A force-directed simulation ([d3-force](https://github.com/d3/d3-force)) pulls linked artists together, pushes all dots apart, and gently draws each style towards its own area. Artists with no links to anyone else on the map are left out.

### Known limitations

- Fame reflects Wikipedia coverage, which leans towards Western and English-language artists and towards older artists who have had longer to collect articles.
- The 14 styles are broad. Every genre label was sorted by keyword, so a few artists get an odd main style.
- A link only means one article mentions the other artist. That can be an influence, a collaboration, a cover version or a passing comparison.

## Publishing on GitHub Pages

1. Create an empty repository on GitHub (without a README), then push:
   ```sh
   git remote add origin https://github.com/<your-user>/<repo-name>.git
   git push -u origin main
   ```
2. On GitHub, open **Settings → Pages**. Under *Build and deployment*, choose **Deploy from a branch**, then branch **main** and folder **/ (root)**, and click **Save**.
3. After a minute or so the map is live at `https://<your-user>.github.io/<repo-name>/`.

Alternatives: drag `index.html` onto [Netlify Drop](https://app.netlify.com/drop), or send the file itself to people, who can open it in a browser.

## Rebuilding the data

The scripts in [`build/`](build/) regenerate `index.html` from live Wikidata and Wikipedia. You need Node.js 18 or later.

```sh
cd build
npm install
node 1-candidates.mjs 30   # Wikidata: musicians and bands above the fame threshold → candidates.json
node 2-details.mjs         # Wikidata: genres, dates, countries → details.json, keep.json
node 3-wikitext.mjs        # Wikipedia: links and intro text for each artist → wiki.json (about 45 min)
node 4-redirects.mjs       # Wikipedia: alternative page names for each artist → wiki.json
node 5-layout.mjs          # filter, build links, run the layout → data.js
node 6-page.mjs            # inline data.js into template.html → ../index.html
```

The scripts make one request at a time so they don't overload Wikimedia's servers. If they hit a rate limit, they wait as asked. `3-wikitext.mjs` can be stopped and restarted, because it continues from where it stopped. You can tune the layout with environment variables: `CH` (repulsion, default −90), `R` (radius of the style areas, default 1100) and `GS` (pull towards the style areas, default 0.035).

To change the page itself (design, controls), edit `build/template.html` and run `node 6-page.mjs`.

## Credits and licence

The code (the page and the `build/` scripts) is under the [Apache License 2.0](LICENSE). The data keeps its original licences:

- Artist data: [Wikidata](https://www.wikidata.org), CC0.
- Artist texts and links: [English Wikipedia](https://en.wikipedia.org), [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). The intro text in each artist card is taken from that artist's Wikipedia article, which the card links to.
- Layout: [d3-force](https://github.com/d3/d3-force) (ISC licence). Fonts: Bricolage Grotesque and IBM Plex, from Google Fonts.
