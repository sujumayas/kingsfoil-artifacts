# Figure plan for vfx-snow-32px (shared by three figure agents)

The study asks what changes when the snow engine of VFX #1 moves from 8 px tiles and 7x12 px characters to 32 px tiles, 24x32 px characters and a 640x360 canvas. It has two equal goals, ARTISTIC QUALITY at 32 px and RUNTIME EFFICIENCY at 4 times the pixels. Every figure must look good as pixel art at 32 px scale. Wherever the technique has a cost, the figure also shows a cost readout. That is either ms measured in the demo with performance.now(), or the report's measured figure from §6a, labelled as one or the other. Comparison figures put the old 8 px way and the 32 px way, or the cheap-but-ugly and the pretty option, side by side.

Figure names are FIXED. Each `<!--FIG name-->…<!--/FIG-->` block lives in the file listed below. Its demo is registered with `reg('name', …)` in the matching demos file. Markup follows studies/vfx-magic/figs*.html exactly: `<figure class="fig" data-demo="name" id="fig-name">`, `.fig-h` with `Fig. @N`, the title, an `.illu` label when numbers are illustrative, canvases, controls and a figcaption.

Content rules:
- Figures use only facts from studies/vfx-snow-32px/report.md. Read the profile a figure belongs to before building it, and take every number from there. Illustrative numbers carry a label.
- Where a figure shows the same thing as the sandbox (studies/vfx-snow-32px/sandbox.html, final), match its numbers. They are listed in notes/SANDBOX-SPEC.md under "As built", which overrides the earlier parts of that file. If the report and the sandbox seem to disagree, grep both before reporting it.
- ART. No images and no game art. Draw original pixel art in code at 32 px scale. Reuse the sandbox's art so the page looks like one game: copy the 24x32 character row templates (`UP_F`, `UP_B`, `UP_S`, the `LF_*` and `LS_*` leg rows, `mkFrames`, `outlineSprite`), the snow ramp (`#f2f1ec`, `#cbd3dc` body, `#9eabb8`, `#7d7a96`, `#5a5674`), the print colours (`#7b8199` floor, `#575b76` wall line) and whatever ground, pine or roof drawing you need from sandbox.html into your own demos file, inside your own namespace. Each agent keeps its own copy; do not depend on another agent's file. Rules the report sets for 32 px art apply to every figure: clusters of at least 2x2 px, no stray single pixels except where the figure is showing that mistake, 1 px dark outlines on sprites, no pure white in the snow body, whole-pixel motion.
- Figure canvases are drawn at native art pixels and scaled by whole numbers with `image-rendering: pixelated`. A 32 px tile needs room, so typical canvases are 160x96 to 256x144 (5x3 to 8x4.5 tiles) shown at 2x or 3x. Pick sizes so the figure fits a 390 px phone at a whole-number scale (a 160 px wide canvas fits at 2x).
- Animate through the core.js demo runner, which uses requestAnimationFrame and pauses offscreen.
- Every figure must work at 390 px phone width, with no horizontal overflow and zero console errors.
- core.js is minified one-liners. Never add a `//` comment mid-line, because it comments out the rest of the line.
- Captions, labels and button text are plain prose. No em dashes. No colons joining clauses. Sentence case. Name the mechanism and the number. Do not use words like crucial, delve, enhance, showcase, leverage, utilize, landscape, vibrant.
- Each agent uses its own scratch folder: notes/scratch-R/, notes/scratch-F/, notes/scratch-H/. Do not run git.
- If you find an error in the report while building (a number that contradicts its own table, a formula with a wrong sign, pseudocode with a wrong order of events), do not edit report.md. List it in your final reply with the line number.

The recipe to copy is studies/vfx-magic/build.py and core.js, the newest ones with the same report layout. The scaffolded studies/vfx-snow-32px/build.py and core.js were cloned from vfx-light and are stale, so Agent R replaces them from the magic recipe.

