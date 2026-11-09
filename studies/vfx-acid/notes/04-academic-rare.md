# 04 — Academic and rare publications: acid, corrosion, weathering, goo

Angle: verify the academic lineage behind corrosion/etch/goo effects and turn each paper into "the cheapest thing a top-down pixel game (Godot 4, WebGL2, small grids) can steal".
Verification method: every DOI below was resolved against the Crossref API (api.crossref.org/works/DOI) on 2026-11-08 unless marked otherwise; abstracts/author pages fetched where available.

Legend: **[C]** = cited finding (URL given). **[I]** = my inference / engineering estimate. **[U]** = unverified (recalled, not confirmed this session).

---

## Q1. What do the weathering/corrosion graphics papers actually do, and what can a pixel game steal?

### Takeaway
Nearly every weathering paper reduces to three cheap ideas that map directly to a palette-index tile grid: (1) **a per-texel "age/damage" scalar** that is advanced by local exposure rules and then **looked up in an ordered appearance ramp** (appearance manifolds, STAF, Bellini); (2) **seeded random-walk / aggregation growth fronts** for pits, rust and lichen (Mérillou corrosion, Desbenoit lichen/DLA); (3) **transport particles that carry an agent and deposit it where they stop** (Dorsey flow 1996, γ-ton tracing 2005). Layered materials (patina: coat/erode/polish) give the equipment "corrosion stage" model for free.

### Cited findings, paper by paper

