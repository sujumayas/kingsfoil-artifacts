# 03 Shorelines, coasts and tile systems

Researcher angle: spatial techniques for water edges on a 32x32 tile grid, with tile counts, memory and per-frame costs. Target is Godot 4 Compatibility (WebGL2), top-down 3/4 pixel art, server-authoritative MMO.

Labels used below. "Cited" means a source says it. "Inference" means my own reasoning or arithmetic. Arithmetic assumes 32x32 RGBA8 tiles (4 KB each, uncompressed).

---

## Q1. Which autotile scheme for water-to-land edges?

### Takeaway
Use a dual-grid (corner-based, marching-squares) set. It needs 16 tiles per terrain pair, or 15 if the all-water case draws nothing, or 6 with rotation. It gives proper inner corners and diagonals, which a 4-neighbour 16-tile set cannot. The 47-tile blob gets the same shapes on a single grid but costs 3x the art. Godot's built-in terrain matcher is fine in the editor but slow and non-deterministic at runtime. Precompute tile indices yourself.

### Cited findings
- Blob set has 47 tiles. It is "a 47 tile subset of a 2-edge 2-corner Wang tileset". The full set has 2^8 = 256 tiles. Rule is "no tile has a blue edge between two yellow corners". A corner counts only when the surrounding edges are set. https://www.boristhebrave.com/permanent/24/06/cr31/stagecast/wang/blob.html (mirror of cr31.co.uk, the original domain no longer serves the page)
- Tiled terrain types. Corner set with 2 terrains has 16 tiles. Edge set has 16. Mixed set has 256, and the 47 blob is a reduced mixed set. Up to 254 terrains per set. The Terrain Brush routes through intermediate terrains (dirt to cobblestone through sand). Unified with Wang tiles in Tiled 1.5. https://doc.mapeditor.org/en/stable/manual/terrain/
- Dual grid. Render grid sits half a tile off the painted grid, so each rendered tile covers four painted cells. "The dual-grid way needs 15" vs blob that "needs 47 hand-drawn tiles". Diagonal is mask 9, a real diagonal piece. "Inner corners are unsolvable with edge information alone" on a 4-neighbour single grid. https://www.spritecook.ai/blog/dual-grid-tilesets-explained
- Sylves marching squares. One dual cell per vertex, four corner bits index a 16-entry array. With rotation "you only need to actually make 6 different tiles" (indices 0, 1, 3, 5, 7, 15). Saddle cases not discussed. https://boristhebrave.com/docs/sylves/1/articles/tutorials/marching_squares.html
- jess::codes Godot dual grid. A world TileMapLayer plus display TileMapLayer(s), driven by a C# Node2D and 16 hard-coded rules. "a maximum of only 16 tiles", down to 6 with symmetry. Checks 4 neighbours instead of 8. Author did no performance tests. Godot 4.4.1 Mono. Credits Oskar Stålberg and ThinMatrix. https://github.com/jess-hammer/dual-grid-tilemap-system-godot
- Stålberg popularised it. TileWorldCreator docs credit him and link his 2021 post (x.com/OskSta/status/1448248658865049605, not readable to me). https://giantgrey.gitbook.io/tileworldcreator-v4-documentation/dual-and-standard-grid
- Red Blob summary page lists 4-bit = 16, blob = 47, dual grid = 16, marching squares = 16, quarter-tile (mini-tile) = 5 shapes composited per quadrant, RPG Maker = 48 sub-tiles. Advice is to recompute masks only for changed cells and cache indices. It says frames can cycle "within the same bitmask index". https://www.redblobgames.com/articles/autotile/claude/ . Flag: the URL path suggests an AI-written draft, and one line (Godot "16 tiles in a minimal 3x3 mode") conflicts with Godot's own docs. Treat as secondary.
- Godot 4 terrain modes are "Match Corners and Sides", "Match Corners", "Match Sides", matching Godot 3 2x2, 3x3 and 3x3-minimal bitmasks. Peering bit -1 means empty. One tile can hold several terrains for transitions. https://docs.godotengine.org/en/stable/tutorials/2d/using_tilesets.html
- Godot terrain limits at runtime. Users on 4.2 to 4.5 report set_cells_terrain_connect blocking the main thread. One reports 4-5 ms per set_cell on a large map. Forum reply says it is "not intended to be used at runtime" and points to godot-proposals #7670 (determinism). Matching can depend on draw order. https://forum.godotengine.org/t/autotiling-extremely-slow-at-runtime-alternatives/66619 , https://forum.godotengine.org/t/large-2d-tilemap-causes-4-5ms-lag-on-setcell-invocation/126593 , https://github.com/dandeliondino/terrain-autotiler (deterministic replacement, unmaintained since 4/2024)
- Tibia (RME) borders. Each border in borders.xml is a list of edge-direction to sprite-ID entries, linked from grounds.xml. Posters say borders look ugly when more than 2 border types meet. https://otland.net/threads/adding-new-brush-in-rme-2-1.127897/ , https://otland.net/threads/requests-thread-rme-extensions.61602/latest
- Tibia shore layering. "borders in >7.6 are actually a combination of two overlapped ground tiles", one shore with water animation and one floor (grass, sand, snow). https://otland.net/threads/list-of-sprite-changes-between-7-4-and-7-72-7-6.285203/

