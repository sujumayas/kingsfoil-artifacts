# 09. Runtime cost of loot presentation: measured benchmarks

Researcher angle: runtime cost. Every number is tagged MEASURED (our bench), CITED (a source says it) or ESTIMATE (arithmetic or inference). Almost everything here is MEASURED. This file follows the method of the combat juice bench (`studies/feel-combat-juice/notes/09-benchmarks.md`, `notes/bench/`) so the two sets of numbers line up.

## Machine and setup
- Apple M4 Pro, 14 cores, 48 GB RAM, macOS 26.5.1 (25F80). Chromium 153.0.8010.12 via Playwright (headless) from the repo `.venv`. Same machine and browser as studies #1 and #2.
- Harness, all in `notes/bench/`:
  - `lootbench.html` has every test. No external assets. Item sprites (8 shapes x 5 rarity tiers, 16x16), halos, beams, a 3x5 pixel font, floor tiles, players and a corpse are generated in code.
  - `run.py <config> [throttle6] [frames=N] [sections=items,beams,labels,solver,magnet,boss,raf]` runs one condition and writes `results-<config>.json`.
  - `runall.sh` reruns all three conditions and rebuilds `summary-table.md` with `summarize.py`. `log-*.txt` are the raw console logs.
  - `lootbench.html?preview=boss&n=200&mode=cheap` draws one boss-drop frame. Screenshots are in `notes/scratch-09/boss200-cheap.png` and `boss200-naive.png`.
- Conditions:
  - `metal`: real GPU, `--use-angle=metal`.
  - `metal-throttle6`: metal plus CDP `Emulation.setCPUThrottlingRate` 6. It stands in for a low-end phone or Chromebook CPU. It slows the main thread only, not the GPU.
  - `swiftshader`: `--use-angle=swiftshader --disable-gpu-rasterization`. Software GL and software raster. The worst case, a machine with a blocklisted GPU.
- Frame: clear a 320x180 Canvas2D, draw 240 floor tiles (20x12 at 16 px), run the test, upscale x4 to a 1280x720 display canvas with nearest filtering, then copy 1 pixel of the display canvas into a CPU-backed 1x1 canvas and read it. That readback forces the GPU to finish, so each cell is the whole frame. Subtract `baseline_floor_only` (same column) for the effect alone.
- 30 warm-up frames, then 200 timed frames (metal) or 100 (throttle6, swiftshader). If a warm-up frame takes over 40 ms the test drops to 20 timed frames, marked "(20f)". Page is `crossOriginIsolated` (COOP/COEP) so `performance.now()` has 5 µs resolution.
- Item counts are 50 / 200 / 1000 / 3000 on one 320x180 screen. 3000 is a stress level. A 320x180 view at 16 px per tile is 20x11 tiles, so 3000 items is about 13 items per tile.

### Method caveats (read before quoting)
- The combat bench found that Chrome likely rasterizes a 320x180 Canvas2D on the CPU (it is under the size where Chrome turns on GPU acceleration). ESTIMATE, not confirmed in Chromium source. So the `metal` column for the lowres canvas is mostly CPU raster plus a GPU upscale.
- The swiftshader baseline is 7.79 ms here, against 0.56 ms in the combat bench. The differences are the 240 floor tiles and the probe copy from the 1280x720 display canvas. ESTIMATE: in full software mode, both the x4 upscale and that copy run on the CPU. I did not split the cause. Compare rows inside the swiftshader column, not against the combat bench.
- CDP throttling pauses the main thread in slices. CPU-only rows under 0.1 ms show p95 jumps of about 1.3 ms in the throttle column (for example `magnet_grid_30p n=1000`: median 0.02, p95 0.81). That is a throttling artifact. Quote the median.
- This is browser Canvas2D, not Godot. Godot's web export runs its own WebGL2 renderer. Take the ratios and the draw-call lessons, not the absolute ms. Godot mappings below are inferences.
- I ran a screenshot script for about 2 seconds while the metal run started. It may have touched the first few rows of `results-metal.json`. Those rows match the earlier 30-frame trial run within 0.1 ms.

## Headline table (median ms per frame, whole frame, 16.7 ms budget)

