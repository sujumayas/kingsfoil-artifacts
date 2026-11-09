# 07 — GEM FINDINGS: open-source code and tools for 2D light and shadow

Researcher angle: field-validated open-source code and tools a Godot 4 (Compatibility/WebGL2) or web pixel-art dev can use or study. Licences were checked by downloading the actual LICENSE file from each repo (raw.githubusercontent.com) on 2026-11-09, unless marked "unverified". Commit dates and tag counts come from `git clone --depth 1` and `git ls-remote --tags` on the same day. GitHub API and star counts were **blocked** in this session, so maturity evidence is based on commit recency, tag/release counts and how widely each project is used, not stars.

Legend for licence risk: **SAFE** = MIT/BSD/Apache/CC0 (copy with attribution, or with none for CC0). **LGPL** = fine as a separate library; risky if pasted into game code. **COPYLEFT** = GPL/AGPL/CC BY-SA/NGPL: **study the algorithm and re-implement it clean**. Do not copy code into a closed-source game. **NONE** = no licence file: all rights reserved, so study only.

---

## Master table

| Name | URL | Licence (verified) | Maturity evidence | What it is good for |
|---|---|---|---|---|
| Godot demo: 2D Lights and Shadows | https://github.com/godotengine/godot-demo-projects/tree/master/2d/lights_and_shadows | MIT (LICENSE.md) — SAFE | Official repo; last commit 2026-10-08; tag `4.7-…`; project.godot targets Godot 4.7, `rendering_method="gl_compatibility"` | Reference scene: PointLight2D + LightOccluder2D + normal map (`godot_normal.png`), `shadow_filter=1` (PCF5), `shadow_filter_smooth=1.2`. Shows this works in the **Compatibility** renderer |
| Godot demo: 2D Light as Mask | https://github.com/godotengine/godot-demo-projects/tree/master/2d/light2d_as_mask | MIT — SAFE | Same; Compatibility renderer, Godot 4.7 | Uses a CanvasItemMaterial with `light_mode = 2` (light-only) and PointLight2D `blend_mode = 2` (Mix) as a reveal mask. Good for fog of war or "only lit things visible" |
| OTClient (edubart, classic) | https://github.com/edubart/otclient | MIT — SAFE | Main open Tibia client; last commit 2024-09-14; tag v0.6.6 | **Tibia's light model, clean and MIT.** Additive radial "bubbles" go into a light FBO, which is then multiplied over the scene. Details below |
| OTClient Redemption (mehah = opentibiabr/otclient) | https://github.com/mehah/otclient | MIT — SAFE | Active: last commit 2026-11-08, tag 4.2 | Newer **per-tile light texture** (1 texel per tile, bilinear upscale, MULTIPLY), with **max()** blending instead of add. Details below |
| The Forgotten Server (Tibia server) | https://github.com/otland/forgottenserver | GPL-2.0 — COPYLEFT | Main OT server | Tibia **day/night world light curve**: day 250, night 40, colour 215. Study the numbers; re-implement |
| rot.js | https://github.com/ondras/rot.js | BSD-style (license.txt) — SAFE | v2.2.1; last commit 2024-11-13; 11 tags; very widely used JS roguelike lib | **FOV + Lighting module in ~200 lines of TS**: FOV-based light, additive colour, multi-pass bounce via reflectivity. FOV has `compute90/compute180` for **cone lights** |
| libtcod | https://github.com/libtcod/libtcod | BSD-3-Clause — SAFE | Active (commit 2026-11-09), 90 tags, v2.3.0 | 7 FOV families: BASIC, DIAMOND, SHADOW (recursive shadowcasting), PERMISSIVE 0–8, RESTRICTIVE, SYMMETRIC_SHADOWCAST. Reference implementations in C |
| Symmetric Shadowcasting (Albert Ford) | https://github.com/370417/symmetric-shadowcasting · article https://www.albertford.com/shadowcasting/ | **CC0** — SAFE (public domain) | 117-line Python; adopted into libtcod as `FOV_SYMMETRIC_SHADOWCAST`; last commit 2022-02-09 | Best-in-class tile FOV: symmetric (if A sees B, B sees A), no artefacts, exact Fractions. Ideal for porting to GDScript |
| Shattered Pixel Dungeon `ShadowCaster.java` | https://github.com/00-Evan/shattered-pixel-dungeon | GPL-3.0 — COPYLEFT | Very popular pixel-art roguelike; v4.0.2; 99 tags; commit 2026-10-06 | Recursive shadowcasting plus a **rounding table** that makes the FOV circular; MAX_DISTANCE 20; special case at distance 2. Study only |
| Brogue CE `Light.c` | https://github.com/tmewett/BrogueCE | **AGPL-3.0** — COPYLEFT (strongest) | v1.15.1; commit 2026-11-06; famous for its coloured light | **Coloured, flickering, "dancing" light model**, negative "darkness" lights, flares. Study the numbers only (below) |
| Cataclysm: DDA `lightmap.cpp` | https://github.com/CleverRaven/Cataclysm-DDA | **CC BY-SA 3.0** — COPYLEFT | Massive and active (commit 2026-11-09) | Physically motivated tile light: `numerator / (exp(transparency*d) * d)`, transparency cache, sunlight cache, vehicle **cone lights** (`apply_light_arc`), luminance-weighted colour mixing |
| Luanti (Minetest) `voxelalgorithms.cpp` | https://github.com/luanti-org/luanti | Code LGPL-2.1+ (README badge); assets CC BY-SA 3.0 — LGPL | Active (commit 2026-11-09), 84 tags | **Minecraft-style flood-fill light**: 0–15, decrement by 1 per node, bucket queue, separate day/night banks blended by daylight factor, gamma LUT |
| DOOM `p_lights.c` | https://github.com/id-Software/DOOM | GPL-2.0 — COPYLEFT | 1993 classic | Sector light effects: fire flicker, random flash, strobe, glow. Constants below (trivial to re-implement) |
| Quake light styles (`world.qc`, `r_light.c`) | https://github.com/id-Software/Quake | GPL-2.0 (gnu.txt) — COPYLEFT | 1996 classic; styles still copied by modern engines | **Flicker as a string**: 10 Hz, `'a'`=dark, `'m'`=normal, `'z'`=double. 12 preset patterns. The *idea* and strings are tiny data; re-type them under your own code |
| illuminated.js | https://github.com/gre/illuminated.js | **LGPL** (LICENSE) — LGPL | Last commit 2014-12-18; no tags; dormant but the classic canvas 2D-shadows lib | Canvas2D lights: Lamp (`distance`, `samples`, `roughness`, angle), DiscObject/PolygonObject occluders, DarkMask. `samples>1` gives soft shadows |
| Sight & Light (Nicky Case) | https://github.com/ncase/sight-and-light · https://ncase.github.io/sight-and-light/ | **No licence file** — NONE (page says the *game* Nothing To Hide is "uncopyrighted"; the tutorial repo isn't explicitly) | 2015 interactive tutorial; widely shared | Ray-to-every-corner visibility polygon (±0.00001 rad offset rays), soft shadows by jittering the light. Study only, or treat as public domain at your own risk |
| Red Blob Games — 2D Visibility | https://www.redblobgames.com/articles/visibility/ | **Apache 2.0** (stated on page) — SAFE | 2012, updated 2018 and 2020; reference article | Angular sweep over wall endpoints, giving a visibility polygon. Haxe source `Visibility.hx`; JS port at Silverwolf90/2d-visibility (**no licence file**) |
| mattdesl lwjgl-basics wiki: "2D Pixel Perfect Shadows" | https://github.com/mattdesl/lwjgl-basics/wiki/2D-Pixel-Perfect-Shadows | **No licence file** in repo or wiki — NONE (snippets are tiny and the technique is generic) | Long-cited tutorial (LibGDX era) | GPU **1D polar shadow map**: occluder FBO, then a 256×1 min-distance texture, then `step(r, dist)` plus gaussian over angles for soft edges |
| PixiJS Lights (@pixi/lights) | https://github.com/pixijs/lights | MIT — SAFE | v4.1.0; commit 2024-12-19; needs PixiJS v7+ and @pixi/layers | Deferred **normal-mapped** 2D lighting for the web (diffuse, normal and light layers) |
| samuelbigos — Godot 2D Global Illumination | https://github.com/samuelbigos/godot_2d_global_illumination · https://sambigos.itch.io/2d-global-illumination-in-godot | MIT — SAFE | v0.1; last commit 2021-04-28; `config_version=4`, so **Godot 3.x** (needs porting) | Jump-flood Voronoi, then distance field, then N rays/pixel raymarch. **One bounce per frame** via the previous frame |
| Sohojoe — radiance-cascades-godot | https://github.com/Sohojoe/radiance-cascades-godot | Apache-2.0 — SAFE | 2024-08-03; Godot 4.3; experimental, no tags | Radiance Cascades in Godot 4.3. Main version uses **compute shaders, so not web/Compatibility** |
| jason.today "Building Real-Time GI" | https://jason.today/gi (2024-07-27) and /rc | **No licence stated** — NONE | Popular 2024 write-up; ported by Sohojoe | Clear JS/three.js walkthrough: JFA, distance field, raymarch (8 rays/px, 256 px reach in the demo), then radiance cascades. Study only |
| godotshaders.com "Dynamic 2D Lights and Soft Shadows" | https://godotshaders.com/shader/dynamic-2d-lights-and-soft-shadows/ | MIT (page label) — SAFE | 2023-09-04; Godot 4 | Up to 100 lights as uniform arrays; soft shadows via `texture_sdf` (Godot's 2D SDF from occluders); light "fans" (cones) |
| godotshaders.com "Drop-in PBR 2D lighting… soft shadows and AO" | https://godotshaders.com/shader/drop-in-pbr-2d-lighting-system-with-soft-shadows-and-ambient-occlusion/ | MIT — SAFE | 2024-04-03 | SDF-marched soft shadows (`shadow_march_count`, step scale), SDF-normal AO (`ao_step_count`), `object_height` |
| godotshaders.com "2D shadows shader (v2.1)" | https://godotshaders.com/shader/2d-shadows-shader/ | CC0 — SAFE | 2024-06-23 (author lists Godot 3.5) | Cheap **sprite drop shadow**: offset, scale, optional box blur, rotation-aware |
| godotshaders.com "Custom 2D Light" | https://godotshaders.com/shader/custom-2d-light/ | CC0 — SAFE | 2024-08-09 | Light-texture × colour × brightness with clamping. Trivial, but a CC0 starting point |
| Laigter | https://github.com/azagaya/laigter · https://azagaya.itch.io/laigter | GPL-3.0 — COPYLEFT (**tool only**, output maps are yours) | v1.9.1; 27 tags; commit 2026-10-19; 7 UI languages | Generates normal, parallax, specular and occlusion maps from sprites, with in-app light preview |
| Sprite Lamp / SpriteIlluminator | spritelamp.com / codeandweb.com/spriteilluminator | Commercial — n/a | Commercial tools | Hand-painted lighting profiles, then normal maps (Sprite Lamp); normal-map painting (SpriteIlluminator). Not verified this session |
| NetHack (lit rooms) | https://github.com/NetHack/NetHack | NetHack GPL (dat/license) — COPYLEFT | 1987–present | Binary lit/unlit rooms, light sources with radius (light.c). Concept only |
| DCSS | https://github.com/crawl/crawl | GPL-2+ (LICENSE) — COPYLEFT | 206 tags; commit 2026-11-09 | LOS/FOV, "halo"/"umbra" radius effects. Concept only (not code-reviewed here) |
| Veloren | https://gitlab.com/veloren/veloren | GPL-3 (**unverified**) — COPYLEFT | 3D voxel, so less relevant | Skipped: 3D renderer, not pixel-art 2D |

