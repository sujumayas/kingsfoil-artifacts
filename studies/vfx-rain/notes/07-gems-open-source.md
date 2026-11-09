# 07 — GEM FINDINGS: open-source code and tools for rain, ripples, puddles, wetness and weather

Researcher angle: code you can reuse or study, with checked licences, for a Godot 4 (Compatibility/WebGL2) top-down pixel-art game.
Method note: the GitHub REST API was blocked in this session (HTTP 403), so **star counts are missing**. Maturity evidence is taken from the last commit date (shallow `git clone`), godotshaders.com like counts and publish dates, Godot Asset Library version and modify dates, and the shipped-game status. Licences were checked by reading the LICENSE file, file header or licence page directly. Shadertoy.com is behind a Cloudflare challenge (`curl` returned "Just a moment..."), so Shadertoy pages could not be read.

---

## Summary table

| Name | URL | Licence (verified how) | Maturity evidence | What it's good for | Risk flag |
|---|---|---|---|---|---|
| jQuery.ripples (sirxemic) | https://github.com/sirxemic/jquery.ripples | **MIT** (LICENSE file, "Copyright (c) 2017 Pim Schreurs") | v0.6.3, last commit 2019-09-15; widely used jQuery plugin | Smallest correct ping-pong heightfield ripple sim (drop, update, render shaders, under 100 GLSL lines). Port to a Godot SubViewport. | Low. Needs float or half-float render targets |
| WebGL Water (Evan Wallace) | https://github.com/evanw/webgl-water (demo http://madebyevan.com/webgl-water/) | **MIT** (header in water.js: "Released under the MIT license") | 2011 code, last commit 2016-01-07; well-known demo | The original source of the same ripple update rule as jquery.ripples. Also caustics and refraction, but those are 3D | Low. 3D, needs OES_texture_float |
| Weather FX Free (heyheythere) | https://github.com/Spyridon-Pikoulas/godot-weather-fx-free · Asset Library #5495 | **CC BY 4.0** (LICENSE file, credit line required) | v1.0.1, 2026-09-29, Godot 4.3; a free subset of the paid "Weather FX" pack | Best-designed single-node 2D rain shader found: 3 parallax depths, wind slant, world-anchored, splashes, **pixel-art mode** | Medium. Attribution required; side-view ground-line splashes need reworking for top-down |
| WeatherSystem2D (Gregry) | https://github.com/gregrylivingston/Godot4---Weather-System-2D · Asset Library #5328 / #3344 | **MIT** (LICENSE file) | v4.7, 2026-07-11, Godot 4.3, active since 2024 | Whole 2D atmosphere kit (sky, clouds, rain, snow, fog, water) to study how the parts fit together | Low licence risk. **Perf risk**: rain loops 300 times per pixel |
| Weather 2D (parachutino) | https://github.com/parachutino/godot-weather-2D · Asset Library #897 | **MIT** (LICENSE file, Diego Villalon 2021) | v1.0, 2021-03-19, **Godot 3.2**, no updates | "Weather collider" areas that change the weather when the player enters, follow-player emitter, scene darkening | Stale (Godot 3) |
| GodotWeatherSystem (matiaslavik) | https://codeberg.org/matiaslavik/GodotWeatherSystem · Asset Library #2601 | **MIT** (Asset Library listing) | v1.0, 2024-02-15, Godot 4.2 | Weighted-probability weather table plus seasons. A data-model reference | 3D particles. Low relevance for the visuals |
| godotshaders: Rain and Snow with Parallax (steampunkdemon) | https://godotshaders.com/shader/rain-and-snow-with-parallax-scrolling-effect/ | **MIT** (site licence tag) | 101 likes, 2023-07-09 | **O(1)-per-pixel** screen rain: column bucketing, slant, near/far length/width/alpha | Low |
| godotshaders: Simple rain/snow (mo32167) | https://godotshaders.com/shader/simple-rain-snow-shader/ | **CC0** (site tag) | 122 likes (highest of the rain shaders), 2023-10-20 | Very easy streak rain | **Perf**: O(pixels × count) loop, count=150 by default, up to 2000 |
| godotshaders: Rain Drop (floor effect) (seed) | https://godotshaders.com/shader/rain-drop-floor-effect/ | Tagged **CC0** ("CC0 / MIT") | 30 likes, 2025-08-12, updated 2026-11-06 | **Top-down ground ripple rings** in world space (stable under camera), procedural, screen-texture distortion | **Provenance risk**: the algorithm matches Zavie's Shadertoy "Rainier mood" (ldfyzl); see Q3 |
| godotshaders: Rain puddles with ripples and reflections (shadecore_dev) | https://godotshaders.com/shader/rain-puddles-with-ripples-and-reflection/ | Tagged **CC0** | 87 likes, 2025-06-11 | Puddle mask, Zavie ripples and SSR (3D post-process) | Provenance: credits Zavie's ripples and marcelb's SSR. 3D only |
| godotshaders: Rain Puddles V3 (gloriousglider8) | https://godotshaders.com/shader/rain-puddles-v1/ | **MIT** (tag) | 23 likes, updated 2026-08-08 | Puddle, ripple, refraction and SSR (3D) | 3D |
| godotshaders: Transparent Ripples (rendoog) | https://godotshaders.com/shader/transparent-ripples/ | **MIT** (tag) | 72 likes, 2024-09-09 | One analytic concentric ripple on a sprite (a splash decal on a pond or puddle) | Low |
| godotshaders: Ripple shader (nevoski) | https://godotshaders.com/shader/ripple-shader/ | **Shadertoy port** (ldBXDD) | 70 likes, 2022-04-12 | Click ripple | **NC risk** (Shadertoy default licence) |
| godotshaders: Rainier mood / Raindrops / Procedural Drops / Rain drops on screen | https://godotshaders.com/shader/rainier-mood/ · /raindrops/ · /procedural-drops-animated-rain-sweat-etc/ · /rain-drops-on-screen-notexture/ | Shadertoy port / CC0-tagged port / Shadertoy port / Shadertoy port, page says "CC BY 3.0" | 24 / 3 / 39 / 35 likes | Ripple and lens-drop study material | **Flag**: all derived from Shadertoy ldfyzl, tdG3Rw or MlfBWr |
| godotshaders: Modular Environmental Particles (nuzcraft) | https://godotshaders.com/shader/modular-environmental-particles-dust-leaves-rain-etc/ | **CC0** | 4 likes, 2026-10-24 (new) | Particle shader for rain, dust and leaves | Unproven |
| godotshaders: Pixel Cloud Shader (lunaticwyrm467) | https://godotshaders.com/shader/pixel-cloud-shader/ | **MIT** | 32 likes, 2024-04-11 | Pixel-art cloud layer. Could drive storm-cloud shadows | Low |
| godotshaders: Dynamic Animated Liquid Texture (profesorshader) | https://godotshaders.com/shader/dynamic-animated-liquid-texture-blood-paint-water-and-other-fluids/ | **CC0** | 37 likes, 2026-04-12 | Ping-pong DrawableTexture2D liquid. A pattern for a wetness or puddle buffer | Check that it runs on Compatibility |
| Cataclysm: DDA weather | https://github.com/CleverRaven/Cataclysm-DDA (src/weather.cpp, data/json/weather_type.json, field_type.json) | **CC BY-SA 3.0** (LICENSE.txt) | Very active (master fetched 2026-11-08), shipped open-source roguelike | **Best numbers source**: rain tiers, wetness, soaking order across body parts, rain killing fire, smoke and blood, sight and sound penalties | **ShareAlike**: copying code or JSON into the game pulls in BY-SA. Use the ideas and numbers, not the code |
| pret/pokeemerald | https://github.com/pret/pokeemerald (src/field_weather_effect.c) | **No licence** (LICENSE returns 404; decompiled Nintendo/Game Freak code) | Long-running decompilation; reproduces the shipped game | Exact GBA rain sprite counts, speeds, splash timing and the thunder state machine | **Study only.** Do not copy |
| Sandspiel (Max Bittker) | https://github.com/MaxBittker/sandspiel | **MIT** (LICENSE) | Last commit 2026-09-09; popular web falling-sand game | Water cellular automaton (fall, diagonal, slide 2) in Rust/WASM | Side view. Low relevance to top-down rain |
| snowdrift (Luanti/Minetest mod, paramat) | https://github.com/paramat/snowdrift | **MIT** (license.txt, 2017 paramat) | Long-lived standard weather mod | Sky-light test as a cheap "is outdoors" check (rain shadow), spawn budget per cycle, overcast sky values | Low |
| Veloren rain occlusion | https://gitlab.com/veloren/veloren (assets/voxygen/shaders/include/rain_occlusion.glsl) | **GPL-3.0** (LICENSE) | Active open-source voxel RPG | Rain shadow from a depth map rendered along the rain direction | **GPL**: study only. 3D |
| rainyday.js (Marek Brodziak) | npm `rainyday.js` 0.1.7; GitHub maroslaw/rainyday.js is **no longer reachable** (git asks for auth) | **GPLv2** (npm package.json, LICENSE file and min.js header). **Not MIT** | Last npm change 2022-05-14; repo gone | Raindrops on glass (blur, trails, gravity) | **GPL and abandoned.** Out of scope for top-down |
| Codrops RainEffect (Lucas Bebber) | https://github.com/codrops/RainEffect | **Custom Codrops licence**: free in projects, but you may not "republish, redistribute or sell as-is" | Last commit 2017-02-11 | WebGL drops on glass | **Non-standard licence.** Glass effect, out of scope |

