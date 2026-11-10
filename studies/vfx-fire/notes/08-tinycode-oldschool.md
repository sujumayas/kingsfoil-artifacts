# 08 Tiny code and old-school hardware tricks for fire and smoke

Angle: what fire and smoke look like when the budget is 64 bytes, 140 characters, a 16-colour palette or a scanline register. Each trick lists code size, the core rule, cost and a URL. Cost figures marked (inf.) are my own op counts from reading the code, not measured.

---

## Q1. What is the smallest fire that still reads as fire?

### Takeaway
Two rules carry nearly every tiny fire. Rule A is the DOOM / demoscene cooling buffer: each cell copies a neighbour from below and loses a little heat. Rule B is the age ramp: a cell or particle steps down a colour table as it ages. Rule B with no neighbour averaging fits an Apple II fire in 64 bytes. The PICO-8 version of rule B is 116 characters. These are the floor for the study. Anything more expensive must earn its cost.

### Cited findings

| Trick | Size | Platform | Core rule | Cost per pixel | URL |
|---|---|---|---|---|---|
| DOOM PSX fire | full game code | PSX | `r=rand&3; buf[from-W-r+1] = buf[from] - (r&1)` | 1 rand, 1 read, 1 write (inf.) | https://fabiensanglard.net/doom_fire_psx/ |
| minfire | 64 bytes (header claim) | x86 DOS, mode 13h 320x200 | `p = (a + 2b + p, XOR-noised) >> 2` from above-left/above | ~5 adds/XORs + 1 shift (inf.) | https://github.com/xeleh/sizecoding/blob/main/minfire/minfire.asm |
| Apple II lo-res fire (qkumba) | 64 bytes (80 before using ROM SCROLL) | Apple II, 40x48 px | scroll up 1 row; bottom row white; each cell with 50% chance: `c = table[c & 7]` | 1 LFSR step, 1 table lookup, no neighbour reads (inf.) | https://git.applefritter.com/Apple-2-SW/dos33fsprogs/raw/commit/6e4d96942ec7c8f87d3ce3ce0544d91803082b61/demos/fire/fire_qkumba.s |
| PICO-8 fire (kometbomb) | 116 chars | PICO-8 128x128 | Monte Carlo: random (x,y); `c=pget(x,y+rnd(2))`; `if rnd(50)<c then c=t[c]`; `circ(x,y,1,c)`; seed bottom with `pset(...,7)` | ~1 random sample per loop, no full-screen pass | https://gist.github.com/kometbomb/7ab11b8383d3ac94cbfe1be5fb859785 |
| Lode's fire | tutorial (C++) | 640x128 buffer | `f[y][x] = (f[y+1][x-1]+f[y+1][x]+f[y+1][x+1]+f[y+2][x]) * 32 / 129` | 4 reads, 3 adds, 1 mul, 1 div (inf.) | https://lodev.org/cgtutor/fire.html |
| syntax09 Speccy chunky fire | 139 bytes party, 104 bytes later | ZX Spectrum 48K | cellular-automaton fire on "chunkymode" | not stated | https://files.scene.org/view/parties/2009/syntax09/demo_oldschool/syntax09nf.zip (via search snippet) |
| BooMfire | BASIC 10-liner (10 lines, max 256 chars each) | ZX Spectrum (ugBASIC) | DOOM fire drawn by changing cell attributes (INK/PAPER), not pixels; 3 selectable palettes | per 8x8 cell, not per pixel | https://retrobits.altervista.org/blog/2024/03/boomfire-my-entry-to-the-13th-basic-10liner-contest/ |
| C64 character fire | not size-coded | C64, 40x25 = 1000 cells | one byte per cell; custom 8x8 dither characters, char index = intensity; colour RAM gives the foreground hue; 4 ramps of 64 steps (black-brown, brown-red, red-yellow, yellow-white) | per 8x8 cell | https://c0de517e.com/026_c64fire.htm |
| PICO-8 DOOM fire (thxrsxm) | full cart | PICO-8 | 32x36 grid (1,152 cells), each cell drawn 4x wide, `pset` only when colour > 0; 60 fps | 1,152 cells per frame | https://www.lexaloffle.com/bbs/?pid=172560 |
| PICO-8 DOOM fire (Adam Richardson) | full cart | PICO-8 | heat 0..4 mapped to colour table `{0,8,9,10,7}` | 1 lookup + pset per cell | https://thales17.srht.site/posts/doom_fire.html |
| TIC-80 DOOM fire (borbware) | 1.8 kB, not size-coded | TIC-80 | DOOM fire | n/a | https://borbware.itch.io/doomfire |

