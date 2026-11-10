# Kingsfoil Artifacts — review & ideas to make it systematic

*Review of https://kingsfoil-artifacts.netlify.app as of 9 Nov 2026*

---

## 1. Where the site stands today

### Inventory

| # | Page | Type | Series | Size |
|---|------|------|--------|------|
| 1 | Enemy AI for a Hero Defense RTS | Study | — | 390 KB |
| 2 | Procedural Character Generation by Composition | Study | — | 1.09 MB |
| 3–4 | Snow: study + sandbox | Study + Sandbox | VFX #1 | 403 + 35 KB |
| 5–6 | Acid: study + sandbox | Study + Sandbox | VFX #2 | 466 + 41 KB |
| 7–8 | Rain: study + sandbox | Study + Sandbox | VFX #3 | 517 + 42 KB |
| 9–10 | Forest: study + sandbox | Study + Sandbox | VFX #4 | 562 + 43 KB |
| 11–12 | Light & shadow: study + sandbox | Study + Sandbox | VFX #5 | 587 + 42 KB |

### What already works
- **Every study meets the same quality bar:** the same 14-section skeleton, V/I/U/K evidence badges, collapsible technique profiles, scorecard plus radar, a "see it in action" index and sources.
- **Each VFX study has a matching playable sandbox,** and the sandboxes feel like one product line.
- **`manifest.json` exists,** which is the right foundation for everything below.
- **Deploys are safe:** the site is rebuilt in full and every manifest entry is checked for HTTP 200.

### What hurts
1. **The homepage is one flat newest-first list.** At 12 entries it already reads like a log, not a library. Studies and sandboxes appear as unrelated rows, and nothing shows that VFX #1–#5 belong together.
2. **There are no tags or facets anywhere,** so you can't answer "show me everything about MMORPGs / pixel art / Godot web".
3. **Series navigation is hand-patched.** Every new study meant editing the nav in 4–5 older pages by string replacement, which is fragile and won't scale past ~10.
4. **The manifest is thin.** It has only `path, title, description, date`: no type, series, tags, project, engine, status or study↔sandbox pairing.
5. **Naming is inconsistent:** `rts-enemy-ai-study` and `procedural-character-generation-study` vs `vfx-*-topdown-pixel` and `vfx-*-sandbox`.
6. **The two older studies are orphans.** They aren't part of any series and have no links to the newer work, even though procedural characters and Asterion NPC towns are closely related to the forest and light studies.
7. **Discovery is missing:** no search, no social preview images, no sitemap or RSS, and no "start here".
8. **The source material isn't published.** Each study has an 18k-word Markdown report and a build pipeline. The reports never reach the site, and the pipelines (`build-*`) live only in this cloud workspace, so one lost workspace means you can no longer rebuild any study page.
9. **Knowledge repeats across studies with nothing tying it together.** The "dither threshold + palette LUT + per-pixel byte" engine shows up in snow, acid, rain, forest and light, but no page connects them.

---

## 2. Information architecture: name the kinds of things

Define a small set of **content types** and use them everywhere: manifest, homepage, badges and URLs.

| Type | What it is | Example |
|------|------------|---------|
| **Study** | Deep, referenced research page (the 14-section format) | `vfx-light-topdown-pixel` |
| **Sandbox** | Playable reference implementation of a study | `vfx-light-sandbox` |
| **Series hub** | One page per series: intro, ordered episodes, shared engine notes | `/series/vfx` |
| **Atlas** (new) | Cross-study synthesis: techniques, glossary, sources | `/atlas/techniques` |
| **Cheat sheet** (new) | A one-screen summary of a study, ready to print or share | `/vfx-light-topdown-pixel/cheatsheet` |
| **Project page** (new) | Everything relevant to one game | `/projects/asterion-online` |

And a small set of **series**, each covering one topic area:

| Series code | Name | Existing | Next candidates |
|---|---|---|---|
| `vfx` | Tiny VFX algorithms (top-down pixel) | Snow, Acid, Rain, Forest, Light, Fire & smoke, Water bodies | Fog, Grass & wind |
| `ai` | Game AI | Enemy AI for Hero Defense | MMO creature behaviour, NPC schedules |
| `procgen` | Procedural generation | Character composition | Towns, dungeons, tilesets/autotiling |
| `mmo` (new) | MMO systems (Tibia-like) | — | Netcode & area of interest, death & loot, economy |
| `art` (new) | Pixel art production | — | Palettes, 8-direction animation, paper-doll layering |

---

## 3. A tagging system you can search

Use a **faceted, controlled vocabulary**: a few facets, each with a closed list of values. Free-form tags drift ("top-down", "topdown", "3/4" become three different tags), so add new values deliberately.

### Facets

