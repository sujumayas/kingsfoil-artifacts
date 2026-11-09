# 02 — Modern architectures & performance for many trees (2D/top-down) → Godot 4 web (Compatibility)

Researcher angle: rendering MANY trees cheaply; Godot 4 internals (docs + engine source) and how shipped games did it.
Date of research: 2026-11-09. Godot docs/source read from `master` unless a version is stated. My computed numbers are marked (calc).

---

## Q1. Godot 2D batching: what really batches in the Compatibility (GLES3/WebGL2) renderer?

**Takeaway:** In Compatibility, consecutive rects/quads batch into one instanced draw while they share texture, material, filter, repeat, blend mode, clip owner and lit/unlit state. Meshes, MultiMeshes and particles always start their own batch. So the rules for a forest are: one atlas texture, one ShaderMaterial, the same filter, and the same light state for every tree.

**Cited findings**
- Compatibility has batched 2D since 4.0. Godot 4.4 added 2D batching to Forward+/Mobile (RD), PR GH-92797 by Stuart Carnie, so that "2D performance is comparable between all backends". https://hackernoon.com/godot-44-dev-3-vertex-shading-2d-batching-and-more
- Godot docs: in 2D "there can easily be thousands" of items on screen, hence batching through "a single draw call". https://raw.githubusercontent.com/godotengine/godot-docs/master/tutorials/performance/gpu_optimization.rst
- Docs: reuse materials; "use atlases to decrease the amount of texture changes". The docs' example: 20,000 objects with 100 materials renders much faster than with 20,000 materials. (same URL)
- Things that break a batch, from the engine source `drivers/gles3/rasterizer_canvas_gles3.cpp` (master): https://raw.githubusercontent.com/godotengine/godot/master/drivers/gles3/rasterizer_canvas_gles3.cpp
  - a different `clip` owner, a different `material`, texture filter, texture repeat, blend mode/blend colour, or rect `texture`. Also a change of command type (rect vs ninepatch vs primitive).
  - **lit vs unlit state**: `lights_disabled` changing between items starts a new batch (lines ~871-874). Light count per item is capped by `max_lights_per_item`.
  - `TYPE_MESH / TYPE_MULTIMESH / TYPE_PARTICLES`: the source comment reads "Meshes can't be batched, so always create a new batch."
  - The instance buffer holds `item_buffer_size` instances (default **16,384**) × **128 bytes** = **2 MB**, triple-buffered (3 buffers). On WEB_ENABLED it uploads with `glBufferSubData`. Desktop/mobile instead map with `GL_MAP_UNSYNCHRONIZED_BIT`.
  - Per-instance data includes `instance_uniforms_ofs`, so per-instance shader uniforms ride along in the instance data.
- Project settings (docs, master): `rendering/gl_compatibility/item_buffer_size` = 16384, "Maximum number of canvas items commands that can be drawn in a single viewport update"; anything past it "will be ignored". `rendering/limits/opengl/max_renderable_lights` = 32 ("consider lowering as much as possible on web export"). `rendering/limits/opengl/max_lights_per_object` = 8. RD-side: `rendering/2d/batching/item_buffer_size` = 16384, `uniform_set_cache_size` = 4096. https://raw.githubusercontent.com/godotengine/godot-docs/master/classes/class_projectsettings.rst
- Godot 4.6-dev5: GH-112481 reworked the 2D batching design to cut its GPU cost. It came after reports of "4.4 being significantly slower than 4.3" on "older and lower-end mobile devices". Result: "1.1x to 7x as fast" in GPU-bound scenes. https://godotengine.org/article/dev-snapshot-godot-4-6-dev-5/ (the speedups are developer-reported; benchmarks are in the PR, which I could not fetch)

**Inferences**
- Forest recipe for one batch: every tree, stump, bush and leaf particle in **one atlas texture**, sharing **one ShaderMaterial** (wind + season + fade), with the same filter (Nearest).
- A tree inside a PointLight2D's range next to one outside it can split batches, because lit vs unlit differs. Prefer CanvasModulate or a palette/LUT day-night, or one DirectionalLight2D that hits everything.
- Duplicating materials per tree (a common "hit flash" or "wind offset" tutorial pattern) breaks batching. Use per-instance uniforms instead (Q4).

