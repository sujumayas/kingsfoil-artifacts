# 04 Clouds, cloud shadows, ground fog dynamics and weather state

Researcher angle: cloud shadows on a top-down map, overhead and parallax cloud layers, cloud shapes in pixel art, weather as server state, real fog meteorology simplified for games, coarse fog density grids, noise choices for 320x180.

Tags used below. [C] = cited finding with source number. [I] = my inference or estimate. [M] = number I computed from cited code (frame counts to px/s).

Frame rates used for conversions. GBA runs at about 59.73 Hz and SNES NTSC at about 60.1 Hz. I round both to 60 [I].

---

## Q1. How do classic top-down games move cloud and fog overlays? (speeds, parallax, blending)

**Takeaway.** The classics use one or two 64x64 or full-screen tiles, scrolled by integer pixels every N frames, at 7.5 to 30 px/s, blended at roughly half strength. Clouds move faster than fog. Fog is often locked to the screen and drifts. Sky clouds get parallax at 0.25 or 0.5 of camera speed. These are the reference numbers for Kingsfoil.

**Cited findings**
- Pokémon Emerald, `WEATHER_SUNNY_CLOUDS` [C, S1]. Three 64x64 cloud sprites placed at map coordinates (0,66), (5,73), (10,78). Each moves left 1 px every 2 frames. Target blend coefficients (12, 8). That is about 30 px/s [M].
- Pokémon Emerald, horizontal fog [C, S1]. A grid of 64x64 sprites, 5 columns at 64 px spacing. Offset advances 1 px every 4 frames, so about 15 px/s [M]. Position is `(gSpriteCoordOffsetX - fogHScrollOffset) & 0xFF`, so the fog is tied to the camera and wraps at 256 px. Blend target (12, 8), fades in with step delay 3.
- Pokémon Emerald, diagonal fog [C, S1]. X advances every 3 frames, Y every 5 frames. That is about 20 px/s across and 12 px/s down [M]. Blend target (12, 8).
- GBA blend coefficients run 0 to 16, so (12, 8) means about 75% overlay plus 50% background, a brightening add rather than a plain alpha mix [I, based on the GBA BLDALPHA register range; S1 does not show `Weather_SetTargetBlendCoeffs`].
- Zelda: A Link to the Past (zelda3 C reimplementation) [C, S2]. Overlay is BG1. Overlay id 0x9D is the Lost Woods fog (screen 0x00, comment "forest"). 0x95 is used on Death Mountain screens 0x03, 0x05, 0x07. 0x9C on dark Death Mountain 0x43, 0x45, 0x47. 0x9F is rain.
  - Fog 0x97/0x9D does not follow the camera and adds `0x2000` subpixels per frame to both X and Y, which is 1/8 px per frame, about 7.5 px/s diagonally [M]. So the fog is screen-locked and drifts slowly.
  - Most other overlays follow the camera at half speed (`r4 >>= 1`). Death Mountain 0x95 and forest-after-sword 0x9E follow horizontally at quarter speed (`r4 >>= 2`). That is parallax 0.5 and 0.25 [M].
  - 0x9C drifts vertically at 1/8 px per frame plus full camera Y [M].
  - Colour math register `CGADSUB = 0x72` for fog, forest and rain overlays, `0x20` for Death Mountain [C, S2]. 0x72 has the "half" bit set, so the overlay is added at 50% [I, from SNES colour-math bit layout].

**Inferences**
- Fog at 7.5 to 15 px/s and clouds at 30 px/s on a 240x160 or 256x224 screen is the old-school pace. At 320x180 the same px/s reads a bit slower because the screen is wider. A cloud crossing 320 px at 30 px/s takes about 11 s [I].
- Screen-locked fog plus a slow drift hides the tile seam problem and costs nothing when the camera moves. It feels like "air in front of the lens". World-locked fog (Emerald) feels like fog on the ground. For ground fog pick world-locked. For mood haze pick screen-locked [I].
- Parallax below 1.0 (0.25 to 0.5) makes clouds read as high above the ground. Shadows on the ground must move at 1.0 (world-locked) or they slide against the terrain [I].

