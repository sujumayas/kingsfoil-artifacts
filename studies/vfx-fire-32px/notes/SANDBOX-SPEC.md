# Fire 32 Sandbox spec (shared by the report writer and the sandbox builder)

The sandbox plays the recommended architecture of the report's §7. The report's §8 describes it. Both follow this file.
If research shows a number below is wrong, the lead or the report writer corrects it here under "Corrections" and messages the sandbox builder. Numbers marked (illustrative) are placeholders until research replaces them.

The study has two equal goals: ARTISTIC QUALITY and RUNTIME EFFICIENCY. The scene must look like a game an artist drew at 32 px, and the sandbox must show what every layer costs at 4 times the pixels, live.

The point of the sandbox: the same fire logic as `studies/vfx-fire/sandbox.html` (read it first, it is the engine to port), at the scale of the real game. 32x32 px tiles, characters about 24x32 px. `studies/vfx-snow-32px/sandbox.html` is the newest sandbox and already solved the 640x360 page, the palette-index buffer, the 24x32 characters, the walk cycle, the crowd, the HUD and the bench hook. Read it second and reuse its code and structure wherever it fits.

## Page
- `studies/vfx-fire-32px/sandbox.html`, one hand-written file, no external assets, no external fonts or images.
- Native canvas `<canvas id="c" width="640" height="360">`, scaled with `image-rendering: pixelated`. Whole-number scale where the stage is at least 640 px wide; on narrower screens the canvas shrinks to fit (a 390 px phone shows it below 1x, which is accepted) with no horizontal overflow and no console errors.
- Page chrome, HUD style, control layout, explainer cards, the `fit()` scaling and keyboard handling copied from `studies/vfx-snow-32px/sandbox.html`. Keep `<script src="nav.js" defer></script>` before `</body>`. The page script starts with `"use strict";`.
- Title: "Fire 32 Sandbox". Links back to `vfx-fire-32px-topdown-pixel.html`, to the original `vfx-fire-sandbox.html` ("the same engine at 8 px cells") and to `index.html`.

## World
- A top-down 3/4 village edge at 640x360: a grid of 32x32 px tiles, 20 wide by 11.25 tall (the last row is partial). One tile is one Tibia square.
- Content, all drawn in code with care (this is the art half of the study): a meadow of green grass and dry grass with variation picked by a position hash so no grid shows; a stand of 5 to 7 trees (pines and a broad oak, about 1.5 tiles wide and 2 to 2.5 tiles tall); two wooden houses about 3x3 tiles with pitched roofs (one with a chimney that always smokes) and one stone house that never burns; a stone road 1 tile wide; a pond about 3x2 tiles; a forge or a small lava pool; a campfire; two torches on posts; a brazier; a hay bale or two; a wooden fence.
- Art rules: a limited palette with ramps (warm fire ramp, cool night shadows), 1 px dark outlines on sprites and objects, clusters instead of single stray pixels, no gradients. Every object has a drawn normal look, a drawn burning look (made by rule from the same art) and a drawn burnt look.
- Actors, sprites built in code (reuse the snow-32px character code):
  - the player, 24x32 px, 4 directions, a 4-frame walk with contacts on frames 0 and 2, 400 ms per tile, an idle frame, and a torch toggle: the player carries a lit torch whose flame follows the hand through the walk cycle;
  - a villager on a waypoint loop, same size, different palette;
  - a sheep about 20x14 px that wanders the meadow and can catch fire;
  - a "crowd" slider of 0 to 20 other players who walk tile to tile on random errands, half of them carrying torches (the MMO case: many fires on one screen).
- Movement: free 8-way movement by default (arrows / WASD, or tap to walk when the walk tool is active). A toggle "tile steps" makes every actor walk tile to tile as in Tibia.

