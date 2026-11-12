# 12. Gaps: other MMOs, biome rules, desire paths, see-it-in-action links

Researcher 12 (gap filler). Scope is limited to what notes 01-10 did not cover. Note 01 Q6 left UO, OSRS and Graal open. Note 03 Q2 left Banished, Ostriv, Farthest Frontier and Planet Coaster open. Note 08 Q7 has an uncited biome table. About 33 tool calls.

Headline: the best primary source here is the 117 HD plugin for OSRS. It is open source, ships wind and character displacement for grass, and exposes both as separate on/off toggles. ClassicUO has a one-flag "hide vegetation" filter driven by a plain text list of tile ids. Those two give Asterion a cheap low-end setting design.

---

## Q1. How do other MMOs handle grass, and what toggles do low-end players get?

### Takeaway
Old 2D/2.5D MMOs draw grass as static ground tiles plus static decoration objects. The low-end answer is always the same, a client toggle that skips drawing the decoration layer. Animation, where it exists, is a client mod (117 HD), and it is also split into its own toggles. No MMO in this pass syncs grass sway or trampling over the network.

### Cited findings

**Old School RuneScape and the 117 HD plugin (open source, BSD-2)**
- 117 HD has two separate config toggles in its "environment" section. "Wind displacement" makes "grass and leaves" respond to wind. "Character displacement" lets "players & NPCs affect things like grass". Both default to on. https://github.com/117HD/RLHD/blob/master/src/main/java/rs117/hd/HdPluginConfig.java (lines 980-1000)
- Per-model wind modes are an enum with six values: DISABLED, OBJECT, OBJECT_NO_GROUND_DISPLACEMENT, VERTEX, VERTEX_WITH_HEMISPHERE_BLEND, VERTEX_JIGGLE. Artists tag each model override with one. https://github.com/117HD/RLHD/blob/master/src/main/java/rs117/hd/scene/model_overrides/WindDisplacement.java
- Wind sample per object (compute shader). One noise lookup at the model's world position plus a scrolling offset. The noise value also rotates the global wind direction by up to 90 degrees, so neighbours lean slightly differently. Strength scales with height, `saturate((y + height) / windCeiling) * windStrength`. https://github.com/117HD/RLHD/blob/master/src/main/resources/rs117/hd/comp.glsl (lines 64-77)
- Noise frequency is `WIND_DISPLACEMENT_NOISE_RESOLUTION = 0.04` per world unit. The scroll is `windOffset += deltaTime * windSpeed`. https://github.com/117HD/RLHD/blob/master/src/main/java/rs117/hd/HdPlugin.java (lines 202, 2199)
- Default environment wind is `windAngle 0, windSpeed 15, windStrength 0, windCeiling 1280`. Values blend between areas with `mix(from, to, t)`. https://github.com/117HD/RLHD/blob/master/src/main/java/rs117/hd/scene/environments/Environment.java (lines 91-94, 215-218)
- Shipped per-area values in `environments.json`. windSpeed mostly 15 (24 areas) or 10 (11 areas), range 3 to 22.5. windStrength 10 to 35, often 20, 26 or 30. windAngle 40 in 34 areas. windCeiling overrides 400 or 750. https://github.com/117HD/RLHD/blob/master/src/main/resources/rs117/hd/scene/environments.json
- Per-material stiffness is a 3-bit flag that picks a multiplier from `{0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0}`. https://github.com/117HD/RLHD/blob/master/src/main/resources/rs117/hd/priority_render.glsl (`getModelWindDisplacementMod`)
- Character push. Each vertex loops over up to `MAX_CHARACTER_POSITION_COUNT = 50` characters, each a (x, y, radius) triple in a uniform buffer. Falloff is `f = 1 - dist/radius`, then `f*f`. Grass bends sideways at the rim and gets pushed down near the centre (`mix(horizontal, vertical, f)`). https://github.com/117HD/RLHD/blob/master/src/main/resources/rs117/hd/priority_render.glsl (`applyCharacterDisplacement`), https://github.com/117HD/RLHD/blob/master/src/main/java/rs117/hd/opengl/uniforms/UBOCompute.java (line 13)
- Vanilla RuneScape has a "Ground decoration: On/Off" option. The official support page describes a toggle for small ground details "like stones and long grass". https://runescape.fandom.com/wiki/Options , https://support.runescape.com/hc/en-gb/articles/207223015
- A community RuneLite plugin, "Automatic Low Detail", turns ground decorations off inside chosen areas such as raids. https://github.com/bepzi/runelite-plugins

