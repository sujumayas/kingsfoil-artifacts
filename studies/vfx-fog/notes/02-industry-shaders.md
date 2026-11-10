# 02 Industry techniques for 2D fog, mist and atmosphere

Researcher angle: mainstream shader techniques and how shipped 2D games did it. About 30 tool calls.
Honest summary up front. Primary sources with hard numbers exist for the generic techniques (Quilez, GPU Gems 3, Gustavson noise paper, Godot docs). Primary sources on how specific shipped 2D games built their fog are rare. Most studios talk about art direction, not shaders. Where I found nothing first-party I say so.

---

## Q1. Scrolling tileable noise fog in 2-3 layers

### Takeaway
The standard cheap fog is a tileable grayscale noise texture sampled 2-3 times at different scales and scroll speeds, summed, then thresholded or remapped to a fog color. It costs one texture fetch per layer per pixel. For a 320x180 target that is 57,600 pixels x 3 fetches = about 173k fetches per frame, which is trivial even on weak mobile GPUs (estimate).

### Cited findings
- The common Godot "2D Fog Overlay" shader samples a noise `sampler2D` once per octave, default 4 octaves, each octave doubling frequency and halving amplitude. It scrolls with `TIME * starting_frequency * velocity`, default velocity `vec2(1.0, 1.0)`. https://godotshaders.com/shader/2d-fog-overlay/
- The same shader calls its fbm twice, using the first result to offset the UV of the second (a one-level domain warp). So default cost is 2 x 4 = 8 texture fetches per pixel. https://godotshaders.com/shader/2d-fog-overlay/
- A commenter on that page reports the noise "running out" when scrolling in Godot 4.0. The fix is declaring the sampler with `repeat_enable`. https://godotshaders.com/shader/2d-fog-overlay/
- Graveyard Keeper (Lazy Bear, Unity, top-down 3/4 pixel art) builds fog from many horizontal cloud sprites spread over the screen, not a shader. The sprites cover the upper part of objects more than the lower part, so roofs and treetops poke above the fog. https://www.gamedeveloper.com/programming/graveyard-keeper-how-the-graphics-effects-are-made
- A pixel-art background guide puts foreground fog layers at "100-120% of camera speed" and far layers slower. https://www.sprite-ai.art/blog/pixel-art-backgrounds (secondary, not a studio source)

### Inferences
- For top-down 3/4 view, Graveyard Keeper's approach (overlapping soft sprites, sorted with world objects) is the closest shipped analog to what Kingsfoil needs. It gives "fog at ground height" for free because sprites sort against trees and houses.
- 2-3 layers is enough. Use non-integer scale ratios (for example 1.0, 1.7, 2.9) and different directions so the tiling repeat does not line up. This mirrors Quilez's advice to detune octave frequencies (see Q3).
- Scroll speed in pixel games must be slow or quantised. At 320x180, a layer at 4 px/s moves one pixel every 15 frames at 60 fps. Sub-pixel scroll with linear filtering will smear. Snap the scroll offset to whole pixels (Q6).

### Gaps
- No studio gave a measured ms cost for a noise-overlay fog. No shipped game stated its fog texture size or scroll px/s.

---

## Q2. Domain warping (Inigo Quilez)

### Takeaway
Domain warping makes fog look like it curls and flows instead of sliding. It is expensive if done procedurally, because each warp level multiplies fbm calls. The full two-level Quilez pattern costs 5 fbm calls per pixel. With 4-octave noise that is 20 noise evaluations per pixel. One warp level (3 fbm calls) or a texture-based warp is the practical budget for web.

### Cited findings
- Quilez's base formula is `f(p) = fbm(p + fbm(p + fbm(p)))`. https://iquilezles.org/articles/warp/
- One warp level uses two 1D fbm calls to build a 2D offset, with offsets `(0.0,0.0)` and `(5.2,1.3)`, then `fbm(p + 4.0*q)`. That is 3 fbm calls. https://iquilezles.org/articles/warp/
- The two-level version adds `r` with offsets `(1.7,9.2)` and `(8.3,2.8)`, then `fbm(p + 4.0*r)`. That is 5 fbm calls. https://iquilezles.org/articles/warp/
- Quilez says the offset values "don't have any special meaning". They only decorrelate the calls. https://iquilezles.org/articles/warp/
- He colors the result by using the intermediate `q` and `r` values, not only the final scalar. That gives extra color variation at no extra noise cost. https://iquilezles.org/articles/warp/ (Shadertoy https://www.shadertoy.com/view/lsl3RH)

