# 03 Fog of war systems (data model, updates, soft edges, MMO visibility)

Researcher angle: spatial fog-of-war techniques with performance figures. FOV and shadowcasting algorithms come from study #5 (https://kingsfoil-artifacts.netlify.app/vfx-light-topdown-pixel). This file treats them as the input that fills the visibility grid.

Method: I read the open-source code directly (OpenRA, Spring/Recoil, 0 A.D., Stratagus, The Forgotten Server) plus Riot's posts, Factorio's wiki, and a few overview sources. Code line refs point at the `master`/`bleed` branches as of 2026-11-10.

Labels used below. **[cited]** means a source states it. **[code]** means I read it in source code. **[estimate]** means my own arithmetic, not a measurement.

---

## Q1. What data model do shipped games use?

### Takeaway
Every engine I read stores a **per-cell reference count per player or team**, plus an **explored bit**. "Visible" means count > 0. "Explored" is sticky and never clears. Nobody stores a plain visible boolean that gets recomputed from scratch, because the counter lets units add and remove their circle independently. Counts are 16-bit everywhere.

### Cited findings
- OpenRA `Shroud.cs` per player keeps `ProjectedCellLayer<short> visibleCount`, `passiveVisibleCount`, `generatedShroudCount`, plus `bool explored`, `bool touched`, and a cached `resolvedType` byte (Shroud/Fog/Visible). [code] https://github.com/OpenRA/OpenRA/blob/bleed/OpenRA.Game/Traits/Player/Shroud.cs (lines 78-143). `AddSource` increments the count and sets `explored = true` for every cell in a unit's precomputed cell list (lines 275-300). Removal decrements.
  - Memory [estimate] about 9 bytes per cell per player (3 shorts + 2 bools + 1 byte). A 128x128 map is about 147 KB per player.
- 0 A.D. `CCmpRangeManager.cpp` keeps `Grid<u16> m_LosPlayerCounts` per player ("counts of units seeing vertex") and one `Grid<u32> m_LosState` that packs **2 bits per player for 16 players** into one u32 per vertex. [code] https://github.com/0ad/0ad/blob/master/source/simulation2/components/CCmpRangeManager.cpp (lines 64-150, 411-432). States are `UNEXPLORED=0, EXPLORED=1, VISIBLE=2, MASK=3`, and `LOS_TILE_SIZE = 4` world units. [code] https://github.com/0ad/0ad/blob/master/source/simulation2/helpers/Los.h
  - Shared vision is a bit OR. `CalcSharedLosMask` ORs the 2-bit masks of allied players, so a team query is one AND on the u32. [code] (lines 86-95)
  - Memory [estimate] 4 B shared + 2 B per player per vertex. A 257x257 vertex grid with 8 players is about 1.3 MB.
- Spring/Recoil `LosHandler.h` says each LOS type is "a 2d array essentially containing a reference count". [code] https://github.com/beyond-all-reason/spring/blob/master/rts/Sim/Misc/LosHandler.h (lines 86-101). `CLosMap` stores `std::vector<unsigned short> losmap`. [code] https://github.com/beyond-all-reason/spring/blob/master/rts/Sim/Misc/LosMap.h
  - It keeps **7 separate grids** (LOS, air LOS, radar, sonar, jammer, seismic, sonar jammer), each at its own mip level. [code] LosHandler.h lines 117-124, 307-313.
- Stratagus (Wargus, open Warcraft II engine) uses `unsigned short Visible[PlayerMax]` per tile with an offset encoding. **0 = unexplored, 1 = explored but unseen, >= 2 = visible.** [code] https://github.com/Wargus/stratagus/blob/master/src/include/tile.h (lines 50-176) and `MapMarkTileSight` in https://github.com/Wargus/stratagus/blob/master/src/map/map_fog.cpp (line 215-220). The same struct has `Radar[]`, `RadarJammer[]`, `VisCloak[]` bytes and a `SeenTile` (last-seen tile graphic for fog memory).
- League of Legends fog is a **128x128 grid with a single visibility flag per cell**. The author replaced an older "discrete gradient" with "a simple visibility flag". [cited] https://www.riotgames.com/en/news/story-fog-and-war
- Roguelike memory model is the same two states minus counting. Seen-once tiles stay remembered and draw dimmed when out of view. [cited] https://mcrogueface.github.io/tutorial/part_04_fov.html

