# 03 — Systems / grid / per-cell techniques for RAIN (top-down pixel art)

Researcher angle: tiny per-cell rules + real-world numbers to tune them. Target: Godot 4 Compatibility (WebGL2), CPU-side JS demos, GDScript.
Convention: **[C]** = cited finding (URL given), **[I]** = my inference / derivation, **[M]** = from memory, not re-verified this session (treat as unverified).

---

## 1. Real meteorology to tune intensity tiers

### Takeaway
Use 5 tiers keyed to rain rate R (mm/h): **drizzle (<0.5 mm drops, slow, misty) / light ≤2.5 / moderate 2.6–7.6 / heavy 7.6–50 / violent >50**. Going up a tier should change *drop size, fall speed and streak length* as much as *count*: physical drop flux only rises ~3.7× from light to violent rain, while median drop size roughly doubles.

### Cited findings
- AMS Glossary "Rain": light = trace–2.5 mm/h (≤0.25 mm per 6 min); moderate = 2.6–7.6 mm/h (≤0.76 mm per 6 min); heavy = >7.6 mm/h. Rain drops "diameters greater than 0.5 mm"; drizzle is <0.5 mm, far more numerous, and reduces visibility more than light rain. [C] https://glossarystaging.ametsoc.net/wiki/Rain
- AMS Glossary "Drizzle drop": diameter 0.2–0.5 mm; usually falls from low stratus/stratocumulus. [C] https://glossarysandbox.ametsoc.net/wiki/Drizzle_drop
- Violent tier: MANOBS-based table lists heavy 7.6–50 mm/h and violent >50 mm/h. [C] https://barani.squarespace.com/faq-articles/2020/1/19/rain-rate-intensity-classification (vendor FAQ page; the Met Office uses the same 50 mm/h "violent" cut — [M], could not fetch a Met Office page; the Met Office search results were only warning pages).
- Drop size vs fall speed (vendor FAQ, Barani): drizzle 0.2–0.5 mm falls 0.7–2 m/s; measurable rain 0.6–4 mm falls 2–9 m/s; large drops >4–5 mm ≈ 9 m/s (rarely up to 13 m/s); 8 mm drop ≈ 2 ml in torrential rain. [C] https://barani.squarespace.com/faq-articles/2020/1/19/rain-drop-size-and-speed-of-a-falling-rain-drop
- Marshall–Palmer DSD: N(D) = N0·exp(−Λ·D), N0 = 8000 m⁻³ mm⁻¹, Λ = 4.1·R^−0.21 mm⁻¹; drops cannot exceed ≈10 mm (break up). [C] https://en.wikipedia.org/wiki/Raindrop_size_distribution
- Gunn & Kinzer (1949) "Terminal Velocity of Fall for Water Droplets in Stagnant Air" is the classic measurement (citation index only; table not fetched). [C] https://scilit.com/publications/dd7455b0bcef8a70e2d69d80e3b70248 — values widely quoted: ~4.0 m/s @1 mm, ~6.5 @2 mm, ~8.1 @3 mm, ~9.1 @5 mm, max ~9.17 m/s near 5.8 mm. [M]
- Gust factor (peak gust / sustained) mean 1.29 (SD 0.077, 67 storm samples, marine/coastal buoys); recommended 1.3. [C] https://vos.noaa.gov/MWL/fall_02/Gust.pdf
- Lightning frequency categories (NWS Tallahassee): occasional <3 strikes/min (<45/15 min); frequent 3–6/min; nearly continuous 6–8/min; continuous >8/min. [C] https://www.weather.gov/tae/ghwo_lightning

### Derived numbers (my computation) [I]
Fall-speed fit used: v(D) = 9.65 − 10.3·e^(−0.6·D) m/s (Atlas, Srivastava & Sekhon 1973 fit to Gunn–Kinzer [M]); gives 2.0 @0.5 mm, 4.0 @1, 6.55 @2, 7.95 @3, 8.72 @4, 9.14 @5 — matches Barani ranges above.
Integrating Marshall–Palmer (D = 0.1–6 mm) × v(D):

