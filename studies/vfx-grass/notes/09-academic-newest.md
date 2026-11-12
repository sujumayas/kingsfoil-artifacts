# 09. Academic, rare and newest work on grass, wind and small life

Researcher 09. Date 2026-11-11. Angle is papers (what the math means for a 320x180 pixel game) plus Godot 4.4 to 4.7 and 2025-26 releases.

Status tags used below: SHIPPED (in a released product or engine), RESEARCH (paper or prototype only), TOOL (third-party asset).

---

## Q1. What does the best 3D grass research reduce to for a 2D pixel game?

### Takeaway
Jahrmann & Wimmer 2017 is the most useful paper, and not for its rendering. Its per-blade state model (tip offset, a crush value that decays linearly, a recovery spring that is weakened while crushed) ports almost line for line to a per-tuft or per-tile state in 2D. Habel 2007 gives the wind half. It shears the texture lookup with two scrolling noise maps, one slow and strong for gusts and one fast and weak for flutter. That is exactly a canvas_item shader. Pelzer 2004 adds the rule that each object should take its wind phase from its own centre, not per vertex, so the texture never distorts. In pixel art that means one integer offset per tuft.

### Cited findings
- Jahrmann & Wimmer 2017 (RESEARCH, open demo at https://github.com/klejah/ResponsiveGrassDemo). Each blade is a quadratic Bezier (v0 root, v1 middle, v2 tip). Forces move only the tip, then three validation steps fix the rest. https://www.cg.tuwien.ac.at/research/publications/2017/JAHRMANN-2017-RRTG/JAHRMANN-2017-RRTG-draft.pdf
  - Tip update per frame is delta = (r + g + w) * dt + d, where d is collision displacement and is not scaled by dt. This makes the response frame-rate independent (same PDF, eq. 1).
  - Crush strength fades linearly as eta = max(eta - a*dt, 0), with a user-set decrease a (eq. 2). Each collision adds the squared length of the push to eta.
  - Recovery is a Hooke spring toward the rest tip, r = (rest - tip) * s * max(1 - eta, 0.1) (eq. 3). So a crushed blade still recovers at 10% strength. It never locks flat.
  - Wind effect is w = wind(v0) * theta. theta multiplies two factors. One is directional alignment, 1 - |dot(wind_dir, blade_dir)|. The other is the height ratio, how upright the blade is (eq. 7, 8). Flattened blades catch less wind.
  - State validation keeps the tip above ground and keeps v1 at least 0.05 of height above the root, so a blade always has some curve (eq. 11).
  - Culling. Orientation test culls blades whose width is nearly parallel to view, threshold 0.9 > |dot| (Section 5.3). Distance culling drops 1 of n blades per distance band using the blade index, so nearby blades must have nearby indices.
  - Measured on a GTX 780M, 1024x768, 8x MSAA. Nature scene has 397,881 blades. With all features on it runs 123 fps, 8.13 ms per frame, 43,128 blades drawn, 125,205 culled. Physics takes 0.547 ms, visibility 1.401 ms, rendering 2.057 ms. Culling off drops it to 78 fps, 12.82 ms (Table 1). Helicopter scene 56 fps with culling, 35 fps without (Table 2).
  - The paper cites Fan et al. 2015 for blade vs sphere collisions with wind as a separate analytic function, and Chen & Johan 2010 for wave-based collisions (same PDF, related work).
- Habel, Wimmer, Jeschke 2007 "Instant Animated Grass" (RESEARCH). Wind is a horizontal offset of the texture lookup, read from a noise map that scrolls each frame. The billboard bottom stays fixed. A low-frequency, high-amplitude noise gives gusts and a high-frequency, low-amplitude noise gives turbulence. Measured 140 fps at 1024x768 on a GeForce 7900 GT. https://www.cg.tuwien.ac.at/research/publications/2007/Habel_2007_IAG/Habel_2007_IAG-Preprint.pdf
- Pelzer 2004, GPU Gems ch. 7 (SHIPPED technique, used widely in 2000s games). Grass objects are 3 crossed quads. Only top vertices move, picked by v <= 0.1. Three wind modes. Per cluster costs a draw call per cluster and looks synchronised. Per vertex fits in few draw calls but distorts textures and looks uniform. Per object reads the object centre from a spare attribute, keeps the texture intact and still uses few draw calls. The page gives no ms numbers. https://developer.nvidia.com/gpugems/gpugems/part-i-natural-effects/chapter-7-rendering-countless-blades-waving-grass
- Boulanger, Pattanaik, Bouatouch 2009, IEEE CG&A 29(1) 32-41 (RESEARCH). Mixes real geometry near the camera with lit volume slices further out, plus a density scheme for arbitrary patch shapes. I could not reach its fps tables. https://dblp.dagstuhl.de/rec/journals/cga/BoulangerPB09.html , thesis https://stars.library.ucf.edu/etd/3508

### Inferences for Kingsfoil (estimates, not measured)
- A 2D port of the Jahrmann state needs 2 bytes per tuft or per 8x8 cell (signed tip offset x, crush eta). Recovery time after one step is predictable, about eta0 / a seconds of weak recovery and then the normal spring. With eta0 = 1 and a = 0.25/s a trampled patch stays mostly flat for about 4 s, then springs back in under 1 s. Those are tuning guesses to test in the demo.
- The max(1 - eta, 0.1) floor is a good art rule. Crushed grass should twitch a little in wind, never freeze.
- The theta term gives a cheap visual win for 2D. Multiply the shader sway by (1 - crush) so trampled tufts sway less. One multiply per pixel.
- Habel's two-noise shear maps to a canvas_item vertex or fragment shader with UV.y as the bend weight. For pixel art the offset must be floored to whole texels (see Forest D1). Two texture reads per pixel. On a 320x180 target that is about 115k reads per layer, trivial even on mobile WebGL2.
- The paper's numbers say nothing directly about WebGL2 Compatibility. They do show the shape of the cost. Culling roughly halved frame time. In 2D the equivalent is "do not draw tufts off screen" and Godot's canvas culling already does this per CanvasItem, not per MultiMesh instance (a MultiMesh is culled as one rect).

### Gaps
- Fan et al. 2015 full text not read. Boulanger fps not found. Jahrmann paper never measured mobile or web.

---

## Q2. Wind as composable primitives (Perbet & Cani 2001)

### Takeaway
Perbet & Cani drive a whole prairie with a few procedural wind primitives. These are a breeze, a gust, a whirlwind and the blast from a flying object. This is the right shape for an MMO. The server sends a handful of primitive records, every client evaluates them locally, and no wind field ever goes over the network.

### Cited findings
- "Animating Prairies in Real-Time", I3D 2001, Chapel Hill, pp. 103-110 (RESEARCH). User-controllable wind effects animate the field. https://hal.archives-ouvertes.fr/inria-00537502 (HAL page blocked by bot check during this session).
- The project summary lists primitives for a slight breeze, gust, whirlwind and a blast from a flying object. Grass uses three levels of detail (3D geometry, 2.5D volumetric textures, and a far representation). https://sed.inrialpes.fr/ARCHIVE/PRV/PUBLIC/PRAIRIE/plaquette_pub.html
- Jahrmann 2017 Fig. 4 shows the same split into two analytic wind functions, a directional wave and a point source. https://www.cg.tuwien.ac.at/research/publications/2017/JAHRMANN-2017-RRTG/JAHRMANN-2017-RRTG-draft.pdf

### Inferences
- Server record for one primitive (estimate). Type 1 byte, position 2x int16, radius 1 byte, direction 1 byte, strength 1 byte, start tick 4 bytes. About 12 bytes. A screen with a global breeze plus 2 gusts plus 1 whirlwind is under 50 bytes, sent only when one starts. Clients compute w(x, t) analytically in the shader as a uniform array. Fog's wind field (#8) can read the same uniforms.
- A whirlwind in pixel art reads best as a ring of tufts leaning tangentially plus leaves and dust orbiting. A rotating offset direction per tuft is one extra sin/cos.
- Gusts read as a travelling band. Forest D2 already covers this. The new idea is a spell or a dragon's wingbeat as a "blast" primitive that pushes grass outward from a point. That is cheap and very readable.

### Gaps
- Exact Perbet & Cani formulas unverified. The PDF on core.ac.uk was not read.

---

## Q3. Desire paths that form over days (Helbing 1997 active walker model)

### Takeaway
Helbing's trail model is one grid equation. Each cell has a "ground comfort" G that relaxes back to natural ground at rate 1/T and is pushed up by every footstep, with saturation. It is cheap enough to run on an MMO server per field tile at 1 Hz or slower. Walker steering toward trails is not needed, because real players are the walkers.

### Cited findings
- Helbing, Schweitzer, Keltsch, Molnar, "Active Walker Model for the Formation of Human and Animal Trail Systems", Phys. Rev. E 56, 2527-2539 (1997) (RESEARCH). Summary via search, arXiv cond-mat/9806097.
- Eq. 1 from Helbing, Keltsch, Molnar (arXiv cond-mat/9805158). dG/dt = (1/T)(G0 - G) + I (1 - G/Gmax) * sum of footsteps. The first term is vegetation regrowth at weathering rate 1/T. The second is trampling, saturating at Gmax. https://ar5iv.labs.arxiv.org/html/cond-mat/9805158
- Trail attractiveness is a distance-weighted average of G with decay length sigma (visibility). Walkers average the direction to their goal with the gradient of attractiveness (Eq. 2, 3, same source).
- One dimensionless number, kappa = I*T/sigma^2, controls the result. Small kappa gives direct paths. Large kappa gives a minimal network. Real values stop in between, at a compromise with an accepted detour. Rarely used trails weather away (same source).
- Footprints decay exponentially at rate 1/T, where T is the durability of markings. https://arxiv.org/pdf/cond-mat/9805074

### Inferences for an MMO
- Store G as uint8 per 32x32 tile, or per 8x8 sub-cell for smoother paths (16 bytes per tile). Server-only state, sent as a tile appearance level 0-3 only when it crosses a threshold. A path that changes visible state once per hour costs about nothing on the wire.
- Discrete update per tick per tile: G += (G0 - G) / T_ticks, then for each step G += I * (1 - G/Gmax). With T at 3 days of game time and I set so about 200 crossings saturate a tile, a path appears after a busy evening and fades over a week of disuse. These are design guesses, not from the paper.
- Use G for both art (grass to worn grass to dirt via the existing autotile) and gameplay (tiny speed bonus). Helbing's model then closes the loop for NPCs. NPC pathing can add a cost discount on worn tiles, so NPCs reinforce player paths.
- Per-species T (durability) is the ecological knob from Q4.

### Gaps
- No numeric kappa or lambda values in the paper text I read. PRE 1997 full text not opened.

---

## Q4. How fast does trampled vegetation really recover? (Cole 1995)

### Takeaway
Real ecology says plant form decides how much a field resists trampling, and bud position decides how fast it comes back. Low, flexible, grass-like plants resist best. Tall erect forbs flatten quickly. 500 passes can strip a forest understory almost completely. For a game this justifies per-species resistance and regrowth numbers instead of one global timer.

### Cited findings
- Cole 1995, J. Applied Ecology 32. Part I pp. 203-214 and Part II pp. 215-224. 18 vegetation types in five mountain regions. Lanes trampled 0, 25, 75, 200 and 500 passes. Measured 2 weeks and 1 year after (RESEARCH, field ecology). https://research.fs.usda.gov/treesearch/23582
- Resistance depends mainly on stature, erectness and growth form (graminoid, forb, shrub). Resilience depends mainly on whether plants are chamaephytes, with buds above ground (Part II abstract via search results). https://scilit.com/publications/6d0dc51e96f5b5001a85bc5e9af5eda5
- Cover after trampling vs number of passes fits a second-order polynomial for most types (Part I, same search).
- A related 1994 Wind River study found 500 passes caused nearly 100% vegetation loss in some forest understory plots. https://digitalcommons.usu.edu/envs_facpub/970

### Inferences
- Map the curve to game state. Cover = 1 - a*n + b*n^2 clamped, with n = passes since last regrowth tick. Two parameters per species. A meadow grass might keep 70% cover at 75 passes, a fern patch 20%. These numbers are illustrative.
- In Helbing terms, resistance sets I (how much one step wears) and resilience sets T (how fast it returns).
- Short-term bend (seconds, client only, Q1) and long-term wear (days, server, Q3) are different systems. Ecology backs that split, since Cole measured 2-week and 1-year responses separately.

### Gaps
- The actual 500-pass and 1-year cover figures from Cole's tables were not retrieved.

---

## Q5. Plant distribution and regrowth from ecosystem simulation (Deussen 1998)

### Takeaway
Deussen's ecosystem step is a circle-competition rule. Plants are circles. When two overlap, the weaker one dies. Run a few hundred steps at map bake time and the flower and tuft scatter gets natural clumps, gaps and wet/dry zoning, with no runtime cost.

### Cited findings
- Deussen, Hanrahan, Lintermann, Mech, Pharr, Prusinkiewicz, SIGGRAPH 1998, pp. 275-286 (RESEARCH, used offline). https://pharr.org/matt/assets/ecosys.pdf
- Self-thinning. Random circles with random radii. If two intersect, the smaller dies. Plants that reach a size limit die of age. The average area vs density curve has slope 1, matching the known -3/2 self-thinning law (Section 4 of the PDF).
- Multi-species version. Each species has new plants per step, max size, growth rate, probability of surviving domination, and wet/dry preference. Each plant has vigor in 0..1 from local water. Competitive ability = vigor * size/maxsize. Wet-loving and dry-loving species separate on their own (same section, Fig. 6).
- Snapshots shown at steps 99, 134 and 164. At 164 steps 441 plants remain (Fig. 4, Section 7).

### Inferences
- Use it in the map editor, not at runtime. A 256x256 tile field with 3 species at 1 circle per tile runs in well under a second in GDScript (estimate).
- It also gives a regrowth rule after burning or cutting. Reseed small circles each server tick and let the rule thin them. The same few lines then produce both initial scatter and recovery.
- Cellular automata regrowth (Minecraft random ticks) is the cheaper runtime alternative. Deussen is better for placement, random ticks for live regrowth.

---

## Q6. Insect flight and firefly blinking that look alive

### Takeaway
Pure random wander reads as noise. Biology says insects fly a correlated random walk with momentum and occasional long hops (heavy-tailed step lengths), not true Levy jumps. Fireflies have a precise, cheap rhythm. Photinus carolinus flashes every ~0.5 s inside bursts that repeat every ~12 s, and a simple pulse-coupled rule makes a group sync up over time.

### Cited findings
- Lenz, Chechkin, Klages 2013 (PLoS ONE) model bumblebee search flights with a Langevin-type generalised correlated random walk. Short time steps show momentum persistence. https://pmc.ncbi.nlm.nih.gov/articles/PMC3592844
- Real bumblebee data deviates from Levy flight due to perception, memory, daylight and predators. https://physics.aps.org/articles/v5/s31
- Mirollo & Strogatz 1990, SIAM J. Appl. Math. 50, 1645-1662. Identical pulse-coupled oscillators synchronise, and fireflies interact only at the moment one flashes. https://www.ams.org/publicoutreach/feature-column/fc-2018-08
- Sarfati et al. (Science Advances 2021). Synchronous flashes every ~0.5 s (0.55 s) during bursts of ~10 s, repeated every ~12 s. Single flash 100-150 ms (a preprint says 10-15 ms, a discrepancy). https://pmc.ncbi.nlm.nih.gov/articles/PMC8262802
- A lone male flashes with no rhythm. About 20 together start regular synced bursts. https://www.colorado.edu/today/synchronous-fireflies

### Inferences
- Butterfly or bee steering (estimate). velocity += random_unit * 40 px/s^2 * dt, velocity *= 0.9 per frame, clamp speed. Every 2-6 s, with 15% chance, pick a long hop target 40-120 px away. That gives the correlated walk plus heavy tail. Snap the drawn position to whole pixels. Reynolds steering (seek flower, flee player) layers on top.
- Fireflies at 320x180. One 1x1 or 2x2 pixel per firefly, alpha from a phase counter. Each firefly phase += dt / 0.55 s. When any firefly within 48 px flashes, nudge others' phase forward by 0.05 (Mirollo-Strogatz). Start desynced. Over 20-40 s of night the swarm locks in, which players will notice and screenshot. Cost is O(n^2) for n under 30, or use one shared "flash happened" flag per screen region.
- Burst structure (10 s on, 2 s dark) gives the readable "Morse" pattern for free.

---

## Q7. Godot 4.4 to 4.7 features that matter for grass and particles

### Takeaway
Two features change what is practical on web. 4.4 gave canvas_item shaders per-instance uniforms. 4.7 (June 2026) added DrawableTexture2D, which is a real API for a trail or interaction map, with a GLES3 path. GPU particles on web still have first-use stalls, so CPUParticles2D stays the safe default for small life.

### Cited findings
- 4.4 (SHIPPED). Per-instance uniforms in canvas_item shaders, earlier only spatial. Docs PR https://github.com/godotengine/godot-docs/pull/10737 . The engine PR number it cites (#96922) points to an unrelated GridMap PR when opened (https://github.com/godotengine/godot/pull/96922), so the engine PR is unverified. Pre-4.4 instance uniforms rejected samplers, scalars and vectors only (https://forum.godotengine.org/t/cannot-use-per-instance-for-uniform-sampler2d/86647). 4.0 docs gave a practical max of 16 per shader (https://godotengine.org/article/godot-40-gets-global-and-instance-shader-uniforms).
- 4.4 docs list INSTANCE_ID and INSTANCE_CUSTOM in canvas_item shaders, the MultiMesh route to per-tuft phase and species. https://docs.godotengine.org/en/4.4/tutorials/shaders/shader_reference/canvas_item_shader.html
- 4.5 (SHIPPED, 4.5.2 builds dated 19 March 2026). WebAssembly SIMD for web exports, smoother "without any changes". TileMapLayer merges cell collision shapes. Dedicated 2D navigation server. https://godotengine.org/releases/4.5/
- 4.6 (SHIPPED, 27 January 2026). MultiMeshInstance2D gets physics interpolation (4.6 dev 2). Scene tiles rotate in 90-degree steps. https://godotengine.org/article/dev-snapshot-godot-4-6-dev-2/ , https://www.cgchannel.com/?p=173665 , https://godotengine.org/releases/4.6/
- 4.7 (SHIPPED, about 19 June 2026 per press). DrawableTexture2D replaces Viewport hacks for drawing into textures. 2D Scene Paint Mode scatters scenes off-grid. AtlasTexture regions can tile in TextureRect, reducing texture switches on low-end. https://godotengine.org/releases/4.7/ , https://app.cinevva.com/news/2026-06-19-godot-4-7-released
- DrawableTexture2D API. setup(w, h, format, color, mipmaps), blit_rect(rect, source, modulate, mipmap, material), blit_rect_multi writes to up to 3 extra targets. Formats RGBA8, RGBA8_SRGB, RGBAH (16F), RGBAF (32F). Blit methods marked Experimental. https://docs.godotengine.org/en/4.7/classes/class_drawabletexture2d.html
- The merged PR #105701 (ColinSORourke) adds a GLES3 tex_blit shader in the Compatibility rasterizer as well as the RD path. BlitMaterial has blend modes mix, add, subtract, multiply. Seen via commit mirror, not GitHub. https://remotebranch.eu/Stowage/godot/commit/fd6e80d4e97ccd4ab4146db018df91c20e07ab4e.diff
- Particles on web. Godot docs say to use CPUParticles for Compatibility and web. https://docs.godotengine.org/en/4.4/tutorials/2d/particle_systems_2d.html . A 4.6 forum post reports cached GPU particles still stall on first fire in web Compatibility builds. https://forum.godotengine.org/t/gpuparticles-not-cached-after-first-run-in-web-build-shader-cache-is-enabled/137991

### Inferences
- Trail map on 4.7. A 64x64 RGBA8 DrawableTexture2D covering the visible area plus margin (16 KB). Each frame, blit a small soft brush per walker with BlitMaterial "add" into R (crush). Once per 100 ms, blit the texture onto itself with "subtract" a small constant (linear decay, matching Jahrmann eq. 2). The grass shader samples it. Before 4.7 this needed a SubViewport, which costs a full extra render pass. Verify the Compatibility path on Safari and low Android before relying on it, since the API is still Experimental.
- Fallback for 4.4 to 4.6 (and safest). Keep crush per tuft on the CPU and pass it via MultiMesh custom data (INSTANCE_CUSTOM). With a few hundred visible tufts that is a few KB uploaded per frame.
- Per-instance uniforms on separate Sprite2D tufts break batching less than unique materials did, but a MultiMesh is still fewer draw calls. Not measured here.

### Gaps
- No measured ms cost for DrawableTexture2D on WebGL2 anywhere I found. No official 4.5 release date found in this session.

---

## Q8. Newest shipped games and tools (2025-26)

### Takeaway
Minecraft's "Spring to Life" drop is the most instructive recent shipped example. It added ambient life as blocks that emit particles under light and time rules, plus rustle sound on walk-through. That is the client-side cosmetic pattern Kingsfoil wants. I did not find a 2025-26 top-down pixel game with documented, praised grass tech.

### Cited findings
- Minecraft "Spring to Life" (Java 1.21.5), released 25 March 2025 (SHIPPED). Added firefly bush, leaf litter, bushes, dry grass, wildflowers and others, seven new plants. https://pcgamer.com/games/survival-crafting/minecraft-spring-to-life-update , https://shockbyte.com/blog/minecraft-spring-to-life-update
- Firefly bush emits particles when the light level at it is 13 or lower, even when covered. It buzzes at night between ticks 12600 and 23400 if nothing collidable is above it. Snapshot 25w05a changed particles from colour shifts to opacity shifts. 1.21.6 made them more numerous and constant. https://wiki.ronlab.site/content/minecraftwiki_en_all_maxi_2025-11/Firefly
- Leaf litter makes a rustling sound when walked through. https://shockbyte.com/blog/minecraft-spring-to-life-update
- Jomoho Games "Dynamic 2D Grass system for Godot 4.x", devlog 24 March 2026 (TOOL). Pixel-art grass for Godot 4.5+ with wind, character displacement, destruction via effector decals and world-space clouds. No renderer or ms data on the page. https://jomoho.itch.io/dynamic-2d-grass/devlog
- Defold forum suggestion. Render wind once into a separate pass that grass samples, then pixelate as a separate pass, rather than waving each sprite independently. https://forum.defold.com/t/2d-pixelated-grass-waving-shader/56501/36
- Tiny Glade released 23 September 2024 (from my own knowledge, not verified in this session). That is outside the 18-month window.

### Inferences
- Copy Minecraft's rule shape. A firefly emitter is a tile property with conditions (light <= threshold, night ticks, biome). The particle choice (alpha pulse, not colour change) matches pixel taste. Opacity flicker on a fixed palette colour stays on-palette.
- Leaf litter rustle equals Forest E4. Nothing new except that Mojang made it a per-block footstep sound, which is the cheapest version.

### Gaps
- No 2025-26 indie top-down game with a grass devlog found. Unity and Unreal 2025-26 grass tech not researched (it targets compute-capable GPUs and does not transfer to WebGL2).

---

## Viability summary for a low-end web game

| Idea | Status | Web viability | Why |
|---|---|---|---|
| Jahrmann crush/recovery state per tuft | RESEARCH | High | 2 bytes per tuft, CPU or MultiMesh custom data |
| Habel two-noise UV shear, floored to pixels | RESEARCH | High | 2 texture reads per pixel |
| Pelzer per-object phase | SHIPPED | High | phase from position, no extra cost |
| Perbet & Cani wind primitives from server | RESEARCH | High | about 12 bytes per primitive (estimate) |
| Helbing desire paths on server | RESEARCH | High | 1 byte per tile, slow tick |
| Cole per-species wear curves | RESEARCH (ecology) | High | 2 numbers per species |
| Deussen circle competition | RESEARCH | High, offline only | runs at bake time |
| Pulse-coupled firefly sync | RESEARCH | High | n under 30, 1 px each |
| DrawableTexture2D trail map | SHIPPED 4.7, Experimental | Medium | GLES3 path exists, no web measurements |
| GPUParticles2D for small life | SHIPPED | Low-medium | web first-fire stall reports |
| Per-blade 3D geometry (Jahrmann rendering) | RESEARCH | None | compute shaders, 400k blades |

---

## Sources
- https://www.cg.tuwien.ac.at/research/publications/2017/JAHRMANN-2017-RRTG/JAHRMANN-2017-RRTG-draft.pdf
- https://github.com/klejah/ResponsiveGrassDemo
- https://www.cg.tuwien.ac.at/research/publications/2007/Habel_2007_IAG/Habel_2007_IAG-Preprint.pdf
- https://developer.nvidia.com/gpugems/gpugems/part-i-natural-effects/chapter-7-rendering-countless-blades-waving-grass
- https://dblp.dagstuhl.de/rec/journals/cga/BoulangerPB09.html
- https://stars.library.ucf.edu/etd/3508
- https://hal.archives-ouvertes.fr/inria-00537502
- https://sed.inrialpes.fr/ARCHIVE/PRV/PUBLIC/PRAIRIE/plaquette_pub.html
- https://ar5iv.labs.arxiv.org/html/cond-mat/9805158
- https://arxiv.org/pdf/cond-mat/9805074
- https://research.fs.usda.gov/treesearch/23582
- https://scilit.com/publications/6d0dc51e96f5b5001a85bc5e9af5eda5
- https://digitalcommons.usu.edu/envs_facpub/970
- https://pharr.org/matt/assets/ecosys.pdf
- https://pmc.ncbi.nlm.nih.gov/articles/PMC3592844
- https://physics.aps.org/articles/v5/s31
- https://www.ams.org/publicoutreach/feature-column/fc-2018-08
- https://pmc.ncbi.nlm.nih.gov/articles/PMC8262802
- https://www.colorado.edu/today/synchronous-fireflies
- https://github.com/godotengine/godot-docs/pull/10737
- https://github.com/godotengine/godot/pull/96922
- https://forum.godotengine.org/t/cannot-use-per-instance-for-uniform-sampler2d/86647
- https://godotengine.org/article/godot-40-gets-global-and-instance-shader-uniforms
- https://docs.godotengine.org/en/4.4/tutorials/shaders/shader_reference/canvas_item_shader.html
- https://godotengine.org/releases/4.5/
- https://godotengine.org/releases/4.6/
- https://godotengine.org/article/dev-snapshot-godot-4-6-dev-2/
- https://www.cgchannel.com/?p=173665
- https://godotengine.org/releases/4.7/
- https://app.cinevva.com/news/2026-06-19-godot-4-7-released
- https://docs.godotengine.org/en/4.7/classes/class_drawabletexture2d.html
- https://remotebranch.eu/Stowage/godot/commit/fd6e80d4e97ccd4ab4146db018df91c20e07ab4e.diff
- https://docs.godotengine.org/en/4.4/tutorials/2d/particle_systems_2d.html
- https://forum.godotengine.org/t/gpuparticles-not-cached-after-first-run-in-web-build-shader-cache-is-enabled/137991
- https://pcgamer.com/games/survival-crafting/minecraft-spring-to-life-update
- https://shockbyte.com/blog/minecraft-spring-to-life-update
- https://wiki.ronlab.site/content/minecraftwiki_en_all_maxi_2025-11/Firefly
- https://jomoho.itch.io/dynamic-2d-grass/devlog
- https://forum.defold.com/t/2d-pixelated-grass-waving-shader/56501/36