**Gaps:** No official draw-call benchmark for Compatibility. GH-112481 renderer scope (RD only, or GLES3 too?) and its numbers are unverified (GitHub PR page not fetchable here).

---

## Q2. Y-sort cost (CanvasItem.y_sort_enabled, TileMapLayer)

**Takeaway:** Y-sort is not free. Every frame, a y-sorted parent **collects ALL its visible descendants (before culling) and sorts them**, then culls each one. 10,000 trees under one Y-sort node means sorting 10,000 items per frame even when 300 are on screen. So chunk the forest, and set `visible = false` on far chunks.

**Cited findings**
- Source `servers/rendering/renderer_canvas_cull.cpp` (master): with `sort_y`, it calls `_collect_ysort_children(...)` into an `alloca` array of `ysort_children_count + 1`, runs `SortArray<Item*, ItemYSort>`, and then calls `_cull_canvas_item` on each child. `_collect_ysort_children` skips only children that are not `visible` or are masked by the visibility layer. The child count is cached and marked dirty on tree changes (`_mark_ysort_dirty`). https://raw.githubusercontent.com/godotengine/godot/master/servers/rendering/renderer_canvas_cull.cpp
- CanvasItem docs: nodes "sort relative to each other only if they are on the same z_index". A child with y-sort disabled under a y-sorted parent renders its own children "together on the same Y position", which is useful for multi-part trees (trunk + canopy + shadow as one sorted unit). https://raw.githubusercontent.com/godotengine/godot-docs/master/classes/class_canvasitem.rst
- TileMapLayer: `rendering_quadrant_size` default **16** (16×16 = **256 tiles per canvas item**). It "does not apply on a Y-sorted TileMapLayer, as tiles are grouped by Y position instead". `y_sort_origin` is a per-layer offset added to each tile's Y-sort origin, "useful for top-down view games". Updates are batched to the end of the frame. `update_internals()` and runtime tile-data updates are "computationally expensive". https://raw.githubusercontent.com/godotengine/godot-docs/master/classes/class_tilemaplayer.rst
- Godot 4.5: TileMapLayer physics "merge cell shapes into bigger collision shapes" (`physics_quadrant_size` default 16), which helps colliders for tree trunks placed as tiles. https://godotengine.org/releases/4.5/

**Inferences**
- Trees as tiles in a **y-sorted TileMapLayer** give roughly one canvas item per tile row in view (not per tree). That's cheaper to sort than 1 node per tree, but per-tree effects (fade, shake, chop) then need scene tiles or a separate overlay.
- Hybrid used by many Godot top-down games: trunk bases and colliders in a TileMapLayer, plus a pooled Sprite2D for the few trees near the player that need interaction (fade, shake, chop).
- Chunk layout: e.g. 16×16-tile chunks, each a Node2D. Toggle `visible` on chunks within camera ± 1 chunk, so the sort only sees the ~9 nearby chunks.
- Don't animate y-sorted tree positions. Moving transforms is fine (the sort runs anyway), but script-side transform updates cost CPU (see bunnymark, Q6).

**Gaps:** No measured ms per N y-sorted items found. A demo should measure 1k/5k/10k Sprite2D trees in Compatibility on web.

---

## Q3. MultiMeshInstance2D for trees

**Takeaway:** A MultiMesh is **one draw and one sort key**. It can't interleave with the player in Y-sort and has no per-instance culling. Use it for flat layers (ground cover, fallen leaves, undergrowth always below the player) or for a canopy layer always above the player. Don't use it for y-sorted trunks.

**Cited findings**
- Docs: a MultiMesh "can draw up to millions of objects in one go". There is "no screen or frustum culling" per instance, so visibility is "all-or-none". The workaround is "several MultiMeshes for different areas of the world". `visible_instance_count` lets you allocate the maximum and show fewer. The vertex shader can use `INSTANCE_ID` / `INSTANCE_CUSTOM`. `RenderingServer.multimesh_set_buffer()` sets everything in one call. https://raw.githubusercontent.com/godotengine/godot-docs/master/tutorials/performance/using_multimesh.rst
- GLES3 source: TYPE_MULTIMESH always forces a new batch (see Q1).
- A forum user hit z-ordering problems inside a 2D MultiMesh: instances draw in buffer order. https://forum.godotengine.org/t/z-order-in-mulitmesh-2d/10371 (search result, not fetched in detail)

