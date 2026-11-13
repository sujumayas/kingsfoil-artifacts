# Figure plan for vfx-fire-32px (shared by three figure agents)

The study asks what changes when the fire engine of VFX #6 moves from 8 px cells and tiny sprites to 32 px tiles, 24x32 px characters and a 640x360 canvas. It has two equal goals, ARTISTIC QUALITY at 32 px and RUNTIME EFFICIENCY at 4 times the pixels. Every figure must look good as pixel art at 32 px scale. Wherever the technique has a cost, the figure also shows a cost readout. That is either ms measured in the demo with performance.now(), or the report's measured figure from §6a, labelled as one or the other. Comparison figures put the old 8 px way and the 32 px way, or the cheap-but-ugly and the pretty option, side by side.

Figure names are FIXED. Each `<!--FIG name-->…<!--/FIG-->` block lives in the file listed below. Its demo is registered with `reg('name', …)` in the matching demos file. Markup follows studies/vfx-snow-32px/figs*.html exactly: `<figure class="fig" data-demo="name" id="fig-name">`, `.fig-h` with `Fig. @N`, the title, an `.illu` label when numbers are illustrative, canvases, controls and a figcaption.

Content rules:
- Figures use only facts from studies/vfx-fire-32px/report.md. Read the profile a figure belongs to before building it, and take every number from there. Illustrative numbers carry a label. notes/00-verification.md settles disagreements between notes.
- Where a figure shows the same thing as the sandbox (studies/vfx-fire-32px/sandbox.html), match its numbers. The sandbox is still being built. The lead will add an "As built" section to notes/SANDBOX-SPEC.md and message you when it is final; that section overrides the earlier parts of the file. Until then use the report. If the report and the sandbox seem to disagree, grep both before reporting it, because the sandbox may be mid-edit.
- ART. No images and no game art. Draw original pixel art in code at 32 px scale. Reuse sandbox art so the page looks like one game: the 24x32 character row templates (`UP_F`, `UP_B`, `UP_S`, the `LF_*` and `LS_*` leg rows, `mkFrames`, `outlineSprite`) from studies/vfx-snow-32px/sandbox.html, and, once studies/vfx-fire-32px/sandbox.html is final, its fire ramp, flame loops, burnt ground, house and tree drawing. Copy into your own demos file inside your own namespace. Each agent keeps its own copy; do not depend on another agent's file. Rules the report sets for 32 px art apply to every figure: clusters of at least 2x2 px, no stray single pixels except where the figure is showing that mistake, 1 px dark outlines on sprites, fire ramps that bend from purple through red to yellow, the bottom 2 to 3 rows of a flame held still, whole-pixel motion.
- Figure canvases are drawn at native art pixels and scaled by whole numbers with `image-rendering: pixelated`. A 32 px tile needs room, so typical canvases are 160x96 to 256x144 (5x3 to 8x4.5 tiles) shown at 2x or 3x. Pick sizes so the figure fits a 390 px phone at a whole-number scale (a 160 px wide canvas fits at 2x).
- Animate through the core.js demo runner, which uses requestAnimationFrame and pauses offscreen.
- Every figure must work at 390 px phone width, with no horizontal overflow and zero console errors.
- core.js is minified one-liners. Never add a `//` comment mid-line, because it comments out the rest of the line. Demo files start with `"use strict";`.
- Captions, labels and button text are plain prose. No em dashes. No colons joining clauses. Sentence case. Name the mechanism and the number. Do not use words like crucial, delve, enhance, showcase (except the sandbox button name), leverage, utilize, landscape, vibrant.
- Each agent uses its own scratch folder: notes/scratch-R/, notes/scratch-F/, notes/scratch-H/. Do not run git.
- PORT THE §7 PSEUDOCODE. Each agent ports the §7 code blocks listed under its name literally into a scratch script, runs it on small inputs and checks the output against the report's claims (event order, units, integer maths, signs, the roll timing). In the snow study this found 10 real bugs. List every problem with the report line number in your final reply. Do not edit report.md.
- If you find any other error in the report while building (a number that contradicts its own table, a formula with a wrong sign), list it in your final reply with the line number.

The recipe to copy is studies/vfx-snow-32px/build.py and core.js, the newest ones with the same report layout. The scaffolded studies/vfx-fire-32px/build.py and core.js were cloned from vfx-light and are stale, so Agent R replaces them from the snow-32px recipe.

