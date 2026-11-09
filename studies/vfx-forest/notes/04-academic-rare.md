# 04 — Academic & rare publications on trees, plants, ecosystems, foliage rendering, birds
### What each paper means in practice for a cheap top-down pixel game (Godot 4, Compatibility renderer)

Researcher notes, study #4 FOREST. Date: 2026-11-09. About 34 tool calls.
Legend: **[V]** = checked on a fetched page in this session. **[U]** = from general knowledge or a search snippet, not confirmed on a fetched page, so check before publishing. "Inference" = my own reasoning about how to apply it to pixel art.

---

## Q1. How do you grow a tree *shape* procedurally, and which part is worth stealing for 16–64 px sprites?

### Takeaway
Pixel trees have only a few hundred pixels of canopy, so full 3D growth models are overkill at runtime. Four cheap ideas still transfer well:
1. **Bracketed L-system turtle (2D).** Generate trunk and branch skeletons offline or at load time.
2. **Weber & Penn "ShapeRatio" envelopes.** One float function per species gives the silhouette: conical = pine, flame = poplar or cypress, spherical = oak, AttractionUp < 0 = willow.
3. **Space colonization in 2D inside a canopy blob.** This gives natural-looking branch networks that fill a silhouette and adapt to neighbouring trees.
4. **Pipe model.** Trunk width comes from r^n = r1^n + r2^n with n of 2–3, so trunks thicken correctly. In pixel terms this means 1 px twigs, 2–3 px limbs and 4–6 px trunks.

### Cited findings
- **Lindenmayer 1968.** "Mathematical models for cellular interactions in development, I and II", *Journal of Theoretical Biology* 18 (1968). [U] for volume and pages (commonly cited as 18:280–315). The title and the "I and II" pairing appear on algorithmicbotany's 2025 retrospective page [V title]: https://www.algorithmicbotany.org/papers/Lindenmayer2025.html. ABOP says L-systems were "introduced in 1968 by Lindenmayer … as a theoretical framework" for simple multicellular organisms [V]: https://algorithmicbotany.org/papers/abop/abop.pdf
- **Prusinkiewicz & Lindenmayer, *The Algorithmic Beauty of Plants* (ABOP).** Springer-Verlag, New York, 1990, reprinted 1996. The free electronic edition is ©2004 Prusinkiewicz [V]: https://algorithmicbotany.org/papers/abop/abop.pdf
  - Turtle symbols: `F` draw a step of length d, `f` move without drawing, `+`/`-` turn by δ, `[` push state, `]` pop state [V].
  - Ready-made 2D plant grammars (Fig. 1.24) [V]:
    | id | n | δ | axiom | productions |
    |---|---|---|---|---|
    | a | 5 | 25.7° | F | F→F[+F]F[−F]F |
    | b | 5 | 20° | F | F→F[+F]F[−F][F] |
    | c | 4 | 22.5° | F | F→FF−[−F+F+F]+[+F−F−F] |
    | d | 7 | 20° | X | X→F[+X]F[−X]+X; F→FF |
    | e | 7 | 25.7° | X | X→F[+X][−X]FX; F→FF |
    | f | 5 | 22.5° | X | X→F−[[X]+X]+F[+FX]−X; F→FF |
  - **Stochastic L-system** (Fig. 1.27): F→F[+F]F[−F]F (p=0.33), F→F[+F]F (0.33), F→F[−F]F (0.34). Derivations of length 5 give "different specimens of the same fictitious plant species" [V]. This is the core trick for per-instance variety from one species definition.
- **Aono & Kunii 1984.** "Botanical Tree Image Generation", *IEEE Computer Graphics and Applications* 4(5):10–34, May 1984 [V via the Weber & Penn reference list]. Weber & Penn cite it for branching-angle analysis and for its view that L-systems could not produce complex 3D branching [V]. Bibliographic record: https://researchr.org/publication/AonoK84/bibtex. I did not read the full text in this session; it is not freely available.
- **Weber & Penn 1995.** "Creation and Rendering of Realistic Trees", SIGGRAPH 95 [V paper]: https://courses.cs.duke.edu/fall02/cps124/resources/p119-weber.pdf · https://history.siggraph.org/?p=118727. DOI commonly cited as 10.1145/218380.218427 [U].
  - **ShapeRatio(shape, r)** for r from 0 to 1 [V]:
    - 0 conical: 0.2+0.8r
    - 1 spherical: 0.2+0.8·sin(πr)
    - 2 hemispherical: 0.2+0.8·sin(0.5πr)
    - 3 cylindrical: 1
    - 4 tapered cylindrical: 0.5+0.5r
    - 5 flame: r/0.7 if r≤0.7, else (1−r)/0.3
    - 6 inverse conical: 1−0.8r
    - 7 tend flame
    - 8 envelope (pruning)
  - Other parameters [V]: Levels (usually 3–4), nBranches, nDownAngle, nRotate (spiral), nCurve/nCurveV, Leaves, LeafScale, AttractionUp (negative values droop, as in the weeping willow), Prune/PruneRatio.
  - **LOD by skipping, not separate meshes** [V]. Items are drawn in "masses" (16 for stems, 4 for leaves) so detail drops evenly across the tree. A 100k-facet tree at 2 km becomes "about 30 lines and 1000 points". Quaking Aspen leaf triangles fall from 53,248 at 5 m to 0 at 240 m.
  - **Wind sway** [V]. Sway is time-varying curvature with amplitude a1 = windspeed/50·a0 and a2 = windgust/50·a0 + a1/2. Two sine terms (phase ×1.0 and ×0.7) are combined, each stem gets a random phase offset, and frequency depends on radius/length. Two incommensurate sines plus a per-stem phase is exactly the cheap shader-sway recipe.
