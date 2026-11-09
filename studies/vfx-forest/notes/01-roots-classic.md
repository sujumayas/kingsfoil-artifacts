# 01 — THE ROOTS: how classic top-down / 3/4 games built trees and forests

Researcher angle: classic tile/sprite techniques (1980s–2010s), simplest first.
Date: 2026-11-09. ~35 tool calls. Primary-source code was read where possible (OTClient source, pret wiki, yaze docs, a decompiled Stardew `Tree.cs`). Code was read, not copied. Quotes stay under 15 words.

Legend: **[C]** = cited finding (URL given). **[I]** = inference or my own synthesis. **[GAP]** = could not verify.

---

## Q1. Tile-based trees: metatiles, canopy on an upper layer, "walk behind the canopy"

### Takeaway
The oldest and cheapest trick has no transparency at all. You split each tree metatile into a **bottom layer** (trunk and ground, drawn under sprites) and a **top layer** (canopy, drawn over sprites). The hardware or the engine does the rest through layer priority. GBA Pokémon shows this best: a 16×16 metatile holds 2 layers of 2×2 8×8 tiles, and a per-metatile "layer type" decides which BG layers it uses. Sprite elevation decides which layers cover the player. Zelda ALttP adds a full-screen **foreground overlay** for forest canopy and fog. Tibia does neither: it uses strict painter's order over diagonals, so a tall tree simply hides the player.

### Cited findings
- **Pokémon Gen 3 (pokeemerald, GBA) metatiles** [C] https://github.com/pret/pokeemerald/wiki/Triple-layer-metatiles
  - A vanilla metatile is `NUM_TILES_PER_METATILE = 8`: 2 layers × 4 tiles in a 2×2 block, at offsets `+0, +1, +0x20, +0x21`. The triple-layer hack raises this to 12.
  - The vanilla layer types are **Normal** (BG1+BG2), **Covered** (BG2+BG3) and **Split** (BG1+BG3).
  - BG priorities: UI BG0 = 0, top map layer BG1 = 1, middle BG2 = 2, bottom BG3 = 3. A sprite draws above a layer when its elevation is greater than that layer's priority. The player starts at elevation 3, so **the top layer (BG1) covers the player**. The wiki calls BG1 the layer that "covers object event sprites."
  - Porymap's manual has the same layer-type table (Normal = middle+top, Covered = bottom+middle, Split = bottom+top). Tiles are 8×8 indexed PNGs, and each palette "must contain 16 colors." https://huderlem.github.io/porymap/manual/tileset-editor.html
- **Pokémon HGSS (DS) Headbutt trees** [C] https://ds-pokemon-hacking.github.io/docs/generation-iv/guides/hgss-headbutt_trees
  - A tree is just map coordinates that you can headbutt. The tile needs permission type `0x06` and collision `0x80` (blocked).
  - A "Tree Group" holds up to **6 coordinate pairs**, so one logical tree can be hit from several sides.
  - Each map has 3 encounter sets × 6 slots = 18, weighted 50/15/15/10/5/5%. Lesson: **gameplay trees are data on top of decorative tiles**.
- **Zelda: A Link to the Past (SNES) overworld overlays** [C] (yaze editor docs, reverse-engineered) https://git.halext.org/scawful/yaze/src/tag/v0.3.0/docs/F1-overworld-loading.md
  - Overlays are "collections of tile positions and tile IDs" stored as special area maps 0x80–0x9F.
  - **0x9E = "Tree Canopy (Forest)"**, 0x9D = "Second Fog Overlay (Lost Woods/Skull Woods)", 0x97 = "First Fog (Master Sword area)", 0x9F = rain (Misery Mire).
  - Foreground overlays (drawn over map tiles with transparency): 0x9D, 0x97, 0x93, 0x94, 0x9E, 0x9F. Background overlays: 0x95, 0x96, 0x9C.
  - Romhack docs say overlays sit on the **subscreen** and are set per area through an `.OverlayTable` (`$FF` = none). https://git.halext.org/scawful/oracle-of-secrets/src/branch/master/Docs/World/Overworld/ZSCustomOverworld.md
  - Zelda Wiki says Link first enters the Lost Woods in "a thick fog that makes it hard to navigate." The fog lifts after he takes the Master Sword. https://zeldawiki.wiki/wiki/Lost_Woods