**Ultima Online and ClassicUO (open source)**
- ClassicUO has a `HideVegetation` profile option. The renderer skips any static or multi whose graphic carries the vegetation flag. https://github.com/ClassicUO/ClassicUO/blob/main/src/ClassicUO.Client/Game/Scenes/GameSceneDrawingSorting.cs (around lines 969-1014)
- The vegetation set is a user-editable `vegetation.txt`. On first run the client writes a default list of grass, fern and plant static ids, mostly in the ranges 0x0C37-0x0D42 and 0x12C2-0x12C7. Players can add ids. https://github.com/ClassicUO/ClassicUO/blob/main/src/ClassicUO.Client/Game/Data/StaticFilters.cs
- The ClassicUO wiki says in-client static toggles replace older "tree hacks" that patched .mul files and could corrupt them. https://github.com/ClassicUO/ClassicUO/wiki/Toggle-Static-Objects

**Wakfu**
- Wakfu ties flora to an ecology system. Planting raises a player's Wakfu alignment and cutting plants or hunting raises Stasis. Clan masters in each zone state what the ecosystem should hold, and sell seeds and cuttings for replanting. https://tvtropes.org/pmwiki/pmwiki.php/Videogame/Wakfu , https://methodwakfu.com/metiers/sources-de-wakfu-et-stasis (French)
- One faction, the Riktus clan, was built as a criminal faction rewarded for wrecking other nations' ecosystems. https://Www.wikipedia.org/wiki/Wakfu

**Albion Online, Graal, Lineage II, Mabinogi, Dofus**
- Nothing citable on grass rendering, cut bushes or toggles was found. One performance article notes Albion's foliage has a real cost, without naming a setting. https://evezone.evetech.co.za/performance-pulse/fable-optimized-settings-foliage-shadows

### Inferences
- Copy the 117 HD split for Asterion. Three independent client settings: "Draw grass decoration", "Grass wind", "Grass reacts to walkers". Each one turns off a separate cost.
- The 117 HD per-object wind (one noise sample per object, not per vertex) maps directly to a 2D tuft. One sample per tuft at the tuft root, quantised to whole pixels.
- The 50-character uniform cap is a useful sanity bound. A 2D shader loop over 16-32 nearby walkers is cheap enough. Beyond that, switch to note 03's interaction map.
- A ClassicUO-style id list is better than a per-item flag in the item database. Players and modders can edit it, and the server never needs to know.
- Wakfu shows grass and plants can be a social system in an MMO. That is game design, not VFX, so it stays a footnote here.

### Gaps
- No measured ms or fps numbers for 117 HD wind on or off.
- Graal bush respawn rules, Albion grass settings, Lineage II and Mabinogi grass not found.

---

## Q2. Biome grass rules. Is there a published rule for density and colour by moisture and temperature?

### Takeaway
Yes, Minecraft's grass colormap is the standard shipped rule. Colour is a 2D lookup on (temperature, downfall) inside a triangle. It is cheap and transfers directly to a palette-ramp choice per tile. Note 08 Q7 already has the per-biome art table. This adds the rule behind it.

### Cited findings
- Minecraft Java picks grass colour from a 256x256 `grass.png` colormap indexed by biome temperature and downfall. Both are clamped to 0-1. Downfall is multiplied by temperature, which keeps the sample in the lower-left triangle. Cold or dry means bottom-right. https://breezewiki.discard.no/minecraft/wiki/Color , https://optifine.readthedocs.io/colormaps.html
- The same colormap tints grass blocks, short grass, tall grass and ferns. A biome can override it with a fixed `grass_color` hex. https://minecraft.wiki/w/Custom_biomes
- Mojira notes Java and Bedrock use different temperature and downfall values for some biomes, so grass colour differs between editions. https://mojira.dev/MC-233528
- MCPatcher and OptiFine allow per-block custom colormaps, including grid formats keyed by biome id instead of the triangle. https://bitbucket.org/prupe/mcpatcher/wiki/Biome_Palettes_(Grid)

