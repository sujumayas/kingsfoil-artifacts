# 18. Fact-check of notes 10 to 15, and art gaps

Researcher 18, 13 Nov 2026. All source files were downloaded fresh today into `scratch-18/src/` (and `scratch-18/dl/` for `appearances.dat`). Simulations written from scratch are `scratch-18/doom18.js` and `scratch-18/front18.js`.

Labels. [C] cited from source I read today. [M] measured by my own run. [I] my inference. [U] unverified.

## Part A. Fact-check

### Summary table

| # | Claim (note) | Verdict | Source line read |
|---|---|---|---|
| 1a | `EFFECT_TICKS_PER_FRAME = 75`, missile `TICKS_PER_FRAME = 75` (14) | CONFIRMED | edubart `effect.h:34`, `missile.h:34` |
| 1b | Effect removed after `75 x phases` ms, client id 33 gets `<<= 2` (14) | CONFIRMED | edubart `effect.cpp:68-80`; mehah `effect.cpp:117-131` (uses `getTotalDuration()` when the dat has per-phase durations, line 112) |
| 1c | Missile `150 * sqrt(distance)` ms (14) | CONFIRMED | edubart `missile.cpp:75` `m_duration = 150 * std::sqrt(m_delta.length())`; mehah `missile.cpp:81` `(getMissileTicksPerFrame() * 2) * std::sqrt(deltaLength)` |
| 1d | Mehah `Effect::waitFor` rule (14) | CONFIRMED, two small precisions | mehah `effect.cpp:135-148` |
| 2a | Light `min(1, (radius - d) * 0.2)`, per-channel max, MULTIPLY (13) | CONFIRMED | mehah `lightview.cpp:167-180`, `:116` |
| 2b | Damage text 11 px font, rise 48 px / 1000 ms, fade from 833 ms, merge 400 ms (13) | CONFIRMED | edubart `animatedtext.cpp:32, 50, 56, 95`, `const.h:39`; mehah `animatedtext.cpp:51, 60, 90`, `setup.otml:36, 43` |
| 3 | Stardew 1.5.4 floor torch 8x8, 7 x 100 ms; 12x11 4-frame flame for campfire, fireplace, torch furniture (10) | CONFIRMED | `Torch.cs:223-227`, `:240-244`; `Furniture.cs:46, 50, 1518-1525` |
| 4a | Canary fire field stages 200 / 148 / 98 s (10) | CONFIRMED | Canary `items.xml` ids 2118, 2119, 2120 |
| 4b | Fire field sprite 5 x 120 ms, box 49x47 (10) | CONFIRMED for stage 1 only (stages 2 and 3 are 5 x 100 ms) | fresh `appearances.dat`, byte-identical to note 10's copy, decoder re-run |
| 5a | DOOM in-place median top 95 rows vs double-buffered 73 (12) | CONFIRMED (93 vs 72 in my run), with a definition caveat | `scratch-18/doom18.js` [M] |
| 5b | 25.3% lone pixels at L = 8, 5 tones (12) | CONFIRMED (25.5% and 25.7% over two seeds) | same [M] |
| 6 | Front speeds green grass 0.52, dry grass 0.93 cells per tick (15) | CONFIRMED, method sound | re-run `scratch-15/front.js`; independent `scratch-18/front18.js` [M] |
| 7a | DrawableTexture2D merged 30 Jan 2026, 4.7, experimental (12) | CONFIRMED | GitHub API PR #105701; `DrawableTexture2D.xml` 4.7-stable lines 12, 23, 61 |
| 7b | PointLight2D max 15 lights per canvas item on Compatibility (12) | CONFIRMED | `rasterizer_canvas_gles3.h:90`, `.cpp:860` |
| 7c | GPUParticles2D web compile cost, #87843 (12) | CONFIRMED | GitHub API issue #87843 body and comments |
| 8a | RimWorld timings and edge-ring rule (15) | CONFIRMED | `Fire.cs:13-51, 95-98, 187, 204, 212, 226, 380-390`; `FireUtility.cs:31-37` |
| 8b | Don't Starve tree burn 45 s (15) | CONFIRMED | DST `tuning.lua:1634` `TREE_BURN_TIME = 45` |
| 8c | DST "burn times 10 s small, 20 s medium, 30 s large" cited to `tuning.lua` (15) | CORRECTED source | values are the defaults in `standardcomponents.lua:162, 174, 186`; `tuning.lua:1630-1632` gives 7.5 / 15 / 30 s |

