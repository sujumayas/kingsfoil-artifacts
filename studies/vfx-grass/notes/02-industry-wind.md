# 02 Industry architectures for grass and wind

Researcher 02. Angle: mainstream grass and wind architectures from primary sources, with the most weight on 2D code we can read (Terraria, Stardew, Luanti) and Godot 4 settings that decide whether sway stays crisp on web.

Forest study #4 already covered integer row offsets (D1) and travelling gusts with per-species stiffness (D2). This file does not repeat them. It adds the shipped numbers behind those ideas.

Headline: the two best primary sources turned out to be decompiled 2D games, not AAA talks. Terraria 1.4 has a complete, cheap "wheat wave plus trample" system in about 60 lines. The AAA talks (Ghost of Tsushima, BotW) are 3D compute-shader systems with few public numbers, and they matter for us mostly for their ideas (global wind, scrolling noise, clumps).

---

## Q1. How does Terraria 1.4 make grass sway in wind and react to walkers?

### Takeaway
Terraria's grass wave is one cosine per tile, with a phase that depends on the tile's column, plus a constant lean equal to the global wind. The trample reaction is a screen-sized ring buffer of "last time a player touched this tile" stamps. Both run on the CPU inside the normal sprite draw. Nothing runs when the tile is off screen. This is the closest shipped match to what Asterion needs.

