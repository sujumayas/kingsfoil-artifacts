# 11 Benchmarks: what grass, wind and small life cost (measured)

Lens: runtime efficiency. Part B (my own measurements) is the main deliverable. Part A collects the few published numbers that exist. All measured values are median ms per frame. The frame budget is 16.7 ms (60 fps).

## Setup

- Bench page: `studies/vfx-grass/notes/bench/grassbench.html`. Self-contained, no dependencies, all sprites built in code. Open it in any browser and call `runCPU()` or `await runGPU()` from the console.
- Runner: `studies/vfx-grass/notes/bench/run.py` (`python run.py cpu|gpu default|metal [throttle6]`). Raw JSON next to it: `results-cpu-default.json`, `results-cpu-default-throttle6.json`, `results-cpu-metal.json`, `results-gpu-default.json`, `results-gpu-metal.json`. Console logs in `notes/scratch-bench/`.
- Harness reused from the fog study (`studies/vfx-fog/notes/08-benchmarks.md`). CPU: 150 ms warm-up, 25 samples, each sample loops until 8 ms pass. Median with p10/p90. GPU: per-frame cost is the slope between a batch of 1 frame and a batch of K frames, each ending in a 1x1 readPixels, so the sync cost cancels. On Metal a GPU timer query (`EXT_disjoint_timer_query_webgl2`) is reported as well.
- Machine: Apple M4 Pro (14 cores, 48 GB), macOS 26.5.1 (25F80). Playwright 1.63.0, Chromium 153.0.8010.12.
- Configs, the same as the fog study:
  - `default` = chrome-headless-shell. WebGL renderer `ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (LLVM 10.0.0)), SwiftShader driver)`. Software GL. Canvas2D is software Skia.
  - `metal` = full Chromium, new headless, `--use-angle=metal --enable-gpu --ignore-gpu-blocklist`. Renderer `ANGLE (Apple, ANGLE Metal Renderer: Apple M4 Pro)`. Real GPU, timer query available.
  - `throttle6` = `default` plus DevTools CPU throttling 6x, the low-end phone proxy. Measured slowdown here was 5.5x to 6.5x across tests. It is an estimate of a low-end phone, not a phone.
- Apple HSR trap handled: every GPU pass blends. Tufts and field layers use `SRC_ALPHA, ONE_MINUS_SRC_ALPHA` with alpha below 1, glow uses `ONE, ONE`, trail stamps use `MAX`. No opaque draws are timed.
- Scene scale: the game canvas is 320x180. A tuft is an 8x8 sprite with 4 blades (26 pixels set), drawn in a 12x8 box so the top row can shear by up to 2 whole pixels. Shear per row is `round(s * (7 - row) / 7)`, s from -2 to 2, from a scrolling wind table (CPU) or a 128x128 wind texture (GPU). At 1280x720 the GPU draws the same scene at 4x scale (tuft quads 48x32 px).
- Canvas2D tests use `willReadFrequently: true` and end each frame with a 1x1 `getImageData` so the work is really done. In `default` this sync costs 0.014 ms. In `metal` Chromium still kept the canvas on the GPU path and the sync costs 0.18 ms, so subtract about 0.18 ms from every `metal` Canvas2D number.

## Key question 1: per-tuft sprites on the CPU (Canvas2D), which way to draw them?

Takeaway: the cost of Canvas2D tufts is the number of `drawImage` calls, about 0.8 µs each on M4 and about 5 µs each with 6x throttle. Pre-baked sway frames (1 call per tuft) are fine up to about 2000 tufts on desktop but blow the budget on the low-end proxy at 2000 (10.1 ms). Slicing each tuft into 8 rows at draw time is 7.5x slower and unusable. Writing the tuft pixels into one ImageData buffer is 30x to 35x faster than pre-baked `drawImage`: 8000 tufts cost 0.18 ms (1.0 ms throttled). A pre-rendered field layer drawn as row bands costs a flat 0.11 ms (0.67 ms throttled) whatever the tuft count.

Cited findings (my measurements, M4 / 6x throttle, median ms):

