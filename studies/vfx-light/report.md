# Top-down pixel light and shadow: tiny algorithms for sun, fire, lanterns and the dark

**Kingsfoil Studios · Research study · November 2026**

---

## Context

This is study #5 in our VFX series. Each study picks one concept and hunts for old-school algorithms that are very small and very efficient.

- **Study #1, snow** [S2]: palette lighting and dithered lamp pools.
- **Study #2, acid** [S3]: glow by block-sum blur plus palette select.
- **Study #3, rain** [S4]: lightning flash palettes and firelight.
- **Study #4, forest** [S5]: shade ellipses, sunflecks and canopy.

The series reference is still the **DOOM PSX fire** [S1]: one number per cell, one local rule, one palette. For light there is a second reference from the same studio: **DOOM's sector light byte and COLORMAP** [S7–S9]. One byte per room, one palette remap table, and a few tiny timers make a world feel lit.

Snow, acid, rain and trees are *things* in the world. Light touches *every pixel of every thing*: it sets the time of day, marks what is safe, and gives each torch, candle and crystal a personality, over the whole screen, every frame. Each part has a classic few-line answer: a light byte per tile, a palette table per level, a 10 Hz flicker string, `height × cot(elevation)` for sun shadows, a polar depth row or shadowcast for torch shadows, and a keyframed palette for the day.

**Targets.**
- Godot 4, web-first, so the **Compatibility renderer** (WebGL 2, no compute).
- Top-down (3/4) pixel art for the Tibia-like MMORPG **Asterion Online** and a top-down RPG. **Tibia's own light system** is a key reference.
- Weak hardware.

**Sources.** Eight research notes (01–08) and our playable **Light Sandbox** [S6].

---

## 1. Executive summary

1. **Light is albedo × light map, and warm light with cool shadow emerges by itself.**
   - Flat colours × (sky ambient + unblocked sun + point lights) [I, S6]. Shadows lit only by bluish sky read cool, lamplit spots warm: shadows are "lit by the relatively blue skylight" (Gurney) [V, S198], blue by Rayleigh λ⁻⁴ [V, S188].
   - Gooch 1998 formalised the same warm/cool idea (b = y = 0.4, α = 0.2, β = 0.6) [V, S176]. Pixel artists call it hue shifting: "a hot light and cold shadows" [V, S203].
2. **The Tibia model is the MMO baseline.**
   - Each item or creature has a light radius (0 to about 10) and a colour index into a 6×6×6 cube. Torch = 7 / 206 = (255,204,102) [V, S29, S35].
   - OTClient Redemption writes a **texture with one pixel per tile**. Each light writes `max()` per channel, with linear falloff over the last 5 tiles. The texture is bilinear-stretched and **multiplied** over the map [V, S27].
   - The server sends one world light: **250 by day, 40 at night, with linear 2-hour ramps** (06–08, 18–20), updated every 10 s [V, S31].
3. **Godot's built-in 2D lights have hard limits, so use them sparingly.**
   - **15 positional lights per canvas item** (extras silently dropped); **256 per frame, or 64** on small-uniform-buffer GPUs; **4 shadow passes** per shadowed point light [V, S88, S95]. The docs call additive sprites "much faster" [V, S86].
   - **Plan:** an additive, low-resolution light map for most lights, plus **1–3 real shadowed lights** (the carried light and a few key lights) [I].
4. **Sun shadows: project by height.**
   - Length = `h · cot(elevation)`: 0.58h at 60°, 1h at 45°, 1.73h at 30°, 5.67h at 10° [K, S187]. Clamp it so it stays on screen and fade near the horizon; the Sandbox caps cot at 4 × 0.62 (≈2.5h) for the sun and 3 × 0.62 (≈1.9h) for the moon [I].
   - Graveyard Keeper rotates about **10 reusable shadow sprites** in the vertex shader [V, S109].
   - Godot directional shadows are always infinitely long; the docs point to a custom **SDF** shader for finite ones [V, S86].
5. **Point-light shadows: a 1D polar shadow map or a shadowcasting FOV.**
   - A polar map stores the distance to the first occluder per angle. Godot's own 2D shadows work this way [V, S88, S142].
   - On a tile grid, run FOV from the light. Milazzo measured **shadowcasting as the fastest** of 5 algorithms [V, S132]. Ford's **symmetric** shadowcasting meets all six of Milazzo's properties and is CC0 [V, S133].
6. **Personality is data, not code.**
   - **Quake light styles:** strings of 'a'–'z' played at **10 Hz**, 'm' normal, 'z' double; still used in Half-Life: Alyx [V, S17, S18, S23].
   - **DOOM:** fire flicker drops 0/16/32/48 every 4 tics (8.75 Hz); strobes 5/15/35 tics [V, S7, S8].
   - **Brogue** re-rolls each light's radius and colour every turn, and negative lights make darkness [V, S83].
   - **Real flames** oscillate at **10–12 Hz only in bundles of 3 or more**; a single candle is steady [V, S192].
7. **Palette tables do the shading, and the day is a table change, not a recompute.**
   - *Levels:* DOOM uses **16 light levels into 32 colormaps** [V, S9]. Diablo uses **16 palette remaps** [V, S45]. Build uses shade tables with coloured fade targets [V, S25, S26]. PICO-8's Dank Tomb uses **6 levels** [V, S222]. Pixels stay on-palette.
   - *Day/night:* Minecraft never re-floods sky light at night; it remaps through a 16×16 (block × sky) lightmap [V, S50, S51]. Luanti stores separate **day and night banks** and blends them [V, S61]. Graveyard Keeper grades the day through **10 LUTs** [V, S109]. Mark Ferrari fades "whole sets of palettes" over 24 hours [V, S210].
8. **Buildings: separate inside from outside, and let light through the gaps.**
   - Walls are tall occluders with holes at doors and windows. By day the sun patches the floor through the holes; at night the hearth spills out through them [I, S6].
   - Luanti's two banks give interior spill through doorways for free [I, S61]. Lit windows tell stories: Pokémon Crystal keeps its YELLOW palette at 0.90 luma at night [V, S205].

---

## 2. How to read this study

| Tag | Meaning |
|---|---|
| **[V]** | Verified in a source our researchers read: code, paper, docs, wiki or article. "[V, vendor]", "[V, self-reported]" and "[V, secondary]" mark figures reported by their authors or through an aggregator. |
| **[I]** | Author inference or design proposal; untested unless it says "Sandbox", and then tested only in our JavaScript prototype. |
| **[U]** | Unverified: memory, a search title, or a page that could not be fetched. Treat it as a lead. |
| **[K]** | Textbook or canonical knowledge (maths, well-known release years). |

