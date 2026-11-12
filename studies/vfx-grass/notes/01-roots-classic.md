# 01 Roots and classic era of grass in 2D games

Researcher 01. Angle: history and the classic era, read from decompiled and open-source code wherever possible. Every number below comes from the cited file unless it is marked as an inference.

Frame times assume 60 ticks per second (GBA ~59.73 Hz, GBC ~59.7 Hz, SNES ~60.1 Hz). Converting ticks to seconds is my arithmetic.

---

## Q1. Pokémon tall grass and long grass (pokeemerald, pokecrystal)

### Takeaway
Pokémon grass is two cheap layers. The map tile does the covering, by putting the grass in front of the walker's lower body through hardware priority. A tiny one-shot 16x16 sprite plays a rustle when someone steps in, then parks on a "resting" frame until they leave. No per-blade simulation, no shader. The whole effect is a tile flag, a priority bit, and a 5-frame sprite.

### Cited findings

Emerald tall grass rustle (`src/data/field_effects/field_effect_objects.h`, `sAnim_TallGrass`)
- 5 images, each 16x16 (`overworld_frame(gFieldEffectObjectPic_TallGrass, 2, 2, n)`).
- Animation: frames 1, 2, 3, 4 at 10 ticks each, then frame 0 for 10 ticks, then END. That is 40 ticks of motion (~0.67 s), 50 ticks in all.
- Frame 0 is the resting state, the grass closed around the feet.
- https://github.com/pret/pokeemerald/blob/master/src/data/field_effects/field_effect_objects.h

Emerald tall grass lifecycle (`src/field_effect_helpers.c`, `FldEff_TallGrass`, `UpdateTallGrassFieldEffect`)
- The sprite spawns at the tile centre (offset 8,8) with OAM priority 2.
- If an object spawns already standing in grass (map load), `SeekSpriteAnim(sprite, 4)` skips straight to the resting frame. Only real steps play the rustle (`GroundEffect_SpawnOnTallGrass` vs `GroundEffect_StepOnTallGrass` in `src/event_object_movement.c`, arg 7 TRUE/FALSE).
- The sprite dies only when the walker has left the tile AND the animation has ended, or the tile is no longer tall grass. Leaving mid-rustle lets the rustle finish.
- `UpdateGrassFieldEffectSubpriority` loops over all object events and pushes the grass sprite's subpriority behind any other object whose sprite overlaps it, so a neighbour standing just north is not cut off by the grass.
- `FindTallGrassFieldEffectSpriteId` scans all 64 sprite slots to find an existing grass sprite on a tile (used when jumping into grass).
- https://github.com/pret/pokeemerald/blob/master/src/field_effect_helpers.c
- https://github.com/pret/pokeemerald/blob/master/src/event_object_movement.c

Emerald long grass "sinking" (`SetObjectEventSpriteOamTableForLongGrass`, `src/event_object_movement.c`, and `sOamTable_16x32_4` in `src/data/object_events/object_event_subsprites.h`)
- Applies only if both the current and previous tile are long grass, so the sink starts on the second step in.
- The 16x32 walker is redrawn as two 16x16 subsprites. The top half keeps priority 1, the bottom half gets priority 3, which puts it behind the BG layer. The long-grass metatile then hides the whole lower 16 px.
- Long grass rustle `sAnim_LongGrass`: frames 1(3), 2(3), 0(4), 3(4), 0(4), 3(4), 0(4) ticks. That is 26 ticks (~0.43 s). It is faster and wobbles twice between frame 0 and 3, unlike the slower single sweep of tall grass.
- https://github.com/pret/pokeemerald/blob/master/src/data/object_events/object_event_subsprites.h

Emerald ash grass (Route 113) (`AshGrassPerStepCallback` in `src/field_tasks.c`, `StartAshFieldEffect`/`UpdateAshFieldEffect_*` in `src/field_effect_helpers.c`)
- On every step onto a new tile with `MB_ASHGRASS`, the game queues an ash puff with a 4-tick delay.
- When the delay ends, it swaps the metatile to normal grass (`METATILE_Fallarbor_NormalGrass` or `METATILE_Lavaridge_NormalGrass`) and redraws that one tile.
- The puff sprite (`sAnim_Ash`) has 5 frames at 12, 12, 8, 12, 12 ticks (56 ticks, ~0.93 s).
- With the Soot Sack in the bag, `VAR_ASH_GATHER_COUNT` increments, capped at 9999.
- The ash never comes back. It is a permanent, per-tile state change driven by walking. This is the closest classic example of a "desire path" where walking changes the ground for good.
- https://github.com/pret/pokeemerald/blob/master/src/field_tasks.c

