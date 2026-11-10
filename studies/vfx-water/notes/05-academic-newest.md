# 05. Academic papers and the newest developments (2025-2026)

Researcher angle: academic and rare publications, plus what shipped in the last ~18 months (to Nov 2026).
Target: Godot 4, Compatibility/WebGL2, 320x180 top-down pixel art, 32x32 tiles, many players on one sea.

Labels used below: [shipped] = in a released game or engine. [research] = paper or demo only. [inference] = my own reasoning, not from a source.

---

## Q1. Kelvin wakes. What angle should a pixel wake have, and when should it be narrower?

### Takeaway
Draw the wake as a V with arms at 19.5 degrees from the travel line (39 degrees full opening) for walkers, swimmers, ducks and slow rowboats. For fast boats, narrow the arms toward 10 degrees or less. A mostly speed-independent angle is the whole charm. One constant, no simulation.

### Cited findings
- Kelvin half-angle is arcsin(1/3) = 19.47 degrees, independent of speed. Full chevron is about 39 degrees. https://en.wikipedia.org/wiki/Kelvin_wake_pattern
- Why 1/3. In deep water the group velocity is half the phase velocity (from w^2 = gk), so each wave's energy travels half as far as its crest. The geometry then gives sin(theta) = 1/3. https://arxiv.org/pdf/1304.2653
- Inside the wake. Transverse waves at the centreline have wavelength lambda_g. The divergent waves on the arms have lambda = 2*lambda_g/3. The maximum angle comes from k = 3*k_g/2. https://arxiv.org/pdf/1304.2653
- Rabaud and Moisy (PRL 110, 214503, 2013) measured wakes in Google Earth airborne images. The angle stays at Kelvin's value below hull Froude number Fr = U/sqrt(gL) of about 0.5. Above it, the angle falls roughly as 1/Fr, "similar to the Mach cone." https://arxiv.org/abs/1304.2653 , https://data-ww3.ifremer.fr/BIB/Rabaud_Moisy_PRL2013.pdf
- Narrow wakes of 10 degrees or less appear in the high-Fr regime. Their explanation is that a hull cannot make waves longer than itself. https://arxiv.org/pdf/1304.2653 , https://www.nature.com/articles/nphys2687
- Rebuttal. Darmon, Benzaquen and Raphael (JFM 2014) argue the outer boundary stays at Kelvin's angle. What narrows as 1/Fr is the angle of maximum wave amplitude. https://gulliver.spip.espci.fr/sites/gulliver.spip.espci.fr/IMG/pdf/darmonbenzaquen2013.pdf , https://physicsworld.com/a/physicists-rethink-celebrated-kelvin-wake-pattern-for-ships/
- Ship lengths and speeds were estimated from photos, so the data has error bars. https://physicsworld.com/a/physicists-rethink-celebrated-kelvin-wake-pattern-for-ships/

### Inferences
- [inference] For a game both readings give the same drawing. The visible bright arms (the high-amplitude part) narrow at speed. Faint outer ripples can stay at 19.5 degrees or be dropped at 320x180.
- [inference] Worked numbers. A swimmer (U = 1 m/s, L = 0.5 m) has Fr = 1/sqrt(9.81*0.5) = 0.45, so it gets the Kelvin angle. A rowboat (2 m/s, 4 m) has Fr = 0.32, also Kelvin. A speedboat (15 m/s, 6 m) has Fr = 1.96. Scaling 1/Fr from 19.47 degrees at Fr 0.5 gives about 5 degrees. So for Asterion, every player-speed thing uses 19.5 degrees. Only a fast NPC ship or a sea-serpent dash would need a narrow V.
- [inference] Pixel recipe. At 320x180 a 19.5 degree arm rises 1 px for every ~2.8 px of travel (tan 19.47 = 0.354). A stair-step of 3,3,2 px repeating reads clean. Spawn ring/arc decals at the mover's position every N px of travel and let them age. The V emerges from the spawn spacing, with no grid needed (see Q2 for the particle version).
- [inference] Transverse waves (the bars across the wake) have wavelength lambda_g = 2*pi*U^2/g. At 1 m/s that is 0.64 m, under one 32 px tile if a tile is about 1 m. At pixel scale draw 1-2 transverse bars directly behind the mover and forget the rest.