- **SNES colour math** (for the overlay blend) [C] https://wiki.superfamicom.org/grog's-guide-to-sub-screen-addition-subtraction-and-mask-windows-on-the-snes
  - The sub-screen can be added to or subtracted from the main screen, for "transparent bubbles or clouds."
  - A fixed colour can be added with 32 intensity levels, which can darken or lighten a region.
- **Tibia (2D MMO, 32×32 tiles)**: OTClient, the open-source Tibia client [C]
  - Multi-tile things are drawn from their anchor tile **up and to the left**. The code computes `screenRect = dest + (textureOffset − m_displacement − (m_size − (1,1)) * 32)`. A 2×2 (64×64) tree anchored on tile T therefore covers T and the tiles to its north and west. https://github.com/edubart/otclient/blob/master/src/client/thingtype.cpp (approx. lines 284–400)
  - The default displacement for items with that attribute is 8,8 px (the offset that sells the 3/4 look).
  - Map drawing loops "through / diagonals beginning at top left," floor by floor from the lowest to the highest. Within a tile the order is ground → borders → onBottom → common items → creatures → onTop. Items stack with a cumulative "elevation" that is capped at `MAX_ELEVATION`. https://github.com/edubart/otclient/blob/master/src/client/mapview.cpp (≈ line 322) and https://github.com/edubart/otclient/blob/master/src/client/tile.cpp (lines 42–125)
  - The binary minimap stores a colour byte per pixel, and `0x0C` is labelled "tree." There are 16 floors (00 = highest, 07 = ground). https://tibiamaps.io/guides/map-file-format
- **Stardew Valley (2016)** [C] (decompiled `TerrainFeatures/Tree.cs`, ~v1.4/1.5) https://github.com/WeDias/StardewValley/blob/master/TerrainFeatures/Tree.cs
  - **Canopy fade:** each tick, `alpha = min(1, alpha + 0.05)`. If the tree is mature (stage ≥ 5), not falling, not a stump, and the player's bounding box intersects a rect of **192×288 px** (3 tiles wide × 4.5 tiles tall, starting 1 tile left of and 5 tiles above the trunk tile), then `alpha = max(0.4, alpha − 0.09)`.
  - Result: the canopy fades to **40% opacity** in about 7 frames and comes back in about 12. It is an alpha fade on the whole tree-top sprite, not a dither or cutout.
  - Only the tree top and the stump get `Color.White * alpha`.
  - Fruit trees and buildings use the same `max(0.4, alpha − 0.09)` code, per GitHub code search: `Buildings/Building.cs`, `TerrainFeatures/FruitTree.cs`.
  - Map-baked trees (non-choppable, part of the TMX map) **do not** fade. A mod exists to make map tiles transparent around hidden players, and it says they are "part of the map." https://www.curseforge.com/stardewvalley/mods/show-players-behind-map-tiles

### Inferences
- [I] There are three historical "behind the tree" solutions, from cheapest to most expensive:
  1. **Layer split.** Canopy tiles go on an above-player layer (GBA/SNES BG priority, RPG Maker "star" tiles, Tiled "above" layers). It costs 0 per frame, but the player is fully hidden and you need the 2-layer metatile authoring discipline.
  2. **Pure painter's sort, no reveal** (Tibia). It costs 0, and level designers must keep forests sparse near paths. An outline or name tag over the player is the usual fallback.
  3. **Per-object alpha fade with a trigger rect** (Stardew). One AABB test per tree per frame plus one lerp. In Godot this is `modulate.a` on the canopy Sprite2D, or one uniform.
- [I] For Godot 4: put trunk and canopy in separate TileMapLayers (canopy layer `z_index` above the player), or use y-sorted tree scenes whose canopy is a child Sprite2D faded by an Area2D. ALttP's canopy overlay maps to a CanvasLayer or parallax layer with a tiled leaf texture, drawn over the forest area with low alpha.

### Gaps
- [GAP] I could not confirm whether ALttP's 0x9E canopy overlay scrolls with parallax relative to BG2, or its blend mode (add, sub or half). The vgmaps thread on "Lost Woods Transparency" redirect-looped: http://www.vgmaps.com/forums/index.php?topic=866.msg9042
- [GAP] I did not confirm whether Tibia sets the "onTop" flag on tree canopies (I believe trees are normal blocking items, so they rely on diagonal order). TibiaWiki (fandom) is blocked by the fetch allowlist.
- [GAP] Link's Awakening, Minish Cap, Chrono Trigger (Guardia Forest), Secret of Mana, EarthBound and FF6 were not verified in this pass. They likely use the same BG-priority canopy trick (SNES tilemap entries have a per-tile priority bit). The snes.nesdev.org tilemap page was blocked.

