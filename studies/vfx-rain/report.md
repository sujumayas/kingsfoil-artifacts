# Top-down pixel rain: tiny algorithms for drizzle, downpours and everything that gets wet

**Kingsfoil Studios · Research study · November 2026**

---

## Context

This is study #3 in our VFX series. Each study picks one concept and hunts for old-school algorithms that are very small and very efficient.

- **Study #1, snow** [S2]: a per-pixel depth byte drawn through a dither threshold, an exposure mask with wind lee rays, footprints, melt, and palette lighting.
- **Study #2, acid** [S3]: a per-pixel liquid amount with flow and a film threshold, a material reaction table, a fumes grid, and glow through palette selection.

The reference case is still the **DOOM PSX fire** [S1]: one number per cell, one local rule, one palette.

Rain is mostly **a state of the whole world**. Any single drop matters for a fraction of a second. What players remember is the response: darker stone, puddles in the ruts, rings on the pond, the dry strip under the eaves, the campfire hissing out, and the eaves still dripping after the sun returns.

**Targets.** Godot 4, web-first, so the **Compatibility renderer**: WebGL 2, no compute shaders, limited GPU particles. The art is top-down pixel art for the Tibia-like MMORPG **Asterion Online** and for a top-down RPG.

**Scope.**
- **In:** rain from drizzle to storm, wind, and standing water (ponds, pools, fountains, puddles); how materials get wet and dry; drips, splashes, footprints, fire, lightning, and gameplay.
- **Out:** rivers, the sea and waterfalls.
- **Fog** appears only as an interaction: spray haze in heavy rain, and evaporation mist afterwards.

Sources: eight research notes and our playable **Rain Sandbox** [S4].

---

## 1. Executive summary

1. **One intensity knob drives everything, and the tiers come from meteorology.**
   - Drizzle has drops under 0.5 mm. Light rain is ≤ 2.5 mm/h, moderate 2.6–7.6, heavy above 7.6, and violent above 50 mm/h [V, S75, S77].
   - Weber drives near streaks, far haze and drop sizes from **one rain rate in mm/h** [V, S107]. Remember Me interpolates every parameter from intensity, with named tiers at 0.33 / 0.66 / 1.0 [V, S59].
   - Going up a tier should change drop **size, speed and length**, not just count. Under Marshall–Palmer, the drop flux rises only ~3.7× from light to violent rain [I, from S79]. The Sandbox's drop counts follow that ratio closely [V, S4; I].
2. **Draw falling rain as layers, and use particles only where drops touch the world.**
   - ToyShop's full-screen rain layer cost 4.11 ms, versus 19.45 ms for 5–10K CPU particles [V, vendor, S58]. Remember Me's four layers cost ~1.7 ms "the same whatever the strength" [V, vendor, S59].
   - ALttP blends one pre-drawn overlay at 50 % [V, S13]. Emerald needs at most **24 sprites**, and picks each drop's **landing cell first** [V, S5].
   - Streaks belong to the weather; splashes belong to the ground [I].
3. **Wetness is one byte per cell, drawn through a dither threshold into a wet palette variant.**
   - This is the snow study's depth byte again [S2].
   - Porous, bright materials darken most: sand goes from 0.182 to 0.091 albedo [V, S111]. Metals don't darken; they gain a film [V, S62].
   - The shine dries before the darkening [V, S62].
4. **Puddles are water depth plus infiltration by material, in depressions. Ripples come at two prices.**
   - The cheap form is Lagarde's flood level against a depth mask [V, S60].
   - The reactive form is the acid study's flow rule with FAO infiltration rates: clay 1–5 mm/h, loam 10–20, sand highest [V, S83; I].
   - Ripples are either a Hugo Elias two-buffer field [V, S168] or a stateless ring field that adds layers with intensity [V, S60, S144].
5. **Shelter is a map, and shelter moves water.**
   - Disco Elysium "misuses" a shadow map [V, S49], and Veloren renders rain occlusion [V, S159]. Both are a cover map with a wind-tilted lee.
   - Roofs and canopies **store** rain, release it as eave drips and throughfall, and keep dripping after the rain [V, S108, S59].
   - Turn rain off indoors with a script state [V, S16, S57].
6. **Rain changes play through a few crisp rules, and lightning must be safe.**
   - **Wetness meters:** DST caps at 100 with effects from 35 [V, S34]; Valheim's Wet lasts **120 s** and resets [V, S45].
   - **Fire:** Minecraft puts it out with a 20 % + 3 %·age chance [V, S43].
   - **Elements:** Pokémon Water ×1.5 / Fire ×0.5 [V, S23]; FFT ×5/4 / ×3/4 [V, S25]; DOS2 Wet + Shocked = Stunned [V, S41].
   - **Tactics:** Advance Wars −1 vision [V, S26], Fire Emblem 2–3 movement [V, S27], and Hunt's "rain masks footsteps" [V, S48].
   - **Lightning** is a palette event. Emerald lifts shadows only half as much as highlights [V, S6]. WCAG allows **no more than three flashes in any one second** [V, S54].
7. **Godot plan: a server-authoritative weather state, a few data textures, one ground shader.**
   - The server owns intensity, wind and seed, as Ultima Online's weather packet did [V, S18]. Clients simulate the rest.
   - Wetness, water, cover and ripple maps live in R8/RGBA8 textures. Update them on the CPU at 4–15 Hz, or with `DrawableTexture2D` (Godot 4.7; in the Compatibility driver, but marked experimental) [V, S118, S122].
   - One CanvasItem shader does the dither, the wet LUT, the puddle mask and ripple shading. There is no compute on web [V, S126].

---

## 2. How to read this study

| Tag | Meaning |
|---|---|
| **[V]** | Verified in a source our researchers read: code, paper, docs, wiki or article. "[V, vendor]" = developer- or speaker-reported figure; "[V-secondary]" = read via a mirror or restatement. |
| **[I]** | Author inference or design proposal; untested unless it says "Sandbox", and then tested only in our JavaScript prototype. |
| **[U]** | Unverified: memory, a search title, or an unconfirmed source. Treat it as a lead. |
| **[K]** | Textbook or canonical-paper knowledge. |

