# 02 — Mainstream industry architectures for rain and wet surfaces → cheap 2D top-down pixel versions (Godot 4 web)

Researcher angle: how AAA and engines build rain (falling rain, splashes, ripples, puddles, wetness, drying, drips, fog, lightning, weather state), with cost numbers. Each section ends with how to shrink it to a 2D top-down pixel-art version that runs in Godot 4 Compatibility (WebGL2, no compute).

Primary sources actually read in full: Tatarchuk/ATI ToyShop (SIGGRAPH 2006 course chapter and slides); Lagarde/Dontnod "Water drop" 2a, 2b, 3a, 3b (Remember Me, UE3, PS3/X360); CryEngine Rain entity docs; Ubisoft Far Cry 6 weather article; Game Developer write-up of the Ghost of Tsushima GDC 2021 wind talk; EA Battlefield 1 weather article; GTPlanet on Forza Motorsport 7; GamingBolt on Days Gone.

**Main finding:** almost every shipped system is the same small set of parts:
1. A global **rain intensity** scalar, plus slower **wet level** and **flood level** scalars that trail it (they rise and fall at their own rates).
2. A **top-down occlusion map** saying what is under cover.
3. A **screen-space or camera-attached rain layer**. Its cost does not depend on intensity, and it reveals more drops as intensity rises.
4. **Splashes spawned at random visible ground points**. They are not linked to individual drops.
5. **One shared, tiling ripple texture** that is only shown where water has collected.
6. **Wetness as a change to material values**: darker diffuse, glossier surface, weighted by porosity. The lighting model is not changed.

All six translate almost directly into 2D masks and palette ramps.

---

## Q1. Wet surfaces: why wet = darker + more specular, and how games approximate it

**Takeaway.** Rough and porous materials (dirt, stone, brick, wood, cloth, hair) get darker, slightly more saturated and glossier when wet. Smooth and metal materials hardly change apart from a thin water film. Games do not simulate this. They nudge the dry material values toward a wet version with a single wet level, and scale the effect by a porosity value. In pixel art this becomes "shift N steps down the palette ramp, plus sparse highlight pixels", with N set by a per-material porosity byte.

**Cited findings**
- The cues people use: wet surfaces "look darker, more specular" with subtle saturation and hue shifts. This holds for rough or porous, powdered, absorbent and organic materials. Glass, marble, plastic, metal and polished surfaces barely change. [Lagarde 3a]
- Mechanism: water fills the pores until the material is saturated, then forms a thin layer on top. Internal reflections push colour toward more saturation and shift the hue. [Lagarde 3a]
- Lagarde found the full two-layer (water film over material) model too expensive for PS3/X360. Absorption inside a thin film is negligible: a 0 mm film and a 0.5 mm film look almost the same. [Lagarde 3a]
- A drive-simulator classification often reused in games (Nakamae et al., cited by Lagarde 2b):
  - Type 1: dry.
  - Type 2: wet. Diffuse ×0.1–0.3, specular ×5–10.
  - Type 3: drenched, or the edge of a puddle.
  - Type 4: puddle.
- Remember Me's first version, `DoWetProcess`: `Diffuse *= lerp(1, 0.3, WetLevel)` and `Gloss = min(Gloss * lerp(1, 2.5, WetLevel), 1)`. [Lagarde 2b]
- The physically based refinement, using a per-texel porosity value:
  - `factor = lerp(1, 0.2, (1 - Metalness) * Porosity)`
  - `Diffuse *= lerp(1, factor, WetLevel)`
  - `Gloss = lerp(1, Gloss, lerp(1, factor, 0.5 * WetLevel))`

  The 0.2 floor comes from measured drying databases, where wet-to-dry diffuse ratios range from 0.2 to 1.0. Metals are excluded. [Lagarde 3b]
- A measured example of colour-dependent darkening: wood ("Wood Drying 29") wet ≈ dry × (0.82, 0.58, 0.38) RGB. Worn asphalt: albedo 0.12 → 0.08 (factor 0.68), which is sRGB 97 → 81. [Lagarde 3b]
- Porosity can be derived from the gloss texture (remove the smooth values, blur, tweak) and stored as a low-resolution grey channel. [Lagarde 3b]
- The "tweak the material values" approach was used by S.T.A.L.K.E.R. Clear Sky, Uncharted 2/3 (main character), Assassin's Creed 3, Crysis 2/3 and MGS V. Lagarde criticises most of them for applying the same factors to every material, metal included. [Lagarde 3b]
- Far Cry 6 has two layers of wetness:
  - **Static wetness** on props and structures, masked by a "wetness shadow map" (dry under balconies and indoors).
  - **Dynamic wetness** on weapons, vehicles, characters, vegetation and terrain. Exposure is found with ray casts, and a separate "local wetness" handles submersion. [Ubisoft FC6]

