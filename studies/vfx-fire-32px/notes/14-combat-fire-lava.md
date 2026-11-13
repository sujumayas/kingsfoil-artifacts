# 14 Combat fire and lava at 32 px

Scope: how combat fire looks and is timed at 32 px tiles and a 640x360 canvas. Tibia effect and missile timing from open-source client code, Tibia spell area shapes from TFS, explosion anatomy at 32 to 96 px, projectile speed, screen shake in px, lava at 32 px. Damage, ticks and field durations are settled in VFX #6 (`studies/vfx-fire/report.md` §6c, note 09) and are not repeated.

Tile size convention. Unless a row says otherwise, numbers are for 32 px tiles (Tibia, Asterion). Stardew numbers are 16 px art tiles drawn at 4x (64 screen px). RPG Maker MV numbers are 48 px tiles.

Tool calls used: about 33. Raw files are in `scratch-14/` (OTClient and Mehah otclient sources, TFS `const.h`, `spells.lua` and rune scripts, Stardew decompiled `GameLocation.cs` and `TemporaryAnimatedSprite.cs`, RPG Maker MV `Sprite_Animation.js`, TibiaWiki API dumps).

## Q1. How does Tibia time effects and missiles?

### Takeaway
Tibia's whole combat look is two constants. An effect frame lasts 75 ms and the effect dies after `75 x phases` ms. A missile flies `150 x sqrt(distance in tiles)` ms in a straight line, with one still sprite picked from 8 directions. The sqrt makes long shots faster per tile, so a 1-tile shot moves 6.7 tiles/s and a 7-tile shot 17.6 tiles/s. Asterion can copy both constants as they are, since they were built for exactly this grid.

### Cited findings
- `EFFECT_TICKS_PER_FRAME = 75` and `TICKS_PER_FRAME = 75` (missile) in edubart OTClient. https://github.com/edubart/otclient/blob/master/src/client/effect.h , https://github.com/edubart/otclient/blob/master/src/client/missile.h
- `Effect::onAppear()` restarts a timer and schedules removal after `EFFECT_TICKS_PER_FRAME x getAnimationPhases()` ms. The phase is `min(elapsed / 75, phases - 1)`, so the last frame holds until removal. One effect, client id 33, gets 4x the frame time (`ticks <<= 2`), a hard-coded "hack". https://github.com/edubart/otclient/blob/master/src/client/effect.cpp
- With the `GameEnhancedAnimations` feature (newer dat files), the effect uses its own per-phase durations from the sprite data and `getTotalDuration()` instead of 75 ms. Same URL, and https://github.com/mehah/otclient/blob/main/src/client/effect.cpp
- Mehah otclient makes the constants configurable. Defaults are `m_effectTicksPerFrame{ 75 }`, `m_missileTicksPerFrame{ 75 }`, `m_itemTicksPerFrame{ 500 }` and `m_spriteSize{ 32 }`. https://github.com/mehah/otclient/blob/main/src/client/gameconfig.h
- `Missile::setPath()`: `m_duration = 150 * sqrt(m_delta.length())`, then `m_delta *= TILE_PIXELS`. The draw position is `dest + m_delta * fraction`, linear in time. Removal is scheduled at `m_duration`. https://github.com/edubart/otclient/blob/master/src/client/missile.cpp
- Mehah writes the same rule as `(missileTicksPerFrame * 2) * sqrt(deltaLength)` = 150 x sqrt(d), uses `getSpriteSize()` (32) for the pixel delta, and removes a zero-length missile at once. https://github.com/mehah/otclient/blob/main/src/client/missile.cpp
- A missile picks one of 9 sprites from a 3x3 pattern grid by direction (NW, N, NE, W, centre, E, SW, S, SE). edubart draws animation phase 0 only, so a missile is a still sprite sliding across tiles. Same two URLs.
- The distance is Euclidean (`m_delta.length()`), so a diagonal (3,3) shot is sqrt(18) = 4.24 tiles. Same URLs.
- An effect's sprite variant depends on its tile. edubart uses `xPattern = offsetX % patternX`, `yPattern = offsetY % patternY`; Mehah uses `position.x % pattern_x` in `setPosition()`. A multi-tile spell therefore shows different sprite variants on neighbouring tiles. https://github.com/edubart/otclient/blob/master/src/client/effect.cpp , https://github.com/mehah/otclient/blob/main/src/client/effect.cpp
- The juice study (earlier in this repo) already recorded the 75 ms frame and the `150 x sqrt(tiles)` flight, and that Tibia applies damage when the server sends the missile packet, so the missile is visual only. `studies/feel-combat-juice/report.md` lines 13, 615, 720 (its sources 8 and 9 are the same OTClient files).

