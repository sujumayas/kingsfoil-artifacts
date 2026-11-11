# 09. Runtime cost of combat juice: measured benchmarks

Researcher angle: runtime cost. Every number is tagged MEASURED (our bench), CITED (a source says it) or ESTIMATE (arithmetic or inference). Almost everything here is MEASURED. Inferences are marked.

## Machine and setup
- Apple M4 Pro, 14 cores, 48 GB RAM, macOS 26.5.1 (25F80). From `sysctl` and `sw_vers`.
- Chromium 153.0.8010.12 via Playwright (headless), from the repo `.venv`. Same machine and browser as study #1 (`feel-npc-dialog/notes/07-benchmarks.md`).
- Harness, all in `notes/bench/`:
  - `juicebench.html` has every test. No external assets. Sprites, digit font and patterns are generated in code.
  - `run.py <config> [throttle6] [frames=N] [sections=...]` runs one condition and writes `results-<config>.json`.
  - `runall.sh` reruns all three conditions and rebuilds `summary-table.md` with `summarize.py`.
  - `summary-table.md` holds every row. `log-*.txt` are the raw console logs.
- Conditions:
  - `metal` is the real-GPU run, with `--use-angle=metal`. WebGL reports "ANGLE Metal Renderer: Apple M4 Pro".
  - `metal-throttle6` is metal plus CDP `Emulation.setCPUThrottlingRate` 6. It stands in for a low-end phone or Chromebook CPU. It slows the main thread, not the GPU or the audio thread.
  - `swiftshader` uses `--use-angle=swiftshader --disable-gpu-rasterization`. WebGL reports "SwiftShader driver", so the WebGL rows are true software GL. Canvas2D in this config is mixed (see the method caveats).
