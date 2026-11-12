# Shared context for all GRASS, WIND AND SMALL LIFE researchers

## The user and project
- Indie game dev (Kingsfoil Studios). Godot 4 games, web-first (=> Compatibility/WebGL2 renderer: no compute shaders, limited 2D lights), also mobile/desktop. Small team; must run WITHOUT a big computer.
- Target look: TOP-DOWN (3/4) pixel art. Tibia-like MMORPG "Asterion Online" (server-authoritative, tile grid of 32x32 tiles, many players walk through the same fields) and a top-down RPG. 2D tiles/sprites, low-res (sandbox is 320x180), palette-limited.
- Tibia/OT: research how Tibia and OTClient/TFS/Canary handle grass (grass ground tiles, tall grass / bush items, any animated ground, any "trampled" or cut state, decay timers that regrow items), plus other MMOs (Ultima Online, RuneScape/OSRS, Albion, Lineage, Graal).
- Series "one concept per study" on simple, super-efficient, old-school VFX algorithms. Series reference: the DOOM PSX fire (Fabien Sanglard: https://fabiensanglard.net/doom_fire_psx/).

## THE TWO MAIN GOALS (equal weight, the user stressed both)
1. ARTISTIC QUALITY: what makes grass, wind and small creatures look alive and beautiful in pixel art, validated by artists and players (tile variation, clumps, palette ramps, sway amplitude in whole pixels, motion speed, gust readability, creature motion that reads as "alive" not "random", restraint). Find artist sources and praised games.
2. RUNTIME EFFICIENCY: what each technique really costs on low-end web (Godot Compatibility/WebGL2, mobile). Collect MEASURED numbers wherever they exist (ms per frame, draw calls, instance counts, overdraw, texture sizes, update rates, bytes on the network). Mark estimates as estimates. Prefer techniques that are cheap AND beautiful; call out pretty-but-expensive and cheap-but-ugly.

## Previous studies (reuse, compare, do not repeat at length)
- #1 Snow (palette lighting, snow cover): https://kingsfoil-artifacts.netlify.app/vfx-snow-topdown-pixel
- #2 Acid (glow via block-sum blur + palette select): https://kingsfoil-artifacts.netlify.app/vfx-acid-topdown-pixel
- #3 Rain (wet ground, splashes, intensity knob): https://kingsfoil-artifacts.netlify.app/vfx-rain-topdown-pixel
- #4 Forest: https://kingsfoil-artifacts.netlify.app/vfx-forest-topdown-pixel . ALREADY COVERED: tree sway as integer row/band offsets (D1), travelling gusts and per-species stiffness (D2), edge-band colour cycling (D3), falling leaves (D4), undergrowth rustle on walk-through (E4), perched birds with flee distance (F1), boids in flight (F2), MultiMesh vs y-sort, per-instance uniforms, season palette swap (C1), Shattered Pixel Dungeon high grass trampling (briefly). Reuse and link these; go much deeper on GRASS and SMALL LIFE.
- #5 Light (Tibia light model, day/night, low-res light map, glow): https://kingsfoil-artifacts.netlify.app/vfx-light-topdown-pixel
- #6 Fire & smoke (fire spread on a grid with fuel/moisture/wind, smoke advection): https://kingsfoil-artifacts.netlify.app/vfx-fire-topdown-pixel
- #7 Water (shorelines, rivers): https://kingsfoil-artifacts.netlify.app/vfx-water-topdown-pixel
- #8 Fog (noise tables, wind advection field, world-locked dither, server weather state, measured costs): https://kingsfoil-artifacts.netlify.app/vfx-fog-topdown-pixel
- Game feel #3 Loot and pickup: https://kingsfoil-artifacts.netlify.app/feel-loot-pickup-topdown-pixel

## THIS study #9: GRASS, WIND AND SMALL LIFE. Scope (the user wants depth on all of it):
1. GRASS RENDERING: grass ground tiles and variation (anti-grid tricks, Wang/blob autotiles grass-to-dirt, decals, clumps), tufts and blades as sprites vs a grass layer drawn by a shader, tall grass that overlaps the character (lower body hidden, Pokémon style), y-sorting, flower and weed scatter, density maps.
2. WIND AND SWAYING FIELDS: per-tuft sway in whole pixels, shear/skew shaders, scrolling wind noise textures, travelling gust waves across a field (the "wave through wheat" look), wind direction and strength from a global (server) weather state, stiffness per species, pixel-snapping so sway never smears. Link Forest D1/D2 and Fog's wind field.
3. TRAMPLING AND INTERACTION: grass bending away from the player and NPCs, displacement/trail textures (a low-res "interaction map" stamped by every walker), flattened grass that recovers over seconds, persistent footpaths that form over days where many players walk (desire paths), rustle particles and sound, critters flushed out.
4. CUTTING, BURNING, GRAZING AND REGROWTH: cuttable grass (Zelda, Stardew scythe, drops), burning (link Fire), grazing animals, regrowth timers and spread rules (Minecraft random ticks, cellular automata), what an MMO server must store and send (per-tile state bytes, decay timers, Tibia/TFS item decay), bandwidth when many players trample the same field.
5. HIDING IN TALL GRASS: stealth and sight blocking (League of Legends brush rules, Shattered Pixel Dungeon high grass blocking FOV, Pokémon encounter grass, Zelda), how to render a hidden character to its owner vs to others, server-side vision so hidden players are not leaked.
6. SEASONS AND BIOMES: grass colour by season and moisture (palette/LUT swap, per-tile phenology offsets), dry/golden grass, wet grass after rain, snow-covered grass, biome variety (meadow, savanna, swamp reeds, tundra), flowers blooming by season.
7. SMALL LIFE: butterflies (flutter paths, flap frames, wingbeat rates, landing on flowers, fleeing), fireflies (blinking patterns, synchronous flashing, glow cheaply at night), flying insects (bees between flowers, dragonflies dart-and-hover near water, gnat/midge swarms, moths drawn to lamps), ground critters (rabbits, frogs, crickets, lizards that hop or flee when the player approaches, flush from tall grass), flowers, pollen, dandelion seeds drifting on wind. Spawn rules by biome, season, time of day and weather; pooling and culling; client-side only cosmetic life vs server entities.

- Final output: technique profiles ("In plain words", "How it works (technical)", "Cost/performance", "Games that used it" (URL), "How it feels", "Risks") plus playable canvas demos. Collect concrete algorithms, pseudocode-level details, numbers, parameters (sway amplitudes in px, gust speeds px/s, wingbeat Hz, blink periods, flee radii, trail map resolutions, recovery times, regrowth timers, instance counts, ms costs).
- Rating criteria for the study: Simplicity · Speed · Pixel taste · Mood · Interactivity.

## Rules for every researcher
- Cite a URL for every claim; include concrete numbers (ms, counts, ranges, rates, frame counts, palette sizes, versions, dates).
- Separate cited findings from inferences; list gaps honestly. Flag vendor-reported figures.
- Never copy/download images. For every game example collect a "see it in action" reference URL (wiki page, article, devlog or video page).
- Quotes under 15 words.
- Many fan wikis (TibiaWiki, Fandom) return 402/403 and archive.org may be blocked: go to open-source code instead (OTClient, TFS/Canary, decompilation projects like pokeemerald/pokecrystal/pokefirered/zelda3, Shattered Pixel Dungeon, Stardew decompiles on GitHub, Terraria tModLoader sources, Minetest/Luanti, Cataclysm DDA, Veloren), GitHub READMEs, author pages. The Stardew wiki blocks pages but its MediaWiki API works: `https://stardewvalleywiki.com/mediawiki/api.php?action=parse&page=<Page>&prop=wikitext&format=json`.
- Notes structure: per key question -> Takeaway / Cited findings / Inferences / Gaps. End with "Sources".
- Stop at about 25-35 tool calls. Save notes as markdown to the given path, then reply with a SHORT summary (<=200 words) with your 5-8 most useful numbers.
