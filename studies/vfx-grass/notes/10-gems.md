# 10. Gems: open-source code and tools for grass, wind and small life

Researcher 10. Angle is field-validated code a small Godot 4 web team can lift, read or learn from.
All licence files, star counts and last-push dates were read on 2026-11-11 through the GitHub API (`gh api repos/<owner>/<repo>`) unless noted.
Licence flags: Low (MIT/BSD/Apache/CC0), LGPL, Copyleft (GPL/AGPL/CC BY-SA), None (no licence), NC (non-commercial art).

## Quick verdict

- The one real 2D drop-in is Dynamic 2D Grass (Jomoho Games, MIT code, CC BY 4.0 art). It ships with `gl_compatibility` set for desktop and mobile, uses chunked `MultiMeshInstance2D` plus a camera-sized `SubViewport` effector map, and steps animation at 5 fps. Read it first.
- For per-sprite sway, the CC0 Godot Shaders entries are enough. Two of them snap to whole texels (`round()` or `floor()`), which is the Forest D1 rule in shader form.
- For trail maps that persist, Godot 4.7's `DrawableTexture` (official demo, Compatibility renderer) is the newest option. It lets a script paint into a texture without a SubViewport.
- Small life has almost no Godot packages. The best references are code you read, not code you install: Nicky Case's Fireflies (CC0), Stardew's decompiled `Butterfly.cs`, `Firefly.cs`, `Grass.cs` (no licence, read only), and the Godot `bullet_shower` server demo for drawing thousands of critters cheaply.
- Grid regrowth rules are best learned from Luanti `minetest_game` (LGPL code) and Shattered Pixel Dungeon (GPL, copyleft). Copy the numbers and the idea, write the code yourself.
- Most "Godot grass" stars belong to 3D tools (ProtonScatter 3,027, Spatial Gardener 1,321, GodotGrass 702, SimpleGrassTextured 585). They do not help a 32x32 tile game.

## Q1. Is there a drop-in 2D pixel grass system for Godot 4 web?

### Takeaway
Yes, one. Dynamic 2D Grass covers grass placement from a TileMapLayer, sway, colour patches, trampling, destruction and cloud shadows. It is young (10 stars, v1.0.2) but readable, MIT, and configured for the Compatibility renderer. Everything else in 2D is a Godot 3 prototype.

### Cited findings
- Dynamic 2D Grass, https://github.com/mlaass/dynamic-2d-grass . Asset Library id 4949, Godot 4.5, MIT, modified 2026-03-24 (https://godotengine.org/asset-library/api/asset?filter=grass). Itch page https://jomoho.itch.io/dynamic-2d-grass .
  - `LICENSE.txt` splits code (MIT, "Copyright (c) 2026 Jomoho Games, Based on original work by Dylearn") and art (CC BY 4.0, credit Dylearn). Flag Low for code. Art is commercial-OK with attribution.
  - `project.godot` sets `renderer/rendering_method="gl_compatibility"` and the same for mobile.
  - `GrassChunkManager2D.gd` pre-computes per-chunk MultiMesh buffers with `TRANSFORM_2D` and assigns a pool of `MultiMeshInstance2D` nodes to visible chunks. Defaults: `density = 6` blades per tile, `chunk_size = 16` tiles, `grass_sprite_size = 16x24`, `wind_sway_pixels = 5.0`, `wind_speed = 0.025`, `wind_direction = (0, 1)`.
  - `Grass2D.gdshader` has `framerate = 5.0` with `quantised = true` (stepped animation), dual scrolling wind noise, `world_scale = 96`, `fake_perspective_scale = 0.3`, and three noise-thresholded colour patches plus two accent sprite variants (accent 1 frequency 0.001).
  - `GrassEffectManager2D.gd` creates a `SubViewport` with `UPDATE_ALWAYS`, sized to the screen times `viewport_scale` (0.25 to 1.0 in steps of 0.25), and snaps its camera to texels "prevents sub-texel rasterization flicker".
  - Effector channels: R displacement, G coverage (destroy/regrow), B cloud Y offset, A cloud immunity. `effector_channel.gdshader` uses `hint_screen_texture` with `blend_disabled`, and needs a `BackBufferCopy` before each effector sprite.
  - Last commit 2026-04-19 ("Bump version to 1.0.2").
