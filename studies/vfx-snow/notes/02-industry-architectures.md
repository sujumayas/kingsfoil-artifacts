# 02 — Mainstream industry snow architectures, mapped down to 2D top-down pixel art (Godot 4)

Researcher angle: what AAA/AA studios actually ship for (a) deformable snow, (b) accumulation/coverage, (c) falling snow, (d) time/melt. For each, I give the core trick and a cheap 2D Godot 4 equivalent.

Legend: **[C]** = cited finding (URL given). **[I]** = my inference / proposal. **[V]** = vendor- or developer-reported figure, not independently measured. **[RE]** = reverse-engineered by a third party from a frame capture (not official).

---

## Q1. Deformable snow (trails, footprints, refill)

### Takeaway
Almost every shipped system follows one pattern: **a small render target ("trail map" / "deformation heightmap") that covers only a window of the world near the player, written each frame by rendering the snow-affecting objects from a top-down (or bottom-up) orthographic camera, then read by the snow material to lower height / swap texture / change normals.** Differences are mostly in (1) how the window follows the player, (2) whether trails refill, (3) whether the read side uses tessellation, relief/parallax mapping or only normals. Texture sizes are small: 256–1024 px. Cost on PS3/360 was under 1 ms. For a top-down pixel game the read side collapses to "swap sprite/palette where trail value > threshold", so the whole system is a single small texture plus a stamp draw.

### Cited findings — per game

**Batman: Arkham Origins (WB Games Montréal, GDC 2014, Colin Barré-Brisebois)**
- [C] Snow-affecting objects rendered from below with an "ankle-high orthogonal frustum": clear to black, draw actors white, filter and accumulate in a ping-pong texture. Three stages: blur (4-tap bilinear Poisson), add to existing heightmap, shade. — https://www.slideshare.net/colinbb/gdc2014-deformable-snow-rendering-in-batman-arkham-origins
- [C] Heightmap resolution = `Min(512, 1/4 * (SurfaceX, SurfaceY))`, scaled to keep texels about square. One heightmap per snow surface (flat rectangular rooftops), UV 0–1 aligned to the ortho frustum. — same deck
- [C][V] "Heightmaps update < 1.0ms GPU on PS3/360." Memory "2 MB (360 / PS3 / WiiU)", "2-4 MB (FP16 vs FP32 on PC)". — same deck
- [C] **Refill:** in stage 2 a small value is subtracted from the heightmap each update so snow gradually replenishes "since it's snowing". — same deck
- [C] No sliding window: heightmaps are allocated/deallocated per surface based on player/AI position and visibility; **only two surfaces rendered per frame**, prioritised by distance, the one under Batman first. Actor-to-surface lookup via quad tree. — same deck
- [C] Read side: consoles used relief mapping ("virtual displacement"); PC used DX11 tessellation (with NVIDIA). Normals blended with Reoriented Normal Mapping; flattened vs fresh snow materials lerped. — same deck
- [C] Session page: https://www.gdcvault.com/play/1020177/Deformable-Snow-Rendering-in-Batman (GDC 2014, Programming track; no numbers on the page).

**Assassin's Creed III (Ubisoft Montréal, 2012; GDC 2013 "Rendering Assassin's Creed III", J-F St-Amour)**
- [C] Summarised by the Rise of the Tomb Raider team as a "render to vertex buffer trick for GPU tessellation" replacing large triangles with smaller displaced ones; cons: no elevation on trail edges, **no filling over time**, mesh encodes maximum deformation. — https://www.slideshare.net/slideshow/labs-siggraph15trxno-videos/130489149 (slides 90–100)
- [C] Batman deck characterises AC3/Journey approach as raycasting against terrain or modifying the terrain mesh, needing variable triangle density. — Batman deck above
- [C] GDC Vault page lists weather, lighting, ocean, materials; summer and winter settings; no snow numbers. — https://gdcvault.com/play/1017710/contactUs
- Gap: original AC3 slides not retrieved; resolution/cost unknown.

