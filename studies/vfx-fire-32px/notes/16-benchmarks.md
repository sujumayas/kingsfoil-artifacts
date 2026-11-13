# 16 Benchmarks: what the fire engine costs at 640x360 (measured)

Lens: runtime efficiency. Every number below is my own measurement on 13 Nov 2026 unless it is marked as an estimate or an inference. Times are ms per call: per frame for render layers, per tick for the spread grid. The frame budget is 16.7 ms (60 fps).

The question: VFX #6 ran its fire engine at 320x180 with 8 px cells. What does each fire layer cost at 640x360 with 32 px tiles, and which choices keep it cheap?

Short answer. The plausible default effects frame (spread grid at 32 px tiles, art burn map on 20% of the screen, 150 drawn flame loops, 8 px smoke, 512 embers, 8 px light map, palette pass, putImageData) costs 0.62 ms on an M4 Pro and 4.9 ms under a 6x CPU throttle. The same frame at 320x180 costs 0.21 ms and 1.24 ms. So the move to 640x360 costs 3.0 times (desktop) to 3.9 times (throttled), and the throttled frame uses 29% of the budget. Two per-pixel passes cost the most. The light map (build plus apply) is 44% of the frame and the smoke field 18%. The cheap parts stay cheap: the spread grid, embers and DOOM torches each stay under 0.03 ms.

## Setup

- Machine: Apple M4 Pro (`sysctl -n machdep.cpu.brand_string` prints "Apple M4 Pro"), 14 cores, macOS 26.5.1 (25F80). Playwright 1.63.0 on Python 3.13.5. Chromium 153.0.8010.12 (both the full build and chromium-headless-shell).
- Bench page: `studies/vfx-fire-32px/notes/bench/firebench.html`. It is self-contained. Open it in any browser and call `await runCPU()` or `await runGPU()` from the console. Both take `{only: 'regex'}`.
- Runner: `studies/vfx-fire-32px/notes/bench/run.py` (`python run.py gpu|swiftshader [throttle6] [mode=cpu|gpu|all] [only=<regex>] [tag=<suffix>]`), copied from the snow bench. Table script: `bench/merge.py`.
- Raw results in `bench/`: `results-gpu.json`, `results-swiftshader.json`, `results-gpu-throttle6-cpu.json` (full runs), and three `results-*-cpu-pass2.json` files (palette and whole frame again on a fresh page, see "Harness notes"). Every row stores median, p95, p10, p90, min and sample count. Probes and logs are in `notes/scratch-16/` (not committed).

### The three setups

| Name in this note | Browser build | WebGL renderer | CPU throttle |
|---|---|---|---|
| GPU run | full Chromium, new headless, `--use-angle=metal --enable-gpu --ignore-gpu-blocklist` | `ANGLE (Apple, ANGLE Metal Renderer: Apple M4 Pro)` | none |
| SwiftShader run (no GPU) | chromium-headless-shell | `ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (LLVM 10.0.0)))`, a CPU rasteriser | none |
| 6x throttle | the GPU run's build | Metal | `Emulation.setCPUThrottlingRate` 6 through CDP |

All runs finished with 0 page errors and 0 failed tests. Console warnings: Chromium's "use willReadFrequently" hint (from the deliberate 1 px readbacks) and, on SwiftShader, "GPU stall due to ReadPixels" (the deliberate sync).

### How a number is made

- CPU tests (columns "median" and "p95" below are wall time from `performance.now()`): 200 ms warm-up, then 31 samples. Each sample calls the function until 10 ms have passed and stores the mean ms per call. The tables show the median and p95 of the 31 sample means. Timer resolution is 0.1 ms, which is why each sample runs 10 ms.
- WebGL2 tests have two kinds of column. "Wall" is the slope between a batch of 1 frame and a batch of K frames, each ending in a 1x1 `readPixels`, so the sync cost cancels. "Timer" is the GPU time from `EXT_disjoint_timer_query_webgl2`, which only the Metal run exposes. Blending is on for every draw so a tile-based GPU cannot drop repeated draws.
- Rules carried over from the snow bench (`studies/vfx-snow-32px/notes/15-benchmarks.md`, "Two harness rules"): every engine instance is compiled from its own source text (`fresh()`), and RNG state lives in an `Int32Array`. Hot loops copy the state to a local and write it back once per call.
- Canvas tests end with a 1x1 `getImageData` so the draw has to land.

### Limits

- Headless Chromium on one machine, in normal desktop use (load average 4 to 9 on 14 cores during the runs). No vsync, no compositor, no on-screen scaling.
- JavaScript is not GDScript. VFX #6 note 03 measured GDScript at 15 to 50 times slower than V8 on per-cell loops. Read every CPU number as the floor for a compiled port.
- The 6x throttle pauses the page's main thread. It does not slow the GPU process (SwiftShader rasterising, Metal) and does not model a phone's smaller caches.
- The burn front, smoke and light tests write into a synthetic palette-index world (hashed ground, charred and ash tilesets). The cost depends on pixel counts and branches, not on what the art looks like.

## 1. DOOM fire buffers

Takeaway. A DOOM cell costs 3.9 to 5 ns per step on the M4 Pro. Torches and campfires at 1:1 are almost free (0.001 and 0.009 ms). Only the full-width band is a real cost: 0.39 ms at 1:1 and 2.5 ms throttled. 1:2 cuts it by 3.6 times. The palette quantize step is a 37-entry lookup and costs the same at 4, 5 or 6 tones.