- CaptainProton42 2DGrassShaderDemo, https://github.com/CaptainProton42/2DGrassShaderDemo . MIT, 60 stars, last push 2020-11-03, Godot 3 (`config_version=4`). One fullscreen fragment shader where each pixel is one blade. The red channel value is the blade height in pixels, and the user paints that channel at runtime. Live demo https://captainproton42.github.io/2DGrassShaderDemo/ .
- nekotogd Godot_2D_Grass_Particles, https://github.com/nekotogd/Godot_2D_Grass_Particles . CC0, 33 stars, last push 2022-06-30, Godot 3. A particle shader places blades on a grid by `INDEX`; the blade shader stomps everything inside a circle around one player position and rotates vertices for wind. Video https://youtu.be/X7t3arcWNdc?t=165 .
- GrassPath2D (thrbr84), https://github.com/thrbr84/godot_TBP_GrassPath2D . MIT, 13 stars, last push 2023-04-04, Godot 3.2, tested GLES2/GLES3 on PC and Android. Side-view grass along a `Path2D` with per-leaf physics. README warns `interval` under 15 "can significantly lose performance" with `interactive` on.
- Godot-interactive-grass-particle-plugin (Qhunliv13), https://github.com/Qhunliv13/Godot-interactive-grass-particle-plugin . MIT, 0 stars, last push 2025-11-25. No maturity evidence.

### Inferences
- Dynamic 2D Grass's effector map is redrawn every frame from live effector sprites. Trampling recovers only if the effector sprite fades, and anything off-camera is forgotten. For Asterion Online, a server-owned per-tile state must feed persistent effectors (or a DrawableTexture, see Q3).
- One `BackBufferCopy` per effector is a full-target copy in the worst case. With 30 visible players this could dominate the effector cost on mobile. Unmeasured; test before adopting as-is. A single "all walkers" sprite batch writing only R with additive blend would avoid it.
- 6 blades per 32x32 tile at 320x180 is about 10x6 tiles on screen, so roughly 360 blade instances. That is tiny for MultiMesh. Estimate.
- The 16x24 blade size is tuned for 16 px tiles. At 32 px tiles, raise density or blade size.

### Gaps
- No published frame-time numbers for Dynamic 2D Grass. No shipped game uses it yet that I could find.
- I did not confirm that `hint_screen_texture` inside a SubViewport behaves the same on WebGL2 as on desktop GL.

## Q2. Which wind and sway shaders are worth copying?

### Takeaway
Use a CC0 Godot Shaders entry as a base, keep whole-pixel snapping, and add a per-instance phase. The pixel-snapped ones match the Forest study's integer-offset rule. None of them measure cost, but all are a single texture fetch plus a sine or noise sample per fragment.

