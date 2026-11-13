# 12. Field resolution against art resolution, and the Godot 4 side

Researcher 12, 12 Nov 2026. Scope: which snow data must grow with the 640x360 art and which can stay coarse, how to draw a coarse field so it looks hand-made, and what Godot 4 offers today.

Tags: [C] cited from a page or file opened in this session. [M] measured by me with `scratch-12/bench.js` (Node 26.5.0, Apple M4 Pro, one thread, median of 300 runs). [I] my inference. [K] known from memory, URL given but not re-read today.

All sizes below assume 32x32 px tiles, a 640x360 view (20 x 11.25 tiles, 230,400 art pixels) and 24x32 px characters unless stated.

## Short answer

Keep the depth field coarse and let a static 32x32 threshold tile carry the pixel detail. A depth byte per 4x4 art pixels (160x90 = 14,400 bytes), sampled bilinearly and compared with an artist-painted threshold tile, produced an edge that my straight-run metric could not tell apart from a 1:1 field [M]. Footprints are the one thing that does not survive 1:4. They need 1:2 or 1:1, or their own layer [I].

---

## Q1. Drawing a low-resolution field at art resolution without blocky squares

### Takeaway
Two families exist. The first interpolates the field and thresholds it per pixel (bilinear then threshold, height blend, marching squares). The second picks a hand-drawn tile from corner values (dual grid, Wang, 47-blob). The first gives continuous coverage for 1 to 4 texture fetches per pixel. The second gives edges that are fully artist-drawn but move in steps of half a tile.

### Cited findings

| Technique | Data that drives it | Art cost | Work | Edge look | Source |
|---|---|---|---|---|---|
| Bilinear sample, then threshold | 1 byte per cell, any ratio | none, or one threshold tile | 1 linear fetch + 1 compare per pixel | smooth blob contour, cut by the threshold pattern | raylib example draws a 1-texel-per-32-px-tile fog texture with bilinear filtering [C, S1] |
| Height blend (hard variant) | blend weight + per-texel height stored in alpha | one height channel per tileset | 2 colour fetches + 1 compare | the upper layer fills cracks first | Mishkinis, 16 Jul 2013 [C, S2] |
| Height blend (soft variant) | same, with `depth = 0.2` band | same | 2 fetches, 2 `max`, 1 divide | soft band, not pixel art | [C, S2] |
| Marching squares / corner Wang | 1 bit per corner | 16 tiles | 4 lookups per tile, on change only | hand-drawn | 16 tiles for two-valued corners [C, S3] |
| Edge Wang | 1 bit per edge | 16 tiles | same | hand-drawn | [C, S3] |
| Blob | corners and edges | 47 tiles used out of 256 combinations | 8 neighbour lookups per tile | hand-drawn, tiles sit on the world grid | [C, S3] |
| Dual grid | 1 value per world cell, display grid shifted half a cell | 15 or 16 tiles, 6 if symmetric | 4 lookups per display tile | hand-drawn, round corners | [C, S4, S5, S6] |
| Godot terrain sets | peering bits | depends on mode | editor and `set_cells_terrain_connect` | hand-drawn | three modes: Match Corners and Sides, Match Corners, Match Sides [C, S7] |

- Mishkinis names the reason the height trick looks natural. "Sand doesn't stick to stones, instead it falls down and fills cracks between them." His first version is a plain compare, `texture1.a + a1 > texture2.a + a2 ? texture1.rgb : texture2.rgb`, and he reports border artefacts with it on smooth photo textures [C, S2].
- jess-hammer's README: "a maximum of only 16 tiles are required in the tileset", or 6 with symmetry, chosen by "16 hard-coded rules" from a hidden world layer [C, S4].
- TileMapDual's README: the dual grid "reduces the number of tiles required from 47 to just 15" [C, S5].
- Both repos credit Oskar Stålberg's post (https://x.com/OskSta/status/1448248658865049605). jess-hammer also credits a ThinMatrix video (https://youtu.be/buKQjkad2I0, at 234 s) [C, S4].
- TileWorldCreator's docs describe the dual grid as the standard grid moved by half a cell [C through search summary, S8].
- Boris the Brave's quarter-tile article lists the dual grid's drawbacks: hard to reason about, and ambiguous tiles. Quarter tiles use smaller pieces but cannot do large curves or several terrains [C through search summary, S9].

