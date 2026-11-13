# 15 Benchmarks: what the snow engine costs at 640x360 (measured)

Lens: runtime efficiency. Every number below is my own measurement on 12 Nov 2026 unless it is marked as an inference. Times are ms per call. The frame budget is 16.7 ms (60 fps).

The question: the VFX #1 engine runs on a 320x180 canvas with 8 px tiles and a 57,600-cell field. What does each part cost on a 640x360 canvas with 32 px tiles, and which choices keep it cheap?

Short answer. A straight 1:1 port costs 4.0 to 4.3 times the old frame (2.4 to 2.5 ms against 0.58 to 0.59 ms on an M4 Pro) and fills 87 to 93% of the frame budget on the 6x-throttle proxy. Keeping the field at 320x180 and sampling it bilinearly costs 1.36 to 1.44 ms, 2.3 to 2.6 times the old frame. Moving the ground render into one WebGL2 shader brings the frame to 0.08 to 0.10 ms on a real GPU, below the old engine.

## Setup

- Machine: Apple M4 Pro (10 performance + 4 efficiency cores, 48 GB), macOS 26.5.1 (25F80). Playwright 1.63.0 on Python 3.13.5, Chromium 153.0.8010.12.
- Bench page: `studies/vfx-snow-32px/notes/bench/snowbench.html`. Self-contained, no dependencies. Open it in any browser and call `runCPU()` or `await runGPU()` from the console. Both take `{only: 'regex'}`.
- Runner: `studies/vfx-snow-32px/notes/bench/run.py` (`python run.py gpu|swiftshader [throttle6] [mode=cpu|gpu|all] [only=<regex>] [tag=<suffix>]`).
- Raw results, beside the runner: `results-gpu.json`, `results-swiftshader.json`, `results-gpu-throttle6.json`, `results-swiftshader-throttle6.json` (288 tests each, pass 1) and four `results-*-pass2.json` files (flakes and whole frames, run again on a fresh page). Every row stores median, p95, p10, p90, min and the sample count. The pass 1 flake rows had a harness flaw (the test redrew the ground with a cold function every 256 calls), so the flake tables use pass 2. The page in `bench/` is the fixed one. Two code comments in it were reworded after the runs.
- Logs, probes and the table script (`merge.py`, output `tables.md`) are in `notes/scratch-bench/`.
- Method: the same as `studies/vfx-magic/notes/12-benchmarks.md` and `studies/vfx-magic/notes/bench/run.py`.

### The four runs

| Name in this note | Browser build | WebGL renderer | CPU throttle |
|---|---|---|---|
| GPU run | full Chromium, new headless, `--use-angle=metal --enable-gpu --ignore-gpu-blocklist` | `ANGLE (Apple, ANGLE Metal Renderer: Apple M4 Pro)` | none |
| SwiftShader run | chromium-headless-shell | `ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (LLVM 10.0.0)))`, a CPU rasteriser | none |
| 6x throttle | the GPU run's build | Metal | `Emulation.setCPUThrottlingRate` 6 through CDP |
| SwiftShader + 6x throttle | chromium-headless-shell | SwiftShader | 6 |

All four runs finished with 0 page errors and 0 failed tests. The two SwiftShader runs print 4 driver warnings each, "GPU stall due to ReadPixels". That is the deliberate sync.

### How a number is made

- CPU tests: 200 ms warm-up, then 31 samples. Each sample calls the function until 10 ms have passed and stores the mean ms per call. The table shows the median and the p95 of those 31 sample means. Under the throttle and for the 960x540 rows a call can exceed 10 ms, and then a sample is one call.
- WebGL2 tests: wall ms per frame is the slope between a batch of 1 frame and a batch of K frames. Each batch ends in a 1x1 `readPixels`, so the fixed cost of the sync cancels. 21 samples. Every draw blends (alpha 0.98) so a tile-based GPU cannot throw away the repeated full-screen draws. On Metal the page also records a GPU timer query (`EXT_disjoint_timer_query_webgl2`) and the JavaScript-side time per frame when nothing waits for the GPU.
- Scene: the VFX #1 sandbox scene (house, 10 pines, fence, 5 rocks, lamp, path, pond), copied from `studies/vfx-snow/sandbox.html` and resampled to each size. At 640x360 the house is 142 px wide (4.4 tiles of 32 px) and a pine canopy is 46 px (1.4 tiles). The depth field starts from a noise pattern and 150 settle ticks. 80 to 83% of the snow-holding cells are covered, mean depth 25 units.
- Sim rules, stamp, flake update, palette build, palette pass and the ground loop are copied from the sandbox. The 32 px renderer, the boot stamp and the 24x32 sprites are new and described at their tables.
- Canvas tests write to a 2D canvas created with `willReadFrequently: true` (a software canvas) and end with a 1x1 `getImageData`.

### Two harness rules that changed the numbers

1. Every engine instance is compiled from its own source text (`fresh()` in the page). Without this rule only the first closure made from a function literal ran at full speed. The same palette pass measured 0.078 ms or 0.15 ms and the same ground loop 0.32 to 0.50 ms, depending on which test ran first (`scratch-bench/probe3-output.txt`, run A). The likely cause is that V8 specialises a loop to its buffers only while one closure of that literal exists (inference). A real page builds its engine once, so the fast case is the right one to measure.
2. The RNG state lives in an `Int32Array`. The sandbox keeps it in a `let rs` variable. With a script-level `let` and nothing else changed, the same sim tick measured 0.063 ms on a fresh page and 0.21 to 0.24 ms after the character, stamp or flake tests had run (`scratch-bench/probe4-output.txt`). With the typed array it is 0.065 to 0.067 ms in every order. The sequence of random numbers is the same. The sandbox's `let rs` sits inside a function, and I did not test which state it lands in.

### Limits

- Headless Chromium on one machine. No vsync and no compositor. The step that presents the canvas on screen and scales it to the window is in no number here.
- The machine was in normal desktop use. The load average was 6 to 15 on 14 cores during the runs. Unthrottled whole-frame medians moved by at most 8% between pass 1 and pass 2. Throttled ones moved by up to 12%, and one row by 19% (see the repeat table in item 7).
- JavaScript is not GDScript. V8 compiles these loops to machine code. Nothing here was run in Godot. Read the CPU numbers as the floor for a compiled port. A GDScript port of a per-pixel loop will be slower by a factor I did not measure.
- The 6x throttle is a proxy for a low-end phone, not a phone. It pauses the page's main thread for five sixths of the time. The measured slowdown on the CPU tests was 5.8x (p10), 6.1x (median) and 6.8x (p90). It does not slow the GPU process, so SwiftShader rasterisation and driver work run at full speed. It does not model a phone's smaller caches. A 230,400-cell field with its class, packed, wet, shadow, exposure and limit maps is 3.0 MB, which fits this CPU's cache and may not fit a phone's.
- `performance.now()` has 0.1 ms resolution in these builds. That is why every sample runs for 10 ms. The p95 is a p95 of sample means. For calls shorter than 10 ms it hides single slow calls such as a garbage-collection pause. For calls longer than 10 ms a sample is one call, so the p95 is per call.
- The Metal numbers come from an M4 Pro GPU. They show that the shader is light. They say nothing about a phone's fill rate.
- The two browser builds agree on the CPU tests. The SwiftShader run is 1.01 times the GPU run at the median (p10 0.95, p90 1.07).
- Bilinear sampling in this bench blends depth across object edges (roof against ground). A real renderer has to stop that with a class mask. That cost is not in the numbers.

## 1. Sim ticks

Takeaway. Tick cost follows the pick count. A pick costs 3 to 16 ns here, and going from 57,600 to 518,400 cells adds 3 to 17% per pick. So the 1:1 field costs 4.2 times the 1:2 field per tick, and the 1:4 field costs a quarter.

Pick counts per tick are the VFX #1 counts times cells / 57,600. That is 15.6 deposit, 69.4 relax, 24.3 creep, 26.0 melt and 27.8 evaporation picks per 1,000 cells. "Snowing" is intensity 1, wind 0.6, -3.5 °C. "Thaw" is no snowfall, 6 °C, sun 0.9. "All five at full count" runs every pass at its nominal count, a state the sandbox never reaches in one tick.