| R (mm/h) | tier | median-volume D0 ≈ 3.67/Λ | drops in air /m³ | drops hitting ground /m²/s | of which ≥0.5 mm |
|---|---|---|---|---|---|
| 0.5 | drizzle-ish | 0.77 mm | ~1,050 | ~1,100 | ~450 |
| 2.5 | light (top) | 1.09 mm | ~1,700 | ~2,400 | ~1,400 |
| 7.6 | moderate (top) | 1.37 mm | ~2,300 | ~3,900 | ~2,700 |
| 25 | heavy | 1.76 mm | ~3,100 | ~6,600 | ~5,000 |
| 50 | violent cut | 2.04 mm | ~3,700 | ~8,800 | ~7,100 |
| 100 | cloudburst | 2.35 mm | ~4,400 | ~11,600 | ~9,700 |

(MP is known to over-count small drops; numbers are order-of-magnitude.)
- **Game translation:** real counts are thousands per m²/s — impossible and unreadable at pixel scale. Render a *visual* sample ≈ 1/200–1/2000 of reality, but keep the **ratio** between tiers: if light = 1×, moderate ≈ 1.6×, heavy ≈ 2.8×, violent ≈ 3.7× drop count — and raise drop length/brightness with D0 (≈1.1 → 2 mm, fall speed ≈4.5 → 7 m/s). Drizzle = many tiny, slow, low-contrast specks + haze, no streaks, almost no splashes (drops < 0.5 mm barely splash — [I]).
- 1 mm/h = 1 litre per m² per hour (definition) → a 32×32 px tile = 1 m² gets 7.6 L/h in moderate-top rain; useful for puddle budgets.
- **Wind slant:** tan θ = u_wind / v_fall (θ from vertical) [I, kinematics]. With typical 2 mm drop (6.5 m/s): 1 m/s → 9°, 3 m/s → 25°, 5 m/s → 38°, 10 m/s → 57°, 15 m/s → 67°. Drizzle (2 m/s) is blown almost flat: 3 m/s wind → 56°. ⇒ in-game: drizzle drifts sideways, big drops stay steeper — a cheap way to sell "two kinds of rain" in one wind.
- Gusts: wind(t) = mean·(1 + 0.3·g(t)), g ∈ [0,1] from smoothed noise (peak ≈ 1.3× mean per NOAA gust factor). Gust duration not found — use 2–6 s envelopes [I].
- Top-down note: in a top-down projection, "falling" is mostly along screen −Y (pseudo-perspective) or along a z-axis; slant is shown as a screen-space X offset per unit of z. Use θ to set dx/dz.

### Gaps
- No official Met Office/WMO table fetched (search returned only warnings pages). Gust duration statistics not found. Gunn–Kinzer table not directly fetched.

---

## 2. Wetting & drying of materials — real numbers

### Takeaway
Water that cannot infiltrate stands: puddles form when **rain rate > infiltration rate of the material** — on **clay/compacted dirt paths (1–5 mm/h)** even moderate rain ponds; on **sand (>30 mm/h, see note)** only violent rain ponds; grass/loam (10–20 mm/h) ponds only in heavy rain. Drying of open water is slow in reality (2–7 mm/day), so game time must compress it (~100–1000×).

