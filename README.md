# Constellations

Interactive maps of who cites whom on Wikipedia, in four subjects:

| Topic | Stars | Links | Source of the links |
| --- | --- | --- | --- |
| **Music**: composers, musicians and bands, from medieval times to today | 5,542 | 85,311 | English Wikipedia |
| **Art**: painters, sculptors, illustrators, photographers and comics artists | 3,155 | 14,616 | English Wikipedia |
| **Literature**: poets, novelists, playwrights, essayists | 2,570 | 18,593 | English Wikipedia |
| **French politics**: politicians, monarchs and revolutionaries of France | 2,661 | 23,640 | French Wikipedia |

Each star is a person (or a band). A line joins two stars when one's Wikipedia article links to the other's. The layout puts people who cite each other close together, so families form their own regions: jazz and metal, Impressionists and Surrealists, Romantic poets and crime writers, Gaullists and Socialists.

**Open `index.html` in a browser and pick a subject at the top left.** No install or server is needed: the page works from a GitHub Pages site and from a folder on your computer.

## Using the map

| Action | How |
| --- | --- |
| Change subject | Click **Music**, **Art**, **Literature** or **French politics** at the top left |
| Move around | Drag the map, or swipe on a phone |
| Zoom | Scroll the mouse wheel, pinch, or use the **+ / − / ⤢** buttons (⤢ fits the whole map) |
| See someone | Click a star to open their card on the right |
| Follow a connection | Click a name in the card's list of links to jump to that person |
| Find someone | Type a name in the search box, then use ↑/↓ and Enter |
| Close the card | Click **×** or press Esc |

More names appear as you zoom in. When someone is selected, their links are highlighted and the rest of the map is dimmed.

Each subject has its own address, so you can share a link straight to it: `…/index.html#music`, `#art`, `#literature` or `#politics`.

### The card

- Life dates (or formation and split dates for bands), years active and country
- Genres, art movements or political parties, as listed on Wikidata
- The opening lines of the person's Wikipedia article
- **Fame**: the number of Wikipedia language editions with an article on the person
- Everyone they're linked to, most famous first
- A link to the full Wikipedia article

### Filters

- **Active between**: drag the two handles, or click a preset such as *1800s* or *Third Republic*. A person is shown if their active years overlap the range at all. The small chart above the slider counts people by the year they became active, coloured by category. Early centuries are squeezed onto a shorter part of the slider, because most people on the maps are recent.
- **Style / Movement / Genre / Political family**: click a category to show or hide it. **All** and **None** select everything or nothing. Alt-click (Option-click on Mac) shows only that category. Someone who belongs to several categories shows up while any of them is selected, and the star's colour is their main category.
- **Size dots by fame**: when ticked, the star grows with the number of Wikipedia language editions with an article on the person. When unticked, all stars are the same size.
- **Show links**: hides or shows the lines.

Filtered-out people stay on the map as faint grey stars, so the overall shape of the map is kept.

## How the data was built

The data is a snapshot from **November 2026**. Each subject goes through the same five steps, configured in [`build/topics/`](build/topics/).

1. **People.** [Wikidata](https://www.wikidata.org) was queried for people with the topic's occupations (musician, painter, novelist, politician and so on) and a minimum number of Wikipedia language editions. The thresholds are 30 for music (18 for bands), 16 for art, 35 for literature and 7 for French politics (French citizens only).
2. **Filtering.** People were kept only if Wikidata gives them something specific to the topic, such as a music genre, an art movement or a literary genre, and if their description fits the topic. This removes, for example, actors who are listed as singers too. French politics keeps everyone with French citizenship.
3. **Categories.** Wikidata's detailed genres, movements and parties were sorted into a dozen or so broad categories by keyword. For French politics, the categories are political families built from party membership, and people without a party are placed by era (Ancien Régime, Revolution, Empire).
4. **Dates.** The active period uses Wikidata's *work period* when it exists. For politicians it uses the dates of the positions they held. Otherwise it uses a band's formation and split dates, or the person's birth year plus 20 to 25 years, up to their death.
5. **Links.** The raw text of each Wikipedia article was scanned for links to other people on the same map. Only links in the article body and infobox count. The navigation boxes at the bottom of pages are left out, because they link hundreds of loosely related people. Links through alternative page names are resolved to the right person. French politics uses the **French** Wikipedia, which covers French politicians much more fully than the English one.
6. **Layout.** A force-directed simulation ([d3-force](https://github.com/d3/d3-force)) pulls linked people together, pushes all stars apart, and gently draws each category towards its own area. People with no links to anyone else on the map are left out.

### Known limitations

- Fame reflects Wikipedia coverage. It leans towards Western, English-speaking and older figures, who have had longer to collect articles.
- The categories are broad, and labels were sorted by keyword, so a few people get an odd main category.
- A link only means one article mentions the other person. That can be an influence, a collaboration, a rivalry or a passing comparison.

## Files

```
index.html        the page: topic switcher, map, filters and card
data/<topic>.js   one data file per subject, loaded when you open that subject
build/            the scripts that rebuild the data files from Wikidata and Wikipedia
```

Keep `index.html` and the `data/` folder together. The page loads `data/<topic>.js` the first time you open a subject, so the first map appears quickly and the other subjects don't slow it down.

## Publishing on GitHub Pages

1. Push the repository to GitHub.
2. On GitHub, open **Settings → Pages**. Under *Build and deployment*, choose **Deploy from a branch**, then branch **main** and folder **/ (root)**, and click **Save**.
3. After a minute or so the maps are live at `https://<your-user>.github.io/<repo-name>/`.

## Rebuilding the data

The scripts in [`build/`](build/) regenerate `data/<topic>.js` from live Wikidata and Wikipedia. You need Node.js 18 or later. Each script takes the topic name (`music`, `art`, `literature` or `politics`), and keeps its downloads in `build/cache/<topic>/`.

```sh
cd build
npm install
node 1-candidates.mjs art   # Wikidata: people above the fame threshold
node 2-details.mjs art      # Wikidata: dates, genres, movements, parties, countries
node 3-wikitext.mjs art     # Wikipedia: links and intro text for each person (about an hour)
node 4-redirects.mjs art    # Wikipedia: alternative page names for each person
node 5-layout.mjs art       # filter, build the links, run the layout → ../data/art.js
```

The scripts make one request at a time so they don't overload Wikimedia's servers. If they hit a rate limit, they wait as asked. `3-wikitext.mjs` can be stopped and restarted, because it continues from where it stopped. You can tune the layout with environment variables: `CH` (repulsion, default −90), `R` (radius of the category areas, default 1100) and `GS` (pull towards the category areas, default 0.035).

### Adding a subject

1. Copy one of the files in `build/topics/`, for example `literature.mjs`, to `build/topics/<new-id>.mjs`. Set its occupations (Wikidata IDs), fame threshold, categories and texts.
2. Run the five scripts with `<new-id>`.
3. Add `{id:'<new-id>', label:'…'}` to the `TOPICS` list near the top of the script in `index.html`.

## Credits and licence

The code (the page and the `build/` scripts) is under the [Apache License 2.0](LICENSE). The data keeps its original licences:

- People data: [Wikidata](https://www.wikidata.org), CC0.
- Texts and links: [English Wikipedia](https://en.wikipedia.org) and, for French politics, [French Wikipedia](https://fr.wikipedia.org), both [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). The intro text in each card comes from that person's Wikipedia article, which the card links to.
- Layout: [d3-force](https://github.com/d3/d3-force) (ISC licence). Fonts: Bricolage Grotesque and IBM Plex, from Google Fonts.