**Gaps**
- Minish Cap, Secret of Mana and FF6 cloud overlays not traced in code here. pokefirered and the Minish Cap decompilation (zeldaret/tmc) should hold the same kind of counters.

---

## Q2. Cloud shadows over a top-down map

**Takeaway.** One tileable noise texture, scrolled world-locked by the wind vector, thresholded, and applied as a palette darken step. One texture fetch per pixel. Tie threshold to cloud cover and scroll speed to wind. Hard threshold plus 1 band of dither looks better in pixel art than a soft multiply.

**Cited findings**
- Godot "TopDown Game 2D Cloud shader" (Jams, 7 Sep 2024) [C, S3]. One noise sample per pixel. `speed = vec2(0.02, 0.01)` UV per second. `density = 0.25`. Remap `clamp(noise*2-1, 0, 1)`. No octaves in the shader. Meant for a ParallaxLayer with mirroring set to window size.
- Godot "Animated Grassy Wind or Cloud Shadow Pixel Patches Overlay" (thatisuday, 4 Jan 2026) [C, S4]. Procedural value noise, `wind_speed = 100` px/s default, `threshold = 0.6`, `opacity = 0.1`, `pixel_size_px` 1 to 64, `rotation_degrees = -15`, patch 300x10 px. `step()` against threshold gives a binary mask. One texture lookup per pixel.
- Fukyuuten devlog (30 Jan 2022) [C, S5]. Cloud shadows scroll over the map to sell floating islands. Engine had no shaders. The author built a stencil from the tilemap and subtracted it so shadows only fall on ground, not sky. Real game speed is "much slower" than the GIF.
- Study #5 (Light) B4 already covered "Cloud Cast Shadow 2D" (CC0, 2025-06-28) and warned that multiply over a palette world can look like dirt [C, S6].

**Recipe (pseudocode) [I]**
```
// world-locked, one fetch
uv      = (world_px + wind_px_per_s * t) / tex_px      // tex 128 or 256, repeat
n       = texture(cloud_noise, floor(uv*tex_px)/tex_px).r   // snap to texel
cover   = weather.cloud_cover                          // 0..1 from server byte
thr     = 1.0 - cover                                  // more cover, lower threshold
s       = step(thr, n)                                  // hard shadow
edge    = step(thr - 0.04, n) * bayer4(px) ...          // 1 band of dither at the edge
shade   = max(s, edge)
color   = palette_shift(color, -shade)                  // one ramp step darker, not multiply
```
- Texture size 128x128 or 256x256 R8 is enough. At 320x180 a 256 px texture repeats once per screen width. Stretch it 2x to 4x in world space so one cloud is 100 to 300 px wide and the repeat is not visible [I].
- Speed: real cumulus drift at 5 to 15 m/s. If one 32 px tile is about 1 m, that is 160 to 480 px/s, which is far too fast to read. Use 4 to 20 px/s for shadows, scaled by the wind value [I]. Pokémon's 30 px/s is the upper bound for a sky layer (S1).
- Softness: in pixel art use one dithered band 2 to 4 px wide instead of a gradient [I]. Study #3/#6 dither matrices apply.
- Density from cloud cover: cover 0 gives threshold 1.0 (no shadow). Cover 0.4 to 0.6 gives broken cloud. Cover 1.0 gives the whole map one step darker, which is the overcast state, so switch the global palette instead of the shadow [I].
- Mask shadows off water, sky and void with a per-tile flag or a stencil, as Fukyuuten did [C, S5; I].

