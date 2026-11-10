# 04. Rivers, flow and water simulation for tile games

Researcher angle: per-tile flow, currents, river generation, waterfalls, cheap 2D water sims and their tick costs.
Study #7 (bodies of water). Puddle flow and the two-buffer ripple are in #3 Rain. Steam and lava are in #6 Fire.

---

## Q1. How do tile engines store and step flowing water?

### Takeaway
Shipped tile games use a small integer level per cell (Minecraft 0-8, Dwarf Fortress 0-7) and step it slowly (Minecraft 1 block per 5 ticks, ONI 5 ticks/s). Direction is derived, not stored. Minecraft picks the side with the nearest drop within 4 blocks. For a server-authoritative MMO like Asterion the lesson is to keep rivers static (authored direction per tile) and simulate only small, local, event-driven water.

### Cited findings
- Minecraft. Source blocks are level 0, flowing water is 1-7, level 8 marks falling water. Rendered height is level/9, so 0.889 to 0.111 block. https://minecraft.wiki/w/Water
- Minecraft spreads "1 block every 5 game ticks", 4 blocks/s at 20 ticks/s. Max horizontal spread is 7 blocks. https://minecraft.wiki/w/Water
- Minecraft flow direction. Each side starts at weight 1000. The game searches up to 4 blocks for a drop, sets the weight to the shortest distance, and spreads only to the lowest-weight sides. https://minecraft.wiki/w/Water
- Minecraft current pushes mobs and players at about 1.39 m/s (25 blocks per 18 s). https://minecraft.wiki/w/Water
- Minecraft infinite source rule. A flowing cell becomes a source if it touches 2+ sources horizontally and sits on a solid or source block. https://minecraft.wiki/w/Water
- Dwarf Fortress. Depth 0-7 per z-level, 0 means dry. Dwarves wade to depth 3, cancel jobs and start swimming at 4+, and unskilled dwarves drown at 7 (v0.34 wiki, may be outdated). https://dwarffortresswiki.org/index.php/v0.34:Water (seen via search snippet; the wiki returned HTTP 429 to direct fetches)
- DF pressure. Water under pressure moves only to orthogonal neighbours. A diagonal gap breaks pressure. Pressure fills to the source's level, no higher. https://dwarffortresswiki.org/index.php/Pressure (search snippet, 429 on fetch)
- DF flow pushes items. Strong flow moves stones, logs and corpses. Weak flow (about 1/7 per step) moves only light items. Water created in place by a river or pump does not push items. https://dwarffortresswiki.org/index.php/40d:Flow (search snippet)
- Terraria stores a partial liquid amount per tile. Liquid falls, then spreads sideways into partial tiles, and spreads too thin disappear. Worlds settle all liquid at load ("Settling liquids"). A bucket needs 100/255 of a tile in a 3x3 area. https://terraria.wiki.gg/wiki/Liquids
- Oxygen Not Included runs 5 ticks/s (0.2 s per tick). https://oxygennotincluded.wiki.gg/wiki/Units
- ONI water max is 1000 kg per tile, minimum 10 g. Community analysis models horizontal flow as a fraction of the mass difference, clamped by max and min flow (water viscosity 125, min flow 0.01). Community-reported, not official. https://kleiforums.com/forums/topic/111451-oniversity-hydrodynamics-a-complete-description-of-horizontal-flow-for-a-single-layer-of-liquid-over-a-solid/
- Noita. Each liquid pixel tries down, then left or right. Density compares and swaps pixels. The world updates bottom-up, split into 64x64 chunks, each with a dirty rect. Four checkerboard passes allow threads without locks, with moves capped at 32 px past the chunk. https://80.lv/articles/noita-a-game-based-on-falling-sand-simulation/ . Talk: Petri Purho, GDC 2019 "Exploring the Tech and Design of Noita" https://gdcvault.com/play/1025695/Exploring-the-Tech-and-Design
- Factorio dropped per-pipe propagation in 2.0. Pipes merge into "segments" holding one fluid. The devs call it "a fairly large step back" in realism, in exchange for predictability. https://cf-www.factorio.com/blog/post/fff-416
- w-shadow's mass-based CA (2009). Each cell holds a float mass. A cell may hold a little extra mass (MaxCompress) relative to the cell above, so pressure emerges. Flows above MinFlow are halved for smoothness. Exact constants not retrieved. https://w-shadow.com/blog/2009/09/01/simple-fluid-simulation

