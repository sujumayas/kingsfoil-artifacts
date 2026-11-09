# 08 — Tiny-code, demoscene and old-school tricks for trees, foliage, forests, wind and birds

Researcher angle: the cheapest "DOOM-fire-class" tricks: recursive trees in tiny code, Mark Ferrari colour cycling, SNES/GBC hardware tricks (priority bits, HDMA line scroll, palette swaps), row-offset wind sway, palette seasons, tiny boids, cheap dappled light. Ends with a ranked cost table.

Method note: canvascycle GitHub pages were blocked for WebFetch (allowlist). I used the README on raw.githubusercontent and the live demo's own JS and scene JSON on effectgames.com, parsed with a local script (numbers below marked **[measured]**). No images were viewed or copied.

---

## Q1. Recursive fractal trees and procedural pixel trees in tiny code

### Takeaway
A full wind-blown tree fits in 140 characters of JS. One recursive function draws one segment, recurses with thickness ×0.97 and a new angle, and forks with a ×0.6 child after N steps. It switches to "leaf" colour once thickness < 2 px. Wind is one `sin(t + counter)` term added to every segment angle. The counter gives each branch its own phase, so the motion ripples up the tree. That is the whole algorithm. For top-down pixel art it is best used **offline/at load time** to bake sprite variants, not per frame.

