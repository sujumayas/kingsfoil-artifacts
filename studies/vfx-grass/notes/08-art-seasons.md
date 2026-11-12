# 08. Art, feel, seasons and biomes (artistic quality lens)

Researcher 08. Scope is grass tiles, anti-grid tricks, transitions, tufts, palette ramps, seasons and moisture, biomes, readability and reduced motion. Forest study C1 (season palette swap for trees) is assumed known. This note goes deeper on grass fields only.

Tool budget used: about 30 calls. Several wikis returned 403 (StrategyWiki, Nintendo Wire). The Stardew wiki API and a decompiled `Grass.cs` on GitHub worked and gave the hardest numbers in this note.

---

## Q1. How do pixel artists draw a grass tile that does not look like a grid?

### Takeaway
Use few colours. Draw a handful of clusters with empty flat areas between them. Make every variant wrap at the edges, and mix flat tiles with textured tiles of different density. Then add a second layer of tufts and decals that ignore tile borders. A rare flower variant adds life. Nobody in these sources renders every blade.

### Cited findings
- Slynyrd (Raymond Schlitter), Pixelblog 20 "Top Down Tiles". He works at 16x16, which he calls "probably the most common size". A single repeated grass tile looks monotonous. The fix is to mix flat green with textured patches of varying density and to keep visual weight even inside each tile. Clusters wrap around the tile edges to hide seams. Mirroring a tile gives new orientations for free. "Occasional flower variants" add life. https://www.slynyrd.com/blog/2019/8/27/pixelblog-20-top-down-tiles
- Slynyrd, Pixelblog 2 "Texture". "A good texture may only need a few simple clusters." He also says "Don't try to depict the fine details of every leaf". Fine detail in one spot needs restraint elsewhere, and orphan pixels are avoided. Leaving areas empty makes the texture implied. https://www.slynyrd.com/blog/2018/2/15/pixelblog-2-texture
- Slynyrd, Pixelblog 43 "Top Down Tiles Part 2". This is the layered method. The background is cut out of partial textures (grass, rocky dirt) so they stack over a base. The base must "loop well on all four sides". Side and corner pieces are made by "shaving off portions of the base texture". Use a tile-aware editor (Aseprite tile mode, Pyxel Edit) to see seams live. https://www.slynyrd.com/blog/2023/3/26/pixelblog-43-top-down-tiles-part-2
- Stardew Valley's grass tufts are an anti-grid layer drawn over the ground tiles (decompiled `TerrainFeatures/Grass.cs`, 1.5-era decompile). https://raw.githubusercontent.com/veywrn/StardewValley/master/StardewValley/TerrainFeatures/Grass.cs
  - Each grass tile holds up to 4 tufts. Each tuft picks 1 of 3 sprites (`whichWeed = r.Next(3)`). Each sprite is 15x20 px in the source sheet, drawn at 4x scale.
  - Each tuft gets a random offset of -2..+2 source pixels on both axes (`offset = r.Next(-2,3)`, times 4 screen px). It also has a 50% horizontal flip and a random sway phase (`shakeRandom`).
  - The tufts y-sort individually: `layerDepth = (pos.Y + 16 - 20)/10000 + pos.X/1e7`.
  - The random values come from a per-tile seed, so the layout is stable from frame to frame.
- Wiki. A full grass tile is "4 tufts of grass". Growth and spread run once per day. There is a 65% growth check per tile, and a full tile spreads 1-2 tufts to each adjacent tillable tile at 25%. https://stardewvalleywiki.com/mediawiki/api.php?action=parse&page=Grass&prop=wikitext&format=json
- Godot 4 terrain painting picks randomly among tiles that match the same peering bits, weighted by each tile's probability. A forum and proposal thread says the pick is not seeded by a user function. https://redlib.hbubli.cc/r/godot/comments/18yu4s2/can_you_randomize_tiles_when_using_autotiles , https://github.imc.re/godotengine/godot-proposals/discussions/10948
- Tiled uses the same idea. Set a variant's probability to 0.01 and it becomes "100 times less likely" than the normal tile. https://tiled.readthedocs.io/manual/terrain/
- Godot alternative tiles support Flip H, Flip V and Transpose, which gives 8 orientations of one tile. Alternatives do not inherit base tile properties. https://docs.godotengine.org/en/stable/tutorials/2d/using_tilesets.html