### Gaps
- Did not find the exact closed-form high-Fr fit from the PRL. The ~5 degree speedboat number is my extrapolation.

---

## Q2. Wave particles (Yuksel, House, Keyser 2007). Useful for a 2D top-down sea?

### Takeaway
[research, with a strong game-shaped idea] Wave particles are the best academic match for "wakes and ripples at sea scale without a grid." Each particle is a moving bump on an expanding ring. Splat them into a small heightfield. Cost scales with the number of disturbances, not sea area. That suits an MMO sea where most water is idle.

### Cited findings
- Paper: "Wave Particles", ACM TOG 26(3), SIGGRAPH 2007, DOI 10.1145/1276377.1276501. The method is "simple, fast, and unconditionally stable." The GPU turns particles into a heightfield, then warps it horizontally for wave-induced flow. Objects take forces from waves and make new waves by moving. https://cemyuksel.com/research/waveparticles/ , https://history.siggraph.org/?p=115408
- Implementation sketch with two-way rigid-body coupling: SIGGRAPH 2007 Sketches, DOI 10.1145/1278780.1278797. https://history.siggraph.org/?p=142256
- Numbers on a GeForce 7900 GTX with a 2.13 GHz Core 2 Duo: one boat at 170 fps. 1,681 boats (295,856 faces) at 4.8 fps. 9,261 boxes at about 1 fps, where rigid-body physics is the bottleneck, not the waves. Authors claim "several hundreds of objects at real-time rates." https://cemyuksel.com/research/waveparticles/
- Silhouette Pyramid is their fast way to spawn particles from an object outline. https://cemyuksel.com/research/waveparticles/
- The project page names no shipped game. https://cemyuksel.com/research/waveparticles/

