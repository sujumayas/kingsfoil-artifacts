# 04 Academic and rare publications on fire and smoke

Angle: what graphics research, combustion physics, fire-spread science and old programmer pages say, and what each means for a 320x180 palette-limited top-down game on WebGL2 (Godot Compatibility renderer, no compute).

Tool budget note: about 31 tool calls. Several full texts were read (Perlin 1985, Xia & Zhang flicker paper, Hugo Elias via archive.org, Clar/Drossel/Schwabl review, drone-CA paper with Alexandridis constants). Others were checked at abstract level only, flagged below.

---

## Q1. What do the classic graphics papers contribute that a pixel game can actually use?

### Takeaway
The useful idea in nearly every paper is the split between a scalar "heat" field and a colour lookup applied afterwards. Perlin did this in 1985, the DOOM fire does it with a 37-entry palette, and Nguyen et al. do it with blackbody radiation. Everything else (Navier-Stokes, implicit surfaces, vorticity confinement) is film-scale cost and buys little at 320x180.

### Cited findings
- Perlin 1985, "An Image Synthesizer". Abstract lists "clouds, fire, water, stars, marble" made with noise functions. His fire is turbulence applied along "a well defined flow". The worked example is a solar corona, with `color_of_corona(radius + turbulence(v))`, and animation by `turbulence(v - frame * direction(v))`, i.e. scroll the noise along the flow direction. He computes the flame "in two passes", first a scalar flame and then colour, so the colour choice can be deferred. Film-quality frames took "about 10 minutes a frame" in an interpreted language. Turbulence is a sum of `abs(noise(p/scale)*scale)` with scale halving each octave. https://rmarcus.info/blog/assets/perlin/perlin_paper.pdf , pseudocode summary https://userpages.cs.umbc.edu/olano/class/635-07-2/PSE.pdf
- Stam & Fiume 1995, "Depicting fire and other gaseous phenomena using diffusion processes" (SIGGRAPH 95, pp. 129-136). Uses "warped blobs", density blobs advected and distorted by a wind field, plus a simple flame spread model. Abstract-level only. https://www.dgp.toronto.edu/public_user/stam/reality/Research/pdf/sig95.pdf , https://history.siggraph.org/?p=118728
- Nguyen, Fedkiw & Jensen 2002, "Physically based modeling and animation of fire" (TOG 21(3), 721-728). Separate fields for vaporised fuel and hot products, incompressible Navier-Stokes, buoyancy for hot gas and soot, blackbody radiation for colour, and a separately modelled blue core from reaction-zone radicals. Abstract-level. https://graphics.ucsd.edu/~henrik/papers/fire/ , https://graphics.stanford.edu/papers/fire-sg02/
- Lamorlette & Foster 2002, "Structural modeling of flames for a production environment" (TOG 21, 729-735). Flames are B-spline "spines" whose control points move through a wind field, with stochastic flicker, buoyant diffusion and Kolmogorov noise. The top can break off into a separate plume. Spine detail is from a student summary, not the paper. The Shrek link in the brief could not be confirmed in this pass. https://history.siggraph.org/?p=118466 , https://research.cs.wisc.edu/graphics/Courses/cs777-2003/P2Students/hielsche
- Bridson, Hourihan & Nordenstam 2007, "Curl-noise for procedural fluid flow" (TOG 26(3) art. 46). Velocity = curl of a noise potential, so the field has zero divergence by construction and particles do not bunch into sinks, which plain random velocity fields cause. https://www.dneg.com/wp-content/uploads/2022/11/2007.pdf
- Stam 2003, "Real-Time Fluid Dynamics for Games" (GDC). Grid solver with `dens_step` (add source, diffuse, advect) and `vel_step` (diffuse, advect, project), stable for any time step, full C code in the paper. Arrays are `(N+2)^2` with a boundary ring. https://www.research.autodesk.com/publications/real-time-fluid-dynamics-for-games/ , https://cg.informatik.uni-freiburg.de/intern/seminar/gridFluids_StableFluidsImplementation.pdf . A Python port uses 128x128. https://www.labri.fr/perso/nrougier/from-python-to-numpy/code/smoke_solver.py

