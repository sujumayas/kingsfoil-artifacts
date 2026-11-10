# 07. Gems: open-source code and tools for 2D fog, clouds and fog of war

Researcher angle: field-validated open-source code we can reuse or study. All licence checks done on 2026-11-10 by reading the LICENSE file through the GitHub API or the page footer. Star counts and last-push dates are from the GitHub API on the same day.

Licence flags used below: Low (MIT/BSD/Apache/CC0), LGPL, Copyleft (GPL/AGPL/CC BY-SA), None (no licence = all rights reserved), NC (non-commercial).

## Quick table

| Gem | Licence (flag) | Maturity | Saves us | Godot 4 Compat/web |
|---|---|---|---|---|
| GDQuest `clouds2D.gdshader` | MIT code, assets CC BY-NC-SA 4.0 (Low for code, NC for art) | 4,199★, release 1.0.0 2024-09-15 | Cloud shadow overlay in 25 lines | Likely yes (plain canvas_item, 3 fetches) |
| FastNoiseLite | MIT (Low) | 3,553★, v1.1.1 2024-03-05, built into Godot | Seamless noise textures with no addon | Yes, built in |
| Christoph Peters blue noise textures | CC0 (Low) | Widely cited since 2016 | Ready-made dither textures 16² to 1024² | Yes (just PNGs) |
| TABmk/godot-4-fog-of-war | MIT (Low) | 14★, last push 2023-12-09, no releases | Image-based explored mask, ~60 lines | Probably, but CPU upload cost |
| 87PizzaStudios/godot_light_fow | MIT (Low) | 18★, last push 2023-08-01 | FOW from PointLight2D + occluders | Risky (relies on 2D lights + SubViewport) |
| AntonWedemeier/Godot-FogOfWar | None | 24★, Godot 3.0.6, 2020 | Study only | Godot 3 |
| matt-kimball/godot-mrpas | MIT (Low) | 32★, live web demo on itch.io | GDScript grid FOV, drop-in | Yes (pure GDScript, web demo exists) |
| godotshaders.com fog/cloud/ray shaders | Mostly CC0, some MIT (Low) | Page dates 2021 to 2026 | Overlay fog, clouds, god rays, hex FOW | Mostly yes, a few need Godot 3 port |
| OpenRA shroud | GPL-3.0 (Copyleft, study only) | 17,766★, active 2026-11-08 | Proven cell-state + edge-tile rules | n/a |
| 0 A.D. LOSTexture.cpp | GPL-2.0+ (Copyleft, study only) | 2,827★, GitHub mirror archived 2024 | Proven 3-level mask + 7-tap blur | n/a |
| Recoil/Spring LOS info texture | GPL (Copyleft, study only) | 733★, release 2026.09.02 | R8 LOS texture per frame | n/a |
| libtcod | BSD-3-Clause (Low) | 1,241★, release 2.3.1 2026-11-10 | Many FOV algorithms in C | Not Godot; reference |
| rot.js | BSD-3-Clause (Low) | 2,729★, last push 2024-11-13 | JS FOV for web prototypes | Web yes; not Godot |
| bracket-lib + Rust roguelike tutorial | MIT (Low) | 1,698★, 0.8.7 2022-10-05 | Clear revealed/visible memory pattern | Reference |
| Phaser RenderTexture erase examples | Phaser is MIT (Low); example code licence not checked | Official examples | Web fog-of-war erase pattern | Web reference |
| Shadertoy fog/cloud shaders | Default CC BY-NC-SA 3.0 unless stated (NC + Copyleft) | Huge catalogue | Ideas only | Do not paste |

---

## Q1. Which Godot 4 2D fog and cloud shaders are worth taking, and under what licence?

### Takeaway
godotshaders.com has a solid, mostly CC0 set of 2D fog, cloud-shadow and god-ray shaders. The best pick for cloud shadows is GDQuest's `clouds2D.gdshader` (MIT code). It does two scrolling noise reads, a small domain-warp offset and a gradient lookup, multiplied over the scene. For ground fog, the CC0 "2D Fog Overlay" fBm shader is the common base. Every godotshaders page states its licence in the footer. Read it per page, because CC0 and MIT both appear.

