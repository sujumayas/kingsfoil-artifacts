# 03 — Procedural / systems techniques for forests: placement, biomes, seasons, shapes, wind, sunflecks

Researcher notes for study #4 (TREES / FORESTS, top-down pixel, Godot 4 Compatibility/WebGL2).
Convention: **[C]** = cited finding (URL given). **[I]** = my inference / proposal (not from a source). Quotes < 15 words.

---

## Q1. Placement: Poisson-disk, jittered grids, density, clustering, clearings, undergrowth

### Takeaway
Use **Bridson Poisson-disk** (O(N), k=30) or a **jittered grid** for trunk positions; get variable density by making the
radius `r` a function of a density noise / species size; get clumping by sampling species from a **low-frequency
"species weight" noise** rather than uniform random. Red Blob's "local max of high-frequency noise within R" is the
simplest chunk-safe (stateless) alternative, with R per biome. Minecraft and TerraFirmaCraft show the game-industry
pattern: per-chunk *count* × *noise threshold* × *rarity 1/N* × *survival predicate*.

### Cited findings
- **Bridson 2007** [C] https://www.cs.ubc.ca/~rbridson/docs/bridson-siggraph07-poissondisk.pdf
  - Background grid cell size `r/√n` so each cell holds at most one sample; grid of ints, -1 = empty.
  - Seed one random sample; active list. Loop: pick random active `i`, generate up to `k` candidates uniformly in the
    annulus `[r, 2r]` around it; accept a candidate if ≥ r from all neighbours (grid lookup); if all k fail, remove `i`.
  - "The typical value of k is 30." Step 2 runs exactly `2N−1` times ⇒ **O(N)** total.
- **Red Blob Games, "Making maps with noise"** [C] https://www.redblobgames.com/maps/terrain-from-noise/
  - Trees: high-frequency "blue noise" `noise(50*nx, 50*ny)`; place a tree where the cell is the **local maximum within
    radius R** (demo R = 1…6); optional circular test `dx*dx+dy*dy <= R*(R+1)` allows non-integer R.
  - "Varying R per biome" gives variable density; author recommends Poisson disc or a jittered grid as more efficient/better.
- **Minecraft placed-feature modifiers** [C] https://wiki.ronlab.site/content/minecraftwiki_en_all_maxi_2025-11/Placed_feature
  - `count` (0–256, copies of a position; stacking multiplies); `in_square` (+random 0–15 on X and Z within the 16×16 chunk);
    `rarity_filter` (keep with chance `1/chance`); `noise_threshold_count`: `noise(x/200, z/200) < noise_level ? below_noise : above_noise`;
    `noise_based_count`: `ceil((noise(x/f, z/f)+offset)*ratio)`; `surface_water_depth_filter`; `block_predicate_filter`; `heightmap`.
  - ⇒ Minecraft tree placement = **per-chunk random positions (not blue noise)**, density modulated by a coarse
    (1/200 scale) noise, filtered by predicates. (Exact counts per biome, e.g. forest vs plains, not in the fetched page — gap.)
- **TerraFirmaCraft (Minecraft mod) forest schema** [C] https://terrafirmacraft.github.io/Documentation/1.18.x/worldgen/features/trees
  - `tfc:forest` has `tree_count`, `bush_count`, `groundcover_count` (undergrowth as separate layers), `per_chunk_chance`.
  - Per-species entries carry climate bounds `min_rain/max_rain/min_temp/max_temp`.
  - Defaults: `old_growth_chance` 6 (≈1 in 6 trees old growth in old-growth forests), `spoiler_old_growth_chance` 200,
    `fallen_tree_chance` 14 (≈1 in 14 chunks has a fallen log), `dead_chance` 75 (≈1 in 75 trees dead). Great tuning defaults
    for "age/size variety" and "dead snags".
- **Terraria spacing rules** [C] https://terraria.wiki.gg/wiki/Trees
  - Sapling needs 1 open tile each side of base and **2 tiles each side for branches (5-tile-wide column)**; **≥3 open tiles
    between saplings** (palm: 1). Yellow Willow / Sakura replace forest trees at **1/20 (5%)** at worldgen — a "rare variant" knob.
  - Tree types keyed to ground block/biome (boreal on snow, palm on sand, mahogany on jungle grass, ash on ash grass).
  - Shaking: once per tree per day, cap 500 trees/day.