### Inferences
- A recipe for a 32x32 Asterion tile is 1 flat base, 3-4 textured variants at different densities and 1-2 rare flower variants. Drawn to wrap, with mirroring, that gives roughly 20-40 visible arrangements from about 6 drawn tiles.
- Don't let Godot's unseeded terrain random decide variants in an MMO. Each client could paint a different field, and the field would reshuffle on reload. Pick the variant and flip with a hash of (x, y), as Stardew does with its per-tile seed. That makes every client agree with zero bytes on the wire.
- The tuft layer, not the ground tile, is what breaks the grid. Stardew offsets 4 tufts per tile by ±2 px and flips half of them, and that alone kills the grid read.

### Gaps
- No exact colour count per grass tile from Slynyrd's text (it is in the GIFs, which were not read).
- Pedro Medeiros (Saint11) has no grass-specific tutorial that was findable. His series moved to saint11.org/pixel_articles, and a 2022 thread says no new ones are planned. https://medium.com/@saintjust/how-to-start-making-pixel-art-2d1e31a5ceab , https://itch.io/post/8580710/view-in-topic

---

## Q2. Large-scale variation: noise tint over the whole field

### Takeaway
A very low-frequency world-space noise breaks the repetition that survives tile variants, such as the same green everywhere. In pixel art it should pick between 2-3 hand-made palette ramps with a hard or dithered threshold, not tint continuously. Continuous tints create off-palette colours.

### Cited findings
- A Godot tilemap shader computes the world position in `vertex()`, then samples a noise with `fract(world_pos * scale)`, so the noise runs across the whole map instead of restarting per tile. https://godotshaders.com/shader/mix-2-tilemap-to-break-repetitive/
- Another Godot grass shader suggests Perlin noise at frequency about 0.005 for "large, smooth color variations", blended by an intensity uniform. https://godotshaders.com/shader/grass-soil-texture-tileable-texture-noise/
- A Unity answer blends 3 variants of one grass (normal, rotated, scaled) with a grayscale mask stretched over large areas. https://discussions.unity.com/t/making-a-shader-that-creates-noise-like-color-variation-on-mesh-texture/685905
- World-continuous UVs grow large far from the origin, which costs float precision. https://playerunknownproductions.net/news/stochastic-texturing

### Inferences
- For Asterion, a 1-texel-per-tile "meadow mood" map (an R8 texture, or a hash of tile coords) can pick ramp A, B or C per tile. Use Fog's world-locked Bayer dither at boundaries so the change reads as pixel clusters, not a blur. The cost is one texture fetch and a palette index lookup per fragment (estimate).
- Wrap the noise coordinate per region (`tile % 256`) to avoid the precision problem on a large server map.

### Gaps
- No measured cost of these shaders on WebGL2 was found.

---

## Q3. Grass-to-dirt and grass-to-water transitions

### Takeaway
Use a 16-tile 2-corner Wang set (Godot "Match Corners") for organic grass edges. It is a quarter of the blob set's art cost, and grass edges are soft enough that corners alone read fine. Keep the 47-tile blob (Godot "Match Corners and Sides") for hard-edged things like cliffs and paths. Use layered partial tiles (Slynyrd 43) so grass edges overlap dirt instead of cutting it.

