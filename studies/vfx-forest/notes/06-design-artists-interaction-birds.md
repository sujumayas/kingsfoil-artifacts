# 06 — Artist-validated tree taste, player interaction, birds (top-down pixel forests)

Researcher angle: how pixel artists construct trees/forests; how games handle walking behind / through / shaking / chopping / shade; ambient birds. ~35 tool calls. Date: 2026-11-09.

Legend: **[C]** = cited finding (URL given). **[I]** = my inference / design recommendation. **[U]** = from memory / not fetched this session; verify before publishing.

---

## Q1. Artist rules for drawing trees in top-down pixel art

### Takeaway
Build canopies from a small **repeating leaf-cluster ("bundle") module**, shade the whole ball (crescent shadow on one side, smaller highlight on the other), keep **4–5 colours per bundle**, derive lighter/darker variants by sliding along one shared ramp, keep the light direction **consistent** (Slynyrd's own top-down tree post lights from the upper-right, so "top-left" is a convention, not a law), and avoid noise by **limiting variation**. Use simple symmetric shapes for tiling forests; save asymmetrical "hero" trees for sparing use.

### Cited findings
- Slynyrd (Raymond Schlitter), *Pixelblog 44 – Top Down Trees* — https://slynyrd.com/blog/2023/5/22/pixelblog-44-top-down-trees
  - Leaf unit: small leaves use "a small 2x2px square as its base geometric unit" (squares may touch, not overlap); alternative leaf units: trapezoid/rhombus (pointing up at the bundle top) or circles. [C]
  - Bundle shape: "Even ball shapes work great for me." [C]
  - Palette: "4 or 5 colors per bundle is plenty." Darker/lighter bundle variants made by "shifting all hues up or down a notch on a shared color ramp." [C]
  - Shading recipe: crescent selection along the **bottom-left** filled one shade darker; smaller circle on **upper-right** filled lighter; hand-clean highlights to reduce noise. [C]
  - Clusters must be "consistent in shape, size and spacial distribution"; balance of shapes hides repetition; bundles layered "according to an implied light source"; clean stray pixels at overlaps. [C]
  - Conifers: build from a "stick tree guide", branches drawn "with the one fill color, and one outline color", reflect side branches to fill the opposite side before shading, build top→bottom because higher branches overlap lower ones, and "some branches should cast drop shadows on lower adjacent branches." [C]
  - Trunk: bark striping "widest in the center and narrow towards the sides"; break up lines, add "a knot or an errant root." [C]
  - Drop shadow for gameplay: "center the shadow directly under the tree" to avoid collisions with other assets; a side-cast shadow is the stylised option, fixed with layer ordering. [C]
- Slynyrd, *Pixelblog 15 – Plant Life* — https://www.slynyrd.com/blog/2019/3/7/pixelblog-15-plant-life
  - "Don't try to force realistic details simply for the sake of accuracy." [C]
  - "Not every leaf needs to be represented." / "Too much variation will create displeasing noise." [C]
  - Reuse similar cluster arrangements; leave some inner branches visible for canopy depth. [C]
- Slynyrd, *Pixelblog 21 – Top Down Objects* — https://www.slynyrd.com/blog/2019/9/18/pixelblog-21-top-down-objects
  - 16×16 ground tiles; objects broken into 16×16 units; all objects follow the same 3/4 projection ("adhere to the same projection rules"). [C]
  - Trees: "simple shapes with symmetrical balance ... fit together nicely onto the tilemap"; **stagger overlapping rows to build forest canopies without gaps**; variety via colour swaps; "A more unique, asymmetrically shaped tree looks good when used sparingly." [C]
  - Shadows: "keep them subtle and not cast out long"; bake into sprite only if they fit the frame, otherwise separate shadow tiles on another layer. [C]
- Other tutorials surfaced but not read (pointers): Slynyrd *Pixelblog 11 Landscape* https://slynyrd.com/blog/2018/11/16/pixelblog-11-landscape-pixeling, *Pixelblog 2 Texture* https://www.slynyrd.com/blog/2018/2/15/pixelblog-2-texture, *Pixelblog 62 Landscape Backgrounds* (2026) https://www.slynyrd.com/blog/2026/5/27/pixelblog-62-landscape-backgrounds; "Trees from Blobs" https://artnoob.substack.com/p/pixel-art-practice-trees-from-blobs; 80.lv pixel-guide collection (incl. saint11) https://80.lv/articles/an-ultimate-collection-of-pixel-art-guides; Brad Teare "The color of trees" https://bradteare.com/?p=498; hue-shifting post https://tinywarriorgames.com/2018/12/.
- Stardew Valley tree canopy source rect is **48×96 px** (3 × 6 tiles of 16 px), stump 16×32; drawn at pixelZoom 4 (tile = 64 screen px); origin (24, 96) = bottom-centre; sprite randomly **flipped** horizontally for variety — decompiled Tree.cs, https://github.com/brexeprogram/Stardew-Valley (TerrainFeatures/Tree.cs: `treeTopSourceRect = Rectangle(0,0,48,96)`, `stumpSourceRect = Rectangle(32,96,16,32)`, `SpriteEffects.FlipHorizontally` when `flipped`). [C]
- Stardew has 4 seasonal sprite columns for mature trees (Spring/Summer/Fall/Winter) and 5 growth stages — https://stardewvalleywiki.com/Trees [C]

### Inferences
- [I] For 16-px tiles, practical canopy sizes: 32×48 (sapling/bush-tree), **48×64 to 48×96** (standard, Stardew = 48×96), 64×96+ (landmark). Keep trunk footprint 1 tile so collision = 1 tile.
- [I] Seasons = **palette swap of the same bundle sprite** (Slynyrd's shared-ramp idea extends naturally: autumn = shift the ramp toward yellow/orange/red per species; winter = bare-branch sprite + snow cap; spring = add 1–2 blossom colours as a sparse dot layer). Ties into study #1 snow depth/dither.
- [I] Hue-shift convention (general pixel-art lore, [U]): lights shift toward yellow, shadows toward blue/purple; 3–5 values per material. Slynyrd's 4–5 colours/bundle supports the count.
- [I] Bark by species (birch white with dark dashes, pine reddish plates, oak deep vertical ridges) fits Slynyrd's "stripes widest in centre" rule — just change stripe shape/colour.

### Gaps
- Could not fetch saint11, MortMort, Brandon James Greer, AdamCYounis, Pixel Parmesan, Derek Yu tree-specific content in budget. Exact artist quotes on hue-shifting not captured from a primary source.
- No interview with ConcernedApe / Pixpil / Sabotage specifically about tree drawing found. Sea of Stars art article (https://www.megavisions.net/the-art-of-sea-of-stars-a-sea-of-pixels/) only mentions "dynamic lighting on display" and "animated sprites and objects" incl. fauna — no tree detail. [C]

---

## Q2. Forest readability in top-down

### Takeaway
Canopy is a *ceiling* that hides gameplay, so (a) collision lives only at the trunk tile, (b) canopy must fade/cut away when the player is under it, (c) dense forest = staggered overlapping rows used as **walls**, walkable woods = spaced single trees with readable ground between, (d) asymmetric/unique trees act as landmarks because they are rare.

### Cited findings
- Staggered overlapping rows "build forest canopies without gaps" (forest walls); asymmetric trees "used sparingly" — https://www.slynyrd.com/blog/2019/9/18/pixelblog-21-top-down-objects [C]
- Shadows centred directly under trees to avoid collisions with other assets — https://slynyrd.com/blog/2023/5/22/pixelblog-44-top-down-trees [C]
- Stardew's fade region is much larger than the trunk (3 tiles wide × 4.5 tiles tall above the trunk), i.e. the canopy is treated as a non-colliding overhead layer — Tree.cs (see Q3). [C]
- Stardew: static map-painted trees (e.g. farm corner tree) do NOT fade, only choppable tree objects do; players complained they can't see debris behind it, spawning a mod — https://www.nexusmods.com/stardewvalley/mods/4178 [C]
- Godot community repeatedly asks for per-tree fade with TileMapLayer (modulating the whole layer fades all trees); suggested fix: `_use_tile_data_runtime_update` / `_tile_data_runtime_update` per tile — https://forum.godotengine.org/t/make-a-wall-tree-a-little-bit-translucent-trasnparent-when-there-is-a-player-behind-it-in-2d-top-down-especially/111322 [C]; related threads https://godotforums.org/d/22294-best-methods-for-displaying-trees-in-front-or-behind-the-player , https://forum.godotengine.org/t/player-sometimes-renders-behind-bushes-trees-even-when-clearly-in-front-collision-issues/141959 [C, titles only]

### Inferences
- [I] Rule of thumb: every non-faded opaque canopy pixel that can hide the player/enemies/loot is a readability bug (Stardew corner-tree complaint is the canonical example).
- [I] Paths/clearings: lower density + lighter ground tone + no canopy overlap → the eye reads it as "walkable". Landmark trees: 1.5–2× size, unique silhouette, maybe a palette that never appears elsewhere.

### Gaps
- No primary designer quote on forest-wall vs walkable-wood design found.

---

## Q3. Interaction: walking behind trees (occlusion)

### Takeaway
Cheapest, artist-approved baseline = **Stardew alpha fade**: test player AABB against a canopy rect; ease alpha down quickly to a floor (0.4) and back up slowly. Upgrades: per-pixel dither fade (fits pixel art & avoids sorting issues), silhouette/outline of the player through occluders (GDQuest viewport/mask method), or radial cutaway (Bombernauts).

### Cited findings — Stardew Valley exact numbers (decompiled Tree.cs, https://github.com/brexeprogram/Stardew-Valley TerrainFeatures/Tree.cs) [C]
- Every update: `alpha = min(1, alpha + 0.05)` (fade-in +0.05/frame ≈ 20 frames ≈ 0.33 s at 60 fps).
- If mature (`growthStage >= 5`), not falling, not stump, and player bounding box intersects `Rect(tileX-1, tileY-5, 3 tiles, 4.5 tiles)` (in tiles): `alpha = max(0.4, alpha - 0.09)` (net −0.04/frame after the +0.05, ≈ 15 frames to 0.4).
- Fruit trees: same with `growthStage >= 4`, rect 3 × 3.5 tiles from tileY-4.
- Same `max(0.4, alpha - 0.09)` pattern is used for Buildings (Building.cs) — found via GitHub code search across several decompiles (WeDias/StardewValley, brexeprogram/Stardew-Valley, ApryllForever/RiseOfTheMermaids incl. a modded Sequoia.cs).
- Mod confirming player expectations & tunables: TransparencySettings (per-object TileDistance e.g. 5, MinimumOpacity e.g. 0.4, BelowPlayerOnly) — https://github.com/Esca-MMC/TransparencySettings [C]

### Other techniques [C]
- **Silhouette through occluders (Godot)**: character rendered to a Viewport; mask sprite writes `10*alpha` into red (needs >1 values, GLES3); sprite shader reads SCREEN_TEXTURE, if red <10 the character is covered → draw silhouette/outline colour; silhouette sprite z_index 100; outline variant samples 8 neighbours. Full-screen version "may be costly on some low-end mobile devices." — https://www.gdquest.com/library/silhouette_2d (Godot 3 code; needs porting). Also https://gdquest.com/tutorial/godot/shaders/silhouette-2d/ , Godot 4 shader https://godotshaders.com/?p=12489 , GameMaker blog https://gamemaker.io/en/blog/silhouettes , Construct tutorial https://www.construct.net/fr/tutorials/silhouette-hidden-player-1090 , stencil approach https://prime31.github.io/stencil-buffer-occlusion
- **Cutaway circle (Bombernauts)**: rejected transparency and dithering (dither "just looked really bad" for their 3D blocks); per-texel crop inside a radius, outline of hidden convex edges drawn on CPU, radius driven by raycast player→camera, clamped & eased — https://gamedeveloper.com/programming/the-crop-circle-effect-in-bombernauts
- Itch asset: "Dynamic Occlusion Cutout System" dissolve 2D/3D — https://pxp-games.itch.io/docs
- Tibia: upper floors/roofs disappear when you enter a building (roof gif) — https://tibia.fandom.com/wiki/File:Roof.gif [C: file page title]; Tibia trees are blocking tiles drawn with an up-left offset (OT mapping threads https://otland.net/threads/ever-been-limited-in-mapping-by-not-having-proper-sprites.254199/post-2465320 ) [U for the tree detail].

### Inferences
- [I] For Asterion (palette-limited, WebGL2): **ordered-dither alpha** (Bayer 4×4 threshold vs per-tree fade value) instead of true alpha keeps colours on-palette, needs no blending/sorting, and reuses study #1's dither threshold. Fade only the canopy part above the trunk (separate trunk & canopy sprites or a UV.y mask).
- [I] Keep Stardew's asymmetric timing (fast out ~0.25 s, slow in ~0.35 s) and a floor of ~40% — players accept it as standard.
- [I] Fade trigger via spatial-hash lookup of trees within 2–3 tiles of the player, not Area2D per tree (cheaper with thousands of trees).

### Gaps
- Didn't verify which of Diablo II / Hades / Eastward / Children of Morta use cutaway vs fade (all [U]).

---

## Q4. Interaction: shaking, brushing, chopping, shade

### Cited findings
- **Stardew shake** (Tree.cs [C]): on shake, plays sound `"leafrustle"` (not in winter for non-pines, except greenhouse); spawns `Leaf` particles in the canopy area (x from tileX-1 to tileX+2 tiles, y 3–4 tiles above trunk) with random rotation ±0.10, 4 leaf sprite variants, random fall speed; `leafFallRate = 3`; `startingHealth = 10`; `minWoodDebrisForFallenTree = 12`, `minWoodDebrisForStump = 5`. Shadow alpha is multiplied by `(π/2 − |shakeRotation|)`, so shadow fades as the tree tips. Falling: `shakeRotation += maxShake²` with `maxShake += 0.001533981` per frame (accelerating fall), tree removed after |rotation| > π/2 and leaves gone. — https://github.com/brexeprogram/Stardew-Valley
- Stardew trees fall left or right away from the player; ~12–16 wood, 5 sap, 0–2 seeds; stump left; 5% daily chance of a seed when shaken — https://stardewvalleywiki.com/Trees [C]
- **Animal Crossing**: shaking a tree can drop Bells, furniture, or a bee/wasp swarm — https://twinfinite.net/guides/animal-crossing-new-horizons-how-to-shake-trees/ [C]; wasp escape tricks https://www.nintendolife.com/news/2021/11/random-theres-a-new-wasp-escape-trick-in-animal-crossing-new-horizons-2-0 ; bagworms hang from shaken trees https://nookipedia.com:443/wiki/Bagworm [C: page exists]. [U] per-day limits (e.g. ≤2 wasp nests/day, furniture from ≤2 trees/day) — not verified.
- **Pokémon Headbutt trees** (Gen II GSC, Gen IV HGSS): special headbuttable trees distinct from 2-tall/rounded trees; Gen II each tree's index 0–9 from map coordinates, last Trainer ID digit picks high (80%), moderate (50%) or low (10%) encounter trees; Gen IV fixed tree lists, hidden groups from Trainer+Secret ID; Pineco/Heracross only obtainable this way — https://bulbapedia.bulbagarden.net/wiki/Headbutt_tree ; tree-data docs https://ds-pokemon-hacking.github.io/docs/generation-iv/guides/hgss-headbutt_trees , mechanics https://projectpokemon.org/docs/other/generation-2-headbutt-mechanics-r100/ [C]
- **Shade as mechanic — Don't Starve Together**: Above-Average Tree Trunk (mature Knobbly Tree) canopy radius "22 wall units (5.5 tiles)", "eliminates Overheating (max temp under the leaves is 63)", "reduces 35% Wetness from Rain", wildfire protection in summer, similar to Great Tree Trunk — https://dontstarve.wiki.gg/wiki/Knobbly_Tree ; bug report showing canopy cooling is a checked state https://forums.kleientertainment.com/klei-bug-tracker/dont-starve-together/players-get-no-overheating-protection-under-a-canopy-when-mounted-on-a-beefalowoby-r32133/ [C]

### Inferences
- [I] Bush brushing = 2–3 frame sway + 2–6 leaf particles + soft rustle, triggered on entering the bush tile; cooldown ~0.5 s per bush so running through a hedge doesn't spam. (Mirrors Stardew's shake: sound + leaf particles + rotation.)
- [I] Shade: darken the player sprite by one palette step (palette-index shift, cf. snow study palette lighting) while inside the canopy shadow rect; optional DST-style gameplay (cooling, less rain wetness — ties to rain study wetness).
- [I] Dappled light: a few slowly drifting light blobs (dithered) in the shadow ellipse; cheap since only near the player.

### Gaps
- Valheim/Minecraft falling-tree physics and Sky shade not researched. ACNH numeric limits unverified.

---

## Q5. Birds for ambiance

### Takeaway
The proven pattern is tiny **"critter" state machines**, not full boids: land/peck/hop → periodic proximity check → fly-away (and despawn off-screen). Stardew checks every 200 ms with flee radius **4 tiles** (ground birds, seagulls) and **6 tiles** (woodpecker on a tree). Don't Starve birds fly in from off-screen, peck, flee when anything gets close, and species depend on turf/biome.

### Cited findings
- **Stardew critters** (decompiled BellsAndWhistles/*.cs, https://github.com/brexeprogram/Stardew-Valley) [C]:
  - `Birdie`: `characterCheckTimer = 200` ms; flee if any farmer/character within **4 tiles** (`isThereAFarmerOrCharacterWithinDistance(pos, 4)`); `flyingSpeed = 6`, `walkingSpeed = 1`; states pecking/flyingAway…; variants `brownBird = 25`, `blueBird = 45` (sprite indices = palette/species variants of one behaviour).
  - `Seagull`: check every 200 ms, flee radius **4 tiles**, `walkingSpeed = 2`, `flyingSpeed = 4`, states walking / flyingAway / flyingToLand.
  - `Woodpecker`: attached to a `Tree`; flee radius **6 tiles** or if its tree becomes a stump; `flyingSpeed = 6`; `peckTimer = random(1000, 3000)` ms.
  - Separate `Monsters/Crow.cs` uses `withinPlayerThreshold()` → starts flying (crop-eating crows).
  - Chinese wiki critter list: https://wiki.biligame.com/stardewvalley/%E7%8E%AF%E5%A2%83%E7%94%9F%E7%89%A9 [C: page exists]
- **Don't Starve birds** — https://dontstarve.wiki.gg/wiki/Birds [C]: appear in every biome during Day and Dusk; "fly down from off-screen and peck the ground for a few moments, then fly away"; "If the player or most other mobs get too close, birds will be frightened away"; won't land within melee range; killing one scares nearby birds; species by turf: Crow (any turf except Grass), Redbird (Grass/Forest/Savanna; uses real robin sounds), Snowbird (same turfs; [U] winter), Canary; usually only two types at once. Species pages: https://dontstarve.wiki.gg/wiki/Crows , https://dontstarve.wiki.gg/wiki/Redbirds , https://dontstarve.wiki.gg/wiki/Snowbirds , https://dontstarve.wiki.gg/wiki/Seagull
- Other games with ambient bird critters (URLs from search results, behaviour not verified): Terraria birds https://terraria-archive.fandom.com/wiki/Bird ; Raft seagulls (eat crops) https://raft.fandom.com/wiki/Seagulls ; The Forest birds https://theforest.gamepedia.com/File:IconBirds.png [U for behaviour].
- **Real-bird flight initiation distance (FID)**: primary papers located but blocked (PMC "checking browser", UCLA lab PDF not on allowlist): Blumstein et al. 2005 JAE https://blumsteinlab.eeb.ucla.edu/wp-content/uploads/sites/104/2017/05/Blumstein_etal_2005_JAE.pdf , Blumstein 2003 https://sites.lifesci.ucla.edu/eeb-blumstein/wp-content/uploads/sites/104/2017/05/Blumstein_etal_2003_BC.pdf , Díaz et al. 2013 "Geography of Fear" (latitudinal gradient across Europe) https://doaj.org/article/a7178ea83fd342f5be40fdb076f22732 , Morelli 2022 https://blumsteinlab.eeb.ucla.edu/wp-content/uploads/sites/104/2022/04/Morelli_et_al-2022-Scientific_Reports.pdf , flock-size meta-analysis https://aminer.org/pub/65e6c93013fb2c6cf629af0c/a-meta-analysis-of-the-relationship-between-flock-size-and-flight-initiation . [U] Typical values: small passerines ~5–20 m, larger birds tens of metres; FID grows with body mass and with the approacher's starting distance; urban birds tolerate closer approach.

### Inferences
- [I] Game-compressed FID: Stardew's 4 tiles (≈ a quarter screen) feels right; scale by species: small songbird 3 tiles, crow 5, pigeon/gull 4, heron/large 6–8; running player ×1.5 radius; sneaking ×0.6. Stagger flock take-off with 50–250 ms random delays (one bird spooks → neighbours follow, like DST's "killing one scares nearby").
- [I] Boids only for the *airborne* phase and only for ≤10–20 birds; classic Reynolds weights (separation > alignment ≈ cohesion) [U: https://www.red3d.com/cwr/boids/ not fetched]. Cheaper alternative: precomputed flight curves with per-bird offsets.
- [I] Sprites: 8×8 to 12×12 px bird on 16-px tiles; 2–4 flap frames + 1 glide; ground states: idle, peck (2 frames), hop. Shadow: 1-colour 3–4 px ellipse on ground, offset grows with altitude (drop shadow fades with height). Perch on tree = reuse canopy top-pixel anchor (Stardew woodpecker binds to a specific Tree object).
- [I] Season/biome species table via palette swap of one bird sprite (Stardew brown/blue birdie pattern; DST turf-based species; winter = crows/snowbirds only).

### Gaps
- No numeric flap-frame counts or bird sprite sizes from a primary source. RDR2/Firewatch/Kingdom/BotW bird behaviour not researched.

---

## Q6. Anti-patterns (collected)
- Noise from too much variation in clusters — Slynyrd https://www.slynyrd.com/blog/2019/3/7/pixelblog-15-plant-life [C]
- Long cast shadows / shadows that collide with other assets — https://www.slynyrd.com/blog/2019/9/18/pixelblog-21-top-down-objects , https://slynyrd.com/blog/2023/5/22/pixelblog-44-top-down-trees [C]
- Non-fading canopy hiding gameplay (Stardew farm-corner tree → mod demand) — https://www.nexusmods.com/stardewvalley/mods/4178 [C]
- Modulating a whole tile layer fades every tree at once — https://forum.godotengine.org/t/make-a-wall-tree-a-little-bit-translucent-trasnparent-when-there-is-a-player-behind-it-in-2d-top-down-especially/111322 [C]
- Dither transparency judged ugly on large 3D blocks (Bombernauts) — https://gamedeveloper.com/programming/the-crop-circle-effect-in-bombernauts [C] ([I] in low-res pixel art dither is usually *on-style*; test it).
- Full-screen silhouette pass may be costly on low-end mobile — https://www.gdquest.com/library/silhouette_2d [C]
- [I] Identical repeated trees in grids, birds looping on visible fixed paths, everything swaying at once (over-animated forest) — no primary source found in budget.

---

## Game examples ("see it in action")
| # | Game | Feature | URL | Status |
|---|---|---|---|---|
| 1 | Stardew Valley | alpha fade 0.4, shake+leaves, chop/fall, seasons | https://stardewvalleywiki.com/Trees ; code https://github.com/brexeprogram/Stardew-Valley | C |
| 2 | Stardew Valley | Birdie/Seagull/Woodpecker critters, flee 4/6 tiles | https://wiki.biligame.com/stardewvalley/%E7%8E%AF%E5%A2%83%E7%94%9F%E7%89%A9 | C |
| 3 | Stardew (mods) | player demand for transparency | https://www.nexusmods.com/stardewvalley/mods/4178 , https://github.com/Esca-MMC/TransparencySettings | C |
| 4 | Don't Starve (Together) | ground birds by turf, flee | https://dontstarve.wiki.gg/wiki/Birds | C |
| 5 | Don't Starve Together | canopy shade cools/keeps dry | https://dontstarve.wiki.gg/wiki/Knobbly_Tree | C |
| 6 | Animal Crossing: New Horizons | shake tree → bells/furniture/wasps | https://twinfinite.net/guides/animal-crossing-new-horizons-how-to-shake-trees/ | C |
| 7 | Animal Crossing: NH | bagworms from shaken trees | https://nookipedia.com:443/wiki/Bagworm | C(title) |
| 8 | Pokémon Gold/Silver/Crystal | Headbutt trees, hidden encounter tiers | https://bulbapedia.bulbagarden.net/wiki/Headbutt_tree | C |
| 9 | Pokémon HeartGold/SoulSilver | Headbutt tree groups | https://serebii.net/heartgoldsoulsilver/headbutt.shtml | C(title) |
| 10 | Bombernauts | cutaway circle + outline | https://gamedeveloper.com/programming/the-crop-circle-effect-in-bombernauts | C |
| 11 | GDQuest 2D Space Game (Godot) | full-screen silhouette | https://www.gdquest.com/library/silhouette_2d | C |
| 12 | Tibia | roofs vanish on entering | https://tibia.fandom.com/wiki/File:Roof.gif | C(title) |
| 13 | Sea of Stars | dynamic lighting, animated fauna | https://www.megavisions.net/the-art-of-sea-of-stars-a-sea-of-pixels/ | C |
| 14 | Terraria | bird critters | https://terraria-archive.fandom.com/wiki/Bird | U |
| 15 | Raft | seagulls | https://raft.fandom.com/wiki/Seagulls | U |
| 16 | The Forest | birds | https://theforest.gamepedia.com/File:IconBirds.png | U |
| 17 | Starbound/Stardew modding | custom transparency incl. fruit trees | https://community.playstarbound.com/threads/help-to-update-custom-transparency-to-include-fruit-trees.160147/ | C(title) |
Not verified this session (good candidates): Zelda ALttP/Minish Cap (forest walls, canopy layers), Diablo II (wall cutaway), Eastward, Hyper Light Drifter, Children of Morta, Kingdom (birds), Valheim (physics tree falls), RDR2 (birds flee).

## Artist quotes (<15 words)
- "4 or 5 colors per bundle is plenty." — Slynyrd, Pixelblog 44
- "Even ball shapes work great for me." — Slynyrd, Pixelblog 44
- "center the shadow directly under the tree" — Slynyrd, Pixelblog 44
- "some branches should cast drop shadows on lower adjacent branches." — Slynyrd, Pixelblog 44
- "Not every leaf needs to be represented." — Slynyrd, Pixelblog 15
- "Too much variation will create displeasing noise." — Slynyrd, Pixelblog 15
- "Don't try to force realistic details simply for the sake of accuracy." — Slynyrd, Pixelblog 15
- "A more unique, asymmetrically shaped tree looks good when used sparingly." — Slynyrd, Pixelblog 21
- "keep them subtle and not cast out long" (shadows) — Slynyrd, Pixelblog 21
- dither "just looked really bad" — Bombernauts dev, Game Developer

## Blocked / failed
- stardewvalleywiki.com/Critters (not on allowlist); PMC articles (browser check); breezewiki & digibug (Anubis bot wall); UCLA Blumstein PDF (not on allowlist); GitHub API raw file access for decompile repos (403; used `gh search code` fragments instead).

## Sources
- https://slynyrd.com/blog/2023/5/22/pixelblog-44-top-down-trees
- https://www.slynyrd.com/blog/2019/3/7/pixelblog-15-plant-life
- https://www.slynyrd.com/blog/2019/9/18/pixelblog-21-top-down-objects
- https://github.com/brexeprogram/Stardew-Valley (TerrainFeatures/Tree.cs, FruitTree.cs, BellsAndWhistles/Birdie.cs, Seagull.cs, Woodpecker.cs, Monsters/Crow.cs) — decompiled, via GitHub code search
- https://stardewvalleywiki.com/Trees
- https://www.nexusmods.com/stardewvalley/mods/4178
- https://github.com/Esca-MMC/TransparencySettings
- https://forum.godotengine.org/t/make-a-wall-tree-a-little-bit-translucent-trasnparent-when-there-is-a-player-behind-it-in-2d-top-down-especially/111322
- https://www.gdquest.com/library/silhouette_2d
- https://gamedeveloper.com/programming/the-crop-circle-effect-in-bombernauts
- https://dontstarve.wiki.gg/wiki/Birds
- https://dontstarve.wiki.gg/wiki/Knobbly_Tree
- https://twinfinite.net/guides/animal-crossing-new-horizons-how-to-shake-trees/
- https://bulbapedia.bulbagarden.net/wiki/Headbutt_tree
- https://www.megavisions.net/the-art-of-sea-of-stars-a-sea-of-pixels/
- plus pointer URLs listed inline above
