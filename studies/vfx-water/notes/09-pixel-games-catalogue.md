# 09 Catalogue of pixel and 2D games, and how their water is built

Gap fill. Notes 01 to 08 already cover Pokémon tile animation (pokeemerald, pokecrystal), Tibia rules, Slynyrd's craft posts, Croakwood's SDF shore, Kingdom-style reflection shaders in general, and a short "how pixel games ship water" table (02 Q7). This note does three things. It gives a per-game catalogue with "see it in action" links. It reads the one primary source nobody had opened (the decompiled Stardew Valley water code). It adds Factorio's water render target, Wargroove's sea/shore rules, and the swamp, underwater, cliff and ice details the others skipped.

Budget note. About 31 tool calls. Most searches for named-game water write-ups came back empty. That is itself a finding (Q1).

---

## Q1. Do shipped pixel games document how their water is built?

### Takeaway
Almost never. Out of 28 games checked, only four have a primary technical source for water: Stardew Valley (decompiled code), Factorio (dev blog), Pokémon Gen 3 (decompilation, covered in 01), Croakwood (dev blog, covered in 02). Everything else is reviews, wikis or community guesses. The rows below say "no source found" where that is the case. Don't fill those gaps from forum guesses.

### Cited findings
- Searches for Sea of Stars, Chained Echoes, Hyper Light Drifter, Eastward, CrossCode, Moonlighter, Songs of Conquest, Starbound, Don't Starve, RimWorld, Coral Island and Sword & Sworcery water techniques returned no developer write-up. Search logs: this note's Gaps section.
- Sea of Stars. One person worked on the dynamic lighting system full-time for about five years, and all assets had to "answer to the technical needs" of it. https://mobilesyrup.com/2023/09/11/sea-of-stars-level-design-sabotage-studio-thierry-boulanger-interview/
- Kingdom. The developer's TIGSource thread (topic 40539) is the source that Godot community shaders cite. It returned HTTP 403, and archive.org is blocked for this tool. https://forums.tigsource.com/index.php?topic=40539.0 , https://godotshaders.com/shader/2d-water-with-reflections/

### Inferences
- Pixel games with praised water get the praise from art, animation timing and lighting. A clever water shader is rarely the reason. That backs the series' cheap-first goal.

---

## Q2. How does Stardew Valley actually draw water? (decompiled code)

### Takeaway
Stardew's moving water is a cheap overlay. A 10-frame strip from Cursors.png is drawn over every water tile at about 50% alpha, tinted per season. It scrolls slowly downward, and a checkerboard of two strip variants hides the repeat. That is the whole effect: one draw per visible water tile, no shader.

### Cited findings
All from `GameLocation.cs` in a public decompile (version not stated in the repo, it uses `Game1.tileSize` = 64, which is 16 art px times 4 zoom). https://github.com/E-riCA0/StawdewValley (file GameLocation.cs, lines about 85-143, 1536-1557, 3260-3280, 8595-8611)
- Frames. `waterAnimationIndex = (waterAnimationIndex + 1) % 10`, timer reset to 200 ms. So 10 frames at 5 fps, a 2.0 s loop.
- Source. `mouseCursors` (Cursors.png), rect x = frame * 64, y = 2064, 64 wide. Two variant rows at y offset 0 and 128.
- Anti-tiling. Variant row picked by `(x + y) % 2` (checkerboard), and swapped whenever the scroll wraps (`waterTileFlip = !waterTileFlip`).
- Scroll. Outside the farm, per update `waterPosition += (sin(ms/1000) + 1) * 0.15`, where ms is the 0-999 millisecond part of total time. That is 0.15 to 0.28 px per frame in 64-px space. On the farm it is a flat 0.1 px per frame. Wraps at 64.
- Edges. A tile whose upper neighbour is not water gets a cropped source rect, so the scrolling strip never spills onto land above it.
- Tint. Default `Color.White * 0.33`. Per season, times 0.5 alpha: spring (120, 200, 255), summer (60, 240, 255), fall (255, 130, 200), winter (130, 80, 255). Events can set it (Game1.cs line 9582).
- Depth. Drawn at layer depth 0.56, over the map's painted Back layer. So the shore, depth bands and lily pads are painted map tiles, and only the shimmer moves.
- Reflections are not in the base game. A mod adds them. https://www.curseforge.com/stardewvalley/mods/dynamic-reflections