Lode's notes on the divisor: it must be "slightly larger than 4". Dividing by exactly 4 makes the fire rise forever. Dividing by 5 kills it too fast. The bottom row must be re-randomised every frame or the flames freeze once they reach full height. His demo caps at 50 ms per frame (20 fps). https://lodev.org/cgtutor/fire.html

minfire palette: 256 DAC entries built in a loop, half ramping red and half ramping green, which gives black-red-yellow. The bottom row is seeded from the BIOS timer word at 0x46C, so no PRNG code is needed. https://github.com/xeleh/sizecoding/blob/main/minfire/minfire.asm . It placed 9th in the Lovebyte 2022 high-end 64-byte compo. https://www.pouet.net/prod.php?which=90974

The Apple II version's cooling table is not monotonic. Even indices go to black and odd indices step down the ramp. That makes cells drop out at random, which breaks the flame into tongues with no neighbour averaging. https://git.applefritter.com/Apple-2-SW/dos33fsprogs/raw/commit/6e4d96942ec7c8f87d3ce3ce0544d91803082b61/demos/fire/fire_qkumba.s

### Inferences
- For a 320x180 Godot game, a whole-screen buffer is wasted work. The PICO-8 and Spectrum carts show that a fire buffer of 32x36 or a 40x25 cell grid still reads as fire. A campfire needs maybe 16x24 cells. At 4 ops per cell that is under 2,000 ops per frame per fire.
- The Apple II "scroll + age table" rule has no neighbour reads. It is the cheapest fire found, and it maps directly to a Godot shader that reads one texel and one noise value.
- kometbomb's Monte Carlo trick (update random pixels instead of all pixels) matters for a server-visible MMO scene with many fires. You can update a fixed number of random cells per frame across all fires, which caps cost no matter how many fires are on screen.
- The C64 and Spectrum attribute fires are a direct template for tile-grid fire. One "heat" value per 8x8 or 16x16 tile, drawn with a dither tile per heat level. That is how a spreading-fire CA on Tibia-like tiles could look without per-pixel simulation.

### Gaps
- I did not verify minfire's 64-byte size by assembling it.
- I found no specific 256-byte "fire" prod page on pouet for x86. The searches returned only minfire (64b) and a Reddit note on a 20-byte and 32-byte mode 13h fire, without a URL I could open.
- BooMfire's grid size and update rule are on a separate tech page I did not open.

---

## Q2. Tweet-size fire on the web (Dwitter, JS1k, Shadertoy)

### Takeaway
Browser size-coded fire usually cheats with canvas filters. It draws many coloured rectangles, then `blur + contrast` fuses them into flame blobs. That is the opposite of pixel art (it smears). It is useful only as a reminder that "blur then threshold" is a metaball. The pixel-art-safe version is a block-sum blur plus palette select, which study #2 (Acid) already covered.

### Cited findings
- Dwitter d/21204 by rodrigo.siqueira is 136 of 140 characters. It draws 999 rectangles of 25x50 px per frame, x from `S(i/8)`, y from `T(t+i*i)`. The canvas CSS filter is `blur(7px)contrast(5)` plus invert. https://www.dwitter.net/d/21204
- A "Fire Filter" write-up based on that dweet avoids `random` so the fire stays continuous between frames. https://github.com/fserb/bkc/blob/master/pages/fire/fire.md?plain=1
- JS1k 2014 "Dragons" entry by subzey draws flames with `putImageData` under a dragon, final version 1024 bytes. https://gist.github.com/subzey/10020935
- Shadertoy does not count whitespace or comments toward byte count, per the Tiny Clouds dissection. Tiny Clouds itself is 280 characters. https://blog.demofox.org/2017/11/26/dissecting-tiny-clouds/