### Measured: does bilinear plus threshold hide the grid?

Test: a smooth depth field (three sine terms, shortest wavelength about 70 px) stored at four ratios, drawn at 640x360 through a 32x32 threshold tile with a swing of 20 depth units either side of 100. Metric: the mean length of straight horizontal runs on the snow boundary, and the share of the boundary that falls on rows that are multiples of 4 px. Chance is 25% [M].

| Field | Sampling | Threshold | Mean run (px) | Longest run (px) | On 4 px rows |
|---|---|---|---|---|---|
| 1:1 (230,400 cells) | nearest | flat | 2.03 | 28 | 23% |
| 1:2 (57,600) | nearest | flat | 4.03 | 32 | 50% |
| 1:4 (14,400) | nearest | flat | 7.68 | 36 | 100% |
| 1:4 | nearest | Bayer 4x4 | 2.00 | 43 | 26% |
| 1:4 | nearest | cluster tile | 2.15 | 24 | 46% |
| 1:4 | bilinear | flat | 2.04 | 29 | 23% |
| 1:4 | bilinear | Bayer 4x4 | 2.02 | 43 | 25% |
| 1:4 | bilinear | white noise | 1.61 | 10 | 25% |
| 1:4 | bilinear | cluster tile | 1.85 | 13 | 26% |
| 1 per tile (240) | nearest | flat | 58.57 | 128 | 100% |
| 1 per tile | bilinear | cluster tile | 1.90 | 13 | 25% |

- Nearest sampling at 1:4 puts 100% of the horizontal boundary on cell rows. That is the blocky look [M].
- Bilinear at 1:4 gives 2.04 px and 23%, the same as the 1:1 field (2.03 px, 23%) [M].
- A Bayer threshold hides the cell rows even with nearest sampling (26%), but it adds straight runs of 41 to 43 px at every ratio, including 1:1. Those are the matrix rows showing along flat stretches of the contour [M].
- The cluster tile has the shortest long runs after white noise (13 px against 43 for Bayer) [M].

### Inferences
- Bilinear then threshold is marching squares with the exact bilinear contour in place of straight segments. The GPU's linear filter does it in one fetch, so marching squares has no reason to exist in the shader path [I].
- The hard variant of the height blend is the "art threshold tile" from the sandbox spec under another name. The summer tile's height channel says which pixels drown last (tuft tips, stone tops). The compare is `field(world) > height(tile pixel)` [I, from S2].
- Dual grid is the right fallback when no shader can run, and the right tool for the server's snow band. A band of 0 to 3 per tile needs 15 tiles per band, 45 in all. Coverage then moves in 16 px jumps, so it should only follow the slow per-tile band, never the per-frame field [I].
- The threshold swing in pixels grows with the ratio. After bilinear upsampling from 1:4, the same per-cell difference is spread over 4 px, so a fixed threshold swing makes a dither band 4 times wider than at 1:1. Scale the swing down or the edge turns to fog [I, arithmetic].

### Gaps
- The metric only counts axis-aligned runs. It says nothing about shape fidelity, and the test field has no sharp features. Footprints and eave lines are not smooth (see Q6).
- I did not open Stålberg's post, the ThinMatrix video, the jess::codes video page or Tiled's terrain manual. Tiled is [K]: https://doc.mapeditor.org/en/stable/manual/terrain/.
- No source found for a shipped 2D game that uses bilinear plus threshold for ground cover.

---

## Q2. Blending a summer and a winter tileset through a per-pixel mask

### Takeaway
I found no shipped game, devlog or public Godot shader that blends two hand-drawn 2D tilesets through a world-space mask for snow. What exists is whole-tileset season swaps and noise dissolves. The 3D terrain height blend is the closest documented method, and it ports in a few lines.

### Cited findings
- Season asset packs ship separate tiles per season. One pack lists 48 terrain fills, 4 seasons times 4 variants, each with 47-tile autotile sets: https://csaf.itch.io/verdant-seasons [C through search summary, S10].
- A Godot dissolve shader compares a noise texture with a progress uniform through `step` to set alpha, with pixelation options: https://godotshaders.com/?p=11096 [C through search summary, S11].
- godotshaders.com results for 2D snow are falling-snow overlays. The one accumulation thread is 3D and unanswered [C, S12; see also `studies/vfx-snow/notes/05-newest-2025-2026.md`].
- A Godot forum answer (hexgrid, 7 Mar 2025, Godot 4.4) gives the standard way to get map data into a tile shader: build a single-channel texture the size of the map, map world position to texel coordinates, sample it, optionally with bilinear filtering [C, S13].