| scenario | n | metal | throttle6 | swiftshader |
|---|---|---|---|---|
| baseline (floor + upscale) | 0 | 0.58 | 1.47 | 7.79 |
| items, plain blit | 200 | 0.75 | 2.01 | 10.99 |
| items, plain blit | 1000 | 1.46 | 4.97 | **23.46** |
| items, plain blit | 3000 | 3.80 | 13.57 | **55.26** |
| pop arc + bounce + shadow | 200 | 0.94 | 2.76 | 14.19 |
| pop arc + bounce + shadow | 1000 | 2.84 | 9.61 | **39.38** |
| glow, halo sprite (pre-baked pulse) | 200 | 0.94 | 3.19 | 14.16 |
| glow, halo 'lighter' additive | 200 | 0.98 | 2.98 | 14.06 |
| glow, `shadowBlur` 6 | 50 | 5.78 | 6.89 | **21.07** |
| glow, `shadowBlur` 6 | 200 | **20.68** | **23.57** | **60.49** |
| glow, `shadowBlur` 6 | 1000 | **88.17** | **100.20** | **273.89** |
| beams, gradient per frame | 300 beams | 1.05 | 2.88 | 11.93 |
| beams, pre-rendered sprite | 300 beams | 0.94 | 2.63 | 12.52 |
| labels, label atlas (1 blit each) | 200 | 0.76 | 1.93 | 10.93 |
| labels, bitmap glyph per char | 200 | 2.73 | 8.60 | **38.10** |
| labels, `fillText` | 200 | 1.03 | 2.67 | **34.44** |
| labels, label atlas | 1000 | 1.50 | 5.03 | **23.34** |
| labels, bitmap glyph per char | 1000 | 11.45 | **43.06** | **161.63** |
| fly-to-bag tween | 1000 | 1.61 | 5.26 | **23.62** |
| boss drop 30 players, cheap path | 200 items | 1.14 | 3.62 | 16.27 |
| boss drop 30 players, naive path | 200 items | 4.85 | 7.63 | **29.45** |
| boss drop 30 players, cheap path | 600 items | 2.46 | 7.73 | **30.09** |
| boss drop 30 players, naive path | 600 items | 13.38 | **20.66** | **60.91** |

CPU-only rows (JS time alone, median ms):

| scenario | n | metal | throttle6 |
|---|---|---|---|
| label solver, naive O(n²) | 200 / 1000 / 3000 | 0.04 / 0.24 / 0.93 | 0.04 / 1.48 / 5.65 |
| label solver, spatial grid | 200 / 1000 / 3000 | 0.01 / 0.06 / 0.18 | 0.01 / 0.06 / 1.16 |
| magnet, brute force 30 players | 1000 / 3000 | 0.03 / 0.10 | 0.03 / 0.31 |
| magnet, grid 30 players | 1000 / 3000 | 0.02 / 0.05 | 0.02 / 0.05 |

Full tables with p95 for every row are in `bench/summary-table.md`.

## Q1. Item sprites, pop arcs and fly-to-bag

### Takeaway
A plain item costs about 1.1 µs on metal, 4 µs on a throttled CPU and 16 µs in software (MEASURED, 3000-item row minus baseline). A pop arc with a ground shadow is two blits and costs twice as much. Motion math is free next to the blit. Fly-to-bag with a scaled `drawImage` costs the same as a static item. Budget by blit count, not by effect type.

### Measured results (effect alone = row minus baseline, median ms)
- Static blit, metal: 0.05 / 0.17 / 0.88 / 3.22 at 50 / 200 / 1000 / 3000.
- Static blit, throttle6: 0.15 / 0.54 / 3.50 / 12.10.
- Static blit, swiftshader: 0.92 / 3.20 / 15.67 / 47.47.
- Pop arc + 2 bounces + shadow (16 px peak over 24 frames = 400 ms, then 4 px over 10 f and 1.5 px over 6 f): metal 2.26 at 1000, 6.43 at 3000. Throttle6 8.14 at 1000. Swiftshader 31.59 at 1000.
- Fly-to-bag (24 frames, ease-in cubic, 20 px arc lift, scale 16 to 8 px): metal 1.03 at 1000, throttle6 3.79, swiftshader 15.83. Same as a static blit at every count.

### Inferences
- ESTIMATE from the swiftshader column: a software-only client can afford about 500 to 600 visible item blits in its 16.7 ms frame after the 7.8 ms baseline. A throttled CPU with a GPU reaches the budget near 3000 static items or about 1500 arcing ones.
- Real drops arc for 40 frames (667 ms) and then rest. At any moment only the fresh part of a drop pays the second blit for the shadow. Shadows on resting items can be baked into the sprite.

## Q2. Rarity glow: halo sprite vs additive vs `shadowBlur`

### Takeaway
A pre-rendered halo sprite is one extra blit per item. Normal and 'lighter' composite cost the same, and so do a per-item `globalAlpha` pulse and four pre-baked pulse frames (all within 5% of each other at every count). `shadowBlur` is 30 to 100 times slower and blows the budget at 200 items even on the M4 Pro GPU. Never use it for item glow.