### Inferences
- `blur + contrast` is a two-pass metaball. In pixel art, do it at native 320x180 with a 3x3 box sum and a hard palette threshold. You get blobby smoke without sub-pixel smear.

### Gaps
- I did not find a named minimal Shadertoy fire with a character count. Searches only surfaced generic fire shaders.
- JS13k fire/smoke entries were not checked.

---

## Q3. Particle fire and smoke on tiny budgets

### Takeaway
The PICO-8 idiom is age -> colour index, plus radius shrinking to a single `pset`. A fixed table like `{8,9,10,5}` (red, orange, yellow, grey) turns fire into smoke at the last quarter of life with zero extra code.

### Cited findings
- Nerdy Teachers fire: 3 particles per frame, spawn box 3 px wide, life `30 + rnd(10)` frames, `dy = -0.5`, `dx = 0`. Radius starts at 2 and shrinks 0.1 per frame. Drawn as `circfill` while r > 1, then as `pset`. Colour by age fraction: <0.25 colour 8, <0.5 colour 9, <0.75 colour 10, else colour 5 (grey smoke). https://nerdyteachers.com/PICO-8/Game_Mechanics/14
- Core rule in pseudocode: `c = ramp[flr(age/life * #ramp)]; r -= 0.1; if r>1 circfill(x,y,r,c) else pset(x,y,c)`.
- Note the ordering. That ramp goes red, orange, yellow, then grey, which is cold to hot to smoke. The DOOM ramp runs the other way (white at the source, fading to black). The flipped ramp works for a "blooming" puff. A classic flame needs hot-first.
- MBoffin's heavily commented PICO-8 particle cart is a reference build. https://mboffin.itch.io/pico-8-particles
- Size-code tricks from kometbomb's gist that apply to particle code: integer divide `x\1` instead of `flr`, lookup tables instead of if-chains, `srand(0)` each frame for a repeatable random field. https://gist.github.com/kometbomb/7ab11b8383d3ac94cbfe1be5fb859785

### Inferences
- Fixed-pool particles. A ring buffer of N=64 per emitter with an integer age is enough. Recycling the oldest slot on spawn needs no allocation. This suits Godot's GDScript or a `MultiMesh`, but `CPUParticles2D` already does it.
- Embers: give them `vy -= 0.05` lift and `vx *= 0.95` drag, 1 px `pset`, colour 10 -> 9 -> 8 -> 2 by age. Per-particle cost is about 6 adds and 1 lookup per frame (inf.).
- Smoke puff that grows: invert the radius rule (`r += 0.1`) and switch to a fill pattern by age (see Q4) instead of a colour change.

### Gaps
- Specific "metaball smoke" tiny-code examples were not found within the call budget.

---

## Q4. Pixel-art transparency for smoke (dither, fillp, hardware blending)

### Takeaway
Pixel art can't use smooth alpha without breaking the palette. The old answers are ordered dither (Bayer 4x4 gives 17 levels), PICO-8 `fillp` patterns (the same 4x4 grid in one 16-bit number), and hardware blending on GBA (16 levels) or Mega Drive shadow (one level). For a WebGL2 Godot game the shader version of Bayer 4x4 alpha-test costs one texture-free lookup per pixel.