### Cited findings
- "Wind with pixel snapping" by Stixxy, CC0 code, posted 2025-05-10, https://godotshaders.com/shader/wind-with-pixel-snapping/ . Shifts texels in `fragment()` and wraps the offset in `round()` so motion lands on whole texture pixels. Phase comes from world X, set in `vertex()`. Uniforms `windCutoff` 8.0, `windSpeed` 1.0, `windStrength` 1.0. Also tints RGB by `windOffset * 0.15`. Author says it is untested on many sprite sizes.
- "2D Pixel perfect wind & sway effect" by kaeylos, CC0, posted 2026-06-25, https://godotshaders.com/shader/2d-pixel-perfect-wind-sway-effect/ . Snaps local UV with `floor(local_uv * region_size_px) / region_size_px`. Works on atlas regions through `REGION_RECT`, which the author exposed in Godot PR #90436 for 4.5. One sine for the whole sprite, so no per-object phase.
- "Topdown wind shader" by ReallyOkeyFruit, CC0, posted 2023-03-20, https://godotshaders.com/?p=4828 . Godot 3 vertex shear, `max(0, (1 - UV.y) - heightOffset)` times a `wind` vec2. The noise the author mentions is not in the code, so a script must animate `wind`.
- Other entries found but not opened: "2D Wind Sway / Tree & Grass Motion Shader" https://godotshaders.com/shader/2d-wind-sway-tree-grass-motion-shader/ , "2D Foliage Wind Effect" (Godot 4.4, UV rotation around a pivot plus noise) https://godotshaders.com/shader/2d-foliage-wind-effect/ , "Animated Grassy Wind or Cloud Shadow Pixel Patches Overlay" https://godotshaders.com/?p=13985 . The site states shader code is CC0 by default and images are not covered.
- GDQuest godot-shaders, https://github.com/gdquest-demos/godot-shaders . 4,202 stars, last push 2026-05-16. `LICENSE` says code is MIT and art is CC BY-NC-SA 4.0. Flag Low for code, NC for art. Same split for godot-visual-effects (1,348 stars, last push 2026-05-16), https://github.com/gdquest-demos/godot-visual-effects .

### Inferences
- The best sway recipe combines kaeylos's `floor()` texel snap with Stixxy's world-X phase and Dynamic 2D Grass's 5 fps quantised time. That gives integer motion, spatial waves and a pixel-art frame rate.
- Vertex shear (ReallyOkeyFruit) is cheapest but smears pixels unless the offset is rounded to the art pixel size before it reaches `VERTEX`.

### Gaps
- No entry publishes ms costs or WebGL2 testing. Shadertoy grass shaders were not catalogued because their licence is unclear (see Q6).

## Q3. Trail and interaction maps in Godot Compatibility

### Takeaway
Three working patterns exist in public code. A per-frame SubViewport of effector sprites (Dynamic 2D Grass). A painted texture where colour equals blade height (CaptainProton42). And from Godot 4.7, `DrawableTexture`, which paints into a texture directly. For a persistent footpath that decays over minutes, DrawableTexture or an `Image` updated on the CPU at low resolution fits best.

### Cited findings
- Godot official `2d/drawable_textures` demo, MIT, Godot 4.7, "Renderer: Compatibility", https://github.com/godotengine/godot-demo-projects/tree/master/2d/drawable_textures . Docs https://docs.godotengine.org/en/stable/tutorials/rendering/drawable_textures.html .
- CaptainProton42 renders the height texture to its own Viewport so the grass shader can read it, and edits the red channel from a script (README, link in Q1).
- Dynamic 2D Grass, R channel displacement and G coverage, ADD or SUB blend per effector (README).

### Inferences
- DrawableTexture needs Godot 4.7. Projects on 4.3 to 4.6 fall back to an `ImageTexture` updated from a small `Image` (for example one texel per 32x32 tile) or a SubViewport with `UPDATE_ONCE` toggled when something changes.
- For a server-authoritative MMO the trail map is a client view of per-tile wear bytes. The texture is never the source of truth.

### Gaps
- I did not read the DrawableTexture API or measure its upload cost on WebGL2.

## Q4. Regrowth, spread and trampling rules in shipped open-source games

### Takeaway
Shipped games use tiny discrete rules on a tile grid. Luanti spreads grass with a 1-in-50 chance every 6 s per eligible dirt node. Shattered Pixel Dungeon turns high grass into short grass on step and rolls loot. Pokémon Emerald plays a 5-frame rustle on the tile you enter. All three are cheap enough for a server.

### Cited findings
- Luanti `minetest_game`, https://github.com/luanti-org/minetest_game . 1,577 stars, last commit 2026-10-30. `mods/default/license.txt` says code is LGPL 2.1, media CC BY-SA 3.0. Flag LGPL (code), Copyleft (textures).
  - `mods/default/functions.lua`, ABM "Grass spread" on `default:dirt`, `interval = 6`, `chance = 50`, `catch_up = false`. Needs light 13 or more above. Copies the type of a spreading neighbour within radius 1, else picks snow, dry grass or grass from the node on top.