- [S#] refers to §14.
- Ratings (1–5) are author judgement, in the order **Simplicity · Speed · Pixel taste · Reactivity · Readability**.
- "Estimated" costs are operation counts, not benchmarks.
- **[I, Sandbox run]** marks numbers from replaying the Sandbox's own code headless in Node.js at 60 steps/s with wind fixed at 0.3. They are illustrative.
- Pixel conversions assume **32 px = 1 m** [I].

---

## 3. Generations: a timeline

**Gen 0: the physics of rain (1908–1999)**
- **1908:** Worthington's *A Study of Splashes* [V, S91].
- **1949:** Gunn & Kinzer's terminal velocities [V, citation, S80].
- **Marshall–Palmer** drop sizes, `N0 = 8000`, `Λ = 4.1·R^−0.21` [V, S79].
- **1988:** Lekner & Dorf explain why things look darker when wet [V, S111].
- **1990:** Nakamae et al.'s drive-simulator lighting model, whose wet-road classification Lagarde reuses [V, S115, S60].
- **1999:** Jensen et al. render wet materials [V, S112].

**Gen 1: palette and overlay rain (1991–1996)**
- **1991:** *A Link to the Past* adds a 50 % BG1 overlay and colour-math lightning [V, S13].
- **1992:** *Ultima VII* has 200 drops at 10 Hz and no rain indoors [V, S16].
- **1994:** *FFVI*'s Zozo, where it constantly rains [V, S30].
- **1996:** *Harvest Moon* waters crops in rain [V, S28].
- **Undated:** Mark Ferrari's palette-cycled rain [V, S166].

**Gen 2: systemic weather in handhelds, tactics and MMOs (1997–2008)**
- **1997:** *Ultima Online*'s weather packet [V, S18]; *FFT*'s rain modifiers [V, S25].
- **1999:** Pokémon Gold/Silver's battle rain [V, S23]; *The Watchmaker*'s ripples [V, S168].
- **2000:** *Diablo II*'s cut Mud column [V, S19].
- **2001–03:** *Advance Wars* [V, S26] and Pokémon Gen III's 10/16/24-sprite rain [V, S5].
- **2003:** *Fire Emblem 7*'s rain movement costs [V, S27].
- **~2004:** Ragnarok Online removes its rain [V-secondary, S17].
- **2005/08:** Advance Wars rain forces Fog of War [V, S26].

**Gen 3: image-space rain and wet materials (2003–2013)**
- **2003:** Starik & Werman [V, S101].
- **2004:** Wang & Wade's double cone (*Flight Simulator 2004*) [V, S100].
- **2004–07:** Garg & Nayar [V, S93–S97].
- **2006:** ToyShop [V, S57] and Rousseau [V, S102].
- **2009:** Puig-Centelles [V, S104].
- **2012–13:** Lagarde's *Remember Me* series [V, S59–S62], CryEngine Rain [V, S63], Creus & Patow [V, S106].

**Gen 4: one-knob physics and systemic weather (2015–2021)**
- **2015:** Weber's `β = 0.312·R^0.67` [V, S107].
- **2016:** Weber's throughfall model [V, S108]; Disco Elysium's "Weather duty" devblog [V, S49].
- **2019/2021:** Halder and Tremblay [V, S110].
- **2021:** Ghost of Tsushima's vorticles [V, S66].

**Gen 5: 2024–2026**
- **2024-03-17:** Pico Ripples [V, S182].
- **2025-08-12:** "Rain Drop (floor effect)" [V, S144].
- **2025-10-02:** *Ghost of Yōtei*'s character wetness grid [V, S186].
- **2025-11-25:** WebGPU in all major browsers [V, S127].
- **2026-01-30:** DrawableTextures PR merged [V, S124].
- **2026-03-13:** Borderlands 4 weather talk at GDC [V, S188].
- **2026-04-23:** GodotCon pixel-VFX talk [V, S130].
- **2026-06-19: Godot 4.7** [V, S118, S119].
- **2026-07-21:** third-party WebGPU backend, reportedly ~4× WebGL [V, speaker-reported, S128].
- **August 2026:** BudgetPixel's rain tutorial [V, S52].
- **2026-09-29:** Weather FX Free [V, S135].
- **2026-10-16:** *rain98* preview [V, S190].

---

## 4. Technique profiles

There are eight families:

- **A.** Falling rain
- **B.** Wind
- **C.** Ground response
- **D.** Standing water
- **E.** Drips and shelter
- **F.** Storm and interactions
- **G.** Fog interaction
- **H.** Rendering and taste

Each profile ends with ratings for Simplicity · Speed · Pixel taste · Reactivity · Readability (1 = poor, 5 = excellent; author judgement). Sandbox constants are listed in full in §8.

### Family A: Falling rain

### A1. Pre-drawn overlay layer (ALttP) and colour-cycled paths (Ferrari)

*In plain words.* Draw one sheet of rain once. Lay it over the whole screen at half strength and jump it to a new position every few frames. Nothing is simulated, yet it reads as a storm.

*How it works (technical).*

ALttP loads rain overlay 0x9F into BG1 [V, S13, S14]:
- `CGADSUB = 0x72` means add-and-halve: a **50 % blend** over the scene.
- Every 4 frames the BG1 scroll jumps by X `{1,0,1,0}<<8` and Y `{0,17,0,17}<<8`, a 15 Hz cadence. We infer this shows four pre-drawn quadrants of a 512×512 map [I].
- The overlay scrolls at **½ camera speed** for parallax.

Ferrari paints each drop as "a dot or dash of noticeably contrasting color" on a palette-index path. The rest of the path's colours match the background [V, S166]. Canvas Cycle's cycles are `{rate, reverse, low, high}`, and only cycling pixels are redrawn [V, S163].

```
every 4 frames: frame = (frame + 1) & 3
uv = screen_uv*scale + frame_offset[frame] + camera_pos*0.5/tex_size
COLOR = mix(world, rain_tex(uv), 0.5*intensity_alpha)
```

*Cost / performance.* One fetch and one blend per pixel, at constant cost. One 64–128² tile per tier [I, note 08].

*Games that used it.*
- Zelda: A Link to the Past: https://github.com/snesrev/zelda3/blob/master/src/overworld.c
- Mark Ferrari, Living Worlds / Canvas Cycle (V08RAIN, V30RAIN): https://experiments.withgoogle.com/canvas-cycle

*How it feels.* A dense, chunky retro storm that floats above the world [I].

*Risks.*
- Naive scrolling gives "strong repeating patterns" [V, S58].
- The layer is blind to roofs.
- Ferrari paths suit static screens, not scrolling worlds [I].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 4 · Reactivity 1 · Readability 3

### A2. Landing-first sprite drops (Pokémon Emerald)

*In plain words.* Choose where the drop will land, then work backwards to where it must start. It falls for a fixed time and splashes exactly there. No collision test is needed.

*How it works (technical).* From `field_weather_effect.c` [V, S5, S7]:
- **Sprite counts:** rain **10**, thunderstorm **16**, downpour **24**, each 16×32. Sprites are added one every 8 frames for rain and every 4 frames for storms.
- **Velocity:** rain (−6.5, +13) px/frame, downpour (−10, +20). Both slant at **atan(0.5) ≈ 26.6°**.
- **Fall time:** 18 or 12 frames.
- **Spawn:** `r = rand % 600` picks a cell on the 30×20 grid of 8-px tiles, then `pos −= velocity × fallFrames`.
- **Space:** drops fall in screen space; the splash (7 or 10 frames) is pinned to the world.
- **Desync:** sprite *i* is pre-simulated by `i·9` frames.

```
spawn(d): d.land = cell_center(rand() % (COLS*ROWS)); d.t = FALL; d.pos = d.land - d.vel*FALL
tick(d):  if d.t-- > 0: d.pos += d.vel else: world_splash(d.land + cam, surface_at(d.land)); spawn(d)
```

*Cost / performance.* At most 24 sprites on a 240×160 screen. The surface lookup at landing is free [V, S5; I].

*Games that used it.*
- Pokémon Emerald: https://github.com/pret/pokeemerald/blob/master/src/field_weather_effect.c
- Pokémon Ruby/Sapphire, Route 119: https://bulbapedia.bulbagarden.net/wiki/Hoenn_Route_119

*How it feels.* Clean and readable: every drop ends in a splash [I].

*Risks.*
- It looks sparse at modern resolutions, so pair it with A1 or A4 [I].
- pokeemerald has **no licence**: study only [V, S5].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 5 · Reactivity 4 · Readability 5

### A3. Streak particles with a z-height and wind slant

*In plain words.* A drop is a ground point plus a height. Draw it as a short line above its point, leaning with the wind. When the height reaches zero, it lands there.

*How it works (technical).*

Precedents:
- Exult's Ultima VII moves **200** drops (+6, +6) px every **100 ms**. It ramps in by +0–4 drops per tick [V, S16].
- PICO-8 draws `line(x, y, x+xspd, y+yspd)` [V, S181].

Sandbox [V, S4]:
- `z` is 40–100. The far, mid and near layers hold 50 / 35 / 15 % of the drops.
- Fall speed `vz = [110,170,240]·(0.55 + 0.45·I)`, with drift `0.55·wind·vz`.
- The head is drawn at `(x − 0.55·wind·z, y − z)`. Length is `[2,4,7]·(0.5 + 0.6·I)`, and the far layer is dithered.

```
d.z -= VZ[layer]*(0.55+0.45*I)*dt ; d.x += wind*VZ[layer]*0.55*dt ; if d.z <= 0: impact(d); respawn(d)
```

*Cost / performance.*
- About 6 ops plus L pixel writes per drop. 300 drops × 5 px is ~2.6 % of a 320×180 screen [I, note 08].
- PICO-8 lagged at 5× the drop count [V, S181].
- Draw them with one MultiMesh [I].

*Games that used it.*
- Ultima VII (Exult): https://github.com/exult/exult/blob/master/effects.cc
- PICO-8 "Rainy Day": https://www.lexaloffle.com/bbs/?pid=61845

*How it feels.* The top-down answer to "where does it land?", matching the snow study's z-height flakes [I, S2].

*Risks.*
- Cost grows with intensity [V, S59].
- Ragnarok Online removed its rain, likely for performance [V-secondary, S17].
- The Sandbox's storm needs 1,360 drops [V, S4].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 3 · Pixel taste 5 · Reactivity 5 · Readability 4

### A4. Hashed-cell shader layers

*In plain words.* Split the screen into invisible cells. A hash decides whether each cell holds a drop. Two or three layers at different scales and speeds give depth, at a constant cost per pixel.

*How it works (technical).*

Weather FX Free (CC BY 4.0) [V, S135]:
- **3 layers**, `depth = 0.35 + 0.325·i`, parallax `local + world_origin·depth`.
- Wind skew: `q.x −= q.y·wind·0.6`.
- Columns are `10 + 14·depth` px wide; fall speed is `(520 + 780·depth)·fall_speed` px/s.
- A cell is empty when `hash > density·(1.3 − 0.3·depth)`.
- Pixel mode sets `aa = 0.01`.

Other shaders:
- Remember Me uses four camera-attached layers that reveal more drops as intensity rises: `RainColor·0.09·Intensity`.
- Lagarde suggests a per-drop threshold instead, `tex.g < intensity`. That is the snow study's dither idea [V, S59; I].

```
for layer in 0..2: depth = 0.35+0.325*layer ; q = skew(world_px*depth, wind)
  cell = floor(q / cell_size(depth)) ; if hash(cell) < I*(1.3-0.3*depth): draw streak at hashed offset
```

*Cost / performance.* About 3 hashes per pixel at any intensity. Avoid shaders that loop over every drop for each pixel: "Simple rain/snow" does 150–2,000 iterations and WeatherSystem2D 300 [V, S143, S136].

*Games that used it.*
- Remember Me: https://seblagarde.wordpress.com/2012/12/27/water-drop-2a-dynamic-rain-and-its-effects/
- ATI ToyShop: https://history.siggraph.org/?p=48401

*How it feels.* Smooth and dense, and stable under camera motion when anchored to the world [I].

*Risks.*
- Blind to roofs unless the shader samples the cover map (E1).
- Weather FX Free requires attribution, says "Made with AI assistance" and has side-view splashes [V, S135].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 4 · Reactivity 2 · Readability 4

### A5. Rain curtains from scrolling noise

*In plain words.* Storms come in sheets. Multiply drop density by a large, slow noise that drifts with the wind, so bands of heavier rain sweep across the map.

*How it works (technical).*
- Note 03 [I]: `spawnProb = base·(0.5 + 0.5·noise((p − wind·t·S)/L))^p`, with L ≈ 4–10 tiles and p = 1–3. Tie the gusts to the same noise.
- Sandbox [V, S4]: `curtain = 0.45 + 0.75·vnoise((x − 42·wind·t)/46, y/38 + 0.04·t)`. It drives drop spawning (by rejection) and background wetting.
- In a storm, the dirt-path puddle area swings between about 400 and 1,250 px as sheets pass [I, Sandbox run].

*Cost / performance.* One noise lookup per spawn [I].

*Games that used it.*
- Abandon Ship: https://www.pcgamer.com/how-developers-make-perfect-rain-in-games
- Creus & Patow's storm map (academic): https://dugi-doc.udg.edu/handle/10256/11986

*How it feels.* The cheapest step from "texture" to "weather": you see the storm move [I].

*Risks.* Large scales look like the screen breathing. Keep the gain near 1.3× [I, S81].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 4 · Reactivity 3 · Readability 4

### A6. Drizzle versus downpour: what changes between tiers

*In plain words.* Heavier rain means bigger, faster, longer drops and harder splashes, not only more drops. Drizzle is its own look: tiny, slow specks with haze and no splashes.

*How it works (technical).*
- **Drizzle:** drops are 0.2–0.5 mm and cut visibility more than light rain [V, S75, S76]. It falls at 0.7–2 m/s; rain falls at 2–9 m/s [V, vendor, S78].
- **Marshall–Palmer** [I, note 03, from S79]: about 1,100 / 2,400 / 3,900 / 6,600 / 8,800 drops hit each m² per second at 0.5 / 2.5 / 7.6 / 25 / 50 mm/h. From light rain up, that is a ratio of **1 : 1.6 : 2.8 : 3.7**.
- **Games:** Emerald raises count and speed at a fixed angle [V, S5]. FFT tiers differ in drop speed and frequency [V, S25].
- **Sandbox** [V, S4]:
  - Levels: 0.12 / 0.3 / 0.5 / 0.75 / 1.
  - Drop count `60 + 1300·I^1.25` gives 152 / 349 / 607 / 967 / 1,360. From light rain up, that is 1 : 1.74 : 2.77 : 3.9.
  - Near drops speed up from 145 to 240 px/s and lengthen from 3 to 7 px.

*Cost / performance.* A parameter table [I].

*Games that used it.*
- Pokémon Emerald: https://github.com/pret/pokeemerald/blob/master/src/field_weather_effect.c
- Final Fantasy Tactics: https://finalfantasy.fandom.com/wiki/Weather_(Tactics)

*How it feels.* Tiers you can name by eye; Remember Me's named tiers became a shared vocabulary for its team [V, S59].

*Risks.*
- Remember Me skipped drizzle as "barely visible" [V, S59]. Sell drizzle with haze and speckles instead [I].
- In the Sandbox, drizzle soaks 91–99 % of the ground within 60 s, because there is no per-tier ceiling [I, Sandbox run].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 5 · Reactivity 3 · Readability 5


### Family B: Wind

### B1. Slant, gusts and one shared wind value

*In plain words.* Wind pushes drops sideways. A streak's lean is wind speed divided by fall speed, so drizzle blows almost flat and big drops stay steep. Gusts add about a third. Everything that sways should read the same number.

*How it works (technical).*
- **Lean:** `tan θ = u/v` [K; I, note 03]. A 2 mm drop leans 9° / 25° / 38° / 57° in 1 / 3 / 5 / 10 m/s wind; drizzle leans ~56° at 3 m/s.
- **Gusts:** gust factor **1.29** over 67 samples; 1.3 is recommended [V, S81]. So `wind = mean·(1 + 0.3·g(t))` with 2–6 s envelopes [I].
- **One shared wind:**
  - Ghost of Tsushima: one global vector with Perlin gusts, plus local "vorticles" [V, S66].
  - Yōtei: "the trees know how strong the wind is" [V, S187].
- **Sandbox:** 1-D wind with `dx/dz = 0.55·wind`, i.e. 28.8° at full wind [V, S4].

```
wind = base_dir * base_speed * (1 + 0.3*gust(t))      // global shader param: slant, sway, curtains, lee
slant[layer] = wind_speed / fall_speed[layer]
```

*Cost / performance.* One global uniform, which Compatibility supports [I, note 02].

*Games that used it.*
- Ghost of Tsushima: https://gdcvault.com/play/1027350/Blowing-from-the-West-Simulating
- Abandon Ship: https://www.pcgamer.com/how-developers-make-perfect-rain-in-games

*How it feels.* Rain with a direction feels like weather [I].

*Risks.*
- Pixel streaks only look clean at 0, 1:4, 1:2 and 1:1 slopes [I].
- If systems read different winds, the grass sways against the rain [I].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 4 · Reactivity 3 · Readability 4

### B2. Rain shadow: exposure rays per wind bucket

*In plain words.* Downwind of a wall the ground stays drier. Work this out once for each wind direction and strength, and store a per-cell exposure.

*How it works (technical).*
- **Lee rays (note 03),** like the snow study's [I, S2]: walk upwind from each cell, and if an obstacle reaches the ray, the cell is in its shadow.
  - Canopies let through 0.65, since DST trees cut wetting by 35 % [V, S35].
  - A 3 m wall at 5 m/s shelters about 2 tiles [I].
- **Disco Elysium:** "I misuse a shadow map to mask whatever comes down from sky" [V, S49].
- **Sandbox** [V, S4]:
  - Rays are rebuilt when `round(3·wind)` changes and reach up to 26 px.
  - Obstacle heights: house 30, trunks 22, wall 9.
  - Lee length `L = 0.9·h·|wind| + 1.5`, then `e *= 0.08 + 0.92·(d/L)²`.

```
on bucket change: for ground cell c: for d in 1..26: p = c - sign(w)*d
   if height[p] > 0: L = 0.9*height[p]*|w| + 1.5 ; if d < L: e *= 0.08+0.92*(d/L)^2 ; break
```

*Cost / performance.* Zero per frame. Cache 8 directions × 4 strengths [I].

*Games that used it.*
- Disco Elysium: https://discoelysium.com/devblog/2016/02/10/weather-duty
- Far Cry 6 (wetness shadow map): https://www.ubisoft.com/en-us/company/how-we-make-games/technologies/articles/simulating-tropical-weather-in-far-cry-6

*How it feels.* A dry strip that moves with the wind, which NPCs can seek out [I].

*Risks.*
- No shipped game was found using upwind rays for rain [V, note 03 gap].
- The Sandbox lee falls only left or right [V, S4].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 4 · Reactivity 4 · Readability 4

### Family C: Ground response

### C1. Wetness byte plus a dither threshold

*In plain words.* Each cell stores how wet it is (0–255), and each pixel has its own fixed threshold. A pixel shows its wet colour once the wetness passes that threshold. Drizzle wets the ground in speckles that grow together, and drying reverses the picture.

*How it works (technical).*
- This is the snow study's depth byte plus a Bayer threshold [V, S2; I].
- Tick: `wet += rain·exposure·ABSORB[m] − DRY[m]·sun·(1 + 0.3·wind)·(1 − shade)`, with drying ×0.1 while it rains [I, note 03].
- **Sandbox** [V, S4]:
  - `thr = 4 + 9·Bayer + 40·hash`, or 999 on water.
  - A drawn drop adds +36 (+60 if near). Each of the `1500·I` virtual drops per step adds +26.

```
wet[c] = clamp(wet[c] + rain*exposure[c]*ABSORB[m] - dry(c), 0, 255)          // 4–10 Hz
row = texture(wet_tex, uv).r > bayer4(FRAGCOORD) ? WET_ROW : DRY_ROW            // fragment
```

*Cost / performance.* About 3 ops per pixel, and 4 KB for 64×64 tiles [I, note 08].

*Games that used it.* None found using a dithered threshold (note 08 gap). Nearest:
- Disco Elysium (spot-by-spot wetting): https://discoelysium.com/devblog/2016/02/10/weather-duty
- Remember Me (global wet level): https://seblagarde.wordpress.com/2013/01/03/water-drop-2b-dynamic-rain-and-its-effects/

*How it feels.* Ground that darkens in spots and stays palette-pure [I].

*Risks.*
- Plain Bayer reads as a grid, so add a hash term [V, S4].
- With no per-tier ceiling, drizzle eventually soaks everything [I, Sandbox run].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 5 · Reactivity 4 · Readability 5

### C2. Wet palette variant by porosity, plus film glints

*In plain words.* Wet things darken unequally: sand and soil a lot, stone a little, metal hardly at all. Metal gains a shiny film instead. So each material moves a set number of palette steps, and smooth materials get a few highlight pixels.

*How it works (technical).*
- **Physics.** Total internal reflection inside the water film (p ≈ 0.437) means bright materials darken the most [V, S111].
  - Sand: 0.182 → 0.091. Black mould: 0.141 → 0.084 [V, S111].
  - Volcanic sand: −35 % [V, S113].
  - Wet wood ≈ dry × (0.82, 0.58, 0.38) [V, S62].
- **Games.** Remember Me went from `Diffuse *= lerp(1, 0.3, Wet)` to `factor = lerp(1, 0.2, (1 − metal)·porosity)`, which excludes metals [V, S60, S62]. Lagarde criticises games that apply one factor to everything [V, S62].
- **Pixel mapping** [I, note 04]:
  - Soil, sand, wood and cloth darken 1–2 steps; stone 1; metal 0.
  - Add film glints on metal, cobble and roof.
  - Targets: wet soil at 50–60 % of dry, light stone at 70–85 %.
- **Sandbox:** one wet row for all materials, `×(0.66, 0.69, 0.78)`. Sheen appears above `WET > 200` on 5 % of stone, 8 % of roof and 28 % of metal pixels [V, S4].

*Cost / performance.* One palette row [I].

*Games that used it.*
- Remember Me: https://seblagarde.wordpress.com/2013/04/14/water-drop-3b-physically-based-wet-surfaces/
- S.T.A.L.K.E.R. Clear Sky, Uncharted 2/3, AC3, Crysis 2/3, MGS V (per Lagarde): https://seblagarde.wordpress.com/2013/04/14/water-drop-3b-physically-based-wet-surfaces/

*How it feels.* After splashes, this is the strongest "it rained here" signal [I].

*Risks.*
- "More saturated when wet" is folklore [I, note 04].
- The Sandbox darkens metal too, which is what Lagarde warns against [I].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 5 · Reactivity 3 · Readability 5

### C3. Drying: shine first, then sun, shade, wind and material

*In plain words.* Drying is slower and patchier than wetting. The shine goes first and the dark stain lasts longer. Sunny, raised spots dry first and shaded hollows last.

*How it works (technical).*
- **Lagarde:**
  - Drying follows a sigmoid. Specular goes before darkening, and edges dry first. Wetting is "almost instantaneous" [V, S62, S73].
  - Real drying takes over 30 min, so lerp to dry in ~1 min and let puddles dry more slowly [V, S62].
- **Disco Elysium:** the sun's shadow map sets the drying rate [V, S49].
- **Rules** [I, notes 03, 08]:
  - Decay `shine` ~3× faster than `dark`.
  - Edge CA: `wet = min(wet, max4(nbrs) − k)`.
  - Compress puddle drying 300–700×.
- **Sandbox** [V, S4]:
  - 5,000 sampled pixels per step lose 3 with probability `DRY[m]·factor·0.5`.
  - DRY: grass 1.1, dirt 0.7, stone 3, sand 2.2, wood 1.5, roof 3, cloth 0.55, metal 4.
  - The factor is ×2.6 in sun and ×0.45 of that in shade.
  - Glints need `WET > 200`, so they vanish before the darkening [I].

*Cost / performance.* Sampling cost does not depend on map size; an edge CA is ~6 ops per cell [I].

*Games that used it.*
- Disco Elysium: https://discoelysium.com/devblog/2016/02/10/weather-duty
- Forza Motorsport 7 (drying line): https://gtplanet.net/forza-motorsport-7s-dynamic-weather-system-offers-visceral-experience

*How it feels.* An aftermath you can watch (§6e) [I].

*Risks.*
- Uniform drying [V, S49].
- Drying too fast: Sandbox ground is 90 % dry 17–26 s after the sun returns, and puddles go first [I, Sandbox run].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 5 · Reactivity 4 · Readability 4

### C4. Puddles I: a depth mask against a global flood level

*In plain words.* Paint where water would collect. A global flood level rises with rain and falls after it, and wherever it is above the painted depth, draw water. Puddles grow from their deepest point and shrink back.

*How it works (technical).*
- **Remember Me** [V, S60]:
  - Puddles: `water = saturate((FloodLevel − mask)/0.4)`. Cracks: `min(FloodCrack, 1 − height)`.
  - Full water is flat and glossy, and footsteps switch to water sounds.
- **Rates** (arbitrary units) [V, S59, S60]:

| Tier | I | Splashes | Puddle flood inc/dec | Crack inc/dec | Wet inc/dec | Fog |
|---|---|---|---|---|---|---|
| Light | 0.33 | 20 | 0.1 / 0.05 | 0.2 / 0.1 | 0.6 / 0.2 | 0.15 |
| Moderate | 0.66 | 40 | 0.3 / 0.05 | 0.5 / 0.1 | 0.75 / 0.2 | 0.4 |
| Heavy | 1.0 | 60 | 0.7 / 0.05 | 0.85 / 0.1 | 1.0 / 0.2 | 1.0 |

- **Drizzle:** the flood rate is 0 [V, S60].
- **Far Cry 6:** puddle decals whose alpha acts as a pseudo-SDF [V, S64].

```
flood += (I > 0 ? INC[tier] : -DEC) * dt ; water = clamp((flood - depth_mask(uv)) / 0.4, 0, 1)
```

*Cost / performance.* One fetch and one subtraction per pixel [I].

*Games that used it.*
- Remember Me: https://seblagarde.wordpress.com/2013/01/03/water-drop-2b-dynamic-rain-and-its-effects/
- CryEngine Rain (`PuddlesAmount`): https://cryengine.com/docs/static/engines/cryengine-5/categories/23756816/pages/29796935

*How it feels.* Predictable and art-directed [I].

*Risks.*
- All puddles share one bottom depth [V, S60].
- It ignores runoff [I].
- It pays off where players revisit places [V, S60], as in an MMO town [I].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 4 · Reactivity 2 · Readability 5

### C5. Puddles II: flow plus infiltration by material

*In plain words.* Rain adds water to every cell. The ground soaks some up at its material's rate, and the rest flows downhill. Puddles appear on their own in dirt ruts and cobble dips, never on sand or grass.

*How it works (technical).*
- **FAO infiltration** (mm/h) [V, S83]:
  - sand > 30 (the table says "less than");
  - sandy loam 20–30;
  - loam 10–20;
  - clay loam 5–10;
  - clay 1–5.
- **Rule of thumb:** puddles form where the rain rate beats infiltration. 1 mm/h = 1 L/m²/h [K].
- **Note 03** reuses the acid study's flow rule with a film threshold [I, S3]:

```
h += rain*exposure*K + runoff ; inf = min(h, INFIL[m]*(1-satur)) ; h -= inf ; satur += inf/CAP
if h > FILM: for lower n: f = min(0.25*((z+h)[c]-(z+h)[n]), h-FILM) ; move f ;  if !raining: h -= EVAP*sun
```

- **Sandbox** [V, S4]:
  - Each rain hit adds `RIN[m]·amt/26` (grass 0.03, dirt 0.06, stone 0.025).
  - Each step drains `INF[m] + evap + a·DRN[m]`:

    | Material | INF | DRN |
    |---|---|---|
    | Grass | 0.003 | 0.01 |
    | Dirt | 0.0004 | 0.01 |
    | Stone | 0.0002 | 0.006 |
    | Sand | 0.007 | 0.02 |

  - The film threshold is `FILM = 0.12`.
- **Measured at steady state** (border excluded) [I, Sandbox run]:
  - Drizzle and light rain: no puddles.
  - Moderate: ~24 dirt pixels.
  - Heavy: ~320 dirt and 9 stone pixels.
  - Storm: ~800 dirt and ~500 stone pixels.
  - Grass and sand: never.

*Cost / performance.* Four neighbours per wet cell on an active list [I, S3]. The full Sandbox `simStep` takes 0.76–1.6 ms in Node [I, Sandbox run].

*Games that used it.*
- Forza Motorsport 7: https://gtplanet.net/forza-motorsport-7s-dynamic-weather-system-offers-visceral-experience
- Divinity: OS2 (expanding Rain puddle): https://dos2.wiki/wiki/Rain

*How it feels.* Puddles in the right places without painting them [I].

*Risks.*
- Edge cells that receive flow but never send it pile up water, as in the Sandbox's border artefact [I, Sandbox run].
- Cells near the threshold flicker.
- Gameplay needs a tile-level copy on the server [I].

*Ratings 1–5 (author judgement):* Simplicity 3 · Speed 4 · Pixel taste 5 · Reactivity 5 · Readability 4

### C6. Mud and footprints

*In plain words.* Soaked dirt becomes mud. Mud slows you, splashes brown and keeps deep prints that fill with water. Walking out of a puddle leaves dark prints that fade as they dry.

*How it works (technical).*
- **Note 03** [I]:
  - Mud has hysteresis: it starts at 70 % wetness and ends at 40 %.
  - `wetFeet = max(0.97·wetFeet, wet[under])`. Each step stamps a print, then `×0.8`, giving about 5–8 prints.
- **Sandbox** [V, S4]: one step per 5 px.
  - In a puddle: splash, a −2.5 ripple, `shoe = 1`.
  - On soaked dirt: the floor sinks 0.02, so ruts fill via C5.
  - On dry floor: stamp `180·shoe + 60`, then `shoe ×0.8`.
  - Speed in mud is ×0.82.
- **Emerald:** splashes only when both the current and the previous tile are puddles [V, S8, S9].
- **Hunt:** "squelching boots" offset footstep masking [V, S48].

*Cost / performance.* A few writes per step [I].

*Games that used it.*
- Pokémon Emerald: https://github.com/pret/pokeemerald/blob/master/src/field_effect_helpers.c
- Hunt: Showdown: https://huntshowdown.com/news/behind-the-storm-technical-design-of-thundershower-in-hunt-showdown

*How it feels.* The player becomes a source of wetness, and the prints become a stealth tell [I].

*Risks.*
- Movement penalties are unpopular in MMOs [I, note 01].
- Without hysteresis, mud flickers [I].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 5 · Reactivity 5 · Readability 4

### C7. Splashes per surface

*In plain words.* Every drop that lands should do something, and the surface decides what. Rings on water, a tiny crown on stone, a brown splat on mud, a flicker on grass. Nothing in drizzle.

*How it works (technical).*
- **Where to spawn.** Either per landed drop (A2, A3), or decoupled: N random uncovered points per frame, splashed by material. Players can't tell which drop caused which splash [V, S59].
  - Remember Me reads a 256² depth map copied to the CPU (0.036 ms). Heavy splashes cost 0.33 ms on PS3 [V, vendor, S59].
- **Physics.** A crown needs a water film and lasts 10–20 ms [V, S59]. On a pool the crown peaks at ~3 ms and the jet at ~37 ms [V, S90]. So a splash is 1–3 frames, and rings carry the signal [I].
- **Visible counts per m² per s,** light to violent [I, note 03]:
  - water rings 1 / 3 / 8 / 15;
  - hard-surface crowns 1 / 2 / 5 / 10;
  - grass flecks 0.5 / 1 / 3 / 6;
  - dirt: splat plus a dark dot; sand: a pock dot;
  - drizzle: 0.
- **Sandbox:** only near drops (15 %) make crowns or mud flecks. Drops on water or deep puddles push ripples. The umbrella deflects drops [V, S4].

*Cost / performance.* About 1k px per frame at 100 splashes/s, from a pool of 64–128 sprites [I, note 08].

*Games that used it.*
- Ghouls 'n Ghosts: https://80.lv/articles/how-rain-works-in-video-games
- PICO-8 "Gentle Rain" (NES-style 8×8 cells): https://www.lexaloffle.com/bbs/?pid=114301

*How it feels.* "Particles alone rarely sell rain" [V, S50].

*Risks.*
- Too many crowns look like popcorn [I].
- Splashes under roofs betray a missing cover check [I].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 4 · Pixel taste 5 · Reactivity 4 · Readability 5

### Family D: Standing water

### D1. Hugo Elias two-buffer ripples (shared grid, fountains)

*In plain words.* Keep two height grids. Each step, a cell becomes "half its four neighbours minus its old value" and loses a little energy. Poke a cell where a drop lands, and rings spread, bounce off edges and interfere. One small grid serves every pond and fountain.

*How it works (technical).*
- **The rule,** from code implementing Elias's page (the page itself was unreadable) [V, S168, S169; S170]:
  - `new = ((N+S+E+W) >> 1) − new; new −= new >> k`.
  - The Watchmaker (1999) uses k = 10 and updates 1/MaxPass of the cells per frame.
  - To render, offset the lookup by the neighbour difference and add that difference as shading.
- **Variants:**
  - Nokola damps by 0.94 and adds a drop every 60 ms [V, S174]; Matyka seeds 3×3 blocks [V, S171].
  - WebGL Water and jquery.ripples (MIT) use `vel += (avg − h)·2; vel *= 0.995` [V, S155, S154].
- **ToyShop:** one 256² RG16 grid for the whole city (2 Euler passes and a Sobel pass), sampled by each puddle with its own scale and rotation. 6.98 ms [V, S57, S58].
- **Sandbox** [V, S4]:
  - `v = 0.5·Σ4 − R1; R1 = 0.95·v` over water and over puddles ≥ 0.12.
  - The fountain pokes −1.2 on 60 % of steps. The slope picks two highlight shades or one shadow.
  - Pond pixels rippled at steady state: 11 / 27 / 35 / 45 / 50 % from drizzle to storm [I, Sandbox run].

```
for c in water: B2[c] = ((B1[l]+B1[r]+B1[u]+B1[d]) >> 1) - B2[c]; B2[c] -= B2[c] >> 5 ; swap   // non-water reads 0
idx = slope > T ? HI : slope < -T ? LO : WATER
```

*Cost / performance.*
- About 17 integer ops per cell: ~74k per frame for 64². Use 0.94 damping for puddles and 0.99 for ponds [I, notes 03, 08].
- On web, use a SubViewport or swapped `DrawableTexture2D`s [I, note 05].

*Games that used it.*
- The Watchmaker: https://github.com/scummvm/scummvm/blob/master/engines/watchmaker/3d/geometry.cpp
- ATI ToyShop: https://history.siggraph.org/?p=48401

*How it feels.* Interference, with footsteps and storms sharing one surface. This is hero water [I].

*Risks.*
- Pack heights into RGBA8 on web [I, note 05].
- Clamp refraction so it doesn't smear the palette [I].
- Violent rain turns it into unreadable chop [I, note 03].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 4 · Pixel taste 4 · Reactivity 5 · Readability 4

### D2. Ring field and ring decals, layered by intensity

*In plain words.* Skip the simulation. Each drop on water becomes a small circle that grows and fades in about half a second. Add ring layers as rain gets heavier, and beyond that switch to a "rough water" shimmer.

*How it works (technical).*
- **Remember Me** [V, S60]:
  - A tiling texture holds R = inverse distance and A = time offset.
  - `ring = saturate(0.2 + 0.8w − frac(A+t))·R·sin(clamp((frac(A+t) − 1 + R)·9, 0, 3)·π)`.
  - Four layers (`TimeMul 1/.85/.93/1.13`, `TimeAdd 0/.2/.45/.7`), weighted by `saturate((I − k/4)·4)`.
- **Rain Drop (floor effect):** 16-px world cells, a 5×5 scan, and `sin(31d)·(1 − t)²`. Its structure matches Zavie's Shadertoy code (§9) [V, S144].
- **Ring pool** [I, notes 03, 08]:
  - `r = rMax·(age/life)^0.6`, with rMax 2–6 px and life 0.3–0.6 s.
  - Capillary waves move at ≥ 23.1 cm/s, which is ≥ 7 px/s [V, S86; I].
  - Rings per m² per second by tier: 0.3 / 1 / 3 / 8 / 15.
- **Flipbooks:** Emerald's ripple is 16×16, 5 frames over 79 frames [V, S11]. BudgetPixel shifts puddle rows ±1 px [V, S52].

```
for layer < ceil(I*4): c = hash2(floor(world_px/16)); phase = fract(t*rate*TimeMul[layer] + c.a + TimeAdd[layer])
  if abs(dist(world_px, ctr(c)) - phase*R) < 0.5: idx += 1 ;   if I > 0.7: dithered chop
```

*Cost / performance.* 1–4 fetches per water pixel, or ~2πr writes per ring [I, note 03].

*Games that used it.*
- Remember Me: https://seblagarde.wordpress.com/2013/01/03/water-drop-2b-dynamic-rain-and-its-effects/
- Far Cry 6 (rain and wind ripples): https://www.ubisoft.com/en-us/company/how-we-make-games/technologies/articles/simulating-tropical-weather-in-far-cry-6

*How it feels.* Reads instantly as rain on water, and stays locked to the palette. Scale density, not size [I, note 06].

*Risks.*
- No interference between rings [I].
- Mipmaps kill ripples [V, S60].
- Shadertoy-derived code carries licence risk [V, S141; U].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 5 · Reactivity 3 · Readability 5

### Family E: Drips and shelter

### E1. Cover map and indoor suppression

*In plain words.* One map says, for every tile, whether there is sky above it or a roof or canopy. That map blocks rain, splashes, wetting and ripples under cover, and tells characters they are dry. Indoors, switch the rain off and play rain on the roof instead.

*How it works (technical).*
- **Precedents:**
  - Ultima VII hides rain indoors [V, S16].
  - ToyShop switches rain off by script, or uses a sky-visibility map [V, S57].
  - CDDA uses `is_roofed()`: "only roofs/floors block it, not walls" [V, S156].
- **Sandbox:** a baked `SHL` (eaves 0.05 rising, awning ×0.15, canopy ellipses `0.1 + 0.9·r²`), B2 lees on top, and a 12×8 umbrella box [V, S4].

```
cover R8 per tile: 255 open, 166 canopy, 0 roof ; exposure = cover(world_pos - wind_dir*h)
gates: rain draw, splashes, wet gain, ripple seeds, character soak, fire exposure
```

*Cost / performance.* One fetch per gated pixel, or one CPU lookup per splash [I, note 02].

*Games that used it.*
- Ultima VII (Exult): https://github.com/exult/exult/blob/master/effects.cc
- Minecraft: https://minecraft.wiki/w/Rain

*How it feels.* Stepping under an awning is a small relief you can see and hear [I].

*Risks.*
- Rain over interiors [V, S27, S49].
- Hunt gives interiors *richer* ambience, so that shelter isn't an audio advantage [V, S48].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 4 · Reactivity 4 · Readability 5

### E2. Eave driplines, awnings and tree throughfall

*In plain words.* Roofs, awnings and trees catch rain and release it elsewhere. Eaves drip in a line, and trees drop fewer, bigger drops. When the rain stops, they keep dripping while they drain: the best after-rain moment.

*How it works (technical).*
- **Precedents:**
  - ToyShop put drop emitters on ledges and gutters [V, S57].
  - Remember Me drips from roof edges, and after rain reuses its splash system for roofs and trees [V, S59].
  - Weber 2016 models **throughfall** per pixel from forest-hydrology data [V, S108].
- **Catchment (note 03)** [I]:
  - Drip rate ∝ `rain × A/L`, where A is the roof area and L the eave length.
  - After rain, decay with τ ≈ 20–60 s.
- **Sandbox** [V, S4]:
  - Roof, awning and tree stores fill from hits.
  - Drip chance per step: `roof·1.2`, `awn·0.9`, `tree·0.35`. Each drip drains 0.0012 / 0.0015 / 0.002 and adds 0.03 water where it lands.
- **Measured after a 120 s storm** [I, Sandbox run]:
  - The awning store falls below 0.02 at **33 s**, roof and trees at **60.5 s**.
  - Live drips fall from 40 to 7 between 5 s and 30 s.

```
store += hits*K_FILL ; if rand() < store*rate: spawn_drip(edge.pick_random()); store = max(0, store - drain)
```

*Cost / performance.* Three floats and a few particles [V, S4].

*Games that used it.*
- ATI ToyShop: https://advances.realtimerendering.com/s2006/Chapter3-Artist-Directable_Real-Time_Rain_Rendering_in_City_Environments.pdf
- Hunt: Showdown (sky-ray drip emitters): https://huntshowdown.com/news/behind-the-storm-technical-design-of-thundershower-in-hunt-showdown

*How it feels.* Rain that stops gradually rather than switching off [I].

*Risks.*
- Lagarde keeps such effects to known-weather areas [V, S59].
- Streams down walls are rare in reality [V, S60].
- Drips that never end look like a bug [I].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 5 · Reactivity 5 · Readability 5

### E3. Character wetness meters and drips

*In plain words.* Each character has a wetness number. It rises in rain: less under trees, not at all under a roof or umbrella. It falls in shelter, faster in sun, and fastest by a fire. The sprite uses the wet palette, and soaked characters drip.

*How it works (technical).*
- **DST:**
  - Max 100. At **≥ 35**, tools slip and worn items drain 6 sanity per minute [V, S34].
  - Wet mobs take **2.5×** electric damage [V, S34].
  - Umbrella 90 %, rain hat 70 % [V, S35]. Gain up to 1/s [V, S33].
- **Valheim:** Wet lasts **120 s** and resets on exposure. A roof clears it. Burning removes 60 s per second, and a nearby fire 10 s per second [V, S45].
- **CDDA:**
  - Per-body-part wetness, up to 30 (drizzle) or 60 (heavy) minus protection [V, S47].
  - Rainproof gear fails 1 time in 50, and legs get wet only after the head is 50 % wet [V, S156].
- **Ghost of Yōtei:** a directional wetness grid around characters [V, S186].
- **Sandbox** [V, S4]:
  - Gain: `wet += 0.12·I·exposure·dt`. Soaked in 69 s in drizzle, 8 s in a storm.
  - Drying per second: 0.012 sheltered, 0.03 in sun, 0.12 by the fire.
  - Drips start above 0.45.
  - Sprite pixels are wet where `Bayer < 17·wet`.

*Cost / performance.* One float per entity [I].

*Games that used it.*
- Don't Starve Together: https://dontstarve.wiki.gg/wiki/Wetness/DST
- Valheim: https://valheim.fandom.com/wiki/Wet

*How it feels.* Players feel the weather on their own character and choose between umbrella, shelter and campfire [I].

*Risks.*
- Always offer a way to dry off [I, note 06].
- A 4-direction wetness vector needs sprite support [I, note 05].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 4 · Reactivity 5 · Readability 5

### Family F: Storm and interactions

### F1. Lightning as a palette flash (highlights up, shadows half) within WCAG limits

*In plain words.* In top-down you rarely see the sky, so lightning is the world going briefly bright. The good version keeps shadows darker than highlights during the flash, and never flashes more than three times in a second.

*How it works (technical).*
- **Emerald** [V, S6, S5]:
  - Rain darkens the screen to `c·13/16`, one step per 20 frames.
  - The flash map lifts colours toward 31, but shadows (`c < 12`) rise only **half** as far.
  - Timing: wait 360–720 frames, then 1–2 flashes of 6–8 frames, 60–75 frames apart. There is a 50 % chance of a closing 30–45-frame flash that fades out.
  - Thunder follows 0–19 frames after a short flash, or 0–99 after a long one.
- **ALttP** toggles `CGADSUB` 0x72 → 0x32 on a fixed 256-frame loop [V, S13]. It feels mechanical after about 20 s [I, note 01].
- **PICO-8** carts use "two quick flashes" [V, S179].
- **WCAG 2.3.1:** at most 3 flashes in any 1 s. A flash counts if luminance changes by ≥ 10 % and the darker state is < 0.80. The area limit is 0.006 sr [V, S54].
- **Sandbox** [V, S4]:
  - Lightning only when I > 0.85, at 0.18 strikes/s.
  - Flash 0.28 s; with reduce-flashes on, 0.06 s at ×0.35.
  - Measured: 10.4 strikes/min, with 15 % of gaps under 1 s [I, Sandbox run]. NWS calls > 8/min "continuous" [V, S82].

```
c' = lum(c) > 0.4 ? mix(c, 1, k) : mix(c, 1, 0.5*k) ; blink, decay, second blink ; min gap ≥ 1 s ; reduce → tint
```

*Cost / performance.* One uniform [I, note 08].

*Games that used it.*
- Pokémon Emerald: https://github.com/pret/pokeemerald/blob/master/src/field_weather.c
- Zelda: A Link to the Past: https://github.com/snesrev/zelda3/blob/master/src/overworld.c

*How it feels.* The strongest storm cue. The double blink reads as lightning [V, S179; I].

*Risks.*
- Photosensitivity: a full-screen white flash on a phone breaks the WCAG area limit [I, note 06].
- The Sandbox has no minimum gap between flashes [I].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 5 · Reactivity 2 · Readability 4

### F2. The bolt: midpoint displacement, branches, thunder delay

*In plain words.* For a ground strike, split a line in half again and again, nudging each midpoint sideways. Add a few short branches at about 30°. Fade the bolt over a few frames, and delay the thunder by distance.

*How it works (technical).*
- **Krazydad:** offset the midpoint by `(rand − 0.5)·d`, then recurse with `d/2` until below the detail level [V, S176].
- **Tuts+:**
  - Sway 80, with each offset pulled toward the previous one.
  - 3–5 branches at **30°**, each `× (1 − branchPoint)` long.
  - Alpha −0.03 per update, so the bolt lasts "over 30 frames" [V, S177].
- **Thunder delay** = distance / 343 m/s [K]. Emerald uses a random 0–99 frames instead [V, S6].
- **Sandbox** [V, S4]:
  - A 14-segment linear polyline with jitter of `±9·(1 − f)`. It is not recursive and has no branches.
  - Shown for 0.22 s with 10 sparks.
  - Thunder is a 0.45 s screen shake after 0.4–1.8 s. There is no audio.

```
bolt(a,b,d): if d < DETAIL: line(a,b) else m = mid(a,b) + perp*(rand-0.5)*d ; bolt(a,m,d/2) ; bolt(m,b,d/2)
```

*Cost / performance.* 32–64 segments, drawn once per strike [I, note 08].

*Games that used it.*
- Krazydad: https://krazydad.com/bestiary/bestiary_lightning.html
- Zelda BotW/TotK (lightning seeks metal): https://zelda.fandom.com/wiki/Weather

*How it feels.* A bolt that hits a tile is an event, so telegraph it. BotW's static sparks are a reported example, but unverified [U, note 06].

*Risks.*
- A visible bolt adds to the flash area [I].
- Keep bolts short and add a ground disc; long bolts read as side-view [I, note 08].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 4 · Reactivity 3 · Readability 4

### F3. Fire: extinguish, steam and wet fuel

*In plain words.* Rain should visibly beat fire. Exposed fires weaken with the rain, hiss out into steam, and burn fuel faster while they last. Sheltered fires survive.

*How it works (technical).*
- **Minecraft:** each tick, a fire in rain has a **20 % + 3 %·age** chance to go out [V, S43]. Campfires are immune [V, S42].
- **DST:** rain makes fuel burn faster: Fire Pit +200 %, Campfire +250 %, Torch +150 % [V, S33]. Wet fuel lasts 75 % as long [V, S35].
- **BotW / RimWorld:** rain puts out only exposed or unroofed fires [V, S31, S46].
- **Sandbox** [V, S4]:
  - Fire strength `F` grows +0.04/s, loses `I·EXP·0.11` per second, and loses 0.004 per drop within 7 px.
  - Below 0.12 it goes out with 18 steam puffs.
  - Measured time to go out: **41.6 s** (moderate), **17.8 s** (heavy), **12.2 s** (storm). It survives drizzle and light rain [I, Sandbox run].

```
fire.F += (REGROW - EXT*rain*exposure(fire))*dt ; spread *= 1 - wet[target]/255 ; if F < 0.12: out + steam
```

*Cost / performance.* Negligible [I].

*Games that used it.*
- Minecraft: https://minecraft.fandom.com/wiki/Fire
- Don't Starve: https://dontstarve.fandom.com/wiki/Rain

*How it feels.* The guttering campfire is the heart of a storm [I].

*Risks.* Show the flames weakening before they go out [I].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 5 · Reactivity 5 · Readability 5

### F4. Element combos

*In plain words.* Rain makes water stronger, fire weaker and lightning dangerous, especially to wet targets and to anyone standing in connected puddles.

*How it works (technical).*
- **Pokémon:**
  - Water ×1.5 and Fire ×0.5. Thunder never misses, and Solar Beam is halved.
  - Rain Dance lasts 5 turns, or 8 with Damp Rock [V, S23].
  - In Emerald, overworld rain carries into battle [V, S12].
- **FFT:** Lightning ×5/4 and Fire ×3/4. Bow evade ×1.33 by day and ×1.80 at night [V, S25].
- **DOS2:**
  - Wet: Water −10 %, Air −20 %, Fire +10 % [V, S39].
  - The Rain skill makes a puddle that can be electrified [V, S40].
  - Shocked + Wet = Stunned [V, S41].
- **DST:** wet targets take ×2.5 electric damage [V, S34].
- **Our rule (from note 03):** a shock spreads through puddle cells above `FILM`, up to a cap, and stuns wet entities [I].

*Cost / performance.* One capped flood fill per strike [I].

*Games that used it.*
- Divinity: OS2: https://dos2.wiki/wiki/Rain
- Pokémon: https://m.bulbapedia.bulbagarden.net/wiki/Rain

*How it feels.* Weather becomes a tactical resource [I].

*Risks.* Big multipliers swing PvP. Note 01 suggests ±25 % for an MMO [I].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 3 · Reactivity 4 · Readability 5

### F5. Vision, movement and stealth

*In plain words.* Rain shortens sight, can slow movement on open ground and covers sound, but mud gives you away.

*How it works (technical).*
- **Advance Wars:** +1 movement cost on plains and woods for vehicles, and −1 vision. Later games force Fog of War on [V, S26].
- **Fire Emblem 7:** plains cost 2 for foot units and 3 for mounted ones. Indoors, forests and mountains are exempt [V, S27].
- **Hunt:** "rain masks footsteps", but squelching boots give you away. Cues must never be hidden [V, S48].
- **CDDA:**
  - `sight_penalty` rises from 1.01 to 1.25 across its rain types.
  - `sound_attn` rises from 0 to 8 [V, S156].
- **BotW:** climbing gets slippery [V, S32].
- **Our rule** [I, note 03]:
  - Hearing radius × (1 − 0.5·tier).
  - Vision × (1 − 0.3·tier).
  - Drizzle hurts vision more than light rain does [V, S75].

*Cost / performance.* Multipliers on existing systems [I].

*Games that used it.*
- Advance Wars: https://advancewars.fandom.com/wiki/Rain
- Fire Emblem: https://www.fireemblemwiki.org/wiki/Rain

*How it feels.* Legible when the numbers are small and the exemptions are visible [I].

*Risks.* In an MMO, movement penalties feel like lag. Prefer vision and stealth effects [I, note 01].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 3 · Reactivity 3 · Readability 5

### F6. NPCs, creatures and the economy

*In plain words.* The world reacts. Villagers shelter or open umbrellas. Frogs and snails come out while butterflies hide. Crops get watered, rare fish bite, and some monsters change behaviour.

*How it works (technical).*
- **Animal Crossing** [V, S38]:
  - Villagers carry umbrellas, but frogs don't.
  - Snails and the Coelacanth appear only in rain; butterflies hide.
  - A rainbow can appear after heavy rain, peaking at about 30 min.
- **Stardew** [V, S36, S37]:
  - Rain changes fish and dialogue, and two summer days are always stormy.
  - Villagers stay in during Green Rain.
  - Crop watering is from memory, not verified [U].
- **Harvest Moon:** rain waters crops and breaks fences [V, S28].
- **Minecraft:** undead don't burn, endermen flee to dry spots, and fishing is faster [V, S42].
- **Sandbox** [V, S4]:
  - The villager shelters when I > 0.42.
  - 1–3 frogs appear.
  - A barrel fills at `0.0036·I` per second.

```
if rain > 0.3 and npc.outdoor and !npc.tags.has("amphibian"): goto shelter or umbrella
spawn_table[tier]: frogs, snails ; hide butterflies ; crops.watered ; fish_table = rainy
```

*Cost / performance.* Event hooks on tier changes [I].

*Games that used it.*
- Animal Crossing: https://nookipedia.com/wiki/Rain
- Stardew Valley: https://stardewvalleywiki.com/Weather

*How it feels.* The cheapest "the world is alive" signal [I, note 06].

*Risks.*
- Quest givers who vanish indoors break quests [I].
- DST's endless-drizzle bug [V, S33].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 4 · Reactivity 5 · Readability 5

### Family G: Fog interaction

### G1. Rain haze and spray mist from the intensity knob

*In plain words.* Drops too small or too far to see act as fog. Heavier rain washes the scene toward pale grey-blue. Where heavy rain hammers stone and water, a low spray mist hugs the surface.

*How it works (technical).*
- **Weber:** `β = 0.312·R^0.67` km⁻¹, i.e. 0.50 / 0.92 / 2.70 / 5.63 at 2 / 5 / 25 / 75 mm/h [V, S107, S109].
- **Visibility:** `3.912/β`, i.e. 7.8 / 4.3 / 1.45 / 0.69 km [V, S88; I].
- **Ratios, not distances:** a screen spans 20–40 m, so haze alpha should be ~0 / 2 / 6 / 12 / 20 % by tier [I, note 04].
- **Other precedents:**
  - ToyShop: a blurred rain layer gives mist, and Kawase bloom gives halos [V, S57].
- **Sandbox** [V, S4]:
  - A 160×90 grid gains `0.05·max(0, I − 0.45)²·HARD`.
  - HARD is 1 for stone and roofs, 0.8 for water, 0.4 for dirt.
  - Each step the grid is blurred, advected and multiplied by 0.985. It is drawn where `12·m > Bayer + 2`.
  - Measured peaks: 0.008 in moderate rain (invisible), 0.29 in heavy, 0.99 in a storm [I, Sandbox run].

```
haze_alpha = HAZE_MAX*pow(R/R_MAX, 0.67) ; spray += a*max(0, I-I0)^2*hard ; spray = blur(advect(spray))*0.985
```

*Cost / performance.* Haze is free inside the LUT pass. The spray grid is ~14k cells [I].

*Games that used it.*
- Remember Me: https://seblagarde.wordpress.com/2013/01/03/water-drop-2b-dynamic-rain-and-its-effects/
- Hunt: Showdown: https://huntshowdown.com/news/behind-the-storm-technical-design-of-thundershower-in-hunt-showdown

*How it feels.* Heavy rain feels heavy when the distance turns milky [I].

*Risks.* Haze lowers cue contrast. Cap it, and never apply it to the UI [I, note 06].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 4 · Reactivity 3 · Readability 3

### G2. Post-rain evaporation mist

*In plain words.* When the sun returns over soaked ground, wisps of mist rise from warm wet surfaces and fade as they dry. Wind kills them. This needs only the wetness grid.

*How it works (technical).*
- **Rule** [I, notes 03, 04]: when it is not raining, `mist += b·wet·sun·(1 − wind/WMAX)`, then the mist rises and fades.
- **Remember Me** ties rain fog to "precipitation fog" [V, S60].
- **Sandbox:** in sun, mist gains `0.0011·CWET²` per step and drifts upward [V, S4].
- **Measured:** peaks of only **0.06–0.08**, below the ~0.17 draw threshold. So **no pixel is drawn in the normal view**, only in the Mist X-ray [I, Sandbox run].

```
if rain == 0 and sun > 0: mist += K_EVAP*wet^2*sun*(1 - wind/WMAX) ; rise ; *0.985   // tune peaks to ~0.3
```

*Cost / performance.* Shares G1's grid [I].

*Games that used it.* No top-down example found. Analogues:
- Hunt (fog with the storm): https://huntshowdown.com/news/behind-the-storm-technical-design-of-thundershower-in-hunt-showdown
- Animal Crossing (post-rain rainbow): https://nookipedia.com/wiki/Rain

*How it feels.* Morning sun after rain, with steam lifting off the cobbles [I].

*Risks.* Too strong reads as smoke; too weak is invisible, as in the Sandbox today [I].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 4 · Reactivity 4 · Readability 4

### Family H: Rendering and taste

### H1. Palette ramps and the overcast shift

*In plain words.* Most of rain's mood is colour. Darken, desaturate and cool the palette as clouds come in, blending smoothly. Keep wet and flash rows ready in the same palette.

*How it works (technical).*
- **Emerald** dims to 13/16 [V, S6]. **Starik & Werman** darken by 20 % or 40 % [V, S101].
- **Ferrari:**
  - Overcast is a different palette script over the same pixels.
  - Rows are reserved for weather colours.
  - Helpers include `fade`, `fadeToColor` and BlendShift [V, S165, S166, S163].
- **Sandbox** [V, S4]:
  - Four variants per colour: dry, wet `×(0.66, 0.69, 0.78)`, mist, and shadow.
  - Tint `k = 0.12 + 0.55·I` applied as `(1 − k, 1 − 0.88k, 1 − 0.6k)`. That is (0.33, 0.41, 0.60) in a storm, far darker than Emerald.

```
LUT 256 × {DRY, WET, MIST, SHADOW, FLASH} ; COLOR.rgb = lut(idx,row).rgb * vec3(1.0-k, 1.0-0.88*k, 1.0-0.6*k)
```

*Cost / performance.* One uniform [I, note 08].

*Games that used it.*
- Living Worlds: http://www.effectgames.com/demos/worlds/
- rain98 (blue palette): https://gamingtrend.com/previews/rain98-so-far-is-a-masterclass-in-atmosphere/

*How it feels.* The scene says "rain is coming" before the first drop. rain98 shows how much of the feel is palette and audio [V, S190].

*Risks.* Storm darkening as deep as the Sandbox's hurts readability. Cap it, or lift shadows less, as Emerald does [I].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 5 · Reactivity 2 · Readability 4

### H2. Pixel recipes: streaks, splashes and puddle reflections

*In plain words.* Streaks are 1 px wide, share one slope and are always lighter than what is behind them. A splash is three frames plus a blank. A puddle reflects only lights and sky tone, wobbling by a pixel.

*How it works (technical).*
- **BudgetPixel** [V, S52]:
  - "A 4-frame loop is the gold standard for retro game art".
  - 10–15 streaks at a **2:1 slope**, moving 4–6 px per frame and wrapping at a new X.
  - Splash: a 2-px line, then a 4×1 hollow ring, then 2 outward dots, then nothing.
  - Puddles: muted copies of the lights above, with rows shifted ±1 px on frames 2 and 4.
- **Slynyrd:** "The splash is the fun part." Keep waves slow, and make reflections slightly shorter than their source [V, S53].
- **Garg & Nayar:** drops are brighter than their background, and streaks are motion blur with oscillation beads [V, S97, S99]. So draw them +1 palette step, with one brighter pixel [I].
- **Shape:** drops are never tear-shaped; big ones are "hamburger buns" [V, S87].
- **Length:** speed × exposure gives 3–8 px; use 1–2 for drizzle and 8–12 for storms [I, note 04].

*Cost / performance.* Authoring time only.

*Games that used it.*
- BudgetPixel: https://budgetpixel.com/blog/how-to-animate-pixel-art-rain-and-reflections-in-4-frames
- Slynyrd: https://slynyrd.com/blog/2018/10/12/pixelblog-10-water-in-motion

*How it feels.* Crisp and palette-pure [I].

*Risks.*
- "Just don't overdo it." [V, S50]
- Full-alpha streaks over outlines or UI [I, note 06].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 5 · Reactivity 1 · Readability 5

### H3. Audio layering

*In plain words.* Rain is half sound. Layer loops by intensity. Under a roof, muffle them and add rain-on-roof. Delay the thunder, and never let rain drown a gameplay cue.

*How it works (technical).*
- **Emerald:** loops SE_RAIN, SE_DOWNPOUR or SE_THUNDERSTORM, each with a stop tail. Thunder comes 0–99 frames after the flash [V, S6].
- **Minecraft:** rain at 0.2 outdoors, 0.1 for "rain.above" [V, S42].
- **Hunt:** layers from shower to storm, raycast drip emitters, distant thunder, and richer interiors [V, S48].

```
crossfade loops by I ; if covered: low-pass + roof loop ; thunder after delay ; duck under cues
```

*Cost / performance.* 3–4 streamed loops [I].

*Games that used it.*
- Hunt: Showdown: https://huntshowdown.com/news/behind-the-storm-technical-design-of-thundershower-in-hunt-showdown
- Minecraft: https://minecraft.wiki/w/Rain

*How it feels.* Audio carries tier changes better than visuals do [I].

*Risks.*
- Masking gameplay cues [V, S48].
- The Sandbox has no audio [V, S4].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 3 · Reactivity 3 · Readability 4

---

## 5. Comparison scorecard

All ratings are author judgement for top-down pixel art on web Godot. "Sum" is a crude total, not a recommendation.

| # | Technique | Simpl. | Speed | Pixel taste | React. | Read. | Sum | Cost class |
|---|---|---|---|---|---|---|---|---|
| A1 | Overlay / cycled paths | 5 | 5 | 4 | 1 | 3 | 18 | 1 fetch/px |
| A2 | Landing-first sprites | 5 | 5 | 5 | 4 | 5 | 24 | ≤ 24 sprites |
| A3 | Streaks with z + wind | 4 | 3 | 5 | 5 | 4 | 21 | O(drops) |
| A4 | Hashed-cell layers | 4 | 5 | 4 | 2 | 4 | 19 | ~3 hashes/px |
| A5 | Curtains | 5 | 5 | 4 | 3 | 4 | 21 | 1 noise/spawn |
| A6 | Tier scaling | 5 | 5 | 5 | 3 | 5 | 23 | Table |
| B1 | Slant, gusts, shared wind | 5 | 5 | 4 | 3 | 4 | 21 | 1 uniform |
| B2 | Rain-shadow rays | 4 | 5 | 4 | 4 | 4 | 21 | On bucket change |
| C1 | Wetness byte + dither | 5 | 5 | 5 | 4 | 5 | 24 | 1 B/cell |
| C2 | Wet palette by porosity | 5 | 5 | 5 | 3 | 5 | 23 | 1 LUT row |
| C3 | Drying | 4 | 5 | 5 | 4 | 4 | 22 | Sampled |
| C4 | Depth mask vs flood level | 5 | 5 | 4 | 2 | 5 | 21 | 1 fetch/px |
| C5 | Flow + infiltration | 3 | 4 | 5 | 5 | 4 | 21 | O(wet cells) |
| C6 | Mud + footprints | 4 | 5 | 5 | 5 | 4 | 23 | Per step |
| C7 | Splashes per surface | 4 | 4 | 5 | 4 | 5 | 22 | Pool 64–128 |
| D1 | Elias ripples | 4 | 4 | 4 | 5 | 4 | 21 | ~17 ops/cell |
| D2 | Ring field / decals | 5 | 5 | 5 | 3 | 5 | 23 | 1–4 fetches/px |
| E1 | Cover map + indoors | 5 | 5 | 4 | 4 | 5 | 23 | 1 B/tile |
| E2 | Eaves, awnings, throughfall | 4 | 5 | 5 | 5 | 5 | 24 | 3 floats |
| E3 | Character wetness | 5 | 5 | 4 | 5 | 5 | 24 | 1 float/entity |
| F1 | Palette flash + WCAG | 5 | 5 | 5 | 2 | 4 | 21 | 1 uniform |
| F2 | Bolt + thunder | 4 | 5 | 4 | 3 | 4 | 20 | Per strike |
| F3 | Fire out + steam | 5 | 5 | 5 | 5 | 5 | 25 | Per fire |
| F4 | Element combos | 5 | 5 | 3 | 4 | 5 | 22 | Rules |
| F5 | Vision / movement / stealth | 5 | 5 | 3 | 3 | 5 | 21 | Multipliers |
| F6 | NPCs, creatures, economy | 5 | 5 | 4 | 5 | 5 | 24 | Hooks |
| G1 | Haze + spray mist | 5 | 5 | 4 | 3 | 3 | 20 | LUT + ¼-res grid |
| G2 | Evaporation mist | 5 | 5 | 4 | 4 | 4 | 22 | Shared grid |
| H1 | Palette + overcast | 5 | 5 | 5 | 2 | 4 | 21 | 1 uniform |
| H2 | Pixel recipes | 5 | 5 | 5 | 1 | 5 | 21 | Authoring |
| H3 | Audio layering | 4 | 5 | 3 | 3 | 4 | 19 | 3–4 loops |

The top scores go to cheap rules that react: F3, A2, C1, E2, E3 and F6. None of them needs a GPU simulation. D1 and C5 are the only per-cell simulations worth their cost, and only on visible water and dirt [I].

---

## 6. Deep dives

### 6a. How a top-down pixel game is affected by rain, system by system

| System | What changes | Technique | Starting numbers | Source |
|---|---|---|---|---|
| Visuals: sky | Darker, cooler palette; flashes | H1, F1 | Emerald 13/16; Sandbox k = 0.12 + 0.55·I | [V, S6, S4] |
| Visuals: rain | Layers, slant, curtains | A4 + A2/A3, A5 | Counts in MP ratio 1 : 1.6 : 2.8 : 3.7 | [I, S79] |
| Visuals: ground | Wet rows, glints, puddles, rings, splashes | C1–C7, D2 | Sand ×0.5; metal ~×1 | [V, S111, S62] |
| Visuals: aftermath | Drying, drips, mist | C3, E2, G2 | Dry in ~1 min; puddles slower | [V, S62] |
| Combat | Element multipliers, Wet status | F4 | FFT ±25 %; Pokémon ±50 % | [V, S25, S23] |
| Movement | Mud, plains cost | C6, F5 | FE 2/3; AW +1 | [V, S27, S26] |
| Vision / stealth | Vision, sound masking, prints | F5, C6 | AW −1; CDDA sound_attn 0–8 | [V, S26, S156] |
| Survival | Wetness meter, dry-off | E3 | DST 35/100; Valheim 120 s | [V, S34, S45] |
| Fire | Extinguish, fuel | F3 | Minecraft 20 % + 3 %·age | [V, S43] |
| AI / NPC | Shelter, umbrellas, frogs | F6 | Sandbox shelter at I > 0.42 | [V, S4] |
| Audio | Tier loops, roof muffling, thunder | H3 | Minecraft 0.2 vs 0.1 | [V, S42] |
| Performance | Particles scale; layers don't | A4 + capped A2/A3 | ToyShop 4.11 vs 19.45 ms; UO cap 70 | [V, vendor, S58; S18] |
| Accessibility | Flashes, contrast, masking | F1 guard, haze cap | WCAG ≤ 3 flashes/s | [V, S54] |
| Networking | Shared, fair weather | Server `{tier, I, wind, seed}` | UO 0x65, 4 bytes | [V, S18] |

**Networking rule [I]:**
- The server owns whatever changes outcomes: tier, intensity, wind, strike targets, fire states, and tile-level puddle and mud flags.
- Clients own the pixels.
- This is the same split as in the acid study [S3].

### 6b. Materials × wetness matrix

Rows combine our notes and the Sandbox's constants. "Steps" means palette ramp steps. Entries are [I] unless marked otherwise.

| Material | Darkening | Gloss | Puddling | Drying | Splash | Gameplay hook |
|---|---|---|---|---|---|---|
| Grass | 1 step | Blade glints | Loam 10–20 mm/h: heavy rain only [V, S83]; Sandbox never | Medium (DRY 1.1); shaded: 50 % at 20.5 s, 90 % at 50 s [I, Sandbox run] | Fleck | Crops; frogs |
| Dirt / mud | 1–2 steps → MUD above ~70 % | Only when soaked | Clay 1–5 mm/h: moderate rain [V, S83]; Sandbox from Moderate | Slow (0.7); shaded: 57 s / 99.5 s [I, Sandbox run] | Brown splat | ×0.82 speed, deep prints, squelch |
| Cobble / stone | 1 step (70–85 % of dry) | Film; dries first [V, S62] | Joints and dips; Sandbox heavy/storm | Fast top, slow joints (3) | Crown | Spray mist; slip (no data) |
| Sand | Up to ×0.5 [V, S111] | None | > 30 mm/h: violent only [V, S83] | Fast (2.2) | Pock dot | Prints hold shape |
| Wood | 1–2 steps, warm (0.82/0.58/0.38) [V, S62] | Low | Runs off | Medium (1.5) | Crown + tick | Wet fuel 75 % [V, S35] |
| Roof tiles | Small | Shine | Feeds eaves | Fast (3) | Crown | After-rain drip line |
| Cloth / awning | 1–2 steps | None | Drips | Slowest (0.55); 90 % at 25.5 s exposed [I, Sandbox run] | Dark spot | Shelter; stores water |
| Metal | 0 [V, S62] | Beads, glints | No | Fastest (4) | Spark pixel | Attracts lightning [V, S32] |
| Characters | Dithered by `wet` | Armour glints | — | 0.012 / 0.03 / 0.12 per s (shade/sun/fire) | Head splashes [V, S59] | Meter; electric ×2.5 [V, S34] |
| Fire | — | — | — | — | Steam | Out in 12–42 s at moderate+ [I, Sandbox run] |
| Water | Darker under cloud | Rings, chop | Always | 2–7 mm/day [V, S84] | Rings | Electrified [V, S40]; rain fish |

### 6c. Intensity tiers, drizzle → storm

Sources: real rates from [V, S75, S77]; drop fluxes derived from Marshall–Palmer [I, note 03]; Sandbox parameters [V, S4]; measured values [I, Sandbox run].

| | Drizzle | Light | Moderate | Heavy | Storm / violent |
|---|---|---|---|---|---|
| Real rate | drops 0.2–0.5 mm | ≤ 2.5 mm/h | 2.6–7.6 | 7.6–50 | > 50 |
| Drops /m²/s (MP) | ~1,100 (0.5 mm/h) | ~2,400 | ~3,900 | ~6,600 (25) | ~8,800 (50) |
| Haze β (Weber) / visibility | — | 0.50 / 7.8 km (2 mm/h) | 0.92 / 4.3 km (5) | 2.70 / 1.45 km (25) | 5.63 / 0.69 km (75) |
| CDDA sight / sound_attn | 1.03 / 1 | 1.1 / 4 | 1.1 / 4 | 1.2 / 8 | 1.25 / 8 |
| **Sandbox I** | 0.12 | 0.30 | 0.50 | 0.75 | 1.00 |
| Sandbox drops | 152 | 349 | 607 | 967 | 1,360 |
| Fall speed far/mid/near (px/s) | 66/103/145 | 75/116/164 | 85/132/186 | 98/151/213 | 110/170/240 |
| Streak length (px) | 1/2/3 | 1/2/4 | 1/3/5 | 1/3/6 | 2/4/7 |
| Splashes on hard ground /m²/s (note 03) | 0 | 1 | 2 | 5 | 10 |
| Water rings /m²/s (note 03) | 0.3 | 1 | 3 | 8 | 15 |
| Pond pixels showing ripples | 11 % | 27 % | 35 % | 45 % | 50 % |
| Puddle px dirt / stone | ~4 / 0 | ~3 / 0 | 24 / 0 | 319 / 9 | 799 / 498 |
| Spray-mist peak (drawn above ~0.17) | 0 | 0 | 0.008 | 0.29 | 0.99 |
| Campfire out after | never | never | 41.6 s | 17.8 s | 12.2 s |
| Character soaked after | 69 s | 28 s | 17 s | 11 s | 8 s |
| Haze alpha (note 04) | ~2 % (hazier than light) | 2 % | 6 % | 12 % | 20 % |
| Proposed rules | slow wetting | crops; frogs | fire −25 %; NPCs shelter | lightning +25 %; hearing ×0.5 | strikes; vision −1 tile |

**Reading the table [I].**
- The Sandbox's drop ratios from light upward (1 : 1.74 : 2.77 : 3.9) track Marshall–Palmer's 1 : 1.6 : 2.8 : 3.7.
- Puddles, fire and spray form a readable ladder: nothing below Moderate, the path floods in Heavy, the plaza floods in a Storm.
- The density is high: one drop per ~165 px² at light, against 1,600–3,840 for Emerald. Note 03 suggests roughly half the Sandbox's counts: 150 / 250 / 450 / 600.

### 6d. Wind

1. **Angle.** `tan θ = u/v`. A 2 mm drop leans 9–57° in winds of 1–10 m/s; drizzle leans 56° at 3 m/s. Giving far, small drops a lower fall speed yields "two kinds of rain in one wind" [I].
2. **Pixel slopes.** Emerald's (−6.5, 13) is exactly 1:2 [V, S5], the same family as BudgetPixel's 2:1 [V, S52]. Keep slopes to 0, 1:4, 1:2 and 1:1 [I].
3. **Gusts.** Peaks of 1.3× the mean [V, S81]. Every 4–12 s, with about 1 s attack and 2–3 s release [I, note 06]. One value drives slope, sway, cloth and curtains [I].
4. **Rain shadow.** Length is `h·tan θ`, so a 3 m wall at 5 m/s shelters ~2.3 m. Bake it per wind bucket (B2) [I].
5. **Water.** Far Cry 6 adds wind ripples [V, S64]. In 2D, scroll noise along the wind direction on ponds [I].
6. **Sandbox.** Wind is 1-D, with 7 exposure buckets and curtains drifting at `42·wind` px/s [V, S4].

### 6e. Time: a worked example on the Sandbox (storm → sun)

**Setup.** Start dry and overcast, switch to Storm, then switch to Sun. Wind is fixed at 0.3. Each step runs `simStep` plus the drop, character, fire, storm and particle updates at 60 Hz, at sim speed 1× [I, Sandbox run].

**Storm** (time from the switch):
- **10 s** (I = 0.83):
  - Visibly wet: grass 51 %, dirt 88 %, stone 65 %, sand 48 %, wood 40 %.
  - 409 dirt pixels already show puddles.
- **12 s:** the campfire goes out in a burst of steam.
- **20 s:**
  - Every material is 98–100 % wet, and the player is soaked.
  - The roof store is at 0.85.
  - Spray mist peaks at 0.96, laying a dithered veil over the plaza and roofs.
- **30–180 s:**
  - Puddle area swings with the curtains: 480–1,090 px on dirt, 90–860 px on stone.
  - Depths: potholes 0.07–0.17, cobble dips 0.06–0.11.
  - Stores: roof 1.0, awning ~0.2, trees ~0.2. Between 35 and 49 drips are alive at once.

**Sun** (after a 120 s storm):

| t | I | Puddle px | Roof / awning / tree | Drips | Player wet |
|---|---|---|---|---|---|
| 5 s | 0.17 | 4 | 0.89 / 0.14 / 0.17 | 40 | 1.00 |
| 10 s | 0.03 | 0 | 0.63 / 0.11 / 0.14 | 29 | 1.00 |
| 15 s | 0.005 | 0 | 0.43 / 0.07 / 0.12 | 20 | 0.88 |
| 20 s | 0 | 0 | 0.29 / 0.05 / 0.10 | 17 | 0.73 |
| 30 s | 0 | 0 | 0.13 / 0.02 / 0.07 | 7 | 0.43 |
| 45 s | 0 | 0 | 0.05 / 0.01 / 0.04 | 4 | 0.00 |
| 60 s | 0 | 0 | 0.02 / 0.01 / 0.02 | 3 | 0.00 |

**Drying times by material** (time until only 50 % / 10 % of pixels still look wet):

| Pixels | Material | 50 % dry | 90 % dry |
|---|---|---|---|
| Exposed | Metal | 13.5 s | 17 s |
| Exposed | Grass, stone, sand, wood | 14 s | 19–19.5 s |
| Exposed | Roof | 14.5 s | 19.5 s |
| Exposed | Dirt | 16.5 s | 24 s |
| Exposed | Cloth | 19 s | 25.5 s |
| Shaded | Stone | 11.5 s | 15.5 s |
| Shaded | Grass | 20.5 s | 50 s |
| Shaded | Dirt | 57 s | 99.5 s |

**Mist.**
- Spray haze collapses within ~8 s of the rain stopping.
- Evaporation mist then sits at 0.06–0.08. That is below the draw threshold, so nothing is drawn (G2).

**Against the research [I].**
- **Right:** exposed before shaded [V, S49], glints before the dark stain [V, S62], and eaves and trees drip for about a minute [V, S108].
- **Wrong:** puddles vanish first (~10 s), but Lagarde wants them to outlast surface wetness [V, S62]. Fix with deeper hollows, a lower `DRN` in sun, or a lagging flood level (C4).
- **Mist:** evaporation mist needs 3–5× more gain to be seen.
- **Asterion:** stretch all these times 10–30× [I].

---

## 7. Combinations: a layered architecture for Asterion Online (Godot 4, web)

**Rule [I]:**
- Gameplay truth is tile-level and lives on the server.
- Pixel detail is client-side cosmetics.
- Every visual reads three numbers: `intensity`, `wind` and `flash`.

```
SERVER (per region)
  WeatherDirector: CLEAR | OVERCAST | DRIZZLE | LIGHT | MODERATE | HEAVY | STORM
    schedule: forecast table (FC6 hourly presets / FFT month odds / DST sine envelope)
    intensity eases over 20–60 s ; wind = base*(1 + 0.3*gust) ; seed ; strike(tile,t) ≥ 1 s apart
    tile flags: wet / mud / puddle / fire  (gameplay rules read these)
  broadcast on change: {state, intensity, wind, seed, next_strike}
CLIENT
  data textures (CPU Image → ImageTexture.update, or DrawableTexture2D on 4.7)
    COVER R8 tile (rebaked per wind bucket) · WET R8 4×4 px 8 Hz · WATER R8 2×2 px 12 Hz (active list)
    RIPPLE RG8 ping-pong 30 Hz (hero ponds only) · MIST R8 ¼ res 12 Hz
  ground CanvasItem shader: idx → DRY|WET row by dither → WATER row if depth > P (+ D2 rings, D1 slope)
                            → MIST row by dither → overcast / flash uniforms
  rain layer: one full-screen canvas_item (A4, cover-masked) + ≤ 300 landing-first near drops (A2/A3)
  pooled particles: splashes, drips, steam (MultiMesh or one _draw())
  hooks: E3 wetness, F3 fire, F4 elements, F5 vision/hearing, F6 NPCs ← server flags
```

**Godot constraints.**
- **Web = Compatibility only.**
  - Screen texture: yes.
  - Compute, particle trails, SDF collision, 2D HDR: no.
  - Precision is RGBA8 [V, S126].
- **`DrawableTexture2D` (4.7)** [V, S121, S122, S124]:
  - API: `setup(w, h, format)`, `blit_rect(rect, source, modulate, mipmap, material)` with a `texture_blit` shader, and `blit_rect_multi` for up to 4 targets.
  - Formats: RGBA8 / RGBA8_SRGB / RGBAH / RGBAF. Sizes: 1–16,383 px.
  - It is implemented in `drivers/gles3` but marked experimental, so wrap it behind your own class.
- **Float targets on WebGL 2** need `EXT_color_buffer_float`, so prefer RGBA8 [I, note 05].
- **SubViewport feedback** remains the pre-4.7 path [V, S130].

**Pseudocode.**

```gdscript
# wetness (C1/C3), 8 Hz, PackedByteArray at 4×4 px
for c in cells:
    var m = mat[c]
    var dry = DRY[m] * (sun if exposure[c] > 0.3 else sun * 0.45) * (1.0 + 0.3 * wind_speed)
    if rain > 0.02: dry *= 0.1
    wet[c]   = clampi(wet[c]   + int(rain * exposure[c] * ABSORB[m] - dry), 0, 255)
    shine[c] = clampi(shine[c] + int(2 * rain * exposure[c] * ABSORB[m] - 3 * dry), 0, 255)
wet_img.set_data(W, H, false, Image.FORMAT_R8, wet); wet_tex.update(wet_img)
```

```gdscript
# puddles (C5), 12 Hz, active list; borders must send as well as receive
for c in active:
    h[c] += rain * exposure[c] * K + roof_runoff[c]
    var inf = min(h[c], INFIL[mat[c]] * (1.0 - satur[c])); h[c] -= inf; satur[c] = min(1.0, satur[c] + inf / CAP)
    if h[c] > FILM:
        for n in nbrs4(c):
            var d = (z[c] + h[c]) - (z[n] + h[n])
            if d > 0.0: var f = min(d * 0.25, h[c] - FILM); h[c] -= f; h[n] += f; activate(n)
    if rain == 0.0: h[c] -= EVAP * sun * (1.0 + wind_speed)
```

```glsl
// ripple step (D1) as a texture_blit / SubViewport pass, RG8 packed around 0.5
float h = texture(src, uv).r - 0.5, prev = texture(src, uv).g - 0.5;
float nb = texture(src, uv+dx).r + texture(src, uv-dx).r + texture(src, uv+dy).r + texture(src, uv-dy).r - 2.0;
float nh = (0.5 * nb - prev) * DAMP * texture(water_mask, uv).r;     // DAMP 0.95 … 0.99
OUT = vec4(nh + 0.5, h + 0.5, 0.0, 1.0);                             // drops = separate small negative stamps
```

```gdscript
# near drops (A2/A3)
func spawn(d): d.land = Vector2(randi() % VIEW_W, randi() % VIEW_H); d.z = randf_range(40, 100)
func step(d, dt):
    var vz = VZ[d.layer] * (0.55 + 0.45 * I); d.z -= vz * dt; d.land.x += wind * vz * 0.55 * dt
    if d.z <= 0: impact(world_of(d.land), d.layer); spawn(d)
# draw: head = land - Vector2(0.55 * wind * z, z); 1-px line, LEN[layer]*(0.5+0.6*I), palette +1
```

```gdscript
# drips (E2), fire (F3), mist (G1/G2)
for s in stores:
    s.water = min(1.0, s.water + rain * s.area * K_FILL * dt)
    if randf() < s.water * s.rate * dt * 60: spawn_drip(s.edge.pick_random()); s.water = max(0.0, s.water - s.drain)
fire.F += (0.04 - 0.11 * rain * exposure_at(fire.pos)) * dt
if fire.F < 0.12: fire.lit = false; emit_steam(fire.pos, 18)
mist[c] = blur_advect_rise(mist, c) * 0.985 + K_SPRAY * max(0.0, I - 0.45) ** 2 * hard[c] \
        + (K_EVAP * wet_coarse[c] ** 2 * sun if I == 0.0 else 0.0)
```

**Gameplay hooks [I].**
- A `rain_changed(tier)` signal, following TCA_Weather_System's pattern [V, S139], drives:
  - NPC schedules
  - spawn tables
  - crop watering
  - fire rules
  - element multipliers
  - hearing and vision radii
- Lightning strikes are server events. They prefer tall or metal tiles and get a 1–2 s telegraph.

---

## 8. Reference implementation: the Rain Sandbox

`vfx-rain-sandbox.html` [S4] is one page of plain JavaScript. It draws a **320×180** Canvas 2D `ImageData` without WebGL. Its design choices are ours [I]. This description comes from reading its script.

**Scene.**
- Ground: a meadow, a dirt path with ruts and four potholes, a cobble plaza with grout and five dips.
- A pond with a sand beach, a dock and lilies.
- Buildings and props:
  - a house with a tiled roof, eaves and a rain barrel;
  - a market stall with a cloth awning;
  - a fountain, an anvil, a low wall, six trees and a campfire.
- A player (WASD or tap; U for the umbrella; E to light the fire), a villager and frogs.
- Controls: weather buttons and Auto cycle, intensity and wind sliders, sim speed 1–8×, "Dry everything", and a reduce-flashes checkbox.
- Five X-ray views: wetness, puddle depth, ripples, exposure and mist.

**Data.**
- Full-resolution typed arrays:
  - material and `WET` as bytes;
  - `WAT`, `FH`, `R0`/`R1`, `EXP` and `SHL` as floats.
- A 160×90 mist grid.
- Drops in structure-of-arrays form, `MAXD = 1600`.
- **83** base colours × 4 variants (dry, wet, mist, shadow), plus a warm firelight copy.

**Constants** (from the code [V, S4]). Water (`RIN`, `INF`, `DRN`, `FILM = 0.12`), drying (`DRY`), ripples (×0.95), exposure rays (26 px), character rates, mist and the palette tint (`k = 0.12 + 0.55·I`) are quoted in C5, C3, D1, B2, E3, G1 and H1.

| Area | Constants |
|---|---|
| Tiers | 0.12 / 0.3 / 0.5 / 0.75 / 1; intensity eases at `0.35·dt` |
| Auto cycle (148 s) | overcast 8 → drizzle 14 → light 14 → moderate 14 → heavy 14 → storm 22 → heavy 10 → light 10 → drizzle 8 → sun 34 s |
| Drops | `60 + 1300·I^1.25` (A3, A6) |
| Wetting | +36 / +60 per drawn drop; `1500·I` virtual hits per step at `8 + 28·I` (C1); drying stays active below I = 0.25 so drizzle stays patchy |
| Stores | fill 0.0004 / 0.0006 / 0.0008 per drawn hit; drain per drip 0.0012 / 0.0015 / 0.002 (E2) |
| Fire | +0.04 / −0.11·I·EXP per second (F3) |
| Lightning | above 0.85, rate 0.18/s (F1, F2) |
| Sim | 60 fixed steps/s × speed, at most 16 per frame |

**Measured cost.**
- The HUD shows a smoothed time for the `simStep` loop only. Drops, characters, particles and rendering are excluded.
- On our test machine in headless Chromium, it read **about 0.9–2.7 ms per frame** [I, Sandbox run]. That is one machine: illustrative, not a benchmark.
- Replaying the code in Node.js gave:
  - mean 0.76 ms per step in drizzle and 1.46–1.60 ms in storm;
  - median 0.52 ms and p90 1.43 ms over a storm → sun run [I, Sandbox run].
- GDScript per-cell loops are estimated at 10–50× slower [I, note 03].

**Honest simplifications [I].**
- **Materials:** one wet palette row for every material, metal included; no porosity table. There is no shine channel either.
- **Wind and sound:** wind is 1-D, and there is no audio.
- **Water timing:** puddles drain before surfaces dry (§6e).
- **Wetness ceiling:** there is no hard per-tier cap; instead weaker drizzle hits compete with drying, so drizzle stays patchy (fixed after review).
- **Border artefact:** edge columns used to collect water into a 1-px puddle frame; they are now cleared every step, and mist border cells are zeroed (fixed after review).
- **Lightning spacing:** strikes now keep at least 1.2 s apart (fixed after review; the original code had no gap).
- **Network:** nothing is networked.

**Caption-versus-code review (all resolved).** Writing this study surfaced eight places where the Sandbox's captions and code disagreed. All were fixed in the Sandbox before publication [I]:
1. **Bolts:** the code now really uses recursive midpoint displacement (depth 6) with about 35 % branch chance at ±30°, as the caption says.
2. **Evaporation mist:** the evaporation gain was raised from 0.0011 to 0.0045, so the steam veil is visible after rain rather than only in the Mist X-ray.
3. **Villager:** the caption now says the villager shelters from Moderate rain (I > 0.42).
4. **Drying order:** the caption now says metal and stone dry fastest.
5. **Drizzle:** hits now scale `8 + 28·I` and drying competes below I = 0.25, so drizzle stays a speckle instead of soaking 91–99 %.
6. **Eaves:** a 3-px gravel drip trench (dirt surface, lowered floor) now sits under the eaves, so drips visibly collect there.
7. **Ripple shading:** the caption now says one or two palette steps.
8. **Aftermath:** it now steams through the fix in point 2.

---

## 9. Gem findings

**How these were checked.**
- Licences were read from LICENSE files, file headers or site tags [V, S141, note 07].
- The GitHub API was blocked, so star counts are missing.
- Shadertoy was behind Cloudflare and could not be read.

**Flags:**
- **Low**: permissive licence.
- **Attrib.**: credit required.
- **SA**: share-alike.
- **Copyleft**: GPL family.
- **NC?**: possible non-commercial terms (Shadertoy default, unverified).
- **None**: no licence.

| Name | URL | Licence | Maturity | Good for | Flag |
|---|---|---|---|---|---|
| jQuery.ripples | https://github.com/sirxemic/jquery.ripples | MIT | v0.6.3, 2019 | Smallest ping-pong ripple | **Low** (float targets) |
| WebGL Water | https://github.com/evanw/webgl-water | MIT | 2011–2016 | Origin of the `·0.995` ripple rule | **Low** (3D) |
| Weather FX Free | https://github.com/Spyridon-Pikoulas/godot-weather-fx-free | CC BY 4.0 | v1.0.1, 2026-09-29; web-tested | 3-layer hashed rain, pixel mode | **Attrib.**; AI-assisted; side-view splashes |
| WeatherSystem2D | https://github.com/gregrylivingston/Godot4---Weather-System-2D | MIT | v4.7, 2026-07-11 | Whole 2D kit to study | **Low**; 300-iteration loop per pixel |
| Puddle System | https://www.godotengine.org/asset-library/asset/5406 | MIT | v2.1.0, 2026-08-12 | 2D puddles, ripples, footsteps | **Low**; GDScript path on web |
| Rain and Snow with Parallax | https://godotshaders.com/shader/rain-and-snow-with-parallax-scrolling-effect/ | MIT | 101 likes | O(1) column rain | **Low** |
| Simple rain/snow | https://godotshaders.com/shader/simple-rain-snow-shader/ | CC0 | 122 likes | Easiest streaks | **Low**; slow O(px × count) |
| Rain Drop (floor effect) | https://godotshaders.com/shader/rain-drop-floor-effect/ | Tagged CC0/MIT | 30 likes, 2025-08-12 | Top-down ring field | **NC?** (matches Zavie's "Rainier mood") |
| Rain puddles with ripples & reflection | https://godotshaders.com/shader/rain-puddles-with-ripples-and-reflection/ | Tagged CC0 | 87 likes | Mask and ripple ideas (3D) | **NC?** (credits Zavie) |
| Transparent Ripples | https://godotshaders.com/shader/transparent-ripples/ | MIT | 72 likes | One analytic ring on a sprite | **Low** |
| Ripple shader / Rainier mood / Raindrops / Procedural drops / Rain drops on screen | https://godotshaders.com/shader/rainier-mood/ | Shadertoy ports; one page says CC BY 3.0 | 3–70 likes | Study only | **NC?** / **Attrib.** |
| Dynamic Animated Liquid Texture | https://godotshaders.com/shader/dynamic-animated-liquid-texture-blood-paint-water-and-other-fluids/ | CC0 | 2026-04-12 | DrawableTexture2D wet-buffer pattern | **Low**; check Compatibility |
| Cataclysm: DDA weather | https://github.com/CleverRaven/Cataclysm-DDA | CC BY-SA 3.0 | Very active | Tiers, soaking order, field decay, sight/sound | **SA**: numbers only |
| pokeemerald | https://github.com/pret/pokeemerald | none | Long-running | Exact GBA rain and thunder | **None**: study only |
| snowdrift | https://github.com/paramat/snowdrift | MIT | Long-lived mod | Sky-light outdoors test | **Low** |
| Veloren rain occlusion | https://gitlab.com/veloren/veloren | GPL-3.0 | Active | Directed occlusion map | **Copyleft** |
| Sandspiel | https://github.com/MaxBittker/sandspiel | MIT | 2026-09-09 | "Scoot 2" water levelling | **Low** (side view) |
| The Watchmaker (ScummVM), TortoiseGit WaterEffect, zelda3, Exult | §14 | Not recorded in our notes | — | Integer ripples, overlay rain, U7 storm | **Unverified**: re-derive |
| itch packs | https://jellytempo.itch.io/2d-pixel-art-rain-effect | Not verified | — | Sprite references | Unverified |

Also MIT: Weather 2D (Godot 3.2, stale) [S137], GodotWeatherSystem (weighted weather table) [S138] and TCA_Weather_System (rain-intensity signal) [S139].

Out of scope (glass drops, licence traps): rainyday.js is **GPLv2**, not MIT [V, S160]; Codrops RainEffect has a custom no-redistribution licence [V, S161].

**Takeaway [I].**
- Re-derive ripples and rings from the MIT sources.
- Take tier numbers from CDDA and pokeemerald as data, not as code.
- Weather FX Free is the best ready-made 2D rain layer if attribution is acceptable.

---

## 10. Learnings and anti-patterns

**Learnings.**
1. **Rain is a state, not an effect.** Classic games had no dynamic wetness at all. That gap is the opportunity [V, note 01; I].
2. **Pick the landing spot first** [V, S5].
3. **Use layers at a constant cost far away and particles near the player** [V, S105, S58, S51].
4. **One knob, named tiers** [V, S107, S59, S5, S25].
5. **Porous, bright materials get darker; smooth ones get shinier.** Use a per-material table [V, S111, S62].
6. **Puddles form where infiltration loses** [V, S83].
7. **Shelters store water and keep dripping** [V, S108, S59].
8. **Two quick flashes, then thunder**, with shadows lifted less than highlights [V, S179, S6].
9. **A few crisp rules:** ±25 %, −1 vision, a wetness meter, fire goes out [V, S25, S26, S34, S43].

**Anti-patterns.**
- **Rain that misses the ground and interiors.**
  - Particles with no splashes; drops the player can't see; overdone puddle gloss [V, S50].
  - Rain falling inside buildings [V, S27, S49].
- **Weather that never changes or never ends.**
  - Endless drizzle (a DST bug) [V, S33].
  - Uniform wetting and drying [V, S49].
  - No wind, constant maximum intensity, and wet/dry flips with no transition [I, note 06].
- **Accessibility failures.**
  - Weather that hides gameplay cues [V, S48].
  - Flashes over WCAG limits, or no "reduce flashes" option [V, S54].
- **Materials treated alike.** The same wet factors on every material, including metal. Our Sandbox does this too [V, S62; I].
- **Performance traps.**
  - Per-pixel loops over every drop [V, S143, S136].
  - Uncapped per-drop rain in an MMO: RO removed its rain, and UO capped it at 70 [V-secondary, S17; V, S18].
- **Wrong timing:** puddles that dry before the ground does [I, §6e].
- **Wrong shapes:** tear-shaped drops [V, S87].
- **Licence traps:** "CC0" shaders that are really Shadertoy ports [V, S145; U].

---

## 11. "See it in action" index

| # | Game / production | Year | Look at | Link |
|---|---|---|---|---|
| 1 | Pokémon Emerald | 2004 | Landing-first drops, thunder maps | https://github.com/pret/pokeemerald/blob/master/src/field_weather_effect.c |
| 2 | Pokémon Ruby/Sapphire | 2002 | Route 119 rain | https://bulbapedia.bulbagarden.net/wiki/Hoenn_Route_119 |
| 3 | Zelda: A Link to the Past | 1991 | 50 % overlay, colour-math flash | https://github.com/snesrev/zelda3/blob/master/src/overworld.c |
| 4 | Ultima VII (Exult) | 1992 | 200 drops at 10 Hz | https://github.com/exult/exult/blob/master/effects.cc |
| 5 | Ultima Online | 1997 | Server weather, cap of 70 | https://moongate-community.github.io/moongate/articles/networking/packet-reference/0x65.html |
| 6 | Ragnarok Online | 2002–04 | Removed EF_RAIN | http://nn.ai4rei.net/dev/ref/rorain/ |
| 7 | Final Fantasy Tactics | 1997 | ×5/4, ×3/4, marsh cost | https://finalfantasy.fandom.com/wiki/Weather_(Tactics) |
| 8 | Advance Wars series | 2001–08 | +1 move, −1 vision, forced fog | https://advancewars.fandom.com/wiki/Rain |
| 9 | Fire Emblem: The Blazing Blade | 2003 | 2/3 movement, indoors exempt | https://www.fireemblemwiki.org/wiki/Rain |
| 10 | Harvest Moon (SNES) | 1996 | Auto-watering | https://strategywiki.org/wiki/Harvest_Moon/Seasons |
| 11 | Final Fantasy VI | 1994 | Zozo | https://na.finalfantasy.com/topics/448 |
| 12 | Diablo II | 2000 | Rain flag, cut Mud | https://www.d2mods.info/forum/kb/viewarticle?a=232 |
| 13 | Living Worlds / Canvas Cycle | — | Palette-cycled rain | https://experiments.withgoogle.com/canvas-cycle |
| 14 | Zelda: OoT / MM | — | Summoned / scheduled rain | https://zelda.fandom.com/wiki/Rain |
| 15 | Zelda: BotW / TotK | — | Slippery climbs, metal attracts lightning | https://zelda.fandom.com/wiki/Weather |
| 16 | Don't Starve / Together | — | Wetness, moisture, fuel | https://dontstarve.fandom.com/wiki/Rain |
| 17 | Stardew Valley | — | Storms, rods, Green Rain | https://stardewvalleywiki.com/Rain |
| 18 | Animal Crossing | — | Umbrellas, frogs, rain fish | https://nookipedia.com/wiki/Rain |
| 19 | Divinity: Original Sin 2 | — | Wet, electrified puddles | https://dos2.wiki/wiki/Rain |
| 20 | Minecraft | — | Fire chance, rain.above | https://minecraft.wiki/w/Rain |
| 21 | Valheim | — | Wet 120 s | https://valheim.fandom.com/wiki/Wet |
| 22 | RimWorld | — | Unroofed fires out | https://www.rimworldwiki.com/wiki/Rain |
| 23 | Cataclysm: DDA | — | Body-part wetness | https://discourse.cataclysmdda.org/t/wetness-mechanics/9038 |
| 24 | Hunt: Showdown | — | Footstep masking, sky-ray drips | https://huntshowdown.com/news/behind-the-storm-technical-design-of-thundershower-in-hunt-showdown |
| 25 | Disco Elysium | 2016 devblog | Shadow-map mask, uneven drying | https://discoelysium.com/devblog/2016/02/10/weather-duty |
| 26 | Abandon Ship | — | Baked density, doused fires | https://www.pcgamer.com/how-developers-make-perfect-rain-in-games |
| 27 | Stereophyta | — | Rhythmic rain | https://www.pcgamer.com/how-developers-make-perfect-rain-in-games |
| 28 | Ghouls 'n Ghosts | — | Ground splashes | https://80.lv/articles/how-rain-works-in-video-games |
| 29 | ATI ToyShop | 2006 | Composite rain, ripples | https://history.siggraph.org/?p=48401 |
| 30 | Remember Me | 2012–13 blog | Layers, puddles, rings | https://seblagarde.wordpress.com/2013/01/03/water-drop-2b-dynamic-rain-and-its-effects/ |
| 31 | Far Cry 6 | — | Wetness shadow map, forecasts | https://www.ubisoft.com/en-us/company/how-we-make-games/technologies/articles/simulating-tropical-weather-in-far-cry-6 |
| 32 | Ghost of Tsushima | 2021 talk | Wind, vorticles | https://gdcvault.com/play/1027350/Blowing-from-the-West-Simulating |
| 33 | Forza Motorsport 7 | — | Growing puddles, drying line | https://gtplanet.net/forza-motorsport-7s-dynamic-weather-system-offers-visceral-experience |
| 34 | Battlefield 1 | — | Rain hinders spotting | https://www.ea.com/games/battlefield/news/battlefield-1-weather |
| 35 | Days Gone | — | Weather changes hordes | https://gamingbolt.com/days-gone-developers-talk-about-dynamic-weather-system-and-how-it-will-impact-gameplay |
| 36 | The Watchmaker | 1999 | Integer ripples | https://github.com/scummvm/scummvm/blob/master/engines/watchmaker/3d/geometry.cpp |
| 37 | Ghost of Yōtei | 2025 | Directional wetness grid | https://blog.playstation.com/?p=411201 |
| 38 | Borderlands 4 | GDC 2026 talk | Artist forecasts | https://schedule.gdconf.com/session/the-dynamic-weather-systems-of-borderlands-4-how-they-can-apply-to-games-without-dynamic-weather/917367 |
| 39 | rain98 (demo) | 2026 | Palette, binaural audio | https://gamingtrend.com/previews/rain98-so-far-is-a-masterclass-in-atmosphere/ |
| 40 | PICO-8 / Picotron rain carts | 2019–24 | Tiny rain, ripples | https://www.lexaloffle.com/bbs/?pid=70456 |
| 41 | Size-coded "rain" intros | 1999–2025 | Rain with no state arrays | https://www.pouet.net/prod.php?which=63272 |
| 42 | Tibia | — | No rain found (negative result) | https://tibia.fandom.com/wiki/Updates/8.10 |

---

## 12. What remains unverified (and corrections)

**Corrections.**
- **Lagarde 2a URL:** dated 2012/12/27. A 2a URL with 2013/01/03 returns 404 [V, note 02].
- **FAO sand infiltration:** the table says "less than 30" mm/h; read it as ≥ 30 [V, S83; I].
- **Garg's Gunn–Kinzer fit:** with the radius in metres it gives implausible speeds. Use Rousseau's tabulated speeds instead [V, S97, S102].
- **rainyday.js:** it is GPLv2, not MIT [V, S160].
- **"CC0" ripple shaders:** they credit or match Zavie's Shadertoy code [V, S145, S144].
- **Pokémon Gen III:** the overworld thunderstorm is cosmetic [V, S23].
- **Remember Me splash counts:** no unit is stated [V, S59].
- **Speed of a 5 mm drop:** about 10 m/s per Weber, about 9 per Barani, and 9.17 maximum per Gunn–Kinzer (from memory) [V, S109, S78; U].
- **Witchbrook:** release dates conflict, January vs 2027 [V, S193].
- **ToyShop "4 passes":** this means a seed pass, 2 Euler passes and a Sobel pass [V, S57].
- **Sandbox captions:** see §8.

**Still unverified [U].**
- **From memory:** Met Office's 50 mm/h cut (Barani confirms the number); the Gunn–Kinzer table and the `9.65 − 10.3·e^(−0.6D)` fit.
- **Licences:** Shadertoy's default licence; the itch packs [S162].
- **Games:**
  - Stardew crop watering and frogs; BotW static sparks; Swift Swim.
  - FF6, Chrono Trigger, Secret of Mana and EarthBound rain.
  - Rain in Silksong, Octopath Traveler 0 and Mina the Hollower [S191, S192, S194].
- **Papers:** Nakamae 1990 content; Tariq [S115, S117]; Starik & Werman and L. Wang venues; Twomey pages.
- **Inferences and mirrors:** CDDA acid-rain removal and ALttP's four quadrants are inferred; the Ferrari Q&A was read via a mirror [S166].
- **Godot:** `DrawableTexture2D` cost on WebGL 2; self-blit; RGBAH/RGBAF on web; 2D light specular as sheen; CPUParticles2D in HTML5 [S133].
- **Timings:** all GDScript timings are [I]. The WebGPU "~4×" is speaker-reported [S128]. ToyShop and Remember Me timings are developer-reported.

---

## 13. Prototype roadmap for Godot (web)

1. **Look first (1–2 days).**
   - Build a ground shader with a palette LUT: DRY, WET, MIST, SHADOW and FLASH rows.
   - Read a painted wetness map through a Bayer + hash threshold (C1, C2, H1).
   - Add the overcast uniform.
2. **Weather state.**
   - A `WeatherDirector` with tiers, eased intensity, gusty wind, a seed and a sine envelope.
   - Sync it with a UO-style `{state, intensity, wind, seed}` message.
3. **Visible rain.**
   - A cover-masked, 3-layer hashed shader (A4).
   - At most 300 landing-first near drops (A2, A3).
   - Material splashes (C7) and curtains (A5).
   - Profile on a low-end phone browser.
4. **Ground truth.**
   - Wetness at 8 Hz and water with infiltration at 12 Hz, on `PackedByteArray` at 4×4 px (C1, C3, C5).
   - Use a per-material porosity table.
   - Make puddles outlast surface wetness.
   - Fix the border cells.
5. **Water.**
   - Ring field on all water (D2).
   - Ping-pong ripples only on the town pond and fountain (D1), behind a wrapper.
   - Footsteps and drips feed both.
6. **Shelter and life.**
   - Cover map with wind buckets (E1, B2).
   - Roof, awning and tree stores with a hard floor (E2).
   - Character wetness and an umbrella (E3).
   - NPC shelter plus frogs and snails (F6).
7. **Storm.**
   - Emerald-curve flash, a ≥ 1 s gap guard and a reduce-flashes toggle (F1).
   - Short telegraphed ground bolts (F2).
   - Fire out with steam (F3).
   - F4/F5 rules behind server flags.
   - Audio buses with roof muffling (H3).
8. **Fog and aftermath.**
   - Haze in the LUT and a quarter-resolution spray grid (G1).
   - Evaporation mist tuned until it is visible (G2).
   - Optionally move the ticks to `DrawableTexture2D` on 4.7, and compare against the CPU path on WebGL 2.

---

## 14. Sources

These are numbered for the inline [S#] references. More game and repository URLs appear in §4, §9 and §11. Every URL comes from the research notes or the Sandbox file. "Not fetched" marks sources whose content was not read.

**Series and reference**
1. Sanglard, How DOOM fire was done: https://fabiensanglard.net/doom_fire_psx/
2. Kingsfoil, Top-down pixel snow (VFX #1): https://kingsfoil-artifacts.netlify.app/vfx-snow-topdown-pixel
3. Kingsfoil, Top-down pixel acid (VFX #2): https://kingsfoil-artifacts.netlify.app/vfx-acid-topdown-pixel
4. Kingsfoil, Rain Sandbox: `vfx-rain-sandbox.html` (companion page to this study)

**Classic source code and hardware docs**
5. pokeemerald, field_weather_effect.c: https://github.com/pret/pokeemerald/blob/master/src/field_weather_effect.c
6. pokeemerald, field_weather.c: https://github.com/pret/pokeemerald/blob/master/src/field_weather.c
7. pokeemerald, field_weather.h: https://github.com/pret/pokeemerald/blob/master/include/constants/field_weather.h
8. pokeemerald, metatile_behavior.c: https://github.com/pret/pokeemerald/blob/master/src/metatile_behavior.c
9. pokeemerald, event_object_movement.c: https://github.com/pret/pokeemerald/blob/master/src/event_object_movement.c
10. pokeemerald, field_effect_helpers.c: https://github.com/pret/pokeemerald/blob/master/src/field_effect_helpers.c
11. pokeemerald, field_effect_objects.h: https://github.com/pret/pokeemerald/blob/master/src/data/field_effects/field_effect_objects.h
12. pokeemerald, battle_util.c: https://github.com/pret/pokeemerald/blob/master/src/battle_util.c
13. zelda3, overworld.c: https://github.com/snesrev/zelda3/blob/master/src/overworld.c
14. SNESdev wiki, Color math: https://snes.nesdev.org/wiki/Color_math
15. Super Famicom wiki, Transparency: https://wiki.superfamicom.org/transparency
16. Exult, effects.cc: https://github.com/exult/exult/blob/master/effects.cc
17. ai4rei, Ragnarok Online EF_RAIN: http://nn.ai4rei.net/dev/ref/rorain/
18. Moongate, UO packet 0x65: https://moongate-community.github.io/moongate/articles/networking/packet-reference/0x65.html
19. d2mods, Levels.txt: https://www.d2mods.info/forum/kb/viewarticle?a=232
20. TCRF, Diablo II (no rain content found): https://tcrf.net/Diablo_II
21. TibiaWiki, Updates 8.10: https://tibia.fandom.com/wiki/Updates/8.10
22. ZLADX, special effects in Link's Awakening (no rain detail): https://zladx.github.io/posts/special-effects-in-zelda-links-awakening

**Game wikis and design articles**
23. Bulbapedia (mobile), Rain: https://m.bulbapedia.bulbagarden.net/wiki/Rain
24. Bulbapedia, Hoenn Route 119: https://bulbapedia.bulbagarden.net/wiki/Hoenn_Route_119
25. Final Fantasy Wiki, Weather (Tactics): https://finalfantasy.fandom.com/wiki/Weather_(Tactics)
26. Advance Wars Wiki, Rain: https://advancewars.fandom.com/wiki/Rain
27. Fire Emblem Wiki, Rain: https://www.fireemblemwiki.org/wiki/Rain
28. StrategyWiki, Harvest Moon/Seasons: https://strategywiki.org/wiki/Harvest_Moon/Seasons
29. Legends of Localization (Harvest Moon forecast): https://legendsoflocalization.com/?p=3808
30. Square Enix, FFVI Zozo: https://na.finalfantasy.com/topics/448
31. Zelda Wiki, Rain: https://zelda.fandom.com/wiki/Rain
32. Zelda Wiki, Weather: https://zelda.fandom.com/wiki/Weather
33. Don't Starve Wiki, Rain: https://dontstarve.fandom.com/wiki/Rain
34. Don't Starve wiki.gg, Wetness/DST: https://dontstarve.wiki.gg/wiki/Wetness/DST
35. Don't Starve wiki.gg, Wetness: https://dontstarve.wiki.gg/wiki/Wetness
36. Stardew Valley Wiki, Rain: https://stardewvalleywiki.com/Rain
37. Stardew Valley Wiki, Weather: https://stardewvalleywiki.com/Weather
38. Nookipedia, Rain: https://nookipedia.com/wiki/Rain
39. DOS2 wiki, Wet (Status): https://dos2.wiki/wiki/Wet_(Status)
40. DOS2 wiki, Rain: https://dos2.wiki/wiki/Rain
41. Fextralife DOS2, Rain: https://divinityoriginalsin2.wiki.fextralife.com/Rain
42. Minecraft Wiki, Rain (mirror): https://wiki.ronlab.site/content/minecraftwiki_en_all_maxi_2025-11/Rain ; canonical https://minecraft.wiki/w/Rain
43. Minecraft Wiki (Fandom), Fire: https://minecraft.fandom.com/wiki/Fire
44. Minecraft Wiki (Fandom), Weather: https://minecraft.fandom.com/wiki/Weather
45. Valheim Wiki, Wet: https://valheim.fandom.com/wiki/Wet
46. RimWorld Wiki, Rain: https://www.rimworldwiki.com/wiki/Rain
47. CDDA forum, Wetness mechanics (2015): https://discourse.cataclysmdda.org/t/wetness-mechanics/9038
48. Crytek, Behind the Storm (Hunt: Showdown): https://huntshowdown.com/news/behind-the-storm-technical-design-of-thundershower-in-hunt-showdown
49. ZA/UM, Disco Elysium "Weather duty": https://discoelysium.com/devblog/2016/02/10/weather-duty
50. 80.lv, How rain works in video games: https://80.lv/articles/how-rain-works-in-video-games
51. PC Gamer, How developers make perfect rain: https://www.pcgamer.com/how-developers-make-perfect-rain-in-games
52. BudgetPixel, Rain and Reflections in 4 Frames: https://budgetpixel.com/blog/how-to-animate-pixel-art-rain-and-reflections-in-4-frames
53. Slynyrd, Pixelblog 10 – Water in Motion: https://slynyrd.com/blog/2018/10/12/pixelblog-10-water-in-motion
54. W3C, Understanding SC 2.3.1: https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html
55. Game Developer, Slime Rancher 2 weather (not fetched): https://www.gamedeveloper.com/programming/the-art-and-science-of-creating-weather-in-slime-rancher-2
56. Texel Raptor, Croakwood devlog 5 (not fetched): https://www.texelraptor.com/blog/croakwood-devlog-5

**Industry architectures**
57. Tatarchuk, Artist-Directable Real-Time Rain Rendering (SIGGRAPH 2006 course ch. 3): https://advances.realtimerendering.com/s2006/Chapter3-Artist-Directable_Real-Time_Rain_Rendering_in_City_Environments.pdf
58. Tatarchuk, ToyShop rain slides: https://advances.realtimerendering.com/s2006/Tatarchuk-Rain.pdf (DOI 10.1145/1185657.1185828)
59. Lagarde, Water drop 2a: https://seblagarde.wordpress.com/2012/12/27/water-drop-2a-dynamic-rain-and-its-effects/
60. Lagarde, Water drop 2b: https://seblagarde.wordpress.com/2013/01/03/water-drop-2b-dynamic-rain-and-its-effects/
61. Lagarde, Water drop 3a: https://seblagarde.wordpress.com/2013/03/19/water-drop-3a-physically-based-wet-surfaces/
62. Lagarde, Water drop 3b: https://seblagarde.wordpress.com/2013/04/14/water-drop-3b-physically-based-wet-surfaces/
63. CryEngine 5 docs, Environment Entities (Rain): https://cryengine.com/docs/static/engines/cryengine-5/categories/23756816/pages/29796935
64. Ubisoft, Simulating Tropical Weather in Far Cry 6: https://www.ubisoft.com/en-us/company/how-we-make-games/technologies/articles/simulating-tropical-weather-in-far-cry-6
65. GDC Vault, Far Cry 6 weather talk: https://www.gdcvault.com/play/1027725/Simulating-Tropical-Weather-in-Far
66. Game Developer, Vorticles in Ghost of Tsushima: https://gamedeveloper.com/design/using-vorticles-to-simulate-wind-in-i-ghost-of-tsushima-i-
67. GDC Vault, Blowing from the West: https://gdcvault.com/play/1027350/Blowing-from-the-West-Simulating
68. 80.lv, Ghost of Tsushima VFX (wind only): https://80.lv/articles/insights-into-building-vfx-for-ghost-of-tsushima/
69. EA, Battlefield 1 weather: https://www.ea.com/games/battlefield/news/battlefield-1-weather
70. GTPlanet, Forza Motorsport 7 dynamic weather: https://gtplanet.net/forza-motorsport-7s-dynamic-weather-system-offers-visceral-experience
71. GamingBolt, Days Gone weather: https://gamingbolt.com/days-gone-developers-talk-about-dynamic-weather-system-and-how-it-will-impact-gameplay
72. SIGGRAPH History, ToyShop: https://history.siggraph.org/?p=48401
73. fxguide, Lagarde on wet environments: https://www.fxguide.com/?p=43362
74. 3DVF, Lagarde series index: https://3dvf.com/actualite-5676-sebastien-lagarde-simulation-pluie-en-jeu-video-html/

**Meteorology and physics**
75. AMS Glossary, Rain: https://glossarystaging.ametsoc.net/wiki/Rain
76. AMS Glossary, Drizzle drop: https://glossarysandbox.ametsoc.net/wiki/Drizzle_drop
77. Barani, Rain rate intensity classification (vendor): https://barani.squarespace.com/faq-articles/2020/1/19/rain-rate-intensity-classification
78. Barani, Rain drop size and speed (vendor): https://barani.squarespace.com/faq-articles/2020/1/19/rain-drop-size-and-speed-of-a-falling-rain-drop
79. Wikipedia, Raindrop size distribution: https://en.wikipedia.org/wiki/Raindrop_size_distribution
80. Gunn & Kinzer 1949 (citation): https://scilit.com/publications/dd7455b0bcef8a70e2d69d80e3b70248
81. NOAA VOS, Gust factor: https://vos.noaa.gov/MWL/fall_02/Gust.pdf
82. NWS Tallahassee, Lightning frequency: https://www.weather.gov/tae/ghwo_lightning
83. FAO, Basic infiltration rates: https://www.fao.org/3/s8684e/s8684e0a.htm
84. Global Seafood Alliance, Evaporation: https://www.globalseafood.org/advocate/evaporation-affected-by-sunlight-temperature-wind/
85. Stone World, Coefficient of friction: https://www.stoneworld.com/articles/83570-what-is-coefficient-of-friction
86. Britannica, Capillary wave: https://www.britannica.com/science/capillary-wave
87. USGS, Raindrop shape: https://www.usgs.gov/media/images/raindrop-shape-determined-drop-size-and-air-resistance
88. Wikipedia, Visibility: https://en.wikipedia.org/wiki/Visibility
89. Qin & Hiller 2016, pervious concrete evaporation: https://digitalcommons.mtu.edu/michigantech-p/6206
90. Drop impact on a deep pool (arXiv 2302.02728): https://ar5iv.labs.arxiv.org/html/2302.02728 ; JFM https://www.cambridge.org/core/product/EA1176C1DB539BBAB00F3EDA2FF151B9
91. Worthington review, Science 1909: https://doi.org/10.1126/science.29.742.464 ; Boys 1908: https://doi.org/10.1038/078666a0
92. Yarin 2006, Drop impact dynamics: https://doi.org/10.1146/annurev.fluid.38.050304.092144

**Rendering research**
93. Garg & Nayar, CVPR 2004: https://doi.org/10.1109/CVPR.2004.1315077
94. Garg & Nayar, ICCV 2005: https://mlanthology.org/iccv/2005/garg2005iccv-camera
95. Garg & Nayar, TOG 2006: https://doi.org/10.1145/1141911.1141985 ; https://history.siggraph.org/?p=113590
96. Garg & Nayar, IJCV 2007: https://doi.org/10.1007/s11263-006-0028-6
97. Garg & Nayar, Photometric model of a rain drop (TR): https://www.cs.columbia.edu/CAVE/publications/pdfs/Garg_TR04.pdf
98. CAVE, Camera rain: https://cs.columbia.edu/CAVE/projects/camera_rain/camera_rain.php
99. CAVE, Rain streak database: https://www.cs.columbia.edu/CAVE/databases/rain_streak_db/rain_streak.php
100. Wang & Wade 2004: https://doi.org/10.1145/1186223.1186241 ; https://history.siggraph.org/?p=93028
101. Starik & Werman: https://www.cs.huji.ac.il/~werman/Papers/rain/rain.html ; https://lear.inrialpes.fr/people/triggs/events/iccv03/cdrom/texture03/front-pages.html
102. Rousseau et al. 2006: https://doi.org/10.1016/j.cag.2006.03.013 ; https://faculty.digipen.edu/~gherron/references/References/Modeling/Realistic-real-time-rain-rendering.pdf
103. L. Wang, Lin et al. 2006: https://zhouchenlin.github.io/Publications/2006-Real_time_Rain.pdf
104. Puig-Centelles et al., TVC 2009: https://doi.org/10.1007/s00371-009-0366-9 ; https://hgpu.org/?p=2089
105. Puig-Centelles et al., GRAPP 2009: https://www.scitepress.org/Papers/2009/18018/18018.pdf
106. Creus & Patow 2013: https://doi.org/10.1016/j.cag.2012.12.002 ; https://dugi-doc.udg.edu/handle/10256/11986
107. Weber et al. 2015, multiscale rain: https://doi.org/10.1016/j.cag.2015.04.007
108. Weber et al. 2016, throughfall: https://doi.org/10.1111/cgf.12945 ; https://diglib.eg.org/handle/10.1111/cgf12945
109. Weber, thesis 2016: https://theses.fr/2016LIMO0109/abes
110. Halder / Tremblay et al.: https://arxiv.org/abs/2009.03683 ; https://doi.org/10.1109/ICCV.2019.01030 ; https://doi.org/10.1007/s11263-020-01366-3
111. Lekner & Dorf 1988: https://doi.org/10.1364/AO.27.001278 ; https://www.wgtn.ac.nz/scps/staff/pdf/darkerwhenwet.pdf
112. Jensen, Legakis & Dorsey 1999: https://diglib.eg.org/handle/10.2312/EGWR.EGWR99.273-282 ; https://graphics.ucsd.edu/~henrik/papers/rendering_wet_materials/
113. Zhang & Voss 2006: https://web3.physics.miami.edu/~voss/ken/RefPapers/056_ZV_AO_2006.pdf
114. Twomey et al. 1986: https://scilit.net/publications/34d7a43472aa84c72aff50a1c8aaed5f
115. Nakamae et al. 1990: https://doi.org/10.1145/97880.97922 ; Kaneda et al. 1990: https://doi.org/10.1007/978-4-431-68123-6_8
116. Wang, Mucha & Turk 2005: https://wanghmin.github.io/Wang-2005-WDS/Wang-2005-WDS.htm
117. Tariq, NVIDIA rain (candidate PDF, not opened): https://classes.cs.uchicago.edu/archive/2022/fall/23700-1/papers/gpu-rain.pdf

**Godot and web platform**
118. Godot 4.7 release: https://godotengine.org/releases/4.7/
119. Cinevva, Godot 4.7 released: https://app.cinevva.com/news/2026-06-19-godot-4-7-released
120. CG Channel, Godot 4.7: https://www.cgchannel.com/?p=176830
121. DrawableTexture2D.xml @4.7-stable: https://raw.githubusercontent.com/godotengine/godot/4.7-stable/doc/classes/DrawableTexture2D.xml
122. gles3 texture_storage.cpp @4.7-stable: https://raw.githubusercontent.com/godotengine/godot/4.7-stable/drivers/gles3/storage/texture_storage.cpp
123. version.py @4.7-stable: https://raw.githubusercontent.com/godotengine/godot/4.7-stable/version.py
124. PR #105701 Implement DrawableTextures (and #118243, #120092, #118272, #115655, #119929): https://github.com/godotengine/godot/pull/105701
125. Godot docs, DrawableTexture2D: https://docs.godotengine.org/en/4.7/classes/class_drawabletexture2d.html
126. Godot docs, Renderers: https://raw.githubusercontent.com/godotengine/godot-docs/master/tutorials/rendering/renderers.rst ; https://docs.godotengine.org/en/stable/tutorials/rendering/renderers.html
127. web.dev, WebGPU in all major browsers: https://web.dev/blog/webgpu-supported-major-browsers
128. GodotCon Boston 2026, Godot WebGPU: https://talks.godotengine.org/godotcon-boston-2026/talk/CT739D/
129. dwalter/godotwebgpu: https://github.com/dwalter/godotwebgpu
130. GodotCon Amsterdam 2026, Procedural Pixel Art: https://talks.godotengine.org/godotcon-ams-2026/talk/NSNXFT/
131. GodotFest 2025, Raytracing is simple for 2D games (not reviewed): https://app.media.ccc.de/v/godotfest2025-raytracing-is-simple-for-2d-games/audio
132. AlternativeTo, Godot 4.7 asset store overhaul: https://alternativeto.net/news/2026/6/godot-4-7-adds-arealight3d-asset-store-overhaul-gabe-support-and-hdr-output/
133. Godot forum, CPUParticles2D on HTML5 (not fetched): https://forum.godotengine.org/t/cpuparticles2d-is-not-running-on-html5-builds/78273
134. Godot, GPUParticles improvements 4.0 (not fetched): https://godotengine.org/article/improvements-gpuparticles-godot-40

**Gems, shaders and assets**
135. Weather FX Free: https://github.com/Spyridon-Pikoulas/godot-weather-fx-free ; https://godotengine.org/asset-library/asset/5495 ; https://raw.githubusercontent.com/Spyridon-Pikoulas/godot-weather-fx-free/main/README.md ; https://store.godotengine.org/asset/heyheythere/weather-fx-free/
136. WeatherSystem2D: https://github.com/gregrylivingston/Godot4---Weather-System-2D ; https://godotengine.org/asset-library/asset/5328
137. Weather 2D (parachutino): https://github.com/parachutino/godot-weather-2D ; https://godotengine.org/asset-library/asset/897
138. GodotWeatherSystem: https://codeberg.org/matiaslavik/GodotWeatherSystem ; https://godotengine.org/asset-library/asset/2601
139. TCA_Weather_System: https://godotengine.org/asset-library/asset/4960
140. Puddle System: https://www.godotengine.org/asset-library/asset/5406
141. godotshaders licence page: https://godotshaders.com/license/
142. Rain and Snow with Parallax: https://godotshaders.com/shader/rain-and-snow-with-parallax-scrolling-effect/
143. Simple rain/snow: https://godotshaders.com/shader/simple-rain-snow-shader/
144. Rain Drop (floor effect): https://godotshaders.com/shader/rain-drop-floor-effect/
145. Rain puddles with ripples and reflection: https://godotshaders.com/shader/rain-puddles-with-ripples-and-reflection/
146. Rain Puddles V3: https://godotshaders.com/shader/rain-puddles-v1/
147. Transparent Ripples: https://godotshaders.com/shader/transparent-ripples/
148. Ripple shader (nevoski): https://godotshaders.com/shader/ripple-shader/
149. Rainier mood / Raindrops / Procedural drops / Rain drops on screen: https://godotshaders.com/shader/rainier-mood/ ; https://godotshaders.com/shader/raindrops/ ; https://godotshaders.com/shader/procedural-drops-animated-rain-sweat-etc/ ; https://godotshaders.com/shader/rain-drops-on-screen-notexture/
150. Modular Environmental Particles: https://godotshaders.com/shader/modular-environmental-particles-dust-leaves-rain-etc/
151. Pixel Cloud Shader: https://godotshaders.com/shader/pixel-cloud-shader/
152. Dynamic Animated Liquid Texture: https://godotshaders.com/shader/dynamic-animated-liquid-texture-blood-paint-water-and-other-fluids/
153. godotshaders rain tag: https://godotshaders.com/shader-tag/rain/
154. jQuery.ripples: https://github.com/sirxemic/jquery.ripples
155. WebGL Water: https://github.com/evanw/webgl-water ; http://madebyevan.com/webgl-water/
156. Cataclysm: DDA (weather.cpp, map.cpp, weather_type.json, field_type.json): https://github.com/CleverRaven/Cataclysm-DDA
157. Sandspiel: https://github.com/MaxBittker/sandspiel
158. snowdrift (Luanti): https://github.com/paramat/snowdrift
159. Veloren, rain_occlusion.glsl: https://gitlab.com/veloren/veloren
160. rainyday.js (npm): https://registry.npmjs.org/rainyday.js
161. Codrops RainEffect: https://github.com/codrops/RainEffect
162. itch.io packs (licences not verified): https://jellytempo.itch.io/2d-pixel-art-rain-effect ; https://phdev2024.itch.io/raindrop-splash-effect ; https://ian926.itch.io/pixel-art-puddles ; https://avosgrosimbourg.itch.io/weather-pack-pixel-art-16x16

**Tiny code and demoscene**
163. Canvas Cycle repo (palette.js, README): https://github.com/jhuckaby/canvascycle
164. Canvas Cycle scene list and demo: http://www.effectgames.com/demos/canvascycle/scenes.js ; http://www.effectgames.com/demos/canvascycle/
165. Living Worlds scene list and demo: http://www.effectgames.com/demos/worlds/scenes.js ; http://www.effectgames.com/demos/worlds/
166. Q&A with Mark J. Ferrari (mirror): https://dcmpx.remotevs.com/com/effectgames/www/PL/effect/article-Q_A_with_Mark_J_Ferrari.html
167. Canvas Cycle (Google Experiments): https://experiments.withgoogle.com/canvas-cycle
168. The Watchmaker water (ScummVM): https://github.com/scummvm/scummvm/blob/master/engines/watchmaker/3d/geometry.cpp
169. TortoiseGit WaterEffect: https://github.com/TortoiseGit/TortoiseGit/blob/master/src/Utils/MiscUI/WaterEffect.cpp
170. Hugo Elias, 2D Water (archived; blocked in our session): https://web.archive.org/web/20160418004149/http://freespace.virgin.net/hugo.elias/graphics/x_water.htm
171. Matyka, 2D water algorithm: https://maciejmatyka.blogspot.com/2018/03/2d-water-algorithm.html
172. Khronos forum, Water ripple calculation: https://community.khronos.org/t/water-ripple-calculation/28789
173. al-ro, Ripple: https://al-ro.github.io/projects/ripple/
174. Nokola, Realistic water ripples sample: https://learn.microsoft.com/en-us/archive/blogs/nikola/building-the-reallistic-water-ripples-sample-in-silverlight
175. OpenMW ripple tweak commit: https://git.cijber.net/mirror/openmw/commit/c1a9294e179514ac242b35fc734c8f16c8cc3724
176. Krazydad, Lightning Generator: https://krazydad.com/bestiary/bestiary_lightning.html
177. Tuts+, 2D lightning effects: https://code.tutsplus.com/so-erzeugen-sie-schockierend-gute-2d-blitzeffekte--gamedev-2681t
178. Wikipedia, Bresenham's line algorithm: https://en.wikipedia.org/wiki/Bresenham%27s_line_algorithm
179. Lexaloffle, "Rain Gif" (packbat): https://www.lexaloffle.com/bbs/?pid=70456
180. Lexaloffle, "Gentle Rain" (dw817): https://www.lexaloffle.com/bbs/?pid=114301 ; older cart https://www.lexaloffle.com/bbs/?tid=27743
181. Lexaloffle, "Rainy Day" / rain2: https://www.lexaloffle.com/bbs/?pid=61845
182. Lexaloffle, "Pico Ripples" (luchak): https://www.lexaloffle.com/bbs/?pid=143568 ; https://luchak.itch.io/tiny-drops
183. Lexaloffle, "In the rain", "Rain Arcade", titles only: https://www.lexaloffle.com/bbs/?tid=55526 ; https://www.lexaloffle.com/bbs/?pid=137926 ; https://www.lexaloffle.com/bbs/?pid=17680 ; https://www.lexaloffle.com/bbs/?tid=2803
184. pouet.net rain prods: https://www.pouet.net/search.php?what=rain&type=prod ; https://www.pouet.net/prod.php?which=63272 ; https://www.pouet.net/prod.php?which=103600 ; https://www.pouet.net/prod.php?which=30517 ; https://www.pouet.net/prod.php?which=67276 ; https://www.pouet.net/prod.php?which=1086
185. Dwitter rain hashtag (not parsed): https://www.dwitter.net/h/rain

**2025–2026 games and news**
186. PlayStation Blog, Ghost of Yōtei tech: https://blog.playstation.com/?p=411201
187. GamesRadar, Ghost of Yōtei art director: https://www.gamesradar.com/games/open-world/ghost-of-yoteis-art-director-wanted-the-rpg-to-look-like-a-living-painting-but-the-detail-required-stresses-even-me-out-when-the-wind-blows-the-trees-know-how-strong-the-wind-is
188. GDC 2026, Borderlands 4 weather: https://schedule.gdconf.com/session/the-dynamic-weather-systems-of-borderlands-4-how-they-can-apply-to-games-without-dynamic-weather/917367
189. GamingBolt, Death Stranding 2 analysis: https://gamingbolt.com/death-stranding-2-on-the-beach-graphical-analysis-a-new-dawn-for-decima
190. GamingTrend, rain98 preview: https://gamingtrend.com/previews/rain98-so-far-is-a-masterclass-in-atmosphere/
191. Octopath Traveler 0 date: https://gameinformer.com/nintendo-partner-direct/2025/07/31/octopath-traveler-0-is-coming-this-december ; https://onemoregame.ph/2025/07/octopath-traveler-0-coming-december-4/
192. Silksong, Bilewater: https://hollowknight.wiki/w/Bilewater ; https://www.gamesradar.com/games/action/team-cherry-finally-answers-to-the-crimes-of-silksongs-bilewater-we-just-love-a-big-swamp-we-wanted-some-kind-of-poison-status-for-ages
193. Witchbrook dates: https://gameinformer.com/2026/10/28/cozy-magical-sim-witchbrook-gets-a-january-release-date ; https://www.pcgamer.com/games/rpg/witchbrook-is-delayed-again-now-set-for-release-in-2027/
194. Mina the Hollower release: https://www.digitalcitizen.life/mina-the-hollower-is-now-out-on-xbox-pc-playstation-and-switch-after-beating-forza-horizon-6-on-metacritic/
195. Pixel-art guide collections (saint11 content not reached): https://80.lv/articles/an-ultimate-collection-of-pixel-art-guides ; https://opengameart.org/forumtopic/pixel-art-tutorials-by-sadfacerl