Report facts the recipe needs (verify against report.md):
- 33 profiles in 8 families: A1-A3, B1-B6, C1-C5, D1-D3, E1-E6, F1-F4, G1-G4, H1-H2.
- 33 scorecard rows. Header `| # | Technique | Simpl. | Speed | Pixel taste | Mood | Interact. | Sum |`. Criteria: Simplicity · Speed · Pixel taste · Mood · Interactivity.
- 4 generations in §3.
- 45 rows in the §11 index (header `| # | Game | Fire idea | URL |`).
- 193 sources in 10 groups.
- 31 gems.
- 9 layers in §7.
- §6 headings: 6a Measured costs: what the fire engine costs at 640x360; 6b The conversion table: VFX #6 numbers at 32 px; 6c Games by tile size; 6d Spread speed in tiles per second, and the walking cap; 6e What artists say changes with size.
- The sandbox is called "Fire 32 Sandbox" and its page is `vfx-fire-32px-sandbox.html`. Its canvas is 640x360.
- Series number 12. Byline month November 2026. Title "Top-down pixel fire at 32 px: scaling the fire engine to 32x32 tiles and 24x32 characters".
- The study is registered in site/catalog.json already.

## Agent R (recipe owner): build.py, core.js, hero.html, style.css, study.css, figs1.html + demos1.js
R wires `FIGFILES = ['figs1.html','figs2.html','figs3.html']` and the full figure-to-section map below, and makes `.venv/bin/python -m studykit build vfx-fire-32px` pass even while figs2 and figs3 are still in progress, by tolerating missing figures only while `FINAL = False`. R leaves `FINAL = False` and says so; the lead sets it to True for the final build. R updates the title, meta description, byline month, TOC, family lists (8 families), CTA copy, the asserts for the counts above, the table headers looked up in §6, the quick-filter chips for the §11 index and the sentence where the Context section is split around a figure.

§7 code to port and run: the server tick (the 4 Hz tick, the once-per-second roll timed from the ignition tick, IGNITING flipping at the end of the tick, integer chances, rain and extinguish order). Check that a newly lit tile's first roll comes a full roll period after it caught.

figs1.html / demos1.js (12 figures):
- `hero` (in hero.html, demo in demos1.js): a live strip of the 32 px scene at dusk. A grass front sweeps across 32 px tiles with the burn-order front (glowing 2 px rim, scorch, charred), a campfire and a torch post burn with drawn loops, smoke rises in 2x2 clusters, a 24x32 character walks by with a torch. Buttons "VFX #6 look" against "32 px look", plus a small live ms readout.
- `timeline`: the §3 generations, clickable.
- `scale` (A1): the same small burning scene at 8 px cells with tiny sprites and at 32 px tiles with a 24x32 character, on a 640x360 outline, with tile counts, and a list of which buffers grow 4x with art pixels (flame buffers, the burn front render, the light apply) and which stay the same size (spread grid, smoke field, light map build), with bytes from the report.
- `spreadroll` (A2): one fuel strip, three runs. VFX #6's table at 8 px cells and 4 Hz, the same table on 32 px tiles at 4 Hz (4x faster in px/s; green grass 2.1 tiles/s, dry grass 3.7 tiles/s), and the 1 Hz roll per tile (back to 16.5 to 32 px/s). A walker at 2.5 tiles/s runs beside it so the reader sees dry grass outrun a player only in the middle run. Material picker. Show px/s and tiles/s measured live.
- `fieldres` (A3): smoke at 4, 8 and 16 px cells and the light map at 32, 8 and 4 px cells over the same scene, drawn at art resolution. Show cells, bytes and the report's measured build and apply costs, and that the apply cost does not change with map resolution.
- `framecost` (G1): the measured default frame from §6a as stacked bars by layer (light apply the largest), desktop against 6x throttle, 640x360 against 320x180, with the 16.7 ms line. Source labels.
- `uploads` (G2): bytes per whole-texture upload by field (from §6a / G2), bars, with the fixed per-upload cost the report gives. Say Godot Compatibility uploads whole textures and that these are WebGL numbers, not Godot.
- `lights` (G4): N fires lighting a small scene. PointLight2D-style per-item cap (15 lights per canvas item) shows lights dropping out as N grows, against a baked 8 px light map that takes any number. Counters for lights per item and bytes.
- `pingpong` (H1): two small heat buffers swapping each frame (GPU-style gather) against the in-place CPU loop, side by side, with the measured flame heights (the row where half the columns are lit: 95 against 73 rows at L 36) and the DrawableTexture2D status the report gives.
- `maskseed` (H2): a house roof and a tree crown whose burning part seeds a small buffer fire from the sprite mask, with a painted cooling map toggle that places the tongues.
- `convert` (6b): the conversion table live. Pick a cell size (8, 16, 32 px) and each VFX #6 number shows converted, coloured by whether it scales with the tile, with the pixel, or stays constant.
- `spreadspeed` (6d): the games of §6d on a tiles-per-second axis with the walking speed line (2.5 tiles/s) and the 1 tile/s cap of the 1 Hz roll. Empty cells stay empty.

