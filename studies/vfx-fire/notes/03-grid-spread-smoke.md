# 03 Grid and spatial techniques for spreading fire and smoke

Angle: cellular-automaton (CA) fire spread on tiles, efficient and networked implementations, smoke as a grid field, noise flow, and measured cost.

Benchmark note. Every "measured here" figure comes from scripts I wrote and ran for this study on 2026-11-10. Hardware was an Apple M4 Pro, Node v26.5.0 and Godot 4.7.stable headless. A desktop M4 Pro is fast. Expect a mid-range phone browser to be roughly 3-6x slower (inference, not measured). Scripts are in the session scratchpad (`bench/stam.js`, `bench/ca.js`, `bench/shape.js`, `bench/bench.gd`). They are not in the repo, so copy them if we want them for the demos.

---

## Q1. Which CA rules give a good tile fire?

### Takeaway
Use 4 or 5 states per tile (fuel, igniting, burning with a fuel counter, burnt/ash, plus non-fuel). Use a Moore neighbourhood with a per-tick ignition chance well below 1, so the front comes out round instead of square or diamond. Multiply the chance by a wind factor of the Alexandridis form `exp(V*(c1 + c2*(cos θ - 1)))`. Give each burning tile a fuel countdown of several ticks. Fire that burns for only one tick dies out at low ignition chances.

### Cited findings
- Drossel-Schwabl (1992, PRL) uses 3 states (empty, tree, burning) and 4 simultaneous rules. Burning becomes empty. A tree with a burning neighbour ignites. A tree ignites spontaneously with probability f. Empty grows a tree with probability p. The usual neighbourhood is von Neumann (4). The control parameter is p/f, the trees planted between lightning strikes. The Wikipedia animation uses p/f = 100. Critical behaviour needs f << p << 1/T_smax. https://en.wikipedia.org/wiki/Forest-fire_model
- Earlier versions are Bak, Chen and Tang (1990) and Henley (1989). Later work (Grassberger 2002, Pruessner and Jensen 2002) shows the scaling is not simple. https://en.wikipedia.org/wiki/Forest-fire_model
- Percolation thresholds on the square lattice: site p_c = 0.592746 for 4-neighbour and about 0.407 for 8-neighbour (NN+2NN, the matching lattice). Bond p_c is exactly 1/2 for 4-neighbour and 0.2504 for 8-neighbour. https://en.wikipedia.org/wiki/Percolation_threshold
  - Game meaning: if under ~59% of tiles are fuel (4-neighbour) or ~41% (8-neighbour), a deterministic fire stays local. Above that it can cross the map.