**Cost [I, estimate]**
- One R8 fetch plus a few ALU ops per pixel over 57,600 pixels (320x180). On WebGL2 this is the cheapest full-screen effect in the study. If drawn as one extra full-screen quad it adds one layer of overdraw.
- Cheaper still: put it inside the existing palette or light pass so there is no extra overdraw (study #5 light map).

**Gaps**
- No measured ms for a cloud shadow pass on WebGL2 or mobile found.
- No praised commercial top-down pixel game with documented cloud shadow parameters found (Albion, Diablo, Stardew not confirmed).

---

## Q3. Overhead clouds, flying-over clouds and fading near the camera

**Takeaway.** Draw a few big cloud sprites or one thresholded noise layer above everything, with parallax 1.2 to 1.5 (faster than ground, so it reads as closer to the camera) or 0.25 to 0.5 (slower, reads as below/far, for sky islands). Fade by a dither ramp, not alpha, when the player is under one so gameplay stays readable.

**Cited findings**
- ALttP uses parallax 0.25 and 0.5 for overlays and 0 (screen-locked) for fog [C, S2].
- Pokémon Emerald clouds are 3 sprites at fixed map coordinates, so they are a placed decoration, not a weather simulation [C, S1].
- Fukyuuten: clouds scroll beneath the map for a floating-island look [C, S5].

**Inferences**
- Top-down camera has no depth, so "fading near the camera" becomes "fading over the player". Use a circle mask around the player (radius 24 to 40 px) that raises the dither threshold, so the cloud opens around them [I]. This is the same clearing mask the fog researchers will use.
- Overhead clouds should be 1 to 3 sprites on screen at most, with long gaps. A full layer hides the board [I].
- For the MMO, overhead cloud positions derive from `(wind, time, seed)` so all clients agree without network traffic [I].

**Gaps**
- No code-level data for Minish Cap (Cloud Tops), Stardew, Albion or Diablo cloud layers.

---

## Q4. Cloud shapes in pixel art

**Takeaway.** Threshold low-octave fbm, then add a "puff" term for round bumps, then quantise into 2 to 4 palette bands. 2 octaves is enough for clouds at 100 px. Worley/cellular gives puffier blobs but costs 9 cells per lookup.

**Cited findings**
- Deep-Fold PixelPlanets, `Clouds.gdshader` (MIT, Godot) [C, S7].
  - Value noise with cubic smoothing, fbm with `OCTAVES` loop, amplitude halving.
  - Puffy edges come from `circleNoise`, a hashed circle per cell, summed over 9 offset iterations and added to the fbm domain.
  - `step(cloud_cover, c)` gives a hard edge. Colour picked from 4 entries by depth and distance to light (`light_border_1 = 0.52`, `light_border_2 = 0.62`).
  - Shipped scene values: clouds `OCTAVES = 2`, `cloud_cover = 0.415`, `size = 7.745`, `stretch = 2.0`, `time_speed = 0.47`, `pixels = 100`. Land layers use 3 and 6 octaves [C, S8].
- Red Blob Games [C, S9]. Each octave doubles frequency and halves amplitude. Examples use 3 octaves; the playground exposes 6 (frequencies 1 to 32). For simple use "it doesn't matter that much" which noise family you pick. Perlin shows axis-aligned artefacts; rotate octaves or use simplex. Rounding to 2 to 15 levels gives terraces.

**Inferences**
- Octave budget at 320x180 [I]. If the base cloud is about 128 px wide, octave 4 has 16 px features, octave 5 has 8 px, octave 6 has 4 px. After a hard threshold, octaves with features under 4 px only make single-pixel noise on the edge. So 3 to 4 octaves for cloud shadows and big fog banks, 2 for small sprite clouds (matches S7).
- Noise choice [I]. Value noise is cheapest and its blockiness disappears after thresholding. Simplex avoids Perlin's grid look on soft gradients. Worley (F1) is best for "cauliflower" cumulus tops but needs 9 neighbour cells per sample. Bake any of them into a 128 or 256 texture once (Godot `NoiseTexture2D`, seamless) and the runtime cost is one fetch.
- Hand-drawn clusters (3 to 5 overlapping circles with a flat dark underside band) still beat noise for "hero" clouds in praised pixel art. Use noise for shadows and fog fields, sprites for visible clouds [I].

**Gaps**
- No artist interview found on cloud shading rules for top-down pixel games. The fog/artistic researcher may cover Saint11 or Pedro Medeiros style guides.

---

## Q5. Weather and cloud cover as server state

**Takeaway.** Weather state is tiny. Commercial games keep it as a few flags plus timers (Minecraft), a daily roll (Stardew), a moisture meter (Don't Starve) or a wind target (Terraria). For Asterion, one byte per region per state change, broadcast only on change, and let clients derive everything visual from that byte plus a shared seed and clock.

**Cited findings**
- Minecraft Java [C, S10]. 20 ticks per second. Rain flag on for 12,000 to 24,000 ticks (10 to 20 min), off for 12,000 to 180,000 ticks (10 min to 2.5 h). Thunder flag on for 3,600 to 15,600 ticks (3 to 13 min), off 12,000 to 180,000. Thunder only matters while rain is on. Each flag is a toggle plus a countdown that picks a new random value at zero. Rain adds grey fog and darkens the sky.
- Stardew Valley [C, S11, S12]. Weather for tomorrow is set in `Game1::newDayAfterFade()`. Spring rain about 18.3% per day. Summer rain rises from 12.6% (day 2) to 20.1% (day 27). Winter has no rain. Storm odds conflict between sources (25% of rain days vs 4.57% flat in spring; 85% of summer rain becomes storm). Treat these as wiki values, unverified against code.
- Terraria 1.4.0.5 [C, S13]. Wind is two floats, `windSpeedCurrent` and `windSpeedTarget`, updated every tick (1/60 s), 0 to 60 mph. Gusts every 15 to 45 s change the target by up to ±1.25, ±2.5 or ±5 mph (25/37.5/37.5%). The target is capped at 40 mph. Extreme gusts after 10 to 60 gusts. Only the target is saved. Wind moves clouds; the page gives no cloud speed.
- Don't Starve (Together) [C, S14]. A world moisture meter rises to a season ceiling, then it rains until moisture drops to a floor. Precipitation follows a sine-like curve, light at start and end. Autumn ceiling 3840 to 7680, spring 2640 to 5280, floor multiplier 0.25 or 0.0625. Surface and caves have separate weather.
- CESCG 2026, Aszyk, hybrid weather (Unity, non-peer-reviewed) [C, S15]. 8 states (sunny, cloudy, rain, snow, hail, storm, tornado, fog) with a daily transition matrix built from 50 years of Szczecin data. Self-transitions are sunny 0.707, cloudy 0.737, rain 0.370, fog 0.457. From fog, the next day is cloudy 0.26 or rain 0.23. Fog rule is "cold (-2 to 8 °C) and rain in the last 3 days". Wind direction comes from 1D Perlin over time. In a study with 20 people, weather changed every 30 s over 4 min; the realistic chain was preferred 95% to 5% and 85% to 15% on two questions (p < 0.0001, p = 0.0026), and RPG preference was a tie.
- Markov chains in game design [C, S16]. Tune self-transition probabilities to control streakiness. A "how long has it lasted" modifier breaks the Markov property, which is fine for design.

**Recipe for Asterion [I]**
```
region weather byte:  bits 0-2 sky   (clear, few, broken, overcast, rain, storm, fog, snow)
                      bits 3-5 intensity 0..7
                      bits 6-7 wind octant pair or season flag
server: every 10 to 20 real minutes per region, roll a 8x8 Markov row
        (season picks the matrix; Don't-Starve-style moisture can bias rain)
send:   {region_id u16, byte u8, start_time u32} on change only = 7 bytes
client: cloud_cover, fog_density, wind = lerp over 60 to 120 s from old byte to new
        cloud noise offset = wind * server_time (shared clock), so shadows match across players
```
- Bytes: with 64 regions and one change per 15 min, that is about 0.5 bytes per second for the whole world [I].
- Ground fog is not a weather roll alone. Combine the region byte with time of day and terrain (Q6), so a "clear" night still makes valley fog at dawn [I].

**Gaps**
- Stardew 1.6 `Data/LocationContexts` weather conditions not read (wiki returned 403).
- Don't Starve Lua (`components/weather.lua`) not read; table column meaning unverified.
- Terraria cloud count and cloud speed formula not found.

---

## Q6. Real meteorology, simplified for game rules

**Takeaway.** Four fog types cover almost everything a fantasy map needs. Radiation fog forms on clear, calm nights, pools in valleys, is deepest around sunrise, and clears from the edges inward after sunrise. Advection fog needs wind and rolls in from cold water. Steam fog rises off warm water into cold air. Use those as rules driven by time of day, wind and a height map.

**Cited findings**
- Definitions [C, S17]. Fog means visibility under 1,000 m (public forecasts use 180 m). Dense fog is under 100 m. Mist is over 1,000 m and "disperses quickly in light winds". Haze is dry particles.
- Radiation fog [C, S17, S18, S19].
  - Clear skies and calm air at night; most common late autumn and winter; long nights help.
  - Calm air keeps it in a shallow layer. Wind of 2 to 7 knots thickens it. Stronger wind prevents it by mixing in dry air (S19).
  - Deepest around sunrise; evaporating dew can thicken it at sunrise (S18).
  - Usually clears soon after sunrise as the ground warms (S17). The faster the ground warms, the faster it goes (S19).
  - It often lifts into thin stratus layers instead of vanishing (S19).
  - It "dissipates from the edges toward the center" (S19).
  - It can form about 30 m above ground and build downward (S19).
- Valley fog [C, S17, S19]. Cold dense air drains into valleys and makes very dense fog. It can last several days in calm winter weather. Trapped valley stratus can persist two weeks or more, thickening each night and lasting longer each day.
- Advection fog [C, S17, S18, S19]. Warm moist air over a colder surface. Always needs wind. Light winds of 3 to 9 knots; above 9 knots it lifts into low stratus (S19). UK east coast "haar" rolls in on east winds in spring and summer and burns off fast over warm land (S17).
- Upslope fog [C, S19]. Air pushed up a slope; above 10 to 12 knots it becomes stratus. Forms high and builds down into valleys.
- Steam fog (sea smoke) [C, S18, S19]. Cold air over warm water. Wisps rising off lakes and rivers in autumn and early winter, or off a wet road after summer rain. Visibility often 300 m or less. Duration usually under 18 h, dense steam fog 6 h or less; cold-advection sea fog depth about 110 to 120 ft.
- Dissipation timing is variable. A 7-year study of 250 fog events at SIRTA (France) found the timing "can be very variable" [C, S20, search summary only].

**Game rules [I]**
| Fog type | Spawn condition | Shape on map | Timing in game hours | Clears |
|---|---|---|---|---|
| Radiation / valley | sky clear or few, wind 0 to 2 (of 7), night | tiles with height <= fog_top | starts 2 to 4 h after dusk, peaks at sunrise | 1 to 3 h after sunrise, lower fog_top so high edges clear first |
| Advection / coastal | wind blows from sea, wind 1 to 4 | band from coast, advected inland on the density grid | any time, most at night and morning | wind > 4 lifts it to cloud cover; warm land erodes it by afternoon |
| Steam / water mist | cold air over water: dawn, autumn, after rain | 1 to 2 tiles over water tiles, wisps rising | dawn and early morning | 1 to 3 h after sunrise |
| Swamp haze | swamp biome | always low density, thicker at night | all day | never fully |
- The "edges first" rule is free with a height threshold. Lowering `fog_top` uncovers the higher rim tiles first, so the fog shrinks toward the valley floor exactly as S19 describes [I].
- "Lifts into stratus" can be shown by moving density from the ground fog layer into the cloud cover value for an hour after burn-off [I].

**Gaps**
- No clean climatology number for "hours after sunrise" found. The 1 to 3 h value is my estimate from "soon after sunrise" and "a few hours".
- Two PDFs (ITU, COMET) could not be read as text.

---

## Q7. Fog pooling in low ground (height threshold)

**Takeaway.** Per tile, `fog = clamp((fog_top - height) / fade, 0, 1) * time_factor * weather_factor`. Store it in a small texture (one texel per tile) and let bilinear filtering plus dither make soft edges.

**Cited findings**
- Valley fog is confined by terrain and fed by cold air drainage [C, S17, S19].
- Fire study #6 measured density advection plus decay at 0.31 ms for 320x180 in JS and an integer CA at 0.077 ms; at 64x64 the CA took 0.009 ms (0.28 ms in GDScript) [C, S6b].

**Inferences**
- Tibia-like 15x11 tile view with a margin needs about 20x16 tiles. A 32x32 fog texel grid per chunk is 1 KB as R8. Upload only when changed, at 2 to 5 Hz [I].
- Height in Asterion is the floor number plus a per-tile "lowness" byte authored or derived from water distance [I].
- Draw: sample the per-tile fog texture with linear filtering, add a slow scrolling noise (1 fetch, 3 to 8 px/s) to break up the edge, then threshold through a 4x4 Bayer matrix to 2 or 3 palette steps [I].

**Gaps**
- No shipped 2D game found that documents a height-threshold fog. Likely common in 3D (height fog) but undocumented in 2D pixel games.

---

## Q8. Cheap fog density field on a coarse grid (advection, diffusion)

**Takeaway.** Reuse the Fire #6 smoke grid with different constants. Fog is the same field as smoke but with slower decay, no upward term, a source from rules in Q6, and wind advection. Run it at tile resolution at 2 to 5 Hz. Stam's solver is not needed.

**Cited findings**
- Fire #6 numbers above [C, S6b]. Stam with 20 iterations took 32.1 ms at 320x180 in JS; 4 iterations 7.2 ms. Advection plus decay 0.31 ms. Stam's paper says naive explicit diffusion oscillates and finally diverges; the implicit form is stable [C, S6b, S21].

**Recipe [I]**
```
grid: 1 cell per tile (32x32 px), e.g. 64x64 cells per region, u8 or f16
tick: 4 Hz
for each cell:
   src  = rule_source(cell)            // Q6: valley, coast, water, spell
   up   = sample(fog, cell - wind*dt)  // semi-Lagrangian, bilinear, no pressure solve
   avg  = (N+S+E+W)/4
   v    = mix(up, avg, k)              // explicit blur; keep k <= 0.25 per tick for stability
   v    = v*decay + src                // decay 0.995 to 0.999 per tick for fog (much slower than smoke)
   v    = min(v, cap_by_height(cell))  // fog cannot climb above fog_top
render: upload as texture, linear filter, + 1 noise fetch, Bayer threshold
```
- At 4 Hz on 4,096 cells this is roughly the 64x64 CA cost from Fire #6, about 0.01 ms in JS or 0.3 ms in GDScript per tick [I, extrapolated from S6b].
- Interpolate between the last two grid states in the shader so the 4 Hz steps do not show [I].
- MMO split [I]. The server only needs fog where it blocks vision (spells, dense fog). Ambient fog is client-side and deterministic from the region byte, time and seed.

**Gaps**
- No measured cost of this exact fog variant. Needs a sandbox test.

---

## Q9. Noise choices and octave counts at 320x180 (summary table)

| Use | Noise | Octaves | Texture | Speed | Notes |
|---|---|---|---|---|---|
| Cloud shadows | value or simplex, baked | 3 to 4 | 256x256 R8, world scale 2x to 4x | 4 to 20 px/s with wind [I] | hard step + 1 dither band |
| Sprite clouds | value fbm + circle puffs | 2 [C, S8] | procedural or 128x128 | 15 to 30 px/s [C, S1] | 4 colour bands [C, S7] |
| Fog bank overlay | value or simplex, 2 layers | 2 to 3 per layer | 128x128 or 256x256 | 7.5 to 20 px/s [C, S1, S2] | layers at different speeds and directions |
| Ground fog edge breakup | value | 2 | 64x64 or 128x128 | 3 to 8 px/s [I] | multiplied into height fog |
| Puffy cumulus tops | Worley F1 | 1 to 2 | bake only | n/a | 9 cells per sample if live |
All [I] unless tagged. Rule of thumb: after thresholding, octaves with features under about 4 px add only edge noise at 320x180.

---

## Sources
- S1 pokeemerald `src/field_weather_effect.c` (pret): https://github.com/pret/pokeemerald/blob/master/src/field_weather_effect.c
- S2 zelda3 `src/overworld.c` (snesrev), functions around `OverworldOverlay_HandleRain` and overlay selection: https://github.com/snesrev/zelda3/blob/master/src/overworld.c
- S3 Godot Shaders, "TopDown Game 2D Cloud shader" (Jams, 2024-09-07): https://godotshaders.com/shader/topdown-game-2d-cloud-shader/
- S4 Godot Shaders, "Animated Grassy Wind or Cloud Shadow Pixel Patches Overlay" (thatisuday, 2026-01-04): https://godotshaders.com/?p=13985
- S5 Fukyuuten devlog, "Shadows and clipping" (2022-01-30): https://hatchet2k4.itch.io/fukyuuten/devlog/341089/update-1302022-shadows-and-clipping
- S6 Kingsfoil study #5 Light, B4: https://kingsfoil-artifacts.netlify.app/vfx-light-topdown-pixel
- S6b Kingsfoil study #6 Fire & smoke, E1 and §6d: https://kingsfoil-artifacts.netlify.app/vfx-fire-topdown-pixel
- S7 Deep-Fold PixelPlanets `Clouds.gdshader`: https://github.com/Deep-Fold/PixelPlanets/blob/master/Planets/LandMasses/Clouds.gdshader
- S8 Deep-Fold PixelPlanets `LandMasses.tscn` parameters: https://github.com/Deep-Fold/PixelPlanets/blob/master/Planets/LandMasses/LandMasses.tscn
- S9 Red Blob Games, "Making maps with noise functions": https://www.redblobgames.com/maps/terrain-from-noise/
- S10 Minecraft Wiki, Weather: https://minecraft.wiki/w/Weather
- S11 Stardew Valley Wiki, Modding:Weather data: https://stardewvalleywiki.com/Modding:Weather_data
- S12 Stardew Valley Wiki, Weather (diff with percentages): https://stardewvalleywiki.com/Special:MobileDiff/52434
- S13 Terraria Wiki, Wind: https://terraria.wiki.gg/wiki/Wind
- S14 Don't Starve Wiki, Rain: https://dontstarve.wiki.gg/wiki/Rain
- S15 Aszyk, "Hybrid Weather Simulation System for Real-Time Rendering", CESCG 2026: https://cescg.org/wp-content/uploads/2026/04/Aszyk-Hybrid-Weather-Simulation-System-for-Real-Time-Rendering-1.pdf
- S16 Gametek, "Markov Chains for the Game Designer": https://gametek.substack.com/p/markov-chains-for-the-game-designer
- S17 Met Office, "What is fog?": https://weather.metoffice.gov.uk/learn-about/weather/types-of-weather/fog
- S18 CIMSS, "Condensation: dew, fog and clouds": https://cimss.ssec.wisc.edu/wxwise/class/dewfog.html
- S19 NWS training, Fog guide (fog types, radiation fog factors, sea fog): https://www.weather.gov/media/zhu/ZHU_Training_Page/fog_stuff/fog_guide/fog.pdf
- S20 SIRTA fog dissipation study (via search result, ACP 2023): https://acp.copernicus.org/articles/23/15711/2023/acp-23-15711-2023.pdf
- S21 Jos Stam, "Real-Time Fluid Dynamics for Games" (GDC 2003), contrast only: https://www.dgp.toronto.edu/public_user/stam/reality/Research/pdf/GDC03.pdf

See it in action
- Pokémon Emerald weather (Route 119 fog, sunny clouds): https://bulbapedia.bulbagarden.net/wiki/Weather (may be blocked; code in S1)
- ALttP Lost Woods fog overlay: https://github.com/snesrev/zelda3 (run the reimplementation)
- PixelPlanets live demo: https://deep-fold.itch.io/pixel-planet-generator
- Fukyuuten cloud shadow GIF: S5
