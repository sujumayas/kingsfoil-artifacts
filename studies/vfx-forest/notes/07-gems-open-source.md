# 07 — GEM FINDINGS: field-validated open-source code, shaders, games and assets for FORESTS

Researcher angle: code/tools a Godot 4 (Compatibility/WebGL2) or web pixel-art dev can use or study.
Method: licences verified by reading the LICENSE file or the licence line on the page, cloned/raw-fetched
on 2026-11-09. Algorithm summaries come from the actual source unless marked *inference*.
Note: GitHub REST API was blocked in this session (no stars counts); maturity evidence uses npm downloads,
last-commit dates (from `git log` of shallow clones), version numbers and Asset Library versions instead.

---

## MASTER TABLE

| Name | URL | Licence (verified) | Maturity evidence | What it's good for |
|---|---|---|---|---|
| poisson-disk-sampling (kchapelier) | https://github.com/kchapelier/poisson-disk-sampling · npm https://www.npmjs.com/package/poisson-disk-sampling | MIT (npm metadata + raw LICENSE 200) | npm since 2015-11-28; v2.3.1 (2022-06-05); ~14,000 downloads/week | Web: tree scatter with **variable density** (`distanceFunction` returns 0..1 from noise/image; `minDistance`/`maxDistance`, `bias`) → dense forest core, sparse edges |
| fast-2d-poisson-disk-sampling (kchapelier) | https://github.com/kchapelier/fast-2d-poisson-disk-sampling | MIT (LICENSE file, ©2020) | v1.0.3 (2022-05-28); ~1,000 dl/wk; own benchmark file | Web: fastest uniform 2D scatter. 800×800, r=8, 30 tries: 23.7 ms for ~8,400 points (BENCHMARK.md) |
| d3-delaunay | https://github.com/d3/d3-delaunay | ISC | v6.0.6 (2026-11-03); ~44.7 M dl/wk | Voronoi cells for forest-patch or biome regions, nearest-tree lookups |
| simplex-noise (jwagner) | https://github.com/jwagner/simplex-noise.js | MIT | v4.0.3 (2024-07); ~624k dl/wk | Noise for density maps and temperature/humidity fields (Godot has FastNoiseLite built in) |
| Poisson Disc Sampling (udit), Godot addon | https://github.com/udit/poisson-disc-sampling · https://godotengine.org/asset-library/asset/559 | MIT (LICENSE ©2020 Udit Parmar) | Asset Library v2.1, Godot 4.2, submitted 2023-12-21; last commit 2023-12-20 | GDScript static funcs: points in rect, **polygon** or circle (forest-shaped region) |
| Godot-Poisson-Disk-Sampler (Decapitated) | https://github.com/Decapitated/Godot-Poisson-Disk-Sampler · https://www.godotengine.org/asset-library/asset/edit/9786 | MIT (LICENSE ©2023) | Asset Library, Godot 4.2 | `PoissonSampler2D` node that generates in the editor and saves into the scene (bake scatter, no runtime cost) |
| Boids (Ben Eater) | https://github.com/beneater/boids · live https://eater.net/boids | MIT (stated in README; **no LICENSE file**) | 2020; featured in Smarter Every Day video (README) | Reference-quality 200-line JS boids with tuned constants (see below) |
| godot_boids (90-008 / yusdacra) | https://github.com/90-008/godot_boids · https://godotengine.org/asset-library/asset/edit/19618 | MIT (LICENSE.txt ©2024 yusdacra) | Asset Lib v0.1.2, Godot 4.3; last commit 2024-12-06; Rust GDExtension; **web (wasm) supported** | Fast 2D/3D flocks: "about 2000 boids in a single flock at 11ms" (Ryzen 5600, no partitioning) — README |
| godot-boids (viniciusgerevini) | https://github.com/viniciusgerevini/godot-boids | MIT (©2021) | Last commit 2021-03-31; **Godot 3.x** project (config_version=4) | Readable GDScript boid using Area2D detection radius; port to Godot 4 needed |
| lindenmayer (nylki) | https://github.com/nylki/lindenmayer | MIT (©2015-16 Tom Brewe) | npm since 2016, v1.5.4; ~99 dl/wk; last commit 2024-07; interactive builder demo | Offline L-system tree generation (classic ABOP syntax incl. `[]`, context-sensitive `<>`); render to pixel buffer, hand-clean |
| proctree.js (Paul Brunt / supereggbert) | https://github.com/supereggbert/proctree.js | **BSD-3-Clause** (header in proctree.js, ©2012) — not MIT | Last commit 2017-12-28; npm fork `proctree` ~20 dl/wk | 3D mesh tree generator — only useful to pre-render tree sprites; low value for pixel art |
| 2D Pixel perfect wind & sway effect (kaeylos) | https://godotshaders.com/shader/2d-pixel-perfect-wind-sway-effect/ | CC0 (page licence line) | Posted 2025-06-25 (page datetime) | Best fit for pixel art: snaps UV to texel grid (`floor(uv*size)/size`) so sway never produces sub-pixel smear |
| 2D Wind Sway / Tree & Grass Motion (purga) | https://godotshaders.com/shader/2d-wind-sway-tree-grass-motion-shader/ | CC0 | Posted 2026-02-28 | Height-weighted sine bend, enlarges quad to avoid clipping |
| 2D Foliage Wind Effect (jess-codes) | https://godotshaders.com/shader/2d-foliage-wind-effect/ | CC0 | Posted 2025-06-10 | **World-position noise** → neighbouring trees sway coherently (wind "gusts" travelling) |
| 2D wind sway (godotshaders, from Maujoe) | https://godotshaders.com/shader/2d-wind-sway/ | Page says CC0, **but derived from Maujoe's MIT shader** (comment on page flags this) | Posted 2021-01-20, Godot 3 era | Historical reference; treat as MIT |
| Dithering / Screen Door Transparency | https://godotshaders.com/?p=7263 | CC0 | Posted 2024-05-27 | canvas_item **4×4 Bayer** dither fade; has commented-out `global uniform vec2 player_position` + radius → see-through circle around player |
| Transparency Dither (IGN) | https://godotshaders.com/shader/transparency-dither/ | CC0 | 2025-01-22 | Spatial (3D) only; IGN constants reusable in canvas_item |
| Efficient 3-line palette shader | https://godotshaders.com/shader/efficient-3-line-palette-shader-full-alpha-support/ | CC0 | 2024-10-14 | Indexed-colour sprites: red channel = palette index → `texture(palette, vec2(COLOR.r+.05,.5))`. One palette row per season |
| Palette Swap (no recolor / recolor) | https://godotshaders.com/shader/palette-swap-no-recolor-recolor/ | CC0 | 2021-03-14, **Godot 3 syntax** (`hint_color`) | 5-colour compare-and-replace; simple but O(n) per pixel |
| Palette Swap using two textures | https://godotshaders.com/shader/palette-swap-using-two-textures/ | CC0 | 2022-05-12, **Godot 3** (`SCREEN_TEXTURE`) | palette_in/palette_out strip lookup; port needed |
| Godot demo projects | https://github.com/godotengine/godot-demo-projects | MIT-style (LICENSE.md, Godot Engine contributors) | Official | 2D isometric / y-sort / TileMap demos for occlusion/sorting baselines |
| Luanti (Minetest) + Minetest Game | https://github.com/luanti-org/minetest_game | Code **LGPL-2.1**; media **CC BY-SA 3.0** | 15+ years, official game | Biome = (heat, humidity) Voronoi points; noise-driven tree decoration density; leafdecay; sapling growth |
| Veloren | https://gitlab.com/veloren/veloren | **GPL-3.0** | Long-running, active Rust voxel RPG | Per-species temp/humidity ranges × "proclivity" weight; per-tree seeded leaf-colour lerp |
| Cataclysm: DDA | https://github.com/CleverRaven/Cataclysm-DDA | **CC BY-SA 3.0** (code + data!) | Very active, huge JSON data set | `harvest_by_season` per tree; harvested tree `looks_like` dead tree and transforms back |
| OpenTTD | https://github.com/OpenTTD/OpenTTD | **GPL-2.0** | 20+ years | 7 growth stages (3 growing, grown, 2 dying, dead), up to 4 trees/tile, spread to neighbours, snowline ground density 0–3, tile-loop hashing |
| Shattered Pixel Dungeon | https://github.com/00-Evan/shattered-pixel-dungeon | **GPL-3.0** | Huge mobile hit, active | High grass → trampled on step, 4-leaf particle burst, blocks vision; furrowed grass state |
| Brogue CE | https://github.com/tmewett/BrogueCE | **AGPL-3.0** | Active community edition | Dense foliage obstructs vision, promotes to trampled on step, regrows 1%/turn |
| Flare (engine + Empyrean Campaign) | https://github.com/flareteam/flare-game | Engine **GPL-3+**; art/data **CC BY-SA 3.0** | Since 2010 | Isometric action-RPG forest tiles/props to study |
| Battle for Wesnoth | https://github.com/wesnoth/wesnoth | Code **GPL-2+**; art mostly **GPL-2+**, new art **CC BY-SA 4.0** | 20+ years | Forest as overlay on base terrain (seasonal variants exist — not verified here) |
| Kenney Tiny Town | https://kenney.nl/assets/tiny-town | **CC0** | 16×16 tiles, 130 files, 2023, v1.1 | Prototype top-down trees (tiny, readable) |
| Kenney Roguelike/RPG pack | https://kenney.nl/assets/roguelike-rpg-pack | **CC0** | 16×16, 1700 files, 2015 | Prototype tree/forest tiles; CC0 per https://kenney.nl/support |
| [LPC] Trees (bluecarrot16) | https://opengameart.org/content/lpc-trees | **CC BY-SA 3.0** (page) — check per-file credits | 2017-12-27; curated multi-author collection | LPC-style 3/4 deciduous trees at 32px grid |
| LPC Seasoned Trees (jig_r) | https://opengameart.org/content/lpc-seasoned-trees | **CC BY-SA 3.0 / GPL-3.0** | 2017-09-06 | Seasonal recolours of a conifer (winter/autumn) — a worked example of palette seasons |
| [LPC] Tree Recolors | https://opengameart.org/content/lpc-tree-recolors | CC BY 3.0 / CC BY 4.0 / GPL-3.0 options | 2013-08-18 | Green/brown/autumn/yellow recolours of C. Nilsson trees |
| Pine Tree Tiles (Wyrmsun, b_o) | https://opengameart.org/content/pine-tree-tiles | **CC BY-SA 3.0 / GPL-2.0** | 2015-04-29 | Tile-based pine canopy |
| Lospec Palette List (e.g. Endesga 32) | https://lospec.com/palette-list/endesga-32 | Palette list (no licence on page; colour lists are generally treated as free — *inference*) | Endesga 32: 32 colours, ~207k downloads, ~2.3k likes | Season palettes; drive palette-swap rows |