### Inferences
- Cheap warp for pixel fog. Store two decorrelated noise channels in the R and G of one texture, read once to get `q`, then read the fog texture at `uv + k*q`. That is 2 fetches total and gives most of the look. This is the same trick the Godot 2D Fog Overlay uses (Q1).
- Animating the warp offset slowly (time added to `q` only) makes the fog "breathe" while the base pattern drifts. That reads well at low resolution.
- Bake option. Render a looping warped fog sequence to a small texture atlas offline. Zero runtime noise cost, costs memory.

### Gaps
- Quilez gives no timings for the warp. Cost is inferred from call counts.

---

## Q3. fbm octave counts and their cost

### Takeaway
Cost scales linearly with octaves. G = 0.5 gain and a frequency ratio near 2 is the default everyone uses. At 320x180 the useful octave count is small. Each octave halves the feature size, so after about 4-5 octaves the detail is smaller than a game pixel and is wasted or aliases.

### Cited findings
- Quilez says "G=0.5 is what most people have hardcoded". G = 2^-H, with H in [0,1]. https://iquilezles.org/articles/fbm/
- He used 10 octaves of gradient noise for his spectral plots. https://iquilezles.org/articles/fbm/
- He suggests detuning the 2.0 lacunarity to values like 2.01 or 1.99, and in 2D rotating the domain between octaves, so peaks do not stack into visible patterns. https://iquilezles.org/articles/fbm/
- He notes the popular iterative fbm loop avoids "expensive pow() functions". https://iquilezles.org/articles/fbm/
- He notes sin-based fbm runs faster in hardware than hash or LUT noise, at the cost of repeating patterns. https://iquilezles.org/articles/fbm/

### Inferences
- Octave budget for a 320x180 fog layer whose base feature is about 64 px wide: octaves at 64, 32, 16, 8, 4 px. Octave 5 (4 px) is the last one worth paying for. Octave 6 (2 px) only adds noise that a palette or dither step will remove. So 3-4 octaves is the right range.
- Repeating patterns from sin-fbm are a feature for tileable fog, since we want it to tile anyway.

### Gaps
- No published per-octave ms number on WebGL2 or mobile.

---

## Q4. Noise texture lookup vs procedural noise in the shader

### Takeaway
For WebGL2 and mobile, sample a small tileable noise texture. The best measured data (Gustavson et al. 2012) shows texture-based 2D noise was about twice as fast as the ALU version on GPUs of that era. Anecdotal mobile reports agree. Procedural noise wins only when you need no tiling, huge range, or memory is tight.

### Cited findings
- McEwan, Sheets, Gustavson, Richardson (2012) wrote texture-free GLSL simplex and Perlin noise. They state the old texture-based version was "roughly twice as fast" despite heavy lookups. https://ar5iv.arxiv.org/html/1204.1461
- Their 2D simplex uses 6 dot products, 3 mod, 2 floor, 1 each of step, max, fract, abs, 17 multiplies and 19 adds. https://ar5iv.arxiv.org/html/1204.1461
- Throughput table (Msamples/s, new ALU version). GF7600GS first column 3,399, GTX580 13,863, HD3650 1,974, HD5870 18,061. The table has 7 numbers but 6 labeled noise columns, so column mapping is ambiguous. Treat as order-of-magnitude. https://ar5iv.arxiv.org/html/1204.1461
- Unity forum users report "a texture will always be cheaper" on mobile, with the caveat of size and compression. Anecdotal. https://discussions.unity.com/t/comparing-performance-of-textures-vs-procedural-shaders-on-mobile-gpu/662156
- A 2022 follow-up (Gustavson and McEwan, JCGT) gives tiling simplex and flow noise that is WebGL 1.0 compatible and MIT licensed. https://jcgt.org/published/0011/01/02/paper-lowres.pdf

### Inferences
- Rough cost model for a 320x180 fog pass with 3 layers. Texture version is 3 fetches + about 10 ALU ops per pixel. Procedural 2D simplex is about 50 ALU ops per noise call, so 3 layers x 4 octaves is about 600 ALU ops per pixel. Even 600 ALU ops x 57,600 px is about 35 M ops per frame, inside a low-end budget, but the same shader at 1080p native (2 M px) is 1.2 G ops per frame, which will hurt phones. Render fog at game resolution, never at native screen resolution. (Estimate.)
- A 128x128 or 256x256 single-channel noise texture is 16-64 KB uncompressed. Pack 4 decorrelated noises into RGBA to get 4 layers or a warp from one fetch.

