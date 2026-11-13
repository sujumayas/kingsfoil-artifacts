# 10 - Games at this size: how shipped games draw fire near 32 px

Researcher 10, VFX #12 "Fire at 32 px". About 32 tool calls.

Method. I read open-source code, decompilations and asset data with `curl` and `gh`, then grepped them. For Tibia I wrote a 90-line protobuf reader (`scratch-10/decode_app.py`) and decoded Canary's copy of the real client's `appearances.dat`. That file holds every item's frame count, per-frame ms, pattern grid and pixel bounding box. I did not view or download any image. Every number says which tile and sprite size it belongs to.

Legend
- **[C]** confirmed. I read the code or data in this session.
- **[S]** secondhand. A wiki or a summary that describes the game, not its code.
- **[U]** unverified. From memory. Treat as a lead.
- **[I]** my inference or arithmetic.

"Fraction of a tile" is always against the game's own tile. Multiply by 32 to get Asterion pixels.

What VFX #6 already has and I do not repeat: TFS fire field damage (20 then 7 x 10), the 3x3 bomb and 1x5 wall shapes, the TibiaWiki stage times, Stardew's 10x10 smoke puff maths and the 3-ember torch, UO fire field rules from UOGuide, OSRS fire life (`studies/vfx-fire/notes/01-roots-classic.md` Q4, `10-pixel-games-smoke.md` Q1 to Q4).

Blocked or not found: GitHub code search found no RPG Maker MV `Animations.json` in the old (cell) format, so MV/VX Ace default fire frame counts are a gap. No sprite colours were seen, so tone counts are a gap for every game.

---

## Q1. Tibia (32 px tiles, 32x32 and 64x64 sprites, 15x11 tile view)

### Takeaway
Tibia fire is hand-drawn, 5-frame loops at 100 to 120 ms. The flames do not fit in the tile. A fire field is drawn in a 64x64 sprite anchored at the tile's bottom-right, and its flames cover 49x47 px, about 1.5 tiles. Each field picks one of 16 sprite variants from its map position (x % 4, y % 4), so a 3x3 bomb never shows a repeated square. Dying fire is shown by swapping to a smaller sprite, slower frames and less light. A burning character gets no overlay at all. Each damage tick plays a 9-frame, 900 ms "hit by fire" effect and an orange number.

### Cited findings, asset data
Source for all items in this block: Canary's `data/items/appearances.dat` decoded with the schema in `src/protobuf/appearances.proto` (https://github.com/opentibiabr/canary/blob/main/data/items/appearances.dat, https://github.com/opentibiabr/canary/blob/main/src/protobuf/appearances.proto). `Box` is (x, y, width, height) inside the sprite canvas. Light is (brightness, colour index). Every flame below has `loop_type` infinite unless marked "once".

- **Fire field, decaying chain 2118 -> 2119 -> 2120 [C].**
  - 2118 (stage 1). 5 frames x 120 ms. Pattern 4x4, so 80 sprites. Box (15, 17, 49, 47). Light 7. `bounding_square` 42.
  - 2119 (stage 2). 5 frames x 100 ms. Box (15, 10, 49, 54). Light 5. `bounding_square` 42.
  - 2120 (stage 3, harmless). 5 frames x 100 ms. Box (26, 24, 38, 40). Light 3. `bounding_square` 32.
  - All three are unsynchronised (`synchronized` false).
- **Fire field, map-placed copies 2131 to 2133 [C].** Same 5 frames at 120 / 100 / 100 ms, but a 2x2 pattern (20 sprites). Boxes 45x47, 45x52, 35x40. Light 7, 5, 3.
- **Campfire [C].**
  - 1998. 5 frames x 100 ms, light 7.
  - 1999. 4 frames x 100 ms, light 5.
  - 2000. 6 frames x 300 ms, light 3.
  - 2003. 4 frames x 150 ms, light 5.
  - 1996, 1997, 2001 (unlit), 2002 are single still frames.
  - All campfires are 32x32 sprites with box (0, 0, 32, 32).
- **Lit torch, a 4-step burn-down [C].**
  - 2921. 2 frames x 500 ms, synchronised. Box 29x30. Light 7.
  - 2923. Same 2 x 500 ms. Box 26x27. Light 6.
  - 2925. Same. Box 24x23. Light 5.
  - 2926 "burnt down torch". Still. Box 11x14. Light 0.
  - Newer lit torch 34016. 13 frames, each with a random duration between 100 and 300 ms (min/max pairs), synchronised. Box 29x30.
