# 01 Roots and classic era of fire and smoke VFX

Researcher angle: history, the DOOM PSX fire and its demoscene ancestors, palette cycling, classic game fire, Tibia field rules, roguelike fire spread.
Date of research: 2026-11-10. About 30 tool calls.

---

## Q1. How does the DOOM PSX fire work, exactly?

### Takeaway
It is one byte per pixel, 37 heat levels, and one rule per pixel per frame. Copy the heat from the pixel below, maybe shift it sideways, maybe subtract 1. The bottom row is a fixed heat source of 36. The rule includes a sideways bias, so the flames lean. That bias is the "wind". To put the fire out, lower the bottom row. It costs about 54k byte reads and writes per frame at 320x168, which is trivial today.

### Cited findings
- Final DOOM PSX devs had spare CPU cycles. They used them for animated fire in the intro and in gameplay (the sky). Fabien Sanglard cleaned up the code from Samuel Villarreal's reverse-engineering of the N64 version (Twitter, 25 March 2018). Article dated 28 Dec 2018. https://fabiensanglard.net/doom_fire_psx/
- Heat values are in [0, 36], so the palette has 37 entries. It runs from near-black through red, orange and yellow to white. https://fabiensanglard.net/doom_fire_psx/
- The 37 RGB entries from the published source are below (hex, index 0 to 36). https://fabiensanglard.net/doom_fire_psx/
  `070707 1F0707 2F0F07 470F07 571707 671F07 771F07 8F2707 9F2F07 AF3F07 BF4707 C74707 DF4F07 DF5707 DF5707 D75F07 D75F07 D7670F CF6F0F CF770F CF7F0F CF8717 C78717 C78F17 C7971F BF9F1F BF9F1F BFA727 BFA727 BFAF2F B7AF2F B7B72F B7B737 CFCF6F DFDF9F EFEFC7 FFFFFF`
  Index 0 (0x070707) is drawn transparent so the DOOM logo shows behind the fire.
- Buffer in the reference code is `FIRE_WIDTH = 320`, `FIRE_HEIGHT = 168`. The ticker runs at `CJS_TICKER_FPS = 27`. https://fabiensanglard.net/doom_fire_psx/
- Setup fills the whole buffer with 0 and sets the bottom row to 36. The bottom row is never updated. https://fabiensanglard.net/doom_fire_psx/
- The article builds the rule in three stages. https://fabiensanglard.net/doom_fire_psx/
  1. Straight up, decay 1 per row. The article calls it "boring".
  2. Random decay: `firePixels[to] = firePixels[from] - (rand & 1)`.
  3. Random sideways move: `to = from - FIRE_WIDTH - rand + 1`.
- The final rule in the source (paraphrased pseudocode):
  ```
  for x in 0..W-1:
    for y in 1..H-1:
      src = y*W + x
      p = fire[src]
      if p == 0: fire[src - W] = 0
      else:
        r = round(random()*3)          // 0..3
        dst = src - r + 1              // sideways offset +1, 0, -1, -2
        fire[dst - W] = p - (r & 1)    // decay 0 or 1
  ```
  https://fabiensanglard.net/doom_fire_psx/
- Sanglard says adjusting the upward propagation "can also" simulate wind. He leaves it as an exercise. https://fabiensanglard.net/doom_fire_psx/
- Fire stop in the demo: after the logo scrolls into place, the bottom rows (y 161 to 167) lose `round(random()) & 3` per frame. The source then starves and the flames die from the bottom up. https://fabiensanglard.net/doom_fire_psx/
- Sanglard compares it to the 1990s "water ripple" kata. He calls it a "classic demoscene effect". https://fabiensanglard.net/doom_fire_psx/

### Inferences (my math from the published code, not stated by the source)
- `Math.round(Math.random()*3)` is not uniform. P(0) = 1/6, P(1) = 1/3, P(2) = 1/3, P(3) = 1/6.
- Decay happens when r is odd, so P(decay) = 1/3 + 1/6 = 1/2. Average heat loss is 0.5 per row. The base heat is 36, so the mean flame height is about 72 rows. That is 43% of the 168-row buffer.
- Sideways offset `1 - r` averages -0.5 px per row. The fire drifts left by default, and over 72 rows the average lean is about 36 px. This is the built-in "wind". To steer it, change the offset distribution, e.g. `dst = src - r + 1 + windShift`, or bias r. Rounding and the x-major loop order both add to the bias.
- The loop is x-major and walks from the top down. Each row writes into the row above it, which was already processed this frame. So heat moves exactly 1 row per frame. At 27 fps a column of fire rises at 27 px/s.
- Cost is W*(H-1) reads plus one random number per pixel. At 320x168 that is 53,440 updates per frame. At a 320x180 sandbox resolution a full-screen fire costs about the same. A torch-sized 16x32 patch costs 512 updates.
- PSX/N64 title screen use: the source animates the fire behind a DOOM logo that scrolls up by 2 px per frame, then kills the fire. That matches the title screen sequence. I have no primary PSX/N64 footage URL. Watch the article's embedded canvas demo at the URL above.

