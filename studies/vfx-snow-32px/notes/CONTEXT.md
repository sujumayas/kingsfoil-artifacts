# Shared context for all SNOW AT 32 PX researchers

## The user and project
- Indie game dev (Kingsfoil Studios). Godot 4 games, web-first (Compatibility / WebGL2 renderer: no compute shaders, no HDR 2D glow, limited 2D lights), also mobile and desktop. Small team. Must run without a big computer.
- Target game: "Asterion Online", a Tibia-like top-down (3/4) pixel-art MMORPG. Server-authoritative, 32x32 px tile grid, characters walk tile to tile, many players share the same weather.
- Series "one concept per study" on simple, super-efficient, old-school VFX algorithms. Series reference: the DOOM PSX fire (https://fabiensanglard.net/doom_fire_psx/).

## Why this study exists (the user's request, 12 Nov 2026)
VFX #1 Snow (https://kingsfoil-artifacts.netlify.app/vfx-snow-topdown-pixel) built its sandbox at 320x180 with 8 px tiles and 7x12 px characters. That is a quarter of the game's real scale. The user wants "a 32px character scene using the same logic of the snow study", for a game where the art and characters are about 24x32 px on 32x32 tiles.

So this study, VFX #11, does NOT research snow again. It asks one question: **what changes when the snow engine moves from 8 px tiles and 7x12 characters to 32 px tiles and 24x32 characters, at a 640x360 native canvas (20 x 11.25 tiles, 4 times the pixels)?**

## What VFX #1 already settled (read `studies/vfx-snow/report.md` §1, §7, §8 before starting; do not repeat it)
- Ground snow is one byte of depth per art pixel, drawn where `depth > threshold` (4x4 Bayer + noise). 320x180 = 57,600 cells.
- Exposure (shelter x wind lee) and sun shadow are baked bytes. Deposit, sandpile relax, wind creep, melt and evaporation run as random picks per frame (900 / 4,000 / 1,400 / 1,500 / 1,600 picks).
- Footprints are 2x2 px stamps every 4 px that keep 30% of the depth and push the rest into a rim. Sinking is 1 row per 22 units, at most 4 rows. Characters slow down by up to 55%.
- Rendering is a palette-index buffer: 58 base colours x 4 variants, re-tinted per frame, with a Bayer-dithered lamp palette and a 4-neighbour emboss (5 snow shades).
- Flakes: three layers of 260 / 150 / 46, with z height, 1 to 2 px, near layer with shadow dots.
- Godot plan: R8 fields, low-Hz CPU tick on dirty chunks, one CanvasItem shader, sync only weather state and seeds.
- The nine research notes are in `studies/vfx-snow/notes/01..09-*.md`. Reuse their sources by pointing to them; add only what is new.

## THE TWO MAIN GOALS (equal weight, the user stresses both in every VFX study)
1. ARTISTIC QUALITY at 32 px. A 1 px flake or a Bayer dusting that reads well on an 8 px tile can look thin, noisy or "programmer art" next to hand-drawn 32 px tiles and 24x32 characters. Find what pixel artists and praised games do at this size: snow edges, clusters against dither, shading bands, footprint shapes, flake sizes, snow on roofs, trees and characters.
2. RUNTIME EFFICIENCY at 4 times the pixels. What each layer costs at 640x360 on low-end web, with MEASURED numbers where they exist (ms per frame, bytes uploaded, picks per tick, draw calls). Mark estimates as estimates. The hard question is which buffers must grow with the art resolution and which can stay small.

## Scope of THIS study (the scale questions)
1. FIELD RESOLUTION AGAINST ART RESOLUTION. Keep the depth field at 1 cell per art pixel (230,400 cells), 1 per 2x2 (57,600, the old size), 1 per 4x4, or 1 per tile? How to draw a coarse field at art resolution without blocky squares: bilinear sample then threshold, marching squares, dual-grid autotile, hand-drawn threshold textures. What games and papers do.
2. THRESHOLD AND DITHER AT 32 PX. 4x4 Bayer against 8x8, blue noise, cluster dither, and a hand-drawn 32x32 "threshold tile" (the artist paints the order in which snow covers a tile). Blending a summer tileset and a hand-drawn winter tileset through a per-pixel mask so coverage is dynamic but every pixel is artist-made. Autotile snow overlays (47-blob, Wang, dual-grid) driven by a per-tile snow level, as the cheap fallback.
3. SNOW SHADING WITH MORE PIXELS. Edge shadow, body, highlight rim, 2 to 3 bands, how wide in px, sparkle size, snow lips on the south side of objects in a 3/4 view, hand-shaped snow caps on roofs, pines and fences.
4. CHARACTERS AT 24x32. Boot-shaped left and right footprints stamped on the walk cycle's contact frames, direction-aware. Trenches in deep snow. Sinking by clipping foot rows with a snow rim drawn in front (the "tall grass" trick). Snow settling on hats and shoulders. Breath. Kicked snow. Walk cycle frame counts at this size (3, 4, 6, 8 frames) and which frames are foot contacts. Tibia-style tile-to-tile movement and what it means for prints. Many players on one screen.
5. FALLING SNOW AT 32 PX. Flake sprite sizes in px (1, 2, 3, small crosses), counts per screen, fall speed in tiles per second, layers, overlay textures against particles, shadow dots, whether flake density should follow pixels or tiles.
6. COST. Per-pixel render work is 4x. Random-pick ticks need 4x the picks for the same rate per tile if the field is 1:1. Texture upload size per tick in Godot (640x360 RGBA8 is 921,600 bytes). What the GPU path (one CanvasItem shader sampling a small field texture) makes free. Godot 4 pixel-perfect settings for a 640x360 base (stretch mode, integer scaling, snapping), and the current state of `DrawableTexture2D` and SubViewport feedback on the Compatibility renderer.
7. GAMES AT THIS SIZE. How shipped games with roughly 32 px tiles or 24-32 px tall characters draw snow: Tibia (32 px), RPG Maker VX Ace (32 px) and MV/MZ (48 px) winter tilesets and weather code, Stardew Valley (16 px tiles, 16x32 characters), Pokémon Gen 4 and 5 snow routes (footprints, deep snow), CrossCode, Eastward, Sea of Stars, Chained Echoes, Graveyard Keeper, Moonlighter, Kynseed, Ragnarok Online (Lutie), Graal, Chrono Trigger, Secret of Mana, EarthBound, Zelda: The Minish Cap. Sprite and tile sizes, internal resolution, flake sizes and counts, footprint sizes and lifetimes, sink depth in px. Open-source code and decompilations give exact numbers.

- Final output (written later by others): technique profiles ("In plain words", "How it works (technical)", "Cost / performance", "Games that used it" with URL, "How it feels", "Risks") plus playable canvas demos, and a sandbox at 640x360. Collect concrete algorithms, pseudocode-level details, and numbers in px, tiles, frames, ms, bytes and counts. Always say the tile size and sprite size a number belongs to, so it can be converted.
- Rating criteria for the study: Simplicity · Speed · Pixel taste · Mood · Interactivity.

## Rules for every researcher
- Cite a URL for every claim. Give concrete numbers (px, tiles, frames, ms, bytes, counts, versions, dates).
- Separate cited findings from inferences. List gaps honestly instead of guessing. Flag vendor-reported and author-reported figures.
- Never copy or download images. For every game example collect a "see it in action" URL (wiki page, article, devlog or video page).
- Quotes under 15 words.
- Many fan wikis (TibiaWiki, Fandom, Bulbapedia) return 402/403 and archive.org may be blocked. Go to open-source code instead: OTClient, TFS/Canary, RPG Maker MV/MZ core scripts (rpg_core.js / rmmz_core.js `Weather`), Stardew Valley decompilations, pret/pokeplatinum, pret/pokeheartgold, pokeemerald, pokefirered, roBrowser/rAthena, Shattered Pixel Dungeon, Veloren, Godot source and docs, GitHub READMEs, author pages, GDC Vault pages. Some MediaWiki wikis block pages but answer `api.php?action=parse&page=<Page>&prop=wikitext&format=json`.
- If you meet a field-validated open-source tool or library that helps (autotile generators, dual-grid code, Godot pixel-perfect or weather plugins, dither tools), record it for the gems table: name, URL, licence read from the LICENSE file, maturity evidence (stars, last release, shipped games), what it saves.
- Notes structure: per key question, Takeaway / Cited findings / Inferences / Gaps. End with "Sources".
- Scratch files go only in `studies/vfx-snow-32px/notes/scratch-<your-file-number>/`. Never write outside your notes file and that folder.
- Stop at about 25-35 tool calls. Save notes as markdown to the given path, then reply with a SHORT summary (at most 200 words) with your 5-8 most useful numbers.
