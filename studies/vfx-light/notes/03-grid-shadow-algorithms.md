# 03 — Grid / pixel light and shadow ALGORITHMS (top-down 2D)

Researcher angle: algorithms, pseudocode, costs, parameters. Target: Godot 4 Compatibility (WebGL2), top-down 3/4 pixel art (Asterion Online, Tibia-like).
Date: 2026-11-09. ~38 tool calls.

Access notes: albertford.com/shadowcasting, adammil.net (Milazzo FOV comparison), minecraft.wiki and archived seedofandromeda.com were **blocked by the session allowlist** (not by the sites). Used mirrors: wiki.ronlab.site Minecraft wiki snapshot (2025-11), RogueBasin, arXiv, docs.rs, mintlify docs of an MC clone, Godot docs/engine source on raw.githubusercontent.com. Where I state things about Ford/Milazzo from memory this is flagged **[recall, verify]**.

---

## 1. Tile light propagation (Minecraft / Terraria / Starbound style)

### Takeaway
- The cheapest "real" tile light for a top-down grid is **integer BFS flood fill with level − 1 per step** (Minecraft). A level-L source in 2D touches `2L² − 2L + 1` tiles (diamond, taxicab). For L = 8 that is 113 tiles; L = 14 → 365 tiles. Trivial in GDScript if updated only when lights/walls change.
- Removal needs the **two-queue "unlight" BFS**: zero out what the removed source could have lit, collect brighter border cells as re-seeds, then re-run the add BFS.
- **Coloured light** = run the same BFS per channel (R,G,B 4-bit each), raising a channel only if it gains ≥ 1. Combine sky and block light with `max`, not add.
- Terraria instead uses **float RGB per tile with multiplicative decay** (≈ ×0.91 per air tile, ≈ ×0.56 per solid tile — inferred, see below) and renders interpolated (Color/White modes) or blocky per tile (Retro/Trippy). Multiplicative decay looks smoother/rounder than −1 per tile.

### Cited findings
- Minecraft: 16 light levels 0–15; client light = `max(sky light, block light)`; block light "spreads by flood fill and drops by 1 per block of taxicab distance". A level-14 floor torch gives 13 to the 4 orthogonal neighbours and 12 to the diagonals. Source: https://wiki.ronlab.site/content/minecraftwiki_en_all_maxi_2025-11/Light
- Sky light: exposed = 15; light going straight down through transparent blocks stays 15, sideways/up drops 1; water/ice/leaves etc. reduce sky light by 1 (Java). Same source.
- Sky light value is not reduced at night; instead an "internal sky light" maps 15 → 15 at clear noon, 12 in rain, 10 in thunderstorm, 4 at midnight; for s < 15 use `L − (15 − s)`. Same source. (=> day/night is a **global remap**, not a re-flood. Very cheap.)
- Brightness curve: since Alpha "each level 80% as bright as the one above" (geometric, i.e. 0.8^(15−L)); lightmap moved to a shader in 1.21.2 (24w33a). Full daylight ≈98% luma, night ≈17%, full darkness ≈5% ("Moody"). Same source.
- Emission examples (same source): beacon 15, lit furnace 13, 3 candles 9, 2 candles 6, 1 candle 3, enchanting table 7, amethyst cluster 5, brewing stand 1. (Torch = 14 per the propagation example above.)
- Smooth lighting AO per vertex: `vertexAO = 3 − (side1 + side2 + corner)`. Same source.
- Storage: Minecraft 1 byte/voxel (4 bits sky + 4 bits block); Seed of Andromeda 2 bytes (4 bits each R,G,B,sky); 0fps uses word-level parallelism (`wlpMax`, `wlpDec` saturating decrement on packed 4-bit channels) to do all channels in one integer op. https://0fps.net/2018/02/21/voxel-lighting/
- Add-BFS rule from an MC clone: for each of the neighbours `n`, if not opaque and `light(n) + 2 <= level`, set `light(n) = level − 1` and enqueue; budget `LIGHT_STEPS_PER_TICK = 2048` steps per tick so work spreads over frames. Removal = `decrease_light(p)`: read old level, set 0, push to a decrease queue, `propagate_decrease()`, then `propagate_increase()`. Sky light: downward decay 0 through air/glass. https://www.mintlify.com/dwnmf/MC_CPP/rendering/lighting
- Coloured BFS (gist): per channel, skip if `light[c] + 2 > src[c]`, else `light[c] = src[c] − 1`; enqueue if any channel changed. https://gist.github.com/JuanDiegoMontoya/383bf2cc2ad3d1b8717a42b1f0bc6a7b
- WAVE (WebGL voxel engine): incremental cellular-automaton update that "works even if we both increase and decrease light values"; porting core to C++/WASM gave a "2x-5x speedup". https://reddit.rtrace.io/r/VoxelGameDev/comments/112lh1g/smooth_dynamic_lighting_in_webassembly
- SFML tile lighting tutorial: per-tile colour + intensity + `absorb`; diagonals get colour ×0.9; bucket lists per intensity level processed high→low instead of recursion; render one quad per tile with vertex colours and multiply blend (GPU interpolation gives smoothing). https://github.com/SFML/SFML/wiki/Tutorial:-Dynamic-colorful-tile-based-lighting
- Terraria lighting modes: Color (new engine, sub-tile smooth, High cost), White (Mid–High), Trippy (old engine, per-tile blocky, colour, Medium; mobile default), Retro (old/white, Low). New engine introduced in 1.1. Retro/Trippy spread light so sources are "effectively stronger". https://terraria.wiki.gg/wiki/lighting_mode
- Terraria torch: colour #FFF2CC (≈1.0, 0.95, 0.8); range 42 tiles in air, 7 in solids, 47 in water, 10 in honey. https://terraria.wiki.gg/wiki/Light_sources