Emerald encounter rate per step (`src/wild_encounter.c`)
- `WildEncounterCheck`: `encounterRate *= 16`, then the check is `Random() % 2880 < encounterRate` (`MAX_ENCOUNTER_RATE 2880`).
- Bikes multiply by 80/100. Stench and White Smoke halve it. Illuminate and Arena Trap double it. Cleanse Tag and flutes also apply.
- `AllowWildCheckOnNewMetatile`: the first step onto a different tile type skips the check 40% of the time (comment in source).
- Map rates in `src/data/wild_encounters.json`: Route 101 land rate is 20, so 320/2880 = 11.1% per step. Counting land tables: rate 10 on 48 maps (5.6%/step), 20 on 18, 4 on 13, 7 on 9, 25 on 6, 15 on 1 (my count of the JSON).
- Slot odds for the 12 land slots: 20, 20, 10, 10, 10, 10, 5, 5, 4, 4, 1, 1 percent.
- https://github.com/pret/pokeemerald/blob/master/src/wild_encounter.c
- https://github.com/pret/pokeemerald/blob/master/src/data/wild_encounters.json

Crystal (GBC) (`engine/overworld/map_objects.asm`, `engine/overworld/wildmons.asm`)
- `SetTallGrassFlags` sets `IN_GRASS_F` on the object when its tile is grass or super-tall grass.
- When building OAM, `IN_GRASS_F` ORs in `OAM_PRIO`. That is the GBC "BG over OBJ" bit, so non-zero BG grass pixels draw over the sprite. The tile art decides what gets covered. There is no extra overlay sprite for this.
- `TryWildEncounter`: `Random` (one byte, 0-255) compared against the map rate, which has three values for morning, day and night. Pokémon March doubles it, Pokémon Lullaby and Cleanse Tag halve it.
- Example: Sprout Tower 2F has "2 percent" for all three times (`data/wild/johto_grass.asm`).
- `GrassMonProbTable` (`data/wild/probabilities.asm`) has 7 slots at 30, 30, 20, 10, 5, 4, 1 percent.
- `MovementFunction_ShakingGrass` / `ShakeGrass` spawns a temporary grass object with `SPRITEMOVEDATA_GRASS` and `PAL_OW_TREE`.
- https://github.com/pret/pokecrystal/blob/master/engine/overworld/map_objects.asm
- https://github.com/pret/pokecrystal/blob/master/engine/overworld/wildmons.asm
- https://github.com/pret/pokecrystal/blob/master/data/wild/probabilities.asm

Crystal Cut on grass (`data/collision/field_move_blocks.asm`, `engine/events/field_moves.asm`)
- Cut is a block swap. Johto block $03 becomes $02 and Kanto $0B becomes $0A, with animation type 1 ("Mow the lawn").
- The National Park tileset has two stages: $13 becomes $03, and $03 becomes $04. Tall grass is cut to short grass, and short grass to shorter.
- `Cut_SpawnAnimateLeaves` spawns 4 leaf sprites with angle offsets 0, $10, $20, $30, then waits 32 frames (~0.53 s). The sound is `SFX_PLACE_PUZZLE_PIECE_DOWN`.
- https://github.com/pret/pokecrystal/blob/master/data/collision/field_move_blocks.asm
- https://github.com/pret/pokecrystal/blob/master/engine/events/field_moves.asm

See it in action: https://bulbapedia.bulbagarden.net/wiki/Tall_grass (may block, reference only).

### Inferences
- In a Godot remake, "lower body hidden" is cheapest done like Emerald long grass. Split the character into top and bottom halves, or use a clip rect, and draw the grass tile's foreground strip on a layer above the bottom half. You do not need a shader.
- The 10-tick rustle frames are slow. They read as "grass parting" rather than "shaking". The 3 to 4 tick long-grass frames read as a quick flutter. Two speeds, two materials.
- The resting frame that stays until the walker leaves works as a cheap state indicator. In an MMO, other players see who is standing in grass with no extra network data beyond position.

### Gaps
- I did not read pokefirered. It shares Emerald's field-effect code shape, but I did not check its frame timings.
- Bulbapedia was not fetched, so I have no video or GIF reference URL that I verified.

---

## Q2. Zelda: ALttP (zelda3) and Link's Awakening (LADX disassembly)