**Inferences: 2D Godot mapping**
- Give each tile or material type a **porosity byte** (0–255) and each pixel or tile a **wetness byte**. The darkening becomes a **palette ramp shift**: in a canvas shader, `ramp_idx -= round(porosity * wet * K)`, where K is about 1–2 steps. That matches Lagarde's factor of 0.2–1.0 on a ramp of 4–6 shades.
  - Store wetness in an R8 `ImageTexture` at tile or quarter-tile resolution, updated from the CPU, or in a `SubViewport` ping-pong.
  - Use a 1D palette LUT texture (one row for dry, one for wet) so the shader does a single fetch.
- **"More specular"** in pixel art: add 1–3 highlight pixels per tile wherever `wet > threshold && porosity_low_or_film`. Pick them with a hashed dither (the same threshold trick as the snow study). Flicker them slowly with a time-based hash so they read as glints.
- **Metal and glass tiles** (porosity 0) get no darkening, only glints. Dirt gets the biggest shift. Dirt with high wetness can switch to a separate "mud" ramp: a material reaction, as in the acid study's reaction table.
- Use **per-channel factors** (the wood example) to choose a warmer or more saturated wet palette row, not simply a darker one.

**Gaps.** No primary technical sources were found for GTA V, RDR2, Watch Dogs or Battlefield V wet materials. Courrèges' GTA V study covers a dry scene. The TLOU2 and Uncharted 4 wet-character shaders have no public talk that I could find.

---

## Q2. Puddles: masks, accumulation, flood levels, drying timelines

**Takeaway.** Puddle placement is authored as a **depth mask** (vertex colour, heightmap, or a decal gradient). A global **flood level** is compared with that mask, so puddles grow from the deepest point outward and shrink back. Two flood levels (small cracks vs. puddles) with different fill and dry rates give a believable timeline. This is exactly the snow study's "per-pixel depth byte + threshold", run in reverse.

**Cited findings**
- Remember Me / Lagarde 2b:
  - Puddle cells: `AccumulatedWater = saturate((FloodLevelPuddle - mask) / 0.4)`, where 0.4 is the width of the soft edge.
  - Cracks: `min(FloodLevelCrack, 1 - Heightmap)`.
  - The result is the max of the two.
  - Fully accumulated water: gloss goes to 1, F0 to 0.02 (water), and the normal goes flat.
  - Constraint: all puddles share the same "depth 0" bottom.
- The wet level rises quickly when rain starts and falls slowly after. Flood levels fall even more slowly, and puddles last longer than cracks. The timeline diagram is in 2b.
- **Rain-tier control table** (Lagarde 2a and 2b, inc/dec rates in arbitrary units):

| Tier | Intensity | Splashes | Puddle flood (inc/dec) | Crack flood (inc/dec) | Wet level (inc/dec) | Fog amount |
|---|---|---|---|---|---|---|
| Light | 0.33 | 20 | 0.1 / 0.05 | 0.2 / 0.1 | 0.6 / 0.2 | 0.15 |
| Moderate | 0.66 | 40 | 0.3 / 0.05 | 0.5 / 0.1 | 0.75 / 0.2 | 0.4 |
| Heavy | 1.0 | 60 | 0.7 / 0.05 | 0.85 / 0.1 | 1.0 / 0.2 | 1.0 |

  For drizzle, set the flood increase rate to 0 so nothing floods.
- Tiers come from meteorology: light < 2.5 mm/h, moderate 2.5–7.6 mm/h, heavy > 7.6 mm/h, violent > 50 mm/h. Remember Me skipped "drizzle" because it is barely visible. [Lagarde 2a]
- Lagarde notes that dynamic accumulation only pays off when the player revisits places, as in an open world. Linear games bake it. [Lagarde 2b]
- Puddles also change gameplay feedback: the footstep material switches to water when the vertex colour is black, and foot splashes only play when the flood level allows them. [Lagarde 2b]
- Far Cry 6:
  - Puddles are **terrain decals whose alpha gradient acts as a pseudo signed distance field**, so they grow from the centre.
  - Puddles write into terrain porosity.
  - The road and terrain "recipe" systems scatter them.
  - Procedural rain ripples and wind ripples sit on top. [Ubisoft FC6]
- CryEngine Rain entity: `PuddlesAmount` (depth and brightness), `PuddlesMaskAmount`, `PuddlesRippleAmount`. [CryEngine docs]
- ToyShop: an artist-painted "puddle depth map" blends the object normal toward the ripple normal, with a per-object influence parameter. [Tatarchuk 2006 ch.3 §3.7]
- Forza Motorsport 7: puddles grow lap after lap during a storm. Tyres clear a drying line, and the effects persist after the storm passes. [GTPlanet FM7]

