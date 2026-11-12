# 12 Benchmarks: what spell effects cost (measured)

Lens: runtime efficiency. Part B (my own measurements) is the main deliverable. Part A collects the few published numbers I could find in 5 web calls. All measured values are median ms per frame. The frame budget is 16.7 ms (60 fps).

## Setup

- Bench page: `studies/vfx-magic/notes/bench/magicbench.html`. Self-contained, no dependencies, all sprites built in code. Open it in any browser and call `runCPU()` or `await runGPU()` from the console. Both take `{only: 'regex'}` to run a subset.
- Runner: `studies/vfx-magic/notes/bench/run.py` (`python run.py cpu|gpu default|metal [throttle6] [only=<regex>]`). Raw JSON beside it: `results-cpu-default.json`, `results-cpu-default-throttle6.json`, `results-cpu-metal.json`, `results-gpu-metal.json`, `results-gpu-default.json`, `results-gpu-default-throttle6.json` (subset), `results-gpu-metal-throttle6.json` (subset). Logs and the table merge script (`merge.py`, output `merged.txt`) are in `notes/scratch-bench/`.
- Harness reused from the grass study (`studies/vfx-grass/notes/11-benchmarks.md`). CPU tests have 150 ms warm-up and 25 samples, and each sample loops until 8 ms pass. I report the median with p10/p90 in the JSON. GPU per-frame cost is the slope between a batch of 1 frame and a batch of K frames, each ending in a 1x1 `readPixels`, so the sync cost cancels. On Metal a GPU timer query (`EXT_disjoint_timer_query_webgl2`) is recorded as well.
- Machine: Apple M4 Pro (14 cores, 48 GB), macOS 26.5.1 (25F80). Playwright 1.63.0, Chromium 153.0.8010.12.
- Configs, the same three as the grass and fog studies:
  - `default` = chrome-headless-shell. WebGL renderer `ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (LLVM 10.0.0)), SwiftShader driver)`. Software GL. Canvas2D is software Skia.
  - `metal` = full Chromium, new headless, `--use-angle=metal --enable-gpu --ignore-gpu-blocklist`. Renderer `ANGLE (Apple, ANGLE Metal Renderer: Apple M4 Pro)`. Real GPU, timer query available.
  - `throttle6` = `default` plus DevTools CPU throttling 6x, the low-end phone proxy. Measured slowdown was 5.7x to 6.8x on most tests. It is an estimate of a low-end phone, not a phone. For GPU tests I also ran `metal` plus 6x throttle. That slows the JavaScript and driver side only. The GPU is still an M4, so it says nothing about a phone's fill rate.
- Apple HSR trap handled. Every GPU draw blends. Sprites, particles and full-screen passes use `SRC_ALPHA, ONE_MINUS_SRC_ALPHA` with alpha 0.98 or lower, glow and additive tests use `SRC_ALPHA, ONE`. Framebuffer copies use `blitFramebuffer`. No opaque draws are timed.
- Canvas2D and ImageData tests use `willReadFrequently: true` and end each frame with a 1x1 `getImageData`. Every CPU draw number includes its baseline. The Canvas2D baseline (ground `drawImage` + sync) is 0.016 ms on M4 and 0.096 ms throttled. The ImageData baseline (ground copy + `putImageData` + sync) is 0.012 / 0.076 ms. In `metal` the Canvas2D baseline is 0.19 ms because Chromium keeps the canvas on the GPU and the readback stalls it, so subtract about 0.18 ms from every `metal` Canvas2D number.
- Console check: all 7 final runs finished with 0 errors and 0 page errors. The two SwiftShader GPU runs print 4 driver performance warnings, "GPU stall due to ReadPixels". That is the deliberate sync, not a fault.
- Scene scale: 320x180 canvas, 16x16 px tiles (20 x 11 on screen). Sprites: flipbooks of 8 frames at 32x32 and 64x64 (an expanding, hollowing fireball stored as ramp indices 0 to 5), tile effects of 8 frames at 16x16, a 16x24 character, 24x12 aura halves, an 8x8 missile, particles of 1, 2 and 3 px. One 512x128 atlas serves both Canvas2D and WebGL2. At 1280x720 the GPU draws the same scene at 4x scale.

### The 30-caster load

I size the 1x load from the Tibia timings the coordinator supplied (effect clock 75 ms per frame, missile flight 150 ms x sqrt(tiles), hit spark about 233 ms with 5 sparks, explosion 333 to 500 ms with about 14 pieces, ribbon trail 7 to 9 points, bolt of 32 segments living 167 to 300 ms).

- 30 casters at 1 cast per second is 30 casts per second. A 5-tile missile flies 335 ms, so about 10 are in the air on average. An impact of 400 ms gives about 12 alive.
- Steady state is not the hard case. The hard case is everyone casting inside the same 300 ms. So 1x assumes every caster has one missile in flight and one impact playing.
- 1x load: 30 missiles with a 12-point trail, 30 impact flipbooks of 32x32, 148 tile effects (4 area spells of 37 tiles, or 2 of 73), 1,300 particles (30 x 14 explosion pieces + 30 x 5 sparks + 30 x 16 wake + 30 x 8 gathering), 4 chain bolts (32 segments + 2 branches of 8), 30 auras (back, front, 6 orbiters), one glow pass, one shockwave, one vignette.
- 4x and 16x multiply every count. 16x is 480 missiles, 480 impacts, 2,368 tile effects, 20,800 particles, 64 bolts, 480 auras. It is not a real fight. It finds where each path breaks.
- "Everyone casts UE at once" is measured on its own in key question 6 (1,110 and 2,190 tile effects).

## Key question 1: particles, which draw path and which pool?

Takeaway: on the CPU, write particles into a Uint32 pixel buffer. It costs about 4 ns per particle on M4 and 23 ns throttled, so 32,000 particles are 0.82 ms on the low-end proxy. `drawImage` per particle is 0.83 µs each (5.2 µs throttled) and breaks the budget at about 3,000 particles on the proxy. `fillRect` is 4x cheaper than `drawImage` but still 50x dearer than a pixel write. On a real GPU one instanced draw of 32,000 particles is 0.15 to 0.26 ms. Stateless particles (position from seed and age in the vertex shader) are about 1.8x cheaper than uploading a buffer each frame and they do not slow down when the CPU is throttled. Software GL costs 13.5 µs per quad and cannot do particles at all.

Cited findings (my measurements, M4 / 6x throttle, median ms, 320x180):