### Inferences (for a 32x32 tile, palette-limited game)
- Store two bytes per region or chunk, temperature and moisture. Use them to pick one of maybe 6-8 grass ramps from a small 2D table, rather than tinting per pixel. That keeps palette discipline.
- Drive tuft density from the same moisture value. More moisture means more tufts per tile and taller silhouettes. Low moisture shows more ground between tufts, which matches the NDVI point in note 08.
- Swamp reeds and cattails go by distance to water, not by biome alone. Place them in the 1-2 tiles next to shore tiles.

### Gaps
- No pixel-art game published its biome density rules with numbers. Stardew's 6 grass types (note 08) are the closest shipped example.

---

## Q3. Desire paths and wear: more shipped mechanics and Helbing's model

### Takeaway
Shipped city builders other than Foundation did not turn up a desire-path mechanic. Farthest Frontier has player-built roads, and its site says "well-tread" routes make travel faster, but the cited text does not show grass wearing on its own. The Helbing model has a clean update equation that can drive a per-tile wear grid directly.

### Cited findings
- Helbing, Keltsch and Molnár ground-structure update: `dG/dt = (G0 - G)/T + I * (1 - G/Gmax) * sum(delta(r - r_walker))`. T is durability, so trails decay back toward natural ground at rate 1/T. I is footprint intensity. Gmax saturates wear. https://ar5iv.labs.arxiv.org/html/cond-mat/9805158
- Trail attraction is `Vtr(r) = integral exp(-|r' - r|/sigma) * G(r') d2r'`, with sigma as walker visibility. A walker's heading is the normalised sum of the destination direction and the gradient of Vtr. https://ar5iv.labs.arxiv.org/html/cond-mat/9805158
- Only two dimensionless parameters matter, `kappa = I*T/sigma^2` and `lambda = V0*T/sigma`. Large kappa gives a minimal shared network. Small kappa gives direct paths. The paper gives no numeric parameter values. https://ar5iv.labs.arxiv.org/html/cond-mat/9805158
- A Physics 466 class report implements the model and lists its inputs as terrain regeneration rate, footstep intensity and visibility. https://courses.physics.illinois.edu/phys466/sp2013/projects/2013/Team1.report.pdf
- Farthest Frontier roads are built by the player. https://farthestfrontier.com/?p=1201 , https://segmentnext.com/farthest-frontier-roads/
- MineColonies "Safepaths" mod makes paths form from repeated colonist walking. https://www.curseforge.com/minecraft/mc-mods/safepaths

### Inferences
- For a server-authoritative tile grid, run the Helbing update per tile on a slow tick, for example once a minute. Keep G as one byte per tile. Add I per step, scaled by `(1 - G/255)`. Decay by `(G - G0)/T`. Map G to 3-4 visual stages with thresholds. This is the same shape as note 03's step counter, with saturation and continuous decay added.
- Players walk where they want, so the trail-attraction half of the model is only useful for NPCs. Give NPC pathfinding a small cost discount on high-G tiles and paths will merge, which is the kappa effect.
- Pick T so an unused path fades in 1-3 real days, matching the Minecraft mods in note 03 (estimate).

### Gaps
- Banished, Ostriv, Planet Coaster/Zoo, RimWorld and Kenshi path-wear constants not found. I found no evidence that Banished, Ostriv or RimWorld wear grass from walking at all.

---

## Q4. See it in action (game examples with links)

Each line has one URL and what to watch. "Opened" means a search result confirmed the page and its topic. Pages from earlier notes are marked with the note number.

