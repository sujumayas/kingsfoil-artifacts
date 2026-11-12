# Figure plan for feel-loot-pickup (shared by two figure agents)

The study weighs FEEL AND PIXEL ART, MMO PROBLEMS, IMPLEMENTATION and RUNTIME COST together. Every figure must look good as pixel art and feel good to poke at: snappy arcs, crisp bitmap labels, readable tier colours on grass, sound where noted. Where a technique has a cost, show a live readout (measured with performance.now() in the demo, or the report's measured figure from §6d, labelled which is which).

Figure names are FIXED. Each `<!--FIG name-->…<!--/FIG-->` block lives in the file listed, and its demo is registered with `reg('name', …)` in the matching demos file. Markup follows studies/feel-combat-juice/figs*.html exactly (`<figure class="fig" data-demo="name" id="fig-name">`, `.fig-h` with `Fig. @N`, title, `.illu` label when numbers are illustrative, canvases, controls, figcaption). Figures use only facts in studies/feel-loot-pickup/report.md; label illustrative numbers. No images, no game art: original pixel drawings in code and the shared bitmap font and glyph-atlas helper in core.js. Animations via the core.js demo runner (requestAnimationFrame, paused offscreen). Audio only after a user gesture, off by default. Every figure works at 390 px phone width without horizontal overflow and with zero console errors. Offer a 0.25x slow-motion toggle where motion matters. Captions follow the user's style: plain words, no em dashes, no colons as mid-sentence connectors.

The sandbox (studies/feel-loot-pickup/sandbox.html) already has item icons, tier colours, a label atlas and synth sounds; reading it for a consistent look is fine, never edit it.

Each agent uses its own scratch folder: Agent R `notes/scratch-figR/`, Agent F `notes/scratch-figF/`. Never write in the other's folder.

## The recipe
`studies/feel-loot-pickup/build.py` was scaffolded from feel-npc-dialog and is stale. Agent R REPLACES it with a copy of the newest recipe, `studies/feel-combat-juice/build.py`, and copies `studies/feel-combat-juice/core.js`, `style.css`, `study.css` as the starting point, then adapts them to this report:
- 35 profiles: families A4, B3, C4, D4, E5, F4, G6, H5 (A1-A4, B1-B3, C1-C4, D1-D4, E1-E5, F1-F4, G1-G6, H1-H5)
- 5 generations, 34 index rows, 154 sources, 9 layers
- criteria `RLAB = ['Clarity', 'Delight', 'MMO fit', 'Fairness', 'Speed']`
- §6 subsections 6a Drop motion across games, 6b Ownership timers compared, 6c Races, prediction and bytes, 6d Runtime cost, 6e Death penalties compared (update table header lookups)
- FAMSUB / DEEPSUB labels, stack subtitles, index quick-filter chips, Context split sentence, title, meta, CTA and sandbox copy ("Loot and Pickup Sandbox"), byline November 2026 (also in hero.html)
- Core.js is minified one-liners: never add a `//` comment mid-line, it comments out the rest of the line.

## Agent R (recipe owner): build.py, hero.html, core.js, style.css, study.css, figs1.html + demos1.js, figs3.html + demos3.js
Agent R adds shared helpers to core.js early (item icon set at 8x8 or 12x12, tier colour and shape table from §7 / report C1, cached label atlas drawing, halo sprite, tiny hero and corpse sprites) so both agents look the same.

figs1.html / demos1.js
- `hero` (hero.html; demo in demos1.js): a live mini field. A goblin dies, its loot pops on 400 ms arcs with a floor shadow and tier ascending stagger, a legendary beam rises, labels appear on hold, gold magnets to the hero and items fly to the bag. Buttons "Corpse", "Spill", "Crowd", "Plain"; live ms readout.
- `timeline`: the §3 generations, clickable.
- `containers` (A1): the same kill in four styles side by side or switchable: corpse container with loot window and a "Loot of a wolf" line, ground spill, one bag coloured by best item (A3), direct to bag with a toast (A4). Click counter per kill.
- `scatter` (A2): spill patterns stepped tile by tile: Ragnarok cycle, MapleStory row (alternating sides), Diablo ring search outward around walls; drag walls onto the grid.
- `arc` (B1): the 400 ms arc with a 20 px apex, sliders for duration and apex, sound on landing toggle, SPD vs devilutionX vs Flare timing presets from §6a; slow motion.
- `landing` (B2): floor shadow on/off, bounce on/off, legendary-only hop; landing sound by material; shows why bounce slows reading.
- `bigdrop` (B3): a 15 and a 30 item boss drop with 40 ms stagger, 600 ms sequence cap, tier ascending vs random order; stack-size gold sprites (1 / few / pile).
- `tiers` (C1): five tiers on grass with the hex values and the shape ladder; colour-blind simulation toggles (protan, deutan, tritan, greyscale) to prove the shapes carry the tier.
- `beams` (C2): glow pulse 2 s, 60% cap, phase from item id; legendary beam seen 2 s by strangers vs persistent for the owner; an edge chip when off screen; viewer toggle "owner / stranger".
- `stings` (C3): tier sounds and value stings, voice pool of 8 with priority own > party > others, 6 dB duck for 300 ms on a legendary; drops-per-second slider; counters. Muted until a click.
- `honest` (C4): effect size follows tier; a "fake near miss" toggle (a beam that fizzles) next to the honest version, with the report's psychology numbers in the caption.
- `lootlog` (D1): Tibia-style "Loot of X:" lines, party lines, tier colouring of item names in the log, a filter for own vs party.
- `labels` (D2): labels only on a hold key, owner first, cap 32 sorted by tier then own then distance; "+N" when hidden.
- `declutter` (D3): the grid solver vs naive; tile stacks, sideways push, max 7 steps then hide; candidate count slider up to 3000 with a live ms readout next to the report's measured 0.18 ms vs 0.93 ms.
- `filters` (D4): a tier style table (font size, colour, beam, sound) with three presets (show all, hide junk, only rare+) applied to a pile of drops.

figs3.html / demos3.js
- `costs` (6d): the measured benchmark as a log-scale bar chart (Metal / 6x CPU throttle / SwiftShader) with the 16.7 ms line; rows for blits, halo vs shadowBlur glow, beams, label atlas vs per-glyph vs fillText, solver, boss drop cheap vs naive. Machine label (M4 Pro, Chromium 153). Note that SwiftShader rows compare only within their column.
- `score` (§5): the scorecard, sortable, with a radar for the selected row (copy feel-combat-juice's pattern).
- `matrix` (§5): feel vs cost scatter, each profile at (Clarity + Delight) against (MMO fit + Fairness + Speed); family colour; click shows the profile.
- `stack` is generated by build.py from §7 (9 layers).

## Agent F: figs2.html + demos2.js only (never edit build.py, core.js, hero.html, figs1/3, demos1/3, style.css, study.css)
Use the helpers Agent R puts in core.js; if they aren't there yet when you start, put a local copy inside demos2.js with the same look, and switch to core.js helpers before you finish if they exist.
- `reach` (E1): click an item 4 tiles away; the hero walks, retries every 300 ms, picks at 1 tile; 200 ms action cooldown queues clicks instead of dropping them; a click timeline.
- `quickloot` (E2): many corpses around the hero; E loots all you may open in the 3x3, cap 30; compare click counts: click each corpse vs quick loot.
- `magnet` (E3): walk-over gold with a 1 tile magnet, owner only, starting 400 ms after landing, never in PvP combat; radius slider 0 to 4 tiles shows how a big magnet steals clarity in a crowd.
- `flybag` (E4): 250 ms fly with a ±16 px side curve, bag bump 1.0 to 1.15 to 1.0 over 120 ms, "+N" for more than 3 items, coin pitch +1 semitone per pickup within 1.2 s, cap 8. Muted until a click.
- `bagfull` (E5): the item stays, red bag flash, exact message, loud style at most once per 15 s; spam the click to see the throttle.
- `owner` (F1): a fight with 3 attackers; damage bars; owner = top damage with first attacker x1.3; 15 s owner and party, 10% helpers until 20 s, then public; timeline scrubber.
- `timers` (F2 / 6b): the ownership timers of Tibia, OSRS, Ragnarok, MapleStory, UO, Albion and the Asterion proposal as horizontal bars from §6b; private styles "hide / grey / show and block" side by side.
- `partymodes` (F3/F4): one drop shared by a party of 4 under free for all, round robin, need/greed, personal loot and a boss reward chest scored by the mean of damage, damage taken and healing shares.
- `race` (G2): two players click one coin; first packet wins vs tick batches with a rotating rank; latency sliders per player; who wins over 100 trials (fairness counter).
- `predict` (G3): latency 0 to 400 ms; wait for server / cosmetic prediction (tick and 4 px hop, fly on OK, 2 px settle shake on reject) / full prediction (item vanishes, pops back on reject). Make the rejection visible.
- `dupe` (G1/G4): a step-through of the authoritative move; a "crash here" button between two non-transactional saves shows the dupe; GUID + one transaction shows why it cannot happen.
- `aoi` (G5): a viewport of 18 x 14 tiles; item adds 20 B and removes 9 B to viewers in range; per-tile cap 10 with a count; stack merging; despawn heap with a 10 s blink; bytes/s counter.
- `crowd` (G6): 30 players around a boss corpse; own / party / others LOD (others: no arc, no glow, beam 2 s, no labels, no sound); live ms and counters, about 200 visible items budget line.
- `deathroll` (H1): roll a Tibia death with 0 to 5 blessings, red skull and amulet of loss toggles; backpack 100/70/45/25/10/0%, slots a tenth; 1000-death histogram of items lost.
- `protect` (H2): keep 3 most valuable (OSRS), blessings, insurance (UO), destruction share (Albion) compared on the same inventory.
- `grave` (H3): a grave timer that pauses offline (OSRS 15 min) vs a Tibia corpse that rots regardless (1200 + 1200 s, then bones); compressed time, labelled.
- `corpseloot` (H4/H5): who may loot a player corpse: nobody first (Tibia), killer's group 60 s then public with a 1.5 s channel and yellow looter name (Asterion), loot key (OSRS); plus a death recap panel.

## Figure -> section map (Agent R puts this in build.py)
Place each figure after the profile it explains (AFTER_PROFILE, ids in parentheses above; for a pair like F3/F4 place it after the first). `timers` goes after F2; `costs` in §6d; `score` and `matrix` after §5; `timeline` in §3; `stack` in §7; `hero` at the top.
Count: Agent R 18 (hero, timeline, containers, scatter, arc, landing, bigdrop, tiers, beams, stings, honest, lootlog, labels, declutter, filters, costs, score, matrix) plus the generated `stack`. Agent F 17 (reach, quickloot, magnet, flybag, bagfull, owner, timers, partymodes, race, predict, dupe, aoi, crowd, deathroll, protect, grave, corpseloot). Total 35 figures plus the stack.
