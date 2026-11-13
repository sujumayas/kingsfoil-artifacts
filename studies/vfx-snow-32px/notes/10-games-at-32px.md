# 10 - Games at this size: how shipped top-down games draw snow

Researcher 10, VFX #11 "Snow at 32 px". About 31 tool calls.

Method. I read open-source code and decompilations with `curl` and `git`, then grepped them. I did not fetch fan wikis. Every number says which tile and sprite size it belongs to.

Legend
- **[C]** confirmed. I read the code or page in this session.
- **[S]** secondhand. A search summary or a page that describes the code, not the code itself.
- **[U]** unverified. From memory. Treat as a lead.
- **[I]** my inference.

Blocked or missing: rpgmaker.net returned 403. No public copy of the VX Ace `Spriteset_Weather` script was found. Searches for the internal resolution of Eastward, Moonlighter, Graveyard Keeper, Kynseed and Sea of Stars returned nothing usable.

What VFX #1 already has and I do not repeat: Emerald's 16 flakes of 8x8 px, Emerald's 57-frame prints, Tibia snow speed 160 against ice 100, Stardew's season-prefixed tilesheets (`studies/vfx-snow/report.md` S4 to S17).

---

## Q1. Tibia (32 px tiles, 32 px creature sprites, 15x11 tile view)

### Takeaway
Tibia's snow is hand-drawn ground items. Its only dynamic part is a whole-tile swap. A snow tile becomes a "footprint" tile when a player steps off it, and a 10 second timer swaps it back. The state is the tile's item id, so the server owns it and every player sees the same prints. VFX #1 had the 10 s figure as unverified. Two open-source server data sets now confirm it.

### Cited findings
- **View size [C].** OTClient sets `TILE_PIXELS = 32` and `setVisibleDimension(Size(15, 11))`. That is 480x352 px of visible map. The draw buffer adds 3 tiles each way, so 18x14 tiles or 576x448 px. Item animation runs at `ITEM_TICKS_PER_FRAME = 500` ms. `MAX_ELEVATION = 24` px. Sources: https://github.com/edubart/otclient/blob/master/src/client/const.h and https://github.com/edubart/otclient/blob/master/src/client/mapview.cpp
- **Footprint ids, TFS [C].** `data/items/items.xml` on master:
  - 670 "snow" is the base ground. 671 is "ice".
  - 6580 to 6593 are 14 more "snow" ground ids.
  - 6594 to 6608 are the 15 footprint ids. Each has the description "Someone must have walked here recently.", `decayTo` its base tile, and `duration` 10.
  - The mapping is `6594 -> 670` and `6595..6608 -> 6580..6593`. So footprint id = base id + 15 for the 14 variants.
  - Source: https://github.com/otland/forgottenserver/blob/master/data/items/items.xml
- **The trigger, TFS [C].** `data/movements/scripts/snow.lua` is 14 lines. It runs on `StepOut`, so the print appears on the tile the player just left. It ignores non-players and ghost-mode players. It calls `item:transform(6594)` for id 670 or `item:transform(item.itemid + 15)` for the variants, then `item:decay()`. `movements.xml` registers it for 670 and for 6580 to 6593. It also adds progress to the "Snowbunny" achievement, with a target of 10,000 steps. Source: https://github.com/otland/forgottenserver/blob/master/data/movements/scripts/snow.lua
- **Canary agrees [C].** Canary uses client ids, so the base tile is 799 instead of 670. The rule is the same: `799 -> 6594`, variants `+15`, `duration` 10, `decayTo` 799. Sources: https://github.com/opentibiabr/canary/blob/main/data/scripts/movements/snow.lua and https://github.com/opentibiabr/canary/blob/main/data/items/items.xml
- **Other snow and ice items in TFS items.xml [C].** Snow ground ranges 4737 to 4748 (12 ids), 6609 to 6626 (18 ids), 6757 to 6760, 6838. Ice ground 6683 to 6686, 6695 to 6718 and more. Snow-covered objects are separate hand-drawn items: 2697 "snowy dead tree", 2698 "snowy fir tree", 7020 to 7022 "snowy dead tree", 7023 "snowy pine tree", 6999 to 7019 "snowy stone" (21 ids), 486 "snow heap", 7171 to 7173 "snowman".
- **A second timed tile [C].** Ice hole 7237 decays to 7236 after 300 s, and 7236 decays to 7200 after another 300 s. It is the same swap-and-timer mechanism with a longer clock.
- **Weather [C, narrow].** A grep for "weather" and "snow" in OTClient's `const.h`, `map.h` and `mapview.cpp` finds nothing. Those three files hold no weather layer.

