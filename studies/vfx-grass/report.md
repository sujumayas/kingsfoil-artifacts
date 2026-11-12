# Top-down pixel grass: tiny algorithms for trampled grass, swaying fields, butterflies, fireflies and small life

**Kingsfoil Studios · Research study · November 2026**

---

## Context

This is study #9 in our VFX series. Each study picks one concept and hunts for old-school algorithms that are very small and very efficient.

- **Study #1, snow** [S2]: palette lighting and snow cover.
- **Study #2, acid** [S3]: glow by block-sum blur plus palette select.
- **Study #3, rain** [S4]: wet ground and splashes.
- **Study #4, forest** [S5]: tree sway as integer row offsets, gusts with stiffness, rustle, birds, season swap.
- **Study #5, light** [S6]: the Tibia light model and the low-res light map.
- **Study #6, fire and smoke** [S7]: fire spread with fuel, moisture and wind.
- **Study #7, water** [S8]: shorelines and rivers.
- **Study #8, fog** [S9]: noise tables, a wind field, world-locked dither and our first full benchmark.

Forest owns tree sway, so this study links its row offsets (Forest D1) and gusts (Forest D2) and goes deeper on grass and small life. Burning reuses Fire's spread; fireflies stamp into Light's light map.

The series reference is the **DOOM PSX fire** [S1]. One byte per pixel, one rule, one palette. Grass fits that shape. A tall-grass flag per tile, one byte of crush per cell and one shared wind clock give most of the effect. Pokémon Emerald hides a walker's legs with one OAM priority bit and a 5-image rustle sprite [V, S15, S13].

**Two equal goals.**
- **Artistic quality.** What makes a field and its creatures look alive in pixel art, as artists and players judge it: variation, palette ramps, sway in whole pixels, readable gusts, creature motion that reads as alive, and restraint.
- **Runtime efficiency.** What each technique costs on a weak web build. We benchmarked tufts, field layers, trail maps, regrowth, firefly sync, glow and pollen ourselves (§6a). Every cost field gives a number, measured or labelled as an estimate.

**Targets.** Godot 4, web-first, so the **Compatibility renderer** (WebGL 2, no compute shaders, limited 2D lights). Top-down 3/4 pixel art on 32x32 tiles for the Tibia-like MMORPG **Asterion Online**, which is server-authoritative, and a top-down RPG. Phones and old laptops.

**Sources.** Eleven research notes, the lead's verification note, our **Grass Sandbox** [S11] and our benchmark [S12], run on an Apple M4 Pro in Chromium 153 on the real GPU (ANGLE Metal) and on software GL (SwiftShader), with a 6x CPU throttle as a low-end proxy. **No phone was measured.** Treat every millisecond as a desktop figure.

---

## 1. Executive summary

**Runtime efficiency.**

1. **Draw calls, not pixels, decide the cost of grass.** 8,000 tufts in one instanced draw cost 0.056 ms on the M4 GPU at 320x180; as 8,000 separate draws, 13.1 ms, 230x more [V, S12]. Batch tufts into a few draws, one per y-sort row band at most.
2. **A whole field drawn by one shader is almost free.** A full-screen 320x180 field shift costs 0.0021 ms, 0.0029 ms with a trail map [V, S12].
3. **Trampling and regrowth are free at game sizes.** An 80x45 byte trail map with 10 walkers costs 0.0023 ms, 0.014 ms throttled. 256 random regrowth picks cost 0.0008 ms on any map [V, S12].
4. **Small life is cheap to simulate and dear to draw one by one.** 1,000 butterflies update in 0.012 ms; drawing them one canvas call each costs 0.69 ms [V, S12]. Firefly sync for 1,000 flies costs 1.14 ms naive, 0.42 ms with a grid and 0.067 ms with a per-cell mean field [V, S12].
5. **The network carries stage changes, never steps.** A TFS tile update is about 9 bytes [V, S23; I]. Syncing flatten values per walker would cost about 450 KB/s across 50 viewers [I, note 03].

**Artistic quality.**

6. **Restraint reads as alive.** Stardew grass never sways in wind and only shakes when touched [V, S36]. Terraria gates sway below a wind threshold [V, S52]. Players praise grass that bends when they pass [V, S156].
7. **Whole pixels, always.** Shift rows by 0, 1 or 2 px with the root fixed, quantised in the shader [V, S110, S111]. Rotation at 320x180 breaks the art [I, note 08].
8. **One global wind, a travelling wave on top.** Per-blade noise looked like "dancing" grass to one Godot developer [V, S90].
9. **Creatures need a rhythm, a goal and a reaction.** Stardew's butterfly rises only on a flap [V, S39]. Fresh random steering gives "no sustained turns" [V, S127].
10. **Fireflies are magic when rare and slow.** A pulse-coupled clock makes a meadow fall into step over tens of seconds [V, S115; I]. We found no shipped game with real synchrony.

**Pretty and cheap.** Flowers in clumps (B5), flap-hop butterflies (F1), synced fireflies (G1), halo sprites (G2), season palettes with per-tile offsets (H1) and weather ramps (H2) score 10 of 10 on taste plus mood and 5 on speed.

**Pretty but expensive.** One draw per tuft, 3.27 ms for 2,000 [V, S12]. Canvas per-row slicing, 12 ms for 2,000 [V, S12]. A PointLight2D per firefly, past Compatibility's 15-per-item cap [V, S103].

**Cheap but ugly.** Smooth sub-pixel sway (C1), rotation at native resolution (A4), screen-locked debris (G4), dancing per-blade noise (C3).

**Recommendation for Asterion** [I]. The server stores a stage and a time only for changed tiles, regrows them lazily and sends 9 bytes per visible change. It never sends a player hidden in tall grass to anyone outside the patch or more than 1 tile away. The client draws hashed ground tiles, batched tufts with whole-pixel shear from the server wind and a gust table, and an 80x45 trail map that flattens tufts for a few seconds. Small life is cosmetic, seeded from chunk and time, pooled and capped. Section 7 has the layers, §8 the Sandbox.

---

## 2. How to read this study

| Tag | Meaning |
|---|---|
| **[V]** | Verified in a source our researchers read: code, paper, docs, wiki or article, or our own measurement [S12]. "[V, vendor]" and "[V, self-reported]" mark figures reported by their own authors or sellers. |
| **[I]** | Author inference or design proposal. Untested unless it says "Sandbox", and then tested only in our JavaScript prototype. |
| **[U]** | Unverified: memory, a search snippet, or a page that could not be fetched. Treat it as a lead. |
| **[K]** | Textbook or canonical knowledge (maths, well-known release years). |