### Gaps
- No primary source for the exact PSX resolution, frame rate or buffer size. The 320x168 and 27 fps come from Sanglard's web port, not from the PSX binary.
- Samuel Villarreal's original CodePen link was not opened.

---

## Q2. What came before DOOM fire? (Demoscene fire, Hugo Elias, Lode, gamedev.net tutorials)

### Takeaway
They all share one loop: seed hot pixels at the bottom, blur, cool, and scroll up by 1 to 2 px. The variants differ in three knobs. One is which neighbours get averaged (3 or 4). The second is how cooling happens (subtract 1, divide by slightly more than 4, or subtract a cooling map). The third is how the bottom is seeded (random each frame vs fixed). Hugo Elias's scrolling cooling map gives the best tongue shapes for almost no extra cost. DOOM drops the blur entirely and uses random displacement plus random decay. That is why it is cheaper and looks more "pixel".

### Cited findings
- Hugo Elias (archived page, captured 2016). The four steps are heat source, heat spread (smooth), cooling (subtract), and convection (scroll up 1 px). He works in VGA 320x200, 256 colours. https://web.archive.org/web/2016/http://freespace.virgin.net/hugo.elias/models/m_fire.htm
  - Seeding: "a few pixels of maximum brightness" go at random in the bottom few lines. More pixels make a smoother fire. Fewer make it more flickery. Same URL.
  - Smoothing: the average of the 4 neighbours (up, down, left, right). Same URL.
  - Cooling map: a screen-sized byte array. Sprinkle "a few thousand pixels" of various intensities, then run about 20 smoothing passes. Values range from 0 to about 10. Each frame `p = avg4 - coolingmap(x,y)`, clamped at 0, and the result is written one pixel higher. Scroll the cooling map up at the same speed as the convection, using a vertical offset rather than a real copy. Dark map areas give bigger flames. Same URL.
  - You can paint shapes into the cooling map (he jokes about "pentagrams, skulls") so they appear in the flame. Same URL.
  - For "life", he suggests a warp feedback air flow. He also suggests sparks (pixels that rise, pop into more sparks and dim), fireballs (clumps of thrown seed pixels that leave a trail), and a flamethrower. Same URL.
- Lode Vandevenne, "Fire Effect" (last edited 20 Aug 2007). https://lodev.org/cgtutor/fire.html
  - Each pixel = (3 pixels in the row below + 1 pixel two rows below) * 32 / 129, i.e. divided by 4.03. Same URL.
  - Divisor guidance: /4 means the fire rises forever, /5 dies "way to fast". *16/65 (÷4.0625) rises higher than *4/17 (÷4.25). Same URL.
  - The bottom row gets a new random value 0..255 every frame. If you seed it only once, the flames freeze at max height. Same URL.
  - Palette: 256 entries from HSL. Hue = x/3 (0 to 85, red to yellow), saturation 255, lightness = min(255, 2x). Same URL.
  - Example size 640x128, capped at 20 fps (0.05 s per frame). The flames "rise two pixels every frame". Edges wrap with modulo. Same URL.
  - You can seed object edges instead of the bottom row to make "flaming text". Same URL.
- Adam Parusel, "Simple Fire Effect" (gamedev.net, posted 16 Jul 1999). It cites the German book PC Underground (Data Becker). https://web.archive.org/web/2010/http://www.gamedev.net/reference/articles/article222.asp
  - Mode 13h, 320x200x256, two buffers. Same URL.
  - Seed: the bottom 2 rows (198, 199) get random values 100 to 150. Optional hotspots are 10 to 50 random 3x3 blocks of 255. Same URL.
  - Rule: `B2[x,y-1] = (B1[x-1,y] + B1[x+1,y] + B1[x,y-1] + B1[x,y+1]) / 4 - 1`. Check for 0 first, or the byte wraps to 255. Same URL.