- Shattered Pixel Dungeon, https://github.com/00-Evan/shattered-pixel-dungeon . GPL-3.0, flag Copyleft. 6,786 stars, last push 2026-11-10, shipped on Android, iOS and Steam.
  - `levels/features/HighGrass.java`, `trample()` sets the tile to `Terrain.GRASS` (or `FURROWED_GRASS` for the Huntress, who does not flatten it). Seed chance scales from 1/25 to 1/9 with Sandals of Nature. Dew chance from 1/6 to 1/4, halved on grass-feeling levels.
- pret pokeemerald, https://github.com/pret/pokeemerald . No licence file, flag None (read only). 3,684 stars, last push 2026-10-01.
  - `src/data/field_effects/field_effect_objects.h`, `sAnim_TallGrass` is 5 frames of 10 ticks each, ending on frame 0.
  - `src/field_effect_helpers.c` has `FldEff_TallGrass`, `FldEff_LongGrass` and `UpdateGrassFieldEffectSubpriority`, which reorders the grass sprite against the linked object so the lower body is hidden.
  - pokecrystal (2,548 stars) and pokefirered (1,708 stars) are also unlicensed.
- snesrev zelda3, https://github.com/snesrev/zelda3 . `LICENSE.txt` is MIT (2022 snesrev, 2021 elzo_d), 5,000 stars. Needs the original ROM for assets. I did not open its bush and grass code.

### Inferences
- Luanti's rule means an eligible dirt tile waits 300 s on average (6 s / (1/50)) before it turns green. Good starting value for an MMO regrowth tick. The server can process a random subset per tick instead of every tile.
- Pokémon's rustle lasts 50 ticks, about 0.84 s at 59.73 fps.
- SPD shows the "step changes tile ID" model, which costs one tile update message per trample.

### Gaps
- Did not check Cataclysm DDA, Veloren or Terraria grass rules. Did not open zelda3 bush code.

## Q5. Small life: butterflies, fireflies, flocks

### Takeaway
Read Nicky Case's Fireflies for synchronised flashing and Stardew for critter motion numbers, then render many critters through `RenderingServer` like the `bullet_shower` demo. The only Godot flocking addon is a Rust GDExtension with 16 stars.

### Cited findings
- ncase/fireflies, https://github.com/ncase/fireflies . `LICENSE.txt` is CC0 1.0, flag Low. 351 stars, last push 2020-01-18 (finished, not abandoned). Live at https://ncase.me/fireflies/ .
  - `js/index.js`, `FLY_CLOCK_SPEED = 0.3`, `FLY_RADIUS = 200`, `FLY_PULL = 0.035`, `FLY_SWERVE = 0.1`, speed 0.5 to 1.5 per frame. 150 fireflies per 1280x600, minimum 100.
  - Each frame `clock += (delta/60) * 0.3`. At `clock > 1` it flashes, resets to 0, and bumps every neighbour within 200 px by `ff.clock * 0.035` (proportional nudge, capped at 1). `flash.alpha *= 0.9` per frame. Wings swap between 2 frames every frame.
- Stardew Valley decompile, https://github.com/veywrn/StardewValley . No licence, flag None (copyrighted game code, read only). 341 stars, last push 2021-01-24.
  - `TerrainFeatures/Grass.cs`, `maximumShake = PI/8`, `defaultShakeRate = PI/80`, `shakeDecayRate = PI/350`, scaled by collider speed. Plays `grassyStep` only if on screen and not already playing.
  - `BellsAndWhistles/Butterfly.cs`, `flapSpeed = Random.Next(45, 80)` ms per frame, 4-frame flap (1, 2, 3, 2). A flap impulse every `200 ± 5` ms adds X jitter of ±0.8 and sets Y upward, clamped at 1.5 X and 3 Y.
  - `BellsAndWhistles/Firefly.cs`, random walk with motion clamped to ±1 per tick and jitter 0.1. Each firefly owns a `LightSource` of radius 0.4 to 0.5, tinted `Color.Purple * 0.8`.