### Inferences
Sketch for Godot, untested [I]:

```glsl
shader_type canvas_item;
uniform sampler2D field  : filter_linear,  repeat_enable; // R8, 1 texel = 4 art px, world-anchored
uniform sampler2D thresh : filter_nearest, repeat_enable; // 32x32 R8, painted by the artist
uniform vec2 field_origin_px;  // world position of texel (0,0)
uniform vec2 field_size_px;    // world size the texture covers
uniform float winter_v = 0.5;  // winter tiles sit half an atlas below their summer twins
varying vec2 wpos;
void vertex() { wpos = (MODEL_MATRIX * vec4(VERTEX, 0.0, 1.0)).xy; }
void fragment() {
    vec2 p = floor(wpos) + 0.5;
    float d = texture(field,  (p - field_origin_px) / field_size_px).r;
    float t = texture(thresh, p / 32.0).r;
    COLOR = d > t ? texture(TEXTURE, UV + vec2(0.0, winter_v)) : texture(TEXTURE, UV);
}
```

- Four fetches per pixel (field, threshold, summer, winter). At 230,400 pixels that is 921,600 fetches per frame [I, arithmetic].
- The atlas layout (winter twin at a fixed UV offset) avoids a second TileMapLayer. The other option is two layers with the same cells, where the winter layer discards below the threshold. That doubles the quads to about 480 for a full view [I].
- A threshold tile per terrain type costs 1,024 bytes and never changes. Grass, dirt and cobble each get their own order of cover [I].

### Gaps
- Kynseed, Eastward and Stardew season transitions: nothing found on a mask blend. Stardew swaps tilesheets by season as far as I know [K, no URL checked].
- The sketch is not tested in Godot. Atlas padding and tile animation may break the fixed UV offset.

---

## Q3. Threshold patterns when a pixel is a smaller part of the tile

### Takeaway
A 4x4 Bayer matrix repeats 8 times across a 32 px tile, where it repeated twice across an 8 px tile. It stops reading as texture and starts reading as a screen-door film over the art. A painted or blue-noise 32x32 tile repeats once per tile and has 1,024 ranks, so it can hide in the tile art.

### Cited findings
- Obra Dinn thresholds 8-bit grey against "an 8x8 bayer matrix" for smooth shades and "a 128x128 blue noise field" for a less ordered look [C, S14].
- Pope's problem was a static screen pattern over a moving scene, worst at fullscreen. He rendered at 640x360, then moved to 800x450 for legibility. The work took about 100 hours. His fix pins the pattern to the scene (screen-space offset by camera rotation, or sphere mapping with 2x supersampling). "Discomfort from swimming dither is totally gone, even at fullscreen." [C, S14, quote relayed by the fetch tool].
- Christoph Peters' blue-noise set: void-and-cluster (Ulichney 1993), sizes from 16² to 1024², 1 to 4 channels, 8-bit and 16-bit PNG, all tileable, released "in the public domain through CC0-licensing". He recommends the 64² 8-bit textures. A 64² texture takes a little over a second to generate and a 1024² one several days. Posted 22 Dec 2016 [C, S15].
- Surma's "Ditherpunk" (4 Jan 2021): Bayer is "very structured and will look quite repetitive, especially at lower levels". White-noise thresholds form clusters and voids. Blue noise suppresses low frequencies and tiles because the blur wraps [C, S16].

### Measured
- Longest straight boundary run with Bayer 4x4: 41 to 43 px at every field ratio. With the cluster tile: 13 px. With white noise: 10 px [M, table in Q1].
- Bayer 4x4 and 8x8 gave the same run statistics at 1:4 bilinear (2.02 and 2.04 px mean, 43 px longest) [M].

