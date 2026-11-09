# 04 — Academic & rare publications + real-world physics/perception of light (for study #5 LIGHT & SHADOWS)

Researcher angle: verified papers, classic algorithms, physics and perception numbers. For each one: year, venue, URL/DOI, core idea, numbers, cheapest pixel approximation, what to steal.
Tool notes: albertford.com and adammil.net were blocked for WebFetch, so I read them with curl (OK). iquilezles.org came through on the second try. The Gurney "warm below cold above" page returned an empty body.
Labels: **[C]** = cited finding (URL given). **[I]** = my inference or design proposal.

---

## Q1. Classic shadow algorithms (Crow 1977, Williams 1978, Blinn 1988): what can a 2D top-down game take from them?

**Takeaway:** All three ideas still drive 2D lighting. Crow's shadow volume becomes "extrude the occluder edges away from the light into a quad" (Godot LightOccluder2D / ShadowCaster2D do this). Williams' shadow map becomes the "1D polar shadow map": per light, the distance to the nearest occluder at each angle. Blinn's fake shadow becomes "squash the sprite onto the ground plane". For a top-down pixel game, Blinn's projection gives the most look per cost for sun shadows.

**Cited findings**
- **Crow 1977** [C]: "Shadow algorithms for computer graphics", Franklin C. Crow, SIGGRAPH '77 (San Jose, July 20–22 1977), pp. 242–248, DOI 10.1145/563858.563901. https://researchr.org/publication/Crow77-1/bibtex ; listed as Proc. SIGGRAPH vol. 11 in https://userpages.cs.umbc.edu/olano/s2000c27/biblio.pdf . Course handout: https://my.eng.utah.edu/~cs5610/handouts/crows%20shadow%20volumes.pdf . This is the origin of shadow volumes.
- **Williams 1978** [C]: "Casting curved shadows on curved surfaces", Lance Williams, Proc. SIGGRAPH vol. 12, pp. 270–274, Aug 1978 (UMBC biblio above). DOI 10.1145/800248.807402 (from the springerprofessional DOI URL https://www.springerprofessional.de/doi/10.1145/800248.807402). Abstract (https://history.siggraph.org/?p=120268): it uses a Z-buffer visible-surface pass from the light's view to shadow curved patches. It contrasts this with a cheaper method for shadows on a single ground plane, and discusses dither, interpolation and quantization artefacts.
- **Blinn 1988** [C]: "Me and my (fake) shadow", Jim Blinn, IEEE CG&A vol. 8 no. 1 (Jan 1988), pp. 82–86 (UMBC biblio above). This is the planar projected shadow: a matrix flattens the object onto the ground plane along the light direction and draws it dark.

**Inferences: cheapest pixel approximations & what to steal**
- [I] **Blinn → sprite shadow skew.** Draw each sprite's silhouette again in one shadow colour. Scale it vertically by `L = h/tan(elev)` relative to sprite height (see Q8) and skew it along the sun azimuth. Cost: one extra sprite draw, or a shader that offsets UVs. Clamp L to about 3× sprite height at low sun, otherwise it looks wrong at tile scale. Alternative: pre-bake 8 directions × 3 lengths.
- [I] **Crow → 2D shadow quads.** For each occluder edge facing away from the light, extrude both endpoints by `(p - light) * big` and fill the quad. This is what Godot PointLight2D + LightOccluder2D does. Cost grows with edges × lights, so keep occluder polygons to 4–8 verts.
- [I] **Williams → 1D shadow map.** For each light, render occluders into a 1×N texture (N = 256–512 angles) that stores the minimum distance. A pixel is lit if `dist(pixel, light) < map[angle]`. Even WebGL2 can do this (one pass per light), and Godot's 2D lights use a similar internal approach (unverified here, see the engine-focused notes).
- Williams already named **dither & quantization** as the artefact sources. In pixel art we can make them features: dithered penumbra.

**Gaps:** I did not open the Blinn article itself, only the citation. DOIs for Blinn (10.1109/38.7759) and Gooch (Q4) are from memory and not verified in this session.

---

## Q2. Roguelike FOV / light propagation on a tile grid (Bergström 2001, Milazzo 2014, Ford 2021)

**Takeaway:** Use **symmetric shadowcasting** (Ford) for both player FOV and **per-light tile illumination**: run FOV from the light, radius = light radius, and the tiles it sees are lit. Milazzo measured shadowcasting as the **fastest** of 5 algorithms. Ford adds perfect symmetry, so FOV matches Bresenham line of sight and you can shoot whatever you can see. It is a perfect fit for Tibia-like tile lights.

**Cited findings**
- **Bergström 2001** [C] https://www.roguebasin.com/index.php/FOV_using_recursive_shadowcasting . "Copyright 2001 Björn Bergström". It splits the view into **8 octants** and scans rows outward. When it hits a blocker it **recurses** one row further out with a narrowed slope window. Cells in shadow are never visited. The author calls it "especially fast in confined areas such as corridors and small rooms." No benchmarks.
- **Milazzo 2014** [C] "Roguelike Vision Algorithms", dated **2014-10-08**, http://www.adammil.net/blog/v125_Roguelike_Vision_Algorithms.html
  - Six desirable properties (Ford quotes them too): symmetry, expansive walls, expanding pillar shadows, no blind corners, no artifacts, efficiency.
  - **Performance table** (executions/s, single core). Average speed factor: **Ray casting 52 %, Shadow casting 100 %, Diamond walls 78 %, Milazzo's algorithm 53 %, Permissive FOV 11 %**. Examples: Room 120×65 has ray casting 39,478/s vs shadowcasting 398,466/s; Corridor r8 has 269,678 vs 501,827. He says "A well-implemented shadow casting algorithm beats ray casting every time."
  - **Light sources:** "run the FOV algorithm from the position of the light source with a maximum radius equal to the radius of the light source."
  - **Light falloff:** raise a tile's brightness by distance from the light. Cap the lit-tile visibility distance.
  - **Coloured light mixing (4 options).** (1) Add+saturate: simple, "decent results". (2) Blend: only good for ≤2 colours. (3) **HDR add, then rescale by the max channel**: yellow(255,255,0)+red(255,0,0) gives (510,255,0), ×255/510 gives (255,127,0), orange. He calls this "the best option in general". (4) HDR average.
  - He also suggests showing special tiles (e.g. ice) in a fixed colour regardless of light, so they stay readable.
- **Ford** [C] https://www.albertford.com/shadowcasting/ (no date on page; Rust crate porting it released Aug 2020, https://lib.rs/crates/symmetric-shadowcasting, so the article is **≤2020**, not 2021). Talk "Vision Visualized": https://youtu.be/y1zkrTcNJbc (referenced by https://lzzrhx.codeberg.page/2024/06/08/roguelike-devlog6.html).
  - It scans **4 quadrants** row by row with a recursive `scan(row)`. **Rational slopes (Python `Fraction`)** with controlled rounding (`round_ties_up/down`) avoid artifacts.
  - Floors are modelled as centre points and walls as **diamonds inscribed in tiles** (beveled corners). Ford says it "satisfies all six" of Milazzo's properties.
  - **Maps exactly to Bresenham line of sight**, so ranged-combat targeting matches FOV.
  - For a **wall-mounted torch** (origin on a wall tile), start the slopes from the tile edges and use strict inequalities. The origin then casts umbra and penumbra, and pillar shadows become constant-width.
  - A non-recursive version is provided.
  - Lineage: "diamond walls, point visibility model". It credits Bergström and RogueBasin's Discussion:Field of Vision.

**Inferences: pixel approximation & what to steal**
- [I] **Tile light map per light:** shadowcast once when the light or map changes, not every frame. Torches are static, so cache the result. Moving lights (held torch, r ≈ 5–7 tiles) cost about 0.002–0.003 ms per cast at Milazzo's r8 rates (100–500k/s). That is trivially cheap even in GDScript on mobile, with a GDScript slowdown factor of maybe 10–50×. Still fine.
- [I] Brightness per lit tile = `max(0, 1 - d/r)`, quantized to 4–6 levels (DOOM/Tibia style). Upload as a tiny texture (1 texel per tile) with **nearest** filtering for the chunky look, or bilinear for smooth.
- [I] Mix colours with **Milazzo option 3 (HDR add + max-channel rescale)** inside the light accumulation buffer. That is one `max()` and one divide per tile.
- [I] Symmetry is also a gameplay rule: if a monster in the dark can see you, you can see it. Tie fog of war to "lit ∧ in FOV".

**Gaps:** Ford's exact publication date is unknown (site undated). I found no measured timings for Ford's variant (Milazzo has an "anonymous" comment comparing them that I did not read).

---

## Q3. SDF soft shadows (Quilez; Ronja 2D tutorial)

**Takeaway:** A 2D SDF soft shadow is one ray-march loop per pixel per light, with penumbra = `min(k·h/t)`. Too expensive per screen pixel for WebGL/mobile with many lights. It is viable on a **low-res light buffer** (e.g. 1/4 res, or 1 sample per game pixel at 320×180) with ≤4 lights and 16–32 steps.

**Cited findings**
- **Quilez** [C] https://iquilezles.org/articles/rmshadows : penumbra comes almost free during marching. `res = min(res, k*h/t)` costs "one division per marching point". k = hardness (examples k = 2, 8, 32, 128). The improved version (credited to **Sebastian Aaltonen's GDC talk**, "7 years after" the original) estimates the closest approach from the previous and current SDF samples: `y=h*h/(2*ph); d=sqrt(h*h-y*y); res=min(res,k*d/max(0,t-y))`. It fixes banding and light leaking at sharp corners.
- **Ronja** [C] "2D SDF Shadows", **Dec 1 2018**, https://www.ronja-tutorials.com/post/037-2d-shadows/ : the 2D version marches from the pixel towards the light, using `#define SAMPLES 32`. Hard shadow: return 0 if sceneDist ≤ 0. Soft shadow: track `nearest = min(nearest, hardness*sceneDist)` and return `saturate(nearest)`. Hardness 20 → keep the light ≥ 0.05 units from shapes to avoid "teeth" artefacts. Multiple lights are summed.

**Inferences**
- [I] Year of Quilez's original is about 2010–2011 and Aaltonen's talk is GDC 2018 (Claybook). Both unverified here.
- [I] **Cheapest pixel version:** bake a low-res distance field of the occluders (e.g. 1 texel per tile or per 4 px, built by jump flood or BFS on the CPU when walls change). March ≤16 steps at 1/4 resolution, then **quantize the shadow value to 3 bands + 4×4 Bayer dither**. That reuses the dithered-lamp-pool look from study #1. Prefer tile shadowcasting (Q2) for walls. Keep SDF for "soft magic light" or a showcase demo only.

---

## Q4. Gooch et al. 1998: warm/cool shading, the academic basis for pixel-art hue shifting

**Takeaway:** Gooch shading blends between a **cool colour (shadow side)** and a **warm colour (lit side)** using `(1+l·n)/2`. Hue carries the form, while luminance stays in the mid-range. This is exactly the pixel artist's "hue-shift ramps" (shadows towards blue/purple, highlights towards yellow). It justifies building every light ramp as a palette ramp with hue rotation, not just darkening.

**Cited findings** [C] "A Non-Photorealistic Lighting Model for Automatic Technical Illustration", Amy Gooch, Bruce Gooch, Peter Shirley, Elaine Cohen. **SIGGRAPH 1998**, presented July 24 1998, Orlando. https://users.cs.northwestern.edu/~ago820/SIG98/abstract.html ; the model section is at https://users.cs.northwestern.edu/~ago820/SIG98/paper/node6.html
- Equation (2): `I = ((1 + l·n)/2)·k_cool + (1 − (1 + l·n)/2)·k_warm`. The paper's printed form puts the weights in that order; check the figure.
- `k_cool = k_blue + α·k_d`, `k_warm = k_yellow + β·k_d`, with `k_blue = (0,0,b)` and `k_yellow = (y,y,0)`.
- Parameters used: **b = 0.4, y = 0.4, α = 0.2, β = 0.6** (Fig. 7), and b = 0.55, y = 0.3, α = 0.25, β = 0.5 (Fig. 8). Exact values are "not crucial".
- Rationale quoted: "cool colors recede while warm colors advance". In sunlit scenes, "cool skylight and warm sunlight vary in relative contribution across the surface". The light is placed up and to the right because vision "assumes illumination comes from above".
- Objects keep their "color name". Extreme darks and lights are reserved for outlines and highlights, so shading stays in the mid-tones.

**Inferences: what to steal**
- [I] Generate palette light ramps Gooch-style. Each ramp step `i` lerps from `base + cool(b≈0.4)` to `base + warm(y≈0.4)`, then gets quantized to the nearest colour in the master palette. That gives automatic hue-shifted ramps for a DOOM-style COLORMAP / LUT.
- [I] Keep pure black for outlines and the darkest night only, as Gooch reserves extremes for edges and highlights. Lit sprites stay readable at all times of day.
- [I] Time of day can swap `k_warm`/`k_cool`: noon gives low temperature contrast, golden hour gives strong orange vs blue, night gives both blue (see Q7).

**Gaps:** I didn't verify the page numbers or DOI (believed to be pp. 447–452, DOI 10.1145/280814.280950).

---

## Q5. Normal-mapped sprites: Sprite Lamp (2013–14) and pixel-art normal-map research (2022–2025)

**Takeaway:** You can **paint** normal maps for pixel art (2–5 greyscale "lighting profiles"), generate them, or now infer them with ML. The research says 3D normal-map generators often give **wrong results on pixel art**, so hand-painted or palette-limited normals look best. For a cheap web game, use normal maps only on hero props (braziers, statues, the player), not on every tile.

**Cited findings**
- **Sprite Lamp** [C] by Snake Hill Games (Finn Morgan). Official page: http://www.snakehillgames.com/spritelamp/ . Steam release **Sep 25 2014** (https://store.steampowered.com/app/316830/). Site comments from Nov 2013 mention the Kickstarter going live; GamingOnLinux reported it funded in Dec 2013 (https://www.gamingonlinux.com/2013/12/sprite-lamp-dynamic-lighting-for-2d-art/).
  - The artist paints "lighting profiles": the subject "painted in greyscale (as though... white plaster)" with a single light direction. **"as few as two lighting profiles, and as many as five"**. More profiles mean they can be less physically accurate. Their zombie example used 4.
  - Outputs: normal, depth, anisotropy and ambient-occlusion maps, all without 3D modelling.
- **Moreira, Coutinho, Chaimowicz 2022** [C] "Analysis and Compilation of Normal Map Generation Techniques for Pixel Art", arXiv:2212.09692 (Dec 19 2022), DOI 10.1109/SBGAMES56371.2022.9961116 (SBGames 2022). https://arxiv.org/abs/2212.09692 . Claim: methods built for 3D can produce **incorrect results on pixel art**. A qualitative comparison over case studies.
- **DynaPix 2022** [C] Gandeaga, Iliash, Careaga, Aksoy (SFU), SIGGRAPH '22 Posters. https://yaksoy.github.io/papers/SIG22b-DynaPix.pdf . A Krita extension that turns a photo into pixel art plus a **pixelized normal map**. They found a **16–20 colour palette for the normal map** gives "satisfactory maps".
- **Nikolov 2025** [C] "Light the Sprite: Pixel Art Dynamic Light Map Generation", Eurographics 2025 Short Papers, DOI 10.2312/egs.20251032. https://diglib.eg.org/handle/10.2312/egs20251032 . A UNet + CIN model takes a sprite and a light vector and outputs point/directional light maps. Depth for training comes from ZoeDepth. It reportedly matches depth/normal-map-derived maps and runs in real time. No metrics on the abstract page.

**Inferences: what to steal**
- [I] **Palettized normals (DynaPix's 16–20 colours):** quantize normal maps to about 8–20 directions. The lit result then snaps to discrete bands, which keeps the pixel look and avoids smooth 3D-ish gradients. Even cheaper: store just **4 "lighting profile" frames** (lit from N/E/S/W) Sprite-Lamp style. At runtime, blend the 2 nearest by light angle, which needs no normal-map shader at all (works in Compatibility). Or pick the nearest frame for a fully pixel look.
- [I] Top-down 3/4 tip: on tiles, normals mostly face up (+Z). Only walls, props and characters gain from normals, so skip ground normals.

---

## Q6. Colour temperature of real light sources (numbers for light "personality")

**Takeaway (palette anchors):** match/candle/fire **1,700–1,850 K**, sunrise/sunset **~1,850–2,000 K**, golden hour **~3,500 K**, incandescent **2,400–2,700 K**, noon **~5,500 K**, overcast **6,500 K**, clear blue sky **15,000–27,000 K**. Moonlight is physically *warmer* than sunlight but is **perceived/painted blue** (see Q7).

**Cited findings**
- [C] Wikipedia "Color temperature" table (https://en.wikipedia.org/wiki/Color_temperature):
  - 1,700 K match flame / low-pressure sodium
  - **1,850 K candle flame, sunset/sunrise**
  - 2,400 K standard incandescent
  - 2,700 K "soft white" CFL/LED
  - 3,000 K warm white
  - 3,200 K studio lamps
  - 5,000 K horizon daylight
  - **5,500–6,000 K vertical daylight**
  - **6,500 K daylight, overcast**
  - **15,000–27,000 K clear blue poleward sky**
- [C] Wikipedia "Golden hour (photography)" (https://en.wikipedia.org/wiki/Golden_hour_(photography)): daylight is about **2,000 K shortly after sunrise or before sunset**, about **3,500 K during golden hour**, and about **5,500 K at midday**.
- [C] Jensen, Premože, Shirley, Stark, Thompson, Ferwerda, "Night Rendering", Univ. Utah tech report UUCS-00-016 (2000), https://users.cs.utah.edu/docs/techreports/2000/pdf/UUCS-00-016.pdf . It says moonlight is "warmer (redder) than sunlight" because it is sunlight reflected off a surface whose albedo is higher at long wavelengths. The companion is Jensen, Durand, Dorsey, Stark, Shirley, Premože, "A Physically-Based Night Sky Model", **SIGGRAPH 2001**, https://graphics.ucsd.edu/~henrik/papers/nightsky/ . It describes the Moon as having "a low albedo and a reddish color" and being much brighter at full moon.

**Inferences**
- [I] Light personality palette (K → approximate sRGB tint, from standard blackbody tables, not verified here): candle 1,850 K ≈ #FF8B14; torch/campfire 1,900–2,000 K ≈ #FF8A12 to #FF9329; lantern/oil 2,200–2,400 K; noon white; overcast slightly blue; magic = **off the Planckian locus** (cyan/violet/green). Off-locus colour is itself a cue that the light is unnatural.
- **Gap:** I found no authoritative source in this session for "firelight 1,900–2,000 K" or "moonlight ≈ 4,100 K". Use the 1,850 K candle / 1,700 K match anchors.

---

## Q7. Night perception: Purkinje shift, night blue-shift, loss of detail

**Takeaway:** Night palettes should be **blue-shifted, desaturated, low-detail**, with reds going dark. Artists and films do this, and the night-rendering literature quantifies it: realist night paintings average chromaticity **(x,y) ≈ (0.29, 0.28)**, with the bluest around (0.25, 0.25). Keep firelight warm in contrast. Warm pools in a blue night is the classic and physically motivated mood.

**Cited findings**
- [C] Purkinje effect (https://en.wikipedia.org/wiki/Purkinje_effect): peak sensitivity shifts towards blue in low light, and "reds will appear darker relative to other colors". Rod peak is **507 nm** (rhodopsin ~500 nm) vs photopic cones ~**555 nm**. The geranium example: red flowers look dark or black at dusk while leaves and blue petals look relatively bright.
- [C] "Night Rendering" (UUCS-00-016, 2000, URL above):
  - Painters use a blue shift for night. Films use a blue filter.
  - An analysis of **10 realist night paintings**: average chromaticity of the scotopic regions is **(0.29, 0.28), σ = 0.03**, southwest of the white point (0.33, 0.33). They chose the target hue **(0.25, 0.25)**.
  - The blue shift is proportional to `1 − s` (rod saturation). It ramps across the mesopic range **0.01 to ~4.0 cd/m²**.
  - Loss of detail: painters keep "prominent edges" but drop "textures and other high frequency". They implement this with edge-aware blur.

**Inferences: pixel approximation & what to steal**
- [I] **Night LUT = 3 ops:** (a) desaturate about 50–70 %, (b) shift towards (0.25,0.25), i.e. blue-violet #3A4A7A-ish, by `(1 − lightLevel)`, (c) darken reds more than blues (Purkinje). Implement as a palette remap (COLORMAP row) per light level, so night costs **zero per-pixel math**.
- [I] **Loss of detail at night:** have the palette remap collapse texture colours. Adjacent ramp shades map to the same night colour, so grass texture disappears while outlines stay. This is the painters' trick turned into a palette rule.
- [I] Inside a light pool, use the normal warm palette (photopic). Outside, the scotopic blue palette. The dithered boundary between them is the "mesopic" band.

---

## Q8. Sun geometry: elevation, shadow length, golden hour, twilight

**Takeaway:** Shadow length is `L = h / tan(α)`. Golden hour is roughly sun elevation 0–6° (definitions vary). Civil twilight goes down to −6°, nautical to −12°, astronomical to −18° (then night). Drive the day/night palette from **elevation α**, not clock time.

**Cited findings**
- [C] Solar elevation: `sin α = sin Φ sin δ + cos Φ cos δ cos h` (Φ latitude, δ declination, h hour angle). https://en.wikipedia.org/wiki/Solar_zenith_angle
- [C] Golden hour has no single definition. Apps use **0° to 6°** or 0° to 10° above the horizon, or **4° below to 6° above**. timeanddate.com uses **6° below to 6° above**. Blue hour is the sun **3°–10° below** the horizon, with "no sharp shadows". https://en.wikipedia.org/wiki/Golden_hour_(photography)
- [C] Twilight: **civil** is centre of the sun 0° to −6°, when artificial light is not yet needed. **Nautical** is −6° to −12°. Night begins at **−18°**, when sky illumination is "nearly zero". The twilight look is no shadows, with objects silhouetted against a lit sky. https://en.wikipedia.org/wiki/Twilight

**Inferences: numbers & pixel approximation**
- [I] Shadow length multipliers `1/tan α`: α = 60° → 0.58h; 45° → 1.0h; 30° → 1.73h; 20° → 2.75h; 10° → 5.67h; 6° → 9.5h. In a pixel game, **clamp to about 3h** and fade shadow opacity as α → 0. Real shadows also get softer and fainter at low sun because skylight dominates.
- [I] Game-time model: `α(t) = α_max · sin(π·(t − sunrise)/daylen)` is enough. No latitude math is needed, but expose `α_max` per season or biome (e.g. 75° summer, 35° winter).
- [I] Phase table driven by α:
  - α > 6°: day, hard shadows, white-yellow light
  - 0–6°: golden, long orange shadows, blue shadow fill
  - 0 to −6°: civil twilight, **no shadows**, sky-blue ambient, lamps switch on
  - −6 to −12°: nautical, deep blue, warm windows pop
  - < −12°: night palette (Q7)
- [I] Shadow azimuth = sun azimuth + 180°. For a top-down 3/4 view, a simple east→west sweep over the day is enough.

---

## Q9. Sky colour: Rayleigh scattering (and Minnaert, Gurney for artist rules)

**Takeaway:** Scattering goes as λ⁻⁴. That gives a blue sky and a blue skylight that fills shadows, and a yellow→orange→red direct sun as the path through air lengthens at low elevation. Gurney: sunny-day shadows *really are* bluish because skylight lights them. Minnaert is the field guide to observing these effects.

**Cited findings**
- [C] Rayleigh scattering intensity is inversely proportional to the **fourth power of wavelength**. Blue sky at large angles from the sun, yellow/orange towards the sun, and red/orange at sunset as blue is scattered out of the direct path. https://en.wikipedia.org/wiki/Rayleigh_scattering . Night Rendering (2000) also contrasts Rayleigh (wavelength-dependent, nearly diffuse) with Mie/aerosol scattering (wavelength-independent, strong forward peak). This explains white haze and glow around the sun.
- [C] **Gurney**, "Complementary Shadows" (Sep 8 2014), https://gurneyjourney.blogspot.com/2014/09/complementary-shadows.html : shadows are in a complementary range because they are "lit by the relatively blue skylight". Sunlit surfaces get sun plus sky, so a white paper in shadow photographs "clearly bluer". The effect is "heightened late in the day". The book is **Color and Light: A Guide for the Realist Painter** (Andrews McMeel, 2010; ISBN 9780740797712 per https://www.huntsbookshop.com/collections/all/products/9780740797712).
- [C] **Minnaert**, *Light and Color in the Outdoors*, Springer New York 1993 (hardcover 11 June 1993), DOI 10.1007/978-1-4612-2722-9. https://link.springer.com/book/9780387979359 . The original Dutch work is *De natuurkunde van 't vrije veld* (1937; not verified this session).

**Inferences: what to steal**
- [I] **Two-light sun model** (the cheapest believable daylight): `color = albedo · (sunColor·sunlit + skyColor·ambient)`. Shadow pixels get only `skyColor` (blue-ish), and lit pixels get sun plus sky. In palette terms, each tile colour has a "lit" index and a "shadow" index in a hue-shifted-cool ramp. Shadow sprites should **remap** the colours under them to the shadow ramp, not blend black at 50 %.
- [I] Make the shadow tint stronger at golden hour (sun orange, sky blue) and weaker at overcast (sun ≈ sky, low contrast, very soft shadows, near 6,500 K grey).
- [I] Gurney's "warm below, cold above" (page didn't load) is the usual rule: ground-bounce light is warm on down-facing planes and sky is cool on up-facing planes. On sprites, the bottom pixels get a slightly warm rim and the tops a cool tint. **Gap: page body not retrieved.**

---

## Q10. Flame flicker frequency (how fast should fire flicker?)

**Takeaway:** Real candle-bundle flames oscillate at about **10–12 Hz**. A single candle in still air is steady and only flickers when disturbed. So the base flicker for a torch or campfire should be a 10–12 Hz component plus slow random gusts. A lone candle should be mostly steady with occasional wobble.

**Cited findings**
- [C] Chen, Guo, Jia, Xiao, "Frequency and Phase Characteristics of Candle Flame Oscillation", **Scientific Reports 9:342 (2019)**, DOI 10.1038/s41598-018-36754-w. https://pmc.ncbi.nlm.nih.gov/articles/PMC6344522/
  - A **single candle: stable**, no oscillation. 1–2 candle bundles are stable and non-periodic.
  - **≥3 candles: oscillation at 10–12 Hz**. Frequency **decreases as the candle count rises**. 6-candle layouts measured **10.72, 10.78, 10.96 Hz**.
  - Two 3-candle oscillators: **in-phase** sync at about 20 mm and **anti-phase** at about 35 mm. Incoherent beyond about 60 mm.
- [C] It cites **Kitahata et al. 2009**, *J. Phys. Chem. A* 113:8164–8168, DOI 10.1021/jp901487e. Periodic flicker needs ≥3 candles. In-phase sync at about 20–30 mm, anti-phase at about 30–48 mm.
- More (not read): arXiv 2207.02019 "Flickering candle flames and their collective behavior" https://arxiv.org/pdf/2207.02019

**Inferences: what to steal**
- [I] **Flicker recipe:** `I(t) = base · (1 + 0.06·sin(2π·f·t + φ) + 0.10·noise1D(t·1.5))`, with f ∈ [10,12] Hz for big fires and **lower f for bigger fires**, since frequency falls with size. Candle: f-term ≈ 0 with a rare (0.2–0.5 Hz) wobble. Brazier/campfire: 10 Hz plus noise. Bonfire: about 8 Hz (extrapolated). At 60 fps a 10–12 Hz sine has 5–6 frames per cycle, which renders fine. With quantized light levels (4–6 steps) it reads as pixel shimmer, not a smooth pulse.
- [I] **Sync rule:** two adjacent braziers can share phase (in-phase) or opposite phase. Random phase per light avoids the "whole town pulses together" artefact.
- [I] Personalities by frequency:
  - candle: steady + rare dip
  - fire: 10–12 Hz + gusts
  - electric/arc: rare hard dropouts
  - magic: slow sine 0.3–1 Hz "breathing"
  - fireflies: 0.5–2 Hz on/off blinks
  The magic and firefly numbers are design choices, not sourced.
- **Gap:** Gotoda 2012 not verified.

---

## Q11. Brightness perception (Weber–Fechner, Stevens) and Kruithof (dim+warm vs dim+cold)

**Takeaway:** Perceived brightness is compressive, about **logarithmic** (Fechner) or a **power law with exponent ~0.33–0.5** (Stevens). So light-level steps should be **multiplicative** (each step ≈ ×1.5–2 in linear intensity), not linear. Light pools read through *relative* contrast, so make the surrounding dark noticeably darker, not the light brighter. Kruithof's "dim + warm feels pleasant, dim + cold feels gloomy" is a good **mood heuristic**, but it is **not empirically supported** (Fotios 2017). Use it as an art rule, not as science.

**Cited findings**
- [C] Weber–Fechner (https://en.wikipedia.org/wiki/Weber%E2%80%93Fechner_law): the JND is proportional to the starting intensity. Fechner: sensation ∝ log(stimulus), `p = α ln(S/S0)`. Published 1860. Because perception is roughly logarithmic, moving light from bright areas to dim areas makes a room look brighter overall.
- [C] Stevens' power law (https://en.wikipedia.org/wiki/Stevens%27s_power_law): **brightness exponent 0.33** for a 5° target in the dark, **0.5** for a point source or brief flash, **1.2 lightness** for reflectance of grey papers.
- [C] **Kruithof 1941**, "Tubular Luminescence Lamps for General Illumination", *Philips Technical Review* 6(3):65–96 (https://en.wikipedia.org/wiki/Kruithof_curve). There is a middle "pleasing" zone. Low illuminance pairs only with low CCT, and the window widens at higher illuminance. Below the zone is "cold and dim"; above it is warm and "unnaturally colorful". Examples: homes **~75 lx → 2,400–2,700 K**; offices **~400 lx → 3,000–6,000 K**; daylight **6,500 K at 10⁴–10⁵ lx**.
- [C] **Fotios 2017**, "A Revised Kruithof Graph Based on Empirical Data", *LEUKOS* 13(1):3–17, DOI 10.1080/15502724.2016.1159137 (open access, https://eprints.whiterose.ac.uk/98531/17/Fotios_2017_a_new_Kruithof_graph.pdf). Credible studies "do not support Kruithof". The data suggest "only avoiding low illuminances and do not favor any CCT".

**Inferences: what to steal**
- [I] **Light level table:** 6 levels with linear intensities {1, 0.6, 0.36, 0.22, 0.13, 0.08} (×0.6 per step). These look roughly evenly spaced to the eye, while linear steps would look "all bright then sudden dark". This matches DOOM COLORMAP's 32 rows used non-linearly with distance (from previous study context; not re-verified).
- [I] **Kruithof as an art direction rule:** dim lights warm (candle, hearth = cosy); bright lights may be white or cold; **dim + cold = eerie** (ghost lights, crypt crystals, moon-lit graveyard). That gives a 2×2 mood grid for light personalities. Label it "artistic convention".
- [I] **Contrast for pools:** the darkness overlay outside a pool should drop at least 2 levels (≈ ×0.36). Then the pool reads even at low absolute brightness on phone screens.

---

## Q12. Other 2015–2026 stylized/pixel lighting research found

- [C] Moreira et al. 2022 (SBGames), DynaPix 2022 (SIGGRAPH poster), Nikolov 2025 (EG short): see Q5.
- [C] Night Rendering 2000 / Night Sky 2001: older, but they are the only quantified "how artists paint night" data found (Q7).
- **Gap:** I found no academic paper specifically on **palette/LUT lighting for pixel art**, tile flood-fill lighting, or 2D light-pool dithering. That knowledge lives in devlogs and GDC talks (other researchers' angles). Also not found: a peer-reviewed perceptual study of pixel-art hue shifting.

---

## Top "what to steal" list (for profiles/demos)
1. **Symmetric shadowcasting per light → tile light map**, cached for static lights. Fastest of 5 algorithms (Milazzo). Exact LOS symmetry (Ford). [Q2]
2. **HDR-add + max-channel rescale** for coloured light mixing (Milazzo). [Q2]
3. **Gooch warm/cool ramps** (b = y = 0.4, α = 0.2, β = 0.6) → generate hue-shifted palette light ramps / COLORMAP rows. [Q4]
4. **Two-light sun model:** shadow = remap to sky-lit (blue) ramp, not black alpha (Gurney + Rayleigh). [Q9]
5. **Elevation-driven day phases:** golden 0–6°, civil 0 to −6° (no shadows), nautical −12°, night −18°. Shadow length h/tan α clamped to 3h. [Q8]
6. **Night palette:** shift towards chromaticity (0.25,0.25), darken reds (Purkinje), collapse textures and keep edges (painters' rule). [Q7]
7. **Flicker 10–12 Hz** for multi-wick fires (lower for bigger fires); single candles steady; random phases. [Q10]
8. **Geometric light-level steps** (×0.6), Stevens exponent 0.33–0.5. **Kruithof mood grid**, flagged as convention. [Q11]
9. **Blinn planar sprite shadows** for sun; **Crow quads / Williams 1D maps** only if real-time occluder shadows are needed. [Q1]
10. **Quantized normals (16–20 colours) or 4 painted lighting-profile frames** for hero sprites (Sprite Lamp / DynaPix). [Q5]
11. SDF soft shadows only at low res, ≤16–32 steps, dithered bands (Quilez/Ronja). [Q3]

---

## Sources
- Crow 1977 bibtex: https://researchr.org/publication/Crow77-1/bibtex ; SIGGRAPH archive https://history.siggraph.org/?p=120216 ; handout https://my.eng.utah.edu/~cs5610/handouts/crows%20shadow%20volumes.pdf
- Williams 1978: https://history.siggraph.org/?p=120268 ; https://www.springerprofessional.de/doi/10.1145/800248.807402
- Biblio (Blinn, Crow, Williams details): https://userpages.cs.umbc.edu/olano/s2000c27/biblio.pdf
- Bergström 2001: https://www.roguebasin.com/index.php/FOV_using_recursive_shadowcasting ; RogueBasin FOV index https://roguebasin.com/index.php/FOV
- Milazzo 2014: http://www.adammil.net/blog/v125_Roguelike_Vision_Algorithms.html
- Ford: https://www.albertford.com/shadowcasting/ ; talk https://youtu.be/y1zkrTcNJbc ; crate https://lib.rs/crates/symmetric-shadowcasting ; devlog https://lzzrhx.codeberg.page/2024/06/08/roguelike-devlog6.html
- Quilez: https://iquilezles.org/articles/rmshadows
- Ronja 2D SDF shadows: https://www.ronja-tutorials.com/post/037-2d-shadows/
- Gooch 1998: https://users.cs.northwestern.edu/~ago820/SIG98/abstract.html ; https://users.cs.northwestern.edu/~ago820/SIG98/paper/node6.html
- Sprite Lamp: http://www.snakehillgames.com/spritelamp/ ; https://store.steampowered.com/app/316830/ ; https://www.gamingonlinux.com/2013/12/sprite-lamp-dynamic-lighting-for-2d-art/
- Moreira et al. 2022: https://arxiv.org/abs/2212.09692
- DynaPix 2022: https://yaksoy.github.io/papers/SIG22b-DynaPix.pdf
- Nikolov 2025: https://diglib.eg.org/handle/10.2312/egs20251032
- Colour temperature: https://en.wikipedia.org/wiki/Color_temperature
- Golden hour: https://en.wikipedia.org/wiki/Golden_hour_(photography)
- Twilight: https://en.wikipedia.org/wiki/Twilight
- Solar elevation formula: https://en.wikipedia.org/wiki/Solar_zenith_angle
- Rayleigh: https://en.wikipedia.org/wiki/Rayleigh_scattering
- Purkinje: https://en.wikipedia.org/wiki/Purkinje_effect
- Night Rendering (2000): https://users.cs.utah.edu/docs/techreports/2000/pdf/UUCS-00-016.pdf
- Night Sky Model (SIGGRAPH 2001): https://graphics.ucsd.edu/~henrik/papers/nightsky/ ; PDF https://graphics.cs.yale.edu/sites/default/files/nightsky.pdf
- Candle flicker: https://pmc.ncbi.nlm.nih.gov/articles/PMC6344522/ ; https://arxiv.org/pdf/2207.02019
- Kruithof: https://en.wikipedia.org/wiki/Kruithof_curve ; Fotios 2017 https://eprints.whiterose.ac.uk/98531/17/Fotios_2017_a_new_Kruithof_graph.pdf
- Weber–Fechner: https://en.wikipedia.org/wiki/Weber%E2%80%93Fechner_law ; Stevens: https://en.wikipedia.org/wiki/Stevens%27s_power_law
- Gurney: https://gurneyjourney.blogspot.com/2014/09/complementary-shadows.html ; (not retrieved) https://gurneyjourney.blogspot.com/2012/05/warm-below-cold-above.html ; book ISBN https://www.huntsbookshop.com/collections/all/products/9780740797712
- Minnaert: https://link.springer.com/book/9780387979359