| Technique (320x180) | N=500 | N=2000 | N=8000 |
|---|---:|---:|---:|
| Pre-baked sway frames, 1 `drawImage` per tuft | 0.40 / 2.5 | 1.62 / 10.1 | 6.4 / 38.7 |
| Per-row slicing, 8 `drawImage` per tuft | 3.0 / 19 | 12.0 / 75 | 48.2 / 299 |
| ImageData pixel writes + one `putImageData` | 0.021 / 0.13 | 0.051 / 0.30 | 0.18 / 1.03 |
| Field layer, 90 row bands of 2 px | 0.11 / 0.66 | 0.11 / 0.67 | 0.11 / 0.68 |
| Field layer, 450 blocks of 4x32 px | 0.38 / 2.3 | 0.38 / 2.3 | 0.38 / 2.3 |
| Re-bake the field layer (after trampling) | 0.17 / 1.15 | 0.69 / 4.3 | 4.8 / 30.5 |

- Each ImageData path includes copying the 320x180 ground into the buffer and one `putImageData` (0.008 ms alone).
- p10/p90 spread was within 5% of the median for almost every test (JSON).

Inferences:
- For a hand-written JS sandbox, draw tufts into a Uint32 pixel buffer. It is the only CPU path where 8000 tufts fit the low-end budget with room left.
- The field layer is cheap per frame, but re-baking it is as slow as drawing every tuft. Re-bake only the dirty cells (a trampled 8x8 cell is about 1 to 4 tufts), never the whole layer.
- Row bands shear the whole width by the same amount per band, so all tufts in a band move together. That is the "wave through wheat" look for free, but it cannot bend single tufts away from a walker. Blocks (4x32) allow local variation at 3.5x the cost.

## Key question 2: tufts on the GPU (WebGL2, the Godot Compatibility path)

Takeaway: on a real GPU, one instanced draw of 8000 swaying tufts costs 0.056 ms at 320x180 and 0.21 ms at 1280x720. 8000 separate draws of the same tufts cost 13 to 14 ms of wall time, which is 230x more and nearly the whole budget. The fixed cost per draw call in Chrome on M4 is about 1.6 µs wall (1.0 µs GPU timer). The per-tuft cost inside one instanced draw is about 7 ns at 320x180. SwiftShader is the surprise: about 14 µs per tuft quad whether instanced or not, so 2000 quads cost 27 ms in software GL.

Cited findings (median ms; Metal wall slope / Metal timer query / SwiftShader):

| GPU test | 320x180 | 1280x720 |
|---|---|---|
| Tufts instanced, 1 draw, N=500 | 0.005 / 0.0047 / 6.96 | 0.017 / 0.013 / 6.6 |
| Tufts instanced, 1 draw, N=2000 | 0.015 / 0.012 / 27.4 | 0.058 / 0.046 / 26.9 |
| Tufts instanced, 1 draw, N=8000 | 0.056 / 0.056 / 110.6 | 0.21 / 0.22 / 106.1 |
| Tufts instanced, 1 draw, N=32000 | 0.22 / 0.22 / 444 | 0.86 / 0.89 / 421 |
| Tufts as N separate draws, N=500 | 0.80 / 0.64 / 6.6 | 1.34 / 0.51 / 6.8 |
| Tufts as N separate draws, N=2000 | 3.27 / 2.01 / 28.2 | 3.38 / 2.05 / 27.5 |
| Tufts as N separate draws, N=8000 | 13.1 / 7.9 / 113.9 | 14.1 / 8.0 / 108.5 |

- The tuft shader samples the 128x128 wind texture in the vertex shader and snaps the shear per row in the fragment shader with `texelFetch`, so sway is always whole game pixels.
- 8000 tufts in 12x8 boxes on a 320x180 screen is about 13x average overdraw (all blended). At 1280x720 the cost rises 3.8x for 16x the pixels, so at 320x180 the cost is mostly per-instance, not per-pixel.

