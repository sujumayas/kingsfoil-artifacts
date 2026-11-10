# 01 · Roots and classic era: fog, mist, clouds and fog of war in 2D games

Researcher angle: history and the classic era, read from source code and decompilations where possible.
Numbers come from code unless marked "inference" or "estimate". Frame rates are assumed to be 60 fps (GBA is 59.73, SNES NTSC is 60.1).

---

## Q1. How did Gen 3 Pokémon (GBA) draw fog? (pokeemerald)

### Takeaway
GBA fog is a grid of 20 hardware sprites, each 64x64 px, tiled 5 columns by 4 rows (320x256 px) over a 240x160 screen. Hardware alpha blending (BLDALPHA) mixes them in. The fog is locked to the world because each sprite adds the camera offset. It also drifts by a whole pixel every N frames. The fog fades in by stepping the blend coefficients by 1 every few frames, never all at once. Per frame the effect costs a few register writes and 20 OAM position updates. The look comes from one 64x64 4bpp tile and a single blend ratio.

### Cited findings
- Constants: `NUM_FOG_HORIZONTAL_SPRITES 20`, `NUM_FOG_DIAGONAL_SPRITES 20`, `NUM_CLOUD_SPRITES 3`. https://github.com/pret/pokeemerald/blob/master/include/constants/field_weather.h
- Both fog types use OAM `SPRITE_SHAPE(64x64)`, 4bpp, `objMode = ST_OAM_OBJ_BLEND`, priority 2. Sprites are laid out with `x = (i % 5) * 64 + 32` and `y = (i / 5) * 64 + 32`. https://github.com/pret/pokeemerald/blob/master/src/field_weather_effect.c
- Horizontal fog scroll: `if (++fogHScrollCounter > 3) fogHScrollOffset++`, which is 1 px every 4 frames, about 15 px/s, leftward. Position is `(gSpriteCoordOffsetX - fogHScrollOffset) & 0xFF`, so the fog moves with the map and wraps every 256 px. Same file.
- Diagonal fog scroll: X advances 1 px every 3 frames (`> 2`), about 20 px/s. Y advances 1 px every 5 frames (`> 4`), about 12 px/s. Same file.
- Blend targets via `Weather_SetTargetBlendCoeffs(eva, evb, delay)`:
  - Horizontal fog: (12, 8, delay 3). Underwater reuses the code with (4, 16, 0). Fade out: (0, 16, 3).
  - Diagonal fog: (12, 8, delay 8). Fade out: (0, 16, 1).
  - Clouds (Route 120): (12, 8, delay 1).
  Same file.
- `Weather_UpdateBlend` moves EVA or EVB by 1, alternating, each time a frame counter passes `blendDelay`. It writes `REG_OFFSET_BLDALPHA` every frame. https://github.com/pret/pokeemerald/blob/master/src/field_weather.c
- Horizontal fog also tints palettes. `ApplyFogBlend` blends all BG palettes toward a fade colour. Sprite palettes marked by `MarkFogSpritePalToLighten` (max 6) are first pushed 3/4 of the way toward RGB (28,31,28) out of 31: `r += ((28 - r) * 3) >> 2`. Same file (field_weather.c).
- Clouds weather: 3 sprites placed on map coordinates of lower Route 120, moving "1 pixel left every 2 frames" (30 px/s). field_weather_effect.c.
- GBA blend formula: out = min(31, (A·EVA + B·EVB) / 16) per channel. https://problemkaputt.de/gbatek.htm (LCD I/O Color Special Effects)

### Inferences
- Blend (12, 8) is 75% fog plus 50% background, which sums to 125%. The result brightens and washes out toward the fog colour. That gives Gen 3 fog its milky look without a separate white layer.
- Fade-in time (estimate): about 20 to 24 coefficient steps. At delay 3 a step fires every 4 frames, so horizontal fog fades in over about 1.5 s. Diagonal fog at delay 8 takes about 3.5 s. Fade-out at delay 1 takes about 0.7 s. Slow in and fast out reads as weather rolling in.
- Two scroll speeds, 15 px/s and 20/12 px/s, are a usable reference band for drifting fog at 240 px screen width. At our 320 px width, 20 to 27 px/s gives the same screen-relative speed (inference).
- Godot port: one 64x64 tileable texture on a full-screen TextureRect, UV offset by camera position minus drift, mixed at a fixed alpha. That is one texture fetch per pixel and near zero cost (estimate).