## Layers (must match report §7, bottom to top)
1. **Server fire grid (gameplay truth).** One cell per 32 px tile (20 x 12 = 240 cells on screen): material, fuel, moisture, state (none, igniting, burning, embers, ash), heat, and the direction the fire came from (3 bits). Fixed 4 Hz tick, active list, hash RNG `hash(x, y, tick, seed)`, ignition and wind rules ported from VFX #6. Spread rates are stated per tile per second so they can be compared with VFX #6. A control "spread grid" switches between 32 px (default, what the server stores), 16 px (the VFX #6 cell count, 40 x 23) and 8 px (80 x 45), with rates scaled so the front moves at the same speed in px per second.
2. **Network events.** The HUD counts bytes per second for the two encodings (full diff against ignition and extinguish events), labelled illustrative.
3. **Burn front at art resolution.** Each burning tile has a burn progress 0..1 from its state and the time since ignition (client-side, from the hash, no sync). A painted burn-order map (a tileable 128x128 px map built in code to imitate what an artist would paint, clusters of at least 2x2 px, biased toward the side the fire entered from) decides per art pixel whether it is unburnt, in the glowing front band, scorched, charred or ash. The normal tileset and a burnt tileset are blended through that mask. The front band has a 1 px bright ember line and a 2 to 3 px dark scorch band behind it (illustrative). Control "front style": art burn map (default), Bayer 4 (the VFX #6 look), whole tile (the tile flips state at once, the cheapest fallback).
4. **Flames.** Styles (a control): hand-drawn loops sized by the tile (default); DOOM buffers at 1:1 (art resolution, 1 px grain); DOOM buffers at 1:2 drawn as 2x2 px (VFX #6's cost, chunky). Hand-drawn defaults (illustrative until research lands): candle 3x5 px, 3 frames; torch 6x10 px, 4 frames at 10 fps; brazier 14x14 px; campfire about 24x28 px, 6 frames at 10 fps; burning grass tile 2 to 3 flames of 8 to 14 px at hashed offsets; burning tree and burning house flames 16 to 32 px, 8 frames, slower (f = 1.5 / sqrt(D)). 4 to 6 tones with hue shift, base held still, phase from `hash(x, y)`.
5. **Embers and sparks.** A fixed pool of 512 (illustrative), coloured by age through the fire ramp, rising with drag and pushed by wind. Sizes 1 to 2 px (a control: 1 px only, the VFX #6 look; mixed, default).
6. **Smoke and steam.** A byte field with a cell size control: 4 px (160 x 90), 8 px (80 x 45, default, the VFX #6 cell count), 16 px (40 x 23). Advected by wind plus rise, decay, drawn at art resolution through a cluster threshold (2x2 px blocks, default) or a 4x4 Bayer (the VFX #6 look). Grey smoke, white steam, black for oil. Chimney and campfire puffs as drawn sprites sized for 32 px (illustrative: 4 to 12 px, growing as they rise, about 2 tiles of column before they fade).
7. **Combat fire.** Fireball tool (a projectile of about 12 px with a trail, about 8 tiles per second, illustrative), explosion of about 64x64 px in 6 to 8 frames (flash, fireball, smoke, debris), a scorch decal; fire field rune 3x3 tiles and fire wall 1x5 tiles with three Tibia stages (big, medium, small flame sprites per tile, the last harmless); burn status on any actor that touches fire: 2 to 3 flame overlays on the 24x32 sprite at hashed body offsets, a 1-frame flash, damage numbers in a pixel font, stacks that tick and decay, water clears them.
8. **Characters at 24x32.** Torches carried in hand with per-frame offsets; warm rim light on the side of a character that faces a fire within a few tiles (a palette swap of the outline-adjacent pixels, illustrative); soft drop shadow; ash footprints after walking through ash (a cheap decal that fades, illustrative 10 s); everything y-sorted with the objects.
9. **Light, haze and palette.** The world renders to a palette-index buffer (Uint16, as in snow-32px). Day and night retint the palette once per frame. Fires add warm light pools into a light map with a resolution control: per tile (32 px), per 8 px (default), per 4 px, drawn through a dithered threshold band at art resolution with flicker per VFX #5 (10 Hz flicker strings). Optional heat haze over big fires by whole-pixel row offsets.

## Controls
- Tools: walk, ignite (torch), water bucket, fireball, fire field (3x3), fire wall (1x5), oil, regrow. Click or tap on the canvas.
- Weather: rain on / off, wind direction (8 steps) and strength. Time: day, dusk, night, speed 1 to 8x, pause, step one tick. Budget cap on / off. Heat haze on / off. Reset, Seed.
- **Scale (the study's own controls):** spread grid 32 / 16 / 8 px; front style art map / Bayer 4 / whole tile; flame style drawn loops / DOOM 1:1 / DOOM 1:2; smoke cells 4 / 8 / 16 px; smoke draw clusters / Bayer 4; embers 1 px / mixed; light map 32 / 8 / 4 px.
- Crowd slider 0 to 20, torch on / off for the player, tile steps on / off.
- Views (x-ray): normal, fuel, moisture, server state (the tile grid the server stores), burn progress, burn-order map, smoke field, light map, active cells, field grid (shows the cells against the art pixels), cost view.
- A button `button[data-demo="vfx6"]` "VFX #6 settings": sets spread grid 8 px, Bayer 4 front, DOOM 1:2, Bayer smoke, 1 px embers, so the reader sees the old look at the new size. A button `button[data-demo="art32"]` restores the 32 px defaults.
- Keyboard: arrows / WASD move, 1 to 8 pick tools, V cycle views, R rain, Space pause.

## Efficiency HUD (required, this is half the study)
- Per-layer timing in ms, measured with performance.now() around each layer every frame, smoothed: sim tick, burn front render, flames, embers, smoke, combat, characters, light and palette, total. Frame budget bar against 16.7 ms.
- Counters: burning cells, cells per tick, flame buffer cells updated per frame (for the DOOM styles), smoke field cells and bytes, ember pool use, light map cells, bytes a Godot texture upload would move per update (whole-texture uploads on Compatibility), network bytes per second for both encodings.
- The cost view tints each art pixel by how many times it was written this frame.
- Test hook `window.fire32.bench(n)`: n frames back to back without waiting for the display, returns mean ms per layer and the total.

## Thumbnail
`study.yaml` grabs the canvas `#c` after a scripted step and crops a 320x180 window. Provide `button[data-demo="showcase"]`: dusk or night, a wooden house and part of the meadow burning with a front sweeping across the grass, smoke drifting with the wind, embers, the player in the foreground with a torch and warm rim light, a scorched band behind the front. The showcase must read at half size.

## Corrections from the research
(The lead adds research corrections here and relays them to the sandbox builder.)

From note 11 (pixel-art craft), relayed on 13 Nov. Its "Rules for the sandbox" table, starting values for eye tests:
- Layer 4: candle 4x8 px, 4 frames, 100 ms, 3 tones + white core. Torch 10x16, 6 frames, 100 ms, 5 tones. Brazier 16x20, 6 frames, 110 ms. Campfire 24x28 on a 32 px tile, 8 frames, 100 to 120 ms, 5 tones + purple edge. Bonfire 32x48, 8 frames, 130 ms, 6 tones. Burning tree 2 to 3 offset loops over the canopy, 8 frames, 120 ms. Burning house 4 to 6 loops of 24 to 32 px across the roof, 8 frames, 130 ms. Bottom 2 to 3 rows held. Detached tongues 2x2 to 2x3, rising 2 to 3 px per frame. Fire ramps bend hue from purple through red to yellow.
- Layer 5: sparks 1x1 or 1x2, 3 to 8 frames; embers 2x2, 0.5 to 1.5 s, 4 to 8 per campfire.
- Layer 6: puffs start 4 to 8 px, grow to 12 to 16 px, 6 to 10 frames at 70 to 100 ms, 2 tones (3 at 16 px+). Smoke columns up to 3x the fire width tall (Minifantasy 32x96). Dither in 2x2 blocks, 2 px edge band only.
- Layer 7: explosion 64x64, 10 to 12 frames at 70 to 80 ms.
- Layer 3: burn edge band 2 px (1 glow, 1 dark red). 4 burnt states per material.
- Layer 8: rim light 1 px, 1 warm tone; 2 px next to a bonfire.

From note 14 (combat fire and lava), relayed on 13 Nov:
- Layer 7: effect frames 75 ms, removed after 75 x phases ms (OTClient `EFFECT_TICKS_PER_FRAME`). Missile flight `150 x sqrt(d)` ms, d Euclidean in tiles, 8 direction sprites (replaces "8 tiles per second"). Areas are built from 1-tile 32x32 effects: great fireball 37 tiles on a radius-3 disc, explosion rune 5 tiles on a plus, fire bomb 3x3, fire wall 1x5. Sprite variant per tile by `x % px, y % py`. The 3x3 blast: centre first, ring 75 ms later. A repeat of the same effect on a tile is refused while the first is younger than 75 x max(phases/3, 1) ms (Mehah). Scorch decal 32x32, 2 to 3 variants, fades in 3 to 5 s. Shake 2 to 6 px whole pixels, local player only.
- Layer 9: lava light radius 4 (TibiaWiki).

From note 13 (characters and fire), relayed on 13 Nov. Tibia draws no burning overlay and no carried torch; these are the note's recommendations:
- Layer 7, burning status: warm palette-row tint; 2 flames of 8x10 px, 4 frames at 100 ms, at shoulder and hip, 2 frames apart, a 6x8 head flame on even ticks; 2x2 embers at 6 to 8 per second; a 4x4 puff every 0.5 s rising 0.5 px per frame for 1 s; a 50 ms white flash and an orange number per tick. Damage numbers after OTClient: 11 px font, rise 48 px in 1000 ms, fade from 833 ms, merge within 400 ms.
- Layer 8, torch: stick 2x8, hand flame about 6x8 (post torches stay 10x16). Hand offsets frame 0..3: (+1,0), (0,-1), (-1,0), (0,-1) facing south. Torch after the body facing south and east, before it facing north and west. Top 2 flame rows lean 1 px back while moving.
- Layer 8, rim light: alpha-edge test toward the nearest fire within 4 tiles, 1 px rim + 1 px inner tone, both within 1.5 tiles, rim only to 3, none behind the fire. Fire shadow: one rotated ellipse 16x6 to 16x10, away from the nearest fire.
- Layer 8, soot prints: 3x5 px, 2 per tile, for 3 tiles after ash, fade 10 s.

From note 10 (games at 32 px; Tibia appearances.dat decoded from Canary), relayed on 13 Nov:
- Layers 4 and 7: Tibia fire field stages are 5 x 120, 5 x 100, 5 x 100 ms, flame boxes 49x47, 49x54, 38x40 px in a 64x64 canvas anchored bottom-right (about 1.5 tiles, spilling up and left), light 7 / 5 / 3, 16 variants by `x % 4, y % 4`, unsynchronised. Stage times 200 / 148 / 98 s in Canary. Flames may overflow their tile, y-sorted.
- Layer 4: dying fire = smaller sprite + slower frames + less light (campfire 5 x 100 ms light 7, 4 x 100 light 5, 6 x 300 light 3). Campfire sprite 32x32. Ashes a still 24x24 sprite. Tibia wall torch 2 x 500 ms, box 29x30, synchronised.
- Layer 4: Stardew campfire = three copies of one 12x11 4 x 100 ms loop with three seeds; floor torch 8x8, 7 x 100 ms.
- Layer 7: HITBYFIRE 9 x 100 ms, 42x40 px, per damage tick.

From notes 12 (buffers, fields, Godot) and 15 (spread and smoke), relayed on 13 Nov:
- Layer 1: spread rolls once per second per tile at 32 px with VFX #6's material table unchanged (note 15 "Option A"); the 4 Hz tick stays for water, rain, extinguish and events; roll phase `hash(x, y) & 3`. The spread-grid control sets the roll rate: 32 px 1 Hz, 16 px 2 Hz, 8 px 4 Hz. Speeds 0.52 to 1.0 tiles/s, cap 1 tile/s (walking is 2.5). Burn times 2 to 20 s; trees 20 to 30 rolls, wood walls 20 to 40 suggested.
- Layer 1 and 3: tile states fresh, catching (1 roll), burning (2 to 3 flames), dying (client, last 25%), embers 4 to 10 s (2 to 4 glowing 2x2+ clusters), ash 60 to 120 s (2 variants), regrowing (2 to 3 steps). A tree is one fuel cell at the trunk; canopy flames climb over the first third. A 3x3 house takes outside ignition only on its 8 edge tiles and is drawn in stages by burnt fraction: eaves smoke, 25% roof flames, 60% roof collapse (client-side burst 300 to 500 ms), 100% charred stumps, then rubble.
- Layer 3: `d = b - T(px)` with rim, scorch band and charred zones; 1 px = 1/32 of a tile ramp. Entry direction `T = (1 - a) * clamp(dot(u, -e) / s + 0.5, 0, 1) + a * N(px)`, a 0.3 to 0.5. Continuous front from a bilinear sample of per-tile ignition times, with a predicted time for unlit tiles (untested construction from note 12).
- Layer 4: the in-place DOOM loop reaches a median 95 rows at L 36 (72 is double-buffered); H50 ≈ 2.6 L (in place, p 0.5) or L / p (double-buffered). Smooth (3x3 or Lode) before quantizing to 5 tones with unequal bands; no Bayer between bands. Seed big fires from the burning sprite mask. One atlas for all patches.
- Layer 6: 8 px cells default; a burning tile emits into its top 2x2 cells; hero puffs from objects only, about 64 alive; puff sizes per source in note 15 Q6 (chimney 8 to 10 growing to 32 to 47 px, 15 px/s, 2 to 3 tiles; house 12 to 16 growing to 48 to 64, 4 to 6 tiles; steam 8 to 12 white puffs in 0.3 s).
- Layer 1 (lead's fix, 13 Nov, after the writer's check): the roll phase is the ignition tick, not `hash(x, y) & 3`. A burning tile rolls when `(tick - t_ignite) % period == 0 && tick > t_ignite`, period 4 / 2 / 1 ticks for 32 / 16 / 8 px. With the hash phase a new tile's first roll came 0.25 to 1 s after it caught and fronts ran faster than note 15 measured.
- Layer 9: 8 px light map; dither band δ ≈ 0.026 of the light range for a 2 to 3 px band on a 3-tile pool.

## As built (the final sandbox, 13 Nov, after one polish pass). Where this section and the text above disagree, this section is right.
From the builder's two reports, checked against its code by the builder. The report's §8 and every figure that mirrors the sandbox follow these numbers.

1. **Server grid.** 20x12 / 40x23 / 80x45 cells at 32 / 16 / 8 px. Tick 4 Hz. Burning cells roll at 1 / 2 / 4 Hz, phased by the ignition tick: the first roll comes one roll period after ignition, and "catching" is visual only (a caught tile that waited a roll before spreading halved the front speed). A cell burns a fixed number of ROLLS at every grid size; the table values are seconds for a 32 px tile, so a 16 px cell burns half as long in seconds and an 8 px cell a quarter. With burn time fixed in seconds instead, a 32 px tile got 3 rolls against 12 at 8 px and 32 px fronts died in 4 of 12 runs. Chance per roll: green grass .15, dry grass .40, tree .22, wood .30, fence .30, hay .50, oil 1.0. Burn: green grass 5 rolls (VFX #6 had 3; 3 rolls let fronts die), dry grass 2, hay 4, oil 6, fence 12, tree 24, wood 30. Embers 4 to 10 s, ash regrows in two steps after 60 to 120 s. Wind: Alexandridis `exp(V * (c1 + c2 * (cos θ - 1)))`, V 0 to 10 m/s on the slider, c1 0.045, c2 0.131; it multiplies the straight-ahead roll by 1.25 at 5 m/s and the diagonals by about 1.03. Budget cap 4 tiles of ignitions per tick.
   Measured front, 12 runs each, no wind, tiles/s at 32 / 16 / 8 px: green grass 0.47 / 0.52 / 0.51, dry grass 0.91 / 0.90 / 0.91. At 5 m/s: green grass 0.53 downwind (+13%), upwind the front dies in 10 of 12 runs; dry grass 0.97 downwind, 0.16 to 0.55 upwind.
2. **Network.** Full set 4 + 2 B per burning cell per tick; events 4 + 3 B per event; B/s in the HUD, labelled illustrative.
3. **Burn front.** Default is the continuous front: each 2x2 px block samples the cells' ignition times bilinearly with an 8 px warp; a cell that has not caught counts as now + 6 s. Jitter from a 128 px map grown from 96 seeds, up to 0.9 s. A 2 px edge (glow and dark red), then a 0.35 s scorch zone, then char; a cell's clock freezes when its fuel runs out; ash comes from a second smooth field. Front styles: continuous (default), per tile (shows the seam), Bayer 4, whole tile. Redraw rates: burning cells 30 Hz, embers 15 Hz, burning objects 20 Hz, into a cached base. Ash: three tones in 2x2 blocks, charcoal bits on about 1.6% of blocks, light flecks on 0.7%. A second object layer restores pixels hidden behind an object that burns away.
4. **Flames** (W x H px, frames x ms, tones): candle 4x8, 4 x 100, 3; post torch 10x16, 6 x 100, 5; hand torch 6x8, 4 x 100, 4 (held 4 px forward in side view, stick tilted 6 px); grass small 8x10, 4 x 100, 4; grass large 12x16, 6 x 100, 5; brazier 16x20, 6 x 110, 5; campfire 24x28, 8 x 110, 6 with a purple edge; tree 22x28, 8 x 120, 6; house 28x32, 8 x 130, 6; field stage 1 46x46, 5 x 120, 6; stage 2 44x50, 5 x 100, 6; stage 3 34x36, 5 x 100, 5; burning status 8x10 and 6x8, 4 x 100, 4. Every loop holds its bottom 3 rows; 2x2 or 2x3 tongues rise 3 px per frame. A burning tile shows up to 3 flames; in its last 25% it keeps 1 small flame looping 1.4x slower. DOOM: Sanglard's in-place loop at 640x360 (1:1) or 320x180 (1:2), inside a bounding box, 3x3 average before the 5-tone cut, seed level rows / 1.9 + 2 (the 0.24 cut shortens the visible flame). No bonfire in the world.
5. **Embers.** Pool 512. Embers 2x2 px, 0.5 to 1.5 s; sparks 1x1 or 1x2, 3 to 8 frames. "1 px" mode is the VFX #6 look.
6. **Smoke.** Byte fields 160x90 / 80x45 / 40x23 advected at 30 Hz; rise 26 px/s; wind 4 px/s per strength step; 50% kept per second (steam 16%). Drawn through 2x2 clusters (its own soft-blob map, since the burn-order map left lone 2x2 dots) or Bayer 4. Ground smoke 170 per tile per second, threshold 44. A burning house feeds a column of 420 per second over an 18 px radius plus dark puffs; a burning tree 200 per second. Object puffs, at most 64 alive: campfire 4 to 6 growing to 16 to 20 px every 0.5 s; chimney 8 to 10 to 32 to 47 px every 0.6 s; tree 10 to 12 to 32 to 40 px; house 12 to 16 to 48 to 64 px; puffs fade from 60% of their life. Smoke keeps half its brightness at night and counts 1.8x in the light pass.
7. **Combat.** Missile flight 150 x sqrt(d) ms, one 16x16 sprite per 8 directions. Area effect 14 frames (40 ms, then 13 x 60 ms) in a 56 px canvas, on a 3x3 area or the 37-tile disc, rings 75 ms apart, repeats refused under 350 ms. No 64x64 explosion. Scorch decals fade over 4.5 s. Field stages 20 / 14.8 / 9.8 s (Canary's times divided by 10), the last harmless. Damage 20 on entering a field, 10 per second while burning. Shake 2 / 5 px, capped at 6.
8. **Characters.** Rim light within 3 tiles, a second tone within 1.5 tiles. Fire shadow: one ellipse 16 px wide, 6 to 10 px tall, pushed away from the nearest fire, one shade darker, no pixel darkened twice. Soot prints 3x5 px, 2 per tile, for 3 tiles, fading over 10 s. Damage digits 11 px, rising 48 px in 1 s. A west-facing character draws the hand torch in front of the body (the held hand is the near arm in side view); only north-facing draws it behind.
9. **Light and palette.** 97 colours x 4 versions. Light maps 20x12 / 80x45 / 160x90, bands at 0.3 and 0.62, dither 0.026, flat runs, tier-0 blocks skipped; apply cost follows the lit pixel count (0.47 ms with 160,123 lit px in the showcase; 0.24 ms day and 0.29 ms night at idle with 57,141). Map build 0.003 / 0.03 / 0.12 ms at 32 / 8 / 4 px. Lava cycles every 300 ms, pond glints every 450 ms.

Controls as built: the spec's controls plus a 3x3 / 37-tile fireball option and four front styles. Demos `showcase`, `vfx6`, `art32`. Thumbnail crop [96, 120, 416, 300]. Hooks `fire32.bench(n)`, `frontTest`, `set`, `demo`, `stats`.

Bench (builder's machine, Apple M4 Pro, headless Chromium, showcase scene, median of 5 runs x 60 frames, ms per frame, after the polish pass):
| Case | Front | Flames | Embers | Smoke | Chars | Light | Total |
|---|---|---|---|---|---|---|---|
| Default (night) | .73 | .05 | .02 | .33 | .02 | .64 | 1.76 |
| Default, day | .73 | .04 | .01 | .32 | .01 | .62 | 1.75 |
| VFX #6 settings | .51 | .30 | .03 | .27 | .01 | .69 | 1.82 |
| Grid 16 | .79 | .05 | .01 | .31 | .01 | .60 | 1.78 |
| Grid 8 | 1.07 | .04 | .02 | .30 | .01 | .60 | 2.05 |
| Smoke 4 | .73 | .05 | .01 | .50 | .01 | .61 | 1.94 |
| Smoke 16 | .74 | .05 | .01 | .40 | .01 | .62 | 1.83 |
| Light 32 | .75 | .05 | .01 | .32 | .02 | .63 | 1.75 |
| Light 4 | .73 | .05 | .01 | .33 | .01 | .72 | 1.85 |
The light column includes the palette pass (0.08), putImageData (0.03), map build (0.03) and haze (0.03). Front styles: per tile .53, Bayer .43, whole tile .32. DOOM 1:1 flames .80 ms (total 2.56); DOOM 1:2 .26 (total 1.95). Crowd 20 adds .12 for characters (total 2.02). Idle total 0.46 ms day, 0.59 night. Under a 6x CPU throttle (first pass, before polish): default 12.6, VFX #6 11.8, grid 8 15.2, DOOM 1:1 16.9 ms.

Known weak spots: an unburnt tile next to a long-burning tile (tree, house) can still show straight edges; ground smoke over a large burnt area forms some grey patches; lava sometimes ignites grass beside it.