## Agent F: figs2.html + demos2.js only
Never edit build.py, core.js, hero.html, figs1/figs3, demos1/demos3, style.css or study.css.

§7 code to port and run: the burn-front threshold (`d = b - T(px)`, the entry-direction formula, the arrival-time sample) and the in-place DOOM loop with smoothing before quantizing. Check band widths in px against the report's claims and the DOOM heights.

12 figures:
- `loops` (B1): the flame ladder drawn at 32 px scale: candle, torch on a post, hand torch, brazier, campfire, bonfire, with sizes, frame counts, ms per frame and tone counts from B1. Play, step, and a toggle that drops to 3 tones and 1 px licks to show the thin VFX #6 look.
- `tibiafield` (B2): a 3x3 fire bomb on 32 px tiles with field sprites that overflow their tile up and left inside a 64x64 canvas, y-sorted, and the 16 position variants by `x % 4, y % 4`. A toggle to one variant everywhere shows the stamped look, and a toggle that clips each flame to its tile shows why overflow reads better.
- `dying` (B3): one campfire through its stages, bigger and faster to smaller, slower and dimmer (Tibia campfire 5 x 100 ms light 7, 4 x 100 ms light 5, 6 x 300 ms light 3), with the field stages as a second row.
- `doom32` (B4): the DOOM fire at 32 px. Ratio 1:1 or 1:2, an L slider and a p slider with the height rule and the live median height, a 5-tone quantize with unequal bands, a "smooth before quantizing" toggle (3x3 or Lode) and a live lone-pixel counter (the report's 25.3% at L 8 against 0.3%). Live ms per buffer.
- `noisefire` (B5): a noise fire quantized to a 5-tone ramp and snapped to whole pixels (CPU emulation at figure size is fine), with octaves and snap controls, and the report's measured GPU and SwiftShader costs labelled as such.
- `stacked` (B6): Stardew's campfire built from three copies of one 4-frame loop with three phase seeds, against one copy, and the jitter and particle-only alternatives B6 describes.
- `burnmap` (C1): one or two 32 px tiles burning through the per-pixel burn-order map. Pick the entry side (8 directions), the noise weight `a`, and the band widths; the glowing 2 px rim, the scorch band and the charred zone move across the tile. Toggle to a 4x4 Bayer map to show the noise problem at 32 px.
- `arrival` (C2): a small field of tiles igniting on different ticks. Per-tile progress shows seams at tile borders; the continuous arrival-time front does not. A toggle shows the ignition-time texels. Label it as the study's own construction, untested in a shipped game.
- `tileswap` (C3): the cheapest fallbacks. A whole-tile swap and a dual-grid scorch autotile on the same burn, with tile counts and the 16 px steps.
- `tilestates` (C4): one tile's life as a strip with a time slider: fresh, catching, burning, dying, embers, ash, regrowing, with durations from C4 and which states the server stores.
- `house` (C5): a 3x3 house and a 1.5x2.5-tile tree burning in stages. Click edge tiles to ignite (inner tiles take no outside fire); the house stage follows the burnt fraction (25% roof flames, 60% roof collapse with a one-off burst, 100% charred stumps). The tree burns from one trunk cell with canopy flames climbing.
- `lava` (F4): lava at 32 px with Tibia's slow frames and position variants and Stardew's 10 x 200 ms checkerboard as options, a crust and glow band at the edge, and the light radius.

## Agent H: figs3.html + demos3.js only
Never edit build.py, core.js, hero.html, figs1/figs2, demos1/demos2, style.css or study.css.

§7 code to port and run: the rim-light shader logic and any burn-status or effect timing code in §7. Check the timings against §4 E and F.

14 figures:
- `smokecluster` (D1): smoke from a burning area on a field with 4, 8 or 16 px cells, drawn with the 2x2 cluster threshold against a 4x4 Bayer. Wind slider. Live ms and a lone-pixel count.
- `puffs` (D2): hero puffs by source from the D2 table (campfire, chimney, tree, house, steam burst): start and end sizes, rise speed, column height in tiles, rate. A cap of about 64 alive with a counter.
- `embers` (D3): embers and sparks at 2x2 and 1 px against 1 px only (the VFX #6 look), with pool use and the report's measured cost per 1,000.
- `burnchar` (E1, E5): a 24x32 character catching fire: warm palette-row tint, two 8x10 flames at shoulder and hip, the head flame on even ticks, 2x2 embers, the head puff, a white flash and a damage number per tick (11 px font, rise 48 px over 1000 ms, fade from 833 ms, merge within 400 ms). A toggle to Tibia's way (no overlay, a hit effect and an orange number only). Label which parts are Asterion additions.
- `torchwalk` (E2): the 4-frame walk with a carried torch, large, with a frame stepper, the hand offsets per frame, and the draw order by facing (torch after the body facing south and east, before it facing north and west). The flame loop runs on its own clock.
- `rimlight` (E3): a character near a fire you can drag. The 1 px rim and 1 px inner tone from the alpha-edge test toward the fire, the distance steps (both tones within 1.5 tiles, rim only to 3, none behind the fire), and the rotated fire shadow. Toggle to an additive glow to show the off-palette result.
- `sootwalk` (E4): fire fields as terrain on a tile grid. A walker paths around fields, a manual step in costs damage, and soot prints follow for 3 tiles after ash, fading in 10 s.
- `crowd` (E6): 0 to 50 players with torches on one screen. Counters for flames, lights, embers and the per-character budget from E6, live ms, and what to drop first.
- `areas` (F1): Tibia areas built from 1-tile effects on 32 px tiles: great fireball (37 tiles, radius-3 disc), explosion rune (5, plus), fire bomb (9, 3x3), fire wall (5, 1x5). Per-tile variants by position, the centre-first ring delay, and the repeat-effect rule.
- `missile` (F2): click a target tile. The missile flies `150 x sqrt(d)` ms in a straight line (d Euclidean in tiles), with a readout of time and tiles per second, and the old fixed 75 ms frame rule against the per-frame times from the modern data (FIREAREA 40 ms then 13 x 60 ms).
- `explode` (F3): an explosion with flash, fireball, smoke and debris, a 32x32 scorch decal that fades in 3 to 5 s, and whole-pixel shake from 2 to 6 px. Toggle shake on and off.
- `costs` (6a): the §6a tables as log-scale bars with the 16.7 ms line: the DOOM buffer sizes at 1:1 and 1:2, drawn loops, burn front at 20% and 100%, smoke, light, palette, and the noise shader, for desktop and the 6x throttle. Source labels; say these are browser numbers, not Godot numbers.
- `tilesizes` (6c): the games of §6c as boxes drawn to scale: a tile and an abstract grey character silhouette for each, a flame box at its size as a fraction of a tile, sorted by tile size, with Asterion's 32 px tile marked. Empty cells stay empty.
- `score`: the §5 scorecard, sortable, with a radar for the selected row. Copy vfx-snow-32px's score figure pattern.
- `stack` is generated by build.py from §7 (9 layers).

## Figure -> section map (Agent R puts this in build.py)
Place each figure after the profile it explains (ids in parentheses above). `scale` after A1, `spreadroll` after A2, `fieldres` after A3, `burnchar` after E1, `costs` in §6a, `convert` in §6b, `tilesizes` in §6c, `spreadspeed` in §6d, `score` after §5, `timeline` in §3, `stack` in §7. Total: 38 figures plus the stack (12 in figs1 with hero and timeline; 12 in figs2; 14 in figs3).