### Inferences
- Speed conversion (mine). At 60 fps, 0.15 to 0.28 px/frame in 4x space is 9 to 17 screen px/s, or about 2.3 to 4.2 art px/s. The farm is 1.5 art px/s. The sine term makes the drift speed breathe slowly. That is a good default for Asterion's sea overlay.
- The recipe ports directly to Godot. One TileMapLayer of painted water, plus a second layer (or a canvas_item shader) that samples a 10-frame strip at 50% alpha with a modulate colour per biome or season. Seasonal tint for free.
- The fall tint is pink (255, 130, 200). That is a bold, art-directed choice, not a physical one. Tint by mood.

### Gaps
- Exact game version of the decompile is unknown. 1.6 may differ (1.6.9 added a map-level `WaterColor` field per the wiki). https://wiki.stardewvalley.net/Modding:Migrate_to_Stardew_Valley_1.6.9

---

## Q3. Factorio, the best documented 2D top-down sea

### Takeaway
Factorio (top-down, sprite based) builds water from noise and a three-channel render target. It is time-driven, has no frames, and skips chunks with no water. It is a good model for a large shared sea in an MMO.

### Cited findings (FFF 323) https://cf-www.factorio.com/blog/post/fff-323
- The water sprite is reused as the noise texture. Noise values are clamped to fake bright and dark areas. fBm is done by sampling a noise texture, not computing Perlin, with low iteration count.
- "The water animation depends only on global time." No per-tile state.
- A render target stores "red for reflections, green for transparency, and blue for foam". Tiles and entities draw into it additively, so overlapping shore foam combines.
- Before caching, prepare cost was 3 ms, about one fifth of frame time. Per-chunk draw orders are now cached, and water-free chunks pay nothing.
- Tile transition definitions had to change for the new water. A waterfall at the map edge was tried and dropped.

### Inferences
- Global-time-only animation is what a server-authoritative MMO wants. Every client shows the same phase without sync messages.
- An RGB "water mask" buffer (reflection, transparency, foam) is a clean way to let objects add foam rings at the waterline. In Godot Compatibility this is a SubViewport drawn by sprites with additive blend.

---

## Q4. The catalogue

Legend. "Built" says what a source confirms. [obs] marks my own uncited observation of the game, to be checked against the linked page. "Not fetched" marks a link I did not open in this session.

