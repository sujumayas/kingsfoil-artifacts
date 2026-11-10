# Top-down pixel water: tiny algorithms for shorelines, rivers, lakes and sea, and water you can wade through

**Kingsfoil Studios · Research study · November 2026**

---

## Context

This is study #7 in our VFX series. Each study picks one concept and hunts for old-school algorithms that are very small and very efficient.

- **Study #1, snow** [S2]: palette lighting and dithered lamp pools.
- **Study #2, acid** [S3]: glow by block-sum blur plus palette select, bubbling pools.
- **Study #3, rain** [S4]: puddles as a depth mask against a flood level, splashes per surface, the Hugo Elias two-buffer ripple, ring decals and puddle reflections.
- **Study #4, forest** [S5]: shade ellipses, sunflecks, canopy and wind.
- **Study #5, light** [S6]: the Tibia light model, flicker, shadow maps and carried torches.
- **Study #6, fire** [S7]: the DOOM fire, tile fire spread, a smoke field, steam where water meets fire, and lava.

Puddles and the two-buffer ripple were covered by #3. Steam and lava were covered by #6. This study links to them and goes further, to the sea, the river and the lake, and to the people and boats that move through them.

The series reference is the **DOOM PSX fire** [S1]. One byte per pixel, one rule, one palette. Water has the same shape of answer more often than you would expect. A byte of depth or distance per tile holds the truth, a palette turns it into colour, and a global clock makes it move. Pokémon Red animates its whole sea by rotating the bits of one 8x8 tile [V, S15]. Tibia sends no water state at all, because every client runs the same 500 ms clock [V, S27].

It covers four areas. Shorelines and coasts, rivers and flow, lakes and sea, and interaction, meaning wading, swimming, wakes, splashes, floating things and fishing.

**Targets.**
- Godot 4, web-first, so the **Compatibility renderer** (WebGL 2, no compute shaders, limited 2D lights).
- Top-down (3/4) pixel art on 32x32 tiles for the Tibia-like MMORPG **Asterion Online** and a top-down RPG. The MMO is server-authoritative, so many players must see the same sea, the same tide and the same river.
- Weak hardware. Phones and old laptops, no big computer.

**Sources.** Ten research notes (01 to 10) and our playable **Water Sandbox** [S8]. Unlike #6 we ran no benchmarks for this study, so every cost below is a cited figure or a labelled estimate.

---

## 1. Executive summary

1. **Classic water is a shared clock, not a simulation.**
   - Console water uses 3 to 8 frames, each held 9 to 26 video frames. Loops last 0.45 s (ALttP) to 2.8 s (Pokémon Red) [V, S15, S17; I, note 01].
   - Fast water runs about 4x faster than calm water in the same game. Link's Awakening holds currents 4 frames and calm shore 16 [V, S18].
   - OTClient animates ground items at 500 ms per phase from one global clock, so every copy of a tile is in sync [V, S27]. A 16-phase Tibia sea would loop every 8 s [I, from S27 and S30].
2. **Palette cycling is still the cheapest moving water.** Ferrari's scenes move with zero work per pixel. DPaint's rate 16384 means 60 steps per second, and the scale is linear [V, S12]. Pokémon Crystal ping-pongs one water colour through 0, 1, 2, 1, which hides the wrap jump [V, S13].
3. **Use a dual grid for the coast.** It needs 16 tiles per terrain pair, or 15 if all-water draws nothing, against 47 for a blob set [V, S40, S41]. TileMapDual (MIT, 1,310 stars) does it in Godot [V, S141]. Do not call Godot's terrain matcher at runtime. Users report 4 to 5 ms per call [V, S44].
4. **One distance-to-shore byte per tile drives half the water.**
   - Multi-source BFS or a two-pass chamfer 3-4 runs once per map or tide step [V, S49; I, note 03].
   - Upload it as an R8 texture at 1 texel per tile and sample it with linear filtering. The same byte gives depth bands, foam, wave phase, caustic gating, fishing zones and the ambient sound mix [I, notes 02, 03, 06].
5. **Rivers are a direction byte per tile.**
   - The same byte picks the scroll direction on the client and the forced step on the server, so art and push always agree [I, note 04].
   - Pokémon Emerald moves the player 16 px in 6 frames on a current tile against 8 for surfing [V, S62]. Valve's flow maps cost 2 extra fetches and 21 ALU instructions [V, S54].
6. **Interaction is rings, a V and a clip line.**
   - Stardew draws every ring with one 8-frame, 64x64 animation at 150 ms per frame [V, S107].
   - A Kelvin wake has arms at arcsin(1/3) = 19.47° from the path at any slow speed [V, S78]. Spawn rings by distance travelled and the V appears by itself [I, note 08].
   - Wading is a sprite clipped at a waterline plus one ring per step [I, note 06].
7. **The server only needs flags, a clock and a few rolls.**
   - TFS keeps water as ground items with `trashholder`, `fluidSource` and `effect` attributes [V, S22]. Fishing chance is `10 + (skill − 10) × 0.597` percent, capped at 10 to 50 [V, S23]. Drowning is 20 damage every 2 s on an underwater tile [V, S26].
   - Send the tide as one byte per change. Never sync animation frames [I, note 08].
8. **Simulate only where it pays.** The Elias ripple runs at exactly the 2D stability limit, so rings grow 0.707 cells per tick whatever you do [I, note 05]. Use it on one pond. Use wave particles or ring decals for the open sea, because they cost nothing when nobody moves [V, S81; I, note 05].

---

## 2. How to read this study

| Tag | Meaning |
|---|---|
| **[V]** | Verified in a source our researchers read: code, paper, docs, wiki or article. "[V, vendor]" and "[V, self-reported]" mark figures reported by their own authors or sellers. |
| **[I]** | Author inference or design proposal. Untested unless it says "Sandbox", and then tested only in our JavaScript prototype. |
| **[U]** | Unverified: memory, a search snippet, or a page that could not be fetched. Treat it as a lead. |
| **[K]** | Textbook or canonical knowledge (maths, well-known release years). |