| CPU draw path | N=500 | N=2,000 | N=8,000 | N=32,000 |
|---|---:|---:|---:|---:|
| Canvas2D `fillRect`, `fillStyle` per particle | 0.11 / 0.68 | 0.39 / 2.4 | 1.52 / 10.2 | 6.1 / 37.9 |
| Canvas2D `fillRect` grouped by colour (5 `fillStyle`) | 0.10 / 0.65 | 0.37 / 2.25 | 1.42 / 9.4 | 5.75 / 35.6 |
| Canvas2D `rect()` paths, 5 `fill()` | 0.065 / 0.41 | 0.26 / 1.62 | 1.55 / 9.9 | 6.9 / 41.3 |
| Canvas2D `drawImage` per particle | 0.41 / 2.55 | 1.66 / 10.5 | 6.55 / 41.5 | 26.1 / 165.9 |
| ImageData Uint32 writes + one `putImageData` | 0.014 / 0.087 | 0.020 / 0.13 | 0.043 / 0.27 | 0.14 / 0.82 |
| ImageData writes + SoA simulation step | 0.015 / 0.095 | 0.026 / 0.17 | 0.072 / 0.43 | 0.25 / 1.52 |

| Simulation step only (no draw) | N=500 | N=2,000 | N=8,000 | N=32,000 |
|---|---:|---:|---:|---:|
| Struct-of-arrays pool, swap-remove | 0.0011 / 0.0066 | 0.0068 / 0.042 | 0.028 / 0.17 | 0.114 / 0.69 |
| Array of objects, new array each frame | 0.0023 / 0.014 | 0.011 / 0.071 | 0.039 / 0.24 | 0.154 / 0.89 |
| Objects with fresh `{x,y}` vectors each frame + `filter()` | 0.0048 / 0.029 | 0.019 / 0.12 | 0.074 / 0.45 | 0.405 / 2.3 |

GPU (WebGL2, one instanced draw). Columns are Metal wall / Metal timer query / SwiftShader. Quote the wall column. The upload rows spend most of their time in JavaScript and `bufferSubData`, which the timer does not see.

| GPU path, 320x180 | N=500 | N=2,000 | N=8,000 | N=32,000 |
|---|---|---|---|---|
| Instanced quads, per-frame buffer upload | 0.0056 / 0.0024 / 6.7 | 0.016 / 0.0092 / 26.8 | 0.071 / 0.052 / 107 | 0.26 / 0.19 / 432 |
| Upload + JS simulation | 0.0067 / 0.0028 / 6.8 | 0.022 / 0.0086 / 27.5 | 0.086 / 0.036 / 109 | 0.34 / 0.15 / 433 |
| Stateless, vertex shader from (seed, age) | 0.0034 / 0.0024 / 6.8 | 0.0095 / 0.0089 / 27.4 | 0.045 / 0.052 / 108 | 0.15 / 0.17 / 433 |

- At 1280x720 the same rows cost 1.3x to 1.5x more (32,000 uploaded: 0.36 ms, stateless: 0.20 ms). Particles of 1 to 3 px are vertex-bound, not fill-bound.
- With Metal and the CPU throttled 6x, 8,000 particles cost 0.16 ms uploaded, 0.34 ms uploaded with the JS simulation, and 0.051 ms stateless.
- The GC cost of the allocating pools shows in the spread more than in the median. Throttled at N=32,000 the immutable-vector pool has p10/p90 of 2.0 / 3.2 ms around a 2.3 ms median. The SoA pool has 0.67 / 0.72 around 0.69.

Inferences:
- The realistic spell load is 1,300 particles. Every path except `drawImage` handles it (ImageData 0.11 ms throttled, `fillRect` 1.6 ms, `drawImage` 6.8 ms by interpolation). Choose the path for the 16x spike, where only ImageData and the GPU survive.
- The SoA pool is 1.3x faster than plain objects and 3.3x faster than the immutable-vector style. At 1,300 particles all three are under 0.1 ms throttled, so the pool matters for frame-time spikes, not for the average.
- In Godot terms, the stateless row is what a `GPUParticles2D` or a shader-driven `MultiMesh` does, and the upload row is `CPUParticles2D` (one buffer upload per emitter per frame). Godot's own per-emitter overhead was not measured here.

Gaps: no test of many small emitters (30 separate draws of 40 particles each). Key question 8 gives the per-draw cost that applies.

## Key question 2: flipbook impacts, Canvas2D, ImageData or WebGL2?

Takeaway: flipbooks are cheap everywhere. 120 concurrent 32x32 impacts cost 0.18 ms with `drawImage` (1.1 ms throttled) and 0.10 ms as ImageData ramp blits (1.0 ms throttled). ImageData wins for small sprites and loses its lead at 64x64, where the per-pixel loop costs as much as Skia's blit. `'lighter'` costs 35% to 45% more than normal blend in software Skia. On the GPU one batched draw of 480 sprites of 64x64 is 0.058 ms at 320x180, and alpha and additive cost the same.

Cited findings (M4 / 6x throttle, median ms, 320x180):

| CPU path | 32x32 N=30 | N=120 | N=480 | 64x64 N=30 | N=120 | N=480 |
|---|---:|---:|---:|---:|---:|---:|
| `drawImage` from atlas, normal | 0.056 / 0.36 | 0.18 / 1.09 | 0.67 / 4.0 | 0.11 / 0.67 | 0.39 / 2.35 | 1.55 / 9.9 |
| `drawImage`, `'lighter'` | 0.072 / 0.48 | 0.24 / 1.45 | 0.94 / 5.6 | 0.17 / 0.96 | 0.61 / 3.7 | 2.28 / 14.4 |
| ImageData blit, index frame + 5-step ramp | 0.036 / 0.24 | 0.10 / 1.01 | 0.40 / 4.0 | 0.11 / 1.03 | 0.41 / 2.33 | 1.6 / 9.2 |
| ImageData ramp-add into an index layer + resolve | 0.072 / 0.53 | 0.23 / 1.5 | 0.83 / 4.9 | 0.20 / 1.43 | 0.82 / 5.4 | 2.8 / 18.1 |

Overdraw (pixels per frame; the screen has 57,600):

| | 32x32 N=30 | N=120 | N=480 | 64x64 N=30 | N=120 | N=480 |
|---|---:|---:|---:|---:|---:|---:|
| Quad pixels blended (Canvas2D, GPU) | 30,720 | 122,880 | 491,520 | 122,880 | 491,520 | 1,966,080 |
| Effect pixels written (ImageData, non-zero only) | 5,265 | 21,165 | 84,660 | 21,196 | 85,380 | 341,520 |

