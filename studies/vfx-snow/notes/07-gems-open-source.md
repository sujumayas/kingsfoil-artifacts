# 07 — Gem findings: field-validated open-source code & tools for snow (top-down pixel, Godot 4 / web)

Researcher angle: open-source code a Godot 4 / web pixel-art dev can lift, port or study. Every repo row was checked against the GitHub search API on 2026-11-08 (stars, SPDX licence, `pushed_at` = last push). Direct `repos/` API calls were blocked in this session, so I used `search/repositories?q=repo:owner/name` instead (the same data). Where a licence is "NOASSERTION", GitHub could not parse it, and I note what I read in the file myself.

---

## 0. Summary table

| Name | URL | Licence (verified) | Maturity evidence | What it's good for |
|---|---|---|---|---|
| **OpenTTD: arctic snow line + LFSR tile loop** | https://github.com/OpenTTD/OpenTTD (`src/clear_cmd.cpp` `TileLoopClearAlps`, `src/landscape.cpp` `RunTileLoop`, `GetSnowLine`) | GPL-2.0 (COPYING.md says "Version 2, June 1991"; GitHub reports NOASSERTION) | 8,482 stars; pushed 2026-11-08; shipped since 2004; millions of players | **Top gem.** 4-level snow density per tile that steps toward a height-based target by +/-1 per tile visit. Tiles are visited in pseudo-random LFSR order, every tile once per 256 ticks. Gives organic, gradual build-up and melt without a scanline "wipe". Copy the idea, not the code (GPL). |
| **"Just snow"** by Andrew Baldwin (baldand), Shadertoy `ldsGDn` | https://www.shadertoy.com/view/ldsGDn (ID confirmed from file names in grigM/ISF-shaders-collection) | **CC BY-NC-SA 3.0**, stated in the source header ("Copyright (c) 2013 Andrew Baldwin") | Canonical: ported to libretro/RetroArch borders, Ghostty terminal shaders, Unity, Flutter and ISF | The reference falling-snow shader: N parallax layers of hashed grid cells. **Non-commercial licence: re-implement it, do not paste it.** |
| godotshaders "Let it snow!!!" (gerardogc2378) | https://godotshaders.com/shader/let-it-snow/ | Page says CC0 (**but see the licence warning below**) | Posted 2023-09-08; 0 comments; works on GLES2/Android | A ready Godot canvas_item port of the Just-snow algorithm. |
| godotshaders "Multilayer Snowfall Shader" (Lumine) | https://godotshaders.com/shader/multilayer-snowfall-shader/ | Page says CC0 (provenance unclear, see below) | Posted 2025-01-12; 6 comments; modified 2026-11-06 | Adds `wind`, `speed`, `spread` and `num_of_layers` (default 40) controls to the same layered approach. |
| godotshaders "Rain and Snow with Parallax Effect" (Steampunkdemon / Brian Smith) | https://godotshaders.com/shader/rain-and-snow-with-parallax-scrolling-effect/ | MIT | Posted 2023-07-09; one commenter used it in a game; also sold or tipped on itch | Procedural, no textures. Each column gets a random value that blends near and far settings; a hard-edged `step()` variant is meant for snow. **The `step()` version suits pixel art best.** |
| godotshaders "Car Tracks On Snow Or Sand – viewport textures + particles" (dip) | https://godotshaders.com/shader/car-tracks-on-snow-or-sand-using-viewport-textures-and-particles/ | MIT | Posted 2023-09-25, updated 2026-11-06; 4 comments | **The canonical Godot 4 SubViewport trail pattern.** A top-down camera in a SubViewport renders only the trail particles; the ground shader reads the red channel. |
| Flynsarmy/gd-snow-project | https://github.com/Flynsarmy/gd-snow-project | MIT | 4 stars; created 2026-06-19; pushed 2026-07-14 | Godot **4.7** snow stomping using the new **DrawableTextures** (GPU-paintable Texture2D), so no SubViewport is needed. Small but current. |
| Godot 4.7 `DrawableTexture2D` (engine feature) | https://docs.godotengine.org/en/4.7/classes/class_drawabletexture2d.html ; https://docs.godotengine.org/en/4.7/tutorials/rendering/drawable_textures.html | MIT (engine) | Official 4.7 docs | "A 2D texture that supports drawing to itself via Blit calls." A native way to keep a footprint/snow-depth mask. |
| pirachute/godot-weather-2D ("Weather 2D", Asset Library #897) | https://github.com/pirachute/godot-weather-2D ; https://godotengine.org/asset-library/asset/897 | MIT | 94 stars; **last push 2021-03-19; Godot 3.2** | Wind, rain and snow particles, a weather "collider" area that changes the weather, and follow-the-player. Shows the pattern but is stale and needs porting to Godot 4. |
| WeatherSystem2D (gregrylivingston) | https://github.com/gregrylivingston/Godot4---Weather-System-2D ; https://godotengine.org/asset-library/asset/edit/23531 | MIT | Asset Library accepted; Godot 4.3 | Rain, snow and fog; day/night; weather fronts; seed-deterministic. No accumulation is mentioned. |
| mlavik1/GodotWeatherSystem | https://github.com/mlavik1/GodotWeatherSystem | MIT | 10 stars; last push 2024-02-14 | Small reference. |
| Spyridon-Pikoulas/godot-weather-fx-free ("Weather FX Free", Asset Library #5495) | https://github.com/Spyridon-Pikoulas/godot-weather-fx-free | Custom ("free for commercial…"; GitHub reports NOASSERTION) | 1 star; created 2026-09-26 | One-line 2D rain/snow/fog shaders with no textures. Too new to call validated. |
| **Sandspiel** (Max Bittker) | https://github.com/MaxBittker/sandspiel ; https://sandspiel.club ; write-up https://maxbittker.com/making-sandspiel | MIT | 3,221 stars; pushed 2026-09-10; live community site since 2018 | Rust to WASM cellular automaton + WebGL rendering + **a WebGL fluid sim that pushes the particles (wind)**. This is the template for wind-blown snow and drifts on the web. It has an Ice species; Snow is commented out in `species.rs`. |
| The Powder Toy | https://github.com/The-Powder-Toy/The-Powder-Toy | GPL-3.0 | 5,395 stars; pushed 2026-11-08; maintained since 2010 | `SNOW.cpp` is a reference **powder** element: starts at R_TEMP - 30 °C, turns to water above 252.05 K, and becomes salt water near SALT/SLTW at 1/333 chance per neighbour per frame. Useful for tuning melt and salt rules. GPL: study only. |
| Sandboxels (R74n) | https://github.com/R74nCom/sandboxels | Custom (NOASSERTION; I could not read the LICENSE file, so check before reuse) | 478 stars; 500+ elements; in-browser | Browser JS falling sand with snow/ice/water/steam interactions. Readable JS. |
| kiwijuice56/sand-slide | https://github.com/kiwijuice56/sand-slide | MIT | 143 stars; pushed 2026-09-08; **shipped on itch and Google Play** | **Godot 4 GDExtension (C++) falling-sand engine.** The fastest proven route to a Noita-style snow layer in Godot. Elements are stateless `process(sim,row,col)` classes. |
| PieKing1215/FallingSandSurvival / FallingSandEngine | https://github.com/PieKing1215/FallingSandSurvival | BSD-3-Clause | 222 stars (C++, last push 2022) / 76 stars (Rust) | Noita-like open implementations (chunks, rigid bodies). Heavy, but well studied. |
| Clocktown/Godot-Falling-Sand-Compute-Shader | https://github.com/Clocktown/Godot-Falling-Sand-Compute-Shader | MIT | 3 stars; Godot 4.6 | Compute-shader falling sand in Godot. Will **not** run on the web (WebGL2 has no compute). |
| **filipedeschamps/doom-fire-algorithm** | https://github.com/filipedeschamps/doom-fire-algorithm | MIT | 1,599 stars; pushed 2026-10-17 | The "tiny effect" playground template: dozens of language ports, all in one repo. |
| fabiensanglard/DoomFirePSX | https://github.com/fabiensanglard/DoomFirePSX ; https://fabiensanglard.net/doom_fire_psx/ | **No licence file** (GitHub: none), so all rights reserved by default | 263 stars; last push 2021-10-10 | The original write-up and code. Cite it, re-implement, do not copy. |
| PICO-8 "Component Snow" (dw817) | https://www.lexaloffle.com/bbs?tid=36368 | CC4-BY-NC-SA (shown on the cart page) | 5 likes; 2019-12-25 | A tiny falling-and-piling snow automaton: a flake falls; if blocked it slides left or right (random if both are free); when stuck it is stamped into the screen and removed from the list. Arrow keys switch drizzle to blizzard. |
| MBoffin "PICO-8: Particles" | https://mboffin.itch.io/pico-8-particles | Not stated (an open forum thread asks about it) | Well-known PICO-8 educator (Dylan Bennett) | Heavily commented particle-system cart for learning. Treat the licence as unknown. |
| Unity: jjacobson/Realtime-Snow | https://github.com/jjacobson/Realtime-Snow | GPL-3.0 | 85 stars; last push 2022 | Deformation **and accumulation** in Unity (render-texture approach). GPL: study only. |
| Unity: krjemelikk/SnowShader | https://github.com/krjemelikk/SnowShader | MIT | 55 stars; last push 2023 | Small MIT interactive-snow example, portable to Godot. |
| Unity: mert-dev-acc/SnowShaderGraph | https://github.com/mert-dev-acc/SnowShaderGraph | MIT | 74 stars | Shader Graph deformation (URP/HDRP). |
| Unity: nkihrk/SnowTrail | https://github.com/nkihrk/SnowTrail | MIT | 23 stars; 2018 | Minimal RT trail. |
| Unreal: Zhibade/interactive-snow-unreal / roymasad/Unreal-Snow-Deformation | https://github.com/Zhibade/interactive-snow-unreal ; https://github.com/roymasad/Unreal-Snow-Deformation | MIT / BSD-2-Clause | 4–5 stars | Small reference projects. |
| Minions Art (Joyce): RenderTexture painting / Interactive Snow w/ Tessellation | https://80.lv/articles/using-rendertexture-painting-shader ; https://www.patreon.com/posts/interactive-snow-25641162 | No licence stated; code on Pastebin and Patreon | 80.lv feature 2017-12-26; widely shared artist-tutor | Artist-validated: untouched snow is raised, and a brush pushes the painted areas down. |
| Kodeco / raywenderlich "Creating Snow Trails in Unreal Engine 4" | https://www.kodeco.com/5760-creating-snow-trails-in-unreal-engine-4 | Tutorial (site terms) | Long-standing, widely cited tutorial (content not re-read here) | Explains the scene-capture → render target → displacement pipeline step by step. |
| Noniv/snowflow_demo | https://github.com/Noniv/snowflow_demo | MIT | **596 stars** in about 3 months (created 2026-07-28) | WebGPU + Babylon.js procedural snow. 3D and WebGPU-only, but a fresh, popular web reference. I did not inspect its internals. |
| Lospec winter palettes | https://lospec.com/palette-list/tag/winter | No licence stated on the tag page | e.g. Winter Wonderland (8 colours, 7,195 downloads, 305 likes); Wintercode (36 colours, 313 likes); Snowflake 4 (4 colours); Ski resort gb (4 colours); Snowfall (19 colours) | Ready ramps for snow, shade, ice and slush. 4-colour GB-style sets suit dithered snow. |
| N0cturneDev/Bayer-Dithering-Shader | https://github.com/N0cturneDev/Bayer-Dithering-Shader | CC-BY-4.0 | 4 stars | Small Bayer dither reference. The 4x4 Bayer matrix itself is public math. |

---

## Q1. Godot-ready snow code (falling, trails, weather)

**Takeaway:** Falling snow is a solved, paste-able problem on godotshaders.com. Two of the three snow shaders there are labelled CC0, but they appear to be derived from a CC BY-NC-SA Shadertoy shader. For trails, the Godot-native patterns are (a) a SubViewport plus top-down camera rendering only "stamp" particles, and (b) Godot 4.7 DrawableTexture2D blits.

**Cited findings**
- "Let it snow!!!" (CC0, 2023-09-08) is a canvas_item port: "From shadertoy to Godot shader. It works for GLES2 and Android devices!"
  - It loops over `num_of_layers` (default 5) with `q = uv*(1.0+fi*0.5)`.
  - It uses a constant `mat3` hash and diamond-ish flakes drawn with `smoothstep`.
  - It fakes depth of field with `dof = 5.0*sin(TIME*0.1)`. https://godotshaders.com/shader/let-it-snow/
- Multilayer Snowfall (Lumine, CC0, 2025-01-12):
  - Default 40 layers; farther layers fall more slowly (speed divided by depth); wind is a horizontal shift.
  - Uniforms: `spread, size, snow_color, snow_transparency, speed, wind, num_of_layers`.
  - A commenter's tip: start the loop at 10 to remove the near flakes. https://godotshaders.com/shader/multilayer-snowfall-shader/
- Rain & Snow Parallax (MIT, Steampunkdemon):
  - Two depth sets (near and far). A per-column random value interpolates length, width, alpha and speed.
  - A `step()` hard-edged variant is recommended for snow.
  - `TIME` is offset by 10000 and can be script-driven to pause or control the fall. https://godotshaders.com/shader/rain-and-snow-with-parallax-scrolling-effect/
- Car Tracks (MIT, dip): a SubViewport containing a top-down Camera3D renders only the tire-trail particles on a separate render layer. The ground shader samples the red channel, darkens toward `trail_color`, and displaces by `floor_heightmap × ditch_height(0.2) × trail`. https://godotshaders.com/shader/car-tracks-on-snow-or-sand-using-viewport-textures-and-particles/
- gd-snow-project: "Raises snow up based on terrain vertex colours, then stomps it back down under a character's feet". It is adapted for Godot 4.7 using DrawableTextures. https://github.com/Flynsarmy/gd-snow-project
- Godot 4.7 docs: DrawableTextures are "a type of Texture2D with additional functions for modifying the texture via the GPU". https://docs.godotengine.org/en/4.7/tutorials/rendering/drawable_textures.html

**Inferences**
- **Licence warning.** "Let it snow!!!" has the same structure as baldand's "Just snow": a constant `mat3` hash, a per-layer `uv*(1+fi*k)` scale and `dof = 5.0*sin(time*0.1)`. Those are verbatim features of the 2013 source shown in Q2. Its CC0 label therefore probably does not clear the original CC BY-NC-SA 3.0 terms.
- Multilayer Snowfall reads like the same family: a "noise matrix", depth-scaled layers and a "slow sine-driven depth offset". This is unconfirmed.
- For a commercial game, write your own layered-cell shader (the technique is not copyrightable; the code is) or use the MIT Steampunkdemon shader.
- For top-down pixel art, a cheaper and more on-style option than 40 smooth layers is 2–3 layers with integer-pixel flake positions: quantise `q` to the pixel grid and use `step` instead of `smoothstep`.
- SubViewport is the safe path for Godot 4.0–4.6 and the Compatibility/web renderer. DrawableTexture2D is the 4.7+ shortcut; I did not verify that it works on the web.

**Gaps**
- The full method list of DrawableTexture2D and its Compatibility-renderer support could not be read (docs pages returned only a header).
- godotshaders pages show no like counts.

## Q2. Shadertoy classics — "Just snow" (baldand)

**Takeaway:** "Just snow" (Shadertoy `ldsGDn`, 2013) is the most-ported snow shader in existence. Its trick is many parallax layers, each a grid of cells with one hashed flake per cell. It is licensed **CC BY-NC-SA 3.0**.

**Cited findings** (source header and code read from the libretro and Ghostty ports)
- Licence and credit: "Copyright (c) 2013 Andrew Baldwin (twitter: baldand…)" "License = Attribution-NonCommercial-ShareAlike" (CC BY-NC-SA 3.0). https://github.com/libretro/glsl-shaders/blob/master/borders/resources/snow.glsl
- The author's own description: "Simple (but not cheap) snow made from multiple parallax layers with randomly positioned flakes and directions."
- Presets:
  - `LIGHT_SNOW`: LAYERS 50, DEPTH .5, WIDTH .3, SPEED .6
  - Blizzard: LAYERS 200, DEPTH .1, WIDTH .8, SPEED 1.5

  Source: https://github.com/hackrdotsh/ghostty-shaders/blob/main/just-snow.glsl
- Algorithm per layer `i`:
  1. `q = -uv*(1+i*DEPTH)` gives the parallax scale.
  2. Shear by a per-layer random direction: `q.x += q.y*(WIDTH*mod(i*7.238917,1)-WIDTH/2)`.
  3. Fall: `q.y += SPEED*t/(1+i*DEPTH*0.03)`.
  4. Cell id: `n = vec3(floor(q), 31.189+i)`.
  5. Hash: `r = fract((31415.9+m)/fract(p*m))`, with `p` a constant mat3.
  6. Offset the flake inside the cell by `0.9*r.xy`.
  7. Diamond/hex distance `d = 0.6*max(s.x-s.y, s.x+s.y)+max(s.x,s.y)`.
  8. Edge softness varies with the layer's distance from a moving "focus layer" (DoF).
  9. Brightness `r.x/(1+0.02*i*DEPTH)`.
- The Shadertoy ID `ldsGDn` is confirmed by file names such as `Just_snow_ldsGDn.fs` in https://github.com/grigM/ISF-shaders-collection
- Shadertoy itself was behind a Cloudflare challenge in this session, so the page could not be fetched directly.

**Inferences**
- Cost is O(LAYERS) cheap ALU per pixel with no texture fetches. At 50 layers it is "not cheap" (the author's words) on mobile.
- For a top-down view, layer "depth" maps to **height above the ground**. Near or high flakes are larger and drift faster across the screen; there is no vertical "fall" in screen space, only a slight drift plus wind.
- To land flakes on the ground, add a per-cell lifetime phase so the flake shrinks and fades into a 1-px ground dot.

**Gaps**
- Other famous snow shaders (e.g. "Snow" by various authors, and Frosted-glass ones) were not catalogued because of the Shadertoy block.

## Q3. Falling-sand engines (Noita-like, snow as a powder)

**Takeaway:** For web, Sandspiel (MIT, Rust/WASM + WebGL) is the gold standard, and its fluid-wind coupling is exactly what snow drifts need. For Godot, sand-slide (MIT, GDExtension) has shipped on Android and itch. Powder Toy's SNOW element gives battle-tested melt numbers but is GPL.

**Cited findings**
- Sandspiel:
  - "built in rust (via wasm), webgl, and some JS".
  - "Fluid simulation code adopted from" PavelDoGreat/WebGL-Fluid-Simulation.
  - MIT; 3,221 stars.
  - `species.rs` has `Ice = 9` and a commented-out Snow line.

  Source: https://github.com/MaxBittker/sandspiel
- Powder Toy `SNOW.cpp`:
  - Gravity 0.05, Weight 50, Advection 0.7, `HighTemperature = 252.05f` → transition to water.
  - Default temperature is R_TEMP − 30 °C.
  - Contact with SALT/SLTW turns both cells into salt water at `rng.chance(1,333)` per neighbour per update.
  - "Created when ICE breaks under pressure."
  - GPL-3.0.

  Source: https://github.com/The-Powder-Toy/The-Powder-Toy/blob/master/src/simulation/elements/SNOW.cpp
- sand-slide: the simulation is C++ GDExtension; the UI is a Godot 4.6 project. Each element implements `process(SandSimulation*, row, col)` and is stateless (state is inferred from neighbours). Released on itch and Google Play. https://github.com/kiwijuice56/sand-slide

**Inferences**
- A full per-pixel sand sim over a whole MMORPG map is overkill. The useful reuse is a **small local CA layer**: one snow-depth byte per tile or per 2×2 pixels, with Sandspiel-style "slide if blocked" rules for drifts against walls.

**Gaps**
- Sandboxels' licence text was not readable.
- I did not benchmark any engine.

## Q4. Interactive snow trails (Unity/Unreal render-texture repos to port)

**Takeaway:** There is no single blockbuster repo; the knowledge is spread across tutorials. Minions Art and the Kodeco UE4 tutorial are the artist-validated references. The MIT Unity repos (krjemelikk 55 stars, SnowShaderGraph 74 stars) are small but clean. Realtime-Snow (85 stars) also does accumulation, but it is GPL.

**Cited findings**
- Minions Art (Joyce): untouched snow stays slightly raised and the paintbrush pushes painted areas down; tessellation plus vertex displacement from a paint map. 80.lv article dated 2017-12-26; code on Pastebin; no licence stated. https://80.lv/articles/using-rendertexture-painting-shader
- Repo stats are in the table (GitHub search API, 2026-11-08). The "interactive snow" search's top result has only 55 stars, which confirms there is no dominant OSS repo.

**Inferences**
- The universal pattern is: (1) a top-down orthographic capture or paint into an R8 mask; (2) ground samples the mask, then darkens, displaces or swaps the tile; (3) the mask slowly re-fills toward "snow present", e.g. `mask += refill*dt` while snowing.
- In 2D top-down pixel art the "displacement" becomes a palette swap or one-pixel offset darkening. The mask can be **per-tile** (as in OpenTTD) or **per-pixel at game resolution**.

## Q5. PICO-8 / TIC-80 ultra-small snow

**Takeaway:** "Component Snow" by dw817 is the smallest falling-and-piling snow rule set: fall, slide left or right if blocked, freeze into the framebuffer. It uses the screen itself as the accumulation buffer, which is the Doom-fire spirit applied to snow.

**Cited findings**
- Component Snow (2019-12-25, CC4-BY-NC-SA):
  - A flake falls; if blocked, it slides left or right, choosing randomly if both are open.
  - When stuck it is drawn and removed from the array.
  - The arrow keys change drizzle to blizzard.

  Source: https://www.lexaloffle.com/bbs?tid=36368
- MBoffin's "PICO-8: Particles" is "A heavily-commented cart showing how to create particle systems". No licence is stated. https://mboffin.itch.io/pico-8-particles

**Gaps**
- I did not find a famous snow tweetcart (BBS search and GitHub search for "pico-8 snow" / "tic-80 snow" returned nothing useful). Twitter/X/Mastodon #tweetcart was not searchable here.

## Q6. Doom fire repos (the template)

**Cited findings**
- filipedeschamps/doom-fire-algorithm: MIT, 1,599 stars, pushed 2026-10-17. https://github.com/filipedeschamps/doom-fire-algorithm
- fabiensanglard/DoomFirePSX: **no licence**, 263 stars, last push 2021-10-10. https://github.com/fabiensanglard/DoomFirePSX
- Other ports: const-void/DOOM-fire-zig (GPL-3.0, 261 stars); r-marques/doomfire (Rust, MIT, 89 stars).

**Inference:** The MIT Deschamps repo is the legally clean base for a "snow CA" playground in the same style.

## Q7. Open-source games with snow accumulation — OpenTTD's snow line (top gem)

**Takeaway:** OpenTTD solves "snow builds up and melts gradually, per tile, cheaply" with three ideas:
1. a per-tile 2-bit density (0–3) that selects one of 4 pre-drawn snow sprites;
2. a target density from `tileZ − snowLine`, moved by at most ±1 per visit;
3. a Galois-LFSR visit order that touches every tile once per 256 ticks in pseudo-random order.

With a variable snow line (a NewGRF table of 12 × 32 daily heights) the snow advances and retreats seasonally.

**Cited findings** (OpenTTD master, GPL-2.0)
- `TileLoopClearAlps`:
  ```
  k = GetTileZ(tile) - GetSnowLine() + 1
  if !snow: if k>=0 MakeSnow(tile,0)
  req = (k<0) ? 0 : min(k,3)
  if cur==req: if k<0 ClearSnow
  else AddClearDensity(±1)
  ```
  "Snow density is started at 0 so that it can gradually reach the required density." https://github.com/OpenTTD/OpenTTD/blob/master/src/clear_cmd.cpp
- Drawing uses `_clear_land_sprites_snow_desert[density] + SlopeToSpriteOffset(tileh)`: a sprite per density level and slope. Rocks have their own snowy variant. Same file.
- `GetSnowLine()` returns `_snow_line->table[month][day]` when a variable snow line is set, otherwise a static `snow_line_height`. `struct SnowLine { uint8_t table[SNOW_LINE_MONTHS][SNOW_LINE_DAYS]; highest_value; lowest_value }`. https://github.com/OpenTTD/OpenTTD/blob/master/src/landscape.cpp , https://github.com/OpenTTD/OpenTTD/blob/master/src/landscape.h ; doc group https://docs.openttd.org/source/df/d9b/group__SnowLineGroup
- The static snow line is computed from a target **snow coverage %**: `max(CalculateCoverageLine(snow_coverage, 0), 2)`. The comment says there are no snow sprites for coastal tiles, so height 1 is never allowed. Same file.
- `RunTileLoop`: "The pseudorandom sequence of tiles is generated using a Galois linear feedback shift register (LFSR)".
  - `TILE_UPDATE_FREQUENCY = 1<<8` (256 ticks).
  - It processes `mapArea>>8` tiles per tick.
  - Next tile: `tile = (tile>>1) ^ (-(tile&1) & feedback)`.
  - The feedback constants run from `0xD8F` (64×64 maps) to `0x800B87` (4096×4096).

  Same file.
- Trees: tree tiles have `SnowOrDesert` / `RoughSnow` ground. Above the snow line, tree generation is tripled (`j *= 3`). The tree tile loop plays arctic snow sounds. https://github.com/OpenTTD/OpenTTD/blob/master/src/tree_cmd.cpp
- Other open-source strategy games for later study (stats only; snow logic not inspected):
  - Freeciv: GPL-2.0, 1,631 stars
  - Widelands: GPL-2.0, 3,121 stars
  - Simutrans: 451 stars (SVN mirror; it also has a snowline)
  - Cataclysm-DDA: 13,507 stars
  - Unknown Horizons: 1,562 stars

**Inferences: why this is the gem for Asterion Online**
- Replace "height − snow line" with a per-tile **exposure score**: exposure = sky-open minus roof/tree cover minus lee-of-wall, plus the snowfall intensity. That gives sheltered-versus-exposed accumulation for free.
  - Snowing: target = `clamp(exposure*intensity, 0..3)`.
  - Sunny: target falls faster on sun-facing or exposed tiles, so edges melt first.
- The LFSR order makes snow appear as a sparkle of individual tiles thickening, not a sweeping line. It costs O(tiles/256) per tick and needs one 32-bit state.
- 4 density sprites (or one shader with a 4-step threshold over a dither mask) match a palette-limited look.
- Footprints simply lower a tile's density (or a sub-tile mask), and the same loop refills it while it snows.
- GPL-2.0 means: re-implement the idea; do not copy the code into a closed game.

**Gaps**
- I did not inspect OpenTTD's actual snow sprite art or the transitions between snowy and non-snowy neighbours. OpenTTD draws per-tile sprites with no blending, so a hard tile edge is its look.
- I did not check Simutrans, Freeciv or Widelands snow rendering.

## Q8. Dithering & palettes

**Cited findings**
- Lospec "winter" tag lists 24 palettes, including:
  - Winter Wonderland: 8 colours, 7,195 downloads
  - Wintercode: 36 colours
  - Snowflake 4: 4 colours
  - Ski resort gb: 4 colours
  - Snowfall: 19 colours
  - Logcabin: 11 colours

  No licence is stated on the tag page. https://lospec.com/palette-list/tag/winter (also https://lospec.com/palette-list/tag/ice)
- N0cturneDev/Bayer-Dithering-Shader is CC-BY-4.0. https://github.com/N0cturneDev/Bayer-Dithering-Shader

**Inference:** Snow density 0..1 → compare against the 4×4 Bayer threshold → pick snow or ground colour. This gives 17 apparent levels from 2 palette colours. Pair it with a 4-colour ramp: shadow-blue, mid, white, sparkle.

**Gaps:** I did not fetch a canonical Bayer-matrix page; the matrix itself is standard public math.

---

## Sources
- OpenTTD: https://github.com/OpenTTD/OpenTTD ; clear_cmd.cpp, landscape.cpp, landscape.h, tree_cmd.cpp, COPYING.md (raw.githubusercontent, master, 2026-11-08) ; https://docs.openttd.org/source/df/d9b/group__SnowLineGroup
- Just snow: https://www.shadertoy.com/view/ldsGDn ; https://github.com/libretro/glsl-shaders/blob/master/borders/resources/snow.glsl ; https://github.com/hackrdotsh/ghostty-shaders/blob/main/just-snow.glsl ; https://github.com/grigM/ISF-shaders-collection
- godotshaders: https://godotshaders.com/shader-tag/snow ; https://godotshaders.com/shader/let-it-snow/ ; https://godotshaders.com/shader/multilayer-snowfall-shader/ ; https://godotshaders.com/shader/rain-and-snow-with-parallax-scrolling-effect/ ; https://godotshaders.com/shader/car-tracks-on-snow-or-sand-using-viewport-textures-and-particles/
- Godot: https://docs.godotengine.org/en/4.7/tutorials/rendering/drawable_textures.html ; https://docs.godotengine.org/en/4.7/classes/class_drawabletexture2d.html ; https://github.com/Flynsarmy/gd-snow-project ; https://godotengine.org/asset-library/asset/897 ; https://godotengine.org/asset-library/asset/edit/23531 ; https://godotengine.org/asset-library/asset/5495
- Falling sand: https://github.com/MaxBittker/sandspiel ; https://maxbittker.com/making-sandspiel ; https://github.com/The-Powder-Toy/The-Powder-Toy/blob/master/src/simulation/elements/SNOW.cpp ; https://github.com/R74nCom/sandboxels ; https://github.com/kiwijuice56/sand-slide ; https://github.com/PieKing1215/FallingSandSurvival ; https://github.com/Clocktown/Godot-Falling-Sand-Compute-Shader
- Trails: https://80.lv/articles/using-rendertexture-painting-shader ; https://www.patreon.com/posts/interactive-snow-25641162 ; https://www.kodeco.com/5760-creating-snow-trails-in-unreal-engine-4 ; https://github.com/jjacobson/Realtime-Snow ; https://github.com/krjemelikk/SnowShader ; https://github.com/mert-dev-acc/SnowShaderGraph ; https://github.com/nkihrk/SnowTrail ; https://github.com/Noniv/snowflow_demo
- PICO-8: https://www.lexaloffle.com/bbs?tid=36368 ; https://mboffin.itch.io/pico-8-particles
- Doom fire: https://github.com/filipedeschamps/doom-fire-algorithm ; https://github.com/fabiensanglard/DoomFirePSX ; https://fabiensanglard.net/doom_fire_psx/
- Palettes/dither: https://lospec.com/palette-list/tag/winter ; https://github.com/N0cturneDev/Bayer-Dithering-Shader
- Repo metrics: GitHub search API (`search/repositories?q=repo:…`), queried 2026-11-08.