Inferences:
- In Godot, a MultiMesh is one draw (forest study, `vfx-forest/notes/02-modern-performance.md` Q3). Sprite2D tufts that share one texture and one material batch into instanced draws in Compatibility (same source). Break that batching (different materials, per-node shaders without instance uniforms) and you pay the "separate draws" row. Godot's own per-node CPU cost comes on top and was not measured here.
- Estimate: if a low-end phone browser is 5x to 10x slower per draw call than the M4, 1000 separate draws cost 8 to 16 ms. Keep grass to a handful of draws.
- Software GL (blocklisted drivers, some VMs) cannot afford tuft quads. 500 tufts already take 7 ms. A full-screen field shader is 100x cheaper there (next question). If you must support software GL, a field shader is the safe fallback.

## Key question 3: a full-screen grass field shader and tall-grass overdraw

Takeaway: a full-screen shader that shears a pre-rendered grass layer by a wind texture costs 0.002 ms at 320x180 and 0.017 ms at 1280x720 on M4, and 0.075 / 1.08 ms on SwiftShader. Adding the trail map (bend and darken where walkers passed) adds about 10%. A procedural "6 blades per pixel" shader costs 3x to 4x more. Blended overdraw is linear: 8 full-screen tall-grass layers cost 0.12 ms at 720p on M4 and 8.7 ms on SwiftShader.

Cited findings (median ms; Metal timer query / SwiftShader):

| Field shader | 320x180 | 1280x720 |
|---|---:|---:|
| `field_shift` (1 wind fetch + 1 layer fetch, sheared per 4-row band) | 0.0021 / 0.075 | 0.0154 / 1.08 |
| `field_shift_trail` (+ trail map fetch, bend and darken) | 0.0029 / 0.083 | 0.0172 / 1.21 |
| `field_blades6` (up to 6 root-map fetches + 6 wind fetches) | 0.0069 / 0.44 | 0.053 / 5.56 |
| 4 blended `field_shift` layers | 0.0058 / 0.30 | 0.058 / 4.46 |
| 8 blended `field_shift` layers | 0.0096 / 0.60 | 0.120 / 8.74 |

Inferences:
- At game resolution, GPU grass is free on any real GPU. Render grass at 320x180 (Godot viewport stretch mode) and let the final upscale be the only full-res pass. This matches the fog study's conclusion.
- Tall grass that covers characters should be a few layers (2 to 4), not 8. On a weak mobile GPU at 720p, layers are where the cost is. A vendor-peak estimate from the fog study puts one 720p layer at 0.27 ms or more on a 2-core Mali-G52.

## Key question 4: interaction (trail) map, CPU typed arrays vs GPU ping-pong

Takeaway: a CPU trail map is close to free. An 80x45 Uint8 map with decay plus 10 walkers stamping a radius-2 disk costs 0.0023 ms (0.014 ms throttled). 160x90 with 100 walkers costs 0.016 ms (0.094 ms throttled). A GPU ping-pong (decay pass + K points with MAX blend) costs about 0.008 ms GPU time at both sizes, flat in K, plus about 0.011 ms wall per frame. The CPU path is simpler and just as fast.

Cited findings (median ms, M4 / 6x throttle):

| Trail map | K=1 | K=10 | K=100 |
|---|---:|---:|---:|
| CPU u8, 80x45, r=2 | 0.0010 / 0.0065 | 0.0023 / 0.014 | 0.0071 / 0.044 |
| CPU u8, 160x90, r=3 | 0.0063 / 0.037 | 0.0074 / 0.042 | 0.016 / 0.094 |
| CPU f32 multiply-decay, K=10 | 80x45: 0.0014 / 0.0087 | 160x90: 0.0066 / 0.040 | |
| GPU ping-pong, 80x45 (Metal timer / wall) | 0.0072 / 0.012 | 0.0078 / 0.011 | 0.0073 / 0.011 |
| GPU ping-pong, 160x90 (Metal timer / wall) | 0.0080 / 0.011 | 0.0081 / 0.011 | 0.0081 / 0.011 |
| GPU ping-pong on SwiftShader, 80x45 / 160x90 | 0.052 / 0.055 | 0.052 / 0.056 | 0.061 / 0.064 |