### Measured results (effect alone, median ms)
- Halo sprite with per-item `globalAlpha`, metal: 0.15 / 0.41 / 2.38 / 6.67 at 50 / 200 / 1000 / 3000. Pre-baked pulse: 0.10 / 0.36 / 2.21 / 6.35. 'lighter': 0.12 / 0.40 / 2.30 / 6.46.
- `shadowBlur` 6 px with a per-tier `shadowColor`, metal: 5.20 / 20.10 / 87.59 / 289.32. About 0.1 ms per item. Throttle6 adds only about 10% (100.20 ms at 1000), so the cost sits in raster, not in JS.
- `shadowBlur` on a GPU-sized 1280x720 canvas (one-off run, `scratch-09/native_blur.py`, metal): 50 items 8.45 ms, 200 items 25.38 ms, 1000 items 130.49 ms. A x4 halo sprite at the same size: 0.42 / 0.80 / 3.38 ms. A bigger, GPU-backed canvas does not rescue `shadowBlur`.

### Inferences
- Glow only tier 2 and up (rare and better). In the boss scene that is about 20% of items with the tier weights used here (55 / 25 / 12 / 6 / 2%).
- Godot: a halo is another `Sprite2D` or a second frame in the same atlas, so it batches with the items. The Godot analogue of `shadowBlur` is a blur shader or the 2D glow post-process. ESTIMATE: both cost per pixel in the same way and belong in the "avoid on web" column. Not measured in Godot.

## Q3. Light beams for high tiers

### Takeaway
Beams are cheap at any sane count. 300 beams cost 0.35 to 0.47 ms on metal for every method. A fresh `createLinearGradient` per beam per frame is the only method that degrades under CPU throttle (1.41 ms vs 0.65 ms for a cached gradient). Pick the pre-rendered sprite because it can carry pixel-art banding and batches in Godot.

### Measured results (effect alone, median ms, 8x80 px beams, 'lighter', alpha pulse)
- 20 beams: metal 0.02 to 0.03 for all methods. Throttle6 0.05 to 0.06.
- 300 beams: gradient per frame 0.47 / 1.41 / 4.14 (metal / throttle6 / swiftshader). Cached gradient + translate 0.35 / 0.65 / 3.77. Sprite 0.36 / 1.16 / 4.73.

### Inferences
- Beams belong to the top 1 or 2 tiers, so a busy screen shows under 20. Their cost is noise. The design question (how tall, which tiers) is free from cost limits.

## Q4. Labels: bitmap glyphs, cached label sprites, `fillText`, DOM

### Takeaway
Pre-render each "name + tier" label once into a shared label atlas and draw it with one `drawImage`. That is the cheapest method in every config: 0.18 ms for 200 labels on metal and 3.1 ms in software. Per-character glyph blitting is 12 times slower (about 10 blits per label). `fillText` is fine on a GPU but costs 8 times the atlas in software. One shared atlas beats one canvas per label by about 25% at 1000 labels.

### Measured results (effect alone, median ms; label = dark box + 3x5 outlined text, about 10 chars, 43 px wide)
| method | 200 labels metal / throttle6 / swiftshader | 1000 labels metal / throttle6 / swiftshader |
|---|---|---|
| label atlas, 1 blit | 0.18 / 0.46 / 3.14 | 0.92 / 3.56 / 15.55 |
| one cached canvas per label | 0.34 / 0.65 / 4.87 | 1.41 / 4.19 / 17.94 |
| glyph per char + box | 2.15 / 7.13 / 30.31 | 10.87 / 41.59 / 153.84 |
| `fillText` 6 px on the lowres canvas | 0.45 / 1.20 / 26.65 | 2.19 / 6.08 / 131.87 |
| `fillText` + `measureText` every frame | 0.56 / 1.72 / 25.19 | 2.45 / 7.09 / 126.58 |
| `fillText` 20 px on a 1280x720 overlay | 0.52 / 1.43 / 28.83 | 2.01 / 5.78 / 133.67 |

- `fillText` at 6 px on a 320x180 canvas is antialiased and unreadable. The 1280x720 overlay version is what a JS client would use for crisp text, and it costs the same as the lowres version.
- DOM labels: 1 absolutely positioned `<span>` per label with `will-change: transform`, moved with `style.transform` every frame, over the canvas. JS time inside rAF is lower than the canvas version, but CDP `TaskDuration` per frame (adds style recalc and main-thread paint, not compositor raster) is higher:

| labels | metal: canvas atlas / DOM main-thread ms | throttle6: canvas / DOM | throttle6 frames over 20 ms of 120, canvas / DOM |
|---|---|---|---|
| 50 | 0.94 / 1.57 | 1.05 / 1.30 | 0 / 0 |
| 200 | 1.20 / 1.82 | 1.88 / 3.02 | 0 / 0 |
| 1000 | 2.79 / 3.57 | 8.19 / 14.27 | 0 / 2 |
| 3000 | 4.98 / 10.44 | 25.37 / 50.53 | 61 / 119 |

### Inferences
- After the solver in Q5 runs, only about 50 to 120 labels fit on a 320x180 screen anyway. At that count every method except glyph-per-char and software `fillText` is under 0.5 ms. The label atlas is still the right default because it is the only one that stays cheap in software mode.
- DOM labels are acceptable up to about 200 on screen (MEASURED, 1.8 to 3.0 ms main thread). They cost twice the canvas path from 1000 up. They also leave the game canvas, so they do not apply to Godot. ESTIMATE: in Godot the analogue is one `Label` node per item. Not measured here.
- Godot: the label atlas is the same idea as caching each label into a texture once (or using a bitmap `FontFile`) and drawing it as a sprite. ESTIMATE, not measured in Godot.

## Q5. Label overlap solver

### Takeaway
Greedy vertical stacking (sort by tier, then try the natural spot and up to 7 steps of 10 px upward, else hide) is cheap even when written naively, because a 320x180 screen holds at most about 120 labels. The naive solver's cost grows as n x placed, not n². A uniform grid (32x16 px cells) cuts the checks by about 12 times and the time by 4 to 5 times. Use the grid, but the naive version is safe below 1000 candidates.

### Measured results (CPU only, median ms)
| candidates | placed | naive checks | grid checks | naive metal / throttle6 | grid metal / throttle6 |
|---|---|---|---|---|---|
| 50 | 43 | 1,982 | 188 | 0.01 / 0.01 | 0.01 / 0.01 |
| 200 | 76 | 21,420 | 1,746 | 0.04 / 0.04 | 0.01 / 0.01 |
| 1000 | 99 | 140,110 | 11,324 | 0.24 / 1.48 | 0.06 / 0.06 |
| 3000 | 118 | 480,509 | 38,149 | 0.93 / 5.65 | 0.18 / 1.16 |

### Inferences
- With 3000 candidates, 96% of labels end up hidden. Above about 100 candidates the solver is already a filter. The design should pick who wins (tier first, then own items, then distance), because the screen will drop most labels whatever the code does.
- The solver can run every frame. There is no need for a dirty flag below 1000 candidates.

## Q6. Magnet pull query with 30 players

### Takeaway
Brute force (every item against 30 players, nearest within 2 tiles) costs 0.10 ms for 3000 items on metal and 0.31 ms throttled. A counting-sort grid halves that. On the client this is not a cost problem. Pick the structure for server reasons (area of interest, one grid shared with other queries), not for client frame time.

### Measured results (CPU only, median ms; 640x360 world = 20x11 tiles of 32 px, radius 64 px, pull 3 px/frame, collect under 6 px)
- Brute force: 0.01 / 0.01 / 0.03 / 0.10 at 50 / 200 / 1000 / 3000 (metal). Throttle6 at 3000: 0.31.
- Grid (64 px cells, rebuilt every frame by counting sort): 0.01 / 0.01 / 0.02 / 0.05. Throttle6 at 3000: 0.05.

### Inferences
- ESTIMATE: 30 players x 3000 items = 90,000 distance checks per tick. On a server at 20 ticks per second that is 1.8 M checks per second per screen, still small. The grid matters when a server zone holds many screens of items. Not measured server side.

## Q7. Boss drop with 30 players (mixed scene)

Scene: 1 corpse, 30 player sprites in a ring, n items in a pool. Each item pops out of the corpse on the arc above, rests at least 240 frames (4 s, think owner protection), then the nearest player within 20 px pulls it at 2 px/frame. When collected it flies to that player over 12 frames and respawns as a new drop. 400 frames of pre-roll reach steady state. Rest items get labels, solved every frame. Tier 2+ glow, tier 4 beams.
- Cheap path: halo sprites with 'lighter', beam sprites, label atlas, grid solver, grid magnet.
- Naive path: `shadowBlur` glow, gradient beams per frame, `fillText` + `measureText` labels, naive solver, brute magnet.

### Takeaway
The cheap path fits 600 items with 30 players in 2.5 ms on metal and 7.7 ms throttled. The naive path costs 4 to 5 times more and passes the budget throttled at 600 items. Most of the naive cost is `shadowBlur`. In full software mode even the cheap path passes the budget near 200 items (16.27 ms), which argues for a loot filter or merge rule there.