**1. Dorsey & Hanrahan 1996 — "Modeling and rendering of metallic patinas"** [C]
- SIGGRAPH '96 Proceedings, pp. 387–396. DOI 10.1145/237170.237278. Page: https://graphics.stanford.edu/papers/patina/
- Core: surface = stack of layers; patina evolves via operators "coat", "erode", "polish", modulated by geometry and local environment; Kubelka-Munk for light through layers; demonstrated on copper models (https://graphics.stanford.edu/papers/patina/).
- Numbers: accompanying movie shows a Buddha aging "approximately 30 years", dark tarnish first, then green patina (same page).
- Cheapest pixel approximation [I]: per item/tile a tiny layer stack `[base, tarnish, patina/rust, hole]` as 2-bit stage counters; "coat" = increment stage where exposure > threshold, "erode" = decrement on wear/rain, "polish" = reset to base on high-traffic pixels (edges of a sword, door handles). Render = palette swap per stage (no Kubelka-Munk).
- Limitations: offline, 3D, physically-styled; layer optics irrelevant at 16×16.
- **What to steal:** the coat/erode/polish verbs as the 3 operations on an equipment corrosion counter (acid = coat fast, sharpening/whetstone = polish).

**2. Dorsey, Edelman, Jensen, Legakis, Pedersen 1999 — "Modeling and rendering of weathered stone"** [C]
- SIGGRAPH '99, pp. 225–234. DOI 10.1145/311535.311560. Page: https://graphics.stanford.edu/~henrik/papers/sig99/
- Core: "slab" = thin surface-aligned volume where change happens; simulates moisture flow through pores, mineral dissolution/transport/recrystallization, and surface erosion; Monte Carlo subsurface scattering for rendering; granite/marble statues, sandstone column (same page). No numeric parameters in abstract.
- Cheapest pixel approximation [I]: the "slab" is literally a per-tile depth byte (same as the SNOW study's depth byte). Acid on stone = decrement depth byte + darken; dissolved mineral "recrystallizes" as a pale crust ring at the stain's evaporating edge (deposit where moisture leaves).
- Limitations: volumetric, offline, subsurface rendering irrelevant for pixel art.
- **What to steal:** "change happens only in a thin skin" → one byte of depth per pixel; plus "deposit at the drying edge" for stain rings.

**3. Mérillou, Dischler, Ghazanfarpour 2001 — "Corrosion: simulating and rendering"** [C]
- Graphics Interface 2001. Page: https://graphicsinterface.org/?p=2843 ; PDF: https://graphicsinterface.org/wp-content/uploads/gi2001-20.pdf (Crossref did not index it; verified via GI site).
- Core (from PDF):
  - Corrosion map = "thick plate" (1 m², user thickness in mm) mapped onto the object.
  - Seeds placed with probability ∝ face area × k_str (scratches, >1) × k_gr (grease, <1) × k_ext (environment).
  - Spreading = random walk: a front pixel corrodes a random non-corroded 8-neighbour; a pixel fully surrounded by corroded pixels deepens instead; depth > real thickness ⇒ **hole**.
  - New seeds appear over time (0..n₀ per step).
  - Mass loss w(t) = k·tⁿ fitted to ISO 9223 steel data, e.g. medium corrosivity k = 274.6, n = 0.516; depth increment δ from Δmass / iron density (7.8 g/cm³) / pixel area, randomized; **pitting factor ×10** (empirical).
  - Galvanic contact: less noble metal corrodes faster, factor = protected/corroded area ratio; differential aeration: faces within ~1 mm of another object get higher seed probability.
  - Rendering: reflectance, colour, height maps; porosity 80%, roughness ~3×; colours from iron-oxide table/photos.
  - Authors: "not a fully physical model"; no runtimes or map resolution given.
- Cheapest pixel approximation [I]: this IS the pixel algorithm. On a 16×16 item sprite mask: `seeds` at scratch/edge pixels; each tick pick k front pixels, corrode one random 8-neighbour, or deepen if surrounded; depth ≥ thickness ⇒ set pixel transparent (hole). Cost: O(front length) per tick — a few dozen ops per item; easily run only when acid touches the item.
- **Numbers to steal [I]:** w ∝ t^0.5 (diminishing corrosion: fast at first, then slows — good for "acid consumed / self-limiting" feel); pitting ×10 depth on a few seeds gives holes before uniform thinning; grease/oil coat = seed probability × <1 (an "oiled" item buff).
- Limitations: offline; no paint layer; random-walk anisotropy on square grids.
- **What to steal:** front random-walk + "deepen when surrounded" + hole at thickness — the whole equipment-corrosion mechanic in ~20 lines.

**4. Chen, Xia, Wong, Tong, Bao, Guo, Shum 2005 — "Visual simulation of weathering by γ-ton tracing"** [C]
- ACM TOG 24(3) (SIGGRAPH 2005), pp. 1127–1133. DOI 10.1145/1073204.1073321.
- Core (abstract via Crossref): trace many "aging-inducing particles" (γ-tons) through the scene like photon tracing, record transport, then generate the effect; handles global transport such as "stain bleeding".
- Cheapest pixel approximation [I]: fumes/drips as a handful of 2D "acid motes" emitted from a pool each tick; each does a short biased random walk (downhill on a height/tile map, or with wind), and on stopping writes +1 to a per-pixel stain byte. 32–64 motes/tick over a 64×64 room ≈ trivial.
- Limitations: offline ray tracing; 3D geometry.
- **What to steal:** "emit agents from the source, accumulate where they land" → stains bleed realistically around walls/corners without any fluid sim.

**5. Mérillou & Ghazanfarpour 2008 — "A survey of aging and weathering phenomena in computer graphics"** [C]
- Computers & Graphics 32(2), pp. 159–174, April 2008. DOI 10.1016/j.cag.2008.01.003.
- Use: index of the field (corrosion, patina, cracks, stains, peeling, lichen, etc.). Abstract not available via Crossref; content not fetched.
- **What to steal:** use as a reading list if a specific phenomenon (e.g., peeling paint on shields) needs a reference.

**6. Wang, Tong, Lin, Pan, Wang, Bao, Guo, Shum 2006 — "Appearance manifolds for modeling time-variant appearance of materials"** [C]
- ACM TOG 25(3) (SIGGRAPH 2006), pp. 754–761. DOI 10.1145/1141911.1141951.
- Core (abstract): from ONE captured instant, "concurrent variations in appearance over a surface represent different degrees of weathering"; order those appearances by weathering degree and use that ordering to render any point in time, forward or backward.
- Cheapest pixel approximation [I]: an artist-authored **1-D palette ramp per material** (e.g., steel: bright → dull → orange spots → dark rust → hole). Each pixel stores a damage index 0..N; rendering = palette lookup (exactly the DOOM-fire indexed-palette trick). Godot: one `sampler2D` LUT row per material in a canvas_item shader.
- **What to steal:** "damage = index into an ordered ramp"; the ramp is the art, the sim only moves an integer.

**7. Gu, Tu, Ramamoorthi, Belhumeur, Matusik, Nayar 2006 — "Time-varying surface appearance: acquisition, modeling and rendering"** [C]
- ACM TOG 25(3) (SIGGRAPH 2006), pp. 762–771. DOI 10.1145/1141911.1141952.
- Core (abstract): first time-varying database of **26 samples** (burning wood, drying rock/fabric, decaying fruit, corrosion/rusting of steel and copper); Space-Time Appearance Factorization (STAF) separates a global temporal characteristic curve from space-dependent textures/rates/offsets.
- Cheapest pixel approximation [I]: STAF in pixel form = `appearance(x,t) = ramp( curve( rate(x)·t − offset(x) ) )` — one shared curve per material, plus a per-pixel rate and offset baked into a noise texture (2 bytes/pixel). Gives non-uniform, spotty progression with zero simulation.
- **What to steal:** per-pixel `rate`/`offset` noise + a shared timing curve → corrosion that "starts in spots and spreads" with a single shader uniform `t`.

**8. Dorsey, Pedersen, Hanrahan 1996 — "Flow and changes in appearance"** [C] (CORRECTION to brief)
- The brief lists "Bosch et al. 2004 'Flow and changes in appearance'". The paper titled "Flow and Changes in Appearance" is **Dorsey, Køhling Pedersen, Hanrahan, SIGGRAPH 1996**, DOI 10.1145/237170.237280 (https://graphics.cs.yale.edu/publications/flow-and-changes-appearance; https://graphics.stanford.edu/papers/flow).
- Bosch, Pueyo, Mérillou, Ghazanfarpour **2004** is actually "A physically-based model for rendering realistic scratches", Computer Graphics Forum 23(3), pp. 361–370, DOI 10.1111/j.1467-8659.2004.00767.x (verified via Crossref).
- Dorsey flow core: water drops as particles moved by gravity, friction, wind, roughness, constrained to the surface; coupled ODEs for absorption and for dissolution/settling of deposits ⇒ washes and stains (Yale page).
- Cheapest pixel approximation [I]: the γ-ton/mote trick above, plus "pick up" (dissolve stain where the mote moves fast) and "drop" (deposit where it slows/evaporates).
- Bosch scratches: pixel use = scratch lines on armour as seed sites for corrosion (Mérillou's k_str > 1).
- **What to steal:** pick-up/deposit particles = acid runoff streaks along a dungeon floor slope.

**9. Paquette, Poulin, Drettakis — impacts (2001) and paint cracking/peeling (2002)** [C]
- "Surface aging by impacts", Graphics Interface 2001: https://profs.etsmtl.ca/epaquette/Research/Papers/Paquette.2001/ ; PDF https://graphicsinterface.org/wp-content/uploads/gi2001-21.pdf ; HAL https://hal.archives-ouvertes.fr/inria-00510052
- "The simulation of paint cracking and peeling", Graphics Interface 2002: https://graphicsinterface.org/proceedings/gi2002/gi2002-8 ; PDF https://graphicsinterface.org/wp-content/uploads/gi2002-8.pdf
- (Content not fetched this session; only existence/venue verified.)
- Cheapest pixel approximation [I]: impacts = stamp a small dent sprite into the item's damage byte at the hit pixel; peeling = flood-fill outward from a crack seed while a "paint adhesion" byte is below threshold (acid lowers adhesion).
- **What to steal:** hits create seed sites; acid exploits them (combo: damaged shield corrodes faster).

**10. Desbenoit, Galin, Akkouche 2004 — "Simulating and modeling lichen growth"** [C]
- Computer Graphics Forum 23(3) (Eurographics 2004), pp. 341–350. DOI 10.1111/j.1467-8659.2004.00765.x.
- Core (abstract): propagation via an **Open Diffusion-Limited Aggregation** model constrained by environment; designer controls with simple parameters; rendering by instancing 3D lichen shapes from an atlas.
- Cheapest pixel approximation [I]: DLA/Eden growth on a tile mask, biased by a moisture/acid map; render with 2–3 small pixel stamps (the "atlas" = 4 pixel-art lichen/rust blotch sprites).
- **What to steal:** "growth algorithm decides WHERE, an atlas of hand-drawn stamps decides LOOK" — ideal for pixel art where procedural pixels look noisy.

**11. Lu, Georghiades, Glaser, Wu, Wei, Guo, Dorsey, Rushmeier 2007 — "Context-aware textures"** [C]
- ACM TOG 26(1), article 3, January 2007. DOI 10.1145/1189762.1189765.
- Core (abstract): captures progressively varying textures (rust, paint cracking, mold) plus the geometric context parameters that drive them (exposure, etc.), then transfers to new objects; UI to paint where the object is exposed.
- Cheapest pixel approximation [I]: precompute per tile/item an **exposure mask** (edges, convex corners, floor-wall junctions, low points where liquid pools) and multiply corrosion rate by it — same as the SNOW study's exposure mask.
- **What to steal:** reuse the SNOW exposure mask as `corrosionRate *= exposure`.

**12. Bellini, Kleiman, Cohen-Or 2016 — "Time-varying weathering in texture space"** [C]
- ACM TOG 35(4) (SIGGRAPH 2016), article 141, pp. 1–11. DOI 10.1145/2897824.2925891.
- Core (abstract): from a single texture, estimate weathering degree per region by **prevalence analysis of patches** (rare patches = more weathered); then increase/decrease the prevalence of weathered patches to animate forward/backward; physically oblivious; no user interaction.
- Cheapest pixel approximation [I]: offline tool use only — author ONE "fully corroded" tileset and ONE clean tileset, then at runtime blend per pixel via a threshold on a noise/age texture (dither threshold like SNOW). Tile-swap between 3–4 authored variants as damage crosses thresholds.
- Limitations: patch synthesis is offline/expensive; not for runtime.
- **What to steal:** generate the intermediate corrosion stages of a tileset offline from the end states (or simply author 3–4 stages and threshold-blend).

### Inferences (cross-paper)
- [I] A complete equipment-corrosion model = Mérillou random-walk front (WHERE) + appearance-manifold ramp (LOOK) + w∝t^0.5 rate (WHEN) + exposure/scratch multipliers (CONTEXT). Total state: 1 damage byte per sprite pixel + 1 hole bit.
- [I] For tiles (floors/walls) use STAF-style per-pixel rate/offset noise + global time uniform: zero CPU.

### Gaps
- No runtime numbers in any of these papers for small grids (all offline). Paquette and the 2008 survey content not read this session.

---

## Q2. Pattern generators for corrosion/etch: cost on small grids

### Takeaway
On a 64×64 (4,096-cell) grid every generator below is cheap in JS/GDScript-on-GPU terms; reaction-diffusion needs many iterations per visible change, so precompute it (bake an etch texture) rather than run it live. DLA/Eden and random-walk fronts are the best runtime fits for acid etch (cost scales with front size, not area). Physarum is the best fit for living goo/slime trail networks.

### Cited findings
- **Turk 1991**, "Generating textures on arbitrary surfaces using reaction-diffusion", SIGGRAPH '91, Computer Graphics 25(4), pp. 289–298, DOI 10.1145/127719.122749 — chemicals diffusing at unequal rates react to form spots/stripes; cascades of systems (Crossref abstract).
- **Witkin & Kass 1991**, "Reaction-diffusion textures", same volume pp. 299–308, DOI 10.1145/127719.122750 — anisotropic and spatially non-uniform diffusion; efficient algorithms (Crossref abstract).
- **Pearson 1993**, "Complex patterns in a simple system", Science 261(5118):189–192, DOI 10.1126/science.261.5118.189 — Gray-Scott; includes spots that grow to a critical size then divide, and overcrowded spots decaying to background (Crossref abstract). (That spot-division behaviour is literally a "splitting slime" pattern.)
- **Gray-Scott practical parameters** (Karl Sims tutorial, https://karlsims.com/rd.html): DA = 1.0, DB = 0.5, f = 0.055, k = 0.062, Δt = 1.0; mitosis f = 0.0367, k = 0.0649; coral f = 0.0545, k = 0.062; 3×3 Laplacian: centre −1, edges 0.2, diagonals 0.05; init A = 1, B = 0, seed small area with B = 1.
- **Witten & Sander 1981**, "Diffusion-limited aggregation, a kinetic critical phenomenon", Phys. Rev. Lett. 47:1400–1403, DOI 10.1103/PhysRevLett.47.1400.
- **Eden growth** — Eden, M. 1961, "A two-dimensional growth process", 4th Berkeley Symposium on Mathematical Statistics and Probability [U — not verified this session]. Rule: each step, occupy a random empty neighbour of the cluster (compact blob with rough edge).
- **Jones 2010**, "Characteristics of pattern formation and evolution in approximations of Physarum transport networks", Artificial Life 16(2):127–153, DOI 10.1162/artl.2010.16.2.16202 — agents with chemotaxis form dynamic transport networks; parameter maps; network lacunae contract (Crossref abstract).
  - Example values from a Jones paper (UWE repository PDF https://uwe-repository.worktribe.com/index.php/OutputFile/837928): sensor angle 22.5°, rotation angle 45°, sensor offset 9 px, lattice 200×200, **6,000 agents**. (Not labelled "defaults"; step size/deposit/decay not given numerically there.)
  - Sage Jenson's implementation (https://hn.jakechampion.name/reader/https://cargocollective.com/sagejenson/physarum — mirror; original cargocollective blocked): per tick sense (3 sensors) → turn → move → deposit → diffuse (3×3 mean) → decay (multiplicative); 5–10 million particles on GPU in real time on a GTX 1070.

### Inferences — per-frame cost on small grids [I]
| Generator | State | Cost per step on 64×64 | Steps for visible change | Pixel-game use |
|---|---|---|---|---|
| Gray-Scott RD | 2 floats/cell | ~4k cells × (2×9-tap + few mults) ≈ 80k flops | hundreds–thousands | **Bake offline** into etch/pit textures; or run in a shader on a 128×128 viewport-tiny texture for a "living acid surface" (GPU, ~free) |
| DLA (Witten–Sander) | 1 bit/cell + walkers | walkers random-walk until contact; worst case long walks | 1 particle stuck per walker | Etch "lightning" branches from impact point; use **biased/short-launch DLA** (launch walkers at radius r_cluster+2) to cap walk length |
| Eden | 1 bit/cell + frontier list | O(1) per added cell | 1 cell/step | Blobby compact stain/pit growth; best for "acid eats a hole" |
| Mérillou random-walk front | depth byte/cell | O(k) per tick | k cells/tick | Equipment corrosion (see Q1) |
| Physarum (Jones) | trail float/cell + agents | agents×(3 samples+write) + 9-tap blur over grid | continuous | Slime trails, ooze network creatures, fungal acid veins; 500–2,000 agents on 64×64 is plenty (scaled from Jones 6,000 on 200×200 ≈ 0.15 agents/cell) |

- [I] Quantize all outputs to 3–5 palette steps + ordered dither (SNOW pipeline) so procedural noise reads as pixel art.

### Gaps
- No measured ms numbers on WebGL2/Godot for these grids; would need the demo to benchmark.

---

## Q3. Liquids: what level of simulation is justified?

### Takeaway
For acid pools on a tile grid, a **virtual-pipes height-field** (O'Brien & Hodgins 1995; Mei et al. 2007) is the ceiling of what's justified — it is O(cells), stable with outflow scaling, and gives spreading/pooling into low tiles. Stable Fluids is for gas/fume advection (could drive a 32×32 fume field) and PBF is overkill.

### Cited findings
- **O'Brien & Hodgins 1995**, "Dynamic simulation of splashing fluids", Proc. Computer Animation '95, pp. 198–205, DOI 10.1109/CA.1995.393532 (Crossref; arXiv re-post https://arxiv.org/pdf/2302.06087). Origin of the column-and-pipe model.
- **Mei, Decaudin, Hu 2007**, "Fast hydraulic erosion simulation and visualization on GPU", Pacific Graphics 2007, pp. 47–56, DOI 10.1109/PG.2007.15 — virtual pipes + erosion/deposition on GPU.
- Practical write-up (lisyarus, https://lisyarus.github.io/blog/posts/simulating-water-over-terrain.html):
  - State: `water[N×N]`, `flowX[(N+1)×N]`, `flowY[N×(N+1)]` (store flow, not velocity — velocity is ill-defined in empty cells).
  - `flow = flow·(1−friction)^dt + (surfaceL − surfaceR)·g·dt/dx`.
  - Outflow scaling: if total outflow > `water·dx·dy/dt`, scale all outflows by `min(1, max/total)` ⇒ never negative.
  - `water += (in − out)·dt/(dx·dy)`; dt ≈ 0.001–0.01 tuned with g; linear cost; spurious waves when first spreading.
- **Extended virtual pipes** for small-scale shallow water: Dagenais, Paquette et al. 2018, Computers & Graphics (https://profs.etsmtl.ca/epaquette/Research/Papers/Dagenais.2018.cg/) — exists; content not read.
- **Stam 1999**, "Stable fluids", SIGGRAPH '99 pp. 121–128, DOI 10.1145/311535.311548 (semi-Lagrangian advection + projection; unconditionally stable).
- **Macklin & Müller 2013**, "Position based fluids", ACM TOG 32(4), DOI 10.1145/2461912.2461984 — iterative density solver in PBD; incompressibility like SPH with large time steps; artificial pressure term gives surface tension (Crossref abstract).

### Inferences [I]
- Acid spill on a 64×64 room at 1 cell/pixel-tile: pipes model = ~4k cells × ~10 ops × 2–4 substeps ≈ 100–160k ops/frame — fine in GDScript only if run at 10–15 Hz; better as a ping-pong shader (WebGL2 supports float/half-float render targets via EXT_color_buffer_float — verify in Godot Compatibility).
- Add acid-specific terms per cell: `evaporate: water *= 1−e`, `consume: water −= r·reactivity(tile)`, `neutralize: if lime>0 { water−=min; lime−=min; salt += …}`. Self-limiting reactions come for free.
- Even cheaper "DOOM-style" alternative: integer cellular automaton (falling-sand-like): each cell holds 0–7 units; each tick give 1 unit to the lowest neighbour if difference > 1. Good enough for flat dungeon floors.
- Stable Fluids: use only for fume clouds at 32×32 with 2–4 Jacobi iterations, or replace with "advect by wind + blur + decay" (what Physarum's diffuse/decay step is).
- PBF: overkill — needs neighbour search and many particles; mention as "no".

### Gaps
- No Godot-specific benchmarks found.

---

## Q4. Blobs and soft bodies for slimes/oozes

### Takeaway
Render slimes as **metaball threshold fields** (Blinn 1982 / Wyvill 1986) quantized to 2–3 palette bands (the same threshold logic as the acid pool), and animate their outline with **Verlet points + distance constraints + a pressure/area term** (Jakobsen 2001, Matyka & Ollila, Müller PBD). Rain World shows that a few physics circles with procedural cosmetic parts read as very alive.

### Cited findings
- **Blinn 1982**, "A generalization of algebraic surface drawing", SIGGRAPH '82, Computer Graphics 16(3), DOI 10.1145/965145.801290 (also 10.1145/800064.801290) — "blobby" density sum + iso-threshold (metaballs).
- **Wyvill, McPheeters, Wyvill 1986**, "Data structure for soft objects", The Visual Computer 2(4):227–234, August 1986, DOI 10.1007/BF01900346; companion "Soft Objects" in Advanced Computer Graphics (CG Tokyo '86), DOI 10.1007/978-4-431-68036-9_8. (Soft objects use a field with finite radius — polynomial falloff — so only nearby blobs contribute [U on exact polynomial; from general knowledge].)
- **Marching squares**: 2D analogue of marching cubes for contouring a scalar grid [U — no primary citation retrieved; standard technique].
- **Matyka & Ollila**, "Pressure model of soft body simulation", arXiv physics/0407003 (submitted 1 July 2004), https://arxiv.org/abs/physics/0407003 — spring-mass shell + internal pressure force added to the force accumulator; real-time; fixed or variable internal pressure. Slides suggest it was presented at SIGRAD 2003: https://panoramx.ift.uni.wroc.pl/~maq/talks/sigrad03/SoftBodyPresentation.pdf ; 2D tutorial https://panoramx.ift.uni.wroc.pl/~maq/soft2d/index.php
- **Müller, Heidelberger, Hennix, Ratcliff 2007**, "Position based dynamics", J. Visual Communication and Image Representation 18(2), April 2007, DOI 10.1016/j.jvcir.2007.01.005 (Crossref search hit); PDF mirror https://alecjacobson.com/seminar/mueller-et-al-2007.pdf (original VRIPHYS 2006).
- **Jakobsen, "Advanced character physics"** — Game Developer article https://gamedeveloper.com/programming/advanced-character-physics (page dates it Jan 21, 2003; originally a GDC 2001 talk [U on GDC year — widely cited, not confirmed this session]). Verlet with position + previous position ("velocity-less representation"); constraints via repeated projection; "only one iteration is necessary" for most cloth; sqrt approximation via first-order Taylor around rest length r (one division using r²); developed at IO Interactive for Hitman: Codename 47 (Glacier), corpses with 1–10 relaxation iterations.
- **Rain World** (Joar Jakobsson, James Therrien), GDC 2016 Animation Bootcamp talk "procedural animation done well": https://gamedeveloper.com/art/video-animating-i-rain-world-i-and-its-many-squishy-stretchy-creatures ; video https://www.youtube.com/watch?v=sVntwsrjNe4. Unity blog (https://unity.com/blog/exploring-procedural-design-rain-world): slugcat = two spherical chunks "locked to each other at a fixed distance"; limbs/tail cosmetic and procedural; sprites positioned/coloured by a graphics script; modular AI (PreyTracker, ThreatTracker, ItemTracker…); 100+ creatures base game, 25 more in The Watcher DLC.

### Inferences [I]
- Slime = ring of 8–12 Verlet points around a centre + distance constraints (perimeter) + area/pressure constraint (push points out along normals by `k·(A0 − A)/perimeter`). 1–2 relaxation iterations/frame (Jakobsen). Cost: ~12 points × few ops — hundreds of slimes OK.
- Render: evaluate metaball field `Σ r²/d²` only in the slime's bounding box at pixel resolution (e.g., 24×24 = 576 samples × n_balls), threshold into 3 bands (rim / body / core highlight), ordered-dither the band edges. Same shader as acid pools ⇒ slimes "melt into" puddles by lowering threshold/raising spread.
- Splitting: when area > A_split, duplicate centre into two blobs (Pearson's spots-that-divide is the visual model). Absorbing items: item sprite drawn inside body band with tint + offset sinking over N seconds, its corrosion counter advancing (Q1 model).
- Death: convert body area to pool "water" units in the pipes/CA grid (conservation — same idea as SNOW's conserve-and-displace).

### Gaps
- Exact Wyvill polynomial and Matyka pressure equation not read from primary PDFs this session.

---

## Q5. Real-world reference data for tuning and flavour

### Takeaway
Real chemistry gives defensible design rules: dilute strong acids attack iron fast with hydrogen bubbles; concentrated sulfuric acid oddly **passivates** carbon steel (iron sulfate film) if still and cool; copper/tin barely react with dilute HCl/H₂SO₄ (so gold/copper/glass = "resistant" tier is plausible); concentrated sulfuric acid **chars** wood/paper/sugar by dehydration (so acid on wood = blacken, not dissolve); acids cause **coagulative** tissue injury that forms a self-limiting barrier, whereas alkalis cause **liquefactive** injury that penetrates deeper (design: acid DoT should taper; a "caustic/base" damage type could be the deeper, longer DoT).

### Cited findings
- **Corrosion time law**: ISO 9223-fitted w(t) = k·tⁿ, n ≈ 0.5 (medium corrosivity k = 274.6, n = 0.516) — atmospheric steel corrosion slows over time (Mérillou et al. GI 2001, https://graphicsinterface.org/wp-content/uploads/gi2001-20.pdf).
- **Carbon steel + concentrated sulfuric acid**: contact causes immediate attack producing hydrogen and ferrous ions, which form a protective FeSO₄ layer — Panossian et al. 2012, "Corrosion of carbon steel pipes and tanks by concentrated sulfuric acid: a review", Corrosion Science 58:1–11 (https://ipt.br/2021/09/29/corrosion-of-carbon-steel-pipes-and-tanks-by-concentrated-sulfuric-acid-a-review-2/).
- **Concentration matters** (Rolled Alloys guide, https://www.rolledalloys.ca/?p=3051): carbon steel "virtually unattacked" at 88–99.5% acid, < 2 ft/s, < 120 °F; protective film easily damaged at higher velocity; below ~70% (reducing range) plain steel/400-series/304L have "no practical use"; 316L > 5 mpy (≈ 0.13 mm/y) below ~85% at room temperature; Alloy 20 < 5 mpy up to ~135 °F. (Vendor source — flag as vendor-reported.)
- **Metals + dilute acid → salt + hydrogen**: magnesium reacts vigorously; zinc and iron less vigorously; tin and copper do not react with HCl or H₂SO₄ (RSC microscale practical, https://edu.rsc.org/experiments/microscale-reactions-of-metals-with-acids/509.article).
- **Sulfuric acid chars organics**: "a strong dehydrating agent" that chars wood, paper, sugar leaving carbon-rich residue; combines violently with water (Britannica, https://www.britannica.com/science/sulfuric-acid).
- **Tissue (brief, non-graphic)**: acids produce coagulative necrosis; the resulting eschar limits further penetration; alkalis cause liquefaction and penetrate more deeply (https://www.forensicmed.co.uk/wounds/burns/chemical-and-electrical-burns/). NCBI/StatPearls pages were blocked (captcha / robots) — not used.
- **Gold**: resists single acids; dissolves in aqua regia (HNO₃ + HCl) — [U: only low-quality sources returned this session; general chemistry knowledge. Wisconsin sustainable-nano blog https://sustainable-nano.com/2018/12/04/what-is-aqua-regia/ redirected to a non-allowlisted host].

### Inferences — design translation [I]
| Real rule | Game rule |
|---|---|
| w ∝ t^0.5 | Corrosion per second = base·(1/√(1+age)); first seconds of contact matter most |
| Dilute acid + iron → H₂ bubbles | Fizz particles + small "flammable gas" cloud tag over iron in acid (acid + metal + fire ⇒ pop) |
| Concentrated H₂SO₄ passivates still steel | Optional "strong acid" quirk: iron in still concentrate stops after a crust stage; agitation/water dilution restarts it (counter-intuitive but true — maybe too clever for players) |
| Copper/tin no reaction with dilute HCl/H₂SO₄; gold resists | Resistance tiers: gold/glass immune, copper/bronze slow, iron/steel fast, magnesium-like "light alloy" violent |
| H₂SO₄ dehydrates wood → char | Wood: blacken + brittle (durability loss) rather than dissolve; no smoke flame |
| Acid + water exotherm (Britannica "combines violently with water") | Pouring water on concentrated acid = brief steam/spatter burst then dilution (lower DoT) |
| Acid eschar self-limits; alkali deeper | Acid DoT tapers (e.g., 6 ticks: 4,3,2,2,1,1); "caustic/lye" DoT is flatter and longer; neutralizing salt/lime clears both |

### Gaps
- No authoritative open mm/year table for mild steel in dilute HCl/H₂SO₄ retrieved (journal results paywalled). Corrosion rates in dilute strong acids are typically orders of magnitude above atmospheric (mm/day vs mm/decade) [U].
- Gold/aqua regia not reputably cited this session.

---

## "What to steal" — one line each
- Dorsey & Hanrahan 1996: coat/erode/polish as the 3 verbs on an equipment corrosion counter.
- Dorsey et al. 1999: change lives in a thin skin → 1 depth byte; deposit crust at the drying edge.
- Mérillou 2001: random-walk front, deepen-when-surrounded, hole at thickness; w∝t^0.5; pitting ×10; scratch/grease seed multipliers.
- Chen 2005 γ-tons: emit motes from the acid source, accumulate stains where they stop.
- Mérillou 2008 survey: reading list.
- Wang 2006: damage index → artist ramp (palette LUT).
- Gu 2006 STAF: per-pixel rate/offset noise + one global time curve.
- Dorsey 1996 flow (not Bosch): pick-up/deposit particles make runoff streaks.
- Bosch 2004 scratches: scratches = corrosion seed sites.
- Paquette 2001/2002: impacts seed damage; acid lowers paint adhesion → peeling flood-fill.
- Desbenoit 2004: DLA decides where, hand-drawn stamps decide look.
- Lu 2007: exposure mask multiplies rate (reuse SNOW mask).
- Bellini 2016: author end states, threshold-blend intermediate stages.
- Turk / Witkin-Kass / Pearson RD: bake etch textures; "spots that divide" as slime-splitting reference.
- Witten-Sander DLA / Eden: branching etch vs compact pit.
- Jones 2010 Physarum: sense-turn-move-deposit-diffuse-decay for slime trails.
- O'Brien-Hodgins / Mei pipes: height-field acid spread with outflow scaling + evaporation/consumption terms.
- Stam 1999: only for fumes, or replace with advect+blur+decay.
- Macklin-Müller PBF: skip.
- Blinn / Wyvill: metaball threshold shared by slimes and pools.
- Matyka-Ollila / Müller PBD / Jakobsen: Verlet ring + pressure for wobbling slimes, 1–2 iterations.
- Rain World: few physics chunks + procedural cosmetic parts = alive creatures.

---

## Sources
- https://doi.org/10.1145/237170.237278 ; https://graphics.stanford.edu/papers/patina/
- https://doi.org/10.1145/311535.311560 ; https://graphics.stanford.edu/~henrik/papers/sig99/
- https://graphicsinterface.org/?p=2843 ; https://graphicsinterface.org/wp-content/uploads/gi2001-20.pdf
- https://doi.org/10.1145/1073204.1073321
- https://doi.org/10.1016/j.cag.2008.01.003
- https://doi.org/10.1145/1141911.1141951
- https://doi.org/10.1145/1141911.1141952
- https://doi.org/10.1145/237170.237280 ; https://graphics.cs.yale.edu/publications/flow-and-changes-appearance
- https://doi.org/10.1111/j.1467-8659.2004.00767.x
- https://profs.etsmtl.ca/epaquette/Research/Papers/Paquette.2001/ ; https://graphicsinterface.org/proceedings/gi2002/gi2002-8
- https://doi.org/10.1111/j.1467-8659.2004.00765.x
- https://doi.org/10.1145/1189762.1189765
- https://doi.org/10.1145/2897824.2925891
- https://doi.org/10.1145/127719.122749 ; https://doi.org/10.1145/127719.122750
- https://doi.org/10.1126/science.261.5118.189 ; https://karlsims.com/rd.html
- https://doi.org/10.1103/PhysRevLett.47.1400
- https://doi.org/10.1162/artl.2010.16.2.16202 ; https://uwe-repository.worktribe.com/index.php/OutputFile/837928 ; https://hn.jakechampion.name/reader/https://cargocollective.com/sagejenson/physarum
- https://doi.org/10.1109/CA.1995.393532 ; https://doi.org/10.1109/PG.2007.15 ; https://lisyarus.github.io/blog/posts/simulating-water-over-terrain.html ; https://profs.etsmtl.ca/epaquette/Research/Papers/Dagenais.2018.cg/
- https://doi.org/10.1145/311535.311548 ; https://doi.org/10.1145/2461912.2461984
- https://doi.org/10.1145/965145.801290 ; https://doi.org/10.1007/BF01900346
- https://arxiv.org/abs/physics/0407003 ; https://panoramx.ift.uni.wroc.pl/~maq/talks/sigrad03/SoftBodyPresentation.pdf
- https://doi.org/10.1016/j.jvcir.2007.01.005 ; https://alecjacobson.com/seminar/mueller-et-al-2007.pdf
- https://gamedeveloper.com/programming/advanced-character-physics
- https://gamedeveloper.com/art/video-animating-i-rain-world-i-and-its-many-squishy-stretchy-creatures ; https://www.youtube.com/watch?v=sVntwsrjNe4 ; https://unity.com/blog/exploring-procedural-design-rain-world
- https://ipt.br/2021/09/29/corrosion-of-carbon-steel-pipes-and-tanks-by-concentrated-sulfuric-acid-a-review-2/ ; https://www.rolledalloys.ca/?p=3051
- https://edu.rsc.org/experiments/microscale-reactions-of-metals-with-acids/509.article
- https://www.britannica.com/science/sulfuric-acid
- https://www.forensicmed.co.uk/wounds/burns/chemical-and-electrical-burns/
- Blocked: ncbi.nlm.nih.gov (captcha), statpearls.com (robots), karlsims/cargocollective direct (allowlist; used mirrors/alternate host), sustainable-nano redirect.