### Inferences (mine, not cited)
- For Kingsfoil, Perlin's "scroll turbulence along the flow, then palette-map" is a single fragment shader on a quad. It runs in WebGL2 with no compute and fits the series style (palette select like study #2 acid).
- Lamorlette & Foster's spine is the right mental model for hand-drawn torch flames in 3/4 view. A flame is a bent spine with a fat base and a tip that occasionally detaches as a separate blob. That detaching tip is what makes a 4-6 frame flame loop read as fire instead of a wobbling cone.
- Curl noise is the cheapest good smoke drift. Sample a 2D noise potential, take the finite-difference curl, move smoke particles with it. No grid, no solver, and no particle clumping.
- Stam stable fluids on a tiny grid (for example 40x23, one cell per 8x8 tile block) is affordable on CPU in GDScript or a shader ping-pong, but the "projection" step needs about 20 Gauss-Seidel passes in the classic code (from memory, unverified here). Probably only worth it for one hero smoke column, not every chimney.
- Nguyen's blue core is an art cue worth stealing. One or two blue-violet pixels at the base of gas flames, braziers burning oil, or magic fire. Wood campfires do not need it.

### Gaps
- Stam 2003 PDF could not be parsed (the wdv.com mirror served HTML), so default N and iteration count are unconfirmed.
- Wei et al. 2002 lattice Boltzmann "Blowing in the wind", Fedkiw/Stam/Jensen 2001 smoke, GPU Gems ch. 38 and GPU Gems 3 ch. 30 were not checked. My expectation is that none beats curl noise or a sprite flipbook at this resolution.

---

## Q2. What is the "rare publications" lineage of the DOOM fire, and what did each author add?

### Takeaway
Hugo Elias's late-1990s page is the missing link between the demoscene fire and DOOM PSX. His one big idea is the scrolling cooling map, which shapes flame tongues without careful seeding. Lode's tutorial supplies the exact integer kernel and an HSL palette recipe.

### Cited findings
- Hugo Elias, "Fire" (freespace.virgin.net, archived). Written for VGA 320x200, 256 colours. Four steps per frame: heat source (random max-brightness pixels in the bottom lines), heat spread (average of 4 neighbours), cooling (subtract a small amount, clamp at 0), convection (scroll up 1 or 2 pixels). He notes smoothing and convection can be merged into one pass. Cooling map: a byte array the size of the screen, made by sprinkling "a few thousand pixels", then about 20 smoothing passes, values 0 to about 10. Then `pixel = avg4 - coolingmap(x, y)`. Scroll the cooling map up at the convection speed by reading it with a vertical offset, not by copying. Shapes drawn into the map with low values appear "created in flame". For swirl he points to his "Warp Feedback" page. Extras listed are sparks that rise, pop into more sparks and dim, fireballs as thrown clumps of hot pixels that leave a trail, and a flamethrower. Page fetched via archive.org with curl, WebFetch blocks archive.org. http://freespace.virgin.net/hugo.elias/models/m_fire.htm (archived at https://web.archive.org/web/2010/http://freespace.virgin.net/hugo.elias/models/m_fire.htm )
- Lode Vandevenne, "Fire Effect". Buffer 640x128. New value = (below-left + below + below-right + two-below) * 32 / 129, divisor just above 4 so heat fades. Tweaked variant uses (below-left, two-below, below-right, three-below) * 64 / 257. Palette 256 entries, hue 0 to 85 (red to yellow in 0-255 HSL), lightness `min(255, 2x)`. Bottom row re-randomised every frame, capped at 20 fps. https://lodev.org/cgtutor/fire.html
- asciimatics' fire renderer says it follows Elias's page with a different implementation. https://sources.debian.org/src/python-asciimatics/1.15.0-1/asciimatics/renderers/fire.py

### Inferences
- The DOOM PSX fire (random 0-3 lateral offset and random decay of 0 or 1) is a stripped version of Elias's design. Random decay replaces the cooling map, random lateral shift replaces warp feedback. Elias's cooling map is the natural "variant B" for the demo, at near-zero cost (one extra byte read per pixel).
- Elias's cooling-map shapes give a free effect for Kingsfoil. A rune or a skull drawn into the cooling map makes a fire-field glyph that burns in the rune's shape. Good for Tibia-style magic fields.
- At 320x180, a per-tile fire buffer of 16x24 or so is enough. Lode's divisor (129/32, about 4.03) sets flame height. In integer terms, a larger divisor gives shorter flames.

### Gaps
- Hugi demoscene article on fire returned 404; no other demoscene text was read this pass.
- Elias's "Warp Feedback" page was not fetched.

---

## Q3. What real flame physics numbers are useful as art direction?