### Cited findings
- **Windy Tree dweet** by KilledByAPixel (Frank Force), dwitter.net/d/29719. It was r/tinycode "Dweet of the Week" (Apr 2024). Verbatim code ([r/tinycode mirror](https://redlib.ssps.io/r/tinycode/comments/1bwmidr/dweet_of_the_week_windy_tree_by_killedbyapixel)):
  ```js
  e=c.width|=F=(X,Y,Z,A,B=0,L=Z>2)=>
      x.fillRect(X,Y,z=L?Z*F(X-S(A)*Z,Y-C(A)*Z,Z*.97,A*.99+S(t+e)/149,++B):e%5*4,z,
      x.fillStyle=R(L?Z*4:99,L?Z:239/Z))
      |B>9&&F(X,Y,Z*.6,A/2+2*S(++e))||2
  F(960,1e3,31,0)
  ```
  How it works, per that thread:
  - Each call draws one rect (a branch segment) and recurses from the segment end with `Z*.97` thickness.
  - After counter `B>9` it spawns a second branch at `Z*.6`.
  - When `Z<=2` (`L` false) it draws small green "leaf" rects.
  - Wind is `S(t+e)/149` added to the angle, where `e` increments per call, so each branch gets a different phase.
  - The tree starts at bottom centre with trunk thickness 31.
  - Colour is `R(r,g,b)` driven by thickness: thick = brown, thin = green. That is a **thickness-to-colour ramp**, which gives free 2–3 tone shading.
- Dwitter limit is **140 chars**, canvas 1920×1080, `t` = seconds, `S`/`C` = sin/cos, `x` = 2D context ([Frank Force, Dissecting a Dweet #1](https://frankforce.com/?p=6232)).
- PICO-8 "tweetcarts" have a **280-char** limit. Examples:
  - **TweeTree** (rhiz, Ludum Dare 46): a growing branching tree game in 279 chars. Commenters call it an L-system or binary tree. Very large trees slowed PICO-8 and dropped inputs ([LD46 page](https://ludum-dare.foon.uk/games/46/196970)).
  - **Plane Ride** tweetcart: landscape from Voronoi/Chebyshev cells. It renders one new column per frame and shifts the screen 1 px, with cloud shadows done by redrawing pixels offset ([Lexaloffle BBS](https://lexaloffle.com/bbs/?pid=153803)). That is a cheap "scrolling world" pattern.
- PICO-8 constraints these carts live in ([manual](https://www.lexaloffle.com/dl/docs/pico-8_manual.html)):
  - 128×128 px with a fixed 16-colour palette.
  - `pal(c0,c1,p)`: p=0 draw palette, p=1 display palette (remaps the whole screen at end of frame), p=2 secondary palette for fills.
  - `fillp()` is a 16-bit 4×4 two-colour pattern.
  - CPU is "4M vm insts/sec".
- Classic recursion background: [Wikipedia Fractal canopy](https://en.wikipedia.org/wiki/Fractal_canopy) (not fetched). Rosetta/secretgeek pages list the 2-branch form: `branch(len, angle){ line; branch(len*r, a+θ); branch(len*r, a−θ) }` ([secretgeek](https://wiki.secretgeek.net/tree-fractal), from search results only).

### Inferences (not cited) — tiny pixel-tree recipes for a top-down game
- **Blob-cluster canopy (cheapest good-looking tree, 3 colours):**
  ```
  for k in 0..N (N=5–9): cx=r*cos(k*2.4)*rand, cy=…*0.7 (squash for 3/4 view)
     fill disc(cx,cy,rk) with DARK
  for each disc: fill disc(cx-1,cy-1,rk-1) with MID       // light from top-left
  for each disc: fill disc(cx-2,cy-2,rk/2) with LIGHT, masked by hash(x,y)&3 (dither speckle)
  trunk: 2–4 px rect, BARK_DARK; 1 px BARK_LIGHT on lit side
  ```
  The golden-angle placement (2.4 rad) avoids clumping. Shading is "same disc, offset toward the light, shrunk". It costs about 3 disc fills per cluster. A 32×32 tree is ~3×1,000 px writes, done once at load.
- **Thickness/depth → palette index** (as in the dweet) gives bark→leaf colouring without lighting maths.
- **Noise shading:** `idx = base + (hash(x>>1,y>>1) > threshold(depth))` gives a 2-tone ordered speckle. Use a Bayer 4×4 threshold for pixel-art-clean results (same trick as study #1 Snow's dither threshold).
- Generate 8–16 variants per species at load with a seeded RNG and pack them into an atlas. Runtime cost is then zero beyond a normal sprite.

### Gaps
- Could not fetch individual dwitter pages (only the mirror thread) or find a specific PICO-8 "tree" tweetcart with code on Lexaloffle within budget.
- Pouet search returned no tree-specific 256b/1k intro with documentation. Only a generic "fract128" Atari ST 128b entry turned up ([scene.org](https://files.scene.org/view/parties/2018/sillyventure18/atari_st_128b/fract128.zip)), unverified content. Demoscene tree intros remain a gap.

---

## Q2. Mark Ferrari's forest scenes in Canvas Cycle

### Takeaway
Canvas Cycle has **six forest/jungle scenes**: Deep Forest (Day/Rain), Winter Forest (Snow), Forest Edge (Day), Jungle Waterfall (×4), plus swamps. In the forest scenes, colour cycling animates water, rain, snow and probably light/leaves, while the canopy itself is mostly static. Ferrari's foliage trick is subtle:
- A **1-px edge band of 2 "clown colours"** runs along leaf edges.
- The band holds a gradient that blends leaf colour into background colour.
- When cycled, the leaf seems to grow and shrink by 1 px, so it sways.
- Bands in different parts of the tree are phase-offset so the tree doesn't move "like a metronome".

That is a **zero-cost-per-frame foliage sway** for indexed art: only palette entries change.

### Cited findings
- Engine facts ([canvascycle README, raw](https://raw.githubusercontent.com/jhuckaby/canvascycle/master/README.md)):
  - 35 of Ferrari's 640×480 scenes, one flat image with one 256-colour palette and "no layers or alpha channels".
  - The source art is Amiga IFF/ILBM files made in Deluxe Paint, about 100 KB per scene as gzip JSON.
  - Optimisation: pixels referencing animated colours are pre-collected, and only those are redrawn. FPS is capped at 60.
  - Huckaby's **BlendShift** fades between adjacent cycle colours to create in-between frames.
- Cycling maths ([palette.js on the live demo](https://www.effectgames.com/demos/canvascycle/palette.js)) **[measured from source]**:
  - `CYCLE_SPEED = 280`, `PRECISION = 100`.
  - Steps per second = `rate/280`. Offset = `(time_ms/(1000/stepsPerSec)) mod size`.
  - `reverse` modes: 0 fwd, 2 reverse, 3 ping-pong, 4/5 sine-wave amplitude size/4 or size/2.
  - BlendShift = `shiftColors` then `fadeColor(c[j+1], c[j], frac*100)` across the range.
- Scene list ([scenes.js](https://www.effectgames.com/demos/canvascycle/scenes.js)) **[measured]**. Forest/jungle/swamp entries:
  - V30 "Deep Forest – Day"
  - V30RAIN "Deep Forest – Rain"
  - V26SNOW "Winter Forest – Snow"
  - V09 "Forest Edge – Day"
  - V08AM/V08/V08PM/V08RAIN "Jungle Waterfall" (Morning/Afternoon/Night/Rain)
  - V03 "Swamp Cathedral – Day"
  - V10 "Deep Swamp – Day"

  See it in action: [demo](https://www.effectgames.com/demos/canvascycle/) and [Google Experiments page](https://experiments.withgoogle.com/canvas-cycle).
- Cycle data parsed from `images/<name>.LBM.json` **[measured, my parsing]**:

  | Scene | Active cycles (low–high @ rate) | Animated px | Animated colours | Colours used |
  |---|---|---|---|---|
  | Deep Forest – Day (V30) | 196–201@4224, 202–207@3456, 208–215@2457, 216–223@2457 | 11,181 / 307,200 = **3.6 %**, all in rows y 264–477 (lower half, inferred stream/ground water) | 28 | 190 |
  | Deep Forest – Rain (V30RAIN) | same 4 + five 5-colour ranges 144–173 @4914 (rain) | 51,656 = **16.8 %** | 58 | 221 |
  | Winter Forest – Snow (V26SNOW) | six 10-colour ranges 160–219 @4914 (snow paths) | 59,657 = **19.4 %** | 60 | 216 |
  | Forest Edge – Day (V09) | 10 ranges; one (232–239 @3609) spans x 0–639, y 99–479 (2,851 px scattered over whole image, inferred light glints or leaf sparkle); the rest clustered around x 160–400, y 297–395 (inferred water) | — | — | — |

  At `rate/280`: 2457 is ≈ 8.8 colour steps/s, 4224 ≈ 15 steps/s, and 4914 ≈ 17.6 steps/s (rain/snow).
- Ferrari's own words ([Q&A with Mark J. Ferrari, effectgames mirror](https://dcmpx.remotevs.com/com/effectgames/www/PL/effect/article-Q_A_with_Mark_J_Ferrari.html)):
  - **Foliage sway:** a 1-px line of two "clown colors" on each side of the leaf edge, filled with stencilled gradients mixing leaf and background colours. As bands move, the leaf "expands and shrinks", appearing to sway 1 px. He offsets gradient timing in different parts of the foliage so the tree doesn't move "like a metronome". The same edge technique gives wavering reflections (Mountain Mirror Pond).
  - **Rain/snow:** a contrasting dot/dash on a long path of opaque colours matched to the background. Gradients use "no dither". These are baked only into rain/snow versions, and the palette space is reused otherwise.
  - Patterned (ordered) dither is his default. Diffusion dither is only for chaotic texture like foam.
  - He leaves palette rows free for effects. One image had nearly half of its 256 colours unused.

### Inferences
- For Asterion-style tiles: reserve **2 palette indices per leaf-edge band** (or 4–6 for a slower gradient). Paint 1-px rims on canopy clusters with them, and cycle them at ~2–4 steps/s. Use 2–3 bands with different phases per tree type for desync.
- In Godot this is a palette-LUT shader: index texture → `texelFetch(palette, idx + offset(t))`. Cost is 2 texture fetches per pixel and no CPU. The same palette texture also serves seasons (Q5).
- Deep Forest's measured numbers show Ferrari animated **only ~3.6 % of pixels**. A forest feels alive with very little motion if the motion sits on water and light.

### Gaps
- I did not visually confirm which V09 pixels are leaves vs light. That is an inference from spatial spread. A human should eyeball the demo.

---

## Q3. SNES/GBA/GBC hardware tricks

### Takeaway
1. **Priority bit per tile** lets sprites walk under canopy tiles for free (GBC/SNES). Transparent colour 0 always shows the sprite, so leaf gaps reveal the player.
2. **HDMA writes a new horizontal scroll per scanline.** A 224-entry offset table becomes a wave or sway of a whole background layer, with no CPU cost per line.
3. **CGRAM per-scanline writes** give colour gradients.
4. Seasons use **palette swaps** (fan-documented for ROM hacks; official games are only described visually).

### Cited findings
- **GBC BG priority** ([pret/pokecrystal wiki](https://github.com/pret/pokecrystal/wiki/Allow-map-tiles-to-appear-above-sprites-(so-NPCs-can-walk-behind-tiles)-with-PRIORITY-colors)):
  - Each BG tile attribute byte has bit 7 = priority, so tile colours 1–3 draw above sprites.
  - Colour 0 is never above sprites, so the lightest hue becomes "see-through" like tall grass.
  - The low 3 bits pick one of 8 BG palettes.
  - The hack stores 1 byte per tile colour, which doubles ROM for palette maps.
- **SNES HDMA wave/scroll** ([snes.nesdev wiki HDMA examples](https://snes.nesdev.org/wiki/HDMA_examples)):
  - Each table entry is a line-count byte. 0x81–0xFF means "repeat: write every scanline for (n−0x80) lines". Max 127/128 lines per entry, so 224 lines need 2 entries (127+97).
  - A BG1HOFS example uses DMA pattern 2 (write-twice register). An indirect example points five 48-line entries at one **48-word sine table** (amplitude 16.5) to tile the wave.
  - Gradients come from two channels writing CGADD and CGDATA on the same lines (28 two-line steps).
  - Rule: update tables only in VBlank.
- **OpenSNES HDMA wave example** ([docs](https://k0b3n4irb.github.io/opensnes/examples_graphics_effects_hdma_wave.html)):
  - 7 amplitude levels (0–24 px), each table 335 entries × 3 bytes (224 visible + 111 wrap) = 1,006 B, 7,042 B total ROM.
  - One sine period = 112 lines.
  - Per frame: `phase=(phase+1)%112` and set the channel source address to `phase*3`, a few register writes. Animation is done by **moving the table pointer**, not by rewriting the table.
- HDMA uses ([SnesLab HDMA](https://sneslab.net/wiki/HDMA)): horizontal waves via BG1HOFS (water), vertical waves via BG1VOFS (fire), gradients via CGADD/CGDATA/COLDATA, and parallax.
- **Seasons by palette swap:**
  - Pokémon Emerald hack "Emerald Crest" swaps palettes dynamically by season. Autumn grass shares the tree palette, and seasons can change every 2 days or follow the real clock ([r/PokemonROMhacks](https://reddit.fabiomanganiello.com/r/PokemonROMhacks/comments/1fxas5s/adding_seasons_to_my_hack_emerald_crest)).
  - Pokémon Black/White (DS): each season lasts one month, cycling Spring→Summer→Autumn→Winter. Autumn trees turn brown, and winter adds snow that opens new paths ([PokémonDB](https://pokemondb.net/black-white/seasons)). Implementation is not documented there. Winter clearly uses tile/map changes, not just palettes.
- **Birds / sprites:** the sprite-limit page on snes.nesdev was blocked (allowlist), so the 128-sprite / 32-per-line figures are unverified here. In film, *Batman Returns* (1992) bat swarms used a **wrap box just outside the view**: bats leaving it reappear on the opposite side ("bat teleportation") ([befores & afters](https://beforesandafters.com/2022/04/07/a-history-of-cg-bird-flocking/)). That trick suits screen-local bird flocks well.

### Inferences
- Godot equivalents:
  - **Priority bit** = a separate "canopy" TileMapLayer with higher z, drawn above the player. Canopy holes = alpha 0, the analogue of colour 0.
  - **HDMA line scroll** = a fragment shader `uv.x += table[int(FRAGCOORD.y)+phase]`. Use a 1D texture or a `sin`, quantised to integer px. Cost is 1 extra texture fetch per pixel, or zero when computed.
  - **HDMA CGRAM gradient** = a vertical tint gradient. In top-down this is not useful for depth. It can serve "sun-side vs shade-side" bands.
- Sprite multiplexing (reusing hardware sprite slots down the screen) has no direct analogue in Godot. The lesson is "birds are 1–4 px, reuse 1 texture, batch". With MultiMesh or batched Sprite2D sharing one atlas, 100 birds ≈ 1 draw call.

### Gaps
- Harvest Moon SNES seasonal tile/palette storage is not documented on Data Crystal (stub) ([datacrystal](https://datacrystal.tcrf.net/wiki/Harvest_Moon_(SNES))). No ALttP canopy-priority write-up was fetched. SNES sprite limits could not be verified (blocked).

---

## Q4. Row-offset (scanline) wind sway

### Takeaway
The cheapest sway is: `x_offset = round(A * w(y) * sin(t*ω + y*k + φ_tree))`.
- `w(y)` is 0 at the trunk base and rises toward the crown.
- The result is rounded to **integer pixels**.
- It is applied per sprite **row** (or per 2–4-row band).

With A = 1–2 px this reads as a pixel-pure lean or rustle. It is the HDMA trick moved into a sprite shader.

### Cited findings
- **"2D Pixel perfect wind & sway effect"** ([godotshaders](https://godotshaders.com/shader/2d-pixel-perfect-wind-sway-effect/)), Godot 4.x, needs REGION_RECT exposure (author says merged for **Godot 4.5**):
  - UV is snapped with `floor(local_uv*region_size_px)/region_size_px`.
  - Sway = `max(0,1-uv.y-start)*sin(TIME*speed)`, a linear height ramp that is constant within each texel row.
  - Wind uses 2D noise on the snapped grid, masked by `step(uv.y, 1-height_start)`.
  - Defaults: sway_strength 0.5, sway_speed 0.5, wind_scale 10, wind_speed 0.1.
  - Note: the final offset is **not** snapped.
- **"Wind with pixel snapping"** ([godotshaders](https://godotshaders.com/shader/wind-with-pixel-snapping/)):
  - Phase comes from world x in the vertex stage (`sin(worldPos.x)`), so neighbours desync.
  - The offset is quantised by dividing by TEXTURE_PIXEL_SIZE, rounding, and multiplying back.
  - `windCutoff` (default 8) masks the base.
  - Colour is nudged `COLOR.rgb += windOffset*0.15` so displaced pixels brighten, a cheap "leaf flip" highlight.
  - Defaults: windStrength 1, windSpeed 1, windDirection 0.5.
- SNES analogue: a per-scanline BG1HOFS table and a moving table pointer (Q3 sources).

### Inferences (recipe)
```
// canvas_item, Compatibility-safe
uniform float amp_px = 1.0;      // 1–2 px max for pixel purity
uniform float band = 2.0;        // rows per band (1 = per row, 4 = chunky)
uniform float k = 0.35;          // phase per band → ripple travels up
float row  = floor(UV.y / TEXTURE_PIXEL_SIZE.y / band);
float h    = clamp((trunk_row - row*band)/crown_h, 0., 1.);  // 0 at base
float off  = round(amp_px * h * sin(TIME*speed + row*k + tree_phase));
UV.x -= off * TEXTURE_PIXEL_SIZE.x;
```
- Cost: ~6 ALU per pixel and 1 sample. No extra texture. Works on WebGL2.
- Per-tree phase can come from an instance hash or vertex world position.
- Also make it **gust-driven**: `amp = base + gust(t, x_world)`, where gust is a slow noise or travelling front. A gust then rolls across the forest (a "wind front" sweep), which reads much better than uniform sine.
- **CPU alternative:** precompute 4–8 sway frames per tree by row-shifting the sprite at load (the offset table is a few bytes) and pick the frame by `(t + phase)`. That is zero shader cost, at 4–8× atlas memory per variant.
- Integer offsets on the canopy only. Keep the trunk rows at 0 to avoid "rubber trunk".

### Gaps
- No primary source found for a classic 2D game that sways tree sprites per row (most SNES uses were water/heat). Validate with artists that 1-px row sway on canopies reads well in top-down 3/4.

---

## Q5. Palette tricks for seasons

### Takeaway
Draw each tree **once in indexed colour**. Make **4+ palettes** (spring, summer, autumn, winter, plus per-species autumn variants). Pick the palette per tree at draw time. Stagger the change by giving each tree its own `turn_time = season_start + hash(tree)*spread`. During the transition, blend palette A→B with an **ordered-dither mask** (pixel-pure, as in study #1 Snow), not alpha.

### Cited findings
- Emerald Crest hack ([reddit](https://reddit.fabiomanganiello.com/r/PokemonROMhacks/comments/1fxas5s/adding_seasons_to_my_hack_emerald_crest)): seasons are dynamic palette swaps, and grass shares the tree palette in autumn.
- PICO-8's `pal(c0,c1,1)` display palette remaps the whole screen at end of frame. The manual suggests it for fades ([manual](https://www.lexaloffle.com/dl/docs/pico-8_manual.html)). This is the tiny-code version of a global season or time-of-day remap.
- Canvas Cycle palette `fade(destPalette, frame, max)` fades a whole palette toward another per entry ([palette.js](https://www.effectgames.com/demos/canvascycle/palette.js)). Ferrari's rain/snow variants are separate baked images sharing structure ([Q&A](https://dcmpx.remotevs.com/com/effectgames/www/PL/effect/article-Q_A_with_Mark_J_Ferrari.html)).
- Pokémon B/W: monthly seasons, autumn browns, winter snow with map changes ([PokémonDB](https://pokemondb.net/black-white/seasons)).

### Inferences (recipe)
- Palette texture: rows = palettes (species × season, e.g. 8 species × 6 states = 48 rows × 16 colours), so 1 small texture serves all. Per-instance `pal_row` and `pal_row_next`.
- Transition with an `p` per tree going 0→1 over ~1–3 in-game days:
  ```
  use_next = bayer4(FRAGCOORD.xy) < p
  ```
- Leaf-by-leaf feel: bias `p` by the index's luminance (light leaves turn first) or by height. The crown turns before the lower branches, which costs nothing.
- Winter bare trees cannot come from a palette alone, since leaf pixels must disappear. Map the leaf indices to transparent in the winter palette (colour 0 trick). The trunk/branch layer must already exist under the canopy, so paint branches beneath the leaves in the indexed sprite. Snow caps: map the top-lit leaf indices to white instead of transparent.
- Blossom: map the "highlight" leaf index to pink in the spring palette. One index gives you a blossom speckle.

### Gaps
- No primary dev source for how Harvest Moon/Stardew/B&W store seasonal tree art (Stardew is known to use separate seasonal sheets, not verified here).

---

## Q6. Tiny boids and pixel birds

### Takeaway
Boids is 3 rules (separation, alignment, cohesion) over local neighbours. Reynolds made it in 1986 and published at SIGGRAPH 1987. For ambient pixel birds you need only ~20–40 birds per flock. Brute-force O(n²) is fine at that scale (40² = 1,600 pair checks ≈ microseconds). Draw each bird as a 3–5 px "V" with 2 frames (wings up "v", wings flat "—"). Add a 1-px shadow offset on the ground for top-down.

### Cited findings
- Boids by Craig Reynolds, 1986, SIGGRAPH 1987 paper. Rules ([Wikipedia via Wikiwand](https://www.wikiwand.com/en/articles/Boids)):
  - **Separation:** avoid crowding neighbours.
  - **Alignment:** steer toward the average heading.
  - **Cohesion:** steer toward the average position of local flockmates.

  Ichiro Aoki's related work dates from 1982. *Half-Life* (1998) used boids for the Xen flyers, named "boid" in its files.
- First film use: *Stanley and Stella in: Breaking the Ice* (1987). *Batman Returns* (1992) bats used boids. The off-screen wrap box ("bat teleportation") kept the swarm in frame ([befores & afters](https://beforesandafters.com/2022/04/07/a-history-of-cg-bird-flocking/)). The same source cites 10,000 fish at 60 fps on a PS3 as a scale reference.

### Inferences (minimal code, roughly 600–900 B of JS)
```js
for(a of B){let cx=0,cy=0,vx=0,vy=0,sx=0,sy=0,n=0;
 for(b of B){let dx=b.x-a.x,dy=b.y-a.y,d=dx*dx+dy*dy;
  if(b!=a&&d<R2){n++;cx+=dx;cy+=dy;vx+=b.vx;vy+=b.vy;if(d<S2){sx-=dx;sy-=dy}}}
 if(n){a.vx+=cx/n*.005+(vx/n-a.vx)*.05+sx*.05;a.vy+=cy/n*.005+(vy/n-a.vy)*.05+sy*.05}
 a.vx+=(tx-a.x)*.0005; a.vy+=(ty-a.y)*.0005;   // weak goal/home pull = keeps flock on screen
 clamp speed; a.x+=a.vx; a.y+=a.vy}
// draw: frame=(t*8+a.id)&1 ? "V" : "—"  (3x2 px)  + shadow px at (x+h, y+h*0.5)
```
- Typical params: R = 24 px, S = 6 px, max speed 1–1.5 px/frame at 60 fps.
- **"Take-off when player approaches":**
  - Perched birds are static sprites with a 2-frame idle peck.
  - When the player gets within ~3 tiles, switch each bird to boids mode. Give it initial velocity away from the player plus a random 0–200 ms delay per bird, so the scatter staggers.
  - Add a goal far off-screen, then despawn. Or use the bat-teleport wrap box to recycle birds into a distant flock.
- Cost per bird per frame: O(n) neighbour checks (~10 ops each). 40 birds ≈ 16 k ops/frame, trivial. Use a spatial grid only when > 200 birds.
- Height illusion in top-down: draw the bird at `(x, y − h)` and the shadow at `(x, y)`. Shadow size and alpha shrink with height.

### Gaps
- No js1k/dwitter boids entry with verified byte count was fetched. The code size above is an estimate.

---

## Q7. Dappled light cheaply

### Takeaway
Three cheap routes:
- **(a)** A few additive or palette-brightening "light spot" sprites (2–4 px blobs) under the canopy, drifting with the same sway phase as the canopy.
- **(b)** A canopy shadow mask (tree sprite silhouette, offset to the light direction) with **holes punched by a Bayer threshold of animated noise**. The holes are the sunflecks.
- **(c)** Palette-shift in shade: the ground under the shadow uses index−1 (darker ramp), and flecks use index+0. Pixel-pure, no alpha.

### Cited findings
- Ferrari's Forest Edge scene has one cycle range (8 colours @3609 ≈ 12.9 steps/s) whose pixels are **scattered over the whole image** (2,851 px). This suggests sparkle or glint pixels driven purely by palette **[measured; interpretation is my inference]** ([scene JSON](https://www.effectgames.com/demos/canvascycle/images/V09.LBM.json)).
- Ferrari's palette approach puts effects only into reserved palette rows ([Q&A](https://dcmpx.remotevs.com/com/effectgames/www/PL/effect/article-Q_A_with_Mark_J_Ferrari.html)).
- "Wind with pixel snapping" brightens displaced pixels (`COLOR += offset*0.15`), so sway and light flicker are coupled for free ([godotshaders](https://godotshaders.com/shader/wind-with-pixel-snapping/)).

### Inferences
- **Fleck-by-palette-cycle:** paint ground under trees with 2 reserved indices, A (shade) and B (fleck). Cycle B through `[shade, shade, mid, bright, mid, shade]` with per-spot phase. This is Ferrari's method applied to sunflecks, at ~0 runtime cost.
- **Shadow mask shader:**
  ```
  shade = shadowTex(world) > 0 && noise(world*0.1 + wind*t) < bayer4(px)
  ```
  Then pick index−1 for shaded ground. Cost: 1 texture fetch + 1 noise lookup per ground pixel.
- Link fleck motion to the canopy's sway phase so light and leaves feel physically tied.

### Gaps
- No primary game write-up on dappled light in 2D pixel games found in budget (other researchers may cover it).

---

## Q8. Ranking: the cheapest techniques (approximate, mostly inference)

Costs assume Godot 4 Compatibility/WebGL2, a 320×180–480×270 internal resolution, and ~200 trees on screen.

| # | Technique | Runtime cost | Memory | Look / value | Primary source |
|---|---|---|---|---|---|
| 1 | **Canopy-on-top layer + transparent holes** (GBC priority bit analogue) | 0 extra; 1 more layer draw | 1 layer | Walk-under canopy, essential | [pokecrystal wiki](https://github.com/pret/pokecrystal/wiki/Allow-map-tiles-to-appear-above-sprites-(so-NPCs-can-walk-behind-tiles)-with-PRIORITY-colors) |
| 2 | **Palette-row swap for seasons/species** (indexed sprite + palette texture) | 2 tex fetches/px (index + LUT) | 16 colours × N rows (a few KB) | 1 sprite → 4–6 seasons × species | [Emerald Crest](https://reddit.fabiomanganiello.com/r/PokemonROMhacks/comments/1fxas5s/adding_seasons_to_my_hack_emerald_crest) |
| 3 | **Per-tree staggered palette change** (hash-offset turn time) | +1 compare/px | 1 float/instance | Forest turns gradually | inference |
| 4 | **Ordered-dither palette transition** (Bayer 4×4 vs p) | +~4 ALU/px | 16-entry const | Pixel-pure crossfade | PICO-8 fillp / study #1 |
| 5 | **Colour-cycled leaf-edge rims** (Ferrari 1-px clown bands) | 0/px on palette HW; palette-LUT shader: 1 extra add/px; CPU: rewrite ~2–6 palette entries/frame | 2–6 indices per band | Subtle "living" rustle, desynced | [Ferrari Q&A](https://dcmpx.remotevs.com/com/effectgames/www/PL/effect/article-Q_A_with_Mark_J_Ferrari.html) |
| 6 | **Integer row/band-offset sway** (HDMA-style) | ~6 ALU + 1 fetch/px | 0 (or 224-entry table) | Pixel-pure lean/ripple; gusts | [HDMA examples](https://snes.nesdev.org/wiki/HDMA_examples), [pixel-perfect sway](https://godotshaders.com/shader/2d-pixel-perfect-wind-sway-effect/) |
| 7 | **Pre-baked 4–8 sway frames** (row-shifted at load) | 0 shader; frame index/tree | 4–8× atlas per variant | Same as #6, for any renderer | inference |
| 8 | **Fleck palette cycle under trees** | ~0 | 2 indices | Sunflecks twinkle | Ferrari / V09 data |
| 9 | **Shadow mask + animated Bayer holes** | 1–2 fetch + noise/px on ground | 1 shadow mask | Dappled shade that drifts with wind | inference |
| 10 | **Load-time procedural trees** (recursive or blob-cluster, seeded) | 0 at runtime; ~1–5 ms per tree at load | Atlas 8–16 variants/species | Infinite variety, consistent style | [Windy Tree dweet](https://redlib.ssps.io/r/tinycode/comments/1bwmidr/dweet_of_the_week_windy_tree_by_killedbyapixel) |
| 11 | **V-pixel birds, 2-frame flap + shadow** | 1 batched quad each | 1 tiny atlas | Life in the sky for ~nothing | inference |
| 12 | **Tiny boids (brute force, n ≤ 40)** | n² × ~10 ops ≈ 16 k ops/frame | 6 floats/bird | Natural flocks | [Boids](https://www.wikiwand.com/en/articles/Boids) |
| 13 | **Wrap box ("bat teleport") for flocks** | 2 compares/bird | 0 | Endless flock with few birds | [befores & afters](https://beforesandafters.com/2022/04/07/a-history-of-cg-bird-flocking/) |
| 14 | **Runtime recursive tree with sin wind** (dweet style) | ~2^depth segments/frame (hundreds to thousands of rects per tree) | 0 | Gorgeous for 1 hero tree only; too costly for forests | dweet |

Key insight: Ferrari animated only **3.6 %** of pixels in "Deep Forest – Day" (water only). Rain or snow raised that to 17–19 % **[measured]**. A "living" forest needs very little motion if it is placed well: rims, water, flecks and the odd bird.

---

## Sources
- canvascycle README (raw): https://raw.githubusercontent.com/jhuckaby/canvascycle/master/README.md
- Canvas Cycle live demo, scenes.js, palette.js, scene JSON: https://www.effectgames.com/demos/canvascycle/ , https://www.effectgames.com/demos/canvascycle/scenes.js , https://www.effectgames.com/demos/canvascycle/palette.js , https://www.effectgames.com/demos/canvascycle/images/V30.LBM.json (also V30RAIN, V26SNOW, V09, V08AM)
- Canvas Cycle on Google Experiments: https://experiments.withgoogle.com/canvas-cycle
- Q&A with Mark J. Ferrari (effectgames mirror): https://dcmpx.remotevs.com/com/effectgames/www/PL/effect/article-Q_A_with_Mark_J_Ferrari.html
- Windy Tree dweet (dwitter.net/d/29719) via r/tinycode mirror: https://redlib.ssps.io/r/tinycode/comments/1bwmidr/dweet_of_the_week_windy_tree_by_killedbyapixel
- Frank Force, Dissecting a Dweet #1: https://frankforce.com/?p=6232
- TweeTree LD46: https://ludum-dare.foon.uk/games/46/196970
- Plane Ride tweetcart: https://lexaloffle.com/bbs/?pid=153803
- PICO-8 manual: https://www.lexaloffle.com/dl/docs/pico-8_manual.html
- snes.nesdev HDMA examples: https://snes.nesdev.org/wiki/HDMA_examples
- OpenSNES HDMA wave: https://k0b3n4irb.github.io/opensnes/examples_graphics_effects_hdma_wave.html
- SnesLab HDMA: https://sneslab.net/wiki/HDMA
- pokecrystal priority-colour tutorial: https://github.com/pret/pokecrystal/wiki/Allow-map-tiles-to-appear-above-sprites-(so-NPCs-can-walk-behind-tiles)-with-PRIORITY-colors
- Emerald Crest seasons: https://reddit.fabiomanganiello.com/r/PokemonROMhacks/comments/1fxas5s/adding_seasons_to_my_hack_emerald_crest
- Pokémon B/W seasons: https://pokemondb.net/black-white/seasons
- Harvest Moon Data Crystal (stub): https://datacrystal.tcrf.net/wiki/Harvest_Moon_(SNES)
- Boids (Wikiwand): https://www.wikiwand.com/en/articles/Boids
- History of CG bird flocking: https://beforesandafters.com/2022/04/07/a-history-of-cg-bird-flocking/
- Godot pixel-perfect wind & sway: https://godotshaders.com/shader/2d-pixel-perfect-wind-sway-effect/
- Godot wind with pixel snapping: https://godotshaders.com/shader/wind-with-pixel-snapping/
- Blocked or not fetched: github.com/jhuckaby/canvascycle (allowlist), snes.nesdev.org/wiki/Sprites (allowlist), en.wikipedia.org/wiki/Boids (allowlist; used Wikiwand), dwitter.net pages directly.
