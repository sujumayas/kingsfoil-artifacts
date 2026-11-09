# 01 — History & classic era: snow in 2D / top-down games (8-bit to early 2000s, plus classic-style sims)

Researcher angle: oldest and simplest approaches first. Everything under "Cited findings" has a URL. Everything under "Inferences" is my reading of it and has not been verified.
Budget note: about 45 tool calls used, which is over the 25–35 target, mostly spent reading decomp source. The decompiled source gave the most reliable numbers.

---

## Q1. How did 8/16-bit and early PC games draw falling snow cheaply?

### Takeaway
Four cheap families, from cheapest to most expensive:
1. **Palette / colour cycling.** Flakes are painted into the background art as "paths" of palette indices. Rotating the palette makes a contrasting dot run along each path. No per-flake CPU work at all (Mark Ferrari, Living Worlds / Canvas Cycle).
2. **A fixed small pool of hardware sprites** with integer fall speed and a sine-table sway. Flakes are recycled and wrap at the screen edges. Pokémon Emerald uses **16 sprites of 8×8 px**.
3. **A scrolling overlay background layer.** SNES BG3 was used for full-screen overlays such as fog and HUD. Weather on BG3 is plausible, but I did not confirm a specific game.
4. **Sprite multiplexing.** Rewrite sprite table entries mid-frame to beat hardware limits. A Mega Drive prototype shows 74 snow sprites when the limit is 80 sprites per frame.