### Inferences / proposed algorithm [I]
```
# Variable-radius Bridson for a forest chunk (tile units; e.g. 32x32 tiles, 16px tiles)
density(p)  = biomeDensity(biome(p)) * smoothstep(c0, c1, fbm(p*0.02))   # low-freq "stand" noise → clearings
species(p)  = argmax_s( weight[biome][s] * (0.5 + 0.5*noise_s(p*0.05)) ) # each species its own low-freq noise → clumps
r(p)        = crownRadius[species(p)] * lerp(1.6, 1.0, density(p))        # big trees push neighbours further
reject p if density(p) < rand() or onPath(p) or inClearing(p)
```
- Use `max(r(a), r(b))` (or `(ra+rb)/2`) for the pair test; grid cell = `rMin/√2`, search radius `ceil(rMax/cell)` cells.
- **Chunk seams**: run Bridson per chunk with a seeded RNG `hash(chunkX,chunkY,worldSeed)` and include samples from already-
  generated neighbour chunks in the grid; or use the stateless jittered grid (one candidate per cell, jitter ≤ 0.5·cell,
  keep with probability density) which needs no neighbours — best for an MMO streaming world.
- **Clumping/seed dispersal** (ecology not cited here — gap): 2-pass "parent + offspring": place parents with large r, then
  spawn 0–4 offspring of same species within 1–3 crown radii (Thomas/Neyman-Scott cluster process). Cheap and reads as
  natural groves (birch groves, aspen clones).
- **Forest edge**: density ramps 0→1 over 3–6 tiles from the edge; place shrubs/saplings preferentially in the ramp
  (edge = more light ⇒ more undergrowth); big old trees only in the interior (density > 0.8).
- **Undergrowth layers** (Terraria/TFC pattern): separate passes with smaller r: trees (r≈2–4 tiles) → shrubs (r≈1–1.5) →
  groundcover (per-tile probability, no Poisson). Shrubs are suppressed under dense canopy (sample canopy-coverage map).
- **Paths**: carve after placement with a distance field from path polylines (reject if d < 1.5 tiles), so trees line paths.

### Gaps
- Deussen et al. 1998 "Realistic modeling and rendering of plant ecosystems" (competition / self-thinning) not fetched.
- Exact Minecraft per-biome tree counts (e.g. forest/plains) not confirmed.
- No cited ecology source on clumping (Neyman-Scott) — standard spatial-statistics knowledge, needs a URL.

---

## Q2. Biomes: Whittaker / Holdridge, noise → biome, species mixes, real densities

### Takeaway
Two noises (temperature, moisture) → lookup table, like Whittaker. Red Blob's square table (elevation × moisture) is the
smallest working version; Minecraft uses **5 temperature × 5 humidity levels** plus continentalness/erosion/weirdness and picks
the **nearest biome point** in parameter space. Per-biome: species weights, density (R), undergrowth counts, dead/old-growth chances.

### Cited findings
- **Red Blob biome function** [C] https://www.redblobgames.com/maps/terrain-from-noise/ (e, m in 0..1; "thresholds will need tuning"):
  - e<0.1 OCEAN; <0.12 BEACH; e>0.8: m<0.1 SCORCHED, <0.2 BARE, <0.5 TUNDRA, else SNOW;
  - e>0.6: m<0.33 TEMPERATE_DESERT, <0.66 SHRUBLAND, else **TAIGA**;
  - e>0.3: m<0.16 TEMPERATE_DESERT, <0.50 GRASSLAND, <0.83 **TEMPERATE_DECIDUOUS_FOREST**, else **TEMPERATE_RAIN_FOREST**;
  - else: m<0.16 SUBTROPICAL_DESERT, <0.33 GRASSLAND, <0.66 **TROPICAL_SEASONAL_FOREST**, else **TROPICAL_RAIN_FOREST**.
  - Moisture is relative to max rainfall, turning Whittaker's triangle into a square. Elevation redistribution `pow(e*1.2, exp)`.
- **Red Blob polygon map generation** [C] https://www.redblobgames.com/maps/polygon-map-generation/ — moisture on land =
  BFS **distance from lakeshore/river**, 1.0 at water → 0.0 far away, "sqrt mapping" from distance. (Biome section is still a
  placeholder in the new version.) Useful idea: rivers create riparian forest belts.