---

## Q1. Which ripple simulation is the field-proven core, and what exactly does it do?

**Takeaway:** Hugo Elias's two-buffer wave equation, as written in Evan Wallace's WebGL Water (MIT, 2011) and copied almost line for line into jquery.ripples (MIT), is the reference. It has three tiny passes: drop, update and render. For pixel art it can run on the CPU in an integer array at tile resolution, or in a small SubViewport.

**Cited findings**
- WebGL Water stores `(position.y, velocity.y, normal.x, normal.z)` per texel in two 256×256 float textures, falling back to HALF_FLOAT_OES (https://github.com/evanw/webgl-water, water.js lines 9 and 23–28).
- Update rule (identical in both repos): average the 4 neighbours, then `vel += (avg - h) * 2.0; vel *= 0.995; h += vel;`. The comment says the damping exists "so waves do not last forever" (water.js lines 57–73; https://github.com/sirxemic/jquery.ripples src/main.js lines 651–660).
- Drop: a cosine bump. `drop = max(0, 1 - dist/radius); drop = 0.5 - cos(drop*PI)*0.5; h += drop*strength` (main.js lines 628–630).
- Render (jquery.ripples): build a normal from finite differences, `offset = -normalize(cross(dy,dx)).xz`, sample the background at `uv + offset*perturbance`, add `specular = pow(max(0, dot(offset, normalize(vec2(-0.6,1.0)))), 4.0)` (main.js lines 694–701).
- jquery.ripples defaults: `resolution: 256`, `dropRadius: 20`, `perturbance: 0.03`, `interactive: true`, with a 1.5× radius for "big" drops (main.js lines 331–352). It requires OES_texture_float and uses half-float when available (lines 14–76).

**Inferences**
- In Godot Compatibility (WebGL2), RGBA16F render targets are generally available, so a SubViewport ping-pong works. For a strict pixel look, an int16 CPU array per pond (for example 64×64), updated at 15–30 Hz and quantised to 3–4 palette bands, is cheaper and makes the result crisp.
- 0.995 damping per step means about 1/e after 200 steps (about 3.3 s at 60 Hz). For tiny puddles use stronger damping, about 0.95–0.97.

**Gaps:** I did not benchmark the GPU cost on mobile WebGL2.

## Q2. Which Godot 2D rain shaders are efficient enough for web, and how do they work?

**Takeaway:** Prefer **O(1)-per-pixel cell hashing** (Weather FX Free; steampunkdemon's Parallax rain) over **per-pixel loops over all drops** (mo32167's Simple rain/snow, and WeatherSystem2D's rain, which loops 300 times). The loop designs are the popular ones, but they scale with pixels × drops.

**Cited findings**
- *Simple rain/snow* (CC0, 122 likes): `for (int i = 1; i <= count; i++)` with `count` default 150 and range 0–2000. Each pass tests a box SDF line. Slant is `uv.x += uv.y*slant` (https://godotshaders.com/shader/simple-rain-snow-shader/).
- *WeatherSystem2D* rain.gdshader uses the same hash pair (`fract(sin(x*18.34)*51.78)`) and `for (int i = 1; i <= 300; i++)`, with uniforms `amount`, `slant=-0.05`, `quality` (https://github.com/gregrylivingston/Godot4---Weather-System-2D, addons/weather2d/shaders/rain.gdshader lines 16–39).
- *Rain and Snow with Parallax* (MIT, 101 likes): skews x by `UV.y*slant`, buckets it into `rain_amount` columns (default 200), picks a random phase per column with `fract(sin(col*rain_amount))`, and draws a streak where `fract(uv.y - time*(base+add*rn))` exceeds `1 - length`. Near and far length, width and transparency are interpolated by the random value, which fakes depth (https://godotshaders.com/shader/rain-and-snow-with-parallax-scrolling-effect/).
- *Weather FX Free* rain.gdshader (CC BY 4.0) works like this (https://github.com/Spyridon-Pikoulas/godot-weather-fx-free, addons/weather_fx/shaders/rain.gdshader):
  - **3 layers**, with `depth = 0.35 + 0.325*i`.
  - **Parallax:** `p = local + world_origin*depth`.
  - **Wind:** skewed space, `q.x -= q.y*wind*0.6`.
  - **Cells:** column width `10 + 14*depth` px, fall speed `(520 + 780*depth)*fall_speed` px/s, cell height `len*2.2 + 30`.
  - **Density:** a hash gate, `hash > density*(1.3 - 0.3*depth)` means no drop in that cell.
  - **Streak:** brightness ramps `pow(along, 1.3)` from tail to head.
  - **Pixel mode:** hard AA (`aa = 0.01`) when `pixel_size >= 1`.
  - **Splashes:** 26 px cells, 2 per cell, `rate = 1.6*fall_speed` per second. Each is an elliptical crown ring with radius `1.5 + 7*age` and a 0.45 y-squash, plus 2 droplets on a parabola, faded by `pow(1-age, 1.5)`.
  - The asset page says each effect is "a single shader on a single node", with a `WeatherFX.default_pixel_size = 4` pixel-art mode and `fade_in()`/`stop()` (Asset Library #5495, https://godotengine.org/asset-library/asset/5495).
- *Rain Drop (floor effect)* is a **top-down** ripple field. It works in world-space cells (`pattern_scale` default 16) and scans 5×5 neighbour cells (`MAX_RADIUS = 2`, 25 iterations per pixel). Each cell has a hashed centre and a phase `t = fract(0.3*TIME + hash)`. Ring: `d = len - 3t`, profile `sin(31d)` windowed by smoothsteps, amplitude `(1-t)^2`. A gradient-based normal distorts SCREEN_TEXTURE (`offset_amount` 0.05, `effect_mix` 0.55) (https://godotshaders.com/shader/rain-drop-floor-effect/).

**Inferences**
- For top-down, drop Weather FX's ground line and spawn splash rings at hashed **world** positions, which is what the floor-effect shader does. Then mask them by a "wet surface / water" tilemap layer.
- Reading the screen texture (`hint_screen_texture`) forces a backbuffer copy in Compatibility. Distorting a dedicated water layer avoids that.

**Gaps:** I did not profile any shader on device. Like counts are a weak proxy for "artist validated".

## Q3. Licence traps around ripple/rain shaders

**Takeaway:** Many Godot rain-ripple shaders, **including some tagged CC0**, descend from Shadertoy code (Zavie's "Rainier mood" ldfyzl, and others). Shadertoy's default licence is widely known to be CC BY-NC-SA 3.0 unless the author states otherwise, but I **could not verify** that on shadertoy.com this session (Cloudflare block). Treat these as study-only, or re-derive from the MIT ripple code above.

**Cited findings**
- godotshaders lets authors choose only CC0, MIT or GPL v3, and authors "agree that the code you submit is your own or already considered free to share" (https://godotshaders.com/license/). Separately, the site has a "Shadertoy port" licence tag.
- "Rain puddles with ripples and reflections" (tagged CC0) states it uses "the rain ripple effect created by Zavie" (https://godotshaders.com/shader/rain-puddles-with-ripples-and-reflection/). "Raindrops" (CC0) also links ldfyzl and 4djSRW. "Rainier mood" is tagged "Shadertoy port".
- In "Rain Drop (floor effect)", the `MAX_RADIUS`/`DOUBLE_HASH`/`HASHSCALE` constants and the `sin(31.0*d)` ring match the Rainier-mood structure (inference from code comparison). The hash functions themselves are Dave Hoskins's "Hash without Sine" (4djSRW).
- The "Rain drops on screen" page states "CC BY 3.0" for its Shadertoy source MlfBWr.

**Inferences:** Safe path: write your own ring field with the same idea (hashed cell centre, expanding radius, decaying sine). Expanding rings are a generic technique. Copying the specific code verbatim is what carries the risk.

**Gaps:** I could not read the Shadertoy pages (ldfyzl, ldBXDD, tdG3Rw) to check whether the authors stated a licence.

## Q4. Field-validated numbers from a shipped open-source roguelike: Cataclysm: DDA

**Takeaway:** CDDA's weather is a compact, data-driven model worth copying **as numbers and structure**. It has 3 precipitation tiers, a mm/h rate, a wetness strength, a "rain ages outdoor fields" factor, and sight, sound and light modifiers per weather type. Licence: CC BY-SA 3.0, so don't paste the code.

**Cited findings** (https://github.com/CleverRaven/Cataclysm-DDA, master as of 2026-11-08)
- Licence: "Creative Commons Attribution-ShareAlike 3.0 Unported" (LICENSE.txt).
- `precip_mm_per_hour`: very_light 0.5, light 1.5, heavy 3 mm/h (src/weather.cpp ~L444–452).
- Rain collectors: 1, 4 or 8 units per turn by tier (weather.cpp ~L169–183).
- Per weather tick (weather.cpp ~L457–486):
  - Wetness strength by tier: 5, 30, 60.
  - `decay_fields_and_scent(decay_time)` with decay_time of 5, 15 or 45 turns. This applies only to **outdoor** tiles (it checks `outside_cache`).
  - The player is soaked once every 6 s unless under a roof. The comment notes "only roofs/floors block it, not walls".
- Each field's ageing is divided by its `decay_amount_factor` (map.cpp `decay_fields_and_scent`). From data/json/field_type.json:

  | Field | decay_amount_factor | half_life |
  |---|---|---|
  | fd_fire | 3 | 30 min |
  | fd_blood, fd_blood_footprint_n | 2 | 2 days / 1 day |
  | fd_smoke | 5 | — |
  | fd_fog | 15 | 7 min |

  Inference: heavy rain ages outdoor fire by 15 turns per tick, and fog only barely, by 3. So rain puts out fires and washes blood and footprints away faster.
- Soaking (`wet_character`, weather.cpp ~L387–418):
  - It returns early for a RAIN_PROTECT wielded item, such as an umbrella.
  - It also returns early for worn RAINPROOF gear, except 1 time in 50.
  - Warm clothing delays soaking: `rng(0, 100 - amount + warmth_delay) > 10` means skip. `warmth_delay = 0.8*torso + 0.2*head`.
  - It soaks the upper body first and the legs only once the head is at least 50% wet.
- weather_type.json values per type (light_modifier / sight_penalty / sound_attn / animation factor and glyph):

  | Type | light_modifier | sight_penalty | sound_attn | Animation factor, glyph |
  |---|---|---|---|---|
  | light_drizzle | -10 | 1.01 | 0 | 0.01 "," |
  | drizzle | -20 | 1.03 | 1 | 0.01 "." |
  | rain | -30 | 1.1 | 4 | 0.02 "," |
  | rainstorm | -35 | 1.2 | 8 | 0.04 ";" |
  | thunder | -40 | 1.2 | 8 | 0.02 |
  | lightning | -45 | 1.25 | 8 | 0.04 |

  `lightning` has `required_weathers: ["thunder"]`, which makes it a weather-chain gate. The ASCII rain animation draws a glyph on `factor` (1–4%) of visible tiles.
- No weather type in the current JSON has `acidic`, so acid rain appears to have been **removed** from current CDDA (inference from an absent key, not checked against the changelog).

**Inferences:** For Asterion, this maps cleanly onto a `WeatherType` resource with fields `{precip_tier, mm_h, wet_strength, field_decay, sight_mult, sound_attn, light_mod, anim_density}`. The "noise masks footsteps" stealth idea comes free from `sound_attn`.

## Q5. Classic handheld numbers: Pokémon Emerald rain (study only)

**Takeaway:** GBA Pokémon draws convincing rain with **at most 24 sprites** on a 240×160 screen. Drops fall diagonally at about 26.6° for a fixed number of frames, then play a splash animation where they land. Thunder is a small random-timer state machine that swaps palette colour maps. **No licence**: study only.

**Cited findings** (https://github.com/pret/pokeemerald, src/field_weather_effect.c; the LICENSE URL returns 404)
- Sprite targets: rain **10**, thunderstorm **16**, downpour **24**. `MAX_RAIN_SPRITES 24` (L478, L1044, L1073; include/constants/field_weather.h).
- Movement per frame in 1/16 px (`y = tPosY >> 4`):
  - Rain: `{-0x68, 0xD0}`, which is −6.5, +13 px/frame. At 60 fps that is about 390 and 780 px/s.
  - Downpour: `{-0xA0, 0x140}`, which is −10, +20 px/frame.
  - Both give the same slant, atan(0.5) ≈ 26.6° from vertical (L449–453).
- Fall duration before splashing: 18 frames for rain, 12 for downpour. Initial random spawn wait is up to 7 or 10 frames (L458–462). Drops then splash in place (`StartSpriteAnim(sprite, isDownpour+1)`) and respawn when the animation ends (L604–618).
- Thunder:
  - Idle between storm cycles: `Random()%360 + 360` frames (6–12 s).
  - Each cycle has 1–2 short bolts and a 50% chance of a long bolt.
  - A flash applies colour map 19, then reverts to map 3 after 6–8 frames.
  - The gap between short bolts is 60–75 frames.
  - A long bolt holds 30–45 frames, then fades gradually with `ApplyWeatherColorMapIfIdle_Gradual(19, 3, 5)`. `NUM_WEATHER_COLOR_MAPS 19` (thunder block around L1100–1200).

**Inferences:** "Fixed fall time, then splash at the current position" removes any need for ground collision. In top-down this is the right model: the drop's landing point is wherever it is when its timer ends.

## Q6. Rain shadow and outdoor tests in open-source engines

**Cited findings**
- Luanti **snowdrift** (MIT):
  - Each 0.5 s cycle tests 64 positions for light (`DROPLPOS = 64`) and spawns 2 drops at each (`DROPPPOS = 2`), within radius 16 (`DROPRAD`).
  - It spawns only where `get_node_light(pos, 0.5) == 15`, that is, full sky light at noon, which means exposed to the sky.
  - Drop velocity is y = −12 nodes/s.
  - Overcast sky brightness is 39 at night and 159 in daytime. Precipitation noise threshold is 0.2.

  Source: https://github.com/paramat/snowdrift init.lua L3–24, L187–238.
- **Veloren** (GPL-3.0) renders a "directed occlusion map" along the rain direction and samples it with `textureProj(sampler2DShadow…)` to get `rain_occlusion_at(fragPos)`. The uniforms include `rain_dir_mat`, `integrated_rain_vel` and `rain_density` (https://gitlab.com/veloren/veloren, assets/voxygen/shaders/include/rain_occlusion.glsl).
- CDDA uses a per-tile `is_roofed()` walk upward and an `outside_cache` (Q4).

**Inferences:** For top-down tiles, the equivalent is a 1-byte-per-tile "sky exposure" mask (roofs, tree canopies), shifted by wind direction to make a lee strip. This is the same idea as the snow study's shelter mask with lee rays, so it can be reused directly.

## Q7. Other candidates checked

- **Sandspiel** (MIT, last commit 2026-09-09): water falls straight down, then diagonally, then "scoots double" sideways 2 cells. There is a 1-in-20 chance per fall step of re-randomising direction (crate/src/species.rs `update_water`, L167–200; https://github.com/MaxBittker/sandspiel). This is side-view only, but the "scoot 2" rule is a cheap way to make puddles level out on a top-down height grid (inference).
- **rainyday.js**: often described as MIT, but the npm package says **GPLv2** (package.json `"license": "GPLv2"`, a GPL v2 LICENSE file, and the min.js header "Licensed under the GPLv2 license"). Defaults: `blur: 10`, `fps: 24`, `gravityThreshold: 3`, `gravityAngle: PI/2`. The GitHub repo can no longer be cloned (https://registry.npmjs.org/rainyday.js).
- **Codrops RainEffect**: the README licence forbids republishing or redistributing "as-is". Last commit 2017 (https://github.com/codrops/RainEffect).

## Gaps (honest list)
- **No GitHub star counts** (API 403). Maturity rests on commit dates, likes and Asset Library versions.
- Shadertoy (Cloudflare) could not be read, so its default CC BY-NC-SA 3.0 licence and the authors' own licence statements are **unverified this session**.
- Not researched for lack of budget: The Powder Toy water, PICO-8/TIC-80 rain carts and tweetcarts, Wesnoth, open lightning generators (midpoint displacement or L-system), Veloren's rain particle code beyond occlusion, and Godot Asset *Store* (new store) listings.
- No on-device performance measurements.

## Sources
- https://github.com/sirxemic/jquery.ripples (LICENSE, src/main.js)
- https://github.com/evanw/webgl-water (water.js) · http://madebyevan.com/webgl-water/
- https://github.com/Spyridon-Pikoulas/godot-weather-fx-free (LICENSE, addons/weather_fx/shaders/rain.gdshader) · https://godotengine.org/asset-library/asset/5495
- https://github.com/gregrylivingston/Godot4---Weather-System-2D · https://godotengine.org/asset-library/asset/5328
- https://github.com/parachutino/godot-weather-2D · https://godotengine.org/asset-library/asset/897
- https://codeberg.org/matiaslavik/GodotWeatherSystem · https://godotengine.org/asset-library/asset/2601
- https://godotshaders.com/license/
- https://godotshaders.com/shader/simple-rain-snow-shader/
- https://godotshaders.com/shader/rain-and-snow-with-parallax-scrolling-effect/
- https://godotshaders.com/shader/rain-drop-floor-effect/
- https://godotshaders.com/shader/rain-puddles-with-ripples-and-reflection/
- https://godotshaders.com/shader/rain-puddles-v1/
- https://godotshaders.com/shader/transparent-ripples/
- https://godotshaders.com/shader/ripple-shader/
- https://godotshaders.com/shader/rainier-mood/
- https://godotshaders.com/shader/raindrops/
- https://godotshaders.com/shader/procedural-drops-animated-rain-sweat-etc/
- https://godotshaders.com/shader/rain-drops-on-screen-notexture/
- https://godotshaders.com/shader/modular-environmental-particles-dust-leaves-rain-etc/
- https://godotshaders.com/shader/pixel-cloud-shader/
- https://godotshaders.com/shader/dynamic-animated-liquid-texture-blood-paint-water-and-other-fluids/
- https://github.com/CleverRaven/Cataclysm-DDA (LICENSE.txt, src/weather.cpp, src/map.cpp, data/json/weather_type.json, data/json/field_type.json)
- https://github.com/pret/pokeemerald (src/field_weather_effect.c, include/constants/field_weather.h)
- https://github.com/MaxBittker/sandspiel (LICENSE, crate/src/species.rs)
- https://github.com/paramat/snowdrift (license.txt, init.lua)
- https://gitlab.com/veloren/veloren (LICENSE, assets/voxygen/shaders/include/rain_occlusion.glsl)
- https://registry.npmjs.org/rainyday.js
- https://github.com/codrops/RainEffect
