# 05. Academic and rare publications, plus newest developments (2025-2026)

Researcher angle: theory behind cheap fog, noise costs, dithering, fog-of-war research, perception, and what changed in Godot and indie games in the last ~18 months. Date of research: 2026-11-10.

Note on access: iquilezles.org returned HTTP 404 for every article this session (`/articles/fog/`, `/articles/warp/`), checked with curl too. Formulas attributed to Quilez below come from search snippets plus my own memory of the article and are marked as such. Verify them before shipping.

---

## Q1. What is the theory behind "fog = mix(color, fogColor, 1 - exp(-density * distance))"?

### Takeaway
The cheap fog tint is Beer's law for a homogeneous medium. Transmittance T = exp(-sigma_t * d). The pixel keeps T of its own color and gets (1 - T) of the fog color, which is a crude stand-in for in-scattering. In a top-down 2D game "distance" has no physical meaning, so the useful input is a per-pixel fog thickness (height below a fog line, a density field value, or a noise value). The exp curve is still worth keeping because it never clips to a hard edge, but in a 320x180 palette game it gets quantized to 3 to 5 steps anyway, so a lookup table or a palette ramp is just as good.

### Cited findings
- Transmittance between two points is exp of minus the integral of sigma_t along the ray. In a homogeneous medium it "reduces to Beer's law", T = exp(-sigma_t d). https://pbr-book.org/3ed-2018/Volume_Scattering/Volume_Scattering_Processes
- sigma_t = sigma_a + sigma_s. Absorption plus out-scattering is "called attenuation or extinction". In-scattering adds radiance from other directions. Same source.
- Quilez "Better fog" starts from height density d(y) = a * exp(-b*y) and integrates it along the view ray analytically. Search snippet of the article says it adds "no more than one division" over constant fog. https://iquilezles.org/articles/fog/ (snippet via search, page 404 at fetch time)
- A MonoGame forum user reported the published height-fog snippet did not work in their port, so treat it as a starting point. https://community.monogame.net/t/solved-height-distance-based-fog-again/14371
- Flax Engine's exponential height fog clamps the falloff exponent to avoid overflow when the ray is near horizontal. https://git.flaxengine.com/Flax/FlaxEngine/src/commit/38cd840a66e1ec9b5fc310b54fff327a9217974d/Source/Shaders/ExponentialHeightFog.hlsl
- Demofox derives analytic fog density as G(B) - G(A) of the antiderivative of the density along the ray. https://blog.demofox.org/2014/06/22/analytic-fog-density/
- 2025 follow-up work exists. Matej Lou, "Analytic fog rendering with volumetric primitives" (2025-02-11), integrates closed-form fog for spheres and boxes. https://matejlou.blog/2025/02/11/analytic-fog-rendering-with-volumetric-primitives (seen in search results, not read)

### Formulas (from memory of the Quilez article, verify)
```
// constant fog
fogAmount = 1.0 - exp(-dist * b);
// separate extinction and in-scatter colors per channel
col = col * exp(-dist * be) + fogCol * (1.0 - exp(-dist * bi));
// sun-tinted fog: blend fogCol toward sun color by pow(max(dot(rd, sunDir),0), 8)
// height fog, density a*exp(-b*y), ray origin ro, direction rd
fogAmount = (a / b) * exp(-ro.y * b) * (1.0 - exp(-dist * rd.y * b)) / rd.y;
```