- **Other fires [C].**
  - Coal basin 2110. 11 frames (nine of 100 ms, two of 200 ms). Box 29x30. Light 8. Shift (4, 4). Height 8.
  - Fireplace 28166. 5 x 100 ms. Box (10, 14, 35, 47) in a 64x64 canvas.
  - Oven 2535. 8 x 150 ms. Box 32x34.
  - Burning wall 232. 5 x 100 ms. Box 37x31. Burning wall 5061 is two tiles wide, box 61x32, 5 x 100 ms.
  - "Searing fire" 2137. 5 x 120 ms. Box 42x40. Light 7.
- **Burnt and ash art [C].**
  - Ashes 2140 and 3134 share one still sprite. Box (4, 4, 24, 24).
  - Burnt down firewood 3131. Still. Box 24x24.
  - Burnt wall 8793 to 8798. Still. Pattern 2. Box 54x30.
- **Effects, all play once [C].** These belong to note 14. I record sizes only.

  | Effect (Canary id) | Frames x ms | Total | Box px |
  |---|---|---|---|
  | HITBYFIRE (16) | 9 x 100 | 900 ms | 42x40 |
  | FIREAREA (7) | 1 x 40 + 13 x 60 | 820 ms | 53x53 |
  | FIREATTACK (37) | 8 x 100 | 800 ms | 43x45 |
  | EXPLOSIONHIT (6) | 35, 50, 75, 90, 90, 100, 110, 110 | 660 ms | 35x35 |
  | EXPLOSIONAREA (5) | 12 x 50 + 1 x 100 | 700 ms | 31x31 |
  | POFF (3) | 8 x 50 | 400 ms | 31x31 |
  | SMOKE (68) | 12 x 100 | 1200 ms | 33x35 |
  | BLACKSMOKE (158) | 7 x 100 | 700 ms | 33x35 |
  | FIRE_SPARKLES (295) | 14 x 100 | 1400 ms | 40x36 |
  | Fire missile (4) | 1 frame, 3x3 direction pattern | n/a | 27x22 side, 15x26 up/down |

  Effect ids come from https://github.com/opentibiabr/canary/blob/main/src/utils/utils_definitions.hpp

