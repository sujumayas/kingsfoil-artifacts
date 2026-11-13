# 16 - Gap games: dynamic ground snow, missing teardown rows, breath, trails, Tibia weather

Researcher 16, VFX #11 "Snow at 32 px". 28 tool calls.

Method. I read decompiled or published game data with `curl` and GitHub code search, plus wiki wikitext through `api.php`. I opened no images. Every number names the tile and sprite size it belongs to.

Legend
- **[C]** confirmed. I read the code, data file or wikitext in this session.
- **[S]** secondhand. A search summary or a page that describes the thing.
- **[K]** from memory. Treat as a lead.
- **[U]** unverified.
- **[I]** my inference or arithmetic.

## What this note adds to notes 10, 13 and 14

| Earlier gap | Where it was | What note 16 found | Status |
|---|---|---|---|
| "No sourced game at this size has per-pixel ground snow" | 10, Q6 | Still true for per-pixel fields in tile games. Four shipped tile games have run-time snow with one value per tile or per map: RimWorld (float per cell), Dwarf Fortress (byte per tile), Project Zomboid (one global fraction against fixed noise), Don't Starve Together (one global float). Noita has true per-pixel snow as a falling-sand material. | Filled, Q1 |
| "No sourced game gave a footprint size in px" | 10, Q6 | Factorio's footprint decal is 15x11 px at 32 px per tile, lives 600 ticks, fades over 125. | Filled, Q2 |
| Footprints tied to walk-cycle contact frames | 13, Q1 | Factorio stamps on run frames 5 and 16 (left) and 10 and 21 (right) of a 22-frame cycle. RimWorld stamps every 0.632 cell of travel and alternates feet. | Filled, Q2 |
| "No source for hat snow or breath in any shipped 2D game" | 13, Q6 | Breath is sourced in RimWorld and Don't Starve Together, with timings. Hat or shoulder snow is still not found. | Half filled, Q3 |
| "No measured trench width from any 2D game" | 13, Q5 | RimWorld removes 0.001 depth per cell entered. That is the only trail rule found. No width exists because the rule is one cell. | Filled with a rule, Q4 |
| "Not searched: Graveyard Keeper, Kynseed, CrossCode, Eastward" | 14, Q8 | CrossCode has a `SNOW` terrain type, `SNOW_FLAKES` environment particles and `BERGEN_SNOW` weather presets, on 16 px tiles. The other three are still unsourced. | Partly filled, Q5 |
| Falling snow in other shipped games | 14, Q5 | RimWorld draws snow as two panned overlay textures, no particles. Don't Starve Together uses up to 4,800 particles at 600 per second. | New, Q1 |
| Zelda not checked | 10, 13 | The Minish Cap decompilation and the ALttP C port hold no code named snow. | Closed as "none", Q5 |
| Official Tibia weather | 10, 14 | Three searches found no CipSoft weather or snow effect in the client. | Not found, Q6 |

---

## Q1. Shipped 2D games with dynamic ground snow

### Takeaway
Dynamic snow ships in tile games, but always as one number per tile or one number per map. The smooth look comes from the renderer. RimWorld interpolates a per-cell float to 9 vertices per cell. Project Zomboid compares one global fraction against a fixed noise grid and draws the result with 44 autotile pieces. Don't Starve Together lerps one overlay texture. Only Noita simulates snow per pixel, and Noita is a falling-sand game built for that.

### Cited findings, RimWorld 1.6 (top-down, 1 cell = 1 tile, decompiled)
All [C] from https://github.com/32bitx64bit/RW-Decompiled-1.6 and the Core defs mirror https://github.com/mezunnk/RimWorld.
- Storage. `SnowGrid` holds one `float` per map cell, 0 to 1 (`MaxDepth = 1f`). Saves pack it into a `ushort` (65,535 steps). File `Verse/SnowGrid.cs`.
- Where snow can sit. Not on cells with a full-fill building. Not on terrain with `holdSnowOrSand` false. The wiki adds that water and marsh never hold snow: https://rimworldwiki.com/wiki/Snow
- Deposit tick. `SteadyEnvironmentEffects` visits `ceil(map.Area * 0.0006)` cells per tick. Each visited unroofed cell gets `0.046 * SnowRate * noise`, where noise is Perlin (frequency 0.04, 5 octaves) remapped to 0.5 to 1. `SnowHard` has `snowRate` 1.2 and `SnowGentle` has 0.8 (`Core/Defs/WeatherDefs/Weathers.xml`).
- Melt. Per visit, `T * T * 0.00058` for 0 to 10 °C and `T * 0.0058` above 10 °C. Terrain with `meltSnowRadius` removes 0.06 at the centre, falling off linearly to the radius.
- Depth classes. Below 0.03 none, below 0.25 dusting, below 0.5 thin, below 0.75 medium, else thick. Extra move cost is 0, 0, 4, 8, 12 ticks per cell (`Verse/WeatherBuildupUtility.cs`). The wiki gives the result as 100%, 76%, 62% and 52% walk speed.
- Drawing. `SectionLayer_Snow` builds 9 vertices per cell. The centre vertex takes the cell's depth. Each edge midpoint averages 2 cells. Each corner averages 4 cells. Depth goes into vertex alpha of one snow material. There is no per-pixel field.
- Redraw rule. A section mesh is marked dirty only when a cell changes by more than 0.15, or with a 1.25% chance on smaller changes, or when depth reaches 0. Path cost is recalculated only when the depth class changes.
- Falling snow. `WeatherOverlay_SnowHard` and `_SnowGentle` are `WeatherOverlayDualPanner`. Each scrolls two textures of one material. Hard snow pans at 0.008 and 0.009 along (-0.5, -1) and (-0.48, -1). Gentle snow pans at 0.002 and 0.003 along (-0.25, -1) and (-0.24, -1). No particles.
- Weather effect on pawns. Hard snow multiplies move speed by 0.8 and accuracy by 0.8.