Kernel: heat 0 to 36, the bottom row held at 36, each cell copies to the row above into a column shifted -1, 0 or +1, minus a decay from a 16-entry table sized so the flame fills about 85% of the buffer (79 to 89% of cells lit, `lit_share` in the JSON). The sweep goes row by row. "Draw" maps heat to a fire index through a 37-entry table and writes non-zero cells into the 640x360 Uint16 index buffer (1:2 writes each cell as 2x2 px).

| Buffer (art px) and resolution, cells | GPU run median, step | GPU run median, step + quantize 5 tones + draw | GPU run p95, step + draw | SwiftShader median, step + draw | 6x throttle median, step + draw | 6x throttle p95, step + draw |
|---|---:|---:|---:|---:|---:|---:|
| Torch 8x24, 1:1 (192 cells) | 0.00096 | 0.0012 | 0.0013 | 0.0013 | 0.0084 | 0.0095 |
| Torch 8x24, 1:2 (48 cells) | 0.00028 | 0.00039 | 0.00040 | 0.00038 | 0.0025 | 0.0027 |
| Campfire 32x48, 1:1 (1,536 cells) | 0.0067 | 0.0086 | 0.0089 | 0.0088 | 0.057 | 0.062 |
| Campfire 32x48, 1:2 (384 cells) | 0.0018 | 0.0026 | 0.0027 | 0.0026 | 0.016 | 0.017 |
| Bonfire 64x96, 1:1 (6,144 cells) | 0.026 | 0.033 | 0.034 | 0.034 | 0.217 | 0.229 |
| Bonfire 64x96, 1:2 (1,536 cells) | 0.0066 | 0.0093 | 0.0097 | 0.0094 | 0.059 | 0.061 |
| House front 128x96, 1:1 (12,288 cells) | 0.051 | 0.067 | 0.069 | 0.066 | 0.417 | 0.476 |
| House front 128x96, 1:2 (3,072 cells) | 0.013 | 0.019 | 0.019 | 0.018 | 0.122 | 0.132 |
| Full-width band 640x120, 1:1 (76,800 cells) | 0.303 | 0.388 | 0.400 | 0.400 | 2.52 | 2.68 |
| Full-width band 640x120, 1:2 (19,200 cells) | 0.077 | 0.109 | 0.112 | 0.106 | 0.714 | 0.769 |
| 20 torches 8x24 at once, 1:1 (3,840 cells) | - | 0.024 | 0.026 | 0.024 | 0.158 | 0.169 |
| 20 torches 8x24 at once, 1:2 (960 cells) | - | 0.0064 | 0.0066 | 0.0063 | 0.042 | 0.044 |

The quantize step alone (rows "quantize N tones + draw only", GPU run median, ms):

| Buffer | 4 tones | 5 tones | 6 tones | 6x throttle, 5 tones |
|---|---:|---:|---:|---:|
| Campfire 32x48, 1:1 | 0.0014 | 0.0014 | 0.0014 | 0.0088 |
| Full-width band 640x120, 1:1 | 0.058 | 0.058 | 0.057 | 0.357 |
| Full-width band 640x120, 1:2 | - | 0.025 | - | 0.157 |

Inferences.
- Draw is 15 to 38% of the step + draw cost. The propagation is the cost, and it scales with cells, so 1:1 costs 4 times 1:2 by construction (measured 3.2 to 4.0 times).
- The tone count is a free art choice. The cost is in the lookup and the write, not in the number of tones.
- 20 torches at 1:1 (0.024 ms) cost twice as much as 50 drawn loops (0.011 ms, section 2) and less than 2% of the throttled budget. Torches in a crowd are not a reason to drop DOOM. The band is.

## 2. Hand-drawn loops (cached frames)

Takeaway. Copying cached flame frames into the Uint16 index buffer costs 0.22 µs per flame (0.034 ms for 150 flames, 0.18 ms for 800). Canvas `drawImage` on a CPU-rasterised canvas costs 0.75 µs per flame at 800 flames, 3.3 times the index copy. The GPU-run canvas rows are a harness artifact and must not be quoted.

Sprites: 4 sizes at 32 px tiles (6x10 torch, 12x16 grass flame, 16x24 campfire, 24x32 house flame), 6 frames each at 10 fps, mixed evenly. Mean box 351 px, mean opaque 196 px per flame. Positions and phases come from a hash.

| Method and flame count | GPU run median | GPU run p95 | SwiftShader median | 6x throttle median | 6x throttle p95 |
|---|---:|---:|---:|---:|---:|
| Index-buffer copy from Uint16 frames, 50 flames | 0.011 | 0.011 | 0.011 | 0.073 | 0.075 |
| Index-buffer copy, 150 flames | 0.034 | 0.035 | 0.034 | 0.213 | 0.228 |
| Index-buffer copy, 200 flames | 0.045 | 0.048 | 0.044 | 0.278 | 0.312 |
| Index-buffer copy, 800 flames | 0.179 | 0.187 | 0.182 | 1.17 | 1.29 |
| Canvas drawImage from small canvases, 50 flames | artifact | | 0.039 | artifact | |
| Canvas drawImage from small canvases, 200 flames | artifact | | 0.151 | artifact | |
| Canvas drawImage from small canvases, 800 flames | artifact | | 0.594 | artifact | |
| Canvas drawImage from one atlas canvas, 800 flames | artifact | | 0.800 | artifact | |
| Canvas drawImage from one atlas ImageBitmap, 800 flames | artifact | | 0.792 | artifact | |

