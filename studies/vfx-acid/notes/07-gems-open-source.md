# 07 — Gem findings: open-source code for acid, corrosion, goo, slimes

Researcher angle: field-validated open-source code a Godot 4 / web pixel-art dev can use or study. Source files were read directly from raw.githubusercontent.com on 2026-11-08 (master/main branches unless noted). Repo metadata (licence, stars, last push) comes from the repos.ecosyste.ms API on 2026-11-08 (`https://repos.ecosyste.ms/api/v1/hosts/GitHub/repositories/<owner>%2F<repo>`), because GitHub HTML/API was blocked in this session. Star counts are an ecosyste.ms snapshot and may lag GitHub slightly.

**Licence rule of thumb for the dev:** GPL/AGPL/CC BY-SA/NGPL code here is for *studying the algorithm* (numbers, structure). Re-implement from the description, don't paste. MIT (Sandspiel, sand-slide) and CC0/MIT godotshaders snippets can be copied with attribution. Sandboxels is "All Rights Reserved"-style: look only.

---

## Q1. Shattered Pixel Dungeon: how do gas blobs and corrosion work?

**Takeaway:** A whole gas cloud is one int array plus a 5-point box blur that subtracts 1 per turn. That single `-1` is the evaporation, so total volume always drains and clouds clean themselves up. Corrosion is a damage-over-time effect that *ramps up* each turn. "Ooze" is a separate acid DOT that standing in water washes off. It's tiny code that's been shipped for years. Strongly recommended as the base model for acid fumes.