### Inferences
- Level counts: 4x4 Bayer has 16 ranks with a 4 px period (1/8 tile). 8x8 has 64 ranks with an 8 px period (1/4 tile). A 32x32 tile has 1,024 ranks, 4 pixels per depth step if depth is a byte [I, arithmetic].
- A top-down 2D game gets Pope's fix for free. Index the threshold by world pixel (`world mod 32`), keep the camera on whole pixels, and the pattern moves with the ground. Screen-indexed thresholds would swim on every scroll step [I, from S14].
- Clustered-dot dither is what a pixel artist calls clusters. A painted threshold tile is a clustered-dot screen with the dot shape chosen by hand [I].
- Blue noise at 32² from Peters' set is the best free starting point for a threshold tile. Paint over it [I].

### Gaps
- No source compares Bayer and blue noise on 32 px pixel-art tiles specifically.
- I could not open Pope's original TIGSource post (HTTP 403). The dukope.com mirror was read through the fetch tool.

---

## Q4. Simulation coarser than the picture in shipped games

### Takeaway
The documented pattern for slow, smooth quantities is 1 texel per tile, upscaled with bilinear filtering and sometimes a blur. Games that need pixel-scale interaction (Noita) simulate at 1:1 and pay for it with dirty rectangles.

### Cited findings
- raylib's `textures_fog_of_war.c`: `MAP_TILE_SIZE 32`, fog drawn into a render texture "at a smaller size (one pixel per tile)", then scaled to the full map with `TEXTURE_FILTER_BILINEAR`. Ratio 1 texel to 1,024 pixels [C, S1].
- A 0 A.D. forum thread describes a one-pixel-per-tile fog bitmap with a small box blur, multiplied onto the terrain, and notes that per-tile input limits how smooth it can get: https://wildfiregames.com/forum/topic/14325-fog-rendering [C through search summary, S17].
- Noita simulates one cell per pixel in 64x64 chunks with dirty rectangles. See `studies/vfx-snow/report.md` source S36.
- Slime Rancher 2 keeps a top-down interaction buffer that follows the player, snapped to world texels. See `studies/vfx-snow/notes/05-newest-2025-2026.md`.

### Inferences
- Snow depth behaves like fog of war (slow, smooth, set by weather). Trails behave like Noita cells (sharp, set by actors). They deserve different resolutions [I].
- Snapping a player-following field to whole field cells stops the bilinear pattern from crawling when the camera moves [I, from the Slime Rancher note].

### Gaps
- Terraria liquids and Factorio: I found no primary source in budget. Terraria stores a liquid amount per tile as far as I know [K, no URL].
- No shipped pixel-art game documents a half-resolution ground sim with a threshold draw.

---

## Q5. Godot 4, state on 12 Nov 2026

### Takeaway
Stable is 4.7.2. 4.8 is at beta 3. `DrawableTexture2D` is unchanged since 4.7 and still experimental. `ImageTexture.update()` on Compatibility re-specifies the whole texture with `glTexImage2D`, and no sub-rectangle update exists. That makes field size the upload cost, so a small field matters more in Godot than in the canvas sandbox.

### Cited findings

**Versions**
- GitHub releases: 4.7-stable published 18 Jun 2026 (12:06 UTC), 4.7.1 on 14 Jul 2026, 4.7.2 on 18 Aug 2026 [C, S18]. The earlier study wrote 19 Jun for 4.7. The tag says 18 Jun.
- godot-builds: 4.8-dev7 on 1 Oct 2026, beta1 on 15 Oct, beta2 on 29 Oct, beta3 on 9 Nov 2026 [C, S19]. `version.py` on master reads 4.8 beta [C, S20].

**Pixel-perfect setup for 640x360** [C, S21]
- The docs call 640x360 "a good baseline". It scales by whole numbers to 1280x720, 1920x1080, 2560x1440 and 3840x2160.
- Recommended: stretch mode `viewport`, aspect `keep` (one ratio) or `expand` (several), scale mode `integer` (added in 4.2, default is `fractional`).
- `viewport` renders the scene to a root viewport at the base size and then scales it. `canvas_items` renders at the window's resolution and loses the 1:1 pixel mapping.
- Example from the docs: a 640x360 base in a 1366x768 window gives 2.133x with `fractional` and 2x (1280x720) with bars with `integer`.
- Prefer exclusive fullscreen. Plain fullscreen is 1 px short and can drop the whole-number factor by one.