### Cited findings
- Guy Walker (cr31). The blob set is "a 47 tile subset" of the 2-edge 2-corner Wang set, which has 2^8 = 256 combinations. https://boristhebrave.com/permanent/24/06/cr31/stagecast/wang/blob.html
- A 2-corner Wang set has 2^4 = 16 tiles. In a 4x4 layout it forms "Brigid's Cross". https://boristhebrave.com/permanent/24/06/cr31/stagecast/wang/glossary.html , https://www.redblobgames.com/articles/autotile/gemini/autotiling.html
- Godot 4 terrain modes are Match Corners and Sides, Match Corners, and Match Sides. These map to Godot 3's 3x3, 2x2 and 3x3-minimal bitmasks. https://docs.godotengine.org/en/stable/tutorials/2d/using_tilesets.html
- Slynyrd 20. Dry, busy dirt paired with simple green grass, plus a "set of connection tiles". https://www.slynyrd.com/blog/2019/8/27/pixelblog-20-top-down-tiles

### Inferences
- With 16 corner tiles x 2 variants each, a grass/dirt pair is 32 tiles. A blob set with 2 variants is 94 tiles.
- Contrast between the textures does most of the work. Slynyrd's busy dirt against simple grass means the edge reads even with a plain shape. Add a 1-px darker grass lip at the edge (the grass overhanging the dirt) for depth.
- Grass-to-water belongs to Water study #7. Use the same corner set, with a 1-2 px band of darker, more saturated grass at the bank, because wet ground is darker (Q6).

---

## Q4. Palette ramps for grass

### Takeaway
Use 4-5 greens per ramp. Shift highlights toward yellow and shadows toward blue or teal by about 15-25 degrees of hue overall. Keep the ground ramp lower in saturation and value than character ramps. Stardew's own grass colours confirm this. Summer grass is the yellow-green end at hue 89 degrees, and spring is pure green at 119 degrees.

### Cited findings
- A hue-shift guide gives the ranges. A 15-25 degree shift "reads as natural", 30+ looks stylized, and 0 gives a flat light/dark ramp. https://pixelpaletteswap.pages.dev/guides/color-theory-for-pixel-art.html (minor site, treat it as a rule of thumb)
- The Pixel Grimoire green ramp bends lights toward yellow and darks toward a second (cool) colour, because straight ramps "don't reflect the variety of hues". https://medium.com/pixel-grimoire/how-to-start-making-pixel-art-6-a74f562a4056
- An Aseprite forum reply says there are no hard rules, but you usually want some hue shift. https://community.aseprite.org/t/designing-a-palatte-advice-needed/11637
- Lospec hosts a tag of hue-shifted palettes to start from. https://lospec.com/palette-list/tag/hue%20shift
- Stardew cut-grass debris colours by season (`Grass.cs` `performToolAction`) are spring (60,180,58), summer (110,190,24) and fall (219,102,58). Other grass types use (148,146,71) olive, (216,240,255) frost white and (165,93,58) brown. https://raw.githubusercontent.com/veywrn/StardewValley/master/StardewValley/TerrainFeatures/Grass.cs

### Inferences (my computation from the Stardew colours)
| Season | RGB | Hue | Sat | Val | G/(R+G+B) |
|---|---|---|---|---|---|
| Spring | 60,180,58 | 119 | 0.68 | 0.71 | 0.60 |
| Summer | 110,190,24 | 89 | 0.87 | 0.75 | 0.59 |
| Fall | 219,102,58 | 16 | 0.74 | 0.86 | 0.27 |
| Olive type | 148,146,71 | 58 | 0.52 | 0.58 | 0.40 |

- Stardew moves about 30 degrees toward yellow from spring to summer and keeps greenness flat. Then fall jumps about 73 degrees to orange. That is a stylized fall. Real grass goes to straw (hue about 40-50 degrees, lower saturation), not orange.
- A starter grass ramp for a 320x180 game is 5 colours. Darkest is a blue-teal shadow (hue about 160). Then a mid shadow (about 140), the base (about 115), a light (about 95) and a yellow tip highlight (about 75, used sparingly). Keep the base value at about 0.45-0.6 so characters (value 0.2 outlines, saturated clothes) pop. This is an inference, untested.

