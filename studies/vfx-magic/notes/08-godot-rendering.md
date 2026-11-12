# 08. Rendering spell effects in Godot 4, Compatibility renderer, web export

Researcher 08, VFX #10 Magic and spell VFX. Research date 2026-11-11.

Engine state on that date. Latest stable is Godot 4.7.2 (maintenance release, reported as 2026-08-18 by gamedev.net, https://gamedev.net/news/godot-engine-472-stable-released-r5172/). The stable docs are headed "Godot Engine 4.7". 4.8 is in development (PR #124838 carries the 4.8 milestone). Source code quotes below come from the `4.7-stable` tag of godotengine/godot, files under `drivers/gles3/`.

How to read this file. "Cited" means a doc page, issue, PR or source line says it. "Inference" is my reading. Numbers posted by users in issues and forums are self-reported and marked so.

---

## 1. Particles

### Takeaway
On web, GPUParticles2D is the wrong default. It works (transform feedback), but each particle process shader costs seconds of compile time in the browser, and trails, sub-emitters and manual emission do not exist in Compatibility. Use flipbook sprites for the body of a spell and CPUParticles2D or one hand-rolled MultiMesh for loose motes. Every particle node, MultiMesh and polygon is its own draw call, so node count matters more than particle count.

### Cited findings
- GPU particles in Compatibility run on transform feedback. `particles_storage.cpp` calls `glBeginTransformFeedback(GL_POINTS)` with `GL_RASTERIZER_DISCARD` (lines 795, 851, 984 at 4.7-stable). https://github.com/godotengine/godot/blob/4.7-stable/drivers/gles3/storage/particles_storage.cpp
- Missing features, as warnings in the same file. "The Compatibility renderer does not support particle trails" (l.303), "does not support particle sub-emitters" (l.387), "does not support manually emitting particles" (l.392), no vector field attractors (l.674), no SDF colliders (l.707). Adreno 3XX devices get GPU particles disabled outright with "Please use CPUParticles instead" (l.124).
- The renderers table (4.7 docs) agrees. Particle trails and particle SDF collision are "Not supported" in Compatibility. https://docs.godotengine.org/en/stable/tutorials/rendering/renderers.html
- `emit_particle()` is "only supported on the Forward+ and Mobile rendering methods, not Compatibility". https://docs.godotengine.org/en/stable/classes/class_gpuparticles2d.html
- Sub-emitter warnings and fallbacks landed in 4.1, PR #78490. https://github.com/godotengine/godot/pull/78490
- Web compile cost, issue #87843 (open, filed 2024-02-01, Godot 4.2.1). One default GPUParticles2D with a GradientTexture2D "needs around 2 seconds to load" on web. With 4 systems the one-frame warm-up froze the browser "for 30-60 seconds" (reporter, self-reported). The reporter moved to CPU particles, which "did not incur any noticeable loading delays". Calinou's reply says WebGL shader compilation is much slower than desktop because browsers go through ANGLE. https://github.com/godotengine/godot/issues/87843
- Same issue, comment dated 2026-11-01 on 4.7.2-stable, Chrome on Windows (ANGLE, D3D11), self-reported. Four GPUParticles3D systems of 26 to 140 particles cost 22 to 25 s of compile and link each, about 93 s together. Each process program had a fragment shader of about 34k characters. `convert_from_particles()` to CPU particles removed the cost. This is 3D, but the 2D node uses the same particle process shader.
- Forum, Godot 4.6, 2026-04/05. A user pre-warmed four one-shot GPU particle systems and still saw a first-use hitch on web. A responder advised CPUParticles because GPU particles are not dependable in Compatibility. https://forum.godotengine.org/t/gpuparticles-not-cached-after-first-run-in-web-build-shader-cache-is-enabled/137991
- `amount_ratio` below 1 gives "no performance benefit". Resources are allocated and processed for the full `amount`. Changing `amount` restarts the system. (GPUParticles2D class reference, 4.7.) https://docs.godotengine.org/en/stable/classes/class_gpuparticles2d.html
- `preprocess` runs the particle shader `fixed_fps` times (or 30) per second of preprocess and "can be very expensive". Same page.
- One-shot lifecycle. The `finished` signal fires only for `one_shot` emitters. After `finished`, setting `emitting = true` may not restart for a short time. Call `restart()` instead. Same page.
- Flipbook particles. Put a CanvasItemMaterial on the particle node, enable `particles_animation`, set `particles_anim_h_frames`, `particles_anim_v_frames`, `particles_anim_loop`. https://docs.godotengine.org/en/stable/tutorials/2d/particle_systems_2d.html
- The docs still recommend GPUParticles2D by default, and say CPUParticles2D has "lower performance when using large amounts of particles" but "may perform better on low-end systems or in GPU-bottlenecked situations". That page is flagged as not updated for 4.7 and never mentions web. Same URL.
- Draw calls. In the GLES3 canvas renderer, `TYPE_MESH`, `TYPE_MULTIMESH` and `TYPE_PARTICLES` commands hit the comment "Meshes can't be batched, so always create a new batch" (`rasterizer_canvas_gles3.cpp` l.1176-1179). https://github.com/godotengine/godot/blob/4.7-stable/drivers/gles3/rasterizer_canvas_gles3.cpp
- MultiMesh. `RenderingServer.multimesh_set_buffer()` sets all instance state from one linear array. Docs say "for a few thousands, GDScript should be fine". https://docs.godotengine.org/en/stable/tutorials/performance/using_multimesh.html
- MultiMesh per-instance colour and custom data are 4 floats each. In Compatibility each component is "packed into 16 bits" (half floats), 32 bits elsewhere. `use_colors` and `use_custom_data` must be set before `instance_count`. `visible_instance_count` limits what is drawn without resizing buffers. https://docs.godotengine.org/en/stable/classes/class_multimesh.html
- A forum user reports MultiMeshInstance2D drawing "at least 30,000 meshes per frame" at 80 fps on a desktop (native, self-reported, no hardware given). https://forum.godotengine.org/t/what-is-great-reading-material-on-multimeshinstance2d-videos-ok-too/139841
- Node spawn hitches on web. Issue #86913 (4.1.3 / 4.2.1) reports a hitch the first time a preloaded scene is instantiated and added, 28 to 35 fps in browser against 55 to 60 native on the same laptop (self-reported, closed). https://github.com/godotengine/godot/issues/86913

### Inferences
- Budget by nodes. 30 casters with 3 particle nodes each is 90 draw calls before a single sprite is drawn. The same 30 casts as flipbook Sprite2D quads on one atlas can be 1 to 3 draw calls (see section 3).
- One shared MultiMeshInstance2D for all loose motes in the scene (sparks, embers, sparkles) costs 1 draw call. Simulate in GDScript into a preallocated PackedFloat32Array and upload once per frame. A 2D instance with colour and custom data is 8 + 4 + 4 = 16 floats, so 1,000 motes is a 64 KB upload per frame. Set `visible_instance_count` to the live count. I found no measured GDScript cost per particle on web. Estimate 1 to 3 µs per particle in a tight loop on desktop wasm, so keep the scene-wide cap near 500 to 1,000 until measured.
- CPUParticles2D avoids the process shader. I believe it draws through an internal MultiMesh (from memory of `cpu_particles_2d.cpp`, not re-checked), which matches the "always a new batch" rule.
- Pool every effect node at load. Pooling removes the first-instantiate hitch from #86913 and the one-shot restart quirk. Use `restart()` on reuse.
- If you must use GPUParticles2D, give all emitters the same ParticleProcessMaterial settings shape so they share one compiled program, and warm it on the loading screen.

### Gaps
- No measured CPUParticles2D vs GPUParticles2D frame times on WebGL2 at fixed counts. Nobody has published them. This needs a Kingsfoil sandbox test.
- No measured cost of `multimesh_set_buffer` from GDScript on web.
- `_draw()` / `RenderingServer.canvas_item_add_texture_rect_region` cost per quad not measured. Source shows rect commands batch like sprites.

---

## 2. Blending, glow, screen-reading

### Takeaway
Additive sprites are the cheap glow and the docs say so. Real glow exists in Compatibility since 4.3 and HDR 2D too, but it is a full-screen post-process with coarse control. For 320x180 pixel art a pre-baked halo sprite with additive blend, or the palette-ramp "glow without alpha", is cheaper and stays on the pixel grid. Screen-reading shaders trigger a full-screen copy. Allow one per frame at most.

### Cited findings
- CanvasItemMaterial blend modes are Mix, Add, Sub, Mul and Premult Alpha. https://docs.godotengine.org/en/stable/classes/class_canvasitemmaterial.html
- A blend mode or blend colour change starts a new batch (`rasterizer_canvas_gles3.cpp` l.929-930).
- Glow in Compatibility arrived in 4.3 with PR #87360 (merged 2024-02-20). It uses dual filtering blur ("much more bandwidth efficient") and simple blending, with features left out "to keep this performant on mobile devices". The same PR made the 2D HDR setting switch the viewport to RGBA16F in Compatibility. Without HDR it uses an RGB10A2 buffer and a luminance multiplier. Glow on a transparent-background viewport only works with HDR on. https://github.com/godotengine/godot/pull/87360
- The docs said for two years that HDR 2D did nothing in Compatibility. PRs #109095 and #110065 (4.5, August 2025) corrected them. https://github.com/godotengine/godot/pull/109095
- The 4.7 ProjectSettings text for `rendering/viewport/hdr_2d` has no renderer restriction and describes an RGBA16 framebuffer. https://docs.godotengine.org/en/stable/classes/class_projectsettings.html
- Conflict. The 4.7 renderers table still lists "2D HDR Viewport: Not supported" for Compatibility (as relayed by my fetch tool). The source and PRs say it works. Trust the source, test in the sandbox.
- 4.6 changes. PR #110671 (merged 2025-10-15) blends glow before tonemapping and makes screen the default. PR #110843 (4.6) notes that "Compatibility ignores the blend mode" of glow. A 4.6 forum answer says glow levels cannot be adjusted in Compatibility, so glow size follows viewport resolution. https://github.com/godotengine/godot/pull/110671 , https://github.com/godotengine/godot/pull/110843 , https://forum.godotengine.org/t/how-can-i-adjust-hdr2d-glow-size/128616
- Bugs still landing in this area. Issue #110670 (2025-09) glow darkens the scene with HDR 2D when white > 1. PR #124838 (merged 2026-10-27, milestone 4.8) fixes multiply blending rendering 4 times too dark in Compatibility when glow is on and HDR 2D is off. https://github.com/godotengine/godot/pull/124838
- HDR output to HDR monitors (4.7) is Forward+ and Mobile only. https://godotengine.org/article/hdr-output-arrives-in-godot-4-7/
- Float render targets on WebGL2 depend on `EXT_color_buffer_float` (`config.cpp` l.102). https://github.com/godotengine/godot/blob/4.7-stable/drivers/gles3/storage/config.cpp
- Fake glow, from the 2D lights doc. Additive sprites "are much faster to render, since they don't need to go through a separate rendering pipeline". https://docs.godotengine.org/en/stable/tutorials/2d/2d_lights_and_shadows.html
- Screen texture. In 2D, the first node using `hint_screen_texture` makes Godot do "a full-screen copy". Later nodes reuse it and do not see each other. BackBufferCopy can copy a region or the full screen. Reading outside a region copy is undefined. Mipmapped screen reads need a mipmap filter on the uniform and generate back-buffer mips. https://docs.godotengine.org/en/stable/tutorials/shaders/screen-reading_shaders.html
- Source confirms it. `uses_screen_texture` sets `backbuffer_copy = true` with an empty (full) rect, and `uses_screen_texture_mipmaps` adds mip generation (`rasterizer_canvas_gles3.cpp` l.429-435).
- CanvasGroup "uses a custom shader to read from the backbuffer". Source shows a flush of pending items, a back-buffer copy or clear over the group rect, a second render pass for the children, and optional mip generation (l.464-511). `clip_children` uses the same back buffer. https://docs.godotengine.org/en/stable/classes/class_canvasgroup.html

### Inferences
- At a 320x180 internal resolution a full-screen back-buffer copy is 57,600 pixels, which is cheap. At native 1080p it is 2 million pixels per copy. So screen-reading shockwaves are affordable only inside the low-res viewport. This is a strong reason to render effects at game resolution.
- One distortion pass per frame. Draw all shockwave rings into one small "distortion" buffer or accumulate them as uniforms in one full-screen quad. Do not give each ring its own BackBufferCopy.
- Each CanvasGroup breaks batching twice and adds a copy. Do not wrap every spell in one. Use it only for a group fade where overlap would show.
- Enabling WorldEnvironment glow for a palette-limited 320x180 game adds a multi-pass blur over the final image and softens pixels. The Acid study's block-sum blur and the Light study's low-res additive map already cover this need.
- Premult Alpha blend lets one sprite carry both an opaque core (alpha 1) and an additive halo (alpha 0, colour > 0) in a single draw and a single batch. This is the cheapest "glow plus body" in Godot.

### Gaps
- No published ms cost for Compatibility glow on mobile WebGL2.
- No published cost for back-buffer copies on WebGL2.

---

## 3. 2D batching in Compatibility

### Takeaway
The Compatibility canvas renderer has batched since 4.0. A batch is a run of consecutive items with the same texture, material, blend mode, filter, repeat, clip and lit state. Draw order decides everything. One atlas, one material and effects grouped by blend mode in their own z layers give single-digit draw calls for a 30-caster fight. Since 4.4, per-instance uniforms let one ShaderMaterial serve every element without breaking the batch.

### Cited findings
- Batch state, from the `Batch` struct in `rasterizer_canvas_gles3.h` (l.251+). Texture, filter, repeat, blend mode, blend colour, clip, material, command type, primitive point count, specialization, lights disabled. https://github.com/godotengine/godot/blob/4.7-stable/drivers/gles3/rasterizer_canvas_gles3.h
- What starts a new batch in `rasterizer_canvas_gles3.cpp`. Clip owner change (l.601). Material change (l.623). Texture filter change (l.818). Lit vs unlit flip (l.873). Texture repeat change (l.925). Blend mode or colour change (l.929). Texture or command type change for rects (l.938). Every polygon ("Polygon's can't be batched", l.1094). Every mesh, multimesh and particles command (l.1176). Buffer full (l.1550).
- Limits. `MAX_RENDER_ITEMS = 256 * 1024`. `max_instances_per_buffer = 16384`, exposed as `rendering/gl_compatibility/item_buffer_size` (default 16384, commands beyond it "will be ignored"; lowering it "may improve performance on bandwidth limited devices"). https://docs.godotengine.org/en/stable/classes/class_projectsettings.html
- On web the instance buffer upload uses `glBufferSubData` instead of an unsynchronized map (`#ifdef WEB_ENABLED`, l.1553).
- 2D instance uniforms. PR #99230 "Implement 2D instance uniforms", merged 2024-12-20, milestone 4.4, fixes #62943. https://github.com/godotengine/godot/pull/99230
- Shading language doc (4.7). Instance uniforms are available in `canvas_item` and `spatial` shaders. They "do not support textures or arrays", with a "practical maximum limit of 16 instance uniforms per shader". In Compatibility you cannot index a texture array with an instance uniform, use a `switch`. https://docs.godotengine.org/en/stable/tutorials/shaders/shader_reference/shading_language.html
- In the GLES3 renderer the instance uniform offset is per-instance data (`instance_uniforms_ofs`, l.1157), not part of the `Batch` struct.
- Other renderers for context. Batching came to Forward+ and Mobile in 4.4 (PR #92797). PR #112481 (4.6) moved RD canvas instance data to vertex buffers, 4 to 5 times faster on Adreno 530, 1.5 to 2 times on Adreno 640 (PR author's benchmarks). Neither changes Compatibility. https://github.com/godotengine/godot/pull/112481
- Atlas effect, self-reported forum post (2026-08-21, Godot 4 web, "mid-range Android", device not named). Draw calls 240 to 38, battle fps 31 to 60, peak memory 612 MB to 152 MB, after packing about 250 loose sprites into 4 atlases with 2 px padding and 1 px extrude. Several changes were applied at once, no method given. Treat as an anecdote. https://forum.godotengine.org/t/godot-4-web-export-stutters-on-mobile-its-probably-your-art-pipeline-not-your-code-31fps-to-60fps-benchmarks-inside/143268

### Inferences
- Instance uniforms should not break batches in Compatibility, since the offset travels in instance data. I did not run a draw call count to confirm. Before 4.4 the workaround was `modulate` or vertex colour as a data channel.
- Y-sort is the batch killer. If an additive spark sorts between two mix-blend characters, that is 3 batches. Put effects in fixed layers by z_index instead. A workable stack is ground decals (mix), y-sorted actors with "behind" and "front" aura sprites sharing the actor atlas and blend, an additive effects layer, then a screen layer. Each layer is then 1 batch per texture.
- Use Premult Alpha on the effect atlas so "mix" and "add" effects share one blend mode and one batch.
- Keep every effect unlit (`render_mode unshaded` or light mask 0). A lit item next to an unlit one flips the specialization and breaks the batch.
- Keep one texture filter (nearest) project-wide. A single linear-filtered halo breaks the run.
- Avoid Line2D and Polygon2D for beams and lightning in hot paths. Each is a polygon command and its own draw call. Build lightning from rect segments (`draw_texture_rect_region` in one `_draw`) so it batches.

### Gaps
- No published draw call counts for a Compatibility web scene with many spell effects. The Godot monitor `RenderingServer.RENDERING_INFO_TOTAL_DRAW_CALLS_IN_FRAME` will give it in the sandbox.

---

## 4. Pixel-perfect effects

### Takeaway
Godot has no built-in fix for smooth camera plus pixel-perfect rendering. The safe choice for Kingsfoil is to render effects inside the same 320x180 viewport as the art, move them in whole pixels, and accept a snapped camera or the "oversized viewport nudged by the fractional offset" trick. Native-resolution particles over low-res art are mixels. Pixel games that care avoid them.

### Cited findings
- `rendering/2d/snap/snap_2d_transforms_to_pixel` rounds CanvasItem positions, "at the cost of less smooth movement, especially when Camera2D smoothing is enabled". `snap_2d_vertices_to_pixel` snaps final vertices only. The docs advise against using both and prefer transform snapping. Both default to false. https://docs.godotengine.org/en/stable/classes/class_projectsettings.html
- The smooth pixel camera problem is open. Proposal discussion #9256 "Pixel perfect games in Godot" and a 2024 forum thread say there are workarounds and "no solution so far". https://github.com/godotengine/godot-proposals/discussions/9256 , https://forum.godotengine.org/t/how-to-set-up-smooth-sub-pixel-camera-movement-for-pixel-art-games/38765
- Known workaround. Render to a SubViewport slightly larger than the game resolution, snap the camera to integers inside, and shift the container by the fractional remainder. Demo repo for Godot 4.1 notes it "is not perfect". https://github.com/voithos/godot-smooth-pixel-camera-demo
- A user reports a 320x180 SubViewport setup that worked in 3.5 and jittered after moving to Godot 4.2 (self-reported). https://forum.godotengine.org/t/smooth-camera-in-pixel-perfect-game/112586
- SubViewport on web. One 4.3 report of "<1 FPS" on HTML5 with multiple SubViewports active, no cause found, no numbers beyond that (self-reported, unresolved). https://forum.godotengine.org/t/subviewport-rendering-performances-on-web/101434
- Particle flipbook frames are set per particle through `particles_anim_h_frames` and `v_frames`, so particles can be hand-drawn pixel sprites. https://docs.godotengine.org/en/stable/tutorials/2d/particle_systems_2d.html

### Inferences
- Use the project stretch mode `viewport` at 320x180 with integer scaling instead of a manual SubViewport where possible. It is the engine's main path and avoids the extra viewport that the one bad web report involves.
- Transform snapping applies to the node, not to each particle. Particles inside CPUParticles2D or a MultiMesh move at sub-pixel positions and will shimmer. Fix it in the canvas_item vertex shader by rounding the instance origin, for example `VERTEX = floor(VERTEX + 0.5)` after the model transform in world or screen space, or round positions when filling the MultiMesh buffer. Hand-rolled buffers make this free.
- Disable particle scale curves and rotation for pixel motes. Use 1x1, 2x2 and 3x3 px sprites and swap frames instead of scaling.
- Fixed FPS on particle nodes (for example 12 to 15) gives stepped motion that matches hand animation.

### Gaps
- I found no source survey of what shipped pixel games choose for particle resolution. Other researchers cover the art side. The mixels claim here is common practice, not a cited finding.

---

## 5. Shader recipes and compile stutter

### Takeaway
Every recipe on the list is plain fragment math and runs in Compatibility. The cost that matters on web is compilation, not execution. There is no ubershader, no pipeline precompilation and no shader baker for Compatibility. Keep the number of distinct shaders tiny (aim for 3 to 5 for all spell effects) and draw each once behind the loading screen.

### Cited findings
- The pipeline stutter page states it applies to Forward+ and Mobile only. Compatibility is excluded. https://docs.godotengine.org/en/stable/tutorials/performance/pipeline_compilations.html
- The shader baker (PR #102552, 4.5) "doesn't work with the compatibility renderer" (clayjohn, 2025-05-30, in #86731). https://github.com/godotengine/godot/issues/86731
- Issue #86731 (open, filed 2024-01-03, 4.2.1). First display of canvas_item shaders is much slower in Compatibility than Mobile. About 2 s for "the simplest possible shader" on an M1 Mac (reporter). Not reproducible in 3.5.2. PR #87553 improved it and PR #87558 removed default canvas modes, cutting initial compile time by about 40% (clayjohn). Both shipped in 4.3.
- Same issue, 2026-08-06 comment. A web user still gets a smaller hitch on first in-game use after warming shaders on a loading frame (self-reported).
- Same issue, October to November 2026. PR #124566 "Overhaul GLES3 shader compiler" (opened 2026-10-16, still open, milestone 4.9) is under test with claimed gains of about 8 times for cached and 6 times for uncached loads (clayjohn, self-reported). A 4.7.2 web measurement on Chrome/ANGLE D3D11 for a 3D scene shows 183 programs, 63 to 103 s compile and link on a cold load, against 74 programs and 10.5 s with the default-specialization compile skipped (user kuhlsnu, self-reported, 3D scene shader).
- Warm-up is the official advice. "Show all effects behind a solid wall or sprite for 1 frame when the game loads" (Calinou, 2023). 3.x ubershaders were disabled for web because of browser WebGL bugs. https://forum.godotengine.org/t/handling-particle-shader-compilation-lag-in-godot-4-web-compatibility-renderer/36170
- `rendering/shader_compiler/shader_cache/enabled` defaults to true and stores compiled shaders "to disk". Forum users report it does not help on web. https://docs.godotengine.org/en/stable/classes/class_projectsettings.html
- The lit/unlit state is a shader specialization in the canvas renderer (`DISABLE_LIGHTING`, l.873), as are ninepatch, primitive, attributes and instancing (l.816).

### Inferences
- Each specialization is another program to compile. Warm each effect shader in the exact state it will be used: same lit state, same command type (sprite rect, MultiMesh instancing, polygon). Warming a shader on a Sprite2D does not warm its MultiMesh variant.
- Fold recipes into one "spell sprite" shader with instance uniforms as switches. Palette row (float), dissolve threshold (float), flash amount (float), dither on/off, UV scroll (vec2). Up to 16 instance uniforms are allowed. One program, one batch.
- Recipe costs per fragment, all estimates:
  - Palette / gradient map. 2 texture reads (grayscale flipbook, ramp). The ramp must be a regular uniform, so stack all element ramps as rows of one N x 16 texture and pick the row with an instance uniform. One grayscale sheet then serves every element.
  - Dissolve by noise threshold. 1 extra read of a small tiling noise texture, `step` and optional `discard`. Use a stepped edge colour instead of smooth alpha.
  - Hit flash. `mix(col.rgb, vec3(1.0), flash)`. Zero reads. Covered in Combat juice.
  - Outline. 4 extra reads (8 for corners). Needs 1 px transparent padding per atlas frame.
  - Scrolling-UV beam. 1 read with `UV.x + TIME * speed`, needs repeat enabled, which breaks the batch against non-repeat items. Use a region-wrapped `fract` inside the atlas rect instead.
  - Polar magic circle. `atan` and `length` per fragment plus `step` bands. No reads. Cheap at 320x180 where a 64 px circle is about 3,200 fragments. Snap UV to texel centres so rings land on the grid.
  - Bayer dither transparency. A 4x4 matrix lookup by `FRAGCOORD` mod 4 (const array or 4x4 texture) and `discard`. Makes all effects 1-bit alpha, which removes blending cost and sorting issues. Lock the pattern to world space, as in the Fog study.
  - Posterized alpha. `floor(a * n) / n`. Free.
- `discard` and dither turn overdraw from blending into alpha test, which is friendlier to tile-based mobile GPUs than stacked additive layers only if most pixels are rejected.

### Gaps
- No public per-shader compile times for canvas_item shaders on WebGL2 after 4.3. The 2 s figure is from 4.2.1 on macOS native.
- Whether browsers persist compiled programs between sessions for Godot is not documented. Chrome's own GPU shader cache may help on reload. Unverified.

---

## 6. Web export limits

### Takeaway
Assume one thread. All GDScript, canvas culling, batching and CPU particle simulation share the main thread, in wasm. Mobile browsers are fill-rate and memory bound, so additive overdraw and big textures hurt before sprite counts do.

### Cited findings
- "Godot 4 can only target WebGL 2.0 (using the Compatibility rendering method)." Since 4.3 single-threaded export is supported and is "the preferred and now default way". Threads need SharedArrayBuffer with COOP `same-origin` and COEP `require-corp` headers. Single-threaded "works very well on macOS and iOS too". https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_web.html
- "Safari has several issues with WebGL 2.0 support that other browsers don't have." WebAssembly is slower than native code. Same page.
- C# cannot be exported to web in Godot 4. GDExtension needs a web build. Same page.
- The browser pauses the project when its tab is not active. Same page.
- Max texture size is read from the driver at start (`GL_MAX_TEXTURE_SIZE`, `config.cpp` l.120).
- A 1024x1024 RGBA8 texture is 4 MB of GPU memory (arithmetic, also stated in the self-reported forum post in section 3).
- Threaded resource loading interfered with particle warm-up for one 4.6 web user (self-reported). https://forum.godotengine.org/t/gpuparticles-not-cached-after-first-run-in-web-build-shader-cache-is-enabled/137991

### Inferences
- GDScript has no tracing GC, it uses reference counting, so "GC-free" means avoiding per-frame allocation of Arrays, Dictionaries, Callables and new nodes. Preallocate one PackedFloat32Array per MultiMesh and write in place. Pool nodes and toggle `visible` plus `process_mode`.
- Keep the effect atlas at 1024x1024 or 2048x2048. 2048 is the safe WebGL2 minimum on all hardware (the ES 3.0 spec minimum is 2048). 4096 works on nearly all phones, but stay at 2048 for the low-end goal. A 2048 RGBA8 atlas is 16 MB.
- At 320x180 internal resolution, 10 full-screen additive layers are 576,000 blended fragments, trivial for any GPU. The upscale blit to the device resolution is the largest single fill. Low internal resolution is the main overdraw defence. Native-res effects on a 1080p phone canvas lose that.
- Spell logic per frame should be data, not nodes. One manager script iterating a flat array of active effects is cheaper than 200 nodes each with `_process`.

### Gaps
- No measured GDScript wasm throughput figure for per-particle loops. Needs a sandbox benchmark (suggest 1,000, 5,000, 20,000 particles on a mid-range Android phone).

---

## 7. Lights from spells

### Takeaway
Do not give each spell a PointLight2D. The Compatibility canvas shader loops over up to 16 light slots per fragment for any lit item, lights break batches, and the hard caps are 15 positional lights per item and 256 per render. Draw spell light as additive sprites into the low-res light map from the Light study.

### Cited findings
- `MAX_LIGHTS_PER_ITEM = 16`, `DEFAULT_MAX_LIGHTS_PER_RENDER = 256` (`rasterizer_canvas_gles3.h` l.90-91, l.245-246).
- The per-item gather loop stops at `max_lights_per_item - 1`, so 15 positional lights reach one item (`rasterizer_canvas_gles3.cpp` l.860). The shader reads `light_count` from 4 bits, "Max 16 lights" (`canvas.glsl` l.634), and loops `for (uint i = 0u; i < MAX_LIGHTS_PER_ITEM; i++)` with an early break (l.764). https://github.com/godotengine/godot/blob/4.7-stable/drivers/gles3/shaders/canvas.glsl
- Source comment. "TODO: consider making lights a per-batch property and then baking light operations in the shader for better performance" (l.838).
- Lights are selected per item by rect intersection, light mask and z range (l.850).
- 2D lights doc. "Larger lights have a higher performance cost as they affect more pixels". If lights slow the game, replace some with additive Sprite2D nodes, which "are much faster to render". Additive sprites cannot cast shadows. PCF13 shadows are for "a few lights at once". https://docs.godotengine.org/en/stable/tutorials/2d/2d_lights_and_shadows.html
- 2D shadow atlas default size is 2048, and its height in the GLES3 renderer is `max_lights_per_render * 2` rows.
- An iPhone report in #86731 saw about 70 fps in Compatibility against 120 in Mobile and suspected 2D lights (self-reported, unconfirmed).

### Inferences
- A TileMap layer is one or few large items, so a crowd of 30 spell lights over the same ground chunk exceeds 15 and the extra lights silently drop. That is a correctness problem as well as a speed one.
- The light map approach has fixed cost. One 320x180 (or smaller, 80x45) additive buffer, one multiply or add composite, 1 draw call per batch of light sprites. Link to VFX #5 Light, https://kingsfoil-artifacts.netlify.app/vfx-light-topdown-pixel.
- If one PointLight2D is wanted for a hero moment (ultimate, level-up), keep it shadowless, small in radius and alone.

### Gaps
- No measured ms per PointLight2D on WebGL2 mobile.

---

## 8. Other engines, for calibration

### Cited findings
- PixiJS v8 ParticleContainer. "Sprites + Container: 200,000 at 60fps", "Particles + ParticleContainer: 1,000,000 at 60fps" on a MacBook Pro M3, blog post by Mat Groves (PixiJS creator), 2024-10-03. Vendor figure, one machine. The author notes the bottleneck was the movement logic, not rendering. Only position is uploaded per frame by default ("dynamic" property). Other attributes are static until changed. More than 3 times faster than the v7 container. https://pixijs.com/blog/particlecontainer-v8
- Godot desktop anecdote for contrast. 30,000 MultiMeshInstance2D instances at 80 fps (section 1, self-reported, native).

### Inferences
- WebGL2 itself is not the limit. One instanced draw call with a per-frame buffer upload handles 10^5 to 10^6 sprites on a laptop. Godot's limits on web come from the wasm main thread (scene tree, GDScript) and shader compile time. So the hand-rolled MultiMesh path, which mirrors what PixiJS does, is the right shape for bulk motes.
- PixiJS's static/dynamic split is worth copying. Upload position each frame, bake colour and frame into data that changes rarely or is derived in the shader from a spawn time in custom data.

### Gaps
- Phaser 4 (SpriteGPULayer) and LÖVE SpriteBatch numbers were not found in my search budget.

---

## Recommended default stack for Kingsfoil (inference, to test in the sandbox)

1. Bodies of spells are pooled Sprite2D flipbooks on one 1024 or 2048 atlas, nearest filter, unshaded, one ShaderMaterial with instance uniforms (4.4+) for palette row, flash and dissolve.
2. Loose motes are one scene-wide MultiMeshInstance2D filled from GDScript, capped near 500 to 1,000 until measured, positions rounded to whole pixels.
3. No GPUParticles2D on web. CPUParticles2D only for a handful of ambient emitters.
4. Blend through Premult Alpha so mix and add share a batch. Effects live in fixed z layers, not in the y-sort.
5. Glow is a baked halo or palette ramp. Spell light goes into the low-res light map. No PointLight2D per spell, no WorldEnvironment glow.
6. At most one screen-reading pass per frame, inside the 320x180 viewport.
7. A loading-screen warm-up draws every effect shader once in its real state (sprite and MultiMesh variants).
8. Target Godot 4.7.x. Watch PR #124566 (open, milestone 4.9) for faster Compatibility shader loads.

## Sources

Godot docs (4.7 stable unless noted)
- Renderers overview. https://docs.godotengine.org/en/stable/tutorials/rendering/renderers.html
- GPUParticles2D class. https://docs.godotengine.org/en/stable/classes/class_gpuparticles2d.html
- 2D particle systems. https://docs.godotengine.org/en/stable/tutorials/2d/particle_systems_2d.html
- MultiMesh class and tutorial. https://docs.godotengine.org/en/stable/classes/class_multimesh.html , https://docs.godotengine.org/en/stable/tutorials/performance/using_multimesh.html
- CanvasItemMaterial, CanvasGroup. https://docs.godotengine.org/en/stable/classes/class_canvasitemmaterial.html , https://docs.godotengine.org/en/stable/classes/class_canvasgroup.html
- Screen-reading shaders. https://docs.godotengine.org/en/stable/tutorials/shaders/screen-reading_shaders.html
- Shading language (instance uniforms). https://docs.godotengine.org/en/stable/tutorials/shaders/shader_reference/shading_language.html
- 2D lights and shadows. https://docs.godotengine.org/en/stable/tutorials/2d/2d_lights_and_shadows.html
- ProjectSettings. https://docs.godotengine.org/en/stable/classes/class_projectsettings.html
- Pipeline compilations. https://docs.godotengine.org/en/stable/tutorials/performance/pipeline_compilations.html
- Exporting for the web. https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_web.html
- HDR output in 4.7. https://godotengine.org/article/hdr-output-arrives-in-godot-4-7/

Godot source, tag 4.7-stable
- https://github.com/godotengine/godot/blob/4.7-stable/drivers/gles3/rasterizer_canvas_gles3.cpp
- https://github.com/godotengine/godot/blob/4.7-stable/drivers/gles3/rasterizer_canvas_gles3.h
- https://github.com/godotengine/godot/blob/4.7-stable/drivers/gles3/storage/particles_storage.cpp
- https://github.com/godotengine/godot/blob/4.7-stable/drivers/gles3/shaders/canvas.glsl
- https://github.com/godotengine/godot/blob/4.7-stable/drivers/gles3/storage/config.cpp

Godot issues and PRs
- #87843 GPUParticles2D load times on HTML5 (open). https://github.com/godotengine/godot/issues/87843
- #86731 slow shader compilation in Compatibility (open). https://github.com/godotengine/godot/issues/86731
- #86913 lag spikes on web. https://github.com/godotengine/godot/issues/86913
- #107633 GPUParticles3D errors on web (open). https://github.com/godotengine/godot/issues/107633
- #78490 sub-emitter warnings, 4.1. https://github.com/godotengine/godot/pull/78490
- #87360 glow in Compatibility, 4.3. https://github.com/godotengine/godot/pull/87360
- #109095 and #110065 HDR 2D docs, 4.5. https://github.com/godotengine/godot/pull/109095 , https://github.com/godotengine/godot/pull/110065
- #110670, #110671, #110843 glow changes, 4.6. https://github.com/godotengine/godot/issues/110670 , https://github.com/godotengine/godot/pull/110671 , https://github.com/godotengine/godot/pull/110843
- #124838 multiply blend fix, 4.8. https://github.com/godotengine/godot/pull/124838
- #99230 2D instance uniforms, 4.4. https://github.com/godotengine/godot/pull/99230
- #92797 RD canvas batching, 4.4. https://github.com/godotengine/godot/pull/92797
- #112481 RD canvas vertex buffers, 4.6. https://github.com/godotengine/godot/pull/112481
- #124566 Overhaul GLES3 shader compiler (open, milestone 4.9). https://github.com/godotengine/godot/pull/124566
- Proposal discussion #9256 pixel perfect games. https://github.com/godotengine/godot-proposals/discussions/9256

Forums and blogs (self-reported)
- Particle shader compile lag on web, 4.2. https://forum.godotengine.org/t/handling-particle-shader-compilation-lag-in-godot-4-web-compatibility-renderer/36170
- GPUParticles not cached on web, 4.6. https://forum.godotengine.org/t/gpuparticles-not-cached-after-first-run-in-web-build-shader-cache-is-enabled/137991
- Web mobile atlas benchmarks, 2026-08. https://forum.godotengine.org/t/godot-4-web-export-stutters-on-mobile-its-probably-your-art-pipeline-not-your-code-31fps-to-60fps-benchmarks-inside/143268
- SubViewport on web, 4.3. https://forum.godotengine.org/t/subviewport-rendering-performances-on-web/101434
- HDR 2D glow size, 4.6. https://forum.godotengine.org/t/how-can-i-adjust-hdr2d-glow-size/128616
- MultiMeshInstance2D reading material. https://forum.godotengine.org/t/what-is-great-reading-material-on-multimeshinstance2d-videos-ok-too/139841
- Smooth pixel camera threads. https://forum.godotengine.org/t/how-to-set-up-smooth-sub-pixel-camera-movement-for-pixel-art-games/38765 , https://forum.godotengine.org/t/smooth-camera-in-pixel-perfect-game/112586 , https://github.com/voithos/godot-smooth-pixel-camera-demo
- Godot 4.7.2 release notice. https://gamedev.net/news/godot-engine-472-stable-released-r5172/
- PixiJS v8 ParticleContainer (vendor). https://pixijs.com/blog/particlecontainer-v8
