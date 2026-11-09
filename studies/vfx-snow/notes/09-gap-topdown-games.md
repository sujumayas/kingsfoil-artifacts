# 09 - Gap fill: more real game examples of snow (top-down / 2D / pixel)

Researcher brief: add game examples beyond Pokémon, RimWorld, Tibia, Stardew, Slime Rancher 2, CoH2, The Long Dark, Celeste, A Short Hike, OpenTTD.
Tool budget: about 28 calls. Several wikis were blocked or returned an error: minecraft.wiki, pzwiki.net, nookipedia (allowlist), kleiforums (robots), giantbomb (client error), breezewiki CrossCode (Anubis "Access denied"). Search returned only links, no snippets, so a claim below is "confirmed" only if I fetched the page.

Legend: **[C]** = confirmed from a fetched page. **[U]** = from memory or a search-result title only, not verified. Treat [U] as a lead, not a fact.

---

## Q1. Which games give confirmed, citable snow behaviour?

### Takeaway
- Very few 2D or top-down games document snow *behaviour* (gradual build-up, prints, melt) in their wikis. Most treat winter as an **instant palette or tile swap** plus falling particles.
- The richest top-down example found is the **Project Zomboid "Immersive Snow" mod (v42)**. It shows what players want: prints, trodden paths, tire ruts, snow on cars melted by engine heat, fires melting snow into wet patches, and wind drift.
- **Dwarf Fortress** and **Don't Starve** confirm *gradual* coverage of ground and objects. Neither wiki gives rates.

### Per-game table (confirmed details)

| # | Game (view) | Gradual or instant | Footprints / trails | Shelter | Melt / thaw | Gameplay effects | Implementation notes | Ref |
|---|---|---|---|---|---|---|---|---|
| 1 | **Don't Starve / Don't Starve Together** (top-down-ish 2.5D, hand-drawn) | [C] Snow "builds up on trees and many other objects". It adds a layer on objects such as Trees and the Science Machine, and turf turns snowy so roads and paths are hard to see. The wiki gives no rate. | [C] Not mentioned | [C] Not mentioned | [C] Melts when the season changes to Summer **or when it rains during Winter** | [C] Snow slightly lowers body temperature. Snow is "basically winter rain" (same precipitation system). Winter lasts 16 days (DS) / 15 (DST). The first day of winter has a bluish tint before snow starts. | [C] DST API docs: `world_state.precipitation` 0.0-1.0 ("snow intensity"), plus `issnowing` and `iswinter`. Snow is the rain system with a different skin. [U] There is a separate snow-level value that drives the ground overlay. The fetched docs page did not contain it. | https://dontstarve.wiki.gg/wiki/Winter ; https://dontstarve.wiki.gg/ja/wiki/Snow ; https://vietnd69.github.io/dst-api-webdocs/docs/api-vanilla/core/worldstate |
| 2 | **Project Zomboid** (isometric pixel-ish) | [C] Vanilla: Build 40 shipped fog, mist, storms and an "improved snow effect". The blog bullet list is missing, so there are no specifics. | [C] Mod "Immersive Snow" (v42): players, zombies and animals leave boot, barefoot, hoof or paw prints. **Repeated traffic forms trodden paths that fade over time or get covered by heavy snowfall.** Each wheel leaves ruts with tread. Driving from snow onto asphalt leaves fading white tread marks. Blood leaves red prints. | [C] (mod) Snow on characters melts **indoors or near heat** | [C] (mod) Engine heat melts snow on cars. High speed blows it off. **Fires melt nearby snow into wet patches.** | [C] (mod) Snow wets clothing like rain. Players can shake snow off before entering buildings. Frost forms on glass and can be scraped. Wind drifts snow along the ground. | [C] (mod) Settings for print lifetime, accumulation speed, melt rate and visual intensity. A **low-end mode** for integrated GPUs. 14.6 MB, version 23.10.2026. | https://projectzomboid.com/blog/?p=6892 ; https://top-mods.com/mods/project-zomboid/gameplay/16435-immersive-snow.html ; related mod WinterFX: https://top-mods.com/mods/project-zomboid/gameplay/16738-winterfx.html |
| 3 | **Dwarf Fortress** (top-down ASCII/tiles) | [C] "Ground, trees and other surfaces will gradually become covered in snow" | [C] Not mentioned | [C] Not mentioned | [C] **Magma beneath snow-covered ground melts the snow** (it does not become water). Ice melts back into ponds after winter. Ice walls thaw into 7/7 water, ice floors restore the original depth. Water at least 4/7 deep freezes into ice walls, shallower water into floors. | [C] Dwarves caught in a snowstorm get unhappy thoughts and can freeze to death. Freezing ice kills anything inside it instantly. | [C] Snow falls in winter in temperate biomes and at any time in tundra or glacier biomes. No depth values given. | https://dwarffortresswiki.org/index.php/Snow |
| 4 | **Animal Crossing: City Folk / New Leaf** (near top-down 3D) | n/a | [C] **Grass wear** ("kemono michi", animal trails): walking wears paths into grass and running wears it most. Grass is **most vulnerable in winter** and regrows over time. Not present in New Horizons. | - | [C] Regrowth = recovery | Aesthetic only | A per-tile wear counter that slowly recovers is a direct analogue for "trodden snow paths fill back in". | https://animalcrossing.fandom.com/wiki/Animal_Tracks |
| 5 | **Animal Crossing: New Horizons** | [U] Snow appears on a fixed calendar date (northern hemisphere 25 Nov to 24 Feb), probably as an instant seasonal swap | [U] Prints in snow and sand. A TheGamer article title says "footprints change by species". | - | [U] Snow disappears on a fixed date | Snowboys / snowflakes | Not verified | https://www.thegamer.com/animal-crossing-new-horizons-footprints-change-by-species/ ; https://animalcrossingworld.com/2020/11/winter-snowfall-season-begins-today-in-animal-crossing-new-horizons-northern-hemisphere/ |
| 6 | **Kingdom Two Crowns** (2D side-view pixel) | [C] "Snow starts falling on the ground" as winter arrives. The source gives no accumulation detail. | - | - | - | [C] Farms cannot harvest, so Farmers forage instead. Small animals hibernate and a tougher animal appears deep in the forest. Greed raids at night. | - | https://www.kingdomthegame.com/news/2019/3/26/citizens-more-active-during-winter-in-kingdom-two-crowns |
| 7 | **Snowy Trails** (72-h jam game, top-down screens) | n/a | [C] **Footprints as the core mechanic.** The player leaves prints only on snow. Entering a sparkle "unsticks" the current screen's prints and carries them to the next screen, where they become spikes. Prints persist when backtracking. | - | - | Puzzle: the player creates their own obstacles | No implementation details published | https://matojeje.itch.io/snowy-trails/devlog/670340/about-the-game-mechanics |
| 8 | **Frostpunk** (3D city builder, top-down camera) | [C] The ground snow is a **single giant "snow cover" mesh** that drapes over rocks and cliffs and links them to the terrain template (UVs prioritised by near or far view). | - | Heat zones (gameplay) | [U] Snow visibly clears around the Generator and buildings. Not confirmed from a fetched page. | [C] Heat-level arithmetic: -1 level per 10 °C below -20 °C, +1 for insulation, +1 for a Lvl-1 Generator zone. Six bands from Comfortable (0 °C+) to Freezing (-41 °C or below). Illness 0 / 3 / 15 % for the top three bands. | [C] RizomUV saved at least 2 weeks of UV work (vendor/studio claim) | https://11bitstudios.com/frostpunk_rizomuv/ ; https://frostpunk.fandom.com/wiki/Heat_level |
| 9 | **Octopath Traveler** (HD-2D: pixel sprites in 3D) | - | - | - | - | - | [C] Praised for falling snow that "glistens and glitters", a luminescent quality | https://www.thegamer.com/most-impressive-snow-physics-mechanics-in-games/ |
| 10 | **Final Fantasy VI** (16-bit) | - | - | - | - | - | [C] Opening Magitek-armor flurries called the best snow effect of the 16-bit era | same TheGamer URL |

