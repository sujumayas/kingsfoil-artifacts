# 08 — Tiny-code, demoscene and DOOM-fire-style old-school tricks for RAIN

Researcher angle: smallest possible algorithms (palette tricks, integer CAs, scroll registers, tiny carts/intros) for rain streaks, ripples, splashes, puddles, lightning and wetness, aimed at a top-down pixel-art Godot 4 web game (Compatibility renderer).

Legend: **[C]** = cited finding (URL given); **[I]** = my inference / estimate, not from a source.

---

## Q1. Palette cycling rain (Mark Ferrari / Canvas Cycle), overcast darkening, wet LUT, lightning via palette

### Takeaway
Ferrari's rain is **not particles**: each drop is a contrasting dot or dash travelling along a long painted "path" of palette indices. The path pixels around the dot use colours that match the background, so the path looks transparent. All weather variants (rain or clear, time of day) are **palette swaps or palette fades of one flat 256-colour image**. Rain paths and their palette slots are cleared and reused when a scene is not rainy. The runtime engine is about 230 lines of JS. Each cycle is just `{rate, reverse, low, high}`, and only the pixels that use cycling indices are redrawn.

### Cited findings
- Canvas Cycle has these rain scenes [C, scene list from the live demo's `scenes.js`, http://www.effectgames.com/demos/canvascycle/scenes.js]:
  - V08RAIN "Jungle Waterfall - Rain"
  - V04 "Highland Ruins - Rain"
  - V05RAIN "Haunted Castle Ruins - Rain"
  - V16RAIN "Mirror Pond - Rain"
  - V30RAIN "Deep Forest - Rain"
  - Related weather scenes: V14 "Mountain Storm - Day", V11AM "Approaching Storm - Day", V13 "Pond Ripples - Dawn", V26SNOW, V28/V29FOG.
  - The demo has 35 scenes at 640x480, each about 100 KB of gzipped JSON on the wire (README, https://github.com/jhuckaby/canvascycle).
- "Living Worlds", the sister demo, pairs each month with Clear/Cloudy/Rain variants. Each variant is driven by a palette "script" that keyframes palettes over 24 h [C, http://www.effectgames.com/demos/worlds/scenes.js]:
  - `scpt: 'aprrainscpt'` with V30RAIN, `MAYRAINSCPT` with V08RAIN.
  - The same base image V08 appears in both "Clear" (`MAYCLRSCPT`) and "Cloudy" (`MAYCLDYSCPT`). So **overcast = a different palette script over the same pixels.**
- Ferrari Q&A [C, mirror: https://dcmpx.remotevs.com/com/effectgames/www/PL/effect/article-Q_A_with_Mark_J_Ferrari.html; the original effectgames URL now returns 404, and archive.org was blocked from this session]:
  - A raindrop is "a dot or dash of noticeably contrasting color on a long 'path'".
  - Path colours are painted to match the background, so the trail appears transparent.
  - For snow, and often for rain, he used the "no dither" setting. This gives solid, straight-edged bands of colour along the path.
  - Rain paths and their palette space are cleared when the scene is not rainy, and that space is reused for other effects. Rows of palette are reserved for effects that appear only at some times or in some weather.
  - One picture used "nine different palletes" for scenes and times of day. Scenes fade "through whole sets of palettes", and some go seamlessly through a 24 h cycle. Weather changes (rain or clear) also come from palette swaps.
  - Stencils let him "lay many iterations of a single cycling texture" over itself. This gives the illusion of many drops from one short cycle.
  - Mirror Pond reflections use edge lines filled with moving gradient bands, the same trick he used for foliage.
  - Tool: Deluxe Paint / DPaint II (.LBM/ILBM with CRNG cycle chunks).
- Engine details [C, https://github.com/jhuckaby/canvascycle `palette.js`]:
  - `Cycle{rate, reverse, low, high}`; `CYCLE_SPEED = 280`; `cycleRate = rate / floor(280/speedAdjust)`.
  - `cycleAmount = (timeNow / (1000/cycleRate)) mod cycleSize`.
  - Modes: `reverse` 0/1 = forward, 2 = reverse, 3 = ping-pong, 4/5 = sine.
  - **BlendShift** (Huckaby's addition) fades neighbouring colours by the fractional part of `cycleAmount` (PRECISION 100). This gives smooth in-between frames.
  - Palette helpers that matter for weather:
    - `fade(destPalette, frame, max)`: whole-palette lerp to another palette. This is how overcast, dusk or a wet variant are done.
    - `fadeToColor(color, frame, max)`: a lightning flash (lerp to white) or a fog tint.
    - `burnOut`: subtract toward black.
  - Optimisation (README): at load time, pixels that reference cycling indices are collected into a list. Only those are redrawn each frame. FPS is capped at 60.
- Lightning by palette flip in a PICO-8 rain cart [C, https://www.lexaloffle.com/bbs/?pid=70456]:
  - dw817 suggests flipping the BLACK palette entry to white and back, "quickly twice about every 5-7 seconds".
  - packbat then added a lightning palette set (cart `packbat_rain_gif_lightning`). He says the "two quick flashes" detail seems critical. The post carries an epilepsy warning.
- A Link to the Past's opening storm uses a **colour-math lightning flash on a fixed 256-frame schedule** [C, reverse-engineered source https://github.com/snesrev/zelda3/blob/master/src/overworld.c, `OverworldOverlay_HandleRain`]:
  - `CGADSUB = 0x32` at frame_counter 3, 36 and 88.
  - `CGADSUB = 0x72` at frames 5, 44 and 90.
  - Thunder SFX 54 plays at frame 36.
  - In `0x72` bit 6 is set; this is the SNES "half" colour-math flag (https://wiki.superfamicom.org/transparency).

### Inferences
- [I] So ALttP's flash pattern is: flash at frame 3, back at frame 5 (a 2-frame blink); flash at 36 with thunder, back at 44 (8 frames); flash at 88, back at 90 (2 frames). That is a double-blink plus one long flash about every 4.3 s at 60 fps. This matches the "two quick flashes" folk rule above.
- [I] Godot equivalent:
  - Put the palette in a 256x1 (or 256xN-rows) texture. The world shader does `texture(palette, vec2(index, row))`.
  - Overcast, wet, flash and night are just different rows, or a `mix()` between two rows.
  - Cost is one extra uniform per frame and zero extra per-pixel work if a palette shader is already used.
  - If art is RGBA (not indexed), use a 3D LUT or `colour * tint + add` instead. That is still about 1 op per pixel.
- [I] Ferrari-style cycled rain suits **static screens or overlays**, not a scrolling tile world. Painted paths are tied to the image. For a top-down MMO you could:
  - (a) paint an indexed, tileable 64x64 "rain overlay" with cycling streak paths and draw it in screen space; or
  - (b) cycle a few "water shimmer" indices in puddle tiles (cheap ripple look).
- [I] A "wet variant LUT" can follow Ferrari's reserved-palette-rows idea. Every dry material index gets a wet partner index: darker value, slightly more saturated, plus one specular-highlight index. Wetness then just picks the row.

### Gaps
- I could not read Ferrari's Q&A directly or check exact cycle counts or lengths for V30RAIN (the scene JSON is copyrighted art and was not downloaded).
- I did not confirm how lightning is done in V14 "Mountain Storm". It is probably palette script keyframes; I did not verify this.

---

## Q2. Streak particles vs scrolling pre-drawn rain layers

### Takeaway
There are two old-school families:
- **(a) Per-drop short lines.** Store x, y, speed and length; draw `line(x, y, x+dx, y+dy)` along the velocity, which naturally gives wind slant. Wrap coordinates with bitmasks.
- **(b) One pre-drawn tileable rain layer** that is scrolled. ALttP does this with a BG1 overlay moved only every 4 frames. Its cost is constant whatever the rain density.

Depth/parallax is faked by varying drop **length and contrast** per layer.

### Cited findings
- ALttP rain [C, https://github.com/snesrev/zelda3/blob/master/src/overworld.c]:
  - Rain is overlay map `0x9f`, loaded as a BG overlay.
  - Every 4 frames (`if (frame_counter & 3) return;`) a 4-step counter adds X offsets `{1,0,1,0}` and Y offsets `{0,17,0,17}` (in units of `<<8`) to `BG1HOFS/BG1VOFS`.
  - So the whole rain sheet jumps by a big Y step plus 1 px X. The large jump hides the repeating pattern at 15 updates per second.
- PICO-8 "Rainy Day" thread [C, https://www.lexaloffle.com/bbs/?pid=61845]:
  - PicoLate suggests the built-in `line()` from (x, y) to (x+xspd, y+yspd), so each drop "reflects the direction in which it's moving".
  - His version used about 5x as many drops (cart `rain2`), and a commenter reported it lagged.
  - So per-drop line cost matters even at 128x128.
- packbat "Rain Gif" [C, https://www.lexaloffle.com/bbs/?pid=70456]:
  - Drops "vary in length and in contrast with sky", which gives an illusion of depth.
  - It has 16 contrast-checked palettes and loops seamlessly in 8 s (later 16 s) GIFs.
  - It has light/medium/heavy rain sound modes.
- dw817 "Gentle Rain" [C, https://www.lexaloffle.com/bbs/?pid=114301]:
  - His earlier rain drew a single 8x8 sprite at random spots all over the screen.
  - The newer cart copies an NES game's effect: "a series of sprites in a fixed 8x8 pixeled area" that give a splash effect.
  - Drops appear inside a grid; it adds lightning and thunder toggles.
- Bresenham: integer-only line with one add and one compare per pixel [C, https://en.wikipedia.org/wiki/Bresenham%27s_line_algorithm, standard reference].

### Inferences (cost model)
- [I] Line streaks:
  - Each drop costs about 6 ops to update (`y += vy; x += vx; x &= W-1; y &= H-1`), plus L pixel writes for length L of 2–8 px.
  - Heavy rain at 320x180 with about 300 drops x 5 px = 1,500 px writes per frame. That is about 2.6% of the screen, which is trivial.
  - In Godot, use one `MultiMeshInstance2D` of 1xL quads, or a custom `_draw()` with `draw_line`. On WebGL2, the MultiMesh with a vertex-shader position (`pos = fract(seed + t*vel)`) is near-free on the CPU.
- [I] Wrapping with power-of-two buffers (W = 256) makes `& 255` replace modulo, which is ideal for tiny code. A 2–3 layer parallax looks like this:
  - Far layer: length 2, speed 3 px/frame, dim colour.
  - Mid layer: length 4, speed 5, mid colour.
  - Near layer: length 7, speed 8, bright colour.
  - These numbers are my starting suggestion, not sourced.
- [I] A scrolling overlay (ALttP) costs one full-screen textured quad: one texel fetch plus a blend per pixel, at constant cost. A 64x64 or 128x128 tile is enough. Density tiers can be:
  - three textures or three alpha levels; or
  - two layers scrolled at different speeds and offsets (cheap parallax).
- [I] Updating the overlay every 4 frames at 60 fps (15 Hz) gives the "chunky retro" rain cadence. Moving every frame looks smoother but more modern.

### Gaps
- I found no measured ms numbers for either approach on WebGL2. The figures above are op counts only.

---

## Q3. Ripples: Hugo Elias 2-buffer water, refraction render, ring decals

### Takeaway
The classic demoscene/90s ripple is a **two-buffer integer wave CA**:
`new = ((N+S+E+W) >> 1) - new; new -= new >> k`.
Then render by **sampling the texture at an offset equal to the height difference between neighbours**, and add the same difference as shading. A shipped 1999 game (The Watchmaker) used exactly this. For a top-down pixel game, a puddle-sized grid (e.g. 32x32 to 64x64 per puddle, or one low-res grid per screen) is cheap. Rain drops just poke negative or positive values into it.

### Cited findings
- Original source: Hugo Elias, "2D Water", `http://freespace.virgin.net/hugo.elias/graphics/x_water.htm`. Archived copy: `https://web.archive.org/web/20160418004149/http://freespace.virgin.net/hugo.elias/graphics/x_water.htm`. Other projects cite it in code comments (FastLED FxWater, Open-Smartwatch `anim_water_ripple`, Xash3D `gl_warp.c`, TortoiseGit `WaterEffect.cpp`; found via GitHub code search). archive.org was blocked from this session (connection reset), so the formulas below come from code that implements the page.
- **The Watchmaker (Trecision, 1999), ScummVM port** [C, https://github.com/scummvm/scummvm/blob/master/engines/watchmaker/3d/geometry.cpp, `ProcessWater` dated 10/06/99]:
  - `*dest = ((W + E + N + S) >> 1) - *dest; *dest -= (*dest >> 10);`, in 16.16 fixed point, so damping is 1/1024 per step.
  - **Amortised:** `if (i % MaxPass != CurPass) continue;` updates only 1/MaxPass of the cells each frame.
  - Render: `Xoffset = (h[-1] - h[+1]) >> 16; Yoffset = (h[-w] - h[+w]) >> 16; tex[(i+Xoffset)&(dimx-1) + ((j+Yoffset)&(dimy-1))*pitch]`. Texture coordinates wrap with power-of-two masks.
  - Its "receive ripples" variant adds `h >> 16` to R, G and B (clamped to 30 out of 31), i.e. shading only.
  - Elias's render pseudocode is quoted in a comment: `Xoffset = buffer(x-1,y) - buffer(x+1,y)`, `Yoffset = buffer(x,y-1) - buffer(x,y+1)`, `Shading = Xoffset`, `t = texture(x+Xoffset, y+Yoffset)`, `p = t + Shading`.
- TortoiseGit About-box water [C, https://github.com/TortoiseGit/TortoiseGit/blob/master/src/Utils/MiscUI/WaterEffect.cpp and `.h`]:
  - 8-neighbour variant: `newh = (sum of 8 neighbours >> 2) - pNew; pNew = newh - (newh >> density)`. Header default `m_iDensity = 2`; "higher values lead to slower water motion".
  - Optional `SmoothWater` pass.
  - Render: `dx = h[x]-h[x+1]; dy = h[x]-h[x+w]; idx = offset + w*(dy>>3) + (dx>>3)`; colour shifted by `dx`.
  - `Blob(x, y, radius, height)` adds a drop; example calls are `Blob(rx, ry, 2, 200)` for random rain and `Blob(mx, my, 5, 80)` for the mouse.
- Matyka blog [C, https://maciejmatyka.blogspot.com/2018/03/2d-water-algorithm.html]:
  - `map2 = (sum of 4 neighbours)/2 - map2; map2 *= damping` with damping in 0–1. The two buffers ping-pong.
  - Seeding a single pixel looked poor, so he uses a **3x3 block** per drop. He also averages before rendering. He first saw the idea on Elias's site around 1998.
- Khronos forum restatement of the same update [C, https://community.khronos.org/t/water-ripple-calculation/28789].
- al-ro ripple demo [C, https://al-ro.github.io/projects/ripple/]:
  - "Based on a post by Hugo Elias". It offsets each pixel by the heightmap to fake refraction, and adds a white highlight on crests as fake reflection.
- PICO-8 "Pico Ripples" by luchak (2024-03-17) [C, https://www.lexaloffle.com/bbs/?pid=143568]:
  - Raindrops on a pond, in Picotron video mode 3.
  - v1.01 fixed the initial splash height so smaller ripples show more, which "adds some pleasing visual variety". Each drop's strength is randomised.
  - A commenter links it to the After Dark "Hard Rain" screensaver (expanding line-art circles).

### Inferences
- [I] Cost:
  - Update is about 4 loads + 1 add-chain + 1 shift + 1 sub + 1 shift-sub, roughly 8–10 integer ops per cell.
  - Render is 2 subs, 2 shifts, 1 fetch and 1 add, roughly 6–8 ops.
  - A 64x64 puddle grid totals about 4,096 x 18 ≈ 74k ops per frame. A full 320x180 screen grid is about 1M ops per frame, which is fine natively but heavy in GDScript.
  - In Godot use a **ping-pong SubViewport shader**. It works in Compatibility (two viewports, each reading the other's texture), or use C# / GDExtension on a small `Image`.
  - Use Watchmaker's amortisation (MaxPass = 2–4) if needed.
- [I] Pixel-art fit: quantise the offsets (`>>3`) to whole pixels and clamp to ±1–2 px. Then the refraction only "wobbles" reflections and tile edges, and doesn't smear the palette. Map shading to palette ramp steps (−1/0/+1 index) instead of adding RGB.
- [I] **Ring-sprite decals** are cheaper still and match low-res art better:
  - A 3–4 frame expanding ring (1 px circle, radius 1→2→3→4, fading via palette).
  - About 2πr pixel writes each, with no state grid at all.
  - Rain on a pond = spawn N rings per second per visible water tile, with N from the intensity tier.
  - Use the Elias grid only for "hero" water (fountains, player wading).

### Gaps
- I did not read the original Elias page text directly (archive blocked). The exact Elias damping wording ("damping" multiply vs shift) was not checked first-hand, but the implementations agree on `>>1` and `- old`.
- I found no specific 256b demoscene "rain on water" prod with a write-up. Water ripple 256b intros exist, but none was verified in this session.

---

## Q4. Lightning: midpoint displacement bolt, branching, flash timing

### Takeaway
A bolt is **recursive midpoint displacement**: split the segment, push the midpoint by a random amount, halve the amount, and recurse until it is below a detail threshold. Branches are copies started at random points along the bolt, rotated about 30°, and shorter toward the tip. The *flash* is a palette or colour-math event, not the bolt. Use a 2-frame blink, a pause, then a longer flash with thunder.

### Cited findings
- Jim Bumgardner, "Lightning Generator", Flash Bestiary (©2003/2008) [C, https://krazydad.com/bestiary/bestiary_lightning.html]:
  - "simulates lightning bolts using midpoint displacement".
  - `drawLightning(x1,y1,x2,y2,displace)`: the midpoint is offset by `(rand-.5)*displace` on each axis. It recurses with `displace/2` until `displace < curDetail`.
  - A higher detail threshold gives "fewer (and longer) line segments" and is less realistic.
- Tuts+ "How to Generate Shockingly Good 2D Lightning Effects" [C, https://code.tutsplus.com/so-erzeugen-sie-schockierend-gute-2d-blitzeffekte--gamedev-2681t]:
  - Jagged-line alternative: about `length/4` sorted random positions; displacement in ±Sway with **Sway = 80**; Jaggedness = 1/Sway.
  - Each displacement is pulled toward the previous one to limit sharp angles. Points past 0.95 of the length are scaled by `20*(1-pos)` so the bolt lands on its endpoint.
  - Branches: `rand(3,6)` gives 3–5 branches at **30°**, alternating left and right, with length scaled by `(1-branchPoint)`.
  - Fade: alpha 1.0 − **0.03 per update**, about 34 updates (the article says it "lasts over 30 frames"). Glow is drawn at 0.6x alpha.
  - The optimised version darkens the previous frame to 96% each frame.
- ALttP flash schedule and the PICO-8 "two quick flashes" rule: see Q1 [C, zelda3 overworld.c; lexaloffle pid=70456].
- Bolt-plus-flash hybrid: dw817's "Gentle Rain" cart toggles lightning and thunder [C, https://www.lexaloffle.com/bbs/?pid=114301].

### Inferences
- [I] Cost:
  - Recursion depth 5–6 gives 32–64 segments, drawn once per strike with Bresenham. That is a few hundred pixel writes, once per strike.
  - Cache the polyline and redraw it for 3–8 frames, then palette-fade it out.
- [I] Top-down twist: you rarely see the sky. Use:
  - the global palette flash (whole screen);
  - an optional short ground-strike bolt drawn vertically (screen up = sky) with a 1-frame white ground disc; and
  - **shadow casting**: the flash comes from one direction, so offset sprite shadows for 2 frames. This is cheap if shadows already exist; unsourced idea.
- [I] Thunder delay = distance / 343 m/s. In game, roll a 0–3 s delay after the flash, scaled by an "off-screen distance". This is a gameplay readability cue.
- [I] Accessibility: offer a "reduce flashes" option (cap brightness change, ≤3 flashes per second, per common photosensitivity guidance). packbat's cart already carries a photosensitive epilepsy warning [C, https://www.lexaloffle.com/bbs/?pid=70456].

### Gaps
- I did not fetch Wikipedia's midpoint displacement page. The krazydad source suffices for the algorithm.
- I found no source for how commercial top-down games schedule thunder delay.

---

## Q5. Splashes: 3–5 frame sprites, per-surface variants

### Takeaway
Old-school splashes are **tiny fixed sprite animations dropped at random spots or grid cells**, not simulated. The NES-derived approach in "Gentle Rain" keeps every splash inside a fixed 8x8 cell. That is a cheap blit with no overdraw bookkeeping.

### Cited findings
- dw817 "Gentle Rain" (2022-07-14) [C, https://www.lexaloffle.com/bbs/?pid=114301]: modelled on an NES game; "a series of sprites in a fixed 8x8 pixeled area" for the splash, with drops appearing in a grid. It has speed control so the animation doesn't skip frames.
- Fiftybottles/PicoLate thread [C, https://www.lexaloffle.com/bbs/?pid=61845]: the same `line()` velocity trick could draw splashes and avoid ground-level crowding.

### Inferences
- [I] Recipe:
  - 4-frame splash: frame 1 is a 1 px impact dot, frame 2 a 3 px "crown" (two side droplets), frame 3 is the droplets 1 px higher and wider, frame 4 is 1 px remnants.
  - At 60 fps, hold each frame 2–3 ticks, so a splash lasts about 130–200 ms.
- [I] Per-surface variants by tile material:
  - Stone/cobble: crown splash, light colour.
  - Dirt/mud: a dark dot that stays for 0.5 s (darkens the ground). This ties into wetness.
  - Grass: no crown, 1-frame blade flicker.
  - Water/puddle: ring decal (Q3) instead of a crown.
  - Wood/roof: crown plus a short "tick" sound.
  - Metal: bright 1-frame spark-like highlight.
  - Cloth/awning: none, or a darker spot.
- [I] Cost: each splash is about 16–64 px blitted for about 10 frames. At 100 splashes per second on screen that is about 1k px per frame. In Godot, a single MultiMesh or a pool of `AnimatedSprite2D`, or (best on web) splashes baked into the rain-particle shader as the "end of life" phase.

### Gaps
- I did not identify which NES game dw817 copied.

---

## Q6. Wetness/drying as a dither threshold (snow-coverage analogue)

### Takeaway
Reuse the SNOW study's trick: a per-cell **wetness byte** plus a fixed per-pixel (Bayer or blue-noise) threshold. A pixel shows its "wet" palette entry when `wet > threshold[x&3][y&3]`. Raising wetness grows wet patches smoothly with zero alpha blending, and the result stays palette-pure. Drying from edges is a tiny CA (erode toward the minimum of neighbours), plus a per-material dry rate.

### Cited findings
- The snow study in this series used a "per-pixel depth byte + dither threshold" [C, context file; https://kingsfoil-artifacts.netlify.app/vfx-snow-topdown-pixel].
- Ferrari's reserved palette rows for weather-only colours [C, Q&A mirror above] support a "wet row" in the palette.
- The DOOM PSX fire shows the integer-CA style this series is built on [C, https://fabiensanglard.net/doom_fire_psx/]:
  - `rand = round(random()*3)&3; to = from - W - rand + 1; fire[to] = fire[from] - (rand&1)`.
  - Values 0..36 index a palette. The bottom row is the constant source.

### Inferences
- [I] Data:
  - One byte per tile (or per 4x4 px cell). A 64x64-tile area is 4 KB.
  - Update at 4–10 Hz, not every frame: `wet += rainRate*exposure − dryRate[material]*(sun+wind)`, clamped to 0..255.
- [I] Shader:
  - Bilinear-sample a low-res wetness texture, compare with a 4x4 Bayer value, and select `palette_row_wet` for that index.
  - About 3 ops per pixel; fully Compatibility-renderer friendly.
- [I] **Drying from edges**:
  - Each tick, `wet[c] = min(wet[c], max4(neighbours) − k)` for dry-eligible cells.
  - Or use the DOOM-fire flavour: `wet[c] -= (rand&1)` only where any neighbour is drier.
  - Either way patches shrink from their borders and puddle centres dry last.
  - Material rate table (e.g. sand fast, stone medium, mud/cloth slow; shade ×0.3, wind ×1.5) is unsourced and needs tuning.
- [I] **Puddles** are the same field above a second threshold, e.g. wet > 200 in low-lying cells (a static "hollowness" mask). Show the water tile and enable ring decals and Elias ripples there.
- [I] **Wet footprints**: stamp −40 (dry print) on deep mud, or a +wet "dark print" on dry stone after walking out of a puddle. The prints decay with the same dry rule, giving fading footprints for free (same as the snow study's displacement idea).

### Gaps
- I found no shipped-game source using a dithered wetness threshold specifically. This is an inference by analogy with the snow technique.

---

## Q7. Tiny carts, tweetcarts, dweets, size-coded intros with rain

### Cited findings
- **PICO-8 / Picotron (Lexaloffle BBS):**
  - "Rain Gif", packbat, 2019–2023 [C, https://www.lexaloffle.com/bbs/?pid=70456]:
    - 16 palettes; drops vary in length and contrast for depth; seamless 8 s/16 s loop; light/medium/heavy rain sound.
    - Lightning variant: `packbat_rain_gif_lightning`.
  - "Gentle Rain", dw817, 2022 [C, https://www.lexaloffle.com/bbs/?pid=114301]: NES-style 8x8 splash sprites in a grid, lightning and thunder toggle. dw817's older rain cart (random 8x8 sprite drops with rain rumble) is at https://www.lexaloffle.com/bbs/?tid=27743 (linked from the post).
  - "Rainy Day", Fiftybottles, 2019, plus PicoLate's `rain2` with `line()` streaks [C, https://www.lexaloffle.com/bbs/?pid=61845].
  - "Pico Ripples", luchak, 2024, Picotron raindrops-on-pond [C, https://www.lexaloffle.com/bbs/?pid=143568]. luchak also published "tiny drops" (https://luchak.itch.io/tiny-drops; not read).
  - "[WIP] In the rain", 2023 [C, https://www.lexaloffle.com/bbs/?tid=55526]: a commenter praised the "very cool rain effect and ambient sound". The post has no technique write-up.
  - "Rain Arcade", retrowill, 2023 [C, https://www.lexaloffle.com/bbs/?pid=137926]: gameplay of surviving a worsening storm; some drops react to player input.
  - "Precipitative Percussion" [C, https://www.lexaloffle.com/bbs/?pid=17680] and "Rainy Day Friends" P8jam1 [C, https://www.lexaloffle.com/bbs/?tid=2803]: titles found only, not analysed.
- **Size-coded intros (pouet.net search "rain")** [C, https://www.pouet.net/search.php?what=rain&type=prod]:
  - "rain" by org_100h, MS-DOS **64 bytes**, June 2008 [C, https://www.pouet.net/prod.php?which=63272]. The nfo says it is a "rain storm effect", "interesting for a 64 byter", and includes a 256-byte version.
  - "Rain" by Gordian, **C64 64b**, Lovebyte 2025, 11th in the oldskool 64b compo [C, https://www.pouet.net/prod.php?which=103600].
  - "Rain" by Ulysses777, **C16/Plus4 64b**, limiTED 2007 [C, https://www.pouet.net/prod.php?which=30517].
  - "Rain" by Life on Mars, ZX Spectrum 16k, 2nd at Multimatograf 2016 [C, https://www.pouet.net/prod.php?which=67276]. The author confirms it uses no hardware "snow" glitch; "it is _rain_".
  - "Rain" by The Black Lotus, Amiga AGA demo, 3rd at The Party 1999 [C, https://www.pouet.net/prod.php?which=1086].
- **Dwitter:** the hashtag page is https://www.dwitter.net/h/rain. The page is a JS SPA, and the public API `search`/`hashtag` params did not filter (they returned the generic feed), so I could not list specific rain dweets. **Gap.**

### Inferences
- [I] 64-byte rain is almost certainly a handful of falling pixels with wrap. The usual size-coding style is pseudo-random positions from a register LFSR, written into VGA mode 13h memory with a fade. The 64b size proves the effect needs no state arrays. I did not disassemble it.

---

## Q8. Ranking — cheapest techniques (cost estimates are [I] unless noted)

| # | Technique | Per-frame cost (approx.) | Memory | Look / notes |
|---|---|---|---|---|
| 1 | **Palette/LUT row swap: overcast, dusk, wet world** (Ferrari palette sets [C]) | 1 uniform; 0 extra ops/px if already palette-shaded | +1 palette row (256x4 B) per state | Huge mood change; smooth via `fade()` lerp over N s |
| 2 | **Lightning flash via palette/colour math** (ALttP 0x32/0x72 schedule [C]; PICO-8 black→white ×2 [C]) | 1 uniform toggle on 2–8 frames | 0 | Strongest storm cue; needs a flash-reduction option |
| 3 | **Scrolling pre-drawn rain overlay** (ALttP BG1, jumps every 4 frames [C]) | 1 tex fetch + blend/px; 2 scroll writes | one 64–128² tile per tier | Constant cost at any density; risk of visible tiling |
| 4 | **Ferrari cycled streak paths in an overlay tile** [C technique] | 0/px on indexed HW; modern: 1 palette lookup/px | ~8–16 palette slots | Beautiful, but hand-painted; static relative to the screen |
| 5 | **Wetness dither threshold** (snow analogue) | ~3 ops/px in shader + 4–10 Hz grid tick | 1 B/tile | Palette-pure darkening; grows and shrinks organically |
| 6 | **Edge-drying CA** (min-of-neighbours or DOOM-style rand decrement) | ~6 ops/cell at 4–10 Hz | same grid | Puddles shrink from edges, centres last |
| 7 | **Line streak particles** (`line(x,y,x+dx,y+dy)` [C]) with `&` wrap, 2–3 depth layers | ~6 ops + L px per drop; 300 drops ≈ 1.5k px | 4–6 B per drop | Wind slant for free; depth via length/contrast [C packbat] |
| 8 | **Ring decals on water** (expanding 1-px circle, 3–4 frames) | ~2πr px per ring (≤25 px) | per-ring 4 B | Reads instantly as "rain on water" at low res |
| 9 | **Fixed-cell splash sprites** (NES-style 8x8 cell [C]) | ≤64 px blit per splash, ~10 frames life | 1 sprite strip per material | Per-material variants cheap |
| 10 | **Palette-cycled shimmer in puddle tiles** (Ferrari moving gradient bands [C]) | 0–1 lookup/px | 4–8 palette slots | Living water without simulation |
| 11 | **Midpoint-displacement bolt** [C krazydad] + Tuts+ branching (3–5 at 30°, 0.03 alpha fade) [C] | ~32–64 segments once per strike | <1 KB | Only needed for visible ground strikes |
| 12 | **Hugo Elias 2-buffer ripples** [C Watchmaker/TortoiseGit] | ~16–18 int ops/cell (update + refraction render); 64² ≈ 74k ops | 2 × cells × 2–4 B | Best interactive water; amortise with MaxPass [C] |
| 13 | **Elias refraction render on a whole screen** | 320×180 ≈ 1M ops/frame | 2 × 57.6k cells | Only via GPU ping-pong; overkill for rain alone |

Ranks 1–3 are roughly 0 per pixel beyond existing passes, or one fetch. Ranks 5–10 scale with visible tiles or events. Ranks 12–13 are per-cell simulations.

---

## Fog/mist tie-ins (scope requirement)
- [I] Ferrari's own approach is `fadeToColor(fogColour, f, max)` on the whole palette [C function exists in palette.js], combined with a "Fog" palette set (Seascape - Fog / Water City Gates - Fog [C scenes.js]). Heavy rain can lerp the palette about 10–20% toward a grey-blue "spray haze" colour. After rain, a ground-mist pass can be driven by `wetness × sun`: an evaporation term that shows mist where wet tiles are drying in sunlight.

---

## Sources
- Canvas Cycle repo and README: https://github.com/jhuckaby/canvascycle (palette.js, main.js)
- Canvas Cycle live scene list: http://www.effectgames.com/demos/canvascycle/scenes.js
- Living Worlds scene list: http://www.effectgames.com/demos/worlds/scenes.js ; demos: http://www.effectgames.com/demos/canvascycle/ , http://www.effectgames.com/demos/worlds/
- Q&A with Mark J. Ferrari (mirror): https://dcmpx.remotevs.com/com/effectgames/www/PL/effect/article-Q_A_with_Mark_J_Ferrari.html (original effectgames URL returns 404)
- Zelda ALttP reverse-engineered source: https://github.com/snesrev/zelda3/blob/master/src/overworld.c
- SNES colour math: https://wiki.superfamicom.org/transparency
- The Watchmaker water (ScummVM): https://github.com/scummvm/scummvm/blob/master/engines/watchmaker/3d/geometry.cpp
- TortoiseGit WaterEffect: https://github.com/TortoiseGit/TortoiseGit/blob/master/src/Utils/MiscUI/WaterEffect.cpp
- Hugo Elias 2D Water (archived; blocked in this session): https://web.archive.org/web/20160418004149/http://freespace.virgin.net/hugo.elias/graphics/x_water.htm
- Matyka, 2D water algorithm: https://maciejmatyka.blogspot.com/2018/03/2d-water-algorithm.html
- Khronos forum ripple pseudocode: https://community.khronos.org/t/water-ripple-calculation/28789
- al-ro ripple: https://al-ro.github.io/projects/ripple/
- Krazydad Lightning Generator: https://krazydad.com/bestiary/bestiary_lightning.html
- Tuts+ 2D lightning: https://code.tutsplus.com/so-erzeugen-sie-schockierend-gute-2d-blitzeffekte--gamedev-2681t
- Fabien Sanglard, DOOM PSX fire: https://fabiensanglard.net/doom_fire_psx/
- Bresenham: https://en.wikipedia.org/wiki/Bresenham%27s_line_algorithm
- Lexaloffle BBS: https://www.lexaloffle.com/bbs/?pid=70456 , https://www.lexaloffle.com/bbs/?pid=114301 , https://www.lexaloffle.com/bbs/?pid=61845 , https://www.lexaloffle.com/bbs/?pid=143568 , https://www.lexaloffle.com/bbs/?tid=55526 , https://www.lexaloffle.com/bbs/?pid=137926 , https://www.lexaloffle.com/bbs/?tid=27743
- pouet: https://www.pouet.net/prod.php?which=63272 , https://www.pouet.net/prod.php?which=103600 , https://www.pouet.net/prod.php?which=30517 , https://www.pouet.net/prod.php?which=67276 , https://www.pouet.net/prod.php?which=1086
- Dwitter rain hashtag (not parsed): https://www.dwitter.net/h/rain