### Inferences
- Two families exist. Integer level CA (Minecraft, DF) is cheap and stable, and looks stepped. Float mass CA (Terraria, ONI, w-shadow) looks smooth and needs min-flow clamps to stop endless jitter and mass drift (Terraria's "volume gain" duplication is a symptom).
- Dirty-cell or dirty-chunk tracking (Noita) matters more than the rule. A settled river costs zero when nothing touches it.
- Cost sketch for Asterion: a 320x180 screen at 32 px tiles is 10x6 tiles. Even a 64x64 tile local sim is 4,096 cells. At 4 neighbour checks per cell that is about 16k ops per tick, well under 0.1 ms in JS or GDScript-in-C++ terms. Untested estimate.
- Server sim in an MMO. Shared water that changes over time must live on the server and be broadcast. Keep it event-driven (a dam breaks, a bucket is poured) and let it settle, like Terraria's load-time settle.

### Gaps
- No ms-per-tick figures for any shipped game. DF wiki fetches returned HTTP 429, so DF numbers come from search snippets. Noita's exact liquid rules beyond down/sideways were not confirmed. w-shadow constants not retrieved (404).

---

## Q2. How do currents push players, items and boats on a tile grid?

### Takeaway
Pokemon Emerald is the cleanest tile model. A current tile has a fixed direction, and stepping onto it starts a forced move at a faster speed than surfing, chained tile to tile until the player lands on a non-current tile or hits something. No physics, just a lookup. That maps directly onto a server-authoritative 32 px grid.

### Cited findings (pokeemerald decompilation)
- Metatile behaviours include `IsSouthwardCurrent`, `IsNorthwardCurrent`, `IsWestwardCurrent`, `IsEastwardCurrent` and `IsWaterfall`. Each maps to a forced movement handler. The waterfall tile reuses the south current handler. https://github.com/pret/pokeemerald/blob/master/src/field_player_avatar.c
- `DoForcedMovement` checks collision in the push direction. If blocked, forced movement ends and the player regains control. Otherwise the player moves one tile with `PlayerRideWaterCurrent`. https://github.com/pret/pokeemerald/blob/master/src/field_player_avatar.c
- Speeds, from the source comments. Walking is MOVE_SPEED_NORMAL, surfing is FAST_1, "water current / acro bike" is FAST_2. https://github.com/pret/pokeemerald/blob/master/src/event_object_movement.c
- Step tables. NORMAL is 16 steps of 1 px. FAST_1 is 8 steps of 2 px. FAST_2 is 6 steps of 2,3,3,2,3,3 px, so 16 px in 6 frames. https://github.com/pret/pokeemerald/blob/master/src/event_object_movement.c
- Hoenn Route 133 and 134 have strong westward currents. Route 133 is westbound only while surfing. https://bulbapedia.bulbagarden.net/wiki/Route_134 , https://bulbapedia.bulbagarden.net/wiki/Route_133 . See it in action: https://bulbapedia.bulbagarden.net/wiki/Route_134
- Zelda Wiki says currents block normal movement against the flow, while dashing gives some control. Game not named in the snippet. https://zeldawiki.wiki/wiki/Current . A Link to the Past whirlpools are warps between bodies of water. https://zeldawiki.wiki/wiki/Whirlpool_Waterway . Link's Awakening has a raft "Rapids Ride". https://zeldawiki.wiki/wiki/Rapids
- Minecraft pushes entities continuously at about 1.39 m/s. https://minecraft.wiki/w/Water

### Inferences
- Pokemon frame times at about 60 fps on 16 px tiles: walk 16 frames/tile (about 3.75 tiles/s), surf 8 frames (7.5 tiles/s), current 6 frames (10 tiles/s). Current is 1.33x surf speed. Derived from the step tables, not stated in source.
- For Asterion (Tibia-style step timing): give each current tile a direction and a step delay. The server queues a forced step every N ms while the player stands on it. Let player input override only if the input is perpendicular or "with" the flow, or at a speed penalty against it. Items on a current tile can drift one tile per K seconds on the same rule (DF style: heavy items do not move).
- Boats. Treat a boat as an entity that gets the same forced step, plus player steering. A raft ride (Link's Awakening) is a scripted path over current tiles.
- Visual tie-in. The current direction byte also selects the client's scroll direction for the river tile, so the art and the push always agree.

### Gaps
- Tibia has no player-pushing water currents that I could confirm. Not searched in depth. Zelda currents not tied to a specific title.

---

## Q3. How do generators place rivers?

### Takeaway
All the good methods are "drain downhill, then accumulate". Make sure every land cell has a downhill path to the sea (fill or route around pits), point each cell at its lowest neighbour, sum upstream area or rainfall, and draw a river where the sum passes a threshold. Width comes from the sum, or from Strahler order.

### Cited findings
- Amit Patel (2010 polygon maps). Rivers follow the corner graph, not polygon centres. Pick random high corners and walk downhill to the ocean. Elevation always rises away from the coast, so there are no local minima. Lakes are kept flat, so rivers flow in and out. https://simblob.blogspot.com/2010/09/polygon-map-generation-part-2.html , https://www.redblobgames.com/maps/polygon-map-generation/
- Patel sets moisture from distance to rivers and lakeshores, then biomes from moisture. https://www.redblobgames.com/maps/polygon-map-generation/
- mapgen4 simulates evaporation, wind and rainfall to get rivers. The `lg_min_flow` slider sets how small a stream is drawn. https://www.redblobgames.com/maps/mapgen4/
- Red Blob river growing. Triangles are Source, Bend or Fork, forming a binary tree. BFS from the border with a noise-biased order (BFS/Dijkstra hybrid) guarantees every path reaches the edge. Strahler number sets thickness. Tree build runs at about 1-3 M triangles/s and Strahler at 4-7 M nodes/s in JS on a 2013 laptop. https://www.redblobgames.com/x/1723-procedural-river-growing/
- mewo2 fantasy maps. Rivers are drawn only where flux passes a threshold, linking each point to its downstream neighbour. https://mewo2.com/notes/terrain (fetch returned 404; summary from search snippet)
- Azgaar's generator calculates flux and flow and makes lakes in depressions. https://github.com/Azgaar/Fantasy-Map-Generator , wiki mirror https://git.korz.dev/backups/Fantasy-Map-Generator/src/commit/05c53d276aaa1153f8d61c6ab515f79fccd6744f/wiki/Generation-Process.md , overview https://deepwiki.com/Azgaar/Fantasy-Map-Generator/2.3-rivers-and-water-features

### Inferences (tile-grid recipe)
1. Heightmap on the tile grid. Fill pits (priority-flood from the coast), or turn them into lakes like Azgaar.
2. D8 or D4 downhill pointer per tile. D4 suits orthogonal tile art and Tibia-style 4-way borders.
3. Accumulate. Visit tiles from high to low, add each tile's rain to its downstream tile.
4. River where accumulation > T. Width 1 tile up to Strahler 2, 2 tiles at 3, 3+ at 4.
5. The downhill pointer becomes the per-tile flow direction for scroll art and currents (Q2). Steep drops along the path become waterfall or rapids tiles. Roads crossing at low accumulation become fords, at high accumulation bridges.
- Cost is one sort and two linear passes. A 1024x1024 tile world is about 1 M cells, under a second offline in any language. Untested estimate.

### Gaps
- Patel's 2010 Stanford page refused connection. No hard numbers on river counts or threshold values were retrieved.

---

## Q4. Waterfalls, rapids, bridges and fords in top-down 3/4

### Takeaway
A pixel waterfall has three parts, mouth, falling strip and splash, with the splash looping in sync with the flow. In top-down 3/4 the falling strip is a vertical tile column on a cliff face that scrolls down, and the base gets a foam ring plus a few mist particles. Pokemon treats a waterfall tile as a south current that blocks upstream travel without the Waterfall move.

### Cited findings
- Raymond Schlitter splits a waterfall into mouth, flow and splash. The mouth is brighter with more reflections. Vertical bands sag and darken as they fall, then break up at the base. The sparkle surface is a 6-frame loop. Splash "loops in sync with the flow". River flow uses pulsing lines. https://www.slynyrd.com/blog/2018/10/12/pixelblog-10-water-in-motion
- Slynyrd top-down tiles. Two alternating water frames already read as animated water. https://slynyrd.com/blog/2023/3/26/pixelblog-43-top-down-tiles-part-2
- Mark Ferrari's waterfalls move by colour cycling, not pixel animation (secondary source). https://www.schoolofmotion.com/training/viewer/8-bit-after-effects
- Effect animations follow expansion, dispersion, fade, in 3-6 frames. Applies to splash and mist puffs. https://pixnote.net/en/learn/animation
- pokeemerald maps `IsWaterfall` to the southward current handler. https://github.com/pret/pokeemerald/blob/master/src/field_player_avatar.c
- Tibia has a Waterfall Quest behind a waterfall near Port Hope, added in 8.10 (2007 Christmas update). https://tibiaqa.com/26382/is-there-any-information-on-the-waterfall-quest
- Flow maps for river surfaces (Valve, Vlachos SIGGRAPH 2010). Two phase-offset layers lerped to hide the reset, with a noise offset per pixel to hide pulsing. https://www.advances.realtimerendering.com/s2010/Vlachos-Waterflow(SIGGRAPH%202010%20Advanced%20RealTime%20Rendering%20Course).pdf . Probably covered in depth by the flow-map researcher.

### Inferences
- Waterfall build for 32 px tiles. A 1-tile-wide strip of 2-4 tiles tall, scrolled down at 32-64 px/s via UV offset (or palette cycling of 4-8 band colours). Mouth tile has a fixed bright lip. Base tile carries a 4-6 frame foam ring and spawns 1-3 white mist pixels per 100 ms that rise and fade over 0.5-1 s. Untested numbers.
- Rapids are river tiles where the slope (height drop along the downhill pointer) is high. Swap in a white-water tile set with faster scroll (2x river speed) and add the current push from Q2.
- Sound. A looping waterfall bed scaled by distance in tiles, louder than river ambience. Not researched.
- Fords are walkable shallow tiles on a low-accumulation crossing. Bridges are walkable object tiles over deep river tiles. Both fit Tibia's "shallow walkable, deep blocking" rule.

### Gaps
- No primary source for top-down waterfall scroll speeds or mist particle counts. No Tibia waterfall tile frame count found.

---

## Q5. Cheap 2D shallow water and height-field sims

### Takeaway
Two simple models cover everything a 2D game needs. The height-field wave model (Müller) gives waves and ripples with 2 floats per cell. The virtual pipes model (O'Brien and Hodgins 1995, Mei et al. 2007) moves actual water volume between cells, so it can fill basins, break dams and flow downhill. Both are a 4-neighbour stencil and run in well under 1 ms at game grid sizes on CPU. Neither needs compute shaders.

### Cited findings
- Müller height field. Each column stores height h and velocity v. a = c^2/s^2 * (sum of 4 neighbours - 4h). Then v += dt*a, h += dt*v (semi-implicit Euler). Stable if dt*c < s. Reflecting boundary copies the cell's own h for outside neighbours. https://matthias-research.github.io/pages/tenMinutePhysics/20-heightFieldWater.pdf
- Müller's object coupling. Keep a field b of height covered by objects. Add alpha*(b - b_prev) to h each step (alpha 0-1), smoothing b first to avoid spikes. This conserves volume. Buoyancy force is rho * overlap * s^2 * g per column. Same PDF.
- Original talk "Fast Water Simulation for Games Using Height Fields", GDC 2008. Slides linked from https://blitz-community.github.io/blitzbasic-backup/forums/bmx-programming/79415.html . A 1D WebGL version notes damping factor s < 1 and dt < h/c. https://felixriehm.github.io/1d-height-field-fluid-webgl/index.html
- Virtual pipes, per Dagenais et al. 2018. Flux between columns i and j is updated by f = zeta*f + dt*A*g*(h_i - h_j)/l, with l = cell size and A = cell size squared. Outflow is scaled down (Mei et al.) so a cell never goes below its base. Inflow is scaled (Kellomäki) so a cell never overflows. https://diglib7.eg.org/bitstream/handle/10.2312/vriphys20181067/045-054.pdf
- Dagenais et al. timings on a GTX 970 with CUDA. 200x200x1 grids take about 0.6-1.0 ms simulation per frame. 200x200x5 takes about 5 ms. The sim is 50-80% of total cost. Same PDF.
- Mei, Decaudin, Hu, "Fast Hydraulic Erosion Simulation and Visualization on GPU", Pacific Graphics 2007, pp. 47-56. Cells update in parallel each step, so it maps to multi-pass GPU. https://hgpu.org/?p=2256 , full text https://inria.hal.science/inria-00402079 (blocked by bot protection)

### Mei et al. pipe step (from memory of the paper, verify before quoting)
```
for each cell: for each dir in L,R,T,B:
    dh = (b + d)[cell] - (b + d)[neighbor]
    f[dir] = max(0, f[dir] + dt * A * g * dh / l)
K = min(1, d * lx * ly / ((fL + fR + fT + fB) * dt))
f[*] *= K
for each cell:
    dV = dt * (sum inflow - sum outflow)
    d += dV / (lx * ly)
    velocity u, v from average flux through the cell (for erosion or flow-map output)
```
Inferred, not confirmed against the paper text (HAL blocked the fetch). The flux line and the outflow scaling match Dagenais et al.'s description above.

### Inferences
- Cost on CPU. A 4-flux pipe sim is about 20-30 flops per cell per step. A 128x128 local grid (16k cells) is roughly 0.5 M flops per step, about 0.1-0.5 ms in a typed loop (C# or GDExtension), more in plain GDScript. Untested estimate.
- In Godot Compatibility (WebGL2), both models can run as ping-pong fragment passes into RGBA16F or RGBA8 textures (flux needs 4 channels, height and velocity need 2). WebGL2 float render targets need the `EXT_color_buffer_float` extension, so test or pack into RGBA8.
- Pick by job. Waves, wakes and ripples at lake scale want the height field (it is #3's two-buffer ripple with real wave speed). Dam breaks, filling a moat, flooding a dungeon want pipes. Rivers that never change want neither, only authored flow direction and scrolling art.
- Pixel look. Quantise h to 3-5 palette bands and draw the band edges. A smooth sim then reads as palette water.

### Gaps
- No CPU timings for pipes or height fields at game sizes in any source found. Exact Mei constants and benchmark grid sizes not retrieved.

---

## Q6. What to take into the study

| Need | Cheapest good option | Cost | Source |
|---|---|---|---|
| River surface motion | Per-tile direction byte selects scroll direction | Zero sim | Q2, Q3 |
| Current push | Pokemon forced step, 6 frames per 16 px | One lookup per step | pokeemerald |
| Local spills, floods | Integer level CA, 7 levels, dirty cells | <0.1 ms for 4k cells (est.) | Minecraft, DF |
| Smooth pooling, dam break | Virtual pipes, 4 fluxes per cell | 0.6-1 ms GPU at 200x200 | Dagenais 2018 |
| Lake waves, wakes | Müller height field, 2 floats per cell | 1 stencil pass | Müller |
| River placement | Fill pits, D4 downhill, accumulate, threshold | Offline, linear | Patel, Red Blob, Azgaar |
| Waterfall | Scrolling strip, foam ring, 1-3 mist px per 100 ms | A few sprites | Slynyrd, inference |

Demo ideas. (1) River tiles generated by accumulation on a noise heightmap with direction-driven scroll and a current that pushes a player dot. (2) A 64x40 pipe sim where the user digs a channel and breaks a dam, drawn in 4 palette bands. (3) Minecraft-style 7-level spill that settles and goes idle.

---

## Sources
- https://minecraft.wiki/w/Water
- https://dwarffortresswiki.org/index.php/v0.34:Water
- https://dwarffortresswiki.org/index.php/Pressure
- https://dwarffortresswiki.org/index.php/40d:Flow
- https://terraria.wiki.gg/wiki/Liquids
- https://oxygennotincluded.wiki.gg/wiki/Units
- https://kleiforums.com/forums/topic/111451-oniversity-hydrodynamics-a-complete-description-of-horizontal-flow-for-a-single-layer-of-liquid-over-a-solid/
- https://80.lv/articles/noita-a-game-based-on-falling-sand-simulation/
- https://gdcvault.com/play/1025695/Exploring-the-Tech-and-Design
- https://cf-www.factorio.com/blog/post/fff-416
- https://w-shadow.com/blog/2009/09/01/simple-fluid-simulation
- https://github.com/pret/pokeemerald/blob/master/src/field_player_avatar.c
- https://github.com/pret/pokeemerald/blob/master/src/event_object_movement.c
- https://bulbapedia.bulbagarden.net/wiki/Route_134
- https://bulbapedia.bulbagarden.net/wiki/Route_133
- https://zeldawiki.wiki/wiki/Current
- https://zeldawiki.wiki/wiki/Whirlpool_Waterway
- https://zeldawiki.wiki/wiki/Rapids
- https://simblob.blogspot.com/2010/09/polygon-map-generation-part-2.html
- https://www.redblobgames.com/maps/polygon-map-generation/
- https://www.redblobgames.com/maps/mapgen4/
- https://www.redblobgames.com/x/1723-procedural-river-growing/
- https://mewo2.com/notes/terrain
- https://github.com/Azgaar/Fantasy-Map-Generator
- https://deepwiki.com/Azgaar/Fantasy-Map-Generator/2.3-rivers-and-water-features
- https://www.slynyrd.com/blog/2018/10/12/pixelblog-10-water-in-motion
- https://slynyrd.com/blog/2023/3/26/pixelblog-43-top-down-tiles-part-2
- https://www.schoolofmotion.com/training/viewer/8-bit-after-effects
- https://pixnote.net/en/learn/animation
- https://tibiaqa.com/26382/is-there-any-information-on-the-waterfall-quest
- https://www.advances.realtimerendering.com/s2010/Vlachos-Waterflow(SIGGRAPH%202010%20Advanced%20RealTime%20Rendering%20Course).pdf
- https://matthias-research.github.io/pages/tenMinutePhysics/20-heightFieldWater.pdf
- https://felixriehm.github.io/1d-height-field-fluid-webgl/index.html
- https://blitz-community.github.io/blitzbasic-backup/forums/bmx-programming/79415.html
- https://diglib7.eg.org/bitstream/handle/10.2312/vriphys20181067/045-054.pdf
- https://hgpu.org/?p=2256
- https://inria.hal.science/inria-00402079

Blocked or failed: dwarffortresswiki.org and catsplode.com (HTTP 429), web.archive.org (tool refused), bulbapedia Current page (403), jgallant.com (403), w-shadow.com and mewo2.com (404), Stanford Patel page (connection refused), HAL Inria (bot wall).