### Cited findings
- GDQuest godot-shaders repo, 4,199★, release 1.0.0 on 2024-09-15, last push 2026-05-16. LICENSE says code, scenes and shaders are MIT. Art assets are CC-BY-NC-SA 4.0. https://github.com/gdquest-demos/godot-shaders/blob/main/LICENSE
- `godot/Shaders/clouds2D.gdshader` uses `render_mode blend_mul`. It reads noise 2 at `UV * tile_factor_2 + dir2 * TIME * time_scale_2`, then reads noise 1 offset by `noise_2 * 0.02`, then maps through a gradient texture and mixes white to tint. https://github.com/gdquest-demos/godot-shaders/blob/main/godot/Shaders/clouds2D.gdshader
- Demo parameters in `Clouds2DDemo.tscn`: tint alpha 0.54 blue, scroll_direction_1 (0.7, -0.7), time_scale_1 0.01, tile_factor_1 0.235, scroll_direction_2 (0.75, 0.25), time_scale_2 0.005, tile_factor_2 0.3. https://github.com/gdquest-demos/godot-shaders/blob/main/godot/Demos/Clouds2DDemo.tscn
- Its noise is a `NoiseTexture2D` with FastNoiseLite, width 1024, `seamless = true`. https://github.com/gdquest-demos/godot-shaders/blob/main/godot/Demos/Clouds2D/clouds_noise1.tres
- "2D Fog Overlay" by blinks, 2021-07-06, CC0. fBm loop with `uniform int octaves = 4`, starting amplitude 0.5, `shift` -0.2 toward transparency, `velocity` (1,1). It uses Godot 3 hints (`hint_color`), so it needs a small port. https://godotshaders.com/shader/2d-fog-overlay/
- "2D fog overlay" by HexagonNico, CC0, tagged top down. Suggested placement in ParallaxBackground > ParallaxLayer > ColorRect. https://godotshaders.com/shader/2d-fog-overlay-2/
- "Animated 2D Fog (Optional Pixelation)" by Tennisson, 2024-05-18, MIT, Godot 4. `OCTAVES = 4`, `pixelation_amount = 150`, a `fog_mask` grayscale texture for density. Author credits Gonkee's Godot 3 fog shader and says ChatGPT helped combine it. Gonkee's original repo link now returns 404 from the GitHub API, so the upstream licence could not be checked. https://godotshaders.com/shader/procedural-2d-fog-with-pixelation/
- "TopDown Game 2D Cloud shader" by Jams, 2024-09-07, CC0. One noise read with `filter_nearest`, `density` 0.25, `speed` (0.02, 0.01). https://godotshaders.com/?p=8368
- "Animated Camera Fog Overlay" (Big Boy Games), CC0, worldspace or camera attached. https://godotshaders.com/?p=10895
- "Screen Smoke/Fog", CC0, ColorRect plus noise texture. https://godotshaders.com/?p=12796
- "Fog Shader" (moving camera, world-fixed fog), CC0, Godot 3 code. https://godotshaders.com/shader/fog-shader/
- "Cloud Cast Shadow Shader 2d" by kiri, 2025-06-28, CC0. Re-reads the sprite's own texture at an offset to draw a cast shadow, 25 lines. https://godotshaders.com/shader/cloud-cast-shadow-shader-2d/
- "Animated Grassy Wind or Cloud Shadow Pixel Patches Overlay" by thatisuday, 2026-01-04, CC0. Uniforms include `wind_speed` 100 px/s, `patch_width_px` 300, `patch_height_px` 10, `pixel_size_px` 1 to 64, `threshold` 0.6, `opacity` 0.1. https://godotshaders.com/shader/animated-grassy-wind-or-cloud-shadow-pixel-patches-overlay/
- "Pixel Art Cartoon Clouds (circle clusters)" by tripod, 2026-10-16, CC0. Palette texture read with `texelFetch`, `num_colors` 4, optional dither and outline. https://godotshaders.com/shader/pixel-art-cartoon-clouds-circle-clusters/
- "God rays" by pend00, 2021-01-27, CC0. Two ray layers, `angle` -0.3, `position` -0.2, `spread` 0.5, screen blend. https://godotshaders.com/shader/god-rays/
- "Pixelated God Rays" by MohdSalmi, 2025-06-26, CC0. `pixelation` 8, `color_levels` 4, optional dither. https://godotshaders.com/shader/pixelated-god-rays/
- "Pixelated God Rays 2" by Leo Volcano, 2025-06-30, CC0. Replaces procedural noise with a seamless noise texture to remove a visible seam. https://godotshaders.com/shader/pixelated-god-rays-2/
- "Canvas Godray Edge Detection" by Mechanical Hands, 2026-04-28, CC0. Screen-texture ray march with `ray_samples` 8 to 128, default 64, inside a CanvasGroup. https://godotshaders.com/shader/canvas-godray-edge-detection/

