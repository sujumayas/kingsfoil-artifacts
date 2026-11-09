# 08 — Tiny-code, demoscene and Doom-fire-style tricks for ACID (goo, bubbles, corrosion)

Researcher angle: the smallest algorithms that still look great. Everything here is CPU-friendly
integer/LUT code that ports 1:1 to a GLSL fragment shader (Godot 4 Compatibility / WebGL2) or to a
tiny CPU `Image` buffer uploaded as an `ImageTexture` each frame.

Legend: [C] = cited finding (URL given). [I] = my inference / design proposal, not from a source.

---

## Q1. Palette cycling for liquids (Mark Ferrari / Canvas Cycle; Doom animated flats; Quake turbulence)

### Takeaway
Three "zero-sim" liquid animators exist and all are proven in shipped games:
(a) palette range rotation (no pixel ever rewritten; only 4–16 palette entries change),
(b) flipbook flats at ~4 fps (Doom), and
(c) Quake's sine-table UV warp (two table lookups per texel). For a top-down acid pool, (a)+(c)
combined gives a living surface for ~3 ops/pixel. Doom also gives us a battle-tested damage-tick
model for "acid floor" (fixed damage every 32 tics, protective suit, rare leak).

### Cited findings
**Canvas Cycle (Joseph Huckaby, art by Mark Ferrari)** — source cloned from https://github.com/jhuckaby/canvascycle
- [C] Each cycle range is `{rate, reverse, low, high}` over palette indices; `cycleSize = high-low+1`;
  `cycleRate = rate / floor(CYCLE_SPEED / speedAdjust)` with `CYCLE_SPEED: 280`;
  `cycleAmount = mod(timeNow / (1000/cycleRate), cycleSize)` (canvascycle/palette.js, lines ~149–170).
- [C] Modes via `reverse`: 0/1 = standard, 2 = reversed, 3 = ping-pong (`size*2`, fold back),
  4/5 = sine-wave sway with amplitude size/4 or size/2 (palette.js).
- [C] "BlendShift": fractional part of cycleAmount × PRECISION(100) is used to cross-fade
  adjacent palette entries, so slow cycles move smoothly instead of stepping (palette.js `blendShiftColors`).
- [C] Optimized render: mark palette indices that belong to an animated cycle, precompute the list
  of pixel offsets that use them (`optPixels`), and only rewrite those pixels each frame (canvascycle/bitmap.js `optimize`).