No number the report leans on is wrong. Three items need a wording fix: 1d, 5a and 8c.

### Details where the verdict needs a sentence

**1d. Mehah `waitFor` [C].** The rule in note 14 is right. Two precisions.
- The new effect is refused while the old one's age is `<=` the minimum, not strictly under it (`if (ticksElapsed <= minDuration) return false;`, line 141).
- `minDuration` is 75 ms only when the effect has no idle animator. With enhanced-animation dat files it is `getIdleAnimator()->getMinDuration()` (line 138), then multiplied by `max(phases / 3, 1)` (line 139). The draw delay is `old_duration / 3`, or `/ 1.5` in optimize mode (line 144).
- Also seen. Mehah halves the animated-text lifetime in optimize mode (`textDuration /= 2`, `animatedtext.cpp:76`). Note 13 does not mention it. It does not change the default.

**2a. Light falloff [C].** Line 171 reads `float intensity = (-distanceNorm + light.intensity) * 0.2f;`, where `distanceNorm` is pixel distance times `invTileSize` (line 169), so distance is in tiles. The radius is the Tibia light level itself (`light.intensity * m_tileSize`, line 167). Below 0.01 is skipped (line 172), clamp to 1 at line 174, `std::max` per channel at lines 178-180.

**3. Stardew torch [C].** This corrects VFX #6, so here are the exact lines.
- Floor torch (`!bigCraftable`, `Torch.cs:210`): `sourceRect.X = 276 + (int)((ms + x*3204 + y*49) % 700.0 / 100.0) * 8; sourceRect.Y = 1965; Width = 8; Height = 8;` then drawn at scale `3f`, alpha `0.75f` (lines 223-227). So 8x8 px, 7 frames x 100 ms. Note 10 is right.
- Campfire 146 and Cookout Kit 278 (line 240): three draws of `Rectangle(276 + (int)((ms + seed) % 400.0 / 100.0) * 12, 1985, 12, 11)` at scale `3f` (lines 242-244). 12x11, 4 x 100 ms.
- Other big-craftable torches (the `else` at line 256-258): one 12x11 flame at scale `4f`. Note 10 does not list this branch. It is the same flame.
- Fireplace (type 14) two 12x11 at `4f`, torch furniture (type 16) one at `4f` (`Furniture.cs:1518-1525`).

**4b. Fire field sprites [C].** Decoder output on the fresh file.
- 2118: pattern 4x4, 80 sprites, 5 phases of 120 ms, box (15, 17, 49, 47), bounding_square 42, light (7, 200).
- 2119: 5 x 100 ms, box (15, 10, 49, 54), light (5, 206).
- 2120: 5 x 100 ms, box (26, 24, 38, 40), bounding_square 32, light (3, 206).
- I checked the decoder's field numbers against `appearances.proto` (SpritePhase 1/2, SpriteAnimation 1-6, Box 1-4, SpriteInfo 1-9). They match.
- `items.xml`: 2118 `ticks 10000, count 7, damage 20, duration 200, decayTo 2119`; 2119 `damage 10, duration 148, decayTo 2120`; 2120 `duration 98, decayTo 0`.

**5a. DOOM height [M].** I wrote Sanglard's loop again from his page (column outer, row 1 to H-1 inner, `randIdx = Math.round(Math.random() * 3) & 3`, `dst = src - randIdx + 1`, write `pixel - (randIdx & 1)` one row up). Buffer 1024 x 220, source at L, 300 warm-up frames, 60 samples over the next 300.