### Inferences
- **The print has no direction [I].** The `+15` rule keeps no facing. Each base tile has one footprint sprite. Compare Platinum in Q4, which has 4 directions.
- **The timer does not restart [I].** The script is registered only for the 15 clean ids. Stepping off a tile that already shows prints fires nothing. A busy path therefore flickers back to clean snow every 10 s and gets re-stamped on the next step.
- **Cost [I].** One tile-change message when a print appears and one when it decays. No per-pixel state. For Asterion this is the cheapest design that all players can share.
- **Only players stamp [C code, I meaning].** Monsters and NPCs leave nothing, which keeps the number of tile updates tied to player count.
- **The 14 variants [I].** They are likely border or mixed-ground snow tiles. I could not see the sprites, so this is a guess.

### Gaps
- These are emulator data files. Nobody has checked the 10 s against CipSoft's own server.
- I did not see any sprite. Print size in px inside the 32 px tile is unknown.
- Whether real Tibia has any falling snow is [U]. I believe it has none.
- Ground speed values sit in the binary `items.otb`. I did not parse it. VFX #1 has 160 against 100 from the wiki.

---

## Q2. RPG Maker VX Ace (32 px) and MV/MZ (48 px)

### Takeaway
RPG Maker's snow ground is a normal A2 autotile. Its falling snow is at most 90 round sprites that fade out in mid-air and never land. The flake is 3/16 of a tile wide in both engines: 9 px on 48 px tiles, 6 px on 32 px tiles.

### Cited findings, MV (48 px tiles, 48x48 characters, 816x624)
- **Sizes [C].** `Tilemap._tileWidth = 48`. `SceneManager._screenWidth = 816`, `_screenHeight = 624`. That is 17x13 tiles. Sources: https://github.com/rpgtkoolmv/corescript/blob/master/js/rpg_core/Tilemap.js and https://github.com/rpgtkoolmv/corescript/blob/master/js/rpg_managers/SceneManager.js
- **Characters [C].** The help page says a character is "normally 48x48", with 4 directions and 3 patterns. Characters draw 6 px above the tile. Source: https://rpgmakerofficial.com/product/MV_Help/page/01_11_01.html
- **Autotile sheets [C, help page].** A1 and A2 are 768x576. A3 is 768x384. A4 is 768x720. A5 is 384x768. B to E are 768x768. An autotile's source block is "a pattern composed of 6 tiles", 2 wide by 3 tall, so 96x144 px at 48 px tiles.
- **How the 6 source tiles become every shape [C].** `Tilemap._drawAutotile` cuts each map tile into 4 quarter tiles of `tileWidth / 2` (24 px in MV). `FLOOR_AUTOTILE_TABLE` has 48 entries. Each entry lists 4 `[qsx, qsy]` quarter positions inside the block's 4x6 quarter grid. Tile id = `2048 + kind * 48 + shape`. A2 kinds start at id 2816. For A2 the block origin is `bx = tx * 2`, `by = (ty - 2) * 3` in tiles.
- **Weather [C].** `Weather.js`:
  - The snow bitmap is 9x9 px, a white circle of radius 4.
  - `maxSprites = floor(power * 10)` with power in 0 to 9, so at most 90 flakes.
  - Each frame: `ax -= 3 * sin(PI/16)` (0.59 px left), `ay += 3 * cos(PI/16)` (2.94 px down), `opacity -= 3`.
  - A flake is reborn when opacity drops under 40. Start opacity is 160 to 219. A flake therefore lives 40 to 60 frames and falls 118 to 176 px, which is 2.5 to 3.7 tiles.
  - Rebirth picks a random spot in a rectangle of (width + 100) by (height + 200), shifted up and left.
  - A screen dimmer has opacity `power * 6`, at most 54 of 255.
  - For comparison, rain is a 1x60 px bitmap at 6 px per frame and storm is 2x100 px at 8 px per frame.
  - Source: https://github.com/rpgtkoolmv/corescript/blob/master/js/rpg_core/Weather.js