**Cited findings**
- `Blob.evolve()` ([Blob.java](https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/actors/blobs/Blob.java)): for each non-solid cell, `sum = cur[c] + cur[4 open orthogonal neighbours]`, `count` = number of cells summed (1–5). `off[c] = sum >= count ? sum/count - 1 : 0`. The bounding rect `area` grows when a value is above 0. `volume` sums all cells, and the blob is cleared when volume reaches 0. Walls (`Dungeon.level.solid`) are skipped, so gas flows around corners. Double buffer `cur`/`off`.
- `CorrosiveGas` ([CorrosiveGas.java](https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/actors/blobs/CorrosiveGas.java)): runs `super.evolve()`, then every character on a cell with `cur>0` gets `Corrosion.set(2f, strength)`. Strength is **one value per blob, not per cell** (the code has a FIXME saying so), and the highest strength wins. Visual: `emitter.pour(Speck.CORROSION, 0.4f)`.
- `Corrosion` buff ([Corrosion.java](https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/actors/buffs/Corrosion.java)): each turn it deals `(int)damage`. Damage then grows by `+1` while below `scalingDepth/2 + 2`, and by `+0.5` after that. Duration = `max(new, left)`; damage = `max(new, old)`. Icon is the POISON icon tinted orange (`hardlight(1, 0.5, 0)`).
- Wand of Corrosion ([WandOfCorrosion.java](https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/items/wands/WandOfCorrosion.java)): seeds `50 + 10×lvl` gas at the impact cell with strength `2 + lvl`. Battlemage on-hit Ooze chance is `(lvl+1)/(lvl+3)`, so 33% / 50% / 60% at +0/+1/+2.
- `Ooze` ([Ooze.java](https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/actors/buffs/Ooze.java)): `DURATION = 20` turns. Damage per turn: depth 1–4 → 1 every 2 turns, depth 5 → 1/turn, depth >5 → `1 + depth/5`. **Standing in water (and not flying) removes it.** That's the "acid + water = neutralised" combo in 2 lines.
- `CausticSlime` ([CausticSlime.java](https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/actors/mobs/CausticSlime.java)): 50% on-hit Ooze (20 turns) with a black particle burst (5). On death it drops a `GooBlob` item on a random adjacent open cell. It has the `ACIDIC` property, which in [Char.java](https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/actors/Char.java) L1431 means it resists Corrosion and is immune to Ooze.
- Base `Slime` ([Slime.java](https://github.com/00-Evan/shattered-pixel-dungeon/blob/master/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/actors/mobs/Slime.java)): HP 20, def 5, dmg 2–5, acc 12. Incoming damage of 5 or more is compressed by `4 + (sqrt(8(d-4)+1)-1)/2` (so 5/7/10/14/19/25 incoming → 5/6/7/8/9/10). That reads as "a squishy body absorbs big hits".

**Inferences**
- For Asterion: run the blob on the tile grid at turn rate (or about 4 Hz in real time). Draw it as tile-sized alpha/palette-index overlays plus a sparse particle "pour". Cost is O(area), and the dirty-rect `area` keeps it small.
- The `-1` term is a free, tunable evaporation rate. Replacing it with `-k` or a probabilistic `-1` changes cloud lifetime.

---

## Q2. NetHack: how does erosion work, and what does the acid blob do?

**Takeaway:** Item corrosion is just a 0–3 counter per item, with two independent tracks (rust/burn vs corrode/rot). Each level is −1 to damage or AC. Tier 3 plus the destroy flag deletes the item. Blessing, grease and "erodeproof" are the counterplay. Very cheap, and players have understood it since 1987.

**Cited findings**
- `erode_obj()` ([trap.c, 3.7](https://github.com/NetHack/NetHack/blob/NetHack-3.7/src/trap.c) L171+): types are BURN/RUST/ROT/CORRODE/CRACK. Verbs used: "smoulder, rust, rot, corrode, crack". `ERODE_CORRODE` writes to the secondary counter `oeroded2`, and `RUST`/`BURN` write to the primary `oeroded`. Resolution order:
  1. Greased (and the type is greasable) → grease absorbs it.
  2. Not vulnerable, or erodeproof and known → "not affected".
  3. Erodeproof, or **blessed with `!rnl(4)`** (luck-adjusted, about 1 in 4) → "Somehow… not affected".
  4. Counter below `MAX_ERODE` → increment ("further" / "completely" adverbs).
  5. Counter already at max with `EF_DESTROY` → "corrodes away" and the object is deleted.
- `MAX_ERODE 3` ([obj.h](https://github.com/NetHack/NetHack/blob/NetHack-3.7/include/obj.h) L129). `is_corrodeable` = material COPPER or IRON. `is_rustprone` = IRON only ([objclass.h](https://github.com/NetHack/NetHack/blob/NetHack-3.7/include/objclass.h) L200–207).
- Effects: weapon damage `tmp -= greatest_erosion(otmp)`, minimum 1 ([weapon.c](https://github.com/NetHack/NetHack/blob/NetHack-3.7/src/weapon.c) L350). Armour `ARM_BONUS = a_ac + spe − min(greatest_erosion, a_ac)` ([hack.h](https://github.com/NetHack/NetHack/blob/NetHack-3.7/include/hack.h) L1526), so erosion can never make AC negative.
- Acid blob ([monsters.h](https://github.com/NetHack/NetHack/blob/NetHack-3.7/include/monsters.h) L137): level 1, speed 3, AC 8, passive `AT_NONE AD_ACID 1d8`, resists sleep/poison/acid/stone, amorphous, green `b`.
- Passive when you hit it ([uhitm.c](https://github.com/NetHack/NetHack/blob/NetHack-3.7/src/uhitm.c) ~L5906): 50% chance "You are splashed by the acid blob's acid!" for 1d8 unless you have acid resistance. Inside that splash, there's a 1/30 chance to corrode a worn armour piece. Kicking: 1/6 to corrode boots. Hitting with a weapon calls `passive_obj`, which has a **1/6** chance to `erode_obj(weapon, ERODE_CORRODE, EF_GREASE)`.

**Inferences**
- Map the 0–3 tiers directly to 4 sprite or palette variants per item (clean / corroded / very / thoroughly) plus a 5th "dissolved" event. This fits pixel art well: palette-swap greens or browns, then knock out edge pixels per tier.

---

## Q3. Cataclysm: DDA: how do acid fields, terrain damage and acid spit work?

**Takeaway:** Acid is a "field" with 3 intensity levels and a 2-minute half-life. It falls down through z-levels and merges, damages contact body parts (more if you're lying down), and dissolves doors, bars and windows by probability. The acid-spit splash pattern is an elegant two-line falloff stamp.

**Cited findings**
- `fd_acid` ([field_type.json](https://github.com/CleverRaven/Cataclysm-DDA/blob/master/data/json/field_type.json)) has 3 intensities: "acid splatter" (light_green), "acid streak", "pool of acid" (green). Other fields: `half_life "2 minutes"`, `underwater_age_speedup "2 minutes"` (water speeds up decay, which is dilution), `phase liquid`, `priority 2`, `has_acid true`, immunity flag `ACID_IMMUNE`.
- Field processor ([map_field.cpp](https://github.com/CleverRaven/Cataclysm-DDA/blob/master/src/map_field.cpp) L543–572): if the tile below is open, the acid falls one z-level. If acid is already there, `new_intensity = min(3, a+b)`, and the overflow becomes negative age (`-1 min × overflow`) so the merged pool lasts longer. There's a TODO for sideways spreading at intensity 3, so no horizontal spread is implemented.
- Damage to characters (L147–160, L1488–1527): `burn_body_part` deals `rng(1, (scale+intensity)/2)` acid damage per contact body part, and only if the part's acid armour is lower than that roll. It also adds a `corroding` effect of strength `2+intensity` for `rng(2, 1+intensity)` turns. Standing: feet/legs with scale 2. Lying down: also torso (scale 2), plus a 50% chance of arms and head (scale 1). Being in a vehicle or having the ACIDPROOF trait prevents all of it.
- Monsters standing in acid (non-flying): `rng(I, 3I)` torso acid damage (L1895–1898).
- Terrain `map::hit_with_acid` ([map.cpp](https://github.com/CleverRaven/Cataclysm-DDA/blob/master/src/map.cpp) L5336):

  | Terrain | Result |
  |---|---|
  | glass wall | floor |
  | closed or locked door | 1/3 chance: broken door |
  | broken door | 1/4 chance: door frame |
  | metal bars / cages | floor ("The metal bars melt!") |
  | window | empty window |
  | wax | wax floor |
  | card reader | broken |
  | gas pump | immune |

- Acid spit `mattack::acid` ([monattack.cpp](https://github.com/CleverRaven/Cataclysm-DDA/blob/master/src/monattack.cpp)): costs 3 s of moves. Projectile speed 10, 5 acid damage, range 10, dispersion 5400. On impact, for each offset (i,j) in a 7×7 box with a clear path: add `fd_acid` intensity 2 if `one_in(|i|) && one_in(|j|)` (always at the centre). So a cell 2 tiles off on one axis has a 1/2 chance and a cell at (3,3) has 1/9. The result is a natural, cross-biased splash shape.
- Licence: CC BY-SA 3.0 Unported ([LICENSE.txt](https://github.com/CleverRaven/Cataclysm-DDA/blob/master/LICENSE.txt)). ecosyste.ms reports "other".

**Inferences**
- The `one_in(|i|)·one_in(|j|)` stamp is the best cheap "splat puddle" generator found. Use it for spit, popped slimes and flasks, then smooth with the SPD blur or the snow study's dither threshold.

**Gaps**
- I did not locate where `has_acid` damages *items* lying in acid (the flag is defined in field_type.cpp L310). Not verified this session.

---

## Q4. Brogue CE: how do acid mounds degrade gear, and how do jellies split?

**Takeaway:** Brogue's design is the cleanest version. Every hit costs exactly −1 enchant, on either armour (when the monster hits you) or weapon (when you hit it). It's shown loudly as "your X weakens!", and players learn to swap to fists or unequip armour. Acid jelly adds splitting.

**Cited findings**
- Acid mound ([GlobalsBrogue.c](https://github.com/tmewett/BrogueCE/blob/master/src/brogue/GlobalsBrogue.c) L1038): 15 HP, def 10, acc 70, dmg 1–3, blood `DF_ACID_BLOOD`, flags `MONST_DEFEND_DEGRADE_WEAPON` + `MA_HIT_DEGRADE_ARMOR`. Flavour text: it leaves "a trail of hissing goo" (L1199).
- Acidic jelly (L1073): 60 HP, dmg 2–6, same degrade flags, plus `MA_CLONE_SELF_ON_DEFEND`.
- Armour degrade ([Combat.c](https://github.com/tmewett/BrogueCE/blob/master/src/brogue/Combat.c) L394–405): if the attacker has the flag, the armour is not `ITEM_PROTECTED`, and `enchant1 + armor/10 > -10`, then `enchant1--` and the message "your %s weakens!" appears.
- Weapon degrade (L1233–1247): `enchant1--` when you hit a `DEFEND_DEGRADE_WEAPON` monster, unless the weapon is protected or is a slaying weapon for that class ("just ain't right!"). Floor of −10.
- Jelly split `splitMonster` (L208+): requires a clone count under 100. It flood-fills the contiguous group of the same monster, collects the 4-neighbour empty edge cells, and picks one at random. Parent HP becomes `(HP+1)/2` and the clone copies it.
- `ACID_SPLATTER` dungeon feature (Globals.c L639): `{SURFACE, startProb 200, probDecrement 25}`, described as "a puddle of acid". Brogue's DF spawner spreads with a start probability that drops by the decrement each generation, which gives organic puddles.
- Licence: AGPL-3.0 (LICENSE.txt header). 1,511 stars, pushed 2026-10-31.

**Gaps**
- I found no "acid turret" in current Brogue CE's catalogue. The turrets are arrow/spark/dart/flame (L1036–1093). It may exist in older Brogue or a variant; not verified.

---

## Q5. DCSS: how is corrosion implemented?

**Takeaway:** Modern DCSS has no item erosion. Corrosion is a *temporary status* that reduces both AC and weapon damage. Stacking gets harder the more you already have. It's a good model for an MMO where permanent item loss angers players.

**Cited findings**
- `player::corrode(amount=4)` ([player.cc](https://github.com/crawl/crawl/blob/master/crawl-ref/source/player.cc) L7740; the default is in [actor.h](https://github.com/crawl/crawl/blob/master/crawl-ref/source/actor.h) L215):
  - Duration always increases by `10 + 2d4`, capped at 50.
  - Corrosion resistance halves the amount.
  - It stacks only if `!x_chance_in_y(corr, corr+28)`. With 0 corrosion that's a 100% chance; with 4 it's 28/32 = 87.5%; with 8 it's about 78%; with 12 it's 70%.
- `corrosion_amount()` (L6856) = stacked corrosion + `4 × adjacent slime walls` ([terrain.cc](https://github.com/crawl/crawl/blob/master/crawl-ref/source/terrain.cc) L949) + 8 in the Dis branch. `AC -= 100*corrosion_amount()` on a ×100 scale, so it's −1 AC per point (L6924). Melee `damage_plus -= corrosion_amount()` ([attack.cc](https://github.com/crawl/crawl/blob/master/crawl-ref/source/attack.cc) L813).
- `splash_with_acid`: 4d3 acid damage (resistable), then a 35% chance to `corrode()` (player.cc ~L7766).
- Slime walls under Jiyva hurt monsters for `2d(3×walls×delay/BASELINE)` acid (terrain.cc L960+).
- Licence: GPL (v2-or-later per the crawl LICENSE text; "Certain pieces… compatible with the GPL"). [LICENSE](https://github.com/crawl/crawl/blob/master/LICENSE). 3,064 stars, pushed 2026-11-07.

---

## Q6. Falling-sand engines: what are the acid rules?

**Takeaway:** Both mature engines make acid **self-consuming** with one per-particle byte. Sandspiel spends 60 strength per dissolve (it dies after 1–2 dissolves). The Powder Toy gives acid 75 "life", dissolves with probability `Hardness/1000`, spends 1 life per dissolve, and dies at 50 or below (so about 25 dissolves), plus heat. Glass protects. These are exactly the "acid is consumed" and "gold/glass resist" rules the study needs, at per-pixel cost.

**Cited findings: Sandspiel** ([species.rs `update_acid`](https://github.com/MaxBittker/sandspiel/blob/master/crate/src/species.rs) L1174; MIT; 3,219 stars; pushed 2026-09-10)
- Acid spawns with `ra = 100 + rand(0..50)` ([lib.rs](https://github.com/MaxBittker/sandspiel/blob/master/crate/src/lib.rs) L42).
- Movement order: try down, then a random side `dx`, then the other side, moving only into empty cells.
- If boxed in: dissolve the first neighbour (down, side, other side, then up but not into empty) that isn't Wall or Acid. The acid moves into that cell as `degraded` (`ra − 60`) and becomes empty if `ra < 80`.
- Net effect: each acid pixel eats 1 cell, sometimes 2 if it started with ra ≥ 140. Wall is immune.

**Cited findings: The Powder Toy** ([ACID.cpp](https://github.com/The-Powder-Toy/The-Powder-Toy/blob/master/src/simulation/elements/ACID.cpp); GPL-3.0; 5,395 stars; pushed 2026-11-05)
- Properties: liquid, gravity 0.1, Falldown 2, `DefaultProperties.life = 75`, flammable 40, colour `0xED55FF`.
- Each frame, scan the 5×5 neighbourhood:
  - Explosives (PLEX/NITR/GUNP/RBDM/LRBD): both particles become FIRE.
  - Water vapour (WTRV): 1/250 chance acid becomes CAUS (caustic gas) with life 25–74, and the vapour is removed.
  - Otherwise, if `life > 50` and `rng.chance(Hardness, 1000)` and not glass-protected (`parts_avg(...) != GLAS`): kill the target (LITH becomes H2), `life--`, and `temp += max(0, (60 − Hardness) × 7)`.
  - If `life ≤ 50`, the acid kills itself on touching a non-acid particle.
- Diffusion: 2 random acid neighbours per frame equalise `life` (half the difference is transferred), so strength spreads through a pool.

**Cited findings: sand-slide** ([kiwijuice56/sand-slide](https://github.com/kiwijuice56/sand-slide); MIT; 143 stars; pushed 2026-09-08)
- A Godot 4 falling-sand game whose simulation is a C++ GDExtension. Shipped on itch.io and Google Play. The README says the UI is a Godot 4.6 project.
- Every element class must implement `process()`, `get_explode_resistance()` and **`get_acid_resistance()`**, so acid resistance is a per-material property ([README](https://github.com/kiwijuice56/sand-slide/blob/main/README.md)).
- The acid element source path wasn't found in this session (gap).

**Sandboxels** ([R74nCom/sandboxels](https://github.com/R74nCom/sandboxels)): 477 stars, pushed 2026-06-03. **Licence: "R74n Content License" v1.1, "All Rights Reserved".** The licensor can demand removal at any time ([license.txt](https://github.com/R74nCom/sandboxels/blob/main/license.txt)). **HIGH RISK: do not copy code. Play it for reference only.**

**Inferences**
- For a top-down tile game, use the TPT model at *tile* granularity:
  - acid tile `life` = 75;
  - each tick, dissolve probability per adjacent material = `hardness/1000`, scaled to tick rate;
  - glass and gold get hardness 0 (immune), stone low, wood medium, flesh and cloth high;
  - each dissolve costs 1 life, and at ≤ 50 the acid is spent and becomes a stain.

  This is the cheapest "self-limiting reaction" rule.
- For a per-pixel puddle-edge "eat" effect inside one tile (decals), Sandspiel's byte decrement is enough.

---

## Q7. DOOM: what are the nukage/slime animation and damage numbers?

**Takeaway:** DOOM's acid floors are a 3- or 4-frame palette loop at 8 tics per frame, plus a fixed damage tick every 32 tics. A radiation suit blocks it, except the strongest floor leaks with 5/256 per-tic odds. These are the canonical "acid floor" numbers, cheap and unmistakable.

**Cited findings** ([linuxdoom-1.10/p_spec.c](https://github.com/id-Software/DOOM/blob/master/linuxdoom-1.10/p_spec.c); GPL-2.0; 19,851 stars; last push 2024-05-24)

- Animated flats (L103–113): `NUKAGE1→3`, `FWATER1→4`, `LAVA1→4`, `BLOOD1→3`, and `SLIME01→04`, `05→08`, `09→12`, all at speed **8 tics**. Frame = `(leveltime/speed + i) % numpics` (P_UpdateSpecials).
- `P_PlayerInSpecialSector` (L1005+) applies damage only when the player is on the floor, every **32 tics** (`!(leveltime&0x1f)`):

  | Sector special | Floor | Damage | Radiation suit |
  |---|---|---|---|
  | 7 | nukage | 5 | blocks |
  | 5 | hellslime | 10 | blocks |
  | 16 / 4 | super hellslime / strobe hurt | 20 | blocks, but `P_Random() < 5` leaks (about 2%) |
  | 11 | E1M8 exit | 20 | disables god mode, exits at health ≤ 10 |

- Inference: at 35 tics/s, 32 tics ≈ 0.91 s, so nukage is about 5.5 HP/s. Frame time 8/35 ≈ 0.23 s, so the animation runs at about 4.4 fps (a deliberately slow, sludgy feel).
- Licence risk: the source is GPL-2.0, but the NUKAGE/SLIME *textures* are id's IWAD assets and are not covered by the source licence (inference). Freedoom provides free replacements (not verified this session).

---

## Q8. Shaders, metaballs, reaction-diffusion

**Cited findings**
- godotshaders.com "Metaballs" by Davidoron ([page](https://godotshaders.com/shader/metaballs/)): CC0, but `shader_type spatial`. It's an SDF smooth-min raymarch with `ball_pos[]`, `radi[]` and `blend_r` uniforms. For 2D you'd port the SDF smooth-min to `canvas_item`.
- godotshaders.com "Dissolve (Godot 4.x)" by KitsuneKotta ([page](https://godotshaders.com/shader/dissolve-godot-4-x/)): MIT, `spatial`. It thresholds procedural Perlin noise against `dissolveSlider`, uses alpha scissor 0.5, and draws an emissive edge band `edgesThickness` (0–0.3, default 0.01) × `edgeColor` × `edgeEmissionSlider`. The algorithm ports directly to a 2D sprite "acid eating the item" effect.
- godotshaders.com lists shaders by licence (CC0 / MIT filter pages, e.g. [CC0 list](https://godotshaders.com/shader-license/cc0/page/11/)). There's also an "SDF Metaballs" entry ([?p=16686](https://godotshaders.com/?p=16686)), licence not checked.
- Karl Sims reaction-diffusion tutorial ([karlsims.com/rd.html](https://www.karlsims.com/rd.html)):
  - Gray-Scott with DA = 1.0, DB = 0.5, f = 0.055, k = 0.062, Δt = 1.0.
  - Laplacian 3×3 weights: centre −1, orthogonal 0.2, diagonal 0.05.
  - Variants: mitosis f = .0367 / k = .0649; coral f = .0545 / k = .062.
  - Useful for an etched-metal or pitting stain texture baked once at low resolution.

**Inferences**
- For 2D Godot slimes, the standard cheap trick is: draw soft radial-gradient sprites inside a `CanvasGroup`, then threshold the group's alpha in its shader (`step(0.5, a)`) and quantise to 2–3 palette tones. Merging and splitting come for free when blobs overlap. This works in Compatibility/WebGL2 (inference; CanvasGroup docs not fetched this session).
- Marching squares over the SPD/CDDA cell field gives tile-aligned puddle outlines with 16 cases, the same table as autotiling.

---

## Master table

| Name | URL | Licence | Maturity evidence | What it's good for |
|---|---|---|---|---|
| Shattered PD `Blob`/`CorrosiveGas`/`Corrosion`/`Ooze` | https://github.com/00-Evan/shattered-pixel-dungeon | **GPL-3.0** (study) | 6,732★, pushed 2026-10-07; commercial on Steam/mobile | Gas diffusion `avg−1` (≈20 lines), ramping DOT, water washes off acid, acidic slime drops goo |
| NetHack 3.7 `erode_obj`, acid blob | https://github.com/NetHack/NetHack | **NGPL** (copyleft, study) | 3,980★, pushed 2026-11-06; since 1987 | 0–3 erosion tiers × 2 tracks, −1 dmg/AC per tier, grease/bless/proof counters, 1/6 weapon corrode on hit |
| Cataclysm: DDA `fd_acid`, `hit_with_acid`, `mattack::acid` | https://github.com/CleverRaven/Cataclysm-DDA | **CC BY-SA 3.0** (share-alike risk) | 13,454★, pushed 2026-11-03 | 3-level acid field, 2-min half-life, water speeds decay, falls and merges, terrain dissolve table, `1/|i|·1/|j|` splash stamp |
| Brogue CE acid mound / acidic jelly / `splitMonster` | https://github.com/tmewett/BrogueCE | **AGPL-3.0** (strongest copyleft) | 1,511★, pushed 2026-10-31 | −1 enchant per hit on armour or weapon, "weakens!" feedback, jelly split onto group edge with HP halved, DF puddle spread 200/−25 |
| DCSS corrosion status | https://github.com/crawl/crawl | **GPL (v2+)** | 3,064★, pushed 2026-11-07 | Temporary −AC/−dmg stack (4 per hit, `corr/(corr+28)` diminishing), slime walls −4 each, no permanent item loss |
| Sandspiel acid | https://github.com/MaxBittker/sandspiel | **MIT** (safe) | 3,219★, pushed 2026-09-10; popular web toy | Per-pixel byte budget: −60 per dissolve, dies below 80; WASM/web-ready |
| The Powder Toy ACID | https://github.com/The-Powder-Toy/The-Powder-Toy | **GPL-3.0** (study) | 5,395★, pushed 2026-11-05; 15+ yr community | `life` 75, dissolve chance = hardness/1000, ≤50 spent, glass immune, heat release, +vapour → caustic gas, +explosives → fire |
| sand-slide | https://github.com/kiwijuice56/sand-slide | **MIT** (safe) | 143★, pushed 2026-09-08; shipped itch + Google Play | Godot 4 GDExtension cellular sim; per-element `get_acid_resistance()` |
| Sandboxels | https://github.com/R74nCom/sandboxels | **R74n Content License, All Rights Reserved: HIGH RISK** | 477★, pushed 2026-06-03 | Reference play only; no code reuse |
| DOOM p_spec.c | https://github.com/id-Software/DOOM | **GPL-2.0** code; **IWAD textures not free** | 19,851★; 1993 classic | Nukage 5 / slime 10 / super 20 dmg per 32 tics, 8-tic flat loops, rad-suit 5/256 leak |
| godotshaders "Metaballs" | https://godotshaders.com/shader/metaballs/ | CC0 | Community shader site | SDF smooth-min metaballs (spatial; port to canvas_item) |
| godotshaders "Dissolve (Godot 4.x)" | https://godotshaders.com/shader/dissolve-godot-4-x/ | MIT | Community shader site | Noise-threshold dissolve plus emissive edge, for an item-eaten-by-acid effect |
| Karl Sims RD tutorial | https://www.karlsims.com/rd.html | Tutorial (no code licence stated) | Widely cited reference | Gray-Scott params for etch/pitting stain textures |

## Licence risk flags
- **AGPL-3.0 (Brogue CE):** network-use clause. Do not paste into an online MMO server or client.
- **GPL-2/3 (SPD, TPT, DCSS, DOOM), NGPL (NetHack):** copying code would force the game to be GPL. Re-implement from these notes.
- **CC BY-SA 3.0 (CDDA):** share-alike applies to code and JSON data. Re-derive numbers; don't copy the JSON.
- **Sandboxels:** proprietary-style; the licensor can demand removal.
- **DOOM textures:** not covered by the GPL source release.
- **Safe:** MIT (Sandspiel, sand-slide, KitsuneKotta dissolve) and CC0 (Davidoron metaballs), with attribution.

## Gaps
- No star or commit data was read from GitHub directly (blocked). The ecosyste.ms snapshot was used instead.
- CDDA item-in-acid damage path not located. Brogue "acid turret" not found in CE. sand-slide acid element source not read.
- Not fetched this session: Sage Jenson Physarum (https://cargocollective.com/sagejenson/physarum), Noita GDC 2019 talk "Exploring the Tech and Design of Noita" (Petri Purho), Godot CanvasGroup docs/demos, 2D soft-body plugins, JS metaball/marching-squares libraries. Verify before citing.
- 2D (canvas_item) metaball or acid-pool shaders on godotshaders with confirmed licences weren't individually verified. Both verified entries are spatial.

## Sources
- SPD: https://github.com/00-Evan/shattered-pixel-dungeon (Blob.java, CorrosiveGas.java, Corrosion.java, Ooze.java, CausticSlime.java, Slime.java, WandOfCorrosion.java, Char.java)
- NetHack 3.7: https://github.com/NetHack/NetHack/tree/NetHack-3.7 (src/trap.c, src/uhitm.c, src/weapon.c, include/obj.h, include/objclass.h, include/hack.h, include/monsters.h, dat/license)
- CDDA: https://github.com/CleverRaven/Cataclysm-DDA (data/json/field_type.json, src/map_field.cpp, src/map.cpp, src/monattack.cpp, LICENSE.txt)
- Brogue CE: https://github.com/tmewett/BrogueCE (src/brogue/Combat.c, GlobalsBrogue.c, Globals.c, LICENSE.txt)
- DCSS: https://github.com/crawl/crawl (crawl-ref/source/player.cc, actor.h, attack.cc, terrain.cc, LICENSE)
- Sandspiel: https://github.com/MaxBittker/sandspiel (crate/src/species.rs, lib.rs, LICENSE)
- The Powder Toy: https://github.com/The-Powder-Toy/The-Powder-Toy (src/simulation/elements/ACID.cpp, LICENSE)
- sand-slide: https://github.com/kiwijuice56/sand-slide (README.md); itch: https://kiwijuice56.itch.io/sand-slide
- Sandboxels: https://github.com/R74nCom/sandboxels/blob/main/license.txt
- DOOM: https://github.com/id-Software/DOOM/blob/master/linuxdoom-1.10/p_spec.c
- godotshaders: https://godotshaders.com/shader/metaballs/ , https://godotshaders.com/shader/dissolve-godot-4-x/
- Karl Sims: https://www.karlsims.com/rd.html
- Repo metadata: https://repos.ecosyste.ms/ (API, fetched 2026-11-08)
