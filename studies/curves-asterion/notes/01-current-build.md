# 01. Our current build (Asterion as built)

Scope. Asterion's long curve, skill-by-use curve, magic curve and death penalty as the Go server computes them today, at main 8836106a (PR #183, 2026-09-11). Sources are the repo at `/Users/esenespinosa/Development/personal/games/mmorpg` (paths below are relative to it), its `docs/GDD.md` §6 and §9, `docs/vision-es.md`, `docs/systems/*.md`, the content YAML, read-only `git log` for dates, and three runs of the game's own balance harness (`server/cmd/balance`). Every fact is [K]. Code reads and harness output are E1 (they are the rules). The decisions log is E2 (the designer's stated reason, with the playtest quote where one exists). Model outputs are [K, E1] on the rules and [I] on their assumptions. The GDD says "read the code, not a stale copy" (`docs/GDD.md:197`), and this note found four places where the copy is stale (Q1 and Q9).

Raw work saved outside the repo, in the session scratchpad.
- Harness output: `notes/harness/skills.txt`, `levels.txt` (8 levels x 15 kits x 183 creatures, 60 trials each), `economy.txt` (40 trials)
- Curve model `notes/harness/model.py` (exp, HP, mana, speed beat, death cost, magic level)
- Harness join `band.py` (harness rows joined to each creature's `max_farm_level`), `hours.py` (cumulative hours to level), `creatures.psv` (240 creatures: name, max_farm_level, exp, hp)

Harness commands run from `server/` (Go 1.26): `go run ./cmd/balance -skills`; `go run ./cmd/balance -levels 1,5,8,15,25,50,80,120 -trials 60`; `go run ./cmd/balance -economy -trials 40`. The three took about six minutes together.

## Takeaways

1. The exp curve is cubic but the time per level is nearly flat, because creature exp is derived from the same curve. D69 (2026-07-31) sets `exp = (exp(L+1) - exp(L)) / 100` with `L = max_farm_level`, so a hundred kills of your band's creature is always one level (`docs/GDD.md:411`, `content/creatures/rata_parda.yaml:7-8`). In the harness, a character fighting the creature of its own band levels in 0.26 h at level 1, 0.41 h at level 8, 0.47 h at 15, 0.74 h at 25, 0.56 h at 50, 0.75 h at 80 and 1.06 h at 120 (median of the safe band creatures, realistic kit per level, `levels.txt`, `band.py`). The slowness the vision doc asks for (§2.4, "progression in weeks and months", `docs/vision-es.md:81-87`) is therefore not in the exp table. It has to come from travel, food, death and finding the next band, none of which the harness models. [K, E1] [I] on the "has to come from" clause.
2. Death cost grows linearly with level even though hours per level do not. Loss is a flat 10 % of exp (`server/internal/game/corpse.go:43,367`) and exp(L) is about L/3 times the step to the next level, so a death at the bottom of level L costs about L/30 of the hours one level takes. In the harness clock that is 5 min at level 8, 31 min at 30, 53 min at 50, 176 min at 100 and 249 min at 120. With a 3x overhead for a real session (walking, eating, looting) it is 14, 92, 158, 528 and 747 min. The design target of "about one session" (`docs/vision-es.md:89-90`) holds to roughly level 30 to 50 and is three to twelve sessions past level 80. [K, E1] [I] on the 3x.
3. The skill ladder is one slope of 1.08 since D149 (2026-08-30, commit d4d4a0bf), fishing 1.1, bases 50/30/100/20, and every combat reader sees half a rung per level through `skillRung = 10 + (L - 10)/2` (`server/internal/game/skills.go:101-106,119-121`). The harness prices it: sword 50 in 14.4 h of session, 70 in 69.6 h, 100 in 707 h; shielding 50 in 28.8 h; distance 50 in 8.6 h (`skills.txt`). Shielding costs exactly twice sword at every level because its base is 100 against 50. [K, E1]
4. Magic level is the steepest curve in the game and gold is its accelerator. `mana_to_next = 1600 x 1.4^ml` (`skills.go:249-251`). Food-only regen is 1 mana per 6 s, 600 mana an hour (`game.go:157`), so magic level 5 is 29 h of fed time and level 10 is 186 h. A mana potion is 60 gold for 55 to 75 mana (`content/npcs/tomas.yaml:110`, `content/items/pocion_mana.yaml`), so magic level 10 bought with potions is about 103,000 gold. The wand gates at magic level 10/15/20 therefore cost either 186/1,445/7,800 fed hours or 103k/800k/4.3M gold, before the wands' own 1,200/8,000/24,000 gold prices (`docs/systems/high-tier-items.md:71-73`). [K, E1]
5. The death penalty's three knobs have not moved since July; everything around them has. `deathExpLoss` 0.10 (2026-07-13, Phase 2 commit 95b8547d), `gearDropChance` 0.10 (v10, `equipment.go:473`), own corpse 15 + 15 min (D38, 2026-07-28, `corpse.go:29-30`). What changed is the walk: the heartstone went from 30 to 5 min (D113, 2026-08-12), the temple heals for free (D30, 2026-07-26), food HP regen doubled (same commit), and level 1 walks 500 ms a tile instead of 600 real (D137 and D138, 2026-08-21). The sting was kept and the recovery was made faster. [K, E1/E2]
6. The balance harness surfaces two content findings on the first run. `enano aldeano` (hp 120, damage 4-5, `max_farm_level` 40, exp 742) is the best exp/hour for every kit from level 1 to 25 and kills nobody (`content/creatures/enano_aldeano.yaml`, `levels.txt`), and `cochinilla farolera` (band 20) drops `cristal` (value 10,000 gold) at 20 % x 1-2, an expected 3,000 gold a kill and 250,000 to 350,000 gold an hour in the harness (`content/creatures/cochinilla_farolera.yaml`, `content/items/cristal.yaml`, `economy.txt`). Both live on Gorothland or Ingwen, which the harness does not know (it has no geography), so neither is reachable at the level that would abuse it. They are still the two numbers a level-35 player would find first. [K, E1] [I] on what players would find.
7. Four written numbers are stale against the code. GDD §6 still lists skill multipliers 1.8/1.8/1.6 (`docs/GDD.md:222`; code 1.08/1.08/1.08/1.1), base speed 280 and +5 with beats at 5/12/20/31/45 (`docs/GDD.md:209-210`; code 300 and +4 with beats at 10/20/34/51, `game.go:89,123`, and `docs/GDD.md:204` already says so two rows above), "35 spells" (`docs/GDD.md:273`; 45 files in `content/spells/`), and `TestDeathPenaltyCalibration` prices a rat at 8 exp (`server/internal/game/phase5_test.go:25`) when D69 made it 2 (`content/creatures/rata_parda.yaml:8`). The study's CONTEXT.md repeats the 280/+5 figures and should be corrected. [K, E1]
8. Nothing is measured on the live server. Telemetry is a flag, off unless passed (`docs/systems/telemetry.md`, `deploy/pull-telemetry.sh:14`), and the events that exist (session, kill, death, level, damage, heal, consume, loot, shop, gold, quest, ferry, equip) would answer every question in this study for a 5-player group within a few sessions. [K, E1]

## Q1. What are the constants, and which copies are stale?

### Takeaway
Everything in the progression stack is a handful of constants in `server/internal/game/`. The code is consistent with itself; the GDD §6 table and one test comment are not consistent with the code.

### Cited findings

The constants, from code. [K, E1]

| Quantity | Value | Where |
|---|---|---|
| Exp per level | `exp(L) = (((L-6)L + 17)L - 12) / 6 x 100`, integer division; L1 = 0, L2 = 100, L8 = 4,200 | `server/internal/game/stats.go:15-25` |
| Max level | 255 (one byte on the wire, not a design number) | `stats.go:53` |
| Max HP | `145 + 5 x L` (150 at level 1) | `stats.go:46`, `game.go:159` |
| Max mana | `100 + 10 x L` (doubled in v17, D57) | `game.go:280` |
| Level-up | heals to full, recomputes speed, HP, mana in one place (`applyLevel`) | `stats.go:55-60`, `corpse.go:209-210` |
| Skills | four: sword 0, distance 1, shielding 2, fishing 3; all start at 10 | `game.go:193`, `skills.go:125` |
| Skill tries to next | `base x mult^(L - 10)`; bases 50/30/100/20; mults 1.08/1.08/1.08/1.1 | `skills.go:101-106,171-176` |
| Skill rung (combat weight) | `rung(L) = 10 + (L - 10)/2`; fishing reads the raw level | `skills.go:119-121` |
| How skills train | sword: one try per melee swing; distance: one per shot, hit or miss; shielding: one per melee hit received, including a clean block since 2026-08-30; fishing: one per hook, two per catch, one more for a clean one | `docs/GDD.md:223,494`, `skills.go:30-45` |
| Magic level | `mana_to_next(ml) = 1600 x 1.4^ml`, counted on mana spent | `skills.go:249-251,255-268` |
| Walk speed | `300 + 4 x (L - 1)`, derived, never persisted | `game.go:89,123,129-134` |
| Step duration | `ceil(1000 x 150 / speed / 50) x 50` ms; beat changes at levels 10, 20, 34, 51 | `docs/GDD.md:208`, `game.go:100` |
| Worn speed | `botas de siete leguas` +55, level 15, 2,500 gold; sized to cross exactly one beat at levels 15 to 30 | `docs/GDD.md:211`, `tomas.yaml:10` |
| Combat cadence | one attack per 2,000 ms for players and creatures | `game.go:143`, `combat.go:89,797` |
| Player damage | `uniform(band(max/2))`, `max = attack x rung(skill) x 0.075 + level x 0.3`, `band(m) = [0.75m, 1.25m]`, minus armour absorb, floor 1 | `combat.go:600,627`, `docs/GDD.md:235` |
| Armour absorb | flat `ceil(armor / 2)` | `combat.go:666`, `docs/GDD.md:236` |
| Shield block | flat `round(rung(shielding) x defense x 0.015 + defense x 0.1)`, melee only | `combat.go:986-989`, `docs/GDD.md:238` |
| Creature damage | authored `{min, max}` band, uniform; shield first, armour second; magic ignores both | `docs/GDD.md:237,241` |
| Ranged miss | `maxMiss x t^1.5` beyond 2 tiles; 22 % at the edge at skill 10, falling 14 points over 30 rungs, floor 3 % | `combat.go:304-320`, `game.go:170-188` |
| Defensive stance | swings at fist attack 4, moves the weapon's attack into defense | `docs/GDD.md:233`, `game.go:144` |
| Death: exp | lose 10 %, level recomputed, HP and mana refilled; skills, tries and spent mana untouched | `corpse.go:43,364-383` |
| Death: gear | container slot always drops whole; each other worn slot drops at 10 % independently; quest-sealed pieces never roll | `equipment.go:473,486-505` |
| Death: corpse | own corpse 900 s + 900 s bones = 30 min; creature 4 + 4 min; lootable by anyone | `corpse.go:29-30,69-74` |
| Death: respawn | at the town temple; quest items destroyed; `reset_on_death` chains reset | `corpse.go:385-390`, `docs/GDD.md:261` |
| Heartstone | one per character, free from Sila, 5 min persisted cooldown, out of combat only, destroyed by death | `recall.go:43,61,117`, `docs/GDD.md:268` |
| Temple heal | free, unconditional, HP and mana to full | `npc.go:234-249`, `docs/GDD.md:269` |
| Food | `edible x 12` s of regen, cap 1,200 s; +1 HP per 3 s, +1 mana per 6 s; no food, no regen | `game.go:149,156-157`, `stats.go:669-698` |
| Potions | one shared 2 s clock for every HP or mana bottle; refused sip costs nothing | `game.go:262`, `corpse.go:783-802` |
| Spell exhaust | 1 s global plus per-group and per-spell clocks (D57) | `game.go:215`, `docs/GDD.md:399` |
| Party share | +20 % on the whole kill, then split equally among members within 30 tiles and one floor who are eligible; killer keeps the remainder | `party.go:63,68,82,796-814` |
| Shop buy-back | every shopkeeper buys anything with `worth` at 30 %, floor 1 | `docs/GDD.md:271` |
| Harness assumptions | 1,500 exp/h, 50 % of time swinging, 10 s overhead per kill, 240 s fight limit, seed 1337 | `balance.go:128-129`, `docs/systems/balance.md` |

Stale copies, with the live value. [K, E1]

| Written where | Says | Code says | Since |
|---|---|---|---|
| `docs/GDD.md:222` (Progression table, Skills row) | mults 1.8/1.8/1.6/1.1 | 1.08/1.08/1.08/1.1 (`skills.go:106`) | D149, 2026-08-30 |
| `docs/GDD.md:209-210` (two rows of the movement table) | base 280, +5 a level, 550 ms at level 1, beats at 5, 12, 20, 31, 45 | 300, +4, 500 ms, beats at 10, 20, 34, 51 (`game.go:89,123`); `docs/GDD.md:204` has the right numbers | D137/D138, 2026-08-21 |
| `studies/curves-asterion/notes/CONTEXT.md:43-44` | 280 + 5, beats 5/12/20/31/45 | same correction | |
| `docs/GDD.md:273` | "35 spells", three masters | 45 spell files; 42 lessons at the three masters (Maera 17, Vero 18, Ubbo 7) | |
| `server/internal/game/phase5_test.go:15-16,25` | rat gives 8 exp, 480 exp/h | `rata_parda.yaml:8` exp 2 (D69 derivation, `max_farm_level` 3); the harness measures a level-1 rat at 384 exp/h anyway (8.8 s kill + 10 s overhead) | D69, 2026-07-31 |
| `docs/systems/telemetry.md` event table | 22 kinds | code also emits `hole`, `teleporter`, `melee`, `distance`, `conjure`, `rune_spell`, `reagent`, `item_gained`, `field_animation` (grep of `Kind: "` in `server/internal/`) | |

### Inferences
- The test still passes because its criterion is "under one hour at level 4", and both 8 exp and the harness's 384 exp/h clear it; it does not guard the number it claims to. [I]
- `max_farm_level` is documented as a field the server never reads (`docs/GDD.md:411`). It is the one content number this study's curve depends on, so any tuning of the exp ladder goes through the sheet, not the code. [I]

### Gaps
- No creature-side exp bonus for party size beyond the flat 20 %; the harness cannot show two attackers (`party.go:57-62`), so grouping's real exp/h is unmeasured.

## Q2. The curves on one axis of hours

### Takeaway
Three curves, three slopes: exp per level is flat in hours (Takeaway 1), skills are a geometric 1.08 whose hours double every 9 levels, magic is a geometric 1.4 whose hours double every two levels. A character's level, skill and magic therefore drift apart from the first week.

### Cited findings

Exp, HP, mana, speed by level (`model.py` on `stats.go:15-25,46`, `game.go:89,123,280`). [K, E1]

| Level | Exp | Step to next | Max HP | Max mana | Speed | Beat ms |
|---|---|---|---|---|---|---|
| 1 | 0 | 100 | 150 | 110 | 300 | 500 |
| 2 | 100 | 100 | 155 | 120 | 304 | 500 |
| 5 | 800 | 700 | 170 | 150 | 316 | 500 |
| 8 | 4,200 | 2,200 | 185 | 180 | 328 | 500 |
| 10 | 9,300 | 3,700 | 195 | 200 | 336 | 450 |
| 15 | 37,800 | 9,200 | 220 | 250 | 356 | 450 |
| 20 | 98,800 | 17,200 | 245 | 300 | 376 | 400 |
| 25 | 204,800 | 27,700 | 270 | 350 | 396 | 400 |
| 30 | 368,300 | 40,700 | 295 | 400 | 416 | 400 |
| 35 | 601,800 | 56,200 | 320 | 450 | 436 | 350 |
| 40 | 917,800 | 74,200 | 345 | 500 | 456 | 350 |
| 50 | 1,847,300 | 117,700 | 395 | 600 | 496 | 350 |
| 60 | 3,256,800 | 171,200 | 445 | 700 | 536 | 300 |
| 80 | 7,915,800 | 308,200 | 545 | 900 | 616 | 250 |
| 100 | 15,694,800 | 485,200 | 645 | 1,100 | 696 | 250 |
| 120 | 27,393,800 | 702,200 | 745 | 1,300 | 776 | 200 |
| 150 | 54,042,300 | 1,102,700 | 895 | 1,600 | 896 | 200 |

Walk beat by level (`model.py`; the code comment lists the first four, `game.go:100`). [K, E1]

| Levels | Speed | Beat per tile | Tiles per minute |
|---|---|---|---|
| 1 to 9 | 300 to 332 | 500 ms | 120 |
| 10 to 19 | 336 to 372 | 450 ms | 133 |
| 20 to 33 | 376 to 428 | 400 ms | 150 |
| 34 to 50 | 432 to 496 | 350 ms | 171 |
| 51 to 75 | 500 to 596 | 300 ms | 200 |
| 76 to 113 | 600 to 748 | 250 ms | 240 |
| 114 to 175 | 752 to 996 | 200 ms | 300 |

A level-1 character crosses the 459 steps to the black iron chain's step 7 (`docs/GDD.md:380`) in 3.8 min; a level-51 in 2.3 min. The 30 min corpse window is eight to thirteen such walks. [K, E1]

Hours to reach a level under three exp/h ladders (`hours.py`). "Band ladder" is the median exp/h of the creatures whose `max_farm_level` is within level-3 to level+7 that the harness kills at 10 % death risk or less, with the realistic kit for that level, interpolated between the eight levels run (384 at level 1, 2,361 at 5, 5,409 at 8, 19,663 at 15, 37,617 at 25, 210,981 at 50, 410,169 at 80, 660,520 at 120). "x3" multiplies the harness's 10 s per-kill overhead into a session with walking, eating and looting. "1,500" is the harness's own default assumption (`balance.go:128`). [K, E1] on the rows, [I] on the x3 and on interpolation.

| Reach level | Band ladder (h) | Band x3 (h) | 1,500 exp/h (h) | 45 min sessions (band x3) |
|---|---|---|---|---|
| 5 | 0.7 | 2.2 | 1 | 3 |
| 8 | 1.7 | 5.2 | 3 | 7 |
| 10 | 2.5 | 7.6 | 6 | 10 |
| 15 | 4.6 | 13.8 | 25 | 18 |
| 20 | 7.2 | 21.6 | 66 | 29 |
| 25 | 10.5 | 31.4 | 137 | 42 |
| 30 | 13.7 | 41.1 | 246 | 55 |
| 35 (Ingwen) | 16.4 | 49.3 | 401 | 66 |
| 40 | 19.0 | 57.1 | 612 | 76 |
| 50 | 24.4 | 73.2 | 1,232 | 98 |
| 60 | 30.2 | 90.7 | 2,171 | 121 |
| 80 | 43.8 | 131.5 | 5,277 | 175 |
| 100 (Gorothland) | 60.3 | 181.0 | 10,463 | 241 |
| 120 | 79.9 | 239.8 | 18,263 | 320 |
| 150 | 115.8 | 347.4 | 36,028 | 463 |

Hours for one level at the key levels: level 10, 0.39 h band / 2.5 h at 1,500; level 30, 0.56 h / 27 h; level 50, 0.56 h / 78 h; level 100, 0.91 h / 323 h. The spread between the two ladders is the whole question of this study: the content is tuned so that each band's creature is a flat hour, and the 1,500 figure the harness was written with is what a level-8 character on Akron actually earns on real creatures with walking.

Skill level against hours of session (harness `-skills`; "session" assumes half the time swinging, `skills.txt`, `balance.go:129`). [K, E1]

| Skill level | Sword tries this level | Sword cumulative | Sword h session | Distance h | Shielding h | Fishing h |
|---|---|---|---|---|---|---|
| 15 | 68 | 292 | 0.3 | 0.2 | 0.7 | 0.1 |
| 20 | 99 | 720 | 0.8 | 0.5 | 1.6 | 0.4 |
| 25 | 146 | 1,349 | 1.5 | 0.9 | 3.0 | 0.7 |
| 30 | 215 | 2,277 | 2.5 | 1.5 | 5.1 | 1.3 |
| 40 | 465 | 5,648 | 6.3 | 3.8 | 12.6 | 3.6 |
| 50 | 1,005 | 12,932 | 14.4 | 8.6 | 28.8 | 9.8 |
| 60 | 2,171 | 28,663 | 31.8 | 19.1 | 63.7 | 25.8 |
| 70 | 4,687 | 62,631 | 69.6 | 41.7 | 139.2 | 67.4 |
| 80 | 10,120 | 135,967 | 151.1 | 90.6 | 302.2 | 175.2 |
| 90 | 21,849 | 294,306 | 327.0 | 196.2 | 654.1 | 454.9 |
| 100 | 47,171 | 636,150 | 706.8 | 424.1 | 1,413.7 | 1,180.4 |
| 110 | 101,840 | 1,374,175 | 1,526.9 | 916.1 | 3,053.8 | 3,062.1 |
| 120 | 219,866 | 2,967,521 | 3,297.2 | 1,978.3 | 6,594.6 | 7,942.7 |

Read against the level table: a character that reaches level 35 in 16 to 49 hours has sword 50 to 62 and shielding 40 to 50. The harness's own skill estimate (`SkillAtFrom`, `balance.go:136-157`) gives a level-30 character sword 86 at 1,500 exp/h because 368,300 exp at 1,500 an hour is 245 hours of play; at the band ladder it is 14 hours and sword 50. The two readings of "what skill does a level-30 have" differ by 36 points, and the creature roster was sized against skill about level (`skills.go:97-100`). [K, E1] [I] on the consequence.

Magic level against mana spent (`model.py` on `skills.go:250`; 600 mana/h is food-only regen, `game.go:157`; 5,400 mana/h is `vara de la chispa` firing 3 mana every 2 s, `content/items/vara_de_la_chispa.yaml:8`; gold at 60 per 65 mana, `tomas.yaml:110`, `pocion_mana.yaml`). [K, E1]

| Magic level | Mana for this level | Cumulative | Hours fed, no potions | Hours at wand rate | Gold if potion-fed |
|---|---|---|---|---|---|
| 1 | 1,600 | 1,600 | 2.7 | 0.3 | 1,477 |
| 3 | 3,135 | 6,975 | 11.6 | 1.3 | 6,438 |
| 5 | 6,146 | 17,511 | 29.2 | 3.2 | 16,164 |
| 6 (Maera's ceiling) | 8,605 | 26,116 | 43.5 | 4.8 | 24,107 |
| 8 (Ubbo's floor) | 16,866 | 55,029 | 91.7 | 10.2 | 50,796 |
| 10 (first wand) | 33,057 | 111,698 | 186.2 | 20.7 | 103,106 |
| 11 (last spell) | 46,280 | 157,978 | 263.3 | 29.3 | 145,826 |
| 15 (second wand) | 198,000 | 867,175 at 16 | 1,445 | 161 | 800,469 |
| 20 (third wand) | 1,338,692 at 21 | 4,681,414 | 7,802 | 867 | 4,321,305 |

`manaForNextML` saturates at magic level 45 (`skills.go:247-248`), which is a soft ceiling nobody will meet.

Cost of a death in minutes (`hours.py`, `model.py`; loss is 10 % of exp at the bottom of the level, `corpse.go:367`; the two calibration points are `phase5_test.go:36-57` at 480 exp/h). [K, E1]

| Level | Exp lost (bottom) | Minutes at 480 exp/h (test) | Band ladder | Band x3 | At 1,500 exp/h |
|---|---|---|---|---|---|
| 4 (top, 80 exp) | 40 (80 at top) | 5 (10 at top, the test's first point) | 1 | 4 | 2 |
| 8 | 420 | 52 (the test's second point) | 5 | 14 | 17 |
| 10 | 930 | 116 | 6 | 18 | 37 |
| 15 | 3,780 | 472 | 12 | 35 | 151 |
| 20 | 9,880 | 1,235 | 21 | 62 | 395 |
| 25 | 20,480 | 2,560 | 33 | 98 | 819 |
| 30 | 36,830 | 4,604 | 31 | 92 | 1,473 |
| 40 | 91,780 | | 39 | 117 | 3,671 |
| 50 | 184,730 | | 53 | 158 | 7,389 |
| 80 | 791,580 | | 116 | 347 | 31,663 |
| 100 | 1,569,480 | | 176 | 528 | 62,779 |
| 120 | 2,739,380 | | 249 | 747 | 109,575 |

Dying at the top of a level costs up to twice the bottom figure (the test calls this "the classic 7.x sting for banking exp", `phase5_test.go:55-57`). Skills and magic are never lost, so the gear roll is the only other stake: with nine worn slots at 10 %, a death costs no gear 39 % of the time (`equipment.go:468-469`), one piece most of the rest.

### Inferences
- The flat hour per level is a property of D69, not a tuning accident. If the group wants "levels in weeks" (vision §2.4) at the harness's kill rates, the knob is the overhead between kills (travel distance to the band, spawn density, food), or the `/100` divisor in D69's formula, not the cubic. [I]
- Because death cost is L/30 of an hour-per-level, the design's "one session" calibration is a moving target: at level 8 a death is a coffee break, at level 50 it is a session, at level 120 it is a weekend. The twins' answer to this (Tibia's blessings, RuneScape's gravestone) is agent 2's question. [I]

### Gaps
- No measured exp/h from real play exists (Q7). The band ladder is a stand-and-trade number with 10 s of overhead; the 3x is a guess. One telemetry session would replace both.
- The harness runs melee only. Distance and wand characters have no exp/h ladder.

## Q3. What the harness says about hunting, level by level

### Takeaway
At every level there is one safe creature that out-earns the band by a factor of two to five, and at low levels it is on the wrong continent. Death risk is a cliff, not a slope: a creature either kills the harness character 0 % or 100 % of the time, with very few in between.

### Cited findings

Kits are the harness's named equipment sets (`server/cmd/balance/main.go:61-148`): `inicial` (short sword and shield), `cuero` (plus the leather set from Tomás, 210 gold), `raben (15)`, `campanas (25)`, `juramento (40)` (shop tiers by level), `cuadrilla`, `hierro negro`, `nácar` (quest sets), `banda C` and `banda D` (Ingwen and Gorothland shop ceilings), `antiguos` (banda D with the golem-only sword, attack 50). [K, E1]

Best safe targets by level (death risk 5 % or less, 60 trials, `levels.txt`, `best.py`). "Safe" counts creatures killable at 5 % or less out of 183 non-dummy creatures; "always die" counts 100 % death. [K, E1]

| Level | Kit | Safe / always die | Best exp/h (creature, time to kill) | Best band creature (mfl, exp/h) | Notable risks |
|---|---|---|---|---|---|
| 1 | inicial | 7 / 174 | 1,350 (sapo de cueva, 48.7 s) | lobo cinza (5, 914) | esqueleto 20 %; oso pardo, troll de la cantera 100 % |
| 1 | cuero | 13 / 160 | 10,769 (enano aldeano, 238 s) | esqueleto (10, 3,066) | oso pardo 100 % |
| 5 | cuero | 18 / 154 | 11,405 (enano aldeano, 224 s) | esqueleto (10, 4,617) | oso pardo 100 % (band 12 creature) |
| 8 | cuero | 37 / 141 | 29,631 (enano aldeano, 80 s) | arquero goblin (14, 12,801) | berserker orco 67 %; comehuesos 100 % |
| 15 | raben (15) | 84 / 96 | 123,800 (ordo el capataz, boss, 39.8 s) | vigía de hueso (18, 29,982) | none in band |
| 25 | campanas (25) | 99 / 82 | 166,498 (ordo el capataz, 27 s) | cerdoso el porfiado (30, 68,202) | none in band |
| 50 | juramento (40) | 143 / 32 | 588,777 (el invocador, 13.9 s) | la tejedora de la sima (50, 254,486) | none in band |
| 80 | banda C | 143 at 10 % | 491,610 (el ojón, 16.1 s) | el ojón (86) | one band creature always kills |
| 120 | banda D | 6 of 11 band safe | 827,470 (abrojo naranja, 20.5 s) | abrojo naranja (120) | reptante del umbral, araña de sebo, coronado de púas 100 % |

Gold per hour (economy run, 40 trials, `economy.txt`). [K, E1]

| Level | Kit | Best gold/h (creature) | Best exp/h (creature) | Exp lost at top of level | Minutes to recover at that exp/h |
|---|---|---|---|---|---|
| 1 | inicial | 841 (lobo cinza) | 913 (lobo cinza) | 10 | 0.7 |
| 5 | inicial | 1,382 (jabalí cerdoso) | 2,132 (sapo de cueva) | 150 | 4 |
| 5 | cuero | 2,629 (arquero goblin) | 8,232 (arquero goblin) | 150 | 1 |
| 8 | cuero | 4,110 (arquero goblin) | 29,483 (enano aldeano) | 640 | 1.3 |
| 15 | inicial | 6,032 (huargo) | 73,994 (enano aldeano) | 4,700 | 4 |
| 15 | cuero | 255,662 (cochinilla farolera) | 75,034 (enano aldeano) | 4,700 | 4 |
| 25 | inicial | 349,377 (cochinilla farolera) | 100,800 (enano aldeano) | 23,250 | 14 |
| 25 | cuadrilla | 596,801 (nodriza de cristal) | 175,453 (vurk el descabezador) | 23,250 | 8 |

Realistic Akron gold at levels 1 to 8 is 450 to 4,100 an hour against a leather set at 210, a bag at 20, potions at 45 and 60, boots at 2,500 and the first wand at 1,200 (`tomas.yaml:10,110-112`, `high-tier-items.md:71`). The `cristal` rows are a content fact (Takeaway 6): ten creatures drop a 10,000-gold coin (`grep "item: cristal" content/creatures/`), the lowest band of them `cochinilla farolera` at 20 and `nodriza de cristal` at 25 % x 1-2.

What the harness does not model (`docs/systems/balance.md`, `balance.go` header, `CLAUDE.md` harness bullet): movement and travel, food, potions, player spells, fleeing, respawn waits, group encounters, escorts and surrounding spawns, geography (any creature at any level), ammunition and consumable cost. It starts every fight at full HP beside the creature and adds 10 s per kill. [K, E1]

### Inferences
- "Safe" is binary because mitigation is flat and damage bands are narrow (D8): once a creature's low roll clears the character's block plus armour by more than the food regen, the fight is decided by HP pools, and the harness runs no potions. Real play with a 2 s potion clock would blur the cliff. [I]
- The level-15 kit already kills Akron's named bosses (ordo el capataz 0 % death) and Akron has nothing left to threaten a level-25 in its shop kit (99 safe, 82 always die, none in band). Ingwen's 35 is therefore a soft wall by geography, not by danger. [I]

### Gaps
- The harness's 10 s overhead is the single most load-bearing unmeasured number in this note.

## Q4. Content inventory as it bears on the curve

### Takeaway
Creatures are evenly spread across 175 levels of band; items with level gates are not. Sixty-one of the 131 gated items sit between levels 11 and 20, eighteen past level 35.

### Cited findings

Creatures by `max_farm_level` band (240 files, `creatures.psv`). [K, E1]

| Band | Species | Where spawned (species count per world, from `maps/spawns.json` and `maps/worlds/<w>/z*.json`) |
|---|---|---|
| 1 to 10 | 19 | Akron 10, Gorothland 5 (villagers), Ingwen 1 |
| 11 to 20 | 20 | Akron 6, Ingwen 4, Gorothland 4 |
| 21 to 35 | 24 | Akron 3, Ingwen 4 |
| 36 to 50 | 38 | Akron 4, Ingwen 8 |
| 51 to 70 | 16 | Ingwen 11, Gorothland 3 |
| 71 to 100 | 42 | Ingwen 12, Gorothland 4, Boggland 24 |
| 101 to 130 | 41 | Ingwen 4, Gorothland 5, Boggland 32 |
| 131 to 175 | 40 | Gorothland 8, Boggland 32 |

Spawn entries: Akron 103 entries, 24 species, band 0 to 90 (`maps/spawns.json`); Ingwen 197 entries, 44 species, band 10 to 120; Gorothland 381 entries, 29 species, band 1 to 175; Boggland 428 entries, 88 species, band 75 to 175 (`maps/worlds.json`, chunk files). The highest creature is Goroth el último, band 175, 15,052 exp, 5,500 HP (`content/creatures/goroth_el_ultimo.yaml`). Akron's most spawned creatures are rata parda (11 spawns), troll de la cantera and esqueleto (9 each), araña de cueva (8), lobo cinza (7). [K, E1]

Named creatures: 41 creature files carry a boss or jefe marker; the harness prefixes them with `*`. Thirteen named creatures are kill targets of quests (`content/quests/*.yaml`: la tejedora de la sima, ordo el capataz, ulric del cinto rojo, troll del embarcadero and nine more). Ingwen and Gorothland each carry eleven hunting contracts (five deliveries, five counted hunts of 1 to 10 kills, one summoned boss) plus one travel introduction (`docs/systems/hunting-contracts.md:3-4`). Akron has 36 quest files in total, the censo chain and the black iron chain among them. [K, E1]

Items by `min_level` (131 of 369 items carry one). [K, E1]

| Band | Items | Examples |
|---|---|---|
| 1 to 10 | 28 | leather set, short sword (no gate) |
| 11 to 20 | 61 | raben tier at 15, boots at 15, campanas tier at 20 and 25 |
| 21 to 35 | 24 | guarnición 28, desertor 31, molino 34 |
| 36 to 50 | 5 | fosas 37, juramento 40 |
| 51 to 70 | 5 | espada glacial 55, hoja de ámbar 62, colmillo del sol 70 |
| 71 to 100 | 7 | filo de amatista 78, mandoble de jade 86, colmillo del invierno 100, grebas de cristal 100 |
| 101+ | 1 | devoradora carmesí 120 (worth 6,800) |

Wands gate on magic level, not character level: vara de la chispa (magic 10, 3 mana a shot, 18-26 fire, 1,200 gold at Maera), vara del ojo carmesí (15, 7 mana, 36-50 energy, 8,000 at Vero), vara del oráculo (20, 12 mana, 56-72 shadow, 24,000 at Ubbo) (`content/items/vara_*.yaml:8`, `docs/systems/high-tier-items.md:71-73`). The two high gates were lowered from 25/50 on 2026-09-11 (`docs/GDD.md:245`). [K, E1]

Spells: 45 files; 18 attack, 5 healing, 22 support (runes, buffs, fields). By `min_magic_level`: 1: 6, 2: 2, 3: 3, 4: 8, 5: 5, 6: 7, 7: 3, 8: 3, 9: 3, 10: 3, 11: 1 (`content/spells/*.yaml`). Teachers (`content/npcs/maera.yaml`, `vero.yaml`, `ubbo.yaml`, `docs/GDD.md:273`): Maera 17 lessons, the first several free, then 25 to 30 gold or an item (a colmillo for Lengua de fuego); Vero 18 lessons at 60 to 200 gold, two requiring a known spell; Ubbo 7 lessons at 400 to 1,000 gold, five requiring the small version. Magic level 11, the last spell gate (Martillo de la sima), is 158,000 mana spent: 263 fed hours or 146,000 gold in potions. [K, E1]

### Inferences
- The item ladder stops where Akron stops. Past level 35 a character changes gear five times in 85 levels, so the power curve from level 36 to 120 is almost all skill rungs and HP; felt progression has to come from the creature roster and the worlds. [I]

### Gaps
- Items by slot per band, and the quest-only sets (hierro negro, nácar, cuadrilla), were not tabulated here; the harness kits show their effect (Q3).

## Q5. Friction and fun at minute 5, 30, 120 and at session 1, 10, 50

### Takeaway
The first hour is scripted and safe; the first death is likely in hour two or three, from a creature of the next band standing next to the current one; by session ten the player has left the content the design documents describe.

### Cited findings
- Minute 0 to 5. Welcome card (75 s, closes on `Ya voy`), say `censo` to Elba in the temple, walk to (433,368,7) south of town, hand in: 72 exp and 8 gold (`docs/systems/onboarding.md`, `content/quests/censo_tortuga_coja.yaml`). A rat is 15 HP, 1-3 damage, 8.8 s to kill, 34 rats per HP bar at level 1 with the starting sword and shield (`levels.txt`, level 1 inicial). Walk beat 500 ms. [K, E1]
- Minute 30. The five censo steps pay 360 exp and 40 gold (five hand-ins at 72 and 8), which is level 3 with 40 to spare toward level 4 (400). Step 3 sends the player to Tomás for a torch (10 gold); step 5 to Sila for the heartstone (free). The leather set is 210 gold, the bag 20, meat 8 for 180 s of food and 60 HP (`tomas.yaml:10,110-112`, `game.go:150-156`). At 450 gold an hour from rats, leather is a half-hour purchase. [K, E1]
- Minute 120. On the band ladder the character is level 5 to 7 (800 to 2,800 exp). At level 5 in leather, oso pardo (band 12, spawned 6 times on Akron) kills the harness character 100 % of the time and esqueleto (band 10) is the safe target; at level 1 the esqueleto itself is a 20 % death (`levels.txt`). The first death costs 80 to 280 exp (10 to 20 minutes), the bag, a 10 % roll on each worn slot, and a walk of at most 4 minutes at the 500 ms beat; the corpse waits 30 minutes; the temple heals for free; the dead character carries a four-slot Saco del Templo until a bag is bought (CLAUDE.md, Saco bullet). [K, E1] [I] on level reached.
- Session 1 (45 min): level 3 to 4, censo done, torch and heartstone in hand.
- Session 10 (7.5 h): level 10 to 15 on the band ladder, 8 to 10 with 3x overhead; sword 40 to 47; the first beat change (level 10, 450 ms) arrives here; Maera's free lessons and Aliento vital at magic 1 (1,600 mana, 2.7 fed hours). [K, E1] [I]
- Session 50 (37.5 h): level 28 to 45 on the band ladder, 25 to 30 with 3x; Ingwen's 35 falls between session 40 and 65; sword 60 to 65 (31.8 h to 60, 69.6 h to 70); magic 5 to 6 on food alone (29 to 43 fed hours), 8 if about 50,000 gold went into potions. [K, E1] [I]

### Inferences
- MDA aesthetics by phase: minutes 0 to 30 are Discovery and Submission (follow the chain, learn the town); hour two is the first Challenge beat and the first Fellowship moment if a friend walks the corpse run with you; sessions 10 to 50 are Challenge with a thin Expression layer (gear changes stop at 35). [I]
- The first-death friction the first group playtest reported ("the early levels punish one bad fight for a very long time", `docs/GDD.md:372`) was answered by D30 with the temple heal and faster food, not by softening oso pardo; the harness still shows a band-12 creature at 100 % death for a level-5 leather character two screens from town. That is the cliff the next playtest will meet. [I]

### Gaps
- No funnel exists for the censo chain (telemetry off), so "how many reach step 5" is unknown.

## Q6. Asterion's own natural experiments (decisions log)

### Takeaway
Fourteen dated changes touch the curves. Nine came from a playtest sentence, four from the harness, one from a bug measurement. Every one moved a single constant and left the others, which is D87's stated rule ("move the price or move the value, never both", `skills.go:43-45`).

### Cited findings

| Id | Date | What changed | Why (designer's stated reason) | Before and after |
|---|---|---|---|---|
| D9 | 2026-07-13 (Phase 2, 95b8547d) | Death = flat 10 % exp + corpse + temple respawn; skills and mana spared | Calibrated to "about one session" (vision §2.5) rather than a percent | 10 %; test points 10 min at level 4, 52 min at level 8 at 480 exp/h (`docs/GDD.md:360,262`, `phase5_test.go`) |
| D10 | 2026-07-13 (Phase 3, a122bc38) | Magic multiplier 1.4, not OT's vocation-less 4.0 | "the pillar is slow, not impossible" in 45-minute sessions | at 4.0 magic 5 would need 1,600 x (4^5 - 1)/3 = 546,000 mana; at 1.4 it is 17,511 (`docs/GDD.md:361`, `skills.go:246`) |
| D30 and food | 2026-07-26 (845f1018, "the first playtest's nine notes") | Temple heals free; HP regen 6 s to 3 s per HP | First group playtest: early levels punish one bad fight for a long time; "the healing rate of meat is slow" | one meat 30 HP to 60 HP; mana regen left at 6 s (`game.go:150-157`, `docs/GDD.md:372`) |
| F-003 | 2026-07-28 (9f27fa1a, "measure the curve instead of arguing about it") | Skill mults 2.0/2.0/1.5 to 1.8/1.8/1.6; the harness `-skills` was written for it | sword 10 to 25 cost 910 h; shielding outran sword 4.5 : 1 | sword 10 to 20: 28.4 h to about 12 h; shield gap 4.5x to 1.2x (`skills.go:13-30`) |
| D38 | 2026-07-28 (bd1a5806) | Own corpse 4 + 4 min to 15 + 15 min | step 7 of the black iron chain is 459 steps out; eight minutes deleted a distant bag instead of risking it | 8 to 30 min (`corpse.go:29-30`, `docs/GDD.md:380`) |
| F-095 | 2026-07-29 (wishlist #6, "se siente, pero podría ser un poquito más notorio") | speed per level +3 to +5 | the beat boundaries, not the constant, make a level felt | boundaries under 20: two (8, 19) to three (5, 12, 20) (`docs/GDD.md:210`, `docs/BACKLOG.md:7400`) |
| D44 / F-100 | 2026-07-29 (7f751318) | Heartstone: free recall, 30 min cooldown, out of combat only, destroyed by death | "a shortcut home, not an escape"; keeps the corpse run | wishlist asked for 1 per 4 h (`docs/BACKLOG.md:1599-1605`, `docs/GDD.md:386`) |
| D57 | 2026-07-30 (v17, b1007d1e) | Mana pool `50 + 5L` to `100 + 10L`; three spell clocks | one global exhaust could not shape a fight with 30 spells | level-10 mana 100 to 200 (`game.go:265-280`, `docs/GDD.md:399`) |
| D69 | 2026-07-31 (balance sheet F-158) | creature `exp` derived from `max_farm_level`: 100 kills per level | 36 hand-chosen exp numbers were incomparable | rat 8 exp to 2 exp (the test still says 8) (`docs/GDD.md:411`) |
| D85 | 2026-08-03, amended 2026-08-16 | potion exhaust none to 4 s to 2 s, one clock for all bottles | playtest 2026-08-03: a hundred potions were "a second health bar"; Esen cut 4 to 2 after playing it | a 30 s fight holds 7 sips at 4 s, 15 at 2 s (`game.go:218-262`, `docs/GDD.md:433`) |
| D87 | 2026-08-03 | Skill knee at 40: x1.25 below (1.20 shielding), F-003 slopes above | playtest 2026-08-03: "a partir de nivel 18 no vale la pena subir skill"; level 18 cost 7.6 h for two damage points | espada 18: 7.6 h to 66 min; 40: 179 h; but 45 to 46 became 763,000 swings (`docs/GDD.md:435`, `skills.go:50-60`) |
| D113 | 2026-08-12 (9ca4da22) | Heartstone cooldown 30 to 5 min | the out-of-combat gate protects P2 and P6, not the length; thirty minutes bought dead time | 30 to 5 (`recall.go:43`, `docs/GDD.md:457`) |
| D137 / D138 | 2026-08-21 (9defeed6) | Tick 100 to 50 ms; step a whole number of ticks; diagonal costs sqrt 2; base speed 280 to 300, per level +5 to +4 | Esen: a stutter after every tile; diagonals slower than straight. Level 1 announced 550 ms, kept 600 | level 1: 600 ms real to 500 ms (17 % faster); diagonal 2 beats to 1.41; boundaries 5/12/20/31/45 to 10/20/34/51 (`game.go:80-123`, `docs/GDD.md:482-483`) |
| D147 | 2026-08-29 | Gorothland reached from Ingwen, not Akron | "geography is the level ladder": 1-35, 35-100, 100+ | boat Akron to Ingwen, Ingwen to Gorothland (`docs/GDD.md:492`) |
| D149 | 2026-08-30 (d4d4a0bf) | One slope 1.08, no knee; `skillRung` halves a rung's weight; gates moved 25/30/40 to 40/50/70; clean blocks train shielding again | nobody priced past the knee: 45 to 46 was 424 h in the air, 48 idle hours for one shielding point; a veteran was 40 to 50 because 50 was unreachable | espada 40: 179 h to 6.3 h; 50: 14.4 h; 100: 707 h; a level-30 harness character went from sword 41 to 86 so rung weight halved (`skills.go:62-100`, `docs/GDD.md:494`) |

### Inferences
- D87 to D149 is the cleanest natural experiment in the set: a player sentence produced a knee, the knee produced a wall nobody saw for 27 days, and the fix was to go back to Tibia's shape with a gentler slope. The lesson for the twins study is that a request about level 18 is a request about the first ten hours, and a curve answered there must be priced at hour 500 as well. [I]
- The playtest of 2026-08-03 produced D85, D87 and D108 on the same day; the only one with before-and-after numbers in play is D87, from the harness. No change in the log has a measured player reaction after it. [I]

### Gaps
- No decision cites a measured session; the "after" numbers are all harness or arithmetic.

## Q7. What is instrumented

### Takeaway
A complete event stream exists and is switched off. For a 5-player group, one evening with `-telemetry` on would produce every curve in Q2 from real play.

### Cited findings
- Recording is server-side JSONL behind `-telemetry <path>`; empty path disables; the live deploy leaves it unset ("APAGADA por defecto", `deploy/pull-telemetry.sh:14`; `docs/systems/telemetry.md`; CLAUDE.md "off unless you pass the flag"). No client message, no public endpoint, no in-game stats window. [K, E1]
- Events documented: `session_start`, `session_end` (duration, net exp), `kill` (creature, exp, fight duration from first damage, position), `death` (source, exp lost, level, position), `level`, `damage_taken`, `damage_dealt`, `heal`, `mana`, `consume`, `loot_take`, `item_destroy`, `shop_buy`, `shop_sell`, `gold`, `quest_offered/accepted/complete/reset`, `quest_step` (time since previous step), `ferry`, `equip`, `unequip` (`docs/systems/telemetry.md`). Code adds `hole`, `teleporter`, `melee`, `distance`, `conjure`, `rune_spell`, `reagent`, `item_gained`, `field_animation`. The kill record carries the killer's share only, not every party member's. [K, E1]
- Reader: `go run ./cmd/sessionreport [-char] <file>` gives per-character session, combat, consumption, economy, equipment and quest tables. `census/` counts saved items without levels; `/ranking` publishes level, exp, magic, the four skills, kills and deaths from SQLite (`CLAUDE.md`, standings bullet). [K, E1]
- Not measured anywhere: level distribution over time, session lengths, exp/h in play, deaths by level and place, corpse recovery rate, time between censo steps, potion and food spend per hour, party exp share. [K, E1]

What a 5-player group could measure with the flag on, from existing events only. [I]

| Question in this study | Events | Derived number |
|---|---|---|
| Real exp/h by level band and world | `kill` (exp, level), `session_start/end` | exp/h per level, the 3x overhead in Q2 |
| Cost of a death in minutes | `death` (exp lost), exp/h above, `loot_take` after death | minutes lost, bag recovered or not |
| Corpse run length | `death` position, next `loot_take` at that position | walk time, share recovered within 30 min |
| Hours per level | `level` timestamps | the Q2 table from play |
| Skill hours | none directly; `damage_dealt` count is swings | tries per session |
| Magic hours and gold | `mana` spent, `shop_buy` of pocion_mana, `gold` | mana per hour, gold per magic level |
| Onboarding funnel | `quest_step` with time since previous step | censo drop-off per step |
| Food and potion load | `consume`, `heal` with source `comida` | share of healing from food vs potions vs temple |
| Party share | `kill` per member in the same minute | exp/h grouped vs solo |

### Gaps
- The ranking page is the one live data source and it carries levels; a scrape of it over weeks would give the level distribution without turning telemetry on.

## Q8. Tuning knobs

| Knob | Where | Now | Moves |
|---|---|---|---|
| Exp curve | `stats.go:20` | cubic / 6 x 100 | every exp number in the game; the content's `exp` is derived from it (D69) |
| Creature `max_farm_level` | `content/creatures/*.yaml` (sheet column G) | 1 to 175 | that creature's exp via `(exp(L+1) - exp(L))/100`; where it sits on the ladder |
| D69 divisor | the balance sheet formula (not in code) | 100 kills per level | hours per level everywhere at once |
| Max HP per level | `stats.go:46` | 5 | survivability vs creature damage bands; kills per HP bar |
| Max mana per level | `game.go:280` | 10 | spell sustain; magic training rate without potions |
| `skillBase` | `skills.go:102` | 50/30/100/20 | the first evening's skill pace; shielding at 2x sword |
| `skillMult` | `skills.go:106` | 1.08 x3, 1.1 fishing | doubling time of skill hours (9 levels at 1.08) |
| `skillRung` | `skills.go:119-121` | half a rung per level above 10 | how much damage, block and miss a skill level buys |
| Skill gates in points | `content/creatures/golem` `min_skill` 40; achievements 50, 70; `shieldingCleanBlock` 50 (`game.go:214`) | | when content opens |
| Magic multiplier | `skills.go:250` | 1.4 | doubling time of magic hours (2 levels) |
| Wand `min_magic_level` | `content/items/vara_*.yaml:8` | 10/15/20 | when a caster becomes a wand user |
| Spell `min_magic_level`, `mana` | `content/spells/*.yaml` | 1 to 11; 12 to 195 mana | spell ladder; mana spent per cast and so magic rate |
| Lesson prices | `content/npcs/{maera,vero,ubbo}.yaml` `condition: consume_gold` | free to 1,000 | gold sink size on the magic path |
| `attackInterval` | `game.go:143` | 2,000 ms | tries per hour for sword, shielding; time to kill |
| Damage coefficients | `combat.go:627` | 0.075 and 0.3 | weight of skill vs level in damage |
| Armour absorb | `combat.go:666` | ceil(armor/2) | the mitigation floor |
| Block coefficients | `combat.go:989` | 0.015 and 0.1 | value of a shielding rung |
| Ranged miss | `game.go:170-188` | 22 % max, 3 % min, 14 over 30 rungs | value of a distance rung |
| `deathExpLoss` | `corpse.go:43` | 0.10 | minutes per death at every level |
| `gearDropChance` | `equipment.go:473` | 0.10 per slot | gear stake (39 % no loss) |
| `playerCorpseDecay`, `playerBonesDecay` | `corpse.go:29-30` | 900 s + 900 s | corpse run window |
| `templeRecallCooldown` | `recall.go:43` | 5 min | return trip length |
| `foodRegenEvery`, `manaRegenEvery`, `foodCap` | `game.go:149,156-157` | 3 s, 6 s, 1,200 s | out-of-town sustain; passive magic rate |
| `edible` on food items | `content/items/*.yaml` | meat 15, fish 12 | seconds of regen per gold |
| `potionExhaust` | `game.go:262` | 2 s | burst healing cap |
| Potion heal/mana bands and prices | `content/items/pocion_*.yaml`, `tomas.yaml:110` | 40-60 HP at 45; 55-75 mana at 60 | gold per HP, gold per magic level |
| `partySharedExpBonusPct`, `partyShareRange` | `party.go:63,68` | 20 %, 30 tiles | grouping's exp/h |
| Speed `baseSpeed`, `speedPerLevel` | `game.go:89,123` | 300, 4 | where the beat boundaries fall |
| Item `min_level` | `content/items/*.yaml` | 131 items, 1 to 120 | the gear ladder |
| Item `speed` | boots +55 | | one beat at levels 15 to 30 |
| Spawn count and placement | `maps/spawns.json`, `maps/worlds/<w>/z*.json` | Akron 103, Ingwen 197, Gorothland 381, Boggland 428 | time between kills (the unmodelled overhead) |
| Censo rewards | `content/quests/censo_tortuga_coja.yaml` | 72 exp, 8 gold per step | first-session level and gold |
| Harness assumptions | `balance.go:128-129`, CLI flags | 1,500 exp/h, 50 % duty, 10 s overhead | what the harness believes about play |

## Pattern cards found in the build

Each card is "how it maps to Asterion" by construction; lineage and twins are agents 1, 2 and 8.

### Farm-level derived exp (flat hour per level)
- Mechanism: `exp = (exp(L+1) - exp(L)) / 100` with `L = max_farm_level`; 100 kills of your band's creature is one level, at any level (`docs/GDD.md:411`).
- Feeling: Challenge paced as Submission; the cubic shows on the exp bar, not on the clock.
- Works when every band has a reachable creature and kill time stays near 10 to 30 s; breaks when the overhead between kills is the whole curve, which is where Asterion's slowness has to live (Q2).
- Cost S; knobs: the 100 divisor, `max_farm_level` per creature, spawn density.

### Flat percent exp loss with skills spared
- Mechanism: 10 % of exp, level recomputed, skills and magic untouched (`corpse.go:43,367`).
- Feeling: Challenge with a known price; cost is L/30 of an hour-per-level, so it grows linearly with level while leveling time does not.
- Works to about level 50 under the "one session" target; past 80 a death is several sessions (Q2 table).
- Cost S; knobs: `deathExpLoss`, or a level-banded loss (the Tibia 8+ and PoE question for agent 2).

### Bag always drops, slots roll
- Mechanism: container slot drops whole, nine other slots at 10 % each (`equipment.go:473-505`); 39 % of deaths lose no gear.
- Feeling: the corpse run is about one object (your bag), which keeps Fellowship (a friend can fetch it) without a shopping trip.
- Cost S; knobs: `gearDropChance`, which slots roll.

### Fixed corpse window
- Mechanism: 30 min own corpse, 8 min creature (`corpse.go:29-30`); flat on purpose so a player can predict "half an hour".
- Works on Akron (any walk under 4 min); untested on Boggland and Gorothland where bands 100+ live.
- Cost S; knob: the two decays.

### Recall that refuses the escape
- Mechanism: free stone, out of combat only, 5 min cooldown, destroyed by death (`recall.go:43`).
- Feeling: shortens the return you chose, never the one things forced; keeps "when do I turn back" as a decision (D44).
- Cost S; knob: cooldown (30 to 5 moved nothing but dead time, D113).

### Town as the safety valve
- Mechanism: free full heal at the temple; wilderness untouched (D30).
- Feeling: Fellowship and Submission at home; Challenge stays outside. What the heal charges is the walk.
- Cost S; knob: which NPC heals (`heals:` in YAML).

### One-slope skill ladder with half-weight rungs
- Mechanism: `base x 1.08^(L - 10)`, `rung = 10 + (L - 10)/2` (`skills.go:101-121`).
- Feeling: the bar moves every session until about 100; the knee's wall is gone.
- Works because every combat reader uses the same rung function; breaks if a reader reads the raw level (fishing does, by design).
- Cost S; knobs: base, mult, rung slope.

### Quantised walk beat as a level reward
- Mechanism: speed per level rounds to the 50 ms beat, so the walk changes at 10, 20, 34, 51, 76, 114 (`game.go:91-123`).
- Feeling: Sensation; a level-up is felt at the boundary and nowhere else; the boots are sized to exactly one beat.
- Cost S; knobs: `speedPerLevel`, item `speed`.

### One clock for every bottle
- Mechanism: 2 s shared exhaust across HP and mana potions, food exempt (`game.go:262`).
- Feeling: Challenge kept in fights; a bag of bottles is not a second health bar.
- Cost S; knob: the exhaust.

### Magic by mana spent, gold as the accelerator
- Mechanism: `1600 x 1.4^ml`; food gives 600 mana/h; a potion is 60 gold per 65 mana (Q2 table).
- Feeling: Expression (the caster path) priced in gold; the three wand gates are the visible rungs.
- Breaks if gold/h outruns the price (the `cristal` droppers at 3,000 gold a kill would pay for magic 10 in 35 kills).
- Cost S; knobs: 1.4, potion price and band, wand gates.

### Measure the curve instead of arguing (the harness)
- Mechanism: `cmd/balance` drives the real `combatTick` on a synthetic clock; `-skills`, `-levels`, `-economy`, `-baseline` (`docs/systems/balance.md`).
- Feeling: none for players; for the team it turns a playtest sentence into a priced change (F-003, D87, D149).
- Breaks on what it does not model: movement, food, potions, groups, geography (Q3).
- Cost already paid; knobs: `-exp-per-hour`, `-swing-duty`, `-overhead`.

## Glossary additions
- Corpse run: the walk from the respawn temple back to your own corpse to recover the bag and any dropped slot, inside the corpse window (30 min here). Source: `docs/GDD.md:260`, `corpse.go:88-92`.
- Band creature: a creature whose `max_farm_level` is at or just above the player's level; by D69 a hundred of them is one level. Source: `docs/GDD.md:411`.
- Skill rung: the combat weight of a skill level, `10 + (L - 10)/2`, as opposed to the level shown on the sheet. Source: `skills.go:111-121`.
- Beat boundary: a level at which the quantised step duration changes (10, 20, 34, 51, 76, 114). Source: `game.go:91-123`.
- Heartstone (piedra de campana): the one-per-character recall stone, out of combat only, 5 min cooldown. Source: `recall.go:43`, `docs/GDD.md:268`.
- Saco del Templo: the four-slot sack a dead character carries until a bag is bought; a state, not an item. Source: `CLAUDE.md` Saco bullet.
- Exp stages: a per-level-band exp multiplier used by Open Tibia servers; not present in Asterion, where the equivalent knob is `max_farm_level` (agent 2 owns the term).

## Sources
- `/Users/esenespinosa/Development/personal/games/mmorpg/server/internal/game/stats.go` (exp, HP, applyLevel, survivalTick)
- `/Users/esenespinosa/Development/personal/games/mmorpg/server/internal/game/skills.go` (skill ladder, rung, magic level)
- `/Users/esenespinosa/Development/personal/games/mmorpg/server/internal/game/game.go` (speed, cadence, food, potion and spell exhaust, shot miss)
- `/Users/esenespinosa/Development/personal/games/mmorpg/server/internal/game/combat.go` (damage band, absorb, block)
- `/Users/esenespinosa/Development/personal/games/mmorpg/server/internal/game/corpse.go` (death penalty, corpse windows)
- `/Users/esenespinosa/Development/personal/games/mmorpg/server/internal/game/equipment.go` (gear drop)
- `/Users/esenespinosa/Development/personal/games/mmorpg/server/internal/game/recall.go`, `cooldown.go` (heartstone)
- `/Users/esenespinosa/Development/personal/games/mmorpg/server/internal/game/party.go` (exp share)
- `/Users/esenespinosa/Development/personal/games/mmorpg/server/internal/game/balance.go`, `server/cmd/balance/main.go` (harness, kits)
- `/Users/esenespinosa/Development/personal/games/mmorpg/server/internal/game/phase5_test.go` (TestDeathPenaltyCalibration)
- `/Users/esenespinosa/Development/personal/games/mmorpg/docs/GDD.md` §6 (195-285) and §9 (339-515)
- `/Users/esenespinosa/Development/personal/games/mmorpg/docs/vision-es.md` §2.4, §2.5
- `/Users/esenespinosa/Development/personal/games/mmorpg/docs/systems/balance.md`, `onboarding.md`, `telemetry.md`, `hunting-contracts.md`, `high-tier-items.md`
- `/Users/esenespinosa/Development/personal/games/mmorpg/docs/BACKLOG.md` (F-095 at 7400, F-100 at 1599)
- `/Users/esenespinosa/Development/personal/games/mmorpg/CLAUDE.md`
- `/Users/esenespinosa/Development/personal/games/mmorpg/deploy/pull-telemetry.sh`
- `/Users/esenespinosa/Development/personal/games/mmorpg/content/creatures/*.yaml` (240), `content/items/*.yaml` (369), `content/spells/*.yaml` (45), `content/npcs/{tomas,maera,vero,ubbo,elba}.yaml`, `content/quests/censo_tortuga_coja.yaml`
- `/Users/esenespinosa/Development/personal/games/mmorpg/maps/worlds.json`, `maps/spawns.json`, `maps/worlds/{ingwen,gorothland,boggland}/z*.json`
- `git log` in the same repo for dates: 95b8547d, a122bc38 (2026-07-13), 845f1018 (07-26), d11ef6c5 (07-27), 9f27fa1a, bd1a5806 (07-28), 7f751318 (07-29), b1007d1e (07-30), 9ca4da22 (08-12), 9defeed6 (08-21), d4d4a0bf (08-30)