| Facet | Question it answers | Values (initial list) |
|---|---|---|
| `genre` | Which game type is it for? | `mmorpg`, `rpg`, `rts`, `hero-defense`, `roguelike`, `survival`, `farming-sim`, `match-3`, `runner` |
| `perspective` | What camera? | `top-down-3-4`, `top-down-orthographic`, `isometric`, `side-view`, `3d` |
| `art-style` | What look? | `pixel-art`, `hd-2d`, `low-poly`, `painted-2d` |
| `domain` | Which discipline? | `vfx`, `rendering`, `ai`, `procgen`, `animation`, `ui`, `audio`, `netcode`, `economy`, `design` |
| `concept` | The study's subject | `snow`, `acid`, `rain`, `trees`, `light`, `characters`, `enemy-waves`… |
| `technique` | Reusable algorithms inside | `cellular-automata`, `dither-threshold`, `palette-lut`, `poisson-disk`, `boids`, `shadowcasting`, `metaballs`, `flood-fill-light`, `ripple-sim`… |
| `engine` | Implementation target | `godot-4`, `godot-web-compat`, `web-canvas`, `engine-agnostic` |
| `platform` | Where it must run | `web`, `mobile`, `desktop`, `low-end` |
| `project` | Which Kingsfoil game uses it | `asterion-online`, `hero-defense`, `kingsfoil-rpg`, `match-3` |
| `maturity` | How far along is it? | `research`, `prototype`, `in-engine`, `shipped` |

### Rules
- **Every study** gets exactly one `domain` and one `concept`, at least one `genre`, `perspective` and `art-style`, and 3–10 `technique` tags.
- **A sandbox** inherits its study's tags and adds `type: sandbox`.
- **Technique tags are the most valuable facet over time.** They power the Technique Atlas: one click shows that "dither threshold" appears in Snow, Rain, Forest and Light.
- **Put the vocabulary in one file** (`taxonomy.json`) with labels, short definitions and colours, so the homepage chips, page badges and the validator all read the same list.

---

## 4. Manifest v2: one source of truth

Grow `manifest.json` into the single file that drives the homepage, series navigation, related links, search and validation.

```json
{
  "version": 2,
  "updated": "2026-11-09",
  "items": [
    {
      "id": "vfx-light",
      "type": "study",
      "path": "/vfx-light-topdown-pixel.html",
      "title": "Top-down pixel light and shadow: tiny algorithms for sun, fire, lanterns and the dark",
      "short": "Light & Shadow",
      "summary": "Day/night, sun shadows from heights, Tibia/DOOM/Quake light models, polar shadow maps, carried light.",
      "series": { "id": "vfx", "number": 5 },
      "pair": "vfx-light-sandbox",
      "tags": {
        "genre": ["mmorpg", "rpg"],
        "perspective": ["top-down-3-4"],
        "art-style": ["pixel-art"],
        "domain": ["rendering", "vfx"],
        "concept": ["light"],
        "technique": ["palette-lut", "shadowcasting", "polar-shadow-map", "flood-fill-light", "dither-threshold"],
        "engine": ["godot-4", "godot-web-compat"],
        "platform": ["web", "low-end"],
        "project": ["asterion-online"]
      },
      "maturity": "research",
      "stats": { "words": 17982, "techniques": 34, "figures": 29, "games": 47, "sources": 223 },
      "date": "2026-11-09",
      "updated": "2026-11-09",
      "report": "/reports/vfx-light-topdown-pixel.md",
      "og_image": "/og/vfx-light.png",
      "related": ["vfx-snow", "vfx-rain", "vfx-forest"]
    }
  ],
  "series": [
    { "id": "vfx", "title": "Tiny VFX algorithms", "blurb": "One concept per study, after the DOOM fire.", "order": ["vfx-snow","vfx-acid","vfx-rain","vfx-forest","vfx-light"] }
  ]
}
```

What it gives you:
- **Series navigation becomes data.** Each page loads one small `kf-nav.js` (≈3 KB) that reads the manifest and renders "VFX series: #1 … #5", previous/next, the paired sandbox and related studies. **No more patching old pages.**
- **"Related" is computed:** shared `technique` tags, weighted, with a manual override.
- **A validator script** fails the build when an entry is missing required facets, uses a tag that isn't in `taxonomy.json`, has a broken `pair`, or points at a missing file.

---

## 5. Homepage redesign

Go from a log to a library. Suggested layout for mobile and desktop:

```
┌──────────────────────────────────────────────────────────┐
│  Kingsfoil Artifacts                                     │
│  Research & playable prototypes for our games            │
│  [ 🔍 Search studies, techniques, games…            ]    │
│  Genre: [MMORPG][RPG][RTS]  View: [Top-down][Iso]        │
│  Style: [Pixel art]  Engine: [Godot web]  Type: [▶ Play] │
├──────────────────────────────────────────────────────────┤
│  ★ START HERE                                            │
│  "Tiny VFX algorithms": 5 studies · 5 sandboxes          │
├──────────────────────────────────────────────────────────┤
│  SERIES · Tiny VFX algorithms (top-down pixel)    →      │
│  [#1 Snow ▶] [#2 Acid ▶] [#3 Rain ▶] [#4 Forest ▶] [#5 ▶]│
│   each card: mini animated thumbnail, Study | Play       │
├──────────────────────────────────────────────────────────┤
│  SERIES · Game AI                                 →      │
│  [Enemy AI for Hero Defense]  [next: MMO creatures…]     │
├──────────────────────────────────────────────────────────┤
│  SERIES · Procedural generation                   →      │
│  [Character composition] [next: Towns…]                  │
├──────────────────────────────────────────────────────────┤
│  BY PROJECT   Asterion Online (7) · Hero Defense (2) …   │
├──────────────────────────────────────────────────────────┤
│  TECHNIQUE ATLAS  dither-threshold (4) · palette-lut (5) │
│  boids (2) · poisson-disk (1) · shadowcasting (1) …      │
├──────────────────────────────────────────────────────────┤
│  RECENTLY UPDATED · full list (sortable table)           │
└──────────────────────────────────────────────────────────┘
```

Key ideas:
- **One card per study,** with the sandbox as a ▶ Play button on the same card. Today they are two unrelated rows.
- **Series shelves** in reading order, each with an "upcoming" ghost card. That shows the plan and invites ideas.
- **Facet chips** filter live, and the URL updates (`?genre=mmorpg&style=pixel-art`) so filtered views can be shared, for example a "Kingsfoil MMO reading list".
- **Animated thumbnails:** each sandbox exposes `?thumb=1` to render a tiny 160×90 loop. Alternatively, generate static `og/*.png` thumbnails at build time with Playwright, which is cheaper and also gives social cards.
- **Stats strip:** "5 series · 7 studies · 5 sandboxes · 230 techniques · 1,100 sources", generated from the manifest and quietly showing how deep the library is.
- **Keep the old flat list** as a sortable table at the bottom for people who like it.

---

## 6. Make each page part of the system

- **Shared site chrome:** a thin top bar (logo → home, series, search) and a footer with tags as clickable chips, the related studies and "last updated", all injected by `kf-nav.js` from the manifest.
- **Consistent metadata:** `<meta name="description">`, Open Graph and Twitter cards (image per study), canonical URL, and JSON-LD (`TechArticle` or `LearningResource`) built from the manifest.
- **A cheat-sheet page per study:** one screen with the top 5 conclusions, the recommended Godot architecture diagram, the 5 best techniques with ratings, and links. It's the version you'd send a teammate or pin in the Kingsfoil WhatsApp group.
- **Publish the Markdown reports** (`/reports/*.md`) and link them as "Read the source report (Markdown)". It's good for transparency, for grepping, and for feeding back into Claude.
- **Changelog per study:** the review fixes we made (candle steadiness, shadow remap, caption corrections) belong in a small "Revisions" box. It builds trust and makes later updates normal.
- **Standard IDs for techniques** (`#C3`, `#B2`…) so other pages can deep-link straight to a technique profile.

---

## 7. Search

| Option | Cost | Fit |
|---|---|---|
| **Pagefind** (static search index built at deploy, MIT) | Low: one build step, ~100 KB runtime | ⭐ Best fit: full-text over all studies, works offline, facet filters supported |
| Manifest-only client search (titles, summaries, tags) | Very low | Good first step; no full text |
| MiniSearch / Fuse.js over extracted technique profiles | Medium | Lets you search "metaballs" and land on the exact profile |

**Recommendation:** start with manifest-only search alongside the facet chips, then add Pagefind when you move to a git-based build (section 10).

---

## 8. Cross-study knowledge pages (the compounding value)

The five VFX studies share a hidden engine. Make it visible:

1. **"The shared per-pixel engine" page.** It covers the common loop (a byte buffer per effect, a Bayer/noise threshold, a palette LUT with variants, an exposure/occluder map, a fixed-timestep sim) with one Godot reference scene. It becomes the backbone for Asterion's weather and lighting.
2. **Technique Atlas.** One row per technique: where it appears, its ratings in each study, the best pixel-art version, and Godot notes. Generated from technique tags plus scorecards.
3. **Games index.** Every game cited across all studies (about 200 so far), with what it teaches per study: "Tibia → light model (Light), tile occlusion (Forest), slime (Acid)".
4. **Sources library.** A deduplicated bibliography (GDC talks, papers, repos) with licence flags. The same Bridson, Hugo Elias and Quake sources keep coming back.
5. **Glossary:** COLORMAP, exposure map, talus, film threshold, phenology offset, polar shadow map…
6. **Licence radar:** a single table of every open-source gem across the studies (MIT ✔ / GPL ⚠ / AGPL ⛔). That matters for the MMO server.