| # | Game, year | Notable water | Built (source) | See it in action |
|---|---|---|---|---|
| 1 | Stardew Valley, 2016 | Seasonal tint, slow drift shimmer, painted shores, fishing bubbles | 10-frame overlay, 200 ms, 50% alpha, checkerboard variants (Q2) | https://github.com/E-riCA0/StawdewValley , https://www.curseforge.com/stardewvalley/mods/dynamic-reflections |
| 2 | Factorio, 2020 (FFF 2019) | Noise water, shore foam, reflections | RGB render target, global time, chunk caching (Q3) | https://cf-www.factorio.com/blog/post/fff-323 |
| 3 | Pokémon Emerald, 2004 | 8-frame water, separate sand-edge and land-edge animations, waterfalls, currents | Decompiled tile anims (see 01, 03, 04) | https://github.com/pret/pokeemerald/blob/master/src/tileset_anims.c |
| 4 | Pokémon Crystal, 2000 | Water palette colour cycled 0,1,2,1 | Decompiled (see 01) | https://github.com/pret/pokecrystal/blob/master/engine/tilesets/tileset_anims.asm |
| 5 | Terraria, 2011 | 12 biome water colours, waterfalls from half blocks, breath meter, dynamic flow | Wiki facts only, see below | https://terraria.wiki.gg/wiki/Water |
| 6 | Sea of Stars, 2023 | Dynamic lighting on water, warping behind waterfalls, swimming | Custom lighting pipeline, one person for about 5 years. No water write-up. | https://mobilesyrup.com/2023/09/11/sea-of-stars-level-design-sabotage-studio-thierry-boulanger-interview/ , https://astrolabe.aidanmoher.com/astrolabe-feature-sea-of-stars-is/ |
| 7 | Eastward, 2021 | Raft ripples, lit water | Custom MOAI engine (see 02). No water write-up. | see 02 Q7 sources |
| 8 | CrossCode, 2018 | Curved waterfalls joined to pools | Devblog says it was hard, no method (see 02) | see 02 Q7 |
| 9 | Kingdom Two Crowns, 2018 | Full-width mirrored reflection with wobble | Developer TIGSource post blocked (403). Community ports: flip upper screen into lower, two scrolling noise textures, optional perspective term. | https://godotshaders.com/shader/2d-water-with-reflections/ , https://forum.defold.com/t/water-reflections/75802 |
| 10 | Wargroove, 2019 | Sea, deep sea, beach, reef and river tiles that read differently and change rules | Tile rules on wiki (Q5) | https://wargroovewiki.com/Terrain_(Codex) |
| 11 | Advance Wars, 2001 | Sea, shoal, reef, river tiles, the model Wargroove copied | [obs] | https://advancewars.fandom.com/wiki/Terrain (not fetched) |
| 12 | Octopath Traveler, 2018 | HD-2D. 3D water plane under pixel sprites | Team struggled over "whether water should be pixel or photoreal" (Famitsu, via Siliconera). UE4. | https://www.siliconera.com/project-octopath-traveler-developers-answer-project-started-troubles-developing-hd-2d/ , https://www.unrealengine.com/en-US/spotlights/octopath-traveler-s-hd-2d-art-style-and-story-make-for-a-jrpg-dream-come-true |
| 13 | Croakwood (in dev) | Swamp ponds, wavy outlines around objects, frog and fish ripples | Ortho capture, SDF, compute ripples (see 02, Q6 here) | https://www.texelraptor.com/blog/croakwood-devlog-5 |
| 14 | Graveyard Keeper, 2018 | Swamp and river with fishing | Effects article covers wind, LUTs, normals. Nothing on water (see 02). | https://www.gamedeveloper.com/programming/graveyard-keeper-how-the-graphics-effects-are-made |
| 15 | Hyper Light Drifter, 2016 | Flat pools with high-contrast edges | No source found | https://hyperlightdrifter.fandom.com/wiki/Hyper_Light_Drifter_Wiki (not fetched) |
| 16 | Moonlighter, 2018 | Town river and pond | No source found | https://moonlighter.fandom.com/wiki/Rynoka (not fetched) |
| 17 | Chained Echoes, 2022 | 16-bit style sea and rivers, airship over water | No source found | https://chained-echoes.fandom.com/wiki/Chained_Echoes_Wiki (not fetched) |
| 18 | Sword & Sworcery EP, 2011 | Lake as a stage, "Believe" word lets you walk on water | Art made in Cosmigo ProMotion. No water method. | https://www.pocketgamer.com/superbrothers-sword-sworcery-ep/hands-on-with-iphone-pixel-art-adventure-superbrothers-sword-sworcery-ep/ , https://cdm.link/inside-handheld-game-art-the-art-style-and-making-of-swords-sworcery-superbrothers-pixel-cinema/ |
| 19 | Coral Island, 2023 | Diving zones with underwater map, kelp, trash clean-up | Guides only. Dive ends at 23:00, no oxygen meter. | https://Techraptor.net/gaming/guides/coral-island-diving-skill-guide |
| 20 | Starbound, 2016 | Many liquid types, each its own file | Liquids defined per type (mod page) | https://community.playstarbound.com/resources/colored-water-mod.3340/ |
| 21 | Tibia, 1997 | Animated sea, shore borders, swamp, fishing | See 01 Q3 | see 01 |
| 22 | Secret of Mana, 1993 | Waterfalls and HDMA wave effects | See 01 Q5 for the SNES HDMA method | see 01 |
| 23 | Chrono Trigger, 1995 | Shimmering sea and waterfalls on SNES | See 01 | see 01 |
| 24 | Zelda Minish Cap, 2004 | Shallow water wading, lily-pad riding when tiny | See 08 for wading rules | see 08 |
| 25 | Ultima Online, 1997 | Animated water tiles, boats | See 01 and 08 | see 01, 08 |
| 26 | Old School RuneScape, 2013 | Animated water texture, fishing spots as ripple sprites | See 08 (fishing) | https://oldschool.runescape.wiki/w/Fishing_spot (not fetched) |
| 27 | Don't Starve Shipwrecked, 2015 | Ocean with depth bands (shallow, medium, deep, coral) | No render source found | https://dontstarve.fandom.com/wiki/Ocean (not fetched) |
| 28 | Songs of Conquest, 2022 | Pixel art over 3D terrain, sea and rivers | No source found | https://www.songsofconquest.com/ (not fetched) |