- [S#] refers to §14. "[I, note 0X]" is an inference made by the researcher in that note.
- Ratings (1–5) are author judgement: **Simplicity · Speed · Pixel taste · Mood · Interactivity**.
- We measured nothing this time. Costs are cited, derived by arithmetic, or labelled as estimates. A mid-range phone browser is slower than any desktop figure here.
- Sandbox numbers are illustrative. The Sandbox is a Canvas 2D page, not a Godot build.

---

## 3. Generations: a timeline

**Gen 0: the science**
- **1887** Kelvin's wake angle, arcsin(1/3) [K; V, S78]. **1986** Borgefors chamfer distance, the 3-4 weights [K; V, S49].
- **1995** O'Brien and Hodgins virtual pipes; Max and Becker moving textures, the root of flow maps [V, S74, S54].
- **2006** Rong and Tan jump flooding [V, S47]. **2007** Yuksel, House and Keyser wave particles; Mei, Decaudin and Hu GPU pipes [V, S81, S75].
- **2008** Müller, height-field water for games at GDC [V, S72, S73]. **2013** Rabaud and Moisy, narrow wakes at high Froude number [V, S79].
- **2017** Jeschke and Wojtan wave packets [V, S82]. **2020** Boundary-aware procedural waves; Wave Curves [V, S83, S84].

**Gen 1: palettes, tiles and HDMA (1985–2004)**
- **1985** Deluxe Paint colour cycling, stored as ILBM CRNG chunks [K; V, S12].
- **1990** Ultima VI, transparent shore pieces over 4 animated water tiles [K; V, S19]. **1991** ALttP, 3 frames of 9 video frames [K; V, S17].
- **1993** Link's Awakening, separate tide, current and waterfall groups [K; V, S18]. **1996** Pokémon Red, bit-rotated water [K; V, S15].
- **1997** **Tibia** and **Ultima Online** ship tile seas, fishing and boats [K; V, S22, S124].
- **2000** Pokémon Crystal palette ping-pong [K; V, S13]. **2004** Pokémon Emerald staggered tile banks and current tiles; Minish Cap wading [K; V, S16, S61, S116].

**Gen 2: shaders, systems and indie water (2009–2020)**
- **2009** w-shadow's mass cellular automaton [V, S60]. **Jul 2010** Vlachos, flow maps for Portal 2 and Left 4 Dead 2 [V, S54]. **2010** Patel polygon maps with downhill rivers [V, S65].
- **2011** Terraria liquids; Effect Games ports Ferrari to HTML5; webgl-water [K; V, S58, S9, S144].
- **2016** Stardew Valley overlay shimmer and fishing; Ferrari's GDC talk [K; V, S110, S11]. **2018** Slynyrd's water-in-motion post; Kingdom Two Crowns, CrossCode, Octopath Traveler [V, S69, S98, S129, S130].
- **2019** Wargroove sea and reef rules; Noita GDC talk; Factorio's water render target [V, S127, S59, S101].

**Gen 3: Godot, the dual grid and the web (2021–2026)**
- **Oct 2021** Stålberg popularises the dual grid [V, S43, S142]. **2023** Sea of Stars lights 2D water with a custom pipeline [V, S128]. **2024** TileMapDual and jess::codes dual grid [V, S141, S42].
- **Nov 2024** Croakwood signed-distance shoreline [V, S46]. **Jul 2025** Sir-Shroom ring shader; **Aug 2025** Pond Water band shader; Sword of the Sea [V, S89, S91, S131]. **Sep 2025** Godot 4.5, stencil buffer and Wasm SIMD [V, S133].
- **Nov 2025** OSRS Sailing [V, S123]. **Jan 2026** Godot 4.6 [V, S134]. **Feb 2026** Kyle Dunbar's 5-tile dual grid [V, S45].
- **Jun 2026** **Godot 4.7** with `DrawableTexture2D` [V, S135, S136]. **Sep 2026** latest TileMapDual commit (plugin v5.0.3) and autotiler v2.0.1 [V, S141, S143]. **Oct 2026** Cidade's CC0 Pixel Water shader for Compatibility [V, S137].

---

## 4. Technique profiles

There are eight families:

- **A.** Classic roots
- **B.** Shorelines and autotiling
- **C.** Rivers and flow
- **D.** Depth, colour and surface
- **E.** Interaction
- **F.** Server rules for an MMO
- **G.** Cheap simulation
- **H.** Palette, light and accessibility

Each profile ends with ratings for **Simplicity · Speed · Pixel taste · Mood · Interactivity** (1 = poor, 5 = excellent; author judgement). Families A and D are about how still water looks and moves. B and C are about where water meets land and where it goes. E and F are about what happens when something touches it, on the client and on the server. G is the simulation shelf, and H is the finish. Sandbox constants are listed in §8.

### Family A: Classic roots

### A1. Palette cycling water

*In plain words.* Paint one still picture of the sea. Reserve a few palette slots for the water highlights and rotate their colours. Every pixel painted with those slots appears to move, and nothing is redrawn.

*How it works (technical).*
- **Ferrari's scenes** [V, S9, S10]. One flat 256-colour image, no layers, no alpha. Effect Games' 2011 HTML5 port ships 35 scenes at 640x480, each about 100 KB of gzipped JSON. The water scenes include ocean waves, waterfalls, streams and lakes.
- **BlendShift** [V, S9]. Neighbouring colours fade into each other while shifting, which makes in-between frames at the same cycle speed. It hides the stepping at slow rates.
- **Rate units** [V, S12]. DPaint stores cycles in the ILBM CRNG chunk. Rate 16384 is 60 steps per second, and 8192 is 30.
- **Ping-pong** [V, S13]. Pokémon Crystal's `AnimateWaterPalette` cycles colour 0 of the water palette through the palette's own colours 0, 1, 2, 1, on even animation ticks. A 4-step ping-pong from 3 colours never shows the jump that a one-way rotation shows when the ramp ends do not match [I, note 01].
- **In Godot** [I, note 01]. An index texture plus a palette-lookup shader with the palette row offset by time. Study #1 already uses palette lookup [S2].

*Cost / performance.* n palette writes per step, zero per pixel.

*Games that used it.*
- Canvas Cycle (Ferrari scenes): http://www.effectgames.com/demos/canvascycle/

*How it feels.* The calmest water there is. Long, slow ramps read as a breathing lake, short fast ones as a waterfall, and Ferrari mixes both in one scene [V, S10].

*Risks.* Cycling cannot react to anything. It needs reserved palette slots, so it fights any art that is not indexed. No per-cycle fps for Ferrari's water was found [I, note 01].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 5 · Mood 4 · Interactivity 1

### A2. Animated tile frames on a shared clock

*In plain words.* Draw three to eight frames of one water tile and swap the frame for every water tile on screen at the same moment. The whole sea moves as one. This is how Zelda and Pokémon did it.

*How it works (technical).*
- **Pokémon Red** [V, S15]. No stored frames. The single 8x8 water tile's bytes rotate 1 bit right four times, then left four times, every 20 video frames. The loop is 160 to 168 frames, about 2.7 to 2.8 s.
- **Pokémon Emerald** [V, S16]. Water is 30 8x8 tiles with 8 frames of 16 video frames, so a 2.14 s loop. Each animated group gets its own slot of `timer % 16`. Flowers at 0, water at 1, sand-water edge at 2, waterfall at 3, land-water edge at 4. Only one bank upload happens per frame.
- **ALttP** [V, S17]. The overworld animated set is 32 4bpp tiles per frame, 3 frames of 9 video frames, so 0.45 s.
- **Link's Awakening DX** [V, S18]. 4 frames per group with slow (16), medium (8) and fast (4) intervals. Tide, village and water dungeon are slow (1.07 s loop). Currents and the waterfall are fast (0.27 s). Lava is an 8-step ping-pong 0, 1, 2, 3, 3, 3, 2, 1.

*Cost / performance.* One VRAM bank copy per animation step on old hardware. In Godot, atlas animation picks the frame from global time, with no CPU work per tile and no extra draw calls if tiles share one atlas [I, note 03].

*Games that used it.*
- ALttP (zelda3 reimplementation): https://github.com/snesrev/zelda3/blob/master/src/misc.c
- Link's Awakening DX: https://github.com/zladx/LADX-Disassembly/blob/main/src/code/home/animated_tiles.asm

*How it feels.* "The sea breathes." Calm water at 2.3 to 3.75 fps and fast water at 7 to 15 fps is the classic band [I, note 01]. Loops under half a second read as jitter, and loops over 3 s read as frozen.

*Risks.* Perfect sync can make a large sea pulse as a grid. ALttP and Pokémon hide this with art that wraps cleanly in the sway direction [I, note 01]. Random start times break the grid but tear foam lines that must match at seams (B4).

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 5 · Mood 3 · Interactivity 1

### A3. Row-offset waves: HDMA and the sine wobble

*In plain words.* Shift each row of the picture sideways by a little sine. The picture wobbles like seen through water. The SNES did it for free, one scroll value per scanline.

*How it works (technical).*
- **SNES HDMA** [V, S20, S21]. HDMA writes BG1HOFS ($210D) every scanline with transfer pattern "write twice", so 2 bytes per line. One example uses a 48-word sine table at 16.5 px amplitude, repeated 5 times over 240 lines through an indirect table. Animate by moving the table start each frame.
- **Godot** [I, note 01]. A canvas shader that offsets `UV.x` by `A × sin(y × k + t × w)`, snapped to whole pixels. Use 1 to 2 px for calm water and 4 to 16 px only for heat or dream effects. Key the offset to world y, not screen y, or tiles slide under a moving camera.

*Cost / performance.* Zero CPU per pixel on SNES, 2 bytes per scanline [V, S20]. In a shader, one sine per row.

*Games that used it.*
- SNES HDMA wave examples: https://snes.nesdev.org/wiki/HDMA_examples

*How it feels.* Dreamy. It is right for an underwater view or a whole-screen "you are in the water" moment, and wrong for every tile of a sea [I, note 01].

*Risks.* Whole-screen wobble is the highest motion-sickness risk in this study (H2) [I, note 06]. Sub-pixel offsets make mixels.

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 3 · Mood 3 · Interactivity 1

### A4. Tibia water: 500 ms phases and position patterns

*In plain words.* Tibia's sea is ground items that animate on one global clock. Big water textures pick their sprite by world position, so a 2x2 or 4x4 texture covers the sea without a visible repeat. No water state crosses the network.

*How it works (technical).*
- **Clock** [V, S27]. OTClient defines `ITEM_TICKS_PER_FRAME = 500`. Phase is `(millis % (500 × phases)) / 500`, so every copy of an item animates in sync.
- **Newer .dat** [V, S28]. Each animation stores an async flag, loop count, start phase and a (min, max) duration per phase.
- **Patterns** [V, S27]. Ground items pick their sprite pattern by `position.x % numPatternX` and `position.y % numPatternY`. This breaks the tile grid for free.
- **Phase count** [U, S29, S30, S31]. Forum users describe 7.4 water as "16 steps of 8 sprites", and water border corners with 2 layers and 16 phases. At 500 ms that is an 8 s loop [I, from S27]. We have no verified per-phase milliseconds for modern Tibia.
- **Shore layering** [U, S30]. Users say borders after 7.6 are two overlapped grounds, one shore with water animation and one floor.

*Cost / performance.* One integer divide per animated item per frame on the client. Zero network.

*Games that used it.*
- OTClient item animation: https://github.com/edubart/otclient/blob/master/src/client/item.cpp

*How it feels.* Slow and calm. An 8 s loop is three to eighteen times longer than console water, which suits an MMO screen that players stare at for hours [I, note 01].

*Risks.* The 16-phase figure is from forum posts. Patterns only hide repetition if the texture is drawn to wrap across pattern edges [I].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 4 · Mood 3 · Interactivity 1

### A5. Stardew's overlay shimmer

*In plain words.* Paint the water, shore and depth bands as normal map tiles. Then draw one half-transparent shimmer strip over every water tile, tinted by season, scrolling slowly. Only the shimmer moves.

*How it works (technical).* From a public decompile of `GameLocation.cs` [V, S110]:
- **Frames.** `waterAnimationIndex = (waterAnimationIndex + 1) % 10` with a 200 ms timer. 10 frames at 5 fps, a 2.0 s loop.
- **Source.** Cursors.png at y = 2064, 64 px wide (16 art px at 4x zoom). Two variant rows.
- **Anti-tiling.** The variant row is picked by `(x + y) % 2`, a checkerboard, and swapped whenever the scroll wraps.
- **Scroll.** Off the farm, `waterPosition += (sin(ms/1000) + 1) × 0.15` per update, 0.15 to 0.28 px per frame in 64-px space. On the farm a flat 0.1. That is about 2.3 to 4.2 art px/s, and 1.5 on the farm [I, note 09].
- **Edges.** A tile whose upper neighbour is not water gets a cropped source rect, so the strip never spills onto land.
- **Tint.** Default `Color.White × 0.33`. Per season, times 0.5 alpha. Spring (120, 200, 255), summer (60, 240, 255), fall (255, 130, 200), winter (130, 80, 255).

*Cost / performance.* One extra sprite draw per visible water tile, no shader [I, note 09].

*Games that used it.*
- Stardew Valley GameLocation.cs (decompiled): https://github.com/E-riCA0/StawdewValley

*How it feels.* Gentle and alive. The sine term makes the drift breathe. The pink fall tint shows that the colour is art direction, not physics [I, note 09].

*Risks.* Alpha blending leaves the palette unless the tints are chosen to land on palette colours. The decompile's game version is unknown [V, S110; U on version].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 4 · Mood 4 · Interactivity 1

### Family B: Shorelines and autotiling

### B1. Autotiling the coast: blob 47, Wang 16 and the dual grid

*In plain words.* The coast needs a different tile wherever water and land meet at a different angle. Three schemes exist. The one to use draws tiles on a second grid shifted half a tile, so each drawn tile looks at four map cells and needs only 16 pictures.

*How it works (technical).*
- **Blob** [V, S39]. 47 tiles, "a 47 tile subset of a 2-edge 2-corner Wang tileset" of 256. A corner counts only when both adjacent edges are set.
- **Why 16 edge tiles fail** [V, S40]. "Inner corners are unsolvable with edge information alone" on a 4-neighbour grid.
- **Dual grid** [V, S40, S41]. The render grid sits half a tile off the painted grid. Four corner bits index a 16-entry array. "The dual-grid way needs 15", against 47 for a blob. Mask 9 is a real diagonal piece. With rotation, 6 tiles cover all cases (indices 0, 1, 3, 5, 7, 15). Kyle Dunbar's Feb 2026 variant gets it to 5 tiles with rotation [V, S45].
- **Runtime trap** [V, S44]. Users on Godot 4.2 to 4.5 report `set_cells_terrain_connect` blocking the main thread, one at 4 to 5 ms per call. A forum reply says it is "not intended to be used at runtime".

*Cost / performance.* Art per terrain pair per frame at 32x32 RGBA. Blob 188 KB, dual grid 64 KB, rotated dual grid 24 KB [I, note 03]. A full rebuild of a 256x256 map is 65,536 lookups, once at load. An edit touches 4 display cells.

*Games that used it.*
- TileMapDual (Godot): https://github.com/pablogila/TileMapDual

*How it feels.* Correct coasts with real inner corners and clean diagonals. One-tile ponds and one-tile channels draw right with the same 16 tiles [I, note 03].

*Risks.* 3/4 view breaks rotation. A south-facing shore shows a bank face and a north-facing one does not, so plan on 15 or 16 drawn tiles [I, note 03]. Saddle cases (masks 5 and 10, the diagonal checkerboards) have no cited rule; resolve them consistently toward water or land [I, note 03].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 5 · Mood 4 · Interactivity 2

### B2. Overlay shores on an animated base (Ultima VI, Tibia)

*In plain words.* Animate one full water tile only. Draw the shore pieces as see-through overlays on top of it. The border set never needs its own animation frames.

*How it works (technical).*
- **Ultima VI via Nuvie** [V, S19]. Frame = `(game_counter & mask) >> shift` from the animdata file. Nuvie makes the 32 tiles from index 16 onward transparent with animmask.vga and draws them over 4 base water tiles, so shore pieces reuse the animated water underneath.
- **Tibia** [U, S30]. Shore borders combine a water ground with animation and a floor ground. RME stores each border as edge direction to sprite ID entries, linked from grounds.xml [V, S32]. Posters report ugly results when more than 2 border types meet [V, S32].
- **Piece count** [I, note 03]. About 12 overlay pieces, 4 edges, 4 outer corners and 4 inner corners, over a full water or full land ground.

*Cost / performance.* Animated art drops from 47 or 16 border tiles × N frames to N frames of one water tile [I, note 01]. One extra overlay draw per shore cell.

*Games that used it.*
- Ultima VI (Nuvie TileManager): https://github.com/nuvie/nuvie/blob/master/TileManager.cpp

*How it feels.* The sea stays one unbroken animated surface and the land sits on top of it. One shore set fits any floor [I, note 03].

*Risks.* Overlays must line up with the animated base at every frame, or the seam flickers. Three or more terrains meeting at a corner need care [V, S32].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 4 · Mood 3 · Interactivity 1

### B3. Distance-to-shore field: BFS, chamfer and jump flooding

*In plain words.* For every water tile, store how many tiles away the nearest land is, and for land, how far the nearest water is. Compute it once. That one number later decides colour, foam, wave timing, caustics, fishing zones and sound.

*How it works (technical).*
- **Multi-source BFS** [I, note 03]. Seed every water tile with a land neighbour at 1, walk outward, cap at about 8 tiles. Store signed distance in a byte with 128 as the shoreline. A 256x256 map is 64 KB.
- **Chamfer 3-4** [V, S49]. Two raster scans, weights 3 and 4, approximate 3x Euclidean because the best diagonal ratio is close to 4/3.
- **Shapes** [I, note 03]. 4-neighbour BFS gives diamond bands that look wrong around headlands. 8-neighbour gives square bands. Chamfer gives rounder bands for the same O(N).
- **Jump flooding** [V, S47, S48]. log2(N) full-screen passes with steps N/2, N/4 down to 1, 9 samples per pass. Approximate, with "very little error in practice". Separable X then Y gave "a LOT of errors".
- **Croakwood** [V, S46]. An orthographic camera renders everything that touches the water into an outline texture, then the GPU computes distance to the nearest shore pixel. The field wraps any shape and blends between nearby objects.
- **Upload** [I, note 02]. R8 texture, 1 texel per tile, linear filter. Bilinear on a per-tile field gives diamond contours at corners, so add noise to `d` before banding or upsample 2x.

*Cost / performance.* BFS on 65,536 cells is O(N), estimated well under 10 ms in C# or C++ and tens of ms in GDScript; unmeasured [I, note 03]. Computing distance inside the shader costs 36 texel fetches per pixel by one forum estimate [U, S50], against 1 for a baked field. JFA at 256x256 is 8 passes, worth it only if the coast changes every frame.

*Games that used it.*
- Croakwood devlog 5: https://www.texelraptor.com/blog/croakwood-devlog-5

*How it feels.* Invisible on its own, but every water effect that follows the coast gets smoother and more coherent because they all read the same number [I].

*Risks.* Diamond artefacts from plain 4-neighbour BFS. A field computed from the tile mask must be rebuilt when tides change it; one computed against height only shifts a threshold (B5) [I, note 02].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 4 · Mood 4 · Interactivity 3

### B4. Foam bands, lapping waves and the wet-sand band

*In plain words.* Three things make a beach read. A foam line runs up the sand and slides back. A darker wet band stays behind and dries. The water near the shore is lighter and shows the sand.

*How it works (technical).*
- **Shader form** [I, notes 02, 05]. `phase = d × k + t × w`, `foam = fract(phase) < 0.15 and d < shallow_width`. Waves move toward the shore. Near the coast shrink the wavelength as `d → 0`, because shallow water slows waves and crests bunch up.
- **Starting numbers** [I, notes 03, 05]. Wavelength 12 to 16 px, period 3 to 5 s, foam band 3 to 6 px. Run-up `A × max(0, sin(2πt/T))` with A = 2 to 4 px. The wet band fades over about 1 s after retreat.
- **Tile form** [I, note 03]. An 8-frame overlay strip. Frames 0 to 4 advance 1 to 3 px each up the sand, frames 5 to 7 retreat and thin out. Use 3 palette shades for sand (dry, damp, wet), so the wet band is a palette swap.
- **Art rules** [V, S104, S69]. A lighter spray line at the shore and darker wet sand make the water read as higher than the land. Crests are "slightly steeper" than dips.

*Cost / performance.* With a baked distance field, 1 to 2 texture reads per pixel. 57,600 pixels at 320x180 [I, note 03].

*Games that used it.*
- Pokémon Emerald shore animations: https://raw.githubusercontent.com/pret/pokeemerald/master/src/tileset_anims.c

*How it feels.* The beach becomes the best-looking strip of the map. Real swash runs 5 to 15 s, which feels sluggish on screen; 3 to 5 s reads as waves [I, note 03].

*Risks.* Foam that ignores inner corners (B1). Swash on a cliff edge, which looks wrong (B6). Waves faster than about 2 s look nervous [I].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 4 · Mood 5 · Interactivity 2

### B5. Tides as a water level against height

*In plain words.* Give every tile a height. Water is wherever height is below the sea level. Move the sea level slowly and the beach floods and drains, with no new art.

*How it works (technical).*
- Study #3 already uses "depth mask against flood level" for puddles [V, S4]. This is the same at sea scale.
- **Dual grid** [I, note 03]. With height per corner, the tide level is the marching-squares iso value. Changing it only changes which display tiles are chosen.
- **Step size** [I, note 03]. Keep 3 to 5 discrete tide steps per cycle, so the autotile rebuild happens a few times per cycle. A beach slope of 1 height unit per 2 to 3 tiles touches a band 2 to 3 tiles wide per step, a few hundred cells on a 256x256 map. Use your own index cache and `set_cell`, not terrain connect [V, S44].
- **Smooth between steps** [I, note 03]. Pass a fractional level as a shader uniform and shift the foam and wet-sand bands with it, while the grid steps.
- **Gameplay** [V, S53]. Tide reveals of paths and resources are a known mechanic ("The receding sea reveals hidden paths").
- Tibia has no tides as far as our researchers found [I, note 03].

*Cost / performance.* A rebuild of a few hundred cells per step. One byte per tide change on the network (F1).

*Games that used it.*
- Tide or Hide (listing): https://gg.deals/game/tide-or-hide/

*How it feels.* A living coast. A path to an island that opens twice an hour is a meeting point in an MMO [I].

*Risks.* Walkability changes, so the server must own it and push players off newly flooded tiles [I, note 08]. No shipped top-down 2D MMO tide was found [I, note 03].

*Ratings 1–5 (author judgement):* Simplicity 3 · Speed 4 · Pixel taste 4 · Mood 4 · Interactivity 4

### B6. Coasts and rivers from a heightmap

*In plain words.* Generate land from summed noise, push the edges into the sea and cut at a water level. Gentle slopes at the waterline become beaches with waves, steep ones become cliffs with spray. Then let rain drain downhill, count how much passes each tile, and draw rivers where the count is high.

*How it works (technical).*
- **Coast** [V, S51]. `e = 1·noise(1x) + 0.5·noise(2x) + 0.25·noise(4x)`, normalised by 1.75, redistributed with `pow(e, exponent)`. Island shaping `e = lerp(e, 1 − d, mix)` with mix about 0.5. Water where `e < waterlevel`, "a threshold between 0.2 and 0.5 work well", and beach as the next thin band. Falloff maps do the same with a distance term [V, S52].
- **Slope class** [I, note 03]. Take the land-side rise over 2 tiles at each shore tile. Under about 0.03 per tile in Red Blob units means beach and swash; steeper means cliff and splash only. The same class decides walkability.
- **3/4 cliffs** [I, notes 03, 09]. A south-facing cliff shows a face 1 to 2 tiles tall and the water meets its base. Draw the face 4 to 8 px into the water, a 1 px dark contact line, then a thin foam strip with a 2 to 4 frame splash on about a 1 s loop.
- **Rivers** [V, S65, S66]. Patel's 2010 maps walk rivers from high corners downhill to the ocean, with elevation rising away from the coast so there are no pits. Red Blob's river growing uses a noise-biased BFS from the border and Strahler numbers for width, at 4 to 7 M nodes/s in JS on a 2013 laptop. Azgaar makes lakes in depressions [V, S68]; mewo2 draws rivers only above a flux threshold [U, S67].
- **Tile recipe** [I, note 04]. Fill pits by priority flood from the coast. Point each tile at its lowest 4-way neighbour. Accumulate rain from high to low. River where the sum passes T, 1 tile wide up to Strahler 2, 2 tiles at 3. The pointer becomes the flow byte of C2. Steep drops become waterfalls, low crossings fords, high ones bridges.

*Cost / performance.* Offline at world creation, one sort and two linear passes. A 1,024 x 1,024 world is estimated under a second [I, note 04]. Save one height byte per tile; clients derive the rest [I, note 03].

*Games that used it.*
- Red Blob, terrain from noise: https://www.redblobgames.com/maps/terrain-from-noise/

*How it feels.* A coast of sandy coves and rocky points, and rivers that always run downhill to the sea. Players notice when water breaks that rule [I].

*Risks.* No cited artist breakdown of water against cliffs in 3/4 pixel art exists in our notes [I, notes 03, 09]. The slope and river thresholds are guesses. Hand-place important rivers.

*Ratings 1–5 (author judgement):* Simplicity 3 · Speed 5 · Pixel taste 4 · Mood 4 · Interactivity 3

### Family C: Rivers and flow

### C1. Flow maps with two-phase blending

*In plain words.* A small picture of arrows tells a ripple texture which way to slide at each spot. Sliding too long smears it, so run two copies half a cycle apart and fade between them. The water flows around rocks and never stretches.

*How it works (technical).*
- **Valve, SIGGRAPH 2010** [V, S54]. One flow texture covers the whole surface at "~4 texels/meter", with a tiled normal map on top. Distortion looks right for "the first 1/3 of uv space" (Max and Becker 1995), so distort a short window only. Two layers, "each layer is offset half a phase". A noise texture offsets the phase per pixel to kill pulsing. Normal strength is scaled down by flow speed.
- **Result** [V, S54]. Testers in Left 4 Dead 2 swamps "took 17% fewer wrong turns".
- **Formulas** [V, S55]. Flow in RG, decode `rg × 2 − 1`, noise in A, import as non-sRGB, keep it uncompressed. `progress = fract(TIME × speed + noise + phaseOffset)` with offsets 0 and 0.5. `uv' = uv − flow × (progress + flowOffset)`. Weight `w = 1 − |1 − 2 × progress|`, so the two weights sum to 1.
- **Pixel art** [I, note 02]. Use the colour-map offset (peak at rest) and snap the final UV with `floor(uv × size) / size` to avoid sub-pixel shimmer. A tile engine already has a flow map at 1 texel per tile, the per-tile direction of C2.

*Cost / performance.* +2 texture fetches and +21 pixel shader ALU instructions over two scrolling normal maps, on 2010 hardware [V, S54]. Our canvas_item sketch is 3 fetches per pixel, about 173,000 per frame for a full-screen sea at 320x180 [I, note 02].

*Games that used it.*
- Portal 2 and Left 4 Dead 2 (Vlachos slides): https://www.advances.realtimerendering.com/s2010/Vlachos-Waterflow(SIGGRAPH%202010%20Advanced%20RealTime%20Rendering%20Course).pdf

*How it feels.* Rivers that clearly go somewhere. The 17% result is a gameplay argument, not only a looks one [I, note 02].

*Risks.* Smooth distortion and pixel art disagree; snap or it shimmers. Painting flow by hand is slow, which is why tile direction data is the better source [I, note 07]. No cycle length in seconds is given in the slides [I, note 02].

*Ratings 1–5 (author judgement):* Simplicity 3 · Speed 4 · Pixel taste 3 · Mood 4 · Interactivity 2

### C2. Per-tile flow and forced currents

*In plain words.* Each river tile stores which way it flows and how fast. The client scrolls the water art that way. The server moves anything standing on it one tile that way on a timer. Pokémon did exactly this.

*How it works (technical).*
- **Pokémon Emerald** [V, S61]. Metatile behaviours `IsSouthwardCurrent`, `IsNorthwardCurrent`, `IsWestwardCurrent`, `IsEastwardCurrent` and `IsWaterfall` each map to a forced move. `DoForcedMovement` checks collision in the push direction; if blocked, the player regains control.
- **Speeds** [V, S62]. Walking is 16 steps of 1 px. Surfing (FAST_1) is 8 steps of 2 px. A current (FAST_2) is 6 steps of 2, 3, 3, 2, 3, 3 px. On 16 px tiles at 60 fps that is 3.75, 7.5 and 10 tiles per second [I, note 04].
- **Routes 133 and 134** have strong westward currents [V, S63]. Zelda Wiki says currents block movement against the flow while dashing gives some control [V, S64].
- **For Asterion** [I, note 04]. A direction (8 values) and a speed (0 to 3) per tile. The server queues a forced step every N ms. Input with or across the flow is allowed, against it costs a speed penalty. Items drift one tile per K seconds; heavy ones stay.

*Cost / performance.* One lookup per step on the server. One scroll offset per tile on the client [I, note 04].

*Games that used it.*
- Pokémon Emerald Route 134: https://bulbapedia.bulbagarden.net/wiki/Route_134

*How it feels.* A river that grabs you. Being carried 1.33x faster than you can swim is fun because the player sees where it goes [I, note 04].

*Risks.* Forced moves fight player intent. Always end the push at a blocking tile or the shore, and never push into a hazard without warning [I].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 4 · Mood 4 · Interactivity 5

### C3. Waterfalls and rapids

*In plain words.* A waterfall has three parts. A bright lip at the top, a falling strip that scrolls down and darkens, and a splash at the bottom that loops in step with the fall. Add a few white mist pixels at the base. Rapids are river tiles with a steep drop, drawn whiter and scrolled faster.

*How it works (technical).*
- **Anatomy** [V, S69]. Slynyrd splits a waterfall into mouth, flow and splash. The mouth is brighter with more reflections. Vertical bands sag and darken as they fall, then break up at the base. The sparkle surface is a 6-frame loop, and the splash "loops in sync with the flow".
- **Shipped timings** [V, S16, S18]. Emerald's waterfall is 4 frames of 16 video frames (1.07 s). LADX's waterfall group runs at the fast 4-frame interval (0.27 s), with a separate slow waterfall group.
- **Pokémon** [V, S61]. `IsWaterfall` reuses the southward current handler, so climbing needs the Waterfall move.
- **Starting values for 32 px tiles** [I, note 04]. A strip 1 tile wide and 2 to 4 tall, scrolled at 32 to 64 px/s or palette-cycled through 4 to 8 band colours. A 4 to 6 frame foam ring at the base, and 1 to 3 mist pixels per 100 ms that rise and fade over 0.5 to 1 s. Rapids scroll at 2x river speed and push (C2).
- **CrossCode** [V, S129]. Joining a curved waterfall to its pool was "far from trivial".

*Cost / performance.* A few sprites and one scroll offset [I, note 04].

*Games that used it.*
- Pokémon Emerald waterfall tiles: https://github.com/pret/pokeemerald/blob/master/src/tileset_anims.c

*How it feels.* The loudest, brightest thing on the map. Players navigate by them [I].

*Risks.* A splash out of sync with the flow breaks the loop [V, S69]. Mist with alpha leaves the palette; use 1 px white dots [I].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 5 · Mood 5 · Interactivity 3

### C4. Flowing-water automata: levels, mass and dirty chunks

*In plain words.* When water must actually move (a dam breaks, a bucket is poured), store a small amount per cell and let it fall and spread each tick. The important part is skipping cells that have settled.

*How it works (technical).*
- **Minecraft** [V, S56]. Sources are level 0, flowing water 1 to 7, level 8 is falling. Spread is 1 block every 5 game ticks, 4 blocks per second, up to 7 blocks. Each side starts at weight 1000; the game searches up to 4 blocks for a drop and flows only toward the lowest-weight sides. A flowing cell touching 2 sources on solid ground becomes a source.
- **Dwarf Fortress** [U, S57]. Depth 0 to 7. Dwarves wade to 3, swim at 4 and up, and drown at 7 if unskilled (v0.34). Pressure moves water only orthogonally and fills to the source level.
- **Noita** [V, S59]. Each liquid pixel tries down, then sideways. The world updates bottom-up in 64x64 chunks with dirty rects, in four checkerboard passes so threads need no locks.

*Cost / performance.* A 64x64 local sim is 4,096 cells, about 16,000 neighbour checks per tick, estimated under 0.1 ms in fast code [I, note 04]. No shipped game publishes ms per tick.

*Games that used it.*
- Minecraft water: https://minecraft.wiki/w/Water

*How it feels.* Integer levels look stepped and stable. Float mass looks smooth and needs minimum-flow clamps, or it jitters and duplicates water [I, note 04].

*Risks.* In an MMO, shared water that changes must live on the server and be broadcast. Keep it event-driven and let it settle [I, note 04].

*Ratings 1–5 (author judgement):* Simplicity 3 · Speed 4 · Pixel taste 3 · Mood 3 · Interactivity 4

### Family D: Depth, colour and surface

### D1. Depth bands, hue-shifted ramps and biome tints

*In plain words.* Deeper water is darker, less saturated and a bit more violet. Shallow water shows the ground and leans teal. Four or five colours per body of water are enough, picked by depth band. A swamp or a cave pool reuses the same water with another tint.

*How it works (technical).*
- **Depth rules** [V, S104]. Deeper bands are darker and less saturated. Shift the deep hue slightly away from green and blue to lower contrast with warm sprites; "reds are quickly lost" at depth. A poster citing Dauphin fixed oversaturated water with lower saturation and some transparency. Give shallow water the texture of the ground below it [V, S104, S105].
- **Ramps** [V, S102, S103, S106]. A general ramp uses 9 swatches with 20° hue shift per step. Slynyrd's sparkly sea used 16 colours; a Lospec river loop uses 26; Lospec lists an 8-colour all-blue water palette.
- **Budget for Asterion** [I, note 06]. Deep 2, mid 2, shallow tint 1 to 2, highlight 1, foam 1, wet sand 1, about 8 to 9 colours. Quantise with `floor(d × 4) / 4` and Bayer-dither band borders, as in #1 [I, note 02].
- **Biome tints** [V, S121, S110, S22]. Terraria has 12 water styles, from Forest blue to jungle teal and cavern murky purple. Stardew tints one shimmer per season (A5). Tibia swamp tiles bubble green where sea bubbles blue.
- **Swamp recipe** [I, note 09; V, S46]. 3 to 4 colours from olive to dark teal-brown, shimmer at about 25% alpha and half speed, a 2 to 3 frame bubble per 6 to 10 tiles, lily pads that bob 1 px out of phase, reeds on shore edges, no reflections. Croakwood's pond look came from small tweaks to colour, transparency and outline width.

*Cost / performance.* One lookup into a 4 to 5 entry ramp per pixel from the B3 field, plus one modulate colour per biome [I].

*Games that used it.*
- itch.io water depth thread: https://itch.io/post/14590926/view-in-topic

*How it feels.* The biggest step from "blue rectangle" to "sea". Depth by value and texture also survives colour blindness [I, note 06].

*Risks.* Saturated blue with bright cyan highlights is the most common critique [V, S104; I, note 06]. Each shallow ground type needs its own palette plan [V, S104]. No game documents a swamp recipe; ours is a proposal [I, note 09].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 5 · Mood 4 · Interactivity 2

### D2. Scrolling-noise surface with banded colour

*In plain words.* The default indie water shader. Two noise textures slide in opposite directions, multiply, and the result picks one of a few colours. Highlights appear where the product crosses a threshold.

*How it works (technical).*
- **Pixel Water for 4.3** [V, S87]. Noises scrolled at (0.05, 0.05) and (−0.05, −0.05), multiplied. Highlight `smoothstep(0.275, 0.4, depth)`. `pixelSize` 2.0, distortion 0.2. A commenter reports sharp edges on TileMapLayer.
- **Pond Water** [V, S91]. `floor(UV × pixel_amount) / pixel_amount`, then `round(noise × color_amount) / color_amount` into a GradientTexture1D. color_amount 1 to 20; the author liked pixel amount 200.
- **Advice** [I, note 02]. Scroll at a 1 : 0.7 speed ratio so the product never visibly repeats. A 64 px tile at 0.05 UV/s repeats every 20 s.

*Cost / performance.* Two 64x64 or 128x128 fetches per pixel. The 25 + 30 iteration hash shader is the wrong trade on the web [I, notes 02, 07]. None of these shaders publish a GPU cost.

*Games that used it.*
- Pond Water Shader (CC0): https://godotshaders.com/shader/pond-water-shader-2d-top-down/

*How it feels.* Pleasant and generic. It reads as water at once and as nobody's water after a minute [I].

*Risks.* Non-pixel shaders in pixel games look jarring unless UVs are pixelated first [V, S91]. Several read `SCREEN_TEXTURE`, which has web problems (D4) [V, S96].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 4 · Pixel taste 3 · Mood 3 · Interactivity 1

### D3. Caustics and glints

*In plain words.* Two kinds of light on water. Caustics are the bright net on a shallow floor; bake one tiling texture, slide two copies and draw it only where the water is shallow. Glints are single white pixels that flash for a moment and move on, picked by a hash so no list is kept.

*How it works (technical).*
- **Texture caustics** [V, S88]. Base and highlight caustic textures sampled at UVs offset by noise × 0.15 and faded by a noise mask.
- **Procedural** [V, S92, S93]. A port of Shadertoy MdlXz8 iterates a trig warp 5 times by default. A Voronoi caustic puts bright lines where the nearest and second-nearest distances are close, which costs 9 cell hashes per pixel per layer [I, note 02]. Bake it.
- **Shortcuts** [V, S94]. A Shadertoy Moana scene sampled caustics by world position and accepted visible tiling.
- **Gate** [I, notes 02, 05]. Caustics only on depth bands 1 and 2, posterised to 2 or 3 palette steps.
- **Glints** [V, S70, S69]. Slynyrd adds "a few highlights" plus a dark drop shadow a couple of pixels under bright lines; his sparkle surface is a 6-frame loop. Pixel Art Water thresholds two opposite-scrolling layers minus a static noise at 0.35 [V, S88].
- **Hash glints** [I]. `if hash(cell, floor(t / 0.2)) < 0.004: draw 1-2 px near-white for 2-3 frames`. Desaturate toward white, not cyan [I, note 06]. At night allow glints only under the moon (H1).

*Cost / performance.* 2 fetches per pixel for texture caustics [I, note 02]. One hash per cell per step for glints [I].

*Games that used it.*
- Pixel Art Water shader: https://godotshaders.com/shader/pixel-art-water/

*How it feels.* Sun on a shallow lagoon. Caustics say "you can stand here" better than any colour, and three glints make a flat sea bright [I].

*Risks.* Shadertoy code is CC BY-NC-SA 3.0 by default [V, S92; I, note 07]. Caustics over deep water lie about depth. Too many glints become noise [I, note 06].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 4 · Pixel taste 4 · Mood 4 · Interactivity 1

### D4. Reflections in 3/4 view

*In plain words.* Trees, huts and people near water draw an upside-down, darker copy of themselves under their feet, cut off where the water ends, with a small sideways wobble. Do not flip the screen; in 3/4 view the pixel above the water is not what would reflect there.

*How it works (technical).*
- **Screen flip** [V, S95, S96]. The first node using `hint_screen_texture` triggers a full back-buffer copy. Forum reports say screen-texture shaders break in web exports and behave oddly under Compatibility. A Godot 4.2 thread reports a reflective shader breaking at some camera Y values [V, S90].
- **Mirrored sprites** [V, S97]. Flowa duplicates sprites, flips them and places them between water and background, with ripples on top. The player's flipped sprite faces the wrong way, so its reflection is a flat colour hidden under ripples. Levels stay under 200 draw calls.
- **Pokémon style** [V, S100]. A CC0 shader widens the quad and shifts left and right halves on a timed step, for a stepped pixel wobble. It works on AnimatedSprite2D but not on TileMap tiles.
- **For Asterion** [I, note 02]. One extra Sprite2D per shore object with `flip_v`, modulated darker, a per-row sine x offset snapped to whole pixels, clipped to a water mask. Render reflection sprites into a 320x180 SubViewport and sample it in the water shader to avoid `hint_screen_texture`.

*Cost / performance.* One extra sprite per reflecting object, or one SubViewport [I, note 02].

*Games that used it.*
- Flowa reflections devlog: https://jacobknispel.itch.io/flowa/devlog/261753/2d-reflections-quick-dirty

*How it feels.* Players remember it. A commenter calls Stardew's reflection mod "one of the best", and Sea of Stars reviews mention its real-time reflections [V, S113, S128].

*Risks.* Directional sprites reflect wrong [V, S97]. Murky swamp water should not reflect at all (D1).

*Ratings 1–5 (author judgement):* Simplicity 3 · Speed 4 · Pixel taste 4 · Mood 5 · Interactivity 3

### Family E: Interaction

### E1. Ring decal pool

*In plain words.* Every ring on the water, from a swimmer, a bobber or a stone, is one small expanding ellipse sprite from a fixed pool. No water grid at all. When the pool is full, reuse the oldest ring.

*How it works (technical).*
- **Stardew** [V, S107]. An idle swimmer counts `swimTimer` down from 800 ms and spawns a ring at 400 ms and at 0 ms, so 2 rings per 800 ms. The ring is `TileSheets\animations` rect (0, 0, 64, 64), 8 frames at `150 − (|xVel| + |yVel|) × 3` ms each, alpha fade 0.003 per tick, about 1.2 s of life. Then the "slosh" sound plays.
- **Network** [V, S107]. Rings go to other players with `broadcastSprites`, a one-shot event, not synced state.
- **Bobber** [V, S108]. Each idle bob spawns the same 8-frame ring at 150 ms with alpha 0.75.
- **Pool size** [I, note 08]. 32 to 64 rings. A Tibia-size view of 15x11 tiles with 20 swimmers holds at most about 50.
- **3/4 view** [I]. Draw rings as ellipses squashed to about 1/3 height, 1 px outline, one palette step lighter than the water. Study #3 has the ring decal and the two-buffer ripple for puddles [S4].

*Cost / performance.* One sprite draw per live ring. Zero cost when nothing moves [I, note 08].

*Games that used it.*
- Stardew Farmer.cs (decompiled): https://github.com/veywrn/StardewValley/blob/master/StardewValley/Farmer.cs

*How it feels.* Response. A plain animated tile is accepted, rings under your feet are praised [I, note 06]. At 0.75 alpha and 1.2 s life rings feel calm; at 0.6 s they read as rain [I, note 08].

*Risks.* Rings do not interfere or reflect off shores. Nobody notices at 320x180 [I]. A camera-local render target cannot hold a persistent trail, a problem a Godot user hit with particles [V, S132].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 5 · Mood 4 · Interactivity 5

### E2. Kelvin wakes from spawn spacing

*In plain words.* Anything moving through water leaves a V behind it. For walkers, swimmers and rowboats the arms sit about 19.5° each side of the path, at any speed. Drop a small ring every few pixels travelled and the V draws itself.

*How it works (technical).*
- **Angle** [V, S78]. The half-angle is arcsin(1/3) = 19.47°, so the chevron opens about 39°. It comes from deep-water group velocity being half the phase velocity [V, S79].
- **Fast boats** [V, S79]. Rabaud and Moisy measured wakes in airborne images. The angle holds below hull Froude number `Fr = U / sqrt(gL)` of about 0.5 and falls roughly as 1/Fr above it, down to 10° or less.
- **Pixels** [I, note 05]. tan 19.47° = 0.354, so an arm rises 1 px per 2.8 px of travel, a 3, 3, 2 stair.
- **Recipe** [I, note 08]. Every 6 to 8 px travelled, spawn two dots or tiny rings behind the stern, offset sideways by `distance_behind × 0.354`. Each expands and fades over 0.8 to 1.2 s. Spawning by distance keeps arm spacing constant at any speed. Add 1 or 2 transverse bars right behind the mover; at 1 m/s the transverse wavelength is 0.64 m, under one tile [I, note 05].

*Cost / performance.* A fixed particle pool, zero when idle [I].

*Games that used it.*
- Kelvin wake pattern: https://en.wikipedia.org/wiki/Kelvin_wake_pattern
- Stardew Valley swimmer rings (decompiled Farmer.cs): https://github.com/veywrn/StardewValley/blob/master/StardewValley/Farmer.cs

*How it feels.* Speed and weight in one shape. A V behind a boat says "moving" more clearly than any animation of the boat [I].

*Risks.* No shipped top-down boat wake with published numbers was found [I, note 08]. Spawning by time instead of distance makes the arms bunch up when slow [I].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 4 · Mood 5 · Interactivity 5

### E3. Wading and swimming states

*In plain words.* In shallow water, cut the character's sprite at the knees and draw a ring at the cut. In swimmable water, show only head and shoulders and slow down. In deep water, block the step or switch to a swim outfit. Switch automatically by tile type.

*How it works (technical).*
- **Tibia swim** [V, S24, S25]. Ground ids 4620 to 4625 and 4820 to 4825 are "(Swimmable)". StepIn runs `swimming.lua`, which applies an outfit condition `lookType = 267` and removes poison, fire, energy, paralyse, drunk, drown, freezing, dazzled, cursed and bleeding. StepOut removes it.
- **Tibia speed** [V, S37; U, S36]. Step time is `TerrainFactor / Speed × DiagonalFactor`, rounded up to 0.05 s. Grass is 150, sand 160. Shallow water, bog and muddy water are 200 per the fan wiki, about 1.33x slower than grass.
- **Sea of Stars** [V, S128]. The party starts swimming when it walks off a beach.
- **Clip line** [I, note 06]. A `waterline_y` uniform, about 6 px up a 32 px sprite for knee-deep, tint the part below 50% toward water colour instead of hiding it. One ring per footstep, matched to the step sound [I, note 08].

*Cost / performance.* A flag lookup on the destination tile during normal walk validation [I, note 08]. One shader uniform on the client.

*Games that used it.*
- TFS swimming.lua: https://github.com/otland/forgottenserver/blob/master/data/movements/scripts/swimming.lua

*How it feels.* The cheapest way to make water physical. Players want water they can enter; a popular Stardew mod adds swimming everywhere [V, S114].

*Risks.* Never let a tile look shallow and block, or look deep and allow walking [I, note 06]. A swim mod notes a jumpy underwater walk animation [V, S114].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 4 · Mood 5 · Interactivity 5

### E4. Splashes and sinking items

*In plain words.* When something falls in, play two to four frames of droplets, a ring, and a sound. Then delete the item. Floating is an exception you choose for a few props.

*How it works (technical).*
- **Stardew `sinkDebris`** [V, S109]. Debris chunks play "quickSlosh" and spawn the ring sheet for 3 frames at 150 ms. Other items spawn row 28, 2 frames at 300 ms, play "dropItemInWater", and are removed.
- **Stardew pool entry** [V, S109]. Row 27, 4 frames at 100 ms with 2 px per tick of downward motion, `yVelocity −8` and a 500 ms movement lock.
- **Tibia** [V, S22]. Every water and swamp ground is `type="trashholder"`. An item thrown in is destroyed with `bluebubble` (swamp `greenbubble`, lava `fire`).
- **Recipe** [I, note 06]. A 3 to 5 frame burst of 1 to 2 px droplets in foam colour, then a ring that grows over about 0.5 s. Size scales with the object. Study #3 has splashes per surface [S4].

*Cost / performance.* One server flag, no item physics. A handful of client sprites [I, note 08].

*Games that used it.*
- Stardew GameLocation.cs (decompiled): https://github.com/veywrn/StardewValley/blob/master/StardewValley/GameLocation.cs

*How it feels.* Short and satisfying. Splashes are under half a second in shipped games [I, note 08].

*Risks.* Deleting items surprises players who drop something by accident. Tibia accepts that; a cozy RPG may not [I].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 5 · Mood 4 · Interactivity 4

### E5. Floating, bobbing and drifting, and boats

*In plain words.* Things on water move up and down by one pixel on a slow sine and slide with the current. Each object gets its own phase so they never bob together. Boats are bigger floating things with a wake.

*How it works (technical).*
- **Stardew swimmer** [V, S107]. `yOffset = cos(t_ms / 2000) × 4`, 4 px at 4x zoom (1 art px), period about 12.6 s.
- **Values** [I, notes 06, 08]. 1 px amplitude at 320x180, 2 px reads as bouncing. Period 1.5 to 2.5 s for small items, 3 to 4 s for logs and boats. Phase from `hash(id)`. Drift at 4 to 8 px/s along the tile flow (C2), stopping at shore tiles. Clip floating items at a waterline like wading sprites. Sailing boats stop bobbing and show a wake.
- **Boats in MMOs** [V, S38, S123, S124]. Tibia uses NPC captains; Venore's Captain Fearless has 15 destinations, Carlin's Captain Greyhound 7. Ultima Online steers boats by tillerman commands. OSRS Sailing (Nov 2025) has a 1x3 raft, 2x5 skiff and 3x10 sloop, and boat size limits shallow, open or deep sea.
- **Bathymetry** [V, S125]. A Godot add-on reads one authored depth map in both renderer and gameplay, so boats run aground where shallows show.
- **Surfacing** [I, note 08]. Shadow drifts 2 to 4 s, ring plus 3-frame splash, sprite surfaced 1 to 3 s, dive with a 2-frame splash and a ring. The server sends only state changes.

*Cost / performance.* One sine per floating object per frame [I].

*Games that used it.*
- OSRS Sailing: https://oldschool.runescape.wiki/w/Sailing

*How it feels.* A log floating down to the sea is a small story. Bobbing is the motion most likely to bother sensitive players, so keep it to 1 px and let the option freeze it (H2) [V, S138; I, note 06].

*Risks.* Player boats are a large multiplayer cost. Start with NPC travel and a moored ship for mood [I, note 08].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 4 · Mood 4 · Interactivity 4

### E6. Fishing feel: bobber, nibbles, bite

*In plain words.* Fishing is wait, tease, bite, react. A random wait, a few small fake nibbles, then one loud, clear bite cue. In an MMO the server can decide the catch first and let the client play the tease.

*How it works (technical).*
- **Stardew bite time** [V, S108]. `random(600, 30000 − 250 × FishingLevel − spinner)` ms. Spinner −5,000, Dressed Spinner −10,000. First cast × 0.75. Any bait × 0.5, Wild Bait a further × 0.75. Floor 500 ms. The wiki agrees in plain words [V, S111].
- **Stardew window** [V, S108]. `maxTimeToNibble = 800` ms; miss it and a new bite time is rolled. The bite plays a chime and a 0.75 rumble for 250 ms. While nibbling the bobber bobs every 25 to 75 ms with ±5 px jitter. Bubble spots divide the remaining bite time by 2, or 4 in a frenzy [V, S112].
- **Animal Crossing** [V, S117]. Nintendo says fish usually nibble 2 or 3 times, sometimes up to 5, then pull the bobber under with a "kerplunk". Reeling early or late loses the fish. Fan guides say the 5th approach is always the bite [U, S118]. Cozy Grove fish bite within four attempts [V, S119].
- **For Asterion** [I, note 06]. Keep the server roll (F3). The client shows 0 to 3 nibble rings (0.3 s each, 1 px dip) over 1 to 3 s, then the result. A bite is the bobber fully under for 2 to 3 frames, a 2-ring burst and a louder sound. If reaction should matter, the server owns a window of about 0.5 to 1 s plus measured round trip.

*Cost / performance.* A timer and a counter per cast [I].

*Games that used it.*
- Stardew fishing: https://stardewvalleywiki.com/Fishing

*How it feels.* Tension for the price of a counter. Tibia's one-click fishing has no tease at all, and this is the cheapest upgrade in the study [I, note 06].

*Risks.* A client-side window over a laggy connection feels unfair. Theatre over a decided roll is safer [I, note 08].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 4 · Mood 5 · Interactivity 5

### Family F: Server rules for an MMO

### F1. Water as tile flags and one shared clock

*In plain words.* The server treats water as ground tiles with a few yes or no flags. Can you walk, swim, fish, fill a bottle, and does it eat thrown items. It sends its time once, so every client computes the same animation frame and tide. Only the tide byte crosses the network when it changes.

*How it works (technical).*
- **TFS items.xml** [V, S22]. Id 493 "water" is a trashholder with `bluebubble`. Ids 4608 to 4616 are "shallow water", "You see the silvery movement of fish.", trashholder and `fluidSource="water"`.
- **Events** [V, S24, S37]. Swimming and drowning are StepIn and StepOut events on ground id ranges. Ground speed feeds the step-time formula.
- **Flags** [I, note 08]. `WATER_SHALLOW` (walkable, ground speed about 200 against grass 150), `WATER_SWIM`, `WATER_DEEP` (boats only), `WATER_UNDER` (drowning), plus `FISHABLE`, `TRASHHOLDER`, `FLUID_SOURCE` and a flow byte. The server class maps 1:1 to the visual class [I, note 06].
- **Clock** [V, S27, S101]. OTClient takes the phase from `millis`. Factorio says "The water animation depends only on global time." Stardew sends even rings as one-shot events [V, S107].
- **Tide** [I, note 03]. Send `tide_epoch` and `tide_period` at login, for example 20 to 40 real minutes per cycle, or one byte per step. Cosmetics never sync; rings, wakes, glints and bob phase come from hashes and the clock [I].

*Cost / performance.* A flag lookup during walk validation and one byte per tide change [I, note 08].

*Games that used it.*
- TFS movements.xml: https://github.com/otland/forgottenserver/blob/master/data/movements/movements.xml

*How it feels.* Players learn the rule in one step because the art tells them, and every player sees the same wave hit the same rock [I].

*Risks.* Real Tibia keeps walkability in client .dat flags, unverified [I, note 01]. Resync the clock with regular packets to stop drift [I].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 3 · Mood 3 · Interactivity 5

### F2. Drowning and breath

*In plain words.* Either a breath meter that drains and then hurts, or a flat damage tick while you stand on an underwater tile. The second fits a server tick and needs no UI.

*How it works (technical).*
- **TFS** [V, S26]. Underwater ids 5405 to 5410, 5427 to 5438, 5743 to 5744, 5763 to 5764 and 9671 to 9673 apply `CONDITION_DROWN` on StepIn, −20 every 2,000 ms, infinite, removed on StepOut.
- **Live Tibia** [U, S33, S35]. Calassa and the Frozen Trench need a Helmet of the Deep, rented from Captain Max. A TibiaQA user reports 5 × 20 damage after about 4 s.
- **Terraria** [V, S122]. Breath starts at 200 and drops 1 per 7 ticks at 60 fps, about 23.3 s. A Breathing Reed halves the HP loss.
- **Minecraft** [V, S56]. 15 s of breath, then 2 HP per second. Each Respiration level adds 15 s.

*Cost / performance.* One server condition [I, note 08].

*Games that used it.*
- TFS drowning.lua: https://github.com/otland/forgottenserver/blob/master/data/movements/scripts/drowning.lua

*How it feels.* A tile condition is honest and lag-proof. A breath meter is tenser but needs a UI and a client-server agreement on when it runs out [I].

*Risks.* TFS is emulator code, not CipSoft's. See §12 for the 2 s against 4 s conflict.

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 3 · Mood 3 · Interactivity 4

### F3. Fishing chance and fished-out tiles

*In plain words.* One click, one roll that grows with skill and stops at 50%, one worm used on a catch. The tile can go empty for a while.

*How it works (technical).*
- **TFS fishing.lua** [V, S23]. Valid targets are 493, 4608 to 4625, 7236, 10499, 15401 and 15402; 493 and 15402 give nothing. Each use adds 1 skill try and shows `CONST_ME_LOSEENERGY`. Chance is `min(max(10 + (skill − 10) × 0.597, 10), 50)` percent. A success uses one worm (3976) and gives fish 2667.
- **Fan fit** [V, S34]. Gorak (2011) fits normal fishing as `min(10 + 0.6 × L', 50)`%, ice fishing `min(5 + L'/2, 50)`%, with `L' = skill − 10`.
- **Depletion** [V, S22, S34]. Ids 4617 to 4619 decay back to 4608 to 4610 after 1,200 s (20 min). A 7.70 analysis says a fished tile gives no fish or skill but still splashes. The current TFS script never makes that swap, so it may be legacy data [I, note 01].

*Cost / performance.* One d100 per click, one tile swap with a decay timer [I].

*Games that used it.*
- TFS fishing.lua: https://github.com/otland/forgottenserver/blob/master/data/actions/scripts/tools/fishing.lua

*How it feels.* Linear and readable. Players can do the maths, which suits a skill grind [I, note 01].

*Risks.* Pure RNG gives little agency (E6) [V, S120]. Depletion invites players to spread out, which is good, or to camp, which is not [I].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 3 · Mood 3 · Interactivity 4

### F4. Element reactions on water

*In plain words.* Fire on water makes steam, ice makes a walkable sheet, lightning makes the water hurt. In a tile game each reaction is a tile swap or a field item with a timer.

*How it works (technical).*
- **DOS2** [V, S126]. Ice on water makes a Frozen surface. Fire on water makes a Steam Cloud. Shock on steam makes an electrified cloud that applies Shocked, then Stunned. Players report shock on plain water sometimes does nothing, so the rules are not fully consistent.
- **Minecraft** [V, S56]. Water source plus lava source makes obsidian, flowing water plus flowing lava makes cobblestone. Open-sky water in snowy biomes may freeze.
- **Terraria** [V, S121]. Water plus lava makes obsidian; water removes On Fire!.
- **Study #6** covers steam and lava visuals [S7].
- **Asterion table** [I, note 08]. Ice spell on `WATER_SHALLOW` makes ICE (walkable, ground speed about 110, decays back). Fire on water makes a STEAM field that blocks sight. Energy on water makes an ELECTRIFIED field by flood fill limited to 3 to 5 tiles. Oil on water drifts with the flow and burns on fire contact.

*Cost / performance.* One field item with a duration per reaction, like Tibia's fire fields [I, note 08].

*Games that used it.*
- Divinity: Original Sin 2 combinations: https://www.gamepressure.com/originalsinii/environmental-effects-and-combinations/zea274

*How it feels.* Water becomes a tool. A frozen river that becomes a bridge for 30 s is a memorable fight [I].

*Risks.* Flood-fill electricity over a big lake is an MMO griefing tool. Cap it in tiles [I, note 08]. DOS2 durations and radii were not collected [I, note 08].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 4 · Mood 4 · Interactivity 5

### Family G: Cheap simulation

### G1. Heightfield ripples at lake scale

*In plain words.* The two-buffer ripple from study #3, run over a whole pond. Each cell becomes the average of its neighbours minus its old value, then shrinks a little. Rings spread, cross and bounce off the shore.

*How it works (technical).*
- **Elias** [V, S76, S77]. `new = (N + S + E + W) / 2 − old`, then damp. Ports use 0.99 and 0.9. Covered in #3 [S4].
- **Why it never explodes** [I, note 05]. The leapfrog wave equation is `h_new = 2h − h_old + r²(N + S + E + W − 4h)`. Put r² = 1/2 and it becomes Elias. The 2D five-point limit is r ≤ 1/√2, so Elias runs exactly at it and rings travel 0.707 cells per tick, whatever you do.
- **Tuning** [I, note 05]. At 30 ticks/s on a 1 px grid rings grow about 21 px/s. On an 80x45 grid (4 px cells) they grow about 85 px/s, too fast for a calm lake. Run at 10 to 15 Hz, or use Müller's form with r < 0.707. Integer damping `h −= h >> n` gives 0.969 at n = 5 and 0.9375 at n = 4.
- **Müller** [V, S71]. Height h and velocity v per column. `a = c²/s² × (sum of 4 neighbours − 4h)`, `v += dt × a`, `h += dt × v`. Stable if `dt × c < s`. Reflecting boundary copies the cell's own h. Objects add `α × (b − b_prev)` to h, which conserves volume.

*Cost / performance.* An 80x45 grid is 3,600 cells, about 7,200 reads per step [I, note 08]. On web, a CPU array uploaded to a small ImageTexture, or a SubViewport ping-pong, both without compute [I, note 05].

*Games that used it.*
- Matyka, 2D water algorithm: https://maciejmatyka.blogspot.com/2018/03/2d-water-algorithm.html

*How it feels.* Real interference on a pond is lovely, and nobody will see it on an open sea [I].

*Risks.* Constant cost per cell even when calm. A world-anchored buffer must scroll with the camera. Smooth gradients fight a small palette [I, note 08].

*Ratings 1–5 (author judgement):* Simplicity 3 · Speed 3 · Pixel taste 3 · Mood 4 · Interactivity 4

### G2. Wave particles

*In plain words.* Instead of a grid, every disturbance launches a ring of tiny moving bumps. Each bump travels outward and fades. When neighbours drift too far apart, a bump splits in three. Cost depends on how much is happening, not on how big the sea is.

*How it works (technical).*
- **Paper** [V, S81]. Yuksel, House and Keyser, SIGGRAPH 2007, "simple, fast, and unconditionally stable". The GPU turns particles into a heightfield; objects take forces from waves and make new waves by moving.
- **Numbers** [V, S81]. GeForce 7900 GTX with a 2.13 GHz Core 2 Duo. One boat at 170 fps, 1,681 boats at 4.8 fps, 9,261 boxes at about 1 fps, where rigid bodies are the bottleneck.
- **What a particle stores** [I, note 05]. Origin, position, direction, amplitude, dispersion angle, birth time. Splits into three at one third amplitude.
- **2D port** [I, note 05]. A CPU array of a few hundred, each drawn as a 1 to 3 px dot or arc with a palette index by amplitude. No heightfield. Clients spawn them from replicated movement.

*Cost / performance.* Zero when nobody moves. A 320x180 grid is 57,600 cells every tick, even when calm [I, note 05].

*Games that used it.*
- Wave Particles project page: https://cemyuksel.com/research/waveparticles/

*How it feels.* Like E1 rings with a real physical model under them. The Sandbox's wake pool is a simple form of it [I].

*Risks.* No shipped game is named on the project page [V, S81]. No mobile timing exists [I, note 05].

*Ratings 1–5 (author judgement):* Simplicity 3 · Speed 4 · Pixel taste 4 · Mood 4 · Interactivity 4

### G3. Virtual pipes

*In plain words.* Imagine small pipes between neighbouring cells. Water flows through each pipe according to the height difference, but never more than a cell holds. Basins fill, dams break, and water runs downhill.

*How it works (technical).*
- **Flux update** [V, S74]. Per Dagenais et al. 2018, `f = ζ × f + dt × A × g × (h_i − h_j) / l`, with l the cell size and A its square. Outflow is scaled so a cell never goes below its base (Mei et al.); inflow is scaled so it never overflows (Kellomäki).
- **Timings** [V, S74]. On a GTX 970 with CUDA, 200x200x1 grids take about 0.6 to 1.0 ms of simulation per frame; 200x200x5 about 5 ms.
- **Mei 2007** [V, S75]. Cells update in parallel each step, so it maps to multi-pass GPU. The step-by-step pseudocode in note 04 was written from memory and the paper text was blocked [U, S75].

*Cost / performance.* About 20 to 30 flops per cell per step. A 128x128 grid is roughly 0.5 M flops, estimated 0.1 to 0.5 ms in typed code [I, note 04].

*Games that used it.*
- Dagenais et al. 2018: https://diglib7.eg.org/bitstream/handle/10.2312/vriphys20181067/045-054.pdf

*How it feels.* Water that behaves. A moat that fills when a lever opens is a set piece [I].

*Risks.* Overkill for rivers that never change. In an MMO it must run on the server and stream results [I, note 04].

*Ratings 1–5 (author judgement):* Simplicity 2 · Speed 3 · Pixel taste 3 · Mood 3 · Interactivity 4

### G4. Frontier: wave packets, DrawableTexture2D, new shaders and AI tilesets

*In plain words.* What is new or academic, and what of it a small web team could use today. Most of it is ideas to borrow, not code to ship.

*How it works (technical).*
- **Wave packets** [V, S82]. Jeschke and Wojtan 2017. Each packet carries a group of wave trains, so it can refract and reflect. Real time "for moderately challenging scenarios". The viewer is Windows and DirectX.
- **Godot 4.7 `DrawableTexture2D`** [V, S136]. A Texture2D changed on the GPU by `blit_rect` and `blit_rect_multi` (up to 4 inputs and outputs) with a one-function blit shader. Several methods are experimental. A natural home for the G1 ping-pong. Web support is not stated [U].
- **Pixel Water (Cidade, Oct 2026)** [V, S137]. CC0, "Tested on Godot 4.6 (Compatibility renderer)", 24 uniforms including `foam_width`, `shallow_width`, `swell` and `sparkle_amount`, with Tropical, Lagoon, Swamp and Night presets. It draws its own islands, so it does not plug into a tilemap.
- **AI tilesets** [V, S145, S146]. PixelLab exports Wang, dual-grid 15-tile and 3x3 sets. Ludo.ai lists shallow water samples (vendor claims). No tool found makes animated water frames [I, note 05].
- **FFT and Gerstner** [V, S85, S86]. Sea of Thieves uses Tessendorf FFT. Gerstner waves give "sharper peaks and broader troughs". Neither shows in top-down pixel art; skip them.

*Cost / performance.* Unknown on web for the Godot items. Research methods are desktop GPU.

*Games that used it.*
- Pixel Water browser demo: https://fcidade.itch.io/pixel-water-godot-shader-free

*How it feels.* Promising on paper. The 2025 review praise for water went to a 3D game, Sword of the Sea, and leaned on motion and sound [V, S131; I, note 05].

*Risks.* Experimental APIs change. AI tiles need a palette remap before cycling works [I, note 05].

*Ratings 1–5 (author judgement):* Simplicity 2 · Speed 3 · Pixel taste 3 · Mood 4 · Interactivity 2

### Family H: Palette, light and accessibility

### H1. Day, dusk and night water ramps

*In plain words.* Keep one water ramp per time of day and swap it. At night the water goes dark and the glints gather in one column under the moon.

*How it works (technical).*
- **Palette swap** [I, note 01]. The same index texture and lookup as A1, with the palette row picked by hour. Study #1 and #5 already swap palettes for time of day [S2, S6].
- **Pixel Water** ships a Night preset and a `cloud_shadow` uniform [V, S137].
- **Moon column** [I]. Allow glints (D3) only within a few pixels of the moon's x, with a 2 to 3 px band of the lightest night colour that wobbles by 1 px.
- **Night ramp** [I, note 06]. Drop value two steps, shift hue toward blue-violet, keep foam one step above water so the coast still reads.

*Cost / performance.* One palette row change per hour step [I].

*Games that used it.*
- Pixel Water presets: https://store.godotengine.org/asset/fcidade/pixel-water-godot-shader/

*How it feels.* Night water with a moon path is the most atmospheric image in this study for the least work [I].

*Risks.* A night ramp that is too dark hides the shallow and deep line, which is a gameplay signal [I, note 06].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 5 · Mood 5 · Interactivity 1

### H2. Readability, reduced motion and sound

*In plain words.* A screen full of moving water is background movement. Let players slow or stop it. Make deep and shallow differ in value and texture, not only hue. Give each kind of water its own sound, louder when you stand near it.

*How it works (technical).*
- **XAG 117** [V, S138]. Players should be able to pause or stop content that scrolls, blinks or moves, or "entirely disable" it. Avoid repetitive up-and-down or side-to-side motion not core to play. Example, HyperDot's "Animate Background" toggle.
- **Highest risk** [I, note 06]. Whole-screen UV wobble, large uniform scroll, synced blinking of every tile. Lowest risk is small 2 to 4 frame loops in low contrast.
- **Sound** [V, S139, S140]. Packs split ocean into close, medium and far loops (vendor). CRIWARE uses three river tracks with min attenuation 3 and max 50 (vendor).
- **2D sound mix** [I, note 06]. Read the B3 field at the player. 0 to 2 tiles is the near loop, 2 to 8 mid, 8 and more far, linear crossfade. Duck lake and river layers near waterfalls.

*Cost / performance.* One option flag and one field lookup per frame [I].

*Games that used it.*
- Xbox Accessibility Guideline 117: https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/117

*How it feels.* Calmer and clearer for everyone. Chat over the sea needs an opaque panel behind it [V, S138; I, note 06].

*Risks.* No guideline gives a numeric threshold for 2D background motion [I, note 06].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 4 · Mood 4 · Interactivity 2

---

## 5. Comparison scorecard

All ratings are author judgement for top-down pixel art on web Godot. "Sum" is a crude total, not a recommendation. A low-sum technique such as F1 can still be mandatory for an MMO.

| # | Technique | Simpl. | Speed | Pixel taste | Mood | Interact. | Sum |
|---|---|---|---|---|---|---|---|
| A1 | Palette cycling water | 5 | 5 | 5 | 4 | 1 | 20 |
| A2 | Animated tiles, shared clock | 5 | 5 | 5 | 3 | 1 | 19 |
| A3 | Row-offset waves (HDMA, sine) | 4 | 5 | 3 | 3 | 1 | 16 |
| A4 | Tibia 500 ms phases, patterns | 5 | 5 | 4 | 3 | 1 | 18 |
| A5 | Stardew overlay shimmer | 5 | 5 | 4 | 4 | 1 | 19 |
| B1 | Dual grid coast autotiling | 4 | 5 | 5 | 4 | 2 | 20 |
| B2 | Overlay shores on animated base | 4 | 5 | 4 | 3 | 1 | 17 |
| B3 | Distance-to-shore field | 4 | 5 | 4 | 4 | 3 | 20 |
| B4 | Foam, lapping waves, wet sand | 4 | 5 | 4 | 5 | 2 | 20 |
| B5 | Tides against height | 3 | 4 | 4 | 4 | 4 | 19 |
| B6 | Coasts and rivers from heightmaps | 3 | 5 | 4 | 4 | 3 | 19 |
| C1 | Flow maps, two-phase | 3 | 4 | 3 | 4 | 2 | 16 |
| C2 | Per-tile flow and currents | 5 | 5 | 4 | 4 | 5 | 23 |
| C3 | Waterfalls and rapids | 4 | 5 | 5 | 5 | 3 | 22 |
| C4 | Flowing-water automata | 3 | 4 | 3 | 3 | 4 | 17 |
| D1 | Depth bands, ramps, biome tints | 5 | 5 | 5 | 4 | 2 | 21 |
| D2 | Scrolling-noise banded surface | 4 | 4 | 3 | 3 | 1 | 15 |
| D3 | Caustics and glints | 5 | 4 | 4 | 4 | 1 | 18 |
| D4 | Reflections in 3/4 view | 3 | 4 | 4 | 5 | 3 | 19 |
| E1 | Ring decal pool | 5 | 5 | 5 | 4 | 5 | 24 |
| E2 | Kelvin wakes | 4 | 5 | 4 | 5 | 5 | 23 |
| E3 | Wading and swimming | 4 | 5 | 4 | 5 | 5 | 23 |
| E4 | Splashes, sinking items | 5 | 5 | 5 | 4 | 4 | 23 |
| E5 | Floating, bobbing, boats | 4 | 5 | 4 | 4 | 4 | 21 |
| E6 | Fishing feel | 4 | 5 | 4 | 5 | 5 | 23 |
| F1 | Tile flags and a shared clock | 5 | 5 | 3 | 3 | 5 | 21 |
| F2 | Drowning and breath | 5 | 5 | 3 | 3 | 4 | 20 |
| F3 | Fishing chance, fished-out tiles | 5 | 5 | 3 | 3 | 4 | 20 |
| F4 | Element reactions | 4 | 5 | 4 | 4 | 5 | 22 |
| G1 | Heightfield ripples, lake scale | 3 | 3 | 3 | 4 | 4 | 17 |
| G2 | Wave particles | 3 | 4 | 4 | 4 | 4 | 19 |
| G3 | Virtual pipes | 2 | 3 | 3 | 3 | 4 | 15 |
| G4 | Frontier (packets, DrawableTexture2D) | 2 | 3 | 3 | 4 | 2 | 14 |
| H1 | Day, dusk, night ramps | 5 | 5 | 5 | 5 | 1 | 21 |
| H2 | Readability, reduced motion, sound | 4 | 5 | 4 | 4 | 2 | 19 |

**Reading the table.** Interaction wins. The ring pool (E1), wakes (E2), wading (E3), splashes (E4), fishing feel (E6) and per-tile currents (C2) score highest because they are cheap and make players feel the water answer them. Among the looks, palette cycling (A1), depth ramps (D1), glints (D3) and night ramps (H1) give the most for the least, and the dual grid (B1) plus the distance field (B3) are the base that most other rows read from. The simulations (G1, G3) and the frontier row (G4) score lowest on simplicity and web speed. Use G1 on one pond and skip the rest until a design needs moving water [I].

---

## 6. Deep dives

### 6a. Animation timing across games

Frame holds are cited; seconds and fps at about 60 Hz are our conversions [I, note 01].

| Game | Water | Frames | Hold per frame | Loop | Source |
|---|---|---|---|---|---|
| Pokémon Red (GB) | 1 tile, bits rotated | 8 steps | 20 to 21 video frames | 2.7 to 2.8 s | [V, S15] |
| Pokémon Crystal (GBC) | tile $14 | 4 | 22 video frames | 1.47 s | [V, S14] |
| Pokémon Crystal | water palette colour 0 | 4 (0, 1, 2, 1) | even ticks | ping-pong | [V, S13] |
| Pokémon Emerald (GBA) | sea, 30 tiles | 8 | 16 | 2.14 s | [V, S16] |
| Pokémon Emerald | sand-water edge | 8 slots, 7 unique | 16 | 2.14 s | [V, S16] |
| Pokémon Emerald | land-water edge, waterfall | 4 | 16 | 1.07 s | [V, S16] |
| Zelda ALttP (SNES) | overworld set | 3 | 9 | 0.45 s | [V, S17] |
| Link's Awakening DX | tide, village, water dungeon | 4 | 16 | 1.07 s | [V, S18] |
| Link's Awakening DX | currents, waterfall | 4 | 4 | 0.27 s | [V, S18] |
| Tibia (OTClient) | ground items | 16 (forum) | 500 ms | 8 s (inferred) | [V, S27; U, S30] |
| Stardew Valley | shimmer overlay | 10 | 200 ms | 2.0 s | [V, S110] |
| Asterion proposal | sea; river; waterfall | 4; 4; 4 | 250 ms; 120 ms; 70 ms | 1 s; 0.5 s; 0.28 s | [I] |

The pattern is clear. Calm water sits at 2.3 to 3.75 fps, fast water at 7 to 15 fps, and shore animation shares the water clock [I, note 01]. Ping-pong hides the wrap (Red, Crystal, LADX lava). Tibia is the outlier at an 8 s loop, which is why its sea reads so calm.

### 6b. Water tile classes for Asterion

The flags follow TFS [V, S22, S24, S25, S26]. Speeds use Tibia ground speed where cited [V, S37; U, S36]; the rest is proposal [I].

| Class | Server flags | Walk | Ground speed | Look | Interaction |
|---|---|---|---|---|---|
| Wet sand | none | yes | 160 (sand) | darker sand band, dries over ~1 s | footprints optional |
| Shallow | WATER_SHALLOW, FISHABLE, TRASHHOLDER, FLUID_SOURCE | yes | 200 | floor visible, teal tint, caustics | knee clip, ring per step |
| Swimmable | WATER_SWIM | yes, swim outfit | 200 or more | floor faint, mid blue | head only, ring trail, clears burning |
| Deep | WATER_DEEP, FISHABLE | no (boats) | n/a | floor hidden, indigo, slower loop | blocked step or boat wake |
| River | WATER_SHALLOW or DEEP plus flow byte | by depth | by depth | scroll along flow | forced step on current |
| Waterfall | WATER_DEEP plus flow south | no | n/a | strip, lip, splash, mist | pushes south |
| Swamp | WATER_SHALLOW, green bubble | yes | 200 | olive, 25% shimmer, no reflections | ring per step, bubbles |
| Underwater | WATER_UNDER | yes with helmet | ground | blue-green tint, 1 px row wobble | drowning −20 every 2 s |

### 6c. Performance budget for Godot web

We measured nothing for this study. Every figure is cited or an estimate [I]. The rule from #6 still applies; keep all water work under about 2 ms of a 16.7 ms frame on a weak laptop.

| Layer | Size or count | Cost | Source |
|---|---|---|---|
| Distance field (BFS or chamfer) | 256x256 tiles, 64 KB | O(N), once per map or tide step; est. under 10 ms native | [I, note 03] |
| Distance in shader instead | per pixel | about 36 texel fetches | [U, S50] |
| Depth ramp + foam shader | 320x180 = 57,600 px | 1 to 2 fetches per pixel | [I, note 03] |
| Flow map, two-phase | full-screen river | 3 fetches per pixel, ~173k per frame | [I, note 02] |
| Ring and wake pool | 64 slots | one sprite each | [I, note 08] |
| Pond heightfield | 80x45 = 3,600 cells | ~7,200 reads per step | [I, note 08] |
| Pipe sim | 200x200 on a GTX 970 | 0.6 to 1.0 ms (CUDA) | [V, S74] |
| Godot terrain connect | per call, large map | 4 to 5 ms reported | [V, S44] |

**What Godot imposes** [V, S95, S96]. `hint_screen_texture` costs a full back-buffer copy, and forum reports say it misbehaves on web and Compatibility. No compute shaders, so any simulation is a CPU array or a fragment ping-pong. Float render targets need `EXT_color_buffer_float` [I, note 04].

**Rule of thumb** [I]. Bake on load, look up per pixel, spawn sprites per event. Anything that touches every cell every frame needs a reason.

### 6d. Network and determinism

Byte sizes are illustrative [I].

| What | Sent | Size | Notes |
|---|---|---|---|
| Animation frames | nothing | 0 | from the shared clock (F1) [V, S27, S101] |
| Tide | level per step, or epoch and period at login | 1 byte per change | server applies walkability at step boundaries |
| Rings, splashes | one-shot events | a few bytes | as Stardew's `broadcastSprites` [V, S107] |
| Wakes, bobbing, glints | nothing | 0 | from replicated movement and hashes |
| Fishing | request and result | a few bytes | client plays the tease after the roll |
| Element fields | field item create and decay | as Tibia fields | flood fill capped in tiles |

**Rules that keep every client identical** [I].
1. One clock. Send server time at login and with regular packets.
2. Water truth is static map data plus one tide byte. Everything else is derived.
3. Cosmetics come from `hash(id or position, clock)`, never from a shared random stream.
4. The server owns anything that changes where you can stand, such as tide steps, currents, ice and drowning.

---

## 7. Combinations: a layered architecture for Asterion Online (Godot 4, web)

All of this section is design proposal [I], built from the cited parts. The Water Sandbox (§8) plays it.

**Layers, bottom to top.**
1. **Server water truth (gameplay).** Static per map. Tile flags walkable-shallow, blocking-deep and optional swim, a flow direction and speed for river tiles, and a fishable flag (F1). A global tide level 0 to 255 on a slow server clock moves the shoreline by comparing tile height with the level, so a few beach rows flip between wet and dry; only the tide value goes on the network (B5, F1). Currents push entities by the flow vector each tick (C2).
2. **Distance and depth fields.** On the client, once per tide change. Multi-source BFS from shore tiles gives a signed distance-to-shore for every tile, and the depth band is the distance clamped to 0 to 3 and mixed with height (B3).
3. **Base water colour by depth band.** A 4 to 5 colour ramp per body (sea, river, swamp) that shifts from teal in the shallows to navy in the deep, with a 4x4 Bayer dither at band borders and no alpha (D1).
4. **Surface animation.** Two styles. Palette cycling of 3 to 4 reserved highlight colours, or a 4-frame tile loop with a per-tile phase from a hash of the tile coordinate. Plus sparse hashed glints (A1, A2, D3).
5. **Flow.** River tiles scroll their highlight texture along the per-tile flow vector with two-phase blending, so the texture never stretches. The waterfall is a vertical scrolling strip with mist at the base (C1, C3).
6. **Shoreline foam and waves.** A foam band at distance 0 and 1, autotiled on cell corners with 16 marching-squares cases. A wave line runs up the beach every 4 to 6 s, breaks into foam, retreats and leaves wet sand that dries. The tide shifts all of it (B1, B4).
7. **Reflections and caustics.** Trees, the hut and characters near water draw a flipped, darkened copy with a per-row sine wobble, clipped to water. Shallow tiles get a cheap cell pattern of 1 px bright lines (D4, D3).
8. **Interaction.** Wading clips the sprite at the waterline with rings per step; deep water swims or blocks. Moving through water leaves a Kelvin V from a fixed wake pool. Stones splash, logs float and drift to the sea, the fishing bobber teases and bites, a boat leaves a bigger wake. Rings come from a fixed pool; an optional heightfield runs only on the pond (E1 to E6, G1).
9. **Palette and light pass.** Everything maps to one limited palette, and a day, dusk and night toggle swaps the water ramp, with a moon glint column at night (H1).

**Pseudocode.**

Server tick for tide and currents (B5, C2, F1, F1):
```
TICK_MS = 250
def tide_level(server_ms):                         # same on every machine
    phase = (server_ms % TIDE_PERIOD_MS) / TIDE_PERIOD_MS
    return 128 + int(40 * sin(2 * PI * phase))     # 88..168, step to 4 levels
def server_tick(t):
    lvl = quantise(tide_level(t), 4)
    if lvl != last_lvl:
        for c in beach_band:                       # precomputed, a few hundred cells
            c.flags = WATER_SHALLOW if c.height < lvl else SAND
            if c.flags & WATER_SHALLOW and c.occupant and not c.occupant.can_wade:
                push_to_nearest_land(c.occupant)
        broadcast(TIDE, lvl); last_lvl = lvl       # 1 byte
    for e in entities_on_flow_tiles:               # forced steps
        if t - e.last_push >= PUSH_MS[e.tile.flow_speed]:
            try_step(e, e.tile.flow_dir); e.last_push = t
```

Distance field once per tide step (B3):
```
dist[*] = INF; q = deque()
for c in cells: if is_water(c) and any(is_land(n) for n in nbr4(c)): dist[c] = 1; q.append(c)
for c in cells: if is_land(c) and any(is_water(n) for n in nbr4(c)): dist[c] = -1; q.append(c)
while q:
    c = q.popleft()
    for n in nbr8(c):                               # 8-way: rounder than 4-way
        if same_side(c, n) and abs(dist[n]) > abs(dist[c]) + 1:
            dist[n] = dist[c] + sign(dist[c]); q.append(n)
upload R8: 128 + clamp(dist, -8, 8) * 15           # 1 texel per tile, linear filter
```

Water fragment, depth band plus foam (B4, D1):
```
d    = (texture(dist_tex, world_uv).r * 255 - 128) / 15   # tiles from shore, + in water
band = clamp(floor(d), 0, 3)
col  = RAMP[body][band]
if bayer4(px) < fract(d) * 16 and band < 3: col = RAMP[body][band + 1]   # dithered border
ph   = d * 0.6 + TIME / WAVE_T                             # waves move shoreward
if d > 0 and d < 1.5 and fract(ph) < 0.12: col = FOAM
COLOR = palette_snap(col)
```

Wake and ring spawner (E1, E2):
```
TAN_K = 0.354                                    # tan(19.47 deg)
def on_move(e, dx, dy):
    e.travel += hypot(dx, dy)
    if e.tile.is_water and e.travel >= SPAWN_PX:  # 6..8 px; by distance, not time
        e.travel = 0
        back = -unit(dx, dy); side = perp(back)
        for k in (1, 2, 3):                        # three dots per arm, older further back
            p = e.pos + back * (4 * k)
            pool.spawn(p + side * (4 * k * TAN_K), life=1.0)
            pool.spawn(p - side * (4 * k * TAN_K), life=1.0)
pool: fixed 64 slots, spawn overwrites the oldest; draw as squashed 1 px ellipses
```

---

## 8. Reference implementation: the Water Sandbox

`vfx-water-sandbox.html` [S8] is one hand-written page of plain JavaScript on a **320×180** canvas, scaled with pixelated rendering. It plays the nine layers of §7. Its design choices are ours [I]. All numbers on the page and in this section are illustrative.

**The world.** A small top-down 3/4 coast. Open sea on one side with a deep band, a shallow band and a beach with wet sand. A river comes down from a cliff as a waterfall, runs through a meadow under a wooden bridge and past a ford, and enters the sea. A pond or swamp corner with lily pads, a few trees and a hut near the water for the reflections, and a pier.

**The grid.** 8x8 px cells, 40 x 23 cells (the last row is partial). Each cell has a terrain height (0 to 255), a water kind (none, shallow, deep, river, swamp, waterfall), a flow vector (8 directions and speed 0 to 3) and a signed distance-to-shore from BFS (positive in water, negative on land).

**What you can do.**
- **Tools** (click or tap). Walk (default), drop a stone, drop a log, cast a fishing line, place a boat. Keys 1 to 5 pick them. Arrows, WASD or tap-to-move drive the walker.
- **Toggles.** Surface style (palette cycle or animated tiles), tile phase sync (the anti-pattern demo), caustics, reflections, deep water blocks or swims, the pond heightfield comparison, day, dusk or night, and tide auto or a manual slider (T toggles auto).
- **Time.** Pause (Space) and Reset.

**The views** (V cycles them). Normal; depth bands; the distance-to-shore field; flow vectors; autotile cases.

**The HUD.** Tide level, ms per frame for the water pass, active ripple rings and wake particles, BFS recompute ms, and fish caught.

**What it demonstrates.**
- A tide clock with a period of about 2 real minutes flips a few beach rows between wet and dry, and the distance field and foam follow. Only the tide byte would go on a network.
- Water colour is a 4 to 5 colour ramp per body by depth band, Bayer-dithered at borders. The surface palette-cycles 3 to 4 highlight colours at about 8 Hz, or plays a 4-frame tile loop at about 4 fps with a hashed per-tile phase; the sync toggle shows the whole sea blinking at once. Hashed glints flash 1 to 2 px of white.
- Rivers scroll along their flow vectors with two-phase blending, and the waterfall strip has mist at its base. Foam is autotiled on cell corners with 16 cases, and a wave runs up the beach every 4 to 6 s and leaves wet sand that dries.
- Trees, the hut and the walker reflect with a per-row wobble, clipped to water. Caustics are 1 px lines on shallow tiles.
- In shallow water the walker is clipped at the waterline, moves at ×0.6 and leaves a ring per step. Deep water swims (head only) or blocks, as in Tibia. Movement leaves a V-wake at about 19.5° per arm.
- A stone splashes for 4 to 6 frames with rings. A log bobs 1 px at about 0.5 Hz and rides the river to the sea. The bobber dips with a ring on a random bite, and a click in time catches the fish. The boat leaves a larger wake.
- Rings come from a fixed pool of 64 squashed pixel ellipses. The optional Hugo Elias heightfield runs only on the pond, for comparison with study #3.
- One limited palette throughout. Day, dusk and night swap the water ramp, and night adds a moon glint column.

**Thumbnail.** A demo button (`data-demo="showcase"`) sets a day frame with the walker wading near shore with a wake, a log on the river and waves on the beach.

**Simplifications (honest list)** [I].
- It is Canvas 2D in one browser tab. Nothing in it is a Godot measurement or a real network.
- "Server" and "client" run in the same page. The tide byte is counted, not sent.
- The wading speed of ×0.6 is illustrative. Tibia's cited ground speeds give about ×0.75 (150 against 200) [V, S37; U, S36].
- The 2-minute tide is far faster than the 20 to 40 minutes we propose for the MMO, so you can watch a full cycle.

---

## 9. Gem findings

Licences were read from LICENSE files on 2026-11-10 via the GitHub API, or from the page where noted [V, note 07]. Star counts are from the same API call. **Flags:** **Low** = MIT/BSD/Apache/CC0; **LGPL** = fine as a separate library; **Copyleft** = GPL/AGPL/CC BY-SA, study and re-implement; **None** = no licence, study only.

| Name | URL | Licence | Maturity | Good for | Flag |
|---|---|---|---|---|---|
| TileMapDual | https://github.com/pablogila/TileMapDual | MIT | 1,310 stars, 12 contributors, plugin v5.0.3, commit 2026-09-03 | Real-time dual-grid shore tiles, 15 instead of 47 | Low |
| Dual grid (jess::codes) | https://github.com/jess-hammer/dual-grid-tilemap-system-godot | MIT | 628 stars, C#, commit 2026-02-09 | Small reference dual grid, 16 rules | Low |
| Dual grid GDScript port | https://github.com/GlitchedinOrbit/dual-grid-tilemap-system-godot-gdscript | MIT | 223 stars, push 2024-10-12 | Web-exportable version of the above | Low |
| autotiler | https://github.com/itsjavi/autotiler | MIT | 85 stars, v2.0.1 2026-09-26, tested against Godot 4.7 | 13-tile template to blob 47 or dual-grid 16, Godot `.tres` export | Low |
| Wang Tile Set Creator | https://github.com/kleingeist37/godot-wang-converter | MIT | 96 stars, push 2025-05-11 | 4 base tiles to a dual-grid set | Low |
| Tiled | https://github.com/mapeditor/tiled | GPL editor, BSD-2 libtiled | 13,041 stars, v1.12.2 2026-05-27 | Corner, edge and mixed Wang sets; maps are yours | Copyleft (editor only) |
| 2D pixel water shader (jess-hammer) | https://github.com/jess-hammer/2d-pixel-water-shader-godot | MIT | 128 stars, commit 2025-04-21, Godot 4.4 | Pixelised noise water and a water-trail shader | Low |
| Sprite Water Reflection Pixel Art | https://godotshaders.com/shader/sprite-water-reflection-pixel-art/ ; https://github.com/christt105/GodotPixelReflectionShader | CC0 (page); MIT (repo) | 9 stars, Godot 4.2.1 | Pokémon Gen 3 style flipped reflection | Low |
| Pond Water Shader (2d Top Down) | https://godotshaders.com/shader/pond-water-shader-2d-top-down/ | CC0 (page) | 2025-08-03 | Noise quantised to N colour bands, pixel-snapped UV | Low |
| Pixel Water (Cidade) | https://store.godotengine.org/asset/fcidade/pixel-water-godot-shader/ | CC0 (store page) | v1.0.0 2026-10-07, tested on 4.6 Compatibility | Foam, shallow band, shoreward waves, presets | Low |
| 2D water for topdown games | https://godotshaders.com/shader/2d-water-for-topdown-games/ | CC0 on page, borrows from two Shadertoys of unstated licence | 2025-07-09, 7 comments | Hashed ripples; heavy (55 loop iterations per pixel) | Low (provenance unclear) |
| Water Caustic (Godot port) | https://godotshaders.com/shader/water-caustic/ | none stated; Shadertoy default CC BY-NC-SA 3.0 | 2022-12-18 | Iterated trig caustic, study only | Copyleft (non-commercial) |
| godot-flow-map-shader | https://github.com/JaccomoLorenz/godot-flow-map-shader | MIT | 94 stars, commit 2020-05-23 (Godot 3) | Valve two-phase flow shader to port | Low |
| Pixelorama | https://github.com/Orama-Interactive/Pixelorama | MIT | 11,051 stars, v1.2.4 2026-11-03 | Free Godot-built editor to animate water tiles | Low |

**Top five for Kingsfoil** [I, note 07]. Use TileMapDual (or the GDScript dual grid) for coasts and generate the 16 tiles with autotiler or the Wang converter. Start the surface from the Pond Water band idea and read Cidade's Pixel Water for its shore look, both CC0. Port the MIT flow-map shader and feed it per-tile directions, not painted maps. Use the CC0 reflection shader for sprites. Write your own caustic texture instead of using any Shadertoy port.

---

## 10. Learnings and anti-patterns

**Learnings** [I unless cited]
1. **One byte per tile, one palette, one clock.** Depth or distance per tile, a 4 to 5 colour ramp, and a global time. Tibia, Factorio and Pokémon all work this way [V, S27, S101, S16].
2. **Truth on the server, looks on the client.** The server holds flags, flow and one tide byte. Clients derive everything else [I, note 08].
3. **The distance field is the hub.** Foam, depth, wave phase, caustics, fishing zones and sound all read it [I, notes 02, 03, 06].
4. **Fast water moves faster.** Currents and waterfalls run about 4x the calm rate [V, S18].
5. **Interaction beats rendering.** Rings under feet, a splash on entry and a bite sound are what players remember [I, notes 05, 06].

**Anti-patterns**
- The whole sea blinking on the same frame with no art to hide it [I, note 06].
- Random per-tile phase on shore tiles, which tears foam at the seams [I, note 03].
- Saturated blue with bright cyan highlights [V, S104].
- A 16-tile edge set on a coast, which cannot draw inner corners [V, S40].
- Calling Godot's terrain matcher at runtime for tides or edits [V, S44].
- `hint_screen_texture` reflections on a web build [V, S96].
- A waterfall splash out of sync with its flow [V, S69].
- Water that looks shallow and blocks, or looks deep and lets you walk [I, note 06].
- Whole-screen underwater wobble with no way to turn it off [V, S138].

---

## 11. "See it in action" index

| # | Game | Water idea | URL |
|---|---|---|---|
| 1 | Tibia | Water flags, fishing, swimming, drowning (TFS data) | https://github.com/otland/forgottenserver/blob/master/data/items/items.xml |
| 2 | Tibia | Calassa underwater, Helmet of the Deep | https://tibia.fandom.com/wiki/Calassa |
| 3 | Pokémon Red | Bit-rotated water tile | https://github.com/pret/pokered/blob/master/home/vcopy.asm |
| 4 | Pokémon Crystal | Water palette ping-pong | https://github.com/pret/pokecrystal/blob/master/engine/tilesets/tileset_anims.asm |
| 5 | Pokémon Emerald | Staggered sea, shore and waterfall animations | https://github.com/pret/pokeemerald/blob/master/src/tileset_anims.c |
| 6 | Pokémon Emerald | Strong westward currents on Route 134 | https://bulbapedia.bulbagarden.net/wiki/Route_134 |
| 7 | Zelda: A Link to the Past | 3-frame water, whirlpool warps | https://zeldawiki.wiki/wiki/Whirlpool_Waterway |
| 8 | Zelda: Link's Awakening DX | Tide, current and waterfall groups | https://github.com/zladx/LADX-Disassembly/blob/main/src/code/home/animated_tiles.asm |
| 9 | Zelda: Minish Cap | Swimming, diving, shallow-water weapons | https://zeldawiki.wiki/wiki/Swimming |
| 10 | Ultima VI | Transparent shore pieces over animated water | https://github.com/nuvie/nuvie/blob/master/TileManager.cpp |
| 11 | Ultima Online | Ships steered by tillerman commands | https://uo.com/wiki/ultima-online-wiki/gameplay/ships-guide/ |
| 12 | Old School RuneScape | Sailing, rafts to sloops, deep sea trawling | https://oldschool.runescape.wiki/w/Sailing |
| 13 | Stardew Valley | Overlay shimmer, seasonal tint (decompiled) | https://github.com/E-riCA0/StawdewValley |
| 14 | Stardew Valley | Fishing bite times and zones | https://stardewvalleywiki.com/Fishing |
| 15 | Stardew Valley | Dynamic Reflections mod | https://www.nexusmods.com/stardewvalley/mods/12831 |
| 16 | Factorio | Noise water, foam and reflection render target | https://cf-www.factorio.com/blog/post/fff-323 |
| 17 | Terraria | 12 biome water colours, waterfalls | https://terraria.wiki.gg/wiki/Water |
| 18 | Minecraft | Level-based flow, currents, water and lava | https://minecraft.wiki/w/Water |
| 19 | Dwarf Fortress | Depth 0 to 7, pressure, drowning | https://dwarffortresswiki.org/index.php/v0.34:Water |
| 20 | Noita | Pixel liquids in dirty chunks | https://80.lv/articles/noita-a-game-based-on-falling-sand-simulation/ |
| 21 | RimWorld | Shallow, chest-deep and deep water costs | https://rimworldwiki.com/wiki/Terrain |
| 22 | Portal 2 / Left 4 Dead 2 | Flow maps, 17% fewer wrong turns | https://www.advances.realtimerendering.com/s2010/Vlachos-Waterflow(SIGGRAPH%202010%20Advanced%20RealTime%20Rendering%20Course).pdf |
| 23 | Croakwood | Signed-distance shoreline, frog ripples | https://www.texelraptor.com/blog/croakwood-devlog-5 |
| 24 | Kingdom Two Crowns | Full-width mirrored reflection | https://godotshaders.com/shader/2d-water-with-reflections/ |
| 25 | Sea of Stars | Lit water, reflections, auto-swimming | https://techraptor.net/gaming/news/sea-of-stars-gameplay-clip-shows-swimming-in-action |
| 26 | CrossCode | Curved waterfalls into pools | https://www.radicalfishgames.com/?p=7386 |
| 27 | Wargroove | Sea, deep sea, beach, reef and river rules | https://wargroovewiki.com/Terrain_(Codex) |
| 28 | Divinity: Original Sin 2 | Water, ice, steam and shock combinations | https://www.gamepressure.com/originalsinii/environmental-effects-and-combinations/zea274 |
| 29 | Animal Crossing: New Horizons | Nibbles then the "kerplunk" bite | https://play.nintendo.com/news-tips/tips-tricks/fishing-new-horizons-tips-and-tricks/ |
| 30 | Octopath Traveler | HD-2D water under pixel sprites | https://www.siliconera.com/project-octopath-traveler-developers-answer-project-started-troubles-developing-hd-2d/ |
| 31 | Sword of the Sea | Water feel from motion and sound (3D) | https://www.pcgamer.com/games/adventure/sword-of-the-sea-review |
| 32 | Canvas Cycle (Mark Ferrari) | Palette-cycled seas, streams and waterfalls | http://www.effectgames.com/demos/canvascycle/ |

---

## 12. What remains unverified (and corrections)

**Conflicts between notes, and how we resolved them**
1. **Tibia drowning, 2 s against 4 s.** TFS applies −20 every 2,000 ms while on the tile [V, S26]. A TibiaQA user reports 5 × 20 starting after about 4 s [U, S33]. We use TFS and label it emulator code, not CipSoft's.
2. **Tibia water loop length.** OTClient uses 500 ms per phase [V, S27]. Forum users say 7.4 water is "16 steps of 8 sprites" [U, S30]. The 8 s loop is our inference from the two; modern .dat files store per-phase durations we did not read [V, S28].
3. **Mei et al. pipe pseudocode.** Note 04 wrote the step from memory because the paper was blocked. Only the flux line and the outflow scaling match Dagenais et al. [V, S74]. Everything else in that sketch is [U, S75].
4. **TileMapDual stars, 1,310 against about 303.** Note 07 read 1,310 from the GitHub API on 2026-11-10. A third-party tracker shows about 303, probably stale [I, note 10]. We use the API figure.
5. **Tibia fishing slope, 0.597 against 0.6.** TFS uses 0.597 [V, S23]; Gorak's fan fit uses 0.6 [V, S34]. Both cap at 50%. Use TFS.
6. **Kelvin wake at speed.** Rabaud and Moisy say the angle narrows as 1/Fr above Fr ≈ 0.5 [V, S79]; Darmon et al. say only the amplitude peak narrows [V, S80]. For pixel art the bright arms narrow in both readings. Scaling 1/Fr gives about 5° for a 15 m/s speedboat, but that is our extrapolation [I, note 05].
7. **Two Stardew decompiles.** Rings, fishing and splashes come from a 1.5-era fork [V, S107, S108, S109]; the water overlay comes from a decompile of unknown version [V, S110]. Stardew 1.6 may differ.

**Still unverified [U]**
- TibiaWiki returned HTTP 402 and archive.org was blocked. Tiles, Calassa, fishing and swimming pages were read only as search snippets [U, S35, S36].
- Shallow water ground speed 200 in Tibia is from a snippet [U, S36].
- Dwarf Fortress numbers are from search snippets; the wiki returned HTTP 429 [U, S57].
- Pokémon Surf speed by generation is a snippet [U, S115].
- Animal Crossing's "5th approach always bites" is from fan guides, not Nintendo [U, S118].
- `DrawableTexture2D` and the Godot 4.5 stencil buffer on a web Compatibility export are untested [U, S133, S136].
- The original author and in-code licence of Shadertoy MdlXz8 are unknown (403) [U, S147].
- Kingdom's second distortion pass is a third-party description [U, S98]; the developer thread was blocked [U, S99].
- Every cost in §6c marked [I] is an estimate. We ran no benchmarks for this study.

---

## 13. Prototype roadmap for Godot (web)

1. **Map data and flags.** One height byte, one terrain bit and one flow byte per tile, saved at world creation. Server flags `WATER_SHALLOW`, `WATER_SWIM`, `WATER_DEEP`, `WATER_UNDER`, `FISHABLE`, `TRASHHOLDER`. Unit-test walk validation against them.
2. **Coast.** TileMapDual or the GDScript dual grid with 16 drawn shore tiles per pair. Rebuild from your own index cache, never with terrain connect at runtime.
3. **Distance field.** 8-way BFS or chamfer at load and per tide step. Upload as R8, 1 texel per tile, linear filter. Show it as a debug view.
4. **Water shader.** Depth ramp of 4 to 5 colours per body, Bayer border dither, foam band and shoreward waves from the field, glints by hash. Pixel-snap everything. Check it on a phone browser before adding anything else.
5. **Surface motion.** Palette cycling first; animated atlas tiles at 250 ms per frame as the alternative. Patch-level phase offsets for open sea, synced shore.
6. **Rivers.** Per-tile direction into a flow texture; two-phase scroll; waterfall strip with mist. Server forced steps on current tiles.
7. **Interaction.** Ring and wake pool of 64, wading clip line, swim outfit, splashes, floating logs that drift, and fishing as server roll plus client tease.
8. **Tide and polish.** Tide clock with 4 steps, reflections into a SubViewport, caustics, a night ramp, a reduced-motion option and the sound mix. Try `DrawableTexture2D` for the pond ripple on a web export.

---

## 14. Sources

Numbered for [S#] references. All URLs come from notes 01 to 10, the shared context or the Sandbox spec. "Blocked", "snippet" or "not fetched" means our researchers did not read the page directly.

**Series**
1. DOOM PSX fire (series reference), Fabien Sanglard, 2018: https://fabiensanglard.net/doom_fire_psx/
2. VFX #1 Snow: https://kingsfoil-artifacts.netlify.app/vfx-snow-topdown-pixel
3. VFX #2 Acid: https://kingsfoil-artifacts.netlify.app/vfx-acid-topdown-pixel
4. VFX #3 Rain (puddles, two-buffer ripples, ring decals, puddle reflections): https://kingsfoil-artifacts.netlify.app/vfx-rain-topdown-pixel
5. VFX #4 Forest: https://kingsfoil-artifacts.netlify.app/vfx-forest-topdown-pixel
6. VFX #5 Light: https://kingsfoil-artifacts.netlify.app/vfx-light-topdown-pixel
7. VFX #6 Fire (steam, lava): https://kingsfoil-artifacts.netlify.app/vfx-fire-topdown-pixel
8. Water Sandbox: `vfx-water-sandbox.html` (companion page)

**Palette cycling, animated tiles and old hardware**
9. Effect Games, Old School Color Cycling with HTML5 (2011): http://www.effectgames.com/effect/article-Old_School_Color_Cycling_with_HTML5.html
10. Q&A with Mark J. Ferrari: http://www.effectgames.com/effect/article-Q_A_with_Mark_J_Ferrari.html
11. Mark Ferrari, 8 Bit and "8 Bitish" Graphics, GDC 2016: https://gdcvault.com/play/1023586/8-Bit-8-Bitish-Graphics
12. Amiga ILBM CRNG chunk (Devices manual): https://discmaster.textfiles.com/file/18/Amiga%20Developer%20CD%20v2.1.iso/Reference/HTML/Devices_Manual_guide/node01B9.html?html=true
13. pokecrystal, engine/tilesets/tileset_anims.asm: https://github.com/pret/pokecrystal/blob/master/engine/tilesets/tileset_anims.asm
14. pokecrystal, data/tileset_anims.asm: https://github.com/pret/pokecrystal/blob/master/data/tileset_anims.asm
15. pokered, home/vcopy.asm: https://github.com/pret/pokered/blob/master/home/vcopy.asm
16. pokeemerald, src/tileset_anims.c: https://github.com/pret/pokeemerald/blob/master/src/tileset_anims.c
17. zelda3 reimplementation, misc.c and nmi.c: https://github.com/snesrev/zelda3/blob/master/src/misc.c ; https://github.com/snesrev/zelda3/blob/master/src/nmi.c
18. Link's Awakening DX disassembly, animated tiles: https://github.com/zladx/LADX-Disassembly/blob/main/src/code/home/animated_tiles.asm ; https://github.com/zladx/LADX-Disassembly/blob/main/src/constants/animated_tiles.asm
19. Nuvie (Ultima VI engine), TileManager.cpp: https://github.com/nuvie/nuvie/blob/master/TileManager.cpp
20. SNESdev wiki, HDMA examples: https://snes.nesdev.org/wiki/HDMA_examples
21. SNES Lab, HDMA: https://sneslab.net/wiki/HDMA

**Tibia, TFS and OTClient**
22. The Forgotten Server, items.xml: https://github.com/otland/forgottenserver/blob/master/data/items/items.xml
23. TFS, fishing.lua: https://github.com/otland/forgottenserver/blob/master/data/actions/scripts/tools/fishing.lua
24. TFS, movements.xml: https://github.com/otland/forgottenserver/blob/master/data/movements/movements.xml
25. TFS, swimming.lua: https://github.com/otland/forgottenserver/blob/master/data/movements/scripts/swimming.lua
26. TFS, drowning.lua: https://github.com/otland/forgottenserver/blob/master/data/movements/scripts/drowning.lua
27. OTClient, const.h and item.cpp: https://github.com/edubart/otclient/blob/master/src/client/const.h ; https://github.com/edubart/otclient/blob/master/src/client/item.cpp
28. OTClient, animator.cpp: https://github.com/edubart/otclient/blob/master/src/client/animator.cpp
29. otland, slow animation of tiles (forum): https://otland.net/threads/slow-animation-of-tiles.251542/ ; https://otland.net/goto/post?id=2429814
30. otland, sprite changes between 7.4 and 7.72 (forum): https://otland.net/threads/list-of-sprite-changes-between-7-4-and-7-72-7-6.285203/
31. otland, water border corners (forum): https://otland.net/threads/233554/
32. otland, RME borders and brushes (forum): https://otland.net/threads/adding-new-brush-in-rme-2-1.127897/ ; https://otland.net/threads/requests-thread-rme-extensions.61602/latest ; https://otland.net/f50/hills-extension-dirt-mountains-created-mackan-12455/
33. TibiaQA, underwater without Helmet of the Deep (community): https://www.tibiaqa.com/10030/what-happen-if-i-go-underwater-without-helmet-of-the-deep
34. TibiaQA, how the fishing skill works (fan research): https://www.tibiaqa.com/34346/how-does-the-fishing-skill-work
35. TibiaWiki, Calassa (blocked, snippet): https://tibia.fandom.com/wiki/Calassa
36. TibiaWiki, Tiles (blocked, snippet): https://tibia.fandom.com/wiki/Tiles
37. Tibiantis notes, speed; TibiaQA 1043: https://tibiantis-notes.github.io/speed ; https://www.tibiaqa.com/1043
38. TibiaQA, boat NPC destinations: https://www.tibiaqa.com/12291/what-boat-npc-takes-you-to-the-most-cities ; https://www.tibiaqa.com/12294/what-boat-npc-takes-you-to-the-least-amount-of-cities

**Shorelines, autotiling and distance fields**
39. Boris the Brave mirror of cr31, blob tileset: https://www.boristhebrave.com/permanent/24/06/cr31/stagecast/wang/blob.html
40. SpriteCook, dual-grid tilesets explained: https://www.spritecook.ai/blog/dual-grid-tilesets-explained
41. Sylves docs, marching squares: https://boristhebrave.com/docs/sylves/1/articles/tutorials/marching_squares.html
42. jess::codes, dual grid tilemap for Godot: https://github.com/jess-hammer/dual-grid-tilemap-system-godot
43. TileWorldCreator docs, dual and standard grid: https://giantgrey.gitbook.io/tileworldcreator-v4-documentation/dual-and-standard-grid
44. Godot forum, runtime autotiling cost: https://forum.godotengine.org/t/autotiling-extremely-slow-at-runtime-alternatives/66619 ; https://forum.godotengine.org/t/large-2d-tilemap-causes-4-5ms-lag-on-setcell-invocation/126593
45. Kyle Dunbar, auto tiling with just 5 tiles (Feb 2026): https://www.kyledunbar.dev/2026/02/05/Implementing-auto-tiling-with-just-5-tiles.html
46. Texel Raptor, Croakwood devlog 5 (Nov 2024): https://www.texelraptor.com/blog/croakwood-devlog-5
47. Demofox, jump flooding algorithm: https://blog.demofox.org/2016/02/29/fast-voronoi-diagrams-and-distance-dield-textures-on-the-gpu-with-the-jump-flooding-algorithm/
48. Jump flooding, Wikipedia and Observable: https://en.wikipedia.org/wiki/Jump_flooding_algorithm ; https://observablehq.com/@rreusser/gpu-voronoi-diagrams-using-the-jump-flooding-algorithm
49. Chamfer distance, Klette slides and Cuisenaire thesis: https://www.cs.auckland.ac.nz/~rklette/Books/MK2004/pdf-LectureNotes/08slides.pdf ; https://infoscience.epfl.ch/record/86619/files/Cuisenaire1999_268.pdf
50. Godot forums, tile distance shore stripes (partial load, snippet): https://godotforums.org/d/33008/25
51. Red Blob Games, terrain from noise: https://www.redblobgames.com/maps/terrain-from-noise/
52. Falloff maps, Sebastian Lague and Roblox forum: https://rosetta.to/u/sebastianlague/procedural-landmass-generation-e11-falloff-map ; https://devforum.roblox.com/t/help-with-procedural-generation-falloff-filter/1607541
53. Tide mechanics, Tide or Hide listing and TV Tropes: https://gg.deals/game/tide-or-hide/ ; https://tvtropes.org/pmwiki/pmwiki.php/Main/TideLevel

**Rivers, flow and currents**
54. Alex Vlachos, Water Flow in Portal 2, SIGGRAPH 2010: https://www.advances.realtimerendering.com/s2010/Vlachos-Waterflow(SIGGRAPH%202010%20Advanced%20RealTime%20Rendering%20Course).pdf
55. Catlike Coding, texture distortion and directional flow: https://catlikecoding.com/unity/tutorials/flow/texture-distortion/ ; https://catlikecoding.com/unity/tutorials/flow/directional-flow/
56. Minecraft Wiki, Water: https://minecraft.wiki/w/Water
57. Dwarf Fortress Wiki, water, pressure and flow (HTTP 429, snippets): https://dwarffortresswiki.org/index.php/v0.34:Water ; https://dwarffortresswiki.org/index.php/Pressure ; https://dwarffortresswiki.org/index.php/40d:Flow
58. Terraria Wiki, Liquids: https://terraria.wiki.gg/wiki/Liquids
59. Noita, 80.lv article and GDC 2019 talk: https://80.lv/articles/noita-a-game-based-on-falling-sand-simulation/ ; https://gdcvault.com/play/1025695/Exploring-the-Tech-and-Design
60. w-shadow, simple fluid simulation (2009, 404): https://w-shadow.com/blog/2009/09/01/simple-fluid-simulation
61. pokeemerald, field_player_avatar.c: https://github.com/pret/pokeemerald/blob/master/src/field_player_avatar.c
62. pokeemerald, event_object_movement.c: https://github.com/pret/pokeemerald/blob/master/src/event_object_movement.c
63. Bulbapedia, Routes 133 and 134: https://bulbapedia.bulbagarden.net/wiki/Route_134 ; https://bulbapedia.bulbagarden.net/wiki/Route_133
64. Zelda Wiki, Current, Whirlpool Waterway, Rapids: https://zeldawiki.wiki/wiki/Current ; https://zeldawiki.wiki/wiki/Whirlpool_Waterway ; https://zeldawiki.wiki/wiki/Rapids
65. Amit Patel, polygon map generation (2010): https://simblob.blogspot.com/2010/09/polygon-map-generation-part-2.html ; https://www.redblobgames.com/maps/polygon-map-generation/
66. Red Blob Games, procedural river growing: https://www.redblobgames.com/x/1723-procedural-river-growing/
67. mewo2, fantasy map terrain (404, snippet): https://mewo2.com/notes/terrain
68. Azgaar's Fantasy Map Generator: https://github.com/Azgaar/Fantasy-Map-Generator ; https://deepwiki.com/Azgaar/Fantasy-Map-Generator/2.3-rivers-and-water-features
69. Slynyrd, Pixelblog 10, water in motion (2018): https://www.slynyrd.com/blog/2018/10/12/pixelblog-10-water-in-motion
70. Slynyrd, Pixelblog 43, top-down tiles part 2 (2023): https://slynyrd.com/blog/2023/3/26/pixelblog-43-top-down-tiles-part-2

**Simulation, physics and papers**
71. Matthias Müller, height-field water (Ten Minute Physics): https://matthias-research.github.io/pages/tenMinutePhysics/20-heightFieldWater.pdf
72. Müller, Real Time Fluids in Games (2008 slides): https://cs277.stanford.edu/resources/papers/Muller2008.pdf
73. 1D height-field WebGL demo and GDC 2008 slide link: https://felixriehm.github.io/1d-height-field-fluid-webgl/index.html ; https://blitz-community.github.io/blitzbasic-backup/forums/bmx-programming/79415.html
74. Dagenais et al., virtual pipes (VRIPHYS 2018): https://diglib7.eg.org/bitstream/handle/10.2312/vriphys20181067/045-054.pdf
75. Mei, Decaudin, Hu, Fast Hydraulic Erosion on GPU (2007; HAL blocked): https://hgpu.org/?p=2256 ; https://inria.hal.science/inria-00402079
76. Hugo Elias water (archived, blocked) and Matyka's write-up: https://web.archive.org/web/20160418004149/http://freespace.virgin.net/hugo.elias/graphics/x_water.htm ; https://maciejmatyka.blogspot.com/2018/03/2d-water-algorithm.html
77. Elias ports with damping 0.99 and 0.9: https://editor.p5js.org/tetsuakibaba/sketches/StXi7E6tY ; https://codepen.io/ds604/pen/VxroVN
78. Kelvin wake pattern, Wikipedia: https://en.wikipedia.org/wiki/Kelvin_wake_pattern
79. Rabaud and Moisy, ship wakes (PRL 2013): https://arxiv.org/abs/1304.2653 ; https://data-ww3.ifremer.fr/BIB/Rabaud_Moisy_PRL2013.pdf ; https://www.nature.com/articles/nphys2687
80. Darmon, Benzaquen and Raphaël (JFM 2014), and Physics World: https://gulliver.spip.espci.fr/sites/gulliver.spip.espci.fr/IMG/pdf/darmonbenzaquen2013.pdf ; https://physicsworld.com/a/physicists-rethink-celebrated-kelvin-wake-pattern-for-ships/
81. Yuksel, House, Keyser, Wave Particles (SIGGRAPH 2007): https://cemyuksel.com/research/waveparticles/ ; https://history.siggraph.org/?p=115408 ; https://history.siggraph.org/?p=142256
82. Jeschke and Wojtan, Water Wave Packets (SIGGRAPH 2017): https://visualcomputing.ist.ac.at/publications/2017/WWP ; https://research-explorer.ista.ac.at/record/470 ; https://ista.ac.at/en/news/making-waves/ ; https://awesome.ecosyste.ms/projects/github.com%2Fjeschke%2Fwater-wave-packets
83. Jeschke et al., Making Procedural Water Waves Boundary-aware (SCA 2020): https://diglib.eg.org/handle/10.1111/cgf14100 ; https://visualcomputing.ist.ac.at/publications/2020/MPWWBa
84. Skrivan et al., Wave Curves (2020): https://research-explorer.ista.ac.at/record/8535
85. The Technical Art of Sea of Thieves (SIGGRAPH 2018): https://history.siggraph.org/wp-content/uploads/2022/09/2018-Talks-Ang_The-Technical-Art-of-Sea-of-Thieves.pdf
86. GPU Gems ch. 1, Effective Water Simulation: https://developer.nvidia.com/gpugems/gpugems/part-i-natural-effects/chapter-1-effective-water-simulation-physical-models

**Shaders, reflections and surfaces**
87. godotshaders, Pixel Water for Godot 4.3: https://godotshaders.com/shader/pixel-water/
88. godotshaders, Pixel Art Water: https://godotshaders.com/shader/pixel-art-water/
89. godotshaders, 2D water for topdown games (Sir-Shroom, Jul 2025): https://godotshaders.com/?p=11955 ; https://godotshaders.com/shader/2d-water-for-topdown-games/
90. godotshaders, 2D Reflective Water, and forum thread: https://godotshaders.com/shader/2d-reflective-water/ ; https://forum.godotengine.org/t/2d-shader-reflective-water/53384
91. godotshaders, Pond Water Shader (2d Top Down), Aug 2025: https://godotshaders.com/shader/pond-water-shader-2d-top-down/
92. godotshaders, Water Caustic (port of Shadertoy MdlXz8): https://godotshaders.com/shader/water-caustic/
93. godotshaders, iterated caustic and primitive caustics: https://godotshaders.com/?p=4502 ; https://godotshaders.com/shader/water-with-primitive-caustics/
94. Making of Moana, the Shadertoy: https://wallisc.github.io/rendering/2020/12/08/Making-Of-Moana-the-shadertoy.html
95. Godot docs, screen-reading shaders: https://docs.godotengine.org/en/stable/tutorials/shaders/screen-reading_shaders.html
96. Godot forum, screen texture on web and Compatibility: https://forum.godotengine.org/t/screen-texture-does-not-work-work-when-deploying-for-web/45261 ; https://forum.godotengine.org/t/screen-texture-behaves-strangely-with-gl-compatibility-renderer-but-works-fine-with-forward/93296 ; https://forum.godotengine.org/t/godot-4-web-export-issues/49346
97. Flowa devlog, 2D reflections: https://jacobknispel.itch.io/flowa/devlog/261753/2d-reflections-quick-dirty
98. Defold forum and Steam, Kingdom-style reflections: https://forum.defold.com/t/water-reflections/75802 ; https://steamcommunity.com/app/701160/discussions/0/592887534192767509
99. TIGSource, Kingdom devlog topic 40539 (403): https://forums.tigsource.com/index.php?topic=40539.0
100. Sprite Water Reflection Pixel Art (shader page CC0, repo MIT): https://godotshaders.com/shader/sprite-water-reflection-pixel-art/ ; https://github.com/christt105/GodotPixelReflectionShader
101. Factorio Friday Facts 323, water: https://cf-www.factorio.com/blog/post/fff-323

**Pixel art craft, colour and readability**
102. Slynyrd, Pixelblog 1, colour palettes: https://www.slynyrd.com/blog/2018/1/10/pixelblog-1-color-palettes
103. Slynyrd, Pixelmotion 7 (Patreon summary): https://www.patreon.com/posts/pixelmotion-7-20004255
104. itch.io 2D Art board, water depth tile transitions: https://itch.io/post/14590926/view-in-topic
105. OpenGameArt, water depth note: https://opengameart.org/node/98201
106. Lospec, flowing river loop and water palettes: https://lospec.com/gallery/pixelprinciples/flowing-river ; https://lospec.com/palette-list/tag/water

**Stardew Valley, Pokémon, Zelda and cozy fishing**
107. Stardew Valley decompiled, Farmer.cs (1.5 era): https://github.com/veywrn/StardewValley/blob/master/StardewValley/Farmer.cs
108. Stardew decompiled, FishingRod.cs: https://github.com/veywrn/StardewValley/blob/master/StardewValley/Tools/FishingRod.cs
109. Stardew decompiled, GameLocation.cs (veywrn): https://github.com/veywrn/StardewValley/blob/master/StardewValley/GameLocation.cs
110. Stardew decompiled, GameLocation.cs water overlay (E-riCA0): https://github.com/E-riCA0/StawdewValley
111. Stardew Valley Wiki, Fishing, Fishing Zone, Bathhouse: https://stardewvalleywiki.com/Fishing ; https://stardewvalleywiki.com/Fishing_Zone ; https://stardewvalleywiki.com/Bathhouse
112. Stardew forums, bubble spot check: https://forums.stardewvalley.net/threads/difference-in-fishing-bubble-region-check-between-catch-rate-and-depth.47463/latest
113. Dynamic Reflections mod: https://www.nexusmods.com/stardewvalley/mods/12831 ; https://www.curseforge.com/stardewvalley/mods/dynamic-reflections
114. Stardew swim mod: https://pcgamer.com/you-can-now-swim-in-ponds-rivers-and-oceans-with-this-stardew-valley-mod ; https://www.curseforge.com/stardewvalley/mods/swim
115. Bulbapedia, water tile, Puddle, Surf: https://m.bulbapedia.bulbagarden.net/wiki/Water_tile ; https://bulbapedia.bulbagarden.net/wiki/Puddle ; https://bulbapedia.bulbagarden.net/wiki/Surf_(move)
116. Zelda Wiki, Swimming and Water (terrain): https://zeldawiki.wiki/wiki/Swimming ; https://zeldawiki.wiki/wiki/Water_(Terrain)
117. Nintendo, Animal Crossing: New Horizons fishing tips: https://play.nintendo.com/news-tips/tips-tricks/fishing-new-horizons-tips-and-tricks/
118. Animal Crossing fan guides: https://nintendowire.com/guides/animal-crossing-new-horizons/fishing/ ; https://game8.co/games/Animal-Crossing-New-Horizons/archives/284505 ; https://www.belltreeforums.com/threads/help.228834/
119. Spry Fox, Cozy Grove fishing support: https://support.spryfox.com/hc/en-us/articles/4409051363735-Fishing-difficulties-Cozy-Grove
120. Practice Flip, exploring fish catching mechanics: https://practiceflip.substack.com/p/exploring-fish-catching-mechanics

**Other games and their water rules**
121. Terraria Wiki, Water: https://terraria.wiki.gg/wiki/Water
122. Terraria Wiki, Breath meter and Breathing Reed: https://terraria.wiki.gg/wiki/Breath_meter ; https://terraria.wiki.gg/Breathing_Reed
123. OSRS Wiki, Sailing; Gamer Guides: https://oldschool.runescape.wiki/w/Sailing ; https://gamer-guides.com/osrs/beginners-guide-to-sailing/
124. Ultima Online ships guide: https://uo.com/wiki/ultima-online-wiki/gameplay/ships-guide/
125. Godot forum, top-down water with seafloor depth and boats that run aground: https://forum.godotengine.org/t/top-down-water-2d-for-godot-seafloor-depth-you-can-see-and-boats-that-run-aground/144236
126. Divinity: Original Sin 2 surfaces and clouds: https://www.gamepressure.com/originalsinii/environmental-effects-and-combinations/zea274 ; https://www.gamepressure.com/originalsinii/clouds-and-combinations/zfa275 ; https://www.gamepressure.com/originalsinii/the-basic-effects-in-the-game/zda273 ; https://dos2.wiki/wiki/Stunned_(Status) ; https://steamcommunity.com/app/435150/discussions/0/1630790506929643660
127. Wargroove terrain codex and PC Gamer: https://wargroovewiki.com/Terrain_(Codex) ; https://www.pcgamer.com/wargroove-units-critical-hits-stats-maps
128. Sea of Stars coverage: https://www.rpgfan.com/review/sea-of-stars/ ; https://astrolabe.aidanmoher.com/astrolabe-feature-sea-of-stars-is/ ; https://mobilesyrup.com/2023/09/11/sea-of-stars-level-design-sabotage-studio-thierry-boulanger-interview/ ; https://techraptor.net/gaming/news/sea-of-stars-gameplay-clip-shows-swimming-in-action
129. CrossCode devblog, waterfalls: https://www.radicalfishgames.com/?p=7386
130. Octopath Traveler HD-2D: https://www.siliconera.com/project-octopath-traveler-developers-answer-project-started-troubles-developing-hd-2d/ ; https://www.unrealengine.com/en-US/spotlights/octopath-traveler-s-hd-2d-art-style-and-story-make-for-a-jrpg-dream-come-true
131. Sword of the Sea reviews (Aug 2025): https://www.pcgamer.com/games/adventure/sword-of-the-sea-review ; https://www.gamesradar.com/games/action/sword-of-the-sea-review ; https://opencritic.com/game/19001/sword-of-the-sea
132. Godot forum, wake persistence with a render target: https://forum.godotengine.org/t/rendering-gpuparticles2d-onto-a-3d-plane/81460

**Godot and the web**
133. Godot 4.5 release notes and coverage: https://godotengine.org/releases/4.5/ ; https://itsfoss.com/news/godot-4-5-release/ ; https://digitalproduction.com/2025/09/17/godot-4-5-new-buffers-better-access-more-control/
134. Godot 4.6 release notes and snapshots: https://godotengine.org/releases/4.6/ ; https://godotengine.org/article/dev-snapshot-godot-4-6-dev-2/ ; https://godotengine.org/article/dev-snapshot-godot-4-6-beta-2/ ; https://digitalproduction.com/2025/12/04/godot-4-6-dev5-lands-d3d12-default-delta-patching-android-gradle-2d-boosts ; https://godotengine.org/article/maintenance-release-godot-4-6-3/
135. Godot 4.7 release notes and coverage: https://godotengine.org/releases/4.7/ ; https://digitalproduction.com/2026/06/23/godot-4-7-turns-up-hdr/
136. Godot 4.7 docs, DrawableTexture2D and blit shaders: https://docs.godotengine.org/en/4.7/classes/class_drawabletexture2d.html ; https://docs.godotengine.org/en/4.7/tutorials/rendering/drawable_textures.html ; https://docs.godotengine.org/en/4.7/tutorials/shaders/shader_reference/texture_blit_shader.html
137. Francisco Cidade, Pixel Water Godot shader (Oct 2026): https://store.godotengine.org/asset/fcidade/pixel-water-godot-shader/ ; https://fcidade.itch.io/pixel-water-godot-shader-free ; https://fcidade.itch.io/pixel-water-godot-shader-free/devlog/1689529/pixel-water-a-free-water-shader-for-godot

**Accessibility and sound**
138. Xbox Accessibility Guideline 117: https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/117
139. Unity Asset Store, ocean and river loops (vendor): https://assetstore.unity.com/packages/slug/283118
140. CRIWARE, river implementation (vendor): https://blog.criware.com/index.php/2023/05/18/river-implementation/

**Gems: code, tools and assets**
141. TileMapDual: https://github.com/pablogila/TileMapDual
142. Oskar Stålberg, dual grid post (2021, not readable): https://x.com/OskSta/status/1448248658865049605
143. itsjavi/autotiler: https://github.com/itsjavi/autotiler
144. evanw/webgl-water: https://github.com/evanw/webgl-water
145. PixelLab Create Tileset (vendor) and pricing listing: https://www.pixellab.ai/docs/tools/create-tileset ; https://www.pixellab.ai/docs/tools/create-tileset-new ; https://ai.g2.com/marketplace/tools/pixellab
146. Ludo.ai tileset generator (vendor): https://ludo.ai/tools/tileset-generator
147. Shadertoy MdlXz8 (403, not read): https://www.shadertoy.com/view/MdlXz8