Missile flight, computed from `150 x sqrt(d)` at 32 px tiles:

| Distance (tiles) | Flight (ms) | Speed (tiles/s) | Speed (px/s at 32 px) |
|---|---|---|---|
| 1 | 150 | 6.7 | 213 |
| 3 | 260 | 11.5 | 370 |
| 4.24 (diagonal 3,3) | 309 | 13.7 | 439 |
| 5 | 335 | 14.9 | 477 |
| 7 | 397 | 17.6 | 564 |
| 9 (screen edge, 640 px wide) | 450 | 20.0 | 640 |

### Inferences
- Effect lifetime for an N-phase effect is `75 x N` ms. A 6-phase effect lives 450 ms, an 8-phase 600 ms, a 12-phase 900 ms. That band (450 to 900 ms) is the right length for an Asterion hit or area flash.
- Speed scales with sqrt(d), so every missile lands in 150 to 450 ms on screen. That bounded delay is why Tibia combat reads fast at any range. At 60 fps a 7-tile missile moves 9.4 px per frame. That is under a third of a tile, so a still 32x32 head with no trail does not strobe.
- The 500 ms item tick is the default for animated map items without enhanced animation data (fire fields, lava, torches on the ground). It is much slower than effects. Ground fire loops at 2 fps, combat flashes at 13.3 fps.
- Choosing the sprite variant by `x % px, y % py` is a free way to stop a 37-tile area looking stamped. Asterion can use the same rule with 2x2 or 3x3 variant sheets.

### Gaps
- Phase counts and sprite sizes for each Tibia fire effect (FIREAREA, HITBYFIRE, EXPLOSIONAREA, FIREATTACK) live in the proprietary `Tibia.dat` / `appearances.dat`, which are not on GitHub. I could not read them. The 64x64 effect offset question is also unanswered. OTClient draws through `ThingType::draw` with the sprite's own size and displacement. I did not read `thingtype.cpp` for the exact offset rule.

## Q2. Which effect and missile ids and which area shapes does Tibia use for fire?

### Takeaway
Tibia never draws a big explosion sprite. A great fireball is 37 copies of a 1-tile fire effect laid on a radius-3 disc, and an explosion rune is 5 copies on a plus shape. The area's look comes from the shape and from per-tile sprite variants. Each effect also carries its own light, radius 4 to 6.

### Cited findings
- TFS `const.h` effect ids: `CONST_ME_POFF = 3`, `EXPLOSIONAREA = 5`, `EXPLOSIONHIT = 6`, `FIREAREA = 7`, `HITAREA = 10`, `HITBYFIRE = 16`, `FIREATTACK = 37`, `SMOKE = 68`, `ORCSHAMAN_FIRE = 72`. Missiles: `CONST_ANI_FIRE = 4`, `BURSTARROW = 7`, `FLAMMINGARROW = 34`, `EXPLOSION = 41`. Fire field items 1487/1488/1489 (PvP full, medium, small), 1492-1494 (persistent), 1500-1501 (non-PvP). https://github.com/otland/forgottenserver/blob/master/src/const.h
- Effect id 33 (the 4x-slow effect in OTClient) is `CONST_ME_SLEEP`, not fire. Same URL.
- Rune scripts in TFS revscriptsys. https://github.com/otland/forgottenserver/tree/master/data/scripts/runes/attack
  - Fireball rune: effect FIREATTACK, missile FIRE, single target.
  - Great fireball rune: effect FIREAREA, missile FIRE, `AREA_CIRCLE3X3`.
  - Explosion rune: effect EXPLOSIONAREA, missile EXPLOSION, `AREA_CROSS1X1`, physical damage.
  - Fire bomb rune: missile FIRE, creates item 1487 on `AREA_SQUARE1X1`. No impact effect set.
  - Fire wall rune: missile FIRE, creates 1487 on `AREA_WALLFIELD` or `AREADIAGONAL_WALLFIELD`.