---

## Q5. Seasons: palette swap vs sheet swap, and gradual turning

### Takeaway
The production pattern is a full per-season tilesheet with an identical layout (Stardew `spring_`, `summer_`, `fall_`, `winter_`). A palette or LUT swap of the same pixels is cheaper and allows gradual transitions. Real phenology says the field should not turn all at once. Green-up moves about 4 days later per degree of latitude or per 400 ft (about 122 m) of elevation. In the Alps it is now about 22 days per 1000 m. Per-tile offsets in a game are therefore realistic as well as pretty.

### Cited findings
- Stardew map tilesheets are named per season, such as `spring_outdoorsTileSheet.png` and `spring_town.png`. The `SeasonOverride` map property decides "which tilesheet to use". Seasonal furniture puts its spring, summer, fall and winter sprites side by side, offset by one width each. https://stardewvalleywiki.com/mediawiki/api.php?action=parse&page=Modding:Maps&prop=wikitext&format=json
- Stardew grass tufts switch by row offset in one sheet. Spring is y=0, summer y=20 and fall y=40, with other grass types at 60/80/100 (`grassSourceOffset`). Season change re-runs `loadSprite()`. Before 1.6, winter deleted type-1 grass (`seasonUpdate` returns true). Since 1.6 it is "dormant until spring", grows nothing, and winter hay chance drops 67%. On spring 1 of year 2+ the game runs 40 growth iterations so fields refill at once. https://raw.githubusercontent.com/veywrn/StardewValley/master/StardewValley/TerrainFeatures/Grass.cs , https://stardewvalleywiki.com/mediawiki/api.php?action=parse&page=Grass&prop=wikitext&format=json
- Pokémon Black/White seasons change monthly and cycle every 4 months, so a full cycle happens 3 times a year. Scenery and some route access change with the season. https://m.bulbapedia.bulbagarden.net/wiki/Season_(mechanic) , https://nationaldex.io/guide/pokemon-black-white-black-2-white-2/seasons-guide
- Hopkins' bioclimatic law. Spring events come about 4 days later per degree north, per 5 degrees east and per 400 ft up, and autumn events come earlier by the same amounts. https://www.britannica.com/science/phenology
- European Alps. The elevation shift was about 34 days per 1000 m in the early 1960s and is now about 22 days per 1000 m, down 35%. Japanese cherry bloom is 1.28 days per 100 m. https://pmc.ncbi.nlm.nih.gov/articles/PMC6426166 , https://pmc.ncbi.nlm.nih.gov/articles/PMC5798366
- Grassland NDVI sits at about 0.2-0.5, the same band as senescing crops. Dense vegetation is 0.6-0.9. NDVI time series give the green-up rate (start to peak) and the senescence rate (peak to end) as separate slopes. https://www.usgs.gov/special-topics/remote-sensing-phenology/science/ndvi-foundation-remote-sensing-phenology
- Spring and autumn greenness in grassland are asymmetric, driven by temperature and precipitation. https://api.crossref.org/works/10.3390%2FRS11182107
- During senescence, camera greenness (GCC) changes before NDVI, because GCC follows leaf colour and NDVI follows leaf area. https://par.nsf.gov/servlets/purl/10053881

### Inferences
- Gradual turning, cheaply. Give each tile a phase offset `p(x,y) = hash(x,y)*0.25 + elevation_term + moisture_term` in season units. The shader picks ramp `season_index = floor(t + p)` with an ordered-dither crossfade over about 0.05 season. A field then turns patch by patch over several in-game days, with low ground and wet ground staying green longest. This costs one hash per fragment (estimate).
- Green-up should be fast and senescence slow. That matches the separate NDVI slopes. Spend fewer days on the brown-to-green change than on the green-to-straw change.
- Colour turns before the grass thins (GCC leads NDVI). So swap the palette first and remove tufts later, if tuft density changes at all.
- For an MMO the server only sends `season_t` (one float per region per minute). Clients compute every per-tile phase locally, so this costs zero bandwidth.

