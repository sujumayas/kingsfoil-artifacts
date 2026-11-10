# 07 Gems: open-source code and tools for fire, smoke, spreading fire and explosions

Researcher angle: field-validated code, shaders, tools and sprite packs that save Kingsfoil work on study #6.
All licence files were read on 2026-11-10 via the GitHub API (`gh api repos/.../contents/LICENSE`) unless noted. Star counts and last-push dates are from the GitHub API on the same day.

Flag legend: Low (MIT/BSD/Apache/CC0/Zlib/Unlicense), LGPL, Copyleft (GPL/AGPL/CC BY-SA), None (no licence or all rights reserved). For Copyleft and None items, read and learn from the code, then write our own version. Do not paste.

---

## Q1. Which DOOM fire and demoscene fire code can we use directly?

### Takeaway
filipedeschamps/doom-fire-algorithm is the best reference. It is MIT, has 1,599 stars, and holds 72 playground ports in many languages and render back ends. Fabien Sanglard's original repo has no licence, so treat it as reading material only. Lode's fire tutorial is "all rights reserved". The algorithm itself is tiny and free to reimplement from the description.

### Cited findings

| # | Item | Licence (read 2026-11-10) | Flag | Maturity | What it saves |
|---|---|---|---|---|---|
| 1 | [filipedeschamps/doom-fire-algorithm](https://github.com/filipedeschamps/doom-fire-algorithm) | MIT, "Copyright (c) 2019 Filipe Deschamps" | Low | 1,599 stars, last push 2026-10-17, no releases, 72 entries in `playground/` | Ready JS versions (table, `putImageData`, PixiJS, p5 particles), wind variants (manual and random wind), an "extinguish on mouseover" variant, a "burning elements" transparent variant, plus C/SDL2, raylib, Love2D, Go/Ebiten, Unity ports. The [README](https://github.com/filipedeschamps/doom-fire-algorithm) lists them all with live demo links |
| 2 | [fabiensanglard/DoomFirePSX](https://github.com/fabiensanglard/DoomFirePSX) (`flames.html`) | No LICENSE file in repo root. Article has no licence statement ([article, 2018-12-28](https://fabiensanglard.net/doom_fire_psx/)) | None | 263 stars, last push 2021-10-10. README credits Samuel Villarreal (@SVKaiser) for reverse engineering from Doom 64 assembly | The canonical write-up. 37 palette entries (0..36, black to white). Decay per step is `rand & 1` (0 or 1). Horizontal offset shifts the target by -2..+1 columns. Wind is left as an exercise |
| 3 | [Lode's fire tutorial](https://lodev.org/cgtutor/fire.html) | "Copyright (c) 2004-2007 by Lode Vandevenne. All rights reserved." No open licence | None | Classic tutorial, widely linked | Numbers to reimplement: 640x128 buffer, kernel of 3 pixels below plus 1 pixel two rows below, sum *32/129 (about /4.03). Author notes /4 makes fire rise forever, /5 kills it too fast. Palette HSL hue x/3 (0..85), sat 255, light min(255, 2x). Capped at ~20 fps |
| 4 | Small ports: [kessejones/godot-doom-fire](https://github.com/kessejones/godot-doom-fire), [gogoprog/doom-fire-psx-love2d](https://github.com/gogoprog/doom-fire-psx-love2d), [thisaislan/doom-fire-psx](https://github.com/thisaislan/doom-fire-psx), [chriswhocodes/DoomFire](https://github.com/chriswhocodes/DoomFire) | godot-doom-fire and love2d port show no licence via API | None | godot-doom-fire 3 stars, last push 2021-02-17. Love2D port 0 stars, 2018 | A Godot example exists, but it targets old Godot and has no licence. Not worth more than a glance |

### Inferences
- The DOOM fire is about 15 lines. Writing it ourselves in GDScript or a `canvas_item` shader is faster than vetting an unlicensed port. Use filipedeschamps (MIT) if we want to lift code for the web demos.
- In Fabien's live `flames.html`, the fire is stopped by zeroing the source row. The article itself is inconsistent about this (see row 2). Inference from reading, not verified line by line.

### Gaps
- Hugo Elias's fire page (freespace.virgin.net) was not checked this round. Licence unknown.
- No demoscene fire repo (e.g. pouet.net productions with source) was vetted.

---

## Q2. Which Godot shaders and asset packs fit a WebGL2, pixel-art, top-down game?

### Takeaway
godotshaders.com has several `canvas_item` fire shaders with explicit CC0 or MIT. Three stand out for pixel art. Simple Pixelated Fire (MIT) does palette thresholds plus whole-pixel scroll stepping, which is the DOOM-style "palette select" look. 2D Fire Effect with colour banding (CC0) quantises alpha to 20 steps. Fire dissolve (CC0) is a burn-away effect for charred tiles and dying creatures. The Godot Asset Library search for "fire" returns mostly Firebase plugins, so it is a poor source.

### Cited findings

| # | Item | Licence (read 2026-11-10) | Flag | Maturity | What it saves |
|---|---|---|---|---|---|
| 5 | [Simple Pixelated Fire shader](https://godotshaders.com/shader/simple-pixelated-fireshader/) by CasualCynic | MIT, stated on page | Low | Published 2025-11-19, Godot 4.5, `canvas_item`. Same author repo [Casual-Cynic/sconce-fire-test](https://github.com/Casual-Cynic/sconce-fire-test) is MIT, 3 stars | Scrolls noise up, multiplies by gradients, thresholds brightness into up to 5 palette colours. Pixel stepping via `floor(TIME * scroll_speed)`. Close to our palette-select approach from study #2 |
| 6 | [2D Fire Effect with colour banding](https://godotshaders.com/shader/2d-fire-effect-with-colour-banding/) by Haizlbliek | CC0, stated on page | Low | Published 2023-08-25. Uses `hint_color`, so Godot 3 syntax (needs a small port) | Two-colour noise flame, sine wobble, flicker, alpha rounded to 20 steps for banding. `timeOffset` de-syncs many torches |
| 7 | [Procedural Torch & Candle (Fire + Smoke + Sparks)](https://godotshaders.com/shader/procedural-torch-candle-shader-fire-smoke-sparks/) by CaptainLaptop | CC0 (header says "CC0 / MIT") | Low | Published 2025-10-19, Godot 4.x | No textures. Defaults of 128 flame particles, 18 sparks, 20 smoke puffs, all in-shader, plus `windForce` and pixel-snap. Cost per pixel grows with particle count (16..512 loop), so test on mobile WebGL |
| 8 | [Fire dissolve shader](https://godotshaders.com/shader/fire-dissolve-shader/) by HexagonNico | CC0, stated on page (code only, not preview media) | Low | Published 2024-05-26 | `step()` of noise vs `integrity` with a `burn_size` band coloured by a gradient. Good for "burning -> charred" tiles and creature death |
| 9 | Other godotshaders candidates not yet licence-checked: [2D Fire](https://godotshaders.com/shader/2d-fire-2/), [Fire Distortion](https://godotshaders.com/shader/fire-distortion/), [Fireball or Candle](https://godotshaders.com/shader/fireball-or-candle-fire-shader/), [Balatro Fire](https://godotshaders.com/shader/balatro-fire-shader/), [2D Fire Mask](https://godotshaders.com/shader/2d-fire-mask/) | Not read | ? | Listed in [search](https://godotshaders.com/?s=fire), 39 results on page 1 | Heat shimmer (Fire Distortion) is the one most relevant to scope item 1 |
| 10 | [haowg/GODOT-VFX-LIBRARY](https://github.com/haowg/GODOT-VFX-LIBRARY) | MIT (API spdx) | Low | 358 stars, last push 2026-01-25. README cites use in [Land of Oblivion](https://store.steampowered.com/app/2457740/Land_of_Oblivion/) (Steam). Author's own claim | 35+ particle effects and 17+ shaders for Godot 4. Includes torch fire, steam, fireball trails |
| 11 | [gdquest-demos/godot-4-VFX-assets](https://github.com/gdquest-demos/godot-4-VFX-assets) | Code MIT. Art assets CC BY-NC-SA 4.0 (LICENSE file) | Low (code) / Copyleft+NC (art) | 137 stars, last push 2026-05-16 | Godot 4 particle and shader setups. Do not ship the textures in a commercial game (NC clause) |
| 12 | [RPicster/Godot-particle-and-vfx-textures](https://github.com/RPicster/Godot-particle-and-vfx-textures) | CC0-1.0 (API spdx) | Low | 378 stars, last push 2020-12-02 (stale but textures don't rot) | Smoke and flame textures for GPUParticles2D/CPUParticles2D. Smooth, not pixel art, so pixelate or use as noise |
| 13 | [Godot Asset Library "fire" search](https://godotengine.org/asset-library/asset?filter=fire&sort=rating) | Per asset | - | 15 hits, mostly Firebase. Only "Fire Shader" (asset 840, MIT, Godot 3.4, 2022) is relevant | Nothing big. Skip |

### Inferences
- All of rows 5-8 are `canvas_item` fragment shaders with no compute, so they should run on the Compatibility renderer. Not tested.
- For a server-authoritative tile grid, a shader per fire tile with a per-tile `timeOffset` gives variety at zero network cost.

### Gaps
- Did not open row 9 shaders to read their licences.
- No Godot fire-spread demo with a licence was found. [jasoncndai/Its-Spreading-The-Fire](https://github.com/jasoncndai/Its-Spreading-The-Fire) exists (0 stars, no licence).

---

## Q3. Which falling-sand engines show fire and smoke rules worth copying?

### Takeaway
Sandspiel (MIT, Rust/WASM + WebGL) is the cleanest permissive reference. Its fire rule is a few lines of cell logic coupled to a wind/fluid field. The Powder Toy (GPL-3.0) is the most mature but copyleft. sand-slide (MIT, Godot 4 GDExtension) ships on itch.io and Google Play and is the only Godot-native one. Sand Game JS is "all rights reserved" despite public source.

### Cited findings

| # | Item | Licence (read 2026-11-10) | Flag | Maturity | What it saves |
|---|---|---|---|---|---|
| 14 | [MaxBittker/sandspiel](https://github.com/MaxBittker/sandspiel) | MIT, "Copyright (c) 2018 Max Bittker" | Low | 3,222 stars, last push 2026-09-10. Live at [sandspiel.club](https://sandspiel.club). [Making-of post](https://maxbittker.com/making-sandspiel) | `update_fire` in `crate/src/species.rs` (line ~591): fire cell loses `2 + rand_dir` of its `ra` value each tick, pushes upward wind (`dy: 150`), ignites neighbouring Gas or Dust into new Fire with `ra = 150 + (dx+dy)*10`. Shows how a cheap fluid field drives smoke |
| 15 | [The-Powder-Toy/The-Powder-Toy](https://github.com/The-Powder-Toy/The-Powder-Toy) | GPL-3.0 | Copyleft | 5,403 stars, last push 2026-11-08, release v100.1.400 (2026-08-08). On [Steam since 2024-06-14](https://store.steampowered.com/app/1148350/The_Powder_Toy/) | Air pressure, heat transfer, many burn elements. Read it for ideas only |
| 16 | [kiwijuice56/sand-slide](https://github.com/kiwijuice56/sand-slide) | MIT, "Copyright (c) 2022 Eric Alfaro" | Low | 143 stars, last push 2026-09-08. Shipped on [itch.io](https://kiwijuice56.itch.io/sand-slide) and [Google Play](https://play.google.com/store/apps/details?id=org.godotengine.sandslide) | Godot 4.6 UI plus C++ GDExtension sim. Each element is a class with `process(sim,row,col)`, with explode and acid resistance. GDExtension does not run on the web export without extra work, so take the rules, not the binary |
| 17 | [kiwijuice56/sand-spoon](https://github.com/kiwijuice56/sand-spoon) | MIT (API spdx) | Low | 24 stars, last push 2024-07-23 | Sibling project, smaller |
| 18 | [Hartrik/sand-game-js](https://github.com/Hartrik/sand-game-js) (now [sandsaga.com](https://sandsaga.com)) | LICENSE.md says "all rights reserved", "NOT open-source software in the legal sense" | None | 47 stars, last push 2024-08-03 | WebGL2 browser sand with fire. Look only |
| 19 | [VenitStudios/GodotFallingSand](https://github.com/VenitStudios/GodotFallingSand) | GPL-3.0 (API spdx) | Copyleft | 15 stars, last push 2024-11-09 | Godot sand demo. Copyleft, low maturity |

### Inferences
- For Asterion's tile grid (cells are tiles, not pixels), Sandspiel's "ra = heat/life byte decremented each tick" is the same idea as the DOOM fire's cooling, applied per tile. Fits a server tick.

### Gaps
- No permissive Noita-like engine with real maturity was found. GitHub search for "noita like" returns save editors and tiny projects (top: annasajkh/ParticleSandbox, 3 stars, MIT).

---

## Q4. What fluid and smoke code is safe to borrow?

### Takeaway
PavelDoGreat/WebGL-Fluid-Simulation is MIT with 16,809 stars and is the go-to WebGL smoke reference. keijiro/StableFluids is Unlicense. Stam's own patent (US 6,266,071, filed 1998-11-20) is listed by Google Patents as expired. For a pixel game, a full fluid sim is overkill. Cheap smoke is sprites or a coarse grid.

### Cited findings

| # | Item | Licence (read 2026-11-10) | Flag | Maturity | What it saves |
|---|---|---|---|---|---|
| 20 | [PavelDoGreat/WebGL-Fluid-Simulation](https://github.com/PavelDoGreat/WebGL-Fluid-Simulation) | MIT, "Copyright (c) 2017 Pavel Dobryakov" | Low | 16,809 stars, last push 2024-11-12. Sandspiel README says its fluid code was adopted from an outside source (truncated in our read) | Full GPU stable-fluids pipeline in WebGL (advection, pressure, curl/vorticity). Uses many render passes, so it is too heavy for a 320x180 pixel game on mobile, but the shader structure ports to Godot `SubViewport` ping-pong |
| 21 | [keijiro/StableFluids](https://github.com/keijiro/StableFluids) | Unlicense (API spdx) | Low | 1,173 stars, last push 2025-08-28. [WebGL demo](https://keijiro.github.io/StableFluids) | Short Unity compute-shader version. Compute shaders are not available on Godot Compatibility, so use as a reading reference |
| 22 | Jos Stam, [Real-Time Fluid Dynamics for Games](https://pdfs.semanticscholar.org/5127/ac7b58e36ffd13ca4437fc123c6a018dc436.pdf) (GDC 2003) | Paper cites patent [US6266071B1](https://patents.google.com/patent/US6266071B1/en). Google Patents lists it "Expired - Lifetime" (not legal advice per Google). No code licence found | None (code) | The original CPU grid solver used in countless ports, e.g. [albertosantini/python-fluid](https://github.com/albertosantini/python-fluid) | CPU solver at small grids (e.g. 64x64) is cheap enough for a coarse smoke density field over tiles |
| 23 | Shadertoy fire/smoke shaders | Shadertoy default is CC BY-NC-SA 3.0 unless the author states otherwise (per task brief, not re-verified this round) | Copyleft + NC | - | Learn only. Do not ship |

### Gaps
- Did not verify the exact Shadertoy default licence text on shadertoy.com/terms this round.

---

## Q5. What do roguelike sources teach about fire spread and gas?

### Takeaway
Brogue CE and DCSS both ship tile-based fire and gas code tested by years of play. Both are copyleft, so copy the rules, not the code. libtcod (BSD-3) has no fire module but is permissive.

### Cited findings

| # | Item | Licence (read 2026-11-10) | Flag | Maturity | Mechanism found in source |
|---|---|---|---|---|---|
| 24 | [tmewett/BrogueCE](https://github.com/tmewett/BrogueCE) | AGPL-3.0 (LICENSE.txt) | Copyleft | 1,525 stars, last push 2026-11-06, release v1.15.1 (2026-02-12) | `src/brogue/Time.c`. `exposeTileToFire` (line 1181): a cell can be exposed at most 12 times. Each flammable layer has a `chanceToIgnite` percent. Ignition "promotes" (consumes) the flammable layer to its burnt form. 8 explosive neighbours trigger explosive promotion. `updateEnvironment` (line ~1525): each burning cell exposes itself and its 4 orthogonal neighbours each turn, skipping cells that `CAUGHT_FIRE_THIS_TURN`. `updateVolumetricMedia` (line 1247): gas volume averages over the cell and its 8 neighbours with stochastic rounding of the remainder, walls block gas, chasms leak gas off-level |
| 25 | [crawl/crawl](https://github.com/crawl/crawl) (DCSS) | GPL-2.0-or-later. Most tiles CC0 (LICENSE) | Copyleft (code), Low (most tiles) | 3,075 stars, last push 2026-11-10, release 0.34.1 (2026-03-15) | `crawl-ref/source/cloud.cc`. `_spread_cloud`: spread chance per neighbour is 80% if decay > 30, 50% if > 20, else 30%. New cloud decay = decay/2 + 1. Each spread adds 8 extra decay to the parent. `_spread_fire` (forest fire): flames appear around a burning tree on a 1-in-5 roll. Each flammable neighbour ignites with chance 1 in 20 per turn, and the new fire gets decay 25..54. Fire next to water makes steam with chance 1 in 14 (steam decay 2..6) |
| 26 | [libtcod/libtcod](https://github.com/libtcod/libtcod) | BSD-3-Clause | Low | 1,240 stars, release 2.3.0 (2026-11-09) | FOV, noise, pathing. No fire code. Its noise helpers help for flicker. Godot has its own noise, so low value for us |

### Inferences
- DCSS's "each neighbour gets a separate 1-in-20 roll" is what makes forest fire creep instead of exploding outward. Good default for Asterion tree tiles.
- Brogue's 12-exposure cap stops a single tile from re-igniting forever. That is a cheap guard for server load.

---

## Q6. Which sprite packs and effect tools have clear licences?

### Takeaway
Kenney's Particle Pack is CC0 but its contents are not pixel art. For pixel fire, Devkidd's Pixel Art Fire Asset Pack (free, commercial OK, 44 ratings at 4.9/5) is the most validated free item found. OpenGameArt blocked our fetcher (HTTP 403), so OGA licences below come from search snippets only. Effekseer is MIT with an official Godot 4 plugin but is a 3D-leaning tool.

### Cited findings

| # | Item | Licence | Flag | Maturity | What it saves |
|---|---|---|---|---|---|
| 27 | [Kenney Particle Pack](https://kenney.nl/assets/particle-pack) | CC0 (page, read 2026-11-10) | Low | v1.0, 2018, "80x" files | Soft particle textures. Contents of fire/smoke not confirmed on page |
| 28 | [Devkidd Pixel Art Fire Asset Pack](https://devkidd.itch.io/pixel-fire-asset-pack) | Custom: free for personal and commercial, attribution optional, no resale (page, read 2026-11-10) | Low (custom, no resale) | 44 ratings, 4.9/5. v1.2 devlog 2025-07-17. Includes .aseprite source | Idle flames at 16x32, 32x32, 32x48. Fits a 320x180 screen. Frame counts not stated |
| 29 | [cs5475 Free Pixel Effects](https://cs5475.itch.io/free-pixel-effects) | CC0 (page, read 2026-11-10) | Low | Published about 16 days before 2026-11-10. No ratings shown. Very new | 12 explosions, 10 hit sparks, 8 magic bursts, 32..64 px. Palettes in JSON. [Devlog on fixes](https://cs5475.itch.io/free-pixel-effects/devlog/1726605/30-free-pixel-effects-and-the-two-fixes-that-made-them-look-right) |
| 30 | [Willosuna Free Pixel Explosions & FX](https://willosuna.itch.io/free-pixel-explosions-fx) | Search snippet: commercial OK, no attribution, no resale. Not read on page | Low (unverified) | Unknown | 24 explosions, impacts, smoke, muzzle flashes |
| 31 | [CodeManu Free Pixel Effects Pack](https://codemanu.itch.io/pixelart-effect-pack) | Snippet shows conflict: text says public domain, metadata says CC BY 4.0 | Unclear | Author of Pixel FX Designer | Treat as CC BY 4.0 (credit the author) until verified |
| 32 | OpenGameArt CC0 sheets: [Animated Fire (BenHickling)](https://opengameart.org/content/animated-fire), [Explosion (BenHickling)](https://opengameart.org/content/explosion-7), [32x32 Explosion](https://opengameart.org/content/32x32-explosion), [Animated flame sheet (highwizard)](https://opengameart.org/content/animated-flame-fire-sprite-sheet), [Fire tile (i_rk_jain)](https://opengameart.org/content/fire-9) | CC0 per search snippets. OGA returned 403 to WebFetch | Low (unverified) | BenHickling fire is 64x64, 60 frames, not true pixel art. [Explosion animations (Jetrel/Frogatto)](https://opengameart.org/content/explosion-animations) has a comment saying the art may really be CC-BY 3.0 | Placeholder art. 60 frames is far more than a pixel game needs |
| 33 | [effekseer/Effekseer](https://github.com/effekseer/Effekseer) + [EffekseerForGodot4](https://github.com/effekseer/EffekseerForGodot4) | MIT (LICENSE and LICENSE_TOOL) | Low | Effekseer 2,057 stars, release 1808 (2026-10-30). Godot 4 plugin 119 stars, last push 2026-08-09 | Particle editor and runtime. Native plugin, so web export support needs checking. Output is smooth, not pixel art |
| 34 | [Pixel FX Designer](https://store.steampowered.com/app/939360/Pixel_FX_Designer/) (Codemanu) | Commercial, $9.99 base per [SteamDB](https://steamdb.info/app/939360/) | Commercial | On Steam | Bakes pixel particle effects to sprite sheets. JuiceFX is sold in a bundle (search result), no standalone price found |

### Gaps
- No Aseprite fire-generator script found (GitHub search "aseprite fire script" returned zero repos).
- OGA licences unverified because of the 403 block. Try archive.org copies next round.

---

## Q7. Which fire-spread and wildfire sims, and Minecraft-like fire code, are reusable?

### Takeaway
Luanti's (Minetest Game) fire mod is LGPL-2.1 code with CC BY-SA 3.0 media, the most "shipped" voxel fire code with a readable licence. Small forest-fire CA demos exist, the best being Gerstacker/macroquad-forestfire (public domain text in README, WASM demo).

### Cited findings

| # | Item | Licence (read 2026-11-10) | Flag | Maturity | What it saves |
|---|---|---|---|---|---|
| 35 | [luanti-org/minetest_game `mods/fire`](https://github.com/luanti-org/minetest_game/tree/master/mods/fire) | Code LGPL-2.1 (`mods/fire/license.txt`). Textures and sounds CC BY-SA 3.0 | LGPL (code), Copyleft (media) | Repo 1,576 stars, last push 2026-10-30. Ships as Luanti's default game | `init.lua` holds fire spread via ABMs (timed block updates), flammable groups, extinguish rules. Reimplement rules, don't copy media |
| 36 | [Gerstacker/macroquad-forestfire](https://github.com/Gerstacker/macroquad-forestfire) | No LICENSE file. README contains the Unlicense public-domain text | Low (via README) | 82 stars, last push 2025-02-15. [WASM demo](https://gerstacker.github.io/macroquad-forestfire/) | Drossel-Schwabl self-organized-criticality forest fire model, click to start fires. Good visual reference for the classic CA |
| 37 | [y-taka-23/elm-forestfire](https://github.com/y-taka-23/elm-forestfire) | BSD-3-Clause (API spdx) | Low | 7 stars, 2018 | Tiny Elm forest-fire CA |
| 38 | [YiyangZhuu/flamecell](https://github.com/YiyangZhuu/flamecell) | MIT (API spdx) | Low | 2 stars, 2025-08-18 | Small CA. Low maturity |

### Gaps
- Did not read Luanti `fire/init.lua` for exact ABM interval and chance numbers.
- No Rothermel implementation was vetted.

---

## Shortlist for Kingsfoil

1. DOOM fire: write our own, check against filipedeschamps (MIT).
2. Pixel torch shader: Simple Pixelated Fire (MIT) or colour-banding (CC0) as a starting point.
3. Burn-away of tiles and creatures: Fire dissolve (CC0).
4. Spread rules: copy the numbers, not the code, from DCSS (1-in-20 per neighbour, decay 25..54) and Brogue (12-exposure cap, 4-neighbour exposure each turn).
5. Gas and smoke over tiles: Brogue's 9-cell average with stochastic rounding (rules only, AGPL code).
6. Art placeholders: Devkidd fire pack, cs5475 CC0 explosions.

## Sources
- https://github.com/filipedeschamps/doom-fire-algorithm
- https://github.com/fabiensanglard/DoomFirePSX
- https://fabiensanglard.net/doom_fire_psx/
- https://lodev.org/cgtutor/fire.html
- https://github.com/kessejones/godot-doom-fire
- https://godotshaders.com/?s=fire
- https://godotshaders.com/shader/simple-pixelated-fireshader/
- https://godotshaders.com/shader/2d-fire-effect-with-colour-banding/
- https://godotshaders.com/shader/procedural-torch-candle-shader-fire-smoke-sparks/
- https://godotshaders.com/shader/fire-dissolve-shader/
- https://godotengine.org/asset-library/asset?filter=fire&sort=rating
- https://github.com/haowg/GODOT-VFX-LIBRARY
- https://github.com/gdquest-demos/godot-4-VFX-assets
- https://github.com/RPicster/Godot-particle-and-vfx-textures
- https://github.com/MaxBittker/sandspiel
- https://maxbittker.com/making-sandspiel
- https://github.com/The-Powder-Toy/The-Powder-Toy
- https://store.steampowered.com/app/1148350/The_Powder_Toy/
- https://github.com/kiwijuice56/sand-slide
- https://github.com/Hartrik/sand-game-js
- https://github.com/VenitStudios/GodotFallingSand
- https://github.com/PavelDoGreat/WebGL-Fluid-Simulation
- https://github.com/keijiro/StableFluids
- https://patents.google.com/patent/US6266071B1/en
- https://pdfs.semanticscholar.org/5127/ac7b58e36ffd13ca4437fc123c6a018dc436.pdf
- https://github.com/tmewett/BrogueCE (src/brogue/Time.c)
- https://github.com/crawl/crawl (crawl-ref/source/cloud.cc)
- https://github.com/libtcod/libtcod
- https://kenney.nl/assets/particle-pack
- https://devkidd.itch.io/pixel-fire-asset-pack
- https://cs5475.itch.io/free-pixel-effects
- https://willosuna.itch.io/free-pixel-explosions-fx
- https://codemanu.itch.io/pixelart-effect-pack
- https://opengameart.org/content/animated-fire
- https://opengameart.org/content/explosion-animations
- https://github.com/effekseer/Effekseer
- https://github.com/effekseer/EffekseerForGodot4
- https://store.steampowered.com/app/939360/Pixel_FX_Designer/
- https://steamdb.info/app/939360/
- https://github.com/luanti-org/minetest_game
- https://github.com/Gerstacker/macroquad-forestfire
- https://github.com/y-taka-23/elm-forestfire
