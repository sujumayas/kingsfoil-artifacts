# 08 — Tiny-code, demoscene and "DOOM-fire-style" tricks for SNOW

Researcher angle: smallest/cheapest algorithms that still look good. Top-down pixel art, Godot 4, web-first.
Tool budget used: ~40 calls. Some sites were blocked by the session allowlist (shadertoy.com, dwitter.net search, fabiensanglard.net/fizzlefade); noted under Gaps.

---

## Q1. The DOOM PSX fire template (precise restatement)

### Takeaway
A palette-index buffer + a one-line "copy from below, maybe minus 1, maybe shifted sideways" rule gives a convincing fluid. For snow, the same skeleton works if you (a) flip direction (copy from above), (b) treat the index as "snow amount / brightness" instead of heat, and (c) replace "decay" with "settle / melt".

### Cited findings
- Palette: framebuffer values are "within [0, 36]", i.e. 37 entries, white → yellow → orange → red → black. Origin top-left. ([Sanglard](https://fabiensanglard.net/doom_fire_psx/))
- Source: bottom line set to white (36); bottom row never updated (loop `y = 1 .. FIRE_HEIGHT-1`). (Sanglard) Note: the page is internally inconsistent about the bottom row being 36 vs "populated with zeros" — 36 is the working version.
- Basic spread: `to = from - FIRE_WIDTH; fire[to] = fire[from] - 1`. (Sanglard)
- Random decay: `rand = round(random()*3) & 3; fire[to] = fire[from] - (rand & 1)` → decays 0 or 1 per step. (Sanglard)
- Wind/sideways: `to = from - FIRE_WIDTH - rand + 1` → column offset in {+1, 0, -1, -2} (rand 0..3). Sanglard says wind "can be simulated" by altering this, no explicit code. (Sanglard)
- PICO-8 port (Adam Richardson): 128×48 buffer, only 5 palette entries (PICO colors 0,8,9,10,7), `r = band(rnd(3),3)`, `dst = src - r + 1`, `pixels[dst-fw] = p - band(r,1)`; a 0 source writes 0 above. Shows the rule still reads well with 5 colors. ([thales17](https://thales17.srht.site/posts/doom_fire.html))
- Turning off (common practice in ports, e.g. Filipe Deschamps playground): set the source row to 0 and the fire dies out from the bottom. (Not stated on Sanglard's page — from [CONTEXT](https://github.com/filipedeschamps/doom-fire-algorithm) reference; unverified in this session.)

### Cost
Per pixel per frame: 1 read, 1 RNG (can be a 2-bit LFSR/LUT), 1 subtract, 1 write. ~5 ops/pixel. 1 byte/pixel memory.

### Snow analogues (inferences, designed from the template)
1. **"Inverse fire" snowfall CA (side view or "screen-space falling" in top-down):** iterate rows top→bottom from the *bottom* (so a flake moves once per frame), `to = from + W + (rand&3) - 1` (wind = bias the offset, e.g. `+ windBias`), copy index, clear source. Index = flake brightness/size (near/far). A spawn row at the top seeds random nonzero indices at a density (e.g., 1–3% of cells per frame).
2. **"Settle" palette (top-down coverage):** index 0..N = snow depth on ground, palette ramp ground→slush→thin snow→white. Per tile per tick: `depth += (rand < exposure*rate)`; melt: `depth -= (rand & 1) * sun`. This is DOOM's "random decay" applied as melt with a sun/shade multiplier. The 0/1 random decrement gives the same organic, ragged edge DOOM fire has.
3. **Smoothing step (DOOM's sideways copy as diffusion):** occasionally `depth[x] = max(depth[x], depth[x+offset]-1)` with random offset → snow bleeds into sheltered edges with a soft 1-step falloff, like fire tongues.

### Gaps
- Sanglard's page gives no FIRE_WIDTH/HEIGHT numbers or frame rate. Couldn't fetch the Deschamps README this session.

---

## Q2. Classic "snow that falls and piles" programs (side view) → top-down equivalents

### Takeaway
Three generations exist: (1) **pixel-scan fall, stop on contact** (no piles, columns form), (2) **falling-sand rule: down, else down-left, else down-right** (real piles with ~45° slopes), (3) **particles that land and "bake" into the background** (Silly Snow). All use the framebuffer itself as the collision map — zero extra memory.

### Cited findings
- **x86 asm mode 13h snow (berk76):** 320×200×256; one new flake per loop at a random top-row x (two reads of port 40h timer); scans video memory backward from offset 63680 (row 199) for 63680 bytes; flake moves down if `es:[di+320]` is empty; no diagonal checks → flakes stack in vertical columns, no slopes. ([gist berk76](https://gist.github.com/berk76/411c7ea62d890a5a6584a3ec9bbe5308))
- **Sol's Graphics tutorial ch.4 "Let it Snow" (Jari Komppa):** ground heights per column from three `sin()` terms; 8 new white pixels per frame on the top row; scan bottom-up; for each white pixel try **down, then down-left, then down-right**, moving only into black pixels → snow stacks on the green ground; wind sway only suggested as an exercise; assumes ~60 Hz. ([solhsa.com](https://solhsa.com/gp2/ch04.html))
- **"Silly Snow" (drakeblue, PICO-8, 2020-12-02):** flakes are particles (x,y); "If the snow flake encounters an obstacle" (a non-empty pixel or screen bottom) it has landed: particle destroyed, pixel set to white, "becomes part of the background". 9 behaviour variants; methods 8–9 add a per-frame gust plus per-flake sine from position. Suggests collapsing drifts as future work. ([Lexaloffle BBS pid 84926](https://www.lexaloffle.com/bbs/?pid=84926))
- Counter-example: SWAG Pascal "snow" (Batalas/Coolman, June 1994), 500 flakes in mode 13h, just scales stored coords by `i*0.01` — a "snowflake explosion", no gravity, no piling. Shows that not all old "snow" programs are physical. ([SWAG EGAVGA 0124](https://swag.bttr-software.de/EGAVGA/0124.PAS.html))

### Top-down equivalents (inferences)
- In top-down the "down" direction is the camera's depth axis, so piling becomes a **height/depth field per ground cell** rather than stacked pixels. The falling-sand rule maps to **angle-of-repose relaxation**: if `depth[c] - depth[n] > 2` for a neighbour n, move 1 unit to n (pick neighbour randomly or with wind bias). This is the sand-pile/avalanche CA; produces drift slopes at wall lee sides if you bias the transfer downwind.
- "Bake into background" (Silly Snow) = in top-down, falling flake particles reach their landing time (z ≤ 0) and increment `depth[x,y]` (or write a white pixel into a ground-overlay texture). Collision test = "is this cell sheltered?" lookup in a precomputed shelter mask (roof/tree/lee). Flakes landing on a roof tile increment the roof's depth instead.
- Falling-sand on a GPU: Godot can do it with a ping-pong viewport, but the rule needs Margolus/checkerboard passes to avoid two pixels moving into one cell; on CPU at tile resolution (e.g. 64×64 cells around the player) it's trivial.

---

## Q3. Demoscene / size-coding snow (Xmas tradition)

### Takeaway
Christmas productions are a real scene sub-genre with dedicated compos (e.g. a 1998 "xmas 256b" compo and the 256b.com xmas compo 2001 that included a **64-byte** snow intro). Snow there is almost always: per-flake (x,y) with x wobble from a sine table, y += layer speed, wrap to the top; or the framebuffer-scan pile-up rule above. Technical write-ups are scarce; pouet comments rarely explain.

### Cited findings
- **Snow64 by TAP**, MS-DOS, **64 bytes**, Jan 2002, 256b.com xmas compo 2001 (9th). Comment: "Pretty non-ugly for 64 bytes". ([pouet 22358](https://www.pouet.net/prod.php?which=22358))
- **Snow 1 Demo** (Martin Lester), xmas98 256b compo; actually uses "palette fuzz" flicker (chain-4) rather than falling flakes. ([scene.org](https://files.scene.org/view/demos/compos/xmas98_256b/snow1.zip))
- **The Night it Snowed**, Genesis Project, C64, Feb 2020, Fjälldata 2020 C64 demo compo 4th. Video: https://www.youtube.com/watch?v=Urq7Ue6gS44 ([pouet 84835](https://www.pouet.net/prod.php?which=84835))
- **Let it snow**, Cocoon, Windows demo, Jan 2015. Video: https://www.youtube.com/watch?v=NrPWQraJg1c ([pouet 64860](https://www.pouet.net/prod.php?which=64860))
- Other xmas prods: The Snowtro Xmas Demo (Reservoir Gods, Atari) ([pouet 1161](https://www.pouet.net/prod.php?which=1161)), Xmas Demo (Cascada) ([pouet 4112](https://www.pouet.net/prod.php?which=4112)), Xmas 2024 (Fairlight) ([pouet 102819](https://www.pouet.net/prod.php?which=102819)); pouet "Christmas demos" thread lists more incl. Schneegestöber 4k ([pouet topic 10577](https://www.pouet.net/topic.php?which=10577)).
- **8-bit starfield/snow mechanics** (applies 1:1 to snow layers): X positions in a table, updated from a per-star speed table; 6502 example with 8 stars, one per line, random speed 1–4, AND mask to wrap; slow layer can live in a scrolling tilemap, fast layer as sprites; one hardware sprite reused per scanline to draw many dots; or cycle one tile's bitmap every few VBLANKs (≤16 bytes VRAM/frame) — cheap but repetitive. ([ChibiAkumas forum](https://chibiakumas.com/forum/viewtopic.php?p=533))
- **Stateless parallax field** (Chris Wellons): world split into 256-px tiles; each tile hashed (Jenkins mix, seed `0x9d2c5680`) → 3 stars per tile from hash bits; no star list stored; layers = same routine with tile size `256/starscale`, drawn back-to-front darkest first. ([nullprogram 2011](https://nullprogram.com/blog/2011/06/13/))

### Classic snow-scroller recipe (inference, synthesised from the above)
```
per flake: x, y (8.8 fixed), layer (0..2), phase
each frame: y += speed[layer]            ; e.g. 0.5, 1.0, 2.0 px/frame
            x += sinLUT[(phase + t) & 63] >> shift[layer] + wind[layer]
            wrap: y &= H-1 ; x &= W-1    ; power-of-two screen/buffer
            color = ramp[layer]          ; far = dim/1px, near = bright/2px
```
~6–8 integer ops per flake; 64-entry sine LUT (64 bytes). Per-layer speed and brightness are what sell depth.

### Top-down adaptation (inference)
In top-down, "falling" is mostly *toward the camera*. Read as: flakes drift diagonally (wind) on screen, with near layers faster/larger (parallax relative to camera motion: offset each layer by `camera * factor[layer]`, factor >1 for near-camera flakes, <1 for far ones), plus a short "landing" lifetime for ground layer flakes (spawn at a ground position, animate from high to ground, then poof/increment depth).

### Gaps
- No technical write-up found for a specific C64/Amiga snow routine (codebase64 search returned nothing on snow). Pouet comments contain no implementation details.

---

## Q4. PICO-8 / TIC-80 tweetcarts and Dwitter

### Cited findings
- Tweetcart culture: PICO-8 programs fitting a tweet; guide by PrincessChooChoo (2020-05-11) shows 252→226 chars via minification. ([Lexaloffle tid 37886](https://www.lexaloffle.com/bbs?tid=37886))
- Silly Snow (above) is the best documented PICO-8 snow cart with 9 variants. ([pid 84926](https://www.lexaloffle.com/bbs/?pid=84926))
- TIC-80 snow demo exists on itch ([191brian](https://191brian.itch.io/tic-80-snow-demo)) — not inspected.
- Dwitter (140-char JS): `#particles` hashtag page lists particle dweets ([dwitter h/particles](https://www.dwitter.net/h/particles)); a snow-tagged dweet URL surfaced ([beta.dwitter.net/d/12739](https://beta.dwitter.net/d/12739)) but content is JS-rendered and could not be read.

### Inference: what a 140-char snow dweet typically does
Stateless: for i in 0..N, `x = (hash(i)*W + sin(t+i)*k) % W`, `y = (i*k2 + t*speed(i)) % H`, `fillRect(x,y,s,s)` where size/speed derived from `i%3` (layers). No arrays — position is a pure function of (i, t). This is the per-flake version of the shader trick in Q5; ideal for a Godot `_draw()` or a MultiMesh with a vertex shader (positions computed in shader from INSTANCE_ID and TIME — zero CPU per flake).

### Gaps
- Could not retrieve concrete snow tweetcarts/dweets with code and char counts (allowlist + JS rendering). Need manual browsing of dwitter.net search "snow" and twitter #tweetcart.

---

## Q5. Shader-golf: hash-cell layered snow (Shadertoy style)

### Takeaway
No particle state. Each layer divides the screen into a grid scrolled by `time*speed`; per cell, a hash gives one flake's offset + brightness; the pixel tests distance to that cell's flake only. Cost = O(layers) per pixel, independent of flake count. It is the GPU twin of Wellons' stateless starfield.

### Cited findings
- "Let it snow" (Godot port, "From shadertoy to Godot shader", gerardogc2378): 5 layers; per layer UV scale `1 + fi*0.5` (denser/smaller further away); `floor(q)` = cell id, `fract(q)` = position in cell; hash with constants incl. `31415.9` and a 3×3 matrix; `r.xy` = flake offset, `r.x` = brightness; fall = `speed*TIME` added to y, divided by `1 + fi*0.015` per layer; `width` gives per-layer horizontal slant; fake DOF `dof = 5*sin(TIME*0.1)` changes which layer is sharp; defaults width 0.5, speed 0.5. ([godotshaders let-it-snow](https://godotshaders.com/shader/let-it-snow/))
- "Multilayer Snowfall Shader" (Lumine): same structure with default **40 layers**, wind uniform (−2..2), per-layer slant `spread*fract(i*7.238917) - spread/2`, brightness `1/(1+0.01*i)`; commenters: start the loop at i=10 to drop the nearest 10 layers; base_color vec4(0) for transparency. Cost linear in layer count. ([godotshaders multilayer](https://godotshaders.com/shader/multilayer-snowfall-shader/))
- Inference (not verified, shadertoy blocked): both are ports of Andrew Baldwin's Shadertoy "Just snow" (id ldsGDn, ~2013) — the `31415.9` constant, 3×3 hash matrix and `5*sin(t*0.1)` DOF match my recollection of that shader.

### The math (generic, inference)
```
for i in 0..L-1:
  s   = 1 + i*0.5                     // layer scale: far layers = more, smaller flakes
  q   = uv*s + vec2(wind*t + slant_i*uv.y, t*speed/(1+i*k))
  id  = floor(q); f = fract(q)
  r   = hash3(id + i*seed)            // 3 pseudo-random numbers per cell
  d   = length(f - r.xy)              // distance to this cell's single flake
  col += step(d, radius_i) * r.x      // pixel-art: step(), not smoothstep()
```
Per pixel per layer: ~1 hash (a few mults+fract), 1 floor/fract, 1 length → ~15–25 ALU. 5 layers ≈ 100 ALU/pixel: trivial at 320×180 internal resolution.
Pixel-art tips (inference): run at game resolution (SubViewport or `SCREEN_UV` snapped to the pixel grid), use `step` with radius 0.5–1.5 px, quantise brightness to 2–3 palette colours, snap the time offset to whole pixels per layer so flakes don't shimmer sub-pixel. Flakes can't cross cell borders, so keep `r.xy` within [0.15,0.85] to avoid clipped flakes.
Top-down: add `camera_position * parallax_i` to `q` so near layers slide more than the ground when the camera moves — sells height in a top-down view.

---

## Q6. Old tricks for footprints and trails

### Cited findings
- **Palette/colour-cycling as overlay (Mark Ferrari):** snow and rain were drawn as a short contrasting segment moving along a longer path of opaque colours "adjusted to match the background" so the trail looks transparent; overlapping stenciled cycles in several value variations; snow/rain palette rows reused for rainbows/stars when not snowing. ([Ferrari Q&A, EffectGames mirror](https://dcmpx.remotevs.com/com/effectgames/www/PL/effect/article-Q_A_with_Mark_J_Ferrari.html))
- Colour cycling: pixels "holding completely still" while colours rotate; used because swapping a palette costs less than frames. ([Wikiwand Color cycling](https://www.wikiwand.com/en/articles/Color-cycling))

### Inferences (old-school designs, not sourced to a specific game this session)
- **Ring buffer of footprint decals:** fixed array of N=64–256 entries (x, y, dir, age); write index `i = (i+1) & (N-1)` on each step; oldest print overwritten automatically. Draw as 2–4 px stamps. Memory: ~4–8 bytes × N. Cost: O(N) draw, O(1) insert. Fill-back: alpha/palette index from `age` (and snowfall rate).
- **Write prints into the depth field instead:** `depth[cell] = max(0, depth[cell]-2)` at feet → prints refill naturally via the same accumulation rule as everything else (snow falling fills them back in; no extra system). This is the most "DOOM-like": one buffer, one rule.
- **Palette-index prints:** prints write special palette indices (e.g. 200–203 = "print, age 0..3"); a per-second pass (or palette remap) converts 203→202→…→ plain snow. With a shader palette LUT you can change the look of all prints at once (e.g. at night or when slush) by editing 4 LUT entries.
- **"Erase with noise" fade:** each tick, for a random subset of print pixels (`rand < p`), increment toward snow index — ragged dissolve instead of uniform alpha fade; matches pixel art.
- **XOR/stipple:** a print drawn as a 50% checkerboard of the shadow colour reads as a shallow dent on 1-bit/low-palette displays; drawing a dent twice with XOR cancels it (cheap undo). Mainly useful when no alpha is available.

---

## Q7. Palette tricks for melting / coverage / sparkle

### Cited findings
- **Ordered (Bayer) dithering:** threshold map M(i,j) compared with pixel value; "if the brightness value… is less than the number" in the matrix cell, plot black; map built recursively via Kronecker products; normalised map `M_int/n²` → n² levels (16 levels for 4×4). ([Wikipedia Ordered dithering](https://en.wikipedia.org/wiki/Ordered_dithering)) — matrix values not extracted by the fetch; standard 4×4 Bayer: `0 8 2 10 / 12 4 14 6 / 3 11 1 9 / 15 7 13 5` (from memory).
- **Fizzlefade (Wolfenstein 3D):** visits each of 320×200 = 64,000 pixels once in pseudo-random order via an LFSR, without storing a shuffled list. ([antirez](https://antirez.com/news/113), [DataGenetics](https://datagenetics.com/blog/november12017/index.html)) Details from memory (unverified, Sanglard page blocked): 17-bit Galois LFSR, XOR 0x00012000, y = low 8 bits, x = next 9 bits, reject x≥320 or y≥200.

### Inferences
- **Coverage/melt as threshold dissolve:** store per-pixel (or per-tile) random/Bayer threshold `T(x,y)` (or compute it from a hash). Draw snow at pixel if `coverage(cell) > T(x,y)`. Raising/lowering one scalar per cell gives a stable, non-flickering dissolve — melting "eats" the snow in a fixed speckle pattern, which reads as natural patchy melt. Use a blue-noise or Bayer 4×4 → 16 coverage steps. Cost: 1 compare per pixel.
- **Edges first:** make `T` larger near edges of the snow region (or subtract `edgeDistance` from coverage) so melt starts at borders and sunny sides — a 1-op tweak.
- **Sparkle via palette cycling:** reserve 3–4 palette slots for "snow highlight"; scatter those indices on ~1–2% of snow pixels; rotate the slot colours (white, near-white, base, base) every few frames → glints that twinkle at zero per-pixel CPU. Same in a shader: `if hash(cell) < 0.02 && ((t + hash*8) & 7) == 0 → highlight`.
- **Colour-ramp lookups:** depth index → ramp (ground, wet dark, slush, thin snow, snow, bright snow, shadow-blue variants). Day/night or sun/shade = swap the LUT, not the pixels.
- **Fizzlefade as snow "arrival":** when weather switches to snow, cover tiles in LFSR order N pixels/frame → snow appears in a speckle that fills uniformly, deterministic, no memory.

---

## Q8. Ranked list — cheapest algorithms that still look good (inference, costs estimated)

| # | Algorithm | Cost | Memory | Look |
|---|---|---|---|---|
| 1 | **Palette-cycled sparkle** (fixed glint pixels, rotate 3–4 palette slots) | ~0 per pixel (palette/LUT edit per frame) | 4 palette entries | Twinkling snow surface; very "alive" for free |
| 2 | **Threshold/Bayer dissolve for coverage & melt** | 1 compare/pixel (shader) | 1 byte/cell coverage (+ 16-byte matrix) | Stable speckled build-up and patchy melt; pixel-art native |
| 3 | **Stateless hash-cell flake layers (shader)** | ~20 ALU × layers per pixel; 3–5 layers | none (uniforms only) | Infinite flakes, parallax, wind; can look generic if not pixel-snapped |
| 4 | **Stateless per-flake formula (dweet style, MultiMesh/vertex shader)** | ~6–10 ops/flake; 200–2000 flakes | none | Classic layered snowfall; per-layer speed/size sells depth |
| 5 | **Table-driven flake scroller** (x += sinLUT, y += layerSpeed, AND-wrap, 8.8 fixed) | ~6–8 int ops/flake | ~4–6 bytes/flake + 64-byte LUT | Old-school demoscene snow; deterministic, smooth |
| 6 | **Depth-field accumulation with DOOM random increment/decrement** | ~4 ops/cell/tick (tick 2–10 Hz) | 1 byte/cell | Organic, ragged build-up/melt edges; drives everything else |
| 7 | **Footprints written into the depth field** (subtract at feet, refill by #6) | O(1) per step | none extra | Prints that fill back in under snowfall "for free" |
| 8 | **Footprint ring buffer of decals** | O(N) draw, O(1) insert; N 64–256 | 4–8 B × N | Crisp authored prints, controllable fade; independent of depth field |
| 9 | **Angle-of-repose relaxation (falling-sand rule, wind-biased)** | ~4–8 ops/cell/tick | 1 byte/cell (same field) | Drifts and slopes at walls/lee sides; soft mounds |
| 10 | **Falling-sand snowfall CA (down / down-left / down-right)** on screen buffer | ~3 reads + 1 write per occupied pixel | framebuffer only | Side-view piles; in top-down only useful for snow sliding off roofs/ledges in elevation views |
| 11 | **Fizzlefade (LFSR) coverage reveal** | ~3 ops per revealed pixel | 4 bytes (register) | Uniform speckled arrival/departure of snow; deterministic |
| 12 | **"Erase with noise" print/trail fade** | 1 RNG+compare per print pixel per tick | none | Ragged dissolve of tracks vs. uniform alpha |

Notes: costs are my estimates from operation counts; not benchmarked. For Godot web, items 1–4 belong in shaders; 6/7/9 on CPU over a tile-resolution grid around the player (e.g. 64×64 cells = 4 KB at 1 B/cell, update a few hundred cells per frame round-robin), uploaded as a small texture each tick and rendered with #2.

---

## Overall gaps
- shadertoy.com, fabiensanglard.net/fizzlefade, dwitter search: blocked by session allowlist; dwitter pages are JS-rendered.
- No concrete C64/Amiga snow source code or codebase64 article found; pouet comments lack technique detail.
- No verified snow tweetcart with char count.
- No game-specific source for footprint ring buffers / palette-index prints (designs above are inferences).

## Sources
- https://fabiensanglard.net/doom_fire_psx/
- https://thales17.srht.site/posts/doom_fire.html
- https://github.com/filipedeschamps/doom-fire-algorithm (from CONTEXT, not fetched)
- https://gist.github.com/berk76/411c7ea62d890a5a6584a3ec9bbe5308
- https://solhsa.com/gp2/ch04.html
- https://www.lexaloffle.com/bbs/?pid=84926
- https://www.lexaloffle.com/bbs?tid=37886
- https://swag.bttr-software.de/EGAVGA/0124.PAS.html
- https://www.pouet.net/prod.php?which=22358
- https://www.pouet.net/prod.php?which=84835
- https://www.pouet.net/prod.php?which=64860
- https://www.pouet.net/prod.php?which=1161
- https://www.pouet.net/prod.php?which=4112
- https://www.pouet.net/prod.php?which=102819
- https://www.pouet.net/topic.php?which=10577
- https://files.scene.org/view/demos/compos/xmas98_256b/snow1.zip
- https://chibiakumas.com/forum/viewtopic.php?p=533
- https://nullprogram.com/blog/2011/06/13/
- https://godotshaders.com/shader/let-it-snow/
- https://godotshaders.com/shader/multilayer-snowfall-shader/
- https://191brian.itch.io/tic-80-snow-demo
- https://www.dwitter.net/h/particles
- https://beta.dwitter.net/d/12739
- https://dcmpx.remotevs.com/com/effectgames/www/PL/effect/article-Q_A_with_Mark_J_Ferrari.html
- https://www.wikiwand.com/en/articles/Color-cycling
- https://en.wikipedia.org/wiki/Ordered_dithering
- https://antirez.com/news/113
- https://datagenetics.com/blog/november12017/index.html