### Cited findings
- FAO basic infiltration rates (mm/h): sand <30 [sic — FAO table says "less than 30", widely read as ">30"]; sandy loam 20–30; loam 10–20; clay loam 5–10; clay 1–5. Rate starts high in dry soil and falls to the basic rate as pores fill. [C] https://www.fao.org/3/s8684e/s8684e0a.htm
- Open-water evaporation (Class A pan; pond ≈ 0.8×pan): Maine ~1.9–2.5 mm/day; Florida ~4.4–5.3; S. California desert ~8.2; Alabama January ~0.8, June ~6.6; hot windy day >20 mm/day. Wind removes saturated air; at 100% RH net evaporation stops. [C] https://www.globalseafood.org/advocate/evaporation-affected-by-sunlight-temperature-wind/
- Lagarde (Remember Me, via fxguide): low-albedo, rough, **porous** materials darken most when wet; non-linear (biggest change at mid albedo); thin water film → sharper, brighter highlight; water collects in low spots first; ripples appear only where enough water accumulated and their count scales with rain intensity; **drying is non-homogeneous — specular vanishes faster than the darkening** (surface stays darker after shine is gone); drying depends on sun, air temperature, wind, gravity, distance from dry material. Older asphalt model: diffuse ×0.1–0.3, specular ×5–10. [C] https://www.fxguide.com/?p=43362
- Don't Starve (RoG) wetness: tree canopy reduces wetness gain by 35%; at 35 wetness tools get slippery, worn items drain sanity (6/min each, stacking), player starts to freeze; max wetness = −30° perceived temperature; heat source speeds drying; waterproofness table (umbrella 90%, rain hat 70%, most hats 20%, cumulative; ≥100% → wetness falls); wet mobs take electric 2.5× instead of 1.5×; soggy food spoils 30% faster; waterlogged fuel burns 75% duration. [C] https://dontstarve.wiki.gg/wiki/Wetness

### Inferences: per-material table for the grid (tune values, game-time units) [I]
| material | absorb cap (wetness units) | infiltration (per s game) | dry rate (sun) | wet look | puddles? |
|---|---|---|---|---|---|
| sand | high | very high (≈sand >30 mm/h) | fast | darken 1 palette step, no shine | violent rain only |
| grass | med | high (loam 10–20) | med | darker + "glint" pixels on blades | heavy+ in hollows |
| dirt path (compacted) | med | low (clay 1–5) | slow | → MUD state at high wetness | yes, ruts first |
| cobble/stone | low (porous stone small) | ~0 except cracks | fast on top, cracks slow | darken + specular pixel; shine dries first | in joints/hollows |
| wood (planks) | med | 0 | med | darken grain, slow | no (runs off gaps) |
| cloth/awning | high | 0 (drips) | slow | darken, sag drip line | no |
| metal | 0 | 0 | very fast | shine only, beads | no |
| roof tiles | 0 | 0 → runoff to eaves | fast | shine | no (feeds dripline) |
Drying order rule from Lagarde: render two separate values — `shine` (decays fast, ~3× rate) and `dark` (decays slow).
Real-to-game: 5 mm puddle at 5 mm/day ≈ 1 day real; compress so it lasts 2–5 in-game minutes after rain stops (≈ 300–700× speed-up).

### Gaps
- No good source on drying times of non-porous pavement (SWOV page blocked by Cloudflare; FHWA water-film reports not fetched).

---

## 3. Grid models (pseudocode + costs)

Grid resolution choice: per **pixel** of a 320×180 view = 57,600 cells; per **2×2 px** = 14,400; per **tile** (16 px) = 20×12 = 240. [I] For GDScript, run water/wetness at 1/4–1/16 resolution (or tile level) and upsample with dither; for JS/canvas a full-res Uint8Array stencil is fine.

### 3a. Wetness map (per cell, u8 0–255) [I, design; reuses SNOW exposure mask]
```
// exposure[c] in 0..1 precomputed: 0 under roof/canopy, partial in lee (see §5)
every sim tick (e.g. 10 Hz):
  for c in cells:
    m = material[c]
    gain = rainRate * exposure[c] * ABSORB[m]            // rainRate = tier value
    dry  = DRY[m] * sun * (1 + windSpeed*0.3) * (1 - shade[c]) * (rainRate==0 ? 1 : 0.1)
    wet[c]   = clamp(wet[c] + gain - dry, 0, CAP[m])
    shine[c] = clamp(shine[c] + gain*2 - dry*3, 0, 255)   // shine dries ~3x faster (Lagarde)
render: palette index = base[c] + DARKSTEP[m] * (wet[c] > dither(x,y)*CAP[m]) ; specular pixel if shine[c] > threshold & hash(x,y,t) sparkle
```
- Cost: 2–3 adds/mults per cell; at 57.6k cells & 10 Hz → ~0.6M ops/s; JS ≈ <0.2 ms per tick [I, unbenchmarked]. Dither threshold reuses snow study's "depth byte + dither" idea.
- Dirt → **mud** state: `if material==DIRT && wet>MUD_T: state=MUD` with hysteresis (enter at 70%, leave at 40%) to avoid flicker. Mud: slower move speed, footprints deepen (conserve-and-displace from snow study).