### Inferences (mine)
- **Terraria decay factors check out against the wiki radii**: with a visibility cut-off ≈ 0.0185, 0.91^42 ≈ 0.019 (air), 0.56^7 ≈ 0.017 (solid), 0.67^10 ≈ 0.018 (honey). So decay ≈ 0.91/tile air and ≈ 0.56/tile solid is consistent (these constants are widely quoted from decompiled `LightDecayThroughAir/Solid`; I could not fetch the decompiled source to confirm). Implementation pattern (widely described for Terraria-like engines, not verified here): seed array with sources, then do **4 directional sweeps** (L→R, R→L, T→B, B→T), each `cell = max(cell, prev * decay(cell))`; repeat 1–2 times. Cost = 4·W·H multiply-max per pass, independent of light count — great for many lights (e.g. 60×40 viewport tiles = 2,400 cells → ~10k ops/pass).
- Pseudocode (2D, integer, one channel; run ×3 for RGB):
  ```
  add(seed, lvl): set L[seed]=lvl; Q.push(seed)
    while Q: p=Q.pop(); for n in N4(p):
        nl = L[p] - cost(n)          # cost: 1 air, 2-3 for foliage/glass, 16 = opaque
        if nl > L[n]: L[n]=nl; Q.push(n)
  remove(seed):
    R.push((seed, L[seed])); L[seed]=0
    while R: (p,v)=R.pop(); for n in N4(p):
        if L[n]!=0 and L[n] < v: R.push((n,L[n])); L[n]=0     # was lit by us
        elif L[n] >= v: Q.push(n)                             # independent source / brighter path: re-seed
    run add-loop on Q (re-emit remaining sources inside the cleared area too)
  ```
  (This is the Seed of Andromeda formulation as I recall it; the SoA article itself was unreachable.)
- Using **taxicab −1** gives diamond-shaped pools. For rounder pools on a top-down map either (a) use N8 with diagonal cost √2 (store levels ×2 or ×10 to stay integer), or (b) use multiplicative decay (Terraria), or (c) render the tile light texture with bilinear filtering (Terraria "Color").
- For a Tibia-like map, tile light can live in a **1-byte-per-channel Image** (W×H, e.g. 64×48 around the camera), uploaded with `ImageTexture.update()` only when dirty, sampled in a canvas shader with bilinear + optional posterize. Day/night = global remap (Minecraft internal sky light) → zero re-flood.
- Starbound: no primary source found in budget (gap). Commonly described as Terraria-like but with smoother, coloured, shader-blurred light maps.