**Drying timeline (cited)**
- Drying is uneven: the specular disappears before the diffuse darkening does, edges and convex parts dry first, and the drying curve fits a sigmoid.
- Gu et al. use a "drying-rate" texture plus an "offset" texture.
- Lagarde's practical advice: real drying takes over 30 minutes, so a game can just lerp to dry in about 1 minute, with puddles drying more slowly. [Lagarde 3b]
- Wetting, by contrast, is "almost instantaneous" on contact. [Lagarde 3b]

**Inferences: 2D Godot mapping**
- **Puddle mask:** an R8 texture over the map, hand-painted or generated from noise in hollows. In the ground shader:
  - `water = clamp((flood - mask) / edge, 0, 1)`
  - Pixels with `water ≥ 1` use the water palette row plus the ripple overlay. Pixels between 0 and 1 use a "drenched" row.
  - Grow and shrink come free from `flood`. **Cost:** 1 texture fetch, 1 subtraction.
- Keep **three global scalars** (`wet`, `flood_crack`, `flood_puddle`), each following `intensity` with its own inc/dec rates from the table. That is three lines of GDScript per frame.
- **Patchy drying:** sample a static R8 "dry offset" noise texture and compare `wet + offset*0.3` instead of `wet`. Edges and raised tiles (low puddle-mask value) dry first. This matches Gu's two-texture approach at almost no cost.
- A puddle-mask threshold also gives gameplay hooks for free: footstep sound and splash, slip chance, and "electric conducts here".

---

## Q3. Falling rain: particles vs. image-space layers, camera-attached geometry, occlusion

**Takeaway.** For many drops, image-space or camera-attached **scrolling texture layers** have a **fixed cost whatever the intensity**. Particles get more expensive as intensity rises. ToyShop's full-screen rain pass cost 4.11 ms, against about 19–20 ms for 5–10K CPU particles. Intensity is shown by revealing more drops of a pre-authored "max rain" texture. Occlusion uses the scene depth plus a top-down "rain depth map". In a top-down 2D game, a full-screen rain shader with 2–3 parallax layers is the natural fit.

**Cited findings**
- **ToyShop** (Tatarchuk, ATI, SIGGRAPH 2006):
  - The composite rain layer is a full-screen quad drawn before post-processing.
  - It uses an 8-bit rainfall texture, scrolled along a velocity vector.
  - "Multiple layers" of depth and speed come from one fetch: a per-drop parallax × distribution value is used as the `w` of a projective texture fetch.
  - Motion blur and glow come from blurring the rain layer in post.
  - Drops are **biased toward white**, borrowing the Hollywood trick of adding milk to rain so it shows on film.
  - The rain quad is switched off by a script when the camera is indoors. Alternative: a precomputed boolean sky-visibility overhead map. [Tatarchuk ch.3 §3.6.1]
- ToyShop timings, on a Radeon X1900 XT, 512 MB, Pentium 4 3.2 GHz dual (the scene ran at 26–69 fps overall):

| Effect | Time |
|---|---|
| Composite rainfall | 4.11 ms (243 fps) |
| Raindrop particles (5–10K) | 19.45 ms |
| Splashes (5K) | 20.01 ms |
| Misty halos | 18.93 ms |
| Splatters | 3.50 ms |

  Particle cost was CPU-bound. [Tatarchuk-Rain slides]
- ToyShop also used 10–15K billboard drop particles falling from ledges and gutters, stretched by velocity, with a pre-blurred drop normal map. [ch.3 §3.6.2]
- **Remember Me** (Dontnod, UE3):
  - **4 layers** on a half-cylinder, half-cone mesh attached to the camera, all using one pre-motion-blurred drop texture.
  - UV translation sets fall speed. Farther layers use a larger UV scale, giving more and smaller drops.
  - A cyclic UV rotation adds a "chaotic" wind feel. It was artistic, not tied to the actual wind.
  - Per-drop "virtual depth" comes from a heightmap texture and is soft-depth-tested against the scene.
  - Layers 1–2 are also tested against the top-down rain depth map, so there is no rain under cover.
  - Layers 3–4 are masked by distance and by two low-resolution noise blend masks to break up repetition. [Lagarde 2a]
- Remember Me intensity: `FinalColor = RainColor * 0.09 * RainIntensity`. The texture holds drops at several brightnesses, so raising intensity reveals more drops. The texture must therefore be authored for maximum rain. Suggested upgrade: a per-drop threshold texture compared against intensity. [Lagarde 2a]
- Remember Me cost: quarter-resolution occlusion and mask pass plus a full-resolution pass merged into the post-process. Total 1.69 ms on PS3 and 1.72 ms on X360, "the same whatever the strength". [Lagarde 2a]
- Flight Simulator 2004: 4 animated textures on a double cone tilted with the camera. Each successive layer is smaller and scrolls more slowly, faking parallax. [cited in Lagarde 2a]
- Particle approach: tie the emitter to the camera or frustum (Space Marine). Downside: "lack of scalability", because heavier rain needs more particles. [Lagarde 2a]
- Physics reference values:
  - Drops are 0.5–10 mm, reaching terminal velocity of 3 m/s (1 mm drops) to 9 m/s (over 4 mm).
  - Drops refract a 165° field of view, so they are brighter than what is behind them.
  - Rain shows best against dark backgrounds or backlit. [Lagarde 2a]
