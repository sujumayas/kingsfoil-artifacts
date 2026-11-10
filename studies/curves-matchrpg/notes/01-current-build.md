# 01. Our current build (MatchRPG as built)

Scope. MatchRPG's difficulty, learning and power curves as the code builds them today, at main 82b7eb2 (v0.7.14). Sources are the repo at `/Users/esenespinosa/Development/personal/games/matchRPG` (paths below are relative to it), its `CHANGELOG.md`, its in-repo analyses in `docs/`, read-only `git log` for the dates of constants, and a curve model written for this note. Every fact is [K]. Code reads are E1 (they are the rules). The in-repo analyses are E1 for their own data windows (v0.3 to v0.5, before our data set) and E2 where they state the designer's reason. Model outputs are [K, E1] on the rules and [I] on their assumptions.

Raw work saved outside the repo, in the session scratchpad.
- Curve model (enemy stats, hero stats, endless, scroll) `/private/tmp/claude-501/-Users-esenespinosa-Development-personal-games-kingsfoil-artifacts/a74d8fa3-59f2-446d-a70a-8da29b61d576/scratchpad/curves/model.py`
- XP per run and runs-to-level model `/private/tmp/claude-501/-Users-esenespinosa-Development-personal-games-kingsfoil-artifacts/a74d8fa3-59f2-446d-a70a-8da29b61d576/scratchpad/curves/xp.py`
- Edge timing model `/private/tmp/claude-501/-Users-esenespinosa-Development-personal-games-kingsfoil-artifacts/a74d8fa3-59f2-446d-a70a-8da29b61d576/scratchpad/curves/edge.py`

## Takeaways

1. The scroll ramp is the one curve that has never been tuned. `BASE_SCROLL` 18, `SCROLL_ACCEL` 0.15 and `MAX_SCROLL` 60 are the values of the first commit (5fdd572, 2026-09-23). Every later difficulty change went to enemies, elites, bosses, tiers or mercy. Full speed comes 280 dungeon seconds into a run, which is 255 real seconds at gold and 431 at bronze. The median story run (177 s) ends before it, the p90 (369 s) after it. [K, E1] (`scripts/runner/runner.gd:67-69, 612`; git log)
2. Story enemies grow on stairs, not a sawtooth. Depth power is `1 + 0.45 x floor(n/12)`, so normal HP climbs 23 to 242 (x10.4) from encounter 1 to 179 and attack 4.9 to 31.5 (x6.4, because attack only takes half the depth power). The steps land on the elite slots (12, 24, 36), so each elite is also the first enemy of a new step. Nothing drops at a world's start. The relief beats are the elite fight's slowed view (x0.4), the world boss arena where the view holds, and the quiet walk into a new world. [K, E1] (`scripts/runner/runner.gd:1748-1753`, `scripts/runner/encounter.gd:146-149`)
3. The hero's own growth is small, so meta power carries the late game. From level 1 to 40 base attack goes 7.7 to 35.0 (x4.5) and HP 102 to 336 (x3.3), against x10 enemy HP. The rest comes from town buildings (+5% a level, +50% at 10 levels), talents (+6 attack per Blade pick), relics, items and the chain (up to x3 at 40 links). The in-repo report puts the hero at about 58 attack at encounter 72 where base level 24 gives 23.8. [K, E1] (`scripts/data/hero_defs.gd:8,12`, `scripts/data/upgrade_defs.gd:23-29`, `scripts/data/row_defs.gd:70-79`, `scripts/core/run_state.gd:22-23`, `docs/balance-analysis-2026-10-21.md`)
4. The power curve between runs is a wall by design, with hidden help stacked on the wall. A run that dies at the Ogre King earns about 51 XP. Level 5 needs 200 and level 8 needs 320, and since v0.7.9 only a third of a run's XP past its first level counts. A player stuck at the Ogre King is level 5 after run 10 and level 11 after run 50 in the model. The game answers with a hidden stacking assist (the Ogre King loses 15% HP per loss, up to 60%), half XP for a lost elite fight, and a free Health potion the first time the elite hurts the hero. [K, E1] (`scripts/autoload/game_state.gd:250-257, 994-995`, `scripts/runner/runner.gd:109, 1738-1739`) [I] on the model's 72% enemy share and lost-fight average
5. Mastery tiers are a pace DDA on the dungeon's clock: 0.65, 0.85, 1.1, 1.25 (a 1.9x spread) multiply every dungeon timer, never the board. The lab says bronze reaches encounter 116 with its clock and 59 without. The clock values have not moved since v0.5.1 (2026-10-14). Only the tier lines moved (v0.7.12, gold 0.38 to 0.40, diamond 0.48 to 0.50). [K, E1] (`scripts/data/tier_defs.gd:25,32`, `server/api/_lib.js:52-130`, `docs/balance-analysis-2026-10-21.md`)
6. Endless turns linear growth into compound growth at the bottom. Depth power is 7.75 at encounter 180, then x1.12 every 12 encounters, so enemies double about every 73 encounters (two worlds). Bosses past the first lap scale by `boss_power`, 5.5x Astaroth by the end of lap 2. On lap 1 every slot keeps its story stats, so the first three worlds of an endless run hold no risk (no fight lost, 5.1 of 9.2 minutes, in the v0.5 report). [K, E1] (`scripts/runner/runner.gd:77, 1748-1761`, `scripts/data/world_defs.gd:160-185`, `docs/endless-analysis-2026-10-21.md`)
7. Failure is cheap and fast. A death banks the run's gold, wood, stone, XP and depth, and loses only the potions on the belt and the run's minutes. Control comes back in about 6 s plus taps if the player skips Prepare, and the next run's clock does not start until the first move. [K, E1] (`scripts/autoload/game_state.gd:1315-1370`, `scripts/run.gd:21-24, 1636-1640, 1680-1685`, `scripts/autoload/transition.gd:13-19`)
8. Five balance changes fall inside the player-data window (2026-10-23 to 11-10) and can be read as natural experiments: the combo nerf (v0.6.6, 10-28), the Ogre King wound and Health gift (v0.7, 10-29), the chain changes (v0.7.4 to v0.7.8, 11-04/05), the run XP soft cap (v0.7.9, 11-05) and the tier lines (v0.7.12, 11-07). [K, E1] (CHANGELOG.md, git log)

## Q1. What are the curves, world by world and slot by slot?

### Takeaway
Within one descent, enemies rise in five-step stairs per world (steps every 12 encounters), elites spike on the step, and world bosses have hand-set stats that rise 765 to 5,160 HP. The hero's base stats rise far slower than the enemy curve, so felt difficulty depends on town, talents and run items.

### Cited findings