- [S#] refers to §14. "[I, note 0X]" is an inference made by the researcher in that note.
- Ratings (1–5) are author judgement: **Simplicity · Speed · Pixel taste · Mood · Interactivity**.
- **[I, Sandbox run]** marks numbers from replaying the Sandbox's own code headless in Node.js. They are illustrative.
- Render time measured in headless Chromium on our machine was **~1.2–2.3 ms per frame**, with up to **28 lights (14 shadowed)** and **2–8 ray re-casts per frame**. That is a Canvas 2D figure at 320×180, illustrative only.
- Tibia uses 32 px tiles [V, S30]; the Sandbox works in pixels.

---

## 3. Generations: a timeline

**Gen 0: the science**
- **1860** Fechner's log law [V, S194]; **1941** Kruithof's zone [V, S196]; **1977** Crow's shadow volumes [V, S173]; **1978** Williams' shadow map [V, S174]; **1988** Blinn's fake shadow [V, S175].
- **1993** Minnaert in English (Dutch 1937 [U]) [V, S199]; **1998** Gooch warm/cool [V, S176]; **2000–01** night rendering and night sky [V, S190, S191].
- **2017** Fotios rejects Kruithof [V, S197]; **2019** 10–12 Hz candle bundles [V, S192].

**Gen 1: bytes, tables and palettes (1987–2002)**
- NetHack lit rooms (1987 onward) [V, S72]; Ultima Underworld's 8 levels [V, S43].
- **1993** **DOOM**: sector byte, 16 levels, 32 colormaps, 35 Hz thinkers [V, S7–S12].
- Mid-1990s: Build shade tables [V, S25, S26]; Hexen FOGMAP [V, S15]; SNES subtract darkness and HDMA windows [V, S213, S214].
- **1996** **Quake** light styles [V, S17–S21]; **Diablo** 16 tables, radius 10 [V, S45–S48].
- **1997** **Tibia** and Ultima Online [K; V, S44]. **1998** *Thief*'s light gem [V, S82]. **1999** flipcode 2D bump [V, S218].
- Pokémon Crystal night palettes; Gen III dark caves [V, S205, S75].

**Gen 2: systems and grids (2001–2019)**
- **2001** Bergström shadowcasting [V, S128]. **Aug 2006** Tibia 7.8 light slider [V, S40]. **2009** libtcod FOV benchmark [V, S130].
- **2011** Terraria's new light engine (1.1) [V, S58]. **2012** Red Blob visibility [V, S140].
- **2013–14** Sprite Lamp (Kickstarter, then Steam 25 Sep 2014) [V, S177, S178]. **2014** Milazzo's comparison [V, S132]. **2015** *Sight & Light* [V, S141].
- **2017** Dank Tomb [V, S222]. **2018** Dead Cells' painted normals [V, S110]; Ronja's 2D SDF [V, S145]; Robert Yang's GDC talk [V, S207].
- Undated: Ferrari palette worlds and Canvas Cycle [V, S210, S211].

**Gen 3: engines, shaders and the web (2020–2026)**
- **≤2020** Ford's symmetric shadowcasting [V, S133, S135]. **2020** *Half-Life: Alyx* keeps Quake strings [V, S24].
- **2022** pixel-art normal-map survey; DynaPix; Animal Well blog [V, S179, S180, S119]. **2023** KPas SDF shader; Nectarmancer [V, S152, S120].
- **2024** jason.today GI and RC; Sohojoe's Godot RC [V, S165, S166, S168].
- **Mar 2025** Godot 4.4 instance uniforms [V, S97]. **May 2025** Holographic RC [V, S164]. **Sep 2025** Godot 4.5, WASM SIMD [V, S98]. **Nov 2025** WebGPU everywhere [V, S127].
- **Jan 2026** Godot 4.6 [V, S99]. **Jun 2026** **Godot 4.7**: `DrawableTexture2D`, conic gradients [V, S100–S102]. **Jul 2026** Godot WebGPU talk [V, S126].

---

## 4. Technique profiles

There are eight families:

- **A.** Classic roots
- **B.** Sun and sky
- **C.** Point lights and shadows
- **D.** Personality
- **E.** Carried light
- **F.** Object interaction
- **G.** Pixel-art rendering
- **H.** Frontier

Each profile ends with ratings for **Simplicity · Speed · Pixel taste · Mood · Interactivity** (1 = poor, 5 = excellent; author judgement). Sandbox constants are listed in full in §8.

### Family A: Classic roots

### A1. DOOM sector light, COLORMAP and Build shade tables

*In plain words.* Every room has one brightness number. To darken a pixel, the game looks its palette index up in a "darker palette" table instead of doing colour maths. Far pixels use a darker table still.

*How it works (technical).*
- **Tables** [V, S9]: `LIGHTLEVELS 16`, `NUMCOLORMAPS 32`, `MAXLIGHTZ 128`, `DISTMAP 2`. The sector byte (0–255) is shifted right by 4, giving 16 levels.
  - `startmap = (15 − level) × 4`.
  - Floors use `zlight[16][128]`, walls and sprites `scalelight[16][48]`. Each entry is a pointer to a 256-byte remap row.
- **Inner loop** [V, S11]: `*dest = dc_colormap[texel]`, so lighting costs the same as no lighting.
- **COLORMAP lump** [V, S13]: 34 maps of 256 bytes. Rows 0–31 are light, row 32 the invulnerability map. Colours are re-quantised into the palette, so hue drifts as light drops [V, S14].
- **Fake contrast** [V, S10]: walls along one axis get `lightnum−−`, along the other `lightnum++`.
- **Fullbright** sprites (`FF_FULLBRIGHT`) skip diminishing [V, S12].
- **Hexen FOGMAP** fades rows toward grey index 23 (#939393) instead of black [V, S15].
- **Build** [V, S25, S26]: `numpalookups × 256` shade tables. Per-surface `shade` offsets and per-sector `visibility` (falloff speed). `makepalookup` takes a fade colour, "normally black", or white (63,63,63).

*Cost / performance.* One table fetch per pixel; 34 × 256 = 8,704 bytes [I, S13]. In a shader: a 256×N LUT texture [I].

*Games that used it.*
- DOOM: https://doomwiki.org/wiki/Light_diminishing
- Hexen fog: https://doomwiki.org/wiki/Fog
- Duke Nukem 3D: https://moddingwiki.shikadi.net/wiki/Duke_Nukem_3D_Palette_Format

*How it feels.* Moody and grainy: rooms fade to black and colours sour as they darken [I, S14].

*Risks.*
- Coloured lights are impossible within one row; everything darkens toward one target.
- Top-down has no depth, so "distance" must become distance-from-light or night amount [I].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 5 · Mood 4 · Interactivity 2

### A2. Quake lightmaps and light styles

*In plain words.* Light is baked into a coarse grid on every surface. Some lights are tagged with a "style": a string of letters that says how bright the light is in each tenth of a second.

*How it works (technical).*
- **Lightmaps** [V, S20]: one sample per 16×16 texels, at most 17×17 samples per surface.
- **Styles** [V, S17, S18]: `i = (int)(cl.time*10)`, `value = (map[i % len] − 'a') × 22`. 'a' = 0, 'm' = 264 ≈ 256 (normal), 'z' = 550 (about double). Twelve presets, e.g. `mmnmmommommnonmmonqnmmo` (flicker), `mamamamamama` (fast strobe). Styles 32–62 are switchable lights.
- Up to **4 styles** blend per surface; each sample is scaled by `lightadj[style]` [V, S21].
- **Dynamic lights** [V, S19]: muzzle flash radius `200 + (rand()&31)`, lives 0.1 s. A rocket light is radius 200 with `die = now + 0.01`, so it is respawned every frame; the `&31` jitter is the flicker.
- **Colormap** [V, S21]: 64 light rows × 256 (`VID_CBITS 6`); light is interpolated across 16/8/4/2-pixel blocks, then looked up.

*Cost / performance.* One character lookup per style per frame; lighting itself is baked [V, S18; I].

*Games that used it.*
- Quake source review: https://fabiensanglard.net/quakeSource/index.php
- Half-Life: Alyx: https://pcgamer.com/half-life-alyxs-lights-flicker-just-like-they-did-in-quake-almost-25-years-later

*How it feels.* Handmade: each light has a recognisable rhythm [I].

*Risks.*
- Baking needs an offline tool; dynamic changes are limited to style switching.
- Strobe presets can break flash-safety limits (§D3) [V, S200].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 4 · Mood 5 · Interactivity 3

### A3. Diablo: 16 light tables and a light radius

*In plain words.* The player carries a pool of light in a black dungeon. Each tile gets a darkness level from 0 to 15, and each level is a pre-shifted copy of the palette.

*How it works (technical).* (DevilutionX reconstruction.)
- **Constants** [V, S46]: `NumLightingLevels 16`, `LightTableSize 256`, `MAXLIGHTS 32`, `MAXVISION 4`.
- **Tables** [V, S45]: each shade walks the palette's 16- or 8-colour ramps, moving `shade·steps/16` entries toward the dark end. Past the ramp end it becomes black. Table 15 is all black.
- **Falloff** [V, S45]: `maxDistance = (radius+1)·8` sub-tiles; `LightFalloffs[radius][d] = d/maxDistance · 15`, linear. Hellfire's Nest and Crypt use a quadratic curve with over-exposure; lava indices 0–15 stay fullbright.
- **Combine** [V, S47]: each tile keeps the brightest value written; an 8×8 sub-tile offset smooths movement; search limit 15 tiles.
- **Radius** [V, S48]: player base `_pLightRad = 10`, plus item affixes. Bigger radius also means monsters notice you sooner [V, S49].

*Cost / performance.* About 4 KB of tables [I]; per tile a lookup and a min.

*Games that used it.*
- Diablo / Diablo II light radius: https://di.diablowiki.net/Light_radius
- DevilutionX: https://github.com/diasurgical/devilutionX

*How it feels.* Claustrophobic: the pool is safety, the rest threat [I].

*Risks.* Monochrome: there is no coloured light. A radius that sets both vision and aggro must be explained to players (Diablo III dropped it) [V, S49].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 5 · Mood 5 · Interactivity 3

### A4. Tibia: one pixel per tile, max not add

*In plain words.* A dark sheet with one coloured dot per tile. Each light brightens nearby dots; the sheet is stretched smooth and laid over the map like tinted glass.

*How it works (technical).*
- **Data** [V, S35–S38, S29]: `(lightradius, lightcolor)`. Colour index c ∈ 1..215: `r = (c/36 % 6)·51`, `g = (c/6 % 6)·51`, `b = (c % 6)·51`. 206 = (255,204,102) torch; 199 = (255,153,51) lamp; 193 = (255,102,51) lava; 215 = white.
- **Values** [V, S35–S38]: Lit Torch 7 → Medium 6 → Small 5; Lamp 6/199; Candelabrum 6/206; Campfire 7 (medium stage 5); Lava 4/193.
- **Redemption client** (mehah) [V, S27, S28]:
  - start every tile at the global colour;
  - `I = (intensity − distanceInTiles) · 0.2`, clamp to 1, skip below 0.01;
  - `r = max(r, color.r · I)` per channel;
  - upload one pixel per tile, bilinear, `MULTIPLY`;
  - skip all lights when `globalIntensity ≥ 250`;
  - re-upload only when a hash of lights, rect and colour changes.
- **Classic edubart client** [V, S30]: additive 512×512 "bubble" sprites (squared falloff, inner 10% white) into a light FBO, then multiply. `MAX_LIGHT_INTENSITY 8`.
- **Server** [V, S31, S32]: day 250, night 40, ramps 06:00–08:00 and 18:00–20:00, every 10 s; 1 real hour = 1 game day.

*Cost / performance.* About 20×15 texels per screen: effectively free [I, S27].

*Games that used it.*
- Tibia Lit Torch: https://tibia.fandom.com/wiki/Lit_Torch
- Tibia Illumination: https://tibia.fandom.com/wiki/Illumination
- OTClient: https://github.com/mehah/otclient

*How it feels.* "Tibia at night": soft warm blobs, never blown out, since max cannot exceed the brightest light [I].

*Risks.*
- Bilinear blur is soft, not pixel-crisp. Quantise or dither for retro (G1) [I].
- No occlusion except draw-order tricks (`resetShade` keeps lower-floor lights off upper floors) [V, S27].
- Players disliked gameplay darkness; 7.8 added a slider [V, S40].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 4 · Mood 4 · Interactivity 3

### A5. Tile flood-fill light (Minecraft, Terraria, Luanti)

*In plain words.* Light pours out like water, losing a step per tile; walls stop it, doorways let it through, sky light pours down.

*How it works (technical).*
- **Minecraft** [V, S50, S51]:
  - levels 0–15; block light −1 per taxicab step (torch 14, neighbours 13, diagonal 12);
  - sky light 15 straight down, −1 sideways;
  - client light = `max(sky, block)`; each level is 80% as bright as the one above;
  - night does not re-flood: the internal sky value is 15 at noon, 12 in rain, 10 in thunder, 4 at midnight; rendered night ≈ 17% luma, blue.
- **Removal** needs a second "unlight" BFS, then re-seeding [V, S53]. One clone budgets 2,048 steps per tick [V, S53].
- **Coloured BFS:** run per 4-bit channel [V, S54]. 0fps packs channels in one integer op [V, S52].
- **Terraria** [V, S57, S58]: RGB sources above 1.0 (torch #FFF2CC); 1.85% spread cut-off; range 42 tiles in air, 7 in solids. Modes Color (High cost), White, Trippy (mobile default), Retro (Low). Decay ≈ 0.91/tile air, 0.56 solid [U; consistent with ranges, S59].
- **Luanti** [V, S61]: `LIGHT_MAX 14`, `LIGHT_SUN 15`, bucket queue; DAY and NIGHT banks blended by `daylight_factor`.

*Cost / performance.* A level-L source touches `2L² − 2L + 1` tiles: 113 for L = 8 [I, note 03]. A Terraria-style 4-sweep pass costs about 4·W·H, independent of light count [I].

*Games that used it.*
- Minecraft: https://minecraft.wiki/w/Light
- Terraria modes: https://terraria.wiki.gg/wiki/Lighting_mode
- Luanti: https://github.com/luanti-org/luanti

*How it feels.* Systemic: light obeys walls, so doors matter [I].

*Risks.* Diamond-shaped pools from taxicab −1; use N8 costs, multiplicative decay or bilinear display [I]. Removal is the bug-prone half [V, S53].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 4 · Pixel taste 5 · Mood 3 · Interactivity 5

### A6. Roguelike lit rooms and integer torch radius

*In plain words.* A room is either lit or dark. A light is just "radius n tiles". What you can see is what is lit and in your line of sight.

*How it works (technical).*
- **NetHack** [V, S72]: rooms lit or unlit at creation. Candles: 1–6 → radius 2, 7–48 → 3, 49–342 → 4 (powers of 7). Lamp 3. `MAX_RADIUS 15`.
- **Angband** [V, S73]: torch `LIGHT_2`, lantern `LIGHT_3`; a flask of oil gives 7,500 turns.
- **DCSS** [V, S74]: `LOS_RADIUS 8`; line of sight is the light, with no torch economy.
- **Light = FOV from the light, clipped to its radius** (Milazzo) [V, S132]; see C4.
- **Visible = lit ∩ player FOV** [I, S140].

*Cost / performance.* Binary: one bit per tile. Radius changes rerun a small FOV [I].

*Games that used it.*
- NetHack: https://github.com/NetHack/NetHack/blob/NetHack-3.6/src/light.c
- Angband: https://github.com/angband/angband/blob/master/lib/gamedata/object.txt
- DCSS: https://github.com/crawl/crawl

*How it feels.* Crisp; players think in whole tiles [I].

*Risks.* No falloff, no colour, so it looks flat unless dressed with A4 or G1 [I].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 4 · Mood 2 · Interactivity 4

### A7. Palette night tints and the Purkinje rule (Pokémon Crystal)

*In plain words.* At night the game swaps in a darker, bluer set of palettes in one frame. Windows and characters keep their day colours, so they glow.

*How it works (technical).*
- **Pokémon Crystal** [V, secondary, S205]: night palettes keep about **0.51 of day luma** (0.41–0.68). The brightest shared night colour is about #7B73C5. The YELLOW palette stays at **0.90** so windows stay lit. Morning changes 5 of 32 colours. No fade; characters untinted. Roofs have their own table (night ≈ 0.56).
- **Kiradex** multipliers [V, secondary, S205]: morning (1, .96, .86), evening (1, .78, .6), night (.5, .58, .9) ≈ #8094E6.
- **Science** [V, S189, S190]: rods peak at 507 nm vs cones 555 nm, so "reds will appear darker". Realist night paintings average chromaticity **(0.29, 0.28)**; the study targets (0.25, 0.25). Painters keep edges and drop texture.
- **Recipe** [I, note 04]: desaturate ~50–70%, shift toward (0.25, 0.25), darken reds most, and merge adjacent ramp shades so texture fades while outlines stay.
- **SNES**: subtract a fixed colour that removes more red and green than blue [I, S213].

*Cost / performance.* Zero per pixel beyond the palette fetch you already do [I].

*Games that used it.*
- Pokémon Crystal (via aggregator): https://blakecrosley.com/de/blog/pixel-art-light-weather-time
- Pokémon dark caves: https://bulbapedia.bulbagarden.net/wiki/Darkness

*How it feels.* Storybook night; lit windows say someone is home [I].

*Risks.* An instant swap pops; use keyframe lerps (B2) for smooth time. A full-screen multiply tint crushes the palette instead [I, note 06].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 5 · Mood 4 · Interactivity 1

### Family B: Sun and sky

### B1. Day/night ambient curves

*In plain words.* One clock number drives one ambient colour: white-blue by day, orange at the edges, deep blue at night.

*How it works (technical).*
- **Tibia (TFS)** [V, S31]: 40 → 250 between 06:00 and 08:00; 250 → 40 between 18:00 and 20:00; colour 215; recomputed every 10 s. An older OT version uses sunrise 430, sunset 1305 minutes, +7 per tick [V, S33].
- **Ultima Online (ServUO)** [V, S44]: day 0, night 12, dungeon 26 (higher is darker); RunUO ramps 22:00–24:00 and 04:00–06:00.
- **RimWorld** [V, S67]: daytime about 05:00–19:00; roofed tiles 0% unless lit; artificial light capped at 50%.
- **Stardew** [V, S71, S205]: an ambient fill colour per context; 0.7 s per game minute; nightfall 18:00 in winter, 20:00 in summer; rain adds OrangeRed × 0.45 outdoors.
- **Godot** [I, S86]: animate `CanvasModulate.color` from a Gradient, or fill the light map with it.
- **Sandbox** [V, S6]: four keys: NIGHT (.10,.12,.24), TWI (.34,.28,.44), GOLDA (.46,.42,.54), DAYA (.5,.56,.7), chosen by sun elevation (§6c).

*Cost / performance.* Approximately zero: one colour per frame [I].

*Games that used it.*
- Tibia server curve: https://github.com/otland/forgottenserver/blob/master/data/scripts/globalevents/world_light.lua
- Ultima Online: https://github.com/ServUO/ServUO/blob/master/Scripts/Misc/LightCycle.cs
- RimWorld: https://www.rimworldwiki.com/wiki/Light

*How it feels.* Time passing; flat on its own [I].

*Risks.* A pure multiply darkens everything equally, which is "muddy" [V, S203]. Keep night ≥ about 0.4 of day luma for walkable ground [I, S205].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 3 · Mood 3 · Interactivity 1

### B2. LUT and palette time-of-day, plus day and night layers

*In plain words.* Instead of tinting the screen, re-colour it through a "look" table for each time of day, and blend between neighbours. Store how much each tile sees the sky once, and let the table decide how bright that sky is right now.

*How it works (technical).*
- **Graveyard Keeper** [V, S109]: **10 LUTs** (night, twilight, evening…) made by applying Photoshop adjustments to a screenshot, then to an identity LUT. The author calls the speed "Lightning-fast". Light-sprite intensity also follows the time.
- **Ferrari / Canvas Cycle** [V, S210, S211]: one image, many palettes; `Palette.fade(dest, frame, max)` is a per-entry lerp. An X-Men project used 9 palettes (3 scenes × 3 times), keeping about half the 256 entries in reserve. Lit windows are pixels whose indices turn warm in night palettes.
- **Dead Cells** [V, S110]: greyscale backgrounds coloured by a per-biome gradient map.
- **Minecraft** [V, S50]: a 2D lightmap texture indexed by (block, sky), moved to a shader in 1.21.2 [V, S51].
- **Luanti** [V, S61]: two light banks, DAY and NIGHT, `blend_light(daylight_factor 0..1000, day, night)`, then a 16-entry gamma LUT.

*Cost / performance.* A strip LUT lerped between two keys costs 2 fetches per pixel in one pass [I, note 02]. A palette lerp is 16–256 colours per frame on the CPU [I, note 08].

*Games that used it.*
- Graveyard Keeper: https://slava.lazybeargames.com/graveyard-keeper-how-the-graphics-effects-are-made
- Living Worlds (Ferrari palettes): https://8bitnews.io/article/living-worlds
- Dead Cells: https://gamedeveloper.com/production/art-design-deep-dive-giving-back-colors-to-cryptic-worlds-in-i-dead-cells-i-

*How it feels.* Painterly: an artist sets each hour's mood [I].

*Risks.* LUT seams at transitions if the two LUTs disagree strongly. Night LUTs must exempt emissive pixels, or lamps go grey [I].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 5 · Mood 5 · Interactivity 2

### B3. Sun shadows: height projection, rotated sprites and blobs

*In plain words.* A shadow is the object squashed onto the ground and pushed away from the sun. Low sun means long shadows. The cheapest versions use a dark oval, or a pre-drawn shadow shape that rotates.

*How it works (technical).*
- **Maths** [K, S187]: `len = h · cot(elev)`: 60° → 0.58h, 45° → 1h, 30° → 1.73h, 20° → 2.75h, 10° → 5.67h, 6° → 9.5h. Shadow azimuth = sun azimuth + 180°. Clamp it (the Sandbox uses ≈2.5h for the sun and ≈1.9h for the moon) and fade near the horizon [I].
- **Blinn 1988** [V, S175]: a matrix flattens the object onto the ground plane.
- **Three tiers** [V/I, note 03]:
  - *Blob:* an ellipse. Minecraft entities use circles [V, S50]. Pokémon Emerald uses flat 5-px-tall ellipses in 4 sizes [V, secondary, S205].
  - *Rotated sprite:* Graveyard Keeper keeps about **10 shadow sprites** (thin, thick, oval), rotated in the vertex shader with the angle in a colour channel. Up to 4 shadows per object: 1 sun plus 3 nearest lights. Fences distort [V, S109].
  - *Sheared silhouette:* the sprite again in one colour, sheared by azimuth and scaled by `cot(elev)` [I].
- **Height-map shaders** [V, S150, S151]: oblique march toward the sun (≤ 96 steps); tilemap version ~45 iterations × 2 reads.
- **Godot directional shadows** are always infinite; finite ones need an SDF shader [V, S86].
- **Sandbox** [V, S6]: every elevated pixel casts at `base + dir · hh · k` with `k = 0.62 · min(4, cot(max(4°, el)))`; roofs use `hh = 22`, canopies 15; about 8% of canopy pixels skip as sunflecks.

*Cost / performance.* Blob: one quad. Sheared copy: one extra sprite. Sandbox per-pixel projection reruns only when the clock moves 1/40 hour [V, S6].

*Games that used it.*
- Graveyard Keeper: https://slava.lazybeargames.com/graveyard-keeper-how-the-graphics-effects-are-made
- Sea of Stars: https://www.pcgamer.com/sea-of-stars-is-a-gorgeous-retro-rpg-from-the-makers-of-the-messenger
- Pokémon Emerald shadows: https://blakecrosley.com/de/blog/pixel-art-light-weather-time

*How it feels.* The single strongest "time of day" cue. A sundial obelisk teaches it instantly [I, S6].

*Risks.*
- Long shadows on top-down maps look wrong; Slynyrd keeps wall shadows ≤ 1 tile [V, secondary, S205].
- Smoothly rotating pixel shadows swim; quantise the direction to 8–16 steps [I].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 4 · Pixel taste 4 · Mood 5 · Interactivity 2

### B4. Golden hour, twilight, moonlight, overcast and cloud shadows

*In plain words.* Drive the sky by the sun's height, not the clock. Low sun is gold with blue shadows; just below the horizon there are no shadows; at night the moon gives faint blue ones; overcast removes them.

*How it works (technical).*
- **Thresholds** [V, S185, S186]: golden hour has no single definition (0° to 6°, or −6° to +6°); blue hour 3°–10° below; civil twilight to −6° (no artificial light yet needed); nautical to −12°; night from −18°.
- **Temperatures** [V, S184, S185]: ~2,000 K just after sunrise, ~3,500 K golden hour, ~5,500 K midday, 6,500 K overcast, 15,000–27,000 K clear blue sky.
- **Phase table** [I, note 04]: α > 6° day; 0–6° golden; 0 to −6° no shadows, lamps on; −6 to −12° deep blue, windows pop; below −12° night palette.
- **Moonlight** is physically *warmer* than sunlight [V, S190], yet painted blue (A7).
- **Overcast** [I]: sun ≈ sky, soft or no shadows.
- **Clouds** [V, S159]: "Cloud Cast Shadow 2D" (CC0, 2025-06-28) draws moving cloud shadows on the ground.
- **Sandbox** [V, S6]: `el = 62·sin((h−6)/12·π)`; moon `40·sin((h−18)/12·π)` casts blue (.16,.19,.32) shadows above 4°; overcast zeroes the sun.

*Cost / performance.* One elevation value per frame; clouds are one scrolling noise texture [I].

*Games that used it.*
- Sea of Stars day/night: https://techraptor.Net/gaming/news/sea-of-stars-gameplay-clip-shows-day-night-cycle
- Eastward (dawn/dusk fog, sun-beams): https://www.gamedeveloper.com/art/eastward-s-creators-share-insights-on-making-pixel-art-adventures

*How it feels.* Golden hour is the screenshot hour. The twilight gap without shadows feels hushed [I].

*Risks.* Long golden-hour shadows (cot of 6° = 9.5h) need clamping. Cloud shadows over a palette world can look like dirt if they multiply instead of remapping [I].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 4 · Mood 5 · Interactivity 1

### Family C: Point lights and shadows

### C1. Additive light map at low resolution

*In plain words.* Keep a small, separate picture of "how much light is here". Fill it with the ambient colour, stamp a soft glow sprite for every lamp, then multiply the world by it once.

*How it works (technical).*
- **Stardew** [V, S71]: render target `Game1.lightmap`; fill with ambient; draw each on-screen `lightTexture` at `position / (lightingQuality/2)`; composite with a custom blend and **LinearClamp**, scaled up. Cull at `radius × 64 × 4` px. Window lights skipped in rain or darkness.
- **Unity URP 2D** [V, S107, S108]: light textures at **Render Scale 0.5** by default; Additive, Multiply or Subtractive styles.
- **Factorio** [V, S69]: default "lights render resolution" changed to **0.25**.
- **Godot** [V, S86]: additive sprites "much faster", but they cannot light fully dark areas, cast no shadows, and ignore normal maps. BackBufferCopy plus a screen shader handled more than 16 lights in one forum report [V, S95].
- **Canvas recipe** [I, note 08]: 1/4-res offscreen canvas, `'lighter'` stamps, `'multiply'` composite. `destination-out` holes cannot mix colour.
- **Mask variant** [V, S217]: the GBA "OBJ window" marks sprite-shaped regions; darken outside it for unlimited light shapes (G4).
- **Upscale choice** [I]: linear for soft light (Children of Morta lights at HD [V, S111]), nearest plus Bayer for pixel light (G1).

*Cost / performance.* Each stamp is R² texels at reduced resolution, plus one multiply per screen pixel [I]. The Sandbox stamps about 105k texels for 28 lights at 320×180 [I, Sandbox run; §6e].

*Games that used it.*
- Stardew Valley (code mirror): https://git.nea.moe/github/SMAPI.git/plain/src/SMAPI/Framework/SGame.cs
- Factorio lamp: https://wiki.factorio.com/Lamp
- Children of Morta: https://techraptor.net/content/how-dead-mage-created-the-art-for-children-of-morta

*How it feels.* Warm, mixing pools [I].

*Risks.* Additive sums blow out where lights overlap; use max (A4) or HDR-add-then-normalise (D4). The camera transform must be mirrored into the map [I].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 4 · Mood 4 · Interactivity 3

### C2. Godot PointLight2D, LightOccluder2D and their limits

*In plain words.* Godot's real 2D lights look great and cast shadows, but each sprite can only "hear" about 15 of them, and each shadowed light is a small render job.

*How it works (technical).*
- **Forward, per item** [V, S86, S88, S89]: each lit CanvasItem loops over its lights, sampling the light texture, the normal map and 1, 5 or 13 shadow taps.
- **Caps** [V, S88]: `MAX_LIGHTS_PER_ITEM = 16`, effective **15**; `max_lights_per_render` 256, or **64** when the max uniform buffer is under 64 KB.
- **Assignment** [V, S88]: light mask match, z within [z_min, z_max], rects intersect. Smaller light textures dodge the cap; forum users hit it with 320 px textures on 64 px sprites, fixed below 192 px [V, S95].
- **Shadows** [V, S88]: atlas `rendering/2d/shadow_atlas/size` 2048 × (lights × 2) rows; **4 passes** per point light (90° each); PCF5/PCF13 are 5/13 taps. Filter None is "well suited for games with a pixel art aesthetic" [V, S86].
- **Pixel snapping** [V, S86]: lighting runs at viewport resolution; snap `LIGHT_VERTEX` and `SHADOW_VERTEX` with `floor()`.
- **Height** [V, S91]: PointLight2D `height` in pixels; 100 lights an object 100 px away at 45°.
- **TileMapLayer quadrants** are one canvas item each, so the 15-light cap applies per quadrant [I; quadrant size 16 is U].

*Cost / performance.* Forum, 4.5.2, no shadows: 115 fps → 85 with one light, about −10 fps for the 2nd and 3rd, then −2–3 each (device unknown) [V, community, S96].

*Games that used it.*
- Godot demo (Compatibility): https://github.com/godotengine/godot-demo-projects/tree/master/2d/lights_and_shadows
- Godot "light as mask" demo: https://github.com/godotengine/godot-demo-projects/tree/master/2d/light2d_as_mask

*How it feels.* Smooth and modern [I].

*Risks.* Silent light dropping; cost grows with lit area × lights × taps. Design for ≤ 8–12 Light2D on web, 1–3 shadowed [I, note 02].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 2 · Pixel taste 3 · Mood 4 · Interactivity 4

### C3. 1D polar shadow map

*In plain words.* From a lamp, shoot rays in all directions and remember how far each one got before hitting a wall. A pixel is lit if it is closer than the remembered distance for its direction.

*How it works (technical).*
- **Williams 1978** shadow map, flattened to one row [V, S174; I].
- **mattdesl** [V, S142]: per light, (1) 256×256 occluder FBO, (2) polar reduce into **256×1** (alpha threshold 0.75), (3) `step(r, dist)`; a 9-tap blur that widens with distance. About 20 lights before fill-rate limits on a GeForce 9400; "performs poorly on Android".
- **Unity, geometry-based** [V, S143]: one row per light, 0–540° to avoid wrap; 64 lights in a ~1024×64 map; "couple of milliseconds" (no measurement).
- **Godot** draws occluders into a 2-px row per light, 4 × 90° frusta [V, S88].
- **Sandbox** [V, S6]: 256 rays, 1-px steps, stop where occluder height ≥ 0.6 × light height; `dist = d + 1.5`; a pixel is lit if `DST ≤ dist[ANG]` from precomputed 129×129 tables.

*Cost / performance.* Sandbox: 256 × R steps per cast (campfire R = 58 → 14,848), about **60 µs per cast** in Node [I, Sandbox run]. Angular resolution: a 2048 atlas gives 512 texels per quadrant, ≈ 0.18° [I, note 03].

*Games that used it.*
- Godot's built-in 2D shadows (engine source): https://raw.githubusercontent.com/godotengine/godot/master/drivers/gles3/rasterizer_canvas_gles3.cpp
- Tutorial: https://github.com/mattdesl/lwjgl-basics/wiki/2D-Pixel-Perfect-Shadows

*How it feels.* Crisp, believable torch shadows that swing as you walk [I, S6].

*Risks.* Per-light passes add up; thin occluders can slip between rays at long range [I].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 4 · Pixel taste 4 · Mood 5 · Interactivity 4

### C4. Shadowcasting as light: recursive and symmetric

*In plain words.* Run the "what can I see?" algorithm from the lamp instead of the player. Every tile the lamp can see is lit, dimmer with distance.

*How it works (technical).*
- **Bergström 2001** [V, S128]: 8 octants; scan rows outward; on a blocker, recurse with a narrowed slope window; tiles in shadow are never visited. "especially fast in confined areas".
- **Milazzo 2014** [V, S132]: speed factors: shadowcasting **100%**, diamond walls 78%, Milazzo's 53%, ray casting 52%, permissive 11%. Room 120×65: 398,466 vs ray casting 39,478 per second. For light: run FOV from the light with radius = light radius.
- **Ford** [V, S133]: 4 quadrants; exact `Fraction` slopes; floors visible if their centre is in the sector, walls if any part is; meets all six properties; matches Bresenham line of sight; CC0, 117 lines; in libtcod as `FOV_SYMMETRIC_SHADOWCAST` [V, S138].
- **Benchmarks** [V, S130]: indoor 80×80 shadowcasting 38 µs; empty 20×20, 30 µs (2009 hardware, C). Debenham & Solis-Oba: incremental update 0.36–1.9 ms vs 6.7–46 ms on 4096² grids [V, S131].
- **Circular radius:** SPD's rounding table `min(j, round(i·cos(asin(j/(i+0.5)))))` (re-implement; GPL) [V, S85]. RuggRogue uses radius + half a tile [V, S139].
- **Brightness** [I]: `max(0, 1 − d/r)`, quantised to 4–6 levels; one texel per tile.

*Cost / performance.* About πR² tile visits per light, ~200 for R = 8 [I, note 08]; static lights cast once.

*Games that used it.*
- Comparative study: https://roguebasin.com/index.php/Comparative_study_of_field_of_view_algorithms_for_2D_grid_based_worlds
- Ford's algorithm: https://www.albertford.com/shadowcasting/
- Brogue CE: https://github.com/tmewett/BrogueCE

*How it feels.* Fair: if a monster's lamp lights you, you see the monster [I].

*Risks.* Tile-blocky shadows unless filtered. Basic shadowcasting is not symmetric (0.93% indoor errors) [V, S130].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 5 · Mood 3 · Interactivity 5

### C5. Visibility polygons, shadow quads and SDF soft shadows

*In plain words.* Three off-grid ways to stop light at walls: draw the shape the lamp sees; draw black shapes behind walls; or march toward the lamp asking a distance field how near the closest wall is.

*How it works (technical).*
- **Angle sweep** (Red Blob) [V, S140]: sort endpoints by angle, keep open walls, emit triangles; demo with 24 lights; union = add with clamp, intersection = multiply. A CGAL implementation measured "50X faster" than the author's.
- **Corner rays** (Nicky Case) [V, S141]: rays to every unique endpoint and ±0.00001 rad; soft shadows from 11 offset origins.
- **Shadow quads** (Crow 1977) [V, S173]: extrude back-facing edges by `(p − light) × big` [I].
- **SDF soft shadow** [V, S144, S145]: `res = min(res, k·h/t)`, k = 2–128 hardness; Aaltonen's fix uses the previous sample. Ronja: 32 samples, hardness 20.
- **Godot's 2D SDF** [V, S88, S92, S94]: built from LightOccluder2D, free unless read. GLES3 implements `texture_sdf`. Scale defaults to 50%. KPas' MIT shader: 100 lights, 32 steps, 9 taps per step; zoom reportedly breaks on Compatibility [V, community, S152].

*Cost / performance.* Sweep: O(n log n) per light on the CPU. SDF: per pixel × per light × steps, so keep ≤ 4 lights and ≤ 16–32 steps at low resolution [I, note 04].

*Games that used it.*
- Red Blob visibility: https://www.redblobgames.com/articles/visibility/
- Nothing To Hide / Sight & Light: https://ncase.me/sight-and-light/

*How it feels.* SDF penumbrae are lovely for magic; polygons are sharp and "arcade" [I].

*Risks.* SDF cost is per pixel; soft gradients fight pixel art unless dithered (G1) [I].

*Ratings 1–5 (author judgement):* Simplicity 3 · Speed 3 · Pixel taste 3 · Mood 4 · Interactivity 4

### C6. Shadow-height rule: low fences versus tall lamps

*In plain words.* A knee-high fence blocks a campfire on the ground, but a street lamp on a tall post shines over it. Give every occluder a height and every light a height, and only block when the wall is tall enough.

*How it works (technical).*
- **Sandbox rule** [V, S6]: ground-level occluder grid `OCC` (heights in px); a ray stops when `OCC ≥ 0.6 × light.h`. Fence 5, barrel 9, rock 7, tree trunk 22, house wall 30–34, obelisk 28, characters 12. Campfire h = 4 → threshold 2.4 (the fence blocks); street lamp h = 16 → 9.6 (it passes the fence).
- **Godot** uses PointLight2D `height` only for normal-map shading, not for occlusion [V, S91; I].
- **Graveyard Keeper** fakes depth: when the sprite is between light and camera, light fades quickly instead of cutting off [V, S109].
- **Variant** [I]: a soft rule: `block = smoothstep(0.4, 0.8, occ/h)`, so low walls cast partial shadows.

*Cost / performance.* One compare per ray step [V, S6].

*Games that used it.* No shipped game documented in our notes; closest: Graveyard Keeper's fake light depth: https://slava.lazybeargames.com/graveyard-keeper-how-the-graphics-effects-are-made

*How it feels.* Lamps feel high, fires feel low: a quiet realism players sense without naming [I].

*Risks.* A single threshold pops when a light's height animates; clamp heights per type [I].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 4 · Mood 4 · Interactivity 4

### C7. Caching static lights and dirty updates

*In plain words.* Most lights never move: compute their shadows once, redo only when something nearby changes.

*How it works (technical).*
- **OTClient** [V, S27]: re-upload the light texture only when a hash of lights, source rect and global colour changes; pixels double-buffered.
- **Minecraft clones** spread BFS over ticks (2,048 steps per tick) [V, S53].
- **RuggRogue** recomputes FOV only on a dirty flag [V, S139]. rot.js caches FOV per emitter [V, S137].
- **Incremental FOV** [V, S131]: 0.36–1.9 ms vs 6.7–46 ms full.
- **Luanti day/night banks**: no re-flood when the sun moves [V, S61].
- **Sandbox** [V, S6]: a shadowed light re-casts if `dirty`, if carried, or if a character is within `R + 6` px; otherwise it reuses its 256 distances. Sun shadows rerun only when `round(hour·40)`, roof state, overcast or the option changes.

*Cost / performance.* Sandbox: **2–8 ray re-casts per frame** with 14 shadowed lights; shadows on vs off at 21:00 costs about 0.5 ms extra (2.38 vs 1.83 ms average) [I, Sandbox run].

*Games that used it.*
- OTClient: https://github.com/mehah/otclient
- RuggRogue: https://tung.github.io/ruggrogue/source-code-guide/field-of-view.html

*How it feels.* Invisible, which is the point [I].

*Risks.* Stale caches when doors open; tie invalidation to map edits and moving occluders [I].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 3 · Mood 2 · Interactivity 3

### Family D: Personality

### D1. Colour temperature and the hue vocabulary

*In plain words.* Each kind of light has a colour. Flames are deep orange, old lamps amber, noon white, overcast slightly blue. Magic lives off that scale on purpose.

*How it works (technical).*
- **Kelvin anchors** [V, S184, S185]: match 1,700 K; **candle and sunrise/sunset 1,850 K**; incandescent 2,400 K; soft white 2,700 K; warm white 3,000 K; golden hour ~3,500 K; noon 5,500–6,000 K; overcast 6,500 K; blue sky 15,000–27,000 K.
- **Approximate hex** [I, note 04; U]: candle 1,850 K ≈ #FF8B14; fire 1,900–2,000 K ≈ #FF8A12 to #FF9329; tungsten 2,700 K ≈ #FFA757 [U, note 06].
- **Shipped vocabulary** [V, S60]: Terraria torch #FFF2CC; Ice #899BFF; Cursed #9FFF50; Corrupt #AD49FF; Jungle #84FF9E; Mushroom #40A6FF (76%). Pure red, green and blue torches are dimmed to 37–47%.
- **RimWorld lamp** (214,148,94) [V, S68]. **Kiradex** lamp cone (.7,.52,.24) ≈ #B3853D [V, secondary, S205].
- **Mood grid** [V, S196, S197]: Kruithof says dim + warm is pleasant, dim + cold gloomy; Fotios 2017 finds no empirical support. Use it as an art rule: dim + cold = eerie [I].
- **Off-locus colour** (cyan, violet, green) signals the unnatural [I, note 04].

*Cost / performance.* A colour per light type [I].

*Games that used it.*
- Terraria light colours: https://terraria.wiki.gg/wiki/Light_source
- RimWorld standing lamp: https://rimworldwiki.com/wiki/Standing_lamp

*How it feels.* The palette of light *is* the world's mood [I].

*Risks.* Full-saturation lights look cheap; artists warn "avoid using 100% saturation" [V, S203].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 4 · Mood 5 · Interactivity 1

### D2. Flicker as data: Quake strings and DOOM timings

*In plain words.* Write flicker down as a tiny score: a string of brightness letters, or a timer rule. Play it back at a fixed rate.

*How it works (technical).*
- **Quake strings** at 10 Hz [V, S17, S18, S23]: candle A `mmmmmaaaaammmmmaaaaaabcdefgabcdefg`; candle B `mmmaaaabcdefgmmmmaaaammmaamm`; flicker `mmnmmommommnonmmonqnmmo`; fluorescent `mmamammmmammamamaaamammma`; gentle pulse `jklmnopqrstuvwxyzyxwvutsrqponmlkj`; slow strong pulse (5.1 s cycle). Presets attributed to John Romero, 1993 [V, S23].
- **DOOM thinkers** at 35 Hz [V, S7, S8]:
  - fire flicker: every 4 tics (8.75 Hz) `light = max − (rand&3)·16`, floor min + 16;
  - flash: dark `(rand&7)+1` tics, bright `(rand&64)+1`, so bright is 1 or 65 tics (29 ms or 1.86 s): bursty;
  - strobe: 5 tics bright, 15 or 35 dark;
  - glow: ±8 units per tic between neighbour-min and own level.
- **Pixel tip** [I]: quantise flicker to the light's band count and step at 8–12 Hz, so pools "step" like hand animation.

*Cost / performance.* One character lookup per light per 100 ms [V, S18].

*Games that used it.*
- Quake / Half-Life lightstyles: https://www.alanzucconi.com/2021/06/15/valve-flickering-lights/
- DOOM sectors: https://doomwiki.org/wiki/Sector

*How it feels.* Authored rather than random. A broken lamp's 1-or-65-tic burst is instantly "electrical fault" [I].

*Risks.* Identical strings in sync make a whole town pulse; offset each light's phase [I]. The strings are GPL code data; write your own [V, S7; note 07].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 5 · Mood 5 · Interactivity 2

### D3. Noise flicker, candle physics, pulses, blackouts and breathing radius

*In plain words.* Fire wavers fast and unevenly; a lone candle barely moves; magic breathes slowly; electric light stays on and then suddenly dies. The size of the glow can breathe too.

*How it works (technical).*
- **Physics** [V, S192]: 1–2 candles: stable, non-periodic. **≥ 3 candles: 10–12 Hz**, lower as count grows (6 candles 10.72–10.96 Hz). Two 3-candle groups sync in phase at ~20 mm and anti-phase at ~35 mm.
- **Recipes** [I, notes 03 and 04]: torch `1 − 0.18·|noise(6t)| − 0.07·noise(11t)`; magic `0.85 + 0.15·sin(2π·0.5t + phase)`; electric `rand < 0.03 per frame → 0.1`.
- **Sandbox** [V, S6]: fire `.82 + .18·n1(9t) − gust`; campfire `.78 + .22·n1(7t)·n1(2.3t) + .06·sin(1.3t)`; candle `.95 + .03·n1(1.5t)`, minus up to .22 with a 2% chance per ⅓ s (almost steady, as a lone flame should be); lantern `.95 + .03·n1(4t)`; lamp `.97 + .02·n1(2t)`; magic `.72 + .28·sin(0.9πt)` (2.2 s); rune drops to .08 in about 6% of 83 ms slots; mushroom `.55 + .45·sin(1.2t)`; firefly `max(0, sin 1.7t)⁶`. Fire radius breathes ×(.94 + .06·I).
- **Quake** radius jitter: `rand()&31` on 200 ≈ ±8% [V, S19].
- **Flash safety** [V, S200]: no more than 3 flashes per second above a 10% luminance change, within a 341×256 px area at 1024×768.

*Cost / performance.* A few noise lookups per light per frame [I].

*Games that used it.*
- Candle study (physics): https://pmc.ncbi.nlm.nih.gov/articles/PMC6344522/
- Procedural torch shader (CC0): https://godotshaders.com/shader/procedural-torch-candle-shader-fire-smoke-sparks/

*How it feels.* Fast noise reads as fire, slow sine as magic, dropouts as dread [I].

*Risks.* Uniform random flicker looks noisy and cheap [I, note 06]. A strobing rune over a big area can fail WCAG; offer a "reduce flicker" option [I].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 4 · Mood 5 · Interactivity 2

### D4. Brogue jitter, darkness lights and colour mixing

*In plain words.* Every turn, each light picks a slightly different size and colour from its own range, so torches "dance". Some lights are negative and eat light. When lights overlap, their colours must mix without turning white.

*How it works (technical).*
- **Brogue** (AGPL, study only) [V, S83]:
  - `color = {r,g,b, rRand,gRand,bRand, rand, dances}`; each paint adds random amounts;
  - radius `{lower, upper}` in 1/100 tiles; falloff `100 − (100 − fadeTo)·dist/radius` inside an FOV mask;
  - torch `{75,38,15, 0,15,7}`, radius 10, fade 50%; candle radius 2–4; darkness cloud `{−20,−20,−20}`;
  - flares fall by −15 per frame, the change itself ×1.2 per frame.
- **Mixing options** (Milazzo) [V, S132]: add + saturate ("decent"); blend (≤ 2 colours); **HDR add, then rescale by the max channel**, so yellow + red = (510,255,0) → (255,127,0), orange, "the best option in general"; HDR average.
- **Max** (Tibia, Minecraft): never blows out, no mixing [V, S27, S50].
- **CDDA** (CC BY-SA, study only): colour weighted by luminance, so the brighter source wins the hue [V, S84].

*Cost / performance.* One max and one divide per tile for HDR-normalise [I, note 04].

*Games that used it.*
- Brogue CE: https://github.com/tmewett/BrogueCE
- Cataclysm: DDA: https://github.com/CleverRaven/Cataclysm-DDA

*How it feels.* Alive and slightly magical; darkness lights feel genuinely cursed [I].

*Risks.* Turn-based jitter at 60 fps strobes; step it at 5–10 Hz [I, note 07].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 4 · Mood 5 · Interactivity 3

### Family E: Carried light

### E1. Carried light as a resource: radius, fuel and stealth

*In plain words.* A torch is a little circle of safety that shrinks as it burns. A bigger light shows more, but also shows *you* to whatever lives in the dark.

*How it works (technical).*
- **Tibia** [V, S35, S39]: Lit Torch 7 for 10 min → Medium 6 for 5 min → Small 5 for 5 min → burnt out. **Fuel is the radius stepping down.** Lamp 6, 33 min. Spells: Light "3 tile radius", 6 min 10 s, 20 mana; Great Light "4 tile radius", 11 min 35 s; Ultimate Light radius 4, 33 min. Spell levels differ by era: 1/3/12 [V, S42] vs 8/13/26 [V, S41].
- **Don't Starve (Together)** [V, S63, S66]: torch **75 s**; skills 90/110/150 s; range skills 1.5/2/2.5 tiles; rain burns up to 150% faster unless under trees. Darkness lets Charlie attack: −100 health, −20 sanity [V, S62]. Fire Pit light "shrinks as the fire weakens" [V, S65].
- **Diablo** [V, S48, S49]: radius 10 plus affixes; radius also sets when monsters react; low-light gear lets players sneak.
- **Fire Emblem** [V, S77]: Torch item +10 vision (FE5), +4 later, +5 in FE16, decaying 1 per turn.
- **Thief** [V, S82]: the light gem shows visibility; Neurath: showing it "in a very clear way is important."
- **Darkwood** [V, S80]: flashlight is "a tight cone", 120 s per battery, no weapon while held.
- **Hollow Knight** [V, S81]: the Lumafly Lantern (1,800 Geo) gates dark zones.

*Cost / performance.* One radius value per carrier [I].

*Games that used it.*
- Don't Starve Together torch: https://dontstarve.wiki.gg/wiki/Torch/DST
- Thief light gem: https://gamedeveloper.com/design/building-the-original-i-thief-s-i-revolutionary-stealth-system
- Darkwood flashlight: https://darkwood.fandom.com/wiki/Flashlight
- Hollow Knight lantern: https://hollowknight.wiki/w/Lumafly_Lantern

*How it feels.* Tension with a timer. Each step down in radius is a small alarm [I].

*Risks.* Punishing darkness in an MMO caused Tibia to add a slider [V, S40]. Keep the stealth trade-off to specific zones (crypts) [I, note 06].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 3 · Mood 5 · Interactivity 5

### E2. Carried light motion: sway, cones and follow orbs

*In plain words.* A carried light should move like it is carried: offset to the hand, bobbing with the step. A lantern can be a cone that points where you walk. A light spell can float after you a little late.

*How it works (technical).*
- **Cones:** rot.js `compute90` / `compute180` give lantern cones from FOV [V, S137]; CDDA headlights use `apply_light_arc` [V, S84]; Pokémon Platinum's Hearthome Gym lanterns light only the area in front [V, S75]; Godot 4.7 adds conic `GradientTexture2D` fills for cone masks [V, S100].
- **Hand offset and bob** [I, note 06]: ±1 px vertical bob in sync with the step; a 1-frame-delayed radius.
- **Sandbox** [V, S6]: torch and lantern at `player.x ± 4` by facing, `y + 1`; the lantern adds `round(sin(anim·0.5))` px while walking; the light spell (orb) eases toward `(x − 5, y − 2)` at `min(1, 3·dt)` per frame and draws 14 px up with a `sin(2t)·1.5` bob. Carried rays start at 3 px so the carrier's own feet do not block them.

*Cost / performance.* A carried shadowed light re-casts every frame: about 60 µs in Node for R ≈ 50 [I, Sandbox run].

*Games that used it.*
- Pokémon Platinum cone (Darkness page): https://bulbapedia.bulbagarden.net/wiki/Darkness
- Darkwood cone: https://darkwood.fandom.com/wiki/Flashlight

*How it feels.* A swinging lantern feels embodied; a trailing orb feels magical and companionable [I].

*Risks.* Bob amplitude above 1 px makes pixel shadows shimmer [I].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 4 · Pixel taste 4 · Mood 4 · Interactivity 5

### Family F: Object interaction

### F1. Nature: canopy shade, sunflecks, water reflections, fireflies and glow mushrooms

*In plain words.* Trees throw broken shade with bright spots. Water shows a shimmering streak of each nearby light. Fireflies blink; mushrooms breathe a cold glow.

*How it works (technical).*
- **Canopy and sunflecks** (study #4) [V, S5]: shade ellipses; sunfleck images ~1/100–1/108 of the gap height across.
- **Sandbox** [V, S6]: canopy pixels cast sun shadow except ~8% (`hash < .08`), which become flecks; canopies receive point light at 45% and roofs at 20%.
- **Water** [V, S6]: a 5-px-wide column under each light with `R ≥ 12` near the pond, kept where `sin(1.3y + 5t + 2.1x) + sin(0.7y − 3.3t) ≥ 0.9`; also the low sun (0–10°) and the moon.
- **Moon reflection** as a vertical streak of 1–2 px highlights jittered per row [I, note 06].
- **Glow life** [I, note 04]: magic 0.3–1 Hz breathing; fireflies 0.5–2 Hz blinks (design choices). Brogue's luminescent fungus `{2,11,11}`, radius 3 [V, S83]. Terraria's Mushroom torch #40A6FF [V, S60].

*Cost / performance.* Reflections touch a few columns of pond pixels. Tiny lights skip shadows [V, S6].

*Games that used it.*
- Forest study (sunflecks): https://kingsfoil-artifacts.netlify.app/vfx-forest-topdown-pixel
- Terraria mushroom light: https://terraria.wiki.gg/wiki/Light_source

*How it feels.* Life at night; a pond that answers the lantern feels wet and real [I].

*Risks.* Too many blinking things read as noise; keep glow life near water and grass [I].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 4 · Mood 5 · Interactivity 3

### F2. Decorations: string lights, braziers and lamp posts on a schedule

*In plain words.* Lamps along a road come on one by one at dusk and go off at dawn. Fence posts carry strings of tiny bulbs. Temple steps get braziers.

*How it works (technical).*
- **Rhythm** [I, note 06]: lanterns on fence posts every 4–6 tiles read as a road at night; string lights as 1-px dots with staggered phases.
- **Light grammar** [V, S208, S207]: "We typically make something glow if we want a player to interact with it"; lit areas read as safe; mark exits with hierarchy and keep the language consistent.
- **Sandbox schedule** [V, S6]:
  - street lamps k = 0..3 on at `18.9 + 0.175k` h (18:54, 19:04, 19:15, 19:25), off at `5.6 − 0.105k` (05:36 to 05:17);
  - wall torches, bulbs, mushrooms and fireflies on when sun elevation < 3° (from 17:49);
  - campfire, brazier and crystal burn all day.

*Cost / performance.* A boolean per light per frame [I].

*Games that used it.*
- The Everdream (light grammar): https://theeverdream.itch.io/the-everdream/devlog/793280/designing-with-light
- Stardew Valley torch: https://stardewvalleywiki.com/Torch

*How it feels.* A town routine: lamps lighting one by one is a tiny nightly cut-scene [I].

*Risks.* All lamps switching on the same frame looks mechanical; stagger by index or hash [I].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 4 · Mood 5 · Interactivity 3

### F3. Buildings: occluding walls with gaps, sun patches, night spill, roof cutaway and lit windows

*In plain words.* Houses are tall walls with holes. By day sunlight comes in through the holes as moving patches. At night the fire inside shines out through the same holes onto the grass. When you walk in, the roof lifts.

*How it works (technical).*
- **Area ids** [I, note 03]: flood-fill rooms at load; outdoor tiles follow the sun, indoor tiles get a dim fixed ambient plus interior lights. Light BFS spills through open doors (cost 1) and windows (cost 2–3).
- **Luanti banks** give spill for free: sky bank 15 outdoors, falling off from doors [I, S61].
- **CDDA**: indoors gets `DIM × 0.8` when it is bright outside [V, S84].
- **Roof cutaway** [I]: fade the roof layer when the player's area is an interior.
- **Lit windows** [V, S205, S210]: Crystal's YELLOW palette stays at 0.90 luma; Kiradex draws windows untinted and spills a 40×28 px warm cone; Ferrari reserves window indices that turn warm in night palettes; Stardew hides window light in rain or darkness [V, S71]. xDasher projects window frames through "cookie" textures [V, S206]. Celeste: "the lights needed to actually hit walls" [V, secondary, S205].
- **Sandbox** [V, S6]: walls are occluders of 30 (house A) and 34 (house B) px with gaps for door and windows; inside, pixels get 28% of sky ambient plus sun patches found by marching up to 40 px toward the sun (walls ≥ 20 block); the fireplace and candle are shadowed point lights that shine out through the gaps; two pre-built world versions swap when the player is inside house A.

*Cost / performance.* Sun-patch march only when the roof is off and the clock moves [V, S6].

*Games that used it.*
- Pokémon Crystal windows: https://blakecrosley.com/de/blog/pixel-art-light-weather-time
- xDasher cookies: https://pixel-beef.itch.io/xdasher/devlog/192949/4-things-we-did-to-add-light-and-depth-to-our-pixel-art-game

*How it feels.* Homes feel inhabited; entering feels like a scene change [I].

*Risks.* Walls without gaps make houses black boxes. Interior lights leaking through roofs look wrong; damp them (Sandbox 20%) [V, S6].

*Ratings 1–5 (author judgement):* Simplicity 3 · Speed 4 · Pixel taste 4 · Mood 5 · Interactivity 5

### F4. Characters casting shadows

*In plain words.* Characters get a dark oval under their feet, a shadow from the sun, and long shadows away from nearby fires.

*How it works (technical).*
- **Blob** [V, S205]: Pokémon Emerald ellipses 5 px tall in 4 sizes; Kiradex runner shadow (18,17,23) at alpha 153, 12×4 px. Minecraft circles [V, S50].
- **Graveyard Keeper** [V, S109]: up to 3 light shadows from the nearest dynamic lights, plus the sun; the per-frame nearest-light search was heavy.
- **Carrier shadow** [I, note 06]: a stretched drop-shadow ellipse rotated away from the source.
- **Shader** [V, S162]: "2D shadow with bottom offset" (CC0) skews the sprite with a foot offset; casts only to the right as written.
- **Sandbox** [V, S6]: each character writes a 5×2 px occluder of height 12 at its feet, so point lights cast its shadow; the sun shadow is a 5-px strip of 12 height steps (3 px wide above 9).

*Cost / performance.* Blob: one quad. Occluder stamp: 10 px per character per frame [V, S6].

*Games that used it.*
- Graveyard Keeper: https://slava.lazybeargames.com/graveyard-keeper-how-the-graphics-effects-are-made
- Gobs and Gods shader: https://godotshaders.com/shader/2d-shadow-with-bottom-offset-image-ratio-independent-shadow-direction-and-minimal-vertex-increase/

*How it feels.* Grounded; long campfire shadows are pure atmosphere [I].

*Risks.* Many lights × many characters multiplies shadow draws; cap at 1–3 per character [V, S109; I].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 4 · Pixel taste 4 · Mood 4 · Interactivity 4

### Family G: Pixel-art rendering

### G1. Banded and Bayer-dithered falloff

*In plain words.* Real light fades smoothly; pixel light fades in steps. Use a few rings of brightness, and break each edge with a checkerboard so it does not band.

*How it works (technical).*
- **Dank Tomb (PICO-8)** [V, S222]: **6 light levels**, "kind of a sweet spot"; draw lit, then darken concentric discs; a 256-entry LUT per level maps a whole byte (2 pixels) per lookup; 60 fps.
- **Falloff curves** [I, note 03]: linear, smooth `t²(3 − 2t)`, quadratic, or geometric `0.8^n` (Minecraft) [V, S51].
- **Perception** [V, S194, S195]: brightness is compressive (Stevens exponent 0.33–0.5), so use multiplicative steps, e.g. ×0.6 per level [I, note 04].
- **Banded formula** [I]: `floor(smooth·N + bayer4(px)/16)/N`, N = 4–6.
- **Godot**: snap `LIGHT_VERTEX` [V, S86]; "Banded Lighting" shader (MIT, 2026-02-25) [V, S161].
- **Sandbox** [V, S6]: "Banded + dither" mode uses `floor(l·6 + B/16)/6` per channel with a 4×4 Bayer matrix.

*Cost / performance.* One threshold fetch per pixel [I].

*Games that used it.*
- Dank Tomb: https://www.hackernoon.com/pico-8-lighting-part-1-thin-dark-line-8ea15d21fed7
- Snow study (dithered lamp pools): https://kingsfoil-artifacts.netlify.app/vfx-snow-topdown-pixel

*How it feels.* Unmistakably retro rings of light [I].

*Risks.* Too few bands look posterised; dithering shimmers if the light moves sub-pixel [I]. Medeiros: "In pixel art we favor sharp transitions to avoid banding." [V, S202]

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 5 · Mood 3 · Interactivity 1

### G2. Palette ramps, hue shifting and glow without alpha

*In plain words.* Darker should mean bluer and less saturated, brighter should mean warmer. A glow is not a transparent blur, but rings of brighter palette colours around the source.

*How it works (technical).*
- **Gooch** [V, S176]: `I = ((1 + l·n)/2)·k_cool + (1 − (1 + l·n)/2)·k_warm`, `k_cool = (0,0,b) + α·k_d`, `k_warm = (y,y,0) + β·k_d`; b = 0.4, y = 0.4, α = 0.2, β = 0.6. "cool colors recede while warm colors advance".
- **Artists** [V, S201–S204]: one key light direction; shadows "deep blues and purples instead of shades of black" (Ishii, secondary [S205]); avoid pillow shading; hue shifting is light colour × local colour (Pixel Parmesan).
- **Build** 64 KB translucency table blends any two indices [V, S25].
- **Emissive exemption**: DOOM fullbright, Diablo lava, Crystal windows [V, S12, S45, S205]. Kiradex: "a pool of light never darkens what it lies on" [V, secondary, S205].
- **Sandbox** [V, S6]: "DOOM colormap" mode: 16 levels per colour at brightness l/10; below 0.7, red ×(1 − .28w), green ×(1 − .2w), blue ×(1 + .25w); index = `floor(lum·11 + Bayer)`.
- **Glow rings** [I, note 06]: 2–3 dithered rings, quantised to palette.

*Cost / performance.* One LUT fetch per pixel [I].

*Games that used it.*
- Dead Cells gradient maps: https://gamedeveloper.com/production/art-design-deep-dive-giving-back-colors-to-cryptic-worlds-in-i-dead-cells-i-
- Acid study (palette glow): https://kingsfoil-artifacts.netlify.app/vfx-acid-topdown-pixel

*How it feels.* Rich and painterly; night stays colourful instead of grey [I].

*Risks.* Luminance-only lookups turn coloured lights grey (the Sandbox colormap mode shows this) [V, S6].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 5 · Mood 5 · Interactivity 1

### G3. Normal maps for sprites, and the 2D bump trick

*In plain words.* A hidden "which way does this pixel face" picture lets a torch light a sprite's near side. For bricks, treat brightness as height and look light up in a table.

*How it works (technical).*
- **Sprite Lamp** [V, S177]: the artist paints 2–5 greyscale "lighting profiles"; outputs normal, depth, anisotropy and AO maps.
- **Shipped** [V, S109, S110, S119]: Graveyard Keeper paints light from 4 sides and merges them; Dead Cells paints normals by hand; Animal Well draws normals manually.
- **Research** [V, S179–S181]: 3D generators give "incorrect results on pixel art" (Moreira 2022); DynaPix finds **16–20 colours** enough for a normal map; Nikolov 2025 skips normals and predicts light maps with a UNet.
- **Tools** [V, S118, S183, S182]: Laigter (GPL tool, free); PixelNormalGen ($3.99); a vendor comparison says brightness tools turn "dark belts" into trenches [V, vendor].
- **Nectarmancer** [V, S120]: pre-baked 4-channel edge maps instead of normals; in-shader edges would cost "8 extra texture reads per pixel".
- **2D bump** [V, S218, S219]: `dx = h(i,j) − h(i−1,j)`, `dy = h(i,j) − h(i,j−1)`; `intensity = lightmap[128+dx][128+dy]` from a 256×256 radial map.
- **Godot** [V, S86, S160]: CanvasTexture normal maps; "Normal Map Only" (CC0) puts normals on a light-only TileMapLayer.

*Cost / performance.* 2D bump: 2–3 fetches per pixel per light [I, note 08]. Normal maps ride on Light2D cost (C2).

*Games that used it.*
- Graveyard Keeper: https://slava.lazybeargames.com/graveyard-keeper-how-the-graphics-effects-are-made
- Animal Well: https://blog.playstation.com/?p=367113
- Nectarmancer: https://80.lv/articles/how-pixel-art-lighting-was-set-up-in-seamless-world-of-nectarmancer

*How it feels.* Props come alive as a torch passes [I].

*Risks.* Smooth normals make pixel art look plastic; quantise them. Top-down ground faces up, so only walls, props and characters gain [I, note 04].

*Ratings 1–5 (author judgement):* Simplicity 2 · Speed 3 · Pixel taste 3 · Mood 4 · Interactivity 4

### G4. Hardware colour math and mask windows (GBA/SNES)

*In plain words.* Old consoles darkened or brightened whole layers in hardware and used "windows" to choose where. A circle-shaped window around the hero was the lantern.

*How it works (technical).*
- **SNES** [V, S213–S215]: CGADSUB add/subtract with per-layer enables; add only lightens, subtract only darkens; channels clamp 0–31; COLDATA per scanline via HDMA for gradients; sprite palettes 0–3 are exempt. Windows clip colour math; HDMA rewrites edges per line for spotlights and an iris; logic OR/AND/XOR/XNOR.
- **GBA** [V, S216, S217]: BLDY darken `I − I·EVY` (EVY 0–16/16); the **OBJ window** marks a region from sprite pixels, so arbitrary light shapes are possible.
- **Per-line circle** [I, note 08]: `x = cx ∓ sqrt(r² − dy²)`; one or two convex shapes per line, which is why SNES games kept one lamp circle.
- **Godot equivalent** [I]: a light mask viewport, darken outside. The "light as mask" demo uses Mix blend [V, S105].

*Cost / performance.* One mask fetch and one multiply per pixel, any number of shapes [I].

*Games that used it.*
- Yoshi's Island and DKC subtract darkness: https://snes.nesdev.org/wiki/Color_math
- Spotlight windows: https://wiki.superfamicom.org/grog's-guide-to-sub-screen-addition-subtraction-and-mask-windows-on-the-snes
- Zelda: A Link to the Past dark rooms [U on technique]: https://tcrf.net/A_Link_to_the_Past

*How it feels.* Hard-edged and theatrical [I].

*Risks.* Binary edges unless dithered [I].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 5 · Mood 3 · Interactivity 3

### Family H: Frontier

### H1. Radiance cascades: 2D global illumination

*In plain words.* Light bounces off walls and colours nearby surfaces. Radiance cascades compute this with few rays near each pixel and more rays far away, at a fixed cost for a given resolution.

*How it works (technical).*
- **Penumbra idea** [V, S166]: far light needs more angular, less spatial resolution; each cascade trades spatial resolution for more ray directions, so far light is sampled with many directions on a coarse grid and near light with few directions on a fine grid; the exact ray counts in S166 were not re-checked [U]. Naive 1024² × 512 rays ≈ 500M rays per frame, "roughly 100x" too slow.
- **Holographic RC** [V, S164]: 1.85 ms at 512², 7.67 ms at 1024² on an RTX 3080 Laptop.
- **Ringing** is "still an active area of research"; fixes can double frame time [V, S166].
- **Ports** [V, S167–S171]: Godot RC by Sohojoe uses compute (not web); samuelbigos GI is Godot 3, JFA + raymarch, one bounce per frame.

*Cost / performance.* Several ms on desktop GPUs; no WebGL2 mobile numbers [V, S164; gap].

*Games that used it.*
- Blastronaut (2D ray-traced indoor light, GodotFest 2025): https://app.media.ccc.de/v/godotfest2025-raytracing-is-simple-for-2d-games
- jason.today interactive demo: https://jason.today/rc

*How it feels.* Glowing and physical, but not the Tibia look [I].

*Risks.* Cost and ringing; Compatibility has no compute [V, S168; I].

*Ratings 1–5 (author judgement):* Simplicity 1 · Speed 1 · Pixel taste 3 · Mood 5 · Interactivity 4

### H2. DrawableTexture2D light accumulation and instance uniforms

*In plain words.* Godot 4.7 can draw sprites straight into a texture with add, multiply or mix blending. That is a light map without setting up an extra viewport. Godot 4.4 lets each torch carry its own flicker phase without breaking batching.

*How it works (technical).*
- **DrawableTexture2D** [V, S100–S102]: `setup(w, h, format)`, `blit_rect(rect, source, modulate, mipmap, material)`, `blit_rect_multi` (up to 4 sources); formats RGBA8, RGBA8_SRGB, RGBAH, RGBAF; blending by `shader_type texture_blit` with `blend_add`/`blend_mul`/`blend_mix`. Methods are marked experimental. Compatibility support is not confirmed [U].
- **Instance uniforms** [V, S97]: "does not break batching"; one flicker material with per-instance `phase` and `tint` [I].

*Cost / performance.* A low-res texture plus one blit per light per frame [I].

*Games that used it.* None documented yet. Docs: https://docs.godotengine.org/en/4.7/tutorials/rendering/drawable_textures.html

*How it feels.* Same as C1, with less plumbing [I].

*Risks.* Experimental API; wrap it, and test on web [I].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 4 · Pixel taste 4 · Mood 3 · Interactivity 3

---

## 5. Comparison scorecard

All ratings are author judgement for top-down pixel art on web Godot. "Sum" is a crude total, not a recommendation: a low-sum technique such as C7 can still be mandatory.

| # | Technique | Simpl. | Speed | Pixel taste | Mood | Interact. | Sum |
|---|---|---|---|---|---|---|---|
| A1 | DOOM sector light, COLORMAP, Build shades | 5 | 5 | 5 | 4 | 2 | 21 |
| A2 | Quake lightmaps and light styles | 4 | 5 | 4 | 5 | 3 | 21 |
| A3 | Diablo 16 tables + light radius | 5 | 5 | 5 | 5 | 3 | 23 |
| A4 | Tibia per-tile max-blend light | 5 | 5 | 4 | 4 | 3 | 21 |
| A5 | Tile flood fill (MC / Terraria / Luanti) | 4 | 4 | 5 | 3 | 5 | 21 |
| A6 | Roguelike lit rooms, integer radius | 5 | 5 | 4 | 2 | 4 | 20 |
| A7 | Palette night tints, Purkinje rule | 5 | 5 | 5 | 4 | 1 | 20 |
| B1 | Day/night ambient curves | 5 | 5 | 3 | 3 | 1 | 17 |
| B2 | LUT / palette time-of-day, day+night banks | 4 | 5 | 5 | 5 | 2 | 21 |
| B3 | Sun shadows: projection, rotated sprites, blobs | 4 | 4 | 4 | 5 | 2 | 19 |
| B4 | Golden hour, twilight, moon, overcast, clouds | 4 | 5 | 4 | 5 | 1 | 19 |
| C1 | Additive low-res light map | 4 | 5 | 4 | 4 | 3 | 20 |
| C2 | Godot PointLight2D + occluders | 4 | 2 | 3 | 4 | 4 | 17 |
| C3 | 1D polar shadow map | 4 | 4 | 4 | 5 | 4 | 21 |
| C4 | Shadowcasting as light | 4 | 5 | 5 | 3 | 5 | 22 |
| C5 | Visibility polygons, quads, SDF | 3 | 3 | 3 | 4 | 4 | 17 |
| C6 | Shadow-height rule | 5 | 5 | 4 | 4 | 4 | 22 |
| C7 | Caching static lights | 4 | 5 | 3 | 2 | 3 | 17 |
| D1 | Colour temperature vocabulary | 5 | 5 | 4 | 5 | 1 | 20 |
| D2 | Flicker as data (Quake / DOOM) | 5 | 5 | 5 | 5 | 2 | 22 |
| D3 | Noise, candle physics, pulses, blackouts | 4 | 5 | 4 | 5 | 2 | 20 |
| D4 | Brogue jitter, darkness lights, mixing | 4 | 5 | 4 | 5 | 3 | 21 |
| E1 | Radius, fuel and stealth | 5 | 5 | 3 | 5 | 5 | 23 |
| E2 | Sway, cones, follow orbs | 4 | 4 | 4 | 4 | 5 | 21 |
| F1 | Nature: shade, flecks, water, glow life | 4 | 5 | 4 | 5 | 3 | 21 |
| F2 | Decorations on a schedule | 5 | 5 | 4 | 5 | 3 | 22 |
| F3 | Buildings: gaps, patches, spill, cutaway | 3 | 4 | 4 | 5 | 5 | 21 |
| F4 | Characters casting shadows | 4 | 4 | 4 | 4 | 4 | 20 |
| G1 | Banded + Bayer falloff | 5 | 5 | 5 | 3 | 1 | 19 |
| G2 | Palette ramps, hue shift, glow rings | 4 | 5 | 5 | 5 | 1 | 20 |
| G3 | Normal maps, 2D bump | 2 | 3 | 3 | 4 | 4 | 16 |
| G4 | Hardware colour math, mask windows | 5 | 5 | 5 | 3 | 3 | 21 |
| H1 | Radiance cascades | 1 | 1 | 3 | 5 | 4 | 14 |
| H2 | DrawableTexture2D + instance uniforms | 4 | 4 | 4 | 3 | 3 | 18 |

**Reading the table.** Cheap, data-driven classics score highest (A3, E1, C4, C6, D2, F2); engine-native options (C2, H1) score lowest on web speed [I].

---

## 6. Deep dives

### 6a. Light personality catalogue

Colours: Kelvin anchors from S184/S185; Sandbox hex and radius in px from its `TYPES` table [V, S6]; Tibia radius in tiles [V, S35–S38]. Hex values for K are approximate [U]. Heights are Sandbox `h` in px.

| Source | Colour (K → hex) | Radius | Flicker model | Height | Shadows? | Gameplay role |
|---|---|---|---|---|---|---|
| Candle | ~1,850 K; Sandbox #ffb35a | Sandbox 20 px; NetHack 1–6 candles → 2 tiles [V, S72] | Mostly steady; rare draught dip (Sandbox up to −.22 at 2% per ⅓ s); Quake candle strings | 6 | Yes (Sandbox); optional | Cosy interiors, reading spots |
| Torch | 1,900–2,000 K [U]; Sandbox #ff8c3a; Tibia 206 (255,204,102) | Tibia 7→6→5 tiles; Sandbox 46 px | Fast noise ~9 Hz + gusts; DOOM 8.75 Hz steps; radius breathes ±6% | 10 | Yes | Carried safety with fuel; wall markers |
| Campfire | ~1,850–2,000 K; Sandbox #ff7030; Terraria ≈ (1.06,.46,.26) [V, S57] | Tibia 7 (medium 5); Sandbox 58 px | Product of two noises + slow 1.3 rad/s swell | 4 | Yes; low, so fences block | Wilderness rest point; temporary safety |
| Brazier / forge | Sandbox brazier #ff5a2a; Tibia lava 193 (255,102,51) | Sandbox 46 px; Tibia lava 4 | Fire noise | 8 | Yes | Temple steps, landmarks, danger near lava |
| Lantern | 2,200–2,400 K [I]; Sandbox #ffc870 | Sandbox 40 px | `.95 + .03·noise(4t)`, sways with stride | 9 | Yes | "Safe" steady carried light |
| Oil street lamp | ~2,400–2,700 K; Sandbox #ffd9a0; RimWorld (214,148,94) | Sandbox 54 px; RimWorld 12-tile glow radius, 50% to ~7 | `.97 + .02·noise(2t)` | 16 | Yes; tall, passes fences | Roads, town routine at dusk |
| Fireplace | Sandbox #ff7a34 | Sandbox 48 px | Campfire model | 6 | Yes; spills through gaps | Lit homes, storytelling |
| Magic crystal | Off-locus cyan↔violet; Sandbox #7ae6ff ↔ #b48cff | Sandbox 44 px | Sine 0.45 Hz; colour lerp ~15.7 s | 10 | Yes | Shrines, loot, "alien" |
| Rune / electric | Cold white; Sandbox #dfe8ff | Sandbox 40 px | Steady with dropouts to 8% (~6% of 83 ms slots); Quake fluorescent | 12 | Yes | Tension, broken tech, traps |
| Glow mushroom | Sandbox #5cffc8; Brogue fungus {2,11,11} r 3 | Sandbox 13 px | Breathing sine ~5.2 s | 2 | No | Cave guidance, ambient life |
| Firefly | Sandbox #d6ff6a | Sandbox 7 px | `max(0, sin 1.7t)⁶` blink | 6 | No | Ambient night life near water |
| Moon | Physically warmer than sun [V, S190], painted blue; Kiradex night (.5,.58,.9) | Global | None | Elev. ≤ 40° | Faint blue (Sandbox .16,.19,.32) | Night readability |
| Sun, noon | 5,500–6,000 K; Sandbox (1.02,.98,.9) | Global | None | Elev. 62° (Sandbox) | Short, north-pointing | Default play light |
| Sun, golden hour | ~3,500 K; Sandbox (1.05,.72,.42) at 6–20° | Global | None | 0–6° (definitions vary) | Long, clamped | Screenshot hour, mood |
| Sun, twilight | ~1,850–2,000 K at sunrise/sunset; Sandbox TWI ambient (.34,.28,.44) | Global | None | 0 to −6° | None | Lamps switch on |

### 6b. Object interaction matrix

What each class of object should do under each kind of light [I unless cited].

| | Sun (day) | Point light | Night |
|---|---|---|---|
| **Nature** (trees, grass, rocks, water) | Canopy shade with ~8% sunflecks [S6]; rocks cast short shadows; overcast removes shadows | Trunks block (height 22 in Sandbox); canopy receives at 45%; pond shows a shimmering column per light [S6] | Moon streak on water; fireflies and mushrooms on; grass texture collapses in the night palette [S190] |
| **Decorations** (fences, barrels, signs, statues, braziers) | Short projected shadows; an obelisk or sign post reads as a sundial [S6] | Height rule: low fences block campfires, not street lamps [S6]; barrels (9) block low lights | Lamp posts stagger on; string lights blink with offset phases; braziers become landmarks [S208] |
| **Buildings** (walls, roofs, windows, doors) | Footprint-shaped shadow; sun patches inside through window and door gaps [S6]; fake contrast on wall faces [S10] | Walls occlude; light leaves through gaps onto grass; roofs receive only 20% [S6] | Lit windows untinted and warm [S205]; staggered on/off; hearth spill; roof lifts when entering [S6] |
| **Characters** (player, NPCs, monsters) | Blob plus projected shadow; Emerald ellipses [S205] | 5×2 px occluder at feet casts long shadows away from fires [S6]; ≤ 3 light shadows (Graveyard Keeper) [S109] | Characters untinted or rim-lit for readability [S205]; carriers bring their own light; light gem if stealth matters [S82] |

### 6c. Day/night timeline

Sandbox values come from replaying its `sky()` and `scheduleLights()` [I, Sandbox run]. "Shadow k" is shadow length per pixel of height (`0.62·min(4, cot(max(4°, el)))`); the obelisk is 28 px tall. Tibia world light from TFS [V, S31]; Minecraft internal sky light from S51.

| Hour | Sun elev. | Ambient RGB | Sun RGB | Shadow k / obelisk | Tibia light | Lights on (Sandbox) |
|---|---|---|---|---|---|---|
| 00:00 | −62° (moon 40°) | .10,.12,.24 | moon .16,.19,.32 | 0.74 / 21 px | 40 | 36: all except house A; fireplace stays on |
| 03:00 | −44° | .10,.12,.24 | moon | 1.15 / 32 px | 40 | 35 |
| 05:30 | −8° | night→twilight | moon | 1.86 / 52 px | 40 | House A on 05:30–06:24; lamps off 05:17–05:36 |
| 06:00 | 0° | .34,.28,.44 | 0 | no shadow | 40 (ramp starts) | 32 |
| 06:12 | 3.2° | .40,.36,.49 | .98,.58,.34 | 2.48 / 69 px (clamped) | ≈ 61 | 6: night lights off when elev ≥ 3° |
| 07:00 | 16° | .49,.52,.65 | 1.03,.91,.76 | 2.16 / 60 px | 145 | 4: campfire, brazier, crystal, carried torch |
| 08:00 | 31° | .50,.56,.70 | 1.02,.98,.90 | 1.03 / 29 px | 250 | 4 |
| 12:00 | 62° | .50,.56,.70 | 1.02,.98,.90 | 0.33 / 9 px | 250 (MC sky 15) | 4 |
| 17:00 | 16° | .49,.52,.65 | 1.03,.91,.76 | 2.16 / 60 px | 250 | 5: fireplace on 17:00–07:00 |
| 17:36 | 6.5° | .46,.42,.55 | 1.05,.73,.44 | 2.48 / 69 px | 250 | 5 |
| 17:49 | 3° | .40,.36,.49 | .98,.58,.34 | 2.48 / 69 px | 250 | 31: wall torches, bulbs, mushrooms, fireflies, NPC lantern |
| 18:15 | −4° | .22,.20,.34 | 0 | none (twilight gap) | ≈ 224 | 31 |
| 18:24 | −7° | → night | moon from 4° | — | ≈ 208 | 32: house A |
| 18:54 | −14.5° | .10,.12,.24 | moon | 1.86 / 52 px | ≈ 155 | 34: house B, lamp 1 |
| 19:25 | −22° | night | moon | 1.86 / 52 px | ≈ 101 | 37: all four lamps (14 shadowed) |
| 20:00 | −31° | night | moon | 1.70 / 48 px | 40 | 37 |
| 23:24 | −61° | night | moon | 0.75 / 21 px | 40 | 36: house A candle and windows off |
| 00:18 | −62° | night | moon | 0.74 / 21 px | 40 | 35: house B off |

Notes:
- Minecraft's internal sky light goes from 15 at noon to 4 at midnight; one dusk step takes about 160 ticks (8 s) [V, S50].
- The Sandbox reaches full night ambient at −8°, about 18:30, earlier than real nautical twilight (−12°) [V, S186; I].
- The **twilight gap** (sun 0° to −8°, moon below 4°) has no cast shadows, matching "no sharp shadows" in blue hour [V, S185].

### 6d. Carried light design

| Light | Radius | Duration / cost | Motion | Shadow | Notes |
|---|---|---|---|---|---|
| Torch (Tibia) | 7 → 6 → 5 tiles | 10 + 5 + 5 min | — | — | Fuel = radius steps [V, S35] |
| Torch (DST) | base; skills to 1.5/2/2.5 tiles | 75 s; skills 90–150 s; rain ×1.5 burn | — | — | Players flash it to save fuel [V, S63, S66] |
| Light spells (Tibia) | "3"/"4"/4 tiles | 6 min 10 s / 11 min 35 s / 33 min; 20/60/140 mana | — | — | Mana sink [V, S39, S41] |
| Flashlight (Darkwood) | tight cone | 120 s battery; no weapon | aims | — | Focus and fear [V, S80] |
| Torch (Sandbox) | 46 px, breathing | none | hand ±4 px by facing | yes, re-cast every frame | §8 |
| Lantern (Sandbox) | 40 px | none | ±1 px stride sway | yes | steady = safe |
| Light spell (Sandbox) | 50 px, height 16 | none | eases after player, 14 px up, bob | yes | high light passes low walls |

Design rules [I]:
1. **Circle for safety, cone for tension.**
2. **Show fuel as radius steps** (Tibia): readable, unlike a smooth shrink.
3. **Carried light height decides shadows.** A torch at 10 px is blocked by barrels (9 ≥ 6); a spell at 16 px floats over them (threshold 9.6) [V, S6].
4. **Light = visibility only where it matters.** Thief and Diablo make light a trade-off; for an MMO, limit that to special zones and show it clearly [V, S82, S49].
5. **Never pitch black for walkable ground**; Tibia's world light floor is 40/255 and Crystal's night ≥ 0.41 of day luma [V, S31, S205].

### 6e. Performance budget: a worked example for Godot web

**What the Sandbox measures** [I, Sandbox run]:
- 320×180 = 57,600 px. At 21:00: **28 visible lights, 14 shadowed, ~5 ray re-casts per frame**.
- Stamp areas πR²: torch 6,648 px; lamp 9,161; campfire 10,568; candle 1,257; bulb 254; firefly 154. Total ≈ 105k stamp texels at night (≈ 1.8× screen, before edge clipping).
- Ray casts: 256 × R steps, ≈ 60 µs each in Node.
- Frame time: **~1.2–2.3 ms in headless Chromium**; Node replay averages 1.7–2.4 ms (shadows off: 1.83 vs 2.38 ms at 21:00).

**What Godot imposes** [V, S86, S88, S95, S96]:
- ≤ 15 Light2D per canvas item; 64 lights per render on small-UBO devices.
- Each shadowed light: 4 occluder passes; PCF taps 1/5/13.
- Forum: the first PointLight2D cost ~30 fps from 115 on an unknown device.

**Proposed budget** for a 480×270 internal view with 16 px tiles (30×17 tiles) [I]:

| Layer | Resolution / count | Cost model | Budget |
|---|---|---|---|
| Server tile light (A4/A5) | 30×17 = 510 texels, 1 per tile | CPU max-blend; upload on hash change | ~0 per frame |
| Light map (C1/H2) | ½ res = 240×135 = 32,400 texels | ~5k texels per R = 80 px torch at ½ res × 30 lights ≈ 150k fills | well under 1 ms GPU |
| Real Light2D | ≤ 8–12 on screen, **1–3 shadowed** | per item × per light × taps; Filter None | the main risk; profile |
| Shadow atlas | 512–1024 instead of 2048 | ~0.18°/texel at 2048 is far finer than needed | saves memory |
| Polar maps (CPU, C3) | 256 rays per moving light | ~60 µs each in JS; cache static lights | 2–8 re-casts/frame |
| Sun shadows (B3) | rebuild when sun moves a step | quantise to 16 directions | amortised |
| Day/night (B2) | one 256×16 LUT, lerp 2 keys | 2 fetches per pixel | ~0 |

**Rule of thumb** [I]: stay under ~2–3 ms of a 16.7 ms frame for all lighting on a weak laptop; measure on a phone before adding the second shadowed light.

---

## 7. Combinations: a layered architecture for Asterion Online (Godot 4, web)

All of this section is design proposal [I], built from the cited parts.

**Layers, bottom to top.**
1. **Server light levels (gameplay).** Per tile, Tibia-style: each light-emitting item or creature has `(radius, colour index)`; the server owns world light (40–250) and time of day. Use it for visibility, spawning and stealth rules, never for pixels [S27, S31].
2. **Client tile light texture.** One texel per tile, max-blended (A4), optionally FOV-clipped per light with symmetric shadowcasting (C4). Cached; re-uploaded on hash change (C7).
3. **Client light map.** Half-resolution additive stamps for all decorative lights (C1/H2), with a **max-blend option** to keep Tibia's never-blow-out look. Per-instance flicker uniforms (H2, D2–D4).
4. **1–3 real shadowed lights.** The player's carried light and one or two key lights: either a CPU polar map (C3, as in the Sandbox) written into the light map, or Godot PointLight2D + LightOccluder2D with Filter None and snapped vertices (C2). Apply the height rule (C6).
5. **Sun shadow pass.** Sheared or rotated shadow sprites for props and characters, footprint extrusion for buildings, direction quantised to 16 steps (B3). An SDF shader only if finite occluder shadows are needed [S86].
6. **Day/night grade.** One 256×16 palette LUT, lerped between keyframes chosen by sun elevation (B2, B4, A7). Emissive pixels and lit windows exempt (G2).
7. **Pixel finish.** Banded + Bayer quantisation of the combined light (G1), then palette ramp lookup.
8. **Buildings.** Area ids at load; roof layer fades when the player's area is an interior; walls are occluders with gaps at doors and windows (F3).
9. **Network sync.** Server sends: world time (or world light byte every 10 s, as TFS does), light toggles (lamp on/off, door open), and carried-light state. Flicker phase is client-side from a hash of the light id, so it never needs syncing.

**Pseudocode.**

Light map accumulation (C1):
```
lightmap.fill(ambient(t))                      # B1/B2
for L in visible_lights:
    I = flicker(L, time)                       # D2/D3
    if I < 0.02: continue
    r = L.radius * (0.94 + 0.06*I) if L.is_fire else L.radius
    stamp(lightmap, L.pos/2, r/2, L.colour*I, blend=ADD)   # or MAX
scene.modulate_by(upscale(lightmap, nearest_or_linear))
```

Polar shadow map with the height rule (C3, C6), as in the Sandbox:
```
for a in 0..255:
    dx, dy = cos(a/256*TAU), sin(a/256*TAU)
    d = start                                  # 3 for carried lights, else 1
    while d < R:
        p = L.pos + (dx, dy)*d
        if occ_height[p] >= 0.6 * L.height: break
        d += 1
    L.dist[a] = d + 1.5
lit(p) = |p - L.pos| <= L.dist[angle_index(p - L.pos)]
```

Shadowcasting FOV as light (C4, after Ford):
```
for quadrant in 4 quadrants:
    scan(Row(depth=1, start=-1, end=+1))
scan(row):
    prev = None
    for tile in row.tiles():                   # cols from round_ties_up(depth*start) to round_ties_down(depth*end)
        if is_wall(tile) or is_symmetric(row, tile): reveal(tile)   # light it: max(0, 1 - d/r)
        if prev is wall and tile is floor: row.start = slope(tile)
        if prev is floor and tile is wall: scan(row.next() with end = slope(tile))
        prev = tile
    if prev is floor and row.depth < r: scan(row.next())
slope(tile) = (2*col - 1) / (2*depth)          # exact fractions
```

Sun projection (B3):
```
el  = 62*sin((h-6)/12*PI)                      # Sandbox curve
az  = radians(90 + (h-6)/12*180)
dir = (-sin(az), cos(az))
k   = 0.62 * min(4, 1/tan(radians(max(4, el))))
for each elevated pixel (x, y) with base line ob:
    hgt = ob - y                               # roofs: 22, canopies: 15
    mark_shadow(x + dir.x*hgt*k, ob + dir.y*hgt*k)
alpha *= smoothstep(2, 12, el)                 # fade near the horizon (note 03)
```

Flicker string player (D2):
```
STYLES = { candle: "mmmaaaabcdefgmmmmaaaammmaamm", fluor: "mmamammmmammamamaaamammma", ... }  # write your own
value(style, t, phase) = (STYLES[style][int((t + phase)*10) % len] - 'a') / 12.0   # 'm' = 1.0
```

Day/night ramp (B1, Tibia numbers):
```
world_light(m):            # m = minutes of game day; 1 real hour = 1 game day
    if m < 360 or m >= 1200: return 40
    if m < 480:  return 40 + 210*(m-360)/120
    if m < 1080: return 250
    return 250 - 210*(m-1080)/120
```

Tibia max-blend tile light (A4):
```
for tile in view:
    c = global_colour * world_light/255
    for L in lights:
        I = clamp((L.intensity - dist_tiles(tile, L)) * 0.2, 0, 1)
        if I < 0.01: continue
        c = max(c, from8bit(L.colour) * I)     # per channel
    tex[tile] = c
upload_if_hash_changed(tex)                    # draw with MULTIPLY, bilinear
```

---

## 8. Reference implementation: the Light Sandbox

`vfx-light-sandbox.html` [S6] is one page of plain JavaScript using Canvas 2D (no WebGL). It shows a **320×180** scene with two houses (one enterable), a cobbled square, a pond, seven trees, an obelisk sundial, a fence with string lights, four street lamps, a campfire, a brazier, a magic crystal, glow mushrooms and fireflies. Its design choices are ours [I]. This section comes from reading its script and replaying it headless in Node.js.

**Controls.** Walk (WASD/tap); time presets (Dawn 6.2, Noon 12, Golden hour 17.6, Dusk 19.4, Night 23), auto clock, Overcast; carry nothing, torch, lantern or light spell; place up to 16 lights of 7 types; Smooth / Banded + dither / DOOM colormap styles; shadow and reflection toggles; x-ray views (albedo, light map, sun mask, occluders, rays).

**Pipeline per frame.**
1. Copy the static world (roof-on or roof-off version) into index, base-line, class and indoor buffers.
2. Rebuild sun shadows only when `round(hour·40)`, roof, overcast or option changes.
3. Stamp character occluders (5×2 px, height 12) and character sun strips.
4. For each light: flicker; re-cast 256 rays if dirty, carried or a character is within `R + 6`; stamp `f = (1 − (d/R)²)²` times colour × I × 1.25 into float RGB maps, skipping pixels beyond the angle's hit distance.
5. Add water glints.
6. Compose: `albedo × (ambient + sun·face_factor·unshadowed + point light × receive)`. Wall faces get `0.25 + 0.75·max(0, −dir.y)`; roofs receive 20% of point light, canopies 45%; indoor pixels get 28% of ambient plus sun patches. Emissive palette entries and lit windows bypass lighting.
7. Optional banding or colormap.

**Constants** appear in §7 (sky, shadows), B1 (ambient keys), §6a (lights), F2/§6c (schedule) and C6 (occluder heights).

**Measured cost** (illustrative): **~1.2–2.3 ms per frame** in headless Chromium with up to 28 lights (14 shadowed) and 2–8 ray re-casts per frame. Node replay: 1.7–2.4 ms average; one ray cast ≈ 60 µs [I, Sandbox run].

**Simplifications (honest list).**
- No tile grid; occlusion is a per-pixel height grid, not tiles or polygons.
- CPU-only Canvas 2D; nothing here is a Godot measurement.
- Sun shadows are binary (no penumbra); moon shadows reuse the same mask with a blue sun colour.
- Additive light with no max or normalise, so overlaps can exceed 1.0 (banding clamps visually).
- Indoor lights are never culled when the roof is on (a disabled `&&false` check), so they always light the exterior through gaps.
- The magic crystal, campfire and brazier burn 24 hours.

**Caption-vs-code review (resolved before publication)** [I]. Writing this study turned up seven places where the Sandbox's cards disagreed with its code. Each was fixed in the code, the caption, or both:
1. **Houses at night:** the card now states the real schedule. House A's lamps go out around 23:24 while its banked fireplace glows all night; house B goes dark just after midnight.
2. **Candle:** the code is now almost steady (slow drift plus occasional draught dips). The card explains that 10–12 Hz flicker needs 3 or more flames [S192].
3. **Sun shadow length:** the card now mentions the 0.62 scale for the 3/4 view and the capped cotangent. Roofs (22) and crowns (15) are first moved back to the ground spot they stand over.
4. **Characters' sun shadows:** the card now says they stamp a simple 5-px-wide strip.
5. **Occluder rule:** the card now says "at least 60 %".
6. **Banding:** the card now says steps of 1/6, with more steps where light is over-bright.
7. **"Dusk" button:** moved from 19.4 h (−22°) to 18.3 h (civil twilight).

---

## 9. Gem findings

Licences were read from LICENSE files on 2026-11-09; star counts were unavailable [V, note 07]. **Flags:** **Low** = MIT/BSD/Apache/CC0; **LGPL** = fine as a separate library; **Copyleft** = GPL/AGPL/CC BY-SA, study and re-implement; **None** = no licence, study only.

| Name | URL | Licence | Maturity | Good for | Flag |
|---|---|---|---|---|---|
| OTClient Redemption | https://github.com/mehah/otclient | MIT | commit 2026-11-08, tag 4.2 | Tibia per-tile max-blend light map | Low |
| OTClient (edubart) | https://github.com/edubart/otclient | MIT | tag v0.6.6, 2024 | Additive bubble light FBO | Low |
| Symmetric shadowcasting | https://github.com/370417/symmetric-shadowcasting | CC0 | 117 lines; in libtcod | Tile FOV and light | Low |
| libtcod | https://github.com/libtcod/libtcod | BSD-3 | v2.3.0, 90 tags | 7 FOV families in C | Low |
| rot.js | https://github.com/ondras/rot.js | BSD-style | v2.2.1 | FOV lighting, bounce, 90°/180° cones | Low |
| Red Blob visibility | https://www.redblobgames.com/articles/visibility/ | Apache 2.0 | 2012–2020 | Angle-sweep polygons | Low |
| Godot 2D lights demo | https://github.com/godotengine/godot-demo-projects/tree/master/2d/lights_and_shadows | MIT | Godot 4.7, Compatibility | Reference Light2D + occluders | Low |
| KPas soft shadows | https://godotshaders.com/shader/dynamic-2d-lights-and-soft-shadows/ | MIT | 2023 | 100 lights via 2D SDF | Low |
| CC0 shader set (torch, god rays, clouds, normal-only, shadows) | https://godotshaders.com/shader/procedural-torch-candle-shader-fire-smoke-sparks/ | CC0 | 2024–2025 | Drop-in canvas_item pieces | Low |
| samuelbigos 2D GI | https://github.com/samuelbigos/godot_2d_global_illumination | MIT | v0.1, Godot 3 | JFA GI reference | Low |
| Sohojoe RC | https://github.com/Sohojoe/radiance-cascades-godot | Apache-2.0 | 2024, compute | RC study (not web) | Low |
| PixiJS Lights | https://github.com/pixijs/lights | MIT | v4.1.0 | Web normal-mapped 2D | Low |
| Luanti | https://github.com/luanti-org/luanti | LGPL-2.1+ | active | Flood fill, day/night banks | LGPL |
| illuminated.js | https://github.com/gre/illuminated.js | LGPL | dormant 2014 | Canvas soft shadows | LGPL |
| The Forgotten Server | https://github.com/otland/forgottenserver | GPL-2.0 | main OT server | Day/night numbers | Copyleft |
| DOOM / Quake | https://github.com/id-Software/DOOM | GPL-2.0 | classics | Flicker timings, style strings | Copyleft |
| Shattered Pixel Dungeon | https://github.com/00-Evan/shattered-pixel-dungeon | GPL-3.0 | v4.0.2 | Circular FOV rounding | Copyleft |
| Brogue CE | https://github.com/tmewett/BrogueCE | AGPL-3.0 | v1.15.1 | Dancing colour light | Copyleft |
| Cataclysm: DDA | https://github.com/CleverRaven/Cataclysm-DDA | CC BY-SA 3.0 | very active | Luminance mixing, cones | Copyleft |
| Laigter | https://github.com/azagaya/laigter | GPL-3.0 (tool) | v1.9.1 | Normal maps; outputs are yours | Copyleft (tool) |
| Lit 2D engine | https://store.godotengine.org/asset/fading-lantern-games/lit-2d-lighting-engine/ | MIT | v1.1.7 | Forward+ only, **not web** | Low |
| Sight & Light | https://github.com/ncase/sight-and-light | none | 2015 | Corner-ray polygons | None |
| mattdesl polar shadows | https://github.com/mattdesl/lwjgl-basics/wiki/2D-Pixel-Perfect-Shadows | none | long-cited | GPU 1D shadow map | None |
| jason.today GI/RC | https://jason.today/gi | none stated | 2024 | Clear RC walkthrough | None |

**Top five for Kingsfoil** [I, note 07]: OTClient Redemption's light texture; TFS day/night numbers (re-implemented); rot.js lighting with cones; Quake strings plus Brogue-style jitter (our own data); Ford's CC0 shadowcasting with circular rounding.

---

## 10. Learnings and anti-patterns

**Learnings** [I unless cited]
1. **Separate gameplay light from pixel light.** The server's per-tile levels decide visibility; the client's light map decides looks.
2. **Max beats add for crowds of lights.** Tibia and Minecraft never blow out [V, S27, S50]. Use add, or HDR-add-then-normalise, only where colour mixing matters [V, S132].
3. **Change tables, not data.** Day/night via LUT or palette, never by re-flooding [V, S51, S61].
4. **Few real lights, many fake ones** [V, S86]; let height decide which walls block them (C6).
5. **Personality is a table row** (§6a), and **light is grammar**: glow = interact, lit = safe [V, S208, S207].

**Anti-patterns**
- Pure black shadows; use deep blues and purples [V, secondary, S205].
- 100% saturated lights [V, S203]; Terraria dims pure RGB torches to 37–47% [V, S60].
- Pillow shading and value-only ramps [V, S202, S203].
- Lights that ignore walls; pools that darken what they lie on [V, secondary, S205].
- Long cast shadows in top-down; keep wall shadows ≤ 1 tile [V, secondary, S205].
- Uniform-random flicker, synced flicker across a town, and strobes over 3 flashes per second [I; V, S200].
- A full-screen multiply for night that crushes the palette [I, note 06].
- Gameplay darkness that cannot be turned down (Tibia 7.8) [V, S40].
- Many Light2D nodes on one big TileMapLayer quadrant (silent drops) [I, S88].

---

## 11. "See it in action" index

| # | Game | Light idea | URL |
|---|---|---|---|
| 1 | DOOM | Sector light, colormap, fire flicker | https://doomwiki.org/wiki/Light_diminishing |
| 2 | Hexen | Fog fade table | https://doomwiki.org/wiki/Fog |
| 3 | Duke Nukem 3D | Shade tables, palookups | https://moddingwiki.shikadi.net/wiki/Duke_Nukem_3D_Palette_Format |
| 4 | Quake | 10 Hz light styles | https://fabiensanglard.net/quakeSource/index.php |
| 5 | Half-Life: Alyx | Quake strings reused | https://pcgamer.com/half-life-alyxs-lights-flicker-just-like-they-did-in-quake-almost-25-years-later |
| 6 | Tibia | Per-tile light, torch burn-down | https://tibia.fandom.com/wiki/Lit_Torch |
| 7 | Tibia spells | Light tiers | https://tibiavault.com/spells/ |
| 8 | Ultima Online | Global light levels | https://github.com/ServUO/ServUO/blob/master/Scripts/Misc/LightCycle.cs |
| 9 | Ultima series | Light concept, 8 levels | https://wiki.ultimacodex.com/wiki/Light_(concept) |
| 10 | Diablo I/II | Light radius = vision + aggro | https://di.diablowiki.net/Light_radius |
| 11 | Minecraft | 0–15 flood fill, day LUT | https://minecraft.wiki/w/Light |
| 12 | Terraria | Coloured tile light, modes | https://terraria.wiki.gg/wiki/Lighting_mode |
| 13 | Luanti | Day/night banks | https://github.com/luanti-org/luanti |
| 14 | Don't Starve | Lethal darkness, fuel | https://dontstarve.wiki.gg/wiki/Guides/All_About_Night |
| 15 | RimWorld | Light % as a stat | https://www.rimworldwiki.com/wiki/Light |
| 16 | Factorio | 0.25-res light render | https://wiki.factorio.com/Lamp |
| 17 | Stardew Valley | Low-res light map, torch | https://stardewvalleywiki.com/Torch |
| 18 | NetHack | Lit rooms, candle radius | https://github.com/NetHack/NetHack/blob/NetHack-3.6/src/light.c |
| 19 | Angband | Torch 2, lantern 3, oil | https://github.com/angband/angband/blob/master/lib/gamedata/object.txt |
| 20 | Brogue CE | Dancing coloured light | https://github.com/tmewett/BrogueCE |
| 21 | Cataclysm: DDA | Physical tile light, cones | https://github.com/CleverRaven/Cataclysm-DDA |
| 22 | Shattered Pixel Dungeon | Circular FOV | https://github.com/00-Evan/shattered-pixel-dungeon |
| 23 | Pokémon Crystal | Night palettes, lit windows | https://blakecrosley.com/de/blog/pixel-art-light-weather-time |
| 24 | Pokémon Gen III/IV | Dark caves, Flash, lantern cone | https://bulbapedia.bulbagarden.net/wiki/Flash_(move) |
| 25 | Fire Emblem | Torch vision decay | https://fireemblemwiki.org/wiki/Torch_(item) |
| 26 | Zelda: A Link to the Past | Lamp in dark rooms [U technique] | https://zeldawiki.wiki/wiki/A_Link_to_the_Past |
| 27 | Yoshi's Island / DKC | SNES subtract darkness | https://snes.nesdev.org/wiki/Color_math |
| 28 | Thief | Light gem | https://gamedeveloper.com/design/building-the-original-i-thief-s-i-revolutionary-stealth-system |
| 29 | Darkwood | Flashlight cone | https://darkwood.fandom.com/wiki/Flashlight |
| 30 | Hollow Knight | Lantern gate | https://hollowknight.wiki/w/Lumafly_Lantern |
| 31 | Graveyard Keeper | 10 LUTs, rotated shadows | https://slava.lazybeargames.com/graveyard-keeper-how-the-graphics-effects-are-made |
| 32 | Dead Cells | Painted normals, gradient maps | https://gamedeveloper.com/production/art-design-deep-dive-giving-back-colors-to-cryptic-worlds-in-i-dead-cells-i- |
| 33 | Children of Morta | HD lights on pixel art | https://techraptor.net/content/how-dead-mage-created-the-art-for-children-of-morta |
| 34 | Eastward | Painted bump, time of day | https://www.gamedeveloper.com/art/eastward-s-creators-share-insights-on-making-pixel-art-adventures |
| 35 | Sea of Stars | Rotating shadows, day/night | https://www.megavisions.net/the-art-of-sea-of-stars-a-sea-of-pixels/ |
| 36 | Animal Well | Manual normals, layered light | https://blog.playstation.com/?p=367113 |
| 37 | Nectarmancer | Edge maps | https://80.lv/articles/how-pixel-art-lighting-was-set-up-in-seamless-world-of-nectarmancer |
| 38 | Dank Tomb | 6-level PICO-8 light | https://www.hackernoon.com/pico-8-lighting-part-1-thin-dark-line-8ea15d21fed7 |
| 39 | xDasher | Rim light, window cookies | https://pixel-beef.itch.io/xdasher/devlog/192949/4-things-we-did-to-add-light-and-depth-to-our-pixel-art-game |
| 40 | The Everdream | Glow = interact | https://theeverdream.itch.io/the-everdream/devlog/793280/designing-with-light |
| 41 | Blastronaut | 2D ray-traced indoor light | https://app.media.ccc.de/v/godotfest2025-raytracing-is-simple-for-2d-games |
| 42 | Never's End | 3D-lit sprite world | https://www.ryanjuckett.com/how-we-draw-a-3d-sprite-world-gdc2026/ |
| 43 | Gobs and Gods | Skewed sprite shadows | https://godotshaders.com/shader/2d-shadow-with-bottom-offset-image-ratio-independent-shadow-direction-and-minimal-vertex-increase/ |
| 44 | Living Worlds (Ferrari) | Palette time of day | https://8bitnews.io/article/living-worlds |
| 45 | Moonlighter, Celeste, Seiken Densetsu 3 | Night overlay; lights hit walls; purple shadows [secondary] | https://blakecrosley.com/de/blog/pixel-art-light-weather-time |

---

## 12. What remains unverified (and corrections)

**Conflicts between notes, and how we resolved them**
1. **COLORMAP map 33:** note 01 [U] says all black; the ZDoom wiki says it is a Press Release beta leftover, unused [V, S13]. We follow ZDoom.
2. **Tibia sunrise/sunset:** TFS uses 06:00/08:00 and 18:00/20:00 [V, S31]; an older OT thread gives 430 and 1305 minutes with +7 per tick [V, S33]. Different versions.
3. **Tibia spell levels** differ by era: 1/3/12 [S42] vs 8/13/26 [S41]. TibiaWiki's "3 tile" Light vs Lamp radius 6 "same as utevo lux" is probably perceived vs full radius [I].
4. **Godot SDF oversize:** 120% (note 02, ProjectSettings.xml) vs 100% (note 05, 4.7 docs); note 03's raw rst shows enum indices. Scale 50% is agreed.
5. **`texture_sdf` on Compatibility:** implemented in GLES3 source [V, S88]; note 07 left it unverified, and a commenter reports zoom issues [V, community, S152]. Test it.
6. **Ford's date:** "2021" (note 03, recall) vs ≤ 2020 (Rust port Aug 2020) [V, S135]. We use ≤ 2020.
7. **Minecraft brightness:** an old formula (note 01, [U]) vs "each level 80% as bright" [V, S51]. We use the latter.
8. **Charlie timing:** first attack 5–10 s, then every 5–11 s [S62] vs "after 5 seconds", then 10 s later [S65].

**Still unverified [U]**
- Terraria decay 0.91/0.56 (consistent with ranges, not read in source).
- Stardew's reverse-subtract `lightingBlend`.
- Godot TileMapLayer quadrant size 16 and its per-quadrant light cap.
- DrawableTexture2D on Compatibility/web.
- Kelvin → hex values; "firelight 1,900–2,000 K"; moonlight ~4,100 K.
- ALttP lamp and dark-room technique; Pokémon Flash radii; Sea of Stars and Eastward implementation details.
- Godot 2D light ms on WebGL2: **no benchmark exists in our notes**.
- Gurney's "warm below, cold above" page; Blinn and Gooch DOIs.

---

## 13. Prototype roadmap for Godot (web)

1. **Tile light texture.** Port OTClient's per-tile max-blend into GDScript; `Image` → `ImageTexture`, multiply layer, hash-gated upload. Wire TFS-style world light. Measure on a phone.
2. **Palette finish.** 256×16 LUT shader with Bayer banding and an emissive exemption mask; 5 time keys lerped by sun elevation.
3. **Light map.** Half-res additive stamps via SubViewport, then try `DrawableTexture2D`; one flicker material with instance uniforms; Quake-style string table of our own.
4. **Shadowcasting.** Port Ford's CC0 algorithm; FOV per light on change; tie fog of war to lit ∩ player FOV.
5. **One shadowed hero light.** Compare a CPU polar map (Sandbox port) with PointLight2D + occluder (Filter None, snapped, atlas 1024). Keep the faster on web; add the height rule.
6. **Sun shadows.** Sheared/rotated shadow sprites for props and characters, footprint polygons for buildings, 16 quantised directions.
7. **Buildings.** Area ids, roof fade, walls with gap occluders, staggered window and lamp schedules synced from server time.
8. **Budget pass.** Profile on low-end WebGL2; cap real Light2D at 8–12 and shadowed at 1–3; add a "reduce flicker" option.

---

## 14. Sources

Numbered for [S#] references. All URLs come from notes 01–08 or the Sandbox, except S1 (series reference carried over). "Blocked" = not fetched directly.

**Series**
1. DOOM PSX fire (series reference): https://fabiensanglard.net/doom_fire_psx/
2. VFX #1 Snow: https://kingsfoil-artifacts.netlify.app/vfx-snow-topdown-pixel
3. VFX #2 Acid: https://kingsfoil-artifacts.netlify.app/vfx-acid-topdown-pixel
4. VFX #3 Rain: https://kingsfoil-artifacts.netlify.app/vfx-rain-topdown-pixel
5. VFX #4 Forest: https://kingsfoil-artifacts.netlify.app/vfx-forest-topdown-pixel
6. Light Sandbox: `vfx-light-sandbox.html` (companion page)

**DOOM, Quake, Build**
7. p_lights.c: https://github.com/id-Software/DOOM/blob/master/linuxdoom-1.10/p_lights.c
8. p_spec.h / p_spec.c: https://github.com/id-Software/DOOM/blob/master/linuxdoom-1.10/p_spec.h
9. r_main.c / r_main.h: https://github.com/id-Software/DOOM/blob/master/linuxdoom-1.10/r_main.c
10. r_segs.c: https://github.com/id-Software/DOOM/blob/master/linuxdoom-1.10/r_segs.c
11. r_plane.c, r_draw.c: https://github.com/id-Software/DOOM/blob/master/linuxdoom-1.10/r_plane.c ; https://github.com/id-Software/DOOM/blob/master/linuxdoom-1.10/r_draw.c
12. r_things.c: https://github.com/id-Software/DOOM/blob/master/linuxdoom-1.10/r_things.c
13. ZDoom wiki, COLORMAP: https://www.zdoom.org/wiki/COLORMAP
14. DoomWiki, Light diminishing: https://doomwiki.org/wiki/Light_diminishing
15. DoomWiki, Fog: https://doomwiki.org/wiki/Fog
16. DoomWiki, COLORMAP (blocked) and Sector: https://doomwiki.org/wiki/COLORMAP ; https://doomwiki.org/wiki/Sector
17. Quake world.qc: https://github.com/id-Software/Quake/blob/master/qw-qc/world.qc
18. Quake r_light.c: https://github.com/id-Software/Quake/blob/master/WinQuake/r_light.c
19. Quake cl_main.c: https://github.com/id-Software/Quake/blob/master/WinQuake/cl_main.c
20. Quake model.c: https://github.com/id-Software/Quake/blob/master/WinQuake/model.c
21. Quake r_surf.c, vid.h: https://github.com/id-Software/Quake/blob/master/WinQuake/r_surf.c ; https://github.com/id-Software/Quake/blob/master/WinQuake/vid.h
22. Sanglard, Quake source: https://fabiensanglard.net/quakeSource/index.php
23. Zucconi, Valve flickering lights: https://www.alanzucconi.com/2021/06/15/valve-flickering-lights/
24. PC Gamer, Half-Life: Alyx lights: https://pcgamer.com/half-life-alyxs-lights-flicker-just-like-they-did-in-quake-almost-25-years-later
25. Duke Nukem 3D palette format: https://moddingwiki.shikadi.net/wiki/Duke_Nukem_3D_Palette_Format
26. BUILDINF.TXT: https://mail.fabiensanglard.net/duke3d/BUILDINF.TXT

**Tibia and OpenTibia**
27. OTClient Redemption lightview.cpp: https://github.com/mehah/otclient/blob/main/src/client/lightview.cpp
28. lightview.h: https://github.com/mehah/otclient/blob/main/src/client/lightview.h
29. color.h: https://github.com/mehah/otclient/blob/main/src/framework/util/color.h
30. OTClient (edubart): https://github.com/edubart/otclient
31. TFS world_light.lua: https://github.com/otland/forgottenserver/blob/master/data/scripts/globalevents/world_light.lua
32. TFS repository (world_time.lua): https://github.com/otland/forgottenserver
33. OTLand, world light colors: https://otland.net/threads/world-light-colors.271815/
34. OTLand, world light: https://otland.net/threads/world-light.103661/
35. TibiaWiki, Lit Torch (via api.php): https://tibia.fandom.com/wiki/Lit_Torch
36. TibiaWiki, Lamp: https://tibia.fandom.com/wiki/Lamp
37. TibiaWiki, Campfire: https://tibia.fandom.com/wiki/Campfire
38. TibiaWiki, Lava: https://tibia.fandom.com/wiki/Lava
39. TibiaWiki, Light / Great Light / Ultimate Light: https://tibia.fandom.com/wiki/Light ; https://tibia.fandom.com/wiki/Great_Light ; https://tibia.fandom.com/wiki/Ultimate_Light
40. TibiaWiki, Illumination: https://tibia.fandom.com/wiki/Illumination
41. TibiaVault spells: https://tibiavault.com/spells/
42. Minibia 7.6 spell list: https://minibia.com/blog/complete-spell-list-tibia-76

**Other classic games**
43. Ultima Codex, Light: https://wiki.ultimacodex.com/wiki/Light_(concept)
44. ServUO LightCycle.cs: https://github.com/ServUO/ServUO/blob/master/Scripts/Misc/LightCycle.cs
45. DevilutionX light_tables.cpp: https://github.com/diasurgical/devilutionX/blob/master/Source/engine/light_tables.cpp
46. lighting_defs.hpp: https://github.com/diasurgical/devilutionX/blob/master/Source/engine/lighting_defs.hpp
47. lighting.cpp: https://github.com/diasurgical/devilutionX/blob/master/Source/lighting.cpp
48. player.cpp: https://github.com/diasurgical/devilutionX/blob/master/Source/player.cpp
49. Diablo wiki, Light radius: https://di.diablowiki.net/Light_radius
50. Minecraft Wiki, Light: https://minecraft.wiki/w/Light
51. Minecraft Wiki snapshot (2025-11): https://wiki.ronlab.site/content/minecraftwiki_en_all_maxi_2025-11/Light
52. 0fps, voxel lighting: https://0fps.net/2018/02/21/voxel-lighting/
53. MC_CPP lighting: https://www.mintlify.com/dwnmf/MC_CPP/rendering/lighting
54. Coloured BFS gist: https://gist.github.com/JuanDiegoMontoya/383bf2cc2ad3d1b8717a42b1f0bc6a7b
55. WAVE WebAssembly lighting: https://reddit.rtrace.io/r/VoxelGameDev/comments/112lh1g/smooth_dynamic_lighting_in_webassembly
56. SFML tile lighting tutorial: https://github.com/SFML/SFML/wiki/Tutorial:-Dynamic-colorful-tile-based-lighting
57. Terraria, Light sources: https://terraria.wiki.gg/wiki/Light_sources
58. Terraria, Lighting mode: https://terraria.wiki.gg/wiki/Lighting_mode
59. Terraria, Lighting: https://terraria.wiki.gg/wiki/Lighting
60. Terraria, Light source: https://terraria.wiki.gg/wiki/Light_source
61. Luanti: https://github.com/luanti-org/luanti
62. Don't Starve, Charlie: https://dontstarve.wiki.gg/wiki/Charlie
63. Don't Starve, Torch: https://dontstarve.wiki.gg/wiki/Torch
64. Don't Starve, Light: https://dontstarve.wiki.gg/wiki/Light
65. Don't Starve, All About Night: https://dontstarve.wiki.gg/wiki/Guides/All_About_Night
66. DST Torch: https://dontstarve.wiki.gg/wiki/Torch/DST
67. RimWorld, Light: https://www.rimworldwiki.com/wiki/Light
68. RimWorld, Standing lamp: https://rimworldwiki.com/wiki/Standing_lamp
69. Factorio, Lamp: https://wiki.factorio.com/Lamp
70. Stardew, Torch: https://stardewvalleywiki.com/Torch
71. Stardew draw loop (SMAPI SGame.cs): https://git.nea.moe/github/SMAPI.git/plain/src/SMAPI/Framework/SGame.cs
72. NetHack light.c: https://github.com/NetHack/NetHack/blob/NetHack-3.6/src/light.c
73. Angband object.txt: https://github.com/angband/angband/blob/master/lib/gamedata/object.txt
74. DCSS defines.h: https://github.com/crawl/crawl/blob/master/crawl-ref/source/defines.h
75. Bulbapedia, Darkness: https://bulbapedia.bulbagarden.net/wiki/Darkness
76. Bulbapedia, Flash: https://bulbapedia.bulbagarden.net/wiki/Flash_(move)
77. Fire Emblem Wiki, Torch: https://fireemblemwiki.org/wiki/Torch_(item)
78. Fire Emblem Wiki, Vision: https://fireemblemwiki.org/wiki/Vision
79. ALttP (see-it only): https://tcrf.net/A_Link_to_the_Past ; https://zeldawiki.wiki/wiki/A_Link_to_the_Past
80. Darkwood, Flashlight: https://darkwood.fandom.com/wiki/Flashlight
81. Hollow Knight, Lumafly Lantern: https://hollowknight.wiki/w/Lumafly_Lantern
82. Thief stealth system: https://gamedeveloper.com/design/building-the-original-i-thief-s-i-revolutionary-stealth-system
83. Brogue CE: https://github.com/tmewett/BrogueCE
84. Cataclysm: DDA: https://github.com/CleverRaven/Cataclysm-DDA
85. Shattered Pixel Dungeon: https://github.com/00-Evan/shattered-pixel-dungeon

**Godot and engines**
86. Godot 2D lights and shadows (rst; rendered 4.5): https://raw.githubusercontent.com/godotengine/godot-docs/master/tutorials/2d/2d_lights_and_shadows.rst ; https://docs.godotengine.org/en/4.5/tutorials/2d/2d_lights_and_shadows.html
87. Same, 4.6 manual: https://docs.godotengine.org/en/4.6/tutorials/2d/2d_lights_and_shadows.html
88. GLES3 canvas renderer: https://raw.githubusercontent.com/godotengine/godot/master/drivers/gles3/rasterizer_canvas_gles3.cpp ; https://raw.githubusercontent.com/godotengine/godot/master/drivers/gles3/rasterizer_canvas_gles3.h
89. canvas.glsl: https://raw.githubusercontent.com/godotengine/godot/master/drivers/gles3/shaders/canvas.glsl
90. RD canvas header: https://raw.githubusercontent.com/godotengine/godot/master/servers/rendering/renderer_rd/renderer_canvas_render_rd.h
91. Light2D / PointLight2D / DirectionalLight2D refs: https://raw.githubusercontent.com/godotengine/godot/master/doc/classes/Light2D.xml ; https://raw.githubusercontent.com/godotengine/godot/master/doc/classes/PointLight2D.xml ; https://raw.githubusercontent.com/godotengine/godot/master/doc/classes/DirectionalLight2D.xml
92. ProjectSettings.xml: https://raw.githubusercontent.com/godotengine/godot/master/doc/classes/ProjectSettings.xml
93. class_projectsettings.rst: https://raw.githubusercontent.com/godotengine/godot-docs/master/classes/class_projectsettings.rst
94. Project settings 4.7: https://docs.godotengine.org/en/4.7/classes/class_projectsettings.html
95. Forum, dark-game light limits: https://forum.godotengine.org/t/working-around-godots-2d-light-limitations-for-a-dark-game/81311
96. Forum, PointLight2D performance: https://forum.godotengine.org/t/pointlight2d-performance-and-optimization/137342
97. Godot 4.4: https://godotengine.org/releases/4.4/
98. Godot 4.5: https://godotengine.org/releases/4.5/
99. Godot 4.6: https://godotengine.org/releases/4.6/
100. Godot 4.7: https://godotengine.org/releases/4.7/
101. DrawableTexture2D: https://docs.godotengine.org/en/4.7/classes/class_drawabletexture2d.html
102. Drawable textures tutorial: https://docs.godotengine.org/en/4.7/tutorials/rendering/drawable_textures.html
103. Release dates: https://www.cgchannel.com/?p=170196 ; https://www.cgchannel.com/?p=173665 ; https://www.cgchannel.com/?p=176830 ; https://app.cinevva.com/news/2026-06-19-godot-4-7-released
104. Demo, 2D lights and shadows: https://github.com/godotengine/godot-demo-projects/tree/master/2d/lights_and_shadows
105. Demo, light as mask: https://github.com/godotengine/godot-demo-projects/tree/master/2d/light2d_as_mask
106. Lit 2D engine: https://store.godotengine.org/asset/fading-lantern-games/lit-2d-lighting-engine/
107. Unity URP 2D renderer data: https://docs.unity.com/en-us/engine/6000.3/manual/unity2d/2d-urp/2drenderer-data-overview
108. Unity 2D lighting intro: https://docs.unity.com/en-us/engine/6000.3/manual/unity2d/2d-urp/2d-index/lights-2d-intro

**Shipped games and talks (modern)**
109. Graveyard Keeper effects: https://slava.lazybeargames.com/graveyard-keeper-how-the-graphics-effects-are-made ; https://www.gamedeveloper.com/programming/graveyard-keeper-how-the-graphics-effects-are-made
110. Dead Cells art: https://gamedeveloper.com/production/art-design-deep-dive-giving-back-colors-to-cryptic-worlds-in-i-dead-cells-i-
111. Children of Morta art: https://techraptor.net/content/how-dead-mage-created-the-art-for-children-of-morta
112. Eastward pipeline: https://www.gamedeveloper.com/art/eastward-s-creators-share-insights-on-making-pixel-art-adventures
113. Sea of Stars, PC Gamer: https://www.pcgamer.com/sea-of-stars-is-a-gorgeous-retro-rpg-from-the-makers-of-the-messenger
114. Sea of Stars day/night clip: https://techraptor.Net/gaming/news/sea-of-stars-gameplay-clip-shows-day-night-cycle
115. Sea of Stars art: https://www.megavisions.net/the-art-of-sea-of-stars-a-sea-of-pixels/
116. Sea of Stars, foro3d (low reliability): https://foro3d.com/2026/julio/sea-of-stars-pixel-art-de-16-bits-con-iluminacion-dinamica-en-unity.html
117. Vicente pixel PBR: https://80.lv/articles/exploring-next-gen-pixel-art-with-real-time-dynamic-lighting
118. Laigter: https://azagaya.itch.io/laigter ; https://github.com/azagaya/laigter
119. Animal Well tech blog: https://blog.playstation.com/?p=367113
120. Nectarmancer: https://80.lv/articles/how-pixel-art-lighting-was-set-up-in-seamless-world-of-nectarmancer
121. Isometric 2D lighting research: https://gamedev.net/news/3395-a-real-time-lighting-technique-for-procedurally-generated-2d-isometric-game/
122. Mina the Hollower release: https://www.shacknews.com/article/149025/mina-the-hollower-release-date
123. Never's End, GDC 2026: https://www.ryanjuckett.com/how-we-draw-a-3d-sprite-world-gdc2026/
124. GodotFest 2025, 2D raytracing: https://app.media.ccc.de/v/godotfest2025-raytracing-is-simple-for-2d-games
125. GodotCon Amsterdam 2026: https://talks.godotengine.org/godotcon-ams-2026/talk/NSNXFT/
126. GodotCon Boston 2026, WebGPU: https://talks.godotengine.org/godotcon-boston-2026/talk/CT739D/ ; https://github.com/dwalter/godotwebgpu
127. WebGPU in major browsers: https://web.dev/blog/webgpu-supported-major-browsers

**Visibility and shadow algorithms**
128. Recursive shadowcasting: https://roguebasin.com/index.php/FOV_using_recursive_shadowcasting
129. RogueBasin FOV index: https://roguebasin.com/index.php/FOV
130. FOV comparative study: https://roguebasin.com/index.php/Comparative_study_of_field_of_view_algorithms_for_2D_grid_based_worlds
131. Debenham & Solis-Oba: https://arxiv.org/pdf/2101.11002
132. Milazzo 2014: http://www.adammil.net/blog/v125_Roguelike_Vision_Algorithms.html
133. Ford, symmetric shadowcasting: https://www.albertford.com/shadowcasting/ ; https://github.com/370417/symmetric-shadowcasting
134. Ford talk; devlog: https://youtu.be/y1zkrTcNJbc ; https://lzzrhx.codeberg.page/2024/06/08/roguelike-devlog6.html
135. Ports: https://lib.rs/crates/symmetric-shadowcasting ; https://github.com/nsmryan/zig_shadowcasting
136. Godot FOV algorithms: https://aikoncwd.itch.io/godot-fov-algorithms-for-roguelikes
137. rot.js: https://github.com/ondras/rot.js
138. libtcod: https://github.com/libtcod/libtcod
139. RuggRogue FOV: https://tung.github.io/ruggrogue/source-code-guide/field-of-view.html
140. Red Blob, 2D visibility: https://www.redblobgames.com/articles/visibility/
141. Sight & Light: https://ncase.me/sight-and-light/ ; https://github.com/ncase/sight-and-light
142. mattdesl polar shadows: https://github.com/mattdesl/lwjgl-basics/wiki/2D-Pixel-Perfect-Shadows
143. Unity 1D shadow mapping: https://gamedeveloper.com/programming/fast-2d-shadows-in-unity-using-1d-shadow-mapping
144. Quilez, soft shadows: https://iquilezles.org/articles/rmshadows
145. Ronja, 2D SDF shadows: https://www.ronja-tutorials.com/post/037-2d-shadows/
146. illuminated.js: https://github.com/gre/illuminated.js
147. PixiJS Lights: https://github.com/pixijs/lights
148. Dark overlay with holes: https://html5gamedevs.com/topic/56469-dark-overlay-with-multiple-dynamically-changing-gradient-holes
149. MDN globalCompositeOperation: https://developer.mozilla.org/docs/Web/API/CanvasRenderingContext2D/globalCompositeOperation

**godotshaders.com (licence per page; site rules: https://godotshaders.com/license/)**
150. Top-down oblique shadow: https://godotshaders.com/shader/2d-top-down-oblique-shadow/
151. Top-down shadows (tilemap): https://godotshaders.com/shader/2d-top-down-shadows-tilemap-ready/
152. Dynamic 2D lights and soft shadows (KPas): https://godotshaders.com/shader/dynamic-2d-lights-and-soft-shadows/
153. Drop-in PBR 2D lighting: https://godotshaders.com/shader/drop-in-pbr-2d-lighting-system-with-soft-shadows-and-ambient-occlusion/
154. 2D shadows v2.1: https://godotshaders.com/shader/2d-shadows-shader/
155. Custom 2D light: https://godotshaders.com/shader/custom-2d-light/
156. Pixelated god rays: https://godotshaders.com/shader/pixelated-god-rays/
157. God rays (pend00): https://godotshaders.com/shader/god-rays-shader-inspired-by-pend00-godot-4-5/
158. Procedural torch and candle: https://godotshaders.com/shader/procedural-torch-candle-shader-fire-smoke-sparks/
159. Cloud cast shadow 2D: https://godotshaders.com/shader/cloud-cast-shadow-shader-2d/
160. Normal map only: https://godotshaders.com/shader/normal-map-only-shader/
161. Banded lighting: https://godotshaders.com/shader/banded-lighting-shader/
162. 2D shadow with bottom offset: https://godotshaders.com/shader/2d-shadow-with-bottom-offset-image-ratio-independent-shadow-direction-and-minimal-vertex-increase/
163. godotshaders licence: https://godotshaders.com/license/

**Global illumination**
164. Holographic Radiance Cascades: https://arxiv.org/abs/2505.02041
165. jason.today, GI: https://jason.today/gi
166. jason.today, RC: https://jason.today/rc
167. Peixoto, 2D RC: https://otaviopeixoto1.github.io/portfolio/2DRadianceCascades
168. Sohojoe RC Godot: https://github.com/Sohojoe/radiance-cascades-godot
169. samuelbigos 2D GI: https://github.com/samuelbigos/godot_2d_global_illumination ; https://sambigos.itch.io/2d-global-illumination-in-godot
170. three-rc: https://scour.ing/@hello/p/https://github.com/CodyJasonBennett/three-rc
171. solis_2d: https://lib.rs/crates/solis_2d
172. Chalmers RC thesis: https://odr.chalmers.se/items/3ee9fb4e-1880-46c2-802a-a660e38dc9ee/full

**Papers, physics and perception**
173. Crow 1977: https://researchr.org/publication/Crow77-1/bibtex
174. Williams 1978: https://history.siggraph.org/?p=120268
175. UMBC bibliography (Blinn 1988): https://userpages.cs.umbc.edu/olano/s2000c27/biblio.pdf
176. Gooch 1998: https://users.cs.northwestern.edu/~ago820/SIG98/abstract.html ; https://users.cs.northwestern.edu/~ago820/SIG98/paper/node6.html
177. Sprite Lamp: http://www.snakehillgames.com/spritelamp/ ; https://store.steampowered.com/app/316830/
178. GamingOnLinux, Sprite Lamp: https://www.gamingonlinux.com/2013/12/sprite-lamp-dynamic-lighting-for-2d-art/
179. Moreira et al. 2022: https://arxiv.org/abs/2212.09692
180. DynaPix 2022: https://yaksoy.github.io/papers/SIG22b-DynaPix.pdf
181. Nikolov 2025: https://diglib.eg.org/handle/10.2312/egs20251032 ; https://github.com/IvanNik17/light-sprite
182. Sprite-AI comparison (vendor): https://www.sprite-ai.art/blog/normal-map-generators-compared
183. PixelNormalGen: https://nullabydev.itch.io/pixelnormalgen
184. Color temperature: https://en.wikipedia.org/wiki/Color_temperature
185. Golden hour: https://en.wikipedia.org/wiki/Golden_hour_(photography)
186. Twilight: https://en.wikipedia.org/wiki/Twilight
187. Solar zenith angle: https://en.wikipedia.org/wiki/Solar_zenith_angle
188. Rayleigh scattering: https://en.wikipedia.org/wiki/Rayleigh_scattering
189. Purkinje effect: https://en.wikipedia.org/wiki/Purkinje_effect
190. Night Rendering (2000): https://users.cs.utah.edu/docs/techreports/2000/pdf/UUCS-00-016.pdf
191. Night sky model (2001): https://graphics.ucsd.edu/~henrik/papers/nightsky/
192. Candle flame oscillation (2019): https://pmc.ncbi.nlm.nih.gov/articles/PMC6344522/
193. Flickering candles, collective: https://arxiv.org/pdf/2207.02019
194. Weber–Fechner law: https://en.wikipedia.org/wiki/Weber%E2%80%93Fechner_law
195. Stevens' power law: https://en.wikipedia.org/wiki/Stevens%27s_power_law
196. Kruithof curve: https://en.wikipedia.org/wiki/Kruithof_curve
197. Fotios 2017: https://eprints.whiterose.ac.uk/98531/17/Fotios_2017_a_new_Kruithof_graph.pdf
198. Gurney, complementary shadows: https://gurneyjourney.blogspot.com/2014/09/complementary-shadows.html
199. Minnaert: https://link.springer.com/book/9780387979359
200. WCAG 2.2, three flashes: https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html

**Artists and design**
201. Slynyrd, Pixelblog 6: https://www.slynyrd.com/blog/2018/6/15/pixelblog-6-light-and-shadow
202. Pixel Grimoire #4: https://medium.com/pixel-grimoire/how-to-start-making-pixel-art-4-f57f51dcfa02
203. Pixel Grimoire #6: https://medium.com/pixel-grimoire/how-to-start-making-pixel-art-6-a74f562a4056
204. Pixel Parmesan: https://pixelparmesan.com/color-theory-for-pixel-artists-its-all-relative/
205. Pixel light, weather and time (aggregator): https://blakecrosley.com/de/blog/pixel-art-light-weather-time
206. xDasher devlog: https://pixel-beef.itch.io/xdasher/devlog/192949/4-things-we-did-to-add-light-and-depth-to-our-pixel-art-game
207. Robert Yang, GDC 2018: https://www.blog.radiator.debacle.us/2018/03/gdc-2018-how-to-light-level-slides-and.html
208. The Everdream devlog: https://theeverdream.itch.io/the-everdream/devlog/793280/designing-with-light
209. Eastward, 80.lv (not read): https://80.lv/articles/eastward-charming-chinese-pixel-art-adventure

**Old-school and demoscene**
210. Mark Ferrari Q&A (mirror): https://dcmpx.remotevs.com/com/effectgames/www/PL/effect/article-Q_A_with_Mark_J_Ferrari.html
211. Canvas Cycle: https://github.com/jhuckaby/canvascycle
212. Living Worlds: https://8bitnews.io/article/living-worlds
213. SNES colour math: https://snes.nesdev.org/wiki/Color_math
214. Grog's guide (SNES windows): https://wiki.superfamicom.org/grog's-guide-to-sub-screen-addition-subtraction-and-mask-windows-on-the-snes
215. SNES windows: https://wiki.superfamicom.org/windows
216. GBATEK colour effects: https://problemkaputt.de/gbatek-lcd-i-o-color-special-effects.htm
217. GBATEK windows: https://problemkaputt.de/gbatek-lcd-i-o-window-feature.htm
218. flipcode, 2D bump mapping: https://flipcode.com/archives/The_Art_of_Demomaking-Issue_07_Bump_Mapping.shtml
219. Lysator, 2D bump: https://www.lysator.liu.se/~mikaelk/doc/2bump.html
220. scene.org bump index (not inspected): https://files.scene.org/view/mirrors/hornet/code/effects/bump/00_index.txt
221. ShadeBobs readme: https://se.aminet.net/gfx/misc/ShadeBobs.readme
222. Dank Tomb, PICO-8 lighting: https://www.hackernoon.com/pico-8-lighting-part-1-thin-dark-line-8ea15d21fed7
223. PICO-8 lighting demo cart: https://www.lexaloffle.com/bbs?tid=28785