### Cited findings, VX Ace (32 px tiles)
- **Weather [S].** A search summary of the rpgmaker.net "Slip into Ruby" article says the snow bitmap is 6x6 px, and each update does x - 1, y + 3, opacity - 12. The page itself returned 403. Source: https://www.rpgmaker.net/articles/1356
- **Sizes [U].** 544x416 screen (17x13 tiles), 32x32 characters, A2 sheet 512x384. I know these from memory and could not confirm them in this session.

### Inferences
- **Same view in tiles [I].** Both engines show 17x13 tiles. MV scaled the art by 1.5 and kept the tile count.
- **Flake to tile ratio [I].** 9 / 48 = 0.1875 and 6 / 32 = 0.1875. Same ratio.
- **Density [I].** 90 flakes over 221 tiles is 0.41 flakes per tile at full power.
- **Fall speed [I].** 2.94 px per frame at 60 fps is 176 px/s, or 3.7 tiles/s on 48 px tiles.
- **The table has 48 slots [C], 47 used [U].** I recall slot 47 duplicates slot 46. Not checked.
- **Snow autotile cost [I].** A per-tile snow level driving an A2-style overlay needs 6 hand-drawn tiles per snow level, 96x64 px at 32 px tiles with 16 px quarters. That is the "cheap fallback" in scope item 2.

### Gaps
- What the default RTP holds for winter. I believe MV's `Outside_A2` has a snow ground autotile and `Outside_B` has snow-covered conifers [U]. Snow roofs come mostly from add-on packs such as "Winter Wonderland Tiles" (title seen in search only): https://www.rpgmakerweb.com/a/rpg-maker-vxace-tileset/winter-wonderland-tiles
- The VX Ace sprite count per power level.
- MZ's `rmmz_core.js` was not read. I expect the same Weather class [U].

---

## Q3. Stardew Valley (16 px tiles drawn at 4x, 16x32 characters)

### Takeaway
Stardew's falling snow has no particles. It is one 16x16 px animated tile with 16 frames, repeated across the screen about 273 times. The ground has no depth and no footprints. Winter changes the tilesheet and the footstep sound. Source for all [C] items below is a decompilation of version 1.5.4: https://github.com/veywrn/StardewValley/blob/master/StardewValley/Game1.cs

### Cited findings
- **Sizes [C].** `tileSize = 64`, `pixelZoom = 4`, `smallestTileSize = 16`. `defaultResolutionX = 1280`, `defaultResolutionY = 720`. At default zoom the view is 20 x 11.25 tiles, or 320x180 art px. That is the same canvas as the VFX #1 sandbox. An NPC sprite is built as `AnimatedSprite(..., 16, 32)`.
- **Snow overlay [C].** `drawWeather` loops `x` and `y` in steps of 64 screen px from -64 to the viewport edge. Each step draws a 16x16 source rect from the `mouseCursors` sheet at `(368 + frame * 16, 192)`. The frame is `(totalMs % 1200) / 75`, so 16 frames at 75 ms and a 1.2 s loop. Scale is 4.001. Colour is white times 0.8 times `options.snowTransparency`.
- **Draw count [I from C].** At 1280x720 the loop runs about 21 x 13 = 273 times per frame.
- **Camera anchoring [C].** `updateWeather` calls `updateFloatingObjectPositionForMovement(snowPos, viewport, previousViewport, -1)`. The overlay shifts against the camera, so the pattern stays fixed to the world while the map scrolls. No other motion is applied. The falling is inside the 16 frames.
- **Player setting [C].** `snowTransparency` defaults to 1.0 and has an options slider. Source: https://github.com/veywrn/StardewValley/blob/master/StardewValley/Options.cs
- **Snow debris [C].** `WeatherDebris` type 3 is snow. Its source rect is 4x4 px with 5 variants at `(391 + 4n, 1236)`. It draws at scale 3, so 12 screen px. `populateDebrisWeatherArray` makes `random.Next(16, 64)` pieces, so 16 to 63. Per frame: `x += dx + globalWind` with `globalWind = -0.25` and `dx` in [-0.2, 0), and `y += dy + 0.5` with `dy` in [0, 0.18]. Source: https://github.com/veywrn/StardewValley/blob/master/StardewValley/WeatherDebris.cs
- **No footprints [C].** A grep for "footprint" in `Farmer.cs`, `FarmerSprite.cs` and `Game1.cs` finds only an unrelated save fix. Winter swaps the grass step sound: `"snowyStep"` instead of `"grassyStep"`. Source: https://github.com/veywrn/StardewValley/blob/master/StardewValley/FarmerSprite.cs