---

## 9. What to research next (prioritized)

### Finish the "world feels alive" set (VFX series)
| Priority | Study | Why now |
|---|---|---|
| 1 | **Fire & smoke** (campfires, burning buildings, spreading fire, smoke columns) | The DOOM fire is the series' reference and still has no study of its own; it also connects rain (extinguish), forest (wildfire) and light |
| 2 | **Water bodies** (rivers, sea, shorelines, foam, flow maps) | Deliberately left out of Rain; Asterion needs coasts |
| 3 | **Fog, mist & clouds** (cloud shadows, valley fog, fog of war) | Left out of Rain; ties into the Light study's visibility work |
| 4 | **Grass, wind & small life** (trampling, swaying fields, butterflies) | Completes Forest; cheap and very "alive" |
| 5 | **Magic & spell VFX** (projectiles, auras, hit sparks, screen feedback) | Core MMO combat readability |
| 6 | Ice/frost & lava | Biome variety; reuses the acid and snow engines |

### Capstone integration study
**"Weather & climate engine for Asterion".** Combine snow, rain, light, forest and fog into one server-driven climate model (seasons, biomes, weather fronts, day/night) with one Godot prototype. It turns five studies into one shippable system.

### New series that matter for the games
- **MMO systems (Tibia-like):** area of interest and netcode for tile MMOs; death penalty and loot (your "meaningful death" pillar); skill-by-use progression balancing; player economy and anti-inflation; server tick and persistence.
- **World building:** autotiling and tileset grammar (47-tile/blob); cliffs and elevation in top-down; procedural towns that reuse character composition.
- **Characters & animation:** paper-doll layering for 8 directions; procedural walk and idle; hit reactions.
- **Game feel:** juice for top-down combat (hitstop, knockback, screen shake budgets).
- **Audio ambience:** sound layers driven by biome and weather, the audio side of the VFX series.

---

## 10. Workflow & tooling

1. **Put everything in a GitHub repo**: site, `manifest.json`, `taxonomy.json`, reports, and every `build-*` pipeline. It is the single biggest risk fix, since today the builds exist only in an ephemeral workspace. Connect Netlify to the repo for automatic deploys.
2. **A shared study template:** merge the five `build-*` folders into one `studykit/` (core.js, style tokens, components, test.py) with a per-study `study.yaml` (theme colours, figures, tags). New studies get faster and stay consistent.
3. **A validator in CI:** manifest schema, taxonomy membership, link check, no external images, page weight budget, mobile overflow, console errors. It is the same Playwright checks we run by hand today.
4. **Naming convention** for new slugs: `{series}-{concept}[-{qualifier}]` → `vfx-fire-topdown-pixel`, `mmo-netcode-tile`, `ai-creature-behaviour`. Keep old URLs working with Netlify `_redirects` instead of renaming.
5. **Performance budget:** studies are 400–600 KB, and the character study is 1.09 MB. Lazy-load figure scripts below the fold and add `_headers` with long cache times for fonts and assets.
6. **Update the research skill** (`game-research-site`) so every new study automatically:
   - writes manifest v2 with tags from `taxonomy.json`,
   - pairs the sandbox,
   - registers the series and lets `kf-nav.js` handle the nav,
   - generates a cheat sheet and an OG image,
   - publishes the Markdown report.

---

## 11. Quick wins vs bigger bets

| Effort | Idea | Impact |
|---|---|---|
| ⚡ 1 h | Merge each study and its sandbox into one homepage card; group the homepage by series | High |
| ⚡ 1 h | Add `type`, `series`, `pair`, `tags` to the manifest (backfill all 12 entries) | High |
| ⚡ 2 h | `kf-nav.js` auto series nav plus related links; delete the hand-patched navs | High |
| ⚡ 2 h | Facet chips plus manifest search on the homepage | High |
| 🛠 ½ day | OG images plus meta tags plus sitemap and RSS | Medium |
| 🛠 ½ day | Publish reports and cheat sheets | Medium |
| 🛠 1 day | GitHub repo plus `studykit` plus validator plus Netlify CI | Very high (risk + speed) |
| 🏗 1–2 days | Technique Atlas, Games index, Sources library | Very high (compounding) |
| 🏗 2 days | Pagefind full-text search | Medium–high |
| 🏗 study-sized | Fire & smoke study, then the Weather & climate capstone | High |

---

## 12. Suggested next three steps

1. **Manifest v2 + taxonomy + homepage v2** (sections 3–5) in one pass: backfill tags for all 12 pages, regroup into series, add facet filters and search.
2. **Repo + studykit + validator** (section 10): make the five build pipelines reproducible from GitHub and update the research skill to produce tagged, series-aware output.
3. **VFX #6: Fire & smoke**, the first study built on the new system, followed by the Technique Atlas.