### Takeaway
Puffing frequency scales with one over the square root of fire size. Candles flicker at 10-15 Hz, a campfire puffs at about 2-3 Hz, a burning house at about 1 Hz. Bigger fire should animate slower, not just bigger.

### Cited findings
- Flicker or puffing comes from periodic shedding of a toroidal vortex. Many experiments give f proportional to D^-1/2 with a factor "around 1.5" (Trefethen & Panton, Cetegen & Ahmed 1993). Byram & Nelson derived f proportional to (g/D)^1/2. Xia & Zhang's trend line is f = 0.48 sqrt(g/D), equivalent to f = 1.5 sqrt(1/D) with D in metres. The frequency is "flow-dominated", so fuel chemistry barely matters. https://arxiv.org/pdf/1803.10400
- Original paper: Cetegen & Ahmed, "Experiments on the periodic instability of buoyant plumes and pool fires", Combustion and Flame 93 (1993) 157-184. https://cgdl.engr.uconn.edu/?p=120 . One thesis lists slightly different coefficients (1.5 Malalasekera, 1.6 Cetegen & Ahmed, 1.68 McCaffrey). https://core.ac.uk/download/363147445.pdf
- Glow colour vs temperature (approximate, sources disagree by about 100 C at band edges): first visible dark red 500-600 C, dull red 600-800 C, cherry red 800-1000 C, orange 1000-1200 C, yellow 1200-1400 C, white about 1300-1600 C. The yellow glow of wood flames comes from hot soot, roughly blackbody. https://firefighternow.com/how-hot-are-different-flame-colors/ , https://pslc.ws/fire/howwhy/flameco.htm , https://www.build-a-gasifier.com/PDF/Temperature%20ByAppearance.pdf
- Smoke colour, as read by firefighters. Almost all solids give white smoke when first heated, and that white is moisture. Brown often means untreated wood. Grey can mean the fire is slowing or running out of fuel. Black often means synthetics (rubber, plastics) and possible volatility. Colour-to-fuel holds well only for single-fuel fires. Firefighters judge volume, velocity, density and colour together. https://www.fireengineering.com/firefighter-training/the-art-of-reading-smoke-understanding-the-color/ , https://www.firefightingincanada.com/trainers-corner-the-science-of-reading-smoke-2139/

### Derived table (computed from f = 1.5/sqrt(D), my arithmetic)

| Source | D (m) | f (Hz) | Frames per puff at 12 fps |
|---|---|---|---|
| Candle | 0.01 | 15 | under 1 (use per-frame jitter) |
| Torch head | 0.05 | 6.7 | about 2 |
| Brazier | 0.2 | 3.4 | about 3-4 |
| Campfire | 0.5 | 2.1 | about 6 |
| Bonfire | 1 | 1.5 | 8 |
| Burning house | 3 | 0.87 | about 14 |
| Wildfire front, 10 m | 10 | 0.47 | about 25 |