### Inferences
- Art cost per terrain pair per animation frame. Blob 47 x 4 KB = 188 KB. Dual grid 16 x 4 KB = 64 KB. Dual grid with runtime rotation, 6 x 4 KB = 24 KB. Rotation is only safe if lighting in the art is direction-free, which 3/4 view usually breaks (the south edge of a coast shows a bank face, the north edge does not). So plan on 15 or 16 drawn tiles.
- Tibia's approach is a third option. Draw the shore as overlay tiles placed on the land cell (edge and corner pieces only, about 12 pieces: 4 edges, 4 outer corners, 4 inner corners) over a full water or full land ground. This keeps the water ground tile unbroken and lets one shore set sit over any floor. Count is from the edge/corner logic, not from a cited Tibia number.
- Mask cost is trivial. Dual grid reads 4 cells per display cell, blob reads 8. For a 256x256 map, a full rebuild is 65,536 lookups, done once at load. Edits touch 4 display cells (dual grid) or 9 cells (blob).
- For an MMO, store only the terrain bit per cell on the server. Clients derive edge tiles. That keeps map data at 1 byte or less per cell and avoids sending tile IDs.

### Gaps
- No measured timing for jess::codes dual grid vs Godot terrains.
- Stålberg's original post not read. Saddle handling (diagonal checkerboard, mask 5 and 10) has no cited rule. Common choice is to always resolve toward water or toward land, consistently.
- Exact Tibia shore sprite counts per border not found.

---

## Q2. Corners and diagonals

### Takeaway
Inner corners are the failure point. Four-neighbour (edge) sets cannot draw them. Blob fixes it by reading diagonals only when both adjacent edges match. Dual grid fixes it by construction, and gives a diagonal piece (mask 6 or 9) for free.

### Cited findings
- 4-bit cannot tell inner from outer corners. 8-bit reads diagonals only when both adjacent cardinals are present. https://www.redblobgames.com/articles/autotile/claude/ (secondary, see flag above)
- "If either corner is yellow then the edge centre is yellow." https://www.boristhebrave.com/permanent/24/06/cr31/stagecast/wang/blob.html
- Dual grid diagonal is mask 9 and is a real diagonal piece. https://www.spritecook.ai/blog/dual-grid-tilesets-explained

### Inferences
- In 3/4 view the four sides of a shore are not symmetric. South-facing shores (water below land) should show a short bank or cliff lip. North-facing shores show flat sand into water. This doubles the corner variants you would otherwise rotate.
- Single-cell water (1x1 pond) and one-tile-wide channels are where blob sets break down visually. Dual grid handles both with the same 16 tiles.

### Gaps
- No artist write-up found on 3/4-specific corner sets.

---

## Q3. Animating shore tiles. Synced frames or per-tile offsets?

### Takeaway
Classic games sync everything. Pokémon Emerald swaps whole tile banks on a global timer, so every shore tile shows the same frame. That is cheap and reads as a coherent sea. Desync (random start) helps for open water but breaks the continuity of a foam line running along a coast, because neighbouring edge tiles must line up at their seams. Keep shore frames synced, and if you want variation, offset phase by distance from shore (Q5) instead of randomly.

### Cited findings
- pokeemerald General tileset (src/tileset_anims.c). Counter wraps at 256. Each animation advances on its own slot of `timer % 16`.
  - Water. 8 frames, 30 tiles copied, `timer % 16 == 1`.
  - Sand/water edge. 8 steps (7 distinct images, Frame0 repeated), 10 tiles.
  - Land/water edge. 4 frames, 10 tiles.
  - Waterfall. 4 frames, 6 tiles.
  - Flower. 4 steps (3 images).
  https://raw.githubusercontent.com/pret/pokeemerald/master/src/tileset_anims.c