**Inferences**
- To get correct order inside one MultiMesh, write instances sorted by Y once (static forest), with one MultiMesh per chunk. The player still can't go between two instances of the same MultiMesh.
- For canopies, split each tree into a **trunk** (y-sorted Sprite2D or tile) and a **canopy** (MultiMesh layer above everything, z_index high). Occlusion fade then becomes a shader circle-cutout using a player-position uniform (Q7). This avoids per-tree nodes for canopies entirely.

**Gaps:** No 2D MultiMesh benchmark on WebGL2 found.

---

## Q4. Per-instance variation without breaking batches (tint, season, wind phase)

**Takeaway:** Since **Godot 4.4**, `canvas_item` shaders support `instance uniform` through `CanvasItem.set_instance_shader_parameter()`, with up to 16 per shader. One shared material can give every tree its own hue, season offset, wind phase or fade value. Free alternatives: derive variation from world position in the vertex shader, or pack it into `modulate`/COLOR.

**Cited findings**
- Shading language docs: "Per-instance uniforms are available in both canvas_item (2D) and spatial (3D) shaders." The docs' own example is "a forest full of trees" with slightly different colours, where per-tree materials would add "performance overhead". Limits: no textures or arrays, and a "practical maximum limit of 16 instance uniforms per shader". https://raw.githubusercontent.com/godotengine/godot-docs/master/tutorials/shaders/shader_reference/shading_language.rst
- `CanvasItem.set_instance_shader_parameter` appears in the 4.4 class reference, not in 4.3 (checked by grepping godot-docs branches 4.3 / 4.4 / 4.5 / 4.6 `classes/class_canvasitem.rst`). https://raw.githubusercontent.com/godotengine/godot-docs/4.4/classes/class_canvasitem.rst
- Before that (Godot 4.3), forum users said "There are no actual per-instance uniforms for Canvas Items". Workarounds were packing data into COLOR/UV (8-bit precision) or a material per node. https://forum.godotengine.org/t/ways-to-mimic-per-instance-uniforms-for-canvas-item-shaders/64971

**Inferences**
- Season and variant without new textures: `instance uniform float season_phase; instance uniform float hue_shift;`, with the palette LUT row chosen in the fragment shader (Q8).
- Wind desync for free: `phase = dot(MODEL_MATRIX[2].xy, vec2(0.13, 0.07))` in the vertex shader, with no uniform needed.

**Gaps:** I did not benchmark instance uniforms against plain modulate on WebGL2.

---

## Q5. Wind sway, culling, CanvasGroup, lights & occluders

**Takeaway:** Sway goes in the vertex shader (weighted by UV.y, phased by world position). It costs about one sin per vertex, which is 4 vertices per tree. Avoid CanvasGroup per tree (backbuffer). Avoid LightOccluder2D per tree. Bake blob shadows into the atlas or use a shadow sprite instead.