- **Runions, Lane & Prusinkiewicz 2007.** "Modeling Trees with a Space Colonization Algorithm", Eurographics Workshop on Natural Phenomena [V]: https://www.algorithmicbotany.org/papers/colonization.egwnp2007.pdf · https://diglib.eg.org/handle/10.2312/NPH.NPH07.063-070
  - Steps [V]:
    1. Scatter attraction points inside the crown envelope. Only an inside/outside test is needed.
    2. Each point influences its nearest node within radius d_i.
    3. Grow a new node: v' = v + D·n̂, where n̂ is the normalized sum of unit vectors toward the influencing points.
    4. Delete points within kill distance d_k.
  - Example values [V]: N = 12000, 1500 or 375 points; d_k = 2D or 20D; d_i = ∞, 17D (shrub) or 8D (tree).
  - Pipe exponent n "usually between 2 and 3" [V].
  - Timing [V]: "a few seconds to a few minutes" on a 3 GHz desktop in 3D.
  - Fig. 10: a hedge of shrubs whose crowns adapt to their neighbours [V].
- **Palubicki et al. 2009.** "Self-organizing tree models for image synthesis" [V paper]: https://www.algorithmicbotany.org/papers/selforg.sig2009.small.pdf · https://www.algorithmicbotany.org/papers/selforg.sig2009.html. *ACM TOG* 28(3), Art. 58 (SIGGRAPH 2009) [U].
  - **Shadow propagation** [V]. Each bud adds Δs = a·b^(−q) to the voxels in a pyramid below it, typically q_max = 4–8 layers deep. Light exposure is Q = max(C − s + a, 0).
  - Space colonization variant [V]: perception cone θ ≈ 90°, occupancy radius ρ = 2 internodes, perception distance r = 4–6 internodes.
  - Extended Borchert–Honda resource split λ [V]: λ > 0.5 favours the main axis (excurrent, conifer-like), λ < 0.5 favours laterals (decurrent, broad crown). Fig. 7 varies λ from 0.46 to 0.54.
  - Branches with too little light are shed [V].
  - Timing [V]: 700k internodes in 82 s (2.4 GHz P4); 200³ voxel grid.
- **Stava et al. 2014.** "Inverse Procedural Modelling of Trees", *Computer Graphics Forum* 33(6), DOI 10.1111/cgf.12282 [V DOI via zendy listing; venue from EG diglib]. Preprint [V]: https://cs.purdue.edu/homes/bbenes/papers/Stava14CGF.pdf · https://diglib.eg.org/items/4c6abd53-959e-4336-af65-3eb719b9c1c3
  - Fits **24 developmental parameters** to an input tree with simulated annealing (Metropolis–Hastings; ζmax = 4, i_last = 7500) [V].
  - Similarity combines shape, geometry and structure distances with equal weights [V].
  - Takes 12–270 min per model [V]. Limitations: it "cannot reproduce the input model exactly", it misses regular branching patterns, and environmental parameters are not fitted [V].

### Inferences (pixel practice)
- **Cheapest useful generator for 32–64 px tree sprites:**
  1. Use a stochastic 2D L-system with 3–4 iterations (not 5–7; at 1 px per F step, 5+ iterations overflow the sprite).
  2. Draw it with Bresenham lines at 1–3 px widths following the pipe model.
  3. Stamp leaf-cluster blobs at the leaf (X) positions only, the way ABOP's node-rewriting systems d–f put X at the tips.
  The skeleton barely shows in a top-down canopy, so its main payoff is **bare winter trees and dead or burnt forests**, where branches *are* the sprite.
- **Weber–Penn ShapeRatio as the canopy silhouette function.** In 3/4 top-down, sample ShapeRatio along the vertical sprite axis to get the half-width per row, then fill with cluster blobs. Suggested mapping: pine/fir → conical (0); poplar/cypress → flame (5); oak/maple → spherical (1); birch → tend-flame (7); willow → spherical plus negative AttractionUp (droop the bottom rows). This gives a per-species silhouette for one float parameter.
- **2D space colonization** is very cheap (a few hundred points, sub-millisecond). Use it at bake time to grow a branch skeleton into a painted canopy mask. Neighbouring trees can share the point set (the Runions hedge result), so forest-edge trees lean away from each other for free.
- **Palubicki's λ** is a single "conifer ↔ broadleaf" slider for a generator.
- **Weber–Penn LOD "masses"** carry over to pixel art as skipping detail passes, not making new art: at distance or on low-end devices, draw only the base canopy layer and skip the highlight and leaf-sparkle layers.
- **What to steal:** the stochastic L-system table above, the ShapeRatio function list, two-sine-plus-random-phase sway, the pipe exponent, and the λ slider.
- **What to skip:** 3D growth simulation at runtime, voxel shadow grids, and inverse modelling (minutes to hours per tree).

### Gaps
- Aono & Kunii full text not read (paywalled IEEE). Their GMT branching-angle details are unverified.
- No academic paper found that is specifically about *2D top-down* L-system or space colonization for pixel sprites. Hobby tools exist (Q6).

---

## Q2. How did researchers shade and abstract huge numbers of leaves cheaply, and how does that become a palette ramp?

### Takeaway
The single most useful paper for pixel foliage is **Reeves & Blau 1985**. Lucasfilm faced "millions of particles" with no hope of exact lighting, so they shaded each leaf by its **depth into the canopy from the light side** (diffuse), its **distance to the canopy edge** (ambient/self-shadow), and a **plane from the sun through the neighbouring treetop** (cast shadow). In pixel terms that is a 3–5 step palette ramp indexed by a tiny per-sprite distance field, which is exactly how pixel artists already shade clusters.