The SwiftShader column is the clean canvas number: that build rasterises 2D canvas on the CPU and has no GPU textures to read back. Small canvases beat one atlas with source rectangles there (0.59 against 0.80 ms at 800 flames).

Harness artifact. In the GPU run, `drawImage` measured 0.40 to 1.7 ms on the willReadFrequently canvas and 8 to 144 ms on the accelerated one. Each call ends in `getImageData`. Chromium moves a canvas that is read back often to the CPU, and then every `drawImage` from a GPU-backed source reads that source back. A game never reads its canvas back, so these rows say nothing about a real accelerated canvas. I did not measure accelerated-canvas `drawImage` without a readback.

## 3. Burn front at art resolution

Takeaway. The art burn-order map costs 1.8 ns per burning pixel: 0.082 ms at 20% of the screen, 0.42 ms at 100% (2.9 ms throttled). The Bayer 4 threshold is only 8 to 17% cheaper, so it saves nothing worth the look. A whole-tile swap is 3.6 times cheaper per frame. Kept in a cached tile layer it costs nothing between state changes.

Per burning pixel: read the tile's burn progress (0 to 383, advanced every call so every branch runs), read the 128x128 burn-order map (2x2 px clusters) and the tile's 32x32 directional ramp (one of 8, low on the side the fire came from), blend them 3:5, then pick unburnt (base art), ember line (4 levels wide), scorch (12 levels), charred tileset or ash tileset. Whole-tile swap copies 32x32 px from the base, charred or ash tileset by progress.

| Burning share of the 640x360 screen and method | GPU run median | GPU run p95 | SwiftShader median | 6x throttle median | 6x throttle p95 |
|---|---:|---:|---:|---:|---:|
| 10% (24 tiles, 23,040 px), art burn-order map | 0.039 | 0.041 | 0.040 | 0.246 | 0.276 |
| 10%, Bayer 4 threshold | 0.036 | 0.037 | 0.035 | 0.234 | 0.265 |
| 10%, whole-tile swap | 0.011 | 0.011 | 0.010 | 0.066 | 0.073 |
| 20% (48 tiles, 46,848 px), art burn-order map | 0.082 | 0.088 | 0.081 | 0.515 | 0.563 |
| 50% (120 tiles, 117,504 px), art burn-order map | 0.210 | 0.220 | 0.208 | 1.30 | 1.52 |
| 50%, Bayer 4 threshold | 0.179 | 0.185 | 0.184 | 1.08 | 1.20 |
| 50%, whole-tile swap | 0.060 | 0.061 | 0.057 | 0.382 | 0.435 |
| 100% (240 tiles, 230,400 px), art burn-order map | 0.417 | 0.435 | 0.417 | 2.88 | 5.60 |
| 100%, Bayer 4 threshold | 0.348 | 0.374 | 0.361 | 4.00 | 5.55 |
| 100%, whole-tile swap | 0.116 | 0.119 | 0.115 | 0.720 | 0.815 |
| 320x180 for scale: 20% (16 px tiles, 11,712 px), art burn-order map | 0.021 | 0.022 | 0.021 | 0.131 | 0.150 |
| 320x180 for scale: 20%, whole-tile swap | 0.0059 | 0.0060 | 0.0058 | 0.038 | 0.041 |

Inferences.
- The 640x360 front costs 3.9 times the 320x180 front at the same screen share, which is the pixel ratio. Nothing in the kernel gets worse with scale.
- A tile that has finished burning (all ash) still costs full price here. A real renderer can stop redrawing a tile once its progress passes the last band and leave the ash tileset in a cached layer. Then only tiles with a moving front cost anything (estimate: a front band is a fraction of the burning tiles, so the 20% row is an upper bound for a large fire).
- The 100% throttled rows have a wide p95 (5.6 ms against a 2.9 ms median). Under the throttle a 2 to 4 ms call meets the scheduler's pauses. Treat the median as the cost.

## 4. Spread grid (active-list CA, integer hash)

Takeaway. A tick costs about 45 ns per burning cell, at every grid size. At 32 px tiles the on-screen grid costs 0.0036 ms per tick. Finer cells cost more twice over. They hold more burning cells, and the tick rate must rise to keep the front at the same px per second. Per second of play, 16 px cells cost 8.4 times the 32 px grid and 8 px cells 65 times.

Rules: the VFX #6 sandbox spread rule. Moore neighbourhood, ignition threshold `IGN16[material] x (255 - moisture) x wind factor x 0.7 on diagonals`, a hash of (x, y, tick, seed + direction) against 16 bits, a pending flag, burn ticks from fuel, embers, ash. 75% of cells hold fuel. The seeded cells ignite their neighbours, so the burning count settles above the seed count. The table gives the measured mean over the 8 ticks between restores. No budget cap and no sort (the sandbox sorts candidates only when the cap is on).

