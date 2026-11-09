# Shared context for all FOREST researchers

## The user and project
- Indie game dev (Kingsfoil Studios). Godot 4 games, web-first (=> Compatibility/WebGL2 renderer), also mobile/desktop. Small team; must run WITHOUT a big computer.
- Target look: TOP-DOWN (3/4) pixel art (Tibia-like MMORPG "Asterion Online", top-down RPG). 2D tiles/sprites, low-res, palette-limited.
- Series "one concept per study" on simple, super-efficient, old-school VFX/rendering algorithms (reference: DOOM PSX fire). Previous studies (reuse/compare where useful):
  - #1 Snow https://kingsfoil-artifacts.netlify.app/vfx-snow-topdown-pixel (depth byte + dither threshold, exposure/shelter, palette lighting)
  - #2 Acid https://kingsfoil-artifacts.netlify.app/vfx-acid-topdown-pixel (material tables, stage colours, metaballs)
  - #3 Rain https://kingsfoil-artifacts.netlify.app/vfx-rain-topdown-pixel (wetness, puddles, ripples, drips, wind sway)
- THIS study #4: TREES, focused on FORESTS. SCOPE:
  - Forest types by tree-kind distribution and climate/weather (boreal/taiga, temperate deciduous, mixed, birch groves, rainforest/jungle, savanna/open woodland, dead/burnt…); biome selection (temperature × moisture), species distribution, clustering, density, undergrowth.
  - Tree colours & palettes, SEASONS (spring blossom, summer, autumn colour change per species & staggered timing, winter bare/snow), kinds of LEAVES (broadleaf, needles, palm fronds, blossoms), kinds of WOOD/bark (oak, birch white, pine reddish…), SIZES/age (sapling → ancient), shapes.
  - CHARACTER INTERACTION in top-down: passing by (collision at trunk, brushing bushes, rustle/sway), walking BEHIND trees (occlusion: canopy fade/dither, x-ray silhouette, cutaway circle, upper-layer tiles), standing in the SHADOW of a tree (shade darkening, dappled light/sunflecks), shaking/chopping trees.
  - BIRDS for artistic purposes (perched, flocks/boids, taking off when the player approaches, shadows, species by season/biome).
  - THE ROOTS of tree rendering in top-down pixel art: how artists construct trees (clusters, light direction, outlines, silhouettes, 3/4 perspective, tile-based canopies) and how classic games did it.
  - PERFORMANCE: many different trees on weak hardware: sprite atlases & reuse, palette swaps for seasons/variants, procedural composition, instancing (Godot MultiMesh/2D batching), y-sort cost, culling/spatial grids, chunking, shader wind sway, baked shadows, LOD, draw-call budgets; numbers.
- Goal: the MOST EFFICIENT and REALLY GOOD (artist/player validated) ideas that make the forest feel alive.
- Final output (written later): techniques profiled ("In plain words", "How it works (technical)", "Cost/performance", "Games that used it" (URL), "How it feels", "Risks") plus playable canvas demos. Collect concrete algorithms, pseudocode-level details, numbers, parameters.

## Rules for every researcher
- Cite a URL for every claim; include concrete numbers (sprite sizes, tile sizes, counts, frames, ms, draw calls, versions, dates).
- Separate cited findings from inferences; list gaps honestly. Flag vendor-reported figures.
- Never copy/download images. For every game example collect a "see it in action" reference URL (wiki page, article, devlog or video page).
- Quotes under 15 words.
- If a site is blocked, note it and try mirrors (archive.org, github README, author pages).
- Notes structure: per key question -> Takeaway / Cited findings / Inferences / Gaps. End with "Sources".
- Stop at about 25–35 tool calls. Save notes as markdown to the given path, then reply with a SHORT summary (<=200 words).