- Boids (2D/3D flocking), https://github.com/90-008/godot_boids (earlier homes yusdacra and git.gaze.systems/dusk). MIT, 16 stars, v0.1.2 2025-11-28, Asset Library id 3284, Godot 4.3, project set to "GL Compatibility". Rust GDExtension with Linux, Windows and web (wasm) builds. README reports about 2,000 boids in one flock at 11 ms physics tick on a Ryzen 5600, without spatial partitioning. Avoidance is still a to-do.
- Godot `2d/bullet_shower` demo, MIT, Godot 4.7, Compatibility, https://github.com/godotengine/godot-demo-projects/tree/master/2d/bullet_shower . Draws many objects through low-level servers, see https://docs.godotengine.org/en/latest/tutorials/performance/using_servers.html .
- OpenSteer, https://github.com/meshula/OpenSteer . `COPYING.OPENSTEER` is MIT (2002-2005 Sony Computer Entertainment America, Craig Reynolds). 376 stars, last push 2023-03-31. C++ reference for seek, flee, wander, separation.
- Yuka, https://github.com/Mugen87/yuka . MIT, 1,466 stars, last push 2026-10-20. JavaScript game AI with steering behaviours. Good for web canvas prototypes.
- lmcdd/boids_godot2, MIT, 8 stars, last push 2017-01-19, Godot 2. Abandoned.

### Inferences
- Fireflies period is 1/0.3 = 3.3 s if Pixi's `delta` is about 1 at 60 fps. Flash fades to 10% in about 22 frames (0.37 s). Wing flap is 30 Hz at 60 fps.
- The Fireflies sync loop is O(n²) only on flash frames. With 100 flies flashing every 3.3 s that is about 3,000 distance checks per second. Trivial in GDScript.
- Stardew grass swings out at 2.25° per frame and settles in roughly 0.7 s at 60 fps. Butterfly wingbeat is 180 to 320 ms per cycle (3.1 to 5.6 Hz).
- Stardew's per-firefly LightSource is pretty but costs one light each. In Compatibility, limited 2D lights make an additive glow sprite or the study #5 light map the safer choice.

### Gaps
- No Godot butterfly, firefly or critter packages exist on the Asset Library (queries "butterfl", "firefl", "insect", "critter" returned nothing on 2026-11-11). No PICO-8 carts were checked. Nature of Code's 2024 repo (https://github.com/nature-of-code/noc-book-2, 1,967 stars) has no licence field, so I left it out.

## Q6. Tools to skip or treat with care