### Takeaway
Zelda grass is a tile swap plus a debris sprite plus a small, throttled chance of a drop. ALttP throttles drops twice. There is a coin flip, it only fires when fewer than 4 sprites are on screen, and it walks a fixed 8-entry rotation instead of rolling pure random. Players feel this as "every few bushes something pops out" rather than streaks.

### Cited findings

ALttP cut and lift (`src/overworld.c`, `Overworld_ToolAndTileInteraction`)
- Thick grass attribute 0x37E swaps to map16 tile 0xDC5.
- Bush 0x36 swaps to 0xDC7 and bush 0x72A to 0xDC8.
- Each swap writes `overworld_tileattr`, memorises the change for the area (`Overworld_Memorize_Map16_Change`), and redraws one map16 tile.
- It then spawns a debris sprite (`Sprite_SpawnImmediatelySmashedTerrain`, sprite type 0xEC transmuted to debris) and `AncillaAdd_BushPoof`.
- `Ancilla3F_BushPoof` (`src/ancilla.c`) draws a 4-piece 16x16 puff over 4 steps, using tables of 16 x/y/char/flip entries. The last step spreads the pieces outward by 2 px (-2/10 offsets).
- https://github.com/snesrev/zelda3/blob/master/src/overworld.c
- https://github.com/snesrev/zelda3/blob/master/src/ancilla.c

ALttP drop odds (`src/sprite.c`)
- Positions listed in the area's secrets table always give their item.
- For an ordinary bush or grass (types 2 and 3) outdoors, `Overworld_SubstituteAlternateSecret` runs:
  - `GetRandomNumber() & 1` returns early half the time.
  - It skips if 4 or more sprites are active, or if game progress is below 2.
  - It picks entry `(overworld_secret_subst_ctr++ & 7)`, plus 8 in the Dark World, from a 16-entry table. Most entries are 1 (green rupee, sprite 0xD9). A few rarer ones are masked per area.
- `Sprite_SpawnSecret` then applies a second outdoor gate, `GetRandomNumber() & 8`, which is another 50%.
- So an ordinary outdoor bush yields something at most about 25% of the time (my arithmetic, 0.5 x 0.5), and less with a crowded screen.
- https://github.com/snesrev/zelda3/blob/master/src/sprite.c

ALttP Link standing in thick grass (`src/player.c` ~L5352, `src/player_oam.c` `LinkOam_DrawFootObject`)
- Thick grass sets `draw_water_ripples_or_grass = 2` and plays sound effect 26 (`Ancilla_Sfx2_Near(26)`) when Link is allowed slosh sounds.
- The foot overlay frame comes from `link_animation_steps`, so the grass overlay steps in sync with the walk cycle.
- Shallow water instead cycles 3 ripple frames on a timer that advances every 9 frames.
- The overlay replaces Link's shadow OAM pair, so it costs 2 OAM entries and no extra sprites.
- https://github.com/snesrev/zelda3/blob/master/src/player.c
- https://github.com/snesrev/zelda3/blob/master/src/player_oam.c

Link's Awakening (zladx/LADX-Disassembly)
- `OBJECT_TALL_GRASS EQU $0A` and `OBJECT_SHORT_GRASS EQU $04` (`src/constants/gfx.asm`). Physics type `OBJ_PHYSICS_GRASS $06`, commented "cuttable".
- `src/code/bank14.asm` (~14:5677) swaps the cut tile to `OBJECT_SHORT_GRASS`. Some GBC rooms swap to `OBJECT_DIRT` instead.
- The cut sound is `NOISE_SFX_CUT_GRASS EQU $05` (`src/constants/sfx.asm`).
- Bombed grass or bushes spawn a bush entity "for the visual effect" (`src/code/entities/03_bomb.asm`).
- WRAM comment: ground status 3 means "on tall grass (draws pushed-away grasses)" (`src/constants/memory/wram.asm`, `ENTITY_GROUND_STATUS_TALL_GRASS EQU 3`).
- `src/code/bank20.asm` has a fix so that leaving the inventory does not break the overlay grass tiles.
- https://github.com/zladx/LADX-Disassembly

Later Zeldas (zeldawiki Grass page via API)
- Minish Cap grass drops include Kinstone Pieces.
- In BotW, cutting grass can spawn crickets, lizards and frogs, and rarely fairies. That is the "flush critters" idea.
- https://zeldawiki.wiki/wiki/Grass

