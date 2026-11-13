# 17. Gap games: exact numbers from code and asset data

Method. I filled the game-data gaps left by notes 10 to 15 with open-source code and asset data, read with `curl`, `gh` and grep. For Tibia I reused note 10's protobuf reader (copied to `scratch-17/decode_app.py`) on Canary's `appearances.dat` and dumped every fire, explosion, smoke, lava, burning and burnt entry I could find by name in Canary's `items.xml` (raw output in `scratch-17/tibia-decode.txt`). I did not view or download any image. Every number says which tile and sprite size it belongs to.

Reading the Tibia rows. `Box` is (x, y, width, height) inside the sprite canvas. A box that reaches past 32 px means a 64x64 canvas, which the client draws up and to the left of the tile, so the tile is the bottom-right 32x32 quarter. `Light` is (brightness, 8-bit colour index). "Once" means the protobuf `loop_type` is 1 (counted, played once); items are 0 (infinite) unless marked ping-pong (-1).

Coverage against the brief. Priorities 1, 2, 3 and part of 4 and 5 are done. Priorities 6 (BotW, Divinity OS2, Far Cry 2 spread speeds), 7 (RPG Maker MV/MZ `Animations.json`), Enter the Gungeon goop, Noita, Minish Cap and pokeplatinum are open. See Gaps.

---

## Q1. Tibia fire effects, missiles, lava and burnt items (32 px tiles)

### Takeaway
Tibia's fire hits are short and fast. The four core fire effects are 8 to 14 frames and 660 to 900 ms, played once. Frames are mostly 100 ms, but the explosion pair uses 35 to 60 ms frames, and EXPLOSIONHIT eases out (35 ms first frame, 110 ms last). FIREAREA, the per-tile flame of every area spell, is 53x53 px, so it spills about 21 px past its own tile up and left. Lava is opaque 32x32 art that changes slowly (3 frames x 500 ms in the classic tile, 10 to 30 frames x 150 ms in newer ones). Tibia has no burnt-tree items. "Burnt" art is limited to walls, ashes, firewood and a torch stub.