- **Minecraft multi-noise** [C] https://wiki.ronlab.site/content/minecraftwiki_en_all_maxi_2025-11/World_Generation
  - 6 params: temperature, humidity (vegetation), continentalness, erosion, weirdness, depth.
  - Temperature 5 levels: [-1,-0.45], [-0.45,-0.15], [-0.15,0.2], [0.2,0.55], [0.55,1]. Humidity 5 levels:
    [-1,-0.35], [-0.35,-0.1], [-0.1,0.1], [0.1,0.3], [0.3,1]. Weirdness > 0 ⇒ variant biomes; PV = `1 − |3|w| − 2|`.
  - Biomes are intervals in 6-D space; outside all ⇒ **closest** biome interval is used.
- **Minecraft grass/foliage tint (colormap)** [C] https://optifine.readthedocs.io/colormaps.html
  - 256×256 colormap, axes temperature × rainfall; `t=clamp(temp,0,1); r=clamp(rain,0,1)*t` ⇒ only the lower-left triangle
    used. Spruce (`pine.png`) and birch (`birch.png`) have their own fixed palettes, excluded from foliage.png.
  - ⇒ **one greyscale leaf sprite + biome tint lookup** = cheap biome/season variety (direct match for our palette LUT idea).
- **TerraFirmaCraft** per-species climate envelopes (min/max rain & temp) [C] (URL above) — the "species niche" approach:
  each species valid in a rectangle of (T, P); biome mix emerges from overlap.
- **Real tree counts (Crowther et al. 2015, Nature 525:201)** [C] https://cdanfort.w3.uvm.edu/csc-reading-group/crowther-nature-2015.pdf
  - ≈3.04 trillion trees; 42.8% tropical/subtropical, 24.2% boreal, 21.8% temperate; **highest densities in boreal and tundra
    zones** (many small stems). Trees by biome (billions): tropical moist 799, boreal 749, temperate broadleaf 363, tropical
    grassland 318, temperate conifer 151, tropical dry 156, Mediterranean 53. No per-ha means in text (only figure).
- **Savanna woody cover (Sankaran et al. 2005, Nature, 854 sites)** [C] https://www.usgs.gov/publications/determinants-woody-cover-african-savannas
  - Below ~**650 mm** mean annual precipitation, max woody cover rises linearly with rainfall ("water constrains woody cover");
    above it, canopy could close and **fire/herbivory are required** to keep the savanna open.
  - Game rule: savanna tree cover cap = `lerp(0, maxCover, P/650)`; above threshold add a "fire scar/grazing" noise mask.
- **Boreal species** [C] BOREAS overstory database counts: black spruce 2,312, jack pine 1,782, aspen 1,497 occurrences;
  height–DBH fits `ln(h)=a·ln(DBH)+b` (spruce a=0.94,b=0.04; jack pine 0.86/0.19; aspen 0.80/0.52)
  https://data.ornldaac.earthdata.nasa.gov/public/boreas/TE/te6bmflg/comp/te13_boreas_canopy.pdf
  ⇒ use for "age → sprite height" curves: a 20 cm-DBH jack pine ≈ 16 m, aspen ≈ 18.5 m (computed, not in report).

### Inferences: species mixes & density knobs per biome [I] (common botanical knowledge; needs per-line citations later)
| Biome (game) | Canopy species weights | Undergrowth | Density/feel |
|---|---|---|---|
| Boreal/taiga | spruce 0.45, pine 0.25, fir 0.1, birch/aspen 0.2 (larch in bogs) | moss, lichen, blueberry | many small narrow stems, r small, gaps of lichen/bog |
| Temperate deciduous | oak 0.3, maple 0.3, beech 0.25, birch/ash 0.15 | ferns, saplings in gaps | big round crowns, r large, closed canopy |
| Mixed | 50/50 conifer/broadleaf by a low-freq noise | as above | conifers on cold/north slopes |
| Birch grove | birch 0.8 + aspen/pine | tall grass, flowers | open, bright, clustered (offspring pass) |
| Tropical rainforest | emergent 0.05, canopy 0.55, understory palms/ferns 0.4 | very dense | 3 layers, lianas |
| Savanna | acacia/baobab, isolated | grass | cover capped by rainfall (Sankaran), r huge |
| Dead/burnt | snags 0.7, charred stumps, seedlings | ash, fireweed | `dead_chance`→1 |
Commonly quoted forestry ranges (to verify): mature temperate stands ~250–600 stems/ha (≥10 cm DBH); tropical moist forest
~400–700 stems/ha ≥10 cm DBH; FAO forest definition ≥10% canopy cover. **In game, real density is far too dense to walk** —
use visual canopy cover (% of tiles under crown) instead: dense forest 60–80%, open woodland 20–40%, savanna 5–15% [I].

