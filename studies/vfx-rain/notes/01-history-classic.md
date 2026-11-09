# 01 — History & classic era: rain in 2D / top-down games (8-bit to ~2005)

Researcher angle: the oldest and simplest techniques first.
- Everything under "Cited findings" has a URL.
- "Inferences" are my reading and are not verified.
- About 36 tool calls were used, slightly over the target.

The best numbers came from reading source directly:
- **pokeemerald** decomp (Pokémon Emerald, GBA 2004)
- **zelda3** C reimplementation of the ALttP ROM (SNES 1991)
- **Exult**, a reimplementation of the Ultima VII engine (1992)
- **Ragnarok Online client** disassembly (2004 build)

---

## Q1. How did classic games draw rain cheaply?

### Takeaway
There are five cheap families, all of which still map well to Godot 4 Compatibility:

1. **One full-screen rain overlay layer, blended 50%, flipped between 4 pre-drawn frames.**
   - Example: ALttP, on SNES BG1 with colour math.
   - There is zero per-drop CPU work. The "animation" is just moving the layer's scroll to a different quadrant of a 512×512 tilemap every 4 frames.
   - It scrolls at half the camera speed, which gives parallax.
2. **A tiny pool of streak sprites whose landing spot is chosen first.**
   - Example: Pokémon Emerald, with **10, 16 or 24 sprites of 16×32 px**.
   - Each drop picks a random 8-px grid cell as its landing point, then "rewinds" by velocity × fall-frames to get its spawn point.
   - It falls in screen space for a fixed 12–18 frames, then plays a 7–10 frame splash that is pinned to the world.
3. **A few hundred 1-shape particles on a 10 Hz tick with a diagonal step and a dirty-rect redraw.**
   - Example: Ultima VII (via Exult), with **200 drops** moving (+6, +6) px per 100 ms tick.
   - Ramp-up adds 0–4 drops per tick.
4. **3D line primitives plus a ground "splash" quad per drop.**
   - Example: Ragnarok Online's EF_RAIN (2002–2004).
   - It was **removed from the client around 2004**, probably for performance. This is a cautionary tale about dense rain in an MMO.
5. **Palette darkening for the storm, plus a palette swap for lightning.**
   - Every example above does this. It recolours the whole scene for the cost of rewriting the palette or colour-math registers.
   - Details are in Q2.

### Cited findings

**Pokémon Emerald (GBA 2004)**

