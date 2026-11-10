# Shared context for all FOG, MIST AND CLOUDS researchers

## The user and project
- Indie game dev (Kingsfoil Studios). Godot 4 games, web-first (=> Compatibility/WebGL2 renderer: no compute shaders, limited 2D lights), also mobile/desktop. Small team; must run WITHOUT a big computer.
- Target look: TOP-DOWN (3/4) pixel art. Tibia-like MMORPG "Asterion Online" (server-authoritative, tile grid of 32x32 tiles, many players share the same weather) and a top-down RPG. 2D tiles/sprites, low-res (sandbox is 320x180), palette-limited.
- Tibia itself: research how Tibia handles darkness/visibility (fixed 15x11 visible tile window, floors above hidden, no real fog of war), any fog/mist/cloud effects in Tibia or OTClient (weather, "fog" in some areas, ambient light), and what other MMOs do (Ultima Online, RuneScape/OSRS fog, Albion, Lineage).
- Series "one concept per study" on simple, super-efficient, old-school VFX algorithms. Series reference: the DOOM PSX fire (Fabien Sanglard: https://fabiensanglard.net/doom_fire_psx/).

## THE TWO MAIN GOALS (equal weight, the user stressed both)
1. ARTISTIC QUALITY: what makes fog and clouds look beautiful and moody in pixel art, validated by artists and players (palette choices, dithering vs alpha, banding, motion speed, layering, readability of gameplay under fog). Find artist sources and praised games.
2. RUNTIME EFFICIENCY: what each technique really costs on low-end web (Godot Compatibility/WebGL2, mobile). Collect MEASURED numbers wherever they exist (ms per frame, fill rate, texture fetches per pixel, overdraw, grid sizes, update rates, bytes on the network). Mark estimates as estimates. Prefer techniques that are cheap AND beautiful; call out pretty-but-expensive and cheap-but-ugly.

## Previous studies (reuse, compare, do not repeat at length)
- #1 Snow (palette lighting, dithered lamp pools): https://kingsfoil-artifacts.netlify.app/vfx-snow-topdown-pixel
- #2 Acid (glow via block-sum blur + palette select): https://kingsfoil-artifacts.netlify.app/vfx-acid-topdown-pixel
- #3 Rain (rain haze and spray mist from an intensity knob, post-rain evaporation mist): https://kingsfoil-artifacts.netlify.app/vfx-rain-topdown-pixel
- #4 Forest (shade ellipses, sunflecks, canopy, wind): https://kingsfoil-artifacts.netlify.app/vfx-forest-topdown-pixel
- #5 Light (Tibia light model, day/night, cloud shadows briefly in B4, shadowcasting and visibility polygons, low-res light map, DrawableTexture2D): https://kingsfoil-artifacts.netlify.app/vfx-light-topdown-pixel
- #6 Fire & smoke (smoke field advection, Bayer-dithered smoke, smoke blocking line of sight, steam): https://kingsfoil-artifacts.netlify.app/vfx-fire-topdown-pixel
- #7 Water (shorelines, rivers, depth, waterfall mist): https://kingsfoil-artifacts.netlify.app/vfx-water-topdown-pixel
Link these where they overlap and go further. FOV algorithms (shadowcasting) were covered by #5: reuse them as the input to fog of war, don't re-derive them.

## THIS study #8: FOG, MIST AND CLOUDS. Scope (the user wants depth on all four):
1. GROUND FOG AND MIST: valley fog, morning mist that burns off, swamp haze, height-based fog in 3/4 view (fog pooling in low tiles via a height map), drifting fog banks (scrolling tileable noise, domain warping, layered parallax), fog that parts around the player/torches (displacement or a clearing mask), fog density fields on a coarse grid, fog with wind (link to Fire's advection), dithered fog vs alpha fog, palette-mapped fog.
2. CLOUDS AND CLOUD SHADOWS: cloud shadows sliding over the map (noise threshold, shadow texture scroll, matching to weather), overhead clouds and parallax cloud layers (flying over, fading near the camera), weather fronts and cloud cover as server state, the classic look in SNES/GBA games (Mode 7 clouds, HDMA, Secret of Mana / FF6 / Zelda overlays), Stardew/Pokémon fog overlays.
3. FOG OF WAR: unknown / explored / visible states, soft edges (blur, dither, marching squares, upscaled low-res mask), reveal animations, RTS classics (Warcraft II, StarCraft, Age of Empires, C&C) and their tile rules, roguelike memory (remembered tiles drawn dim), MMO rules (server decides what each client may see: interest management, anti-maphack), cost per update for many units, team-shared vision. Link #5 for the FOV algorithm.
4. ATMOSPHERE AND DEPTH: haze and aerial perspective in 2D (distance or height tint), god rays/light shafts through fog and canopy (screen-space radial blur vs pre-drawn shafts), dust motes, fog with torches and night (lights glowing inside fog, halos), indoor/cave mist, pollution/smog, magical fog (spells that create fog clouds and block vision, e.g. smoke bombs, Tibia-like fields).

- Final output: technique profiles ("In plain words", "How it works (technical)", "Cost/performance", "Games that used it" (URL), "How it feels", "Risks") plus playable canvas demos. Collect concrete algorithms, pseudocode-level details, numbers, parameters (noise octaves, texture sizes, scroll speeds px/s, dither matrices, mask resolutions, update rates, ms costs).
- Rating criteria for the study: Simplicity · Speed · Pixel taste · Mood · Interactivity.

## Rules for every researcher
- Cite a URL for every claim; include concrete numbers (ms, counts, ranges, rates, frame counts, palette sizes, versions, dates).
- Separate cited findings from inferences; list gaps honestly. Flag vendor-reported figures.
- Never copy/download images. For every game example collect a "see it in action" reference URL (wiki page, article, devlog or video page).
- Quotes under 15 words.
- Many fan wikis (TibiaWiki, Fandom) return 402/403 and archive.org may be blocked: go to open-source code instead (OTClient, TFS/Canary, decompilation projects like pokeemerald/pokecrystal/zelda3, OpenRA, Stratagus, OpenAge, Spring RTS, roguelike sources), GitHub READMEs, author pages.
- Notes structure: per key question -> Takeaway / Cited findings / Inferences / Gaps. End with "Sources".
- Stop at about 25-35 tool calls. Save notes as markdown to the given path, then reply with a SHORT summary (<=200 words).