### Gaps
- No published GCC numbers for grassland peak vs dormant were found. Pull a PhenoCam grassland time series (`phenocamapi`) to get real RGB anchors. https://earthdatascience.org/notebooks/07-phenocam/phenocam-esa.html

---

## Q6. Dry, wet and snowy grass

### Takeaway
- Dry grass is a separate straw ramp (desaturated yellow-ochre), not a brown tint of green.
- Wet grass goes more saturated and a step darker in the shadows. Wet dirt and paths go much darker, roughly half the reflectance. Add 1-px glints only near the light direction.
- Snow covers the ground tile, while short tuft tips poke through and then disappear as depth grows. Snow cover belongs to Snow study #1. Reuse its depth map to hide tufts.

### Cited findings
- Wet rough surfaces darken because light gets trapped in the water film (Ångström model, Lekner & Dorf 1988). Sand albedo went from 0.182 dry to 0.091 wet. https://www.wgtn.ac.nz/scps/staff/pdf/darkerwhenwet.pdf
- Wet grass looks more vivid, not just darker. The water film smooths the blade so less white light scatters. https://www.irishtimes.com/news/things-bright-and-beautiful-1.87052
- Bentgrass canopies under dew showed visible reflectance up about 50%, and up about 16% under rain. So wet grass does not always read darker. (Summary of a turfgrass study surfaced via search. Primary not opened.)
- After short rain, NDVI and EVI can drop by more than 0.3 in some pixels because the water film cuts near-infrared. https://sites.bu.edu/cliveg/files/2025/04/02-Gao-Amazon-RSE-2025.pdf
- Stardew has no winter grass art. Grass is removed (before 1.6) or dormant (1.6). Its frost-white grass type uses debris colour (216,240,255), which is hue 203 and saturation 0.15, a pale blue-white rather than pure white. https://raw.githubusercontent.com/veywrn/StardewValley/master/StardewValley/TerrainFeatures/Grass.cs
- Modders recolouring 1.6 note "winter grass" must match the winter palette, so winter has its own grass palette in vanilla. https://www.nexusmods.com/stardewvalley/mods/20750