- Uploading the CPU map to a texture: SwiftShader 0.016 ms per frame at both sizes. On Metal my tight-loop upload test gave unstable numbers (80x45 median 0.055 ms but p90 0.52 ms, 160x90 median 28 ms). I read this as an artifact of re-uploading thousands of times to a texture the GPU is still reading in the same batch, which forces ANGLE to stall or copy. The fog study measured a 256x256 R8 upload at 0.016 ms wall (0.003 ms GPU) on the same machine. Treat my Metal upload rows as unreliable. A real game uploads once per frame.

Inferences:
- Keep the trail map on the CPU (GDScript `PackedByteArray` or C#) and upload it once per frame as an R8 `ImageTexture`. 80x45 at 4 px per cell matches the sandbox and is 3.6 KB. 160x90 costs 3x more on the CPU and is still tiny.
- On the GPU, cost is per pass, not per walker. If a game already has a SubViewport for it, ping-pong is fine. But the fog study cites a Godot web report of multiple SubViewports dropping below 1 fps, so the CPU path is the lower-risk choice on web.

## Key question 5: regrowth by random tick

Takeaway: a random tick costs about 3 ns per picked cell regardless of grid size. 256 random cells per tick cost 0.0008 ms. Even 65,536 picks per tick cost 0.19 ms (1.2 ms throttled). A full-scan cellular automaton costs 0.055 ms at 256x256 and 0.89 ms at 1024x1024 (5.2 ms throttled), so on large maps the random tick wins by keeping R small.

Cited findings (median ms, M4 / 6x throttle):

| Grid | R=16 | R=256 | R=4096 | R=65536 | Full scan |
|---|---:|---:|---:|---:|---:|
| 40x23 (sandbox) | 0.0001 / 0.0006 | 0.0008 / 0.0049 | | | 0.0006 / 0.0037 |
| 256x256 | 0.0001 / 0.0006 | 0.0008 / 0.0049 | 0.012 / 0.076 | 0.19 / 1.23 | 0.055 / 0.33 |
| 1024x1024 | 0.0001 / 0.0016 | 0.0008 / 0.0056 | 0.012 / 0.077 | 0.19 / 1.26 | 0.89 / 5.2 |

- Rule tested: stage 0 bare, 1 to 3 growing, 3 tall. A picked cell grows if it is already growing, or starts if a 4-neighbour is tall. Tall cells get grazed back at a 0.2% chance per pick so the grid never saturates.

Inferences:
- Minecraft's default rate is 3 random ticks per 16x16x16 section per game tick (inference from its docs, not re-checked here). For a 2D 1024x1024 grass map that scale is 768 picks per tick, about 0.002 ms. Regrowth is never a CPU problem. On an MMO server the cost that matters is the network delta for each changed tile, not the tick.
- A 40x23 sandbox grid can be scanned fully every frame for 0.0006 ms. The random tick there is for the look (patchy regrowth), not for speed.

## Key question 6: small life update and draw

Takeaway: updating creatures is cheap. 1000 butterflies (wander + bob + flee) cost 0.012 ms. Drawing them with one `drawImage` each costs 58x more (0.69 ms, 4.2 ms throttled). For fireflies with Kuramoto sync, the trig calls dominate, not the neighbour search. A uniform grid only gives 2.75x over naive O(n^2) at N=1000 (0.42 vs 1.14 ms). A per-cell mean field (sum of cos and sin per cell, 2 trig calls per firefly) is 17x faster than naive (0.067 ms) and scales linearly: 4000 fireflies cost 0.28 ms vs 6.6 ms with the grid.

Cited findings (median ms, M4 / 6x throttle):

| Small life | N=50 | N=200 | N=1000 | N=4000 |
|---|---:|---:|---:|---:|
| Butterflies update | 0.0007 / 0.004 | 0.0025 / 0.015 | 0.012 / 0.071 | |
| Butterflies draw (`drawImage`, incl. ground blit) | 0.049 / 0.32 | 0.15 / 0.91 | 0.69 / 4.2 | |
| Fireflies Kuramoto naive O(n^2) | 0.0028 / 0.023 | 0.049 / 0.29 | 1.14 / 6.75 | |
| Fireflies Kuramoto uniform grid (cell 24 px) | 0.0034 / 0.020 | 0.022 / 0.14 | 0.42 / 2.6 | 6.6 / 39.5 |
| Fireflies Kuramoto cell mean field | 0.0031 / 0.018 | 0.013 / 0.075 | 0.067 / 0.40 | 0.28 / 1.64 |

| Pollen | N=500 | N=2000 | N=8000 |
|---|---:|---:|---:|
| Update (wind table + bob) | 0.0031 / 0.018 | 0.012 / 0.071 | 0.049 / 0.28 |
| Draw `fillRect` 1 px each | 0.094 / 0.54 | 0.32 / 1.96 | 1.16 / 7.2 |
| Draw as pixel writes + `putImageData` | 0.012 / 0.071 | 0.013 / 0.077 | 0.018 / 0.105 |

- Grid vs naive gave identical phases on a 300-firefly test (`kuramoto grid == naive: true` in the JSON).
- Fireflies are scattered over the whole 320x180 screen with a 24 px coupling radius. At N=1000 that is about 30 neighbours each, which is why the grid saves little: every neighbour still costs one `Math.sin`.
- The mean field uses `sum_j sin(pj - pi) = Sy cos(pi) - Sx sin(pi)` over the 3x3 neighbour cells. It couples to a square of cells instead of a circle, which reads the same on screen.

Inferences:
- Realistic counts (tens of butterflies, 50 to 200 fireflies, a few hundred pollen motes) cost under 0.2 ms total even on the throttled proxy, if drawing uses pixel writes or one instanced draw.
- On the GPU, creatures and particles are instanced quads like tufts. 1000 instanced quads cost about 0.006 ms on M4 (glow table below). The CPU update is the larger cost, and it is still small.

## Key question 7: glow for fireflies

Takeaway: on a GPU, additive instanced halos are free (1000 halos 0.0047 ms at 320x180, 0.014 ms at 720p). On the CPU, the per-pixel radial loop into the pixel buffer beats additive sprites at every count (1000 fireflies 0.22 vs 0.89 ms). The 80x45 light map has a flat cost of about 0.17 to 0.19 ms (1.0 to 1.1 ms throttled), so it only wins above about 1000 fireflies, but it also lights the ground softly, which sprites do not.

Cited findings (median ms):

| Glow | N=50 | N=200 | N=1000 | N=8000 |
|---|---:|---:|---:|---:|
| CPU additive halo sprites (`lighter`), M4 / throttle | 0.058 / 0.35 | 0.19 / 1.14 | 0.89 / 5.25 | |
| CPU per-pixel radial loop r=4 + `putImageData` | 0.022 / 0.13 | 0.052 / 0.32 | 0.22 / 1.26 | |
| CPU 80x45 light map stamp + bilinear upscale | 0.17 / 1.04 | 0.17 / 1.05 | 0.19 / 1.14 | |
| GPU instanced additive halos 320x180, Metal timer / SwiftShader | | 0.0011 / 2.75 | 0.0047 / 13.8 | 0.039 / 110.6 |
| GPU instanced additive halos 1280x720, Metal timer / SwiftShader | | 0.0031 / 2.73 | 0.014 / 13.8 | 0.148 / 109.1 |

- All CPU glow rows include the night-ground blit.
- SwiftShader again pays about 14 µs per quad, the same as tufts.

Inferences:
- In Godot: draw firefly halos as one additive MultiMesh or GPUParticles2D with a pre-made 9x9 halo texture. The study #5 light map (low-res, upscaled) is the right tool when the glow should light the grass around the firefly.

## Key question 8: what does a whole grass frame cost? (budget check)

Takeaway: a sandbox-sized frame (2000 tufts, 80x45 trail map, 256 regrowth picks, 30 butterflies, 150 fireflies with mean-field sync, 500 pollen, glow) costs about 0.2 ms on M4 and about 1.2 ms on the 6x throttled proxy with the CPU pixel-buffer path. That is 7% of the 16.7 ms budget on the proxy. The same frame with one `drawImage` per tuft and per sprite costs about 2.2 ms (M4) and 13 ms (proxy), most of the budget.

Inferred sums from the tables (not measured as one frame):
- Pixel-buffer path, throttled: tufts 0.30 + trail 0.014 + regrowth 0.005 + butterflies update 0.003 and draw as pixels (estimate 0.02) + fireflies mean field 0.06 + pollen 0.02 update and 0.07 draw + glow per-pixel 0.25 + one `putImageData` 0.05 + ground copy (inside the tuft number). Total about 0.8 to 1.2 ms.
- `drawImage` path, throttled: tufts 10.1 + butterflies 0.3 + pollen `fillRect` 0.54 + glow sprites 0.9 + rest 0.1. Total about 12 ms.
- GPU path (Godot Compatibility shape) on M4: instanced tufts 0.012 + field/trail shader 0.003 + halos 0.001 + creatures instanced (estimate 0.002) = under 0.02 ms GPU, plus the CPU updates above.

## Part A: published numbers

Takeaway: there are almost no controlled, published 2D grass benchmarks for Godot or mobile WebGL. What exists is a single-GPU fps figure, one big desktop instancing study, one iOS bug and forum anecdotes.

Cited findings:
- Godot 2D MultiMesh grass: Markolainen's "Godot 2D MultiMeshInstance2D swaying grass" source reports 1100 FPS on an AMD RX 5700, with no instance count. Grass is split into rows of MultiMeshInstance2D, each row's z_index set from its y as a y-sort substitute. The author says row count limits performance (https://markolainen.itch.io/godot-2d-multimeshinstance2d-swaying-grass).
- Godot docs: MultiMesh draws "dozens of thousands of objects at very little performance cost" (Godot 3.1 docs, https://godot.readthedocs.io/en/3.1/tutorials/3d/3d_performance_and_limitations.html, seen via search). No per-instance culling, cull by chunks (https://raw.githubusercontent.com/godotengine/godot-docs/master/tutorials/performance/using_multimesh.rst, via the forest study).
- Godot Compatibility 2D batching: consecutive rects batch into one instanced draw when texture, material, blend and light state match. Meshes and MultiMeshes always start their own batch (Godot GLES3 source, summarised in `vfx-forest/notes/02-modern-performance.md` Q1).
- Godot web on mobile, self-reported: packing 250 to 260 loose sprites into 4 atlases cut draw calls from 240 to 38 and raised average fps from 31 to 60 on one mid-range Android. Several variables changed at once (https://forum.godotengine.org/t/godot-4-web-export-stutters-on-mobile-its-probably-your-art-pipeline-not-your-code-31fps-to-60fps-benchmarks-inside/143268, via the forest study).
- iOS WebGL instancing regression: on A14 devices (iPhone 12, iPad Air 2020), the three.js instancing example ran at 18 fps vs 60 fps on an iPhone Xr. The fix came with the ANGLE Metal backend and was confirmed on iOS 15 (bug closed 2021-09-20) (https://bugs.webkit.org/show_bug.cgi?id=218949). Inference: instancing is safe on current iOS, but test old devices.
- Desktop WebGL instancing scale: a three.js plant benchmark (2026-10-22, RTX 5070 Ti, Chromium 155, 1280x720) holds 60 fps at 1,000 and 10,000 instances of a 6,056-triangle plant and drops to about 20 fps at 100,000 (605.6 M triangles). Not a 2D or mobile number (https://discourse.threejs.org/t/three-js-plant-instancing-benchmark-240-desktop-samples-csv-json-and-a-standalone-harness/95719).
- Mobile draw-call costs in ms: I found only unsourced blog claims and no measurement, so none are quoted here. My measured M4 figure (1.6 µs wall per WebGL draw in Chrome) is the best number in this study, and the low-end estimate above (5x to 10x slower) is an inference.

## Rankings for the study (Speed column)

| Technique | M4 | 6x throttle proxy / SwiftShader | Verdict |
|---|---:|---:|---|
| GPU instanced tufts, 2000 (1 draw) | 0.012 ms GPU | 27 ms SwiftShader | Default for Godot. Needs a real GPU. |
| GPU field shader (shear layer by wind texture + trail) | 0.003 ms | 0.08 ms SwiftShader | Cheapest everywhere, also the software-GL fallback. |
| CPU tufts as pixel writes, 2000 | 0.051 ms | 0.30 ms | Best CPU path. |
| CPU field layer as 90 row bands | 0.11 ms | 0.67 ms | Flat cost, gust waves for free, needs dirty-cell re-bake. |
| CPU tufts pre-baked frames `drawImage`, 2000 | 1.6 ms | 10.1 ms | OK on desktop, too slow on low end. |
| CPU per-row slicing, 2000 | 12 ms | 75 ms | Never. |
| GPU separate draw per tuft, 2000 | 3.3 ms wall | 28 ms SwiftShader | Never. Keep batching intact. |
| CPU trail map 80x45, 10 walkers | 0.0023 ms | 0.014 ms | Free. Use it. |
| Random-tick regrowth, 256 picks | 0.0008 ms | 0.005 ms | Free. |
| Fireflies, 1000, cell mean-field Kuramoto | 0.067 ms | 0.40 ms | Use instead of pairwise sync. |
| Fireflies, 1000, naive O(n^2) Kuramoto | 1.14 ms | 6.75 ms | Fine below 200, avoid above. |
| Glow: GPU additive halos, 1000 | 0.005 ms | 13.8 ms SwiftShader | Default on GPU. |
| Glow: CPU per-pixel loop, 200 | 0.052 ms | 0.32 ms | Best CPU glow at normal counts. |

## Gaps

- No real phone or mobile GPU measured. The 6x throttle scales CPU time only, and the M4 Pro is a desktop-class GPU. Next step: open `grassbench.html` on a Mali-G52 or Adreno 6xx Android phone in Chrome and on an older iPhone in Safari. The page runs as-is.
- Godot itself was not benchmarked. Per-node cost of Sprite2D tufts, y-sort cost, MultiMesh buffer updates (`multimesh_set_buffer`) and GDScript speed vs JS are unmeasured. These numbers are raw WebGL2 and JS.
- The Metal texture-upload rows for the trail map are unreliable (see question 4). The fog study's 0.016 ms upload number is the better reference.
- Separate-draw tests change one uniform per draw. Real per-sprite draws that also switch textures or programs would cost more.
- Timer resolution: numbers below 0.001 ms are at the edge of the harness and show order of magnitude only.
- The Minecraft random tick rate is from memory of its docs, not re-checked in this session.
- Canvas2D on the `metal` config stayed GPU-backed despite `willReadFrequently`, so those numbers include a 0.18 ms readback per frame. They are in the JSON but not used in the tables.

## Sources

- Fog study benchmark method and harness: `studies/vfx-fog/notes/08-benchmarks.md`, `studies/vfx-fog/notes/bench/`
- Forest study, Godot batching and MultiMesh: `studies/vfx-forest/notes/02-modern-performance.md`
- Markolainen, Godot 2D MultiMeshInstance2D swaying grass: https://markolainen.itch.io/godot-2d-multimeshinstance2d-swaying-grass
- Godot 3.1 docs, 3D performance and limitations: https://godot.readthedocs.io/en/3.1/tutorials/3d/3d_performance_and_limitations.html
- Godot docs, using MultiMesh: https://raw.githubusercontent.com/godotengine/godot-docs/master/tutorials/performance/using_multimesh.rst
- Godot forum, web export on mobile, 31 to 60 fps: https://forum.godotengine.org/t/godot-4-web-export-stutters-on-mobile-its-probably-your-art-pipeline-not-your-code-31fps-to-60fps-benchmarks-inside/143268
- WebKit bug 218949, WebGL instanced draws slow on A14: https://bugs.webkit.org/show_bug.cgi?id=218949
- three.js plant instancing benchmark: https://discourse.threejs.org/t/three-js-plant-instancing-benchmark-240-desktop-samples-csv-json-and-a-standalone-harness/95719
- Apple WWDC20 10632 (hidden surface removal): https://developer.apple.com/videos/play/wwdc2020/10632