### Gaps
- Decompiled Terraria constants and pass count not verified from source. Starbound algorithm not documented. No ms timings for MC/Terraria lighting in JS/GDScript.

---

## 2. Grid FOV / shadowcasting (roguelike LOS used as light radius)

### Takeaway
- **Recursive shadowcasting (Bergström 2001)** is the default: fastest indoors, simple, visits only lit cells + blockers. **Symmetric shadowcasting (Albert Ford)** is the modern recommendation when "if I see you, you see me" matters (stealth, monsters, MMO fairness). Basic raycasting is surprisingly fast outdoors but artefact-prone.
- Light radius = FOV from the light position clipped to radius r, then intensity by distance. Per light per update, at r ≤ 10 this is ≤ ~350 cells → microseconds in C, well under 0.1 ms even in GDScript (inference).

### Cited findings
- Bergström (2001): 8 octants; per row, start slope 1 → end slope 0; on hitting a blocker, recurse one row further with end slope brushing the blocker edge; only visits "non blocking and blocking cells, leaving out the cells in shadow"; "especially fast in confined areas". https://roguebasin.com/index.php/FOV_using_recursive_shadowcasting
- RogueBasin FOV index lists: light whole level, light whole room (original Rogue), FastLOS (precomputed bitwise AND), ray casting, shadow casting, Restrictive Precise Angle Shadowcasting, Permissive FOV, Digital FOV, Milazzo's algorithm; per-square LOS is "a slow method". https://roguebasin.com/index.php/FOV
- Jice's comparative study (libtcod, 2009) — µs per computation:
  - Empty map 100×100: Shadow 383, Basic ray 589, Diamond 925, Digital 3,958. 20×20: Shadow 30, Basic 35, Diamond 58, Digital 166.
  - Outdoor 100×100: Basic 242, Shadow 309, Digital 4,255. Indoor 80×80: Shadow 38, Basic 93, Diamond 130, Digital 440.
  - Symmetry error (indoor/outdoor %): Basic 0.75/4.4, Shadow 0.93/6.9, Diamond 0.82/6.5, Permissive-0 2.14/10.95, Permissive-8 0/0, Digital 0/0.
  - Basic and shadowcasting give triangular pillar shadows and no corner peeking; diamond/digital give a single-line shadow behind pillars ("problem for stealth").
  https://roguebasin.com/index.php/Comparative_study_of_field_of_view_algorithms_for_2D_grid_based_worlds
- Debenham & Solis-Oba (2020): Recursive Shadowcasting is the "best-performing existing" and most popular; its cost grows with visible cells; on 4096² grids RS took 6.7–46 ms; their incremental "FOV Update" (reuse previous FOV when the viewer moves 1 cell) 0.36–1.9 ms; RS recommended for ≤ 512×512 grids or enclosed maps. https://arxiv.org/pdf/2101.11002
- Godot asset: "Godot FOV algorithms for roguelikes" (itch) exists as a ready reference. https://aikoncwd.itch.io/godot-fov-algorithms-for-roguelikes
- Symmetric shadowcasting ports: Rust crate https://lib.rs/crates/symmetric-shadowcasting , Zig https://github.com/nsmryan/zig_shadowcasting

### [recall, verify] Albert Ford, "Symmetric Shadowcasting" (2021), https://www.albertford.com/shadowcasting/ (blocked here)
- Floor tile visible iff its **centre** lies in the unobstructed sector; wall tile visible if any part is — gives symmetry + "expansive walls" (whole lit wall visible from inside a room), expanding pillar shadows, no blind corners. Uses exact rational slopes (Fraction), per-quadrant row scanning with `round_ties_up(depth*start_slope)` / `round_ties_down(depth*end_slope)` and an `is_symmetric(row, tile)` check. ~70 lines of Python.
- Milazzo's comparison (http://www.adammil.net/blog/v125_Roguelike_Vision_Algorithms.html, blocked) compares Bresenham ray casting, shadow casting, diamond walls, permissive and his beveled-wall algorithm on symmetry, artefacts and speed; his conclusion (as I recall) is that shadowcasting is fastest and his own gives best gameplay with moderate cost.