### Inferences
- For a Godot tile game the natural layout is `PackedByteArray explored` + `PackedInt32Array` or `PackedByteArray counts` per team, same size as the tile map. A u8 count is enough if fewer than 255 sources can overlap one tile. That is true for an RPG party, and maybe not for an RTS blob.
- 0 A.D.'s 2-bits-per-player packing is the cleanest "per-team bitset". One u32 covers 16 teams, so the renderer reads one word per cell.

### Gaps
- No engine published bytes-per-cell. All memory figures above are my estimates from field types.

---

## Q2. How do engines update visibility (incremental stamping, dirty flags, rate)?

### Takeaway
Three tricks show up again and again. (1) Only restamp when a unit crosses into a new cell. (2) Only re-resolve cells marked touched/dirty. (3) Spread the work out: stagger units across frames (Spring, 2 Hz per unit) or split the fog pipeline into steps across frames (Stratagus). Nobody recomputes the whole map every frame.

### Cited findings
- **Restamp on cell change only.** OpenRA `AffectsShroud` caches `cachedLocation` and returns early if the projected cell has not changed. [code] https://github.com/OpenRA/OpenRA/blob/bleed/OpenRA.Mods.Common/Traits/AffectsShroud.cs (lines 89-103). The cell list for a range is precomputed by `ProjectedCellsInRange`.
- **Touched-cell scan.** OpenRA `Shroud.Tick` exits at once if `!anyCellTouched`. Otherwise it walks the `touched` array with vectorized `span.IndexOf(true)`, "Most cells are unchanged, use IndexOf for fast vectorized search." [code] Shroud.cs lines 159-200.
- **Delta strips.** 0 A.D. builds each vision circle as horizontal strips (`LosAddStripHelper`, `LosRemoveStripHelper`). `LosUpdateHelperIncremental` computes the old and new circle strips together and only touches tiles "that have a net change", since the circles "will be heavily overlapping". [code] CCmpRangeManager.cpp lines 2143-2331.
  - A count going 0 to 1 sets VISIBLE|EXPLORED and calls `MarkVisibilityDirtyAroundTile`. Dirty state is tracked per LOS region of 8x8 vertices (`LOS_REGION_RATIO = 8`) with a u16 bitmask per player. [code] lines 55, 101-133, 2150-2165.
- **Staggered updates.** Spring `CLosHandler::Update` processes `activeUnits.size() / UNIT_SLOWUPDATE_RATE` units per sim frame. [code] https://github.com/beyond-all-reason/spring/blob/master/rts/Sim/Misc/LosHandler.cpp (lines 823-857). `UNIT_SLOWUPDATE_RATE = 15` and `GAME_SPEED = 30`. [code] https://github.com/beyond-all-reason/spring/blob/master/rts/Sim/Misc/GlobalConstants.h. So each unit's LOS refreshes every 15 frames = **0.5 s = 2 Hz** [estimate from constants], and the 7 LOS types run in parallel (`for_mt`).
- **Instance sharing.** Spring units on the same LOS square with the same radius, ally team and height share one `SLosInstance` (refcounted). Up to 500 zero-ref instances stay cached for reuse. Instances store visible squares as RLE runs so removal works even after terrain changed. [code] LosHandler.h lines 19-101. A dead unit's sight lasts 1.5 game seconds (`GAME_SPEED + GAME_SPEED/2` frames). [code] LosHandler.cpp line 342.
- **Pipeline split across frames.** Stratagus enhanced fog runs one step per frame: `cGenerateFog` then `cGenerateTexture` (4x4 upscale) then `cBlurTexture` then `cReady`, while the previous texture eases toward the new one over `NumOfEasingSteps = 8`. [code] https://github.com/Wargus/stratagus/blob/master/src/map/fow.cpp (lines 366-403), defaults in https://github.com/Wargus/stratagus/blob/master/src/include/fow.h (lines 132-140). The tile loop is split across OpenMP threads by row. [code] fow.cpp lines 310-320.
- **Event-driven redraw.** A UE4 grid fog redraws its 32x32 canvas only when an event fires on visibility change, not every tick. [cited] https://minmax.itch.io/operators/devlog/222177/rendering-grid-based-fog-of-war-in-unreal-engine-4-part-1
- **Factorio charting** refreshes the radar's 7x7-chunk (224x224 tile) area "about once per second". Long-range scans chart one 32x32-tile chunk every 33.333 s. [cited] https://wiki.factorio.com/Radar