### 3b. Water depth map with flow + infiltration (reuse ACID flow) [I]
```
h[c] = water depth (u8 or f32), z[c] = ground height (ruts, hollows authored or noise)
tick:
  for c: h[c] += rainRate * exposure[c] * K + roofRunoff[c]      // source
  for c: h[c] -= min(h[c], INFIL[material[c]] * (1 - satur[c]))  // sink: clay small, sand big
         satur[c] += infiltrated / CAPACITY                      // soil saturates → less infiltration (FAO: rate falls as pores fill)
  for c with h[c] > FILM[material]:                              // film threshold from ACID study
     for each lower neighbour n (z+h smaller):
        flow = (z[c]+h[c] - z[n]-h[n]) * 0.25 ; flow = min(flow, h[c]-FILM)
        h[c]-=flow; h[n]+=flow
  for c: h[c] -= EVAP * sun * wind_factor   (only when not raining)
render: puddle if h>P1 (dark water palette + reflection pixels); ripple mask = h>P2
```
- Puddles then appear naturally in **ruts and depressions on dirt/clay**, not on sand/grass, because infiltration eats the source there (FAO rates). Saturation makes puddles grow later in long storms — feels "real".
- Cost: 4 neighbours per wet cell; only iterate an active list of cells with h>0 (ACID trick) → cost ∝ wet area.

### 3c. Wet footprints carried onto dry floor [I]
```
entity.wetFeet = max(entity.wetFeet*0.97, wet[cellUnderFeet])  // picks up from puddle/mud
on step: if entity.wetFeet > 20 and cell is dry floor:
   stampFootprint(cell, alpha = wetFeet)  // writes into wet[] of that floor → dries via 3a automatically
   entity.wetFeet *= 0.8                     // ~5–8 prints before trail fades
```
Mud: stamp colour (brown) into a decal layer, not just wet — persists until rain washes (`decal -= rainRate*exposure`).

### 3d. Dripline under eaves (roof catchment → drip rate) [I]
- Precompute per roof tile its downhill eave edge cell. Catchment area A (tiles) draining to that eave edge segment of length L. Drip rate per eave cell ∝ rainRate × A / L. Real scale: 1 m² of roof at 7.6 mm/h = 7.6 L/h ≈ 2 ml/s → ~40 drops/s of 0.05 ml (2.3 mm drops) [I, using Barani 0.05 ml standard drop].
- Render: drop sprites spawn along eave line at that rate; splash + wetness only along a 1-px "drip trench" line; continues **after rain stops** with exponential decay τ ≈ 20–60 s game (roof drains) — great "after-rain" life. Same for tree canopies (store canopy water; after rain, drip under trees decays).

---

## 4. Ripple simulation on water/puddle masks

### Takeaway
Two options: (a) **Hugo Elias 2-buffer height field** — physically lovely interference, cost ∝ cells, needs refraction/shade render; (b) **ring-sprite pool** — each drop = expanding 1-px palette circle, cost ∝ active ripples, reads perfectly at pixel scale. For low-res pixel art, (b) usually looks *cleaner*; use (a) only on big ponds/fountains or at half res.

