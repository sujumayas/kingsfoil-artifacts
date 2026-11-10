# 02. Industry shader techniques for 2D water

Angle: mainstream techniques from primary sources (talk slides, devlogs, shader authors), translated to a 320x180, 32x32-tile, Godot 4 Compatibility/WebGL2 target.

Research date 2026-11-10. About 30 tool calls. TIGSource and archive.org were blocked (403 / tool refusal). Many named games have no public technical write-up on water; see "Games" and "Gaps".

---

## Q1. Valve flow maps (Vlachos, SIGGRAPH 2010). What exactly is the recipe?

### Takeaway
A low-res texture of 2D vectors pushes UVs of a tiled detail texture. Distort only a short time window, run two copies half a cycle apart and crossfade them, and add per-pixel noise to the phase so the crossfade pulse never lines up. Cost on 2010 hardware was 2 extra texture fetches and 21 ALU instructions over two scrolling maps. That fits a WebGL2 canvas_item shader with room to spare.

### Cited findings
- Slides: "Water Flow in Portal 2", Alex Vlachos, Valve, July 28 2010, SIGGRAPH Advances in Real-Time Rendering course. 54 slides. [Vlachos PDF]
- Goals: kill tiling repetition, flow around obstacles, vary speed and bump strength. Minimum hardware was ps2.0b ("6-year-old hardware") and Xbox 360. [Vlachos PDF]
- Gameplay result in Left 4 Dead 2 swamps: testers "took 17% fewer wrong turns" and crossed the level faster. Flow showed the correct path. [Vlachos PDF]
- Flow map resolution: "~4 texels/meter". One flow texture covers the whole water surface. The normal map is tiled on top. [Vlachos PDF]
- Authoring: "Impractical to paint directly". Valve used Houdini to import level geometry, "comb" a vector field, and apply procedural masks. [Vlachos PDF]
- Based on Max & Becker 1995 (moving textures for flow visualization). Their observation was that distortion looks convincing "for the first 1/3 of uv space", so distort only a small amount. [Vlachos PDF]
- Two layers, "each layer is offset half a phase" to hide each layer's restart. [Vlachos PDF]
- Two problems remain after that. Repetition (same normals flow through the same point) is fixed by offsetting each phase. Pulsing (the surface pulses in a pattern) is fixed by a noise texture. [Vlachos PDF]
- Normal strength is scaled down by flow speed (length of the flow vector). [Vlachos PDF]
- Cost vs two scrolling normal maps: +2 texture fetches (flow, noise), +21 pixel shader ALU instructions. [Vlachos PDF]
- Portal 2 flowed a colour map (debris in dirty water). For colours the distortion interval runs from -fraction to +fraction, so the peak sits at zero distortion, the at-rest look. Normals used 0..fraction with peak at half distortion. [Vlachos PDF]
- Future work listed: dynamic per-frame flow vectors from moving objects, and reusing the flow map in physics so objects drift on the surface. [Vlachos PDF]
- Catlike Coding's tutorial gives the formulas in full. [Catlike Distortion]
  - Encoding: flow in RG, decode `rg*2-1`, low-frequency Perlin noise in A. Import as non-sRGB. Map "doesn't need to be large", bilinear filtering keeps it smooth. DXT1 causes visible blocks, so keep it uncompressed.
  - `time = TIME*speed + noise`; `progress = fract(time + phaseOffset)` with phaseOffset 0 and 0.5.
  - `uv' = uv - flow * (progress + flowOffset)`.
  - Weight `w = 1 - abs(1 - 2*progress)`. The two weights always sum to 1.
  - flowOffset = -0.5 makes the texture undistorted at each phase peak (the same idea as Valve's debris offset).
  - UV jump per phase `(time - progress) * jump`, jump in [-0.25, 0.25]. Suggested 0.24 and 0.2083 give a theoretical loop of 600 phases (10 min at 1 phase/s).
  - Tiling is applied after displacement, so the flow map keeps its own UVs.

### Godot 4 canvas_item sketch (inference, assembled from the cited formulas)
```glsl
shader_type canvas_item;
uniform sampler2D flow_map : filter_linear, repeat_disable; // RG flow, A noise. e.g. 1 texel per tile
uniform sampler2D detail   : filter_nearest, repeat_enable; // tiling ripple/colour texture
uniform float speed = 0.5;      // phases per second
uniform float strength = 0.25;  // fraction of a tile moved per phase
uniform vec2 jump = vec2(0.24, 0.2083);
vec3 layer(vec2 uv, vec2 f, float t, float ph) {
    float p = fract(t + ph);
    vec2 u = uv - f * (p - 0.5);          // Valve colour-map offset: peak = rest
    u += (t - p) * jump + ph;              // per-phase jump + half offset
    return texture(detail, u).rgb * (1.0 - abs(1.0 - 2.0 * p));
}
void fragment() {
    vec4 fm = texture(flow_map, UV);
    vec2 f = (fm.rg * 2.0 - 1.0) * strength;
    float t = TIME * speed + fm.a;          // noise hides the pulse
    COLOR.rgb = layer(UV * 8.0, f, t, 0.0) + layer(UV * 8.0, f, t, 0.5);
}
```
Two detail fetches plus one flow fetch per pixel. At 320x180 that is about 173k fetches per frame for a full-screen sea.

### Inferences
- Valve's 4 texels/m at 1 m per Tibia tile means roughly 4 texels per 32 px tile. For tile engines, 1 texel per tile (a 64x64 flow map for a 64x64-tile chunk) with bilinear filtering is likely enough, and it can come straight from per-tile river direction data, no Houdini needed.
- For pixel art, use the colour-map variant (peak at rest), and snap the final UV to the pixel grid (`floor(uv*texSize)/texSize`) so the scrolling pattern does not produce sub-pixel shimmer.
- The 17% wrong-turn result is a direct argument for flow on rivers in an MMO map. Players read direction from it.

### Gaps
- Slides give no cycle length in seconds. The Bronwen Grimes GDC 2011 "Nonstandard Textures" deck covers Valve flow maps further but was not opened. [Grimes GDC2011]

---

## Q2. Scrolling UV distortion with noise (the default indie water)

### Takeaway
Two noise textures scrolling in opposite directions, multiplied or overlaid, then used both as a UV offset into the screen and as a threshold for highlight bands. It is the most common Godot community recipe. Speeds are tiny (0.005 to 0.05 UV/s).

### Cited findings
- "Pixel Water for Godot 4.3": two noises at `vec2(0.05,0.05)` and `vec2(-0.05,-0.05)`, multiplied into `depth`. `depth * distortionStrength` (0.2) offsets the screen texture lookup. Highlight band `smoothstep(0.275, 0.4, depth)`. Pixelation by snapping UV with `pixelSize` 2.0. Output alpha forced to 1. A commenter reports sharp edges when used on a TileMapLayer. [GS Pixel Water]
- "Pixel Art Water" (canvas_item, Godot 4 syntax): caustics `causticSpeed` 0.005, specular `specularSpeed` 0.025 with two layers scrolling opposite on x. Specular = overlay of the two layers minus a static noise, then `step(0.35, ...)`. Pixelization uniform 2048. [GS Pixel Art Water]
- "2D water for topdown games": no noise texture. A hashed grid (UV*10) of expanding sine rings plus a 0.005-amplitude sine wobble, normals from `dFdx/dFdy`, specular `pow(N.L, 32)*5`, a 30-iteration rotated-sine highlight loop. Screen texture sampled `filter_nearest`. Users needed `max(...,0)` to fix black patches. [GS Topdown]
- Kingdom (Noio) is described by a third party as running a second distortion pass at a different speed for a rolling look. Not a developer statement. [Defold forum]

### Inferences
- A 30-iteration loop per pixel ([GS Topdown]) is the wrong trade for a web build. Two scrolling 64x64 or 128x128 noise fetches cost less and look as good at 320x180.
- Use opposite-direction scrolling at different speeds (e.g. 1:0.7 ratio) so the product never visibly repeats. A 64 px tile at 0.05 UV/s repeats every 20 s.

### Gaps
- None of these shaders give measured GPU cost.

---

## Q3. Depth-based colour from a depth/height texture

### Takeaway
Store depth (or distance to shore) in one channel of a data texture, then index a 1D gradient. In a palette-limited game the gradient is just 3 to 5 palette colours, so depth bands come free.

### Cited findings
- "Pixel Art Water" packs per-tile data into RGB: R = outline, G = foam, B = depth/transparency. Colour = `texture(waterDepthGradient, vec2(1.0 - mainTex.b, 1.0))`. Alpha = B * generalTransparency. Animated shore edges use animated TileSet tiles. [GS Pixel Art Water]
- Godot docs only document the screen depth buffer for 3D shaders. Nothing for 2D. [Godot screen-reading]

### Inferences
- In 2D there is no depth buffer to read, so depth must be authored. Options: per-tile depth value baked from the tile map into a small R8 texture (1 texel per tile, linear filter gives smooth bands), or a BFS distance from land (Q4) reused as depth.
- For palette taste, quantize the result (`floor(d*4)/4`) and add a 4x4 Bayer dither at the band edges, like the snow study's dithered lamp pools.

---

## Q4. Foam from distance-to-shore fields (SDF, BFS on tiles, jump flooding)

### Takeaway
Build a distance-to-shore field once, then animate foam as bands of that field moving over time: `foam = step(fract(dist*k - TIME*s), w)`. On a tile grid, CPU BFS at load time is the cheapest and exact enough. Jump flooding is the GPU option when the shore changes at runtime (tides) and needs pixel resolution.

### Cited findings
- Croakwood (Texel Raptor, Nov 2024): an orthographic top-down camera renders everything intersecting the water into an outline texture, terrain in G and other objects in R. The GPU then computes distance to the nearest shore pixel. The SDF drives where shoreline waves show, wraps any shape and blends between nearby objects. [Croakwood]
- Croakwood contrasts Parkitect's cheaper depth-threshold method. It cannot animate waves toward the shore and shows only on camera-facing sides. [Croakwood]
- Jump flooding (Rong and Tan): log2(N) full-screen passes, step N/2, N/4 ... 1, 9 samples per pass (a 5-sample plus variant works about as well). Each pixel stores its nearest seed's coordinate, then one more pass converts to distance. Approximate, "very little error in practice". Separable X then Y gave "a LOT of errors". [Demofox JFA]
- A forum warning: a shore field used to steer waves must be smooth, since sharp changes cause big discontinuities. Use it mainly for spawning foam. [UE shore forum]

### Tile-grid BFS sketch (inference)
```
queue = all water tiles with a land 4-neighbour, dist = 1
BFS over water tiles, dist[n] = dist[t] + 1, cap at 8
upload dist as R8 texture, 1 texel per tile, linear filtering
shader: d = texture(dist_tex, uv).r * 8.0       // tiles from shore
        band = fract(d * 0.5 - TIME * 0.25)     // waves move toward shore
        foam = d < 2.5 && band < 0.15
```
Cost is one BFS over the chunk at load (O(tiles)). A 64x64 chunk is 4096 tiles. Shader cost is one extra fetch.

### Inferences
- Linear filtering a 1-texel-per-tile field gives diamond-shaped contours at tile corners. Fix by sampling a 2x or 4x upsampled field, or by adding noise to `d` before banding (the noise also breaks up the straight edge).
- JFA on WebGL2 needs ping-pong render targets. In Godot that means chained SubViewports, which is fiddly. For static maps, bake on CPU.
- A tide (server-driven water level) only needs to shift the foam threshold if the field is computed against a heightmap, not against the tile mask.

### Gaps
- No pixel-art game found that documents a distance-field foam in a write-up. Croakwood is 3D-ish.

---

## Q5. Caustics

### Takeaway
Two cheap paths. A tileable caustic texture sampled twice at different scroll offsets with `min()` or multiply, or procedural Voronoi edge distance (F2-F1). For pixel art at 320x180, a 64x64 hand-pixelled or pre-baked caustic sprite scrolled at two speeds is cheaper and stays on palette.

### Cited findings
- "Pixel Art Water" uses texture caustics, not Voronoi. Base and highlight caustic textures sampled at UVs offset by noise RG times 0.15, faded by a noise mask. Colours (0.455, 0.773, 0.765) and (0.741, 0.894, 0.898). [GS Pixel Art Water]
- A Godot port of Alex Ameye's realtime caustics exists, but it is 3D-oriented. [godot-realtimecaustics]
- godotshaders lists a "Water Caustic" canvas_item Shadertoy port (not opened). [GS shadertoy port list]

### Inferences
- Voronoi F2-F1 needs 9 cell hashes per pixel per layer, so 18 for two layers. Fine on desktop, measurable on low-end mobile WebGL. The texture route is 2 fetches.
- Caustics read best only in shallow water. Gate them by the depth field from Q3.

### Gaps
- No primary source with caustic texture sizes from a shipped pixel game.

---

## Q6. Reflections in 2D top-down

### Takeaway
Three working approaches. A screen texture read flipped around a line (cheap, breaks at screen edges), duplicated mirrored sprites under a semi-transparent water layer (most robust for top-down, costs draw calls), or a SubViewport render target. Puddle reflections are covered in study #3 Rain, so this section only adds the sea-scale points.

### Cited findings
- Godot 2D: the first node using `hint_screen_texture` triggers a full-screen back-buffer copy. Later nodes reuse it, so overlapping screen readers do not see each other's output. A BackBufferCopy node can copy a region. Reading outside the copied region is undefined. [Godot screen-reading]
- Godot declaration: `uniform sampler2D screen_texture : hint_screen_texture;`. [Lemmy Godot]
- Forum reports. A blur shader with `hint_screen_texture` works in the editor and fails in a web export. [Godot web forum]. Screen texture behaves oddly under Compatibility but works in Forward+. [Godot compat forum]. Web export always uses Compatibility/WebGL2. [Godot web export forum]
- "2D Reflective Water" screen-flip shader. A Godot 4.2 thread reports the reflection breaking at some camera Y positions. [GS Reflective], [Godot reflective forum]
- "2D water with reflections" (inspired by Kingdom Two Crowns) puts reflected content in a layer above a ColorRect. Needs `source_color` instead of `hint_albedo` for Godot 4. [GS Reflections]
- Flowa (Unity, isometric, mobile): duplicate sprites flipped and placed between water and background, a ripple layer using a grab pass on top, semi-transparent water. Directional sprites (the player) face the wrong way when flipped, so the player's reflection is faded to one colour and hidden under ripples. Largest levels stay under 200 draw calls. Reflections and ripples can be turned off in settings. [Flowa]
- A GameMaker tile approach copies part of a reflection surface onto each water tile and offsets it with the same wave math, so reflections bob with waves. [Landraisers]

### Inferences
- For Asterion's 3/4 view, the screen flip is wrong anyway. The thing above a water pixel on screen is not what would reflect there. Mirrored sprites anchored at each object's base (foot Y) are correct for trees and buildings on the shore, and Godot can draw them with one extra Sprite2D per object, `flip_v`, modulate alpha about 0.4, plus a sine x-offset per row in a shader.
- Render the reflection sprites into a SubViewport at native 320x180 and sample that in the water shader with the flow/noise distortion. This avoids `hint_screen_texture` and its web reports.

---

## Q7. How specific pixel games ship water

| Game | What is documented | Source |
|---|---|---|
| Stardew Valley | Water animation art is likely in LooseSprites/Cursors (modder guess, unconfirmed). Reflections need a mod (Dynamic Reflections). Decompiled source repos exist, not inspected. | [SDV forum], [Dynamic Reflections], [SDV decompiled] |
| Eastward | Custom MOAI-based engine with complex lighting, SSAO and LUT. About 70,000 hand-drawn frames. Developers spent hours on water rippling under a raft. No water technique write-up. | [80lv Eastward], [Wireframe Eastward] |
| Sea of Stars | Custom render pipeline for dynamic lighting (programmer Jeakim Hamel). Reviews mention real-time reflections and warping behind waterfalls. Fish react to swimming. No technical write-up. | [Astrolabe], [RPGFan], [MobileSyrup] |
| CrossCode | Waterfalls by Teflora. Curved surface, a fitting pixel look and seamless join to the water were "far from trivial". No details. | [CrossCode devblog] |
| Graveyard Keeper | Effects article covers vertex wind sway, 10 LUTs, painted 4-side normal maps, up to 4 shadows per object. Nothing on water. | [GK effects] |
| Kingdom Two Crowns | Flipped render plus distortion. Developer thread on TIGSource blocked (403). | [Defold forum], [Steam K2C] |
| Croakwood | SDF shoreline from an ortho outline render. Compute-shader ripples. | [Croakwood] |
| Hyper Light Drifter, Moonlighter, Chained Echoes, Celeste, Owlboy | No primary technical source found. | searches logged in Gaps |
| Tiny Glade, Dredge | 3D games, out of scope for a 2D tile engine. Not researched further. | |

### Inferences
- The shipped pixel games that do document anything mostly rely on hand-animated tiles plus a light shader pass (lighting, LUT), not heavy water shaders. That matches the series' goal.

---

## Q8. What works in Godot 4 Compatibility/WebGL2

### Cited findings
- Web builds target WebGL 2.0 via Compatibility only. [Godot web export forum]
- Normal-roughness texture is Forward+ only. No other Compatibility limit is listed on the screen-reading page. [Godot screen-reading]
- Screen texture issues on web and Compatibility are reported in forums, not confirmed as engine limits. [Godot web forum], [Godot compat forum]

### Inferences
- Safe: canvas_item shaders with texture fetches, `TIME`, `fract`, `smoothstep`, small loops. Flow maps (Q1), scrolling noise (Q2), depth gradients (Q3), baked BFS foam (Q4), caustic textures (Q5), SubViewport reflections (Q6).
- Risky on web: `hint_screen_texture` stacks, dFdx/dFdy normal tricks (work in WebGL2 but can alias at low res), multi-pass JFA.
- Not available: compute shaders (so Croakwood's ripple compute shader must become a fragment ping-pong in a SubViewport, as in study #3).

---

## Gaps (honest)
- No water write-ups found for Stardew, Eastward, Sea of Stars, CrossCode, Chained Echoes, Hyper Light Drifter, Moonlighter, Celeste, Owlboy. Each was searched once. Next step is GDC Vault titles and decompiled Stardew source (`GameLocation` draw path).
- TIGSource Kingdom thread blocked, archive.org blocked by the tool.
- No measured ms costs for any 2D water shader. Valve's instruction count is the only hard cost figure.
- Bronwen Grimes GDC 2011 deck not read.

## Sources
- [Vlachos PDF] https://www.advances.realtimerendering.com/s2010/Vlachos-Waterflow(SIGGRAPH%202010%20Advanced%20RealTime%20Rendering%20Course).pdf
- [Grimes GDC2011] https://www.hlportal.de/files/GDC2011_BronwenGrimes_NonstandardTextures.pdf
- [Catlike Distortion] https://catlikecoding.com/unity/tutorials/flow/texture-distortion/
- [Catlike Directional] https://catlikecoding.com/unity/tutorials/flow/directional-flow/
- [GS Pixel Water] https://godotshaders.com/shader/pixel-water/
- [GS Pixel Art Water] https://godotshaders.com/shader/pixel-art-water/
- [GS Topdown] https://godotshaders.com/?p=11955
- [GS Reflective] https://godotshaders.com/shader/2d-reflective-water/
- [GS Reflections] https://godotshaders.com/shader/2d-water-with-reflections/
- [GS shadertoy port list] https://godotshaders.com/shader-license/shadertoy_port/
- [godot-realtimecaustics] https://github.com/paddy-exe/godot-realtimecaustics
- [Godot screen-reading] https://docs.godotengine.org/en/stable/tutorials/shaders/screen-reading_shaders.html
- [Lemmy Godot] https://lemmy.imagisphe.re/post/758433/2319492
- [Godot web forum] https://forum.godotengine.org/t/screen-texture-does-not-work-work-when-deploying-for-web/45261
- [Godot compat forum] https://forum.godotengine.org/t/screen-texture-behaves-strangely-with-gl-compatibility-renderer-but-works-fine-with-forward/93296
- [Godot web export forum] https://forum.godotengine.org/t/godot-4-web-export-issues/49346
- [Godot reflective forum] https://forum.godotengine.org/t/2d-shader-reflective-water/53384
- [Croakwood] https://www.texelraptor.com/blog/croakwood-devlog-5
- [Demofox JFA] https://blog.demofox.org/2016/02/29/fast-voronoi-diagrams-and-distance-dield-textures-on-the-gpu-with-the-jump-flooding-algorithm/
- [UE shore forum] https://forums.unrealengine.com/t/shore-detection-for-water-surfaces/64505/32
- [Flowa] https://jacobknispel.itch.io/flowa/devlog/261753/2d-reflections-quick-dirty
- [Landraisers] https://zeritum.itch.io/landraisers/devlog/109410/water-you-looking-at
- [Defold forum] https://forum.defold.com/t/water-reflections/75802
- [Steam K2C] https://steamcommunity.com/app/701160/discussions/0/592887534192767509
- [SDV forum] https://forums.stardewvalley.net/threads/where-are-water-animations-stored.49069
- [Dynamic Reflections] https://awesome.ecosyste.ms/projects/github.com%2Ffloogen%2Fdynamicreflections
- [SDV decompiled] https://github.com/veywrn/StardewValley
- [80lv Eastward] https://80.lv/articles/eastward-charming-chinese-pixel-art-adventure
- [Wireframe Eastward] https://wireframe.raspberrypi.org/articles/eastward-preview-promising
- [Astrolabe] https://astrolabe.aidanmoher.com/astrolabe-feature-sea-of-stars-is/
- [RPGFan] https://www.rpgfan.com/review/sea-of-stars/
- [MobileSyrup] https://mobilesyrup.com/2023/09/11/sea-of-stars-level-design-sabotage-studio-thierry-boulanger-interview/
- [CrossCode devblog] https://www.radicalfishgames.com/?p=7386
- [GK effects] https://www.gamedeveloper.com/programming/graveyard-keeper-how-the-graphics-effects-are-made