Rules the tables are built from.
- A descent is 5 worlds x 36 encounters (`scripts/data/world_defs.gd:15`), elites at 12 and 24 (`:16`), the world boss at 36, the bottom at 6,666 m (`:19`). [K, E1]
- Depth power `depth_power(n) = 1 + floor(n / DEPTH_EVERY) x DEPTH_POWER` up to the bottom, then `(1 + 15 x 0.45) x 1.12^(steps - 15)` (`scripts/runner/runner.gd:75-77, 1748-1753`). [K, E1]
- An enemy's HP is `base_hp x power x lift`, its attack `base_atk x lift x (0.5 + 0.5 x power)` (`scripts/runner/encounter.gd:146-149`). Attack grows half as fast as HP. [K, E1]
- Elites hit x1.2 (`EnemyDefs.ELITE_ATK`, `scripts/data/enemy_defs.gd:98`, applied `scripts/runner/encounter.gd:172`) and x1.5 more from encounter 24 on (`ELITE_HIT`, `ELITE_HIT_FROM`, `scripts/runner/runner.gd:88-89, 1690-1691`). [K, E1]
- World bosses ignore depth power on the first lap (`boss_power = 1`, `scripts/runner/runner.gd:1760-1761`) and have fixed stats (`scripts/data/enemy_defs.gd:156-167`). [K, E1]
- Elites and bosses brace: no hit takes more than 1/5 (elite) or 1/10 (boss) of max HP, 1/15 for Old Mossback and the Warden; one attack's strikes take 2 shares at most (`BRACE_HITS`, `BRACE_BLOW`, `scripts/runner/runner.gd:281-285`). So an elite needs at least 3 moves and a world boss at least 5, whatever the hero's power. [K, E1]
- A normal encounter is a trap with chance 0.28, never more than 2 in a row (`scripts/runner/runner.gd:132-135`). Encounters are 260 to 420 px apart (`scripts/runner/runner.gd:1703`). [K, E1]

Enemy curve, first descent. "Normal" is the world roster's average. HP and ATK are after depth power, elite multipliers included. Computed by `model.py`. The elite HP column matches the medians the 13 October report measured (Ogre King 232, Broodmother 266, Lich 364, Orc Warlord 585, Crystal Golem 830, Matriarch 782), which checks the model. [K, E1]

| World | Enc | n | Slot | Power | HP | ATK | XP |
|---|---|---|---|---|---|---|---|
| 1 Forest | 1 | 1 | normal | 1.00 | 23 | 4.9 | 4.6 |
| 1 | 12 | 12 | Ogre King | 1.45 | 232 | 20.6 | 58 |
| 1 | 13-23 | 13 | normal | 1.45 | 34 | 6.0 | 6.6 |
| 1 | 24 | 24 | Broodmother | 1.90 | 266 | 26.1 | 76 |
| 1 | 25-35 | 25 | normal | 1.90 | 45 | 7.0 | 8.7 |
| 1 | 36 | 36 | Old Mossback | fixed | 765 | 13.6 | 102 |
| 2 Upper Dungeon | 1 | 37 | normal | 2.35 | 65 | 10.7 | 13.2 |
| 2 | 12 | 48 | Lich | 2.80 | 364 | 41.0 | 112 |
| 2 | 24 | 60 | Orc Warlord | 3.25 | 585 | 57.4 | 162 |
| 2 | 36 | 72 | The Warden | fixed | 2,000 | 20.0 | 200 |
| 3 Caves | 1 | 73 | normal | 3.70 | 117 | 16.0 | 24.4 |
| 3 | 12 | 84 | Crystal Golem | 4.15 | 830 | 64.9 | 249 |
| 3 | 24 | 96 | Myconid Matriarch | 4.60 | 782 | 60.5 | 276 |
| 3 | 36 | 108 | The Deep Wyrm | fixed | 3,105 | 44.9 | 345 |
| 4 Drowned Temple | 1 | 109 | normal | 5.05 | 164 | 21.8 | 38.4 |
| 4 | 12 | 120 | The Hierophant | 5.50 | 1,100 | 76.0 | 358 |
| 4 | 24 | 132 | Shoggoth | 5.95 | 1,369 | 87.6 | 387 |
| 4 | 36 | 144 | The Sleeper Below | fixed | 4,560 | 42.0 | 432 |
| 5 Plains of Hell | 1 | 145 | normal | 6.40 | 213 | 28.1 | 49.9 |
| 5 | 12 | 156 | Amdusias | 6.85 | 1,302 | 91.8 | 480 |
| 5 | 24 | 168 | Belial | 7.30 | 1,533 | 112.1 | 511 |
| 5 | 35 | 179 | normal | 7.30 | 242 | 31.5 | 56.9 |
| 5 | 36 | 180 | Astaroth | fixed | 5,160 | 43.2 | 576 |

Shape. Normal HP at the start of each world: 23, 65, 117, 164, 213. World-to-world steps are +180%, +79%, +40%, +30%: big early, small late, the same "shrinking pushback" Hearthguard showed (`studies/curves-hearthguard/notes/01-current-build.md`, takeaway 3). [K, E1] on the numbers, [I] on the comparison.

Hero power curve.
- Base stats `max_hp 102, atk 7.7, mag 7.7, def 5, max_armor 40` (`scripts/data/hero_defs.gd:8`), plus per level `max_hp 6, atk 0.7, mag 0.7, def 0.5, max_armor 0.5` (`:12`). Same for every hero. [K, E1]
- XP to next level `40L + 2L x max(0, L - 8)` (`scripts/autoload/game_state.gd:250-251`), cap 40 (`:244`). Total XP from 1 to 40 is 64,128. [K, E1]
- Since v0.7.9 a run's XP counts whole up to the first level it brings, then a third (`XP_PAST_LEVEL`, `scripts/autoload/game_state.gd:257-267`). Never told to the player. [K, E1]
- Talent rows open at levels 3, 8, 14, 21, 29 (`scripts/data/row_defs.gd:21`). Each talent also adds its branch's stats: Blade +6 atk, Arcane +6 mag, Flow +3/+3 and +20 HP (`scripts/data/row_defs.gd:70, 75, 79`). The capstone needs 2 earlier picks in its branch (`:59`). [K, E1]
- Town: Barracks, Forge, Mage Tower, Armory each +5% of a stat a level, 10 levels (`scripts/data/upgrade_defs.gd:23-29`), cost `base x 1.6^level` (`:15`, `scripts/autoload/game_state.gd:917-926`). [K, E1]
- Damage per match is `atk x (tiles - 2) x (1 + 0.7 x (cascade - 1)) x chain_mult`, chain +5% a link to 40 links (x3) (`scripts/run.gd:413-442`, `scripts/core/run_state.gd:22-26`). [K, E1]

| Level | XP to next | XP from L1 | HP | ATK | Note |
|---|---|---|---|---|---|
| 1 | 40 | 0 | 102 | 7.7 | |
| 3 | 120 | 120 | 114 | 9.1 | row 1 |
| 5 | 200 | 400 | 126 | 10.5 | |
| 8 | 320 | 1,120 | 144 | 12.6 | row 2 |
| 10 | 440 | 1,818 | 156 | 14.0 | |
| 14 | 728 | 3,990 | 180 | 16.8 | row 3 |
| 21 | 1,386 | 10,948 | 222 | 21.7 | row 4 |
| 24 | 1,728 | 15,440 | 240 | 23.8 | median level at first Mossback kill (v0.5) |
| 29 | 2,378 | 25,340 | 270 | 27.3 | row 5 |
| 31 | 2,666 | 30,238 | 282 | 28.7 | first Warden kill |
| 34 | 3,128 | 38,690 | 300 | 30.8 | first Sleeper kill |
| 39 | 3,978 | 55,990 | 330 | 34.3 | first Astaroth kill |
| 40 | cap | 59,968 | 336 | 35.0 | |

(First-kill levels: `docs/balance-analysis-2026-10-21.md`, v0.5 runs, 10 to 15 players.)

The ratio, plain 3-matches to kill. A rough index of felt difficulty: enemy HP over one 3-match at base attack, no chain, no town. [I] on the hero's level at each point.