### Cited findings
- Elias algorithm (as reproduced by Nokola, MS blog): `B2[x,y] = (B1[x-1,y]+B1[x+1,y]+B1[x,y+1]+B1[x,y-1])/2 − B2[x,y]; B2 *= damping; swap`, damping **0.94** used; rendering: `Xoff = b[x-1,y]-b[x+1,y]; Yoff = b[x,y-1]-b[x,y+1]; shading=(Xoff−Yoff)/2; colour = texture[x+Xoff, y+Yoff] + shading`; their sample adds one random rain splash per 60 ms loop. [C] https://learn.microsoft.com/en-us/archive/blogs/nikola/building-the-reallistic-water-ripples-sample-in-silverlight
- Maciej Matyka JS reimplementation (2018): same rule, damping "between 0-1"; seeding a single pixel looks poor → seed 3×3 block; optional smoothing pass. [C] https://maciejmatyka.blogspot.com/2018/03/2d-water-algorithm.html
- Original Hugo Elias page (freespace.virgin.net/hugo.elias/graphics/x_water.htm) — archive URL not on allowlist; not fetched.
- ATI ToyShop (2006): **one 256×256 ripple sim for the whole environment**, raindrops rendered as points with damped-sine seed weighted by drop mass, Euler integration in 2 feedback passes, Sobel → normals, puddle depth mask; **5–8k splash particles/frame**, **10–15k drop particles** per effect; full-screen scrolling rain layers from an 8-bit rainfall texture. [C] https://advances.realtimerendering.com/s2006/Chapter3-Artist-Directable_Real-Time_Rain_Rendering_in_City_Environments.pdf
- OpenMW ripple shader tweak: wave coefficient 0.14→0.28, damping 0.02→0.04 ("tweak to look most like water, not physically accurate"). [C] https://git.cijber.net/mirror/openmw/commit/c1a9294e179514ac242b35fc734c8f16c8cc3724

### Pseudocode
**(a) Elias, driven by rain, masked** [I + C]
```
// int16 buffers, size W×H of water area (e.g. 128×72 at half res)
each frame:
  n = poisson(RIPPLES_PER_CELL_PER_S[tier] * waterCells * dt)
  repeat n: pick random cell c with mask[c] (puddle/pond, h>P2, exposure>0): B1[c] -= IMPULSE[tier]  (3×3 plus for big drops)
  for c in mask cells: B2[c] = ((B1[l]+B1[r]+B1[u]+B1[d]) >> 1) - B2[c]; B2[c] -= B2[c] >> 5   // damping 31/32≈0.97
  boundary: non-mask neighbour = 0 (reflects at puddle edge)
  swap
render (pixel art): slope = B1[l]-B1[r] + B1[u]-B1[d];  idx = slope > T ? HIGHLIGHT : slope < -T ? SHADOW : WATER  (3-colour quantise instead of refraction)
```
Damping guide: 0.94 (short, choppy, puddles) → 0.97 (int `>>5`) → 0.99 (long rings, ponds) [I].
Cost: ~6 int ops/cell; 128×72 = 9.2k cells → trivial in JS (<0.1 ms [I]); GDScript loop at that size ≈ several ms [I, unbenchmarked] → do it in a fragment shader ping-pong (two SubViewports) in Compatibility renderer, or keep CPU sim tiny.

**(b) Ring pool** [I]
```
ripples = ring buffer [MAX=64..256] of {x,y,t0,rMax}
spawn: same Poisson rate on water mask; rMax = 2..6 px by tier/drop size
draw: r = rMax * (age/life)^0.6 ; colour = palette ramp by age (light → water) ; draw 1-px midpoint circle, skip pixels outside mask
      optional 2nd inner ring at 0.5 r for heavy drops; life 0.3–0.6 s
```
Cost: ∝ Σ circumference ≈ 2πr ≈ 6–40 px per ripple; 200 ripples ≈ 4k px writes/frame. No interference, but pixel-perfect and palette-locked.
Visible-rate suggestion (per 1 m² of open water per s, NOT physical): drizzle 0.3 (tiny 1-px dimples), light 1, moderate 3, heavy 8, violent 15 + global "roughness" noise flicker. Real flux is 1,000–10,000/m²/s (§1) — at violent rates real water looks like uniform chop, so switch from discrete rings to a dithered "roughness" texture overlay above heavy [I].