### Gaps
- Whittaker diagram and Holdridge life zones not fetched directly (use Wikipedia/primary next pass).
- Old Red Blob polygon-map article (2010, Stanford mirror) has the elevation×moisture biome table — not fetched.
- Per-hectare stand densities by forest type not obtained from a primary source (fetches of MSU/PMC pages failed: bot walls).

---

## Q3. Seasons & phenology → per-tree phase offset + palette LUT

### Takeaway
Leaf colour = chlorophyll (green) fading to reveal carotenoids (yellow/orange, always present) + anthocyanins (red/purple,
**made in autumn**, boosted by sunny days/cool nights). Timing differs by **species** (maples & birches early, oaks later,
larch latest), by **site** (Hopkins: 4 days per degree latitude / 400 ft altitude), and by **individual**. So: each tree gets
`phase = season_t + speciesOffset + elevation*k + individualJitter`, and indexes a per-species palette ramp.

### Cited findings
- **Pigments** [C] Penn State Extension https://extension.psu.edu/the-science-behind-autumn-leaf-color
  - Chlorophyll green "masks many of the other pigments"; carotenoids yellow/orange present all season; anthocyanins red/purple,
    "most anthocyanins…are actually produced in the leaf during autumn."
  - Trigger: **shortening day length**; temperature & precipitation change speed/vividness; species, elevation, local conditions shift timing.
  - Red maple "vivid and fiery scarlet red"; sugar maple yellow/orange; **maples and birch colour relatively early**; **oaks
    red/brown/russet and later** than maples/birches.
  - Weather: drought ⇒ early/muted colour, early drop, brown leaves; wet/cloudy ⇒ muted, chlorophyll lingers; sunny days + cool
    nights ⇒ brighter reds; frost/wind/heavy rain shorten display.