### Inferences
- Wet recipe as a palette operation, not a shader blur. Move every grass index one step down its ramp for shadows and add +10% saturation. Move dirt two steps down. Spawn a few 1-px white glints on tuft tips for 1-3 frames, only in "after rain" state. Rain study #3 covers wet-ground puddles, so link it.
- Snow recipe. Tufts taller than the snow depth show only their top 1-3 px as dark-green dots on white. That is the best "winter grass" read at 320x180. When depth exceeds tuft height, the tuft stops drawing.
- Frost mornings. A pale blue-white tint on tuft tips only (hue about 200, low saturation, after Stardew's frost colour) that fades by mid-morning game time.

---

## Q7. Biome grass variety

### Takeaway
Change three things per biome: ramp, tuft silhouette and density. Keep the same 16-tile corner template so one autotile layout serves every biome.

### Cited findings
- Stardew already runs 6 grass types from one sheet by row offset (20 px per type). Types 2-4 use olive (148,146,71), frost (216,240,255) and brown (165,93,58). Blue Grass (Meadowlands farm) gives 2 hay per cut and is eaten at half the rate. https://raw.githubusercontent.com/veywrn/StardewValley/master/StardewValley/TerrainFeatures/Grass.cs , https://stardewvalleywiki.com/mediawiki/api.php?action=parse&page=Grass&prop=wikitext&format=json
- Grassland NDVI (0.2-0.5) is well below forest (0.6-0.9), and soil colour leaks through sparse grass. So dry biomes should show more ground between tufts. https://www.usgs.gov/special-topics/remote-sensing-phenology/science/ndvi-foundation-remote-sensing-phenology

### Inferences (art direction, not cited)
| Biome | Ramp | Tuft silhouette | Density | Seasonal note |
|---|---|---|---|---|
| Meadow | green, yellow tips | short rounded clumps | 3-4 tufts/tile | flowers spring and summer |
| Savanna | straw/ochre, green only in wet season | tall thin vertical blades, 2x tall | 1-2 tufts/tile, dirt shows | wet and dry instead of 4 seasons |
| Swamp reeds | dark teal-green, brown heads | long vertical reeds with a cattail dot | clumps along water | stays green longest |
| Tundra | grey-green, rust, lichen | flat mats, almost no height | sparse | very short green window |
| Desert scrub | grey-olive | round bushy blobs | 0-1 per tile | mostly static, no sway |

---

## Q8. What players and critics praise

### Takeaway
Praise centres on grass that reacts (sways when you pass) and on the world feeling "alive". Nobody singles out the colour of a tile. Small reactive motion gets noticed more than rendering quality.

### Cited findings (quotes under 15 words)
- Eastward (Entertainium). "Strange creatures move in the trees, grass sways as John and Sam pass by". Also "Crucially, this retro world feels alive." https://entertainium.co/2021/10/15/eastward-review/
- Eastward (Game Informer). "highlights what you can do with perfect pixel placement". https://www.gameinformer.com/review/eastward/eastward-review-pixel-paradise
- Itch player comment: "even down to the little details like the sway of the grass". https://itch.io/post/8467540 (search summary, so the exact thread is unconfirmed)
- Itch player comment: "especially the grass that bends when you move past it". (search summary from the itch.io results batch above, exact post unconfirmed)
- A developer noted that without a subtle sway the grass looked like "green spikes". (search summary, itch.io)
- Chained Echoes reviews praise detailed, colourful environments that "make the world feel alive". https://entertainium.co/2022/12/13/chained-echoes-review/ , https://www.gamegrin.com/reviews/chained-echoes-review
- Sea of Stars uses dynamic lighting and many small ambient animations rather than palette swaps. No grass-specific quote was found. https://astrolabe.aidanmoher.com/astrolabe-feature-sea-of-stars-is/ , https://www.megavisions.net/the-art-of-sea-of-stars-a-sea-of-pixels/

### Gaps
- Nothing grass-specific was found for Hyper Light Drifter, Tunic, Octopath, Alba or Unpacking in the budget. These are worth a targeted video or devlog pass (HLD and Tunic grass cutting).

---

## Q9. Readability and reduced motion

### Takeaway
Ground grass must stay quieter than anything you can interact with. That means lower saturation, mid values and no pure black. Motion should be small (1 px) and out of phase across tufts. A whole field swaying in sync counts as a "moving repeated pattern" over a large share of the screen, which accessibility guidelines flag. Ship a "reduce background motion" toggle that freezes grass sway and ambient critters but keeps gameplay feedback such as rustle on step.

### Cited findings
- Lower saturation for tiles than for characters, and judge tiles in a 3x3 or larger grid. Low-quality guide sites, treat as a rule of thumb: https://www.sprite-ai.art/blog/pixel-art-backgrounds , https://www.sprite-ai.art/guides/how-to-create-16x16-pixel-art
- A Pixel Joint critique says that when every tile competes for attention, shapes become hard to read. https://pixeljoint.com/forum/printer_friendly_posts.asp?TID=24922
- Game Accessibility Guidelines, "Provide an option to turn off / hide background movement". This is intermediate level, for cognitive (ADHD) and vision needs. Examples are Civ IV's strategic view, Gardens of Time's animation setting and Street Fighter IV's low background detail. https://gameaccessibilityguidelines.com/provide-an-option-to-turn-off-hide-background-movement/
- The guidelines' flicker page is basic level. It flags "Moving repeated patterns" covering 25%+ of the screen. https://gameaccessibilityguidelines.com/avoid-flickering-images-and-repetitive-patterns/
- Xbox XAG 117 covers visual distractions and motion settings, and suggests an opaque background behind text when there is unavoidable motion. https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/117
- Stardew's grass motion is restrained. Max shake is pi/8 rad (22.5 degrees), decaying by pi/350 per tick. The rate scales with collider speed `pi/80 / ((5+addedSpeed)/speed)`. Each tuft divides the rotation by (1 + random), so the 4 tufts in a tile never move in lockstep. Grass is static until touched, with no idle wind sway in this code. https://raw.githubusercontent.com/veywrn/StardewValley/master/StardewValley/TerrainFeatures/Grass.cs

### Inferences
- Stardew's choice, static until touched, is the quietest readable option. It keeps the screen calm and makes the player's path the only thing moving. For Asterion with many players it also tells you where others walked.
- If idle wind sway is used, keep it at a 1 px tip offset on at most about 30-50% of tufts, with phase from a hash so it never forms bands. Strong gusts should be rare travelling waves (Forest D2). That keeps the field under the "repeated moving pattern" threshold most of the time.
- Keep character outlines darker than the darkest grass shadow index. Reserve the yellow tip highlight so items and loot sparkle (Loot study) never share a hue with grass highlights.
- Reduce-motion mode means sway amplitude 0, ambient butterflies and fireflies off or static, season dither crossfade kept (it is slow), and trample bend kept but shortened. It is also the low-end performance mode for free.

---

## Q10. Few-frame animation vs shader

### Takeaway
At 320x180 a 2-4 frame hand-drawn tuft cycle or a whole-pixel offset of the top rows both read well. Stardew rotates sprites with a float angle at 4x scale, which smears pixels in a low-res pipeline. Snap to whole pixels (Forest D1 row offsets).

### Cited findings
- Stardew rotates each tuft around origin (7.5, 17.5), the base of the 15x20 sprite, by `shakeRotation/(1+rand)` radians at 4x scale. That is subpixel rotation, acceptable only because Stardew renders at a high resolution. https://raw.githubusercontent.com/veywrn/StardewValley/master/StardewValley/TerrainFeatures/Grass.cs
- A GDevelop dev tweens each blade "faster and further" depending on the pressed direction when the player collides. https://redlib.hbubli.cc/r/gdevelop/comments/1jovg4l/my_new_game_coming_to_steam

### Inferences
- In a 320x180 viewport with no supersampling, a 20 px tall tuft rotated by 22.5 degrees moves its tip about 7 px, and rotated pixels break the art. Use 3 baked lean frames instead (left 1 px, upright, right 1 px, plus a "flattened" frame for trampling), indexed by the same shake state machine Stardew uses.

---

## Sources
- Slynyrd Pixelblog 20: https://www.slynyrd.com/blog/2019/8/27/pixelblog-20-top-down-tiles
- Slynyrd Pixelblog 43: https://www.slynyrd.com/blog/2023/3/26/pixelblog-43-top-down-tiles-part-2
- Slynyrd Pixelblog 2: https://www.slynyrd.com/blog/2018/2/15/pixelblog-2-texture
- Saint11 tutorial location: https://medium.com/@saintjust/how-to-start-making-pixel-art-2d1e31a5ceab , https://itch.io/post/8580710/view-in-topic
- Stardew decompiled Grass.cs: https://raw.githubusercontent.com/veywrn/StardewValley/master/StardewValley/TerrainFeatures/Grass.cs
- Stardew wiki Grass (API): https://stardewvalleywiki.com/mediawiki/api.php?action=parse&page=Grass&prop=wikitext&format=json
- Stardew wiki Modding:Maps (API): https://stardewvalleywiki.com/mediawiki/api.php?action=parse&page=Modding:Maps&prop=wikitext&format=json
- Stardew winter recolour mod: https://www.nexusmods.com/stardewvalley/mods/20750
- Godot TileSets: https://docs.godotengine.org/en/stable/tutorials/2d/using_tilesets.html
- Godot terrain randomness: https://redlib.hbubli.cc/r/godot/comments/18yu4s2/can_you_randomize_tiles_when_using_autotiles , https://github.imc.re/godotengine/godot-proposals/discussions/10948
- Tiled terrains: https://tiled.readthedocs.io/manual/terrain/
- cr31 blob and Wang: https://boristhebrave.com/permanent/24/06/cr31/stagecast/wang/blob.html , https://boristhebrave.com/permanent/24/06/cr31/stagecast/wang/glossary.html
- Red Blob autotiling: https://www.redblobgames.com/articles/autotile/gemini/autotiling.html
- Godot shaders: https://godotshaders.com/shader/mix-2-tilemap-to-break-repetitive/ , https://godotshaders.com/shader/grass-soil-texture-tileable-texture-noise/
- Unity variation thread: https://discussions.unity.com/t/making-a-shader-that-creates-noise-like-color-variation-on-mesh-texture/685905
- Stochastic texturing: https://playerunknownproductions.net/news/stochastic-texturing
- Hue shift: https://pixelpaletteswap.pages.dev/guides/color-theory-for-pixel-art.html , https://medium.com/pixel-grimoire/how-to-start-making-pixel-art-6-a74f562a4056 , https://community.aseprite.org/t/designing-a-palatte-advice-needed/11637 , https://lospec.com/palette-list/tag/hue%20shift
- USGS NDVI: https://www.usgs.gov/special-topics/remote-sensing-phenology/science/ndvi-foundation-remote-sensing-phenology
- Grassland asymmetry: https://api.crossref.org/works/10.3390%2FRS11182107
- GCC vs NDVI: https://par.nsf.gov/servlets/purl/10053881
- PhenoCam tutorial: https://earthdatascience.org/notebooks/07-phenocam/phenocam-esa.html
- Hopkins law: https://www.britannica.com/science/phenology , https://pmc.ncbi.nlm.nih.gov/articles/PMC6426166 , https://pmc.ncbi.nlm.nih.gov/articles/PMC5798366
- Wet darkening: https://www.wgtn.ac.nz/scps/staff/pdf/darkerwhenwet.pdf , https://www.irishtimes.com/news/things-bright-and-beautiful-1.87052 , https://sites.bu.edu/cliveg/files/2025/04/02-Gao-Amazon-RSE-2025.pdf
- Pokémon seasons: https://m.bulbapedia.bulbagarden.net/wiki/Season_(mechanic) , https://nationaldex.io/guide/pokemon-black-white-black-2-white-2/seasons-guide
- Eastward reviews: https://entertainium.co/2021/10/15/eastward-review/ , https://www.gameinformer.com/review/eastward/eastward-review-pixel-paradise
- Chained Echoes reviews: https://entertainium.co/2022/12/13/chained-echoes-review/ , https://www.gamegrin.com/reviews/chained-echoes-review
- Sea of Stars: https://astrolabe.aidanmoher.com/astrolabe-feature-sea-of-stars-is/ , https://www.megavisions.net/the-art-of-sea-of-stars-a-sea-of-pixels/
- Itch comments: https://itch.io/post/8467540
- GDevelop blade tween: https://redlib.hbubli.cc/r/gdevelop/comments/1jovg4l/my_new_game_coming_to_steam
- Readability: https://www.sprite-ai.art/blog/pixel-art-backgrounds , https://pixeljoint.com/forum/printer_friendly_posts.asp?TID=24922
- Accessibility: https://gameaccessibilityguidelines.com/provide-an-option-to-turn-off-hide-background-movement/ , https://gameaccessibilityguidelines.com/avoid-flickering-images-and-repetitive-patterns/ , https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/117