### Cited findings, Dwarf Fortress (Steam version, 32x32 px tiles)
- Tile size [C]. The wiki's graphics page says tile dimensions are "usually 32" and recommends `[TILE_DIM:32:32]`: https://dwarffortresswiki.org/index.php/Graphics
- Storage [C]. Snow is a material spatter. `block_square_event_material_spatterst` holds `amount[16][16]` of `uint8_t` per 16x16 map block, plus material type, index and state. That is one byte of depth per tile. Source: https://github.com/DFHack/df-structures/blob/master/df.block.xml
- Behaviour [C, wiki]. During snowfall the ground, trees and other surfaces "gradually become covered in snow". Magma under snow-covered ground melts it. Source: https://dwarffortresswiki.org/index.php/Weather

### Cited findings, Project Zomboid build 41.78 (isometric, decompiled)
All [C] from https://github.com/Ketum-Git/PZ-Javacode (`PZ_41.78/zombie/iso/IsoCell.java` and `zombie/iso/weather/ClimateManager.java`).
- One global number. `snowStrength` runs 0 to 10. It gains `snowFall` and loses `snowMeltStrength`. `snowFracNow = strength / 7.5`, capped at 1. The cell gets `setSnowTarget(int(snowFracNow * 100))`.
- Which squares are white. `SnowGrid` is 256x256 squares and wraps with modulo. A square has snow when `layeredNoise(x / 10, y / 10) <= frac / 100`. The noise has 3 layers and is built once. So the pattern is fixed and only the threshold moves.
- Drawing. Snow squares pick art from the `e_newsnow_ground_1_` sheet by their 4 neighbours. There are 4 square variants, 4 enclosed variants, and 3 variants each for 4 coves, 4 edges and 4 strips. That is 44 hand-drawn tiles.
- Change over time. The game keeps a previous and a current grid and cross-fades them over 5,000 ms (`snowTransitionTime`).
- Plants. Winter sprites on vegetation switch on when the fraction passes 0.2.
- Players can turn it off with the sandbox option `EnableSnowOnGround`.
- No footprints and no breath in code. GitHub code search for "footprint" in this repo returns 0 hits. "breath" returns only fish sound names.

### Cited findings, Don't Starve Together (2.5D, hand-drawn, published Lua scripts)
All [C] from https://github.com/taichunmin/dont-starve-together-game-scripts (`scripts/components/weather.lua`, `scripts/standardcomponents.lua`, `scripts/prefabs/snow.lua`).
- One global number. `_snowlevel` is a networked float, 0 to 1.
- Accumulate. `snowlevel += preciprate * dt / 300`. Full cover takes 300 s at rate 1.
- Melt. Above 0 degrees, `meltrate = 1/120 + (1/20) * min(T / 20, 1)` per second. That is 120 s when barely above zero and about 17 s at 20 degrees.
- Ground. `SetOverlayTexture("levels/textures/snow.tex")` then `SetOverlayLerp(snowlevel * 3)`. One overlay texture over the whole map, three colour slots.
- Objects. One global bool. When `snowlevel >= 0.015` every entity tagged `SnowCovered` shows a hand-drawn `snow` symbol in its animation (`AnimState:Show("snow")`). The wiki confirms snow "builds up on trees and many other objects": https://dontstarve.wiki.gg/wiki/Winter
- Flakes. `particles_per_tick = 20 * preciprate`, cap 4,800 particles, life 4.5 to 7.5 s, spawned in a 20-unit box around the player. The file steps at `dt = 1 / 30`.

### Cited findings, Noita (side view, falling-sand)
- Snow is a simulated material [C, wiki]. Four ids: `snow` (powder, density 8), `snow_static` (packed solid), `snow_sticky` (powder), `snow_b2` (rigid solid). All melt to water. Fire turns snow to water at rate 80 or steam at rate 20. Source: https://noita.wiki.gg/wiki/Snow
- Snow weather [C, wiki]. In December, January and February by the system clock, a run has a 1 in 12 chance of snowy weather. 75% of those drop the snow material and 25% drop slush. The flakes are material cells, so they pile up where they land. Source: https://noita.wiki.gg/wiki/Forest
- Scale [K]. One simulated cell is one art pixel.