### Inferences
- **Debris speed [I].** 0.5 to 0.68 screen px per frame is 30 to 41 px/s at 60 fps, or 0.5 to 0.6 tiles/s on 64 px tiles. Slow drift.
- **Debris size [I].** 12 screen px on a 64 px tile is 0.1875 of a tile. That is the RPG Maker ratio again.
- **Scale 3 breaks the pixel grid [I].** The world is drawn at 4x and the debris at 3x. Players do not seem to mind, but a strict pixel-perfect game should not copy this.
- **Debris density [I].** 16 to 63 pieces over 225 tiles is 0.07 to 0.28 per tile.
- **Why a tiled overlay works [I].** It costs the same at any density, needs no state, and looks even. Its weakness is the visible 16 px repeat. At 32 px tiles a 32x32 or 64x64 overlay tile with 16 frames would hide the repeat better.

### Gaps
- I did not look at the overlay art, so the flake size and count inside the 16x16 tile are unknown.
- Whether vanilla winter ever schedules debris weather. The code path for winter exists.
- This is decompiled proprietary code. Read it, do not copy it.

"See it in action": https://stardewvalleywiki.com/Winter

---

## Q4. Pokémon Gen 4 (16-unit tiles, DS 256x192)

### Takeaway
Platinum stores snow depth as a tile type, with three deep tiers. Each tier sets a fixed sink and a fixed walk speed. Prints are small models placed on the tile the walker just left. They hold for 16 frames and fade for 16 more. HeartGold has one snow type and no deep tiers. All [C] items come from https://github.com/pret/pokeplatinum and https://github.com/pret/pokeheartgold

### Cited findings, Platinum
- **Tile types [C].** `TILE_BEHAVIOR_SNOW_DEEP`, `_DEEPER`, `_DEEPEST`, `_SNOW_SHALLOW`, `_SNOW_WITH_SHADOWS`, plus `_BRIDGE_OVER_SNOW`. Source: `include/constants/fieldmap.h` lines 1447 to 1499.
- **Sink [C].** `src/map_object_move.c` defines `sinkInDeepSnowDistance -12`, `sinkInDeeperSnowDistance -14`, `sinkInDeepestSnowDistance -16`. Mud is -12 and deep mud is -14. The value becomes the sprite's vertical terrain offset in world units.
- **A tile is 16 units [C].** `MovementAction_InitWalk` for a normal walk moves 2 units for 8 frames. Source: `src/unk_020655F4.c` lines 472 to 610.
- **Speed [C].** `MapObject_GetDeepSnowMovementAction` in `src/player_move.c`:
  - deepest snow gives `WALK_SLOWER`, 0.5 units per frame, 32 frames per tile;
  - deeper snow gives `WALK_SLOW`, 1 unit per frame, 16 frames per tile;
  - deep snow gives `WALK_NORMAL`, 2 units per frame, 8 frames per tile.
  The call sits after the run-button check, so it replaces a run with a walk.
- **Footprints [C].** `src/overlay005/ov5_021F1CC8.c`:
  - 10 snow models: `foot_tracks_snow_up`, `_down`, `_left`, `_right`, and 6 bike tracks (vertical, horizontal, 4 corners). Sand has a matching set of 10.
  - The print is placed at `MapObject_GetXPrev` and `GetZPrev`, the tile just left.
  - Life: 16 frames at alpha 31, then alpha drops 2 per frame until below 0. That is 32 frames.
  - Shallow snow and deep snow use different effect types (2 and 3). Deep snow prints sit 2 units lower.
  - Bike tracks on "snow with shadows" return `NULL`, so no track.
- **Who leaves prints [C].** Each sprite type has a `trackType`: none, footsteps or line. The player and NPC classes such as Ninja Boy, Twin and Youngster all use footsteps. Source: `src/overlay005/object_event_gfx_data.c` line 1786 onward.
- **Sound [C].** Each step onto snow plays `SEQ_SE_PL_YUKI`.
- **Weather schedule [C].** `src/field_overworld_weather.c` holds a per-day table. In January, Route 216 is mostly `HEAVY_SNOW` and Snowpoint City is mostly `SNOWING`.