| Point | Enemy HP | Hero level (assumed) | Base ATK | 3-matches | With Forge 5 and 3 Blade picks |
|---|---|---|---|---|---|
| Enc 1, run 1 | 23 | 1 | 7.7 | 3.0 | |
| Ogre King, run 1 | 232 (139 at 4 losses) | 2 | 8.4 | 28 (17) | |
| Ogre King, run 10 | 232 | 8 | 12.6 | 18 | 13 (one Blade pick, no town) |
| Enc 37 | 65 | 24 | 23.8 | 2.7 | 1.2 at (23.8+18) x1.25 = 52 |
| The Warden | 2,000 | 31 | 28.7 | 70 | 34 at (28.7+18) x1.25 = 58 (brace 15 hits) |
| Enc 145 | 213 | 39 | 34.3 | 6.2 | 2.5 at (34.3+30) x1.3 = 84 |
| Astaroth | 5,160 | 39 | 34.3 | 150 | 61 at 84; about 20 with a x3 chain |

The point. Without meta power, encounter 145 takes twice the matches of encounter 1. With the town and five picks it is near level with encounter 1. The game's late difficulty comes from the scroll (time per match) and elites and bosses, not from normal enemies. [I] from the table.

Endless.
- Past the bottom, depth power compounds at 12% per 12 encounters (`ENDLESS_POWER`, `scripts/runner/runner.gd:77, 1753`). [K, E1]
- On lap 1 a shuffled run's foe is as strong as its slot, not its name (`lift_for`, `scripts/data/world_defs.gd:168-185`). On later laps every world is lifted to world 5's base stats (`lap_lift`, `:160-162`), never a step back. [K, E1]
- World bosses on later laps scale by `depth_power(n) / depth_power(180)` (`scripts/runner/runner.gd:1760-1761`). [K, E1]

| Encounter | Lap | Depth power | Boss power | Normal HP (world 5 base 33.2) |
|---|---|---|---|---|
| 180 | 1 end | 7.75 | 1.00 | 257 |
| 216 | 2 | 10.9 | 1.40 | 362 |
| 252 | 2 | 15.3 | 1.97 | 508 |
| 288 | 2 | 21.5 | 2.77 | 713 |
| 360 | 2 end | 42.4 | 5.47 | 1,408 |
| 432 | 3 | 83.7 | 10.8 | 2,780 |
| 540 | 3 end | 232 | 30.0 | 7,710 |

Players in v0.5 reached encounter 395 at most (`docs/endless-analysis-2026-10-21.md`), where enemies are about 7.7x the bottom. [K, E1]

Scroll and edge.
- Speed `min(18 + run_time x accel, 60)` px per dungeon second (`scripts/runner/runner.gd:612`). `run_time` does not grow through an elite fight or an arena (`:608-611`). Dungeon time is real time x the tier clock (`_step(delta * clock())`, `scripts/runner/runner.gd:572`, `:2115-2120`). [K, E1]
- The view eases to x0.45 as the hero nears the edge, `lerp(1, 0.45, edge_danger^2)` over the last 260 px (`EDGE_MERCY`, `EDGE_WARN`, `scripts/runner/runner.gd:179, 197, 639`). The hero is never more than 440 px ahead (`LEAD_MAX`, `:54`). [K, E1]
- During an elite fight the view moves at x0.4 (`ELITE_SCROLL`, `:87, 646`). [K, E1]

| Tier | Clock | Real s to full speed | px per real s at 30 / 120 / 300 s | First run (accel x0.6) |
|---|---|---|---|---|
| Bronze | 0.65 | 431 | 13.6 / 19.3 / 30.7 | 718 s |
| Silver | 0.85 | 329 | 18.6 / 28.3 / 47.8 | 549 s |
| Gold | 1.10 | 255 | 25.2 / 41.6 / 66.0 | 424 s |
| Diamond | 1.25 | 224 | 29.5 / 50.6 / 75.0 | 373 s |

(No elite or arena pauses counted, so real runs reach full speed later. The first run is played at silver, `TierDefs.START`, `scripts/data/tier_defs.gd:18`.) [K, E1]

Time from a full 440 px lead to being caught if the player stops matching (`edge.py`, dungeon seconds, no knockback, no slow motion):

| Scroll px/s | Caught after | Without mercy | Mercy adds | Warning zone (260 px) lasts |
|---|---|---|---|---|
| 18 (start) | 28.6 s | 24.4 s | 4.1 s | 18.6 s |
| 30 | 17.1 s | 14.7 s | 2.5 s | 11.1 s |
| 45 | 11.4 s | 9.8 s | 1.7 s | 7.4 s |
| 60 (full) | 8.6 s | 7.3 s | 1.2 s | 5.6 s |

The slow motion before death (Q4) stretches the last part again in real time. [K, E1] on rules, [I] on "stops matching".

Traps and kits per world.
- Kits a trap takes: mean `min(1.2 + 0.25 x worlds_passed, 2.5)`, rounded by chance (`scripts/runner/runner.gd:143-145, 2442-2446`). World 1 1.2, world 2 1.45, world 3 1.7, world 4 1.95, world 5 2.2, world 7 onward 2.5. [K, E1]
- Without kits the hero holds 3 s a kit, 6 s at most (`:157-160`), heard from 300 px off (`TRAP_WARN`, `:154`). With kits, 0.5 s of work (`DISARM_WORK`, `:163`). [K, E1]
- Kit tile weight 10 of 100 (`scripts/data/tile_types.gd:24-28`), held level with the fighting tiles when talents add swords or staves (`GameState._keep_resource_share`). World 2 adds +3 kit weight, world 4 +2 (`scripts/data/world_defs.gd` WORLDS). [K, E1]
- Tinker, 10 levels of 3.6% that a trap fails to go off (`scripts/data/upgrade_defs.gd:32`). [K, E1]

Meta power costs.
- Barracks, 10 levels: 26 x (1.6^10 - 1)/0.6 = about 4,720 wood and 4,720 stone. Level 1 costs 26, level 10 costs 1,786 of each. [K, E1] (`scripts/data/upgrade_defs.gd:15,23`)
- Mint, Woodcutter, Quarry: +15% a level, 5 levels, about 411 of each pair (`:34-39`). Alchemist: 4 belt slots for 1,088 gold, 552 wood, 552 stone (`:40-43`). Tinker: 10 levels, growth 1.25, about 166 gold and 100 wood. [K, E1]
- Potions unlock for 250 to 350 of each material (commons), 850 (rare), 2,000 (mythic, after the win), and the Health potion opens through an achievement (CLAUDE.md:437-452, `scripts/data/power_defs.gd:125-127`). Belt starts at 1 slot, 5 at most (`scripts/core/potion_belt.gd:10-12`). [K, E1]
- Blessings: 13 signs of 3 to 5 stars, open only after the win. Favor comes from depth (one per world boss passed below the bottom) and up to 15 from endless metres, the first at 13,332 m and each 25% dearer (`scripts/autoload/game_state.gd:69-71`, `scripts/data/sign_defs.gd:19-86`). Lab value: a 3-star branch sign +34 to +36 encounters, five-star own signs +2 to +29 (`docs/endless-analysis-2026-10-21.md`). [K, E1]