### Cost model [estimate]
- Full stamp of a radius-r circle touches about pi*r^2 cells. r = 8 tiles gives 201 cells. r = 4 gives 50.
- A one-tile move with 0 A.D.-style delta strips touches roughly 2*(2r+1) cells. r = 8 gives about 34 cells, which is 6x less than restamping.
- 500 units x 201 cells = 100k counter increments for a full restamp. At about 1 ns per increment in compiled code that is ~0.1 ms. GDScript is roughly 50-100x slower per operation, so the same loop is 5-10 ms. That is why a Godot version should use delta stamping, a 4-10 Hz rate, or a C#/GDExtension loop.
- For an RPG party of 4 with r = 8, a full restamp is 800 cells. Even GDScript does that well under 1 ms. Don't over-engineer the single-player case.

### Gaps
- None of the RTS codebases publish ms-per-update numbers. Spring has `SCOPED_TIMER("Sim::Los")` and logs cache hit rates, but I found no published profile.

---

## Q3. How do they render soft edges?

### Takeaway
Two families. **Tile-edge sprites** (OpenRA, Stratagus "tiled", Warcraft II) pick one of 16 edge tiles from the 4 corner states, which is marching squares. **Upscaled blurred mask** (League, 0 A.D., Stratagus "enhanced") writes 1 byte per cell, blurs it, uploads a small texture and lets bilinear filtering stretch it. Both add a time crossfade (0.5 s in 0 A.D., 8 steps in Stratagus). For pixel art, edge tiles or a dithered threshold keep the palette honest. A raw bilinear gradient looks like a smooth airbrush over crisp pixels.

