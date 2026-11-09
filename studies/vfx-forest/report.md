# Top-down pixel forests: tiny algorithms for thousands of living trees

**Kingsfoil Studios · Research study · November 2026**

---

## Context

This is study #4 in our VFX series. Each study picks one concept and hunts for old-school algorithms that are very small and very efficient.

- **Study #1, snow** [S2]: a depth byte drawn through a dither threshold, shelter masks, and palette lighting.
- **Study #2, acid** [S3]: material tables, stage colours and metaballs.
- **Study #3, rain** [S4]: wetness, puddles, ripples, drips and wind sway.

The reference is still the **DOOM PSX fire** [S1]: one number per cell, one local rule, one palette.

A forest is the opposite of weather. Rain is one value spread over the world. A forest is **thousands of separate objects**. Each must:
- look slightly different from its neighbours;
- stand in a believable place;
- change with the seasons on its own schedule;
- react when someone walks past;
- and cost almost nothing to draw.

Every part of that has a classic answer of a few lines: a climate lookup table, a blue-noise scatter, a palette row per season, a whole-pixel row shift for wind, a fade for occlusion, and a flee radius for birds.

**Targets.**
- Godot 4, web-first, so the **Compatibility renderer** (WebGL 2, no compute).
- Top-down (3/4) pixel art for the Tibia-like MMORPG **Asterion Online** and a top-down RPG.
- Weak hardware.

**Sources.** Eight research notes (01–08) and our playable **Forest Sandbox** [S5].

---

## 1. Executive summary

1. **The roots: two-layer tiles, a painter's sort, and a fade.**
   - GBA Pokémon splits each 16×16 metatile into two layers. The top layer covers the player through hardware priority, at zero cost [V, S6]. GBC colour 0 never covers sprites, so leaf gaps show the player [V, S17]. ALttP adds a full-screen canopy overlay, `0x9E` [V, S9].
   - **Tibia** draws a 64×64 tree **up and to the left** of its tile and paints the map along diagonals, so a tree simply hides you. There is no see-through [V, S13, S14].
   - **Stardew** fades only the tree top, to **40 %**, when the player enters a 3×4.5-tile rect. Out in ~14–15 ticks, back in ~12 [V, S23; arithmetic in §12].
