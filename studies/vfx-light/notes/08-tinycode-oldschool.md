# 08 — Tiny-code, demoscene and old-school tricks for light, shadow, glow, flicker and day/night

Researcher angle: DOOM / Build / Quake light tables, palette fades and cycling, SNES/GBA hardware colour math, demoscene 2D bump, PICO-8 lighting, small FOV code. Then a ranked list of the cheapest techniques for a top-down pixel game (Godot 4 Compatibility/WebGL2 and canvas demos).

Method note: I read the original id Software sources directly (github.com/id-Software/DOOM linuxdoom-1.10, github.com/id-Software/Quake), plus jhuckaby/canvascycle (cloned), GBATEK, the SNESdev wiki, flipcode and Lysator. doomwiki.org/wiki/COLORMAP and albertford.com could not be fetched because they are not on this session's allowlist. A BreezeWiki mirror returned an Anubis block, so I used the ZDoom wiki and DoomWiki pages that could be reached.

---

## 1. DOOM COLORMAP and light diminishing

### Takeaway
DOOM lights a pixel with one extra byte lookup: `dest = colormap[texel]`. The colormap row is chosen once per wall column or floor span from two inputs: (sector light >> 4) and a distance bucket. Two precomputed tables of row pointers hold the choices: `scalelight[16][48]` for walls and sprites, and `zlight[16][128]` for floors and ceilings. The inner loop costs the same whether lighting is on or off. **This is the model to copy for "palette light levels" on tiles. Index a row by (light level − distance/brightness bonus) and do the lookup per pixel in a shader (a 2D LUT texture of 256×N, or palette-index × level).**