Not covered for lack of budget: RimWorld, Cassette Beasts, Tunic (Tunic is 3D, low value here).

### Terraria detail (wiki) https://terraria.wiki.gg/wiki/Water
- 12 water styles: Forest blue, underground and mushroom dark blue, underground desert yellow, jungle teal, snow light blue, Corruption purple, Crimson pinkish, Hallow magenta, Blood Moon red, cavern murky purple, surface desert turquoise, ocean sky blue.
- "Each biome has its own unique water color." Water fountains override it.
- Waterfalls appear when water touches a half block (since 1.2).
- The breath meter shows when the pixel above the eyes is underwater.
- Most torches give no light underwater. Water removes On Fire!.

### Inferences
- Biome-tinted water is cheap and common (Terraria, Stardew). One modulate colour per biome or region is enough. For Asterion, swamp, sea, river and cave water can share one animated tile set with different modulate colours.

---

## Q5. Sea and shore tiles that carry rules (Wargroove, Advance Wars)

### Takeaway
Strategy games make water bands readable because the bands change rules. Wargroove has five water-ish tiles with distinct art and numbers. That matches Asterion's needs (walkable shallow, blocking deep).

### Cited findings https://wargroovewiki.com/Terrain_(Codex)
| Tile | Defence | Move cost foot / naval / amphibious |
|---|---|---|
| Sea | 1 | none / 2 / 1 |
| Deep sea | 1 | none / 2 / 1 |
| Beach | hazard 1 | 1 / 2 / 2 |
| Reef | 2 | none / 4 / 2 |
| River | hazard 2 | 2 / none / 1 |
| Bridge | 0 | 1 / 2 / 2 |
- Reef flavour text, "Barnacled rocks break the swell". River lowers defence.
- Reefs stay hidden in fog until a unit is adjacent (PC Gamer). https://www.pcgamer.com/wargroove-units-critical-hits-stats-maps

### Inferences
- A reef or rock tile inside the sea gives a second readable band without a depth shader. White surf around a few rocks tells the player "slow, rough" at a glance.

---

## Q6. Swamp and marsh water

### Takeaway
No game in the catalogue documents a swamp recipe. The pattern I can support with sources is murky tint plus bubbles plus outlines. Tibia marks swamp tiles with a green bubble effect (01). Croakwood's pond look came from colour, transparency, outline width and creature ripples. Terraria tints by biome.

### Cited findings
- Croakwood's final pond look came from small tweaks to colour, transparency, and the width and shape of outlines, plus ripples from fish and frogs. Earlier tests had reflections and "wavy outlines" but felt like something was missing. https://www.texelraptor.com/blog/croakwood-devlog-5
- Tibia swamp tiles use the "greenbubble" effect (see 01 Q3).
- Terraria cavern water is "murky purple", Corruption purple, jungle teal. https://terraria.wiki.gg/wiki/Water
- Valve used flow on L4D2 swamp water to show the path, with 17% fewer wrong turns (see 02 Q1).

### Inferences
- Swamp recipe for 32x32 tiles (mine, to test in the demo). Use 3 to 4 colours from olive to dark teal-brown, low value contrast. Halve the shimmer overlay (Stardew-style) to about 25% alpha and halve the scroll speed. Add a sparse bubble sprite (2 to 3 frames, 1 per 6 to 10 tiles, random start). Scatter lily pads and reeds as separate sprites so they can bob 1 px out of phase. Put reeds on the shore autotile edge only.
- No reflections in swamp water. Murk reads as opaque, and dropping reflections saves cost.

### Gaps
- No artist thread on lily pad or reed placement rules was found.

---

## Q7. Underwater, wet sand, cliffs, ice

### Takeaway
Thin evidence. The cited bits are Terraria's breath and light rules, Coral Island's dive time limit, Sea of Stars' "warping behind waterfalls", and 01's HDMA row-wobble. Cliff-to-water and ice edges have no source in this round.