GPU, one batched instanced draw with a per-frame instance upload. Metal wall / Metal timer / SwiftShader. Quote wall.

| GPU path | 32x32 N=30 | N=120 | N=480 | 64x64 N=30 | N=120 | N=480 |
|---|---|---|---|---|---|---|
| Alpha blend, 320x180 | 0.0026 / 0.0009 / 0.41 | 0.0058 / 0.0029 / 1.62 | 0.019 / 0.014 / 6.5 | 0.0055 / 0.0031 / 0.32 | 0.015 / 0.014 / 1.27 | 0.058 / 0.054 / 5.1 |
| Additive, 320x180 | 0.0031 / 0.0009 / 0.41 | 0.0053 / 0.0028 / 1.63 | 0.016 / 0.013 / 6.5 | 0.0052 / 0.0030 / 0.33 | 0.015 / 0.013 / 1.31 | 0.054 / 0.052 / 5.2 |
| Alpha blend, 1280x720 | 0.010 / 0.0068 / 0.60 | 0.040 / 0.029 / 2.4 | 0.14 / 0.14 / 9.5 | 0.035 / 0.027 / 1.9 | 0.13 / 0.12 / 7.7 | 0.52 / 0.52 / 30.6 |

- The fireball frames fill 17% of their quad on average. That is why the ImageData path writes 6x fewer pixels than the quad paths blend.
- 480 impacts of 64x64 blend 34 screens of pixels per frame. On M4 that is 0.058 ms at 320x180 and 0.52 ms at 1280x720, a 9x rise for 16x the pixels. Large flipbooks are fill-bound.

Inferences:
- The palette-ramp blit is "glow without alpha" for free. The frame stores ramp steps, the ramp is a 6-entry table, and recolouring per element or per friend/foe tier is a table swap.
- The ramp-add variant (overlaps climb one ramp step, a palette version of additive) costs about 2x the plain blit because of the extra read and the full-screen resolve. Use it on the impact layer only.
- Estimate: a phone GPU with one twentieth of the M4's fill rate would spend about 1 ms on 480 impacts of 64x64 at 320x180 and about 10 ms at 720p. This is an estimate from pixel counts, not a measurement.

## Key question 3: additive, palette-ramp glow, or a low-res glow buffer?

Takeaway: on the CPU the low-res glow buffer is the best deal. Max-splat 2,000 particles and 120 impacts into an 80x45 buffer, blur it with a 3x3 block sum, and let each screen pixel pick a glow colour through a Bayer threshold. The whole frame costs 0.095 ms (0.58 ms throttled), and 67% of that is the 320x180 select pass. Glow as 240 additive halo sprites in Canvas2D costs 0.46 ms (2.8 ms throttled) and scales with the number of emitters. On the GPU a separable 9-tap blur is 0.032 ms at 320x180 and 0.14 to 0.35 ms at 1280x720. A blur at 80x45 composited to 1280x720 costs 0.043 ms.

Cited findings (M4 / 6x throttle, median ms):

| CPU glow path, 320x180 | Cost |
|---|---:|
| Full-screen effects layer composite, source-over | 0.029 / 0.18 |
| Full-screen effects layer composite, `'lighter'` | 0.053 / 0.33 |
| Glow halos 32x32, `'lighter'`, N=60 / 240 / 960 | 0.13 / 0.79, 0.46 / 2.8, 1.78 / 11.5 |
| Glow halos 32x32, source-over, N=60 / 240 / 960 | 0.094 / 0.57, 0.33 / 2.1, 1.26 / 8.5 |
| Glow buffer 80x45, clear + max-splat (2,000 particles + 120 disks) | 0.012 / 0.090 |
| Glow buffer 80x45, 3x3 block-sum blur | 0.0029 / 0.037 |
| Glow buffer 80x45, Bayer palette select to 320x180 | 0.064 / 0.39 |
| Glow buffer 80x45, whole frame with present | 0.095 / 0.58 |
| Glow buffer 160x90, splat / blur / select | 0.046 / 0.26, 0.027 / 0.16, 0.084 / 0.51 |
| Glow buffer 160x90, whole frame with present | 0.165 / 1.01 |

GPU. Metal wall / Metal timer / SwiftShader. For these multi-pass rows the timer reads up to 2.5x higher than wall at 1280x720. The report should quote the wall number and give the timer as the upper bound (see Gaps).

| GPU glow path | to 320x180 | to 1280x720 |
|---|---|---|
| Separable 9-tap blur at target size + additive composite | 0.032 / 0.027 / 0.95 | 0.14 / 0.35 / 10.6 |
| Low-res glow 80x45, 120 impacts redrawn + blur + composite | 0.042 / 0.034 / 1.93 | 0.043 / 0.048 / 3.0 |
| Low-res glow 160x90, same | 0.042 / 0.034 / 2.08 | 0.043 / 0.046 / 3.2 |
| Low-res glow 320x180, same | not run | 0.043 / 0.071 / 3.8 |
| Glow as 240 additive halo quads of 32x32 | 0.0097 / 0.0067 / 3.2 | 0.070 / 0.059 / 4.5 |

Inferences:
- `'lighter'` adds 0.024 ms per full-screen composite on M4 and 0.15 ms throttled. It is affordable once per frame on a whole layer. It is not affordable per sprite on the low-end proxy at 4x load.
- The glow buffer's cost is nearly flat in the number of emitters. Halo sprites cost 1.9 µs each (12 µs throttled). The crossover is about 50 emitters, so with 30 casters the buffer wins.
- The select pass is the cost. Running the splat and blur every 4th frame, as the Acid study does, saves under 20%. Restricting the select pass to the bounding rows of lit cells saves more.
- On the GPU the three blur passes have a fixed floor of about 0.03 ms on M4 from render-target switches, so the 80x45 and 160x90 buffers cost the same there. The saving from low res appears only against a full-size blur at 720p (3.3x by wall, 7x by timer).
- On a real GPU additive halo quads are the cheapest glow of all (0.0097 ms for 240). Use blur only if the look needs it.

## Key question 4: trails for 60 / 240 / 960 missiles