Constants and sprites:
- `MAX_RAIN_SPRITES = 24` (https://github.com/pret/pokeemerald/blob/master/include/constants/field_weather.h).
- Rain sprites are **16×32, 4bpp OAM**, priority 1, palette slot 2 (https://github.com/pret/pokeemerald/blob/master/src/field_weather_effect.c, "WEATHER_RAIN" section).

Animations (the sheet `graphics/weather/rain.png` holds 6 frames at tile offsets 0, 8, 16, 24, 32, 40):
- Fall animation: frame 0, held.
- Light splash: tile 8 for 3 frames, then 32 for 2, then 40 for 2 (7 frames total).
- Heavy splash: tile 8 for 3, then 16 for 3, then 24 for 4 (10 frames).

Velocity, in Q28.4 fixed point (`sRainSpriteMovement`):
- Rain and thunderstorm: (−0x68, +0xD0) = **(−6.5, +13) px/frame**.
- Downpour: (−0xA0, +0x140) = **(−10, +20) px/frame**.
- Both slant about **26.6° from vertical**, falling to the left. Downpour is 1.54× faster at the same angle.

Fall duration (`sRainSpriteFallingDurations`):
- **18 frames** for rain, **12 frames** for downpour.
- The maximum random initial wait is 7 and 10 frames.
- Both cover about 260 px of travel before the splash.

Landing-first spawn (`StartRainSpriteFall`):
- `rand % 600` gives tileX = r % 30 and tileY = r / 30. That is a cell on the **30×20 grid of 8-px tiles**, i.e. the whole 240×160 screen.
- The position is then "rewound": `pos -= velocity × numFallingFrames`.
- Result: splashes are uniformly distributed on screen.
- The RNG is a per-sprite LCG seeded at 361 (`ISO_RANDOMIZE2`).

Screen space vs world space:
- While falling, `coordOffsetEnabled = FALSE`, so the drop ignores camera scroll.
- At the splash it is set to `TRUE` and the camera offset is subtracted, so the splash stays fixed to the ground as the player walks.

Desync:
- Sprite *i* is pre-simulated by `i*9` frames at creation (`InitRainSpriteMovement`), so drops never fall in lockstep.

Counts and ramp:

| Weather | Target sprites | Ramp | Full-strength time |
|---|---|---|---|
| Rain | 10 | +1 every 8 frames | 80 frames |
| Thunderstorm | 16 | +1 every 4 frames | 64 frames |
| Downpour | 24 | +1 every 4 frames | 96 frames |

- When the weather ends, the count is ramped back to 0 the same way.
- Weather changes between rain types skip the teardown (`Rain_Finish` returns early if the next weather is rain, thunderstorm or downpour).

Ambient audio:
- Looping SE_RAIN, SE_DOWNPOUR or SE_THUNDERSTORM, each with a matching `_STOP` tail sound (`SetRainStrengthFromSoundEffect`, `PlayRainStoppingSoundEffect` in https://github.com/pret/pokeemerald/blob/master/src/field_weather.c).

**Zelda: A Link to the Past (SNES 1991), from zelda3 `src/overworld.c`** (https://github.com/snesrev/zelda3/blob/master/src/overworld.c)

Layer setup:
- The rain is overlay **0x9F**, loaded into **BG1**.
- Register setup on load:
  - `TS=1`: BG1 is on the sub screen.
  - `TM=0x16`: BG2, BG3 and OBJ are on the main screen.
  - `CGWSEL=0x82`: math source is the sub screen.
  - `CGADSUB=0x72`.
- `CGADSUB` bit layout is `MHBO4321` (add/sub, half, backdrop, OBJ, BG4..1) per https://snes.nesdev.org/wiki/Color_math.
  - So 0x72 = **add + half on BG2, OBJ and backdrop**, i.e. a **50% blend of the rain overlay over the whole scene**.

Animation (`OverworldOverlay_HandleRain`):
- Every 4 frames (`frame_counter & 3`) a 2-bit counter advances.
- BG1 H-scroll is offset by tables X={1,0,1,0}<<8 and Y={0,17,0,17}<<8.
- Mod the 10-bit scroll register that means ±256 px steps.
- My inference: it cycles through 4 quadrants of a 512×512 overlay map. That is 4 pre-drawn rain frames at 15 Hz with a 16-frame loop.

Parallax:
- In the camera-scroll code, overlays other than 0x95/0x9E (¼ speed) and 0x97/0x9D (auto-drift fog) take `r4 >>= 1`.
- So the rain overlay scrolls at **½ camera speed**.

When it rains:
- On the whole overworld while `sram_progress_indicator < 2`, i.e. until Zelda is rescued from the castle.
- On Dark World screen **0x70 (Misery Mire)** until the Ether-medallion event flag (`save_ow_event_info[0x70] & 0x20`) is set.

**Ultima VII (1992), via the Exult reimplementation** (https://github.com/exult/exult/blob/master/effects.cc)
- `#define MAXDROPS 200`.
- `Raindrop = Basicdrop<3,7,6,false>`: shape frames 3..7 ping-pong in sprites.vga, moving **+6 px x and +6 px y each tick** (a 45° diagonal).
- The effect re-queues every **100 ms**, i.e. a 10 Hz update.
- Respawn: when a drop leaves the window it jumps to `rand % (w − w/8)`, `rand % (h − h/4)` in world pixels. It spawns anywhere on screen, not at the top.
- Gradual start: `num_drops += rand%5` per tick, up to 200.
- Gradual end: during the last 2500 ms, `num_drops -= rand%15` per tick.
- **Rain is not drawn while the avatar is inside a building.**
- Only the dirty rectangles around drops are repainted (`add_dirty`, enlarged by half a tile).
- Snow (`Snowflake<13,20,1>`) uses the same particle struct at 1 px per tick.
- Caveat: Exult is a fan reimplementation, so these values are its approximation of the original.

**Ragnarok Online client, EF_RAIN (ID 161)** (http://nn.ai4rei.net/dev/ref/rorain/)
- The effect was reconstructed from the `2004-04-19aSakexe.exe` disassembly.
- Each emission is a white **3D line** that starts 200 units above ground at the player ± (100, 50) random units and lives **40 frames**.
- It is paired with a ground quad textured `rain_gnd.tga`:
  - size 30×70, roll 90°
  - alpha fades in at 255×0.025 per frame
  - a second variant moves at speed 5
- No sound.
- "Until around 2004 ... rain ... has since been removed from the client." The author suspects performance problems in dense scenes.

**Mark Ferrari colour cycling (Living Worlds).**
- Rain and snow are painted as "paths" of palette indices and animated purely by palette rotation.
- This is already documented in the snow study notes (`../vfx-snow-topdown-pixel/01-history-classic.md`, source: https://dcmpx.remotevs.com/com/effectgames/www/PL/effect/article-Q_A_with_Mark_J_Ferrari.html).
- Demo: https://experiments.withgoogle.com/canvas-cycle

**Ultima Online (1997).**
- The server sends packet **0x65 Set Weather** (4 bytes: cmd, type, num, temperature).
- Types: 0 = rain, 1 = "fierce storm", 2 = snow, 3 = "storm brewing", 0xFF = off.
- **Maximum 70 effects on screen.**
- Weather times out after **6 min on old clients and 10 min on new clients**. To mix snow into rain, set `num` to rain count + snow count.
- Source: https://moongate-community.github.io/moongate/articles/networking/packet-reference/0x65.html

### Inferences
- **The Emerald "pick the landing cell, rewind the spawn" trick is the best single idea for top-down rain.**
  - In top-down the "ground" is the whole screen, so a streak must end somewhere on the visible floor, not at the bottom edge.
  - Choosing the landing point first gives a uniform splash distribution and lets you query the tile under it, e.g. water → ripple, roof → drip, dirt → wet.
  - It also needs no collision test.
- **Screen-space fall plus world-space splash** is why the GBA rain doesn't "smear" when the player walks. The streaks are the weather; the splashes belong to the ground. Adopt this split.
- **A 10–24 sprite pool is enough at 240×160.**
  - At Asterion's internal resolution, scale by screen area: roughly 1 drop per 1,600–4,000 px² for light rain and 1 per 1,000 px² for heavy rain.
  - The tier knobs are count, speed (×1.5) and splash animation, all at the same slant angle.
- **The ALttP overlay is the cheapest "heavy storm" possible**: one texture, 4 frames, 50% blend, ½-speed parallax.
  - In Godot this is a `TextureRect`/`Sprite2D` on a `CanvasLayer` with a 4-frame atlas or UV offset and a mix/add blend.
  - It can be stacked under a sparse Emerald-style sprite layer for depth.
- The Exult approach (200 drops at 10 Hz, 45° slant) shows that a low update rate is acceptable for rain because streaks are already motion-blurred visually. That is a useful budget lever on mobile.

### Gaps
- I did not find how FF6 (Zozo), Chrono Trigger, Secret of Mana, EarthBound, Breath of Fire or Shining Force render rain (BG3 overlay vs sprites). A layer viewer would settle it.
- I did not verify the ALttP overlay graphic itself (whether 4 quadrants really hold 4 drop frames). I inferred it from the scroll offsets.
- No C64/Amiga or HDMA rain write-up found.
- I did not inspect `rain.png` (which frame is a streak vs a splash).

---

## Q2. Storm darkening and lightning: palette tricks and timing

### Takeaway
Every classic implementation uses **one global palette operation for lightning**, plus **a thunder sound with a random delay**.
- No game drew bolts in the overworld rain examples I found.
- The best variant is Emerald's **contrast-preserving flash**: highlights go to full white while shadows lift only half as much, so the scene stays readable during the flash.

### Cited findings

**Pokémon Emerald colour maps** (https://github.com/pret/pokeemerald/blob/master/src/field_weather.c, `BuildColorMaps`, `ApplyColorMap`)

Table structure:
- There are 19 colour maps (`NUM_WEATHER_COLOR_MAPS`), each a 32-entry lookup table applied per 5-bit RGB channel.
- Maps 0–2 darken by `c/16` per step.
- After that, brightness rises linearly to 31. For shadow values (`c < 12`) the excess is halved (`curBrightness -= diff/2`): "This creates a high contrast effect, used in the thunderstorm weather."
- There are two table sets:
  - "darkenedContrast", for most palettes.
  - "contrast", with no darkening, for palettes flagged `COLOR_MAP_CONTRAST`.

Rain darkening:
- All three rain types set `targetColorMapIndex = 3` and `colorMapStepDelay = 20` (field_weather_effect.c).
- Index 3 maps to table [2], i.e. **c × 13/16 ≈ 81% brightness**.
- The fade advances one step every 20 frames, so it reaches full dark in about 60 frames.

Lightning state machine (`Thunderstorm_Main`; Downpour uses it too):

| Step | Detail |
|---|---|
| Wait | **360–720 frames** (6–12 s) between cycles |
| Short bolts | 1 or 2 per cycle: colour map **19 (flash)** for **6–8 frames**, then back to 3 |
| Gap | **60–75 frames** between short bolts |
| Long bolt | 50% chance after the short bolts: wait 60–75 frames, flash 19 held for **30–45 frames**, then a gradual fade 19→3 (`ApplyWeatherColorMapIfIdle_Gradual(19,3,5)`) |

Thunder sound:
- Queued only on the final bolt of a cycle.
- Delay is random 0–19 frames for a short bolt and 0–99 frames for a long bolt.
- It picks SE_THUNDER or SE_THUNDER2 at 50/50 and waits if another SFX is playing.

**ALttP**
- The flash is a colour-math toggle: `CGADSUB` goes 0x72 (add + half) → **0x32 (add, no half)**. Adding the overlay at full strength instead of averaging brightens the scene.
- Schedule within the 256-frame `frame_counter` loop:
  - flash on frames **3–4**
  - flash on frames **36–43**, with thunder SFX 54 triggered at frame 36
  - flash on frames **88–89**
- So there are 3 flashes per ~4.3 s, deterministic and looping.
- Source: https://github.com/snesrev/zelda3/blob/master/src/overworld.c

**Ultima VII (Exult)**
- Lightning sets the palette to `PALETTE_LIGHTNING` and plays SFX 62 **at the same moment** (no delay).
- The flash lasts **25–50 ms**.
- Next wait: **4000–6999 ms**, or with a 1-in-50 chance a quick re-flash after 40–280 ms.
- Lightning is suppressed in dungeons.
- The Storm effect also spawns `Clouds_effect`. Rain starts 20–1020 ms after the storm, and lightning 0–500 ms after the rain.
- Source: https://github.com/exult/exult/blob/master/effects.cc

### Inferences
- **Recommended lightning recipe:**
  - 1–2 short flashes (6–8 frames), optionally one long flash (30–45 frames) that fades over about 80 frames.
  - 6–12 s between cycles.
  - Thunder delayed 0–1.7 s.
  - This matches Emerald and is well tuned. ALttP's fixed 256-frame loop reads as mechanical if you watch for more than about 20 s.
- In Godot, do it as a palette-LUT shader uniform (`flash_amount`) with the Emerald curve: `out = mix(c, 1.0, k)` for highlights and `mix(c, 1.0, k*0.5)` for shadows.
- The 81% storm darkening is a single uniform. Lightning can also drive the same LUT index used by the snow study's palette lighting.

### Gaps
- No source found for lightning in FF6, Chrono Trigger or Diablo II.
- No measured flash-to-thunder timings from a real ALttP ROM beyond the zelda3 port, which should be ROM-accurate.

---

## Q3. Puddles, splashes, ripples and wet ground in classic 2D

### Takeaway
Classic games had **no dynamic wetness**.
- Puddles are **static tiles** with a behaviour flag that triggers a splash sprite and a sound when walked through.
- Water tiles get **ripple sprites** under walking characters.
- Rain splashes are the same generic sprite whatever they land on.
- The only "ground reacts to rain" element is the per-drop ground splash (Emerald) or the ground quad (RO).

### Cited findings

**Pokémon Emerald** (https://github.com/pret/pokeemerald/blob/master/src/metatile_behavior.c, `src/event_object_movement.c`, `src/field_effect_helpers.c`, `src/data/field_effects/field_effect_objects.h`)

Puddle splash:
- `MB_PUDDLE` is a metatile behaviour.
- A splash triggers when **both current and previous tile are puddles** (`GetGroundEffectFlags_Puddle`), and is suppressed while jumping.
- `FLDEFF_SPLASH` is a **16×8 sprite, 2 frames × 4 ticks** (8 frames), with a longer variant of 4,4,6,6,8,8 ticks.
- It plays `SE_PUDDLE` and follows the walker's feet (`y2 = height/2 − 4`).

Ripples:
- `MetatileBehavior_HasRipples` is true for `MB_POND_WATER`, `MB_PUDDLE` and `MB_SOOTOPOLIS_DEEP_WATER`.
- `FLDEFF_RIPPLE` is a **16×16 sprite with 5 frames**, timed 12,9,9,9,9,9,11,11 ticks (**79 frames**, about 1.3 s), and spawns under the walker.

Rain and puddles:
- No code links rain to puddles or ripples. The rain splash (Q1) is identical on land and on water.

**Ragnarok Online**
- Each drop has a ground quad (`rain_gnd.tga`, 30×70) that fades in over about 40 frames. It may have been a splash or spray; its visual is unknown.
- Source: http://nn.ai4rei.net/dev/ref/rorain/

**Diablo II**
- Levels.txt has a `Rain` column ("Does it Rain/Snow in this Level (1=yes, 0=no)").
- It also has an unused `Mud` column, described as planned for pre-beta rain but never shipped.
- Source: https://www.d2mods.info/forum/kb/viewarticle?a=232

### Inferences
- **The gap is the opportunity.** Classic games never connected rain to the ground state. The snow study's per-pixel depth byte idea maps directly onto a "wetness byte" (darken plus specular via a palette shift).
- Emerald's two-tile rule ("current AND previous tile are puddles") is a neat anti-spam rule for splash SFX. Reuse it for any footstep-in-liquid effect.
- Cheapest "rain on water" upgrade: in the Emerald landing-first scheme, if the landing tile is water, play a 16×16 ripple (the 79-frame animation, shortened) instead of the splash. That costs one tile lookup per drop.
- Diablo II's cut Mud column suggests even AAA in 2000 found rain-to-ground state worth considering but not worth shipping.

### Gaps
- No classic example found of rain-created puddles, wet-to-dry tiles, drip sprites from eaves, or rain hissing on fire.
- I did not verify whether FRLG, DPPt or HGSS overworld rain adds ripples on water.

---

## Q4. Gameplay effects of rain in classic games (with numbers)

### Takeaway
Rain was mostly **elemental math** (Pokémon, FFT), **vision and movement** (Advance Wars, Fire Emblem, FFT) or **economy** (Harvest Moon waters crops).

Simple, legible rules that top-down designs can adopt:
- **+50% / −50%** elemental modifier (Pokémon).
- **+25% / −25%** elemental modifier (FFT).
- **−1 vision** (Advance Wars).
- **+1 move cost on open ground** (AW, FE7).
- **Rain = free watering** (Harvest Moon).

### Cited findings

**Pokémon (battle rain introduced in Gen II, 1999; overworld rain in Gen III, 2002)**
- Effects:
  - Water moves +50%, Fire moves −50%.
  - Thunder (later also Hurricane) skips the accuracy check.
  - Solar Beam power is halved.
  - Moonlight, Synthesis and Morning Sun heal ¼ max HP (half that in Gen II).
- Duration:
  - Rain Dance: 5 turns, or 8 with Damp Rock.
  - Drizzle before Gen VI lasted until replaced.
- Gen II called battle rain "downpour".
- Source: https://m.bulbapedia.bulbagarden.net/wiki/Rain

Overworld rain locations in Gen III:
- **Routes 119 and 120**, and Route 123 on some days.
- Routes 105, 125, 127 and 129 when Marine Cave is present (Emerald).
- Many coastal maps after Kyogre awakens.
- **Thunderstorm is cosmetic in Gen III.** Route 119 cycles rain, thunderstorm and clear over a four-day cycle.
- Gen IV: Route 212 south always rains, and Route 215 always.
- Source: same Bulbapedia page.

Overworld to battle:
- In Emerald, overworld rain, thunderstorm or downpour **starts every battle with permanent rain** (`B_WEATHER_RAIN_TEMPORARY | B_WEATHER_RAIN_PERMANENT`, in `ABILITYEFFECT_SWITCH_IN_WEATHER`).
- Source: https://github.com/pret/pokeemerald/blob/master/src/battle_util.c

**Final Fantasy Tactics (PS1 1997)** (https://finalfantasy.fandom.com/wiki/Weather_(Tactics))
- Weather types: Light Rain, Rainstorm, Thunderstorm.
- Rainstorm and Thunderstorm give **Lightning ×5/4, Fire ×3/4**.
- Bow and crossbow evade is ×1.33 in rain by day and **×1.80 at night**.
- Swamp and marsh tiles cost **2 Move per tile in a Rainstorm and 3 in a Thunderstorm**.
- Weather is fixed for the whole battle.
- Random-battle odds: Day Thunderstorm is **2.5% in dry months vs 40% in wet months**.
- "Light rain and rainstorm look similar"; the visual difference is drop speed and frequency.

**Advance Wars 1 & 2 (GBA 2001/2003)** (https://advancewars.fandom.com/wiki/Rain)
- Rain adds **+1 move cost on Plains and Woods for land vehicles**. Drake and Sturm are immune; Olaf's units treat rain as snow.
- With Fog of War on, vision is −1.

**Advance Wars: Dual Strike (2005) and Days of Ruin (2008)** (same source)
- Rain **forces Fog of War on**.
- In Days of Ruin, unit vision drops to 1 and building vision to 0.
- Drake raises the random-rain chance by 7%.

**Fire Emblem: The Blazing Blade (GBA 2003)** (https://www.fireemblemwiki.org/wiki/Rain)
- Rain appears in Ch. 10 and Ch. 14.
- Outdoor plains cost **2 for foot units and Nomads, 3 for other mounted units**. Indoor tiles are unaffected.
- No other effects.
- In The Binding Blade, rain is cosmetic. The Sacred Stones has unused weather code.

**Harvest Moon (SNES 1996)** (https://strategywiki.org/wiki/Harvest_Moon/Seasons)
- Rain falls in spring, summer and fall, and **waters crops automatically**, except crops planted that day.
- Both rain and snow **destroy some fence posts**.
- The TV shows a forecast.
- A localization note confirms the forecast line about heavy rain with lightning (https://legendsoflocalization.com/?p=3808).

**Final Fantasy VI (SNES 1994)**
- Zozo is a "town ... where it constantly rains". This is atmosphere tied to the location; no mechanics found.
- Source: https://na.finalfantasy.com/topics/448

**Ultima VII**
- Rain is not drawn while the avatar is inside a building (a scene effect, not a stat effect).
- Source: https://github.com/exult/exult/blob/master/effects.cc

**Later Zelda, for contrast (3D, out of era)**
- Ocarina of Time's Song of Storms summons rain that fills an oasis.
- Majora's Mask rains on Day 2, 7AM–12AM, which changes fish behaviour.
- Source: https://zelda.fandom.com/wiki/Rain

### Inferences
- **The best fit for a Tibia-like MMORPG** is a small, readable rule set:
  - fire spells −25% and lightning +25%
  - ranged evade up in heavy rain
  - −1 tile of light/vision radius in a storm
  - open-ground move cost unchanged (an MMO punishes movement penalties)
  - crops and plants auto-watered
- FFT's month-weighted odds table is a clean way to drive weather from a calendar.
- FFT's note that tiers differ only in drop speed and frequency matches Emerald's tiering (count + speed) and confirms that this is enough to sell intensity.

### Gaps
- No numbers found for Front Mission, Shining Force or Breath of Fire weather. I could not confirm FF6 Zozo visuals.

---

## Q5. Tibia and MMO precedents
- Tibia: no evidence of a rain or weather system. The only "rain" found is the spell text "a rain of holy fire" in update 8.10 (https://tibia.fandom.com/wiki/Updates/8.10). This is an absence of evidence, not proof.
- Ultima Online:
  - It had server-driven rain and snow with a hard cap of 70 particles and timed expiry (Q1).
  - That is a template for server-authoritative weather: send `{type, count}` and let each client simulate locally.
- Ragnarok Online shipped rain and then removed it around 2004, probably for performance (Q1).

**Inference:** for Asterion Online, synchronise weather state (type, intensity, seed, wind) from the server and keep particles fully client-side. Cap the particle count, as UO did.

---

## Summary table of concrete numbers

| Game | Number | Source |
|---|---|---|
| Pokémon Emerald | 10 / 16 / 24 rain sprites (rain / thunder / downpour), 16×32 4bpp | pokeemerald field_weather_effect.c |
| Pokémon Emerald | velocity (−6.5, 13) or (−10, 20) px/frame, 26.6° slant; fall 18 or 12 frames | same |
| Pokémon Emerald | ramp +1 sprite per 8 frames (rain) or 4 frames (storm/downpour) | same |
| Pokémon Emerald | splash 7 frames (light) or 10 frames (heavy); landing on a random 8-px cell of a 30×20 grid | same |
| Pokémon Emerald | storm darkening to 13/16 brightness, 20 frames per step | field_weather.c / field_weather_effect.c |
| Pokémon Emerald | lightning: 1–2 short flashes of 6–8 f, gap 60–75 f, 50% long flash of 30–45 f, cycle 360–720 f, thunder delay 0–19 or 0–99 f | field_weather_effect.c |
| Pokémon Emerald | puddle splash 16×8, 8 f; ripple 16×16, 79 f | field_effect_objects.h |
| ALttP | BG1 overlay 50% blend (CGADSUB 0x72), 4 frames at 15 Hz, ½ parallax; flashes at frames 3–4, 36–43, 88–89 of a 256-frame loop | zelda3 overworld.c |
| Ultima VII (Exult) | 200 drops, +6,+6 px per 100 ms; ramp +0–4 per tick; fade-out −0–14 per tick in the last 2.5 s; lightning 25–50 ms, every 4–7 s | exult effects.cc |
| Ultima Online | ≤70 weather effects; 6 or 10 min timeout | moongate 0x65 doc |
| Ragnarok Online | line from 200 units up, ±100×±50 spread, 40-frame life, 30×70 ground quad | ai4rei rorain |
| FFT | Lightning ×1.25, Fire ×0.75; bow evade ×1.33 (day) or ×1.80 (night); marsh cost 2 or 3 | FF wiki |
| Advance Wars | −1 vision; +1 move cost on plains and woods (vehicles); forced fog of war (DS/DoR) | AW wiki |
| FE7 | plains cost 2 (foot) or 3 (mounted) in rain | FE wiki |
| Pokémon | Water ×1.5, Fire ×0.5, Thunder never misses; 5 turns (8 with Damp Rock) | Bulbapedia |

---

## Game examples with "see it in action" references (20)
1. Pokémon Emerald: rain, thunderstorm and downpour. https://github.com/pret/pokeemerald/blob/master/src/field_weather_effect.c ; https://m.bulbapedia.bulbagarden.net/wiki/Rain
2. Pokémon Ruby/Sapphire: Route 119/120 rain. https://bulbapedia.bulbagarden.net/wiki/Hoenn_Route_119
3. Zelda: A Link to the Past: opening rainstorm and Misery Mire. https://github.com/snesrev/zelda3/blob/master/src/overworld.c
4. Ultima VII: storm, rain and lightning (Exult). https://github.com/exult/exult/blob/master/effects.cc
5. Ultima Online: server weather packet. https://moongate-community.github.io/moongate/articles/networking/packet-reference/0x65.html
6. Ragnarok Online: removed EF_RAIN, with demo videos linked on the page. http://nn.ai4rei.net/dev/ref/rorain/
7. Final Fantasy Tactics: rain and thunderstorm modifiers. https://finalfantasy.fandom.com/wiki/Weather_(Tactics)
8. Advance Wars 1/2: rain movement and vision. https://advancewars.fandom.com/wiki/Rain
9. Advance Wars: Dual Strike / Days of Ruin: rain forces fog of war. https://advancewars.fandom.com/wiki/Rain
10. Fire Emblem: The Blazing Blade: rain movement costs. https://www.fireemblemwiki.org/wiki/Rain
11. Fire Emblem: The Binding Blade: cosmetic rain trial map. https://www.fireemblemwiki.org/wiki/Rain
12. Fire Emblem: The Sacred Stones: unused rain. https://www.fireemblemwiki.org/wiki/Rain
13. Harvest Moon (SNES): rain waters crops and breaks fences. https://strategywiki.org/wiki/Harvest_Moon/Seasons
14. Final Fantasy VI: Zozo, the town where it always rains. https://na.finalfantasy.com/topics/448
15. Diablo II: per-level Rain flag and cut Mud. https://www.d2mods.info/forum/kb/viewarticle?a=232
16. Pokémon Gold/Silver: battle rain introduced, called "downpour". https://m.bulbapedia.bulbagarden.net/wiki/Rain
17. Pokémon Diamond/Pearl/Platinum: Route 212/215 permanent rain (2006). https://m.bulbapedia.bulbagarden.net/wiki/Rain
18. Mark Ferrari's Living Worlds: colour-cycled rain. https://experiments.withgoogle.com/canvas-cycle
19. Zelda: Ocarina of Time / Majora's Mask: summoned or scheduled rain affecting the world (3D, for contrast). https://zelda.fandom.com/wiki/Rain
20. Tibia: no rain found (negative result). https://tibia.fandom.com/wiki/Updates/8.10

---

## Top takeaways for Asterion Online and Godot
1. **Landing-first drops** (Emerald): pick the ground cell, rewind the spawn, fall in screen space, then splash in world space with a lookup of the tile type.
2. **Tiering by count and speed at a constant angle**: 10 / 16 / 24 drops per 240×160, ×1.54 speed for downpour, a heavier splash animation, and ramp in over 64–96 frames.
3. **A cheap storm backdrop**: an ALttP-style 4-frame overlay at a 50% blend with ½ parallax, under the sprite drops.
4. **Palette LUT darkening (≈81%) and a contrast-preserving lightning flash** with Emerald timing, plus delayed thunder.
5. **Indoor suppression** (U7) and **server weather state with client particles and a cap** (UO). Remember RO's removal as the risk of overdoing density.
6. **What the classics didn't have**: wetness and drying state, rain ripples on water tiles, eave drips, and fire/steam interaction. That is where this study can add something new.

## Sources
- https://github.com/pret/pokeemerald/blob/master/src/field_weather_effect.c
- https://github.com/pret/pokeemerald/blob/master/src/field_weather.c
- https://github.com/pret/pokeemerald/blob/master/include/constants/field_weather.h
- https://github.com/pret/pokeemerald/blob/master/src/field_effect_helpers.c
- https://github.com/pret/pokeemerald/blob/master/src/event_object_movement.c
- https://github.com/pret/pokeemerald/blob/master/src/metatile_behavior.c
- https://github.com/pret/pokeemerald/blob/master/src/data/field_effects/field_effect_objects.h
- https://github.com/pret/pokeemerald/blob/master/src/battle_util.c
- https://github.com/snesrev/zelda3/blob/master/src/overworld.c
- https://snes.nesdev.org/wiki/Color_math
- https://github.com/exult/exult/blob/master/effects.cc
- http://nn.ai4rei.net/dev/ref/rorain/
- https://moongate-community.github.io/moongate/articles/networking/packet-reference/0x65.html
- https://m.bulbapedia.bulbagarden.net/wiki/Rain
- https://finalfantasy.fandom.com/wiki/Weather_(Tactics)
- https://advancewars.fandom.com/wiki/Rain
- https://www.fireemblemwiki.org/wiki/Rain
- https://strategywiki.org/wiki/Harvest_Moon/Seasons
- https://legendsoflocalization.com/?p=3808
- https://na.finalfantasy.com/topics/448
- https://www.d2mods.info/forum/kb/viewarticle?a=232
- https://tcrf.net/Diablo_II (no rain content found)
- https://tibia.fandom.com/wiki/Updates/8.10
- https://zelda.fandom.com/wiki/Rain
- https://zladx.github.io/posts/special-effects-in-zelda-links-awakening (no rain detail found)
- https://experiments.withgoogle.com/canvas-cycle
- Blocked or not on the allowlist: bulbapedia.bulbagarden.net/wiki/Weather (I used the m.bulbapedia Rain page instead) and finalfantasy.fandom.com/wiki/Zozo.