### Measured results (median / p95 ms, whole frame)
| items | label candidates / placed | cheap metal / throttle6 / swiftshader | naive metal / throttle6 / swiftshader |
|---|---|---|---|
| 60 | 56 / 30 | 0.80 / 2.49 / 11.22 | 2.08 / 3.79 / 17.16 |
| 200 | 179 / 49 | 1.14 / 3.62 / 16.27 | 4.85 / 7.63 / 29.45 |
| 600 | 536 / 59 | 2.46 / 7.73 / 30.09 | 13.38 / 20.66 / 60.91 |

p95 sits 5% to 35% above the median. No row has spikes (see `summary-table.md`).

### Inferences
- The screenshot `scratch-09/boss200-cheap.png` shows 200 items and 49 labels on one 320x180 screen. It is unreadable long before it is slow. Item count on screen will be capped by clarity (merge stacks, filters, personal loot) well before frame time.
- ESTIMATE for Godot: 600 items + 30 players + 60 labels is about 1,400 sprites, which the 2D batcher should handle in a few draw calls if items, halos, beams and labels share one atlas. Not measured in Godot.

## Recommendations with numbers
1. Glow with a pre-rendered halo sprite, 'lighter' or normal. Cost about 2 µs per item on metal and 8 µs throttled. Ban `shadowBlur` and blur shaders for items: 0.1 ms per item, 20.68 ms for 200 items on metal.
2. Glow only rare tiers and up. With typical tier weights that is about 20% of items, so the halo cost drops by 5 times.
3. Pre-render labels once per "name + tier" into one shared atlas. 0.18 ms for 200 labels on metal and 3.1 ms in software, against 2.15 / 30.3 ms for per-glyph text.
4. Run the greedy stacking solver every frame on a 32x16 px grid. 0.18 ms at 3000 candidates. Expect about 120 labels at most on a 320x180 screen. Design the priority order, because most labels will be hidden.
5. Beams: any method is fine. Prefer the sprite for the pixel-art look. Avoid making a new gradient every frame if the client is JS Canvas2D, because it doubles beam cost on a slow CPU.
6. Magnet: brute force is fine on the client up to 3000 items and 30 players (0.10 ms). Choose the grid for server-side reasons.
7. Budget for low-end web as blits per frame. Throttled CPU with GPU: about 4 µs per blit, so about 3000 blits in a 16.7 ms frame with the 1.5 ms baseline. Software only: about 16 µs per blit, so about 550 blits after a 7.8 ms baseline. A pop arc costs 2 blits, glow 1 more, a label 1 more.
8. Cap visible ground items through design (merge stacks, hide common items behind a filter, personal loot) at about 200 per screen. The cheap boss scene at 200 items is 1.14 / 3.62 / 16.27 ms (metal / throttle6 / swiftshader), so 200 is the most a software-only client can show within budget.
9. DOM labels are acceptable to about 200 visible (1.8 ms main thread on metal, 3.0 ms throttled). Above that they cost twice the canvas path. Not usable from Godot.

## Gaps
- No Godot measurement. All numbers are Chromium Canvas2D. The combat bench's WebGL2 rows are the closer stand-in for Godot's renderer and showed instanced draws far cheaper than Canvas2D at high counts. I did not repeat WebGL2 here.
- No real low-end device. Throttle6 slows only the main thread. Swiftshader is a pessimistic software stand-in.
- Compositor and GPU raster time for DOM labels is not in `TaskDuration`. The DOM rows understate the DOM cost.
- Audio for drops and pickups was not measured. The combat bench covers Web Audio trigger cost.
- Server-side costs (pickup arbitration, AOI, bandwidth per item) are not measured here.
- The swiftshader baseline cause (7.79 ms) is not split between floor tiles, upscale and probe copy.

## Sources
- Our bench: `notes/bench/lootbench.html`, `run.py`, `runall.sh`, `summarize.py`, `results-metal.json`, `results-metal-throttle6.json`, `results-swiftshader.json`, `summary-table.md`, `log-*.txt`.
- One-off native-canvas `shadowBlur` check: `notes/scratch-09/native_blur.py`, output in `notes/scratch-09/native_blur.txt`.
- Method and the lowres-canvas CPU-raster caveat: `studies/feel-combat-juice/notes/09-benchmarks.md` and `studies/feel-combat-juice/notes/bench/`.
- CDP `Emulation.setCPUThrottlingRate`: https://chromedevtools.github.io/devtools-protocol/tot/Emulation/#method-setCPUThrottlingRate
- CDP `Performance.getMetrics`: https://chromedevtools.github.io/devtools-protocol/tot/Performance/#method-getMetrics
