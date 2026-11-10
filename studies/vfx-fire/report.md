# Top-down pixel fire and smoke: tiny algorithms for campfires, spreading fire, smoke and combat fire

**Kingsfoil Studios · Research study · November 2026**

---

## Context

This is study #6 in our VFX series. Each study picks one concept and hunts for old-school algorithms that are very small and very efficient.

- **Study #1, snow** [S2]: palette lighting and dithered lamp pools.
- **Study #2, acid** [S3]: glow by block-sum blur plus palette select, bubbling pools.
- **Study #3, rain** [S4]: lightning flash palettes, firelight under rain, splashes.
- **Study #4, forest** [S5]: shade ellipses, sunflecks, canopy and wind.
- **Study #5, light** [S6]: the Tibia light model, Quake flicker strings, candle physics and carried torches.

Fire as a light source was covered by #5. This study is about the fire and smoke themselves. It asks how they look, how they move, how they spread over tiles and how they hurt things.

The series reference is the **DOOM PSX fire** [S1], and this time it is the subject of the study. One byte of heat per pixel, one rule that copies heat upward and sometimes loses a step, one 37-colour palette. Nearly every good answer in this study has the same shape. A cheap number per cell holds the truth, and a palette or sprite turns that number into pixels.

Fire is harder than snow or rain because it is a system. A campfire is a loop of four drawings, a grass fire is a cellular automaton, smoke is a drifting field, and a fireball leaves a tile that hurts. Each part has a classic few-line answer, and the combat one is exactly what Tibia does.

**Targets.**
- Godot 4, web-first, so the **Compatibility renderer** (WebGL 2, no compute shaders, limited 2D lights).
- Top-down (3/4) pixel art for the Tibia-like MMORPG **Asterion Online** and a top-down RPG. The MMO is server-authoritative, so many players must see the same fire burn the same way.
- Weak hardware. Phones and old laptops, no big computer.

**Sources.** Ten research notes (01 to 10), benchmarks we ran ourselves, and our playable **Fire Sandbox** [S7].

---

## 1. Executive summary

1. **The DOOM fire is still the best small fire.**
   - Heat 0 to 36, 37 palette entries, bottom row fixed at 36. Each pixel copies the pixel below into a column shifted by +1 to −2, minus `rand & 1` [V, S1].
   - Flames reach about 72 rows and lean left 0.5 px per row; the lean is the built-in wind [I, note 01]. A 16x32 torch patch is 512 updates per frame.
2. **Big fires must animate slower.**
   - Puffing follows `f ≈ 1.5 / sqrt(D)`, D in metres [V, S51]. Candle about 15 Hz, campfire 2 Hz, burning house under 1 Hz [I, note 04].
   - Draw 4 to 6 frames at 8 to 12 fps with 4 tones, keep the base still, and seed each torch's phase from its tile [V, S28, S114].
3. **Spreading fire is a tiny state machine on tiles with a coarse tick.**
   - Per tile: material, fuel, moisture, state. Each burning tile rolls an ignition chance per neighbour [I, S88, S66].
   - Use p of about 0.35 to 0.6 with 3 to 6 burn ticks. p = 1 gives square or diamond fronts; p = 0.3 with 1 burn tick dies out [I, note 03, measured].
   - An active list ran 10x faster than a full sweep in JS and 35x in GDScript at 320x180 [I, note 03, measured].
4. **Cap it, or one player burns the world.** Far Cry 2 gives a Molotov 60 "spreading points" at 8 per cell [V, S64]; an uncapped test burned "miles of terrain" in about 2 minutes [V, S65]. For Asterion, burn natural tiles only, never towns or houses, with a budget per source and ash that regrows [I, note 06].
5. **Wind and rain are one multiply each.** Alexandridis wind `exp(V·(c1 + c2·(cos θ − 1)))`, c1 = 0.045, c2 = 0.131 [V, S58]. Minecraft rain puts fire out with 20% + 3% per age step per tick [V, S66].
6. **Smoke is a small byte grid drawn with a Bayer pattern, not a fluid solver.**
   - At 320x180, Stam fluids cost 32 ms per step in JS; an integer diffuse-rise-decay CA costs 0.077 ms [I, note 03, measured].
   - Stardew's chimney puff rises 0.5 px per frame, drifts, grows and fades over about 6 s [V, S114; I, note 10]. Smoke colour is a free state signal: white steam, grey wood, black oil [V, S54].
7. **Combat fire is a decaying tile item plus a burn status, as in Tibia.**
   - TFS fire field: `initdamage 20`, then 7 ticks of 10 every 10 s, three 120 s stages, the last harmless [V, S96]. TibiaWiki says 9 s ticks [V, S93].
   - "Lose one burn stack per tick" (Mewgenics) and "only the strongest ground effect ticks" (Path of Exile) keep an MMO fair and cheap [V, S103, S107].
8. **On Godot web, keep the truth on the CPU and the looks in tiny buffers.** The server owns the grid and sends ignition events; clients draw everything else [I, note 03]. `DrawableTexture2D` (4.7) can run fire and smoke buffers on the GPU, untested on web [V, S128; U]. Avoid `SCREEN_TEXTURE` haze on Compatibility [V, S121].

---

## 2. How to read this study

| Tag | Meaning |
|---|---|
| **[V]** | Verified in a source our researchers read: code, paper, docs, wiki or article. "[V, vendor]", "[V, self-reported]" and "[V, secondary]" mark figures reported by their authors or through an aggregator. |
| **[I]** | Author inference or design proposal; untested unless it says "measured" or "Sandbox", and then tested only in our scripts or our JavaScript prototype. |
| **[U]** | Unverified: memory, a search snippet, or a page that could not be fetched. Treat it as a lead. |
| **[K]** | Textbook or canonical knowledge (maths, well-known release years). |