### Inferences
- The depth stair lands on the elite. The 13 October report's "elites kill by the edge" finding (158 of 168 elite deaths by the edge from the Broodmother on) fits this. The elite is the first enemy of a new HP step and hits x1.2 to x1.8. [I]
- The world boss curve rises 765, 2,000, 3,105, 4,560, 5,160 while first-try wins rose 0 of 15 to 7 of 10 in v0.5 data. Boss HP grows slower than the hero's late meta power. The game's own report called it "difficulty runs backwards". [K, E1] for the numbers, [I] for the cause.

### Gaps
- No gold-per-run number in the code. Agent 0b can read `bank_start` and `gold` from the payload to put time on the town curve.
- Relic and item power is not in this table. `docs/balance-analysis-2026-10-21.md` gives relic values of 0 to +27 encounters.

## Q2. What does the player meet at run 1, 10 and 50, and at second 30, 120 and 300 of one run?

### Takeaway
Run 1 is training, a slowed first run and an elite that is near unbeatable at level 1 to 2. Runs 2 to 20 are a wall at the Ogre King and Old Mossback that the hidden wound and lost-fight XP chip at. By run 50 a player who passes Mossback each time is around level 22 to 34 and meets the scroll as the main threat. Inside a run, second 30 is calm, second 120 is about 70% of full speed at gold, second 300 is full speed and the p90 end of a story run.

### Cited findings

Across runs (model `xp.py`: a player who always ends at the same wall, 72% of normal slots enemies, a lost elite fight paying a quarter of its XP on average). [K, E1] on rules, [I] on the behaviour.

| Always ends at | Raw XP a run | Level after run 1 | Run 10 | Run 50 | Runs to rows 3 / 8 / 14 / 21 / 29 |
|---|---|---|---|---|---|
| Ogre King (12) | 51 | 2 | 5 | 11 | 3 / 24 / 83 / never / never |
| Broodmother (24) | 166 | 2 | 8 | 17 | 2 / 10 / 29 / 73 / 162 |
| Old Mossback (36) | 317 | 3 | 10 | 22 | 1 / 6 / 17 / 41 / 89 |
| The Warden (72) | 1,091 | 4 | 15 | 34 | 1 / 3 / 9 / 17 / 33 |

The model ignores the elite wound, which makes the Ogre King 15% weaker each loss (60% at 4 losses), so the "always at 12" row is a floor that real players leave. In v0.4 data, the seven who beat the Ogre King from level 1 needed 2 to 28 runs (`docs/run-analysis-2026-10-13.md`). [K, E1]

Run 1.
- Training Grounds first, on the surface with the dungeon still (`Runner.training`, `Backdrop.SURFACE`): 12 lessons on hand-made boards (sword, magic, shield, kit, coins, wood, stone, 4-match, 5-match, combo, mixed, chain of 5), only the lesson's move counts (`scripts/data/training_defs.gd:41-88`, CLAUDE.md:540-555). [K, E1]
- Then the first run proper, at silver's clock 0.85, with scroll acceleration x0.6 (`scripts/run.gd:126-133`, `scripts/runner/runner.gd:200`). First encounters are scripted, a wolf at 0.6 power and a 1-kit trap (`scripts/data/hint_defs.gd:18-21`). [K, E1]
- At encounter 12 the Ogre King has 232 HP (28 plain 3-matches at level 2), braces 5 hits, the view slides at x0.4. The first time it takes HP off the hero, the Health potion opens and one lands on the belt (CLAUDE.md:441-450). [K, E1]
- Data headline (agent 0b): 410 of 859 runs on v0.6 to v0.7 never left world 1. [K, E1]

Run 10 (typical). Level 5 to 10, one or two talents, a first building or two. The Ogre King is down to 40% to 55% HP off if not yet beaten. Old Mossback (765 HP, 15-hit brace) is the wall: v0.5 data has 5.5 deaths before the first kill, first kill at level 24 median, and 82% fight losses at levels 7 to 12 (`docs/balance-analysis-2026-10-21.md`). [K, E1]

Run 50 (typical regular). Level 22 to 34 by the model, three to five talents, town levels 5 to 8. In v0.4 data, Mossback first fell on a player's 33rd to 39th run, after 51 to 71 minutes (`docs/run-analysis-2026-10-13.md`). The v0.5 regulars beat Astaroth 35 to 57 runs in, at level 39 median. Past the first win every run is endless. [K, E1]

Inside one run (gold clock, no elite pauses).

| Real second | Scroll, px per real s | Share of full | Where the hero usually is | What presses |
|---|---|---|---|---|
| 30 | 25 | 15% | world 1, encounters 4 to 8 | learning the board; a lead of 440 px gives 25 s of slack |
| 120 | 42 | 50% | near the Ogre King or Broodmother for a new player | the elite fight under x0.4 scroll; edge slack about 13 s |
| 300 | 66 (full) | 100% | world 2 to 3 for a regular | edge slack 8.6 s; every pause costs ground |

