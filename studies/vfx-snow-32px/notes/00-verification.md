# Lead notes: decisions, conflicts and corrections (read before writing the report)

The notes are the record. Where a researcher's reply summary and their note disagree, the note wins.

## Decisions taken with the user (12 Nov 2026)
- Full study that reuses the VFX #1 Snow research. New research covers only what changes with size.
- Native canvas 640x360, 32x32 px tiles (20 x 11.25 on screen), characters about 24x32 px.
- Project: Asterion Online. Series VFX, number 11, id `vfx-snow-32px`, format `vfx-pixel`. The format doc now allows a 640x360 canvas for studies at 32 px tile scale.

## Conflicts between notes, and how the lead settled them
1. **Sink depth.** Note 11 (art) says cap sinking at 6 px when the head is half the sprite, 8 px when it is a third. Note 13 (characters) recommends bands of 0, 4, 8 and 12 px after Pokémon Platinum, which sinks a 32-unit sprite 12, 14 and 16 units on a 16-unit tile. Settled: the sandbox has a cap control with 0, 6 px (default) and 12 px ("deep snow, as in Pokémon Platinum"). The report presents both: 6 px for snow that builds up by weather, 12 px for authored deep-snow terrain.
2. **Flake size.** Note 11 proposes 1, 2 and 3 px flakes (inference from general art rules). Notes 10 and 14 read shipped code: RPG Maker VX Ace 6x6 px on 32 px tiles, MV 9x9 px on 48 px tiles, Stardew winter debris 12 px on 64 px tiles, all 0.1875 of a tile. Settled: the sandbox default is mixed 1 / 2 / 3 px by depth layer, with a "large" option that adds 6 px near flakes. The report states the 0.1875 rule as the shipped-code finding and the 1 to 3 px default as the author's taste, and says why (three depth layers with z height against one flat layer of big soft flakes).
3. **Flake count rule.** Note 14: RPG Maker kept the count at 90 when the tile grew 1.5 times, so count followed tiles, and peak coverage sits near 1% of screen pixels in VX Ace (1.27%), MV (0.89%) and the VFX #1 sandbox (1.03%). Use the 1% coverage rule for the sandbox (about 2,300 flake pixels at 640x360).
4. **Field resolution.** Note 12 measured that a 1:4 depth field with bilinear sampling and a 32x32 threshold tile has the same edge statistics as a 1:1 field (smooth test field only, the researcher's own straight-run metric). The same note infers that boot prints of 3x5 px need 1:2. The spec keeps 1:2 as the default and offers 1:1, 1:4 and, if the builder had time, a split mode (depth at 1:4, trail field at 1:2).

## Claims to treat with care
- Note 11 found no artist tutorial on snow tiles, roof snow or flake sizes. Its px values for edges, roof lips, prints and flakes are inferences from cited general rules (cluster size, dither limits, ramp steps). Tag them [I]. Gap note 17 looks for artist sources.
- Note 10: most of the wider teardown table is unsourced (Eastward, Sea of Stars, SNES games, Pokémon Gen 5). VX Ace numbers in note 10 are secondhand; note 14 read VX Ace's weather script, so prefer note 14 for VX Ace. Gap note 16 tries to fill the table.
- Note 12: no measured `ImageTexture.update()` timings exist in the notes. The browser benchmark (note 15) measures `texSubImage2D`, which is not the Godot call. Say so.
- Note 14: Godot `master` may have 2D SDF particle collision in the Compatibility particle shader, which would contradict VFX #1's "no particle collision on web". Untested by the researcher. Gap note 17 fact-checks it; until then tag [U].
- Note 14: the Pokémon Platinum weather mapping comes from unnamed functions and is the researcher's inference.
- Note 13: no shipped 2D game was found that places prints per foot from animation events. Emerald, Platinum and Tibia all place one mark per tile left. Per-foot boot prints on contact frames are this study's proposal [I], not a documented practice.
- No sourced game at this sprite size has per-pixel dynamic ground snow (note 10). That makes the VFX #1 field approach unusual at 32 px, and the report should say so plainly. Gap note 16 checks other genres.

## Corrections to VFX #1 found while scoping
- VFX #1's sandbox tiles are 8 px and its characters 7x12 px, a quarter of Asterion's 32 px scale. Pixel values quoted from VFX #1 (2x2 stamps every 4 px, 28 px upwind ray, 1 to 2 px flakes) need converting, and this study gives the converted values in tiles.

## Gap note 17 (art sources and fact-check), 12 Nov
Fact-check verdicts (details and sources in `17-gap-art-factcheck.md`):
- Godot 4.7.2 stable on 18 Aug 2026 and 4.8 beta 3 on 9 Nov 2026: confirmed.
- `DrawableTexture2D`: arrived in 4.7 (PR #105701, merged 30 Jan 2026), still experimental, RGBA formats only. Compatibility support is confirmed from the GLES3 source only. No doc statement and no browser test.
- Texture updates on Compatibility re-upload the whole image with `glTexImage2D`; no sub-rectangle update; proposal #13012 open: confirmed. Nuance: texture-array layers update through `glTexSubImage3D` (read on master only).
- 2D SDF particle collision in the GLES3 shader: CORRECTED. The code dates from Godot 4.0 (PR #68426), not from master. The 4.7 docs table still says "not supported", and open bug #112926 hides particles through 4.7.2. VFX #1's decision (no particle collision on web) stands, but its wording "no particle collision" should become "documented as not supported; code exists since 4.0 and is unreliable". Web behaviour untested.
- Measured `ImageTexture.update()` cost: none found anywhere. Tag every Godot upload time as an estimate.
- TileMapDual and jess::codes' dual-grid repo: both MIT. TileMapDual has no GitHub releases, so pin to tag v5.0.3.
- Pixel-perfect project setting names and values: confirmed.

Art sources:
- saint11's index (80 tutorials) and Slynyrd's (64 posts) have no snow or footprint lesson. The px values in note 11 stay inferences [I].
- Every commercial winter tileset reached is 16 px native. No pack has footprint tiles. Two packs ship ground snow as a transparent overlay autotile. Time Fantasy Winter has a half-way "SnowGrass" ground.
- No summer-to-winter mask blend was found in any shipped game or public shader. The tileset blend through a mask is this study's proposal [I].

## Gap note 16 (games), 12 Nov
- CORRECTION to the "Claims to treat with care" list above: a shipped 2D game that places prints per foot from animation frames does exist. Factorio (32 px per tile, 44x66 px character frame) stamps footprints of 15x11 px on run frames 5, 10, 16 and 21 of 22, offset 3.2 px to each side; they live 600 ticks plus a 125-tick fade. Aquilo snow tiles get none. So per-foot prints on contact frames are documented practice (Factorio), and the 3 px side offset in the sandbox agrees with Factorio's 3.2 px. Still true: Emerald, Platinum and Tibia place one mark per tile. Check the wording in note 16 before quoting; note 13 was written before this was found.
- RimWorld is the closest shipped model to a coarse dynamic snow field: one float 0 to 1 per cell, drawn as 9 alpha vertices per cell, a tick visits 0.06% of cells, a mesh redraws only when a cell changes by more than 0.15, footprints every 0.632 cell on alternating feet only at depth 0.4 or more, lasting 4.88 s. Use it as the main precedent for "coarse field, smooth draw".
- Project Zomboid: one global snow fraction against a fixed 256x256 noise grid, 44 autotile pieces, 5 s cross-fade. Don't Starve Together: one global synced snow level that fills in 300 s; object snow caps at level 0.015.
- Breath has shipped precedents (RimWorld, Don't Starve Together). Snow settling on a hat or shoulders has none found: tag [I].
- Still not found after two rounds: per-pixel dynamic snow in any tile game (only Noita, as a falling-sand material), a single-walker trench width, any official Tibia weather effect, and sourced numbers for Eastward, Sea of Stars, Chained Echoes, Graveyard Keeper, Moonlighter, Kynseed, Graal, Chrono Trigger, Secret of Mana, Necesse, Pokémon Gen 5 and HeartGold. List these in §12 as not found. Do not fill them from memory.