### Gaps
- No measured WebGL2 or Godot Compatibility numbers. The 2012 table is old desktop hardware.

---

## Q5. Height-based fog in 2D and fog clearing masks

### Takeaway
Height fog in top-down 2D needs a height signal per pixel. Options are a per-tile height value baked into a low-res texture (one texel per tile), or per-sprite vertical position like Graveyard Keeper. Clearing fog around the player and lights is a mask texture subtracted from fog density. Both are cheap, one extra fetch each.

### Cited findings
- Graveyard Keeper simulates altitude by letting fog sprites cover the upper part of objects less than the lower part, so tall objects rise out of the fog. https://www.gamedeveloper.com/programming/graveyard-keeper-how-the-graphics-effects-are-made
- Graveyard Keeper also uses about 10 time-of-day LUTs stored as 2D textures to tint the whole scene. That is a cheap way to shift fog mood with time. https://www.gamedeveloper.com/programming/graveyard-keeper-how-the-graphics-effects-are-made
- Godot community thread on dark games shows a screen-reading light shader using BackBufferCopy plus a gradient texture, with z-index 2000. It claims "little performance impact" but gives no benchmark. https://forum.godotengine.org/t/working-around-godots-2d-light-limitations-for-a-dark-game/81311

### Inferences
- Tile height texture. For a 32x32 tile map, a map of 100x100 tiles becomes a 100x100 R8 texture (10 KB). Sample it with linear filtering in the fog shader and use `fog *= smoothstep(h_hi, h_lo, height)` so low tiles pool fog. One fetch.
- Clearing mask. Draw soft radial sprites (player, torches) into a small SubViewport, for example 80x45 (quarter of 320x180), in additive mode. In the fog shader, `fog *= 1.0 - mask`. One fetch. Low-res plus linear filter gives free soft edges. This reuses the low-res light map pattern from study #5.
- Displacement variant. Instead of only subtracting, push the fog UV away from the player using the mask gradient. That reads as fog "parting". One or two more fetches.
- For an MMO with shared weather, the mask is purely client-side. It needs no network bytes.

### Gaps
- No shipped top-down game documented a height-map fog with numbers. Don't Starve's fog of war appears to live in native code, per a Klei forum user, so no implementation details are public. https://forums.kleientertainment.com/forums/topic/47987-map-sharing-mod-feasibility/

---

## Q6. Pixel-art-safe fog

### Takeaway
Smooth alpha fog on top of pixel art looks like a filter over the game, not part of it. The pixel-safe recipe is to compute fog density at game resolution, snap UVs and scroll offsets to the pixel grid, then either quantise density to 2-4 steps and pick palette colors, or threshold density against a 4x4 Bayer matrix and draw solid fog pixels.

### Cited findings
- Donitzo's "Color Dither" Godot shader builds a pixel grid from UV and texture size and uses a 4x4 Bayer lookup. Its alpha path discards pixels whose alpha is below the Bayer value. https://godotshaders.com/shader/color-dither/
- A Godot forum answer states the core rule. A pixel shows if the gradient value is under the Bayer value, which is a `step()`. https://forum.godotengine.org/t/how-can-i-apply-a-dithering-effect-to-a-gradienttexture/143687
- godot-2d-dithering is based on Surma's Ditherpunk article and supports 2-color palettes. https://github.com/ensanmartin/godot-2d-dithering
- Study #6 (Fire and smoke) already used Bayer-dithered smoke. https://kingsfoil-artifacts.netlify.app/vfx-fire-topdown-pixel

### Inferences
- Snap rule. `uv = (floor(uv * res) + 0.5) / res`, and snap scroll offsets with `floor(offset)` in pixel units. This stops shimmering on sub-pixel scroll.
- Screen-space Bayer vs world-space Bayer. If the dither pattern is in screen space, it stays still while the fog moves. That looks like a "screen door". If it is in world space, it moves with the camera. For top-down camera scrolling, world-anchored dither avoids crawling.
- Palette fog. 3 density bands mapped to 3 palette colors (for example, a desaturated blue-gray ramp) plus Bayer between bands gives the snow and acid studies' look. It keeps the palette limit.