- [C] README: palette swaps were "fast, and took virtually no memory"; effects need no layers or alpha —
  "one single flat image with one 256 color palette"; Ferrari's scenes animate waterfalls, streams, fog, smoke
  (https://github.com/jhuckaby/canvascycle README; https://monochrom.at/blog/?p=11592).
- [C] Ferrari painted backgrounds for LucasArts' Loom and some of The Secret of Monkey Island (https://monochrom.at/blog/?p=11592).
- See it in action: https://experiments.withgoogle.com/canvas-cycle

**Doom animated flats + damaging floors** — id Software DOOM source, linuxdoom-1.10/p_spec.c
(https://github.com/id-Software/DOOM/blob/master/linuxdoom-1.10/p_spec.c)
- [C] `animdefs[]`: NUKAGE1–3, FWATER1–4, LAVA1–4, SLIME01–04/05–08/09–12, all with speed 8 (tics/frame).
  Frame selection: `pic = basepic + ((leveltime/speed + i) % numpics)`.
- [C] Doom wiki: NUKAGE = 3 frames of green liquid; engine advances "about three times a second";
  animated flats commonly signal damaging floors (https://doomwiki.org/wiki/Animated_flat).
- [C] Damage (`P_PlayerInSpecialSector`): special 7 = 5 dmg, special 5 = 10 dmg, special 16/4 = 20 dmg,
  applied only when `!(leveltime & 0x1f)` (every 32 tics); radiation suit (`pw_ironfeet`) blocks it,
  except 20-dmg floors leak when `P_Random() < 5`.
- [I] Doom ticks at 35 Hz, so 8 tics/frame ≈ 4.4 fps flipbook and 32 tics ≈ 0.91 s damage period;
  `P_Random()<5` of 0–255 ≈ 2% leak per tick. Directly reusable as "acid floor: 5/10/20 per ~1 s, boots of
  acid-walking block it, strong acid leaks 2%".

**Quake turbulent liquid surfaces** — https://github.com/id-Software/Quake (WinQuake/)
- [C] Software path `D_DrawTurbulent8Span` (d_scan.c):
  `sturb = ((s + turb[(t>>16)&(CYCLE-1)])>>16)&63; tturb = ((t + turb[(s>>16)&(CYCLE-1)])>>16)&63;
  *dest++ = pbase[(tturb<<6)+sturb];` — i.e. each texel's u is offset by a sine of its v and vice versa.
- [C] Constants (d_iface.h, r_local.h): `TURB_TEX_SIZE 64`, `CYCLE 128`, `AMP 8*0x10000` (8 texels in 16.16),
  `AMP2 3` (screen warp), `SPEED 20`. Table init (r_main.c `R_InitTurb`):
  `sintable[i] = AMP + sin(i*2π/CYCLE)*AMP`. Animation = slide the table pointer:
  `turb = sintable + ((int)(cl.time*SPEED) & (CYCLE-1))`.
- [C] GL path (gl_warp.c `EmitWaterPolys`): per-vertex `s = os + turbsin[(int)((ot*0.125+realtime)*TURBSCALE)&255]`,
  `TURBSCALE = 256/(2π)`, then `*1/64`; turbsin table 256 entries, ~±8 (gl_warp_sin.h).
- [C] Underwater full-screen warp `D_WarpScreen` (d_scan.c): row/column pointer tables indexed through
  `intsintable` (AMP2 = 3 px), slightly compressing the view to avoid edge wrap.
- [I] Cost: 2 table lookups + 2 adds + 1 texel fetch per pixel; memory 128 ints. Period 128 texels, amplitude
  ±8 texels on a 64 texture, table slides 20 entries/s → full cycle ≈ 6.4 s. For pixel art, use amplitude 1–2 px
  and quantize offsets to whole pixels to avoid shimmer. GLSL one-liner:
  `uv += vec2(sin(uv.y*k + t), sin(uv.x*k + t)) * amp_px / tex_size;` then `floor()` to texel grid.

### Inferences (acid design)
- [I] Author acid pool tiles with 6–8 "acid ramp" indices (dark green → toxic yellow-green → near-white);
  rotate indices 0–5 slowly (sine-wave mode 4) for surface sheen and indices 6–7 fast (standard) for
  bubble highlights. Since Godot has no hardware palette, store an index texture (R8) and do
  `texelFetch(palette_tex, ivec2((idx + shift) % n, 0))` in shader — 1 extra fetch/pixel.
- [I] Palette cycling handles "flowing" spill streaks (author streaks along flow direction with sequential indices);
  pairs well with the snow study's palette-lighting approach.

### Gaps
- Did not fetch Heretic/Hexen liquid scrolling details (Heretic uses scrolling floors per Doom wiki list: FLTWAWA, FLTSLUD, FLTLAVA).
- No hard frame-time numbers for Canvas Cycle on modern hardware (daverupert.com reports a different, hue-shift
  approach: ~300 ms/frame unoptimized for a 6.4 MP image, 9–12 fps after worker optimization — not comparable to an indexed approach).
  https://daverupert.com/2018/09/color-cycling-image-pixels-with-workers/

---

## Q2. Demoscene effects: plasma, 2D blobs/metaballs, fire, water ripple, bubbles

### Takeaway
- Plasma = precomputed sum-of-sines buffer + palette shift → animated acid sheen for 1 lookup + add per pixel.
- 2D blobs = stamp a precomputed falloff LUT per blob into an accumulation buffer, threshold via palette
  → slimes and pooled acid that merge/split for ~1 add per covered pixel per blob.
- Classic fire.c = average of 4 neighbours minus 1 → rising fumes.
- Hugo Elias ripple = 2 int buffers, 4 adds + shift per pixel → splashes/footsteps/bubbles popping on pools.

### Cited findings
**Plasma**
- [C] lodev: `color = 128 + 128*sin(x/8.0)`; sum several sines (x, y, x+y, distance from a point); divide by term count.
  Precompute once; each frame `paletteShift = int(getTime()/10.0)`; `buffer = palette[(plasma + paletteShift) % 256]`;
  palette must loop seamlessly (hue or per-channel sines with π·x/power-of-two). Recomputing sines per pixel each frame
  is "much slower" (https://www.lodev.org/cgtutor/plasma.html).
- [C] flipcode Art of Demomaking #4: precalc tables ~2× screen in each dimension (4× area), animate by moving window
  offsets into them; sum two tables, e.g. `64+63*sin(hypot(200-j,320-i)/16)` and
  `64+63*sin(i/(37+15*cos(j/74)))*cos(j/(31+11*sin(i/57)))`, each in [0,127] so the sum indexes a 256 palette;
  use a wrap-around palette to avoid clamping (https://flipcode.com/archives/The_Art_of_Demomaking-Issue_04_Per_Pixel_Control.shtml).

**2D blobs / metaballs**
- [C] Christian Cohnen "Blobs2D" (Java applet 1996–1999, JS port): falloff `(1 - r²/R²)²` inside radius R, precomputed
  once for blob size 4–128 px and *added* into the screen buffer at each blob position each frame; odd blobs subtract
  ("anti-blobs"); summed value indexes a gradient palette; signed-byte field; `pixelsize` for chunky low-res
  (https://webpage-65r.pages.dev/pixelfx/Blobs2D/Blobs2D.htm).
- [C] Ryan Geiss blobs (2000): original field 1/r², threshold 0.0–0.25 (suggest 0.15–0.2); replace with polynomial
  `r⁴ - r² + 0.25` (finite support, zero at r≈0.707; compare r² against 0.5 to skip sqrt); the divide was the main cost;
  bounded falloffs give 20–50× speedup on 2000 charges; blend per-charge color/attributes weighted by field contribution
  (https://geisswerks.com/ryan/BLOBS/blobs.html).
- [I] For pixel-art slimes: field buffer at 1/2 or 1/4 res (e.g. 80×45 for a viewport region), stamp a 16×16 or 32×32 u8 LUT
  with saturating add, then palette map: `<T` transparent, `T..T+2` dark rim/outline index, above = body ramp, top band =
  specular highlight. Outline comes for free from the threshold band (no edge detect). Merge/split, digestion (item sprite
  drawn where field > T with tint), and "burst into pool" (stop moving blob centers, spread & decay their weights) are
  all just changes to blob centers/weights.

**Classic fire (non-Doom)**
- [C] Adam Parusel, GameDev.net 1999 (credits JARE/Iguana 1993): two 320×200 buffers; seed rows 198–199 with random 100–150,
  optional 10–50 random 3×3 sparks of 255; each pixel = average of 4 neighbours (left, right, above, below of the source)
  written one row up, minus 1; guard against 0−1 wrapping to 255; swap buffer pointers
  (https://www.gamedev.net/articles/programming/graphics/simple-fire-effect-r222/).

**Water ripple (Hugo Elias)**
- [C] Original page freespace.virgin.net/hugo.elias/graphics/x_water.htm (archive.org BLOCKED by egress policy and
  WebFetch allowlist in this session); algorithm reproduced by Microsoft Silverlight sample blog, crediting Elias:
  two int arrays (heights, 0 = sea level); for every non-edge cell
  `B2[x,y] = (B1[x-1,y]+B1[x+1,y]+B1[x,y+1]+B1[x,y-1])/2 - B2[x,y]; B2 *= damping` (Elias uses 0.94); swap; display.
  Render: `xo = h[x-1,y]-h[x+1,y]; yo = h[x,y-1]-h[x,y+1]; shading=(xo-yo)/2; color = tex[x+xo, y+yo] + shading`, clamp
  (https://learn.microsoft.com/en-us/archive/blogs/nikola/building-the-reallistic-water-ripples-sample-in-silverlight).
- [C] Maciej Matyka (2018) re-implementation: same formula, ping-pong buffers; seeding with a single pixel gives
  "really ugly picture" → seed a 3×3 block (https://maciejmatyka.blogspot.com/2018/03/2d-water-algorithm.html).
- [I] Integer version common in demos: damping as `h -= h >> 5` (≈0.969) — not verified in a fetched source here.
- [I] Acid use: the pool's own area is the mask (cells outside pool are clamped to 0 = walls → ripples reflect off
  pool edges). Splash = add +N to a 3×3 when a creature steps in, an item drops, or a bubble pops. For pixel art,
  clamp offset to ±1 px and map shading to ±1 palette index instead of RGB add.
  Cost: ~5 adds + 1 shift per cell sim, ~4 subs + 1 fetch per pixel render; memory 2 × W×H int16 (a 64×64 pool = 16 KB).

**Bubbles (tiny)**
- [I] No dedicated old-school bubble source found. Cheapest proven pattern from the above: a bubble is a short-lived
  2D blob (Blobs2D stamp, small R) whose weight grows then pops → on pop, inject −N into the ripple buffer + spawn 1–3
  fume pixels into the fire/fume buffer. Alternatively hash-based: per pool cell `if hash(cell, floor(t*rate)) < p`
  draw a 1–3 px bright ring from a 4-frame flipbook (Doom-style 4.4 fps fits pixel art).

### Gaps
- Could not read Hugo Elias original text (archive.org blocked); exact original damping wording and "smoothing" step are
  from secondary sources.
- Did not find documented 256-byte 2D blob internals on pouet (search only surfaced e.g. "dancing blobs" by deater,
  Outline 2024 256b oldskool: https://files.scene.org/view/parties/2024/outline24/256_byte_intro_oldskool/dancing_blobs_by_deater.zip — not inspected).

---

## Q3. Doom fire adapted: corrosion front CA, inverse fire for fumes

### Takeaway
The Doom PSX fire is the template for both a corrosion front (integrity value propagates sideways from acid cells
with random decay) and rising acid fumes (it already IS a rising-gas CA; just swap the palette to greens/greys
and shorten its height).

### Cited findings
- [C] Fabien Sanglard on PSX/N64 Doom fire: framebuffer values in [0,36] (37-colour ramp white→yellow→orange→red→black);
  bottom line = source (36); per cell `to = from - FIRE_WIDTH - rand + 1` (horizontal jitter = wind) and
  `firePixels[to] = firePixels[from] - (rand & 1)` with `rand = round(random()*3) & 3`; linear decay alone is
  "a boring uniform output" (https://fabiensanglard.net/doom_fire_psx/).
- [I] Doom fire's stop condition (not on the page, from general knowledge of the effect): set the source row to 0 and the
  CA self-extinguishes within ~37 rows of steps. Treat as unverified.

### Inferences — proposed acid CAs
- [I] **Fume CA (inverse-fire):** fume[y-1][x+rand-1] = fume[y][x] - (rand&1) - (rand==3 ? 1 : 0); source cells are
  acid pool pixels with "heat" = acid strength × (bubble event ? 1 : 0.3). Palette 8–12 entries: transparent → dark
  olive → sickly green → pale yellow-green, with index < k dithered (Bayer) instead of alpha. Run on a 1/2-res buffer over
  the pool's bounding box only. Cost ≈ 1 RNG + 3 ops per cell.
- [I] **Corrosion front CA (on items / walls / floor stain):** per material cell keep `integrity u8`. Each tick (e.g. 4 Hz,
  Doom-like) for cells adjacent to acid: `integ[c] = min(integ[c], integ[nbr] + resist[mat] ) - (rand < p_mat ? 1 : 0)`.
  Map integrity through the material's palette ramp (shiny → dull → pitted → holed/transparent). This yields the same
  ragged "eaten edge" Doom fire gets from rand-jitter. Gold/glass: resist high, p_mat ≈ 0.
- [I] **Stain/etch mark:** once acid leaves, freeze integrity; stains fade by decrementing a separate stain byte at
  1/32-tick cadence (Doom `leveltime&0x1f`-style throttling keeps it nearly free).
- [I] Same "depth byte + dither threshold" model as the SNOW study: acid depth byte per tile-pixel; threshold
  against Bayer to decide draw/no-draw at the shrinking edge during evaporation.

### Gaps
- No found shipped game that used Doom-fire CA specifically for corrosion; this is a proposed adaptation.

---

## Q4. Hugo Elias ripple details
See Q2 (cited formula, 0.94 damping, refraction offsets, 3×3 seeding). Original page could not be reached
(archive.org blocked); secondary sources consistent with each other.

---

## Q5. PICO-8 / TIC-80 / Dwitter / tweetcart goo

### Takeaway
Weak yield. The tweetcart culture confirms the size class (280–300 chars) but I found no documented acid/slime cart
with explained technique.

### Cited findings
- [C] Munro's Postcarts (PICO-8, ~128 tiny programs), each written to fit 280 chars (Twitter) / 300 (Bluesky); the
  "cosmic horror" cart is a row of circles with a sine offset that merge visually — a circle-union trick rather than a
  field (https://lexaloffle.com/bbs/?pid=80723).
- [I] The PICO-8 idiom for cheap goo is "union of filled circles + `fillp` dither pattern for edges", i.e. visual
  metaballs without a field: draw outline circles radius r+1 in dark colour, then body circles radius r on top; overlapping
  circles merge. Cost per blob ≈ circle fill area; no buffer. Not verified with a specific cart.
- Shadertoy not attempted (expected blocked).

### Gaps
- No verified PICO-8/TIC-80 slime cart source. Recommend the writer use the circle-union trick as a labelled inference.

---

## Q6. Dither dissolve (Bayer) and Wolfenstein fizzlefade for item dissolve

### Takeaway
For a pixel-art item eaten by acid, replace alpha with a per-pixel threshold: pixel visible iff
`integrity > bayer4x4[x&3][y&3]` (ordered, stable, no shimmer) or iff its LFSR rank > dissolved count
(fizzle, each pixel exactly once, deterministic duration). Combine with a "noise mask" or a corrosion CA to make holes
start at edges.

### Cited findings
- [C] Fizzlefade (Wolfenstein 3D): 17-bit maximum-length LFSR, XOR constant 0x00012000, seed 1, period 131,072; Y = low
  8 bits, X = next 9 bits; values outside 320×200 skipped; stop when register returns to 1 → every pixel plotted once,
  deterministic duration; Galois form needs one XOR regardless of taps; replaces a naive RNG approach that wasted cycles
  and was non-deterministic (https://fabiensanglard.net/fizzlefade).
- [C] Ordered dither: index matrix side is power of two; threshold `Mpre = (Mint+1)/n²` (−0.5 optional); per-pixel,
  no conditionals; pattern is fixed relative to frame so it "jitters less" in animation than error diffusion
  (https://en.wikipedia-on-ipfs.org/wiki/Ordered_dithering).
- [I] Standard 4×4 Bayer values (from general knowledge): [[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]].

### Inferences
- [I] Item dissolve: precompute a per-sprite "dissolve order" (u8 per pixel) once — either LFSR rank (fizzle, uniform
  random) or distance-from-contact-edge + small noise (eaten-from-the-edge). Shader: `discard if order < progress*255`;
  draw a 1-px bright acid-green rim where `order` within progress band (2–3 ops). Same 16×16 texture for all items.
- [I] For tile-scale fades (evaporating puddle, gas cloud thinning) use Bayer threshold — stable, readable, matches SNOW.

---

## Q7. Ranking: 14 cheapest techniques (cost, memory, look)

All costs are [I] estimates from the cited algorithms (op counts derived from formulas above), per pixel per frame
unless noted. "Pool" = 64×64 px region.

| # | Technique | Use for acid | Cost | Memory | Look |
|---|---|---|---|---|---|
| 1 | Palette range cycling (Canvas Cycle) | pool sheen, flowing streaks, glow pulse | 0 ops/pixel CPU-palette; 1 extra fetch in shader; per frame only `n` palette entries | palette 256×3 B + index image | very good; painterly; needs authored indices |
| 2 | Doom flipbook flat (NUKAGE, speed 8) | bubbling pool tile | 0 ops; frame = (time/8 tics) % n | 3–4 tiles | classic, readable, stepped |
| 3 | Damage-tick throttling (`leveltime&0x1f`) | acid DoT, stain fade, slow CA ticks | 1 AND per entity/tick | 0 | n/a (gameplay) |
| 4 | Bayer threshold dissolve/fade | puddle evaporation, item holes, gas thinning | 1 fetch + 1 compare | 16 B LUT | crisp, retro, stable |
| 5 | Fizzlefade LFSR order | item dissolve (random) | precompute once; 1 compare/pixel | 1 B/pixel order map (or 17-bit register, 0 memory, sequential) | iconic, random speckle |
| 6 | Quake turb UV warp | liquid wobble/refraction of pool texture | 2 LUT + 2 add + 1 fetch | 128-entry table | wobbly, alive; quantize for pixel art |
| 7 | Precomputed plasma + palette shift | toxic surface swirl, gas cloud interior | 1–2 lookups + add | 4× area table or tileable 64×64 | psychedelic; tone down with narrow palette |
| 8 | Circle-union "fake metaballs" (PICO-8 idiom) | small slimes, droplets | ~area of circles; 2 passes (outline, body) | 0 | cute, chunky |
| 9 | 2D blob LUT stamp + threshold palette (Blobs2D) | slimes merging/splitting, pooled acid, digestion | 1 saturating add per covered pixel per blob + 1 palette map | field buffer (1/2–1/4 res u8) + R² LUT | gooey, true merge, free outline |
| 10 | Doom fire CA (inverse = fumes) | rising acid fumes over pool | ~1 RNG + 3 ops per cell | 1 B/cell (bbox only, 1/2 res) | wispy, retro |
| 11 | Corrosion-front CA (fire-style integrity) | eaten edges on items/walls/floor etch | ~5 ops per affected cell at 4 Hz | 1 B/cell for affected sprites/tiles | ragged, organic |
| 12 | Classic fire.c 4-neighbour average −1 | thicker smoke/gas plume | 4 adds + shift + sub | 2 buffers | softer than Doom fire |
| 13 | Hugo Elias 2-buffer ripple + refraction | splashes, steps, bubble pops on pools | sim 4 adds + shift + sub (+ mul or shift damping); render 2 subs + fetch | 2 × int16 per cell (64×64 pool = 16 KB) | very convincing; best "reactive" bang-for-buck |
| 14 | Combined: ripple heights drive palette index offset + turb + cycling | hero acid pool | sum of 1+6+13 ≈ 10–12 ops | as above | top quality |

### Recommended "tiny stack" for Asterion acid pool [I]
index texture (authored ramp) → palette cycle (sheen) → ±1 px Quake turb (quantized) → ripple buffer adds ±1 index
and ±1 px offset at splashes → hash bubbles every few frames inject ripple + fume source → fume CA above pool →
Bayer for pool edge during evaporation; Doom-style damage tick 5/10/20 per ~0.9 s.

---

## Sources
- id Software Quake source (d_scan.c, r_main.c, r_local.h, d_iface.h, gl_warp.c, gl_warp_sin.h, r_shared.h): https://github.com/id-Software/Quake/tree/master/WinQuake
- id Software DOOM source p_spec.c: https://github.com/id-Software/DOOM/blob/master/linuxdoom-1.10/p_spec.c
- Doom Wiki, Animated flat: https://doomwiki.org/wiki/Animated_flat
- Fabien Sanglard, How DOOM fire was done: https://fabiensanglard.net/doom_fire_psx/
- Fabien Sanglard, Fizzlefade: https://fabiensanglard.net/fizzlefade
- Joseph Huckaby, canvascycle source: https://github.com/jhuckaby/canvascycle ; demo https://experiments.withgoogle.com/canvas-cycle
- monochrom.at repost of "Old School Color Cycling with HTML5": https://monochrom.at/blog/?p=11592
- Dave Rupert, color cycling with workers: https://daverupert.com/2018/09/color-cycling-image-pixels-with-workers/
- Lode Vandevenne, plasma tutorial: https://www.lodev.org/cgtutor/plasma.html
- flipcode, Art of Demomaking #4: https://flipcode.com/archives/The_Art_of_Demomaking-Issue_04_Per_Pixel_Control.shtml
- Christian Cohnen, Blobs2D: https://webpage-65r.pages.dev/pixelfx/Blobs2D/Blobs2D.htm
- Ryan Geiss, Metaballs: https://geisswerks.com/ryan/BLOBS/blobs.html
- Adam Parusel, Simple Fire Effect: https://www.gamedev.net/articles/programming/graphics/simple-fire-effect-r222/
- Microsoft (Nikola), Silverlight water ripples (Hugo Elias algorithm): https://learn.microsoft.com/en-us/archive/blogs/nikola/building-the-reallistic-water-ripples-sample-in-silverlight
- Maciej Matyka, 2D water algorithm: https://maciejmatyka.blogspot.com/2018/03/2d-water-algorithm.html
- Ordered dithering (Wikipedia IPFS mirror): https://en.wikipedia-on-ipfs.org/wiki/Ordered_dithering
- Munro's Postcarts (PICO-8): https://lexaloffle.com/bbs/?pid=80723
- Blocked/unreachable this session: archive.org (Hugo Elias original x_water.htm), en.wikipedia.org (Plasma effect, Metaballs, Color cycling), lodev.org/cgtutor/fire.html.