- Godot 4 TileSetAtlasSource. TILE_ANIMATION_MODE_DEFAULT "start at same time, looking identical". RANDOM_START_TIMES "start at random times, looking varied". Per-frame duration, speed, columns are settable. https://docs.godotengine.org/en/stable/classes/class_tilesetatlassource.html
- Tibia 7.4. "Water in 7.4 is an animation of 16 steps of 8 sprites. Add one layer when it comes to borders." https://otland.net/threads/list-of-sprite-changes-between-7-4-and-7-72-7-6.285203/ . On border corners, "A single corner has 2 layers, that grid, 16 animations." https://otland.net/threads/233554/ (forum users, not official)
- Free shoreline wave tiles (Eldiran, CC0, 16x16) are drawn as overlays, brown replaced by the land surface, magenta by water. https://opengameart.org/content/animated-ocean-tileset (page returned 403 to me; description from search snippet)
- A paid beach pack lists "16 frames - animated" shoreline strips. https://boxrobotstudios.itch.io/pixel-asset (vendor listing)

### Inferences
- pokeemerald timing, assuming the counter ticks once per GBA frame (59.73 Hz). 16 ticks = 0.27 s per frame. 8-frame water and sand-edge loops = 128 ticks = 2.1 s. 4-frame loops = 1.07 s. The shore moves at the same rate as open water but on a staggered tick, so the CPU never copies more than one bank per frame. I did not verify the per-frame increment in the source.
- Memory at 32x32. Dual-grid shore set of 16 tiles x 8 frames = 128 tiles = 512 KB RGBA, or about 128 KB with a 256-colour indexed texture. Tibia-style 16-frame borders double that.
- In Godot, animated atlas tiles cost nothing per frame on the CPU. The TileMapLayer picks the frame from global time in the shader path. Large numbers of animated tiles do not add draw calls if they share one atlas.

### Gaps
- No cited Tibia frame duration (ms) for shore borders.
- No official Tibia sprite pattern sizes (the "4x4 grid" idea is unverified).

---

## Q4. Waves lapping on sand, foam lines, wet sand band

### Takeaway
Three layers make a beach read. (1) A foam line that runs up the sand and retreats. (2) A darker wet-sand band left behind that fades. (3) Shallow tint on the water side. In a tile engine this is an 8-frame overlay strip with a 2 to 4 s period. In a shader it is one sine of (distance-to-shore minus time), masked to a band.

### Cited findings
- Shader pattern. Bake a distance field, use it as phase for waves moving to shore, mask with smoothstep for foam. Godot forum example remaps a tile-based distance into animated stripes, displaced by noise, at a cost of "9*4=36 texelFetch()" per pixel when computed live. https://godotforums.org/d/33008/25 (thread failed to load fully, figure from search snippet)
- Foam rings from smoothstep on water-side SDF, modulated by noise. https://forums.unrealengine.com/t/distance-field-based-foam-for-water-shader/133034/4
- Stylised water uses a hard band at the top of the height range as foam crests. https://gamedev.net/shaderlab/37-stylized-water-surface/
- Pixel artist note on waves. Base on sine motion, and crests "are actually slightly steeper" than dips. Waterfall sparkle is "a 6 frame loop". Reflection effect loops on 2 s. https://www.slynyrd.com/blog/2018/10/12/pixelblog-10-water-in-motion
- Pokémon Emerald sand/water edge has its own 8-step animation separate from the land/water edge (4 frames). https://raw.githubusercontent.com/pret/pokeemerald/master/src/tileset_anims.c