### Cited findings
- SimpleGrassTextured, https://github.com/IcterusGames/SimpleGrassTextured . MIT, 585 stars, v2.1.1 2026-10-31. 3D. Has an interactive mode fed by `SimpleGrass.set_player_position()`.
- ProtonScatter, https://github.com/HungryProton/scatter . MIT, 3,027 stars, last push 2026-09-27. 3D prop scatter.
- Spatial Gardener, https://github.com/dreadpon/godot_spatial_gardener . MIT, 1,321 stars, last push 2025-03-05. 3D plant painting.
- GodotGrass (2Retr0), https://github.com/2Retr0/GodotGrass . MIT, 702 stars, last push 2024-08-16, Godot 4.3 Forward Plus. Per-blade 3D grass inspired by Ghost of Tsushima. Not for the web renderer.
- Terrain3D, https://github.com/TokisanGames/Terrain3D . MIT, 4,762 stars. 3D terrain with instancer.
- Malidos Grass-Shader-Example, https://github.com/Malidos/Grass-Shader-Example . README says "CC0" but there is no LICENSE file and the API reports none. 19 stars, Godot 4.2 Forward Plus, 3D MultiMesh. Treat as None until a file exists.
- Dylearn 3D Pixel Art Grass Demo copy (LoungeKing123), https://github.com/LoungeKing123/Dylearn-3D-Pixel-Art-Grass-Demo . 0 stars, Godot 4.4 Forward Plus, no SPDX licence. Third-party re-upload, so provenance is unclear.
- AndreVallestero godot-grass-shader, MIT, 4 stars, last push 2022-07-04, no code language detected. Likely abandoned.
- Shadertoy. A forum post claims the default is CC BY-NC-SA 3.0 (https://magicmusicvisuals.com/forums/viewtopic.php?p=9451). I could not confirm it on Shadertoy itself. Treat as NC unless the shader states its own licence.

## Catalogue

| # | Name | Licence (flag) | Maturity (read 2026-11-11) | Godot / Compat | What it saves |
|---|------|----------------|----------------------------|----------------|----------------|
| 1 | Dynamic 2D Grass (mlaass/Jomoho) | MIT code, CC BY 4.0 art (Low) | 10★, v1.0.2 2026-04-19, AssetLib 4949 | 4.5, project set to Compatibility | Chunked MultiMesh grass from TileMapLayer, 5 fps sway, effector trample/cut/regrow map |
| 2 | Wind with pixel snapping (Stixxy) | CC0 (Low) | posted 2025-05-10 | 4.x canvas_item, Compat likely | Whole-texel sway with world-X phase |
| 3 | 2D Pixel perfect wind & sway (kaeylos) | CC0 (Low) | posted 2026-06-25 | 4.5+ (REGION_RECT) | Atlas-safe texel-snapped sway |
| 4 | Topdown wind shader (ReallyOkeyFruit) | CC0 (Low) | posted 2023-03-20 | Godot 3, port needed | Minimal vertex shear |
| 5 | GDQuest godot-shaders | MIT code, CC BY-NC-SA art (Low + NC) | 4,202★, push 2026-05-16 | Godot 4 | Shader library and patterns |
| 6 | GDQuest godot-visual-effects | MIT code, CC BY-NC-SA art (Low + NC) | 1,348★, push 2026-05-16 | Godot 4 | VFX patterns |
| 7 | Godot demo drawable_textures | MIT (Low) | official, 9,785★ repo | 4.7, Compatibility | Paintable trail map without SubViewport |
| 8 | Godot demo bullet_shower | MIT (Low) | official | 4.7, Compatibility | Thousands of sprites via servers (critters, pollen) |
| 9 | CaptainProton42 2DGrassShaderDemo | MIT (Low) | 60★, push 2020-11-03 | Godot 3 | Per-pixel blade shader, paintable height map |
| 10 | nekotogd Godot_2D_Grass_Particles | CC0 (Low) | 33★, push 2022-06-30 | Godot 3 | Particle-grid grass with stomp circle |
| 11 | GrassPath2D (thrbr84) | MIT (Low) | 13★, push 2023-04-04 | Godot 3.2, GLES2 OK | Side-view interactive grass (wrong view) |
| 12 | Godot-interactive-grass-particle-plugin | MIT (Low) | 0★, push 2025-11-25 | Godot 4 | Unproven |
| 13 | Boids 2D/3D (90-008) | MIT (Low) | 16★, v0.1.2 2025-11-28, AssetLib 3284 | 4.3, Compatibility, wasm | 2,000 boids at 11 ms |
| 14 | ncase/fireflies | CC0 (Low) | 351★, finished 2020 | Web (Pixi) | Pulse-coupled sync with tuned constants |
| 15 | OpenSteer | MIT (Low) | 376★, push 2023-03-31 | C++ | Reynolds steering reference |
| 16 | Yuka | MIT (Low) | 1,466★, push 2026-10-20 | JS | Steering behaviours for web prototypes |
| 17 | Stardew decompile (veywrn) | None | 341★, push 2021-01-24 | C# | Grass shake, butterfly, firefly numbers (read only) |
| 18 | minetest_game | LGPL 2.1 code, CC BY-SA 3.0 media (LGPL, Copyleft) | 1,577★, commit 2026-10-30 | Lua | Grass spread ABM rule |
| 19 | Shattered Pixel Dungeon | GPL-3.0 (Copyleft) | 6,786★, push 2026-11-10, shipped | Java | High grass trample and loot rules |
| 20 | pret pokeemerald | None | 3,684★, push 2026-10-01 | C | Tall grass rustle and sprite ordering |
| 21 | snesrev zelda3 | MIT code, ROM needed (Low) | 5,000★, push 2026-10-02 | C | Bush and grass cutting reference (unread) |
| 22 | SimpleGrassTextured | MIT (Low) | 585★, v2.1.1 2026-10-31 | 4.x, 3D | 3D only |
| 23 | ProtonScatter | MIT (Low) | 3,027★ | 4.x, 3D | 3D only |
| 24 | Spatial Gardener | MIT (Low) | 1,321★, push 2025-03-05 | 4.x, 3D | 3D only |
| 25 | GodotGrass (2Retr0) | MIT (Low) | 702★, push 2024-08-16 | 4.3 Forward Plus | 3D, not web |
| 26 | Malidos Grass-Shader-Example | None (README says CC0, no file) | 19★, push 2024-07-19 | 4.2 Forward Plus | 3D MultiMesh example |
| 27 | lmcdd/boids_godot2 | MIT (Low) | 8★, push 2017 | Godot 2 | Abandoned |
| 28 | AndreVallestero godot-grass-shader | MIT (Low) | 4★, push 2022-07-04 | unclear | Likely abandoned |

Abandoned or broken: 9, 10, 11 (Godot 3 only), 27 (Godot 2), 28 (no code detected), 26 (licence unclear), Dylearn re-upload (provenance unclear).

## Sources
- https://github.com/mlaass/dynamic-2d-grass
- https://jomoho.itch.io/dynamic-2d-grass
- https://godotengine.org/asset-library/api/asset?filter=grass
- https://godotengine.org/asset-library/api/asset?filter=boids
- https://github.com/CaptainProton42/2DGrassShaderDemo
- https://captainproton42.github.io/2DGrassShaderDemo/
- https://github.com/nekotogd/Godot_2D_Grass_Particles
- https://youtu.be/X7t3arcWNdc?t=165
- https://github.com/thrbr84/godot_TBP_GrassPath2D
- https://github.com/Qhunliv13/Godot-interactive-grass-particle-plugin
- https://godotshaders.com/shader/wind-with-pixel-snapping/
- https://godotshaders.com/shader/2d-pixel-perfect-wind-sway-effect/
- https://godotshaders.com/?p=4828
- https://godotshaders.com/shader/2d-wind-sway-tree-grass-motion-shader/
- https://godotshaders.com/shader/2d-foliage-wind-effect/
- https://godotshaders.com/?p=13985
- https://github.com/gdquest-demos/godot-shaders
- https://github.com/gdquest-demos/godot-visual-effects
- https://github.com/godotengine/godot-demo-projects/tree/master/2d/drawable_textures
- https://docs.godotengine.org/en/stable/tutorials/rendering/drawable_textures.html
- https://github.com/godotengine/godot-demo-projects/tree/master/2d/bullet_shower
- https://docs.godotengine.org/en/latest/tutorials/performance/using_servers.html
- https://github.com/luanti-org/minetest_game
- https://github.com/00-Evan/shattered-pixel-dungeon
- https://github.com/pret/pokeemerald
- https://github.com/snesrev/zelda3
- https://github.com/ncase/fireflies
- https://ncase.me/fireflies/
- https://github.com/veywrn/StardewValley
- https://github.com/90-008/godot_boids
- https://git.gaze.systems/dusk/godot_boids
- https://github.com/meshula/OpenSteer
- https://github.com/Mugen87/yuka
- https://github.com/IcterusGames/SimpleGrassTextured
- https://github.com/HungryProton/scatter
- https://github.com/dreadpon/godot_spatial_gardener
- https://github.com/2Retr0/GodotGrass
- https://github.com/TokisanGames/Terrain3D
- https://github.com/Malidos/Grass-Shader-Example
- https://github.com/LoungeKing123/Dylearn-3D-Pixel-Art-Grass-Demo
- https://magicmusicvisuals.com/forums/viewtopic.php?p=9451
- https://forum.godotengine.org/t/help-with-interactable-grass-shader-in-godot-4-3/90521