### Inferences
- Candles and torches are faster than any sane sprite loop, so use random per-frame jitter (study #5's 10-12 Hz flicker strings fit). Campfires and larger fires should use a slower, larger "puff" loop. This gives a rule for frame counts. A 4-frame torch loop at 12-15 fps and an 8-12 frame bonfire loop at 10-12 fps match physics.
- A fire palette ramp for pixel art maps cleanly onto the glow bands. Black, dark red, red, orange, yellow, pale yellow-white is 6 steps, which matches the 5-8 entry ramps typical in palette-limited art. The white core belongs only to the hottest base area.
- Smoke colour is a free state signal for gameplay. Fresh ignition gives white or pale smoke (moisture driving off). Steady wood burning gives brown-grey. Dying fire gives thin grey. Burning oil, tar or a "cursed" building gives black. Extinguished by water gives a white steam burst. Players can read fire stage from smoke colour at a glance.

### Gaps
- Plume rise laws (Morton-Taylor-Turner, Heskestad flame height) not fetched.
- No primary source for wood flame temperature in Kelvin. The brief's 1000-1400 K was not confirmed. The charts above put yellow wood flame at 1200-1400 C (about 1470-1670 K). Treat both as rough.

---

## Q4. What does fire-spread science give a tile game?

### Takeaway
Two models matter. Drossel-Schwabl is the 4-rule toy that already behaves like a game, and the ratio f/p controls everything. Alexandridis et al. 2008 is a multiplicative probability with published constants, which maps one-to-one onto tile properties (fuel type, density, wind, slope).

### Cited findings
- Drossel & Schwabl 1992, PRL 69, 1629-1632. Rules, applied in parallel each step: (1) burning tree becomes empty; (2) tree catches fire with probability 1-g if any nearest neighbour burns (g = immunity, 0 in the base model); (3) tree ignites with probability f with no burning neighbour (lightning); (4) empty becomes tree with probability p. Dynamics depend only on f/p. The SOC state needs f much smaller than p, e.g. f/p = 1/500 on a 1024 lattice, with runs from 1/32000 to 1/125. Critical tree density in 2D is about 0.408. With no lightning and slow growth (p = 0.005, L = 800), fronts become "regular and spiral-shaped". Immunity examples use p = 0.05, g = 0.2 or 0.48. https://ar5iv.labs.arxiv.org/html/cond-mat/9610201 , https://researchr.org/publication/PhysRevLett.69.1629
- Cluster size cutoff scales as about (p/f)/ln(p/f). https://arxiv.org/pdf/cond-mat/9701062
- Alexandridis, Vakalis, Siettos & Bafas 2008, "A cellular automata model for forest fire spread prediction: the case of the wildfire that swept through Spetses Island in 1990", Appl. Math. Comput. 204, 191-201. The real fire burned nearly 6 km2 in about 11 hours, pushed south by north winds. https://dspace.lib.ntua.gr/xmlui/handle/123456789/18520?show=full , https://arxiv.org/pdf/2403.08817
- The Alexandridis spread rule, as reused by a 2020 drone-suppression paper on a Moore neighbourhood: `p_burn = p0 (1 + p_veg)(1 + p_den) p_w p_s`, with `p_w = exp(c1 V) * exp(V c2 (cos(theta) - 1))` (theta = angle between spread direction and wind) and `p_s = exp(a_s * theta_s)` for slope. Constants attributed to Alexandridis 2008: p0 = 0.6, c1 = 0.045, c2 = 0.131, p_den = -0.4 sparse / 0 normal / 0.3 dense, p_veg = 0.4 for grass and shrub in that paper's table. For slope, the horizontal distance is L for orthogonal and sqrt(2) L for diagonal neighbours. Grid was 2 m cells over about 40,000 m2. https://arxiv.org/pdf/2007.00883
- Karafyllidis & Thanailakis 1997, Ecological Modelling 99(1), 87-97. Cell state is the burned fraction of the cell (continuous, not binary), each cell has a spread rate, and fronts are circular in uniform fuel. The diagonal weighting was not confirmed. https://scilit.com/publications/560dc83c7f2d45ec00db18355c00bea9 , review at https://arxiv.org/pdf/0706.4130

### Inferences
- For a server-authoritative MMO tile grid, Alexandridis is ideal. It is one multiply chain per burning-neighbour pair per tick, deterministic given a seeded RNG, and every factor is a tile or weather property designers can tune. Example: with wind V = 5 m/s, spreading downwind gives p_w = exp(0.225), about 1.25, while upwind gives exp(0.225) * exp(-1.31), about 0.34. Downwind spread is then about 3.7x more likely than upwind.
- Rain or wet tiles can enter as a moisture factor p_m (the drone paper adds one), so rain from study #3 slows fire without special-case code.
- Drossel-Schwabl's spiral-front regime (no lightning, slow regrowth) is a ready-made "living burning field" for a magic hazard. It cycles forever without scripting.
- Percolation explains the design knob. With certain spread to 4 neighbours, fires die out locally below about 59% fuel density and sweep the map above it (site percolation threshold on the square lattice is about 0.593, standard value quoted from memory, not fetched here). The 0.408 above is the Drossel-Schwabl steady-state density, a different quantity. Spread probability below 1, or 8 neighbours, shifts the threshold. Designers should keep fuel density in towns below the sweep threshold, or one torch burns the city.

### Gaps
- Original Alexandridis p0 is often quoted as 0.58; I only confirmed 0.6 via the reuse paper. a_s (slope constant) not confirmed.
- Rothermel not covered here (other researcher's area).

---

## Q5. What do game-research venues and pixel-art papers say?

### Takeaway
Little peer-reviewed work targets systemic fire or fire readability directly. The best sources remain GDC talks (BotW "chemistry engine") and dev blogs. Pixel-art papers cover conversion and palettes, not effects.

### Cited findings
- BotW "chemistry engine" (GDC 2017, "Change and Constant: Breaking Conventions with The Legend of Zelda: Breath of the Wild"). It governs element-element, element-material and material-material interactions. Elements are things without a fixed state (fire, water, ice); trees, rocks and the player are materials. Proposed by technical director Takuhiro Dohta. Reported rules include "elements can change the state of materials" and "materials can not influence each other's states". https://www.thumbsticks.com/gdc-17-breath-of-the-wild-science-lies , https://gamesbeat.com/the-legend-of-zelda-breath-of-the-wild-makes-chemistry-just-as-important-as-physics/
- Unity's emergent-design article uses a fire propagation test project to illustrate tuning "design levers" through playtests. https://unity.com/blog/games/systems-that-create-ecosystems-emergent-game-design
- Gerstner et al. 2012 "Pixelated Image Abstraction" (NPAR) solves jointly for a low-res image and a reduced palette. https://pixl.cs.princeton.edu/pubs/Gerstner_2012_PIA/index.php . Kopf & Lischinski 2011 "Depixelizing Pixel Art" goes the other way, pixel art to vectors. https://johanneskopf.de/publications/pixelart

### Inferences
- BotW's "materials cannot change each other directly, only through elements" is a clean architecture rule for Asterion. Tiles (materials) never talk to each other. Fire, water and wind (elements) are the only things that change tile state. That keeps the server rule table small.
- Gerstner's joint palette solve could be an offline tool to pick a fire ramp that also works for lava and torchlight, but it is not a runtime technique.

### Gaps
- No FDG/AIIDE/CHI PLAY/CoG paper on fire readability or chemistry engines found in one search. A targeted ACM DL search is the next step.
- No paper found on dithered transparency for smoke in pixel art. Screen-door (ordered Bayer) dithering is folk knowledge, not traced to a paper this pass.

---

## Sources
- https://rmarcus.info/blog/assets/perlin/perlin_paper.pdf
- https://userpages.cs.umbc.edu/olano/class/635-07-2/PSE.pdf
- https://www.dgp.toronto.edu/public_user/stam/reality/Research/pdf/sig95.pdf
- https://history.siggraph.org/?p=118728
- https://graphics.ucsd.edu/~henrik/papers/fire/
- https://graphics.stanford.edu/papers/fire-sg02/
- https://history.siggraph.org/?p=118466
- https://research.cs.wisc.edu/graphics/Courses/cs777-2003/P2Students/hielsche
- https://www.dneg.com/wp-content/uploads/2022/11/2007.pdf
- https://www.research.autodesk.com/publications/real-time-fluid-dynamics-for-games/
- https://cg.informatik.uni-freiburg.de/intern/seminar/gridFluids_StableFluidsImplementation.pdf
- https://www.labri.fr/perso/nrougier/from-python-to-numpy/code/smoke_solver.py
- https://web.archive.org/web/2010/http://freespace.virgin.net/hugo.elias/models/m_fire.htm
- https://lodev.org/cgtutor/fire.html
- https://sources.debian.org/src/python-asciimatics/1.15.0-1/asciimatics/renderers/fire.py
- https://arxiv.org/pdf/1803.10400
- https://cgdl.engr.uconn.edu/?p=120
- https://core.ac.uk/download/363147445.pdf
- https://firefighternow.com/how-hot-are-different-flame-colors/
- https://pslc.ws/fire/howwhy/flameco.htm
- https://www.build-a-gasifier.com/PDF/Temperature%20ByAppearance.pdf
- https://www.fireengineering.com/firefighter-training/the-art-of-reading-smoke-understanding-the-color/
- https://www.firefightingincanada.com/trainers-corner-the-science-of-reading-smoke-2139/
- https://ar5iv.labs.arxiv.org/html/cond-mat/9610201
- https://researchr.org/publication/PhysRevLett.69.1629
- https://arxiv.org/pdf/cond-mat/9701062
- https://dspace.lib.ntua.gr/xmlui/handle/123456789/18520?show=full
- https://arxiv.org/pdf/2403.08817
- https://arxiv.org/pdf/2007.00883
- https://scilit.com/publications/560dc83c7f2d45ec00db18355c00bea9
- https://arxiv.org/pdf/0706.4130
- https://www.thumbsticks.com/gdc-17-breath-of-the-wild-science-lies
- https://gamesbeat.com/the-legend-of-zelda-breath-of-the-wild-makes-chemistry-just-as-important-as-physics/
- https://unity.com/blog/games/systems-that-create-ecosystems-emergent-game-design
- https://pixl.cs.princeton.edu/pubs/Gerstner_2012_PIA/index.php
- https://johanneskopf.de/publications/pixelart