### Cited findings, HeartGold
- **One snow type [C].** `include/constants/metatile_behavior.h` has a single `TILE_BEHAVIOR_SNOW`. `WEATHER_SNOW` is 5. No deep, deeper or deepest.

### Inferences
- **Speed as a share of walking [I].** Deep 100% with no running, deeper 50%, deepest 25%. The VFX #1 sandbox caps slowdown at 55%, so Platinum's deepest tier is much harsher.
- **Sink as a share of a tile [I].** 12, 14 and 16 units are 75%, 88% and 100% of a tile. On Asterion's 32 px tiles that would be 24, 28 and 32 px, which hides a whole 24x32 character. Platinum can do this because the map is 3D and the camera tilts. A flat 2D game should stay near a third of the sprite, about 8 to 10 px.
- **Print lifetime in seconds [I].** 32 frames is about 1.07 s if the overworld runs at 30 fps [U for the frame rate]. VFX #1 already listed "about 32 frames". The split into 16 hold and 16 fade is new.
- **VFX #1 said "4 sink depths" from Bulbapedia.** The code shows 3 sink offsets, plus shallow snow with none.
- **One print per tile step [I].** Prints are tied to the tile-to-tile move, not to walk-cycle foot contacts. That fits Asterion's Tibia-style movement.

### Gaps
- Snow particle sizes and counts for Platinum weather. I did not find the weather renderer.
- Print model size in px. The models are binary assets.
- HeartGold footprint code and Gen 5. Not read.
- Overworld sprite frame size (I recall 32x32 [U]) and the 30 fps rate [U].

"See it in action": https://bulbapedia.bulbagarden.net/wiki/Sinnoh_Route_217 (may block bots)

---

## Q5. Teardown table

Only rows with at least one sourced cell are in the table. Tile and character sizes marked [U] are from memory.