### Inferences
- [inference] What a particle stores, from my reading of the published method (page did not list fields): origin, position, direction, amplitude, dispersion angle (the arc it covers), birth time. When neighbours on one ring drift too far apart, a particle splits into three with one third amplitude. That keeps rings smooth as they grow. Amplitude shrinks with time.
- [inference] Top-down 2D port. CPU array of particles (a few hundred), each drawn as a 1-3 px dot or short arc with palette index by amplitude. No heightfield at all. This needs only canvas draw calls, which works in Compatibility and on web. Server need not know about them, since wakes are cosmetic and each client spawns them from replicated movement.
- [inference] Versus the Hugo Elias grid (#3 Rain). A grid costs W*H per tick even when calm. A 320x180 grid is 57,600 cells, cheap on desktop but steady drain on mobile. Wave particles cost zero when nobody moves.

### Gaps
- No public pixel-art game confirmed using wave particles. No mobile timing found.

---

## Q3. Heightfield wave equation (Hugo Elias). Why is it stable, and how fast do ripples travel?

### Takeaway
The classic Elias update, new = (N+S+E+W)/2 - old, then damp, is the explicit wave equation run exactly at its stability limit. That is why it never explodes with damping below 1, and why ripples travel about 0.7 cells per tick no matter what. To slow ripples you must run fewer ticks, not change a speed constant. Already covered in #3 Rain: https://kingsfoil-artifacts.netlify.app/vfx-rain-topdown-pixel

### Cited findings
- Muller, Ten Minute Physics "How to write a Water Simulator". Each column stores height h and velocity v. a = (c^2/s^2)(hN + hS + hE + hW - 4h). v += dt*a, then h += dt*v (semi-implicit Euler). Stability criterion: dt*c < s (s = column width). Reflecting boundary: replace an outside neighbour with h itself. https://matthias-research.github.io/pages/tenMinutePhysics/20-heightFieldWater.pdf
- Same doc, object coupling. Keep a second field b = height covered by objects. Each step add alpha*(b - b_prev) to h, with 0 <= alpha <= 1. This conserves volume. Smooth b "to prevent spikes." Buoyancy force per overlapped column is rho*o*s^2*g. https://matthias-research.github.io/pages/tenMinutePhysics/20-heightFieldWater.pdf
- Pros/cons listed there: simple, fast, no overturning waves, no splashes. https://matthias-research.github.io/pages/tenMinutePhysics/20-heightFieldWater.pdf
- Muller's "Real Time Fluids in Games" slides state height fields are conditionally stable with dt < h/c. https://cs277.stanford.edu/resources/papers/Muller2008.pdf
- Elias-style damping in the wild: 0.99 in a p5.js port, 0.9 in another. https://editor.p5js.org/tetsuakibaba/sketches/StXi7E6tY , https://codepen.io/ds604/pen/VxroVN
- Naive shallow-water discretisation "explodes into weird zebra patterns". Fixing it with blur kills the motion. https://www.cs.uaf.edu/2013/spring/cs493/lecture/03_26_waves.html
- The original Elias page is archived at https://web.archive.org/web/20160418004149/http://freespace.virgin.net/hugo.elias/graphics/x_water.htm (archive.org was blocked from my fetch tool, so I cite it via the ports that link it). https://maciejmatyka.blogspot.com/2018/03/2d-water-algorithm.html

### Inferences
- [inference, my derivation] Leapfrog wave equation: h_new = 2h - h_old + r^2 (N+S+E+W - 4h), with r = c*dt/dx. Put r^2 = 1/2 and the 2h and -4h*r^2 terms cancel, leaving (N+S+E+W)/2 - h_old. That is Elias. The 2D five-point CFL limit is r <= 1/sqrt(2). So Elias runs at exactly r = 0.707. Ripple speed is 0.707 cells per tick.
- [inference] Numbers for tuning. At 30 ticks/s on a 1 px grid, rings grow at about 21 px/s. On a quarter-res grid (80x45 for a 320x180 screen, 3,600 cells) each cell is 4 px, so rings grow at about 85 px/s. That is too fast for a calm lake. Run the sim at 10-15 Hz instead, or use the Muller form with r < 0.707 for a slower, still-stable wave.
- [inference] Damping as a shift. Elias uses h -= h >> n for integer buffers. n = 5 gives 0.969 per tick, n = 4 gives 0.9375. Both stay stable because the scheme is marginal, not unstable.
- [inference] For Compatibility/web: a ping-pong between two SubViewports with a canvas_item shader works without compute. Or run it on the CPU at quarter-res (3,600 cells is trivial in GDScript at 15 Hz) and upload a small ImageTexture.

### Gaps
- Could not fetch Elias's original page text. Did not find a published mobile timing.

---

## Q4. Wave packets (Jeschke and Wojtan 2017) and the boundary-aware follow-up. Shorelines?

### Takeaway
[research] Wave packets are the academic answer to "waves that bend around islands and reflect off coasts." Too heavy to copy directly for a web pixel game. But the core ideas (a packet is a short wave train with a direction, so it can refract and reflect off a distance-to-shore field) map onto tile water.

### Cited findings
- "Water Wave Packets", Jeschke and Wojtan, ACM TOG 36(4), SIGGRAPH 2017, DOI 10.1145/3072959.3073678. Each Lagrangian packet carries a whole group of wave trains, not a single crest. Unconditionally stable. Real time "for moderately challenging scenarios." Includes a wake theory. https://visualcomputing.ist.ac.at/publications/2017/WWP , https://research-explorer.ista.ac.at/record/470
- Artists like it because wave height in a region can be edited by editing packets there. https://ista.ac.at/en/news/making-waves/
- Source code on GitHub (jeschke/water-wave-packets). Viewer is Windows plus DirectX. https://awesome.ecosyste.ms/projects/github.com%2Fjeschke%2Fwater-wave-packets
- "Making Procedural Water Waves Boundary-aware", Jeschke, Hafner, Chentanez, Macklin, Muller-Fischer, Wojtan. CGF 39(8) pp. 47-54, SCA 2020, DOI 10.1111/cgf.14100. Procedural waves respect terrain boundaries. A particle system adds breaking, foam and spray at beaches and rocks. Interactive on a normal PC. https://diglib.eg.org/handle/10.1111/cgf14100 , https://visualcomputing.ist.ac.at/publications/2020/MPWWBa
- "Wave Curves" (Skrivan, Soderstrom, Johansson, Sprenger, Museth, Wojtan, TOG 2020) attaches packets to spline curves on deforming surfaces. It is a film post-process (Weta), not a game tool. https://research-explorer.ista.ac.at/record/8535

### Inferences
- [inference] Cheap shoreline run-up borrowed from this line of work. Compute a distance-to-shore field d per pixel (BFS over tiles, then bilinear). Wave lines are contours of fract(d/lambda - t/T). Near shore, shrink lambda as d -> 0 (shallow water slows waves, so crests bunch up), and fade the line in a band of 0..1 tiles. This is the "waves travel from the open water to the beach" look that the 2026 Pixel Water shader also produces (Q8). Typical starting numbers: lambda = 12-16 px, T = 3-5 s, foam band 3-6 px.
- [inference] Run-up and retreat. Offset the wet-sand edge by A*max(0, sin(2*pi*t/T)) with A = 2-4 px, and leave a darker wet band that fades over ~1 s after retreat. That reproduces the swash look with one sine and one timer.

### Gaps
- Did not read the full text of the 2020 paper (no free PDF found). No mobile numbers.

---

## Q5. Tessendorf FFT and Gerstner waves. Only as contrast.

### Takeaway
Skip FFT for this project. It needs a big texture and per-frame FFT, and it targets 3D realism. Gerstner waves are cheap but their value is the sharp-crest shape, which top-down pixel art cannot show. Use the Gerstner horizontal displacement only as a UV wobble.

### Cited findings
- Sea of Thieves' ocean is an FFT implementation after Tessendorf 2001. https://history.siggraph.org/wp-content/uploads/2022/09/2018-Talks-Ang_The-Technical-Art-of-Sea-of-Thieves.pdf
- GPU Gems ch.1 (Mark Finch, Cyan Worlds). Sum-of-sines water from pond to ocean. Gerstner waves form "sharper peaks and broader troughs" for rough seas. Directional waves for wind-driven seas, circular waves for small pools. Cites Isidoro 2002 (four sines in a vertex shader) and Laeuchli 2002 (three Gerstner waves). https://developer.nvidia.com/gpugems/gpugems/part-i-natural-effects/chapter-1-effective-water-simulation-physical-models

### Inferences
- [inference] Top-down use. Sum 2-3 directional sines of different wavelength to drive palette index (dark trough, light crest). Circular sines centred on a point are a cheap "something surfaced here" ring for creatures.
- [inference] Q (steepness) definition not confirmed from the fetch. Do not quote its formula.

### Gaps
- Did not fetch the Gerstner equation section.

---

## Q6. Procedural caustics. Cheapest recipe?

### Takeaway
Use a pre-baked, tiling 64x64 or 128x128 caustic texture scrolled in two directions and combined with min() or multiply, then posterised to 2-3 palette steps. The procedural Shadertoy-style caustic (iterated sin/cos warp) is fine on desktop but wastes ALU on mobile web for a pattern you can bake.

### Cited findings
- Godot shader port of Shadertoy MdlXz8 exposes an iteration count uniform (the iterated trig-warp caustic). https://godotshaders.com/?p=4502
- Another port of Shadertoy MclXDB uses "primitive" caustics. https://godotshaders.com/shader/water-with-primitive-caustics/
- A Shadertoy Moana water scene read a procedural caustic by world xz and accepted visible tiling. https://wallisc.github.io/rendering/2020/12/08/Making-Of-Moana-the-shadertoy.html
- The 2025 "2D water for topdown games" shader builds caustic-like highlights from a loop of rotated, scaled sin/cos layers, thresholded with HIGHLIGHT_POW = 2.1. https://godotshaders.com/?p=11955
- Gamasutra "Inexpensive Underwater Caustics Using Cg" (older article). https://gamedeveloper.com/programming/inexpensive-underwater-caustics-using-cg

### Inferences
- [inference] Voronoi caustic. Bright lines are where distance-to-nearest minus distance-to-second-nearest is small. Bake it into a texture, do not compute per pixel.
- [inference] Caustics belong only in shallow bands (depth 1-2 tiles), since that is where you see the floor. Gate by the distance-to-shore field from Q4.

### Gaps
- Did not confirm the original Shadertoy authors or code. Did not find published caustic timings.

---

## Q7. Godot 4.4 to 4.7. What changed for 2D water in the Compatibility renderer?

### Takeaway
Nothing in 4.5-4.7 was built for 2D water. Two items help. The stencil buffer (4.5) can mask water regions. DrawableTexture2D (4.7) is a new way to paint into textures, which could hold ripple and wake buffers without SubViewport plumbing. Compatibility support for DrawableTexture2D is not confirmed.

### Cited findings
- Godot 4.5 (Sept 2025). Stencil buffer support. Shader Baker (up to 20x faster load on Metal/D3D12 in the TPS demo). TileMapLayer physics now "merge cell shapes into bigger collision shapes". Dedicated 2D navigation server. WebAssembly SIMD for web builds. SMAA 1x. https://godotengine.org/releases/4.5/
- Third-party coverage says the stencil buffer works in both Forward+ and Compatibility. The official page does not say. https://itsfoss.com/news/godot-4-5-release/ , https://digitalproduction.com/2025/09/17/godot-4-5-new-buffers-better-access-more-control/
- Godot 4.6 (Jan 2026). Rotatable scene tiles (GH-108010). Glow blended before tonemapping, Screen as default (GH-110671). Motion vectors in Compatibility (GH-97151), reported broken during beta 2. MultiMeshInstance2D physics interpolation (GH-107666). 2D batching rework to cut GPU cost on older devices (dev5). https://godotengine.org/releases/4.6/ , https://godotengine.org/article/dev-snapshot-godot-4-6-dev-2/ , https://godotengine.org/article/dev-snapshot-godot-4-6-beta-2/ , https://digitalproduction.com/2025/12/04/godot-4-6-dev5-lands-d3d12-default-delta-patching-android-gradle-2d-boosts
- Maintenance release 4.6.3 exists. https://godotengine.org/article/maintenance-release-godot-4-6-3/
- Godot 4.7 (June 2026). HDR output for 2D and 3D. Scene Paint Mode in 2D (B key), scatter without a grid. DrawableTexture2D. GradientTexture2D FILL_CONIC. AtlasTexture tiling in TextureRect. Nearest-neighbour scaling for 3D only. Breaking changes, read the migration guide. https://godotengine.org/releases/4.7/ , https://digitalproduction.com/2026/06/23/godot-4-7-turns-up-hdr/
- DrawableTexture2D: blit_rect(rect, source, modulate, mip, material) is marked experimental. Must call setup() first. Blit shaders have one function, blit(). blit_rect_multi() takes up to 4 inputs and outputs. https://docs.godotengine.org/en/4.7/classes/class_drawabletexture2d.html , https://docs.godotengine.org/en/4.7/tutorials/rendering/drawable_textures.html , https://docs.godotengine.org/en/4.7/tutorials/shaders/shader_reference/texture_blit_shader.html
- 4.7 notes say the Vulkan Mobile renderer "matches or even outperforms" Compatibility in some benchmarks. That does not help web, which stays on Compatibility. https://godotengine.org/releases/4.7/

### Inferences
- [inference] DrawableTexture2D plus a blit shader is a natural home for the Elias ping-pong (two textures, blit_rect_multi reads both). Test it on a web export before committing, since docs are silent on Compatibility.
- [inference] Scene Paint Mode is handy for scattering lily pads, rocks and reeds on ponds.
- [inference] Stencil masking is mostly a 3D feature. For 2D, a water-mask texture or clip_children on a CanvasGroup stays the safer path.

### Gaps
- No confirmation that DrawableTexture2D or stencil work in a web Compatibility export. Did not check Godot 4.8 dev snapshots.

---

## Q8. New pixel-art water shaders, tools and plugins (2025-2026)

### Takeaway
The most relevant new asset is "Pixel Water" by Francisco Cidade (Oct 2026). It is a CC0, texture-free canvas_item shader tested on 4.6 Compatibility, with foam, shallow band and waves that run to the beach. Good for study and comparison, but it draws its own procedural islands, so it does not plug into a tilemap as is.

### Cited findings
- Pixel Water, Godot Asset Store, v1.0.0, updated 2026-10-07, CC0. "Tested on Godot 4.6 (Compatibility renderer)." 24 uniforms including pixel_size, speed (loops/s), flow_angle, turbulence, crest_amount, foam_width, shallow_width, swell, cloud_shadow, sparkle_amount, presets Tropical, Lagoon, Swamp, Night. Waves "travel from the open water to the beach and fade out there". Publisher marks the version unstable. node modulate is ignored. https://store.godotengine.org/asset/fcidade/pixel-water-godot-shader/
- Browser demo with sliders and live code: https://fcidade.itch.io/pixel-water-godot-shader-free . Devlog: https://fcidade.itch.io/pixel-water-godot-shader-free/devlog/1689529/pixel-water-a-free-water-shader-for-godot
- "2D water for topdown games" by Sir-Shroom (godotshaders, July 2025). Hashed grid cells each emit a sine ring. The summed offset distorts screen sampling. Derivative-based fake normal for specular. Uniforms intensity 0, clarity 0.65, highlight_scale 1. Constants MAX_RADIUS 2, RIPPLE_FREQ 31, RIPPLE_STRENGTH 0.1. Commenter reports it works on 4.4. https://godotshaders.com/?p=11955
- Foam Edge Water Shader (antzGames), updated for Godot 4.5+, but 3D. https://godotshaders.com/shader/foam-edge-water-shader/
- Pixel Water 2D (estivalbloom). Foam where depth is under a threshold, then posterised. https://estivalbloom.itch.io/pixel-water
- 2D Water Reflections (Foxy Of Jungle, GameMaker), top-down and platformer, updated through Nov 2025. 5.0 from 9 ratings. https://foxyofjungle.itch.io/water-reflective
- 2D Water Waves and Splash Animations (Silas Games) devlog dated 2026-01-05. Hand-drawn sprite sheets. https://silasgamedev.itch.io/2d-water-waves-splash-animations-pixel-art/devlog/1307685/why-i-made-water-animations-2026-01-05

### Inferences
- [inference] The Sir-Shroom ring trick (one hashed ring per grid cell) is a cheap fake for rain or fish ripples on a lake. No state, pure function of time and cell. Works in multiplayer with no sync, since every client gets the same hash.

### Gaps
- Did not read the Pixel Water shader source, so its foam/shore method (SDF or noise threshold) is unknown.

---

## Q9. AI-generated water tilesets

### Takeaway
[shipped tools, static only] AI tools now produce water-to-land autotile sets (Wang 16, dual-grid 15, 3x3). None I found produce animated water frames. Generate the static shore set with AI, then animate with palette cycling or a shader on top.

### Cited findings
- PixelLab Create Tileset. Text or texture input. Exports Wang, dual-grid 15-tile and 3x3 sets. Wang output works in SpriteFusion. https://www.pixellab.ai/docs/tools/create-tileset
- Ludo.ai tileset generator lists shallow water and seabed as a sample. States commercial use is allowed (vendor claim). https://ludo.ai/tools/tileset-generator
- No evidence found of AI animated water tiles. Animated shoreline examples were hand-made (e.g. itch.io shoreline sets). https://desolatecorp.itch.io/shorelinebeachtileset

### Inferences
- [inference] Dual-grid 15-tile output pairs well with a shader that reads a distance-to-shore field. The tiles give the coast shape, the shader moves the foam.
- [inference] Palette-limited AI output needs a palette remap pass to match the study palette. Otherwise colour cycling will not work.

### Gaps
- Did not test PixelLab output for water. The pixellab skill in this environment could run that test.

---

## Q10. Notable 2025-2026 games praised for water

### Takeaway
I did not find a 2025-26 top-down pixel game singled out by critics for its water. The loudest 2025 water praise went to a 3D game (Sword of the Sea). The pixel examples are small or upcoming.

### Cited findings
- Sword of the Sea (Giant Squid, Aug 2025, 3D). Reviewers praise surfing across sand, water currents and snow. PC Gamer 78/100. Feel praise leans on haptics and sound as much as visuals. https://www.pcgamer.com/games/adventure/sword-of-the-sea-review , https://www.gamesradar.com/games/action/sword-of-the-sea-review , https://opencritic.com/game/19001/sword-of-the-sea
- ZWAARD (Beleef Studios), pixel 2D fighter. 80.lv (22 July 2025) highlights rippling water with "shade transitions and reflections." Side view, not top-down. No technique given. https://80.lv/articles/check-out-stunning-water-effects-in-this-upcoming-pixel-style-indie-game , https://store.steampowered.com/app/2251170/ZWAARD/
- Spilled! (2025, boat clean-up game) was a surprise indie hit, but the source says nothing about water rendering. https://professionalmoron.com/2025/04/27/spilled-indie-game/

### Inferences
- [inference] Sword of the Sea's lesson for us. Water "feel" in reviews came from motion and sound, not render tech. A splash sound and a 2-frame bob may beat a fancier shader.

### Gaps
- Big gap. A Steam-tag survey (pixel art + top-down + 2025/2026) was out of my call budget. Other researchers covering games should fill this.

---

## Q11. GDC 2025 and 2026 talks on stylized water

### Cited findings
- Search found no GDC 2025 or 2026 session on stylized water. Older relevant talks: Sea of Thieves (SIGGRAPH 2018), RiME (Unreal Fest Europe 2018), Far Cry 5 water (GDC). https://history.siggraph.org/?p=84316 , https://80.lv/articles/rime-breaking-down-the-stylized-water/

### Gaps
- Did not browse GDC Vault directly. Absence of results is not proof no talk exists.

---

## Q12. Sprite-based water in NPR / pixel art research, interactive water on mobile

### Gaps
- No academic paper found on pixel-art water specifically in this pass. Did not find mobile-specific interactive water papers. The closest mobile-friendly results are Muller's heightfield notes (Q3) and wave particles (Q2), neither benchmarked on phones.

---

## Shipped vs research summary

| Technique | Status | Fit for Asterion (web, 320x180) |
|---|---|---|
| Kelvin V at 19.5 deg | physics, shipped widely as decals | high, one constant |
| Wave particles | research (2007), no game named | high as CPU dots, zero cost when idle |
| Elias / heightfield | shipped widely, covered in #3 | medium, constant cost per cell |
| Wave packets | research, DirectX demo | low directly, ideas useful for shore |
| Boundary-aware procedural waves | research (SCA 2020) | low directly, inspires distance-field run-up |
| FFT ocean | shipped in 3D (Sea of Thieves) | none |
| Gerstner | shipped in 3D | low, use as UV wobble |
| Baked scrolling caustics | shipped widely | high in shallow bands |
| DrawableTexture2D | shipped in Godot 4.7, experimental | untested on web |
| Pixel Water shader | shipped asset (Oct 2026), CC0 | study reference |
| AI water tilesets | shipped tools, static only | medium, needs palette remap |

---

## Sources
- https://en.wikipedia.org/wiki/Kelvin_wake_pattern
- https://arxiv.org/abs/1304.2653
- https://arxiv.org/pdf/1304.2653
- https://data-ww3.ifremer.fr/BIB/Rabaud_Moisy_PRL2013.pdf
- https://www.nature.com/articles/nphys2687
- https://gulliver.spip.espci.fr/sites/gulliver.spip.espci.fr/IMG/pdf/darmonbenzaquen2013.pdf
- https://physicsworld.com/a/physicists-rethink-celebrated-kelvin-wake-pattern-for-ships/
- https://cemyuksel.com/research/waveparticles/
- https://history.siggraph.org/?p=115408
- https://history.siggraph.org/?p=142256
- https://matthias-research.github.io/pages/tenMinutePhysics/20-heightFieldWater.pdf
- https://cs277.stanford.edu/resources/papers/Muller2008.pdf
- https://editor.p5js.org/tetsuakibaba/sketches/StXi7E6tY
- https://codepen.io/ds604/pen/VxroVN
- https://www.cs.uaf.edu/2013/spring/cs493/lecture/03_26_waves.html
- https://maciejmatyka.blogspot.com/2018/03/2d-water-algorithm.html
- https://web.archive.org/web/20160418004149/http://freespace.virgin.net/hugo.elias/graphics/x_water.htm (blocked for my fetcher)
- https://visualcomputing.ist.ac.at/publications/2017/WWP
- https://research-explorer.ista.ac.at/record/470
- https://ista.ac.at/en/news/making-waves/
- https://awesome.ecosyste.ms/projects/github.com%2Fjeschke%2Fwater-wave-packets
- https://diglib.eg.org/handle/10.1111/cgf14100
- https://visualcomputing.ist.ac.at/publications/2020/MPWWBa
- https://research-explorer.ista.ac.at/record/8535
- https://history.siggraph.org/wp-content/uploads/2022/09/2018-Talks-Ang_The-Technical-Art-of-Sea-of-Thieves.pdf
- https://developer.nvidia.com/gpugems/gpugems/part-i-natural-effects/chapter-1-effective-water-simulation-physical-models
- https://godotshaders.com/?p=4502
- https://godotshaders.com/shader/water-with-primitive-caustics/
- https://wallisc.github.io/rendering/2020/12/08/Making-Of-Moana-the-shadertoy.html
- https://gamedeveloper.com/programming/inexpensive-underwater-caustics-using-cg
- https://godotengine.org/releases/4.5/
- https://itsfoss.com/news/godot-4-5-release/
- https://digitalproduction.com/2025/09/17/godot-4-5-new-buffers-better-access-more-control/
- https://godotengine.org/releases/4.6/
- https://godotengine.org/article/dev-snapshot-godot-4-6-dev-2/
- https://godotengine.org/article/dev-snapshot-godot-4-6-beta-2/
- https://digitalproduction.com/2025/12/04/godot-4-6-dev5-lands-d3d12-default-delta-patching-android-gradle-2d-boosts
- https://godotengine.org/article/maintenance-release-godot-4-6-3/
- https://godotengine.org/releases/4.7/
- https://digitalproduction.com/2026/06/23/godot-4-7-turns-up-hdr/
- https://docs.godotengine.org/en/4.7/classes/class_drawabletexture2d.html
- https://docs.godotengine.org/en/4.7/tutorials/rendering/drawable_textures.html
- https://docs.godotengine.org/en/4.7/tutorials/shaders/shader_reference/texture_blit_shader.html
- https://store.godotengine.org/asset/fcidade/pixel-water-godot-shader/
- https://fcidade.itch.io/pixel-water-godot-shader-free
- https://fcidade.itch.io/pixel-water-godot-shader-free/devlog/1689529/pixel-water-a-free-water-shader-for-godot
- https://godotshaders.com/?p=11955
- https://godotshaders.com/shader/foam-edge-water-shader/
- https://estivalbloom.itch.io/pixel-water
- https://foxyofjungle.itch.io/water-reflective
- https://silasgamedev.itch.io/2d-water-waves-splash-animations-pixel-art/devlog/1307685/why-i-made-water-animations-2026-01-05
- https://www.pixellab.ai/docs/tools/create-tileset
- https://ludo.ai/tools/tileset-generator
- https://desolatecorp.itch.io/shorelinebeachtileset
- https://www.pcgamer.com/games/adventure/sword-of-the-sea-review
- https://www.gamesradar.com/games/action/sword-of-the-sea-review
- https://opencritic.com/game/19001/sword-of-the-sea
- https://80.lv/articles/check-out-stunning-water-effects-in-this-upcoming-pixel-style-indie-game
- https://store.steampowered.com/app/2251170/ZWAARD/
- https://professionalmoron.com/2025/04/27/spilled-indie-game/
- https://history.siggraph.org/?p=84316
- https://80.lv/articles/rime-breaking-down-the-stylized-water/
