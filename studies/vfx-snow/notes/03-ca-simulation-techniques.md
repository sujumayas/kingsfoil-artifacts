# 03 — Grid / cellular-automaton techniques for top-down pixel snow

Researcher angle: the "Doom-fire family", meaning tiny per-cell rules over a low-res buffer. This file covers falling-sand CAs, heightmap snow (deposit, avalanche, wind, footprints), exposure maps, melting, pixel rendering, and performance.
Convention: **[C]** = cited finding (URL given). **[I]** = my inference or design proposal, not from a source.

---

## 0. Executive summary (top 6 ideas)

1. **Top-down snow is a heightmap, not a sand game.** Falling-sand rules (Noita, Sandspiel, Powder Toy) assume in-plane gravity. In top-down view, gravity points into the screen. The matching CA is a **per-pixel snow-depth field `d[x,y]` (u8)** with sandpile or thermal-erosion "talus" relaxation in place of "fall down". [I, grounded in the sources in §1–2]
2. **Thermal erosion / talus rule** (Musgrave-style, used in terrain generation): if `d[p] - d[n] > T`, move `c*(diff - T)` to the lower neighbour(s). It runs in 4–8 neighbour reads per cell. This one rule gives footprint rims, smoothed plow berms and drifts that settle naturally. [C §2]
3. **Werner 1995 dune CA** is the best-documented "wind drift" CA. Slabs hop `l = 5` cells downwind, land with p = 0.6 on sand and 0.4 on bare ground, and always stick inside a **15° shadow zone** behind any bump. Avalanching uses a **30° repose angle**. Each part maps directly to "drifts on the lee side of walls". [C §3]
4. **Exposure map, precomputed once.** For each cell, march N cells upwind and toward the sky. If you hit an occluder (roof, tree canopy, wall), you get a wind-shadow or sky-occlusion factor in 0..1. Accumulation per tick is `rand() < rate * exposure`. [I, with Benes & Roa 2004 linear wind-shadow ramp as a cited basis §3]
5. **Melt = degree-day model + noise-threshold "dissolve".** `melt/day = DDF * max(0, T - 0)`. Typical snow DDF is **2–6 mm/°C/day** (published range 0.5–20). Sun vs shade can scale DDF (Hock 2003 links higher DDF to more shortwave radiation). Visually, each pixel gets a fixed random threshold, and a pixel shows snow while `d > threshold`. The result is a dissolve with organic "edges-first" holes. [C §5]
6. **Rendering:** quantize `d` to 3–5 palette shades, use a 4×4 Bayer threshold for partial coverage, and add a blue shadow where `d[x,y] - d[x+1,y+1] > k` (2-tap emboss). A 320×180 u8 field is 57,600 cells. Sandspiel ran 90,000 cells (300×300) at 60 fps in Rust/WASM, with rendering under 1 ms. In GDScript, run the field as a GPU ping-pong shader or tick it at 5–15 Hz in strips. [C §7 + I]

---

## 1. Falling-sand CA family: what transfers to snow

### Takeaway
The architecture transfers well: a cell struct of a few bytes, a neighbour-only update function, dirty chunks, a checkerboard for threads, and grain from a per-cell random byte. The "fall down" rule does not transfer to top-down view. For top-down snow, keep the per-cell random byte and the state machine (powder → packed → slush → water → ice), and replace movement with height relaxation.

### Cited findings
- **Noita (Nolla Games; Petri Purho, GDC 2019 "Exploring the Tech and Design of Noita")**, talk page: https://gdcvault.com/play/1025695/Exploring-the-Tech-and-Design. Summary by 80.lv (https://80.lv/articles/noita-a-game-based-on-falling-sand-simulation/):
  - The world is split into **64×64 chunks**. Each chunk keeps a **dirty rect**, and only pixels inside it are iterated.
  - Multithreading runs in **4 rounds in a checker pattern**. Each round updates every other chunk. A pixel may move within its chunk **plus 32 px** in each cardinal direction, so no locks or atomics are needed.
  - Update order is **bottom-up**, so falling columns move coherently.
  - Liquids check down, then left and right, with density swaps. Gas is the inverse. Fire tries random directions, water + fire → steam, and wood burns for a set time.
  - 80.lv gives **no frame-time, pixel-count or thread-count numbers**.
