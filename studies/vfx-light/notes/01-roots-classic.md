# 01 — THE ROOTS: how classic games lit their worlds (1980s–2010s)

Researcher angle: simplest first, exact numbers, mostly from **primary source code** (id DOOM/Quake, OTClient, The Forgotten Server, DevilutionX, NetHack, Angband, DCSS, ServUO) and wiki APIs (TibiaWiki, Minecraft Wiki, Terraria Wiki, Don't Starve Wiki, RimWorld Wiki, Fire Emblem Wiki, Factorio Wiki, Stardew Wiki).
Collected: 2026-11-09. Source files were read directly from GitHub raw and through MediaWiki `api.php?action=parse` calls. Where a fact comes from memory and was not re-checked this session, it is marked **[unverified]**.

---

## Q1. DOOM (1993): sector light, COLORMAP, light specials

**Takeaway:** each sector gets ONE light byte (0–255). The renderer only uses the top 4 bits (16 levels). Each level picks one of 32 palette remap tables ("colormaps"), and distance shifts the pick darker. Flicker comes from tiny state machines that run at 35 Hz, with random timings. This is the cheapest "real-feeling" lighting ever shipped, and it maps directly onto a top-down tile game: tile/room light byte + palette LUT + per-room flicker thinker.

**Cited findings (id Software source, linuxdoom-1.10)**
- `r_main.h`: `LIGHTLEVELS 16`, `LIGHTSEGSHIFT 4` (lightlevel>>4), `MAXLIGHTSCALE 48`, `LIGHTSCALESHIFT 12`, `MAXLIGHTZ 128`, `LIGHTZSHIFT 20`, `NUMCOLORMAPS 32`. https://github.com/id-Software/DOOM/blob/master/linuxdoom-1.10/r_main.h
- `R_InitLightTables` (r_main.c) computes `startmap = ((LIGHTLEVELS-1-i)*2)*NUMCOLORMAPS/LIGHTLEVELS`, i.e. (15−i)×4. Then for each depth bucket it uses `level = startmap - scale/DISTMAP` with `DISTMAP 2`, clamped to 0..31, and stores `zlight[i][j] = colormaps + level*256`. So "light diminishing" is a 16×128 table of pointers to 256-byte palette remaps. https://github.com/id-Software/DOOM/blob/master/linuxdoom-1.10/r_main.c
- Light specials (p_spec.c `P_SpawnSpecials` → p_lights.c). Constants are in p_spec.h: `GLOWSPEED 8`, `STROBEBRIGHT 5`, `FASTDARK 15`, `SLOWDARK 35`. The game runs at 35 tics/s.
  - **Special 1, "flickering lights" (`T_LightFlash`)**: `maxtime=64`, `mintime=7`. Each time the timer runs out it toggles. Going to dark sets the dark time to `(P_Random()&7)+1`, so **1–8 tics** (29–229 ms). Going to bright sets the bright time to `(P_Random()&64)+1`. Because `&64` gives either 0 or 64, the **bright period is either 1 tic or 65 tics** (29 ms or 1.86 s). This is a nice quirk that makes the flicker look bursty. The dark level is `P_FindMinSurroundingLight` (the darkest neighbouring sector).
  - **Specials 2/3/4/12/13, strobe (`T_StrobeFlash`)**: bright for 5 tics (143 ms). Dark for 15 tics (fast, 0.43 s) or 35 tics (slow, 1.0 s). If the darkest neighbour equals the sector's own light, the minimum becomes 0. Unsynced strobes start at `(P_Random()&7)+1`; the sync variants (12/13) start at 1.
  - **Special 8, glow (`T_Glow`)**: moves ±8 light units per tic between the darkest neighbour and the sector's own level. A ping-pong triangle wave; for example, 255↔128 takes 16 tics each way (0.46 s per half cycle).
  - **Special 17, fire flicker (`T_FireFlicker`)**: every 4 tics (8.75 Hz) it sets `amount=(P_Random()&3)*16`, so 0/16/32/48, and `light = max - amount`. The floor is (darkest neighbour + 16). **This is the canonical cheap torch flicker: 4 random steps, each 16 units (1 table level), 8.75 Hz.**
  https://github.com/id-Software/DOOM/blob/master/linuxdoom-1.10/p_lights.c , https://github.com/id-Software/DOOM/blob/master/linuxdoom-1.10/p_spec.h , https://github.com/id-Software/DOOM/blob/master/linuxdoom-1.10/p_spec.c
- Doom-engine notes also on DoomWiki: https://doomwiki.org/wiki/COLORMAP , https://doomwiki.org/wiki/Sector#Light_level (see-it reference)

**[unverified]** (well known; not re-read this session):
- The COLORMAP lump holds 34 maps × 256 bytes: 0–31 run from bright to dark, 32 is the invulnerability greyscale inverse, 33 is all black.
- Sprites whose frame has the FF_FULLBRIGHT bit (0x8000) use colormap 0, which is how fireballs and torches "glow".
- The light-amp visor forces fixed colormap 1.
- r_segs.c fakes contrast by darkening walls that run along one axis and brightening walls along the other ("fake contrast", ±1 level).

**Inferences for Asterion**
- Use a tile/room "light byte" (0–255), quantised to 16 levels, feeding a palette-remap LUT (a 256×16 texture) in a Godot shader. That is exactly Doom's zlight idea with the distance term replaced by "distance from light source".
- Copy fire flicker literally: a 4-tic timer at 35 Hz (or about 115 ms), with random drops of 0..3 levels. Copy the "1 or 65 tic" bright bursts for a broken lamp.

**Gaps:** I did not open r_segs.c or r_things.c this session to verify fake contrast or the FF_FULLBRIGHT value.

---

## Q2. Quake (1996): lightmaps, light-style strings, dynamic lights

**Takeaway:** baked per-surface lightmaps at 16 world units per sample. Up to 4 animated "styles" can be blended per surface. Each style is a **string of letters played at 10 letters/s**: 'a' = black, 'm' = normal, 'z' = double brightness. These strings are the best-documented flicker presets in games and drop straight into a 2D game.

**Cited findings**
- QuakeC `worldspawn` defines the styles (quote: "'a' is total darkness, 'z' is maxbright"). https://github.com/id-Software/Quake/blob/master/qw-qc/world.qc
  - 0 normal `m`
  - 1 FLICKER (first variety) `mmnmmommommnonmmonqnmmo`
  - 2 SLOW STRONG PULSE `abcdefghijklmnopqrstuvwxyzyxwvutsrqponmlkjihgfedcba`
  - 3 CANDLE (first variety) `mmmmmaaaaammmmmaaaaaabcdefgabcdefg`
  - 4 FAST STROBE `mamamamamama`
  - 5 GENTLE PULSE 1 `jklmnopqrstuvwxyzyxwvutsrqponmlkj`
  - 6 FLICKER (second variety) `nmonqnmomnmomomno`
  - 7 CANDLE (second variety) `mmmaaaabcdefgmmmmaaaammmaamm`
  - 8 CANDLE (third variety) `mmmaaammmaaammmabcdefaaaammmmabcdefmmmaaaa`
  - 9 SLOW STROBE (fourth variety) `aaaaaaaazzzzzzzz`
  - 10 FLUORESCENT FLICKER `mmamammmmammamamaaamammma`
  - 11 SLOW PULSE NOT FADE TO BLACK `abcdefghijklmnopqrrqponmlkjihgfedcba`
  - Styles 32–62 are reserved for switchable lights; 63 is testing `a`.
- Playback (WinQuake r_light.c `R_AnimateLight`): `i = (int)(cl.time*10)`, `k = map[i % length] - 'a'`, `value = k*22`. So the rate is **10 Hz**, 'm' = 12×22 = 264 (about 256 = 1.0), and 'z' = 550 (about 2.1×). Comment: "'m' is normal light, 'a' is no light, 'z' is double bright". https://github.com/id-Software/Quake/blob/master/WinQuake/r_light.c
- Lightmap resolution (WinQuake model.c `CalcSurfaceExtents`): `bmins = floor(mins/16)`, `extents = (bmaxs-bmins)*16`, and an error if extents > 256. So there is **one lightmap sample per 16×16 texels**, and at most 17×17 samples per surface. https://github.com/id-Software/Quake/blob/master/WinQuake/model.c
- Dynamic lights (cl_main.c `CL_RelinkEntities`):
  - Muzzle flash: radius `200 + (rand()&31)`, `minlight=32`, lives 0.1 s.
  - EF_BRIGHTLIGHT: 400+rand&31.
  - EF_DIMLIGHT: 200+rand&31.
  - **Rocket (EF_ROCKET): radius 200, die = now + 0.01**, so it is re-spawned every frame. The `rand()&31` jitter is the flicker.
  - Lights decay with `radius -= time*decay`.
  https://github.com/id-Software/Quake/blob/master/WinQuake/cl_main.c
- See-it / explainer: Fabien Sanglard's Quake source review: https://fabiensanglard.net/quakeSource/index.php

**Inferences**
- The style strings make perfect `AnimationPlayer`/shader presets. Scale each letter to a 0..2 brightness and sample at 10 Hz. Candles use long "m" runs broken by "a" drops (gusts of wind); fluorescent uses an irregular m/a pattern.
- The "radius + rand()&31 re-rolled every frame" trick is the simplest flicker for a carried torch: about ±8% radius jitter.

---

## Q3. Tibia / OpenTibia / OTClient (the direct ancestor of Asterion's look)

**Takeaway:** every item or creature has `(lightradius 0–~10, lightcolor 0–215)`. The colour is a 6×6×6 RGB cube index. The client builds a **tiny texture with one pixel per tile**. Each pixel starts at the global ambient colour. Each light writes `max()` per channel, with linear falloff over the last ~5 tiles. The texture is then drawn over the map with **MULTIPLY** blending and stretched by bilinear filtering. The world light is a server-side value: 250 by day, 40 at night, with linear 2-hour ramps. This is extremely cheap, and it is the look players already associate with this genre.

**Cited findings**
- OTClient `LightView::updatePixels`, for each tile:
  - start with `r,g,b = globalLightColor`
  - for each light: skip if `dist > intensity*tileSize`
  - `intensity = (-distanceInTiles + light.intensity) * 0.2f`, skip if < 0.01, clamp to 1
  - `r = max(r, lightColor.r*intensity)` (and the same for g, b)
  - One pixel per tile is written into a texture, which is drawn with `CompositionMode::MULTIPLY`.
  - In `lightview.h`, the world counts as dark when `light.intensity < 250`, and the global colour is `Color::from8bit(color, intensity/255)`.
  - Lights on the same position and colour merge by max intensity.
  https://github.com/mehah/otclient/blob/main/src/client/lightview.cpp , https://github.com/mehah/otclient/blob/main/src/client/lightview.h
- In practice, a light of level L reaches full brightness within L−5 tiles and falls linearly to 0 at L tiles. For a torch (L=7): full brightness out to 2 tiles, gone at about 7 tiles.
- `Color::from8bit(c)`: valid for 0 < c < 216, with `r = (c/36 % 6)*51`, g = (c/6 % 6)*51, b = (c % 6)*51. https://github.com/mehah/otclient/blob/main/src/framework/util/color.h
  - Computed: **206 = (255,204,102)** warm torch orange; **199 = (255,153,51)** lamp; **193 = (255,102,51)** lava; **215 = (255,255,255)** white daylight.
- The Forgotten Server `world_light.lua`:
  - `day = 250`, `night = 40`
  - `sunrise = 360` (06:00), `dayTime = 480` (08:00), `sunset = 1080` (18:00), `nightTime = 1200` (20:00), all in world minutes
  - linear interpolation between those points
  - default colour 215
  - recalculated every 10 000 ms
  https://github.com/otland/forgottenserver/blob/master/data/scripts/globalevents/world_light.lua
- TibiaWiki (MediaWiki API, Infobox fields):

  | Item | lightradius | lightcolor | Notes |
  |---|---|---|---|
  | Lit Torch | 7 | 206 | 10 min, then Medium |
  | Lit Torch (Medium) | 6 | 206 | 5 min, then Small |
  | Lit Torch (Small) | 5 | 206 | 5 min, then burnt out |
  | Lamp | 6 | 199 | burns 33 min; wiki says "same amount of light as Utevo Lux" |
  | Lit Candelabrum | 6 | 206 | |
  | Campfire | 7 | 206 | medium campfire stage: radius 5 |
  | Lava | 4 | 193 | |

  - The torch's light gets weaker as it burns down, so **fuel is expressed as the radius stepping down.**
  - Spells: Light (utevo lux) is described as "3 tile radius", 6 min 10 s, 20 mana. Great Light: "4 tile radius", 11 min 35 s. Ultimate Light: radius 4, 33 min.
  - Illumination stopped being a core mechanic after **update 7.8 (Aug 2006)**, which added a client ambient-light slider.
  https://tibia.fandom.com/wiki/Lit_Torch , https://tibia.fandom.com/wiki/Lamp , https://tibia.fandom.com/wiki/Campfire , https://tibia.fandom.com/wiki/Lava , https://tibia.fandom.com/wiki/Light , https://tibia.fandom.com/wiki/Great_Light , https://tibia.fandom.com/wiki/Ultimate_Light , https://tibia.fandom.com/wiki/Illumination

**Inferences**
- The wiki's "3 tile" for Light versus "Lamp radius 6 = same as utevo lux" is consistent with OTClient's maths. Radius 6 gives full brightness at about 1 tile and visible fade to about 6, so "3 tiles" is probably the perceived useful radius. Flag this inconsistency in the profile.
- Design lesson: Tibia's *gameplay* darkness was removed because players hated it, but the *visual* layer stayed. For Asterion, keep darkness mostly aesthetic, and use a slider or a minimum ambient (for example, never below 40/255).
- Godot port: a per-tile `Image` of size (view_w_tiles × view_h_tiles), filled on the CPU, uploaded as an `ImageTexture` with linear filtering, and drawn in a `CanvasLayer` with a multiply blend (`blend_mul`). That costs a few hundred pixels per frame, so it works in WebGL2/Compatibility.

**Gaps**
- TibiaWiki's fandom page was blocked through WebFetch but reachable through `api.php`.
- I did not confirm the exact Tibian day length (commonly said to be 1 real hour = 24 Tibian hours) **[unverified]**.
- I did not get light values for creatures (for example, fire elementals).

---

## Q4. Ultima family and Ultima Online

**Cited findings**
- Ultima Codex: dark areas default to darkness and the player must supply light. Day/night arrives with **Ultima V**; at night you see only a short distance outdoors. Wind traps shorten light duration. Ultima VIII lights give almost no illumination. **Ultima Underworld uses 8 levels (0–7)**: candle 1, torch 2, taper and the Light spell 3, lantern 4, night vision 5, light sphere and daylight 6, sunlight 7. https://wiki.ultimacodex.com/wiki/Light_(concept)
- Ultima Online (ServUO/RunUO `LightCycle.cs`): **DayLevel 0, NightLevel 12, DungeonLevel 26, JailLevel 9**. Higher numbers are darker; the scale is 0–30 **[30 max unverified]**.
  - The code comments say OSI uses night from midnight to 03:59 and day from 04:00.
  - RunUO instead scales linearly to night from 22:00 to 24:00 and back to day from 04:00 to 06:00 (120-minute ramps).
  https://github.com/ServUO/ServUO/blob/master/Scripts/Misc/LightCycle.cs

**Gaps:** I found no numeric torch radius or duration for Ultima V–VII. The Codex page has none. UO item `LightType` shapes (circle radii) were not fetched.

---

## Q5. Diablo (1996), via the DevilutionX reconstruction

**Takeaway:** Diablo is Doom's colormap idea applied to an isometric tile grid. There are **16 light levels**, each a 256-entry palette remap generated by shifting along the palette's 16- or 8-colour ramps. Tiles store a light level that is the darkest value written by any light. Falloff is computed in **1/8-tile sub-steps**. The player's light radius of 10 tiles is the game's signature "pool of light in the dark".

**Cited findings**
- `lighting_defs.hpp`: `MAXLIGHTS 32`, `MAXVISION 4`, `LightsMax = 15`, `LightTableSize 256`, `NumLightingLevels 16`. https://github.com/diasurgical/devilutionX/blob/master/Source/engine/lighting_defs.hpp
- `light_tables.cpp` `MakeLightTable`:
  - 16 tables are built by walking the palette ramps with step sizes `{16,16,16,16,16,16,16,16,8,8,8,8,16,16,16,16,16,16}`. Each shade moves `shade*steps/16` entries toward the dark end of the ramp; past the end of the ramp it becomes black.
  - Table 15 is all black ("pitch black").
  - **Falloff**: `maxDistance = (radius+1)*8` and `LightFalloffs[radius][d] = d/maxDistance * 15` (linear, rounded), so 0 is brightest and 15 darkest. There are 16 radii.
  - In the Nest and Crypt (Hellfire) levels the falloff is quadratic with "over exposure" (`brightness = radius*1.25`), and lava palette entries 0–15 stay fullbright.
  - In Hell, palette indices 1–31 get "blood wall" remaps.
  https://github.com/diasurgical/devilutionX/blob/master/Source/engine/light_tables.cpp
- `lighting.cpp`: `DoLighting` keeps the minimum (brightest) value per tile, uses an 8×8 sub-tile offset for smooth movement, and searches at most 15 tiles. There are separate VisionList (FOV) and Lights lists. `InfravisionTable` is loaded from `plrgfx\infra.trn`, a palette translation used to highlight monsters. https://github.com/diasurgical/devilutionX/blob/master/Source/lighting.cpp
- `player.cpp`: the player's base light is `_pLightRad = 10`. `CalcPlrItemVals` starts at `lightRadius = 10` and adds each item's `_iPLLight` (the "of Light/Darkness" affixes). https://github.com/diasurgical/devilutionX/blob/master/Source/player.cpp
- See it: https://diablo.fandom.com/wiki/Light_Radius **[link not opened]**

**Inferences:** a 16-level palette LUT plus a linear falloff table is about 4 KB of tables. Diablo proves a pixel-art palette can carry all of its lighting, with no RGB blending at all.

---

## Q6. Minecraft: 0–15 flood-fill light

**Cited findings** (Minecraft Wiki "Light")
- There are two channels, sky light and block light. The client light is `max(sky, block)`.
- Block light decreases by **1 per block of taxicab distance**. Example from the wiki: a torch is **14**, the adjacent floor is 13, and a diagonal floor block is 12.
- Solid light-source blocks emit 15 at their own block. Glowstone is listed among the emitters in the 15 group.
- Sky light is 15 under open sky and floods outward. It stays 15 going straight down through transparent blocks and loses 1 per step horizontally or upward. **Sky light is not reduced at night**; instead the brightness curve changes with time.
- The *internal* sky light (used for spawning) is 15 at noon when clear, 12 in rain, 10 in a thunderstorm, and **4 at midnight**. Each step of dusk takes about 160 game ticks (8 s).
- Rendered brightness:
  - At the lowest brightness setting, daylight is about 98% luma.
  - **Night is about 17% and shaded blue.**
  - Full darkness is about 5%.
  - Block light "tends toward orange in the middle ranges".
  - Bedrock tints sunrise and sunset orange.
- Faces: top faces render at full brightness, north/south faces are slightly darker, and bottom and east/west faces are darker still (cheap fake directional light).
- Entities cast **circular blob shadows** (13-sided in Bedrock).
- The render uses a 2D lightmap texture indexed by (block light, sky light).
https://minecraft.wiki/w/Light

**[unverified]** Classic Java brightness table: `f = 1 - level/15; b = (1-f)/(f*3+1)`. This is a non-linear curve, so level 7 looks much darker than half.

**Inferences:** Minecraft's 16×16 (block × sky) lightmap texture is the cleanest model for day/night in a tile game. Store two 4-bit values per tile. Change *only the 16×16 LUT* over the day (warm orange block light, blue night sky), and the tile data never needs recomputing when time changes.

---

## Q7. Terraria: coloured tile light propagation

**Cited findings** (Terraria Wiki)
- Light sources are RGB triplets that can exceed 1. Examples: Torch (1, .95, .8), Blue Torch (0, .1, 1.3), White Torch (1.4, 1.4, 1.4), Campfire about (1.06, 0.46, 0.26).
- The brightest channel decides how far light travels.
- Blue light travels further through water and red further through honey.
- Light below a **spread threshold of 1.85%** affects only its own tile.
- Lighting cannot brighten sprites past 100%.
- Pulsing lights are synced to global clocks (demon torch, disco ball, cursor pulse).
https://terraria.wiki.gg/wiki/Light_sources
- Lighting modes:

  | Mode | Engine | Behaviour | Cost |
  |---|---|---|---|
  | Color | new | sub-tile pixel clusters, smoother transitions | high |
  | White | new | same as Color, but all light is white | mid–high |
  | Trippy | old | per-tile, "blocky" look; mobile default | medium |
  | Retro | old | per-tile, white; "reproduces Terraria's look from before 1.1" | low |

  https://terraria.wiki.gg/wiki/Lighting_mode
- **[unverified]** Decay constants in `LightingEngine`: about 0.91 per tile through air and about 0.56 through solid tiles. Multiplicative decay per tile, propagated in 4 directional sweeps. The 1.85% threshold above is consistent with this.

**Inferences:** the "Retro" mode, a per-tile multiplicative-decay flood fill in white, is the cheapest to port. Colour can come from a separate RGB pass at 1/2 or 1/4 resolution.

---

## Q8. Don't Starve: darkness that kills, lights with fuel

**Cited findings**
- Charlie (the darkness) attacks only in complete darkness. Each hit does **−100 health and −20 sanity**. The first attack comes 5–10 s after entering darkness, then every 5–11 s. The full list of things that keep her away includes fireflies, glow berries, a full moon and lightning. https://dontstarve.wiki.gg/wiki/Charlie
- Torch: lasts **75 s (2.5 clock segments)**. Rain can make it burn up to 150% faster.
  - Players "flash" the torch on and off to save fuel, and set trees on fire as free light.
  https://dontstarve.wiki.gg/wiki/Torch
- Light makes night survivable and slows sanity loss. https://dontstarve.wiki.gg/wiki/Light

**Gaps:** I did not find campfire or miner hat radius numbers. These are engine values (Light radius/falloff/intensity in prefabs) **[unverified]**.

---

## Q9. RimWorld: light as a gameplay number (0–100%)

**Cited findings** (RimWorld Wiki "Light", "Standing lamp")
- Each tile has 0–100% light: **Dark 0–29%, Lit 30–89%, Brightly lit 90–100%**.
- Daytime runs from roughly 05:00 to 19:00. Roofed tiles are 0% unless lit artificially.
- **Artificial light is capped at 50%** (the sun lamp is the exception at 100%).
- Below 30% light, move, work and reading speed scale down to ×80% at 0%, and colonists get a −5 "Darkness" mood thought.
- Most plants need ≥51% light.
- Standing lamp: `glowradius = 12`, `glowcolor = (214,148,94)`, 30 W. It gives 50% light out to about 7 tiles, ≥30% at 8–9 tiles, and reaches some tiles without direct line of sight.
https://www.rimworldwiki.com/wiki/Light , https://rimworldwiki.com/wiki/Standing_lamp

**Inferences:** the RGB (214,148,94) is a usable reference for incandescent warm light (roughly 2700–3000 K **[inference]**).

---

## Q10. Factorio: a low-resolution lightmap by default

**Cited findings:** a lamp lights a **10-tile radius** at night, and lamps can be coloured by RGB or circuit signal. Changelog: the **default "lights render resolution" was changed to 0.25**, which can be raised at the cost of performance. https://wiki.factorio.com/Lamp

**Inferences:** strong evidence that a quarter-resolution light buffer is acceptable even in a pixel-precise game. That matters for a web or mobile budget.

---

## Q11. Stardew Valley

**Cited findings:** a held or placed Torch gives light "for a radius of approximately 3 tiles" at night or in the Mines. Torches are the weakest light source but can be walked on. https://stardewvalleywiki.com/Torch

**[unverified]** The engine draws light-source sprites into a reduced-resolution lightmap render target (there is a "lighting quality" option) and darkens the world with a subtractive ambient colour that changes through the evening. Windows get "window light" sprites at night.

**Gaps:** I did not get exact lamp radii or the night tint RGB from a primary source.

---

## Q12. Roguelikes: light radius as an integer

**Cited findings**
- **NetHack 3.6 `light.c`** (`candle_light_range`):

  | Source | Light radius |
  |---|---|
  | 1–6 candles | 2 |
  | 7–48 candles | 3 |
  | 49–342 candles | 4 |
  | Lamp | 3 |
  | Candelabrum of Invocation, 1–3 candles | 2 |
  | Candelabrum of Invocation, 4–6 candles | 3 |
  | Candelabrum of Invocation, 7 candles | 4 |

  - Candle count steps up the radius in powers of 7.
  - `MAX_RADIUS 15`.
  - Rooms are either lit or unlit at map creation.
  https://github.com/NetHack/NetHack/blob/NetHack-3.6/src/light.c
- **Angband `object.txt`**: the Wooden Torch has flags `BURNS_OUT | LIGHT_2`. The Lantern has `TAKES_FUEL | LIGHT_3 | IGNORE_FIRE`. A flask of oil fuels a lantern with 7500 turns of light. https://github.com/angband/angband/blob/master/lib/gamedata/object.txt
  - **[inference]** LIGHT_n means a light radius of n.
- **DCSS `defines.h`**: `LOS_RADIUS 8`, `LOS_DEFAULT_RANGE 7`. In DCSS, line of sight is the "light" (there is no torch economy). https://github.com/crawl/crawl/blob/master/crawl-ref/source/defines.h

---

## Q13. Console 2D classics: dark rooms, Flash, fog of war

**Cited findings**
- **Pokémon dark caves** (Bulbapedia "Darkness"):
  - Gen I: the floor and characters become black silhouettes, walls are dimmed, and the UI turns blue-tinted.
  - Gen II: everything is black except exits and item balls.
  - **Gen III–IV: black except a small circle around the player; Flash expands the circle.**
  - Platinum's Hearthome Gym: lanterns light only the area in front of the trainer (cone).
  - No radius numbers are given.
  https://bulbapedia.bulbagarden.net/wiki/Darkness , https://bulbapedia.bulbagarden.net/wiki/Flash_(move)
- **Fire Emblem Torch** (Fire Emblem Wiki):
  - Fog of war starts in FE5 (Thracia 776), where fogged areas are fully blacked out. Later games dim the fog instead.
  - The Torch item adds **+10 squares** of vision (1 use) in FE5, **+4** in later games, and **+5** in FE16, with the effect **decaying by 1 each turn**.
  - Thieves have bigger innate vision.
  https://fireemblemwiki.org/wiki/Torch_(item) , https://fireemblemwiki.org/wiki/Vision
- **Zelda: A Link to the Past.** This is a gap; I found no technical source this session. **[unverified]** Dark dungeon rooms show only a small lit area around and in front of Link while he has the Lamp, and lighting torches brightens the room step by step. The effect is commonly attributed to SNES window masking and colour math. See-it: https://tcrf.net/A_Link_to_the_Past , https://zeldawiki.wiki/wiki/A_Link_to_the_Past
- **Secret of Mana / Chrono Trigger night palettes, Baldur's Gate night.** Not researched in depth (out of budget). **[inference]** SNES games do this by swapping CGRAM palettes or using fixed-colour subtraction.

---

## Q14. Shadows in classic 2D

**Cited:** Minecraft entities use circular blob shadows (https://minecraft.wiki/w/Light).

**Inference (not sourced this session):**
- Classic 2D/iso games mostly used three kinds of shadow:
  - blob or drop ellipses under sprites
  - hand-painted cast shadows baked into tiles and buildings
  - separate shadow sprite frames (isometric RTS units), drawn as 50% dark or dithered
- Sun-direction skewing (a shear transform of the sprite silhouette, flattened and blackened) is a later and cheap trick.
- Doom's "fake contrast" (±1 light level by wall orientation) and Minecraft's per-face shading (top bright, N/S mid, E/W dark) are the classic "directional light without lights" tricks.

**Gap:** no primary source for Age of Empires shadow frames or other sun-skewed sprite shadows. The next researcher should cover these.

---

## Cross-cutting numbers cheat-sheet

| Game | Light unit | Levels | Falloff | Flicker | Day/night |
|---|---|---|---|---|---|
| DOOM | sector byte | 256 → 16 → 32 colormaps | by depth (zlight 16×128) | 35 Hz thinkers; fire: −0/16/32/48 every 4 tics | none |
| Quake | lightmap luxel / 16 units | 'a'..'z' ×22 | baked radiosity-like | style strings at 10 Hz; dlight radius 200 + rand&31 | none |
| Tibia/OTClient | per-tile 1 px texture, multiply | radius 0–~10, colour 6×6×6 cube | linear over last 5 tiles, max blend | sprite animation only | ambient 250 day / 40 night, 2 h linear ramps |
| Ultima Online | global level | 0 (day) … 12 (night) … 26 (dungeon) | — | — | 2 h ramps (RunUO) |
| Diablo | per-tile level | 16 palette LUTs | linear to (r+1)×8 sub-tiles | — | none (dungeon) |
| Minecraft | per-block 4+4 bits | 0–15 | −1 per block (taxicab) | — | LUT changes; night about 17% luma, blue |
| Terraria | RGB per tile | float | multiplicative decay, 1.85% cut-off | synced global clocks | yes |
| RimWorld | % per tile | 0–100 | radius 12 lamp, 50% cap | — | sun 05–19 h |
| NetHack | integer radius | 1–15 | binary (lit/unlit) | — | — |
| Angband | integer radius | torch 2, lantern 3 | binary | — | town day/night |
| DCSS | LOS radius | 7–8 | binary | — | — |
| Don't Starve | lights with fuel | — | soft radius | — | darkness causes damage |
| Fire Emblem | vision squares | +4/+5/+10 | decays 1 per turn | — | — |

---

## Sources (all accessed 2026-11-09)

- DOOM source: https://github.com/id-Software/DOOM/blob/master/linuxdoom-1.10/p_lights.c , .../p_spec.h , .../p_spec.c , .../r_main.c , .../r_main.h
- DoomWiki: https://doomwiki.org/wiki/COLORMAP , https://doomwiki.org/wiki/Sector
- Quake: https://github.com/id-Software/Quake/blob/master/qw-qc/world.qc , .../WinQuake/r_light.c , .../WinQuake/cl_main.c , .../WinQuake/model.c ; Fabien Sanglard: https://fabiensanglard.net/quakeSource/index.php
- OTClient: https://github.com/mehah/otclient/blob/main/src/client/lightview.cpp , .../lightview.h , .../src/framework/util/color.h
- The Forgotten Server: https://github.com/otland/forgottenserver/blob/master/data/scripts/globalevents/world_light.lua , .../data/lib/core/game/world_light.lua
- TibiaWiki: https://tibia.fandom.com/wiki/Lit_Torch , /Lit_Torch_(Medium) , /Lit_Torch_(Small) , /Lamp , /Lit_Candelabrum , /Campfire , /Lava , /Light , /Great_Light , /Ultimate_Light , /Illumination , /Torch
- Ultima Codex: https://wiki.ultimacodex.com/wiki/Light_(concept)
- ServUO: https://github.com/ServUO/ServUO/blob/master/Scripts/Misc/LightCycle.cs
- DevilutionX: https://github.com/diasurgical/devilutionX/blob/master/Source/engine/light_tables.cpp , .../Source/engine/lighting_defs.hpp , .../Source/lighting.cpp , .../Source/player.cpp
- Minecraft Wiki: https://minecraft.wiki/w/Light
- Terraria Wiki: https://terraria.wiki.gg/wiki/Light_sources , https://terraria.wiki.gg/wiki/Lighting_mode
- Don't Starve Wiki: https://dontstarve.wiki.gg/wiki/Charlie , /Torch , /Light
- RimWorld Wiki: https://www.rimworldwiki.com/wiki/Light , https://rimworldwiki.com/wiki/Standing_lamp
- Factorio Wiki: https://wiki.factorio.com/Lamp
- Stardew Wiki: https://stardewvalleywiki.com/Torch
- NetHack: https://github.com/NetHack/NetHack/blob/NetHack-3.6/src/light.c
- Angband: https://github.com/angband/angband/blob/master/lib/gamedata/object.txt
- DCSS: https://github.com/crawl/crawl/blob/master/crawl-ref/source/defines.h
- Bulbapedia: https://bulbapedia.bulbagarden.net/wiki/Darkness , https://bulbapedia.bulbagarden.net/wiki/Flash_(move)
- Fire Emblem Wiki: https://fireemblemwiki.org/wiki/Torch_(item) , https://fireemblemwiki.org/wiki/Vision
- Zelda ALttP (see-it only): https://tcrf.net/A_Link_to_the_Past , https://zeldawiki.wiki/wiki/A_Link_to_the_Past

## Open gaps (for other researchers)
1. Exact light numbers for Zelda ALttP's lamp and dark rooms, and Pokémon Gen III Flash circle radii (likely in the pokeemerald decompilation).
2. Don't Starve campfire and miner hat radius, falloff and intensity (from prefab Lua).
3. The Stardew lighting render path and night tint RGB (decompiled `Game1`).
4. Night palettes in Chrono Trigger and Secret of Mana, Baldur's Gate night lighting, and Age of Empires shadow frames.
5. Terraria decay constants (0.91 / 0.56) and the Minecraft brightness curve need primary confirmation.
