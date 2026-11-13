# Top-down pixel snow at 32 px: scaling the snow engine to 32x32 tiles and 24x32 characters

**Kingsfoil Studios · Research study · November 2026**

---

## Context

This is study #11 in our VFX series. Each study picks one concept and hunts for old-school algorithms that are tiny and cheap. The series reference is the **DOOM PSX fire** [S1]. One byte per pixel, one rule, one palette.

**VFX #1 Snow** [S2] built that idea for snow. It stores one byte of depth per pixel and draws snow where depth passes a dither threshold. Its sandbox runs at 320x180 with 8 px tiles and 7x12 px characters, a quarter of Asterion Online's scale. Asterion has 32x32 px tiles and characters of about 24x32 px.

This study does not research snow again. It asks one question. **What changes when the snow engine moves to 32 px tiles, 24x32 characters and a 640x360 canvas, with 4 times the pixels?** Where VFX #1 already answers something, we point to it.

**Two equal goals.**
- **Artistic quality at 32 px.** A 1 px flake or a Bayer dusting that reads well on an 8 px tile can look thin next to hand-drawn 32 px tiles.
- **Runtime efficiency at 4 times the pixels.** We benchmarked every layer at 640x360 ourselves, on the CPU and in a WebGL2 shader (§6a).

**Targets.** Godot 4, web-first, so the **Compatibility renderer** (WebGL 2, no compute shaders). Top-down 3/4 pixel art on 32x32 tiles for the Tibia-like MMORPG **Asterion Online**. The server is authoritative, characters walk tile to tile, and many players share one weather.

**Sources.** Eight research notes (10 to 17), the lead's verification note, our **Snow 32 Sandbox** [S3], our benchmark [S4] and a small edge test [S5]. The benchmark ran on an Apple M4 Pro in Chromium 153. Measured pairs are written "desktop / 6x throttle". The second number is the DevTools 6x CPU throttle, a low-end phone proxy. **No phone was measured, and nothing was run in Godot.**

---

## 1. Executive summary

**Runtime efficiency.**

1. **A straight 1:1 port costs 4.0 to 4.3 times the old frame.** VFX #1 at 320x180 takes 0.58 to 0.59 ms. The same engine on a 640x360 field takes 2.4 to 2.5 / 14.5 to 15.6 ms, 87 to 93% of a 16.7 ms frame on the proxy [V, S4].
2. **Keep the field at 320x180.** A depth cell per 2x2 art pixels, sampled bilinearly, costs 1.36 to 1.44 / 8.45 to 10.1 ms per frame with a CPU render [V, S4]. The saving is in the tick, the bake and the upload bytes. In the Sandbox's own CPU loop a 1:1 field with nearest sampling costs 2.13 ms against 2.01 ms, because bilinear sampling eats most of the gain [V, S3].
3. **Draw the ground in one shader.** The full ground pass with 11 texture reads costs 0.012 ms at 640x360 on the M4 Pro GPU. The whole frame drops to 0.08 to 0.10 / 0.47 to 0.56 ms, 3% of the budget [V, S4].
4. **The ground render is 68 to 71% of every CPU frame.** The field ratio changes the sim cost and the look, not the render cost [V, S4].
5. **Godot uploads whole textures.** The Compatibility renderer re-specifies the full image on every update [V, S126]. A 640x360 RGBA8 field is 921,600 bytes per upload and a 160x90 R8 field 14,400 [I, note 12]. No measured `ImageTexture.update()` time exists anywhere we looked [V, note 17].
6. **Bake exposure with a row sweep.** The ray-per-cell bake costs 15.9 / 99.7 ms at 1:1. A sweep along each row gives the identical map in 0.49 / 3.25 ms [V, S4].
7. **Characters, prints and flakes are small.** Twenty 24x32 sprites cost 0.022 / 0.123 ms and a boot print 0.2 µs. Without a GPU the trap is small quads. Software GL spends about 13 µs per flake quad, so 580 of them cost about 8 ms [V, S4].

**Artistic quality.**

8. **No tile game we could source uses per-pixel dynamic ground snow.** Shipped games store one value per tile or one per map. The VFX #1 field is unusual at this size (§6c).
9. **Bayer dusting fails at 32 px.** A 4x4 Bayer threshold at level 1/16 puts 64 isolated pixels on one tile [I, note 11]. Artists name stray pixels and low-density dither as mistakes [V, S97, S99].
10. **A painted threshold map fixes it.** A hand-made map of the order in which snow covers the ground keeps every state in clusters of at least 2x2 px [I, note 11].
11. **Bilinear sampling hides the grid.** A 1:4 field sampled bilinearly measured the same edge statistics as a 1:1 field. Nearest sampling put 100% of the boundary on cell rows [V, S5].
12. **Flake size follows the tile.** RPG Maker VX Ace, RPG Maker MV and Stardew Valley all draw big flakes at 0.1875 of a tile [V, S27, S18, S30]. Peak coverage sits near 1% of screen pixels [I, note 14].
13. **Boot prints replace 2x2 dots.** Two prints per tile, stamped on the walk cycle's contact frames. Note 13 recommends 3x5 px, and the Sandbox draws 4x6 px because 3x5 did not read at 1x [I, note 13; V, S3]. Factorio is the one shipped precedent for prints per foot on animation frames [V, S68].
14. **Sink 6 px, not 8.** Legs on a 32 px chibi sprite are 6 to 10 px [I, note 11].
15. **No artist lesson on snow was found.** Every px value for edges, roof lips, prints and flakes is our inference from general craft rules [I].

**Pretty and cheap.** The art threshold tile (B2), edge shading (B5), boot prints (D1), one walk cycle per tile (D5), flakes in three sizes (E3) and the row sweep (F3).

**Pretty but expensive.** The 1:1 field (A2). A second hand-drawn tileset for the mask blend (B3). Flakes as quads on a machine with no GPU (F5).

**Cheap but ugly.** Bayer dusting on 32 px tiles (B1), nearest sampling of a coarse field (A3), 2x2 dot prints (D1) and 1 px flakes alone (E1).

**Recommendation for Asterion** [I]. The server sends weather scalars and one snow band per tile. The client keeps depth, packed and wet bytes at 320x180. One CanvasItem shader samples them with a linear filter, compares depth with a painted threshold map and writes palette colours. Boots stamp into the field from tile progress, with no extra network data. Flakes follow the tile count and cover just under 1% of the screen (§7, §8).

---

## 2. How to read this study

| Tag | Meaning |
|---|---|
| **[V]** | Verified in a source our researchers read: code, docs, data file or article, or our own measurement [S4, S5]. "[V, vendor]" and "[V, self-reported]" mark figures reported by their own authors or sellers. |
| **[I]** | Author inference, arithmetic or design proposal. Untested unless it says "Sandbox", and then tested only in our JavaScript prototype. |
| **[U]** | Unverified: memory, a search snippet, a forum claim, or a page that could not be fetched. Treat it as a lead. |
| **[K]** | Textbook or canonical knowledge (maths, well-known defaults). |

