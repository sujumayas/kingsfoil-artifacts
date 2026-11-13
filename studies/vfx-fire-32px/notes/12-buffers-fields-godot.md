# 12. Buffers and fields against art resolution, and the Godot path

Researcher 12, 13 Nov 2026. Scope items 1 (technical side), 2, 7 and 8. About 33 tool calls.

Tags: [C] cited from a page or file opened in this session. [M] measured by me with `scratch-12/doomheight.js`, `doomheight2.js` and `gather.js` (Node, Apple M4 Pro, 96-column buffers, 900 to 1,000 frames after a 400 to 500 frame warm-up, xorshift RNG). [I] my inference or arithmetic. [K] known from memory, URL given but not re-read today.

All sizes assume 32x32 px tiles, a 640x360 view (20 x 11.25 tiles, 230,400 art pixels) and 24x32 px characters unless stated. "1:1" means one buffer cell per art pixel, "1:2" one cell per 2x2 art pixels.

What I do not repeat. Godot pixel-perfect settings, whole-texture uploads on Compatibility (`glTexImage2D`, no sub-rectangle), the bilinear-then-threshold measurement, threshold tiles against Bayer, dual grid and blob counts, per-tile data routes into a TileMapLayer shader. All of that is in `studies/vfx-snow-32px/notes/12-field-resolution-godot.md` (Q1, Q3, Q5, Q6). The DOOM rule, palette and Lode/Elias variants are in `studies/vfx-fire/notes/01-roots-classic.md` Q1 and Q2. Godot 4.5 to 4.8 release notes are in `studies/vfx-fire/notes/05-newest-2025-2026.md` Q1.

## Short answer

1. The "72 rows" figure for the DOOM fire is the formula for a clean (double-buffered or GPU) fire. Sanglard's exact in-place loop burns about 32% taller, with a median top at 95 rows [M]. Tune a flame with `H50 = L / p` rows (L heat levels above the cut, p the decay chance per row) on the GPU, and `H50 ≈ 2.6 L` for the exact CPU loop at p = 0.5 [M].
2. Short flames have few levels. A 16 px flame at 1:1 has about 8 levels, and after quantizing to 5 tones a quarter of its pixels are lone single pixels [M]. A 3x3 average at draw time, or a Lode-style averaging kernel, drops that to 0.3% and 0.1% [M]. At 32 px, quantize to the art's 4 to 6 tones and smooth before quantizing. Do not add ordered dither between bands.
3. The spread grid can stay one cell per tile. Draw the front from a per-pixel burn-order threshold, and make it continuous across tiles by interpolating the ignition time bilinearly (1 texel per tile) instead of a per-tile progress [I].
4. PointLight2D on Compatibility is a per-fragment loop over up to 15 lights per canvas item, one atlas fetch each [C]. A baked light texture at 8 px (80x45) is one fetch per pixel for any number of fires and a 3,600 to 14,400 byte upload [I].
5. GPUParticles2D on web costs seconds of shader compile per system on a cold load (2 s per default system, 22 to 25 s per process material reported on 4.7.2) [C]. Use CPUParticles2D or a custom pool for embers on web.
6. DrawableTexture2D shipped in 4.7 (merged 30 Jan 2026), has a GLES3 backend, is still experimental, and has no web-specific issue on the tracker as of today [C]. Nobody has published a web test.

---

## Q1. DOOM fire height as a function of levels and decay

### Takeaway
Each pixel's heat is the source heat minus the number of decays along its chain of copies, one copy per row. In a clean implementation the decays per row are Bernoulli(p), so the flame reaches level c (the lowest visible level) after about `(L - c + 1) / p` rows, with a ragged tip whose spread grows as the square root of the height. Sanglard's in-place loop re-reads some no-decay writes in the same frame, which lowers the effective decay rate to about 0.38 and makes the fire taller than the formula [M].