### Inferences
- clouds2D costs 3 texture fetches per covered pixel (2 noise, 1 gradient). At 320x180 that is about 173k fetches per frame. That is cheap even on WebGL2 mobile. Estimate.
- The fBm overlays do one fetch per octave, so 4 octaves = 4 fetches per pixel. Still cheap at 320x180. Estimate.
- "Canvas Godray Edge Detection" at 64 samples is 64 screen-texture reads per pixel. That is pretty-but-expensive for web. Pre-drawn shafts (pend00 style, procedural, no screen read) are the cheaper option.
- For pixel art, the Jams cloud shader's `filter_nearest` and thatisuday's `pixel_size_px` snap fit the 320x180 look better than the smooth fBm ones.

### Gaps
- No godotshaders page reports measured ms. Like counts not collected.
- Compatibility renderer support not confirmed per shader. None of these use compute or 3D features, so they should run.

---

## Q2. Which Godot fog-of-war plugins or demos are field-validated?

### Takeaway
No Godot fog-of-war repo has strong maturity. The best stars are in the teens and twenties. They are small, readable references, not dependencies. Three patterns show up. Image + `blend_rect` (TABmk, from HeartBeast's tutorial). Light-based mask in a SubViewport (87PizzaStudios). Shader with a mask texture (hex tilemap CC0 shader). For our tile grid, a 1-texel-per-tile mask plus a shader is the cleanest. The newer `DrawableTexture2D` (study #5) can replace the CPU `Image` path.

### Cited findings
- TABmk/godot-4-fog-of-war. MIT, "Copyright (c) 2023 TAB_mk". 14★, created 2023-12-08, last push 2023-12-09, no releases. Port of HeartBeast's tutorial with debounce and caching. https://github.com/TABmk/godot-4-fog-of-war
- Its `game.gd` creates a `fogWidth x fogHeight` (default 1000x1000) RGBA8 `Image`, fills black, then on movement calls `fogImage.blend_rect(lightImage, ...)` with a 300x300 light image and `fogTexture.update(fogImage)`. Debounce default 0.01 s. https://github.com/TABmk/godot-4-fog-of-war/blob/master/game.gd
- Upstream uheartbeast/godot-fow-tutorial. MIT, 24★, last push 2021-01-22. https://github.com/uheartbeast/godot-fow-tutorial
- 87PizzaStudios/godot_light_fow. MIT, LICENSE reads "Copyright (c) 2020 Heartbeast Studios". 18★, last push 2023-08-01. Duplicates PointLight2D and LightOccluder2D into an unrendered SubViewport, a shader builds the alpha mask, `Fow Scale Factor` downsizes the viewport, `Persistent Reveal` keeps explored areas. README warns the mask "can hurt performance in high-resolution scenes". https://github.com/87PizzaStudios/godot_light_fow
- AntonWedemeier/Godot-FogOfWar. No licence file. 24★, tested on Godot 3.0.6, last push 2020-04-05. Feeds a viewport texture back into itself each frame and paints a gradient brush. https://github.com/AntonWedemeier/Godot-FogOfWar
- jeroendenhaan/godot-fog-of-war. GPL-3.0, 11★, 2021. https://github.com/jeroendenhaan/godot-fog-of-war
- "Hexagon Tilemap Fog of War" by bloodyaugust, 2024-05-09, CC0, Godot 4. `uniform sampler2D visibility_mask : filter_nearest` plus `visibility_mask_size`. Author says to regenerate the mask in code when vision changes. https://godotshaders.com/shader/hexagon-tilemap-fog-of-war/
- "Basic Fog of War Shader" by General Goods and Services, 2025-07-22, MIT. Uses `uniform vec2 points[500]` and a distance threshold, reading SCREEN_TEXTURE. https://godotshaders.com/shader/basic-fog-of-war-shader/
- "2D Retro Dithered Lighting + Fog of War" by nachomakesgames, 2026-06-23, MIT. GDScript manager with `MAX_LIGHTS` 48 and `MAX_OBSTRUCTORS` 24, nodes registered by group. https://godotshaders.com/shader/2d-retro-dithered-lighting-fog-of-war/
- matt-kimball/godot-mrpas. MIT text, "Copyright 2022 Matt Kimball". 32★, last push 2023-03-10, live web build on itch.io. Drop-in `mrpas.gd`. An Asset Library version exists (20★, MIT). https://github.com/matt-kimball/godot-mrpas , https://mkimball.itch.io/godot-mrpas-demo
- `DrawableTexture2D` is in Godot master: "A 2D texture that supports drawing to itself via Blit calls". `blit_rect` is marked experimental. First commit "DrawableTextures" dated 2025-02-09. https://github.com/godotengine/godot/blob/master/doc/classes/DrawableTexture2D.xml
- A code search finds the drawable texture code in `drivers/gles3/storage/texture_storage.cpp`, so the Compatibility renderer has a code path. https://github.com/godotengine/godot/tree/master/drivers/gles3/storage

### Inferences
- TABmk's default path uploads a full 1000x1000 RGBA8 texture each update, which is 4,000,000 bytes per call. At a 0.01 s debounce while moving that can be 400 MB/s of uploads. That is a trap on web. Arithmetic estimate. Fix it by sizing the mask to tiles (a 256x256 tile map is a 64 KB L8 mask) and scaling it up in the shader.
- The 500-point uniform array in "Basic Fog of War Shader" loops up to 500 times per pixel. 500 vec2 uniforms may also exceed the fragment uniform budget on some WebGL2 devices (GLES 3.0 minimum is 224 vec4 from memory, not verified here). Avoid for web.
- 87PizzaStudios depends on 2D lights. Our context says Compatibility has limited 2D lights, so test before use.
- godot-mrpas is the most directly reusable piece for a server-authoritative grid. The same algorithm can run on the server to decide what each client may see.

### Gaps
- No shipped commercial game found that credits any of these Godot repos.
- No measured ms for any of them. GDQuest has no fog-of-war repo (searched gdquest-demos and gdquest orgs).

---

## Q3. What do the big open-source RTS engines do for fog of war (study only)?

### Takeaway
All three engines keep a coarse per-cell visibility grid on the CPU and turn it into something smooth only at render time. OpenRA keeps reference counts per cell and draws edge sprites chosen by a neighbour bitmask (the C&C and Red Alert look). 0 A.D. writes 0/127/255 per LOS vertex, blurs with a 7-tap binomial filter and uploads a texture. Recoil uploads an R8 LOS texture. These are GPL, so we copy ideas, not code.

### Cited findings
- OpenRA, GPL-3.0, 17,766★, last push 2026-11-08. `Shroud.cs` defines `CellVisibility { Hidden = 0x0, Explored = 0x1, Visible = 0x2 }`. It stores `ProjectedCellLayer<short>` counters `visibleCount`, `passiveVisibleCount` and `generatedShroudCount`, a `bool explored` layer, a `touched` dirty layer and a cached `resolvedType` per cell. A comment says Visible is not a superset of Explored. https://github.com/OpenRA/OpenRA/blob/bleed/OpenRA.Game/Traits/Player/Shroud.cs
- `ShroudRenderer.cs` uses an `Edges` byte with 4 corner bits (0x01 to 0x08) and 4 side bits (0x10 to 0x80). Default sprite `Index = [12, 9, 8, 3, 1, 6, 4, 2, 13, 11, 7, 14]`, with an extended mode using all 8 bits. Random cosmetic variants per cell. https://github.com/OpenRA/OpenRA/blob/bleed/OpenRA.Mods.Common/Traits/World/ShroudRenderer.cs
- 0 A.D. `LOSTexture.cpp`, GPL-2.0-or-later, Copyright 2023 Wildfire Games. One value per LOS vertex, visible written as 255 and explored as 127. "7-tap Binomial filter" blur (`g_BlurSize = 7`), done in place using (N-1)/2 padding. An optional SmoothLOS shader interpolates between two textures over time. https://github.com/0ad/0ad/blob/master/source/graphics/LOSTexture.cpp
- The 0ad/0ad GitHub repo is archived (last push 2024-08-17). https://github.com/0ad/0ad
- Recoil (Spring successor), GPL, 733★, release 2026.09.02 on 2026-10-27. `Los.cpp` makes a `GL_R8` texture sized to `losHandler->los.size`, with a `GL_R16` upload texture. https://github.com/beyond-all-reason/RecoilEngine/blob/master/rts/Rendering/Map/InfoTexture/Modern/Los.cpp
- openage, GPL-3.0+ per `copying.md`, 14,597★, v0.6.0 2024-11-26. https://github.com/SFTtech/openage
- Stratagus (Warcraft II engine), GPL-2.0, 747★, active 2026-11-09. https://github.com/Wargus/stratagus

### Inferences
- OpenRA's per-cell counters are the right model for many units and team vision. Each unit adds +1 on reveal and -1 on leave, so moving a unit only touches cells at the rim. No full-map rebuild.
- 0 A.D.'s 0/127/255 L8 mask plus blur maps straight onto Godot. Write a tile-sized L8 image, blur in the shader or by linear filtering, and threshold with a Bayer matrix for a pixel-art edge (link study #1 dithering).
- OpenRA's 12 or 47 edge-sprite approach is the "hand-drawn edge" alternative to blur. It is the most pixel-art friendly and costs nothing on the GPU beyond tile draws.

### Gaps
- Did not read Stratagus or openage fog code. No measured per-update times from any engine.

---

## Q4. Which roguelike libraries give FOV plus memory, and what pattern do they use?

### Takeaway
All mature roguelike libraries have permissive licences and split the job into a FOV pass (per turn) and a memory array (explored bools). Remembered tiles are drawn dim or greyscale. For Godot, port the pattern and use godot-mrpas or study #5's shadowcasting. Do not depend on these libraries.

### Cited findings
- libtcod, BSD-3-Clause, "Copyright © 2008-2026, Jice and the libtcod contributors". 1,241★, release 2.3.1 on 2026-11-10. https://github.com/libtcod/libtcod/blob/main/LICENSE.txt
- rot.js, BSD-3-Clause style licence, "Copyright (c) 2012-now(), Ondrej Zara". 2,729★, last push 2024-11-13, last tagged release v0.5.0 (2014). FOV modules `discrete-shadowcasting.ts`, `precise-shadowcasting.ts`, `recursive-shadowcasting.ts`. https://github.com/ondras/rot.js/tree/master/src/fov
- bracket-lib, MIT, "Copyright 2019 Herbert Wolverson". 1,698★, release 0.8.7 on 2022-10-05, last push 2025-12-05. https://github.com/amethyst/bracket-lib
- The bracket-lib Rust roguelike tutorial keeps `revealed_tiles: Vec<bool>` (stays true forever) and `visible_tiles: Vec<bool>` (cleared each recompute). It skips unrevealed tiles and draws revealed-but-not-visible tiles with `fg.to_greyscale()`. A `dirty` flag limits recalculation. https://bfnightly.bracketproductions.com/chapter_5.html

### Inferences
- Memory costs 1 bit or 1 byte per tile. A 1024x1024 tile world is 1 MB as bytes or 128 KB as bits. Arithmetic.
- The dirty flag is the main cost lever. Recompute FOV only when the viewer moves or a door opens.
- Greyscale for memory works for ASCII. For a palette-limited pixel game, a palette shift toward a cool dark ramp (study #1 palette lighting) is the better match.

### Gaps
- Did not collect a list of shipped games per library. No FOV benchmarks fetched.

---

## Q5. Noise and dither assets

### Takeaway
Use Godot's built-in FastNoiseLite through `NoiseTexture2D` with `seamless = true` for all fog and cloud noise. Bake it once, then scroll it. Use Christoph Peters' CC0 blue noise for dithered fog edges when Bayer looks too regular.

### Cited findings
- FastNoiseLite, MIT, "Copyright(c) 2020 Jordan Peck". 3,553★, v1.1.1 on 2024-03-05, last push 2026-10-17. https://github.com/Auburn/FastNoiseLite
- Godot vendors FastNoiseLite version 1.1.0 (2023), licence MIT, with one patch. https://github.com/godotengine/godot/blob/master/thirdparty/README.md
- Moments in Graphics blue noise (Christoph Peters), posted 2016-12-22. Sizes 16² to 1024², 1 to 4 channels, 8-bit RGBA PNG and 16-bit PNG. 512² and 1024² have no 16-bit version. Author placed them in the public domain via CC0. Download "FreeBlueNoiseTextures.zip". https://momentsingraphics.de/BlueNoise.html

### Inferences
- A 64x64 blue noise tile is 4 KB as L8 and tiles across 320x180 about 15 times. Arithmetic.
- Generating noise at runtime in a shader (procedural fBm) costs ALU every frame. A baked seamless 256² texture costs one fetch. Prefer baked on web.

### Gaps
- No measured comparison of baked vs procedural noise in Godot Compatibility.

---

## Q6. Web-engine references (Phaser, PixiJS, Shadertoy)

### Takeaway
Phaser's official examples show the standard web fog-of-war trick: a RenderTexture filled with fog and `erase()` a brush at the player each frame. It maps one-to-one onto a Godot SubViewport or DrawableTexture2D. Shadertoy code is NC + ShareAlike by default, so treat it as reading material only.

### Cited findings
- Phaser example 3215 erases a RenderTexture around the player and offsets by camera scroll. https://phaser.io/examples-show/3215
- Phaser example 560 erases a brush on pointer down with `rt.erase(brush, x - 16, y - 16)`. https://editor.phaser.io/examples-show/560
- Phaser news, reveal effect with ERASE blend mode (2020). https://www.phaser.io/news/2020/08/simple-reveal-effect-in-phaser-3
- Phaser RenderTexture docs. https://docs.phaser.io/phaser/concepts/gameobjects/render-texture
- jarv/hex-map-demo, MIT, 0★, "Hex map fog-of-war demo built with Phaser 4", 2026-09-30. Too new to call field-validated. https://github.com/jarv/hex-map-demo
- Shadertoy terms page returned HTTP 403. Forum users say Shadertoy shaders are non-commercial by default. https://magicmusicvisuals.com/forums/viewtopic.php?p=9445 . Licence text: https://creativecommons.org/licenses/by-nc-sa/3.0/

### Inferences
- Shadertoy default (per the study brief and forum) is CC BY-NC-SA 3.0. A commercial game cannot ship that code unless the author states another licence.
- No PixiJS fog-of-war example of note turned up. GitHub search for "pixi fog of war" returned nothing.

### Gaps
- Phaser example code licence not checked per example. Did not open labs.phaser.io.
- Unity open-source pixel fog: not searched in depth. Nothing found that beats the Godot options.

---

## Recommended picks for Kingsfoil

1. Cloud shadows: port GDQuest `clouds2D.gdshader` (MIT), swap the gradient for a 2 to 3 colour palette ramp, snap UV to the 320x180 pixel grid. 3 fetches per pixel.
2. Ground fog: CC0 "2D Fog Overlay" fBm with 2 to 3 octaves from one baked seamless FastNoiseLite texture, plus a mask texture for density (idea from Tennisson's MIT version).
3. Fog of war: OpenRA-style per-tile counters on the server, a 1-byte-per-tile mask (0/127/255 like 0 A.D.) uploaded only for changed rows, a shader that upsamples and Bayer or blue-noise dithers the edge. FOV from godot-mrpas (MIT) or study #5.
4. God rays: pend00's CC0 procedural shader or the pixelated CC0 variants. Avoid 64-sample screen ray marches on web.
5. Avoid as dependencies: anything with no licence (AntonWedemeier), GPL (jeroendenhaan, OpenRA, 0 A.D., Recoil), Shadertoy defaults, GDQuest art assets (NC).

## Sources
- https://github.com/gdquest-demos/godot-shaders/blob/main/LICENSE
- https://github.com/gdquest-demos/godot-shaders/blob/main/godot/Shaders/clouds2D.gdshader
- https://github.com/gdquest-demos/godot-shaders/blob/main/godot/Demos/Clouds2DDemo.tscn
- https://github.com/gdquest-demos/godot-shaders/blob/main/godot/Demos/Clouds2D/clouds_noise1.tres
- https://godotshaders.com/shader/2d-fog-overlay/
- https://godotshaders.com/shader/2d-fog-overlay-2/
- https://godotshaders.com/shader/procedural-2d-fog-with-pixelation/
- https://godotshaders.com/?p=8368
- https://godotshaders.com/?p=10895
- https://godotshaders.com/?p=12796
- https://godotshaders.com/shader/fog-shader/
- https://godotshaders.com/shader/cloud-cast-shadow-shader-2d/
- https://godotshaders.com/shader/animated-grassy-wind-or-cloud-shadow-pixel-patches-overlay/
- https://godotshaders.com/shader/pixel-art-cartoon-clouds-circle-clusters/
- https://godotshaders.com/shader/god-rays/
- https://godotshaders.com/shader/pixelated-god-rays/
- https://godotshaders.com/shader/pixelated-god-rays-2/
- https://godotshaders.com/shader/canvas-godray-edge-detection/
- https://godotshaders.com/shader/hexagon-tilemap-fog-of-war/
- https://godotshaders.com/shader/basic-fog-of-war-shader/
- https://godotshaders.com/shader/2d-retro-dithered-lighting-fog-of-war/
- https://github.com/TABmk/godot-4-fog-of-war
- https://github.com/uheartbeast/godot-fow-tutorial
- https://github.com/87PizzaStudios/godot_light_fow
- https://github.com/AntonWedemeier/Godot-FogOfWar
- https://github.com/jeroendenhaan/godot-fog-of-war
- https://github.com/matt-kimball/godot-mrpas
- https://mkimball.itch.io/godot-mrpas-demo
- https://github.com/godotengine/godot/blob/master/doc/classes/DrawableTexture2D.xml
- https://github.com/godotengine/godot/blob/master/thirdparty/README.md
- https://github.com/OpenRA/OpenRA/blob/bleed/OpenRA.Game/Traits/Player/Shroud.cs
- https://github.com/OpenRA/OpenRA/blob/bleed/OpenRA.Mods.Common/Traits/World/ShroudRenderer.cs
- https://github.com/0ad/0ad/blob/master/source/graphics/LOSTexture.cpp
- https://github.com/beyond-all-reason/RecoilEngine/blob/master/rts/Rendering/Map/InfoTexture/Modern/Los.cpp
- https://github.com/SFTtech/openage
- https://github.com/Wargus/stratagus
- https://github.com/libtcod/libtcod/blob/main/LICENSE.txt
- https://github.com/ondras/rot.js/tree/master/src/fov
- https://github.com/amethyst/bracket-lib
- https://bfnightly.bracketproductions.com/chapter_5.html
- https://github.com/Auburn/FastNoiseLite
- https://momentsingraphics.de/BlueNoise.html
- https://phaser.io/examples-show/3215
- https://editor.phaser.io/examples-show/560
- https://www.phaser.io/news/2020/08/simple-reveal-effect-in-phaser-3
- https://docs.phaser.io/phaser/concepts/gameobjects/render-texture
- https://github.com/jarv/hex-map-demo
- https://magicmusicvisuals.com/forums/viewtopic.php?p=9445
- https://creativecommons.org/licenses/by-nc-sa/3.0/