**Deussen & Strothotte 2000** add the other half: **draw outlines only where depth jumps exceed a threshold**. That is the pixel-art rule of outlining clusters only where they overlap something behind them.

**Kowalski et al. 1999 (graftals)** add the third: place leaf-tuft stamps where a "desire image" is darkest, mostly near the silhouette, so a smooth blob reads as leafy at very low cost.

### Cited findings
- **Reeves & Blau 1985.** "Approximate and probabilistic algorithms for shading and rendering structured particle systems", SIGGRAPH 85 [V title/abstract]: https://history.siggraph.org/?p=107421. *Computer Graphics* 19(3), DOI 10.1145/325165.325250 [U].
  - Abstract [V]: trees and a grass-covered forest floor; exact shading and visibility are "infeasible"; deviations from exact rendering are hard to detect in such detailed images.
  - Mechanics, from a lecture summary of the paper [V]: https://math.hws.edu/~bridgeman/courses/424/f25/inclass/1117-particlesys.pdf
    - **Construction:** trees are built recursively (trunk → branches → sub-branches), with parameters randomized within species ranges. Branches are lines and leaves are small circles. Post-processing adds missing or damaged branches, gravity bending and prevailing wind.
    - **Diffuse** weight comes from **d_d**, the distance into the tree from the light side, so particles near the outer edge are most likely lit.
    - **Specular** glints are added *randomly* where d_d is small and the leaf faces favourably.
    - **Ambient** weight comes from **d_a**, the distance to the nearest edge of the tree's bounding volume parallel to the ground. Self-shadowing is handled by lowering ambient.
    - **External shadow:** a plane through the light and the tip of the neighbouring tree. Above it a particle is fully lit; below it the chance of sunlight falls with depth; well below it gets ambient only.
    - **Rendering:** trees are sorted back to front (bounding volumes must not intersect), and each tree's particles are bucket-sorted by depth. This is a painter's algorithm, the same as Godot y-sort.
  - Film: Lucasfilm, *The Adventures of André and Wally B.* (Aug 1984), reference 7 of the paper [V]. The HWS slides say it used structured particle systems for trees and grass [V].
- **Deussen & Strothotte 2000.** "Computer-Generated Pen-and-Ink Illustration of Trees", SIGGRAPH 2000 [V content; year from the Konstanz listing]: https://www.cs.princeton.edu/courses/archive/fall00/cs597b/papers/plantsketch.pdf · https://graphics.uni-konstanz.de/publikationen/Deussen2000ComputergeneratedPen/index.html
  - Leaves are drawn as **abstract primitives**: view-facing disks, ellipses or polygonal outlines with a user-set size [V].
  - An outline pixel is drawn where the maximal depth difference to its neighbours exceeds a threshold [V]. Lower thresholds give more detail.
  - Abstraction rises with bigger primitives and higher thresholds, e.g. size 0.15 with threshold 1000 versus size 0.7 with threshold 2000 [V].
  - Distant foliage gets fewer strokes automatically, and background primitives can be scaled up to 2× to keep clear shapes [V].
  - Shadow regions can be filled solid black [V].
  - Numbers [V]: 183k leaves → 8,800 primitives; a 200k-leaf maple → 16,200; a conifer uses 13,200 *elliptic primitives with random orientation*. Interactive mode ran 3 trees × 20k primitives plus 25k ground particles at about 3 fps (SGI Onyx 2).
- **Kowalski, Markosian, Northrup, Bourdev, Barzel, Holden & Hughes 1999.** "Art-Based Rendering of Fur, Grass, and Trees", SIGGRAPH 99 [V]: https://cs.brown.edu/~jhughes/papers/Kowalski-ARO-1999/paper.pdf · https://history.siggraph.org/?p=116373
  - **Graftals** are the procedurally placed tufts, leaves and grass elements [V].
  - A **desire image** marks where graftals are wanted (dark = more), e.g. lit from near the camera so silhouettes are darkest, then remapped as 2d − d² [V].
  - Placement [V]: put each graftal at the max-desire pixel, then subtract a Gaussian dot. A bucket sort finds the max in O(1). Each frame retries last frame's graftals first.
  - Graftal size blends constant screen size and perspective size with w = 0.25 [V].
  - Static graftals use 3 priority levels, each about 4× denser than the next [V].
  - **Limitations** [V]: popping and flicker when graftals are "crowded out"; static graftals get too dense when zooming out.
- **Gerstner et al. 2012.** "Pixelated Image Abstraction", NPAR 2012 [V]: https://pixl.cs.princeton.edu/pubs/Gerstner_2012_PIA/index.php
  - "Simultaneously solves for a mapping of features and a reduced palette" [V].
  - Example output: 22×32 px with 8 colours [V].
  - Evaluated with a user study and pixel-artist interviews; described as "an approximation" of artist results [V].