- Method changes from study #1:
  - The page is served from a local http server with COOP/COEP headers, so it is `crossOriginIsolated` and `performance.now()` has 5 µs resolution instead of 100 µs on file://. That is why medians are usable now.
  - I report median and p95 (study #1 reported mean and p95).
  - Each timed frame clears, simulates, draws, presents to a 1280x720 display canvas, and reads back 1 pixel to force the GPU to finish. So every cell is the whole frame including that flush. Subtract the baseline row of the same target to get the effect alone.
  - 30 warm-up frames, then 200 timed frames (metal) or 100 (throttle6, swiftshader). If a warm-up frame takes over 40 ms, the test drops to 20 timed frames, marked "(20f)".
- Targets:
  - `lowres` draws into a 320x180 canvas and upscales once with nearest filtering.
  - `native` draws straight into 1280x720 at 4x.
  - WebGL2 draws into its own canvas at 320x180 or 1280x720, one instanced draw call per effect.
- Budget: 16.7 ms per frame at 60 Hz. Juice has to share that with the world, sprites, UI, netcode and Godot's own overhead. I treat 2 ms total for juice as a sane target on a weak device.

### Method caveats (read before quoting)
- Chrome rasterizes small 2D canvases on the CPU. 320x180 = 57,600 px, which is under the area where Chrome turns on GPU acceleration for a canvas. ESTIMATE: I did not confirm the exact threshold in Chromium source. The data fits this: lowres Canvas2D baselines are slower than native ones (0.65 vs 0.24 ms on metal, 3.37 vs 1.70 ms under throttle), and lowres rows behave like software rows in the swiftshader config.
- In the swiftshader config, native 1280x720 Canvas2D rows match metal almost exactly. Chrome still composited the big canvas on the GPU. So only the WebGL rows and the lowres Canvas2D rows in that column show the software case.
- CDP throttling pauses the main thread in slices. Very short JS sections (under 0.05 ms, such as one audio trigger) can dodge it and read faster than unthrottled. Don't quote throttled trigger costs.
- This is browser Canvas2D and WebGL2, not Godot. Godot's web export runs its own WebGL2 renderer through WASM. The WebGL2 rows are the closest stand-in for Godot. Canvas2D rows show what a hand-written JS client would pay. Take away the ratios and the draw-call lesson, not the absolute ms.

## Headline table (median ms per frame, whole frame, lower is better)

Baselines (empty frame): lowres Canvas2D 0.65 (metal) / 3.37 (throttle6) / 0.56 (swiftshader). WebGL2 320x180 0.22 / 0.88 / 0.05.

| Test | metal | throttle6 | swiftshader |
|---|---|---|---|
| 1000 dmg numbers, glyph blits (c2d lowres) | 3.38 | 13.18 | 41.9 |
| 1000 dmg numbers, fillText | 1.59 | 6.93 | 38.9 |
| 1000 dmg numbers, cached sprites | 2.66 | 9.46 | 17.1 |
| 1000 hits aggregated to 100, glyph blits | 0.94 | 4.18 | 5.77 |
| 1000 hits aggregated to 100, cached sprites (churn) | 3.75 | 43.2 | 4.67 |
| 1000 dmg numbers, WebGL2 instanced digits | 0.25 | 1.07 | 37.7 |
| 10000 particles, fillRect (c2d lowres) | 2.79 | 8.22 | 143 |
| 10000 particles, drawImage | 10.99 | 44.9 | 159 |
| 10000 particles, WebGL2 points, CPU sim | 0.29 | 1.23 | 0.96 |
| 10000 particles, WebGL2 points, GPU sim | 0.23 | 1.17 | 0.90 |
| 100 flashing sprites, pre-baked white | 0.75 | 3.63 | 2.28 |
| 100 flashing sprites, source-atop per frame | 16.0 | 79.6 | 9.86 |
| 100 flashing sprites, ctx.filter (lowres / native) | 5.39 / 442 | 8.61 / 2740 | 28.5 / 472 |
| 100 flashing sprites, WebGL2 instance attribute | 0.21 | 0.72 | 1.55 |
| Shake: none vs setTransform vs CSS (236-blit scene) | 0.84 / 0.86 / 0.84 | 4.00 / 3.94 / 3.88 | 4.00 / 4.18 / 4.03 |
| 20 telegraphs, real alpha vs dither (c2d native) | 0.73 / 1.06 | 4.45 / 6.67 | 0.76 / 1.10 |
| 20 telegraphs, WebGL2 alpha vs dither (native) | 0.24 / 0.28 | 1.06 / 1.07 | 2.29 / 2.16 |
| Audio, 128 hits/s (about 38 voices), audio thread | 3.6% of a core | 3.6% | 3.7% |

## Q1. Damage numbers (50 / 200 / 1000 alive)

### Takeaway
Damage numbers fit the budget on a real GPU at any count we tried. On a slow CPU, 1000 per-glyph numbers cost 10 ms over baseline, most of a phone's frame. Aggregation is the biggest lever: folding about 10 hits into one number per target cuts 1000 live numbers to 100 and the cost by 4-7x in every condition. Caching each number string as a sprite helps raw counts (2.66 vs 3.38 ms on metal, 17 vs 42 ms in software) but hurts aggregated numbers, because a running total changes value every few frames and keeps rebuilding the cache. In WebGL2, one instanced draw for all digits costs almost nothing on a GPU (0.25 ms for 1000 numbers, about 3000 glyph quads).

### Measured results (median / p95 ms, lowres Canvas2D unless noted)

| Numbers alive | Method | metal | throttle6 | swiftshader |
|---|---|---|---|---|
| 50 | glyph blits | 0.78 / 0.84 | 3.69 / 5.20 | 2.81 / 3.00 |
| 50 | fillText | 0.70 / 0.74 | 3.53 / 4.91 | 2.71 / 2.91 |
| 50 | cached sprites | 0.76 / 1.96 | 3.98 / 9.43 | 1.60 / 2.40 |
| 200 | glyph blits | 1.10 / 1.21 | 4.79 / 6.08 | 8.88 / 9.19 |
| 200 | fillText | 0.83 / 0.91 | 3.98 / 5.23 | 8.46 / 8.98 |
| 200 | fillText + strokeText outline | 1.02 / 1.10 | 4.78 / 5.78 | 16.1 / 16.7 |
| 200 | cached sprites | 1.04 / 1.97 | 4.79 / 9.20 | 4.12 / 4.75 |
| 1000 | glyph blits | 3.38 / 3.48 | 13.2 / 14.9 | 41.9 / 43.9 |
| 1000 | fillText | 1.59 / 1.68 | 6.93 / 7.96 | 38.9 / 39.9 |
| 1000 | fillText + strokeText outline | 2.85 / 3.00 | 10.6 / 11.8 | 77.2 / 78.6 |
| 1000 | cached sprites | 2.66 / 3.21 | 9.46 / 14.1 | 17.1 / 17.8 |
| 1000 -> 100 agg | glyph blits | 0.94 / 1.05 | 4.18 / 5.33 | 5.77 / 6.13 |
| 1000 -> 100 agg | fillText | 0.76 / 0.81 | 3.71 / 5.08 | 5.41 / 5.76 |
| 1000 -> 100 agg | cached sprites | 3.75 / 6.96 | 43.2 / 64.3 | 4.67 / 6.54 |
| 1000 | WebGL2 instanced digits, 320x180 | 0.25 / 0.28 | 1.07 / 1.82 | 37.7 / 38.5 |
| 1000 -> 100 agg | WebGL2 instanced digits | 0.21 / 0.24 | 0.84 / 1.57 | 4.72 / 4.99 |

Test details: digits are a 3x5 font outlined to a 5x7 cell. Values are 40-179, 10% crits at 2x, so most numbers are 2-3 digits. Each number rises 0.4 px per frame and lives 60 frames (1 s), then respawns with a new value. Aggregated numbers add a new hit every 6 frames (about 10 hits per life). The cache is a Map with FIFO eviction at 1024 entries.

Cache stats (metal, lowres):

| Hits alive | Aggregated | Entries | Hit rate | Cache KB |
|---|---|---|---|---|
| 200 | no | 191 | 99.6% | 61 |
| 1000 | no | 225 | 99.9% | 73 |
| 200 | yes | 590 | 87.2% | 222 |
| 1000 | yes | 1024 (cap) | 93.0% | 391 |

Each cache miss costs about 0.09 ms on metal (141 ms for 1603 builds). That is why aggregated plus cached has the worst p95 everywhere except swiftshader.

### Inferences
- Use per-target aggregation (one number per target per window, as the sandbox spec's 250 ms window) for crowds. It is the only change that helps in every condition, and it also helps readability.
- Cache only strings that stay fixed for their whole life: plain hits, misses, "Immune", "Dodge". Draw running totals glyph by glyph, or cache them only once the window closes.
- The Godot version of "WebGL2 instanced digits" is drawing all numbers through one bitmap-font texture without breaking the batch (no per-number material or shader). Study #1 has the Godot batching rules (`feel-npc-dialog/notes/07-benchmarks.md`, Q2).
- In Canvas2D, `strokeText` for an outline doubles the cost in software (16 vs 8.5 ms at 200 numbers). A pre-outlined bitmap font gets the outline for free.

## Q2. Hit particles and sparks (500 / 2000 / 10000)

### Takeaway
Per-particle Canvas2D calls cost about 1 µs each (`drawImage`) or 0.2 µs each (`fillRect` grouped by colour) on the M4, and 4-6x that under throttle. 2000 sparks is fine either way on a GPU machine. 10000 is not, unless it goes through WebGL. WebGL2 points draw 10000 particles in 0.3 ms on a GPU and under 1 ms even in SwiftShader, because one draw call replaces 10000. The JS simulation itself is cheap: 10000 particles add only about 0.05 ms over baseline on metal and 0.25 ms under throttle.

### Measured results (median / p95 ms)

| Particles | Method | metal | throttle6 | swiftshader |
|---|---|---|---|---|
| 500 | c2d fillRect 2x2, 4 colour buckets | 0.74 / 0.77 | 3.48 / 4.47 | 7.86 / 8.17 |
| 500 | c2d drawImage 3x3 sprite | 1.06 / 1.11 | 4.88 / 5.55 | 8.52 / 8.87 |
| 500 | WebGL2 points, CPU sim | 0.21 / 0.23 | 0.79 / 1.54 | 0.21 / 0.24 |
| 2000 | c2d fillRect | 1.02 / 1.08 | 4.18 / 5.38 | 29.3 / 30.0 |
| 2000 | c2d drawImage | 2.74 / 2.93 | 10.5 / 12.1 | 31.8 / 32.5 |
| 2000 | WebGL2 points, CPU sim | 0.22 / 0.24 | 0.93 / 2.04 | 0.31 / 0.34 |
| 10000 | sim only, no draw | 0.69 / 0.72 | 3.60 / 4.74 | 0.63 / 0.67 |
| 10000 | c2d fillRect | 2.79 / 2.95 | 8.22 / 9.37 | 143 / 145 |
| 10000 | c2d drawImage | 11.0 / 11.8 | 44.9 / 49.5 | 159 / 183 |
| 10000 | WebGL2 points, CPU sim + upload | 0.29 / 0.41 | 1.23 / 1.82 | 0.96 / 1.04 |
| 10000 | WebGL2 points, GPU sim (static buffer) | 0.23 / 0.33 | 1.17 / 1.83 | 0.90 / 1.00 |

At native 1280x720, Canvas2D is a bit cheaper on metal (10000 fillRect 1.82 ms, drawImage 8.79 ms) because that canvas is GPU-accelerated. Full rows in `bench/summary-table.md`.

### Inferences
- A Tibia-like screen with 30 players fighting might have 20-60 hits per second, each with 6-12 sparks living about 0.3-0.5 s. That is roughly 50-400 live sparks (ESTIMATE). Any method handles that. 10000 is a stress ceiling, not a target.
- In Godot, use `GPUParticles2D` (or `CPUParticles2D` with modest counts). Both draw a whole system in one call, which matches the WebGL2 rows. Avoid one `Sprite2D` node per spark.
- Moving the simulation to the GPU saves almost nothing until 10000 particles (0.29 vs 0.23 ms). Upload cost is not the problem. Draw-call count is.

## Q3. Hit flash (100 sprites flashing at once)

### Takeaway
A pre-baked white silhouette costs the same as drawing the normal sprite: zero extra. Compositing the flash every frame in Canvas2D (`source-atop` on a scratch canvas) costs 15 ms over baseline for 100 sprites on the M4 and about 76 ms under throttle. `ctx.filter` is worse: 442 ms per frame at 1280x720 on the M4. In WebGL2, the flash is a `mix()` in the fragment shader and costs nothing. Keeping it as a per-instance value keeps one draw call. Setting a uniform per sprite costs 100 draw calls but still only 0.07 ms more on a GPU.

### Measured results (median / p95 ms)

| Method | c2d lowres metal | c2d lowres throttle6 | c2d lowres swiftshader | c2d native metal |
|---|---|---|---|---|
| No flash (normal sprites) | 0.74 / 0.78 | 3.69 / 5.07 | 2.33 / 2.46 | 0.67 / 0.69 |
| Pre-baked white sprite | 0.75 / 0.80 | 3.63 / 4.60 | 2.28 / 2.43 | 0.67 / 0.69 |
| source-atop per sprite per frame | 16.0 / 17.5 | 79.6 / 86.9 | 9.86 / 10.4 | 2.31 / 2.37 |
| ctx.filter brightness(0) invert(1) | 5.39 / 5.70 | 8.61 / 10.2 | 28.5 / 29.3 | 442 / 446 |

| WebGL2 method (320x180) | metal | throttle6 | swiftshader |
|---|---|---|---|
| No flash, 1 instanced draw | 0.20 / 0.23 | 0.82 / 1.56 | 1.54 / 1.69 |
| Flash as instance attribute, 1 draw | 0.21 / 0.23 | 0.72 / 1.49 | 1.55 / 1.70 |
| Flash as uniform, 100 draws | 0.28 / 0.29 | 0.88 / 1.77 | 1.62 / 1.76 |

### Inferences
- In a Canvas2D client, bake one white frame per sprite frame at load time. Memory is one extra copy of the sprite sheet. Never composite flashes per frame and never use `ctx.filter` in a frame loop.
- In Godot, a canvas_item shader that mixes toward white is the usual approach. If every enemy gets its own ShaderMaterial with its own uniform, the batch breaks per sprite, like the 100-draw row. The cost here was small (0.07 ms on GPU) but it grows with every other effect that breaks batches. A shared material that reads the flash amount from vertex colour or `modulate` keeps the batch. ESTIMATE: I did not test this in Godot.
- The source-atop result is 7x worse at lowres than at native on metal (16 vs 2.3 ms). That fits the CPU-raster caveat above: small canvases render on the CPU, and the scratch-canvas ping-pong hits that path 100 times a frame.

## Q4. Screen shake

### Takeaway
Shake is free. All four ways (setTransform on the canvas, passing offsets to every draw call, offsetting the final upscale blit, or a CSS transform on the canvas element) land within 0.05 ms of no shake, which is at the noise floor, in every condition. A rAF test over 120 frames saw no extra frames over 20 ms with any method.

### Measured results (median / p95 ms; scene = 96 tiles + 40 deco + 100 sprites = 236 drawImage)

| Method | lowres metal | lowres throttle6 | lowres swiftshader | native metal |
|---|---|---|---|---|
| No shake | 0.84 / 0.91 | 4.00 / 5.20 | 4.00 / 4.22 | 0.97 / 1.01 |
| setTransform | 0.86 / 0.93 | 3.94 / 5.42 | 4.18 / 4.46 | 0.98 / 1.01 |
| Offset passed to every draw | 0.86 / 0.91 | 4.00 / 5.42 | 4.16 / 4.46 | 0.98 / 1.01 |
| Offset on the upscale blit | 0.89 / 0.94 | 4.28 / 5.29 | 4.07 / 4.29 | 1.04 / 1.16 |
| CSS transform on the element | 0.84 / 0.89 | 3.88 / 5.36 | 4.03 / 4.16 | 0.98 / 1.01 |

rAF test (120 frames, lowres scene, metal): median work 0.66 / 0.43 / 0.53 ms for none / setTransform / CSS. rAF interval p95 16.7 ms in all three. Frames over 20 ms: 1 / 0 / 0. Same pattern under throttle and swiftshader.

### Inferences
- Cost is no reason to choose a shake method. Choose on looks. Shaking at 320x180 moves whole low-res pixels (4 screen px at 4x). Shaking at the upscale blit or with CSS can move by screen pixels, which is smoother but breaks the pixel grid, and it shows the edge of the canvas unless you draw a margin.
- In Godot, `Camera2D.offset` is the setTransform equivalent: one transform per frame.
- The only real costs of shake are design ones: motion sickness and readability in a crowd. Those belong to the feel notes, not here.

## Q5. Telegraph decals (20 filling circles and cones)

### Takeaway
Telegraphs are cheap in every method: under 0.45 ms over baseline on a GPU even when 20 large decals overlap. Dithering is not faster than real alpha. In Canvas2D, a pattern fill costs a bit more (1.06 vs 0.73 ms native on metal, 6.67 vs 4.45 ms under throttle). In WebGL2 they tie. Pick dither or alpha for looks and colour-blind patterns, not for speed.

### Measured results (median / p95 ms)

| Method | lowres metal | lowres throttle6 | lowres swiftshader | native metal | native throttle6 |
|---|---|---|---|---|---|
| c2d real alpha (globalAlpha fills + outline) | 0.72 / 0.75 | 3.42 / 4.23 | 2.87 / 3.04 | 0.73 / 0.76 | 4.45 / 5.39 |
| c2d dithered Bayer pattern fill | 0.77 / 0.85 | 3.60 / 4.81 | 3.06 / 3.23 | 1.06 / 1.11 | 6.67 / 8.24 |
| WebGL2 SDF, alpha blend | 0.26 / 0.29 | 0.81 / 1.54 | 0.43 / 0.49 | 0.24 / 0.28 | 1.06 / 1.75 |
| WebGL2 SDF, ordered-dither discard | 0.26 / 0.30 | 0.86 / 1.60 | 0.42 / 0.50 | 0.28 / 0.32 | 1.07 / 1.81 |

At native 1280x720 in SwiftShader WebGL, fill rate starts to show (2.29 ms alpha, 2.16 ms dither, vs 0.05 baseline).

### Inferences
- Dither keeps the pixel-art look and reads on any floor colour. It also has a side effect: two overlapping dithered decals with the same pattern don't get darker, because they light the same pixels. Real alpha stacks and gets darker. For a 30-player fight with many overlapping enemy AoEs, that can be a feature (no black blob) or a bug (you can't see that two overlap). Decide in design.
- One shader for all decals, with shape and progress as per-instance data, is one draw call. In Godot that means a shared material on all decal sprites.

## Q6. Web Audio: hit sounds at 8 / 32 / 128 / 512 per second

### Takeaway
Synthesized hit sounds are cheap. Each voice costs about 0.1% of one M4 core on the audio thread, whether it is an OscillatorNode with a pitch sweep or an AudioBufferSourceNode. 128 hits per second (about 38 overlapping 0.3 s voices) used 3.6% of a core. 512 per second (about 154 voices) used 15%. No condition dropped audio: zero underruns in `AudioContext.playbackStats` up to 512 hits per second, and the audio clock stayed within 0.2% of wall time. Triggering a sound costs 0.03-0.16 ms of main-thread JS. Measured output latency was about 27 ms.

### Measured results

Offline render cost (OfflineAudioContext, 4 s of audio at 48 kHz, stereo):

| Hits/s | Overlapping voices (0.3 s each) | Osc+Gain, ms per audio second (core %) | Buffer+Gain, ms per audio second (core %) |
|---|---|---|---|
| 8 | 2.4 | 4.38 (0.44%) | 1.99 (0.20%) |
| 32 | 9.6 | 11.5 (1.15%) | 8.58 (0.86%) |
| 128 | 38 | 35.7 (3.57%) | 35.9 (3.59%) |
| 512 | 154 | 146 (14.6%) | 148 (14.8%) |

Numbers are metal. Throttle6 and swiftshader are within 5%, because neither touches the audio rendering thread.

Realtime AudioContext (`latencyHint: 'interactive'`, 2 s per rate, near-silent master gain, `--mute-audio`):

| Field | Value |
|---|---|
| sampleRate | 48000 |
| baseLatency | 5.33 ms (256 frames) |
| outputLatency | 0 (headless, not reported) |
| playbackStats.averageLatency | 27.1-27.3 ms |
| playbackStats.underrunEvents | 0 at every rate, both voice types, all conditions |
| Trigger cost, main thread, median / p95 | 0.035-0.16 / 0.075-0.66 ms (first triggers slowest) |
| setTimeout lateness of the trigger loop, p95 | about 4.8 ms |
| Audio clock vs wall clock | 0.983-1.002 |

`playbackStats` (with `underrunEvents`, `underrunDuration`, `averageLatency`, `minimumLatency`, `maximumLatency`) exists in Chromium 153. `playoutStats` does not.

### Inferences
- Web Audio never "drops" voices by itself. It plays every node you start, and when the audio thread runs out of time you get glitches (underruns) for everyone. So the voice limit has to live in game code. The sandbox's start value of 8 voices with priority for your own hits is far below the cost limit. It is a mixing decision: 38 overlapping hits sound like noise long before they cost anything.
- ESTIMATE: a low-end Android phone's audio thread may be 5-10x slower than an M4 core. 128 hits per second would then take 20-35% of a core, which is risky. A cap of 8-16 voices keeps any device under about 2%.
- Hit-to-sound latency is the context latency (about 27 ms here; often 40-100 ms on Android, not measured) plus up to one render quantum (2.67 ms) plus the game's own frame. Sounds started at `currentTime` land in the next render quantum.
- Buffer playback is 2x cheaper than an oscillator sweep at low counts and equal at high counts. Pre-rendering a handful of synthesized variants into AudioBuffers at load time, then picking a variant with random `playbackRate` for pitch variation, costs the least and still sounds varied.

## Budget summary
On the M4 GPU, a full "everything on" stress frame with 1000 numbers aggregated to 100, 2000 sparks, 100 flashes, shake and 20 telegraphs adds about 1 ms in WebGL2 and about 2-3 ms in a careful Canvas2D client (ESTIMATE, summed from rows over baseline). Under 6x CPU throttle, the WebGL2 version stays under about 2 ms. The Canvas2D version is about 4-8 ms if it uses fillRect, pre-baked flashes and aggregated numbers, and over 16.7 ms if it uses drawImage particles or per-frame flash compositing. In software GL, per-instance cost dominates: 1000 unaggregated digit quads take 38 ms, so a software-renderer client must aggregate numbers and cap particles.

## Gaps
- No real low-end device. Throttle slows only the main thread. SwiftShader is slower than most weak GPUs.
- No Godot web build. The next step is a Godot 4.5 Compatibility export with the same counts, read with `RENDER_TOTAL_DRAW_CALLS_IN_FRAME` and the frame time monitor.
- The CPU-raster threshold for small Canvas2D canvases is inferred from the data, not confirmed in Chromium source.
- Headless Chromium reports `outputLatency` 0. Real output latency on Bluetooth headsets or Android needs a headed run on the device.
- The ctx.filter rows ran 20 frames because one frame takes 0.4-2.7 s.

## Sources
- Our harness and raw data: `notes/bench/juicebench.html`, `run.py`, `runall.sh`, `summarize.py`, `results-metal.json`, `results-metal-throttle6.json`, `results-swiftshader.json`, `summary-table.md`.
- Study #1 benchmark method and Godot batching citations: `studies/feel-npc-dialog/notes/07-benchmarks.md`.
- CDP CPU throttling: https://chromedevtools.github.io/devtools-protocol/tot/Emulation/#method-setCPUThrottlingRate
- High-resolution timers require cross-origin isolation: https://developer.mozilla.org/en-US/docs/Web/API/Performance/now#security_requirements
- AudioContext.baseLatency and outputLatency: https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/baseLatency , https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/outputLatency
- AudioContext.playbackStats: found by feature detection in Chromium 153 (MEASURED). I did not look up its spec page, so there is no URL here.