| Grid and burning load | GPU run median, ms per tick | GPU run p95 | SwiftShader median | 6x throttle median | 6x throttle p95 | Mean burning cells | ns per burning cell (GPU run) |
|---|---:|---:|---:|---:|---:|---:|---:|
| 32 px tiles on screen, 20x12 (240 cells) | 0.0036 | 0.0037 | 0.0037 | 0.024 | 0.026 | 85 | 42 |
| 16 px cells on screen, 40x23 (920 cells) | 0.015 | 0.015 | 0.015 | 0.098 | 0.105 | 336 | 45 |
| 8 px cells on screen, 80x45 (3,600 cells) | 0.059 | 0.060 | 0.060 | 0.389 | 0.429 | 1,272 | 46 |
| Server area 256x256 tiles, active list | 0.286 | 0.306 | 0.286 | 1.75 | 2.88 | 6,361 | 45 |
| Server area 256x256 tiles, active list | 0.600 | 0.629 | 0.606 | 4.13 | 5.60 | 12,966 | 46 |
| Server area 256x256 tiles, active list | 0.909 | 0.955 | 0.927 | 6.05 | 7.20 | 18,692 | 49 |
| Server 256x256 with a full moisture sweep and full active rebuild each tick (VFX #6 sandbox shape), 6,525 burning | 0.392 | 0.404 | 0.385 | 2.52 | 3.73 | 6,525 | - |
| Server 256x256, the same, 18,627 burning | 1.08 | 1.13 | 1.08 | 7.15 | 8.95 | 18,627 | - |
| Harness restore of the 256x256 state (paid once per 8 ticks, inside the rows above) | 0.0043 | 0.0045 | 0.0044 | 0.029 | 0.031 | - | - |

Estimate for the asked range. 1,000 to 5,000 burning tiles on a 256x256 server area cost about 0.05 to 0.23 ms per tick in V8 (45 ns per burning cell, linear, as every measured row shows). The seeded rows overshot to 6,400 to 18,700 burning, so this range is interpolated, not measured.

Per second, at the tick rate that keeps the front speed in px per second (GPU run median x ticks per second):

| Grid | Tick rate | ms per tick | ms per second of play | 6x throttle, ms per second |
|---|---:|---:|---:|---:|
| 32 px tiles (20x12) | 4 Hz | 0.0036 | 0.014 | 0.10 |
| 16 px cells (40x23) | 8 Hz | 0.015 | 0.12 | 0.78 |
| 8 px cells (80x45) | 16 Hz | 0.059 | 0.94 | 6.2 |

Inferences.
- The full sweep adds 0.11 to 0.17 ms per tick at 65,536 cells. On a server that holds many such areas, keep moisture changes event-driven (rain start, water) and do not sweep every cell every tick.
- These match VFX #6 note 03 (Node, active list, 320x180 grid, about 1,500 burning): 0.056 ms per tick. Here 1,272 burning on an 80x45 grid cost 0.059 ms.

## 5. Smoke field

Takeaway. Simulating smoke is cheap at any cell size once it is one Uint8 channel: 0.0095 ms at 8 px cells (80x45), 5.8 times cheaper than the VFX #6 sandbox code as written. The cost is in drawing at art resolution, about 0.1 to 0.4 ms per frame whatever the cell size. Skipping zero spans in the bilinear row sweep cuts the plume draw by 2.8 times. The 2x2 cluster threshold costs the same as 4x4 Bayer.

Advect: semi-Lagrangian, bilinear, wind plus rise plus a sine wobble, with decay. "As written" is the sandbox's `smokeStep` (three Float32 channels for grey, oil and steam, `Math.sin` per cell). "Uint8" is one byte channel in 8.8 fixed point, the wobble from per-row and per-column tables built once per tick, decay x254/256 with floor. Velocities scale with the cell size so smoke moves the same px per second. Draw: separable bilinear (blend two field rows into a temp row once per art row, then one lerp per pixel), compare with the threshold tile, write light or dark smoke. Two fields: 30 plumes after 300 ticks (2.5 to 6% of the screen covered), and a noise-filled stress field (31% covered).

| Smoke step | GPU run median | GPU run p95 | SwiftShader median | 6x throttle median | 6x throttle p95 |
|---|---:|---:|---:|---:|---:|
| 4 px cells (160x90), advect + decay, VFX #6 sandbox as written (3 Float32 channels) | 0.244 | 0.256 | 0.240 | 1.50 | 1.57 |
| 4 px cells (160x90), advect + decay, 1 Uint8 channel | 0.035 | 0.036 | 0.036 | 0.214 | 0.228 |
| 8 px cells (80x45), advect + decay, as written | 0.055 | 0.059 | 0.058 | 0.366 | 0.385 |
| 8 px cells (80x45), advect + decay, 1 Uint8 channel | 0.0095 | 0.0097 | 0.0095 | 0.060 | 0.063 |
| 16 px cells (40x23), advect + decay, as written | 0.015 | 0.015 | 0.015 | 0.092 | 0.102 |
| 16 px cells (40x23), advect + decay, 1 Uint8 channel | 0.0028 | 0.0028 | 0.0028 | 0.018 | 0.019 |

| Smoke draw at 640x360 (field, threshold, sampling) | GPU run median | GPU run p95 | SwiftShader median | 6x throttle median | 6x throttle p95 | Coverage |
|---|---:|---:|---:|---:|---:|---:|
| 8 px cells, plumes, 2x2 cluster, bilinear | 0.273 | 0.286 | 0.278 | 1.68 | 1.87 | 2.5% |
| 8 px cells, plumes, 2x2 cluster, bilinear, zero spans skipped | 0.099 | 0.105 | 0.099 | 0.606 | 0.656 | 2.5% |
| 8 px cells, plumes, 4x4 Bayer, bilinear | 0.283 | 0.291 | 0.278 | 1.70 | 1.78 | 2.5% |
| 8 px cells, plumes, 2x2 cluster, nearest | 0.137 | 0.141 | 0.138 | 1.22 | 1.49 | 2.7% |
| 8 px cells, stress field, 2x2 cluster, bilinear | 0.408 | 0.421 | 0.429 | 2.60 | 2.85 | 31% |
| 8 px cells, stress field, 2x2 cluster, bilinear, zero spans skipped | 0.253 | 0.268 | 0.259 | 1.67 | 1.85 | 31% |
| 8 px cells, stress field, 2x2 cluster, nearest | 0.187 | 0.192 | 0.191 | 1.17 | 1.26 | 31% |
| 4 px cells, plumes, 2x2 cluster, bilinear, zero spans skipped | 0.158 | 0.164 | 0.159 | 1.04 | 1.12 | 3.5% |
| 4 px cells, stress field, 2x2 cluster, bilinear, zero spans skipped | 0.326 | 0.345 | 0.326 | 2.22 | 2.55 | 31% |
| 16 px cells, plumes, 2x2 cluster, bilinear, zero spans skipped | 0.115 | 0.117 | 0.115 | 0.757 | 0.850 | 6.1% |
| 16 px cells, stress field, 2x2 cluster, bilinear, zero spans skipped | 0.233 | 0.249 | 0.235 | 1.47 | 1.66 | 31% |

Inferences.
- Cell size is an art choice, not a cost choice, for the draw. 4 px cells cost 0.035 ms to simulate and 0.16 to 0.33 ms to draw. 16 px cells cost 0.003 ms and 0.12 to 0.23 ms.
- Nearest sampling is the cheapest draw (0.14 to 0.19 ms) but at 8 or 16 px cells it draws visible squares (the snow study found nearest at 1:4 blocky). Bilinear with zero spans skipped costs less than nearest for thin plumes and about 1.35 times nearest for a screen a third full of smoke.
- The VFX #6 smoke figure (0.31 ms in Node at 320x180) came from a 4 px field on a 320x180 canvas. Here the "as written" step at 160x90 costs 0.24 ms, the same order.

## 6. Light map

Takeaway. Building the map is cheap at any resolution: 0.0025 ms (32 px cells), 0.021 ms (8 px), 0.084 ms (4 px) for 30 fire sources. Applying it to every art pixel costs 0.21 to 0.29 ms with nearest sampling and about 0.5 ms with bilinear. That apply pass is the largest layer of the default frame.

Sources: 20 torches (radius 2.5 tiles, 80 px), 6 campfires or braziers (4 tiles), 4 burning houses (6 tiles), flicker by a hash every 4 frames. Lit area: 99% of the screen has a non-zero light value (a worst case, every torch overlaps). Apply: add the light level to a 4x4 Bayer offset and shift by 6 to get a warm tier 0 to 3, then write the tier into the palette bank bits of the Uint16 index (`index | tier << 8`). "Flat runs" writes the c px run of a light cell without the dither lookup when its tier cannot change across the Bayer band, and skips it when the tier is 0.

| Light map step | GPU run median | GPU run p95 | SwiftShader median | 6x throttle median | 6x throttle p95 |
|---|---:|---:|---:|---:|---:|
| 32 px cells (21x13 with guard cells), build from 30 sources | 0.0025 | 0.0025 | 0.0025 | 0.016 | 0.017 |
| 8 px cells (81x46), build | 0.021 | 0.021 | 0.021 | 0.142 | 0.155 |
| 4 px cells (161x91), build | 0.084 | 0.086 | 0.083 | 0.547 | 0.589 |
| 32 px cells, apply at 640x360, nearest, Bayer band | 0.281 | 0.291 | 0.283 | 1.87 | 2.90 |
| 32 px cells, apply, nearest, flat runs | 0.208 | 0.217 | 0.217 | 1.44 | 1.51 |
| 32 px cells, apply, bilinear | 0.473 | 0.481 | 0.486 | 3.23 | 3.77 |
| 8 px cells, apply, nearest | 0.294 | 0.300 | 0.291 | 1.98 | 2.92 |
| 8 px cells, apply, nearest, flat runs | 0.240 | 0.244 | 0.250 | 1.61 | 1.77 |
| 8 px cells, apply, bilinear | 0.505 | 0.525 | 0.510 | 3.25 | 3.57 |
| 4 px cells, apply, nearest | 0.289 | 0.294 | 0.297 | 2.65 | 2.95 |
| 4 px cells, apply, nearest, flat runs | 0.281 | 0.289 | 0.281 | 1.90 | 2.67 |
| 4 px cells, apply, bilinear | 0.520 | 0.532 | 0.542 | 3.47 | 3.73 |

Inferences.
- The apply pass costs the same at every map resolution, because it runs once per art pixel. A finer map costs only its build: going from 32 px to 4 px cells adds 0.08 ms on the desktop, 0.53 ms throttled. A 4 px map with nearest sampling already gives a 4 px dither step, so it can replace bilinear sampling of a coarse map for less (0.37 ms against 0.48 to 0.53 ms for build plus apply).
- On the GPU this pass is one texture read per pixel in the final shader. Moving it there would take 0.24 ms (desktop) or 1.6 ms (throttled) off the CPU frame. That is an inference, the shader path was not built here.

## 7. Embers

Takeaway. Embers cost 7 ns per particle for update plus draw. 4,096 embers cost 0.030 ms (0.196 ms throttled). The pool size is an art choice.

Pool: Float32 arrays, all slots alive, respawn from 20 fire sources with an Int32Array RNG, buoyancy, drag toward the wind, colour by age through 5 fire tones, 2x2 px while young (age above 0.6 of life) and 1 px after.

| Pool size | GPU run median, update | GPU run median, draw | GPU run median, update + draw | GPU run p95, update + draw | SwiftShader median, update + draw | 6x throttle median, update + draw | 6x throttle p95 |
|---|---:|---:|---:|---:|---:|---:|---:|
| 256 | 0.00066 | 0.00057 | 0.0019 | 0.0019 | 0.0019 | 0.012 | 0.013 |
| 512 | 0.0012 | 0.0010 | 0.0033 | 0.0034 | 0.0033 | 0.021 | 0.022 |
| 1,024 | 0.0024 | 0.0020 | 0.0066 | 0.0067 | 0.0068 | 0.043 | 0.045 |
| 4,096 | 0.0099 | 0.0081 | 0.030 | 0.030 | 0.031 | 0.196 | 0.214 |

The combined row is larger than update plus draw measured alone. In the draw-only row the embers stay near their sources after a single update, while the combined row draws moving embers across the screen (more cache misses, more 2x2 writes). Quote the combined row.

## 8. Palette pass, putImageData and texture uploads

Takeaway. The palette pass (Uint16 index to RGBA through a Uint32 table of 1,024 entries, 4 light banks) costs 0.058 ms at 640x360 and putImageData plus a 1 px sync 0.033 ms. Together that is 0.09 ms, 3.7 times the 320x180 cost. A Godot Compatibility frame that uploads the final RGBA image moves 921,600 bytes per frame (55 MB/s at 60 fps). Uploading small R8 fields instead moves kilobytes.

| Step | GPU run median | GPU run p95 | SwiftShader median | 6x throttle median | 6x throttle p95 |
|---|---:|---:|---:|---:|---:|
| 640x360 palette pass, Uint16 index to RGBA | 0.059 (pass 2) | 0.208 | 0.061 | 0.388 | 0.421 |
| 640x360 putImageData + 1 px sync, software canvas (pass 2) | 0.033 | 0.034 | 0.032 | 0.200 | 0.215 |
| 640x360 putImageData + 1 px sync, accelerated canvas (pass 2) | 0.033 | 0.034 | 0.033 | 0.198 | 0.215 |
| 320x180 palette pass | 0.015 | 0.018 | 0.016 | 0.101 | 0.109 |
| 320x180 putImageData + 1 px sync, software canvas (pass 2) | 0.0089 | 0.0092 | 0.0093 | 0.058 | 0.065 |

WebGL2 `texSubImage2D` of a whole texture plus a 1 px draw that samples it (wall is the batch slope, timer is the Metal GPU time):

| Upload, whole texture | Bytes | GPU run wall median | GPU run wall p95 | GPU run timer | SwiftShader wall median |
|---|---:|---:|---:|---:|---:|
| None (the 1 px draw alone) | 0 | 0.00033 | 0.00033 | 0.00025 | 0.015 |
| Smoke 80x45 R8 | 3,600 | 0.016 | 0.026 | 0.018 | 0.018 |
| Smoke 160x90 R8 | 14,400 | 0.015 | 0.016 | 0.014 | 0.020 |
| House-front DOOM buffer 128x96 R8 | 12,288 | 0.016 | 0.017 | 0.018 | 0.019 |
| Fire band 640x120 R8 | 76,800 | 0.024 | 0.024 | 0.015 | 0.026 |
| 320x180 R8 | 57,600 | 0.022 | 0.023 | 0.019 | 0.024 |
| 640x360 R8 (index or light map at art resolution) | 230,400 | 0.034 | 0.035 | 0.023 | 0.039 |
| 320x180 RGBA8 | 230,400 | 0.037 | 0.038 | 0.032 | 0.039 |
| 640x360 RGBA8 (the final frame) | 921,600 | 0.091 | 0.093 | 0.057 | 0.095 |

Every upload pays about 0.015 ms of fixed cost in Chromium, so a field under about 15 KB costs the same as an empty one. These are WebGL numbers, not Godot. Godot's own copies on the web export are not measured.

Bytes a Godot texture upload would move per update. On the Compatibility renderer `Texture2D.update()` replaces the whole texture, so the byte count is the full field every time (the snow study found no sub-rectangle update on Compatibility). Computed from the field sizes, not measured:

| Field | Cells | R8 bytes | RG8 / R16 bytes | RGBA8 bytes | RGBA8 at 60 updates/s |
|---|---:|---:|---:|---:|---:|
| Final frame 640x360 | 230,400 | - | - | 921,600 | 55.3 MB/s |
| Index buffer 640x360 (R8 if 256 indices are enough, RG8 for the Uint16 index with light banks) | 230,400 | 230,400 | 460,800 | - | - |
| Final frame 320x180 (for scale) | 57,600 | 57,600 | 115,200 | 230,400 | 13.8 MB/s |
| Spread grid state, 32 px tiles on screen 20x12 (one byte per tile, 4 Hz) | 240 | 240 | 480 | 960 | - |
| Burn progress per tile, 20x12 | 240 | 240 | - | - | - |
| Burn-order map 128x128 (static, uploaded once) | 16,384 | 16,384 | - | - | - |
| Light map 32 px cells (20x12) | 240 | 240 | - | 960 | 58 KB/s |
| Light map 8 px cells (80x45) | 3,600 | 3,600 | - | 14,400 | 864 KB/s |
| Light map 4 px cells (160x90) | 14,400 | 14,400 | - | 57,600 | 3.5 MB/s |
| Smoke 16 px cells (40x23) | 920 | 920 | - | 3,680 | 221 KB/s |
| Smoke 8 px cells (80x45) | 3,600 | 3,600 | - | 14,400 | 864 KB/s |
| Smoke 4 px cells (160x90) | 14,400 | 14,400 | - | 57,600 | 3.5 MB/s |
| DOOM torch 8x24, 1:1 / 1:2 | 192 / 48 | 192 / 48 | - | 768 / 192 | - |
| DOOM campfire 32x48, 1:1 / 1:2 | 1,536 / 384 | 1,536 / 384 | - | 6,144 / 1,536 | - |
| DOOM bonfire 64x96, 1:1 / 1:2 | 6,144 / 1,536 | 6,144 / 1,536 | - | 24,576 / 6,144 | - |
| DOOM house front 128x96, 1:1 / 1:2 | 12,288 / 3,072 | 12,288 / 3,072 | - | 49,152 / 12,288 | - |
| DOOM band 640x120, 1:1 / 1:2 | 76,800 / 19,200 | 76,800 / 19,200 | - | 307,200 / 76,800 | 4.6 MB/s (R8, 1:1) |
| 20 DOOM torches in one atlas, 1:1 / 1:2 | 3,840 / 960 | 3,840 / 960 | - | 15,360 / 3,840 | 230 KB/s (R8, 1:1) |

The RGBA8 per-second column is for the RGBA8 column. R8 per second is a quarter of it.

## 9. WebGL2 noise fire (FBM fragment shader)

Takeaway. On a real GPU a noise fire over the whole 640x360 target is close to free: 0.022 ms of GPU time for 5 octaves. Without a GPU (SwiftShader) the same pass costs 0.51 ms of wall time. Pixel snapping to 2 px saves nothing, because the shader still runs once per pixel. Rendering into a 320x180 target saves 3.6 times in wall time on Metal (3.0 times in timer time) and 3.8 times on SwiftShader.

Shader: value-noise FBM, 1 noise unit = 1 tile (32 px), scrolling up 1.5 tiles per second, heat = FBM x 1.4 minus height, `discard` below a threshold, 5-tone ramp, `floor(gl_FragCoord / snap) * snap` for the pixel snap. One draw per frame into an FBO.

| Pass | Pixels | GPU run wall median | GPU run wall p95 | GPU run timer (Metal) | GPU run JS ms per frame | SwiftShader wall median |
|---|---:|---:|---:|---:|---:|---:|
| 640x360 full screen, 1 px snap, 3 octaves | 230,400 | 0.015 | 0.017 | 0.014 | under 0.001 | 0.399 |
| 640x360 full screen, 1 px snap, 5 octaves | 230,400 | 0.027 | 0.034 | 0.022 | under 0.001 | 0.510 |
| 640x360 full screen, 2 px snap, 5 octaves | 230,400 | 0.027 | 0.031 | 0.022 | under 0.001 | 0.512 |
| 640x120 band (viewport), 5 octaves | 76,800 | 0.0079 | 0.011 | 0.0076 | under 0.001 | 0.170 |
| 320x180 target (1:2, upscaled later), 5 octaves | 57,600 | 0.0077 | 0.0083 | 0.0075 | under 0.001 | 0.134 |
| 128x96 house front (viewport), 5 octaves | 12,288 | 0.0041 | 0.0043 | 0.0039 | under 0.001 | 0.033 |

Inferences.
- The band costs 0.388 ms as a DOOM buffer at 1:1 on the CPU and 0.0076 ms of GPU time as a shader. On a machine without a GPU the shader band (0.17 ms) still beats the DOOM band at 1:1 (0.39 ms) and costs about what DOOM at 1:2 does (0.11 ms).
- A Metal M4 Pro says nothing about a phone's fill rate. A phone GPU may be 10 to 30 times slower in fill (estimate, not measured), which would still put the 5-octave full screen pass under 1 ms.

## 10. Whole frame

Takeaway. The default effects frame costs 0.62 ms at 640x360 and 0.21 ms at 320x180 on the M4 Pro (3.0 times). Throttled 6x it costs 4.9 ms and 1.24 ms (3.9 times), 29% and 7% of the 16.7 ms budget. Light apply and smoke draw are 62% of the 640x360 frame. Both are per-pixel passes that a shader would take off the CPU.

Frame contents, same scene at both sizes. Fields keep their cell counts and pixel work scales with the canvas.
- Spread grid at 32 px tiles, 20x12, ticked every 15th frame (4 Hz at 60 fps), restored every 8 ticks, mean 85 burning.
- Ground copy: `IDX.set(BASE)`. This is a stand-in for the ground render, not a real ground render.
- Burn front with the art map, 20% of the tiles.
- 150 drawn flame loops, index-buffer copy (sprite sizes halved at 320x180).
- 512 embers, update and draw, mixed sizes.
- Smoke 80x45 Uint8 advect plus a bilinear draw with zero spans skipped and a 2x2 cluster threshold (8 px cells at 640, 4 px at 320).
- Light map 80x45 (8 px cells at 640, 4 px at 320), build from 30 sources plus nearest apply with flat runs.
- Palette pass, then putImageData with a 1 px sync on the software canvas.

Whole-frame wall time (pass 2, fresh page):

| Frame | GPU run median | GPU run p95 | SwiftShader median | SwiftShader p95 | 6x throttle median | 6x throttle p95 |
|---|---:|---:|---:|---:|---:|---:|
| Default at 640x360 | 0.624 | 0.656 | 0.631 | 0.644 | 4.90 | 5.65 |
| Default at 320x180 | 0.206 | 0.210 | 0.204 | 0.210 | 1.24 | 1.29 |
| Ratio 640 / 320 | 3.0 | | 3.1 | | 3.9 | |

Per-layer breakdown (pass 2, mean ms over 600 frames, `performance.now()` between layers, 0.1 ms timer resolution averaged out):

| Layer | 640x360, GPU run | 640x360, 6x throttle | 320x180, GPU run | 320x180, 6x throttle | Share of the 640x360 GPU-run frame |
|---|---:|---:|---:|---:|---:|
| Spread tick (4 Hz, 1 in 15 frames) | 0.0008 | 0.002 | 0.0003 | 0.007 | 0% |
| Ground copy (stand-in) | 0.0088 | 0.044 | 0.0032 | 0.0083 | 1% |
| Burn front (art map, 20%) | 0.074 | 0.545 | 0.020 | 0.170 | 12% |
| Drawn loops (150) | 0.035 | 0.209 | 0.011 | 0.062 | 6% |
| Embers (512, mixed) | 0.0040 | 0.023 | 0.0035 | 0.029 | 1% |
| Smoke 80x45 advect + draw | 0.109 | 0.702 | 0.045 | 0.293 | 18% |
| Light map build + apply | 0.274 | 1.64 | 0.099 | 0.580 | 44% |
| Palette pass | 0.061 | 0.384 | 0.016 | 0.118 | 10% |
| putImageData + 1 px sync | 0.035 | 0.213 | 0.010 | 0.074 | 6% |
| Sum | 0.601 | 3.76 | 0.207 | 1.34 | |

The throttled layer sums differ from the throttled frame medians (3.76 against 4.90 ms at 640x360, 1.34 against 1.24 ms at 320x180). The per-layer `performance.now()` calls fall into the throttle's pause windows unevenly. Quote the frame median as the total and the layer column as shares.

Inferences.
- Scale cost by layer at 640 against 320 (GPU run): burn front 3.7 times, loops 3.3 times, smoke 2.4 times, light 2.8 times, palette 3.9 times. Pixel passes approach the 4 times pixel ratio. Field simulations stay flat.
- This frame has no ground render, characters, objects or DOOM flames. The snow study measured its 640x360 ground render at 1.44 ms (8.85 ms throttled), 68 to 71% of its frame. Add a ground render of that size and the fire effects are about 30% of a CPU frame (estimate).
- Moving light apply and smoke draw into the final fragment shader (one texture read each) would leave about 0.24 ms on the CPU at 640x360 and about 1.6 ms throttled (estimate from the layer table).

## Harness notes

- Pass 2. In the full GPU run, `putImageData` on the willReadFrequently canvas measured 0.32 ms, against 0.033 ms in an earlier probe and in pass 2. The canvas `drawImage` tests that run before it read back an accelerated canvas many times, and Chromium changed how the shared canvases are backed. I reran the palette and frame rows on a fresh page in all three setups (`results-*-cpu-pass2.json`). The tables above use pass 2 for those rows. Pass 1 frame medians were 0.867 ms (GPU run), 0.618 ms (SwiftShader) and 6.05 ms (throttled).
- Smoke coverage. The first field design covered 1% of the screen, because integer floors in the advect lost about 1 unit per cell per tick. Adding rounding to the bilinear step and adding 30 sources gave 2.5 to 6%. The stress field is a separate synthetic fill, so the draw is measured at a realistic heavy-smoke coverage (31%).
- zsh does not split an unquoted variable, so one scripted throttle run first failed with a bad argument. It was rerun by hand. No numbers were affected.

## Gaps

- No GDScript or Godot web-export numbers. The GDScript penalty (15 to 50 times on per-cell loops) comes from VFX #6 note 03, not from this bench.
- No accelerated-canvas `drawImage` cost without a readback. The GPU-run canvas rows are artifacts.
- No phone. The 6x throttle is a main-thread proxy.
- The light and smoke shader paths (texture reads in the final shader) are estimated from the CPU layer costs, not built.
- The 1,000 to 5,000 burning range on the 256x256 server area is interpolated from rows at 6,400 to 18,700 burning.

## Sources

- Bench page, runner and raw results: `studies/vfx-fire-32px/notes/bench/` (this study).
- Harness, `fresh()` and Int32Array RNG rules, Compatibility whole-texture uploads: `studies/vfx-snow-32px/notes/15-benchmarks.md` and `studies/vfx-snow-32px/notes/bench/`.
- VFX #6 measurements (Node and GDScript at 320x180, fire CA and smoke): `studies/vfx-fire/notes/03-grid-spread-smoke.md`.
- Ported engine code (spread rule, wind factors, smoke step, DOOM kernel, flame sprite generator): `studies/vfx-fire/sandbox.html`.
- DOOM PSX fire, the series reference: https://fabiensanglard.net/doom_fire_psx/
- `EXT_disjoint_timer_query_webgl2`: https://registry.khronos.org/webgl/extensions/EXT_disjoint_timer_query_webgl2/
- `Emulation.setCPUThrottlingRate`: https://chromedevtools.github.io/devtools-protocol/tot/Emulation/#method-setCPUThrottlingRate
- Canvas `willReadFrequently`: https://html.spec.whatwg.org/multipage/canvas.html#concept-canvas-will-read-frequently