### Inferences (pixel practice): the "Reeves–Blau palette ramp"
At bake time or in a fragment shader, per canopy sprite:
```
mask      = canopy alpha (cluster blobs)
d_light   = distance (in px) from the canopy edge facing the sun, inward   // Reeves–Blau d_d
d_edge    = distance to the nearest canopy edge (any side)                  // Reeves–Blau d_a
shade     = clamp(k1*d_light + k2*(R - d_edge) + bayer4x4(x,y)*0.25, 0, 1)
index     = floor(shade * (RAMP_STEPS-1))      // RAMP_STEPS = 3..5
color     = palette_tex[species_row, season_col, index]
glint     = (d_light < 2px) && hash(x,y,cluster) < p_spec   -> brightest ramp entry (random specular)
```
- **Ordered dither at ramp boundaries** reuses study #1 Snow's depth-byte-plus-dither idea.
- **External shadow (Reeves–Blau plane) in 2D:** if a taller neighbour lies sunward within distance h_neighbour·cot(sun elevation), darken this tree's sunward ramp by one step. That is one comparison per tree per sun change, not per pixel.
- **Deussen–Strothotte outlines in 2D:** give each cluster blob a fake depth (its stack order in the sprite). Draw a dark interior line only where an upper cluster overlaps a lower one (depth jump above the threshold), and always on the outer silhouette. This is the pixel-art "selective outline" rule, but automatic. Raising the threshold or primitive size gives coarser, more abstract trees for small or distant variants.
- **Conifers:** randomly oriented ellipse stamps (Deussen) read as needles. For broadleaf use round blobs, for palms use elongated radial strokes.
- **Graftals for top-down:** set desire = silhouette proximity × lit side. Place 3×3 to 5×5 px leaf-tuft stamps greedily with a "subtract a dot" rule. Bake 2–4 variants rather than placing at runtime; the paper's popping problem is the reason to avoid runtime placement.
- **Gerstner 2012 is a pipeline tool, not a runtime technique.** Feed renders of 3D trees in (or SpeedTree/Blender captures) to get starting sprites at about 22×32 px with 8 colours, then hand-clean.
- **What to steal:** d_d/d_a shading, random specular only on the lit rim, the neighbour shadow plane, the depth-jump outline threshold, primitive-size abstraction levels, and greedy desire-image stamp placement.
- **Risks:** a per-pixel distance field per sprite costs memory unless you bake it into one channel of the sprite (R = ramp index, G = sway weight, B = outline/cluster ID). Runtime graftal placement flickers.

### Gaps
- I did not see the Reeves & Blau numeric formulas, only lecture paraphrase. The original PDF was not fetched (ACM DL).
- Kowalski reports no total graftal counts.

---

## Q3. How do you distribute trees into believable forests (clustering, spacing, species mixes, biomes)?

### Takeaway
Use **three cheap layers**:
1. **Biome** from a temperature × moisture lookup (Whittaker), which gives the species list.
2. **Species density field** turned into points with **error-diffusion halftoning** (Deussen 1998) or **Poisson disk** sampling with a per-species radius (Bridson 2007).
3. **Interaction rules**: a big tree suppresses small ones nearby, and a species promotes its own kind at a ring distance (Lane & Prusinkiewicz kernels) to make groves.

Tune with the **Hopkins index** (H < 1 regular, ≈ 1 random, > 1 clustered). Make visual variety with **approximate instancing**: 7 size classes per species was enough in Deussen 1998.

### Cited findings
- **Deussen, Hanrahan, Lintermann, Měch, Pharr & Prusinkiewicz 1998.** "Realistic modeling and rendering of plant ecosystems", SIGGRAPH 98 [V content]: https://pharr.org/matt/assets/ecosys.pdf · https://graphics.stanford.edu/papers/ecosys/ · https://history.siggraph.org/?p=116559. DOI 10.1145/280814.280898 [U].
  - **Interactive placement** [V]: a grey-level density image becomes plant positions via **Floyd–Steinberg halftoning**. Relaxation then moves each plant toward its Voronoi cell centre.
  - **Ecosystem simulation** [V]: plants are circles. When two intersect, the smaller dies. Plants also die of old age at maximum size, or with some probability when dominated. Competitive ability = vigor × relative size, and vigor depends on local water and the species' wet/dry preference.
  - **Approximate instancing** [V]: plants are clustered in parameter space. Lychnis used 3 varieties × 7 sizes; the mountain meadow used 8 species × 7 levels = 56 representative plants for about 102,522 plants (≈ 1,300:1 memory reduction); a lawn used 10 tuft sets × about 20 uses each (130:1).
  - Times [V]: meadow simulation 35 min plus 8 h of ray tracing (1998 hardware).
- **Lane & Prusinkiewicz 2002.** "Generating Spatial Distributions for Multilevel Models of Plant Communities", Graphics Interface 2002 [V]: https://graphicsinterface.org/wp-content/uploads/gi2002-9.pdf · https://www.algorithmicbotany.org/papers/eco.gi2002.html
  - **Local-to-global** models [V]: self-thinning (the smaller of two intersecting circles dies; maximum radius R); succession (two species with different shade tolerance; dominated plants die with probability 1 − shaded[species]); propagation (a live plant spawns a child at x + a small random Δx; this is the only clustering mechanism).
  - **Global-to-local deformation kernel** [V]:
    1. Sample y from the marginal CDF of the density f, then x from the conditional CDF.
    2. After placing a plant of size r_t, multiply f by K = κ(dist/r_t) and renormalize. κ < 1 near the plant gives inhibition (even spacing); κ > 1 at some ring gives promotion (clustering).
    3. Place largest plants first.
    4. For multiple species, keep one f_i per species and a kernel matrix M_ij for how placing species j deforms species i.
    Each placement costs O(n) with incremental row sums.
  - **Hopkins index** H = mean NN distance from random points / mean NN distance from plants: ≈ 1 random, < 1 regular, > 1 clustered [V]. Reported values: 0.4 for overdispersed, 2.4 for clustered, up to 11 for propagation [V].
  - Timing [V]: 1,599 plants of 36 species distributed in 0.5 s (733 MHz P-III).