### Cited findings
- Bayer 4x4 matrix, divided by 16: rows `0 8 2 10 / 12 4 14 6 / 3 11 1 9 / 15 7 13 5`. https://en.wikipedia.org/wiki/Ordered_dithering
- Rule: `if alpha <= bayer[x&3][y&3]/16 then discard`. A Godot 4 canvas shader does exactly this, with a separate matrix offset for alpha. https://godotshaders.com/?p=7263 and https://godotshaders.com/shader/simple-ordered-dithering-and-screen-pixelation/
- Screen-door theory: overlapping transparent objects each need a different matrix offset, or they hide each other. https://diglib.eg.org/bitstreams/1850ae15-9d38-4522-a389-e6cfe8e990ed/download
- PICO-8 `fillp(p)` sets a 4x4 two-colour pattern from a 16-bit field. `fillp(0)` resets to solid. https://nerdyteachers.com/PICO-8/Guide/FILLP . Adding `0b.1` makes the "off" bits transparent, e.g. `fillp(0x8421 + 0b.1)`. https://www.lexaloffle.com/bbs/?pid=69393 . MBoffin's cart demonstrates patterns. https://mboffin.itch.io/pico8-fill-patterns
- GBA alpha blending: `I = min(31, I1*EVA + I2*EVB)`, EVA and EVB in 0..16. The Nintendo manual calls it 16 levels of semi-transparency. EVA + EVB = 16 is normal alpha. A larger sum gives an additive glow. https://blocksds.skylyrac.net/tutorial/intermediate/special_2d_effects/ , https://docs.rs/gba-hal/latest/gba_hal/data/struct.BlendAlpha.html , https://www.manualowl.com/m/Nintendo/1504166/Manual/330639?page=83
- GBA blend registers are not latched per scanline, so a game can change them mid-frame. https://forums.mgba.io/showthread.php?tid=343
- Mega Drive shadow/highlight: sprite pixels using palette 3 colour 15 shadow the plane pixels beneath. Palette 3 colour 14 highlights them. Sprites can't shadow other sprites. Used in Ristar, Vectorman, Ranger-X, Mega Turrican. https://rasterscroll.com/mdgraphics/graphical-effects/shadow-and-highlight/ , https://segaretro.org/Sega_Mega_Drive/Shadow_and_highlight
- One developer described shadow as roughly halving brightness and highlight as several shades brighter. https://segaretro.org/Sega_Mega_Drive/Shadow_and_highlight

### Inferences
- Smoke puff in Godot: draw a filled circle and alpha-test against Bayer 4x4 with alpha = 1 - age/life. That is a palette-safe fade in 17 steps. Animate the matrix offset by puff id so overlapping puffs don't cancel.
- Mega Drive shadow sprites are a good model for "smoke shadow on the ground". A dark operator sprite that halves the ground colour is one palette shift, cheaper than real alpha. In palette-indexed rendering it is a `shade[colour]` lookup.
- Highlight sprites are a model for explosion flash. Brighten whatever is under the fireball by one palette step for 2 to 4 frames. I found no source that documents a Mega Drive game doing this for explosions.

### Gaps
- Blue-noise dither for smoke was not researched within the budget.

---

## Q5. Heat haze and wobble with scanline offsets

### Takeaway
SNES, Mega Drive and NES games faked heat shimmer and fire wobble by writing one scroll offset per scanline from a sine table. The CPU does nothing per pixel. On a GPU that becomes `uv.x += amp * sin(y*k + t)`, which is one sin per pixel, or one per row if you precompute a 180-entry table.

### Cited findings
- OpenSNES wave example: HDMA writes a per-scanline horizontal offset to BG1HOFS ($210D). The sine data is precomputed. Animation changes where HDMA starts reading the table. It stores one table per amplitude, 7 x 1006 = 7042 bytes of ROM. https://k0b3n4irb.github.io/opensnes/graphics_2effects_2hdma__wave_2main_8c.html
- HDMA repeat entries cover at most 127 scanlines each (line counter 0x81..0xFF). https://snes.nesdev.org/wiki/HDMA_examples
- A SNES register wiki lists BG1VOFS for vertical waves, naming fire as the use. https://sneslab.net/wiki/HDMA
- Dracula X fire (nesdev thread). lidnariq: the building layer wobbles left-right on a sine, the fire layer is transparent and wobbles up-down. Mix sine amplitudes over time and over y so the motion never sits flat near zero derivative. SriK's working version: `s = frame/8; pct = i/flameHeight; y = i + 8*cos(0.5*s + 8*pi*pct); x = 3*cos(s + 8*pi*pct)`. These are forum guesses, not confirmed hardware details. https://nesdev.nes.science/f12/t17484.xhtml
- Mega Drive line scroll: each scanline scrolls on its own. Twinkle Tale uses it for lava that flows back and forth. Ranger-X wobbles scanlines in water, strongest near the player. https://rasterscroll.com/?p=333