### Cited findings, the rest of the list
- Factorio Space Age, Aquilo (32 px per tile at scale 1) [C]. Snow tiles are static hand-made terrain: `snow-flat`, `snow-crests`, `snow-lumpy` and more, each with a thawed `dust-*` twin linked by `frozen_variant`. They set snow walking sounds, a vehicle friction modifier of 1.8 and a grass-style particle puff on steps. Source: https://github.com/wube/factorio-data/blob/master/space-age/prototypes/tile/tiles-aquilo.lua
- Terraria [C, wiki]. Blizzard is the rain event seen in the snow biome. The page lists visuals, darker light and sound. It lists no ground build-up. One small life cue: "The player character will squint in Blizzards". Source: https://terraria.wiki.gg/wiki/Rain
- Rain World, Saint [C, wiki]. Snowfall "gradually increases into Blizzard". Wind pushes creatures. "The water texture in exposed areas is altered to show snow". Source: https://rainworld.miraheze.org/wiki/Rain
- Core Keeper [C, wiki]. The Biomes page names no snow biome. The only ice word is a boss name. Source: https://core-keeper.fandom.com/wiki/Biomes

### Inferences
- RimWorld sweep time [I]. 0.06% of cells per tick is a full pass every 1,667 ticks, about 28 s at 60 ticks per second. Hard snow adds 0.028 to 0.055 per visit. A cell reaches depth 1 after 18 to 36 visits, so 8 to 17 minutes at normal speed.
- RimWorld against VFX #1 [I]. VFX #1 deposits with 900 picks per frame on 57,600 cells, 1.56% per frame. RimWorld touches 0.06% per tick, 26 times fewer, and makes each deposit bigger. On a 1:1 field at 640x360 (230,400 cells) the RimWorld rate would be 138 picks per tick.
- The 0.15 redraw rule is an upload limiter [I]. Asterion can copy it. Keep the field in memory, and upload a chunk only when a cell has drifted by more than about 15% since the last upload.
- Zomboid's threshold trick is VFX #1's threshold at tile size [I]. A fixed noise value per tile compared with one synced number gives patchy, growing cover with zero per-tile network state. Add a dual-grid or 47-blob snow overlay for the edges. This is the cheapest shared snow for an MMO.
- Don't Starve's object snow is the cheapest roof and tree snow [I]. One hand-drawn cap layer per object, shown by one global bool at 1.5% snow level.
- Three of four games sync one number [I]. Only RimWorld and Dwarf Fortress keep per-tile depth, and both are single-machine simulations.
- Wiki mismatch [I]. The RimWorld wiki table gives gentle snow a 120% snow rate and hard snow 80%. The XML says the opposite (hard 1.2, gentle 0.8). Trust the XML.

### Gaps
- RimWorld's snow shader and texture were not read. How alpha becomes the visible edge is unknown.
- RimWorld's art px per cell is not sourced.
- How Dwarf Fortress draws the byte (how many snow sprites or levels) is not sourced.
- Zomboid build 42 moved snow to `FBORenderSnow.java`. I downloaded it and did not read it.
- Necesse, Kingdom Two Crowns and Songs of Syx returned nothing. Their wiki APIs failed and I ran no further search.
- Rain World's snow renderer was not read. A mod references a `SnowSource` class [S], so the game places snow emitters per room.

---

## Q2. Footprints with real numbers (Factorio, RimWorld)

### Takeaway
Two more shipped games give exact footprint rules. Factorio ties prints to named frames of the run cycle and keeps them 10 s, the same time as Tibia. RimWorld spaces prints by distance, alternates feet and only draws them when snow depth is at least 0.4.

### Cited findings, Factorio 2.0 (32 px per tile, art authored at 64 px per tile and drawn at scale 0.5)
All [C] from https://github.com/wube/factorio-data/blob/master/base/prototypes/entity/entities.lua and `character-animations.lua` in the same folder.
- The decal. `character-footprint-particle` is an `optimized-particle` on the `decals` layer. Sheet frames are 30x22 px at scale 0.5, so 15x11 px at 32 px per tile. 2 frames per row, 8 variations.
- Lifetime. `life_time = 600` ticks (10 s at 60 ticks per second) with `fade_away_duration = 125` ticks (2.1 s).
- Contact frames. `left_footprint_frames = {5, 16}`, `right_footprint_frames = {10, 21}`. The run animation has `frame_count = 22`.
- Side offset. `left_footprint_offset = {-0.1, 0}`, `right = {0.1, 0}`. That is 3.2 px each side at 32 px per tile.
- Character size. The run frame is 88x132 px at scale 0.5, so 44x66 px. `running_speed = 0.15` tiles per tick, 9 tiles per second.
- Which ground. A list of 16 tiles: `dry-dirt`, `dirt-1` to `dirt-7`, `sand-1` to `sand-3`, `nuclear-ground`, `red-desert-0` to `-3`. Other tiles get no print.
- Not on snow. The Aquilo snow tiles are not in that list, and `space-age/base-data-updates.lua` contains no "footprint". Aquilo steps only throw the grass-style particle puff.