### Cited findings
Source: decompiled `Terraria.GameContent.Drawing/TileDrawing.cs` and `WindGrid.cs`, version 1.4.4.1 ([TileDrawing.cs](https://github.com/br4dnblehh/terraria-source-code/blob/main/1.4.4.1/Terraria.GameContent.Drawing/TileDrawing.cs), [WindGrid.cs](https://github.com/br4dnblehh/terraria-source-code/blob/main/1.4.4.1/Terraria.GameContent.Drawing/WindGrid.cs)). tModLoader patches the same file ([patch](https://github.com/tModLoader/tModLoader/blob/1.4.4/patches/tModLoader/Terraria/GameContent/Drawing/TileDrawing.cs.patch)).

- Global clocks, advanced once per frame (60 fps), scaled by wind strength `n = lerp01(0.08..1.2, |Main.WindForVisuals|)`:
  - grass `+= 1/180 + 1/180 * n * 4`
  - trees `+= 1/240 + 1/240 * n * 2`
  - sunflowers `+= 1/420 + 1/420 * n * 5`
  - vines `+= 1/120 + 1/120 * n * 0.4`
- `GetWindCycle(x, y, counter)`:
  ```
  phase = x*0.5 + (y/100)*0.5          // integer y/100
  s = cos(counter*2π + phase) * 0.5 + WindForVisuals
  return s * lerp01(0.08..0.18, |WindForVisuals|)
  ```
  It returns 0 below the surface layer and when the "tiles sway in wind" option is off.
- Grass draw: `num3 = GetWindCycle(...) + GetWindGridPush(x, y, 20, 0.35)`. Then `position.X += num3`, `position.Y += |num3|`, and the sprite rotates by `num3 * 0.1` rad about the tile's bottom centre. Sway is zeroed when the back wall blocks wind or the tile is not "in a place with wind".
- Trample map (`WindGrid`): one struct per tile `{int Time; int DirectionX; int DirectionY;}`, grid sized to the visible tile area and indexed with `tile % width`. Every frame it scans players that are moving and on screen (up to 255 in multiplayer) and stamps `Time = gameTime` and the sign of their velocity into every tile their hitbox covers.
- Push curve: `GetWindGridPush(total=20, force=0.35)` is a triangle. It rises for 10 frames to `10*0.35 = 3.5`, then falls back to 0 at frame 20.

### Inferences (derived from the code above)
- Calm wind sway period is 180 frames, 3.0 s. Strong wind cuts it to 36 frames, 0.6 s (5x faster).
- Wavelength along x is `2π/0.5 = 12.6 tiles = 201 px` at 16 px tiles. The visible wave front moves 12.6 tiles per period, about 67 px/s in calm and 335 px/s in a storm.
- The phase term is `+0.5x`, so the wave crest always travels toward negative x, whatever the wind sign. The constant `+WindForVisuals` term supplies the lean direction. In practice nobody notices, but for us the wave direction should come from the server wind vector.
- Grass offset in calm is about ±0.5 px plus the wind lean. Terraria draws at native resolution with float positions, so the GPU's point sampling turns this into 0 or 1 px jumps.
- A trample bump peaks at 3.5 px offset and 0.35 rad tilt, and the full bump lasts 20 frames (0.33 s). Recovery is fast and springless. For a Tibia-style top-down grid we want longer recovery (seconds), but the stamp-a-timestamp idea transfers directly.
- Memory cost of the trample map is 12 bytes per visible tile. A 320x180 view at 32 px tiles is 10x6 tiles plus a margin, so well under 1 KB. Per frame cost is "stamp the tiles under each moving player" plus "one subtraction per drawn grass tile".
- The wind gate (`0.08..0.18`) makes sway start at a threshold, so calm days are still. That restraint is part of why it reads well.

### Gaps
- Range of `Main.WindForVisuals` in normal weather was not traced (it lives in `Main.cs`). Real pixel amplitudes depend on it.
- No measured frame cost. Terraria has no published profiling of this path.
- See it in action: [Terraria wiki, Wind](https://terraria.wiki.gg/wiki/Wind) (may block bots).

---

## Q2. What does Stardew Valley's grass do?

### Takeaway
Stardew grass has no wind sway at all. It only shakes when something walks through it, with a damped rotation that sleeps the object when it settles. That is a strong data point for restraint: a top-down farm game praised for feel gets by with "still until touched".

### Cited findings
Source: decompiled 1.6 `StardewValley.TerrainFeatures/Grass.cs` ([AcidicNic/StardewValleyDecompiled1.6](https://github.com/AcidicNic/StardewValleyDecompiled1.6/blob/main/StardewValley.TerrainFeatures/Grass.cs)).

- Constants: `defaultShakeRate = π/80`, `maximumShake = π/8`, `shakeDecayRate = π/350`.
- On collision, if not already shaking, it plays the grass sound when on screen and calls `shake(π/8 / min(1, 5/speed), π/80 / min(1, 5/speed), colliderIsRightOfCentre)`. Faster colliders shake harder.
- `tickUpdate`: rotation ping-pongs by `shakeRate` between ±`maxShake`. `maxShake` drops by π/350 each tick. When it reaches 0, rotation halves each tick, and below 0.01 rad it sets `NeedsUpdate = false`.
- Each tile holds up to 4 weeds (`numberOfWeeds`, clamped to 4 on regrowth). Each weed is a 15x20 px source rect, drawn at 4x scale, rotated about origin (7.5, 17.5), jittered by `Random.Next(-2, 3) * 4` screen px, and randomly flipped. Each weed's rotation is `shakeRotation / (r + 1)` with r in [0, 1), so neighbours bend 50% to 100% as much.
- `NeedsUpdate` is a networked-world flag. Grass only ticks while shaking.

### Inferences
- Peak bend is 22.5 degrees. Shake decays over about 44 ticks (π/8 ÷ π/350), roughly 0.73 s at 60 ticks/s, then a short halving tail.
- Stardew rotates the sprite at 4x scale, so rotated grass shows tilted chunky pixels. That is the "mixel" look the user wants to avoid. For pixel-perfect sway, swap rotation for whole-pixel row shear (Forest D1).
- The per-weed `1/(r+1)` divisor is a cheap stiffness variation worth copying.
- The sleep flag is the efficiency lesson. On a field of 2,000 tufts, only the handful near walkers cost anything.

### Gaps
- No grass sway in wind means no Stardew wind numbers. Bushes and trees have separate shake code not read here.
- See it in action: [Stardew wiki Grass via API](https://stardewvalleywiki.com/mediawiki/api.php?action=parse&page=Grass&prop=wikitext&format=json).

---

## Q3. How do Minecraft-likes (Luanti) wave plants in a shader?

### Takeaway
Luanti moves only the top vertices of plant quads with a sum of smoothed triangle waves at integer frequencies. The integer frequencies make the timer wrap seamless. The phase barely changes across space, so a whole field waves nearly in sync. Cheap and stable, but no travelling gust.

### Cited findings
Source: [luanti nodes_shader/opengl_vertex.glsl](https://github.com/luanti-org/luanti/blob/master/client/shaders/nodes_shader/opengl_vertex.glsl) and [src/client/game.cpp](https://github.com/luanti-org/luanti/blob/master/src/client/game.cpp).
- `animationTimer = (frameTime_ms % 1000000) / 100000`, so it gains 0.01 per second and wraps every 1,000 s.
- `smoothTriangleWave(x) = smoothstep(triangle(x)) * 2 - 1`, period 1.
- `tOffset = (wpos.x + wpos.y) * 0.001 + wpos.z * 0.002`.
- `disp_x = (stw(t*23 + tOffset) + stw(t*11 + tOffset)) * 0.4`
- `disp_z = (stw(t*31 + tOffset) + stw(t*29 + tOffset) + stw(t*13 + tOffset)) * 0.5`
- Plants: only vertices with `texcoord.y < 0.05` (the top) move. Leaves move all vertices, with y at 0.1 strength.
- Shadow maps use the un-waved position to avoid self-shadow flicker.

### Inferences
- Frequencies are 0.23 and 0.11 Hz in x, and 0.31, 0.29 and 0.13 Hz in z. That is a 3 to 9 s period. Slow, calm motion.
- Peak top-vertex offset is 0.8 units in x and 1.5 in z. Luanti nodes are 10 units (BS = 10), so 8% and 15% of a block.
- Spatial phase changes 0.01 to 0.02 cycles per node, so a wave crest spans 50 to 100 nodes. Fields look like one breathing sheet.
- All frequencies are integers and the wrap value (10.0) is an integer, so the wrap at 1,000 s has no visible jump. The same trick fixes Godot's `TIME` rollover on mobile (Q6).
- Triangle waves are cheaper than `sin` on old GPUs and their smoothed peaks linger, which reads more like real grass than a pure sine.

### Gaps
- No measured cost. Luanti does not publish shader timings.

---

## Q4. What do the AAA grass talks actually say?

### Takeaway
The big 3D systems share four ideas. Bend only the tip. Drive the bend from a scrolling noise texture sampled at the blade root. Keep one global wind direction. Spend fewer, wider blades at distance. The exact numbers from the Ghost of Tsushima talk are not public in text. Treat the counts below as secondary.

### Cited findings
- GPU Gems 1, ch. 7 "Rendering Countless Blades of Waving Grass" ([NVIDIA](https://developer.nvidia.com/gpugems/gpugems/part-i-natural-effects/chapter-7-rendering-countless-blades-waving-grass)). Each grass object is three intersecting textured quads in a star. Only upper vertices move, identified by texture v near 0. Motion is a sin/cos of position, time, wind direction and strength. It compares three granularities:
  - Per cluster. The CPU computes one offset per cluster. Rich simulation, but one draw call per cluster, and clusters move in sync.
  - Per vertex. One or a few draw calls for the whole meadow. Rippling, but it can stretch the texture.
  - Per object. The object centre is stored in a texture coordinate. Local variation, no stretching, still few draw calls.
  No blade counts or timings given.
- Ghost of Tsushima, "Procedural Grass in Ghost of Tsushima", Eric Wohllaib, GDC 2021 Advanced Graphics Summit ([GDC Vault](https://gdcvault.com/play/1027214/Advanced-Graphics-Summit-Procedural-Grass), video id `Ibe1JBF5i5Y`). Secondary summaries say:
  - blades are cubic Bezier curves, 15 vertices at high LOD and 7 at low LOD ([Cain Rademan's Unity recreation](https://cainrademan.github.io/Unity-Grass/), [Stylized Station thread](https://threadreaderapp.com/thread/1688939411575119872))
  - wind is scrolling 2D Perlin noise feeding a sine, which moves the Bezier control points ([same](https://threadreaderapp.com/thread/1688939411575119872))
  - clumps come from a Voronoi pattern, and distance and frustum culling apply per tile ([talk summary](https://gist.ly/youtube-summarizer/procedural-grass-systems-in-ghost-of-tsushima-achieving-art-direction))
  - distant blades are drawn twice as wide with half as many ([notes page](https://publish.obsidian.md/xybre/3.+Reference/Creative/Development/Gamedev/Visuals/Shaders+-+Grass+and+Foliage))
  - blades seen edge-on get stretched in view space ([2Retr0/GodotGrass README](https://github.com/2Retr0/GodotGrass))
- Ghost of Tsushima wind, Bill Rockenbeck, GDC 2021 ([Game Developer article](https://gamedeveloper.com/design/using-vorticles-to-simulate-wind-in-i-ghost-of-tsushima-i-)). The main wind has a constant direction, and its magnitude varies with time-varying Perlin noise. Local disturbances (footfalls, "vorticles") get summed brute-force from a small array, "up to hundreds of vorticles". Developer quote says it uses "only a small fraction" of PS4 compute. No ms figure.
- Breath of the Wild: no primary technical source found. Developers of Age of Calamity called recreating it hard ([Nintendo Life](https://nintendolife.com/news/2022/01/hyrule-warriors-age-of-calamitys-development-was-a-real-pain-in-the-grass)).
- Hexaquo Godot grass series, part 3 ([hexaquo.at](https://hexaquo.at/pages/grass-rendering-series-part-3-animating-and-interacting-with-grass-in-godot/)). It samples a ridged simplex `NoiseTexture2D` at `world.xz / 10`, scrolled by `TIME * wind_direction * wind_strength` with `wind_strength = 0.1`, and bends by noise x height. The author reports that per-blade noise made grass look like it was "dancing". A single global direction read as real gusts. Bent blades get darkened (AO lowered by bend amount).
- Jarl (2D pixel-art colony sim), procedural 2D grass ([80.lv, Aug 2026](https://80.lv/articles/building-procedural-2d-grass-with-gpu-compute)). Grass is regenerated every frame from a hash of world tile coordinates and blade index. The hash sets position in tile, height, colour and sway phase. A small density texture sets blades per tile. Developer-reported cost is under 1 ms at 4K on an RTX 3080 Ti. It uses WebGPU compute, so it is not portable to Godot Compatibility.
- Elahee's grass deck ([Google Slides, 2025](https://docs.google.com/presentation/d/1ZakYwCSAM7fUcupVSY_j0Dv8j5ScoZeCkPy5XHmFvZ0/htmlpresent)) recommends 3 to 4 LOD stages and spending 10 to 20% of the scene's polygon budget on vegetation.

### Inferences
- The idea that transfers to Asterion is "global wind direction from the server, magnitude from a scrolling noise sampled at the tuft's world position". It produces the wheat wave for free, because neighbouring tufts read neighbouring noise texels at slightly different times.
- Hashing world tile coordinates for tuft placement, height and phase (Jarl) works on any renderer. On the CPU, it means a field needs no stored per-tuft data, only a density value per tile.
- Hexaquo's "dancing vs blown" finding matches Terraria. Both lean everything one way and add a travelling ripple on top.

### Gaps
- No primary text for Tsushima blade counts, tile size, noise texture size or ms cost. Only the video has them.
- Horizon, Sea of Stars, Eastward, Chained Echoes, Octopath, Hyper Light Drifter, Unrailed, Tiny Glade, Celeste and Rain World: no primary grass or wind breakdown found within budget. Eastward's devs only say they use shader textures in their own Maoi engine ([Game Developer](https://www.gamedeveloper.com/art/eastward-s-creators-share-insights-on-making-pixel-art-adventures)).

---

## Q5. How do people do pixel-perfect 2D sway in Godot?

### Takeaway
Two working patterns. Either quantize a UV offset to whole texels in the fragment shader, or shear the vertex and rely on Godot's snapping. The fragment method gives true per-row pixel steps (Forest D1) at the cost of a little sprite padding.

### Cited findings
- "Wind with pixel snapping" ([godotshaders](https://godotshaders.com/shader/wind-with-pixel-snapping/)). It computes the offset, multiplies by texture width (`1/TEXTURE_PIXEL_SIZE.x`), applies `round()`, divides back, then adds to `UV.x` before `textureLod`. Time phase is quantized per texel row, so each row steps separately. Phase comes from `sin(worldPos.x)`, so sprites in the same column move together. Defaults are `windCutoff = 8`, `windStrength = 1`, `windSpeed = 1`. It also tints the colour by `offset * 0.15`, so moving pixels brighten. The author warns it is untested across sprite sizes.
- "2D Pixel perfect wind & sway effect" ([godotshaders](https://godotshaders.com/shader/2d-pixel-perfect-wind-sway-effect/)) has a margin parameter for vertex room and uses `REGION_RECT`, exposed to shaders in Godot 4.5, for atlas-correct UVs.
- Godot settings, from [ProjectSettings.xml](https://github.com/godotengine/godot/blob/master/doc/classes/ProjectSettings.xml):
  - `snap_2d_transforms_to_pixel` rounds CanvasItem positions. It is read only at startup and can be toggled at runtime through `RenderingServer.viewport_set_snap_2d_transforms_to_pixel`.
  - `snap_2d_vertices_to_pixel` snaps final vertex positions.
  - The docs advise against enabling both, and prefer transform snapping alone.

### Inferences
- Vertex shear in `vertex()` changes the final vertex position, so it is subject to vertex snapping. Transform snapping alone will not snap a shader shear. A sheared quad samples texels at fractional positions, which is the smear. Quantize inside the shader instead: `offset_px = round(amp * f(height_row, t))`, then shift UV by `offset_px * TEXTURE_PIXEL_SIZE.x`.
- Padding: a tuft swaying ±2 px needs 2 transparent columns on each side of the sprite, or a vertex expand of 2 px.
- In a 320x180 SubViewport upscaled by an integer factor, world-locked whole-pixel sway is cheap and crisp. In a high-res viewport with a scaled camera, "whole pixel" must mean whole art pixel, so divide by the zoom.

### Gaps
- No measured cost comparison between fragment UV-shift sway and vertex shear in Compatibility.

---

## Q6. Godot 4 runtime limits that matter for thousands of tufts on web

### Takeaway
Use one material and one atlas for all tufts. Use MultiMeshInstance2D or a few large nodes rather than thousands of Sprite2D nodes. Set `TIME` rollover low and make sway frequencies divide it evenly. Treat 2D instance uniforms as a convenience, not a batching tool.

### Cited findings
- Compatibility (WebGL2/GLES3) batches 2D draws. Vulkan renderers do not batch 2D, because draw calls are cheaper there ([GPU optimization docs 4.3](https://docs.godotengine.org/de/4.3/_sources/tutorials/performance/gpu_optimization.rst.txt)).
- `rendering/gl_compatibility/item_buffer_size = 16384`. That is the maximum canvas item commands per viewport update, and "If more render commands are issued they will be ignored" ([ProjectSettings.xml](https://github.com/godotengine/godot/blob/master/doc/classes/ProjectSettings.xml)). `rendering/2d/batching/item_buffer_size = 16384` is the maximum commands per batched draw call.
- `rendering/limits/time/time_rollover_secs` defaults to 3600. For mobile the docs recommend values below 64, ideally below 32, because of shader float precision ([same](https://github.com/godotengine/godot/blob/master/doc/classes/ProjectSettings.xml)).
- CanvasItem shaders expose `INSTANCE_CUSTOM` (vec4) and `INSTANCE_ID` for instancing. `TIME` is affected by `time_scale` but not by pause ([canvas_item shader docs](https://docs.godotengine.org/en/stable/tutorials/shaders/shader_reference/canvas_item_shader.html)).
- Per-instance uniforms for `canvas_item` shaders arrived in Godot 4.4 ([godot-docs PR #10737](https://github.com/godotengine/godot-docs/pull/10737)). Instance uniforms have up to 16 slots, indices 0 to 15 ([Godot 4.0 article](https://godotengine.org/article/godot-40-gets-global-and-instance-shader-uniforms)). A 4.5 user reports WebGL trouble with instance uniforms on objects sharing one ShaderMaterial, and fixed it by making the material local ([forum](https://forum.godotengine.org/t/shader-not-working-on-all-sprites-in-web-export/125093)).
- MultiMeshInstance2D grass:
  - Rows of MultiMeshInstance2D, each row's z_index set from its y as a y-sort substitute, gave 1100 FPS on an RX 5700. The author says "number of rows" limits performance. Developer-reported, no resolution or count given ([markolainen, itch](https://markolainen.itch.io/godot-2d-multimeshinstance2d-swaying-grass)).
  - A forum user reports at least 30,000 meshes per frame at 80 FPS on their device. Anecdotal ([forum](https://forum.godotengine.org/t/how-do-i-make-an-optimized-grass-field-in-godot-4/133384)).
  - One MultiMesh cannot use a different texture per instance, so variants must share an atlas (same thread).
- 2Retr0/GodotGrass (3D, Tsushima-inspired) uses MultiMeshInstance with CPU-placed blades and tile LOD, and no compute shader. It reports noticeable tile swaps ([GitHub](https://github.com/2Retr0/GodotGrass)).

### Inferences
- Mixing tall grass with walkers needs y-sort. A single MultiMesh is one canvas item at one depth, so it cannot interleave with a character. The rows trick gives one MultiMesh per tile row. At 32 px tiles in a 180 px view, that is about 7 to 8 rows visible, so about 8 draw calls for all visible tufts. Low ground grass that never covers characters can be one MultiMesh, or simply part of the tilemap.
- `INSTANCE_CUSTOM` is the place for per-tuft phase, stiffness and atlas frame. That avoids instance uniforms and keeps one material.
- Seamless rollover: set `time_rollover_secs = 32` and pick sway periods that divide 32 s evenly (2, 4, 8 s, or frequencies k/32 Hz). This is the Luanti integer-frequency trick (Q3). Better still, pass a global `wind_time` uniform from GDScript that the server weather state can also drive.
- Budget sketch for a 320x180 Asterion view: 10x6 tiles is 60 visible tiles. At 4 tufts per tile, like Stardew, that is about 240 tufts. That is tiny for any approach. Even plain Sprite2D nodes stay far under the 16,384-command cap. The real cost risks on web are overdraw from tall alpha sprites and per-frame GDScript loops, not draw calls.

### Gaps
- No measured Compatibility/WebGL ms for MultiMeshInstance2D vs Sprite2D vs TileMap animated tiles. That needs our own benchmark, see the demos step.
- Whether 2D instance uniforms break batching in Compatibility was not confirmed. The engine PR number cited by the docs PR (#96922) resolves to an unrelated GridMap PR, so the docs link is the only source.

---

## Q7. Synthesis for Asterion (all inference)

1. Wind state is a server global `{dir (8-way or angle), strength 0..1, gust_seed}`. Clients derive everything else (Fog study wind field).
2. Base sway is a Terraria-style cosine with phase `dot(tile_pos, wind_dir) * k`, so crests travel downwind. Speed ranges from about 60 px/s (calm) to 300 px/s (storm), with a period of 3 s down to 0.6 s. A threshold gate keeps calm days still.
3. Gusts multiply amplitude by a scrolling low-res noise (for example 64x64, sampled at world/8), so a bright band crosses the field. Global direction only, no per-tuft noise direction.
4. Render as whole-pixel row offsets: 0 px at the root rows, ±1 px in the middle, ±2 px at the tip. Quantize in the fragment shader or with Forest D1 bands. Never rotate the sprite.
5. Trample uses a Terraria WindGrid per visible tile: a timestamp plus a direction, set by every moving entity (players and NPCs from server positions), with a decay of 1 to 3 s instead of Terraria's 0.33 s. That costs 12 bytes per visible tile and zero network bytes.
6. Tufts sleep when wind is under the gate and nothing touched them (the Stardew `NeedsUpdate` idea). On a shader path, sleeping is free anyway.
7. Variation comes from a per-tuft hash of world coords for phase and stiffness (`1/(r+1)` style, 50 to 100%), which needs no storage (Jarl).

---

## Sources
- Terraria 1.4.4.1 decompiled TileDrawing.cs: https://github.com/br4dnblehh/terraria-source-code/blob/main/1.4.4.1/Terraria.GameContent.Drawing/TileDrawing.cs
- Terraria 1.4.4.1 decompiled WindGrid.cs: https://github.com/br4dnblehh/terraria-source-code/blob/main/1.4.4.1/Terraria.GameContent.Drawing/WindGrid.cs
- tModLoader TileDrawing patch: https://github.com/tModLoader/tModLoader/blob/1.4.4/patches/tModLoader/Terraria/GameContent/Drawing/TileDrawing.cs.patch
- Terraria wind (see it in action): https://terraria.wiki.gg/wiki/Wind
- Stardew 1.6 decompiled Grass.cs: https://github.com/AcidicNic/StardewValleyDecompiled1.6/blob/main/StardewValley.TerrainFeatures/Grass.cs
- Stardew wiki Grass (API): https://stardewvalleywiki.com/mediawiki/api.php?action=parse&page=Grass&prop=wikitext&format=json
- Luanti node vertex shader: https://github.com/luanti-org/luanti/blob/master/client/shaders/nodes_shader/opengl_vertex.glsl
- Luanti game.cpp (animationTimer): https://github.com/luanti-org/luanti/blob/master/src/client/game.cpp
- GPU Gems 1 ch. 7: https://developer.nvidia.com/gpugems/gpugems/part-i-natural-effects/chapter-7-rendering-countless-blades-waving-grass
- GDC Vault, Procedural Grass in Ghost of Tsushima: https://gdcvault.com/play/1027214/Advanced-Graphics-Summit-Procedural-Grass
- Ghost of Tsushima wind (Rockenbeck): https://gamedeveloper.com/design/using-vorticles-to-simulate-wind-in-i-ghost-of-tsushima-i-
- Unity Grass recreation (Cain Rademan): https://cainrademan.github.io/Unity-Grass/
- Stylized Station thread: https://threadreaderapp.com/thread/1688939411575119872
- Tsushima talk summary: https://gist.ly/youtube-summarizer/procedural-grass-systems-in-ghost-of-tsushima-achieving-art-direction
- Grass notes page: https://publish.obsidian.md/xybre/3.+Reference/Creative/Development/Gamedev/Visuals/Shaders+-+Grass+and+Foliage
- 2Retr0 GodotGrass: https://github.com/2Retr0/GodotGrass
- Age of Calamity grass: https://nintendolife.com/news/2022/01/hyrule-warriors-age-of-calamitys-development-was-a-real-pain-in-the-grass
- Hexaquo grass part 3: https://hexaquo.at/pages/grass-rendering-series-part-3-animating-and-interacting-with-grass-in-godot/
- Jarl 2D grass (80.lv): https://80.lv/articles/building-procedural-2d-grass-with-gpu-compute
- Elahee grass deck: https://docs.google.com/presentation/d/1ZakYwCSAM7fUcupVSY_j0Dv8j5ScoZeCkPy5XHmFvZ0/htmlpresent
- Eastward art interview: https://www.gamedeveloper.com/art/eastward-s-creators-share-insights-on-making-pixel-art-adventures
- Wind with pixel snapping shader: https://godotshaders.com/shader/wind-with-pixel-snapping/
- 2D pixel perfect wind & sway shader: https://godotshaders.com/shader/2d-pixel-perfect-wind-sway-effect/
- Godot ProjectSettings.xml: https://github.com/godotengine/godot/blob/master/doc/classes/ProjectSettings.xml
- Godot GPU optimization 4.3: https://docs.godotengine.org/de/4.3/_sources/tutorials/performance/gpu_optimization.rst.txt
- Godot canvas_item shader reference: https://docs.godotengine.org/en/stable/tutorials/shaders/shader_reference/canvas_item_shader.html
- godot-docs PR #10737: https://github.com/godotengine/godot-docs/pull/10737
- Godot 4.0 instance uniforms article: https://godotengine.org/article/godot-40-gets-global-and-instance-shader-uniforms
- Instance uniform WebGL forum thread: https://forum.godotengine.org/t/shader-not-working-on-all-sprites-in-web-export/125093
- MultiMeshInstance2D swaying grass: https://markolainen.itch.io/godot-2d-multimeshinstance2d-swaying-grass
- Optimized grass field forum thread: https://forum.godotengine.org/t/how-do-i-make-an-optimized-grass-field-in-godot-4/133384