- [S#] refers to §14. "[I, note 1X]" is an inference made by the researcher in that note.
- Ratings (1–5) are author judgement: **Simplicity · Speed · Pixel taste · Mood · Interactivity**.
- **Pixel taste** asks whether the result looks drawn by an artist at 32 px. **Interactivity** asks whether characters can change the snow.
- **Speed follows the measurements** [S4]. 5 means under about 0.1 ms on the desktop at 640x360, or one GPU pass. 4 means a cost that grows with field cells or needs a cap. 3 and below mean milliseconds on the throttled run.
- **Measured pairs are "desktop / 6x throttle"**, in ms. They come from the benchmark's "GPU run, median" and "6x throttle, median" columns. Every table header names its column.
- All measurements are browser JavaScript and WebGL2 on one machine, not Godot. A tile is 32 px and the view is 640x360 unless a line says otherwise.

---

## 3. Generations: a timeline

**Gen 1: one mark per tile (1997–2008)**
- **1997** Tibia launches [V, S2]. Its client draws 32 px tiles [V, S6], and open servers swap a snow tile to a footprint twin for 10 s [V, S10, S9].
- **2004** Pokémon Emerald puts one 16x16 print on the tile a character just left, for about 57 frames [V, S2, S33].
- **2006–08** Pokémon Diamond, Pearl and Platinum add deep snow [V, S2]. Platinum's code has three tiers that sink the sprite 12, 14 and 16 units [V, S40].

**Gen 2: the tile grows and the flake follows (2013–2016)**
- **Jul 2013** Mishkinis publishes height-based texture blending, where the upper layer fills cracks first [V, S112]. RimWorld (2013 onward) keeps one snow depth per cell [V, S2, S48].
- **2015** RPG Maker MV's core script carries a 2015 copyright [V, S24]. Against VX Ace the tile grows from 32 px to 48 px, the flake from 6 px to 9 px, and the count stays at 90 [V, S18, S27].
- **2016** Stardew Valley swaps tilesheets by season [V, S2]. Its 1.5 code tiles one animated 16x16 snow cell over the screen [V, S29]. **Dec 2016** Peters releases free blue-noise textures under CC0 [V, S118].

**Gen 3: artists and tool authors write the rules (2017–2024)**
- **Nov 2017** Lucas Pope pins Obra Dinn's dither to the scene so it stops swimming [V, S117].
- **Aug 2019** Slynyrd calls tiles above 32x32 px "overkill for pixel art" [V, S92].
- **Jan 2021** Pixel Parmesan and Surma publish their dithering guides [V, S99, S119]. **Nov 2021** Boris the Brave counts 16 corner tiles and 47 blob tiles [V, S113].
- **Nov 2022** Godot merges GLES3 particles, with 2D SDF collision code, for 4.0 [V, S138]. **Mar 2023** Slynyrd lists snow as a future tile lesson [V, S93].
- **2024** TileMapDual and jess-hammer's dual-grid system, both with 2024 copyrights, bring 15-tile terrains to Godot [V, S116, S115].

**Gen 4: Godot 4.7 and measured costs (2025–2026)**
- **Mar 2025** Slynyrd's top-down animation template uses a 26x32 px sprite [V, S95]. **Aug 2025** Godot proposal #13012 asks for partial texture updates [V, S128].
- **Jan 2026** `DrawableTexture2D` is merged for Godot 4.7 [V, S131]. **Jun 2026** Godot 4.7 is released on 18 June. **Aug 2026** Godot 4.7.2 is the current stable [V, S120].
- **Sep 2026** Slynyrd's catalogue reaches post 64 with no snow lesson [V, S96].
- **Nov 2026** Godot 4.8 reaches beta 3 [V, S121]. **Nov 2026** Our snow benchmark and the Snow 32 Sandbox [V, S4, S3].

---

## 4. Technique profiles

There are six families:

- **A.** Resolution and fields
- **B.** The coverage look at 32 px
- **C.** Objects
- **D.** Characters at 24x32
- **E.** Falling snow at 32 px
- **F.** Cost and Godot

Each profile is a technique or a decision at 32 px, not a repeat of VFX #1. Each ends with ratings for **Simplicity · Speed · Pixel taste · Mood · Interactivity** (1 = poor, 5 = excellent; author judgement). Measured figures come from our benchmark [S4] unless another source is named, and pairs read "desktop / 6x throttle".

### Family A: Resolution and fields

### A1. Base resolution: 640x360 and whole-number scaling

*In plain words.* Pick the internal picture size before anything else. 640x360 shows 20 x 11.25 tiles of 32 px and multiplies by a whole number onto every common screen.

*How it works (technical).*
- **Scale factors** [V, S125, S122]. 640x360 fills 1280x720 at 2x, 1920x1080 at 3x, 2560x1440 at 4x and 3840x2160 at 6x. 480x270 fails at 720p (2.67x) and at 1440p (5.33x).
- **Tiles and characters** [I, note 11]. 320x180 shows only 10 x 5.63 tiles of 32 px. A 24x32 character is 8.9% of the screen height at 640x360 and 17.8% at 320x180.

*Cost / performance.* Render work follows art pixels, 230,400 against 57,600. The full ground shader costs 0.012 ms at 640x360 and 0.086 ms at 1920x1080 on the M4 Pro GPU, and 0.69 ms and 6.1 ms on software GL [V, S4].

*Games that used it.*
- Stardew Valley (20 x 11.25 tiles at default zoom): https://stardewvalleywiki.com/Winter
- Chained Echoes (640x360 per a PCGamingWiki mirror, search summary): https://gamecytus.netlify.app/host-https-www.pcgamingwiki.com/wiki/Chained_Echoes
- Owlboy (640x360 with a 39 px hero, per a Steam forum post): https://steamcommunity.com/app/431730/discussions/0/3200369647710806615

*How it feels.* At 3x on a 1080p screen one art pixel is a 3x3 square, so every stray pixel shows [I, note 11].

*Risks.* Whole-number scaling on the web with a fractional `devicePixelRatio` is untested [U, note 12].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 5 · Mood 3 · Interactivity 1

### A2. The field at 1:1: the naive port

*In plain words.* Keep one depth byte per art pixel, as VFX #1 did, and let every count grow by four.

*How it works (technical).*
- **Cells and picks** [I, note 12]. 230,400 cells against 57,600. VFX #1 ran 9,400 random picks per frame, 163 per 1,000 cells. The same rate per cell needs 37,600 picks.
- **Transport** [I, note 15; V, S3]. A relax or creep pick moves snow by one cell, and a 1:1 cell is half as long. Equal drift speed needs 8 times the creep picks of a 1:2 field. The Sandbox scales creep picks by 2 over the field ratio for that reason.

*Cost / performance.* The naive port costs 2.4 to 2.5 / 14.5 to 15.6 ms per frame. A snowing tick costs 0.281 / 1.73 ms against 0.067 / 0.42 ms at 1:2, and the ray-per-cell exposure bake 15.9 / 99.7 ms [V, S4]. The Sandbox's 1:1 mode uses the new renderer with nearest sampling and takes 2.13 ms in its own loop, against 2.01 ms at 1:2 [V, S3].

*Games that used it.*
- Noita (snow as a per-pixel falling-sand material): https://noita.wiki.gg/wiki/Snow
- VFX #1 Snow (the same field at 8 px tiles): https://kingsfoil-artifacts.netlify.app/vfx-snow-topdown-pixel

*How it feels.* Exact. In the Sandbox a boot print keeps its heel gap at 1:1 [V, S3].

*Risks.* No tile game we sourced does this, and an MMO cannot sync it [I, note 16]. Its maps total 3.0 MB, which may not fit a phone's cache [V, S4; I, note 15].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 2 · Pixel taste 4 · Mood 4 · Interactivity 5

### A3. A coarse field, bilinear sampling and a threshold

*In plain words.* Store depth every 2 or 4 art pixels. For each art pixel, blend the four nearest cells, then compare with a threshold painted at art resolution. The threshold supplies the pixel detail.

*How it works (technical).*
- **Edge test** [V, S5]. On a smooth test field, a 1:1 field gave straight boundary runs with a mean of 2.03 px and 23% of the boundary on 4 px rows. A 1:4 field with nearest sampling gave a mean of 7.68 px and 100%. The same 1:4 field with bilinear sampling gave 2.04 px and 23%.
- **Threshold swing** [I, note 12]. After bilinear upsampling from 1:4 the same per-cell difference spreads over 4 px. Scale the swing down by the ratio or the edge turns to fog.

*Cost / performance.* On the CPU at 640x360, nearest sampling costs 0.289 / 1.73 ms and bilinear with per-pixel weight tables 0.867 / 5.30 ms. At 1:2 the weights are fixed at 9/16, 3/16, 3/16 and 1/16, and the upsample alone drops from 0.594 to 0.135 ms. On a GPU the linear filter is one fetch, and 1:1, 1:2 and 1:4 measured the same [V, S4].

*Games that used it.*
- raylib fog-of-war example (1 texel per 32 px tile, bilinear upscale): https://github.com/raysan5/raylib/blob/master/examples/textures/textures_fog_of_war.c
- 0 A.D. (one fog pixel per tile with a box blur, search summary): https://wildfiregames.com/forum/topic/14325-fog-rendering

*How it feels.* The same snow edge as the 1:1 field, from a quarter or a sixteenth of the bytes.

*Risks.* The metric counts axis-aligned runs on a smooth field only [I, note 12]. Bilinear sampling blends depth across object edges, roof against ground. The Sandbox stops that with a class-aware weight table on the 3% of ground pixels that border another class [V, S3]. No shipped 2D game was found that draws ground cover this way.

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 4 · Pixel taste 5 · Mood 4 · Interactivity 4

### A4. The split field: depth coarse, trail fine

*In plain words.* Snow depth changes slowly and smoothly, like fog of war. Trails are sharp and made by actors. Give them different grids.

*How it works (technical).*
- **Two ratios** [I, note 12]. Depth, wet and the baked maps at 1:4, 14,400 cells. The packed trail field at 1:2, 57,600 cells.
- **What note 12 inferred** [I, note 12]. At 1:4 a print is smaller than one cell, and bilinear sampling would join left and right into one trench 8 to 12 px wide.
- **What the Sandbox showed** [V, S3]. At 1:2 a 4x6 px print is 2x3 whole cells, with 2 px of snow between the rows. At 1:4 the rows do not join. One keeps blunt marks and the other shrinks to slivers, because stamps are area-weighted.

*Cost / performance.* The bench did not measure the split. In the Sandbox's own loop its sim costs 0.04 ms against 0.11 ms at 1:2, and its ground sampling 1.07 ms against 0.70 ms. The frame comes to 2.27 against 2.01 ms [V, S3].

*Games that used it.*
- No shipped game was found with this split. The nearest idea is Slime Rancher 2's player-following interaction buffer, covered in VFX #1: https://kingsfoil-artifacts.netlify.app/vfx-snow-topdown-pixel
- raylib fog-of-war example (the coarse half): https://github.com/raysan5/raylib/blob/master/examples/textures/textures_fog_of_war.c

*How it feels.* Crisp prints on soft drifts. On the CPU it saves nothing, so I would reach for it only if the 1:2 upload shows up in a Godot profile.

*Risks.* Two grids mean two stamp paths and two uploads.

*Ratings 1–5 (author judgement):* Simplicity 3 · Speed 4 · Pixel taste 5 · Mood 4 · Interactivity 5

### A5. Per-tile snow levels with autotiles: 47-blob and dual grid

*In plain words.* Store one snow level per tile and pick hand-drawn edge tiles from the neighbours. Every pixel is artist-made, and the edge moves half a tile at a time.

*How it works (technical).*
- **Tile counts** [V, S113, S115, S116]. Corner Wang sets need 16 tiles. Blob sets use 47 of 256 combinations. A dual grid needs 15 or 16, or 6 with symmetry, because the display grid sits half a cell off the world grid.
- **Bands** [I, note 12]. A snow band of 0 to 3 per tile needs 15 tiles per band, 45 in all. Coverage moves in 16 px jumps, so it should follow the slow per-tile band, never the per-frame field.

*Cost / performance.* Four lookups per display tile, on change only. A data texture at 1 texel per tile is 240 bytes per view [I, note 12]. Not measured.

*Games that used it.*
- RPG Maker MV (A2 autotiles from 6 source tiles): https://github.com/rpgtkoolmv/corescript/blob/master/js/rpg_core/Tilemap.js
- Dwarf Fortress (one byte of snow per 32 px tile): https://dwarffortresswiki.org/index.php/Weather
- TileMapDual for Godot: https://github.com/pablogila/TileMapDual

*How it feels.* Clean and drawn. Snow arrives in steps, not as weather.

*Risks.* Boris the Brave lists ambiguous tiles as a dual-grid drawback [U, S114]. TileMapDual has no release builds, so pin it to tag v5.0.3 [V, S116].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 4 · Mood 2 · Interactivity 2

### A6. One global snow level against a noise grid

*In plain words.* Every tile owns a fixed random number. A tile turns white when the one synced snow level passes that number. The server sends a single value.

*How it works (technical).*
- **Project Zomboid 41.78** [V, S60, S61]. `snowStrength` runs 0 to 10 and the fraction is `strength / 7.5`, capped at 1. A square has snow when its fixed 3-layer noise value is at or below the fraction, on a 256x256 grid that wraps. Only the threshold moves.
- **Don't Starve Together** [V, S62, S63]. `_snowlevel` is one networked float that fills in 300 s at rate 1. One overlay texture lerps over the whole map, and every object tagged `SnowCovered` shows a drawn snow layer at level 0.015.

*Cost / performance.* One compare per tile and zero per-tile network state [I, note 16].

*Games that used it.*
- Project Zomboid: https://pzwiki.net/wiki/Weather
- Don't Starve Together: https://dontstarve.wiki.gg/wiki/Winter

*How it feels.* Patchy cover that grows, the same for every player. This is VFX #1's threshold at tile size [I, note 16].

*Risks.* The fixed noise knows nothing of eaves or wind. Zomboid build 42 moved snow to a file we did not read [U, note 16].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 3 · Mood 3 · Interactivity 1

### A7. RimWorld: per-cell depth with a smooth draw

*In plain words.* RimWorld keeps one snow number per map cell and no per-pixel field. The smooth edge comes from the renderer, which blends each cell with its neighbours.

*How it works (technical).*
- **Storage and tick** [V, S48, S51]. One float 0 to 1 per cell. Each tick visits `ceil(area * 0.0006)` cells. A visited unroofed cell gains `0.046 * SnowRate * noise`.
- **Draw** [V, S49]. 9 vertices per cell. The centre takes the cell's depth, each edge midpoint averages 2 cells and each corner averages 4. Depth goes into the vertex alpha of one snow material.

*Cost / performance.* RimWorld visits 0.06% of cells per tick. VFX #1's snowfall pass alone touches 1.56% per frame, 26 times more, and its whole tick 16.3% [I, note 16].

*Games that used it.*
- RimWorld: https://rimworldwiki.com/wiki/Snow

*How it feels.* Soft blobs about a cell wide [I, note 12]. It is the closest shipped model to a coarse field with a smooth draw.

*Risks.* We did not read RimWorld's snow shader, so how alpha becomes the visible edge is unknown [U, note 16]. The wiki swaps the hard and gentle snow rates. The XML says hard 1.2, gentle 0.8 [V, S57].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 3 · Mood 4 · Interactivity 3

### Family B: The coverage look at 32 px

### B1. Bayer 4 and 8 at 32 px, and the cluster rule

*In plain words.* An ordered dither that read as texture on 8 px tiles reads as a screen door over 32 px tiles.

*How it works (technical).*
- **Density** [I, notes 11, 12]. A 4x4 Bayer matrix repeats 8 times across a 32 px tile. At level 1/16 it puts 64 isolated pixels on one tile, and at 4/16 it puts 256.
- **Rules it breaks** [V, S97, S98, S99]. cure says pixels outside a cluster "expose the underlying grid" and calls a 25% dither especially noisy. Derek Yu says to draw nothing one pixel thick. Pixel Parmesan says dithering "was largely not intended as a textural tool".
- **Straight runs** [V, S5]. The longest straight boundary run was 41 to 43 px with Bayer 4x4 at every field ratio, and 13 px with a cluster tile. These are longest runs. The edge test in A3 quotes mean runs.

*Cost / performance.* The cheapest ground pass, 0.291 / 1.85 ms flat on the CPU at 640x360 [V, S4].

*Games that used it.*
- Return of the Obra Dinn (8x8 Bayer and a 128x128 blue-noise field): https://dukope.com/devlogs/obra-dinn/tig-32/
- VFX #1 Snow (Bayer plus noise on 8 px tiles): https://kingsfoil-artifacts.netlify.app/vfx-snow-topdown-pixel

*How it feels.* TV static over the art. A Pixel Joint critic put it bluntly: "Environment is very much destroyed by dithering." [V, S101]

*Risks.* Do not throw dither away. It still works in a band 2 to 3 px wide at the edge of a solid patch, between two close ramp colours [I, note 11].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 2 · Mood 2 · Interactivity 1

### B2. The art threshold tile and the frost tint

*In plain words.* An artist paints a 32x32 map of the order in which snow covers a tile. Hollows fill first and tuft tips drown last. The thinnest cover is a frost-tinted ground colour, not a speckle.

*How it works (technical).*
- **The tile** [I, notes 11, 12]. Low thresholds seed 6 to 10 blobs in hollows, mid thresholds grow and merge them, and the top thresholds close the gaps around tuft tips. Every level keeps clusters of at least 2x2 px.
- **In the Sandbox** [V, S3]. One 128x128 px tileable map in place of a single 32x32 tile, so no 32 px period shows. About 6 seed blobs per tile, stored in 2x2 px blocks, with ranks from about 4 to 55 units. Frost starts at depth 4.
- **It is the hard height blend** [V, S112; I, note 12]. Mishkinis lets the upper layer fill cracks first. "Sand doesn't stick to stones, instead it falls down and fills cracks between them." Here the compare is `field(world) > height(tile pixel)`.
- **Frost** [V, S97; I, note 11]. cure says to add a palette colour when dither covers half an area. Shift the ground ramp toward pale blue for the thinnest state.

*Cost / performance.* The tile adds 0.12 ms over Bayer on the CPU, 0.404 against 0.289 ms with the field at 1:2 and nearest sampling (§6a). In the shader it costs the same 0.0038 ms as Bayer [V, S4]. A 32x32 tile is 1,024 bytes and the Sandbox's map 16,384. Neither changes at run time.

*Games that used it.*
- Time Fantasy Winter Tiles ("SnowGrass", a hand-drawn half-way ground): https://finalbossblues.itch.io/time-fantasy-winter
- Return of the Obra Dinn (a threshold pattern pinned to the scene): https://dukope.com/devlogs/obra-dinn/tig-32/

*How it feels.* Snow gathers between the tufts first. Every state looks drawn, and the engine still stores one byte.

*Risks.* No shipped game was found that thresholds a depth field against a painted map. Index it by world pixel and keep the camera on whole pixels, or it swims as Obra Dinn's dither did [V, S117]. A single 32x32 tile shows its period across 20 tiles [I, note 11].

*Ratings 1–5 (author judgement):* Simplicity 3 · Speed 5 · Pixel taste 5 · Mood 4 · Interactivity 1

### B3. Summer and winter tilesets blended through a mask

*In plain words.* Draw the map twice, in summer art and in winter art. For each pixel, depth against the threshold picks which one shows. This is our proposal, with no shipped precedent found.

*How it works (technical).*
- **Shader** [I, note 12]. Four fetches per pixel: field, threshold, summer tile and winter tile. `COLOR = d > t ? winter : summer`.
- **Atlas layout** [V, S110; I, note 12]. Put each winter tile at a fixed UV offset from its summer twin. finalbossblues ships winter tiles "in the exact same arrangement as the originals", which is the layout this needs.

*Cost / performance.* 921,600 fetches per frame at 640x360 [I, note 12]. Not measured as such. The bench's 3-read flat shader cost 0.0038 ms on Metal [V, S4].

*Games that used it.*
- None found in any shipped game or public shader. The nearest practice is the Omega Modern winter atlas: https://itch.io/devlog/467420/snow-mega-modern
- Godot forum thread that swaps textures per season (search summary): https://forum.godotengine.org/t/how-can-i-effectively-change-the-texture/65272

*How it feels.* Coverage is dynamic and every pixel on screen is artist-made. It is the best-looking option in this study, on paper.

*Risks.* Untested in Godot. Atlas padding and tile animation may break the fixed UV offset [I, note 12]. It needs a full second tileset.

*Ratings 1–5 (author judgement):* Simplicity 3 · Speed 5 · Pixel taste 5 · Mood 5 · Interactivity 2

### B4. Seasonal tileset swaps and overlay autotiles

*In plain words.* What shipped games and tileset packs do. Winter is a second copy of the tileset, or a transparent snow layer with hand-drawn edges laid over any ground.

*How it works (technical).*
- **Games** [V, S2, S9, S39, S69]. Stardew swaps season-prefixed tilesheets. Tibia has about 60 hand-drawn snow ground ids and separate "snowy" tree and stone items. Factorio's Aquilo tiles come as frozen and thawed twins.
- **Packs** [V, self-reported, S107, S108, S109]. Mana Seed sells a snow autotile as a "terrain brush-style transparent overlay" and draws each tree in 3 states. Time Fantasy has SnowGrass as a half-way ground and DarkSnow as a second tone.
- **Size** [V, self-reported, S111; I, note 17]. Every commercial winter set we reached is drawn at 16 px. Franuka's 32 px version is labelled 200%. No pack lists footprint tiles.

*Cost / performance.* Free at run time. One event swaps a texture.

*Games that used it.*
- Stardew Valley: https://stardewvalleywiki.com/Winter
- Tibia: https://tibia.fandom.com/wiki/Tiles
- Mana Seed Winter Forest: https://seliel-the-shaper.itch.io/winter-forest

*How it feels.* Handsome and static. Snow arrives overnight.

*Risks.* If Asterion's 32 px tiles are 2x upscales of 16 px art, build the threshold map, flakes and prints on a 2 px grid [I, note 17; V, S101].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 4 · Mood 2 · Interactivity 1

### B5. Snow edge shading: shadow line, body and rim

*In plain words.* A 32 px tile has room to shade the edge of the snow. A dark line on the side away from the light, a flat body, and a bright rim on the side that faces it.

*How it works (technical).* Every px value here is our inference from general craft rules [I, note 11].
- **Edges.** Light from the north-west. A 1 px highlight rim on north and west edges. A 1 px shadow line on east edges and 2 px on south edges, because a 3/4 view shows the snow's thickness on the south side.
- **Ramp** [V, S104, S105; I]. 4 to 5 shades with value steps of 10 to 16 points and saturation under 20%. Apollo's brightest colour is `#ebede9`, so keep pure white to sparkles. Resurrect 64's ramp turns violet below V 60%.
- **In the Sandbox** [V, S3]. One body colour, a south line that grows to 2 px once the snow is 14 units over its threshold, and 1 or 2 short drift lines per tile from depth 34.

*Cost / performance.* Emboss and bands add 0.42 ms on the CPU, 0.713 against 0.291 ms. The full 32 px renderer with edge line, rim, 3 bands, packed and wet costs 0.945 / 5.80 ms. In the shader the same look is 8 reads and 0.0089 ms [V, S4].

*Games that used it.*
- Time Fantasy Winter Tiles (Snow, SnowFloor and DarkSnow as separate tones): https://finalbossblues.itch.io/time-fantasy-winter
- Slynyrd's top-down tile lessons (the general edge and cluster rules): https://www.slynyrd.com/blog/2023/3/26/pixelblog-43-top-down-tiles-part-2

*How it feels.* The snow gains thickness. The south shadow line does most of the work.

*Risks.* No artist source gives snow-edge widths or shade shares at any tile size [V, S102, S96]. Do not dither between bands over large areas.

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 4 · Pixel taste 5 · Mood 4 · Interactivity 1

### Family C: Objects

### C1. Shaped snow caps and roof lips

*In plain words.* Snow on a roof, a pine, a fence or a rock is drawn by a shape rule, not by threshold noise. A lip of snow hangs over the south eave.

*How it works (technical).* The px values are our inference for 32 px tiles and a north-west light [I, note 11].
- **Thickness scale.** 2 px for a dusting cap, 3 to 4 px for normal snow and 5 to 6 px for heavy snow. A 1 px cap breaks Derek Yu's rule and vanishes next to a 1 px outline [V, S98]. The Sandbox does not hold this rule yet. Its cap thresholds draw 1 px rows on pine tiers for the first few depth units [V, S3].
- **Roof.** A 1 px highlight along the ridge. On the south eave a lip hangs 1 to 2 px past the edge, with a thickness line 2 to 3 px tall and 1 px of darkened wall under it. Break the lip every 5 to 9 px with a small scallop.

*Cost / performance.* The Sandbox tests 23,877 cap pixels per frame, 10% of the screen, and its object layer costs 0.13 to 0.19 ms [V, S3]. The cheapest shipped form is one global switch. Don't Starve Together shows a hand-drawn snow layer on every tagged object once the snow level reaches 0.015 [V, S63].

*Games that used it.*
- Don't Starve Together (drawn snow layer per object, one global bool): https://dontstarve.wiki.gg/wiki/Winter
- Tibia ("snowy fir tree", "snowy stone" as separate hand-drawn items): https://github.com/otland/forgottenserver/blob/master/data/items/items.xml
- Mana Seed Winter Forest (each tree in bare and snow-covered states): https://seliel-the-shaper.itch.io/winter-forest

*How it feels.* The Christmas-card moment. Roofs and rails piped in white, with a lip that says the snow has weight.

*Risks.* No tutorial with px numbers for roof snow, pine tiers or fences was found [V, S102, S103]. Judge every value by eye.

*Ratings 1–5 (author judgement):* Simplicity 3 · Speed 5 · Pixel taste 5 · Mood 5 · Interactivity 1

### C2. Static art-resolution masks over coarse baked maps

*In plain words.* Roof outlines and trunk bases are sharp and they never move. Paint them once into the tileset as a mask. The baked exposure and sun maps can then stay coarse.

*How it works (technical).*
- **The mask** [I, note 12]. The tileset carries a static art-resolution snow mask, roof outline and trunk base included. The shader multiplies it into the sampled depth. A static mask costs no upload.
- **What it fixes** [I, note 12; V, S3]. Without it an eave edge is soft by the width of one cell, 2 px at 1:2 and 4 px at 1:4 [I]. Our figure for this profile counted 2 px and 3 px on its own small scene. It is also the class mask that stops bilinear depth bleeding from roof to ground. The Sandbox does that on 3% of ground pixels at 1:2 and 6.5% at 1:4.
- **Flakes use the same test** [V, S82]. Luanti's snowdrift mod spawns a flake only where sky light is 15, so none fall under roofs.

*Cost / performance.* One alpha read from a texture the shader already samples. Baked at 1:4, the sun shadow costs 0.064 / 0.389 ms against 3.08 / 17.4 ms at 1:1 [V, S4].

*Games that used it.*
- Luanti snowdrift (flakes only under open sky): https://github.com/paramat/snowdrift/blob/master/init.lua
- Company of Heroes 2's snow shadow map, covered in VFX #1: https://kingsfoil-artifacts.netlify.app/vfx-snow-topdown-pixel

*How it feels.* A crisp dry strip under the eave, even over a blurry field.

*Risks.* Carts and tents move, and a static mask cannot follow them [I].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 4 · Mood 3 · Interactivity 1

### Family D: Characters at 24x32

### D1. Boot prints on contact frames

*In plain words.* Each time a boot lands in the walk cycle, press a boot-shaped dent into the snow. Left, then right, turned to the direction of travel.

*How it works (technical).*
- **Shape** [I, notes 11, 13; V, S3]. Note 13 recommends 3x5 px facing north or south and 5x3 px sideways. The Sandbox draws 4x6 px, 2x3 whole cells at 1:2, because 3x5 did not read at 1x. A 2x2 dot is 1/16 of a tile wide and reads as a stray pixel.
- **Placement** [I, note 13]. 2 prints per tile, 16 px apart, 3 px either side of the centre line. Put each 4 px ahead of the body centre so prints land 4 px and 20 px into the tile, never on a seam. The Sandbox stamps at the feet instead, so with tile steps one of its prints starts on the seam [V, S3].
- **Stamp** [V, S2, S4, S3]. Keep 30% of the depth, mark the cells packed and spill the rest around the print. VFX #1 and the bench spill to random rim points. The Sandbox spills to an even ring.
- **Factorio** [V, S67, S68]. Footprint decals of 15x11 px on run frames 5 and 16 (left) and 10 and 21 (right) of 22, offset 3.2 px to each side. They live 600 ticks and fade over 125. Aquilo's snow tiles get none.

*Cost / performance.* A boot stamp costs 0.21 µs at 1:1 and 0.16 µs at 1:2, 1.20 and 0.95 µs throttled. 100 prints per second add 0.002 ms per frame on the throttled run [V, S4].

*Games that used it.*
- Factorio (prints per foot on named run frames): https://github.com/wube/factorio-data/blob/master/base/prototypes/entity/entities.lua
- RimWorld (alternating feet by distance, gated by depth): https://rimworldwiki.com/wiki/Snow

*How it feels.* The trail tells you which way someone went and how fast. In the Sandbox a print is gone after 13 s of heavy snow [V, S3].

*Risks.* Prints need a field of 1:2 or finer (A4). Factorio and RimWorld draw decals on a timer, and no game was found that presses prints into a depth field [V, S53, S56]. Scaled from Factorio's 44x66 px character, the sourced print size is about 7x5 px [I, note 16].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 5 · Mood 5 · Interactivity 5

### D2. One mark per tile left: Emerald, Platinum and Tibia's 10 s swap

*In plain words.* The classic method. When a character walks off a tile, that tile shows a footprint picture for a while.

*How it works (technical).*
- **Emerald** [V, S33, S34, S36, S37]. The print goes to `previousCoords`. Two 16x16 pictures cover 4 directions through flips. It shows for 41 frames and blinks until about 57. The pool is 64 sprites for everything on screen.
- **Platinum** [V, S42, S43]. One of 4 models by facing, on the previous tile. It holds 16 ticks and fades over 16 more. Each sprite type has a track type.
- **Tibia** [V, S10, S11, S9, S13]. A 14-line script on `StepOut` turns the snow tile into its footprint twin, which decays back after 10 s. Only players stamp. The state is the tile's item id, so every player sees the same prints.

*Cost / performance.* Tibia pays two tile-change messages per print and no per-pixel state [I, note 10]. As decals, 100 prints per second with a 10 s life would be 1,000 live sprites, 4 times Quake 3's pool of 256 marks [V, S83; I, note 13].

*Games that used it.*
- Tibia (the footprint script): https://github.com/otland/forgottenserver/blob/master/data/movements/scripts/snow.lua
- Pokémon Emerald (sand prints, Route 111): https://bulbapedia.bulbagarden.net/wiki/Hoenn_Route_111
- Pokémon Platinum (Route 217): https://bulbapedia.bulbagarden.net/wiki/Sinnoh_Route_217

*How it feels.* Shared and legible, and flat. Tibia's print has no direction, because the `+15` id rule keeps no facing [I, note 10]. The Sandbox has this as a third footprint mode [V, S3].

*Risks.* The 10 s comes from emulator data and was not checked against CipSoft's server [U, note 10]. A busy path flickers back to clean snow every 10 s, because the script runs only on clean tiles [I, note 10].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 3 · Mood 3 · Interactivity 3

### D3. Sinking by clipping, with a front rim

*In plain words.* Deep snow hides the boots. Lower the sprite a few pixels, cut off the rows that fall below the foot line, and draw a small snow rim in front of the cut.

*How it works (technical).*
- **Platinum** [V, S40, S41]. Deep, deeper and deepest snow lower a 32x32 sprite by 12, 14 and 16 units on a 16-unit tile. The walk takes 8, 16 and 32 frames per tile, and running is blocked in all three.
- **Legs at 24x32** [V, S94; I, note 11]. Slynyrd says the head takes "a third to half of the total sprite". That leaves legs of 6 to 10 px, with boots about 3 px tall.
- **Two caps** [I, lead; V, S3]. 6 px for snow that builds up by weather. 12 px for authored deep-snow terrain, as in Platinum. Sink follows local depth in 2 px steps, and the Sandbox reaches the cap at 120 units.
- **Method** [I, notes 11, 13; V, S3]. Lower the sprite by the sink and discard the rows under the foot line. Draw a snow rim over the cut, 3 rows tall in the Sandbox. Smooth the sampled depth over about 100 ms so the sink does not flicker.

*Cost / performance.* Twenty 24x32 sprites with y-sort, sink clip, shadow and rim cost 0.022 / 0.123 ms, and fifty cost 0.060 / 0.309 ms [V, S4].

*Games that used it.*
- Pokémon Platinum (three deep-snow tiers): https://bulbapedia.bulbagarden.net/wiki/Sinnoh_Route_217
- RPG Maker MV (bush depth of 12 px): https://github.com/rpgtkoolmv/corescript/blob/master/js/rpg_sprites/Sprite_Character.js

*How it feels.* Weight. It is the cheapest way to show depth from above.

*Risks.* 8 px of clipping buries the whole leg of a chibi sprite [I, note 11].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 4 · Mood 4 · Interactivity 5

### D4. The trench in deep snow

*In plain words.* Once the snow hides the boots, footprints make no sense. The character ploughs a continuous groove instead.

*How it works (technical).*
- **Platinum** [V, S42]. Deep snow picks one of 6 pieces, 2 straight and 4 corners, by previous direction and direction. It draws a connected trench, not feet.
- **Switch** [I, lead]. At a sink of 4 px or more, stop stamping boots.
- **Stamp** [I, note 13; V, S3]. Note 13 proposed a bar 10 px wide every 2 px of travel that keeps 40%. The Sandbox uses a round brush of radius 5 px every 2 px, sets a floor at 40% of the ambient depth and spills to both sides.
- **RimWorld** [V, S52]. Each large pawn removes 0.001 of depth from the cell it enters. Trails come from traffic, not from one walker.

*Cost / performance.* A trench piece costs 0.39 µs at 1:1 and 0.28 µs at 1:2 [V, S4].

*Games that used it.*
- Pokémon Platinum (connected track pieces in deep snow): https://github.com/pret/pokeplatinum/blob/main/src/overlay005/ov5_021F1CC8.c
- RimWorld (0.001 depth per cell entered): https://rimworldwiki.com/wiki/Snow

*How it feels.* A crowd leaves a road. One walker leaves a furrow that drifts shut.

*Risks.* No 2D game with a single-walker trench was found, so the 10 px width has no reference [U, note 16]. In the Sandbox the switch from prints to trench leaves a short churned patch [V, S3].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 4 · Mood 5 · Interactivity 5

### D5. Stride and walk-cycle timing for tile-to-tile movement

*In plain words.* Make one walk cycle last exactly one tile. Then the boot in the sprite, the print in the snow and the tile grid stay in step on every client.

*How it works (technical).*
- **Tibia's step** [V, S12, S8]. Step time runs from 250 to 600 ms for most players, in 50 ms steps. OTClient changes the walk pose 3 times per 32 px tile.
- **Four frames per tile** [V, S94; I, note 13]. Frame 0 is the left step and stamps at progress 0. Frame 2 is the right step and stamps at 0.5. Frames 1 and 3 are passing poses with the body 1 px up. Frame time is the tile time divided by 4.
- **No animation events** [I, note 13]. `foot = floor(p * 2)`. Derive the frame from the same progress and they cannot drift apart.
- **More frames** [V, S95, S32; V, self-reported, S106; I, note 11]. A 6-frame cycle has contacts at 0 and 3. Stardew's 8-frame run plays its step sound at frames 0 and 4.

*Cost / performance.* Zero bytes on the network. Every client turns the same move message into the same two prints [I, note 13].

*Games that used it.*
- Tibia (OTClient walk animation): https://github.com/edubart/otclient/blob/master/src/client/creature.cpp
- Pokémon Emerald (step tables and walk frames): https://github.com/pret/pokeemerald/blob/master/src/event_object_movement.c
- LPC character generator (walk previews): https://liberatedpixelcup.github.io/Universal-LPC-Spritesheet-Character-Generator/

*How it feels.* Planted. Emerald and OTClient both start a walk on a step pose, which makes input feel instant [V, S35, S8].

*Risks.* RPG Maker MV covers 1.25 tiles per step with a 48 px sprite and slides visibly [I, note 13].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 5 · Mood 4 · Interactivity 4

### D6. Shadow, breath, kicked snow and snow on shoulders

*In plain words.* Small cues that make the character feel cold, not only the map. A soft shadow on the snow, a puff of breath, a few kicked specks, and white on the hat after standing still.

*How it works (technical).*
- **Shadow** [V, S33; I, notes 11, 13]. Emerald centres the shadow 4 px above the sprite's bottom edge. Ours is a 14x5 px ellipse, drawn by switching snow pixels to the cold shadow shade.
- **Breath, shipped** [V, S54, S64, S65]. RimWorld throws 10 puffs in the first 80 ticks of a 320-tick cycle, under 0 °C, standing only. Don't Starve Together emits one puff when the idle animation ends, at -5 or colder.
- **Breath, ours** [I, note 13]. A 3-frame puff that grows from 2x2 to 5x4 px over 450 ms, every 3 to 4 s when idle.
- **Kicked snow** [I, note 13]. 2 to 3 particles per contact, only when the sink is 4 px or more, living 250 to 400 ms.
- **Snow on hat and shoulders** [I, notes 11, 13; V, S3]. No shipped 2D precedent was found. Our proposal is a 2 px cap on the hat and 2x2 px on each shoulder, shaken off on the first step. The Sandbox draws a 1 px line of snow on hat and shoulders at 0.3 of a 9 s idle timer and a second row on both at 0.65.

*Cost / performance.* Not measured [V, S4]. With 20 players breath is at most about 100 live puffs, and a per-character offset prevents even that [I, note 16].

*Games that used it.*
- RimWorld (breath puffs below 0 °C): https://rimworldwiki.com/wiki/Snow
- Don't Starve Together (frosty breath): https://dontstarve.wiki.gg/wiki/Winter
- Terraria (the character squints in a blizzard): https://terraria.wiki.gg/wiki/Rain

*How it feels.* Alive. A dark coloured outline sits better on snow than pure black, because the ground is now the lightest thing on screen [I, note 11].

*Risks.* Pixel Parmesan advises against dither on animated character sprites, so fade puffs by shape [V, S99].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 5 · Mood 5 · Interactivity 3

### D7. The crowd budget

*In plain words.* Twenty players on one screen leave a lot of prints. With stamps into a field that costs almost nothing. The things to cap are particles and overlays.

*How it works (technical).*
- **Rate** [I, note 13]. 20 players at 400 ms per tile make 100 boot stamps per second, about 2,500 byte writes. 100 players make about 12,500.
- **Screen bound** [I, note 13]. 225 tiles at 2 prints each is at most 450 visible prints, however many players walk.
- **Drop order** [I, note 13]. Kicked particles for other players first. Then breath and body snow beyond about 8 tiles, then rim deposits, then per-foot prints for others. Never the local player's own prints and sink.

*Cost / performance.* The whole frame with 23 actors against 3 moved by less than the noise, 1.36 against 1.36 ms on the desktop for the 1:2 preset [V, S4].

*Games that used it.*
- Tibia (players only, one state per tile): https://github.com/otland/forgottenserver/blob/master/data/movements/scripts/snow.lua
- Quake 3 (256 marks, oldest freed first): https://github.com/ioquake/ioq3/blob/main/code/cgame/cg_marks.c

*How it feels.* A plaza becomes a packed floor, not a storm of rims.

*Risks.* Do not plan on dirty-chunk uploads to pay for a crowd. Godot cannot patch a texture (F2).

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 3 · Mood 3 · Interactivity 4

### Family E: Falling snow at 32 px

### E1. Flake size and count: 0.1875 of a tile and 1% of the pixels

*In plain words.* When the tile grows, the flake grows with it and the count stays put. Three engines draw their big flakes at 3/16 of a tile, and heavy snow covers about 1% of the screen.

*How it works (technical).*
- **Size** [V, S27, S18, S26, S30]. RPG Maker VX Ace draws a 6x6 px flake on 32 px tiles. MV and MZ draw 9x9 px on 48 px tiles. Stardew's winter debris is 12 px on a 64 px tile. All three are 0.1875 of a tile.
- **Count** [V, S27, S18]. Both RPG Makers use `power * 10`, at most 90 flakes. The tile grew 1.5 times and the count did not move.
- **Coverage** [I, note 14]. VX Ace peaks at 1.27% of screen pixels, MV at 0.89% and the VFX #1 sandbox at 1.03%. For 640x360 that is about 2,300 flake pixels.
- **Our default** [I, note 11, lead; V, S3]. Far 1 px, mid 2 px, near 3 px, with a "large" option that adds 6 px near flakes. The Sandbox runs 560, 300 and 150 of them, 0.9 to 0.97% of the screen. The 6 px size is the shipped finding. The smaller default is our taste, because three layers with height read deeper than one flat layer of big soft flakes.

*Cost / performance.* Flake cost follows the count, not the sprite size. 456 flakes cost 0.015 / 0.086 ms to update and draw at 640x360, and 1,824 cost 0.050 / 0.300 ms [V, S4].

*Games that used it.*
- RPG Maker MV (9 px flakes, at most 90): https://github.com/rpgtkoolmv/corescript/blob/master/js/rpg_core/Weather.js
- RPG Maker VX Ace (6x6 two-tone flake): https://github.com/RMEx/buildozer/blob/master/Sample_project_1/Scripts/Sprites/Spriteset_Weather.rb
- Cataclysm DDA (1, 2 and 4 flakes per 100 visible tiles): https://github.com/CleverRaven/Cataclysm-DDA/blob/master/data/json/weather_type.json

*How it feels.* The shipped look is sparse and chunky. 1 px flakes alone are 1/32 of a tile and read as sensor noise over hand-drawn tiles [I, note 11]. The Sandbox's 1 px mode covers only 0.39% [V, S3].

*Risks.* The 1% rule rests on three data points, one of them our own sandbox. It is a tuning target, not a law [I, note 14].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 5 · Mood 4 · Interactivity 1

### E2. Stardew's tiled animated cell

*In plain words.* Stardew Valley has no snow particles. It draws one small animated picture of falling flakes and repeats it across the whole screen.

*How it works (technical).*
- **The cell** [V, S29]. A 16x16 art px source rect with 16 frames at 75 ms. It is drawn every 64 screen px, about 273 quads at 1280x720, in white at 80% times a player slider.
- **At 32 px tiles** [I, note 14]. A 32x32 cell with 16 frames is a 512x32 strip, drawn with a repeat shader in one draw and one fetch per pixel.

*Cost / performance.* The same at any density, with no state. Two hashed flake layers inside our ground shader cost 0.005 ms on Metal and 0.073 ms on software GL [V, S4].

*Games that used it.*
- Stardew Valley: https://stardewvalleywiki.com/Winter
- RimWorld (two panned overlays): https://rimworldwiki.com/wiki/Snow
- OTClient snow shader: https://github.com/mehah/otclient/blob/main/modules/game_shaders/shaders/fragment/snow.frag

*How it feels.* Even and calm. Every tile shows the same flakes, and Stardew hides that with 80% alpha over a busy tileset [I, note 14].

*Risks.* No height, no shadow dot and no landing. The OTClient shader blends additively, and white plus white stays white, so its flakes cannot show over snow ground [I, note 14].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 3 · Mood 3 · Interactivity 1

### E3. Z-height flakes in three sizes

*In plain words.* Each near flake knows the ground point it will land on and how high it still is. Draw it lifted by its height, with a shadow dot waiting on the ground. Far flakes are cheap dots with no height.

*How it works (technical).*
- **From VFX #1** [V, S2]. A flake is (x, y, z), drawn at (x, y - z). The near layer drops a shadow dot at (x, y).
- **Three sizes, three colours** [I, note 11]. Far 1 px in a shadow blue, mid 2x2 px in the body colour, near a 3 px plus in pure white, the only pure white in the scene, as the Sandbox draws it [V, S3]. Depth comes from the ramp step, not from alpha.
- **Landing without storing z** [V, S81; I, note 14]. Shattered Pixel Dungeon starts a flake `speed * lifespan` above its target and fades it on arrival, so `z = speed * time_left`. The shadow dot sits at the target for the whole fall.
- **Size tied to speed** [V, S44]. Platinum's heavy snow has 3 size classes moving (-1, +2), (-2, +4) and (-3, +6) px per frame.

*Cost / performance.* 60 stateful near flakes plus 520 stateless far flakes cost 0.017 / 0.089 ms to update and draw. Flakes of 2 to 3 px with 2 px shadow dots cost the same as 1 px flakes [V, S4].

*Games that used it.*
- Shattered Pixel Dungeon (a flake that ends on its target): https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/effects/particles/SnowParticle.java
- Pokémon Platinum (three size classes): https://github.com/pret/pokeplatinum/blob/main/src/overlay005/ov5_021D5EB8.c

*How it feels.* The strongest "this is top-down" cue. Flakes drift with the wind and the dots pin them to the ground.

*Risks.* None of the ten 2D code bases we read gives a flake a z value or a ground shadow [V, note 14]. Do not lean on Godot's particle collision for landing (§12).

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 5 · Mood 5 · Interactivity 2

### E4. Flake motion: world-locked, whole pixels, about 2 tiles per second

*In plain words.* Flakes belong to the world, not to the screen. They move in whole pixels, and the near ones fall about two tiles per second.

*How it works (technical).*
- **World lock** [V, S21, S38, S29, S78, S15]. RPG Maker stores world coordinates, Stardew subtracts the camera delta and Mindustry wraps world positions into the camera rectangle. None of the games we read locks flakes to the screen.
- **Whole pixels** [V, S27, S44]. VX Ace moves by (-1, +3). Platinum's light snow falls 1 px every 1 or 2 frames and steps 1 px sideways every 4 or 5 frames, an S-curve with no sine table.
- **Speed** [I, note 14]. Emerald falls 1.9 to 2.3 tiles per second and Stardew's debris 0.47 to 0.64. MV falls 3.7 and reads as sleet next to Emerald.
- **Our pick** [I, note 14; V, S3]. Note 14 keeps VFX #1's screen heights per second, which doubles the px speed to 28, 48 and 84 px/s. The Sandbox falls 26, 42 and 64 px/s, so its near layer falls 2 tiles per second.

*Cost / performance.* Nothing extra.

*Games that used it.*
- Mindustry (stateless seed-0 flakes): https://github.com/Anuken/Mindustry/blob/master/core/src/mindustry/type/Weather.java
- Pokémon Emerald (world-locked, wrapping flakes): https://github.com/pret/pokeemerald/blob/master/src/field_weather_effect.c
- Ragnarok Online through roBrowser (flakes fade in the last fifth of life): https://github.com/MrAntares/roBrowserLegacy/blob/master/src/Renderer/Effects/SnowWeather.js

*How it feels.* Slow reads as calm snowfall and fast as a storm. Screen-locked flakes would slide with the player.

*Risks.* The Platinum speeds assume a 30 fps overworld, which is unverified [U, note 14].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 5 · Mood 4 · Interactivity 1

### Family F: Cost and Godot

### F1. The ground render: one shader against the CPU loop

*In plain words.* Colouring the ground is the most expensive job in the engine. A GPU does it in one pass for almost nothing. A CPU loop pays for every one of the 230,400 pixels.

*How it works (technical).*
- **CPU share** [V, S4]. The ground pass is 68 to 71% of every CPU frame. The VFX #1 loop goes from 0.337 ms at 320x180 to 1.44 / 8.85 ms at 640x360, 53% of the throttled budget.
- **The shader** [V, S4]. It reads an art texture, an R8 depth texture, a repeating R8 threshold texture and a small palette. Flat cover is 3 reads. Emboss, bands and the palette lookup make 8. Packed, wet, sun shadow, sparkle and a lamp pool make 11.
- **In Godot** [V, S132; I, note 12]. One CanvasItem shader. `MODEL_MATRIX` takes the vertex to world space and a varying carries it to `fragment()`.

*Cost / performance.* The full shader costs 0.012 ms at 640x360 on the M4 Pro GPU, at every field ratio. The whole frame costs 0.08 to 0.10 / 0.47 to 0.56 ms, against 1.36 to 1.44 / 8.45 to 10.1 ms with a CPU render. With the GPU drawing, 0.067 of the 0.096 ms frame is the sim tick [V, S4].

*Games that used it.*
- OTClient (a full-screen fragment shader over the map framebuffer): https://github.com/mehah/otclient/blob/main/modules/game_shaders/shaders/fragment/snow.frag
- VFX #1 Snow (the CPU loop this replaces): https://kingsfoil-artifacts.netlify.app/vfx-snow-topdown-pixel

*How it feels.* Invisible. It decides whether everything else in this study fits a phone.

*Risks.* Nothing here was run in Godot, and a GDScript per-pixel loop would be slower by a factor we did not measure. The M4 numbers say nothing about a phone's fill rate [V, S4].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 4 · Mood 3 · Interactivity 1

### F2. Whole-texture uploads and a small field

*In plain words.* In Godot's web renderer you cannot update part of a texture. Every update sends the whole image, so the field's size is the upload cost.

*How it works (technical).*
- **The code path** [V, S126, S127]. `texture_2d_update` ends in `glTexImage2D` with the full width and height. `glTexSubImage2D` does not appear in the file at 4.7-stable or on master. Requests for a rectangle update have been open since 2022 [V, S128, S129].
- **Bytes** [I, note 12]. 640x360 RGBA8 is 921,600 bytes. 160x90 R8 is 14,400, 64 times less.
- **`DrawableTexture2D`** [V, S130, S131, S126]. New in 4.7, still experimental, RGBA formats only. The GLES3 backend implements it, and nobody in this study ran it on WebGL2.

*Cost / performance.* In WebGL2 one `texSubImage2D` call costs 0.015 to 0.021 ms for anything up to 57,600 bytes. A full 320x180 R8 upload is 0.020 ms and a full 640x360 RGBA8 upload 0.093 ms. Eight 64x64 dirty chunks cost 0.039 ms, more than the full 320x180 upload [V, S4]. The table shows why. Each timed frame carries a fixed cost, and every extra call adds about 0.003 ms. This is not the Godot call.

*Games that used it.*
- RimWorld (rebuilds a section only when a cell changes by more than 0.15): https://rimworldwiki.com/wiki/Snow
- Godot proposal #13012 (the missing `update_region`): https://github.com/godotengine/godot-proposals/issues/13012

*How it feels.* Nothing to see. A hitch every tick if you get it wrong.

*Risks.* The cost of `ImageTexture.update()` is the largest open number in this study [V, note 17]. One forum answer says a per-frame `texture_2d_update()` "will still cause bottleneck", with no figure [U, S141].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 3 · Mood 2 · Interactivity 2

### F3. The row-sweep exposure bake

*In plain words.* VFX #1 walks upwind from every ground cell to find shelter. Walk each row once in the wind direction instead, and remember the last wall you passed.

*How it works (technical).*
- **Ray per cell** [V, S2, S4]. Each ground cell steps upwind until it meets an obstacle or the ray ends. VFX #1's 28 px ray is 3.5 tiles. Cost grows with cells times ray length, 7 to 8 times per halving of the cell size.
- **Sweep** [V, S4]. Carry the height of the last obstacle and the distance to it along the row. Cost grows with cells only. The bench checks that both give the same map, bit for bit.

*Cost / performance.* With a 3.5-tile ray, ray per cell costs 15.9 / 99.7 ms at 1:1 and 2.12 / 12.8 ms at 1:2. The sweep costs 0.49 / 3.25 ms and 0.137 / 0.81 ms. The sun shadow bake costs 3.08 / 17.4 ms at 1:1 and 0.417 / 2.50 ms at 1:2 [V, S4]. The Sandbox's own bake fell from 20 to 27 ms to 1.7 ms at 1:1 when it moved to the sweep [V, S3].

*Games that used it.*
- VFX #1 Snow (the ray version, per wind bucket): https://kingsfoil-artifacts.netlify.app/vfx-snow-topdown-pixel

*How it feels.* The wind can change bucket without a six-frame hitch.

*Risks.* The sweep needs wind along the rows. A diagonal wind needs a sheared sweep, which we did not measure [V, S4].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 3 · Mood 3 · Interactivity 1

### F4. Pixel-perfect settings for 640x360

*In plain words.* A handful of project settings decide whether Godot renders 230,400 pixels or two million, and whether they land on a clean grid.

*How it works (technical).* Names and values are from the 4.7 class reference and docs [V, S123, S122].
- **Base size.** `display/window/size/viewport_width` 640 and `viewport_height` 360.
- **Stretch.** `display/window/stretch/mode` set to `viewport`, `aspect` to `keep` or `expand`, and `scale_mode` to `integer`. Projects created in the 4.7 editor start with `canvas_items` and `expand`, so change them by hand.
- **Filter and snap.** `rendering/textures/canvas_textures/default_texture_filter` set to Nearest. `rendering/2d/snap/snap_2d_transforms_to_pixel` on, and the vertex setting off.
- **Window.** Set `Window.min_size` to the base size. Prefer exclusive fullscreen, because plain fullscreen is 1 px short and can drop the factor by one.

*Cost / performance.* With `canvas_items` at 1080p a full-screen shader runs on 2,073,600 fragments, 9 times more [I, note 12]. Measured, the full ground shader costs 0.086 ms at 1920x1080 against 0.012 ms at 640x360 on Metal, and 6.1 against 0.69 ms on software GL [V, S4].

*Games that used it.*
- Godot docs, the pixel-art list for a 640x360 base: https://docs.godotengine.org/en/stable/tutorials/rendering/multiple_resolutions.html
- A Godot 4.4 pixel-art settings post (search summary): https://itch.io/blog/806788/godot-44-settings-for-pixel-art

*How it feels.* Square pixels at every window size.

*Risks.* Chrome and Firefox change `devicePixelRatio` on page zoom, which makes pixel art uneven [U, S124]. Windows at 125% or 150% scaling is untested.

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 5 · Mood 3 · Interactivity 1

### F5. A machine without a GPU

*In plain words.* Some browsers fall back to drawing WebGL on the CPU. The big ground pass survives that. Hundreds of tiny flake sprites do not.

*How it works (technical).*
- **Full-screen passes hold up** [V, S4]. On SwiftShader, a CPU rasteriser, the full ground shader costs 0.69 ms at 640x360, still below the 0.945 ms of the JavaScript renderer. At 1920x1080 it costs 6.1 ms.
- **Small quads do not** [V, S4]. An instanced flake quad costs about 13 µs. 580 flake quads cost about 8 ms, and 46 actor quads about 1 ms.
- **The fix** [V, S4]. Draw the far flakes inside the ground shader, 0.073 ms, and keep only the near flakes as sprites.

*Cost / performance.* The WebGL2 frame on SwiftShader costs 9.7 to 10.3 ms with all flakes as quads, 2.8 to 3.3 ms with the far flakes in the shader and 1.8 ms with no flakes. With the 6x throttle on top those are 10.5 to 11.0, 3.2 to 3.8 and 2.2 ms [V, S4].

*Games that used it.*
- Not a game technique. The CPU throttle used for our proxy is documented here: https://chromedevtools.github.io/devtools-protocol/tot/Emulation/#method-setCPUThrottlingRate

*How it feels.* The same picture for about a fifth of the frame budget, if the far flakes move into the shader.

*Risks.* The throttle slows JavaScript and not the rasteriser, so the combined column is a floor [V, S4]. No real low-end laptop was measured.

*Ratings 1–5 (author judgement):* Simplicity 3 · Speed 3 · Pixel taste 3 · Mood 2 · Interactivity 1

---

## 5. Comparison scorecard

All ratings are author judgement. "Sum" is a crude total. A low-sum row such as F2 or F5 can still decide whether the game runs.

| # | Technique | Simpl. | Speed | Pixel taste | Mood | Interact. | Sum |
|---|---|---|---|---|---|---|---|
| A1 | Base resolution 640x360, whole-number scale | 5 | 5 | 5 | 3 | 1 | 19 |
| A2 | Field at 1:1, the naive port | 5 | 2 | 4 | 4 | 5 | 20 |
| A3 | Coarse field, bilinear + threshold | 4 | 4 | 5 | 4 | 4 | 21 |
| A4 | Split field, depth coarse and trail fine | 3 | 4 | 5 | 4 | 5 | 21 |
| A5 | Per-tile levels with autotiles | 4 | 5 | 4 | 2 | 2 | 17 |
| A6 | One global level against noise | 5 | 5 | 3 | 3 | 1 | 17 |
| A7 | RimWorld per-cell depth, smooth draw | 4 | 5 | 3 | 4 | 3 | 19 |
| B1 | Bayer 4 and 8 at 32 px | 5 | 5 | 2 | 2 | 1 | 15 |
| B2 | Art threshold tile and frost tint | 3 | 5 | 5 | 4 | 1 | 18 |
| B3 | Summer and winter tilesets through a mask | 3 | 5 | 5 | 5 | 2 | 20 |
| B4 | Seasonal swaps and overlay autotiles | 5 | 5 | 4 | 2 | 1 | 17 |
| B5 | Edge shading: shadow line, body, rim | 4 | 4 | 5 | 4 | 1 | 18 |
| C1 | Shaped snow caps and roof lips | 3 | 5 | 5 | 5 | 1 | 19 |
| C2 | Static art-resolution masks | 4 | 5 | 4 | 3 | 1 | 17 |
| D1 | Boot prints on contact frames | 4 | 5 | 5 | 5 | 5 | 24 |
| D2 | One mark per tile left | 5 | 5 | 3 | 3 | 3 | 19 |
| D3 | Sinking by clipping, front rim | 4 | 5 | 4 | 4 | 5 | 22 |
| D4 | Trench in deep snow | 4 | 5 | 4 | 5 | 5 | 23 |
| D5 | Stride and walk-cycle timing | 4 | 5 | 5 | 4 | 4 | 22 |
| D6 | Shadow, breath, kicked snow, shoulders | 4 | 5 | 5 | 5 | 3 | 22 |
| D7 | Crowd budget | 4 | 5 | 3 | 3 | 4 | 19 |
| E1 | Flake size 0.1875 tile, 1% coverage | 5 | 5 | 5 | 4 | 1 | 20 |
| E2 | Stardew's tiled animated cell | 5 | 5 | 3 | 3 | 1 | 17 |
| E3 | Z-height flakes in three sizes | 4 | 5 | 5 | 5 | 2 | 21 |
| E4 | World-locked, whole-pixel motion | 5 | 5 | 5 | 4 | 1 | 20 |
| F1 | Ground render in one shader | 4 | 5 | 4 | 3 | 1 | 17 |
| F2 | Whole-texture uploads, small field | 4 | 5 | 3 | 2 | 2 | 16 |
| F3 | Row-sweep exposure bake | 4 | 5 | 3 | 3 | 1 | 16 |
| F4 | Pixel-perfect settings for 640x360 | 5 | 5 | 5 | 3 | 1 | 19 |
| F5 | A machine without a GPU | 3 | 3 | 3 | 2 | 1 | 12 |

**Reading the table.** Unlike the fog, grass and magic studies, Speed does separate the rows here. The 1:1 field (A2) scores a 2 because it fills 87 to 93% of the throttled frame, and the no-GPU case (F5) a 3 [V, S4]. The top rows all belong to characters. Boot prints (D1, 24), the trench (D4, 23), sinking (D3), walk timing (D5) and the small life cues (D6) at 22 cost microseconds and carry most of the interaction. The coarse field (A3), the split field (A4) and z-height flakes (E3) follow at 21. Bayer dusting (B1, 15) is the cheapest ground pass and the worst-looking one at this size. The plumbing rows, uploads (F2), the sweep (F3) and the shader (F1), sit low because nobody sees them. They decide whether the rest fits a phone [I].

---

## 6. Deep dives

### 6a. Measured costs: what the snow engine costs at 640x360

Our measurements [V, S4]. Apple M4 Pro, macOS, Chromium 153 driven by Playwright, 12 Nov 2026. These are browser JavaScript and WebGL2 numbers on one machine. **They are not Godot numbers, and no measured `ImageTexture.update()` time exists.** The Sandbox's own per-layer timings are a separate set and sit in §8.

**Method.** A CPU test warms up for 200 ms and takes 31 samples of 10 ms each. A WebGL2 test measures the slope between a batch of 1 frame and a batch of K frames, each ending in a 1x1 `readPixels` [V, S4, S143]. The scene is the VFX #1 sandbox scene resampled to each size.

**The runs.** "GPU run" is full Chromium on ANGLE Metal. "SwiftShader" is a CPU rasteriser. "6x throttle" applies `Emulation.setCPUThrottlingRate` 6 [V, S142]. We quote "GPU run, median" for a desktop and "6x throttle, median" for the low-end case.

**Sim tick by field size.**

| Tick (GPU run, median / 6x throttle, median, ms) | Picks at 57,600 cells | 14,400 cells (1:4) | 57,600 cells (1:2) | 230,400 cells (1:1) |
|---|---|---|---|---|
| All five passes at full count | 9,400 | 0.025 / 0.159 | 0.105 / 0.641 | 0.435 / 2.77 |
| Tick while snowing (wind 0.6) | 6,040 | 0.017 / 0.106 | 0.067 / 0.421 | 0.281 / 1.73 |
| Tick in a sunny thaw (6 °C) | 8,023 | 0.023 / 0.147 | 0.095 / 0.594 | 0.400 / 2.48 |

A pick costs 3 to 16 ns, and a field 9 times larger adds 3 to 17% per pick [V, S4].

**Ground render on the CPU at 640x360.**

| Ground pass into the index buffer at 640x360 | GPU run, median ms | 6x throttle, median ms | Profiles |
|---|---|---|---|
| VFX #1 loop as written, snowing | 1.44 | 8.85 | A2, F1 |
| VFX #1 loop as written, sunny | 1.88 | 12.8 | A2 |
| Field 1:1 nearest, Bayer 4x4, flat | 0.291 | 1.85 | B1 |
| Field 1:2 nearest, Bayer, flat | 0.289 | 1.73 | A3 |
| Field 1:2 bilinear (table weights), Bayer, flat | 0.867 | 5.30 | A3 |
| Field 1:4 bilinear, Bayer, flat | 0.875 | 5.20 | A3 |
| Field 1:2 nearest, art threshold tile, flat | 0.404 | 2.75 | B2 |
| Field 1:2 bilinear, art tile, flat | 1.00 | 5.95 | B2 |
| Field 1:1 nearest, Bayer, emboss + 3 bands | 0.713 | 5.60 | B5 |
| Upsample only, 1:2, table weights | 0.594 | 4.00 | A3 |
| Upsample only, 1:2, fixed 9/3/3/1 weights | 0.135 | 0.862 | A3 |
| Full 32 px renderer, field 1:2, 9/3/3/1 weights, snowing | 0.945 | 5.80 | B5 |
| Full 32 px renderer, field 1:2, 9/3/3/1 weights, sunny | 1.17 | 6.95 | B5 |
| Night palette pass, byte lamp mask | 0.258 | 1.53 | §7 layer 8 |
| `putImageData`, 921,600 bytes, software canvas | 0.032 | 0.186 | |

Throttled rows carry up to 20% noise [V, S4].

**Ground render in a WebGL2 fragment shader.** "Wall" is the time one more frame adds to a batch with the GPU forced to finish.

| Fragment shader ground pass | Reads | 640x360, Metal, wall median ms | 1920x1080, Metal, wall median ms | 640x360, SwiftShader, wall median ms | 1920x1080, SwiftShader, wall median ms |
|---|---|---|---|---|---|
| Flat, field 1:2 linear, art tile | 3 | 0.0038 | 0.029 | 0.239 | 2.12 |
| Emboss + bands + palette LUT, field 1:2 linear | 8 | 0.0089 | 0.063 | 0.491 | 4.49 |
| Full (packed, wet, shadow, sparkle, lamp), field 1:1 nearest | 11 | 0.011 | 0.073 | 0.596 | 5.35 |
| Full, field 1:2 linear | 11 | 0.012 | 0.086 | 0.688 | 6.10 |
| Full, field 1:4 linear | 11 | 0.012 | 0.095 | 0.715 | 6.07 |
| Full + 2 hashed flake layers, field 1:2 linear | 11 + flakes | 0.017 | 0.129 | 0.761 | 6.71 |

**Texture upload.** Each timed frame is a `texSubImage2D` call plus a 1 px draw that samples the texture.

| `texSubImage2D` + 1 px draw | Bytes per frame | Metal, wall median ms | SwiftShader, wall median ms |
|---|---|---|---|
| No upload, the 1 px draw alone | 0 | 0.00033 | 0.015 |
| 160x90 R8, full | 14,400 | 0.017 | 0.022 |
| 320x180 R8, full | 57,600 | 0.020 | 0.025 |
| 320x180 R8, eight 64x64 chunks | 32,768 | 0.039 | 0.039 |
| 320x180 RGBA8, full | 230,400 | 0.037 | 0.038 |
| 640x360 R8, full | 230,400 | 0.037 | 0.037 |
| 640x360 RGBA8, one 64x64 chunk | 16,384 | 0.017 | 0.037 |
| 640x360 RGBA8, full | 921,600 | 0.093 | 0.084 |

**Bakes.**

| Bake, one call, 3.5-tile ray (GPU run, median / 6x throttle, median, ms) | 14,400 cells (1:4) | 57,600 cells (1:2) | 230,400 cells (1:1) |
|---|---|---|---|
| Exposure, ray per cell | 0.300 / 1.70 | 2.12 / 12.8 | 15.9 / 99.7 |
| Exposure, one sweep per row | 0.036 / 0.215 | 0.137 / 0.808 | 0.490 / 3.25 |
| Sun shadow | 0.064 / 0.389 | 0.417 / 2.50 | 3.08 / 17.4 |

**Characters, prints and flakes.**

| Layer | Load | GPU run, median | 6x throttle, median |
|---|---|---|---|
| Sprites 7x12 px, VFX #1 code, 320x180 | 20 actors | 0.011 ms | 0.064 ms |
| Sprites 24x32 px, 640x360 (move, y-sort, sink clip, shadow, rim) | 20 actors | 0.022 ms | 0.123 ms |
| Sprites 24x32 px, 640x360 | 50 actors | 0.060 ms | 0.309 ms |
| VFX #1 print, 2x2 cells | 1 stamp | 0.14 µs | 0.89 µs |
| Boot 3x5 px, field 1:1 | 1 stamp | 0.21 µs | 1.20 µs |
| Boot as 2x3 cells, field 1:2 | 1 stamp | 0.16 µs | 0.95 µs |
| Trench piece 5x2 cells, field 1:2 | 1 stamp | 0.28 µs | 1.66 µs |
| Flakes, VFX #1 sizes, 640x360, update + draw | 456 | 0.015 ms | 0.086 ms |
| Flakes, the same sizes, 640x360, update + draw | 1,824 | 0.050 ms | 0.300 ms |
| 60 near (3 px plus + shadow) + 520 stateless far, update + draw | 580 | 0.017 ms | 0.089 ms |

**The whole frame, 23 actors.** One frame is one snowing tick, actor movement and prints, flakes, the ground render, actors, the night palette pass and the present.

| Whole frame, 23 actors | GPU run, median ms | 6x throttle, median ms | SwiftShader + 6x throttle, median ms |
|---|---|---|---|
| VFX #1 engine at 320x180 (8 px tiles, field 57,600) | 0.578 | 3.70 | 3.87 |
| Preset 1: naive 1:1 port at 640x360, all on the CPU | 2.50 | 15.3 | 15.3 |
| Preset 2: field 1:2, bilinear + art threshold, CPU render | 1.36 | 8.45 | 9.15 |
| Preset 3: field 1:2 sim on the CPU, WebGL2 render, 580 flakes as quads | 0.096 | 0.542 | 11.0 |
| Preset 3, 520 far flakes in the shader + 60 near as quads | 0.083 | 0.484 | 3.84 |
| Preset 3, no flakes | 0.078 | 0.472 | 2.23 |

**What the tables say.**
- **The naive port breaks the budget on the proxy.** 15.3 ms of 16.7, with a p95 of 18.3 ms. One more sim tick per frame adds 1.73 ms.
- **The ground render is the frame.** In preset 2 it takes 0.980 / 6.33 ms of 1.38 / 9.07 ms, the sum of the layers timed one by one. Timed as one frame, preset 2 is 1.36 / 8.45 ms. The night palette pass is second at 0.257 / 1.64 ms.
- **A coarse field costs nothing extra to draw, and bilinear costs 3 times nearest on the CPU.** Fix the ratio at 1:2 and hard-code the 9/3/3/1 weights.
- **Upload the whole 1:2 field.** Three full R8 uploads, 172,800 bytes, do not show in the frame total [V, S4].

**A harness finding worth keeping** [V, S4]. Keep the RNG state in an `Int32Array`. With a script-level `let`, the same tick measured 0.063 ms on a fresh page and 0.21 to 0.24 ms after other tests had run.

**Not measured** [V, S4].
- Godot itself. No GDScript, no C#, no `ImageTexture.update`, no CanvasItem shader, no draw-call batching.
- Any real phone or low-end laptop. The throttle measured 6.1x at the median and does not slow the GPU process.
- Presenting the frame, Firefox, Safari and garbage-collection pauses [V, S144].
- 8x8 Bayer, dual-grid autotiles, shaped caps, breath, the split field and a diagonal wind.

### 6b. The conversion table: VFX #1 numbers at 32 px

VFX #1 stated its values in pixels on 8 px tiles [V, S2]. This table gives each one in tiles and at 32 px. "Tile" means multiply by 4. "Character" means it follows the sprite's proportions, which did not grow by 4. Converted values are arithmetic or proposals [I].

| VFX #1 value (8 px tiles) | In tiles | At 32 px tiles | Follows | Note |
|---|---|---|---|---|
| Character 7x12 px | 0.875 x 1.5 | 24x32 px, 0.75 x 1 | Neither | The sprite grew about 3 times, not 4 |
| Print stamp 2x2 px | 0.25 | Boot 3x5 px proposed, 4x6 px in the Sandbox. A naive x4 gives 8x8 px | Character | [I, note 13; V, S3] |
| Stride, one stamp per 4 px | 0.5 | 16 px, 2 prints per tile | Tile | [I, note 13] |
| Rim, 6 deposits at radius 2.2 px | 0.28 | 10 deposits at radius 4 px proposed. An even ring in the Sandbox | Character | [I, note 13; V, S3] |
| Keep fraction 30% | | 30% for boots, 40% for the trench | Constant | [I, note 13] |
| Upwind ray 28 px | 3.5 | 112 px, 56 cells at 1:2, 28 cells at 1:4 | Tile | [V, S4] |
| Lee length `1.1 * h * wind + 2` px | + 0.25 | + 8 px, with h in art px | Tile | [I] |
| Drift band, L to 1.8 L at x1.12 | ratio | The same | Constant | [V, S2] |
| Eave strip 6 rows | 0.75 | 24 px | Tile | [I] |
| Sink, 1 row per 22 units, at most 4 rows | 0.5, a third of the sprite | 2 px steps to 6 px at 120 units, or 12 px for deep terrain | Character | [I, notes 11, 13; V, S3] |
| Sink rim 7 px wide | sprite width | 10 to 14 px wide and 2 px tall proposed, 3 rows in the Sandbox | Character | [I, note 11; V, S3] |
| Slowdown up to 55% | | x1.0, x0.85, x0.7, x0.5 by tile band | Constant | [I, note 13] |
| 3 puffs per step above 18 units | | 2 to 3 per contact at a sink of 4 px or more | Constant | [I, note 13] |
| Hat cap 3 px | | 2 px cap, 10 to 12 px wide, plus 2x2 px shoulders | Character | [I, note 11] |
| Flake sizes 1 px, 1 px, 2x2 px | 0.125 to 0.25 | 1, 2 and 3 px by default. 6 px keeps the shipped 0.1875 | Tile in shipped code | [I, notes 11, 14] |
| Flake count 260 + 150 + 46 = 456 | 0.51 per tile | 114 by tiles, 1,824 by pixels. The Sandbox runs 560 + 300 + 150 = 1,010 | Coverage | [I, note 14; V, S3] |
| Fall speed 14, 24, 42 px/s | 1.75, 3.0, 5.25 per s | 26, 42, 64 px/s in the Sandbox, 0.8 to 2 tiles per s | Screen height | [I, note 14; V, S3] |
| Shadow dot 1 px | | 2 px | Character | [V, S4] |
| Picks per frame 900, 4,000, 1,400, 1,500, 1,600 | | 163 per 1,000 cells. 9,400 at 1:2, 37,600 at 1:1, 2,350 at 1:4 | Field cells | [I, note 12] |
| Field, 1 cell per px, 57,600 cells | 64 cells per tile | 57,600 cells at 1:2, 256 per tile | Our choice | [I] |
| Bayer 4x4, 4 px period | 0.5, 2 repeats per tile | A 32x32 art tile, 1 repeat. A naive port gives 8 repeats | Tile | [I, note 12] |
| Emboss from 1 px neighbours | | 1 px rim, 1 px east and 2 px south shadow line | Pixel | [I, note 11] |
| Depth cap 200 units | | The same | Constant | [V, S2, S3] |
| Sandpile repose, 3 units per cell | | A slope limit of 1.5 units per art px in the Sandbox | Our choice | [V, S2, S3] |
| Trail refill, 14 packed units off per deposit | | Dropped. Packed fades evenly, 0.22 units per tick | Our choice | [V, S2, S3] |
| Palette 58 base colours x 4 variants | | 77 base colours x 6 versions, 462 entries, in the Sandbox | Constant | [V, S3] |
| Breath every 1.4 to 2.0 s | | Every 3 to 4 s when idle | Constant | [I, note 13] |

Two traps hide in this table. Equal picks per 1,000 cells keep deposit and melt rates equal, but not drift speed (A2). And VFX #1's near flakes fell 5.25 tiles per second. Carried over in tiles that is 168 px/s, far past the 3.7 tiles per second that already reads as sleet in RPG Maker MV [I, note 14].

### 6c. Games by tile size

Only sourced cells are filled. Cells that the notes hold from memory stay empty, except two marked [K]. Only Noita stores ground snow per pixel, and Noita is a falling-sand game.

| Game | Tile px | Character px | Internal resolution | Snow ground | Footprints | Falling snow | Sink or slowdown | Source |
|---|---|---|---|---|---|---|---|---|
| Tibia | 32 | | 480x352 visible, 15x11 tiles | Hand-drawn ground items, about 60 snow ids | Whole-tile swap, 15 footprint ids, 10 s, no direction, players only | None in the 3 client files read. The mehah client has a snow shader | Snow tile speed 160 against ice 100 | [V, S6, S7, S9, S10, S2] |
| Dwarf Fortress (Steam) | 32 | 32, one tile | | One byte per tile | | | | [V, S58, S59] |
| Factorio 2.0, Space Age | 32 at scale 1 | 44x66 frame | | Static Aquilo tiles with frozen and thawed twins | Not on snow. On dirt and sand, 15x11 px, 600 ticks plus 125 fade | | Vehicle friction x1.8 on snow tiles | [V, S67, S68, S69] |
| RPG Maker VX Ace | 32 | 3 frames x 4 directions | 544x416 [K] | | | Up to 90 flakes of 6x6 px, -1 and +3 px per frame | | [V, S27; U, S28] |
| RPG Maker MV, MZ | 48 | 48x48 | 816x624, 17x13 tiles | A2 autotile, 6 source tiles, 48 shapes | None in core | Up to 90 flakes of 9x9 px, 2.94 px per frame, 41 to 60 frames | Bush depth 12 px at half opacity | [V, S19, S20, S25, S18, S26, S22, S23] |
| Stardew Valley 1.5.4 | 16, drawn at 4x | 16x32 | 1280x720 window, 320x180 art px | Season tilesheet swap | None. The step sound changes | Tiled 16x16 cell, 16 frames. 16 to 63 debris of 4x4 px at 3x | None | [V, S29, S30, S31, S2] |
| Pokémon Emerald | 16 | 16x32 | 240x160 | Static tiles | One 16x16 print on the tile just left, about 57 frames | 16 sprites of 8x8 px | None for snow | [V, S33, S38, S2] |
| Pokémon Platinum | 16 units | 32-unit sprite | 256x192 [K] | Static map, 5 snow tile types | 4 directions plus 6 bike shapes, 32 ticks, on the tile just left | Light and heavy handlers, about 24 and 50 flakes alive | Sink 12, 14, 16 units. 8, 16, 32 frames per tile | [V, S39, S42, S40, S41, S44] |
| Pokémon HeartGold | | | | One snow tile type | Not found in the decompiled C | `WEATHER_SNOW` constant | No deep tiers | [V, S45, S46] |
| Pokémon Black and White | | | | Winter snow opens paths in 5 areas | | Rain areas snow in winter | | [V, S47] |
| CrossCode | 16 | | 568x320, search summary | Props carry terrain `SNOW` or `ICE` | Not found | Particle type `SNOW_FLAKES`, preset `BERGEN_SNOW` | | [V, S84, S85; U, S86] |
| RimWorld 1.6 | 1 cell | | | Float per cell, 9-vertex alpha mesh | At depth 0.4 or more, every 0.632 cell, 4.88 s | Two panned overlay textures | +0, 0, 4, 8, 12 ticks per cell | [V, S48, S49, S53, S55, S50] |
| Project Zomboid 41.78 | Isometric | | | Global fraction against 256x256 noise, 44 pieces | None in code | | | [V, S60, S61] |
| Don't Starve Together | Not tile art | | | One global float, one overlay texture | | 600 particles per second, cap 4,800 | | [V, S62, S66] |
| Noita | | | | Per-pixel powder material that melts to water | | Falling material cells in 1 of 12 winter runs | | [V, S70, S71] |
| Terraria | | | | Snow blocks, no build-up listed | | Blizzard in the snow biome | | [V, S72] |
| Rain World (Saint) | | | | Water texture altered to show snow | | Snowfall grows into a blizzard | Wind pushes creatures | [V, S73] |
| Ragnarok Online, via roBrowser | 3D map | | | | | 2 flakes per 25 ms tick, life 320 ticks | | [V, S75] |
| Chained Echoes | | | 640x360, search summary | | | | | [U, S87] |
| Zelda: The Minish Cap | | | | No code named snow | | None by name | | [V, S89] |
| Zelda: A Link to the Past | | | | No code named snow | | Rain overlay only | | [V, S90] |
| EarthBound | | | | "snow" matches only snowman text | | None by name | | [V, S91] |
| Core Keeper | | | | No snow biome on the Biomes page | | | | [V, S74] |

**Patterns** [V, sources in the table; I for the grouping].
- **Ground snow is tiles.** Ground items in Tibia, autotiles in RPG Maker, a tilesheet swap in Stardew.
- **Run-time snow is one number per tile at most.** RimWorld keeps a float, Dwarf Fortress a byte, Zomboid one bit from a threshold. Zomboid and Don't Starve Together sync a single global number.
- **Prints belong to the tile just left**, except in Factorio and RimWorld, which place a print per foot.
- **Print lifetimes fall in two groups.** Handhelds use about 1 s. PC games use 5 to 12 s: RimWorld 4.88 s, Tibia 10 s, Factorio 10 s plus a 2.1 s fade.

### 6d. Flake scaling across engines

Every row is computed from code quoted in note 14 [V for the constants; I for the conversions]. Platinum's rates assume 30 fps [U].

| Game | Screen px | Tile px | Tiles shown | Flake px | Flake / tile | Flakes at peak | Per tile | Fall px/s | Fall tiles/s |
|---|---|---|---|---|---|---|---|---|---|
| VFX #1 sandbox | 320x180 | 8 | 900 | 1 and 2x2 | 0.125 to 0.25 | 456 | 0.51 | 14, 24, 42 | 1.75, 3.0, 5.25 |
| Pokémon Emerald | 240x160 | 16 | 150 | 8x8 sprite | 0.5 at most | 16 | 0.107 | 30 to 37 | 1.9 to 2.3 |
| Pokémon Platinum, light | 256x192 | 16 | 192 | sprite, 4 frames | | about 24 | 0.125 | 15 to 30 | 0.9 to 1.9 |
| Pokémon Platinum, heavy | 256x192 | 16 | 192 | sprite, 3 sizes | | about 50 | 0.26 | 60, 120, 180 | 3.75 to 11.25 |
| RPG Maker VX Ace | 544x416 | 32 | 221 | 6x6 | 0.1875 | 90 | 0.41 | 180 | 5.6 |
| RPG Maker MV, MZ | 816x624 | 48 | 221 | 9x9 | 0.1875 | 90 | 0.41 | 176 | 3.7 |
| Stardew debris (winter) | 1280x720 | 64 | 225 | 12 | 0.1875 | 16 to 63 | 0.07 to 0.28 | 30 to 41 | 0.47 to 0.64 |
| OTClient shader | 15x11 tiles | 32 | 165 | texture | | 512x512 texture, 10 repeats | | 8% of height | 0.88 |
| Mindustry | any | 8 units | by zoom | 2.6 to 13 units | 0.33 to 1.6 | area / 1,200 | 0.053 | 60 to 120 units | 7.5 to 15 |
| Cataclysm DDA | any | 1 tile | by view | 1 tile | 1.0 | 1, 2, 4% of tiles | 0.01 to 0.04 | re-rolled at 8 fps | |
| Shattered Pixel Dungeon | | 16 | | | | emitter | | 5 to 8 | 0.31 to 0.5 |

Sources for the table: [S2, S38, S44, S27, S18, S26, S30, S15, S76, S77, S78, S79, S80, S81].

**The rules it supports** [I, note 14].
- **Count follows visible tiles, or is a fixed pool for a fixed view.** No shipped code scales the count with screen pixels.
- **Size follows the tile.** Three engines sit at exactly 0.1875.
- **Peak coverage sits near 1% of screen pixels.** 1.27%, 0.89% and 1.03%.
- **Flakes fade in the air.** RPG Maker respawns a flake when its opacity drops under 40. In a 3/4 view the fade reads as a landing.

Note 14's pick sits between "keep the count" and "follow tiles", with about 600 flakes and 0.77% coverage. The Sandbox went higher, to 1,010 flakes of 1, 2 and 3 px at 0.9 to 0.97% [I, note 14; V, S3].

### 6e. What artists say changes with size

**No artist lesson on snow itself was found.** saint11's index lists 80 tutorials and Slynyrd's catalogue 64 posts, with none on snow, footprints or winter [V, S102, S96]. Lospec's snow tag holds an image and a video we could not read [V, S103]. The rules below are general, and we applied them to snow.

| Topic | What the source says | What it means at 32 px | Source |
|---|---|---|---|
| Tile size | 16x16 is "the most common". Above 32x32 is "overkill for pixel art" | 32 px is the top of the range where cluster rules apply | [V, S92] |
| Clusters | Repeat a few key clusters, keep negative space, use "a few colors" | 3 to 6 marks per snow tile, half the tile flat | [V, S92; I, note 11] |
| Stray pixels | Pixels outside a cluster add noise and "expose the underlying grid" | No snow patch under 2x2 px | [V, S97; I] |
| Thickness | Avoid rendering anything one pixel thick | Caps of 2 px or more, prints of 3x5 px or more | [V, S98; I] |
| Dither | Taper edges with it. If it covers half the sprite, add a colour | Dither only in a 2 to 3 px edge band. Frost colour for thin cover | [V, S97; I] |
| Dither and size | "some sprites are simply too small to dither". It works best in high-resolution, painterly work | Fine between two close shades, wrong as a field | [V, S99] |
| Over-dither test | View at display size. If it looks like TV static, it is too much | Judge the Sandbox at 3x, not at 1x | [V, vendor, S100] |
| Environment | "Avoid dithering on smaller pieces, it just adds noise where you could have detail." | The same verdict from four critics | [V, S101] |
| Ramp | Hue should "logically follow its neighbors in the ramp" | Cyan-green to blue to violet as snow darkens | [V, S97, S105] |
| White | Apollo's brightest colour is `#ebede9` | No pure white in the snow body | [V, S104] |
| Proportions | The head is "a third to half of the total sprite" | Legs of 6 to 10 px, sink cap of 6 px | [V, S94; I, note 11] |
| Animation | "one pixel can make a huge difference" | A 1 px bob on passing frames is enough | [V, S95] |
| Shadows | Cast shadows "should not exceed a tile in length" | One shadow length for every object | [V, S93] |


---

## 7. Combinations: a layered architecture for Asterion Online (Godot 4, web)

All of this section is design proposal [I], built from the cited parts. It has not been tested in Godot. The Snow 32 Sandbox (§8) plays it in JavaScript, and values marked "Sandbox" are the ones it shipped with [S3].

**Layers, bottom to top.**
1. **Server weather and tile snow bands (gameplay truth).** The server owns the weather scalars and one snow band 0 to 3 per 32 px tile. Bands drive walking speed and are all the server stores or sends (A5, A6, A7).
2. **Baked maps at field resolution.** Exposure, which is shelter under eaves and canopies times an upwind reach of 3.5 tiles, and sun shadow. Exposure is rebaked by row sweep only when the wind bucket changes (F3, C2).
3. **Snow field.** Bytes for depth, packed and wet at one cell per 2x2 art pixels, 57,600 cells, ticked by random picks counted per 1,000 cells (A2, A3, A4).
4. **Ground render at art resolution.** For each art pixel, sample the field bilinearly, compare with the art threshold map, shade the snow edge and look up the palette (B1, B2, B3, B5, F1).
5. **Objects and snow caps.** Roof, canopy, rock top and fence top are field classes with their own caps. Their snow is drawn by a shape rule with a lip on the south side (C1, C2).
6. **Characters at 24x32.** Boot prints on contact frames, a trench in deep snow, sinking with a front rim, slowdown from the tile band, a soft shadow, breath and snow on the hat (D1 to D7).
7. **Flakes.** A near layer of z-height flakes with shadow dots and two cheap far layers, sized 1, 2 and 3 px, covering just under 1% of the screen (E1 to E4).
8. **Light and palette.** The world renders to palette indices. Day and night retint the palette once per frame, and lamp pools pick a warm palette through a threshold, as in VFX #1 [S2].

**Which buffers grow with the art, and which stay small.**

| Buffer | Follows | Size for a 640x360 view | Changes |
|---|---|---|---|
| Server snow bands | Tiles | 240 tiles at 2 bits, 60 bytes | On a slow clock |
| Depth, packed, wet | Field cells at 1:2 | 57,600 bytes each | Every tick |
| Exposure, sun shadow | Field cells | 57,600 bytes each, or 14,400 at 1:4 with an art mask | Per wind bucket |
| Art threshold map | The tile art | 16,384 bytes for the Sandbox's 128x128 map | Never |
| Static snow mask | Art pixels | In the tileset's alpha | Never |
| Ground colour | Art pixels | 230,400 fragments on the GPU | Every frame |
| Palette | Colours | 462 entries in the Sandbox | Once per frame |
| Flakes | Tiles and coverage | 1,010 in the Sandbox, 64 bytes each in a MultiMesh | Every frame |

Only two things must grow with the art. The ground colour grows by four and belongs on the GPU. The threshold grows from a 4x4 matrix to a painted map and never changes. Everything simulated, uploaded or sent stays at the VFX #1 size or smaller [V, S4; I, note 12].

**The recommended default is one field at 1:2.** The tick costs 0.067 / 0.42 ms, three full R8 uploads cost 0.060 ms in WebGL2, and boot prints keep two readable rows [V, S4, S3]. The Sandbox also built the split field (A4). Its tick is cheaper and its CPU sampling dearer, so it saves nothing there. I would keep it in reserve.

**What the server sends.**
- **Weather.** Intensity, temperature, wind bucket, sun, time and a seed. The Sandbox counts 8 bytes per weather or wind-bucket change.
- **Snow bands.** 2 bits per tile, 60 bytes for the full set of 240 tiles, and 2 bytes per band change in the Sandbox's count. Its bands switch at a mean depth of 10, 40 and 80 units. On a real server the cheapest source is Zomboid's rule, one synced level against fixed per-tile noise (A6).
- **Nothing for prints.** Each client turns the same move message into the same boot stamps (D5). For shared, persistent prints add Tibia's per-tile flag with a 10 s decay (D2).

The per-pixel field stays local and cosmetic. Each client seeds it from the bands and never reports it back [I, note 16].

**Pseudocode.** GDScript-like and Godot-shader-like. Engine API names come from the notes and should be checked against the target Godot version.

The ground shader (layers 4 and 8). The linear filter does the bilinear sample in one fetch:
```glsl
shader_type canvas_item;
uniform sampler2D field   : filter_linear;                   // RG8. R = depth / 255, G = packed / 255. 1 texel = 2 art px
uniform sampler2D thresh  : filter_nearest, repeat_enable;   // the 128x128 art threshold map, R = rank / 255 (about 4 to 55)
uniform sampler2D palette : filter_nearest;                  // rows: plain, sun shadow, wet, wet shadow, frost, frost shadow
uniform vec2  field_origin_px;                               // world position of field texel (0, 0)
uniform vec2  field_size_px;                                 // world size the field covers = cells * 2
uniform float frost_at = 4.0;                                // depth units at which bare ground turns frosty
uniform float deep_edge = 14.0;                              // units over the threshold at which the south line is 2 px
const int SN_RIM = 9; const int SN_BODY = 10; const int SN_EDGE = 11;
const int PK_CHANNEL = 12; const int PK_FLOOR = 13; const int PK_DARK = 14;   // trench floor, print floor, print wall line
const int ROW_FROST = 4;
varying vec2 wpos;

void vertex() { wpos = (MODEL_MATRIX * vec4(VERTEX, 0.0, 1.0)).xy; }

vec2  field_at(vec2 p) { return texture(field, (p - field_origin_px) / field_size_px).rg * 255.0; }
float mask_at(vec2 p)  { return texture(TEXTURE, UV + (p - floor(wpos) - 0.5) * TEXTURE_PIXEL_SIZE).a; }   // the static snow mask of the art (C2)
float cover_at(vec2 p) { vec2 f = field_at(p) * mask_at(p); return f.r + 0.5 * f.g; }   // depth + packed / 2, as the Sandbox tests it
float rank_at(vec2 p)  { return texture(thresh, p / 128.0).r * 255.0; }
bool  snow_at(vec2 p)  { return cover_at(p) > rank_at(p); }

void fragment() {
    vec2 p = floor(wpos) + 0.5;                    // centre of this art pixel, in world px
    vec4 art = texture(TEXTURE, UV);               // R = palette index of the summer art, A = 1 where snow can sit
    int idx = int(art.r * 255.0 + 0.5);
    int row = 0;
    vec2 f = field_at(p) * art.a;                  // the static mask keeps roof depth off the ground (C2)
    float c = f.r + 0.5 * f.g;
    float r = rank_at(p);
    if (c > r) {
        bool lit   = !snow_at(p + vec2(0.0, -1.0)) || !snow_at(p + vec2(-1.0, 0.0));   // bare to the north or west
        bool shade = !snow_at(p + vec2(0.0,  1.0)) || !snow_at(p + vec2( 1.0, 0.0));   // bare to the south or east
        if (c > r + deep_edge && !snow_at(p + vec2(0.0, 2.0))) shade = true;           // deep snow: a 2 px south line
        idx = SN_BODY;                             // one body colour
        if (lit)   idx = SN_RIM;
        if (shade) idx = SN_EDGE;                  // the shadow line wins where both are true
        if (f.g > 84.0) {                          // packed. Over 200 is a fresh print, 84 to 200 a trench or an old print
            bool wall = field_at(p + vec2(0.0, -1.0)).g <= 84.0 || field_at(p + vec2(-1.0, 0.0)).g <= 84.0;
            if (f.g > 200.0) idx = wall ? PK_DARK : PK_FLOOR;      // a print is a hole: dark line under the north and west wall
            else             idx = wall ? PK_FLOOR : PK_CHANNEL;   // a trench has a lighter floor and a shadow under that wall
        }
    } else if (f.r >= frost_at) {
        row = ROW_FROST;                           // thinnest cover: frost-tinted ground, no speckle (B2)
    }
    COLOR = texelFetch(palette, ivec2(idx, row), 0);
}
```
A texel centre sits at art pixel `2i + 1`, so the filter gives the 9/16, 3/16, 3/16, 1/16 weights. This version makes 19 reads on open snow and 21 inside a print, against 11 in the bench's full shader [V, S4]. Each of the five neighbour tests needs the field, the threshold and the mask, and the print wall needs two more field reads. A neighbour without the mask would draw no rim or shadow line where ground snow meets a wall. Bake the mask into the field at upload time to get back to 14 and 16. Scale only the edge-dither term of the map by `2 / ratio`, as the Sandbox does. The drift lines, arcs and sparkles of §8 are left out.

Boot stamps and the trench switch for tile-to-tile movement (layer 6):
```gdscript
const TILE := 32
const RATIO := 2                        # art px per field cell

func on_step_start(a: Actor) -> void:   # the server said: walk from a.from_px one tile in direction a.dir
    a.feet_done = 0; a.brush_done = 0

func on_step_end(a: Actor) -> void:     # flush: p rarely lands on exactly 1.0 inside a frame
    walk_fx(a, 1.0, 0.0)

# called every frame while a walks. p = progress through this step, 0..1, from the step timer
func walk_fx(a: Actor, p: float, delta: float) -> void:
    a.frame = mini(int(p * 4.0), 3)                      # 0 left step, 1 pass, 2 right step, 3 pass. 8 px per frame
    var d := Vector2(a.dir)                              # unit step, screen y grows downward
    var side := Vector2(d.y, -d.x)                       # the walker's left: west when walking north
    var feet_due := 2 if p >= 0.5 else 1                 # left boot at p = 0, right boot at p = 0.5, 16 px apart
    var brush_due := int(p * TILE / 2.0)                 # one brush stamp per 2 px of travel, 16 per tile
    if sink_px(a, delta) >= 4:                           # the boots are hidden: plough a trench
        while a.brush_done < brush_due:
            stamp_trench(a.from_px + d * (a.brush_done * 2.0), side, a.depth_s)
            a.brush_done += 1
        a.feet_done = feet_due                           # no stale boots when the snow gets shallow again
        return
    a.brush_done = brush_due
    while a.feet_done < feet_due:
        var k := a.feet_done                             # 0 = left, 1 = right
        var sgn := 1.0 if k == 0 else -1.0
        stamp_boot(a.from_px + d * (k * 16.0 + 4.0) + side * (3.0 * sgn), d)   # rows 6 px apart, 4 and 20 px into the step
        a.feet_done += 1

func stamp_boot(at: Vector2, d: Vector2) -> void:
    var size := Vector2(4, 6) if d.x == 0.0 else Vector2(6, 4)       # art px. 2x3 whole cells at 1:2
    var spill := 0
    for c in cells_under(snap_to_cells(at), size):
        var keep := int(depth[c] * 0.30)
        spill += depth[c] - keep; depth[c] = keep; packed[c] = 255
    var ring := cells_around(snap_to_cells(at), size)                # the even ring of cells that touch the print
    var per := spill / ring.size()                                   # whole units. The remainder is pressed away
    for j in ring:
        depth[j] = mini(200, depth[j] + per)
    field_dirty = true

func stamp_trench(at: Vector2, side: Vector2, ambient: float) -> void:
    var floor_d := int(ambient * 0.40)                               # the trench floor is 40% of the depth around it
    var spill := 0
    for c in cells_in_disc(at, 5.0):                                 # a round brush, 10 px across
        if depth[c] > floor_d:
            spill += depth[c] - floor_d; depth[c] = floor_d
        packed[c] = maxi(packed[c], 160)                             # 160, not 255: a trench floor, not a print hole
    var per := maxi(1, spill / 10)                                   # one stamp can spill hundreds of units
    for k in 10:                                                     # so spread it over 10 deposits, 5 on each wall
        var sgn := 1.0 if k % 2 == 0 else -1.0
        var out := 7.0 + float((k / 2) % 4) * RATIO                  # 7 to 13 px out from the centre line
        var j := cell_at(at + side * (out * sgn))
        if packed[j] < 200:
            var add := mini(per, mini(spill, 200 - depth[j]))
            depth[j] += add; spill -= add                            # what does not fit is pressed away
    field_dirty = true

func fade_packed(intensity: float) -> void:                          # once per sim tick
    fade_acc += 0.22 * intensity                                     # 0.22 units per tick in heavy snow
    if fade_acc < 1.0: return
    var f := int(fade_acc); fade_acc -= f                            # one accumulator for the whole field
    for c in packed.size():
        if packed[c] > 0: packed[c] = maxi(0, packed[c] - f)         # every cell loses the same whole amount
```
The walk frame and the prints both come from `p`, so they cannot drift apart. Two details came from running this code step by step against the Sandbox. The sink must read the snow beside the walker and skip trodden cells. If it reads the cells under the feet, the trench lowers them, the sink drops below 4 px and the walker flips between boots and trench every few pixels. And a trench stamp spills 300 to 960 units, so the spill must spread over several cells or the 200 cap throws most of it away [V, S3]. The 4x6 px boot, the 6 px row spacing, the round brush and the even fade are the Sandbox's values. The fade keeps one accumulator and takes the same whole amount from every cell, as the Sandbox does. A random decrement per cell would let the cells of one print cross the draw threshold at different times, and the print would crumble [V, S3]. RimWorld draws prints only at depth 0.4 or more [V, S53]. A similar gate in `stamp_boot` would keep a dusting clean.

The sink clip (layer 6). The script picks the depth, the sprite shader hides the rows:
```gdscript
const SINK_CAP := 6                     # px. 0 = off, 6 = weather snow, 12 = authored deep snow
const FULL_AT := 120.0                  # depth units at which the cap is reached, as in the Sandbox

func sink_px(a: Actor, delta: float) -> int:
    var sum := 0.0; var n := 0                                       # the snow beside the walker, not the trench under it
    for off in [Vector2(-9, -1), Vector2(9, -1), Vector2(-6, 3), Vector2(6, 3)]:   # 4 points, as the Sandbox samples
        var c := cell_at(a.feet_px + off)
        if packed[c] < 110:                                          # skip cells that are already trodden
            sum += depth[c]; n += 1
    var d := sum / n if n > 0 else a.depth_s
    a.depth_s = lerpf(a.depth_s, d, minf(1.0, delta / 0.1))          # about 100 ms of smoothing, no 1 px flicker
    var px := int(a.depth_s * SINK_CAP / FULL_AT)                    # cap 6: 2 px per 40 units
    a.sink = mini(px - px % 2, SINK_CAP)                             # 2 px steps
    return a.sink                                                    # the caller sets the instance uniform sink_px
```
```glsl
shader_type canvas_item;                 // character sprite, frame 32 px tall
instance uniform float sink_px = 0.0;    // 2D instance uniforms need Godot 4.4 or later
uniform float frame_h = 32.0;
uniform float foot_pad = 1.0;            // empty rows under the boots in the frame. The Sandbox's boots end on row 30 of 0..31
void vertex() { VERTEX.y += sink_px; }   // lower the whole sprite
void fragment() {
    float rows_up = (1.0 - UV.y) * frame_h - foot_pad;   // 0 at the boot soles. With an atlas, measure from the region's bottom edge
    if (rows_up < sink_px) discard;                  // hide the rows that fell below the foot line
    COLOR = texture(TEXTURE, UV);
}
```
The visible sprite still ends on the old foot line, and the head is `sink_px` lower. Draw the snow rim, 3 rows tall in the Sandbox, on that line after the character.

The row-sweep exposure bake (layer 2). It gives the same map as VFX #1's ray per cell [V, S4]:
```gdscript
# wind blows along x. wind > 0 means toward +x. Rebake only when the wind bucket changes
func bake_exposure(wind: float) -> void:
    var step := 1 if wind >= 0.0 else -1                 # walk each row downwind
    var ray := int(3.5 * TILE / RATIO)                   # 3.5 tiles in cells: 56 at 1:2
    var lee_min := 0.25 * TILE / RATIO                   # VFX #1's "+ 2 px" at 8 px tiles, in cells
    var windy := absf(wind) > 0.15                       # calm air casts no lee, as in the Sandbox
    for y in FH:
        var h := 0.0                                     # height of the last obstacle passed, in cells
        var dist := ray + 1                              # cells since that obstacle. Starts out of range
        var x := 0 if step > 0 else FW - 1
        for n in FW:
            var i := y * FW + x
            dist += 1
            if holds_snow[i]:                            # ground, roofs, canopies, rock and fence tops
                var e := base_expo[i]                    # per surface class
                if is_ground[i]:
                    e *= shelter[i]                      # eaves and canopies shelter the ground only
                    if windy and dist <= ray:
                        var lee := 1.1 * h * absf(wind) + lee_min
                        if dist < lee:          e *= 0.15 + 0.85 * pow(dist / lee, 2.0)
                        elif dist < 1.8 * lee:  e *= 1.12    # the 12% drift band past the lee
                expo[i] = minf(e, 1.3)
            if obstacle_h[i] > 0.0:                      # after the write, so a roof gets its own exposure
                h = obstacle_h[i]; dist = 0
            x += step
```
Sweeping downwind means the last obstacle passed is the nearest one upwind of the current cell, which is what the ray looked for. Every cell that holds snow gets its exposure before the sweep records it as an obstacle, so roofs and canopies are written too. The lee formula is VFX #1's, with lengths converted to cells [V, S2; I].

**Godot mapping.**
- **Viewport** [V, S123, S122]. Stretch mode `viewport` at 640x360 with `integer` scale mode. The ground shader then runs on 230,400 fragments at any window size (F4).
- **Field** [V, S126; I, note 12]. A `PackedByteArray` copied into an `Image.FORMAT_RG8` image for depth and packed, 115,200 bytes at 1:2, and an R8 image for wet. Each `ImageTexture.update()` sends the whole image. Skip it on ticks where nothing changed enough to show, as RimWorld's 0.15 redraw rule does [V, S49].
- **Scrolling** [I, note 12]. Anchor the field in world space with `repeat_enable`, address it as a ring and snap it to whole cells. Camera scroll then moves `field_origin_px` and uploads nothing.
- **Bands in the shader** [V, S134; I, note 12]. A data texture at 1 texel per tile, 240 bytes per view, sampled by world position.
- **Flakes** [V, S135; I, note 14]. The far layers as hashed flakes inside the ground shader. The near layer as a CPU list in one `MultiMesh`, 64 bytes per flake.
- **Characters** [V, S133]. One sprite shader with the `sink_px` instance uniform, which needs Godot 4.4.

**What to avoid.**
- `canvas_items` stretch for the ground pass. It is 9 times the fragments at 1080p [I, note 12].
- Planning around dirty-chunk uploads. A single texture cannot be patched on Compatibility [V, S126].
- `DrawableTexture2D` for a one-byte field. It has no single-channel format, so it costs 4 bytes per cell [V, S130; I, note 17].
- Engine particle collision for landing (§12).

---

## 8. Reference implementation: the Snow 32 Sandbox

The Sandbox [S3] is one hand-written page with a native 640x360 canvas, shown at 2x from a viewport of about 1,340 px. It plays the eight layers of §7 in plain JavaScript and ports the engine of the VFX #1 sandbox [S2]. This section describes the page as built.

**The world.** A winter village corner on 32x32 px tiles, 20 wide by 11.25 tall, with a log house, pines, a fence, rocks, a lamp post, a path, a frozen pond and a well. All art is drawn in code with 1 px dark outlines and clusters in place of stray pixels.

**Actors.** A player, a villager and a crowd of 0 to 20 others in 24x32 px frames, drawn about 20 px wide and 30 px tall. A fox of 20x12 px. The walk has 4 frames of 8 px each, 400 ms per tile, with steps on frames 0 and 2. A "tile steps" toggle makes every actor walk tile to tile.

**Field and tick.** Three bytes per cell for depth, packed and wet. The field runs at 1:1, 1:2 (the default), 1:4 or split. Picks per 1,000 cells per tick are 15.6 deposit, 69.4 relax, 24.3 wind creep, 26 melt and 27.8 evaporation. In heavy snow that measured 25,259, 5,753 and 1,366 picks per tick at 1:1, 1:2 and 1:4. Packed snow fades evenly, 0.22 units per tick, so a print turns light after 4 s and is gone after 13 s. The VFX #1 rule, 14 packed units removed per snowflake hit, was dropped because it left rubble at this scale.

**Ground render.** Bilinear sampling by default, with fixed 9/3/3/1 weights at 1:2. Border pixels between surface classes, 3% of ground pixels at 1:2 and 6.5% at 1:4, read a class-aware weight table so roof and canopy snow never bleeds onto the ground. The threshold styles are Bayer 4 plus noise, Bayer 8 and the art map. The art map is one 128x128 px tileable map, not a single 32x32 tile, so its period does not show. It has about 6 seed blobs per 32 px tile, is stored in 2x2 px blocks and ranges from about 4 to 55 units. The coverage test is depth plus half of packed. Bare ground takes a frost tint from depth 4.

**Shading.** A 1 px highlight rim on north and west edges and a shadow line on south and east edges, 2 px on the south once the snow is 14 units over its threshold. One body colour, with 1 or 2 short drift lines per tile from depth 34 and 1 px sparkles in sun. The snow ramp is `#f2f1ec`, `#cbd3dc` for the body, `#9eabb8`, `#7d7a96` and `#5a5674`.

**Objects.** 23,877 cap pixels, 10% of the screen, are tested per frame. The roof fills from the ridge in scallops and ends in a lip 2 rows over the eave with a 3 px thickness band. Pine caps follow each tier's visible top, up to about 60% of the tier.

**Characters.** A boot print is 4x6 px, 6x4 px sideways, which is 2x3 whole cells at 1:2. Left and right rows are 6 px apart, with one print every 16 px of travel. Note 13 recommended 3x5 px. The Sandbox enlarged it because 3x5 did not read at 1x. A stamp keeps 30% of the depth and spills the rest to an even ring. Sink runs in 2 px steps to a cap of 0, 6 or 12 px, reached at 120 units. From 4 px of sink a round brush of radius 5 px stamps a trench every 2 px of travel, with a floor at 40% of the ambient depth. A 3-row snow rim sits in front of the legs. A 1 px line of snow appears on hat and shoulders at 0.3 of a 9 s idle timer, and a second row on both at 0.65. The trench marks its cells packed 160, and a boot print 255. Breath shows below 1 °C. The other footprint modes are 2x2 dots and a Tibia tile swap, a drawn overlay for 10 s with no field change.

**Flakes.** Far 560 at 1 px, mid 300 at 2 px and near 150 at 3 px, with 10% of the near ones at 4 px. That is 1,010 alive and about 2,100 to 2,200 px, 0.9 to 0.97% of the screen. They fall 26, 42 and 64 px/s. The near layer has height and a shadow dot, and deposits 2 units on landing. The "1 px" mode covers 0.39%.

**Light and palette.** 77 base colours in 6 versions (plain, sun shadow, wet, wet shadow, frost, frost shadow) make 462 entries, plus 2 warm palettes for the lamp and window pools.

**Controls and HUD.** Weather, wind, speed 1 to 16x, shovel and add-snow tools, a crowd slider of 0 to 20 and a tile-steps toggle. The scale controls are field mode, sampling, threshold style, shading, flake size, footprint mode and sink cap. Nine views show the picture, depth, exposure, sun shadow, packed, wet, the tile bands, the field grid and a cost view. Three demo buttons set the showcase frame, the VFX #1 settings and the 32 px defaults [V, S3].

The HUD has five lines, read from the running page [V, S3]:
- **State.** Clock, weather, temperature, wind, the field mode with its cell and byte counts, and the current scale settings.
- **Layers.** Smoothed ms for the sim, the ground render split into sample and shade, objects and caps, characters and prints, flakes, and palette and light.
- **Total.** The frame total against a 16.7 ms bar, picks per tick, and the bytes a Godot upload would move per tick. It prints the full field size, the 921,600 bytes of a 640x360 RGBA8 field for comparison, and what a sub-rectangle update of dirty 32 px chunks would move if Godot had one.
- **Counters.** Prints per second, flakes alive with their pixel count and share of the screen, tile-band changes at 2 bytes each with the 60-byte full set, weather messages at 8 bytes each, the last exposure bake in ms, the sampling-table rebuild time and the cap pixel count.
- **You.** The player's tile band and speed, the depth under the feet, the sink in px and whether the player is stamping prints or ploughing a trench.

**Sandbox timings.** These are the Sandbox's own numbers, from a tight loop of 300 frames through `snow32.bench(300)` on an Apple M4 Pro in headless Chromium, in heavy snow at 1x speed with a crowd of 3 [V, S3]. They are separate from the controlled benchmark of §6a [S4]. Every row except "1:2 bilinear" was measured before the final polish pass.

| Field mode (Sandbox loop, ms per frame) | Sim | Ground (sample + shade) | Objects | Characters | Flakes | Palette | Total |
|---|---|---|---|---|---|---|---|
| 1:1 | 0.55 | 1.21 (0.46 + 0.78) | 0.15 | 0.04 | 0.06 | 0.12 | 2.13 |
| 1:2 bilinear (default) | 0.11 | 1.50 (0.70 + 0.82) | 0.18 | 0.05 | 0.05 | 0.11 | 2.01 |
| 1:2 nearest | 0.11 | 1.29 (0.53 + 0.76) | 0.13 | 0.04 | 0.06 | 0.10 | 1.73 |
| 1:4 bilinear | 0.03 | 1.70 (0.95 + 0.77) | 0.19 | 0.03 | 0.05 | 0.11 | 2.11 |
| 1:4 nearest | 0.03 | 1.24 (0.48 + 0.76) | 0.13 | 0.04 | 0.05 | 0.11 | 1.59 |
| Split | 0.04 | 1.83 (1.07 + 0.76) | 0.19 | 0.04 | 0.06 | 0.11 | 2.27 |

The benchmark measured 1.36 to 1.44 ms for its 1:2 preset and 2.4 to 2.5 ms for the naive 1:1 port. The Sandbox at 1:2 takes 2.01 ms, and it draws more than the bench preset, with shaped caps, drift lines and 1,010 flakes [I]. Its 1:1 mode is not the naive port. It uses the new renderer with nearest sampling, which is why it lands at 2.13 ms. On the CPU, bilinear sampling costs most of what the smaller tick saves. Through `requestAnimationFrame` the page HUD reads higher and swings between 2.5 and 4.4 ms. The builder suspects frame scheduling and did not prove it.

The row-sweep exposure bake takes 1.7 ms at 1:1, 0.4 ms at 1:2 and 0.1 ms at 1:4 in the Sandbox. Before the sweep it took 20 to 27 ms at 1:1 [V, S3].

**What it demonstrates.**
- At 1:4 with nearest sampling the snow edge turns into 4 px blocks, and bilinear sampling removes them (A3).
- Bayer 4 reads as static. The art map grows snow in clusters (B1, B2).
- At 1:4 the two boot rows do not join into a trench, as note 12 had inferred. One row keeps blunt marks and the other shrinks to slivers, because stamps are area-weighted (A4).
- The 1:1 field multiplies the tick by 5 and the picture barely changes (A2).

**Simplifications and weak spots (honest list)** [V, S3; I].
- It is JavaScript on one thread with a CPU render. It says nothing about Godot's upload, shader or node costs.
- There is no camera scroll, so the world lock and the ring-addressed field are not shown.
- The mask blend (B3) and the dual-grid overlay (A5) are not built. Nor are a cart, sparkle clusters or collision between actors.
- Where a walker switches from prints to trench, the snow shows a short churned patch. A fading trench shows highlight crumbs for a second or two.
- At half size the thumbnail's trail reads as one dotted line.

---

## 9. Gem findings

Stars and push dates were read through the GitHub API on 12 Nov 2026 [V, notes 12, 13, 14, 17]. Each licence cell says how the licence was learned. Decompilations of commercial games are for reading only. Licences were read from LICENSE files on 2026-11-12. **Flags:** **Low** = MIT/BSD/Apache/CC0; **LGPL** = fine as a separate library; **Copyleft** = GPL/AGPL/CC BY-SA, study and re-implement; **None** = no licence, study only.

| Name | URL | Licence | Maturity | Good for | Flag |
|---|---|---|---|---|---|
| TileMapDual | https://github.com/pablogila/TileMapDual | MIT (LICENSE read) | 1,313 stars, last push 3 Sep 2026. No release builds, pin to tag v5.0.3 | A dual-grid `TileMapLayer`, 15 tiles per terrain, for the snow-band overlay | Low |
| dual-grid-tilemap-system-godot (jess-hammer) | https://github.com/jess-hammer/dual-grid-tilemap-system-godot | MIT (LICENSE read) | 628 stars, last push 9 Feb 2026, Godot 4.4.1 Mono, C# | A small readable reference for the 16 rules | Low |
| Dual-grid GDScript port | https://github.com/GlitchedinOrbit/dual-grid-tilemap-system-godot-gdscript | Not read | Linked from the TileMapDual README | A GDScript reference for the 16 rules | None (licence not read) |
| godot-wang-converter | https://github.com/kleingeist37/godot-wang-converter | Not read | Linked from the TileMapDual README | Builds the 15-tile set from 6 drawn tiles | None (licence not read) |
| Free blue noise textures (Christoph Peters) | https://momentsingraphics.de/BlueNoise.html | CC0 1.0, stated on the page | Published 22 Dec 2016, tileable, 16² to 1024² | A base to paint a 32x32 threshold tile over | Low |
| raylib `textures_fog_of_war.c` | https://github.com/raysan5/raylib/blob/master/examples/textures/textures_fog_of_war.c | zlib from memory, LICENSE not opened | An official raylib example | 150 lines: 1 texel per 32 px tile with a bilinear upscale | Low (open the LICENSE first) |
| RPG Maker MV corescript | https://github.com/rpgtkoolmv/corescript | MIT (LICENSE read) | 326 stars, last push Aug 2021, ships inside every MV game | `Weather.js`, a 200-line world-locked snow layer, and the 48-entry autotile table | Low |
| OTClient (edubart) | https://github.com/edubart/otclient | MIT per note 10. The GitHub API reports NOASSERTION | 709 stars | A 15x11 view of 32 px tiles and the walk animation timing | Low (check the LICENSE file) |
| OTClient (mehah) `snow.frag` | https://github.com/mehah/otclient/blob/main/modules/game_shaders/shaders/fragment/snow.frag | MIT (LICENSE read) | 541 stars, pushed 9 Nov 2026 | A 20-line scrolling snow overlay tied to the walk offset | Low |
| The Forgotten Server | https://github.com/otland/forgottenserver | GPL-2.0 | 1,844 stars, pushed Nov 2026 | `snow.lua`, the whole footprint system in 14 lines, and the step time formula | Copyleft |
| Canary | https://github.com/opentibiabr/canary | GPL-2.0 | 668 stars, pushed Nov 2026 | The same footprint rule with current client ids | Copyleft |
| roBrowser Legacy | https://github.com/MrAntares/roBrowserLegacy | GPL-3.0 | Stars not collected | `SnowWeather.js`, Ragnarok's snow emitter constants | Copyleft |
| Mindustry | https://github.com/Anuken/Mindustry | GPL-3.0 (GitHub API) | 29,779 stars, pushed 4 Nov 2026 | The stateless seed-0 flake loop in `Weather.drawParticles` | Copyleft |
| Shattered Pixel Dungeon | https://github.com/00-Evan/shattered-pixel-dungeon | GPL-3.0 (GitHub API) | 6,789 stars, pushed 10 Nov 2026 | `SnowParticle`, a flake that ends on its target | Copyleft |
| ioquake3 | https://github.com/ioquake/ioq3 | GPL-2.0 | 2,870 stars, pushed Nov 2026 | `cg_marks.c`, a small mark pool with a time fade | Copyleft |
| Universal LPC Spritesheet Character Generator | https://github.com/LiberatedPixelCup/Universal-LPC-Spritesheet-Character-Generator | Code GPL-3.0. Art per asset is CC0, CC-BY, CC-BY-SA, OGA-BY or GPL, and credits are required | 2,006 stars, pushed 11 Nov 2026 | 64x64-frame test characters with a 9-column walk | Copyleft |
| pret/pokeemerald | https://github.com/pret/pokeemerald | No licence file | 3,686 stars, pushed Oct 2026 | Exact rules for prints, grass clipping, the sand pile and shadows | None (study only) |
| pret/pokeplatinum | https://github.com/pret/pokeplatinum | No licence file | 609 stars, pushed Nov 2026 | Deep-snow tiers, track pieces, whole-pixel flake sway | None (study only) |
| Stardew Valley 1.5.4 decompilation | https://github.com/veywrn/StardewValley | Decompiled proprietary code | Game version 1.5.4 | The tiled snow overlay and `WeatherDebris` | None (read only) |
| RW-Decompiled-1.6 | https://github.com/32bitx64bit/RW-Decompiled-1.6 | Decompiled commercial code | RimWorld 1.6 | `SnowGrid`, `SectionLayer_Snow`, footprints and breath in about 500 lines | None (read only) |
| PZ-Javacode | https://github.com/Ketum-Git/PZ-Javacode | Decompiled commercial code | Build 41.78 | A noise threshold with a 44-piece autotile and a cross-fade | None (read only) |
| Don't Starve Together scripts mirror | https://github.com/taichunmin/dont-starve-together-game-scripts | Klei's shipped Lua, a mirror | Shipped game scripts | `weather.lua`, `frostybreather.lua`, `snow.lua` | None (read only) |
| factorio-data | https://github.com/wube/factorio-data | Published by Wube, licence not read | Factorio 2.0 data | Footprint decal sizes, contact frames, lifetimes | None (licence not read) |
| Rain and Snow with Parallax shader | https://godotshaders.com/shader/rain-and-snow-with-parallax-scrolling-effect/ | MIT, stated on the page | Listed in VFX #1 | A two-layer canvas shader for the far flakes | Low |
| Multilayer Snowfall shader | https://godotshaders.com/shader/multilayer-snowfall-shader/ | CC0, stated on the page | Default of 40 layers | Cut it to 3 layers for web | Low (VFX #1 flagged its Shadertoy ancestry) |
| Very Basic 32x32 Topdown Snow Tileset | https://opengameart.org/content/very-basic-32x32-topdown-snow-tileset | CC0 (page read) | Posted 5 Jul 2019 | An open 32 px snow set for tests | Low |
| Apollo palette | https://lospec.com/palette-list/apollo | Site terms not read | 46 colours, by AdamCYounis | A cool neutral snow ramp with no pure white | None (terms not read) |
| Resurrect 64 palette | https://lospec.com/palette-list/resurrect-64 | Site terms not read | 64 colours, by Kerrie Lake | A snow ramp that turns violet in shadow | None (terms not read) |
| Mana Seed Character Base | https://seliel-the-shaper.itch.io/character-base | Proprietary, no redistribution | A paid pack with a free demo | A reference for characters about 32 px tall with a 6-frame walk | None (study only) |
| Mana Seed Winter Forest | https://seliel-the-shaper.itch.io/winter-forest | Mana Seed User License, not read | A paid pack with a free 61 kB sample | Snow-covered object states at 16 px | None (study only) |
| Pixel-perfect resolution calculator | https://ziva.sh/tools/pixel-perfect-resolution-calculator | A web page, licence unknown | Covers Godot 4.2 to 4.7 settings | Scale factors and project settings for a base resolution | None (a tool page, nothing to ship) |
| saint11 tutorial index | https://saint11.art/blog/pixel-art-tutorials/ | Free to view, licence not stated | 80 tutorials | Ice, Sand, TopDownTricks and Top-Down-Houses for the artist to view | None (view only) |

**Top picks for Kingsfoil** [I]. Port RPG Maker MV's `Weather.js` ideas freely, since MIT allows it. Use TileMapDual at tag v5.0.3 for the band overlay. Start the threshold tile from Peters' blue noise. Read the Tibia server, Mindustry and Shattered Pixel Dungeon for design and write fresh code, because all three are GPL. Read the decompilations for numbers and copy nothing.

---

## 10. Learnings and anti-patterns

**Learnings** [I unless cited]
1. **Decide what follows the tile, what follows the character and what follows nothing.** Rays, strides and flakes follow the tile. Prints, rims and sink follow the sprite's legs (§6b).
2. **The art must grow, the data need not.** A coarse field with bilinear sampling and a painted threshold measured the same edge as a 1:1 field [V, S5].
3. **Shipped tile games store snow per tile or per map.** The per-pixel field is our own cosmetic layer on top of that [V, S48, S60, S62].
4. **A threshold is art.** At 32 px the artist has to paint the order of cover [V, S97; I, note 11].
5. **Count flakes by tiles and check coverage.** About 1% of screen pixels at the peak [I, note 14].
6. **Derive prints from tile progress.** One walk cycle per tile keeps the sprite, the snow and every client in step [I, note 13].
7. **In Godot, the field size is the upload size** [V, S126].
8. **A rule tuned at 8 px can fail at 32 px.** The Sandbox dropped VFX #1's trail refill, 14 packed units per snowflake hit, because it left rubble at this scale [V, S3].

**Attribution traps we hit**
- **"No shipped game stamps prints per foot."** Note 13 said so. Note 16 then found Factorio, which stamps on named run frames [V, S68].
- **RimWorld's snow rates.** The wiki swaps hard and gentle. The XML has hard 1.2 and gentle 0.8 [V, S57].
- **Platinum's "four sink depths".** VFX #1 took that from Bulbapedia. The code has 3 sink offsets [V, S40].

**Anti-patterns**
- **The naive 1:1 port.** 87 to 93% of the throttled frame, and a 99.7 ms bake when the wind turns [V, S4].
- **Bayer dusting at 32 px.** 64 isolated pixels per tile at level 1/16 [I, note 11].
- **Nearest sampling of a coarse field.** 100% of the boundary lands on cell rows [V, S5].
- **Per-chunk partial uploads in Godot.** The Compatibility renderer has no rectangle update, and eight chunks cost more than one full upload even in WebGL [V, S126, S4].
- **Flake count scaled by pixels.** 1,824 flakes of 1 px read as noise next to 24x32 characters, at 4 times the CPU [I, note 14].
- **Flakes at 3.7 tiles per second.** RPG Maker MV's speed reads as sleet [I, note 14].
- **Sinking a chibi sprite 8 px.** The legs are 6 to 10 px [I, note 11].
- **Flakes as quads with no GPU.** About 13 µs each on software GL [V, S4].

---

## 11. "See it in action" index

| # | Game | Idea | URL |
|---|---|---|---|
| 1 | Tibia | A snow tile swaps to a footprint twin for 10 s | https://github.com/otland/forgottenserver/blob/master/data/movements/scripts/snow.lua |
| 2 | Tibia | Hand-drawn snow ground and tile speeds (fan wiki) | https://tibia.fandom.com/wiki/Tiles |
| 3 | Tibia (OTClient) | A scrolling snow texture in a fragment shader | https://github.com/mehah/otclient/blob/main/modules/game_shaders/shaders/fragment/snow.frag |
| 4 | RPG Maker MV | 9 px flakes, at most 90, fading in mid-air | https://github.com/rpgtkoolmv/corescript/blob/master/js/rpg_core/Weather.js |
| 5 | RPG Maker VX Ace | A 6x6 two-tone flake on 32 px tiles | https://github.com/RMEx/buildozer/blob/master/Sample_project_1/Scripts/Sprites/Spriteset_Weather.rb |
| 6 | Stardew Valley | One animated snow cell tiled over the screen | https://stardewvalleywiki.com/Winter |
| 7 | Pokémon Platinum | Three deep-snow tiers that sink and slow | https://bulbapedia.bulbagarden.net/wiki/Sinnoh_Route_217 |
| 8 | Pokémon Platinum | Whole-pixel flake sway and three size classes | https://github.com/pret/pokeplatinum/blob/main/src/overlay005/ov5_021D5EB8.c |
| 9 | Pokémon Emerald | A print on the tile just left (sand, Route 111) | https://bulbapedia.bulbagarden.net/wiki/Hoenn_Route_111 |
| 10 | Pokémon HeartGold | One snow tile type, no deep tiers | https://bulbapedia.bulbagarden.net/wiki/Snow_tile |
| 11 | Pokémon Black and White | Winter snow opens new paths | https://www.serebii.net/blackwhite/seasons.shtml |
| 12 | RimWorld | One depth per cell, a smooth mesh, prints and breath | https://rimworldwiki.com/wiki/Snow |
| 13 | Dwarf Fortress | One byte of snow per tile | https://dwarffortresswiki.org/index.php/Weather |
| 14 | Project Zomboid | One global level against a fixed noise grid | https://pzwiki.net/wiki/Weather |
| 15 | Don't Starve Together | One synced snow level and a snow layer on objects | https://dontstarve.wiki.gg/wiki/Winter |
| 16 | Factorio | Footprints on run frames, frozen Aquilo tiles | https://wiki.factorio.com/Aquilo |
| 17 | Noita | Snow as a per-pixel falling-sand material | https://noita.wiki.gg/wiki/Snow |
| 18 | Terraria | A blizzard in the snow biome, and a squint | https://terraria.wiki.gg/wiki/Rain |
| 19 | Rain World | Snowfall that grows into a blizzard | https://rainworld.miraheze.org/wiki/Rain |
| 20 | CrossCode | Bergen Trail snow weather presets | https://www.moddb.com/news/devlog-70-milestone-030-quest-menu-story-and-bergen-trail |
| 21 | Ragnarok Online | Snow emitter constants, through roBrowser | https://github.com/MrAntares/roBrowserLegacy/blob/master/src/Renderer/Effects/SnowWeather.js |
| 22 | Mindustry | Stateless flakes from a seed and the clock | https://github.com/Anuken/Mindustry/blob/master/core/src/mindustry/type/Weather.java |
| 23 | Cataclysm DDA | Flakes on 1, 2 or 4% of visible tiles | https://github.com/CleverRaven/Cataclysm-DDA/blob/master/data/json/weather_type.json |
| 24 | Shattered Pixel Dungeon | A flake that starts above its target and ends on it | https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/effects/particles/SnowParticle.java |
| 25 | Luanti (snowdrift mod) | Flakes only where the sky is open | https://github.com/paramat/snowdrift/blob/master/init.lua |
| 26 | Return of the Obra Dinn | Dither pinned to the scene | https://dukope.com/devlogs/obra-dinn/tig-32/ |
| 27 | Owlboy | 640x360 with a 39 px hero (forum post) | https://steamcommunity.com/app/431730/discussions/0/3200369647710806615 |
| 28 | Chained Echoes | 640x360 internal resolution (search summary) | https://gamecytus.netlify.app/host-https-www.pcgamingwiki.com/wiki/Chained_Echoes |
| 29 | Quake 3 | A pool of 256 marks with a 10 s life | https://github.com/ioquake/ioq3/blob/main/code/cgame/cg_marks.c |
| 30 | Mana Seed Winter Forest (tileset) | Trees and rocks in bare and snow-covered states | https://seliel-the-shaper.itch.io/winter-forest |
| 31 | Time Fantasy Winter (tileset) | SnowGrass as a hand-drawn half-way ground | https://finalbossblues.itch.io/time-fantasy-winter |
| 32 | LPC characters | Walk-cycle previews for contact timing | https://liberatedpixelcup.github.io/Universal-LPC-Spritesheet-Character-Generator/ |

---

## 12. What remains unverified (and corrections)

**Corrections to VFX #1**
1. **Scale of its pixel values.** The VFX #1 sandbox has 8 px tiles and 7x12 px characters, a quarter of Asterion's scale. Its 2x2 stamps every 4 px, its 28 px upwind ray and its 1 to 2 px flakes need converting. §6b gives the values in tiles [I, lead].
2. **Particle collision wording.** VFX #1 said the Compatibility renderer has "no particle SDF collision". The corrected wording is this. The Compatibility renderer has no 3D particle SDF colliders. For 2D it has had a collision path against `LightOccluder2D` since 4.0. The 4.7 renderer table still lists particle SDF collision as not supported, and open bug #112926, reproduced on 4.7.2, hides particles when collision is on. We do not rely on it, and flakes compute their own landing [V, S139, S136, S137, S138, S140].
3. **Godot 4.7's date.** VFX #1 wrote 19 Jun 2026. The release tag says 18 Jun 2026 [V, S120].
4. **Platinum's tiers.** Three sink offsets of 12, 14 and 16 units, not four sink depths [V, S40].
5. **Tibia's 10 s footprint.** VFX #1 held it as unverified. Two open server data sets now carry `duration` 10, still unchecked against CipSoft [V, S9, S14].

**Corrections between our own notes**
- **Sink depth.** Note 11 caps it at 6 px and note 13 proposes bands up to 12 px. Both stand, one for weather snow and one for authored deep terrain.
- **Dirty chunks.** Note 13 suggests uploading dirty 32x32 px chunks. Notes 12, 15 and 17 rule that out for Godot.
- **Print size.** Note 13 recommends 3x5 px. The Sandbox draws 4x6 px, because 3x5 did not read at 1x [V, S3].
- **Prints at 1:4.** Note 12 inferred that left and right prints would join into one trench 8 to 12 px wide. In the Sandbox they do not. One row keeps blunt marks and the other shrinks to slivers, because stamps are area-weighted [V, S3].

**Labelled as estimates, self-reported or author judgement**
- Every px value for snow edges, roof lips, caps, prints, rims, shadows, breath and flakes [I, notes 11, 13].
- The summer-to-winter mask blend, the art threshold tile and snow on hats and shoulders have no shipped precedent found [I].
- Pack contents come from seller pages [V, self-reported, S107, S109, S111].
- The 1% coverage rule rests on three data points [I, note 14]. The edge metric was run on a smooth field only [V, S5].

**Still unverified [U]**
- No measured `ImageTexture.update()` or `blit_rect` time on Compatibility or WebGL2. No GDScript timing for the pick loops. No phone and no low-end laptop [S4].
- `DrawableTexture2D` on WebGL2, `GPUParticles2D` with collision in a browser, and the texture-array layer update at the 4.7 tag [S126].
- Tibia's 10 s against CipSoft's own server, and whether official Tibia has any falling snow. Three searches found no official weather effect [S16, S17].
- Platinum's frame rate, its sprite sizes and the mapping of weather handlers to weather types.
- VX Ace's screen size of 544x416 is from memory [K, note 14]. `rmmz_core.js` was read from a third-party mirror [S26].
- Chained Echoes and CrossCode resolutions came through search summaries [S87, S86]. Owlboy's 640x360 and 39 px hero come from a forum post [S88].
- The art inside Stardew's snow cell, the OTClient snow texture and every footprint sprite. No image was opened in this study.

**Not found after two research rounds**
- Per-pixel dynamic ground snow in any tile game. Only Noita has it, as a falling-sand material.
- A trench width for a single walker in any 2D game.
- Any official Tibia weather effect.
- A shipped 2D game with snow settling on a character.
- A shipped game or public shader that blends summer and winter tilesets through a mask, or thresholds a field against a painted map.
- A 32 px native commercial winter tileset, and any pack with footprint tiles.
- Sourced numbers for Eastward, Sea of Stars, Chained Echoes, Graveyard Keeper, Moonlighter, Kynseed, Graal, Chrono Trigger, Secret of Mana, Necesse, Pokémon Gen 5 and HeartGold beyond the cells in §6c.

The §11 index has 32 rows. Every sourced game with a public page is in it.

---

## 13. Prototype roadmap for Godot 4.7 (web)

1. **Measure the two unknowns first.** A 20-line Godot test that times `ImageTexture.update()` for 160x90 R8, 320x180 R8 and 640x360 RGBA8 on the Compatibility renderer, in a browser, on the target laptop and phone. Time a GDScript loop writing 2,350 and 37,600 bytes into a `PackedByteArray`. Run `snowbench.html` [S4] on the same devices.
2. **Project settings.** 640x360, `viewport` stretch, `integer` scale, Nearest filter, transform snapping (F4). Check the web export on a 125% Windows display.
3. **Ground shader with a static field.** One CanvasItem shader with the field, the threshold map and the palette (§7). Paint the first threshold map for grass, 128x128 px as in the Sandbox, over a blue-noise base. Compare it with Bayer 4 at 3x.
4. **The field tick.** Depth, packed and wet at 320x180 in `PackedByteArray`, the five pick passes counted per 1,000 cells, the RNG state in a typed array, one whole-image upload per changed field.
5. **Bakes.** The static art mask in the tileset alpha, then the row-sweep exposure bake per wind bucket and the sun shadow bake at load.
6. **Characters.** One walk cycle per tile, boots from tile progress, the trench switch at 4 px of sink, the sink shader with its rim, speed from the server band. Then the shadow, breath and kicked snow.
7. **Server bands.** One synced snow level against fixed per-tile noise, 2 bits per tile to the client, and the dual-grid overlay through TileMapDual as the fallback for machines that skip the field.
8. **Flakes.** Far layers inside the ground shader, the near flakes in one `MultiMesh`, world-locked, whole pixels, coverage checked against 1%.
9. **Fallbacks.** Detect software GL and drop the near-flake quads first. Test `GPUParticles2D` and `DrawableTexture2D` on WebGL2 only after everything above runs without them.
10. **Art pass.** Shaped caps and roof lips, the frost tint, then the winter tileset and the mask blend if the first threshold tile proves the look.

---

## 14. Sources

Numbered for [S#] references. All URLs come from notes 10 to 17, the lead's verification note, the shared context or the Sandbox spec. "Search summary", "not opened" or "title only" means our researchers did not read the page directly. For sources that VFX #1 already lists, we cite VFX #1 itself [S2].

**Series**
1. DOOM PSX fire, Fabien Sanglard (series reference): https://fabiensanglard.net/doom_fire_psx/
2. VFX #1 Snow: https://kingsfoil-artifacts.netlify.app/vfx-snow-topdown-pixel
3. Snow 32 Sandbox, `vfx-snow-32px-sandbox.html` (companion page), with its as-built record in `notes/SANDBOX-SPEC.md`
4. Our snow benchmark, `notes/bench/snowbench.html` and `run.py`, Apple M4 Pro, Chromium 153, November 2026 (this study)
5. Our field-resolution edge test, `notes/bench/edge-test.js`, Node 26.5.0, Apple M4 Pro, November 2026 (this study)

**Tibia and Open Tibia**
6. OTClient `const.h`, `TILE_PIXELS = 32`: https://github.com/edubart/otclient/blob/master/src/client/const.h
7. OTClient `mapview.cpp`, 15x11 visible tiles: https://github.com/edubart/otclient/blob/master/src/client/mapview.cpp
8. OTClient `creature.cpp`, walk animation and step duration: https://github.com/edubart/otclient/blob/master/src/client/creature.cpp
9. The Forgotten Server (TFS) `items.xml`, snow and footprint ids, `duration` 10: https://github.com/otland/forgottenserver/blob/master/data/items/items.xml
10. TFS `snow.lua`, the `StepOut` footprint script: https://github.com/otland/forgottenserver/blob/master/data/movements/scripts/snow.lua
11. TFS `movements.xml`: https://github.com/otland/forgottenserver/blob/master/data/movements/movements.xml
12. TFS `creature.cpp`, `getStepDuration`: https://github.com/otland/forgottenserver/blob/master/src/creature.cpp
13. Canary `snow.lua`: https://github.com/opentibiabr/canary/blob/main/data/scripts/movements/snow.lua
14. Canary `items.xml`: https://github.com/opentibiabr/canary/blob/main/data/items/items.xml
15. OTClient (mehah) `snow.frag`, with `shaders.lua` beside it: https://github.com/mehah/otclient/blob/main/modules/game_shaders/shaders/fragment/snow.frag
16. TibiaWiki, Effects (search result list, no weather page): https://tibia.fandom.com/wiki/Effects
17. Otland thread on the Tibia 11 client (search summary): https://otland.net/threads/cipsoft-tibias-auto-loot-and-window-location-update-pretty-awesome.255853/

**RPG Maker**
18. RPG Maker MV `Weather.js`: https://github.com/rpgtkoolmv/corescript/blob/master/js/rpg_core/Weather.js
19. RPG Maker MV `Tilemap.js`, the autotile table: https://github.com/rpgtkoolmv/corescript/blob/master/js/rpg_core/Tilemap.js
20. RPG Maker MV `SceneManager.js`, 816x624: https://github.com/rpgtkoolmv/corescript/blob/master/js/rpg_managers/SceneManager.js
21. RPG Maker MV `Spriteset_Map.js`, weather origin: https://github.com/rpgtkoolmv/corescript/blob/master/js/rpg_sprites/Spriteset_Map.js
22. RPG Maker MV `Game_CharacterBase.js`, bush depth and walk pattern: https://github.com/rpgtkoolmv/corescript/blob/master/js/rpg_objects/Game_CharacterBase.js
23. RPG Maker MV `Sprite_Character.js`: https://github.com/rpgtkoolmv/corescript/blob/master/js/rpg_sprites/Sprite_Character.js
24. RPG Maker MV corescript LICENSE (MIT, copyright 2015): https://github.com/rpgtkoolmv/corescript/blob/master/LICENSE
25. RPG Maker MV help, Asset Standards: https://rpgmakerofficial.com/product/MV_Help/page/01_11_01.html
26. RPG Maker MZ `rmmz_core.js` v1.3.3 (third-party mirror): https://github.com/KageDesu/Alpha-NET-Z/blob/master/js/rmmz_core.js
27. RPG Maker VX Ace `Spriteset_Weather` default script (copy in a sample project): https://github.com/RMEx/buildozer/blob/master/Sample_project_1/Scripts/Sprites/Spriteset_Weather.rb
28. VX Ace character sheet format (community-reported): https://guttykreum.itch.io/jrpg-character-pack/devlog/134774/rpg-maker-vx-ace-compatibility-complete

**Stardew Valley**
29. Stardew Valley 1.5.4 decompilation, `Game1.cs`: https://github.com/veywrn/StardewValley/blob/master/StardewValley/Game1.cs
30. Same, `WeatherDebris.cs`: https://github.com/veywrn/StardewValley/blob/master/StardewValley/WeatherDebris.cs
31. Same, `FarmerSprite.cs`, `snowyStep` and no footprints: https://github.com/veywrn/StardewValley/blob/master/StardewValley/FarmerSprite.cs
32. A second decompilation, `FarmerSprite.cs`, `checkForFootstep`: https://github.com/E-riCA0/StawdewValley/blob/HEAD/FarmerSprite.cs

**Pokémon**
33. pokeemerald `field_effect_helpers.c`, prints, shadows, sand pile: https://github.com/pret/pokeemerald/blob/master/src/field_effect_helpers.c
34. pokeemerald `event_object_movement.c`, track trigger and step tables: https://github.com/pret/pokeemerald/blob/master/src/event_object_movement.c
35. pokeemerald `object_event_anims.h`, walk and run frame times: https://github.com/pret/pokeemerald/blob/master/src/data/object_events/object_event_anims.h
36. pokeemerald `field_effect_objects.h`, print pictures and flips: https://github.com/pret/pokeemerald/blob/master/src/data/field_effects/field_effect_objects.h
37. pokeemerald `sprite.h`, `MAX_SPRITES 64`: https://github.com/pret/pokeemerald/blob/master/include/sprite.h
38. pokeemerald `field_weather_effect.c`: https://github.com/pret/pokeemerald/blob/master/src/field_weather_effect.c
39. pokeplatinum `fieldmap.h`, snow tile behaviours: https://github.com/pret/pokeplatinum/blob/main/include/constants/fieldmap.h
40. pokeplatinum `map_object_move.c`, sink distances: https://github.com/pret/pokeplatinum/blob/main/src/map_object_move.c
41. pokeplatinum `player_move.c`, deep-snow walk speeds: https://github.com/pret/pokeplatinum/blob/main/src/player_move.c
42. pokeplatinum `ov5_021F1CC8.c`, track placement, pieces and fade: https://github.com/pret/pokeplatinum/blob/main/src/overlay005/ov5_021F1CC8.c
43. pokeplatinum `object_event_gfx_data.c`, track type per sprite: https://github.com/pret/pokeplatinum/blob/main/src/overlay005/object_event_gfx_data.c
44. pokeplatinum `ov5_021D5EB8.c`, weather handlers: https://github.com/pret/pokeplatinum/blob/main/src/overlay005/ov5_021D5EB8.c
45. pokeheartgold `metatile_behavior.h`: https://github.com/pret/pokeheartgold/blob/master/include/constants/metatile_behavior.h
46. pokeheartgold `metatile_behavior.c`: https://github.com/pret/pokeheartgold/blob/master/src/metatile_behavior.c
47. Serebii, Black and White seasons: https://www.serebii.net/blackwhite/seasons.shtml

**Per-cell and global snow in shipped games**
48. RimWorld 1.6 decompilation, `SnowGrid.cs`: https://github.com/32bitx64bit/RW-Decompiled-1.6/blob/HEAD/Verse/SnowGrid.cs
49. RimWorld `SectionLayer_Snow.cs`: https://github.com/32bitx64bit/RW-Decompiled-1.6/blob/HEAD/Verse/SectionLayer_Snow.cs
50. RimWorld `WeatherBuildupUtility.cs`: https://github.com/32bitx64bit/RW-Decompiled-1.6/blob/HEAD/Verse/WeatherBuildupUtility.cs
51. RimWorld `SteadyEnvironmentEffects.cs`: https://github.com/32bitx64bit/RW-Decompiled-1.6/blob/HEAD/RimWorld/SteadyEnvironmentEffects.cs
52. RimWorld `Pawn_PathFollower.cs`: https://github.com/32bitx64bit/RW-Decompiled-1.6/blob/HEAD/Verse.AI/Pawn_PathFollower.cs
53. RimWorld `PawnFootprintMaker.cs`: https://github.com/32bitx64bit/RW-Decompiled-1.6/blob/HEAD/RimWorld/PawnFootprintMaker.cs
54. RimWorld `PawnBreathMoteMaker.cs`: https://github.com/32bitx64bit/RW-Decompiled-1.6/blob/HEAD/RimWorld/PawnBreathMoteMaker.cs
55. RimWorld `WeatherOverlay_SnowHard.cs`: https://github.com/32bitx64bit/RW-Decompiled-1.6/blob/HEAD/RimWorld/WeatherOverlay_SnowHard.cs
56. RimWorld Core defs, `Fleck_Special.xml`: https://github.com/mezunnk/RimWorld/blob/HEAD/Core/Defs/Effects/Fleck_Special.xml
57. RimWorld Core defs, `Weathers.xml`: https://github.com/mezunnk/RimWorld/blob/HEAD/Core/Defs/WeatherDefs/Weathers.xml
58. DFHack df-structures, `df.block.xml`: https://github.com/DFHack/df-structures/blob/master/df.block.xml
59. Dwarf Fortress Wiki, Graphics: https://dwarffortresswiki.org/index.php/Graphics
60. Project Zomboid 41.78 decompilation, `IsoCell.java`: https://github.com/Ketum-Git/PZ-Javacode/blob/HEAD/PZ_41.78/zombie/iso/IsoCell.java
61. Project Zomboid 41.78, `ClimateManager.java`: https://github.com/Ketum-Git/PZ-Javacode/blob/HEAD/PZ_41.78/zombie/iso/weather/ClimateManager.java
62. Don't Starve Together `components/weather.lua`: https://github.com/taichunmin/dont-starve-together-game-scripts/blob/HEAD/scripts/components/weather.lua
63. Don't Starve Together `standardcomponents.lua`: https://github.com/taichunmin/dont-starve-together-game-scripts/blob/HEAD/scripts/standardcomponents.lua
64. Don't Starve Together `components/frostybreather.lua`: https://github.com/taichunmin/dont-starve-together-game-scripts/blob/HEAD/scripts/components/frostybreather.lua
65. Don't Starve Together `prefabs/frostbreath.lua`: https://github.com/taichunmin/dont-starve-together-game-scripts/blob/HEAD/scripts/prefabs/frostbreath.lua
66. Don't Starve Together `prefabs/snow.lua`: https://github.com/taichunmin/dont-starve-together-game-scripts/blob/HEAD/scripts/prefabs/snow.lua
67. Factorio data, `entities.lua`, the footprint particle: https://github.com/wube/factorio-data/blob/master/base/prototypes/entity/entities.lua
68. Factorio data, `character-animations.lua`, footprint frames: https://github.com/wube/factorio-data/blob/master/base/prototypes/entity/character-animations.lua
69. Factorio data, `tiles-aquilo.lua`: https://github.com/wube/factorio-data/blob/master/space-age/prototypes/tile/tiles-aquilo.lua
70. Noita Wiki, Snow: https://noita.wiki.gg/wiki/Snow
71. Noita Wiki, Forest (weather section): https://noita.wiki.gg/wiki/Forest
72. Terraria Wiki, Rain: https://terraria.wiki.gg/wiki/Rain
73. Rain World Wiki, Rain (blizzard section): https://rainworld.miraheze.org/wiki/Rain
74. Core Keeper Wiki, Biomes: https://core-keeper.fandom.com/wiki/Biomes

**Other games and code**
75. roBrowser Legacy `SnowWeather.js`: https://github.com/MrAntares/roBrowserLegacy/blob/master/src/Renderer/Effects/SnowWeather.js
76. Mindustry `Weathers.java`: https://github.com/Anuken/Mindustry/blob/master/core/src/mindustry/content/Weathers.java
77. Mindustry `ParticleWeather.java`: https://github.com/Anuken/Mindustry/blob/master/core/src/mindustry/type/weather/ParticleWeather.java
78. Mindustry `Weather.java`, `drawParticles`: https://github.com/Anuken/Mindustry/blob/master/core/src/mindustry/type/Weather.java
79. Cataclysm DDA `weather_type.json`: https://github.com/CleverRaven/Cataclysm-DDA/blob/master/data/json/weather_type.json
80. Cataclysm DDA `handle_action.cpp`: https://github.com/CleverRaven/Cataclysm-DDA/blob/master/src/handle_action.cpp
81. Shattered Pixel Dungeon `SnowParticle.java`: https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/effects/particles/SnowParticle.java
82. Luanti `snowdrift` mod, `init.lua`: https://github.com/paramat/snowdrift/blob/master/init.lua
83. ioquake3 `cg_marks.c`: https://github.com/ioquake/ioq3/blob/main/code/cgame/cg_marks.c
84. CrossCode map editor, `globals.ts`, `TILE_SIZE = 16`: https://github.com/CCDirectLink/crosscode-map-editor/blob/master/webapp/src/app/services/globals.ts
85. CrossCode map editor, `entities.json`, `events.json`, `map-settings.json`: https://github.com/CCDirectLink/crosscode-map-editor/tree/master/webapp/src/assets
86. PCGamingWiki mirror, CrossCode (search summary): https://gamecytus.netlify.app/host-https-www.pcgamingwiki.com/wiki/CrossCode
87. PCGamingWiki mirror, Chained Echoes (search summary): https://gamecytus.netlify.app/host-https-www.pcgamingwiki.com/wiki/Chained_Echoes
88. Steam forum post on Owlboy's resolution (community-reported): https://steamcommunity.com/app/431730/discussions/0/3200369647710806615
89. The Minish Cap decompilation (searched for snow code): https://github.com/zeldaret/tmc
90. A Link to the Past C port, `overworld.c`: https://github.com/snesrev/zelda3/blob/master/src/overworld.c
91. EarthBound disassembly (searched for snow code): https://github.com/Herringway/ebsrc

**Pixel-art craft**
92. Slynyrd, Pixelblog 20, Top Down Tiles, 27 Aug 2019: https://www.slynyrd.com/blog/2019/8/27/pixelblog-20-top-down-tiles
93. Slynyrd, Pixelblog 43, Top Down Tiles Part 2, 26 Mar 2023: https://www.slynyrd.com/blog/2023/3/26/pixelblog-43-top-down-tiles-part-2
94. Slynyrd, Pixelblog 22, Top Down Character Sprites, 21 Oct 2019: https://www.slynyrd.com/blog/2019/10/21/pixelblog-22-top-down-character-sprites
95. Slynyrd, Pixelblog 55, Top Down Character Animation, 24 Mar 2025: https://www.slynyrd.com/blog/2025/3/24/pixelblog-55-top-down-character-animation
96. Slynyrd, Pixelblog catalogue (64 posts, none on snow): https://www.slynyrd.com/pixelblog-catalogue
97. cure, pixel art tutorial, Pixel Joint forum: https://pixeljoint.com/forum/forum_posts.asp?TID=11299
98. Derek Yu, pixel art tutorial, common mistakes: https://www.derekyu.com/makegames/pixelart2.html
99. Pixel Parmesan, "Dithering for Pixel Artists", 18 Jan 2021: https://pixelparmesan.com/dithering-for-pixel-artists
100. Divoom blog on over-dithering (vendor): https://divoom.com/blogs/setup-ideas/pixel-art-dithering-when-to-use-and-stop
101. Pixel Joint critique thread, "Hai's big WIP", 2014 to 2016: https://pixeljoint.com/forum/printer_friendly_posts.asp?TID=17989
102. saint11 tutorial index (80 entries, none on snow): https://saint11.art/blog/pixel-art-tutorials/
103. Lospec tutorials tagged snow (2 entries): https://lospec.com/pixel-art-tutorials/tags/snow
104. Apollo palette, AdamCYounis, 46 colours: https://lospec.com/palette-list/apollo.json
105. Resurrect 64 palette, Kerrie Lake, 64 colours: https://lospec.com/palette-list/resurrect-64.json
106. Mana Seed Character Base, Seliel the Shaper (seller page): https://seliel-the-shaper.itch.io/character-base

**Winter tilesets**
107. Mana Seed Winter Forest (seller page): https://seliel-the-shaper.itch.io/winter-forest
108. Mana Seed Weather Effects, snowfall autotile update, 15 Apr 2021: https://seliel-the-shaper.itch.io/weather-effects/devlog/242870/snowfall-autotile-update
109. Time Fantasy Winter Tiles, finalbossblues (seller page): https://finalbossblues.itch.io/time-fantasy-winter
110. Omega Modern "Snow-Mega Modern" devlog, 23 Dec 2022: https://itch.io/devlog/467420/snow-mega-modern
111. Franuka RPG snow tileset (seller page): https://franuka.itch.io/rpg-snow-tileset

**Field resolution, autotiles and dither**
112. Andrey Mishkinis, "Advanced Terrain Texture Splatting", 16 Jul 2013: https://www.gamedeveloper.com/programming/advanced-terrain-texture-splatting
113. Boris the Brave, "Classification of Tilesets", 14 Nov 2021: https://www.boristhebrave.com/2021/11/14/classification-of-tilesets/
114. Boris the Brave, "Quarter-Tile Autotiling", 31 May 2023 (search summary): https://www.boristhebrave.com/2023/05/31/quarter-tile-autotiling/
115. jess-hammer, dual-grid-tilemap-system-godot: https://github.com/jess-hammer/dual-grid-tilemap-system-godot
116. pablogila, TileMapDual: https://github.com/pablogila/TileMapDual
117. Lucas Pope, Obra Dinn dithering devlog, Nov 2017 (mirror): https://dukope.com/devlogs/obra-dinn/tig-32/
118. Christoph Peters, "Free blue noise textures", 22 Dec 2016: https://momentsingraphics.de/BlueNoise.html
119. Surma, "Ditherpunk", 4 Jan 2021: https://surma.dev/things/ditherpunk/

**Godot**
120. Godot releases, GitHub API: https://api.github.com/repos/godotengine/godot/releases
121. Godot builds, GitHub API: https://api.github.com/repos/godotengine/godot-builds/releases
122. Godot docs, "Multiple resolutions": https://docs.godotengine.org/en/stable/tutorials/rendering/multiple_resolutions.html
123. ProjectSettings class reference, 4.7-stable: https://raw.githubusercontent.com/godotengine/godot/4.7-stable/doc/classes/ProjectSettings.xml
124. MDN, "Crisp pixel art look" (search summary): https://developer.mozilla.org/docs/Games/Techniques/Crisp_pixel_art_look
125. Pixel-perfect resolution calculator: https://ziva.sh/tools/pixel-perfect-resolution-calculator
126. Godot GLES3 `texture_storage.cpp`, 4.7-stable and master: https://raw.githubusercontent.com/godotengine/godot/4.7-stable/drivers/gles3/storage/texture_storage.cpp
127. RenderingServer class reference, master: https://raw.githubusercontent.com/godotengine/godot/master/doc/classes/RenderingServer.xml
128. Godot proposal #13012, partial texture updates: https://github.com/godotengine/godot-proposals/issues/13012
129. Godot issue #65762, `texture_2d_update_partial()` missing: https://github.com/godotengine/godot/issues/65762
130. DrawableTexture2D class reference, 4.7-stable: https://raw.githubusercontent.com/godotengine/godot/4.7-stable/doc/classes/DrawableTexture2D.xml
131. Godot PR #105701, "Implement DrawableTextures", merged 30 Jan 2026: https://github.com/godotengine/godot/pull/105701
132. Godot docs, CanvasItem shader reference: https://docs.godotengine.org/en/stable/tutorials/shaders/shader_reference/canvas_item_shader.html
133. CanvasItem class reference, 4.4-stable (instance shader parameters): https://raw.githubusercontent.com/godotengine/godot/4.4-stable/doc/classes/CanvasItem.xml
134. Godot forum, "Shader TileMap Custom Data Layers", Mar 2025: https://forum.godotengine.org/t/shader-tilemap-custom-data-layers/104400
135. Godot `cpu_particles_2d.cpp`: https://github.com/godotengine/godot/blob/master/scene/2d/cpu_particles_2d.cpp
136. Godot GLES3 `particles_storage.cpp`, 4.7-stable: https://raw.githubusercontent.com/godotengine/godot/4.7-stable/drivers/gles3/storage/particles_storage.cpp
137. Godot GLES3 `particles.glsl`, 4.7-stable: https://raw.githubusercontent.com/godotengine/godot/4.7-stable/drivers/gles3/shaders/particles.glsl
138. Godot PR #68426, "Add GPUParticles to the OpenGL3 renderer", merged 15 Nov 2022: https://github.com/godotengine/godot/pull/68426
139. Godot docs, renderers feature table, 4.7: https://raw.githubusercontent.com/godotengine/godot-docs/4.7/tutorials/rendering/renderers.rst
140. Godot issue #112926, GPUParticles2D invisible with collision on: https://github.com/godotengine/godot/issues/112926
141. Godot forum, texture update bottleneck (search summary): https://forum.godotengine.org/t/how-to-make-a-decal-notice-that-its-texture-changed/131693

**Benchmark method**
142. Chrome DevTools Protocol, `Emulation.setCPUThrottlingRate`: https://chromedevtools.github.io/devtools-protocol/tot/Emulation/#method-setCPUThrottlingRate
143. `EXT_disjoint_timer_query_webgl2`: https://registry.khronos.org/webgl/extensions/EXT_disjoint_timer_query_webgl2/
144. MDN, `performance.now()` and its reduced precision: https://developer.mozilla.org/en-US/docs/Web/API/Performance/now