### Cited findings
- **Lump layout:** COLORMAP holds 34 maps, numbered 0–33. Maps 0–31 handle sector brightness: "Divide the brightness by 8, rounding down" to get the map. Map 32 is the invulnerability map. Map 33 is left over from the Press Release beta and is unused (https://www.zdoom.org/wiki/COLORMAP). Each row has 256 entries, and the first 32 rows implement lighting. Colours are re-quantised into the 256-colour palette, so hue and saturation drift as light drops (https://doomwiki.org/wiki/Light_diminishing).
  - Inference: 34 × 256 = 8,704 bytes.
- **Constants** (r_main.h, https://github.com/id-Software/DOOM/blob/master/linuxdoom-1.10/r_main.h):

  | Constant | Value |
  |---|---|
  | LIGHTLEVELS | 16 |
  | LIGHTSEGSHIFT | 4 |
  | MAXLIGHTSCALE | 48 |
  | LIGHTSCALESHIFT | 12 |
  | MAXLIGHTZ | 128 |
  | LIGHTZSHIFT | 20 |
  | NUMCOLORMAPS | 32 |

  r_main.c also has `#define DISTMAP 2`.
- **Table construction** (r_main.c, `R_InitLightTables` and `R_ExecuteSetViewSize`, https://github.com/id-Software/DOOM/blob/master/linuxdoom-1.10/r_main.c):
  ```
  startmap = ((LIGHTLEVELS-1-i)*2)*NUMCOLORMAPS/LIGHTLEVELS   // = (15-i)*4 -> 0..60
  // floors: zlight[i][j], j = distance bucket
  scale = FixedDiv(SCREENWIDTH/2*FRACUNIT, (j+1)<<LIGHTZSHIFT) >> LIGHTSCALESHIFT
  level = clamp(startmap - scale/DISTMAP, 0, 31); zlight[i][j] = colormaps + level*256
  // walls: scalelight[i][j], j = projected wall scale >> 12
  level = clamp(startmap - j*SCREENWIDTH/(viewwidth<<detailshift)/DISTMAP, 0, 31)
  ```
  - Inference (worked through by hand): for floors, `scale/DISTMAP` = 80/(j+1). Nearby floor is up to 80 rows brighter than startmap, then clamped, and the bonus fades toward 0 with distance. j = distance >> 20, so one bucket is 16 map units and 128 buckets cover 2,048 units. A sector at light 128 (i = 8) has startmap 28, close to dark, and only nearby surfaces get lifted. That is why DOOM rooms "fade to black" with distance.
- **Per-surface selection:**
  - Floors use `index = distance >> LIGHTZSHIFT; ds_colormap = planezlight[index]` (r_plane.c, https://github.com/id-Software/DOOM/blob/master/linuxdoom-1.10/r_plane.c).
  - Walls use `lightnum = (frontsector->lightlevel >> LIGHTSEGSHIFT) + extralight`.
  - Fake contrast: a wall whose vertices share y (an east–west wall) gets `lightnum--`, and a wall whose vertices share x gets `lightnum++`. The result is `walllights = scalelight[lightnum]` (r_segs.c, https://github.com/id-Software/DOOM/blob/master/linuxdoom-1.10/r_segs.c).
- **Inner loop:** `*dest = dc_colormap[dc_source[(frac>>FRACBITS)&127]];`. The Spectre "fuzz" effect reuses light row 6 as a darkening table: `colormaps[6*256 + dest[fuzzoffset]]` (r_draw.c, https://github.com/id-Software/DOOM/blob/master/linuxdoom-1.10/r_draw.c).
- **Fullbright:** sprite frames with `FF_FULLBRIGHT` skip light diminishing (r_things.c, https://github.com/id-Software/DOOM/blob/master/linuxdoom-1.10/r_things.c).
- **Sector light animation** (p_lights.c, p_spec.h, https://github.com/id-Software/DOOM/blob/master/linuxdoom-1.10/p_lights.c). These run on the 35 Hz game tic:
  - **Fire flicker:** every 4 tics (about 8.75 Hz), `amount = (P_Random()&3)*16`, so the light drops 0, 16, 32 or 48 below max, clamped to minlight.
  - **Glow:** ±`GLOWSPEED` = 8 light units per tic, ping-ponging between min and max.
  - **Strobe:** `STROBEBRIGHT` = 5 tics bright, then `FASTDARK` = 15 or `SLOWDARK` = 35 tics dark.
  - **Light flash:** random durations of `(P_Random()&maxtime)+1` with maxtime = 64, and `&mintime` with mintime = 7.
- **Hexen fog:** levels flagged in MAPINFO use an alternate fade table, FOGMAP. When the table is not COLORMAP, Hexen "assumes that it is fog", and fullbright sprites fade with distance too. FOGMAP rows desaturate toward a single grey, palette index 23 (#939393). Rows 1–14 are unchanged, rows 15–23 desaturate, and rows 24–32 are all grey. Levels: Darkmere, Orchard of Lamentations, Sacred Grove, plus Sump and Deathfog in the expansion (https://doomwiki.org/wiki/Fog).

### Inferences for us
- Top-down has no depth, so "distance" becomes **distance from a light** or the **night amount**. Use the light row as a per-pixel integer. With a 16-colour material ramp and about 8 light rows, the table is 16 × 8, tiny enough to keep in a 256×8 LUT texture.
- **A fog table is just a different fade target.** Build the same rows but fade toward a grey or blue instead of black. That gives cheap mist, snow-blindness or moonlight.
- Fake contrast transfers directly to top-down: shade wall faces by orientation (south faces +1 row, east faces −1 row) at zero runtime cost.
- **Flicker presets can be lifted as-is:** DOOM fire = 8.75 Hz steps of 16/256 (6.25%). Quake-style strings are covered in section 3.

### Gaps
- I could not open DoomWiki's COLORMAP page because it is blocked here, so the exact algorithm that generated the 32 rows is not cited.
- Heretic's handling is not covered by the Fog page.

---

## 2. Build engine (Duke Nukem 3D) shade tables

### Cited findings
- **PALETTE.DAT layout:**
  - 768-byte 6-bit VGA palette
  - `INT16 numpalookups`
  - `numpalookups × 256` shade tables that "translate a given palette entry to its equivalent at a given level of darkness"
  - a 256×256 (65,536-byte) translucency table for blending any two indices

  LOOKUP.DAT holds 257-byte palette-swap entries and alternate full palettes (https://moddingwiki.shikadi.net/wiki/Duke_Nukem_3D_Palette_Format).
- **Ken Silverman's BUILDINF.TXT** (https://mail.fabiensanglard.net/duke3d/BUILDINF.TXT):
  - Sectors have signed-char `ceilingshade` and `floorshade`, and walls and sprites each have a `shade` offset.
  - `visibility` "determines how fast an area changes shade relative to distance".
  - The `pal` field selects a palette lookup, with 0 meaning standard colours.
  - `makepalookup` accepts palnum 1–15 and a fade-target colour, "normally black (0,0,0). White would be (63,63,63)."
  - The rotatesprite shade runs "up to 31 or 63".
  - `setbrightness` gamma ranges 0–15.

### Inferences
- Build = DOOM COLORMAP + **per-surface shade offsets + per-sector visibility (falloff speed) + coloured fade targets (palookups)**. Coloured fade targets are exactly what we want for coloured darkness: blue night, red emergency lighting, green toxic mist.
- The 64 KB translucency table shows how 8-bit engines did "additive glow" without true colour, using a 2D index-pair LUT.
- Inference (not cited here): Duke3D shipped 32 shade rows, consistent with "up to 31".

---

## 3. Quake colormap.lmp and light styles

### Cited findings
- **Light styles** (QuakeC world.qc, https://github.com/id-Software/Quake/blob/master/qw-qc/world.qc). Each style is a string where 'a' is dark, 'm' normal and 'z' double:

  | # | Name | String |
  |---|---|---|
  | 0 | normal | `"m"` |
  | 1 | FLICKER | `"mmnmmommommnonmmonqnmmo"` |
  | 2 | SLOW STRONG PULSE | `"abcdefghijklmnopqrstuvwxyzyxwvutsrqponmlkjihgfedcba"` |
  | 3 | CANDLE | `"mmmmmaaaaammmmmaaaaaabcdefgabcdefg"` |
  | 4 | FAST STROBE | `"mamamamamama"` |
  | 6 | FLICKER 2 | `"nmonqnmomnmomomno"` |
  | 10 | FLUORESCENT FLICKER | `"mmamammmmammamamaaamammma"` |
  | 11 | SLOW PULSE NOT FADE TO BLACK | — |

  Styles 32–62 are assigned to switchable lights.
- **Playback** (WinQuake r_light.c `R_AnimateLight`, https://github.com/id-Software/Quake/blob/master/WinQuake/r_light.c):
  ```
  i = (int)(cl.time*10)
  k = (map[i % len] - 'a') * 22
  ```
  So styles step at **10 Hz**, and the scale is 'm' = 264 ≈ 256 (1.0×) up to 'z' = 550 (≈2.1×).
- **Colormap use** (WinQuake r_surf.c, https://github.com/id-Software/Quake/blob/master/WinQuake/r_surf.c; vid.h `VID_CBITS 6`, https://github.com/id-Software/Quake/blob/master/WinQuake/vid.h):
  - The surface cache builds `blocklights[18*18]`.
  - Each lightmap sample is multiplied by `lightadj[style]` (an 8.8 value).
  - Dynamic lights add `(rad - dist)*256`.
  - The result is inverted: `t = (255*256 - bl) >> (8 - VID_CBITS)`.
  - Texels are written as `vid.colormap[(light & 0xFF00) + pix]`.

  So there are **64 light rows (1 << 6) × 256**, and the light value is interpolated across 16/8/4/2-pixel blocks per mip (`lightleftstep >> 4 / >> 3 / >> 2`).

### Inferences
- **Light-style strings are the best "flicker personality" format for a pixel game.** They are one byte per 100 ms step, hand-authorable, and store-able per light type (torch, candle, broken lamp, magic pulse). Multiply the light radius or intensity by `(c-'a')/12`.
- Quake's "light at low resolution, interpolated, then palette lookup" is the same as our idea of a **low-res lightmap (one value per tile or per 4×4 pixels) upsampled, then quantised through a palette LUT**.
- Not cited here: the fullbright range of Quake's palette (the top 32 indices are commonly reported as fullbright).

---

## 4. Palette tricks: day/night fades, ramps, cycling

### Cited findings
- **Mark Ferrari** (Q&A, https://dcmpx.remotevs.com/com/effectgames/www/PL/effect/article-Q_A_with_Mark_J_Ferrari.html):
  - Each scene is one image shown through different palettes. Some scenes fade through "whole sets of palettes" to cover 24 hours.
  - Light and shadow appear to move with no redrawn pixels. Overlays such as rain and lit windows are baked in and coloured by the active palette.
  - An X-Men controller project used one picture with nine palettes: three scene types × three times of day. About half the 256 entries stayed in reserve for conditional effects such as stars and rainbows.
  - Cycling ramps of uniform length look "rigid" and pulse, so he varied ramp lengths and speeds.
  - Patterned dither suits smooth gradients, and diffusion dither suits chaotic texture such as surf foam.
- **Canvas Cycle engine** (https://github.com/jhuckaby/canvascycle, palette.js):
  - `fadeColor(src, dst, frame, max)` is a per-entry linear RGB lerp. `Palette.fade(destPalette, frame, max)` lerps the whole palette, and `fadeToColor` fades toward one colour. In other words, **time of day = lerp between keyframe palettes**.
  - **BlendShift:** a cycle shifts by the integer part, then lerps each entry toward its neighbour by the fraction (PRECISION = 100), which gives sub-step smooth cycling.
  - Cycle modes: standard, reverse, ping-pong, and two sine modes.
- **README optimisation:** 640×480 = 307,200 px per frame was too slow in JavaScript. The engine precomputes the list of pixels that reference cycled indices and redraws only those, capped at 60 FPS.
- Living Worlds (Huckaby "and friends", inspired by Ferrari's *Living Worlds*): landscape portraits animated with "daylight moods" through a rotating palette. The project has since been discontinued (https://8bitnews.io/article/living-worlds).

### Inferences
- For Godot: author 4–8 **keyframe palettes** (dawn, noon, golden hour, dusk, night, moonlit). Lerp the two neighbours in a palette-swap shader using a 1×N or 16×K texture. The cost is one texture fetch per pixel plus one lerp of a 16–32-entry palette per frame on the CPU. It is effectively free.
- "Lit windows at night" works with the Ferrari trick: give window pixels their own palette indices that are dark in day palettes and warm yellow in night palettes. You get zero extra sprites.
- Palette-index light ramps (each material owns a contiguous index ramp, and light shifts the index) are the DOOM COLORMAP idea flattened. Tie this to snow study #1, which already did palette lighting with dithered lamp pools.

---

## 5. SNES / GBA hardware tricks

### Cited findings — SNES (https://snes.nesdev.org/wiki/Color_math)
- **Registers:**
  - TM $212C and TS $212D select the main- and sub-screen layers.
  - CGWSEL $2130 holds window regions for colour math and selects fixed colour vs sub-screen.
  - CGADSUB $2131 holds add/subtract, half, and per-layer enables.
  - COLDATA $2132 holds the 5-bit fixed colour per channel.
- **Maths:** add can only lighten and subtract can only darken. Each channel is clamped to 0–31. Changing COLDATA per scanline with HDMA gives vertical gradients.
- **Sprite exemption:** sprites using palettes 0–3 are excluded from colour math, which keeps the hero opaque while the scene darkens.
- **Games:** subtractive darkness in *Yoshi's Island* 1-6 and *DKC* Gorilla Glacier. Additive horizon gradients in *F-Zero* and *FF6*.
- **Spotlights:** windows can clip colour math, and HDMA rewrites the window's left/right edges every scanline. The author used this for "shadow and lighting effects", a darkened text box, and a shrinking circular "Looney Tunes" iris (https://wiki.superfamicom.org/grog's-guide-to-sub-screen-addition-subtraction-and-mask-windows-on-the-snes). Windows combine with OR/AND/XOR/XNOR logic (https://wiki.superfamicom.org/windows).

### Cited findings — GBA (GBATEK)
- **Colour special effects** (https://problemkaputt.de/gbatek-lcd-i-o-color-special-effects.htm):
  - BLDCNT 0x4000050 sets 1st and 2nd target layers and the mode: 1 = alpha, 2 = brighten, 3 = darken.
  - BLDALPHA uses `I = min(31, I1*EVA + I2*EVB)`, with EVA and EVB in sixteenths.
  - BLDY uses EVY 0–16/16: brighten is `I + (31−I)*EVY` and darken is `I − I*EVY`.
- **Windows** (https://problemkaputt.de/gbatek-lcd-i-o-window-feature.htm):
  - WININ/WINOUT include a "Color Special Effect" enable bit per window (bit 5 for window 0, bit 13 for window 1, outside, and the OBJ window).
  - **OBJ Window:** non-transparent pixels of sprites set to "OBJ Window" mode mark a window region, and the sprite itself is not drawn.

### Inferences
- **GBA "sprite-shaped light pool":**
  1. Set BLDCNT to darken all BGs (mode 3, EVY = night amount).
  2. Enable the effect outside windows.
  3. Disable it inside the OBJ window.
  4. Place a circle or cone sprite in OBJ-window mode at each torch.

  You get unlimited arbitrary light shapes with no per-pixel CPU work. **The same idea maps to a Godot `CanvasItem` mask:** draw light sprites into a mask viewport, then darken outside the mask.
- The SNES equivalent is HDMA window edges, computed per scanline from a circle equation (left/right x = cx ∓ sqrt(r² − dy²)). It can show only one or two convex shapes per line, which is why SNES games kept a single lamp circle.
- Day/night on SNES: the master brightness in INIDISP ($2100, low nibble 0–15) fades the whole screen. Inference from general SNES knowledge; I did not reach a page that confirms it here. For a tinted night, use a COLDATA subtract that removes more red and green than blue, which leaves a blue night.

### Gaps
- I could not find a cited description of *Zelda: A Link to the Past*'s dark-room lamp cone (which layer and which colour-math mode). No source was found in 2 searches. *Super Metroid* is likewise not cited.

---

## 6. Demoscene: 2D bump mapping, shadebobs, glow

### Cited findings
- **flipcode, "Art of Demomaking #07: Bump Mapping"** (Alex, 4 Oct 1999, https://flipcode.com/archives/The_Art_of_Demomaking-Issue_07_Bump_Mapping.shtml):
  - Compute `dx = h(i,j) − h(i−1,j)` and `dy = h(i,j) − h(i,j−1)`.
  - Precompute a **256×256 light map** whose intensity falls off linearly from the centre.
  - `intensity = lightmap[128+dx][128+dy]` (with a range check), then `pixel = colour(i,j)*intensity`. In palettised form that multiply is a shade-table lookup.
  - To move the light, add (pixel − light position) to the deltas.
- **Lysator 2D bump** (https://www.lysator.liu.se/~mikaelk/doc/2bump.html):
  - Precompute per-pixel offsets `bump[x][y] = ((h[x−1]−h[x+1])*scale, (h[y−1]−h[y+1])*scale)`, treating brightness as height.
  - At runtime, `C = Phong[x+bx][y+by]`. A shade-table step can be added for textured images.
- **Shadebobs:** credited by one author to Silents/Crionics around 1991 (author's guess) and computed in an RGB buffer (https://se.aminet.net/gfx/misc/ShadeBobs.readme). The mechanics were not described in the fetched source.

### Inferences
- **2D bump is a pixel-art "normal map" substitute that needs no normal-map art.** Derive (dx, dy) from a hand-painted height or greyscale mask per tile, or even from luminance. Lighting is then **2 subtractions + 1 LUT fetch per pixel per light**, and the LUT can be replaced by a radial gradient texture.
  - In Godot this is a fragment shader that samples a height texture twice and a radial light texture once.
  - Quantise the output to the palette to keep it pixel-clean.
  - It gives cobblestones and bricks that catch torchlight directionally.
- **Shadebob additive blobs equal additive light accumulation.** Add each light's falloff stamp into an integer light buffer (saturating, or wrapping for the psychedelic demo look), then map the buffer through a palette ramp. This is the same as acid study #2's "block-sum, then palette select".

### Gaps
- No pouet or scene.org 256b/4k lighting source was fetched. scene.org hosts "2dclbump.zip" (coloured 2D bump by PSX/Future-Shock, https://files.scene.org/view/mirrors/hornet/code/effects/bump/00_index.txt), but it was not inspected.
- Light-tunnel and phong-LUT intros are not researched.

---

## 7. Tiny shadowcasting / darkness overlay

### Cited findings
- **RuggRogue's FOV** (https://tung.github.io/ruggrogue/source-code-guide/field-of-view.html):
  - Iterative shadowcasting over 8 octants, where one octant is transformed through coefficient tables.
  - Slopes are integer pairs in half-tile units, so there is no floating point.
  - It allocates only two "sight" lists and recomputes only when a dirty flag is set.
  - Floors use symmetric centre-to-centre visibility, and walls use asymmetric centre-to-mid-line visibility (diamond walls) so walls stay visible around corners.
  - Range shape `CirclePlus` = radius + half a tile.
- **Canvas / Pixi darkness overlay with holes:** CSS radial-gradient masks were "very laggy in firefox". Pixi masks are costly, so one Graphics `cut()` per hole is the fallback (https://html5gamedevs.com/topic/56469-dark-overlay-with-multiple-dynamically-changing-gradient-holes). Canvas compositing operators are documented at https://developer.mozilla.org/docs/Web/API/CanvasRenderingContext2D/globalCompositeOperation.

### Inferences (recipe for canvas demos)
1. **Draw the light buffer.**
   - Use an offscreen canvas at 1/4 resolution.
   - Fill it with the ambient night colour.
   - Set `globalCompositeOperation='lighter'` and draw a pre-rendered radial-gradient sprite per light, scaled by the flicker value.
2. **Composite it.** Draw the light buffer over the scene with `'multiply'`, with smoothing off and upscaled. Overlapping lights add correctly. The `destination-out` hole approach makes overlaps "punch" at most to full transparency and gives no colour mixing.
3. **Combine with FOV.** Run shadowcasting per light, on tiles only, within radius R. That costs about πR² tile visits per light, about 200 for R = 8. Store the result as per-tile light, Minecraft-style, then smooth or dither per pixel.

---

## 8. PICO-8 / TIC-80 lighting

### Cited findings
- **Dank Tomb** by Jakub Wasilewski (krajzeg), "PICO-8 lighting part 1", 29 Jan 2017 (https://www.hackernoon.com/pico-8-lighting-part-1-thin-dark-line-8ea15d21fed7):
  - **6 light levels**, including full brightness and black. Six is called "kind of a sweet spot".
  - The palettes are stored in sprite memory.
  - The scene is drawn fully lit, then a post-pass darkens concentric discs, built from horizontal spans.
  - Screen RAM starts at 0x6000, with 64 bytes per line and 2 pixels per byte.
  - A **256-entry LUT per level maps a whole byte, so 2 pixels are done per lookup**: `poke(a, peek(bor(lut, peek(a))))`.
  - Naive `pset`/`pget` drops frames above 32×32 regions. The engine reached 60 FPS.
- **Tech demo cart #38007:** adjustable radius and toggleable shadows. A user reported over 50% CPU left at 30 fps, and 90%+ CPU on an old Moto G (https://www.lexaloffle.com/bbs?tid=28785).

### Inferences
- These are the same building blocks again: a small palette-darkening LUT plus a radial band index. The 2-pixels-per-lookup packing trick is the 8-bit equivalent of processing a 256×6 LUT texture in a shader.
- Banded (non-dithered) discs give the classic PICO-8 look. Adding a Bayer threshold between bands softens the edges (snow study #1).

### Gaps
- I did not inspect `fillp` dither-light carts, TIC-80 carts or Dwitter dweets. The Dwitter search returned nothing relevant.

---

## 9. Ranking: cheapest techniques (cost per pixel / light, memory, look)

Costs are my estimates (inference) from the algorithms above. "px" means per screen pixel at game resolution, for example 320×180 ≈ 57.6k px.

| # | Technique | Runtime cost | Memory | Look / best use |
|---|---|---|---|---|
| 1 | **Whole-palette keyframe lerp (Ferrari / Canvas Cycle)** for day/night | 16–256 colour lerps per frame on the CPU; 0 extra per px (a palette texture fetch you already do) | N palettes × 16–256 × 3 B | Painterly time of day, lit windows via reserved indices |
| 2 | **Colour cycling / BlendShift** for flicker, water and lava glow | Per cycled range per frame; redraw only affected px | Ranges only | Lava, forge glow, magic runes, water caustics |
| 3 | **Light-style strings (Quake)** driving radius/intensity | 1 char lookup per light at 10 Hz | ~10–40 B per style | Distinct personalities: candle, torch, fluorescent, pulse |
| 4 | **DOOM sector-style flicker functions** | A few ops per light per 35 Hz tic | Bytes | Fire flicker 8.75 Hz in 6.25% steps; glow; strobe 5/15/35 tics |
| 5 | **Fake contrast by face orientation** | 0 (baked or per tile) | 0 | Readable building volumes; walls ±1 light row |
| 6 | **COLORMAP / palette-ramp LUT lighting** (light row × index) | 1 LUT fetch per px | 256 × 8–32 B (or 16 × 8) | Crisp, on-palette darkness; coloured fade targets for fog or moonlight (Build / Hexen) |
| 7 | **Banded radial light (PICO-8 Dank Tomb)**, optionally Bayer-dithered | Per lit px: 1 distance compare (or 1 radial texture fetch) + 1 LUT; 2 px per op on PICO-8 | 6 levels × 256 B | Retro concentric rings; dithered = soft but pixel-true |
| 8 | **Low-res light buffer + additive stamps (shadebob / Quake blocklights)**, multiplied in | Stamp: R² ops per light at 1/4 res; composite 1 multiply per px | 1/16 to 1/64 of screen | Coloured overlapping lights; the "light2d texture" approach |
| 9 | **GBA / SNES-style mask darkening** (sprite-shaped light holes, darken outside) | 1 mask fetch + 1 multiply per px; any number of shapes | 1 mask buffer | Hard-edged lantern cones, keyholes, flashlight cones |
| 10 | **Tile flood-fill or FOV light levels** (shadowcasting per light) | ~πR² tile visits per light on change (~200 for R = 8); per px 1 fetch | 1 B per tile | Walls block light; ties light to fog-of-war; MMO-friendly (server can compute) |
| 11 | **2D bump mapping from height/luminance** | 2–3 texture fetches + 2 subtractions per px per light | 1 height channel per tile | Directional torch catch on bricks and cobbles without normal-map art |
| 12 | **Index-pair translucency table (Build 64 KB)** for additive glow in 8-bit | 1 2D LUT fetch per glow px | 64 KB | Palette-correct glow halos and blends |
| 13 | **SNES HDMA window / scanline gradient** for vertical sky or sun gradient | 1 value per scanline | Rows × 2 B | Dusk sky gradients and horizon haze on top-down maps |

**Recommended stack for Asterion (inference):**
- **Day/night:** (1) palette keyframes plus (6) LUT light rows.
- **Light buffer:** (8) a low-res buffer fed by (10) per-tile shadowcast light.
- **Light personality:** (3)/(4) style strings.
- **Final quantisation:** (7) dithered quantisation into the LUT rows to keep it pixel-pure.
- **Optional surface detail:** (11) 2D bump for hero tiles.

Everything here runs in a single fragment shader plus a small per-tile CPU pass, which is compatible with the WebGL2 Compatibility renderer.

---

## Sources
- https://github.com/id-Software/DOOM/blob/master/linuxdoom-1.10/r_main.c (and r_main.h, r_segs.c, r_plane.c, r_draw.c, r_things.c, p_lights.c, p_spec.h)
- https://www.zdoom.org/wiki/COLORMAP
- https://doomwiki.org/wiki/Light_diminishing
- https://doomwiki.org/wiki/Fog
- https://moddingwiki.shikadi.net/wiki/Duke_Nukem_3D_Palette_Format
- https://mail.fabiensanglard.net/duke3d/BUILDINF.TXT
- https://github.com/id-Software/Quake/blob/master/qw-qc/world.qc ; .../WinQuake/r_light.c ; .../WinQuake/r_surf.c ; .../WinQuake/vid.h
- https://github.com/jhuckaby/canvascycle (README, palette.js)
- https://dcmpx.remotevs.com/com/effectgames/www/PL/effect/article-Q_A_with_Mark_J_Ferrari.html (mirror of effectgames Q&A)
- https://8bitnews.io/article/living-worlds
- https://snes.nesdev.org/wiki/Color_math
- https://wiki.superfamicom.org/grog's-guide-to-sub-screen-addition-subtraction-and-mask-windows-on-the-snes
- https://wiki.superfamicom.org/windows
- https://problemkaputt.de/gbatek-lcd-i-o-color-special-effects.htm
- https://problemkaputt.de/gbatek-lcd-i-o-window-feature.htm
- https://flipcode.com/archives/The_Art_of_Demomaking-Issue_07_Bump_Mapping.shtml
- https://www.lysator.liu.se/~mikaelk/doc/2bump.html
- https://files.scene.org/view/mirrors/hornet/code/effects/bump/00_index.txt
- https://se.aminet.net/gfx/misc/ShadeBobs.readme
- https://tung.github.io/ruggrogue/source-code-guide/field-of-view.html
- https://html5gamedevs.com/topic/56469-dark-overlay-with-multiple-dynamically-changing-gradient-holes
- https://developer.mozilla.org/docs/Web/API/CanvasRenderingContext2D/globalCompositeOperation
- https://www.hackernoon.com/pico-8-lighting-part-1-thin-dark-line-8ea15d21fed7
- https://www.lexaloffle.com/bbs?tid=28785

**Blocked or unavailable:** doomwiki.org/wiki/COLORMAP and albertford.com/shadowcasting (not on the session allowlist); a BreezeWiki mirror (Anubis block). GitHub API access to jhuckaby/canvascycle was denied, so I used a public git clone instead.