- **Makowski, Hädrich, Scheffczyk, Michels, Pirk & Pałubicki 2019.** "Synthetic Silviculture: Multi-scale Modeling of Plant Ecosystems", *ACM TOG* 38(4), Art. 131, DOI 10.1145/3306346.3323039 [V]: https://wp.faculty.wmi.amu.edu.pl/papers/Makowski.etal-2019-Synthetic-Silviculture.pdf
  - Three scales: module, plant, ecosystem. Modules store topology only [V].
  - Light exposure uses exponential decay from bounding-volume overlaps. Shade tolerance blends effective light: Q_eff = lerp(s_tol, 1, Q·Q_G) [V].
  - Climate (temperature, precipitation) controls species presence [V].
  - Solitary trees develop a wide crown; dense stands grow taller, less vigorous and **asymmetric** [V].
  - 9 module prototypes; 16 plant types in most results [V].
  - 468,199 plants at 18.8 s per step; 218 plants at about 7 ms per step (i5 with GTX 1050) [V].
- **Bridson 2007.** "Fast Poisson Disk Sampling in Arbitrary Dimensions", SIGGRAPH 2007 sketch [V content]: https://www.cs.ubc.ca/~rbridson/docs/bridson-siggraph07-poissondisk.pdf. DOI 10.1145/1278780.1278807 [U].
  - Algorithm [V]: background grid with cell size r/√n (2D: r/√2, at most one sample per cell); an active list; pick a random active sample and try **k = 30** candidates in the annulus [r, 2r]; accept the first candidate at least r from all samples, or retire the active sample.
  - **O(N)**: step 2 runs exactly 2N−1 times [V].
- **Cook 1986.** "Stochastic Sampling in Computer Graphics", *ACM TOG* 5(1), DOI 10.1145/7529.8927 [U for volume; DOI seen in a mirror URL].
  - Non-uniform samples turn aliasing into noise; the monkey retina's photoreceptors are Poisson-disk-like with a minimum spacing; jitter approximates Poisson disk [V via SIGGRAPH HyperGraph]: https://education.siggraph.org/static/HyperGraph/aliasing/alias5.htm
- **Whittaker 1975.** *Communities and Ecosystems*. Biomes on mean annual precipitation × mean annual temperature axes, a simplified version of Holdridge [V]: https://en.wikipedia.org/wiki/Biome
  - Whittaker-type biome names listed there include tropical rainforest, tropical seasonal rainforest, temperate rainforest, temperate deciduous forest, temperate evergreen forest, taiga, elfin woodland, thorn forest/scrub, temperate woodland, savanna, temperate grassland, tundra, deserts, bog, swamp forests and mangrove [V].
- **Holdridge 1947.** Life zones from simple climate data. Uses four axes and defines 30 "humidity provinces"; largely ignores soil and sun exposure [V Wikipedia]. Citation: "Determination of world plant formations from simple climatic data", *Science* 105(2727):367–368 [U].

### Inferences (pixel practice)
- **Tile-grid recipe** (forest chunk of 64×64 tiles):
  1. Compute biome from (temperature, moisture) noise via a 2D lookup texture. This is Whittaker's diagram as a 16×16 PNG.
  2. For each species in the biome, compute a density map = biome weight × local moisture × noise.
  3. **Floyd–Steinberg the density map at tile resolution** (Deussen 1998). This gives tree tiles directly, is deterministic, and reuses the dither mindset from study #1.
  4. Alternatively, run Bridson Poisson disk with a per-species radius in tiles (pine 1.5, oak 2.5, ancient tree 4), with an optional Lloyd-like nudge toward the Voronoi centre.
  5. **Big-first placement** with an inhibition kernel (no small tree within 0.6·r of a big one) and a promotion ring for clonal species (birch, aspen: κ > 1 at 1–2 r) gives birch groves and pine stands.
  6. Tune by computing Hopkins H per biome. Targets (Inference): plantation 0.5–0.7, natural mixed forest ~1–1.3, birch or aspen groves 2–4.
- **Self-thinning as an age model.** Run 20–50 steps of the circle-domination simulation offline per chunk. You get natural size gradients (ancient trees in clearings, saplings at edges). It is cheap in 2D: a few thousand circles with a spatial grid.
- **Asymmetric crowns** (Makowski): when a tree has a close tall neighbour on one side, choose a sprite variant whose canopy leans away, or flip it.
- **Approximate instancing = sprite variant budget.** Deussen's 7 size classes per species is a well-founded number. Suggested budget (Inference): 3–4 silhouettes × 3 size classes per species, with palette rows for seasons. This matches Deussen's 56 representatives for 8 species.
- **What to steal:** halftoned density → positions; the kernel matrix M_ij for species interactions; big-first placement; Hopkins H as a tuning metric; Bridson k = 30; 7 size classes.
- **Risks:** Poisson disk in an MMO needs determinism per chunk. Seed with chunk coordinates and handle borders by generating with a 1-chunk margin.

### Gaps
- Holdridge's original *Science* paper not opened.
- No numeric kernel shapes or radii are given in Lane 2002 (paper says none).

---

## Q4. Birds: flocking rules and animation timing that are cheap and believable

### Takeaway
Use **Reynolds' three rules in strict priority order** (separate > align > cohere), with neighbours limited to the **nearest ~7 (topological)**, as measured in real starlings (Ballerini 2008), and a uniform spatial grid to avoid O(N²).

Top-down birds need **banking** (Hildenbrandt 2010 found it essential for realistic turns) and a **flap–glide/bound cycle**. Real small birds flap at about 14–27 Hz, faster than a pixel animation can show. Use **2–3 flap frames at ~8–12 fps animation with randomized pauses** and accept the aliasing; the eye reads it as "fast" (Inference).