### Cited findings, RimWorld 1.6
[C] from `RimWorld/PawnFootprintMaker.cs`, `RimWorld/FleckMaker.cs` and `Core/Defs/Effects/Fleck_Special.xml`.
- Spacing. A print is tried when the pawn has moved more than 0.632 cell since the last one (`FootprintIntervalDist`).
- Feet. A bool flips each print. The print is shifted 0.17 cell sideways times the square root of body size, and 0.3 cell toward the bottom of the sprite. It is rotated to the direction of travel.
- Snow rule. A print appears only if the terrain has `takeFootprints` and `snowGrid.GetDepth >= 0.4`. All 9 defs in `Terrain_Natural.xml` set `takeFootprints`.
- Lifetime. Fleck `Footprint` fades in over 0.08 s, holds 2.2 s and fades out over 2.6 s. Total 4.88 s. It is drawn instanced at scale 0.5.
- Prints do not change depth. They are decals over the snow layer.

### Inferences
- Converted to 32 px tiles [I]. RimWorld's stride is 20 px and its side offset is 5.4 px. Factorio's side offset is 3.2 px. For a 24x32 character a side offset of 3 to 4 px fits.
- Print size for Asterion [I]. Factorio's 15x11 px print belongs to a 44x66 px frame. Scaled by 32 / 66 it is about 7x5 px. A boot print of 6 to 8 px long is the sourced target for 24x32 characters.
- Lifetimes now cluster in two groups [I]. Handheld games use about 1 s (Platinum, Emerald). PC games use 5 to 12 s (RimWorld 4.9, Tibia 10, Factorio 10 plus 2.1 fade).
- Two prints per foot per 22 frames [I]. Factorio stamps 4 prints per cycle, so each stamp frame is a contact pose. With a 4-frame walk at 24x32, stamp on the 2 contact frames.
- Depth gate [I]. RimWorld hides prints in thin snow (below 0.4). VFX #1 stamps at any depth. A gate keeps a dusting clean and saves stamps.

### Gaps
- I did not open the footprint sheets, so the painted pixels inside 15x11 are unknown.
- RimWorld's fleck scale unit (cells) is my reading of `GetDataStatic(loc, map, def, 0.5f)`.
- HeartGold prints stay unsourced. `MetatileBehavior_IsSnow` is called from `battle_setup.c` and from an undecompiled unit `asm/unk_0205FD20.s` [C]. A search for "footprint" finds only ribbon and stamp text.

---

## Q3. Breath and snow on the character

### Takeaway
Breath in the cold is sourced in two shipped games and costs almost nothing: a few puff sprites on a timer when the temperature is under a threshold. Snow settling on a hat or shoulders was not found in any shipped 2D game.

### Cited findings
- RimWorld breath [C]. `PawnBreathMoteMaker`: a 320-tick cycle per pawn, offset by a hash so pawns do not breathe in step. For the first 80 ticks it throws one `AirPuff` every 8 ticks, so 10 puffs per breath. Conditions: ambient temperature under 0 °C, humanlike, standing. The puff starts 0.21 cell in front of the head, flies at 0.1 to 0.8 cells per second within plus or minus 10 degrees, and inherits half the pawn's velocity. `AirPuff` fades in over 0.04 s, holds 0.03 s and fades out over 1 s.
- Don't Starve Together breath [C]. `components/frostybreather.lua`: breath is on when local temperature is at or below `TUNING.FROSTY_BREATH = -5`. One puff is emitted each time the idle animation ends. No puff when the character faces up. The emitter sits at offset (0.3, 1.15, 0) for normal characters. `prefabs/frostbreath.lua`: cap 64 particles, life 2.25 to 2.5 s, scale grows from 0.4 to 3, alpha goes 0, 128 at 10%, 64 at 30%, 0 at the end, upward speed 0.005.
- Rain World [C, wiki]. Strawberry Lizards' colour "fades as snow falls on them". Saint's fur changes colour with temperature and Saint shivers. This is a tint, not a snow layer. Source: https://rainworld.miraheze.org/wiki/Rain
- Terraria [C, wiki]. The character squints in blizzards.
- Don't Starve Together covers objects in snow, not characters (Q1).

### Inferences
- A breath rule for Asterion [I]. Every 5 s per character, offset by character id, emit 3 to 5 puffs over 1.3 s in the facing direction. Skip when facing up. Only in tiles flagged cold. Use 2 to 4 px puffs that grow and fade over 1 s.
- With 20 players that is at most about 100 live puffs if everyone exhales together, and the id offset prevents that [I].
- Hat snow has no reference [I]. If wanted, the Don't Starve object method is the model: one hand-drawn snow layer per outfit head and shoulders, shown after N seconds standing still in snowfall, cleared on the first step.