### Cited findings
- Underwater. Terraria shows the breath meter by the eye pixel and kills most torch light underwater. https://terraria.wiki.gg/wiki/Water . Coral Island ends dives at 23:00 instead of using oxygen. https://Techraptor.net/gaming/guides/coral-island-diving-skill-guide . Sea of Stars uses warping effects behind waterfalls. https://astrolabe.aidanmoher.com/astrolabe-feature-sea-of-stars-is/
- Whole-screen wobble is the highest motion-sickness risk (06 Q6). HDMA row offsets suit a whole-screen underwater wobble (01 Q5).
- Wet sand. Stardew paints shore bands into the map and only overlays shimmer on water tiles, cropped at the top edge (Q2). So wet sand there is static art.

### Inferences
- Underwater for Asterion (Calassa-style). Multiply the whole scene by a blue-green tint, wobble rows by 1 px with a 2 to 4 s period, and drop warm lights (Terraria's rule). Keep the wobble at 1 px or off for comfort.
- Cliff meeting water in 3/4 view. Draw the cliff face down into the water by 4 to 8 px, then a 1 px dark contact line, then a thin foam strip that animates on the water side only. No beach wave run-up against cliffs. Use the Stardew top-edge crop rule so the shimmer never draws over the cliff face.
- Ice on water edges. Make it a separate terrain in the dual-grid shore set (ice-to-water pair), with no animation on the ice side and the foam strip removed. Tibia's ice-hole fishing spot (01 Q3) shows a gameplay hook.

### Gaps
- No source for cliff-to-water tiles in Pokémon, Zelda or Chained Echoes. pokeemerald metatile data could answer it, not checked.
- No source for ice edges in any 2D game.

---

## Overall gaps
- Blocked: TIGSource (403), archive.org (tool block), lazybeargames dev site (DNS fail). Fandom wikis not tried this round, links marked "not fetched".
- No primary source found for Sea of Stars, Eastward, CrossCode, Chained Echoes, Hyper Light Drifter, Moonlighter, Songs of Conquest, Don't Starve, RimWorld, Cassette Beasts or Coral Island water rendering.
- Video "see it in action" links not collected. Wiki and article links only.

## Sources
- https://github.com/E-riCA0/StawdewValley (GameLocation.cs, Game1.cs)
- https://wiki.stardewvalley.net/Modding:Migrate_to_Stardew_Valley_1.6.9
- https://www.curseforge.com/stardewvalley/mods/dynamic-reflections
- https://forums.stardewvalley.net/threads/where-are-water-animations-stored.49069
- https://cf-www.factorio.com/blog/post/fff-323
- https://terraria.wiki.gg/wiki/Water
- https://wargroovewiki.com/Terrain_(Codex)
- https://www.pcgamer.com/wargroove-units-critical-hits-stats-maps
- https://www.siliconera.com/project-octopath-traveler-developers-answer-project-started-troubles-developing-hd-2d/
- https://www.unrealengine.com/en-US/spotlights/octopath-traveler-s-hd-2d-art-style-and-story-make-for-a-jrpg-dream-come-true
- https://mobilesyrup.com/2023/09/11/sea-of-stars-level-design-sabotage-studio-thierry-boulanger-interview/
- https://astrolabe.aidanmoher.com/astrolabe-feature-sea-of-stars-is/
- https://www.texelraptor.com/blog/croakwood-devlog-5
- https://www.gamedeveloper.com/programming/graveyard-keeper-how-the-graphics-effects-are-made
- https://godotshaders.com/shader/2d-water-with-reflections/
- https://forum.defold.com/t/water-reflections/75802
- https://forums.tigsource.com/index.php?topic=40539.0 (403)
- https://www.pocketgamer.com/superbrothers-sword-sworcery-ep/hands-on-with-iphone-pixel-art-adventure-superbrothers-sword-sworcery-ep/
- https://cdm.link/inside-handheld-game-art-the-art-style-and-making-of-swords-sworcery-superbrothers-pixel-cinema/
- https://Techraptor.net/gaming/guides/coral-island-diving-skill-guide
- https://community.playstarbound.com/resources/colored-water-mod.3340/
- https://github.com/pret/pokeemerald/blob/master/src/tileset_anims.c
- https://github.com/pret/pokecrystal/blob/master/engine/tilesets/tileset_anims.asm