| Pass and field size | Picks per tick | GPU run, median ms | GPU run, p95 ms | SwiftShader run, median ms | 6x throttle, median ms | 6x throttle, p95 ms |
|---|---:|---:|---:|---:|---:|---:|
| Deposit, 14,400 cells (160x90) | 225 | 0.0018 | 0.0020 | 0.0019 | 0.011 | 0.012 |
| Sandpile relax, 14,400 cells (160x90) | 1,000 | 0.013 | 0.014 | 0.014 | 0.083 | 0.089 |
| Wind creep, 14,400 cells (160x90) | 350 | 0.0034 | 0.0035 | 0.0037 | 0.021 | 0.022 |
| Melt, 14,400 cells (160x90) | 375 | 0.0058 | 0.0061 | 0.0061 | 0.033 | 0.034 |
| Evaporation, 14,400 cells (160x90) | 400 | 0.0013 | 0.0013 | 0.0013 | 0.0082 | 0.0088 |
| All five passes at full count, 14,400 cells (160x90) | 2,350 | 0.025 | 0.026 | 0.026 | 0.159 | 0.169 |
| Tick while snowing (wind 0.6), 14,400 cells (160x90) | 1,510 | 0.017 | 0.017 | 0.017 | 0.106 | 0.111 |
| Tick in a sunny thaw (6 °C), 14,400 cells (160x90) | 2,006 | 0.023 | 0.023 | 0.025 | 0.147 | 0.155 |
| Deposit, 57,600 cells (320x180) | 900 | 0.0072 | 0.0076 | 0.0079 | 0.045 | 0.046 |
| Sandpile relax, 57,600 cells (320x180) | 4,000 | 0.051 | 0.052 | 0.053 | 0.325 | 0.332 |
| Wind creep, 57,600 cells (320x180) | 1,400 | 0.013 | 0.014 | 0.014 | 0.081 | 0.083 |
| Melt, 57,600 cells (320x180) | 1,500 | 0.021 | 0.022 | 0.022 | 0.138 | 0.146 |
| Evaporation, 57,600 cells (320x180) | 1,600 | 0.0048 | 0.0049 | 0.0049 | 0.030 | 0.032 |
| All five passes at full count, 57,600 cells (320x180) | 9,400 | 0.105 | 0.108 | 0.110 | 0.641 | 0.693 |
| Tick while snowing (wind 0.6), 57,600 cells (320x180) | 6,040 | 0.067 | 0.068 | 0.071 | 0.421 | 0.455 |
| Tick in a sunny thaw (6 °C), 57,600 cells (320x180) | 8,023 | 0.095 | 0.096 | 0.097 | 0.594 | 0.644 |
| Deposit, 230,400 cells (640x360) | 3,600 | 0.030 | 0.032 | 0.032 | 0.184 | 0.194 |
| Sandpile relax, 230,400 cells (640x360) | 16,000 | 0.213 | 0.235 | 0.217 | 1.31 | 1.43 |
| Wind creep, 230,400 cells (640x360) | 5,600 | 0.060 | 0.062 | 0.060 | 0.332 | 0.357 |
| Melt, 230,400 cells (640x360) | 6,000 | 0.092 | 0.095 | 0.096 | 0.572 | 0.600 |
| Evaporation, 230,400 cells (640x360) | 6,400 | 0.022 | 0.030 | 0.022 | 0.132 | 0.137 |
| All five passes at full count, 230,400 cells (640x360) | 37,600 | 0.435 | 0.459 | 0.468 | 2.77 | 3.08 |
| Tick while snowing (wind 0.6), 230,400 cells (640x360) | 24,160 | 0.281 | 0.289 | 0.300 | 1.73 | 1.87 |
| Tick in a sunny thaw (6 °C), 230,400 cells (640x360) | 32,092 | 0.400 | 0.417 | 0.421 | 2.48 | 2.73 |
| Deposit, 518,400 cells (960x540) | 8,100 | 0.070 | 0.077 | 0.082 | 0.421 | 0.439 |
| Sandpile relax, 518,400 cells (960x540) | 36,000 | 0.468 | 0.476 | 0.486 | 2.88 | 3.17 |
| Wind creep, 518,400 cells (960x540) | 12,600 | 0.130 | 0.133 | 0.137 | 0.757 | 0.815 |
| Melt, 518,400 cells (960x540) | 13,500 | 0.212 | 0.217 | 0.217 | 1.32 | 1.43 |
| Evaporation, 518,400 cells (960x540) | 14,400 | 0.051 | 0.052 | 0.052 | 0.303 | 0.312 |
| All five passes at full count, 518,400 cells (960x540) | 84,600 | 1.00 | 1.06 | 1.05 | 6.35 | 7.20 |
| Tick while snowing (wind 0.6), 518,400 cells (960x540) | 54,360 | 0.637 | 0.662 | 0.667 | 3.90 | 4.17 |
| Tick in a sunny thaw (6 °C), 518,400 cells (960x540) | 72,207 | 0.909 | 0.955 | 0.955 | 5.70 | 6.25 |

Quote the "GPU run, median" column for a desktop and the "6x throttle, median" column for the low-end case. The compact view:

| Tick (GPU run median / 6x throttle median, ms) | 14,400 cells | 57,600 cells | 230,400 cells | 518,400 cells |
|---|---:|---:|---:|---:|
| All five passes at full count | 0.025 / 0.159 | 0.105 / 0.641 | 0.435 / 2.77 | 1.00 / 6.35 |
| Tick while snowing (wind 0.6) | 0.017 / 0.106 | 0.067 / 0.421 | 0.281 / 1.73 | 0.637 / 3.90 |
| Tick in a sunny thaw (6 °C) | 0.023 / 0.147 | 0.095 / 0.594 | 0.400 / 2.48 | 0.909 / 5.70 |

Cost per pick (derived from the table above):

| Pass | Picks at 57,600 cells | ns per pick, 57,600 cells, GPU run median | ns per pick, 57,600 cells, 6x throttle median | ns per pick, 230,400 cells, GPU run median | ns per pick, 518,400 cells, GPU run median |
|---|---:|---:|---:|---:|---:|
| Deposit | 900 | 7.9 | 50 | 8.4 | 8.7 |
| Sandpile relax | 4,000 | 12.6 | 81 | 13.3 | 13.0 |
| Wind creep | 1,400 | 9.6 | 58 | 10.6 | 10.3 |
| Melt | 1,500 | 14.2 | 92 | 15.3 | 15.7 |
| Evaporation | 1,600 | 3.0 | 19 | 3.5 | 3.5 |

Notes.
- One tick per frame is 1x speed. The sandbox starts at speed 2, which is 2 ticks per frame. Add one row of the table per extra tick.
- Equal picks per 1,000 cells keep the deposit and melt rate per cell equal. They do not keep transport equal. A relax or creep pick moves snow by one cell, and a cell at 1:1 is half as long as a cell at 1:2. To blow a drift across a tile in the same time, a 1:1 field needs 2 times the creep picks per cell, which is 8 times the 1:2 total (inference from the rule, not measured).
- The VFX #1 report §8 gives about 3 to 9 ms of sim time per frame at 2 to 16x sim speed, read from the sandbox HUD. Here 16 ticks cost 1.07 ms (16 x 0.067). The `let rs` slow state (0.21 to 0.24 ms per tick) and a headless frame rate below 60 fps would explain the gap. That is an inference.

## 2. Ground render on the CPU

Takeaway. The ground pass is 68 to 71% of every CPU frame. At 640x360 the VFX #1 loop costs 1.44 ms (8.85 ms throttled, 53% of the budget). Nearest sampling of a coarse field costs the same as a 1:1 field. Bilinear sampling with per-pixel weight tables costs 3 times as much as nearest. A 1:2 upsample with fixed 9/3/3/1 weights costs 0.135 ms, 4.4 times less than the table version.

All variants write a palette-index byte per art pixel. Every variant tests the art-resolution class map first and copies the base index for solid pixels.

- (a) to (d) sample the field and compare with a 4x4 Bayer value. Covered pixels get one snow index.
- (e) reads the threshold from four 32x32 art threshold tiles (clustered, 2 px blocks, values 1 to 30). A hash picks one tile per 32 px tile.
- (f) adds a 4-neighbour emboss and 3 bands. For a coarse field the four neighbours are field cells.
- "Upsample only" writes a bilinear art-resolution depth buffer and nothing else.
- "Full 32 px renderer" is two passes. Pass 1 computes bilinear depth against the art tile and stores a coverage byte. Pass 2 draws an edge shadow line where the south or east neighbour is bare, a highlight rim where the north or west neighbour is bare, 3 bands by depth, packed trail colours, wet ground, sun shadow and sparkle.
- "VFX #1 loop as written" is the sandbox `render()` ground loop: float threshold per pixel, emboss with class checks, 5 shades and 2 packed shades.

At 640x360, the size that matters:

| Ground pass into the index buffer at 640x360 | GPU run, median ms | GPU run, p95 ms | SwiftShader run, median ms | 6x throttle, median ms | 6x throttle, p95 ms |
|---|---:|---:|---:|---:|---:|
| VFX #1 loop as written (float threshold, emboss with class checks, 5 shades), snowing | 1.44 | 1.47 | 1.44 | 8.85 | 10.1 |
| VFX #1 loop as written, sunny (shadow + sparkle on) | 1.88 | 1.92 | 2.24 | 12.8 | 14.0 |
| (a) field 1:1 nearest, Bayer 4x4, flat | 0.291 | 0.294 | 0.297 | 1.85 | 2.75 |
| (a) the same, writing RGBA directly (no index buffer) | 0.329 | 0.348 | 0.326 | 2.06 | 3.05 |
| (b) field 1:2 nearest, Bayer, flat | 0.289 | 0.294 | 0.286 | 1.73 | 1.88 |
| (c) field 1:2 bilinear (table weights), Bayer, flat | 0.867 | 0.883 | 0.858 | 5.30 | 5.65 |
| field 1:4 nearest, Bayer, flat | 0.291 | 0.297 | 0.286 | 1.73 | 1.83 |
| (d) field 1:4 bilinear, Bayer, flat | 0.875 | 0.900 | 0.883 | 5.20 | 5.70 |
| (e) field 1:1 nearest, 32x32 art threshold tile, flat | 0.408 | 0.435 | 0.412 | 3.37 | 3.83 |
| (e) field 1:2 nearest, art tile, flat | 0.404 | 0.417 | 0.408 | 2.75 | 3.97 |
| (e) field 1:2 bilinear, art tile, flat | 1.00 | 1.06 | 0.982 | 5.95 | 6.30 |
| (e) field 1:4 bilinear, art tile, flat | 1.03 | 1.05 | 1.03 | 5.90 | 6.45 |
| (f) field 1:1 nearest, Bayer, emboss + 3 bands | 0.713 | 0.850 | 0.721 | 5.60 | 6.40 |
| (f) field 1:1 nearest, art tile, emboss + 3 bands | 0.721 | 0.764 | 0.743 | 4.67 | 5.65 |
| (f) field 1:2 nearest, art tile, emboss from field cells + 3 bands | 0.650 | 0.656 | 0.673 | 3.90 | 4.60 |
| (f) field 1:2 bilinear, art tile, emboss from field cells + 3 bands | 1.44 | 1.50 | 1.46 | 8.40 | 9.50 |
| (f) field 1:4 bilinear, art tile, emboss from field cells + 3 bands | 1.34 | 1.66 | 1.35 | 8.00 | 8.55 |
| Upsample only, 1:2 bilinear with table weights | 0.594 | 0.714 | 0.594 | 4.00 | 4.37 |
| Upsample only, 1:2 with fixed 9/3/3/1 weights | 0.135 | 0.137 | 0.130 | 0.862 | 0.945 |
| Upsample only, 1:4 bilinear with table weights | 0.680 | 0.736 | 0.644 | 4.13 | 4.50 |
| Two passes: upsample 1:2 (table weights), then art tile + emboss at art resolution | 1.47 | 1.67 | 1.29 | 10.0 | 10.8 |
| Two passes: upsample 1:2 (9/3/3/1), then art tile + emboss at art resolution | 0.823 | 0.892 | 0.785 | 4.87 | 5.35 |
| Full 32 px renderer, field 1:2, table weights, snowing | 1.57 | 1.61 | 1.63 | 9.45 | 10.0 |
| Full 32 px renderer, field 1:2, 9/3/3/1 weights, snowing | 0.945 | 1.04 | 1.01 | 5.80 | 6.30 |
| Full 32 px renderer, field 1:2, 9/3/3/1 weights, sunny | 1.17 | 1.22 | 1.18 | 6.95 | 7.35 |
| Full 32 px renderer, field 1:4, table weights, snowing | 1.63 | 1.68 | 1.59 | 9.50 | 10.1 |