### Gaps
- No shipped 2D game with snow settling on a character was found. One web search returned only jam games and devlogs with no numbers.
- Puff sprite sizes in px were not read (images are off limits).

---

## Q4. Trenches and ploughed trails

### Takeaway
Only RimWorld has a trail rule, and it is tiny: each large pawn removes 0.001 of depth from the cell it enters. Trails come from traffic, not from one walker. No game in the list ploughs a visible trench behind a single character.

### Cited findings
- RimWorld [C]. `Pawn_PathFollower.TryEnterNextPathCell`: `if (pawn.BodySize > 0.9f) snowGrid.AddDepth(pawn.Position, -0.001f)`. The constant is named `SnowReductionFromWalking`. Human body size is 1 [K], so people count and small animals do not.
- RimWorld snow clearing [C, wiki]. Colonists remove snow inside a player-drawn Snow Clear Zone. Fire, steam geysers and lightning also remove it: https://rimworldwiki.com/wiki/Snow
- Factorio [C]. No snow prints or tracks on Aquilo (Q2).
- Project Zomboid [C by search]. No footprint code in build 41.78.
- Don't Starve Together [K]. I know of no player trail in snow. I did not grep the scripts for it.

### Inferences
- 250 passes drop one depth class in RimWorld [I]. 1,000 passes clear a full cell. The path stays faster because the pathfinder reads the depth class, so traffic reinforces itself.
- For Asterion [I]. A per-tile "traffic" counter that lowers snow level by a small step per player step gives worn paths on busy routes for one byte per tile. It needs no per-pixel state and syncs like Tibia's footprint tiles.
- Width [I]. No game states a width. With tile-to-tile movement the natural width is one tile, 32 px, with the dual-grid edge art softening it.

### Gaps
- No 2D game with a single-walker trench was found.
- Don't Starve Together was not checked in code for trails.

---

## Q5. Teardown rows that were unsourced

### Takeaway
CrossCode is now partly sourced from its community map editor. Both Zelda games and EarthBound have no code named snow. Gen 5 is confirmed only for seasons and snow-made paths. Eastward, Sea of Stars, Chained Echoes, Graveyard Keeper, Moonlighter, Kynseed, Graal, Chrono Trigger and Secret of Mana stay unsourced.

| Game | Tile px | Character px | Internal resolution | Snow ground | Footprints | Falling snow | Sink or slowdown | See it in action |
|---|---|---|---|---|---|---|---|---|
| RimWorld 1.6 | 1 cell, art px not sourced | | | Float 0 to 1 per cell, 9-vertex alpha mesh [C] | Yes at depth >= 0.4. Every 0.632 cell, alternating feet, 4.88 s [C] | Two panned overlay textures [C] | +0 / 0 / 4 / 8 / 12 ticks per cell by depth class [C] | https://rimworldwiki.com/wiki/Snow |
| Dwarf Fortress (Steam) | 32 [C] | 32 [C, same tile] | | Byte per tile in a 16x16 block spatter [C] | | | | https://dwarffortresswiki.org/index.php/Weather |
| Project Zomboid 41.78 | Isometric, 64x32 at 1x [K] | | | Global fraction against 256x256 noise, 44 autotile pieces, 5 s cross-fade [C] | None in code [C by search] | Not read | Not read | https://pzwiki.net/wiki/Weather |
| Don't Starve Together | Not tile art | | | One global float, one overlay texture, lerp x3 [C] | None [K] | 600 particles per second, cap 4,800, life 4.5 to 7.5 s [C] | None in weather code | https://dontstarve.wiki.gg/wiki/Winter |
| Factorio 2.0 and Space Age | 32 at scale 1 [C from sprite scales] | 44x66 frame [C] | | Static Aquilo tiles with frozen and thawed twins [C] | Not on snow. On dirt and sand, 15x11 px, 10 s plus 2.1 s fade, run frames 5, 10, 16, 21 [C] | Not read | Vehicle friction x1.8 on snow tiles [C] | https://wiki.factorio.com/Aquilo |
| Noita | 1 px cells [K] | | | Per-pixel powder material, melts to water [C wiki] | The material moves when walked through [K] | Falling material cells, 1 in 12 runs in winter months [C wiki] | | https://noita.wiki.gg/wiki/Snow |
| Terraria | 16 [K] | | | Snow blocks, no build-up listed [C wiki] | | Blizzard overlay in snow biome [C wiki] | | https://terraria.wiki.gg/wiki/Rain |
| Rain World (Saint) | 20 [K] | | 1366x768 [K] | Not read | | Snowfall grows into blizzard over the cycle [C wiki] | Wind pushes creatures [C wiki] | https://rainworld.miraheze.org/wiki/Rain |
| CrossCode | 16 [C] | about 32 tall [U] | 568x320 [S, note 10] | Hand-drawn snow tiles [S devlog summary]. Props carry terrain `SNOW` or `ICE` [C] | Not found | Env particle type `SNOW_FLAKES`, also `COLD_CRYSTALS`. Weather presets `BERGEN_SNOW_START`, `BERGEN_SNOW` [C] | | https://www.moddb.com/news/devlog-70-milestone-030-quest-menu-story-and-bergen-trail |
| Zelda: The Minish Cap | 16 [K] | | 240x160 [K] | No code named snow, blizzard, snowfall or snowflake [C by search] | | None [C by search] | | https://github.com/zeldaret/tmc |
| Zelda: A Link to the Past | 16 [K] | | 256x224 [K] | No code named snow [C by search] | | None. Rain overlay only (`OverworldOverlay_HandleRain`) [C] | | https://github.com/snesrev/zelda3/blob/master/src/overworld.c |
| EarthBound | | | 256x224 [K] | "snow" matches only snowman text entries [C by search] | | None by name [C by search] | | https://github.com/Herringway/ebsrc |
| Pokémon HeartGold | 16 units [U] | 32x32 [U] | 256x192 [K] | One snow behaviour [C, note 10] | Not found in decompiled C [C by search] | | | https://github.com/pret/pokeheartgold/blob/master/src/metatile_behavior.c |
| Pokémon Black and White | | | 256x192 [K] | Winter snowfall opens paths in Icirrus City, Twist Mountain, Route 8, Moor of Icirrus, Dragonspiral Tower [C, Serebii] | Not mentioned | Rain areas snow in winter [C, Serebii] | Not mentioned | https://www.serebii.net/blackwhite/seasons.shtml |
| Core Keeper | | | | No snow biome on the Biomes page [C wiki] | | | | https://core-keeper.fandom.com/wiki/Biomes |