- CryEngine Rain entity (since CE 3.3, extended in 3.5) "handles object occlusion" and applies wetness. Parameters: `RainDropsAmount`, `RainDropsSpeed`, `RainDropsLighting` (backlighting), `Radius`, `DisableOcclusion`, and an option to keep rendering inside vis-areas. [CryEngine docs]

**Inferences: 2D Godot mapping**
- **Screen-space rain layer:** one `ColorRect` with a canvas shader, or a `CanvasLayer` above the world, with 2–3 layers.
  - Each layer: `uv*scale_i + wind_dir*t*speed_i` into a small tiling R8 "streak" texture (for example 64×64, holding 1–2 px streaks at the slant angle). Near layers get larger, faster, brighter streaks; far layers smaller and dimmer.
  - Intensity reveal: `drop_visible = tex.g < intensity` (G holds a per-drop random threshold). This is Lagarde's suggested threshold texture and the same idea as the snow study's dither threshold.
  - **Cost:** constant, about 3 fetches per pixel at low internal resolution. This is the WebGL-safe option, with no particles.
- **Top-down rain perspective:** in top-down, rain falls mostly "into" the screen. Draw short streaks slanted along `wind + small screen-down component`, as many pixel-art games do (this is an inference, not from these sources). Optional: give each streak a "z-height" and draw a ground impact on spawn, reusing the snow study's z-height flake plus ground dot.
- **Rain occlusion map:** an R8 "roof/cover" mask in world space (tiles with roofs, awnings, tree canopies = 1).
  - The rain shader samples it at `world_pos - wind_dir * h`. That shifts the dry area downwind, giving a rain shadow or lee, just like the snow study's lee rays.
  - The same mask drives: no splashes, no wetting, no ripples, characters drying under it.
  - This replaces Remember Me's 256×256 depth map (20 m × 20 m ortho view, ~7.8 cm cells) and FC6's wetness shadow map.
- **Indoors:** follow ToyShop's advice that a script state is cheaper than per-pixel tests. Switch the rain `CanvasLayer` off when the player enters an interior map.
- **Lighting:** brighten streaks over dark tiles, and brighten them more near light sources (the backlit look). Use a cheap light-mask lookup, the 2D version of ToyShop's "overhead lightmap".

**Gaps.** No primary source found for TLOU2, Death Stranding (timefall) or RDR2 rain particle counts. No modern UE5/Unity numbers were collected; a Niagara rain tutorial on 80.lv exists but was not read.

---

## Q4. Splashes: spawning from a depth or occlusion map

**Takeaway.** Do not collide drops. Spawn splashes **independently**, at random positions within an area around the player, snapped to visible, uncovered ground using a top-down depth map. The number per frame scales with intensity. Players cannot tell which drop caused which splash.

**Cited findings**
- Remember Me:
  1. Render a top-down depth map (256×256 over 20 m × 20 m).
  2. Copy it from GPU to CPU (0.036 ms on PS3; a one-frame-old copy is fine).
  3. Spawn random points in a circle in front of the camera, then reconstruct their heights from the depth map.
  4. Splash = a crown mesh plus droplet sprites.
- Costs: PS3 depth map 0.32 ms, splashes under heavy rain 0.33 ms. X360: 0.20 ms and 0.25 ms.
- The same depth map is reused for: drips from roofs and trees after rain, rain occlusion, the camera-droplet test, and per-object dry/wet tracking.
- Characters: if rendering them into the depth map costs too much, spawn random splashes on head and shoulders. [Lagarde 2a]
- Splash count follows the tier table: 20/40/60 for light/moderate/heavy. The unit is not stated; probably per frame or per emitter tick. [Lagarde 2a]
- Real splash physics: a "corona" (crown) splash needs a thin water layer and lasts 10–20 ms; otherwise you get a "prompt" splash of droplets. Rough surfaces produce more droplets. [Lagarde 2a, citing Garg et al.]
- ToyShop:
  - 5–8K splash particles per frame.
  - One filmed milk-drop splash sequence was reused for all splashes, varied by random size and alpha and by random horizontal flips.
  - Splashes are backlit when a light is behind them.
  - Particle alpha is multiplied by `1 - 0.5 * lightningBrightness` so water does not look solid during flashes. [Tatarchuk ch.3 §3.6.2–3.6.3]