### Inferences
- For a top-down RPG with lights, run FOV **per light only when the light moves tile or the map changes**; cache the lit set. Player FOV each step. A static torch costs nothing per frame.
- To get light+LOS composite (Red Blob style, below): `lit_visible = union(light_i ∩ FOV_light_i) ∩ FOV_player`.
- Pixel-level smoothness: write FOV result into the same low-res light Image (1 texel/tile) and bilinear-filter; looks like soft shadow edges for free.

### Gaps
- Could not fetch Ford/Milazzo pages to verify wording and Milazzo's timing table.

---

## 3. Visibility polygons, 2D shadow volumes, 1D shadow maps, SDF soft shadows

### Takeaway
- **Angle-sweep visibility polygon** (Red Blob / Nicky Case) per light: O(n log n) in segment count; output triangles; CPU-side, good for few lights with large radius. Soft edges: blur, or jitter light origin N times (Case used 11).
- **1D (polar) shadow map** per light is what Godot's own 2D shadows are: each light renders occluder edges into a **2-px-tall row of the 2D shadow atlas** (4 × 90° frusta), then the light shader tests distance-at-angle. PCF5/PCF13 = 5/13 taps along that row.
- **SDF raymarch soft shadows** (IQ `res = min(res, k*h/t)`) are possible from Godot's built-in 2D SDF (generated from LightOccluder2D) — and the docs recommend that route for finite-length directional shadows.

### Cited findings
- Red Blob 2D visibility: sweep endpoints "sorted by angle", maintain set of open walls, emit a triangle whenever the nearest wall changes; run once per light, combine into light map (demo 24 lights); limit with circle/gradient/cone; hard shadows need post-process for softness. AND = bitmap multiply, OR = add with clamp on GPU. Author calls his implementation "mediocre"; a CGAL algorithm measured "50X faster". Suggests subtractive per-segment shadow quads, lower-res light bitmaps and 1D shadow maps if CPU-bound. https://www.redblobgames.com/articles/visibility/
- Nicky Case Sight & Light: cast rays only to each unique segment endpoint plus two rays at ±0.00001 rad; parametric ray–segment intersection (T1 > 0, 0 < T2 < 1); sort hits by angle; fuzzy shadows from 11 offset origins ("11 visibility polygons!"). https://ncase.me/sight-and-light/
- mattdesl "2D Pixel Perfect Shadows": per light 3 passes — (1) 256×256 occluder FBO (alpha), (2) polar reduce into a 256×1 shadow map (256 rays × up to 256 steps ≈ 65k samples, alpha threshold 0.75), (3) draw 256×256 light quad, lit if r < stored distance; 9-tap Gaussian blur whose width grows with distance (penumbra grows away from light). ~20 lights before fill-rate bound on a GeForce 9400; "performs poorly on Android". Inspired by Catalin Zima. https://github.com/mattdesl/lwjgl-basics/wiki/2D-Pixel-Perfect-Shadows
- Geometry-based 1D shadow map (Unity): one row per light, 0–540° to avoid wrap splits, z-test writes nearest distance; 64 shadow-casting lights in a ~1024×64 map; budget "a couple of milliseconds" (no measured timings); no PCF due to wrap branching, suggests ESM + horizontal blur. https://gamedeveloper.com/programming/fast-2d-shadows-in-unity-using-1d-shadow-mapping
- IQ soft shadows: `res = min(res, k*h/t)`, k controls hardness (renders shown at k = 2, 8, 32, 128); hit when `h < 0.001`; "one division per marching point"; improved Aaltonen variant reduces banding/leaks: `y = h*h/(2*ph); d = sqrt(h*h − y*y); res = min(res, k*d/max(0, t−y))`. https://iquilezles.org/articles/rmshadows
- Godot 4 2D lights docs (source rst): shadow Filter None is fastest and "well suited for games with a pixel art aesthetic"; PCF5 soft; PCF13 "should only be used for a few lights at once"; Filter Smooth too high → banding/streaks; LightOccluder2D "SDF Collision" feeds a real-time 2D SDF usable in shaders at no cost if unused; DirectionalLight2D shadows "always appear to be infinitely long" → use the SDF in a custom shader for finite ones; light/shadows computed at **viewport resolution**, so pixel-art needs snapping `LIGHT_VERTEX`/`SHADOW_VERTEX` with `floor()`; **additive Sprite2D "lights" are much faster** (no separate pipeline) but cannot light fully dark areas correctly, cast no shadows, ignore normal maps. https://raw.githubusercontent.com/godotengine/godot-docs/master/tutorials/2d/2d_lights_and_shadows.rst (rendered: https://docs.godotengine.org/en/4.5/tutorials/2d/2d_lights_and_shadows.html)
- Godot project settings: `rendering/2d/shadow_atlas/size` = 2048; `rendering/2d/sdf/scale` = 1, `sdf/oversize` = 1. https://raw.githubusercontent.com/godotengine/godot-docs/master/classes/class_projectsettings.rst
- Godot GLES3 (Compatibility) source: `MAX_LIGHTS_PER_ITEM = 16`, `max_lights_per_render = 256` (64 if max UBO < 64 KB); each shadowed light occupies rows `index*2 .. +2` of an atlas `shadow_texture_size × (max_lights_per_render*2)`; occluders drawn with 4 viewports of width size/4 using 90° frusta; PCF5/PCF13 are 5/13 taps along the row. https://raw.githubusercontent.com/godotengine/godot/master/drivers/gles3/rasterizer_canvas_gles3.cpp , .../rasterizer_canvas_gles3.h , .../shaders/canvas.glsl