**Snapping and filtering** [C, S22]
- `rendering/2d/snap/snap_2d_transforms_to_pixel` and `snap_2d_vertices_to_pixel` both default to false. The docs advise against enabling both and prefer the transform one.
- `rendering/textures/canvas_textures/default_texture_filter` defaults to 1. That is Linear [K for the enum order], so pixel-art projects must set Nearest.

**Web** 
- Export option `html/canvas_resize_policy` has three values: None, Project, Adaptive [C, S23].
- MDN: Chrome and Firefox change `devicePixelRatio` on page zoom, which makes pixel art uneven [C through search summary, S24].

**Texture upload on Compatibility** [C, S25, read from `drivers/gles3/storage/texture_storage.cpp` on master]
- `TextureStorage::texture_2d_update` calls `texture_set_data`, which reaches `_texture_set_data`. For uncompressed 2D images that function calls `glTexImage2D` with the full width and height per mip level. It does not use `glTexSubImage2D`.
- `Image::FORMAT_R8` maps to `GL_R8` / `GL_RED` / `GL_UNSIGNED_BYTE`, and `FORMAT_RG8` to `GL_RG8`. No conversion to RGBA.
- RenderingServer's texture methods on master are `texture_2d_create`, `texture_2d_update`, `texture_2d_layered_create`, `texture_3d_update`, `texture_replace`, the `texture_drawable_*` family and a few others. None takes a rectangle for a 2D upload [C, S26].
- `texture_2d_update` needs an image with the same width, height and format as the texture [C, S26].
- Proposal #13012, "Readd support for partial texture updates in RenderingServer", opened 17 Aug 2025, still open, 6 comments. It asks for `ImageTexture.update_region(rect, image)` [C, S27].

**DrawableTexture2D** [C, S28, S29]
- `doc/classes/DrawableTexture2D.xml` differs between the 4.7-stable tag and master by one line (the wording of the sRGB format note). The API is the same.
- `blit_rect`, `blit_rect_multi` and `setup` are still marked experimental on master.
- Signatures: `setup(width, height, format, color = Color(1,1,1,1), use_mipmaps = false)`, `blit_rect(rect: Rect2i, source: Texture2D, modulate, mipmap = 0, material = null)`, `blit_rect_multi(rect, sources (up to 4), extra_targets (up to 3), modulate, mipmap, material)`.
- Formats: `DRAWABLE_FORMAT_RGBA8`, `RGBA8_SRGB`, `RGBAH`, `RGBAF`. No single-channel format.
- The GLES3 backend implements it: `texture_drawable_initialize` and `texture_drawable_blit_rect` are in the same `texture_storage.cpp` [C, S25].
- The class page says nothing about renderer support or reading pixels back. The tutorial notes that premultiplied alpha is not supported in blit shaders.

**World coordinates and per-tile data in shaders**
- `MODEL_MATRIX` takes local space to world space, `CANVAS_MATRIX` world to canvas, `SCREEN_MATRIX` canvas to clip. Vertex built-ins must be passed to `fragment()` as varyings. `FRAGCOORD` is the pixel centre in viewport pixels [C, S30].
- Per-instance uniforms on CanvasItem (`set_instance_shader_parameter`) exist in the 4.4 class reference and not in 4.3 [C, S31].
- A forum thread reports that TileMaps share one shader instance across tiles of a type, and that `INSTANCE_CUSTOM` is not filled for tiles [C through search summary, S32].
- TileData has `modulate`, `material`, `z_index` and custom data. `TileMapLayer._tile_data_runtime_update(coords, tile_data)` can change them per cell at run time, with a documented warning of "a significant performance penalty" when overused [C, S33].