- Common practice: cast random downward rays against simplified geometry, or place emitters along geometry edges. Splashes are only generated near the screen. [Lagarde 2a]

**Inferences: 2D Godot mapping**
- Each frame, choose `N = splash_rate[tier] * dt` random pixels on screen.
- Reject a pixel if `cover_mask = 1`.
- Otherwise read the surface type from the tile data:
  - water or puddle → ring (see Q5)
  - stone → 3–4 frame white "crown" sprite
  - dirt or mud → darker splat
  - grass → no splash, or a tiny flick
- Pool about 64–128 `Sprite2D` objects, or draw everything in one `_draw()` / `MultiMeshInstance2D` call. That is cheap on WebGL: no GPU particles, no readback.
- The cover mask lives on the CPU as an `Image`, so lookups are free. This is the 2D equivalent of Remember Me's CPU depth-map copy.
- Variety: use ToyShop's flip and scale tricks (random `flip_h`, 1–2 size variants).

---

## Q5. Ripples on puddles and standing water

**Takeaway.** Two cost tiers:
- **(a)** A real wave-equation simulation in a small ping-pong texture: ToyShop, 256×256.
- **(b)** A **procedural ring texture** with per-ring time offsets, layered 1–4 times by intensity: Remember Me.

Both use **one tiling ripple map for the whole world**, sampled in world space and only shown where there is accumulated water. Option (b) suits pixel art: rings appear and grow without any simulation.

**Cited findings**
- **ToyShop:**
  - GPU wave equation on a single **256×256** lattice for the whole environment, stored as a 16-bit-per-channel RG texture (R = current height, G = previous).
  - Drops are drawn as points into a "seed" pass using a damped sine wave.
  - 2 Euler feedback passes, then a Sobel pass to get normals: 4 passes in total.
  - Objects sample it with world XZ, a per-object scale and a per-object rotation.
  - Artists placed puddles with a depth map. [Tatarchuk ch.3 §3.7]
- **Remember Me, procedural rings:**
  - An offline tool scatters non-overlapping circles into a tiling texture. R = normalised inverse distance to the circle centre; GB = direction from the centre; A = random time offset per circle.
  - Shader:
    - `DropFrac = frac(A + t)`
    - `TimeFrac = DropFrac - 1 + R`
    - `ring = saturate(0.2 + w*0.8 - DropFrac) * R * sin(clamp(TimeFrac*9, 0, 3) * PI)`
  - **4 offset layers**, with `TimeMul = (1, 0.85, 0.93, 1.13)`, `TimeAdd = (0, 0.2, 0.45, 0.7)`, times ×1.6.
  - One layer per quarter of intensity: `Weights = saturate((I - (0, .25, .5, .75)) * 4)`.
  - Ripples are faded out on vertical surfaces by a painted vertex-colour channel. [Lagarde 2b]
- Ripples are invisible without bright light or reflections. Mipmapping kills them. They should only appear where water has collected. [Lagarde 2b]
- S.T.A.L.K.E.R. Clear Sky used a tiling animated volume texture for ripples. Downside: an obvious repeating pattern. Bioshock ran a screen-space ripple simulation for interaction with objects. [Lagarde 2b]
- Far Cry 6: procedural rain ripples **and wind ripples** on puddles. [Ubisoft FC6]

**Inferences: 2D Godot mapping**
- **Pixel ring texture:** a tiling 64×64 (or 128×128) RGBA8 image with R = normalised radius distance, A = time offset. Fill it offline with 8–20 random circles of radius 2–6 px.
- In the water shader: `phase = fract(A + t*rate)` and `on_ring = abs((1.0 - R) - phase) < 1px_equiv && phase < life`. Brighten `on_ring` pixels by one palette step. Layer count = `ceil(intensity * 4)`, as in Remember Me.
- **Cost:** 1–4 fetches per water pixel, no simulation. It reads as rain dimpling the water.
- **Interactive tier** (puddles near the player, fountains): a 64×64 or 128×128 height grid in a `SubViewport` ping-pong. Godot 4 Compatibility can do this with two viewports. Alternatively run it on the CPU in GDScript or C# for 64×64 = 4096 cells. Seed drops and footsteps as points, use ToyShop's equation, and threshold the height into 2–3 palette shades (no normals needed).
- Wind ripples (FC6): add a slow, directional scrolling noise along `wind_dir` on large ponds.

---

## Q6. Drips, wall streaks, wet characters

**Takeaway.** Drips are **authored emitters** placed on edges (ledges, gutters, eaves, trees). They are not simulated. Characters and other dynamic objects have their **own wet level**, which rises while exposed and falls while under cover; the shader darkens and adds gloss.