### Gaps
- No shipped-game postmortem I found quantifies the dither-vs-alpha tradeoff. Artist-side evidence is covered by other researchers.

---

## Q7. God rays and light shafts in 2D

### Takeaway
Two options. Screen-space radial blur (GPU Gems 3) gives true occlusion but needs many samples per pixel and a screen copy. Pre-drawn additive shaft sprites cost one fetch per covered pixel and look more like pixel art. For WebGL2 and a top-down view where the "sun" is off-screen, pre-drawn shafts are the right default.

### Cited findings
- GPU Gems 3 chapter 13 (Kenny Mitchell) does a post-process radial blur toward the light, with parameters decay, density, weight and exposure. It gives no default NUM_SAMPLES. https://developer.nvidia.com/gpugems/gpugems3/part-ii-light-and-shadows/chapter-13-volumetric-light-scattering-post-process
- The chapter says the sample count exceeded Shader Model 2.0 limits, so the demo needed SM 3.0. Same source.
- Mitigations listed there are downsampling the source, raising density to cut iterations, stochastic sampling, and fading when the light leaves the screen. Same source.
- Fabien Sanglard's OpenGL port uses `NUM_SAMPLES = 100`. He reports a factor 2 downscale "gives good results". No fps given. https://fabiensanglard.net/lightScattering/
- Known limitations from GPU Gems 3. Shafts flicker as occluders cross the screen edge. Near lights can draw background shafts over foreground objects. Same source.

### Inferences
- Cost at 320x180 with 100 samples is 5.76 M fetches per frame for the full screen. At 160x90 with 32 samples plus jitter it drops to 0.46 M. That is affordable, but you also pay a BackBufferCopy (Q9). (Estimate.)
- Pre-drawn shafts. A few large soft diagonal sprites in additive or screen blend, slowly fading alpha with a sine, optionally masked by the canopy texture. That is what study #4 Forest likely already covers for sunflecks. Cost is overdraw only.

### Gaps
- No shipped 2D pixel game documented a radial-blur god-ray pass with numbers.

---

## Q8. Haze, aerial perspective and lights inside fog

### Takeaway
In side-view games, haze is per-layer tint toward the sky color, baked into art or done with a per-layer color uniform. Top-down has little depth range, so haze maps better to height or to distance from the player. Lights inside fog read as halos when the fog is brightened by the light map, not just cleared by it.

### Cited findings
- Pixel background guide states the rule. Farther layers get less contrast, less saturation, and shift toward the sky color. https://www.sprite-ai.art/blog/pixel-art-backgrounds (secondary)
- Alto's Odyssey uses a muted-palette background layer that scrolls at a different rate for depth, per a Dice article. Secondary source. https://www.dice.com/career-advice/altos-odyssey-winning-mobile-game
- Hollow Knight. The NoBlur mod lists separate "Blur planes, Fog objects and Haze objects", which implies dedicated fog and haze sprite objects. https://github.com/Destalta/NoBlur
- Unity's case study says Team Cherry used "soft transparent shapes" instead of complex 3D lighting. https://unity.com/madewith/hollow-knight
- A GameDev.net poster says Hollow Knight-style blur is done in the background sprite shader, and static layers can be pre-blurred in Photoshop. Forum claim. https://comic.gamedev.net/forums/topic/703948-2d-background-depth-feeling

### Inferences
- Halo recipe. `fog_color_final = mix(fog_color, light_color, light_map * fog_density * k)`. Where fog is dense and light is present, fog glows. Where fog is thin, the light hits the ground. One fetch of the existing light map from study #5.
- Haze recipe for top-down. Tint by tile height (low tiles bluer and lighter) or by distance from the camera center for a vignette-haze. Both reuse Q5 textures.

### Gaps
- No first-party technical breakdown of haze from Hollow Knight, Alto, Blasphemous or Kingdom.

---

## Q9. Godot 4 Compatibility and WebGL2 constraints

### Takeaway
Avoid screen-reading shaders where possible. Draw fog as its own layer on a CanvasLayer (or as world sprites) that blends over the scene with normal blend modes. Use one BackBufferCopy at most. Use CanvasModulate for global tint. Do not rely on many PointLight2D nodes in Compatibility.