### Cited findings
- **Reynolds 1987.** "Flocks, Herds, and Schools: A Distributed Behavioral Model", *Computer Graphics* 21(4), July 1987, pp. 25–34 (SIGGRAPH 87) [V]: https://www.cs.toronto.edu/~dt/siggraph97-course/cwr87
  - Rules in decreasing priority [V]: collision avoidance, velocity matching, flock centering.
  - Neighbourhood sensitivity uses **inverse-square weighting**; linear looked "bouncy" [V].
  - **Prioritized acceleration allocation** [V]: add requests in priority order until the max acceleration is used up, trimming the last. A plain weighted average caused indecision.
  - O(N²) noted, with spatial "binning" proposed [V].
  - 80 boids took ~95 s per frame on a Symbolics 3600 [V].
  - Birds have ~300° field of view [V].
- **Ballerini et al. 2008.** "Interaction ruling animal collective behavior depends on topological rather than metric distance: Evidence from a field study", *PNAS* 105(4):1232–1237, DOI 10.1073/pnas.0711437105 [DOI V via citedrive listing; volume/pages U]: https://www.citedrive.com/en/discovery/interaction-ruling-animal-collective-behavior-depends-on-topological-rather-than-metric-distance-evidence-from-a-field-study. arXiv:0709.1916. The PMC page was blocked by a captcha.
  - Hildenbrandt et al. summarize the finding as starlings interacting "only with a fixed number of 6-7 nearest neighbours" [V].
- **Hildenbrandt, Carere & Hemelrijk 2010.** "Self-organized aerial displays of thousands of starlings: a model", *Behavioral Ecology* 21(6):1349–1359 [V via RePEc]: https://ideas.repec.org/a/oup/beheco/v21y2010i6p1349-1359.html · preprint [V]: https://arxiv.org/pdf/0908.2677
  - n_c = 6.5 topological neighbours; cruise speed 10 m/s (6.9–15); separation radius 4 m (1.6–5.4); hard-sphere radius 0.2 m [V].
  - Cohesion and alignment have a 2×45° blind angle at the rear; separation has none [V].
  - Roost attraction radius 150 m; the vertical attraction term gives flat flocks [V].
  - Reaction time 50 ms, integration step 5 ms; random force 10% of the steering force [V].
  - Flocks of 2,000 typical (100–5,000 tested) [V].
  - **Banking** uses roll-in weight 10 and roll-out weight 1. Without banking, flocks become oblong and turn unrealistically [V].
  - No wingbeat parameter in the model [V].
- **Wingbeat frequencies.** Graphics-journalism compilation [V page; secondary source]: https://style.org/unladenswallow
  - Zebra finch 27 Hz; European starling 14 Hz; budgerigar 14 Hz; downy woodpecker 14 Hz; European swallow ≈ 15 Hz estimated (Lund wind tunnel 7–9 Hz). The article credits Taylor et al. 2003 (*Nature*) for the Strouhal relation U ≈ 3fA.
  - Bruderer et al. (radar and cine study) give flap and pause phases for 41 passerine-type species. The abstract notes wingbeat frequency "increased less than expected" with power fraction [V abstract only]: https://tethys.pnnl.gov/publications/wing-beat-characteristics-birds-recorded-tracking-radar-cine-camera

### Inferences (pixel practice)
- **Budget:** 10–60 birds per screen; a k = 7 neighbour search via a uniform grid (cell = separation radius × 2) is microseconds in GDScript. A MultiMesh/MultiMeshInstance2D with per-instance custom data (frame, tint) is one draw call.
- **Scale mapping:** at ~32 px per metre, starling separation (4 m) is ~128 px, which is too sparse on screen. Compress world distances 3–5× for flocks (artistic license). Keep the *ratios*: separation ≈ 20× hard radius, perception ≫ separation.
- **Top-down banking** = squash the sprite horizontally or switch to a "tilted" frame during lateral acceleration, with roll-in fast and roll-out slow (the 10:1 weights).
- **Flap timing:** real 14–27 Hz is beyond a 60 fps display at 2+ frames per cycle without aliasing. Use 2–4 frame flap loops at 8–15 animation fps. Insert **flap-bound gaps** (wings folded 1 frame for 100–300 ms) for small passerines and **flap-glide** for larger birds (crows, raptors: slow 3–5 frame flap plus long glides). The glide/bound split comes from the Bruderer study; specific durations for each bird are an Inference.
- **Take-off when the player approaches** (Inference from boids): add a "flee" behaviour at the top of Reynolds' priority list, triggered by a fear radius; neighbours copy via alignment, so the startle propagates through the k = 7 network.
- **Shadows:** a dark 1–2 px ellipse offset by altitude × sun vector, which is cheap and sells height in top-down.
- **What to steal:** priority allocation instead of averaging, k = 7 topological neighbours, rear blind angle, banking, the roost attractor (a perch-tree attractor) and its vertical term (keeps the flock "flat" over the canopy).

### Gaps
- Primary wingbeat datasets (Pennycuick; Bruderer 2010 tables) not opened. Frequencies are from a secondary compilation; check before quoting.
- Ballerini PNAS full text was not accessible (captcha).

---

## Q5. Light under trees: what physics says about sunflecks and dappled shade