2. **A forest is a climate table plus noise.**
   - Temperature × moisture goes into a Whittaker-style table [V, S185, S199]. Minecraft uses 5 × 5 levels with nearest-biome fallback [V, S52]; Luanti uses Voronoi points [V, S166].
   - Each type carries density and species weights. Multiply each weight by its own slow noise and birches form groves (Veloren's "proclivity" works similarly) [V, S167; I].
3. **Place trunks with blue noise; for an MMO, use the stateless kind.**
   - Bridson's Poisson-disk is O(N) with k = 30 [V, S201]. A jittered grid needs no neighbours and streams by chunk [I]. Deussen 1998 halftones a density image [V, S208]. Lane 2002 places big trees first [V, S211].
   - The Sandbox keeps 4,478 trees from 9,301 candidates, plus 3,542 bushes and ferns [I, Sandbox run].
4. **Draw trees as pixel artists do.**
   - Slynyrd: 2×2 px leaf units in ball-shaped bundles, "4 or 5 colors per bundle", one consistent light [V, S181].
   - Reeves & Blau shade by depth into the canopy, which is a palette ramp in pixels [V, S206]. Deussen & Strothotte outline only at depth jumps [V, S210].
5. **Seasons: a palette row per stage, a phase offset per tree.**
   - Stardew ships seasonal sheets [V, S23]. RimWorld recolours in a shader [V, S39]. Minecraft tints grey leaves from a 256×256 map [V, S50]. An indexed sprite plus a LUT costs almost no memory [I].
   - Maples and birches turn early, oaks later, larch last [V, S190, S192]. Hopkins' law adds ~4 days per degree of latitude or 400 ft of altitude [V, S193]. Per-tree offsets make the forest turn one tree at a time [I; S5].
6. **Interaction: behind, beside, beneath, plus a shake.**
   - **Behind:** a fade, a cutaway circle or an x-ray silhouette [V, S23, S61, S62].
   - **Beside:** only trunks collide. Bushes slow and rustle; SPD tramples with 4 leaves [V, S170], and Brogue regrows at 1 % per turn [V, S171].
   - **Beneath:** a shade ellipse darkens the character a step. Sunflecks are sun images ~1/100–1/108 of the gap height across [V, S196, S197].
   - **Shake:** Stardew rotates the top by at most π/128 [V, S25].
7. **Birds: critters first, boids second.** Stardew checks every 200 ms; ground birds flee at **4 tiles**, a woodpecker at **6** [V, S25]. In flight, three boid rules [V, S220], about **7 neighbours** [V, S222], and a wrap box just off-screen (*Batman Returns*) [V, S95].
8. **Performance: one atlas, one material, chunked y-sort, whole-pixel sway.**
   - Compatibility batches quads that share texture, material and state; MultiMeshes always break the batch [V, S100].
   - A y-sorted parent sorts every visible child every frame, so chunk the forest [V, S101].
   - Godot 4.4 gives 2D per-instance uniforms "without breaking batching" [V, S112]. 4.7 adds `DrawableTexture2D` for shade and litter maps [V, S115].
   - Sway in whole-pixel bands (the HDMA trick) [V, S18, S137; I].
   - Atlases took one web game from **240 to 38 draw calls** [V, self-reported, S127]. Bunnymarks reach ~**5k sprites on a laptop, 2k on an old phone** [V, community, S126].
   - **Plan:** trees deterministic from the seed; only changes are synced; one shared shader (§7).

---

## 2. How to read this study

| Tag | Meaning |
|---|---|
| **[V]** | Verified in a source our researchers read: code, paper, docs, wiki or article. "[V, vendor]", "[V, self-reported]" and "[V, community]" mark figures reported by their authors. |
| **[I]** | Author inference or design proposal; untested unless it says "Sandbox", and then tested only in our JavaScript prototype. |
| **[U]** | Unverified: memory, a search title, or a page that could not be fetched. Treat it as a lead. |
| **[K]** | Textbook or canonical knowledge. |

- [S#] refers to §14.
- Ratings (1–5) are author judgement: **Simplicity · Speed · Pixel taste · Aliveness · Variety**.
- **[I, Sandbox run]** marks numbers from replaying the Sandbox's own code headless in Node.js with its fixed seed (20261109). They are illustrative.
- Render time measured in headless Chromium on our machine was **~2–13 ms per frame, depending on biome density**. That is a Canvas 2D figure, illustrative only.
- Real-world sizes map at **32 px = 1 m** [I].

---

## 3. Generations: a timeline

**Gen 0: the science of trees, light and flocks**
- **1889 / 1919:** Hopkins' bioclimatic law [V, S193]. **c. 1937:** Minnaert's sunflecks, ≈ 1/108 of gap height [V, S197]. **1947:** Holdridge life zones; **1975:** Whittaker biomes [V, S199].
- **1968:** Lindenmayer's L-systems; **1990:** ABOP [V, S203, S204]. **1984:** Aono & Kunii [V, S205]. Lucasfilm's *André and Wally B.* uses particle trees [V, S206].
- **1985:** Reeves & Blau, depth-into-canopy shading [V, S206]. **1986–87:** Cook's jittered sampling [V, S202]; Reynolds' boids [V, S96, S220].
- **1995:** Weber & Penn, silhouette functions and two-sine sway [V, S207].
- **1998–2002:** Deussen et al. halftone placement [V, S208]; Kowalski's graftals [V, S209]; Deussen & Strothotte's depth-jump outlines [V, S210]; Lane & Prusinkiewicz kernels [V, S211].
- **2005–2010:** Sankaran's rainfall-capped savanna [V, S188]. Bridson's Poisson-disk and Runions' space colonization (2007) [V, S201, S212]. Crysis bending in GPU Gems 3 [V, S218]. Ballerini [V, S221], Palubicki [V, S213], Hildenbrandt [V, S222].
- **2012–2019:** Gerstner [V, S216]; Stava [V, S214]; Crowther's ≈ 3.04 trillion trees [V, S187]; Makowski [V, S215].

**Gen 1: tiles, priority bits and overlays (1991–2004)**
- **1991:** *A Link to the Past*: canopy overlay `0x9E`, Lost Woods fog [V, S9, S11].
- **1995–96:** *Chrono Trigger*, *Seiken Densetsu 3* (reference) [V, S75, S76]; *Pokémon Red/Blue*'s Viridian Forest [V, S73].
- **1997:** **Tibia**: diagonal painter's order [V, S13–S15]. *Ultima Online*: lumberjacking tiers [V, S44].
- **Gen II Pokémon:** headbutt trees [V, S54]; priority colours [V, S17].
- **2002–04:** *Ruby/Sapphire/Emerald*: two-layer metatiles [V, S6].
- **Undated [U for year]:** Mark Ferrari's colour-cycled forests [V, S84, S90].

**Gen 2: systemic trees (2001–2020)**
- **2001 / 2013:** *Old School RuneScape* tree tiers [V, S45].
- **2009–10:** *HGSS* headbutt groups [V, S8]; *Pokémon B/W* monthly seasons [V, S31].
- **2013:** *Don't Starve*'s looping growth [V, S34].
- **2015:** Factorio splits leaves from trunk [V, S41].
- **2016:** *Stardew Valley* [V, S23–S26].
- **2018:** RimWorld's fall-colour shader [V, S38, S39]; Factorio merged shadows [V, S42].
- **2019:** Factorio distortion sway [V, S43].
- **2020:** *Animal Crossing: New Horizons* tree shaking [V, S57].

**Gen 3: engines, shaders and the web (2023–2026)**
- **2023:** Slynyrd's top-down trees [V, S181].
- **Mar 2025:** Godot 4.4: instance uniforms, batching on all backends [V, S112].
- **Sept 2025:** Godot 4.5: merged tile physics, WASM SIMD [V, S113].
- **Nov 2025:** WebGPU in all major browsers [V, S134]; GodotFest vegetation talk [V, S228].
- **Jan 2026:** Godot 4.6: batching GPU-cost rework [V-secondary, S118].
- **2025–26:** Pixel-snapped CC0 wind shaders [V, S137, S142]; Gentree and Desarrh's generator [V, S159, S160].
- **Apr 2026:** GodotCon talks on procedural pixel art and a million trees [V, S226, S227].
- **May–Aug 2026:** *Mina the Hollower* (29 May) [V, S69]; *Fields of Mistria* 1.0 (5 Aug) [V, S70].
- **19 Jun 2026:** Godot 4.7: `DrawableTexture2D`; web is still WebGL 2 [V, S115, S122].
- **Upcoming:** *Witchbrook* on 28 Jan 2027 [V, S71]; *Haunted Chocolatier* undated [V, S72].

---

## 4. Technique profiles

There are seven families:

- **A.** Roots of tree drawing
- **B.** Forest composition
- **C.** Seasons and colour
- **D.** Wind and life
- **E.** Interaction
- **F.** Birds
- **G.** Performance

Each profile ends with ratings for **Simplicity · Speed · Pixel taste · Aliveness · Variety** (1 = poor, 5 = excellent; author judgement). Sandbox constants are listed in full in §8.

### Family A: Roots of tree drawing

### A1. Two-layer metatiles and the priority bit

*In plain words.* Cut every tree in two. The trunk goes on the floor layer under characters, and the leafy top on a ceiling layer over them. "Walking behind" a tree is really walking under its top layer, and the hardware does it for free.

*How it works (technical).*
- **GBA (pokeemerald)** [V, S6, S7]:
  - A 16×16 metatile is 2 layers × 2×2 tiles of 8×8 px (`NUM_TILES_PER_METATILE = 8`).
  - Layer types: Normal (BG1+BG2), Covered (BG2+BG3), Split (BG1+BG3).
  - BG1 has priority 1. The player starts at elevation 3, so BG1 covers the player. Each palette holds 16 colours.
- **GBC (pokecrystal)** [V, S17]:
  - Bit 7 of the tile attribute is priority, so colours 1–3 draw above sprites.
  - Colour 0 never covers sprites, so leaf gaps show the player.
- **Gameplay sits on top as data.** An HGSS headbutt tree is just coordinates: permission `0x06`, collision `0x80`, up to 6 pairs per "Tree Group" [V, S8].
- **Godot** [I]: a "Trunks" TileMapLayer (y-sorted) plus a "Canopy" TileMapLayer with `z_index` above the player.

*Cost / performance.* Zero per frame, one extra layer [I].

*Games that used it.*
- Pokémon Emerald: https://github.com/pret/pokeemerald/wiki/Triple-layer-metatiles
- Pokémon Crystal priority colours: https://github.com/pret/pokecrystal/wiki/Allow-map-tiles-to-appear-above-sprites-(so-NPCs-can-walk-behind-tiles)-with-PRIORITY-colors

*How it feels.* Calm and classic. Under dense canopy the player vanishes, which reads as "deep woods" but can hide too much [I].

*Risks.*
- The player is fully hidden.
- Every tree needs a clean trunk/canopy split on the tile grid.
- Fading a whole TileMapLayer fades every tree [V, S129].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 5 · Aliveness 1 · Variety 2

### A2. Full-screen canopy and fog overlay (ALttP)

*In plain words.* Over a forest area, lay one semi-transparent sheet of leaves or fog across the screen. You see through it, but the woods feel thick and closed.

*How it works (technical).*
- ALttP overlays are "collections of tile positions and tile IDs" in area maps `0x80–0x9F` [V, S9].
  - `0x9E` = "Tree Canopy (Forest)"; `0x9D` = Lost Woods/Skull Woods fog; `0x97` = Master Sword fog.
  - `0x9E` is one of the foreground overlays, drawn over map tiles with transparency.
- Overlays sit on the **subscreen**, chosen per area by an `.OverlayTable` [V, S10].
- SNES colour math adds or subtracts the sub-screen, and can add a fixed colour at 32 levels [V, S12].
- The Lost Woods fog lifts once Link takes the Master Sword [V, S11].
- **Godot** [I]: a CanvasLayer with a tiled leaf texture at low alpha.

*Cost / performance.* One fetch and one blend per pixel [I].

*Games that used it.*
- Zelda: A Link to the Past: https://git.halext.org/scawful/yaze/src/tag/v0.3.0/docs/F1-overworld-loading.md

*How it feels.* Strong mood for little work. It also works as a story beat [I].

*Risks.*
- Its parallax and blend mode are unconfirmed [U].
- It is atmosphere, not per-tree occlusion.
- A full-screen alpha layer costs fill rate on weak GPUs [I].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 4 · Pixel taste 4 · Aliveness 3 · Variety 1

### A3. Tibia: big objects drawn up-left, painted by diagonals

*In plain words.* A tree is one item on one tile, but its picture is 2×2 tiles. It spreads up and to the left. The map is painted diagonal by diagonal, so whatever is further down covers whatever is further up. There is no fade: a tree simply hides you.

*How it works (technical).* From OTClient, the open-source Tibia client:
- `screenRect = dest + (textureOffset − m_displacement − (m_size − (1,1)) * 32)` [V, S13]. A 64×64 tree on tile T covers T and its north and west neighbours.
- The default displacement for items with that attribute is 8,8 px [V, S13].
- The map loops "through diagonals beginning at top left", floor by floor [V, S14].
- Per tile: ground → borders → onBottom → items → creatures → onTop [V, S15].
- Pattern slots (`patternX/Y/Z`) give per-position variants of one item [V, S13; I for trees].
- The minimap stores `0x0C` for "tree" [V, S16].

*Cost / performance.* Zero: it is the normal draw order [I].

*Games that used it.*
- Tibia (OTClient): https://github.com/edubart/otclient/blob/master/src/client/thingtype.cpp

*How it feels.* An honest board game: trees are pieces. Paths must be kept clear of tall trees [I].

*Risks.*
- Players and loot can hide completely.
- Whether canopies are flagged "onTop" is unconfirmed [U, S66].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 5 · Aliveness 1 · Variety 3

### A4. Building a pixel tree: clusters, ramps, light, outlines, silhouettes, bark

*In plain words.* Draw round bundles of leaves, not leaves. Shade each bundle like a ball lit from one side, with four or five colours, and keep the light on the same side everywhere. Outline only where bundles overlap. Change the bark and the silhouette per species.

*How it works (technical).*
- **Slynyrd** [V, S181, S182, S183]:
  - Leaf unit: "a small 2x2px square" (squares may touch, not overlap).
  - "Even ball shapes work great for me." "4 or 5 colors per bundle is plenty."
  - Shading: a darker crescent on one side, a smaller highlight on the other, one consistent light.
  - Conifers: build top-down; "some branches should cast drop shadows on lower adjacent branches."
  - Bark: stripes "widest in the center", plus a knot or root.
  - "Not every leaf needs to be represented." Stagger overlapping rows to make gap-free forest walls. Save asymmetric trees for sparing use.
- **Reeves & Blau 1985** [V, S206]: diffuse light from depth into the canopy on the light side; ambient from distance to the edge; random glints on the lit rim only. In pixels [I]: `index = floor(clamp(k1·d_light + k2·(R − d_edge) + bayer·0.25) · (STEPS−1))`.
- **Deussen & Strothotte 2000** [V, S210]: outline only where the depth jump exceeds a threshold. Bigger primitives and thresholds give more abstract trees. In pixels [I]: dark lines where an upper blob overlaps a lower one, and on the silhouette.
- **Weber & Penn 1995** [V, S207]: one ShapeRatio per species gives the half-width per height: conical 0.2+0.8r (pine), spherical 0.2+0.8·sin(πr) (oak), flame (poplar).
- **Mina the Hollower** [V, S68]: a 64-colour palette. Backgrounds use "cool, earthy" tones; saturation is reserved for sprites. For forests [I]: desaturated trees, so birds, fruit and pickups pop.

*Cost / performance.* Art or bake time only. Sizes for 16 px tiles: 32×48, 48×64–48×96 (Stardew's top is 48×96), 64×96+ for landmarks [I; V, S25].

*Games that used it.*
- Stardew Valley: https://stardewvalleywiki.com/Trees
- Mina the Hollower: https://www.yachtclubgames.com/blog/the-art-of-the-game

*How it feels.* Legible and hand-made, even when generated [I].

*Risks.*
- "Too much variation will create displeasing noise." [V, S182]
- Inconsistent light between assets breaks the world [I].
- Long cast shadows collide with other assets [V, S183].

*Ratings 1–5 (author judgement):* Simplicity 3 · Speed 5 · Pixel taste 5 · Aliveness 2 · Variety 4

---

### Family B: Forest composition

### B1. Climate → biome table

*In plain words.* Two smooth noises give every point a temperature and a moisture. A small table turns the pair into a forest type, and each type knows its trees.

*How it works (technical).*
- **Whittaker (1975)**: biomes on temperature × precipitation axes, a simplified Holdridge [V, S199].
- **Red Blob** (e, m in 0..1) [V, S185]:
  - e > 0.6: m ≥ 0.66 gives taiga.
  - e > 0.3: m < 0.83 gives temperate deciduous, above that temperate rain forest.
  - Lower: m < 0.66 gives tropical seasonal forest, above that tropical rain forest.
  - Moisture can be distance from rivers, which makes riparian belts [V, S186].
- **Minecraft**: 5 temperature × 5 humidity levels among six parameters; a point outside every biome takes the **closest** one [V, S52].
- **Luanti**: (heat, humidity) points, nearest wins. Taiga 25/70, deciduous 60/68, rainforest 86/65, savanna 89/42 [V, S166].
- **Sandbox** [I]:

```
biome = T<0.30 ? BOREAL : T<0.48 ? (M>0.50 ? MIXED : BIRCH)
      : T<0.70 ? (M>0.42 ? DECIDUOUS : OPEN_OAK) : (M>0.50 ? RAINFOREST : SAVANNA)
```

*Cost / performance.* Two noise samples and a compare chain per cell, once [I].

*Games that used it.*
- Minecraft: https://wiki.ronlab.site/content/minecraftwiki_en_all_maxi_2025-11/World_Generation
- Luanti / Minetest Game: https://github.com/luanti-org/minetest_game

*How it feels.* The world makes sense: cold north, wet coasts, open savanna. Forest type becomes regional identity [I].

*Risks.*
- Hard thresholds give straight seams. Blend weights near edges [I].
- Thresholds need tuning [V, S185]. The Sandbox's boreal band takes 32.3 % of the map [I, Sandbox run].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 3 · Aliveness 2 · Variety 5

### B2. Species weights with cluster noise and interaction kernels

*In plain words.* Each forest type has a recipe, like "60 % spruce, 30 % pine, 10 % birch". Rolling dice for every tree gives a speckled mix. Real forests come in patches, so each species gets its own slow noise that raises its share in some places.

*How it works (technical).*
- **Veloren** [V, S167]: `proclivity = ideal × close(humid) × close(temp) × close(near_water)`. Ideal values include Oak 1.0, Birch 0.65 and Cherry 12.0. `shrub_density_factor` ties undergrowth to species.
- **TerraFirmaCraft**: per-species `min/max_rain` and `min/max_temp` envelopes [V, S53].
- **Lane & Prusinkiewicz 2002** [V, S211]:
  - After placing a plant of size r, multiply density by a kernel κ(d/r). κ < 1 nearby inhibits; κ > 1 on a ring promotes groves.
  - **Place the largest plants first.**
  - Measure with the **Hopkins index** H (≈ 1 random, < 1 regular, > 1 clustered; reported 0.4–2.4).
- **Makowski 2019**: dense stands grow taller and **asymmetric** [V, S215]. Pick a variant leaning away from a close tall neighbour [I].
- **Sandbox** [I]: `w = weight × (0.3 + 1.4·noise(x/90 + i·13, y/90 + i·7))`.

*Cost / performance.* One noise sample per species per tree, at generation [I].

*Games that used it.*
- Veloren: https://gitlab.com/veloren/veloren
- TerraFirmaCraft: https://terrafirmacraft.github.io/Documentation/1.18.x/worldgen/features/trees

*How it feels.* Groves you can name and navigate by. The Sandbox's birch grove ends up 73 % birch [I, Sandbox run].

*Risks.*
- High noise contrast gives monocultures with hard seams [I].
- Lane publishes no kernel shapes or radii [V, S211].
- Veloren is GPL-3: re-implement the idea, don't copy it [I].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 4 · Aliveness 3 · Variety 5

### B3. Placement: Poisson-disk vs jittered grid vs local-max noise vs halftone

*In plain words.* Trees should be spread out, but not in rows, and never inside each other. "Blue noise" does that. There are four cheap ways to get it; pick by how your world is generated.

*How it works (technical).*
- **Bridson 2007** [V, S201]:
  - The grid cell is r/√2, so each cell holds at most one sample.
  - From a random active sample, try up to **k = 30** candidates in the annulus [r, 2r]. Accept the first that is ≥ r from all neighbours; otherwise retire the sample.
  - The cost is **O(N)**.
- **kchapelier (MIT)**: `distanceFunction` gives density-varying spacing. The fast-2d version makes ~8,407 points in 23.7 ms (800×800, r = 8) [V, S148, S149].
- **Jittered grid** [I]: one candidate per cell, jitter ≤ 0.5 cell, keep with probability = density. It is stateless, so it suits MMO chunks.
- **Red Blob local max**: a tree where high-frequency noise peaks within radius R; vary R per biome [V, S185].
- **Deussen 1998**: Floyd–Steinberg halftone of a density image, then relax toward Voronoi centres [V, S208].
- **Minecraft** is not blue noise: per-chunk random positions, thinned by 1/200-scale noise and rarity filters [V, S51].

*Cost / performance.* The Sandbox's Bridson (r = 9 px, k = 24) gives 9,301 candidates in ~70 ms of Node.js [I, Sandbox run]. GDScript is perhaps 10–50× slower, so bake or thread it [I, note 07].

*Games that used it.*
- Minecraft: https://wiki.ronlab.site/content/minecraftwiki_en_all_maxi_2025-11/Placed_feature
- Godot addon: https://godotengine.org/asset-library/asset/559

*How it feels.* Natural and even, with no grid lines and no overlaps [I].

*Risks.*
- Bridson needs neighbours at chunk seams; generate with a 1-chunk margin [I].
- Pure blue noise is *too* even. Add B2 clustering [I].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 4 · Aliveness 2 · Variety 4

### B4. Density, clearings, paths, edges and undergrowth layers

*In plain words.* A forest has thick cores, open glades, a trail, a bushy sunlit edge and a floor of ferns. Each is a cheap rule after placement.

*How it works (technical).*
- **Clearings** [I]: `density = biomeDensity × smoothstep(c0, c1, fbm(p·0.02))`; reject if `density < rand()`.
- **Paths** [I]: reject trees within 1.5 tiles of the path polyline, so trees line it.
- **Edges** [I]: ramp density over 3–6 tiles. Put shrubs in the ramp and big old trees only where density > 0.8.
- **Undergrowth passes** [V, S53, S166]:
  - TerraFirmaCraft has separate `tree_count`, `bush_count` and `groundcover_count`.
  - Luanti places decorations with Perlin noise, e.g. apple trees at offset 0.024, scale 0.015, spread 250.
- **Pass order** [I]: trees (r ≈ 2–4 tiles), then shrubs (r ≈ 1–1.5), then groundcover per tile. Suppress shrubs under dense canopy.
- **Savanna** [V, S188]: below ~650 mm of rain, woody cover rises with rainfall; above it, fire and grazing keep it open. Rule [I]: `cover_cap = lerp(0, max, P/650)`.
- **Cover targets** [I]: dense forest 60–80 % of tiles under crowns, open woodland 20–40 %, savanna 5–15 %.

*Cost / performance.* Generation time only. Undergrowth roughly doubles the item count: 3,542 bushes and ferns to 4,478 trees in the Sandbox [I, Sandbox run].

*Games that used it.*
- TerraFirmaCraft: https://terrafirmacraft.github.io/Documentation/1.18.x/worldgen/features/trees
- Terraria (≥ 3 open tiles between saplings): https://terraria.wiki.gg/wiki/Trees

*How it feels.* Structure: deep woods, trails and glades. This is where "forest" lives [I].

*Risks.*
- Test paths against crown radius, not trunk position, or canopies hang over the trail [I].
- Undergrowth is the first thing to bake when the budget is tight (G5) [I].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 4 · Aliveness 3 · Variety 5

### B5. Size, age, growth stages, deadwood and old growth

*In plain words.* Mix saplings, mature trees, a few giants and some dead snags. Let the mix cycle, so the forest keeps renewing itself.

*How it works (technical).*
- **Stardew**: stages 1–4, mature at 5; 20 % growth chance per night; median ~24 days; no winter growth [V, S26].
- **Don't Starve**: sapling → small → medium → tall → old, then **back to short**. Axe hits 5/10/15/1 [V, S34].
- **OpenTTD** [V, S169]:
  - **7 stages**: growing 1–3, grown, dying 1–2, dead. Up to 4 trees per tile.
  - Updates spread by `cycle = 11x + 9y + (tick>>8)`.
  - A grown tree may start dying, add a tree or seed a neighbour.
- **TerraFirmaCraft** [V, S53]: old growth 1 in 6 trees, fallen log 1 in 14 chunks, dead 1 in 75 trees.
- **Deussen 1998**: **7 size classes** per species; 56 representative plants stood in for ~102,522 [V, S208].
- **Self-thinning** [V, S208, S211]: when two plant circles intersect, the smaller dies. Run 20–50 steps per chunk offline for natural size gradients [I].

*Cost / performance.* One byte of stage per tree and a staggered tick [I].

*Games that used it.*
- Don't Starve: https://dontstarve.wiki.gg/wiki/Tree/Evergreen
- OpenTTD: https://github.com/OpenTTD/OpenTTD

*How it feels.* A living, mixed-age wood [I].

*Risks.*
- Every stage is another sprite unless scaled (G6).
- In an MMO, growth is server state (§7).
- OpenTTD is GPL-2 [V, S169].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 4 · Aliveness 4 · Variety 5

---

### Family C: Seasons and colour

### C1. Palette/LUT season swap (with blossom and fruit indices)

*In plain words.* Draw each tree once with numbered colours. A small table says what each number means this season. Changing season means reading another row. A blossom is just one number that turns pink in spring.

*How it works (technical).*
- **Alternatives** [V, S23, S39, S40, S21]:
  - Stardew loads one sheet per type per season (`tree{type}_{season}`).
  - RimWorld recolours autumn in a shader (`_FallColorSource/Destination`, a gradient texture).
  - Factorio's leaves are "colorable".
  - Emerald Crest swaps palettes, and autumn grass shares the tree palette.
- **Indexed sprite + LUT** [V, S145; I]: the CC0 3-line shader reads red as the index: `COLOR = texture(palette, vec2(COLOR.r + .05, .5))`. Rows = species × season, e.g. 48 rows × 16 colours, a few KB.
- **Six states:** commercial packs ship spring, summer, autumn, autumn bare, winter bare, winter + snow [V, S163].
- **Index tricks** [I, note 08]:
  - highlight index → pink in spring (blossom);
  - leaf indices → transparent in winter (needs branches painted underneath);
  - top-lit indices → white (snow cap).
- **Fruit**: Cataclysm: DDA's apple tree is harvestable in autumn only, then `looks_like` a dead tree until it regrows [V, S168].

*Cost / performance.* Two fetches per pixel and no VRAM per season. Separate sheets cost 4× canopy art [I].

*Games that used it.*
- RimWorld: https://rimworldwiki.com/wiki/Modding_Tutorials/Plant_Rendering
- LPC Seasoned Trees: https://opengameart.org/content/lpc-seasoned-trees

*How it feels.* The world changes with one number [I].

*Risks.*
- It can't change the silhouette; winter still needs bare branches (C4).
- Index textures must be nearest-filtered and lossless [I].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 5 · Aliveness 3 · Variety 5

### C2. Biome colormap tint

*In plain words.* Paint leaves grey, then look up their colour in a small picture whose axes are temperature and rain. One sprite becomes lush in the jungle and olive in dry land.

*How it works (technical).*
- Minecraft's `foliage.png` is **256×256**. `T = clamp(temp)`, `R = clamp(rain)·T`, so only a triangle is used. Spruce and birch keep fixed palettes [V, S50].
- Veloren lerps a seeded per-tree colour range, giving every tree its own tint [V, S167].
- Pixel version [I]: pick a palette **row** from the map cell, rather than multiplying RGB.

*Cost / performance.* One lookup per tree, stored in an instance uniform (G2) [I].

*Games that used it.*
- Minecraft: https://optifine.readthedocs.io/colormaps.html

*How it feels.* Smooth regional colour with no seams [I].

*Risks.*
- Continuous tints drift off-palette [I].
- Signature species should opt out, as Minecraft's spruce and birch do [V, S50].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 3 · Aliveness 2 · Variety 4

### C3. Per-tree phenology offsets and dithered turns

*In plain words.* In autumn, maples turn first, then birches, then oaks, and the larch goes gold last. Hilltop trees turn earlier than valley trees, and neighbours of one species differ by a few days. Give each tree its own delay, and the season sweeps through the forest.

*How it works (technical).*
- **Biology** [V, S190, S191, S192]:
  - Carotenoids (yellow) are always present; most red anthocyanins are made in autumn.
  - Day length triggers the change. Weather sets speed and vividness: drought gives muted colour, cool sunny nights brighter reds.
  - Maples and birches colour "relatively early"; oaks later and russet.
  - Tamarack drops gold needles in late October to early November, after the hardwoods.
- **Hopkins' law** [V, S193]: about **4 days per degree of latitude or per 400 ft of altitude**.
- **Individuals** differ in senescence; no magnitude in days was given [V, S194].
- **Rule** [I, note 03]:

```
phase = season_t - species.offset          // offset = delay: maple/birch −0.02 (early), oak +0.03, larch +0.05 (late)
      + elevation*k_elev                   // Hopkins band
      + hash01(id)*0.03 − 0.015            // ±5 days
row   = species.lut(phase)
use_next = bayer4(FRAGCOORD.xy) < p        // dithered transition, p 0→1 over 1–3 days
```


*Cost / performance.* One float per tree, one compare per pixel [I].

*Games that used it.*
- Pokémon B/W (whole-world monthly seasons): https://serebii.net/blackwhite/seasons.shtml
- RimWorld (leafless at −2 °C, sturdier trees at −10 °C): https://www.rimworldwiki.com/wiki/Trees

*How it feels.* The strongest seasonal "alive" signal: the forest is *becoming* autumn [I].

*Risks.*
- Too much jitter looks random. Keep species order dominant [I].
- Spring order and blossom timing are uncited [U].
- Hard per-tree flips (as in the Sandbox) pop; dither them [I].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 5 · Aliveness 5 · Variety 5

### C4. Winter: bare branches by recursion, snow on conifers, interception

*In plain words.* In winter, broadleaf crowns vanish and branches show. A tiny recursive function draws them. Conifers keep needles and carry snow on each tier, and less snow reaches the ground under them.

*How it works (technical).*
- **Recursion** [V, S91, S203]:
  - The 140-character "Windy Tree" dweet recurses with thickness ×0.97, forks a ×0.6 child after 9 steps, and adds `sin(t + counter)/149` to every angle.
  - ABOP grammars such as `X→F[+X]F[−X]+X; F→FF` (δ 20°) work at 3–4 iterations for sprites [I, note 04].
- **Pipe model**: exponent 2–3, so 1 px twigs, 2–3 px limbs, 4–6 px trunks [V, S212; I].
- **Snow** [V, S195, S39]:
  - Narrow down-sloped conifers "shed" heavy snow.
  - RimWorld adds a snow overlay above 80 % cell snow.
  - Pixel rule [I]: whiten the top 1–2 px of each tier.
- **Interception**: OpenTTD sets snow density from height above the snowline, `min(k,3)` [V, S169]. The Sandbox cuts ground snow by `canopyDensity × 0.65` [I].

*Cost / performance.* Bake time only. Per-frame recursion costs ~2^depth segments, so keep it for a hero tree [I, note 08].

*Games that used it.*
- Stardew Valley (pine keeps its leaves): https://stardewvalleywiki.com/Trees
- Windy Tree dweet: https://redlib.ssps.io/r/tinycode/comments/1bwmidr/dweet_of_the_week_windy_tree_by_killedbyapixel

*How it feels.* A quiet winter where the forest becomes a sketch [I].

*Risks.*
- Generated branches must match the hand-made light and bark ramp [I].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 4 · Aliveness 3 · Variety 4

### C5. Pollution, disease and burn colour stages

*In plain words.* A sick forest loses leaves and greys in steps. A burnt one is black trunks. Same palette tricks, driven by a damage number.

*How it works (technical).*
- **Factorio** [V, S40]:
  - 4 leaf stages. Only chunks above 60 pollution are affected.
  - Each event costs 10 pollution and drops a stage or adds 6.7 % grey.
  - Damage stops above 120 %, and half the trees stop one stage early.
- RimWorld has a `pollutedGraphicPath` per plant [V, S39].
- Don't Starve fire spreads tree to tree; burnt trees give charcoal [V, S34].
- **Luanti leaf decay**: leaves with no trunk in range drop after 2–12 s, so falling is staggered for free [V, S166].

*Cost / performance.* One byte per tree and a random chunk tick [I].

*Games that used it.*
- Factorio: https://wiki.factorio.com/Trees

*How it feels.* The land remembers what you did [I].

*Risks.*
- Grey must be a palette row, not desaturation [I].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 4 · Aliveness 4 · Variety 3

---

### Family D: Wind and life

### D1. Integer row/band-offset sway (the HDMA trick in a sprite shader)

*In plain words.* Slide each horizontal strip of the crown sideways by whole pixels: the top a lot, the middle a little, the trunk not at all. Nothing blurs, the trunk stays planted, and the crown leans and ripples.

*How it works (technical).*
- **SNES HDMA** [V, S18, S19]:
  - A table writes a new horizontal scroll per scanline.
  - OpenSNES animates a 112-line sine wave by moving the table pointer, `phase = (phase+1) % 112`, not by rewriting the table.
- **Godot shaders** [V, S137, S142]:
  - "Pixel perfect wind & sway" (CC0) snaps UV to the texel grid and clamps to `REGION_RECT`, which is atlas-safe.
  - "Wind with pixel snapping" rounds the offset and brightens moved pixels by `offset·0.15`, a cheap leaf flip.
- **Recipe** [I, note 08]:

```glsl
float row = floor(UV.y / TEXTURE_PIXEL_SIZE.y / band);
float h   = clamp((trunk_row - row*band) / crown_h, 0., 1.);
UV.x -= round(amp_px * h * sin(TIME*speed + row*k + phase)) * TEXTURE_PIXEL_SIZE.x;
```

- **Sandbox** [I]: 3 bands with multipliers 2.2 / 1.4 / 0.7; the trunk is fixed.

*Cost / performance.* About 6 ALU and 1 sample per pixel, WebGL 2 safe. Needs 1–2 px side padding. Alternative: pre-bake 4–8 frames at 4–8× memory [I].

*Games that used it.*
- Forest Sandbox: `vfx-forest-sandbox.html`
- Shader: https://godotshaders.com/shader/2d-pixel-perfect-wind-sway-effect/

*How it feels.* A crisp lean that ripples up, never a smear [I].

*Risks.*
- No classic game sways trees per row; validate with artists [U].
- Vertex-only sway on a quad shears the whole sprite [I].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 5 · Aliveness 4 · Variety 2

### D2. Travelling gusts and per-species stiffness

*In plain words.* Wind comes in waves you can see rolling across a meadow into the trees. So sway strength is a wave moving over the map, not a clock. Spruces barely move; birches and palms flex.

*How it works (technical).*
- **Crysis** [V, S218]: bend ∝ `(height·k + 1)²`, a phase from world position, and `TriangleWave`/`SmoothCurve` instead of sin. "Too much bending will ruin the illusion."
- **Weber & Penn** [V, S207]: two sines (phase ×1 and ×0.7) scaled by wind speed and gust, plus a random phase per stem.
- **jess-codes** (CC0): noise sampled at world position makes neighbouring trees sway coherently, so gusts travel [V, S140].
- **RimWorld** offsets only top vertices (`topWindExposure` 0.25) [V, S39]. **Graveyard Keeper** animates only some leaves [V, S47].
- **Rule** [I, note 03]: `gust = smooth_tri(s/λ − t·v/λ)` with λ = 24 tiles, v = 3 tiles/s; `off ∝ gust²·h²/stiffness`. Gusts every 4–10 s can trigger leaf and bird events.
- **Sandbox flex** [I]: palm 1.5, birch 1.3, oak 1.0, pine 0.55, spruce 0.45, snag 0.25.

*Cost / performance.* One noise sample or two sines per tree. Phase and stiffness ride in instance uniforms (G2) [I].

*Games that used it.*
- Factorio (normal-map distortion sway): https://factorio.com/blog/post/fff-324
- Graveyard Keeper: https://slava.lazybeargames.com/graveyard-keeper-how-the-graphics-effects-are-made

*How it feels.* The forest breathes [I].

*Risks.*
- In-phase sway looks mechanical. Purga's v2 shader has no per-instance phase [V, S138].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 4 · Aliveness 5 · Variety 3

### D3. Ferrari edge-band colour cycling

*In plain words.* Paint a one-pixel rim of two special colours along each leaf edge, and rotate them. The leaf seems to grow and shrink by a pixel. No pixel moves; only the palette does.

*How it works (technical).*
- **Ferrari** [V, S90]:
  - Two "clown colors" along leaf edges, filled with leaf-to-background gradients.
  - Cycling makes the leaf "expand and shrink".
  - Timing is offset across the foliage so the tree doesn't sway "like a metronome".
- **Engine** [V, S84, S87]: 256 colours, no layers; only animated pixels are redrawn. Steps per second = rate/280.
- **Measured** [V, S88; note 08]:
  - "Deep Forest – Day" animates only **3.6 %** of its pixels, all water.
  - Rain raises that to 16.8 % and snow to 19.4 %.
  - "Forest Edge" has 2,851 scattered pixels cycling at ≈ 12.9 steps/s, perhaps glints [I].
- **Godot** [I]: `texelFetch(palette, idx + offset(t))`, with 2–6 indices per band and 2–3 phase-offset bands.

*Cost / performance.* About one add per pixel in a LUT shader [I].

*Games that used it.*
- Canvas Cycle: https://www.effectgames.com/demos/canvascycle/

*How it feels.* A painterly shimmer [I].

*Risks.*
- Needs indexed art and reserved indices.
- The measured forest scenes mostly cycle water, not leaves [I].

*Ratings 1–5 (author judgement):* Simplicity 3 · Speed 5 · Pixel taste 5 · Aliveness 4 · Variety 2

### D4. Falling leaves, petals and litter

*In plain words.* A few leaves drift down in autumn and petals in spring. Where they land, a pixel of colour stays.

*How it works (technical).*
- **Stardew**: 8×8 leaf particles from the tree's own sheet, 4 variants, `leafFallRate = 3` [V, S25, S23].
- **Factorio**: leaf particles in the tree's colour, no falling animation [V, S41].
- **Shattered Pixel Dungeon**: a trample bursts **4** leaves [V, S170].
- **Link to the canopy** [I]: spawn leaves ∝ canopy thinning + wind.

*Cost / performance.* A pooled particle set that shares the tree atlas [I].

*Games that used it.*
- Stardew Valley: https://stardewvalleywiki.com/Trees

*How it feels.* The cheapest autumn signal after colour [I].

*Risks.*
- Too many particles read as snow.
- Litter lists must be capped or stamped into a texture (G5) [I].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 4 · Pixel taste 4 · Aliveness 4 · Variety 2

---

### Family E: Interaction

### E1. Canopy fade: alpha (Stardew) or ordered dither

*In plain words.* Step into the zone behind a tree, and its top fades quickly to see-through. It comes back after you leave. Only the top fades. For pixel art, fade with a pattern of holes instead of real transparency.

*How it works (technical).*
- **Stardew** (decompiled Tree.cs) [V, S23, S24, S25]:
  - Every tick: `alpha = min(1, alpha + 0.05)`.
  - If the tree is mature (stage ≥ 5) and the player's box meets a **192×288 px** rect (3 × 4.5 tiles, from 1 tile left and 5 tiles up of the trunk): `alpha = max(0.4, alpha − 0.09)`.
  - That fades out in **14–15 ticks** and back in **12** [I, arithmetic; §12]. Only the top and the stump get the alpha.
  - Fruit trees use a 3 × 3.5-tile rect.
  - Map-baked trees never fade, and players made mods to fix that [V, S27, S29].
- **TransparencySettings mod**: TileDistance (e.g. 5), MinimumOpacity (e.g. 0.4) [V, S28].
- **Screen-door dither** (CC0): Bayer 4×4 /17, `COLOR.a *= step(0, M − intensity)`, with a commented player-circle option [V, S143].
- **Godot tiles**: change one tile's `TileData.modulate.a` through `_tile_data_runtime_update()` [V, S129].

*Cost / performance.* One AABB test for each tree near the player. Use a spatial grid within 2–3 tiles, not an Area2D per tree [I, note 06].

*Games that used it.*
- Stardew Valley: https://stardewvalleywiki.com/Trees
- Mod demand: https://www.nexusmods.com/stardewvalley/mods/4178

*How it feels.* Familiar and fair: a fast fade out, a slower return, and a 40 % floor [I].

*Risks.*
- True alpha leaves the palette and double-darkens overlaps. One CanvasGroup for the faded layer avoids the latter [V, S108; I].
- Dither "just looked really bad" on Bombernauts' 3D blocks. Test it in pixel art [V, S61].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 4 · Aliveness 2 · Variety 1

### E2. Cutaway circle

*In plain words.* Cut a round hole, centred on the player, in whatever stands in front of them.

*How it works (technical).*
- **Bombernauts** [V, S61]:
  - The team rejected transparency and dither.
  - Each texel inside a radius is cropped, and the hidden convex edges get outlines.
  - The radius comes from a player→camera raycast, eased.
- **Itch asset**: a dissolve-style occlusion cutout [V, S64].
- **Godot** [I]: a global `player_px` uniform, and `discard` inside radius r only if `base_y > player_y`.
- **Sandbox** [I]: a **13 px** even-odd clip, 6 px above the player's feet.

*Cost / performance.* One distance test per canopy pixel [I].

*Games that used it.*
- Bombernauts: https://gamedeveloper.com/programming/the-crop-circle-effect-in-bombernauts

*How it feels.* Clear and "gamey". It suits action, where you must see your feet [I].

*Risks.*
- A hard edge looks like UI; dither the rim.
- Gate it by "in front", or it cuts neighbouring trees too [I].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 3 · Aliveness 1 · Variety 1

### E3. X-ray silhouette

*In plain words.* The tree stays solid, but the hidden part of the player is drawn on top as a flat shape or an outline.

*How it works (technical).*
- **GDQuest** (Godot 3 code) [V, S62]:
  - The character is rendered to a Viewport, and a mask writes `10·alpha` into red.
  - Where SCREEN_TEXTURE red < 10, the character is covered, so the silhouette colour is drawn.
  - An outline variant samples 8 neighbours.
  - A full-screen version "may be costly on some low-end mobile devices."
- **Variants**: GameMaker, Construct, stencil buffer [V, S63].

*Cost / performance.* An extra sprite draw (cheap form), or a Viewport/screen read (exact form) [I].

*Games that used it.*
- GDQuest: https://www.gdquest.com/library/silhouette_2d

*How it feels.* Precise. The forest stays dense and the player stays visible [I].

*Risks.*
- Screen reads are costly on web [V, S62].
- Use a palette colour, or it looks pasted on [I].

*Ratings 1–5 (author judgement):* Simplicity 3 · Speed 3 · Pixel taste 4 · Aliveness 1 · Variety 1

### E4. Trunk collision vs passable undergrowth, with rustle

*In plain words.* Only the trunk is solid. The crown is a ceiling, and bushes are soft: you slow down, they shake and drop a leaf.

*How it works (technical).*
- **Readability rule** [I, note 06]: collide at the trunk only. Stardew's fade rect is far bigger than its trunk [V, S23].
- **Godot 4.5** merges TileMapLayer cell colliders (`physics_quadrant_size` 16) [V, S113].
- **Shattered Pixel Dungeon** [V, S170]: stepping on high grass turns it to grass, bursts **4** leaves and recomputes the field of view. The Huntress leaves furrowed grass that still hides her.
- **Brogue CE** [V, S171]: foliage blocks vision and is trampled on step. It regrows at **1 % per turn**.
- **Rustle** [I, note 06]: 2–3 frames of sway, 2–6 leaves and a 0.5 s cooldown per bush.

*Cost / performance.* A grid query around the player [I].

*Games that used it.*
- Shattered Pixel Dungeon: https://github.com/00-Evan/shattered-pixel-dungeon
- Brogue CE: https://github.com/tmewett/BrogueCE

*How it feels.* The floor has texture, and trails become choices [I].

*Risks.*
- Big colliders under canopies snag players on invisible edges [I].
- SPD (GPL-3) and Brogue (AGPL-3) are for study only [V, S170, S171].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 4 · Aliveness 4 · Variety 2

### E5. Shade ellipse and sunflecks

*In plain words.* Each tree drops a soft ellipse. Stand inside and your character darkens a step. A few light spots wander in the shade as leaves move.

*How it works (technical).*
- **Physics** [V, S196, S197]:
  - Sunflecks are pinhole images of the sun, so they are round whatever the gap shape.
  - Their width is ≈ **1/100** (NSTA) or **1/108** (Minnaert) of the gap height.
  - They become ellipses at low sun.
- **Pixels** [I, note 04]: a 6–10 m canopy at 32 px/m gives 2–3 px spots; artists exaggerate to 3–6. Stretch by 1/sin(sun elevation).
- **Shadows**:
  - Centre the shadow under the tree [V, S181].
  - Graveyard Keeper reuses ~10 rotated shadow sprites and passes rotation through a colour channel, which keeps batching [V, S47].
  - Merge overlapping shadows (G5).
- **Gameplay**: Don't Starve Together's canopy "eliminates Overheating" and cuts rain wetness by 35 % [V, S36].
- **Fleck routes** [I, note 08]:
  - Palette-cycle two ground indices, Ferrari style.
  - Or punch Bayer holes into the shadow mask with animated noise.
- **Sandbox** [I]:
  - Ellipse ry = 0.45·rx, at alpha 0.30.
  - The player's RGB is scaled ×(0.58, 0.64, 0.74) inside it.
  - 3 drifting 2×1 px flecks per tree.

*Cost / performance.* One shadow quad per tree from the atlas, plus a few ellipse tests [I].

*Games that used it.*
- Don't Starve Together: https://dontstarve.wiki.gg/wiki/Knobbly_Tree
- Graveyard Keeper: https://slava.lazybeargames.com/graveyard-keeper-how-the-graphics-effects-are-made

*How it feels.* Stepping into shade is a small physical pleasure [I].

*Risks.*
- True-size flecks read as noise [I].
- Alpha shadows stack to black unless merged [V, S42].
- No 2D game with sunflecks was found [U].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 4 · Aliveness 4 · Variety 2

### E6. Shake, chop, fell and regrow

*In plain words.* Press a button by a tree: it shivers, rustles and drops leaves, maybe a nut or a wasp nest. Hit it enough and it falls, leaving a stump that regrows.

*How it works (technical).*
- **Stardew** [V, S25, S26]:
  - Shake: the top rotates around its base by `π/128` (`π/64` for young trees), decaying, with a "leafrustle" sound and leaf particles.
  - Felling: `shakeRotation += maxShake²` with `maxShake += 0.0015` per frame, so the fall accelerates. The shadow fades as the tree tips.
  - Yield: 12–16 wood, a stump left, a 5 % daily seed chance when shaken.
- **Factorio** skips the fall animation to save memory [V, S41].
- **Rewards and caps** [V, S57, S46, S54]:
  - Animal Crossing drops Bells, furniture or wasps.
  - Terraria allows one shake per tree per day, capped at 500 per day.
  - Pokémon headbutt tiers are high 80 %, moderate 50 %, low 10 %.
- **Resource tiers**: OSRS oak 15 … redwood 90; UO oak 65 … heartwood 100 [V, S44, S45].
- **Sandbox** [I]: **E** shakes the nearest tree (shake = 1, 10 leaves), which scares its birds. There is no chopping.

*Cost / performance.* Per event. In an MMO the cost is network state (§7) [I].

*Games that used it.*
- Stardew Valley: https://stardewvalleywiki.com/Trees
- Animal Crossing: New Horizons: https://twinfinite.net/guides/animal-crossing-new-horizons-how-to-shake-trees/

*How it feels.* Touching the world: a tiny loop of anticipation and reward [I].

*Risks.*
- Uncapped rewards get farmed [I].
- Animal Crossing's limits are unverified [U].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 4 · Aliveness 5 · Variety 3

---

### Family F: Birds

### F1. Perched critters with a flee distance, species by biome and season

*In plain words.* Birds sit or peck. A few times a second each checks whether you are too close, and if so it flies off. Which birds appear depends on forest and season.

*How it works (technical).*
- **Stardew** [V, S25]:
  - `Birdie` checks every **200 ms** and flees within **4 tiles**.
  - `Woodpecker` sits on a tree, flees at **6 tiles** or when its tree becomes a stump, and pecks every 1–3 s.
  - Brown and blue birds are sprite variants of one behaviour.
- **Don't Starve** [V, S35, S83]:
  - Birds fly in from off-screen, peck, then leave.
  - They flee when anything gets close, and killing one scares the rest.
  - Species follow turf: crows, redbirds, snowbirds, usually two types at once.
- **Real flight initiation distance** [U, S200]: small birds ~5–20 m. The papers were blocked.
- **Game scale** [I, note 06]:
  - Songbird 3 tiles, gull 4, crow 5, heron 6–8.
  - Running ×1.5, sneaking ×0.6.
  - Take-off delays of 50–250 ms, so the spooking spreads.
- **Sandbox** [I]:
  - 28 birds; flee at 30 px or on a shake.
  - Dark birds in winter, parrots in rainforest, blue in spring.

*Cost / performance.* Static sprites with a 5 Hz check, essentially free [I].

*Games that used it.*
- Stardew Valley critters: https://wiki.biligame.com/stardewvalley/%E7%8E%AF%E5%A2%83%E7%94%9F%E7%89%A9
- Don't Starve: https://dontstarve.wiki.gg/wiki/Birds

*How it feels.* The forest notices you. Sneaking up on a bird is a tiny game [I].

*Risks.*
- Fixed flight loops look fake.
- In an MMO, keep birds client-side [I].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 4 · Aliveness 5 · Variety 4

### F2. Boids in flight, a wrap box, shadows and flap frames

*In plain words.* In the air, each bird follows three rules: don't bump into neighbours, fly the way they fly, and stay near the group. Birds drifting off-screen are moved back to the far side. A small shadow trails below, further off the higher the bird flies.

*How it works (technical).*
- **Reynolds 1987** [V, S220]:
  - Priority order: collision avoidance, then velocity matching, then flock centering.
  - Prioritised acceleration allocation beats averaging, which caused indecision.
  - Inverse-square weighting; O(N²), with binning proposed.
- **Starlings** [V, S221, S222]:
  - They track "a fixed number of 6-7 nearest neighbours".
  - Separation 4 m, a 2 × 45° rear blind angle and a roost attractor.
  - Banking: roll-in 10, roll-out 1.
- **Ben Eater (MIT)** [V, S154]: visualRange 75, cohesion 0.005, separation 20 / 0.05, alignment 0.05, speedLimit 15.
- **Wrap box**: *Batman Returns*' bats reappear on the far side, "bat teleportation" [V, S95].
- **Flaps** [V, S223; I]: real wingbeats are 14–27 Hz, too fast to show. Use 2–4 frames at 8–15 fps, with bound or glide gaps.
- **Shadow** [I]: the bird at `(x, y − h)`, the shadow at `(x, y)`.
- **Sandbox** [I]:
  - Separation 8 px, alignment and cohesion 40 px, plus a goal orbiting the player.
  - Speed 30–52 px/s; wrap at 380 px.

```
acc = 0
acc = add_capped(acc, flee(player)*3)            // priority order (Reynolds)
acc = add_capped(acc, separation(k=7)*1.6)
acc = add_capped(acc, alignment*0.5); acc = add_capped(acc, cohesion*0.35)
acc = add_capped(acc, (home - pos)*0.12)
if outside(view.grow(64)): pos = wrap(pos)       // bat teleport
```

*Cost / performance.* 40 birds ≈ 16k ops per frame [I]. `godot_boids` reports ~2,000 at 11 ms [V, S155].

*Games that used it.*
- Half-Life's Xen flyers: https://www.wikiwand.com/en/articles/Boids
- Ben Eater demo: https://eater.net/boids

*How it feels.* Birds lifting off and wheeling over the canopy: the most alive moment in a forest [I].

*Risks.*
- Real distances are too sparse on screen; compress them 3–5× [I].
- The Sandbox uses a metric radius and an extra goal rule [I].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 4 · Aliveness 5 · Variety 3

---

### Family G: Performance

### G1. One atlas and one material for batching

*In plain words.* Put every tree part in one image and give them all one shader. The GPU draws the forest in a handful of calls.

*How it works (technical).*
- **Batching**: Compatibility has batched 2D since 4.0; 4.4 extended it to Forward+ and Mobile [V, S111, S112].
- **What splits a batch** (GLES3 source) [V, S100]:
  - a different clip owner, material, filter, repeat, blend mode or texture;
  - a change of command type;
  - **lit vs unlit** state;
  - meshes and MultiMeshes, which "always create a new batch."
- **Buffer**: **16,384 items × 128 B** (2 MB), triple-buffered, uploaded with `glBufferSubData` on web [V, S100, S102].
- **Docs**: "use atlases to decrease the amount of texture changes" [V, S99].
- **Case study** (self-reported, mobile web) [V, S127]:
  - 250–260 sprites packed into 4 atlases.
  - Draw calls **240 → 38**, fps **31 → 60**, memory **612 → 152 MB**.
- **Godot 4.6** reworked batching GPU cost, reported "1.1x to 7x" faster; the scope is unconfirmed [V-secondary, S116, S117].
- **Lights** [V, S102, S110]: lower `max_renderable_lights` (default 32) on web. Prefer palette day-night, since PointLight2D splits batches [I].

*Cost / performance.* About one batch per layer [I].

*Games that used it.*
- Factorio (colour variants, not new graphics): https://direct.factorio.com/blog/post/fff-86

*How it feels.* Invisible, and it pays for everything else [I].

*Risks.*
- A duplicated material per tree silently breaks batching [V, S136].
- Lossless atlases are big: 2048² RGBA is 16 MB [I].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 5 · Aliveness 1 · Variety 3

### G2. Per-instance uniforms (Godot 4.4+)

*In plain words.* Every tree gets its own wind phase, season delay, tint and fade without its own material, so the batch survives.

*How it works (technical).*
- **4.4** adds 2D instance uniforms, which do "not break batching" (PR #99230) [V, S112].
- **The docs' own example** is "a forest full of trees"; the "practical maximum" is 16 per shader, with no textures [V, S107].
- **Before 4.4** you had to pack data into COLOR or UV at 8 bits [V, S124].
- **GLES3** instance data carries `instance_uniforms_ofs` [V, S100]; Compatibility support still needs a runtime test (§12).
- **Free variation** [I]: phase from `MODEL_MATRIX` position.

```glsl
instance uniform float sway_phase; instance uniform float season_t;
instance uniform float pal_row;    instance uniform float fade = 1.0;
```

*Cost / performance.* It rides in the 128 B record, at zero extra draw calls [V, S100, S112].

*Games that used it.*
- Godot docs example: https://raw.githubusercontent.com/godotengine/godot-docs/master/tutorials/shaders/shader_reference/shading_language.rst

*How it feels.* Every tree becomes an individual: the precondition for C3, D2 and E1 at scale [I].

*Risks.*
- Untested on web.
- The 16-uniform cap [I].

*Ratings 1–5 (author judgement):* Simplicity 5 · Speed 5 · Pixel taste 4 · Aliveness 3 · Variety 5

### G3. MultiMesh: great for flat layers, wrong for y-sorted trunks

*In plain words.* A MultiMesh draws thousands of copies at once, but as one flat object. Use it for ground cover or a canopy layer that is always above, never for trunks the player walks between.

*How it works (technical).*
- **Docs** [V, S106]: "up to millions of objects", but "no screen or frustum culling", so visibility is all-or-none. Split it by area.
- **GLES3**: a MultiMesh always starts a new batch [V, S100].
- **Order**: instances draw in buffer order, which caused 2D z-order problems [V, S125].
- **Cornucopia** merged plants per cell: **2,583 draw calls → 3** [V, S48].

*Cost / performance.* One draw per chunk. Sort each chunk's buffer by Y once [I].

*Games that used it.*
- Cornucopia: https://gamedev.net/blogs/entry/2297829-cornucopia-raw-dev-log-1-gpu-instancing-or-how-2583-plants-became-3-draw-calls

*How it feels.* Invisible on the right layer [I].

*Risks.*
- No WebGL 2 MultiMesh2D benchmark exists [U].
- Trunks in a MultiMesh can't interleave with characters [I].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 4 · Aliveness 1 · Variety 2

### G4. Chunked y-sort and spatial-grid culling

*In plain words.* Sorting by height on screen lets you walk in front of and behind trees. But Godot sorts every visible child of a y-sorted node every frame. So chunk the forest, hide far chunks, and find nearby trees with a grid.

*How it works (technical).*
- **Source** [V, S101]: `_collect_ysort_children` gathers every visible descendant, sorts, then culls. Only `visible = false` children are skipped.
- **Units**: a non-y-sorted child renders its children "together on the same Y position", so trunk + canopy + shadow sort as one [V, S103].
- **TileMapLayer**: quadrants (16) don't apply when y-sorted. Runtime tile updates are "computationally expensive" [V, S105].
- **Plan** [I, note 02]:
  - 16×16-tile chunks, visible only within camera ± 1 (~9 chunks).
  - Trunks in a TileMapLayer, plus pooled Sprite2Ds for the trees you touch.
- **Sandbox** [I]: a 64 px grid with crown margins. **245–786** items drawn per frame [I, Sandbox run].

*Cost / performance.* Sort cost scales with nearby trees, not world size. No ms figure was found [U].

*Games that used it.*
- Stardew (depth ≈ bottomY/10000): https://raw.githubusercontent.com/veywrn/StardewValley/master/StardewValley/TerrainFeatures/Tree.cs

*How it feels.* Invisible, until the world grows and the frame time stays flat [I].

*Risks.*
- Script-moved transforms cost CPU.
- Tall crowns cross chunk borders; keep a margin [I].

*Ratings 1–5 (author judgement):* Simplicity 4 · Speed 5 · Pixel taste 5 · Aliveness 1 · Variety 1

### G5. Baked static chunks, merged shadows and data textures

*In plain words.* Draw far or untouched parts of the forest once into a picture. Draw shadows into one layer so overlaps don't go black. Keep shade, trampling and litter in tiny textures.

*How it works (technical).*
- **Baked chunks** [I, note 02]: 256² × 4 B = 256 KB per chunk, in exchange for less draw and sort cost.
- **Weber & Penn** drop detail by skipping "masses": a tree at 2 km becomes "about 30 lines and 1000 points" [V, S207]. In pixels [I]: skip highlight layers on weak devices.
- **Factorio** split baked shadows out and **merged them before drawing**, so overlaps stop stacking into black [V, S42].
- **Avoid per-tree LightOccluder2D**. Filter "None" is the fastest [V, S110].
- **DrawableTexture2D (4.7)** [V, S115; I]: shade, trample and snow-on-canopy maps at 1 texel per tile, with no SubViewport.
- **Sandbox** [I]: the 1280×960 ground (≈ 4.9 MB) re-bakes per season in ~165 ms of Node.js.

*Cost / performance.* One-off bakes plus small textures [I].

*Games that used it.*
- Factorio FFF-227: https://cf-www.factorio.com/blog/post/fff-227

*How it feels.* Shadows pool naturally under groves [I].

*Risks.*
- DrawableTexture2D is new; test it on web.
- Chopping must re-bake its chunk [I].

*Ratings 1–5 (author judgement):* Simplicity 3 · Speed 5 · Pixel taste 4 · Aliveness 2 · Variety 2

### G6. Variety multipliers and procedural sprites at load

*In plain words.* Draw a few trees, then multiply them: mirror, recolour, scale by age, swap season palettes. Or let a small program draw variants at load and pack them into the atlas.

*How it works (technical).*
- **Multipliers**:
  - Stardew flips half its trees [V, S23].
  - Factorio uses 8 families × 10 variations plus colouring [V, S41].
  - RimWorld makes 1–25 jittered, flipped copies per cell [V, S39].
- **Budget** [I, note 01]: 3 species × 2 flips × 4 tints × 5 stages × 4 seasons = **480 variants from 15 drawings**. Deussen's 7 size classes per species [V, S208].
- **Generators**:
  - 4b3c: line width from descendant count; leaves only at the tips [V, S161].
  - Gentree for Aseprite, with a Forest Mode [V, S160].
  - Desarrh's MIT Godot `@tool` [V, S159].
  - Kowalski's graftals: stamp tufts where a "desire image" is darkest; bake them, because runtime placement pops [V, S209].
  - Palubicki's λ is one conifer↔broadleaf slider [V, S213].
- **Blob recipe** [I, note 08]: 5–9 discs at golden-angle offsets, squashed ×0.7. Shade each by "same disc, offset toward the light, shrunk".
- **Sandbox** [I, Sandbox run]: 12 species × 6 variants × 4 seasons = **288 sprites**, **209,932 px** (≈ 0.84 MB RGBA), in ~240 ms.

*Cost / performance.* Zero at runtime; ~1–5 ms per tree at load [I].

*Games that used it.*
- RimWorld: https://rimworldwiki.com/wiki/Modding_Tutorials/Plant_Rendering
- Forest Sandbox atlas panel: `vfx-forest-sandbox.html`

*How it feels.* Endless variety in one style [I].

*Risks.*
- Keep an artist in the loop: 2–3 hero sprites per species, with generated variants approved by hand [I].

*Ratings 1–5 (author judgement):* Simplicity 3 · Speed 5 · Pixel taste 4 · Aliveness 2 · Variety 5

---

## 5. Comparison scorecard

All ratings are author judgement for top-down pixel art on web Godot. "Sum" is a crude total, not a recommendation: a low-sum technique such as G4 can still be mandatory.

| # | Technique | Simpl. | Speed | Pixel taste | Alive | Variety | Sum |
|---|---|---|---|---|---|---|---|
| A1 | Two-layer metatiles / priority bit | 5 | 5 | 5 | 1 | 2 | 18 |
| A2 | Canopy/fog overlay (ALttP) | 5 | 4 | 4 | 3 | 1 | 17 |
| A3 | Tibia up-left offsets, diagonal order | 5 | 5 | 5 | 1 | 3 | 19 |
| A4 | Clusters, ramps, light, outlines | 3 | 5 | 5 | 2 | 4 | 19 |
| B1 | Climate → biome table | 5 | 5 | 3 | 2 | 5 | 20 |
| B2 | Species weights + cluster noise | 4 | 5 | 4 | 3 | 5 | 21 |
| B3 | Poisson / jitter / local-max / halftone | 4 | 5 | 4 | 2 | 4 | 19 |
| B4 | Density, clearings, paths, undergrowth | 4 | 5 | 4 | 3 | 5 | 21 |
| B5 | Size, age, stages, deadwood | 4 | 5 | 4 | 4 | 5 | 22 |
| C1 | Palette/LUT season swap | 4 | 5 | 5 | 3 | 5 | 22 |
| C2 | Biome colormap tint | 5 | 5 | 3 | 2 | 4 | 19 |
| C3 | Per-tree phenology + dither turn | 4 | 5 | 5 | 5 | 5 | 24 |
| C4 | Bare branches + conifer snow | 4 | 5 | 4 | 3 | 4 | 20 |
| C5 | Pollution / disease / burn stages | 4 | 5 | 4 | 4 | 3 | 20 |
| D1 | Integer row/band sway | 5 | 5 | 5 | 4 | 2 | 21 |
| D2 | Travelling gusts + stiffness | 4 | 5 | 4 | 5 | 3 | 21 |
| D3 | Ferrari edge-band cycling | 3 | 5 | 5 | 4 | 2 | 19 |
| D4 | Falling leaves, petals, litter | 5 | 4 | 4 | 4 | 2 | 19 |
| E1 | Canopy fade (alpha / dither) | 5 | 5 | 4 | 2 | 1 | 17 |
| E2 | Cutaway circle | 4 | 5 | 3 | 1 | 1 | 14 |
| E3 | X-ray silhouette | 3 | 3 | 4 | 1 | 1 | 12 |
| E4 | Trunk collision, soft undergrowth | 5 | 5 | 4 | 4 | 2 | 20 |
| E5 | Shade ellipse + sunflecks | 5 | 5 | 4 | 4 | 2 | 20 |
| E6 | Shake, chop, fell, regrow | 4 | 5 | 4 | 5 | 3 | 21 |
| F1 | Perched critters + flee distance | 5 | 5 | 4 | 5 | 4 | 23 |
| F2 | Boids, wrap box, shadows, flaps | 4 | 5 | 4 | 5 | 3 | 21 |
| G1 | One atlas + one material | 4 | 5 | 5 | 1 | 3 | 18 |
| G2 | Instance uniforms (4.4+) | 5 | 5 | 4 | 3 | 5 | 22 |
| G3 | MultiMesh for flat layers | 4 | 5 | 4 | 1 | 2 | 16 |
| G4 | Chunked y-sort + grid culling | 4 | 5 | 5 | 1 | 1 | 16 |
| G5 | Baked chunks, merged shadows, maps | 3 | 5 | 4 | 2 | 2 | 16 |
| G6 | Variety multipliers, load-time gen | 3 | 5 | 4 | 2 | 5 | 19 |

**Reading the table.** C3 (24) and F1 (23) score highest: both make a forest feel alive one individual at a time. The occlusion trio and the G family score low on life, but you need one of the first and all of the second.

---

## 6. Deep dives

### 6a. Forest types catalogue

The first seven rows use the Sandbox's `BIOMES` table: species weights, density (dens) and undergrowth share [I, Sandbox]. "Trees/screen" is trees per biome area, scaled to one 320×180 view [I, Sandbox run]. Dead/burnt is not in the Sandbox.

| Forest type | Species mix | Density | Undergrowth | Palette | Seasons | Gameplay feel |
|---|---|---|---|---|---|---|
| **Boreal / taiga** | Spruce 6, pine 3, birch 1, snag 0.3 | 0.60; ~264/screen | Shrubs 0.22; moss, lichen [I] | Blue-green needles, reddish pine bark | Evergreen; birch gold early, larch gold last [V, S192]; snow caps; less ground snow under canopy | Many narrow stems; real boreal stands are the densest [V, S187] |
| **Mixed** | Pine 3.5, oak 2.5, birch 2, spruce 1, maple 1 | 0.75; ~330/screen | Shrubs 0.30 | Two greens, conifers darker | Half turns, half stays: the best autumn contrast | Conifer patches become landmarks |
| **Birch grove** | Birch 7, pine 1.5, oak 0.5 (73 % birch in practice) | 0.45; ~202/screen | Shrubs 0.25; flowers | White bark, yellow-green | Early golden autumn [V, S190] | Open, bright, clustered |
| **Temperate deciduous** | Oak 3.5, maple 3, cherry 1.2, birch 1 | 0.70; ~308/screen | Shrubs 0.35; ferns, saplings | Rich greens; maple scarlet, oak russet | Staggered autumn, bare winter, cherry blossom | Closed canopy: fades, shade and flecks matter most |
| **Open oak woodland** | Oak 5, maple 0.5, snag 0.4 | 0.20; ~80/screen | Shrubs 0.15 | Warm, dry ground | As deciduous, with more litter visible | Pastoral; good for roads and towns |
| **Tropical rainforest** | Kapok 5, palm 3 | 0.78; ~307/screen | Ferns 6, shrubs 1 at 0.50 | Saturated deep greens | No colour change; parrots, not crows | Three layers, low visibility: occlusion matters most |
| **Savanna** | Acacia 7, snag 1 | 0.09; ~34/screen | Shrubs 0.08 | Olive (wet) → yellow (dry) | Wet/dry, not four seasons | Long sight lines; rainfall caps cover below ~650 mm [V, S188] |
| **Dead / burnt** | Snags ~0.7, charred stumps, seedlings [I] | `dead_chance` → 1 [I, from S53] | Ash, fireweed [I] | Greys, charcoal, one regrowth green | Regrowth (B5 loop) | Eerie and open. Burnt trees: 1 hit, charcoal [V, S34] |

Across these types the Sandbox spans **34–330 trees per screen** and **245–786 drawn items per frame** [I, Sandbox run]. Design to visual canopy cover, not real stem counts: real stands are far too dense to walk through [I, note 03].

### 6b. Species sheet

Sizes are the Sandbox's generated sprites (w × h px over 6 variants; the player is 7×12 px) [I, Sandbox run]. "Flex" is the Sandbox's sway multiplier. Note 03 proposes stiffness as a divisor instead: spruce 1.6, oak 1.2, birch 0.6.

| Species | Leaf | Bark | Size (px) | Autumn | Flex | Notes |
|---|---|---|---|---|---|---|
| **Oak** | Broadleaf bundles | Deep ridges, brown [I] | 21–39 × 22–40 | Russet/brown, **late** [V, S190] | 1.0 | Marcescence [U]. RimWorld: 30 grow days, 46 wood [V, S38] |
| **Maple** | Broadleaf | Grey-brown | 23–33 × 23–36 | Scarlet or yellow/orange, **early** [V, S190] | 1.0 | Stardew syrup every 9 days [V, S26] |
| **Birch** | Small, loose | White, dark dashes | 13–23 × 18–33 | Golden yellow, **early** [V, S190] | 1.3 | Fixed colour in Minecraft [V, S50]; clonal groves [I] |
| **Cherry** | Broadleaf + blossom | Red-brown | 17–27 × 17–30 | Red-orange (Sandbox) | 1.1 | White blossom in spring [I]; Veloren proclivity 12.0 [V, S167] |
| **Pine** | Tiered needles | **Reddish plates** [I] | 15–29 × 27–52 | Evergreen | 0.55 | Stardew pine keeps leaves in winter [V, S23] |
| **Spruce** | Short needles, cone | Dark brown | 11–19 × 28–51 | Evergreen, bluish | 0.45 | Sheds snow [V, S195] |
| **Palm** | 7 fronds | Ringed tan | 36 × 31–52 | — | 1.5 | No seasons in Stardew [V, S23] |
| **Kapok** | Huge broadleaf | Grey, wide | 27–47 × 28–51 | — | 0.8 | Sandbox emergent; uncited [U] |
| **Acacia** | Flat top | Dark, split trunk | 32–51 × 17–29 | Wet olive → dry yellow | 0.7 | Savanna shade spot [I] |
| **Snag** | None | Grey | 17–31 × 22–43 | — | 0.25 | TFC 1 in 75 trees dead [V, S53] |
| **Shrub** | Small ball | — | 13–21 × 10–17 | Oak ramp, +0.05 | 1.4 | Berries in summer/autumn; passable (E4) |
| **Fern** | 7 fronds | — | 13–19 × 8–11 | — | 1.6 | Rainforest floor, no shadow |

Sandbox crowns are lit from the top-left, and the lower-right rim takes the darkest entry. That mirrors Slynyrd's crescent-and-highlight recipe [V, S181; I].

### 6c. Character interaction: behind, beside, beneath, shake

- **Behind.** Three questions decide the method:
  1. Must the player always see their character?
  2. Must the forest look solid?
  3. Can the renderer afford an extra pass?
- **Beside.** Only trunks collide. Make trampling persistent, like Brogue's 1 %-per-turn regrowth, and trails appear [V, S171; I].
- **Beneath.** One palette step of shade, plus drifting flecks. Shade can carry gameplay: Don't Starve Together's canopy cools you and cuts rain wetness 35 % [V, S36]. That ties into study #3's wetness.
- **Shake.** A small rotation, a rustle, leaves, maybe a reward, and the birds leave (E6, F1).

| Game type | Recommended | Why | Avoid |
|---|---|---|---|
| Classic tile RPG | **A1 layer split** with colour-0 leaf holes | Zero cost, authentic | Whole-layer modulate [V, S129] |
| Tibia-like MMO (Asterion) | **A3 order + E1 dither fade within 2–3 tiles of *your* character**; E3 outline for party members | Board stays readable; on-palette | Full-screen silhouette on web [V, S62] |
| Cozy sim | **E1 Stardew fade** (0.4 floor, ~15/12 ticks) | Players expect it [V, S23, S28] | Non-fading map trees [V, S29] |
| Action / arena | **E2 cutaway**, dithered rim | Feet and threats always visible | Slow fades that hide enemies |
| Stealth / tactics | **A1/A3 + E3 silhouette for the player only** | Hiding stays real for enemies | Fades that reveal hidden enemies |
| Story set-piece | **A2 overlay**, lifted by story | Mood over clarity [V, S11] | Using it as general occlusion |

In an MMO, occlusion is client-side and per viewer. Other players under a canopy show as a name tag or outline, the usual Tibia fallback [I].

### 6d. Birds deep dive

**Behaviour stack, cheapest first:**
1. **Perch.** Check distance every 200 ms [V, S25].
2. **Take off.** Fly away from the threat after a 50–250 ms random delay, so neighbours follow in a ripple [I].
3. **Flock.** Boids with ~7 neighbours, separation first [V, S220, S222].
4. **Land.** On a tree 70–180 px away, as in the Sandbox [I].
5. **Leave.** Despawn off-screen (Don't Starve) or wrap (*Batman Returns*) [V, S35, S95].

| Parameter | Source value | Pixel game value |
|---|---|---|
| Flee radius | Stardew 4 / 6 tiles [V, S25] | 3–8 tiles by species [I] |
| Neighbours | 6–7 topological [V, S222] | k = 7, or a radius for ≤ 40 birds |
| Separation : perception | Ben Eater 20 : 75 [V, S154] | Sandbox 8 : 40 px [I] |
| Wingbeat | 14–27 Hz [V, S223] | 2–4 frames at 8–15 fps [I] |
| Banking | Roll-in 10 : roll-out 1 [V, S222] | Tilted frame or squash [I] |

Species are one behaviour with palette-swapped sprites: crows in winter, parrots in rainforest, gulls on coasts, woodpeckers on snags [I, from S35, S25]. The shadow is 1 colour, 2–4 px, and fades with height [I]. Budget: 10–60 birds per screen in one batch [I].

### 6e. Performance budget: a worked example for web/mobile Godot

**Assumption** [I, note 02]: 480×270 internal resolution with 16 px tiles, ≈ 510 tiles on screen. Asterion's 32 px tiles show fewer, larger trees, so treat this as an upper bound.

| Step | Numbers | Source |
|---|---|---|
| Items on screen | Sandbox 245–786 at 320×180, so ≈ 550–1,770 at 480×270 | [I, Sandbox run] |
| Target | < 1,500 tree sprites and < 50 draw calls; dense rainforest exceeds it, so bake undergrowth (G5) or MultiMesh it (G3) | [I, note 02] |
| Draw calls | Trunks 1 + canopy 1 + shadows 1 + undergrowth ~9 chunks + particles 1 + birds 1 ≈ **15–30** with characters and UI | [I]; case study 240 → 38 [V, S127] |
| Unbatched baseline | Canvas Sandbox: 1,149–3,382 `drawImage` + 379–1,311 `fillRect` per frame | [I, Sandbox run] |
| Sprite memory | Sandbox 288 sprites = 209,932 px ≈ **0.84 MB**, so a 1024×512 atlas (2 MB) | [I, Sandbox run] |
| Seasons | LUT: one season's ≈ 52k px + a 48 × 16 palette (≈ 3 KB). Sheets: ×4 canopy VRAM | [I, note 08] |
| Atlas sizes | 1024² = 4 MB; 2048² = 16 MB (2,048 cells of 32×64) | [I, note 02] |
| Baked chunks | 256 KB each; 9 around the camera ≈ 2.3 MB | [I] |
| Y-sort | 9 chunks × 256 tiles × 0.3 trees ≈ **690** items sorted per frame | [V, S101; I] |
| Instance upload | 1,500 × 128 B ≈ 192 KB per frame; buffer 16,384 items | [V, S100; I] |
| CPU ceiling | ~5k script-moved sprites on a laptop, 2k on an old phone; Compatibility drops at 5.5k on a Ryzen 5 3500U | [V, community, S126] |
| Fragment cost | LUT (2 fetches) + band sway (~6 ALU) + dither on ~100k canopy fragments: trivial on WebGL 2 | [I] |

The Canvas 2D Sandbox rendered frames in **~2–13 ms** in headless Chromium on our machine [I, illustrative]. A batched Godot build should be well below that. This has not been measured yet (§13, step 1).

---

## 7. Combinations: a layered architecture for Asterion Online (Godot 4, web)

**Principle.**
- The forest is *data*, not *nodes*.
- Everything derivable from the world seed is derived on the client when a chunk loads. Only player changes travel over the network.
- Rendering is one atlas, one shader, a few layers, and a short y-sorted list near the camera [I].

| # | Layer | Godot node | Content | Update |
|---|---|---|---|---|
| 1 | Ground | TileMapLayer + ground shader | Terrain, path, baked litter/flowers/snow | Per season or chunk |
| 2 | Ground data | `DrawableTexture2D` [V, S115] | Shade map (1 texel/tile), trample, litter stamps | On load, on events |
| 3 | Undergrowth | MultiMeshInstance2D per chunk [V, S106] | Ferns, tufts, flat bushes | On load |
| 4 | Shadows | Atlas sprites, one merged layer [V, S42] | Ellipses | Static |
| 5 | Y-sorted world | Chunk Node2Ds under one y-sort root [V, S101] | Trunks, bushes, characters, perched birds | Chunks at camera ± 1 |
| 6 | Canopy | Sprites sharing ForestShader | Palette, sway, phenology, occlusion | Instance uniforms |
| 7 | Air | Pooled sprites | Flying birds, leaves, petals | Per frame, client only |
| 8 | Overlay | CanvasLayer (optional) | Lost-woods fog (A2) | Story triggers |

**ForestShader** [I]:
- Uniforms: `palette`, `season_t`, `wind_strength`, `wind_dir`, `player_px`.
- Instance uniforms (≤ 16 [V, S107]): `pal_base`, `pheno_offset`, `sway_phase`, `stiffness`, `fade`, `base_y`.

**World generation** [I]:
- Seeded per chunk with `hash(chunkX, chunkY, seed)`.
- Steps: biome (B1) → jittered candidates with density and cluster noise (B3, B4) → species (B2) → size and age (B5) → variant and flip (G6) → phenology offset (C3).
- Each tree packs into about 6–8 bytes.

**Network** [I]:
- The server never sends a forest.
- It sends a per-chunk **delta list**: `{treeIndex, state, changedAt}`. Regrowth is computed from `changedAt` and the stage timers.
- Shake rewards are validated on the server, with per-tree, per-day caps (Terraria-style) [V, S46].
- Birds, leaves, sway, fade and flecks are client-only.
- `season_t` comes from the server clock.
- Brogue CE's AGPL "also covers network play": don't reuse its code server-side [V, S171 via note 07].

**Placement (stateless jittered grid)** [I]:
```gdscript
for gy in range(0, CHUNK, CELL): for gx in range(0, CHUNK, CELL):
    var h := hash3(cx*CHUNK+gx, cy*CHUNK+gy, SEED)
    var p := Vector2(gx, gy) + CELL * Vector2(0.25+0.5*frac01(h), 0.25+0.5*frac01(h>>8))
    var b := biome_of(temp(p), moist(p))
    if frac01(h>>16) > BIOME[b].dens * (0.55 + 0.9*noise(p/4.0)): continue
    if path_distance(p) < 1.5: continue
    trees.append(pack(p, pick_species(b, p, h), variant_of(h)))
```

**Biome pick** [I, Sandbox thresholds]:
```gdscript
func biome_of(t, m):
    if t < 0.30: return BOREAL
    if t < 0.48: return MIXED if m > 0.50 else BIRCH
    if t < 0.70: return DECIDUOUS if m > 0.42 else OPEN_OAK
    return RAINFOREST if m > 0.50 else SAVANNA
```

**Sway bands** [I, D1 + D2]:
```glsl
// vertex: gust from a travelling triangle wave at the tree base (world tiles)
float s = dot(base_tiles, normalize(wind_dir));
float tri = abs(fract(s/24.0 - TIME*3.0/24.0 + 0.5)*2.0 - 1.0);
gust = wind_strength * (0.3*sin(TIME*1.7 + sway_phase) + tri*tri) / stiffness;
// fragment: three bands, whole pixels, trunk fixed
float band = floor(clamp(1.0 - UV.y/CROWN_UV, 0., 1.) * 3.0);
float off  = UV.y > CROWN_UV ? 0.0 : round(gust * (band >= 2. ? 2.2 : band >= 1. ? 1.4 : 0.7));
uv.x -= off * TEXTURE_PIXEL_SIZE.x;
```

**Occlusion** [I, E1]:
```gdscript
for t in grid.query(player.pos, 48):          # every 100 ms, local player only
    var front := t.base_y > player.pos.y and t.crown_rect().intersects(player.rect())
    t.fade = max(0.4, t.fade - 0.04) if front else min(1.0, t.fade + 0.05)
    set_instance_shader_parameter(t.rid, "fade", t.fade)
# shader: COLOR.a *= step(bayer4(FRAGCOORD.xy), fade)
```

**Phenology** [I, C3]:
```gdscript
var phase := season_t - SPECIES[t.sp].offset - t.elev*K_ELEV + hash01(t.id)*0.03 - 0.015
pal_row = SPECIES[t.sp].row0 + SPECIES[t.sp].lut_stage(fposmod(phase, 1.0))  # hourly
```

**Boids** [I, F2]: priority-capped `flee → separation → alignment → cohesion → home` over k = 7 neighbours; wrap outside `view.grow(64)`.

**Shade** [I, E5]:
```gdscript
for t in grid.query(p, 32):
    if t.leafy and (((p - t.shadow_c) / Vector2(t.rx, t.ry)).length_squared() < 1.0): return true
# or read one texel of the DrawableTexture2D shade map
```

---

## 8. Reference implementation: the Forest Sandbox

`vfx-forest-sandbox.html` [S5] is one page of plain JavaScript using Canvas 2D (no WebGL). It shows a **320×180** view of a **1280×960 px** world. Its design choices are ours [I]. This section comes from reading its script and replaying its generation headless in Node.js.

**Controls.**
- Move with WASD, arrows or tap; tap the minimap to jump; **E** shakes a tree.
- Season buttons and Auto year; a wind slider.
- Occlusion: dither, cutaway, silhouette or none.
- Layers: shadows, sunflecks, birds, culling grid.
- Forest-type jump buttons and a live atlas panel.

**Generation constants.**
- **Seeds:** xorshift seed `20261109`; per-sprite seeds `1000 + species·97 + variant·13`.
- **Climate:**
  - `T = y/960·1.05 − 0.04 + (noise/260 − 0.5)·0.32`, so it is colder in the north.
  - `M = noise/300·1.1 − 0.05 + (x/1280 − 0.5)·0.35`.
  - Both are sampled on an 8 px grid. Biome thresholds as in §7.
- **BIOMES:** see §6a for the density, undergrowth and species weights of each type.
- **Placement:**
  - Bridson, r = 9 px, **k = 24**. Candidates sit at r·(1 + rand), uniform in radius rather than area.
  - Keep a tree if it is ≥ 14 px from the path and `rand < dens·(0.55 + 0.9·noise(x/60, y/60))`.
  - Species weight × `(0.3 + 1.4·noise(x/90…))`.
  - The 1.35× variant is demoted 60 % of the time.
  - Undergrowth pass: r = 7, k = 12.
- **Sprites:**
  - 12 species × 6 sizes (0.75–1.35) × 4 seasons = **288**, each with a 50 % checkerboard twin.
  - Broadleaf crowns: 5 + R/3 discs, lit by `−(dx·0.6 + dy·0.8)`, with ramp entry 4 on the lower-right rim.
  - Conifers: `4 + H/12` tiers. Bare crowns: recursion of depth 4 (3 for snags), 2–3 children.
- **Ground:**
  - Re-baked per season, darkened by a 16 px canopy-density grid.
  - Flowers in spring and summer, litter in autumn.
  - Snow where T < 0.62, scaled by `1 − density·0.65`.

**Runtime constants.**
- **Culling:** a 64 px grid; margins ±40 px in x, −8/+80 px in y; then a per-sprite rect test.
- **Y-sort:** visible trees plus the player, each frame.
- **Sway:**
  - `wind·flex·(0.5·sin(1.7t + phase) + 1.2·(noise((x + 0.35y)/80 − t·wind·1.3) − 0.35)) + shake·sin(30t)·2.6`.
  - 3 crown bands × 2.2 / 1.4 / 0.7; the trunk is unshifted.
- **Season per tree:** `floor(season − offset ± 0.15 + 0.5) mod 4` (offset is a delay, so maples, with a negative offset, turn first). Auto year moves 0.025 seasons/s.
- **Occlusion:** a crown is "in front" when its base y > player y and its crown rect overlaps the player's 7×11 box. Then: the dither twin, a 13 px clip circle, or a 75 % `#f4f0c0` silhouette.
- **Collision:** trunk ellipse with y ×1.7, radius r + 2, where r = 3 / 4 / 2. Bushes: 0.7× of 42 px/s.
- **Shade:**
  - Ellipse rx = 0.95 × half-width, ry = 0.45·rx, shifted +0.35·rx.
  - Alpha 0.30 (leafy), 0.22 (undergrowth), 0.10 (bare).
  - The player's RGB is scaled ×(0.58, 0.64, 0.74) inside; 3 flecks per tree.
- **Particles:** autumn leaves at `dt·0.18`, petals at `dt·0.35`, litter capped at 500, 90 snowflakes.
- **Birds:**
  - 28 birds; flee at 30 px or on a shake > 0.3.
  - Separation 8 px, alignment and cohesion 40 px, plus a goal orbiting the player.
  - Speed 30–52 px/s; land after 6–16 s; wrap at 380 px.

**Run figures** [I, Sandbox run]:

| Measure | Value |
|---|---|
| Trees / undergrowth / total | **4,478 / 3,542 / 8,020** |
| Poisson candidates kept | 9,301 → 4,478 (48 %); 14,709 → 3,542 (24 %) |
| Biome area | Boreal 32.3 %, open oak 17.2 %, rainforest 13.3 %, savanna 12.9 %, birch 10.5 %, mixed 9.0 %, deciduous 4.9 % |
| Trees per screen | 34 (savanna) – 330 (mixed) |
| Items drawn per frame | 245 – 786 |
| Canvas calls per frame | 1,149 – 3,382 `drawImage`; 379 – 1,311 `fillRect` |
| Sprite area | 209,932 px (≈ 0.84 MB; 1.68 MB with twins) |
| Generation (Node, stubbed canvas) | ~240 ms; Poisson ~70 + ~48 ms; ground bake ~165 ms per season |
| Render (headless Chromium, our machine) | ~2–13 ms per frame by biome density (illustrative) |

**Honest simplifications.**
- There is no real atlas: 576 separate canvases.
- Each crown costs 4 draw calls (3 bands + trunk), plus its shadow and flecks.
- Seasons flip per tree in one frame, with no dither transition.
- There is no dead/burnt biome and no elevation (so no Hopkins altitude term).
- Birds are not y-sorted, and their colours come from the player's biome at spawn.
- Occlusion is on/off, not a ramp.
- There is no chopping, growth or network.

**Caption-vs-code review (resolved).** Writing this study turned up seven places where the Sandbox's explanation cards didn't match its code. All seven cards were rewritten before publication to describe what the code really does [I]:
- **Drawing cost:** about 4–5 `drawImage` calls per drawn item (three sway bands, trunk, shadow).
- **Atlas:** the panel is for display only. In Godot, pack the sprites into one real atlas texture.
- **Birds:** perched birds ride on their tree, and flying birds are drawn above everything. They are not y-sorted.
- **Snow:** reduced under dense canopy of any tree, and only in the colder half of the map.
- **Flowers:** they appear in spring and summer.
- **Boids:** separation, alignment and cohesion, plus a goal pull and a speed clamp.
- **Shade:** darkening only happens while the Shadows layer is on.

---

## 9. Gem findings

**How these were checked** [V, note 07]: licences were read from LICENSE files or licence lines on 2026-11-09. The GitHub REST API was blocked, so maturity uses npm downloads, last-commit dates and Asset Library versions.

**Flags:** **Low** = permissive; **Attrib.** = credit required; **SA** = share-alike; **Copyleft** = GPL family; **?** = licence not stated.

| Name | URL | Licence | Maturity | Good for | Flag |
|---|---|---|---|---|---|
| poisson-disk-sampling | https://github.com/kchapelier/poisson-disk-sampling | MIT | npm since 2015; v2.3.1; ~14k dl/wk | Density-varying scatter via `distanceFunction` | Low |
| fast-2d-poisson-disk-sampling | https://github.com/kchapelier/fast-2d-poisson-disk-sampling | MIT | v1.0.3; benchmark file | Fastest uniform 2D scatter (23.7 ms / ~8.4k pts) | Low |
| Poisson Disc Sampling (udit) | https://github.com/udit/poisson-disc-sampling | MIT | Asset Lib v2.1, Godot 4.2 | GDScript points in rect/polygon/circle | Low |
| Godot-Poisson-Disk-Sampler | https://github.com/Decapitated/Godot-Poisson-Disk-Sampler | MIT | Asset Lib, Godot 4.2 | Bake scatter in the editor | Low |
| Ben Eater boids | https://github.com/beneater/boids | MIT (README only, no LICENSE file) | 2020 | Tuned reference constants | Low (keep README notice) |
| godot_boids | https://github.com/90-008/godot_boids | MIT | v0.1.2, Godot 4.3, wasm | ~2,000 boids at 11 ms | Low |
| lindenmayer | https://github.com/nylki/lindenmayer | MIT | v1.5.4 | Offline L-system skeletons | Low |
| proctree.js | https://github.com/supereggbert/proctree.js | **BSD-3** (not MIT) | 2017 | Pre-rendering 3D trees only | Attrib. |
| Procedural Pixel Art Tree (Desarrh) | https://github.com/Desarrh/Procedural-Tree-Godot | MIT | v1.0.0, Apr 2026 | `@tool` pixel tree/bush generator | Low |
| Gentree (Aseprite) | https://devkidd.itch.io/gentree | Not stated on devlog | v1.3.0, Mar 2026 | Recursive trees, Forest Mode | ? |
| Pixel perfect wind & sway (kaeylos) | https://godotshaders.com/shader/2d-pixel-perfect-wind-sway-effect/ | CC0 | 2025 or 2026 (see §12) | Texel-snapped sway, atlas-safe | Low |
| 2D Foliage Wind (jess-codes) | https://godotshaders.com/shader/2d-foliage-wind-effect/ | CC0 | 2025-06-10 | World-noise travelling gusts | Low |
| 2D wind sway (Maujoe-derived) | https://godotshaders.com/shader/2d-wind-sway/ | Page CC0, but derived from MIT | 2021 | Historical reference | Attrib. (keep MIT) |
| Screen-door dither | https://godotshaders.com/?p=7263 | CC0 | 2024 | Bayer 4×4 fade + player circle | Low |
| 3-line palette shader | https://godotshaders.com/shader/efficient-3-line-palette-shader-full-alpha-support/ | CC0 | 2024 | Indexed sprite → palette row | Low |
| Godot demo projects | https://github.com/godotengine/godot-demo-projects | MIT-style | Official | Y-sort / TileMap baselines | Low |
| Luanti / Minetest Game | https://github.com/luanti-org/minetest_game | Code LGPL-2.1; media CC BY-SA 3.0 | 15+ years | Biome points, decoration noise, leaf decay | Copyleft (weak) / SA |
| Veloren | https://gitlab.com/veloren/veloren | GPL-3.0 | Active | Proclivity species model, leaf colour lerp | Copyleft |
| Cataclysm: DDA | https://github.com/CleverRaven/Cataclysm-DDA | CC BY-SA 3.0 (code and data) | Very active | `harvest_by_season`, regrowing trees | SA |
| OpenTTD | https://github.com/OpenTTD/OpenTTD | GPL-2.0 | 20+ years | 7 stages, tile-loop hash, snowline | Copyleft |
| Shattered Pixel Dungeon | https://github.com/00-Evan/shattered-pixel-dungeon | GPL-3.0 | Active | Trample + 4 leaves | Copyleft |
| Brogue CE | https://github.com/tmewett/BrogueCE | **AGPL-3.0** | Active | Foliage, 1 %/turn regrowth | Copyleft (network!) |
| Kenney Tiny Town / Roguelike RPG | https://kenney.nl/assets/tiny-town ; https://kenney.nl/assets/roguelike-rpg-pack | CC0 | 2023 / 2015 | Prototype 16×16 trees | Low |
| [LPC] Trees / Seasoned / Recolors | https://opengameart.org/content/lpc-trees | CC BY-SA 3.0 (+ GPL options) | 2013–2017 | Palette-season reference at 32 px | SA |
| Growable Trees (Seliel) | https://seliel-the-shaper.itch.io/growable-trees | Not stated on page | $7.99 | 4 stages × 6 seasonal states, 80×96 | ? |
| Lospec Endesga 32 | https://lospec.com/palette-list/endesga-32 | No licence on page | ~207k downloads | Season palette rows | ? (low risk, I) |

**Licence summary** [I, not legal advice]:
- Re-implementing an *algorithm* after reading GPL code is generally fine; copying code or data is not [I, note 07].
- **Brogue's AGPL** matters most for an MMO server.
- CDDA is share-alike even for code.
- Share-alike art (LPC, Flare, Wesnoth) is reference material only for a proprietary game.
- godotshaders licences are per shader, and page "images and videos" are excluded [V, note 07].

---

## 10. Learnings and anti-patterns

**Learnings.**
1. **Split every tree into trunk, canopy and shadow.** This enables layer occlusion, canopy-only fade, sway with a fixed trunk, leaf loss, leaf-only seasons and merged shadows. Factorio, Stardew and RimWorld all converged on it [V, S41, S23, S39].
2. **Little motion goes a long way.** Ferrari animated only 3.6 % of the pixels in "Deep Forest – Day" [V, S88].
3. **Individual timing beats global effects.** Per-tree phase for sway, season and take-off makes a forest read as a population [I].
4. **Fade fast, return slow, floor at 40 %** (Stardew) [V, S23, S28].
5. **Stateless, seeded generation suits an MMO** [I].
6. **Use one atlas and one material, with per-tree uniforms** (Godot 4.4+) [V, S112].
7. **Saturation is a budget.** Keep trees earthy and save saturation for interactables, as Mina does [V, S68].

**Anti-patterns.**
- Too much cluster variation: "displeasing noise" [V, S182].
- Long or colliding shadows [V, S181, S183], and alpha shadows that stack to black [V, S42].
- Non-fading canopies that hide gameplay [V, S29], or fading a whole tile layer at once [V, S129].
- A material per tree, which silently kills batching [V, S100, S136].
- A LightOccluder2D per tree, or a full-screen silhouette on mobile web [V, S110, S62].
- The whole forest under one y-sort node [V, S101], or trunks in a MultiMesh [V, S106].
- Runtime graftal placement, which pops [V, S209]. Over-iterated L-systems [I].
- Everything swaying in phase, grids of identical trees, birds on fixed loops [I].
- Shipping AI-generated tree pixels [V, S233, S235].

---

## 11. "See it in action" index

| # | Game / production | Year | Look at | Link |
|---|---|---|---|---|
| 1 | Zelda: A Link to the Past | 1991 | Canopy overlay 0x9E, Lost Woods fog | https://git.halext.org/scawful/yaze/src/tag/v0.3.0/docs/F1-overworld-loading.md |
| 2 | Pokémon Emerald / RSE | 2002–04 | Two-layer metatiles, BG priority | https://github.com/pret/pokeemerald/wiki/Triple-layer-metatiles |
| 3 | Pokémon Crystal (hack tutorial) | — | Priority colours, colour-0 see-through | https://github.com/pret/pokecrystal/wiki/Allow-map-tiles-to-appear-above-sprites-(so-NPCs-can-walk-behind-tiles)-with-PRIORITY-colors |
| 4 | Pokémon Gold/Silver/Crystal | Gen II | Headbutt trees, hidden tiers | https://bulbapedia.bulbagarden.net/wiki/Headbutt_tree |
| 5 | Pokémon HGSS | 2009 | Headbutt tree groups | https://ds-pokemon-hacking.github.io/docs/generation-iv/guides/hgss-headbutt_trees |
| 6 | Pokémon Black/White | 2010 | Monthly seasons, winter paths | https://serebii.net/blackwhite/seasons.shtml |
| 7 | Pokémon Red/Blue (Viridian Forest) | 1996 | Forest as a maze of tree tiles | https://Bulbapedia.Bulbagarden.net/wiki/Viridian_Forest |
| 8 | Pokémon GSC (Ilex Forest) | Gen II | Dense tree walls, Cut tree | https://bulbapedia.bulbagarden.net/wiki/Ilex_Forest |
| 9 | Emerald Crest (ROM hack) | — | Palette-swap seasons | https://reddit.fabiomanganiello.com/r/PokemonROMhacks/comments/1fxas5s/adding_seasons_to_my_hack_emerald_crest |
| 10 | Tibia | 1997– | Up-left offsets, diagonal order | https://github.com/edubart/otclient/blob/master/src/client/thingtype.cpp |
| 11 | Stardew Valley | 2016 | Fade to 0.4, seasons, shake, felling | https://stardewvalleywiki.com/Trees |
| 12 | Stardew Valley (critters) | 2016 | Birds flee at 4/6 tiles | https://wiki.biligame.com/stardewvalley/%E7%8E%AF%E5%A2%83%E7%94%9F%E7%89%A9 |
| 13 | Don't Starve | 2013 | Looping growth, burnt trees | https://dontstarve.wiki.gg/wiki/Tree/Evergreen |
| 14 | Don't Starve (birds) | 2013 | Turf species, flee | https://dontstarve.wiki.gg/wiki/Birds |
| 15 | Don't Starve Together | — | Canopy shade cools, keeps dry | https://dontstarve.wiki.gg/wiki/Knobbly_Tree |
| 16 | RimWorld | 2018 | Fall shader, leafless, snow overlay | https://rimworldwiki.com/wiki/Modding_Tutorials/Plant_Rendering |
| 17 | Factorio | 2015–19 | Leaf/trunk split, pollution, sway | https://factorio.com/blog/post/fff-324 |
| 18 | Ultima Online | 1997 | Lumberjacking tiers | https://uoguide.com/Lumberjacking |
| 19 | Old School RuneScape | 2001/2013 | Tree tiers by level | https://oldschool.runescape.wiki/w/Woodcutting_guide_p2p |
| 20 | Terraria | — | Spacing, biome trees, shake cap | https://terraria.wiki.gg/wiki/Trees |
| 21 | Graveyard Keeper | — | Leaf-only wind, 10 shadow sprites, LUTs | https://slava.lazybeargames.com/graveyard-keeper-how-the-graphics-effects-are-made |
| 22 | Cornucopia | — | 2,583 → 3 draw calls | https://gamedev.net/blogs/entry/2297829-cornucopia-raw-dev-log-1-gpu-instancing-or-how-2583-plants-became-3-draw-calls |
| 23 | Eastward | — | Player never unintentionally obscured | https://www.gamedeveloper.com/art/eastward-s-creators-share-insights-on-making-pixel-art-adventures |
| 24 | Minecraft | — | Foliage colormap, biome noise | https://optifine.readthedocs.io/colormaps.html |
| 25 | TerraFirmaCraft (mod) | — | Old growth, dead, fallen-tree rates | https://terrafirmacraft.github.io/Documentation/1.18.x/worldgen/features/trees |
| 26 | Animal Crossing: New Horizons | 2020 | Shake for Bells, furniture, wasps | https://twinfinite.net/guides/animal-crossing-new-horizons-how-to-shake-trees/ |
| 27 | Bombernauts | — | Cutaway circle + outline | https://gamedeveloper.com/programming/the-crop-circle-effect-in-bombernauts |
| 28 | Sea of Stars | — | Dynamic lighting, animated fauna | https://www.megavisions.net/the-art-of-sea-of-stars-a-sea-of-pixels/ |
| 29 | Mina the Hollower | 2026 | 64-colour, earthy backgrounds | https://www.yachtclubgames.com/blog/the-art-of-the-game |
| 30 | Fields of Mistria | 2026 | Village between forest and sea | https://www.thesixthaxis.com/2026/06/06/fields-of-mistria-1-0-launch-is-coming-on-5th-august/ |
| 31 | Mark Ferrari, Canvas Cycle | — | Colour-cycled forests | https://www.effectgames.com/demos/canvascycle/ |
| 32 | Chrono Trigger | 1995 | SNES forest tiles (reference) | https://new.tcrf.net/Chrono_Trigger_(SNES)/Unused_Graphics |
| 33 | Seiken Densetsu 3 | 1995 | SNES layer notes (reference) | https://wiki.superfamicom.org/seiken-densetsu-3 |
| 34 | Haven & Hearth | — | Trees as resources | https://ringofbrodgar.com/wiki/Tree |
| 35 | Dwarf Fortress | — | Trees as resources | https://dwarffortresswiki.org/Tree |
| 36 | Luanti / Minetest Game | — | Biome points, leaf decay | https://github.com/luanti-org/minetest_game |
| 37 | Veloren | — | Species proclivity | https://gitlab.com/veloren/veloren |
| 38 | Cataclysm: DDA | — | Seasonal harvest, regrowth | https://github.com/CleverRaven/Cataclysm-DDA |
| 39 | OpenTTD | — | 7 growth stages, snowline | https://github.com/OpenTTD/OpenTTD |
| 40 | Shattered Pixel Dungeon | — | Trampled grass, 4 leaves | https://github.com/00-Evan/shattered-pixel-dungeon |
| 41 | Brogue CE | — | Foliage, 1 %/turn regrowth | https://github.com/tmewett/BrogueCE |
| 42 | Flare | 2010– | Isometric forest props | https://github.com/flareteam/flare-game |
| 43 | Battle for Wesnoth | — | Forest overlay terrain | https://github.com/wesnoth/wesnoth |
| 44 | Half-Life (Xen flyers) | 1998 | Boids | https://www.wikiwand.com/en/articles/Boids |
| 45 | *Batman Returns* (film) | 1992 | Wrap-box bat swarm | https://beforesandafters.com/2022/04/07/a-history-of-cg-bird-flocking/ |
| 46 | Windy Tree (dweet) | 2024 | 140-char wind-blown tree | https://redlib.ssps.io/r/tinycode/comments/1bwmidr/dweet_of_the_week_windy_tree_by_killedbyapixel |
| 47 | TweeTree (PICO-8, LD46) | — | Growing tree in 279 chars | https://ludum-dare.foon.uk/games/46/196970 |

Not verified this pass (no URLs collected): Link's Awakening, Minish Cap, Secret of Mana, EarthBound, FF6, Harvest Moon, Diablo II, Hyper Light Drifter, Children of Morta, Kingdom, Valheim, RDR2 [U].

---

## 12. What remains unverified (and corrections)

**Corrections between notes.**
1. **Stardew fade timing.** Note 01 says ~7 ticks down; note 06 says ~20 ticks up. From the code (`+0.05`, then `max(0.4, alpha − 0.09)` while triggered), the net fade is −0.04 per tick, so 1.0 → 0.4 takes **15 ticks** on paper, or 14 in simulation, because the first tick's +0.05 is clipped at full opacity. Recovery from 0.4 takes **12 ticks**. "20" is the time from 0 to 1, which can't happen above the 0.4 floor [I, arithmetic].
2. **Pixel-perfect sway shader date.** Note 05 says 25 Jun **2026**; note 07 says 2025-06-25. The page credits Godot 4.5 (Sept 2025) for `REGION_RECT`. Unresolved [U].
3. **Purga shaders.** "v2" is dated Nov 2025, but the unversioned page is dated Feb 2026. The ordering looks odd [U].
4. **Sunfleck ratio.** 1/100 (NSTA) vs 1/108 (Minnaert): both approximate the sun's ~0.5°.
5. **Factorio "5120".** 8 families × 10 variations = 80; the colour maths behind 5,120 is not given [V, S41].
6. **Licences.** proctree.js is **BSD-3**, not MIT [V, S158]. The godotshaders "2D wind sway" page says CC0, but the shader derives from an MIT original [V, S135].
7. **Vendor claim.** Strayspark's "15–20 % fewer draw calls" in 4.6 is vendor-internal. Its claim that 2D GPU particles need Forward+ looks wrong [V, S120; I].

**Still unverified.**
- **Godot internals:**
  - Instance uniforms in Compatibility/WebGL 2: the GLES3 source carries `instance_uniforms_ofs`, but no runtime test was done.
  - The renderer scope of the 4.6 batching rework, and `DrawableTexture2D` stability on web.
  - Godot y-sort ms per N items, and WebGL 2 MultiMesh2D throughput.
- **Classic games:** ALttP overlay blend and parallax; Tibia's "onTop" flag on canopies; how B/W, Harvest Moon and Animal Crossing store seasonal art.
- **Biology:** spring leaf-out order, blossom timing, marcescence; stem densities per hectare; flight initiation distances (papers blocked) [S200]; clumping ecology (no URL).
- **Other games:** Animal Crossing shake limits; which Canvas Cycle V09 pixels are leaves; Terraria, Raft and The Forest bird behaviour.
- **Papers:** Reeves & Blau's formulas (only a paraphrase read); Ballerini's full text; talk contents beyond abstracts; SD-πXL and pixelization papers (titles only) [S217].

---

## 13. Prototype roadmap for Godot (web)

1. **Benchmark the plumbing (1–2 days).**
   - Compatibility web export with 1k / 5k / 10k trees in four setups: one y-sort root, chunked y-sort, y-sorted TileMapLayer, MultiMesh canopy.
   - Measure on a phone browser, and test instance uniforms (G2, §6e).
2. **Atlas + ForestShader (2–3 days).** An indexed atlas, the palette LUT and instance uniforms. Confirm one batch per layer (G1, C1).
3. **Deterministic chunks (3–4 days).** Biome table, jittered grid, cluster noise, sizes and variants (B1–B5, G6). Offline Bridson or halftone for hand-made zones.
4. **Wind and seasons (2–3 days).** Band sway with gusts and stiffness, per-tree phenology with dithered turns, falling leaves, winter branches and snow (D1, D2, C3, D4, C4).
5. **Interaction (2–3 days).**
   - Dither fade near the local player, or a cutaway (E1, E2).
   - Trunk colliders on merged tile physics; bush rustle (E4).
   - A `DrawableTexture2D` shade map (E5).
6. **Birds (1–2 days).** Perched critters with a 200 ms check, then boids for ≤ 40 birds with a wrap box (F1, F2).
7. **MMO state (2–3 days).** Per-chunk delta lists, timestamp regrowth, capped shake rewards (E6, §7).
8. **Polish (ongoing).** Ferrari rims on hero trees, merged shadows, baked far chunks. Re-check the < 50 call, < 1,500 sprite budget on a low-end phone (D3, G5).

---

## 14. Sources

These are numbered for the inline [S#] references. More game and repository URLs appear in §4, §9 and §11. Every URL comes from the research notes (01–08) or the Sandbox file, except S1, which is the series reference carried over from study #3. "Not fetched", "blocked" or "title only" marks sources whose content was not read.

**Series and reference**
1. Sanglard, How DOOM fire was done (series reference, from study #3): https://fabiensanglard.net/doom_fire_psx/
2. Kingsfoil, Top-down pixel snow (VFX #1): https://kingsfoil-artifacts.netlify.app/vfx-snow-topdown-pixel
3. Kingsfoil, Top-down pixel acid (VFX #2): https://kingsfoil-artifacts.netlify.app/vfx-acid-topdown-pixel
4. Kingsfoil, Top-down pixel rain (VFX #3): https://kingsfoil-artifacts.netlify.app/vfx-rain-topdown-pixel
5. Kingsfoil, Forest Sandbox: `vfx-forest-sandbox.html` (companion page to this study)

**Classic code, hardware and tile engines**
6. pokeemerald wiki, Triple-layer metatiles: https://github.com/pret/pokeemerald/wiki/Triple-layer-metatiles
7. Porymap manual, tileset editor: https://huderlem.github.io/porymap/manual/tileset-editor.html
8. DS Pokémon Hacking, HGSS headbutt trees: https://ds-pokemon-hacking.github.io/docs/generation-iv/guides/hgss-headbutt_trees
9. yaze, ALttP overworld loading: https://git.halext.org/scawful/yaze/src/tag/v0.3.0/docs/F1-overworld-loading.md
10. Oracle of Secrets, ZSCustomOverworld: https://git.halext.org/scawful/oracle-of-secrets/src/branch/master/Docs/World/Overworld/ZSCustomOverworld.md
11. Zelda Wiki, Lost Woods: https://zeldawiki.wiki/wiki/Lost_Woods
12. Super Famicom wiki, sub-screen addition/subtraction: https://wiki.superfamicom.org/grog's-guide-to-sub-screen-addition-subtraction-and-mask-windows-on-the-snes
13. OTClient, thingtype.cpp: https://github.com/edubart/otclient/blob/master/src/client/thingtype.cpp
14. OTClient, mapview.cpp: https://github.com/edubart/otclient/blob/master/src/client/mapview.cpp
15. OTClient, tile.cpp: https://github.com/edubart/otclient/blob/master/src/client/tile.cpp
16. TibiaMaps, map file format: https://tibiamaps.io/guides/map-file-format
17. pokecrystal wiki, PRIORITY colours: https://github.com/pret/pokecrystal/wiki/Allow-map-tiles-to-appear-above-sprites-(so-NPCs-can-walk-behind-tiles)-with-PRIORITY-colors
18. snes.nesdev wiki, HDMA examples: https://snes.nesdev.org/wiki/HDMA_examples
19. OpenSNES, HDMA wave example: https://k0b3n4irb.github.io/opensnes/examples_graphics_effects_hdma_wave.html
20. SnesLab, HDMA: https://sneslab.net/wiki/HDMA
21. Emerald Crest seasons (r/PokemonROMhacks mirror): https://reddit.fabiomanganiello.com/r/PokemonROMhacks/comments/1fxas5s/adding_seasons_to_my_hack_emerald_crest
22. PICO-8 manual: https://www.lexaloffle.com/dl/docs/pico-8_manual.html

**Stardew Valley**
23. Decompiled Tree.cs (WeDias): https://github.com/WeDias/StardewValley/blob/master/TerrainFeatures/Tree.cs (read only)
24. Decompiled Tree.cs (veywrn, raw): https://raw.githubusercontent.com/veywrn/StardewValley/master/StardewValley/TerrainFeatures/Tree.cs
25. Decompiled source incl. FruitTree, Birdie, Seagull, Woodpecker, Crow (brexeprogram, via code search): https://github.com/brexeprogram/Stardew-Valley
26. Stardew Valley Wiki, Trees: https://stardewvalleywiki.com/Trees
27. CurseForge, Show Players Behind Map Tiles: https://www.curseforge.com/stardewvalley/mods/show-players-behind-map-tiles
28. TransparencySettings mod: https://github.com/Esca-MMC/TransparencySettings
29. Nexus Mods, mod 4178: https://www.nexusmods.com/stardewvalley/mods/4178
30. Stardew critters (Chinese wiki): https://wiki.biligame.com/stardewvalley/%E7%8E%AF%E5%A2%83%E7%94%9F%E7%89%A9

**Other games: wikis, devlogs, articles**
31. Serebii, Black/White seasons: https://serebii.net/blackwhite/seasons.shtml
32. Serebii, Black 2/White 2 seasons: https://serebii.net/black2white2/seasons.shtml
33. PokémonDB, Black/White seasons: https://pokemondb.net/black-white/seasons
34. Don't Starve Wiki, Evergreen: https://dontstarve.wiki.gg/wiki/Tree/Evergreen
35. Don't Starve Wiki, Birds: https://dontstarve.wiki.gg/wiki/Birds
36. Don't Starve Wiki, Knobbly Tree: https://dontstarve.wiki.gg/wiki/Knobbly_Tree
37. Klei bug tracker, canopy overheating: https://forums.kleientertainment.com/klei-bug-tracker/dont-starve-together/players-get-no-overheating-protection-under-a-canopy-when-mounted-on-a-beefalowoby-r32133/
38. RimWorld Wiki, Trees: https://www.rimworldwiki.com/wiki/Trees
39. RimWorld Wiki, Plant Rendering: https://rimworldwiki.com/wiki/Modding_Tutorials/Plant_Rendering
40. Factorio Wiki, Trees: https://wiki.factorio.com/Trees
41. Factorio FFF-86: https://direct.factorio.com/blog/post/fff-86 ; https://cf-www.factorio.com/blog/post/fff-86
42. Factorio FFF-227: https://cf-www.factorio.com/blog/post/fff-227
43. Factorio FFF-324: https://factorio.com/blog/post/fff-324
44. UOGuide, Lumberjacking: https://uoguide.com/Lumberjacking
45. OSRS Wiki, Woodcutting guide: https://oldschool.runescape.wiki/w/Woodcutting_guide_p2p
46. Terraria Wiki, Trees: https://terraria.wiki.gg/wiki/Trees
47. Graveyard Keeper graphics effects: https://slava.lazybeargames.com/graveyard-keeper-how-the-graphics-effects-are-made
48. Cornucopia dev log: https://gamedev.net/blogs/entry/2297829-cornucopia-raw-dev-log-1-gpu-instancing-or-how-2583-plants-became-3-draw-calls
49. Eastward creators interview: https://www.gamedeveloper.com/art/eastward-s-creators-share-insights-on-making-pixel-art-adventures
50. OptiFine, colormaps: https://optifine.readthedocs.io/colormaps.html
51. Minecraft Wiki mirror, Placed feature: https://wiki.ronlab.site/content/minecraftwiki_en_all_maxi_2025-11/Placed_feature
52. Minecraft Wiki mirror, World generation: https://wiki.ronlab.site/content/minecraftwiki_en_all_maxi_2025-11/World_Generation
53. TerraFirmaCraft, tree features: https://terrafirmacraft.github.io/Documentation/1.18.x/worldgen/features/trees
54. Bulbapedia, Headbutt tree: https://bulbapedia.bulbagarden.net/wiki/Headbutt_tree
55. Project Pokémon, Gen 2 headbutt mechanics: https://projectpokemon.org/docs/other/generation-2-headbutt-mechanics-r100/
56. Serebii, HGSS headbutt (title only): https://serebii.net/heartgoldsoulsilver/headbutt.shtml
57. Twinfinite, ACNH shaking trees: https://twinfinite.net/guides/animal-crossing-new-horizons-how-to-shake-trees/
58. Nookipedia, Bagworm (title only): https://nookipedia.com:443/wiki/Bagworm
59. Nintendo Life, ACNH wasp escape: https://www.nintendolife.com/news/2021/11/random-theres-a-new-wasp-escape-trick-in-animal-crossing-new-horizons-2-0
60. Nookipedia, Hardwood Tree (reference only): https://nookipedia.com/wiki/Item:Hardwood_Tree_(New_Horizons)
61. Game Developer, Bombernauts crop circle: https://gamedeveloper.com/programming/the-crop-circle-effect-in-bombernauts
62. GDQuest, 2D silhouette: https://www.gdquest.com/library/silhouette_2d
63. Silhouette variants: https://gdquest.com/tutorial/godot/shaders/silhouette-2d/ ; https://godotshaders.com/?p=12489 ; https://gamemaker.io/en/blog/silhouettes ; https://www.construct.net/fr/tutorials/silhouette-hidden-player-1090 ; https://prime31.github.io/stencil-buffer-occlusion
64. Dynamic Occlusion Cutout System (itch docs): https://pxp-games.itch.io/docs
65. TibiaWiki, Roof.gif (title only; fandom blocked): https://tibia.fandom.com/wiki/File:Roof.gif
66. OTLand mapping thread: https://otland.net/threads/ever-been-limited-in-mapping-by-not-having-proper-sprites.254199/post-2465320
67. The art of Sea of Stars: https://www.megavisions.net/the-art-of-sea-of-stars-a-sea-of-pixels/
68. Yacht Club Games, The art of the game (Mina the Hollower): https://www.yachtclubgames.com/blog/the-art-of-the-game
69. Mina the Hollower release coverage: https://engadget.com/2166369/mina-the-hollower-from-the-studio-behind-shovel-knight-arrives-on-may-29 ; https://www.creativebloq.com/entertainment/gaming/mina-the-hollower-review-goes-beyond-a-game-boy-color-zelda-homage ; https://80.lv/articles/inside-mina-the-hollower-s-six-year-journey-to-become-one-of-2026-s-best-games
70. Fields of Mistria 1.0 date: https://www.thesixthaxis.com/2026/06/06/fields-of-mistria-1-0-launch-is-coming-on-5th-august/
71. Witchbrook dates: https://www.gematsu.com/2025/10/witchbrook-delayed-to-2026 ; https://godisageek.com/2026/10/witchbrook-launch-january-2027/ ; https://gameinformer.com/2026/10/28/cozy-magical-sim-witchbrook-gets-a-january-release-date
72. Haunted Chocolatier status: https://godisageek.com/2026/10/haunted-chocolatier-eric-barone-release/ ; https://gameinformer.com/2026/06/26/concernedape-explains-why-hes-shown-so-little-of-haunted-chocolatier-i-would-rather
73. Bulbapedia, Viridian Forest: https://Bulbapedia.Bulbagarden.net/wiki/Viridian_Forest
74. Bulbapedia, Ilex Forest: https://bulbapedia.bulbagarden.net/wiki/Ilex_Forest
75. TCRF, Chrono Trigger unused graphics: https://new.tcrf.net/Chrono_Trigger_(SNES)/Unused_Graphics
76. Super Famicom wiki, Seiken Densetsu 3: https://wiki.superfamicom.org/seiken-densetsu-3
77. Ring of Brodgar (Haven & Hearth), Tree: https://ringofbrodgar.com/wiki/Tree
78. Dwarf Fortress Wiki, Tree: https://dwarffortresswiki.org/Tree
79. Terraria archive, Bird (behaviour unverified): https://terraria-archive.fandom.com/wiki/Bird
80. Raft wiki, Seagulls (behaviour unverified): https://raft.fandom.com/wiki/Seagulls
81. The Forest wiki, birds icon (behaviour unverified): https://theforest.gamepedia.com/File:IconBirds.png
82. Starbound forum, custom transparency incl. fruit trees (title only): https://community.playstarbound.com/threads/help-to-update-custom-transparency-to-include-fruit-trees.160147/
83. Don't Starve species pages: https://dontstarve.wiki.gg/wiki/Crows ; https://dontstarve.wiki.gg/wiki/Redbirds ; https://dontstarve.wiki.gg/wiki/Snowbirds ; https://dontstarve.wiki.gg/wiki/Seagull

**Canvas Cycle, tiny code and film**
84. canvascycle README (raw): https://raw.githubusercontent.com/jhuckaby/canvascycle/master/README.md
85. Canvas Cycle live demo: https://www.effectgames.com/demos/canvascycle/
86. Canvas Cycle scenes.js: https://www.effectgames.com/demos/canvascycle/scenes.js
87. Canvas Cycle palette.js: https://www.effectgames.com/demos/canvascycle/palette.js
88. Canvas Cycle scene data (V30, also V30RAIN, V26SNOW, V09): https://www.effectgames.com/demos/canvascycle/images/V30.LBM.json ; https://www.effectgames.com/demos/canvascycle/images/V09.LBM.json
89. Canvas Cycle on Google Experiments: https://experiments.withgoogle.com/canvas-cycle
90. Q&A with Mark J. Ferrari (mirror): https://dcmpx.remotevs.com/com/effectgames/www/PL/effect/article-Q_A_with_Mark_J_Ferrari.html
91. Windy Tree dweet (r/tinycode mirror): https://redlib.ssps.io/r/tinycode/comments/1bwmidr/dweet_of_the_week_windy_tree_by_killedbyapixel
92. Frank Force, Dissecting a Dweet #1: https://frankforce.com/?p=6232
93. TweeTree, LD46: https://ludum-dare.foon.uk/games/46/196970
94. Plane Ride tweetcart: https://lexaloffle.com/bbs/?pid=153803
95. befores & afters, a history of CG bird flocking: https://beforesandafters.com/2022/04/07/a-history-of-cg-bird-flocking/
96. Boids (Wikipedia via Wikiwand): https://www.wikiwand.com/en/articles/Boids
97. Fractal tree background (not fetched / search only): https://en.wikipedia.org/wiki/Fractal_canopy ; https://wiki.secretgeek.net/tree-fractal
98. Data Crystal, Harvest Moon (stub): https://datacrystal.tcrf.net/wiki/Harvest_Moon_(SNES)

**Godot docs, source and release notes**
99. Godot docs, GPU optimization: https://raw.githubusercontent.com/godotengine/godot-docs/master/tutorials/performance/gpu_optimization.rst
100. Godot source, rasterizer_canvas_gles3.cpp: https://raw.githubusercontent.com/godotengine/godot/master/drivers/gles3/rasterizer_canvas_gles3.cpp
101. Godot source, renderer_canvas_cull.cpp: https://raw.githubusercontent.com/godotengine/godot/master/servers/rendering/renderer_canvas_cull.cpp
102. Godot docs, ProjectSettings: https://raw.githubusercontent.com/godotengine/godot-docs/master/classes/class_projectsettings.rst
103. Godot docs, CanvasItem (master): https://raw.githubusercontent.com/godotengine/godot-docs/master/classes/class_canvasitem.rst
104. Godot docs, CanvasItem (4.4 branch): https://raw.githubusercontent.com/godotengine/godot-docs/4.4/classes/class_canvasitem.rst
105. Godot docs, TileMapLayer: https://raw.githubusercontent.com/godotengine/godot-docs/master/classes/class_tilemaplayer.rst
106. Godot docs, Using MultiMesh: https://raw.githubusercontent.com/godotengine/godot-docs/master/tutorials/performance/using_multimesh.rst
107. Godot docs, Shading language: https://raw.githubusercontent.com/godotengine/godot-docs/master/tutorials/shaders/shader_reference/shading_language.rst
108. Godot docs, CanvasGroup: https://raw.githubusercontent.com/godotengine/godot-docs/master/classes/class_canvasgroup.rst
109. Godot docs, VisibleOnScreenNotifier2D: https://raw.githubusercontent.com/godotengine/godot-docs/master/classes/class_visibleonscreennotifier2d.rst
110. Godot docs, 2D lights and shadows: https://raw.githubusercontent.com/godotengine/godot-docs/master/tutorials/2d/2d_lights_and_shadows.rst
111. Godot 4.4 dev 3 (2D batching): https://hackernoon.com/godot-44-dev-3-vertex-shading-2d-batching-and-more
112. Godot 4.4 release: https://godotengine.org/releases/4.4/
113. Godot 4.5 release: https://godotengine.org/releases/4.5/
114. Godot 4.6 release: https://godotengine.org/releases/4.6/
115. Godot 4.7 release: https://godotengine.org/releases/4.7/
116. Godot 4.6 dev 5 snapshot (blocked in one pass): https://godotengine.org/article/dev-snapshot-godot-4-6-dev-5/
117. Digital Production, 4.6 dev5: https://digitalproduction.com/2025/12/04/godot-4-6-dev5-lands-d3d12-default-delta-patching-android-gradle-2d-boosts
118. Digital Production, 4.6 release: https://digitalproduction.com/2026/01/28/godot-4-6-arrives-with-major-cg-friendly-updates/
119. GameFromScratch, 4.6 dev5/dev6: https://gamefromscratch.com/godot-4-6-dev5-and-dev6-released/
120. Strayspark, 4.6 rendering deep dive (vendor): https://www.strayspark.studio/blog/godot-46-rendering-deep-dive-ssr-lightmapper-performance
121. Godot PR #104566, dynamic instance buffers: https://github.com/godotengine/godot/pull/104566
122. Cinevva, Godot 4.7 released: https://app.cinevva.com/news/2026-06-19-godot-4-7-released
123. CG Channel, Godot 4.5: https://www.cgchannel.com/?p=170196
124. Godot forum, mimicking per-instance uniforms (pre-4.4): https://forum.godotengine.org/t/ways-to-mimic-per-instance-uniforms-for-canvas-item-shaders/64971
125. Godot forum, z-order in MultiMesh 2D (search result): https://forum.godotengine.org/t/z-order-in-mulitmesh-2d/10371
126. Godot Forums, Bunnymark thread: https://godotforums.org/d/29239-bunnymark
127. Godot forum, web export art-pipeline case study: https://forum.godotengine.org/t/godot-4-web-export-stutters-on-mobile-its-probably-your-art-pipeline-not-your-code-31fps-to-60fps-benchmarks-inside/143268
128. Godot benchmarks site (not checked for 2D): https://benchmarks.godotengine.org/
129. Godot forum, translucent tree when player behind (2025): https://forum.godotengine.org/t/make-a-wall-tree-a-little-bit-translucent-trasnparent-when-there-is-a-player-behind-it-in-2d-top-down-especially/111322
130. Godot forum, TileMap layers transparency (2026): https://forum.godotengine.org/t/tilemap-layers-transparency-when-player-behind/133218
131. Godot forum, thousands of trees in 4.7 (3D): https://forum.godotengine.org/t/best-approach-for-rendering-a-procedurally-generated-forest-with-thousands-of-trees-in-godot-4-7/141770
132. Godot forums, trees in front or behind (titles only): https://godotforums.org/d/22294-best-methods-for-displaying-trees-in-front-or-behind-the-player ; https://forum.godotengine.org/t/player-sometimes-renders-behind-bushes-trees-even-when-clearly-in-front-collision-issues/141959
133. Godot demo projects: https://github.com/godotengine/godot-demo-projects
134. web.dev, WebGPU in all major browsers: https://web.dev/blog/webgpu-supported-major-browsers

**Godot shaders (godotshaders.com)**
135. 2D wind sway: https://godotshaders.com/shader/2d-wind-sway/
136. 2D tree wind & trigger hit: https://godotshaders.com/shader/2d-tree-wind-trigger-hit-effect/
137. 2D Pixel perfect wind & sway: https://godotshaders.com/shader/2d-pixel-perfect-wind-sway-effect/
138. 2D Wind Sway v2 (Purga): https://godotshaders.com/shader/2d-wind-sway-tree-grass-motion-shader-2/
139. 2D Wind Sway (Purga, unversioned): https://godotshaders.com/shader/2d-wind-sway-tree-grass-motion-shader/
140. 2D Foliage Wind Effect (jess-codes): https://godotshaders.com/shader/2d-foliage-wind-effect/
141. Tree tag page: https://godotshaders.com/shader-tag/tree/
142. Wind with pixel snapping: https://godotshaders.com/shader/wind-with-pixel-snapping/
143. Dithering / screen-door transparency: https://godotshaders.com/?p=7263
144. Transparency Dither (IGN, 3D): https://godotshaders.com/shader/transparency-dither/
145. Efficient 3-line palette shader: https://godotshaders.com/shader/efficient-3-line-palette-shader-full-alpha-support/
146. Palette Swap (no recolor / recolor): https://godotshaders.com/shader/palette-swap-no-recolor-recolor/
147. Palette Swap using two textures: https://godotshaders.com/shader/palette-swap-using-two-textures/

**Gems: libraries, tools and assets**
148. poisson-disk-sampling: https://github.com/kchapelier/poisson-disk-sampling ; https://www.npmjs.com/package/poisson-disk-sampling
149. fast-2d-poisson-disk-sampling: https://github.com/kchapelier/fast-2d-poisson-disk-sampling
150. d3-delaunay: https://github.com/d3/d3-delaunay
151. simplex-noise: https://github.com/jwagner/simplex-noise.js
152. Poisson Disc Sampling (udit): https://github.com/udit/poisson-disc-sampling ; https://godotengine.org/asset-library/asset/559
153. Godot-Poisson-Disk-Sampler: https://github.com/Decapitated/Godot-Poisson-Disk-Sampler ; https://www.godotengine.org/asset-library/asset/edit/9786
154. Ben Eater boids: https://github.com/beneater/boids ; https://eater.net/boids
155. godot_boids: https://github.com/90-008/godot_boids ; https://godotengine.org/asset-library/asset/edit/19618
156. godot-boids (viniciusgerevini): https://github.com/viniciusgerevini/godot-boids
157. lindenmayer: https://github.com/nylki/lindenmayer
158. proctree.js: https://github.com/supereggbert/proctree.js
159. Procedural Pixel Art Tree (Desarrh): https://godotengine.org/asset-library/asset/5021 ; https://github.com/Desarrh/Procedural-Tree-Godot
160. Gentree: https://devkidd.itch.io/gentree/devlog/1351052/gentree-v100 ; https://community.aseprite.org/t/extension-gentree-procedural-tree-generator-for-aseprite/27983
161. 4b3c pixel tree generator devlog: https://4b3c.itch.io/procedural-pixel-art-tree-generator/devlog/773435/my-pixel-art-tree-generator
162. Other itch tree tools (not fetched): https://4b3c.itch.io/procedural-pixel-art-tree-generator ; https://wubs.itch.io/pixeltrees ; https://heosphorus.itch.io/tree-factory ; https://nofacer.itch.io/pixotree ; https://docs.rs/crate/pixeltree/0.2.1
163. Growable Trees (Seliel the Shaper): https://seliel-the-shaper.itch.io/growable-trees
164. HUSHED VALE – Trees & Bushes: https://dsatpxls.itch.io/hushed-vale-trees-bushes/devlog
165. Green Heart, Seasonal Winds V2.0: https://helm3t.itch.io/green-heart-base-pixel-asset-pack/devlog/958829/seasonal-winds-v20-season-update
166. Luanti / Minetest Game: https://github.com/luanti-org/minetest_game
167. Veloren: https://gitlab.com/veloren/veloren
168. Cataclysm: DDA: https://github.com/CleverRaven/Cataclysm-DDA
169. OpenTTD: https://github.com/OpenTTD/OpenTTD
170. Shattered Pixel Dungeon: https://github.com/00-Evan/shattered-pixel-dungeon
171. Brogue CE: https://github.com/tmewett/BrogueCE
172. Flare: https://github.com/flareteam/flare-game
173. Battle for Wesnoth: https://github.com/wesnoth/wesnoth
174. Kenney, Tiny Town: https://kenney.nl/assets/tiny-town
175. Kenney, Roguelike/RPG pack and licence: https://kenney.nl/assets/roguelike-rpg-pack ; https://kenney.nl/support
176. [LPC] Trees: https://opengameart.org/content/lpc-trees
177. LPC Seasoned Trees: https://opengameart.org/content/lpc-seasoned-trees
178. [LPC] Tree Recolors: https://opengameart.org/content/lpc-tree-recolors
179. Pine Tree Tiles (Wyrmsun): https://opengameart.org/content/pine-tree-tiles
180. Lospec, Endesga 32: https://lospec.com/palette-list/endesga-32

**Pixel artists**
181. Slynyrd, Pixelblog 44 – Top Down Trees: https://slynyrd.com/blog/2023/5/22/pixelblog-44-top-down-trees
182. Slynyrd, Pixelblog 15 – Plant Life: https://www.slynyrd.com/blog/2019/3/7/pixelblog-15-plant-life
183. Slynyrd, Pixelblog 21 – Top Down Objects: https://www.slynyrd.com/blog/2019/9/18/pixelblog-21-top-down-objects
184. Further tutorials (pointers, not read): https://slynyrd.com/blog/2018/11/16/pixelblog-11-landscape-pixeling ; https://www.slynyrd.com/blog/2018/2/15/pixelblog-2-texture ; https://www.slynyrd.com/blog/2026/5/27/pixelblog-62-landscape-backgrounds ; https://artnoob.substack.com/p/pixel-art-practice-trees-from-blobs ; https://80.lv/articles/an-ultimate-collection-of-pixel-art-guides ; https://bradteare.com/?p=498 ; https://tinywarriorgames.com/2018/12/

**Science: ecology, phenology, light, behaviour**
185. Red Blob Games, Making maps with noise: https://www.redblobgames.com/maps/terrain-from-noise/
186. Red Blob Games, Polygon map generation: https://www.redblobgames.com/maps/polygon-map-generation/
187. Crowther et al. 2015, Nature: https://cdanfort.w3.uvm.edu/csc-reading-group/crowther-nature-2015.pdf
188. Sankaran et al. 2005 (USGS record): https://www.usgs.gov/publications/determinants-woody-cover-african-savannas
189. BOREAS canopy report (ORNL DAAC): https://data.ornldaac.earthdata.nasa.gov/public/boreas/TE/te6bmflg/comp/te13_boreas_canopy.pdf
190. Penn State Extension, autumn leaf colour: https://extension.psu.edu/the-science-behind-autumn-leaf-color
191. USDA Forest Service, fall colours 2018: https://www.fs.usda.gov/fallcolors/2018/science.shtml
192. UNH Extension, tamarack: https://extension.unh.edu/blog/2022/10/autumn-gold-tamarack
193. Alabama Extension, Hopkins' bioclimatic law: https://www.aces.edu/blog/topics/forestry/estimating-alabama-bloom-times-using-hopkins-bioclimatic-law/
194. Lilac senescence individuals: https://www.pubmed.gov/31034022/
195. Our Winter World, plants and snow: https://ourwinterworld.org/snow-and-living-things/plants/
196. NSTA, Unnoticed sunballs: https://www.nsta.org/science-teacher/science-teacher-mayjune-2022/unnoticed-sunballs-all-around-us
197. Minnaert via CSULB handout: https://home.csulb.edu/~gpickett/PS112/thexp7A.pdf
198. Tufte on dapples: https://www.edwardtufte.com/?p=200
199. Wikipedia, Biome (Whittaker, Holdridge): https://en.wikipedia.org/wiki/Biome
200. Flight initiation distance papers (blocked; [U]): https://blumsteinlab.eeb.ucla.edu/wp-content/uploads/sites/104/2017/05/Blumstein_etal_2005_JAE.pdf ; https://sites.lifesci.ucla.edu/eeb-blumstein/wp-content/uploads/sites/104/2017/05/Blumstein_etal_2003_BC.pdf ; https://doaj.org/article/a7178ea83fd342f5be40fdb076f22732 ; https://blumsteinlab.eeb.ucla.edu/wp-content/uploads/sites/104/2022/04/Morelli_et_al-2022-Scientific_Reports.pdf ; https://aminer.org/pub/65e6c93013fb2c6cf629af0c/a-meta-analysis-of-the-relationship-between-flock-size-and-flight-initiation

**Academic graphics and flocking**
201. Bridson 2007, Fast Poisson Disk Sampling: https://www.cs.ubc.ca/~rbridson/docs/bridson-siggraph07-poissondisk.pdf
202. Cook 1986, stochastic sampling (HyperGraph; mirror): https://education.siggraph.org/static/HyperGraph/aliasing/alias5.htm ; https://dcmpx.remotevs.com/org/acm/dl/SL/doi/10.1145/7529.8927
203. Prusinkiewicz & Lindenmayer, *The Algorithmic Beauty of Plants*: https://algorithmicbotany.org/papers/abop/abop.pdf
204. Lindenmayer retrospective: https://www.algorithmicbotany.org/papers/Lindenmayer2025.html
205. Aono & Kunii 1984 (bibtex only): https://researchr.org/publication/AonoK84/bibtex
206. Reeves & Blau 1985: https://history.siggraph.org/?p=107421 ; lecture summary https://math.hws.edu/~bridgeman/courses/424/f25/inclass/1117-particlesys.pdf
207. Weber & Penn 1995: https://courses.cs.duke.edu/fall02/cps124/resources/p119-weber.pdf ; https://history.siggraph.org/?p=118727
208. Deussen et al. 1998, plant ecosystems: https://pharr.org/matt/assets/ecosys.pdf ; https://graphics.stanford.edu/papers/ecosys/ ; https://history.siggraph.org/?p=116559
209. Kowalski et al. 1999, art-based rendering (graftals): https://cs.brown.edu/~jhughes/papers/Kowalski-ARO-1999/paper.pdf ; https://history.siggraph.org/?p=116373
210. Deussen & Strothotte 2000, pen-and-ink trees: https://www.cs.princeton.edu/courses/archive/fall00/cs597b/papers/plantsketch.pdf ; https://graphics.uni-konstanz.de/publikationen/Deussen2000ComputergeneratedPen/index.html
211. Lane & Prusinkiewicz 2002: https://graphicsinterface.org/wp-content/uploads/gi2002-9.pdf ; https://www.algorithmicbotany.org/papers/eco.gi2002.html
212. Runions, Lane & Prusinkiewicz 2007, space colonization: https://www.algorithmicbotany.org/papers/colonization.egwnp2007.pdf ; https://diglib.eg.org/handle/10.2312/NPH.NPH07.063-070
213. Palubicki et al. 2009, self-organizing trees: https://www.algorithmicbotany.org/papers/selforg.sig2009.small.pdf ; https://www.algorithmicbotany.org/papers/selforg.sig2009.html
214. Stava et al. 2014, inverse procedural modelling: https://cs.purdue.edu/homes/bbenes/papers/Stava14CGF.pdf ; https://diglib.eg.org/items/4c6abd53-959e-4336-af65-3eb719b9c1c3 ; https://zendy.io/title/10.1111/cgf.12282
215. Makowski et al. 2019, Synthetic Silviculture: https://wp.faculty.wmi.amu.edu.pl/papers/Makowski.etal-2019-Synthetic-Silviculture.pdf
216. Gerstner et al. 2012, Pixelated Image Abstraction: https://pixl.cs.princeton.edu/pubs/Gerstner_2012_PIA/index.php
217. Pixel generation papers (title only, [U]): https://ar5iv.labs.arxiv.org/html/2410.06236 ; https://history.siggraph.org/?p=198013
218. GPU Gems 3 ch. 16, Crysis vegetation: https://developer.nvidia.com/gpugems/GPUGems3/gpugems3_ch16.html
219. GPU Gems 3 ch. 6, procedural wind for trees (not fetched): https://developer.nvidia.com/gpugems/GPUGems3/gpugems3_ch06.html
220. Reynolds 1987, boids: https://www.cs.toronto.edu/~dt/siggraph97-course/cwr87
221. Ballerini et al. 2008 (listing): https://www.citedrive.com/en/discovery/interaction-ruling-animal-collective-behavior-depends-on-topological-rather-than-metric-distance-evidence-from-a-field-study
222. Hildenbrandt, Carere & Hemelrijk 2010: https://arxiv.org/pdf/0908.2677 ; https://ideas.repec.org/a/oup/beheco/v21y2010i6p1349-1359.html
223. Wingbeat compilation (secondary): https://style.org/unladenswallow
224. Bruderer et al., wing-beat radar/cine study (abstract): https://tethys.pnnl.gov/publications/wing-beat-characteristics-birds-recorded-tracking-radar-cine-camera
225. Game Developer, procedural 2D foliage in Unity (not opened, [U]): https://www.gamedeveloper.com/game-platforms/generating-optimized-2d-art-in-unity-procedural-generation-for-stylized-and-optimized-2d-foliage

**Talks**
226. GodotCon Amsterdam 2026, "Procedural Pixel Art: Retro VFX with Shaders": https://talks.godotengine.org/godotcon-ams-2026/talk/NSNXFT/
227. GodotCon Amsterdam 2026, "The long road to a million trees": https://talks.godotengine.org/godotcon-ams-2026/talk/DL7SJJ/
228. GodotFest 2025, "Plants, Polygons and Pixels": https://media.ccc.de/v/godotfest2025-plants-polygons-and-pixels-large-scale-vegetation-rendering-in-godot
229. GodotFest 2025, "Raytracing is simple for 2D games!": https://app.media.ccc.de/v/godotfest2025-raytracing-is-simple-for-2d-games/audio
230. GodotFest 2025, "Tilemaps" (not fetched): https://app.media.ccc.de/v/godotfest2025-tilemaps
231. GDC 2026, "How We Draw a 3D Sprite World": https://www.ryanjuckett.com/how-we-draw-a-3d-sprite-world-gdc2026/
232. GDC 2026, "The Modular and Expressive World Art of Keeper" (not fetched): https://schedule.gdconf.com/session/the-modular-and-expressive-world-art-of-keeper/915052

**AI tools and market data**
233. Cinevva, AI pixel art generators guide (vendor-adjacent): https://app.cinevva.com/guides/ai-pixel-art-generators
234. Retro Diffusion: https://astropulse.itch.io/retrodiffusion
235. PowerUp Gaming, Steam AI disclosures Oct 2026: https://powerupgaming.co.uk/2026/11/02/almost-half-of-steams-october-releases-disclosed-ai-use/
236. Reynolds' boids page (not fetched): https://www.red3d.com/cwr/boids/
