# 07. Runtime cost: measured benchmarks and published numbers

Researcher angle: runtime cost. Every number below is tagged MEASURED (our bench), CITED (a source says it) or ESTIMATE (arithmetic or inference).

## Machine and setup (MEASURED runs)
- Apple M4 Pro, 14 cores, 48 GB RAM, macOS 26.5.1.
- Chromium 153.0.8010.12 via Playwright (headless), `.venv` in the repo.
- Bench: `notes/bench/textbench.html` (no external assets). Runner `notes/bench/run.py`, table maker `notes/bench/summarize.py`, full table `notes/bench/summary-table.md`, raw data `notes/bench/results-*.json`.
- Configs:
  - `metal`: full Chromium, `--use-angle=metal`. WebGL renderer reports "ANGLE Metal Renderer: Apple M4 Pro". This is the real-GPU run.
  - `default`: Playwright headless shell. WebGL falls back to SwiftShader here, but Canvas2D stayed fast (looks GPU or fast raster). So "default" is a mixed config.
  - `swiftshader`: `--use-angle=swiftshader`. Canvas2D and WebGL both in software. Stand-in for a machine with no usable GPU.
  - `metal-throttle6`: metal plus CDP `Emulation.setCPUThrottlingRate` 6. Stand-in for a low-end phone or Chromebook CPU. Throttling slows JS and main thread, not the GPU.
- Method: 30 warm-up frames, then 300 timed frames (150 for throttled). Each frame clears, draws, presents to a 1280x720 display canvas and reads back 1 pixel to force the GPU to finish. Numbers are ms per frame including that flush. `performance.now()` is clamped to 0.1 ms on file:// pages, so I report the mean (which averages out the clamping) and p95. Subtract the `baseline_empty_frame` row to get the text cost alone.
- Targets: `lowres` draws at 320x180 and upscales once with nearest filtering. `native` draws straight into 1280x720 with glyphs scaled 4x.
- Glyph cell 6x8 px. Bitmap atlas is generated in the page (monospace rasterized then thresholded to 1 bit).

## Q1. What does text cost per frame in a browser?

### Takeaway
Redrawing glyphs every frame is cheap until a few thousand glyphs, then it scales linearly at about 1.3 µs per drawImage on a fast Mac and about 5.5 µs under 6x CPU throttle. Caching each bubble into its own offscreen canvas cuts 200 bubbles from 11 ms to 1.1 ms (real GPU) and from 45 ms to 1.8 ms (6x throttle). A wave effect on a 192-glyph dialog box costs nothing measurable. Software rendering (SwiftShader) is 10-15x slower across the board.

### Measured results (mean / p95 ms per frame, lowres 320x180 + upscale)

| Test | metal (GPU) | metal 6x CPU throttle | swiftshader | default |
|---|---|---|---|---|
| Empty frame (baseline) | 0.35 / 0.6 | 1.01 / 1.8 | 3.66 / 3.9 | 0.45 / 0.5 |
| (a) 500 bitmap glyph blits | 0.76 / 0.9 | see table file | 11.73 / 12.2 | 0.85 / 0.9 |
| (a) 2000 bitmap glyph blits | 2.39 / 2.7 | 9.12 / 10.8 | 35.17 / 35.9 | 2.12 / 2.2 |
| (b) 2000 glyphs via fillText (40 calls) | 0.38 / 0.5 | 1.30 / 1.9 | 27.51 / 28.4 | 0.59 / 0.7 |
| (d) typewriter box 192 glyphs, static | 0.38 / 0.5 | 1.24 / 1.8 | 5.70 / 7.2 | 0.55 / 0.7 |
| (d) typewriter box 192 glyphs, wave | 0.39 / 0.5 | 1.19 / 1.8 | 5.70 / 7.2 | 0.55 / 0.7 |
| (e) 10 bubbles redraw (392 glyphs) | 0.76 / 0.9 | see table file | 11.42 / 11.9 | 0.85 / 0.9 |
| (c) 10 bubbles cached | 0.32 / 0.4 | see table file | 4.38 / 4.6 | 0.47 / 0.6 |
| (e) 50 bubbles redraw (1891 glyphs) | 2.95 / 3.3 | 10.51 / 11.8 | 40.08 / 41.0 | 2.43 / 2.5 |
| (c) 50 bubbles cached | 0.47 / 0.6 | 1.13 / 1.7 | 6.29 / 6.6 | 0.52 / 0.6 |
| (e) 200 bubbles redraw (7866 glyphs) | 10.95 / 11.6 | 44.98 / 47.1 | 152.84 / 154.8 | 8.59 / 8.8 |
| (c) 200 bubbles cached | 1.07 / 1.2 | 1.78 / 2.8 | 12.04 / 12.5 | 0.72 / 0.8 |