### Inferences
- With shadow atlas 2048, each 90° quadrant gets 512 texels → angular resolution ≈ 0.18°/texel; for a 6-tile (96 px) radius pixel-art light that is far finer than a pixel, so you can **drop atlas to 512–1024** on web without visible loss.
- For a tile world, occluders are just **merged tile-edge segments** (greedy-merge runs of wall edges) → few hundred segments; CPU angle sweep in GDScript is feasible for 1–4 lights; beyond that prefer Godot PointLight2D shadows (GPU) or tile-FOV light.
- "Shadow volume" 2D: for each occluder edge facing away from the light, emit quad (a, b, a + (a−L)·big, b + (b−L)·big) drawn black into the light's mask — O(edges) vertices, no sort; penumbra wedges = add a gradient quad at each silhouette vertex. Cheaper than sweep on GPU.

### Gaps
- No measured Godot 2D light ms on WebGL2; need an in-project benchmark.

---

## 4. Sun shadows for sprites in top-down 3/4

### Takeaway
- Three proven tiers: **blob/ellipse** (cheapest, any angle), **rotated/stretched shadow sprite** (Graveyard Keeper: 1 sun + up to 3 lights per object), **sheared silhouette** (draw sprite again in black, shear by sun azimuth, scale by `cot(elevation)`), and **height-map raymarch** shaders for buildings.
- Shadow length from height h: `len = h · cot(elev) = h / tan(elev)` → 60° = 0.58h, 45° = 1h, 30° = 1.73h, 15° = 3.7h, 5° = 11.4h (math). Clamp to ≤ ~2–3h and fade alpha as elevation → 0 (golden hour) to avoid absurd lengths.

### Cited findings
- Graveyard Keeper: shadows are sprites rotated around a pivot in the vertex shader (skew tried, "unnecessary"); per object up to 4 shadows (sun + 3 nearest lights found each Update); ~10 shared shadow sprites; per-frame math is heavy; fences look poor. Day/night: 10 artist-made LUTs (night, twilight, evening…) on a 2D-strip 3D LUT; ambient dims and turns blue at nightfall. https://slava.lazybeargames.com/graveyard-keeper-how-the-graphics-effects-are-made
- Godot "2D top down oblique shadow": per-pixel march toward the sun over a height map, `sun_dir.xy` = direction, `sun_dir.z` = height (larger z → shorter), `steps` capped at 96, smoothstep soft edge, early exit. https://godotshaders.com/shader/2d-top-down-oblique-shadow/
- Godot "2D Top-Down Shadows (Tilemap Ready)": marches along `shadowAngle` sampling top/left wall masks; defaults ≈45 iterations × 2 texture reads per pixel; `wallHeight`/`wallDepth` set length. https://godotshaders.com/shader/2d-top-down-shadows-tilemap-ready/
- Godot DirectionalLight2D shadows are infinite-length (see §3) → not suitable for sun shadows as-is.