- Phil Carlisle's "Fire Tutorial" (gamedev.net article 1287) uses 320x200 byte arrays. It suggests averaging fewer neighbours for speed. Seen only as a search snippet, because gamedev.net returned 403. https://archive.gamedev.net/archive/reference/articles/article1287.html
- SWAG Pascal archives hold several DOS fire sources (EGAVGA 0203 to 0205). Not opened. https://swag.outpostbbs.net/EGAVGA/0204.PAS.html

### Inferences
- The DOOM rule is the cheapest of the family. It does one read, one write, one random number and no division per pixel. The blur-based fires do 4 reads and a divide or multiply-shift.
- For a 3/4 top-down game, Hugo's cooling map is the best way to art-direct flame shape. Paint a small looping map per torch type and the flame keeps the same silhouette across many torches.
- Blur fires give smooth gradients that want 64 to 256 colours. DOOM's no-blur rule looks good with 37 colours, and the ramp could likely be quantised further to 8 to 12 for a palette-limited game. That is untested.

### Gaps
- No primary source for the earliest demoscene fire (which group, year). Carlisle's article text and the SWAG sources were not read in full.
- Denthor (Asphyxia VGA trainer) and Flipcode fire tutorials were not reached.

---

## Q3. Palette cycling fire (Mark Ferrari, Canvas Cycle, Deluxe Paint)

### Takeaway
Ferrari drew one flat 256-colour image. Flames and embers animate by rotating a small range of palette entries, with no sprites and no per-pixel work. Per frame it costs only a palette update. The weakness people report for fire is that pure cycling looks "mechanical and overly sequenced".

### Cited findings
- Joe Huckaby's Canvas Cycle (2010, Effect Games) is an HTML5 8-bit colour cycling engine. It uses 35 of Mark Ferrari's 640x480 images. https://80.lv/articles/color-cycling-from-the-90s-returns-with-html5
- Ferrari's work used one flat image with one 256-colour palette and no layers or alpha. Cycling animated water, fire and clouds without sprites. https://80.lv/articles/color-cycling-from-the-90s-returns-with-html5
- Ferrari confirms the images appeared in published products in the 80s and 90s, and that Huckaby had his permission. https://dcmpx.remotevs.com/com/effectgames/www/PL/effect/article-Q_A_with_Mark_J_Ferrari.html
- Huckaby's engine pre-processes each image to find only the pixels that reference cycling palette entries, then updates only those. https://80.lv/articles/color-cycling-from-the-90s-returns-with-html5
- Dave Rupert (2018) re-implemented cycling. With a simple shift array, fire "felt a lot more like fire". He still found it "mechanical and overly sequenced like on those Canvas Cycle demos". https://daverupert.com/2018/09/color-cycling-image-pixels-with-workers/