(Encounter positions are [I] from the 13 October report's run lengths: Ogre King deaths at 65 s median, Mossback-band deaths at 179 s, Warden band at 319 s.)

Friction and fun.
- Run 1. Fun: Discovery and Sensation (each tile taught, combos, a first chest). Friction: the Ogre King is a level check that skill cannot pass at level 1 to 2 (fail 96% at levels 1 to 3 in v0.4). [K, E1] for the numbers, [I] for the aesthetics.
- Run 10. Fun: Challenge, the first talent (row at level 3) and building. Friction: XP per death is small (51 at the Ogre King), the soft cap hides that a second level was cut, and runs feel alike. The report called it "wall, wall, wall, then a sudden win". [K, E1]
- Run 50. Fun: Challenge and Expression (builds, chains past 60). Friction: the first three endless worlds are a plateau, 5.1 of 9.2 minutes with no fight lost (v0.5). [K, E1]
- Second 30 is a relief stretch, second 120 the elite spike, second 300 a hard tempo with little slack. [I]

### Gaps
- Exact encounter-by-second positions are in the run payload (`fights` with `n` and `seconds`). 0b can draw the real curve.

## Q3. Onboarding path

### Takeaway
The game teaches with practice, not text: 12 gated lessons on a dummy, a slowed first run with scripted spawns, and one-time hints that wait until the player meets the thing. The menu leads the player once each to the descent, Codex, Town and Talents. The dark, the one thing that ends most runs, is only named in the training outro and one hint.

### Cited findings
- Training Grounds start while `GameState.first_run()` (`scripts/autoload/game_state.gd:833`). Lessons in `TrainingDefs.LESSONS` (`scripts/data/training_defs.gd:41`), the moves outside the lesson are filtered (`Board.move_filter`). Lessons marked taught: attack, meter, zone (`:36`). The outro says "the dark behind you ends the run" (`:39`). Skip tutorial is on the pause menu (v0.7.13). [K, E1]
- First run after training: `FIRST_SPAWNS` wolf at 0.6 power, then a 1-kit trap (`scripts/data/hint_defs.gd:18-21`), scroll acceleration x0.6 for the whole run (`scripts/run.gd:133`, `scripts/runner/runner.gd:200`). The comment gives the reason: "most early quitters die before they understand the edge". [K, E2]
- Hints, each once, on the board when first met: attack, edge ("Keep matching! The pale edge behind you ends the run"), trap, charge, bolt, shove, zone, meter, potion, treasure, elite, world boss, enrage, and one per boss mechanic and trap kind (`scripts/data/hint_defs.gd:23-66`). [K, E1]
- Menu guides (`HintDefs.GUIDES`, `scripts/data/hint_defs.gd:79-84`): the descent after run 1, the Codex at the first item, the Town when the bank can pay for a building, Talents at the first talent, the name on the leaderboard. The screen darkens to the one thing to tap (CLAUDE.md:556-570). [K, E1]
- The pause menu's "?" explains every part of the run screen at any time (`RunGuide`). [K, E1]
- Gating of systems: blessings and challenges open only after the win, mythic potions after the win, potion rarities with world bosses beaten, rooms off for players (`ROOMS_LIVE := false`, `scripts/runner/runner.gd:439`). [K, E1]

### Inferences
- The onboarding teaches tiles well and the edge late. The first run's x0.6 acceleration hides the edge more, so the lesson the run teaches ("the dark kills") comes at the Ogre King, where the view slows to x0.4 and kills by the edge anyway. [I]
- A funnel from Training start to skip, to first move, to first elite, to first world boss can be built from payload fields (`run_no`, `reached`, `achievements`) but training itself sends nothing (Q6). [I]

## Q4. Mercy and pressure systems

### Takeaway
The game stacks about a dozen mercy systems, nearly all hidden, on one pressure source (the scroll). Warnings are multi-channel and reach the board. Failure costs only time and potions.

### Cited findings

| System | Rule | File:line | Kind |
|---|---|---|---|
| Edge mercy | view x0.45 at the edge, eased by danger squared over 260 px; +1.2 s at full speed, +4.1 s at start | `scripts/runner/runner.gd:179, 197, 639` | hidden mercy (pacing) |
| First-run acceleration | x0.6 acceleration on the first run | `scripts/runner/runner.gd:200`, `scripts/run.gd:133` | hidden onboarding |
| Tier clock | dungeon at 0.65 to 1.25 of real time by measured pace | `scripts/data/tier_defs.gd:25`, `scripts/runner/runner.gd:2115-2120` | pace DDA (pacing) |
| Elite scroll | view x0.4 and pace frozen in elite fights | `scripts/runner/runner.gd:87, 608-611` | relief beat / pressure swap |
| Elite wound | Ogre King -15% HP per loss, max -60%, until beaten | `scripts/autoload/game_state.gd:994-1003`, `scripts/runner/runner.gd:1738-1739` | hidden stacking assist |
| Health potion gift | first HP lost to the Ogre King (or 25% max HP) opens Health and gives one | CLAUDE.md:441-450 | one-shot supply help |
| Lost fight XP | half an elite's or boss's XP, by HP taken off it | `scripts/runner/runner.gd:109` | persistent progress on failure |
| Slow motion before death | game x0.55 and music x0.8 from danger 0.35, x0.25 after death | `scripts/ui/danger_slowdown.gd:10-16`, `scripts/runner/runner.gd:329` | warning / dramatic beat |
| Danger vignette and heartbeat | glow from danger 0.1, heartbeat 1.1 s to 0.4 s; HP red, edge pale yellow | `scripts/ui/danger_vignette.gd:8-11, 29-30` | warning on the board |
| Dark near sound | from 0.3 of edge danger | `scripts/ui/danger_vignette.gd:14` | warning |
| PotionNudge | Health slot glows, hearts rise onto the board, a clink as HP falls into danger | `scripts/ui/potion_nudge.gd:13-20` | warning plus help |
| Trap ahead | a trap without kits ticks from 300 px (2 s walk) | `scripts/runner/runner.gd:154` | telegraph |
| Enrage warning | 10 s before a boss enrages | `scripts/runner/runner.gd:290` | telegraph |
| Resume countdown | 3, 2, 1 over the board before the dungeon moves | `scripts/ui/resume_count.gd:12` | re-entry mercy |
| Tap guard | auto cards take no tap for 0.5 s | `scripts/ui/tap_guard.gd:9` | misclick mercy |
| Timers hold | chain, Surge and potions wait while the board cannot be played | `scripts/runner/runner.gd` `board_waiting`, `chain_waits` | fairness |
| Checkpoint | a killed page resumes the run from the last walk between encounters | CLAUDE.md:649-672 | anti-loss |
| HP warning line | danger starts at 35% HP | `scripts/runner/runner.gd:193` | warning threshold |

Death costs and what carries over.
- Banked on death: gold, wood, stone, XP (soft-capped), depth, codex, achievements, lifetime stats (`GameState.record_run`, `scripts/autoload/game_state.gd:1315-1370`). [K, E1]
- Lost on death: potions on the belt and any potion queued. A retreat brings them home, unless made at the brink (danger 0.35) (`Runner.BRINK`, `scripts/runner/runner.gd:2155-2160`). Found potions come home unpaid, so retreat-and-sell earns nothing. [K, E1]
- Juul's terms: a termination punishment with persistent progression. The death penalty is the run's minutes plus the belt. [K, E1] on rules, terms from the series glossary.

Time to retry, death to control in the next run.
- Death pause 1.8 real s, or 2.5 s when the dark takes the hero (`DEATH_PAUSE`, `TAKE_TIME 1.9 + TAKEN_BEAT 0.6`, `scripts/run.gd:21-24, 1636-1640`, `scripts/runner/runner.gd:20`). [K, E1]
- Results screen, buttons live after 0.5 s (`TapGuard`). Run again goes to Prepare when the player has potions to buy (`scripts/run.gd:1680-1685`), else straight to the run. [K, E1]
- Descend transition 1.25 s plus 0.3 s fade, then the run's opening zoom 1.3 s (`scripts/autoload/transition.gd:13-19`). [K, E1]
- The run then waits for the first move: no clock runs before it (`Runner.timers_held`). [K, E1]
- Minimum about 2.5 + 0.5 + 2.85 = 6 s plus two taps (death by the dark, no Prepare). With Prepare, add the shopping. [K, E1] for the parts, [I] for the sum.

### Inferences
- Mercy concentrates at the edge and the first elite. HP deaths get the nudge and Health potions, edge deaths get mercy and slow motion. Freeze, the only potion that stops the edge, was used 18 times of 105 found in v0.4 data. [K, E1] for the number, [I] for the reading.
- The tier clock and edge mercy are both hidden, which CLAUDE.md wants ("Mercy is hidden"). The series glossary flags this as the DDA paradox and rubber banding risk. [I]

## Q5. Version history relevant to curves (natural experiments)

### Takeaway
Scroll speed has never changed. Enemy depth power changed once (0.35 to 0.45). The rest is a fast loop: an analysis of the server's runs, then lab runs, then a version, often the same day. Five changes fall in agent 0b's data window.

### Cited findings

| Date | Version | Change | Reason given | Before / after |
|---|---|---|---|---|
| 2026-09-23 | first commit | `BASE_SCROLL` 18, `SCROLL_ACCEL` 0.15, `MAX_SCROLL` 60 | none | never changed since (git log 5fdd572) |
| 2026-09-25 | pre-v0.3 | `EDGE_MERCY` 0.45 added | "a second or two more" for a busy player | (80d6c7c) |
| 2026-09-28 | pre-v0.3 | `DEPTH_EVERY` 12, `DEPTH_POWER` 0.35 | worlds with elites and bosses | (69cc354) |
| 2026-09-30 | pre-v0.3 | `FIRST_RUN_ACCEL` 0.6, first-run hints | "most early quitters die before they understand the edge" | (071f636) |
| 2026-10-09 | v0.4 era | `DEPTH_POWER` 0.35 to 0.45; Deep Wyrm, Sleeper, Astaroth up; endless +12% compounding | town and armor made a strong hero "about a fifth stronger" than the dungeon was sized for; Wyrm hurt less than the Warden | Wyrm 2100/26 to 2700/39, Sleeper 2500/28 to 3800/35, Astaroth 3300/34 to 4300/36 (CHANGELOG.md:1318-1335) |
| 2026-10-10 | v0.4.3 | minion potion chance 2% to 6% | more potions | about 1 to 3 per two worlds |
| 2026-10-11 | v0.4.4 | minion potion 6% to 4% in story, 6% endless | fewer potions until the win | (`scripts/runner/runner.gd:148-151`) |
| 2026-10-13 | v0.4.7 | trap kits rise per world, up to 3; elite chest gives no kits | "far down nearly every trap was being disarmed" | |
| 2026-10-13 | v0.4.9 | traps 2 in a row at most; hold 6 s at most | 3 traps in a row let the dark catch up; 9 s holds | |
| 2026-10-14 | v0.5 | `ELITE_SCROLL` 0.4, `ELITE_HIT` 1.5 from 24, boss braces, `LOST_FIGHT_XP` 0.5, rows 3/8/14/21/29, steeper XP past 8, cap 40 | run analysis of 10-13: Ogre King a wall (44% fail), elites kill by the edge (158 of 168), levels decide runs | (6145d44, e26af24) |
| 2026-10-14 | v0.5.1 | tiers and `TierDefs.CLOCK` | "a slow player has no game" (0.21 moves/s, 53 runs, never past the Ogre King) | lab: Astaroth 4% of cap runs at 0.24, 0.32, 0.39 moves/s with clocks, 0/0/17% without (`scripts/data/tier_defs.gd:20-24`) |
| 2026-10-16 | v0.5.10 | a tier drops only after 5 slow runs in a row | players' notes | |
| 2026-10-16 | v0.5.12 | tier lines gold 0.38, diamond 0.48; resume countdown | dev's notes | (61cce19) |
| 2026-10-17 | v0.5.14 / v0.5.15 | the first run of 30 s or more places a new player | a quick new player went deep on silver's slow clock | |
| 2026-10-21 | v0.5.18 | kits grow with fighting tiles; kits per world 0.3 to 0.25; frost/lock 10 to 7 s, gas 12 to 8 s; Astaroth seals 3 tiles/15 s/25% to 5/10 s/40% | traps went off 28% to 37% in worlds 4 to 5; Astaroth first-try 7 of 10 | lab: world-5 traps 25-28% to 9-12%; Astaroth typical gold 80% to 53% win (`docs/balance-analysis-2026-10-21.md`) |
| 2026-10-23 | v0.6.1 | blessings from metres cost x2 (first at 13,332 m) | one per descent paid "nearly a star a run" | |
| 2026-10-23 | v0.6.2 | mythic unlock 4,000 to 2,000 each | | |
| 2026-10-26 | v0.6.3 to v0.6.5 | potion rarities moved down; unlock 250 to 350 (common), 850 (rare) | | |
| 2026-10-28 | v0.6.6 | `COMBO_STEP` 0.875 to 0.7 | asked for 10-15% less | multiplier -9% at x2 to -16% at x5; lab no change past noise (`docs/combo-nerf-2026-10-28.md`) |
| 2026-10-28 | v0.6.7 | potions come home on retreat or win, not at the brink | potions hoarded | |
| 2026-10-29 | v0.7 | Health opens at the first elite's hit; Ogre King -15% HP per loss, max 60% | (561628a) | in data window |
| 2026-10-30 | v0.7.1 | Tinker: 12% trap dodge a level (3) | | |
| 2026-11-04 | v0.7.4 | the chain survives world bosses | fun first | Flow 168 to 199 encounters in lab (`docs/flow-balance-2026-11-04.md`) |
| 2026-11-05 | v0.7.5 | Unstoppable loses +0.5 s; Onslaught on wounds | Flow ahead, Blade last | Flow 199 to 171-178; Blade 143 to 165-167 |
| 2026-11-05 | v0.7.7 / v0.7.8 | chain stops removed; chain clock waits on the board; Second Wind keeps 1/4 | long chains cut short | median best chain 40-48 to 57-77 in lab |
| 2026-11-05 | v0.7.9 | run XP past its first level counts 1/3 | 8% of v0.7 runs brought 2-3 levels, 70% of them a new deepest | in data window |
| 2026-11-05 | v0.7.10 / v0.7.11 | broken tiles pay; Meteor repriced | | Meteor 13+27 to 25+55 |
| 2026-11-07 | v0.7.12 | tier lines gold 0.38 to 0.40, diamond 0.48 to 0.50 | replay of v0.7 runs (18 players) | 2 drop diamond to gold, none up |
| 2026-11-07 | v0.7.13 | `DISARM_WORK` 1 to 0.5 s; a blow that breaks armor stops there; Sleeper's warp warned 0.8 s (was 1.5); Tinker 10 levels of 3.6% | | |
| 2026-11-09 | v0.7.14 | Bandolier second pick back | revert | |

### Inferences
- The scroll ramp may be the curve most worth a first experiment, since it has no tuning history and the 13 October report pins elite deaths on it. [I]
- In-window experiments for 0b: compare v0.6.x against v0.7.0+ on Ogre King fail rate and runs-to-first-kill (wound and gift), v0.7.9 on levels per run, v0.7.12 on tier mix. [I]

## Q6. What is instrumented

### Takeaway
Each run sends a rich payload with per-fight and per-potion detail, edge and low-HP seconds, hesitations and board-busy time. Training, hints, menus, time between runs and the hidden systems' own effect are not sent.

### Cited findings
- Built in `RunUpload.payload` (`scripts/ui/run_upload.gd:80-135`) plus `RunLog.stats()` (`scripts/ui/run_log.gd`), capped at 46 KB by dropping the oldest fights (`run_upload.gd:10, 137-143`). [K, E1]
- Run fields: player id, name, version, host, device, depth, reached, world, reason, won, endless, shuffle, foe, resumed_from, level, run_no, title, levels gained, achievements, xp_past_cap, xp_slowed, lost_xp, tier, belt_cost, bank_start, belt_slots, new_deepest, hp, atk, mag, def, kills, elites, bosses, chests, traps, best_chain, best_combo, gold, wood, stone, xp, treasures, upgrades, talents, rows, signs, items, killed_before, phone, vitals, vitals_before, the text log, start, stats (lifetime, if shown), challenge. [K, E1]
- RunLog stats: seconds, moves, matches, hesitations (gaps of 3 s or more), longest_gap, late_links, busy, waiting, paused, edge_seconds and low_hp_seconds (time with danger at 0.5 or more, `DANGER_LINE`, `scripts/ui/run_log.gd:18, 193-201`), end_hp, lowest_hp, campfires, campfire_hp, per world kits wanted, held, spent, short and traps sprung, per fight (n, slot, seconds, edge_seconds, lead, lowest_hp, hurt, blows, braced, brace_cuts, enraged, how it ended), potion_uses (time, HP, foe, what it did), potion_totals, potions_refused (with reason), potions packed, found, left, left behind, swapped, chest_cards (offered and taken), fired (relic and star activations). [K, E1]
- The server computes pace as moves over seconds for runs of 30 s or more, and flags runs faster than 1.5 s an encounter as "too fast" (`server/api/_lib.js:8, 84-87, 328`). [K, E1]

Not instrumented (not seen in the payload). [I] unless noted
- Training Grounds: start, lessons done, skip, time spent. Run 1 after training has `run_no` but no training record.
- Hints and menu guides shown, read time, dismissal.
- Time between runs and time on Prepare. The server's run timestamps (`at`) give gaps between run ends, which bounds time to retry.
- The hidden systems' own effect: seconds under edge mercy, seconds of slow motion, elite wound share applied, first-run acceleration. `edge_seconds` is a proxy.
- Board state at death (tiles available) and which warnings fired (dark near, nudge).
- Quit intent: a page closed mid-run versus killed is in `killed_before`, but quitting after a death (never playing again) is only visible as an absent next run.
- Any felt measure (interest, frustration). No in-game survey.

## Q7. Tuning knobs

| Knob | File:line | Value | What it moves |
|---|---|---|---|
| `BASE_SCROLL` | `scripts/runner/runner.gd:67` | 18 px/s | starting pressure |
| `SCROLL_ACCEL` | `scripts/runner/runner.gd:68` | 0.15 px/s² | ramp of the run's tempo |
| `MAX_SCROLL` | `scripts/runner/runner.gd:69` | 60 px/s | ceiling tempo, reached at 280 dungeon s |
| `FIRST_RUN_ACCEL` | `scripts/runner/runner.gd:200` | 0.6 | first-run ramp |
| `EDGE_MERCY` | `scripts/runner/runner.gd:197` | 0.45 | hidden slack at the edge |
| `EDGE_WARN` | `scripts/runner/runner.gd:179` | 260 px | warning zone and mercy width |
| `LEAD_MAX` | `scripts/runner/runner.gd:54` | 440 px | most slack a player can bank |
| `HERO_SPEED`, `ZONE_SPEED` | `scripts/runner/runner.gd:51, 202` | 150 px/s, +20% a zone level | how fast slack is regained |
| `DEPTH_EVERY` | `scripts/runner/runner.gd:75` | 12 | stair length |
| `DEPTH_POWER` | `scripts/runner/runner.gd:76` | 0.45 | stair height (story) |
| `ENDLESS_POWER` | `scripts/runner/runner.gd:77` | 0.12 | compound rate past the bottom |
| `ELITE_SCROLL` | `scripts/runner/runner.gd:87` | 0.4 | time to win an elite fight |
| `ELITE_HIT`, `ELITE_HIT_FROM` | `scripts/runner/runner.gd:88-89` | 1.5, from enc 24 | elite HP threat |
| `ELITE_ATK` | `scripts/data/enemy_defs.gd:98` | 1.2 | all elites' attack |
| `BRACE_HITS`, `BRACE_BLOW` | `scripts/runner/runner.gd:281, 285` | 5 / 10 hits, 2 a blow | floor on elite and boss fight length |
| World boss stats | `scripts/data/enemy_defs.gd:156-167` | 765 to 5,160 HP | boss spikes |
| `LOST_FIGHT_XP` | `scripts/runner/runner.gd:109` | 0.5 | progress on a lost wall fight |
| `WOUND_STEP`, `WOUND_MAX` | `scripts/autoload/game_state.gd:994-995` | 0.15, 0.6 | stacking assist at the Ogre King |
| `xp_to_next` | `scripts/autoload/game_state.gd:250-251` | 40L + 2L(L-8) | level pace |
| `XP_PAST_LEVEL` | `scripts/autoload/game_state.gd:257` | 1/3 | levels per run |
| `LEVEL_CAP` | `scripts/autoload/game_state.gd:244` | 40 | end of hero growth |
| `ROW_LEVELS` | `scripts/data/row_defs.gd:21` | 3, 8, 14, 21, 29 | talent cadence |
| Branch stats | `scripts/data/row_defs.gd:70-79` | +6 atk / +6 mag / +3+3+20 HP | power per talent |
| `HeroDefs.GROWTH` | `scripts/data/hero_defs.gd:12` | +6 HP, +0.7 atk a level | base power curve |
| `COST_GROWTH` | `scripts/data/upgrade_defs.gd:15` | 1.6 | town cost curve |
| Town scale | `scripts/data/upgrade_defs.gd:23-29` | +5% a level, 10 levels | meta power |
| `TierDefs.CLOCK` | `scripts/data/tier_defs.gd:25` | 0.65 / 0.85 / 1.1 / 1.25 | dungeon tempo per tier |
| `TierDefs.FROM` / `TIER_FROM` | `scripts/data/tier_defs.gd:32`, `server/api/_lib.js:52` | 0, 0.30, 0.40, 0.50 moves/s | tier lines |
| `WINDOW`, `MIN_RUNS`, `MIN_SECONDS`, `DROP`, `DROP_RUNS` | `server/api/_lib.js:66-75` | 10, 5, 30 s, 0.02, 5 | tier stickiness |
| `CHAIN_TIME`, `CHAIN_TIME_MIN`, `CHAIN_CAP`, `CHAIN_STEP` | `scripts/core/run_state.gd:14-23` | 3 s, 1.8 s, 40, 5% | chain window and reward |
| `COMBO_STEP` | `scripts/core/run_state.gd:26` | 0.7 | cascade reward |
| `TRAP_CHANCE`, `TRAP_ROW_MAX` | `scripts/runner/runner.gd:132, 135` | 0.28, 2 | trap density |
| `TRAP_KITS_BASE`, `_PER_WORLD`, `_MAX` | `scripts/runner/runner.gd:143-145` | 1.2, 0.25, 2.5 | kit cost by depth |
| `DISARM_TIME_PER_KIT`, `DISARM_TIME_MAX`, `DISARM_WORK` | `scripts/runner/runner.gd:157, 160, 163` | 3 s, 6 s, 0.5 s | trap hold time |
| `MINION_POTION_CHANCE`, endless | `scripts/runner/runner.gd:148, 151` | 4%, 6% | potion supply |
| `HP_WARN` | `scripts/runner/runner.gd:193` | 0.35 | HP danger line |
| `BRINK` / `SLOW_FROM` | `scripts/runner/runner.gd:329`, `scripts/ui/danger_slowdown.gd:10` | 0.35 | slow motion start; potions lost on retreat |
| `DANGER_SPEED`, `DEATH_SPEED` | `scripts/ui/danger_slowdown.gd:12, 15` | 0.55, 0.25 | slow motion depth |
| `DEATH_PAUSE`, `TAKEN_BEAT` | `scripts/run.gd:21, 24` | 1.8 s, 0.6 s | death beat, time to retry |
| `FIRST_SPAWNS` | `scripts/data/hint_defs.gd:18-21` | wolf at 0.6, 1-kit trap | first-run opening |
| `BLESSING_METRES_FIRST`, `_STEP`, `_MOST` | `scripts/autoload/game_state.gd:69-71` | 2 descents, +25%, 15 | endless favor pace |
| `ROOMS_LIVE` | `scripts/runner/runner.gd:439` | false | rooms off |

## Q8. Pattern cards the game already uses

### Hidden edge mercy
- Lineage: rubber-band speed in racing games (Mario Kart) -> hidden "coyote" mercy in platformers -> MatchRPG's slowing view. Hearthguard's notes hold the L4D and Celeste lineage; cite there.
- Feeling: a near escape that feels earned (Challenge, fiero).
- Mechanism: scroll x `lerp(1, 0.45, danger^2)` over the last 260 px.
- Works when unnoticed and small; breaks for a very slow player (0.21 moves/s, `docs/run-analysis-2026-10-13.md`).
- Evidence: [K, E1] rule; no measure of its effect in data.
- Cost S. Knobs `EDGE_MERCY`, `EDGE_WARN`.
- Map: rubber banding (qualify) on the player's own deficit, a pacing mercy, not DDA.

### Pace-tier clock
- Lineage: ranked ladders (chess.com) for placement -> MatchRPG ties the ladder to a game-speed multiplier.
- Feeling: equal Challenge for slow and quick players; the tier reads as status.
- Mechanism: median moves/s of last 10 runs places a tier; tier sets a dungeon clock 0.65 to 1.25; up at once, down after 5 slow runs.
- Works for stable pace; breaks when pace measures build (cascade-heavy builds read 5-8% slower, v0.6.2.13) or a player slows on purpose.
- Evidence: lab bronze 116 vs 59 encounters with and without clock [K, E1].
- Cost M. Knobs `CLOCK`, `FROM`, `WINDOW`, `DROP_RUNS`.
- Map: pacing DDA, pace-based, hidden clock with a visible tier (placebo difficulty lever available).

### Stacking assist at the first wall (elite wound)
- Lineage: Hades God Mode (+2% per death, cap 80%), in Hearthguard's notes -> MatchRPG hides it.
- Feeling: the wall gives way without the player knowing why (Challenge kept, fiero risk).
- Mechanism: Ogre King HP x (1 - min(0.15 x losses, 0.6)) until beaten once.
- Works on one gate; does not reach Old Mossback, the bigger wall in v0.5 data.
- Evidence: [K, E1] rule; added v0.7 inside 0b's window.
- Cost S. Knobs `WOUND_STEP`, `WOUND_MAX`.
- Map: stacking assist, hidden (so DDA paradox applies, stat kind).

### Persistent loot on death, with a soft XP cap
- Lineage: Rogue Legacy gold carry-over -> Hades -> MatchRPG banks all loot and XP.
- Feeling: no run is wasted (Submission, low frustration).
- Mechanism: loot and XP banked on death, potions lost; half XP for a lost wall fight; a run's XP past one level counts a third.
- Works to keep players coming back; breaks into "wall, wall, wall, then a sudden win" (13 October report).
- Evidence: [K, E1].
- Cost S. Knobs `LOST_FIGHT_XP`, `XP_PAST_LEVEL`, `xp_to_next`.
- Map: persistent progression, termination punishment, cost of failure = minutes plus belt.

### Elite tempo swap
- Lineage: boss rooms that stop autoscroll in shmups and runners -> MatchRPG halves pace instead of stopping.
- Feeling: a change of tempo from running to fighting (Challenge).
- Mechanism: view x0.4, pace frozen; elites hit x1.2 to x1.8; world boss arenas hold the view fully.
- Works when HP is the threat; before v0.5 elites killed by the edge 158 of 168 times.
- Evidence: [K, E1].
- Cost S. Knobs `ELITE_SCROLL`, `ELITE_HIT`, `ELITE_HIT_FROM`.
- Map: relief beat for the edge, spike for HP; cadence 3 a world.

### Stair depth curve, compounding past the bottom
- Lineage: Risk of Rain 2 difficulty over time (Hearthguard notes) and Slay the Spire ascension -> MatchRPG uses depth steps, then 12% compound.
- Feeling: steady rise, then an endless that always ends.
- Mechanism: `1 + 0.45 floor(n/12)` to 180, then x1.12 per 12.
- Works for a goal; the first endless lap is a plateau (lap 1 keeps story stats).
- Evidence: [K, E1].
- Cost S. Knobs `DEPTH_POWER`, `DEPTH_EVERY`, `ENDLESS_POWER`.
- Map: ramp with stairs (story), not sawtooth; set for any sawtooth would be the lap.

### Slow motion and death beat
- Lineage: bullet time near death in action games -> MatchRPG slows only the dungeon, the board keeps pace.
- Feeling: tension and a last chance (Sensation, Challenge).
- Mechanism: game x0.55 from danger 0.35, x0.25 after death, 1.8 to 2.5 s beat before results.
- Evidence: [K, E1].
- Cost S. Knobs `BRINK`, `DANGER_SPEED`, `DEATH_SPEED`, `DEATH_PAUSE`.
- Map: telegraph plus build up, peak, relax at the end of a run.

### Gated tile onboarding with a slowed first run
- Lineage: PvZ onboarding (Hearthguard notes) -> MatchRPG's lesson-per-tile dummy plus scripted first spawns.
- Feeling: Discovery without pressure.
- Mechanism: 12 lessons, moves filtered; first run accel x0.6, a weak wolf, a 1-kit trap; hints on first meeting.
- Works for the board; the edge is taught by dying.
- Evidence: [K, E1]; no telemetry on training.
- Cost M. Knobs `LESSONS`, `FIRST_SPAWNS`, `FIRST_RUN_ACCEL`.
- Map: onboarding, introduce-practise-combine, gating.

### Kits that scale with depth
- Lineage: resource-gated obstacles (keys and doors) -> per-world kit cost.
- Feeling: a board-reading task between fights (Challenge, low).
- Mechanism: mean kits `min(1.2 + 0.25 w, 2.5)`, 3 s hold per kit, 6 s cap.
- Evidence: v0.5.18 lab, world-5 traps going off 25-28% to 9-12% [K, E1].
- Cost S. Knobs `TRAP_KITS_*`, `DISARM_*`, `TRAP_CHANCE`.
- Map: cognitive load knob; "a feel problem, not a depth problem" (balance report).

## Glossary additions
- Pace clock: a multiplier on the dungeon's time (never the board's) set by the player's tier. MatchRPG's form of pacing DDA.
- Brace: a cap on how much of an elite's or boss's max HP one hit takes, which sets a minimum fight length in moves.
- Run XP soft cap: XP past the first level a run brings counts at a reduced rate (1/3), hidden.
- Lap lift: in endless, raising a world's enemies to the last world's base stats so a returning world is never easier.