### Inferences
- With `viewport` stretch, a full-screen ground shader runs on 230,400 fragments at any window size. With `canvas_items` at 1080p it runs on 2,073,600, 9 times more. For a shader with 4 to 8 fetches per pixel this is the largest single cost decision in the project settings [I, from S21].
- Since every upload is a full `glTexImage2D`, the bytes per tick equal the texture size. 640x360 RGBA8 is 921,600 bytes. 160x90 R8 is 14,400 bytes, 64 times less. At a 10 Hz tick that is 9.2 MB/s against 144 KB/s [I, arithmetic on S25].
- "Upload only dirty chunks" from VFX #1 needs one texture per chunk, or one layer per chunk in a texture array (`texture_2d_update` takes a `layer`). A single big texture cannot be patched [I, from S25, S26].
- A world-anchored field with `repeat_enable` can be addressed as a ring, so camera scroll moves an offset uniform and uploads nothing [I].
- `DrawableTexture2D` removes the upload for trails. A boot print is one `blit_rect` of a few pixels on the GPU. The price is RGBA8 (921,600 bytes of VRAM at 1:1 for 640x360) and an experimental API. Depth, packed and wet fit in three channels of one texture [I, from S28].
- Per-tile data for a TileMapLayer shader has three routes. A data texture at 1 texel per tile (240 bytes per view) sampled by world position is the simple one. `TileData.modulate` set in `_tile_data_runtime_update` reaches the shader as vertex `COLOR`, 4 bytes per tile, but forces tile rebuilds. Instance uniforms are per node, so they suit per-layer or per-chunk values, never per tile [I, from S13, S31, S33].
- The palette LUT and the threshold tile are extra samplers with `filter_nearest`. The threshold needs `repeat_enable` [K for the hint names, S34].

### Gaps
- No measured milliseconds for `ImageTexture.update()` by size on Compatibility or WebGL2. I found none in issues, proposals or forums. This needs a 20-line Godot test on the target laptop and phone.
- No measured cost for `blit_rect` on WebGL2.
- Web integer scaling with fractional `devicePixelRatio` (Windows at 125% or 150%): no Godot-specific source found. Untested.
- I could not confirm the 4.8 change list for 2D. The docs "stable" branch still reads 4.7.
- GDScript speed for the random-pick ticks is unmeasured. My JS timings do not transfer.

---

## Q6. Cost by ratio, and what the player notices

### Takeaway
Render cost follows art pixels and does not care about the field ratio. Memory, picks and upload bytes follow field cells and drop 16 times from 1:1 to 1:4. Boot prints set the floor for the trail layer at 1:2.

### Numbers

Bytes per R8 field [M, arithmetic]:

| Ratio | Cell size | 640x360 view | 64x64-tile chunk (2048x2048 px) | Cells per tile |
|---|---|---|---|---|
| 1:1 | 1 px | 230,400 | 4,194,304 | 1,024 |
| 1:2 | 2x2 px | 57,600 | 1,048,576 | 256 |
| 1:4 | 4x4 px | 14,400 | 262,144 | 64 |
| 1 per tile | 32x32 px | 240 | 4,096 | 1 |

Three fields (depth, packed, wet) for a chunk cost 12.6 MB at 1:1 and 786 KB at 1:4.

CPU draw of the ground mask at 640x360 in JS [M]:

| Sampling | ms per frame, any ratio |
|---|---|
| nearest + threshold tile | 0.19 to 0.23 |
| bilinear + threshold tile | 0.50 to 0.72 |

- Bilinear costs about 2.6 times nearest on the CPU, and the ratio makes no difference to either [M]. On the GPU the linear filter is one fetch [I].
- Picks at an equal rate per tile: VFX #1 used 9,400 picks per frame on 57,600 cells (900 + 4,000 + 1,400 + 1,500 + 1,600), which is 163 per 1,000 cells. That gives 37,600 at 1:1, 9,400 at 1:2, 2,350 at 1:4 and 39 per tile grid [I, arithmetic on CONTEXT.md].
- A minimal pick loop measured 0.43 ms (1:1), 0.31 ms (1:2) and 0.08 ms (1:4) per frame. These timings are noisy and the loop body is simpler than the real rules. Treat them as "under half a millisecond on a fast desktop" and nothing more [M].

### What the player notices [I]

| Ratio | Snow edge with bilinear + threshold tile | Boot prints (3x5 px, feet about 6 px apart) | Eaves and object edges |
|---|---|---|---|
| 1:1 | exact | exact shapes | exact |
| 1:2 | same as 1:1 | each print covers 1.5 x 2.5 cells and draws as a 4x6 px blob. One clean cell stays between left and right feet, so they read as two prints | 2 px soft |
| 1:4 | same as 1:1 in my metric | a print is smaller than one cell. Left and right land in neighbouring cells and bilinear joins them into one 8 to 12 px trench. Trails yes, prints no | 4 px soft, needs an art-resolution mask |
| 1 per tile | smooth blobs about a tile wide, fine for overall cover | only "this tile is trodden" | none |