Takeaway: a ring buffer drawn as Bresenham lines into ImageData is nearly free. 960 missiles with 12 points cost 0.14 ms (0.90 ms throttled). Afterimage sprites through `drawImage` are the expensive path at 4.1 ms for 960 missiles (27.9 ms throttled). The full-screen feedback buffer costs 0.047 ms at 60 missiles and 0.12 ms at 960, so it is near constant but not constant, because the pass does more work as more pixels stay lit.

Cited findings (M4 / 6x throttle, median ms, 320x180, includes moving the missiles):

| CPU trail path | M=60 | M=240 | M=960 |
|---|---:|---:|---:|
| ImageData ring of 8 points, Bresenham | 0.018 / 0.11 | 0.033 / 0.21 | 0.099 / 0.65 |
| ImageData ring of 12 points, Bresenham | 0.020 / 0.13 | 0.044 / 0.27 | 0.14 / 0.90 |
| ImageData ring of 16 points, Bresenham | 0.020 / 0.13 | 0.047 / 0.29 | 0.16 / 1.0 |
| Canvas2D stroked path per missile | 0.054 / 0.34 | 0.17 / 1.1 | 0.65 / 4.1 |
| Canvas2D one path for all missiles | 0.039 / 0.24 | 0.10 / 0.64 | 0.36 / 2.3 |
| Canvas2D afterimages, 4 pre-faded ghosts + head | 0.26 / 1.72 | 1.0 / 6.35 | 4.1 / 27.9 |
| Canvas2D afterimages with `globalAlpha` | 0.30 / 1.88 | 1.14 / 7.1 | 4.65 / 30.0 |
| ImageData afterimages, 4 ghosts + head | 0.033 / 0.21 | 0.096 / 0.60 | 0.35 / 2.2 |
| ImageData feedback buffer, fade every frame | 0.047 / 0.29 | 0.066 / 0.41 | 0.12 / 0.76 |
| ImageData feedback buffer, fade every 4th frame | 0.061 / 0.37 | 0.093 / 0.56 | 0.14 / 0.86 |
| Canvas2D feedback canvas, `destination-out` fade | 0.073 / 0.46 | 0.11 / 0.66 | 0.23 / 1.45 |

GPU. Metal wall / Metal timer / SwiftShader. Quote wall for the first two rows (JS fill and upload dominate). For the feedback row at 1280x720 the timer is 2.3x the wall, so give both.

| GPU trail path | M=60 | M=240 | M=960 |
|---|---|---|---|
| Ribbon as instanced segment quads, 320x180 | 0.0080 / 0.0029 / 8.7 | 0.030 / 0.013 / 34.5 | 0.096 / 0.052 / 139 |
| Afterimages batch (5 sprites each), 320x180 | 0.0051 / 0.0020 / 4.1 | 0.017 / 0.0069 / 16.6 | 0.069 / 0.035 / 66 |
| Feedback buffer (fade pass, heads, composite), 320x180 | 0.022 / 0.017 / 0.92 | 0.022 / 0.017 / 3.5 | 0.025 / 0.016 / 13.5 |
| Feedback buffer, 1280x720 | 0.047 / 0.11 / 2.5 | 0.046 / 0.10 / 5.1 | 0.049 / 0.11 / 15.2 |

Inferences:
- Missiles move 1.6 px per frame here (96 px/s, 6 tiles per second), so a 12-point ring is about 18 px long and each segment is 1 or 2 pixels. Trail length in points hardly changes the cost. Ring length is an art choice, not a budget choice.
- Canvas2D stroked paths are antialiased, which is wrong for pixel art. They are also 4x to 5x slower than Bresenham. There is no reason to use them.
- Fading the feedback buffer every 4th frame is slower per frame, not faster, because trails stay lit 4x longer and the resolve pass paints more pixels. Fade every frame, or at the 75 ms effect clock for the look, and do not expect savings from the slower clock.
- On the GPU the feedback buffer is the only trail whose cost does not grow with missile count. It wins above about 200 missiles on M4. At 30 missiles the ribbon is cheaper and has no smear when the camera scrolls.

Gaps: the feedback buffer is screen-space. When the camera scrolls, the previous frame must be shifted, which I did not measure.

## Key question 5: chain lightning

Takeaway: generating a bolt is nothing. A 32-segment bolt with 2 branches of 8 segments takes 0.17 µs to generate and about 2 µs to rasterise with a 3 px halo and a 1 px core in ImageData (13 µs throttled). 40 bolts regenerated every frame cost 0.095 ms (0.62 ms throttled). Regenerating every 3rd frame saves 30% of a small number. Canvas2D strokes are 10x slower, at 0.92 ms for 40 bolts (5.85 ms throttled).

Cited findings (M4 / 6x throttle, median ms, 320x180):

| Path | N=10 | N=40 | N=160 |
|---|---:|---:|---:|
| Generate only, 5 levels (32 + 16 segments), no draw | 0.0017 / 0.010 | 0.0066 / 0.040 | 0.026 / 0.16 |
| Generate only, 6 levels (64 + 16 segments), no draw | 0.0026 / 0.016 | 0.010 / 0.062 | 0.040 / 0.25 |
| ImageData, 5 levels, regenerate every frame | 0.032 / 0.21 | 0.095 / 0.62 | 0.35 / 2.35 |
| ImageData, 5 levels, regenerate every 3rd frame | 0.024 / 0.15 | 0.067 / 0.42 | 0.29 / 1.82 |
| ImageData, 6 levels, regenerate every frame | 0.038 / 0.24 | 0.12 / 0.74 | 0.44 / 2.97 |
| ImageData, 6 levels, regenerate every 3rd frame | 0.029 / 0.18 | 0.084 / 0.52 | 0.39 / 2.3 |
| Canvas2D stroke 3 px + 1 px, 5 levels, every frame | 0.24 / 1.58 | 0.92 / 5.85 | 3.67 / 23.7 |
| Canvas2D stroke 3 px + 1 px, 5 levels, every 3rd frame | 0.22 / 1.36 | 0.91 / 5.7 | 3.6 / 23.8 |

GPU, bolts as instanced segment quads (96 instances per bolt, halo then core). Metal wall / Metal timer / SwiftShader. Quote wall.

| GPU path, 320x180 | N=10 | N=40 | N=160 |
|---|---|---|---|
| Regenerate and upload every frame | 0.014 / 0.0084 / 12.8 | 0.054 / 0.031 / 51 | 0.19 / 0.10 / 207 |
| Regenerate and upload every 3rd frame | 0.011 / 0.0084 / 12.8 | 0.039 / 0.031 / 51 | 0.13 / 0.10 / 206 |