Native 1280x720 rows are close to lowres on the GPU (200 bubbles redraw 11.6 ms, cached 1.16 ms) but cost more in software (cached 200 bubbles 30.4 ms vs 12.0 ms) because fill rate matters there. Full table with every row is in `bench/summary-table.md`.

Each bubble = 9 drawImage calls for the 9-slice frame plus one per glyph. Cache build cost and estimated cache memory are in the JSON (`cache_build_ms_total`, `cache_bytes_est`). At lowres, 200 cached bubbles hold about 1.1 MB of RGBA (ESTIMATE from w*h*4).

### (f) WebGL2 instanced glyph quads (one draw call for all glyphs)

| Glyphs | metal | metal 6x throttle | swiftshader |
|---|---|---|---|
| Baseline clear + readback | 0.20 | n/a | 0.05 |
| 500 | 0.22 / 0.3 | 0.82 / 1.5 | 7.47 / 7.8 |
| 2000 | 0.23 / 0.3 | 0.84 / 1.6 | 29.14 / 30.0 |
| 10000 | 0.41 / 0.5 | 1.11 / 1.8 | 145.51 / 147.6 |

Rebuilding the instance buffer in JS every frame or doing the wave in the vertex shader made no measurable difference on the GPU (10000 glyphs 0.30 and 0.25 ms). On SwiftShader the cost is per instance (about 14.5 µs per glyph quad), so a software-GL player pays heavily for every glyph however it is batched.

### Inferences
- With a real GPU, text is never the bottleneck for a Tibia-like screen. 50 talking players with redraw-every-frame bubbles is 3 ms on the M4 and 10.5 ms with a 6x slower CPU. That 10.5 ms is most of a 16.7 ms frame on a phone. Cache the bubble once per message and the problem goes away (1.1 ms).
- `fillText` beat per-glyph `drawImage` 6x at 2000 glyphs on the GPU, because the browser batches one string per call. Godot's equivalent is drawing a whole line through TextServer into one canvas item, which batches if nothing breaks it (see Q2). The lesson carries over: cost tracks the number of draw commands, not the number of pixels.
- Typewriter reveal and wave are free at dialog-box scale. Do not cut the effect for perf reasons.
- SwiftShader numbers are a floor case. Chrome falls back to it on blocklisted GPUs. A web build should detect a software renderer (`WEBGL_debug_renderer_info` contains "SwiftShader") and drop to cached bubbles, fewer bubbles and lower internal res.
- The bench is browser Canvas2D/WebGL, not Godot. Godot web runs its own WebGL2 renderer through WASM, so absolute numbers will differ. The ratios (cache vs redraw, draw-command count) are what to take away.

### Gaps
- No real low-end device was measured. CPU throttle does not slow the GPU, and SwiftShader is slower than most weak GPUs.
- No Godot web build was benchmarked. The next step is a Godot 4.5 Compatibility export with 1, 10, 50, 200 Label bubbles, read with the in-engine monitor `RENDER_TOTAL_DRAW_CALLS_IN_FRAME`.
- Timer clamped at 0.1 ms. Sub-0.1 ms differences are noise.

## Q2. Godot 4 text rendering cost (published)

### Takeaway
Godot batches 2D draws by texture. Text batches well until something forces a texture switch per glyph, such as shadows or outlines. That bug was the main published text perf problem in 4.3/4.4 and was fixed for 4.5. RichTextLabel with any effect redraws itself every frame and runs effect code per glyph per frame.