## Sources
- MatchRPG repo, main 82b7eb2 (v0.7.14): `CLAUDE.md`, `CHANGELOG.md`, `scripts/runner/runner.gd`, `scripts/runner/encounter.gd`, `scripts/data/{world_defs,enemy_defs,tier_defs,hero_defs,upgrade_defs,row_defs,hint_defs,training_defs,power_defs,sign_defs,tile_types}.gd`, `scripts/autoload/{game_state,transition}.gd`, `scripts/core/{run_state,potion_belt}.gd`, `scripts/run.gd`, `scripts/ui/{run_upload,run_log,danger_slowdown,danger_vignette,potion_nudge,resume_count,tap_guard,results}.gd`, `server/api/_lib.js`. [K, E1]
- In-repo analyses: `docs/run-analysis-2026-10-13.md`, `docs/balance-analysis-2026-10-21.md`, `docs/endless-analysis-2026-10-21.md`, `docs/flow-balance-2026-11-04.md`, `docs/combo-nerf-2026-10-28.md`, `docs/smash-pays-2026-11-05.md`, `docs/potion-lab-2026-10-22.md`. [K, E1/E2]
- `git log -S` and `-G` on the constants for first-seen dates (read-only).
- Hearthguard current build: `studies/curves-hearthguard/notes/01-current-build.md`.