Report facts the recipe needs:
- 30 profiles: A1-A7, B1-B5, C1-C2, D1-D7, E1-E4, F1-F5 (families are NOT equal in size, and there are 6 families, A to F).
- 30 scorecard rows. Header `| # | Technique | Simpl. | Speed | Pixel taste | Mood | Interact. | Sum |`. Criteria: Simplicity · Speed · Pixel taste · Mood · Interactivity.
- 4 generations in §3.
- 32 rows in the §11 index.
- 144 sources in 12 groups.
- 32 gems.
- 8 layers in §7.
- §6 headings: 6a Measured costs: what the snow engine costs at 640x360, 6b The conversion table: VFX #1 numbers at 32 px, 6c Games by tile size, 6d Flake scaling across engines, 6e What artists say changes with size.
- The sandbox is called "Snow 32 Sandbox" and its page is `vfx-snow-32px-sandbox.html`. Its canvas is 640x360, not 320x180.
- Series number 11. Byline month November 2026. Title "Top-down pixel snow at 32 px: scaling the snow engine to 32x32 tiles and 24x32 characters".
Read the report for the exact headings and table headers.

## Agent R (recipe owner): build.py, core.js, hero.html, style.css, study.css, figs1.html + demos1.js
R also wires `FIGFILES = ['figs1.html','figs2.html','figs3.html']` and the full figure-to-section map below, and makes `.venv/bin/python -m studykit build vfx-snow-32px` pass even while figs2 and figs3 are still in progress, by tolerating missing figures only while `FINAL = False`. R leaves `FINAL = False` and says so; the lead sets it to True for the final build. R updates the title, meta description, byline month, TOC, family lists, CTA copy, the asserts for the counts above, the table headers looked up in §6, the quick-filter chips for the §11 index and the sentence where the Context section is split around a figure. The study is not yet registered in site/catalog.json; the lead registers it. If the build needs the catalog entry, say so and stop there instead of editing the catalog.

figs1.html / demos1.js (10 figures):
- `hero` (in hero.html, demo in demos1.js): a live strip of the 32 px scene. A 24x32 character walks across snow and leaves paired boot prints, flakes fall in three sizes, a pine and a lamp stand by. Buttons "Field 1:1", "1:2", "1:4" and "Bayer" against "Art map", plus a small live ms readout.
- `timeline`: the §3 generations, clickable.
- `scale` (A1, placed in Context or after A1): the same small scene at 8 px tiles with a 7x12 character and at 32 px tiles with a 24x32 character, both on a 640x360 outline, with the tile count on screen (40 x 22.5 against 20 x 11.25) and the character's share of screen height (8.9% at 640x360 against 17.8% at 320x180). A window-size picker (720p, 1080p, 1440p, 4K) shows the whole-number scale for 640x360 and for 480x270, and which sizes fail.
- `fieldratio` (A2, A3): one snow patch drawn from a depth field at 1:1, 1:2 and 1:4, with nearest against bilinear sampling. Drag to add or shovel snow. Shows the cells as a grid overlay, the bytes, the picks per tick (37,600 / 9,400 / 2,350) and the measured tick cost for each. Nearest at 1:4 must show the blocky edge; bilinear must not.
- `splitfield` (A4): boot prints stamped into a packed field at 1:1, 1:2, 1:4 and split (depth 1:4, packed 1:2), as the sandbox showed them: a heel gap at 1:1, 4x6 px holes at 1:2, blunt marks and slivers at 1:4. State what note 12 inferred and what the sandbox showed.
- `autotile` (A5): per-tile snow bands drawn with a dual-grid overlay (15 tiles per band) against a 47-blob set. Paint bands 0 to 3 on a small tile grid; the overlay follows in 16 px jumps. Show the tile counts and the 240 bytes per view.
- `globallevel` (A6): one global snow level compared against a fixed noise grid, as Project Zomboid does. A level slider; tiles switch on in patches; zero per-tile network state. Beside it, Don't Starve Together's single level that fills in 300 s with object caps at 0.015.
- `percell` (A7): RimWorld's model. One depth value 0 to 1 per cell drawn as a smooth alpha mesh, a tick that visits 0.06% of cells, a redraw only when a cell changes by more than 0.15, footprints only at depth 0.4 or more. Counters for cells visited and meshes redrawn.
- `rowsweep` (F3): the exposure bake two ways on the same small map with a house and a pine. Ray per cell against one sweep per row, animated, with an operation counter for each and the measured 15.9 ms against 0.49 ms at 1:1. Both end in the identical map; a wind direction toggle.
- `upload` (F2): bytes per texture upload by field size (160x90 R8 14,400, 320x180 R8 57,600, 640x360 RGBA8 921,600) as bars, and whole-field upload against eight 64x64 dirty chunks (0.020 ms against 0.039 ms in WebGL2). Say that Godot Compatibility re-uploads the whole image and that no measured Godot time exists.