### Inferences
- Rule for Godot: in the fire's screen region, `offset_x(row) = round(A * sin(row*0.5 + t*6) * falloff(row))` with A = 1 px at 320x180. Rounding keeps pixels crisp. Per pixel cost is 1 table lookup if the sine is baked into a 1D texture.
- The Dracula X vertical-offset trick (repeat or skip source rows) turns a static fire sprite into a licking flame with no extra frames. That is a strong low-art-cost option for braziers.

### Gaps
- I found no source on SNES colour math used for fire glow specifically. Mode 7 fire was not found.

---

## Q6. Palette cycling for fire and lava

### Takeaway
Colour cycling animates a static image by rotating palette entries. Mark Ferrari's scenes (Loom, Monkey Island era) are the reference. Joseph Huckaby's 2010 HTML5 "Canvas Cycle" replays 35 of his 640x480 images in a browser. NES games had very limited palette room: fades were usually only 4 brightness steps.

### Cited findings
- Canvas Cycle (Huckaby, July 2010) renders an 8-bit cycling engine into a 32-bit canvas, 35 Ferrari images at 640x480, code free to use. https://experiments.withgoogle.com/canvas-cycle , https://80.lv/articles/color-cycling-from-the-90s-returns-with-html5
- Colour cycling uses less memory and CPU than storing frames. https://en.wikipedia.org/wiki/Color_cycling
- NES: games mostly adjusted colour brightness, so fades had only 4 steps. A nesdev user saw the screen shake when writing palette mid-frame for a fire flicker. https://nesdev.nes.science/f10/t8192.xhtml (via search snippet)

### Inferences
- Rule: `palette[base + (i + t) % n] = ramp[i]` for i in 0..n-1, every k frames. Cost is n writes per tick regardless of screen area. In Godot this is a 1D palette texture and an offset uniform. Lava on many tiles costs one uniform update.
- Ferrari's Q&A page on effectgames refused connection (ECONNREFUSED on the mirror). His cycle rates and band counts are not captured here.

### Gaps
- Ferrari Q&A was blocked. Try archive.org for `effectgames.com/effect/article-Q_A_with_Mark_J_Ferrari.html`.

---

## Q7. Other hardware: Amiga, Atari 2600

### Cited findings
- Amiga copper chunky: a chunky screen made only from copper colour changes per scanline position. Steffest's OCS demo Naphta (2025) builds most effects on it, and "pixels" need not be square. https://blog.stef.be/naphta
- Amiga blitter fire: a fire-cube write-up describes an `(a+b+c+d)/4` average done with blitter passes (21 passes). Seen only in a search snippet, source page not opened.
- Atari 2600: SpiceWare's "Stay Frosty" uses flickering fireball sprites, and the flicker suits fire. https://forums.atariage.com/topic/272855-flicker/ (via search snippet). The 2600 has 76 CPU cycles per scanline for all drawing. https://8bitworkshop.com/docs/posts/2025/versatile-playfield-kernel.html

### Inferences
- 30 Hz sprite flicker on 2600 fireballs is a free "transparency". A modern pixel game can borrow it for fire fields: draw the flame overlay on alternate frames for a semi-see-through look with no blending. On 60 Hz phones it may look harsh. Test it.

### Gaps
- No specific 2600 fire demo or copper-fire Amiga prod found.

---

## Summary table for the study

