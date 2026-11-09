# 04 — Academic and rare publications on snow in computer graphics, and what each means for a cheap top-down pixel-art game

Researcher angle: the academic papers (2000–2022), what each one actually does, the numbers they report, and the cheapest pixel-art version of each idea for Godot 4 (web-first).
Method: about 33 tool calls. Primary PDFs were read where reachable (Ohlsson & Seipel 2004, Feldman & O'Brien 2002, Moeslund 2005, Saltvik 2006 thesis, Stomakhin 2013, Sumner 1998, Reiter 2005, Gravner & Griffeath 2008, Cordonnier 2018, Goswami 2022). Several older papers (Fearing 2000 paper, Foldes & Beneš 2007, Festenberg & Gumhold, Muraoka & Chiba, Haglund 2002, Tokoi 2006, Wang 2006) were **not** reachable as full text. For those I rely on the literature review in Daniel Reynolds' 2015 UEA PhD thesis, *Real-Time Rendering and Simulation of Trees and Snow* (marked **[via Reynolds 2015]**). Treat those as secondary summaries.

Legend: **Cited** = stated in the source. **Inference** = my own translation into pixel-art practice. These are untested design proposals, not findings.

---

## 0. One-paragraph takeaway

Almost every real-time snow paper since 2002 reduces to four cheap primitives, and all four map directly onto a 2D tile or pixel grid:
1. **An exposure mask "seen from the sky"**, a shadow map pointed straight up (Ohlsson & Seipel 2004, Reynolds 2014). In top-down 2D this is just "is there a roof, canopy or overhang over this pixel", sampled with a small wind offset.
2. **A persistent per-cell snow height buffer** that falling flakes increment when they land (Haglund 2002, Reynolds 2014). This is the "DOOM-fire-style" buffer for snow.
3. **A slope or angle-of-repose relaxation pass**, which is a sandpile cellular automaton (Fearing 2000, Feldman & O'Brien 2002, Sumner 1998, Cordonnier 2018). A Gaussian blur works as an even cheaper stand-in (Reynolds 2015).
4. **A temperature-index (degree-day) melt term with a sun-exposure multiplier** (Hock 2003 lineage, used by Cordonnier 2018; daily-averaged sun occlusion in Foldes & Beneš 2007).

Footprints and trails are Sumner, O'Brien & Hodgins 1998: lower the columns under the foot, push the displaced amount to the surrounding ring, then erode steep slopes. Everything above that level (MPM, DEM, Navier-Stokes wind) is overkill, but it is a useful source of *visual cues* to fake.

---

## Q1. Accumulation: exposed vs sheltered (sky occlusion)

### 1a. Fearing 2000, "Computer Modelling of Fallen Snow" (SIGGRAPH 2000) and PhD thesis (UBC 2000)
- **Cited:**
  - SIGGRAPH '00 Proceedings, pp. 37–46 (bibliography of Reynolds 2015, p. ~6455 in text dump). SIGGRAPH archive page: https://history.siggraph.org/?p=118252
  - PhD thesis, "The Computer Modelling of Fallen Snow", Paul Fearing, UBC 2000, supervisor Alain Fournier. 253 pages. The UBC Imager page says it is hardcopy-only: https://www.cs.ubc.ca/labs/imager/th/2000/Fearing2000/ . A UBC cIRcle handle exists: https://circle.ubc.ca/handle/2429/11075 . Its digitization status is unverified.
  - Core idea: **"flake launching" runs backwards.** Particles are shot *upward toward the sky* from each snow-supporting surface. Each surface controls its own sampling density, accuracy and compute time. Sites are processed in "importance ordering", and the result "can be interrupted at any point" and refines smoothly (UBC page). It handles flake flutter, flake dusting and wind-blown snow.
  - [via Reynolds 2015]:
    - Surfaces are split into **launch sites** that emit randomly offset upward vectors (flake flutter), optionally plus a wind vector.
    - The **sky plane is bucketed** so that a small patch of sky cannot over-deposit.
    - Adjacent sites with equal results merge, and differing sites subdivide.
    - **Stability:** a neighbour angle is compared with a predefined **angle of repose**, and snow is shifted to a lower site or "avalanched over a surface edge". The paper calls these "small, simultaneous avalanches" (SIGGRAPH archive page).
    - The result is triangulated with Delaunay, then given noise and bump maps for dusting.
    - Limitations: static scenes only, "stalagmite artefacts" from over-concentrated avalanched snow, and self-overlapping objects need up to one launch site per polygon.
  - Neither the abstract page nor the thesis page states a numeric angle of repose or render times.
- **Pixel-art translation (inference):**
  - For each ground pixel or tile, cast K (4–8) short rays "up". In top-down 2D, "up" means toward the camera, tilted by the wind vector, so the ray walks *upwind* across the tile map. Count the fraction that do not hit a cell whose `cover_height > ray_height`. That fraction is `exposure ∈ [0,1]`, stored as one byte per cell.
  - Jittering the rays is Fearing's flake flutter, and it gives soft edges for free.
  - Because the result is interruptible and progressive, you can recompute a few rows per frame when the wind changes. That is cheap even on web.
- **Limitations for us:** the paper's real value is the *idea* (exposure by launching upward, plus avalanche relaxation). The geometry pipeline is irrelevant.

### 1b. Haglund, Andersson, Hast 2002, "Snow Accumulation in Real-Time" (SIGRAD 2002)
- **Author correction:** the brief lists "Haglund, Andersson, Gustavsson, Seipel". Reynolds' bibliography lists **H. Haglund, M. Andersson, A. Hast**, *Proc. SIGRAD 2002*, pp. 11–15. The proceedings index is probably https://ep.liu.se/ecp/007/ecp02007.pdf . I did not open the full paper.
- **Cited** ([via Ohlsson & Seipel 2004](https://ep.liu.se/ecp/013/007/ecp01307.pdf) and [via Reynolds 2015]):
  - Each surface gets a **2D matrix or texture of snow heights**.
  - Snowflake particles fall, and **each impact increments the height at that texel**.
  - A maximum height is enforced at surface boundaries.
  - Light cover uses an alpha-blended snow texture. Thick cover becomes a randomly triangulated mesh (to hide repetition).
  - Drawback: the matrices are hand-authored, and the results are "very primitive".
- **Pixel-art translation (inference):** this is the most directly usable paper.
  - Keep `snow[x,y]` as a u8 buffer at world-pixel or half-tile resolution. When a rendered flake particle reaches its "landing time", do `snow[x,y] += k`.
  - Visible flakes and accumulation then stay causally linked: heavier visible snowfall means faster build-up.
  - Render with 3–4 thresholds into palette steps: dusting (dither), thin, full, and drift edge.
  - Cost is O(landed flakes per frame), which is tiny.

### 1c. Ohlsson & Seipel 2004, "Real-time Rendering of Accumulated Snow" (SIGRAD 2004)
- **Cited** (full PDF: https://ep.liu.se/ecp/013/007/ecp01307.pdf ; SIGRAD 2004 pp. 25–32 per Reynolds bib):
  - Snow prediction: `fp(p) = fe(p) · finc(p)`.
    - `fe` is **exposure**. It comes from a **depth map rendered from the sky with parallel projection**, adapted from Hsu & Wong's 1995 dust-accumulation exposure function, which instead casts hemisphere rays.
    - `finc` is the **inclination** term: `cos θ + n` for θ in 0–90°, where n is small noise (~0–0.4) for "flake dusting" on steep faces. It is 0 for faces pointing away from the sky.
  - Edges are softened by **several offset samples plus noise** (Reynolds: several projections at slightly different angles, averaged, plus 3D Perlin noise).
  - Colour is `C = fp·Cs + (1−fp)·Cn`. The snow is shaded slightly blue-white with Phong, and normals are perturbed by noise (α = 0.4 diffuse, 0.8 specular) for glitter.
  - Performance: GeForce FX 5600 Ultra with Cg. Two Stanford bunnies (~16k triangles each) ran at **~13 fps at 600×600 and ~11 fps at 900×900**.
  - Known flaws [via Reynolds]:
    - Snow is recomputed every frame, so snow on a moved object is *lost*.
    - Thin twigs get unnatural amounts of snow because the method is per-pixel and ignores surface size.
    - The offset shell "floats" at open edges.
- **Pixel-art translation (inference):**
  - Top-down equivalent: render a **"cover" layer** (roof tiles, tree canopies, awnings, bridge decks) into a low-res mask, for example 1 px per 4×4 world pixels. Ground exposure is `1 − cover(p + wind_offset·h)`, sampled at 3–4 jittered offsets and averaged. That reproduces the soft lee-side gradient.
  - Multiply by a per-tile "inclination" tag: flat ground = 1, stairs or slopes = 0.6, walls or cliffs = 0 plus a small dusting noise.
  - This is a single cheap shader pass, or a CPU pass at tile resolution.
  - Note: do **not** recompute snow from scratch each frame. Use it as the *rate* of accumulation into a persistent buffer (see Reynolds below).

### 1d. Reynolds, Laycock, Day 2014/2015, "Real-time accumulation of occlusion-based snow" (The Visual Computer 31: 689–700) and PhD thesis 2015
- **Cited:**
  - DOI 10.1007/s00371-014-0995-5 (https://research-portal.uea.ac.uk/en/publications/real-time-accumulation-of-occlusion-based-snow/ ). Thesis: https://ueaeprints.uea.ac.uk/id/eprint/53359/
  - Main contribution: **persistent accumulation maps per object** plus an **occlusion map from above**. Each frame's snowfall is *added* to the persistent cover, so snow survives objects moving. Surface orientation is included, so snow is shed when a surface rotates past vertical.
  - Stability: the thesis argues that the angle of repose is "incredibly variable", since real snow can exceed 90° with overhangs (citing Doumani 1967). It therefore **uses a Gaussian blur on the accumulation height map** instead of repose tests, which gives domed deposits that blend into the surface.
  - Performance (Table 4.2): **103–112 fps** across scenes of 16k–347k tessellated polygons. Reducing accumulation-map resolution matters more for fps than reducing occlusion-map resolution (Fig. 4.13, maps tested at 256², 512² and 1024²).
- **Pixel-art translation (inference):**
  - The game architecture is: `exposure mask (rate) → persistent u8 snow buffer (state) → small blur or relax (stability) → palette threshold (look)`.
  - The Gaussian-blur stability shortcut is valuable. A 3-tap box blur every N frames on the snow buffer gives rounded, pillowy edges at almost zero cost.

### 1e. Foldes & Beneš 2007, "Occlusion-Based Snow Accumulation Simulation" (VRIPHYS 2007)
- **Cited:**
  - Eurographics VRIPHYS 2007, DOI 10.2312/PE/vriphys/vriphys07/035-041 (https://www.cs.purdue.edu/cgvlab/www/publications/Foldes07Vriphys ; https://diglib.eg.org/items/3f6399a3-eb01-417c-a068-0eed4bdd3c4b )
  - [via Reynolds 2015]:
    - **Ambient occlusion** decides where snow can accumulate: too occluded means no snow.
    - **Direct occlusion from the sun, averaged over a full day's trajectory**, decides where snow **melts**.
    - AO is the expensive part and is precomputed. Low-detail scenes take "a few seconds", high-detail scenes several minutes. Static scenes only.
- **Pixel-art translation (inference):** this is the key idea for "sun vs shade melting".
  - Precompute a per-tile **`sun_hours` map**. Cast each building or tree shadow along the sun direction at, say, 5 sun positions across the day (top-down: shadows fall toward the "north" side and lengthen at morning and evening), then sum.
  - Sheltered tiles near walls get low AO, so less snowfall. North-side tiles get low sun_hours, so slower melt.
  - The result is the classic look of snow lingering in building shadows. It costs one byte per tile, computed once per map or season.

### 1f. Festenberg & Gumhold 2009, "A Geometric Algorithm for Snow Distribution in Virtual Scenes" (EG Workshop on Natural Phenomena 2009) and 2011, "Diffusion-Based Snow Cover Generation" (CGF 30(6): 1837–1849)
- **Cited:**
  - 2009: EG NPH, pp. 17–25, DOI 10.2312/EG/DL/conf/EG2009/nph/017-025 (https://diglib.eg.org/items/c12884c9-b7fd-4679-b743-02ad5c7b87bf ). It uses a statistical deposition model from real observations, turned into geometry via an **enhanced height span map** with two parameter fields.
  - 2011: CGF 30(6), https://diglib.eg.org/items/0e424c9c-7dbe-4040-87df-6b53b53104c2
  - [via Reynolds 2015]:
    - 2009 uses depth peeling to get vertical occlusion. Patches are flood-filled, and **inner and outer edge distances** are computed per point. Snow is assigned top-down in one pass, and excess spills to lower patches. A whole scene takes **~1.5 s**.
    - 2011 runs a **diffusion kernel** per snow site, with "strong adhesion", checking visibility upward and support downward. It **bridges gaps shorter than a maximum bridge length**, adds **overhangs** by offsetting boundary vertices, and uses **alpha-masked edge textures captured from real snow boundaries**. Cost is **~1 min per frame**, 95% of it in the kernel.
- **Pixel-art translation (inference):**
  - The key visual lessons are (a) **snow thickness rises with distance from the edge of a supporting surface**, giving rounded caps on roofs, fence rails and walls, and (b) **snow bridges small gaps and overhangs edges** (cornices).
  - Cheap version: run a distance transform (or 2–3 erosion steps) on the "roof or object top" mask. Snow tiles on object tops use `thickness = min(maxDepth, k·edgeDist)`. Paint a 1-px overhang lip on the side facing the camera (south edge in top-down 3/4 view).
  - Bridging: fill 1-cell gaps between two snowy cells (morphological closing) on fences and hedges.
  - The "alpha-masked edge texture from real snow" maps to **hand-drawn snow-edge autotiles**. That is the artist-validated route, and it is exactly what tile-based games do.

---

## Q2. Wind-driven drifts (lee side, scour)

### 2a. Feldman & O'Brien 2002, "Modeling the Accumulation of Wind-Driven Snow" (SIGGRAPH 2002 Conference Abstracts and Applications, p. 218)
- **Cited** (PDF: https://escholarship.org/content/qt5v34k082/qt5v34k082.pdf ; https://history.siggraph.org/?p=144097 ):
  - Uniform 3D Eulerian grid. Cells inside obstacles are impermeable. **Cells above upward-facing surfaces are "landing sites"**.
  - Wind comes from inviscid incompressible Navier-Stokes (semi-Lagrangian, after Fedkiw), solved to convergence. It is **held constant while snow builds up and recomputed periodically** as drifts change the shape.
  - Snow enters at the boundary in proportion to snowfall density times the inward wind component. It is advected by wind plus a gravity term and lands at landing sites. **Strong wind can lift snow back off.**
  - Avalanching: when a site exceeds the critical slope against a neighbour, the excess (plus a small convergence term) moves to that neighbour, or back into the air. This repeats until stable.
  - Output is a height field rendered as a Catmull-Clark subdivision surface. With 3 m obstacles it produces windward drifts, furrows beside obstacles, and leeward gullies and drifts.
  - **"Approximately three hours"** in MATLAB on a laptop. Grid size and slope threshold are not stated.
- **Pixel-art translation (inference):**
  - A full 2D Stam stable-fluids solve on a coarse grid (e.g. 64×64 for a screen) is feasible but probably unnecessary.
  - Cheaper "**1D sweep drift**": iterate cells *along the wind direction*, carrying an `airborne` amount.
    - Open ground: pick up `min(airborne_cap, erosion·snow)` if wind is strong, else drop a fraction.
    - Cell just downwind of an obstacle: drop most of the carried load. This is the lee drift.
    - Cell just upwind of an obstacle: drop a little, forming a small windward bank.
    - Corners and sides beside obstacles: increase pickup to form scour furrows.
  - This is O(cells) per sweep and could run once per second, or once per in-game hour.
- **Limitations:** it is static-wind. Drifts look plausible only when the wind direction is stable over time, which is a gameplay feature rather than a bug.

### 2b. Wang et al. 2006 (Boltzmann wind model) [via Reynolds 2015 only]
- **Cited** [via Reynolds 2015, ref WWXP06]:
  - A lattice Boltzmann wind model on a regular grid. Snow is injected across the top and left boundaries by a probability function, and flake-to-flake collisions are ignored.
  - Each snow-supporting surface has an accumulation texture whose alpha counts flakes. Height increases once enough flakes settle.
  - Erosion rate depends on wind speed, concentration, saturation and transport efficiency.
  - **26 fps at 600×400** "on very low powered" hardware.
  - The original paper was not verified (see Gaps).
- **Inference:** this is further evidence that the "count landed flakes in an alpha texture, promote to height after N" pattern is real-time-friendly.

---

## Q3. Falling snow (motion, layers, flake physics)

### 3a. Moeslund, Madsen, Aagaard, Lerche 2005, "Modeling Falling and Accumulating Snow" (Vision, Video and Graphics 2005, Eurographics)
- **Cited** (PDF: https://diglib7.eg.org/bitstream/handle/10.2312/vvg20051008/061-068.pdf ):
  - Flake geometry: concentric spherical layers of random triangles (40 polygons per layer for wet, 10 for dry). Diameter comes from temperature with ±50% randomness. **Mean diameter is 0.04 m above −0.061 °C, else 0.015·|T|^−0.35 m.** The largest wet flake is ~6 cm.
  - Motion: gravity plus drag relative to the wind, buoyancy ignored. **Lift gives helical paths and self-rotation.**
  - **Max vertical speed: 0.5–1.5 m/s for dry, 1–2 m/s for wet.**
  - Wind: incompressible Euler on voxels with semi-Lagrangian advection, RK2 back-trace and pressure projection by conjugate gradients.
  - Accumulation: invisible particles of 10⁻⁴ m³ hit the mesh. The mesh is refined where counts are high, and slope stability uses a **temperature-dependent angle of repose** (fitted equation).
  - Performance: **~100,000 flake updates/s** and **~27,000 wind voxels/s** on an unoptimized 1.8 GHz PC with 256 MB. Accumulation takes "minutes". Rendered in POV-Ray.
- **Pixel-art translation (inference):**
  - Temperature as one knob controls wet vs dry snow: wet means bigger, faster, clumpier flakes (2–3 px sprites, straighter fall), and dry means small (1 px), slower, more drift.
  - The helical path is a cheap `x += R·cos(ωt+φ)` per flake.

### 3b. Saltvik, Elster, Nagel 2006, "Parallel Methods for Real-Time Visualization of Snow" (PARA'06 workshop; based on Saltvik's NTNU MSc thesis, June 2006)
- **Cited:**
  - Workshop paper: https://www.hpc2n.umu.se/sites/default/files/events/para06/papers/paper_208.pdf . Thesis: https://folk.idi.ntnu.no/elster/master-studs/saltvik/saltvik-master.pdf
  - Flakes follow a **simple spiral or helix path**. A falling-paper-strip model was rejected as too costly.
  - Wind uses Stam stable fluids. Accumulation is per-triangle height increments, with vertex heights averaged. Avalanching and refinement were left out.
  - Flakes are split data-parallel across CPUs, with render and simulation threads separate.
  - Thesis numbers:
    - Target ≥25 fps.
    - **Speedup 1.9×** on dual-CPU workstations (2.0× with Hyper-Threading).
    - Scenes use **5k / 20k / 30k / 40k flakes**, with **wind grids 20×20×5, 40×40×10, 48×48×12, 54×54×9** (tests up to 80×80×20).
    - Snow-cover height spacing is 0.25–0.5 m, giving 5,352–21,760 triangles.
    - Hardware: Pentium 4 or dual Xeon 3.4 GHz, with FX 5500 or Quadro FX 3400 GPUs.
  - Flake parameters:
    - Spiral radius **R ~ U(0,2)**, angular speed **ω ~ ±U[π/4, π/3]**.
    - Density = C/D with C_dry = 0.170 and C_wet = 0.724. Dry snow at ≤ −1.0 °C.
    - **Terminal velocity: 0.5–1.5 for wet and 1–2 for dry.** This is the *opposite* of Moeslund's statement (see Gaps).
- **Pixel-art translation (inference):**
  - Use the spiral parameters directly for flake sway (scaled to pixels).
  - Real-time feasibility at 20–40k flakes on 2006 CPUs means a few thousand pixel flakes in GDScript or a GPUParticles2D is trivially fine.
  - A wind grid of ~20×20 is enough for visible gusts.

### 3c. Langer, Zhang, Klein 2004, "A spectral-particle hybrid method for rendering falling snow" (Eurographics Symposium on Rendering 2004, pp. 217–226) [via Reynolds 2015]
- **Cited** [via Reynolds 2015]:
  - A few particles plus **image-based spectral synthesis** of a time-varying opacity texture over several **motion planes**. Nearer planes move faster in image space and have bigger flakes.
  - The particles give distinct flakes, and the texture gives the "dense, heavy snow" feel.
  - Adding the texture layer made "no discernible difference" to render time, while adding particles slowed it.
  - 4–5 fps at 512×512 (2004).
- **Pixel-art translation (inference):** this is the academic justification for the classic game trick of **2–3 scrolling, tiling snow-noise layers at different speeds and scales (parallax), plus a modest number of hero particles**. In top-down view the "near" layer moves faster and has bigger 2×2 flakes, and the far layer has 1-px flakes. Layers are almost free.

### 3d. Muraoka & Chiba 2000, "Visual simulation of snowfall, snow cover and snowmelt" (Proc. 7th ICPADS Workshops, IEEE, pp. 187–194)
- **Cited:**
  - IEEE Xplore 884537 (https://ieeexplore.ieee.org/document/884537 ; page content not retrievable). Bibliography per Reynolds 2015.
  - Grant report (KAKEN 09680406, 1997–1999; https://kaken.nii.ac.jp/en/report/KAKENHI-PROJECT-09680406/096804061999kenkyu_seika_hokoku_gaiyo ):
    - Air currents are modelled as a **vortex field** interacting with obstacles.
    - Snow cover becomes snowdrift-like through air currents.
    - **Snowmelt** comes from solar and radiant heat plus conduction inside the snow, **including refreezing of meltwater (icicles)**.
    - **Footprints and ruts are based on the kinetic energy of feet or tires and on snow density.**
  - [via Reynolds 2015]:
    - Wind is laminar plus turbulent vortex flows. Flakes stick by an adhesion test.
    - The scene is voxelised. Each voxel does **heat exchange with its 6 neighbours** plus ambient and direct sun, recomputed as the sun moves. State changes are snow→air, with water lost.
    - Static scenes only, and the cover "visually unrealistic".
- **Pixel-art translation (inference):** this is the only classic paper that covers the full *time* loop (fall → cover → melt → refreeze).
  - A per-cell `temp` byte with 4-neighbour diffusion, a sun term from the `sun_hours` map, and a day/night cycle.
  - `temp > 0` melts snow into a `wet` or slush flag. Wet cells at night with `temp < 0` become `ice` tiles. Icicles go on roof edges where wet roof snow meets freezing night.
  - Footprint depth `∝ speed·mass / density` gives fresh powder deep prints and packed or old snow shallow ones.

---

## Q4. Interaction: footprints, trails, plowing

### 4a. Sumner, O'Brien, Hodgins 1998, "Animating Sand, Mud, and Snow" (Graphics Interface '98, pp. 125–132; extended in CGF 18(1) 1999)
- **Cited** (PDF: https://escholarship.org/content/qt3nk515kp/qt3nk515kp.pdf ; https://diglib.eg.org/items/a18f4810-e22f-4f61-971f-e33e29d70ee0 ):
  - The ground is a **height field of columns**. For each column, a ray from its base finds the rigid object, and the column top is lowered to the contact point. A contour map gives the distance to the nearest non-contact column.
  - **Displacement:** a compression ratio α of the displaced volume is "compressed away". The rest is **distributed equally to the nearest ring of non-contact columns**, which forms the raised rim of a footprint.
  - **Erosion:** for slope `s = atan((h_ij − h_kl)/d)`, if s > θ_out, material moves downhill, scaled by roughness σ. This repeats until all slopes are < θ_stop. A separate θ_in applies under the object.
  - Per-material table (radians), as extracted. The **snow column was not double-checked against the PDF table, so verify before quoting**:

    | | sand | mud | snow |
    |---|---|---|---|
    | θ_stop | 0.8 | 1.1 | 1.57 |
    | σ | 0.2 | 0.2 | 0.2 |
    | θ_in | 0.8 | 1.57 | 1.57 |
    | θ_out | 0.436 | 1.1 | 1.57 |
    | α | 0.3 | 0.41 | 0.0 |

  - The authors call it "appearance-based rather than engineering-based".
  - Grid at 1 cm/cell, with virtual grids of 2048×1024 or 4096×512. Only ~37k of >2M columns were active. A 3 s runner clip took **<2 min on one MIPS R10000** (1998).
  - Particles for thrown material were used for sand only.
- **Pixel-art translation (inference):** this is the canonical footprint algorithm, and it is tiny in 2D. On each foot-down event:
  1. Stamp the foot shape (a 2×3 px mask) by setting `snow[x,y] = max(0, snow − depth)`.
  2. Add `(1−α)·removed` spread over the 1-px ring around the stamp. That gives the raised lip, which is drawn one palette step brighter (lit) on the top edge and darker on the bottom edge.
  3. Optionally run 1–2 relaxation iterations, `if h_i − h_j > T then move (h_i − h_j − T)/4`.
  - A high angle threshold for snow (≈π/2 in the table) means footprints keep crisp vertical walls. That matches real snow and pixel art. Sand would slump (θ_out 0.436 rad ≈ 25°).
  - "**Filling back in**" is just new snowfall accumulating into the buffer, plus the blur pass rounding the walls over time.
  - Sleds and carts: stamp a continuous line, and for a plow push the removed volume sideways (to the ring on one side) to make berms.

### 4b. Onoue & Nishita 2003, "Virtual Sandbox" (Pacific Graphics 2003); extended as "An Interactive Deformation System for Granular Material" (CGF 24(1) 2005, pp. 51–60)
- **Cited** (https://www.sciweavers.org/node/142193 ; https://diglib.eg.org/handle/10.2312/CGF.v24i1pp051-060 ):
  - A three-step loop: collision detection → displacement of granular material → erosion of steep slopes. It handles concave polyhedra.
  - It adds "**texture sliding**" to show material moving, and runs at "interactive frame rate".
  - The fps figure was not retrieved.
- **Inference:** texture sliding means scrolling the snow texture with the displaced material. In pixel art this is cheap: shift the sparkle or dither pattern of pushed snow cells in the push direction for a few frames, so plowed snow *looks* like it moved rather than just changing height.

### 4c. Junker & Palamas 2020, "Real-time Interactive Snow Simulation using Compute Shaders in Digital Environments" (FDG '20, ACM)
- **Cited** (DOI 10.1145/3402942.3402995; https://vbn.aau.dk/da/publications/real-time-interactive-snow-simulation-using-compute-shaders-in-di ):
  - A compute shader deforms the snow mesh under agents. It includes **accumulation over time and wind direction**.
  - Reinforcement-learning agents walking produce "human-like trail patterns" over large areas.
  - **>30 fps with up to 100 agents.** Grid size and ms were not on the abstract page.
- **Inference:** evidence that an MMO-scale crowd (100 walkers) trampling a shared snow buffer is cheap on GPU. Emergent **paths form where many players walk**, which is a strong "world feels alive" feature for an MMORPG like Asterion. In 2D this could even run on the CPU at tile resolution: `snow -= k` per step, plus a regrowth rate.

### 4d. Stomakhin, Schroeder, Chai, Teran, Selle 2013, "A Material Point Method for Snow Simulation" (SIGGRAPH 2013, ACM TOG 32(4), art. 102), from Disney's *Frozen*
- **Cited** (https://www.math.ucdavis.edu/~jteran/papers/SSCTS13.pdf ; https://disneyanimation.com/publications/a-material-point-method-for-snow-simulation ):
  - Hybrid particles plus Eulerian grid (MPM). It uses an elasto-plastic constitutive model:
    - critical compression θc and stretch θs: larger values give chunkier snow, smaller give powdery;
    - hardening ξ: higher is more brittle.
  - Δt ≈ 0.5×10⁻³, on an 8-core Xeon X5550 at 2.67 GHz. Selected results:

    | Example | Particles | Grid | Min/frame |
    |---|---|---|---|
    | Snowplow | 3.9M | 150×50×300 | **2.1** |
    | Walking character | 3.0M | 370×120×300 | **15.7** |
    | Character digging | 3.1M | 280×110×340 | **25.8** |
    | Rolling snowball | 7.2M | 200×240×470 | **35.7** |

  - Visual cues highlighted: **packing and sticking** (a snowball grows when rolled), **fracture into chunks** on impact, a **snowplow tumble and a "tube" of spray**, and **irregular footprint and dig traces**.
- **Why it is overkill:** minutes per frame for millions of particles, versus our budget of under 1 ms per frame on web.
- **What it teaches (inference), and how to fake each cue in pixel art:**
  - *Clumping and fracture:* when snow is kicked or a snowball hits, spawn 3–6 **chunk particles** (2–3 px, the same palette as ground snow) that arc and *stop* on landing. When they land, add to `snow[]` (Haglund-style deposit). Chunks should not fade like dust.
  - *Powder vs packed:* one material scalar per cell, `packed`. Packed cells (trails) produce chunks when kicked, and fresh powder produces a short white puff (1-px particles with drag).
  - *Plow tube:* a sled or plow throws a continuous arc of particles to one side, forming a berm.
  - *Irregular print edges:* jitter the stamp mask by ±1 px and randomly drop lip pixels.

### 4e. Goswami, Nordin, Nylén 2022, "Iterative discrete element solver for efficient snow simulation" (EGPGV 2022)
- **Cited** (https://diglib.eg.org/bitstream/handle/10.2312/pgv20221062/019-029.pdf ):
  - GPU DEM with dry snow, wet snow and ice parameter sets. Radius varies ~2× with compression.
  - **20 fps with 1M wet-snow particles plus 323k boundary particles** at a 1 ms step on an RTX 2060 (sim plus render). Interactive at ~500k particles. 7.8–8.7× faster than its base method.
- **Inference:** still far beyond a web 2D budget. It is useful only to show that "snow = sticky granular material with compression", which supports the `packed` scalar idea above.

---

## Q5. Time: build-up, melt (sun vs shade), slush, refreeze

### 5a. Hock 2003, "Temperature index melt modelling in mountain areas" (Journal of Hydrology 282(1–4): 104–115)
- **Cited:**
  - DOI 10.1016/S0022-1694(03)00257-9 (https://scilit.net/publications/a5c4d5702bc0779701d57972a27cd853 ).
  - The model form (as given in the IAHS/ICSIH snow-modelling overview: https://iahs.info/uploads/Commissions/ICSIH/ICSIH%20snow%20modeling%20article%20FINAL.pdf ): **`W = fm·(Td − T0)` if Td > T0, else 0**. Here W is daily melt (mm w.e.), fm is the melt factor (mm day⁻¹ K⁻¹), Td is mean daily air temperature, and T0 is a threshold.
  - That overview says such models need "as few as 1 or 2 parameters" (citing Hock 2003), and that performance "can hence be potentially improved" by adding radiation terms.
  - **Degree-day factor values were NOT retrieved** (see Gaps).
- **Pixel-art translation (inference):**
  - `melt_per_tick = DDF · max(0, T_air + sunBoost·sun_now·sun_exposure[cell] − T0)`. This is the "enhanced temperature index" idea of adding radiation.
  - `sun_exposure` comes from the Foldes & Beneš-style daily shadow map.
  - The visual result: **thin cells and cells at snow edges vanish first** (lower height reaches 0 first), and **shaded north-side strips linger**. Both are exactly the "edges first, sun vs shade" target behaviour, emerging from a one-line rule.
  - Add `wet[cell] += melt` to darken the ground palette (slush). At night `T < 0` turns `wet` into an `ice` overlay, and morning sun reverses it.

### 5b. Cordonnier, Ecormier, Galin, Gain, Beneš, Cani 2018, "Interactive Generation of Time-evolving, Snow-Covered Landscapes with Avalanches" (Eurographics 2018, CGF 37(2))
- **Cited** (PDF: https://www.cs.purdue.edu/homes/bbenes/papers/Cordonnier18EG.pdf ; https://hal.archives-ouvertes.fr/hal-01736971 ; https://diglib.eg.org/items/04f5e824-ab55-46a4-8866-2994bbc2f808 ):
  - **Layered height field**: bedrock plus four snow layers (compacted or ice, stable, unstable, powder).
  - **Snowfall:** storms about once a week, lasting ~3 days. Depth is proportional to elevation above the rain-snow line. New snow is partly powder, depending on slope and temperature.
  - **Wind:** erodes convex areas and deposits downwind, forming **cornices in wind shadows**.
  - **Temperature:** `T = T0 + kt·A + ki·I`, with a lapse rate of −0.01 °C/m and a sun term combining direct, sky and one-bounce light.
  - **Melt** is linear above 0 °C, **kmelt = 0.01 m/day/°C** (degree-day style).
  - **Stability:** 5 °C destabilises, ~−5 °C cements, ~−20 °C self-stabilises. Unstable snow forms on slope > 0.3 (gradient).
  - **Avalanches:** a pipe-model flow with a **30° rest angle**.
  - Grid **1024×1024** at 10 m/cell (or 2 m). Precompute: temperature 7.8 s, wind 10.5 s. **~30 Hz simulation plus visualization**, and ~100 days in ~60 s, on a laptop Quadro K2100M (CUDA plus GLSL).
- **Pixel-art translation (inference):** this is the closest academic match to the "time" pillar, and it is real-time on a 2014 laptop GPU at 1M cells. A tile map is 100–1000× smaller.
  - Steal the **layering**: `powder` (fresh, deep prints, puffs), `packed` (trails), and `ice` (refrozen slush).
  - Steal the **weekly storm cadence** and the **kmelt ≈ 1 cm/day/°C** as a starting point to tune.
  - Steal the **30° rest angle** as the relaxation threshold. In pixel units with 1 height unit = 1 px, that is a max step of ~0.58 per cell, so use 1 unit per cell with integer heights.

### 5c. Maréchal, Guérin, Galin et al. 2010, "Heat Transfer Simulation for Modeling Realistic Winter Sceneries" (CGF 29(2): 449–458) [via Reynolds 2015]
- **Cited** [via Reynolds 2015]:
  - Voxel thermal model with conduction, convection and radiation, dew point, day/night and cloud cover. Phase changes are modelled, and **melting snow wets the soil below**, changing its thermal properties.
  - **Solar energy and radiative transfer with air have the most noticeable effect.**
  - Offline, static scenes.
- **Inference:** this confirms that for the look, sun exposure dominates. One sun-exposure byte per cell captures most of the visible melt pattern. Not verified first-hand.

---

## Q6. Pretty flakes: crystal-growth cellular automata

### 6a. Reiter 2005, "A local cellular model for snow crystal growth" (Chaos, Solitons & Fractals 23(4): 1111–1119)
- **Cited** (https://webbox.lafayette.edu/~reiterc/abstracts/mv_2005a.html ; preprint https://webbox.lafayette.edu/~reiterc/mvp/sfn/sfn_pp.pdf ):
  - A hex grid with one real value per cell, where ≥1 means ice.
  - A cell is **receptive** if it is ice or touches ice. Receptive cells get `+γ` and keep their mass. Non-receptive cells diffuse by a local average (centre 1/2, each of the 6 neighbours 1/12, at α = 1).
  - Parameters:
    - α (diffusion; standard 1, unstable at 2.69);
    - β (background vapour, 0–0.95);
    - γ (added vapour, 0–1).
  - The abstract describes "just two parameters", meaning β and γ, with α as an extra.
  - Regimes: low β and low γ give dendrites (e.g. β = 0.4, γ = 0.0001). High γ gives plates or sectors. High β gives stellar or abstract forms.
  - ~**400×400 hex grid, up to 10,000 iterations**.
  - There is a public Python implementation (ActiveState recipe 578390): https://code.activestate.com:443/recipes/578390-snowflake-simulation-using-reiter-cellular-automat
- **Pixel-art translation (inference):** this is the snow equivalent of the DOOM-fire CA (local, a few lines, palette-mappable).
  - At **32×32 to 64×64** and a few hundred iterations it could grow a unique flake live, for example as frost creeping across a window, a UI frame, or a "frozen" status icon.
  - It can also bake 8–16 big hero flakes offline into a sprite atlas for close-up flakes.
  - The 6-fold symmetry means only 1/12 of the grid needs computing.
  - Note: a top-down game's ground-level flakes are 1–2 px, so crystal shape only matters for UI, close-ups or cinematic moments.

### 6b. Gravner & Griffeath 2008, "Modeling snow crystal growth II: A mesoscopic lattice map with plausible dynamics" (Physica D 237: 385–404)
- **Cited** (PDF: https://mk.bcgsc.ca/snowflakes/paper/modeling-snow-crystal-growth-2.pdf ; implementation https://github.com/BartMassey/snowfake , MIT, "incredibly slow"):
  - Triangular lattice. Per-cell state is attachment flag a, boundary mass b, crystal mass c, and vapour d.
  - Each step: diffusion (1/7 average) → freezing (κ) → attachment rules by attached-neighbour count (β, α, θ thresholds) → melting (μ, γ) → optional noise σ.
  - **8 parameters.** Simple star: ρ ≈ 0.65, β ≈ 1.75, κ ≈ 0.15, μ ≈ 0.015. Stellar plate: ρ ≈ 0.36, β ≈ 1.09, κ ≈ 0.0001, μ ≈ 0.14.
  - **Diameters of 400–600 cells over 10k–100k updates.**
- **Inference:** much prettier and more physical than Reiter, but it needs 10–100k updates, so it is **bake-offline only**. Use it to generate a reference or sprite library, not at runtime.

---

## Q7. Other real-time accumulation data points (secondary)
- **Tokoi 2006** [via Reynolds 2015]: top-down shadow-map coverage groups (non-overlapping from above), multiple offset projections for flutter, and max-amount spill plus angle-of-repose shift to the lowest neighbour (with spill off edges going to the highest surface below). **3.38 fps at 300×300.** Original not verified.
- **Inference across Q1–Q7:** the real-time papers before 2010 (Ohlsson & Seipel 11–13 fps, Tokoi 3.38 fps, Wang 26 fps) were slow because they did per-pixel 3D work on 2004-era GPUs. The *same logic* at tile resolution in 2D (e.g. a 256×256 snow buffer = 65k bytes) is a sub-millisecond CPU job, even in GDScript if updated in stripes. The more natural fit is a Godot shader on an `Image`/`ImageTexture`, or a compute or viewport ping-pong.

---

## Summary table: paper → cheapest pixel-art approximation (all approximations are inferences)

| Paper (year, venue) | Core idea | Reported cost | Cheapest pixel-art version | Main limitation |
|---|---|---|---|---|
| Fearing 2000 (SIGGRAPH; UBC PhD) | Launch flakes upward from surfaces for exposure; local avalanches by angle of repose | Offline; no numbers found | K jittered upwind rays per cell over a cover-height map → exposure byte; progressive rows per frame | Static; stalagmite artefacts |
| Haglund et al. 2002 (SIGRAD) | Particle hits increment a per-surface height texture | Real-time (no number found) | Landed flake → `snow[x,y]++` | Hand-made maps, primitive look |
| Ohlsson & Seipel 2004 (SIGRAD) | Sky depth map (exposure) × inclination + noise | 13 fps 600², 11 fps 900² (FX 5600) | Cover mask sampled at wind-offset jitter × tile tag | Recomputed per frame (loses snow) |
| Reynolds et al. 2014 (Vis. Comput.) | Persistent accumulation maps + occlusion; blur for stability | 103–112 fps | Persistent u8 buffer + periodic 3-tap blur | Per-object maps (3D) |
| Foldes & Beneš 2007 (VRIPHYS) | AO → accumulation; daily-averaged sun occlusion → melt | Seconds to minutes (precompute) | Precomputed `sun_hours` per tile | Static |
| Festenberg & Gumhold 2009/2011 (EG NPH; CGF) | Height span map; edge-distance thickness; bridging, overhangs, real edge textures | 1.5 s (2009); ~1 min/frame (2011) | Distance-transform caps on roofs and rails, 1-px lip, gap closing, hand-drawn edge autotiles | Offline |
| Feldman & O'Brien 2002 (SIGGRAPH sketch) | Voxel NS wind, advected snow, landing sites, avalanching | ~3 h MATLAB | 1D sweep along wind: pick up / drop behind obstacles | Static wind |
| Muraoka & Chiba 2000 (ICPADS-W) | Vortex wind, voxel heat melt (6-neighbour), refreeze icicles, footprints by kinetic energy | Not found | Per-cell temp diffusion + sun; wet→ice at night; print depth ∝ speed/density | Static, unrealistic cover |
| Moeslund et al. 2005 (VVG) | Temperature-driven flake size, density, speed; helical lift; temperature-dependent repose | 100k flake updates/s; 27k voxels/s | Temperature knob → flake sprite size, speed, sway | Accumulation takes minutes |
| Saltvik et al. 2006 (PARA'06) | Spiral flakes, Stam wind, parallel CPU | 5k–40k flakes; 20×20×5–54×54×9 wind; 1.9× speedup | `x += R cos(ωt+φ)`, R∈(0,2), ω∈±[π/4,π/3] | No avalanche |
| Langer et al. 2004 (EGSR) | Few particles + spectral texture layers on motion planes | 4–5 fps 512² (2004) | 2–3 parallax noise layers + hero particles | Fixed depth |
| Sumner et al. 1998 (GI) | Height-column footprints: lower, displace to ring, erode by slope | <2 min for 3 s (R10000), 1 cm cells | Stamp foot, push volume to 1-px rim, 1–2 relax passes | Appearance-only |
| Onoue & Nishita 2003 (PG) | Collision → displacement → erosion + texture sliding | "Interactive" | Scroll the sparkle or dither of pushed cells | Fps number not found |
| Junker & Palamas 2020 (FDG) | Compute-shader trails + accumulation + wind | >30 fps, 100 agents | Shared trample buffer → emergent paths | Grid size not found |
| Stomakhin et al. 2013 (SIGGRAPH/TOG) | MPM elasto-plastic snow | 2.1–35.7 min/frame, 0.3–7.2M particles | Chunk particles, packed vs powder flag, plow spray arc | Offline only |
| Goswami et al. 2022 (EGPGV) | GPU DEM, wet, dry and ice | 20 fps at 1M particles (RTX 2060) | Supports `packed` scalar idea only | GPU-heavy |
| Cordonnier et al. 2018 (EG/CGF) | Layered height field; storms, wind cornices, sun temperature, degree-day melt, 30° avalanches | 30 Hz at 1024², 100 days in 60 s (K2100M) | Layers: powder, packed, ice; kmelt ≈ 1 cm/day/°C; 30° relax | Terrain-scale |
| Hock 2003 (J. Hydrol.) | Melt = DDF·(T − T0); add radiation for accuracy | 1–2 parameters | `melt = DDF·max(0, T + sunBoost·exposure)` | DDF values not retrieved |
| Reiter 2005 (CS&F) | Hex CA with β, γ (α) for crystal shapes | 400² hex, ≤10k iterations | Live 32–64² frost or hero-flake growth; 1/12 symmetry | Shape invisible at 1–2 px |
| Gravner & Griffeath 2008 (Physica D) | 8-parameter mesoscopic lattice | 400–600 cell diameters, 10k–100k updates | Bake sprite atlas offline | Too slow for runtime |

---

## Gaps and uncertainties
- **Fearing 2000:**
  - The full paper and thesis text were not read, so there is no numeric angle of repose or timing from the primary source. The details come from the UBC abstract plus the Reynolds 2015 summary.
  - The DOI is not verified. 10.1145/344779.344809 is likely but was not confirmed, so do not cite it without checking.
- **Haglund 2002:** the author list differs from the brief (Reynolds cites Haglund, Andersson, Hast; SIGRAD 2002 pp. 11–15). The primary PDF was not opened. Likely in https://ep.liu.se/ecp/007/ .
- **Foldes & Beneš 2007, Festenberg & Gumhold 2009/2011, Muraoka & Chiba 2000, Tokoi 2006, Wang et al. 2006, Langer et al. 2004, Maréchal et al. 2010:** method details and numbers are second-hand from Reynolds 2015 (https://ueaeprints.uea.ac.uk/id/eprint/53359/ ).
- **Saltvik 2006:**
  - The final published version (LNCS, PARA'06 proceedings, probably 2007) was not confirmed. The fps per configuration was not in the extracted thesis text.
  - **Conflict:** Moeslund 2005 gives dry 0.5–1.5 m/s and wet 1–2 m/s, while the Saltvik thesis gives wet 0.5–1.5 and dry 1–2. Physical intuition (denser wet flakes fall faster) favours Moeslund. Verify before using.
- **Sumner 1998:** the snow parameter column (α = 0.0, all angles 1.57 rad) is as extracted by the fetch tool. Re-check the PDF table before citing.
- **Hock 2003:** typical degree-day factors for snow (often quoted as a few mm w.e./day/K) were **not retrieved**, so do not quote a range without checking the paper's table.
- **Onoue & Nishita 2003:** the fps number was not retrieved.
- **Junker & Palamas 2020:** grid size and ms not retrieved.
- **Recent 2020–2026 real-time snow papers:** only FDG 2020 and EGPGV 2022 were found and verified.
  - Not covered: Gissler et al. 2020, "An implicit compressible SPH solver for snow simulation" (SIGGRAPH 2020), which is likely relevant but offline. Also not covered: any JCGT, I3D or HPG 2023–2026 snow paper.
  - A dedicated search for "snow deformation" plus JCGT/I3D, and for game-industry talks (e.g. GDC snow deformation talks), is recommended. Those are probably covered by other researchers.
- No game references here: this file is academic. "See it in action" links are only the paper pages and PDFs above. Stomakhin's Disney page hosts a video.

## Sources
- Fearing 2000 SIGGRAPH archive: https://history.siggraph.org/?p=118252
- Fearing PhD thesis page (UBC Imager): https://www.cs.ubc.ca/labs/imager/th/2000/Fearing2000/ ; UBC cIRcle: https://circle.ubc.ca/handle/2429/11075
- Feldman & O'Brien 2002 PDF: https://escholarship.org/content/qt5v34k082/qt5v34k082.pdf ; archive: https://history.siggraph.org/?p=144097
- Ohlsson & Seipel 2004 PDF: https://ep.liu.se/ecp/013/007/ecp01307.pdf
- Reynolds 2015 PhD thesis: https://ueaeprints.uea.ac.uk/id/eprint/53359/1/Daniel_Reynolds_3690326_-_PhD_Thesis_-_Real-Time_Rendering_and_Simulation_of_Trees_and_Snow_-_2015.pdf
- Reynolds, Laycock, Day 2014: https://research-portal.uea.ac.uk/en/publications/real-time-accumulation-of-occlusion-based-snow/ (DOI 10.1007/s00371-014-0995-5)
- Foldes & Beneš 2007: https://www.cs.purdue.edu/cgvlab/www/publications/Foldes07Vriphys ; https://diglib.eg.org/items/3f6399a3-eb01-417c-a068-0eed4bdd3c4b
- Festenberg & Gumhold 2009: https://diglib.eg.org/items/c12884c9-b7fd-4679-b743-02ad5c7b87bf
- Festenberg & Gumhold 2011: https://diglib.eg.org/items/0e424c9c-7dbe-4040-87df-6b53b53104c2
- Muraoka & Chiba 2000: https://ieeexplore.ieee.org/document/884537 ; KAKEN report: https://kaken.nii.ac.jp/en/report/KAKENHI-PROJECT-09680406/096804061999kenkyu_seika_hokoku_gaiyo
- Moeslund et al. 2005: https://diglib7.eg.org/bitstream/handle/10.2312/vvg20051008/061-068.pdf
- Saltvik et al. 2006: https://www.hpc2n.umu.se/sites/default/files/events/para06/papers/paper_208.pdf ; thesis https://folk.idi.ntnu.no/elster/master-studs/saltvik/saltvik-master.pdf
- Stomakhin et al. 2013: https://www.math.ucdavis.edu/~jteran/papers/SSCTS13.pdf ; https://disneyanimation.com/publications/a-material-point-method-for-snow-simulation
- Sumner, O'Brien, Hodgins 1998: https://escholarship.org/content/qt3nk515kp/qt3nk515kp.pdf ; https://diglib.eg.org/items/a18f4810-e22f-4f61-971f-e33e29d70ee0
- Onoue & Nishita 2003: https://www.sciweavers.org/node/142193 ; 2005 CGF: https://diglib.eg.org/handle/10.2312/CGF.v24i1pp051-060
- Junker & Palamas 2020: https://vbn.aau.dk/da/publications/real-time-interactive-snow-simulation-using-compute-shaders-in-di
- Goswami et al. 2022: https://diglib.eg.org/bitstream/handle/10.2312/pgv20221062/019-029.pdf
- Cordonnier et al. 2018: https://www.cs.purdue.edu/homes/bbenes/papers/Cordonnier18EG.pdf ; https://hal.archives-ouvertes.fr/hal-01736971
- Hock 2003: https://scilit.net/publications/a5c4d5702bc0779701d57972a27cd853 (DOI 10.1016/S0022-1694(03)00257-9)
- IAHS/ICSIH snow-modelling overview (temperature-index formula): https://iahs.info/uploads/Commissions/ICSIH/ICSIH%20snow%20modeling%20article%20FINAL.pdf
- Reiter 2005: https://webbox.lafayette.edu/~reiterc/abstracts/mv_2005a.html ; preprint https://webbox.lafayette.edu/~reiterc/mvp/sfn/sfn_pp.pdf ; Python recipe https://code.activestate.com:443/recipes/578390-snowflake-simulation-using-reiter-cellular-automat
- Gravner & Griffeath 2008: https://mk.bcgsc.ca/snowflakes/paper/modeling-snow-crystal-growth-2.pdf ; implementation https://github.com/BartMassey/snowfake