### See it in action
- Weather in Pokémon Emerald (Route 119 fog, Route 120 clouds): https://bulbapedia.bulbagarden.net/wiki/Weather (may block bots). Alternative: https://www.youtube.com/results?search_query=pokemon+emerald+route+119+fog

---

## Q2. How did Gen 2 and Gen 3 Pokémon draw darkness and Flash?

### Takeaway
Gen 2 (GBC) has no light circle. A dark cave swaps the whole map to a "darkness" palette set, and Flash swaps it to the night palette. Gen 3 (GBA) draws a true circle of visibility with the hardware window. A table of 8 radii is written per scanline (WIN0H) through an HDMA-style scanline effect. Both are full-screen tricks with no per-pixel maths.

### Cited findings
- pokecrystal `ReplaceTimeOfDayPals`: if map palette is `PALETTE_DARK` and Flash is not active, use `DARKNESS_PALSET`. With Flash it uses `NITE_F` for all four slots. https://github.com/pret/pokecrystal/blob/master/engine/tilesets/timeofday_pals.asm
- The DMG fade table for darkness keeps index 3 bright while dropping most others to 0, so only the brightest shades survive. Same file.
- pokeemerald `sFlashLevelToRadius[] = { 200, 72, 64, 56, 48, 40, 32, 24, 0 }`, with the comment "Smaller flash level -> larger flash radius". Effect params target `REG_WIN0H`. `SetFlashScanlineEffectWindowBoundaries` draws a circle by writing left/right per scanline. https://github.com/pret/pokeemerald/blob/master/src/field_screen_effect.c

### Inferences
- The 8-step radius table (24 to 72 px, then 200 for full light) is a ready-made design for "light radius levels" in 3/4 view. 24 px is under one Tibia tile (32 px), so it would need scaling.
- A hard window edge is "cheap but stark". Study #5 already covers softer dithered pools.

### See it in action
- Pokémon Crystal dark cave and Flash: https://www.youtube.com/results?search_query=pokemon+crystal+dark+cave+flash
- Gen 3 Granite Cave flash circle: https://www.youtube.com/results?search_query=pokemon+emerald+granite+cave+flash

---

## Q3. How did Zelda: A Link to the Past (SNES) do the Lost Woods fog and other overlays? (zelda3 decompilation)

### Takeaway
ALttP puts the fog, canopy, cloud and rain art on BG1 and moves BG1 to the subscreen. Colour math adds it to the main screen at half intensity, a 50/50 average. Lost Woods fog drifts diagonally at 1/8 px per frame (7.5 px/s) and ignores camera parallax. Other overlays scroll at 1/2 or 1/4 of camera speed for parallax. Rain lightning briefly switches the colour math from "add/2" to "add". The screen flashes brighter at no extra art cost.

### Cited findings (all from https://github.com/snesrev/zelda3/blob/master/src/overworld.c)
- `Overworld_LoadOverlays2` sets `CGWSEL_copy = 0x82`, `TM_copy = 0x16`, `TS_copy = 1`. For overlays 0x97, 0x94, 0x93, 0x9D, 0x9E and 0x9F it sets `CGADSUB_copy = 0x72`.
- Overlay choice: screen index `& 0x3f == 0` picks 0x9D, or 0x9E once the Master Sword is taken (code comment: "forest"). Room 0x180 picks 0x97 until the sword is retrieved. 0x9F is "rain" (comment).
- Drift: for 0x97 and 0x9D, BG1VOFS and BG1HOFS each get `+= 0x2000` per frame in 16.16 fixed point. For 0x9C, vertical gets `-= 0x2000` and horizontal follows BG2.
- Parallax: overlays other than 0x97/0x9D add the camera delta shifted right by 1 (half speed). Some IDs (0x95, 0x9E horizontally) shift by 2 (quarter speed).
- Rain: every 4 frames BG1 steps through offsets X {1,0,1,0}, Y {0,17,0,17}. On frame_counter 3 and 88 `CGADSUB = 0x32`, on 5, 44 and 90 back to 0x72, with thunder SFX on 36.
- SNES colour-math register meaning (bit 7 subtract, bit 6 half, bits 0-5 layer enables): https://snes.nesdev.org/wiki/Color_math and https://wiki.superfamicom.org/translucency