**Cited findings**
- ToyShop: artists placed separate drop systems on rooftop ledges, lamps and gutter pipes, using gravity and wind forces. [Tatarchuk ch.3 §3.6.2]
- Remember Me:
  - "Falling droplets" at random positions along a thin cylinder on roof edges, with configurable size and spawn rate.
  - "Wall glides" use a sliding-droplet texture; its blue channel is the water and its green channel shapes a crack mask.
  - These effects are best kept to areas with known, fixed weather. [Lagarde 2a]
- Lagarde notes that water streams on walls are rarely seen in reality, though games add them often. [Lagarde 2b]
- After the rain stops, falling drops from roofs and trees reuse the same splash system and depth map. [Lagarde 2a]
- Dynamic objects:
  - Test the object's position against the rain depth map on the CPU.
  - Track time under cover, so each object's wet level increments when exposed and decrements when covered. [Lagarde 2b]
  - Far Cry 6 does the same with ray casts for characters, vehicles, weapons and vegetation. [Ubisoft FC6]
  - Uncharted 2/3 used the dry-to-wet material tweak on the main character. [Lagarde 3b]
  - Battlefield 1 shows raindrops on weapons. [EA BF1]

**Inferences: 2D Godot mapping**
- **Eave drips:** build the list of tile edges where a roof tile sits directly above an open tile (screen-down side). Run a few cheap drip emitters on them: 1 px drop, fall 4–12 px, 2-frame splat.
  - The rate is `k * max(intensity, after_rain_timer)`, so drips carry on for about 30–60 s after the rain stops. This is the "after rain" feel.
  - Trees work the same way, with drips scattered under the canopy footprint.
- **Wet characters:** each entity has `wet` (0..1). Each tick, if not covered, `wet += a*intensity*dt`; otherwise `wet -= b*dt`. Near fire, `b` goes up.
  - Sprite shader: the same palette ramp shift (hair and cloth have high porosity, armour is metal so it only gets glints).
  - Also a drip particle every 0.5–2 s while `wet > 0.6 && covered`.
  - Plus wet footprints: stamp a dark decal into the wetness texture where the character steps onto dry ground, which then dries via the global rule.

---

## Q7. Weather state machine, intensity, wind, lightning

**Takeaway.** Ship **named tiers** (Light/Moderate/Heavy, plus Storm) mapped to one intensity value, with every effect parameter interpolated from that value. Schedule them with a forecast (Far Cry 6: one preset per hour). Wind is a **global vector plus noise gusts**, with optional local "vorticles". Lightning means a global brightness pulse, plus baked per-pixel "lightning maps" for 1–2 strike directions, plus rain becoming more transparent during the flash.

**Cited findings**
- Remember Me:
  - Named tiers so designers and QA share a vocabulary: Light 0.33, Moderate 0.66, Heavy 1.0.
  - All parameters are interpolated as intensity changes. Drop count scales linearly with intensity.
  - Possible extensions: duration ranges (heavy rain is short), tier probabilities. [Lagarde 2a]
- Far Cry 6:
  - A weather manager plus a weather database.
  - **Presets** (for example "Broken Clouds", "Thunderstorm").
  - A **text-file forecast** with one preset per hour, up to 5 full day cycles per region, across 3 regions with sub-regions (caves, interiors).
  - Per-region min/max curves for parameters.
  - Overrides for missions and cutscenes, replicated for co-op.
  - Fog fades as cloud coverage rises (to avoid a washed-out look), and cloud coverage is capped even in storms. [Ubisoft FC6]
- Ghost of Tsushima wind:
  - One global wind vector whose magnitude varies with time-based Perlin noise, which gives visible gusts over grass.
  - "Vorticles" are invisible spheres of wind (position, orientation, radius, direction), summed by brute force; "hundreds" work fine.
  - Particles opt in and get extra curl noise.
  - A height-map lookahead lifts particles over slopes.
  - Wind serves as the quest guide. [Game Developer on GDC 2021 talk]
- ToyShop lightning:
  - Two baked "lightning lightmaps" for two strike positions (far angle, overhead), stored as 2 channels of an 8-bit texture. Cost is one texture fetch per object.
  - The rain shaders receive lightning brightness. Drop alpha is biased by `1 - 0.5*brightness`, and reflection and refraction are boosted during flashes. [Tatarchuk ch.3 §3.3.4, §3.6]
- Forza Motorsport 7: skies darken before a storm, lightning and thunder are possible, and air and track temperature drop, which affects grip. [GTPlanet FM7]
- Gameplay coupling:
  - Days Gone: weather changes how many Freakers roam the open world and changes bike handling in snow and rain. [GamingBolt]
  - Battlefield 1: rain "can distract and distort your sight" and makes spotting movement harder. Fog limits vision and pushes fights toward close quarters. [EA BF1]