| # | Game | URL | What to watch |
|---|---|---|---|
| 1 | Old School RuneScape + 117 HD | https://github.com/117HD/RLHD | Grass leaning with wind and parting around players; the source is open (opened) |
| 2 | Ultima Online (ClassicUO) | https://github.com/ClassicUO/ClassicUO/wiki/Toggle-Static-Objects | Static toggles that remove trees and vegetation for clarity (opened) |
| 3 | Tunic | https://medium.com/grim-pros/roojack-how-we-implement-tunic-tilt-grass-359dfd4b7729 | Grass tilts away from the fox by quadrant around each tuft (opened) |
| 4 | Ghost of Tsushima | https://gdcvault.com/play/1027214/Advanced-Graphics-Summit-Procedural-Grass | Fields bending in waves under one global wind (note 02) |
| 5 | Ghost of Tsushima | https://gamedeveloper.com/design/using-vorticles-to-simulate-wind-in-i-ghost-of-tsushima-i- | Wind as the guide; vorticles stir local gusts (note 02) |
| 6 | Eastward | https://entertainium.co/2021/10/15/eastward-review/ | Grass sways as John and Sam pass (note 08) |
| 7 | Chained Echoes | https://entertainium.co/2022/12/13/chained-echoes-review/ | Dense, colourful 16-bit fields that feel alive (note 08) |
| 8 | Sea of Stars | https://www.megavisions.net/the-art-of-sea-of-stars-a-sea-of-pixels/ | Many small ambient animations instead of palette swaps (note 08) |
| 9 | Octopath Traveler | https://www.unrealengine.com/spotlights/octopath-traveler-s-hd-2d-art-style-and-story-make-for-a-jrpg-dream-come-true | Pixel sprites in 3D dioramas; foliage depth and blur (opened) |
| 10 | Octopath Traveler II | https://www.unrealengine.com/developer-interviews/octopath-traveler-ii-builds-a-bigger-bolder-world-in-its-stunning-hd-2d-style | Larger HD-2D outdoor scenes (opened) |
| 11 | Hyper Light Drifter | https://blog.playstation.com/2014/03/14/creating-the-world-of-hyper-light-drifter-on-ps4-and-ps-vita/comment-page-1 | Limited-palette overgrown ruins, grass cut by sword (opened, no grass detail in text) |
| 12 | Alba: A Wildlife Adventure | https://filmstories.co.uk/features/how-we-made-alba-a-wildlife-adventure/ | How early creatures looked "a bit robotic" and were fixed (opened) |
| 13 | Owlboy | https://gamedeveloper.com/art/using-graphics-to-express-character-and-theme-in-i-owlboy-i- | Places shown as growing or collapsing through art (opened) |
| 14 | Breath of the Wild | https://www.engadget.com/2017/03/12/breath-of-the-wild-gdc-talk/ | Wind as a "chemistry" element that pushes objects (opened) |
| 15 | Rain World | https://rwmodding.github.io/api/Global.InsectCoordinator.html | Cosmetic insects spawned per room by a coordinator (note 05) |
| 16 | Stardew Valley | https://stardewvalleywiki.com/mediawiki/api.php?action=parse&page=Grass&prop=wikitext&format=json | Grass types, scythe cutting, hay drops, speed penalty (note 03) |
| 17 | Minecraft | https://minecraft.wiki/w/Custom_biomes | Grass colour changing across biomes from temperature and downfall (opened) |
| 18 | Foundation | https://www.pcgamer.com/you-dont-have-to-place-roads-in-this-medieval-city-builder-thanks-to-your-citizens-feet | Paths worn into grass by villager traffic (note 03) |
| 19 | Double Dream (NES homebrew) | https://mag1dev.itch.io/double-dream/devlog/873955/realistic-grass-animation-on-the-nes | Grass animation inside NES limits (opened, title only) |
| 20 | EverEnding | https://www.patreon.com/ProblemMachine/posts/everending-2020-42383764 | Devlog on grass particles and their per-blade cost (opened) |
| 21 | Crystal Realms | https://itch.io/devlog/730342/weekly-devlog-7-implementing-frogs-and-butterflies.amp | Adding frogs and butterflies as first ambient flyers (opened) |
| 22 | Pushing Daisies | https://m0ssybun.itch.io/pushing-daisies/devlog/702876/pushing-daisies-devlog-3 | Monarch butterfly sprite sheet for a pixel insect game (opened) |
| 23 | Playdate grass | https://devforum.play.date/t/animating-grass-with-perlin-noise/16203 | Perlin-noise grass on a 1-bit handheld, a low-power reference (opened) |
| 24 | Cornucopia (Unity, not pixel) | https://discussions.unity.com/t/cornucopia-raw-dev-log-1-gpu-instancing-or-how-2-583-plants-became-3-draw-calls/1715462/1 | 2,583 plants drawn in 3 draw calls; root vertices weighted 0 so they never move (opened) |