### 3D reference points praised by players and press (useful for the "how it feels" sections)
From TheGamer's "Best Looking Snow In Video Games" (fetched) [C]:
- **Red Dead Redemption 2**: knee-high snow. Walked paths "seem to collapse on themselves". **Animal tracks can be identified from prints** (tracking gameplay). Ranked #1.
- **Horizon Zero Dawn: Frozen Wilds**: trails through fluffy snow, drifts, haze, **snow falling off trees**.
- **1080 Avalanche** (N64): snow deforms under the board, and **snow cakes on the character's clothing** during a run.
- **Bloodborne**: snow "clings to statues and objects" (accumulation on props; the article credits the art, not the tech).
- **Days Gone**: blood pools into and soaks the snow. Gripe: snow does not affect motorcycle handling.
- **Lost Planet**: kicked-up snow becomes a blizzard haze. **TLOU2**: whiteout that cuts visibility to a few metres.
- No game on the list was praised for **melting**, a gap in the industry that indie games could fill.
URL: https://www.thegamer.com/most-impressive-snow-physics-mechanics-in-games/

### Inferences (mine)
- The three behaviours people praise most are: (a) **trails that fill back in** (RDR2 "collapse", PZ mod "fade or get covered by heavy snowfall", AC grass regrowth); (b) **snow on props and characters** (Bloodborne, 1080, PZ mod); (c) **readable tracks as gameplay** (RDR2 animal tracks, Snowy Trails puzzle). All three map cleanly onto a per-tile scalar grid (depth plus a "trodden" value) with slow relaxation, which is cheap in a 2D tile game.
- **Heat sources as melt seeds** recur: PZ mod (fires, engines, indoors), DF (magma), Frostpunk (generator heat zones), DST (rain melts snow). A cheap model: melt rate per tile = f(distance to heat source) + sun term. This reads well and gives gameplay (warm zones).
- DST treating snow as "rain with a different skin" (same precipitation 0-1 value) is a useful architecture lesson: one weather intensity scalar drives both the particles and the ground-cover alpha.
- AC's worn-grass counter is the best low-cost "trail" design reference for a Tibia-like MMO. It is per-tile state with slow regeneration, so it is server-friendly.