### Inferences
- 0x72 = add + half, applied to BG2, OBJ and backdrop. 0x32 = add without halving, which brightens the frame for lightning.
- 0x9D as "Lost Woods fog" and 0x97 as "Master Sword grove fog" are inferred from the code comment and the sword condition, not from a label.
- The fog skips the camera delta but keeps a constant drift, so it reads as a near layer moving independently. The canopy and clouds use half or quarter camera speed and read as depth layers. Both tricks need only an offset per frame.
- A 50% average is strong. It works because the fog art is sparse with transparent gaps, so the average only applies where fog pixels exist.

### See it in action
- Lost Woods fog: https://www.youtube.com/results?search_query=link+to+the+past+lost+woods+fog
- Overlay IDs documented by ROM hackers (ZScream): https://github.com/Zarby89/ZScreamDungeon

---

## Q4. Other SNES/GBA fog and clouds (FF6, Secret of Mana, Chrono Trigger, Minish Cap)

### Takeaway
No disassembly-level numbers were found for these four within budget. All SNES fog in this era uses the same hardware path as ALttP: a BG layer (often BG3 in Mode 1) on the subscreen, plus colour-math add/half, scrolled per frame and sometimes changed per scanline via HDMA. GBA games use BLDALPHA like Pokémon.

### Cited findings
- Colour math blends main and sub screen by add or subtract, optionally halved. Sprites on palettes 0-3 ignore colour math. A fixed colour can tint the whole screen. https://snes.nesdev.org/wiki/Color_math
- Mode 1 with BG3 on the subscreen blended into the main screen is a standard translucency setup. https://forums.nesdev.org/viewtopic.php?t=18549
- Colour math tutorial with examples: https://nesdoug.com/2020/06/16/color-math/