---

## Q2. Seasons in classic 2D: palette swap vs separate tilesets

### Takeaway
Two families. (a) **Separate seasonal textures:** Stardew loads `tree{N}_{season}` sheets. (b) **Shader or palette parameters:** RimWorld's fall-colour shader params, and Factorio's colourable leaves plus a grey "pollution" tint. Pokémon B/W is the classic "whole world changes" case: seasons rotate **monthly**, so each season comes 3 times a year.

### Cited findings
- **Stardew Valley** [C] (Tree.cs above)
  - The texture is chosen by `"TerrainFeatures\\tree" + type + "_" + season`, so each wild tree type has 4 seasonal sheets.
  - Pine (type 3) reuses its spring sheet in summer, which saves one sheet.
  - The Desert and Mines are forced to "spring."
  - Mushroom (7) and palms (6, 9) have no seasonal variants.
  - Wiki: trees don't grow in winter (except Desert/Ginger Island). Moss appears in all seasons except winter. https://stardewvalleywiki.com/Trees
- **Pokémon Black/White (Gen 5, 2010)** [C] https://serebii.net/blackwhite/seasons.shtml
  - Each season lasts **1 month**: spring = Jan/May/Sep, summer = Feb/Jun/Oct, autumn = Mar/Jul/Nov, winter = Apr/Aug/Dec.
  - Winter snow opens new areas (Icirrus City cliffs, Route 8, Moor of Icirrus, Twist Mountain, Dragonspiral Tower).
  - Encounter tables change per season on Routes 6, 7 and 8, among others.
  - B2W2 continues the cycle. https://serebii.net/black2white2/seasons.shtml
- **RimWorld** [C] https://www.rimworldwiki.com/wiki/Trees and https://rimworldwiki.com/wiki/Modding_Tutorials/Plant_Rendering
  - Tree colours depend on season (since Beta 19/1.0).
  - Some trees go leafless at −2 °C and sturdier ones at −10 °C. Leaves return after a day of comfortable temperature.
  - Rendering fields: `leaflessGraphicPath`, `immatureGraphicPath`, `pollutedGraphicPath`, plus snow overlays (`snowOverlayGraphic`, `leaflessSnowOverlayGraphic`) shown when cell snow exceeds 80%.
  - Fall colour is a shader recolour: `_FallColorSource`, `_FallColorDestination`, `_FallTransitionRange`, `_FallBehaviorEnabled` (CutoutPlant shader). This is effectively a **runtime palette remap** instead of extra autumn textures.
- **Factorio** [C] https://wiki.factorio.com/Trees
  - Patch 0.12.0: "Trees have 4 levels of leaves and the leaves are colorable." Pollution greys them.