- Spells in TFS: fire wave uses HITBYFIRE on `AREA_WAVE4`; hell's core uses FIREAREA on `AREA_CIRCLE5X5`. https://github.com/otland/forgottenserver/blob/master/data/scripts/spells/attack/fire_wave.lua , https://github.com/otland/forgottenserver/blob/master/data/scripts/spells/attack/hell's_core.lua
- Area arrays from TFS `data/scripts/lib/spells.lua`, rendered here (`@` caster or target, `#` hit tile). https://github.com/otland/forgottenserver/blob/master/data/scripts/lib/spells.lua

```
AREA_CROSS1X1 (5)   AREA_SQUARE1X1 (9)   AREA_WALLFIELD (5)   AREADIAGONAL_WALLFIELD (9)
 .#.                 ###                  ##@##                ....#
 #@#                 #@#                                       ...##
 .#.                 ###                                       .#@#.
                                                               ##...
                                                               #....
AREA_CIRCLE3X3 (37)  AREA_WAVE4 (12)      AREA_CIRCLE5X5 (73, 11x11)
 ..###..              #####                .....#.....
 .#####.              .###.                ...#####...
 #######              .###.                ..#######..
 ###@###              ..@..                .#########.
 #######                                   .#########.
 .#####.                                   #####@#####
 ..###..                                   (rows mirror below)
```

- TibiaWiki infobox data (MediaWiki API). Fire Effect id 16, light radius 4, light colour 215. Explosion Effect id 5, light radius 4. Fireball Effect id 7, light radius 6. Flame Effect id 37, light radius 6. Fire Missile id 4, light radius 5. Burst Arrow Missile id 7. https://tibia.fandom.com/api.php?action=parse&page=Fire_Effect&prop=wikitext&format=json (and pages Explosion_Effect, Fireball_Effect, Flame_Effect, Fire_Missile, Burst_Arrow_Missile)
- TibiaWiki "Fire" (the field). Light radius 7, light colour 200, walkable. Three sprite stages (Fire, Fire (Medium), Fire (Small)), stage times 3:20, 2:28, 1:38. https://tibia.fandom.com/api.php?action=parse&page=Fire&prop=wikitext&format=json

### Inferences
- At 640x360 (20 x 11.25 tiles), a great fireball covers 7x7 tiles, 35% of the screen width. Hell's core covers 11 tiles, more than half the width and almost the full height.
- Draw count. One GFB is 37 effect sprites alive for `75 x phases` ms. Ten mages casting GFB in the same second is 370 sprites of 32x32. One Godot `_draw()` or a MultiMesh handles that easily (the juice study measured 1000 numbers at 0.25 ms per frame on WebGL2, `studies/feel-combat-juice/report.md` line 54).
- An effect light of radius 4 to 6 tiles on every one of 37 tiles is too much light. Asterion should light only the centre tile of an area, or one light per 3x3 block.
- Fire bomb and fire wall have no impact flash in TFS. The missile arrives and the field items appear. A 1-frame flash on the field tiles would sell the landing better.

### Gaps
- Sprite size and phase count per effect id (see Q1 gaps). TibiaWiki effect pages list no frame data.
- Fire field stage sprites. TibiaWiki links three GIFs, but I did not download images and the page gives no frame count. The item tick default (500 ms) suggests a 2 fps loop (inference).

## Q3. How does Tibia keep dozens of effects readable in PvP?