### Licence risk flags
- **GPL/AGPL (study only, do not copy code into a closed game):** OpenTTD (GPL-2), Veloren (GPL-3), SPD (GPL-3), Brogue CE (**AGPL-3**, also covers network play — relevant for an MMORPG server), Flare engine (GPL-3), Wesnoth (GPL-2+). Re-implementing an *algorithm* from reading is generally fine; copying code/data is not (*inference, not legal advice*).
- **Share-alike art:** LPC sets, Flare art, Wesnoth new art, Minetest Game media, Pine Tree Tiles — CC BY-SA requires derivative art be released under the same licence + attribution; GPL-only art options are risky for proprietary builds.
- **CDDA is CC BY-SA 3.0 for the whole project (code too)** — unusual; JSON data copying = share-alike.
- **Minetest Game code LGPL-2.1** — friendlier, but still copyleft for modified files.
- **Ben Eater boids:** MIT is stated only in README, no LICENSE file → low risk but keep the README notice.
- **proctree.js is BSD-3, not MIT** (the brief guessed MIT).
- **godotshaders "2D wind sway"**: page says CC0 but it is a derivative of an MIT shader → keep MIT notice.
- **godotshaders in general:** licence is per-shader (CC0 on all pages checked); "Images and videos ... do not fall under this license".