### Cited findings: effects (client ids = TFS `const.h` names)
Source for every row: Canary `data/items/appearances.dat` (https://github.com/opentibiabr/canary/blob/main/data/items/appearances.dat), schema `src/protobuf/appearances.proto` (https://github.com/opentibiabr/canary/blob/main/src/protobuf/appearances.proto), names from TFS `src/const.h` (https://github.com/otland/forgottenserver/blob/master/src/const.h).

| Name (`CONST_ME_`) | Id | Frames x ms | Total | Box (x, y, w, h) | Canvas | Light |
|---|---|---|---|---|---|---|
| EXPLOSIONAREA | 5 | 13 frames, 12 x 50 ms and frame 6 at 100 ms | 700 ms, once | (0, 1, 31, 31) | 32 | (4, 208) |
| EXPLOSIONHIT | 6 | 8 frames: 35, 50, 75, 90, 90, 100, 110, 110 ms | 660 ms, once | (29, 29, 35, 35) | 64 | (5, 208) |
| FIREAREA | 7 | 14 frames: 40 ms then 13 x 60 ms | 820 ms, once | (11, 10, 53, 53) | 64 | (6, 208) |
| HITBYFIRE | 16 | 9 x 100 ms | 900 ms, once | (22, 24, 42, 40) | 64 | (4, 215) |
| FIREATTACK | 37 | 8 x 100 ms | 800 ms, once | (7, 6, 43, 45) | 64 | (6, 208) |
| SMOKE | 68 | 12 x 100 ms | 1200 ms, once | (0, 29, 33, 35) | 64 | none |
| ORCSHAMAN_FIRE | 72 | 16 x 100 ms | 1600 ms, once | (0, 0, 64, 64) | 64 | (5, 54) |
| BLACKSMOKE | 158 | 7 x 100 ms | 700 ms, once | (25, 22, 33, 35) | 64 | none |
| REDSMOKE | 167 | 7 x 100 ms | 700 ms, once | (1, 0, 30, 31) | 32 | (6, 180) |
| FAEEXPLOSION | 184 | 8 x 70 ms | 560 ms, once | (2, 1, 28, 27) | 32 | (3, 173) |

All ten are unsynchronised (each instance starts its own clock).

### Cited findings: missiles (`CONST_ANI_`)
Each fire missile is a 3x3 direction pattern (8 directions plus centre), one frame, no animation. Same source.

| Name | Id | Diagonal box | Vertical box | Light |
|---|---|---|---|---|
| FIRE | 4 | 27x22 | 15x26 | (5, 206) |
| BURSTARROW | 7 | 27x24 | 7x28 | none |
| FLAMMINGARROW | 34 | 27x26 | 16x28 | (3, 192) |
| EXPLOSION | 41 | 28x30 | 7x29 | (5, 116) |

### Cited findings: lava, burning and burnt items
Names and ids from Canary `data/items/items.xml` (https://github.com/opentibiabr/canary/blob/main/data/items/items.xml). Appearance data from the same `appearances.dat`.

| Item | Id | Pattern | Frames x ms | Box | Light | Notes |
|---|---|---|---|---|---|---|
| lava (classic) | 727, 2144, 8969 | 4x2 by position | 3 x 500 ms, synchronised | 32x32, opaque | (4, 193) | 24 sprites |
| lava | 728 | 1x1 | 30 x 150 ms (4.5 s loop), synchronised | 32x32, opaque | (4, 193) | |
| lava | 21477 | 1x1 | 10 x 150 ms, synchronised | 32x32, opaque | (4, 193) | |
| lava | 21478 | 1x1 | 20 x 150 ms, synchronised | 32x32, opaque | (4, 193) | |
| lava (edge) | 14100 | 2x1 | 10 x 150 ms, synchronised | 32x16 and 32x17 | (3, 193) | half-tile strip |
| lava stream | 14113 | 3x1 | 6 x 150 ms, synchronised | 32x13 to 32x15 | none | thin strip |
| small lava cracks | 5814 | 4x3 | 10 x 100 ms, unsynchronised | 32x32 | none | 120 sprites |
| small lava cracks | 7354 | 4x3 | 2 x 500 ms, synchronised | 32x32, opaque | none | |
| steaming hot lava | 7821 | 1x1 | 6 frames: 100, 200, 100, 200, 200, 100 ms | 22x27 | (3, 198) | uneven timing |
| steaming hot lava | 7835 | 1x1 | 4 x 200 ms, synchronised | 22x22 | (3, 198) | |
| lava wall | 1441 | 1x2 | 3 x 200 ms, ping-pong | 40x64 at (24, 0) | (2, 199) | two tiles tall |
| lava fountain | 5074 | 1x1 | 4 x 150 ms | 52x60 | (2, 199) | |
| burning wall | 232 | 1x1 | 5 x 100 ms | 37x31 at (5, 1) | (3, 206) | |
| burning wall | 5061 | 1x1 | 5 x 100 ms | 61x32 | (3, 206) | two tiles wide |
| campfire (lit) | 1998 | 1x1 | 5 x 100 ms | 32x32 | (7, 206) | |
| campfire | 1996, 1997, 2002 | 1x1 | static | 32x32 | none | unlit or dying stages |
| fire field (no decay) | 2123 | 4x4 | 5 x 120 ms | 49x47 | (7, 200) | same art as 2118 |
| fire field | 2131 | 2x2 | 5 x 120 ms | 45x47, 44x46 | (7, 206) | |
| searing fire | 2137 | 1x1 | 5 x 120 ms | 42x40 at (22, 24) | (7, 203) | |
| searing fire | 2138 | 1x1 | 5 x 100 ms | 35x32 at (29, 0) | (5, 203) | wall-side flame |
| fire basin | 8524 | 1x1 | 6 x 100 ms | 64x58 | (5, 198) | displacement (8, 8) px |
| eternal flames | 946 | 1x1 | 4 x 500 ms, synchronised | 25x25 | none | |
| burnt wall | 8793 | 2x1 | static | 54x30 | none | ids 8793 to 8798 |
| burnt wall | 8794 | 1x1 | static | 51x30 | none | |
| ashes | 2140, 3134 | 1x1 | static | 24x24 at (4, 4) | none | both use sprite 195468 |
| burnt down firewood | 3131 | 1x1 | static | 24x24 | none | |
| burnt down torch | 2926 | 1x1 | static | 11x14 | (0, 215) | light 0 |
| dead tree | 958 | 1x1 | static | 59x61 | none | not fire-linked |

- No item named "burnt tree", "charred", "scorched" or "smouldering" exists in Canary's `items.xml` [cited, grep of the file above].

### Inferences
- Client effect id equals the `const.h` value. Support: HITBYFIRE's box (22, 24, 42, 40) is identical to the searing fire item 2137 box, and FIREAREA's 14 frames fit the "short spell burst" use [inference].
- Light colours. I believe the 8-bit index is a 6x6x6 cube, with r = (c / 36) % 6 x 51, g = (c / 6) % 6 x 51, b = c % 6 x 51 [inference, OTClient `Color::from8bit` not re-read]. That gives 206 = (255, 204, 102) warm yellow (campfire, burning wall, fire missile), 193 = (255, 102, 51) red-orange (all lava), 198 = (255, 153, 0) orange, 199 = (255, 153, 51), 208 = (255, 204, 204) near-white (explosions), 215 = white. Fire and lava use different light hues: yellow for flames, red-orange for lava.
- FIREAREA at 53x53 px is 1.66 tiles wide. A 3x3 great fireball draws nine of them, so neighbours overlap by about 21 px. Tibia hides the square grid by overdraw, not by sub-tile art [inference].
- Speed of a Tibia fire burst. 60 ms frames for FIREAREA and 50 ms for EXPLOSIONAREA are faster than every looping flame (100 to 120 ms) and much faster than lava (150 to 500 ms). The rule visible in the data is "impacts 50 to 60 ms, flames 100 to 120 ms, liquids 150 to 500 ms" [inference from the table].
- Lava at 32 px. The classic lava hides tiling with 8 positional variants (4x2) and only 3 frames, so a whole lava lake changes picture twice a second, in sync [inference from pattern and sync flag].
- Campfire 1996, 1997 and 2002 are probably burnt-down stages, since `items.xml` names them campfire and they have no light [inference, decay chain not read].

### Gaps
- Sprite pixels and tone counts were not viewed.
- The decay chain between campfire ids (1998 to 1996 or 2002) and the `burnt wall` decay source were not read in `items.xml`.
- OTClient's `Color::from8bit` was not re-read this session (my fetch returned no match), so the RGB values are inference.

"See it in action": https://tibia.fandom.com/wiki/Fire_Field and https://tibia.fandom.com/wiki/Lava (may block bots)

---

## Q2. Shattered Pixel Dungeon fire (16 px tiles)

### Takeaway
SPD draws fire with no flame sprites at all. Each burning 16 px cell spawns one 4 px additive orange square every 30 ms, which shrinks to nothing while it accelerates upward over 0.6 s. About 20 squares live per cell at once and they rise about 14 px, just under one tile. Spread is fully deterministic. A flammable cell next to fire (4-neighbour) always ignites next turn, burns 4 turns, then becomes the EMBERS terrain. At 32 px the same recipe doubles to 8 px squares rising about 29 px [inference].

### Cited findings
- Spread rule. In `Fire.evolve()`, a burning cell's next value is `cur - 1`. An unlit flammable cell with any burning orthogonal neighbour gets `fire = 4`. There is no random roll. Freezing on a cell clears both. https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/actors/blobs/Fire.java
- Burnt tile. When the value reaches 0 on a flammable cell, `Level.destroy()` sets the cell to `Terrain.EMBERS` (id 9, passable) if it was EMPTY, EMPTY_DECO or flammable. https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/levels/Level.java and https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/levels/Terrain.java
- Emitter rate. `Fire.use()` calls `emitter.pour(FlameParticle.FACTORY, 0.03f)`. `BlobEmitter.emit()` then spawns one particle per visible burning cell per emit, at a random point inside the cell scaled by `DungeonTilemap.SIZE`. `Emitter.update()` emits once per elapsed `interval`. https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/effects/BlobEmitter.java and https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/SPD-classes/src/main/java/com/watabou/noosa/particles/Emitter.java
- FlameParticle. Colour `0xEE7722`, lifespan 0.6 s, size 4, start speed 0, acceleration (0, -80) px/s². It extends `PixelParticle.Shrinking`, which sets `size * left / lifespan` each update. Alpha ramps in over the first 20% of life (`am = (1 - p) * 5` while p > 0.8), then stays 1. `lightMode()` returns true (additive). https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/effects/particles/FlameParticle.java and https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/SPD-classes/src/main/java/com/watabou/noosa/particles/PixelParticle.java
- Burning character. `CharSprite` state BURNING creates an emitter over the sprite that pours FlameParticle every 0.06 s. https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/sprites/CharSprite.java
- Burning buff. `DURATION = 8f` turns. Each turn, if the target stands on a flammable cell with no fire, it seeds Fire of 4 there. https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/actors/buffs/Burning.java
- SmokeParticle (used by other effects, not by Fire). Colour `0x222222`, life 0.6 to 1.0 s, acceleration (0, -40), start speed x ±4, y ±8 px/s, size grows from 8 to 16 px (`size(16 - p * 8)`), alpha peaks at 0.4 when p = 0.8. https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/effects/particles/SmokeParticle.java
- Licence GPL-3.0, read from https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/LICENSE.txt

### Inferences
- Live particles per burning cell = 0.6 / 0.03 = 20. Per burning character = 0.6 / 0.06 = 10 [inference, arithmetic].
- Rise per particle = 0.5 x 80 x 0.6² = 14.4 px, which is 0.9 of a 16 px tile [inference, arithmetic].
- A 20-tile fire front on screen is about 400 live 4 px squares. That is cheap on CPU (Tibia-scale screens hold 240 tiles) [inference].
- Spread speed is 1 tile per turn in every open direction, so SPD fire is a diamond (Manhattan) front. VFX #6's probabilistic ignition exists to avoid exactly this shape [inference].
- Scaled to 32 px tiles, a direct port is 8 px squares, acceleration -160 px/s², rise about 29 px. Note 11's cluster rule says 2x2 px or larger, which an 8 px square satisfies [inference].

### Gaps
- `DungeonTilemap.SIZE` value (I believe 16) and the hero sprite size were not read this session.
- The EMBERS tile art (frame count, colours) was not viewed.

"See it in action": https://shatteredpixel.com/ (game page with screenshots)

---

## Q3. Brogue CE per-cell fire and Cataclysm DDA fire sprites

### Takeaway
Brogue draws each fire cell as one glyph whose colour random-walks every turn. The colour is red 70 ± 15, green 20 ± 10, blue 0, on a 0 to 100 scale. Spread is per exposure. Grass ignites at 15%, dead grass at 40%, hay and wooden doors at 50%. A burning cell exposes itself and its 4 orthogonal neighbours each turn, with a cap of 12 exposures per cell. Fire turns to embers at 5% per turn, embers to ash at 3% per turn. In Cataclysm DDA's MShockXotto+ 32x32 tileset, low-intensity fire is a 7-frame loop at 136 ms per frame with a per-tile phase hash. Higher intensities fall back to one static 32x32 multitile with 6 connection shapes.

### Cited findings: Brogue CE
- Colour struct. Fields are base r, g, b, then redRand, greenRand, blueRand, a scalar rand, and `colorDances` ("dances with every refresh"). https://github.com/tmewett/BrogueCE/blob/master/src/brogue/Rogue.h
- `fireForeColor = {70, 20, 0, 15, 10, 0, 0, true}`. `lavaBackColor` has the same values. `ashForeColor = {20, 20, 20, 0, 0, 0, 20, false}`. `fireFlashColor = {750, 225, 0, 100, 50, 0, 0, true}`. https://github.com/tmewett/BrogueCE/blob/master/src/brogue/Globals.c
- Dance rule. `shuffleTerrainColors()` adds `rand_range(-600, 600)` to each dancing cell's random values, clamped to 0 to 1000. It is called with 100% of cells once per player turn (in `Time.c`). https://github.com/tmewett/BrogueCE/blob/master/src/brogue/IO.c and https://github.com/tmewett/BrogueCE/blob/master/src/brogue/Time.c
- Tile table (`Globals.c`). Columns are draw priority, chance to ignite, fire type, discover type, promote type, promote chance per 10000 per turn.
  - PLAIN_FIRE "billowing flames". Priority 10, promote to DF_EMBERS at 500, FIRE_LIGHT.
  - EMBERS "sputtering embers". Priority 70, fireForeColor, promote to DF_ASH at 300, EMBER_LIGHT.
  - ASH. Priority 80, ashForeColor, no light.
  - GRASS ignite 15, DEAD_GRASS 40, HAY 50, wooden DOOR 50, CARPET priority 85 burns to DF_EMBERS.
  - BRIMSTONE_FIRE promote 2500, GAS_FIRE 8000, DART_EXPLOSION 10000 (gone in one turn).
- Spread loop. Each turn, every fire cell not lit this turn calls `exposeTileToFire()` on itself and on its 4 orthogonal neighbours. `exposeTileToFire` returns early once `exposedToFire >= 12`, otherwise rolls `rand_percent(chanceToIgnite)` of the most flammable layer. https://github.com/tmewett/BrogueCE/blob/master/src/brogue/Time.c

### Cited findings: Cataclysm DDA, MShockXotto+ (32x32)
- Tile size. `tile_info.json` gives width 32, height 32, with extra sheets for 32x48 tall, 48x48 wide and 20x20 small sprites. https://github.com/I-am-Erk/CDDA-Tilesets/blob/master/gfx/MShockXotto%2B/tile_info.json
- `fd_fire_int1` is `"animated": true` with 7 sprites, each weight 8. Art credit "AlbertTheTerrible". https://github.com/I-am-Erk/CDDA-Tilesets/blob/master/gfx/MShockXotto%2B/pngs_tiles_32x32/field/fd_fire_int1/fd_fire_int1.json
- Frame clock. `cata_tiles.cpp` sets `animation_frame = ms / 17`, adds a per-location hash "so that everything does not blink at the same time", and treats weight as "the number of frames to show the tile for". https://github.com/CleverRaven/Cataclysm-DDA/blob/master/src/cata_tiles.cpp
- `fd_fire` base is a multitile. Background sprite when alone, plus fg sprites for center, corner, edge, t_connection, end_piece and unconnected, each over a shared bg. 8 sprites. https://github.com/I-am-Erk/CDDA-Tilesets/blob/master/gfx/MShockXotto%2B/pngs_tiles_32x32/field/fd_fire_0.json
- Intensity suffix. Fields use `_int1`, `_int2`, `_int3`. The loader tries `id + "_int" + level`. https://github.com/CleverRaven/Cataclysm-DDA/blob/master/doc/TILESET.md and `cata_tiles.cpp` line about `find_tile_looks_like`.
- `overlay_effect_onfire` is one static 32x32 sprite. https://github.com/I-am-Erk/CDDA-Tilesets/blob/master/gfx/MShockXotto%2B/pngs_tiles_32x32/character/overlay/effects/overlay_effect_onfire_0.json
- Only four tilesets in the repo ship `fd_fire` sprites: BrownLikeBears (20x20, 6 levels `fd_fire_0` to `_5`), GiantDays (20x20, `fd_fire_int1` with 2 frames), HitButton_iso and MShockXotto+. UltimateCataclysm has none in this repo tree [cited, grep of the repo tree via `gh api`].

### Inferences
- Brogue colour range. On the 0 to 100 scale, fire's red spans 70 to 85 and green 20 to 30, so the flicker is a hue wobble between deep red and orange, never yellow. Yellow appears only in flashes (`fireFlashColor` with red 750) [inference from values].
- Brogue cell lifetime. At 5% per turn, a fire cell's expected life is 20 turns and embers' 33 turns, if nothing else ends them [inference, other burn-out paths in `Time.c` line 1673 not read].
- CDDA loop. 7 frames x 8 x 17 ms = 136 ms per frame, 952 ms per loop [inference, arithmetic]. That sits between Tibia fields (120 ms) and RO.
- CDDA int2 and int3 in MShockXotto+ fall back to the static multitile because no `_int2` or `_int3` files exist [inference from the tree and loader].
- The CDDA multitile is the cheapest sub-tile trick found. 6 connection shapes make a fire region read as one blob, with no per-pixel work [inference].

### Gaps
- Brogue light catalog entries (FIRE_LIGHT radius and colour) live in a variant globals file I could not fetch (`GlobalsBrogue.c` 404 at the path tried).
- CDDA-Tilesets licence. No `LICENSE` at the repo root path I tried.
- UltimateCataclysm fire sprites may be in a compiled sheet outside this repo.

"See it in action": https://github.com/tmewett/BrogueCE (README screenshots) and https://cdda-guide.nornagon.net/field/fd_fire (not opened)

---

## Q4. Terraria campfire and flame jitter (16 px tiles)

### Takeaway
Terraria's campfire is an 8-frame loop at 66.7 ms per frame (533 ms loop), faster than any Tibia flame. Terraria's other trick costs no frames. Flame overlays are redrawn several times per tile with small additive offsets that are reseeded every 5 draw cycles, so flames shimmer without new art.

### Cited findings
- Campfire (tile 215). `tileFrameCounter[215]` counts to 4 ticks, then `tileFrame[215]` advances and wraps at 8. https://github.com/aoki-lizlov/terraria-decompiled/blob/master/root/Terraria/Main.cs (around line 17067)
- Animated 2-tile-high tiles step 36 px per frame in the sheet (`addFrY = Main.tileFrame[type] * 36`). https://github.com/aoki-lizlov/terraria-decompiled/blob/master/root/Terraria/GameContent/Drawing/TileDrawing.cs (around line 5669)
- Flame overlays. `GetTileFlameData` returns a flame count, an additive colour and offset ranges per flame texture. Example values: count 7, colour (50, 50, 50, 0), x and y in -10 to 10 x 0.3 px (texture 11); x -10 to 10 x 0.1 px and y -10 to 0 x 0.15 px (another texture); multiplier 0.075 (textures 17 and 20). Same `TileDrawing.cs`, around lines 2680 to 2715.
- Reseed. `Main.TileFrameSeed` gets a new value when `_drawCycleCounter` is 0, and the counter wraps every 5 draws. `Main.cs`, around line 62698.
- The seed is XORed with the tile position (`tileX << 32 | tileY`), so each tile jitters differently. `TileDrawing.cs`, around line 3208.

### Inferences
- 4 ticks at 60 Hz is 66.7 ms per frame. 8 frames is 533 ms per loop [inference, arithmetic].
- Reseed every 5 draws is about 83 ms at 60 fps, so the jitter runs at 12 Hz [inference].
- With 7 copies at 50/255 additive, the flame core sums to about 1.4x brightness and the edges blur by up to 3 px. At 32 px a port would double the offsets to ±6 px [inference].
- The campfire is a 3x2 tile object (48x32 px) [inference from the 36 px step, which is 2 rows of 16 px plus 2 px padding each].

### Gaps
- The torch's own flame entry (texture 0) and On Fire! debuff visuals were not read.
- Lava light values and Hellstone light were not read (`TileLightScanner.cs` not at the path tried).
- Terraria player frame size was not read.

"See it in action": https://terraria.wiki.gg/wiki/Campfire

---

## Q5. Pokémon Emerald volcanic ash (16 px metatiles, 16x32 player)

### Takeaway
Emerald's Route 113 ash is the closest Gen 3 analogue to "ash on the ground". Stepping on ash grass plays a 16x16, 5-frame puff of about 938 ms, then swaps the metatile to clean grass. The ground change is a single tile swap timed to the end of the puff.

### Cited findings
- `sAnim_Ash` is 5 frames of 12, 12, 8, 12, 12 GBA frames, on a 16x16 OAM (`gObjectEventBaseOam_16x16`). https://github.com/pret/pokeemerald/blob/master/src/data/field_effects/field_effect_objects.h
- `FldEff_Ash` places the sprite at the tile plus (8, 8) px. After a delay countdown it calls `MapGridSetMetatileIdAt` with the stored metatile. https://github.com/pret/pokeemerald/blob/master/src/field_effect_helpers.c

### Inferences
- At 59.73 Hz the frames are 201, 201, 134, 201, 201 ms, 56 frames or about 938 ms in total [inference, arithmetic].
- At 32 px, the same puff would be a 32x32 sprite. The delayed tile swap matches the "event, not diff" rule VFX #6 set for ignition [inference].

### Gaps
- Minish Cap (zeldaret/tmc) and pokeplatinum fire or lava field effects were not read.

"See it in action": https://bulbapedia.bulbagarden.net/wiki/Route_113 (may block bots)

---

## Q6. Spread speeds in m/s converted to tiles per second (BotW, Divinity OS2, Far Cry 2)

### Takeaway
Not found in this session. The conversion is ready for whoever finds the measurements.

### Inferences
- If one Tibia tile is about 1 m (inference from Tibia's 32 px tile holding one 32 px tall character), then tiles per second equals m/s. At 32 px tiles, 1 m/s is 32 px/s.
- For comparison, SPD and Brogue spread at most 1 tile per turn. Tibia walk speed puts a turn at roughly 400 ms per tile (VFX #11 note), so a turn-based front at that pace is about 2.5 tiles/s [inference].

### Gaps
- No fan measurement or developer talk with numbers for BotW grass fire, Divinity OS2 surface spread or Far Cry 2 spread was searched within budget.

---

## Q7. RPG Maker MV/MZ default fire animations

### Gaps
- MV and MZ default `Animations.json` were not found. GitHub code search for `"animation1Name":"Fire1"` returned nothing. The corescript repo has engine code only.
- Enter the Gungeon goop cell size and burn timers (ETG modding API) and Noita `materials.xml` fire values were not searched within budget.

---

## Summary table (for the report)

| Game | Tile px | Sprite px | Frames x ms | Number | Source |
|---|---|---|---|---|---|
| Tibia FIREAREA | 32 | 53x53 in 64 canvas | 40 + 13 x 60 | 820 ms, once | Canary appearances.dat |
| Tibia EXPLOSIONAREA | 32 | 31x31 | 12 x 50 + 1 x 100 | 700 ms, once | same |
| Tibia EXPLOSIONHIT | 32 | 35x35 | 35 to 110, easing | 660 ms, once | same |
| Tibia HITBYFIRE | 32 | 42x40 | 9 x 100 | 900 ms, once | same |
| Tibia FIREATTACK | 32 | 43x45 | 8 x 100 | 800 ms, once | same |
| Tibia SMOKE | 32 | 33x35 | 12 x 100 | 1200 ms | same |
| Tibia lava (classic) | 32 | 32x32, 8 variants | 3 x 500, synced | light 4 | same |
| Tibia lava (new) | 32 | 32x32 | 30 x 150, synced | 4.5 s loop | same |
| Tibia campfire | 32 | 32x32 | 5 x 100 | light 7 | same |
| Tibia burning wall | 32 | 37x31 | 5 x 100 | light 3 | same |
| SPD fire cell | 16 | 4 px squares | 1 per 30 ms, 0.6 s life | 20 live per cell, rise 14 px | Fire.java, FlameParticle.java |
| SPD burning char | 16 | 4 px squares | 1 per 60 ms | 10 live, 8 turns | CharSprite.java, Burning.java |
| SPD spread | 16 | n/a | 1 tile per turn | burn 4 turns, p = 1 | Fire.java |
| Brogue fire colour | glyph | n/a | random walk per turn | r 70 ± 15, g 20 ± 10 (of 100) | Globals.c, IO.c |
| Brogue ignition | glyph | n/a | per exposure | grass 15%, dead grass 40%, hay 50% | Globals.c |
| CDDA MShockXotto+ fd_fire_int1 | 32 | 32x32 | 7 x 136 ms | 952 ms loop | fd_fire_int1.json, cata_tiles.cpp |
| Terraria campfire | 16 | 3x2 tiles | 8 x 66.7 ms | 533 ms loop | Main.cs |
| Terraria flame jitter | 16 | overlay | reseed every 5 draws | 7 copies, ±3 px | TileDrawing.cs |
| Emerald ash puff | 16 | 16x16 | 201, 201, 134, 201, 201 ms | 938 ms, then tile swap | field_effect_objects.h |

## Gems

| Name | URL | Licence | Maturity | What it saves |
|---|---|---|---|---|
| Shattered Pixel Dungeon `Fire.java` + `FlameParticle.java` | https://github.com/00-Evan/shattered-pixel-dungeon | GPL-3.0 (read from LICENSE.txt) | Shipped on Android, iOS, desktop | A complete per-cell fire with particle visuals in about 150 lines. Good baseline for a "no flame sprites" layer. |
| CDDA-Tilesets MShockXotto+ field JSON | https://github.com/I-am-Erk/CDDA-Tilesets | not read | Shipped with Cataclysm DDA | A worked 32x32 fire multitile (6 connection shapes) and an animated-weight format with per-tile phase. |

## Sources
1. Canary appearances.dat: https://github.com/opentibiabr/canary/blob/main/data/items/appearances.dat
2. Canary appearances.proto: https://github.com/opentibiabr/canary/blob/main/src/protobuf/appearances.proto
3. Canary items.xml: https://github.com/opentibiabr/canary/blob/main/data/items/items.xml
4. TFS const.h: https://github.com/otland/forgottenserver/blob/master/src/const.h
5. SPD Fire.java: https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/actors/blobs/Fire.java
6. SPD FlameParticle.java: https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/effects/particles/FlameParticle.java
7. SPD SmokeParticle.java: https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/effects/particles/SmokeParticle.java
8. SPD BlobEmitter.java: https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/effects/BlobEmitter.java
9. SPD Emitter.java and PixelParticle.java: https://github.com/00-Evan/shattered-pixel-dungeon/tree/master/SPD-classes/src/main/java/com/watabou/noosa/particles
10. SPD CharSprite.java: https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/sprites/CharSprite.java
11. SPD Burning.java: https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/actors/buffs/Burning.java
12. SPD Level.java and Terrain.java: https://github.com/00-Evan/shattered-pixel-dungeon/tree/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/levels
13. Brogue CE Globals.c: https://github.com/tmewett/BrogueCE/blob/master/src/brogue/Globals.c
14. Brogue CE Rogue.h: https://github.com/tmewett/BrogueCE/blob/master/src/brogue/Rogue.h
15. Brogue CE Time.c: https://github.com/tmewett/BrogueCE/blob/master/src/brogue/Time.c
16. Brogue CE IO.c: https://github.com/tmewett/BrogueCE/blob/master/src/brogue/IO.c
17. CDDA TILESET.md: https://github.com/CleverRaven/Cataclysm-DDA/blob/master/doc/TILESET.md
18. CDDA cata_tiles.cpp: https://github.com/CleverRaven/Cataclysm-DDA/blob/master/src/cata_tiles.cpp
19. MShockXotto+ tile_info.json and fire JSON: https://github.com/I-am-Erk/CDDA-Tilesets/tree/master/gfx/MShockXotto%2B
20. Terraria decompile Main.cs: https://github.com/aoki-lizlov/terraria-decompiled/blob/master/root/Terraria/Main.cs
21. Terraria decompile TileDrawing.cs: https://github.com/aoki-lizlov/terraria-decompiled/blob/master/root/Terraria/GameContent/Drawing/TileDrawing.cs
22. pokeemerald field_effect_objects.h: https://github.com/pret/pokeemerald/blob/master/src/data/field_effects/field_effect_objects.h
23. pokeemerald field_effect_helpers.c: https://github.com/pret/pokeemerald/blob/master/src/field_effect_helpers.c

## Scratch
`scratch-17/` holds `decode_app.py` (copy of note 10's reader), `tibia-decode.txt` (raw decode of 38 items, 11 effects, 4 missiles), `spd/` (9 Java files), `brogue/` (Globals.c, Rogue.h, Time.c, IO.c), `cdda/` (TILESET.md, cata_tiles.cpp), `cdda-tree.txt` (CDDA-Tilesets file list), `terraria/` (Main.cs, TileDrawing.cs), `pokeemerald/` (two C files). Rerun Tibia with `.venv/bin/python -I scratch-17/decode_app.py scratch-10/canary/appearances.dat <object ids> <effect ids> <missile ids>`.
