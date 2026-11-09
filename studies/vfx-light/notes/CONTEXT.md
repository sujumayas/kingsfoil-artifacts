# Shared context for all LIGHT & SHADOW researchers

## The user and project
- Indie game dev (Kingsfoil Studios). Godot 4 games, web-first (=> Compatibility/WebGL2 renderer: no compute, limited 2D lights), also mobile/desktop. Small team; must run WITHOUT a big computer.
- Target look: TOP-DOWN (3/4) pixel art (Tibia-like MMORPG "Asterion Online", top-down RPG). 2D tiles/sprites, low-res, palette-limited. (Tibia itself has a classic light system: light radius/intensity per item & creature, darkness at night, light sources like torches with "light level" values — research it.)
- Series "one concept per study" on simple, super-efficient, old-school VFX/rendering algorithms (reference: DOOM PSX fire; also DOOM's sector light levels & COLORMAP). Previous studies (reuse/compare): #1 Snow (palette lighting, dithered lamp pools), #2 Acid (glow via block-sum blur + palette select), #3 Rain (lightning flash palettes, firelight), #4 Forest (shade ellipses, sunflecks, canopy).
  URLs: https://kingsfoil-artifacts.netlify.app/vfx-snow-topdown-pixel , /vfx-acid-topdown-pixel , /vfx-rain-topdown-pixel , /vfx-forest-topdown-pixel
- THIS study #5: LIGHT AND SHADOWS. SCOPE:
  - SUN & SKY: day/night cycle, sun direction/height, shadow length & direction over the day, golden hour, dusk/dawn tints, moonlight, overcast, ambient vs direct, colour temperature over the day.
  - ARTIFICIAL LIGHT: torches, campfires, braziers, candles, lanterns, street lamps, magic light (crystals, runes, spells), glowing mushrooms/fireflies, windows at night, forges, lava; light that you HOLD/CARRY (torch, lantern, light spells) — radius, flicker, cone vs radial, fuel/duration.
  - COLOUR & PERSONALITY of light: warm vs cold, flicker patterns (fire vs candle vs electric vs magic), pulsing, colour mixing, palette-based light (LUTs/colormaps), mood.
  - OBJECT INTERACTION: NATURE (trees, grass, rocks, water — shade, canopy, reflections, rim light), DECORATIONS (fences, barrels, signs, statues), BUILDINGS (cast shadows, interior light spilling through doors/windows, roofs, walls occluding light, light inside vs outside); drop shadows vs projected shadows vs raycast/occluder shadows; field of view/visibility (roguelike FOV), fog of war tied to light.
  - CHEAP TECHNIQUES: palette/LUT lighting (DOOM COLORMAP), light maps at low res, tile light levels (Minecraft/Terraria flood-fill lighting!), additive light textures (multiply/darkness overlay "light2d texture"), normal maps for pixel art (Sprite Lamp, Eastward, Sea of Stars), 2D shadow casting (line-of-sight polygons, ShadowCaster2D, Godot LightOccluder2D + PointLight2D), dithered light falloff, SDF shadows, baked vs dynamic, performance budgets.
- Goal: the MOST EFFICIENT and REALLY GOOD (artist/player validated) ideas.
- Final output: technique profiles ("In plain words", "How it works (technical)", "Cost/performance", "Games that used it" (URL), "How it feels", "Risks") plus playable canvas demos. Collect concrete algorithms, pseudocode-level details, numbers, parameters.

## Rules for every researcher
- Cite a URL for every claim; include concrete numbers (radii, light levels, colour temps (K), flicker Hz, ms, texture sizes, versions, dates).
- Separate cited findings from inferences; list gaps honestly. Flag vendor-reported figures.
- Never copy/download images. For every game example collect a "see it in action" reference URL (wiki page, article, devlog or video page).
- Quotes under 15 words.
- If a site is blocked, note it and try mirrors (archive.org, github README, author pages).
- Notes structure: per key question -> Takeaway / Cited findings / Inferences / Gaps. End with "Sources".
- Stop at about 25–35 tool calls. Save notes as markdown to the given path, then reply with a SHORT summary (<=200 words).