- [S#] refers to §14. "[I, note 0X]" is an inference made by the researcher in that note.
- Ratings (1–5) are author judgement: **Simplicity · Speed · Pixel taste · Mood · Interactivity**.
- **Speed follows the measurements** [S12]. 5 means under about 0.05 ms per frame on the M4 GPU, or under 0.1 ms of CPU at game counts, in a handful of draws. 4 means per-object draws or loops that need care in GDScript. 3 means a cost you see on software GL. 2 means it does not belong in a web frame.
- **Measured numbers are desktop numbers.** The throttle is a CPU estimate, and Godot adds its own canvas pass.
- One 32 px tile is treated as about 1 m to turn biology into px/s [I, notes 05, 07].
- Sandbox numbers are illustrative; the Sandbox is a Canvas 2D page, not a Godot build.

---

## 3. Generations: a timeline

**Gen 0: the science of fields, insects and trails**
- **1966** Lloyd times P. pyralis at one flash per 5.9 s (secondary source) [V, S139]. **1990** Mirollo and Strogatz prove pulse-coupled oscillators synchronise [V, S126].
- **1995** Cole tramples 18 vegetation types at up to 500 passes [V, S123]. **1997** Helbing's active walker model for trails [V, S122].
- **1999** Reynolds names "twitchy" wander as the failure mode [V, S127]. **2001** Perbet and Cani's wind primitives [V, S121].

**Gen 1: tiles, priority bits and decay timers (1991–2004)**
- **1991** A Link to the Past swaps cut grass and throttles drops [K; V, S17, S18].
- Tibia regrows cut plants through item decay timers (1997 onward) [K; V, S20].
- **2000** Pokémon Crystal draws grass over the walker with one priority bit [K; V, S16]. **2004** Pokémon Emerald's rustle and long-grass sinking; GPU Gems ch. 7 [K; V, S13, S86].

**Gen 2: shaders, sandboxes and indie farms (2007–2020)**
- **2007** Habel's two-noise grass shear [V, S120]. **2008** Jantzen and Eisner measure the cabbage white at 11.8 Hz [V, S128].
- **2009** League of Legends brush [K; V, S80]. **2011** Minecraft and Terraria random-tick grass [K; V, S59, S54].
- **2014** Shattered Pixel Dungeon's sight-blocking grass [K; V, S72]. **2016** Stardew Valley's tufts that shake when touched [K; V, S37].
- **2017** Jahrmann and Wimmer's crush and recovery [V, S119]. **2020** Terraria 1.4's WindGrid [K; V, S53]; VALORANT's server-side fog of war [V, S81].

**Gen 3: Godot, the web and measured costs (2021–2026)**
- **2021** Ghost of Tsushima's grass talk; Sarfati tracks synchronous fireflies in 3D [V, S87, S137]. **2024** Fabian explains why insects orbit lamps [V, S135].
- **Mar 2025** Minecraft's firefly bushes and leaf litter; Godot 4.4 brings per-instance uniforms to canvas shaders [V, S63; U on date, V, S100].
- **Mar 2026** Dynamic 2D Grass for Godot [V, S109]. **Jun 2026** Godot 4.7 with `DrawableTexture2D` [V, S104, S105].
- **Aug 2026** Jarl's hashed 2D grass [V, S91]. **Nov 2026** our grass benchmark [V, S12].

---

## 4. Technique profiles

There are eight families:

- **A.** Classic roots
- **B.** Grass ground and tufts
- **C.** Wind
- **D.** Trampling and wear
- **E.** Cut, burn, graze, regrow and hide
- **F.** Flying life
- **G.** Fireflies, ground critters, seeds and spawning
- **H.** Seasons, biomes, accessibility and performance

Each profile ends with ratings for **Simplicity · Speed · Pixel taste · Mood · Interactivity** (1 = poor, 5 = excellent; author judgement). Every cost field gives a number. Measured figures come from our benchmark [S12] unless another source is named.

### Family A: Classic roots

### A1. Pokémon tall grass: a priority bit and a one-shot rustle

*In plain words.* Pokémon hides your legs by drawing the grass tile over the bottom half of your sprite. Stepping in plays a tiny 16x16 rustle that rests on a closed frame until you leave.

*How it works (technical).*
- **Crystal** [V, S16]. `SetTallGrassFlags` sets `IN_GRASS_F` on an object standing on grass. When OAM is built, that flag ORs in `OAM_PRIO`, the GBC "background over object" bit, so non-zero grass pixels draw over the walker.
- **Emerald rustle** [V, S13]. `sAnim_TallGrass` plays frames 1, 2, 3, 4 for 10 ticks each, then rests on frame 0 for 10 ticks: 4 frames then rest, 50 ticks, about 0.83 s at 59.73 fps. Long grass `sAnim_LongGrass` is faster, 26 ticks (about 0.43 s), and wobbles twice between frames 0 and 3.
- **Long grass sinking** [V, S15]. From the second step in, the 16x32 walker is drawn as two 16x16 halves. The bottom half gets priority 3 and sorts behind the background, so the lower 16 px vanish.

*Cost / performance.* On the GBA, one priority bit and one 16x16 sprite per occupied tile [V, S14]. In Godot it is one extra y-sorted strip per occupied tile, a few draws per screen. An instanced draw of 500 tufts costs 0.005 ms on the M4 GPU, so a handful of overlay strips is unmeasurably small [V, S12; I].

*Games that used it.*
- Pokémon Crystal: https://github.com/pret/pokecrystal/blob/master/engine/overworld/map_objects.asm
- Pokémon Emerald: https://github.com/pret/pokeemerald/blob/master/src/data/field_effects/field_effect_objects.h

*How it feels.* Slow 10-tick frames read as grass parting, the 3 to 4 tick long-grass frames as a flutter [I]. Players learned that tall grass means danger because encounters happen nowhere else [I].

*Risks.* Cover that hides too much of a sprite hides threats; keep the top half visible (E4) [I].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 5 · Mood 4 · Interactivity 4

### A2. Zelda cut grass: a tile swap, a debris puff and throttled drops

*In plain words.* A sword swing swaps the grass tile for a cut one, plays a leaf puff and sometimes drops a rupee. The odds are throttled so mowing a field never floods the screen.

*How it works (technical).*
- **A Link to the Past** [V, S17, S19]. Thick grass attribute 0x37E swaps to map16 tile 0xDC5, bushes to 0xDC7 or 0xDC8. The change is memorised for the area and one tile is redrawn. `Ancilla3F_BushPoof` draws a 4-piece 16x16 puff over 4 steps, spreading 2 px on the last.
- **Drop gates** [V, S18]. `GetRandomNumber() & 1` exits half the time. No drop if 4 or more sprites are active. The item comes from a rotating counter, `(subst_ctr++ & 7)`, over a 16-entry table. A second outdoor gate, `& 8`, is another 50%. So an ordinary bush yields something at most about 25% of the time [I].

*Cost / performance.* One tile write, one 4-piece puff and two random rolls per cut [V, S17]. On an MMO server the swap is one 9-byte tile update to viewers [I]. Client cost is a 4-sprite burst, inside the 0.005 ms of a 500-quad instanced draw [V, S12; I].

*Games that used it.*
- The Legend of Zelda: A Link to the Past: https://github.com/snesrev/zelda3/blob/master/src/overworld.c
- The Legend of Zelda: Link's Awakening: https://github.com/zladx/LADX-Disassembly

*How it feels.* Players feel "every few bushes something pops out", not streaks, because the counter rotates [I].

*Risks.* Without the sprite cap, a group mowing one MMO field spawns loot spam [I].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 4 · Mood 3 · Interactivity 5

### A3. Tibia and TFS: grass as items with decay timers

*In plain words.* Tibia ground grass never changes. A few plants on top are items. Cutting one turns it into a cut item with a timer, and it turns back by itself.

*How it works (technical).*
- **Items** [V, S20; lead check]. TFS `items.xml`: cut jungle grass 2781 has `decayTo 2782, duration 300`, so it regrows in 5 minutes. Wheat 2737 becomes 2738 after 240 s, then 2739 after another 240 s, two visible stages and 8 minutes in all. Canary has the same pairs under other ids (jungle grass 3695 to 3696, wheat 3651 to 3653) [V, S26].
- **Actions** [V, S21, S27]. The machete calls `target:transform(cut)` then `target:decay()`. The scythe on ripe wheat transforms it to stubble and creates a bunch of wheat. Wild growth is removed with a puff.

*Cost / performance.* About 9 bytes of payload per change, twice per cut (cut and regrow) [I, note 03, from S23]. Server cost is one decay entry per changed item, touched once per second [V, S22]. Untouched grass costs nothing. No client cost beyond drawing a different item.

*Games that used it.*
- Tibia (TFS items): https://github.com/otland/forgottenserver/blob/master/data/items/items.xml
- Tibia (Canary actions): https://github.com/opentibiabr/canary/blob/main/data-otservbr-global/scripts/lib/register_actions.lua

*How it feels.* Solid and shared. A field you cut stays cut for everyone. It is also static, with no rustle or sway [I].

*Risks.* A 1 s sweep over every item is wasteful at field scale (E2). Per-step trample state through it would flood the network [I].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 3 · Mood 2 · Interactivity 4

### A4. Stardew tufts: four per tile, still until touched

*In plain words.* Each Stardew grass tile holds up to 4 tufts with a small random offset and flip. They never sway in wind. Touched, they shake, settle in under a second and sleep.

*How it works (technical).*
- **Layout** [V, S37]. Each tuft picks 1 of 3 sprites of 15x20 px, drawn at 4x, offset by -2..+2 source px on both axes, 50% flipped, seeded per tile so the layout is stable. Tufts y-sort individually.
- **Shake** [V, S36]. `maximumShake = π/8`, `defaultShakeRate = π/80`, `shakeDecayRate = π/350`, scaled by collider speed. Rotation ping-pongs while the maximum decays, then halves each tick, and below 0.01 rad `NeedsUpdate = false`. Each tuft divides the rotation by `1 + r` with r in [0, 1), so neighbours bend 50% to 100% as much.
- **Timing** [I]. Peak bend 22.5 degrees, decay over about 44 ticks, about 0.73 s at 60 ticks/s.

*Cost / performance.* Only tufts that are shaking update; the rest sleep [V, S36]. On a field of 2,000 tufts the handful near walkers cost anything [I]. Drawn as one instanced batch, 2,000 tufts cost 0.012 ms on the M4 GPU [V, S12].

*Games that used it.*
- Stardew Valley: https://stardewvalleywiki.com/mediawiki/api.php?action=parse&page=Grass&prop=wikitext&format=json

*How it feels.* Calm. The player's path is the only motion, which keeps the screen readable [I]. The rotation is the weak point, fine at 4x and mixels at 320x180 [I].

*Risks.* Rotated sprites at native resolution; use lean frames or row shear (C1, C5) [I].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 3 · Mood 4 · Interactivity 4

### A5. Roguelike high grass: blocks sight, tramples to short grass

*In plain words.* In Shattered Pixel Dungeon and Brogue, tall grass blocks sight like a wall. Stepping in tramples it flat, so you hide behind grass, never inside it.

*How it works (technical).*
- **Flags** [V, S73, S74]. `HIGH_GRASS = PASSABLE | LOS_BLOCKING | FLAMABLE`. Each cell's `losBlocking` feeds the same shadowcaster as walls, `MAX_DISTANCE = 20`.
- **Trample** [V, S72]. Stepping sets `Terrain.GRASS`; the Huntress leaves `FURROWED_GRASS`. Seed chance `1/(25 - 4*naturalism)`, dew `1/(6 - naturalism/2)`. 4 leaf particles burst. FOV is recomputed only if the cell is in the hero's view.
- **Brogue** [V, S75]. `FOLIAGE` has `T_OBSTRUCTS_VISION` and promotes on step to `TRAMPLED_FOLIAGE`, which regrows with `promoteChance = 100`, 1% per turn, mean about 100 turns.

*Cost / performance.* One flag per cell and an FOV recompute on trample, only when visible [V, S72]. Server shadowcasting per walker would be O(r²) with r of 8 to 11 tiles [I]. Client drawing is a tile swap plus 4 particles, under 0.01 ms [I, from S12].

*Games that used it.*
- Shattered Pixel Dungeon: https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/levels/features/HighGrass.java
- Brogue CE: https://github.com/tmewett/BrogueCE/blob/master/src/brogue/Globals.c

*How it feels.* Tense and fair. The ambush comes from the far side, and the trampled path shows where you went [I].

*Risks.* In an MMO every step would change FOV for everyone near; use E4 there. Both codebases are copyleft [I].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 4 · Mood 4 · Interactivity 4

### Family B: Grass ground and tufts

### B1. Variation by position hash, flips and a meadow mood map

*In plain words.* Draw a few grass tiles, flat and textured, and let a hash of each tile's position pick one and its mirroring. A slow pattern across the map picks between two or three colour ramps.

*How it works (technical).*
- **Artist rules** [V, S149, S150]. Slynyrd mixes flat green with textured patches of varying density, keeps clusters wrapping at tile edges, mirrors for new orientations and adds "occasional flower variants". "A good texture may only need a few simple clusters."
- **Hash, not engine random** [V, S107; I, note 08]. Godot terrain painting picks matching variants at random, unseeded by a user function. In an MMO each client could paint a different field. Use `hash(x, y)` like Stardew's per-tile seed [V, S37].
- **Mood map** [V, S112; I, note 08]. A world-space low-frequency noise, sampled with `fract(world_pos * scale)`, picks ramp A, B or C per tile, with world-locked Bayer at the boundary (Fog C1) [S9].

*Cost / performance.* Zero per frame when baked into the tilemap. As a shader, one hash and one palette lookup per pixel; a comparable full-screen 320x180 pass costs 0.0021 ms on the M4 GPU [V, S12]. Zero network bytes.

*Games that used it.*
- Stardew Valley (per-tile seeded tufts): https://raw.githubusercontent.com/veywrn/StardewValley/master/StardewValley/TerrainFeatures/Grass.cs

*How it feels.* The grid disappears; Slynyrd calls one repeated tile monotonous [V, S149]. The ground must stay quieter than anything you can interact with [I].

*Risks.* Continuous tints leave the palette; busy variants everywhere hurt readability [I].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 5 · Mood 4 · Interactivity 1

### B2. 16-tile corner sets and layered partial tiles

*In plain words.* Where grass meets dirt or water, use 16 tiles that only care about corners. Draw grass as a partial layer over the dirt so the edge overlaps.

*How it works (technical).*
- **Counts** [V, S152, S153]. A 2-corner Wang set has 2^4 = 16 tiles. The blob set is a 47-tile subset of the 256-case 2-edge 2-corner set.
- **Layering** [V, S151]. Cut partial textures out so they stack over a base that "loops well on all four sides"; make sides and corners by shaving the base.
- **Budget** [I]. 16 corner tiles x 2 variants is 32 tiles per pair; a blob set with 2 variants is 94. Add a 1 px darker grass lip over the dirt. At water, a 1 to 2 px band of darker, more saturated grass (wet ground, H2).

*Cost / performance.* Zero per frame, it is the tilemap. Art cost is the real cost, 32 against 94 tiles [I]. Wear stages (D5) reuse the same corner set, so a path costs no new art.

*Games that used it.*
- Slynyrd's top-down tile method: https://www.slynyrd.com/blog/2023/3/26/pixelblog-43-top-down-tiles-part-2

*How it feels.* Organic edges for a quarter of the blob art. The overlap reads as depth [I].

*Risks.* Cliffs and paved paths still need the 47-tile blob; single tiles can pinch [I].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 5 · Mood 3 · Interactivity 1

### B3. Tuft sprites and y-sort cover for the lower body

*In plain words.* Tall grass, wheat and flowers are small sprites over the ground, sorted with characters by their bottom edge. Front tufts draw over the legs of anyone standing in them.

*How it works (technical).*
- **Cover strip** [I]. Each tall-grass tile gets a "grass front" overlay, the bottom 10 to 14 px of a 32 px tile, with its sort origin at the tile's bottom edge. Keep it under 40% of the character's height.
- **Godot y-sort** [V, S102; I, note 02]. A single MultiMesh is one canvas item at one depth and cannot interleave with a character. One MultiMeshInstance2D per tile row, its z set from y, gave 1100 FPS on an RX 5700 [V, self-reported, S102]. At 32 px tiles a 180 px view shows 7 to 8 rows, so about 8 draws.

*Cost / performance.* 2,000 tufts in one instanced draw cost 0.012 ms on the M4 GPU; as 2,000 separate draws, 3.27 ms wall [V, S12]. On the CPU canvas path, pixel writes cost 0.051 ms for 2,000 tufts (0.30 throttled), one `drawImage` each 1.62 ms (10.1 throttled), and per-row slicing 12 ms (75 throttled) [V, S12]. SwiftShader pays about 14 µs per quad, 27 ms for 2,000 [V, S12].

*Games that used it.*
- Stardew Valley (tufts y-sorted per tuft): https://raw.githubusercontent.com/veywrn/StardewValley/master/StardewValley/TerrainFeatures/Grass.cs
- Pokémon Emerald (per-object grass sprite): https://github.com/pret/pokeemerald/blob/master/src/field_effect_helpers.c

*How it feels.* The image players remember from Pokémon. Separate tufts can bend away from a walker one by one [I].

*Risks.* Per-node materials pay the separate-draw row; tall alpha sprites add overdraw; items and name plates must draw above the strip [V, S12; I].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 4 · Pixel taste 5 · Mood 4 · Interactivity 4

### B4. One field layer instead of many tuft sprites

*In plain words.* Pre-render a whole grass layer and move it with a shader or in horizontal bands. Every tuft in a band sways together, which is the wave through wheat.

*How it works (technical).*
- **Field shift shader** [V, S12]. One wind-table fetch plus one layer fetch per pixel, sheared per 4-row band. Adding a trail map fetch (bend and darken) costs about 10% more.
- **Procedural blades** [V, S114, S91]. CaptainProton42 draws one blade per pixel from a painted height channel. Jarl regenerates blades from a hash of tile coordinates each frame, with a density texture for blades per tile; developer-reported under 1 ms at 4K on an RTX 3080 Ti, through WebGPU compute [V, self-reported, S91].
- **Re-bake** [V, S12]. Re-baking the whole layer after trampling costs as much as drawing every tuft. Re-bake only the dirty 8x8 cells.

*Cost / performance.* GPU field shift 0.0021 ms at 320x180, 0.015 ms at 720p; with the trail map 0.0029 ms; 6 procedural blades per cell 0.0069 ms [V, S12]. On SwiftShader 0.075 ms, so this is the safe fallback for software GL [V, S12]. CPU row bands 0.11 ms flat, 0.67 throttled; a full re-bake of 8,000 tufts 4.8 ms, 30.5 throttled [V, S12].

*Games that used it.*
- Jarl (hashed 2D grass): https://80.lv/articles/building-procedural-2d-grass-with-gpu-compute |

*How it feels.* Gust waves for free. It cannot bend one tuft away from a walker unless a trail map feeds it [V, S12].

*Risks.* It cannot y-sort with characters; full re-bakes cost as much as drawing everything [I].

*Ratings 1–5 (author judgement):* Simplicity 3 · Speed 5 · Pixel taste 4 · Mood 4 · Interactivity 2

### B5. Flowers and weeds: patches, Poisson scatter and a daily cycle

*In plain words.* Wildflowers grow in clumps. Pick patch areas from a slow noise, scatter flowers inside so they never touch, and close them at dusk.

*How it works (technical).*
- **Scatter** [V, S125]. Bridson's Poisson-disc sampling runs in O(N) in any dimension.
- **Patches** [I]. Threshold a low-res value noise at about 0.6 for patch areas, then Poisson inside with radius 1 to 2 tiles for big blooms and 6 to 10 px for dots baked into tile variants. Mix 2 or 3 species per patch, one dominant at about 70%.
- **Daily cycle** [V, S143]. Dandelion heads close in the evening, often starting between 15:00 and 17:00, and may stay shut on rainy days. A 3-frame sprite (open, half, closed) driven by the global hour costs one integer per flower type [I].

*Cost / performance.* Placement is offline. Per frame, flowers are tufts with another atlas frame, inside the 0.012 ms of 2,000 instanced tufts [V, S12]. Open and close is one uniform per species [I].

*Games that used it.*
- Don't Starve Together (pollinators plant flowers): https://github.com/taichunmin/dont-starve-together-game-scripts/blob/master/scripts/components/pollinator.lua
- Animal Crossing New Horizons (flowers by time and season): https://www.nintendolife.com/guides/animal-crossing-new-horizons-bugs-complete-bug-list-times-locations-prices-how-to-catch-tips

*How it feels.* Clumps look intentional; uniform random looks like noise [I]. Flowers give bees and butterflies a goal.

*Risks.* Flower highlights that share a hue with loot sparkle confuse players [I; S10].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 5 · Mood 5 · Interactivity 2

### Family C: Wind

### C1. Row shear in whole pixels, and the smooth-sway anti-pattern

*In plain words.* Sway a tuft by sliding its top rows by whole pixels. The root stays fixed, the middle moves 1 px, the tip 2 px. Fractions of a pixel smear at 320x180.

*How it works (technical).*
- **Fragment snap** [V, S110]. Compute the offset, multiply by texture width, `round()`, divide back, add to `UV.x`. Time phase is quantised per texel row, phase from world X.
- **Atlas-safe snap** [V, S111]. `floor(local_uv * region_size_px) / region_size_px` through `REGION_RECT`, exposed in Godot 4.5.
- **Why vertex shear smears** [V, S97; I, note 02]. Transform snapping rounds node positions, not a shear inside `vertex()`. A sheared quad samples texels at fractional positions. Quantise in the shader instead: `offset_px = round(amp * f(row, t))`.
- **Profile** [I]. 0 px at the root rows, ±1 px in the middle, ±2 px at the tip. Never rotate.

*Cost / performance.* Our tuft shader snaps per row with `texelFetch`; 8,000 tufts cost 0.056 ms in one draw on the M4 GPU [V, S12]. On the CPU, slicing each tuft into 8 rows at draw time costs 12 ms for 2,000 tufts and is an anti-pattern; pre-baked shear frames cost 1.62 ms and pixel writes 0.051 ms [V, S12].

*Games that used it.*
- Godot Shaders, "Wind with pixel snapping": https://godotshaders.com/shader/wind-with-pixel-snapping/

*How it feels.* Crisp and handmade. One developer said grass without sway looked like "green spikes" [U, S157].

*Risks.* Sub-pixel sway is the cheap-but-ugly branch. With a zoomed camera, snap to art pixels [I].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 5 · Mood 4 · Interactivity 1

### C2. Terraria's cosine wave with a wind gate

*In plain words.* Every grass tile leans with the global wind and adds one cosine wave whose phase follows its column. Below a wind threshold sway is nearly zero.

*How it works (technical).*
- **Wave** [V, S52]. `phase = x*0.5 + (y/100)*0.5`; `s = cos(counter*2π + phase) * 0.5 + WindForVisuals`; returned times `lerp01(0.08..0.18, |wind|)`. Zero below the surface and when the option is off.
- **Derived** [I]. Calm period 180 frames (3.0 s), storm 36 frames (0.6 s). Wavelength 12.6 tiles, about 201 px at 16 px tiles. Crests move about 67 px/s calm, 335 px/s in a storm.
- **Sign** [I]. The `+0.5x` term moves crests toward negative x whatever the wind sign. For Asterion use `phase = dot(tile, wind_dir) * k - ω t`, so crests travel downwind (§7).

*Cost / performance.* One cosine per drawn tile on the CPU, inside the normal sprite draw, and nothing runs off screen [V, S52]. As a shader term it is part of the 0.0021 ms field pass or the 0.012 ms instanced tuft draw [V, S12]. Network: the server wind, a few bytes on change [I].

*Games that used it.*
- Terraria: https://github.com/br4dnblehh/terraria-source-code/blob/main/1.4.4.1/Terraria.GameContent.Drawing/TileDrawing.cs
- Terraria wind (wiki): https://terraria.wiki.gg/wiki/Wind

*How it feels.* Restrained. Calm days stay still, and one lean plus one ripple reads as blown, not dancing [I].

*Risks.* Copy the wave, not Terraria's float rotation; one cosine alone looks mechanical [I].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 4 · Mood 4 · Interactivity 2

### C3. Gusts: two scrolling noises, per-object samples and wind primitives

*In plain words.* Real wind has slow strong gusts and fast weak flutter. Read two scrolling noises at each tuft's root. For storms and spells the server sends a few wind events.

*How it works (technical).*
- **Habel 2007** [V, S120]. Wind is a horizontal offset of the texture lookup read from scrolling noise; the bottom stays fixed. Low-frequency, high-amplitude noise gives gusts; high-frequency, low-amplitude noise gives turbulence.
- **Per object, not per vertex** [V, S86]. Per object keeps the texture intact with few draw calls. 117 HD samples one noise value at each model's world position, rotates the global wind by up to 90 degrees with it, and scales by height [V, S30].
- **One global direction** [V, S90, S88]. Hexaquo found per-blade noise made grass "dancing"; a global direction read as real gusts.
- **Primitives** [V, S121; I, note 09]. Perbet and Cani drive a prairie with breeze, gust, whirlwind and blast primitives. A server record of about 12 bytes per primitive, sent when one starts, lets every client evaluate wind analytically.

*Cost / performance.* Two texture reads per pixel or per tuft. Our tuft shader reads a 128x128 wind texture per instance: 0.012 ms for 2,000 tufts [V, S12]. Primitives cost about 12 bytes each on start [I].

*Games that used it.*
- Ghost of Tsushima: https://gdcvault.com/play/1027214/Advanced-Graphics-Summit-Procedural-Grass
- Old School RuneScape with 117 HD: https://github.com/117HD/RLHD

*How it feels.* The wave through wheat, the most screenshotted grass moment [I]. A blast that flattens grass outward is cheap and readable [I].

*Risks.* Per-tuft noise directions dance [V, S90]; Shadertoy code may be NC [U, S118].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 4 · Mood 5 · Interactivity 3

### C4. Stiffness and per-tuft variation

*In plain words.* Wheat sways more, short grass less, flowers bob late. A hash of position gives each tuft a stiffness and phase, so neighbours never move in lockstep.

*How it works (technical).*
- **Stardew divisor** [V, S36]. Each tuft divides the shake by `1 + r`, r in [0, 1), so neighbours bend 50% to 100% as much.
- **117 HD multipliers** [V, S31, S29]. A 3-bit material flag picks from `{0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0}`. Six wind modes per model, from DISABLED to VERTEX_JIGGLE.
- **Seamless clocks** [V, S69, S70, S97]. Luanti sums smoothed triangle waves at integer frequencies (0.23, 0.11 Hz in x; 0.31, 0.29, 0.13 Hz in z) so its timer wraps at 1,000 s with no jump. Godot's `time_rollover_secs` defaults to 3600; the docs advise below 64, ideally 32, on mobile. Pick periods that divide 32 s [I].

*Cost / performance.* One hash and one multiply per tuft, stored in `INSTANCE_CUSTOM` or computed in the shader [V, S99]. No measurable change to the 0.012 ms instanced draw [V, S12; I].

*Games that used it.*
- Luanti: https://github.com/luanti-org/luanti/blob/master/client/shaders/nodes_shader/opengl_vertex.glsl
- Stardew Valley: https://github.com/AcidicNic/StardewValleyDecompiled1.6/blob/main/StardewValley.TerrainFeatures/Grass.cs

*How it feels.* Variety without chaos; Luanti's slow phase makes a field breathe as one sheet [I].

*Risks.* Too much variation dances; `TIME` can jump on mobile if periods do not divide the rollover [V, S97].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 4 · Mood 4 · Interactivity 1

### C5. Stepped sway at low frame rates

*In plain words.* Pixel art animates at 8 to 12 fps. Sway grass through a few baked poses at a low rate. It looks drawn and costs less.

*How it works (technical).*
- **Quantised time** [V, S108]. Dynamic 2D Grass sets `framerate = 5.0` with `quantised = true`.
- **Craft** [V, S158]. 8 to 12 fps is standard, 3 to 6 frames are enough for effects.
- **Baked lean frames** [I]. Three frames (left 1 px, upright, right 1 px) plus a flattened frame for trampling, indexed by Stardew's shake state machine instead of rotation.

*Cost / performance.* Stepped time changes nothing on the GPU, about 0.012 ms for 2,000 tufts either way [V, S12]. On a CPU path it allows caching. Pre-baked frames cost 1 `drawImage` per tuft, 1.62 ms for 2,000, and a field layer re-baked only on a step can be drawn as 0.11 ms of row bands between steps [V, S12].

*Games that used it.*
- Dynamic 2D Grass for Godot: https://jomoho.itch.io/dynamic-2d-grass/devlog

*How it feels.* Hand-animated, like the walk cycles. Too slow looks like a stutter [I].

*Risks.* Mixing a stepped field with smooth tufts nearby looks inconsistent [I].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 5 · Mood 3 · Interactivity 1

### Family D: Trampling and wear

### D1. Terraria WindGrid: a timestamp per visible tile

*In plain words.* Terraria writes the time and direction into every screen tile a moving player touches. Grass reads the age and pops sideways for a third of a second.

*How it works (technical).*
- **Struct** [V, S53]. One `{int Time; int DirectionX; int DirectionY;}` per tile, sized to the visible area and indexed with `tile % width`.
- **Stamp** [V, S53]. Every frame, scan players that are moving and on screen (up to 255 in multiplayer) and stamp `Time = gameTime` and the sign of their velocity into every tile their hitbox covers.
- **Derived** [I]. Peak 3.5 px offset and 0.35 rad tilt, 0.33 s in all. Fast and springless.
- **For Asterion** [I]. Stamp from every moving entity the client already sees (players, NPCs, sheep), with a 1 to 3 s decay instead of 0.33 s.

*Cost / performance.* 12 bytes per visible tile, under 1 KB for a 320x180 view at 32 px tiles plus margin [I]. Per frame, a stamp per moving walker and a subtraction per drawn tile. Zero network bytes. A comparable byte grid stamps and decays in 0.0023 ms for 10 walkers [V, S12].

*Games that used it.*
- Terraria: https://github.com/br4dnblehh/terraria-source-code/blob/main/1.4.4.1/Terraria.GameContent.Drawing/WindGrid.cs

*How it feels.* A crisp flick as you run through. Tunic tilts each tuft away from the fox by quadrant [V, S92].

*Risks.* 0.33 s leaves no trail; timestamps cannot sum walkers like D2 can [I].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 4 · Mood 3 · Interactivity 5

### D2. Trail maps: one byte per cell, stamped by every walker

*In plain words.* A small grey image lies over the ground. Every walker paints a dot, every frame it fades. Grass reads it to lie flat, half up or upright.

*How it works (technical).*
- **Real sizes** [V, S96, S95]. GDQuest uses a 128x128 never-cleared SubViewport for a 16x16 m plane; Kodeco uses 256x256 for about 20x20 m and says low resolutions are best.
- **CPU byte map** [I]. Skip the SubViewport. A `PackedByteArray` per cell, decremented each frame and uploaded once with `ImageTexture.update()`. R is flatten, G an optional signed push direction.
- **Poses** [I]. Stamp to 255 on contact, decay to 0 over 2 to 4 s. Flat above 170, half up above 60, upright below. Three discrete poses look more pixel-honest than a lerp.
- **Godot 4.7** [V, S105, S106, S113]. `DrawableTexture2D` blits brushes into a texture with add or subtract blend and has a GLES3 path; blit methods are Experimental.

*Cost / performance.* CPU 80x45 bytes with 10 walkers: 0.0023 ms, 0.014 ms throttled; 160x90 with 100 walkers 0.016 ms, 0.094 throttled [V, S12]. A GPU ping-pong costs about 0.008 ms GPU time, flat in walkers [V, S12]. Upload once per frame; the fog study measured a 256x256 R8 upload at 0.016 ms [V, S9]. Zero network bytes [I].

*Games that used it.*
- Ghost of Tsushima (particle grass displacement): https://gdcvault.com/play/1027214/Advanced-Graphics-Summit-Procedural-Grass
- Old School RuneScape with 117 HD (character displacement): https://github.com/117HD/RLHD/blob/master/src/main/resources/rs117/hd/priority_render.glsl

*How it feels.* Players notice grass "that bends when you move past it" [U, S157]. A fading trail shows where a crowd went.

*Risks.* A moving SubViewport needs re-centring; several SubViewports are risky on web [V, S9; I].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 4 · Mood 4 · Interactivity 5

### D3. Crush and recovery (Jahrmann and Wimmer)

*In plain words.* Each tuft has a crush number. Steps raise it, time lowers it, and while it is high the tuft springs back weakly. It never locks flat.

*How it works (technical).*
- **Tip update** [V, S119]. `delta = (r + g + w) * dt + d`, with collision displacement `d` not scaled by dt, so the response is frame-rate independent (eq. 1).
- **Crush** [V, S119]. `eta = max(eta - a*dt, 0)`; each collision adds the squared length of the push (eq. 2).
- **Recovery** [V, S119]. `r = (rest - tip) * s * max(1 - eta, 0.1)` (eq. 3). A crushed blade still recovers at 10%.
- **Measured** [V, S119]. 397,881 blades on a GTX 780M at 1024x768: 8.13 ms per frame with culling, physics 0.547 ms; 12.82 ms without culling.
- **2D port** [I]. 2 bytes per tuft or per 8x8 cell (tip x, crush). With `eta0 = 1` and `a = 0.25/s` the crush fades to zero over 4 s while the spring ramps from 10% to full strength, so a patch rises gradually and is mostly upright after about 2 to 3 s, depending on the stiffness `s`. There is no flat hold followed by a snap. Multiply shader sway by `(1 - crush)`.

*Cost / performance.* Two bytes per cell. Same loop as D2: 0.0023 ms for an 80x45 map with 10 walkers, 0.014 ms throttled [V, S12]. A float multiply-decay map costs 0.0014 ms [V, S12].

*Games that used it.*
- Responsive Grass demo (research code): https://github.com/klejah/ResponsiveGrassDemo

*How it feels.* Grass lies down, twitches in wind and stands a beat after you leave [I].

*Risks.* The spring needs C1's snap at the output; nothing was measured on web [I].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 4 · Mood 4 · Interactivity 5

### D4. Rustle: frames, leaves and sound on entry

*In plain words.* When someone steps into tall grass, play a quick shake, toss a few leaves and a soft swish.

*How it works (technical).*
- **Pokémon** [V, S13]. 4 frames then rest, 50 ticks, about 0.83 s; long grass 26 ticks.
- **SPD** [V, S72]. 4 leaf particles per trample.
- **Stardew** [V, S36, S51]. The shake decays in about 0.73 s; `grassyStep` plays only on screen and only once at a time.
- **Minecraft** [V, S64]. Leaf litter rustles when walked through, a per-block footstep sound.
- **MMO leak** [I]. A rustle sent to all spectators on every hidden step reveals the path. Play it only for walkers the client can see.

*Cost / performance.* One 4 to 5 frame sprite and 4 particles per entry. Pollen-like particles update in 0.0031 ms per 500 and draw as pixel writes in 0.012 ms [V, S12]. Zero network bytes.

*Games that used it.*
- Pokémon Emerald: https://github.com/pret/pokeemerald/blob/master/src/data/field_effects/field_effect_objects.h
- Shattered Pixel Dungeon: https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/levels/features/HighGrass.java

*How it feels.* The feedback players praise most; Eastward's reviewer noticed grass that "sways as John and Sam pass by" [V, S156].

*Risks.* A sound per tuft becomes noise; keep one voice [V, S51]. Hidden steps must not rustle for blind viewers [I].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 5 · Mood 4 · Interactivity 5

### D5. Desire paths: Helbing's ground comfort and step counters

*In plain words.* Where many people walk, grass wears to dirt over days; elsewhere it grows back. One number per tile, pushed by steps and pulled back by time.

*How it works (technical).*
- **Helbing** [V, S122]. `dG/dt = (G0 - G)/T + I (1 - G/Gmax) Σ steps`. T is durability, I footprint intensity, Gmax saturation. `kappa = I*T/sigma²` sets direct paths against a shared network. No numeric values in the paper.
- **Ecology** [V, S123, S124]. Cole trampled 18 vegetation types at 0 to 500 passes. Low, flexible grasses resist best; bud position decides recovery.
- **Mods** [V, S67, S68]. Step Erosion turns grass to dirt after 20 steps, path after 50, revert after 72 h idle (5,184,000 ticks at 20 per second).
- **For an MMO** [I]. G as uint8 per tile on the server, ticked once a minute. Show 3 or 4 stages through the existing corner set. Count unique walkers per hour in busy towns, or 20 to 50 steps per stage turns a square to mud in minutes. Fade unused paths over 1 to 3 real days.

*Cost / performance.* One byte per tile, a slow server tick, and a 9-byte update only when a tile crosses a stage [I]. A 256x256 full scan costs 0.055 ms in JS [V, S12]. About 135 B/s per viewer at first while 100 players cut new paths, near zero once paths settle [I].

*Games that used it.*
- Foundation: https://www.pcgamer.com/you-dont-have-to-place-roads-in-this-medieval-city-builder-thanks-to-your-citizens-feet

*How it feels.* The world remembers its players, and paths show where the crowd really goes [I].

*Risks.* Single-player thresholds turn a town square to mud; worn tiles must stop hiding (E4) [I].

*Ratings 1–5 (author judgement):* Simplicity 3 · Speed 5 · Pixel taste 4 · Mood 5 · Interactivity 5

### Family E: Cut, burn, graze, regrow and hide

### E1. Random ticks and spread rules

*In plain words.* Each tick, pick a few random tiles and roll for growth or spread. Edges creep back unevenly, and cost follows the picks, not the grass.

*How it works (technical).*
- **Minecraft** [V, S59, S60]. `randomTickSpeed = 3` blocks per 16x16x16 section per tick; a block is ticked every 68.27 s on average. Grass tries 4 positions in a 3x5x3 box and needs light 9 or more.
- **Luanti** [V, S71]. ABM grass spread: `interval = 6`, `chance = 50`, light 13 or more, so about 300 s mean per eligible dirt node [I].
- **Stardew** [V, S38]. A daily 65% growth check; a full tile spreads 1 to 2 tufts to each tillable neighbour at 25%, so a 1-tile bare strip closes in about 6 days [I].

*Cost / performance.* About 3 ns per picked cell regardless of grid size. 256 picks cost 0.0008 ms, 0.005 ms throttled; 65,536 picks 0.19 ms [V, S12]. A full-scan automaton costs 0.055 ms at 256x256 and 0.89 ms at 1024x1024 (5.2 throttled) [V, S12]. Network: one tile update per visible stage change [I].

*Games that used it.*
- Minecraft: https://minecraft.wiki/w/Grass_Block
- Luanti (minetest_game): https://github.com/luanti-org/minetest_game/blob/master/mods/default/functions.lua

*How it feels.* Patchy, organic regrowth, good for grass reclaiming a path [I].

*Risks.* Over unloaded MMO areas it wastes work, and each change costs a packet [I].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 3 · Mood 3 · Interactivity 3

### E2. Decay timers on changed tiles, lazy stages and server bytes

*In plain words.* Only changed tiles carry state, what happened and when. The server computes the stage when someone looks and sends a small update when it changes.

*How it works (technical).*
- **Lazy evaluation** [I]. Store `changed_at`; compute the stage when a chunk is sent. A coarse sweep every 10 to 60 s over changed tiles in watched areas emits stage changes.
- **Packet** [V, S23; I, note 03]. `0x6B` + 5-byte position + stackpos + 2-byte item, about 9 bytes before framing, only to players who can see the tile.
- **Bandwidth** [I]. 100 players crossing a field: 200 to 300 step events per second, no packets per step, at most 10 to 15 stage changes per second at first, about 135 B/s per viewer. Syncing flatten per walker at 10 Hz to 50 viewers would be about 450 KB/s.

*Cost / performance.* Untouched grass costs nothing. A fully worn 256x256 field would need 1 to 2 MB at worst; real fields need tens of KB [I]. About 9 bytes per visible change [I].

*Games that used it.*
- Tibia (TFS decay): https://github.com/otland/forgottenserver/blob/master/src/game.h
- Don't Starve Together: https://dontstarve.wiki.gg/wiki/Regrowth

*How it feels.* Invisible when it works. Players see a shared field that heals at a steady pace.

*Risks.* A per-second sweep wastes work at field scale; client prediction must accept correction [I].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 3 · Mood 2 · Interactivity 4

### E3. Cut, burn and graze as a stage ladder

*In plain words.* Cutting, burning and grazing push a tile down one ladder: tall, short, stubble, burnt. Regrowth climbs back on one timer chain.

*How it works (technical).*
- **Ladder** [V, S76]. Cataclysm DDA: `t_grass_tall` (head high, move cost 5, coverage 50) to `t_grass_long` (shin high, move cost 3) to `t_grass`, each `transforms_into` the next when cut or grazed.
- **Cutting** [V, S21, S38]. TFS scythe drops a bunch of wheat and leaves stubble.
- **Burning** [V, S94, S93, S78]. BotW grass burns, spreads with wind and makes an updraft players glide on. DST burnt tufts leave ash and no tuft. Fire spread itself is study #6 [S7].
- **Grazing** [V, S61, S77]. Minecraft adults graze at 1/500 every other tick, about every 50 s; babies 1/25 [I]. Dwarf Fortress grazing erodes grass like trampling.

*Cost / performance.* One extra stubble and one charred sprite per grass type, plus a 2 to 4 frame clipping burst [I]. The server pays a stage write and a 9-byte update per change [I]. A grazing sheep is one more walker in the trail map, 0.0023 ms for 10 [V, S12].

*Games that used it.*
- Cataclysm DDA: https://github.com/CleverRaven/Cataclysm-DDA/blob/master/data/json/furniture_and_terrain/terrain-flora.json
- Minecraft (sheep): https://minecraft.wiki/w/Sheep
- Breath of the Wild (burning grass): https://twinfinite.net/?p=264104

*How it feels.* Tools that change the world; a burnt patch greening over minutes tells a story [I].

*Risks.* Too many stages cost art; MMO burning needs server rules against griefing [I].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 4 · Mood 4 · Interactivity 5

### E4. Hiding in tall grass: the server rule and how to draw it

*In plain words.* A player in untrampled tall grass is hidden from anyone outside the patch who is not adjacent. The server does not send them. The owner sees a dithered self.

*How it works (technical).*
- **League brush** [V, S80]. "Not a form of stealth". Wards inside see in. Targeted attacks from brush reveal a 300-unit radius for 2 s.
- **Server withholds** [V, S81, S82]. The server "withholds information about the positions of enemies". VALORANT's shipped check uses under 2% of server frame time, down from 50% [V, self-reported, S81].
- **Asterion rule** [I]. Visible if same party, Chebyshev distance 1, same patch id, or a reveal effect. Attacking or casting sets `revealedUntil = now + 2000 ms`. Delay the remove by 300 to 500 ms against flicker. Send the add at distance 2 and closing so ping does not pop a monster on top of you.
- **Owner view** [V, S83, S85; I, note 04]. Brawl Stars makes your character transparent and teammates see you. For pixel art, a 50% world-locked checker or a 2-colour dark palette plus a team outline; avoid smooth alpha below 0.6.

*Cost / performance.* A few integer compares per spectator pair, inside TFS's existing spectator loop [I]. A hidden walker sends zero move packets to blind viewers; each hide or reveal is one remove or add, roughly 40 to 60 bytes [I]. The owner shader is one texture read and a compare [I].

*Games that used it.*
- League of Legends: https://wiki.leagueoflegends.com/en-us/Brush
- Pokémon Unite: https://gamewith.net/pokemon-unite/article/show/29470

*How it feels.* Players forgive almost any rule if the screen shows it [I], as Mark of the Ninja's binary rule shows [V, S85].

*Risks.* Adjacency alone makes a big field mutually blind; unseen area hits need sparks; trampled tiles stop hiding [I].

*Ratings 1–5 (author judgement):* Simplicity 3 · Speed 5 · Pixel taste 4 · Mood 4 · Interactivity 5

### E5. The TFS invisibility anti-pattern

*In plain words.* TFS sends invisible players to everyone, without an outfit. A modified client draws them anyway. Grass hiding must never copy this.

*How it works (technical).*
- **The filter** [V, S24; lead check]. `Player::canSeeCreature` (src/player.cpp, about line 723) returns false for an invisible creature only when `!creature->getPlayer()`. Invisible players pass.
- **The packet** [V, S23; lead check]. `ProtocolGame::AddCreature` (about line 3431) sends an empty outfit for invisible or ghost creatures, but position, direction and light still go out. Only ghost mode is filtered, by `canSeeGhostMode`.
- **The hook works** [V, S23, S25]. Creatures that fail `canSeeCreature` are skipped in tile descriptions, and creatures drop follow or attack targets they cannot see. So the fix is a rule, not new plumbing.

*Cost / performance.* It costs the same bytes as a visible creature, roughly 40 to 60 per add plus every move [I]. The cost is trust. Any hiding the client enforces is a maphack waiting to happen [I].

*Games that used it.*
- Tibia servers on TFS: https://github.com/otland/forgottenserver/blob/master/src/player.cpp

*How it feels.* To a cheater, invisible is a name and a position on screen [I].

*Risks.* This is the risk. Put E4's rule in `canSeeCreature` so hidden creatures are never sent [I].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 1 · Mood 1 · Interactivity 2

### Family F: Flying life

### F1. Butterflies: the flap-hop

*In plain words.* Each wingbeat kicks the butterfly up and sideways; gravity pulls it down between beats. The body moves only when the wings do.

*How it works (technical).*
- **Stardew code** [V, S39]. `flapSpeed = Random(45, 80)` ms per frame, rolled once per butterfly. Spring uses a 4-frame flap, summer 6. After each flap, 200 ± 5 ms of rest. On a flap, `motion.X += Random(-80, 81)/100`, `motion.Y = (Random() + 0.25) * -1.5`, clamp X to 1.5. Each frame, add `motion * mult`, add 0.005 per ms to Y, subtract 0.0005 per ms from `mult` (gone in 2 s).
- **Flap rate** [lead check; I]. 4 or 6 frames of 45 to 80 ms plus 200 ms rest is roughly 2 to 5.6 flaps per second. A real cabbage white beats at 11.8 ± 2.1 Hz [V, S128]. At 60 fps 11 Hz would alias, so the slow game rate is the readable choice.
- **Scaled for 32 px tiles** [I]. Halve Stardew's world numbers: side cap about 0.75 px per frame (45 px/s), up-kick 0.2 to 0.9 px per frame, gravity about 0.04 px per frame². Cruise at 25 to 50 px/s.

*Cost / performance.* 1,000 butterflies update in 0.012 ms, 0.071 throttled; drawing them with one canvas call each costs 0.69 ms, 4.2 throttled [V, S12]. As GPU instances, 1,000 quads cost about 0.005 ms [V, S12]. Zero network bytes.

*Games that used it.*
- Stardew Valley: https://github.com/veywrn/StardewValley/blob/master/StardewValley/BellsAndWhistles/Butterfly.cs
- Terraria: https://terraria.wiki.gg/wiki/Butterfly

*How it feels.* Alive with almost no code. Players read rhythm, not frequency [I]. Per-butterfly flap speed keeps groups out of sync [V, S39].

*Risks.* Add a 1 px shadow in 3/4 view; two or three on screen read better than twenty [I].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 5 · Mood 5 · Interactivity 3

### F2. Bees: short hops between flowers

*In plain words.* A bee flies straight to a nearby flower, sits longer than it flew, then hops on. The hop-and-sit rhythm reads as a bee.

*How it works (technical).*
- **Biology** [V, S129, S130]. Honeybees hover at about 230 Hz with a 90° stroke. Bumblebees take a median of about 2 s between flowers of one species and 3 to 6 s when switching species. Time on flowers exceeds time in flight [V, note 05].
- **Minecraft** [V, S62]. Forage up to 22 blocks; circle a flower for over 400 ticks (20 s) for nectar; home in rain and at night for at least 2,400 ticks.
- **Loop** [I]. Pick a flower within 3 to 5 tiles, fly about 0.5 to 1 s with a 1 px bob at 4 to 6 Hz, sit 1 to 2.5 s (longer than the flight, so flower to flower stays near the 2 s median) with a 2-frame wing blur at 30 to 50 ms, repeat 3 to 8 times, leave the screen.

*Cost / performance.* A target, a timer and an eased move, at the same scale as butterflies, about 0.0025 ms for 200 [V, S12]. Draw cost as instanced quads [V, S12].

*Games that used it.*
- Minecraft: https://minecraft.wiki/w/Bee

*How it feels.* Busy and purposeful beside the butterfly's drift [I].

*Risks.* A 230 Hz flap drawn as frames strobes; use a blur frame [I].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 4 · Mood 4 · Interactivity 2

### F3. Dragonflies: dart and hover over water

*In plain words.* A dragonfly hangs still, shoots to a new spot in a fraction of a second, and hangs still again.

*How it works (technical).*
- **Biology** [V, S131, S132, S133]. Take-off acceleration 15 to 20 m/s² within 1 to 2 wingbeats. Hover is forward flight under 0.25 m/s; patrol about 1.62 m/s; chases 2.75 m/s. Territorial males fly about 50 cm above water.
- **Terraria** [V, S56]. Day only, wind under 20 mph, and a cattail within a 61x41 tile box; it spawns on the cattail. Colour by biome. It flies up and away on approach.
- **State machine** [I]. HOVER 0.8 to 3 s with 0 to 1 px drift. DART 0.1 to 0.25 s to a point 1 to 3 tiles away, sharp start, soft stop. Every 3 to 6 darts, return near a home point over water (territory 3 to 5 tiles). Start the dart on a wing-down frame.

*Cost / performance.* A two-state timer per insect, same scale as butterflies, about 0.0007 ms for 50 updates [V, S12]. One instanced quad each.

*Games that used it.*
- Terraria: https://terraria.wiki.gg/wiki/Dragonflies

*How it feels.* Electric. Reeds as anchors teach where water is [I].

*Risks.* Spawning on a visible cattail pops in [V, S56]; free rotation smears.

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 4 · Mood 4 · Interactivity 3

### F4. Midges: a swarm held by a spring

*In plain words.* Gnats have no shared heading. Each flies fast and is pulled back to the centre, harder the farther it strays.

*How it works (technical).*
- **Kelley and Ouellette 2013** [V, S134]. 12 to 111 midges, swarms 20 to 30 cm on edge. Radius grows as N^(1/3). Polarisation at most 0.09, no net direction. Straight flight for about 0.5 s, then a turn. Pull toward the centre grows linearly with distance, stiffer horizontally than vertically. Swarms form over a dark marker.
- **Per midge** [I]. `a = -k (p - centre) + jitter`; `v = (v + a dt) * 0.96`; `p += v dt`; draw 1 px at `round(p)`. Use `k_y = 0.5 k_x`, so in top-down the cloud bobs taller than wide. Radius 6 to 12 px, 8 to 30 pixels, one dark colour, update at 15 to 30 Hz.

*Cost / performance.* About 30 points with 3 adds each [I]. Pixel writes for 500 one-pixel particles cost 0.012 ms to draw and 0.0031 ms to update [V, S12].

*Games that used it.*
- Rain World (cosmetic swarms): https://rwmodding.github.io/api/Global.InsectCoordinator.html

*How it feels.* Dusk by a pond in one cheap effect; a swarm over a post explains itself [I].

*Risks.* Boids are heavier and too aligned; k and jitter are tuning values [I].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 4 · Mood 4 · Interactivity 2

### F5. Moths: orbiting the lamp

*In plain words.* Moths keep their back to the light, which sends them sideways around it. Draw them circling, stalling and sometimes diving across.

*How it works (technical).*
- **Fabian et al. 2024** [V, S135]. 477 field recordings. Insects "do not steer directly toward the light". They tilt the dorsum toward it, which gives flight perpendicular to the source. Three motifs: orbiting, stalling (climb until progress stops), inverting (flip over and dive). Under 2% of dark-condition videos showed them. Insects swapped orbit direction in 25 of 37 trials when the light toggled.
- **Controller** [I]. Tangent velocity `perp(to_light / r) * dir`, plus a radial term `(r - r_orbit) * k`, lerped 0.1 per frame with noise. Every 2 to 6 s, a chance to stall (speed to 0 over 0.4 s) or dive (cross the centre, flip `dir`). Ring 6 to 16 px, 2 to 6 moths per lamp.

*Cost / performance.* A few float ops per moth per frame, about 0.0007 ms for 50 [V, S12]. Lamps exist already in study #5 [S6].

*Games that used it.*
- Animal Crossing New Horizons: https://nookipedia.com/wiki/Moth

*How it feels.* Correct and cosy; the orbit flip matches the 25-of-37 observation [I].

*Risks.* Moths flying straight into the lamp look wrong [V, S135].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 4 · Mood 5 · Interactivity 2

### Family G: Fireflies, ground critters, seeds and spawning

### G1. Fireflies: rare blinks and pulse-coupled sync

*In plain words.* Each firefly's clock fills, flashes and restarts. Seeing a neighbour flash nudges it forward. Over half a minute a meadow falls into step.

*How it works (technical).*
- **P. pyralis, solo** [V, S136, S139]. One long J-shaped flash, waist high. Interval 5.9 ± 0.6 s is Lloyd 1966 via a secondary source; flash length 0.3 to 0.75 s spans secondary sources (lead label).
- **P. carolinus, synchronous** [V, S136, S137]. Bursts of 5 to 8 flashes of 100 to 150 ms about 0.55 s apart, then 8 to 10 s dark; bursts repeat about every 12 s. Periodic bursts only in groups above 15 males [V, S138]; about 20 start regular synced bursts [V, S140].
- **Nicky Case defaults** [V, S115]. 150 flies per 1280x600, clock speed 0.3 per s (3.33 s period), radius 200 px, `clock += clock * 0.035` per neighbour flash, flash alpha times 0.9 per frame.
- **Sandbox scale** [I]. 8 to 15 flies per screen, 30 to 40 on a rare firefly night. Radius about 1.5 tiles (48 px at 32 px tiles). Drift 4 to 10 px/s. Flash rises in 1 frame and falls over 0.3 to 0.5 s; raise the sprite 2 to 3 px during it. Sync emerges in 20 to 60 s. Walking through adds phase noise.
- **MMO** [I]. Phase from a hash of tile and server time gives every client the same pulse with zero bytes; run real coupling only in a local showpiece.

*Cost / performance.* Pulse coupling only works when someone flashes, about 6,750 checks per second for 150 flies [I]. Our phase-coupling bench, which does trig every frame, costs 1.14 ms for 1,000 flies with a naive pair loop, 0.42 ms with a grid and 0.067 ms with a per-cell mean field; 200 flies cost 0.013 to 0.049 ms [V, S12].

*Games that used it.*
- Nicky Case, Fireflies: https://ncase.me/fireflies/
- Terraria (fireflies, per-night rolls): https://terraria.wiki.gg/api.php?action=parse&page=Firefly&prop=wikitext&format=json

*How it feels.* Magic if rare and slow; real pyralis is lit about 8% of the time [I]. A slow fall reads as glow, a square blink as a cursor [I]. Stardew's fireflies never blink [V, S40].

*Risks.* Over 25% lit, merging white halos or speeds above 20 px/s read as noise [I].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 5 · Mood 5 · Interactivity 3

### G2. Glow with pre-drawn halo sprites

*In plain words.* Do not give each firefly a light. Draw a bright pixel, a plus halo one shade down and a dithered diamond two down, in four frames.

*How it works (technical).*
- **Godot limits** [V, S103]. GLES3 canvas: an item takes at most 15 lights, a render 256, or 64 when the uniform buffer is under 64 KB.
- **Stardew** [V, S40, S49]. One `LightSource` per firefly, radius 0.4 to 0.5, `Color.Purple * 0.8`, into a quarter-resolution lightmap applied by reverse subtract, which likely leaves a green-yellow tint [I].
- **Halo** [I]. 1 px core in the brightest entry, 3x3 plus one step down, optional 5x5 diamond with 50% checker two steps down. A 4x8 px strip. Palette steps with normal alpha keep colours legal; additive halos overlap into off-palette white.
- **Light map** [S6; I, note 06]. To light the grass, stamp one texel per firefly into study #5's low-res light map.

*Cost / performance.* 1,000 instanced additive 9x9 halos cost 0.0047 ms at 320x180 and 0.014 ms at 720p on the M4 GPU, but 13.8 ms on SwiftShader [V, S12]. On the CPU a per-pixel radial loop beats sprites: 200 glows 0.052 ms against 0.19 ms; an 80x45 light map costs a flat 0.17 ms [V, S12].

*Games that used it.*
- Stardew Valley: https://github.com/AcidicNic/StardewValleyDecompiled1.6/blob/main/StardewValley.BellsAndWhistles/Firefly.cs
- Hollow Knight (Lumafly Lantern): https://hollowknight.wiki/w/Lumafly_Lantern

*How it feels.* Soft and on-palette; the atlas also serves breathing mushrooms and wisps [I].

*Risks.* A PointLight2D per firefly passes the caps and lights pop [V, S103].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 5 · Mood 5 · Interactivity 1

### G3. Ground critters: flee, hop and flush from grass

*In plain words.* A rabbit nibbles, then bolts straight for a bush when you come close. Cutting grass sometimes flushes a cricket. No pathfinding, just a slow check and a scripted escape.

*How it works (technical).*
- **Stardew** [V, S41, S42, S43, S44]. Gravity 0.25 per update on a fake jump height, with a shadow that scales with height. Rabbits poll every 200 ms, trigger on being on screen, run 6 px per update with a 6-frame loop of 40, 40, 40, 100, 70, 40 ms, and dive into a bush. Frogs leap within 6 tiles with `dy = -6`, about 0.8 s and 1.1 tiles high [I].
- **DST hysteresis** [V, S79]. Brain ticked every 0.25 s. Flee within 3 units and stop at 6, or within 5 and stop at 10.
- **Flush** [V, S46, S58, S164]. Stardew: 2% frog per cut weed. Terraria: grasshoppers from broken tall grass, gold at 1/400. BotW: crickets hop a couple of times, then fly off unless Link sneaks.
- **Kingsfoil table** [I, note 07; lead label]. Rabbit flee 4, stop 8 tiles; frog 3 tiles; cricket 1 to 3% per tall-grass tile entered with a per-player cooldown, 1-tile hops with an 8 px peak in about 0.45 s; lizard 1 tile, dart 2 to 3 tiles in 0.2 s. These are the researcher's scaling, not shipped values.

*Cost / performance.* A timer, a few distance checks and an integer move: 100 critters well under 0.1 ms in GDScript [I]; our 1,000-butterfly update with flee costs 0.012 ms in JS [V, S12].

*Games that used it.*
- Stardew Valley: https://github.com/veywrn/StardewValley/blob/master/StardewValley/BellsAndWhistles/Rabbit.cs
- Don't Starve Together: https://github.com/taichunmin/dont-starve-together-game-scripts/blob/master/scripts/brains/rabbitbrain.lua
- Breath of the Wild (crickets): https://www.zeldadungeon.net/wiki/Restless_Cricket

*How it feels.* The idle loop and the escape burst make it alive [I]. Alba's early creatures looked "a bit robotic" [V, S159].

*Risks.* Flushing on every step spawns swarms; use a cooldown [I].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 4 · Mood 4 · Interactivity 5

### G4. Seeds, pollen and petals on the wind

*In plain words.* Dozens of specks drift with the wind, sink slowly and catch a lift. They wrap around the view, so none spawn or die.

*How it works (technical).*
- **Stardew debris** [V, S48, S47]. 16 to 63 particles on a debris day, by season. Each moves `dx + globalWind` and `dy + 0.5` per update, `globalWind = -0.25`. Animation ticks every 100 ms with a -24 to +24 ms offset each. A "blowing" state at 0.1% per update lifts them. Fall gusts grow 2% per update up to -5 and play a wind sound.
- **Dandelion** [V, S141, S142]. Terminal velocity 39.1 cm/s. More than 0.05% of seeds travel beyond 100 m, mostly on updrafts.
- **Scaled** [I]. About 12 px/s fall at 32 px per metre. A seed from 1 m lands in about 2.5 s, about 2.5 tiles downwind in a 1 m/s breeze. Show fall as a sprite sinking toward a 1 px shadow.

*Cost / performance.* 500 motes update in 0.0031 ms and draw as pixel writes in 0.012 ms (0.071 throttled); one `fillRect` each costs 0.094 ms [V, S12]. One instanced draw on the GPU.

*Games that used it.*
- Stardew Valley: https://github.com/veywrn/StardewValley/blob/master/StardewValley/WeatherDebris.cs

*How it feels.* The cheapest seasonal mood in any shipped game [I].

*Risks.* Screen-space wrap slides with the camera; wrap in world space [I].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 4 · Mood 4 · Interactivity 1

### G5. Spawn tables, anchors and pools

*In plain words.* A table of biome, season, hour and weather picks creatures. They spawn on features that explain them, off screen, under a cap, seeded so every client agrees.

*How it works (technical).*
- **Stardew** [V, S45]. No critters at all in rain. Base chance `clamp(mapArea / 15000, 0.15, 0.5)`. Cap of 10 per location, 20 in summer. Butterflies spring and summer before 15:00, fireflies on summer nights. Each spawn brings another within 2 tiles with 40%.
- **Terraria** [V, S55, S57]. Daily rolls: 7/15 of days have no butterflies; 1/3 of nights no fireflies, 1/9 a firefly night. No flyers in wind over 20 mph.
- **For Asterion** [I]. Seed from `hash(chunkX, chunkY, timeBucket, worldSeed)` with 30 to 60 s buckets. 4 to 8 ground critters and about 4 flyers visible. Server entities only for critters that can be caught, killed or drop loot.

*Cost / performance.* A table lookup per spawn attempt every few seconds. Updates are microseconds (F1, G3). A server-side critter at 10 updates/s x 8 bytes per watcher is real bandwidth; a client-only one costs nothing [I].

*Games that used it.*
- Stardew Valley: https://github.com/veywrn/StardewValley/blob/master/StardewValley/GameLocation.cs
- Don't Starve Together: https://github.com/taichunmin/dont-starve-together-game-scripts/blob/master/scripts/components/butterflyspawner.lua

*How it feels.* Anchored spawns look intentional, and weather that swaps the cast feels real [I]. Ghost of Tsushima's designers say animals give biomes identity [V, S160].

*Risks.* Client-only critters diverge once they react to a player; pop-in breaks the illusion [I].

*Ratings 1–5 (author judgement):* Simplicity 3 · Speed 5 · Pixel taste 3 · Mood 4 · Interactivity 3

### Family H: Seasons, biomes, accessibility and performance

### H1. Season palettes with per-tile phenology offsets

*In plain words.* Swap the grass palette per season, but give each tile an offset from a hash, its height and moisture, so the field turns patch by patch.

*How it works (technical).*
- **Stardew** [V, S50, S37]. Full per-season tilesheets with identical layouts. Since 1.6 winter grass is dormant [V, S38].
- **Stardew colours** [V, S37; I, note 08]. Spring (60,180,58) at hue 119, summer (110,190,24) at hue 89, fall (219,102,58) at hue 16. Real grass goes to straw at hue 40 to 50, not orange.
- **Phenology** [V, S144, S145]. Spring comes about 4 days later per degree north or 400 ft up. The Alps shift is now about 22 days per 1000 m.
- **Shader** [I]. `p = hash(x,y)*0.25 + elevation + moisture`, `season = floor(t + p)`, ordered-dither crossfade over 0.05 season. Spend fewer days on green-up than on browning. The server sends only `season_t` per region.
- **Ramps** [V, S154, S155; I, note 08]. 4 to 5 greens, highlights toward yellow, shadows toward teal, 15 to 25 degrees of shift. The 5-colour ramp is the researcher's proposal (lead label).

*Cost / performance.* One hash and one palette lookup per pixel, a pass like the 0.0021 ms field shift at 320x180 [V, S12]. One float per region per minute on the network [I].

*Games that used it.*
- Stardew Valley: https://stardewvalleywiki.com/mediawiki/api.php?action=parse&page=Modding:Maps&prop=wikitext&format=json
- Pokémon Black and White (monthly seasons): https://m.bulbapedia.bulbagarden.net/wiki/Season_(mechanic)

*How it feels.* A world with a calendar; a field browning from the ridges down costs nothing [I].

*Risks.* Stardew's orange fall is stylised; a one-frame switch reads as a bug [I].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 5 · Mood 5 · Interactivity 1

### H2. Wet, dry, frost and snow grass

*In plain words.* After rain grass gets darker and more vivid, paths much darker. Drought turns it straw. In snow, only tall tips poke through.

*How it works (technical).*
- **Wet** [V, S147, S148]. Wet rough surfaces darken because light is trapped in the water film; sand albedo went from 0.182 to 0.091. Wet grass looks more vivid because the film smooths the blade.
- **Recipe** [I]. Grass one ramp step down in shadows and +10% saturation; dirt two steps down; 1 px glints on tuft tips for 1 to 3 frames, only after rain. Rain study #3 owns puddles [S4].
- **Dry** [I]. A separate straw ramp, desaturated yellow-ochre, not a brown tint of green.
- **Snow** [S2; I, note 08]. Tufts taller than the snow depth show their top 1 to 3 px as dark dots; deeper snow hides them. Reuse study #1's depth map.

*Cost / performance.* Palette operations, one lookup per pixel inside the same pass [I]; 0.0021 ms class [V, S12]. Glints are a few particles.

*Games that used it.*
- Stardew Valley (frost grass): https://raw.githubusercontent.com/veywrn/StardewValley/master/StardewValley/TerrainFeatures/Grass.cs

*How it feels.* Weather you see on the ground; tips through snow are the best winter read at 320x180 [I].

*Risks.* Alpha washes muddy the palette; dew can make grass lighter [U, note 08].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 5 · Mood 5 · Interactivity 1

### H3. Biome colour from a temperature and moisture table

*In plain words.* Minecraft picks grass colour from temperature and rainfall. For pixel art, pick one of six to eight ramps from a tiny table, and let moisture set tuft density.

*How it works (technical).*
- **Minecraft** [V, S66, S65]. A 256x256 `grass.png` indexed by temperature and downfall, both clamped to 0 to 1, downfall times temperature, so samples stay in a triangle. A biome may override with a fixed hex.
- **Density** [V, S146]. Grassland NDVI 0.2 to 0.5 against forest 0.6 to 0.9; soil shows through sparse grass.
- **Asterion** [I]. Two bytes per region, temperature and moisture, pick a ramp. Meadow 3 to 4 tufts per tile; savanna 1 to 2 tall thin tufts with dirt showing; swamp reeds within 1 to 2 tiles of water; tundra flat mats; desert scrub 0 to 1 and no sway. Keep one corner template for all.

*Cost / performance.* One table read per tile at bake time or one lookup per pixel [I]. Two bytes per region [I].

*Games that used it.*
- Minecraft: https://minecraft.wiki/w/Custom_biomes

*How it feels.* Believable biome blends; silhouette and density do more than colour [I].

*Risks.* Continuous tints break palette discipline [I].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 4 · Mood 3 · Interactivity 1

### H4. Batching, MultiMesh rows and Godot's limits

*In plain words.* Draw every tuft from one atlas with one material in a few batches, and know the engine's limits.

*How it works (technical).*
- **Batching** [V, S98]. Compatibility batches 2D draws; Vulkan renderers do not. A MultiMesh is one draw and is culled as one rect [V, S168].
- **Limits** [V, S97]. 16,384 canvas commands per viewport update, extras "ignored". `time_rollover_secs` 3600 by default, below 32 advised on mobile.
- **Instance data** [V, S99, S100, S101]. `INSTANCE_CUSTOM` for phase and stiffness. Per-instance uniforms came to canvas shaders in 4.4; one 4.5 user hit web trouble with them on a shared material.
- **Mobile evidence** [V, self-reported, S165]. Packing 250 loose sprites into 4 atlases cut draw calls from 240 to 38 and raised one Android phone from 31 to 60 fps. iOS A14 instancing was slow until the ANGLE Metal backend fix in 2021 [V, S166].

*Cost / performance.* The measured gap is the point: 8,000 tufts in one draw 0.056 ms, as 8,000 draws 13.1 ms on the M4 [V, S12]. About 1.6 µs wall per WebGL draw call in Chrome on the M4; a low-end phone may be 5x to 10x slower [V, S12; I, note 11].

*Games that used it.*
- Cornucopia (2,583 plants in 3 draw calls): https://discussions.unity.com/t/cornucopia-raw-dev-log-1-gpu-instancing-or-how-2-583-plants-became-3-draw-calls/1715462/1

*How it feels.* Players never see it; they feel a smooth frame on a cheap phone.

*Risks.* Godot's own per-node and y-sort costs were not measured; software GL needs the field shader [V, S12].

*Ratings 1–5 (author judgement):* Simplicity 3 · Speed 5 · Pixel taste 3 · Mood 2 · Interactivity 1

### H5. Reduce motion and low-end grass toggles

*In plain words.* Give players switches. Reduce motion stops sway and calms creatures. Separate toggles turn off grass decoration, wind and walker reaction.

*How it works (technical).*
- **Guidelines** [V, S161, S162, S163]. Offer an option to hide background movement (intermediate level). Moving repeated patterns over 25% of the screen are flagged at basic level. Xbox XAG 117 covers motion settings.
- **117 HD** [V, S28]. "Wind displacement" and "Character displacement" are separate toggles, both on by default.
- **RuneScape and UO** [V, S32, S33, S34, S35]. RuneScape has a ground decoration on/off option for things "like stones and long grass". ClassicUO's `HideVegetation` skips statics listed in a user-editable `vegetation.txt`; in-client toggles replaced risky file patches.
- **Restraint** [I]. Idle sway at 1 px on at most 30 to 50% of tufts, phase from a hash, so the field stays under the repeated-pattern threshold. Reduce motion sets sway to 0, freezes or slows butterflies and fireflies, keeps the slow season dither and a shortened trample bend.

*Cost / performance.* Each toggle removes a cost. Decoration off drops the tuft draws (0.012 ms GPU for 2,000, or 1.62 ms on a canvas path), wind off freezes the shader, walkers off skips the 0.0023 ms trail map [V, S12].

*Games that used it.*
- Old School RuneScape with 117 HD: https://github.com/117HD/RLHD/blob/master/src/main/java/rs117/hd/HdPluginConfig.java
- Ultima Online (ClassicUO): https://github.com/ClassicUO/ClassicUO/wiki/Toggle-Static-Objects

*How it feels.* Players with motion sensitivity get a calm field; low-end players keep the game [I].

*Risks.* Removing trample feedback hides information; a vegetation toggle in PvP is fair only if the server decides hiding (E4) [I].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 4 · Mood 3 · Interactivity 3

---

## 5. Comparison scorecard

All ratings are author judgement for top-down pixel art on web Godot. "Sum" is a crude total, not a recommendation. A low-sum row such as E5 is in the table as a warning, and a mid-sum row such as E2 can still be mandatory for an MMO.

| # | Technique | Simpl. | Speed | Pixel taste | Mood | Interact. | Sum |
|---|---|---|---|---|---|---|---|
| A1 | Pokémon tall grass, priority bit, rustle | 5 | 5 | 5 | 4 | 4 | 23 |
| A2 | Zelda cut grass, debris, throttled drops | 5 | 5 | 4 | 3 | 5 | 22 |
| A3 | Tibia and TFS decay items | 5 | 5 | 3 | 2 | 4 | 19 |
| A4 | Stardew tufts, still until touched | 4 | 5 | 3 | 4 | 4 | 20 |
| A5 | Roguelike high grass blocks sight | 5 | 5 | 4 | 4 | 4 | 22 |
| B1 | Variation by hash, flips, mood map | 5 | 5 | 5 | 4 | 1 | 20 |
| B2 | 16-tile corner sets, layered tiles | 4 | 5 | 5 | 3 | 1 | 18 |
| B3 | Tuft sprites, y-sort cover | 4 | 4 | 5 | 4 | 4 | 21 |
| B4 | One field layer | 3 | 5 | 4 | 4 | 2 | 18 |
| B5 | Flowers in patches, daily cycle | 4 | 5 | 5 | 5 | 2 | 21 |
| C1 | Whole-pixel row shear | 4 | 5 | 5 | 4 | 1 | 19 |
| C2 | Terraria cosine wave, wind gate | 5 | 5 | 4 | 4 | 2 | 20 |
| C3 | Two-noise gusts, wind primitives | 4 | 5 | 4 | 5 | 3 | 21 |
| C4 | Stiffness and per-tuft variation | 5 | 5 | 4 | 4 | 1 | 19 |
| C5 | Stepped low-fps sway | 5 | 5 | 5 | 3 | 1 | 19 |
| D1 | Terraria WindGrid timestamps | 4 | 5 | 4 | 3 | 5 | 21 |
| D2 | Byte trail map | 4 | 5 | 4 | 4 | 5 | 22 |
| D3 | Crush and recovery | 4 | 5 | 4 | 4 | 5 | 22 |
| D4 | Rustle frames, leaves, sound | 5 | 5 | 5 | 4 | 5 | 24 |
| D5 | Desire paths (Helbing) | 3 | 5 | 4 | 5 | 5 | 22 |
| E1 | Random ticks and spread | 5 | 5 | 3 | 3 | 3 | 19 |
| E2 | Timers, lazy stages, server bytes | 4 | 5 | 3 | 2 | 4 | 18 |
| E3 | Cut, burn, graze stage ladder | 4 | 5 | 4 | 4 | 5 | 22 |
| E4 | Hiding rule on the server | 3 | 5 | 4 | 4 | 5 | 21 |
| E5 | TFS invisibility (anti-pattern) | 5 | 5 | 1 | 1 | 2 | 14 |
| F1 | Butterfly flap-hop | 5 | 5 | 5 | 5 | 3 | 23 |
| F2 | Bee flower hops | 4 | 5 | 4 | 4 | 2 | 19 |
| F3 | Dragonfly dart and hover | 4 | 5 | 4 | 4 | 3 | 20 |
| F4 | Midge swarm spring | 5 | 5 | 4 | 4 | 2 | 20 |
| F5 | Moths orbiting lamps | 4 | 5 | 4 | 5 | 2 | 20 |
| G1 | Firefly blink and sync | 4 | 5 | 5 | 5 | 3 | 22 |
| G2 | Pre-drawn halo glow | 5 | 5 | 5 | 5 | 1 | 21 |
| G3 | Critters flee and flush | 4 | 5 | 4 | 4 | 5 | 22 |
| G4 | Seeds, pollen, petals | 5 | 5 | 4 | 4 | 1 | 19 |
| G5 | Spawn tables, anchors, pools | 3 | 5 | 3 | 4 | 3 | 18 |
| H1 | Season palettes, phenology offsets | 4 | 5 | 5 | 5 | 1 | 20 |
| H2 | Wet, dry, frost, snow grass | 4 | 5 | 5 | 5 | 1 | 20 |
| H3 | Biome colour table, density | 5 | 5 | 4 | 3 | 1 | 18 |
| H4 | Batching, MultiMesh rows, limits | 3 | 5 | 3 | 2 | 1 | 14 |
| H5 | Reduce motion, low-end toggles | 5 | 5 | 4 | 3 | 3 | 20 |

**Reading the table.** Speed barely separates the rows, as in the fog study. Done right, almost every technique costs microseconds, so 39 of 40 rows score a 5 [V, S12]. The one 4 is per-tuft sprites (B3), whose broken batching costs 3.27 ms for 2,000 tufts. Taste, mood and interaction decide. Rustle (D4) wins at 24; Pokémon grass (A1) and flap-hop butterflies (F1) follow at 23. The bottom rows are warnings and plumbing. The TFS leak (E5) is cheap and wrong, and batching (H4) is invisible but decides whether the rest fits a phone [I].

---

## 6. Deep dives

### 6a. Measured costs: what grass and small life really cost

Our measurements [V, S12]. Apple M4 Pro, Chromium 153, WebGL2. "M4 GPU" is the ANGLE Metal timer-query time per frame. "SwiftShader" is software GL, a bound for a device with no GPU. "6x throttle" is the DevTools CPU throttle, our low-end proxy, applied to the software-raster Canvas2D config. Every GPU pass blends, so Apple's hidden-surface removal cannot cull it [V, S167]. A tuft is an 8x8 sprite with 4 blades in a 12x8 box, sheared per row by whole pixels from a wind table. **No phone was measured.**

**GPU passes (ms per frame).**

| Technique | 320x180, M4 GPU | 720p, M4 GPU | 320x180, SwiftShader | Profiles |
|---|---|---|---|---|
| Tufts, 1 instanced draw, N=2000 | 0.012 | 0.046 | 27.4 | B3, C1, C3 |
| Tufts, 1 instanced draw, N=8000 | 0.056 | 0.22 | 110.6 | B3, H4 |
| Tufts as N separate draws, N=2000 | 2.01 | 2.05 | 28.2 | B3 (anti-pattern) |
| Tufts as N separate draws, N=8000 | 7.9 | 8.0 | 113.9 | H4 (anti-pattern) |
| Field shift (wind fetch plus layer fetch) | 0.0021 | 0.0154 | 0.075 | B4, C2, H1 |
| Field shift plus trail map | 0.0029 | 0.0172 | 0.083 | B4, D2 |
| Field, 6 procedural blades per cell | 0.0069 | 0.053 | 0.44 | B4 |
| 4 blended field layers | 0.0058 | 0.058 | 0.30 | B3, B4 |
| 8 blended field layers | 0.0096 | 0.120 | 0.60 | B4 |
| Additive 9x9 halos, N=1000 | 0.0047 | 0.014 | 13.8 | G2 |
| Trail ping-pong, decay plus stamps, 80x45 | 0.0078 | n/a | 0.052 | D2 |

Wall-clock times for separate draws are higher than the timer: 3.27 ms for 2,000 and 13.1 ms for 8,000 at 320x180 [V, S12].

**CPU work in JavaScript (ms per frame, single thread).**

| CPU task | Size | M4 Pro | 6x throttle | Profiles |
|---|---|---|---|---|
| Tufts, 1 `drawImage` per tuft (pre-baked frames) | 2000 | 1.62 | 10.1 | C5 |
| Tufts, per-row slicing, 8 `drawImage` per tuft | 2000 | 12.0 | 75 | C1 (anti-pattern) |
| Tufts, pixel writes plus one `putImageData` | 2000 | 0.051 | 0.30 | B3, C1 |
| Field layer, 90 row bands of 2 px | any N | 0.11 | 0.67 | B4 |
| Re-bake the whole field layer | 8000 | 4.8 | 30.5 | B4 (dirty cells only) |
| Trail map u8 decay plus stamps, 10 walkers | 80x45 | 0.0023 | 0.014 | D1, D2, D3 |
| Random-tick regrowth, 256 picks | any map | 0.0008 | 0.005 | E1 |
| Full-scan regrowth automaton | 1024x1024 | 0.89 | 5.2 | E1 (avoid) |
| Butterflies update (wander, bob, flee) | 1000 | 0.012 | 0.071 | F1, F2, F3, G3 |
| Firefly phase sync, naive pairs | 1000 | 1.14 | 6.75 | G1 |
| Firefly phase sync, per-cell mean field | 1000 | 0.067 | 0.40 | G1 |
| Glow, per-pixel radial loop | 200 | 0.052 | 0.32 | G2 |
| Pollen update plus pixel-write draw | 500 | 0.015 | 0.089 | F4, G4 |

**What the tables say.**
- **Draw calls dominate.** About 7 ns per tuft inside one instanced draw, about 1.6 µs wall per separate draw; 8,000 tufts go from 0.056 to 13.1 ms [V, S12].
- **At native size the GPU is idle**, and the field shader is the fallback for software GL, which pays about 14 µs per quad [V, S12].
- **On a canvas, pixel writes beat `drawImage` about 30x** [V, S12].
- **Simulation is never the problem** at game counts. Firefly sync is the one loop to watch; use a mean field past a few hundred [V, S12].

**Not measured** [I, note 11]. A phone; Godot itself (per-node cost, y-sort, MultiMesh buffer updates, GDScript); real texture uploads on Metal, where our tight-loop test was unstable (the fog study's 0.016 ms for a 256x256 R8 upload is the better reference [S9]). Separate-draw tests switched only a uniform; real texture switches would cost more. `grassbench.html` runs on a phone as-is.

### 6b. Pretty versus cheap: the matrix

Rows are Speed; columns are Pixel taste plus Mood (2 to 10). Every profile appears once, with its §4 ratings.

| Speed | Taste + Mood 2 to 5 (ugly) | Taste + Mood 6 to 7 | Taste + Mood 8 to 9 | Taste + Mood 10 (best) |
|---|---|---|---|---|
| 5 (negligible) | A3, E2, E5, H4 | A2, A4, D1, E1, G5, H3, H5 | A1, A5, B1, B2, B4, C1, C2, C3, C4, C5, D2, D3, D4, D5, E3, E4, F2, F3, F4, F5, G3, G4 | B5, F1, G1, G2, H1, H2 |
| 4 (care needed) | none | none | B3 | none |
| 3 (felt on weak devices) | none | none | none | none |
| 2 (not for a web frame) | no profile; one draw per tuft at 8,000, canvas row slicing, a full re-bake per trample | none | none | none |

**Pretty and cheap.** B5, F1, G1, G2, H1 and H2. Build these first; none needs more than a palette lookup, a sprite strip or a few float ops per creature.

**Pretty but expensive.**
- One draw call per tuft (B3 done wrong): 3.27 ms wall for 2,000, 13.1 ms for 8,000 [V, S12].
- Canvas per-row slicing for crisp sway: 12 ms for 2,000 tufts, 75 ms throttled [V, S12].
- A PointLight2D per firefly. Past 15 lights per item and 256 per render, lights pop [V, S103].

**Cheap but ugly.**
- Smooth sub-pixel sway or vertex shear without snapping (C1's weak branch) [I, note 02].
- Sprite rotation at 320x180 (A4's weak point) [I, note 08].
- Per-blade noise directions that dance (C3) [V, S90].
- Screen-space debris that slides with the camera (G4) [I, note 07].
- Square on/off firefly blinks and white additive halos that merge (G1, G2) [I, note 06].

### 6c. Classic and creature timings

Frame counts are cited; seconds and px/s at 60 Hz are our conversions [I].

| Game or source | Effect | Timing | Size or speed | Source |
|---|---|---|---|---|
| Pokémon Emerald | Tall grass rustle | 4 frames x 10 ticks, then rest 10, about 0.83 s | 16x16 sprite | [V, S13] |
| Pokémon Emerald | Long grass rustle | 26 ticks, about 0.43 s | lower 16 px hidden | [V, S13, S15] |
| Stardew Valley | Tuft shake | about 44 ticks, 0.73 s | peak π/8 rad | [V, S36] |
| Terraria | Trample push | 20 frames, 0.33 s | peak 3.5 px | [V, S53] |
| Terraria | Grass wave | 3.0 s calm, 0.6 s storm | crests 67 to 335 px/s | [V, S52; I] |
| Stardew Valley | Butterfly flap | 45 to 80 ms frames, 200 ms rest | 2 to 5.6 flaps/s | [V, S39] |
| Dragonfly | Hover and chase | under 0.25 and 2.75 m/s | 15 to 20 m/s² take-off | [V, S132, S131] |
| P. carolinus | Burst | 5 to 8 flashes 0.55 s apart, every 12 s | 100 to 150 ms flash | [V, S137] |
| P. pyralis | Solo flash | every 5.9 s (secondary) | 0.3 to 0.75 s (secondary) | [V, S139] |
| Asterion proposal | Sway; trail; fireflies | 5 fps step; 3 s recovery; 5 s solo period | 0 to 2 px; 80x45 map; 48 px coupling | [I] |

Rustles last 0.3 to 0.8 s, wind periods 0.6 to 3 s [V, S13, S52].

### 6d. Network and determinism for grass and small life

Sizes are illustrative except where the Sandbox counts them [S11; I].

| What | Who decides | Sent | Size | Notes |
|---|---|---|---|---|
| Wind direction and strength | server | on change | a few bytes per region | gust table and wave from the shared clock [I, note 02] |
| Season and weather | server | on change | 1 float per region per minute | per-tile phase computed locally [I, note 08] |
| Tile stage (cut, burnt, worn, regrowing) | server | when a visible stage changes | about 9 bytes | lazy regrowth from `changed_at` [I, note 03] |
| Step, bend, rustle, trail map | client | nothing | 0 | from positions already received [I, note 03] |
| Player hidden in tall grass | server | never, to blind viewers | 0 | one remove or add, 40 to 60 bytes, on change [I, note 04] |
| Cosmetic creatures | client | nothing | 0 | seeded from chunk and time bucket [I, note 07] |

### 6e. The frame budget rule

Keep all grass and small-life work under about 2 ms of a 16.7 ms frame on a weak laptop, the rule from studies #6 to #8 [I; S7, S9]. On the M4 the GPU side of §7 uses under 0.02 ms [V, S12]. The CPU side, at the throttled proxy, is about 0.8 to 1.2 ms for a full sandbox frame with pixel writes [I, note 11].

---

## 7. Combinations: a layered architecture for Asterion Online (Godot 4, web)

All of this section is design proposal [I], built from the cited parts. The Grass Sandbox (§8) plays it.

**Layers, bottom to top.**
1. **Server grass truth (gameplay).** A stage (tall, trampled, cut, burnt, regrowing) and a `changed_at` time for changed tiles only, regrown lazily, with a 9-byte update per visible change (A3, E2). Wind, season and weather are a few bytes per region. A player in untrampled tall grass is sent only to party, adjacent and same-patch viewers; attacking reveals for 2 s (E4, E5).
2. **Ground tiles.** Grass variants and flips chosen by a position hash, corner-set edges to dirt and water, and a slow meadow mood map (B1, B2). A wear layer moves tiles toward the dirt ramp as wear rises, so desire paths form and fade (D5).
3. **Tufts and blades.** Tall grass, wheat and flowers as tufts from one atlas, batched per y-sort row band, with a grass-front strip over the lower body of anyone standing in tall grass (B3, B5). Low ground grass can be one field layer instead (B4).
4. **Wind.** A server wind vector leans every tuft; a cosine wave travels downwind and a scrolling gust table modulates it, all as whole-pixel row shear with the root fixed and per-type stiffness (C1 to C4), stepped at a low rate if wanted (C5).
5. **Interaction map.** An 80x45 byte map stamped by every visible walker and decayed each frame flattens tufts for about 3 s. Entering tall grass plays a rustle. Wear builds from the same stamps, much slower (D1 to D4).
6. **Cut, burn, graze and regrow.** Tools move tiles down a stage ladder; a fire front from study #6 burns grass; sheep graze; regrowth climbs back by random ticks or timers (E1, E3).
7. **Small life (cosmetic, client-side, pooled).** Insects, fireflies, critters and seeds from a seeded spawn table, anchored to flowers, reeds, lamps and bushes, capped and culled (F1 to F5, G1 to G5).
8. **Seasons, weather and time of day.** Season ramps with per-tile phenology offsets, wet, dry, frost and snow grass, and day palettes; the spawn table follows season, hour and weather (H1 to H3).
9. **Accessibility.** Reduce motion and a creature density slider, plus separate toggles for grass decoration, wind and walker reaction (H5).

**Pseudocode.**

Server tile state, lazy regrowth and broadcast (A3, E2, E3):
```
STAGES = [BURNT, STUBBLE, SHORT, TALL]; STEP_S = {BURNT: 120, STUBBLE: 150, SHORT: 150}   # seconds, estimate
def stage_now(rec, now):
    s, t = rec.stage, rec.changed_at
    while s != TALL and now - t >= STEP_S[s]:
        t += STEP_S[s]; s = next(s)
    return s
def on_tool(tile, tool, now):                        # cut, burn or graze
    rec = changed.get(tile) or new_rec(TALL)
    rec.stage = lower(stage_now(rec, now), tool); rec.changed_at = now
    changed[tile] = rec; broadcast_tile(tile, rec.stage)          # 9 bytes to viewers who canSee(tile)
    rec.sent = rec.stage                                          # so sweep() does not resend it
def sweep(now):                                      # every 10-60 s, watched areas only
    for tile, rec in changed_in_watched_areas():
        s = stage_now(rec, now)
        if s != rec.sent: broadcast_tile(tile, s); rec.sent = s
        if s == TALL and rec.wear == 0: del changed[tile]
```

Server vision for tall grass (E4, E5), inside `canSeeCreature` for players and monsters:
```
def can_see(viewer, target, now):
    if viewer is target or same_party(viewer, target): return True
    if not in_view_rect(viewer, target): return False
    if not hidden_in_grass(target) or now < target.revealed_until: return True
    if chebyshev(viewer.pos, target.pos) <= 1: return True
    p = patch_id(viewer.pos)
    return p != 0 and p == patch_id(target.pos)
hidden_in_grass(t) = tile_is_tall(t.pos) and stage_now(t.pos) == TALL     # trampled or cut grass stops hiding
on attack or cast: target.revealed_until = now + 2000
on becoming hidden: delay the remove by 400 ms; on becoming visible: send add, then moves
```

Client trail map, once per frame, decay before stamp (D2, D3):
```
for i in 0..len(trail)-1: trail[i] = max(0, trail[i] - DECAY)    # DECAY = 255 / (3 s * 60) ~ 1.4, use 1 or 2
for w in visible_walkers:                                          # players, NPCs, sheep, rabbit
    if w.moved_this_frame:                                         # standing still does not stamp
        stamp_disc(trail, cell(w.pos), r=2, value=255)
        push_dir[cell(w.pos)] = sign(w.vel.x)
trail_tex.update(trail)                                            # one R8 upload, 80x45
```
Decaying first means a walker who keeps moving through a cell keeps it at 255. Stamping first would let the decay eat each fresh stamp.

Tuft shear in the vertex and fragment shader, whole pixels (C1 to C4, D2):
```
// per instance: root_px (world), stiff (0.25..2.0), phase (hash)
float lean  = wind_strength * stiff;                               // server wind, signed along wind_dir
float wave  = cos(dot(root_px / TILE, wind_dir) * K - OMEGA * t + phase);   // crests move along +wind_dir
float gust  = texture(gust_tab, (root_px - wind_dir * GUST_SPEED * t) / 512.0).r;   // sample upwind: pattern moves downwind
vec2  tr    = texture(trail_tex, root_px / CELL).rg;               // r = crush 0..1, g = push side
float crush = tr.r; float push_dir = sign(tr.g - 0.5);
float s     = (lean + 0.5 * wave * gust) * (1.0 - crush) ;          // crushed tufts catch less wind
float bend  = crush > 0.66 ? FLAT : (crush > 0.24 ? push_dir * 1.0 : 0.0);  // three poses
// fragment: row 0 = root, row H-1 = tip
int row    = int(floor(UV.y_from_root * H));
int off_px = int(round((s * 2.0 + bend) * float(row) / float(H - 1)));     // 0 at the root, up to 2 at the tip
COLOR = texelFetch(atlas, ivec2(px.x - off_px, px.y), 0);
```
Mind both signs. `cos(k·x − ωt)` keeps its crest where `k·x = ωt`, so the crest moves along `+wind_dir`; Terraria's `+0.5x` term moves its crests toward negative x [I, note 02]. A table sampled at `p − v·t` moves along `+v`; adding `wind·t` would send gusts upwind [I, from S9]. A shift of `+off_px` reads the texel at `px − off_px`, so the art moves toward `+x` when `off_px > 0`.

Fireflies with pulse coupling (G1):
```
for f in fireflies:
    f.phase += dt / f.period                          # period 5 s solo, varied +-10%
    if f.phase >= 1:
        f.phase = 0; f.flash_t = 0; flashed.append(f)
for f in flashed:                                     # work happens only on flash frames
    for g in grid_neighbours(f, r=48):
        if g is not f: g.phase = min(1, g.phase + g.phase * PULL)    # PULL = 0.035
draw: frame = envelope(f.flash_t)                    # rise 1 frame, fall 0.4 s over 4 halo frames
```



---

## 8. Reference implementation: the Grass Sandbox

`vfx-grass-sandbox.html` [S11] is one hand-written page of plain JavaScript on a **320×180** canvas, scaled with pixelated rendering. It plays the nine layers of §7 and shows each layer's cost live. Its design choices are ours [I], and every number on the page is illustrative.

**The world.** A small 3/4 countryside: a meadow of tall grass and wildflowers, a wheat field for gust waves, a dirt road and worn footpaths, a pond with reeds, a hedge and a few trees in the Forest look, a cottage with a lamp post, and a pasture with grazing sheep.

**The grid.** 8x8 px cells, 40 x 23 (the last row partial), each with a ground type, grass height, wear, moisture and a season offset. The interaction map is a finer 80x45 byte grid of 4 px cells.

**What you can do.** Walk, cut, burn, plant and place a lamp (tools 1 to 5; arrows, WASD or tap). Toggle per-tuft sprites or one field layer, snapped or smooth sway, gusts, the interaction map, wear, each creature kind, synchronous fireflies and reduce motion. Set wind presets, season (S), time (T for a 2-minute auto day) and weather. V cycles views: normal, interaction map, wear, wind field, grass state and cost. A stress control multiplies tufts and creatures. Space pauses.

**The efficiency HUD.** Smoothed `performance.now()` timings for ground, tufts and wind, interaction map, regrowth, small-life update and small-life draw, with a total against a 16.7 ms bar. Counters show tufts drawn, creatures alive and pooled, stamps per second, regrowth cells per tick and tile-change bytes (9 per change).

**What it demonstrates.**
- Server state is a stage per changed cell. Cuts, burns and grazing send 9 bytes, then regrow by a random tick of 16 cells. The owner sees a dithered self in tall grass; another walker 2 cells away is not sent the player unless adjacent or in the same patch, and attacking reveals for 2 s.
- Tufts are written into one pixel buffer, the fastest canvas path we measured (0.051 ms for 2,000) [V, S12]. The field-layer toggle draws 90 row bands. Front strips cover the lower body.
- Wind is a server vector, a downwind cosine and a gust table, as 0 to 2 px row shear. Every walker stamps the trail map; tufts lie flat above 170, half up above 60, and recover in about 3 s.
- Butterflies flap-hop to flowers, bees hop, dragonflies dart over the pond, midges hold over the reeds at dusk, moths orbit the lamp, a rabbit bolts for the hedge, a frog leaps into the pond, crickets flush from tall grass, and seeds drift on the wind.
- Fireflies flash every 5 s with a 4-frame halo; in sync mode they nudge neighbours within 48 px by 0.035 of their phase until the meadow pulses together.
- Season ramps turn patch by patch; after rain grass drops a step; winter shows tuft tips through snow. No butterflies at night or in rain, fireflies only on summer nights.

**Thumbnail.** The `data-demo="showcase"` button sets a summer dusk: a gust crossing the wheat, the player half hidden in tall grass with a trail behind, butterflies over flowers, the first fireflies and the lamp lit.

**Simplifications (honest list)** [I].
- It is Canvas 2D on the CPU. HUD times compare with §6a's CPU table, not the GPU table, and nothing is a Godot or network measurement.
- "Server" and "client" share one page; bytes are counted, not sent. Day length, recovery time, flee radii and firefly constants are illustrative.

---

## 9. Gem findings

Star counts and push dates were read through the GitHub API on 2026-11-11 [V, note 10]; godotshaders.com states CC0 per page. The 117 HD row comes from note 12. "NC" means non-commercial, and we write it into the Flag cell wherever it applies. Licences were read from LICENSE files on 2026-11-11. **Flags:** **Low** = MIT/BSD/Apache/CC0; **LGPL** = fine as a separate library; **Copyleft** = GPL/AGPL/CC BY-SA, study and re-implement; **None** = no licence, study only.

| Name | URL | Licence | Maturity | Good for | Flag |
|---|---|---|---|---|---|
| Dynamic 2D Grass (mlaass, Jomoho) | https://github.com/mlaass/dynamic-2d-grass ; https://jomoho.itch.io/dynamic-2d-grass | MIT code, CC BY 4.0 art | 10 stars, v1.0.2 2026-04-19, Asset Library 4949; young | Chunked MultiMesh grass from a TileMapLayer, 5 fps sway, effector map for trample, cut and regrow; Compatibility renderer set | Low (art needs credit) |
| 117 HD plugin (RuneLite) | https://github.com/117HD/RLHD | BSD-2 | Shipped OSRS plugin, open source | Separate wind and walker toggles, per-object wind sample, 7 stiffness multipliers, 50-character push loop | Low |
| Wind with pixel snapping (Stixxy) | https://godotshaders.com/shader/wind-with-pixel-snapping/ | CC0 (page) | 2025-05-10; author says untested on many sizes | Whole-texel sway with world-X phase | Low |
| 2D Pixel perfect wind & sway (kaeylos) | https://godotshaders.com/shader/2d-pixel-perfect-wind-sway-effect/ | CC0 (page) | 2026-06-25, Godot 4.5+ | Atlas-safe `floor()` texel snap via `REGION_RECT` | Low |
| GDQuest godot-shaders | https://github.com/gdquest-demos/godot-shaders | MIT code; art CC BY-NC-SA 4.0 | 4,202 stars, push 2026-05-16 | Shader patterns, interactive snow trail demo | Low for code only; the art is NC, do not ship it |
| Godot demo drawable_textures | https://github.com/godotengine/godot-demo-projects/tree/master/2d/drawable_textures | MIT | Official, Godot 4.7, Compatibility | Paintable trail map without a SubViewport | Low |
| ncase/fireflies | https://github.com/ncase/fireflies ; https://ncase.me/fireflies/ | CC0 1.0 | 351 stars, finished 2020 | Pulse-coupled sync with tuned constants | Low |
| minetest_game | https://github.com/luanti-org/minetest_game | LGPL 2.1 code; media CC BY-SA 3.0 | 1,577 stars, commit 2026-10-30 | Grass spread ABM, 6 s and 1 in 50 | LGPL (code); Copyleft for textures |
| Shattered Pixel Dungeon | https://github.com/00-Evan/shattered-pixel-dungeon | GPL-3.0 | 6,786 stars, push 2026-11-10, shipped | High grass trample, loot odds, sight blocking | Copyleft |
| pret pokeemerald | https://github.com/pret/pokeemerald | none | 3,684 stars, push 2026-10-01 | Tall grass rustle and sprite ordering | None |
| Stardew decompile (veywrn) | https://github.com/veywrn/StardewValley | none | 341 stars, push 2021-01-24 | Grass shake, butterfly, firefly, critter numbers | None |
| Shadertoy grass shaders | https://magicmusicvisuals.com/forums/viewtopic.php?p=9451 | CC BY-NC-SA 3.0 by default per a forum claim, unconfirmed | Huge catalogue | Ideas only, never paste | Copyleft, NC (non-commercial by default) |

**Top five for Kingsfoil** [I, note 10]. Read Dynamic 2D Grass first, but replace its per-frame effector SubViewport with a CPU byte trail map fed by server positions. Combine kaeylos's `floor()` snap, Stixxy's world-X phase and a 5 fps step for sway. Copy 117 HD's three toggles. Port Nicky Case's CC0 firefly constants, and read Stardew's numbers without copying its unlicensed code.

The 3D tools that hold most "Godot grass" stars do not help a 32x32 tile game [V, note 10; S117].

---

## 10. Learnings and anti-patterns

**Learnings** [I unless cited]
1. **Batch grass into a handful of draws.** 8,000 tufts cost 0.056 ms in one draw and 13.1 ms as 8,000 [V, S12].
2. **Whole pixels, root fixed, never rotate** [V, S110].
3. **One wind and one wave**; per-blade noise dances [V, S90, S52].
4. **Still until touched is a valid choice** [V, S36].
5. **Short-lived state on the client, long-lived state on the server** [I, note 03].
6. **Every creature needs a rhythm, a goal and a reaction** [V, S39, S127].
7. **One byte per cell, one rule, one palette, one clock,** the shape of the DOOM fire [S1].

**Anti-patterns**
- One draw per tuft, or per-node materials that break batching [V, S12].
- Sub-pixel sway, unsnapped vertex shear, rotation at native resolution [I, notes 02, 08].
- Canvas per-row slicing, or re-baking a whole field per trample [V, S12].
- Syncing trample state over the network [I, note 03].
- TFS-style invisibility, an empty outfit with a real position [V, S24, S23].
- Rustles broadcast for hidden steps; grass that hides loot or visible enemies' name plates [I, note 04].
- A PointLight2D per firefly; square blinks; merging white halos [V, S103; I, note 06].
- Fresh random steering each frame [V, S127]; engine-random terrain variants in an MMO [I, note 08].

---

## 11. "See it in action" index

| # | Game | Grass or life idea | URL |
|---|---|---|---|
| 1 | Pokémon Emerald | Tall grass rustle, long grass sinking | https://github.com/pret/pokeemerald/blob/master/src/data/field_effects/field_effect_objects.h |
| 2 | Pokémon Emerald | Ash grass that changes as you walk | https://github.com/pret/pokeemerald/blob/master/src/field_tasks.c |
| 3 | Pokémon Crystal | Grass drawn over the walker by a priority bit | https://github.com/pret/pokecrystal/blob/master/engine/overworld/map_objects.asm |
| 4 | Zelda: A Link to the Past | Cut grass, bush poof, throttled drops | https://github.com/snesrev/zelda3/blob/master/src/overworld.c |
| 5 | Zelda: Breath of the Wild | Grass drops crickets and frogs, burns with updrafts | https://zeldawiki.wiki/wiki/Grass |
| 6 | Tibia (TFS) | Cut grass and wheat regrow by decay timers | https://github.com/otland/forgottenserver/blob/master/data/items/items.xml |
| 7 | Old School RuneScape (117 HD) | Grass leans with wind and parts around players | https://github.com/117HD/RLHD |
| 8 | Ultima Online (ClassicUO) | Hide vegetation toggle | https://github.com/ClassicUO/ClassicUO/wiki/Toggle-Static-Objects |
| 9 | Stardew Valley | Tufts that shake when touched, scythe and hay | https://stardewvalleywiki.com/mediawiki/api.php?action=parse&page=Grass&prop=wikitext&format=json |
| 10 | Stardew Valley | Flap-hop butterflies | https://github.com/veywrn/StardewValley/blob/master/StardewValley/BellsAndWhistles/Butterfly.cs |
| 11 | Terraria | Cosine grass wave and WindGrid trample | https://github.com/br4dnblehh/terraria-source-code/blob/main/1.4.4.1/Terraria.GameContent.Drawing/WindGrid.cs |
| 12 | Terraria | Firefly nights rolled at dusk | https://terraria.wiki.gg/wiki/Firefly |
| 13 | Minecraft | Grass colour by temperature and downfall | https://minecraft.wiki/w/Custom_biomes |
| 14 | Minecraft | Firefly bush and leaf litter (Spring to Life) | https://feedback.minecraft.net/hc/en-us/articles/35298208390797-Minecraft-Java-Edition-1-21-5-Spring-to-Life |
| 15 | Luanti | Plant waves at integer frequencies, grass spread ABM | https://github.com/luanti-org/minetest_game/blob/master/mods/default/functions.lua |
| 16 | Shattered Pixel Dungeon | High grass blocks sight, tramples to short grass | https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/levels/features/HighGrass.java |
| 17 | Cataclysm DDA | Hide only from non-adjacent creatures | https://github.com/CleverRaven/Cataclysm-DDA/blob/master/doc/JSON/JSON_FLAGS.md |
| 18 | League of Legends | Brush, wards, 2 s reveal on attack | https://wiki.leagueoflegends.com/en-us/Brush |
| 19 | Don't Starve Together | Butterflies plant flowers; regrowth rules | https://dontstarve.wiki.gg/wiki/Regrowth |
| 20 | Rain World | Cosmetic insect coordinator | https://rwmodding.github.io/api/Global.InsectCoordinator.html |
| 21 | Ghost of Tsushima | Fields bending under one global wind | https://gdcvault.com/play/1027214/Advanced-Graphics-Summit-Procedural-Grass |
| 22 | Tunic | Grass tilts away from the fox by quadrant | https://medium.com/grim-pros/roojack-how-we-implement-tunic-tilt-grass-359dfd4b7729 |
| 23 | Eastward | Grass sways as the heroes pass | https://entertainium.co/2021/10/15/eastward-review/ |
| 24 | Foundation | Paths worn by villager traffic | https://www.pcgamer.com/you-dont-have-to-place-roads-in-this-medieval-city-builder-thanks-to-your-citizens-feet |
| 25 | Alba: A Wildlife Adventure | Making creatures stop looking robotic | https://filmstories.co.uk/features/how-we-made-alba-a-wildlife-adventure/ |
| 26 | Jarl | Hashed 2D pixel grass | https://80.lv/articles/building-procedural-2d-grass-with-gpu-compute |

---

## 12. What remains unverified (and corrections)

**Corrections from the lead's verification**
1. **Emerald rustle length.** Note 01 said 0.67 s, note 10 0.84 s. The source plays frames 1 to 4 then rests on frame 0, 10 ticks each: 50 ticks, about 0.83 s [V, S13].
2. **TFS invisibility leak, confirmed.** Invisible players pass `Player::canSeeCreature`; `AddCreature` sends an empty outfit with real position [V, S24, S23].
3. **Tibia timers, confirmed** in TFS: wheat 2737 to 2739 at 240 s per stage, jungle grass 2781 to 2782 at 300 s [V, S20].
4. **Butterfly flap rate.** Notes 05 and 10 differ slightly; we quote roughly 2 to 5.6 flaps per second against a real 11.8 Hz [V, S39, S128].
5. **Dates.** Godot 4.7 on 19 June 2026 and Minecraft 1.21.5 on 25 March 2025 are confirmed [V, S104, S63].

**Conflicts between notes, and how we resolved them**
1. **Firefly sync model.** The Sandbox spec said Kuramoto-style; notes 06 and 09 recommend pulse coupling, which only works on flash frames. Our per-frame phase bench costs 1.14 ms naive and 0.067 ms with a mean field for 1,000 flies [V, S12]. We recommend pulse coupling and corrected the spec.
2. **Trail map on GPU or CPU.** Costs are equal (0.0023 ms CPU, about 0.008 ms GPU), so we pick the CPU map for web risk [V, S12].
3. **Dandelion fall speed.** The brief said about 0.3 m/s; Cummins measured 0.391 m/s [V, S141].
4. **Metal upload timings** from our tight loop are artefacts; we use the fog study's 0.016 ms [I, note 11; S9].

**Labelled as estimates or self-reported**
- P. pyralis 5.9 s is Lloyd 1966 via a secondary page; its flash length spans secondary sources [V, S139].
- The G3 flee table is the researcher's scaling; the 5-colour ramp is the researcher's proposal [I, notes 07, 08].
- Dynamic 2D Grass is young; 2,000 boids at 11 ms, VALORANT's 2%, Jarl's 1 ms and the 1100 FPS MultiMesh figure are self-reported [V, self-reported, S116, S81, S91, S102].
- Byte sizes, bandwidth, recovery times, flush chances and spawn buckets are design estimates [I, notes 03, 04, 07].

**Still unverified [U]**
- No phone, no Godot build, no GDScript and no y-sort cost was measured [S12].
- `DrawableTexture2D` blits are Experimental with no web figure; Godot 4.4's date is from memory [U, S105, S100].
- Itch.io player quotes came through search summaries [U, S157]. Tsushima's blade counts, Perbet and Cani's formulas and Cole's tables were not read [U, S89, S121, S123].
- Pokémon Unite's attack reveal, Brawl Stars' reveal distance and Shadertoy's default licence [U, S84, S83, S118].

---

## 13. Prototype roadmap for Godot (web)

1. **Measure first.** Run `grassbench.html` [S12] on a low-end Android and an older iPhone, then a 320x180 Godot web export with 2,000 tufts as one MultiMesh against 2,000 Sprite2D nodes.
2. **Ground and tufts.** Viewport at 320x180, hashed variants, a corner set, one atlas, one MultiMeshInstance2D per row band, front strips.
3. **Wind.** Server vector, downwind cosine, 128x128 gust table, whole-pixel shear, `time_rollover_secs = 32`.
4. **Trampling.** An 80x45 `PackedByteArray`, one R8 upload per frame, rustles with one sound voice.
5. **Server grass.** Stage and `changed_at` per changed tile, 9-byte updates, a 30 s sweep, and the hiding rule in `canSeeCreature`. Test that a modified client receives nothing.
6. **Small life and seasons.** A seeded spawn table, one instanced draw for creatures, pulse-coupled fireflies, season ramps with offsets, reduce motion and the three grass toggles.

---

## 14. Sources

Numbered for [S#] references. All URLs come from notes 01 to 12, the lead's verification note, the shared context or the Sandbox spec. "Blocked", "snippet" or "not fetched" means our researchers did not read the page directly.

**Series**
1. DOOM PSX fire, Fabien Sanglard, 2018: https://fabiensanglard.net/doom_fire_psx/
2. VFX #1 Snow: https://kingsfoil-artifacts.netlify.app/vfx-snow-topdown-pixel
3. VFX #2 Acid: https://kingsfoil-artifacts.netlify.app/vfx-acid-topdown-pixel
4. VFX #3 Rain: https://kingsfoil-artifacts.netlify.app/vfx-rain-topdown-pixel
5. VFX #4 Forest: https://kingsfoil-artifacts.netlify.app/vfx-forest-topdown-pixel
6. VFX #5 Light: https://kingsfoil-artifacts.netlify.app/vfx-light-topdown-pixel
7. VFX #6 Fire and smoke: https://kingsfoil-artifacts.netlify.app/vfx-fire-topdown-pixel
8. VFX #7 Water: https://kingsfoil-artifacts.netlify.app/vfx-water-topdown-pixel
9. VFX #8 Fog: https://kingsfoil-artifacts.netlify.app/vfx-fog-topdown-pixel
10. Game feel #3 Loot and pickup: https://kingsfoil-artifacts.netlify.app/feel-loot-pickup-topdown-pixel
11. Grass Sandbox: `vfx-grass-sandbox.html` (companion page)
12. Our grass benchmark, `notes/bench/grassbench.html` and `run.py`, Apple M4 Pro, Chromium 153, November 2026 (this study)

**Pokémon and Zelda decompilations**
13. pokeemerald, `field_effect_objects.h`: https://github.com/pret/pokeemerald/blob/master/src/data/field_effects/field_effect_objects.h
14. pokeemerald, `field_effect_helpers.c`: https://github.com/pret/pokeemerald/blob/master/src/field_effect_helpers.c
15. pokeemerald, `object_event_subsprites.h`: https://github.com/pret/pokeemerald/blob/master/src/data/object_events/object_event_subsprites.h
16. pokecrystal, `map_objects.asm`: https://github.com/pret/pokecrystal/blob/master/engine/overworld/map_objects.asm
17. zelda3, `overworld.c`: https://github.com/snesrev/zelda3/blob/master/src/overworld.c
18. zelda3, `sprite.c`: https://github.com/snesrev/zelda3/blob/master/src/sprite.c
19. zelda3, `ancilla.c`: https://github.com/snesrev/zelda3/blob/master/src/ancilla.c

**Tibia, Open Tibia and other MMOs**
20. The Forgotten Server, `data/items/items.xml`: https://github.com/otland/forgottenserver/blob/master/data/items/items.xml
21. The Forgotten Server, `data/actions/lib/actions.lua`: https://github.com/otland/forgottenserver/blob/master/data/actions/lib/actions.lua
22. The Forgotten Server, `game.h` and `game.cpp`: https://github.com/otland/forgottenserver/blob/master/src/game.h
23. The Forgotten Server, `protocolgame.cpp`: https://github.com/otland/forgottenserver/blob/master/src/protocolgame.cpp
24. The Forgotten Server, `player.cpp`: https://github.com/otland/forgottenserver/blob/master/src/player.cpp
25. The Forgotten Server, `creature.cpp`: https://github.com/otland/forgottenserver/blob/master/src/creature.cpp
26. Canary, `data/items/items.xml`: https://github.com/opentibiabr/canary/blob/main/data/items/items.xml
27. Canary, `register_actions.lua`: https://github.com/opentibiabr/canary/blob/main/data-otservbr-global/scripts/lib/register_actions.lua
28. 117 HD plugin, `HdPluginConfig.java`, BSD-2: https://github.com/117HD/RLHD/blob/master/src/main/java/rs117/hd/HdPluginConfig.java
29. 117 HD plugin, `WindDisplacement.java`: https://github.com/117HD/RLHD/blob/master/src/main/java/rs117/hd/scene/model_overrides/WindDisplacement.java
30. 117 HD plugin, `comp.glsl`: https://github.com/117HD/RLHD/blob/master/src/main/resources/rs117/hd/comp.glsl
31. 117 HD plugin, `priority_render.glsl`: https://github.com/117HD/RLHD/blob/master/src/main/resources/rs117/hd/priority_render.glsl
32. RuneScape support, ground decoration option: https://support.runescape.com/hc/en-gb/articles/207223015
33. ClassicUO, `StaticFilters.cs`: https://github.com/ClassicUO/ClassicUO/blob/main/src/ClassicUO.Client/Game/Data/StaticFilters.cs
34. ClassicUO, `GameSceneDrawingSorting.cs`: https://github.com/ClassicUO/ClassicUO/blob/main/src/ClassicUO.Client/Game/Scenes/GameSceneDrawingSorting.cs
35. ClassicUO wiki, Toggle Static Objects: https://github.com/ClassicUO/ClassicUO/wiki/Toggle-Static-Objects

**Stardew Valley**
36. Stardew Valley 1.6 decompile, `Grass.cs`: https://github.com/AcidicNic/StardewValleyDecompiled1.6/blob/main/StardewValley.TerrainFeatures/Grass.cs
37. Stardew Valley 1.5 decompile, `Grass.cs`: https://raw.githubusercontent.com/veywrn/StardewValley/master/StardewValley/TerrainFeatures/Grass.cs
38. Stardew Valley wiki, Grass: https://stardewvalleywiki.com/mediawiki/api.php?action=parse&page=Grass&prop=wikitext&format=json
39. Stardew Valley 1.5 decompile, `Butterfly.cs`: https://github.com/veywrn/StardewValley/blob/master/StardewValley/BellsAndWhistles/Butterfly.cs
40. Stardew Valley 1.6 decompile, `Firefly.cs`: https://github.com/AcidicNic/StardewValleyDecompiled1.6/blob/main/StardewValley.BellsAndWhistles/Firefly.cs
41. Stardew Valley 1.5 decompile, `Critter.cs`: https://github.com/veywrn/StardewValley/blob/master/StardewValley/BellsAndWhistles/Critter.cs
42. Stardew Valley 1.5 decompile, `Rabbit.cs`: https://github.com/veywrn/StardewValley/blob/master/StardewValley/BellsAndWhistles/Rabbit.cs
43. Stardew Valley 1.5 decompile, `Frog.cs`: https://github.com/veywrn/StardewValley/blob/master/StardewValley/BellsAndWhistles/Frog.cs
44. Stardew Valley 1.5 decompile, `Squirrel.cs`: https://github.com/veywrn/StardewValley/blob/master/StardewValley/BellsAndWhistles/Squirrel.cs
45. Stardew Valley 1.5 decompile, `GameLocation.cs`: https://github.com/veywrn/StardewValley/blob/master/StardewValley/GameLocation.cs
46. Stardew Valley 1.5 decompile, `Object.cs`: https://github.com/veywrn/StardewValley/blob/master/StardewValley/Object.cs
47. Stardew Valley 1.5 decompile, `WeatherDebris.cs`: https://github.com/veywrn/StardewValley/blob/master/StardewValley/WeatherDebris.cs
48. Stardew Valley 1.5 decompile, `Game1.cs`: https://github.com/veywrn/StardewValley/blob/master/StardewValley/Game1.cs
49. Stardew Valley 1.6 decompile, `Game1.cs`: https://github.com/AcidicNic/StardewValleyDecompiled1.6/blob/main/StardewValley/Game1.cs
50. Stardew Valley wiki, Modding:Maps: https://stardewvalleywiki.com/mediawiki/api.php?action=parse&page=Modding:Maps&prop=wikitext&format=json
51. Stardew Valley 1.5 decompile repository: https://github.com/veywrn/StardewValley

**Terraria, Minecraft, Luanti and other sandboxes**
52. Terraria 1.4.4.1 decompile, `TileDrawing.cs`: https://github.com/br4dnblehh/terraria-source-code/blob/main/1.4.4.1/Terraria.GameContent.Drawing/TileDrawing.cs
53. Terraria 1.4.4.1 decompile, `WindGrid.cs`: https://github.com/br4dnblehh/terraria-source-code/blob/main/1.4.4.1/Terraria.GameContent.Drawing/WindGrid.cs
54. Terraria wiki, Plants: https://terraria.wiki.gg/wiki/Plants
55. Terraria wiki, Butterfly: https://terraria.wiki.gg/wiki/Butterfly
56. Terraria wiki, Dragonflies: https://terraria.wiki.gg/wiki/Dragonflies
57. Terraria wiki, Firefly: https://terraria.wiki.gg/api.php?action=parse&page=Firefly&prop=wikitext&format=json
58. Terraria wiki, Critters: https://terraria.wiki.gg/wiki/Critters
59. Minecraft Wiki, Tick: https://minecraft.wiki/w/Tick
60. Minecraft Wiki, Grass Block: https://minecraft.wiki/w/Grass_Block
61. Minecraft Wiki, Sheep: https://minecraft.wiki/w/Sheep
62. Minecraft Wiki, Bee: https://minecraft.wiki/w/Bee
63. Minecraft Java 1.21.5 "Spring to Life" changelog, 25 March 2025: https://feedback.minecraft.net/hc/en-us/articles/35298208390797-Minecraft-Java-Edition-1-21-5-Spring-to-Life
64. Shockbyte, Spring to Life summary: https://shockbyte.com/blog/minecraft-spring-to-life-update
65. Minecraft Wiki, Custom biomes: https://minecraft.wiki/w/Custom_biomes
66. OptiFine docs, colormaps: https://optifine.readthedocs.io/colormaps.html
67. Step Erosion mod: https://modrinth.com/mod/step-erosion
68. Living Paths mod: https://www.curseforge.com/minecraft/mc-mods/living-paths
69. Luanti, nodes vertex shader: https://github.com/luanti-org/luanti/blob/master/client/shaders/nodes_shader/opengl_vertex.glsl
70. Luanti, `game.cpp`: https://github.com/luanti-org/luanti/blob/master/src/client/game.cpp
71. minetest_game, `mods/default/functions.lua`: https://github.com/luanti-org/minetest_game/blob/master/mods/default/functions.lua
72. Shattered Pixel Dungeon, `HighGrass.java`: https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/levels/features/HighGrass.java
73. Shattered Pixel Dungeon, `Terrain.java`: https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/levels/Terrain.java
74. Shattered Pixel Dungeon, `Level.java`: https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/levels/Level.java
75. Brogue CE, `Globals.c` and `Time.c`: https://github.com/tmewett/BrogueCE/blob/master/src/brogue/Globals.c
76. Cataclysm DDA, `terrain-flora.json`: https://github.com/CleverRaven/Cataclysm-DDA/blob/master/data/json/furniture_and_terrain/terrain-flora.json
77. Dwarf Fortress Wiki, Grass: https://dwarffortresswiki.org/index.php/v0.31:Grass
78. Don't Starve wiki, Grass: https://dontstarve.wiki.gg/wiki/Grass/DST
79. Don't Starve Together scripts, `rabbitbrain.lua`: https://github.com/taichunmin/dont-starve-together-game-scripts/blob/master/scripts/brains/rabbitbrain.lua

**Hiding and server vision**
80. League of Legends Wiki, Brush: https://wiki.leagueoflegends.com/en-us/Brush
81. Riot, "Demolishing wallhacks with VALORANT's fog of war": https://www.riotgames.com/en/news/demolishing-wallhacks-valorants-fog-war
82. Riot, "Story of fog and war": https://www.riotgames.com/en/news/story-fog-and-war
83. Gamepressure, Brawl Stars bushes: https://www.gamepressure.com/brawl-stars/how-can-i-hide/zfc615
84. GameWith, Pokémon Unite tall grass: https://gamewith.net/pokemon-unite/article/show/29470
85. Game Developer, Mark of the Ninja's five stealth rules: https://gamedeveloper.com/design/-i-mark-of-the-ninja-i-s-five-stealth-design-rules

**Grass rendering and wind in industry**
86. Pelzer, "Rendering Countless Blades of Waving Grass", GPU Gems ch. 7, 2004: https://developer.nvidia.com/gpugems/gpugems/part-i-natural-effects/chapter-7-rendering-countless-blades-waving-grass
87. Wohllaib, "Procedural Grass in Ghost of Tsushima", GDC 2021: https://gdcvault.com/play/1027214/Advanced-Graphics-Summit-Procedural-Grass
88. Game Developer, vorticles in Ghost of Tsushima: https://gamedeveloper.com/design/using-vorticles-to-simulate-wind-in-i-ghost-of-tsushima-i-
89. Stylized Station thread on Tsushima grass: https://threadreaderapp.com/thread/1688939411575119872
90. Hexaquo, Godot grass series part 3: https://hexaquo.at/pages/grass-rendering-series-part-3-animating-and-interacting-with-grass-in-godot/
91. 80.lv, procedural 2D grass in Jarl, August 2026: https://80.lv/articles/building-procedural-2d-grass-with-gpu-compute
92. Grim Pros, how Tunic tilts grass: https://medium.com/grim-pros/roojack-how-we-implement-tunic-tilt-grass-359dfd4b7729
93. GamesBeat, BotW chemistry engine: https://gamesbeat.com/the-legend-of-zelda-breath-of-the-wild-makes-chemistry-just-as-important-as-physics/
94. Twinfinite, BotW burning grass and updrafts: https://twinfinite.net/?p=264104
95. Kodeco, snow trails in UE4: https://www.kodeco.com/5760-creating-snow-trails-in-unreal-engine-4?page=2
96. GDQuest interactive snow demo: https://github.com/gdquest-demos/godot-shaders/blob/main/godot/Demos/InteractiveSnowDemo.tscn

**Godot engine**
97. Godot `ProjectSettings.xml`: https://github.com/godotengine/godot/blob/master/doc/classes/ProjectSettings.xml
98. Godot docs 4.3, GPU optimization: https://docs.godotengine.org/de/4.3/_sources/tutorials/performance/gpu_optimization.rst.txt
99. Godot docs, canvas_item shader reference: https://docs.godotengine.org/en/stable/tutorials/shaders/shader_reference/canvas_item_shader.html
100. godot-docs PR #10737, per-instance uniforms in canvas_item: https://github.com/godotengine/godot-docs/pull/10737
101. Godot forum, instance uniform trouble in a web export: https://forum.godotengine.org/t/shader-not-working-on-all-sprites-in-web-export/125093
102. markolainen, MultiMeshInstance2D swaying grass: https://markolainen.itch.io/godot-2d-multimeshinstance2d-swaying-grass
103. Godot 4.5 GLES3 canvas renderer source: https://github.com/godotengine/godot/blob/4.5-stable/drivers/gles3/rasterizer_canvas_gles3.cpp
104. Godot 4.7 release page: https://godotengine.org/releases/4.7/
105. Godot 4.7 docs, DrawableTexture2D: https://docs.godotengine.org/en/4.7/classes/class_drawabletexture2d.html
106. DrawableTexture PR #105701 GLES3 path: https://remotebranch.eu/Stowage/godot/commit/fd6e80d4e97ccd4ab4146db018df91c20e07ab4e.diff
107. Godot docs, Using TileSets: https://docs.godotengine.org/en/stable/tutorials/2d/using_tilesets.html

**Code and shaders we can reuse**
108. Dynamic 2D Grass, MIT code, CC BY 4.0 art: https://github.com/mlaass/dynamic-2d-grass
109. Dynamic 2D Grass devlog, 24 March 2026: https://jomoho.itch.io/dynamic-2d-grass/devlog
110. Godot Shaders, "Wind with pixel snapping": https://godotshaders.com/shader/wind-with-pixel-snapping/
111. Godot Shaders, "2D Pixel perfect wind & sway effect": https://godotshaders.com/shader/2d-pixel-perfect-wind-sway-effect/
112. Godot Shaders, mix two tilemaps to break repetition: https://godotshaders.com/shader/mix-2-tilemap-to-break-repetitive/
113. Godot demo, `2d/drawable_textures`: https://github.com/godotengine/godot-demo-projects/tree/master/2d/drawable_textures
114. CaptainProton42, 2DGrassShaderDemo: https://github.com/CaptainProton42/2DGrassShaderDemo
115. Nicky Case, Fireflies source: https://github.com/ncase/fireflies
116. godot_boids, Rust GDExtension, MIT: https://github.com/90-008/godot_boids
117. 2Retr0 GodotGrass: https://github.com/2Retr0/GodotGrass
118. Forum claim on Shadertoy default licence: https://magicmusicvisuals.com/forums/viewtopic.php?p=9451

**Papers on grass, wind, paths and placement**
119. Jahrmann and Wimmer, "Responsive Real-Time Grass Rendering for General 3D Scenes", I3D 2017: https://www.cg.tuwien.ac.at/research/publications/2017/JAHRMANN-2017-RRTG/JAHRMANN-2017-RRTG-draft.pdf
120. Habel, Wimmer and Jeschke, "Instant Animated Grass", 2007: https://www.cg.tuwien.ac.at/research/publications/2007/Habel_2007_IAG/Habel_2007_IAG-Preprint.pdf
121. Perbet and Cani, "Animating Prairies in Real-Time", I3D 2001: https://sed.inrialpes.fr/ARCHIVE/PRV/PUBLIC/PRAIRIE/plaquette_pub.html
122. Helbing, Keltsch and Molnár, trail formation model: https://ar5iv.labs.arxiv.org/html/cond-mat/9805158
123. Cole 1995, experimental trampling of vegetation, J. Applied Ecology 32: https://research.fs.usda.gov/treesearch/23582
124. Wind River trampling study, 1994: https://digitalcommons.usu.edu/envs_facpub/970
125. Bridson, "Fast Poisson Disk Sampling in Arbitrary Dimensions", 2007: https://www.cs.ubc.ca/~rbridson/docs/bridson-siggraph07-poissondisk.pdf
126. Mirollo and Strogatz, pulse-coupled oscillators, SIAM J. Appl. Math. 1990: https://www.iasi.cnr.it/~vbonifaci/semcn/Mirollo1990.pdf
127. Reynolds, "Steering Behaviors for Autonomous Characters", GDC 1999: https://www.red3d.com/cwr/steer/gdc99/

**Biology of insects, animals and plants**
128. Jantzen and Eisner 2008, hindwings and evasive flight, PNAS: https://pmc.ncbi.nlm.nih.gov/articles/PMC2575472
129. Altshuler et al. 2005, honeybee hovering at 230 Hz, PNAS: https://pmc.ncbi.nlm.nih.gov/articles/PMC1312389
130. Chittka et al. 1997, bumblebee flight durations, Behavioral Ecology 8: https://academic.oup.com/beheco/article/8/3/239/187553
131. Combes et al., dragonfly strike acceleration: https://sicb.org/?p=17126
132. Odonatologica, dragonfly patrol and chase speeds: https://natuurtijdschriften.nl/pub/592070/OJIOS1994023001006.pdf
133. May 1987, dragonfly hovering under 0.25 m/s: https://natuurtijdschriften.nl/pub/593064/AOIOS1987003001007.pdf
134. Kelley and Ouellette 2013, midge swarms, Scientific Reports 3:1073: https://pmc.ncbi.nlm.nih.gov/articles/PMC3545223
135. Fabian et al. 2024, why insects orbit lights, Nature Communications 15:689: https://doi.org/10.1038/s41467-024-44785-3
136. US National Park Service, firefly flash patterns: https://www.nps.gov/grsm/learn/nature/firefly-flash-patterns.htm
137. Sarfati, Hayes and Peleg 2021, synchronous firefly swarms in 3D, Science Advances: https://pmc.ncbi.nlm.nih.gov/articles/PMC8262802
138. Sarfati et al. 2020, group size and synchrony, J. R. Soc. Interface: https://pmc.ncbi.nlm.nih.gov/articles/PMC7536049
139. Modelling page citing Lloyd 1966 for the P. pyralis interval: https://kjordahl.codeberg.page/ffbehavior.html
140. CU Boulder Today, about 20 fireflies start synced bursts: https://www.colorado.edu/today/synchronous-fireflies
141. Cummins et al. 2018, dandelion vortex ring, Nature 562: https://strathprints.strath.ac.uk/79669/1/Cummins_etal_Nature_2018_A_separated_vortex_ring_underlies_the_flight.pdf
142. Tackenberg et al. 2003, dandelion long-distance dispersal: https://www.thieme-connect.com/products/ejournals/html/10.1055/s-2003-44789
143. Biology Insights, why dandelions close at night: https://biologyinsights.com/why-do-dandelions-close-at-night/
144. Britannica, phenology and Hopkins' bioclimatic law: https://www.britannica.com/science/phenology
145. Vitasse et al., Alpine green-up shift per 1000 m: https://pmc.ncbi.nlm.nih.gov/articles/PMC6426166
146. USGS, NDVI and remote-sensing phenology: https://www.usgs.gov/special-topics/remote-sensing-phenology/science/ndvi-foundation-remote-sensing-phenology
147. Lekner and Dorf 1988, why wet surfaces look darker: https://www.wgtn.ac.nz/scps/staff/pdf/darkerwhenwet.pdf
148. Irish Times, why wet grass looks more vivid: https://www.irishtimes.com/news/things-bright-and-beautiful-1.87052

**Pixel art craft and player reception**
149. Slynyrd, Pixelblog 20, Top Down Tiles: https://www.slynyrd.com/blog/2019/8/27/pixelblog-20-top-down-tiles
150. Slynyrd, Pixelblog 2, Texture: https://www.slynyrd.com/blog/2018/2/15/pixelblog-2-texture
151. Slynyrd, Pixelblog 43, Top Down Tiles Part 2: https://www.slynyrd.com/blog/2023/3/26/pixelblog-43-top-down-tiles-part-2
152. cr31, blob and Wang tiles: https://boristhebrave.com/permanent/24/06/cr31/stagecast/wang/blob.html
153. Red Blob Games, autotiling: https://www.redblobgames.com/articles/autotile/gemini/autotiling.html
154. Hue-shift guide for pixel art: https://pixelpaletteswap.pages.dev/guides/color-theory-for-pixel-art.html
155. Pixel Grimoire, hue-shifted ramps: https://medium.com/pixel-grimoire/how-to-start-making-pixel-art-6-a74f562a4056
156. Entertainium, Eastward review, 2021: https://entertainium.co/2021/10/15/eastward-review/
157. itch.io player comment on grass sway: https://itch.io/post/8467540
158. Pixnote, pixel art animation frame rates: https://pixnote.net/en/learn/animation
159. Film Stories, how Alba's creatures stopped looking robotic: https://filmstories.co.uk/features/how-we-made-alba-a-wildlife-adventure/
160. GamesRadar, ambient animals in Ghost of Tsushima: https://www.gamesradar.com/video-game-animals-stray-ghost-of-tsushima

**Accessibility**
161. Game Accessibility Guidelines, turn off background movement: https://gameaccessibilityguidelines.com/provide-an-option-to-turn-off-hide-background-movement/
162. Game Accessibility Guidelines, avoid flicker and repeating patterns: https://gameaccessibilityguidelines.com/avoid-flickering-images-and-repetitive-patterns/
163. Xbox Accessibility Guideline 117, visual distractions: https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/117

**Other games and see-it links**
164. Zelda Dungeon, Restless Cricket: https://www.zeldadungeon.net/wiki/Restless_Cricket

**Hardware and web performance**
165. Godot forum, web export on mobile, 240 to 38 draw calls and 31 to 60 fps: https://forum.godotengine.org/t/godot-4-web-export-stutters-on-mobile-its-probably-your-art-pipeline-not-your-code-31fps-to-60fps-benchmarks-inside/143268
166. WebKit bug 218949, instanced draws slow on A14 devices: https://bugs.webkit.org/show_bug.cgi?id=218949
167. Apple WWDC20 10632, hidden surface removal on Apple GPUs: https://developer.apple.com/videos/play/wwdc2020/10632
168. Godot docs, using MultiMesh: https://raw.githubusercontent.com/godotengine/godot-docs/master/tutorials/performance/using_multimesh.rst
