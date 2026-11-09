# 03 — Systems / Grid / Cellular-Automaton techniques for ACID (top-down pixel art)

Researcher angle: the "Doom-fire family" for acid. These are tiny per-cell rules on low-res grids, covering liquid, corrosion, gas, dissolve, slime fields, DoT, chemistry rules and performance.
Target: Godot 4 Compatibility (WebGL2), top-down tiles (Asterion Online / Kingsfoil dungeon RPG).
Convention: **[C]** = cited finding (URL in the line or in Sources). **[I]** = my inference or design proposal, not from a source.

---

## 0. One-page synthesis (proposal) [I]

Use one **"acid layer" grid per room/chunk** at 2× to 4× the tile resolution. For example, 16-px tiles with a 4-px acid cell give 4×4 acid cells per tile. Use bytes per channel so it can be uploaded as an RGBA8 texture, as Sandspiel does with its 4-byte cells ([C] maxbittker.com):

| Channel | Meaning | Range |
|---|---|---|
| R `amt` | liquid amount (acid volume in cell) | 0–255 (≈ Minecraft levels × 32) |
| G `conc` | concentration / strength (dilution lowers it) | 0–255 |
| B `gas` | fume density (SPD-style integer blob) | 0–255 |
| A `etch` | permanent floor-stain / etch memory (decays very slowly) | 0–255 |

A separate per-object/per-pixel **integrity map** (material id + HP byte) drives corrosion stages and dissolve shaders. Creatures (slimes) are **fields**: they are splatted into the same `amt` channel (or a parallel "creature field"), so pools and slimes share one threshold and outline shader and merge visually for free.

Update rates: liquid 10–15 Hz, corrosion 2–5 Hz, gas 4–10 Hz (or on turn ticks), stain fade 0.2 Hz. Run only on **active chunks / dirty rects** (Noita pattern). A 64×64 chunk is 4096 cells, which is cheap in any language (see §9).

---

## 1. Liquid spreading on a top-down grid

### Takeaway
Top-down has no "down", so the "gravity" is the **floor heightmap gradient** plus **equalization toward neighbors**. The two best-fit models are:
1. **Integer level CA (Minecraft/DwarfCorp style).** Cheapest and most "pixel". Good for spills that should stop at a fixed radius.
2. **Virtual pipes (Mei et al. 2007).** Stores flux per edge, so liquid has momentum, sloshes and runs down grooves. It is about 2× the memory and still cheap at 64×64.
Add a **min-amount threshold** (surface tension) so puddles end in crisp, blobby edges instead of an infinite 1/255 film.