### Inferences (suggested parameters to test in the demo)
- Period 3 to 5 s per wave cycle at 320x180. Real swash runs 5 to 15 s, which feels sluggish on screen. Pokémon's 2.1 s is the fast end.
- Frames. 8 for the foam run-up (frames 0-4 advance 1 to 3 px each up the sand, frames 5-7 retreat and thin out). Wet band fades over 2 frames after retreat. Use 3 palette shades for sand (dry, damp, wet), so the wet band is a palette swap, not new art.
- Shader version. `phase = d_shore * k - t * w` with k chosen so 2 to 3 bands fit in the shallow zone. Foam where `fract(phase)` is in a narrow band and `d_shore < shallow_width`. Wet sand where land-side distance < run-up length and `sin(t*w)` was recently high. Quantise output to the palette (see #1 Snow and #2 Acid palette select).
- Cost of the shader version, if distance is baked to a texture, is 1 to 2 texture reads per pixel. At 320x180 that is 57,600 pixels, trivial even on low-end WebGL2.

### Gaps
- No primary source gives frame counts and seconds for a shipped game's beach swash beyond Pokémon Emerald. Stardew Valley, Eastward, Sea of Stars beaches not checked.

---

## Q5. Distance-to-shore fields on the tile grid

### Takeaway
Compute it once per map on the CPU (or server) with multi-source BFS over tiles, store as one byte per tile, upload as a tiny R8 texture with linear filtering. That gives smooth per-pixel distance for foam, depth colour and wave phase at almost no runtime cost. Jump flooding is the GPU option and works in WebGL2 fragment passes, but it is overkill for a static coast.

### Cited findings
- Jump flooding (Rong and Tan, SI3D 2006) takes log2(N) full-screen fragment passes, step size halving each pass, each pixel checks 8 neighbours plus itself. Approximate, with small errors. JFA+1 and JFA+2 reduce errors. Cost depends on output pixel count, not geometry. https://blog.demofox.org/2016/02/29/fast-voronoi-diagrams-and-distance-dield-textures-on-the-gpu-with-the-jump-flooding-algorithm/ , https://en.wikipedia.org/wiki/Jump_flooding_algorithm , https://observablehq.com/@rreusser/gpu-voronoi-diagrams-using-the-jump-flooding-algorithm
- Chamfer distance (Borgefors) uses two raster scans. Weights 3 and 4 approximate 3x Euclidean because the optimal diagonal ratio is close to 4/3. Coarser than exact Euclidean. https://www.cs.auckland.ac.nz/~rklette/Books/MK2004/pdf-LectureNotes/08slides.pdf , https://infoscience.epfl.ch/record/86619/files/Cuisenaire1999_268.pdf
- Exact Euclidean in linear time exists (Felzenszwalb and Huttenlocher). https://en.wikipedia.org/wiki/Distance_transform

### Inferences
- BFS on a 256x256 tile map is 65,536 cells, each visited once, O(N). Expect well under 10 ms in C# or C++, maybe tens of ms in GDScript. Do it at map load or bake offline. Unmeasured.
- Chamfer 3-4 is the same O(N), two passes, no queue, and gives rounder distances than 4-neighbour BFS (BFS with 4 neighbours gives diamond-shaped bands that look wrong around headlands). 8-neighbour BFS gives square bands. Chamfer is the best cheap choice for looks.
- Store signed distance, clamped to about +-8 tiles, in a byte (128 = shoreline). 256x256 map = 64 KB. Upload as R8 texture, sample with linear filtering, scale by 32 px per tile. Bilinear on a 1-texel-per-tile field gives per-pixel smooth bands with no per-pixel loops, which avoids the 36-texelFetch cost of computing distance in the shader.
- Uses from one field. Depth colour bands (shallow, mid, deep) as palette steps by distance. Foam where distance is near 0. Wave phase = distance minus time. Fish spawn and "shallow walkable" rules can read the same byte on the server.
- JFA at 256x256 is 8 passes. Only needed if the coast changes every frame (dynamic flooding). For tides, recompute only the changed band with BFS, or precompute per tide level.

### Gaps
- No measured BFS or chamfer timings in Godot.

---

## Q6. Tides as a global water level against a height map

### Takeaway
Store a height per tile (or per corner for dual grid). Water is wherever height < level. Tide is a single number from the server, or better a period and epoch so every client computes the same level from server time. Because walkability changes, the server must own the rule. Keep tide steps coarse (3 to 5 discrete levels) so the autotile rebuild happens a few times per cycle, not every frame.

### Cited findings
- Rain study #3 already uses "depth mask vs flood level" for puddles. Same idea at sea scale. https://kingsfoil-artifacts.netlify.app/vfx-rain-topdown-pixel
- Tide-based reveal of paths is a known mechanic. "The receding sea reveals hidden paths and exclusive resources" (Tide or Hide store listing). https://gg.deals/game/tide-or-hide/ . TV Tropes Tide Level lists water that "rises and falls throughout the level". https://tvtropes.org/pmwiki/pmwiki.php/Main/TideLevel
- Godot runtime terrain rebuild is slow (4-5 ms per call reported). https://forum.godotengine.org/t/large-2d-tilemap-causes-4-5ms-lag-on-setcell-invocation/126593

### Inferences
- With per-corner height and the dual grid, the tide level is the marching-squares iso value. Changing it only changes which display tiles are chosen. No new art.
- Per-step cost. Only cells whose height lies between the old and new level change. With a beach slope of 1 height unit per 2-3 tiles and 1-unit steps, a tide step touches a band 2-3 tiles wide along the coast, a few hundred cells on a 256x256 map. Use your own index cache and set_cell, not set_cells_terrain_connect.
- Smooth visual tide between steps. Pass a fractional level as a shader uniform and shift the wet-sand and foam bands with it, while the tile grid steps discretely. Players see continuous motion and the server rules stay on whole tiles.
- MMO sync. Send `tide_epoch` and `tide_period` once at login (for example 20 to 40 real minutes per cycle). Server applies walkability changes at the same step boundaries and pushes players off newly flooded tiles. Tibia itself has no tides as far as I found.

### Gaps
- No shipped top-down 2D MMO tide implementation found. Stranded Deep and Don't Starve Shipwrecked were candidates. The Klei forum thread on coastlines and tides returned 403.

---

## Q7. Coast generation from heightmaps and noise

### Takeaway
Red Blob's recipe is the standard. Sum noise octaves, redistribute with a power, shape into islands with a distance function, threshold at sea level, then band the next small range above sea level as beach. Cliffs vs beaches come from slope at the shoreline.

### Cited findings
- Octaves `e = 1*noise(1x) + 0.5*noise(2x) + 0.25*noise(4x)`, normalised by 1.75. Playground uses 6 octaves at frequencies 1 to 32. Redistribution `pow(e, exponent)`, fudge factor 1.2 in the demo. Island shaping `e = lerp(e, 1-d, mix)`, mix about 0.5, with square bump `d = 1-(1-nx²)(1-ny²)` or Euclidean² `d = min(1,(nx²+ny²)/sqrt(2))`. Water if `e < waterlevel`, "a threshold between 0.2 and 0.5 work well". Biome bands `e < 0.1` water, `e < 0.2` beach, or ocean below 0.1 and beach below 0.12. https://www.redblobgames.com/maps/terrain-from-noise/
- Falloff map variant. Distance from centre raised to an exponent, subtracted from noise. https://rosetta.to/u/sebastianlague/procedural-landmass-generation-e11-falloff-map , smootherstep falloff for gentler coasts https://devforum.roblox.com/t/help-with-procedural-generation-falloff-filter/1607541

### Inferences
- Beaches by slope. At each shore tile, compute the height gradient on the land side over 2 tiles. Gentle (rise < 0.03 per tile in Red Blob units) gives sand beach and the wave overlay. Steep gives cliff or rock edge and no swash, only foam splash. This also decides walkability (beach walkable to shallow water, cliff blocks).
- Run generation on the server at world creation and save the height byte per tile. Clients derive coast tiles, distance field and tide state from that one array.

### Gaps
- No source measured slope thresholds for beach vs cliff. Values above are a starting point.

---

## Q8. Cliffs vs beaches in 3/4 view

### Takeaway
In 3/4 view a south-facing cliff has a visible vertical face 1 to 2 tiles tall. Water meets the bottom of that face, not the top. So the water's edge tile is drawn against the cliff base, with a foam strip and no run-up. North-facing cliffs hide their face, and the water edge sits at the cliff top line. Beaches only need a flat transition.

### Cited findings
- Tibia RME "mountain" borders are a separate border class from water borders, combined via border layers. https://otland.net/f50/hills-extension-dirt-mountains-created-mackan-12455/
- RME users report visual breakage when more than 2 border types share neighbouring tiles. https://otland.net/threads/requests-thread-rme-extensions.61602/latest

### Inferences
- Treat cliff-water as its own terrain pair (cliff face to water) with its own small set. Edge foam is a 2 to 4 frame splash strip at the base, synced, faster than beach swash (about 1 s loop) to read as waves hitting rock.
- Dual grid cannot express height on its own. Use a second display layer for the cliff face, drawn one tile south of the height change, as in most 3/4 tilesets.
- Never run the beach swash overlay on cliff tiles. Gate it with the slope class from Q7.

### Gaps
- Biggest gap of this angle. No cited artist breakdown of water-against-cliff in 3/4 pixel art. Worth checking Eastward, Chained Echoes, Sea of Stars, and Tibia's coastal cliffs by video before the demo.

---

## Cost summary (inferences unless cited)

| Item | Count / size | Per-frame cost |
|---|---|---|
| Blob set per terrain pair | 47 tiles, 188 KB per frame at 32x32 RGBA | 8 neighbour reads per changed cell, edit-time only |
| Dual grid per pair | 15-16 tiles (6 with rotation), 64 KB per frame | 4 reads per changed display cell |
| Shore animation | 8 frames (Pokémon), 16 (Tibia 7.4 forum claim) | zero CPU in Godot atlas animation |
| Distance field | 1 byte per tile, 64 KB at 256x256 | one texture read per pixel |
| JFA (if dynamic) | log2(N) passes, 8 at 256 | 8 full-res fragment passes |
| Tide step | few hundred cells per step | one-off rebuild, not per frame |
| Godot set_cells_terrain_connect | n/a | 4-5 ms per call reported on large maps |

---

## Sources
- https://www.boristhebrave.com/permanent/24/06/cr31/stagecast/wang/blob.html
- https://doc.mapeditor.org/en/stable/manual/terrain/
- https://www.spritecook.ai/blog/dual-grid-tilesets-explained
- https://boristhebrave.com/docs/sylves/1/articles/tutorials/marching_squares.html
- https://github.com/jess-hammer/dual-grid-tilemap-system-godot
- https://giantgrey.gitbook.io/tileworldcreator-v4-documentation/dual-and-standard-grid
- https://www.redblobgames.com/articles/autotile/claude/ (secondary, flagged)
- https://docs.godotengine.org/en/stable/tutorials/2d/using_tilesets.html
- https://docs.godotengine.org/en/stable/classes/class_tilesetatlassource.html
- https://forum.godotengine.org/t/autotiling-extremely-slow-at-runtime-alternatives/66619
- https://forum.godotengine.org/t/large-2d-tilemap-causes-4-5ms-lag-on-setcell-invocation/126593
- https://github.com/dandeliondino/terrain-autotiler
- https://raw.githubusercontent.com/pret/pokeemerald/master/src/tileset_anims.c
- https://otland.net/threads/list-of-sprite-changes-between-7-4-and-7-72-7-6.285203/
- https://otland.net/threads/233554/
- https://otland.net/threads/requests-thread-rme-extensions.61602/latest
- https://otland.net/threads/adding-new-brush-in-rme-2-1.127897/
- https://otland.net/f50/hills-extension-dirt-mountains-created-mackan-12455/
- https://opengameart.org/content/animated-ocean-tileset (403 to me)
- https://boxrobotstudios.itch.io/pixel-asset
- https://www.slynyrd.com/blog/2018/10/12/pixelblog-10-water-in-motion
- https://godotforums.org/d/33008/25 (partial load)
- https://forums.unrealengine.com/t/distance-field-based-foam-for-water-shader/133034/4
- https://gamedev.net/shaderlab/37-stylized-water-surface/
- https://blog.demofox.org/2016/02/29/fast-voronoi-diagrams-and-distance-dield-textures-on-the-gpu-with-the-jump-flooding-algorithm/
- https://en.wikipedia.org/wiki/Jump_flooding_algorithm
- https://observablehq.com/@rreusser/gpu-voronoi-diagrams-using-the-jump-flooding-algorithm
- https://www.cs.auckland.ac.nz/~rklette/Books/MK2004/pdf-LectureNotes/08slides.pdf
- https://infoscience.epfl.ch/record/86619/files/Cuisenaire1999_268.pdf
- https://en.wikipedia.org/wiki/Distance_transform
- https://www.redblobgames.com/maps/terrain-from-noise/
- https://rosetta.to/u/sebastianlague/procedural-landmass-generation-e11-falloff-map
- https://devforum.roblox.com/t/help-with-procedural-generation-falloff-filter/1607541
- https://gg.deals/game/tide-or-hide/
- https://tvtropes.org/pmwiki/pmwiki.php/Main/TideLevel
- https://kingsfoil-artifacts.netlify.app/vfx-rain-topdown-pixel

Blocked or failed. cr31.co.uk original (domain only), web.archive.org (tool refused), tibia.fandom.com (402), opengameart.org (403), kleiforums.com (403), godotforums thread (partial).