Notes on the table
- CrossCode sources [C]. `TILE_SIZE = 16` in https://github.com/CCDirectLink/crosscode-map-editor/blob/master/webapp/src/app/services/globals.ts . Terrain options in `webapp/src/assets/entities.json`. The `SET_ENV_PARTICLES` event with `particleType`, `spawner` and `quantity` in `webapp/src/assets/events.json`. Weather names in `webapp/src/assets/map-settings.json`. These are editor schemas. They list names, not numbers.
- Search method for "none" rows. GitHub code search is indexed for all three repos. In `zeldaret/tmc` "Ezlo" returns hits and the four snow words return 0. In `snesrev/zelda3` "rain" returns 5 files and "snow" returns 0.
- Gen 5 seasons [C, Serebii]. Each season lasts one real month. Winter falls in April, August and December.
- Sea of Stars [S]. Articles say only that the game has a 16:9 internal image and a Pixel Perfect option. No pixel count.

### Gaps
- CrossCode footprints, flake size and count. The game code is closed and obfuscated.
- Gen 5 deep snow, prints, tile and sprite sizes. No decompilation was found (`pret/pokeblack` search returned 0 hits). Bulbapedia's API answers with a bot check.
- Eastward, Chained Echoes, Graveyard Keeper, Moonlighter, Kynseed, Ragnarok (beyond note 10), Graal, Chrono Trigger, Secret of Mana. Nothing sourced. I believe Graveyard Keeper and Moonlighter have no snow area at all [K].

---

## Q6. Tibia since 2020: official weather or snow effects

### Takeaway
Not found. Nothing I could reach shows CipSoft adding a weather or falling-snow effect to the official client. Treat "Tibia has no falling snow" as still unverified, with three failed searches behind it.

### Cited findings
- TibiaWiki search for "weather effects client" through `api.php` returns pages such as Client Feature Effects, Effects, Map Effect and Framerate. None is a weather page [C]. Source: https://tibia.fandom.com/wiki/Effects
- Two web searches for an official weather option or winter-update snow effect returned no CipSoft or tibia.com page [S].
- An Otland thread has players wishing for a rain system in the Tibia 11 client. That is a wish, not a feature [S]: https://otland.net/threads/cipsoft-tibias-auto-loot-and-window-location-update-pretty-awesome.255853/

### Gaps
- tibia.com news archives and client changelogs were not read directly.
- The "Client Feature Effects" wiki page was listed but not opened.

---

## Patterns across this note

