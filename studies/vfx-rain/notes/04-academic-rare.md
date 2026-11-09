# 04 — Academic & rare publications on rain, wetness, puddles, ripples, splashes, rain+fog

Angle: what the papers actually say (verified citation, core idea, numbers), and what each means for a cheap top-down pixel game (Godot 4, WebGL2/Compatibility, palette-limited).
Citations were checked against Crossref (`api.crossref.org/works/<DOI>`) unless marked otherwise.
Legend: **[C]** = cited finding, **[I]** = my inference / derived arithmetic, **[U]** = unverified (memory or partial source).

---

## Q1. Rain streak appearance and visibility (Garg & Nayar, Columbia CAVE)

**Takeaway:** a raindrop seen by a camera or eye is a short, *brighter-than-background*, motion-blurred streak, never a tear shape. How visible rain is depends mostly on exposure time (shutter or the eye's ~60–90 ms persistence) and on distance and depth of field. For pixel art: draw rain as a 1 px wide streak that is always *lighter* than what's under it. Make its length = fall speed × "exposure". Don't draw drop shapes.

### Papers (verified)
| Paper | Venue / year | DOI / URL |
|---|---|---|
| Garg & Nayar, "Detection and removal of rain from videos" | CVPR 2004, vol 1, pp. 528–535 | 10.1109/CVPR.2004.1315077 |
| Garg & Nayar, "When does a camera see rain?" | ICCV 2005 | https://mlanthology.org/iccv/2005/garg2005iccv-camera |
| Garg & Nayar, "Photorealistic rendering of rain streaks" | ACM TOG 25(3) (SIGGRAPH 2006), pp. 996–1002, Jul 2006 | 10.1145/1141911.1141985 |
| Garg & Nayar, "Vision and Rain" | IJCV 75(1), pp. 3–27, 2007 | 10.1007/s11263-006-0028-6 |
| Garg & Nayar, "Photometric Model of a Rain Drop" (tech report) | CAVE TR (2004 per filename) | https://www.cs.columbia.edu/CAVE/publications/pdfs/Garg_TR04.pdf |

### Cited findings
- [C] Each drop acts like a fisheye lens with a field of view of about **165°**. Refraction dominates its look; reflections matter only at edges or with the sun. (Garg_TR04)
- [C] Drops are **brighter than their background**, and the gain is roughly similar whatever the background brightness. In their test, every brightness spike was positive. (Garg_TR04)
- [C] Streaks are motion blur of fast drops. (Garg_TR04)
- [C] Marshall–Palmer size distribution as used there: N(a) = 8×10⁶·e^(−8200·h^−0.21·a), with h in mm/h and a = radius in m. Gunn–Kinzer terminal-velocity fit: v = 9.40(1 − e^(−3.45×10³·a^1.31)) m/s. (Garg_TR04) — note: plugging radius in metres into that fit gives implausibly low speeds, so use the tabulated speeds in Q2.
- [C] Rain visibility depends strongly on **exposure time and depth of field**, because drops are small, fast and sparse. Picking the camera settings can reduce or remove rain without changing the scene. The same idea gives a camera-based rain gauge. (https://cs.columbia.edu/CAVE/projects/camera_rain/camera_rain.php)
- [C] Streak database (SIGGRAPH 2006): **3,150 streak images**. Light elevation runs −90° to 90° and azimuth 10° to 170°, both in 20° steps. Camera elevation runs 0° to 80° in 20° steps. There are **10 oscillation variants** per configuration, all for a **1.6 mm drop at 1/60 s exposure**. Images are 16-bit PNGs up to 32×1050 px, plus 16/8/4 px-wide mips, about 50 MB in total. (https://www.cs.columbia.edu/CAVE/databases/rain_streak_db/rain_streak.php) Drop **oscillation** makes streaks show bright/dark beads along their length.
- [C] Tremblay/Halder used this database for physics-based rain augmentation. They pick the streak closest in drop size, choose a random oscillation, and warp it with a homography. They weight streak radiance as **94% refracted, 6% reflected**. (arXiv 2009.03683)

### Inferences for the pixel game
- [I] Streak length per frame = v·Δt. At 60 fps (16.7 ms) a ~9 m/s drop moves ~15 cm. At 32 px per metre that is ~5 px. Using eye persistence (60–90 ms, Rousseau) instead gives a 0.5–0.8 m smear, or 17–26 px. Use **3–8 px streaks** per tier. Drizzle: 1–2 px dots that are slow and short. Storm: 8–12 px.
- [I] Steal "always brighter than background": render streaks as **additive +1 palette step** (palette index shift toward light), not a fixed colour. That reads on both dark grass and light stone. Tatarchuk's "milk in the water" white bias is the same trick (Q3).
- [I] Steal oscillation beads cheaply: a streak sprite with one brighter pixel at a random position, re-randomised per spawn. That gives 2–3 sprite variants.
- [I] Top-down specific: the camera looks *down*, so falling rain is foreshortened. The visible streak is mostly the **wind-driven horizontal component** plus a short perspective "drop toward ground" offset. Fake it with a z-height per drop and screen-y offset = z × k, the same as the snow study's z-height flakes with ground-shadow dot.

### Gaps
- Could not open the IJCV PDF itself, so the exact visibility equations (streak intensity vs exposure, the depth-of-field "rain-visible volume") are not quoted.

---

## Q2. Real-time rain rendering lineage (2003–2016)

**Takeaway:** the field went from (a) scrolling textures on geometry around the camera (Wang & Wade 2004, the cheapest), to (b) refractive particles (Rousseau 2006), (c) image-space rain plus artist controls (Tatarchuk 2006), (d) camera-following rain volumes with LOD (Puig-Centelles 2009), and (e) storm maps, millions of GPU particles and multiscale fog (Creus & Patow 2013, Weber 2015). For WebGL2 pixel art, **(a) and (c) are the ones to steal**: scrolling layered textures plus a screen-space composite, with a few dozen to a few hundred CPU particles only near the player.

| Paper | Venue / year | DOI | Core idea | Key numbers |
|---|---|---|---|---|
| Wang & Wade, "Rendering falling rain and snow" | ACM SIGGRAPH 2004 Sketches, p.14 | 10.1145/1186223.1186241 | Textures on a **double cone** around the viewer, scrolled and elongated with hardware texture transforms. Cone tilts with observer speed (MS Flight Simulator 2004). | Faster than particles, but no interaction with the environment and one texture per precipitation type (per Rousseau's review). |
| Starik & Werman, "Simulation of rain in videos" | Texture 2003 workshop at ICCV 2003 [U: venue from workshop front-pages listing, https://lear.inrialpes.fr/people/triggs/events/iccv03/cdrom/texture03/front-pages.html] | — | Separate rain from video using a difference mask and median background, then synthesise new rain matched to the original's statistics. Optional darkening. | Darkening variants **20% and 40%**. Tiers: "very weak / light / heavy". (https://www.cs.huji.ac.il/~werman/Papers/rain/rain.html) |
| Rousseau, Jolivet, Ghazanfarpour, "Realistic real-time rain rendering" | Computers & Graphics 30(4):507–518, Aug 2006 | 10.1016/j.cag.2006.03.013 | Billboard drops; refraction via a precomputed mask that looks up a wide-angle scene capture; streaks average several samples along the fall path. | ~5,000 particles for large drops or streaks; ≥10,000 for r<1 mm. >100 fps @5k on a GeForce 6800GT. Streak demo: 4,000 drops at 60 Hz. Retinal persistence 60–90 ms. Drop speed table (Ross 2000): r 0.1 mm → 0.72 m/s; 0.45 mm → 3.67; 0.5 mm → 4.0; 1.0 mm → 6.59; 2.0 mm → 8.91; ≥3 mm → ~9.23 m/s. Refraction gives a 150° FOV. (preprint: https://faculty.digipen.edu/~gherron/references/References/Modeling/Realistic-real-time-rain-rendering.pdf) |
| L. Wang, Z. Lin et al. (MSR Asia), "Real-time rendering of realistic rain" | SIGGRAPH 2006 sketch / MSR TR [U venue]; related patent US7692647 | https://zhouchenlin.github.io/Publications/2006-Real_time_Rain.pdf | Extract **rain stroke mattes from real video**, then put random mattes on GPU particles. Matte length is stretched to velocity × exposure. Z-buffer clips at surfaces. | 80,000 strokes at **77 fps** (GeForce 7800 GT); ~6 MB of stroke data. |
| Tatarchuk, "Artist-directable real-time rain rendering in city environments" (ATI ToyShop) | ACM SIGGRAPH 2006 Courses, p.23 | 10.1145/1185657.1185828; PDF https://advances.realtimerendering.com/s2006/Tatarchuk-Rain.pdf | See Q3 (most useful source). | Full rain ~31 ms/frame vs 15.7 ms without, on an X1900 XT. |
| Puig-Centelles, Ripollés, Chover, "Creation and control of rain in virtual environments" | The Visual Computer 25(11):1037–1052, 2009 | 10.1007/s00371-009-0366-9 (abstract: https://hgpu.org/?p=2089) | Define *where* it rains (rain areas), then manage particles inside them with multiresolution (number, location and size by view). All on the GPU. | No numbers in the abstract. |
| Puig-Centelles et al., "Optimizing the management and rendering of rain" | GRAPP 2009 | https://www.scitepress.org/Papers/2009/18018/18018.pdf | Elliptical rain container follows the camera, with no repositioning for turns <45°. Geometry-shader LOD replicates near drops ×6. "Close rain" vs "far rain". | 25,000 particles at **140 fps** vs Rousseau 95k at 74 fps and Tariq 167k at 66 fps (GeForce 8800 GT). 20k particles replicated to 140k rendered. |
| Creus & Patow, "R4: Realistic rain rendering in realtime" | Computers & Graphics 37(1–2):33–40, Feb 2013 | 10.1016/j.cag.2012.12.002 (https://dugi-doc.udg.edu/handle/10256/11986) | Particles spawned from an **artist storm map** (2D cloud map), with adaptive sampling near the viewer. GPU collision gives splashes. Streaks from precomputed images. Fog, halos and glows. | "virtually millions" of drops; no fps in the abstract. |
| Weber, Jolivet, Gilet, Ghazanfarpour, "A multiscale model for rain rendering in real-time" | Computers & Graphics 50:61–70, Aug 2015 | 10.1016/j.cag.2015.04.007 | **One parameter (rain intensity, mm/h)** drives both near-streak density and far attenuation through a shared drop-size distribution. | β_e = 0.312·I^0.67 km⁻¹ (see Q6). |
| Weber, Jolivet, Gilet, Nanko, Ghazanfarpour, "A phenomenological model for throughfall rendering in real-time" | Computer Graphics Forum 35(4):13–23 (EGSR 2016) | 10.1111/cgf.12945 (https://diglib.eg.org/handle/10.1111/cgf12945) | **Drips from tree canopies** modelled with a functional form per pixel, not per leaf. Distribution in time, space, drop size and tree species comes from forest-hydrology measurements. Precomputed "regeneration points" emit drips. | No numbers in the abstract. Thesis: Y. Weber, Univ. Limoges 2016, https://theses.fr/2016LIMO0109/abes |

### Inferences
- [I] **Wang & Wade's double cone becomes a 2D equivalent**: 2–3 full-screen tiled streak textures scrolled at different speeds and offsets (parallax layers). Cost is 1 quad per layer, independent of intensity. It cannot interact with the world, so pair it with a small "near" CPU-particle pool (Puig-Centelles' close/far split) for drops that land and splash on actual tiles.
- [I] **Puig-Centelles' "rain areas" + Creus & Patow's storm map** become a low-res **rain-intensity grid** (e.g. one cell per 8×8 tiles) that moves over the map. Streak density, splash spawn rate, wetting rate and fog all read from it, so local showers and dry patches come for free. This matches the snow study's exposure/shelter mask.
- [I] **Weber's one-knob design** suggests a single `rain_mm_h` uniform that drives streak count, splash rate, haze density (β formula), wetting speed and audio volume. It is a good architecture for intensity tiers.
- [I] **Throughfall:** under trees, rain does not stop. It turns into fewer, bigger, slower drips that keep going after the rain ends. Steal: in a tree's canopy footprint, swap streaks for occasional large drip-splash events, delayed 1–N min after rain stops.

---

## Q3. Tatarchuk / ToyShop 2006: the most transferable artist recipe

**Takeaway:** ToyShop made rain feel heavy with cheap image-space tricks. These were a scrolling composite rain layer, a white bias, lightning lightmaps, a recycled single splash animation, a puddle ripple sim, and blur-as-mist. Almost every piece maps to 2D. (Source for all [C]: https://advances.realtimerendering.com/s2006/Tatarchuk-Rain.pdf, DOI 10.1145/1185657.1185828)

### Cited findings
- [C] **Composite rain layer**: a full-screen quad with an animated 8-bit drop-placement texture, offset per frame by rain velocity × Δt. Several depth layers come from one fetch using a parallax parameter × per-drop random value. Artist controls: direction, speed, parallax, strength. Cost: **4.11 ms**. The author warns naive scrolling gives "strong repeating patterns".
- [C] **"Milk in the water"**: rain colour and opacity are biased toward white so it reads in dark areas. Lightning boosts rain glow and opacity.
- [C] **Lightning**: two 8-bit grayscale lightmaps pre-rendered from artist-chosen directions, packed into R and B. An intensity mix makes the flash seem to come from several directions. Cost: "1 additional texture fetch plus a couple of ALUs". During a strike, drop opacity is scaled by (1 − ½·lightning).
- [C] **Splashes**: one filmed milk-drop splash sequence reused for thousands of particles, varied by random size, transparency and u-flip.
- [C] **Splatters**: concentric expanding shells, 3.50 ms.
- [C] **Puddle ripples**: a **256×256 GPU height field**, wave equation by explicit Euler, with current/previous height in R/G. **Two passes** per frame were enough. Normals via Sobel. Drops are splatted as damped sine seeds. One shared sim is sampled by all puddles with per-object scale and rotation. 6.98 ms.
- [C] **Puddle placement**: a depth mask with no extra geometry. Drains use radial and concentric "wake" normal maps.
- [C] **Wet reflections**: lamp impostors are stretched toward the viewer and given a vertical blur, which makes streaky reflections. 8.74 ms.
- [C] **Mist and halos**: blurring the rain layer through post gives mist, and rain-textured "fin" quads give halos around silhouettes.
- [C] Budget: 5K–20K particles. Full rain ~31.25 ms/frame vs 15.71 ms without.

### Inferences (pixel)
- [I] Ripple sim: a **64×64 or 32×32 height field** in a ping-pong texture or on the CPU (2 bytes per cell). Explicit wave update: `h_new = (h_n + h_e + h_s + h_w)/2 − h_prev`, then `*= damping (≈0.97–0.99)`. Render as 2–3 palette bands by height threshold. Only tiles flagged "water" sample it, tiled or rotated per pond as in ToyShop. On WebGL2 a fragment-shader ping-pong between two RG8/R16F viewports is fine (no compute needed).
- [I] Lightning in 2D: precompute one "lit-from-sky" palette offset per tile type, or reuse the normal or height map. Flash = global palette shift for 2–4 frames plus 1–2 aftershocks. Brighten rain streaks during the flash (ToyShop does the reverse with opacity, but in pixel art brighter reads better). [I]
- [I] Splash: one 3–4 frame sprite, randomly flipped, with 1-pixel random size jitter. That is ToyShop's u-flip trick.

---

## Q4. Why wet things are darker (and when they aren't)

**Takeaway:** the physics says wetting **darkens diffuse porous materials** (sand, soil, cloth, unsealed wood, concrete) by roughly **10%–50%**. Light bright materials darken more, and already-dark materials barely change. Smooth or non-porous ones (metal, glazed tile, sealed stone) don't darken much but gain a **specular film**. Wetness is therefore a per-material *palette remap*: darker + more saturated for porous, plus a highlight for film.

### Papers
| Paper | Venue / year | DOI / URL |
|---|---|---|
| Lekner & Dorf, "Why some things are darker when wet" | Applied Optics 27(7):1278–1280, 1 Apr 1988 | 10.1364/AO.27.001278; PDF https://www.wgtn.ac.nz/scps/staff/pdf/darkerwhenwet.pdf |
| Jensen, Legakis & Dorsey, "Rendering of wet materials" | Rendering Techniques '99 (EGWR 1999), pp. 273–282, Springer | https://diglib.eg.org/handle/10.2312/EGWR.EGWR99.273-282 ; page https://graphics.ucsd.edu/~henrik/papers/rendering_wet_materials/ |
| Zhang & Voss, "Bidirectional reflectance study on dry, wet, and submerged particulate layers" | Applied Optics 45(34):8753–8763, 2006 | https://web3.physics.miami.edu/~voss/ken/RefPapers/056_ZV_AO_2006.pdf |
| Twomey, Bohren & Mergenthaler, "Reflectance and albedo differences between wet and dry surfaces" | Applied Optics 25(3), 1986 [U: page from search result only] | https://scilit.net/publications/34d7a43472aa84c72aff50a1c8aaed5f |
| Lagarde, "Water drop" blog series (Remember Me, Dontnod) | blog, Dec 2012 – Sep 2013 | Index via https://3dvf.com/actualite-5676-sebastien-lagarde-simulation-pluie-en-jeu-video-html/ (seblagarde.wordpress.com blocked by fetch allowlist) |

### Cited findings
- [C] Mechanism (Ångström, refined by Lekner & Dorf): light scattered by the rough surface hits the water–air interface beyond the critical angle and is **totally internally reflected** back to the surface. That gives another chance to be absorbed. Probability p = 1 − 1/n² ≈ **0.437** for water (corrected Fresnel average ≈ **0.475**). The water also reduces the index contrast at the grains, which increases absorption. Darkening is strongest when absorption is weak, i.e. for **bright materials**. (Lekner & Dorf PDF)
- [C] Measured albedo (Ångström data in Lekner & Dorf): **sand 0.182 → 0.091 wet (×0.50)**; **black mould 0.141 → 0.084 (×0.60)**.
- [C] Zhang & Voss: ooid sand (dry albedo ≈0.6) darkened only ~10%. **Volcanic black sand darkened 35%**, while another black sand barely changed. Translucent grains darken most, and rough grains darken more. Submerged sand was ~16% *brighter* than dry. Measured at 657 nm only, so no colour/saturation data.
- [C] Jensen et al.: wet materials "can look darker, brighter, or more specular" depending on material and view. Their model is a surface water-film reflection plus subsurface scattering of liquid inside the material.
- [C] Starik & Werman offer 20% / 40% global darkening as a "rainy video" look.
- [C/partial] Lagarde's series exists with these dates: 2a/2b dynamic rain (27 Dec 2012 / 3 Jan 2013), 3a/3b physically based wet surfaces (19 Mar / 14 Apr 2013), 4a reflecting wet world (8 Sep 2013). [U] From memory, not re-verified: 3b models wetness as porosity-driven albedo darkening plus roughness reduction, with puddles accumulating in height-map cavities first. Verify before quoting.

### Inferences (pixel)
- [I] Per-tile `wet` byte 0–255, same layout as the snow depth byte and acid liquid amount. Material table row: `darken_steps` (porous soil, sand, wood, cloth: 1–2 palette ramp steps; stone, cobble: 1; metal, glass: 0), `film_highlight` (metal, cobble, roof tile: yes), `saturate` (shift hue-ramp one step more saturated) [I, not in sources: the saturation claim is folk/artist knowledge].
- [I] Use the numbers as targets: wet sand/soil ≈ 50–60% of dry luminance, light stone ≈ 70–85%, dark materials ≈ 90–100%.
- [I] Dither between dry and wet palettes by the `wet` threshold, like the snow study's dither. Drying shrinks wet patches from their edges inward (thin edges dry first), which looks natural.

---

## Q5. Splashes and ripples: drop impact physics

**Takeaway:** a real raindrop splash on water (crown, then crater, then central Worthington jet) is **over in tens of milliseconds**, about 1–3 frames at 60 fps. The *rings* that spread afterward are what the eye actually reads. Rings move at least ~23 cm/s. Raindrops are not tear-shaped: small ones are spheres, big ones are "hamburger buns".

### Cited findings
- [C] Worthington's book "A Study of Splashes" (1908) was reviewed in Science 29(742):464–465 (1909), DOI 10.1126/science.29.742.464, with "197 illustrations from instantaneous photographs". Boys, "Drops and Splashes", Nature 78:666 (1908), DOI 10.1038/078666a0.
- [C] Yarin, "Drop impact dynamics: splashing, spreading, receding, bouncing…", Annual Review of Fluid Mechanics 38:159–192 (2006), DOI 10.1146/annurev.fluid.38.050304.092144 (verified citation; content not opened).
- [C] Regimes for drop impact on a deep pool (Murphy et al. 2015 as summarised by Wang et al., arXiv 2302.02728, 2023; JFM version: https://www.cambridge.org/core/product/EA1176C1DB539BBAB00F3EDA2FF151B9): coalescence (vortex ring), cavity + surface wave, **crater + crown rim** ejecting droplets, and high-energy splash with a thin canopy, bubble entrapment and a central jet.
- [C] Large raindrop case: 4.1 mm drop at **7.2 m/s** (≈81% of terminal), We ≈ 2,893. Crown max radius at **~3 ms**, neck-in ~12 ms, cavity max depth ~24 ms, central jet ~37 ms. One drop produces **≥2,000 micro-droplets**. (arXiv 2302.02728)
- [C] Capillary waves: max wavelength **1.73 cm**, min phase speed **≈23.1 cm/s**. Shorter ripples are *faster* and surface tension restores them. (https://www.britannica.com/science/capillary-wave)
- [C] Drop shape (USGS): radius <1 mm spherical; bigger = **hamburger-bun** (flattened base); at radius ~4–4.5 mm it turns into a parachute/bag and breaks up. (https://www.usgs.gov/media/images/raindrop-shape-determined-drop-size-and-air-resistance) The Beard–Chuang cosine-distortion shape model is used by Garg_TR04 and Rousseau.

### Inferences (pixel)
- [I] Splash on water = **1 frame of a 3–5 px "crown"** (a ring of 4–6 pixels), then optionally 1 frame of a central 1–2 px jet pixel, then a ring sprite expanding. At 32 px/m, 23 cm/s ≈ **7 px/s** minimum. Rings at 0.25–0.4 m/s give **8–13 px/s**, so a ring that fades at radius 6–8 px lives about **0.5–1 s**. Faster or larger rings for heavy drops.
- [I] Splash on hard ground (stone, roof) = 2–3 frame crown sprite + 2–4 secondary droplet pixels flung 2–6 px. On soft ground (grass, mud) = smaller and darker, with almost no crown. Sand/dirt: optionally 1 frame of a darker crater dot.
- [I] Puddle "surface roughness" at high intensity: so many rings overlap that the surface becomes noise. Switch from discrete rings to a noisy dither of the 2–3 ripple palette bands when `rain_mm_h` > ~25.
- [I] Do NOT draw tear-shaped drops anywhere (UI icons excepted, for readability).

---

## Q6. Rain + fog: rain haze from extinction (fog interaction requirement)

**Takeaway:** the many drops too small or far to see individually act as fog. A published one-parameter formula links **rain rate to extinction**, so the "rain haze" density of a storm can be driven directly from the intensity tier.

### Cited findings
- [C] Extinction from rain: **β = 0.312 · R^0.67 km⁻¹** (R in mm/h). Weber thesis examples: **2 mm/h → 0.50 km⁻¹; 5 → 0.92; 25 → 2.70; 75 → 5.63 km⁻¹**. Marshall–Palmer constants used: N₀ = 8000 m⁻³mm⁻¹, Λ = 4.1·I^−0.21 mm⁻¹. A 5 mm drop falls at ~10 m/s. (https://theses.fr/2016LIMO0109/abes)
- [C] Tremblay/Halder use the same law per pixel: L_ext = e^(−0.312·R^0.67·d), plus airlight = HG phase × E_sun × (1 − L_ext). Augmentation rates **0, 5, 25, 50, 100, 200 mm/h**, from "very light (5 mm/h)" to "very heavy storms (200+)". Venue: IJCV 129(2):341–360, 2021 (online Sep 2020), DOI 10.1007/s11263-020-01366-3; ICCV 2019 version DOI 10.1109/ICCV.2019.01030. (https://arxiv.org/abs/2009.03683)
- [C] Visibility uses a 2% contrast threshold → V = ln(50)/β ≈ **3.912/β** (Koschmieder). Fog is <1 km, mist 1–2 km, haze 2–5 km. (https://en.wikipedia.org/wiki/Visibility)
- [C] Tatarchuk: blurring the rain layer through post-processing gives mist, plus glow and halos around lights.

### Derived [I]
| Rain rate | β (km⁻¹) | Visibility 3.912/β |
|---|---|---|
| 2 mm/h (light) | 0.50 | ~7.8 km |
| 5 mm/h (moderate) | 0.92 | ~4.3 km |
| 25 mm/h (heavy) | 2.70 | ~1.45 km |
| 75 mm/h (very heavy) | 5.63 | ~0.69 km (fog-grade) |
| 200 mm/h (cloudburst) | ~10.9 | ~0.36 km |

- [I] A top-down screen spans only ~20–40 m, so physical extinction is negligible at that scale. The papers justify the *ordering and ratios*, not the absolute amount. Map β to a **haze overlay alpha / palette-lift amount**: e.g. alpha ≈ 0, 2, 6, 12, 20% across tiers, roughly proportional to R^0.67, and add a slow-scrolling 1-bit dithered noise mask. That is Tatarchuk's "blurred rain = mist" done as dither.
- [I] Post-rain ground mist (evaporation), as a fog interaction: when rain stops and `wet` is high on warm tiles, spawn a low-alpha mist mask proportional to `wet × warmth` that decays as tiles dry. It needs no new data, just the wet grid.

---

## Q7. Ground water budget: infiltration, puddles, drying (real-world reference data)

**Takeaway:** whether water pools depends on rain rate vs soil infiltration. Clay saturates fast (1–5 mm/h) and puddles in moderate rain. Sand (>30 mm/h) almost never puddles. Paved surfaces don't infiltrate at all, so puddles form only in low spots. Drying data are thin; evaporation is limited by how much water sits near the surface.

### Cited findings
- [C] FAO basic infiltration rates (mm/h): **sand >30** (the table says "less than 30" but sand has the highest rate; likely an extraction slip, so treat sand as ≥30 [I]), **sandy loam 20–30, loam 10–20, clay loam 5–10, clay 1–5**. (https://www.fao.org/3/s8684E/s8684e0a.htm)
- [C] Qin & Hiller 2016, Construction and Building Materials 111:77–84, DOI 10.1016/j.conbuildmat.2016.02.063: near-surface water availability dominates pervious-concrete evaporation. A rewetted surface stays cooler (i.e. still evaporating) for ~**12–24 h** on a hot summer day. (https://digitalcommons.mtu.edu/michigantech-p/6206)
- [C] Wang, Mucha & Turk, "Water drops on surfaces", SIGGRAPH 2005 / ACM TOG (DOI 10.1145/1073204.1073284 per unpaywall link): material-dependent **contact angle** decides beading vs flattened drops. (https://wanghmin.github.io/Wang-2005-WDS/Wang-2005-WDS.htm)

### Inferences (pixel)
- [I] Per-tile water budget each tick: `wet += rain_rate·exposure − infiltration[mat] − evap(sun, wind, shade)`. Overflow above a material capacity becomes `puddle` (standing water) in local height minima. Infiltration table in "game mm/h": paved/stone/roof 0, clay 3, loam 15, sandy 25, sand 40. Light rain (2 mm/h) then puddles only on paving and clay, and storms (25+) puddle loam too, which gives a readable, physical-feeling hierarchy.
- [I] Drying: evaporation rate × (1 + wind) × (sun ? 2 : 1) × (shade ? 0.5 : 1). Thin films (wet but no puddle) dry in game-minutes and puddles in game-hours. Map a 12–24 h real "fully dry" figure to e.g. 3–6 in-game hours. Porous materials (wood, soil, cloth) should hold wetness longer than stone [I, no numbers found].
- [I] Beading: metal, waxed cloth, leaves get 1-px highlight droplets (high contact angle). Cotton, wood, soil soak in, so they darken instead (low contact angle).

### Gaps
- No verified per-material drying times (wood, asphalt, concrete, cloth) were found. Asphalt and pavement search results were commercial or unreliable. A Wikipedia pan-evaporation page was blocked by the fetch allowlist. Typical figures (several mm/day of potential evaporation) are from memory [U].

---

## Q8. Other items requested

- **Nakamae et al. 1990** [C]: the verified rain/wet-road paper is "A lighting model aiming at drive simulators", SIGGRAPH '90, Computer Graphics 24(4):395–404, DOI 10.1145/97880.97922 (Nakamae, Kaneda, Okamoto, Nishita). Companion: Kaneda et al., "Highly realistic visual simulation of outdoor scenes under various atmospheric conditions", CG International '90, pp. 117–131, DOI 10.1007/978-4-431-68123-6_8. [U] From memory, the 1990 SIGGRAPH paper models wet road surfaces/puddle reflections and rain for night driving. The title "Rendering of landscapes for environmental assessment" is a different (1980s) Nakamae paper and was not verified.
- **Tariq 2007 (NVIDIA SDK "Rain")** [U]: cited in Puig-Centelles' table (167k particles at 66 fps). Uses Garg & Nayar's streak database on GPU particles. PDF candidate: https://classes.cs.uchicago.edu/archive/2022/fall/23700-1/papers/gpu-rain.pdf (not opened).
- **Rainbow 42°** [U, not researched]: low relevance for top-down. It would only be a screen-space arc on a post-storm sunny transition.
- **2018–2026 CV rain synthesis** [C]: Halder/Tremblay (ICCV 2019, IJCV 2021) above. Search also surfaced AutoWeather4D (arXiv 2603.26546, 2026) doing G-buffer weather editing [U, not opened]. CV de-raining work (e.g. "Removing rain streaks by a linear model", arXiv 1812.07870) is low relevance for games.
- **Twomey et al. 1986** [U]: only a search listing was seen. It is the classic optics paper alongside Lekner & Dorf; Zhang & Voss say neither model alone predicts wet albedo when grains are translucent.

---

## "What to steal" — one line each

1. **Garg & Nayar 2004–07:** rain = short streaks that are *always brighter than the background*, length = speed × exposure. Draw a 1 px streak as palette +1 step.
2. **Garg & Nayar 2006 streak DB:** oscillation beads, so give each streak sprite one random brighter pixel. 10 variants were enough for the database, and 2–3 are enough at pixel scale.
3. **Wang & Wade 2004:** world-independent scrolling textures around the viewer become 2–3 parallax-scrolled screen layers. Cost does not grow with intensity.
4. **Starik & Werman 2003:** a global 20–40% darkening sells "rain" by itself.
5. **Rousseau 2006:** use the drop speed table (0.7 m/s drizzle → ~9 m/s big drops) to make tiers *move* differently, not just denser.
6. **Tatarchuk 2006:** white-biased rain, one recycled splash animation with flips, a shared tiled ripple sim, blur/dither as mist, 2-lightmap lightning.
7. **Puig-Centelles 2009:** a rain area that follows the camera, with near drops as particles and far drops as texture.
8. **Creus & Patow 2013:** an artist-painted storm map gives a coarse rain-intensity grid that drives everything.
9. **Weber 2015:** a single `rain_mm_h` knob, with β = 0.312·R^0.67 driving haze.
10. **Weber 2016 throughfall:** under trees, big, sparse drips that continue after the rain stops.
11. **Lekner & Dorf / Zhang & Voss:** porous and bright materials darken up to ~50%, dark ones barely. Use a per-material darken-steps table.
12. **Jensen 1999:** two wetness kinds. *Soaked* means darker, *film* means a specular highlight. Separate flags per material.
13. **Drop-impact physics:** the crown lasts 1 frame and rings are the real signal, at ≥23 cm/s (≈7+ px/s at 32 px/m).
14. **USGS shape:** never tear-shaped. A pixel drop is a dot or a streak.
15. **FAO infiltration:** a per-material infiltration rate decides where puddles form (clay and paving first, sand never).

---

## Sources
- Garg & Nayar CVPR 2004: https://doi.org/10.1109/CVPR.2004.1315077
- Garg & Nayar ICCV 2005: https://mlanthology.org/iccv/2005/garg2005iccv-camera
- Garg & Nayar TOG 2006: https://doi.org/10.1145/1141911.1141985 ; https://history.siggraph.org/?p=113590
- Garg & Nayar IJCV 2007: https://doi.org/10.1007/s11263-006-0028-6
- Garg & Nayar photometric TR: https://www.cs.columbia.edu/CAVE/publications/pdfs/Garg_TR04.pdf
- CAVE camera rain project: https://cs.columbia.edu/CAVE/projects/camera_rain/camera_rain.php
- CAVE rain streak DB: https://www.cs.columbia.edu/CAVE/databases/rain_streak_db/rain_streak.php
- Wang & Wade 2004: https://doi.org/10.1145/1186223.1186241 ; https://history.siggraph.org/?p=93028
- Starik & Werman: https://www.cs.huji.ac.il/~werman/Papers/rain/rain.html ; https://lear.inrialpes.fr/people/triggs/events/iccv03/cdrom/texture03/front-pages.html
- Rousseau et al. 2006: https://doi.org/10.1016/j.cag.2006.03.013 ; https://faculty.digipen.edu/~gherron/references/References/Modeling/Realistic-real-time-rain-rendering.pdf
- L. Wang, Lin et al. 2006: https://zhouchenlin.github.io/Publications/2006-Real_time_Rain.pdf
- Tatarchuk 2006: https://doi.org/10.1145/1185657.1185828 ; https://advances.realtimerendering.com/s2006/Tatarchuk-Rain.pdf
- Puig-Centelles et al. 2009 (TVC): https://doi.org/10.1007/s00371-009-0366-9 ; https://hgpu.org/?p=2089
- Puig-Centelles et al. 2009 (GRAPP): https://www.scitepress.org/Papers/2009/18018/18018.pdf
- Creus & Patow 2013: https://doi.org/10.1016/j.cag.2012.12.002 ; https://dugi-doc.udg.edu/handle/10256/11986
- Weber et al. 2015: https://doi.org/10.1016/j.cag.2015.04.007
- Weber et al. 2016: https://doi.org/10.1111/cgf.12945 ; https://diglib.eg.org/handle/10.1111/cgf12945
- Weber thesis 2016: https://theses.fr/2016LIMO0109/abes
- Halder et al. ICCV 2019: https://doi.org/10.1109/ICCV.2019.01030 ; Tremblay et al. IJCV 2021: https://doi.org/10.1007/s11263-020-01366-3 ; https://arxiv.org/abs/2009.03683
- Lekner & Dorf 1988: https://doi.org/10.1364/AO.27.001278 ; https://www.wgtn.ac.nz/scps/staff/pdf/darkerwhenwet.pdf
- Jensen, Legakis, Dorsey 1999: https://diglib.eg.org/handle/10.2312/EGWR.EGWR99.273-282 ; https://graphics.ucsd.edu/~henrik/papers/rendering_wet_materials/
- Zhang & Voss 2006: https://web3.physics.miami.edu/~voss/ken/RefPapers/056_ZV_AO_2006.pdf
- Twomey et al.: https://scilit.net/publications/34d7a43472aa84c72aff50a1c8aaed5f
- Lagarde series index: https://3dvf.com/actualite-5676-sebastien-lagarde-simulation-pluie-en-jeu-video-html/
- Nakamae et al. 1990: https://doi.org/10.1145/97880.97922 ; Kaneda et al. 1990: https://doi.org/10.1007/978-4-431-68123-6_8
- Worthington review: https://doi.org/10.1126/science.29.742.464 ; Boys 1908: https://doi.org/10.1038/078666a0
- Yarin 2006: https://doi.org/10.1146/annurev.fluid.38.050304.092144
- Drop impact on deep pool: https://ar5iv.labs.arxiv.org/html/2302.02728 ; https://www.cambridge.org/core/product/EA1176C1DB539BBAB00F3EDA2FF151B9
- Capillary waves: https://www.britannica.com/science/capillary-wave
- USGS raindrop shape: https://www.usgs.gov/media/images/raindrop-shape-determined-drop-size-and-air-resistance
- Visibility / Koschmieder: https://en.wikipedia.org/wiki/Visibility
- FAO infiltration: https://www.fao.org/3/s8684E/s8684e0a.htm
- Qin & Hiller 2016: https://digitalcommons.mtu.edu/michigantech-p/6206
- Wang, Mucha, Turk 2005: https://wanghmin.github.io/Wang-2005-WDS/Wang-2005-WDS.htm
- Tariq (NVIDIA) candidate PDF: https://classes.cs.uchicago.edu/archive/2022/fall/23700-1/papers/gpu-rain.pdf