### Cited findings
- **Pokémon Emerald (GBA, 2004), decomp `pret/pokeemerald`.**
  - `NUM_SNOWFLAKE_SPRITES = 16` (https://github.com/pret/pokeemerald/blob/master/include/constants/field_weather.h). For comparison, `MAX_RAIN_SPRITES = 24`.
  - Snowflakes are **8×8, 4bpp OAM sprites** with **2 tile variants** (`snow0.png`, `snow1.png`). Each sprite is randomly given one of the two frames.
  - Flakes are added or removed **one at a time every 36 frames** until the target count is reached. Snow therefore fades in and out over about 16×36 = 576 frames (about 9.6 s).
  - Per-flake state lives in 8 `data[]` shorts:
    - `tPosY` is fixed-point ×128.
    - `tDeltaY = (rand&3)*5 + 64` gives a fall speed of 64–79/128 px per frame, i.e. **about 0.5–0.62 px/frame**.
    - Sway: `x2 = gSineTable[tWaveIndex]/64`. `tWaveIndex` advances 1 or 2 per frame (1 in 4 flakes get 2) and wraps at 256.
    - Spawn column: `((id*5)&7)*30 + rand%30` spreads flakes across 8 columns 30 px wide, which avoids clumping.
    - Lifetime `tFallDuration = (rand&0x1F)+210`, i.e. 210–241 frames, after which the flake respawns at the top.
    - Horizontal wrap at x < -3 or x > 242. The screen is 240 px wide.
  - Source: https://github.com/pret/pokeemerald/blob/master/src/field_weather_effect.c (search "Snow").
- **Mega Drive / Genesis, *Stone Protectors* (unreleased prototype).** "The snow ... was created by making changes to the sprite attribute table mid-frame."
  - Count: 118 sprites on screen (74 snow) against a VDP limit of **80 sprites per frame**.
  - **3 layers, 5 sizes.** Within a layer, no two flakes share a scanline, and flakes are spaced about **8 lines** apart.
  - Three sprite entries are rewritten every 8 scanlines, and per-frame vertical shift sets the fall speed.
  - Source: https://rasterscroll.com/mdgraphics/graphical-effects/sprite-raster-effects/
- **Mark Ferrari colour cycling (Living Worlds; HTML5 port "Canvas Cycle" by Joe Huckaby, 2010).** From the Q&A with Ferrari (effectgames, via mirror https://dcmpx.remotevs.com/com/effectgames/www/PL/effect/article-Q_A_with_Mark_J_Ferrari.html):
  - Each flake is "a dot or dash of noticeably contrasting color on a long 'path'". The path's colours match the background it crosses, so the path itself is invisible.
  - Paths are painted with no dither, as "solid, straight-edged bands of color".
  - In the sunny variant the rain/snow paths are removed from the art, not hidden. Their palette rows are reused for rainbows or stars.
  - Gradients of identical length and speed produce a "pulsing flash". Varying cycle lengths and speeds looks organic.
  - The palette is one 256-colour palette and the image is a single flat layer (https://monochrom.at/blog/?p=11592). Effects listed include rain, snow, fog, clouds, smoke and waterfalls.
  - See it in action: https://experiments.withgoogle.com/canvas-cycle ; original demo http://www.effectgames.com/demos/canvascycle/ (the original URL was blocked for direct fetch here). Code mirror: https://gh.r-mj.com/icockrum/canvascycle
- **SNES BG3.**
  - Layer 3 is 2bpp in Modes 0/1.
  - In Super Mario World it carries the HUD, message boxes and **Ghost House mist**, a full-screen weather-like overlay. Lunar Magic has an option to force Layer 3 above all layers.
  - Source: https://sneslab.net/wiki/BG3

### Inferences
- The Emerald recipe (16 flakes, 0.5 px/frame, ±4 px sine sway, 8 spawn columns) is close to the minimum viable top-down snowfall. At 240×160 it reads as snow, not as "a few dots". In Godot this is trivial (`MultiMeshInstance2D` or a 16–64 element array). The 36-frame ramp is a free "it starts snowing" transition.
- Sway amplitude is `gSineTable/64`. If the table peaks near 256 (standard on GBA), sway is about ±4 px. The table's peak value is not verified.
- Colour cycling is the most "DOOM-fire-like" option because it is pure index arithmetic. It does need the art authored for it and costs palette rows. In Godot it maps to a palette-index texture plus a shader that offsets indices within ranges.
- Layered parallax snow in top-down: the Stone Protectors split into 3 layers with different sizes and speeds is the classic way to fake depth. In a top-down view, near layers should be larger and faster and drift more with camera movement.

### Gaps
- I did not confirm which SNES RPGs (FF6 Narshe, Chrono Trigger 12000 BC, EarthBound Winters) put snow on BG3 versus sprites. A SNES debugger or layer viewer would settle it.
- No C64/Amiga snow write-up found.
- No HDMA snow example found.

---

## Q2. Snow as tiles and states in classic top-down games

### Takeaway
Classic games almost never simulate snow. They **author snow as a tile type** with gameplay flags (slow, no bike, no run) and swap whole tilesets per season. The first real per-cell simulations appear in top-down colony sims (RimWorld, a hidden 0–1 depth per cell).

### Cited findings
- **Pokémon Gen IV (Diamond/Pearl/Platinum, 2006–08).** Snow tiles on Route 216, Route 217, Acuity Lakefront, Snowpoint City and Mt. Coronet. There are 4 sinking depths:
  1. minimal: no effect
  2. moderate: no running
  3. heavy: no running and **walking speed halved**
  4. maximum: no running and **walking at 1/4 speed**

  The bike cannot be used on any snow depth. HGSS has snow tiles at Mt. Silver Cave and the Sinjoh Ruins. In X/Y (Route 17), snow is crossed only by riding Mamoswine.
  Source and see it in action: https://bulbapedia.bulbagarden.net/wiki/Snow_tile ; https://bulbapedia.bulbagarden.net/wiki/Sinnoh_Route_216
- **RimWorld (2013–).** Snow depth is "an internal value, measured from 0% to 100%, hidden from the player". It accumulates only on **unroofed** cells and never on water or marsh. Snowy weather happens at **≤ −0.5 °C**.

  | Weather | Snow rate | Move speed |
  |---|---|---|
  | Gentle snow | 120% | 100% |
  | Hard snow | 80% | 80% |

  | Snow level | Depth | Move speed |
  |---|---|---|
  | Dusting | 3–25% | 100% |
  | Thin | 25–50% | 76% |
  | Medium | 50–75% | 62% |
  | Thick | 75%+ | 52% |

  Melting per tick:
  - at or below 0 °C: 0
  - 0–10 °C: 0.058% × T² per tick
  - ≥10 °C: 0.58% × T per tick (the two formulas agree at T = 10)

  Snow is also removed by fire, steam geysers, lightning, and colonists working a **Snow Clear Zone**. Snowmen can be built for recreation.
  Source: https://rimworldwiki.com/wiki/Snow ; https://rimworldwiki.com/wiki/Snow_(thick)
- **Tibia (CipSoft, 1997–).**
  - TibiaWiki lists "Snow" and "Snow (Footsteps)" as separate tiles: "When walking through snow, you will leave your footprints."
  - Tile speed values ("friction"): snow **160**, ice **100**, ice floor 90. Lower is faster: "You move very quickly when walking on ice."
  - Snow can show decorative "Yeti tracks".
  - Source and see it in action: https://tibia.fandom.com/wiki/Tiles
- **Ultima Online (1997).**
  - Seasons are handled client-side via season packet 0xBC (a hedged forum answer).
  - The winter map was criticised as patchy, using "square snow tiles" with jagged edges at roads, even though softer-edged transition tiles exist in the art files.
  - Source: https://www.forums.polserver.com/viewtopic.php?p=19410
  - Seasonal changes were revisited for UO New Legacy (2020): https://ultimacodex.com/2020/10/ultima-online-new-legacy-announced-will-feature-seasonal-changes/
- **Zelda: Oracle of Seasons (GBC, 2001).** In winter, snow appears in several overworld areas and often blocks Link's path. Piled mounds create passages, water freezes so it can be walked on, and trees lose leaves, which changes their footprint. Swinging the Rod of Seasons on a stump swaps an area's whole season. Source and see it in action: https://www.zeldadungeon.net/wiki/Winter
- **Dwarf Fortress.** Winter brings snowstorms ("A snow storm has come.") and outdoor water freezes into ice walls. Ponds thaw back to a full 7/7 depth after winter. Dwarves can freeze to death outdoors. `[WEATHER:NO]` disables weather to improve FPS on older machines. Source: https://dwarffortresswiki.org/index.php/v0.34:Snow
- **Stardew Valley (2016, classic-style).**
  - Vanilla winter paths "were shifted to a slightly bluer color", which motivated the "Snowy Paths" texture mod (https://www.curseforge.com/stardewvalley/mods/snowy-paths).
  - The game's outdoor tilesheets carry season-prefixed names such as `spring_outdoorsTileSheet.png` and `spring_town.png` (https://stardewvalleywiki.com/Modding:Maps). Seasonal furniture uses horizontally adjacent spring/summer/fall/winter sprites (same page, "is seasonal" field).

### Inferences
- **The Pokémon 4-level depth plus RimWorld's 4 named levels** together suggest a robust design: store depth as a byte, quantise to about 4 visual and gameplay bands, and use speed multipliers of roughly 1.0 / 0.75 / 0.5 / 0.25–0.5.
- Tibia's approach (snow is just a slower ground tile with speed 160) is the baseline for a Tibia-like game. Anything beyond it is the "alive world" upgrade.
- Stardew's season swap is a whole-tilesheet replacement keyed by season name. This is likely the approach of Harvest Moon (SNES, 1996) too, but that is unverified.

### Gaps
- RimWorld's base accumulation rate per tick and its rendering are not on the wiki. I believe it uses a section-mesh overlay with vertex alpha from depth (the `SectionLayer_Snow` name), but I did not verify this.
- Diablo II Act V (Harrogath, Frigid Highlands), FF6 Narshe, Chrono Trigger, EarthBound, Secret of Mana Ice Country and Gen 2 Ice Path were not verified in this session. Unverified pages to check: https://diablo.fandom.com/wiki/Act_V , https://bulbapedia.bulbagarden.net/wiki/Ice_Path
- I did not find the exact formula that turns Tibia's tile "friction" or ground speed into step time.

---

## Q3. Footprints in classic 2D games: persistence and drawing method

### Takeaway
Three classic implementations, all cheap:
- **(a) Short-lived sprite.** Pokémon Gen 3: about 57 frames, then gone.
- **(b) Short-lived alpha-fading 3D decal with direction variants.** Pokémon Gen 4: about 32 frames.
- **(c) Tile state swap with a decay timer.** Tibia: snow item becomes a footprint item and reverts after about 10 s.

None are permanent. Persistence was traded away for a hard cap on objects.

### Cited findings
- **Pokémon Emerald (GBA): footprints are OAM sprites.**
  - Placement: `DoTracksGroundEffect_Footprints` spawns `FLDEFF_SAND_FOOTPRINTS` or `FLDEFF_DEEP_SAND_FOOTPRINTS` at the **previous** tile. The sprite animation is chosen from facing direction.
  - Bike tire tracks use a **4×4 transition table** that picks one of 8 track pieces (straight and curves) from the old and new direction.
  - Fade: `FadeFootprintsTireTracks_Step0` waits **40 frames** visible. `Step1` toggles `invisible ^= 1` every frame (flicker fade) until the timer passes **56**, then frees the sprite. Total about 57 frames (~0.95 s at 59.7 Hz).
  - If no sprite is free (`MAX_SPRITES`), the footprint is simply not created.
  - Sources: https://github.com/pret/pokeemerald/blob/master/src/field_effect_helpers.c ; https://github.com/pret/pokeemerald/blob/master/src/event_object_movement.c
  - Related "trample" effect, Route 113 ash: `FldEff_Ash` waits a delay, then calls `MapGridSetMetatileIdAt(...)` to permanently replace the ash-covered grass metatile with clean grass and plays a puff animation. This is a tile-swap "trail" that persists until the map reloads. Same file as above.
- **Pokémon Platinum (DS): `foot_tracks_snow_{up,down,left,right}` and `bike_tracks_snow_{vertical,horizontal,upper_left,upper_right,lower_left,lower_right}`.** That is 10 models for snow and a matching 10 for sand.
  - Lifecycle: start alpha **31** (the DS 5-bit max). Hold **16 frames**, then alpha −= 2 per frame until < 0 (~16 frames). Total about 32 frames.
  - The model is drawn with `NNS_G3dMdlSetMdlAlphaAll`, i.e. a real alpha fade, not flicker.
  - The track is spawned at the previous tile with Y/Z offsets of −8 to −10 px.
  - Source: https://github.com/pret/pokeplatinum/blob/main/src/overlay005/ov5_021F1CC8.c
- **Tibia / OpenTibia.** The snow tile (item 670) becomes footprint item 6594 when a player leaves the tile (`onStepOut`). Existing trail tiles 6580–6593 become ID+15 (6595–6608), so footprints overlay prior trails. Each has `duration` **10 s** and `decayTo` the previous state. The community author claims 10 s "matches real Tibia", replacing an earlier 30 s. This is a community claim and is not verified against CipSoft. Source: https://otland.net/threads/8-0-snow-footsteps-fix.189116/

### Inferences
- **Pattern for a Godot Tibia-like:** use the Tibia/Emerald hybrid.
  - Per-cell footprint state as a small int with a decay timestamp. No per-frame cost; check expiry lazily or in a coarse 1 Hz sweep.
  - 4 directional variants plus bike/cart corner pieces from a transition table (Emerald's 4×4).
  - Fade the last ~25% of the lifetime by dithered alpha, which is more pixel-art-friendly than smooth alpha. Emerald's flicker is the 1-bit version.
- Classic lifetimes (~0.5–1 s in Pokémon, ~10 s in Tibia) are far shorter than "alive world" persistence. For an MMORPG, 10–60 s or until-snowfall-covers is a taste decision. Classic games chose short lifetimes because of sprite caps, not because of how it felt.
- The ash mechanic is the best classic precedent for "plowed path persists". Walking permanently converts a covered tile into an uncovered one, and that is cheap because it is one tile write.

### Gaps
- I did not find timing data for footprint persistence in HGSS or Gen 4 deep-snow versus shallow-snow tracks.
- I found no evidence of persistent snow trails in Diablo II, UO or SNES RPGs.

---

## Q4. Seasonal transitions / gradual cover

### Takeaway
The classic era used **instant tileset swaps**:
- Oracle of Seasons: per area, triggered by a rod.
- UO: client season packet.
- Stardew: tilesheet per season.

Gradual cover only appears with per-cell depth (RimWorld) or in a time-ramped particle count (Emerald, 36-frame steps). I found no classic game that gradually whitened ground tiles.

### Cited findings
- Oracle of Seasons rod swap: https://www.zeldadungeon.net/wiki/Winter
- UO 0xBC client-side seasons, with jagged square snow tiles: https://www.forums.polserver.com/viewtopic.php?p=19410
- RimWorld continuous depth, melt as a function of T: https://rimworldwiki.com/wiki/Snow
- Emerald particle ramp: https://github.com/pret/pokeemerald/blob/master/src/field_weather_effect.c

### Inferences
- A cheap bridge between swap and simulation: keep the season tileset swap for trees and buildings, and drive ground with a per-cell depth byte. Show it through about 4 overlay frames (dusting / thin / medium / thick, mirroring RimWorld's bands) with autotile edges. The UO complaint shows that edge or transition tiles are what make snow look good.

---

## Q5. Concrete numbers

| Game | Number | Source |
|---|---|---|
| Pokémon Emerald | 16 snow sprites of 8×8 4bpp; +1 per 36 frames; 0.5–0.62 px/frame fall; 210–241 frame life | pokeemerald field_weather_effect.c, constants/field_weather.h |
| Pokémon Emerald | footprint 40 frames solid + ~16 frames flicker | pokeemerald field_effect_helpers.c |
| Pokémon Platinum | track alpha 31, 16-frame hold, −2 per frame; 10 track models per surface | pokeplatinum ov5_021F1CC8.c |
| Pokémon Gen IV | snow speed ×1, no-run, ×0.5, ×0.25; no bike | Bulbapedia Snow tile |
| RimWorld | depth 0–100%; move 100/76/62/52%; melt 0.058%·T² (0–10 °C), 0.58%·T (≥10 °C) per tick; snows at ≤ −0.5 °C | RimWorld wiki Snow |
| Tibia (OT) | footprint decay 10 s; snow speed 160 vs ice 100 | OTLand thread; TibiaWiki Tiles |
| Stone Protectors (MD) | 74 snow sprites via multiplexing vs 80 limit; 3 layers, 5 sizes, 8-line spacing | rasterscroll.com |
| Ferrari colour cycling | single 256-colour palette, flat image, no layers | monochrom.at; Ferrari Q&A |

---

## Game examples with "see it in action" URLs

1. Pokémon Emerald: snow weather and sand/ash footprints. https://github.com/pret/pokeemerald/blob/master/src/field_weather_effect.c
2. Pokémon Diamond/Pearl/Platinum: snow tiles with sinking depths and snow foot/bike tracks. https://bulbapedia.bulbagarden.net/wiki/Snow_tile ; https://bulbapedia.bulbagarden.net/wiki/Sinnoh_Route_216
3. Pokémon HeartGold/SoulSilver: Mt. Silver snow tiles. https://bulbapedia.bulbagarden.net/wiki/Snow_tile
4. Pokémon X/Y: Route 17 snow crossed by Mamoswine. https://bulbapedia.bulbagarden.net/wiki/Snow_tile
5. RimWorld: per-cell depth, melt and clear zones. https://rimworldwiki.com/wiki/Snow
6. Dwarf Fortress: snowstorms and freezing water. https://dwarffortresswiki.org/index.php/v0.34:Snow
7. Tibia: snow tile and decaying footprint tile. https://tibia.fandom.com/wiki/Tiles ; https://otland.net/threads/8-0-snow-footsteps-fix.189116/
8. Ultima Online: client-side winter tiles. https://www.forums.polserver.com/viewtopic.php?p=19410
9. Zelda: Oracle of Seasons: per-area winter swap. https://www.zeldadungeon.net/wiki/Winter
10. Stardew Valley: seasonal tilesheets, winter recolour. https://stardewvalleywiki.com/Modding:Maps ; https://www.curseforge.com/stardewvalley/mods/snowy-paths
11. Mark Ferrari Living Worlds / Canvas Cycle: palette-cycled snow. https://experiments.withgoogle.com/canvas-cycle
12. Stone Protectors (Mega Drive prototype): multiplexed 3-layer snow. https://rasterscroll.com/mdgraphics/graphical-effects/sprite-raster-effects/
13. Super Mario World: BG3 full-screen mist overlay, the weather-overlay precedent. https://sneslab.net/wiki/BG3

Unverified this session (good candidates for a follow-up):
- Final Fantasy VI (Narshe)
- Chrono Trigger (12000 BC)
- EarthBound (Winters)
- Secret of Mana (Ice Country)
- Diablo II Act V
- Harvest Moon SNES winter
- Pokémon Gold/Silver Ice Path

---

## Sources
- https://github.com/pret/pokeemerald/blob/master/src/field_weather_effect.c
- https://github.com/pret/pokeemerald/blob/master/include/constants/field_weather.h
- https://github.com/pret/pokeemerald/blob/master/src/field_effect_helpers.c
- https://github.com/pret/pokeemerald/blob/master/src/event_object_movement.c
- https://github.com/pret/pokeplatinum/blob/main/src/overlay005/ov5_021F1CC8.c
- https://bulbapedia.bulbagarden.net/wiki/Snow_tile
- https://bulbapedia.bulbagarden.net/wiki/Sinnoh_Route_216
- https://rimworldwiki.com/wiki/Snow
- https://rimworldwiki.com/wiki/Snow_(thick)
- https://dwarffortresswiki.org/index.php/v0.34:Snow
- https://tibia.fandom.com/wiki/Tiles
- https://otland.net/threads/8-0-snow-footsteps-fix.189116/
- https://www.forums.polserver.com/viewtopic.php?p=19410
- https://ultimacodex.com/2020/10/ultima-online-new-legacy-announced-will-feature-seasonal-changes/
- https://www.zeldadungeon.net/wiki/Winter
- https://stardewvalleywiki.com/Modding:Maps
- https://www.curseforge.com/stardewvalley/mods/snowy-paths
- https://dcmpx.remotevs.com/com/effectgames/www/PL/effect/article-Q_A_with_Mark_J_Ferrari.html (mirror of effectgames Q&A)
- https://monochrom.at/blog/?p=11592
- https://experiments.withgoogle.com/canvas-cycle
- https://gh.r-mj.com/icockrum/canvascycle
- https://rasterscroll.com/mdgraphics/graphical-effects/sprite-raster-effects/
- https://sneslab.net/wiki/BG3
- Blocked for direct fetch: http://www.effectgames.com/demos/canvascycle/ , http://www.effectgames.com/effect/article-Old_School_Color_Cycling_with_HTML5.html , https://stardewvalleywiki.com/Weather , https://stardewvalleywiki.com/Snow