- Depth can stay at 1:4. The threshold tile supplies every pixel of edge detail.
- Baked exposure and sun shadow can stay at 1:4 if the tileset carries a static art-resolution snow mask (roof outline, trunk base) that the shader multiplies in. Static masks cost no upload [I].
- Trails need 1:2 as an R8 field (57,600 bytes, uploaded only on ticks where a print landed), or 1:1 in a `DrawableTexture2D` with GPU stamps, or a list of print decals drawn as sprites over a coarse field [I].
- The server keeps 2 bits per tile (60 bytes per view, 1,024 bytes per chunk) [I].

### Gaps
- All "what the player notices" rows are reasoning from cell sizes. The sandbox's field-resolution control should confirm them by eye.
- No low-end device timing. The M4 Pro numbers are a floor. Expect a budget laptop or phone to be several times slower.

---

## Gems

| Name | URL | Licence (from LICENSE file) | Maturity | What it saves |
|---|---|---|---|---|
| TileMapDual | https://github.com/pablogila/TileMapDual | MIT, (c) 2024 Pablo Gila-Herranz | 1,313 stars, 60 forks, last push 3 Sep 2026, v5 rewrite, square, isometric and hex grids | a drop-in dual-grid `TileMapLayer` node for Godot, 15 tiles per terrain |
| dual-grid-tilemap-system-godot | https://github.com/jess-hammer/dual-grid-tilemap-system-godot | MIT, (c) 2024 jess-hammer | 628 stars, 59 forks, last push 9 Feb 2026, Godot 4.4.1 Mono, C#, 27 commits | a small readable reference for the 16 rules |
| Free blue noise textures (Christoph Peters) | https://momentsingraphics.de/BlueNoise.html | CC0 1.0, stated on the page (no LICENSE file, it is a download) | published 22 Dec 2016, widely used in rendering work | tileable 16² to 1024² threshold textures, a base for a painted 32x32 tile |
| raylib `textures_fog_of_war.c` | https://github.com/raysan5/raylib/blob/master/examples/textures/textures_fog_of_war.c | raylib is zlib [K, LICENSE not opened today] | part of raylib's official examples | a 150-line reference for 1 texel per 32 px tile with bilinear upscale |
| Godot docs, multiple resolutions | https://docs.godotengine.org/en/stable/tutorials/rendering/multiple_resolutions.html | docs are CC BY 3.0 [K] | official | the pixel-art settings list for a 640x360 base |

Stars and push dates come from the GitHub API on 12 Nov 2026.

---

## Sources