| Trick | Size | Cost per pixel or cell | Pixel taste | Best use in Kingsfoil |
|---|---|---|---|---|
| Age-table fire (Apple II) | 64 B | 1 rand + 1 lookup | high, blocky | cheapest campfire shader |
| Neighbour-average fire (DOOM, minfire, Lode) | 64 B to tiny C | 1-4 reads + shift | high | braziers, fire fields, title screen |
| Monte Carlo update (PICO-8) | 116 chars | fixed samples per frame | high | capping cost over many fires |
| Cell/attribute fire (C64, Spectrum) | 8x8 cells | per tile | chunky | tile-grid spreading fire |
| Age -> colour particles + shrink to pset | ~20 lines | ~6 ops per particle | high | embers, sparks, small smoke |
| Bayer 4x4 alpha test | ~10 shader lines | 1 lookup + compare | high | smoke puffs, steam, fog |
| Shadow/highlight operator | 1 palette shift | 1 lookup | high | smoke shadows, explosion flash |
| Scanline sine offset | 1 table | 1 lookup per row | high if rounded | heat haze, flame lick |
| Palette cycling | n writes per tick | 0 per pixel | high | lava, coals, fire field tiles |
| blur + contrast (Dwitter) | 136 chars | blur kernel | low (smears) | avoid, or redo as 3x3 box + threshold |

---

## Sources
- https://fabiensanglard.net/doom_fire_psx/
- https://github.com/xeleh/sizecoding
- https://github.com/xeleh/sizecoding/blob/main/minfire/minfire.asm
- https://www.pouet.net/prod.php?which=90974
- https://git.applefritter.com/Apple-2-SW/dos33fsprogs/raw/commit/6e4d96942ec7c8f87d3ce3ce0544d91803082b61/demos/fire/fire_qkumba.s
- https://gist.github.com/kometbomb/7ab11b8383d3ac94cbfe1be5fb859785
- https://lodev.org/cgtutor/fire.html
- https://c0de517e.com/026_c64fire.htm
- https://retrobits.altervista.org/blog/2024/03/boomfire-my-entry-to-the-13th-basic-10liner-contest/
- https://files.scene.org/view/parties/2009/syntax09/demo_oldschool/syntax09nf.zip
- https://www.lexaloffle.com/bbs/?pid=172560
- https://thales17.srht.site/posts/doom_fire.html
- https://borbware.itch.io/doomfire
- https://www.dwitter.net/d/21204
- https://github.com/fserb/bkc/blob/master/pages/fire/fire.md?plain=1
- https://gist.github.com/subzey/10020935
- https://blog.demofox.org/2017/11/26/dissecting-tiny-clouds/
- https://nerdyteachers.com/PICO-8/Game_Mechanics/14
- https://mboffin.itch.io/pico-8-particles
- https://mboffin.itch.io/pico8-fill-patterns
- https://nerdyteachers.com/PICO-8/Guide/FILLP
- https://www.lexaloffle.com/bbs/?pid=69393
- https://en.wikipedia.org/wiki/Ordered_dithering
- https://godotshaders.com/?p=7263
- https://godotshaders.com/shader/simple-ordered-dithering-and-screen-pixelation/
- https://diglib.eg.org/bitstreams/1850ae15-9d38-4522-a389-e6cfe8e990ed/download
- https://blocksds.skylyrac.net/tutorial/intermediate/special_2d_effects/
- https://docs.rs/gba-hal/latest/gba_hal/data/struct.BlendAlpha.html
- https://www.manualowl.com/m/Nintendo/1504166/Manual/330639?page=83
- https://forums.mgba.io/showthread.php?tid=343
- https://rasterscroll.com/mdgraphics/graphical-effects/shadow-and-highlight/
- https://segaretro.org/Sega_Mega_Drive/Shadow_and_highlight
- https://rasterscroll.com/?p=333
- https://k0b3n4irb.github.io/opensnes/graphics_2effects_2hdma__wave_2main_8c.html
- https://snes.nesdev.org/wiki/HDMA_examples
- https://sneslab.net/wiki/HDMA
- https://nesdev.nes.science/f12/t17484.xhtml
- https://nesdev.nes.science/f10/t8192.xhtml
- https://experiments.withgoogle.com/canvas-cycle
- https://80.lv/articles/color-cycling-from-the-90s-returns-with-html5
- https://en.wikipedia.org/wiki/Color_cycling
- https://blog.stef.be/naphta
- https://forums.atariage.com/topic/272855-flicker/
- https://8bitworkshop.com/docs/posts/2025/versatile-playfield-kernel.html
- Blocked: https://dcmpx.remotevs.com/com/effectgames/www/PL/effect/article-Q_A_with_Mark_J_Ferrari.html (ECONNREFUSED)
