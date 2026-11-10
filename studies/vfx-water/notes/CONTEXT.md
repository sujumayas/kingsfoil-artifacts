# Shared context for all BODIES OF WATER researchers

## The user and project
- Indie game dev (Kingsfoil Studios). Godot 4 games, web-first (=> Compatibility/WebGL2 renderer: no compute shaders, limited 2D lights), also mobile/desktop. Small team; must run WITHOUT a big computer.
- Target look: TOP-DOWN (3/4) pixel art. Tibia-like MMORPG "Asterion Online" (server-authoritative, tile grid of 32x32 tiles, many players see the same sea) and a top-down RPG. 2D tiles/sprites, low-res (sandbox is 320x180), palette-limited.
- Tibia itself has a lot of water: animated sea and shallow-water tiles, coast/shore borders, swamps, rivers, waterfalls, fishing (fishing rod on water tiles, fish chance), boats/ship travel by NPC, swimming not allowed (water blocks walking, except shallow water), water elementals, "drowning" condition underwater (Calassa / helmet of the deep). Research its rules, tile animation counts and numbers.
- Series "one concept per study" on simple, super-efficient, old-school VFX algorithms. Series reference: the DOOM PSX fire (Fabien Sanglard: https://fabiensanglard.net/doom_fire_psx/).
- Previous studies (reuse, compare, do not repeat at length):
  - #1 Snow (palette lighting, dithered lamp pools): https://kingsfoil-artifacts.netlify.app/vfx-snow-topdown-pixel
  - #2 Acid (glow via block-sum blur + palette select, bubbling pools): https://kingsfoil-artifacts.netlify.app/vfx-acid-topdown-pixel
  - #3 Rain (puddles as depth mask vs flood level, puddle flow, splashes per surface, Hugo Elias two-buffer ripples, ring decals, puddle reflections): https://kingsfoil-artifacts.netlify.app/vfx-rain-topdown-pixel
  - #4 Forest (shade ellipses, sunflecks, canopy, wind): https://kingsfoil-artifacts.netlify.app/vfx-forest-topdown-pixel
  - #5 Light (Tibia light model, flicker, shadow maps, carried torches): https://kingsfoil-artifacts.netlify.app/vfx-light-topdown-pixel
  - #6 Fire & smoke (DOOM fire, tile fire spread, smoke field, steam where water meets fire, lava): https://kingsfoil-artifacts.netlify.app/vfx-fire-topdown-pixel
  Puddles and the two-buffer ripple algorithm are already covered by #3 Rain: mention and link, then go further (ripples at sea/lake scale, wakes, interaction with bodies of water). Steam and lava are covered by #6.

## THIS study #7: BODIES OF WATER. Scope (the user wants depth on all four):
1. SHORELINES AND COASTS: water-to-land autotiling (blob/47-tile, Wang 2-corner/16-tile, marching squares, dual-grid), animated foam edges and shore lines, waves lapping on sand (wave lines that run up and retreat), wet sand band, tides (server-driven water level?), cliffs vs beaches, coast generation from a heightmap, distance-to-shore fields (signed distance / BFS) driving foam and colour.
2. RIVERS AND FLOW: flow maps (Valve's flow map technique, two-phase blending to hide the reset), scrolling tiles, direction-per-tile flow in tile engines, waterfalls (scrolling strips, mist/spray at the base), rapids and white water, currents that push players/items/boats, river generation (downhill, accumulation), bridges and fords.
3. LAKES, SEA AND DEPTH: deep vs shallow palettes and depth bands, palette cycling/colour cycling water (Mark Ferrari, Amiga, SNES), animated tile frames (frame counts, fps), caustics (cheap Voronoi/noise caustics, scrolling caustic textures), specular sparkles/glints, reflections of trees/buildings/characters in top-down 3/4 (flipped sprites, wobble), swamp and pond variants (lily pads, murky water), underwater look (tint, wobble), sea horizon in top-down, open-ocean swell.
4. INTERACTION: ripples at sea/lake scale and wakes behind walkers, swimmers and boats (Kelvin wake 19.47 deg angle, V-wake), wading (sprite clipped at the waterline plus a ring), swimming states, splashes when things fall in, fishing (bobber, bite ripple), boats and rafts, items floating and drifting, buoyancy bobbing, footstep rings in shallow water, creatures surfacing, server-side water rules (walkable shallow, blocking deep, drowning).

- Goal: the MOST EFFICIENT and REALLY GOOD (artist/player validated) ideas.
- Final output: technique profiles ("In plain words", "How it works (technical)", "Cost/performance", "Games that used it" (URL), "How it feels", "Risks") plus playable canvas demos. Collect concrete algorithms, pseudocode-level details, numbers, parameters (tile counts, frame counts, fps, palette sizes and colour counts, scroll speeds in px/s, wave periods, flow map resolutions, ripple damping, wake angles).
- Rating criteria for the study: Simplicity · Speed · Pixel taste · Mood · Interactivity.

## Rules for every researcher
- Cite a URL for every claim; include concrete numbers (ms, counts, ranges, rates, frame counts, palette sizes, versions, dates).
- Separate cited findings from inferences; list gaps honestly. Flag vendor-reported figures.
- Never copy/download images. For every game example collect a "see it in action" reference URL (wiki page, article, devlog or video page).
- Quotes under 15 words.
- If a site is blocked, note it and try mirrors (archive.org, github README, author pages, wikis).
- Notes structure: per key question -> Takeaway / Cited findings / Inferences / Gaps. End with "Sources".
- Stop at about 25-35 tool calls. Save notes as markdown to the given path, then reply with a SHORT summary (<=200 words).