- [S#] refers to §14. "[I, note 0X]" is an inference made by the researcher in that note.
- Ratings (1–5) are author judgement: **Simplicity · Speed · Pixel taste · Mood · Interactivity**.
- **Measured** numbers come from scripts we wrote and ran on 2026-11-10 on an **Apple M4 Pro** with **Node v26.5.0** and **Godot 4.7.stable headless** [I, note 03]. A mid-range phone browser is probably 3 to 6 times slower. That factor is a guess, not a measurement.
- Sandbox numbers are illustrative. The Sandbox is a Canvas 2D page, not a Godot build.

---

## 3. Generations: a timeline

**Gen 0: the science**
- **1972** Rothermel's fire spread model [V, S61]; **1985** Perlin's noise fire and corona [V, S44].
- **1989** Henley and **1990** Bak, Chen and Tang forest-fire automata [V, S55]; **1992** Drossel and Schwabl [V, S56]; **1993** Cetegen and Ahmed, puffing frequency [V, S52].
- **1995** Stam and Fiume, warped blobs [V, S45]; **1997** Karafyllidis and Thanailakis [V, S62].
- **2002** Nguyen, Fedkiw and Jensen fire; Lamorlette and Foster flame spines [V, S46, S47]; **2003** Stam's real-time fluids for games [V, S49].
- **2007** Bridson curl noise [V, S48]; **2008** Alexandridis CA for the Spetses fire [V, S59]; **2019** Freire and DaCamara restate its constants [V, S58].

**Gen 1: bytes, palettes and fire fields (1990s to 2007)**
- **1996** **Diablo** Fire Wall [K; V, S101]; **1997** **Tibia** and **Ultima Online** fire fields [K; V, S93, S97].
- **Jul 1999** Parusel's gamedev.net fire tutorial, built on the book PC Underground [V, S10].
- **2004–07** Lode Vandevenne's fire tutorial [V, S9].
- Undated: Hugo Elias's VGA cooling-map fire [V, S8]; Mark Ferrari's colour-cycled scenes in 80s and 90s products [V, S19]; the Final DOOM PSX and DOOM 64 fire, reverse-engineered in 2018 [V, S1].

**Gen 2: systems, sand and style guides (2008–2020)**
- **2008** **Far Cry 2** systemic fire, one programmer for about 1.5 years [V, S65]; **2010** Canvas Cycle replays Ferrari in HTML5 [V, S18].
- **2011** Minecraft fire ticks and Terraria On Fire! [K; V, S66, S80]. **May 2012** RuneScape bonfires [V, S100]. **2012** Levesque's Far Cry 2 write-up [V, S64].
- **2016** Stardew Valley torches and smoke puffs [K; V, S114]. **2017** Riot's VFX style guide; BotW "chemistry engine" talk; Divinity: Original Sin 2 ground effects [V, S37, S73, S75].
- **2018** Sanglard's DOOM fire article; Sandspiel; Into the Breach smoke tiles [V, S1, S136, S112].
- **2019** Noita GDC talk [V, S77]; **Oct 2020** Noita 1.0 [V, S78]; **May 2020** Wildfire ships [V, S86].

**Gen 3: tiny carts, engines and the web (2021–2026)**
- **2022** minfire, 64 bytes at Lovebyte [V, S11]. **Mar 2024** BooMfire, DOOM fire in Spectrum attributes [V, S15]. **Apr 2024** Sigil of Kings wildfires [V, S84]. **Sep 2024** a pixel-perfect fire physics devlog [V, S85].
- **May 2025** Holographic radiance cascades [V, S140]. **Sep 2025** Godot 4.5, WebAssembly SIMD [V, S123]. **Nov 2025** Simple Pixelated Fire shader; Retro Diffusion animation model [V, S133, S144].
- **Jan 2026** Godot 4.6 [V, S124]. **Feb 2026** **Mewgenics** burn stacks and fire tiles [V, S103]. **Apr 2026** GodotCon talk on retro pixel VFX [V, S131].
- **Jun 2026** **Godot 4.7**: `DrawableTexture2D`; a CC0 lava shader [V, S125, S135]. **Oct 2026** Godot 4.8 beta 1 [V, S127].

---

## 4. Technique profiles

There are eight families:

- **A.** Buffer fire roots
- **B.** Drawn flames and palettes
- **C.** Particles
- **D.** Spreading fire on tiles
- **E.** Smoke and steam fields
- **F.** Combat fire
- **G.** Lava, haze, glow and interactions
- **H.** Frontier

Each profile ends with ratings for **Simplicity · Speed · Pixel taste · Mood · Interactivity** (1 = poor, 5 = excellent; author judgement). Families A to C cover small fires and flicker, D covers spreading fire, E covers smoke and steam, and F covers combat fire. Sandbox constants are listed in §8.

### Family A: Buffer fire roots

### A1. DOOM PSX fire

*In plain words.* A grid of heat numbers. Every frame each number moves up one row, sometimes drifts one column sideways, and sometimes loses one step of heat. The bottom row is always hot. A 37-colour palette turns heat into black, red, orange, yellow and white.

*How it works (technical).*
- The heat range is 0 to 36, so the palette has 37 entries from `070707` through `DF4F07` and `BFA727` to `FFFFFF`. Index 0 is drawn transparent so the logo shows behind the fire [V, S1].
- Sanglard's web port uses a 320x168 buffer at 27 fps. Setup zeroes the buffer and sets the bottom row to 36, which is never updated [V, S1].
- The rule, per pixel, walking x then y:
  ```
  p = fire[src]
  if p == 0: fire[src - W] = 0
  else:
      r   = round(random() * 3)        # 0..3
      dst = src - r + 1                # sideways +1, 0, -1, -2
      fire[dst - W] = p - (r & 1)      # lose 0 or 1
  ```
  [V, S1]
- Maths from the code [I, note 01]. `round(random()*3)` is not uniform (1/6, 1/3, 1/3, 1/6), so P(decay) = 1/2. Mean flame height is about 72 rows. The sideways offset averages −0.5 px per row, so the fire leans about 36 px left over its height. That bias is the wind. To steer it, add a `windShift` to `dst`.

*Cost / performance.* One read, one write and one random number per pixel, no division. 320x168 is 53,440 updates per frame. A 16x32 torch patch is 512 [I, note 01].

*Games that used it.*
- DOOM PSX / DOOM 64 title fire: https://fabiensanglard.net/doom_fire_psx/
- PICO-8 DOOM fire (32x36 cells at 60 fps): https://www.lexaloffle.com/bbs/?pid=172560

*How it feels.* Unmistakably "pixel fire". The tongues come from the sideways shift, not from any blur, so edges stay crisp [I].

*Risks.*
- A full-screen buffer is wasted work in a 320x180 game. Use small patches per fire [I, note 08].
- With 37 colours the ramp is smooth. For a strict palette, quantise to 8 to 12 entries; that is untested [I, note 01].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 5 · Mood 4 · Interactivity 3

### A2. Blur-and-cool fires: Parusel, Lode and minfire

*In plain words.* The older demoscene fire. Seed random hot pixels at the bottom, average each pixel with its neighbours, take a little heat away, and scroll up. The averaging makes soft, rounded flames.

*How it works (technical).*
- **Parusel, 1999** [V, S10]. Mode 13h, two buffers. Seed rows 198 and 199 with random values 100 to 150, plus 10 to 50 random 3x3 hotspots of 255. Rule `B2[x,y-1] = (left + right + up + down) / 4 - 1`, checking for 0 first or the byte wraps to 255.
- **Lode** [V, S9]. `f[y][x] = (f[y+1][x-1] + f[y+1][x] + f[y+1][x+1] + f[y+2][x]) * 32 / 129`, about ÷4.03. The divisor must be "slightly larger than 4". Exactly 4 rises forever, 5 dies "way to fast". The bottom row gets a new random value every frame, or the flames freeze at full height. Palette by HSL, hue x/3 (0 to 85), lightness `min(255, 2x)`. Buffer 640x128, capped at 20 fps.
- **minfire** [V, S11]. 64 bytes of x86 for mode 13h. Bottom row seeded from the BIOS timer word at 0x46C, so there is no random number code. It placed 9th in the Lovebyte 2022 high-end 64-byte compo.

*Cost / performance.* 4 reads, 3 adds and a multiply-shift or divide per pixel [I, note 08]. Roughly 4x the DOOM rule.

*Games that used it.*
- Lode's tutorial (demo inside): https://lodev.org/cgtutor/fire.html
- minfire on pouet: https://www.pouet.net/prod.php?which=90974

*How it feels.* Warm and soft, like a gas fire. Less "pixel" than DOOM because the blur wants 64 to 256 colours [I, note 01].

*Risks.* Smooth gradients fight a small palette. The divisor is touchy; a tiny change halves or doubles flame height [V, S9].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 4 · Pixel taste 3 · Mood 4 · Interactivity 2

### A3. Hugo Elias's scrolling cooling map

*In plain words.* Instead of cooling every pixel by the same amount, keep a hidden picture of "how fast this spot cools" and slide it up with the flames. Dark spots in the map make tall tongues. Paint a shape into the map and the fire burns in that shape.

*How it works (technical).*
- Four steps per frame for VGA 320x200 [V, S8]. Heat source (a few maximum pixels in the bottom lines), spread (average of 4 neighbours), cooling, convection (scroll up 1 px).
- The cooling map is a screen-sized byte array. Sprinkle "a few thousand pixels", run about 20 smoothing passes, so values sit between 0 and about 10. Each frame `p = avg4 − coolingmap(x, y + offset)`, clamped at 0, written one pixel higher [V, S8].
- Shapes drawn into the map appear "created in flame". He jokes about pentagrams and skulls [V, S8].
- The DOOM rule is a stripped version of this design. Random decay replaces the map and random sideways shift replaces his warp feedback [I, note 04].

*Cost / performance.* One extra byte read per pixel on top of A2 [I, note 04].

*Games that used it.*
- Hugo Elias's page (archived): https://web.archive.org/web/2016/http://freespace.virgin.net/hugo.elias/models/m_fire.htm
- asciimatics fire renderer, based on it: https://sources.debian.org/src/python-asciimatics/1.15.0-1/asciimatics/renderers/fire.py

*How it feels.* The best tongue shapes for almost no cost. A rune drawn into the map gives a fire field that burns in the rune's shape, which suits Tibia-style magic fields [I, note 04].

*Risks.* The map is a full-size array per fire unless you tile a small looping map. A map with too little variation looks like the plain blur fire [I].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 4 · Pixel taste 4 · Mood 5 · Interactivity 3

### A4. Age-table fire and Monte Carlo updates

*In plain words.* Two even cheaper tricks. In the first, every cell just steps down a colour table as it ages, and the whole picture scrolls up. In the second, you do not update every pixel each frame. You update a fixed number of random pixels, and fire still appears.

*How it works (technical).*
- **Apple II lo-res fire** (qkumba) [V, S12]. 64 bytes, 80 before reusing the ROM scroll routine. 40x48 pixels. Scroll up one row, set the bottom row white, then each cell with 50% chance becomes `table[c & 7]`. The table is not monotonic. Even indices go to black, odd ones step down the ramp, so cells drop out at random and the flame breaks into tongues without reading any neighbour.
- **PICO-8 fire** (kometbomb) [V, S13]. 116 characters. Pick a random (x, y), read `c = pget(x, y + rnd(2))`, and `if rnd(50) < c then c = t[c]`, then draw a radius-1 circle of c. Seed the bottom with white pixels. There is no full-screen pass at all.

*Cost / performance.* Apple II style: 1 random step and 1 table lookup per cell, no neighbour reads [I, note 08]. Monte Carlo: a fixed number of samples per frame, whatever the number of fires on screen [I, note 08].

*Games that used it.*
- Apple II fire source: https://git.applefritter.com/Apple-2-SW/dos33fsprogs/raw/commit/6e4d96942ec7c8f87d3ce3ce0544d91803082b61/demos/fire/fire_qkumba.s
- PICO-8 116-character fire: https://gist.github.com/kometbomb/7ab11b8383d3ac94cbfe1be5fb859785

*How it feels.* Blocky and lively. Monte Carlo fire has a grainy shimmer that suits a crowded scene [I].

*Risks.* Monte Carlo fire flickers more when the sample budget is spread over many fires. Age tables without any neighbour coupling read as noise if the table is too uniform [I].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 5 · Mood 3 · Interactivity 2

### A5. Attribute-cell fire: one heat value per 8x8 cell

*In plain words.* Run the fire on a coarse grid, one number per 8x8 block, and draw each block with a pre-made tile for that heat level. This is how the C64 and the Spectrum did fire, and it is exactly the shape of a tile game.

*How it works (technical).*
- **C64 character fire** [V, S14]. 40x25 = 1,000 cells, one byte each. Custom 8x8 dither characters, character index = intensity, colour RAM gives the hue. Four ramps of 64 steps (black-brown, brown-red, red-yellow, yellow-white).
- **BooMfire** [V, S15]. A ZX Spectrum BASIC 10-liner (March 2024) that runs the DOOM fire by changing cell attributes (INK and PAPER), not pixels. Three palettes.
- For Asterion the same idea becomes the spread grid itself. One heat or state value per tile, drawn with a flame tile per state [I, note 08].

*Cost / performance.* Per cell, not per pixel. A 40 x 22 sandbox grid is 880 cells [I].

*Games that used it.*
- C64 fire write-up: https://c0de517e.com/026_c64fire.htm
- BooMfire: https://retrobits.altervista.org/blog/2024/03/boomfire-my-entry-to-the-13th-basic-10liner-contest/

*How it feels.* Chunky and honest. At 8x8 it already reads as fire from across the room [I].

*Risks.* Blocky edges unless the dither tiles are well drawn. Combine with B1 sprites on top for close-up fires [I].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 4 · Mood 3 · Interactivity 4

### Family B: Drawn flames and palettes

### B1. Hand-drawn flame loops: 4 tones, 4 to 6 frames, 8 to 12 fps

*In plain words.* The way most pixel games do a torch. Draw four to six small pictures of a flame, cycle them about ten times a second, keep the bottom still and let the top change shape.

*How it works (technical).*
- **Ramp** [V, S28]. Four tones, hottest in the core: near-white, yellow, orange, deep red at the edge. The white core can be 2 or 3 pixels but "carries" the sprite. Avoid brown, which "reads as smoke or as dirt".
- **Motion** [V, S28]. 4 to 6 frames. Keep the base nearly still. Change the silhouette instead of sliding the sprite up. New tongues form at the top and break away.
- **Rate** [V, S29]. 8 to 12 fps is common, and effects use 3 to 6 frames with "expansion, dispersion, fade".
- **Shape model** [I, note 04]. Lamorlette and Foster model a flame as a bent spine whose tip can break off as a separate plume [V, S47]. That detaching tip is what makes a 4-frame loop read as fire instead of a wobbling cone.
- **3/4 view** [I, note 06]. Draw the flame in side view, rising to screen-up. Sit it on a floor-plane ellipse (scorch or log pile), the same convention as study #4's shade ellipses.

*Cost / performance.* One sprite draw per fire per frame. A frame change every 100 ms [I].

*Games that used it.*
- Stardew Valley torch (4 frames, 100 ms): https://github.com/E-riCA0/StawdewValley/blob/HEAD/Torch.cs
- Battle for Wesnoth fire strip: https://wiki.wesnoth.org/Fire_Animation

*How it feels.* Hand-made and warm. The best-looking small fires in shipped pixel games are drawn, not simulated [I].

*Risks.* Rotating or scaling a flame sprite makes mixels, which look "uncanny" [V, S34]. A loop without a detaching tip looks like a jelly [I].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 5 · Mood 5 · Interactivity 2

### B2. Size sets the loop speed: f = 1.5 / sqrt(D)

*In plain words.* A candle flickers fast, a bonfire heaves slowly, a burning house rolls. Real flames puff at a rate set by their width, so your loops should slow down as fires get bigger.

*How it works (technical).*
- Flames puff because a ring vortex sheds periodically. Experiments give `f ∝ D^−1/2` with a factor "around 1.5" [V, S51]. Xia and Zhang's trend line `f = 0.48 sqrt(g/D)` is the same as `f = 1.5 sqrt(1/D)` with D in metres [V, S51].
- Fuel chemistry barely matters. The frequency is "flow-dominated" [V, S51].

*Cost / performance.* Zero. It is a choice of frame count and rate [I].

*Games that used it.*
- Puffing frequency paper: https://arxiv.org/pdf/1803.10400
- Sprite-AI fire guide ("big fire moves slower"): https://www.sprite-ai.art/gallery/fire

*How it feels.* Scale you can feel. A slow, heavy house fire looks huge even at 32 px [I].

*Risks.* Too slow and a big fire looks like a looped GIF. Add 2 or 3 desynced small flame sprites on top for detail [I].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 4 · Mood 5 · Interactivity 2

### B3. Fire palette ramps, hue shift and glow bands

*In plain words.* Fire colour runs from dark red at the edge through orange and yellow to near-white in the core. Real hot things glow in the same order. Keep that order, skip brown, and save pure white for flashes.

*How it works (technical).*
- **Glow bands** [V, S53]. First visible dark red 500 to 600 °C, dull red 600 to 800, cherry red 800 to 1,000, orange 1,000 to 1,200, yellow 1,200 to 1,400, white about 1,300 to 1,600. Sources disagree by about 100 °C at band edges. Wood flame yellow comes from hot soot.
- **Blue core** [V, S46; I, note 04]. Nguyen et al. model a blue core from the reaction zone. One or two blue-violet pixels at the base fit gas, oil or magic fire, not a wood campfire.
- **Recipe** [I, note 04]. Six steps: black, dark red, red, orange, yellow, pale yellow-white. The white belongs only to the hottest base area. Cool edges go toward maroon or dark purple, never brown.

*Cost / performance.* A palette or a small LUT [I].

*Games that used it.*
- DOOM fire palette: https://fabiensanglard.net/doom_fire_psx/
- Flame colour by temperature: https://pslc.ws/fire/howwhy/flameco.htm

*How it feels.* Correct fire colour reads as heat instantly. A ramp with brown in it reads as dirty smoke [V, S28].

*Risks.* Fully saturated ramps look cheap, and a ramp that hits white in the body leaves nothing for explosions [I, S38].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 5 · Mood 4 · Interactivity 1

### B4. Palette cycling fire and lava

*In plain words.* Paint one still picture. Animate the flames by rotating a few palette colours, so pixels that use those colours appear to move. No frames, no sprites.

*How it works (technical).*
- Ferrari drew one flat 256-colour image with no layers or alpha. Cycling animated water, fire and clouds [V, S17]. He confirms the images shipped in 80s and 90s products [V, S19].
- Canvas Cycle (Huckaby, July 2010) replays 35 of his 640x480 images in HTML5. It pre-finds the pixels that use cycling entries and updates only those [V, S17, S18].
- Dave Rupert found fire "felt a lot more like fire" with a shift array, yet still "mechanical and overly sequenced" [V, S20].
- Rule [I, note 08]: `palette[base + (i + t) % n] = ramp[i]` every k frames. In Godot, an index texture plus a palette-lookup shader with a time offset, the same trick as study #1 [I, note 01].

*Cost / performance.* n palette writes per tick, zero per pixel. Many lava tiles cost one uniform update [I, note 08].

*Games that used it.*
- Canvas Cycle: https://experiments.withgoogle.com/canvas-cycle
- Living Worlds coverage: https://80.lv/articles/color-cycling-from-the-90s-returns-with-html5

*How it feels.* Gorgeous for lava, coals and forges that never move. Stiff for open flames [I, S20].

*Risks.* No cycle rates for Ferrari's fire scenes were found [I, note 01]. Cycling cannot spread or react; it is decoration only [I].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 5 · Mood 3 · Interactivity 1

### B5. Desync by tile seed, and the Stardew torch

*In plain words.* A row of torches that all flicker together looks fake. Give each one a different starting frame from its position on the map, and every player sees the same varied row with no network traffic.

*How it works (technical).*
- **Stardew torch** [V, S114]. Flame source rect `Rectangle(276 + frame*12, 1985, 12, 11)`, so 12x11 art pixels. `frame = ((ms + x*3047 + y*88) % 400) / 100`, which is 4 frames of 100 ms (10 fps). The `x*3047 + y*88` term shifts the phase per tile.
- Three ember pixels per torch rise `(i+1)*0.25` px per frame, odd ones wobble, and respawn at the base with chance 3/400 per frame. They update only within 4 tiles of the screen [V, S114].
- These numbers come from a decompiled early build (1.0 or 1.1 era) [V, S114; U on version].
- **For an MMO** [I, note 06]. Seed the offset from `hash(x, y)`, plus a per-instance `speed_scale` of 0.9 to 1.1.

*Cost / performance.* One multiply-add per torch per frame [I].

*Games that used it.*
- Stardew Valley Torch.cs (decompiled): https://github.com/E-riCA0/StawdewValley/blob/HEAD/Torch.cs
- Stardew torch item: https://stardewvalleywiki.com/Torch

*How it feels.* A street of torches that shimmers instead of pulsing. Players never notice it, which is the goal [I].

*Risks.* Hash offsets that are too regular (x*1) make diagonal waves. Use large odd multipliers as Stardew does [I].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 5 · Mood 4 · Interactivity 2

### Family C: Particles

### C1. Ember and spark pool with age-to-colour

*In plain words.* Single hot pixels that float up from a fire, cool from yellow to red to dark red, and wink out. Sparks from an impact do the same but fall. A fixed pool of a few hundred is plenty.

*How it works (technical).*
- **PICO-8 fire particles** (Nerdy Teachers) [V, S16]. 3 particles per frame from a 3 px spawn box, life `30 + rnd(10)` frames, `dy = −0.5`. Radius starts at 2 and shrinks 0.1 per frame, drawn as `circfill` while r > 1, then `pset`. Colour by age fraction: < 0.25 red (8), < 0.5 orange (9), < 0.75 yellow (10), then grey (5).
- **Recommended starting values** (to test, not cited) [I, note 09]. Campfire 6 to 12 embers/s, torch 2 to 4, burning creature 8 to 15, fireball trail 20 to 40. Life 0.6 to 1.5 s. Initial speed up 15 to 40 px/s with ±20° spread. Gravity −10 to −20 px/s² for embers (buoyant), +60 to +120 px/s² for impact sparks. 1x1 px, rarely 2x1.
- **Colour by age** [I, note 09]. 0 to 20% pale yellow, 20 to 50% yellow-orange, 50 to 85% red, 85 to 100% dark red. Blink the last 15% at 15 Hz instead of fading alpha.
- **Pool** [I, note 08]. A ring buffer with integer age; spawning reuses the oldest slot, so nothing allocates. Per particle about 6 adds and 1 lookup per frame. `vy −= 0.05` lift and `vx *= 0.95` drag.

*Cost / performance.* 256 particles × ~7 ops is under 2,000 ops per frame [I].

*Games that used it.*
- Nerdy Teachers fire particles: https://nerdyteachers.com/PICO-8/Game_Mechanics/14
- MBoffin's commented particle cart: https://mboffin.itch.io/pico-8-particles

*How it feels.* Embers sell heat more than the flame does. Three pixels rising off a torch make it feel alive [I].

*Risks.* Too many embers turn into confetti. Sub-pixel motion shimmers unless positions are rounded to whole pixels [I].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 5 · Mood 4 · Interactivity 2

### C2. Smoke puffs: Stardew's grow, drift and fade

*In plain words.* A chimney column is just one small grey blob spawned every so often. Each blob drifts up, slides sideways a little more each frame, grows and fades. The sideways push alone bends the column like wind.

*How it works (technical).*
- **Stardew `addSmokePuff`** [V, S114]. A 10x10 sprite tinted grey at alpha 0.75. Fade 0.002 per update. `motion = (0, −0.5)`, `acceleration = (0.002, 0)`. Scale 2, `scaleChange 0.02` per update. Rotation change random ±5π/256. A `delay` argument staggers spawns; one town event spawns 10 puffs with growing delay, another spaces puffs 1,500 ms apart.
- **Derived at 60 updates per second** [I, note 10]. Life 0.75 / 0.002 = 375 frames, about 6.25 s. Rise 187 screen px, about 47 art px or 3 tiles. Drift `0.5 × 0.002 × 375²` = 140 screen px. Scale 2 to 9.5, so the puff ends 4.75 times wider.
- **Iron Village** (Godot) train smoke [V, S115]. Spawn at the stack on a timer, not as a child. Inherit the emitter's horizontal speed, rise slowly, decelerate "to mimic air resistance", expand then shrink while fading.

*Cost / performance.* One chimney at one puff per 600 ms keeps about 10 alive. 20 chimneys is 200 quads [I, note 10].

*Games that used it.*
- Stardew Valley Utility.cs (decompiled): https://github.com/E-riCA0/StawdewValley/blob/HEAD/Utility.cs
- Iron Village smoke diary: https://lunar-chippy.itch.io/iron-village-prototype/devlog/725214/diary-14-settings-smoke

*How it feels.* "Someone lives here." A column on the horizon tells players where something is happening [I, note 06].

*Risks.* Alpha fades leave the palette. Use dithering or 3 palette steps plus a final dither frame [I, note 10].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 4 · Mood 5 · Interactivity 2

### C3. Dithered transparency for smoke, steam and fire overlays

*In plain words.* Pixel art cannot use soft see-through colours without inventing colours outside the palette. Instead, draw the smoke on some pixels and skip others in a fixed checker pattern. More skipped pixels means thinner smoke.

*How it works (technical).*
- **Bayer 4x4** [V, S21]. Rows `0 8 2 10 / 12 4 14 6 / 3 11 1 9 / 15 7 13 5`, divided by 16, give 17 levels.
- **Alpha test** [V, S22]. `if alpha <= bayer[x&3][y&3]/16 then discard`. Godot 4 canvas shaders that do exactly this exist.
- **Mega Drive shadow and highlight** [V, S23]. Sprite pixels in palette 3 colour 15 shadow the plane below, colour 14 highlights it. Used in Ristar and Vectorman. A shadow sprite is a model for smoke shadow on the ground; a highlight sprite is a model for an explosion flash [I, note 08].

*Cost / performance.* One threshold lookup and compare per pixel [I, note 08].

*Games that used it.*
- Ordered dithering: https://en.wikipedia.org/wiki/Ordered_dithering
- Mega Drive shadow and highlight: https://rasterscroll.com/mdgraphics/graphical-effects/shadow-and-highlight/

*How it feels.* Crisp, retro and honest. Steam that dithers out reads clearly as vapour [I].

*Risks.* A dither pattern that moves with the camera shimmers. Anchor it to world pixels [I].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 5 · Mood 3 · Interactivity 1

### C4. Godot particles on the web: what works and what breaks

*In plain words.* Godot's particle nodes work in the browser, but some features are missing there and each new particle type stutters the first time it appears. For pixel fire, prefer small CPU particle systems with low frame rates.

*How it works (technical).*
- **Missing on Compatibility** [V, S116]. Particle trails, particle SDF collision and 2D HDR viewports. Compatibility is the web default.
- **GPUParticles2D** [V, S117]. `emit_particle()` works only on Forward+ and Mobile. 2D particles collide only with LightOccluder2D. `fixed_fps` defaults to 30. Changing `amount` restarts the system, so use `amount_ratio`.
- **First-use stutter** [V, S118]. Each new GPUParticles2D type compiles a shader on first emit on web. Pre-warm off-screen at load [I, note 05].
- **Far Cry 2 pooling** [V, S64]. Emitters sit on burning cells. Emitters behind the camera teleport to where they are needed. When emitters run out, each particle grows to fill screen space.

*Cost / performance.* No official particle count or WebGL2 ms figure exists [V, S117; gap].

*Games that used it.*
- Godot 2D particle tutorial: https://docs.godotengine.org/en/stable/tutorials/2d/particle_systems_2d.html
- haowg Godot VFX library (torch fire, steam, fireball trails): https://github.com/haowg/GODOT-VFX-LIBRARY

*How it feels.* Smooth and modern unless you snap and slow it [I].

*Risks.* Compile hitches mid-fight, silent feature gaps on web, and particles that cannot collide with walls. Check smoke against the tile grid instead [I, note 02].

*Ratings 1–5 (author judgement):* Simplicity 3 · Speed 3 · Pixel taste 3 · Mood 4 · Interactivity 2

### Family D: Spreading fire on tiles

### D1. Tile burn states: fresh, igniting, burning, embers, ash

*In plain words.* Every tile is in one of a few states. Fuel waits. A neighbour's fire can make it start igniting. Burning eats its fuel. When the fuel is gone it glows as embers, then turns to ash. Each state has its own picture.

*How it works (technical).*
- **Drossel-Schwabl** [V, S56, S55]. Three states (empty, tree, burning). A tree with a burning neighbour ignites, lightning ignites with chance f, empty regrows with chance p, and only f/p matters. Without lightning and with slow regrowth, fronts become "regular and spiral-shaped".
- **Brogue** [V, S88, S89]. Fire, embers and ash are tile types. Plain fire promotes to embers at 500/10,000 per turn, embers to ash at 300/10,000. Brimstone fire uses 2,500, gas fire 8,000, and a dart explosion 10,000 (a one-turn flash).
- **Sigil of Kings** [V, S84]. A fire object has about 5 turns of fuel and is inert for the first 3 to 4. Checking neighbours from turn one "burned the whole forest".
- **Proposal** [I]. `NONE → IGNITING (1 tick) → BURNING (fuel ticks) → EMBERS (2 to 8 ticks, small re-ignite chance) → ASH (regrows after minutes)`.

*Cost / performance.* 1 byte of state plus 1 byte of fuel per tile. 1024x1024 is 2 MB [I, note 03].

*Games that used it.*
- Brogue CE tile catalogue: https://github.com/tmewett/BrogueCE/blob/master/src/brogue/Globals.c
- Sigil of Kings wildfires: https://byte-arcane.itch.io/sigil-of-kings/devlog/712302/wildfires

*How it feels.* Readable. Players can see a fire start, grow, die and leave a mark, and they get a warning window at the smoulder or igniting step [I, note 02].

*Risks.* Instant ignition with no delay runs away (Sigil of Kings). An embers state with too high a re-ignite chance makes fires that never end [I].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 4 · Mood 4 · Interactivity 5

### D2. Ignition chance, round fronts and burn time

*In plain words.* If fire always spreads to every neighbour, the burnt area grows as a perfect square or diamond. If each neighbour only catches with some chance, the front comes out round. How long a tile burns matters as much as that chance.

*How it works (technical).*
- **Measured shapes** [I, note 03, measured]. On a 401x401 all-fuel grid with 1 burn tick, the ratio of diagonal to axis radius was 0.71 for von Neumann at p = 1 (a diamond) and 1.41 for Moore at p = 1 (a square), still 1.33 with a 0.707 diagonal factor. Von Neumann at p = 0.6 gave 0.98 and Moore at 0.5 / 0.35 gave 1.03, both round. Moore at 0.3 / 0.21 died out.
- **Why** [I, note 03]. The 1/√2 diagonal factor alone does not fix the square when p is near 1. Randomness does the rounding, like Eden growth. Any p of about 0.35 to 0.6 gives a round front.
- **Burn time** [I, note 03]. With T burning ticks, a neighbour catches with `1 − (1 − p)^T`. p = 0.3 and T = 1 dies; T = 3 to 6 fixes it.
- **Brogue** [V, S88]. Every burning cell exposes itself and its 4 cardinal neighbours each turn. Ignition uses the highest `chanceToIgnite` among the cell's flammable layers. A cell is exposed at most 12 times per update. Cells that `CAUGHT_FIRE_THIS_TURN` do not spread.
- **Recipe** [I, note 03]. `p = base[fuel] × (1 − moisture) × wind(dir) × slope × (diag ? 0.707 : 1)`, base 0.5 grass, 0.25 trees, 0.15 planks, burn ticks 2, 6 and 10.

*Cost / performance.* One multiply chain and one random roll per burning-neighbour pair per tick [I, note 04].

*Games that used it.*
- Brogue CE Time.c: https://github.com/tmewett/BrogueCE/blob/master/src/brogue/Time.c
- DCSS cloud.cc: https://github.com/crawl/crawl

*How it feels.* Organic. A round, ragged front looks like a grass fire; a square looks like a bug [I].

*Risks.* Tuning p without T gives fires that die at once or never stop. Tune both together, as Minecraft does with two odds per block (D3) [I, note 03].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 4 · Mood 4 · Interactivity 5

### D3. Fuel tables: Minecraft, Brogue and friends

*In plain words.* Every material gets two numbers. How easily it catches, and how fast it is eaten. Dry grass catches easily and burns out fast. Logs are hard to light but burn long.

*How it works (technical).*
- **Minecraft ignite / burn odds** [V, S66]. Logs 5/5; planks 5/20; leaves and wool 30/60; bookshelf 30/20; hay 60/20; grass and flowers 60/100; vines and TNT 15/100. Humid biomes halve the odds. Netherrack and magma burn forever.
- **Brogue chance to ignite** [V, S89]. Grass 15%, dead grass 40%, hay 50%, foliage 15%, dead foliage 80%, door 50% (burns to embers), wooden barricade 100%, coffin 20%, flammable gases 100%.
- **Pixel-perfect fire physics** [V, S85]. Ignition temperatures wood 300 °C, paper 230, oil 210, fabric 250. Burnt-out fire becomes smoke at 80% temperature.
- **RuneScape** [V, S99]. An OSRS fire lasts "60 to 119 seconds, randomly chosen", whatever the log. RS3 gives better logs longer timers [V, S100].

*Cost / performance.* A small table per material id [I].

*Games that used it.*
- Minecraft fire: https://minecraft.wiki/w/Fire
- OSRS fire: https://oldschool.runescape.wiki/w/Fire

*How it feels.* Materials with personality. Players learn that hay is dangerous and stone is safe within minutes [I].

*Risks.* Too many materials with close numbers are unreadable. Keep 5 to 8 classes and make their sprites look as flammable as they are [I].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 4 · Mood 3 · Interactivity 5

### D4. Active list versus full sweep, and the coarse tick

*In plain words.* Do not scan the whole map every tick looking for fire. Keep a list of the tiles that are burning and only look at them and their neighbours. Tick slowly, two to five times a second, and animate the flames faster on the client.

*How it works (technical).*
- **Measured** [I, note 03, measured]. Moore CA, 75% fuel, 3 to 6 burn ticks, one central ignition, 200 ticks averaged. At 320x180 a full sweep took 0.55 ms in JS and 10.5 ms in GDScript; the active list took 0.056 ms and 0.30 ms. At 1024x1024 in JS, 15.8 ms against 0.085 ms (§6d).
- The active list was 10x cheaper than a sweep in JS and 35x in GDScript at 320x180, and 186x in JS at 1024x1024 [I, note 03, measured].
- **Minecraft Java** [V, S66, S67]. Each fire block schedules its own update every 30 to 40 game ticks (1.5 to 2 s), not a world sweep. Random ticks pick 3 blocks per 16³ subchunk per tick, about one tick per block every 68 s.
- **Tick** [I, note 03]. Fire at 2 to 5 Hz is plenty. Render flicker at 8 to 12 Hz.

*Cost / performance.* Proportional to burning tiles, not map size. About 12 KB of Int32 indices for 3,000 burning tiles [I, note 03].

*Games that used it.*
- Minecraft tick: https://minecraft.wiki/w/Tick
- Noita GDC talk: https://gdcvault.com/play/1025695/Exploring-the-Tech-and-Design

*How it feels.* Invisible when it works. A slow tick also reads well; players can see a fire step from tile to tile [I].

*Risks.* Iteration order leaks into results unless randomness is hashed per tile (D8). Lists need dedup when two fires ignite the same tile in one tick [I].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 3 · Mood 2 · Interactivity 4

### D5. Wind and slope

*In plain words.* Fire runs downwind and uphill. Multiply each neighbour's ignition chance by a number that is big in the wind's direction and small against it.

*How it works (technical).*
- **Far Cry 2** [V, S64]. Damage to each neighbour is scaled by `dot(wind, dir_to_neighbour)`, which gives a bell-shaped front moving with the wind. Uphill spread uses the same trick.
- **Alexandridis 2008** as restated by Freire and DaCamara [V, S58]. `p_burn = p0 (1 + p_veg)(1 + p_den) p_w p_s` with `p_w = exp(V·(c1 + c2·(cos θ − 1)))`, c1 = 0.045, c2 = 0.131, V in m/s. Slope `p_s = exp(a·θ_s)`, a = 0.078. Moore neighbourhood, 100 m cells, about 20 minutes per step. Roads act as partial firebreaks via negative p_veg and p_den.
- **Worked numbers** [I, notes 03 and 04]. V = 10: downwind ×1.57, upwind ×0.11. V = 5: downwind ×1.25, upwind ×0.34, so 3.7x.
- **Top-down** [I, note 03]. "Heat rises" should be screen-up. Give a small extra p toward y − 1 and drift smoke the same way. Slope only matters if the map has height levels.

*Cost / performance.* Eight multipliers per wind change, one multiply per roll [I].

*Games that used it.*
- Far Cry 2 fire blog: https://jflevesque.com/2012/12/06/far-cry-how-the-fire-burns-and-spreads/

*How it feels.* Fire with intent. Losing control to the wind is a feature, says the Far Cry 2 developer [V, S65].

*Risks.* Strong upwind suppression makes walls of fire that never back-burn. Clamp the upwind factor to about 0.1 [I].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 4 · Mood 4 · Interactivity 5

### D6. Rain, water and moisture

*In plain words.* Wet things burn slower and rain puts fire out. A bucket of water stops a tile; rain gives every burning tile a chance to die each tick and stops new tiles catching.

*How it works (technical).*
- **Minecraft** [V, S66]. Spread is blocked if rain falls on the target or its 4 neighbours. Rain puts fire out with 20% + 3% per age point per tick (20 to 65%).
- **Far Cry 2** [V, S65]. Humidity resists, recent rain must dry first, and water extinguishes only the submerged part.
- **Moisture as a factor** [V, S60; I, note 04]. The drone paper adds a moisture term p_m. Rain from study #3 can raise tile moisture and slow fire with no special case.
- **Proposal** [I]. Moisture byte 0 to 255. Rain adds +8 per tick to exposed tiles; sun dries −1. Ignition multiplies by `(1 − moisture/255)`. Burning tiles under rain roll `20% + 3% × age` to go out, then emit a steam puff (E1).

*Cost / performance.* One extra multiply per roll and one roll per burning tile while it rains [I].

*Games that used it.*
- RimWorld fire: https://rimworldwiki.com/wiki/Fire
- Rain study (firelight under rain): https://kingsfoil-artifacts.netlify.app/vfx-rain-topdown-pixel

*How it feels.* Weather that matters. Rain arriving over a grass fire is a small story [I].

*Risks.* If rain always wins, fire never threatens anything in a rainy zone. Keep a dry-season event that lowers moisture (Mewgenics-style weather) [I, note 05].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 4 · Mood 4 · Interactivity 5

### D7. Budgets, percolation and griefing limits

*In plain words.* A shared world needs a ceiling on fire. Give each fire a budget of tiles it may burn, keep towns and houses fireproof, and space fuel so one spark cannot cross the whole map.

*How it works (technical).*
- **Far Cry 2 points** [V, S64]. A Molotov gives a grass patch 60 "spreading points", each cell costs 8, so about 7 cells. Two Molotovs give 120, about 15 cells. Without the cap fire could burn the map, exhaust memory or drop the framerate.
- **Minecraft** [V, S66]. Since 1.21.5 fire stops when no player is within 8 chunks. 25w44a (1.21.11) replaced `doFireTick` with `fire_spread_radius_around_player`; 0 stops spread. Servers commonly disable spread [V, S69].
- **Griefing** [V, S70, S71]. DST players grief with fire staffs. Community servers broadcast every fire lit and allow vote kicks. A base burned with wildfires off. Mods lock gunpowder to members.
- **Percolation** [V, S57]. Site threshold on the square lattice is 0.592746 for 4 neighbours and about 0.407 for 8. Bond thresholds are 1/2 and 0.2504. Below the threshold a certain fire stays local; above it can cross the map.
- **Asterion rules** [I, note 06]. Spread only on natural tiles outside towns. Protection-zone tiles never ignite. Player houses never burn. Fire set by a player follows the same PvP rules as a direct attack. Ash regrows after a few minutes. Optional global and per-source budgets.

*Cost / performance.* The cap also caps server CPU [I, note 03].

*Games that used it.*
- Far Cry 2 interview: https://www.gamedeveloper.com/game-platforms/interview-how-i-far-cry-2-i-s-fire-fuels-spreads
- DST griefing thread: https://kleiforums.com/forums/topic/61624-wondering-which-kind-of-people-grief/

*How it feels.* Controlled chaos. Unlimited spread was "just not fun", in the Far Cry 2 programmer's words [V, S65].

*Risks.* A visible budget cut-off looks like an invisible wall. Make budgeted fire fade to embers at the edge instead of stopping dead [I].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 3 · Mood 2 · Interactivity 4

### D8. Determinism and networking

*In plain words.* Many players watch the same fire. Either the server sends every tile change, or it sends only "this tile caught fire at tick N" and every client works out the rest the same way. The second is much smaller but needs randomness every machine agrees on.

*How it works (technical).*
- **Payload** [I, note 03, measured]. A radius-100 front changed 800 to 1,900 tiles per tick. At 5 bytes per change (x, y, state) that is 4 to 9.5 KB per tick, too much at 5 Hz for many players.
- **Option 1** [I, note 03]. Send ignitions only as (tileIndex, tick). Clients derive burn-out from the fuel table, using a hashed per-tile burn time.
- **Option 2** [I, note 03]. Run the whole CA in lockstep from a seed. Seed with `hash(worldSeed, tileIndex, tick)` so order does not matter. Integer maths only (xorshift32, integer percent tables).
- **Lockstep** [V, S63]. Bandwidth scales with inputs, not objects. Bit-identical results need a fixed dt, and float determinism across platforms has "no silver bullet".
- **Recommendation** [I]. Server owns the grid and sends ignition and extinguish events per chunk; clients replay burn-down from the same hash. Flame phase, embers and smoke are client-only.

*Cost / performance.* Event encoding is about one event per newly burning tile, versus one diff per changed tile (§6e) [I].

*Games that used it.*
- Gaffer on Games, deterministic lockstep: https://gafferongames.com/post/deterministic_lockstep/
- TFS game.h (decay buckets): https://github.com/otland/forgottenserver/blob/1.4/src/game.h

*How it feels.* Every player sees the same fire, which is what makes it a shared event [I].

*Risks.* One float or one unordered iteration and clients drift. Keep a periodic full-state checksum per chunk [I].

*Ratings 1–5 (author judgement):* Simplicity 3 · Speed 5 · Pixel taste 3 · Mood 2 · Interactivity 4

### Family E: Smoke and steam fields

### E1. Advection-and-decay grid and the smoke CA

*In plain words.* Keep a small grid of smoke amounts, much coarser than the screen. Each tick, every cell pulls a little smoke from the cell upwind and below it, and everything fades slightly. Burning tiles pour smoke in. That is a smoke column that bends in the wind.

*How it works (technical).*
- **Measured** [I, note 03, measured]. At 320x180 in JS, Stam fluids with 20 iterations took 32.1 ms (7.2 ms with 4), density advection plus decay 0.31 ms, and the integer smoke CA 0.077 ms (3.9 ms in GDScript). At 64x64 the CA took 0.009 ms (0.28 ms in GDScript) and full Stam 1.82 ms (§6d).
- **The CA kernel** [I, note 03]. `d = (2*c + left + right + 3*below + 1*above) >> 3; d = max(d − 1, 0)`. Weighting the cell below makes smoke drift screen-up, and −1 per tick is linear decay.
- **Advection** [V, S49]. Semi-Lagrangian. Trace each cell centre back through the velocity, bilinearly sample. For a pixel game use a fixed wind plus an upward term, no pressure solve [I, note 03].
- **Sources** [I, note 03]. Each burning tile adds about +40 per tick. An extinguished tile adds one big puff of steam on a white ramp. Embers add a little for N ticks.

*Cost / performance.* At 80x45 the CA is a few thousand byte operations per tick. GDScript at 64x64 took 0.28 ms, so 80x45 should be about 0.3 ms [I, note 03].

*Games that used it.*
- Stam's paper (the advection step): https://www.dgp.toronto.edu/public_user/stam/reality/Research/pdf/GDC03.pdf

*How it feels.* A real column that leans downwind, thins and fades. At 4x4 px cells it looks chunky in the right way [I].

*Risks.* GDScript is 30 to 50x slower than V8 on these loops, so keep per-cell sims at or under 128x128 in GDScript, or move them to a shader [I, note 03, measured].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 4 · Mood 4 · Interactivity 3

### E2. Brogue gas volumes and DCSS clouds

*In plain words.* Each tile holds an integer amount of gas. Each update a tile becomes the average of itself and its open neighbours, so gas flows down corridors, and it loses a unit now and then. DCSS goes simpler still. A cloud is a tile with a countdown that sometimes copies itself next door.

*How it works (technical).*
- **Brogue `updateVolumetricMedia`** [V, S88]. Average volume over the cell and its 8 non-blocking neighbours, `sum / numSpaces`, with the remainder rounded up by a random roll. Walls shrink the divisor, so gas "pushes" along corridors.
- Dissipation applies only to cells that had gas. "Dissipates quickly" loses 1 with 50% chance per update; "dissipates" with 20% [V, S88].
- Gas runs twice per environment update, and only if any gas exists. Burning gas sets its volume to 0, which is how methane explodes [V, S88].
- **DCSS `_spread_cloud`** [V, S91]. Spread chance per neighbour is 80% if decay > 30, 50% if > 20, else 30%. The new cloud gets decay/2 + 1, and the parent gains 8 decay per spread.
- **DCSS rules** [V, S92]. Clouds dissipate over time. A same-type cloud overwrites one with less time left. Steam forms when fire magic crosses water, ice crosses lava, or water touches lava. Fire next to water makes steam with chance 1 in 14 (decay 2 to 6) [V, S91].

*Cost / performance.* 9 reads per gassy cell, integer only, skipped when there is no gas [V, S88; I].

*Games that used it.*
- Brogue CE: https://github.com/tmewett/BrogueCE
- DCSS clouds: https://crawl.chaosforge.org/Cloud

*How it feels.* Gas that behaves like gas in a dungeon, filling rooms and leaking through doors [I].

*Risks.* Both are copyleft (AGPL, GPL), so copy the rules, not the code [V, S88, S90].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 4 · Mood 3 · Interactivity 5

### E3. Stam stable fluids and GPU fluid demos

*In plain words.* The real thing. Smoke pushed by a velocity field that swirls and conserves mass. It looks wonderful and costs far too much for a pixel game on the web, except as one small hero effect.

*How it works (technical).*
- **Stam 2003** [V, S49]. `(N+2)²` arrays with a border ring, 6 float arrays. Steps add_source, diffuse, advect, project. Diffuse and project use 20 Gauss-Seidel iterations. Naive explicit diffusion oscillates "and finally diverge[s]"; the implicit one is stable for any dt.
- **Patent** [V, S50]. US 6,266,071 B1; Google Patents lists it "Expired - Lifetime" (not legal advice).
- **WebGL fluid** [V, S137]. PavelDoGreat's MIT WebGL fluid runs advection, pressure and curl in many render passes; too heavy for 320x180 on mobile, but the shader structure ports to a ping-pong buffer [I, note 07].
- **Ignitement** (Unity) [V, S83]. A fragment-shader fluid at 1024² density, chosen over compute for compatibility, with a downsampled copy read back to the CPU for a burning debuff. Cost was described only as about "a few post-processing effects".

*Cost / performance.* Grid-squared times iterations. Only a fixed 64x64 hero effect is affordable in JS (0.45 ms at 4 iterations) [I, note 03].

*Games that used it.*
- PavelDoGreat WebGL fluid: https://github.com/PavelDoGreat/WebGL-Fluid-Simulation
- Ignitement breakdown: https://unity.com/blog/real-time-fluid-simulation-fire-vfx-ignitement-breakdown

*How it feels.* Beautiful swirls that look HD on top of pixel tiles [I].

*Risks.* Cost, float determinism, and a smooth look that fights pixel art [I].

*Ratings 1–5 (author judgement):* Simplicity 2 · Speed 2 · Pixel taste 2 · Mood 4 · Interactivity 3

### E4. Curl noise drift for smoke puffs

*In plain words.* Moving puffs with plain random noise makes them clump into little sinks. Take the "curl" of a noise field instead and the puffs swirl around each other without bunching up.

*How it works (technical).*
- **Bridson, Hourihan and Nordenstam 2007** [V, S48]. In 2D the velocity is the curl of a scalar stream function, `v = (dψ/dy, −dψ/dx)`, so it is divergence-free. Plain noise velocity has "sinks" where particles pile up. Ramp ψ to 0 near solids to respect walls.
- **Cost** [I, note 03]. One noise lookup for ψ and two more for finite differences. 200 puffs is about 600 noise calls per frame.
- **Pixel rule** [I, note 03]. Snap puff positions to whole pixels and draw 1 to 3 px puffs with a dithered alpha ramp.

*Cost / performance.* About 3 noise samples per puff per frame [I, note 03].

*Games that used it.*
- Curl-noise paper: https://www.dneg.com/wp-content/uploads/2022/11/2007.pdf
- No pixel-art game in our notes documents curl-noise smoke (a gap in note 03).

*How it feels.* Lazy, natural swirls in a hero smoke column [I].

*Risks.* Overkill for chimneys, where Stardew's constant acceleration already looks right (C2) [I].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 4 · Pixel taste 4 · Mood 4 · Interactivity 2

### E5. Smoke colour as state, and smoke that blocks sight

*In plain words.* Smoke tells you what is burning and how it is going. White means water or fresh fuel, grey a steady or dying fire, black oil or a building. Thick smoke can also hide things, which makes it a tool in combat.

*How it works (technical).*
- **Firefighters** [V, S54]. Almost all solids give white smoke when first heated, and that white is moisture. Brown often means untreated wood. Grey can mean the fire is slowing. Black often means synthetics. Colour-to-fuel holds only for single-fuel fires, and firefighters judge volume, velocity, density and colour together.
- **Game mapping** [I, note 04]. Fresh ignition pale, steady wood brown-grey, dying thin grey, oil or cursed building black, water on fire a white steam burst.
- **Into the Breach** [V, S111, S112]. Damaged sand becomes smoke. Units in smoke cannot attack or repair. Rusting Hulks turn smoke electric [V, S113].
- **DCSS** [V, S92]. Line of sight stops after 2 opaque cloud tiles. Steam and coloured smokes are opaque.
- **Proposal** [I, note 03]. Server thresholds its smoke byte (> 128 = opaque) per tile and counts opaque tiles along the Bresenham line; stop sight at 2.

*Cost / performance.* A tint per puff; a line walk per sight check [I].

*Games that used it.*
- Into the Breach smoke: https://www.gamepressure.com/into-the-breach/combat/z1aa78
- DCSS clouds: https://crawl.chaosforge.org/Cloud

*How it feels.* Smoke stops being decoration. A black column says "the barn is going", white steam says "you won" [I].

*Risks.* Sight-blocking smoke must be simulated on the server, or players with different smoke see different things [I, note 03].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 4 · Mood 4 · Interactivity 5

### Family F: Combat fire

### F1. Fire fields as decaying tile items, and the stacking rule

*In plain words.* A magic fire on the ground is just an item on a tile that changes to a weaker item on a timer and finally disappears. Stepping on it hurts once and sets you burning. When fields overlap, only the strongest one should count.

*How it works (technical).*
- **TFS (OpenTibia server)** [V, S96]. Decay chain 1487 → 1488 → 1489 → gone, each stage `duration 120` s. 1487 has `initdamage 20, ticks 10000, count 7, damage 10`; 1488 the same without initdamage; 1489 is harmless. Energy field `initdamage 30, damage 25`; poison gas `ticks 5000, start 5, damage 100`; campfire `initdamage 20, ticks 4000, count 2, damage 10`; magic wall 20 s.
- **TibiaWiki** [V, S93, S95]. Stepping on a field deals 20 plus "10 fire damage over 7 turns, every 9 seconds", 90 in about a minute. Stages last 3:20, 2:28 and 1:38; damage lasts 5:48 (stages 1 + 2). The last stage "does not block a monster" [V, S94].
- **Path of Exile** [V, S107]. Burning ground is separate from the ignite status. Base 4 s; only the highest-DPS effect of each type ticks (snippets).
- **Asterion** [I, notes 01 and 06]. Copy the decay chain, read strength as sprite size (big, medium, small), draw a scorched ring at the tile edge, keep each field inside its tile, never share hue between friendly and hostile hazards, and apply the strongest-only rule per tile.

*Cost / performance.* One item swap per stage per tile on the server, one network message per stage [I, note 01].

*Games that used it.*
- Tibia Fire Field Rune: https://tibia.fandom.com/wiki/Fire_Field_Rune

*How it feels.* Tactical and readable. A harmless last stage warns players before the tile clears [I, note 01].

*Risks.* Diablo's 20 Hz hits and stacking are a networking and balance trap. Tibia's 9 to 10 s ticks are cheap and easy to read [I, note 01].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 5 · Mood 4 · Interactivity 5

### F2. Burning status: tint, overlay and ticks

*In plain words.* A burning creature shows small flames on its body, flashes red when it takes damage, and loses a little health on a steady beat. Water puts it out. The simplest good rule is "take damage equal to your stacks, then lose a stack".

*How it works (technical).*
- **Terraria On Fire!** [V, S80]. 4 HP/s "shown as 1 damage every 0.25 seconds", blocks regeneration, emits fire particles and a little light. Any liquid except lava removes it. 1.4.4 added a stronger Hellfire tier, a two-tier burn worth copying.
- **Enter the Gungeon** [V, S104]. Enemies mostly 4 DPS for 4 s, "normally tinted red" with flames on the sprite. The player uses a meter that fills in fire, drains on a dodge roll and deals one hit when full. Green fire is 4 DPS for 120 s, "functionally infinite". Burning enemies ignite goop under them.
- **Mewgenics** [V, S103]. "Takes {stacks} damage at start of its turn, then decrease Burn by 1." Ignores shields. Stack decay pauses while standing on fire. Water, Wet, Freeze or a Remover clear it. Burning units ignite tiles they walk over.
- **Visual floor** [I, notes 06 and 09]. A red multiply tint (one uniform), 2 or 3 flame sprites of 8x8 at random body offsets animating at 8 to 12 fps, a damage number per server tick, and embers at 8 to 15 per second.
- **Network** [I, note 09]. Send one "burning until tick N" flag per creature; clients run tint, overlay and particles. Terraria's 0.25 s ticks are too chatty for floating numbers.

*Cost / performance.* One integer per creature per tick on the server [V, S103; I].

*Games that used it.*
- Terraria On Fire!: https://terraria.wiki.gg/wiki/On_Fire!
- Enter the Gungeon status effects: https://enterthegungeon.wiki.gg/wiki/Status_Effects

*How it feels.* Urgent. A burning sprite with a steady drip of numbers makes players run for water, which is the point [I].

*Risks.* Ally fire that looks like enemy fire, and tick numbers that flood the screen in a group fight [V, S108; I].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 4 · Mood 4 · Interactivity 5

### F3. Fireball and explosion anatomy

*In plain words.* A fireball is a small looping head with a trail. When it hits there is one white frame, a fast burst that slows down, a ring, and grey smoke that rises and breaks up. A tiny pause and a pixel or two of shake sell the hit.

*How it works (technical).*
- **Slynyrd Pixelblog 31** [V, S35]. Start with circles that become thinner rings as they expand. Colour goes white-hot, warm, grey smoke. Expansion is "rapid at first" then "slows significantly". Rings can become a shockwave. Blobs rise and fade into smoke.
- **Hitstop and shake** [V, S39, S40, S41]. Street Fighter 2 freezes both fighters for about 10 frames. Smash scales hitlag with damage. Freeze both attacker and target. Count in 1/60 s units [V, S42].
- **Shake amounts** [U, S43]. Light 1 to 2 px over 100 ms, heavy 4 to 8 px over 250 ms, Nuclear Throne 8 px on death (secondary, unverified).
- **10 fps frame plan** [I, notes 06 and 09]. Frame 1 white flash; 2 to 4 fast yellow-orange growth; 5 to 7 slower growth with dark edges eating in; 8 to 12 grey puffs rising and dithering out. Ring on 2 to 5. 2 to 6 debris pixels with gravity. Then a scorch decal fading over a few seconds.
- **At 320x180** [I, note 06]. Light shake 1 px, heavy 2 to 4 px, snapped to whole pixels. In an MMO, shake only for hits on you or blasts you cast.

*Cost / performance.* One sprite per stage plus a handful of particles [I].

*Games that used it.*
- Slynyrd explosion construction: https://www.slynyrd.com/blog/2020/12/14/pixelblog-31-shmup-sprite-design
- Vlambeer, The Art of Screenshake: https://www.youtube.com/watch?v=AJdEqssNZ-U

*How it feels.* Punchy. The white frame and the slow tail do most of the work [I].

*Risks.* Flat explosions repeat the same bright pixels every frame [V, S32]. Rotated fireball sprites make mixels; use round heads or 8 drawn directions [I, note 06].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 4 · Pixel taste 5 · Mood 5 · Interactivity 4

### F4. Flamethrowers, fire trails and burning oil

*In plain words.* A flamethrower is not one long sprite. It is a fast stream of short-lived flame blobs that grow, spin and fade. Fire trails are copies of the head left behind. Oil on the ground turns any spark into a running fire.

*How it works (technical).*
- **Terraria Flamethrower** [V, S81]. Damage 35, useTime 6 and useAnimation 30, so 5 bursts per use. Velocity 21. Pierces 3 targets with 15% falloff. Inflicts Hellfire 20 s. The projectile "expands as it travels, forming a cone, then dissipates", and spins. Water, honey and shimmer stop it.
- **Gungeon oil** [V, S105]. Lit oil "quickly spreads throughout the goop pool". Napalm ignites almost at once. Oil never ignites on its own.
- **Recipe** [I, note 09]. Spawn a flame every 0.1 s, life 0.4 to 0.6 s, scale 0.5 to 2.0, ramp white to dark grey, random rotation. That is about 5 live sprites per flamer. Stop on water tiles.
- **Trails ranked by cost** [I, note 09]. Stretched sprite (one draw, smears), afterimages (3 to 4 draws, crisp and retro), particles (20 to 40 per second, free angles).

*Cost / performance.* About 5 sprites per flamer and 6 to 24 trail sprites per fireball [I, note 09].

*Games that used it.*
- Terraria Flamethrower: https://terraria.wiki.gg/wiki/Flamethrower
- Enter the Gungeon goop: https://enterthegungeon.wiki.gg/wiki/Goop

*How it feels.* Dangerous and physical. Oil plus a flamer is the classic "oh no" moment [I].

*Risks.* Stream sprites that rotate create mixels. Use symmetrical blobs [I, note 06].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 4 · Pixel taste 4 · Mood 4 · Interactivity 4

### Family G: Lava, haze, glow and interactions

### G1. Lava: crust, glow, flow and damage

*In plain words.* Lava is slow fire in a liquid. It glows, it moves sluggishly, dark crust plates drift on top, it pops now and then, and it kills.

*How it works (technical).*
- **Minecraft** [V, S68]. Spreads one block per 30 ticks over 3 blocks in the Overworld, one per 10 over 7 in the Nether. Light level 15. Ignites flammables nearby. 4 HP per tick on contact plus the 15 s fire timer. Pops with bubble particles. Rain on lava makes black ember particles more often.
- **Shaders** [V, S134, S135]. A nimitz Shadertoy port uses 6-iteration warped noise but inherits CC BY-NC-SA 3.0. A CC0 one by miwls scrolls noise at (0.30, 0.15), wobbles UVs and uses three colours (1, 0.133, 0), (1, 0.467, 0), (1, 0.933, 0).
- **Crust design** [I, note 09]. Two noise reads. Slow, low-frequency noise > 0.55 draws crust in 2 dark entries; faster noise fills cracks with 3 or 4 hot entries. Let the threshold breathe with `sin(t × 0.3)`. Quantise `floor(v × N) / N` and snap UVs to the 320x180 grid.

*Cost / performance.* Palette cycling is free. A crust shader is 2 noise reads per lava pixel [I, note 09].

*Games that used it.*
- Minecraft lava: https://minecraft.wiki/w/Lava
- Terraria lava: https://terraria.wiki.gg/wiki/Lava

*How it feels.* Menace with a slow pulse. Crust plates make it feel heavy, not watery [I].

*Risks.* Smooth noise lava looks like an HD shader on crisp tiles unless it is quantised [I, note 09]. Several lava shaders are non-commercial [V, S134].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 4 · Pixel taste 4 · Mood 5 · Interactivity 3

### G2. Element interaction tables: lava + water = rock + steam

*In plain words.* Keep a small table that says what happens when two things meet. Fire plus water gives steam. Lava plus water gives rock and steam. Fire plus oil gives a bigger fire. Tiles never change each other directly, only through these elements.

*How it works (technical).*
- **BotW "chemistry engine"** [V, S73, S74]. Elements (fire, water, ice, electricity, wind) have no fixed state; materials do. Elements change materials, elements change each other, materials cannot change each other.
- **DOS2** [V, S75]. Fire applies Burning and removes Wet. Water or Ice on fire removes it and makes Smoke. Fire on Water makes Steam. Fire on Poison explodes. Fire ignites Oil. Cursed fire is Necrofire that water cannot put out.
- **Lava + water** [V, S68, S82, S79]. Minecraft makes stone, cobblestone or obsidian with a fizz and smoke. Terraria makes obsidian (and honey gives Crispy Honey). Noita makes mossy rock and steam; lava plus blood makes volcanic rock and steam.
- **For Asterion** [I, notes 02, 04, 09]. A server table of (tile, element) → (new tile, effect id). On lava plus water, swap to rock; client spawns a 1 to 2 s steam puff and a hiss. Steam and smoke are short-lived overlays.

*Cost / performance.* One table lookup per interaction [I, note 02].

*Games that used it.*
- BotW chemistry talk report: https://www.thumbsticks.com/gdc-17-breath-of-the-wild-science-lies
- Divinity: Original Sin 2 combinations: https://www.gamepressure.com/originalsinii/environmental-effects-and-combinations/zea274

*How it feels.* Systemic play. Players invent tricks the designers never scripted [I].

*Risks.* Every new element multiplies table rows. Players argue fire is overused in BG3 [V, S76]. Keep the element count small [I].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 4 · Mood 4 · Interactivity 5

### G3. Heat haze: sine row offsets, and the Compatibility traps

*In plain words.* Above a big fire the air wobbles. Old consoles faked that by sliding each scanline left or right by a sine wave. Do the same over the area above the fire, but move whole pixels only.

*How it works (technical).*
- **SNES HDMA** [V, S24, S25]. HDMA writes a horizontal offset per scanline from a precomputed sine table; one table per amplitude, 7 × 1,006 = 7,042 bytes of ROM. Repeat entries cover at most 127 lines. A register wiki names fire as the use of vertical waves [V, S26].
- **Dracula X fire** (forum reconstruction) [V, S27]. The building layer wobbles left-right, the fire layer up-down. Mix amplitudes over time and y so the motion never sits flat. A working guess: `y = i + 8·cos(0.5s + 8π·pct)`, `x = 3·cos(s + 8π·pct)` with `s = frame/8`.
- **Open bugs on 10 Nov 2026** [V, S121]. #106787 screen reads ignore nearest filtering in Compatibility; #97943 textureLod bias fails on web; #94863 colour mismatch; #79914 pink grid lines. #91717 (blur broken on WebGL 2) was fixed for 4.5 [V, S120]. A forum user saw distorted screen reads in Compatibility while sampling TEXTURE worked [V, S122].
- **Recipe** [I, notes 08 and 09]. `offset_x(row) = round(A · sin(row·0.5 + t·6) · falloff(row))`, A = 1 px at 320x180. Offset the fire sprite's own TEXTURE UVs, or a SubViewport's texture by whole low-res pixels. Avoid SCREEN_TEXTURE.

*Cost / performance.* One sine per row, or one lookup in a 180-entry table [I, note 08].

*Games that used it.*
- Dracula X fire thread: https://nesdev.nes.science/f12/t17484.xhtml
- Twinkle Tale and Ranger-X line scroll: https://rasterscroll.com/?p=333

*How it feels.* Heat you can see. One pixel of wobble is enough at 320x180 [I].

*Risks.* Linear filtering from bug #106787 blurs pixel art. Sub-pixel offsets shimmer [V, S121; I].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 4 · Pixel taste 3 · Mood 4 · Interactivity 1

### G4. Fire glow from the fire grid

*In plain words.* A burning area should light its surroundings. Blur the grid of burning tiles into a soft warm light map and add it to the scene, with a little flicker. Study #5 has the light model; this profile just feeds it from the fire.

*How it works (technical).*
- **Block-sum glow** [V, S3]. Study #2's glow is a block-sum blur plus palette select, which keeps colours in palette.
- **Tibia model** [V, S6]. One texel per tile, max-blended, then multiplied over the map. Tibia campfire radius 7, lava 4 with colour (255,102,51).
- **Flicker** [V, S6]. Quake-style strings at 10 Hz, DOOM's 8.75 Hz fire flicker, and the 10 to 12 Hz bundle rule.
- **Proposal** [I]. Per cluster of burning tiles, one glow stamp with radius from cluster size (3 + √n tiles), colour from the fire ramp, intensity × flicker. Max-blend, not add, so a burning village never blows out.

*Cost / performance.* One stamp per cluster at low resolution, or one blur of a 40 x 22 texture [I].

*Games that used it.*
- Light study (Tibia light, flicker): https://kingsfoil-artifacts.netlify.app/vfx-light-topdown-pixel
- Acid study (block-sum glow): https://kingsfoil-artifacts.netlify.app/vfx-acid-topdown-pixel

*How it feels.* The difference between a fire and a picture of a fire, especially at night [I].

*Risks.* Additive glows saturate to white and wash out the palette [I, note 06].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 4 · Mood 5 · Interactivity 2

### Family H: Frontier

### H1. DrawableTexture2D: GPU fire and smoke buffers in Godot 4.7

*In plain words.* Godot 4.7 lets you draw straight into a texture with your own small shader. That is the clean way to run a DOOM fire or a smoke grid on the GPU without setting up extra viewports.

*How it works (technical).*
- **API** [V, S128]. `setup(w, h, format, fill)`, `blit_rect(rect, source, modulate, mipmap, material)`, and `blit_rect_multi` with up to 4 sources and 4 targets of equal size. Formats RGBA8, RGBA8 sRGB, RGBAH, RGBAF. Marked experimental.
- **Blit shaders** [V, S129]. `shader_type texture_blit;`, outputs `COLOR0` to `COLOR3`, extra inputs via `hint_blit_source1..3`, blend modes mix, add, sub, mul, disabled. No premultiplied alpha.
- **Compatibility** [V, S130]. The merge diff adds a GLES3 `tex_blit.glsl`, so a Compatibility path exists. Web support is not stated and was not tested [U].

*Cost / performance.* One blit per buffer per tick [I, note 05].

*Games that used it.*
- None documented. Docs: https://docs.godotengine.org/en/latest/tutorials/rendering/drawable_textures.html
- GodotCon talk: https://talks.godotengine.org/godotcon-ams-2026/talk/NSNXFT/

*How it feels.* Same as A1 and E1, with the CPU free [I].

*Risks.* Experimental API, untested on web. Keep authoritative fire on the CPU; use the GPU only for cosmetic buffers [I, note 05].

*Ratings 1–5 (author judgement):* Simplicity 3 · Speed 4 · Pixel taste 4 · Mood 4 · Interactivity 3

### H2. Falling-sand pixel fire (Noita and friends)

*In plain words.* Every pixel is a material that can burn, flow or rise. Fire eats wood pixel by pixel, smoke and steam float up, oil splashes. It is the most impressive fire there is and the most expensive.

*How it works (technical).*
- **Noita** [V, S77]. 64x64 chunks with dirty rects, bottom-up updates, four checkerboard rounds so threads never overlap (each chunk may write 32 px into neighbours). Gases are inverted liquids. Noita 1.0 shipped on 15 Oct 2020 [V, S78].
- **Sandspiel** [V, S136]. `update_fire` loses `2 + rand_dir` of its life byte each tick, pushes upward wind (`dy: 150`), and turns neighbouring gas or dust into fire with `ra = 150 + (dx + dy) × 10`. MIT, Rust and WebGL.
- **Pixel-perfect fire physics** [V, S85]. Temperature, fuel and lifetime per cell packed into a texture (R heat, G type, B fuel) for a canvas shader. The first version ran at 5 FPS and needed chunks, dirty rects and a coarser grid.

*Cost / performance.* Per pixel, every frame, which is why Noita needs chunks and threads [V, S77].

*Games that used it.*
- Noita GDC talk video: https://www.youtube.com/watch?v=prXuyMCgbTc
- Sandspiel: https://sandspiel.club

*How it feels.* Magical. Everything reacts [I].

*Risks.* Per-pixel simulation cannot be server-authoritative for many players, and web export loses threads and GDExtension [I, note 05].

*Ratings 1–5 (author judgement):* Simplicity 2 · Speed 2 · Pixel taste 5 · Mood 5 · Interactivity 5

### H3. WebGPU fluids, radiance cascades and neural fire

*In plain words.* The newest research makes fire and its light physically real. None of it runs in a Godot web build today.

*How it works (technical).*
- **WebGPU** [V, S132]. Ships in Safari 26, Firefox 141 on Windows and 145 on Apple Silicon, and Chrome Android 121+. Godot's web export still uses WebGL 2 only [V, S126].
- **luma.gl** [V, S142]. An experimental WebGPU dense-grid fire and smoke solver with velocity, pressure, fuel, heat and smoke at fixed 1/60 s steps.
- **Radiance cascades** [V, S140]. Holographic RC (May 2025) claims results "visually indistinguishable" from a 2D reference. A Godot port exists without web support [V, S141].
- **FieryGS** (ICLR 2026) [V, S143]. Gaussian splatting plus volumetric combustion; one summary reports 2.37 s per frame [U].

*Cost / performance.* Many full-screen passes or compute shaders, not available on Compatibility [I, note 05].

*Games that used it.*
- luma.gl fire solver: https://luma.gl/docs/api-reference/experimental/volumetric-fire-simulation
- Blastronaut 2D ray tracing talk: https://app.media.ccc.de/v/godotfest2025-raytracing-is-simple-for-2d-games/audio

*How it feels.* Gorgeous and physical, not pixel art [I].

*Risks.* Not shippable on the target stack. Revisit when Godot exports to WebGPU [I, note 05].

*Ratings 1–5 (author judgement):* Simplicity 1 · Speed 1 · Pixel taste 2 · Mood 5 · Interactivity 3

### H4. AI sprite tools for flame and explosion loops

*In plain words.* Generators can now draft a pixel flame loop or an explosion sheet from a prompt in a fixed palette. An artist still has to clean it up.

*How it works (technical).*
- **Retro Diffusion** [V, vendor, S144]. An animation model on Replicate since 19 Nov 2025 for "low framerate" pixel sprites, with a VFX style at 24 to 96 px, GIF or sheet output, and an input palette. Price per run not found.
- **PixelLab** [V, secondary, S145]. A tutorial drafts fireballs and spell sheets from prompts like "pulsing flames, trailing embers", then animates them in other tools.
- **Cost** [I, note 05]. Zero at runtime; the output is an ordinary sheet. The real cost is fixing palette drift, frame-to-frame jitter and loop seams.
- **Fit** [I, note 05]. A palette-locked draft at 32x32 or 48x48 is a fast start for 6 to 8 frame campfire and torch loops. It will not replace a DOOM buffer for spreading fire.

*Cost / performance.* Vendor time at authoring, nothing in the game [I].

*Games that used it.*
- Retro Diffusion on Replicate: https://replicate.com/blog/retro-diffusions-pixel-art-models-are-now-on-replicate
- PixelLab VFX tutorial summary: https://sozai.app/transcript/make-animated-pixel-art-vfx-pixellab/

*How it feels.* Depends entirely on the cleanup [I].

*Risks.* Inconsistent frames and off-palette pixels. Licence terms of generated output need checking per vendor [I].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 3 · Mood 3 · Interactivity 1

---

## 5. Comparison scorecard

All ratings are author judgement for top-down pixel art on web Godot. "Sum" is a crude total, not a recommendation. A low-sum technique such as D8 can still be mandatory for an MMO.

| # | Technique | Simpl. | Speed | Pixel taste | Mood | Interact. | Sum |
|---|---|---|---|---|---|---|---|
| A1 | DOOM PSX fire | 5 | 5 | 5 | 4 | 3 | 22 |
| A2 | Blur-and-cool fires (Parusel, Lode, minfire) | 4 | 4 | 3 | 4 | 2 | 17 |
| A3 | Hugo Elias cooling map | 4 | 4 | 4 | 5 | 3 | 20 |
| A4 | Age-table fire, Monte Carlo updates | 5 | 5 | 5 | 3 | 2 | 20 |
| A5 | Attribute-cell fire, 8x8 heat | 5 | 5 | 4 | 3 | 4 | 21 |
| B1 | Hand-drawn flame loops | 4 | 5 | 5 | 5 | 2 | 21 |
| B2 | Size sets loop speed | 5 | 5 | 4 | 5 | 2 | 21 |
| B3 | Fire ramps, hue shift, glow bands | 5 | 5 | 5 | 4 | 1 | 20 |
| B4 | Palette cycling fire and lava | 5 | 5 | 5 | 3 | 1 | 19 |
| B5 | Tile-seeded desync, Stardew torch | 5 | 5 | 5 | 4 | 2 | 21 |
| C1 | Ember and spark pool | 5 | 5 | 5 | 4 | 2 | 21 |
| C2 | Stardew smoke puffs | 5 | 5 | 4 | 5 | 2 | 21 |
| C3 | Dithered transparency | 5 | 5 | 5 | 3 | 1 | 19 |
| C4 | Godot particles on the web | 3 | 3 | 3 | 4 | 2 | 15 |
| D1 | Tile burn states | 5 | 5 | 4 | 4 | 5 | 23 |
| D2 | Ignition chance, round fronts, burn time | 4 | 5 | 4 | 4 | 5 | 22 |
| D3 | Fuel tables | 5 | 5 | 4 | 3 | 5 | 22 |
| D4 | Active list, coarse tick | 4 | 5 | 3 | 2 | 4 | 18 |
| D5 | Wind and slope | 4 | 5 | 4 | 4 | 5 | 22 |
| D6 | Rain, water, moisture | 4 | 5 | 4 | 4 | 5 | 22 |
| D7 | Budgets, percolation, griefing limits | 4 | 5 | 3 | 2 | 4 | 18 |
| D8 | Determinism and networking | 3 | 5 | 3 | 2 | 4 | 17 |
| E1 | Advection-decay grid, smoke CA | 4 | 5 | 4 | 4 | 3 | 20 |
| E2 | Brogue gas, DCSS clouds | 4 | 5 | 4 | 3 | 5 | 21 |
| E3 | Stam fluids, GPU fluids | 2 | 2 | 2 | 4 | 3 | 13 |
| E4 | Curl noise drift | 4 | 4 | 4 | 4 | 2 | 18 |
| E5 | Smoke colour as state, sight blocking | 5 | 5 | 4 | 4 | 5 | 23 |
| F1 | Fire fields as decaying items | 5 | 5 | 5 | 4 | 5 | 24 |
| F2 | Burning status | 5 | 5 | 4 | 4 | 5 | 23 |
| F3 | Fireball and explosion anatomy | 4 | 4 | 5 | 5 | 4 | 22 |
| F4 | Flamethrowers, trails, oil | 4 | 4 | 4 | 4 | 4 | 20 |
| G1 | Lava: crust, glow, damage | 4 | 4 | 4 | 5 | 3 | 20 |
| G2 | Element interaction tables | 4 | 5 | 4 | 4 | 5 | 22 |
| G3 | Heat haze row offsets | 4 | 4 | 3 | 4 | 1 | 16 |
| G4 | Fire glow from the fire grid | 4 | 5 | 4 | 5 | 2 | 20 |
| H1 | DrawableTexture2D buffers | 3 | 4 | 4 | 4 | 3 | 18 |
| H2 | Falling-sand pixel fire | 2 | 2 | 5 | 5 | 5 | 19 |
| H3 | WebGPU fluids, RC, neural fire | 1 | 1 | 2 | 5 | 3 | 12 |
| H4 | AI sprite tools | 4 | 5 | 3 | 3 | 1 | 16 |

**Reading the table.** Tile rules win. Fire fields (F1), burn states (D1), burn status (F2) and smoke-as-state (E5) score highest because they are cheap, readable and change gameplay. Among the looks, the DOOM fire (A1) is the best simulated flame and drawn loops with tile-seeded phase (B1, B5) are the best sprites. The physically based options (E3, H2, H3) score lowest on web speed and simplicity, and they are the ones to skip [I].

---

## 6. Deep dives

### 6a. Flame loops by fire size

Puff frequency from `f = 1.5 / sqrt(D)` [V, S51]; the D values and frame counts are our art-direction choices [I, note 04]. Frame counts and rates from artist sources are cited per row.

| Fire | Width D | Puff f | Loop | Smoke |
|---|---|---|---|---|
| Candle | 0.01 m | 15 Hz | 2 to 3 frames, or one sprite with per-frame jitter | Thin wisp, 1 px |
| Torch | 0.05 m | 6.7 Hz | 4 frames at 10 to 12 fps; Stardew 4 × 100 ms, 12x11 px [V, S114] | Light grey, rare |
| Brazier | 0.2 m | 3.4 Hz | 4 to 6 frames at 10 fps, or one sprite with row-offset licks (G3) | Grey puffs |
| Campfire | 0.5 m | 2.1 Hz | 6 frames at 10 fps; packs use 6 to 10 [V, S31] | Grey-brown column, Stardew puffs |
| Bonfire | 1 m | 1.5 Hz | 8 frames at 10 fps; 48x48 pack uses 10 frames at 100 ms [V, S30] | Brown-grey column |
| Burning house | 3 m | 0.87 Hz | 8 to 12 frames at 8 to 10 fps, or 4 frames at half speed and double size | Heavy dark smoke [V, S28] |
| Wildfire front | 10 m | 0.47 Hz | Per-tile loops, phase from `hash(x, y)` | Wide grey band downwind |
| Fire field (Tibia) | 1 tile | n/a | Big, medium, small sprite per stage [I, note 01] | Thin wisp per stage |
| Lava pool | n/a | n/a | Palette cycle (B4) or crust shader (G1) | Black embers in rain [V, S68] |
| Fireball head | 8 to 12 px | n/a | 3 to 4 frames at 10 to 12 fps [I, note 09] | Impact puff, then scorch |

### 6b. Material table for spreading fire

Proposed values for Asterion are [I]; reference numbers are cited. Ignite chance is per tick per burning cardinal neighbour at moisture 0 and no wind; diagonals × 0.7. Burn ticks are at a 4 Hz server tick.

| Material | Ignite chance | Burn ticks | Reference numbers | Smoke | Leaves behind |
|---|---|---|---|---|---|
| Green grass | 0.15 | 3 | Brogue grass 15% [V, S89]; Minecraft grass 60/100 [V, S66] | Pale, then grey | Ash, regrows |
| Dry grass | 0.40 | 2 | Brogue dead grass 40% [V, S89] | Grey | Ash, regrows |
| Hay | 0.50 | 4 | Brogue hay 50%; Minecraft hay 60/20 [V, S89, S66] | Grey-brown | Ash |
| Dead brush | 0.80 | 3 | Brogue dead foliage 80% [V, S89] | Grey | Ash |
| Tree | 0.25 | 12 | DCSS 1 in 20 per turn, decay 25 to 54 [V, S91]; Minecraft logs 5/5, leaves 30/60 [V, S66]; Sigil of Kings 20% [V, S84] | Brown-grey column | Charred stump |
| Wood wall | 0.15 | 20 | Minecraft planks 5/20 [V, S66]; Brogue door 50%, barricade 100% [V, S89] | Dark grey | Embers, then rubble |
| Oil | 1.00 | 6 | Brogue gases 100% [V, S89]; Gungeon oil spreads through the pool [V, S105] | Black | Scorch |
| Stone, road | 0 | 0 | Alexandridis roads × 0.2 to 0.6 as partial breaks [V, S58] | none | unchanged |
| Water | 0 | 0 | Far Cry 2 disables cells under water [V, S64] | White steam next to fire; DCSS 1 in 14 [V, S91] | unchanged |
| Lava | ignites neighbours | never ends | Minecraft lava ignites flammables [V, S68]; Noita rates 80 and 8 [V, S79] | Black embers in rain [V, S68] | Rock if water touches it |
| Ash | 0 | 0 | Brogue embers to ash 300/10,000 [V, S89] | Thin wisp for a few ticks | Regrows to grass after minutes [I, note 06] |

### 6c. Combat fire numbers across games

| Game | Effect | Damage | Tick | Duration | Area | Removed by |
|---|---|---|---|---|---|---|
| Tibia (TibiaWiki) | Fire field + Burning | 20 on entry, then 10 × 7 | 9 s | Stages 3:20, 2:28, 1:38 | 1 tile, 3x3 bomb, 1x5 wall | Temple heal, Cure Burning, swimming [V, S93, S95] |
| Tibia (TFS 1.4) | Fire field 1487 | 20 + 7 × 10 = 90 | 10 s | 3 × 120 s, last stage harmless | 1 tile | Decay [V, S96] |
| Ultima Online | Fire Field | 2 per second | 1 s | 50% Magery + 4 s, max 64 | 5 tiles in a row | Leaving the field [V, S98; U, S97] |
| Diablo | Fire Wall | (rnd10 + rnd10 + clvl + 2) / 8 per hit | 0.05 s | 8 + 8 × slvl s | 12 flames, centre doubled | Expiry; formulas disagree [V, S101, S102] |
| Terraria | On Fire! | 4 HP/s | 0.25 s | Lava 7 / 14 / 17.5 s | Status | Any liquid except lava [V, S80] |
| Terraria | Lava | 80 (players), 50 (NPCs) | contact | + On Fire! 7 s | Liquid tiles | Obsidian Skin [V, S82] |
| Minecraft | Lava fire timer | 14 fire hits after leaving | about 1 s | 15 s (300 ticks) | Status | Water [V, S68] |
| Enter the Gungeon | Burn (enemies) | 4 DPS typical | continuous | 4 s typical; green fire 120 s | Status | Water goop [V, S104] |
| Mewgenics | Burn | Equal to stacks | per turn | Stacks − 1 per turn | Status + fire tiles | Water, Wet, Freeze [V, S103] |
| DCSS | Flame cloud | (2d23)/2 + 9 vs players | per turn | cloud decay | Cloud tiles | Dissipation [V, S92] |
| Path of Exile 1 | Burning ground | 20 to 26% of strongest ignite DPS (some sources) | continuous | 4 s base | Ground area | Only the strongest ticks [U, S107] |
| RimWorld | Burning pawn | 2 per second | 1 s | until put out | Status | Stomping, rain, foam [V, S72] |

**Our proposal for Asterion** [I]. Server tick 4 Hz for spread, but burn status ticks every 2 s (every 8th fire tick). Burn = stacks; deal `stacks × 4` then lose one stack; standing on fire adds one stack per 2 s and pauses decay (Mewgenics); water or the pond clears all stacks. Fire fields follow TFS with 3 stages, the last one harmless. Strongest field per tile only (PoE).

### 6d. Performance budget for Godot web

**What we measured** [I, note 03, measured]. We ran them on an Apple M4 Pro with Node v26.5.0 and Godot 4.7.stable headless on 2026-11-10. Phones are slower and were not measured; assume 3 to 6 times slower.

| Layer | Size or count | Measured on M4 Pro | Web budget (proposal) |
|---|---|---|---|
| Server fire CA, active list | 320x180, ~1,500 burning | 0.056 ms JS; 0.30 ms GDScript | under 1 ms per 4 Hz tick on the server |
| Server fire CA, full sweep | 320x180 | 0.55 ms JS; 10.5 ms GDScript | avoid |
| Smoke CA | 320x180 | 0.077 ms JS; 3.9 ms GDScript | run at 80x45 (about 0.3 ms GDScript) [I] |
| Smoke advect + decay | 320x180 | 0.31 ms JS | 80x45 or 64x64 |
| Stam fluids, 20 iterations | 320x180 / 64x64 | 32.1 ms / 1.82 ms JS | one 64x64 hero effect at most |
| DOOM fire buffer | 16x32 torch | 512 updates per frame [I, note 01] | 20 fires is about 10k updates |
| Embers | 256 pool | ~7 ops each [I, note 08] | under 2,000 ops per frame |
| Heat haze | rows above big fires | one sine per row | 1 px amplitude, no SCREEN_TEXTURE |

**What Godot imposes** [V, S116, S117, S118, S119]. No particle trails or SDF collision on Compatibility; first-use shader compile stutter; turbulence once dropped Android to about 10 FPS.

**Rule of thumb** [I]. Keep all fire and smoke work under about 2 ms of a 16.7 ms frame on a weak laptop. Do per-cell work in JS-speed code (C# or GDExtension on desktop, or a shader on web) once grids exceed 128x128, because GDScript is 15 to 50 times slower than V8 on these loops [I, note 03, measured].

### 6e. Network and determinism

Byte sizes are illustrative [I]. The front sizes come from our shape benchmark [I, note 03, measured].

| Encoding | What the server sends | Bytes per item | Radius-100 front (800 to 1,900 changes per tick) | Desync risk |
|---|---|---|---|---|
| Full state diff | Every tile whose state changed | 5 (x, y, state) | 4 to 9.5 KB per tick | none |
| Ignition and extinguish events | New burning tiles and put-out tiles only | about 4 (tile index + tick delta) | a fraction of the diff, since burn-out is derived | low if burn time is hashed |
| Seed and lockstep | Ignition inputs only; clients run the CA | inputs only | near zero | high; needs integer maths and hashed RNG [V, S63] |
| Item decay (Tibia) | One item swap per field stage | one message per stage | n/a | none [I, note 01] |

**Rules that keep every client identical** [I, note 03]:
1. Randomness from `hash(seed, x, y, tick)`, never from a shared RNG stream, so iteration order does not matter.
2. Integer maths only. Percent tables, not floats. Stam's fixed-point form (9 fractional bits) shows smoke can be integer too [V, S49].
3. The IGNITING state flips to BURNING at the end of the tick, so a tile cannot ignite and spread in the same tick.
4. One fire per tile; the first request wins (RuneScape) [V, S99].
5. Cosmetics never sync. Flame phase from `hash(x, y)`, ember spawns and smoke puffs stay client-only [I, note 06].
6. A periodic per-chunk checksum catches drift [I].

---

## 7. Combinations: a layered architecture for Asterion Online (Godot 4, web)

All of this section is design proposal [I], built from the cited parts. The Fire Sandbox (§8) plays it.

**Layers, bottom to top.**
1. **Server fire grid (gameplay truth).** A tile grid with material, fuel, moisture, state and heat per cell, ticked at a fixed 4 Hz with an active list of burning cells only (D1, D4). Ignition chance per burning neighbour is `base(material) × (1 − moisture) × wind × (diagonal ? 0.7 : 1)`, rolled from `hash(x, y, tick, seed)` so every client computes the same fire (D2, D5, D8). Rain raises moisture and puts fire out (D6); water never burns and makes steam next to fire (G2); an optional budget caps spread (D7).
2. **Network events.** The server sends ignition and extinguish events per chunk instead of full burning-set diffs, and clients replay burn-down from the shared hash (D8, §6e).
3. **Cosmetic flames per cell.** Two styles: a 4-frame flame loop drawn from a 4-tone ramp at 10 fps with phase from the cell coordinates, slower for big fires (B1, B2, B5); or DOOM fire mini-buffers fed by burning cells, with wind as a sideways shift (A1).
4. **Particles.** Embers and sparks from a fixed pool of 256, coloured by age through the fire ramp, rising with drag and pushed by wind (C1).
5. **Smoke and steam field.** An 80 x 45 byte field advected by wind plus upward drift, with decay, drawn through a 4x4 Bayer threshold: grey smoke, white steam, darker for oil (E1, E5, C3). Chimneys emit Stardew-style puffs (C2).
6. **Combat fire.** Fireballs with a trail, a white flash, a ring and smoke, leaving a 3x3 fire field that weakens in stages (F1, F3). Creatures that touch fire gain burn stacks that tick and decay, and water clears them (F2).
7. **Light hookup.** A cheap additive warm glow per burning cluster with flicker, reusing study #5, so fires read at night (G4).
8. **Palette and dither pass.** Everything maps to one limited palette, with optional heat haze over big fires by whole-pixel sine row offsets (B3, G3).

**Pseudocode.**

Server tick with an active list and a hash RNG (D1, D2, D4, D8):
```
TICK_HZ = 4
def rand16(x, y, tick, seed):                 # integer hash, same on every machine
    h = seed ^ (x * 374761393) ^ (y * 668265263) ^ (tick * 2246822519)
    h = ((h ^ (h >> 13)) * 1274126177) & 0xFFFFFFFF
    return (h ^ (h >> 16)) & 0xFFFF            # 0..65535

def server_tick(tick):
    new_fires = []
    for c in burning:                          # active list only
        for n, diag in neighbours8(c):
            if not flammable(n) or n.state != NONE: continue
            p = BASE[n.mat] * (255 - n.moist) // 255        # percent * 655 (integer table)
            p = p * WIND[dir(c, n)] // 256                  # 8 factors, rebuilt on wind change
            if diag: p = p * 179 // 256                     # x 0.7
            if budget_ok(c.source) and rand16(n.x, n.y, tick, SEED) < p:
                n.state = IGNITING; new_fires.append(n)
        c.fuel -= BURN_RATE[c.mat]
        if raining and rand16(c.x, c.y, tick, SEED ^ RAIN) < (20 + 3*c.age) * 655:
            extinguish(c); emit_event(STEAM, c)
        elif c.fuel <= 0: c.state = EMBERS
    for n in new_fires:
        n.state = BURNING; burning.add(n); emit_event(IGNITE, n, tick)
```

Client flame phase seeding (B1, B2, B5):
```
def flame_frame(x, y, ms, frames, period_ms):  # torch: 4, 400; house: 8, 1200
    phase = (x * 3047 + y * 88) % period_ms     # Stardew's multipliers
    return ((ms + phase) % period_ms) * frames // period_ms
```

Smoke advection and decay on an 80 x 45 byte field (E1):
```
for y in 0..44:
    for x in 0..79:
        sx = x - wind.x * dt                   # sample upwind
        sy = y + (rise + wind.y) * dt          # and from below (smoke rises)
        d  = bilinear(smoke_prev, sx, sy)
        smoke[y][x] = max(0, d - DECAY)        # DECAY 1..3 per tick
for c in burning: smoke[cell(c)] += 40
for e in steam_events: steam[cell(e)] += 160   # white ramp
draw: shade = smoke >> 6; if smoke/255 > bayer4[x&3][y&3]/16: put(GREYS[shade])
```

Burn status tick on a creature (F2):
```
every 2 s (8 fire ticks):
    if creature.on_fire_tile: creature.burn += 1       # standing in fire, no decay
    elif creature.burn > 0:
        damage(creature, creature.burn * 4); show_number(); flash_tint(RED, 1 frame)
        creature.burn -= 1
    if creature.in_water: creature.burn = 0; puff(STEAM)
client: if burn > 0: draw 2-3 flame sprites at hashed body offsets, 8-15 embers/s
```

---

## 8. Reference implementation: the Fire Sandbox

`vfx-fire-sandbox.html` [S7] is one hand-written page of plain JavaScript on a **320×180** canvas, scaled with pixelated rendering. It plays the eight layers of §7. Its design choices are ours [I]. All numbers on the page and in this section are illustrative.

**The world.** A small village edge seen top-down in 3/4 view. A meadow of grass and dry grass, a patch of trees, three or four wooden houses (one chimney always smokes), a stone road, a pond, a small lava pool or forge, a campfire and torches on posts. A sheep walks a loop through the meadow.

**The grid.** 8x8 px cells, 40 x 23 cells (the last row is partial). Each cell has a material (grass, dry grass, tree, wood wall, stone, water, lava, oil, ash), fuel (0 to 255), moisture (0 to 255), a state (none, igniting, burning, embers, ash) and heat.

**What you can do.**
- **Tools** (click or tap). Ignite with a torch, pour a water bucket, throw a fireball, spill oil, and plant or regrow grass. Keys 1 to 5 pick them.
- **Toggles.** Rain (R), wind direction in 8 steps (W) and a strength slider, flame style (sprite loop or DOOM buffer), day or night, the spread budget cap (at most 3 new ignitions per tick, a simpler stand-in for the Far Cry 2 points pool), and heat haze.
- **Time.** Pause (Space), step one tick, Reset and Seed. The same seed always gives the same fire, which is the determinism rule of §6e made visible.

**The views** (V cycles them). Normal; fuel and moisture; heat; the smoke field; active cells with the tick counter.

**The HUD.** Tick number, active burning cells, ms per simulation tick, bytes per tick for the two network encodings (full burning-set diff versus ignition and extinguish events, both with illustrative byte sizes), and particle count.

**What it demonstrates.** Wind reshapes the front, rain slows and kills it, water makes steam, and the budget toggle stops a runaway. The byte counter shows events beating diffs while the front is wide. Flames switch between a 4-frame loop drawn from a 4-tone ramp (near-white, yellow, orange, deep red) at 10 fps, seeded by cell and slower on houses, and DOOM mini-buffers fed from burning cells. Embers come from a 256-slot pool. Smoke is an 80 x 45 field with a Bayer threshold, grey for smoke, white for steam and darker for oil, and the chimney puffs rise 0.5 px per frame. A fireball leaves a 3x3 field that weakens in stages; the sheep catches burn stacks with a flame overlay, a red flash and damage numbers, and the pond clears them. Burning clusters glow at night, and an optional palette lock snaps everything to the 32-colour Endesga 32 palette with an ordered dither.

**Thumbnail.** A `blaze` demo button sets the houses on fire at night for the homepage image.

**Simplifications (honest list)** [I].
- It is Canvas 2D in one browser tab. Nothing in it is a Godot measurement or a real network.
- "Server" and "client" run in the same page; the network layer only counts bytes.

---

## 9. Gem findings

Licences were read from LICENSE files on 2026-11-10 via the GitHub API, or from the page where noted [V, note 07]. **Flags:** **Low** = MIT/BSD/Apache/CC0; **LGPL** = fine as a separate library; **Copyleft** = GPL/AGPL/CC BY-SA, study and re-implement; **None** = no licence, study only.

| Name | URL | Licence | Maturity | Good for | Flag |
|---|---|---|---|---|---|
| doom-fire-algorithm | https://github.com/filipedeschamps/doom-fire-algorithm | MIT | 1,599 stars, push 2026-10-17, 72 ports | DOOM fire in JS, wind and extinguish variants | Low |
| DoomFirePSX | https://github.com/fabiensanglard/DoomFirePSX | none | 263 stars, 2021 | The canonical write-up and palette | None |
| Lode's fire tutorial | https://lodev.org/cgtutor/fire.html | all rights reserved | classic | Kernel and divisor numbers | None |
| Simple Pixelated Fire | https://godotshaders.com/shader/simple-pixelated-fireshader/ ; https://github.com/Casual-Cynic/sconce-fire-test | MIT (page) | Nov 2025, Godot 4.5 | Palette-threshold noise flame, stepped scroll | Low |
| 2D Fire with colour banding | https://godotshaders.com/shader/2d-fire-effect-with-colour-banding/ | CC0 (page) | 2023, Godot 3 syntax | Banded torch with time offset | Low |
| Procedural Torch & Candle | https://godotshaders.com/shader/procedural-torch-candle-shader-fire-smoke-sparks/ | CC0 (page) | Oct 2025 | In-shader flame, sparks, smoke, wind | Low |
| Fire dissolve | https://godotshaders.com/shader/fire-dissolve-shader/ | CC0 (page) | May 2024 | Burn-away of tiles and creatures | Low |
| LAVA shader animated | https://godotshaders.com/shader/lava-shader-animated/ | CC0 (page) | Jun 2026, Godot 4 | Scrolling 3-colour lava | Low |
| Lava Shader (nimitz port) | https://godotshaders.com/shader/lava-shader/ | CC BY-NC-SA 3.0 | Shadertoy port | Warped-noise lava, study only | Copyleft (non-commercial) |
| GODOT-VFX-LIBRARY | https://github.com/haowg/GODOT-VFX-LIBRARY | MIT | 358 stars, Jan 2026 | Torch fire, steam, fireball trails | Low |
| godot-4-VFX-assets | https://github.com/gdquest-demos/godot-4-VFX-assets | MIT code; CC BY-NC-SA 4.0 art | 137 stars, May 2026 | Particle and shader setups | Low (code only) |
| Sandspiel | https://github.com/MaxBittker/sandspiel | MIT | 3,222 stars, Sep 2026 | Fire cell rule with an upward wind field | Low |
| The Powder Toy | https://github.com/The-Powder-Toy/The-Powder-Toy | GPL-3.0 | 5,403 stars, v100.1.400 | Heat, pressure and burn elements | Copyleft |
| sand-slide | https://github.com/kiwijuice56/sand-slide | MIT | 143 stars, shipped on itch and Play | Godot 4 falling sand rules | Low |
| WebGL Fluid Simulation | https://github.com/PavelDoGreat/WebGL-Fluid-Simulation | MIT | 16,809 stars | GPU stable fluids pass structure | Low |
| Brogue CE | https://github.com/tmewett/BrogueCE | AGPL-3.0 | 1,525 stars, v1.15.1 | Fire exposure, gas averaging | Copyleft |
| DCSS | https://github.com/crawl/crawl | GPL-2.0+; most tiles CC0 | 3,075 stars, 0.34.1 | Cloud spread, forest fire, steam | Copyleft |
| Luanti fire mod | https://github.com/luanti-org/minetest_game/tree/master/mods/fire | LGPL-2.1 code; CC BY-SA 3.0 media | ships with Luanti | Voxel fire spread rules | LGPL |
| macroquad-forestfire | https://github.com/Gerstacker/macroquad-forestfire | Unlicense (README) | 82 stars, WASM demo | Drossel-Schwabl reference | Low |
| Devkidd fire pack | https://devkidd.itch.io/pixel-fire-asset-pack | custom, commercial OK, no resale (page) | 44 ratings at 4.9 | Pixel idle flames 16x32 to 32x48 | Low (custom) |
| cs5475 Free Pixel Effects | https://cs5475.itch.io/free-pixel-effects | CC0 (page) | about 2 weeks old | 12 pixel explosions, palettes in JSON | Low |
| OpenGameArt fire and explosion sheets | https://opengameart.org/content/animated-fire ; https://opengameart.org/content/32x32-explosion | CC0 per search snippets | site blocked our fetcher | Placeholder art | Low (unverified) |

**Top five for Kingsfoil** [I, note 07]: write our own DOOM fire and check it against filipedeschamps (MIT); start pixel torches from Simple Pixelated Fire (MIT) or the colour-banding shader (CC0); use Fire dissolve (CC0) for charring; copy DCSS and Brogue spread numbers, not their code; use Devkidd and cs5475 art as placeholders.

---

## 10. Learnings and anti-patterns

**Learnings** [I unless cited]
1. **One number per cell, one palette.** Every good fire here is a heat or state value plus a colour lookup, from Perlin 1985 to the DOOM fire [V, S44, S1].
2. **Truth on the server, looks on the client.** The server ticks tile states slowly; clients draw flames, embers and smoke at 10 fps from that state [I, note 03].
3. **Chance below 1 and a burn time above 1.** That pair gives round fronts that neither die at once nor explode (D2) [I, note 03, measured].
4. **Size sets speed.** Bigger fires loop slower [V, S51, S28].
5. **Cap and protect.** Far Cry 2's budget and Minecraft's player radius exist because uncapped fire is "just not fun" [V, S65, S66].
6. **Strongest only.** One field per tile and one burn per creature keeps damage fair and server sums cheap [V, S107; I].

**Anti-patterns**
- Torches that start on frame 0 together [V, S33].
- Pure white in the flame body, leaving nothing for flashes [V, S38].
- Alpha-faded smoke that leaves the palette; dither instead [I, note 06].
- The same bright pixels on every explosion frame [V, S32].
- Ground fire that looks the same for allies and enemies, or hides under fog and foliage [V, S108, S109].
- Instant ignition from turn one, which burns the forest [V, S84].
- Per-frame heat checks per fire, which Wildfire found could drop to about 10 fps [V, S87].
- `SCREEN_TEXTURE` heat haze on Compatibility [V, S121].
- Camera shake for other players' explosions in an MMO [I, note 06].

---

## 11. "See it in action" index

| # | Game | Fire idea | URL |
|---|---|---|---|
| 1 | DOOM PSX / DOOM 64 | Buffer fire on the title screen | https://fabiensanglard.net/doom_fire_psx/ |
| 2 | Tibia | Fire field rune, 3 stages, burning | https://tibia.fandom.com/wiki/Fire_Field_Rune |
| 3 | Tibia | Burning condition, 9 s ticks | https://tibia.fandom.com/wiki/Burning |
| 4 | Ultima Online | 5-tile fire field, 2 dps | https://wiki.ultimacodex.com/wiki/Fire_Field |
| 5 | Diablo | Fire Wall at 20 hits per second | https://realmsbeyond.net/diablo/stratcdfirewall.html |
| 6 | Old School RuneScape | Tile fires, 60 to 119 s, ashes | https://oldschool.runescape.wiki/w/Fire |
| 7 | Far Cry 2 | Capped spread, wind, uphill | https://www.gamedeveloper.com/game-platforms/interview-how-i-far-cry-2-i-s-fire-fuels-spreads |
| 8 | Far Cry 2 | Watching the savanna burn | https://www.pcgamer.com/great-moments-in-pc-gaming-watching-fire-spread-in-far-cry-2 |
| 9 | Minecraft | Fire age, rain, spread radius rule | https://minecraft.wiki/w/Fire |
| 10 | Terraria | On Fire! debuff and particles | https://terraria.wiki.gg/wiki/On_Fire! |
| 11 | Terraria | Flamethrower stream | https://terraria.wiki.gg/wiki/Flamethrower |
| 12 | Don't Starve | Flashpoint, smoulder, ash | https://dontstarve.wiki.gg/wiki/Fire |
| 13 | Don't Starve Together | Fire griefing on shared servers | https://kleiforums.com/forums/topic/61624-wondering-which-kind-of-people-grief/ |
| 14 | RimWorld | Embers, room heat, rain | https://rimworldwiki.com/wiki/Fire |
| 15 | Zelda: Breath of the Wild | Grass fire updrafts | https://zeldawiki.wiki/wiki/Updraft |
| 16 | Zelda: A Link to the Past | Lantern and Fire Rod | https://zelda-archive.fandom.com/wiki/Fire_Rod |
| 17 | Divinity: Original Sin 2 | Fire, water, oil, steam combinations | https://www.gamepressure.com/originalsinii/environmental-effects-and-combinations/zea274 |
| 18 | Noita | Pixel fire, steam, falling sand | https://www.youtube.com/watch?v=prXuyMCgbTc |
| 19 | Noita | Lava plus water makes rock and steam | https://noita.wiki.gg/wiki/Lava |
| 20 | Brogue CE | Fire exposure, gas averaging | https://github.com/tmewett/BrogueCE |
| 21 | Dungeon Crawl Stone Soup | Flame clouds, steam, forest fire | https://crawl.chaosforge.org/Cloud |
| 22 | NetHack | Fire trap, scroll of fire | https://nethackwiki.com/wiki/Fire_trap |
| 23 | Into the Breach | Smoke cancels attacks | https://www.gamepressure.com/into-the-breach/combat/z1aa78 |
| 24 | Enter the Gungeon | Burn, green fire, oil goop | https://enterthegungeon.wiki.gg/wiki/Status_Effects |
| 25 | Mewgenics | Burn stacks, fire tiles | https://mewgenicswiki.org/wiki/status-effects/burn |
| 26 | Path of Exile | Ground fire readability | https://www.pathofexile.com/forum/view-thread/3598854 |
| 27 | Stardew Valley | Seeded torch loop, smoke puffs | https://github.com/E-riCA0/StawdewValley/blob/HEAD/Torch.cs |
| 28 | Sigil of Kings | Inert-then-contagious wildfire | https://byte-arcane.itch.io/sigil-of-kings/devlog/712302/wildfires |
| 29 | Wildfire | Grass is cover and fuel | https://siliconera.com/?p=469568 |
| 30 | Iron Village | Godot smoke puffs | https://lunar-chippy.itch.io/iron-village-prototype/devlog/725214/diary-14-settings-smoke |
| 31 | Battle for Wesnoth | Tiling flame strip | https://wiki.wesnoth.org/Fire_Animation |
| 32 | Castlevania: Dracula X | Scanline fire wobble | https://nesdev.nes.science/f12/t17484.xhtml |
| 33 | Canvas Cycle (Ferrari) | Palette-cycled fire and water | https://experiments.withgoogle.com/canvas-cycle |
| 34 | Vlambeer / Nuclear Throne | Screenshake, smoke permanence | https://www.youtube.com/watch?v=AJdEqssNZ-U |
| 35 | Street Fighter 2 | About 10 frames of hitstop | https://critpoints.net/2017/05/17/hitstophitfreezehitlaghitpausehitshit/ |
| 36 | Sandspiel | Browser falling-sand fire | https://sandspiel.club |
| 37 | Sea of Stars | Campfire rest scenes under dynamic light | https://twinfinite.net/news/sea-of-stars-camping/ |

---

## 12. What remains unverified (and corrections)

**Conflicts between notes, and how we resolved them**
1. **Tibia burn tick, 9 s versus 10 s.** TibiaWiki says 10 damage "every 9 seconds" for the real game [V, S93, S95]; TFS 1.4 uses `ticks 10000` [V, S96]. Stage times differ too (3:20, 2:28, 1:38 versus 3 × 120 s). Both give 90 total. We treat TFS as an approximation and use the wiki for feel.
2. **Alexandridis p0, 0.58 versus 0.6.** Freire and DaCamara give 0.58 [V, S58]; the drone paper gives 0.6 [V, S60]. Note 04 confirmed only 0.6. Use 0.58 for fidelity; for a game it does not matter.
3. **Diablo Fire Wall formulas.** One community page gives `(rnd10 + rnd10 + clvl + 2) / 8` per hit at 20 hits per second [V, S101]; another gives `(2·slvl + 4·Mag/8)` per frame [V, S102]. Neither is official.
4. **Minecraft ignition formula.** The wiki text is garbled. Note 02 reads it as `(maxFlammability + 7·difficulty + 40) / (age + 30)`, note 03 copied `+ 40·age + 30` [V, S66]. Check the source code before relying on it.
5. **Percolation threshold.** Note 04 quoted 0.593 from memory; note 03 read 0.592746 on the page [V, S57]. We use the page.

**Still unverified [U]**
- Screen-shake amounts (1 to 2 px light, 4 to 8 px heavy, Nuclear Throne 8 px) come from a secondary game-feel article [U, S43].
- OpenGameArt licences come from search snippets, because the site blocked our fetcher [U, S139]. CodeManu's pack shows both public domain and CC BY 4.0 [U, S138].
- `DrawableTexture2D` on Compatibility in a web export is untested. A GLES3 file exists in the merge diff [V, S130].
- Stardew numbers come from a decompiled early build, probably 1.0 or 1.1, not the current game [V, S114].
- Pokémon burn values, Nuclear Throne pellets, PoE ground fire percentages and fireball pack frame counts are from search snippets [U, S106, S110, S107, S36].
- UO Fire Field duration is a snippet of a blocked page [U, S97].
- The 3 to 6 times phone slowdown is a guess. No Godot web export was measured.
- The 320x168 buffer and 27 fps are from Sanglard's web port, not the PSX binary [V, S1].

---

## 13. Prototype roadmap for Godot (web)

1. **Server fire grid.** A typed GDScript (or C#) active-list CA at 4 Hz with the hash RNG, the material table of §6b and the IGNITING flip. Unit-test that two runs with the same seed match tile for tile.
2. **Events.** Send ignition and extinguish events per chunk; replay burn-down on the client. Count bytes against full diffs on a real front.
3. **Flame sprites.** One atlas with 4-frame torch, 6-frame campfire and 8-frame house loops from one 4-tone ramp; phase from `hash(x, y)`; `fixed_fps` 10.
4. **Embers and puffs.** CPUParticles2D or a MultiMesh pool of 256 embers; Stardew-style puffs for chimneys; pre-warm anything GPU-based at load.
5. **Smoke field.** An 80 x 45 byte field on the CPU, drawn with a Bayer-threshold canvas shader. Try `DrawableTexture2D` for it on a web export and keep whichever is faster.
6. **Combat fire.** Fire field items with 3 stages, burn stacks on creatures, a fireball with a 10 fps explosion and a 3x3 field. Strongest-only per tile.
7. **Interactions.** Water, rain, oil, lava + water, smoke that blocks sight at 2 opaque tiles.
8. **Glow and finish.** Cluster glow into the study #5 light map; palette pass; whole-pixel heat haze on big fires only. Profile on a phone before turning on anything optional.

---

## 14. Sources

Numbered for [S#] references. All URLs come from notes 01 to 10, the shared context or the Sandbox spec. "Blocked" or "snippet" means the page was not fetched directly.
**Series**
1. DOOM PSX fire (series reference), Fabien Sanglard, 2018-12-28: https://fabiensanglard.net/doom_fire_psx/
2. VFX #1 Snow: https://kingsfoil-artifacts.netlify.app/vfx-snow-topdown-pixel
3. VFX #2 Acid: https://kingsfoil-artifacts.netlify.app/vfx-acid-topdown-pixel
4. VFX #3 Rain: https://kingsfoil-artifacts.netlify.app/vfx-rain-topdown-pixel
5. VFX #4 Forest: https://kingsfoil-artifacts.netlify.app/vfx-forest-topdown-pixel
6. VFX #5 Light: https://kingsfoil-artifacts.netlify.app/vfx-light-topdown-pixel
7. Fire Sandbox: `vfx-fire-sandbox.html` (companion page)

**Buffer fire, demoscene and tiny code**
8. Hugo Elias, Fire (archived): https://web.archive.org/web/2016/http://freespace.virgin.net/hugo.elias/models/m_fire.htm
9. Lode Vandevenne, Fire Effect: https://lodev.org/cgtutor/fire.html
10. Adam Parusel, Simple Fire Effect (gamedev.net 1999, archived): https://web.archive.org/web/2010/http://www.gamedev.net/reference/articles/article222.asp
11. minfire, 64-byte fire: https://github.com/xeleh/sizecoding/blob/main/minfire/minfire.asm ; https://www.pouet.net/prod.php?which=90974
12. Apple II lo-res fire (qkumba): https://git.applefritter.com/Apple-2-SW/dos33fsprogs/raw/commit/6e4d96942ec7c8f87d3ce3ce0544d91803082b61/demos/fire/fire_qkumba.s
13. kometbomb, PICO-8 fire in 116 characters: https://gist.github.com/kometbomb/7ab11b8383d3ac94cbfe1be5fb859785
14. C64 character fire: https://c0de517e.com/026_c64fire.htm
15. BooMfire, Spectrum BASIC 10-liner: https://retrobits.altervista.org/blog/2024/03/boomfire-my-entry-to-the-13th-basic-10liner-contest/
16. Nerdy Teachers, PICO-8 fire particles: https://nerdyteachers.com/PICO-8/Game_Mechanics/14 ; https://mboffin.itch.io/pico-8-particles

**Palettes, dithering and old hardware**
17. 80.lv, colour cycling returns with HTML5: https://80.lv/articles/color-cycling-from-the-90s-returns-with-html5
18. Canvas Cycle: https://experiments.withgoogle.com/canvas-cycle
19. Mark Ferrari Q&A (mirror; refused one connection): https://dcmpx.remotevs.com/com/effectgames/www/PL/effect/article-Q_A_with_Mark_J_Ferrari.html
20. Dave Rupert, colour cycling with workers: https://daverupert.com/2018/09/color-cycling-image-pixels-with-workers/
21. Ordered dithering: https://en.wikipedia.org/wiki/Ordered_dithering
22. Godot ordered-dither shaders: https://godotshaders.com/?p=7263 ; https://godotshaders.com/shader/simple-ordered-dithering-and-screen-pixelation/
23. Mega Drive shadow and highlight: https://rasterscroll.com/mdgraphics/graphical-effects/shadow-and-highlight/ ; https://segaretro.org/Sega_Mega_Drive/Shadow_and_highlight
24. OpenSNES HDMA wave: https://k0b3n4irb.github.io/opensnes/graphics_2effects_2hdma__wave_2main_8c.html
25. SNES HDMA examples: https://snes.nesdev.org/wiki/HDMA_examples
26. SNES register wiki, HDMA: https://sneslab.net/wiki/HDMA
27. nesdev, Dracula X fire: https://nesdev.nes.science/f12/t17484.xhtml

**Pixel art craft and game feel**
28. Sprite-AI, pixel fire guide: https://www.sprite-ai.art/gallery/fire
29. Pixnote, pixel animation: https://pixnote.net/en/learn/animation
30. Toldi Games fire animation: https://toldigames.itch.io/fire-animation
31. Stealthix fire animations: https://stealthix.itch.io/fire-animations
32. PixelJoint explosion critique: https://pixeljoint.com/pixelart/10886.htm
33. Unreal forum, animation offset: https://forums.unrealengine.com/t/animation-offset/103243
34. Mixels: https://yari-pixels.github.io/Articles/mixels.html ; https://community.flowlab.io/t/mini-rant-stop-using-mixels/38287
35. Slynyrd, Pixelblog 31: https://www.slynyrd.com/blog/2020/12/14/pixelblog-31-shmup-sprite-design
36. GameDevMarket projectiles pack (snippet): https://gamedevmarket.net/asset/super-pixel-projectiles-pack-2-pixel-art-animated-projectiles
37. Riot, League of Legends VFX style guide (2017): https://nexus.leagueoflegends.com/wp-content/uploads/2017/10/VFX_Styleguide_final_public_hidpjqwx7lqyx0pjj3ss.pdf
38. VFX Apprentice, League VFX tips: https://www.vfxapprentice.com/blog/10-league-of-legends-vfx-design-tips
39. critpoints, hitstop: https://critpoints.net/2017/05/17/hitstophitfreezehitlaghitpausehitshit/
40. SmashWiki, Hitlag: https://www.ssbwiki.com/Hitlag
41. Hit feedback notes: https://uhiyama-lab.com/en/notes/unity/unity-game-feel-hit-feedback/
42. Godot 4 screen shake and hit stop: https://dev.to/saltmire/godot-4-screen-shake-and-hit-stop-in-one-script-11eh
43. Screen shake guide (secondary): https://gamejuice.pages.dev/articles/screen-shake-guide

**Physics, papers and fire science**
44. Perlin 1985, An Image Synthesizer: https://rmarcus.info/blog/assets/perlin/perlin_paper.pdf ; https://userpages.cs.umbc.edu/olano/class/635-07-2/PSE.pdf
45. Stam and Fiume 1995: https://www.dgp.toronto.edu/public_user/stam/reality/Research/pdf/sig95.pdf ; https://history.siggraph.org/?p=118728
46. Nguyen, Fedkiw and Jensen 2002: https://graphics.ucsd.edu/~henrik/papers/fire/ ; https://graphics.stanford.edu/papers/fire-sg02/
47. Lamorlette and Foster 2002: https://history.siggraph.org/?p=118466 ; https://research.cs.wisc.edu/graphics/Courses/cs777-2003/P2Students/hielsche
48. Bridson, Hourihan and Nordenstam 2007, curl noise: https://www.dneg.com/wp-content/uploads/2022/11/2007.pdf ; https://history.siggraph.org/?p=115355
49. Stam 2003, Real-Time Fluid Dynamics for Games: https://www.dgp.toronto.edu/public_user/stam/reality/Research/pdf/GDC03.pdf ; https://pdfs.semanticscholar.org/5127/ac7b58e36ffd13ca4437fc123c6a018dc436.pdf
50. US patent 6,266,071 B1: https://patents.google.com/patent/US6266071B1/en
51. Xia and Zhang, flame flicker: https://arxiv.org/pdf/1803.10400
52. Cetegen and Ahmed 1993, and a thesis listing coefficients: https://cgdl.engr.uconn.edu/?p=120 ; https://core.ac.uk/download/363147445.pdf
53. Flame colour by temperature: https://firefighternow.com/how-hot-are-different-flame-colors/ ; https://pslc.ws/fire/howwhy/flameco.htm ; https://www.build-a-gasifier.com/PDF/Temperature%20ByAppearance.pdf
54. Reading smoke colour: https://www.fireengineering.com/firefighter-training/the-art-of-reading-smoke-understanding-the-color/ ; https://www.firefightingincanada.com/trainers-corner-the-science-of-reading-smoke-2139/
55. Forest-fire model: https://en.wikipedia.org/wiki/Forest-fire_model
56. Drossel and Schwabl 1992, review: https://ar5iv.labs.arxiv.org/html/cond-mat/9610201 ; https://researchr.org/publication/PhysRevLett.69.1629
57. Percolation threshold: https://en.wikipedia.org/wiki/Percolation_threshold
58. Freire and DaCamara 2019 (Alexandridis restated): https://nhess.copernicus.org/articles/19/169/2019/nhess-19-169-2019.html
59. Alexandridis et al. 2008, record and reuse: https://dspace.lib.ntua.gr/xmlui/handle/123456789/18520?show=full ; https://arxiv.org/pdf/2403.08817
60. Drone suppression CA 2020: https://arxiv.org/pdf/2007.00883
61. Sullivan review of fire spread models: https://arxiv.org/abs/0706.4130
62. Karafyllidis and Thanailakis 1997: https://scilit.com/publications/560dc83c7f2d45ec00db18355c00bea9
63. Gaffer on Games, deterministic lockstep: https://gafferongames.com/post/deterministic_lockstep/

**Systemic fire in shipped games**
64. Levesque, Far Cry: how the fire burns and spreads (2012): https://jflevesque.com/2012/12/06/far-cry-how-the-fire-burns-and-spreads/
65. Game Developer, Far Cry 2 fire interview (2008): https://www.gamedeveloper.com/game-platforms/interview-how-i-far-cry-2-i-s-fire-fuels-spreads ; https://www.pcgamer.com/great-moments-in-pc-gaming-watching-fire-spread-in-far-cry-2
66. Minecraft Wiki, Fire: https://minecraft.wiki/w/Fire
67. Minecraft Wiki, Tick: https://minecraft.wiki/w/Tick
68. Minecraft Wiki, Lava: https://minecraft.wiki/w/Lava
69. Disabling fire spread on servers: https://xgamingserver.com/blog/how-to-disable-fire-spread-in-your-minecraft-server/
70. Klei forums, griefing: https://kleiforums.com/forums/topic/61624-wondering-which-kind-of-people-grief/
71. DST burnt base and protection mod: https://forums.kleientertainment.com/forums/topic/162945-burnt-base-after-returning-from-caves-wildfire-disabled-ps4-485-day-server/ ; https://steamcommunity.com/sharedfiles/filedetails/changelog/2723294081?p=4
72. RimWorld Wiki, Fire: https://rimworldwiki.com/wiki/Fire
73. GDC 2017 BotW chemistry engine report: https://www.thumbsticks.com/gdc-17-breath-of-the-wild-science-lies
74. GamesBeat on BotW chemistry: https://gamesbeat.com/the-legend-of-zelda-breath-of-the-wild-makes-chemistry-just-as-important-as-physics/
75. Divinity: Original Sin 2 environmental combinations: https://www.gamepressure.com/originalsinii/environmental-effects-and-combinations/zea274
76. Beamdog forum, fire overuse in BG3: https://forums.beamdog.com/discussion/comment/1147690
77. Noita GDC 2019 talk and summary: https://gdcvault.com/play/1025695/Exploring-the-Tech-and-Design ; https://www.youtube.com/watch?v=prXuyMCgbTc ; https://80.lv/articles/noita-a-game-based-on-falling-sand-simulation/
78. PC Gamer, Noita trailer: https://www.pcgamer.com/see-a-world-built-from-physically-simulated-pixels-in-noitas-gorgeous-debut-trailer
79. Noita Wiki, Lava: https://noita.wiki.gg/wiki/Lava
80. Terraria Wiki, On Fire!: https://terraria.wiki.gg/wiki/On_Fire!
81. Terraria Wiki, Flamethrower: https://terraria.wiki.gg/wiki/Flamethrower
82. Terraria Wiki, Lava: https://terraria.wiki.gg/wiki/Lava
83. Unity, Ignitement fluid fire breakdown: https://unity.com/blog/real-time-fluid-simulation-fire-vfx-ignitement-breakdown
84. Sigil of Kings, Wildfires (Apr 2024): https://byte-arcane.itch.io/sigil-of-kings/devlog/712302/wildfires
85. Pixel-perfect fire physics (Sep 2024): https://bodenmchalewebsite.pages.dev/blog/pixel-perfect-fire-physics.html
86. Siliconera, Wildfire interview (2015) and OpenCritic: https://siliconera.com/?p=469568 ; https://opencritic.com/game/9522/wildfire/reviews?order=asc
87. GameCloud, PAX Aus 2016 Wildfire interview: https://gamecloud.net.au/features/interviews/pax-aus-2016-wildfire-creator-dan-hindes

**Roguelikes**
88. Brogue CE, Time.c: https://github.com/tmewett/BrogueCE/blob/master/src/brogue/Time.c
89. Brogue CE, Globals.c: https://github.com/tmewett/BrogueCE/blob/master/src/brogue/Globals.c
90. DCSS repository: https://github.com/crawl/crawl
91. DCSS cloud.cc: https://github.com/crawl/crawl/blob/master/crawl-ref/source/cloud.cc
92. DCSS wiki, Cloud (0.34): https://crawl.chaosforge.org/Cloud

**Tibia, MMOs and RPG combat fire**
93. TibiaWiki, Fire Field Rune: https://tibia.fandom.com/wiki/Fire_Field_Rune
94. TibiaWiki, Fire Wall Rune: https://tibia.fandom.com/wiki/Fire_Wall_Rune
95. TibiaWiki, Burning: https://tibia.fandom.com/wiki/Burning
96. TFS 1.4 items.xml: https://github.com/otland/forgottenserver/blob/1.4/data/items/items.xml
97. UOGuide, Fire Field (403, snippet): https://www.uoguide.com/Fire_Field
98. Ultima Codex, Magery spells and Fire Field: https://wiki.ultimacodex.com/wiki/Ultima_Online_Magery_Spells ; https://wiki.ultimacodex.com/wiki/Fire_Field
99. OSRS Wiki, Fire: https://oldschool.runescape.wiki/w/Fire
100. RuneScape Wiki, Firemaking: https://runescape.wiki/w/Firemaking
101. Realms Beyond, Diablo Fire Wall: https://realmsbeyond.net/diablo/stratcdfirewall.html
102. Diablo I mechanics (community): https://diablobytes.pages.dev/diablo-i/mechanics
103. Mewgenics Wiki, Burn and elemental chart: https://mewgenicswiki.org/wiki/status-effects/burn ; https://mewgenicswiki.org/tools/elemental-chart ; https://mewgenicswiki.org/wiki/weather/wildfire-1
104. Enter the Gungeon Wiki, Status Effects: https://enterthegungeon.wiki.gg/wiki/Status_Effects
105. Enter the Gungeon Wiki, Goop: https://enterthegungeon.wiki.gg/wiki/Goop
106. Bulbapedia, Burn (403, snippets): https://bulbapedia.bulbagarden.net/wiki/Burn_(status_condition)
107. PoE ground fire and PoE2 burning ground (snippets): https://poewiki.net/wiki/Ground_fire ; https://poewiki.net/wiki/Ground_Effect ; https://www.poe2wiki.net/wiki/Burning_ground
108. PoE forum, ground effect colours: https://www.pathofexile.com/forum/view-thread/3598854
109. PoE forum, hidden hazards and clutter: https://pathofexile.com/forum/view-thread/3626389 ; https://www.pathofexile.com/forum/view-thread/3660138
110. Nuclear Throne wiki (snippet): https://nuclear-throne.fandom.com/wiki/File:Explosive.png
111. Into the Breach wiki, Weapons: https://intothebreach.fandom.com/wiki/Weapons
112. Gamepressure, Into the Breach combat: https://www.gamepressure.com/into-the-breach/combat/z1aa78
113. Into the Breach wiki, Rusting Hulks: https://intothebreach.gamepedia.com/Rusting_Hulks

**Stardew Valley and smoke puffs**
114. Stardew Valley decompiled early build (Torch.cs, Utility.cs, Object.cs, Town.cs): https://github.com/E-riCA0/StawdewValley
115. Iron Village, smoke diary: https://lunar-chippy.itch.io/iron-village-prototype/devlog/725214/diary-14-settings-smoke

**Godot and the web**
116. Godot renderers: https://docs.godotengine.org/en/latest/tutorials/rendering/renderers.html ; https://docs.godotengine.org/en/4.4/tutorials/rendering/renderers.html
117. GPUParticles2D and ParticleProcessMaterial: https://docs.godotengine.org/en/stable/classes/class_gpuparticles2d.html ; https://docs.godotengine.org/en/stable/classes/class_particleprocessmaterial.html
118. Godot forum, particle shader compile lag on web: https://forum.godotengine.org/t/handling-particle-shader-compilation-lag-in-godot-4-web-compatibility-renderer/36170
119. Godot issue 83744, turbulence on Android: https://github.com/godotengine/godot/issues/83744
120. Godot issue 91717: https://github.com/godotengine/godot/issues/91717
121. Godot open issues 106787, 97943, 94863, 79914, 119300: https://github.com/godotengine/godot/issues/106787 ; https://github.com/godotengine/godot/issues/97943 ; https://github.com/godotengine/godot/issues/94863 ; https://github.com/godotengine/godot/issues/79914 ; https://github.com/godotengine/godot/issues/119300
122. Godot forum, screen texture in Compatibility: https://forum.godotengine.org/t/screen-texture-behaves-strangely-with-gl-compatibility-renderer-but-works-fine-with-forward/93296
123. Godot 4.5: https://godotengine.org/releases/4.5/
124. Godot 4.6: https://godotengine.org/releases/4.6/
125. Godot 4.7: https://godotengine.org/releases/4.7/
126. Godot 4.7 release coverage (secondary): https://app.cinevva.com/news/2026-06-19-godot-4-7-released ; https://80.lv/articles/godot-4-7-has-been-released
127. Godot 4.8 beta 1: https://godotengine.org/article/dev-snapshot-godot-4-8-beta-1/
128. DrawableTexture2D class: https://docs.godotengine.org/en/latest/classes/class_drawabletexture2d.html
129. Drawable textures tutorial: https://docs.godotengine.org/en/latest/tutorials/rendering/drawable_textures.html
130. PR 105701 merge diff (mirror): https://remotebranch.eu/Stowage/godot/commit/fd6e80d4e97ccd4ab4146db018df91c20e07ab4e.diff
131. GodotCon Amsterdam 2026, Procedural Pixel Art: https://talks.godotengine.org/godotcon-ams-2026/talk/NSNXFT/
132. WebGPU in major browsers: https://web.dev/blog/webgpu-supported-major-browsers ; https://www.techspot.com/news/110456-webgpu-now-brings-desktop-quality-graphics-all-major.html

**Shaders, code and assets**
133. Simple Pixelated Fire shader: https://godotshaders.com/shader/simple-pixelated-fireshader/
134. Lava Shader (nimitz port): https://godotshaders.com/shader/lava-shader/
135. LAVA shader animated (miwls): https://godotshaders.com/shader/lava-shader-animated/
136. Sandspiel and its making-of: https://github.com/MaxBittker/sandspiel ; https://maxbittker.com/making-sandspiel
137. PavelDoGreat WebGL fluid: https://github.com/PavelDoGreat/WebGL-Fluid-Simulation
138. CodeManu Free Pixel Effects Pack: https://codemanu.itch.io/pixelart-effect-pack
139. OpenGameArt CC0 fire and explosion sheets (403, snippets): https://opengameart.org/content/animated-fire ; https://opengameart.org/content/explosion-animations

**Frontier and newest work**
140. Holographic Radiance Cascades (May 2025): https://arxiv.org/abs/2505.02041
141. radiance-cascades-godot: https://relatedrepos.com/gh/Sohojoe/radiance-cascades-godot
142. luma.gl volumetric fire (experimental): https://luma.gl/docs/api-reference/experimental/volumetric-fire-simulation
143. FieryGS, ICLR 2026: https://iclr.cc/virtual/2026/poster/10006432 ; https://www.emergentmind.com/papers/2605.00177
144. Retro Diffusion on Replicate (Nov 2025): https://replicate.com/blog/retro-diffusions-pixel-art-models-are-now-on-replicate ; https://docs.scenario.com/get-started/generation/third-party-model-generation/third-party-model-generation-retro-diffusion
145. PixelLab VFX tutorial summary: https://sozai.app/transcript/make-animated-pixel-art-vfx-pixellab/