### Cited findings
- Batching history. The Compatibility (GLES3/WebGL2) renderer has batched since 4.0. Godot 4.4 dev 3 added batching to Forward+ and Mobile (PR GH-92797 by Stuart Carnie), saying 2D performance is now "comparable between all backends". https://godotengine.org/article/dev-snapshot-godot-4-4-dev-3/
- PR 92797 numbers (vendor-reported, M1 MacBook Pro, zoomed tilemap): draw calls from more than 573,440 to 36, FPS from about 10 to more than 130. https://github.com/godotengine/godot/pull/92797
- Text did not batch in that PR. passivestar's test with one Label with shadow, 23,412 characters: master Vulkan 30 fps and 60,495 draw calls, PR 40 fps and 40,332 draw calls, Unity URP 246 fps with 1 draw call for the text. https://github.com/godotengine/godot/pull/92797#issuecomment-2309051165
- Issue 104751 (Godot 4.4 stable, Forward+, RTX 3060 laptop): a big Label renders at about 2 ms per frame, and turning on shadows takes it to 30 ms. https://github.com/godotengine/godot/issues/104751
- Issue 103464 (4.3 and 4.4 rc2, Vulkan and OpenGL, 1000 Labels): Label shadow causes a large drop. Fixed by PR 103471 (merged 2025-03-05, 4.5 milestone). The fix draws the shadow outline for all glyphs first, then the text, so it takes 2 draw calls instead of switching texture per glyph. Author says "almost 2x faster". The 4.4 backport PR 106818 was closed. https://github.com/godotengine/godot/issues/103464 , https://github.com/godotengine/godot/pull/103471
- Issue 80127 (4.1, open): a Label with about 100k characters is slow because all text is processed every frame. Issue 110533 (closed 2025-09) asks the docs to say RichTextLabel generally performs better for huge text. https://github.com/godotengine/godot/issues/80127 , https://github.com/godotengine/godot/issues/110533
- GLES3 canvas renderer source starts a new batch when the texture, blend mode, repeat mode or command type changes. https://github.com/godotengine/godot/blob/master/drivers/gles3/rasterizer_canvas_gles3.cpp (around lines 910-945)
- Batching project settings: `rendering/2d/batching/item_buffer_size` default 16384, `uniform_set_cache_size` default 4096. https://github.com/godotengine/godot/blob/master/servers/rendering/rendering_server.cpp (line 3708)
- RichTextLabel effects. In `NOTIFICATION_INTERNAL_PROCESS`, once the text is finished, it calls `_update_fx` and `queue_redraw()` every frame while visible. During draw, custom effects call `_process_effect_impl(charfx)` once per glyph, per draw step (shadow, outline, text). https://github.com/godotengine/godot/blob/master/scene/gui/rich_text_label.cpp (lines 1579-1600, 2929-2937)
- Font atlases. TextServerAdvanced makes a new cache texture of `max(font_size*0.125, 256)` rounded up to a power of two, capped at 1024 (2048 for MSDF). Format LA8 (2 bytes per pixel) for grayscale, RGBA8 for colour glyphs. https://github.com/godotengine/godot/blob/master/modules/text_server_adv/text_server_adv.cpp (lines 852-870)
- Godot docs on MSDF: "Higher baseline cost for font rendering", worse at small sizes because no hinting, caches once per font not per size. Pixel fonts need Nearest filter, integer-multiple sizes, subpixel positioning Disabled. https://docs.godotengine.org/en/stable/tutorials/ui/gui_using_fonts.html
- Web: Godot 4 web export only supports the Compatibility renderer (WebGL 2). https://docs.godotengine.org/en/4.0/about/troubleshooting.html

### Inferences
- ESTIMATE: memory per font size is one 256x256 LA8 page (128 KiB) for any pixel font under 2048 px. A Latin pixel font at 2-3 sizes costs under 0.5 MB of atlas. A CJK localization fills more pages at 1024x1024 LA8 (2 MiB each).
- ESTIMATE: a bubble built as NinePatchRect + Label alternates two textures (frame atlas, font atlas) and a command type change, so N interleaved bubbles cost about 2N draw calls in Compatibility. Ways to fold them: put all bubble frames on one layer and all text on a layer above, bake the frame into the font atlas (unusual), or render bubbles into one SubViewport.
- Avoid Label shadow and outline on Godot 4.4 or older for overhead text. Use 4.5 or later, or fake the outline with a pre-outlined bitmap font (one texture, one pass).
- Use RichTextLabel effects only on the one active dialog box. Never on crowd bubbles. Plain Label with `visible_ratio` / `visible_characters` animation is enough for typewriter text.
- MSDF is wrong for a pixel-art game. Use a bitmap font (FontFile from image) or a pixel TTF with antialiasing off.