- **USDA Forest Service fall colour guide** [C] https://www.fs.usda.gov/fallcolors/2018/science.shtml
  - Oaks russet/brown/deep red (Gambel oak rusty red-orange); hickories golden/russet; **quaking aspen golden**, aspen/poplar bright
    yellow; dogwood pink-red; **American beech soft bronze**; sugar & red maple reds/oranges (some yellow).
  - (The newer FS URL https://www.fs.usda.gov/visit/fall-colors/science-of-fall-colors failed to load: client_error.)
- **Larch / tamarack** [C] UNH Extension https://extension.unh.edu/blog/2022/10/autumn-gold-tamarack
  - Conifer that drops **all needles** each autumn; needles turn **gold**; season "mid-October…into early November" in NH,
    i.e. **after the hardwoods**. Needles in spur clusters of 10–25. Typical of bogs/peatlands.
- **Hopkins' bioclimatic law** [C] Alabama Extension https://www.aces.edu/blog/topics/forestry/estimating-alabama-bloom-times-using-hopkins-bioclimatic-law/
  - "four days for each degree of latitude, five degrees of longitude, and 400 feet of altitude" (stated 1919; developed 1889);
    "other things being equal" — approximate guide.
- **Individual variation** [C] https://www.pubmed.gov/31034022/ — 9 lilac individuals over 2 years: temperature effect on senescence
  "seems to be related to individual differences"; onset differed between years. No day magnitude given.
- **Winter / snow on conifers** [C] https://ourwinterworld.org/snow-and-living-things/plants/
  - "Narrow trees with down-sloped branches 'shed' heavy snow loads"; conifer branches flex and drop snow; heavy snow breaks
    deciduous limbs still holding leaves. Spruce = main boreal evergreen.

### Proposed game rule [I]
```
# season_t in [0,1) over the year; each species has a ramp of N palette rows (LUT) and key times
stages = [WINTER_BARE, BUD, BLOSSOM?, FRESH_GREEN, SUMMER, TURN1, TURN2, PEAK, BROWN, BARE]
phase(tree) = season_t
            + species.offset            # maple/birch -0.02, oak +0.03, larch +0.05 (≈ 7–18 days of a 365-day year)
            + elevationTiles * k_elev   # Hopkins: +4 days per "400 ft" band → map to your world's height levels
            + hash01(tree.id)*0.03 - 0.015   # individual jitter ≈ ±5 days
            + (isEdge ? -0.01 : 0)      # sun-exposed edge trees colour first (inference)
stage = species.lut.lookup(phase)       # → palette row index (one byte) for palette-swap shader
```
- Species ramps (pixel palette rows): maple green→yellow-orange→**scarlet**; birch/aspen green→**lemon/golden yellow**;
  oak green→olive→**russet/brown** (and oaks often **hold dead brown leaves** — marcescence, needs citation); beech→**bronze/tan**;
  larch green→**gold needles**→bare; spruce/pine/fir: constant (slightly darker/bluer in winter + snow layer).
- Leaf drop: alpha-dither the canopy sprite by `(phase − dropStart)/dropLen` against a Bayer threshold (reuse snow study's
  dither threshold) and spawn falling-leaf particles with probability ∝ d(alpha)/dt + wind.
- Drought year modifier: shift all offsets earlier and desaturate reds (Penn State).
- Spring: understory shrubs leaf out before canopy (common ecology claim; Augspurger 2008 Oecologia not retrievable — gap),
  blossom trees (cherry/apple) bloom **before** leaf-out → a short white/pink stage of ~1–2 weeks (needs citation).

### Gaps
- Spring leaf-out order and cherry-blossom timing (JMA sakura front) not fetched.
- No numeric "days spread among individuals of one species" from a primary source.
- Oak marcescence and beech leaf retention need a source.

---

## Q4. Procedural tree shapes

### Takeaway
For pixel art, full L-systems / space colonization are overkill at runtime but excellent **offline sprite generators**:
generate a few dozen variants per species at bake time into an atlas. Bare winter trees = recursive branch drawing;
canopies = blob/cluster stamping; conifers = stacked tiers.

### Cited findings
- **Space colonization (Runions, Lane, Prusinkiewicz 2007)** [C] https://www.algorithmicbotany.org/papers/colonization.egwnp2007.pdf
  - Crown envelope seeded with N attraction points ("usually hundreds or thousands"; figure uses 12000/1500/375).
  - Each point influences only its **nearest** node within radius of influence `di`; new node at distance `D` along the
    normalized sum of normalized vectors to its points (+ optional tropism vector g). Points removed within kill distance `dk`.
  - Values: `di = 8D` for trees, `17D` or ∞ for shrubs; `dk = 2D` (dense) to `20D` (sparse). Smaller di ⇒ gnarlier.
  - Seconds–minutes per 3D tree on a 3 GHz desktop (depends mainly on D). 2D, ~200 points, at bake time is trivial [I].
- **Pixel tree generator (4b3c, itch.io)** [C] https://4b3c.itch.io/procedural-pixel-art-tree-generator/devlog/773435/my-pixel-art-tree-generator
  - Nodes in a parent/child tree; each node a circle connected to parent by a line; angle per node; **line width from number of
    descendants** (trunk thick); every node starts with leaves but loses them as it gains children ⇒ leaves at the tips. Growth
    step either adds children or lengthens branches.
- Other generators found (not fetched; check later): Gentree — procedural tree generator extension for Aseprite
  https://devkidd.itch.io/gentree ; Godot Asset Library "Procedural Pixel Art Tree" https://godotengine.org/asset-library/asset/5021 ;
  Rust crate `pixeltree` https://docs.rs/crate/pixeltree/0.2.1 ; Tree Factory https://heosphorus.itch.io/tree-factory .

### Proposed recipes [I]
```
# Bare winter tree (recursive), draw into 32x48 px buffer
branch(p, angle, len, width, depth):
  q = p + dir(angle)*len
  line(p, q, width)                      # Bresenham, width by depth
  if depth == 0: return
  n = 2 + (rand()<0.3)
  for i in 0..n-1:
    a = angle + lerp(-spread, spread, i/(n-1)) + randn()*jitter
    branch(q, a, len*0.7, max(1,width-1), depth-1)
# depth 4–5, spread 25–40°, len0 ≈ 10 px for a 32×48 sprite

# Blob canopy (deciduous): stamp 5–9 circles (r 5–9 px) on branch tips; shade each with light from top-left:
#   pixel shade = clusterShade(dot(normalFromCircle, L)) quantised to 3–4 palette rows; dark outline only on lower-right
# Conifer: tiers k=0..T-1, width w_k = w0*(1 - k/T), each tier a downward-pointing triangle offset up by h/T; snow = top 1–2 px of each tier
# Palm: trunk = quadratic Bézier with lean; 6–9 fronds = parabolic arcs from crown, droop ∝ age
```

### Gaps
- L-system specifics (Prusinkiewicz & Lindenmayer "Algorithmic Beauty of Plants") not fetched.
- No confirmed commercial game (Noita, Dead Cells, Caves of Qud) using procedural tree *sprites* — not researched in budget.

---

## Q5. Wind

### Takeaway
Use **world-position phase** so neighbouring trees are out of sync, plus a **travelling gust wave** `sin(k·(x·dir) − ωt)` so a
visible "wave" rolls over the canopy; scale displacement by height (base fixed) and by per-species stiffness. Replace `sin`
with a smoothed triangle wave for cheapness (Crysis).

### Cited findings
- **GPU Gems 3 ch.16, Crysis vegetation** [C] https://developer.nvidia.com/gpugems/GPUGems3/gpugems3_ch16.html
  - Main bending: displacement scaled by normalized height, `bf = (height*bendScale + 1)^2`, then renormalize length to limit stretching;
    "too much bending will ruin the illusion."
  - Detail bending: object phase `dot(worldPos,1)` so instances desync; branch phase + vertex phase; 4 vectorized waves.
  - `TriangleWave(x)=abs(frac(x+0.5)*2-1)`; `SmoothCurve(x)=x*x*(3-2x)` — abs/frac/mul only, cheaper than sin.
  - Vertex colours: R edge stiffness, G per-leaf phase, B overall stiffness, A AO. Wind vector per instance summed from sources.
- Also relevant: GPU Gems 3 ch.6 "GPU-Generated Procedural Wind Animations for Trees" https://developer.nvidia.com/gpugems/GPUGems3/gpugems3_ch06.html (not fetched).

### Proposed 2D shader (Godot canvas_item, GLES3/Compatibility) [I]
```glsl
uniform vec2 wind_dir = vec2(1.0, 0.2);   uniform float wind_strength = 1.0;
uniform float gust_wavelength = 24.0;     // in tiles
uniform float gust_speed = 3.0;           // tiles/s
uniform float stiffness = 1.0;            // per species: spruce 1.6, birch 0.6, oak 1.2
// in vertex(): world position from MODEL_MATRIX; h = 1 - UV.y (0 at trunk base)
float s  = dot(world.xy/16.0, normalize(wind_dir));
float gust = 0.5 + 0.5*smooth_tri(s/gust_wavelength - TIME*gust_speed/gust_wavelength);  // travelling wave
float idle = smooth_tri(TIME*0.4 + hash(world.xy));                                       // desync
float off  = wind_strength * (0.3*idle + gust*gust) * h*h / stiffness;
VERTEX.x += round(off * 2.0);   // snap to whole pixels to keep pixel-art crisp (or quantize to 1 px steps)
```
- Gust timing: drive `wind_strength` by a 1-D noise over time (e.g. 0.3 base + gusts every 4–10 s) and fire leaf/bird
  events on peaks. Grass/bushes use same field ⇒ waves visibly cross meadow → forest.
- Per-pixel "shear" (offset ∝ height) on a 2-quad sprite needs vertices; for one quad use UV offset in fragment with
  `h*h` falloff (cost: 1 extra texture fetch-free math, negligible) [I].

### Gaps
- Godot-specific 2D sway shaders with measured costs not collected here (covered by performance researcher?).

---

## Q6. Dappled light / sunflecks

### Takeaway
Sunflecks are **pinhole images of the sun**: round regardless of gap shape, diameter ≈ height/100, ellipses at low sun.
In top-down pixel art: a canopy shadow layer with sparse round holes (circles of 2–6 px), stretched along the sun azimuth,
slowly drifting with the wind phase. Overlapping holes form blobs.

### Cited findings
- **NSTA "Unnoticed sunballs all around us"** [C] https://www.nsta.org/science-teacher/science-teacher-mayjune-2022/unnoticed-sunballs-all-around-us
  - Sun's diameter ≈ 1/100 of Earth–Sun distance ⇒ sunball width ≈ **1/100 of height of the opening**: ~10 m-high gaps ⇒ ~10 cm spots.
  - Opening shape doesn't matter if small relative to distance (crossed fingers ⇒ round images).
  - "When the Sun is low in the sky, the circles are stretched into ellipses." Overlaps ⇒ irregular larger blobs.
  - Partial eclipse ⇒ crescents; annular ⇒ rings (fun easter egg).

### Proposed cheap fake [I]
```
# Precompute per-tree shadow sprite (same silhouette as canopy, offset by sun vector, 50% darken via palette row shift)
# Sunflecks: in shadow sprite, punch K holes (K ≈ 3–8 per tree), radius 1–3 px, squashed to ellipse along sun azimuth:
#   ellipse aspect = 1/sin(sunElevation)  (geometry of a circular beam hitting flat ground)
# Animate: hole centres += wind_offset(world, t) * 0.5  (holes shimmer with canopy sway)
# Character in shade: sample shadow mask at feet → shift character palette row −1 (reuse snow/rain palette lighting)
```
- Shadow direction/length from time of day: offset = (cos az, sin az) * treeHeight / tan(elev), clamp for readability [I].

### Gaps
- No game example found specifically for sunflecks in 2D pixel art (search budget exhausted).

---

## Sources
- Bridson 2007 — https://www.cs.ubc.ca/~rbridson/docs/bridson-siggraph07-poissondisk.pdf
- Red Blob Games, Making maps with noise — https://www.redblobgames.com/maps/terrain-from-noise/
- Red Blob Games, Polygon map generation — https://www.redblobgames.com/maps/polygon-map-generation/
- Minecraft Wiki mirror, World generation — https://wiki.ronlab.site/content/minecraftwiki_en_all_maxi_2025-11/World_Generation
- Minecraft Wiki mirror, Placed feature — https://wiki.ronlab.site/content/minecraftwiki_en_all_maxi_2025-11/Placed_feature
- OptiFine colormaps docs — https://optifine.readthedocs.io/colormaps.html (breezewiki Color page blocked by Anubis)
- TerraFirmaCraft trees docs — https://terrafirmacraft.github.io/Documentation/1.18.x/worldgen/features/trees
- Terraria Wiki, Trees — https://terraria.wiki.gg/wiki/Trees
- Crowther et al. 2015 Nature — https://cdanfort.w3.uvm.edu/csc-reading-group/crowther-nature-2015.pdf
- Sankaran et al. 2005 (USGS record) — https://www.usgs.gov/publications/determinants-woody-cover-african-savannas
- BOREAS canopy report (ORNL DAAC) — https://data.ornldaac.earthdata.nasa.gov/public/boreas/TE/te6bmflg/comp/te13_boreas_canopy.pdf
- Penn State Extension, autumn leaf color — https://extension.psu.edu/the-science-behind-autumn-leaf-color
- USDA Forest Service fall colors 2018 — https://www.fs.usda.gov/fallcolors/2018/science.shtml
- UNH Extension, Tamarack — https://extension.unh.edu/blog/2022/10/autumn-gold-tamarack
- Alabama Extension, Hopkins' law — https://www.aces.edu/blog/topics/forestry/estimating-alabama-bloom-times-using-hopkins-bioclimatic-law/
- Lilac senescence individuals — https://www.pubmed.gov/31034022/
- Our Winter World, plants & snow — https://ourwinterworld.org/snow-and-living-things/plants/
- Runions et al. 2007 space colonization — https://www.algorithmicbotany.org/papers/colonization.egwnp2007.pdf
- 4b3c pixel tree generator devlog — https://4b3c.itch.io/procedural-pixel-art-tree-generator/devlog/773435/my-pixel-art-tree-generator
- GPU Gems 3 ch.16 (Crysis vegetation) — https://developer.nvidia.com/gpugems/GPUGems3/gpugems3_ch16.html
- NSTA sunballs — https://www.nsta.org/science-teacher/science-teacher-mayjune-2022/unnoticed-sunballs-all-around-us
- Found, not fetched: Gentree https://devkidd.itch.io/gentree ; Godot asset 5021 https://godotengine.org/asset-library/asset/5021 ;
  pixeltree crate https://docs.rs/crate/pixeltree/0.2.1 ; GPU Gems 3 ch.6 https://developer.nvidia.com/gpugems/GPUGems3/gpugems3_ch06.html