## Q2. Candidates I could not verify (leads, all [U])
| Game | What I believe (unverified) | Lead URL |
|---|---|---|
| Minecraft (voxel, not 2D) | Snow layers in 1/8 block steps accumulate during snowfall via random ticks. The cap is set by the `snowAccumulationHeight` gamerule (added around 1.19.3, default 1). Snow does not form under blocks and melts at block light 12 or above. **Wiki blocked, verify.** | (minecraft.wiki blocked) |
| Hyper Light Drifter | Snowy north region. Possibly footprints. No page found. | https://tvtropes.org/pmwiki/pmwiki.php/VideoGame/HyperlightDrifter |
| CrossCode (Bergen) | Snow area with ice puzzles. Footprints unknown. The wiki mirror was blocked. | https://crosscode.gamepedia.com/File:Bergen_Village.png |
| Songs of Syx, Banished, Farthest Frontier | Seasonal ground snow cover that blends in and out gradually | not searched (budget) |
| Terraria | Snow biome is static tiles, plus "Blizzard" falling-snow weather. No accumulation. | not fetched |
| Undertale / Deltarune (Snowdin) | Static snow tiles, no dynamics | not fetched |
| Feet in the Snow (itch, abstract-machine) | A game built around walking in snow. Comments pages only. | https://abstract-machine.itch.io/feet-in-the-snow/comments?after=40 |
| DST snow on structures (bug thread) | Some builds had "no snow layer during winter", which suggests a per-prefab snow-cover overlay sprite | https://forums.kleientertainment.com/klei-bug-tracker/dont-starve-together/cawnival-builds-have-no-snow-layer-during-winter-r35434/ |

## Gaps (honest)
- I reached only about 10 games with confirmed, fetched details, short of the target of 12 or more. RDR2, Horizon, 1080 and Bloodborne are confirmed but they are 3D.
- No confirmed rates (cm/hour, seconds per stage) for any 2D game. DST and DF wikis say "gradually" without numbers.
- Frostpunk's melt-around-heat visual is not confirmed from a fetched source. A devlog or GDC talk should be checked.
- Vanilla Project Zomboid snow ground cover (gradual vs instant, footprints) is unverified because pzwiki is blocked. The mod page implies vanilla lacks prints.
- Animal Crossing New Horizons prints are known only from an article title.

## Sources
- Don't Starve wiki, Winter: https://dontstarve.wiki.gg/wiki/Winter
- Don't Starve wiki (JA), Snow: https://dontstarve.wiki.gg/ja/wiki/Snow
- DST API docs, worldstate: https://vietnd69.github.io/dst-api-webdocs/docs/api-vanilla/core/worldstate
- DST bug: snow layer missing: https://forums.kleientertainment.com/klei-bug-tracker/dont-starve-together/cawnival-builds-have-no-snow-layer-during-winter-r35434/
- Project Zomboid blog (Build 40 weather): https://projectzomboid.com/blog/?p=6892
- PZ Immersive Snow mod: https://top-mods.com/mods/project-zomboid/gameplay/16435-immersive-snow.html
- PZ WinterFX mod: https://top-mods.com/mods/project-zomboid/gameplay/16738-winterfx.html
- Dwarf Fortress wiki, Snow: https://dwarffortresswiki.org/index.php/Snow
- Animal Crossing wiki, Animal Tracks (grass wear): https://animalcrossing.fandom.com/wiki/Animal_Tracks
- ACNH footprints by species (title only): https://www.thegamer.com/animal-crossing-new-horizons-footprints-change-by-species/
- ACNH snowfall season: https://animalcrossingworld.com/2020/11/winter-snowfall-season-begins-today-in-animal-crossing-new-horizons-northern-hemisphere/
- Kingdom Two Crowns winter: https://www.kingdomthegame.com/news/2019/3/26/citizens-more-active-during-winter-in-kingdom-two-crowns
- Snowy Trails devlog: https://matojeje.itch.io/snowy-trails/devlog/670340/about-the-game-mechanics
- 11 bit studios, Frostpunk RizomUV (snow cover mesh): https://11bitstudios.com/frostpunk_rizomuv/
- Frostpunk wiki, Heat level: https://frostpunk.fandom.com/wiki/Heat_level
- TheGamer, Best Looking Snow in Video Games: https://www.thegamer.com/most-impressive-snow-physics-mechanics-in-games/