---

## Q1. How does Tibia/OTClient actually render light? (MOST RELEVANT to Asterion Online)

**Takeaway:** Tibia light is a **screen-space light buffer multiplied over the scene**. Each light has an integer `intensity` (radius in tiles, max 8 in the client) and an 8-bit colour index into a **6×6×6 = 216-colour cube**. The ambient world light is a full-screen fill (level 0–255) cycling from 250 (day) to 40 (night). It is MIT-licensed in OTClient, so we can port it directly.

**Cited findings (code read on 2026-11-09):**
- **Colour = 216-colour cube.** `from8bit(c)`: `r = (c/36)%6*51; g = (c/6)%6*51; b = c%6*51`. Index ≥216 or ≤0 gives black. Index 215 = white. (edubart `src/framework/util/color.h`, https://github.com/edubart/otclient)
- **Classic edubart LightView** (`src/client/lightview.cpp`):
  - `MAX_LIGHT_INTENSITY = 8`, `MAX_AMBIENT_LIGHT_INTENSITY = 255`.
  - One pre-baked 512×512 "light bubble" texture: `intensity = clamp((R - r)/(R - Rc))` then **squared** (comment: inverse square), with `centerFactor 0.1`, so the inner 10% is full white.
  - `radius = intensity * TILE_PIXELS(32) * scale`. Brightness `= 0.5 + intensity/8 * 0.5`, so weak lights are also dimmer.
  - Pipeline: clear the light FBO to the ambient colour × (level/255), then draw every bubble with **additive** blending, then composite the FBO onto the scene with `CompositionMode_Light` (multiply). Consecutive duplicate lights at the same spot are skipped.
- **Redemption (mehah) LightView**, the current Tibia-OT client:
  - The light map is a **CPU texture with one pixel per tile** (`m_mapSize` in tiles), `setSmooth(true)` (bilinear), drawn with `CompositionMode::MULTIPLY`.
  - Per tile: start at the global colour. For each light, `d` = distance in tiles from the tile centre, `I = (light.intensity - d) * 0.2`, clamp to [0, 1], skip if <0.01. Then **`r = max(r, color.r*I)`** per channel (max, not add, so overlapping torches don't blow out).
  - `isDark = globalIntensity < 250`: above that, lights are not even computed.
  - `resetShade(pos)` stores `tiles[i] = lights.size()`, so lights added *before* a tile was drawn are ignored for that tile. This is a cheap draw-order occlusion trick (e.g. lights on lower floors don't leak onto upper floors).
  - The texture re-uploads only when a hash of (lights, src rect, global colour) changes. Pixels are double-buffered.
- **Server-side day/night (TFS, GPL-2 — numbers only)** `data/scripts/globalevents/world_light.lua`: `day = 250, night = 40`; `sunrise = 360` (06:00), `dayTime = 480` (08:00), `sunset = 1080` (18:00), `nightTime = 1200` (20:00), linear ramps; default colour **215** (white); updates every **10 s**. `world_time.lua`: **1 real hour = 1 game day; 2.5 s = 1 game minute.** (https://github.com/otland/forgottenserver)

**Inferences:**
- The mehah approach (one texel per tile, bilinear upscale, multiply) is ideal for Godot web. It can be a 1-texel-per-tile `Image` updated from GDScript into an `ImageTexture`, drawn over the map as a multiply CanvasItem. That is roughly 20×15 texels per screen, so effectively free.
- With bilinear filtering the result is smooth, not pixel-art crisp. For a crisper retro look, use nearest filtering plus a dithered 2×2 sub-tile, or quantise `I` to 4–6 bands (ties into study #1 palette lighting).
- `I = (intensity - d) * 0.2` means linear falloff in tiles with 5 tiles from full to zero beyond `intensity - 5`. So intensity 8 is full brightness until 3 tiles out, then fades. Tune per game.

**Gaps:** I did not read the item `lightLevel`/`lightColor` tables (items.otb/appearances). Actual Tibia values (e.g. torch = level 7, colour 206) need a wiki check by the Tibia researcher.

---

## Q2. Which tile-light / FOV code is the best foundation?

**Takeaway:** For a tile game, **light = FOV from the light source × falloff**. rot.js (BSD) has exactly this ready-made. Albert Ford's CC0 symmetric shadowcasting is the cleanest FOV to port to GDScript. Both are SAFE.

**Cited findings:**
- **rot.js `src/lighting.ts`** (https://github.com/ondras/rot.js):
  - Defaults `passes: 1, emissionThreshold: 100, range: 10`.
  - For each light, run FOV with radius `range`. Each visible cell gets `formFactor = vis * (1 - r/range)` (linear falloff × visibility), and colour is **added** per channel.
  - Passes >1 = **radiosity bounce**: each lit cell re-emits `color * reflectivity(x,y)` if the summed RGB > `emissionThreshold`. FOV results are cached per emitter.
  - FOV modules: `PreciseShadowcasting`, `RecursiveShadowcasting`. The latter has `compute180(x,y,R,dir)` and `compute90(...)`, giving **lantern/flashlight cones** for free.
- **Symmetric shadowcasting** (https://github.com/370417/symmetric-shadowcasting, CC0): 117 lines of Python using `Fraction`. Rows are scanned per quadrant. `slope(tile) = (2*col-1)/(2*depth)`. A floor tile is revealed only if `is_symmetric` (its centre lies within the slopes), and walls are always revealed ("expansive walls"). `round_ties_up/down` sets the column bounds. libtcod adopted it as `FOV_SYMMETRIC_SHADOWCAST` (`fov_types.h`).
- **libtcod** offers `FOV_BASIC, DIAMOND, SHADOW, PERMISSIVE_0..8, RESTRICTIVE, SYMMETRIC_SHADOWCAST` (BSD-3).
- **Shattered PD** (GPL-3): `MAX_DISTANCE = 20`; a precomputed `rounding[i][j] = min(j, round(i*cos(asin(j/(i+0.5)))))` makes the FOV **circular** instead of square. At distance 2 it fills the corners so diagonal movement isn't punished. 8 octants are mirrored.

**Inferences:** The SPD rounding table is a neat idea worth re-implementing (it's a formula, not copyrightable expression). Combined with Ford's algorithm in GDScript, at radius ≤10 and a few lights, it should be well under 1 ms (unmeasured).

---

## Q3. Brogue — why its coloured light feels alive (AGPL: study only)

**Takeaway:** Brogue's "dancing" light comes from **re-rolling radius and colour every turn** inside per-light random ranges. Lights sum additively per channel into a signed short map, so **negative lights create darkness**.

**Cited findings** (`src/brogue/Light.c`, `Globals.c`, `Rogue.h`, https://github.com/tmewett/BrogueCE):
- `color` struct = `{red, green, blue, redRand, greenRand, blueRand, rand, colorDances}`. Each paint: `c = base + rand(0,rand) + rand(0,chanRand)`.
- `lightSource = {color*, radius {lower, upper, clump} in 1/100 tiles, radialFadeToPercent, passThroughCreatures}`.
- Falloff: `mult = 100 - (100 - fadeTo) * dist / radius`, applied only to cells inside an FOV mask from the light (`getFOVMask`, blocked by `T_OBSTRUCTS_VISION`, and by creatures unless the flag is set). Accumulation: `tmap.light[k] += c[k] * mult / 100`.
- Catalogue examples: **torch** `torchLightColor {75,38,15, 0,15,7, 0, dances}`, radius 10.00, fade to 50%. **Candle** radius 2–4 tiles, fade 0. **Lava** `{47,13,0, 10,7,0}` radius 3, 50%. **Sunlight** `{100,100,75}` radius 2, 25%. **Luminescent fungus** `{2,11,11, 4,3,3}` radius 3. **Will-o'-wisp** radius 4–8. **Darkness cloud** `{-20,-20,-20}`. **Unicorn** `{-50,-50,-50, 250,250,250}` (wild random colour swings).
- Miner's light (player): base white `{180,180,180}` fading to `{90,90,120}` with depth; fade 35%; radius min 2, halved in water.
- **Flares** (burst lights): coefficient starts at 100%, `changePerFrame = -15`, and the change itself is multiplied by 1.2 every frame, so the flare decays faster and faster.
- Display classification: `DV_DARK` if all channels < -10, `DV_UNLIT` if in shadow, else `DV_LIT`.

**Inferences:** For Asterion, the cheap re-implementation is: per light per tick (5–10 Hz), `radius = lerp(lo, hi, rand)` and `rgb = base + rand*jitter`. Torches get a ±1-tile radius jitter and a G/B jitter (15/7 on a 75 base ≈ 20%). That gives a warm, colour-shifting flame. Negative lights are a great cheap "cursed zone" or "darkness spell".

---

## Q4. Flood-fill light (Minecraft/Luanti) and physically-based tile light (CDDA)

**Cited findings:**
- **Luanti** (LGPL-2.1+): `LIGHT_MAX 14` for artificial lights, `LIGHT_SUN 15`. `spread_light` pops from a **bucket queue indexed by light level** and gives each of 6 neighbours `light - 1`, never back toward the source direction. Sunlight 15 propagates straight down undiminished (`is_sunlight_above`). Removal uses an `unspread_light` pass then re-spread. Two banks (DAY, NIGHT), mixed by `blend_light(daylight_factor 0..1000, day, night)`. Display through a 16-entry LUT with gamma clamped 0.33–3.0 and interpolation between levels. (`src/voxelalgorithms.cpp`, `src/light.h`, `src/light.cpp`)
- **CDDA** (CC BY-SA 3.0): `light_calc = luminance / (exp(transparency*distance) * distance)` ("inverse square falloff in addition to attenuation"). Thresholds: `LIGHT_AMBIENT_LOW 3.5`, `DIM 5`, `LIT 10`, `LIGHT_SOURCE_BRIGHT 10`. Open-air transparency `2.3 / MAX_VIEW_DISTANCE`. Weather `sight_penalty` scales transparency (fog, rain). Indoors gets `DIM*0.8` if it's bright outside. Colour: `buf.color += color * luminance`, then divided by luminance, so **brighter sources dominate the hue**. Vehicle headlights use `apply_light_arc` (cone). (`src/lightmap.cpp`, `src/lightmap.h`)

**Inferences:** The Luanti two-bank day/night trick maps perfectly to a tile game. Precompute a "sky" bank (outdoor tiles 15, indoor tiles fall off from doors/windows) and a "torch" bank. Then each frame `light = max(sky*daylight, torch)`, with no re-flood when the sun moves. Interior light spilling through doorways comes for free.

---

## Q5. Flicker as data: DOOM and Quake (GPL; constants/strings are tiny and generic)

**Cited findings:**
- **DOOM `p_lights.c` / `p_spec.h`:**
  - Fire flicker: every 4 tics, `level = max - (rand&3)*16`, floored at min+16.
  - Light flash: `maxtime 64`, `mintime 7` tics.
  - Strobe: `STROBEBRIGHT 5`, `FASTDARK 15`, `SLOWDARK 35` tics.
  - Glow: ±`GLOWSPEED 8` per tic between the neighbour-min and own level.
  - (35 tics/s.) https://github.com/id-Software/DOOM
- **Quake:** `R_AnimateLight` uses `i = cl.time*10`, so styles step at **10 Hz**; value `= (char - 'a') * 22` ('m' ≈ 264 ≈ normal 256, 'z' = 550 ≈ double). Presets (`qw-qc/world.qc`):
  - 1 FLICKER `mmnmmommommnonmmonqnmmo`
  - 2 SLOW STRONG PULSE `abcdefghijklmnopqrstuvwxyzyxwvutsrqponmlkjihgfedcba`
  - 3 CANDLE `mmmmmaaaaammmmmaaaaaabcdefgabcdefg`
  - 4 FAST STROBE `mamamamamama`
  - 5 GENTLE PULSE `jklmnopqrstuvwxyzyxwvutsrqponmlkj`
  - 6 FLICKER 2 `nmonqnmomnmomomno`
  - 10 FLUORESCENT `mmamammmmammamamaaamammma`
  - 11 SLOW PULSE (no black) `abcdefghijklmnopqrrqponmlkjihgfedcba`
  - Styles 32–62 are switchable lights.

**Inferences:** A Quake-style string table is the cheapest "light personality" system there is: one string per light type, indexed by `time*10`. Map it to light radius/energy in Godot. That gives candle vs torch vs fluorescent vs magic pulse for zero CPU. Writing our own strings avoids any copyright question.

---

## Q6. GPU shadow techniques for web/Godot (pixel-perfect, SDF, GI)

**Cited findings:**
- **mattdesl 1D polar shadow map:** (1) render occluders into a light-sized FBO; (2) build a **256×1** texture of the minimum distance to the first occluder per angle (polar transform, loop over y); (3) per fragment `step(r, shadowmap(theta))`, plus gaussian sampling across neighbouring angles for soft edges.
- **Godot SDF shaders** (godotshaders, MIT): use `texture_sdf(screen_uv_to_sdf(...))` (Godot's 2D SDF generated from LightOccluder2D) to march soft shadows and AO. "Dynamic 2D Lights…" supports `LIGHT_N = 100` lights via uniform arrays.
- **2D GI:** samuelbigos (MIT, Godot 3) uses JFA, a distance field, N rays per pixel, and one bounce per frame from the previous frame. Sohojoe (Apache-2.0, Godot 4.3) ports Radiance Cascades using **compute shaders**. jason.today demo: 8 rays/pixel, 256 px max reach.
- Godot's official 2D lights demo runs on `gl_compatibility` with PCF shadow filter.

**Inferences / risks:**
- Compute-based RC is **not usable on web/Compatibility**. A fragment-shader GI (samuelbigos style) would need multiple viewport passes, which is heavy for mobile web. For a low-res pixel game, GI at e.g. 320×180 might be viable, but that is unmeasured.
- Whether `texture_sdf` works in the Compatibility renderer was **not verified** (the renderer docs I checked don't say). Test before relying on SDF shaders for web.

---

## Q7. Tools for normal-mapped pixel art

- **Laigter** (GPL-3, v1.9.1, active Oct 2026): normal, parallax, specular and occlusion maps from sprites, with a preview. The GPL applies to the tool, not to generated maps (standard reading of the GPL; not a legal opinion). https://github.com/azagaya/laigter
- **PixiJS Lights** (MIT): consumes those normal maps on the web. **Godot**: CanvasTexture normal maps plus PointLight2D `height` (see the official demo's `godot_normal.png`).
- Sprite Lamp and SpriteIlluminator are commercial (not checked this session).
- **Lospec palettes:** licence for palette lists not verified (gap). Palettes are colour lists, so copyright risk is minimal, but credit the creators.

---

## Licence risk flags (summary)

- **AGPL-3.0:** Brogue CE. The strongest copyleft: never paste its code. Numbers and ideas only.
- **GPL-2/3:** TFS, Shattered PD, DOOM, Quake, DCSS, Laigter (tool), Veloren (unverified). Re-implement from description.
- **CC BY-SA 3.0:** Cataclysm DDA (code!). Share-alike would infect the game. Re-implement.
- **NetHack GPL:** concept only.
- **LGPL:** illuminated.js, Luanti code. OK as a separately linked library; avoid pasting into game scripts.
- **No licence (all rights reserved):** ncase sight-and-light repo, mattdesl lwjgl-basics (wiki), jason.today code, Silverwolf90/2d-visibility. Study only.
- **SAFE:** Godot demos (MIT), OTClient both forks (MIT), rot.js (BSD), libtcod (BSD-3), symmetric-shadowcasting (CC0), Red Blob Visibility.hx (Apache-2.0), PixiJS lights (MIT), samuelbigos GI (MIT), Sohojoe RC (Apache-2.0). godotshaders: per shader (site allows CC0, MIT or GPL-3, so **check each page**. The 4 checked are MIT/CC0).

## Top 5 gems for Kingsfoil (inference, ranked)

1. **OTClient Redemption per-tile light texture** (MIT). Tibia's own look: 1 texel per tile, max-blend, multiply, hash-gated re-upload. Directly portable to GDScript and web canvas.
2. **TFS day/night curve numbers** (250 to 40, ramps at 06–08 and 18–20, 1 h = 1 day). Re-implement in 10 lines.
3. **rot.js Lighting + compute90/180 cones** (BSD). FOV-based coloured tile light with bounce and lantern cones.
4. **Quake light-style strings plus Brogue random radius/colour jitter**. Light "personality" as data.
5. **Albert Ford symmetric shadowcasting** (CC0) + SPD-style circular rounding. FOV and fog of war tied to light.

## Gaps
- Star counts and download numbers not collected (GitHub API/HTML blocked in session).
- Tibia item light values (torch/lamp/spell levels and colours) not collected here.
- `texture_sdf` support in Godot Compatibility renderer unverified.
- No performance timings measured. All "cheap" claims are inference from algorithm complexity.
- Sprite Lamp / SpriteIlluminator, Lospec licence, Veloren licence, NetHack light.c and DCSS halo code not checked in detail.
- godotshaders "day/night", "LUT/palette light" and "radiance cascade" shaders not individually licence-checked (only 4 lighting shaders checked).

## Sources
- https://github.com/godotengine/godot-demo-projects (2d/lights_and_shadows, 2d/light2d_as_mask; LICENSE.md)
- https://github.com/edubart/otclient (src/client/lightview.cpp, src/framework/util/color.h, LICENSE)
- https://github.com/mehah/otclient (src/client/lightview.cpp/.h, LICENSE)
- https://github.com/otland/forgottenserver (data/scripts/globalevents/world_light.lua, world_time.lua, LICENSE)
- https://github.com/ondras/rot.js (src/lighting.ts, src/fov/recursive-shadowcasting.ts, license.txt)
- https://github.com/libtcod/libtcod (src/libtcod/fov_types.h, LICENSE.txt)
- https://github.com/370417/symmetric-shadowcasting (shadowcasting.py, LICENSE.txt) · https://www.albertford.com/shadowcasting/
- https://github.com/00-Evan/shattered-pixel-dungeon (…/mechanics/ShadowCaster.java, LICENSE.txt)
- https://github.com/tmewett/BrogueCE (src/brogue/Light.c, Globals.c, Rogue.h, LICENSE.txt)
- https://github.com/CleverRaven/Cataclysm-DDA (src/lightmap.cpp, src/lightmap.h, LICENSE.txt)
- https://github.com/luanti-org/luanti (src/voxelalgorithms.cpp, src/light.h, src/light.cpp, README.md, LICENSE.txt)
- https://github.com/id-Software/DOOM (linuxdoom-1.10/p_lights.c, p_spec.h, LICENSE.TXT)
- https://github.com/id-Software/Quake (qw-qc/world.qc, WinQuake/r_light.c, gnu.txt)
- https://github.com/gre/illuminated.js (src/illuminated.js, LICENSE)
- https://github.com/ncase/sight-and-light · https://ncase.github.io/sight-and-light/
- https://www.redblobgames.com/articles/visibility/
- https://github.com/mattdesl/lwjgl-basics/wiki/2D-Pixel-Perfect-Shadows
- https://github.com/pixijs/lights (README, LICENSE)
- https://github.com/samuelbigos/godot_2d_global_illumination (README, LICENSE, project.godot)
- https://github.com/Sohojoe/radiance-cascades-godot (README, LICENSE)
- https://jason.today/gi
- https://godotshaders.com/license/ · https://godotshaders.com/shader/dynamic-2d-lights-and-soft-shadows/ · https://godotshaders.com/shader/drop-in-pbr-2d-lighting-system-with-soft-shadows-and-ambient-occlusion/ · https://godotshaders.com/shader/2d-shadows-shader/ · https://godotshaders.com/shader/custom-2d-light/
- https://github.com/azagaya/laigter · https://azagaya.itch.io/laigter
- https://github.com/NetHack/NetHack (dat/license) · https://github.com/crawl/crawl (LICENSE)