- S1. raylib fog-of-war example. https://raw.githubusercontent.com/raysan5/raylib/master/examples/textures/textures_fog_of_war.c
- S2. Andrey Mishkinis, "Advanced Terrain Texture Splatting", Game Developer, 16 Jul 2013. https://www.gamedeveloper.com/programming/advanced-terrain-texture-splatting
- S3. Boris the Brave, "Classification of Tilesets", 14 Nov 2021. https://www.boristhebrave.com/2021/11/14/classification-of-tilesets/
- S4. jess-hammer, dual-grid-tilemap-system-godot, README and LICENSE. https://github.com/jess-hammer/dual-grid-tilemap-system-godot
- S5. pablogila, TileMapDual, README and LICENSE. https://github.com/pablogila/TileMapDual
- S6. Oskar Stålberg's dual-grid post (linked from S4 and S5, not opened). https://x.com/OskSta/status/1448248658865049605
- S7. Godot docs, "Using TileSets" (terrain modes). https://raw.githubusercontent.com/godotengine/godot-docs/master/tutorials/2d/using_tilesets.rst
- S8. TileWorldCreator docs, "Dual- & Standard Grid" (search summary). https://giantgrey.gitbook.io/tileworldcreator-v4-documentation/dual-and-standard-grid
- S9. Boris the Brave, "Quarter-Tile Autotiling", 31 May 2023 (search summary). https://www.boristhebrave.com/2023/05/31/quarter-tile-autotiling/
- S10. Verdant Seasons tileset pack (search summary). https://csaf.itch.io/verdant-seasons
- S11. "Dissolve/Add details Pixel Art" shader (search summary). https://godotshaders.com/?p=11096
- S12. godotshaders.com snow tag. https://godotshaders.com/shader-tag/snow and forum thread https://forum.godotengine.org/t/interactive-snow-shader-issues/119668
- S13. Godot forum, "Shader TileMap Custom Data Layers", Mar 2025. https://forum.godotengine.org/t/shader-tilemap-custom-data-layers/104400
- S14. Lucas Pope, Obra Dinn dithering devlog, Nov 2017 (mirror). https://dukope.com/devlogs/obra-dinn/tig-32/ . Original, HTTP 403 today: https://forums.tigsource.com/index.php?topic=40832.msg1363742
- S15. Christoph Peters, "Free blue noise textures", 22 Dec 2016. https://momentsingraphics.de/BlueNoise.html
- S16. Surma, "Ditherpunk", 4 Jan 2021. https://surma.dev/things/ditherpunk/
- S17. Wildfire Games forum, fog rendering (search summary). https://wildfiregames.com/forum/topic/14325-fog-rendering
- S18. Godot releases, GitHub API. https://api.github.com/repos/godotengine/godot/releases
- S19. Godot builds, GitHub API. https://api.github.com/repos/godotengine/godot-builds/releases
- S20. https://raw.githubusercontent.com/godotengine/godot/master/version.py
- S21. Godot docs, "Multiple resolutions" (4.7). https://docs.godotengine.org/en/stable/tutorials/rendering/multiple_resolutions.html
- S22. ProjectSettings class reference, master. https://raw.githubusercontent.com/godotengine/godot/master/doc/classes/ProjectSettings.xml
- S23. EditorExportPlatformWeb class reference, 4.7-stable. https://raw.githubusercontent.com/godotengine/godot/4.7-stable/platform/web/doc_classes/EditorExportPlatformWeb.xml
- S24. MDN, "Crisp pixel art look" (search summary). https://developer.mozilla.org/docs/Games/Techniques/Crisp_pixel_art_look
- S25. Godot GLES3 texture storage, master. https://raw.githubusercontent.com/godotengine/godot/master/drivers/gles3/storage/texture_storage.cpp
- S26. RenderingServer class reference, master. https://raw.githubusercontent.com/godotengine/godot/master/doc/classes/RenderingServer.xml
- S27. Godot proposal #13012. https://github.com/godotengine/godot-proposals/issues/13012 . Older discussion #4017: https://github.com/godotengine/godot-proposals/discussions/4017
- S28. DrawableTexture2D class reference, 4.7-stable and master. https://raw.githubusercontent.com/godotengine/godot/4.7-stable/doc/classes/DrawableTexture2D.xml and https://raw.githubusercontent.com/godotengine/godot/master/doc/classes/DrawableTexture2D.xml , rendered at https://docs.godotengine.org/en/latest/classes/class_drawabletexture2d.html
- S29. "Using DrawableTextures" tutorial. https://raw.githubusercontent.com/godotengine/godot-docs/master/tutorials/rendering/drawable_textures.rst
- S30. CanvasItem shader reference. https://docs.godotengine.org/en/stable/tutorials/shaders/shader_reference/canvas_item_shader.html
- S31. CanvasItem class reference at 4.3-stable and 4.4-stable. https://raw.githubusercontent.com/godotengine/godot/4.3-stable/doc/classes/CanvasItem.xml and https://raw.githubusercontent.com/godotengine/godot/4.4-stable/doc/classes/CanvasItem.xml
- S32. Godot forum threads on tile shaders and instance uniforms (search summary). https://forum.godotengine.org/t/tile-identifier-tile-position-within-tileset-shader/52123 and https://forum.godotengine.org/t/ways-to-mimic-per-instance-uniforms-for-canvas-item-shaders/64971
- S33. TileData and TileMapLayer class references, 4.7-stable. https://raw.githubusercontent.com/godotengine/godot/4.7-stable/doc/classes/TileData.xml and https://raw.githubusercontent.com/godotengine/godot/4.7-stable/doc/classes/TileMapLayer.xml
- S34. Godot shading language reference (uniform hints, not re-read). https://docs.godotengine.org/en/stable/tutorials/shaders/shader_reference/shading_language.html
- Benchmark script and raw downloads: `studies/vfx-snow-32px/notes/scratch-12/bench.js` and `scratch-12/dl/`.