| Game | Tile px | Character px | Internal resolution | Snow ground | Footprints | Falling snow | Sink or slowdown | See it in action |
|---|---|---|---|---|---|---|---|---|
| Tibia | 32 [C] | 32x32 sprite [U] | 480x352, 15x11 tiles [C] | Hand-drawn ground items, about 60 snow ids [C] | Yes. Whole-tile swap, 15 footprint ids, 10 s, no direction, players only [C] | None found in client code [C, 3 files] | Tile speed only (VFX #1 S12) | https://tibia.fandom.com/wiki/Tiles |
| RPG Maker MV | 48 [C] | 48x48 [C] | 816x624, 17x13 tiles [C] | A2 autotile, 6 source tiles, 48 shapes [C] | None in core | Up to 90 sprites, 9x9 px circle, 2.94 px/frame, fade over 40 to 60 frames [C] | None | https://github.com/rpgtkoolmv/corescript/blob/master/js/rpg_core/Weather.js |
| RPG Maker VX Ace | 32 [U] | 32x32 [U] | 544x416 [U] | A2 autotile [U] | None in core [U] | 6x6 px bitmap, x - 1, y + 3, opacity - 12 per update [S] | None | https://www.rpgmaker.net/articles/1356 |
| Stardew Valley 1.5.4 | 16, drawn at 4x [C] | 16x32 [C for NPCs] | 1280x720 window, 320x180 art px [C] | Season tilesheet swap (VFX #1 S16) | None [C] | Tiled 16x16 overlay, 16 frames at 75 ms, about 273 draws. Plus 16 to 63 debris of 4x4 px at 3x [C] | None. Step sound changes [C] | https://stardewvalleywiki.com/Winter |
| Pokémon Platinum | 16 units [C] | 32x32 frame [U] | 256x192 [U] | Static map, 5 snow tile types [C] | Yes. 4 directions plus 6 bike shapes, 32 frames (16 hold, 16 fade), on the tile just left [C] | Two weather levels, by calendar [C]. Particles not read | Sink 12 / 14 / 16 units. 8 / 16 / 32 frames per tile [C] | https://bulbapedia.bulbagarden.net/wiki/Sinnoh_Route_217 |
| Pokémon HeartGold | 16 units [U] | 32x32 frame [U] | 256x192 [U] | One snow tile type [C] | Not read | `WEATHER_SNOW` [C] | No deep tiers in constants [C] | https://bulbapedia.bulbagarden.net/wiki/Snow_tile |
| Pokémon Emerald (from VFX #1) | 16 | 16x32 | 240x160 | Static tiles | About 57 frames | 16 sprites of 8x8 px | None | https://github.com/pret/pokeemerald/blob/master/src/field_weather_effect.c |
| Ragnarok Online, via roBrowser | 3D map, 1 cell = 5 world units [C comment] | 2D sprites on 3D [U] | 3D | Baked map textures [U] | None [U] | 2 flakes per 25 ms tick, life 320 ticks (8 s), fall 0.1 cell per tick, spawn 18 to 22 cells up, scatter radius 60 cells, fade-in 10 ticks, fade-out in last fifth [C] | None [U] | https://github.com/MrAntares/roBrowserLegacy/blob/master/src/Renderer/Effects/SnowWeather.js |
| CrossCode | 16 [U] | about 32 tall [U] | 568x320 [S, PCGamingWiki mirror] | Static tiles [U] | Unknown | Unknown | Unknown | https://www.tcrf.net/CrossCode |
| Chained Echoes | Unknown | Unknown | 640x360 [S, PCGamingWiki mirror] | Unknown | Unknown | Unknown | Unknown | https://gamecytus.netlify.app/host-https-www.pcgamingwiki.com/wiki/Chained_Echoes |

Notes on the table
- **Ragnarok, steady state [I].** 2 flakes per tick for a life of 320 ticks gives about 640 live flakes around the player. Fall speed is 4 cells per second. The file says its constants were matched to the original client. rAthena turns snow on per map with the `snow` mapflag: https://github.com/rathena/rathena/blob/master/doc/mapflags.txt
- **Chained Echoes at 640x360** is the one sourced game on Asterion's exact canvas. I found nothing on its snow.

Not sourced at all (budget): Eastward, Sea of Stars (one article says "16:9" with no pixel count), Graveyard Keeper, Moonlighter, Kynseed, Graal Online, Chrono Trigger, Secret of Mana, EarthBound, A Link to the Past, The Minish Cap. From memory [U]: the four SNES games run at 256x224 with 16 px tiles and use static snow tiles with no prints. Chrono Trigger's Death Peak pushes the player with wind gusts. Minish Cap runs at 240x160. A decompilation exists for Minish Cap (https://github.com/zeldaret/tmc) and would be the next place to look.

---

## Q6. Patterns across the games

### Takeaway
No sourced game at this size has per-pixel ground snow. Snow depth, where it exists, is one value per tile. Prints are one stamp per tile step. Big flakes are 3/16 of a tile in three separate engines. Flake counts follow tiles, not pixels.

### Cited patterns (each built from [C] items above)
- **Ground snow is always tiles.** Tibia uses ground items, RPG Maker uses A2 autotiles, Stardew swaps the tilesheet, Platinum uses map tiles with a behaviour byte. None stores depth per pixel.
- **Dynamic state is per tile and has 2 to 4 levels.** Tibia has 2 states per tile (clean, walked). Platinum has 4 static levels (shallow, deep, deeper, deepest).
- **Prints belong to the tile just left.** Tibia fires on `StepOut`. Platinum reads the previous x and z. Neither uses walk-cycle contact frames.
- **Print lifetime splits by platform.** Handhelds use about 1 s (Platinum 32 frames, Emerald 57). The MMO uses 10 s.
- **Flakes fade in the air.** RPG Maker respawns a flake when its opacity drops under 40. roBrowser fades in the last fifth of life. Neither draws a landing.
- **Big flake size is 0.1875 tile.** MV 9 / 48, VX Ace 6 / 32 [S], Stardew debris 12 / 64.
- **Flake density per tile.** RPG Maker 0.41 at full power, Stardew debris 0.07 to 0.28, Emerald 0.11 (16 flakes over 150 tiles).

### Inferences for Asterion (32 px tiles, 24x32 characters, 640x360 = 225 tiles)
- **Per-pixel depth would be new at this size [I].** The VFX #1 engine does something no sourced game does. That is a reason to keep it for the look, and a reason to keep a per-tile fallback, because per-tile is what ships.
- **Big flake size [I].** 0.1875 x 32 = 6 px. That fits a near layer. A 1 px flake on a 32 px tile is 0.03 tile, six times smaller than what these games use. VFX #1's 1 to 2 px flakes on 8 px tiles were 0.125 to 0.25 tile, so they already matched this ratio. To keep the same look at 32 px, the near layer should grow to about 4 to 6 px and the far layers to 2 to 3 px.
- **Flake count [I].** At 0.1 to 0.4 per tile, 225 tiles need 25 to 90 big flakes. VFX #1 used 456 flakes on 900 tiles, 0.5 per tile. Keeping that density per tile gives about 114 flakes. Multiplying by 4 for the pixel count would give 1,824, far above any sourced game.
- **Fall speed [I].** RPG Maker flakes fall 3.7 tiles/s (MV). Stardew debris drifts at 0.5 to 0.6 tiles/s. At 32 px that is a range of 16 to 118 px/s. Slow reads as calm snowfall, fast as a storm.
- **Tiled overlay as the far layer [I].** Stardew's method scales well. One 32x32 or 64x64 texture with 16 frames, scrolled against the camera, costs one draw in a shader and no particle state.
- **Server-owned prints [I].** Tibia's rule is a ready design: a per-tile "walked" flag set on step-out, cleared after 10 s, players only. It costs two small messages per print. The per-pixel prints from VFX #1 can stay local and cosmetic on top.
- **Direction [I].** Platinum needs 4 print sprites for 4 directions. Tibia needs none because the print is baked into the tile. At 32 px a direction-aware boot pair is affordable: 4 sprites.
- **Depth tiers [I].** Platinum's three tiers map well to gameplay: no running, half speed, quarter speed. Sink should be scaled down for a flat 2D view.

### Gaps
- No sourced game gave a footprint size in px.
- No modern 640x360 game (Chained Echoes, Sea of Stars) was torn down. A frame-by-frame look at footage is the only route, and it was out of budget.
- Everything about Gen 5, Graal and the SNES games is unverified.

---

## Gems (open code worth reading)

Licences were read from each repo's LICENSE file where marked [C]. I did not collect star counts.

| Name | URL | Licence | What it gives |
|---|---|---|---|
| The Forgotten Server | https://github.com/otland/forgottenserver | GPL-2.0 [C] | `snow.lua` (14 lines) and `items.xml`. The whole footprint system is a step-out hook, an id offset and a decay timer. |
| Canary | https://github.com/opentibiabr/canary | GPL-2.0 [C] | Same rule with current client ids. Confirms the 10 s. |
| OTClient | https://github.com/edubart/otclient | MIT [C] | `mapview.cpp` shows how a 15x11 view of 32 px tiles is buffered and scaled. |
| RPG Maker MV corescript | https://github.com/rpgtkoolmv/corescript | MIT [C] | `Tilemap.js` has the full 48-entry quarter-tile autotile table. `Weather.js` is a 200-line snow, rain and storm layer. |
| roBrowser Legacy | https://github.com/MrAntares/roBrowserLegacy | GPL-3.0 [C] | `SnowWeather.js` documents the original Ragnarok snow emitter constants. |
| pret/pokeplatinum | https://github.com/pret/pokeplatinum | Decompilation of a commercial game. Read only. | Deep-snow tiers, sink offsets, walk speeds, print lifetime. |
| pret/pokeheartgold | https://github.com/pret/pokeheartgold | Same | One-tier snow for comparison. |
| veywrn/StardewValley | https://github.com/veywrn/StardewValley | Decompiled proprietary code. Read only. | The tiled snow overlay and `WeatherDebris`. |

GPL note: the Tibia server files and roBrowser are GPL. Read them for the design. Do not paste them into Asterion's client.

---

## Scratch files
`scratch-10/` holds the small files I read: `tfs/snow.lua`, `tfs/movements.xml`, `canary/snow.lua`, `otc/const.h`, `otc/mapview.cpp`, `rmmv/Weather.js`, `rmmv/Tilemap.js`, `rmmv/SceneManager.js`, `sdv/veywrn_WeatherDebris.cs`, `ro/SnowWeather.js`. I deleted the two pret clones and the multi-megabyte `items.xml` and `Game1.cs` downloads after reading them. The URLs below fetch them again.

## Sources
1. OTClient `const.h`: https://github.com/edubart/otclient/blob/master/src/client/const.h
2. OTClient `mapview.cpp`: https://github.com/edubart/otclient/blob/master/src/client/mapview.cpp
3. TFS `items.xml`: https://github.com/otland/forgottenserver/blob/master/data/items/items.xml
4. TFS `snow.lua`: https://github.com/otland/forgottenserver/blob/master/data/movements/scripts/snow.lua
5. TFS `movements.xml`: https://github.com/otland/forgottenserver/blob/master/data/movements/movements.xml
6. Canary `snow.lua`: https://github.com/opentibiabr/canary/blob/main/data/scripts/movements/snow.lua
7. Canary `items.xml`: https://github.com/opentibiabr/canary/blob/main/data/items/items.xml
8. RPG Maker MV `Weather.js`: https://github.com/rpgtkoolmv/corescript/blob/master/js/rpg_core/Weather.js
9. RPG Maker MV `Tilemap.js`: https://github.com/rpgtkoolmv/corescript/blob/master/js/rpg_core/Tilemap.js
10. RPG Maker MV `SceneManager.js`: https://github.com/rpgtkoolmv/corescript/blob/master/js/rpg_managers/SceneManager.js
11. RPG Maker MV help, Asset Standards: https://rpgmakerofficial.com/product/MV_Help/page/01_11_01.html
12. RPG Maker MZ help, Asset Standards (not read): https://rpgmakerofficial.com/product/MZ_help-en/01_11_01.html
13. rpgmaker.net, Slip into Ruby part 14 (403, search summary only): https://www.rpgmaker.net/articles/1356
14. Stardew Valley 1.5.4 decompilation, `Game1.cs`: https://github.com/veywrn/StardewValley/blob/master/StardewValley/Game1.cs
15. Same, `WeatherDebris.cs`: https://github.com/veywrn/StardewValley/blob/master/StardewValley/WeatherDebris.cs
16. Same, `FarmerSprite.cs`: https://github.com/veywrn/StardewValley/blob/master/StardewValley/FarmerSprite.cs
17. Same, `Options.cs`: https://github.com/veywrn/StardewValley/blob/master/StardewValley/Options.cs
18. Stardew Valley 1.5.6 decompilation (same snow draw line): https://github.com/WeDias/StardewValley/blob/main/Game1.cs
19. pokeplatinum `fieldmap.h`: https://github.com/pret/pokeplatinum/blob/main/include/constants/fieldmap.h
20. pokeplatinum `map_object_move.c`: https://github.com/pret/pokeplatinum/blob/main/src/map_object_move.c
21. pokeplatinum `player_move.c`: https://github.com/pret/pokeplatinum/blob/main/src/player_move.c
22. pokeplatinum `unk_020655F4.c` (walk speeds): https://github.com/pret/pokeplatinum/blob/main/src/unk_020655F4.c
23. pokeplatinum `ov5_021F1CC8.c` (tracks): https://github.com/pret/pokeplatinum/blob/main/src/overlay005/ov5_021F1CC8.c
24. pokeplatinum `object_event_gfx_data.c`: https://github.com/pret/pokeplatinum/blob/main/src/overlay005/object_event_gfx_data.c
25. pokeplatinum `field_overworld_weather.c`: https://github.com/pret/pokeplatinum/blob/main/src/field_overworld_weather.c
26. pokeheartgold `metatile_behavior.h`: https://github.com/pret/pokeheartgold/blob/master/include/constants/metatile_behavior.h
27. roBrowser Legacy `SnowWeather.js`: https://github.com/MrAntares/roBrowserLegacy/blob/master/src/Renderer/Effects/SnowWeather.js
28. rAthena `mapflags.txt`: https://github.com/rathena/rathena/blob/master/doc/mapflags.txt
29. PCGamingWiki mirror, CrossCode (search summary): https://gamecytus.netlify.app/host-https-www.pcgamingwiki.com/wiki/CrossCode
30. PCGamingWiki mirror, Chained Echoes (search summary): https://gamecytus.netlify.app/host-https-www.pcgamingwiki.com/wiki/Chained_Echoes
31. CrossCode integer scaling patch (search summary): https://github.com/Aemony/CrossCode-IntegerScaling