---

## Q1. Scatter: Poisson disk sampling

**Takeaway:** For web, `poisson-disk-sampling` (MIT) is the gem because `distanceFunction` gives density-varying forests in one call; for Godot, bake with `PoissonSampler2D` (MIT) in the editor or call udit's static GDScript functions at chunk generation.

**Cited findings**
- poisson-disk-sampling: "Allow the use of custom function to drive the density of the distribution"; `distanceFunction` must return 0..1; `maxDistance` defaults to `minDistance*2`; `bias` picks which constraint wins (README, https://github.com/kchapelier/poisson-disk-sampling). Two internal implementations, chosen by whether a distanceFunction is passed.
- fast-2d variant (src/fast-poisson-disk-sampling.js): Bridson-style grid with `cellSize = radius * SQRT1_2`; default `tries` 30 (min 3); samples at a **fixed distance r** on a rotating angle (`angleIncrement = 2π/tries`; after a success it jumps by π/3) instead of random annulus — the reason it is ~2× faster than the general lib at equal density. Benchmark: 800×800 r=8 tries 15 → 13.0 ms/~8,079 pts; tries 30 → 23.7 ms/~8,407; general lib at equal density 39.9 ms (BENCHMARK.md).
- udit Godot addon (poisson_disc_sampling.gd): `cell_size = poisson_radius / sqrt(2)`, grid of cols×rows, `retries` per active point, shape test for CIRCLE/POLYGON/rect (`_is_point_in_sample_region`).

**Inferences**
- A 64×64-tile chunk at 16 px tiles with tree radius ~24 px = 1024×1024 px → roughly 1.5k candidate points (scaled from benchmark density), a few ms in JS; cheap enough per chunk, or bake.
- Forest edges: drive `distanceFunction` with (1 − forest_mask) so spacing grows toward clearings.

**Gaps:** no published benchmark for the GDScript addons; Godot GDScript is likely 10–50× slower than JS JIT (*inference*), so bake or run in a thread.

## Q2. Birds: boids

**Takeaway:** Ben Eater's tuned constants are the best starting values; for Godot web, `godot_boids` (Rust GDExtension, wasm supported) handles thousands, but a flock of 10–40 birds is trivially fine in GDScript.

**Cited findings (beneater/boids/boids.js)**
- `numBoids = 100`, `visualRange = 75`; cohesion `centeringFactor = 0.005`; separation `minDistance = 20`, `avoidFactor = 0.05`; alignment `matchingFactor = 0.05`; `speedLimit = 15`; soft bounds `margin = 200`, `turnFactor = 1` (velocity nudged, not clamped). O(n²) neighbour loops.
- godot_boids README: ~2000 boids at 11 ms physics tick, no spatial partitioning yet; targets Godot 4.3; Linux/Windows/web(wasm).
- viniciusgerevini: GDScript `_flock_direction()` sums separation/heading/cohesion from flockmates tracked via Area2D `body_entered/exited` (Godot 3.x).

**Inferences**
- "Birds take off when player approaches": add a 4th rule — flee vector from player inside radius R, and a perched→flying state switch; perched birds don't run boids at all (zero cost).
- Draw shadow as a separate offset dark ellipse sprite (cheap).

**Gaps:** Craig Reynolds' original page (red3d.com/cwr/boids) not fetched this session.

## Q3. Procedural trees (L-systems, generators)

**Takeaway:** For pixel art, procedural generators are best used **offline** to produce silhouettes/branch skeletons that an artist cleans; runtime procedural *composition* (trunk + canopy + palette) is more valuable than L-systems.

**Cited findings**
- lindenmayer (MIT): supports ABOP-style branches `[]` and context-sensitive productions `<>`; productions can be JS functions; "Basic Tree" example and interactive 2D builder (README).
- proctree.js: BSD-3 (©2012 Paul Brunt); 3D mesh generator.
- Veloren (GPL-3) leaf colour: each tree picks one colour range by `RandomPerm(seed)` from a per-block list, then `Rgb::lerp(start, end, lerp)` (world/src/all.rs `leaf_color`) → per-tree tint variety from one sprite.

**Gaps:** space-colonization demos (e.g. Jason Webb) and open-source pixel-tree generators on itch not verified this session — licence unknown.

## Q4. Godot shaders (wind, see-through, dither, palette)

**Takeaway:** Combine (a) pixel-snapped wind sway with world-position noise, (b) Bayer 4×4 screen-door dither driven by a global `player_position` for canopy see-through, (c) indexed-colour palette lookup with one row per season. All CC0.

**Cited findings**
- Pixel-perfect sway (kaeylos, CC0): `pixelated_local_uv = floor(local_uv * region_size_px) / region_size_px`; wind = value noise of (uv·`wind_scale` + TIME·`wind_speed`), masked by `step(uv.y, 1-wind_height_start)` and divided by region width in px; sway = `max(0, 1-uv.y-sway_height_start)*sin(TIME*sway_speed)`; result clamped to `REGION_RECT` (atlas-safe). Defaults: wind_strength 1, wind_scale 10, wind_speed 0.1, sway_strength 0.5, sway_speed 0.5.
- Foliage wind (jess-codes, CC0): samples a noise texture at `world_position * noise_scale + TIME*time_scale` (defaults 0.001, 0.04), rotates UV around pivot (0.5, 1) by `amplitude*(noise-0.5)` (amplitude 0.2), blended by distance to pivot → coherent gusts across many trees.
- Purga sway (CC0): `wind_uv.x += sin(TIME*speed + wind_start) * smoothstep(...) * pow(2-uv.y, curve_scale) * strength`; enlarges VERTEX by `1 + 2^curve_scale*strength*2` and `discard`s outside → no edge clipping. `wind_start` acts as per-instance phase.
- Screen-door dither (CC0): `THRESHOLD_MATRIX` = Bayer 4×4 /17; `COLOR.a *= step(0, M[x%4][y%4] - intensity)`; commented code computes player distance in SCREEN_UV with `radius` 0.05 and `player_influence` 0.6.
- Godot forum (2025-05-19): for TileMapLayer trees, use `_use_tile_data_runtime_update()` / `_tile_data_runtime_update()` to change one tile's `modulate` alpha — only clean if tree is one tile (https://forum.godotengine.org/t/make-a-wall-tree-a-little-bit-translucent-trasnparent-when-there-is-a-player-behind-it-in-2d-top-down-especially/111322).
- 3-line palette (CC0): `COLOR = texture(palette, vec2(COLOR.r + .05, .5))` keeping alpha.

**Inferences**
- Season swap = make palette texture N rows (spring/summer/autumn/winter), sample `vec2(index, season_row)`; staggered per-species timing = per-instance `season_t` offset (instance uniform or modulate channel). Zero extra textures per tree.
- Only apply see-through when player's y < tree base y (behind) — compare in GDScript and set an instance uniform, avoiding per-pixel sorting logic.

**Gaps:** confirm which Godot 4.x version exposes `REGION_RECT` in canvas_item shaders and whether `global uniform` / `instance uniform` work in the Compatibility renderer for CanvasItems — must test before relying on them for web.

## Q5. Open-source games to study (algorithms from code)

**Luanti / Minetest Game (code LGPL-2.1, media CC BY-SA 3.0)**
- Biome heat/humidity points (mods/default/mapgen.lua): icesheet 0/73, tundra 0/40, taiga 25/70, snowy_grassland 20/35, grassland 50/35, coniferous_forest 45/70, deciduous_forest 60/68, cold_desert 40/0, sandstone_desert 60/0, savanna 89/42, rainforest 86/65, desert 92/16. Biome = nearest point in (heat, humidity) space (Voronoi).
- Tree placement: schematic decorations with Perlin `noise_params`, e.g. deciduous apple tree offset 0.024, scale 0.015, spread 250, octaves 3, persist 0.66; fallen apple log offset 0.0012; rainforest uses fixed `fill_ratio = 0.1` for jungle trees and 0.005 for logs → **clumped forests come from noise-modulated density, not uniform random**.
- Leafdecay (functions.lua): when a trunk is removed, leaves within `radius` (2 or 3 per species in nodes.lua) get a timer `math.random(20,120)/10` s (2–12 s); on timer, if no trunk within radius → drop & remove. Staggered falling = free "alive" effect.
- Saplings: `can_grow` requires light ≥ 13; node timer `math.random(300,1500)` s (trees.lua).

**Veloren (GPL-3)** — world/src/all.rs: each `ForestKind` has `humid_range`, `temp_range`, optional `near_water_range` and `ideal_proclivity` (Oak 1.0, Pine 1.0, Birch 0.65, Redwood 2.5, Cherry 12.0, Dead 0.01…); `proclivity = ideal * close(humid) * close(temp) * close(near_water)` → weighted species choice per location. `shrub_density_factor` per species (Birch 0.65, Mangrove 1.0, Palm 0.2) → undergrowth tied to species.

**OpenTTD (GPL-2)** — src/tree_map.h, tree_cmd.cpp:
- Stages: Growing1/2/3 (0–2), Grown 3, Dying1/2 (4–5), Dead 6; up to 4 trees per tile (count in m5 bits); tree type ranges per climate (temperate 0x00, sub-arctic 0x0C, rainforest 0x14, cactus 0x1B, sub-tropical 0x1C, toyland 0x20).
- Tile loop: `cycle = 11*x + 9*y + (tick>>8)` (co-prime hash spreads updates); trees update every 16th tile update. When Grown: random 0..7 → 0 start dying, 1 add tree on tile (<4), 2 plant neighbour; Dead → remove one tree or revert tile to grass/snow.
- Snow: `k = tileZ − snowline + 1`; ground density `min(k,3)`; ambient snow/rainforest sounds at 1/200 chance per loop.
- Only the last tree on a tile shows the growth sprite (`i == trees-1 ? growth : Grown`).

**Cataclysm: DDA (CC BY-SA 3.0)** — data/json/furniture_and_terrain/terrain-flora.json: `t_tree_apple` `harvest_by_season` autumn only; pine/birch/willow all seasons; harvesting transforms to `t_tree_apple_harvested` which `looks_like: t_tree_dead` and `transforms_into: t_tree_apple` (regrows).

**Shattered Pixel Dungeon (GPL-3)** — levels/features/HighGrass.java `trample()`: HIGH_GRASS → GRASS on step (Huntress → FURROWED_GRASS, which still lets her hide); `CellEmitter.get(pos).burst(LeafParticle.LEVEL_SPECIFIC, 4)` → **4 leaf particles**; recomputes FOV (`Dungeon.observe()`); seed drop chance `1/(25 − naturalism*4)`, dew `1/(6 − naturalism/2)`.

**Brogue CE (AGPL-3)** — src/brogue/Globals.c: FOLIAGE flags `T_OBSTRUCTS_VISION`, `TM_PROMOTES_ON_STEP` → DF_TRAMPLED_FOLIAGE; TRAMPLED_FOLIAGE promoteChance 100 → DF_FOLIAGE_REGROW. Time.c rolls `rand_range(0,10000) < promoteChance` → **1% per turn ≈ 100-turn mean regrowth**.

**Flare (GPL-3 engine / CC BY-SA 3.0 art), Wesnoth (GPL-2+, art GPL-2+/CC BY-SA 4.0):** licences verified via README; forest algorithms not inspected (gap).

**Gaps:** DCSS LICENSE path not found (404 at crawl-ref/LICENSE); Wesnoth seasonal forest variants and Flare forest tile construction not checked; Hedgewars skipped.

## Q6. Assets & palettes

**Cited findings**
- Kenney Tiny Town: 16×16, 130 files, CC0, released 2023 (v1.1). Roguelike/RPG pack: 16×16, 1700 files, CC0, 2015. Kenney support: "all game assets on the asset pages are public domain licensed (CC0)".
- LPC sets: [LPC] Trees CC BY-SA 3.0 (bluecarrot16 curated, rejected 3D renders and high colour counts); LPC Seasoned Trees CC BY-SA 3.0/GPL-3.0 (winter + season recolours of Sharm's conifer); Tree Recolors CC BY 3.0/4.0/GPL-3.0 (green, brown, autumn, yellow).
- Lospec Endesga 32: 32 colours, ~207k downloads.

**Inferences:** LPC Seasoned Trees / Tree Recolors are ready-made proof that palette-only season variants read well at 32 px; use as visual reference even if you don't ship the art (share-alike).

**Gaps:** No high-quality **CC0 top-down 3/4 tree set** found beyond Kenney's tiny style (OGA CC0 search results were mostly side-view platformer packs).

---

## Sources
- https://github.com/kchapelier/poisson-disk-sampling ; https://registry.npmjs.org/poisson-disk-sampling ; https://api.npmjs.org/downloads/point/last-week/poisson-disk-sampling
- https://github.com/kchapelier/fast-2d-poisson-disk-sampling (LICENSE, BENCHMARK.md, src/fast-poisson-disk-sampling.js)
- https://www.npmjs.com/package/d3-delaunay ; https://www.npmjs.com/package/simplex-noise ; https://www.npmjs.com/package/lindenmayer ; https://www.npmjs.com/package/proctree
- https://github.com/udit/poisson-disc-sampling ; https://godotengine.org/asset-library/asset/559
- https://github.com/Decapitated/Godot-Poisson-Disk-Sampler ; https://www.godotengine.org/asset-library/asset/edit/9786
- https://github.com/beneater/boids ; https://eater.net/boids
- https://github.com/90-008/godot_boids ; https://godotengine.org/asset-library/asset/edit/19618
- https://github.com/viniciusgerevini/godot-boids
- https://github.com/nylki/lindenmayer ; https://github.com/supereggbert/proctree.js
- https://godotshaders.com/shader/2d-pixel-perfect-wind-sway-effect/ ; https://godotshaders.com/shader/2d-wind-sway-tree-grass-motion-shader/ ; https://godotshaders.com/shader/2d-foliage-wind-effect/ ; https://godotshaders.com/shader/2d-wind-sway/
- https://godotshaders.com/?p=7263 ; https://godotshaders.com/shader/transparency-dither/
- https://godotshaders.com/shader/efficient-3-line-palette-shader-full-alpha-support/ ; https://godotshaders.com/shader/palette-swap-no-recolor-recolor/ ; https://godotshaders.com/shader/palette-swap-using-two-textures/
- https://forum.godotengine.org/t/make-a-wall-tree-a-little-bit-translucent-trasnparent-when-there-is-a-player-behind-it-in-2d-top-down-especially/111322
- https://github.com/godotengine/godot-demo-projects
- https://github.com/luanti-org/minetest_game (LICENSE.txt, mods/default/mapgen.lua, functions.lua, nodes.lua, trees.lua)
- https://gitlab.com/veloren/veloren (world/src/all.rs, LICENSE)
- https://github.com/OpenTTD/OpenTTD (src/tree_cmd.cpp, src/tree_map.h, COPYING.md)
- https://github.com/CleverRaven/Cataclysm-DDA (LICENSE.txt, data/json/furniture_and_terrain/terrain-flora.json)
- https://github.com/00-Evan/shattered-pixel-dungeon (LICENSE.txt, levels/features/HighGrass.java)
- https://github.com/tmewett/BrogueCE (LICENSE.txt, src/brogue/Globals.c, Time.c, Rogue.h)
- https://github.com/flareteam/flare-game (README) ; https://github.com/wesnoth/wesnoth (README)
- https://kenney.nl/assets/tiny-town ; https://kenney.nl/assets/roguelike-rpg-pack ; https://kenney.nl/support
- https://opengameart.org/content/lpc-trees ; https://opengameart.org/content/lpc-seasoned-trees ; https://opengameart.org/content/lpc-tree-recolors ; https://opengameart.org/content/pine-tree-tiles
- https://lospec.com/palette-list/endesga-32