Inferences:
- Regenerate on the look's clock, not the budget's. Every 3rd frame (50 ms) or every 75 ms effect tick reads as a crackle. Every frame reads as noise. The cost difference is 0.2 ms at most on the proxy.
- The 6th subdivision level adds 20% to 25% and at 320x180 its segments are shorter than 2 px. 5 levels (32 segments) is enough, which matches the Tibia-scale figure.

## Key question 6: tile area effects, the Tibia "UE" case

Takeaway: the worst case is 30 casters each firing the 73-tile UE mask, 2,190 live tile effects. At 16x16 that is 2.2 ms with `drawImage` (14.1 ms throttled) and 0.51 ms as ImageData blits (2.9 ms throttled). On a real GPU it is one draw of 0.024 ms. The screen only has 220 tiles, so 2,190 effects stack about 10 deep. Keeping one effect per tile caps the cost at the N=220 row, 0.22 ms `drawImage` or 0.06 ms ImageData (1.4 / 0.39 ms throttled).

Cited findings (M4 / 6x throttle, median ms, 320x180):

| Live tile effects | 148 (4 x 37) | 220 (one per tile) | 592 | 1,110 (30 x 37) | 2,190 (30 x 73) | 2,368 (16x load) |
|---|---:|---:|---:|---:|---:|---:|
| Canvas2D `drawImage`, 16x16 | 0.15 / 0.97 | 0.22 / 1.4 | 0.58 / 3.9 | 1.04 / 6.5 | 2.2 / 14.1 | 2.25 / 14.4 |
| Canvas2D `drawImage` `'lighter'`, 16x16 | 0.18 / 1.16 | 0.26 / 1.68 | 0.68 / 4.35 | 1.26 / 8.2 | 2.55 / 16.0 | 2.7 / 17.6 |
| ImageData ramp blit, 16x16 | 0.047 / 0.28 | 0.060 / 0.39 | 0.14 / 0.86 | 0.25 / 1.53 | 0.51 / 2.87 | 0.53 / 3.17 |
| Canvas2D `drawImage`, 32x32 | | | | 1.48 / 9.0 | 2.93 / 18.7 | |
| ImageData ramp blit, 32x32 | | | | 0.91 / 5.35 | 2.03 / 10.6 | |
| Quad pixels, 16x16 (screens of overdraw) | 37,888 (0.7x) | 56,320 (1.0x) | 151,552 (2.6x) | 284,160 (4.9x) | 560,640 (9.7x) | 606,208 (10.5x) |
| Quad pixels, 32x32 | | | | 1,136,640 (19.7x) | 2,242,560 (38.9x) | |

GPU, one batched draw. Metal wall / Metal timer / SwiftShader. The two columns agree here. Quote wall.

| GPU path | 148 | 1,110 | 2,190 |
|---|---|---|---|
| 16x16 at 320x180 | 0.0031 / 0.0012 / 2.0 | 0.013 / 0.0078 / 15.1 | 0.024 / 0.018 / 30.0 |
| 32x32 at 320x180 | | 0.040 / 0.036 / 15.0 | 0.078 / 0.071 / 29.5 |
| 16x16 game tiles at 1280x720 (64 px on screen) | 0.014 / 0.010 / 1.6 | 0.089 / 0.079 / 12.3 | 0.17 / 0.16 / 23.9 |
| 32x32 game tiles at 1280x720 (128 px on screen) | | 0.32 / 0.32 / 22.4 | 0.60 / 0.62 / 42.9 |

- The 32x32 rows place the sprites at free positions, since 32 px tiles would not fit the 20 x 11 grid. They show the cost of drawing Tibia-size tiles on the same 320x180 screen.
- A `drawImage` of a 16x16 tile costs 0.93 µs (5.9 µs throttled). An ImageData blit costs 0.21 µs (1.35 µs throttled).

Inferences:
- 2,190 UE tiles at 32x32 native 720p blend 39 screens of 1280x720, which is 35.9 million pixels per frame. The M4 does it in 0.6 ms. Estimate: a phone GPU that fills 500 million blended pixels per second would need about 70 ms. This is the single most dangerous case in the study for a native-resolution renderer and the strongest argument for rendering at 320x180.
- Deduplicate per tile. When 30 UEs overlap, the player cannot see 10 stacked copies of the same frame. Keep the newest (or the highest-priority tier) per tile and the cost is bounded by 220 draws whatever the caster count.

## Key question 7: full-screen passes

Takeaway: at 320x180 no full-screen pass is a problem. A CPU pass over 57,600 pixels costs 0.05 to 0.065 ms beyond the baseline (0.32 to 0.41 ms throttled), so three or four of them fit. A Canvas2D flash fill is 0.004 ms beyond the baseline. On the GPU a shockwave that reads the screen costs 0.021 ms at 320x180 and 0.039 ms at 1280x720 by wall, and nearly all of it is the framebuffer copy.

Cited findings, CPU (M4 / 6x throttle, median ms, baseline included: 0.016 / 0.096 Canvas2D, 0.012 / 0.076 ImageData):

| CPU pass, 320x180 | Cost |
|---|---:|
| Canvas2D flash, `fillRect` rgba 0.6 | 0.019 / 0.12 |
| Canvas2D flash, `fillRect` with `'lighter'` | 0.047 / 0.30 |
| Canvas2D vignette, `drawImage` of a pre-rendered gradient | 0.029 / 0.19 |
| ImageData flash, 50% white by bit trick | 0.063 / 0.40 |
| ImageData vignette, dithered 2-level mask | 0.067 / 0.43 |
| ImageData palette LUT, rgb555 key into a 32,768-entry table | 0.077 / 0.48 |
| ImageData indexed frame resolve, Uint8 index to palette | 0.071 / 0.45 |
| ImageData indexed resolve through a colormap (level, index) | 0.076 / 0.47 |
| ImageData shockwave ring, radius 40, with frame copy | 0.026 / 0.16 |
| ImageData frame copy only | 0.015 / 0.092 |

GPU. Metal wall / Metal timer / SwiftShader. For the three copy rows at 1280x720 the timer is about 2.4x the wall. Quote wall, give the timer as the upper bound.