### Takeaway
Mehah otclient has two rules worth copying. A second copy of the same effect on the same tile is dropped if the first is still young. Effects and missiles from other players can be drawn at reduced opacity. There is no global cap in the code I read.

### Cited findings
- `Tile::addThing()` loops over effects already on the tile. If the new effect has the same id as an old one (or the client is in optimize mode), it calls `newEffect->waitFor(prevEffect)`. If that returns false the new effect is not added. https://github.com/mehah/otclient/blob/main/src/client/tile.cpp
- `Effect::waitFor()`: refuse while the old effect's age is under `minDuration x max(phases / 3, 1)`, with `minDuration` 75 ms by default. Otherwise delay drawing the new one until a third of the old effect's duration has passed (two thirds in optimize mode, divisor 1.5). https://github.com/mehah/otclient/blob/main/src/client/effect.cpp
- In optimize mode, a bigger new effect hides the smaller old one (`prevEffect->canDraw(false)`). https://github.com/mehah/otclient/blob/main/src/client/tile.cpp
- Effects and missiles get `g_client.getEffectAlpha(m_source)` and `getMissileAlpha()`, and the draw pool sets that opacity when below 1. The source is an `Otc::MagicEffectSources` value. https://github.com/mehah/otclient/blob/main/src/client/effect.cpp , https://github.com/mehah/otclient/blob/main/src/client/missile.cpp
- The juice study recommends effect tiers and dimming others' numbers for the same reason. `studies/feel-combat-juice/report.md` line 57.

### Inferences
- Asterion rule. One effect per (tile, effect id) per 75 ms x phases/3. Others' fire effects at 50 to 70% opacity, yours at 100%. Others' missiles at 60%. This keeps a 10-mage fight as 37-tile discs rather than a white smear.
- Opacity on pixel art should be one of 2 or 3 fixed steps, or a 2x2 checker dither, so it stays crisp (from the VFX #11 dither guidance in CONTEXT).

### Gaps
- No measured screenshot or count of effects in a real Tibia PvP war. The Mehah default alpha values per source were not read (they are set from Lua options).

## Q4. What does an explosion look like at 32 to 96 px?

### Takeaway
At one-tile scale, explosions are 6 to 13 frames at 50 to 90 ms. Two shipped examples build big blasts from many 1-tile sprites, not one large sprite. Stardew scatters 1-tile explosion sprites over the blast disc with random start delays of 0 to 700 ms. Tibia lays one 1-tile effect per area tile. RPG Maker MV is the counter-example: painted 192x192 cells at 15 fps, scaled and rotated, which does not suit pixel art.

### Cited findings
- Stardew `GameLocation.explode(tile, radius, who)` (decompiled, pre-1.5 build). https://github.com/E-riCA0/StawdewValley/blob/HEAD/GameLocation.cs
  - One central sprite, animation row 23, 6 frames, with `light = true`, `lightRadius = radius` and `alphaFade = 0.03 - radius x 0.003`.
  - `Rumble.rumbleAndFade(1, 300 + radius x 100)` ms, controller rumble rather than camera shake.
  - For each tile on the radius disc, 45% chance of a delayed extra. Half of those are sprite 362, 6 frames at a random 30 to 90 ms per frame, start delay 0 to 700 ms. The other half are row 5, 8 frames at 50 ms, scale 0.5 to 1.5, delay 0 to 200 ms.
  - Every tile also gets row 6, 8 frames, with frame time `distance from centre x 20` ms. Outer tiles play slower and longer, so the blast seems to slow as it spreads.
  - Damage area is `(2r + 1)` tiles square. Monster damage `r x 6` to `r x 8`, player damage `r x 3`.
- Stardew bomb radius: `TemporaryAnimatedSprite` sets `bombRadius` 3, 5, 7 for items 286, 287, 288 (cherry bomb, bomb, mega bomb). https://github.com/E-riCA0/StawdewValley/blob/HEAD/TemporaryAnimatedSprite.cs . The wiki lists 3, 5 and 6-8. https://stardewvalleywiki.com/Crafting#Bombs
- Stardew animation rows are one tile tall. The row constructor uses `new Rectangle(0, row x Game1.tileSize, ...)`, and `tileSize` is 64 screen px, which is 16 art px at 4x. Same `TemporaryAnimatedSprite.cs` URL, line 260.
- RPG Maker MV `Sprite_Animation`. `_rate = 4` game frames per animation frame (15 fps, 66.7 ms). Cells are 192x192 px in a 5-column sheet (`sx = pattern % 5 * 192`). Each cell has x, y, scale (`cell[3] / 100`), rotation and mirror. Duration `frames.length x 4 + 1`. Flash timing also scales by `_rate`. https://github.com/rpgtkoolmv/corescript/blob/master/js/rpg_sprites/Sprite_Animation.js . At 48 px tiles a cell is 4x4 tiles.
- Asset packs (vendor-reported). A 32x32 explosion pack lists 9 to 13 frames per sheet, "running at frame rate of 70m/s" (70 ms). https://pimen.itch.io/explosion-effect . A free 32x32 pack has 10 frames. https://dibbelgames.itch.io/explosioneffect-pixelart . Another 32x32 pack has 6 frames. https://virusystem.itch.io/animation-explosion (search-result snippets, not opened).
- Slynyrd's construction (rings expanding fast then slowing, white to warm to grey smoke) is in VFX #6 F3. https://www.slynyrd.com/blog/2020/12/14/pixelblog-31-shmup-sprite-design

### Inferences
- Asterion explosion plan at 32 px, sized by tiles:
  - 1-tile hit (fireball impact). One 32x32 sprite, 6 to 8 frames at 75 ms (450 to 600 ms). Frame 1 white or pale yellow flash filling 20 to 24 px. Frames 2 to 4 grow to the full 32 px. Frames 5 to 8 break into 2 to 3 grey puffs that rise 4 to 8 px.
  - 3x3 blast (fire bomb). 9 tile sprites with variants by `x % 3, y % 3`, the centre starting first and the ring tiles 75 ms later. Or one 96x96 sprite of 8 to 10 frames. The tiled version reuses one sheet and reads as Tibia.
  - Radius 3 (GFB). Tibia tiling, plus Stardew's random start delay (0 to 300 ms here, shorter than Stardew's 700 because Tibia effects are short) so 37 tiles do not flash in lockstep.