### Inferences
- The ALttP rotating counter plus coin flip is a good design for an MMO server. Drops feel random but never streak, and the "fewer than 4 sprites" rule caps loot spam when players mow a field.
- Pushed-away grass under Link's feet, tied to the walk frame, costs almost nothing and reads better than a free-running loop.

### Gaps
- I could not locate the LADX random drop roll for cut grass in time. I did not search `bank3`/entity code fully.
- I did not decode ALttP's rarer substitution entries (2, 15, 16, 17, 18) to item names.

---

## Q3. Tibia / OT (Canary, TFS)

### Takeaway
Tibia handles grass as items on the tile with server timers. Cutting transforms the item to a "cut" id and calls `decay()`. The item reverts by itself after `duration` seconds through `decayTo`. Ground grass itself is static. Only a few vegetation items carry state, so the server stores state only for the tiles someone touched.

### Cited findings
- Canary `data/items/items.xml`:
  - Jungle grass 3695 has `duration 300` and `decayTo 3696`. The same pair exists as 3701 to 3702.
  - Blueberry bush 3700 decays to 3699 after 300 s.
  - Wheat 3651 becomes 3652 after 240 s, then 3653 (mature) after another 240 s, about 8 min in total.
  - Flower pots use 72000 s and 259200 s stages.
  - https://github.com/opentibiabr/canary/blob/main/data/items/items.xml
- Canary `data-otservbr-global/scripts/lib/register_actions.lua`:
  - `onUseMachete`: jungle grass {3696, 3702, 17153} transforms to id-1 (17153 becomes 17151), then `target:decay()`. So the cut state lasts 300 s and then grows back.
  - Wild growth {2130, 3635, 30224} is removed with `CONST_ME_POFF`.
  - Reed 30623 becomes 30624 and drops item 30975.
  - `onUseScythe` on wheat 3653 turns it into 3651 and creates item 3605 (bunch of wheat). The decay timers regrow it.
  - https://github.com/opentibiabr/canary/blob/main/data-otservbr-global/scripts/lib/register_actions.lua

### Inferences
- Bandwidth: one transform costs one tile-update packet to players in view, and the revert costs another. 300 s regrowth means even a field mowed by many players stays cheap. Trampling every step would not be. Tibia avoids trample state entirely.
- For Asterion: copy `transform + decayTo + duration` for cut and regrow. Keep walk-through rustle client-only.

### Gaps
- I did not inspect OTClient for animated ground items or idle grass animation.
- I did not check TFS (otland/forgottenserver) items.xml separately. Canary derives from it.

---

## Q4. Stardew Valley grass

### Takeaway
Stardew grass is a per-tile "tuft count" from 0 to 4 with a daily cellular-automaton spread. The numbers are small and readable, which makes it a good model for an offline or daily regrowth tick.