Quote the "6x throttle, median" column for the low-end case. Throttled rows carry up to 20% noise. Where two throttled rows disagree with their unthrottled order, trust the unthrottled order.

All three sizes, as GPU run median / 6x throttle median:

| Ground pass (GPU run median / 6x throttle median, ms) | 320x180 | 640x360 | 960x540 |
|---|---:|---:|---:|
| VFX #1 loop as written (float threshold, emboss with class checks, 5 shades), snowing | 0.337 / 2.06 | 1.44 / 8.85 | 3.33 / 21.2 |
| VFX #1 loop as written, sunny (shadow + sparkle on) | 0.412 / 3.10 | 1.88 / 12.8 | 4.47 / 29.5 |
| (a) field 1:1 nearest, Bayer 4x4, flat | 0.072 / 0.439 | 0.291 / 1.85 | 0.729 / 6.10 |
| (a) the same, writing RGBA directly (no index buffer) | 0.080 / 0.476 | 0.329 / 2.06 | 0.757 / 5.03 |
| (b) field 1:2 nearest, Bayer, flat | 0.072 / 0.429 | 0.289 / 1.73 | 0.687 / 6.20 |
| (c) field 1:2 bilinear (table weights), Bayer, flat | 0.217 / 1.30 | 0.867 / 5.30 | 1.98 / 15.0 |
| field 1:4 nearest, Bayer, flat | 0.073 / 0.438 | 0.291 / 1.73 | 0.680 / 5.75 |
| (d) field 1:4 bilinear, Bayer, flat | 0.217 / 1.34 | 0.875 / 5.20 | 2.00 / 14.8 |
| (e) field 1:1 nearest, 32x32 art threshold tile, flat | 0.089 / 0.574 | 0.408 / 3.37 | 1.01 / 8.50 |
| (e) field 1:2 nearest, art tile, flat | 0.093 / 0.556 | 0.404 / 2.75 | 0.909 / 8.55 |
| (e) field 1:2 bilinear, art tile, flat | 0.253 / 1.46 | 1.00 / 5.95 | 2.36 / 17.1 |
| (e) field 1:4 bilinear, art tile, flat | 0.246 / 1.49 | 1.03 / 5.90 | 2.85 / 16.9 |
| (f) field 1:1 nearest, Bayer, emboss + 3 bands | 0.137 / 0.867 | 0.713 / 5.60 | 1.68 / 10.5 |
| (f) field 1:1 nearest, art tile, emboss + 3 bands | 0.145 / 0.908 | 0.721 / 4.67 | 1.93 / 14.0 |
| (f) field 1:2 nearest, art tile, emboss from field cells + 3 bands | 0.143 / 0.875 | 0.650 / 3.90 | 1.59 / 10.0 |
| (f) field 1:2 bilinear, art tile, emboss from field cells + 3 bands | 0.297 / 1.85 | 1.44 / 8.40 | 3.77 / 18.9 |
| (f) field 1:4 bilinear, art tile, emboss from field cells + 3 bands | 0.306 / 1.80 | 1.34 / 8.00 | 3.60 / 18.0 |
| Upsample only, 1:2 bilinear with table weights | 0.147 / 0.927 | 0.594 / 4.00 | 1.32 / 7.80 |
| Upsample only, 1:2 with fixed 9/3/3/1 weights | 0.033 / 0.200 | 0.135 / 0.862 | 0.291 / 1.75 |
| Upsample only, 1:4 bilinear with table weights | 0.151 / 0.917 | 0.680 / 4.13 | 1.34 / 8.40 |
| Two passes: upsample 1:2 (table weights), then art tile + emboss at art resolution | 0.294 / 1.73 | 1.47 / 10.0 | 3.43 / 20.7 |
| Two passes: upsample 1:2 (9/3/3/1), then art tile + emboss at art resolution | 0.180 / 1.11 | 0.823 / 4.87 | 2.00 / 14.9 |
| Full 32 px renderer, field 1:2, table weights, snowing | 0.381 / 2.30 | 1.57 / 9.45 | 3.77 / 23.2 |
| Full 32 px renderer, field 1:2, 9/3/3/1 weights, snowing | 0.212 / 1.32 | 0.945 / 5.80 | 2.18 / 13.6 |
| Full 32 px renderer, field 1:2, 9/3/3/1 weights, sunny | 0.268 / 1.64 | 1.17 / 6.95 | 2.65 / 17.1 |
| Full 32 px renderer, field 1:4, table weights, snowing | 0.388 / 2.34 | 1.63 / 9.50 | 3.67 / 23.3 |

The p95 values for 320x180 and 960x540 are in the JSON files.

The palette pass and the palette build:

| Palette pass | GPU run, median ms | GPU run, p95 ms | SwiftShader run, median ms | 6x throttle, median ms | 6x throttle, p95 ms |
|---|---:|---:|---:|---:|---:|
| (g) Palette LUT only, `out[i] = pal[idx[i]]`, 320x180 | 0.016 | 0.017 | 0.015 | 0.087 | 0.091 |
| (g) VFX #1 palette pass, day (lamp off), 320x180 | 0.025 | 0.025 | 0.026 | 0.087 | 0.093 |
| (g) VFX #1 palette pass, night (float lamp mask, Bayer test, one divide per pixel), 320x180 | 0.078 | 0.079 | 0.080 | 0.473 | 0.500 |
| (g) Night, byte lamp mask + one 512-entry table, 320x180 | 0.066 | 0.066 | 0.065 | 0.408 | 0.452 |
| (g) Palette LUT only, `out[i] = pal[idx[i]]`, 640x360 | 0.059 | 0.061 | 0.058 | 0.343 | 0.400 |
| (g) VFX #1 palette pass, day (lamp off), 640x360 | 0.057 | 0.058 | 0.061 | 0.370 | 0.404 |
| (g) VFX #1 palette pass, night (float lamp mask, Bayer test, one divide per pixel), 640x360 | 0.309 | 0.316 | 0.352 | 2.04 | 2.77 |
| (g) Night, byte lamp mask + one 512-entry table, 640x360 | 0.258 | 0.262 | 0.270 | 1.53 | 1.63 |
| (g) Palette LUT only, `out[i] = pal[idx[i]]`, 960x540 | 0.132 | 0.139 | 0.130 | 0.823 | 0.925 |
| (g) VFX #1 palette pass, day (lamp off), 960x540 | 0.135 | 0.155 | 0.147 | 0.838 | 0.908 |
| (g) VFX #1 palette pass, night (float lamp mask, Bayer test, one divide per pixel), 960x540 | 0.785 | 0.858 | 0.792 | 5.10 | 6.90 |
| (g) Night, byte lamp mask + one 512-entry table, 960x540 | 0.578 | 0.606 | 0.578 | 3.60 | 4.13 |
| Build the 232-entry palette (any resolution) | 0.00077 | 0.00078 | 0.00078 | 0.0050 | 0.0054 |

Quote "6x throttle, median". The night rows are the worst case. During the day the lamp test is skipped and the pass is a plain table lookup.

`putImageData` on its own:

| `putImageData` | Bytes | GPU run, median ms | GPU run, p95 ms | SwiftShader run, median ms | 6x throttle, median ms | 6x throttle, p95 ms |
|---|---:|---:|---:|---:|---:|---:|
| 160x90, software canvas | 57,600 | 0.0022 | 0.0022 | 0.0022 | 0.013 | 0.014 |
| 160x90, software canvas + 1x1 readback | 57,600 | 0.0030 | 0.0068 | 0.0030 | 0.019 | 0.030 |
| 160x90, default canvas, JS side only | 57,600 | 0.021 | 0.029 | 0.0021 | 0.026 | 0.028 |
| 320x180, software canvas | 230,400 | 0.0080 | 0.0081 | 0.0081 | 0.048 | 0.049 |
| 320x180, software canvas + 1x1 readback | 230,400 | 0.0092 | 0.011 | 0.0089 | 0.056 | 0.067 |
| 320x180, default canvas, JS side only | 230,400 | 0.032 | 0.035 | 0.0083 | 0.043 | 0.044 |
| 640x360, software canvas | 921,600 | 0.032 | 0.033 | 0.031 | 0.186 | 0.195 |
| 640x360, software canvas + 1x1 readback | 921,600 | 0.034 | 0.036 | 0.033 | 0.198 | 0.210 |
| 640x360, default canvas, JS side only | 921,600 | 0.073 | 0.096 | 0.031 | 0.128 | 0.138 |
| 960x540, software canvas | 2,073,600 | 0.071 | 0.074 | 0.071 | 0.433 | 0.448 |
| 960x540, software canvas + 1x1 readback | 2,073,600 | 0.075 | 0.078 | 0.072 | 0.428 | 0.446 |
| 960x540, default canvas, JS side only | 2,073,600 | 0.164 | 0.339 | 0.071 | 0.241 | 0.256 |
| 1280x720, software canvas | 3,686,400 | 0.123 | 0.129 | 0.123 | 0.736 | 0.769 |
| 1280x720, software canvas + 1x1 readback | 3,686,400 | 0.130 | 0.135 | 0.127 | 0.769 | 0.800 |
| 1280x720, default canvas, JS side only | 3,686,400 | 0.360 | 0.481 | 0.125 | 0.425 | 0.468 |

Quote the "software canvas" rows. "Default canvas, JS side only" is a canvas created without `willReadFrequently`. In the GPU run that canvas is accelerated, the call only queues the upload, and the time the GPU process spends is not in the number. The 640x360 RGBA8 row of the upload table in item 3 is the closest measure of that hidden part.