### Cited findings
- The reference loop is in place, x outer, y inner from the top, with `randIdx = round(random()*3) & 3`, target `src - randIdx + 1 - W`, and decay `randIdx & 1` [C, https://fabiensanglard.net/doom_fire_psx/ ; restated in `studies/vfx-fire/notes/01-roots-classic.md` Q1].
- VFX #6 derived "about 72 rows" as 36 levels at 0.5 decay per row. It was marked as an inference [C, `studies/vfx-fire/notes/01-roots-classic.md` Q1 Inferences].
- Lode's averaging fire divides by 4.03 (`*32/129`). Dividing by 4 rises forever and by 5 dies too fast [C, https://lodev.org/cgtutor/fire.html].

### Measured [M]
Visible means heat at or above level 1. h95 is the row where 95% of columns are still lit (the solid body), h50 the median top, h05 the tallest 5% of tongues. Rows count up from the source row.

| Variant | L | Decay | h95 | h50 | h05 |
|---|---|---|---|---|---|
| Sanglard exact, in place | 36 | `r & 1` | 72 | 95 | 116 |
| Double-buffered CPU (read old, write new) | 36 | `r & 1` | 60 | 73 | 86 |
| GPU-style gather, ping-pong (`gather.js`) | 36 | `r & 1` | 59 | 71 | 87 |
| In place, decay independent of r | 36 | p = 0.5 | 61 | 79 | 97 |
| In place | 16 | `r & 1` | 28 | 41 | 56 |
| In place | 8 | `r & 1` | 12 | 20 | 30 |
| Gather | 16 | `r & 1` | 24 | 32 | 42 |
| Gather | 8 | p = 0.5 | 10 | 16 | 23 |
| In place, decay independent | 36 | p = 0.75 | 43 | 49 | 58 |
| Gather | 36 | p = 0.75 | 42 | 48 | 55 |
| In place, lowest band hidden (cut at level 7) | 36 | `r & 1` | 56 | 71 | 92 |

- The "72 rows" is right for double-buffered and GPU fires (73 and 71). It is the solid-body height (h95 = 72) for Sanglard's exact loop, whose median top is 95.
- Why the in-place loop is taller [I, from reading the loop]. A write with r = 0 (no decay) lands in column x+1, which the loop has not processed yet this frame, so it is read again at once. Decaying writes with r = 1 or 3 land in rows or columns already processed. No-decay values get read more often, so chains decay less than half the time.

### Formulas for a designer [I, checked against the table]
For a clean (double-buffered CPU or GPU gather) fire, with L the source heat, c the lowest visible level, p the chance of a 1-level decay per row, and k the buffer ratio (1 for 1:1, 2 for 1:2):

```
rows to the median tip   R50 = (L - c + 1) / p
flame height in px       H50 = k * R50
tip spread (1 sd, rows)  sd  = sqrt((L - c + 1) * (1 - p)) / p
5% to 95% tongue band    R50 +- 1.645 sd
relative raggedness      sd / R50 = sqrt((1 - p) / (p * R50))
```

- Check: L = 36, c = 1, p = 0.5 gives R50 = 72, sd = 8.5, band 58 to 86. Measured 73, 60 to 86 (double buffer) and 71, 59 to 87 (gather).
- General decay with mean μ and variance σ² per row (for example `rand % (m+1)`, μ = m/2): `R50 = (L - c + 1) / μ`, `sd = sqrt((L - c + 1) * σ² / μ³)`.
- For Sanglard's exact loop at p = 0.5, use `R50 ≈ 2.6 L` (measured 2.64 L at L = 36, 2.56 at 16, 2.5 at 8) and `R95 ≈ 2 L` at L = 36.
- Inverse, to get a flame of H px: choose p for the raggedness you want, then `L = p * H / k + c - 1`.

| Flame (32 px tiles) | H px | Ratio | p | L needed | Levels per tone at 5 tones |
|---|---|---|---|---|---|
| Candle | 6 | 1:1 | 0.5 | 3 | 0.6, cannot hold 5 tones |
| Torch | 16 | 1:1 | 0.5 | 8 | 1.6 |
| Torch | 16 | 1:2 | 0.5 | 4 | 0.8 |
| Campfire | 28 | 1:1 | 0.5 | 14 | 2.8 |
| Campfire | 28 | 1:1 | 0.75 | 21 | 4.2 |
| Burning house | 64 | 1:1 | 0.5 | 32 | 6.4 |
| VFX #6 reference | 72 rows | 1:1 | 0.5 | 36 | 7.2 |

[I, arithmetic on the formula. Flame heights are examples, not art guidance; note 11 owns sizes.]

- A short DOOM flame cannot hold many levels. At a fixed height, more levels need a higher p, and p = 1 removes all randomness (h95 = h50 = 36, 0% lone pixels in my first run). A torch at 32 px scale is a 6 to 8 level fire whatever the palette has [I].
- Raising p toward 0.75 keeps the height with more levels and tighter tongues (relative raggedness 0.14 at 16 rows against 0.25 at p = 0.5) [I, formula].
- 1:2 halves the rows, so it halves the levels for the same p. It does not buy smoothness. It turns each lone pixel into a lone 2x2 cluster, which meets the snow study's "clusters of at least 2x2" rule [I, from `studies/vfx-snow-32px/report.md` via CONTEXT].

### Gaps
- No primary measurement of the PSX or N64 binary's buffer height. The table measures Sanglard's web port rule.
- The sideways drift (about -0.5 px per row on average, from VFX #6) was not re-measured.

---

## Q2. Grain and tone count: how many of the 37 steps survive 4 to 6 tones

### Takeaway
At 37 tones, three quarters of DOOM pixels differ from all four neighbours. That is the 1 px grain. Quantizing to 5 tones cuts lone pixels to 8.6% at L = 36, but short flames with few levels go back up to 15 to 25%. Smoothing before quantizing removes almost all of them. Since heat falls linearly with height on average, equal level bands are equal height bands.

### Measured [M]
"Lone" means the pixel's tone differs from all 4 neighbours. Visible pixels only. In-place Sanglard loop unless noted.

| Variant | Tones | Lone pixels | Share of neighbour pairs that differ |
|---|---|---|---|
| L = 36 | 37 (raw palette) | 75.2% | 0.91 |
| L = 36 | 6 | 11.0% | 0.41 |
| L = 36 | 5 | 8.6% | 0.35 |
| L = 36 | 4 | 6.7% | 0.29 |
| L = 36, double buffer | 5 | 7.9% | n/a |
| L = 36, p = 0.75 | 5 | 5.3% | 0.27 |
| L = 16 | 5 | 15.5% | 0.50 |
| L = 8 | 5 | 25.3% | n/a |
| L = 36, 3x3 box average before quantizing | 5 | 0.3% | n/a |
| Lode kernel (3 below + 1 two below, `*32/129`, seed 0 to 255) | 5 | 0.1% | 0.13 |

- Lode's fire in my 360-row buffer reached a median top at 166 rows (105 rows if heat below 32 is hidden). Its height is set by the multiplicative divisor and the floor, not by the L/p rule [M].

### Inferences
- Band layout. Heat at row n is about `L - p n`, so 5 equal bands of 7.2 levels are 5 equal height bands of about 14 rows at p = 0.5. A hand-drawn flame has a small white core and a wide red-orange body. Use a level-to-tone lookup with unequal bands (for example core = top 3 levels) rather than `floor(level * K / (L+1))` [I].
- Ordered dither between bands. The DOOM noise already dithers every band edge. Each edge is ragged with the sd from Q1. Adding Bayer on top adds more single pixels, which the snow study found reads as noise next to 32 px art. Leave it out [I, from `studies/vfx-snow-32px/notes/12-field-resolution-godot.md` Q3].
- Less noisy variants, in order of cost. (a) Raise p and lower L (fewer, cleaner tongues, 5.3% at p = 0.75). (b) Average 3x3 at draw time (9 reads, 0.3%). (c) Lode or Elias averaging in the sim (4 reads, 0.1%, softer blob shapes). (d) Elias's scrolling cooling map, values 0 to about 10 after about 20 smoothing passes, subtracted after averaging. It makes tongues instead of noise for one extra read [C for the recipe, https://web.archive.org/web/2016/http://freespace.virgin.net/hugo.elias/models/m_fire.htm via `studies/vfx-fire/notes/01-roots-classic.md` Q2]. (e) Seed with shapes. Lode seeds object edges for "flaming text" [C, https://lodev.org/cgtutor/fire.html]. At 32 px, seed from the burning part of a sprite's mask (a roof edge, a tree crown) instead of a bottom row [I].
- A cooling map at 32 px can be a tileable 32x64 texture that scrolls up at the convection speed. Painting it gives an artist control of tongue placement [I, from the Elias recipe].

### Pixel-art games that scaled the DOOM fire
- PICO-8 DOOM fire on a 32x36 grid with each cell drawn 4 px wide [C, https://www.lexaloffle.com/bbs/?pid=172560 , via `studies/vfx-fire/notes/08-tinycode-oldschool.md`].
- Jason Coon's gist runs a double-buffered version for LED matrices, "inspired by the low-res fire in the prehistoric PSX port of DOOM" [C through search summary, https://gist.github.com/jasoncoon/c5103fd5d0ba4d7da3677ed5187fc61c].
- A ZDoom forum post mentions a Shadertoy GLSL port with a backbuffer for the PSX sky [C through search summary, https://forum.zdoom.org/viewtopic.php?p=1085529]. Not opened.
- 32blit SDK has a `doom-fire.cpp` example [C through search summary, https://pigweed.googlesource.com/third_party/github/32blit/32blit-sdk/+/bc6fa8911fcb39dcfd100f352e2d193b7eff7e6b/examples/doom-fire/doom-fire.cpp].

### Gaps
- I found no shipped game with roughly 32 px tiles that uses a DOOM-style buffer for its flames, and no devlog comparing 1:1 against 1:2 at that scale.
- The "lone pixel" metric does not measure motion. A flame that looks clean in a still can shimmer in motion. The sandbox should be judged by eye.

---

## Q3. Buffer sizes and costs at 32 px

### Takeaway
DOOM buffers tied to art pixels grow 4 times. A full-screen 1:1 buffer at 640x360 is 230,400 cells, the same as four VFX #6 screens. Per-object patches stay small. Uploads are whole textures, so one atlas of all live fire patches beats one texture per fire.

### Numbers [I, arithmetic]

| Buffer | Cells at 1:1 | Cells at 1:2 | R8 upload per tick at 1:1 | RGBA8 at 1:1 |
|---|---|---|---|---|
| VFX #6 torch patch (16x32 at 8 px cells) | 512 | n/a | 512 B | 2,048 B |
| Torch patch 12x20 px | 240 | 60 | 240 B | 960 B |
| Campfire patch 32x40 px | 1,280 | 320 | 1,280 B | 5,120 B |
| Burning tree crown 48x64 px | 3,072 | 768 | 3,072 B | 12,288 B |
| Burning house 96x80 px (3 tiles wide) | 7,680 | 1,920 | 7,680 B | 30,720 B |
| Fire atlas 128x128 (about 10 campfires) | 16,384 | 4,096 | 16,384 B | 65,536 B |
| Full screen 640x360 | 230,400 | 57,600 | 230,400 B | 921,600 B |

- At 30 updates per second the full-screen 1:1 R8 buffer moves 6.9 MB/s. A 128x128 R8 atlas moves 492 KB/s.
- CPU work is one random number, one read and one write per cell for DOOM, 4 reads for Lode, 9 more reads for a 3x3 draw blur.
- On the GPU the cost per frame is one fragment per cell, so a 128x128 fire atlas is 16,384 fragments, 7% of one 640x360 screen [I].
- Timings in ms belong to the benchmark note (16).

---

## Q4. Drawing a per-tile burn state at art resolution

### Takeaway
Keep one fire cell per 32 px tile on the server. Draw the burn per pixel by comparing a time or progress value against a 32x32 threshold map. Per-tile progress shows tile seams. Interpolating the ignition time between tile centres removes them for one bilinear fetch.

### Cited findings
- Pixelated burn (Demyr, CC0, 26 Nov 2025). Snaps UV with `floor(UV / pixel_size) * pixel_size`, computes `dist = length(position - uv) + noise.b * burnMult`, an edge mask `clamp((dist - (radius - borderWidth)) / (2 * borderWidth), 0, 1)`, quantizes it to `blend_steps` bands and colours it through a 1D `colorCurve`. Alpha goes to 0 where `dist < radius` [C, https://godotshaders.com/shader/pixelated-burn/].
- 2D Burn/dissolve with direction (enekoassets, CC0, 9 Jul 2025). `s = dot(UV*2-1, dir) + noise.r * noiseForce`. Burn colour where `s < progress + borderWidth`, transparent where `s <= progress` [C, https://godotshaders.com/shader/2d-burn-dissolve-with-direction-v-1-0/].
- Pixel-burn Shader (arlez80, MIT, 18 Jan 2022, Godot 3 syntax). Snapped, time-scrolled noise drives both alpha and a mix toward `burn_color` at the fringe [C, https://godotshaders.com/shader/pixel-burn-shader/].
- Fire dissolve shader (HexagonNico, CC0). `step()` of noise against `integrity` with a `burn_size` band coloured by a gradient [C, `studies/vfx-fire/notes/07-gems-open-source.md` row 8].
- godotshaders.com lists 16 results for "burn", among them "Dissolve with glowing burn edge", "2D Burn/dissolve from point" and "2D dissolve with burn edge" [C, https://godotshaders.com/?s=burn]. Licences of those were not read.
- Dual grid and 47-blob counts, terrain modes and the bilinear-threshold measurement are in `studies/vfx-snow-32px/notes/12-field-resolution-godot.md` Q1.

### Formulas [I]
All the common burn shaders reduce to one threshold test with bands. With `T(px)` in 0..1 a threshold per art pixel and `b` the burn value at that pixel:

```
d = b - T(px)
d < 0                    unburnt (normal tileset)
0 <= d < w_rim           glowing rim (ember ramp, brightest at d = 0)
w_rim <= d < w_rim+w_sc  scorch band (dark)
d >= w_rim + w_sc        charred, later ash (burnt tileset)
```

- Band width in px is the band width in threshold units divided by the threshold gradient. For a ramp across one 32 px tile, T changes 1/32 per px, so a 1 px rim is `w_rim = 1/32 ≈ 0.031` and a 2 to 3 px scorch band is `w_sc ≈ 0.06 to 0.09`. Noise in T widens the bands where T is flat. Measure the band on the final map, not in the formula.
- Entry direction. With `u = px_in_tile / 32 - 0.5` and `e` the unit vector the fire came from (3 bits, 8 directions), `T = (1 - a) * clamp(dot(u, -e) / s + 0.5, 0, 1) + a * N(px)`, where `s = 1` for side entries and `sqrt(2)` for diagonals, and N is the painted cluster map or blue noise. `a` around 0.3 to 0.5 keeps the front ragged without losing direction.
- Per-tile progress. `b = clamp((now - t_ignite) / t_burn, 0, 1)` per tile. Neighbouring tiles that ignite on different ticks give a visible step at the shared edge, because T restarts at every tile border.
- Continuous front (preferred). Store `t_ignite` per tile in a 1-texel-per-tile texture (240 texels per view, linear filter), sample it at the art pixel to get `t_arrival(px)`, then `b = (now - t_arrival(px)) / t_burn` and compare against the same tileable `T(world_px mod 32)`. The bilinear contour of the arrival time is the front. It crosses tile borders without a seam. Tiles not yet burning need a placeholder time (now plus a horizon, or the predicted arrival from the spread rate) so the bilinear blend does not pull the front ahead early. This is fog of war with time in place of visibility (raylib's 1 texel per 32 px tile example, cited in the snow note Q4).
- Dual-grid scorch autotiles are the fallback with no shader. One burnt bit per tile gives 15 or 16 tiles. The front then moves in 16 px steps, so it suits the final scorched state, not the moving front.
- Cost. One threshold fetch, one arrival fetch, two tileset fetches (normal and burnt) and one ramp fetch for the rim. 5 fetches per ground pixel, 1,152,000 per 640x360 frame [I, arithmetic].

### Gaps
- No shipped 2D pixel game documents an interpolated arrival-time front. The method is my construction from fog of war and the burn shaders. The sandbox should show it beside the per-tile version.
- None of the burn shaders above is written for a world-anchored tile map. All work in sprite UV.

---

## Q5. Smoke field and light map resolution at 640x360

### Takeaway
Render cost follows art pixels and does not care about the field ratio. Field cost follows cells. Smoke at 8 px cells (80x45, the VFX #6 cell count) keeps VFX #6's measured cost and is enough for drifting bulk smoke. Thin chimney plumes (4 to 12 px wide) need 4 px cells or puff sprites. Light at 8 px is enough for object-level pools. Per-tile light is enough for Tibia-style pools, and bilinear filtering keeps its flicker smooth.

### Numbers [I, arithmetic unless marked]

| Field | Cell | Cells per view | R8 bytes | RGBA8 bytes | Cells across one tile |
|---|---|---|---|---|---|
| Smoke | 4 px | 160 x 90 = 14,400 | 14,400 | 57,600 | 8 |
| Smoke | 8 px | 80 x 45 = 3,600 | 3,600 | 14,400 | 4 |
| Smoke | 16 px | 40 x 23 = 920 | 920 | 3,680 | 2 |
| Light | 4 px | 14,400 | 14,400 | 57,600 | 8 |
| Light | 8 px | 3,600 | 3,600 | 14,400 | 4 |
| Light | 32 px (per tile) | 20 x 12 = 240 | 240 | 960 | 1 |

- VFX #6 measured smoke advect plus decay at 0.31 ms in JS on an 80x45 field (4 px cells at 320x180) [C, CONTEXT.md, VFX #6 note 03]. At 640x360, 8 px cells is the same 3,600 cells, so about 0.31 ms. 4 px cells is 4 times the cells, about 1.2 ms if linear [I, estimate].

### What the eye notices [I]
- A field can show features down to about 2 cells wide, and a feature moving across a coarse field "steps" unless it is about 4 cells wide. That puts the smallest clean feature at about 16 px for 4 px cells, 32 px for 8 px cells and 64 px for 16 px cells. Bulk smoke from a burning house is 2 tiles or more across, so 8 px cells are enough. A chimney plume of 4 to 12 px is below every field size, so draw it as puff sprites over the field.
- Bilinear then threshold hides the cell grid for smooth fields at 1:4 and even at 1 per tile (snow measurement, 1.90 px mean run, 25% on 4 px rows) [C, `studies/vfx-snow-32px/notes/12-field-resolution-godot.md` Q1]. Smoke and light are smooth fields, so the result carries over.
- Light dither band width does not depend on the light map resolution once filtering is bilinear. For a pool that falls linearly from 1 at the centre to 0 at radius R px, a dither band that covers a light range δ is `δ * R` px wide. A 3-tile pool (R = 96 px) with δ = 1/16 gives a 6 px band. For the 2 to 3 px band that suits 32 px art, δ ≈ 0.026 [I, arithmetic].
- Flicker at per-tile resolution. With bilinear filtering, a change of ε in one texel moves the threshold contour by about `ε * 32 / g` px, where g is the light change per texel at that point. Small flicker still moves the pool edge by 1 to 2 px. With nearest filtering it would jump whole tiles [I].
- What per-tile light loses is occlusion detail. A tree trunk or fence post cannot cast a shadow smaller than a tile. Per 8 px can. Per 4 px only adds value under character-sized shadows, which a sprite can draw for free [I].

### Gaps
- No perceptual source for smoke cell size at 32 px. The rules above are sampling arithmetic. The sandbox's smoke-cell control should settle it by eye.

---

## Q6. The Godot 4 Compatibility path (state on 13 Nov 2026)

### Takeaway
On Compatibility and web, the cheapest correct fire is CPU state, small R8 textures uploaded in one piece, and CanvasItem shaders that quantize to a ramp. GPU buffers through DrawableTexture2D are possible on 4.7+ but untested on web. GPUParticles2D has a cold-load compile cost of seconds on web. PointLight2D is single-pass and capped per item, so a baked light texture scales better with many fires.

### Cited findings

**ImageTexture**
- `update(image)` replaces the data and requires the same size, format and mipmaps. The docs call it faster than `set_image`, which "will re-allocate new memory" [C, https://raw.githubusercontent.com/godotengine/godot/4.7-stable/doc/classes/ImageTexture.xml].
- There is no `set_data` on ImageTexture in Godot 4. The 4.7 class lists `create_from_image`, `set_image`, `set_size_override`, `update` and getters [C, same file]. `set_data` was the Godot 3 name [K].
- On GLES3, `update` goes through `glTexImage2D` for the whole texture. Proposal #13012 for partial updates is still open [C, snow note Q5].

**Particles**
- Docs: CPUParticles2D "may perform better on low-end systems or in GPU-bottlenecked situations". No new features are planned for it [C, https://raw.githubusercontent.com/godotengine/godot-docs/master/tutorials/2d/particle_systems_2d.rst].
- `emit_particle()` "is only supported on the Forward+ and Mobile rendering methods, not Compatibility" [C, https://raw.githubusercontent.com/godotengine/godot/4.7-stable/doc/classes/GPUParticles2D.xml]. Sub-emitter style ember bursts from code need CPUParticles2D or a custom pool on web.
- `amount_ratio` below 1 saves nothing, since all `amount` particles are allocated and processed. `fixed_fps` defaults to 30 [C, same file].
- Issue #87843 (open since 1 Feb 2024, last updated 6 Nov 2026). On web export, one default GPUParticles2D with a GradientTexture2D needs "around 2 seconds to load". CPUParticles2D showed no delay. A comment from 2 Feb 2024 says pre-warming 4 systems froze the browser for 30 to 60 s and the author switched to CPU particles on web. A comment from 1 Nov 2026 on 4.7.2 (Chrome on Windows, ANGLE/D3D11) reports 22 to 25 s of compile and link per GPUParticles3D process material, about 93 s for four [C, https://github.com/godotengine/godot/issues/87843].
- Issue #86731 (open, 14 comments). CanvasItem shaders load much slower the first time on Compatibility than on Forward+ or Mobile, on macOS and Android [C, https://github.com/godotengine/godot/issues/86731].

**PointLight2D on Compatibility (read from 4.7-stable source)**
- Lights are applied in the same pass as the item. Each canvas item gathers the lights whose rect, mask and z range it meets, up to `max_lights_per_item - 1` = 15 (`MAX_LIGHTS_PER_ITEM = 16`, the loop breaks at 15) [C, https://raw.githubusercontent.com/godotengine/godot/4.7-stable/drivers/gles3/rasterizer_canvas_gles3.cpp lines 840 to 866 and `rasterizer_canvas_gles3.h` line 90].
- Per render, 256 lights, or 64 when the GPU's max uniform buffer size is under 64 KB [C, `rasterizer_canvas_gles3.cpp` lines 2777 to 2781].
- The fragment shader loops over the item's lights with one `textureLod` from the light atlas per light, plus shadow fetches when shadows are on [C, https://raw.githubusercontent.com/godotengine/godot/4.7-stable/drivers/gles3/shaders/canvas.glsl lines 634 and 764 onward].
- An item switching between lit and unlit breaks the batch (`DISABLE_LIGHTING` specialization) [C, `rasterizer_canvas_gles3.cpp` around line 870].
- Docs: "Larger lights have a higher performance cost as they affect more pixels". Additive sprites "are much faster to render" and suit short effects like explosions, but cannot light fully dark areas or cast shadows. PCF13 shadows "should only be used for a few lights at once" [C, https://raw.githubusercontent.com/godotengine/godot-docs/master/tutorials/2d/2d_lights_and_shadows.rst].
- `rendering/limits/opengl/max_renderable_lights` (default 32) and `max_lights_per_object` (8) are for 3D omni and spot lights, not Light2D [C, https://raw.githubusercontent.com/godotengine/godot/4.7-stable/doc/classes/ProjectSettings.xml].

**DrawableTexture2D**
- PR #105701 "Implement DrawableTextures", merged 30 Jan 2026, milestone 4.7, 46 files, +2,417 lines. It implements reduz's proposal with help from clayjohn and BastiaanOlij [C, https://github.com/godotengine/godot/pull/105701 via GitHub API].
- Shipped in 4.7-stable (18 Jun 2026). `setup`, `blit_rect` and `blit_rect_multi` are still experimental. Formats RGBA8, RGBA8_SRGB, RGBAH, RGBAF. GLES3 implements it [C, snow note Q5; class XML re-read today at https://raw.githubusercontent.com/godotengine/godot/4.7-stable/doc/classes/DrawableTexture2D.xml].
- The class describes "copying from a target texture to itself". The docs do not say whether a texture may be its own source in a blit [C, same file].
- Open bugs on 13 Nov 2026. #123507, `setup()` gives an empty texture on D3D12 Forward+ (4.7.1, 4.7.2). #121113, `get_image()` wrong in the editor. #119928, wrong 16383x16383 max size. Fixed in 4.7 cycle: #118144 (`PI` in blit shaders), #118178 (resize), #119927 (crash when blitting before setup) [C, GitHub issue search "DrawableTexture2D" in godotengine/godot].
- No issue in that search mentions web, WebGL or Compatibility [C, same search]. No public web test found.

**SubViewport feedback**
- `render_target_clear_mode` has `CLEAR_MODE_NEVER` ("Never clear the render target"), meant for 2D. `render_target_update_mode` has `UPDATE_ONCE` and `UPDATE_ALWAYS` [C, https://raw.githubusercontent.com/godotengine/godot/4.7-stable/doc/classes/SubViewport.xml].
- GodotCon Amsterdam 2026 talk "Procedural Pixel Art: Retro VFX with Shaders" (Julian Rogawski, 23 Apr 2026) covers burning effects, SubViewport feedback loops and colour limiting [C, `studies/vfx-fire/notes/05-newest-2025-2026.md` Q4, https://talks.godotengine.org/godotcon-ams-2026/talk/NSNXFT/].

### A pixel fire CanvasItem shader, sketch [I, untested]

```glsl
shader_type canvas_item;
render_mode unshaded;
uniform sampler2D noise : filter_nearest, repeat_enable; // tileable 64x64 R8 (Peters blue noise or NoiseTexture2D seamless)
uniform sampler2D ramp  : filter_nearest;                // 1D palette, tones from transparent to white core
uniform sampler2D shape : filter_nearest;                // painted flame silhouette mask for this sprite
uniform float tones = 5.0;
uniform float fps = 10.0;        // stepped time, the hand-drawn frame rate
uniform float rise = 24.0;       // px per second
uniform float phase = 0.0;       // from hash(tile x, y), so torches do not sync
varying vec2 wpos;
void vertex() { wpos = (MODEL_MATRIX * vec4(VERTEX, 0.0, 1.0)).xy; }
void fragment() {
    vec2 p = floor(wpos) + 0.5;                          // whole art pixels
    float t = floor((TIME + phase) * fps) / fps;          // stepped time
    float n1 = texture(noise, (p + vec2(0.0, t * rise)) / 64.0).r;
    float n2 = texture(noise, (p * 0.5 + vec2(17.0, t * rise * 0.6)) / 64.0).r;
    float heat = texture(shape, UV).r * (0.55 + 0.45 * (0.6 * n1 + 0.4 * n2));
    float q = floor(heat * tones) / tones;                 // quantize to the art's tones
    COLOR = texture(ramp, vec2(q, 0.5));
}
```

- 4 fetches per fragment (2 noise, shape, ramp). A 32x48 campfire quad is 1,536 fragments. 20 such fires are 30,720 fragments, 13% of a 640x360 screen, about 123,000 fetches [I, arithmetic].
- Texture noise is cheaper than ALU FBM on mobile. A 4-octave hash value noise costs 4 hashes and 3 mixes per octave per pixel, against one fetch per layer [I].
- The two noise layers move at different speeds, which gives the flicker. The `shape` mask is where the artist keeps control. It is the same as seeding the DOOM fire with a shape [I].
- Simple Pixelated Fire (MIT) does the same stepped scroll with `floor(TIME * scroll_speed)` and up to 5 palette thresholds [C, `studies/vfx-fire/notes/07-gems-open-source.md` row 5].

### GPU DOOM fire [I]
- A fragment shader cannot scatter, so the GPU version gathers: `out(x, y) = in(x + o, y + 1) - d` with `o` from {-1, 0, 1, 2} and `d` from a hash of `(x, y, frame)`. My gather simulation gives the clean L/p height (71 rows at L = 36), not Sanglard's 95 [M].
- On 4.7+, ping-pong two DrawableTexture2D (RGBA8) with one `blit_rect` per tick, heat in R. A 128x128 atlas is 65,536 bytes of VRAM per buffer and no CPU upload.
- On 4.5 and 4.6, two SubViewports with `CLEAR_MODE_NEVER`, each drawing a ColorRect that samples the other's ViewportTexture, alternated by setting `UPDATE_ONCE`. Two viewports because sampling a texture while rendering into it is a feedback loop in OpenGL [K].
- RGBAH and RGBAF need float render targets. On WebGL2 that depends on `EXT_color_buffer_float` [K, https://developer.mozilla.org/docs/Web/API/EXT_color_buffer_float]. Use RGBA8 on web.
- For an MMO, a GPU fire buffer is cosmetic only. Seed it from the server's tile state and let each client's flames differ.

### Inferences on choices
- Embers on web. A custom pool (one MultiMesh, or `draw_rect` calls from one node) or CPUParticles2D avoids the GPUParticles compile entirely. 512 embers is small for either [I, from #87843].
- Light. Up to about 15 PointLight2D touching one big ground item works. Many torch carriers on one screen exceed that and lights start dropping per item. A baked light texture (80x45 R8 at 8 px, 3,600 bytes per tick) sampled once by the ground shader costs the same for 1 or 50 fires. Additive sprites are the docs' recommended cheap option for short flashes [I, from the source reading and the docs].
- `viewport` stretch keeps every shader at 230,400 fragments. `canvas_items` at 1080p is 9 times more [C for the ratio, snow note Q5].

### Gaps
- No measured `ImageTexture.update()` time by size on WebGL2, and no measured `blit_rect` time. Note 16 should time both.
- No first-hand test of DrawableTexture2D in a web export. This needs a 30-line test project.
- I did not open #107633 (GPUParticles3D on web, linked from #87843) or check whether 4.8 betas change the compile cost.
- PointLight2D fill cost per pixel was not measured.

---

## Gems

| Name | URL | Licence | Maturity | What it saves |
|---|---|---|---|---|
| Pixelated burn | https://godotshaders.com/shader/pixelated-burn/ | CC0 for code, stated on page | published 26 Nov 2025, by Demyr | radial burn with snapped UV, quantized edge bands and a gradient ramp |
| 2D Burn/dissolve with direction (V 1.0) | https://godotshaders.com/shader/2d-burn-dissolve-with-direction-v-1-0/ | CC0 for code, stated on page | published 9 Jul 2025, by enekoassets | directional front plus noise, the "entry side" rule in 10 lines |
| Pixel-burn Shader | https://godotshaders.com/shader/pixel-burn-shader/ | MIT, stated on page | published 18 Jan 2022, by arlez80, Godot 3 syntax | snapped scrolling noise burn fringe |
| filipedeschamps/doom-fire-algorithm | https://github.com/filipedeschamps/doom-fire-algorithm | MIT (from VFX #6 note 07) | 1,599 stars on 10 Nov 2026 | JS ports to lift for demos |
| Casual-Cynic/sconce-fire-test | https://github.com/Casual-Cynic/sconce-fire-test | MIT (GitHub API spdx) | 3 stars, last push 20 Nov 2025, Godot 4.5 | project for the Simple Pixelated Fire shader |
| Godot 4.7 DrawableTexture2D | https://docs.godotengine.org/en/latest/classes/class_drawabletexture2d.html | Godot is MIT [K] | merged 30 Jan 2026, experimental | GPU ping-pong buffers without SubViewports |

Two more MIT repos showed up in a GitHub search but have 0 to 1 stars and were not opened: https://github.com/janeduardo19/godot-pixel-fx-lite and https://github.com/eric-patton/godot-effects.

---

## Sources

- Fabien Sanglard, "How DOOM fire was done", 28 Dec 2018. https://fabiensanglard.net/doom_fire_psx/
- Lode Vandevenne, "Fire Effect". https://lodev.org/cgtutor/fire.html
- Hugo Elias fire page (archived). https://web.archive.org/web/2016/http://freespace.virgin.net/hugo.elias/models/m_fire.htm
- PICO-8 DOOM fire. https://www.lexaloffle.com/bbs/?pid=172560
- Jason Coon gist (search summary). https://gist.github.com/jasoncoon/c5103fd5d0ba4d7da3677ed5187fc61c
- ZDoom forum, PSX Flaming Sky (search summary). https://forum.zdoom.org/viewtopic.php?p=1085529
- 32blit SDK doom-fire example (search summary). https://pigweed.googlesource.com/third_party/github/32blit/32blit-sdk/+/bc6fa8911fcb39dcfd100f352e2d193b7eff7e6b/examples/doom-fire/doom-fire.cpp
- godotshaders.com search "burn". https://godotshaders.com/?s=burn
- Pixelated burn. https://godotshaders.com/shader/pixelated-burn/
- 2D Burn/dissolve with direction. https://godotshaders.com/shader/2d-burn-dissolve-with-direction-v-1-0/
- Pixel-burn Shader. https://godotshaders.com/shader/pixel-burn-shader/
- ImageTexture class, 4.7-stable. https://raw.githubusercontent.com/godotengine/godot/4.7-stable/doc/classes/ImageTexture.xml
- GPUParticles2D class, 4.7-stable. https://raw.githubusercontent.com/godotengine/godot/4.7-stable/doc/classes/GPUParticles2D.xml
- CPUParticles2D class, 4.7-stable. https://raw.githubusercontent.com/godotengine/godot/4.7-stable/doc/classes/CPUParticles2D.xml
- Particle systems 2D tutorial. https://raw.githubusercontent.com/godotengine/godot-docs/master/tutorials/2d/particle_systems_2d.rst
- 2D lights and shadows tutorial. https://raw.githubusercontent.com/godotengine/godot-docs/master/tutorials/2d/2d_lights_and_shadows.rst
- GLES3 canvas renderer, 4.7-stable. https://raw.githubusercontent.com/godotengine/godot/4.7-stable/drivers/gles3/rasterizer_canvas_gles3.cpp and `.h`
- GLES3 canvas shader, 4.7-stable. https://raw.githubusercontent.com/godotengine/godot/4.7-stable/drivers/gles3/shaders/canvas.glsl
- ProjectSettings, 4.7-stable. https://raw.githubusercontent.com/godotengine/godot/4.7-stable/doc/classes/ProjectSettings.xml
- SubViewport class, 4.7-stable. https://raw.githubusercontent.com/godotengine/godot/4.7-stable/doc/classes/SubViewport.xml
- DrawableTexture2D class, 4.7-stable. https://raw.githubusercontent.com/godotengine/godot/4.7-stable/doc/classes/DrawableTexture2D.xml
- Using DrawableTextures tutorial. https://raw.githubusercontent.com/godotengine/godot-docs/master/tutorials/rendering/drawable_textures.rst
- PR #105701. https://github.com/godotengine/godot/pull/105701
- Issues #123507, #121113, #119928, #118144, #118178, #119927. https://github.com/godotengine/godot/issues/123507 (others at the same path)
- Issue #87843, GPUParticles2D web load times. https://github.com/godotengine/godot/issues/87843
- Issue #86731, Compatibility shader compile time. https://github.com/godotengine/godot/issues/86731
- MDN, EXT_color_buffer_float (not re-read). https://developer.mozilla.org/docs/Web/API/EXT_color_buffer_float
- Earlier notes reused: `studies/vfx-snow-32px/notes/12-field-resolution-godot.md`, `studies/vfx-fire/notes/01-roots-classic.md`, `05-newest-2025-2026.md`, `07-gems-open-source.md`, `08-tinycode-oldschool.md`.
- Scripts: `studies/vfx-fire-32px/notes/scratch-12/doomheight.js`, `doomheight2.js`, `gather.js`. Downloaded docs and source: `scratch-12/dl/`.