### Cited findings
- In 2D, the first node using `hint_screen_texture` triggers a full-screen copy. Later nodes reuse it, and the docs call repeated copying inefficient. https://docs.godotengine.org/en/stable/tutorials/shaders/screen-reading_shaders.html
- BackBufferCopy placed earlier in tree order suppresses the automatic copy. It can copy a region, and reading outside the region is undefined. Same source.
- Blurred screen reads work via `textureLod` only with a mipmap filter on the screen texture. Same source.
- Godot 4 2D lighting limits are 256 lights on screen and 16 lights per 2D node, per the Vulkan progress report. https://godotengine.org/article/vulkan-progress-report-2
- Users report about 15-16 lights per sprite or tilemap in practice, with extras silently ignored. https://forum.godotengine.org/t/working-around-godots-2d-light-limitations-for-a-dark-game/81311
- A Godot maintainer noted Compatibility FPS with lights was lower than Forward+ in a 4.4 dev regression. https://github.com/godotengine/godot/issues/99420
- The Lit 2D lighting addon requires Forward+ and does not support Mobile or Compatibility. https://store.godotengine.org/asset/fading-lantern-games/lit-2d-lighting-engine/

### Inferences
- Fog stack for WebGL2. World at 320x180 in a SubViewport. Fog as a ColorRect on a CanvasLayer above the world, shader reads noise texture + tile height texture + low-res clearing/light mask, outputs palette color with dithered alpha or discard. No screen read needed. Total about 5 fetches per pixel at 57,600 px, so about 290k fetches per frame. (Estimate.)
- ParallaxBackground or Parallax2D with a scroll scale above 1.0 gives the "overhead cloud layer passing above the camera" effect with zero shader cost.
- Use CanvasModulate for global fog dimming and time of day. It is a single multiply.

### Gaps
- No measured ms for BackBufferCopy on WebGL2. Whether Compatibility shares the 16-lights-per-node cap is not confirmed in docs.

---

## Q10. How shipped 2D and pixel games did it (evidence table)

| Game | What is documented | Primary source quality | See it in action |
|---|---|---|---|
| Graveyard Keeper | Fog from many horizontal cloud sprites, altitude illusion, 10 time-of-day LUTs, per-sprite normal maps, wind vertex shader | Good (lead programmer) | https://www.gamedeveloper.com/programming/graveyard-keeper-how-the-graphics-effects-are-made |
| Dead Cells | Dynamic 3D lighting on hand-drawn normal maps, saturated palette for readability. Nothing on fog | Medium | https://80.lv/articles/interview-with-the-developers-of-dead-cells , https://www.gamedeveloper.com/production/art-design-deep-dive-giving-back-colors-to-cryptic-worlds-in-i-dead-cells-i- |
| Hollow Knight | 2D layers in 3D space, soft transparent light shapes. Fog and haze objects exist per a mod | Weak to medium | https://unity.com/madewith/hollow-knight , https://github.com/Destalta/NoBlur |
| Children of Morta | Lighting runs at higher res than sprites, sprites scaled to full HD | Medium (dev quote) | https://techraptor.net/content/how-dead-mage-created-the-art-for-children-of-morta |
| Sea of Stars | Custom render pipeline for 2D lighting, one person full-time on it for years | Medium (interview) | https://mobilesyrup.com/2023/09/11/sea-of-stars-level-design-sabotage-studio-thierry-boulanger-interview/ , https://sabotagestudio.com/presskits/sea-of-stars |
| Eastward | Shader textures and lighting systems in custom engine for weather and time | Weak | https://www.gamedeveloper.com/art/eastward-s-creators-share-insights-on-making-pixel-art-adventures |
| Octopath Traveler (HD-2D) | 2D sprites in 3D UE4 scenes, dynamic day/night lighting in II. No fog details found | Weak | https://www.unrealengine.com/en-US/developer-interviews/octopath-traveler-ii-builds-a-bigger-bolder-world-in-its-stunning-hd-2d-style |
| Alto's Odyssey | Muted background parallax layer | Weak (secondary) | https://www.dice.com/career-advice/altos-odyssey-winning-mobile-game |
| Don't Starve | Map reveal via ShowArea, fog of war in native code, seasonal tint via colour cubes | Weak (forum) | https://forums.kleientertainment.com/forums/topic/137865-adding-overlay/ |
| Hyper Light Drifter, Blasphemous, Kingdom, Moonlighter, Darkest Dungeon, Inscryption | Nothing technical about fog found | None | n/a |

