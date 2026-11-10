# 07 Gems: open-source code and tools for 2D/pixel water

Researcher angle: field-validated open-source code and tools a small Godot 4 team can drop in. All GitHub numbers were read with the GitHub API on 2026-11-10 (stars, last commit, releases, LICENSE file). Licence flags: Low (MIT/BSD/Apache/CC0/Unlicense), LGPL, Copyleft (GPL/AGPL/CC BY-SA), NC (non-commercial), None (no licence found).

## Summary table

| Gem | Licence (LICENSE read 2026-11-10) | Flag | Maturity | Saves the developer |
|---|---|---|---|---|
| [pablogila/TileMapDual](https://github.com/pablogila/TileMapDual) | MIT, (c) 2024 Pablo Gila-Herranz | Low | 1,310 stars, 60 forks, 12 contributors, plugin v5.0.3, last commit 2026-09-03 | Real-time dual-grid autotiling for shore tiles. 15 tiles instead of 47 |
| [jess-hammer/dual-grid-tilemap-system-godot](https://github.com/jess-hammer/dual-grid-tilemap-system-godot) | MIT, (c) 2024 jess-hammer | Low | 628 stars, last commit 2026-02-09, C# | Small reference implementation of the dual grid (one world layer, display layers offset half a tile) |
| [GlitchedinOrbit/dual-grid-tilemap-system-godot-gdscript](https://github.com/GlitchedinOrbit/dual-grid-tilemap-system-godot-gdscript) | MIT, (c) 2024 GlitchedinOrbit | Low | 223 stars, last push 2024-10-12 | GDScript port of the above (web-exportable) |
| [Portponky/better-terrain](https://github.com/Portponky/better-terrain) | Unlicense | Low | 752 stars, last commit 2026-02-09 (Godot 4.6 fix) | Faster, more predictable terrain painting than Godot's built-in terrain matcher |
| [dandeliondino/terrain-autotiler](https://github.com/dandeliondino/terrain-autotiler) | MIT, (c) 2023 | Low | 68 stars, v0.3.0 (2023-09-14), archived 2024-04-13 | Better 47-tile matching algorithm. Archived, read for ideas only |
| [itsjavi/autotiler](https://github.com/itsjavi/autotiler) | MIT, (c) 2020 itsjavi | Low | 85 stars, release v2.0.1 2026-09-26, web + desktop | Draw a 13-tile template, get the 47-tile blob or 16-tile dual-grid set, plus Godot 4 `.tres` with peering bits and Tiled `.tsx` |
| [kleingeist37/godot-wang-converter](https://github.com/kleingeist37/godot-wang-converter) ("Wang Tile Set Creator") | MIT, (c) 2024 Fatati, Mario | Low | 96 stars, last push 2025-05-11 | 4 base tiles to a full dual-grid set. Linked from TileMapDual README |
| [toku-sa-n/blob-tileset-generator](https://github.com/toku-sa-n/blob-tileset-generator) | BSD-3-Clause, (c) 2022 | Low | 1 star, last commit 2022-05-04 | Blob set generator. Low maturity |
| [Ian-Parberry/wangtiler](https://github.com/Ian-Parberry/wangtiler) | MIT, (c) 2020 Ian Parberry | Low | 2 stars, last commit 2023-06-30 | Wang tiling reference by a textbook author |
| [mapeditor/tiled](https://github.com/mapeditor/tiled) | Editor GPL, libtiled BSD-2 (COPYING file) | Copyleft for editor only. Maps you make are yours | 13,041 stars, v1.12.2 (2026-05-27), last commit 2026-10-24 | Corner/edge/mixed Wang sets and a terrain brush |
| [Kiamo2/YATI](https://github.com/Kiamo2/YATI) | MIT, (c) 2023-2026 Roland Helmerichs | Low | 300 stars, v2.2.10 (2026-10-05) | Imports Tiled maps into Godot 4 |
| [jess-hammer/2d-pixel-water-shader-godot](https://github.com/jess-hammer/2d-pixel-water-shader-godot) | MIT, (c) 2024 jess-hammer | Low | 128 stars, 17 forks, last commit 2025-04-21 | Pixelised noise water plus a cursor/character water-trail shader, Visual Shaders, Godot 4.4 |
| [jess-hammer/2d-pixel-water-shader](https://github.com/jess-hammer/2d-pixel-water-shader) (Unity) | MIT, (c) 2023 | Low | 126 stars, last commit 2024-01-12 | Same look in Unity Shader Graph, made for Tilemaps |
| [christt105/GodotPixelReflectionShader](https://github.com/christt105/GodotPixelReflectionShader) + [godotshaders entry](https://godotshaders.com/shader/sprite-water-reflection-pixel-art/) | Repo MIT (c) 2024. Shader page CC0 | Low | 9 stars, single commit 2024-01-22, Godot 4.2.1. Page from 2023-09-23, 5 comments | Pokemon Gen 3 style flipped-sprite reflection with stepped pixel wobble |
| [godotshaders: Pond Water Shader (2d Top Down)](https://godotshaders.com/shader/pond-water-shader-2d-top-down/) by Arched | CC0 | Low | 2025-08-03, 0 comments | Noise quantised into N colour bands through a GradientTexture1D ramp, pixel-snapped UVs |
| [godotshaders: 2D Pixel Art Water](https://godotshaders.com/shader/2d-pixel-art-water/) by niwho | CC0 | Low | 2025-03-04, 3 comments | Edge foam from a distance-to-edge gradient texture, threshold about 85/255, pulsing with sin(TIME) |
| [godotshaders: Pixel Water for Godot 4.3](https://godotshaders.com/shader/pixel-water/) by BananaBoy | CC0 | Low | 2024-08-21, 1 comment | Two scrolling noises multiplied, smoothstep highlight 0.275 to 0.4, pixelSize 2 |
| [godotshaders: 2D water for topdown games](https://godotshaders.com/shader/2d-water-for-topdown-games/) by Sir-Shroom | CC0 on page, but borrows from two Shadertoys of unstated licence | Low on page, provenance unclear | 2025-07-09, 7 comments | Hashed-point ripples and specular. Heavy (25 + 30 loop iterations per pixel) |
| [godotshaders: Water Caustic](https://godotshaders.com/shader/water-caustic/) port of [Shadertoy MdlXz8](https://www.shadertoy.com/view/MdlXz8) | No licence label. Shadertoy default is CC BY-NC-SA 3.0 | NC + Copyleft | 2022-12-18, 0 comments | Iterated sin/cos caustic, 5 iterations default, tileable |
| [JaccomoLorenz/godot-flow-map-shader](https://github.com/JaccomoLorenz/godot-flow-map-shader) | LICENSE.md, MIT for shader and demo, (c) 2018 | Low | 94 stars, 15 forks, last commit 2020-05-23 (Godot 3 era) | Valve-style two-phase flow map shader to port |
| [Arnklit/Waterways](https://github.com/Arnklit/Waterways) | MIT, (c) 2021 | Low | 1,350 stars, v0.2.1 (2021-01-27), last commit 2022-08-22 | 3D river tool. Useful only as reference for baking flow and foam maps |
| [FlowMap Painter](http://teckartist.com/?page_id=107) by Teck Lee Tan | None stated, free download | None | v0.9.2, Oct 2012, Win/OSX, built in Unity | Paint flow maps by mouse stroke, tiling preview |
| [HackTrout/2DDynamicWater](https://github.com/HackTrout/2DDynamicWater) | MIT, (c) 2021 | Low | 30 stars, last push 2021-01-07 | Side-view spring water for Godot |
| [90-008/dynamic_water_2d](https://github.com/90-008/dynamic_water_2d) / [Asset Library "DynamicWater2D"](https://godotengine.org/asset-library/asset/3246) | MIT, (c) 2024 yusdacra, HackTrout | Low | 4 stars, asset library entry updated 2025-11-28 | Godot 4 addon of the above |
| [evanw/webgl-water](https://github.com/evanw/webgl-water) | No LICENSE file. main.js header "Released under the MIT license", (c) 2011 Evan Wallace | Low (header only) | 1,287 stars, last push 2022-12-31 | Heightfield water plus caustics in WebGL. Reference only, 3D |
| [Orama-Interactive/Pixelorama](https://github.com/Orama-Interactive/Pixelorama) | MIT, (c) 2019-present | Low | 11,051 stars, v1.2.4 (2026-11-03), last commit 2026-11-09 | Free Godot-built pixel editor to animate water tiles |
| [LibreSprite](https://github.com/LibreSprite/LibreSprite) | GPL-2.0 | Copyleft (tool only) | 8,767 stars, last push 2026-10-30 | Free Aseprite fork |
| [taillight-games/godot-4-pixelated-water-shader](https://github.com/taillight-games/godot-4-pixelated-water-shader) | MIT, (c) 2024 BlueHouseSkip | Low | 53 stars, last commit 2026-04-03 | 3D quad with vertex waves and buoyancy. Not 2D. Buoyancy script pattern is reusable |
| [PixelLab Create Tileset](https://www.pixellab.ai/docs/tools/create-tileset) | Commercial service | n/a (vendor) | Docs list Wang, dual-grid 15-tile and 3x3 export | Generates shore transition tilesets from text or textures |

---

## Q1. Which autotiling gems handle the water-to-land shoreline?

### Takeaway
TileMapDual is the clear pick. It is MIT, the most-starred (1,310), still maintained (last commit 2026-09-03) and it cuts a two-terrain shore set from 47 to 15 tiles. Pair it with itsjavi/autotiler or the Wang converter to generate the 15/16 tiles from a few drawn pieces.

### Cited findings
- TileMapDual is "an automatic, real-time dual-grid tileset system for Godot". It reduces needed tiles "from 47 to just 15", or 6 drawn tiles with symmetry plus a generator. It supports square, isometric and hex grids. Plugin version v5.0.3 (README and plugin.cfg, https://github.com/pablogila/TileMapDual). The idea comes from Oskar Stalberg (https://x.com/OskSta/status/1448248658865049605).
- GitHub code search returned 43 public `project.godot` files mentioning TileMapDual (gh API, 2026-11-10). This is a rough adoption signal, not a shipped-games list.
- jess-hammer's version is "a custom Node2D" that manages a world `TileMapLayer` and display layers. Each display tile checks 4 neighbours instead of 8. The author admits no performance testing (https://github.com/jess-hammer/dual-grid-tilemap-system-godot). It is C# (Godot 4.4.1 Mono).
- itsjavi/autotiler takes a 13-tile (5x3) template or an RPG Maker A2 template. It outputs Godot 3x3 minimal (12x4), GameMaker 47 (8x6) or a 16-tile dual grid (4x4). It exports a Godot 4 TileSet `.tres` with peering bits for all 47 tiles, a Tiled `.tsx` Wang set, or PNG + JSON neighbour masks. Golden-image tests and headless Godot 4.7 painting tests check the output. It watches the template and re-exports on save (https://github.com/itsjavi/autotiler).
- Wang Tile Set Creator: give it 4 base tiles and it builds the dual-grid set. Written in Godot 4.3, MIT (https://github.com/kleingeist37/godot-wang-converter).
- Tiled: corner and edge sets need 16 tiles for 2 terrains. Mixed needs 256, or the reduced 47-tile blob. Up to 254 terrains per set. Wang tiles arrived in Tiled 1.1 and were unified with terrains in 1.5 (https://doc.mapeditor.org/en/stable/manual/terrain/).
- Better Terrain is Unlicense and was patched for Godot 4.6 on 2026-02-09 (https://github.com/Portponky/better-terrain).

### Inferences
- For a 32x32 server-authoritative MMO, the dual grid fits well. The server stores only "water or land" per cell. The client derives the display tile from 4 corners, so no tile IDs travel over the wire.
- Multiple water depths (deep, shallow, sand) mean several terrains. TileMapDual v5 and jess-hammer both list multiple terrain support. Test the transition count before committing.
- jess-hammer's repo is C#. Godot 4 C# projects do not export to web as far as I know. Use the GDScript port or TileMapDual for the web build. (Not verified in this pass.)

### Gaps
- No list of shipped commercial games using TileMapDual or Better Terrain was found.
- No benchmark of TileMapDual on large maps in the Compatibility renderer.

---

## Q2. Which Godot 4 water shaders are worth starting from?

### Takeaway
For a palette-limited top-down look, start from the CC0 "Pond Water" band-quantise idea and the jess-hammer pixelised-noise shader. Skip the heavy hash-ripple shaders. All the pixel-friendly ones share one recipe. Snap UVs to a grid, sample scrolling noise, quantise to a few colours, add a thresholded highlight.

### Cited findings
- godotshaders.com puts shader code under CC0 on each page checked. Page media is excluded (e.g. https://godotshaders.com/shader/sprite-water-reflection-pixel-art/).
- Pond Water (Arched, 2025-08-03, CC0): `floor(UV * pixel_amount) / pixel_amount`, then `round(noise * color_amount) / color_amount` into a GradientTexture1D. `color_amount` ranges 1 to 20. The author found pixel amount 200 worked well. The code reads SCREEN_TEXTURE but then overwrites it with the ramp colour (https://godotshaders.com/shader/pond-water-shader-2d-top-down/).
- Pixel Water for 4.3 (BananaBoy, 2024-08-21, CC0): two noise textures scrolled at (0.05, 0.05) and (-0.05, -0.05), multiplied. Highlight via smoothstep 0.275 to 0.4. `pixelSize` 2.0, distortion 0.2. One comment reports sharp edges on TileMapLayer (https://godotshaders.com/shader/pixel-water/).
- 2D Pixel Art Water (niwho, CC0): foam where an edge-distance gradient texture is below about 85/255. Foam alpha pulses with sin(TIME). Texture sizes are hard-coded (340, 512, cell 16) (https://godotshaders.com/shader/2d-pixel-art-water/).
- 2D water for topdown games (Sir-Shroom, CC0): 5x5 cell ripple neighbourhood (25 iterations) plus a 30-iteration highlight loop per pixel. Users reported black patches in Godot 4.4 and fixed them by clamping (https://godotshaders.com/shader/2d-water-for-topdown-games/).
- jess-hammer Godot repo: Visual Shaders with custom Pixelize, PixelizeUV and PerlinNoise3D nodes. A RippleShader drives water trails, with C# `Trails.cs` and `FollowCursor.cs`. It now uses FastNoiseLite textures rather than runtime noise "for performance". Heightmap generation code is not included (https://github.com/jess-hammer/2d-pixel-water-shader-godot, https://github.com/jess-hammer/2d-pixel-water-shader).
- taillight-games' shader is for a subdivided 3D quad (vertex waves, `calc_water_height(Vector3)`, bilinear buoyancy). The README says it is "compatible with all rendering pipelines" (https://github.com/taillight-games/godot-4-pixelated-water-shader).

### Inferences
- The jess-hammer shader uses a heightmap (distance from shore) to drive foam and colour bands. That maps onto the BFS distance-to-shore field in scope item 1. You have to write the heightmap generator yourself.
- Shaders that sample SCREEN_TEXTURE add a screen copy. In Compatibility/WebGL2 that costs more than sampling one noise texture. For 320x180 it is likely fine, but a non-screen-reading variant is safer on mobile web.
- The band-quantise step makes the palette predictable. Point the ramp at 3 to 5 palette colours to match the snow/acid studies' palette approach.
- jess-hammer's trail logic is C#. Port it to GDScript for web.

### Gaps
- No godotshaders page states which renderer it was tested on. None has frame-time numbers.
- Like counts were not visible on any page fetched.

---

## Q3. Reflections, caustics and flow maps: what is reusable?

### Takeaway
The Pokemon-style reflection shader (CC0/MIT) is ready to use. Caustics from Shadertoy are a licensing trap (default CC BY-NC-SA 3.0). Write your own Voronoi caustic or bake a texture instead. For flow, port the MIT Godot 3 flow map shader and paint low-res maps by hand. FlowMap Painter works but has no licence and dates from 2012.

### Cited findings
- Reflection shader: `canvas_item`, widens the quad by `displacementPixels` and shifts the left and right halves on a timed step. Supports `hFrames`/`vFrames` sprite sheets. A commenter says it works on AnimatedSprite2D but not on TileMap tiles (https://godotshaders.com/shader/sprite-water-reflection-pixel-art/). Demo repo MIT, Godot 4.2.1 (https://github.com/christt105/GodotPixelReflectionShader).
- Water Caustic Godot port credits "Origin code from https://www.shadertoy.com/view/MdlXz8". It has no own licence. The page notes the Shadertoy default CC BY-NC-SA 3.0 (https://godotshaders.com/shader/water-caustic/). Shadertoy returned HTTP 403, so I could not confirm the original author.
- godot-flow-map-shader: LICENSE.md says the shader and demo are MIT, (c) 2018 Jaccomo Lorenz (Maujoe). Last commit 2020-05-23 (https://github.com/JaccomoLorenz/godot-flow-map-shader).
- Valve's method is in Vlachos, "Water Flow in Portal 2", SIGGRAPH 2010 course, dated 2010-07-28. It covers Left 4 Dead 2 and Portal 2 and debris in dirty water (https://www.advances.realtimerendering.com/s2010/Vlachos-Waterflow(SIGGRAPH%202010%20Advanced%20RealTime%20Rendering%20Course).pdf).
- FlowMap Painter 0.9.2 (Teck Lee Tan): Windows/OSX, built in Unity. Has Pinch/Inflate and Vortex brushes, flow-line preview and wrap/tiling preview. Speed comes from mouse speed. Known issue: the tiling preview is broken. No licence stated (http://teckartist.com/?page_id=107; 2012 coverage https://www.cgchannel.com/2012/10/paint-games-flow-maps-with-flowmap-painter).
- Waterways (MIT, 1,350 stars) bakes flow and foam maps from bezier river meshes in 3D. Last release 2021-01-27 (https://github.com/Arnklit/Waterways).
- evanw/webgl-water main.js header says MIT, (c) 2011 Evan Wallace. The repo has no LICENSE file (https://github.com/evanw/webgl-water).

### Inferences
- In a tile engine a per-tile direction (one of 8 directions per 32x32 cell) is a flow map at 1 texel per tile. You can paint it in Tiled as a custom property or a second layer. No external painter needed.
- Treat any Shadertoy code as NC unless the code header states otherwise. Dave_Hoskins often puts explicit licences in his headers, but I could not verify MdlXz8 here.

### Gaps
- Original author and in-code licence of Shadertoy MdlXz8 are unverified (403).
- No maintained open-source flow-map painter with a clear licence was found. Starkingwang/FlowmapPainter (4 stars, single commit 2019-04-17) has no LICENSE file. zane133/flowmapPainter is GPL-3.0.

---

## Q4. Interaction: springs, wakes, ripples, buoyancy

### Takeaway
The spring-surface water gems are all side-view. For top-down, the two-buffer heightfield from study #3 Rain is the right base. Reuse the jess-hammer trail shader for wakes and the taillight buoyancy pattern for bobbing.

### Cited findings
- Michael Hoffman's Tuts+ tutorial models the surface as vertical springs with tension, dampening and spread to neighbours (https://code.tutsplus.com/make-a-splash-with-dynamic-2d-water-effects--gamedev-236t). GDevelop's docs warn very high spread "may make the water oscillate forever" (https://wiki.gdevelop.io/gdevelop5/extensions/dynamic-water/).
- prime31 has a two-part write-up (https://prime31.github.io/water2d-part1).
- HackTrout/2DDynamicWater is MIT. It splits the surface into water points (https://github.com/HackTrout/2DDynamicWater). The Godot 4 addon is on the Asset Library, MIT, updated 2025-11-28 (https://godotengine.org/asset-library/asset/3246).
- jess-hammer's water-trail shader follows the cursor via `Trails.cs` (https://github.com/jess-hammer/2d-pixel-water-shader-godot).
- taillight's `water_manager.gd` duplicates the shader's wave maths on the CPU. Objects can then query water height, with `fast_water_height` taking 1 sample instead of 4 (https://github.com/taillight-games/godot-4-pixelated-water-shader).

### Inferences
- The CPU-mirror pattern (the same wave formula in shader and GDScript) also fits an MMO. The server and every client can compute bob phase from a shared clock and tile position, with no sync traffic.
- Spring water only matters for side views, e.g. a dock cutaway or waterfall lip. Low priority here.

### Gaps
- No open-source top-down Kelvin-wake implementation in Godot was found in this pass.

---

## Q5. Art tools and generators

### Cited findings
- Pixelorama: MIT, v1.2.4 (2026-11-03), 11,051 stars, built in Godot (https://github.com/Orama-Interactive/Pixelorama).
- Aseprite source is visible but has no open licence in the GitHub API (spdx null), 40,827 stars (https://github.com/aseprite/aseprite). LibreSprite is the GPL-2.0 fork (https://github.com/LibreSprite/LibreSprite).
- GitHub search for "aseprite water" and "aseprite script water" returned no repos (gh search, 2026-11-10).
- PixelLab's Create Tileset exports a Wang tileset, a dual-grid 15-tile set or a 3x3 set. The newer version can add a transition tile between inner and outer tiles (https://www.pixellab.ai/docs/tools/create-tileset, https://www.pixellab.ai/docs/tools/create-tileset-new). Pricing is not confirmed from an official page. Third-party listings mention a $12/mo starting tier (vendor/third-party, unverified, https://ai.g2.com/marketplace/tools/pixellab).

### Inferences
- A PixelLab "shallow water to sand" set exported as dual-grid 15 drops straight into TileMapDual. A transition tile could carry the wet-sand band.

### Gaps
- No public Aseprite/Pixelorama script for water animation (palette cycling export) was found.

---

## Licence warnings
- Shadertoy code: CC BY-NC-SA 3.0 by default. Commercial games need explicit author permission or a rewrite.
- "2D water for topdown games" says CC0 but borrows from "Rainier mood" (RayL019) and "Neuronal Network Waves" (ahaugas), whose licences are not stated. Treat as unclear.
- GDQuest godot-shaders: code MIT, art assets CC BY-NC-SA 4.0 (LICENSE read 2026-11-10, https://github.com/gdquest-demos/godot-shaders). Do not ship their textures.
- FlowMap Painter and Starkingwang/FlowmapPainter: no licence. Using the tool's output is likely fine. Redistributing the tool is not.
- Tiled editor is GPL. That does not affect your maps.

## Sources
- https://github.com/pablogila/TileMapDual
- https://x.com/OskSta/status/1448248658865049605
- https://github.com/jess-hammer/dual-grid-tilemap-system-godot
- https://github.com/GlitchedinOrbit/dual-grid-tilemap-system-godot-gdscript
- https://github.com/Portponky/better-terrain
- https://github.com/dandeliondino/terrain-autotiler
- https://github.com/itsjavi/autotiler
- https://github.com/kleingeist37/godot-wang-converter
- https://github.com/toku-sa-n/blob-tileset-generator
- https://github.com/Ian-Parberry/wangtiler
- https://github.com/mapeditor/tiled
- https://doc.mapeditor.org/en/stable/manual/terrain/
- https://github.com/Kiamo2/YATI
- https://github.com/jess-hammer/2d-pixel-water-shader-godot
- https://github.com/jess-hammer/2d-pixel-water-shader
- https://www.youtube.com/watch?v=pGOLstWBCDA
- https://github.com/christt105/GodotPixelReflectionShader
- https://godotshaders.com/shader/sprite-water-reflection-pixel-art/
- https://godotshaders.com/shader/pond-water-shader-2d-top-down/
- https://godotshaders.com/shader/2d-pixel-art-water/
- https://godotshaders.com/shader/pixel-water/
- https://godotshaders.com/shader/2d-water-for-topdown-games/
- https://godotshaders.com/shader/water-caustic/
- https://www.shadertoy.com/view/MdlXz8 (403, not read)
- https://github.com/JaccomoLorenz/godot-flow-map-shader
- https://www.advances.realtimerendering.com/s2010/Vlachos-Waterflow(SIGGRAPH%202010%20Advanced%20RealTime%20Rendering%20Course).pdf
- http://teckartist.com/?page_id=107
- https://www.cgchannel.com/2012/10/paint-games-flow-maps-with-flowmap-painter
- https://github.com/Starkingwang/FlowmapPainter
- https://github.com/Arnklit/Waterways
- https://github.com/evanw/webgl-water
- https://code.tutsplus.com/make-a-splash-with-dynamic-2d-water-effects--gamedev-236t
- https://prime31.github.io/water2d-part1
- https://wiki.gdevelop.io/gdevelop5/extensions/dynamic-water/
- https://github.com/HackTrout/2DDynamicWater
- https://github.com/90-008/dynamic_water_2d
- https://godotengine.org/asset-library/asset/3246
- https://github.com/taillight-games/godot-4-pixelated-water-shader
- https://github.com/gdquest-demos/godot-shaders
- https://github.com/Orama-Interactive/Pixelorama
- https://github.com/aseprite/aseprite
- https://github.com/LibreSprite/LibreSprite
- https://www.pixellab.ai/docs/tools/create-tileset
- https://www.pixellab.ai/docs/tools/create-tileset-new
- https://ai.g2.com/marketplace/tools/pixellab