---

## 5. Rain shadow / exposure with wind; rain curtains

### Takeaway
Exposure = 1 − occlusion along the **upwind-tilted** fall direction. Precompute once per wind bucket (like the snow study's lee rays), re-blend when wind changes. Curtains = drop density × scrolling low-frequency noise advected with wind.

### Pseudocode [I; method mirrors SNOW study]
```
dir = (sin θ * windDirX, sin θ * windDirY) per unit fall height, θ from §1 (tan θ = u / v_fall)
for each cell c:
  occl = 0
  for k in 1..K (K = maxObstacleHeight/step):
     p = c - dir * k*step          // walk upwind
     if heightmap[p] (roof/canopy/wall top) >= k*step: occl = canopyOpacity[p]; break
  exposure[c] = 1 - occl
```
- Roofs: exposure 0 under roof footprint; canopies: partial (Don't Starve tree = −35% gain [C] https://dontstarve.wiki.gg/wiki/Wetness) → use 0.65 under trees.
- With wind, the dry patch shifts **downwind** of walls by height·tan θ: a 3 m wall at 5 m/s (θ≈38°) shelters ~2.3 m (~2 tiles) on its lee side [I].
- Cost: K steps per cell, only on wind-bucket change (8 directions × 4 strengths cached) → zero per-frame cost.
- **Curtains/sheets:** `spawnProb(x,y,t) = base * (0.5 + 0.5 * noise2D((x - wind.x*t*S)/L, (y - wind.y*t*S)/L))^p`, L ≈ 4–10 tiles, p 1–3 (higher = sharper sheets); couple gust envelope to the same noise so a gust visibly "sweeps" through. Cost: one value-noise lookup per spawned drop (or a 32×32 precomputed tiling noise texture sampled with offset).

### Gaps
- No published game example of upwind-ray rain shadow found this session (snow study had sources for snow).

---

## 6. Splash particle rules (per surface)

### Cited findings
- ToyShop: 5–8k splash particles/frame from one filmed milk-drop sequence; randomised size/alpha, horizontally flipped per particle. [C] ToyShop PDF above.
- Lagarde: ripples only where water has accumulated, count ∝ intensity. [C] fxguide above.

### Inferred rule table (visible counts per 1 m² per s, tune) [I]
| surface | splash type (pixel) | frames / life | count rule |
|---|---|---|---|
| deep water / puddle | ring (§4b) + occasional 1-px upward "jet" for big drops | 0.3–0.6 s | 1/3/8/15 by tier |
| stone, wood, metal, roof | crown: 2–4 droplets thrown radially 2–4 px with tiny gravity arc | 0.15–0.25 s (3–4 frames @15 fps) | 1/2/5/10 |
| grass | no crown; 1-frame "mist" speck or blade flick | 0.1 s | 0.5/1/3/6 |
| dirt/mud | flat brown 2–3 px splat that leaves a dark dot in wet[] | 0.2 s + decal | 1/2/5/10 |
| sand | pock-mark dot (darken 1 px) only | decal | as dirt |
| drizzle tier | no splashes at all, only wetness | — | 0 |
Implementation: on drop "landing" (z=0) look up material[c] → splash type; or decouple entirely: splashes are spawned at random exposed screen cells at the tier rate, independent of drawn drops (cheaper; players don't track individual drops) [I].

---

## 7. Fire, electricity, slipperiness — gameplay rules

### Cited findings
- Minecraft: rain falling on the fire or its 4 neighbours → each block tick **20% + 3%·age** chance to extinguish (20–65%); rain hydrates farmland, more fish, sky light down to 12; rain sound audible within 16 blocks. [C] https://minecraft.fandom.com/wiki/Fire , https://minecraft.fandom.com/wiki/Weather
- BotW: rain makes climbing surfaces slick (periodic slip); rain extinguishes exposed fires, sheltered fires unaffected. [C] https://zelda.fandom.com/wiki/Rain
- Divinity: Original Sin 2 "Rain" skill: spreading water surface that douses fires; Wet status; Shocked + wet → Stunned; Chilled + wet → Frozen; reveals invisible. [C] https://divinityoriginalsin2.wiki.fextralife.com/Rain
- Don't Starve: wet mobs take 2.5× (vs 1.5×) electric damage; waterlogged fuel burns 75%; slippery tools at wetness ≥35 (drop chance not given). [C] https://dontstarve.wiki.gg/wiki/Wetness
- Walking-surface friction: OSHA recommends static COF ≥0.5; Access Board 0.6 for accessible routes, 0.8 ramps; ADA values are dry-only. No wet stone values given. [C] https://www.stoneworld.com/articles/83570-what-is-coefficient-of-friction

### Rules [I]
```
fire[c].intensity -= EXT_RATE * rainRate * exposure[c] * dt ; if extinguished-by-rain: spawn steam puff (fumes grid from ACID study, white palette, rises/drifts with wind)
fire spread chance *= (1 - wet[target]/CAP)        // wet fuel resists ignition; Don't Starve: wet fuel burns 75%
steam: steam[c] += k * fire[c] * rainRate * exposure[c]
electric: on lightning/shock at c: flood-fill through cells with h>FILM (puddle network, max N cells), stun entities with wetness>T
friction: accel/decel multiplier = 1.0 dry; 0.8 wet stone/wood; 0.6 mud; 0.5 metal/wet tile; ice n/a  → top-down "slide" = keep 1 - μ of velocity per frame
stealth: rain masks footsteps: hearRadius *= (1 - 0.5*tierNorm); visibility radius *= (1 - 0.3*tierNorm) (drizzle hurts visibility more than light rain per AMS)
lightning scheduler: poisson with rate from NWS categories (storm: 1–3 /min "occasional" on-screen; climax 6/min) ; flash = palette brighten 2–3 frames then 1 dim frame; thunder delay = distance / 343 m/s
```

---

## 8. Fog/mist interaction rules

### Cited findings
- AMS: drizzle reduces visibility more than light rain. [C] https://glossarystaging.ametsoc.net/wiki/Rain
- ToyShop: rain mistiness via blurred post-process + Kawase bloom at 1/16 area; linear distance fog; "rain halos" around object edges. [C] ToyShop PDF.

### Rules [I]
```
spray mist (during rain):  mist[c] += a * rainRate^1.2 * hardSurface(material[c]) * exposure[c] ; decay 2–4 s; advect with wind
   → visible as a low 1–2 px dither haze hugging roads/roofs, absent on grass; strongest in violent tier (splash spray)
post-rain evaporation mist: mist[c] += b * wet[c] * sunWarmth * (1 - windSpeed/WMAX) when rainRate==0 ; rises (z) and fades
   → morning sun after rain: wispy steam off cobbles/roofs; wind kills it
rain clearing fog: fogDensity -= c * rainRate (wash-out) except drizzle tier, which ADDS haze (AMS)
```
Store mist on the same coarse grid as the ACID fumes (tile or 4×4 px), render with ordered dither in 1–2 palette shades.

---

## 9. Performance notes

- ToyShop budget reference (GPU, 2006): 256×256 ripple sim, 5–8k splashes + 10–15k drops; no ms figures published. [C]
- Godot 2D particles doc page could not be read (fetch returned nav only); Compatibility renderer GPUParticles support: see https://godotengine.org/article/improvements-gpuparticles-godot-40 (not fetched) and a forum report of CPUParticles2D not running in HTML5 builds: https://forum.godotengine.org/t/cpuparticles2d-is-not-running-on-html5-builds/78273 (not fetched — verify).
- [I, unbenchmarked]: JS typed-array stencil ≈ 1–3 ns/cell → 57.6k-cell full-res wetness or ripple pass ≈ 0.1–0.2 ms. GDScript per-cell loops are typically 10–50× slower than JS → run at tile/coarse res, use `PackedByteArray` + `Image.set_data` upload once per sim tick (5–10 Hz), or move ripple/wetness to a ping-pong shader on SubViewports. Drops: draw with one MultiMeshInstance2D or a single `_draw()` of lines (300–1500 visible drops at 320×180 is plenty).
- Visible drop budget suggestion at 320×180 (≈ 20×11 tiles of 1 m²): light 150, moderate 250, heavy 450, violent 600 (ratio from §1), each drop = 1×(2–6) px line whose length = v_fall·frame_dt·scale [I].

---

## Gaps (honest)
- Original Hugo Elias page, Minecraft.wiki, Don't Starve fandom, Met Office, SWOV, Godot docs body: blocked or empty. Two fetches failed with tool errors (blogspot Gunn–Kinzer table; Purdue wind-rain angle PDF).
- No measured CPU timings for GDScript/JS grid loops this session — all timing numbers are estimates.
- No source for game slip/friction numbers on wet stone; none for real wet-pavement drying times.
- No game source for roof-catchment dripline or upwind rain shadow (design inferences).

## Sources
- AMS Glossary, Rain: https://glossarystaging.ametsoc.net/wiki/Rain
- AMS Glossary, Drizzle drop: https://glossarysandbox.ametsoc.net/wiki/Drizzle_drop
- Barani, rain rate classification (vendor): https://barani.squarespace.com/faq-articles/2020/1/19/rain-rate-intensity-classification
- Barani, drop size & speed (vendor): https://barani.squarespace.com/faq-articles/2020/1/19/rain-drop-size-and-speed-of-a-falling-rain-drop
- Raindrop size distribution (Marshall–Palmer): https://en.wikipedia.org/wiki/Raindrop_size_distribution
- Gunn & Kinzer 1949 citation: https://scilit.com/publications/dd7455b0bcef8a70e2d69d80e3b70248
- NOAA VOS gust factor: https://vos.noaa.gov/MWL/fall_02/Gust.pdf
- NWS lightning frequency categories: https://www.weather.gov/tae/ghwo_lightning
- FAO infiltration rates: https://www.fao.org/3/s8684e/s8684e0a.htm
- Evaporation rates (Global Seafood Alliance): https://www.globalseafood.org/advocate/evaporation-affected-by-sunlight-temperature-wind/
- fxguide, Lagarde wet environments: https://www.fxguide.com/?p=43362
- ATI ToyShop rain (SIGGRAPH 2006): https://advances.realtimerendering.com/s2006/Chapter3-Artist-Directable_Real-Time_Rain_Rendering_in_City_Environments.pdf
- Nokola / Hugo Elias water ripples: https://learn.microsoft.com/en-us/archive/blogs/nikola/building-the-reallistic-water-ripples-sample-in-silverlight
- Matyka 2D water: https://maciejmatyka.blogspot.com/2018/03/2d-water-algorithm.html
- OpenMW ripple tweaks: https://git.cijber.net/mirror/openmw/commit/c1a9294e179514ac242b35fc734c8f16c8cc3724
- Don't Starve wetness: https://dontstarve.wiki.gg/wiki/Wetness
- Zelda BotW rain: https://zelda.fandom.com/wiki/Rain
- DOS2 Rain: https://divinityoriginalsin2.wiki.fextralife.com/Rain
- Minecraft Fire / Weather: https://minecraft.fandom.com/wiki/Fire , https://minecraft.fandom.com/wiki/Weather
- Stone World COF: https://www.stoneworld.com/articles/83570-what-is-coefficient-of-friction
- (not fetched, to verify) Godot GPUParticles 4.0: https://godotengine.org/article/improvements-gpuparticles-godot-40 ; HTML5 CPUParticles2D forum: https://forum.godotengine.org/t/cpuparticles2d-is-not-running-on-html5-builds/78273