### Inferences
- Godot equivalent: an index texture plus a palette-lookup shader with a time offset on the fire range. This is the same trick as the palette lighting in study #1 (snow). Cost is near zero.
- To fix the "mechanical" look, jitter the cycle speed per range or add a flicker string (study #5) to the cycle offset.

### Gaps
- No frame counts or cycle rates for specific Ferrari fire scenes. Deluxe Paint cycling parameters were not collected.

---

## Q4. Tibia fire fields, burning condition, campfires, lava (numbers)

### Takeaway
A Tibia fire field is an item that decays through 3 sprite stages. Stepping on it deals initial damage and applies a burning condition (DoT). The open-source server (TFS) encodes this as `initdamage 20`, then 7 ticks of 10 every 10 s. TibiaWiki reports 9 s ticks and different stage times for the real game, so the official server and TFS disagree on timing. Field runes stamp fixed tile patterns: 1 tile, 3x3 (bomb), or 1x5 (wall).

### Cited findings (TibiaWiki, real game)
- Fire Field Rune (item 3188, words "adevo grav flam", level 15, ML 1): stepping on a field deals 20 fire damage plus burning, "10 fire damage over 7 turns, every 9 seconds". That totals 90 HP lost in about 1 minute. https://tibia.fandom.com/wiki/Fire_Field_Rune
- Field stage durations: stage 1 lasts 3:20, stage 2 lasts 2:28, stage 3 lasts 1:38. The page says the field damages or blocks for 5:48 total, which equals stages 1 + 2. The Fire Wall page says the last stage "does not block a monster". https://tibia.fandom.com/wiki/Fire_Field_Rune , https://tibia.fandom.com/wiki/Fire_Wall_Rune
- Fire Bomb Rune (item 3192, "adevo mas flam", level 27, ML 5) makes a 3x3 square of fire fields with the same stage times. https://tibia.fandom.com/wiki/Fire_Bomb_Rune
- Fire Wall Rune (item 3190, "adevo mas grav flam", level 33, ML 6, implemented in 4.0) makes 1x5 fields when cast straight. A diagonal cast makes 9 tiles spanning 5x5. https://tibia.fandom.com/wiki/Fire_Wall_Rune
- Fire Field spell (spell id 25) costs 240 mana, needs level 15, and makes 3 runes. The library text says the field lasts "some minutes, gradually diminishing". On optional-PvP worlds it deals no damage to players. https://tibia.fandom.com/wiki/Fire_Field
- Burning condition: 10 fire damage per turn, with a constant 9 s between turns. You get it from fire fields, campfires, Soulfire runes and some creatures. It ends via temple NPC healing, the Cure Burning spell, swimming, or waiting. https://tibia.fandom.com/wiki/Burning

### Cited findings (TFS 1.4 source, otland/forgottenserver)
- Fire field decay chain 1487 -> 1488 -> 1489 -> gone. Each stage has `duration 120` (seconds). https://github.com/otland/forgottenserver/blob/1.4/data/items/items.xml
  - 1487: `initdamage 20, ticks 10000, count 7, damage 10`.
  - 1488: same, but no initdamage.
  - 1489: `field fire` with no damage values, i.e. harmless and purely visual.
  - The non-decaying copies 1492/1493/1494 (map-placed fields) follow the same 3-stage damage pattern.
  - 1500 "yellow flame" -> 1501 -> 1502 is a second chain with the same numbers.
- Energy field (1491/1504): `initdamage 30, ticks 10000, damage 25`, duration 120 s, then gone. Same URL.
- Poison gas (1490/1503): `ticks 5000, start 5, damage 100`, duration 120 s. Same URL.
- Magic wall (1497): duration 20 s. Rush wood (1499): duration 45 s, blocking. Searing fire (1506): duration 10 s, damage 300. Same URL.
- Campfire (1423 to 1425): `initdamage 20, ticks 4000, count 2, damage 10`. Ids 1422 and 1426/1427 are unlit campfires. Same URL.
- Lava (1509) is `trashholder` with `effect fire`. It destroys items dropped on it and plays a fire effect. Same URL.
- The field parser builds a `ConditionDamage` with `addDamage(count, ticks, damage)` and sets initDamage. With `start > 0` (poison) it calls `generateDamageList`, which makes a decreasing series (5, 4, ..., 1, repeated) summing to the damage total. https://github.com/otland/forgottenserver/blob/1.4/src/items.cpp , https://github.com/otland/forgottenserver/blob/1.4/src/condition.cpp
- Item decay runs in `EVENT_DECAY_BUCKETS = 4` buckets with `EVENT_DECAYINTERVAL = 250` ms, so each decaying item is checked about once per second. https://github.com/otland/forgottenserver/blob/1.4/src/game.h

### Inferences
- TFS fire field damage = 20 + 7 x 10 = 90 over 70 s (10 s ticks). TibiaWiki gives 90 over 63 s (9 s ticks). Both agree on 90 total, which is the number players remember.
- TFS 3 x 120 s = 6:00 total life vs TibiaWiki 3:20 + 2:28 + 1:38 = 7:26. TFS is an approximation. For Asterion, the decay chain (item swaps on a timer) is the design to copy. It is also network-cheap, because the server sends one item change per stage, not per frame.
- Visual design hint from the data: field strength reads as sprite size (big, medium, small flame). The last stage is harmless, which warns players before the tile clears.

### Gaps
- Tibia fire field sprite frame counts and animation speed were not found. The Tibia client animates field sprites with multiple phases, but I have no cited number.
- No TibiaWiki numbers for campfire or lava damage in the real game (TFS only).

---

## Q5. Roguelike fire: Brogue, DCSS, NetHack

### Takeaway
Brogue is the most copyable fire-spread model. Each turn, every fire tile "exposes" itself and its 4 cardinal neighbours. Each flammable tile has its own ignition percent (grass 15, dead grass 40, hay 50, dead foliage 80, wooden barricade 100). Fire tiles promote to embers and then to ash on a per-turn chance. DCSS treats fire as timed clouds with per-turn damage, and only burning trees spread. Vanilla NetHack has no terrain fire spread, as far as I found.

### Cited findings (Brogue CE source)
- `exposeTileToFire(x, y, alwaysIgnite)`: returns early if the tile is not flammable or `exposedToFire >= 12`. It increments the exposure count. It picks the highest `chanceToIgnite` among flammable layers, then ignites on `rand_percent(ignitionChance)`. On ignition all flammable layers are "promoted" (consumed), and flammable gas loses its volume. A tile with 8 explosive or fire neighbours triggers an explosive promotion (methane). https://github.com/tmewett/BrogueCE/blob/master/src/brogue/Time.c
- Per turn: reset `exposedToFire` on all cells. Then for every fire tile not `CAUGHT_FIRE_THIS_TURN`, expose itself plus the 4 cardinal neighbours. https://github.com/tmewett/BrogueCE/blob/master/src/brogue/Time.c
- Tile promotion fires when `rand_range(0, 10000) < promoteChance`. https://github.com/tmewett/BrogueCE/blob/master/src/brogue/Time.c
- Tile catalog (draw priority, chanceToIgnite, fire type, promote chance): https://github.com/tmewett/BrogueCE/blob/master/src/brogue/Globals.c
  - GRASS 15%, DEAD_GRASS 40%, HAY 50% (burns into stench smoke), FOLIAGE 15%, DEAD_FOLIAGE 80%, TRAMPLED_FOLIAGE 15%, DOOR 50% (burns to embers), WOODEN_BARRICADE 100%, COFFIN 20%, poison, confusion and methane gases 100%.
  - PLAIN_FIRE promotes to EMBERS at 500/10000 per turn. EMBERS promote to ASH at 300/10000. BRIMSTONE_FIRE uses 2500, GAS_FIRE 8000 and DART_EXPLOSION 10000 (single-turn flash).
  - STEAM is a gas that `CAUSES_DAMAGE` and `GAS_DISSIPATES_QUICKLY`. Gas spreads by volume averaging with neighbours (`updateVolumetricMedia`).

### Cited findings (DCSS, 0.34 wiki)
- Clouds are temporary tile features that dissipate over time. Opaque clouds block line of sight after 2 cloud tiles. https://crawl.chaosforge.org/Cloud
- Flame cloud: `(2d23)/2 + 9` fire per turn vs players, `(2d16)/2 + 5` vs monsters. https://crawl.chaosforge.org/Cloud
- Steam: `(2d16)/2 - 1` per turn, opaque. It appears when fire magic passes over water, when ice passes over lava, or when water touches lava. https://crawl.chaosforge.org/Cloud
- "Spreading flames" come from burning trees. They "periodically create new flames" in adjacent tiles. https://crawl.chaosforge.org/Cloud
- Steam and atmospheric clouds can be replaced by other clouds. A same-type cloud overwrites one with less remaining duration. https://crawl.chaosforge.org/Cloud

### Cited findings (NetHack)
- A fire trap makes a column of flame. Each scroll, potion and spellbook carried has a 1/3 chance to burn. https://nethackwiki.com/wiki/Fire_trap
- Scroll of fire: a 3x3 explosion centred on the reader. https://nethackwiki.com/wiki/Scroll_of_fire

### Inferences
- Brogue's numbers suggest a tuning ladder for Asterion grass and wood tiles: green 15%, dry 40%, hay 50%, dead brush 80%, oil 100%. The 12-exposure cap and the "caught this turn" flag stop one tile from spreading twice per turn.
- With plain fire lasting about 1/0.05 = 20 turns on average and 4 neighbours exposed per turn, green grass (15%) almost always catches. Expected exposures before burnout are well above 1/0.15. So "green" still burns, just more slowly. My reading. Verify in playtest.
- DCSS's "steam over water" and "cloud replaces weaker cloud" rules are cheap interaction rules a tile server can run.

### Gaps
- I did not verify in-game how long Brogue grass fire lasts per tile. Burnt grass may vanish quicker than the promote chance implies.
- I did not open NetHack source to confirm that it has no terrain fire spread.

---

## Q6. Fire in classic 8/16-bit and isometric games (Zelda ALttP, Diablo, Ultima, Chrono Trigger, FF)

### Takeaway
Thin coverage in this pass. The best numbers are for Diablo 1 Fire Wall: 12 flame sprites, a hit attempt every 0.05 s, duration 8 + 8 x spell level seconds, and stacked walls on one tile multiply damage. For Zelda ALttP the cited mechanics are about lighting torches (Lantern close range, Fire Rod at range). Bush burning is only confirmed for the GBA remake.

### Cited findings
- Diablo 1 Fire Wall: the flame tries to hit every 0.05 s (20/s), "160 + 160 x Slvl" attempts in total. Duration 8 + 8 x Slvl s (8 s from a scroll or staff at Slvl 0). Damage per hit "(rnd[10] + rnd[10] + Clvl + 2) / 8", so it scales with character level. 12 flames per cast, with the centre tile doubled. Stacks multiply. Community strategy page, not official. https://realmsbeyond.net/diablo/stratcdfirewall.html
- Other community pages give different Fire Wall formulas, e.g. (2·slvl + 4·Mag/8) per frame. Sources conflict. https://diablobytes.pages.dev/diablo-i/mechanics
- ALttP: the Lantern lights torches at close range. The Fire Rod shoots fire at range, lights out-of-reach torches and drains magic. The GBA remake's lamp can burn single bushes or grass patches. https://zelda-archive.fandom.com/wiki/Lantern , https://zelda-archive.fandom.com/wiki/Fire_Rod

### Inferences
- Diablo's 20 Hz hit rate and stacking are a warning for a server-authoritative MMO. Tibia's 9 to 10 s ticks are much cheaper to network and easier for players to read.

### Gaps
- Not covered: NES/SNES/Genesis/GBA flame sprite frame counts and palettes, Secret of Mana, Chrono Trigger, FF explosions, Ultima VII fire fields and campfires. These need a follow-up pass, ideally from sprite rip sites (The Spriters Resource) for frame counts, viewed only, without downloading images.

---

## Summary table of cheap fire algorithms found

| Technique | Per-pixel cost | Palette | Rise speed | Source |
|---|---|---|---|---|
| DOOM PSX fire | 1 read, 1 write, 1 rand | 37 | 1 px/frame | fabiensanglard.net |
| Parusel avg-4 minus 1 | 4 reads, shift, sub | 256 | 1 px/frame | gamedev.net 1999 |
| Lode 3+1 below ÷4.03 | 4 reads, mul, div | 256 HSL | 2 px/frame | lodev.org |
| Hugo Elias + cooling map | 4 reads + 1 map read | 256 | 1 px/frame | Hugo Elias (archive) |
| Palette cycling | 0 (palette rotate) | 256, a few cycling ranges | n/a | Canvas Cycle |

## Sources
- https://fabiensanglard.net/doom_fire_psx/
- https://lodev.org/cgtutor/fire.html
- https://web.archive.org/web/2016/http://freespace.virgin.net/hugo.elias/models/m_fire.htm
- https://web.archive.org/web/2010/http://www.gamedev.net/reference/articles/article222.asp
- https://archive.gamedev.net/archive/reference/articles/article1287.html (403, snippet only)
- https://swag.outpostbbs.net/EGAVGA/0204.PAS.html (not opened)
- https://80.lv/articles/color-cycling-from-the-90s-returns-with-html5
- https://dcmpx.remotevs.com/com/effectgames/www/PL/effect/article-Q_A_with_Mark_J_Ferrari.html
- https://daverupert.com/2018/09/color-cycling-image-pixels-with-workers/
- https://tibia.fandom.com/wiki/Fire_Field_Rune
- https://tibia.fandom.com/wiki/Fire_Bomb_Rune
- https://tibia.fandom.com/wiki/Fire_Wall_Rune
- https://tibia.fandom.com/wiki/Fire_Field
- https://tibia.fandom.com/wiki/Burning
- https://github.com/otland/forgottenserver/blob/1.4/data/items/items.xml
- https://github.com/otland/forgottenserver/blob/1.4/src/items.cpp
- https://github.com/otland/forgottenserver/blob/1.4/src/condition.cpp
- https://github.com/otland/forgottenserver/blob/1.4/src/game.h
- https://github.com/tmewett/BrogueCE/blob/master/src/brogue/Time.c
- https://github.com/tmewett/BrogueCE/blob/master/src/brogue/Globals.c
- https://crawl.chaosforge.org/Cloud
- https://nethackwiki.com/wiki/Fire_trap
- https://nethackwiki.com/wiki/Scroll_of_fire
- https://realmsbeyond.net/diablo/stratcdfirewall.html
- https://diablobytes.pages.dev/diablo-i/mechanics
- https://zelda-archive.fandom.com/wiki/Lantern
- https://zelda-archive.fandom.com/wiki/Fire_Rod
