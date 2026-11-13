# 15 Spreading fire and smoke on 32 px tiles (design side)

Scope items 2, 3 and 4, design side. Spread speed in tile units, burning tile states and durations, multi-tile trees and houses, regrowth, smoke at 32 px, and the MMO view. VFX #6 settled the spread rule, the material table (report §6b), the smoke field and determinism. This note only asks what changes when the cell becomes a 32 px tile.

Tags. [cited] means a source says it (URL given). [inference] means my reasoning or arithmetic. [measured here] means a script I ran in `scratch-15/` on 2026-11-13 (Node, Apple M4 Pro).

Units used below. One tile = 32x32 px. Screen = 640x360 = 20 x 11.25 tiles (20 x 12 = 240 tiles counting the partial row). Player walk = 400 ms per tile = 2.5 tiles/s = 80 px/s (VFX #11 CONTEXT). VFX #6 cell = 8 px, server tick 4 Hz.

Source files I pulled for this note (all in `scratch-15/`, not images): RimWorld `Fire.cs` and `FireUtility.cs` decompile, Don't Starve Together `standardcomponents.lua`, `components/propagator.lua`, `components/burnable.lua`, `tuning.lua`, `prefabs/evergreens.lua`, Project Zomboid 41.78 `IsoFire.java`, `IsoFireManager.java`, `IsoGridSquare.java` decompile, Cataclysm DDA `field_type.json` and `terrain-walls.json`, TFS `map.h`, and wiki pages via `api.php`. The decompiles are reference only. They carry no reuse licence, so none of them go in the gems table.

---

## Q1. How fast does fire move in tile games, in tiles per second?

### Takeaway
Games keep spreading fire slower than the player walks. The roguelikes cap it at 1 cell per turn by construction. RimWorld needs about 30 s before a new fire can jump again. Don't Starve only crosses gaps of about one tile. Real grass fires run 2.8 to 4.2 m/s, which at about 1 m per tile is faster than our 2.5 tiles/s walk, and no game I found copies that. For Asterion, pick 0.3 to 1.0 tiles/s (10 to 32 px/s). That reads as "moving" at 32 px and stays below walking speed.

### Cited findings
| Game | What the code or source says | Native units | Converted (inference) |
|---|---|---|---|
| RimWorld (decompile, version not stated in the repo) | New fire starts at `fireSize = 0.1`. It may spread only when `fireSize > 1`. Growth is `0.00055 * flammabilityMax * 150` per 150-tick complex calc. Spread interval `150 - (fireSize - 1) * 40` ticks, floor 75. Each try picks one of the 8 adjacent cells (80%) or a cell in radial slots 10 to 20, about 2 tiles away (20%, launched as a Spark that needs line of sight). Ignite chance = target flammability. https://github.com/josh-m/RW-Decompile/blob/master/RimWorld/Fire.cs , https://github.com/josh-m/RW-Decompile/blob/master/RimWorld/FireUtility.cs | ticks (60 per s at 1x, https://rimworldwiki.com/wiki/Time , not fetched this session) | Growth from 0.1 to 1.0 at flammability 1 takes 10.9 calcs = 1,636 ticks = 27 s. Then one try every 2.0 to 2.5 s. One hop is about 30 s, so roughly 0.03 to 0.05 tiles/s at 1x (1 to 1.6 px/s at 32 px). Untested in game. |
| RimWorld | Fire burns the floor after `TicksToBurnFloor = 7500` ticks. Same source. | ticks | 125 s per tile before the floor scorches |
| Don't Starve Together | Tile = 4 world units ("4 is TILE_SCALE" in tuning.lua). Propagator updates every `PROPAGATOR_DT = 0.5` s. Heat to a neighbour = `heatoutput * max(0.1, 1 - d²/r²) * dt`. Small propagator range 3 to 5 units, heat 3 to 5, flashpoint 5 to 10. Medium range 5 to 7, heat 5 to 8.5, flashpoint 15 to 25. Large range 6 to 8, flashpoint 45 to 55. Spring multiplies range by 0.67. https://github.com/taichunmin/dont-starve-together-game-scripts/blob/master/standardcomponents.lua , https://github.com/taichunmin/dont-starve-together-game-scripts/blob/master/components/propagator.lua , https://github.com/taichunmin/dont-starve-together-game-scripts/blob/master/tuning.lua | world units, s | Small range = 0.75 to 1.25 tiles. Two grass tufts half a tile apart get about 3 heat/s, so they reach a flashpoint of 7.5 in about 2.5 s, which is about 0.2 tiles/s. Tufts a full tile apart sit at the 0.1 floor and take about 19 s, longer than a 10 s burn, so the fire stops. Spacing sets the speed. |
| Minecraft Java | Fire block ticks every 30 to 40 game ticks (1.5 to 2 s). Ignition degree `(max adjacent flammability + 7*difficulty + 40) / (age + 30)` against base 100 for the 3x3x3 range. https://minecraft.wiki/w/Fire | blocks, game ticks | Short grass (ignite odds 60) on Normal at age 0 gives 114 / 30 = 3.8, about 3.8% per target per block tick. One block = 1 m. A front speed is not published (gap). The tick alone caps a single hop chain at 1 block per 1.5 s = 0.67 blocks/s. |
| Brogue CE | Fire tests the 4 cardinal neighbours only, once per environment update. Grass 15%, dead grass 40% (VFX #6 note 03, https://raw.githubusercontent.com/tmewett/BrogueCE/master/src/brogue/Time.c ). | cells per turn | At most 1 cell per turn, which equals one player step. Fire can match a walking player but never outrun one. |
| Sigil of Kings | About 5 turns of fuel, inert for the first 3 to 4, tree ignite 20% per attempt (VFX #6 report D1, https://byte-arcane.itch.io/sigil-of-kings/devlog/712302/wildfires ). | turns | A 3 to 4 turn delay per hop gives at most about 0.25 to 0.33 cells per turn |
| Project Zomboid 41.78 (decompile) | A fire's `Life` is 800 to 3,000 age units. It spreads once at a random point in `[0, Life/2)`. It makes 1 to 3 tries (1 in 50 chance of +15) at one of 13 neighbours, which include the squares above and below. Each try needs `Energy` at least the target's requirement. No spread while it rains. Server only. https://github.com/Ketum-Git/PZ-Javacode/blob/master/PZ_41.78/zombie/iso/objects/IsoFire.java | age units | The age unit is `accum += multiplier / 1.6` per update. I could not pin it to seconds (gap). |
| Far Cry 2 | Early scope was grass patches no bigger than 10 x 10 m. A pre-release test set "miles of terrain" on fire in about 2 minutes, which is why spread got a cap (VFX #6 note 02, https://www.gamedeveloper.com/game-platforms/interview-how-i-far-cry-2-i-s-fire-fuels-spreads ). Cell size in metres is not given (https://jflevesque.com/2012/12/06/far-cry-how-the-fire-burns-and-spreads/). | m | Uncapped it was more than about 13 m/s (1 mile in 120 s), which the team judged too fast |
| Real grassland (CSIRO) | Sustained forward spread of about 10 to 15 km/h under high fire danger (search snippet, https://research.csiro.au/spark/news ). | km/h | 2.8 to 4.2 m/s. At 1 m per tile that is 1.1 to 1.7 times our walk speed. |

### Inferences
- Roguelikes tie fire to the turn, so fire speed is at most player speed. A real-time tile MMO has no turn, so it needs an explicit cap. The VFX #6 Moore rule gives one for free. A tile can light a neighbour at most once per spread roll, so the axis speed is at most 1 tile per roll (Q2 measured this).
- A designer's ladder at 32 px:
  - 0.1 tiles/s (3 px/s) reads as smouldering creep.
  - 0.3 to 0.5 tiles/s (10 to 16 px/s) is green grass. You can watch it and walk away.
  - 0.8 to 1.0 tiles/s (26 to 32 px/s) is dry grass, brush or oil. It is a threat, but a walking player (80 px/s) escapes.
  - Above 2.5 tiles/s it outruns the player. Use that only for scripted events or explosions.

### Gaps
- No numbers found this session for BotW grass fire (m/s), Terraria, Noita, Dwarf Fortress spread rate, Divinity OS2 surface lifetimes, Spelunky, Into the Breach or Enter the Gungeon goop fire. The BotW search returned only real-world grassfire pages. The Dwarf Fortress wiki Fire page names what burns but gives no rate (https://dwarffortresswiki.org/index.php/DF2014:Fire). The Noita Fire page says burn rates vary by material, with whiskey and flammable gas near instant and coal slowest, but gives no px/s (https://noita.wiki.gg/wiki/Fire).
- The RimWorld conversion assumes flammability 1 and a 60 Hz tick at 1x. I did not check either in game, and the decompile version is unknown.

---

## Q2. What does the VFX #6 rule do if each cell becomes a 32 px tile?

### Takeaway
Spread rate is per tick. Keep the VFX #6 numbers, swap 8 px cells for 32 px tiles, and the front moves 4 times faster in px/s. Green grass would move 2.1 tiles/s and dry grass 3.7 tiles/s. Dry grass would then outrun a walking player (2.5 tiles/s). The cleanest fix is to roll spread once per second per tile and keep the material numbers. That returns the exact VFX #6 px/s (16 to 32 px/s, 0.5 to 1.0 tiles/s). Burn times stretch to 2 to 20 s, long enough for 32 px flame loops to play several times.

### Measured here (`scratch-15/front.js`)
Line ignition on a 400 x 60 strip (y wraps), one fuel, Moore neighbourhood, diagonals x 0.7, IGNITING flips at the end of the tick, hash RNG, 300 ticks, 5 seeds. Speed is the slope of the front over the second half of the run.

| Material (VFX #6 §6b) | p | Burn ticks | Cells per tick | VFX #6 at 8 px, 4 Hz | Same numbers at 32 px tiles, 4 Hz | Burning band depth (cells) |
|---|---|---|---|---|---|---|
| Green grass | 0.15 | 3 | 0.52 | 16.5 px/s | 66 px/s = 2.1 tiles/s | 1.4 |
| Dry grass | 0.40 | 2 | 0.93 | 29.8 px/s | 119 px/s = 3.7 tiles/s | 1.9 |
| Hay | 0.50 | 4 | 0.99 | 31.5 px/s | 126 px/s = 3.9 tiles/s | 3.9 |
| Dead brush | 0.80 | 3 | 1.00 | 32 px/s | 128 px/s = 4.0 tiles/s | 3.0 |
| Tree (as a field) | 0.25 | 12 | 0.75 | 24 px/s | 96 px/s = 3.0 tiles/s | 9.0 |
| Wood wall | 0.15 | 20 | 0.55 | 17.7 px/s | 71 px/s = 2.2 tiles/s | 11.0 |
| Oil | 1.00 | 6 | 1.00 | 32 px/s | 128 px/s = 4.0 tiles/s | 6.0 |

Two ways to keep the VFX #6 px/s at 32 px (same script):
- Option A. Keep p and burn ticks, but roll spread at 1 Hz per tile. Speeds in px/s match the 8 px column exactly, since speed is per roll. Burn times in seconds become 3, 2, 4, 3, 12, 20 and 6 s.
- Option B. Keep 4 Hz rolls and search for p. Burn ticks were set to the time a 4x4 block of 8 px cells shows flame (`T + 3 / speed`). That gives p' = 0.03 to 0.07 with 5 to 25 ticks. Green grass could not get down to its target (0.168 tiles/tick against 0.129) without the fire dying.

### Inferences
- Option A wins. It keeps one material table for both scales, so the sandbox's 32/16/8 px "spread grid" control only changes the roll rate (1, 2 or 4 Hz). Small p values in option B make ragged, dying fronts, as VFX #6 note 03 measured for p = 0.3, T = 1.
- Keep the 4 Hz server tick for everything else (water, rain, extinguish, events). Give each tile a roll phase `hash(x, y) & 3` so a quarter of the burning tiles roll on each 4 Hz tick. The load stays flat, and a front does not advance in visible once-a-second steps.
- The ceiling is 1 tile per roll on the axes. At 1 Hz no fuel ever beats 1 tile/s, which is 40% of walking speed. That is a hard safety cap for an MMO where new players stand in grass.
- Burning band depth in tiles stays the same as in cells (1.4 tiles for green grass, 3 for brush). At 32 px that is 45 to 96 px of flames behind the front, which reads as a band and not as a line.

---

## Q3. What states does a burning 32 px tile go through, and how long is each?

### Takeaway
Shipped tile games use 4 to 6 visual stages per burning tile. Flames take the first 75% of the life, then a smoke-only tail, then a swap to a burnt tile. Project Zomboid is the clearest. It has six life stages with 2 to 3 flame sprites per tile at random offsets, smoke joins halfway, and every wall and floor sprite swaps to a burnt variant at the end. For Asterion I propose 7 states (fresh, catching, burning, dying, embers, ash, regrowing), drawn through the art burn map, with whole-tile swaps only for the ash and regrowth steps.

### Cited findings
- Project Zomboid 41.78 `IsoFire.java` (https://github.com/Ketum-Git/PZ-Javacode/blob/master/PZ_41.78/zombie/iso/objects/IsoFire.java):
  - A new fire attaches `2 + Rand.Next(2)` flame animations, so 2 or 3 per tile. They sit at random offsets of up to 32 px (`-32 + Rand.Next(32)` in x).
  - `LifeStageDuration = Life / 4`. Stages 0, 1 and 2 each last Life/4. Stages 3, 4 and 5 each last a third of that (Life/12).
  - Stage 0 shows the "Fire 01" flames.
  - Stage 1 adds "Fire 02".
  - Stage 2 adds "Smoke 01" and "Fire 03".
  - Stage 3 clears and shows "Smoke 02" plus "Fire 02".
  - Stage 4 shows "Smoke 03" plus a small "Fire 01".
  - Stage 5 shows "Smoke 01" only.
  - The square is flagged `burning` below stage 4 and `smoke` from stage 4 on.
  - Animations are 4 frames with `FireAnimDelay = SmokeAnimDelay = 0.2` frames per 60 Hz step, which is 12 fps (`IsoFireManager.java`, same repo).
- Project Zomboid `IsoGridSquare.BurnWalls` (https://github.com/Ketum-Git/PZ-Javacode/blob/master/PZ_41.78/zombie/iso/IsoGridSquare.java):
  - Every object on the square swaps to its `burntTile` if it has one.
  - Fences become `fencing_burnt_01_N`.
  - Walls become `walls_burnt_01_N`, picked from 2 random variants per wall orientation (for example `"0"` or `"4"`).
  - Floors become `floors_burnt_01_0` to `_2`.
  - Burning is per tile. A house burns as many tiles, not as one object.
- RimWorld (https://github.com/josh-m/RW-Decompile/blob/master/RimWorld/Fire.cs):
  - Fire size runs from 0.1 to 1.75 and sets how big the flame is drawn.
  - It scorches the floor after 125 s.
  - Burning things become ash filth at 0 HP (https://rimworldwiki.com/wiki/Fire).
- Cataclysm DDA `field_type.json` (https://github.com/CleverRaven/Cataclysm-DDA/blob/master/data/json/field_type.json):
  - `fd_fire` has 3 intensities ("small fire", "fire", "raging fire").
  - Translucency is 0.7, 0.4 and 0.1. Light emitted is 20, 60 and 160.
  - `half_life` is 30 minutes of game time.
  - That makes 3 visual states per tile, chosen by intensity.
- Brogue CE: fire becomes embers at 500/10,000 per turn, then ash at 300/10,000 (VFX #6 report D1, https://github.com/tmewett/BrogueCE/blob/master/src/brogue/Globals.c). Mean lifetimes are 20 turns burning and 33 turns as embers.
- Don't Starve Together:
  - Burn times are 10 s small, 20 s medium, 30 s large and 45 s for a tree (`TREE_BURN_TIME`).
  - Smoulder lasts `MIN_SMOLDER_TIME` 15 s to `MAX_SMOLDER_TIME` 30 s (seg_time = 30 s).
  - FX level 1 to 4 picks the flame size per object class (`SetFXLevel` in standardcomponents.lua).
  - https://github.com/taichunmin/dont-starve-together-game-scripts/blob/master/tuning.lua
- Tibia fire fields have 3 stages of 120 s, and the last is harmless (VFX #6 report §6c).

### Inferences: proposed per-tile states at 32 px (option A timing, 1 Hz rolls)
| # | State | Server? | Duration (green grass / tree) | How it is drawn inside the tile |
|---|---|---|---|---|
| 0 | Fresh | yes | until lit | Normal tileset |
| 1 | Catching (IGNITING) | yes | 1 roll = 1 s | Burn map front enters from the side the fire came from (3-bit direction, SANDBOX-SPEC). One small flame of 8 to 10 px at that edge and one grey wisp. |
| 2 | Burning | yes | 3 s / 12 s | 2 or 3 flames per tile at hashed offsets (PZ uses 2 or 3). The burn map sweeps across the tile over the first 1 s. |
| 3 | Dying | client | last 25% of burn | One flame left, smoke rate doubled. PZ spends its last quarter of life in smoke stages. |
| 4 | Embers | yes | 4 to 10 s | Charred tile with 2 to 4 glowing clusters of at least 2x2 px pulsing. Small re-ignite chance (VFX #6 D1). |
| 5 | Ash | yes | 60 to 120 s | Whole-tile swap to an ash variant (2 variants by hash, as PZ walls do). A thin wisp for the first 3 to 5 s. |
| 6 | Regrowing | yes | Q5 | Whole-tile swaps through 2 or 3 steps |

- A 4-frame loop at 10 fps lasts 400 ms. Under the VFX #6 timing (green grass 3 ticks at 4 Hz = 0.75 s) a tile shows less than 2 loops before it goes out, which reads as a flash at 32 px. Option A gives 3 s, which is 7 loops and enough to read as burning.
- The server stores only states 0, 1, 2, 4, 5 and 6 plus the entry direction. "Dying" is client-side, derived from time since ignition and the hashed burn length. This keeps the event list of VFX #6 §6e unchanged.
- An artist draws 3 full tilesets (normal, charred, ash), one ember overlay sheet and the regrowth tiles. Everything between charred and normal comes from the burn-map mask. (Note 11 owns how to draw them.)

### Gaps
- No pixel game devlog found that states per-stage durations for a burning ground tile at about 32 px. PZ gives ratios in age units only.
- PZ flame sprite pixel sizes were not read (note 10's area).

---

## Q4. How do multi-tile objects burn: a 1.5x2.5-tile tree and a 3x3-tile house?

### Takeaway
There are three patterns. Project Zomboid burns a house per tile and swaps each wall and floor to a burnt sprite. RimWorld and Don't Starve burn a building as one object with HP and one burnt look. RimWorld only lets fire sit on the building's edge cells. For a Tibia-like server, the per-tile pattern fits the map data. Draw the house as one object with stages picked from the fraction of its tiles that have burnt. A tree is one fuel tile (the trunk) with a cosmetic canopy, as in Don't Starve, where a tree is one entity with a 45 s burn and a burnt animation.

### Cited findings
- RimWorld `FireUtility.ChanceToStartFireIn`: if an impassable building's `OccupiedRect().ContractedBy(1)` contains the cell, the chance is 0. Fire cannot start on the inner cells of a multi-cell building, only on its edge ring. https://github.com/josh-m/RW-Decompile/blob/master/RimWorld/FireUtility.cs
- RimWorld: a burning object loses HP at the same rate as everything else, and fire size follows flammability. At 0 HP it becomes ash. https://rimworldwiki.com/wiki/Fire
- Don't Starve Together evergreens:
  - A full-grown tree is `MakeLargeBurnable(inst, TUNING.TREE_BURN_TIME)` (45 s) with `MakeMediumPropagator`, which has a range of 5 to 7 units (1.25 to 1.75 tiles).
  - Small stages use the small presets.
  - `OnBurnt` removes the burnable, propagator and growable components and plays the `burnt_<stage>` animation.
  - It tags the tree "burnt". Chopping it drops charcoal.
  - There are separate stump and burnt animations per growth stage.
  - https://github.com/taichunmin/dont-starve-together-game-scripts/blob/master/prefabs/evergreens.lua
- Don't Starve Together structures use `MakeSmall/Medium/LargeBurnable(..., structure)`. Hammering a burnt structure returns `BURNT_HAMMER_LOOT_PERCENT = .25` of the materials. https://github.com/taichunmin/dont-starve-together-game-scripts/blob/master/tuning.lua
- Project Zomboid: walls, floors and fences swap to `walls_burnt_01_*`, `floors_burnt_01_*` and `fencing_burnt_01_*` per square. https://github.com/Ketum-Git/PZ-Javacode/blob/master/PZ_41.78/zombie/iso/IsoGridSquare.java
- Dwarf Fortress: fire spreads into multi-tile trees, and burning can make trees collapse. https://dwarffortresswiki.org/index.php/DF2014:Fire
- Cataclysm DDA: a wood wall is one terrain tile, `t_wall_wood`, whose bash result is `t_wall_wood_chipped`. Damage steps through per-tile terrain variants. https://github.com/CleverRaven/Cataclysm-DDA/blob/master/data/json/furniture_and_terrain/terrain-walls.json

### Inferences
- Tree (1.5 x 2.5 tiles). The server cell is the trunk tile with tree fuel. The canopy is art only. Canopy flames spread as the tile burns: 1 flame at the base during catching, then 3 to 5 flames climbing the crown over the first third of the burn.
  - Burn time 12 s under option A is short next to Don't Starve's 45 s. I would raise the tree to 20 to 30 rolls.
  - Burnt tree stages are burning, then a charred tree with bare branches (Don't Starve keeps one), then a stump after a second hit or decay.
  - For crown fires in a dense wood, let a burning tree also roll against trees 2 tiles away at 0.3 times p, like RimWorld's 20% two-tile sparks.
- House (3x3 tiles). Store fuel per wall and roof tile, as Tibia map data already does. Like RimWorld, only the 8 edge tiles take ignitions from outside. The centre lights from its own neighbours.
  - Draw the house as one object whose stage comes from the fraction of its tiles that have burnt:
    - 0%: intact.
    - Any tile catching: smoke from under the eaves.
    - 25% or more: flames through the roof, 16 to 32 px flames, slower loop.
    - 60% or more: roof collapse. The roof sprite swaps to charred rafters, with a one-off burst of embers and smoke.
    - 100%: charred wall stumps and floor.
    - After the ash time: rubble or ash.
  - That is 5 drawn house stages, and every client agrees because the fraction comes from server state.
- Collapse is a one-shot event (a 300 to 500 ms burst plus a sound). Derive it client-side from the 60% threshold. It needs no network message.
- Wood wall burn time. Under option A, 20 s per tile and a front that crosses 3 tiles in about 5 s give a whole-house fire of about 30 s. That matches Don't Starve's large burnable at 30 s. 40 rolls would make a house fire last about a minute, which is a better MMO event length (opinion).

### Gaps
- No devlog found for Kingdom, Sigil of Kings houses, Cataclysm DDA tilesets or Brogue tiles that shows house collapse stages. No Godot or Unity burnable-tilemap tutorial with stage counts was checked this session.

---

## Q5. How long until ash becomes grass, and in which steps?

### Takeaway
Games regrow slowly and from the edges. Minecraft grass only spreads from adjacent grass on random ticks, about one tick per block every 68 s on average. Don't Starve regrows picked grass in 3 days (24 min) and burnt forest in 50 days. For an MMO, 5 to 10 minutes from ash to full grass keeps burnt land visible long enough to mean something, then clears it.

### Cited findings
- Minecraft:
  - A random tick on grass checks 4 blocks in a 3x5x3 range and turns any valid dirt into grass (https://minecraft.wiki/w/Grass_Block).
  - Java picks 3 blocks per 16x16x16 subchunk per game tick, so each block gets one random tick about every 68 s, median 47 s (VFX #6 note 03, https://minecraft.wiki/w/Tick).
- Don't Starve Together:
  - `GRASS_REGROW_TIME = total_day_time * 3`, and a day is 480 s, so 1,440 s = 24 min. This is the regrow after picking. Burnt tufts may differ.
  - `EVERGREEN_REGROWTH.DESOLATION_RESPAWN_TIME = total_day_time * 50`, which is 400 min for trees to come back in a desolated area.
  - `DEAD_DECAY_TIME = total_day_time * 30`.
  - https://github.com/taichunmin/dont-starve-together-game-scripts/blob/master/tuning.lua
- Drossel-Schwabl regrowth with chance p per empty cell (VFX #6 note 03, https://en.wikipedia.org/wiki/Forest-fire_model).

### Inferences
- Proposed steps (server states, whole-tile swaps):
  - Ash for 60 to 120 s.
  - Bare scorched dirt for 2 to 4 min.
  - Sprouts, 1 to 2 min, entered only when a 4-neighbour is green or sprouting, as Minecraft does.
  - Short grass for 1 to 2 min.
  - Full grass.
- Total is about 5 to 10 min. Trees stay as stumps for 30 to 60 min, then return as saplings.
- Neighbour-driven regrowth gives green coming in from the burn's edge, which reads as healing. A global timer would flip a whole burn scar at once.
- Cost: run regrowth on a slow list (one check per tile every 10 to 30 s). It touches only burnt tiles.
- Network: 4 regrowth swaps per tile over 5 to 10 min is far smaller than the burn itself.

### Gaps
- No pixel game found with published ash-to-grass timings.

---

## Q6. Smoke at 32 px: column height, puff sizes, rates, field cell size

### Takeaway
Scale the Stardew puff by the tile ratio. A chimney puff then starts at about 10 px, ends at about 47 px, and rises about 3 tiles in 6 s at 15 px/s. Run hero puffs only for chimneys, campfires and houses. Draw wildfire smoke from the field. RimWorld does the same kind of trade. It throws one smoke mote per burning cell every 2.2 to 3.3 s and stops all smoke motes once 15 fires burn. For sight-blocking, Cataclysm DDA's 3 smoke intensities (thin, smoke, thick) with thick fully opaque are a clean tile rule.

### Cited findings
- Stardew puff (VFX #6 note 10, decompile https://github.com/E-riCA0/StawdewValley/blob/HEAD/Utility.cs):
  - The sprite is 10x10 at scale 2 rising to 9.5, with pixelZoom 4.
  - It moves 0.5 screen px per frame upward, with sideways acceleration 0.002.
  - Alpha falls from 0.75 by 0.002 per update.
  - So it lives about 375 frames (6.25 s) and rises about 47 art px, about 3 tiles at 16 px.
- RimWorld `Fire.cs` (https://github.com/josh-m/RW-Decompile/blob/master/RimWorld/Fire.cs):
  - Smoke interval is `SmokeIntervalRange (130, 200)` lerped by `1 - min(fireSize/2, 1)`, plus 0 to 10 ticks. That is 196 ticks (3.3 s) for a size 0.1 fire and 139 ticks (2.3 s) at size 1.75.
  - `ThrowSmoke` only runs when the map has fewer than 15 fires (`FireCountParticlesOff = 15`).
  - Micro sparks need size above 0.7 and fire with chance `fireSize * 0.01` per tick.
- Project Zomboid: smoke sprites join from life stage 2 and are alone in stage 5. The square flag switches from `burning` to `smoke` at stage 4. https://github.com/Ketum-Git/PZ-Javacode/blob/master/PZ_41.78/zombie/iso/objects/IsoFire.java
- Cataclysm DDA `fd_smoke` (https://github.com/CleverRaven/Cataclysm-DDA/blob/master/data/json/field_type.json):
  - 3 levels, "thin smoke", "smoke" and "thick smoke".
  - Translucency is 1, 10 and 0, with level 2 marked `transparent: false`.
  - `half_life` 2 minutes, `percent_spread` 10, `accelerated_decay` true.
- DCSS: line of sight stops after 2 opaque cloud tiles (VFX #6 note 03, http://crawl.chaosforge.org/Cloud).
- Dwarf Fortress shows burning dwarves trailing smoke (https://dwarffortresswiki.org/index.php/DF2014:Fire). Noita burning makes Smoke that can suffocate, and burning water makes Steam (https://noita.wiki.gg/wiki/Fire).

### Inferences
Stardew converted. In art px at 16 px tiles, the puff starts at 10 x 2/4 = 5 px and ends at 10 x 9.5/4 = 24 px. It rises 7.5 px/s (0.47 tiles/s) for 6.25 s.

| Source at 32 px | Puff start, end (px) | Rise | Column | Puffs per s | Colour | Basis |
|---|---|---|---|---|---|---|
| Campfire | 4 to 6, 16 to 20 | 12 px/s | 1 to 1.5 tiles | 2 | light grey | VFX #6 B2 rate `1.5 / sqrt(D)` |
| Chimney | 8 to 10, 32 to 47 | 15 px/s | 2 to 3 tiles | 1.7 (every 600 ms) | light grey | Stardew x2 by tile ratio |
| Burning grass tile | none | n/a | field only | n/a | grey | RimWorld rate per cell is 0.3 to 0.45 Hz; at 100+ tiles use the field |
| Burning tree | 10 to 12, 32 to 40 | 15 to 20 px/s | 3 to 4 tiles | 1 | brown-grey | VFX #6 §6b |
| Burning house | 12 to 16, 48 to 64 | 20 px/s | 4 to 6 tiles | 2 to 4 | dark grey to black | larger D gives slower but bigger puffs |
| Steam burst (water on fire) | 6 to 8, 20 to 24 | 30 px/s | 1 tile | 8 to 12 puffs in 0.3 s, once | white | short life 0.5 to 1 s |

- Columns at 32 px. The screen is only 11.25 tiles tall. A 3-tile chimney column is 27% of the screen height and a 6-tile house column is 53%. House smoke above 6 tiles should leave the top of the screen, which tells players "big fire" without hiding the play area.
- Wind drift. Keep Stardew's single sideways acceleration but scale it by wind strength. At 32 px, 0.004 px/frame² gives about 70 px (2.2 tiles) of lean over 6 s.
- Puff count per screen. 240 burning tiles x 0.4 Hz x 6 s life is about 580 puffs. Adopt the RimWorld rule as an LOD. Spawn hero puffs only from objects (chimney, campfire, tree, house), cap them at about 64 alive per screen, and let the field carry wildfire smoke.
- Field cell size, priced from VFX #6's measured smoke CA (0.077 ms JS and 3.9 ms GDScript for 57,600 cells, so about 1.3 ns and 68 ns per cell), scaled linearly:
  - 4 px (160 x 90 = 14,400 cells) costs about 0.019 ms JS or 0.98 ms GDScript.
  - 8 px (80 x 45 = 3,600 cells) costs about 0.005 ms JS or 0.24 ms GDScript.
  - 16 px (40 x 23 = 920 cells) costs about 0.06 ms GDScript.
  - Pick 8 px. That is the VFX #6 cell count and 4x4 field cells per tile, so a tile's emission can enter at its top-centre 2x2 cells. (Note 12 owns how it is drawn at art resolution.)
- Emission. One 32 px tile covers 16 field cells of 8 px. To keep VFX #6's smoke mass per area, a burning tile emits 16 times the 8 px cell's amount, but only into its top 2x2 field cells, so smoke starts as a plume and not a flat sheet.
- Sight. Map field density to Cataclysm DDA's 3 levels. Level 3 (thick) blocks sight. Count thick tiles along the line and stop at 2 (DCSS). Only the server computes this, from a server-side copy of the field at tile resolution (20 x 12 per screen).
- Clusters against Bayer. At 8 px field cells, a 4x4 Bayer on art pixels puts single pixels at low density, which VFX #11 found reads as noise at 32 px. Use the snow study's cluster threshold (2x2 px minimum) for the field. Puff sprites stay hand-drawn with 3 or 4 greys.

### Gaps
- No shipped 32 px top-down game devlog gives smoke particle counts per fire. Only Stardew and RimWorld code give per-puff numbers.
- Real seconds for PZ smoke stages are unknown.

---

## Q7. The MMO view: how many tiles burn, and how the material table converts

### Takeaway
At 32 px tiles the server stores 240 tiles per screen instead of 3,600 cells, 15 times fewer. The same visible front needs 16 times fewer ignition events. A front crossing the whole screen sets about 17 tiles burning in green grass and about 36 in brush. A forest can reach about 108, and the worst case is all 240. TFS already stores tiles in 8x8 floor nodes, a natural fire chunk with at most 64 burning tiles.

### Cited findings
- TFS `map.h`:
  - `FLOOR_BITS = 3`, `FLOOR_SIZE = 8`. Tiles live in 8x8 floor nodes, `MAP_MAX_LAYERS = 16`.
  - `maxClientViewportX = 8`, `maxClientViewportY = 6`, which is a 17 x 13 tile client view including the hidden border.
  - https://github.com/otland/forgottenserver/blob/master/src/map.h
- Active-list cost from VFX #6 note 03 (measured on M4 Pro). 0.056 ms JS and 0.30 ms GDScript per tick with about 1,500 burning cells on 320x180. That is about 37 ns JS and 200 ns GDScript per burning cell.
- Far Cry 2 budget: 60 points per Molotov, 8 per cell, so about 7 cells (VFX #6 note 02, https://jflevesque.com/2012/12/06/far-cry-how-the-fire-burns-and-spreads/).

### Measured here, then converted (inference)
- Burning band depth (Q2 table) times a 12-tile-tall screen:
  - Green grass 1.4 x 12 = 17 tiles.
  - Dry grass 1.9 x 12 = 23 tiles.
  - Brush 3 x 12 = 36 tiles.
  - Tree stand 9 x 12 = 108 tiles.
- Per 8x8 TFS node, the same front sets 11 (grass) to 24 (brush) tiles burning. The cap is 64.
- Server CPU at option A with 108 burning tiles per screen is about 22 µs per roll in GDScript. One hundred busy screens cost about 2.2 ms per second of server time.
- Events. A screen-high front in green grass under option A lights 0.52 tiles/s x 12 rows = 6.2 tiles/s, which at 4 bytes is about 25 B/s. VFX #6 at 8 px gets the same visual front from 2.07 cells/s x 45 rows = 93 ignitions/s, about 370 B/s. The 32 px grid cuts it 15 times.

### Conversion table proposal [inference]
| Quantity | VFX #6 (8 px cell, 4 Hz) | 32 px tile, VFX #6 numbers kept (do not ship) | Proposal for 32 px tiles |
|---|---|---|---|
| Server tick | 4 Hz | 4 Hz | 4 Hz for events, water, rain. Spread rolls 1 Hz per tile with phase `hash(x,y) & 3`. |
| Ignite chance p | grass 0.15, dry 0.40, hay 0.50, brush 0.80, tree 0.25, wall 0.15, oil 1.0 | same | same p, rolled at 1 Hz |
| Burn length | 3, 2, 4, 3, 12, 20, 6 ticks (0.5 to 5 s) | same ticks | same count in rolls (2 to 20 s). Raise tree to 20 to 30 and wood wall to 30 to 40 (Q4). |
| Diagonal factor, moisture, wind | 0.7, `(1 - m)`, Alexandridis | same | same (dimensionless) |
| Front speed | 16.5 to 32 px/s | 66 to 128 px/s (2.1 to 4.0 tiles/s), beats walking | 16.5 to 32 px/s (0.52 to 1.0 tiles/s), max 40% of walk |
| Embers | 2 to 8 ticks | same | 4 to 10 s (4 to 10 rolls) |
| Ash, then regrow | "minutes" | same | Ash 60 to 120 s, full regrowth 5 to 10 min (Q5) |
| Budget per source | 60 points, 8 per cell (7 cells, less than half a 32 px tile) | 7 tiles | 7 to 9 tiles per Molotov or firebomb (matches Tibia's 3x3 bomb), 8 points per tile |
| Two-tile jump | none | none | trees only, 0.3 x p at distance 2 (RimWorld 20% sparks) |
| Smoke emission | per 8 px cell into 4 px cells | n/a | per tile = 16 x cell amount, into the top 2x2 of 8 px field cells |
| State stored | 1 B state + 1 B fuel per cell, 3,600 per screen | 240 per screen | 240 per screen, plus 3 bits entry direction |
| Ignition events, screen-high grass front | 93 per s | 25 per s (4x speed) | 6 per s |

### Gaps
- No browser or Godot web measurement of the 1 Hz phased roll. The 22 µs figure is scaled from the VFX #6 headless benchmark.
- How many players share one screen of fire in Tibia-like games is not documented. The bytes above are per screen, not per player.

---

## Sources
- https://github.com/josh-m/RW-Decompile/blob/master/RimWorld/Fire.cs
- https://github.com/josh-m/RW-Decompile/blob/master/RimWorld/FireUtility.cs
- https://rimworldwiki.com/wiki/Fire (via api.php)
- https://rimworldwiki.com/wiki/Time (60 ticks per second, not fetched this session)
- https://github.com/taichunmin/dont-starve-together-game-scripts/blob/master/standardcomponents.lua
- https://github.com/taichunmin/dont-starve-together-game-scripts/blob/master/components/propagator.lua
- https://github.com/taichunmin/dont-starve-together-game-scripts/blob/master/tuning.lua
- https://github.com/taichunmin/dont-starve-together-game-scripts/blob/master/prefabs/evergreens.lua
- https://github.com/Ketum-Git/PZ-Javacode/blob/master/PZ_41.78/zombie/iso/objects/IsoFire.java
- https://github.com/Ketum-Git/PZ-Javacode/blob/master/PZ_41.78/zombie/iso/objects/IsoFireManager.java
- https://github.com/Ketum-Git/PZ-Javacode/blob/master/PZ_41.78/zombie/iso/IsoGridSquare.java
- https://github.com/CleverRaven/Cataclysm-DDA/blob/master/data/json/field_type.json
- https://github.com/CleverRaven/Cataclysm-DDA/blob/master/data/json/furniture_and_terrain/terrain-walls.json
- https://github.com/otland/forgottenserver/blob/master/src/map.h
- https://minecraft.wiki/w/Fire (via api.php)
- https://minecraft.wiki/w/Grass_Block (via api.php)
- https://minecraft.wiki/w/Tick
- https://dwarffortresswiki.org/index.php/DF2014:Fire (via api.php)
- https://noita.wiki.gg/wiki/Fire (via api.php)
- https://dontstarve.wiki.gg/wiki/Fire (via api.php)
- https://research.csiro.au/spark/news (search snippet only)
- https://www.gamedeveloper.com/game-platforms/interview-how-i-far-cry-2-i-s-fire-fuels-spreads (via VFX #6 note 02)
- https://jflevesque.com/2012/12/06/far-cry-how-the-fire-burns-and-spreads/ (via VFX #6 note 02)
- https://byte-arcane.itch.io/sigil-of-kings/devlog/712302/wildfires (via VFX #6 report D1)
- https://raw.githubusercontent.com/tmewett/BrogueCE/master/src/brogue/Time.c (via VFX #6 note 03)
- https://github.com/E-riCA0/StawdewValley/blob/HEAD/Utility.cs (via VFX #6 note 10)
- http://crawl.chaosforge.org/Cloud (via VFX #6 note 03)
- https://en.wikipedia.org/wiki/Forest-fire_model (via VFX #6 note 03)
- Blocked this session: pzwiki.net (Cloudflare challenge). I used the PZ decompile on GitHub instead.
- Scratch: `studies/vfx-fire-32px/notes/scratch-15/front.js` (front speed benchmark) and the downloaded source files listed at the top.