| GPU pass | 320x180 | 1280x720 |
|---|---|---|
| Flash quad | 0.0009 / 0.0005 / 0.018 | 0.0055 / 0.0050 / 0.19 |
| Vignette shader | 0.0014 / 0.0007 / 0.027 | 0.0092 / 0.0084 / 0.34 |
| Framebuffer copy (`blitFramebuffer`) + flash | 0.021 / 0.016 / 0.13 | 0.028 / 0.067 / 1.62 |
| Shockwave distortion with framebuffer copy | 0.021 / 0.017 / 0.20 | 0.039 / 0.098 / 2.31 |
| Palette LUT pass (32x32x32) with framebuffer copy | 0.021 / 0.017 / 0.21 | 0.040 / 0.094 / 2.52 |

Inferences:
- The CPU shockwave only touches the ring band, so it costs less than any whole-screen loop. 0.011 ms of its 0.026 ms is the frame copy.
- An indexed frame (Uint8 indices resolved through a palette at the end) costs one extra full-screen pass, about 0.06 ms on M4 and 0.37 ms throttled. In return, status tints, flashes, vignettes and day/night are colormap row swaps inside that same pass. One resolve pass replaces three separate full-screen passes.
- On the GPU the screen copy is the cost of every screen-reading effect. Two shockwaves in one frame need one copy, not two. In Godot this is the back-buffer copy that `hint_screen_texture` triggers, and each `BackBufferCopy` node adds another.
- In software GL the 720p shockwave is 2.3 ms and the 320x180 one is 0.2 ms, an 11.6x gap. That ratio is close to the 16x pixel ratio and is the clearest fill-rate signal in the data.

## Key question 8: auras, orbiters and status tint

Takeaway: 30 characters with a back aura, a front aura and 6 orbiters are 270 draws. Canvas2D takes 0.25 ms (1.62 ms throttled), ImageData 0.039 ms (0.24 ms throttled), a GPU batch 0.006 ms. A status tint is free if it is a pre-tinted cached sprite or a palette swap. Tinting per frame with `source-atop` on a temp canvas adds 30% in software and makes the frame 4.7x slower on a GPU-backed canvas. A per-frame `getImageData` remap is the trap, at 9 ms for 30 characters and 32.6 ms for 120 on the `metal` config.

Cited findings, CPU (default / 6x throttle / metal, median ms, 320x180; subtract 0.18 from metal):

| CPU path | C=30 | C=120 |
|---|---:|---:|
| Canvas2D, no tint | 0.25 / 1.62 / 0.51 | 0.94 / 6.0 / 1.45 |
| Canvas2D, tint (a) pre-tinted cached sprite | 0.25 / 1.55 / 0.53 | 0.94 / 6.0 / 1.37 |
| Canvas2D, tint per frame via `source-atop` on a temp canvas | 0.32 / 2.1 / 2.4 | 1.23 / 7.8 / 8.5 |
| Canvas2D, tint (b) per frame `getImageData` remap + `putImageData` | 0.35 / 2.25 / 9.0 | 1.35 / 8.6 / 32.6 |
| ImageData, no tint | 0.039 / 0.24 / 0.040 | 0.12 / 0.73 / 0.12 |
| ImageData, tint (b) as a palette swap at blit time | 0.040 / 0.24 / 0.040 | 0.12 / 0.75 / 0.12 |

GPU. Metal wall / Metal timer / Metal wall with 6x CPU throttle. Quote wall. The cost of breaking a batch is CPU and driver time, which the timer undercounts.

| GPU path, 320x180 | C=30 | C=120 |
|---|---|---|
| One batch of 9 sprites per character, no tint | 0.0061 / 0.0022 / 0.024 | 0.021 / 0.0068 / 0.089 |
| Tint (c) as a per-instance vertex attribute, 1 draw | 0.0065 / 0.0022 / 0.029 | 0.021 / 0.0068 / 0.098 |
| Tint (c) as a per-sprite uniform, C + 2 draws | 0.015 / 0.0057 / 0.053 | 0.041 / 0.011 / 0.16 |

- SwiftShader takes 3.8 ms for C=30 and 14.9 ms for C=120 on every GPU row (about 13.8 µs per quad).

Inferences:
- A per-sprite uniform splits the batch into one draw per character. Here that costs 2x to 2.5x the batched frame, about 0.3 µs per extra draw on M4 and 0.8 µs with the CPU throttled. At 30 characters it is 0.01 ms and harmless. The rule still matters, because the same split applied to 1,110 tile effects or 1,300 particles would cost about 1 ms with the CPU throttled 6x, and more on a slower driver (estimate).
- In Godot 4 Compatibility a `ShaderMaterial` uniform set per node breaks batching the same way. Pass the tint through `modulate` (vertex colour) or `instance uniform` so it travels as per-instance data.
- The back and front halves cost nothing extra. They are two sprites in the same y-sorted batch.

Gaps: Godot's per-node cost for 30 aura scenes (8 child nodes each) was not measured. It will exceed these draw costs.

## Key question 9: the whole 30-caster scene, with and without a clarity manager

Takeaway: the whole 1x scene is 0.26 ms in the ImageData pipeline (1.5 ms on the low-end proxy, 9% of the frame) and 0.97 ms in naive Canvas2D (6.15 ms on the proxy). At 16x load ImageData still fits the proxy budget at 12.6 ms. Canvas2D breaks at 4x (24.9 ms). On a real GPU the 1x scene is 0.09 ms at 320x180 with a 4x upscale and 0.24 ms (wall) to 0.57 ms (timer) native at 1280x720. Software GL takes 35 ms for the 1x scene and is not a usable fallback. The clarity manager as specified (others at 40% particles, no glow) saves 26% at 1x and 16% at 16x on the CPU, because tiles, auras and impacts dominate at high load and it does not touch them.

Cited findings, CPU (M4 / 6x throttle / metal config, median ms, 320x180):

| CPU pipeline | 1x | 4x | 16x |
|---|---:|---:|---:|
| ImageData, clarity off | 0.26 / 1.5 / 0.26 | 0.63 / 3.9 / 0.62 | 2.0 / 12.6 / 2.08 |
| ImageData, clarity on | 0.20 / 1.11 / 0.20 | 0.51 / 3.1 / 0.51 | 1.74 / 10.6 / 1.72 |
| Canvas2D, clarity off | 0.97 / 6.15 / 1.2 | 3.97 / 24.9 / 4.15 | 15.5 / 98.5 / 15.6 |
| Canvas2D, clarity on | 0.70 / 4.4 / 1.01 | 2.8 / 18.1 / 3.6 | 11.0 / 71.2 / 11.9 |