**Cited findings**
- godotshaders "2D wind sway" (vertex shader): `VERTEX.x += wave * strength * max(0, (1-UV.y) - heightOffset)`, where `wave = sin(t)+cos(t*detail)`. The per-instance `offset` uniform requires unique materials, which breaks batching (see Q1/Q4). Uses `WORLD_MATRIX`, renamed `MODEL_MATRIX` in 4.x. https://godotshaders.com/shader/2d-wind-sway/
- godotshaders "2D tree wind & trigger hit effect": the fragment shader rotates UV around pivot (0.5, 1) by a noise sample at world position (desynced per tree). The hit is a bool uniform set after **duplicating the material** per tree. https://godotshaders.com/shader/2d-tree-wind-trigger-hit-effect/
- Caution: vertex-only sway on a 4-vertex quad shears the whole sprite. Fragment UV-rotation sways inside the quad but needs transparent padding in the sprite (inference from both shaders' math).
- VisibleOnScreenNotifier2D "uses the render culling code". VisibleOnScreenEnabler2D auto-enables or disables nodes, for example to stop tree `_process` offscreen. https://raw.githubusercontent.com/godotengine/godot-docs/master/classes/class_visibleonscreennotifier2d.rst
- CanvasGroup "uses a custom shader to read from the backbuffer" and merges children "as a single object". Margins: `clear_margin` 10, `fit_margin` 10. https://raw.githubusercontent.com/godotengine/godot-docs/master/classes/class_canvasgroup.rst
- 2D lights docs: shadow Filter "None" is "the fastest" and "well suited for games with a pixel art aesthetic". PCF13 "should only be used for a few lights". Larger lights cost more pixels. Shadow "Max Distance" culls far occluders. Pixel-snapped lighting needs a custom shader using `LIGHT_VERTEX`/`SHADOW_VERTEX`. https://raw.githubusercontent.com/godotengine/godot-docs/master/tutorials/2d/2d_lights_and_shadows.rst
- `rendering/2d/shadow_atlas/size` = 2048. The SDF is rendered at 50% scale (25% of pixels) by default. https://raw.githubusercontent.com/godotengine/godot-docs/master/classes/class_projectsettings.rst

**Inferences**
- CanvasGroup's good use is **one** CanvasGroup for the faded canopy layer. Overlapping semi-transparent canopies then don't double-darken. Cost: one extra backbuffer copy per frame, not one per tree.
- LightOccluder2D per tree means each shadow-casting light redraws every occluder polygon into the shadow atlas. Use them only for a lantern at night, near the player, with `Max Distance` set.

---

## Q6. Max sprites at 60 fps on web/mobile (any numbers)

**Takeaway:** Community bunnymarks with moving, script-updated sprites put Godot 4.1 around **5k sprites on a laptop and 2k on an old phone**. Static trees with no script are cheaper on the CPU. Art pipeline choices (atlases, VRAM-compressed textures) matter more on web than node count does.

**Cited findings**
- Bunnymark thread: "5000 bunnies at 60fps on my old laptop, only 2000 on my old phone" (4.1.1, Sprite2D driven from typed arrays). Compatibility on a Ryzen 5 3500U / Vega Mobile starts dropping at **5.5k**. Forward+ drops to 53 fps at **7–7.5k**. A desktop on 4.2.dev5 reached **15,000** before dropping. https://godotforums.org/d/29239-bunnymark
- A web-export case study (self-reported, one unnamed mid-range Android, several variables changed at once): 250–260 loose sprites packed into **4 atlases** (2 px padding, 1 px extrude), VRAM-compressed textures instead of WebP. Draw calls went from **240 to 38**, average fps from **31 to 60**, peak memory from **612 MB to 152 MB**. Note: a 1024² RGBA texture is about 4 MB uncompressed. https://forum.godotengine.org/t/godot-4-web-export-stutters-on-mobile-its-probably-your-art-pipeline-not-your-code-31fps-to-60fps-benchmarks-inside/143268
- Godot benchmarks site exists (not checked for 2D sprite tests): https://benchmarks.godotengine.org/

**Inferences / budgets (calc)**
- One 2048×2048 RGBA8 atlas is 16 MB VRAM. At 32×64 px per tree cell it holds 64×32 = 2048 cells, enough for ~8 species × 4 seasons × ~4 ages × several variants plus stumps, leaves and shadows.
- 1024² is 4 MB. Pixel art usually stays lossless and uncompressed (compression artifacts on palette art), so keep the atlas count low.
- Target budget for web/mobile (inference): fewer than 1,500 visible tree sprites and fewer than 50 draw calls. That's realistic with one atlas + one material. A 480×270 viewport with 16 px tiles shows 30×17 ≈ 510 tiles, so even 100% forest density is about 500 trunks + 500 canopies on screen.

---

## Q7. Shipped games: how they handle many trees

### Stardew Valley (XNA/MonoGame) — decompiled `TerrainFeatures/Tree.cs` (pre-1.6 decompile, version unverified)
Source: https://raw.githubusercontent.com/veywrn/StardewValley/master/StardewValley/TerrainFeatures/Tree.cs
- **Seasonal spritesheets, not palettes:** the texture is loaded as `"TerrainFeatures\\tree" + type + "_" + season`, so there is one sheet per tree type per season.
- **Sprite layout:** tree top source rect **48×96** px. Stump **16×32** at (32,96). Saplings at stages 0–2 use **16×16** cells, a young tree 16×32. Leaf particles are **8×8** from the same sheet. Everything is drawn at **4× scale** (64 px tiles). One texture per tree means top, stump, leaves and shadow all batch.
- **Occlusion fade (exact rule):** every tick `alpha = min(1, alpha + 0.05)`. Then, if `growthStage >= 5` and the player's bounding box intersects a rect starting one tile left and 5 tiles up of the trunk, sized **192×288 px** (3 tiles wide × 4.5 tall), it sets `alpha = max(0.4, alpha - 0.09)`. Net fade is −0.04/tick down to **0.4** (calc: about 15 ticks, ~0.25 s at 60 Hz). Recovery takes about 12 ticks (~0.2 s). Only the **tree top** gets `Color.White * alpha`.
- **Shake:** `maxShake = PI/128` for full-grown trees, `PI/64` for smaller ones, then decays. It rotates the top around its origin (24, 96), the bottom-centre. It spawns leaf particles.
- **Sorting:** SpriteBatch layer depth is roughly `bottomY / 10000`, the classic depth-key y-sort.
- Mod showing the vanilla fade defaults (MinimumOpacity example 0.4): https://github.com/Esca-MMC/TransparencySettings
- See it: https://stardewvalleywiki.com/Trees

### Factorio — Friday Facts
- FFF-86 (May 2015): **8 tree families × 10 variations**, and "exactly 5120" variants through colouring, which saves graphics memory. Leaves and trunk are separate graphics, so health shows as leaves thinning to a bare trunk. Pollution makes leaves fall and turn grey. Mining leaves a stump and particles instead of a falling animation, which is cheaper in memory. https://cf-www.factorio.com/blog/post/fff-86
- FFF-227 (Jan 2018): trees were single sprites with the shadow baked in, which wasted atlas space (empty pixels still sampled). Shadows were split out and **merged before drawing**, so overlapping shadows stop stacking into black. Deeper shadows were then painted into the leaves. Trees got mipmaps in 0.14. Total sprite VRAM was about 2.4 GB (the HD game, not trees alone). https://cf-www.factorio.com/blog/post/fff-227
- FFF-324 (Nov 2019): animated trees use a **distortion shader** whose offset map is the **leaf normal map's R/G channels**. Noise looked bad. Shadows sway using generated noise in a separate shader. Normal maps are BC5. There are **4 leaf stages** under pollution plus desaturation. https://factorio.com/blog/post/fff-324
- See it: https://factorio.com/blog/post/fff-324 (embedded videos)

### RimWorld — Plant rendering (modding wiki)
https://rimworldwiki.com/wiki/Modding_Tutorials/Plant_Rendering
- `maxMeshCount` gives 1/4/9/16/25 copies per cell (perfect squares ≤25). Copies are jittered and randomly flipped. Grass uses many copies, trees use 1.
- Growth scaling: `visualSizeRange` lerps with growth %. Example 1.0→3.0: 15% → 0.45, 100% → 3.0.
- Wind: `topWindExposure` from 0 to 1 (default 0.25) offsets the **top vertices** in code, stretching along x and z, so the base stays fixed.
- State variants: immature / leafless / polluted (one texture each) plus a snow overlay when snow exceeds 80% (1.6).
- Fall colours are done in the shader (CutoutPlant only): `_FallColorSource` HSV plus a `_FallColorDestination` gradient texture (`/Other/TreeFallGradient`) and `_FallTransitionRange`. In vanilla only deciduous trees use it. **This is a LUT-style seasonal recolour on one texture.**
- Gap: the claim that plants are "printed into section layer meshes" is not confirmed by this page.
- See it: same wiki page (comparison GIFs).

### Graveyard Keeper (Unity, 2.5D pixel art)
https://slava.lazybeargames.com/graveyard-keeper-how-the-graphics-effects-are-made
- Wind: a vertex shader shifts x by y. "The highest points are shaken most intensely". Phase comes from position. **Only specific leaves are animated**, not the whole crown.
- Shadows: about **10 reusable shadow sprites**, rotated in the vertex shader with the parameter passed through a **colour channel**, which keeps batching. Up to 4 shadows per object (sun + 3 nearest lights).
- Day/night uses **10 LUTs** (3D LUT stored as a 2D strip) made from Photoshop grades. Fog is several horizontal layers, so tree tops poke through.

### Minecraft — biome foliage tint
https://optifine.readthedocs.io/colormaps.html
- `foliage.png` is a **256×256** colormap. Lookup is `T = clamp(temp,0,1)`, `R = clamp(rain,0,1) * T`, so only a triangle is used. It tints leaves "with the exception of spruce and birch" (fixed colours).
- The pattern transfers directly: one grey-ish leaf sprite, tinted by (temperature, moisture), gives biome colour for free.

### Cornucopia (Unity, isometric) — chunked baking
https://gamedev.net/blogs/entry/2297829-cornucopia-raw-dev-log-1-gpu-instancing-or-how-2583-plants-became-3-draw-calls
- Merging plants per spatial cell took **2,583 draw calls down to 3**. Cells are 20 units (one viewport width), with ≤ **60,000 vertices per chunk** and 16-bit indices. Vertex colour R holds the normalised height, used as sway weight (squared). Shadows are off.

### Eastward / Sea of Stars
- Eastward (custom engine): hand-painted bump maps per asset. Levels are designed so the player is "never unintentionally obscured". https://www.gamedeveloper.com/art/eastward-s-creators-share-insights-on-making-pixel-art-adventures
- Sea of Stars: no technical source found (gap).

### Terraria
- Trees are trunk tiles plus separate treetop/branch sprites, with numbered variants per biome. Forest trees convert to Ebon/Shade/Pearlwood with the shape kept. Vanity trees replace forest trees with a 5% chance. https://terraria.wiki.gg/wiki/Trees

**Not researched (gaps):** Don't Starve, Kingdom, Valheim LOD, Tibia.

---

## Q8. Technique catalogue for Godot web (synthesis; cited numbers above, rest inference)

| Technique | How | Cost on Godot Compat/web | Evidence |
|---|---|---|---|
| One atlas + one material | All tree parts in a 1024–2048² sheet, Nearest filter | 1 batch for all unlit trees, up to 16,384 items per buffer | GLES3 source, docs |
| Split tree = trunk + canopy + shadow | Trunk y-sorted, canopy in a high layer, shadow in a ground layer | 3 batches total. Enables per-layer effects | Factorio FFF-227/86, Stardew |
| Seasonal palette/LUT | Index or greyscale texture plus a palette row per season/species. `instance uniform` picks the row and a stagger offset | 1 texture fetch + 1 LUT fetch per pixel. No extra VRAM per season | RimWorld fall gradient, Minecraft colormap |
| Seasonal sheets | One sheet per season (Stardew) | 4× VRAM, simplest art pipeline | Stardew Tree.cs |
| Leaf/trunk separation for states | Leaves can be removed or greyed for pollution, burnt, winter | 1 extra quad per tree | Factorio FFF-86/324 |
| Wind sway in shader | Vertex: `x += sin(t + worldPhase) * k * (1-UV.y)`. Or fragment UV-rotation around (0.5,1) | Negligible. Don't use unique materials | godotshaders, Graveyard Keeper |
| Normal-map distortion sway | Offset UV by the leaf normal's R/G × time | 1 extra texture fetch | Factorio FFF-324 |
| Occlusion fade (per tree) | Stardew rule: rect test, −0.04/tick to 0.4, +0.05/tick back | Only trees near the player run the check | Stardew Tree.cs |
| Occlusion cutout (shader) | Canopy shader uniform `player_pos`. Dither or alpha a circle of radius r if the canopy is in front (canopy_base_y > player_y) | One global uniform, zero per-tree script | inference (no shipped source found) |
| Chunked y-sort | 16×16-tile chunks. Set `visible=false` outside camera±1 | Sort cost grows with nearby trees, not world size | renderer_canvas_cull.cpp |
| Baked static chunks | Render far or static chunks into a texture (SubViewport) once, and keep live sprites only near the player | Trades VRAM (e.g., 256² × 4 B = 256 KB per chunk) for draw/sort cost | Cornucopia (mesh merge analogue) |
| Blob / sprite shadows | Shadow sprites from the same atlas. Merge overlaps with a shadow layer + CanvasGroup, or draw opaque into a low-alpha layer | Avoids LightOccluder2D. One CanvasGroup at most | Factorio FFF-227, Graveyard Keeper, Godot lights docs |
| Update throttling | VisibleOnScreenEnabler2D. Stagger tree logic (growth, season) by tick % N | CPU only | Godot docs |

**Gaps (overall):** no measured ms for Godot y-sort at scale, no WebGL2 MultiMesh2D numbers, GH-112481 details unknown, Sea of Stars/Don't Starve/Kingdom/Valheim unresearched. Suggested demo benchmark: N = 1k/5k/10k trees × {Sprite2D y-sorted, chunked y-sort, TileMapLayer y-sort, MultiMesh canopy}, measuring frame time on a phone browser.

**Side note:** Godot master docs say the `canvas_items` stretch mode "is the default for projects created starting in Godot 4.7". Pixel-art projects should set `viewport` stretch mode explicitly (and consider `snap_2d_transforms_to_pixel`). https://raw.githubusercontent.com/godotengine/godot-docs/master/classes/class_projectsettings.rst

---

## Sources
- Godot docs (raw rst, master): gpu_optimization, using_multimesh, 2d_lights_and_shadows, using_tilemaps, class_tilemaplayer, class_canvasitem, class_canvasgroup, class_visibleonscreennotifier2d, class_projectsettings, shading_language — https://github.com/godotengine/godot-docs (raw URLs above)
- Godot source (master): https://raw.githubusercontent.com/godotengine/godot/master/drivers/gles3/rasterizer_canvas_gles3.cpp ; https://raw.githubusercontent.com/godotengine/godot/master/servers/rendering/renderer_canvas_cull.cpp
- Godot 4.4 dev3 (2D batching RD): https://hackernoon.com/godot-44-dev-3-vertex-shading-2d-batching-and-more
- Godot 4.5 release: https://godotengine.org/releases/4.5/
- Godot 4.6 dev5: https://godotengine.org/article/dev-snapshot-godot-4-6-dev-5/
- Bunnymark thread: https://godotforums.org/d/29239-bunnymark
- Web pipeline case study: https://forum.godotengine.org/t/godot-4-web-export-stutters-on-mobile-its-probably-your-art-pipeline-not-your-code-31fps-to-60fps-benchmarks-inside/143268
- Canvas instance uniforms (pre-4.4): https://forum.godotengine.org/t/ways-to-mimic-per-instance-uniforms-for-canvas-item-shaders/64971
- Shaders: https://godotshaders.com/shader/2d-wind-sway/ ; https://godotshaders.com/shader/2d-tree-wind-trigger-hit-effect/
- Factorio: https://cf-www.factorio.com/blog/post/fff-86 ; https://cf-www.factorio.com/blog/post/fff-227 ; https://factorio.com/blog/post/fff-324
- Stardew decompiled Tree.cs: https://raw.githubusercontent.com/veywrn/StardewValley/master/StardewValley/TerrainFeatures/Tree.cs ; https://github.com/Esca-MMC/TransparencySettings
- RimWorld: https://rimworldwiki.com/wiki/Modding_Tutorials/Plant_Rendering
- Graveyard Keeper: https://slava.lazybeargames.com/graveyard-keeper-how-the-graphics-effects-are-made
- Minecraft colormaps: https://optifine.readthedocs.io/colormaps.html
- Cornucopia: https://gamedev.net/blogs/entry/2297829-cornucopia-raw-dev-log-1-gpu-instancing-or-how-2583-plants-became-3-draw-calls
- Eastward: https://www.gamedeveloper.com/art/eastward-s-creators-share-insights-on-making-pixel-art-adventures
- Terraria: https://terraria.wiki.gg/wiki/Trees
- Blocked/unfetched: stardewvalleywiki Modding:Wild_trees (not allowlisted), github.com/godotengine/godot/pull/112481 (not allowlisted), minecraft wiki via breezewiki (bot wall).