## Agent F: figs2.html + demos2.js only
Never edit build.py, core.js, hero.html, figs1/figs3, demos1/demos3, style.css or study.css. 11 figures:
- `bayer32` (B1): a 4x4 Bayer dusting on an 8 px tile and on a 32 px tile at the same coverage level, zoomed. A level slider 1/16 to 16/16 and a Bayer 8 toggle. A counter of isolated pixels per tile (64 at level 1/16, 256 at 4/16 on a 32 px tile).
- `artmap` (B2): the art threshold map. A depth slider grows snow from about 6 seed blobs per tile into merged patches, in clusters of at least 2x2 px, with the frost tint for the thinnest cover as a toggle. Side by side with Bayer at the same depth. Show the straight-run length of the edge (13 px for a cluster map against 41 to 43 px for Bayer, the report's measured values).
- `maskblend` (B3): a summer tile and a hand-drawn winter tile blended per pixel through `depth > threshold`. A depth slider. Label it as this study's proposal with no shipped precedent found.
- `overlay` (B4): what shipped games do. A seasonal tileset swap (all at once), an overlay autotile, and a half-way "SnowGrass" ground, switched by buttons on the same small map.
- `edgeshade` (B5): one snow patch with the edge shading built up by toggles: flat, highlight rim on north and west, shadow line on south and east, the 2 px south line for deep snow, drift lines. Zoomed so each 1 px line is visible.
- `caps` (C1): a roof and a pine with a snow slider. The shaped rule (fills from the ridge, a lip 2 rows over the eave, caps following each pine tier) against plain threshold noise on the same objects.
- `artmask` (C2): a coarse baked exposure map (1:2 and 1:4) under an eave, soft by 2 px and 4 px, and the same map multiplied by a static art-resolution mask so the eave edge is crisp. Toggle the mask.
- `flakesize` (E1, 6d): flake size against tile size. The engines of §6d as points (VX Ace 6 px on 32, MV 9 px on 48, Stardew 12 px on 64) on the 0.1875 line, with the sandbox's 1, 2 and 3 px flakes below it. A live strip shows "1 px only", "mixed" and "large", with the coverage percentage read from the canvas against the 1% rule.
- `tiledcell` (E2): Stardew's method. One animated 16x16 cell tiled over the view, with a pan control that shows it stays locked to the world, and a toggle that shows the repetition by tinting every second cell.
- `zflakes` (E3): flakes with height in a top-down view. Each near flake is drawn at (x, y - z) with a shadow dot on the ground and lands where the dot is. Three layers in 1, 2 and 3 px. Toggle shadows and height off to show why they are needed.
- `flakemotion` (E4): fall speed in tiles per second with a slider from 0.5 to 5.6 and marks for Stardew debris, Emerald, the sandbox (2), MV (3.7) and VX Ace (5.6). A second toggle compares whole-pixel steps with sub-pixel positions, and world-locked with screen-locked flakes while the view pans.

## Agent H: figs3.html + demos3.js only
Never edit build.py, core.js, hero.html, figs1/figs2, demos1/demos2, style.css or study.css. 13 figures:
- `bootprints` (D1): the 4-frame walk cycle of the 24x32 character, large, with a frame stepper and a play button. Frames 0 and 2 are the contact frames and stamp the left and right print (4x6 px, rows 6 px apart, one per foot every 16 px). A switch to the VFX #1 stamp (2x2 dots every 4 px) on the same walk.
- `tilemark` (D2): one mark per tile left. Pokémon-style directional prints on the tile just left with a hold and a fade, and Tibia's whole-tile swap that reverts after 10 s, on a tile grid with a walker. A counter of live marks against the pool sizes the report gives.
- `sink` (D3): the sink clip on the 24x32 sprite with a slider from 0 to 12 px in 2 px steps, the 3-row front rim as a toggle, and marks at 6 px (weather snow) and 12 px (authored deep snow, the Platinum tier). Show how much of the legs is left at each step.
- `trench` (D4): a walker in snow of rising depth. Boots up to 4 px of sink, then the round brush of radius 5 px every 2 px of travel with the floor at 40% of the depth around it. A toggle to the old axis-aligned bar to show the stair steps on diagonals.
- `stride` (D5): tile-to-tile timing. A slider for the tile time T from 250 to 600 ms. The walker crosses tiles with one 4-frame cycle per tile (frame time T / 4), prints at progress 0 and 0.5. A toggle to a stride that does not match the tile (the RPG Maker MV ratio of 1.25 tiles per step) shows the feet sliding.
- `smallcues` (D6): the shadow ellipse (14x5 px, a palette swap, no black blend), breath puffs below 1 °C, kicked snow, and snow settling on hat and shoulders while standing, each as a toggle on one character. Mark which have shipped precedents and which are this study's idea.
- `crowd` (D7): 0 to 100 walkers leaving prints on one field. Counters for stamps per second and byte writes per second (the report's 2,500 for 20 players and 12,500 for 100), live ms for the stamping, and what to drop first.
- `groundcost` (F1): the ground render variants as bars from §6a (VFX #1 loop at 320x180 and 640x360, nearest, bilinear with table weights, the fixed 9/3/3/1 upsample, the full 32 px renderer, the WebGL2 shader), with a desktop / 6x throttle switch and the 16.7 ms line. A small live canvas runs the 9/3/3/1 loop and shows its own ms, labelled as measured in this browser.
- `nogpu` (F5): what a machine without a GPU pays. The shader at 640x360 and at 1920x1080 on Metal against SwiftShader, and the flake quads at about 13 µs each (580 quads, about 8 ms), as bars with the frame line. Say that SwiftShader is a software renderer, not a phone.
- `costs` (6a): the whole-frame presets as log-scale bars: VFX #1 engine at 320x180, the naive 1:1 port, field 1:2 with CPU render, field 1:2 with the WebGL2 shader, for desktop and for the 6x throttle, with the 16.7 ms frame line and the budget share. Source labels; say that the throttle is a proxy and that these are browser numbers, not Godot numbers.
- `convert` (6b): the conversion table live. Pick a tile size (8, 16, 32, 48 px) and every VFX #1 number shows in tiles and in px at that size, coloured by whether it scales with the tile, with the pixel, or stays constant.
- `tilesizes` (6c): the games of §6c as boxes drawn to scale: a tile and a character silhouette for each (abstract grey shapes, no game art), sorted by tile size, with Asterion's 32 px tile and 24x32 character marked. Click a game for its snow method, footprints and falling snow as the table gives them. Empty cells stay empty.
- `score`: the §5 scorecard, sortable, with a radar for the selected row. Copy vfx-magic's score figure pattern.
- `stack` is generated by build.py from §7 (8 layers).

## Figure -> section map (Agent R puts this in build.py)
Place each figure after the profile it explains (ids in parentheses above). `scale` goes after A1, `flakesize` after E1, `costs` in §6a, `convert` in §6b, `tilesizes` in §6c, `score` after §5, `timeline` in §3, `stack` in §7. Total: 34 figures plus the stack (hero, timeline and 8 more in figs1 = 10; 11 in figs2; 13 in figs3).