### Inferences for a 2D top-down game
- In 3/4 view, make "height" a per-tile value (terrain height map, 0 to N levels). Fog thickness at a pixel = max(0, fogLine - tileHeight). Apply T = exp(-k * thickness). This is the 2D version of exponential height fog: valleys fill, hills poke out. No ray, no division, no rd.y singularity.
- Per-channel extinction (be different from bi, or sigma_t per RGB) is how you get blue-shifted distant fog. In a palette game you get the same result by remapping through a "fog ramp" palette row instead. Previous studies (#1 snow, #2 acid) used palette select already.
- exp() costs one ALU op on GPUs. It is not the bottleneck. Texture fetches for the density field are.

### Gaps
- No measured ms for height fog in Godot Compatibility. The analytic formula is ALU-only, so cost is dominated by the fullscreen pass fill rate.

---

## Q2. Volumetric light scattering as a post process (Mitchell, GPU Gems 3 ch. 13). What are the knobs and the cost?

### Takeaway
God rays as a screen-space radial blur toward the light's screen position. Cost is NUM_SAMPLES texture fetches per pixel. At 320x180 with 32 to 64 samples it is cheap in pure fill terms, but on pixel art the result is smooth gradients that break the palette. Either quantize the output to the palette or use pre-drawn shafts. For top-down there is no sun on screen most of the time, so the radial origin is usually off-screen and the shafts read as parallel bands. That makes pre-drawn diagonal shaft sprites (or a scrolling stripe mask) more sensible.

### Cited findings (https://developer.nvidia.com/gpugems/gpugems3/part-ii-light-and-shadows/chapter-13-volumetric-light-scattering-post-process)
- Parameters are NUM_SAMPLES, Density (scales the step toward the light), Weight (per-sample contribution), Decay (0 to 1, attenuates each successive sample), Exposure (final scale).
- Shader: color += sample * illuminationDecay * Weight; illuminationDecay *= Decay; final *= Exposure.
- The chapter gives no fixed sample count. The demo needed Shader Model 3.0 because the sample count exceeded SM 2.0 limits.
- Occlusion pre-pass: render occluders black and untextured, run the radial blur, then draw the scene normally and add the blur result.
- Downsampling the source cuts bandwidth, bilinear is enough. Low sample counts show banding, which "stochastic sampling" (jittered start) can hide.
- Fade or clamp the light position when it goes off-screen or the view is near perpendicular to it.

### Inferences
- Estimate at 320x180 = 57,600 px. 64 samples = 3.7 M fetches per frame. At a half-res occlusion buffer (160x90) it is 0.9 M. That fits even a weak mobile GPU, but it is a whole extra pass plus a render target. On Compatibility that means a SubViewport.
- Jittered start offset per pixel, using a blue-noise texture, removes the stepping. On pixel art it adds noise that must then be quantized. Bayer-jittered steps look more "authored".
- For top-down canopy shafts, study #4 (forest sunflecks) is the better base. Radial blur is pretty-but-expensive relative to a stripe mask.

### Gaps
- No published ms figures for the original demo. No numbers for WebGL2.

---

## Q3. Noise cost: Perlin 1985/2002, simplex, Worley, curl noise, domain warping

### Takeaway
In 2D, classic Perlin and simplex cost about the same on GPUs. Simplex only wins in 3D and 4D. Animated fog needs either 3D noise (x, y, time) or 2D noise with scrolling offsets. Scrolling 2D is half the cost of 3D and looks fine for drifting banks. Domain warping multiplies the cost by 3 (one warp) or 5 (two-level warp) fbm evaluations. For a low-res pixel game the cheapest high-quality path is a pre-baked tileable noise texture (64x64 or 128x128) sampled 2 to 3 times with different scroll speeds, not live procedural noise.

### Cited findings
- McEwan, Sheets, Gustavson, Richardson 2012 "Efficient computational noise in GLSL": textureless, GLSL 1.20, runs on GLES 2.0 and WebGL 1.0. https://arxiv.org/abs/1204.1461
- Their Table 1, Msamples/s (measured, 2011-era GPUs). https://arxiv.org/pdf/1204.1461

| GPU | Const color | Simplex 2D | Simplex 3D | Simplex 4D | Classic 2D | Classic 3D | Classic 4D |
|---|---|---|---|---|---|---|---|
| GeForce 7600GS | 3,399 | 162 | 72 | 39 | 180 | 43 | 16 |
| GTX 260 | 8,438 | 1,487 | 784 | 426 | 1,477 | 589 | 255 |
| GTX 580 | 13,863 | 4,676 | 2,415 | 1,429 | 4,675 | 2,003 | 906 |

- Same paper: the older texture-lookup version was "roughly twice as fast" as pure computation, because GPUs are built for texture fetches. 4D classic noise needs 16 gradients, 48 texture lookups in the old version.
- Perlin 2002 "Improving Noise": the old 3t^2-2t^3 fade has second derivative 6-12t, nonzero at the ends, giving visible second-order discontinuities. Replaced by 6t^5-15t^4+10t^3. Gradients changed to 12 directions (cube edge midpoints) to remove axis-aligned bias, padded to 16 to avoid a modulo 12. https://mrl.cs.nyu.edu/~perlin/paper445.pdf
- Bridson, Hourihan, Nordenstam 2007 "Curl-noise for procedural fluid flow": in 2D, v = (dpsi/dy, -dpsi/dx) of a scalar noise psi. The field is divergence-free, so "no sources or sinks" and particles do not bunch in gutters. Near solid walls, multiply psi by a smooth ramp of distance, ramp(r) = 15/8 r - 10/8 r^3 + 3/8 r^5, with d0 = noise length scale L. Vortices have diameter about L. Octaves with a power-law falloff resemble Kolmogorov turbulence. https://www.cs.ubc.ca/~rbridson/docs/bridson-siggraph2007-curlnoise.pdf
- Worley 1996 "A cellular texture basis function" defines F1/F2 distance-to-nearest-feature-point noise. https://dl.acm.org/doi/10.1145/237170.237267
- Domain warping f(p + fbm(p)) and two-level f(p + fbm(p + fbm(p))) is Quilez's article. https://iquilezles.org/articles/warp/ (404 at fetch time, content from memory)

### Inferences and estimates
- Estimate. 320x180 = 57,600 px. A 4-octave 2D simplex fbm = 230,400 samples per frame. On a 7600GS-class GPU (162 Msamples/s) that is about 1.4 ms. On a GTX 260 class, 0.16 ms. Modern phone GPUs sit somewhere between. Two-level domain warp (5 fbm calls) moves the 7600GS figure to about 7 ms. That is the pretty-but-expensive line for low-end web.
- A 128x128 R8 noise texture is 16 KB. Two fetches per pixel with different scroll vectors plus a third fetch used as a small UV offset (one-level "fake warp") gets 80% of the domain-warp look for 3 fetches.
- Curl noise matters for particles (dust motes, fog wisps drawn as sprites) and for advecting a coarse fog density grid without it collapsing into clumps. Compute curl by finite differences on the noise texture: 4 fetches per sample. Study #6 (smoke advection) can reuse this directly.
- Worley F1 in 2D checks a 3x3 cell block, 9 hashes and 9 distances per sample (standard implementation detail, not from a fetched source). Good for "puffy cloud" shapes after inverting, but costlier than one value noise octave. Bake it.

### Gaps
- No modern mobile or WebGL2 noise benchmarks found. The McEwan numbers are from 2011-era desktop GPUs.

---

## Q4. Bayer vs blue-noise dithering for fog transparency, and temporal flicker on pixel art

### Takeaway
For pixel art fog, use a fixed ordered Bayer 4x4 or 8x8 pattern locked to world pixels (not screen pixels), and never animate the threshold per frame. Blue noise looks more natural and survives scaling and video compression better, but reads as grain, which can look like a rendering bug in clean pixel art. Temporal dithering (new pattern every frame) is the standard 3D trick for hiding noise, and it is exactly what causes shimmer on low-res pixel art. Obra Dinn is the best documented case of fighting this.

### Cited findings
- Ulichney's void-and-cluster (1993) builds a blue-noise threshold map by repeatedly placing points in the largest void of a Gaussian-blurred mask. Peters found sigma about 1.9 px works well. A 64x64 texture takes about 1 s to generate, 1024x1024 takes days. https://momentsingraphics.de/BlueNoise.html
- Peters' free blue noise textures. Sizes 16x16 to 1024x1024, tileable, 1 to 4 channels, 8-bit and 16-bit PNG, CC0. Advice: add noise before quantization in the quantization color space. Use a triangular distribution. For animation, pick a different 64x64 texture and random offset per frame. Same page.
- Screen-door transparency is the name for dithered transparency. Eurographics paper on spatio-temporal dithering. https://diglib.eg.org/bitstreams/1850ae15-9d38-4522-a389-e6cfe8e990ed/download
- NVIDIA patent filings on spatio-temporal blue noise say naive animated blue noise either breaks the spatial pattern or decays to white noise over time. Vendor claim. https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/11727621
- Return of the Obra Dinn (2018). Rendered in 8-bit gray then converted to 1-bit in post with an 8x8 Bayer matrix plus a 128x128 blue-noise field. Pope moved toward blue noise because it held up under scaling and video compression. Swimming was reduced by mapping the dither pattern to a sphere around the camera. Pope said he did not fully fix it. https://hackaday.com/2022/07/04/dithering-makes-everything-cooler-now-even-animated , https://setsideb.com/?p=5672 , https://www.alanzucconi.com/?p=10365 (secondary sources, primary is Pope's TIGSource devlog)
- Practitioner advice. Temporal stability comes from tying thresholds to world position or view direction, not screen coordinates. https://tufourn.pages.dev/blog/2025-03-28-obra-dinn-style-dithering
- Playdate dev. An 8x8 Bayer pattern "looks more noisy than flickery" on the device. Perceived flicker varies by display and eye motion. https://devforum.play.date/t/an-exploration-of-dithering-and-flashing/10272
- Meta tech note has shader snippets for cheap 2D dithering. https://developer.oculus.com/blog/tech-note-shader-snippets-for-efficient-2d-dithering

### Inferences
- In a top-down 2D game the camera only translates, so world-locked dither = screen dither shifted by the camera's integer pixel offset. If the camera snaps to whole pixels (it should, for pixel art), world-locked Bayer never swims. This is the main argument for Bayer in this project.
- Moving fog over a fixed dither grid is fine. The fog density changes, the threshold pattern stays put, so pixels flip on and off at the edge of the fog. That reads as "fog edge creeping", which is the look of 16-bit era fog.
- Bayer can be computed in the shader with no texture (bit tricks or a const array). Blue noise needs one texture fetch per pixel. At 320x180 both are free in practice.
- Blue noise is the right pick for fog that is upscaled with non-integer scaling (mobile odd resolutions), where Bayer's grid aliases into moire.

### Gaps
- No controlled perception study comparing Bayer vs blue noise for animated pixel-art transparency. Evidence is anecdotal.

---

## Q5. Fog-of-war research: visibility, perception, information hiding

### Takeaway
The strongest academic result for an MMO is security, not rendering. Any client that receives hidden state can lift the fog, and the attack cannot be detected. The fix is server-side filtering of what each client receives, which Asterion's server-authoritative tile model already supports (Tibia sends only the visible window). Perception studies specific to fog of war are thin. Design writing argues hidden information stops one strategy from dominating.

### Cited findings
- Bursztein, Hamburg, Lagarenne, Boneh, "OpenConflict: Preventing real time map hacks in online games", IEEE S&P 2011, pp. 506-520, Best Student Paper. Their tool Kartograph read game memory and lifted the fog in every RTS tested. It is passive and remotely undetectable. https://crypto.stanford.edu/~dabo/pubs/abstracts/onlinegames.html , https://www.ieee-security.org/TC/SP2011/PAPERS/2011/paper032.pdf
- OpenConflict evaluated on 1,000 StarCraft II expert replays. Peak cost 22 ms on one CPU core per state sync. Same sources.
- A gamedev.net thread notes that restricting data to clients does not fit lockstep simulation, since each client runs the full sim. Forum opinion. https://gamedev.net/forums/topic/624669-avoiding-cheating-in-a-multiplayer-html5-game/page-2?page=1
- Design. Hidden information keeps one strategy from dominating. Exploration reveals the map. https://www.gamedeveloper.com/design/the-more-you-know-making-decisions-interesting-in-games
- Tales of Fablecraft fog of war breakdown. Soft-edged squares drawn into a render texture, sampled at a higher mip level for blur, "only a single quad of overdraw". https://robinwouters.artstation.com/projects/a0Z2xq (403 at fetch, info from search snippet)
- Hypercoven devlog (Oct 2024, wgpu, also a WebGL/WASM build). Hex fog tiles accumulate intensity in alpha only, then a second pass draws black by inverse alpha. Per-hex fade = 1 - fade_x * fade_y. Author says instancing is required or it is "terribly slow". Planned improvement is one fullscreen shader reading a visibility grid. https://filmstars.itch.io/hypercoven/devlog/813874/making-fog-with-your-bare-hands

### Inferences
- For Asterion, the fog-of-war visual is a client-only effect on top of data the server already filtered. The server sends tiles and creatures inside the view window. The client draws "explored but not visible" tiles from memory, dimmed. This matches the roguelike memory model, and it means no maphack can reveal live creatures.
- The Hypercoven "future idea" is the cheapest approach for Compatibility. Upload a small visibility texture (one texel per tile, e.g. 32x24 for a view plus margin, R8, under 1 KB) and let one fullscreen shader bilinear-filter it, then threshold with Bayer for a dithered soft edge. One fetch for the mask, ALU for the dither.

### Gaps
- No CHI or FDG perception study on fog of war found in this pass. Battle Aces (Uncapped Games) reportedly spent 18 months and a dozen people on fog of war, but I could not find the dev blog, and the game was cancelled in May 2025. https://en.wikipedia.org/wiki/Battle_Aces

---

## Q6. Perception of atmospheric depth cues

### Takeaway
Lower contrast alone makes a region look farther away, even against a conflicting size cue. In a top-down game this means reducing contrast (not only shifting hue) is what sells fog depth, and lowering contrast of lower-height tiles under valley fog will read as "deeper".

### Cited findings
- O'Shea, Blackburn, Ono 1994, "Contrast as a depth cue", Vision Research. Observers judged the lower-contrast region as more distant, even when size pointed the other way. Contrast worked with no other depth cue. Monocular viewing gave larger apparent depth. https://researchportal.scu.edu.au/esploro/outputs/journalArticle/Contrast-as-a-depth-cue/991012820590902368
- Later critique. The 1994 study did not test contrast against occlusion. https://philarchive.org/archive/DREDPF
- Aerial perspective is several effects that grow with distance: less contrast, less detail, less chroma, lightness moving toward the background. https://eclecticlight.co/2024/02/16/a-to-z-of-landscapes-aerial-perspective/ , https://psychology.hanover.edu/Krantz/art/aerial.html

### Inferences
- Palette rule. A fog ramp should pull both value and saturation toward the fog color. A hue-only tint looks like a colored filter, not depth.
- Gameplay rule. Keep characters and interactables above the fog layer, or give them an outline, because the same contrast loss that sells depth also hides them.

---

## Q7. Newest Godot features relevant to 2D fog in Compatibility (4.4 to 4.7)

### Takeaway
Nothing new in Godot is a fog feature for 2D. The useful additions are CanvasItem per-instance uniforms (4.4, lets many fog sprites share one material with different density/offset) and DrawableTexture2D (4.7, a way to paint a fog or explored mask into a texture without a SubViewport). Stencil (4.5) is 3D spatial only. Shader baker (4.5) targets Metal and D3D12, so it does not help web.

### Cited findings
- Godot 4.4 (released 2025-03-03, my recollection of the date). Per-instance uniforms extended to 2D. The docs now say they are "available in both canvas_item (2D) and spatial (3D) shaders". Limit "16 instance uniforms per shader". No textures or arrays. On Compatibility (GLSL < 4.0) you cannot index a texture array with an instance uniform. https://docs.godotengine.org/en/stable/tutorials/shaders/shader_reference/shading_language.html . Docs PR merged 2025-04-05, feature PR #99230. https://github.com/godotengine/godot-docs/pull/10749
- Godot 4.5 (stable mid-September 2025; CG Channel article dated 2025-09-16). Added a stencil buffer and a shader baker. Shader baker gave "20x" load-time decrease on Metal and D3D12 in the TPS demo. Stencil example is 3D. https://godotengine.org/releases/4.5/ , https://www.cgchannel.com/?p=170196 . The 4.7 CanvasItem shader reference has no stencil mode. https://docs.godotengine.org/en/stable/tutorials/shaders/shader_reference/canvas_item_shader.html . A proposal thread said "I wouldn't support 2D for now". https://github.com/godotengine/godot-proposals/issues/3373
- Godot 4.6 released January 2026. Headlines are LibGodot, unique node IDs, the new editor theme. No fog-related 2D items. https://godotengine.org/releases/4.6/ , https://www.gamingonlinux.com/2026/01/the-free-and-open-source-godot-engine-4-6-is-out-now-with-major-upgrades
- Godot 4.7 stable reported 2026-06-19 (secondary source). 4.7.2 dated 2026-08-18. https://app.cinevva.com/news/2026-06-19-godot-4-7-released , https://gamedev.net/news/5172-godot-engine-472-stable-released/
- DrawableTexture2D (4.7). "A simple API layer that abstracts away all the technical noise" for drawing on textures, replacing Viewport or RenderingDevice workarounds. https://godotengine.org/releases/4.7/ . Methods setup(width, height, format, color, mipmaps), blit_rect(rect, source, modulate, mipmap, material) with a custom Texture_Blit ShaderMaterial, blit_rect_multi up to 4 sources and 3 extra targets. Formats RGBA8, RGBA8_SRGB, RGBAH, RGBAF. Methods marked Experimental. https://docs.godotengine.org/en/latest/classes/class_drawabletexture2d.html
- A Nov 2025 PR (#112481) optimizes canvas 2D rendering with vertex buffers. https://github.com/godotengine/godot/pull/112481 (seen in search, not read)
- 4.7 nearest-neighbor scaling option "does not affect 2D rendering". https://godotengine.org/releases/4.7/

### Inferences
- Explored-tiles memory for fog of war maps well to DrawableTexture2D. Blit a small white rect per newly revealed tile into an R8-ish mask, never clear it. The fog shader reads it. Study #5 already covered DrawableTexture2D for light maps, so reuse that code path.
- Per-instance uniforms let 50 drifting fog-bank sprites share one ShaderMaterial (one batch-friendly material) with per-sprite `density` and `scroll_offset`. Before 4.4 you needed one material per variation or the modulate color hack.

### Gaps
- Neither the 4.7 release page nor the class docs state DrawableTexture2D renderer support. Test on Compatibility and on Web before depending on it.
- Exact 4.5 and 4.7 release days come from news sites, not the official blog.

---

## Q8. New 2D fog and fog-of-war plugins (2025-2026)

### Cited findings
- Vision2D (peter-kish). Godot 4 plugin for 2D fields of vision, repo created 2025-09-05, in the asset store. https://store.godotengine.org/asset/peter-kish/vision2d/ , https://gh.r-mj.com/peter-kish/vision2d
- Visibility Polygon, Asset Library #5331. Dependency-free 2D isovist from line segments, listed as useful for fog of war. https://godotengine.org/asset-library/asset/5331
- Hex Strategy Map toolkit (dimcairion), Godot 4.6+, covers fog of war. v1.4.0 added a texture-based fog renderer. https://dimcairion.itch.io/hex-strategy-map-free
- Godot forum fog-of-war addon with Solid, Noise and Real styles. Date and license not confirmed. https://forum.godotengine.org/t/godot-fog-of-war/142855
- Godot Shaders "Animated 2D Fog (optional pixelation)". https://godotshaders.com/shader/procedural-2d-fog-with-pixelation/ . Fog-of-war tag index. https://godotshaders.com/shader-tag/fog-of-war/

### Gaps
- None of these publish performance numbers. None is tile-grid fog of war built for an MMO.

---

## Q9. 2025-2026 indie games praised for fog and atmosphere, and GDC talks

### Cited findings
- Look Outside (Sunrise Parabellum). Review dated 2025-08-17 praises a top-down pixel-art survival horror for its eerie, oppressive atmosphere. https://opencritic.com/sunrise-parabellum/review/18274/look-outside
- Deep Fog. 2D pixel horror in a city under perpetual fog. Small following, no major reviews found. https://playpile.gg/games/deep-fog
- Shrouded Path. Atmospheric grid-based pixel adventure, solo itch.io project. https://lokyo.itch.io/shrouded-path

### Gaps
- I found no GDC 2025 or GDC 2026 session on stylized 2D fog or fog of war. The closest older talk is Greg Kasavin's "Creating Atmosphere in Games" (Bastion), year not confirmed. https://gdcvault.com/play/1015335/contactUs
- I found no 2025-26 top-down pixel game whose fog technique is documented in a devlog. The well-documented techniques (Obra Dinn, Hypercoven) are 2018 and 2024.
- Search did not surface strong review quotes about fog specifically. Other researchers covering games should fill this.

---

## Shipped vs research-only
- Shipped in games: Beer-law distance fog (everywhere), radial-blur god rays (many 3D games since 2007), Bayer and blue-noise dithering (Obra Dinn), server-side fog of war filtering (Tibia's view window, MMOs in general), curl noise for particles (films and games).
- Research or vendor only: OpenConflict's distributed secure protocol (academic, not known in a shipped game), spatio-temporal blue noise (NVIDIA patents and papers), analytic fog primitives (2025 blog).
- Shipped in Godot: instance uniforms in 2D (4.4), stencil 3D-only (4.5), DrawableTexture2D (4.7, experimental methods, renderer support undocumented).

## Sources
- https://pbr-book.org/3ed-2018/Volume_Scattering/Volume_Scattering_Processes
- https://iquilezles.org/articles/fog/
- https://iquilezles.org/articles/warp/
- https://community.monogame.net/t/solved-height-distance-based-fog-again/14371
- https://git.flaxengine.com/Flax/FlaxEngine/src/commit/38cd840a66e1ec9b5fc310b54fff327a9217974d/Source/Shaders/ExponentialHeightFog.hlsl
- https://blog.demofox.org/2014/06/22/analytic-fog-density/
- https://matejlou.blog/2025/02/11/analytic-fog-rendering-with-volumetric-primitives
- https://developer.nvidia.com/gpugems/gpugems3/part-ii-light-and-shadows/chapter-13-volumetric-light-scattering-post-process
- https://arxiv.org/abs/1204.1461
- https://mrl.cs.nyu.edu/~perlin/paper445.pdf
- https://www.cs.ubc.ca/~rbridson/docs/bridson-siggraph2007-curlnoise.pdf
- https://dl.acm.org/doi/10.1145/237170.237267
- https://momentsingraphics.de/BlueNoise.html
- https://diglib.eg.org/bitstreams/1850ae15-9d38-4522-a389-e6cfe8e990ed/download
- https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/11727621
- https://hackaday.com/2022/07/04/dithering-makes-everything-cooler-now-even-animated
- https://setsideb.com/?p=5672
- https://www.alanzucconi.com/?p=10365
- https://tufourn.pages.dev/blog/2025-03-28-obra-dinn-style-dithering
- https://devforum.play.date/t/an-exploration-of-dithering-and-flashing/10272
- https://developer.oculus.com/blog/tech-note-shader-snippets-for-efficient-2d-dithering
- https://crypto.stanford.edu/~dabo/pubs/abstracts/onlinegames.html
- https://www.ieee-security.org/TC/SP2011/PAPERS/2011/paper032.pdf
- https://gamedev.net/forums/topic/624669-avoiding-cheating-in-a-multiplayer-html5-game/page-2?page=1
- https://www.gamedeveloper.com/design/the-more-you-know-making-decisions-interesting-in-games
- https://robinwouters.artstation.com/projects/a0Z2xq
- https://filmstars.itch.io/hypercoven/devlog/813874/making-fog-with-your-bare-hands
- https://en.wikipedia.org/wiki/Battle_Aces
- https://researchportal.scu.edu.au/esploro/outputs/journalArticle/Contrast-as-a-depth-cue/991012820590902368
- https://philarchive.org/archive/DREDPF
- https://eclecticlight.co/2024/02/16/a-to-z-of-landscapes-aerial-perspective/
- https://psychology.hanover.edu/Krantz/art/aerial.html
- https://docs.godotengine.org/en/stable/tutorials/shaders/shader_reference/shading_language.html
- https://docs.godotengine.org/en/stable/tutorials/shaders/shader_reference/canvas_item_shader.html
- https://github.com/godotengine/godot-docs/pull/10749
- https://godotengine.org/releases/4.5/
- https://www.cgchannel.com/?p=170196
- https://github.com/godotengine/godot-proposals/issues/3373
- https://godotengine.org/releases/4.6/
- https://www.gamingonlinux.com/2026/01/the-free-and-open-source-godot-engine-4-6-is-out-now-with-major-upgrades
- https://godotengine.org/releases/4.7/
- https://app.cinevva.com/news/2026-06-19-godot-4-7-released
- https://gamedev.net/news/5172-godot-engine-472-stable-released/
- https://docs.godotengine.org/en/latest/classes/class_drawabletexture2d.html
- https://github.com/godotengine/godot/pull/112481
- https://store.godotengine.org/asset/peter-kish/vision2d/
- https://godotengine.org/asset-library/asset/5331
- https://dimcairion.itch.io/hex-strategy-map-free
- https://forum.godotengine.org/t/godot-fog-of-war/142855
- https://godotshaders.com/shader/procedural-2d-fog-with-pixelation/
- https://opencritic.com/sunrise-parabellum/review/18274/look-outside
- https://playpile.gg/games/deep-fog
- https://lokyo.itch.io/shrouded-path
- https://gdcvault.com/play/1015335/contactUs