Per-layer split of the ImageData scene on the low-end proxy (mean ms over 200 frames, clarity off / on). The timer resolution is coarse, so read these to one significant figure.

| Layer | 1x | 4x | 16x |
|---|---:|---:|---:|
| Tile effects | 0.19 / 0.18 | 0.76 / 0.76 | 3.16 / 3.15 |
| Auras + characters | 0.16 / 0.16 | 0.68 / 0.69 | 2.75 / 2.73 |
| Missiles + trails | 0.05 / 0.02 | 0.14 / 0.19 | 0.58 / 0.60 |
| Impact flipbooks | 0.15 / 0.17 | 0.57 / 0.57 | 2.36 / 2.33 |
| Particles (simulate + draw) | 0.055 / 0.023 | 0.22 / 0.11 | 0.94 / 0.44 |
| Lightning | 0.04 / 0.03 | 0.17 / 0.16 | 0.82 / 0.73 |
| Glow buffer 80x45 | 0.44 / 0.09 | 0.75 / 0.20 | 1.32 / 0.37 |
| Shockwave + vignette | 0.25 / 0.44 | 0.45 / 0.43 | 0.53 / 0.50 |
| Ground copy + present | 0.11 / 0.10 | 0.12 / 0.10 | 0.13 / 0.18 |

GPU scene. The first three columns are Metal wall / Metal timer / Metal wall with 6x CPU throttle. The last is SwiftShader. The report should quote the wall number and give the timer as the upper bound for the native rows, where it reads 2.4x higher.

| GPU scene | 1x | 4x | 16x | SwiftShader 1x / 4x / 16x |
|---|---|---|---|---|
| 320x180 + 4x upscale, clarity off | 0.090 / 0.080 / 0.13 | 0.095 / 0.20 / 0.40 | 0.25 / 0.25 / 1.55 | 35 / 139 / 556 |
| 320x180 + 4x upscale, clarity on | 0.085 / 0.086 / 0.10 | 0.092 / 0.15 / 0.30 | 0.17 / 0.23 / 1.08 | 25.5 / 96.5 / 385 |
| Native 1280x720, clarity off | 0.24 / 0.57 / 0.24 | 0.32 / 0.76 / 0.44 | 0.66 / 1.55 / 1.53 | 47.8 / 150 / 567 |
| Native 1280x720, clarity on | 0.24 / 0.56 / 0.24 | 0.30 / 0.71 / 0.31 | 0.56 / 1.30 / 1.08 | 36.8 / 106 / 390 |

- SwiftShader with 6x throttle on the 320x180 scene gives 36.9 / 141.6 / 563 ms, the same as unthrottled. SwiftShader's raster threads are not slowed by DevTools throttling.
- Native 720p costs 2.6x the low-res scene by wall and 7.1x by timer at 1x load. At 16x it is 2.7x by wall and 6.1x by timer.
- The GPU scene's glow pass runs whether one emitter or thirty feed it, so clarity saves almost nothing on the GPU at 1x (0.090 to 0.085 ms). At 16x it saves 30% through the smaller particle upload.

Inferences:
- The hard case fits. 30 casters at once cost 1.5 ms on the low-end proxy in a hand-written pixel pipeline, and 0.1 ms of GPU work on M4. The effects are not the bottleneck at 320x180. The risks are elsewhere: per-node engine overhead in Godot, draw-call splits, and fill rate if the game renders native.
- Clarity is a readability tool first. Its performance value is at spike loads, and only if it also caps what dominates there. To make it bite, add two rules that the per-layer table points at. One effect per tile (bounds the tile layer at 220), and a cap on concurrent impact flipbooks for the "others" tier.
- With clarity on at 1x, glow drops from 0.44 to 0.09 ms on the proxy, because fewer lit cells pass the select threshold. Glow is the largest single layer at 1x and the cheapest to cut.
- Estimate for a low-end phone GPU on the native 720p scene: if its fill rate is 20x below the M4's, the 1x native scene's GPU time would be 5 to 11 ms (wall to timer) and the 4x scene 6 to 15 ms. The 320x180 scene would be 2 to 4 ms. These are scaled guesses, not measurements.

Gaps: the clarity run changes particles and glow only. Opacity reduction for others' effects was not timed (on the ImageData path it is a ramp swap, on the GPU a per-instance alpha, both free).

## Part A: published numbers

I had 5 web calls and found little that is measured.

Cited findings:
- PixiJS v8 `ParticleContainer`: the author reports 1,000,000 particles at 60 fps on a MacBook Pro M3, against 200,000 sprites at 60 fps in a normal `Container`, and "over 3x" faster than the v7 particle container. Only position is uploaded each frame by default. Scale, rotation and colour are static unless flagged dynamic. Posted 3 October 2024 by Mat Groves. Vendor-reported, one machine. https://pixijs.com/blog/particlecontainer-v8
- That works out to about 17 ns per particle per frame at the limit. My upload path measured 8 ns per particle on M4 (0.26 ms for 32,000), so the two are in the same range.
- Godot 4 on the web runs the Compatibility renderer (WebGL 2.0) only. https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_web.html
- Godot's 2D particle docs say `CPUParticles2D` has lower performance with large particle counts but "may perform better on low-end systems or in GPU-bottlenecked situations", and recommend `GPUParticles2D` otherwise. No counts or frame times are given. https://docs.godotengine.org/en/stable/tutorials/2d/particle_systems_2d.html
- Godot forum threads report particles failing to render in web exports, for `GPUParticles2D` and, in Godot 4.3, for `CPUParticles2D` (tracked as a web regression). These are correctness reports, not timings. https://forum.godotengine.org/t/particles-dont-render-in-web-exports/1756 and https://forum.godotengine.org/t/cpuparticles2d-is-not-running-on-html5-builds/78273
- A third-party guide gives 1,000 to 5,000 as a practical `CPUParticles2D` limit and recommends CPU particles for Compatibility. Unverified, no measurement behind it. https://godot-mcp.pages.dev/guides/godot4-particles
- A MeasureThat microbenchmark on a 320x180 buffer in Firefox 140 lists about 1,033 ops/s for one `putImageData` against 11.8 ops/s for `fillRect` per pixel, an 88x gap. I read this from the search summary and did not open the page. https://benchmarklab.azurewebsites.net/Benchmarks/Show/33592/1/drawing-pixels-putimagedata-vs-fillrect-v2