### Gaps
- No published ms number for Label vs RichTextLabel in the same scene, and none for RichTextLabel custom effects per glyph. No Godot web text benchmark with numbers found.
- Did not confirm whether PR 103471 shipped in a 4.4.x patch.

## Q3. Network: bytes per NPC line

### Cited findings (Canary, open-source Tibia server)
- `sendCreatureSay` writes opcode 0xAA, u32 statement id, name string (u16 length + bytes), 1 byte "traded" flag (new protocol), u16 level (0 for NPCs), u8 speak type, 5-byte position, then the text string (u16 length + bytes). https://github.com/opentibiabr/canary/blob/main/src/server/network/protocol/protocolgame.cpp (lines 8006-8046)
- Client say (`parseSay`): u8 type, optional receiver or channel id, text string. Text over 255 characters is rejected. Same file, lines 2715-2734.
- Framing: messages are XTEA-encrypted with padding to 8-byte blocks, a 2-byte length and a 4-byte checksum or sequence header, and zlib compression in sequence mode. Several messages share one output buffer. https://github.com/opentibiabr/canary/blob/main/src/server/network/protocol/protocol.cpp (lines 168-245)

### Arithmetic (ESTIMATE)
- Tibia-style NPC line = 18 bytes fixed + name + text. "Al Dee" (6) saying a 62-character greeting = 86 bytes before framing. Up to 255 characters gives about 280 bytes max.
- Line id with args = 1 opcode + 4 creature id + 2 line id + args. One u8 arg (say a count) = 8 bytes. A player-name arg adds 2 + name length. So 8-20 bytes, about 5-10x smaller than text.
- Crowd case: 30 players in view of a busy NPC, each NPC line broadcast to all of them. Text: 30 x 86 = 2.6 KB per line. Ids: 30 x 8 = 240 B. Either is small next to movement traffic. The real win of ids is localization (client holds the strings) and anti-tamper, not bandwidth.
- Cost of ids: the client must ship every NPC string. A 2,000-line NPC script at about 60 bytes per line is about 120 KB per language uncompressed (ESTIMATE), about 40 KB gzipped.

### Gaps
- No measured Tibia capture. Byte counts come from reading Canary source, not from a packet trace.

## Sources
- Godot 4.4 dev 3 batching: https://godotengine.org/article/dev-snapshot-godot-4-4-dev-3/
- PR 92797 RD canvas batching: https://github.com/godotengine/godot/pull/92797
- passivestar text batching test: https://github.com/godotengine/godot/pull/92797#issuecomment-2309051165
- Issue 104751 Label shadow 2 ms to 30 ms: https://github.com/godotengine/godot/issues/104751
- Issue 103464 Label shadow perf: https://github.com/godotengine/godot/issues/103464
- PR 103471 shadow fix: https://github.com/godotengine/godot/pull/103471
- Issue 80127 huge Label: https://github.com/godotengine/godot/issues/80127
- Issue 110533 docs for Label vs RTL: https://github.com/godotengine/godot/issues/110533
- Issue 99420 4.4 dev batching regression: https://github.com/godotengine/godot/issues/99420
- Godot fonts docs: https://docs.godotengine.org/en/stable/tutorials/ui/gui_using_fonts.html
- GLES3 canvas renderer: https://github.com/godotengine/godot/blob/master/drivers/gles3/rasterizer_canvas_gles3.cpp
- RenderingServer settings: https://github.com/godotengine/godot/blob/master/servers/rendering/rendering_server.cpp
- RichTextLabel source: https://github.com/godotengine/godot/blob/master/scene/gui/rich_text_label.cpp
- TextServerAdvanced source: https://github.com/godotengine/godot/blob/master/modules/text_server_adv/text_server_adv.cpp
- Canary protocolgame.cpp: https://github.com/opentibiabr/canary/blob/main/src/server/network/protocol/protocolgame.cpp
- Canary protocol.cpp: https://github.com/opentibiabr/canary/blob/main/src/server/network/protocol/protocol.cpp
- Godot web troubleshooting: https://docs.godotengine.org/en/4.0/about/troubleshooting.html