| Variant (L = 36) | Row where 95% / 50% / 5% of columns are lit | Median of per-column highest lit pixel (5th / 50th / 95th pct) |
|---|---|---|
| In place (Sanglard exact) | 70 / **93** / 115 | 93 / 105 / 121 |
| Double-buffered scatter (new starts as copy of old) | 59 / **72** / 85 | 71 / 78 / 88 |
| Gather (GPU style) | 58 / **71** / 86 | 73 / 81 / 92 |
| In place, L = 8 | 11 / 19 / 29 | 18 / 24 / 32 |

- Note 12's table uses the left-hand measure ("row where 95% of columns are still lit"). On that measure I get 93 vs 72 against its 95 vs 73. The ratio is 1.29 against 1.30. CONFIRMED.
- Caveat for the report. "Median flame top" is ambiguous. If someone measures the highest lit pixel per column, the same fire gives 105 rows in place and 78 double-buffered. The report should say "row where half the columns are lit".
- Seeds 1 and 777 gave the same numbers to within 1 row.

**5b. Lone pixels [M].** Tones = `floor((v - 1) * 5 / L)` for visible pixels, lone = differs from all 4 neighbours, unlit neighbours count as different. I get 8.6% at L = 36 in place and 7.9% double-buffered, exactly note 12's figures. L = 8 gives 25.5% (seed 1) and 25.7% (seed 777) against 25.3%. Gather at L = 36 gives 4.7% (note 12 has no row for it).