### Inferences
- The pattern across documented games is layered sprites plus color grading (LUT or colour cube), not noise shaders. Graveyard Keeper and Don't Starve both use LUT tinting. Hollow Knight uses dedicated fog sprites. This supports a sprite-first, shader-second approach for Kingsfoil.
- Children of Morta and Sea of Stars run lighting above sprite resolution. That is the opposite of the pixel-safe rule in Q6. It looks smooth and modern. For a Tibia-like palette-limited look, run fog at game resolution instead.

### Gaps
- No GDC talk on 2D fog for any listed game. Searches of GDC Vault returned only design or audio talks for Hyper Light Drifter.

---

## Cost cheat sheet (estimates unless cited)

| Technique | Fetches per pixel | ALU | Screen copy | Pixel taste |
|---|---|---|---|---|
| 2-3 scrolling noise layers (texture) | 2-3 | low | no | good if snapped and dithered |
| Godot 2D Fog Overlay default (4 oct x 2 for warp) | 8 (cited) | low | no | smooth, needs dither pass |
| Quilez 2-level warp, procedural 4-oct simplex | 0 | about 1,000 ops (5 fbm x 4 oct x about 50) | no | beautiful, too costly at native res |
| Cheap warp (RG offset texture + fog texture) | 2 | low | no | good |
| Height mask (tile texture) | +1 | low | no | n/a |
| Clearing / light mask (low-res SubViewport) | +1 | low | no | soft, dither edge |
| Radial blur god rays, 100 samples (Sanglard) | 100 | low | yes | smooth, not pixel-like |
| Pre-drawn additive shaft sprites | 1 per covered px | none | no | best for pixel art |

---

## Sources
- https://iquilezles.org/articles/warp/
- https://iquilezles.org/articles/fbm/
- https://www.shadertoy.com/view/lsl3RH
- https://godotshaders.com/shader/2d-fog-overlay/
- https://godotshaders.com/shader/color-dither/
- https://github.com/ensanmartin/godot-2d-dithering
- https://forum.godotengine.org/t/how-can-i-apply-a-dithering-effect-to-a-gradienttexture/143687
- https://ar5iv.arxiv.org/html/1204.1461
- https://jcgt.org/published/0011/01/02/paper-lowres.pdf
- https://discussions.unity.com/t/comparing-performance-of-textures-vs-procedural-shaders-on-mobile-gpu/662156
- https://developer.nvidia.com/gpugems/gpugems3/part-ii-light-and-shadows/chapter-13-volumetric-light-scattering-post-process
- https://fabiensanglard.net/lightScattering/
- https://docs.godotengine.org/en/stable/tutorials/shaders/screen-reading_shaders.html
- https://godotengine.org/article/vulkan-progress-report-2
- https://forum.godotengine.org/t/working-around-godots-2d-light-limitations-for-a-dark-game/81311
- https://github.com/godotengine/godot/issues/99420
- https://store.godotengine.org/asset/fading-lantern-games/lit-2d-lighting-engine/
- https://www.gamedeveloper.com/programming/graveyard-keeper-how-the-graphics-effects-are-made
- https://80.lv/articles/interview-with-the-developers-of-dead-cells
- https://www.gamedeveloper.com/production/art-design-deep-dive-giving-back-colors-to-cryptic-worlds-in-i-dead-cells-i-
- https://unity.com/madewith/hollow-knight
- https://github.com/Destalta/NoBlur
- https://comic.gamedev.net/forums/topic/703948-2d-background-depth-feeling
- https://techraptor.net/content/how-dead-mage-created-the-art-for-children-of-morta
- https://mobilesyrup.com/2023/09/11/sea-of-stars-level-design-sabotage-studio-thierry-boulanger-interview/
- https://sabotagestudio.com/presskits/sea-of-stars
- https://www.gamedeveloper.com/art/eastward-s-creators-share-insights-on-making-pixel-art-adventures
- https://www.unrealengine.com/en-US/developer-interviews/octopath-traveler-ii-builds-a-bigger-bolder-world-in-its-stunning-hd-2d-style
- https://www.dice.com/career-advice/altos-odyssey-winning-mobile-game
- https://forums.kleientertainment.com/forums/topic/47987-map-sharing-mod-feasibility/
- https://forums.kleientertainment.com/forums/topic/137865-adding-overlay/
- https://www.sprite-ai.art/blog/pixel-art-backgrounds
- https://gdcvault.com/play/1024062/contactUs