**Rise of the Tomb Raider (Crystal Dynamics/Eidos Montréal Labs, SIGGRAPH 2015; GPU Pro 7 chapter "Deferred Snow Deformation in Rise of the Tomb Raider", Michels & Sikachev)**
- [C] Pipeline: terrain mesh → terrain heightmap; snow mesh → snow heightmap; dynamic objects → **deformation heightmap**. Snow samples the deformation heightmap, deforms vertices, reorients normals. "Deferred" variant adds a step where snow clamps the sampled deformation. Goals include trail **depression and elevation** (raised rims), slopes/forests, scaling to NPCs and animals, and "Fill in blizzard". — https://www.slideshare.net/slideshow/labs-siggraph15trxno-videos/130489149
- [C] Uses "compute shaders and hardware tessellation", mesh-agnostic. — https://history.siggraph.org/wp-content/uploads/2022/10/2015-Talks-Michels_Labs-R_D-Rendering-Techniques-in-Rise-of-the-Tomb-Raider.pdf
- Gap: the texture resolution, area in metres, toroidal addressing and ms cost are in the GPU Pro 7 chapter (paywalled: https://www.taylorfrancis.com/books/9780203705179/chapters/10.1201/b22483-18). I could not verify them, so I do not quote them.

**God of War (2018) — [RE] frame-capture analysis by Mohamed Moniem**
- [RE] Trail painted into a render target that follows the player: "R16G16B16A16_FLOAT render target that is 384*384", only R used. A compute pass converts it to heights in a **1024×1024 R16G16_FLOAT** target. Then three passes: draw walk path, add heights, project to snow mesh in screen space. — https://mamoniem.com/?p=1646
- [RE] Look comes mainly from **screen-space parallax**, not tessellation. Footprint **normal-map decals** (Kratos, Atreus, deer, NPCs) are projected on top; snow decals add snow on object edges/corners. — same
- [C] God of War Ragnarök replaced the 2018 "Screen Space Parallax Mapping" with hardware-tessellated displacement. Capsules on characters and physics bodies carve "every frame at runtime". VFX particles read the displacement on the GPU to collide with the snow. A runtime top-down alpha mask written by VFX drives a detail normal map. Developers say it performs the same as or faster than the old system, with no ms figures given [V]. — https://80.lv/articles/santa-monica-s-senior-programmer-on-how-god-of-war-ragnar-k-s-snow-system-was-made (references GDC 2023 talk by Paolo Surricchio)

**Company of Heroes 2 (Relic, 2013, "ColdTech"; KGC 2013 slides by Daniel Barrero)** — *the most relevant example: a top-down camera game*
- [C] Tracks: moving objects rendered into a **track map with a top-down camera**, clipped at max snow height, **additive shader**. Visual-only: bump mapping on D3D10, tessellation on D3D11. A "Muck map" material driven by track depth reveals mud. Cons: needs high texel density per terrain area, not SLI/Crossfire-friendly, and needs a high frame rate for continuous vehicle tracks. — https://www.slideshare.net/slideshow/daniel-barrero-coh2renderingtech/26765990
- [C] Gameplay: deep snow slows troops more as it builds up; snow "displays a record of everything that's passed by" until it melts or fresh snow covers it; dynamic blizzards; ice can be broken. — https://shacknews.com/article/74964/company-of-heroes-2-chills-out-with-coldtech
- See it in action: same Shacknews article. Search "Company of Heroes 2 ColdTech trailer" on YouTube.

**Slime Rancher 2 (Monomi Park) — stylised, Unity**
- [C] One **RGBA "interaction buffer"** that accepts positive and negative values: R = ground/snow, G = grass, B = water ripples, A = extra grass push-down. Captured only in front of the player and faded with distance. Interactions also fade with vertical distance to avoid problems under bridges and canopies. Snow is pushed down where slimes pass and **raised around the edges**. — https://gamedeveloper.com/design/slime-rancher-2-snow-particle-effects
- [C] "Snow-occlusion quads" around nests/teleporters push snow down. Claims "hundreds of slimes" with a single draw call per interaction type [V]. — same

**Horizon Zero Dawn: The Frozen Wilds (Guerrilla, 2017)**
- [C] New snow deformation: Aloy and creatures cut indents that **reveal grass textures beneath**. Trails persist long enough to read where a fight happened. Aloy's feet kick up snow in deep snow, and her model gets snow textures. — https://www.gamebanshee.com/k4ah6 (Digital Foundry summary)
- Gap: no technical talk found. Reportedly missing in the PC port: https://www.dsogaming.com/news/horizon-zero-dawn-pc-no-snow-deformation-ps4-aloy-hair-bug

**Journey (thatgamecompany, 2012; GDC 2013 "Sand Rendering in Journey", John Edwards)** — sand, same family
- [C] Batman deck groups Edwards' Journey approach with AC3 as terrain-mesh modification. — Batman deck. Session: https://gdcvault.com/play/1017742/Sand-Rendering-in ; shading reconstruction: https://www.alanzucconi.com/2019/10/08/journey-sand-shader-1/
- Gap: trail texture size/cost not retrieved.

**Ghost of Tsushima / Ghost of Yōtei, Red Dead Redemption 2, Death Stranding, SnowRunner**
- [C] Ghost of Yōtei: Atsu can "walk in deep snow" and gets covered in snow. No technical details. — https://80.lv/articles/sucker-punch-breaks-down-tech-that-brought-ghost-of-y-tei-s-world-to-life
- [C] SnowRunner (Saber, Swarm engine): snow is an artist-painted terrain layer (Layer 3 "snow_layer") plus a painted **snow depth** brush. Sub-layers `soft_snow` (forest) and `crust_snow` (compressed, road edges) only change the normal map. A global "Procedural snow coverage" terrain parameter controls snow on models. "Show Snow By Up Vector" previews up-facing snow. — https://expeditions-guides.saber.games/map_modding/creating_a_map/snow_and_ice/adding_snow_and_ice/
- Gap: RDR2 (only forum/press speculation found: https://gamedev.net/forums/topic/700247-snow-physics-in-red-dead-redemption-2/), Death Stranding, and Ghost of Tsushima have no primary technical source I could reach in budget.

**Public tutorials showing the generic recipe**
- [C] Kodeco/raywenderlich UE4 "Creating Snow Trails": capture from **below** (top-down makes a sphere's mask as big as its widest point). Pixel counts as trail if within 25 units of ground. Example RT **256×256**. Two RTs ping-pong (`RT_Capture`, `RT_Persistent`). **Capture snaps to whole texels**: `(floor(Position / PixelWorldSize) + 0.5) * PixelWorldSize`, because sub-texel moves blur the buffer. Persistent buffer is shifted by the move offset; data leaving the window is discarded. — https://www.kodeco.com/5760-creating-snow-trails-in-unreal-engine-4 and https://kodeco.com/5760-creating-snow-trails-in-unreal-engine-4?page=3
- [C] Godot 4 (godotshaders, Sep 2023): SubViewport + Camera3D looking down with `cull_mask = layer2`. Trail particles on each tyre are on render layer 2 only. Ground shader reads `.r` of the ViewportTexture to darken albedo and displace `VERTEX.y` by `r * ditch_height` (default 0.2). No fading. — https://godotshaders.com/shader/car-tracks-on-snow-or-sand-using-viewport-textures-and-particles/

### Summary table (deformation)

| Game | Write side | Trail texture | Window | Refill | Read side | Cost |
|---|---|---|---|---|---|---|
| Batman AO (2013) | ortho cam from below, actors white, ping-pong + Poisson blur | ≤512² per surface, FP16/32 | per-surface, 2 updated/frame | subtract small value per update | relief map (console) / tessellation (PC) | <1 ms PS3/360 [V], 2 MB |
| AC III (2012) | raycast / mesh modification | n/a | n/a | none | render-to-VB tessellation | ? |
| RotTR (2015) | dynamic objects → deformation heightmap (compute) | ? (GPU Pro 7) | ? | "fill in blizzard" goal | tessellation, raised rims | ? |
| GoW 2018 [RE] | paint RT following player | 384² RGBA16F → 1024² RG16F | follows player | ? | screen-space parallax + decals | ? |
| GoW Ragnarök (2022) | capsules carve each frame | ? | displacement area near camera | ? | HW tessellation | "same or faster" [V] |
| CoH2 (2013) | top-down cam, additive, clip at max height | ? (needs high density) | whole map area | melt / fresh snow | bump (DX10) / tess (DX11) + mud reveal | ? |
| Slime Rancher 2 | RGBA interaction buffer, ±values | ? | in front of player, distance fade | ? | vertex offset on "snow-topper" mesh | 1 draw/type [V] |

### Inferences — 2D top-down Godot 4 mapping [I]
1. **Trail map = one SubViewport (2D) the size of the visible play area plus a margin, at 1 texel = 1 art pixel (or 1/2 or 1/4).** For a 320×180 internal resolution with a 64 px margin, that's about 448×308. Smaller than Batman's 512² and essentially free.
   - `render_target_clear_mode = CLEAR_MODE_NEVER`, `render_target_update_mode = UPDATE_ALWAYS`. Then the viewport keeps last frame's content (persistent buffer) with no ping-pong needed for additive stamps.
   - Stamp = a small Sprite2D/`draw_texture` of a footprint or blob drawn at the foot position with `render_mode blend_add` (CoH2's additive track map). For "max" behaviour, use `blend_premul_alpha` with clamped values, or write via a ping-pong shader.
   - No depth test is needed in 2D. "Is the foot on the ground?" is a gameplay flag (grounded and not on a road tile). This avoids the top-down-sphere problem Kodeco warns about.
2. **Following the player:** do one of the following.
   - (a) **Snap and shift (Kodeco):** move the trail window only in whole-texel steps, and when it moves, redraw the old texture offset by −Δ into a second viewport (ping-pong). Discard what leaves.
   - (b) **Toroidal (wrap) addressing:** keep the SubViewport fixed and index it with `fract(world_px / size)` and texture repeat. When the camera crosses into a new row or column, clear only that strip with a thin ColorRect. No copy is needed. This is the classic clipmap trick. RotTR is said to use a sliding window, which I could not verify.
   - (c) **Per-chunk persistence (Batman-style allocation):** one small trail texture per map chunk or room, only the 1–2 nearest updated per frame. This fits an MMO with streamed chunks, and trails survive leaving and coming back. Serialise as a PackedByteArray if they should persist server-side.
3. **Refill (Batman):** every N frames, draw a full-viewport ColorRect with `blend_sub` and colour `(1/255)`. 8-bit RGBA8 means the smallest step is 1/255. Subtracting 1/255 every 0.5 s refills a full-depth footprint in about 128 s. Use `use_hdr_2d` (Godot 4.2+) for float precision if finer control is needed. *Verify the property name on the target Godot version.*
4. **Read side in pixel art:** no displacement. Use a threshold or quantise into 3–4 bands (fresh / shallow print / deep print / bare ground), mapped to palette entries. This is CoH2's "muck map" (track depth reveals mud) and Horizon's "reveal grass underneath". Add one darker "rim" band at the edge of the stamp for the RotTR/Slime Rancher raised-edge look: rim = `blur(trail) - trail > ε`.
5. **CPU alternative (DOOM-fire spirit):** at tile or half-tile granularity, keep a `PackedByteArray` grid (e.g. 128×128 cells around the player), mutate it in GDScript/C#, and upload with `ImageTexture.update()` only when dirty. This gives gameplay access for free (slow down where deep, sled paths, server sync). CoH2 shows a cell map is shipped practice: its ice uses a cell "health" map with neighbour-driven break and refreeze.
6. **Multi-channel buffer (Slime Rancher 2):** pack trail depth (R), "kicked/puff" transient (G), wetness/slush (B), and shelter mask (A) into one RGBA viewport.

### Gaps
- RotTR numbers (resolution, area, ms) are in the paywalled GPU Pro 7 chapter.
- No primary sources reached for RDR2, Death Stranding, Ghost of Tsushima, Horizon FW, or AC3 slides.
- GoW 2018 numbers are reverse-engineered, not official.

---

## Q2. Snow accumulation / coverage (exposed vs sheltered)

### Takeaway
The shipped recipe is **"normal·up mask × top-down occlusion map × artist paint × noise"**. The occlusion map is a depth/height map rendered from the sky direction, like a shadow map from above. It keeps snow off surfaces that something sits above. Edges are softened with erode/dilate and noise. In top-down 2D, "normal·up" becomes "pixel whose upper neighbour is empty or outside the sprite", and the sky-occlusion map becomes a mask of roof and canopy sprites.

### Cited findings
- [C] **Company of Heroes 2:** snow accumulates on near-horizontal surfaces, using normal vs world up. A **top-down depth map ("snow shadow" map)** keeps snow off surfaces that aren't topmost. Real extrusion was rejected for DX10 performance in favour of shader "virtual extrusion", which looks almost the same from the game camera. Edges use **min/max erode and dilate filters on the top-down map plus noise**. Cons: needs high resolution, and the snow map is "costly to generate every frame". The same top-down height map is reused for GPU-raycast AO, which can be precomputed for static objects. — https://www.slideshare.net/slideshow/daniel-barrero-coh2renderingtech/26765990
- [C] CoH2 terrain snow is an artist-driven extra terrain layer affecting height, with procedurally distorted edges. Objects can "suck in" terrain snow material. **Damaging terrain also removes snow from nearby objects.** — same
- [C] SnowRunner: painted snow layer and depth plus global "Procedural snow coverage" and "Show Snow By Up Vector" for models. — https://expeditions-guides.saber.games/map_modding/creating_a_map/snow_and_ice/adding_snow_and_ice/
- [C] God of War 2018 [RE]: separate **snow decals** add snow on object edges and corners and fill where the snow mesh doesn't reach. — https://mamoniem.com/?p=1646
- [C] Academic baseline for occlusion-based accumulation: Ohlsson & Seipel, "Real-time Rendering of Accumulated Snow" (2004), which uses a depth-buffer occlusion test from above plus surface inclination. — https://ep.liu.se/ecp/013/007/ecp01307.pdf (not opened in this pass; title and method from search snippet, so verify)

### Inferences — 2D mapping [I]
1. **Sky-occlusion mask = "shelter" layer.** Every roof, tree canopy, bridge and awning sprite also draws (white) into a shelter SubViewport aligned with the trail map. The snow-ground shader reads `shelter` and multiplies snow coverage by `1 − shelter`. Bake it once per chunk for static objects; that is CoH2's "precompute for static" note, so no per-frame cost.
2. **Soft edges (CoH2 erode/dilate + noise):** blur the shelter mask once at bake time (or dilate 1–2 px), then threshold against a noise texture → ragged, pixel-crisp snow line under eaves. Add wind direction by offsetting the shelter mask downwind by k px. This gives the lee-side-of-walls drift look with no extra cost.
3. **"normal·up" for sprites:** in the sprite shader, `top = alpha(uv) > 0 && alpha(uv − vec2(0, texel.y)) == 0`. Extend down by 1–3 px depending on accumulation level. This gives automatic snow caps on roofs, fences, crates and tree tops with no extra art. An authored "snow cap" mask channel is the higher-taste alternative, matching SnowRunner/artist-paint practice.
4. **Decal-style edge snow (GoW):** scatter small snow-pile sprites at wall/object bases on the windward side.

### Gaps
- No primary source reached for The Last of Us Part II, Uncharted 4, Far Cry 5/New Dawn, or Frostbite snow coverage. The 80.lv TLOU Part I snow/ice shader piece only points to an ArtStation breakdown: https://80.lv/articles/a-closer-look-at-the-last-of-us-part-i-s-snow-ice-shaders

---

## Q3. Falling snow

### Takeaway
Two families: **(a) camera-attached particles** (GPU particles near the camera, possibly colliding with depth), and **(b) image-space layers** (scrolling or procedural textures with several parallax depths in one pass). The classic data point is that the image-space layer was about 5× cheaper than particles in 2006 and does not get more expensive in heavy precipitation. CoH2 (top-down) found blizzard particles caused overdraw and fixed it by rendering weather at half resolution. A pixel-art game is already low-res, so it gets that saving for free.

### Cited findings
- [C][V] **Tatarchuk, ATI ToyShop (SIGGRAPH 2006):** a full-screen composite rainfall layer in one pass. Multiple depth layers are simulated in one geometric layer via an artist "rain parallax" parameter. Each drop has a random value used as the `w` of a projective texture read, so layers fall at different speeds. Uses an animated 8-bit raindrop placement texture. Prior work mapped rain on a camera-aligned double cone. **Timings: composite rainfall 4.11 ms vs raindrop particles (5–10K) 19.45 ms; scene without rain 15.71 ms.** Particles need too many for strong rainfall, and the image-space approach has no extra cost for heavy vs light precipitation. Particles there were CPU-simulated. — https://advances.realtimerendering.com/s2006/Tatarchuk-Rain.pdf
- [C][V] **CoH2:** large blizzard particles → heavy overdraw. Weather FX is rendered to a "1/2 screen resolution texture" and composited as a post-process. Worst-case frame-rate drop went from 30% to below 4%. — https://www.slideshare.net/slideshow/daniel-barrero-coh2renderingtech/26765990
- [C] Horizon Frozen Wilds: snow showers use **lit particles**. — https://www.gamebanshee.com/k4ah6
- [C] GoW Ragnarök: VFX particles read the snow displacement on the GPU to bounce and collide (no screen-space depth collision). — https://80.lv/articles/santa-monica-s-senior-programmer-on-how-god-of-war-ragnar-k-s-snow-system-was-made
- [C] Godot community "Rain and Snow with Parallax Scrolling Effect" shader exists. — https://godotshaders.com/shader/rain-and-snow-with-parallax-scrolling-effect/ (not opened; details unverified)
- Gap: CryEngine precipitation occlusion map docs page did not render (JS). Not verified: https://cryengine.com/docs/static/engines/cryengine-5/categories/23756816/pages/29796935

### Inferences — 2D mapping [I]
1. **Default: one full-screen `ColorRect` canvas shader with 3–4 parallax layers** (ToyShop idea).
   - Per layer: tile the screen into cells, hash the cell id to place at most one flake per cell, and offset by `time * (wind + fall_speed[layer])`.
   - Add a world-space camera offset times a parallax factor, so near layers slide faster when the player walks.
   - Draw flakes as 1×1 / 2×2 / 3×3 px at the internal resolution. Cost is constant regardless of density, matching the Tatarchuk "no extra cost for heavy" point.
2. **Top-down "falling" cue:** in a top-down view, a flake's fall is shown by shrinking size and/or drifting toward a fixed ground shadow, then "landing" (fade or a 1-frame sparkle). The near layer can be bigger and blurrier (out of focus, closest to the camera).
3. **Occlusion under roofs:** multiply the near-ground layer by `1 − shelter` (reuse the Q2 shelter mask) so snow does not visibly land under eaves. This is the 2D analogue of the precipitation occlusion map. Keep upper layers unoccluded, since they fall "above" roofs.
4. **GPUParticles2D for local events only** (kicked-up puffs, roof slides, footstep spray). Use a small `amount` (e.g. 8–32 per emitter), `one_shot`, and a short lifetime. On web (WebGL 2 / Compatibility renderer), CPUParticles2D may be safer. *Verify Compatibility-renderer GPUParticles2D support/perf on the target Godot version.*

---

## Q4. Time: build-up, melt, refill

### Takeaway
Shipped games drive time with **(1) a slow global decrement/increment on the trail buffer** (Batman: subtract a small value each update; RotTR: "fill in blizzard") and **(2) a global coverage scalar** (SnowRunner "Procedural snow coverage"; CoH2 snow until it "melts or fresh snow covers it"). Per-pixel variety comes from comparing the global scalar against a per-pixel threshold (noise × exposure × shelter). Edges, shade and exposure then melt or accumulate in the right order automatically.

### Cited findings
- [C] Batman AO: per-update small subtraction → snow replenishes while snowing. — https://www.slideshare.net/colinbb/gdc2014-deformable-snow-rendering-in-batman-arkham-origins
- [C] RotTR: design goal "Fill in blizzard"; AC3 criticised for "no filling over time". — https://www.slideshare.net/slideshow/labs-siggraph15trxno-videos/130489149
- [C] CoH2: tracks persist until melt or fresh snow; build-up slows troops progressively. Ice cell map with health and neighbour-driven break/refreeze, shader blending **Solid → Broken → Slush → Water** by health. — https://shacknews.com/article/74964/company-of-heroes-2-chills-out-with-coldtech ; https://www.slideshare.net/slideshow/daniel-barrero-coh2renderingtech/26765990
- [C] SnowRunner: global "Procedural snow coverage" scalar on terrain. — https://expeditions-guides.saber.games/map_modding/creating_a_map/snow_and_ice/adding_snow_and_ice/
- [C] Forza Horizon 4 interview: winter is "about much more than just snow". Surface types (about 50) have conductivity affecting tyre temperature. No info on dynamic accumulation. — https://gtplanet.net/forza-horizon-4-dev-interview-recreating-uk-weather-the-arcade-sim-spectrum
- Gaps: MSFS 2020/2024 snow coverage, AC Valhalla, Zelda BOTW/TOTK snowballs, and The Long Dark track fill-in were not researched in budget.

### Inferences — 2D mapping [I]
1. **One global `snow_level` uniform (0..1)** rises while snowing and falls in sun.
   - Per pixel: `threshold = noise(world_px) * a + shelter * b + sun_exposure * c + edge_distance * d`.
   - Snow shows where `snow_level > threshold`.
   - Melting raises the effective threshold faster in sun and at edges, so patches retreat from edges into shade (the "melts at edges first, survives in shade" look) with zero simulation.
   - Quantise into palette bands (powder / packed / slush / wet ground). The slush band appears where `snow_level ≈ threshold`, a natural transition zone. This copies CoH2's Solid→Broken→Slush→Water blend.
2. **Trail refill = Batman subtract.** Scale the subtraction by snowfall intensity: zero when not snowing, so prints persist; when sunny, prints widen (melt) via a 1-px dilate every few seconds instead.
3. **Refreeze:** a CoH2-style cell map (ice health per tile) for puddles/ponds, updated with a tiny neighbour rule, which is the DOOM-fire analogue.

---

## Overall ranking for Asterion Online (top-down pixel, web-first) [I]
1. **Global snow_level + noise/shelter threshold shader** (Q2/Q4). Cheapest and highest impact. No render targets.
2. **Persistent trail SubViewport with stamps + Batman subtract-refill** (Q1). One small texture, about 1 draw per walking character per frame.
3. **Full-screen parallax flake layers** (Q3), occluded near the ground by the shelter mask.
4. **Sprite top-edge snow caps** via alpha-neighbour test (Q2).
5. Optional: **cell-grid (CPU) depth/ice map** for gameplay (slowdown, sled paths, server sync) instead of or alongside the GPU trail map.

---

## Sources
- Barré-Brisebois, "Deformable Snow Rendering in Batman: Arkham Origins", GDC 2014 slides — https://www.slideshare.net/colinbb/gdc2014-deformable-snow-rendering-in-batman-arkham-origins
- GDC Vault session 1020177 — https://www.gdcvault.com/play/1020177/Deformable-Snow-Rendering-in-Batman
- Eidos Montréal Labs, SIGGRAPH 2015 "Rendering Techniques in Rise of the Tomb Raider" slides — https://www.slideshare.net/slideshow/labs-siggraph15trxno-videos/130489149
- SIGGRAPH 2015 talk abstract — https://history.siggraph.org/wp-content/uploads/2022/10/2015-Talks-Michels_Labs-R_D-Rendering-Techniques-in-Rise-of-the-Tomb-Raider.pdf
- GPU Pro 7 chapter, "Deferred Snow Deformation in Rise of the Tomb Raider" (paywalled) — https://www.taylorfrancis.com/books/9780203705179/chapters/10.1201/b22483-18
- St-Amour, "Rendering Assassin's Creed III", GDC 2013 — https://gdcvault.com/play/1017710/contactUs
- Moniem, "Behind the Pretty Frames: God of War" [RE] — https://mamoniem.com/?p=1646
- 80.lv, GoW Ragnarök snow system — https://80.lv/articles/santa-monica-s-senior-programmer-on-how-god-of-war-ragnar-k-s-snow-system-was-made
- Barrero, "Company of Heroes 2 Rendering Tech" (KGC 2013) — https://www.slideshare.net/slideshow/daniel-barrero-coh2renderingtech/26765990
- Shacknews, CoH2 ColdTech — https://shacknews.com/article/74964/company-of-heroes-2-chills-out-with-coldtech
- Game Developer, Slime Rancher 2 snow — https://gamedeveloper.com/design/slime-rancher-2-snow-particle-effects
- GameBanshee / Digital Foundry, Horizon Frozen Wilds — https://www.gamebanshee.com/k4ah6
- DSOGaming, HZD PC no snow deformation — https://www.dsogaming.com/news/horizon-zero-dawn-pc-no-snow-deformation-ps4-aloy-hair-bug
- 80.lv, Ghost of Yōtei tech — https://80.lv/articles/sucker-punch-breaks-down-tech-that-brought-ghost-of-y-tei-s-world-to-life
- Saber map modding guide, Snow and Ice — https://expeditions-guides.saber.games/map_modding/creating_a_map/snow_and_ice/adding_snow_and_ice/
- Journey sand: GDC Vault — https://gdcvault.com/play/1017742/Sand-Rendering-in ; Zucconi — https://www.alanzucconi.com/2019/10/08/journey-sand-shader-1/
- Tatarchuk, "Artist-Directable Real-Time Rain Rendering in City Environments", SIGGRAPH 2006 — https://advances.realtimerendering.com/s2006/Tatarchuk-Rain.pdf
- Kodeco, "Creating Snow Trails in Unreal Engine 4" — https://www.kodeco.com/5760-creating-snow-trails-in-unreal-engine-4 and page 3 — https://kodeco.com/5760-creating-snow-trails-in-unreal-engine-4?page=3
- godotshaders, "Car Tracks On Snow Or Sand" (Godot 4) — https://godotshaders.com/shader/car-tracks-on-snow-or-sand-using-viewport-textures-and-particles/
- godotshaders, "Rain and Snow with Parallax Scrolling Effect" (unopened) — https://godotshaders.com/shader/rain-and-snow-with-parallax-scrolling-effect/
- GTPlanet, Forza Horizon 4 dev interview — https://gtplanet.net/forza-horizon-4-dev-interview-recreating-uk-weather-the-arcade-sim-spectrum
- Ohlsson & Seipel, "Real-time Rendering of Accumulated Snow" (2004, unopened) — https://ep.liu.se/ecp/013/007/ecp01307.pdf
- 80.lv, TLOU Part I snow/ice shaders — https://80.lv/articles/a-closer-look-at-the-last-of-us-part-i-s-snow-ice-shaders
- gamedev.net RDR2 snow thread (speculation only) — https://gamedev.net/forums/topic/700247-snow-physics-in-red-dead-redemption-2/
