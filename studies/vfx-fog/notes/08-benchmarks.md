# 08 Benchmarks: what fog techniques cost (measured)

Lens: runtime efficiency. Part B (my own measurements) is the main deliverable. Part A collects the few published numbers that exist.

## Setup

- Benchmark page: `studies/vfx-fog/notes/bench/fogbench.html` (self-contained, no dependencies; open it in any browser and call `runCPU()` or `await runGPU()` from the console).
- Runner: `studies/vfx-fog/notes/bench/run.py` (`python run.py cpu|gpu default|metal [throttle6] [opaque]`). Raw JSON results sit next to it (`results-*.json`).
- Machine: Apple M4 Pro (14 cores, 48 GB), macOS 26.5.1 (build 25F80).
- Browser: Playwright 1.63.0. Chromium 153.0.8010.12. Two GPU configs:
  - `default` = chrome-headless-shell. WebGL renderer string: `ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (LLVM 10.0.0)), SwiftShader driver)`. Software GL running on 14 CPU cores. Timer query extension not available.
  - `metal` = full Chromium in new headless mode with `--use-angle=metal --enable-gpu --ignore-gpu-blocklist`. Renderer string: `ANGLE (Apple, ANGLE Metal Renderer: Apple M4 Pro)`. Real GPU. `EXT_disjoint_timer_query_webgl2` available.
- CPU harness: 150 ms warm-up, then 25 samples. Each sample loops the function until at least 8 ms pass, so the browser's coarse timer does not dominate. Reported value is the median ms per call. p10/p90 are in the JSON, spread was under 5% for almost all tests.
- CPU low-end proxy: the same run with Chrome DevTools CPU throttling at 6x (`Emulation.setCPUThrottlingRate`, the DevTools "low-end mobile" preset). This scales JS time roughly linearly (measured 5.5x to 6x). It is an estimate of a low-end phone, not a phone measurement.
- GPU harness: render into an offscreen RGBA8 framebuffer of the given size with a full-screen triangle. Per-draw cost = (median time of K draws + 1x1 readPixels) minus (median time of 1 draw + readPixels), divided by K-1. K is picked so a batch takes about 80 ms. On Metal, a GPU timer query over the same draws is reported too. The two methods agree within about 10% at 1280x720.
- All GPU passes are alpha-blended (`SRC_ALPHA, ONE_MINUS_SRC_ALPHA`), like a real fog overlay. See the HSR finding below for why this matters.

## Key question 1: what does a full-screen fog pass cost on a GPU?

Takeaway: at 320x180 every shader technique tested costs between 1 and 13 microseconds on a real GPU (M4 Pro). Even a 64-sample god-ray blur fits. At 1280x720 the ranking spreads out. Texture-lookup noise (0.010 to 0.015 ms) is 5x to 10x cheaper than procedural fbm (value 4 octaves 0.065 ms, simplex 4 octaves 0.133 ms). God rays scale linearly with sample count (8 samples 0.021 ms, 64 samples 0.141 ms).

Cited findings (my measurements, tables below):
- Metal, 1280x720, timer query (final run): flat colour 0.0035 ms, one texture fetch 0.011 ms, texture noise 1/2/3 layers 0.010/0.012/0.014 ms, value fbm 1/2/3/4 octaves 0.019/0.036/0.052/0.065 ms, simplex fbm 1/2/4 octaves 0.036/0.066/0.133 ms, domain warp (3 texture fetches) 0.014 ms, Bayer dither + palette snap 0.016 ms, height fog 0.013 ms, god rays 8/16/32/64 samples 0.021/0.036/0.070/0.141 ms. An earlier run gave the same values within 5%.
- Each extra value-noise octave adds about 0.016 ms at 720p on M4. Each extra texture noise layer adds about 0.002 ms. On this GPU a texture layer is about 8x cheaper than a hashed octave, because the 128x128 R8 table stays in texture cache.
- Simplex costs about 2x value noise per octave (0.133 vs 0.065 ms at 4 octaves). For pixel art, value noise or a texture is enough.
- Cost scales with pixel count. 1920x1080 (2.25x the pixels of 720p) gave value fbm 4 octaves 0.140 ms (2.1x) and god rays 32 samples 0.151 ms (2.2x). 320x180 (1/16 of 720p) is near the fixed per-draw floor of about 1 microsecond.
- Stacked blended layers are linear. Four full-screen blended texture-noise layers at 720p cost 0.040 ms vs 0.010 ms for one (3.9x).

Inferences:
- At the sandbox resolution (320x180) GPU fog shading is free in practice, whatever the technique. The cost that matters on low-end devices is the upscale to the display and the number of full-resolution blended layers, not the noise maths.
- If Godot draws the fog as a `ColorRect` at the window size (for example 1280x720 or a 1080p phone), procedural fbm and god rays start to matter on weak GPUs. Render fog at the 320x180 game resolution (viewport stretch mode) and let the final upscale be the only full-res pass.