### Gaps
- FF6 Phantom Forest fog and airship cloud layers (Mode 7 plus HDMA), Secret of Mana fog, Chrono Trigger 600 AD fog and Minish Cap clouds all still need specific numbers. Leads: FF6 disassembly by everything8215 (https://github.com/everything8215/ff6), the Minish Cap decompilation (https://github.com/zeldaret/tmc), the Chrono Trigger hacking wiki.

---

## Q5. Classic RTS fog of war: states, tile rules, update rates

### Takeaway
The classic model has 3 states per cell: unexplored (black), explored but not seen (dimmed), and visible. Warcraft I had only shroud. Warcraft II added grey fog over explored terrain that hides units. Engines differ in edge treatment:
- C&C/OpenRA: pre-drawn edge sprites picked by a neighbour bitmask (12 or 47 variants).
- Stratagus: a 4x upscaled alpha mask with blur and easing over 8 steps.
- StarCraft: 32 px vision tiles, a full visibility rebuild every 100 game frames, and instant re-reveal when a unit enters a new tile.
All engines update only on change and never per pixel per frame.

### Cited findings
- Warcraft II: shroud is black, fog is grey. Explored terrain stays visible but enemy troop movements are hidden. https://warcraft.wiki.gg/wiki/Fog_of_war
- First Warcraft had shroud but no fog (fan wiki, treat cautiously). Search summary of https://warcraft.wiki.gg/wiki/Fog_of_War
- OpenRA `Shroud.cs`: `enum ShroudCellType { Shroud, Fog, Visible }` and `CellVisibility { Hidden, Explored, Visible }`. Per-cell `visibleCount` and `passiveVisibleCount` counters. A `touched` flag layer is scanned with vectorized `IndexOf(true)`, so only changed cells resolve ("PERF: Most cells are unchanged"). https://github.com/OpenRA/OpenRA/blob/bleed/OpenRA.Game/Traits/Player/Shroud.cs
- OpenRA `AffectsShroud`: recalculates when the unit changes cell, or moves within a cell by more than `MoveRecalculationThreshold = 256` (WDist, 1024 = one cell, so 1/4 cell). https://github.com/OpenRA/OpenRA/blob/bleed/OpenRA.Mods.Common/Traits/AffectsShroud.cs
- OpenRA `ShroudRenderer`: edges are flags for 4 corners plus 4 sides. The default `Index` has 12 entries (corners only, the TD style). RA and TS mods set `UseExtendedIndex: true` with a 47-entry list. Separate shroud and fog palettes; default `ShroudBlend = Alpha`. https://github.com/OpenRA/OpenRA/blob/bleed/OpenRA.Mods.Common/Traits/World/ShroudRenderer.cs and https://github.com/OpenRA/OpenRA/blob/bleed/mods/ra/rules/world.yaml
- Stratagus `fow.h`: `VisionType { cUnseen=0, cExplored=1, cVisible=2 }`. Types `cTiled`, `cEnhanced` (default), `cTiledLegacy`. Defaults: `NumOfEasingSteps 8`, `BlurRadius {2.0, 1.5}`, `BlurIterations 3`, `ExploredOpacity 0x7F`, `RevealedOpacity 0xBE`, `UnseenOpacity 0xFE`. Each tile is upscaled 4x4 via a 16-entry pattern table from its corner neighbours. The tiled mode uses a 16-frame fog graphic with `TiledFogTable[16]`. https://github.com/Wargus/stratagus/blob/master/src/include/fow.h
- Stratagus `CFogOfWar::Update`: the enhanced pipeline runs one stage per call (generate, upscale 4x4, blur, then wait until eased), spreading the cost across frames. https://github.com/Wargus/stratagus/blob/master/src/map/fow.cpp
- OpenBW (StarCraft: Brood War reimplementation) `process_frame`: `if (update_tiles_countdown == 0) update_tiles_countdown = 100`. On the update frame all tiles get `visible = 0xff` (hidden) and units re-reveal. A unit also refreshes vision when its 32 px tile index changes. Sight lookup arrays go up to range 11 (`max_width = 11*2+3`). Ground units are blocked by 3 height levels. Explored and visible are per-player bitmasks in one byte each. https://github.com/OpenBW/openbw/blob/master/bwgame.h

### Inferences
- StarCraft at "Fastest" runs 42 ms per frame (OpenBW uses `timer_step = 42` for triggers). 100 frames is then about 4.2 s. Fog therefore lingers up to about 4 s behind a unit that left, while new areas reveal instantly. Players read this as "vision lingers". It costs one full rebuild every 100 frames plus cheap per-move reveals.
- Stratagus opacities (50% explored, 75% revealed, about 100% unseen) are a ready default for the three states.
- 12 corner sprites (C&C) suit a 2-bit-per-corner art budget. 47 tiles is the classic 8-neighbour "blob" autotile set, and the same Wang/blob tilesets our PixelLab pipeline can make.
- For a server-authoritative MMO, OpenRA's "touched cells only" plus refcounted visibility is the right shape. Cost scales with moving units, not map size.

### Gaps
- Age of Empires (1997) fog rules and OpenAge implementation were not read. Lead: https://github.com/SFTtech/openage (search "fog" / "visibility").
- Original C&C 1995 shroud-only behaviour was not verified. Lead: EA's released source https://github.com/electronicarts/CnC_Remastered_Collection (search `Map.Sight_From`, `Shroud`).
- Warcraft II tile counts for its fog edges were not found.

### See it in action
- Warcraft II fog: https://warcraft.wiki.gg/wiki/Fog_of_war
- OpenRA (RA mod) shroud edges: https://www.openra.net/
- StarCraft fog: https://liquipedia.net/starcraft/Fog_of_War

---

## Q6. Roguelike remembered tiles: how memory is drawn

### Takeaway
Every major roguelike stores a separate "what the player remembers" copy per cell and draws it darker than live view. Methods differ:
- NetHack: stores the remembered glyph.
- Angband: 4 to 5 lighting states with darker colour or tile variants.
- Brogue: colour multiply plus a blue-tinted average.
- DCSS tiles: a mesh (stipple) overlay icon.
The DCSS mesh is the most pixel-art-native option. It dims by covering pixels, not by alpha.

### Cited findings
- NetHack `rm.h`: `int glyph; /* what the hero thinks is there */`. https://github.com/NetHack/NetHack/blob/NetHack-3.7/include/rm.h
- Angband `cave-map.c`: lighting states `LIGHTING_LOS`, `LIGHTING_TORCH`, `LIGHTING_LIT` (default, used out of view) and `LIGHTING_DARK`. https://github.com/angband/angband/blob/master/src/cave-map.c. `ui-map.c`: torch-affected terrain becomes `ATTR_LIGHT` when torchlit, `ATTR_DARK` 1 step when LIT, 2 steps when DARK. Graphics tiles are indexed per lighting state. https://github.com/angband/angband/blob/master/src/ui-map.c
- Brogue CE: `memoryColor = {25,25,50, 20,20,20}` and `memoryOverlay = {25,25,50}`. Not-visible remembered cells get `applyColorMultiplier(memoryColor)` then `applyColorAverage(memoryOverlay, 25)`. Underwater uses an 80% average to black. Magic-mapped cells use `magicMapColor`. `TM_BRIGHT_MEMORY` skips foreground dimming. https://github.com/tmewett/BrogueCE/blob/master/src/brogue/Globals.c and https://github.com/tmewett/BrogueCE/blob/master/src/brogue/IO.c
- DCSS `tiledgnbuf.cc`: if `TILE_FLAG_UNSEEN`, add icon `TILEI_MESH`. Out of range gets `TILEI_OOR_MESH`, magic-mapped gets `TILEI_MAGIC_MAP_MESH`. https://github.com/crawl/crawl/blob/master/crawl-ref/source/tiledgnbuf.cc

### Inferences
- Brogue's memory colour multiplies by about 25% red, 25% green and 50% blue, then mixes 25% toward the same dark blue. Memory reads as cold and dark blue, not grey. This is a palette-friendly rule: map remembered cells to a "night blue" ramp.
- DCSS's mesh overlay (presumed checkerboard or stipple of dark pixels) is a 1-bit dither fog of war. It costs one extra sprite per remembered cell and keeps hard pixel edges. Strong fit for our pixel art.

### See it in action
- Brogue memory rendering: https://sites.google.com/site/broguegame/ and https://github.com/tmewett/BrogueCE
- DCSS tiles: https://crawl.develz.org/

---

## Q7. Tibia / OTClient: visibility, floors, light and the fog shader

### Takeaway
Tibia has no fog of war. The client knows a fixed rectangle (aware range 8 left, 9 right, 6 up, 7 down, or 18x14 tiles) and shows 15x11. Floors above the player are hidden, and the client fades them over 500 ms. Below ground (z > 7) only floors within ±2 are known. Light is a per-tile light map drawn to a small texture and upscaled with smoothing (study #5). OTClient has an optional "Map - Fog" shader. It adds a scrolling clouds.png at 0.6 strength, with the walk offset compensated so fog stays world-locked. That is one extra texture fetch per pixel.

### Cited findings
- `gameconfig.h`: `m_spriteSize{32}`, `m_mapViewPort{8,6}`, `m_mapMaxZ{15}`, `m_mapSeaFloor{7}`, `m_mapUndergroundFloorRange{2}`, `m_mapAwareUndergroundFloorRange{2}`, `m_tileTransparentFloorViewRange{2}`. https://github.com/opentibiabr/otclient/blob/main/src/client/gameconfig.h
- `Map::resetAwareRange`: left = width, top = height, right = width+1, bottom = height+1. Floors: if z ≤ sea floor, first aware floor is 0. Otherwise it is z − 2. https://github.com/opentibiabr/otclient/blob/main/src/client/map.cpp
- `mapview.h`: `m_floorFading = 500` (ms), and fade level = elapsed / m_floorFading clamped to 0..1. Floor view modes: NORMAL, FADE, LOCKED, ALWAYS, ALWAYS_WITH_TRANSPARENCY. https://github.com/opentibiabr/otclient/blob/main/src/client/mapview.h and https://github.com/opentibiabr/otclient/blob/main/src/client/const.h
- `lightview.cpp`: light texture sized to the map in tiles with `setSmooth(true)`. Light sources merge when at the same position and colour. https://github.com/opentibiabr/otclient/blob/main/src/client/lightview.cpp
- `fog.frag`: `direction = vec2(1.0, 0.3)`, `speed = 0.05`, `pressure = 0.6`. `col = bgcol + fogcol * pressure` (additive), UV offset by `u_WalkOffset`. Registered as "Map - Fog" with `tex1 = 'images/clouds'`. https://github.com/opentibiabr/otclient/blob/main/modules/game_shaders/shaders/fragment/fog.frag and https://github.com/opentibiabr/otclient/blob/main/modules/game_shaders/shaders.lua

### Inferences
- Additive fog brightens dark pixels and can clip highlights. For palette art a "mix toward fog colour" is safer, as in Gen 3's 12/8 blend.
- Tibia's floor rule (hide everything above, fade over 500 ms) is how a 3/4-view MMO avoids fog of war entirely. Visibility is "your screen rectangle plus floor rules", decided by the server's spectator range.

### Gaps
- Whether official Tibia has area fog or weather effects was not confirmed (wikis block bots).

---

## Q8. Other MMOs: Ultima Online and RuneScape/OSRS

### Takeaway
UO sends everything within 18 tiles and darkens with a global light level (0 day, 12 night, 26 dungeons), ramped over 2 game hours at dawn and dusk. OSRS loads a 104x104 tile scene. The RuneLite GPU plugin draws up to 184 tiles (default 50) with linear fog that starts a set distance from the scene edge. In both games "fog" is a distance cutoff, not weather.

### Cited findings
- ServUO `Map.cs`: "By default, a constant range of 18 is used" (`Core.GlobalMaxUpdateRange`). https://github.com/ServUO/ServUO/blob/master/Server/Map.cs
- ServUO `LightCycle.cs`: `DayLevel = 0`, `NightLevel = 12`, `DungeonLevel = 26`, `JailLevel = 9`. Dawn and dusk interpolate over 120 game minutes. https://github.com/ServUO/ServUO/blob/master/Scripts/Misc/LightCycle.cs
- RuneLite GPU: `MAX_DISTANCE = 184`, `MAX_FOG_DEPTH = 100`, default `drawDistance 50`, `fogDepth 0` ("Distance from the scene edge the fog starts"). Vertex shader uses `fogFactorLinear` with scene edges `104 + expandedMapLoadingChunks*8` tiles and `FOG_CORNER_ROUNDING 1.5`. Fragment does `mix(c.rgb, fogColor.rgb, fFogAmount)`. https://github.com/runelite/runelite/blob/master/runelite-client/src/main/java/net/runelite/client/plugins/gpu/GpuPlugin.java and https://github.com/runelite/runelite/blob/master/runelite-client/src/main/resources/net/runelite/client/plugins/gpu/vert.glsl

### Gaps
- Vanilla OSRS (non-GPU) draw distance (often quoted as 25 tiles) was not verified in code.
- Albion and Lineage were not researched.

---

## Cross-cutting numbers players notice (summary table)

| Effect | Unit | Speed / rate | Blend | Source |
|---|---|---|---|---|
| Emerald fog horizontal | 20 × 64x64 OBJ | 1 px / 4 frames (~15 px/s) | EVA 12 / EVB 8 | pokeemerald |
| Emerald fog diagonal | 20 × 64x64 OBJ | X 1/3, Y 1/5 px per frame (~20, ~12 px/s) | 12 / 8, fade delay 8 | pokeemerald |
| Emerald clouds | 3 sprites | 1 px / 2 frames (30 px/s) | 12 / 8 | pokeemerald |
| Emerald Flash | WIN0 per scanline | 8 radii, 24 to 72 px, 200 = full | hard window | pokeemerald |
| Crystal darkness | palette swap | instant | none | pokecrystal |
| ALttP Lost Woods fog | BG1 on subscreen | 1/8 px per frame diag (7.5 px/s), no parallax | add/2 (50%) | zelda3 |
| ALttP canopy/clouds | BG1 | 1/2 or 1/4 camera speed | add/2 | zelda3 |
| ALttP lightning | colour math | frames 3, 88 of a 256-frame cycle | add (no half) | zelda3 |
| StarCraft vision | 32 px tiles | full rebuild every 100 frames; tile-change reveal | 3 states | OpenBW |
| OpenRA shroud | cell | touched cells only, 1/4-cell move threshold | 12 or 47 edge sprites | OpenRA |
| Stratagus fog | tile → 4x4 alpha | blur r 2.0, 3 iter, 8 easing steps | 50% / 75% / ~100% | Stratagus |
| Brogue memory | cell colour | n/a | ×(25,25,50)% then 25% avg | BrogueCE |
| DCSS memory | 32 px tile | n/a | mesh overlay icon | crawl |
| OTClient floors | floor | 500 ms fade | opacity | OTClient |
| OTClient fog shader | screen | dir (1,0.3) × 0.05 | additive 0.6 | OTClient |
| UO light | global | 120 game-min ramps | levels 0/12/26 | ServUO |

## Gaps (overall)
- FF6, Secret of Mana, Chrono Trigger, Minish Cap: no code-level numbers yet.
- Age of Empires and C&C 1995 originals: not read in source.
- I could not view the fog tile art (fog_horizontal.png, DCSS mesh.png). Descriptions of their look are inference.

## Sources
- https://github.com/pret/pokeemerald/blob/master/src/field_weather_effect.c
- https://github.com/pret/pokeemerald/blob/master/src/field_weather.c
- https://github.com/pret/pokeemerald/blob/master/include/constants/field_weather.h
- https://github.com/pret/pokeemerald/blob/master/src/field_screen_effect.c
- https://github.com/pret/pokecrystal/blob/master/engine/tilesets/timeofday_pals.asm
- https://problemkaputt.de/gbatek.htm
- https://github.com/snesrev/zelda3/blob/master/src/overworld.c
- https://snes.nesdev.org/wiki/Color_math
- https://wiki.superfamicom.org/translucency
- https://nesdoug.com/2020/06/16/color-math/
- https://forums.nesdev.org/viewtopic.php?t=18549
- https://warcraft.wiki.gg/wiki/Fog_of_war
- https://github.com/OpenRA/OpenRA/blob/bleed/OpenRA.Game/Traits/Player/Shroud.cs
- https://github.com/OpenRA/OpenRA/blob/bleed/OpenRA.Mods.Common/Traits/World/ShroudRenderer.cs
- https://github.com/OpenRA/OpenRA/blob/bleed/OpenRA.Mods.Common/Traits/AffectsShroud.cs
- https://github.com/OpenRA/OpenRA/blob/bleed/mods/ra/rules/world.yaml
- https://github.com/Wargus/stratagus/blob/master/src/include/fow.h
- https://github.com/Wargus/stratagus/blob/master/src/map/fow.cpp
- https://github.com/OpenBW/openbw/blob/master/bwgame.h
- https://github.com/NetHack/NetHack/blob/NetHack-3.7/include/rm.h
- https://github.com/angband/angband/blob/master/src/cave-map.c
- https://github.com/angband/angband/blob/master/src/ui-map.c
- https://github.com/tmewett/BrogueCE/blob/master/src/brogue/Globals.c
- https://github.com/tmewett/BrogueCE/blob/master/src/brogue/IO.c
- https://github.com/crawl/crawl/blob/master/crawl-ref/source/tiledgnbuf.cc
- https://github.com/opentibiabr/otclient/blob/main/src/client/gameconfig.h
- https://github.com/opentibiabr/otclient/blob/main/src/client/map.cpp
- https://github.com/opentibiabr/otclient/blob/main/src/client/mapview.h
- https://github.com/opentibiabr/otclient/blob/main/src/client/lightview.cpp
- https://github.com/opentibiabr/otclient/blob/main/modules/game_shaders/shaders/fragment/fog.frag
- https://github.com/opentibiabr/otclient/blob/main/modules/game_shaders/shaders.lua
- https://github.com/ServUO/ServUO/blob/master/Server/Map.cs
- https://github.com/ServUO/ServUO/blob/master/Scripts/Misc/LightCycle.cs
- https://github.com/runelite/runelite/blob/master/runelite-client/src/main/java/net/runelite/client/plugins/gpu/GpuPlugin.java
- https://github.com/runelite/runelite/blob/master/runelite-client/src/main/resources/net/runelite/client/plugins/gpu/vert.glsl