**6. Front speeds [M].** `front.js` re-run prints green grass 0.517, dry grass 0.930 cells per tick. Method check.
- IGNITING flip. New cells get state 2, go into `next`, not the current `active` list, and flip to 1 after the loop (line 31). They cannot spread in the tick they ignite, and `st[j] !== 0` stops double ignition. Correct.
- Diagonal factor. `p * (dx && dy ? 0.7 : 1)` (line 26). Correct.
- Wrap. y wraps on a 60-row strip, x is bounded at 400; 300 ticks at 1 cell per tick max stays inside 400. Correct.
- Hash. The largest product, `s * 3266489917` with `s` up to about 63,600, is about 2.1e14. That is under 2^53, so `>>> 0` takes exact low bits. Fine.
- Metric. Speed uses the leading tongue (`maxX`), which could overstate the front. My independent run (Math.random, 500 x 200 strip, mean over rows of each row's furthest ignition) gives 0.517 and 0.927. Same numbers.

**7. Godot [C].**
- PR #105701 "Implement DrawableTextures". `merged_at 2026-01-30T15:49:00Z`, milestone 4.7, 46 files, +2,417 (GitHub API). In the 4.7-stable class XML, `blit_rect`, `blit_rect_multi` and `setup` carry `experimental=""`.
- Light cap. `MAX_LIGHTS_PER_ITEM = 16` and `max_lights_per_item = 16` in `rasterizer_canvas_gles3.h:90, 246`. The gather loop breaks at `light_count == data.max_lights_per_item - 1` (`.cpp:860`), so 15 lights per item. `max_lights_per_render` is 256, or 64 on a low-limit branch (`.cpp:2778-2780`).
- #87843. Open, created 1 Feb 2024, updated 6 Nov 2026, 4 comments. Body says "around 2 seconds to load" for one default GPUParticles2D. Comment of 2 Feb 2024: "freeze the browser for 30-60 seconds". Comment of 1 Nov 2026: 4.7.2, ANGLE/D3D11, "22 to 25 s" per GPUParticles3D material. All as note 12 says.

**8. RimWorld and Don't Starve [C].**
- `Fire.cs`. `fireSize = 0.1f` (13), `FireBaseGrowthPerTick = 0.00055f` (51), `ComplexCalcsInterval = 150` (45), growth `0.00055 * flammabilityMax * 150` (306), spark interval `150 - (fireSize - 1) * 40`, floor 75 (95-98), max size 1.75 (41), floor burns at `ticksSinceSpawn >= 7500` (204), sparks 80% to radial slots 1-8 and 20% to slots 10-20 (380-390). Smoke motes only while `Fire.fireCount < 15` (212), smoke interval `IntRange(130, 200)` lerped by size plus up to 10 ticks (53, 226).
- `FireUtility.ChanceToStartFireIn` (31-37). If the cell's edifice is impassable and `OccupiedRect().ContractedBy(1).Contains(c)`, it returns 0. Edge-ring rule confirmed. It also returns 0 on a cell that already has a Fire (22-25) and on filth that forbids fire (39-44).
- DST `tuning.lua`: `local seg_time = 30` (19), `TREE_BURN_TIME = 45` (1634), `SMALL_BURNTIME = seg_time*.25`, `MED_BURNTIME = seg_time*0.5`, `LARGE_BURNTIME = seg_time` (1630-1632), so 7.5 / 15 / 30 s. The 10 / 20 / 30 s in note 15 are the defaults of `MakeSmallBurnable(inst, time or 10)`, `MakeMediumBurnable(... or 20)`, `MakeLargeBurnable(... or 30)` in `standardcomponents.lua:162, 174, 186`. Both are real. Cite the right file.

## Part B. Art gaps

### B1. Lava at 32 px from game data

Takeaway. Two shipped games animate lava slowly. Tibia's open lava is 3 frames of 500 ms on a 32 px tile with 8 position variants. Stardew's volcano lava reuses the water renderer, 10 frames of 200 ms plus a slow scroll. Neither palette-cycles in code. Both swap frames.

Cited findings
- **Tibia lava, item 727 and 2144 [C].** Fresh Canary `appearances.dat`: 32x32 opaque tile, pattern 4x2 (8 variants picked by map position), 3 phases of 500 ms (1.5 s loop), `synchronized` true, light level 4, colour 193. Items 728 to 730 (same name "lava", `items.xml` line 1903 `fromid 727 toid 730`): 30 phases of 150 ms (4.5 s loop), synchronized, pattern 1x1, light 4/193. Decoder `scratch-10/decode_app.py`. See it: https://tibia.fandom.com/wiki/Lava
- **Tibia ashes, items 2140 and 3134 [C].** One still sprite, box (4, 4, 24, 24), so a 24x24 pile centred in the tile. Item 7349 "ashes" is 25x30 at (7, 2). "Burnt down torch" 2926 is 11x14 at (20, 17), light 0.
- **Stardew 1.5.4 volcano lava [C].** `VolcanoDungeon.drawWaterTile` (line 2519) draws lava from `mapBaseTilesheet` at (0, 320) with the shared water animation. `GameLocation.cs:2732-2736`: `waterAnimationIndex = (waterAnimationIndex + 1) % 10; waterAnimationTimer = 200;`, so 10 frames of 200 ms (2 s) on a 16x16 tile drawn at 4x. Alternate tiles take the row 32 px lower by `(x + y) % 2` (line 2535), a checkerboard of two variants. The surface also scrolls by `waterPosition += (sin(ms / 1000) + 1) * 0.15` per update (2740) and wraps at 64 screen px (2746-2749). Steam puffs are a 10x10 px sprite from Cursors (372, 1956) on a 5,000 ms timer (lines 2417-2440). Watering a lava tile cools it into a blob autotile (`GetBlobLookup`, line 237). See it: https://stardewvalleywiki.com/Volcano_Dungeon

Inferences
- Stardew scroll [I]. `Milliseconds` runs 0 to 999, so the step is 0.15 to 0.28 screen px per update, about 13 screen px/s at 60 fps. That is 3.2 art px/s on a 16 px tile, a full tile drift in about 5 s. At 32 px tiles the same feel is about 6 px/s.
- For Asterion [I]. Tibia proves 3 frames x 500 ms is enough for lava on a 32 px tile if 8 position variants break the grid. A 30-frame 150 ms loop is the "flowing" tier. A palette-cycle shader at 2 to 4 steps per second would sit in the same tempo band.

Gaps. Terraria lava frame data was not checked (the 1.1-era `Main.cs` in `scratch-13` is old). No ramp lengths for lava were readable from sprite data without decoding pixels.

### B2. Burnt corpse and death by fire

Takeaway. Found no burnt-corpse frame with sizes in any open data. Tibia leaves a 24x24 ash pile as a map item (B1). Don't Starve gives burning characters short fixed times.

Cited findings
- DST `standardcomponents.lua:243, 257, 270`. `MakeSmallBurnableCharacter` burns 6 s, medium 8 s, large 10 s. https://github.com/penguin0616/dst_gamescripts/blob/master/standardcomponents.lua
- RimWorld burning things become ash filth at 0 HP (already in note 15).

Inference [I]. A 24x24 ash pile on a 32 px tile (Tibia 2140) is a usable size for a charred-remains decal under a 24x32 character.

Gap. No charred-character frame found in Tibia, Stardew, RimWorld or the pret decompiles at this budget.

### B3. Torch carrying

Takeaway. Terraria's old code places a held torch at the hand with a simple rule. No 32 px top-down game data with hand offsets turned up.

Cited findings
- Terraria 1.1-era decompile (`scratch-13/terraria_Player.cs:5374-5390`, "Freeria" mod repo, version unknown). For `holdStyle == 1` (torches): `itemLocation.X = position.X + width * 0.5f + (itemTextureWidth * 0.5f + 4f) * direction`, `itemLocation.Y = position.Y + 24f`, rotation 0. The body uses frame 3, arm held out (line 4192-4194). The player hitbox is 20x42 px. Server fallback is a fixed 20 px forward.

Inference [I]. Scaled to a 24x32 character (32/42 of Terraria's height), the hand is about 18 px below the head top and half the torch width plus 3 px in front of the body centre.

Gap. Graveyard Keeper and Moonlighter hand offsets not found (no open data).

### B4. Artists' tone counts

Takeaway. Still a gap. Saint11's tutorial page has no text for its fire, explosion and smoke GIFs, only "alt text" and "Each tutorial is 512x512 pixels" (https://saint11.art/blog/pixel-art-tutorials/). Lospec gallery entries give whole-image palettes, not per-flame tones.

Cited findings [C, from search result summaries, pages not opened, so treat as U for the numbers]
- Lepi, 16x16 campfire, 6-colour palette. https://lospec.com/gallery/lep1/fire-first-day-of-learning-pixel-art
- pixelcraftmaestro "Campfire", 150x115, 11 colours, 5 frames. https://lospec.com/gallery/pixelcraftmaestro/campfire
- Sometime Artist "Trash Fire", 240x160, 19 colours, 5 frames. https://lospec.com/gallery/sometime-artist/trash-fire
- Pixel Principles "Campfire", 168x100, 20 colours, 8 frames. https://lospec.com/gallery/pixelprinciples/campfire

Gap. No artist quote with a tone count or burn-edge width at 32 px. MortMort, AdamCYounis, Brandon James Greer and Pixel Pete transcripts not reached in budget.

## Sources
1. edubart OTClient `effect.h`, `effect.cpp`, `missile.h`, `missile.cpp`, `animatedtext.cpp`, `const.h`: https://github.com/edubart/otclient/tree/master/src/client
2. mehah otclient `effect.cpp`, `missile.cpp`, `gameconfig.h`, `lightview.cpp`, `animatedtext.cpp`, `data/setup.otml`: https://github.com/mehah/otclient
3. Stardew 1.5.4 decompile `Torch.cs`, `Objects/Furniture.cs`, `Locations/VolcanoDungeon.cs`, `GameLocation.cs`: https://github.com/veywrn/StardewValley
4. Canary `data/items/items.xml`, `data/items/appearances.dat`: https://github.com/opentibiabr/canary
5. Sanglard, DOOM PSX fire: https://fabiensanglard.net/doom_fire_psx/
6. Godot PR #105701: https://github.com/godotengine/godot/pull/105701 ; issue #87843: https://github.com/godotengine/godot/issues/87843 ; `drivers/gles3/rasterizer_canvas_gles3.{h,cpp}` and `doc/classes/DrawableTexture2D.xml` at 4.7-stable: https://github.com/godotengine/godot/tree/4.7-stable
7. RimWorld decompile `Fire.cs`, `FireUtility.cs`: https://github.com/josh-m/RW-Decompile/tree/master/RimWorld
8. DST scripts `tuning.lua`, `standardcomponents.lua`: https://github.com/penguin0616/dst_gamescripts
9. Saint11 tutorials index: https://saint11.art/blog/pixel-art-tutorials/
10. Lospec gallery pages listed in B4.