### Inferences
- [I] Art cost: a separate-sheet approach costs 4× the canopy art per species, minus shared sheets (as with Stardew's pine). A source→destination colour remap (RimWorld) or a palette LUT costs one shader and 0 extra art, but gives less silhouette change. Leafless winter still needs a separate bare-branch sprite, or a "trunk without leaves" layer as in Factorio.
- [I] Hybrid recommendation: split trunk and canopy. Seasons swap the canopy palette or LUT row, winter hides the canopy and shows a snow-cap overlay. That is the Factorio and RimWorld combination.

### Gaps
- [GAP] I could not confirm whether Pokémon B/W swaps tilesets or palettes per season (Bulbapedia fetch failed). Reference pages: https://bulbapedia.bulbagarden.net/wiki/Season_(game_mechanic) and https://www.pokemondb.net/black-white/seasons
- [GAP] Harvest Moon (SNES) seasonal tile swapping is not verified.
- [GAP] Animal Crossing seasonal tree art is not verified (breezewiki mirror is bot-blocked). Reference: https://nookipedia.com/wiki/Item:Hardwood_Tree_(New_Horizons)

---

## Q3. Tree variety on a budget: flips, colour variants, trunk+canopy composition

### Takeaway
Every case found multiplies a small art set with **cheap orthogonal axes**: horizontal flip (×2), colour or tint (×N), trunk/leaf separation (leaf stage), growth stage, and random texture copies per cell.

### Cited findings
- **Factorio, FFF #86 (2015-05-15)** [C] https://direct.factorio.com/blog/post/fff-86
  - "The tree graphics has separated leafs and trunk." Health is shown by removing leaves down to the bare trunk.
  - Colour variants of one tree save graphics memory.
  - "10 variations for every tree family and 8 tree families." The post claims 5120 combinations; it doesn't spell out the maths.
  - Chopping emits leaf particles in the tree's colour. A felled tree leaves a stump plus branch particles. There is **no falling animation**, which saves memory.
- **Factorio wiki** [C] https://wiki.factorio.com/Trees
  - Leaf stages 0–3.
  - Pollution only affects trees in chunks with >60 pollution. Each event costs 10 pollution and either drops a leaf stage or adds 6.7% grayness.
  - Damage stops once grayness + leaf loss exceeds 120%, and half the trees stop one stage early (which gives natural variety).
  - Absorption per tree is −0.001/s at full leaves, down to 0 at stage 3.
  - Tree types: 0.9.0 introduced "10 types of trees."
- **Stardew** [C] (Tree.cs) `flipped = random < 0.5` at creation, so every tree draws mirrored half the time.
- **RimWorld** [C] (Plant Rendering page)
  - `maxMeshCount` ∈ {1, 4, 9, 16, 25} copies per cell. Each copy may flip on x, and `Graphic_Random` picks a random texture per copy.
  - `visualSizeRange` scales from min (0% growth) to max (100%). A max of 3.0 covers a 3×3 cell area.
  - Wind: `topWindExposure` (default 0.25) offsets mesh vertices.
  - Shadow: a separate `shadowData` (volume, offset).
- **Tibia** [C] (OTClient)
  - Things have `layers × patternX × patternY × patternZ × animationPhases` sprite slots: `totalSprites = m_size.area() * m_layers * ...`.
  - The same tree item can have pattern variants chosen by map position (patternX/Y), which is the classic "tile pattern variation without extra item IDs." [I on usage for trees]

### Inferences
- [I] A budget formula to quote: variants = species × flip(2) × tint(k) × growth(stages) × season(4 via LUT). With 3 species, 4 tints and 5 stages that is 3·2·4·5·4 = **480 visible variants from 15 base drawings**.
- [I] Separating trunk and canopy is the key enabler for leaf loss (Factorio), seasonal remap, canopy fade (Stardew fades only the top) and wind sway (only the canopy rotates or skews).

---

## Q4. Interaction: growth stages, shaking, chopping, felling — numbers

### Cited findings
- **Stardew Valley** [C] (Tree.cs and wiki)
  - Sprite sizes:
    - Tree top source rect: **48×96 px**, drawn at 4× scale with origin (24, 96).
    - Stump: 16×32 px.
    - Leaf particles: **8×8** px from the same sheet (4 types).
    - Shadow from the cursor sheet: 41×30 px. Its alpha is `1.5708 − |shakeRotation|`, so the shadow fades as the tree tips over.
  - Health: 10 (stumps 5).
  - Shake: `maxShake` is π/128 for mature trees and π/64 for saplings, decaying by about 0.00102 per tick (mature). Rotation steps are π/600 (mature) and π/200 (young). A "leafrustle" sound plays.
  - Wiki: growth stages 1–4, then mature at **5**. 20% growth chance per night (Mahogany 15%), and stage 4 takes twice as long. Median about 24 days to mature.
  - Wiki yields: wood 12–16, sap 5, 0–2 seeds, 12 Foraging XP. Trees fall left or right, away from the player. Tapper intervals: oak resin 7 d, maple syrup 9 d, pine tar 5 d (heavy tapper 3/4/2 d).
  - https://stardewvalleywiki.com/Trees
- **Don't Starve (Evergreen)** [C] https://dontstarve.wiki.gg/wiki/Tree/Evergreen

  | Stage | Time to advance | Chopped yield | Axe hits |
  |---|---|---|---|
  | Sapling | 0.31–0.63 days | 1 twig | — |
  | Small | 0.63–1.25 days | 1 log | 5 |
  | Medium | 1.9–4.4 days | 2 logs + 1 cone | 10 |
  | Tall | 1.9–4.4 days | 3 logs + 2 cones | 15 |
  | Old | 0.31–0.94 days | 1 cone | 1 |

  - The tree then **cycles back** (an old tree becomes short again).
  - Felling has a 1.3% Treeguard chance after day 3.
  - Fire spreads tree to tree, and burnt trees take 1 hit and give charcoal.
- **RimWorld** [C] https://www.rimworldwiki.com/wiki/Trees
  - Grow days: oak 30, pine 20, birch 20, poplar 15.05, teak 32.5, cypress 35, bamboo 12.
  - Wood yield: oak 46, pine and birch 27, teak 60.
  - Trees don't grow from 19h to 6h. They can be cut at 40% growth for 50% yield, and need 1 tile of spacing.
- **Factorio** [C] Mining time: 0.55 s (live), 0.5 s (dead). Wood: 4 (live), 2 (dead). https://wiki.factorio.com/Trees
- **Ultima Online** [C] https://uoguide.com/Lumberjacking
  - Wood tiers gated by skill: plain 0, oak 65, ash 80, yew 95, heartwood/bloodwood/frostwood 100.
  - Logs weigh 2 stones each, boards 1.
- **Old School RuneScape** [C] https://oldschool.runescape.wiki/w/Woodcutting_guide_p2p
  - Tree tiers by level: normal 1, oak 15, willow 30, maple 45, yew 60, magic 75, redwood 90.
  - The guide implies a 4-tick chop cycle. Trees deplete to stumps (detail not on this page).

### Inferences
- [I] Classic games make "tree type = resource tier" readable through **silhouette and colour** (OSRS willow by water, yew dark, magic blue-ish; UO wood colours). This drives forest composition: rarer species are scattered among commoner ones.
- [I] Don't Starve's looping lifecycle (short → tall → old → short) keeps a forest visually mixed-age with no extra system. It works as a cheap "alive forest" idea for an MMO.

---

## Q5. Wind sway / ambient animation frames
- [C] Stardew sways only on interaction (shake rotation around the trunk-base origin). There's no constant wind on choppable trees in the code read, apart from falling-leaf particles; `leafFallRate = 3` is a constant in Tree.cs.
- [C] RimWorld uses per-vertex mesh wind (`topWindExposure`, default 0.25).
- [GAP] Frame counts for classic SNES/GBA tree animation were not found. Most 16-bit forests were **static tiles**; motion came from overlays (ALttP fog and canopy) or animated tiles in water and flowers. Treat that as [I].

---

## Game examples with "see it in action" reference URLs (17)
| # | Game (year) | What it shows | Reference URL |
|---|---|---|---|
| 1 | Zelda: A Link to the Past (1991) | Foreground canopy overlay 0x9E, fog 0x9D/0x97 | https://git.halext.org/scawful/yaze/src/tag/v0.3.0/docs/F1-overworld-loading.md ; https://zeldawiki.wiki/wiki/Lost_Woods |
| 2 | Pokémon Emerald/RSE (2002–04) | 2-layer 16×16 metatiles, layer types, elevation vs BG priority | https://github.com/pret/pokeemerald/wiki/Triple-layer-metatiles |
| 3 | Pokémon HGSS (2009) | Headbutt trees as coordinate data (6 per group) | https://ds-pokemon-hacking.github.io/docs/generation-iv/guides/hgss-headbutt_trees |
| 4 | Pokémon Black/White (2010) | Monthly seasons; winter opens areas | https://serebii.net/blackwhite/seasons.shtml |
| 5 | Pokémon Red/Blue, Viridian Forest (1996) | Forest-as-maze of tree tiles (reference only) | https://Bulbapedia.Bulbagarden.net/wiki/Viridian_Forest |
| 6 | Pokémon GSC/HGSS, Ilex Forest | Dense tree-wall forest, Cut tree (reference only) | https://bulbapedia.bulbagarden.net/wiki/Ilex_Forest |
| 7 | Tibia (1997–) | 32 px tiles, 64×64 trees drawn up-left, diagonal painter's order | https://github.com/edubart/otclient/blob/master/src/client/thingtype.cpp |
| 8 | Stardew Valley (2016) | Canopy alpha fade to 0.4, seasonal sheets, flip, shake, stages | https://stardewvalleywiki.com/Trees |
| 9 | Don't Starve (2013) | 4-stage looping growth, chops per stage, Treeguard | https://dontstarve.wiki.gg/wiki/Tree/Evergreen |
| 10 | RimWorld (2018) | Multi-copy plant meshes, leafless/snow graphics, fall-colour shader, wind | https://rimworldwiki.com/wiki/Modding_Tutorials/Plant_Rendering |
| 11 | Factorio (2016/2020) | Trunk/leaf split, 4 leaf levels, colourable leaves, pollution greying | https://direct.factorio.com/blog/post/fff-86 ; https://wiki.factorio.com/Trees |
| 12 | Ultima Online (1997) | Lumberjacking tiers, forests as resource | https://uoguide.com/Lumberjacking |
| 13 | Old School RuneScape (2001/2013) | Tree tiers by level/silhouette | https://oldschool.runescape.wiki/w/Woodcutting_guide_p2p |
| 14 | Animal Crossing: New Horizons (2020) | Hardwood/cedar trees, seasonal (reference only) | https://nookipedia.com/wiki/Item:Hardwood_Tree_(New_Horizons) |
| 15 | Chrono Trigger (1995) | SNES forest tiles (unused-graphics reference only) | https://new.tcrf.net/Chrono_Trigger_(SNES)/Unused_Graphics |
| 16 | Seiken Densetsu 3 (1995) | SNES mode/layer notes (reference only) | https://wiki.superfamicom.org/seiken-densetsu-3 |
| 17 | Haven & Hearth / Dwarf Fortress | Tree as growable resource in top-down sims (reference only) | https://ringofbrodgar.com/wiki/Tree ; https://dwarffortresswiki.org/Tree |

Not verified this pass (URLs to add later): Link's Awakening, Minish Cap, Secret of Mana, EarthBound, FF6, Harvest Moon, Diablo II Act 1. The Spriters Resource pages were not opened (links only, by rule).

---

## Algorithms worth demoing (pseudocode)
```
// Stardew-style canopy fade (per tree, per tick)
alpha = min(1, alpha + 0.05)
if tree.mature and rect(trunkX-1, trunkY-5, 3 tiles, 4.5 tiles).intersects(player.bbox):
    alpha = max(0.4, alpha - 0.09)
drawTrunk(opaque); drawCanopy(alpha)

// GBA-style layer split (zero runtime cost)
for each tree metatile: bottomLayer = trunk/ground tiles; topLayer = canopy tiles
render: BG_bottom -> sprites(sorted) -> BG_top(canopy)

// Tibia-style painter order
for floor in lowest..highest: for diag in 0..W+H-1: for (x,y) on diag:
    draw ground, borders, bottom, items (offset up-left by size-1 tiles and displacement), creatures, top

// Factorio pollution degradation (per chunk tick)
if chunk.pollution > 60: for random tree in chunk:
    if tree.damage < 1.2 (or 1.2 - stage for half the trees):
        either tree.leafStage++ or tree.gray += 0.067 ; chunk.pollution -= 10
```

## Sources
- https://github.com/pret/pokeemerald/wiki/Triple-layer-metatiles
- https://huderlem.github.io/porymap/manual/tileset-editor.html
- https://ds-pokemon-hacking.github.io/docs/generation-iv/guides/hgss-headbutt_trees
- https://git.halext.org/scawful/yaze/src/tag/v0.3.0/docs/F1-overworld-loading.md
- https://git.halext.org/scawful/oracle-of-secrets/src/branch/master/Docs/World/Overworld/ZSCustomOverworld.md
- https://zeldawiki.wiki/wiki/Lost_Woods
- https://wiki.superfamicom.org/grog's-guide-to-sub-screen-addition-subtraction-and-mask-windows-on-the-snes
- https://github.com/edubart/otclient/blob/master/src/client/thingtype.cpp ; …/mapview.cpp ; …/tile.cpp
- https://tibiamaps.io/guides/map-file-format
- https://github.com/WeDias/StardewValley/blob/master/TerrainFeatures/Tree.cs (decompiled; read only)
- https://stardewvalleywiki.com/Trees
- https://www.curseforge.com/stardewvalley/mods/show-players-behind-map-tiles
- https://github.com/Esca-MMC/TransparencySettings
- https://serebii.net/blackwhite/seasons.shtml ; https://serebii.net/black2white2/seasons.shtml
- https://dontstarve.wiki.gg/wiki/Tree/Evergreen
- https://www.rimworldwiki.com/wiki/Trees ; https://rimworldwiki.com/wiki/Modding_Tutorials/Plant_Rendering
- https://direct.factorio.com/blog/post/fff-86 ; https://wiki.factorio.com/Trees
- https://uoguide.com/Lumberjacking
- https://oldschool.runescape.wiki/w/Woodcutting_guide_p2p
- Blocked or failed: tibia.fandom.com/wiki/Trees (allowlist), bulbapedia Season page (client error), snes.nesdev.org (allowlist), vgmaps forum (redirect loop), Animal Crossing breezewiki (bot-block), dontstarve.fandom (allowlist).