### Cited findings
- **OpenRA edge tiles.** `ShroudRenderer` looks at 8 neighbours (`GetNeighborsVisbility`) and maps corner/edge flags to a sprite index. Default table `Index = [12, 9, 8, 3, 1, 6, 4, 2, 13, 11, 7, 14]` ("corners clockwise from TL; upper four are edges"), `OverrideShroudIndex = 15` for full cover. An optional `UseExtendedIndex` uses 4 sides + 4 corners. Shroud (never seen) and fog (seen, not visible) are two separate sprite layers with their own variants. Only `cellsDirty` cells get rebuilt. [code] https://github.com/OpenRA/OpenRA/blob/bleed/OpenRA.Mods.Common/Traits/World/ShroudRenderer.cs (lines 29-245)
- **Stratagus tiled fog** uses a 16-entry table `TiledFogTable[16] = {0, 11, 10, 2, 13, 6, 14, 3, 12, 15, 4, 1, 8, 9, 7, 0}` built from 4 corner samples. [code] fow.h line 156.
- **Stratagus enhanced fog** builds a texture at `(MapWidth+1)*4 x (MapHeight+1)*4`, so each tile becomes 4x4 texels via a 16-pattern upscale table. It then blurs (radius 2.0 simple or 1.5 with bilinear upscale, 3 iterations) and eases. Default alpha levels: explored 0x7F, revealed 0xBE, unseen 0xFE. [code] fow.cpp lines 68-173, fow.h lines 132-140. A 128x128 map gives a 516x516 texture (266k texels, [estimate]).
- **0 A.D.** writes 255 for visible and 127 for explored, then runs a CPU **7-tap binomial blur** ("efficient integral approximation of a Gaussian"). It pads the bitmap by (N-1)/2 so the blur needs no second buffer. [code] https://github.com/0ad/0ad/blob/master/source/graphics/LOSTexture.cpp (lines 39-57, 429-432). The "SmoothLOS" option keeps two textures and blends with `delta = clamp((now - lastRecompute) * 2, 0, 1)`, which is a **0.5 s crossfade** [code, lines 145-171].
- **League of Legends.** The 128x128 flags were Gaussian-blurred, but more blur "made it too blurry too quickly". The fix upscaled to **512x512** using 4x4 patterns with grey antialiasing pixels ("16 unique patterns in total"), then blurred again. Going to a 256x256 source would have "quadrupled CPU cost". The old code darkened visible areas by about 0.9; they set it to 1.0. [cited] https://www.riotgames.com/en/news/story-fog-and-war
- **UE4 grid fog** uses one texel per tile (32x32) on a map-wide decal ("roughly one extra draw call"). Softness comes only from texture filtering, which "can bleed" through thin walls. The fade is a second render target that is lerped toward the first each tick with a low delta-time alpha. [cited] https://minmax.itch.io/operators/devlog/222177/rendering-grid-based-fog-of-war-in-unreal-engine-4-part-1