Notes.
- Inside a whole frame the ground pass costs 4 to 16% more than alone (1.62 ms against 1.44 ms for the VFX #1 loop at 640x360, 0.98 against 0.945 for the 32 px renderer). The field changes every frame and the other layers evict its data from the cache.
- Writing RGBA directly instead of an index buffer saves nothing in the ground pass (0.329 against 0.291 ms). It only removes the separate palette pass (0.059 ms for a plain lookup at 640x360).
- The art threshold tile adds 0.12 ms at 640x360 over Bayer (0.408 against 0.291 ms). The emboss and bands add 0.42 ms (0.713 against 0.291 ms).
- 1:2 and 1:4 fields cost the same to draw (0.867 and 0.875 ms bilinear). The field ratio changes the sim cost and the look, not the render cost.

## 3. Ground render in a WebGL2 fragment shader

Takeaway. One full-screen fragment shader does the whole ground pass in 0.012 ms at 640x360 and 0.086 ms at 1920x1080 on the M4 Pro GPU. The field ratio and the filter make no measurable difference. Without a GPU (SwiftShader) the same pass is 0.69 ms at 640x360, still below the 0.945 ms of the JavaScript renderer, and 6.1 ms at 1920x1080.

The shader reads an RGBA8 art texture (base colour, alpha marks snow-holding pixels), an R8 depth texture, an R8 threshold texture with `REPEAT`, and a small palette texture.

- "Flat" is 3 texture reads.
- "Emboss + bands + palette LUT" adds 4 depth taps and a `texelFetch` into the palette.
- "Full" adds R8 packed, wet and sun-shadow textures, a hashed sparkle, and a dithered lamp pool. 11 reads at most.
- "Full + 2 hashed flake layers" adds two stateless flake layers, one hashed flake per grid cell.

What the columns mean. "Wall" is the time one more frame adds to a batch, measured on the main thread with the GPU forced to finish. It holds the JavaScript calls, the command buffer, the GPU process and the GPU. "GPU timer query" is the driver's own elapsed time for the draws. "JS side" is main-thread time per frame when nothing waits for the GPU. On SwiftShader "wall" is CPU rasterisation time in the GPU process.

| Fragment shader ground pass, output size | Metal, wall median ms | Metal, wall p95 ms | Metal, GPU timer query ms | Metal, JS side median ms | SwiftShader, wall median ms | SwiftShader, wall p95 ms | Metal + 6x throttle, wall median ms | Metal + 6x throttle, JS side median ms |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 640x360: Flat, field 1:1 nearest, Bayer (3 reads) | 0.0038 | 0.0043 | 0.0032 | 0.00023 | 0.275 | 0.289 | 0.0063 | 0.0011 |
| 640x360: Flat, field 1:2 nearest, Bayer (3 reads) | 0.0038 | 0.0041 | 0.0032 | 0.00020 | 0.274 | 0.293 | 0.0049 | 0.0012 |
| 640x360: Flat, field 1:2 linear, art tile (3 reads) | 0.0038 | 0.0043 | 0.0033 | 0.00020 | 0.239 | 0.251 | 0.0050 | 0.0011 |
| 640x360: Emboss + bands + palette LUT, field 1:1 nearest (8 reads) | 0.0067 | 0.0079 | 0.0058 | 0.00020 | 0.404 | 0.427 | 0.0083 | 0.0012 |
| 640x360: Emboss + bands + palette LUT, field 1:2 linear (8 reads) | 0.0089 | 0.0097 | 0.0074 | 0.00020 | 0.491 | 0.534 | 0.0079 | 0.00042 |
| 640x360: Emboss + bands + palette LUT, field 1:4 linear (8 reads) | 0.0091 | 0.010 | 0.0073 | 0.00023 | 0.500 | 0.526 | 0.010 | 0.0012 |
| 640x360: Full (packed, wet, shadow, sparkle, lamp), field 1:1 nearest (11 reads) | 0.011 | 0.012 | 0.0085 | 0.00017 | 0.596 | 0.611 | 0.011 | 0.00090 |
| 640x360: Full, field 1:2 linear (11 reads) | 0.012 | 0.014 | 0.0097 | 0.00017 | 0.688 | 0.761 | 0.014 | 0.00093 |
| 640x360: Full, field 1:4 linear (11 reads) | 0.012 | 0.013 | 0.0098 | 0.00017 | 0.715 | 0.791 | 0.014 | 0.00087 |
| 640x360: Full + 2 hashed flake layers in the shader, field 1:2 linear | 0.017 | 0.018 | 0.015 | 0.00010 | 0.761 | 0.795 | 0.018 | 0.00047 |
| 960x540: Flat, field 1:1 nearest, Bayer (3 reads) | 0.0075 | 0.0082 | 0.0067 | 0.00020 | 0.601 | 0.626 | 0.0087 | 0.0011 |
| 960x540: Flat, field 1:2 nearest, Bayer (3 reads) | 0.0079 | 0.0085 | 0.0067 | 0.00023 | 0.630 | 0.711 | 0.0089 | 0.0012 |
| 960x540: Flat, field 1:2 linear, art tile (3 reads) | 0.0076 | 0.0081 | 0.0069 | 0.00020 | 0.544 | 0.594 | 0.0089 | 0.0012 |
| 960x540: Emboss + bands + palette LUT, field 1:1 nearest (8 reads) | 0.015 | 0.016 | 0.012 | 0.00020 | 0.901 | 1.00 | 0.014 | 0.0012 |
| 960x540: Emboss + bands + palette LUT, field 1:2 linear (8 reads) | 0.019 | 0.021 | 0.015 | 0.00020 | 1.12 | 1.31 | 0.019 | 0.0012 |
| 960x540: Emboss + bands + palette LUT, field 1:4 linear (8 reads) | 0.019 | 0.021 | 0.018 | 0.00023 | 1.10 | 1.14 | 0.020 | 0.0012 |
| 960x540: Full (packed, wet, shadow, sparkle, lamp), field 1:1 nearest (11 reads) | 0.023 | 0.024 | 0.020 | 0.00017 | 1.36 | 1.41 | 0.023 | 0.00087 |
| 960x540: Full, field 1:2 linear (11 reads) | 0.026 | 0.029 | 0.020 | 0.00017 | 1.55 | 1.59 | 0.023 | 0.00048 |
| 960x540: Full, field 1:4 linear (11 reads) | 0.026 | 0.027 | 0.022 | 0.00017 | 1.55 | 1.63 | 0.028 | 0.00073 |
| 960x540: Full + 2 hashed flake layers in the shader, field 1:2 linear | 0.034 | 0.037 | 0.036 | 0.00006 | 1.75 | 1.88 | 0.035 | 0.00024 |
| 1920x1080: Flat, field 1:1 nearest, Bayer (3 reads) | 0.028 | 0.031 | 0.027 | 0.00018 | 2.45 | 2.66 | 0.031 | 0.0011 |
| 1920x1080: Flat, field 1:2 nearest, Bayer (3 reads) | 0.029 | 0.031 | 0.027 | 0.00020 | 2.45 | 2.89 | 0.030 | 0.0012 |
| 1920x1080: Flat, field 1:2 linear, art tile (3 reads) | 0.029 | 0.031 | 0.027 | 0.00020 | 2.12 | 2.21 | 0.027 | 0.00036 |
| 1920x1080: Emboss + bands + palette LUT, field 1:1 nearest (8 reads) | 0.044 | 0.046 | 0.047 | 0.00024 | 3.56 | 3.87 | 0.054 | 0.0013 |
| 1920x1080: Emboss + bands + palette LUT, field 1:2 linear (8 reads) | 0.063 | 0.066 | 0.058 | 0.00018 | 4.49 | 4.70 | 0.074 | 0.0012 |
| 1920x1080: Emboss + bands + palette LUT, field 1:4 linear (8 reads) | 0.063 | 0.066 | 0.059 | 0.00018 | 4.48 | 4.83 | 0.079 | 0.0013 |
| 1920x1080: Full (packed, wet, shadow, sparkle, lamp), field 1:1 nearest (11 reads) | 0.073 | 0.075 | 0.071 | 0.00015 | 5.35 | 5.76 | 0.081 | 0.00074 |
| 1920x1080: Full, field 1:2 linear (11 reads) | 0.086 | 0.090 | 0.085 | 0.00015 | 6.10 | 6.52 | 0.089 | 0.00045 |
| 1920x1080: Full, field 1:4 linear (11 reads) | 0.095 | 0.104 | 0.090 | 0.00014 | 6.07 | 6.74 | 0.096 | 0.00082 |
| 1920x1080: Full + 2 hashed flake layers in the shader, field 1:2 linear | 0.129 | 0.137 | 0.127 | 0 | 6.71 | 7.30 | 0.133 | 0.00027 |

Quote "Metal, wall median" for a machine with a GPU and "SwiftShader, wall median" for a machine without one. The 1920x1080 rows are the case where the shader runs at window resolution instead of 640x360 (in Godot, stretch mode `canvas_items` instead of `viewport`).

Upload cost. Each timed frame is the upload plus a 1 px draw that samples the texture, so the upload has to land. The first row is that draw alone.

| `texSubImage2D` + 1 px draw | Bytes per frame | Metal, wall median ms | Metal, wall p95 ms | Metal, GPU timer query ms | Metal, JS side median ms | SwiftShader, wall median ms | SwiftShader, wall p95 ms | Metal + 6x throttle, wall median ms | Metal + 6x throttle, JS side median ms |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| No upload, the 1 px draw alone | 0 | 0.00033 | 0.00037 | 0.00030 | 0 | 0.015 | 0.015 | 0.00033 | 0.00003 |
| 160x90 R8, full | 14,400 | 0.017 | 0.024 | 0.016 | 0.00061 | 0.022 | 0.022 | 0.015 | 0.0042 |
| 160x90 R8, one 64x64 chunk | 4,096 | 0.015 | 0.016 | 0.012 | 0.00057 | 0.037 | 0.038 | 0.015 | 0.0031 |
| 160x90 R8, eight 64x64 chunks | 32,768 | 0.039 | 0.044 | 0.025 | 0.015 | 0.039 | 0.039 | 0.037 | 0.022 |
| 160x90 RGBA8, full | 57,600 | 0.021 | 0.024 | 0.018 | 0.020 | 0.025 | 0.026 | 0.021 | 0.019 |
| 160x90 RGBA8, one 64x64 chunk | 16,384 | 0.017 | 0.020 | 0.020 | 0.0083 | 0.037 | 0.037 | 0.020 | 0.013 |
| 160x90 RGBA8, eight 64x64 chunks | 131,072 | 0.085 | 0.095 | 0.062 | 0.063 | 0.041 | 0.042 | 0.089 | 0.071 |
| 320x180 R8, full | 57,600 | 0.020 | 0.023 | 0.021 | 0.019 | 0.025 | 0.026 | 0.023 | 0.020 |
| 320x180 R8, one 64x64 chunk | 4,096 | 0.015 | 0.021 | 0.014 | 0.00050 | 0.037 | 0.038 | 0.015 | 0.0032 |
| 320x180 R8, eight 64x64 chunks | 32,768 | 0.039 | 0.042 | 0.024 | 0.010 | 0.039 | 0.040 | 0.037 | 0.031 |
| 320x180 RGBA8, full | 230,400 | 0.037 | 0.040 | 0.029 | 0.033 | 0.038 | 0.038 | 0.036 | 0.032 |
| 320x180 RGBA8, one 64x64 chunk | 16,384 | 0.019 | 0.021 | 0.017 | 0.0090 | 0.037 | 0.038 | 0.018 | 0.0090 |
| 320x180 RGBA8, eight 64x64 chunks | 131,072 | 0.075 | 0.088 | 0.076 | 0.059 | 0.041 | 0.042 | 0.074 | 0.047 |
| 640x360 R8, full | 230,400 | 0.037 | 0.040 | 0.030 | 0.034 | 0.037 | 0.037 | 0.036 | 0.033 |
| 640x360 R8, one 64x64 chunk | 4,096 | 0.015 | 0.017 | 0.014 | 0.00050 | 0.036 | 0.037 | 0.016 | 0.0026 |
| 640x360 R8, eight 64x64 chunks | 32,768 | 0.043 | 0.047 | 0.031 | 0.016 | 0.039 | 0.039 | 0.036 | 0.031 |
| 640x360 RGBA8, full | 921,600 | 0.093 | 0.098 | 0.044 | 0.091 | 0.084 | 0.086 | 0.133 | 0.127 |
| 640x360 RGBA8, one 64x64 chunk | 16,384 | 0.017 | 0.019 | 0.015 | 0.012 | 0.037 | 0.037 | 0.019 | 0.013 |
| 640x360 RGBA8, eight 64x64 chunks | 131,072 | 0.072 | 0.085 | 0.059 | 0.084 | 0.042 | 0.047 | 0.078 | 0.062 |

Quote "Metal, wall median". Subtract the first row (0.0003 ms on Metal, 0.015 ms on SwiftShader) to get the upload alone.

Notes.
- A `texSubImage2D` call costs 0.015 to 0.021 ms on Metal for anything up to 57,600 bytes. A full 320x180 R8 field is 0.020 ms. A full 640x360 RGBA8 field (921,600 bytes) is 0.093 ms.
- Eight 64x64 dirty chunks cost 0.039 to 0.043 ms in R8 and 0.072 to 0.085 ms in RGBA8. That is more than one full 320x180 upload in the same format (0.020 and 0.037 ms). Dirty chunks only pay when one or two chunks changed, or when the field is 640x360 RGBA8.
- Most of the upload time is on the main thread ("JS side" 0.019 of 0.020 ms for the full 320x180 R8 upload). The 6x throttle raises the 640x360 RGBA8 upload to 0.133 ms.
- Note 12 reports that Godot's Compatibility renderer always uploads the whole image. These numbers say that is fine at 57,600 bytes. Godot's own `ImageTexture.update` path was not measured.

## 4. Baking the exposure map and the sun shadow map

Takeaway. The bakes are where a 1:1 field hurts most. The upwind-ray exposure bake with a 3.5-tile ray costs 15.9 ms at 1:1 (99.7 ms throttled, a six-frame hitch each time the wind bucket changes), 2.12 ms at 1:2 and 0.30 ms at 1:4. A sweep along each row gives the same map, bit for bit, in 0.49 ms at 1:1 and 0.137 ms at 1:2.

Ray lengths are in tiles of 32 px. The VFX #1 ray is 28 px on 8 px tiles, which is 3.5 tiles. At 640x360 that is 112 art px. Because the 640x360 scene is the VFX #1 scene at twice the size, the ray that covers the same part of the scene is 1.75 tiles (56 art px). Both are measured. The row "57,600 cells, ray 28 cells" is also the VFX #1 engine itself.

- "Ray per cell" is the sandbox code. Each ground cell steps upwind until it meets an obstacle or the ray ends. Cost grows with cells times ray length, 7 to 8 times per halving of the cell size.
- "One sweep per row" walks each row once in the wind direction and carries the height of the last obstacle and the distance to it. Cost grows with cells only. The page checks that both give identical output (true in all four runs).
- "Sun shadow" is the sandbox code. Every object cell is projected along its own height.

| Bake (one call) | GPU run, median ms | GPU run, p95 ms | SwiftShader run, median ms | 6x throttle, median ms | 6x throttle, p95 ms |
|---|---:|---:|---:|---:|---:|
| Exposure, ray per cell, 14,400 cells (160x90), ray 28 cells = 3.5 tiles | 0.300 | 0.357 | 0.286 | 1.70 | 1.85 |
| Exposure, one sweep per row, 14,400 cells, ray 28 cells = 3.5 tiles | 0.036 | 0.037 | 0.035 | 0.215 | 0.221 |
| Exposure, ray per cell, 14,400 cells (160x90), ray 14 cells = 1.75 tiles | 0.172 | 0.224 | 0.184 | 1.04 | 1.16 |
| Exposure, one sweep per row, 14,400 cells, ray 14 cells = 1.75 tiles | 0.036 | 0.037 | 0.036 | 0.204 | 0.215 |
| Sun shadow, 14,400 cells (160x90) | 0.064 | 0.071 | 0.063 | 0.389 | 0.417 |
| Exposure, ray per cell, 57,600 cells (320x180), ray 56 cells = 3.5 tiles | 2.12 | 2.50 | 2.10 | 12.8 | 14.0 |
| Exposure, one sweep per row, 57,600 cells, ray 56 cells = 3.5 tiles | 0.137 | 0.145 | 0.130 | 0.808 | 0.850 |
| Exposure, ray per cell, 57,600 cells (320x180), ray 28 cells = 1.75 tiles | 1.20 | 1.38 | 1.26 | 7.50 | 8.70 |
| Exposure, one sweep per row, 57,600 cells, ray 28 cells = 1.75 tiles | 0.125 | 0.127 | 0.122 | 0.808 | 0.854 |
| Sun shadow, 57,600 cells (320x180) | 0.417 | 0.455 | 0.408 | 2.50 | 2.65 |
| Exposure, ray per cell, 230,400 cells (640x360), ray 112 cells = 3.5 tiles | 15.9 | 18.3 | 15.6 | 99.7 | 110 |
| Exposure, one sweep per row, 230,400 cells, ray 112 cells = 3.5 tiles | 0.490 | 0.510 | 0.486 | 3.25 | 3.45 |
| Exposure, ray per cell, 230,400 cells (640x360), ray 56 cells = 1.75 tiles | 9.05 | 10.7 | 9.05 | 53.8 | 70.3 |
| Exposure, one sweep per row, 230,400 cells, ray 56 cells = 1.75 tiles | 0.500 | 0.510 | 0.500 | 3.15 | 3.37 |
| Sun shadow, 230,400 cells (640x360) | 3.08 | 3.33 | 3.02 | 17.4 | 18.3 |
| Exposure, ray per cell, 518,400 cells (960x540), ray 168 cells = 3.5 tiles | 55.4 | 73.8 | 56.3 | 343 | 377 |
| Exposure, one sweep per row, 518,400 cells, ray 168 cells = 3.5 tiles | 1.06 | 1.07 | 1.08 | 7.65 | 8.20 |
| Exposure, ray per cell, 518,400 cells (960x540), ray 84 cells = 1.75 tiles | 30.9 | 40.0 | 29.6 | 178 | 202 |
| Exposure, one sweep per row, 518,400 cells, ray 84 cells = 1.75 tiles | 1.06 | 1.08 | 1.11 | 7.05 | 7.50 |
| Sun shadow, 518,400 cells (960x540) | 10.0 | 10.5 | 9.80 | 57.5 | 62.6 |

Quote "6x throttle, median" as the hitch a low-end device sees when the wind bucket changes. Above 10 ms each sample is a single call, so the p95 is a real per-call p95.

Notes.
- The sun shadow bake has no sweep version here. At 1:1 it is 3.08 ms (17.4 ms throttled, a full frame). At 1:2 it is 0.417 ms. It runs once at load unless the sun moves.
- The sweep needs wind along the rows, as in VFX #1. A diagonal wind needs a sheared sweep, not measured.

## 5. Characters and footprints

Takeaway. Characters are not a cost problem at 24x32. 20 sprites cost 0.022 ms (0.13 ms throttled), 6 times the 7x12 cost for 9 times the pixels. A boot print costs 0.16 to 0.21 µs. 100 prints per second add 0.002 ms per frame on the throttled run.

Each sprite test moves N actors, sorts them by y, reads the field depth under the feet, clips the bottom rows by the sink depth, draws a contact shadow and a snow rim, and tests every sprite pixel against the object depth map. The 24x32 sprite is 57% opaque, the 7x12 sprite 73%. Sink is 1 row per 22 units up to 4 rows for 7x12, and 1 px per 16 units up to 8 px for 24x32.

| Sprites into the index buffer (move, y-sort, sink clip, shadow, rim) | GPU run, median ms | GPU run, p95 ms | SwiftShader run, median ms | 6x throttle, median ms | 6x throttle, p95 ms |
|---|---:|---:|---:|---:|---:|
| 7x12 px, VFX #1 code as written (string templates), 320x180, N = 1 | 0.00055 | 0.00057 | 0.00059 | 0.0037 | 0.0040 |
| 7x12 px, VFX #1 code as written (string templates), 320x180, N = 20 | 0.011 | 0.011 | 0.011 | 0.064 | 0.068 |
| 7x12 px, VFX #1 code as written (string templates), 320x180, N = 50 | 0.027 | 0.028 | 0.027 | 0.169 | 0.200 |
| 7x12 px, byte sprites, 320x180, N = 1 | 0.00024 | 0.00024 | 0.00023 | 0.0014 | 0.0014 |
| 7x12 px, byte sprites, 320x180, N = 20 | 0.0036 | 0.0037 | 0.0036 | 0.021 | 0.023 |
| 7x12 px, byte sprites, 320x180, N = 50 | 0.0098 | 0.0099 | 0.0100 | 0.057 | 0.062 |
| 24x32 px, byte sprites, 640x360, field 1:1, N = 1 | 0.0011 | 0.0011 | 0.0011 | 0.0064 | 0.0070 |
| 24x32 px, byte sprites, 640x360, field 1:1, N = 20 | 0.022 | 0.022 | 0.020 | 0.123 | 0.130 |
| 24x32 px, byte sprites, 640x360, field 1:1, N = 50 | 0.060 | 0.062 | 0.053 | 0.309 | 0.333 |
| 24x32 px, byte sprites, 640x360, field 1:2, N = 1 | 0.0011 | 0.0011 | 0.0011 | 0.0061 | 0.0063 |
| 24x32 px, byte sprites, 640x360, field 1:2, N = 20 | 0.023 | 0.023 | 0.020 | 0.132 | 0.142 |
| 24x32 px, byte sprites, 640x360, field 1:2, N = 50 | 0.053 | 0.055 | 0.057 | 0.348 | 0.378 |
| Move only (no draw), for reference, N = 1 | 0.00008 | 0.00008 | 0.00008 | 0.00046 | 0.00052 |
| Move only (no draw), for reference, N = 20 | 0.00012 | 0.00012 | 0.00012 | 0.00071 | 0.00078 |
| Move only (no draw), for reference, N = 50 | 0.00020 | 0.00020 | 0.00021 | 0.0013 | 0.0013 |

Quote "6x throttle, median".

Print stamps. Every stamp keeps 30% of the depth under it, marks the cells packed and spills the rest to rim points, as in VFX #1. The boot at 1:1 is a 3x5 block with two toe corners cut (13 cells), turned to the walking direction, with 8 rim points. At 1:2 the same boot is 2x3 cells. At 1:4 it is 1 cell. Each test calls the stamp 100 times at ground positions.

| Print stamp | GPU run, median µs per stamp | GPU run, p95 µs per stamp | SwiftShader run, median µs per stamp | 6x throttle, median µs per stamp | 6x throttle, p95 µs per stamp | 6x throttle, mean ms per frame at 2 stamps/s | at 40 stamps/s | at 100 stamps/s | 6x throttle, ms for 50 stamps in one frame |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| VFX #1 print, 2x2 cells, 57,600-cell field | 0.14 | 0.15 | 0.15 | 0.89 | 0.97 | 0.00003 | 0.00060 | 0.0015 | 0.045 |
| 2x2 dot, field 1:1 (230,400 cells) | 0.14 | 0.14 | 0.14 | 0.81 | 0.88 | 0.00003 | 0.00054 | 0.0013 | 0.040 |
| Boot 3x5 (13 cells, 8 rim points), field 1:1 | 0.21 | 0.22 | 0.20 | 1.20 | 1.30 | 0.00004 | 0.00080 | 0.0020 | 0.060 |
| Boot as 2x3 cells (6 rim points), field 1:2 | 0.16 | 0.17 | 0.16 | 0.95 | 0.97 | 0.00003 | 0.00063 | 0.0016 | 0.047 |
| Boot as 1 cell, field 1:4 | 0.12 | 0.12 | 0.12 | 0.69 | 0.72 | 0.00002 | 0.00046 | 0.0011 | 0.034 |
| Trench piece 10x4 cells, field 1:1 | 0.39 | 0.40 | 0.38 | 2.35 | 2.56 | 0.00008 | 0.0016 | 0.0039 | 0.117 |
| Trench piece 5x2 cells, field 1:2 | 0.28 | 0.28 | 0.28 | 1.66 | 1.84 | 0.00006 | 0.0011 | 0.0028 | 0.083 |

Quote "6x throttle, median µs per stamp". The three rate columns are that value times the rate, divided by 60 frames. The last column is the worst frame, with 50 walkers stamping at once. The numbers include the cost of restoring the field every 2,000 stamps (14,400 cells 1.0 ns, 57,600 cells 1.3 ns, 230,400 cells 3.5 ns per stamp).

Notes.
- The VFX #1 character code builds string arrays per character per frame and looks colours up through an object. Byte sprites are about 3 times faster (0.0036 against 0.011 ms for 20 actors). Either way it is under 0.1 ms.
- Sprites at field 1:1 and 1:2 cost the same. The field is only read for 3 cells per actor.

## 6. Flakes

Takeaway. Flake cost follows the count, not the sprite size. 456 flakes cost 0.013 to 0.015 ms to update and draw on the CPU at either resolution. 1,824 flakes cost 0.05 ms (0.30 ms throttled). Flakes of 2 to 3 px with 2 px shadow dots cost the same as 1 px flakes.

Layer sets. VFX #1 is 260 far + 150 mid + 46 near, sized 1 px, 1 px and 2x2 with a 1 px shadow dot. "Larger sprites" are 2x1, 2x2 and a 3 px plus with a 2 px shadow dot. Speeds scale with the canvas width. The update is the sandbox code (two sines per flake, landing deposit). "Stateless, hashed" flakes keep no state. Their position comes from a seed and the time. These rows are from pass 2.

| Flakes on the CPU | GPU run, median ms | GPU run, p95 ms | SwiftShader run, median ms | 6x throttle, median ms | 6x throttle, p95 ms |
|---|---:|---:|---:|---:|---:|
| VFX #1: 456 flakes, 1 px / 1 px / 2x2 + 1 px shadow, 320x180, update | 0.0094 | 0.0096 | 0.0095 | 0.057 | 0.062 |
| VFX #1: 456 flakes, 1 px / 1 px / 2x2 + 1 px shadow, 320x180, update + draw (sprite-mask clear taken off) | 0.013 | 0.013 | 0.013 | 0.075 | 0.077 |
| 456 flakes, the same sizes, 640x360, update | 0.0098 | 0.010 | 0.0095 | 0.059 | 0.061 |
| 456 flakes, the same sizes, 640x360, update + draw (sprite-mask clear taken off) | 0.015 | 0.015 | 0.014 | 0.086 | 0.090 |
| 1,824 flakes (4x), the same sizes, 640x360, update | 0.039 | 0.040 | 0.038 | 0.229 | 0.238 |
| 1,824 flakes (4x), the same sizes, 640x360, update + draw (sprite-mask clear taken off) | 0.050 | 0.052 | 0.049 | 0.300 | 0.323 |
| 456 flakes, 2x1 / 2x2 / 3 px plus + 2 px shadow, 640x360, field 1:1, update | 0.010 | 0.011 | 0.0095 | 0.060 | 0.066 |
| 456 flakes, 2x1 / 2x2 / 3 px plus + 2 px shadow, 640x360, field 1:1, update + draw (sprite-mask clear taken off) | 0.014 | 0.015 | 0.014 | 0.094 | 0.099 |
| 1,824 flakes (4x), 2x1 / 2x2 / 3 px plus + 2 px shadow, 640x360, update | 0.037 | 0.037 | 0.038 | 0.246 | 0.262 |
| 1,824 flakes (4x), 2x1 / 2x2 / 3 px plus + 2 px shadow, 640x360, update + draw (sprite-mask clear taken off) | 0.049 | 0.050 | 0.050 | 0.308 | 0.339 |
| 456 flakes, larger sprites, 640x360, landing on a 1:2 field, update | 0.0098 | 0.010 | 0.0093 | 0.058 | 0.065 |
| 456 flakes, larger sprites, 640x360, landing on a 1:2 field, update + draw (sprite-mask clear taken off) | 0.014 | 0.015 | 0.014 | 0.092 | 0.099 |
| Sandbox spec: 60 near (3 px plus + shadow, stateful) + 520 far (stateless, hashed), 640x360, update | 0.0014 | 0.0014 | 0.0013 | 0.0085 | 0.0094 |
| Sandbox spec: 60 near (3 px plus + shadow, stateful) + 520 far (stateless, hashed), 640x360, update + draw (sprite-mask clear taken off) | 0.017 | 0.018 | 0.016 | 0.089 | 0.097 |
| 520 stateless hashed flakes only, 640x360, update + draw (sprite-mask clear taken off) | 0.015 | 0.016 | 0.014 | 0.079 | 0.086 |

Quote "6x throttle, median". Clearing the sprite mask costs 320x180 0.00033 ms, 640x360 0.00099 ms and is taken off the "update + draw" rows.

Notes.
- As GPU quads the picture changes. See item 7. On SwiftShader an instanced quad costs about 13 µs, so 580 flake quads cost about 8 ms. Two hashed flake layers inside the ground shader cost 0.073 ms on SwiftShader and 0.005 ms on Metal at 640x360.

## 7. Whole frame, three presets against the VFX #1 engine

Takeaway. On the 6x-throttle proxy the VFX #1 engine uses 22 to 24% of the frame budget (3.7 to 3.9 ms). The naive 1:1 port uses 87 to 93% (14.5 to 15.6 ms) and its p95 is over budget in the GPU build (17.4 to 18.3 ms). The 1:2 field with a CPU render uses 51 to 60% (8.45 to 10.1 ms). The ranges span the two throttled builds. The 1:2 field with a WebGL2 render uses 3% (0.47 to 0.56 ms) when a GPU is present.

One frame is one sim tick in the snowing state, actor movement and prints (each actor stamps every 24 frames), flake update, palette build, ground render, actors, flakes, the night palette pass with the lamp, `putImageData` and a 1x1 readback. "3 actors" is player, villager and fox drawn as three humanoids. "23 actors" adds a crowd of 20.

- VFX #1 engine: 320x180 canvas, 57,600-cell field, the sandbox loops as written, 456 flakes, 7x12 string sprites, 2x2 prints.
- Preset 1, naive 1:1 port: 640x360 canvas, 230,400-cell field with 4 times the picks, the VFX #1 ground loop per art pixel, 1,824 flakes, 24x32 sprites, 3x5 boot prints, the VFX #1 palette pass.
- Preset 2, field 1:2 on the CPU: 640x360 canvas, 57,600-cell field, the full 32 px renderer with 9/3/3/1 weights and the art threshold tile, 60 near flakes plus 520 stateless far flakes, 24x32 sprites, 2x3-cell boot prints, the byte-mask palette pass.
- Preset 3, field 1:2 with a WebGL2 render: the same sim, prints and flake update on the CPU. Three full R8 uploads per frame (depth, packed, wet, 172,800 bytes). One full-screen draw with the "full" shader at 640x360. One instanced draw for actors, their shadows and the flakes. Rows differ in where the 520 far flakes are drawn.

These rows are from pass 2. Presets 1 and 2 and the VFX #1 engine are CPU tests. Preset 3 is a wall time by the slope method.

| Whole frame | GPU run, median ms | GPU run, p95 ms | SwiftShader run, median ms | 6x throttle, median ms | 6x throttle, p95 ms | SwiftShader + 6x throttle, median ms |
|---|---:|---:|---:|---:|---:|---:|
| VFX #1 engine at 320x180 (8 px tiles, field 57,600), 3 actors | 0.594 | 0.644 | 0.556 | 3.90 | 4.20 | 3.93 |
| VFX #1 engine at 320x180 (8 px tiles, field 57,600), 23 actors | 0.578 | 0.637 | 0.572 | 3.70 | 4.10 | 3.87 |
| Preset 1: naive 1:1 port at 640x360 (field 230,400, all on the CPU), 3 actors | 2.38 | 2.52 | 2.38 | 15.6 | 17.4 | 14.5 |
| Preset 1: naive 1:1 port at 640x360 (field 230,400, all on the CPU), 23 actors | 2.50 | 2.60 | 2.48 | 15.3 | 18.3 | 15.3 |
| Preset 2: field 1:2 (57,600), bilinear + art threshold, CPU render at 640x360, 3 actors | 1.36 | 1.53 | 1.44 | 8.65 | 10.4 | 10.1 |
| Preset 2: field 1:2 (57,600), bilinear + art threshold, CPU render at 640x360, 23 actors | 1.36 | 1.40 | 1.41 | 8.45 | 9.25 | 9.15 |
| Preset 3: field 1:2 sim on the CPU, WebGL2 render, 580 flakes as quads, 3 actors | 0.092 | 0.096 | 9.72 | 0.561 | 0.618 | 10.5 |
| Preset 3, 580 flakes as quads, 23 actors | 0.096 | 0.104 | 10.3 | 0.542 | 0.591 | 11.0 |
| Preset 3, 23 actors, no field upload (shows the upload share) | 0.104 | 0.113 | 10.1 | 0.564 | 0.634 | 10.9 |
| Preset 3, 520 far flakes in the shader + 60 near as quads, 3 actors | 0.079 | 0.081 | 2.80 | 0.475 | 0.500 | 3.24 |
| Preset 3, far flakes in the shader, 23 actors | 0.083 | 0.085 | 3.32 | 0.484 | 0.513 | 3.84 |
| Preset 3, no flakes, 23 actors | 0.078 | 0.079 | 1.80 | 0.472 | 0.522 | 2.23 |

Quote "6x throttle, median" as the low-end case when the device has a GPU. Quote "SwiftShader + 6x throttle" for preset 3 when it does not. In that column the JavaScript is throttled and the software rasteriser is not, so it is a floor for a slow CPU without a GPU.

Where the time goes (pass 2, 23 actors):

| Layer, 23 actors (GPU run mean ms / 6x throttle mean ms) | VFX #1 engine, 320x180 | Preset 1, naive 1:1 port, 640x360 | Preset 2, field 1:2 CPU render, 640x360 |
|---|---:|---:|---:|
| sim tick | 0.069 / 0.482 | 0.314 / 1.86 | 0.068 / 0.499 |
| actors move + prints | 0.00030 / 0.0080 | 0.0010 / 0.0080 | 0.00050 / 0.0077 |
| flakes update | 0.0097 / 0.058 | 0.039 / 0.238 | 0.0013 / 0.014 |
| palette build | 0.00020 / 0.010 | 0.00030 / 0.0043 | 0.0010 / 0.0053 |
| ground render | 0.391 / 2.61 | 1.62 / 9.74 | 0.980 / 6.33 |
| actors draw | 0.013 / 0.118 | 0.035 / 0.264 | 0.024 / 0.263 |
| flakes draw | 0.0022 / 0.018 | 0.012 / 0.085 | 0.014 / 0.068 |
| palette pass | 0.080 / 0.516 | 0.318 / 2.09 | 0.257 / 1.64 |
| putImageData | 0.0090 / 0.082 | 0.036 / 0.220 | 0.033 / 0.247 |
| Sum of layers | 0.575 / 3.90 | 2.38 / 14.5 | 1.38 / 9.07 |
| Whole frame, timed as one (median) | 0.578 / 3.70 | 2.50 / 15.3 | 1.36 / 8.45 |

Preset 3 on the main thread:

| Preset 3 variant | Instanced quads | Metal, JS side median ms | Metal, GPU timer query ms | Metal + 6x throttle, JS side median ms | SwiftShader, JS side median ms | SwiftShader + 6x throttle, JS side median ms |
|---|---:|---:|---:|---:|---:|---:|
| Preset 3: field 1:2 sim on the CPU, WebGL2 render, 580 flakes as quads, 3 actors | 646 | 0.086 | 0.064 | 0.529 | 0.100 | 0.617 |
| Preset 3, 580 flakes as quads, 23 actors | 686 | 0.091 | 0.060 | 0.592 | 0.100 | 0.600 |
| Preset 3, 23 actors, no field upload (shows the upload share) | 686 | 0.084 | 0.020 | 0.492 | 0.100 | 0.640 |
| Preset 3, 520 far flakes in the shader + 60 near as quads, 3 actors | 126 | 0.076 | 0.052 | 0.450 | 0.082 | 0.489 |
| Preset 3, far flakes in the shader, 23 actors | 166 | 0.077 | 0.063 | 0.468 | 0.084 | 0.487 |
| Preset 3, no flakes, 23 actors | 46 | 0.074 | 0.056 | 0.526 | 0.079 | 0.488 |

How repeatable the frame numbers are:

| Whole frame, median ms, pass 1 / pass 2 | GPU run | SwiftShader run | GPU run + 6x throttle | SwiftShader + 6x throttle |
|---|---:|---:|---:|---:|
| VFX #1 engine, 320x180, 3 actors | 0.606 / 0.594 | 0.578 / 0.556 | 3.57 / 3.90 | 3.53 / 3.93 |
| VFX #1 engine, 320x180, 23 actors | 0.612 / 0.578 | 0.612 / 0.572 | 3.73 / 3.70 | 3.90 / 3.87 |
| Preset 1, naive 1:1 port, 3 actors | 2.55 / 2.38 | 2.48 / 2.38 | 14.5 / 15.6 | 14.6 / 14.5 |
| Preset 1, naive 1:1 port, 23 actors | 2.40 / 2.50 | 2.46 / 2.48 | 18.9 / 15.3 | 14.4 / 15.3 |
| Preset 2, field 1:2, CPU render, 3 actors | 1.36 / 1.36 | 1.41 / 1.44 | 8.20 / 8.65 | 9.45 / 10.1 |
| Preset 2, field 1:2, CPU render, 23 actors | 1.41 / 1.36 | 1.49 / 1.41 | 9.15 / 8.45 | 8.50 / 9.15 |
| Preset 3, flakes as quads, 3 actors | 0.093 / 0.092 | 10.0 / 9.72 | 0.559 / 0.561 | 10.3 / 10.5 |
| Preset 3, flakes as quads, 23 actors | 0.098 / 0.096 | 10.6 / 10.3 | 0.585 / 0.542 | 10.8 / 11.0 |
| Preset 3, flakes as quads, 23 actors, no upload | 0.104 / 0.104 | 10.6 / 10.1 | 0.583 / 0.564 | 10.8 / 10.9 |
| Preset 3, far flakes in the shader, 3 actors | 0.083 / 0.079 | 2.99 / 2.80 | 0.492 / 0.475 | 3.23 / 3.24 |
| Preset 3, far flakes in the shader, 23 actors | 0.086 / 0.083 | 3.52 / 3.32 | 0.507 / 0.484 | 3.82 / 3.84 |
| Preset 3, no flakes, 23 actors | 0.082 / 0.078 | 1.93 / 1.80 | 0.482 / 0.472 | 2.23 / 2.23 |

Notes.
- The sandbox starts at speed 2. One more tick adds 1.73 ms to preset 1 on the throttled run, which puts its median at 16.2 to 17.3 ms, at or over the budget. It adds 0.42 ms to presets 2 and 3.
- In a thaw the throttled tick costs 0.17 ms more on the 57,600-cell field and 0.75 ms more on the 230,400-cell field (item 1). The sunny ground pass costs 1.15 ms more for preset 2 and 3.95 ms more for preset 1 (item 2).
- Preset 3 on Metal is bound by JavaScript. With 23 actors 0.091 of 0.096 ms is main-thread time, and 0.067 ms of that is the sim tick.
- The "no upload" row of preset 3 is not faster than the row with uploads. The upload share (3 x 0.020 ms of GPU-process time) is below the noise of this row.
- On SwiftShader preset 3 costs 10 ms with all flakes as quads, 3.3 ms with the far flakes in the shader and 1.8 ms with no flakes. 46 actor quads cost about 1 ms there.

## Conclusions

1. Tick cost follows picks. A snowing tick costs 0.067 ms on the 1:2 field (57,600 cells) against 0.281 ms on the 1:1 field (230,400 cells) and 0.017 ms on the 1:4 field. Throttled 6x that is 0.42, 1.73 and 0.11 ms. A pick costs 3 to 16 ns, and a field 9 times larger adds 3 to 17% per pick on this CPU.
2. The ground render is 68 to 71% of every CPU frame. The VFX #1 loop goes from 0.337 ms at 320x180 to 1.44 ms at 640x360 (8.85 ms throttled, 53% of the budget) and 3.33 ms at 960x540.
3. A coarse field costs nothing extra to draw with nearest sampling (0.289 against 0.291 ms). Per-pixel bilinear with weight tables costs 3 times as much (0.867 ms). A 1:2 upsample with fixed 9/3/3/1 weights costs 0.135 ms against 0.594 ms for the table version. Fix the ratio at 1:2 and hard-code the weights.
4. The full 32 px look on a 1:2 field (art threshold, edge line, rim, 3 bands, packed, wet) costs 0.945 ms on the CPU (5.8 ms throttled) against 1.44 ms (8.85 ms) for the VFX #1 loop at 1:1. In the simple variants the art threshold tile adds 0.12 ms and the emboss with bands 0.42 ms. The night palette pass adds 0.26 to 0.31 ms and `putImageData` 0.032 ms.
5. On a GPU the ground pass is close to free. It costs 0.012 ms at 640x360 and 0.086 ms at 1920x1080 on Metal with 11 texture reads per pixel, and the same at 1:1, 1:2 and 1:4. On a CPU rasteriser it is 0.69 ms at 640x360 and 6.1 ms at 1920x1080, so render at 640x360 and scale up.
6. Upload the whole 1:2 field. A full 320x180 R8 upload costs 0.020 ms and three of them (172,800 bytes) do not show in the frame total. One `texSubImage2D` call costs 0.015 to 0.021 ms for anything up to 57,600 bytes, so eight 64x64 dirty chunks (0.039 ms) cost more than the full upload. A full 640x360 RGBA8 upload is 0.093 ms.
7. Do not bake exposure with a ray per cell at 1:1. With a 3.5-tile ray it costs 15.9 ms (99.7 ms throttled) against 2.12 ms at 1:2, 0.30 ms at 1:4 and 1.20 ms in the VFX #1 engine. A row sweep gives the identical map in 0.49 ms at 1:1 and 0.137 ms at 1:2. The sun shadow bake is 3.08 ms at 1:1 against 0.417 ms at 1:2.
8. Characters, prints and flakes are small at any setting. 20 sprites of 24x32 cost 0.022 ms (0.13 ms throttled) and 50 cost 0.06 ms. A boot print costs 0.2 µs, so 100 prints per second are 0.002 ms per frame throttled. 456 flakes cost 0.014 ms and 1,824 cost 0.05 ms on the CPU, whatever the sprite size.
9. Without a GPU, small quads are the trap. SwiftShader spends about 13 µs per instanced flake quad, so 580 flake quads cost about 8 ms. Draw the far flakes in the ground shader (0.073 ms there) and keep only the 60 near flakes as sprites.
10. Whole frame at 640x360 against the VFX #1 engine at 0.58 ms (3.7 to 3.9 ms throttled, 22 to 24% of 16.7 ms). Naive 1:1 port: 2.4 to 2.5 ms, 14.5 to 15.6 ms throttled, 87 to 93% of the budget and over it at p95 in the GPU build. Field 1:2 with a CPU render: 1.36 to 1.44 ms, 8.45 to 10.1 ms throttled, 51 to 60%. Field 1:2 with a WebGL2 render: 0.08 to 0.10 ms, 0.47 to 0.56 ms throttled, 3%, and 2.8 to 3.8 ms with no GPU when the far flakes are in the shader.

## What was not measured

- Godot. No GDScript, no C#, no `ImageTexture.update`, no CanvasItem shader, no draw-call batching in the Compatibility renderer.
- Any real phone or low-end laptop. The throttle is a proxy. A phone GPU's fill rate at 640x360 or at window resolution is unknown here.
- Presenting the frame. The compositor's upload of a 640x360 canvas and the scale to the window are in no number.
- Firefox and Safari. All runs are Chromium 153.
- Per-call spikes below 10 ms and garbage-collection pauses. Memory use.
- 8x8 Bayer and blue-noise thresholds. They are one table lookup, like the two that were measured (inference).
- Marching squares, dual-grid autotile and per-tile snow overlays as the render path.
- Shaped snow caps on roofs, pines and fences, drop shadows, snow on hats, breath, kicked-snow puffs and chimney smoke.
- The class mask that stops bilinear depth from bleeding across object edges.
- The per-tile snow band pass (240 tiles) and any networking.
- Whether the sandbox's function-scoped `let rs` RNG reaches the slow state that the script-level `let` reaches.
- Sim ticks at a low rate or on dirty chunks only. Ticks with pick counts raised to keep drift speed per tile equal at 1:1.
- A "split" field (depth at 1:4, packed at 1:2).
- A sweep version of the sun shadow bake, and exposure sweeps for diagonal wind.
- Flakes as GPU points or as one overlay texture. Actors as separate draw calls.

## Sources

- `studies/vfx-snow/sandbox.html` (the engine that was ported) and `studies/vfx-snow/report.md` §8.
- `studies/vfx-magic/notes/12-benchmarks.md` and `studies/vfx-magic/notes/bench/` (the method and the harness).
- `studies/vfx-snow-32px/notes/SANDBOX-SPEC.md` (presets, sprite sizes, flake counts, field ratios).
- `studies/vfx-snow-32px/notes/bench/snowbench.html`, `run.py` and the eight `results-*.json` files (this note's data).
- `studies/vfx-snow-32px/notes/scratch-bench/`: `merge.py`, `tables.md`, run logs, and `probe1.py` to `probe4.py` with `probe3-output.txt` and `probe4-output.txt` (the two JIT-state findings).
- Chrome DevTools Protocol, `Emulation.setCPUThrottlingRate`: https://chromedevtools.github.io/devtools-protocol/tot/Emulation/#method-setCPUThrottlingRate
- `EXT_disjoint_timer_query_webgl2`: https://registry.khronos.org/webgl/extensions/EXT_disjoint_timer_query_webgl2/
- `performance.now()` and its reduced precision: https://developer.mozilla.org/en-US/docs/Web/API/Performance/now