- Flash frames. One white frame is enough at 32 px. Two looks like a strobe when 37 tiles do it at once. For areas, flash only the centre tile.
- Debris. 2 to 6 particles of 2x2 px (the VFX #11 finding that 1 px reads too thin at 32 px), gravity, life 300 to 500 ms.
- Scorch decal. A 32x32 per-tile decal with 2 or 3 variants, fading in 3 to 5 s client-side. For areas use the same tile rule. Persistent burnt ground belongs to the spread system (notes 15 and 11).
- Light. Stardew ties the light radius to the blast radius in tiles and fades it with the sprite. Asterion can do the same with one light per blast.

### Gaps
- Enter the Gungeon, Nuclear Throne, Broforce, Blazing Chrome and Metal Slug explosion frame counts and ms. No source found in budget. Their wikis do not list animation data.
- Ultima Online explosion potion and fire field animation data (UO uses 44x44 diamond tiles). Not checked.
- The Stardew build in the decompiled repo predates 1.5, so the Volcano Dungeon (lava) code is not in it.

## Q5. Fireballs, projectiles and flame streams at 32 px

### Takeaway
Tibia's fire missile is a still sprite in 8 directions sliding at 6.7 to 20 tiles per second, with no trail. That is enough at 32 px because the flight lasts at most 450 ms. A trail or an animated head is optional polish, not needed to read.

### Cited findings
- Tibia missiles. 8 direction sprites, phase 0 only, linear slide over `150 x sqrt(d)` ms (Q1 table). https://github.com/edubart/otclient/blob/master/src/client/missile.cpp
- Mehah draws missiles at `DrawOrder::FOURTH`, above map items. https://github.com/mehah/otclient/blob/main/src/client/missile.cpp
- VFX #6 recorded a commercial fireball of 10 travel frames plus impact in 4 directions at 32x32, and trail options ranked by cost (stretched sprite, 3 to 4 afterimages, 20 to 40 particles per second). `studies/vfx-fire/notes/09-combat-fire-lava.md` Q2.
- Terraria flamethrower: 5 bursts per use, each projectile expands into a cone and fades. https://terraria.wiki.gg/wiki/Flamethrower (from VFX #6 note 09 Q3).

### Inferences
- Head size at 32 px. A Tibia-like missile sprite is 32x32 with the visible fireball about 12 to 16 px across, and the rest is transparent so the direction sprite can lean. That is 2x the 8x8 head VFX #6 proposed at 320x180.
- If the head animates, 3 frames at 75 ms (one Tibia frame each) loop 1.1 times in a 1-tile flight and 6 times in a 9-tile flight. 2 or 3 frames is enough.
- Afterimages at 32 px. Keep 2 to 3 previous positions spaced 8 to 12 px, drawn 1 and 2 palette steps darker and 2 px smaller per step. At 564 px/s (7 tiles) a frame step is 9.4 px, so one afterimage per frame gives a 20 to 30 px tail, under one tile.
- Flame cone at 32 px. Terraria's stream scaled to a tile grid: 3 tiles long, a blob every 100 ms, each blob growing from 8 px to 24 px over 400 ms. About 4 to 5 live blobs. For a server-grid version, use TFS `AREA_WAVE4` (12 tiles) with HITBYFIRE per tile, as Tibia's fire wave does.

### Gaps
- No measured projectile speeds from Enter the Gungeon, Nuclear Throne or Hyper Light Drifter in tiles per second.

## Q6. Screen shake and hitstop at 640x360

### Takeaway
At 640x360 with 32 px tiles, shake in whole pixels of 2 px (light) to 6 px (heavy cap) is the range the earlier studies converge on. Only the local player's own hits and blasts should shake their camera. The one primary Vlambeer number is the Nuclear Throne pistol, a 6 px camera kick toward the aim and +4 to the shake counter, at a 320x240 game.

### Cited findings
- Nijman on the Nuclear Throne pistol: the camera is kicked 6 pixels back from the aim and he says "add 4 to the screenshake", which then decays fast. https://gamedeveloper.com/design/vlambeer-co-founder-shares-advice-on-building-better-action-games (search-result snippet; page not opened)
- Juice study (earlier study). Shake curve trauma squared, maximum 6 px, vertical half, decay 1.5 per second, no rotation, for 32 px tiles. It calls the px values an estimate. Its 16 px arena halves the cap to 3 px. `studies/feel-combat-juice/report.md` lines 1130, 1152, 1328.
- Juice study. Per-entity hitstop 3 frames (50 ms) normal, 6 on a crit, cap 8 (133 ms), only when the local player is attacker or target. Celeste freezes 50 and 100 ms. Same file, lines 35, 255, 257.
- Juice study measured shake as free: "every shake method landed within 0.05 ms of none". Same file, line 364.
- VFX #6 at 320x180: light 1 px, heavy 2 to 4 px, snapped to whole pixels. A secondary article gives light 1 to 2 px over 100 ms and heavy 4 to 8 px over 250 ms (unverified). `studies/vfx-fire/report.md` F3, line 779.
- Heroes of Hammerwatch multiplies shake by `(range - distance) / range` and halves the vertical amplitude. `studies/feel-combat-juice/report.md` line 380.

### Inferences
- Asterion fire presets at 640x360 (whole px, trauma squared):
  - Your fireball hits: trauma +0.2, about 0.25 px peak, which rounds to 0. Fine, small hits should not shake.
  - Your GFB or fire bomb: trauma +0.4, 1 px peak.
  - A big explosion within 3 tiles of you: trauma +0.6, 2 px peak.
  - A boss fire slam on you: trauma +1.0, 6 px peak, vertical 3 px.
  - Strangers' spells: 0.
- Nuclear Throne's 6 px kick at 320x240 would be 12 px at 640x360 if converted by screen size. That is too much for an MMO where every player casts. Keep kicks at 1 to 2 px.
- Hitstop for fire. A burn tick should never freeze. A fireball hit on you or by you gets the 3-frame per-entity freeze from the juice study. Area fire gets none, since 37 tiles of freezes would stack.

### Gaps
- No Nuclear Throne explosion shake value. "The Art of Screenshake" has no transcript I could reach. https://www.youtube.com/watch?v=AJdEqssNZ-U
- No Celeste explosion shake amplitude in px.

## Q7. Lava at 32 px

### Takeaway
Tibia lava is a non-walkable floor with 4 item ids and a light radius of 4, animated through the slow 500 ms item tick. Nothing found gives crust or cycling numbers at 32 px. The plan below is an inference built on VFX #6 B4 and the VFX #11 scale rules: keep crust features at least 4 to 8 px across, so a 32 px tile holds 4 to 8 features, and cycle a 4 to 6 entry ramp at 6 to 10 steps per second.

### Cited findings
- TibiaWiki "Lava". Item ids 727, 728, 729, 730 and 21482. Flooring, natural tile. Light radius 4, light colour 193, map colour 192. Not walkable. Items thrown in burst into flames and are destroyed. https://tibia.fandom.com/api.php?action=parse&page=Lava&prop=wikitext&format=json
- TibiaWiki "Fire Effect" (id 16) shows when "throwing something into Lava". https://tibia.fandom.com/api.php?action=parse&page=Fire_Effect&prop=wikitext&format=json
- `m_itemTicksPerFrame{ 500 }` is the default animated-item frame time in Mehah otclient. https://github.com/mehah/otclient/blob/main/src/client/gameconfig.h
- Palette-cycled lava and fire are covered in VFX #6 B4 and note 08 Q6. The CC0 Godot lava shader (miwls) scrolls noise at (0.30, 0.15) with three colours. `studies/vfx-fire/report.md` G1.
- Terraria lava is opaque, emits "a medium, flickering light" and does not change colour by biome. https://terraria.wiki.gg/wiki/Lava (from VFX #6 note 09 Q4).

### Inferences
- Lava tile at 32 px. Draw 4 tile variants (Tibia has 4 ids) so `x % 2, y % 2` breaks the repeat. Each tile has 2 dark crust plates of 8 to 14 px and cracks 2 to 3 px wide. 1 px cracks read as noise at 32 px, as Bayer dots did in VFX #11.
- Cycling. Put 5 hot entries on the crack pixels and cycle them at 8 steps per second (125 ms). A 5-step ramp then repeats every 625 ms. Crust stays still. If the lava pixels carry an index from a painted gradient that runs diagonally across 2x2 tiles, the bright band appears to flow. A whole 640x360 lava screen then costs one palette uniform, not per-pixel noise.
- Noise route. If a shader is used, sample noise at 1/16 to 1/32 of a tile per texel step (features 16 to 32 px), quantise to the 5 palette entries and snap UVs to the 640x360 pixel grid. Scroll at 2 to 4 px per second.
- Edge against ground. A 2 to 3 px dark rim (cooled crust) on the lava side, then a 2 px glow band on the ground side in 1 or 2 warm tones. Draw it as an autotile border so the server needs no extra state. This matches the 2 to 3 px dither band VFX #11 used for snow edges.
- Glow. Tibia gives lava radius 4. One light per lava tile is heavy for big lakes; use one light per 3x3 block or a baked warm tint on the ground border.
- Damage visual. Tibia makes lava non-walkable, so it never needs a "standing in lava" state. If Asterion allows it, reuse HITBYFIRE (1 tile, 75 ms frames) plus the burning overlay from note 13.

### Gaps
- No frame data for Tibia lava (frames, ms). The 500 ms tick is the client default, not a confirmed lava value.
- Stardew Volcano Dungeon lava, Terraria lava frames, Hyper Light Drifter, Enter the Gungeon and Pokémon lava: no animation numbers found in budget. The decompiled Stardew repo I reached predates the volcano.

## Gems
- Mehah otclient: https://github.com/mehah/otclient . A maintained OTClient fork. It has configurable effect and missile ticks, same-tile effect deduplication and per-source alpha. Licence and stars not read this session. It saves designing a PvP effect-crowding rule.
- TFS spell area arrays: https://github.com/otland/forgottenserver/blob/master/data/scripts/lib/spells.lua . Ready shapes for circle radius 1 to 6, waves, beams and walls. TFS is GPL-2.0 (from its repo; LICENSE file not opened this session, check before reuse). Copy the shapes, not the code.

## Sources
- https://github.com/edubart/otclient/blob/master/src/client/effect.cpp
- https://github.com/edubart/otclient/blob/master/src/client/effect.h
- https://github.com/edubart/otclient/blob/master/src/client/missile.cpp
- https://github.com/edubart/otclient/blob/master/src/client/missile.h
- https://github.com/mehah/otclient/blob/main/src/client/effect.cpp
- https://github.com/mehah/otclient/blob/main/src/client/missile.cpp
- https://github.com/mehah/otclient/blob/main/src/client/tile.cpp
- https://github.com/mehah/otclient/blob/main/src/client/gameconfig.h
- https://github.com/otland/forgottenserver/blob/master/src/const.h
- https://github.com/otland/forgottenserver/blob/master/data/scripts/lib/spells.lua
- https://github.com/otland/forgottenserver/tree/master/data/scripts/runes/attack
- https://github.com/otland/forgottenserver/blob/master/data/scripts/spells/attack/fire_wave.lua
- https://github.com/otland/forgottenserver/blob/master/data/scripts/spells/attack/hell's_core.lua
- https://tibia.fandom.com/api.php?action=parse&page=Fire&prop=wikitext&format=json
- https://tibia.fandom.com/api.php?action=parse&page=Lava&prop=wikitext&format=json
- https://tibia.fandom.com/api.php?action=parse&page=Fire_Effect&prop=wikitext&format=json (also Explosion_Effect, Fireball_Effect, Flame_Effect, Fire_Missile, Burst_Arrow_Missile, Effects)
- https://github.com/E-riCA0/StawdewValley/blob/HEAD/GameLocation.cs
- https://github.com/E-riCA0/StawdewValley/blob/HEAD/TemporaryAnimatedSprite.cs
- https://stardewvalleywiki.com/Crafting#Bombs
- https://github.com/rpgtkoolmv/corescript/blob/master/js/rpg_sprites/Sprite_Animation.js
- https://pimen.itch.io/explosion-effect (snippet)
- https://dibbelgames.itch.io/explosioneffect-pixelart (snippet)
- https://virusystem.itch.io/animation-explosion (snippet)
- https://gamedeveloper.com/design/vlambeer-co-founder-shares-advice-on-building-better-action-games (snippet)
- https://www.youtube.com/watch?v=AJdEqssNZ-U
- https://www.slynyrd.com/blog/2020/12/14/pixelblog-31-shmup-sprite-design
- https://terraria.wiki.gg/wiki/Flamethrower
- https://terraria.wiki.gg/wiki/Lava
- Earlier studies: `studies/feel-combat-juice/report.md`, `studies/vfx-fire/report.md`, `studies/vfx-fire/notes/09-combat-fire-lava.md`

### See it in action
- Tibia fire effects and areas: https://tibia.fandom.com/wiki/Effects , https://tibia.fandom.com/wiki/Great_Fireball_Rune
- Tibia lava: https://tibia.fandom.com/wiki/Lava
- Stardew bombs: https://stardewvalleywiki.com/Bomb
- Vlambeer screenshake talk: https://www.youtube.com/watch?v=AJdEqssNZ-U