### Inferences (for Godot Compatibility / pixel art)
- The Stratagus/League "16-pattern 4x4 upscale" is a precomputed marching-squares texel stamp. It gives rounded corners with zero blur cost, and in pixel art it reads like hand-drawn fog edges.
- Cheapest pixel-art path [estimate]. Keep an `Image` of map size in `FORMAT_L8` (1 B per tile). Call `ImageTexture.update()` only when the stamp changes, at 4-10 Hz. In the canvas shader sample it with linear filtering, then threshold it against a 4x4 Bayer matrix in screen pixels (study #1 snow and #6 smoke already use Bayer). Bilinear gives the shape, Bayer keeps it in the palette. Cost is one texture fetch plus one compare per pixel. At 320x180 that is 57.6k fetches per frame, trivial even on mobile WebGL2.
- Temporal fade per cell. Keep two L8 textures (previous, current) and mix by a uniform, like 0 A.D. That avoids per-cell timers. A per-cell fade byte stepped on the CPU costs O(changed cells) and gives per-tile reveal ripple at the price of a texture upload every frame while fading.
- Bilinear bleeding through 1-tile walls (UE4 note) is a real risk in dungeons. Edge tiles or a nearest-sample + dither path avoids it.

### Gaps
- No ms numbers for any blur pass. The League post says the old code did not use a separable blur but gives no timing.

---

## Q4. Reveal animations and "last seen" memory

### Takeaway
Reveal animation is almost always a **texture crossfade**, not a per-cell animation. Memory of what was seen ranges from a dimmed terrain layer (most RTS, roguelikes) to a stored "last seen" snapshot (Stratagus `SeenTile`, Factorio's dim chunk image).

### Cited findings
- 0 A.D. crossfade over 0.5 s (Q3). Stratagus eases over 8 steps (Q3). UE4 example lerps a second target each tick (Q3).
- Stratagus stores `SeenTile`, the last seen tile graphic, so a fogged area shows the terrain as it was. [code] tile.h line 172.
- Factorio: a long-range-scanned chunk is fully revealed for 10 s, then shows as a "dim image that cannot be zoomed into". That image is the last known state and can be outdated. [cited] https://wiki.factorio.com/Radar
- Roguelikes draw remembered tiles dim when out of view. [cited] https://mcrogueface.github.io/tutorial/part_04_fov.html

### Inferences
- For a Tibia-like game the "memory" layer already exists as the minimap/automap idea. A fogged-memory look (desaturated, palette-shifted terrain without creatures) is the pixel-art equivalent of Stratagus `SeenTile`.

---

## Q5. Shared team vision

### Takeaway
Shared vision is either a **bitmask OR at read time** (0 A.D.) or a **shared counter per ally team** (Spring keys LOS instances by allyteam). Both are cheap. OR-at-read-time lets alliances change without restamping.

### Cited findings
- 0 A.D. `CalcSharedLosMask` ORs player masks. A u16 `visionSharing` per entity and a u16 dirty mask track sharing changes. [code] CCmpRangeManager.cpp lines 86-150, 233-235.
- Spring stores LOS per ally team, and an `SLosInstance` is only shared inside "the same ally-team". [code] LosHandler.h lines 31-35.
- OpenRA merges explored state from another player's shroud (`if (!explored[index] && s.explored[index])`). [code] Shroud.cs lines 358-366.

---

## Q6. Height and elevation blocking

### Takeaway
RTS games handle height either with a **rule** (low ground can't see high ground, StarCraft) or by **raycasting against a heightmap** (Spring, 0 A.D. range bonus). On a tile grid, the StarCraft rule is just "a tile with a higher elevation level is opaque to viewers below it". It drops into shadowcasting from study #5 as an extra opacity test.

### Cited findings
- StarCraft II. Low-ground ground units cannot see high-ground ground units. They see high-ground air units only after those units attack. Vision comes from air units, Colossus, Xel'Naga Towers, Scan, or a friendly unit on the high ground. [cited] https://liquipedia.net/starcraft2/High_Ground_and_Low_Ground (quoted via search, page returned 403 to fetch)
- Brood War. Ground units on lower ground have a 120/256 (46.875%) chance to miss ground units on higher ground. That is a combat rule tied to the vision rule. [cited] https://www.starcraftai.com/wiki/Chance_to_Hit
- Stratagus has `uint8_t ElevationLevel` per tile ("highground elevation level"). [code] tile.h lines 247-262.
- Spring raycasts each LOS circle against a mip heightmap (`GetMIPHeightMapSynced(mipLevel)`). It precomputes rays per radius ("rays with length < radius" fill gaps) and uses midpoint circles mirrored per octant. [code] LosHandler.cpp line 98, https://github.com/beyond-all-reason/spring/blob/master/rts/Sim/Misc/LosMap.cpp (lines 48-72, 174-281). Terraforming re-queues affected instances (`UpdateHeightMapSynced`, delayed 2 s). [code] LosHandler.cpp line 419.
- 0 A.D. extends range with height: `effectiveRange = isqrt(range^2 + 2*heightDiff*range)`, a paraboloid. [code] CCmpRangeManager.cpp line 1301.
- OpenRA has `MaxHeightDelta` on `AffectsShroud`. Cells more than that height above the viewer are excluded. [code] AffectsShroud.cs line 25.

---

## Q7. Resolution, large maps, many units

### Takeaway
Everyone runs vision at a **coarser grid than the art**. Spring LOS is 16 world units per cell (mip 1), radar 32. League uses 128x128 for the whole map. 0 A.D. uses 4-unit vertices. Cost scales with units x r^2, so halving resolution cuts stamping cost 4x. Riot cited exactly that 4x when it refused 256x256.

### Cited findings
- Spring mip defaults: `losMipLevel = 1`, `airMipLevel = 1`, `radarMipLevel = 2`. [code] https://github.com/beyond-all-reason/spring/blob/master/rts/Sim/Misc/ModInfo.cpp (lines 118-120). Cell size `mipDiv = SQUARE_SIZE * (1 << mipLevel)` with `SQUARE_SIZE = 8`, so LOS cells are 16 world units and radar cells 32. Radius in cells is `(losRadius / SQUARE_SIZE) >> mipLevel`. [code] LosHandler.cpp lines 83-145.
- League: 128x128, 256x256 "quadrupled CPU cost". [cited] https://www.riotgames.com/en/news/story-fog-and-war
- 0 A.D. groups vertices into 8x8 regions for dirty tracking. [code] CCmpRangeManager.cpp line 55.

### Estimates
- Spring on a 16x16 map (8192 world units per side) at mip 1 is 512x512 = 262k cells x 2 B = 512 KB per LOS type per ally team. Radar at mip 2 is 128 KB.
- An Asterion-sized region of 1024x1024 tiles at 1 B per tile is 1 MB per team. At one cell per 2x2 tiles it is 256 KB.

---

## Q8. GPU vs CPU

### Takeaway
The shipped engines I read compute visibility on the **CPU** (it is gameplay state and must be deterministic or server-side). They use the GPU only to upsample, blur and fade the mask. For Godot Compatibility (no compute shaders) that split is the only one that works anyway.

### Cited findings
- 0 A.D. blurs on the CPU, uploads, then the GPU interpolates two textures (`los_interp` shader). [code] LOSTexture.cpp.
- Stratagus does generate, upscale, blur and ease on the CPU, threaded with OpenMP. [code] fow.cpp.
- UE4 example draws visible cells into a render target and samples it with a decal. [cited] minmax devlog.

### Inferences
- A GPU path in Godot would draw one soft circle sprite per unit into a SubViewport ("stamp precomputed circles" on the GPU, additive). That gives a visible mask at near zero CPU cost, but no gameplay data, no explored memory without a second persistent viewport, and no wall occlusion unless you also draw shadow polygons (#5). Good for cosmetic fog in single-player, wrong for an MMO where the server decides.

---

## Q9. Who holds the truth? Lockstep RTS vs server-authoritative games

### Takeaway
Lockstep RTS (StarCraft, AoE, Spring, 0 A.D., OpenRA) give every client the full state, so fog is a client-side drawing choice and maphacks work. Server-authoritative games (League, VALORANT, Dota 2, Tibia) **never send hidden entities**. For them, fog of war and interest management are the same system. Asterion is server-authoritative, so its fog of war is its AOI.

### Cited findings
- Lockstep needs all state on every client, so "fog of war is client side". [cited] https://medium.com/@treeform/dont-use-lockstep-in-rts-games-b40f3dd6fddb. Spring's netcode overview describes the lockstep model. [cited] https://beyond-all-reason.github.io/spring/articles/netcode-overview
- Maphacks often inject a DLL that overrides fog enforcement. A 2011 IEEE S&P paper (Kartograph, Bursztein et al.) studied this and proposed OpenConflict. [cited] https://www.ieee-security.org/TC/SP2011/PAPERS/2011/paper032.pdf
- League: the server withholds enemy positions until a client needs to display them. [cited] https://www.riotgames.com/en/news/demolishing-wallhacks-valorants-fog-war
- VALORANT numbers. The prototype ran line-of-sight checks from every networked actor to each viewer, over 350 relevancy checks per frame in a 10-player game, each with 10 rays. That roughly doubled frame time and pushed the server from 128 to 64 tick. The shipped version uses a **precomputed cell-to-cell visibility table (PVS)**, an optimistic lookup, plus a look-ahead (bounds expanded by velocity x a time longer than ping). Fog of war ended at **under 2% of server frame time, down from about 50%**. Hidden players get fewer messages, so it is a net gain. [cited, vendor-reported] https://www.riotgames.com/en/news/demolishing-wallhacks-valorants-fog-war
- Dota 2. A public fog-disable proof of concept says "entities inside of FoW are not networked to the client". [cited, third-party] https://awesome.ecosyste.ms/projects/github.com%2Fvoided%2Fdota-voidhack. Valve has no official statement that I found.
- Interest management categories (rule based, static zones, geometric/visibility). Fog of war is the main rule-based example, and it also prevents snooping. [cited] https://0fps.net/2014/03/
- Measured AOI savings exist only in simulations. The A3 algorithm reports 33.1% max and 33.58% average traffic reduction versus other AOI algorithms (ns-2). [cited] https://core.ac.uk/download/36695351.pdf (found via search, not fetched). STOW-E found multicast cells of about 2-2.5 km gave most of the download reduction. [cited] https://mikezyda.com/resources/pubs/VRST98.pdf

### Inferences
- A lockstep fog for a small co-op RTS is fine. For any PvP, assume the client sees everything you send.
- For Asterion, "never send hidden entities" is already true if the server only sends what is inside the client's viewport window (Q10). An extra fog layer would only be cosmetic.

---

## Q10. Tibia's fixed viewport as a natural fog of war

### Takeaway
Tibia does not need fog of war. The server sends an **18x14 tile window** (the 15x11 visible area plus a margin) and only the floors the player could see. Anything outside that rectangle never reaches the client. It is a rule-based AOI with a constant cost per player.

### Cited findings
- TFS `map.h`: `maxClientViewportX = 8`, `maxClientViewportY = 6`, `maxViewportX/Y = 11` for server-side spectator search. [code] https://github.com/otland/forgottenserver/blob/master/src/map.h (lines 159-162)
- `ProtocolGame::canSee` accepts x in [px - 8 + dz, px + 9 + dz] and y in [py - 6 + dz, py + 7 + dz]. That is 18x14 tiles, shifted by one per floor of height difference. On the surface (z <= 7) the client sees floors 7 to 0 and nothing underground. Underground it sees +/- 2 floors. [code] https://github.com/otland/forgottenserver/blob/master/src/protocolgame.cpp (lines 958-985)
- The client keeps a known-creature cache of up to 1300 ids and evicts ones it can no longer see. [code] protocolgame.cpp lines 909-940.
- Map data is sent per floor with run-length "skip" bytes for empty tiles (`GetMapDescription` / `GetFloorDescription`). [code] protocolgame.cpp lines 858-900.
- The tile map is a quadtree of 8x8 leaf blocks (`FLOOR_BITS = 3`), and spectator queries walk those leaves. [code] map.h lines 60-73.

### Estimates
- Per player per step, a one-tile move sends one new 18-tile column or 14-tile row per visible floor. Up to 8 floors on the surface gives at most about 112-144 tiles, most of them skipped by RLE. Cost per player is constant regardless of world size.
- Server visibility test is two range comparisons per creature per spectator. No raycasts. Line of sight in Tibia only matters for spells and missiles, not for what gets sent.

### Gaps
- I could not fetch TibiaWiki (402/403). The 15x11 visible size comes from the shared CONTEXT brief and matches the 18x14 window minus margins. I did not confirm Tibia's official client automap format.

---

## Summary table (for the study's rating)

| Technique | Data per cell | Update | Edge look | Pixel-art fit | Source |
|---|---|---|---|---|---|
| Ref-count + explored bit | 2 B count + 1 bit | On cell change | n/a | n/a | OpenRA, 0 A.D., Spring, Stratagus |
| Delta-strip stamping | same | ~2(2r+1) cells per move | n/a | n/a | 0 A.D. |
| 16 edge tiles (marching squares) | reads 4 corners | dirty cells only | hand-drawn | best | OpenRA, Stratagus tiled |
| 4x4 pattern upscale + blur + ease | 1 B texel | pipelined over frames | soft, rounded | good if blur off | Stratagus enhanced, League 512x512 |
| 7-tap blur + 0.5 s crossfade | 1 B texel | on recompute | soft airbrush | weak without dither | 0 A.D. |
| Bilinear + Bayer threshold | 1 B per tile | 4-10 Hz upload | dithered | best cost/look [estimate] | inference, ties to #1 and #6 |
| Server AOI window | none on client | per step | hard viewport edge | native Tibia look | TFS |
| PVS table, server side | cell-to-cell bits | per tick | n/a | n/a | VALORANT (<2% frame) |

---

## Sources
- OpenRA Shroud.cs: https://github.com/OpenRA/OpenRA/blob/bleed/OpenRA.Game/Traits/Player/Shroud.cs
- OpenRA AffectsShroud.cs: https://github.com/OpenRA/OpenRA/blob/bleed/OpenRA.Mods.Common/Traits/AffectsShroud.cs
- OpenRA ShroudRenderer.cs: https://github.com/OpenRA/OpenRA/blob/bleed/OpenRA.Mods.Common/Traits/World/ShroudRenderer.cs
- Spring/Recoil LosHandler.h/.cpp, LosMap.h/.cpp, ModInfo.cpp, GlobalConstants.h: https://github.com/beyond-all-reason/spring/tree/master/rts/Sim/Misc
- 0 A.D. CCmpRangeManager.cpp: https://github.com/0ad/0ad/blob/master/source/simulation2/components/CCmpRangeManager.cpp
- 0 A.D. Los.h: https://github.com/0ad/0ad/blob/master/source/simulation2/helpers/Los.h
- 0 A.D. LOSTexture.cpp: https://github.com/0ad/0ad/blob/master/source/graphics/LOSTexture.cpp
- Stratagus fow.cpp / fow.h / tile.h / map_fog.cpp: https://github.com/Wargus/stratagus/tree/master/src
- The Forgotten Server map.h / protocolgame.cpp: https://github.com/otland/forgottenserver/tree/master/src
- Riot, A Story of Fog and War: https://www.riotgames.com/en/news/story-fog-and-war (mirror https://technology.riotgames.com/node/39 timed out)
- Riot, Demolishing Wallhacks with VALORANT's Fog of War: https://www.riotgames.com/en/news/demolishing-wallhacks-valorants-fog-war
- Factorio wiki, Radar: https://wiki.factorio.com/Radar
- minmax, grid fog of war in UE4: https://minmax.itch.io/operators/devlog/222177/rendering-grid-based-fog-of-war-in-unreal-engine-4-part-1
- McRogueFace FOV tutorial: https://mcrogueface.github.io/tutorial/part_04_fov.html
- Liquipedia, High Ground and Low Ground: https://liquipedia.net/starcraft2/High_Ground_and_Low_Ground
- StarcraftAI wiki, Chance to Hit: https://www.starcraftai.com/wiki/Chance_to_Hit
- treeform, Don't use lockstep in RTS games: https://medium.com/@treeform/dont-use-lockstep-in-rts-games-b40f3dd6fddb
- Spring netcode overview: https://beyond-all-reason.github.io/spring/articles/netcode-overview
- Bursztein et al., OpenConflict (IEEE S&P 2011): https://www.ieee-security.org/TC/SP2011/PAPERS/2011/paper032.pdf
- voidhack Dota 2 PoC: https://awesome.ecosyste.ms/projects/github.com%2Fvoided%2Fdota-voidhack
- 0fps, Replication in network games (Bandwidth): https://0fps.net/2014/03/
- A3 interest management paper: https://core.ac.uk/download/36695351.pdf
- Abrams, Watsen, Zyda (VRST98): https://mikezyda.com/resources/pubs/VRST98.pdf

## Overall gaps
- No source gave ms per fog update for an RTS. All per-update costs here are estimates from cell counts.
- Not found: Age of Empires / StarCraft II developer posts on fog internals, Valve's own Dota 2 fog docs (403), Red Blob Games fog page, Warcraft III.
- No measured bandwidth for Tibia-style viewport streaming.
