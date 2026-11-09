# 02 — Modern 2D / pixel-art lighting architectures that ship, mapped to Godot 4 web (Compatibility)

Researcher angle: modern engine-level 2D lighting (Godot Light2D, Unity URP 2D) and how shipped pixel-art games light scenes, and what each costs on Godot 4 Compatibility (WebGL2).
Date: 2026-11-09. Godot facts come from the **current master source and docs** (raw files on GitHub, fetched today), so they describe 4.5–4.6-era behaviour. Fetch notes: docs.godotengine.org/en/stable was not on the allowlist, so I used the godot-docs raw `.rst` file and the `godot` source `doc/classes/*.xml` and `drivers/gles3/*` files. The GitHub API (issues) was blocked for this session.

---

## Q1. How Godot 4's 2D lighting works, and its limits on Compatibility

### Takeaway
- **Godot 4 2D lighting is forward and per-item, not a light-map.** Each lit CanvasItem's fragment shader loops over the lights that touch it: it samples each light's texture, then the normal map, then 1, 5 or 13 shadow-atlas taps.
- **Hard cap: about 15 positional lights per canvas item.** Beyond that, extra lights are silently dropped, and you cannot choose which ones.
- **The frame budget is 256 lights per render, or 64 on devices with small UBOs (uniform buffer objects).** Many WebGL/mobile GPUs fall in the 64 group.
- **Large light textures are the main cost and the main reason items hit the cap.**
- **Lights do not snap to the pixel grid on their own.** Lighting runs at viewport resolution; you snap it with `LIGHT_VERTEX` / `SHADOW_VERTEX` in a shader.
- For a Tibia-like map with dozens of torches, Godot's own docs point to the better path: **additive sprites, or a custom light-map (SubViewport)**. Keep real Light2D for a few hero lights (the player's torch, with shadows).