## Key question 2: the Apple HSR trap (why opaque benchmarks lie)

Takeaway: on Apple's tile-based GPU, opaque full-screen draws that cover each other are culled before shading. My first Metal run (blending off) reported 2000 draws of 4-octave fbm at 1920x1080 in a few milliseconds (0.0025 ms each), which is impossible if every pixel were shaded. With blending on, the same pass costs 0.140 ms, 56x more.

Cited findings: opaque vs blended Metal columns in the GPU table. A shader writing alpha = 1.0 with blending on was also culled (height fog 0.0056 ms before, 0.013 ms after changing alpha to 0.99). Apple describes its hidden surface removal as "pixel perfect and submission order independent" (WWDC20 10632, https://developer.apple.com/videos/play/wwdc2020/10632). Arm describes the same class of saving on Mali for opaque overdraw without blending or discard (https://community.arm.com/groups/arm-mali-graphics/blog/2014/05/16/mali-performance-3-is-eglbufferpreserved-a-good-thing).

Inferences: fog overlays are translucent, so they always pay full shading cost for every layer on tile-based GPUs (Mali, Adreno in some modes, PowerVR, Apple). Overdraw from fog layers cannot be hidden. Any fog benchmark must enable blending, or it measures nothing.

## Key question 3: software GL (SwiftShader) numbers

Takeaway: SwiftShader is 20x to 130x slower than the M4 GPU and ranks texture fetches as more expensive than ALU, the opposite of the real GPU. Use the SwiftShader column only as a "very weak device with no GPU" bound, never to rank texture vs procedural noise.

Cited findings: SwiftShader 1280x720: texture noise 1 layer 0.67 ms, value fbm 4 octaves 1.17 ms, simplex 4 octaves 2.18 ms, god rays 64 samples 18.0 ms (vs 0.141 ms on Metal, 128x), god rays 32 samples at 1080p 19.3 ms. At 320x180: everything except god rays costs 0.03 to 0.14 ms; god rays 64 samples 1.18 ms.
- Each extra texture layer costs about 0.28 ms on SwiftShader vs 0.17 ms per value-noise octave. On the real GPU the order flips (0.002 vs 0.016 ms).

Inferences: a browser that falls back to software GL (blocklisted GPU drivers, some Linux VMs, Chromebook edge cases) can still run 320x180 fog shaders at 60 fps, but not 720p god rays. Keep god rays at low resolution or replace them with pre-drawn shafts.

## Key question 4: what does fog cost on the CPU in JS (and by extension GDScript)?

Takeaway: per-pixel noise on the CPU at 320x180 costs 0.24 ms (1 octave) to 0.81 ms (4 octaves) on M4, about 1.4 to 4.7 ms with 6x throttling. At 1280x720 it is 3.8 to 12.9 ms, which is too slow for a frame budget on any device. Coarse-grid techniques are cheap: an 80x45 density grid step (advect + diffuse + decay) costs 0.06 ms (0.34 ms throttled), and Bayer dithering a 320x180 density field to a 4-colour palette costs 0.057 ms (0.33 ms throttled).

Cited findings (median ms, M4 Pro / 6x throttle):
- Value-noise fbm per pixel, 320x180: 1/2/3/4 octaves = 0.24/0.42/0.62/0.81 ms (throttled 1.39/2.48/3.57/4.65). That is about 4 ns per pixel per octave unthrottled.
- Precomputed tileable table with bilinear sampling: 1/2/3/4 octaves = 0.24/0.37/0.51/0.65 ms. Table size (64 vs 128) made no difference, both fit in L1/L2 cache. Bilinear table lookup is no faster than the integer hash at 1 octave in JS, and about 20% faster at 4 octaves.
- Table with nearest lookup and integer scroll per layer (the pixel-art way): 1/2/3 layers = 0.11/0.17/0.24 ms at 320x180, 1.8/2.8/3.9 ms at 720p. This is 2x faster than bilinear and gives crisp, pixel-aligned fog.
- Bayer 4x4 dither to a 4-entry palette: 0.057 ms at 320x180, 0.92 ms at 720p.
- Density grid step: 80x45 = 0.060 ms, 160x90 = 0.24 ms, 320x180 = 0.93 ms. Cost is linear in cell count (about 15 ns per cell).
- Bilinear upscale of the 80x45 grid: to 320x180 = 0.11 ms, to 1280x720 = 2.0 ms.
- Separable 3x3 box blur of a byte mask: 320x180 = 0.23 ms, 1280x720 = 3.0 ms. My implementation clamps every sample with Math.min/max. A version with border handling outside the inner loop would be faster.
- Getting the pixels on screen: putImageData 320x180 = 0.008 ms, 1280x720 = 0.12 ms. WebGL texSubImage2D RGBA8 upload on Metal: 320x180 = 0.034 ms wall (0.014 ms GPU), 1280x720 = 0.30 ms wall (0.055 ms GPU).

Inferences:
- A CPU fog pipeline is viable only at game resolution or coarser. The cheapest good-looking CPU pipeline measured is: 80x45 density grid (0.06 ms) + bilinear upscale to 320x180 (0.11 ms) + Bayer dither to palette (0.06 ms) + upload (0.03 ms) = about 0.26 ms on M4, about 1.5 ms at 6x throttle. That is under 10% of a 16.7 ms frame on the throttled proxy.
- GDScript is slower than V8-optimised JS for tight per-pixel loops (no measured number here, an inference from GDScript being an interpreted VM). Treat the throttled column as optimistic for GDScript. Per-pixel noise belongs in a shader. Coarse grid work (80x45 = 3600 cells) is fine in GDScript, or use a C# / GDExtension path if the grid grows.

## Key question 5: fog-of-war update cost for many units

Takeaway: stamping vision circles into a 256x256 grid is cheap even for 1000 units. Full recompute every frame costs 0.07 ms (r=4) to 0.18 ms (r=8) for 1000 units on M4, about 0.36 to 1.1 ms throttled. The incremental "delta edge" method (precompute, per move direction, the cells that enter and leave the circle) is 4x to 18x cheaper than full recompute when units move. Naive incremental (unstamp whole old circle, stamp whole new circle) is slower than full recompute when every unit moves.

Cited findings (256x256 Uint16 reference-count grid plus explored bit, median ms, M4 Pro):

| N units | radius | full recompute | naive incremental, all move | delta edge, all move | naive incr., 10% move | delta edge, 10% move |
|---:|---:|---:|---:|---:|---:|---:|
| 10 | 4 | 0.0013 | 0.0006 | 0.0003 | 0.0002 | 0.0002 |
| 100 | 4 | 0.0084 | 0.0103 | 0.0033 | 0.0019 | 0.0009 |
| 1000 | 4 | 0.070 | 0.110 | 0.033 | 0.016 | 0.008 |
| 10 | 8 | 0.0035 | 0.0032 | 0.0005 | 0.0004 | 0.0002 |
| 100 | 8 | 0.020 | 0.031 | 0.0047 | 0.0038 | 0.0011 |
| 1000 | 8 | 0.184 | 0.308 | 0.048 | 0.036 | 0.010 |

- The incremental columns include generating the moves. Move generation alone costs 0.0002 / 0.0011 / 0.011 ms for 10 / 100 / 1000 units, so for 1000 units at 10% moving, the delta edge stamping itself is near zero.
- Throttled 6x, N=1000 r=8: full 1.1 ms, naive incremental 1.76 ms, delta edge 0.27 ms (all moving), 0.07 ms (10% moving).
- Correctness check: after 50 frames of delta edge updates, the grid matched a full recompute exactly (`ok: true` in the JSON).
- Soft edges: a separable box blur of the full 256x256 mask costs 0.22 ms (r=1) and 0.19 ms (r=2) on M4, about 1.1 to 1.4 ms throttled. Uploading the 256x256 R8 mask to WebGL costs 0.018 ms wall (0.003 ms GPU).
- Riot's League of Legends fog used a 128x128 visibility grid. Moving to 256x256 was rejected over "a quadrupled CPU cost". They upscaled 128x128 to 512x512 with 16 antialiased 2x2 patterns and blurred the result (https://www.riotgames.com/en/news/story-fog-and-war, May 2016). No ms figures were published.

Inferences:
- Circle stamping is not the bottleneck. These numbers exclude line-of-sight (shadowcasting from study #5), which is the real per-unit cost. Stamp-only is right for open terrain or Tibia-style "no occlusion" rules.
- Blur only what is on screen. A Tibia-style 15x11 tile view is 165 cells. Blurring that, or doing the soft edge in the shader with bilinear filtering of the R8 mask texture, costs almost nothing. Full-map blur at 256x256 is 0.2 ms on desktop, 1+ ms on the throttled proxy, so avoid it per frame.
- For the MMO server, the delta edge method plus per-cell reference counts gives "cell became visible / became hidden" events directly, which is what interest management needs.

## Key question 6: published numbers (Part A)

Takeaway: there is very little public, measured data for 2D fog on mobile web. Most sources give architecture guidance, not ms. The numbers that exist are old desktop GPU noise rates and vendor peak rates.

Cited findings:
- Noise texture vs procedural: McEwan, Sheets, Gustavson, Richardson (2012) measured their texture-free GLSL simplex 2D at 1,487 Msamples/s on a GTX260 vs 2,617 for the older texture-lookup version, and 4,676 vs 7,806 on a GTX580. Their summary is that the texture version is "roughly twice as fast" (https://arxiv.org/pdf/1204.1461, Tables 1 and 2). Flat colour on the GTX580 was 13,863 Msamples/s, so 2D simplex cost about 3x a flat fill. My M4 result points the same way, with a wider gap (texture layer about 8x cheaper than a hashed octave).
- Mobile texture vs procedural: Unity forum posters say a texture is generally cheaper on mobile. This is opinion, no measurements (https://discussions.unity.com/t/comparing-performance-of-textures-vs-procedural-shaders-on-mobile-gpu/662156).
- Mobile fill rate (vendor figures, peak, not measured): Arm Mali-G52 processes 2 pixels and 2 texels per clock per core (https://anandtech.com/show/12501). Estimate, assuming a 2-core G52 at 850 MHz: about 3.4 Gpixel/s peak, so one 1280x720 layer costs at least 0.27 ms and a 320x180 layer at least 0.017 ms. Real shaders with blending land well above the peak floor.
- Mobile bandwidth: Arm's guidance treats every full-screen read or write as expensive on mobile and recommends discarding attachments you do not need (https://developer.arm.com/community/arm-community-blogs/b/mobile-graphics-and-gaming-blog/posts/vulkan-subpasses-the-good-the-bad-and-the-ugly).
- Godot screen reading: if a 2D node uses `hint_screen_texture`, "the entire screen is copied to the back buffer before drawing that node". Later nodes reuse the copy unless a BackBufferCopy node forces a new one. No cost figures (https://docs.godotengine.org/en/stable/tutorials/shaders/screen-reading_shaders.html). Inference: each copy is one extra full-screen read plus write, so on a mobile GPU at 720p it costs at least the same as one more fog layer.
- Godot fill rate test: the docs say to compare FPS at a small and large window. They also call transparent objects "particularly bad for fill rate" (https://docs.godotengine.org/en/stable/tutorials/performance/gpu_optimization.html).
- Godot 2D batching: the 4.2 docs say 2D batching is used with the OpenGL-based (Compatibility) renderer. Vulkan 2D batching came later via PR #92797 (https://github.com/godotengine/godot/issues/68959, https://docs.godotengine.org/en/4.2/tutorials/performance/gpu_optimization.html). A single full-screen fog `ColorRect` is one draw call either way, so batching matters for per-tile fog sprites, not for a shader overlay.
- SubViewport on web: one Godot 4.3 user reports under 1 FPS in HTML5 with several active SubViewports, while native builds ran fine (https://forum.godotengine.org/t/subviewport-rendering-performances-on-web/101434). Anecdote, no controlled test.
- God rays: GPU Gems 3 ch. 13 (Mitchell) gives no sample count or ms. It suggests sampling at lower resolution "to reduce texture bandwidth" (https://developer.nvidia.com/gpugems/gpugems3/part-ii-light-and-shadows/chapter-13-volumetric-light-scattering-post-process). My measurements give the missing curve: cost is linear in samples, about 0.0022 ms per sample per 720p frame on M4.
- Adreno mediump vs highp: one guide claims 30% to 50% more fragment throughput with mediump, with no data shown (https://abratabia.com/mobile-browser-performance/webgl-mobile-performance.php). Unverified.

## Rankings for the study (Speed column)

GPU columns are timer-query ms from the final Metal run.

| Technique | 320x180 GPU (M4) | 720p GPU (M4) | 720p SwiftShader | Verdict |
|---|---:|---:|---:|---|
| Texture noise, 2 layers scrolling | 0.0010 ms | 0.012 ms | 0.97 ms | Cheapest good-looking fog. Default choice. |
| Domain warp (3 fetches) | 0.0013 ms | 0.014 ms | 1.34 ms | Nearly free over plain layers. Worth it for swirl. |
| Bayer dither + palette snap | 0.0018 ms | 0.016 ms | 1.34 ms | Cheap. Adds pixel taste for ~1 extra texture layer of cost. |
| Height fog (3 fetches + exp) | 0.0011 ms | 0.013 ms | 1.15 ms | Cheap. |
| Value fbm 4 octaves procedural | 0.0054 ms | 0.065 ms | 1.17 ms | 5x texture noise. Fine at 320x180, avoid at full res on weak GPUs. |
| Simplex fbm 4 octaves | 0.0125 ms | 0.133 ms | 2.18 ms | 2x value noise for no pixel-art gain. Skip. |
| God rays 16 samples | 0.0064 ms | 0.036 ms | 4.5 ms | OK at game res. |
| God rays 64 samples | 0.011 ms | 0.141 ms | 18.0 ms | Pretty but expensive at full res. Use at 320x180 or pre-draw shafts. |
| CPU density grid 80x45 + upscale + dither | 0.26 ms CPU total | n/a | n/a | Cheap on CPU, interactive (wind, clearing). |
| CPU per-pixel fbm | 0.24 to 0.81 ms | 3.8 to 12.9 ms | n/a | Do it in a shader instead. |

## Gaps

- No real mobile GPU or real phone measured. The M4 Pro is a fast desktop-class GPU. The 6x throttle is a CPU estimate only. Next step: open the same `fogbench.html` on a low-end Android phone (Mali-G52 or Adreno 6xx class) in Chrome, and on an older iPhone in Safari. The page runs as-is.
- Godot itself was not benchmarked. Godot Compatibility adds its own canvas pass and final blit; these numbers are raw WebGL2.
- No measured cost for `hint_screen_texture` / BackBufferCopy or SubViewport in Godot. The texSubImage2D and full-screen pass numbers here are the closest proxies.
- No line-of-sight cost in the fog-of-war numbers (see study #5).
- GDScript speed vs JS not measured.
- Timer resolution: CPU numbers below 0.001 ms are at the edge of what the harness can resolve. They show order of magnitude only.

## Full results tables

All values are median ms per frame. CPU tests run single-threaded JS in chrome-headless-shell. "6x throttle" is the DevTools CPU throttle proxy for a low-end phone.

| CPU test | M4 Pro ms | 6x throttle ms |
|---|---:|---:|
| fbm procedural value noise 1 oct 320x180 | 0.2382 | 1.3857 |
| fbm procedural value noise 2 oct 320x180 | 0.4211 | 2.475 |
| fbm procedural value noise 3 oct 320x180 | 0.6154 | 3.5667 |
| fbm procedural value noise 4 oct 320x180 | 0.81 | 4.65 |
| fbm table64 bilinear 1 oct 320x180 | 0.2353 | 1.3667 |
| fbm table64 bilinear 2 oct 320x180 | 0.3727 | 2.15 |
| fbm table64 bilinear 3 oct 320x180 | 0.5125 | 2.9333 |
| fbm table64 bilinear 4 oct 320x180 | 0.6538 | 3.8 |
| table64 nearest int-scroll 1 layer 320x180 | 0.1081 | 0.6308 |
| table64 nearest int-scroll 2 layer 320x180 | 0.1688 | 0.9667 |
| table64 nearest int-scroll 3 layer 320x180 | 0.2424 | 1.3833 |
| fbm table128 bilinear 1 oct 320x180 | 0.2455 | 1.3571 |
| fbm table128 bilinear 2 oct 320x180 | 0.381 | 2.125 |
| fbm table128 bilinear 3 oct 320x180 | 0.5125 | 2.9667 |
| fbm table128 bilinear 4 oct 320x180 | 0.6538 | 3.8667 |
| table128 nearest int-scroll 1 layer 320x180 | 0.1096 | 0.6154 |
| table128 nearest int-scroll 2 layer 320x180 | 0.1702 | 0.9556 |
| table128 nearest int-scroll 3 layer 320x180 | 0.2412 | 1.3833 |
| bayer4x4 dither to 4-color palette 320x180 | 0.0571 | 0.332 |
| bilinear upscale 80x45 -> 320x180 | 0.1096 | 0.6231 |
| putImageData 320x180 | 0.0081 | 0.0463 |
| box blur r1 (3x3) separable mask 320x180 | 0.2286 | 1.2 |
| fbm procedural value noise 1 oct 1280x720 | 3.8 | 22.3 |
| fbm procedural value noise 2 oct 1280x720 | 6.75 | 39.1 |
| fbm procedural value noise 3 oct 1280x720 | 9.9 | 57 |
| fbm procedural value noise 4 oct 1280x720 | 12.9 | 74.3 |
| fbm table64 bilinear 1 oct 1280x720 | 3.8333 | 22.1 |
| fbm table64 bilinear 2 oct 1280x720 | 5.95 | 34.6 |
| fbm table64 bilinear 3 oct 1280x720 | 8.2 | 47.4 |
| fbm table64 bilinear 4 oct 1280x720 | 10.5 | 60.8 |
| table64 nearest int-scroll 1 layer 1280x720 | 1.82 | 10.2 |
| table64 nearest int-scroll 2 layer 1280x720 | 2.7667 | 16 |
| table64 nearest int-scroll 3 layer 1280x720 | 3.8667 | 21.9 |
| fbm table128 bilinear 1 oct 1280x720 | 3.8333 | 21.8 |
| fbm table128 bilinear 2 oct 1280x720 | 5.95 | 34.1 |
| fbm table128 bilinear 3 oct 1280x720 | 8.1 | 47.1 |
| fbm table128 bilinear 4 oct 1280x720 | 10.5 | 61.1 |
| table128 nearest int-scroll 1 layer 1280x720 | 1.82 | 11.1 |
| table128 nearest int-scroll 2 layer 1280x720 | 3 | 16.7 |
| table128 nearest int-scroll 3 layer 1280x720 | 3.8 | 22.3 |
| bayer4x4 dither to 4-color palette 1280x720 | 0.9222 | 5.35 |
| bilinear upscale 80x45 -> 1280x720 | 2 | 10 |
| putImageData 1280x720 | 0.1231 | 0.7 |
| box blur r1 (3x3) separable mask 1280x720 | 2.9667 | 19 |
| density grid advect+diffuse+decay 80x45 | 0.0596 | 0.3417 |
| density grid advect+diffuse+decay 160x90 | 0.2382 | 1.3833 |
| density grid advect+diffuse+decay 320x180 | 0.9333 | 5.35 |
| fow full recompute N=10 r=4 (256x256) | 0.0013 | 0.0088 |
| fow incremental circle unstamp/stamp N=10 r=4 moving=100% | 0.0006 | 0.0036 |
| fow incremental delta-edge N=10 r=4 moving=100% | 0.0003 | 0.0021 |
| fow incremental circle unstamp/stamp N=10 r=4 moving=10% | 0.0002 | 0.0014 |
| fow incremental delta-edge N=10 r=4 moving=10% | 0.0002 | 0.0009 |
| fow move generation only N=10 (overhead to subtract) | 0.0002 | 0.0011 |
| fow full recompute N=100 r=4 (256x256) | 0.0084 | 0.0441 |
| fow incremental circle unstamp/stamp N=100 r=4 moving=100% | 0.0103 | 0.0603 |
| fow incremental delta-edge N=100 r=4 moving=100% | 0.0033 | 0.0187 |
| fow incremental circle unstamp/stamp N=100 r=4 moving=10% | 0.0019 | 0.0094 |
| fow incremental delta-edge N=100 r=4 moving=10% | 0.0009 | 0.0053 |
| fow move generation only N=100 (overhead to subtract) | 0.0011 | 0.0062 |
| fow full recompute N=1000 r=4 (256x256) | 0.0702 | 0.36 |
| fow incremental circle unstamp/stamp N=1000 r=4 moving=100% | 0.1096 | 0.5929 |
| fow incremental delta-edge N=1000 r=4 moving=100% | 0.0332 | 0.1886 |
| fow incremental circle unstamp/stamp N=1000 r=4 moving=10% | 0.0155 | 0.0902 |
| fow incremental delta-edge N=1000 r=4 moving=10% | 0.0084 | 0.0495 |
| fow move generation only N=1000 (overhead to subtract) | 0.0105 | 0.0605 |
| fow full recompute N=10 r=8 (256x256) | 0.0035 | 0.019 |
| fow incremental circle unstamp/stamp N=10 r=8 moving=100% | 0.0032 | 0.0183 |
| fow incremental delta-edge N=10 r=8 moving=100% | 0.0005 | 0.003 |
| fow incremental circle unstamp/stamp N=10 r=8 moving=10% | 0.0004 | 0.0026 |
| fow incremental delta-edge N=10 r=8 moving=10% | 0.0002 | 0.001 |
| fow move generation only N=10 (overhead to subtract) | 0.0002 | 0.0011 |
| fow full recompute N=100 r=8 (256x256) | 0.0198 | 0.1143 |
| fow incremental circle unstamp/stamp N=100 r=8 moving=100% | 0.0311 | 0.18 |
| fow incremental delta-edge N=100 r=8 moving=100% | 0.0047 | 0.0272 |
| fow incremental circle unstamp/stamp N=100 r=8 moving=10% | 0.0038 | 0.0214 |
| fow incremental delta-edge N=100 r=8 moving=10% | 0.0011 | 0.006 |
| fow move generation only N=100 (overhead to subtract) | 0.0011 | 0.0062 |
| fow full recompute N=1000 r=8 (256x256) | 0.1841 | 1.1 |
| fow incremental circle unstamp/stamp N=1000 r=8 moving=100% | 0.3077 | 1.76 |
| fow incremental delta-edge N=1000 r=8 moving=100% | 0.0482 | 0.271 |
| fow incremental circle unstamp/stamp N=1000 r=8 moving=10% | 0.0364 | 0.2073 |
| fow incremental delta-edge N=1000 r=8 moving=10% | 0.01 | 0.0714 |
| fow move generation only N=1000 (overhead to subtract) | 0.0109 | 0.0605 |
| fow soft edge box blur r1 256x256 | 0.2189 | 1.4333 |
| fow soft edge box blur r2 256x256 | 0.1907 | 1.125 |
| fow visible window 15x11 tiles upscaled to 320x180 bilinear | 0.186 | 1.125 |

| GPU test | M4 Pro Metal, wall slope ms | M4 Pro Metal, timer query ms | SwiftShader ms | M4 Pro opaque (HSR) ms |
|---|---:|---:|---:|---:|
| flat 320x180 | 0.002 | 0.00187 | 0.0298 | 0.02 |
| tex1 320x180 | 0.0018 | 0.00152 | 0.0494 | 0.0014 |
| fbm_value_1oct 320x180 | 0.0034 | 0.00291 | 0.0455 | 0.0003 |
| fbm_value_2oct 320x180 | 0.0062 | 0.00899 | 0.0557 | 0.0003 |
| fbm_value_3oct 320x180 | 0.0069 | 0.00527 | 0.0665 | 0.0003 |
| fbm_value_4oct 320x180 | 0.0068 | 0.00535 | 0.0765 | 0.0004 |
| fbm_simplex_1oct 320x180 | 0.0032 | 0.00301 | 0.0719 | 0.0004 |
| fbm_simplex_2oct 320x180 | 0.0067 | 0.00702 | 0.0961 | 0.0004 |
| fbm_simplex_4oct 320x180 | 0.0138 | 0.01249 | 0.1395 | 0.0005 |
| texnoise_1layer 320x180 | 0.0012 | 0.00083 | 0.0467 | 0.001 |
| texnoise_2layer 320x180 | 0.0015 | 0.00099 | 0.0644 | 0.0008 |
| texnoise_3layer 320x180 | 0.0016 | 0.00115 | 0.0807 | 0.0025 |
| domainwarp_tex 320x180 | 0.0016 | 0.00126 | 0.0906 | 0.0011 |
| bayer_palette 320x180 | 0.0021 | 0.0018 | 0.0894 | 0.0011 |
| godrays_8samp 320x180 | 0.0047 | 0.00311 | 0.1456 | 0.0011 |
| godrays_16samp 320x180 | 0.0059 | 0.0064 | 0.2846 | 0.001 |
| godrays_32samp 320x180 | 0.0103 | 0.00681 | 0.5415 | 0.0017 |
| godrays_64samp 320x180 | 0.0123 | 0.01118 | 1.1754 | 0.002 |
| heightfog 320x180 | 0.0014 | 0.0011 | 0.079 | 0.0009 |
| blended fog layers x1 (texnoise_1layer each) 320x180 | 0.0012 | 0.00084 | 0.0469 | 0.0011 |
| blended fog layers x4 (texnoise_1layer each) 320x180 | 0.0042 | 0.0032 | 0.1873 | 0.0037 |
| texSubImage2D upload RGBA8 320x180 (+1 tiny draw) | 0.0351 | 0.01108 | 0.0648 | 0.0377 |
| flat 1280x720 | 0.0037 | 0.00354 | 0.3719 | 0.0012 |
| tex1 1280x720 | 0.0112 | 0.01078 | 0.698 | 0.0085 |
| fbm_value_1oct 1280x720 | 0.0201 | 0.01928 | 0.6532 | 0.0012 |
| fbm_value_2oct 1280x720 | 0.0358 | 0.03585 | 0.8084 | 0.0013 |
| fbm_value_3oct 1280x720 | 0.0513 | 0.05178 | 0.9949 | 0.0012 |
| fbm_value_4oct 1280x720 | 0.0679 | 0.06537 | 1.1662 | 0.0012 |
| fbm_simplex_1oct 1280x720 | 0.0359 | 0.03572 | 1.076 | 0.0012 |
| fbm_simplex_2oct 1280x720 | 0.0666 | 0.06557 | 1.4518 | 0.0012 |
| fbm_simplex_4oct 1280x720 | 0.1365 | 0.1329 | 2.1829 | 0.0013 |
| texnoise_1layer 1280x720 | 0.0108 | 0.00994 | 0.6672 | 0.0087 |
| texnoise_2layer 1280x720 | 0.0123 | 0.0118 | 0.9701 | 0.0059 |
| texnoise_3layer 1280x720 | 0.0145 | 0.01375 | 1.2311 | 0.0062 |
| domainwarp_tex 1280x720 | 0.015 | 0.01404 | 1.3368 | 0.006 |
| bayer_palette 1280x720 | 0.0176 | 0.01613 | 1.3375 | 0.0067 |
| godrays_8samp 1280x720 | 0.0228 | 0.02144 | 2.3971 | 0.0045 |
| godrays_16samp 1280x720 | 0.037 | 0.03616 | 4.4882 | 0.0048 |
| godrays_32samp 1280x720 | 0.0742 | 0.07023 | 8.9 | 0.0052 |
| godrays_64samp 1280x720 | 0.1457 | 0.14137 | 18.0143 | 0.0067 |
| heightfog 1280x720 | 0.0138 | 0.013 | 1.154 | 0.0063 |
| blended fog layers x1 (texnoise_1layer each) 1280x720 | 0.0104 | 0.01002 | 0.6649 | 0.0102 |
| blended fog layers x4 (texnoise_1layer each) 1280x720 | 0.0408 | 0.0395 | 2.61 | 0.0407 |
| texSubImage2D upload RGBA8 1280x720 (+1 tiny draw) | 0.3007 | 0.05491 | 1.0389 | 0.2921 |
| flat 1920x1080 | 0.0079 | 0.0078 | 0.8667 | 0.0011 |
| tex1 1920x1080 | 0.024 | 0.02335 | 1.575 | 0.0188 |
| fbm_value_4oct 1920x1080 | 0.1409 | 0.14038 | 2.5533 | 0.0025 |
| texnoise_2layer 1920x1080 | 0.027 | 0.0266 | 2.0892 | 0.0127 |
| bayer_palette 1920x1080 | 0.037 | 0.03662 | 3.0696 | 0.0142 |
| godrays_32samp 1920x1080 | 0.155 | 0.15125 | 19.2857 | 0.0115 |
| blended fog layers x1 (texnoise_1layer each) 1920x1080 | 0.023 | 0.02179 | 1.474 | 0.0223 |
| blended fog layers x4 (texnoise_1layer each) 1920x1080 | 0.0845 | 0.08239 | 5.8417 | 0.0831 |
| texSubImage2D upload R8 256x256 (fog-of-war mask) | 0.0162 | 0.00337 | 0.0172 | 0.0163 |

Column notes for the GPU table: "wall slope" is the CPU-side batch method; "timer query" is EXT_disjoint_timer_query_webgl2 GPU time; "SwiftShader" is software GL in chrome-headless-shell (ranks techniques only, never compare to hardware); "opaque (HSR)" is an earlier Metal run with blending off, where Apple's hidden surface removal culled covered draws, so those values are wrong on purpose and shown only as evidence of the trap.

## Sources

- My benchmark: studies/vfx-fog/notes/bench/fogbench.html (raw JSON in the same folder)
- McEwan et al. 2012, Efficient computational noise in GLSL: https://arxiv.org/pdf/1204.1461
- Unity forum, textures vs procedural on mobile: https://discussions.unity.com/t/comparing-performance-of-textures-vs-procedural-shaders-on-mobile-gpu/662156
- AnandTech, Mali-G52 launch (vendor figures): https://anandtech.com/show/12501
- Arm, Mali performance 3 (EGL_BUFFER_PRESERVED, opaque overdraw): https://community.arm.com/groups/arm-mali-graphics/blog/2014/05/16/mali-performance-3-is-eglbufferpreserved-a-good-thing
- Arm, Vulkan subpasses (bandwidth, full-screen writes): https://developer.arm.com/community/arm-community-blogs/b/mobile-graphics-and-gaming-blog/posts/vulkan-subpasses-the-good-the-bad-and-the-ugly
- Apple WWDC20 10632, Optimize Metal performance for Apple silicon: https://developer.apple.com/videos/play/wwdc2020/10632
- Godot docs, screen-reading shaders: https://docs.godotengine.org/en/stable/tutorials/shaders/screen-reading_shaders.html
- Godot docs, GPU optimization: https://docs.godotengine.org/en/stable/tutorials/performance/gpu_optimization.html
- Godot docs 4.2, GPU optimization (2D batching on OpenGL): https://docs.godotengine.org/en/4.2/tutorials/performance/gpu_optimization.html
- Godot issue 68959 (Vulkan 2D batching, fixed by PR 92797): https://github.com/godotengine/godot/issues/68959
- Godot forum, SubViewport performance on web: https://forum.godotengine.org/t/subviewport-rendering-performances-on-web/101434
- Riot Games, A story of fog and war (2016): https://www.riotgames.com/en/news/story-fog-and-war
- GPU Gems 3 ch. 13, Volumetric light scattering as a post-process: https://developer.nvidia.com/gpugems/gpugems3/part-ii-light-and-shadows/chapter-13-volumetric-light-scattering-post-process
- Abratabia, WebGL mobile performance (unverified mediump claim): https://abratabia.com/mobile-browser-performance/webgl-mobile-performance.php