- Noita dev Q&A notes (https://benlau6.github.io/notes/noita): the world streams in **512×512 chunks**, and the game tries to keep **~12 chunks active**. Off-screen areas update only from a list of areas that need it. The simulation runs on the **CPU in a custom C++ engine**, and solid pixel groups are triangulated and passed to Box2D.
- **Sandspiel** (Max Bittker, https://maxbittker.com/making-sandspiel):
  - The simulation is **Rust → WebAssembly**. Rendering is WebGL, and wind is a GPU Navier-Stokes solver adapted from Pavel Dobryakov.
  - The grid was **250×250**, later raised to **300×300**, at 60 fps on the author's machine. The author calls this a mistake because many devices cannot hold 60 fps at that size. The earlier JS prototype "Dust" was 100×100.
  - Each cell is **4 bytes** (`species u8, ra u8, rb u8, clock u8`). The grid is therefore a valid RGBA texture and uploads to the GPU with **no copy**. `ra` is randomly initialized and sets lightness, which produces grain. `clock` prevents double updates.
  - The scan runs left→right, top→bottom. Sand falls straight down if empty, otherwise diagonally with a random left or right.
  - Render cost is **<1 ms of CPU** per frame. The WASM binary is 66–84 KB.
- **Margolus block CA** (https://www.emergentmind.com/margolus-sand): 2×2 blocks update independently, and the partition shifts by (1,1) every other step. Materials are conserved, and when several moves are possible the column tried first is random. It is naturally parallel because no two blocks share cells, which suits the GPU. (Parallelism here is my inference; the page gives no GPU numbers.)
- **Snow and packed snow as states:** Sandboxels' Packed Snow (https://sandboxels.wiki.gg/wiki/Packed_Snow) is a solid that **melts to water at 20 °C**, breaks back into Snow, and has density 400 kg/m³. Its history says "Snow freezes into Packed Snow" (v1.6). The Powder Toy SNOW page (https://powdertoy.co.uk/Wiki/W/Element:SNOW.html) was **blocked by an Anubis bot check**, so its values are not verified.

### Inferences (top-down adaptation)
- **Cell layout, Sandspiel-style, packed into RGBA8** so a Godot `Image` or `ImageTexture` can upload it directly:
  - `R = depth` (0..255; for example 1 unit ≈ 2 mm of snow equivalent)
  - `G = state` (0 bare, 1 powder, 2 packed, 3 slush, 4 ice, 5 wet ground)
  - `B = noise` (fixed random threshold per pixel; never changes)
  - `A = aux` (exposure, or a melt timer)
- No gravity in-plane. Movement happens only through (a) talus relaxation (§2), (b) wind hops (§3) and (c) displacement by feet or plows (§4).
- Borrow Noita's **dirty chunks**. Snow fields are static most of the time, so only chunks touched by feet, plows, an active snowfall front or melt need ticking. Use 32×32 or 64×64 chunks over a 320×180 field (≈ 60 or ≈ 15 chunks).

### Gaps
- No primary Noita perf numbers (pixels/ms) found; the GDC video was not transcribed here.
- Powder Toy SNOW parameters (melting point, conduction) are unverified because the page was blocked.
- The jgallant falling-sand blog was not found in search.

---

## 2. Top-down snow as a heightmap: sandpile and thermal erosion

### Takeaway
Two tiny rules from the literature are enough.
- **Abelian sandpile** (integer, threshold-based) is cheap and order-independent. It is good for "snow piles up, then spills". Its patterns are diamond-shaped and artificial.
- **Thermal erosion / talus** (float or u8, slope-based) gives natural slopes and is the better default.

### Cited findings
- **Abelian sandpile, BTW 1987** (https://en.wikipedia.org/wiki/Abelian_sandpile_model): a site with **≥4 grains topples**. It loses 4, and each of its 4 neighbours gains 1. Grains that leave the grid are lost. Dhar showed the final stable state **does not depend on toppling order**, so updates can run in any order or in parallel. Reference: Bak, Tang & Wiesenfeld, *PRL* 59(4):381–384, 1987.
- **Thermal erosion** (fractal terrain wiki, https://github.com/vrum/fractalterraingeneration/blob/master/wiki/Erosion_Models.wiki): compute each point's slope against its neighbours, and if it exceeds talus **T**, move material until the slope is below T. The author used **T = 4 / map_width** and a **rotated von Neumann** neighbourhood (4 diagonal neighbours). That gave results similar to Moore (8 neighbours) and ran faster. The example uses **4 iterations**. The primary reference is the Oddlabs PDF "terrain_generation.pdf" (Jacob Olsen, "Realtime Procedural Terrain Generation", 2004; author and date per the common citation, not verified on that page).
- CESCG'97 erosion notes (https://old.cescg.org/CESCG97/marak/node11.html): compare the altitude difference to each neighbour against **constant talus T**. Move a constant `c`-scaled amount to **all lower neighbours, each in proportion to its slope**. (The formula itself was only an image.)
- **World Machine Thermal Erosion** (https://help.world-machine.com/topic/device-thermalerosion/): real talus is typically **30–40°**, and lower values "look more like sand or soil".
- **Angle of repose of snow** (Chalmers study, https://research.chalmers.se/en/publication/?id=528014): the angle **increases with temperature** (because of a liquid-like layer on the ice), **increases as grain size decreases**, and decreases with fall height. The page gives no degree values. Werner's dune CA uses **30°** for sand (§3).

### Pseudocode: talus relaxation (classic Musgrave/Olsen form)
```
// d: depth field (float or int), T: talus threshold (in depth units per cell), c ≈ 0.5
for each cell p (dirty chunks only):
    dmax = 0; dtotal = 0
    for n in N4(p) (or rotated-N4 diagonals):
        di = d[p] - d[n]
        if di > T: dtotal += di; dmax = max(dmax, di)
    if dtotal == 0: continue
    move = c * (dmax - T)
    for n in N4(p):
        di = d[p] - d[n]
        if di > T: d[n] += move * di / dtotal   // proportional share
    d[p] -= move
```
- Write in place, as the wiki author does (cheap, slightly directional), or into a second buffer (order-independent, GPU friendly).
- For u8 integer snow, use the sandpile-like variant (I): `if d[p] - d[n] > T: d[p]--, d[n]++`, with a random neighbour order. Each tick is a single increment, so the field always "settles" by itself over a few frames. That is visually nice: footprint rims slump over ~0.5 s.

### Inferences
- Snow-specific feel: fresh powder gets a low T (it spreads and fills holes), and packed snow or ice gets a high T or does not move at all (§4). This matches the Chalmers trend that a stickier, warmer snow stands steeper. **Wet snow → steeper walls; dry powder → soft mounds.**
- The **Abelian property** makes the sandpile rule safe on a GPU: each pixel *pulls* from its neighbours, since the final result does not depend on order. See also "When Parallel: Pull, Don't Push" (https://nullprogram.com/blog/2020/04/30/; not fetched, title only).

### Gaps
- The Olsen 2004 PDF was not fetched directly, so its exact recommended T and c values are unverified.
- No measured snow repose angle in degrees was obtained.

---

## 3. Wind: drifts, lee side, saltation

### Takeaway
Werner's 1995 dune CA is a ready-made "snow drift" CA with published parameters. Benes & Roa 2004 add a cheap linear wind-shadow ramp behind obstacles. For a game, run the hop rule a few hundred to a few thousand times per tick on random cells while it is snowing and windy.

### Cited findings
- **Werner 1995** (https://planetarygeoscience.uchicago.edu/doc/Werner_1995.pdf):
  - Square lattice of stacked **slabs**, with **periodic boundaries**. Fig. 2A uses a **1000×1000** lattice.
  - Pick a random surface slab to erode. It hops **l = 5 cells** downwind and is deposited with **p_s = 0.6** on a site holding sand and **p_ns = 0.4** on a bare site. If it is not deposited, it keeps hopping l sites.
  - **Shadow zone at 15°** behind bumps: slabs landing there are deposited.
  - **Angle of repose 30°**: slabs move down the steepest gradient until the slope complies.
  - Mean slabs per site vary by run (3, 8, 15). Time = sites polled / surface sites.
- **Benes & Roa 2004, "Simulating desert scenery"** (https://www.cs.purdue.edu/homes/bbenes/papers/Benes04WSCGa.pdf):
  - Transport per cell `q_s = q0 * (1 + tanh(∇hf))`. The hop is `l = (l0 + w*hf) * (1 - tanh(∂hf/∂i))`.
  - **q0 in [0.1, 1]**; above 1 suppresses ripples. **l0 and w in [0, 1]**; outside that range the system is unstable.
  - **Wind shadow**: intensity is **0 directly behind an obstacle and rises linearly with distance**. Shadow length scales with obstacle height and wind; width scales with the projected area. Wind direction is unchanged.
  - Material that would land inside an object is placed at the **nearest outside border**, which is how snow piles against walls. Creep or avalanching moves excess material to neighbours in proportion to the gradient.
  - Performance: **4–10 fps at 1000×1000** on a 1.5 GHz PC, C++.

### Pseudocode: Werner-style snow drift tick (top-down)
```
// wind = (wx, wy) integer step, e.g. (1,0) blowing east; L = 5
repeat K times per tick (K ≈ 1–5% of cells):
    p = random cell with d[p] > 0 and not shadowed(p)   // erode only exposed snow
    d[p] -= 1
    q = p
    loop up to 6 hops:
        q += L * wind (+ random jitter of ±1 perpendicular)
        if solid(q): q = last free cell before wall; break  // piles against the windward face
        if shadowed(q): break                                // lee side: always deposit
        if rand() < (d[q] > 0 ? 0.6 : 0.4): break
    d[q] += 1
    relax_talus_around(q)   // §2, 30°-equivalent T
```

### Inferences
- `shadowed(q)` in top-down with no true 3D: precompute a **wind-shadow map** once per wind direction. For each cell, march upwind up to N = 8 cells. If an occluder of height h is found at distance k, the cell is in shadow when `k < h * shadow_len_factor`. This is a discrete version of Werner's 15° (tan 15° ≈ 0.27, so a 1-tile wall shadows ≈ 3.7 tiles). Store the result as a u8 "exposure" in channel A.
- For snow depth, use **slab = 1 depth unit**. Moving an entire drift visibly takes minutes of game time, which is fine for ambience.

### Gaps
- No game found that ships a Werner-style snow drift CA. Search for drift sims in games was not exhaustive.

---

## 4. Snow depth heightmap operations (deposit, stamp, refill, compact)

### Takeaway
Each operation is a few lines over the u8 field. Footprints are a **subtract-and-push-to-rim stamp**, after which talus relaxation and new snowfall erase them for free.

### Cited findings
- Godot's viewport-texture tracks technique (https://godotshaders.com/shader/car-tracks-on-snow-or-sand-using-viewport-textures-and-particles/): a top-down SubViewport camera renders particle trails on a hidden layer. The terrain shader reads it as `viewport_texture`, tints by the red channel and lowers the vertex by `floor_heightmap * ditch_height * trail`. This is a GPU accumulation-buffer alternative to a CPU array. The page gives no fade/refill or resolution details.

### Pseudocode (all [I], derived from §2–3 rules)
```
DEPOSIT (snowing, per tick):
    for K random cells p:                        // K = snowfall_rate * cells * dt
        if rand()*255 < exposure[p]: d[p] = min(255, d[p] + 1)
    // Alternative without RNG: d += rate*exposure with a per-pixel fractional accumulator

FOOTPRINT (on step, foot at f, kernel radius r=1..2 px):
    removed = 0
    for p in disc(f, r): k = min(d[p], press); d[p] -= k; removed += k
                         if state[p]==POWDER and d[p] > 0: state[p] = PACKED
    for p in ring(f, r+1): d[p] += removed / |ring|   // pushed to the rim
    mark chunk dirty   // talus relax softens the rim over the next frames

PLOW / SLED (moving segment):
    same as FOOTPRINT but push removed snow to the side perpendicular to motion
    → berms; relax with high T so berms stay crisp

SINK / SLOWDOWN (gameplay read):
    speed_mul = lerp(1.0, 0.55, d[under_feet]/255)   // tuning value, not cited
    sprite_offset_y = d/64 px (cover feet)

REFILL: happens automatically from DEPOSIT plus talus. Footprints that are packed
    (higher T, slower melt) persist as faint "ghost" tracks under fresh snow.

COMPACTION: state PACKED → melts at DDF*0.5, T_talus higher, palette 1 shade greyer.
```

### Gaps
- No cited game numbers for footprint lifetime or refill rates. These are tuning values.

---

## 5. Melting, slush and refreeze

### Takeaway
Use a **degree-day model** for *how much* melts and the **noise-threshold dissolve** for *which pixels* disappear first. Add a neighbour-count term to get "edges first".

### Cited findings
- **Degree-day formula**: `M = DDF * max(0, T_mean - T_base)`, with T_base usually 0 °C. Snow DDF ≈ **3–6 mm/°C/day**, and higher for ripe or dirty snow and for ice (https://metricgate.com/docs/snowmelt-degree-day/).
- HESS 2026 review (https://hess.copernicus.org/articles/30/2613/2026/hess-30-2613-2026.html): snow melt factors reported from **0.5 to 20 mm (°C d)⁻¹**, with **typical values 2–6**. Cited: Braithwaite 1995, Kane 1997, Hock 2003, among others. Melt factor varies with **slope, aspect and sky-view angle** (Marsh 2012). **Low DDF goes with low incoming shortwave and high albedo; high DDF with more shortwave** (Hock 2003).
- Antarctic Glaciers (https://www.antarcticglaciers.org/glaciers-and-climate/numerical-ice-sheet-models/modelling-glacier-melt/): `M = K_I·PDD + K_S·PDD` with separate ice and snow factors. Arctic glacier factors range **1–10 mm w.e./°C/day**, and **ice melts more per degree-day than snow** because it is less reflective. References: Hock 2003 (*J. Hydrology* 282:104–115) and Braithwaite & Zong 2000.
- Hock 2003 abstract (https://repository.geologyscience.ru/items/959fd6dc-a49d-44b9-8a58-c662ee369ac5/full): temperature-index models often match energy-balance models at catchment scale, but are weaker at fine time steps and with spatial shading, slope and aspect. That weakness is the reason to multiply DDF by a sun/shade map.
- **Dissolve shader** (https://godotshaders.com/shader/2d-dissolve-with-burn-edge/): `mask = smoothstep(noise - w, noise, value)` and `edge = smoothstep(noise, noise + w, value)`, with burn width ≈ **0.04**. The edge band is the place to put a slush or wet colour.

### Pseudocode
```
// Game-time scaling: 1 game day = e.g. 20 real minutes (tuning)
melt_units_per_tick = DDF * max(0, T_air) * dt_days / mm_per_unit
for p in active chunks:
    sun = 1.0 - shade[p]*0.6                     // shade map from roofs/trees (I)
    k = DDF_state[state[p]] * sun                // packed ≈ 0.5×, ice ≈ 1.5–2× snow (ice > snow per sources)
    edge = count_bare_neighbors8(p) / 8          // 0..1 — "edges first"
    m = melt_units_per_tick * k * (1 + 2*edge)   // tuning
    d[p] -= stochastic_round(m)                  // rand() < frac → extra unit
    wet[p] += m                                  // meltwater
    if d[p]==0 and wet[p]>θ: state[p]=WET_GROUND
    if T_air < 0 and wet[p]>0: state[p]=ICE (refreeze); wet[p]=0   // night refreeze
    if 0 < d[p] < 20 and wet[p]>θ: state[p]=SLUSH
```
**Noise-threshold coverage (the dissolve trick)** [I + dissolve shader cited above]:
```
visible_snow(p) = d[p] > noise[p] * D_full        // noise fixed per pixel, blue- or value-noise
```
- One global scalar ("snow amount") over a constant depth field gives a pure dissolve. With a real `d` field you get organic patches. Low-exposure (sheltered) and sunny cells thin out first, and edges retreat naturally.
- **Cheapest possible version, no simulation:** `d[p] = global_snow * exposure[p]`, then compare against `noise[p]`. It costs 0 CPU and is one line in a canvas shader. It is the true "Doom-fire-cheap" baseline for accumulate and melt.

### Gaps
- Hock 2003 Table 1 (exact snow and ice DDF ranges) was not retrieved; the PDF was not accessible.
- No game reference found for slush or refreeze state machines with numbers.

---

## 6. Exposure / shelter maps

### Takeaway
Precompute once per map (or once per wind change) a u8 exposure = `sky_visibility * wind_exposure`. Use it to weight deposit (more snow on open ground), melt (`shade` → slower melt) and erosion (wind strips exposed ridges).

### Cited findings
- Benes & Roa 2004 linear wind-shadow ramp and the Werner 15° shadow zone (§3).
- Melt depends on sky-view angle, slope and aspect (HESS 2026, §5).

### Pseudocode [I]
```
// occ[x,y] = occluder height in px: roof 16, tree canopy 12, wall 8, fence 3, else 0
for each cell p:
    // Sky visibility: under a roof/canopy footprint → 0.0–0.2; else check 4 dirs ≤ 4 cells
    sky = covered[p] ? 0.1 : 1.0 - 0.1 * count(dirs with occ within 2 cells)
    // Wind shadow: march upwind
    wind_exp = 1.0
    for k in 1..8:
        h = occ[p - k*wind]
        if h > 0 and k < h * 0.27 * SCALE:  // tan 15° (Werner)
            wind_exp = k / (h*0.27*SCALE)    // linear ramp (Benes & Roa)
            break
    exposure[p] = sky * mix(1, wind_exp, wind_strength)
// Optional: blur exposure 1–2 passes (box 3×3) for soft drift edges
```
- Cost at 320×180 is 57,600 × ~10 reads ≈ 0.6 M reads, done once at load. That is negligible even in GDScript (estimated at roughly tens of ms, once).
- Alternative: a **distance field** to occluders (for example a jump-flood on the GPU) gives `exposure = saturate(dist / R)`. This produces "snow-free halo under trees" and "thin snow near walls" with one texture lookup.

### Gaps
- No game postmortem found that documents a snow exposure map in a 2D game. Not searched exhaustively.

---

## 7. Rendering the field in pixel art

### Cited findings
- Sandspiel colours each cell from species plus the random `ra` byte (lightness grain) and uploads the cell array as an RGBA texture with no copy (https://maxbittker.com/making-sandspiel).
- Ordered dithering (https://en.wikipedia.org/wiki/Ordered_dithering): the threshold map is normalized `M/n² − 0.5`. A closed form exists without recursion: `M(i,j) = bit_reverse(bit_interleave(i XOR j, i)) / n²`.

### Pseudocode (canvas_item shader over the snow texture, nearest filtering) [I]
```
const float BAYER4[16] = {0,8,2,10, 12,4,14,6, 3,11,1,9, 15,7,13,5};  // standard 4×4 Bayer
d   = tex(R)                   // 0..1
thr = BAYER4[(x&3) + 4*(y&3)] / 16.0 + 0.5/16.0
cov = d*4.0                    // 0..4 → shades
shade = floor(cov + (thr - 0.5))  // dithered quantization to 0..4
color = PALETTE[shade]         // e.g. ground, thin-snow-grey-blue, snow-mid, snow-light, snow-white
// Directional shading: 2-tap emboss with light from NW → shadow on S/E edges
slope = d(x,y) - d(x+1,y+1)
if slope >  k: color = PALETTE_SHADOW_BLUE   // drop-off edge facing away from light
if slope < -k: color = PALETTE_HIGHLIGHT
// Sparkles: if hash(x,y, floor(time*2)) > 0.995 and d > 0.6 and sunny: color = WHITE
```
- The 4×4 Bayer values above are the standard matrix (from general knowledge; the Wikipedia page images did not render).
- Use 3–5 shades. Thin snow should be a **bluish grey**, not white, so ground shows through, and partial coverage should be dithered, not alpha-blended. Alpha blending breaks the palette.

---

## 8. Performance numbers and update-frequency tricks

### Cited findings
- **Sandspiel:** 300×300 = **90,000 cells @ 60 fps** (Rust/WASM, author's machine). Too much for many devices, per the author. Render **< 1 ms CPU** (https://maxbittker.com/making-sandspiel).
- **Noita:** 64×64 dirty-rect chunks with a 4-pass checkerboard on threads; only active areas update (80.lv; benlau6 notes above). No published numbers found.
- **Benes & Roa 2004:** 1000×1000 heightfield wind/creep at **4–10 fps** on a 1.5 GHz CPU in C++ (paper above).
- **Werner 1995:** runs on 1000×1000 lattices (no timings reported).
- **GDScript vs C++ vs C#** (**vendor-reported**, Projekt J.E.N.O.V.A, https://jenova-framework.github.io/docs/pages/Misc/Benchmark), Godot 4.5 beta1 on an i9-12900K, 100 M iterations of vector create + normalize + sum: **GDScript 5,079 ms, C# 3,564 ms, C++ 246 ms**. That is ≈ 51 ns per iteration in GDScript, about 20× slower than C++.

### Inferences
- **Budget for 320×180 = 57,600 cells:**
  - GDScript at ~50 ns per simple cell visit ≈ **~3 ms per full pass**, and more with 4–8 neighbour reads (likely 5–15 ms). A full-field GDScript pass every frame is therefore **not OK**. Options:
    - (a) Tick at **5–10 Hz** and update **1/N of rows per frame**: interlaced, or a checkerboard of chunks as in Noita.
    - (b) Only tick **dirty chunks**: around feet, plows, the active melt front.
    - (c) Do the **deposit and melt as pure shader math** (`d = global_snow*exposure`, dissolve). Reserve the CA for local footprint/talus areas, ≈ a few hundred cells per step.
  - **GPU path in Godot 4:** two SubViewports or textures in ping-pong, each pass a canvas_item shader where each pixel *pulls* from its 4 neighbours. This works for talus (pull form), deposit and melt. A 320×180 pass is trivial for any GPU. Footprints are drawn as sprites into the viewport (the same idea as the godotshaders tracks technique). Caveat: readback for gameplay (sink depth) should sample only a few pixels, or keep a coarse CPU mirror per tile.
  - **WASM (web export) / GDExtension:** a Sandspiel-like 90 k cells @ 60 fps suggests a 57.6 k-cell field in native code is comfortable (<1–2 ms). This is an inference from the Sandspiel figure.
- **Stochastic updates** (Werner-style "pick K random cells") are an excellent budget knob. Cost scales with K, not with field size, and the visual result is just "slower weather".
- Data per field: u8 depth + u8 state + u8 noise + u8 exposure = **4 B/cell → 230 KB at 320×180**. That is one RGBA8 texture, Sandspiel-style.

---

## 9. Suggested minimal "Doom-fire-of-snow" spec (synthesis, [I])
```
Buffers: RGBA8 320×180 (R depth, G state, B noise, A exposure)
Every 100 ms (10 Hz) on dirty chunks + K random cells:
  snowing:  d += (rand < rate*exposure)                // accumulate (exposed first)
  windy:    Werner hop (L=5, p=0.6/0.4, lee = always deposit)
  always:   talus relax (powder T=1, packed T=3, ice ∞)
  warm:     d -= DDF*sun*(1+2*bareNeighbors/8)*dt  → wet/slush; cold+wet → ice
On step:    stamp (subtract disc, push to rim, mark PACKED)
Render:     shade = bayer-dithered quantize(d) into 5-colour ramp; emboss SE shadow; sparkles
```

---

## Sources
- GDC Vault, "Exploring the Tech and Design of Noita" (Purho, 2019): https://gdcvault.com/play/1025695/Exploring-the-Tech-and-Design (see-it-in-action: talk video page)
- 80.lv, "Noita: a Game Based on Falling Sand Simulation": https://80.lv/articles/noita-a-game-based-on-falling-sand-simulation/
- Noita dev notes / Q&A: https://benlau6.github.io/notes/noita
- Noita wiki, Snow (static) material (see-it-in-action): https://noita.wiki.gg/wiki/Snow_static
- Max Bittker, "Making Sandspiel": https://maxbittker.com/making-sandspiel (play: sandspiel.club, linked from the post)
- Margolus sand demo: https://www.emergentmind.com/margolus-sand
- Sandboxels wiki, Packed Snow: https://sandboxels.wiki.gg/wiki/Packed_Snow
- Powder Toy wiki, SNOW (blocked by Anubis): https://powdertoy.co.uk/Wiki/W/Element:SNOW.html
- Abelian sandpile model, Wikipedia: https://en.wikipedia.org/wiki/Abelian_sandpile_model
- Fractal terrain wiki, Erosion Models (thermal erosion, T = 4/width): https://github.com/vrum/fractalterraingeneration/blob/master/wiki/Erosion_Models.wiki
- CESCG'97 thermal erosion notes: https://old.cescg.org/CESCG97/marak/node11.html
- World Machine, Thermal Erosion device: https://help.world-machine.com/topic/device-thermalerosion/
- Chalmers, Angle of repose of snow (abstract): https://research.chalmers.se/en/publication/?id=528014
- Werner 1995, eolian dunes CA (Geology): https://planetarygeoscience.uchicago.edu/doc/Werner_1995.pdf
- Benes & Roa 2004, Simulating desert scenery (WSCG): https://www.cs.purdue.edu/homes/bbenes/papers/Benes04WSCGa.pdf
- Godot Shaders, Car tracks on snow or sand (viewport textures): https://godotshaders.com/shader/car-tracks-on-snow-or-sand-using-viewport-textures-and-particles/
- Godot Shaders, 2D dissolve with burn edge: https://godotshaders.com/shader/2d-dissolve-with-burn-edge/
- Wikipedia, Ordered dithering: https://en.wikipedia.org/wiki/Ordered_dithering
- MetricGate, Snowmelt degree-day: https://metricgate.com/docs/snowmelt-degree-day/
- HESS 30, 2613 (2026), melt-factor review: https://hess.copernicus.org/articles/30/2613/2026/hess-30-2613-2026.html
- AntarcticGlaciers.org, Degree-day models: https://www.antarcticglaciers.org/glaciers-and-climate/numerical-ice-sheet-models/modelling-glacier-melt/
- Hock 2003 abstract, Temperature index melt modelling in mountain areas: https://repository.geologyscience.ru/items/959fd6dc-a49d-44b9-8a58-c662ee369ac5/full
- Projekt J.E.N.O.V.A benchmark (vendor-reported): https://jenova-framework.github.io/docs/pages/Misc/Benchmark
- nullprogram, "When Parallel: Pull, Don't Push" (title only, not fetched): https://nullprogram.com/blog/2020/04/30/