### Cited findings (wiki, citing decompiled methods)
- Each full tile has 4 tufts. `Grass::dayUpdate` grows normal grass 1 to 3 tufts per day.
- There is also a 65% daily growth check. A partial tile that passes gains 0 to 2 tufts. A full tile that passes checks its 4 neighbours, and each tillable neighbour has a 25% chance to gain 1 to 2 tufts (`GameLocation::growWeedGrass`).
- On spring 1 of year 2 and later, the game runs 40 growth iterations at once (`GameLocation::HandleGrassGrowth`).
- Grass spreads only onto tillable soil. Paths, fences and furniture block it.
- Hay per cut with a silo: 50% with the basic scythe, 75% golden, 100% iridium. Winter cuts it by 67%. Blue grass gives 2 hay. Swords give none (`Grass::TryDropItemsOnCut`).
- Walking in grass has a -1 speed penalty (-0.33 with the Ol' Slitherlegs book).
- In 1.6, outdoor grass goes dormant in winter instead of vanishing.
- https://stardewvalleywiki.com/mediawiki/api.php?action=parse&page=Grass&prop=wikitext&format=json
- See it in action: https://stardewvalleywiki.com/Grass

### Gaps
- I did not read `Grass.cs` for the rustle shake on walk-through (shake amplitude, duration, sound).
- I did not verify a fiber drop from grass. The wiki page lists only hay.

---

## Q5. Shattered Pixel Dungeon high grass

### Takeaway
High grass is a terrain id that blocks FOV until trampled, then becomes plain grass. Loot rolls happen at trample time. The Forest study covered this briefly. These are the exact odds.

### Cited findings (`levels/features/HighGrass.java`, `trample`)
- Trampling sets the cell to `Terrain.GRASS`. The Huntress leaves `FURROWED_GRASS` instead, which survives her own step.
- Seed chance is `1/(25 - 4*naturalism)`, so 1/25 base and up to 1/9 with the Sandals of Nature. Vault levels divide it by 3.
- Dew chance is `1/(6 - naturalism/2)`, so 1/6 base. Grass-feeling floors halve it.
- Visuals: `CellEmitter.get(pos).burst(LeafParticle.LEVEL_SPECIFIC, 4)`, which is 4 leaf particles, then `Dungeon.observe()` to recompute FOV.
- https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/levels/features/HighGrass.java

---

## Q6. Others (Terraria, UO, OSRS, Graal, Secret of Mana, Chrono Trigger, Harvest Moon)

### Gaps
- Terraria: the wiki.gg API returned a non-JSON response. I have no cited facts on whether walking or swinging cuts tall grass.
- I did not research Ultima Online, OSRS, Graal, Secret of Mana, Chrono Trigger or Harvest Moon within the tool budget.

---

## Numbers players notice (summary)

| Item | Value | Source |
|---|---|---|
| Emerald tall grass rustle | 4 moving frames x 10 ticks, then rest frame (~0.67 s) | pokeemerald field_effect_objects.h |
| Emerald long grass rustle | 7 steps, 26 ticks (~0.43 s) | same |
| Emerald long grass cover | lower 16 px of a 16x32 sprite set to OAM priority 3 | object_event_subsprites.h |
| Emerald encounter | `rate*16 / 2880` per step, so rate 20 is 11.1%, and 40% skip on new tile type | wild_encounter.c |
| Crystal encounter | `Random byte < rate`, per time of day | wildmons.asm |
| Crystal cut | 4 leaves, 32 frames | field_moves.asm |
| Ash grass puff | 4-tick delay, 56-tick puff, permanent swap | field_tasks.c |
| ALttP bush drop | two 50% gates, fewer than 4 sprites, 8-step rotation | sprite.c |
| SPD high grass | seed 1/25, dew 1/6, 4 leaves | HighGrass.java |
| Tibia jungle grass regrow | 300 s; wheat 2 x 240 s | Canary items.xml |
| Stardew spread | 65% daily check, 25% per neighbour, 4 tufts per tile | Stardew wiki |

## Sources
- https://github.com/pret/pokeemerald/blob/master/src/field_effect_helpers.c
- https://github.com/pret/pokeemerald/blob/master/src/data/field_effects/field_effect_objects.h
- https://github.com/pret/pokeemerald/blob/master/src/event_object_movement.c
- https://github.com/pret/pokeemerald/blob/master/src/data/object_events/object_event_subsprites.h
- https://github.com/pret/pokeemerald/blob/master/src/field_tasks.c
- https://github.com/pret/pokeemerald/blob/master/src/wild_encounter.c
- https://github.com/pret/pokeemerald/blob/master/src/data/wild_encounters.json
- https://github.com/pret/pokecrystal/blob/master/engine/overworld/map_objects.asm
- https://github.com/pret/pokecrystal/blob/master/engine/overworld/wildmons.asm
- https://github.com/pret/pokecrystal/blob/master/data/wild/probabilities.asm
- https://github.com/pret/pokecrystal/blob/master/data/wild/johto_grass.asm
- https://github.com/pret/pokecrystal/blob/master/data/collision/field_move_blocks.asm
- https://github.com/pret/pokecrystal/blob/master/engine/events/field_moves.asm
- https://github.com/snesrev/zelda3/blob/master/src/overworld.c
- https://github.com/snesrev/zelda3/blob/master/src/sprite.c
- https://github.com/snesrev/zelda3/blob/master/src/ancilla.c
- https://github.com/snesrev/zelda3/blob/master/src/player.c
- https://github.com/snesrev/zelda3/blob/master/src/player_oam.c
- https://github.com/zladx/LADX-Disassembly (src/constants/gfx.asm, src/code/bank14.asm, src/constants/sfx.asm, src/constants/memory/wram.asm, src/code/entities/03_bomb.asm)
- https://zeldawiki.wiki/wiki/Grass
- https://github.com/opentibiabr/canary/blob/main/data/items/items.xml
- https://github.com/opentibiabr/canary/blob/main/data-otservbr-global/scripts/lib/register_actions.lua
- https://stardewvalleywiki.com/mediawiki/api.php?action=parse&page=Grass&prop=wikitext&format=json
- https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/levels/features/HighGrass.java