### Cited patterns (each built from [C] items above)
- Run-time snow in tile games is 1 number per tile at most: RimWorld float, Dwarf Fortress byte, Zomboid 1 bit from a threshold.
- Two of the four sync a single global number (Zomboid, Don't Starve Together).
- Prints are decals with a timer in RimWorld and Factorio. Neither edits the snow depth.
- Print timers: 4.88 s (RimWorld), 10 s plus 2.1 s fade (Factorio), 10 s (Tibia, note 10).
- Falling snow is an overlay in RimWorld and particles in Don't Starve Together. Neither draws a landing.

### Inferences for Asterion (32 px tiles, 24x32 characters, 640x360)
- A three-level design matches what ships [I]. Level 1, one synced snow number plus fixed per-tile noise for coverage (Zomboid). Level 2, a per-tile byte for depth and traffic wear, server-owned (RimWorld, Dwarf Fortress, Tibia). Level 3, the VFX #1 per-pixel field as a local cosmetic layer near the camera.
- The per-pixel field has no precedent in a shared-world tile game [I]. Keep it client-only and seeded from levels 1 and 2.
- Decal prints of about 7x5 px, 5 to 10 s life, gated by depth, stamped on contact frames, are the sourced default [I].

---

## Gems (open or readable code)

Licences were not read from LICENSE files in this session. Treat every decompilation as read-only.

| Name | URL | Licence | What it gives |
|---|---|---|---|
| RW-Decompiled-1.6 | https://github.com/32bitx64bit/RW-Decompiled-1.6 | Decompiled commercial code. Read only. | `SnowGrid`, `SectionLayer_Snow`, `PawnFootprintMaker`, `PawnBreathMoteMaker`, `SteadyEnvironmentEffects`. A full per-cell snow system in about 500 lines. |
| factorio-data | https://github.com/wube/factorio-data | Published by Wube, licence not read. | Footprint decal sizes, contact frames, lifetimes, tile lists. |
| DST game scripts mirror | https://github.com/taichunmin/dont-starve-together-game-scripts | Klei's shipped Lua, mirror. Read only. | `weather.lua` snow level and overlay, `frostybreather.lua`, `snow.lua` particles. |
| PZ-Javacode | https://github.com/Ketum-Git/PZ-Javacode | Decompiled commercial code. Read only. | `IsoCell.SnowGrid`: noise threshold plus 44-piece autotile and cross-fade. |
| df-structures | https://github.com/DFHack/df-structures | Not read. | Memory layout of the snow spatter event. |
| crosscode-map-editor | https://github.com/CCDirectLink/crosscode-map-editor | Not read. | CrossCode tile size, terrain, weather and particle names. |

## Scratch files
`scratch-16/` holds the small files I read, in `rw/`, `dst/`, `pz/`, `factorio/`, `cc/`, `df/` and `wiki/`. Large downloads were deleted after reading. The URLs below fetch them again.

## Sources
1. RimWorld `Verse/SnowGrid.cs`: https://github.com/32bitx64bit/RW-Decompiled-1.6/blob/HEAD/Verse/SnowGrid.cs
2. RimWorld `Verse/SectionLayer_Snow.cs`: https://github.com/32bitx64bit/RW-Decompiled-1.6/blob/HEAD/Verse/SectionLayer_Snow.cs
3. RimWorld `Verse/WeatherBuildupUtility.cs`: https://github.com/32bitx64bit/RW-Decompiled-1.6/blob/HEAD/Verse/WeatherBuildupUtility.cs
4. RimWorld `RimWorld/SteadyEnvironmentEffects.cs`: https://github.com/32bitx64bit/RW-Decompiled-1.6/blob/HEAD/RimWorld/SteadyEnvironmentEffects.cs
5. RimWorld `Verse.AI/Pawn_PathFollower.cs`: https://github.com/32bitx64bit/RW-Decompiled-1.6/blob/HEAD/Verse.AI/Pawn_PathFollower.cs
6. RimWorld `RimWorld/PawnFootprintMaker.cs`: https://github.com/32bitx64bit/RW-Decompiled-1.6/blob/HEAD/RimWorld/PawnFootprintMaker.cs
7. RimWorld `RimWorld/PawnBreathMoteMaker.cs`: https://github.com/32bitx64bit/RW-Decompiled-1.6/blob/HEAD/RimWorld/PawnBreathMoteMaker.cs
8. RimWorld `RimWorld/FleckMaker.cs`: https://github.com/32bitx64bit/RW-Decompiled-1.6/blob/HEAD/RimWorld/FleckMaker.cs
9. RimWorld `WeatherOverlay_SnowHard.cs` and `_SnowGentle.cs`: https://github.com/32bitx64bit/RW-Decompiled-1.6/blob/HEAD/RimWorld/WeatherOverlay_SnowHard.cs
10. RimWorld `Verse/WeatherOverlayDualPanner.cs`: https://github.com/32bitx64bit/RW-Decompiled-1.6/blob/HEAD/Verse/WeatherOverlayDualPanner.cs
11. RimWorld Core defs, `Fleck_Special.xml`: https://github.com/mezunnk/RimWorld/blob/HEAD/Core/Defs/Effects/Fleck_Special.xml
12. RimWorld Core defs, `Fleck_Visual.xml`: https://github.com/mezunnk/RimWorld/blob/HEAD/Core/Defs/Effects/Fleck_Visual.xml
13. RimWorld Core defs, `Weathers.xml`: https://github.com/mezunnk/RimWorld/blob/HEAD/Core/Defs/WeatherDefs/Weathers.xml
14. RimWorld Core defs, `Terrain_Natural.xml`: https://github.com/mezunnk/RimWorld/blob/HEAD/Core/Defs/TerrainDefs/Terrain_Natural.xml
15. RimWorld Wiki, Snow: https://rimworldwiki.com/wiki/Snow
16. DFHack df-structures, `df.block.xml`: https://github.com/DFHack/df-structures/blob/master/df.block.xml
17. Dwarf Fortress Wiki, Weather: https://dwarffortresswiki.org/index.php/Weather
18. Dwarf Fortress Wiki, Graphics: https://dwarffortresswiki.org/index.php/Graphics
19. Project Zomboid 41.78 `IsoCell.java`: https://github.com/Ketum-Git/PZ-Javacode/blob/HEAD/PZ_41.78/zombie/iso/IsoCell.java
20. Project Zomboid 41.78 `ClimateManager.java`: https://github.com/Ketum-Git/PZ-Javacode/blob/HEAD/PZ_41.78/zombie/iso/weather/ClimateManager.java
21. Project Zomboid 42 `FBORenderSnow.java` (downloaded, not read): https://github.com/geromet/PZJavaDocs/blob/HEAD/sources/zombie/iso/fboRenderChunk/FBORenderSnow.java
22. DST `components/weather.lua`: https://github.com/taichunmin/dont-starve-together-game-scripts/blob/HEAD/scripts/components/weather.lua
23. DST `standardcomponents.lua`: https://github.com/taichunmin/dont-starve-together-game-scripts/blob/HEAD/scripts/standardcomponents.lua
24. DST `components/frostybreather.lua`: https://github.com/taichunmin/dont-starve-together-game-scripts/blob/HEAD/scripts/components/frostybreather.lua
25. DST `prefabs/frostbreath.lua`: https://github.com/taichunmin/dont-starve-together-game-scripts/blob/HEAD/scripts/prefabs/frostbreath.lua
26. DST `prefabs/snow.lua`: https://github.com/taichunmin/dont-starve-together-game-scripts/blob/HEAD/scripts/prefabs/snow.lua
27. DST `tuning.lua` (`FROSTY_BREATH = -5`): https://github.com/taichunmin/dont-starve-together-game-scripts/blob/HEAD/scripts/tuning.lua
28. Don't Starve Wiki, Winter: https://dontstarve.wiki.gg/wiki/Winter
29. Factorio data, `entities.lua`: https://github.com/wube/factorio-data/blob/master/base/prototypes/entity/entities.lua
30. Factorio data, `character-animations.lua`: https://github.com/wube/factorio-data/blob/master/base/prototypes/entity/character-animations.lua
31. Factorio data, `tiles-aquilo.lua`: https://github.com/wube/factorio-data/blob/master/space-age/prototypes/tile/tiles-aquilo.lua
32. Factorio data, `base-data-updates.lua`: https://github.com/wube/factorio-data/blob/master/space-age/base-data-updates.lua
33. Noita Wiki, Snow: https://noita.wiki.gg/wiki/Snow
34. Noita Wiki, Forest (Weather section): https://noita.wiki.gg/wiki/Forest
35. Terraria Wiki, Rain: https://terraria.wiki.gg/wiki/Rain
36. Rain World Wiki, Rain (Blizzard section): https://rainworld.miraheze.org/wiki/Rain
37. Rain World Wiki, Saint: https://rainworld.miraheze.org/wiki/Saint
38. Core Keeper Wiki, Biomes: https://core-keeper.fandom.com/wiki/Biomes
39. CrossCode map editor, `globals.ts`: https://github.com/CCDirectLink/crosscode-map-editor/blob/master/webapp/src/app/services/globals.ts
40. CrossCode map editor, `entities.json`, `events.json`, `map-settings.json`: https://github.com/CCDirectLink/crosscode-map-editor/tree/master/webapp/src/assets
41. CrossCode DevLog 70 (search summary): https://www.moddb.com/news/devlog-70-milestone-030-quest-menu-story-and-bergen-trail
42. The Minish Cap decompilation: https://github.com/zeldaret/tmc
43. A Link to the Past C port, `overworld.c`: https://github.com/snesrev/zelda3/blob/master/src/overworld.c
44. EarthBound disassembly: https://github.com/Herringway/ebsrc
45. pokeheartgold `metatile_behavior.c`: https://github.com/pret/pokeheartgold/blob/master/src/metatile_behavior.c
46. Serebii, Black and White seasons: https://www.serebii.net/blackwhite/seasons.shtml
47. TibiaWiki, Effects (search result list): https://tibia.fandom.com/wiki/Effects
48. Otland thread on the Tibia 11 client (search summary): https://otland.net/threads/cipsoft-tibias-auto-loot-and-window-location-update-pretty-awesome.255853/
49. Sea of Stars Pixel Perfect option (search summary): https://primagames.com/tips/what-is-the-pixel-perfect-option-in-sea-of-stars-answered