**Inferences: 2D Godot mapping**
- **State machine:** `enum {CLEAR, DRIZZLE, LIGHT, MODERATE, HEAVY, STORM}`, each with a target intensity. A `WeatherDirector` autoload eases `intensity` toward the target over 20–60 s, schedules the next state from a per-region weighted table or an hourly forecast array (FC6 style), and syncs a seed for multiplayer (Asterion is an MMO).
  - Drive everything from `intensity` + `wind` + `lightning`, as uniforms on one global shader resource. Godot 4 `global_shader_parameter` works in Compatibility mode.
- **Wind:** `wind = base_dir * (base + gust_noise(t))`. It drives rain streak slant (angle about 0°–35°), the drift speed of the far layer, grass sway, and the lee offset in the cover mask.
  - Local vorticles (explosions, spells, fans): a small array of up to 16 `(pos, radius, dir)` as uniforms, summed in the rain shader to bend streaks nearby.
- **Lightning:**
  - (1) Briefly add brightness through the palette LUT (switch to a "flash" palette row for 2–4 frames, double-flash pattern).
  - (2) Optional: a baked R8 "lightning map" per map for one strike direction, giving long cast shadows from buildings.
  - (3) Lower rain streak alpha during the flash, as ToyShop does.
  - (4) Thunder delay in seconds = distance / 343 m/s (standard physics, not from these sources).

---

## Q8. Rain + fog / mist

**Takeaway.** Industry rain fog is **artistic**: fog density rises with intensity, the fog colour desaturates over the rain's transition time, bright lights get "misty glow" halos (bloom), and bright pixels are fogged less. This is cheap in 2D: one overlay tint plus halo sprites.

**Cited findings**
- Remember Me:
  - Fog amount and colour are set per area.
  - When rain starts, fog colour moves toward its desaturated version: `Weight = lerp(0, MaxWeight, saturate(TimeSinceRainStart / TimeTransition))`.
  - Heavier rain means denser fog ("haze-like effect"). Fog amount is 0.15/0.4/1.0 for Light/Moderate/Heavy.
  - The physical link they found was "precipitation fog" (drops evaporating into drier air below the cloud). [Lagarde 2b]
- ToyShop:
  - "Misty glow" halos around lights via Kawase bloom.
  - The fog factor is reduced on bright pixels: `fogFactor = fFog * (1 - lum/10)`, and the fog also feeds the glow alpha.
  - Misty halos cost 18.93 ms on X1900 XT. [Tatarchuk ch.3 §3.3.1; slides]
- Far Cry 6: fog fades with cloud coverage so overcast scenes do not look washed out. [Ubisoft FC6]
- CryEngine Rain had `MistAmount` / `MistHeight` (mist on distant surfaces), now deprecated. [CryEngine docs]

**Inferences: 2D Godot mapping**
- **Rain haze:** a full-screen tint `mix(color, desat(fog_color), intensity * haze_max)`. It can be folded into the rain layer shader at no extra cost. Use a stronger tint at screen edges or the top for fake distance.
- **Misty glow:** an additive, dithered halo sprite on each light source, with radius × (1 + intensity). No blur pass needed.
- **Post-rain ground mist (evaporation):** when `intensity → 0` while `wet > 0.5` and the sun is out, spawn low-alpha mist puffs over wet tiles. Their density is proportional to `wet * sun`, and they fade as `wet` drops. This reuses the acid study's fumes grid. (Inference; it ties in with the drying timeline.)
- **Rain spray haze:** at HEAVY and above, add a thin noise layer that scrolls with the wind. This is the "rain curtains/sheets" look.

---

## Cost summary (cited, vendor/dev-reported)

| Technique | Platform | Cost | Source |
|---|---|---|---|
| Full-screen composite rain | Radeon X1900 XT | 4.11 ms | ToyShop slides |
| 5–10K drop particles | same | 19.45 ms (CPU-bound) | ToyShop slides |
| 5K splash particles | same | 20.01 ms | ToyShop slides |
| Misty halos | same | 18.93 ms | ToyShop slides |
| Ripple simulation | — | 256×256 RG16, 4 passes | ToyShop ch.3 |
| Rain layers (4), cylinder | PS3 / X360 | 1.69 / 1.72 ms, intensity-independent | Lagarde 2a |
| Top-down depth map 256² (20 m) | PS3 / X360 | 0.32 / 0.20 ms (+0.036 ms copy to CPU) | Lagarde 2a |
| Splashes, heavy rain | PS3 / X360 | 0.33 / 0.25 ms | Lagarde 2a |
| Camera lens droplets (skip for top-down) | PS3 / X360 | 0.32 / 0.54 ms | Lagarde 2a |
| Wetness (dry→wet tweak) | — | a few ALU ops, 0–1 extra fetch | Lagarde 2b/3b |