### Takeaway
Sunflecks under a canopy are **pinhole images of the sun**, so they are **round or elliptical, not leaf-shaped**. Their diameter is about **1/108 of the height of the leaf gap** (the sun's ~0.5° angular size), and they **stretch into ellipses at low sun**.

In-game numbers (Inference): a 6–10 m canopy gives spots of about 5.5–9 cm. At ~32 px per metre that is **2–3 px soft dots** under the crown, each 2–3 px across in the shadow. Stretch them by 1/sin(sun elevation) along the sun direction at dawn and dusk. Under a gap that is mostly open you get leaf-shaped light instead; only small gaps make sun-discs.

### Cited findings
- **Minnaert, *Light and Color in the Outdoors*.** Dutch original c. 1937; English revision by Len Seymour, Springer-Verlag 1996 [V via a CSULB course handout]: https://home.csulb.edu/~gpickett/PS112/thexp7A.pdf
  - Canopy gaps act as pinholes; image diameter / gap-to-ground distance ≈ 1/108 ≈ 0.5° [V].
  - Spots are circular when the ground is perpendicular to the sunlight and elliptical at low sun, because "the ground cuts the cone at an angle" [V].
- **Tufte** citing Minnaert: "each dapple is an image of the surface of the sun" [V]: https://www.edwardtufte.com/?p=200. During partial eclipses the spots become crescents (reader comment, not Minnaert) [V].

### Inferences (pixel practice)
- **Shadow shader** (one extra texture read): under each canopy, multiply the ground by the shadow colour, except where a scrolling, **sparse dot texture** (Poisson-disk dots of 2–3 px radius, which reuses Q3 Bridson) shows through. Sway the dot texture with the same two-sine wind as the canopy so the flecks flicker together. Turn flecks off when cloudy or at night.
- **Seasonal:** in autumn and winter (sparse canopy), fleck density rises until the shadow becomes "branch-shadow lines" (draw the L-system skeleton as the shadow). Spring is dense, summer densest.
- **Character in shade:** sample the shade/fleck mask at the character's feet and lerp the sprite palette toward shade, as in study #1's palette lighting. A fleck crossing the face is a nice, cheap "alive" moment.
- **Risk:** physically correct fleck size (2–3 px) can read as noise. Artists usually exaggerate to 3–6 px. Validate by eye.

### Gaps
- The prompt's "Peltoniemi canopy gap light" reference was not searched due to the call budget, and no gap-fraction or Beer–Lambert canopy-light numbers were collected. Search later for "canopy gap fraction Beer-Lambert leaf area index sunfleck" if needed.

---

## Q6. 2015–2026 (and NPR-adjacent) work on pixel foliage / 2D tree generation

### Takeaway
Academic work on **pixel-art generation** exists:
- Gerstner 2012 (abstraction with a palette solve)
- "Deep Unsupervised Pixelization" (SIGGRAPH Asia 2018) [U]
- SD-πXL (arXiv 2410.06236, 2024; score distillation into low-res quantized images) [U for details]

I found **no peer-reviewed paper specifically on procedural top-down pixel trees or forests**. Practical procedural pixel-tree tools are hobby or indie: an Aseprite extension, a Godot asset, an itch.io devlog. These are bake-time tools to support artists, not replacements for hand-made key sprites.

### Cited findings
- Gerstner et al. 2012 NPAR [V] (see Q2).
- SD-πXL: "Generating Low-Resolution Quantized Imagery via Score Distillation", arXiv:2410.06236 [U, title from search only]: https://ar5iv.labs.arxiv.org/html/2410.06236
- "Deep unsupervised pixelization" [U, title from search only]: https://history.siggraph.org/?p=198013
- **4b3c** "procedural pixel art tree generator" devlog [V]: https://4b3c.itch.io/procedural-pixel-art-tree-generator/devlog/773435/my-pixel-art-tree-generator
  - A binary-tree node structure where nodes are circles joined by lines.
  - Line width depends on the number of descendants (a pipe-model analogue).
  - **Nodes lose their leaves once they gain children**, so foliage ends up at the tips.
  - Written in Python. No rendering, palette or shading details given.
- Gentree, a procedural tree generator extension for Aseprite [U, search listing only]: https://community.aseprite.org/t/extension-gentree-procedural-tree-generator-for-aseprite/27983 · https://devkidd.itch.io/gentree
- Godot Asset Library "Procedural Pixel Art Tree" (asset 5021) [U, search listing only]: https://godotengine.org/asset-library/asset/5021
- Game Developer article "Generating Optimized 2D Art in Unity: Procedural Generation for Stylized and Optimized 2D Foliage" [U, not opened]: https://www.gamedeveloper.com/game-platforms/generating-optimized-2d-art-in-unity-procedural-generation-for-stylized-and-optimized-2d-foliage

### Inferences
- The "leaves only on tips" rule is the 2D equivalent of ABOP node-rewriting (X at the tips) and of Palubicki's shedding of shaded branches. It is a good default.
- Recommended pipeline (Inference): an artist draws 2–3 hero sprites per species. A generator (L-system or space colonization, ShapeRatio silhouette, Reeves–Blau ramp, Deussen outline threshold) produces 6–10 more variants in the same palette. The artist approves or fixes them.

### Gaps
- SD-πXL, Deep Unsupervised Pixelization, Gentree and Godot asset 5021 were not opened; their claims are unverified.
- No validated artist or player study on procedural pixel trees was found.

---

## Quick "what to steal" table

| Paper | Steal | Pixel cost | Risk |
|---|---|---|---|
| Lindenmayer 1968 / ABOP 1990 | Stochastic bracketed L-systems (table above) for bare/dead/winter trees | Bake time; Bresenham lines | Over-iteration overflows small sprites |
| Aono & Kunii 1984 | Branching-angle realism (GMT) | — | Not read |
| Reeves & Blau 1985 | d_light/d_edge → palette ramp; random rim glints; neighbour shadow plane; painter's sort | 1 baked channel + palette LUT | Needs per-sprite distance bake |
| Weber & Penn 1995 | ShapeRatio silhouettes; two-sine sway with random phase; LOD by skipping "masses" | ~0 | — |
| Deussen et al. 1998 | Floyd–Steinberg density → tree positions; 7 size classes per species | Load-time | Determinism per chunk |
| Kowalski et al. 1999 | Desire-image greedy leaf-tuft stamping near silhouettes | Bake time | Popping if done at runtime |
| Deussen & Strothotte 2000 | Outline only where depth jump > threshold; primitive size = abstraction level; ellipses for conifers | Bake time | — |
| Lane & Prusinkiewicz 2002 | Kernel inhibition/promotion matrix between species; big-first; Hopkins H | Load-time O(n) per plant | No published kernel numbers |
| Runions et al. 2007 | 2D space colonization into a canopy mask; shared points → neighbour-adapted crowns | Bake time | — |
| Bridson 2007 | Poisson disk, k = 30, cell r/√2 | O(N) | — |
| Palubicki et al. 2009 | λ conifer↔broadleaf slider; shed shaded branches | Bake time | — |
| Stava et al. 2014 | (Mostly skip) fit parameters to reference trees | Minutes–hours | Overkill |
| Makowski et al. 2019 | Asymmetric crowns in dense stands; shade tolerance lerp | Variant pick | — |
| Reynolds 1987 | Priority-ordered steering; inverse-square weighting | µs per bird with grid | O(N²) if naive |
| Ballerini 2008 / Hildenbrandt 2010 | k ≈ 7 neighbours; rear blind angle; banking; roost attractor | µs | World-scale distances too sparse; compress |
| Minnaert | Sunflecks = round/elliptical sun images, d ≈ h/108 | 1 texture read | True size may read as noise |
| Whittaker 1975 / Holdridge 1947 | Biome LUT on temperature × precipitation | 16×16 LUT | — |
| Gerstner 2012 | Render → 22×32 px, 8-colour starting sprites | Offline | Needs hand clean-up |

---

## Sources
- ABOP PDF: https://algorithmicbotany.org/papers/abop/abop.pdf
- Lindenmayer retrospective: https://www.algorithmicbotany.org/papers/Lindenmayer2025.html
- Aono & Kunii bibtex: https://researchr.org/publication/AonoK84/bibtex
- Reeves & Blau: https://history.siggraph.org/?p=107421 ; lecture summary https://math.hws.edu/~bridgeman/courses/424/f25/inclass/1117-particlesys.pdf
- Weber & Penn: https://courses.cs.duke.edu/fall02/cps124/resources/p119-weber.pdf ; https://history.siggraph.org/?p=118727
- Deussen et al. 1998: https://pharr.org/matt/assets/ecosys.pdf ; https://graphics.stanford.edu/papers/ecosys/ ; https://history.siggraph.org/?p=116559
- Lane & Prusinkiewicz 2002: https://graphicsinterface.org/wp-content/uploads/gi2002-9.pdf ; https://www.algorithmicbotany.org/papers/eco.gi2002.html
- Runions et al. 2007: https://www.algorithmicbotany.org/papers/colonization.egwnp2007.pdf ; https://diglib.eg.org/handle/10.2312/NPH.NPH07.063-070
- Palubicki et al. 2009: https://www.algorithmicbotany.org/papers/selforg.sig2009.small.pdf ; https://www.algorithmicbotany.org/papers/selforg.sig2009.html
- Stava et al. 2014: https://cs.purdue.edu/homes/bbenes/papers/Stava14CGF.pdf ; https://diglib.eg.org/items/4c6abd53-959e-4336-af65-3eb719b9c1c3 ; https://zendy.io/title/10.1111/cgf.12282
- Makowski et al. 2019: https://wp.faculty.wmi.amu.edu.pl/papers/Makowski.etal-2019-Synthetic-Silviculture.pdf
- Bridson 2007: https://www.cs.ubc.ca/~rbridson/docs/bridson-siggraph07-poissondisk.pdf
- Cook 1986 / stochastic sampling: https://education.siggraph.org/static/HyperGraph/aliasing/alias5.htm ; https://dcmpx.remotevs.com/org/acm/dl/SL/doi/10.1145/7529.8927
- Deussen & Strothotte 2000: https://www.cs.princeton.edu/courses/archive/fall00/cs597b/papers/plantsketch.pdf ; https://graphics.uni-konstanz.de/publikationen/Deussen2000ComputergeneratedPen/index.html
- Kowalski et al. 1999: https://cs.brown.edu/~jhughes/papers/Kowalski-ARO-1999/paper.pdf ; https://history.siggraph.org/?p=116373
- Reynolds 1987: https://www.cs.toronto.edu/~dt/siggraph97-course/cwr87
- Ballerini et al. 2008: https://www.citedrive.com/en/discovery/interaction-ruling-animal-collective-behavior-depends-on-topological-rather-than-metric-distance-evidence-from-a-field-study
- Hildenbrandt et al. 2010: https://arxiv.org/pdf/0908.2677 ; https://ideas.repec.org/a/oup/beheco/v21y2010i6p1349-1359.html
- Wingbeats: https://style.org/unladenswallow ; https://tethys.pnnl.gov/publications/wing-beat-characteristics-birds-recorded-tracking-radar-cine-camera
- Minnaert sunflecks: https://home.csulb.edu/~gpickett/PS112/thexp7A.pdf ; https://www.edwardtufte.com/?p=200
- Whittaker / Holdridge: https://en.wikipedia.org/wiki/Biome
- Gerstner 2012: https://pixl.cs.princeton.edu/pubs/Gerstner_2012_PIA/index.php
- SD-πXL: https://ar5iv.labs.arxiv.org/html/2410.06236 ; Deep unsupervised pixelization: https://history.siggraph.org/?p=198013
- Hobby pixel-tree generators: https://4b3c.itch.io/procedural-pixel-art-tree-generator/devlog/773435/my-pixel-art-tree-generator ; https://devkidd.itch.io/gentree ; https://godotengine.org/asset-library/asset/5021

Blocked or not accessible: algorithmicbotany.org/papers/ index (not on allowlist), arxiv.org/abs (not on allowlist), PMC Ballerini (captcha).