### Cited findings
- **w-shadow simple CA water** (2009): `MaxMass=1.0`, `MaxCompress=0.02` (extra mass a cell holds relative to the one above), `MinMass=0.0001` (cells below this count as dry). The order per cell is down → left → right → up (up only for compressed excess). Side flow is `(mass - neighbor)/4`. Double-buffered (`mass` → `new_mass`) so that scan order doesn't bias flow. Demo grid is 16×16 with a 1-cell border. Stable-state split: if total ≤ 1, return 1; if total < 2·MaxMass+MaxCompress, return `(MaxMass² + total·MaxCompress)/(MaxMass+MaxCompress)`; else `(total+MaxCompress)/2`. No benchmarks are given. https://w-shadow.com/blog/2009/09/01/simple-fluid-simulation
- **jgallant LiquidSimulator** (Unity, C#) is a known derivative of the same compression CA. Repo: https://github.com/jongallant/LiquidSimulator (listing: https://awesome.ecosyste.ms/projects/github.com%2Fjongallant%2FLiquidSimulator). I did not fetch the blog post itself (gap).
- **DwarfCorp**: water level is "a byte from 0-255", plus a flow vector and fluid type per cell. The loop runs only over cells that contain water. Steps: (1) evaporate if below threshold; (2) flow down; (3) random amounts to 4-neighbors, ordered by flow vector, and each neighbor's flow vector points away from the source; (4) reset flow vector. Lava moves "slightly smaller amount". There is no pressure model. https://www.gamedeveloper.com/programming/how-water-works-in-dwarfcorp
- **Minecraft fluid levels**: source = level 0, +1 per block up to 7 (water ≈ 7 blocks, a 15-block diamond). Overworld lava is +2 per block (≈ 3 blocks). Water moves 1 block / 5 ticks (4 blocks/s), Nether lava 1 / 10 ticks, Overworld lava 1 / 30 ticks. Flow **prefers the direction of the nearest drop**, searching up to 5 blocks (water) or 3 (lava). A new source forms between ≥2 adjacent sources. https://wiki.ronlab.site/content/minecraftwiki_en_all_maxi_2025-11/Fluid (Minecraft Wiki mirror)
- **Virtual pipes (Mei, Decaudin, Hu, Pacific Graphics 2007, pp. 47–56, DOI 10.1109/PG.2007.15)** compute water velocity with a shallow-water model on the GPU (https://hgpu.org/?p=2256). The equations below are as restated by Jákó (CESCG 2011):
  - `f_L(t+Δt) = max(0, f_L(t) + Δt·A·g·Δh_L / l)`, where `Δh_L = b(x,y)+d(x,y) − b(x−1,y) − d(x−1,y)` (b = terrain, d = water depth)
  - scale `K = min(1, d·lx·ly / ((f_L+f_R+f_T+f_B)·Δt))`. The CESCG text prints `max`, which is clearly a typo because K must clamp outflow. Then `f_i *= K`.
  - `ΔV = Δt·(Σf_in − Σf_out)`; `d += ΔV/(lx·ly)`.
  - Timings (Jákó's improved version, ms per iteration). 128²: CPU 25.7 / GPU 0.295 (HD4870). 256²: 102.4 / 1.01. 512²: 412.6 / 3.835. https://www.old.cescg.org/CESCG-2011/papers/TUBudapest-Jako-Balazs.pdf

### Pseudocode A — integer-level acid spill, top-down (Minecraft × DwarfCorp) [I]
```
# amt[] uint8, floor_h[] uint8 (0 = groove/crack, 255 = raised), solid[] bool
# run at 10–15 Hz on dirty rect only; read cur, write nxt (double buffer)
for each cell c in dirty_rect:
  a = cur.amt[c]; if a < MIN_AMT (e.g. 6): 
      nxt.amt[c] += 0; etch[c] = max(etch[c], a*4); continue   # film evaporates → stain
  # "gravity" in top-down = floor height: rank 4 neighbors by (floor_h+amt)
  for n in neighbors4(c) sorted by (floor_h[n]+cur.amt[n]) ascending:
     if solid[n]: continue
     head = (floor_h[c]+a) - (floor_h[n]+cur.amt[n])
     if head <= COHESION (e.g. 4): continue        # surface tension: small diffs don't move
     flow = min(head >> 2, a >> 2, MAX_FLOW)      # /4 like w-shadow; >>2 is cheap
     nxt.amt[c] -= flow; nxt.amt[n] += flow       # conserved exactly (integers)
     mark_dirty(n)
```
- Puddle shape on flat floor: with only `>>2` equalization, a spill becomes a **diamond**, as in Minecraft. To get organic blobs, (a) randomize neighbor order per cell per tick (DwarfCorp-style random amounts), and/or (b) add a static per-cell "roughness" noise into `floor_h` (0–8). The puddle then follows the noise and freezes into a stable irregular shape once all heads are below `COHESION`. [I]
- Cracks and grooves: paint `floor_h` low along mortar lines between floor tiles. Acid then visibly runs into the grout grid first, which reads as "it's seeping". [I]
- Conservation: integer transfers that are read from `cur` and written to `nxt` conserve exactly. Cap `flow ≤ a/4` so a cell never sends more than it has to 4 neighbors. Same rationale as K scaling in pipes. [I]
- Sleeping: if no cell in a chunk moved this tick, clear the chunk's dirty flag (Noita dirty rect, §9). [I]

### Pseudocode B — virtual pipes, top-down (for sloshing/streams) [I, from Mei/Jákó]
```
# per cell: d (depth float or uint16), fL,fR,fT,fB (outflow flux), b = floor height
for each cell: for each dir k:
   dh = (b+d)[c] - (b+d)[nk]
   f[k] = max(0, f[k]*DAMP + dt*G*dh)       # DAMP ~0.98 adds viscosity (acid is thicker)
K = min(1, d / ((fL+fR+fT+fB)*dt + eps)); f *= K
pass 2: d += dt*(inflow - outflow)
```
- Memory: 5 floats per cell, so 20 B/cell. At 64×64 that is 80 KB. Fits in two RGBA16F textures if moved to a shader. [I]
- Gives "momentum": a thrown acid flask splashes outward and overshoots, then settles. Velocity `(fR−fL, fB−fT)` can drive bubble drift and the scroll of a fizz texture. [I]

### Gaps
- jgallant's blog text was not fetched. Exact per-frame costs of these CAs at our sizes are not published; §9 gives estimates.

---

## 2. Corrosion as a CA (materials, reaction tables, integrity stages, rust)

### Takeaway
Use the **Noita reaction-table model**: pair (acid, tag) → (out1, out2) with a probability per contact per tick. Make the reaction **consume acid** (self-limiting) and **emit gas**. Run it per pixel on object integrity maps, and per material class on tiles.

### Cited findings
- **Noita reactions** are XML `<Reaction input_cell1 input_cell2 output_cell1 output_cell2 probability .../>`. Tags such as `[corrodible]` let one rule hit many materials. Extra flags: `blob_radius1/2` (one pixel converts a radius), `convert_all`, `direction`, `entity` (spawn an entity at the reaction site), `cosmetic_particle`, `ExplosionConfig`. Probability is stored ×100 as int, and the per-tick semantics are undocumented. https://noita.wiki.gg/wiki/Documentation:_Reaction
- **Noita acid**: density 2.9. Up to **637.5 dmg/s** fully submerged, scaled by how much of the body touches it. Corrodes everything tagged corrodible. **Does not dissolve Glass, Dense Rock, Extremely Dense Rock.** Reactions (rate): Acid + corrodible → Acid + **Flammable Gas** (**50**). Acid + Air → Flammable Gas + Air (**10**, so pools slowly evaporate into gas). Acid + Flammable Gas → Flammable Gas + Air (12). **Purifying Powder + Acid → Water (80)** (neutralizer). Frozen Acid + Fire → Acid (90). https://noita.wiki.gg/wiki/Acid
  - Note: in Noita, "Acid + corrodible → Acid + gas" means **the acid pixel survives** (not self-limiting). Self-limiting comes from Acid + Air evaporation instead. For an RPG we probably want acid **consumed** (see table below). [I]
- Rust in Noita is a separate material (Rusted Metal): https://noita.wiki.gg/wiki/Rusted_Metal (not deeply read; gap).
- **NetHack erosion**: 3 levels per type (e.g. rusty → very rusty → thoroughly rusty, same for corroded). **−1 AC or −1 dmg per level** (min 0). Penalties use the **max** erosion type, not the sum. Erodeproofing via scroll, and grease blocks erosion. Silver, mithril and dragon hide don't erode. Acid sources: green mold, spotted/ochre jelly, black pudding passive. In NetHack 3.7, glass goes cracked → very cracked → thoroughly cracked, then destroyed. EvilHack: a 4th erosion of the same type destroys the item. https://nethackwiki.com/wiki/Rust

### Proposed reaction table (acid layer vs. material classes) [I]
Probabilities are per contact-cell per corrosion tick (4 Hz). Effects are scaled by `conc/255`.

| Material (tag) | p(react) | integrity loss per react | acid consumed | byproduct (visual cue) |
|---|---|---|---|---|
| flesh / organic creature | n/a, uses DoT (§6) | — | 1 | sizzle puff, green tint flash |
| wood, cloth, leather | 0.30 | 6 | 2 | **black char** (dehydration, §7), thin smoke |
| iron / steel | 0.20 | 4 | 3 | **H₂ bubbles** (tiny white dots), later **rust** seed |
| copper / bronze | 0.10 | 3 | 2 | green-blue verdigris stain |
| limestone / marble floor | 0.25 | 2 (etch only) | 4 | **vigorous fizz** (CO₂), whitish crust |
| granite / dense stone | 0.03 | 1 | 1 | faint etch |
| bone | 0.15 | 3 | 2 | chalky white, fizz (bone is mineral) |
| gold, glass, ceramic | 0 | 0 | 0 | none. "Acid-proof" vessels (Noita also exempts glass) |
| base (lime, ash, soap) | 0.8 | — | 8 | neutralize → **salt residue** (§7) |

### Pseudocode — pixel corrosion front on an object's integrity map [I]
```
# obj.mat[px] (uint8 material id), obj.hp[px] (uint8 255=clean), acid contact mask
every corrosion tick:
  for px in obj.edge_pixels ∪ pixels_touching_acid:      # front = pixels with an exposed neighbor
     if acid_amt_at(px) == 0: continue
     m = MAT[obj.mat[px]]
     if rand() < m.p * conc: 
        obj.hp[px] -= m.loss
        consume_acid(px, m.acid_cost)                      # self-limiting
        emit(m.byproduct, px)                             # gas into B channel, bubbles, char
        if obj.hp[px] == 0: obj.mat[px] = HOLE; mark_neighbors_as_front(px)
  # stages for rendering (palette swap, no new art):
  stage = hp>200 ? CLEAN : hp>140 ? PITTED (dither 1/8 dark) : hp>60 ? ETCHED (1/2 dark + edge tint) : hp>0 ? HOLED_EDGE (glow rim) : HOLE
```
- Only **front pixels** (exposed and wet) are processed. This is the same "dirty rect" idea as Noita, at the scale of one sprite. A 32×32 sword has ≤ ~100 edge pixels. [I]
- Item durability = `sum(hp)/sum(255)` over non-HOLE pixels. The item breaks when a **connected-component** check finds the grip separated from the blade, or when durability is below 20%. [I]

### Rust spreading CA (after exposure, over minutes) [I]
```
# per iron pixel: wet_timer (from acid/water exposure), rust (0..255)
every 1 s:  if wet_timer>0 or neighbor_rust>128: 
               if rand() < 0.02 + 0.05*neighbor_rust_count: rust += 16
            wet_timer = max(0, wet_timer-1)
render: rust>64 → orange dither 1/4, >160 → 1/2, 255 → full rust palette
```
Rust grows from **edges and scratches first**: seed rust where `hp<255`. It reads like real pitting corrosion and costs one tick per minute of game time per item.

### Gaps
- Exact Noita per-tick probability semantics are unconfirmed. Noita's GDC-reported rigid-body rebuild (marching squares, then Box2D) is from my memory of the talk and was **not verified** this session.

---

## 3. Gas / fumes diffusion grid

### Takeaway
The **SPD Blob rule is the "Doom fire" of gas**: integer average of self + open 4-neighbors, **minus 1**, with a growing bounding rect. It is one line, conserving-ish, and decays by itself. DCSS uses a different, **per-cloud-object** probabilistic spread with halving decay. Stam stable fluids are overkill except for wind-blown big clouds.

### Cited findings
- **Shattered Pixel Dungeon `Blob.evolve()`** (GitHub master, read via raw.githubusercontent):
  ```java
  int count = 1; int sum = cur[cell];
  // + each non-solid 4-neighbor inside area: sum += cur[n]; count++
  int value = sum >= count ? (sum / count) - 1 : 0;
  off[cell] = value;        // double buffer cur/off
  // grow area rect if value>0; volume += value
  ```
  Solid cells are zeroed. It runs once per game turn (actor TICK). The update loop covers only `area` (bounding rect) ±1. https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/actors/blobs/Blob.java
- **SPD ToxicGas**: any cell with `cur>0` deals `1 + depth/5` damage per turn to the occupant, and **concentration does not scale damage**. Visual: `emitter.pour(Speck.TOXIC, 0.4f)`. https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/actors/blobs/ToxicGas.java
- **SPD CorrosiveGas**: on contact it applies the `Corrosion` buff `set(2 turns, strength)`. Strength is a single per-blob value (source comment: "FIXME should have strength per-cell"). https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/actors/blobs/CorrosiveGas.java
- **DCSS clouds** (`cloud.cc`, master). Each cloud has `decay` and `spread_rate`. Each turn: `decay -= time_taken`. With `spread_rate`% chance it spreads. Then `spread_rate -= spread_rate/10`. Each adjacent free cell gets a copy with chance **80% if decay>30, 50% if >20, else 30%**, with `newdecay = decay/2+1`. The parent loses **8 decay per child**. Delete at decay<1. Acid cloud: **2/3 chance per turn to `corrode()`**. The player takes +12 random damage ("Replicate the old acid_splash damage"). https://github.com/crawl/crawl/blob/master/crawl-ref/source/cloud.cc
- **Stam stable fluids** (GDC 2003): diffuse vel → project → advect vel → project → diffuse density → advect density. The mikeash version uses **4** Gauss-Seidel iterations per `lin_solve`, with wall boundaries via `set_bnd`. https://mikeash.com/pyblog/fluid-simulation-for-dummies.html ; paper: https://wdv.com/Aerospace/Fluids/StamFluidsforGames.pdf
- **Caves of Qud** corrosive gas mutation: 800 gas units per round split across 8 neighbors (~100 each). A concentrated release can deal >50 dmg/round. Gas **does not damage items** but deals very high damage to walls and doors. https://wiki.cavesofqud.com/wiki/Corrosive_Gas_Generation

### Pseudocode — acid fumes with drift, using the SPD rule [I]
```
# gas[] uint8 in B channel, wind (wx,wy) ints in {-1,0,1}, run 4–10 Hz real-time or per turn
for c in area±1:
  if solid[c]: nxt[c]=0; continue
  sum=cur[c]; cnt=1
  for n in N4(c) if !solid[n]: w = (n is upwind of c) ? 2 : 1; sum += cur[n]*w; cnt += w
  v = sum/cnt - DECAY            # DECAY=1 (SPD); acid fumes maybe 1 every other tick
  nxt[c] = max(0, v)
emit: each reacting acid cell adds +k to gas (k = 8 metal/H2, 4 organic smoke, 12 limestone CO2)
render: gas>0 → sparse rising pixels/specks; alpha = gas/64 clamped; palette 3 shades of yellow-green
gameplay: occupant in gas>T → apply Corrosion stack (§6), and mark metal items wet for rust (§2)
```
- Visual drift: shift a whole-chunk sample offset by `wind` every N ticks, which is cheaper than true advection. The "−1" decay plus averaging gives an automatic soft falloff edge. [I]
- Cost: 1 read of 5 cells + 1 divide per cell. At 64×64 that is about 20k reads per tick, trivial (§9). [I]

---

## 4. Dissolve shader family (items dissolving, burn edge)

### Takeaway
Use `alpha = step(noise, progress)` with an emissive band where `noise ≈ progress`. For pixel art, sample noise **at sprite texel resolution** (nearest), and replace global `progress` with a **per-pixel integrity texture** (from §2), so the dissolve front comes from the simulation instead of a canned animation.

### Cited findings
- **"2D dissolve with burn edge"** by mreliptik, godotshaders.com, 2024-03-12, **CC0**, Godot 4 `canvas_item`. Uniforms: `dissolve_texture` (NoiseTexture2D, Simplex Smooth suggested), `dissolve_value` 0–1, `burn_size` (~0.04), `burn_color`. Core:
  ```glsl
  float bs = burn_size * step(0.001, dissolve_value) * step(dissolve_value, 0.999);
  float threshold = smoothstep(n - bs, n, dissolve_value);
  float border    = smoothstep(n, n + bs, dissolve_value);
  COLOR.a *= threshold;  COLOR.rgb = mix(burn_color.rgb, tex.rgb, border);
  ```
  https://godotshaders.com/shader/2d-dissolve-with-burn-edge/
- More variants: "2D Burn/dissolve from point" https://godotshaders.com/?p=10186 , "Dissolve (Godot 4.x)" https://godotshaders.com/shader/dissolve-godot-4-x/ , burn tag https://godotshaders.com/shader-tag/burn/

### Pixel-art acid variant [I]
```glsl
// integrity_tex: R8, same size as sprite (nearest filter), written from CPU corrosion sim
float hp = texture(integrity_tex, UV).r;            // 1 clean ... 0 hole
float n  = texture(noise_tex, floor(UV*SIZE)/SIZE).r;
float e  = hp - n*0.25;                              // noise only roughens the front
if (e < 0.0) discard;                                // hole
vec3 c = tex.rgb;
c = mix(c, c*0.6, step(e, 0.55));                    // etched: darken one palette step
c = mix(c, acid_rim.rgb, step(e, 0.08));             // 1-texel glowing rim (no smoothstep → crisp pixels)
COLOR = vec4(c, tex.a);
```
- Use `step` and not `smoothstep` to keep **hard pixel edges**, and quantize to palette (or use a palette LUT as in the SNOW study). [I]
- Pure-shader cost: 3 texture samples per sprite pixel, negligible. Running the integrity map on CPU is per-item and only while wet. [I]

---

## 5. Creatures from fields (slimes, oozes, gelatinous cubes)

### Takeaway
Render pools and slimes from **one scalar field on a low-res buffer**:
`F = pool_amt + Σ_blobs kernel(dist)`, then threshold, a 1-px outline, and an inner highlight. A slime walking into a pool **merges visually with zero extra logic**. Motion comes from a small **Verlet ring + pressure** (6–12 points) that drives the kernels. Splitting divides mass. Absorbed items are drawn **under** the semi-transparent slime field.

### Cited findings
- Metaball field: `f(x,y) = Σ r² / ((x−xi)² + (y−yi)²)`, iso-level 1. Marching squares uses a 4-bit corner index, a 16-entry edge table, and linear interpolation `t = (1 − fB)/(fD − fB)`. https://www.github.com/xtenzQ/2D-metaballs
- Blinn (1982) "blobby" objects is the origin. Blinn was not fetched this session (gap; standard reference: J. Blinn, "A Generalization of Algebraic Surface Drawing", ACM TOG 1982).
- **Matyka & Ollila, "Pressure Model of Soft Body Simulation"** (arXiv physics/0407003, 2004): a spring-mass body plus an internal-pressure force from simple thermodynamics. Heun predictor-corrector integrator. Per-edge pressure force in the 2D tutorial code is `pressurev = edge_len * Pressure * (1/volume)`, applied along the edge normal to both endpoints. Volume (area) comes from Gauss' theorem. https://arxiv.org/abs/physics/0407003 ; https://panoramx.ift.uni.wroc.pl/~maq/soft2d/node12.html
- **JellyCar** (Walaber) offers two soft-body options. *Pressure bodies* (virtual gas, used for tires and balloon) tend to round everything out. *Shape-matching frame springs* pull points toward a rigid frame aligned to the centroid and mean angle, and long thin bodies need multiple frames. Point-in-polygon ray-crossing collision. https://gamedeveloper.com/programming/deep-dive-the-soft-body-physics-of-jelly-car-explained
- **Jakobsen, "Advanced Character Physics"** (2003, Hitman: Codename 47): Verlet `x' = 2x − x* + a·Δt²`. Distance constraints are relaxed by projection. "For most pieces of cloth only one iteration is necessary". 1–10 iterations in Hitman. A sqrt-free constraint uses a first-order Taylor expansion around rest length. https://gamedeveloper.com/programming/advanced-character-physics

### Pseudocode — slime as Verlet ring + pressure + field splat [I]
```
N = 8 points on ring, rest radius R (e.g. 6 px), prev[] for Verlet
each physics step (30 Hz):
  for p: v = pos[p]-prev[p]; prev[p]=pos[p]; pos[p] += v*0.96 + steer*dt²   # damping = viscosity
  A = polygon_area(pos)                               # shoelace
  for edge (i,j): n = outward normal; f = PRESSURE*len/A; pos[i]+=n*f*dt²; pos[j]+=n*f*dt²
  repeat 2: for edge: project |pos[i]-pos[j]| toward L0 (Jakobsen); also spoke to centroid (shape-match light)
squash&stretch for free: moving = trailing points lag, leading compress
render each frame into low-res field buffer (e.g. 1 field px = 1 game px):
  for each ring point p: splat kernel k(d) = max(0, 1 - d²/r²)²  (r ≈ 4 px)   # compact support → bounded cost
  F = pool_amt/255 + Σ splats
  pixel = F > 0.5 ? (F > 0.5 && any neighbor F<=0.5 ? OUTLINE : (F>0.9 ? CORE : BODY)) : floor
```
- Compact kernels (polynomial `(1−d²/r²)²`) instead of Blinn's `r²/d²` keep each splat to a small rect. 8 points × 9×9 px ≈ 650 writes per slime. 20 slimes ≈ 13k writes, small. [I]
- **Trail**: each tick, deposit `amt += 2` into the acid layer at the centroid, and lose 2 from slime mass. The trail then spreads, stains and evaporates with the same CA. [I]
- **Splitting** (on hit, mass ≥ 2·min): create two rings with `R' = R/√2` (area conserved), give them opposite impulse, and split HP ∝ mass. On death: write `mass` into `amt` within radius R, so it **bursts into a pool**. [I]
- **Absorbing items**: if an item is inside the ring polygon, attach it as a child of the centroid with a lag spring. Draw the item, then the slime body at ~60% alpha (or dither 50% for strict pixel art). Run the item's integrity map with acid contact = 100% while inside, so you watch it dissolve (§4) over N seconds. NetHack's ochre jelly engulf and passive corrosion is the gameplay precedent (nethackwiki Rust page). [I]
- **Gelatinous cube** (top-down): use a square ring (4 corners + 4 mids) with stronger shape-matching. Same field, a squarer threshold. [I]

### Gaps
- No published top-down game was found that documents exactly "pool field + creature field in one threshold buffer". This is a design proposal. Other researchers may find examples such as the Noita "Limanuljaska" slimes or Ooze games.

---

## 6. Damage-over-time & status stacking (with numbers)

### Cited findings
- **SPD `Corrosion` buff**: `set(duration, dmg)` → `left = max(duration, left)` and `damage = max(damage, new)`. Each turn it deals `(int)damage`, then **damage ramps** +1 per turn while below `depth/2 + 2`, then +0.5 per turn. Expires when `left ≤ 0`. Corrosive gas refreshes 2 turns while you stand in it, so staying escalates damage. https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/actors/buffs/Corrosion.java
- **SPD `Ooze` (caustic slime)**: `DURATION = 20` turns. Damage per turn is `1 + depth/5` (depth > 5), 1 at depth 5 (Goo), and **1 every 2 turns** in the sewers. **Standing in water removes it** (`if water[target.pos] && !flying → detach`). A clean acid + water dilution precedent. https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/actors/buffs/Ooze.java
- **SPD ToxicGas**: flat `1 + depth/5` per turn while in any gas cell (see §3).
- **DCSS corrosion** (`player.cc`, `actor.h`): each `corrode()` adds **duration 10 + 2d4 turns (cap 50)**. Default `amount = 4` means **−4 AC per stack**, halved if resistant. **Diminishing stacking**: the new stack applies only if `!x_chance_in_y(corr, corr+28)`, so at 4 corrosion the stack chance is 28/32 = 87.5%, at 12 it is 70%, at 28 it is 50%. The acid cloud corrodes with probability 2/3 per turn. https://github.com/crawl/crawl/blob/master/crawl-ref/source/player.cc ; https://github.com/crawl/crawl/blob/master/crawl-ref/source/actor.h ; cloud.cc above
- **BG3 Acid surface**: **−2 AC while standing on it** (condition lasts only while on the surface). Acid on top of blood doesn't apply. https://bg3.wiki/wiki/Acid_(surface)
- **NetHack**: −1 AC per erosion level, max 3 (§2).
- **Noita**: up to 637.5 dps submerged, scaled by contact fraction (§2).

### Proposed DoT model for Asterion (tick-based MMORPG) [I]
```
AcidBurn { stacks 0..5, tick = 1 s (or 2 s Tibia-like), dmg_per_tick = base(conc) * stacks,
           decay: every 3 ticks out of acid → stacks -= 1; water tile/potion → stacks = 0 (SPD Ooze) }
in acid pool: +1 stack per tick with chance 1 - stacks/(stacks+3)   (DCSS-style diminishing)
armor: each tick in acid, worn metal pieces lose integrity (§2); AC_penalty = -1 per stage (NetHack) cap -3
flesh visuals: green tint flash 2 frames per tick, sizzle speck, small hp number in acid colour
```

---

## 7. Neutralization chemistry as rules (visual cues)

### Cited findings
- Concentrated sulfuric acid **dehydrates carbohydrates, leaving black carbon**. Paper: "the cellulose reacts to give a burned appearance". Sugar: "a rigid column of black, porous carbon". https://solarspell-dls.sfis.asu.edu/mea/wikipedia/wp/s/Sulfuric_acid.htm (Wikipedia mirror; en.wikipedia was blocked by the fetch allowlist). Also https://en.wikipedia.org/wiki/Sugar_charcoal
- The acid reacts with most metals by single displacement, **releasing hydrogen and forming a sulfate**. Hydration (mixing with water) is "highly exothermic", so add acid to water, not the reverse. (same mirror)
- Carbonate test: a drop of **5–10% HCl** on limestone/calcite "will produce a vigorous fizz" (CO₂). **Dolomite fizzes only when powdered.** https://geology.com/minerals/acid-test.shtml
- Acid + metal carbonate → salt + water + CO₂ (school chemistry). https://www.thenational.academy/teachers/lessons/chemical-reactions-acid-and-metal-carbonate
- Neutralization (acid + base → salt + water) is standard chemistry. The Wikipedia page was blocked, so it was not quoted.
- Noita gameplay precedent: Purifying Powder + Acid → Water (rate 80). https://noita.wiki.gg/wiki/Acid

### Rules table for the acid layer [I]
| Input | Rule (per cell per tick) | Output channels | Visual cue |
|---|---|---|---|
| acid + water | `conc' = conc·amt/(amt+w)`; amt += w | conc ↓, amt ↑, +gas puff if conc>200 (heat) | steam puff, colour lerps toward water blue |
| acid + base (lime/ash) | `n=min(acid,base)`; both −n | amt −n, stain += "salt" | **white crust** pixels left behind, fizz |
| acid + iron | p=0.2: integrity−, conc−3 | gas += 8 (H₂, flammable) | tiny white bubbles at contact, later rust |
| acid + limestone floor | p=0.25: conc−4, floor etch+ | gas += 12 (CO₂, harmless) | **strong fizz** foam ring, pale etch |
| conc. acid + wood/cloth | p=0.3: integrity−, char+ | char mask | blackening that spreads ahead of holes |
| H₂ gas + fire | ignite (Noita: acid gas is flammable) | burst | flash, pushes fumes |
| acid + cold | freeze to "frozen acid" (Noita has it) | solid tile | glassy green ice that melts back |

Self-limiting: every reaction subtracts `conc` or `amt`, so a puddle on limestone fizzes hard, then goes flat and leaves a pale etch. That is the "alive then calm" arc. [I]

---

## 8. Stains and long-term memory [I]
- `etch` channel (A): `etch = max(etch, amt*k)` while wet. After drying it decays 1 per 5 s on stone and never on limestone (permanent etch). Render it as a 2-step dither darkening of the floor tile, with the same palette tricks as the snow study's "exposure mask".
- Salt crust and char are separate 1-bit masks so they persist and can be swept or cleaned.

---

## 9. Performance: cells/ms, dirty rects, chunks, checkerboard

### Cited findings
- **Noita**: world split into **64×64 chunks**, each with a **dirty rect**, so only those pixels are iterated. Updated **bottom-to-top**. Multithreaded with a **checkerboard of 4 passes**: a pixel may move up to **32 px** beyond its chunk, so same-pass chunks never touch, and no locks or atomics are needed. https://80.lv/articles/noita-a-game-based-on-falling-sand-simulation/ ; GDC talk: https://gdcvault.com/play/1025695/Exploring-the-Tech-and-Design
- A naive GPU port of a falling-sand CA is hard because there is no deterministic thread order, so two cells can move into the same target. A commenter claims a 640×480 GPU prototype ran in 0.1–0.6 ms on a GTX 1080 Ti (**unverified user claim**). https://axebps-redlib.hf.space/r/howdidtheycodeit/comments/ej07ns/exploring_the_tech_and_design_of_noita
- **Sandspiel** (Rust→WASM): **300×300** cells, a **4-byte cell** `{species, ra, rb, clock}`. The `clock` byte prevents double updates in scan order. WASM memory is viewed as a `Uint8Array` with no copy and uploaded as an RGBA texture, then a fragment shader colours it. Render CPU < 1 ms. 60 FPS at 300×300 on the author's devices, but "many devices" can't, and the author calls the bigger canvas a mistake. The 2015 JS prototype was 100×100. https://maxbittker.com/making-sandspiel
- **GDScript typing**: 1e9 Vector2 distance ops took 6,057 ms typed vs 14,728 ms untyped in release (M2 Max), so typed is ~59% faster. https://beep.blog/2024-02-14-gdscript-typing
- Virtual pipes timings (CPU vs GPU): see §1. 128² is 25.7 ms CPU (2008-era Core2) vs 0.3 ms GPU.

### Estimates for our budget [I — not measured]
| Runtime | cost / simple cell update (5 reads, few branches) | 64×64 chunk (4096 cells) | notes |
|---|---|---|---|
| GDScript (typed, PackedByteArray) | ~0.1–0.3 µs | ~0.4–1.2 ms | ok at 10 Hz for 2–4 active chunks; avoid Variant/Dictionary access |
| JS (typed arrays, V8) | ~5–15 ns | ~0.02–0.06 ms | canvas demos: 256×256 at 60 Hz is fine |
| C#/GDExtension/WASM | ~2–10 ns | ~0.01–0.04 ms | Sandspiel class |
| Fragment shader ping-pong (WebGL2) | ≪1 ns amortized | ~0.01 ms + pass overhead | only for **non-moving** rules (diffusion, gas, pipes, decay); "move-into-cell" liquids need Margolus/checkerboard tricks |

- GPU-friendly rules: SPD gas averaging, virtual pipes (each cell writes only itself; fluxes are per cell), stain decay and dissolve. These are **gather** rules and map to Godot `SubViewport` ping-pong with `canvas_item` shaders in Compatibility mode. CPU-only (scatter) rules: integer moves, reaction tables with random consumption, and corrosion fronts on sprites. [I]
- Checkerboard within a chunk (update even cells, then odd) prevents write conflicts for scatter rules on a single thread too, with no `clock` byte needed. [I]
- Turn-based or tick-based MMORPG (Asterion/Tibia): run the gas and corrosion CAs **server-side per turn** at tile resolution (cheap, authoritative). Run the **visual** sub-tile liquid and stain CA client-side only (cosmetic, can diverge). [I]

---

## 10. Gaps (honest list)
- en.wikipedia.org, minecraft.wiki, jamie-wong.com and imag.fr (Mei PDF) were **blocked** by the fetch allowlist. I used mirrors (Wikipedia mirror on solarspell, Minecraft wiki mirror, CESCG restatement of Mei).
- jgallant blog text was not read. Blinn 1982 was not read. The Noita GDC talk was not watched (64×64 chunks, dirty rects and the 4-pass checkerboard were confirmed via 80.lv; rigid-body marching squares and Box2D were not confirmed).
- There are no measured ms numbers for GDScript CA loops at 64×64. The table in §9 is extrapolated from one microbenchmark.
- Matyka's exact `P = nRT/V` form is not quoted. Only the code form `len·P/volume` is confirmed.

## Sources
- w-shadow, Simple Fluid Simulation With Cellular Automata (2009): https://w-shadow.com/blog/2009/09/01/simple-fluid-simulation
- jgallant LiquidSimulator: https://github.com/jongallant/LiquidSimulator ; https://awesome.ecosyste.ms/projects/github.com%2Fjongallant%2FLiquidSimulator
- DwarfCorp water: https://www.gamedeveloper.com/programming/how-water-works-in-dwarfcorp
- Minecraft fluid (wiki mirror): https://wiki.ronlab.site/content/minecraftwiki_en_all_maxi_2025-11/Fluid
- Mei, Decaudin, Hu 2007 (abstract): https://hgpu.org/?p=2256
- Jákó, CESCG 2011 (pipe equations, timings): https://www.old.cescg.org/CESCG-2011/papers/TUBudapest-Jako-Balazs.pdf
- Noita reaction docs: https://noita.wiki.gg/wiki/Documentation:_Reaction
- Noita Acid: https://noita.wiki.gg/wiki/Acid ; Rusted Metal: https://noita.wiki.gg/wiki/Rusted_Metal
- Noita tech (80.lv): https://80.lv/articles/noita-a-game-based-on-falling-sand-simulation/ ; GDC Vault: https://gdcvault.com/play/1025695/Exploring-the-Tech-and-Design
- r/howdidtheycodeit Noita thread (mirror): https://axebps-redlib.hf.space/r/howdidtheycodeit/comments/ej07ns/exploring_the_tech_and_design_of_noita
- NetHack Rust/erosion: https://nethackwiki.com/wiki/Rust
- SPD source (Blob, ToxicGas, CorrosiveGas, Corrosion, Ooze): https://github.com/00-Evan/shattered-pixel-dungeon/tree/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/actors
- DCSS source (cloud.cc, player.cc, actor.h): https://github.com/crawl/crawl/tree/master/crawl-ref/source
- Caves of Qud corrosive gas: https://wiki.cavesofqud.com/wiki/Corrosive_Gas_Generation
- BG3 Acid surface: https://bg3.wiki/wiki/Acid_(surface)
- Stam stable fluids (mikeash): https://mikeash.com/pyblog/fluid-simulation-for-dummies.html ; paper: https://wdv.com/Aerospace/Fluids/StamFluidsforGames.pdf
- Godot dissolve with burn edge (CC0): https://godotshaders.com/shader/2d-dissolve-with-burn-edge/ ; https://godotshaders.com/?p=10186 ; https://godotshaders.com/shader/dissolve-godot-4-x/
- 2D metaballs (marching squares): https://www.github.com/xtenzQ/2D-metaballs
- Matyka & Ollila 2004: https://arxiv.org/abs/physics/0407003 ; tutorial: https://panoramx.ift.uni.wroc.pl/~maq/soft2d/index.php ; https://panoramx.ift.uni.wroc.pl/~maq/soft2d/node12.html
- JellyCar soft body: https://gamedeveloper.com/programming/deep-dive-the-soft-body-physics-of-jelly-car-explained
- Jakobsen 2003: https://gamedeveloper.com/programming/advanced-character-physics
- Sandspiel: https://maxbittker.com/making-sandspiel
- GDScript typing benchmark: https://beep.blog/2024-02-14-gdscript-typing
- Sulfuric acid (Wikipedia mirror): https://solarspell-dls.sfis.asu.edu/mea/wikipedia/wp/s/Sulfuric_acid.htm ; Sugar charcoal: https://en.wikipedia.org/wiki/Sugar_charcoal
- Acid test (limestone fizz): https://geology.com/minerals/acid-test.shtml
- Acid + carbonate: https://www.thenational.academy/teachers/lessons/chemical-reactions-acid-and-metal-carbonate