### Cited findings, server and client code
- **Stage times match the real game in Canary [C].** Canary's `items.xml` gives 2118 `duration` 200 s, 2119 148 s, 2120 98 s. That is the TibiaWiki 3:20, 2:28, 1:38. VFX #6 only had TFS's 3 x 120 s. Stage 1 damage 20, stage 2 damage 10, both 7 ticks of 10 s. Source: https://github.com/opentibiabr/canary/blob/main/data/items/items.xml
- **Campfire damage [C].** 1998 to 2000 are fire fields with `ticks` 4000, `count` 2, `damage` 20. Same file.
- **Torch burn times [C].** 2921 lasts 600 s, 2923 300 s, 2925 300 s, then 2926 burnt down lasts 300 s and vanishes. Same file.
- **Ashes timer [C].** 2140 "ashes" has `duration` 5 and `decayTo` 2137 (searing fire). 3134 ashes has no timer. Same file.
- **Burning status visual [C].** `Game::combatGetTypeInfo` maps `COMBAT_FIREDAMAGE` to `TEXTCOLOR_ORANGE` and `CONST_ME_HITBYFIRE`. Every fire hit, burning ticks included, plays that effect. Source: https://github.com/opentibiabr/canary/blob/main/src/game/game.cpp (line ~8149)
- **Variant by position [C].** OTClient's `Item` sets `m_numPatternX = m_position.x % numPatternX` and the same for y and z, for any item that is not stackable, a fluid or a hanging item. Source: https://github.com/mehah/otclient/blob/main/src/client/item.cpp (line ~243)
- **Sync and timing [C].** The animator reads `sprite_phase` min and max ms from the protobuf, and `m_async = !synchronized`. Synchronised items (torches) share the global clock. Async ones (fields, campfires) run their own. Source: https://github.com/mehah/otclient/blob/main/src/client/animator.cpp
- **View and old timing [C, from VFX #11 note 10].** `TILE_PIXELS` 32, 15x11 view, `ITEM_TICKS_PER_FRAME` 500 ms in edubart's OTClient for clients without per-frame durations.

### Inferences
- **Sprite canvas [I].** Every box with x + w = 64 sits in a 64x64 canvas. OTClient draws large sprites up and left of the tile ([C] `thingtype.cpp` line ~916 places sub-sprites from the bottom-right). So a stage 1 fire field spills about 17 px into the left tile and 15 px into the tile above.
- **Boxes are unions [I].** The box is likely the union over all 16 patterns and 5 frames. A single frame is probably smaller. Treat 49x47 as the maximum extent.
- **Fraction of a tile [I].** Field stage 1 = 1.53 x 1.47 tiles. Stage 2 = 1.53 x 1.69. Stage 3 = 1.19 x 1.25. Torch = 0.91 x 0.94 down to 0.34 x 0.44 burnt. Ash = 0.75 x 0.75. Fireplace = 1.09 x 1.47. Tibia is 1:1 with Asterion, so these are Asterion pixel sizes as they stand.
- **How Tibia says "dying" [I from C].** Three signals change together at each stage. Sprite height (54 -> 40 px), frame time (campfire 100 -> 300 ms) and light (7 -> 5 -> 3, steps of 2). The torch does the same with box size and light.
- **Spread is per tile [I from C].** Fire is an item on a tile. A firebomb places 9 items, each with its own 4x4 pattern variant and its own async clock. The overflow past the tile edge plus 16 variants hides the grid without any sub-tile state.
- **Server cost [I].** One item change per stage per tile. The client does everything else.

### Gaps
- No sprite pixels seen. Tone counts and exact per-frame sizes are unknown.
- `bounding_square` meaning (42 against a 49 px box) is not documented in the proto. I report the raw value.
- The 16 pattern variants could be 16 different flame shapes or 16 crops of one bigger pattern. Not checked.
- This is the current client (protobuf era). Fire field sprites in 7.x clients may differ.

"See it in action": https://tibia.fandom.com/wiki/Fire_Field (may block bots)

---

## Q2. RPG Maker VX Ace (32 px) and MV/MZ (48 px)

### Takeaway
RPG Maker fire is a battle animation, not a map object. MV plays animation cells of 192x192 px at one cell change every 4 game frames, so 15 fps (66.7 ms). A 192 px cell is 4 tiles at 48 px. MZ dropped cells for Effekseer particle files.

### Cited findings
- **MV cell size and rate [C].** `Sprite_Animation` sets `this._rate = 4` and `_duration = frames.length * rate + 1`. Each cell is cut as `sx = pattern % 5 * 192`, `sy = floor(pattern % 100 / 5) * 192`, `setFrame(sx, sy, 192, 192)`. So sheets are 5 cells wide and patterns 0 to 99 sit on the first image. Flash duration is also multiplied by the rate. Source: https://github.com/rpgtkoolmv/corescript/blob/master/js/rpg_sprites/Sprite_Animation.js
- **MZ "Fire One 1" [C].** In MZ default data the animation has `effectName` "FireOne1" (an Effekseer file), `flashTimings` at frames 9 and 39, each 30 frames long, colour (255, 170, 51, 204), `scale` 100, `speed` 100. Seen in two projects that ship the default data: https://github.com/KageDesu/Alpha-ABS-Z/blob/master/data/Animations.json and https://github.com/Psychronic-Games/RPGReactor/blob/master/template/Demo/data/Animations.json

### Inferences
- **Cell to tile [I].** 192 / 48 = 4 tiles in MV. VX Ace also uses 192 px cells [U] on 32 px tiles, which is 6 tiles. A single-target fire animation at 6 tiles is far bigger than a map flame. It is a screen effect, not a tile effect.
- **15 fps [I].** 66.7 ms per cell is faster than Tibia's 100 to 120 ms map loops and close to Tibia's 50 to 60 ms one-shot effects.

### Gaps
- Default MV/VX Ace fire frame counts (Fire1 to Fire3 sheets). The old-format `Animations.json` was not found.
- Fire tiles in the default tilesets. VX Ace and MV tile animation (A1 water/lava) is not fire. Campfires in the RTP are, I believe, `!Flame` character sheets with 3 frames [U].
- VX Ace `Sprite_Base` rate. I believe it is also 4 [U].

"See it in action": https://github.com/rpgtkoolmv/corescript/blob/master/js/rpg_sprites/Sprite_Animation.js

---

## Q3. Stardew Valley 1.5.4 (16 px tiles drawn at 4x, 16x32 characters, 320x180 art px)

### Takeaway
Stardew uses one 12x11 flame loop of 4 frames at 100 ms for almost everything. A campfire is three copies of it at 3x with three phase seeds. A fireplace is two copies at 4x. The small floor torch uses a different 8x8 flame of 7 frames at 100 ms. Note that VFX #6 listed the Stardew torch as 12x11. In 1.5.4 the 12x11 flame is the campfire, fireplace and torch-furniture flame, and the floor torch is 8x8.

### Cited findings
Source for all [C] items: https://github.com/veywrn/StardewValley (decompiled 1.5.4), files `Torch.cs`, `Objects/Furniture.cs`, `Object.cs`.
- **Floor torch [C].** Flame source rect `(276 + frame * 8, 1965, 8, 8)`. Frame = `(ms + x*3204 + y*49) % 700 / 100`, so 7 frames x 100 ms. Drawn at scale 3 with alpha 0.75. `Torch.cs` lines ~223 to 227.
- **Campfire (146) and Cookout Kit (278) [C].** Three flames, each `(276 + frame * 12, 1985, 12, 11)`, 4 frames x 100 ms, scale 3. The seeds differ (`x*3047 + y*88`, `x*2047 + y*98`, `x*2077 + y*98`). Offsets in screen px from the tile corner are (12, -8), (20, 0), (12, 12). `Torch.cs` lines ~240 to 244.
- **Fireplace (furniture type 14) [C].** Two 12x11 flames at scale 4, seeds `x*3047 + y*88` and `x*2047 + y*98`. **Torch furniture (type 16) [C]** draws one 12x11 flame at scale 4. `Furniture.cs` lines ~1518 to 1526. Type constants at lines 46 and 50.
- **Embers [C].** 3 points, source pixels `(344 + i % 3, 53, 1, 1)`, alpha 0.5 fading with height. Respawn chance 0.0075 per frame once above -100 px. Updated only within 256 px of the screen. `Torch.cs` lines ~159 to 177.
- **Furnace smoke [C].** Loading ore spawns 5 smoke puffs at offsets (4, -48), (-16, -56), (16, -52), (32, -56), (40, -44) with delays 200, 300, 400, 200, 500 ms. `Object.cs` lines ~2882 to 2886. The puff itself is VFX #6's 10x10 sprite.
- **Light [C].** Lit torch objects get radius 2.5. A campfire's light sits 32 px below the tile top instead of 64 px above. Furnace (while working) and Bonfire get radius 1.5. `Object.cs` lines ~3125 to 3140.

### Inferences
- **Fraction of a tile [I].** The tile is 64 screen px.
  - 12x11 at 4x = 48x44 = 0.75 x 0.69 tile. At 32 px that is 24x22 px.
  - 12x11 at 3x = 36x33 = 0.56 x 0.52 tile, 18x17 px at 32.
  - Floor torch 8x8 at 3x = 24 px = 0.375 tile, 12 px at 32.
  - Ember 1 source px at 3 = 3 screen px = 0.047 tile, 1.5 px at 32.
  - Campfire spread of three flames covers about 20 + 36 = 56 screen px across, about 0.9 tile.
- **One loop, many fires [I].** Stardew builds bigger fires by stacking copies of one small loop with different seeds. Asterion can do the same with one 24x22 loop.
- **Scale 3 breaks the pixel grid [I].** The world is 4x. Campfire flames and torch flames are 3x. A strict 640x360 game should not copy this.

### Gaps
- Brazier bigCraftables and the Bonfire draw path were not read.
- Tone counts (the flame strip at `(276, 1985)` in `Cursors.png` was not viewed).

"See it in action": https://stardewvalleywiki.com/Campfire

---

## Q4. Zelda: A Link to the Past (16 px tiles, 256x224)

### Takeaway
ALttP fire is built from 8x8 and 16x16 hardware sprites and lives under half a second. The Fire Rod impact is 3 frames of 16x16 at 8 game frames each, then a 16x8 tail. The Lamp flame is 3 frames of 8 game frames. Nothing burns on the map. Fire only lights torch tiles.

### Cited findings
Source: https://github.com/snesrev/zelda3/blob/master/src/ancilla.c (a C reimplementation of the ROM code).
- **Fire Rod shot [C].** Velocity 64 on one axis. Spawn offset 8 to 16 px ahead of Link. In flight it draws three 8x8 pieces whose positions cycle through 4 layouts every 4 frames (`item_to_link & 0xc`). `AncillaAdd_FireRodShot` and `FireShot_Draw`, lines ~537 and ~877.
- **Fire Rod impact [C].** On a hit, `ancilla_timer` = 31. Frames are `timer >> 3`, so three 16x16 sprites (chars 0x8E, 0xA0, 0xA2) of 8 frames each, then two 8x8 pieces side by side (16x8) for the last 7 frames. Lines ~852 to 875.
- **Torches [C].** If the shot touches a tile with attribute `0xC0` to `0xCF`, `Dungeon_LightTorch()` runs.
- **Lamp flame [C].** Timer 23 frames. Frame = `(timer & 0xF8) >> 1`, so 3 frames of 8. Each frame is up to four 8x8 pieces. Spawn offset (0, -16), (0, 24), (-20, 4) or (18, 4) from Link by facing. Lines ~5178 and ~6143.

### Inferences
- **Times [I].** At 60 fps, 8 frames = 133 ms. Impact burst = 517 ms. Lamp flame = 383 ms.
- **Speed [I].** If velocity is in 1/16 px per frame, 64 = 4 px per frame = 240 px/s = 15 tiles/s.
- **Fraction of a tile [I].** The 16x16 impact frame = 1 tile. At 32 px that is 32x32.

### Gaps
- Bush burning in ALttP. VFX #6 cited it for the GBA remake only. I found no bush-burning call near the fire rod code.
- Minish Cap (https://github.com/zeldaret/tmc) not read.

"See it in action": https://zeldawiki.wiki/wiki/Fire_Rod (may block bots)

---

## Q5. Ultima Online (44 px diamond tiles [U])

### Takeaway
A UO fire field is 5 item tiles placed one every 300 ms from the centre outwards, so the wall visibly grows. Life is about 54 s at full skill on ServUO.

### Cited findings
Source: https://github.com/ServUO/ServUO/blob/master/Scripts/Spells/Fourth/FireField.cs
- **Art ids [C].** `itemID = eastToWest ? 0x398C : 0x3996`.
- **Duration [C].** `(15 + Magery.Fixed / 5) / 4` seconds.
- **Growth [C].** The centre tile appears first. The others appear with `Timer.DelayCall(i * 300 ms)`.
- **Damage [C].** Default 2. The field timer starts after 500 ms and repeats every 1.0 s.
- **Spawn effect [C].** `SendLocationParticles(..., 0x376A, 9, 10, 5029)` on each tile.

### Inferences
- **Duration at GM [I].** Magery 100.0 is `Fixed` 1000, so (15 + 200) / 4 = 53.75 s.
- **Frames [I].** The two ids are 10 apart (0x398C to 0x3995). That fits a 10-frame item animation per orientation, but I did not read `animdata.mul`.
- **Growth for Asterion [I].** A 300 ms delay per tile for a 1x5 wall is cheap and reads well. The server can send the five tiles at once with a delay field.

### Gaps
- Tile and art pixel sizes. `animdata.mul` frame counts and delays. Campfire art (`Campfire.cs` was not at the path I tried).

"See it in action": https://www.uoguide.com/Fire_Field (may block bots)

---

## Q6. Ragnarok Online (3D map, 2D sprites, 1 cell = 5 world units)

### Takeaway
RO fire is a particle-strip (STR) effect per cell, with two random variants for Fire Wall. Fire Pillar adds a textured cylinder 1 cell wide at the bottom, 2 at the top and 3 high.

### Cited findings
- **Fire Wall effect [C].** Effect 25, `type: 'STR'`, `file: 'firewall%d'`, `rand: [1, 2]`. Each cell picks `firewall1` or `firewall2`. https://github.com/MrAntares/roBrowserLegacy/blob/master/src/DB/Effects/EffectTable.js (line ~1450)
- **Fire Pillar [C].** Effect 96 `firepillar` (caster), 97 `firepillarbomb` (hit), 138 `EF_FIREPILLARON` a `CYLINDER` with `topSize` 2.0, `bottomSize` 1.0, `height` 3, `duration` 5000 ms, `delayOffset` 1000, texture `magic_red`, rotating. Same file, lines ~3357 and ~3865.
- **Fire Wall rules [C].** rAthena `MG_FIREWALL` duration 5 s at level 1 up to 14 s at level 10, unit `Interval` 20 ms, `Layout` -1. https://github.com/rathena/rathena/blob/master/db/re/skill_db.yml

### Inferences
- **Two variants per cell [I].** The same trick as Tibia's 16 position variants, done with a coin flip instead.

### Gaps
- STR files hold texture sizes and keyframes. I did not parse them.

"See it in action": https://irowiki.org/wiki/Fire_Wall

---

## Q7. Terraria and Enter the Gungeon (16 px tiles [U])

### Cited findings
- **Terraria "On Fire!" [S].** −4 HP per second, no regeneration. Afflicted entities "emit fire particles and a small amount of light". Most sources apply 3 to 6 s. https://terraria.wiki.gg/wiki/On_Fire!
- **Terraria campfires [S].** Campfires give a nearby buff, can be toggled, and "their smoke particles are affected by wind speed and direction". https://terraria.wiki.gg/wiki/Campfires
- **Gungeon goop fire [S].** Fire is "a goop state" rather than a goop. Lit goop "quickly spreads throughout the goop pool". Explosions and fire projectiles ignite it. A burning enemy stepping on goop ignites it, a burning player does not. Green napalm applies green fire for 120 s at 4 dps. https://enterthegungeon.wiki.gg/wiki/Goop

### Inferences
- **Gungeon spreads fire through a liquid layer [I].** The flammable thing is a sub-tile goop field, and fire is a flag on it. That is close to VFX #6's per-cell state, but it only burns where goop was spilled.

### Gaps
- Terraria campfire frame count and size (I believe 3x2 tiles, 8 frames [U]). Terraria player size (I believe 20x42 hitbox, 40x56 frame [U]). Gungeon goop cell size and burn timers.

---

## Q8. Games I could not source this session

Budget ran out before these. Values marked [S] come from the VFX #11 note 10. Everything else is [U].

| Game | What I believe | Status |
|---|---|---|
| CrossCode | 568x320 internal [S]. 16 px tiles [U]. | No fire data |
| Chained Echoes | 640x360 internal [S]. | No fire data |
| Hyper Light Drifter | 480x270 internal [U]. | No fire data |
| Nuclear Throne | 320x240 internal, 16 px tiles, about 24 px characters [U]. | No fire data |
| Eastward, Sea of Stars, Graveyard Keeper, Moonlighter, Children of Morta | Internal sizes unknown | No fire data |
| Secret of Mana, Chrono Trigger | 256x224, 16 px tiles [U] | No fire data |
| Minish Cap | 240x160, decomp at https://github.com/zeldaret/tmc [U] | Not read |
| Pokémon Gen 4 and 5 | No overworld fire found in VFX #11's pret reads | Not read |
| Medivia, Realera, Ezodus | Tibia-likes. I expect Tibia-style item fires [U] | Not read |

---

## Q9. Patterns across the games

### Takeaway
Map flames at this size are short loops of 4 to 6 frames at 100 to 150 ms. One-shot fire effects are 7 to 14 frames at 40 to 100 ms. The flame in the most Asterion-like game, Tibia, is bigger than its tile. Variety comes from position-picked variants, not from simulation.

### Cited patterns (each built from [C] items above)
- **Loop length.** Tibia field 5 x 120/100 ms, campfire 5 x 100, 4 x 100, 4 x 150. Stardew 4 x 100 (12x11) and 7 x 100 (8x8). Tibia torches are slower (2 x 500 ms) and the new torch varies 100 to 300 ms per frame.
- **Dying fire is slower.** Tibia's small campfire runs 6 x 300 ms against 5 x 100 ms for the big one.
- **Light steps.** Tibia fire light 7 -> 5 -> 3 over three stages, torch 7 -> 6 -> 5 -> 0.
- **Per-tile phase or variant.** Tibia picks 1 of 16 sprites by x % 4, y % 4 and runs fields unsynchronised. Stardew seeds the phase with `x*3047 + y*88`. RO picks 1 of 2 at random.
- **Ash is small and still.** Tibia ash is 24x24 in a 32 px tile, no animation.
- **Burning status is a repeated hit effect** in Tibia (900 ms, 42x40 px per tick) and particles plus light in Terraria.
- **Smoke in Tibia is a one-shot effect**, 33x35 px, 7 to 12 frames x 100 ms. Stardew uses single 10x10 puffs. Neither uses a smoke field.

### Inferences for Asterion (32 px tiles, 24x32 characters, 640x360)
- **Burning tile flame [I].** Draw it 40 to 54 px tall and up to 49 px wide in a 64x64 canvas, anchored to the tile's bottom edge, as Tibia does. A flame that stays inside 32x32 will look smaller than Tibia's.
- **Loop [I].** 5 frames at 100 to 120 ms for burning tiles and campfires. 300 ms frames for embers and dying stages.
- **Variants [I].** 4x4 position variants (16 sprites per stage) are the shipped answer to square fronts. They cost texture memory, not CPU.
- **Torch [I].** Stardew's floor torch flame is 12 px at Asterion scale, Tibia's whole lit torch item is 29x30 px. A 24x32 character's torch flame should be 8 to 12 px.
- **Stage count [I].** Three visible stages plus ash, each shorter and dimmer, matches Tibia and costs one server message per stage per tile.
- **Burning character [I].** The cheapest shipped answer is Tibia's. No overlay, a 900 ms hit flame per server tick. Note 13 covers richer overlays.

### Gaps
- No sourced game gave tone counts. That needs someone to look at the sprites.
- No sourced game in this note draws sub-tile spread on the map. Gungeon's goop is the closest.

---

## Q10. Summary table

Sizes are the game's own pixels. "Tile" fractions are against that game's tile.

| Game | Tile px | Character px | Flame sizes px | Frames x ms | Smoke | Scorch | URL |
|---|---|---|---|---|---|---|---|
| Tibia (Canary data) | 32 [C] | 32x32 [U] | Field 49x47 / 49x54 / 38x40 in 64x64 (1.5 tiles) [C]. Torch 29x30 to 11x14 [C]. Fireplace 35x47 [C]. Campfire 32x32 canvas [C] | Field 5 x 120 / 100 / 100 [C]. Campfire 5 x 100, 4 x 100, 6 x 300 [C]. Torch 2 x 500 [C]. Coal basin 11 x 100-200 [C] | Effect 68 12 x 100 ms, 33x35. Black smoke 7 x 100, 33x35 [C] | Ash 24x24 still. Burnt wall 54x30 still [C]. Field stages 200 / 148 / 98 s [C] | https://tibia.fandom.com/wiki/Fire_Field |
| Tibia burning status | 32 | 32x32 [U] | HITBYFIRE 42x40 [C] | 9 x 100 = 900 ms per tick [C] | None | None | https://github.com/opentibiabr/canary/blob/main/src/game/game.cpp |
| RPG Maker MV | 48 [C, VFX #11] | 48x48 [C, VFX #11] | Battle cells 192x192 (4 tiles) [C] | 1 cell per 4 frames = 66.7 ms [C]. Counts unknown | n/a | n/a | https://github.com/rpgtkoolmv/corescript/blob/master/js/rpg_sprites/Sprite_Animation.js |
| RPG Maker MZ | 48 | 48x48 | Effekseer, scale 100 [C] | Flashes at frames 9 and 39, 30 frames each [C] | n/a | n/a | https://github.com/KageDesu/Alpha-ABS-Z/blob/master/data/Animations.json |
| RPG Maker VX Ace | 32 [U] | 32x32 [U] | 192x192 cells [U] (6 tiles) | Rate 4 [U] | n/a | n/a | https://www.rpgmakerweb.com/products/rpg-maker-vx-ace |
| Stardew Valley 1.5.4 | 16 at 4x [C, VFX #11] | 16x32 [C, VFX #11] | 12x11 at 4x = 0.75 tile (fireplace x2, torch furniture x1). 12x11 at 3x = 0.56 tile (campfire x3). Floor torch 8x8 at 3x = 0.375 tile [C] | 12x11: 4 x 100. 8x8: 7 x 100 [C] | 10x10 puff, about 6 s (VFX #6). Furnace 5 puffs, 200-500 ms delays [C] | None | https://stardewvalleywiki.com/Campfire |
| Zelda ALttP | 16 [U] | about 16x24 [U] | Fire Rod impact 16x16 (1 tile), lamp up to 16x16 [C] | Impact 3 x 8 frames + 7 frames (517 ms). Lamp 3 x 8 frames (383 ms) [C] | None | None, lights torches [C] | https://zeldawiki.wiki/wiki/Fire_Rod |
| Ultima Online (ServUO) | 44 diamond [U] | n/a | Art 0x398C / 0x3996 [C] | Possibly 10 frames [I] | Spawn particle 0x376A [C] | None | https://www.uoguide.com/Fire_Field |
| Ragnarok Online | 3D cell, 5 units [C, VFX #11] | 2D on 3D [U] | Fire Pillar cylinder 1 cell bottom, 2 top, 3 high [C] | Pillar 5000 ms. Wall 5 to 14 s, hit every 20 ms [C] | STR | None | https://irowiki.org/wiki/Fire_Wall |
| Terraria | 16 [U] | 20x42 hitbox [U] | Unknown | Unknown | Campfire smoke follows wind [S] | None | https://terraria.wiki.gg/wiki/Campfires |
| Enter the Gungeon | 16 [U] | Unknown | Goop fire, spreads through pool [S] | Unknown | Unknown | Unknown | https://enterthegungeon.wiki.gg/wiki/Goop |

---

## Gems (open code and data worth reading)

| Name | URL | Licence | What it gives |
|---|---|---|---|
| Canary `appearances.dat` + `appearances.proto` | https://github.com/opentibiabr/canary | GPL-2.0 (read in VFX #11, not re-read) | Frame counts, per-frame ms, 4x4 position patterns, pixel boxes and light for every Tibia item and effect. A 90-line Python reader (`scratch-10/decode_app.py`) is enough, no protobuf library needed. |
| Mehah OTClient | https://github.com/mehah/otclient | Not read this session | `animator.cpp` (sync vs async, min/max frame ms) and `item.cpp` (pattern = position % width). |
| snesrev/zelda3 | https://github.com/snesrev/zelda3 | Not read this session | `ancilla.c` has frame-exact Fire Rod and Lamp timings. |
| ServUO | https://github.com/ServUO/ServUO | Not read this session | `FireField.cs`, the 300 ms tile-by-tile wall growth. |
| roBrowser Legacy | https://github.com/MrAntares/roBrowserLegacy | GPL-3.0 (read in VFX #11) | `EffectTable.js` lists every RO effect, variant count and cylinder geometry. |
| veywrn/StardewValley | https://github.com/veywrn/StardewValley | Decompiled proprietary code. Read only. | `Torch.cs`, `Furniture.cs` fire draws. |

GPL note: read the Tibia and RO data for design. Do not ship them or paste them into Asterion.

---

## Scratch files
`scratch-10/` holds `decode_app.py`, Canary `appearances.proto`, `items.xml`, `utils_definitions.hpp`, `combat.cpp`, `condition.cpp`, `game.cpp`, `appearances.dat` (4.9 MB), OTClient `const.h`, `animator.cpp`, `thingtype.cpp`, `item.cpp`, MV `Sprite_Animation.js`, Stardew `Torch.cs`, `Furniture.cs`, `Object.cs`, zelda3 `ancilla.c`, ServUO `FireField.cs`, and three wiki JSON dumps. Rerun the decoder with `python3 -I decode_app.py canary/appearances.dat <object ids> <effect ids> <missile ids>`.

## Sources
1. Canary `appearances.dat`: https://github.com/opentibiabr/canary/blob/main/data/items/appearances.dat
2. Canary `appearances.proto`: https://github.com/opentibiabr/canary/blob/main/src/protobuf/appearances.proto
3. Canary `items.xml`: https://github.com/opentibiabr/canary/blob/main/data/items/items.xml
4. Canary `utils_definitions.hpp`: https://github.com/opentibiabr/canary/blob/main/src/utils/utils_definitions.hpp
5. Canary `game.cpp`: https://github.com/opentibiabr/canary/blob/main/src/game/game.cpp
6. Mehah OTClient `item.cpp`: https://github.com/mehah/otclient/blob/main/src/client/item.cpp
7. Mehah OTClient `animator.cpp`: https://github.com/mehah/otclient/blob/main/src/client/animator.cpp
8. Mehah OTClient `thingtype.cpp`: https://github.com/mehah/otclient/blob/main/src/client/thingtype.cpp
9. RPG Maker MV `Sprite_Animation.js`: https://github.com/rpgtkoolmv/corescript/blob/master/js/rpg_sprites/Sprite_Animation.js
10. MZ default `Animations.json` copies: https://github.com/KageDesu/Alpha-ABS-Z/blob/master/data/Animations.json , https://github.com/Psychronic-Games/RPGReactor/blob/master/template/Demo/data/Animations.json
11. Stardew 1.5.4 decompilation: https://github.com/veywrn/StardewValley/blob/master/StardewValley/Torch.cs , https://github.com/veywrn/StardewValley/blob/master/StardewValley/Objects/Furniture.cs , https://github.com/veywrn/StardewValley/blob/master/StardewValley/Object.cs
12. zelda3 `ancilla.c`: https://github.com/snesrev/zelda3/blob/master/src/ancilla.c
13. ServUO `FireField.cs`: https://github.com/ServUO/ServUO/blob/master/Scripts/Spells/Fourth/FireField.cs
14. roBrowser Legacy `EffectTable.js`: https://github.com/MrAntares/roBrowserLegacy/blob/master/src/DB/Effects/EffectTable.js
15. rAthena `skill_db.yml`: https://github.com/rathena/rathena/blob/master/db/re/skill_db.yml
16. Terraria wiki, On Fire!: https://terraria.wiki.gg/wiki/On_Fire!
17. Terraria wiki, Campfires: https://terraria.wiki.gg/wiki/Campfires
18. Enter the Gungeon wiki, Goop: https://enterthegungeon.wiki.gg/wiki/Goop
19. VFX #11 note 10 (sizes reused): `studies/vfx-snow-32px/notes/10-games-at-32px.md`
20. VFX #6 notes 01 and 10 (not repeated): `studies/vfx-fire/notes/01-roots-classic.md`, `studies/vfx-fire/notes/10-pixel-games-smoke.md`