### Cited findings
**Nodes and roles** (godot-docs `2d_lights_and_shadows.rst`, master)
- CanvasModulate sets the ambient colour: "the final lighting color in areas that are not reached by any 2D light". Without it, lights only brighten an already fully lit scene.
- PointLight2D works by "adding a selected texture over the rest of the scene". The texture size sets the light size. `Texture Scale` multiplies it, and larger lights cost more "as they affect more pixels on screen".
- `Offset` moves the light texture without moving the shadows.
- PointLight2D `height` is in pixels: "if the height is 100, then it will illuminate an object 100 pixels away at a 45° angle" (PointLight2D.xml). DirectionalLight2D `height` runs from 0 (parallel to the plane) to 1 (perpendicular).
- Directional shadows are always infinitely long, "a limitation of the shadow rendering method". The docs say finite sun shadows need a custom shader that reads the 2D SDF, which is generated automatically from LightOccluder2D nodes.
- DirectionalLight2D `max_distance` defaults to 10000 px and culls shadow casters far from the camera centre. It ignores Camera2D zoom.
- DirectionalLight2D ignores `range_item_cull_mask` and always lights every 2D node. It does support shadow cull masks (DirectionalLight2D.xml).
- Blend modes are Add (default), Sub ("negative lights") and Mix (linear interpolation) (Light2D.xml).
- Range defaults: `z_min` −1024, `z_max` 1024, `item_cull_mask` 1, `shadow_item_cull_mask` 1. Shadow colour defaults to Color(0,0,0,0), and its alpha controls the tint.
- Shadow filters:
  - None: "fastest… well suited for games with a pixel art aesthetic".
  - PCF5: 5 samples.
  - PCF13: 13 samples, "should only be used for a few lights at once".
  - `Filter Smooth` softens further but causes streaks (the docs' example of this is PCF5 with smooth 4).
- LightOccluder2D `SDF Collision` is on by default and costs nothing unless a shader reads the SDF. `Occluder Light Mask` pairs with each light's shadow item cull mask.
- Occluders can be generated from a Sprite2D ("Create LightOccluder2D Sibling", with grow/shrink in pixels) or drawn as polygons. TileMapLayer tiles can also carry occluders.
- **Pixel-art note in the docs:** lighting is computed "at the Viewport's pixel resolution, not at the source texture's texel resolution". Nearest filtering does *not* pixelate the light. To get blocky light, snap `LIGHT_VERTEX.xy = floor(LIGHT_VERTEX.xy / pixel_size) * pixel_size;` and `SHADOW_VERTEX` the same way in a `canvas_item` shader.
- Normal and specular maps go through a **CanvasTexture** (Diffuse, Normal Map, Specular textures, plus Specular Color and Shininess). With normal maps on, lights look weaker, so raise the light's Height and Energy. The docs recommend **Laigter** (free) to generate normal maps.
- **"Using additive sprites as a faster alternative to 2D lights"** (docs section):
  - They are "much faster to render, since they don't need to go through a separate rendering pipeline", and they can be animated.
  - Downsides: they can't light fully dark areas correctly, cast no shadows, and ignore normal maps.

**Hard limits in the Compatibility (GLES3) renderer** (`drivers/gles3/rasterizer_canvas_gles3.h/.cpp`, `canvas.glsl`, master)
- `MAX_LIGHTS_PER_ITEM = 16`. The per-item loop breaks when `light_count == max_lights_per_item - 1`, so the **effective cap is 15 positional lights per canvas item**. The shader packs the count into 4 bits ("Max 16 lights").
  - The RD renderers (Forward+/Mobile) also define `MAX_LIGHTS_PER_ITEM = 16`.
  - The Godot forum independently reports a "cap of 15 for lights" per sprite. With 320×320 light textures on 64×64 sprites, the cap was hit easily. Shrinking the textures below 192×192 helped.
- A light is assigned to an item only if all of these hold: the item's `light_mask` matches the light's item mask, the item's z is within [z_min, z_max], and the item's rect intersects the light's rect. **Shrinking the light texture or narrowing z and mask ranges is how you stay under the cap.**
- `max_lights_per_render` is 256, but **drops to 64 when `max_uniform_buffer_size < 65536`**. This is set at init, and the shader is compiled with `#define MAX_LIGHTS`.
- **Shadow atlas:** one texture of `shadow_texture_size` (project setting `rendering/2d/shadow_atlas/size`, default **2048**, rounded to a power of 2) × (`max_lights_per_render` × 2) rows.
  - Each point light's shadow is rendered in **4 passes** (one per quadrant, like a 1D polar depth map) by drawing the occluder polygons.
  - Directional shadows use a separate update path.
  - On GPUs without float render targets, the shadow format falls back to RGBA8-packed depth.
- PCF5 is 5 taps along the 1D shadow row, and PCF13 is 13 taps, inside the per-light loop of every lit fragment.
- The 2D SDF is implemented in GLES3 (`render_sdf`, plus `texture_sdf` / `texture_sdf_normal` / `sdf_to_screen_uv` in `canvas.glsl`), so **SDF shaders work on Compatibility**.
  - `rendering/2d/sdf/scale` defaults to 50% (25% of the viewport's pixel count).
  - `rendering/2d/sdf/oversize` defaults to 120% (20% margin on each side) (ProjectSettings.xml).
- `rendering/gl_compatibility/item_buffer_size` defaults to 16384 canvas commands per viewport update; commands beyond that are dropped. An in-source comment says this is "16,384 instances * 128 bytes = 2,097,152 bytes".
- Note: `rendering/limits/opengl/max_renderable_lights` (32) and `max_lights_per_object` (8) are **3D-only** Compatibility limits, not 2D (ProjectSettings.xml).

**Real-world performance reports**
- Godot forum, 4.5.2 stable, no shadows:
  - Baseline was about 115 fps. The first PointLight2D took it to about 85 fps.
  - The 2nd and 3rd lights cost about 10 fps each, and each one after that about 2–3 fps.
  - The renderer and GPU weren't stated. Advice in the thread: use additive sprites, and watch texture sizes.
- Godot forum ("dark game" thread):
  - **BackBufferCopy plus a screen-reading canvas shader** that brightens the screen copy by a light texture allows "as many lights as you want" with little impact. It has no normal maps or shadows, fails on fully black scenes, and was confirmed working with more than 16 lights.
  - The Mix blend mode had a bug (issue #96445, 4.2.1 and 4.3): newly instantiated Mix lights only lit sprites that existed at spawn.
  - The original poster eventually moved to 3D quads with OmniLight3D.

### Inferences (mine)
- Because Godot's cost is roughly (lit pixels × lights touching them × shadow taps), a full-screen night overlay with 30 torches is far cheaper as **one light-map SubViewport** (draw N soft sprites additively at ¼–½ resolution, then multiply over the scene once) than as 30 Light2D nodes.
- **TileMapLayer and the per-item cap:**
  - TileMapLayer batches tiles into rendering quadrants. I recall `rendering_quadrant_size` defaults to 16 tiles; I could not verify this because the class XML fetch returned 404.
  - Each quadrant is one canvas item, so the 15-light cap applies **per quadrant**. A torch-dense town on one big tile layer could drop lights.
  - **Smaller quadrants, or a light-map approach, avoid this.** Verify in the profiler.
- Since 64 lights per render is possible on low-UBO WebGL devices, design for **≤ 8–12 true Light2D on screen** on web. Everything else should be additive or light-map sprites.
- Recommended hybrid for Asterion:
  1. CanvasModulate (or a light-map multiply) for the day/night ambient.
  2. Light-map sprites for all static torches, windows and magic.
  3. At most 1–3 PointLight2D with shadows (Filter None, pixel-snapped), only for the player's carried light and key set pieces.

### Gaps
- No official ms-per-light benchmark for Godot 2D on WebGL2.
- Changelog-level detail for 4.3→4.7 changes to Compatibility 2D lights was not verified, because the GitHub API was blocked. The source above reflects current master.

---

## Q2. How shipped games light pixel art (architectures)

### Takeaway
Shipped pixel-art games fall into four families:
- **(A) Light-map render target plus sprite light textures, multiplied or subtracted over the scene.** Stardew, Unity URP 2D, and many indies use this.
- **(B) Normal-mapped sprites with real dynamic lights.** Dead Cells, Graveyard Keeper, Eastward, Children of Morta, Sea of Stars use this, usually with *hand-painted* normals.
- **(C) Tile-grid flood-fill light.** Terraria uses this (per-tile "Retro/Trippy" vs sub-tile smoothed "Color/White"). It is covered by another researcher, but the mode trade-off is noted here.
- **(D) Colour grading (LUT/gradient-map) for time of day and mood.** Graveyard Keeper and Dead Cells use this.

The cheap and robust combination for top-down web is **A + D**, with B optional for hero assets.

### Cited findings
**Stardew Valley — light-map render target** (decompiled draw loop mirrored in SMAPI `SGame.cs`)
- Each frame:
  1. Set the render target to `Game1.lightmap` and clear it.
  2. Fill it with the ambient colour. That colour is `outdoorLight` or `ambientLight`; mines get their own colour, and rain applies outdoors.
  3. Draw every on-screen `LightSource.lightTexture` at `position / (lightingQuality/2)`, scaled by `radius / (lightingQuality/2)` and tinted by `lightSource.color`, using PointClamp.
  4. Composite the light-map over the world with a custom `lightingBlend` and **LinearClamp**, scaled up by `lightingQuality/2`.
- **The light-map is low resolution and upscaled smoothly.**
- Window lights are skipped when it is raining or dark out (`LightContext.WindowLight`).
- An on-screen cull uses `radius × 64 × 4` px.
- Rain outdoors adds an `OrangeRed × 0.45` overlay pass.
- A buff (id 26) lerps the ambient halfway to white and multiplies lights by 0.33.

**Unity URP 2D lights** (Unity 6000.3 manual) — used by many indie pixel games
- Rendering happens in three stages: shadow shapes go into shadow textures, light colour and shape go into **light textures**, then lit sprites are rendered sampling those textures. Unity renders all light textures before any sprites, for performance.
- Light render texture **Render Scale defaults to 0.5** of screen resolution. Max Light Render Textures defaults to 4, and Max Shadow Render Textures to 1.
- Each blend style is Additive, Multiply or Subtractive, with a mask texture channel (R/G/B/A or one-minus).
- Light types: spot (also used as point), sprite (light shaped like a sprite), freeform (polygon), and global (one per blend style per sorting layer).
- HDR Emulation Scale should be set to the "combined maximum brightness of the lights"; lower it if you see banding.
- The Depth/Stencil buffer can be disabled for mobile performance.
- Graveyard Keeper used Unity's light sources for torches, ovens and lamps (below).

**Graveyard Keeper (Lazy Bear, Unity) — top-down, very relevant** (dev blog, Slava, Lazy Bear Games)
- Ambient light follows a **gradient over the day**: it dims and turns bluish at night.
- **10 LUTs** (night, twilight, evening and others) were made by applying Photoshop adjustments to screenshots and then to the identity LUT. The author calls the result "Lightning-fast performance".
- Light-sprite intensity also varies with time of day.
- Every sprite has a **normal map**. The artist paints light from 4 sides and a script merges them into one map. The author cites **Sprite Lamp**.
- **Fake 3D light depth:** if the sprite is between the light and the camera, lighting fades quickly instead of cutting off.
- **Shadows:** up to **4 per object** (1 sun, plus up to 3 from the nearest dynamic lights).
  - About **10 reusable shadow sprites** (thin, thick, oval…).
  - Rotation is done in the vertex shader, with the angle passed in a colour channel because shadows are black.
  - The `Update()` search for the 3 nearest lights was heavy; the author would use Jobs today.
  - Long objects like fences distort.
- **Fog:** horizontal layers, so the tops of tall sprites stay clear.

**Dead Cells (Motion Twin)** (Game Developer, Gwenaël Massé, 2018-04-03)
- Normal maps are **hand-drawn in Photoshop**, not baked, and they control how surfaces react to torches and spells.
- Backgrounds are drawn in grayscale and coloured with a **gradient map** per biome; swapping the map recolours the whole biome.
- Mood levers: lighting colour, warm-around-the-hero vs cold shadows, complementary palettes indoors and analogous palettes outdoors.

**Children of Morta (Dead Mage)** (TechRaptor)
- "Instead of making the pixelated lights, we used the high-res dynamic lights". Pixel art is stretched about 4× to full HD, and lights render at that resolution.
- Their puppet-show analogy: pixelated puppets lit by real lights.

**Eastward (Pixpil, custom engine)** (Game Developer)
- Pixpil describes it as "a 3D game with a 2D perspective". Assets are drawn in Aseprite, split into parts (roof, wall), rebuilt in 3D, then **hand-painted into a "bump map"**.
- Shader textures and lighting systems carry weather and time of day, including dawn/dusk fog and sun-beams.
- No numbers are given.

**Sea of Stars (Sabotage)**
- PC Gamer (2020-03-19): the developer changed the time of day live, and "shadows rotated" while the sun and moon swapped and light shifted from warm to cool. Time of day is "key to solving puzzles".
- Day/night bridge puzzles are described by TechRaptor (2023-01-28).
- **The implementation is not documented in the sources I found** (gap).

**Terraria lighting modes** (terraria.wiki.gg "Lighting mode")
- **Color** is the default on desktop and its performance impact is High. Light is computed on "pixel clusters that are smaller than tiles" and keeps the source colour.
- **White** has a Mid–High impact.
- **Trippy** has a Medium impact. Light is per tile and blocky, it keeps colour, and it is the mobile default.
- **Retro** has a Low impact. It is per tile and white, and reproduces the look before update 1.1.
- Torch range is **42 tiles in air** (7 in solids, 47 in water, 10 in honey), colour `#FFF2CC` (wiki "Lighting").
  - Coloured torches range from about 41 to 46 tiles.
  - The wiki's rule of thumb is "halve the ranges and multiply by luminance".

### Inferences
- Stardew's `lightingBlend` is not in the SMAPI file. From community knowledge it is a reverse-subtract blend, so modders specify light colours as the *inverse* of the visible tint (unverified; flagged).
- The pattern that matters is **render the light-map at reduced resolution, then upscale with linear filtering**. It is identical to Unity's 0.5 Render Scale.
- For Asterion, a 1/2-res light-map is fine. Use **nearest upscale plus Bayer dithering** if you want the light to look like pixel art (Snow study #1). Use linear if you prefer soft light, as Children of Morta does.
- Terraria shows that **per-tile light is the lowest-cost mode and reads as "retro"**, which fits a Tibia look. Sub-tile smoothing is a cosmetic upgrade.

### Gaps
- Not covered: Hyper Light Drifter, Moonlighter, Owlboy, Kingdom, Hollow Knight, Noita, Blasphemous, Octopath HD-2D, Celeste, Don't Starve, Starbound (tool budget).
- No GDC talks were fetched.
- Sea of Stars and Eastward technical details remain unverified.

---

## Q3. Common pipeline patterns, ranked by fit for Godot 4 web

| # | Pattern | Godot 4 Compatibility mapping | Cost | Fit |
|---|---|---|---|---|
| 1 | Ambient tint only (CanvasModulate gradient over time) | `CanvasModulate.color` animated by a Gradient | ~0 (vertex colour multiply) | Essential base |
| 2 | **Light-map RT** (dark ambient fill, additive soft sprites, multiply over scene) | SubViewport (½ or ¼ res, `transparent_bg` off) holding the ambient ColorRect and additive Sprite2D lights; display via a TextureRect/Sprite2D with a CanvasItemMaterial in **Multiply** blend on top, or sample in a screen shader. Camera transform must be mirrored | 1 extra small RT; each light is one quad of overdraw at reduced res | **Best for many torches** (Stardew/Unity-style) |
| 3 | Additive sprites directly in the world (no RT) | Sprite2D + CanvasItemMaterial `blend_mode = Add` (docs-sanctioned) | Cheapest | Can't light pure black; combine with #1 at ambient ≥ ~15% |
| 4 | BackBufferCopy + screen shader | BackBufferCopy (viewport mode) + `hint_screen_texture` | 1 screen copy | Many lights, no shadows (forum) |
| 5 | Native PointLight2D (no shadow) | Per-item forward shading; ≤ 15 per item | Grows with light-texture area × count | Few hero lights; normal maps |
| 6 | PointLight2D + LightOccluder2D shadows | 4-pass 1D shadow map per light; Filter None for pixel art; snap `SHADOW_VERTEX` | Highest | 1–3 lights max on web (inference) |
| 7 | SDF shadows / soft occlusion in a custom shader | `texture_sdf()` from occluders (works in GLES3); raymarch from fragment to light | Per-pixel loop; SDF at 50% res | Finite sun shadows (docs-recommended), soft AO |
| 8 | Tile light levels (flood fill on the CPU) | Write per-tile light into an Image → ImageTexture (1 px per tile), sample in the TileMap shader with nearest/linear | CPU BFS only when lights change | **Most Tibia-like**, cheapest at runtime |
| 9 | Palette/LUT lighting | Strip LUT or `sampler2D` 3D-in-2D LUT; index palette by light level (DOOM COLORMAP) | 1 texture fetch/pixel | Style lock to palette (Snow/Rain studies) |

Cited support:
- #2: Stardew, and Unity's 0.5-scale light textures.
- #3: Godot docs.
- #4: Godot forum.
- #5 and #6: Godot source and docs.
- #7: Godot docs note and the SDF settings.
- #8: Terraria modes.
- #9: Graveyard Keeper LUTs and Dead Cells gradient maps.

The SubViewport wiring in #2, the BFS-to-texture in #8 and the light-level thresholds are my inferences.

---

## Q4. Day/night techniques

### Takeaway
Use one master "time of day" value t∈[0,1). It drives:
1. **Ambient colour** (a CanvasModulate Gradient, or the light-map fill).
2. Optionally, **a LUT blend** between two of N LUTs.
3. **Sun shadow angle and length** (Graveyard Keeper uses vertex-shader rotation of blob or sprite shadows).
4. **Light-sprite intensity** (Graveyard Keeper).
5. **Window lights switching on at dusk** (Stardew culls window lights in rain or dark).

### Cited
- Graveyard Keeper: ambient gradient, 10 LUTs, light intensity tied to time of day, a vertex-rotated sun shadow plus up to 3 light shadows.
- Stardew: `ambientLight` vs `outdoorLight`, window-light context, rain tint 0.45 OrangeRed.
- Sea of Stars: rotating shadows and warm-to-cool shift (PC Gamer).
- Godot: native directional shadows are infinite, so use the SDF or fake shadows for a sun.

### Inferences
- In Godot, the cheapest convincing sun is a **per-sprite fake shadow**: a duplicated sprite, flattened, skewed and darkened, with skew angle and length driven by t. Native DirectionalLight2D shadows are both infinite and costly.
- A strip LUT (for example 256×16) lerped between two time keys costs 2 texture fetches per pixel in one full-screen pass.

### Gaps
- Colour-temperature (K) values per time of day were not collected here; that is for the sun/sky researcher.

---

## Q5. Numbers collected
- Godot GLES3:
  - 15 effective lights per canvas item.
  - 256 lights per render (64 if UBO < 64 KB).
  - Shadow atlas 2048 × (lights × 2), with 4 passes per point light.
  - PCF taps 1/5/13.
  - SDF at 50% scale with 120% oversize.
  - Item buffer 16384 commands.
- Godot forum: 1st light about −30 fps from 115, then −10, −10, then about −2–3 per extra light (4.5.2, device unknown).
- Light texture size: 320 px on 64 px sprites hit the cap; under 192 px was OK (forum).
- Unity URP 2D: light RT scale 0.5, max 4 light RTs, 1 shadow RT.
- Stardew: light-map scaled by `lightingQuality/2`, linear upscale, on-screen cull radius ×256 px.
- Graveyard Keeper: 10 LUTs, ≤4 shadows per object, about 10 shadow sprite shapes.
- Children of Morta: pixel art upscaled about 4× to 1080p, lights at HD resolution.
- Terraria: torch 42 tiles in air; 4 lighting modes from Low to High cost.

## Sources
- Godot docs source, 2D lights and shadows (master): https://raw.githubusercontent.com/godotengine/godot-docs/master/tutorials/2d/2d_lights_and_shadows.rst (rendered: https://docs.godotengine.org/en/4.5/tutorials/2d/2d_lights_and_shadows.html)
- Godot GLES3 canvas renderer: https://raw.githubusercontent.com/godotengine/godot/master/drivers/gles3/rasterizer_canvas_gles3.h , https://raw.githubusercontent.com/godotengine/godot/master/drivers/gles3/rasterizer_canvas_gles3.cpp , https://raw.githubusercontent.com/godotengine/godot/master/drivers/gles3/shaders/canvas.glsl
- Godot RD canvas renderer header: https://raw.githubusercontent.com/godotengine/godot/master/servers/rendering/renderer_rd/renderer_canvas_render_rd.h
- Godot class refs: https://raw.githubusercontent.com/godotengine/godot/master/doc/classes/Light2D.xml , https://raw.githubusercontent.com/godotengine/godot/master/doc/classes/PointLight2D.xml , https://raw.githubusercontent.com/godotengine/godot/master/doc/classes/DirectionalLight2D.xml , https://raw.githubusercontent.com/godotengine/godot/master/doc/classes/ProjectSettings.xml
- Godot forum, light cap and workarounds: https://forum.godotengine.org/t/working-around-godots-2d-light-limitations-for-a-dark-game/81311
- Godot forum, PointLight2D performance: https://forum.godotengine.org/t/pointlight2d-performance-and-optimization/137342
- Stardew draw loop (SMAPI SGame.cs mirror): https://git.nea.moe/github/SMAPI.git/plain/src/SMAPI/Framework/SGame.cs
- Unity URP 2D Renderer asset reference: https://docs.unity.com/en-us/engine/6000.3/manual/unity2d/2d-urp/2drenderer-data-overview
- Unity, Introduction to 2D lighting: https://docs.unity.com/en-us/engine/6000.3/manual/unity2d/2d-urp/2d-index/lights-2d-intro
- Graveyard Keeper effects blog: https://slava.lazybeargames.com/graveyard-keeper-how-the-graphics-effects-are-made (also https://www.gamedeveloper.com/programming/graveyard-keeper-how-the-graphics-effects-are-made)
- Dead Cells colour and normal maps: https://gamedeveloper.com/production/art-design-deep-dive-giving-back-colors-to-cryptic-worlds-in-i-dead-cells-i-
- Children of Morta art: https://techraptor.net/content/how-dead-mage-created-the-art-for-children-of-morta
- Eastward pipeline: https://www.gamedeveloper.com/art/eastward-s-creators-share-insights-on-making-pixel-art-adventures
- Sea of Stars lighting demo: https://www.pcgamer.com/sea-of-stars-is-a-gorgeous-retro-rpg-from-the-makers-of-the-messenger ; day/night clip: https://techraptor.Net/gaming/news/sea-of-stars-gameplay-clip-shows-day-night-cycle ; art: https://megavisions.net/the-art-of-sea-of-stars-a-sea-of-pixels
- Terraria Lighting mode: https://terraria.wiki.gg/wiki/Lighting_mode ; Lighting values: https://terraria.wiki.gg/wiki/Lighting
- Hand-painted normals for pixel art (Michael Vicente): https://80.lv/articles/exploring-next-gen-pixel-art-with-real-time-dynamic-lighting
- Laigter (normal-map generator recommended by Godot docs): https://azagaya.itch.io/laigter

### "See it in action" references
- Stardew: gap. No visual reference page was fetched; the code source is SGame.cs above.
- Graveyard Keeper: the blog above (has GIFs).
- Terraria modes: the wiki page above.
- Sea of Stars: the PC Gamer article above.
- Dead Cells: the Game Developer article above.