Inferences:
- My Canvas2D numbers agree in direction with the MeasureThat figure. Per pixel written, ImageData beat `fillRect` by about 50x here.
- I found no measured Godot web particle counts. The 1,000 to 5,000 figure is folklore until someone measures it. A Godot web export test of `CPUParticles2D` against `GPUParticles2D` at 1,300 and 20,800 particles would close the largest gap in this file.

## Budget table for a 30-caster fight

Recommended technique per layer at the 1x load, with its measured cost on the low-end proxy (`default` + 6x CPU throttle, ImageData pipeline, from the per-layer table). The GPU column is Metal wall time from the single-layer tests at 320x180, for a WebGL2 or Godot Compatibility build. It measures an M4, not a phone.

| Layer | Recommended technique | Low-end proxy, ms | GPU (M4 Metal), ms |
|---|---|---:|---:|
| Tile area effects (148 live) | One effect per tile, 16x16 ramp blit. GPU: one batched draw | 0.19 | 0.003 |
| Auras, orbiters, characters (30) | Back and front halves in the y-sorted batch. Tint by palette swap or per-instance attribute | 0.16 | 0.006 |
| Missiles + trails (30) | Ring buffer of 8 to 12 points, Bresenham lines. GPU: instanced segment quads | 0.05 | 0.008 |
| Impact flipbooks (30) | 32x32 index frames through a 5-step ramp. GPU: one additive batch | 0.15 | 0.003 |
| Particles (1,300) | SoA pool with swap-remove, pixel writes. GPU: stateless in the vertex shader | 0.055 | 0.008 |
| Chain lightning (4 bolts) | Midpoint displacement, 5 levels, 2 branches, regenerate every 50 to 75 ms | 0.04 | 0.014 |
| Glow | 80x45 max-blend buffer, 3x3 block sum, Bayer palette select. GPU: additive halo quads, or an 80x45 blur if the look needs it | 0.44 | 0.01 to 0.042 |
| Screen feedback | One shockwave over the ring band, a dithered vignette mask. GPU: one screen copy shared by all screen-reading effects | 0.25 | 0.022 |
| Ground copy + present | `putImageData` once. GPU: nearest 4x upscale | 0.11 | 0.012 |
| Total, 1x | Sum of layers: 1.45. Measured as one scene: 1.5 | 1.5 | 0.090 (scene) |
| Total, 4x | Measured as one scene | 3.9 | 0.095 |
| Total, 16x | Measured as one scene | 12.6 | 0.25 |
| Worst case add-on: 30 UEs of 73 tiles | Without per-tile dedupe 2.87. With dedupe (220 tiles) 0.39 | 0.39 | 0.024 undeduped |

What not to use, with the measured reason:

| Anti-pattern | Measured cost | Use instead |
|---|---|---|
| `drawImage` per particle | 10.5 ms for 2,000 on the proxy | Pixel writes, 0.13 ms |
| Afterimage trails through `drawImage` | 6.35 ms for 240 missiles on the proxy | ImageData ghosts 0.60 ms, or a ribbon 0.27 ms |
| Canvas2D stroked lightning | 5.85 ms for 40 bolts on the proxy | Bresenham halo + core, 0.62 ms |
| Per-frame `getImageData` tint | 9 ms for 30 characters on a GPU canvas | Palette swap or cached sprite, 0 extra |
| Per-sprite shader uniform | 2x to 2.5x the batched cost, one draw per sprite | Per-instance attribute |
| Full-size blur at 720p | 0.14 to 0.35 ms on M4, 10.6 ms in software GL | Blur at 80x45, 0.043 ms |
| Native 1280x720 effects | 2.6x to 7x the 320x180 scene on M4. 39 screens of overdraw for 30 UEs at 32x32 | Render at 320x180, upscale once |
| WebGL2 on software GL | 35 ms for the 1x scene | Detect it and fall back to the ImageData path, 0.26 ms |

## Gaps

- No real phone was measured. `throttle6` slows JavaScript and Skia by about 6x. It does not model a phone GPU, thermal throttling or a slow driver. Every phone GPU figure in this file is a scaled estimate and is marked as one.
- The Metal timer query reads 2.3x to 2.5x higher than the wall slope on multi-pass tests at 1280x720 (blur, screen copy, feedback buffer, native scene). A probe with timer batches of 25, 100, 400 and 1,600 frames gave the same per-frame value each time (`scratch-bench/ktprobe.log`), so it is not a fixed latency. Wall time ends in a hard sync and cannot under-report throughput, so I quote wall. My guess is that the timer sums pass times that overlap on the GPU. I could not confirm that.
- The wall slope measures CPU and GPU working in parallel, so it is close to the larger of the two, not their sum.
- Godot itself was not run. Node overhead, `CPUParticles2D` and `GPUParticles2D` on a web export, and Godot's batching limits are not in these numbers.
- Sprites here are simple code-built shapes. Real flipbooks with denser frames will write more pixels on the ImageData path. The fireball frames fill 17% of their quad.
- Camera scroll for the feedback buffer, text (damage numbers) and audio were not measured.
- Part A is thin. I found one vendor figure (PixiJS) and no measured Godot web particle numbers.

## Sources

- My measurements: `studies/vfx-magic/notes/bench/magicbench.html`, `run.py`, `results-*.json`. Logs in `studies/vfx-magic/notes/scratch-bench/`.
- Harness and configs: `studies/vfx-grass/notes/11-benchmarks.md`, `studies/vfx-grass/notes/bench/grassbench.html`.
- Glow method: Acid study F2, `studies/vfx-acid/report.md`, https://kingsfoil-artifacts.netlify.app/vfx-acid-topdown-pixel
- PixiJS v8 ParticleContainer post (vendor-reported): https://pixijs.com/blog/particlecontainer-v8
- Godot docs, exporting for the web: https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_web.html
- Godot docs, 2D particle systems: https://docs.godotengine.org/en/stable/tutorials/2d/particle_systems_2d.html
- Godot forum, particles in web exports: https://forum.godotengine.org/t/particles-dont-render-in-web-exports/1756
- Godot forum, CPUParticles2D on HTML5 builds (4.3): https://forum.godotengine.org/t/cpuparticles2d-is-not-running-on-html5-builds/78273
- Third-party Godot particles guide (unverified figures): https://godot-mcp.pages.dev/guides/godot4-particles
- MeasureThat, putImageData vs fillRect (search summary only): https://benchmarklab.azurewebsites.net/Benchmarks/Show/33592/1/drawing-pixels-putimagedata-vs-fillrect-v2