- Alexandridis et al. 2008 (Applied Mathematics and Computation 204:191-201, Spetses 1990 fire) as restated by Freire and DaCamara 2019 (https://nhess.copernicus.org/articles/19/169/2019/nhess-19-169-2019.html):
  - `p_burn = p0 * (1 + p_veg) * (1 + p_den) * p_w * p_s`
  - p0 = 0.58, wind `p_w = exp(V*(c1 + c2*(cos θ - 1)))` with c1 = 0.045, c2 = 0.131 (V in m/s, θ the angle between wind and spread direction).
  - Slope `p_s = exp(a*θ_s)`, a = 0.078, `θ_s = atan((E1 - E2)/D)`.
  - Roads act as partial firebreaks through negative p_veg = p_den: -0.8 primary, -0.7 secondary, -0.4 tertiary. Water lines use -0.4.
  - 4 states (unburned fuel, burning, burned, no fuel). Moore neighbourhood, 100 m cells, about 20 minutes per step, 100-run ensembles.
  - The c1 and c2 values are confirmed separately in Freire and DaCamara's 2018 discussion paper: https://nhess.copernicus.org/preprints/nhess-2018-227/nhess-2018-227-AR1.pdf
- Lattice CAs spread only along a few fixed angles. Avolio, Di Gregorio and Trunfio report that randomizing the scheme improves accuracy: https://www.oldcitypublishing.com/?p=11020 . Ghisu et al. correct shapes by redefining spread velocity and report Farsite-like results at lower cost (abstract only, via search snippet). Ai et al. compare 5 anisotropy fixes. https://mdpi-res.com/d_attachment/forests/forests-13-01974/article_deploy/forests-13-01974.pdf
- FARSITE uses Huygens wavelets. Each perimeter point grows an ellipse (Richards 1990) whose length-to-breadth ratio comes from Anderson (1983) using midflame wind, minus 0.397 so that no wind gives a circle. https://owfflammaphelp62.firenet.gov/LegacyFARSITE/Tech_Elliptical_Dimensions.htm , https://owfflammaphelp62.firenet.gov/LegacyFARSITE/Tech_Huygens_Principle.htm
- Rothermel (1972, USDA INT-115) is the base for most operational models (cited inside https://arxiv.org/pdf/2403.08817 and the Sullivan review https://arxiv.org/abs/0706.4130).

### Measured here (shape.js, 401x401 grid, all fuel, burn lasts 1 tick)
| Rule | Axis radius | Diagonal radius | Diagonal/axis |
|---|---|---|---|
| Von Neumann, p = 1 | 100 | 70.7 | 0.71 (diamond) |
| Moore, p = 1 | 100 | 141.4 | 1.41 (square) |
| Moore, p_card = 1, p_diag = 0.707 | 100 | 132.9 | 1.33 (still squarish) |
| Von Neumann, p = 0.6, 150 ticks | 100 | 97.6 | 0.98 (round) |
| Moore, p_card = 0.5, p_diag = 0.35, 150 ticks | 149 | 154.1 | 1.03 (round) |
| Moore, p_card = 0.3, p_diag = 0.21 | 10 | 14 | fire died out |

### Inferences
- The 1/sqrt2 diagonal factor alone does not fix the square front when p is near 1, since a diagonal step still covers sqrt2 tiles in one tick. Randomness does the rounding. Any p in roughly 0.35-0.6 per tick gives a round front (Eden-growth-like).
- Burn duration matters as much as p. With T burning ticks, the chance a neighbour catches is `1 - (1-p)^T`. With p = 0.3 and T = 1 the fire dies, as measured. T = 3-6 fixes it. Fuel-type tables should therefore set both p and T, which is what Minecraft does with ignite odds and burn odds (Q3).
- A good game recipe:
  - `p = base[fuel] * (1 - moisture) * windFactor(dir) * slopeFactor * (diag ? 0.707 : 1)`
  - base 0.5 for grass, 0.25 for trees, 0.15 for planks.
  - Burn ticks 2 for grass, 6 for trees, 10 for planks.
  - Use the Alexandridis wind term with V in "game wind units" 0-10. At V = 10 downwind the factor is e^0.45 = 1.57. Upwind (cos = -1) it is e^(10*(0.045-0.262)) = 0.11.
  - Precompute the 8 direction factors once per wind change.
- Firebreaks are non-fuel tiles. Roads become cheap partial breaks with a 0.2-0.6 multiplier, as in Alexandridis.
- Rain: apply a per-tick extinguish chance to burning tiles and raise moisture on fuel. Minecraft numbers are in Q3.
- Smoldering: add a SMOLDER state (burnt but hot) with a small re-ignite chance for N ticks. It gives the "embers flare up" moment. This is my design suggestion. I found no cited game numbers for it.
- Slope is rarely useful in a flat top-down tile game. Use it only if the map has height levels.
- In top-down 3/4 view, the "heat rises" bias should be screen-up. That means a small extra p toward y-1 and smoke drift toward y-1 (Q5).

### Gaps
- No access to the 2008 Alexandridis full text or Table 1 (p_veg and p_den per class).
- I could not fetch the Anderson 1983 L:B equation itself.
- Rothermel simplified for games: no game-specific source found. Treat it as reference only, since it is too heavy for tiles.

---

## Q2. How do roguelikes treat fire, gas and smoke on a grid?

### Takeaway
Brogue's gas is the cheapest good smoke model for a tile game. Each cell holds an integer "volume". Each update the cell takes the 3x3 average of itself and its open neighbours, with the remainder spread at random, and loses 1 volume with a 20% or 50% chance. Fire tests only the 4 cardinal neighbours, using a percent chance per flammable layer. DCSS clouds have a fixed duration, and two opaque cloud tiles block line of sight.

### Cited findings (Brogue CE source, Time.c, https://raw.githubusercontent.com/tmewett/BrogueCE/master/src/brogue/Time.c)
- `updateVolumetricMedia()` averages volume over the cell plus its 8 non-blocking neighbours: `sum / numSpaces`. The remainder is rounded up by a random roll. Walls shrink the divisor, so gas "pushes" along corridors.
- Dissipation applies only to cells that already had gas. `TM_GAS_DISSIPATES_QUICKLY` loses 1 with 50% chance per update, `TM_GAS_DISSIPATES` with 20%.
- Mixing: a cell takes the gas type of its fullest neighbour once its volume exceeds 3. Volume is capped at 3 when types differ.
- The gas update runs twice per environment update, and only if any gas exists.
- Fire: every burning cell calls `exposeTileToFire` on itself and on cardinal directions 0-3 only. Ignition is `rand_percent(chanceToIgnite)`, the highest among the flammable layers. Burning gas sets its volume to 0, which is how methane explodes. Exposure is capped at 12 per update.
- `promoteChance` is a per-10,000 roll for spontaneous tile changes such as burning to burnt.
- A source comment notes a deliberate "bug" that leaves gas uncleared after burning, kept because it looks better.

### Cited findings (DCSS, http://crawl.chaosforge.org/Cloud)
- Line of sight stops after 2 opaque cloud tiles. Steam, smoke colours and blessed fire are opaque.
- Flame cloud damage per turn is (2d23)/2 + 9 for players and (2d16)/2 + 5 for monsters. Steam is (2d16)/2 - 1.
- Spreading flames form when trees catch fire and can light neighbouring trees. No rate is given. Fog scrolls make smoke that spreads to adjacent tiles.

### Inferences
- For Asterion (server-authoritative), the Brogue model maps well onto a byte per tile. It is integer-only, so it stays deterministic across clients when seeded.
- The "2 opaque tiles block sight" rule is a cheap fog-of-war hook. Count opaque smoke tiles along the Bresenham line and stop at 2.

### Gaps
- No exact DCSS cloud durations per spell. The Brogue fandom wiki returned HTTP 402.

---

## Q3. How does Minecraft schedule fire, and what does random tick cost?

### Takeaway
Minecraft Java does not sweep the world for fire. Each fire block schedules its own update every 30-40 game ticks (1.5-2 s), and only within 8 chunks of a player. Fuel blocks are rated with two numbers, ignite odds and burn odds. Rain gives a 20-65% extinguish chance per tick. This is the same "active list plus coarse tick" design as Q4.

### Cited findings (https://minecraft.wiki/w/Fire , https://minecraft.wiki/w/Tick)
- Java: scheduled ticks every 30-40 game ticks at 20 TPS. Bedrock uses random ticks and is affected by randomTickSpeed.
- Fire age runs 0-15, with a +1 chance of 1/3 per block tick. Above age 3 the fire dies if nothing flammable is adjacent. At age 15 there is a 1/4 chance per tick to go out.
- Spread area is 3x3 horizontally, 4 up and 1 down. Base odds are 100 at the same level and 200/300/400 for 2/3/4 blocks up.
- Ignition degree formula (as rendered on the wiki, verify): `maxAdjacentFlammability + 7*difficulty + 40*age + 30`.
- Ignite/burn odds:
  - logs 5/5
  - planks 5/20
  - leaves and wool 30/60
  - bookshelf 30/20
  - hay 60/20
  - grass and flowers 60/100
  - vines 15/100
- Humid biomes halve burn odds, and Bedrock halves spread there.
- Rain on the fire or its 4 neighbours gives an extinguish chance of 20% + 3% per age point (20-65%).
- Random tick: Java picks 3 blocks per 16x16x16 subchunk each game tick. That is one tick per block every ~68 s on average (median 47 s). Bedrock defaults to 1.
- `fire_spread_radius_around_player` (Java 25w44a+) set to 0 makes fire stay forever without spreading.

### Inferences
- For tiles, random tick (K random cells per chunk per tick) costs O(K) and looks organic. It is non-deterministic unless the RNG is seeded per chunk and tick.
- The "two odds per fuel" table is a good template. For a 2D table, map ignite odds to spread p and burn odds to how fast the tile is consumed.

---

## Q4. How fast are full sweeps vs active lists, and how should we network them?

### Takeaway
Keep a list of burning tiles and touch only those and their 8 neighbours. On a 320x180 grid, the active list was 10x cheaper than a full sweep in JS and 35x cheaper in GDScript. On a 1024x1024 map it was 186x cheaper in JS. For the MMO, the server is the authority on ignitions. Send ignition events (tile, tick), and let clients play out burn-down from fuel tables, or send a seed and tick.

### Measured here (fire CA, Moore, 75% fuel density, 3-6 burn ticks, single ignition in the centre)
| Grid | JS full sweep (double buffer) | JS active list | GDScript full sweep | GDScript active list | Max burning tiles |
|---|---|---|---|---|---|
| 64x64 | 0.040 ms | 0.011 ms | 0.61 ms | 0.022 ms | ~500 |
| 128x128 | 0.097 ms | 0.026 ms | 2.86 ms | 0.086 ms | ~1,050 |
| 320x180 | 0.55 ms | 0.056 ms | 10.5 ms | 0.30 ms | ~1,500 |
| 1024x1024 | 15.8 ms (allocates a copy each tick) | 0.085 ms | not run | not run | ~3,000 |

Times are per tick, averaged over 200 ticks. GDScript was typed and used PackedByteArray, running on Godot 4.7 headless. The GDScript full sweep is 15-20x slower than V8 JS on the same loop.

### Cited findings
- Deterministic lockstep sends inputs only. Bandwidth scales with input size, not object count. Bit-identical results need a fixed dt, and float determinism across compilers and architectures is hard ("no silver bullet"). https://gafferongames.com/post/deterministic_lockstep/
- Minecraft Java runs fire on per-block scheduled ticks and only near players (Q3), which is an active-set design.
- Brogue skips the gas pass when no gas exists (Q2).

### Inferences
- Memory: one byte of state plus one byte of fuel/timer per tile. A 1024x1024 map is 2 MB. Burning lists are Int32 indices, about 12 KB for 3,000 tiles.
- Double buffering is needed for a full sweep, so ignitions in one tick do not chain within that tick. The active-list version gets the same effect with a temporary IGNITING state (4) flipped to BURNING at the end of the tick. The IGNITING state is the "igniting" state from the brief.
- Tick rate: fire at 2-5 Hz is plenty. Tibia-style server ticks are coarse, and Minecraft fire runs at 0.5-0.67 Hz per block. Render flicker separately at 8-12 Hz (study #5).
- Network payload (shape.js): a radius-100 front changed 800-1,900 tiles per tick. At 5 bytes per change (x, y, state) that is 4-9.5 KB per tick. That is too much at 5 Hz for many players. Better options:
  1. Send only ignitions as (tileIndex, tick), and let clients derive burnout from the fuel table. The burn time must be deterministic per tile, which works with a hashed seed.
  2. Run the whole CA in lockstep from a seed. Seed the RNG with `hash(worldSeed, tileIndex, tick)` so the result does not depend on iteration order. Use integer math only (xorshift32 plus integer percent tables). The active-list order then does not matter.
  3. Bound it with an ignition budget per tick per chunk, which also caps the server CPU cost.
- For Asterion, keep the fire CA on the server and send per-chunk diffs of tiles that changed state. Clients render flames and smoke locally from the burning set. Clients never simulate spread, so there is no desync risk.

### Gaps
- No C# numbers measured. Godot's docs say C# is about 4x GDScript in naive cases: https://forum.godotengine.org/t/state-of-gdscript-vs-c-performance-in-godot-4-0/5875
- Not measured in a browser WebGL2 export of Godot, which may be slower than native headless.

---

## Q5. Which smoke grid is cheap enough: Stam fluids, advection only, or a smoke CA?

### Takeaway
Full Stam stable fluids at 20 Gauss-Seidel iterations is affordable in JS only at 64x64 (1.8 ms). At 320x180 it takes 32 ms. In GDScript it is out of the question. Two cheap options look fine at pixel scale. One is density-only semi-Lagrangian advection through a fixed or noise wind field, with decay (0.02-0.3 ms in JS). The other is an integer "diffuse, rise and decay" CA (0.08 ms in JS at 320x180, 3.9 ms in GDScript). Render the result through a palette ramp with ordered dithering.

### Cited findings (Stam, "Real-Time Fluid Dynamics for Games", GDC 2003, https://www.dgp.toronto.edu/public_user/stam/reality/Research/pdf/GDC03.pdf)
- Grid arrays are (N+2)^2 with a 1-cell border. It uses 6 float arrays (u, v, u_prev, v_prev, dens, dens_prev).
- Steps are add_source, diffuse, advect and project. Diffuse and project use 20 Gauss-Seidel iterations (`for k<20`).
- Stability: the naive explicit diffusion "start[s] to oscillate ... and finally diverge". The implicit version handles any diff, dt or N.
- Advection is semi-Lagrangian. It traces cell centres back through the velocity field and bilinearly interpolates. The idea goes back to Courant et al. (1952).
- The solver loses energy through numerical dissipation. Vorticity confinement (Fedkiw et al. 2001) adds swirl back.
- It ran on Palm and PocketPC 2002 devices in fixed point (9 fractional bits, `FPP 9`). That fixed-point form is also a path to determinism.
- Parts were covered by US patent 6,266,071 B1 (2001). Inference: that patent has likely expired by 2026. Check before shipping.

### Measured here (stam.js, Float32Array, rectangular port of Stam's code, Node v26)
| Grid | Stam full, 20 GS iters | Stam full, 4 GS iters | Density advect + decay only | Integer smoke CA (diffuse + rise + decay) |
|---|---|---|---|---|
| 64x64 | 1.82 ms | 0.45 ms | 0.019 ms | 0.009 ms (GDScript 0.28 ms) |
| 128x128 | 8.6 ms | 1.97 ms | 0.084 ms | 0.022 ms (GDScript 1.14 ms) |
| 320x180 | 32.1 ms | 7.2 ms | 0.31 ms | 0.077 ms (GDScript 3.9 ms) |

Memory: the Stam version uses 6 Float32 arrays of (W+2)(H+2), so about 1.4 MB at 320x180. The smoke CA uses 2 Uint8 arrays, about 115 KB.

The smoke CA kernel I used: `d = (2*c + left + right + 3*below + 1*above) >> 3; d = max(d-1, 0)`. Weighting the cell below makes smoke drift screen-up, and the -1 per tick is linear decay.

### Inferences
- Simulate smoke at a lower resolution than the screen. For example, run 80x45 (1 cell = 4x4 px) for the 320x180 sandbox and upscale with dithering. It costs nothing and matches the chunky look.
- Wind: add a per-tick offset to the sampling (advection), or skew the CA weights toward downwind. A global wind vector shared with the fire CA links smoke drift and spread direction, which reads well.
- Smoke from fire: each burning tile adds density (e.g. +40) per tick. Each extinguished tile adds one big puff of "steam" (white ramp). Burnt tiles add a little for N ticks (smoldering).
- Line of sight: threshold the smoke field (e.g. > 128 = opaque) and reuse the DCSS 2-tile rule. Only the server needs this for gameplay. Clients only draw it.
- Godot web (Compatibility/WebGL2): there are no compute shaders, but a SubViewport ping-pong fragment shader can run advection on the GPU. Do this only if the CPU path gets too slow, since CPU at 80x45 is trivial.
- GDScript is 30-50x slower than V8 on these loops (measured ratio). In Godot, keep any per-cell sim at or under 128x128, or move it to a shader or GDExtension.

### Gaps
- No published ms figures for Stam 1999 "Stable Fluids" on old hardware. The GDC paper says only "real-time for reasonable grid sizes".
- Did not benchmark a GPU shader version.

---

## Q6. What can flow noise and curl noise do for smoke and flame masks?

### Takeaway
Use curl noise to move smoke particles or puffs without them clumping. Take the 2D curl of a scrolling noise stream function, `v = (dψ/dy, -dψ/dx)`, which is divergence-free by construction. For flame shapes, scroll value noise upward and subtract a vertical gradient, then quantize to a 4-6 colour ramp. Domain warping (noise of noise) adds licking motion.

### Cited findings
- Bridson, Hourihan and Nordenstam, "Curl-Noise for Procedural Fluid Flow", ACM TOG 26(3), SIGGRAPH 2007. In 2D the velocity comes from derivatives of a scalar stream function, so it is divergence-free. Plain noise velocity has "sinks" where particles pile up. Boundaries are handled by ramping ψ to 0 near solids. Kniss and Hart used curl of Perlin noise earlier. https://www.dneg.com/wp-content/uploads/2022/11/2007.pdf , https://history.siggraph.org/?p=115355

### Inferences
- Cost: one 2D noise lookup gives ψ, and finite differences need 2 more lookups. For 200 smoke puffs that is about 600 noise calls per frame, which is negligible.
- In pixel art, snap particle positions to whole pixels and draw 1-3 px puffs with a dithered alpha ramp, so the motion stays crisp.
- Scrolling-noise flame masks belong to angle 01 (small fires). I note it here only as the spatial technique.

### Gaps
- No pixel-art game found that documents curl noise smoke specifically.

---

## Recommended stack for Kingsfoil (inference)
1. Fire spread: server-side byte-grid CA with an active list, Moore neighbourhood, p of 0.3-0.6 times moisture times wind factor, 2-10 burn ticks per fuel, and a 2-5 Hz tick. Network ignitions per chunk. Cost is under 0.1 ms per tick in JS at map scale.
2. Smoke: client-side Brogue-style integer averaging or a diffuse-rise-decay CA at 1/4 screen resolution, with global wind. Draw it through a 4-colour ramp with Bayer dithering. Cost is under 0.1 ms in JS and about 0.3 ms in GDScript at 80x45 (inference from the 64x64 figure).
3. Hero smoke columns: 50-200 particles moved by curl noise plus wind plus rise.
4. Skip full Stam fluids unless one small fixed 64x64 showcase effect is wanted (1.8 ms JS at 20 iterations, 0.45 ms at 4 iterations).

## Sources
- https://en.wikipedia.org/wiki/Forest-fire_model
- https://en.wikipedia.org/wiki/Percolation_threshold
- https://nhess.copernicus.org/articles/19/169/2019/nhess-19-169-2019.html
- https://nhess.copernicus.org/preprints/nhess-2018-227/nhess-2018-227-AR1.pdf
- https://arxiv.org/pdf/2403.08817
- https://arxiv.org/abs/0706.4130
- https://www.oldcitypublishing.com/?p=11020
- https://mdpi-res.com/d_attachment/forests/forests-13-01974/article_deploy/forests-13-01974.pdf
- https://owfflammaphelp62.firenet.gov/LegacyFARSITE/Tech_Elliptical_Dimensions.htm
- https://owfflammaphelp62.firenet.gov/LegacyFARSITE/Tech_Huygens_Principle.htm
- https://minecraft.wiki/w/Fire
- https://minecraft.wiki/w/Tick
- https://raw.githubusercontent.com/tmewett/BrogueCE/master/src/brogue/Time.c
- http://crawl.chaosforge.org/Cloud
- https://gafferongames.com/post/deterministic_lockstep/
- https://www.dgp.toronto.edu/public_user/stam/reality/Research/pdf/GDC03.pdf
- https://www.dneg.com/wp-content/uploads/2022/11/2007.pdf
- https://history.siggraph.org/?p=115355
- https://forum.godotengine.org/t/state-of-gdscript-vs-c-performance-in-godot-4-0/5875
- Blocked: https://brogue.fandom.com/wiki/Gas (HTTP 402). I used the Brogue CE source on GitHub instead.