Inferred 2D budget: rain layer (3 fetches/px) + cover-mask fetch + wetness/puddle fetch + ring fetch on water pixels. At a 320×180 to 480×270 internal resolution this is well under 1 ms even on mobile WebGL2. Splashes and drips stay under 200 pooled sprites.

---

## "See it in action" references
- ToyShop demo (ATI 2005/2006): https://history.siggraph.org/?p=48401 (the course PDF has screenshots).
- Remember Me rain, splashes, ripples: Lagarde links YouTube videos and a PS3 trailer (roof section at 7m20s) from https://seblagarde.wordpress.com/2012/12/27/water-drop-2a-dynamic-rain-and-its-effects/ and the puddle/ripple video from https://seblagarde.wordpress.com/2013/01/03/water-drop-2b-dynamic-rain-and-its-effects/
- Far Cry 6 weather: https://www.ubisoft.com/en-us/company/how-we-make-games/technologies/articles/simulating-tropical-weather-in-far-cry-6 (GDC talk: https://www.gdcvault.com/play/1027725/Simulating-Tropical-Weather-in-Far)
- Ghost of Tsushima wind: https://gdcvault.com/play/1027350/Blowing-from-the-West-Simulating
- Forza Motorsport 7 puddles and drying line: https://gtplanet.net/forza-motorsport-7s-dynamic-weather-system-offers-visceral-experience
- Battlefield 1 weather and gameplay: https://www.ea.com/games/battlefield/news/battlefield-1-weather
- Days Gone weather and gameplay: https://gamingbolt.com/days-gone-developers-talk-about-dynamic-weather-system-and-how-it-will-impact-gameplay

## Gaps (honest)
- Not covered by a primary technical source: GTA V wet roads, RDR2 mud and puddles, Watch Dogs, Gran Turismo, Battlefield V, TLOU2, Uncharted 4 wet characters, Death Stranding timefall. They turned up only as marketing or forum hits, or not at all. The Assassin's Creed 3, Crysis and MGS V wetness approach is known only second-hand via Lagarde 3b.
- Lagarde 4a/4b (reflections) were not read. Wet reflections matter less in top-down pixel art.
- The unit of Remember Me's splash counts (20/40/60) is not stated.
- The FC6 article gives no transition durations or drying times.
- No modern UE5/Unity/Niagara figures were collected.
- The lagarde 2a URL with the 2013/01/03 date returns 404; the correct 2a date is 2012/12/27.

## Sources
- Tatarchuk, "Artist-Directable Real-Time Rain Rendering in City Environments", SIGGRAPH 2006 Advances course ch.3: https://advances.realtimerendering.com/s2006/Chapter3-Artist-Directable_Real-Time_Rain_Rendering_in_City_Environments.pdf
- Tatarchuk, slides with timings: https://advances.realtimerendering.com/s2006/Tatarchuk-Rain.pdf
- Lagarde, Water drop 2a: https://seblagarde.wordpress.com/2012/12/27/water-drop-2a-dynamic-rain-and-its-effects/
- Lagarde, Water drop 2b: https://seblagarde.wordpress.com/2013/01/03/water-drop-2b-dynamic-rain-and-its-effects/
- Lagarde, Water drop 3a: https://seblagarde.wordpress.com/2013/03/19/water-drop-3a-physically-based-wet-surfaces/
- Lagarde, Water drop 3b: https://seblagarde.wordpress.com/2013/04/14/water-drop-3b-physically-based-wet-surfaces/
- CryEngine 5 docs, Environment Entities (Rain): https://cryengine.com/docs/static/engines/cryengine-5/categories/23756816/pages/29796935
- Ubisoft, Simulating Tropical Weather in Far Cry 6: https://www.ubisoft.com/en-us/company/how-we-make-games/technologies/articles/simulating-tropical-weather-in-far-cry-6
- Game Developer, Vorticles in Ghost of Tsushima: https://gamedeveloper.com/design/using-vorticles-to-simulate-wind-in-i-ghost-of-tsushima-i-
- GDC Vault, Blowing from the West: https://gdcvault.com/play/1027350/Blowing-from-the-West-Simulating
- 80.lv, Ghost of Tsushima VFX (wind only, no rain): https://80.lv/articles/insights-into-building-vfx-for-ghost-of-tsushima/
- EA, Battlefield 1 weather: https://www.ea.com/games/battlefield/news/battlefield-1-weather
- GTPlanet, FM7 dynamic weather: https://gtplanet.net/forza-motorsport-7s-dynamic-weather-system-offers-visceral-experience
- GamingBolt, Days Gone weather: https://gamingbolt.com/days-gone-developers-talk-about-dynamic-weather-system-and-how-it-will-impact-gameplay
- SIGGRAPH history, ToyShop: https://history.siggraph.org/?p=48401