### Inferences (pseudocode)
```
# sheared silhouette shadow (vertex shader on a copy of the sprite, pivot at feet)
k   = clamp(1/tan(elev), 0, 3)               # length per unit height
dir = vec2(-sin(az), cos(az)) * 0.5          # 0.5 = top-down y-squash of 3/4 view
VERTEX.xy = feet + vec2(dir.x, dir.y) * (feet.y - VERTEX.y) * k + vec2(VERTEX.x - feet.x, 0)
COLOR = vec4(shadow_tint.rgb, shadow_alpha * smoothstep(2°, 12°, elev))
```
- Buildings: extrude the **footprint rectangle** along `dir*k*wall_height` (polygon = footprint ∪ translated footprint, convex hull) → one Polygon2D per building, rebuilt when sun moves (every N game minutes). Trees: ellipse at `offset = dir*k*trunk_h` plus canopy blob (reuse forest study shade ellipses).
- Quantise sun direction to 8 or 16 steps over the day to keep pixel-art shadows stable (avoid swimming), or bake 4–6 shadow layers (morning/noon/afternoon/evening) and cross-fade.

---

## 5. Falloff and quantisation

### Takeaway
- Physically 1/d² looks too hot near the source and too dark far away for small 2D radii; games use linear, smoothstep, or geometric per-tile (Minecraft 0.8^n, Terraria 0.91^n). For pixel art, **posterize to 3–5 bands** or **Bayer-dither between bands** (see Snow study #1). Combine lights with **max** (Minecraft, no blow-out) or **add + clamp** (Red Blob OR); tile then indexes a **palette ramp LUT**.

### Cited findings
- Minecraft: brightness geometric, each level 80% of the one above; combine `max(sky, block)`. https://wiki.ronlab.site/content/minecraftwiki_en_all_maxi_2025-11/Light
- Red Blob: union of lights = add with clamp, intersection = multiply. https://www.redblobgames.com/articles/visibility/
- Graveyard Keeper: 10 time-of-day LUTs as global grade. https://slava.lazybeargames.com/graveyard-keeper-how-the-graphics-effects-are-made
- Godot: Light2D blend Add (default), Subtract (negative lights), Mix. Godot docs rst above.
- Previous studies (#1 Snow palette lighting + dithered lamp pools; #2 Acid palette select) already document Bayer and COLORMAP paths: https://kingsfoil-artifacts.netlify.app/vfx-snow-topdown-pixel

### Inferences (formulas)
```
t      = clamp(1 - d/r, 0, 1)
linear = t ; smooth = t*t*(3-2t) ; quadish = t*t ; geom = pow(0.8, (1-t)*15)
banded = floor(smooth*N + bayer4x4(px)/16) / N          # N=4 bands, dithered edges
light  = max(ambient, max_i(light_i))   OR   min(1, ambient + Σ light_i)
colour = rampLUT[ palette_index ][ round(light*7) ]     # 8-step ramp per base colour
```
- Tibia-like light *level* (integer 0–10ish) maps naturally to "radius in tiles = level" + banded falloff.

---

## 6. Flicker models

### Takeaway
- Quake/Half-Life **lightstyle strings** (10 samples/s, 'a'–'z') are the canonical cheap flicker and still used in Half-Life: Alyx. Real flame oscillation is ~10–12 Hz but only in groups of ≥ 3 flames; a single still candle is steady — so game "candle" = slow, low-amplitude wobble; "torch/campfire" = faster, deeper noise; "electric" = mostly-on with random drop-outs; "magic" = sine pulse.

### Cited findings
- Quake lightstyles: 'a' darkness, 'm' normal, 'z' ≈ double; `i = (int)(cl.time*10)` → 10 chars/s, looped; value `(letter − 'a') * 22` (m = 264 ≈ 256 normal). Examples: fluorescent flicker `mmamammmmammamamaaamammma`, candle `mmmmmaaaaammmmmaaaaaabcdefgabcdefg`, slow strong pulse `abcdefghijklmnopqrstuvwxyzyxwvutsrqponmlkjihgfedcba`, fast strobe `mamamamamama`. Presets compiled by John Romero 1993; code reused through Half-Life: Alyx. https://www.alanzucconi.com/2021/06/15/valve-flickering-lights/
- Candle bundles: oscillation starts at 3 candles; "10–12 Hz" range, decreasing with count (6 candles ≈ 10.7–11.0 Hz); single candle "does not exhibit visible oscillation". https://pmc.ncbi.nlm.nih.gov/articles/PMC6344522/

### Inferences (parameters to try)
```
candle  : I = 1 - 0.08*noise1(t*2.5)   + 0.03*noise1(t*9)    ; radius ±0.3 px
torch   : I = 1 - 0.18*abs(noise1(t*6)) - 0.07*noise1(t*11) ; radius ±1 px, hue shift toward red when dim
campfire: torch amp ×1.3 + occasional "pop" (+20% for 80 ms, p=0.5/s)
electric: I = (rand() < 0.03 per frame) ? 0.1 : 1.0, bursts of 2–5 blips
magic   : I = 0.85 + 0.15*sin(TAU*0.5*t + phase_per_light)
```
- Pixel-art: quantise flicker to the light's band count and update at 8–12 Hz (not every frame) so pools "step" like hand animation; give each light a random phase/seed.

---

## 7. Interiors: door/window spill, roof cutaway, indoor/outdoor ambient

### Takeaway (mostly inference; no primary sources fetched in budget — gap)
- Tag each tile with a **room/area id** by flood fill at map load (walls/doors as boundaries). Ambient per area: outdoor tiles follow the sun curve; indoor tiles use a fixed dim ambient + interior lights. Light BFS (§1) naturally spills through open doorways (door tile cost 1 when open, opaque when closed) and windows (cost 2–3, tinted) — this gives correct "light pool on the floor outside the door" with zero extra work.
- **Roof cutaway**: when the player's tile area id is an interior, fade the roof TileMap layer of that building (alpha 1 → 0 over ~0.2 s), optionally darken everything outside the building's area mask. Tibia-style multi-floor: hide all floors above the player's z when standing under a roof (Tibia behaviour, not verified here).
- Windows at night: emissive window tiles + a short rectangular/cone light texture projected outward (PointLight2D with a trapezoid texture, or an additive sprite).

### Cited (related)
- OpenTibia world light: `LIGHT_LEVEL_DAY = 250`, `LIGHT_LEVEL_NIGHT = 40`, `SUNRISE = 430`, `SUNSET = 1305` (minutes of a 1440 day), ramp `(250−40)/30 = 7` per tick during transitions; world light colour byte `0xD7` (215); single brightness, no per-phase colour. https://otland.net/threads/world-light-colors.271815/
- World light cannot be changed from Lua, only creature light via `doSetCreatureLight`. https://otland.net/threads/world-light.103661/

---

## 8. Performance numbers (summary)

| Technique | Number | Source |
|---|---|---|
| Recursive shadowcasting, 20×20 empty | 30 µs (2009 HW, C) | RogueBasin comparative study |
| Recursive shadowcasting, indoor 80×80 | 38 µs | same |
| Basic raycast, outdoor 100×100 | 242 µs | same |
| RS on 4096² grids | 6.7–46 ms; FOV Update 0.36–1.9 ms | arXiv 2101.11002 |
| mattdesl 1D shadow map | ~20 lights before fill-rate bound (GeForce 9400); 256×256 + 256×1 FBOs/light | mattdesl wiki |
| Unity geometry 1D shadow map | 64 lights in ~1024×64 texture, "couple of ms" budget (no measurement) | gamedeveloper.com |
| Godot GLES3 2D | 16 lights/item, 256 lights/render (64 on small-UBO GPUs), atlas 2048 | Godot source |
| Godot PCF | None/PCF5/PCF13 = 1/5/13 taps; PCF13 "only for a few lights" | Godot docs |
| MC-style BFS budget | 2048 steps/tick | MC_CPP docs |
| WASM vs JS (voxel light) | 2–5× speedup | WAVE post |

Inferred budgets: tile BFS L=8 → 113 cells/light (2D), 20 lights ≈ 2,300 cell visits per full rebuild — sub-millisecond even in GDScript (est. 0.2–0.5 µs/visit → ~1 ms worst case; **measure**). Terraria-style sweep on a 64×48 window = 3,072 cells × 4 sweeps ≈ 12k ops/pass, independent of light count.

## Recommendation sketch for Asterion (inference)
1. Tile light map (1 texel/tile, RGB8) via integer BFS with per-tile cost, max-combined, dirty-rect updates → `ImageTexture`; canvas shader samples bilinear, posterizes to 4 bands with Bayer dither, indexes palette ramp. Day/night = global ambient curve (OT values 40–250 / 255) + LUT.
2. Player FOV = symmetric shadowcasting on tiles (also drives fog of war).
3. Sun shadows = sheared silhouettes / footprint extrusion polygons, sun direction quantised to 16 steps.
4. Godot PointLight2D shadows only for 1–3 hero lights (player torch), Filter None, pixel-snapped; additive sprites for everything decorative.
5. Flicker via lightstyle-like strings or 1D noise at 10 Hz, quantised.

## Gaps (honest)
- Albert Ford / Adam Milazzo / minecraft.wiki / SoA pages blocked by allowlist → some details from recall.
- Terraria internals (pass count, constants) inferred from wiki radii, not source. Starbound undocumented.
- No sources fetched for roof cutaway / interior spill techniques in shipped games; no Godot WebGL2 2D-light ms benchmarks.
- No primary source for Tibia client light-radius rendering.

## Sources
- https://wiki.ronlab.site/content/minecraftwiki_en_all_maxi_2025-11/Light (Minecraft wiki snapshot 2025-11)
- https://0fps.net/2018/02/21/voxel-lighting/
- https://www.mintlify.com/dwnmf/MC_CPP/rendering/lighting
- https://gist.github.com/JuanDiegoMontoya/383bf2cc2ad3d1b8717a42b1f0bc6a7b
- https://reddit.rtrace.io/r/VoxelGameDev/comments/112lh1g/smooth_dynamic_lighting_in_webassembly
- https://github.com/SFML/SFML/wiki/Tutorial:-Dynamic-colorful-tile-based-lighting
- https://terraria.wiki.gg/wiki/lighting_mode
- https://terraria.wiki.gg/wiki/Light_sources
- https://roguebasin.com/index.php/FOV
- https://roguebasin.com/index.php/FOV_using_recursive_shadowcasting
- https://roguebasin.com/index.php/Comparative_study_of_field_of_view_algorithms_for_2D_grid_based_worlds
- https://arxiv.org/pdf/2101.11002
- https://www.albertford.com/shadowcasting/ (blocked; recall)
- http://www.adammil.net/blog/v125_Roguelike_Vision_Algorithms.html (blocked; recall)
- https://lib.rs/crates/symmetric-shadowcasting ; https://github.com/nsmryan/zig_shadowcasting
- https://aikoncwd.itch.io/godot-fov-algorithms-for-roguelikes
- https://www.redblobgames.com/articles/visibility/
- https://ncase.me/sight-and-light/
- https://github.com/mattdesl/lwjgl-basics/wiki/2D-Pixel-Perfect-Shadows
- https://gamedeveloper.com/programming/fast-2d-shadows-in-unity-using-1d-shadow-mapping
- https://iquilezles.org/articles/rmshadows
- https://docs.godotengine.org/en/4.5/tutorials/2d/2d_lights_and_shadows.html (via raw rst on GitHub)
- https://raw.githubusercontent.com/godotengine/godot-docs/master/classes/class_projectsettings.rst
- https://raw.githubusercontent.com/godotengine/godot/master/drivers/gles3/rasterizer_canvas_gles3.cpp (+ .h, shaders/canvas.glsl)
- https://slava.lazybeargames.com/graveyard-keeper-how-the-graphics-effects-are-made
- https://godotshaders.com/shader/2d-top-down-oblique-shadow/
- https://godotshaders.com/shader/2d-top-down-shadows-tilemap-ready/
- https://www.alanzucconi.com/2021/06/15/valve-flickering-lights/
- https://pmc.ncbi.nlm.nih.gov/articles/PMC6344522/
- https://otland.net/threads/world-light-colors.271815/
- https://otland.net/threads/world-light.103661/