### Gaps
- No primary page with grass or insect specifics found for Okami, Ori, Spiritfarer, Kynseed, Moonlighter, CrossCode, Animal Crossing, Unrailed or Dredge. Video pages were not searched.
- Items 9-14 are art and design pages. They show the games but do not explain the grass.

---

## Sources
- 117 HD config: https://github.com/117HD/RLHD/blob/master/src/main/java/rs117/hd/HdPluginConfig.java
- 117 HD wind enum: https://github.com/117HD/RLHD/blob/master/src/main/java/rs117/hd/scene/model_overrides/WindDisplacement.java
- 117 HD compute wind: https://github.com/117HD/RLHD/blob/master/src/main/resources/rs117/hd/comp.glsl
- 117 HD vertex wind and character push: https://github.com/117HD/RLHD/blob/master/src/main/resources/rs117/hd/priority_render.glsl
- 117 HD plugin constants: https://github.com/117HD/RLHD/blob/master/src/main/java/rs117/hd/HdPlugin.java
- 117 HD environment defaults: https://github.com/117HD/RLHD/blob/master/src/main/java/rs117/hd/scene/environments/Environment.java
- 117 HD per-area values: https://github.com/117HD/RLHD/blob/master/src/main/resources/rs117/hd/scene/environments.json
- 117 HD character cap: https://github.com/117HD/RLHD/blob/master/src/main/java/rs117/hd/opengl/uniforms/UBOCompute.java
- RuneScape options: https://runescape.fandom.com/wiki/Options , https://support.runescape.com/hc/en-gb/articles/207223015
- Automatic Low Detail plugin: https://github.com/bepzi/runelite-plugins
- ClassicUO filters: https://github.com/ClassicUO/ClassicUO/blob/main/src/ClassicUO.Client/Game/Data/StaticFilters.cs
- ClassicUO renderer: https://github.com/ClassicUO/ClassicUO/blob/main/src/ClassicUO.Client/Game/Scenes/GameSceneDrawingSorting.cs
- ClassicUO wiki: https://github.com/ClassicUO/ClassicUO/wiki/Toggle-Static-Objects
- Wakfu: https://tvtropes.org/pmwiki/pmwiki.php/Videogame/Wakfu , https://methodwakfu.com/metiers/sources-de-wakfu-et-stasis , https://Www.wikipedia.org/wiki/Wakfu
- Albion foliage cost: https://evezone.evetech.co.za/performance-pulse/fable-optimized-settings-foliage-shadows
- Minecraft colour: https://breezewiki.discard.no/minecraft/wiki/Color , https://optifine.readthedocs.io/colormaps.html , https://minecraft.wiki/w/Custom_biomes , https://mojira.dev/MC-233528 , https://bitbucket.org/prupe/mcpatcher/wiki/Biome_Palettes_(Grid)
- Helbing trail model: https://ar5iv.labs.arxiv.org/html/cond-mat/9805158 , https://courses.physics.illinois.edu/phys466/sp2013/projects/2013/Team1.report.pdf , https://arxiv.org/abs/cond-mat/9805074
- Farthest Frontier: https://farthestfrontier.com/?p=1201 , https://segmentnext.com/farthest-frontier-roads/
- Safepaths: https://www.curseforge.com/minecraft/mc-mods/safepaths
- See-it links: table in Q4.
