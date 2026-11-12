# MatchRPG difficulty and learning curves: board pressure, depth scaling, mastery tiers and the endless descent

**Kingsfoil Studios · Research study · November 2026**

---

## Context

This is the second study in our Curves series. Each Curves study takes one Kingsfoil game and asks a narrow question. What made difficulty and learning feel good in older games that share this game's conditions, and what is the smallest set of rules that recreates that feeling here? The first study covered Hearthguard and built the series glossary, the method and a list of patterns this study does not research again [K, S1]. Where a pattern was covered there (the Left 4 Dead director, Celeste's assists, Hades God Mode, Juul's punishment types, Slay the Spire's ascension), we cite Hearthguard.

What is new here is real player data. Hearthguard had one player on one evening. MatchRPG has 859 runs from 21 anonymous players on versions 0.6 and 0.7, sent between 23 October and 10 November 2026 [K, E1, S4]. We can measure the curve players met instead of modelling it. The user set a privacy rule for that data. We publish aggregates only, with no player ids, no per-player traces and no cell built on fewer than 3 players. Four players made 58% of all runs, so where heavy players skew a number we give the player-weighted value next to the run-weighted one.

MatchRPG in five lines:

1. A sliding match-3 dungeon runner in the line of 10000000 (2012). The player slides rows and columns to match swords, staves, shields, gold, wood, stone and kits, and the matches power a hero who walks right through a dungeon strip above the board [K, S2, S3].
2. Encounters stop the hero. If the view's left edge, the dark, catches the hero, or HP reaches 0, the run ends [K, S3].
3. One descent of 6,666 m, five worlds of 36 encounters, elites at encounters 12 and 24 and a world boss at 36. Beating Astaroth wins the game once. After that every run is endless, and each step past the bottom is 12% stronger [K, S3].
4. Gold, wood, stone and XP carry over between runs into hero levels, town buildings, talent rows and potions [K, S3].
5. The server measures each player's pace in moves per second and places them in bronze, silver, gold or diamond. The dungeon runs on that tier's clock, 0.65 to 1.25 of real time. Players see the tier and never the clock [K, S3].

The user asked us to weigh four areas equally. They are the story run up to the first clear, endless after the win, learning across runs, and board pressure inside a run.

---

## 1. Executive summary

1. **The story curve is a row of walls, not a slope.** A world boss ends 30% to 42% of the runs that reach it, an elite 12% to 22%, a normal encounter about 1% [K, E1, S4]. Old Mossback, the first boss, is the churn point. 37% of the runs that reach it die there, players need a median 7 attempts to clear it, and 7 of the 10 players who stopped playing stopped in world 1 [K, E1]. King found the same at Candy Crush level 65 [V, E2, S47].

2. **Learning is a staircase over the three world 1 walls.** Lifetime runs 1-3 die at the first elite (median 441 m), runs 4-10 at the second (879 m), runs 11-25 at Old Mossback (1,315 m), and runs 26-50 reach worlds 2 and 3 (2,644 m) [K, E1].

3. **Pace is flat, so the mastery tier measures a trait, not skill.** Story pace sits at 0.45 to 0.48 moves per second from run 1 to run 50 and beyond, while depth grows six-fold [K, E1]. Depth follows meta power instead. Start level 1-2 reaches 441 m, start level 21 and above 2,640 m.

4. **The tier clock levels gold and diamond almost to the metre.** Median depth is 1,316 m on gold and 1,317 m on diamond, and 46.2% and 46.3% reach world 2, while diamond players move 14% faster [K, E1]. Silver does not catch up (882 m).

5. **Fights kill by HP and walks kill by the dark.** Elites and bosses end runs by HP in 94% and 100% of cases, and runs that end between fights end by the dark in 86% [K, E1]. The dark warns well (2% of dark deaths had 1 s or less of edge danger). HP warns less (10% of HP deaths had 1 s or less of low HP).

6. **The scroll ramp has never been tuned, and it reaches full speed after most runs end.** Its three constants are the first commit's [K, E1, S3]. In live runs the scroll is at 23% of its range when the world 1 boss starts and reaches 100% only in world 4, which 5% of story runs see [K, E1].

7. **Enemy power rises in stairs, not a sawtooth.** Depth power steps up every 12 encounters and never steps down, and each step lands on an elite [K, E1]. There is no relief beat after a wall except the walk. King follows a hard level with a lighter one on purpose [V, E2, S49].

8. **Between-run XP stalls at the first wall, and hidden mercy offsets it.** A run that dies at the Ogre King banks about 51 XP, and a player stuck there is level 5 after 10 runs in our model [K, E1]. Hidden mercy softens the Ogre King. None of it reaches Old Mossback, the bigger wall.

9. **Endless keeps story stats for a lap, then compounds ×1.12 per 12 encounters.** A hero strong enough to win meets no risk on lap 1, then enemies double every 73 encounters [K, E1]. Endless runs last a median 559 s, and past 10,000 m 96% of deaths are HP deaths. Redwood called his own post-game endless "a bit of a cop out" [V, E2, S7].

10. **Dropping a tier buys a slower clock, which no ladder twin does.** In chess, Hearthstone or Apex a demotion is a loss [V, E2, S62, S64, S67]. In MatchRPG it is an easier dungeon. Marvel Puzzle Quest players said they would drop a level once scaling followed progress [V, E3, S52]. The 5-slow-runs rule guards it today; the incentive itself should go (D1).

---

## 2. How to read this study

| Tag | Meaning |
|---|---|
| **[V]** | Verified in a source our researchers read, such as a paper, patch note, designer talk, wiki or article. "Excerpt" or "snippet" in the source list means only a search excerpt was read. |
| **[I]** | Inference or design proposal by the author or a researcher. Untested unless it says "model", and then tested only in our curve model, not the game. |
| **[U]** | Unverified or contested. A lead, a single repost, or sources that disagree. |
| **[K]** | Kingsfoil fact from the MatchRPG repo at main 82b7eb2 (v0.7.14) or from its run data, aggregates only. The text gives file:line. |

| Grade | Meaning |
|---|---|
| **E1** | Data or telemetry. Published numbers, stats sites, A/B results, our own run data and code. |
| **E2** | Designer statement. Postmortem, GDC talk, interview, the rationale in an official patch note. For papers, the authors' argument rather than their measured result. |
| **E3** | Community consensus. Wikis, large forum threads, review aggregates, press summaries. |
| **E4** | Anecdote. One post, one video, one review. |

Ratings on each pattern card are author judgement, 1 to 5, in this order:

- **Fun impact.** How much the pattern should change what players feel in MatchRPG.
- **Evidence.** How strong and how direct the evidence is that it worked elsewhere.
- **Cheapness.** How little code and tuning it costs. 5 is a one-line constant.
- **Fit.** How well it matches MatchRPG's conditions (touch board, 3-minute runs, high randomness, cheap failure with carry-over, solo with tiers, phone browser).
- **Testability.** How easily five players and the live data can show whether it works.

[S#] points to §17. File paths are relative to the MatchRPG repo. "Story runs" are runs that are neither endless nor challenge runs, 651 runs from 18 players. "Win rate" at a stage is runs that clear it over runs that reach it, so attempts are the denominator. "Player-weighted" gives each player's runs a total weight of 1. Every table cell rests on 3 or more players.

---

## 3. Design intent and fun hypotheses

MatchRPG's own pillars say it best. "Fun comes first." "Pressure is good, dying without warning is not." "Mercy is hidden." Warnings must reach the player on the board, because the player watches the board, not the dungeon [K, S3]. A run should push hard and end on something the player saw coming. A wall should fall within a few sittings. Winning should open something new. These hypotheses turn that intent into claims the §13 protocol can check [I].

| # | Players should feel | When | Because of | How we test it |
|---|---|---|---|---|
| H1 | Fiero at the first boss within a few sittings, not after a week | Old Mossback, around lifetime runs 8 to 15 | A3 ease the stall wall, C2 capped mercy | Median attempts to first clear of Old Mossback 4 or fewer (7 today); boss hazard 25% to 32% (37% today) |
| H2 | A sharp spike that ends before it tires | Every elite (5-10 s) and boss fight (20-40 s) | A1 walls on a fixed cadence | p75 boss fight under 45 s in every world; "how hard" item 5 or 6 at bosses, 3 or 4 between them |
| H3 | Relief after each wall | The first three encounters after an elite or boss | A2 a landing after each wall | Loss at the landing slots under 0.3%; median HP at encounter 15 above HP at encounter 12 |
| H4 | The tempo rises across a run, and regulars feel top speed | Second 150 onward of a run that passes the first boss | B1 scroll ramp tuned to the run | Scroll at the world 2 boss at 0.75 of range or more (0.55 today); dark share 10% to 35% in every world |
| H5 | "I saw it coming" | The last 5 s before any death | B2 two death channels, each warned | HP deaths with 1 s or less of low HP under 5% (9.6% today); "Did you see your death coming?" yes or only just in 80% of answers |
| H6 | "Every run moved me forward" | After runs 2 to 20 that die at a world 1 wall | C1 every go pays, C3 posted next wall | Share of wall deaths whose results screen shows an affordable upgrade or a talent row in reach; session end after a wall death not above 27% |
| H7 | A big combo bought breathing room | Any 4- or 5-match or cascade between fights | B3 stop time paid by combos | Edge seconds per minute in worlds 2 and 3 down 20% |
| H8 | The tier is a badge, not a tax | The results screen after a promotion | D1 no reward for dropping, D2 opt-in faster clock | Depth on the first run after a promotion within 20% of the run before; no playtester says they would play slow to drop |
| H9 | A fresh goal on the first run after the win | The first 3 runs after beating Astaroth | E1 opt-in ladder | Share of winners who start a ladder step within 2 runs; session end after a win below 50% (3 of 6 today) |
| H10 | Endless ends near 9-12 minutes, with something new each lap | Endless laps 1 and 2 | E2 endless with a new beat per lap | Endless median 540-720 s; endless depth still rising after endless run 10 |

---

## 4. Our current build: run 1, 10 and 50

This section comes from two notes. `01-current-build.md` read the repo at 82b7eb2 and built a curve model from its constants. `02-telemetry.md` analysed all 859 runs [K, S3, S4]. Code reads are E1 because they are the rules. The run data is E1 for what players did, with three limits. It holds 21 players, four of whom made most runs. 11 players had runs before v0.6, so their first steps are missing. And 92 resumed runs are left out of every pace and pressure number [K, E1].

### Walls, not a slope

Of 651 story runs, 6 won [K, E1]. Where the rest ended is the difficulty curve [K, E1]:

| Stage | Encounter | Runs reaching | Reach % | Win % | Reach %, player-weighted | Win %, player-weighted | Players |
|---|---|---|---|---|---|---|---|
| Ogre King, W1 elite | 12 | 639 | 98.2 | 87.5 | 90.8 | 65.7 | 17 |
| Broodmother, W1 elite | 24 | 545 | 83.7 | 86.1 | 57.0 | 75.9 | 15 |
| Old Mossback, W1 boss | 36 | 451 | 69.3 | 63.4 | 42.2 | 67.4 | 11 |
| Orc Warlord, W2 elite | 60 | 226 | 34.7 | 79.2 | 22.8 | 78.7 | 10 |
| The Warden, W2 boss | 72 | 175 | 26.9 | 70.3 | 17.6 | 74.7 | 10 |
| The Deep Wyrm, W3 boss | 108 | 60 | 9.2 | 58.3 | 6.5 | 61.6 | 10 |
| The Sleeper Below, W4 boss | 144 | 19 | 2.9 | 57.9 | 2.3 | 62.5 | 7 |
| Astaroth | 180 | 10 | 1.5 | 60.0 | 1.3 | 57.8 | 6 |

The survival curve falls in steps at 12, 24 and 36 and lies nearly flat between them.

@@FIG:survival@@

Loss per attempt by slot shows why [K, E1]:

| World | Normal 1-11 | Elite 12 | Normal 13-23 | Elite 24 | Normal 25-35 | Boss 36 |
|---|---|---|---|---|---|---|
| W1 | 0.17% | 12.5% | 0.23% | 13.9% | 0.35% | 36.6% |
| W2 | 0.23% | 12.9% | 0.65% | 20.8% | 0.21% | 29.7% |
| W3 | 0.68% | 17.5% | 0.91% | 21.2% | 1.01% | 41.7% |
| W4 | 0.82% | 21.9% | 1.17% | 13.6% | 0.00% | 42.1% |

84% of story runs that did not win ended at an elite or a boss [K, E1]. The world 5 elites have never stopped anyone (10 of 10), so the last world is a plateau up to Astaroth. World 4 rests on 7-10 players, so read its bars as a range.

@@FIG:hazard@@

Median attempts to the first clear, per player, are 3 for the Ogre King, 2 for the Broodmother, 7 for Old Mossback, 3 for the Warden, 2 for the Deep Wyrm and 1 for the world 4 boss [K, E1].

What we infer. The boss peaks do not rise in loss terms (37%, 30%, 42%), but each is met by a stronger hero, so Old Mossback has the highest felt difficulty in the game [I]. Player-weighting makes the opening worse. The Ogre King clears 87.5% of runs but 65.7% player-weighted, because light players lose there far more often [K, E1]. One research note read the runs-by-world counts as "each world keeps about half the runs that reach it". The per-encounter numbers show walls with flat ground between them, and we use that reading (§16).

### Enemy power stairs against hero power

Depth power is `1 + floor(n / 12) × 0.45` (`scripts/runner/runner.gd:75-76, 1748-1753`). Enemy HP is `base_hp × power × lift` and attack `base_atk × lift × (0.5 + 0.5 × power)`, so attack grows half as fast (`scripts/runner/encounter.gd:146-149`). Elites hit ×1.2, and ×1.5 more from encounter 24 on (`runner.gd:88-89`). World bosses have fixed stats on the first lap (`scripts/data/enemy_defs.gd:156-167`) [K, E1].

| World | Normal at start, HP | Elite 12, HP | Elite 24, HP | World boss, HP | Step into the world |
|---|---|---|---|---|---|
| 1 Forest | 23 | Ogre King 232 | Broodmother 266 | Old Mossback 765 | |
| 2 Upper Dungeon | 65 | Lich 364 | Orc Warlord 585 | The Warden 2,000 | +180% |
| 3 Caves | 117 | Crystal Golem 830 | Myconid Matriarch 782 | The Deep Wyrm 3,105 | +79% |
| 4 Drowned Temple | 164 | The Hierophant 1,100 | Shoggoth 1,369 | The Sleeper Below 4,560 | +40% |
| 5 Plains of Hell | 213 | Amdusias 1,302 | Belial 1,533 | Astaroth 5,160 | +30% |

The model's elite HP matches medians an in-repo report measured on live runs [K, E1]. Because 12, 24 and 36 are multiples of 12, each elite is also the first enemy of a new HP step, and nothing drops at a world start. The hero's base attack goes only 7.7 to 35.0 from level 1 to 40 (`scripts/data/hero_defs.gd:8, 12`); the rest comes from the town, talents, relics, items and the chain [K, E1]. Measured end-of-run attack is 26.4 at 1,000-1,500 m and 57.8 in won runs [K, E1].

@@FIG:stairs@@

What we infer. With five town levels and three talent picks, encounter 145 is about level with encounter 1 [I, model]. Late difficulty comes from the scroll and the walls, not normal enemies. This is a ramp of stairs with no sawtooth. The only relief beats are the slowed view in elite fights, the boss arena, and the walk into a new world [K, E1].

### The scroll ramp and the tier clock

Scroll speed is `min(18 + run_time × 0.15, 60)` px per dungeon second (`runner.gd:67-69, 612`). `run_time` stands still during elite fights and boss arenas (`runner.gd:608-611`). Dungeon time is real time times the tier clock, 0.65, 0.85, 1.1 or 1.25 (`scripts/data/tier_defs.gd:25`). The first run uses ×0.6 acceleration (`runner.gd:200`). The view eases to ×0.45 near the edge (`EDGE_MERCY`, `runner.gd:197`) and moves at ×0.4 in elite fights (`runner.gd:87`) [K, E1].

| Tier | Clock | Real s to full speed | px per real s at second 30 / 120 / 300 | First run (accel ×0.6) |
|---|---|---|---|---|
| Bronze | 0.65 | 431 | 13.6 / 19.3 / 30.7 | 718 s |
| Silver | 0.85 | 329 | 18.6 / 28.3 / 47.8 | 549 s |
| Gold | 1.10 | 255 | 25.2 / 41.6 / 66.0 | 424 s |
| Diamond | 1.25 | 224 | 29.5 / 50.6 / 75.0 | 373 s |

Those times assume no fights. The run data measures where the scroll actually is when each wall starts, on a 0-to-1 range from 18 to 60 px/s. It is 0.23 at the world 1 boss, 0.55 at the world 2 boss, 0.82 to 0.86 in world 3 and 1.0 only in world 4, for gold and diamond alike [K, E1]. The story median run is 177 s and the p90 369 s. Most runs end with the scroll at a quarter of its range.

@@FIG:scroll@@

All three constants date from the first commit, 5fdd572 on 23 September 2026 [K, E1, S3]. Every later difficulty change went to enemies, bosses, tiers or mercy. A full 440 px lead lasts 28.6 s at the start and 8.6 s at full speed if the player stops matching [K, E1].

What we infer. The ramp is tuned for runs players rarely have [I]. Its 3.3x range is mild next to NES Tetris (48x) and Canabalt (8x) [V, E1, S18; V, E2, S22], and a top that arrives in world 4 does little work.

### Two ways to die: HP in fights, the dark between them

Story runs end by HP 81.6% (79.8% player-weighted), by the dark 16.1% (11.7%), by retreat or a blank reason 1.4%, and in a win 0.9% [K, E1].

| Group | Runs | HP % | Dark % | Players |
|---|---|---|---|---|
| Ended in W1 | 365 | 87.9 | 9.9 | 18 |
| Ended in W2 | 163 | 79.1 | 20.2 | 10 |
| Ended in W3 | 88 | 67.0 | 33.0 | 10 |
| Ended in W4 | 24 | 75.0 | 25.0 | 8 |
| Ended at a normal encounter | 104 | 7.7 | 85.6 | 15 |
| Ended at an elite | 287 | 93.7 | 5.6 | 17 |
| Ended at a boss | 254 | 100 | 0 | 11 |

The dark's share rises with the scroll, 10% in world 1 to 33% in world 3, then falls to 25% once the scroll stops rising [K, E1]. No story run ended "Killed by a trap".

@@FIG:deaths@@

Dark deaths had a median 7 s of edge danger, and 2.2% had 1 s or less. HP deaths had a median 5 s of low HP, and 9.6% had 1 s or less [K, E1]. Players arrive at each boss with less HP (97% of max in world 1, 56% in world 4) and a boss fight takes 98% to 119% of arrival HP, healing included. Time to kill a boss falls from 38 s to 20 s while the bosses still end 40% to 45% of runs [K, E1].

What we infer. Juul's types map onto the channels [V, E2, S1]. HP loss is energy punishment inside fights; the dark is termination for a slow board between fights. The pillar holds for the dark. About 1 HP death in 10 comes with almost no warning, which reads as burst hits at walls, so late bosses are burst checks, not endurance checks [I].

### Learning is a staircase

| Lifetime runs | Story runs | Median m | p75 m | Median of player medians, m | Reach W2 % | Players |
|---|---|---|---|---|---|---|
| 1-3 | 57 | 441 | 441 | 441 | 0.0 | 18 |
| 4-10 | 95 | 879 | 1,161 | 878 | 3.2 | 12 |
| 11-25 | 191 | 1,315 | 2,218 | 1,314 | 41.9 | 11 |
| 26-50 | 180 | 2,644 | 3,551 | 3,003 | 73.3 | 10 |

441 m is the Ogre King, 879 m the Broodmother, 1,315 m Old Mossback [K, E1]. The 11 players seen from their first runs give the same steps, though the panel thins to 3-5 players after run 10. Players who crossed a milestone in the window did so at a median lifetime run of 19.5 for world 2 and 36.5 for the first win [K, E1].

@@FIG:learning@@

### Pace is a trait

Story pace is 0.461, 0.475, 0.464, 0.450 and 0.448 moves per second for lifetime runs 1-3, 4-10, 11-25, 26-50 and 51+ [K, E1]. Hesitations stay near 4 a minute at every depth. A log-log fit across cohorts gives a pace exponent of about 0.00 and a depth exponent of about 0.51 [K, E1].

@@FIG:pace@@

Depth follows meta power instead. Median depth by start level is 441 m at levels 1-2, 885 m at 6-10, 1,313 m at 11-15, 1,774 m at 16-20 and 2,640 m at 21-25 [K, E1]. By talent rows it is 1,303 m with one row and 1,312 m with two, so the second row does not move the world 1 boss; the third (1,957 m) does.

What we infer. The learning curve lives in decisions and power, not hand speed [I]. Lindstedt and Gray found the better expertise signal in Tetris is a bundle of decision and perception features [V, E1, S75]. Pace is a fine placement input because it does not drift, and a poor skill rating for the same reason. The data cannot separate power from skill, because both grow with runs [K].

### Tiers and the hidden clock

| Tier | Runs | Story median m | Median moves/s | Story s per 1,000 m | Reach W2 % | Players |
|---|---|---|---|---|---|---|
| Silver | 81 | 882 | 0.353 | 161 | 25.6 | 11 |
| Gold | 384 | 1,316 | 0.443 | 125 | 46.2 | 8 |
| Diamond | 380 | 1,317 | 0.506 | 107 | 46.3 | 8 |

Bronze has 2 story players and is suppressed [K, E1]. Median seconds to the world 1 boss are 114 on gold and 101 on diamond, a ratio of 1.13 against a clock ratio of 1.14 [K, E1]. The dark's share is 14.4% on gold and 16.8% on diamond.

@@FIG:tiers@@

Tiers barely move. Across 817 consecutive run pairs there were 9 promotions and 5 demotions [K, E1]. The rule is up at once on the median of the last 10 runs, down one step only after 5 slow runs in a row (`server/api/_lib.js:52-130`). The clocks have not moved since v0.5.1 on 14 October [K, E1].

What we infer. In the glossary's terms the tier clock is a pace-based DDA on tempo, not a pacing director [I]. Between gold and diamond it hides a 14% pace gap almost exactly. Silver's shortfall at start levels 1-10 (441 m against 880 m) survives its slower clock, so either silver players differ in ways pace misses or 0.85 is still too fast. The cell has 9 players, so it is a lab question first [I].

### XP between runs and hidden mercy

XP to the next level is `40L + 2L × max(0, L − 8)` (`scripts/autoload/game_state.gd:250-251`). Since v0.7.9 a run's XP past its first level counts a third, untold (`game_state.gd:257`). A lost wall fight pays half its XP, scaled by HP taken off (`runner.gd:109`). Talent rows open at levels 3, 8, 14, 21 and 29 [K, E1]. The model asks what a player gets who always ends at the same wall [K, E1 on rules; I on behaviour]:

| Always ends at | Raw XP a run | Level after run 1 | Run 10 | Run 50 | Runs to rows 3 / 8 / 14 / 21 / 29 |
|---|---|---|---|---|---|
| Ogre King (12) | 51 | 2 | 5 | 11 | 3 / 24 / 83 / never / never |
| Broodmother (24) | 166 | 2 | 8 | 17 | 2 / 10 / 29 / 73 / 162 |
| Old Mossback (36) | 317 | 3 | 10 | 22 | 1 / 6 / 17 / 41 / 89 |
| The Warden (72) | 1,091 | 4 | 15 | 34 | 1 / 3 / 9 / 17 / 33 |

@@FIG:xpwall@@

The game answers the stall with mercy, nearly all hidden [K, E1]. The Ogre King loses 15% HP per loss to 60% off until beaten (`game_state.gd:994-995`). The first HP lost to it opens the Health potion and gives one. Edge mercy, the first run's ×0.6 acceleration and slow motion near death add more.

What we infer. The Ogre King is softened three ways and Old Mossback, which costs twice the attempts, by none [I]. The wound is a stacking assist in the Hades God Mode family, kept hidden, so the DDA paradox applies [V, E2, S1; I].

### Endless after the win

Past the bottom, depth power compounds ×1.12 every 12 encounters from 7.75 (`runner.gd:77, 1753`), so enemies double about every 73 encounters [K, E1]. On later laps every world is lifted to world 5's base stats and bosses scale by `depth_power / 7.75`, 5.5x Astaroth by the end of lap 2 (`scripts/data/world_defs.gd:160-162`, `runner.gd:1760-1761`). On lap 1 each foe keeps its slot's story stats (`world_defs.gd:168-185`). A v0.5 report found the first three endless worlds held no lost fight and took 5.1 of 9.2 minutes [K, E1].

Endless runs, 192 from 11 players, last a median 559 s and reach 9,295 m; 62% end on lap 2 or later [K, E1]. Short runs end by retreat, mid-depth ones often by the dark (33% to 46% between 4,000 and 10,000 m), and past 10,000 m HP takes 96% to 100%. Median depth rises from 5,309 m on a first endless run to about 10,000 m from the fourth on, then flattens. Four players made 74% of endless runs, so this is close to a case study of four people [K, E1].

@@FIG:endless@@

What we infer. Endless has its own curve with the set being a lap. Lap 1 is a plateau, lap 2 is where compounding bites, and late endless is a stat race [I].

### Sessions and time to retry

A sitting is a run of uploads with no gap over 30 minutes. The median sitting has 2 runs and lasts 11.9 minutes, the median gap between runs inside it is 53 s, and the median active day holds 3.5 runs [K, E1]. A death banks gold, wood, stone, XP and depth and loses the belt's potions (`game_state.gd:1315-1370`). Death to control takes about 6 s plus two taps when the player skips Prepare [K, E1; I for the sum].

@@FIG:sessions@@

A sitting ends after 25% of new personal bests and 27% of other runs, and after 3 of 6 wins [K, E1]. The cost of failure is the run's 1-3 minutes, not the restart [I]. A win ends the sitting half the time, and that is the moment endless must catch.

### Run 1, run 10 and run 50

Run 1. Training Grounds teach 12 lessons on hand-made boards (`scripts/data/training_defs.gd:41-88`), then the first run plays at silver's clock with ×0.6 acceleration and a weak scripted wolf [K, E1]. At encounter 12 the Ogre King has 232 HP, about 28 plain 3-matches at level 2. Lifetime runs 1-3 end there at the median and none reaches world 2 [K, E1]. The run is Discovery and Sensation, and the Ogre King is a level check skill cannot pass at level 1 to 2 [I].

Run 10. A typical player is level 5 to 10 with one or two talents [K, model]. Runs 4-10 end at a median 879 m, and Old Mossback needs 7 attempts [K, E1]. A death at a wall pays little and runs feel alike, "wall, wall, wall, then a sudden win" in the in-repo report's words [K, E2]. This is where 7 of the 10 lapsed players stopped.

Run 50. Runs 26-50 reach a median 2,644 m and 73% reach world 2; the four players who won inside the window took a median 36.5 runs [K, E1]. This is Challenge and Expression, builds and long chains. The friction is lap 1 of endless and nothing new after the win [I].

### Second 30, 120 and 300 of a run

Gold clock [K, E1 on the scroll; I on positions].

| Real second | Scroll, px per real s | Share of full | Where the hero usually is | What presses |
|---|---|---|---|---|
| 30 | 25 | 15% | World 1, encounters 4 to 8 | Learning the board; about 25 s of edge slack |
| 120 | 42 | 50% | The Ogre King or Broodmother for a new player, the world 1 boss for a regular (114 s median) | A wall under the slowed view; about 13 s of slack |
| 300 | 66 | 100% without fights | World 2 to 3 for a regular; past the p75 of story runs | About 9 s of slack, though measured scroll at the world 3 boss is still 0.82-0.86 |

Second 30 is a relief stretch, second 120 the first spike, and second 300 a tempo few runs reach, while the board's own tempo stays at 0.43 to 0.49 moves per second [K, E1; I].

### Not instrumented yet

The payload does not send a session id, normal encounters one by one, the edge lead over time, which warnings fired, tab-closed runs, the clock applied, anything from training, or any felt measure [K, E1]. §13 closes these gaps.

---
## 5. Structural twins

We picked twins by six conditions, not by genre. MatchRPG is a touch board with an auto-walking hero, so attention stays on the board. Story runs last 1.5 to 6 minutes and endless runs about 9. Randomness is high. Failure costs medium, since the run ends but loot, XP and unlocks carry over. Play is solo with a board per version and tier, in a phone browser first [K, S3]. No twin matches all six. 10000000 and You Must Build A Boat come closest, because they share a clock that is a moving edge beaten by matching [I].

| Twin | Input | Session | Randomness | Cost of failure | Social | Platform | Why chosen |
|---|---|---|---|---|---|---|---|
| 10000000 (2012) | ● slide rows and columns, auto-running hero | ● runs of 2-5 min, built for 2-3 min commutes | ● tile drops, room and enemy draws | ● run ends, loot buys castle rooms | ◐ score chase | ● iOS first, then PC and Android | The direct ancestor; MatchRPG's goal is depth as 10000000's was its score |
| You Must Build A Boat (2015) | ● same board and runner | ◐ short bursts; a 30 s session must still advance the game | ● plus per-run dungeon modifiers | ○ no fail state | ○ solo | ● iOS, Android, Steam | Same designer removed failure; the fork MatchRPG did not take |
| Puzzle Quest (2007) | ◐ swap match-3, turn-based | ◐ one battle per encounter | ● random refills | ◐ a lost battle is retried, hero XP kept | ○ solo against the AI | ◐ DS and PSP, later PC and iOS | First hit to turn match power into RPG combat; the luck and fairness lesson |
| Dungeon Raid (2010) | ◐ trace chains on a grid, turn-based | ◐ one run, length set by survival | ● tile drops | ○ permadeath, no meta | ◐ online scores | ● iOS | Match power feeds combat on a phone, and monsters level with the run |
| Bejeweled Blitz (2008) | ◐ swap match-3, real time | ◐ exactly 60 s | ● tile drops | ○ nothing is lost | ● weekly friends board | ● Facebook browser, then mobile | The best-documented tuning of session length in match-3 |
| NES Tetris (1989) | ○ d-pad, falling pieces | ◐ a marathon of 10-40 min | ● piece draw | ○ termination, nothing kept | ◐ score, later a world championship | ○ console | The canonical speed table, and a kill screen nobody planned |
| Tetris The Grand Master (1998) | ○ arcade stick | ◐ up to 13:30 | ● piece draw | ○ termination | ◐ grade as a public rank | ○ arcade | Speed that rises and falls inside one game; a grade that names but does not adjust |
| Tetris Attack (1996) | ◐ cursor swaps on a grid, real time | ◐ endless until top-out | ● panel draw | ○ termination | ◐ versus | ○ console | A rising stack held back by matching, and chains that buy Stop time |
| Canabalt (2009) | ◐ one touch, auto-run | ● runs of about a minute | ● building generator | ○ termination, no meta | ◐ distance as score | ● Flash browser, then iOS | A touch speed ramp with published numbers and hidden forgiveness |
| Candy Crush Saga (2012) | ◐ swap match-3, no hero | ◐ one level in 1-3 min | ● tile drops | ◐ a life spent, map progress kept | ◐ friends map | ● phone, browser origin | The best published data on walls, churn and abandonment |
| Marvel Puzzle Quest (2013) | ◐ swap match-3, turn-based | ◐ one fight in 2-5 min | ● tile drops | ◐ health and time, roster kept | ◐ PvE event ladders | ● phone and PC | Enemy scaling tied to progress, and the sandbagging it caused |
| Balatro (2024) | ○ choose cards | ○ runs of 30-60 min | ● card draw | ◐ run ends, unlocks persist | ○ solo | ◐ PC, then phone | Posted score targets, a stakes ladder and a known endless formula |
| Peglin (2022) | ○ aim and shoot pachinko | ◐ runs of 30-60 min | ● peg bounces and draws | ◐ run ends, unlocks persist | ○ solo | ◐ PC and phone | A board that powers combat, with a ladder after the first win, capped in a patch |
| Brotato (2022) | ◐ one stick, auto attack | ● waves of 20-90 s, runs of about 20 min | ● shop and enemy draws | ◐ run ends, unlocks persist | ○ solo | ● PC and phone | Short fixed waves, a 6-step Danger ladder and a published endless formula |
| Super Hexagon (2012) | ◐ two-button rotate under pressure | ● runs of seconds | ◐ pattern draws | ● run ends, instant retry | ◐ best time | ● phone first | Time to retry near zero, and named modes with one clean goal each |
| Temple Run and Subway Surfers (2011, 2012) | ◐ swipe under a scrolling camera | ● 1-5 min | ● track generator | ◐ run ends, coins persist | ◐ score | ● phone | A chaser behind the player, the same role as the dark |

The Tetris games match only the pressure and lend the clearest speed tables in the record [I]. The roguelites match poorly on input and session and stay because each added an opt-in ladder after the first clear and tuned it in public [I]. Candy Crush and Marvel Puzzle Quest are the only twins with published data on walls or scaling.

The speed tables are worth seeing side by side. NES Tetris falls from 48 frames per cell at level 0 to 1 at level 29, a 48x range in steps with a cliff at level 9 [V, E1, S18]. TGM rises to 144/256 G at level 170, drops to 4/256 at 200, and jumps to 20G at 500 [V, E1, S20]. Canabalt runs 100 to 800 px/s with acceleration falling from +50 to +10 px/s², so "the faster you go, the slower you speed up" [V, E2, S22]. MatchRPG's scroll is a 3.3x linear ramp that most runs never finish [K, E1].

@@FIG:tetris@@

We pruned Columns, Bejeweled Classic and Zoo Keeper to lineage [V, E3, S25], and Puzzle & Dragons, whose stamina gate is a monetisation tool [V, E3, S55]. Slay the Spire, Hades and Vampire Survivors appear as lineage, since Hearthguard covered them [V, E2, S1].

---

## 6. Lineage: a timeline

MatchRPG's curve tools are older than they look. The depth goal and termination come from Rogue. The speed table and the pushing edge come from the Tetris games. Match power feeding combat, short sessions and loot that comes home date from the 2007-2012 phone era. Opt-in ladders, churn models and live retunes came after. Four generations, 1980 to 2026.

**Gen 1: Depth, speed tables and the pushing edge (1980-1998)**
- **1980** Rogue puts the Amulet of Yendor on the deepest floor and deletes the save on death [V, E2, S24].
- **1989** NES Tetris ships a speed table from 48 to 1 frames per cell, and level 29 becomes a kill screen nobody planned [V, E1, S18].
- **1996** Tetris Attack brings Panel de Pon's rising stack west, with Stop time paid by chains [V, E3, S21].
- **1998** Tetris The Grand Master makes speed rise and fall inside one game and 20G a designed top speed [V, E1, S20].

**Gen 2: Match power, short boxes and loot that comes home (2003-2012)**
- **2007** Puzzle Quest turns matches into RPG combat, and focus tests say the AI "always felt like it was cheating" [V, E2, S12, S13].
- **Dec 2008** Bejeweled Blitz launches at 60 s after PopCap found five minutes "quite long, and pretty boring" [V, E2, S16].
- **2009** Canabalt moves its difficulty from distance to speed [V, E2, S22, S23].
- **Nov 2010** Dungeon Raid puts chain matching and levelling monsters on a phone [V, E3, S15].
- **2012** Candy Crush Saga's level 65 becomes King's highest-converting level and its biggest churn point [V, E2, S47, S48].
- **2012** Super Hexagon restarts in under a second and calls its first two modes practice [V, E2, S43, S44].
- **Aug 2012** 10000000 puts a sliding board, a scrolling dungeon and castle upgrades into 2-5 minute runs [V, E3, S6].

**Gen 3: Meta-progression, scaling fights and measured churn (2013-2020)**
- **2013** Huang et al. find in 3.2 million Halo players that a 30-day break costs about 10 matches [V, E1, S77].
- **2014** Stafford and Dewar trace 854,064 players and show scores rise for 100 plays [V, E1, S76].
- **2015** You Must Build A Boat removes the fail state so a 30 s session still advances the game [V, E2, S10].
- **Oct 2015** Gems of War 1.0.7 speeds up gem falls and splits players over readability [V, E3, S53].
- **May 2017** Marvel Puzzle Quest ties scaling to clearance, and players say they would drop a level [V, E3, S52].
- **2018** Gudmundsson et al. at King predict level pass rates from a bot to 4.0% error [V, E1, S78].
- **May 2020** Dead Cells Update 19 smooths its Boss Cell ladder "without the big walls" [V, E2, S39, S40].
- **2020** Reguera et al. model 11.8 million Candy Crush players as passing racing abandoning [V, E1, S81].

**Gen 4: Posted targets, smoothed ladders and our build (2022-2026)**
- **May 2022** Peglin adds its first cruciball steps, a ladder unlocked by a win [V, E2, S31].
- **Oct 2023** The Classic Tetris World Championship adds a level 39 "super killscreen" once players survive level 29 [V, E3, S61].
- **Mar 2024** King's GDC talk says "crazy hard levels never pay off" [V, E2, S47].
- **Apr 2024** Balatro 1.0.1f lowers the middle antes and raises the last ones on harder stakes [V, E3, S29].
- **Jan 2026** King describes following a hard level with a lighter one [V, E2, S49].
- **Sep 2026** MatchRPG's first commit sets the scroll constants, unchanged since [K, E1].
- **Oct 2026** MatchRPG v0.5.1 adds mastery tiers on a hidden clock because "a slow player has no game" [K, E2].
- **Oct 2026** MatchRPG v0.7 wounds the Ogre King 15% per loss [K, E1].
- **Nov 2026** MatchRPG v0.7.14 closes our data window at 859 runs, 21 players and 6 wins [K, E1].

---

## 7. Pattern cards

Fifteen cards in six families, merged from about 60 candidate cards across nine research notes. Each card gives the minimal rule, graded evidence, the cost (S, M or L) and the MatchRPG constant to change. Where a pattern has a figure, it sits right after its card.

- **A.** Story descent and walls
- **B.** Board pressure and warnings
- **C.** Learning and meta-progression across runs
- **D.** Tiers and the clock
- **E.** Endless and ladders
- **F.** Measurement

### Family A: Story descent and walls

### A1. Walls on a fixed cadence, short and hard

*Lineage.* Arcade boss stages → Candy Crush level 65 (2012), a planned wall that converted payers and churned the rest → King's time to pass and time to abandon, and "harder means shorter" (GDC 2024) → MatchRPG's elites at 12 and 24 and a boss at 36.

*Feeling.* Challenge and fiero at a rhythm the player learns, with Submission in between.

*Mechanism.* Fix the cadence, give each wall slot a band, and tune the wall, never the cadence.

```
cadence:   elite at 12 and 24, boss at 36            # set = world
bands:     normal ≥ 99%, elite 80-90%, boss 65-75% win rate
length:    elite fight 5-12 s, boss fight 20-40 s, p75 under 45 s
rule:      a wall outside its band changes its HP or its damage, one per build
           the harder the wall, the shorter its fight
```

*Works when / breaks when.* Works when attempts are cheap, as with 3-minute runs and a 53 s retry. Breaks when a wall is both long and hard. Breaks when the first wall needs more attempts than a casual player gives in two or three sittings.

*Evidence.* King says level 65 became its highest-converting level and its biggest churn point, and its first A/B test found the easier version kept players and earned more later [V, E2, S47, S48]. King says "the longer the level is, the less likely it is to be fun" [V, E2, S47]. A paper on 11.8 million players models each level as passing racing abandoning [V, E1, S81]. Royal Match labels a Hard level about every 10, by an analyst's reading [U, E3, S56]. Our bosses take 30% to 42% of attempts, elites 12% to 22% and normal encounters about 1% [K, E1, S4].

*Cost and knobs.* S. World boss stats (`scripts/data/enemy_defs.gd:156-167`), `ELITE_HIT` (`scripts/runner/runner.gd:88-89`), `BRACE_HITS` and `BRACE_BLOW` (`runner.gd:281, 285`).

*In MatchRPG.* The cadence is right. The Ogre King (87.5%) and Broodmother (86.1%) sit in the elite band. Old Mossback (63.4%) sits just under the boss band, costs 7 attempts, and at a median 38 s is the longest wall in the game, which is King's worst case (A3). The world 3 and 4 bosses (58%) face survivors, so read them with F1 before touching them. Put the bands into the dashboard as flags (§13).

*Ratings 1–5 (author judgement):* Fun impact 5 · Evidence 4 · Cheapness 4 · Fit 5 · Testability 4

### A2. A landing after each wall

*Lineage.* Tetris The Grand Master drops gravity from 144/256 G to 4/256 G at level 200 (1998) → King follows a hard Candy Crush level with a lighter one on purpose (2026) → Hearthguard's chapter sawtooth.

*Feeling.* Relief after a peak, and a few encounters to feel the hero's new strength.

*Mechanism.* Delay the depth step by three encounters, so the slots after a wall stay on the old step.

```
step(n)        = floor(n / 12)
landing:       if n mod 12 is 1, 2 or 3 and n > 12, use step(n) − 1
depth_power(n) = 1 + 0.45 × step(n)
```

*Works when / breaks when.* Works when the next wall is still a step up, so the overall rise is kept. Breaks if the landing runs so long that it becomes a plateau.

*Evidence.* TGM's dip is in its gravity table [V, E1, S20]. King's designer describes the hard-then-lighter rhythm [V, E2, S49]. Hearthguard's research found a rise and a reset inside each set in four successful puzzle games (Linehan et al.) [V, E1, S1]. Our slots after a wall are already safe (0.23% loss at world 1 encounters 13-23), so the landing is about felt power, not survival [K, E1].

*Cost and knobs.* S. A new `LANDING` length (0 to 5) inside `depth_power` (`scripts/runner/runner.gd:1748-1753`).

*In MatchRPG.* Today encounter 13 has 34 HP against 23 at encounter 11, so the first enemy after the Ogre King is already a step harder [K, E1]. With `LANDING` 3 the step arrives at 16, which turns the stairs into a sawtooth with the set being 12 encounters. Check it against H3 with the encounter timeline (§13).

*Ratings 1–5 (author judgement):* Fun impact 3 · Evidence 3 · Cheapness 4 · Fit 4 · Testability 4

### A3. Ease the stall wall, keep the last one hard

*Lineage.* Candy Crush level 65 eased after launch → Dead Cells Update 19 smooths its Boss Cells "without the big walls we had before" (2020) → Balatro 1.0.1f lowers antes 3 and 4 and raises ante 8 on harder stakes (2024).

*Feeling.* Challenge without a cliff where newcomers quit, and fiero at the first boss within a few sittings.

*Mechanism.*

```
find the stall:  the wall with the most attempts to first clear
                 and the most lapsed players whose last run ended there
ease it:         one knob, about 15% of its HP
until:           median attempts to first clear ≤ 4
keep:            later walls and the final boss unchanged
```

*Works when / breaks when.* Works when the stall is a number problem, which the bot floor can confirm (F2). Breaks when it is a reading problem, where the fix is a warning.

*Evidence.* Balatro's white ante 3 went 2,800 to 2,000 and ante 4 6,000 to 5,000, while green ante 8 rose to 100,000 [V, E3, S29]. Dead Cells eased Boss Cells 1 to 3 [V, E2, S39, S40]. Roohi et al. found hard levels lose the least persistent players first [V, E1, S79]. A field test on over 300,000 players found easing for predicted churners raised retention [V, E1, S82]. Our stall is Old Mossback, 7 attempts against 3 for the Warden, and 7 of 10 lapsed players stopped in world 1 [K, E1, S4].

*Cost and knobs.* S. Old Mossback's HP in `scripts/data/enemy_defs.gd:156-167`; its brace (`runner.gd:281-285`) stays.

*In MatchRPG.* Lower Old Mossback from 765 to 650 HP and leave everything else. The brace still forces at least 15 hits, so the fight keeps its shape and loses about 6 s [I]. Run the bot on 20 seeds per tier, then ship it alone and read attempts to first clear and hazard at encounter 36 (H1). If attempts stay above 4 after two weeks, add C2. Leave Astaroth alone; the six wins were earned there.

*Ratings 1–5 (author judgement):* Fun impact 5 · Evidence 4 · Cheapness 5 · Fit 5 · Testability 5

### Family B: Board pressure and warnings

### B1. A speed ramp tuned to the run it serves

*Lineage.* NES Tetris's table runs out at level 29 (1989) → Tetris The Grand Master makes top speed a designed state (1998) → Canabalt lets acceleration fall as speed rises (2009) → 10000000's scrolling dungeon (2012).

*Feeling.* Sensation and rising tension inside one run, with top speed as a felt event for regulars.

*Mechanism.*

```
scroll(t_d) = min(BASE + ACCEL × t_d, MAX)    # px per dungeon s; t_d outside fights
target:     0.75-0.85 of range at the world 2 boss, full speed by the world 3 boss
optional:   Canabalt shape, ACCEL falls in steps as speed rises
guard:      first run keeps ACCEL × 0.6; tier clock unchanged
```

*Works when / breaks when.* Works when the board stays readable at top speed, and pace holds at 0.43-0.49 moves/s at every depth [K, E1]. Breaks if the faster ramp lands on newcomers first.

*Evidence.* NES Tetris covers a 48x range in steps [V, E1, S18]. Canabalt's acceleration falls from +50 to +10 px/s², tuned by feel [V, E2, S22, S23]. Keller and Bless found adapted Tetris speed beat fixed slow and fixed fast, and later reviews favour slight overload [V, E1, S72, S73]. Natalizio et al. found slow Tetris less engaging than medium or fast [V, E1, S74]. Our scroll sits at 0.23, 0.55, 0.82-0.86 and 1.0 of range at the bosses of worlds 1 to 4 [K, E1, S4].

*Cost and knobs.* S. `SCROLL_ACCEL` (`scripts/runner/runner.gd:68`), `BASE_SCROLL` (`:67`), `MAX_SCROLL` (`:69`), `FIRST_RUN_ACCEL` (`:200`).

*In MatchRPG.* Raise `SCROLL_ACCEL` from 0.15 to 0.22. On the measured pauses this puts the scroll at 0.35 of range at the world 1 boss, 0.82 at the world 2 boss and at full speed by the world 3 boss [I, model]. A new player at the Ogre King barely notices; a regular in world 2 feels the climb. Ship it as a switchback (F2) and stop if world 2's dark share passes 35%.

*Ratings 1–5 (author judgement):* Fun impact 4 · Evidence 3 · Cheapness 5 · Fit 5 · Testability 4

### B2. Two death channels, each warned

*Lineage.* Juul's energy and termination punishments (2009) → the chaser behind endless runners → 10000000's edge (2012) → MatchRPG's pillar "dying without warning is not".

*Feeling.* Challenge felt as fair, and failure as information.

*Mechanism.*

```
per channel (HP in fights, the dark between fights):
  warning budget: ≥ 2 s of danger before 95% of deaths
HP channel:   a blow worth more than 35% of the hero's max HP
              needs a telegraph of ≥ 1 s on the board
dark channel: keep EDGE_MERCY and the cue that reaches the board
```

*Works when / breaks when.* Works while each channel has its own cue where the player looks. Breaks when both peak at once, or when a cue lives in the dungeon strip.

*Evidence.* Dark deaths have a median 7 s of edge danger and 2.2% have 1 s or less. HP deaths have a median 5 s of low HP, 9.6% have 1 s or less, and 98.4% end inside a wall fight [K, E1, S4]. v0.7.13 cut the Sleeper Below's warp warning from 1.5 s to 0.8 s, and dark deaths at start level 21+ then rose from 20% to 36%, on 22 runs from 3 players, a flag rather than a finding [K, E1]. Puzzle Quest's team found players need to be luckier than the AI before a fight feels fair [V, E2, S13].

*Cost and knobs.* M. A hero-side blow check, a telegraph rule and a warning counter (§13). Knobs `HP_WARN` (`runner.gd:193`), `ELITE_HIT` (`:88`), boss telegraph times.

*In MatchRPG.* The dark channel passes; the HP channel fails about 1 death in 10. `BRACE_BLOW` caps what the hero takes off a boss, not what a boss takes off the hero. Restore the Sleeper's 1.5 s warning first, a one-line revert. Then count warnings shown and reacted so the next pass can name the blows that kill without warning (H5).

*Ratings 1–5 (author judgement):* Fun impact 4 · Evidence 3 · Cheapness 3 · Fit 5 · Testability 3

### B3. Stop time paid by combos

*Lineage.* Tetris Attack's Stop, a pause of the rising stack earned by chains (1995) → Canabalt's stumble, where a mistake lowers speed 30% (2009) → MatchRPG's held timers while the board resolves.

*Feeling.* Relief earned by skill, and Expression on the board.

*Mechanism.*

```
on a cascade of c ≥ 2, or a 5-match:
  hold the scroll for STOP_S × (c − 1) seconds, at most STOP_MAX
STOP_S = 0.5 s, STOP_MAX = 2 s; the lead stays capped at LEAD_MAX
```

*Works when / breaks when.* Works where the dark is the threat, between fights. Breaks if combos become the only way to survive the edge, which punishes slow readers.

*Evidence.* Tetris Attack's Stop is in community wikis [V, E3, S21]. Canabalt's stumble rule is a designer statement [V, E2, S22]. 86% of our runs that end at a normal encounter end by the dark [K, E1].

*Cost and knobs.* M. A new runner rule. Knobs `STOP_S`, `STOP_MAX`, with `LEAD_MAX` 440 px (`runner.gd:54`) as the cap.

*In MatchRPG.* The held timers are the hook. Check it against the chain-stop history (v0.7.5, v0.7.7) so it does not bring back something cut on purpose. If B1 ships, B3 is the matching relief for the faster ramp (H7).

*Ratings 1–5 (author judgement):* Fun impact 3 · Evidence 2 · Cheapness 3 · Fit 4 · Testability 4

### Family C: Learning and meta-progression across runs

### C1. Every go pays, with an honest floor

*Lineage.* Rogue keeps nothing on death (1980) → Puzzle Quest keeps hero XP (2007) → 10000000 brings loot home to a castle (2012) → You Must Build A Boat makes a 30-second session advance the game (2015).

*Feeling.* Steady progress and Competence across runs, with no wasted run.

*Mechanism.*

```
banked XP  = full XP up to the first level + rest × XP_PAST_LEVEL
lost wall  = LOST_FIGHT_XP × the wall's XP × share of its HP taken off
visible:   the results screen names the next affordable buy
           and the XP to the next talent row
```

*Works when / breaks when.* Works when the next upgrade is close enough to see. Breaks when the gain is too small to notice, or so large it replaces skill, which Redwood called his hardest tuning problem.

*Evidence.* Redwood wanted every go to progress the game "a little bit" [V, E2, S10]. Huang et al. found players stop for boredom and life far more than for skill [V, E1, S77]. A sitting ends after 27% of non-best runs and 25% of bests, so failure does not push our players out [K, E1].

*Cost and knobs.* S. `LOST_FIGHT_XP` (`scripts/runner/runner.gd:109`), `XP_PAST_LEVEL` (`scripts/autoload/game_state.gd:257`), `xp_to_next` (`game_state.gd:250-251`).

*In MatchRPG.* The XP knobs move the wall less than they look. In our model, `LOST_FIGHT_XP` from 0.5 to 1.0 lifts an Ogre King death from 51 to 65 XP and an Old Mossback death from 317 to 342, and moves a stuck player by at most one level by run 50 [I, model]. Ship it, since it is free. The real pay for a wall death is gold, wood and stone, so make the results screen name the next buy or the XP to the next row (H6). Keep `XP_PAST_LEVEL` at 1/3 and say when it applies.

*Ratings 1–5 (author judgement):* Fun impact 4 · Evidence 4 · Cheapness 5 · Fit 5 · Testability 4

### C2. Capped hidden mercy at the wall

*Lineage.* Crash Bandicoot 2's mask after about 6 deaths and checkpoint crates after about 6 more (1997) → Resident Evil 4's hidden rank (2005, exposed 2015) → Hades God Mode, 20% plus 2% per death to 80% (2020) → MatchRPG's Ogre King wound (v0.7).

*Feeling.* The wall gives way while the player still feels it was them.

*Mechanism.*

```
wall_hp(k) = base_hp × (1 − min(STEP × k, MAX))    # k = losses, until beaten once
Ogre King:     STEP 0.15, MAX 0.60    # today
Old Mossback:  STEP 0.05, MAX 0.25    # proposed, on top of A3
rules: help only; never a tax on good play; capped
```

*Works when / breaks when.* Works on a few gates, unnoticed or forgiven when found. Breaks when tied to money or a tax on good play. Losing on purpose costs minutes, so farming it is not worth it.

*Evidence.* Crash's help went mostly unnoticed [V, E2, S58]. Resident Evil 4's exposure drew curiosity, not anger [V, E3, S57]. EA's suspected engagement tuning became a lasting trust problem [V, E3, S59]. Johnson's rule says hidden help may favour only the player [V, E2, S14]. The Ogre King needs 3 attempts at the median and Old Mossback, with no help, 7 [K, E1].

*Cost and knobs.* S. `WOUND_STEP`, `WOUND_MAX` (`scripts/autoload/game_state.gd:994-995`), and which walls they reach.

*In MatchRPG.* The help stops where the bigger wall starts. Extend the wound to Old Mossback at 5% per loss to 25%, only if A3 alone leaves attempts above 4; on a 650 HP Mossback that is 488 HP after five losses [I]. Keep it hidden. A line after the first clear ("Old Mossback was worn down by your attempts") turns it into credit, and Hearthguard's placebo result says framing is free [V, E1, S1].

*Ratings 1–5 (author judgement):* Fun impact 4 · Evidence 3 · Cheapness 5 · Fit 5 · Testability 4

### C3. Posted next wall and an honest near miss

*Lineage.* Super Hexagon's named modes, each with one 60 s goal (2012) → Luck be a Landlord posts the rent before each period (2021) → Balatro shows the blind's target before the hand (2024) → Larche et al.

*Feeling.* Failure as information. "Next time I pass the Broodmother."

*Mechanism.*

```
on the board:     "Elite in N encounters" from N = 3
on the results:   the wall reached and its record ("Old Mossback: 2 of 6 tries")
                  real distance to the best and to the next wall, only within 15%
never:            manufactured closeness
```

*Works when / breaks when.* Works when retry is cheap. Breaks into a dark pattern with paid continues or fake numbers.

*Evidence.* Balatro and Luck be a Landlord post their targets [V, E3, S27, S36]. Cavanagh calls his first two modes "just practice" [V, E2, S44]. Larche et al. found near misses the most frustrating outcome and the strongest urge to keep playing, in 60 players [V, E1, S84]. Jensen et al. found depth reached tracked felt competence in Hades [V, E1, S86].

*Cost and knobs.* S. The warning distance N and the 15% window.

*In MatchRPG.* The pillar says warnings reach the board, and the elite warning is one more. Adding the wall record turns a depth number into a step reached. It is the cheapest answer to the 7 of 10 lapsed players who left in world 1 (H6).

*Ratings 1–5 (author judgement):* Fun impact 3 · Evidence 3 · Cheapness 4 · Fit 4 · Testability 3

### Family D: Tiers and the clock

### D1. Tempo DDA with no reward for dropping

*Lineage.* Elo provisional ratings → Lichess marks accounts that lose on purpose → Hearthstone rank floors and Apex demotion shields → Marvel Puzzle Quest ties scaling to clearance and players talk of dropping (2017) → MatchRPG's tiers on a hidden clock (v0.5.1).

*Feeling.* Challenge equal per move, with the tier read as a badge.

*Mechanism.*

```
place:   median moves/s of the last 10 runs, once 5 count
clock:   bronze 0.65, silver 0.85, gold 1.1, diamond 1.25   # hidden
move:    up at once; down one step after 5 slow runs in a row
add:     a demoted player keeps their best and board mark for the version
add:     the first run after a promotion plays the midpoint clock
log:     depth and pace of the 5 runs before each demotion
```

*Works when / breaks when.* Works between tiers whose players differ only in pace. Breaks for the slowest tier, and once players learn that dropping buys an easier dungeon.

*Evidence.* Gold and diamond reach 1,316 m and 1,317 m while diamond moves 14% faster [K, E1, S4]. Tiers moved 9 times up and 5 down in 817 run pairs [K, E1]. Marvel Puzzle Quest players said they would drop clearance [V, E3, S52]. Lichess forbids sandbagging [V, E3, S63]. Huang et al.'s 10-match recovery after a break supports a slow demotion [V, E1, S77].

*Cost and knobs.* S. `TierDefs.CLOCK` (`scripts/data/tier_defs.gd:25`), tier lines (`server/api/_lib.js:52`), `DROP_RUNS` and `WINDOW` (`_lib.js:66-75`).

*In MatchRPG.* The clock works for gold and diamond; keep it. Keep a demoted player's best visible, since today a best on a former tier is hidden. Soften the promotion spike with one midpoint run. Log demotions so deliberate slow play shows as slow runs that still go deep. Separately, try silver at 0.80 in the lab and 0.75 there before any live change, since silver's gap rests on 9 players (H8).

*Ratings 1–5 (author judgement):* Fun impact 4 · Evidence 3 · Cheapness 4 · Fit 5 · Testability 3

### D2. Opt-in faster clock that pays

*Lineage.* NES Tetris lets players start at level 0 to 19 and pays more at higher levels (1989) → the championship start at level 18 → Vampire Survivors' Curse trades more enemies for more XP (2022) → Hearthguard's player-steered pressure card.

*Feeling.* Expression and fiero from choosing a harder game.

*Mechanism.*

```
toggle before a run: "One tier up"
the run plays the next clock up (diamond: × 1.15)
reward: +20% gold, wood and stone, and a mark on that tier's board
toggled runs never count toward placement or demotion
```

*Works when / breaks when.* Works when the reward is visible. Breaks if toggled runs leak into placement.

*Evidence.* NES Tetris pays 12,000 for a Tetris at level 9 and 36,000 at level 29 [V, E3, S19]. Curse raises enemy stats and spawns and speeds up power [V, E3, S42]. Most players in Hearthguard's cited study preferred choosing difficulty by hand [V, E1, S1]. Lichess rates each time control apart [V, E2, S62].

*Cost and knobs.* M. A toggle, a reward rule and a board flag.

*In MatchRPG.* Today speed is a threat the player earns without choosing, labelled as a reward. The toggle gives the label a body and answers D1's risk from the other side (H8).

*Ratings 1–5 (author judgement):* Fun impact 3 · Evidence 3 · Cheapness 3 · Fit 4 · Testability 4

### Family E: Endless and ladders

### E1. Opt-in ladder after the first clear, one knob per step

*Lineage.* Diablo 3's Monster Power (2012) → Slay the Spire's 20 ascensions → Brotato's Danger 0-5 and Peglin's cruciball (2022) → Balatro's 8 stakes (2024).

*Feeling.* Challenge and Discovery for players who want them, with the base descent left alone.

*Mechanism.*

```
unlock:   beat Astaroth; step k unlocks on a clear with steps 1..k−1 active
10 steps, one knob each, ≈ 40% enemy stats, 40% cuts to healing or economy, 20% behaviour
total enemy stat inflation ≤ +40%; no step puts two hard draws in one encounter
examples: extra elites at 6, 18, 30 · one fewer belt slot · EDGE_MERCY 0.30
          · ELITE_HIT 1.8 · campfires heal half · each boss gains a move
```

*Works when / breaks when.* Works after a first clear, with even steps. Breaks when a step is pure HP padding, or when random modifiers stack into a spike.

*Evidence.* Slay the Spire's list mixes 9 stat steps, 6 cuts and 4 new behaviours [V, E3, S33]. Peglin limited its step 19 in v1.0.6 [V, E3, S30; V, E2, S32]. Brotato's Danger 3 to 5 add +12%, +26% and +40% [V, E3, S34]. Luck be a Landlord moved difficulty into opt-in floors after feedback [V, E2, S37]. Six of our players won, and a win ended the sitting 3 times in 6 [K, E1].

*Cost and knobs.* L. A ladder screen, step rules, boards and a test pass per step.

*In MatchRPG.* After the win, today's only new things are endless and blessings [K]. A ladder of named knobs is the "challenges" Redwood wished he had built. Build it after A3 and B1 settle, because a ladder on an untuned base multiplies its faults (H9).

*Ratings 1–5 (author judgement):* Fun impact 4 · Evidence 4 · Cheapness 2 · Fit 4 · Testability 3

### E2. Endless with a new beat per lap and a designed end

*Lineage.* NES Tetris's accidental kill screen → TGM's designed 20G (1998) → 10000000's endless, "a bit of a cop out" (2012) → Brotato's quadratic endless formula → the championship's level 39 (2023).

*Feeling.* Challenge with a known horizon, Discovery each lap, and a run that ends instead of fading.

*Mechanism.*

```
lap 1:        worlds 1-3 lifted × 1.5 over story stats
past bottom:  depth_power × 1.12 per 12 encounters        # keep
each lap:     one new named modifier, or 3 rotating endless goals
target:       endless median 9-12 min
```

*Works when / breaks when.* Works when something new appears per lap. Breaks if the lift lands before the build can show off, or if goals repeat.

*Evidence.* Redwood called his endless "a bit of a cop out" and planned challenges [V, E2, S7]. Game Informer's writer found "nothing meaningful left to do" [V, E4, S8]. Brotato's endless factor is quadratic in waves past 20 [V, E3, S35]. Missions with three active are common in endless games [V, E3, S46]. Our endless runs last a median 559 s and their depth flattens after about 10 runs [K, E1].

*Cost and knobs.* M. Lap 1 lift (`scripts/data/world_defs.gd:168-185`), `ENDLESS_POWER` (`runner.gd:77`), goals.

*In MatchRPG.* The length is on target, so leave `ENDLESS_POWER` at 0.12; gentle is what keeps runs near 9 minutes. Fix the ends instead. Lift lap 1 so the first five minutes are not a walk, and add one named beat per lap (H10).

*Ratings 1–5 (author judgement):* Fun impact 4 · Evidence 3 · Cheapness 3 · Fit 4 · Testability 3

### Family F: Measurement

### F1. Hazard by encounter, with two weightings

*Lineage.* Actuarial life tables → the Kaplan-Meier estimator (1958) → King's pass rate per level → Reguera et al.'s race between passing and abandoning (2020).

*Feeling.* None directly. It protects every other curve from bad reading.

*Mechanism.*

```
h(k) = runs ending at encounter k / runs reaching k      # attempts, never players
S(k) = Π over j ≤ k of (1 − h(j)); wins censored at 180; resumed runs enter late
band: 2,000-sample player bootstrap
flag: h(k) ≥ 2 × the world's median normal hazard, or outside its A1 band
show: run-weighted and player-weighted side by side; hide cells under 3 players or 30 runs
```

*Works when / breaks when.* Works with many runs per stage. Breaks where fewer than 10 players or 30 runs are at risk, today world 4 and beyond.

*Evidence.* Reguera et al. fit 11.8 million players with competing pass and abandon times [V, E1, S81]. Bertens et al. predict churn level with survival models [V, E1, S92]. Cameron et al. found standard tests reject a true null about 10% of the time with 5 to 30 clusters [V, E1, S89]. Roohi et al. found churn tracks pass rate far better when it counts only players who quit without clearing [V, E1, S79]. 85% of our story-depth variance lies inside players [K, E1].

*Cost and knobs.* S. SQL or Python on `reached`, `won` and `resumed_from`.

*In MatchRPG.* The payload supports this today. The player-weighted line shows the Ogre King clearing 87.5% of runs but 65.7% of a typical player's runs, and every balance pass should see that gap.

*Ratings 1–5 (author judgement):* Fun impact 3 · Evidence 4 · Cheapness 5 · Fit 5 · Testability 5

### F2. Switchback test with a bot floor

*Lineage.* Crossover trials → DoorDash's switchbacks for few units (2019) → King's bot that predicts pass rates (2018) → MatchRPG's `balance_sim --gaps-file`.

*Feeling.* None directly. It stops the team shipping a change two people liked.

*Mechanism.*

```
knob value = hash(player, run_no) mod 2        # flips per run, inside each player
metric:    hazard at the target wall, edge_seconds per minute, low_hp_seconds
analysis:  one mean difference per player; sign test or paired t across players
length:    fixed in advance, 14 days or 20 runs per arm per player
bot:       same hazard table from balance_sim at the live gap distribution, 20 seeds
           human ≫ bot at a wall → reading problem; both high → number problem
```

*Works when / breaks when.* Works for in-run knobs. Breaks for meta knobs that carry over, and when the knob moves the tier.

*Evidence.* DoorDash describes switchbacks for few independent units [V, E2, S91]. Gudmundsson et al. predicted player pass rates from bot runs to 4.0% mean error [V, E1, S78]. With our variance, a 10-against-11 split detects about 700 m of depth and a switchback with 20 runs per arm about 360 m [I, E1 arithmetic; V, E1, S90].

*Cost and knobs.* S. A `variant` field (§13) plus a coin.

*In MatchRPG.* First candidates are `SCROLL_ACCEL`, `EDGE_MERCY` and `ELITE_SCROLL`. The bot already reads real players' move gaps and was fitted to 0.46 and 0.54 moves per second [K, E1]. Use the bot to sweep a knob and the players to test the two best values.

*Ratings 1–5 (author judgement):* Fun impact 3 · Evidence 4 · Cheapness 4 · Fit 5 · Testability 4

---
## 8. Comparison scorecard

The fifteen cards side by side. Ratings are author judgement in the order Fun impact · Evidence · Cheapness · Fit · Testability.

| # | Pattern | Fun | Evid. | Cheap | Fit | Test | Sum |
|---|---|---|---|---|---|---|---|
| A1 | Walls on a fixed cadence, short and hard | 5 | 4 | 4 | 5 | 4 | 22 |
| A2 | A landing after each wall | 3 | 3 | 4 | 4 | 4 | 18 |
| A3 | Ease the stall wall, keep the last one hard | 5 | 4 | 5 | 5 | 5 | 24 |
| B1 | A speed ramp tuned to the run it serves | 4 | 3 | 5 | 5 | 4 | 21 |
| B2 | Two death channels, each warned | 4 | 3 | 3 | 5 | 3 | 18 |
| B3 | Stop time paid by combos | 3 | 2 | 3 | 4 | 4 | 16 |
| C1 | Every go pays, with an honest floor | 4 | 4 | 5 | 5 | 4 | 22 |
| C2 | Capped hidden mercy at the wall | 4 | 3 | 5 | 5 | 4 | 21 |
| C3 | Posted next wall and an honest near miss | 3 | 3 | 4 | 4 | 3 | 17 |
| D1 | Tempo DDA with no reward for dropping | 4 | 3 | 4 | 5 | 3 | 19 |
| D2 | Opt-in faster clock that pays | 3 | 3 | 3 | 4 | 4 | 17 |
| E1 | Opt-in ladder after the first clear, one knob per step | 4 | 4 | 2 | 4 | 3 | 17 |
| E2 | Endless with a new beat per lap and a designed end | 4 | 3 | 3 | 4 | 3 | 17 |
| F1 | Hazard by encounter, with two weightings | 3 | 4 | 5 | 5 | 5 | 22 |
| F2 | Switchback test with a bot floor | 3 | 4 | 4 | 5 | 4 | 20 |

**Reading the table.** A3 leads alone. It is one constant aimed at the worst number in our data, 7 attempts at Old Mossback, and the live funnel will show within two weeks whether it worked. A1, C1 and F1 follow at 22; A1 and F1 tell us where the walls are, and C1 is free. B1 and C2 are one-line changes to curves nobody has tuned. The ladder (E1) and endless beats (E2) score low because they cost the most and serve 6 winners, not because they matter less; they answer the half of winners who end their sitting at the win. B3 has the weakest evidence and waits for B1.

---

## 9. Natural experiments

A natural experiment is a change plus the reaction to it, with the date and numbers when known. Twenty cases, oldest first; the last five are MatchRPG's own changes inside our data window. Grades refer to the strongest evidence in the row.

| # | Game | When | Change | Reaction | Grade | Lesson |
|---|---|---|---|---|---|---|
| 1 | Crash Bandicoot 2 and N. Sane Trilogy | 1997; remaster Jun 2017 | A mask after about 6 deaths in a section, checkpoint crates after about 6 more; the remaster adds it to the first game | Rarely noticed; the remaster was called hard for other reasons | E2 [V, E2, S58] | Failure-count help with a cap works quietly, but cannot fix a feel problem |
| 2 | Resident Evil 4 | 2005; exposed Jun 2015 | A hidden rank eases enemies when the player struggles, never announced | Press called it secret adjustment; reaction was curiosity, not anger | E3 [V, E3, S57] | Hidden help that only aids a struggling player is forgiven when found |
| 3 | Candy Crush Saga | 2012, eased later | Level 65 shipped as a hard finale, then eased using attempt data | Highest-converting level and biggest churn point; players enjoy the eased version more | E2 [V, E2, S47, S48] | A wall converts payers and loses everyone else; with no store, MatchRPG only gets the churn |
| 4 | Flappy Bird | Feb 2014 | No change; flat difficulty from the first pipe and an instant retry; pulled | Its designer called it "an addictive product" | E2 [V, E2, S60] | The control case; a flat curve with a 1 s retry is compulsive on its own |
| 5 | Gems of War | Oct 2015, 1.0.7 | Gem falls, shifts and matches sped up; spells kept their old speed | Split; some could not follow cascades and asked for a toggle | E3 [V, E3, S53] | Board tempo is limited by how fast players can read a cascade |
| 6 | Marvel Puzzle Quest | Mar 2016; May 2017 | Public tests of roster-based scaling; then scaling tied to clearance level | Players said they would drop clearance to keep clears short | E3 [V, E3, S51, S52] | Scaling that rises with progress invites sandbagging |
| 7 | Hearthstone | Apr 2020 | Five leagues with rank floors and a star bonus from last season | About 9-10x as many Legend players in the first month; confounded by an expansion | E1 [V, E1, S64, S65] | Floors and a fast climb make a ladder feel safe |
| 8 | Dead Cells | May to Jul 2020, Update 19 | Boss Cell 0 harder, 1-3 easier, density and damage down, a free amulet per tier | Press said it "smoothed out its difficulty curve"; stated aim "without the big walls" | E2 [V, E2, S39, S40] | Make step 1 harder so step 2 is not a wall |
| 9 | Rogue Legacy 2 | 2021 to v1.2.1 | House Rules sliders for enemy HP and damage; the HP floor lowered from 50% to 25% | Praised as accessibility that also lets players raise the challenge | E3 [V, E3, S41] | Named, visible sliders with no penalty are welcomed |
| 10 | Luck be a Landlord | Early Access, date not found | Forced higher rent moved out of the base game into opt-in floors | The developer cited feedback that forced rent was less fun | E2 [V, E2, S37] | Raise post-win difficulty by opt-in, never by raising the base |
| 11 | Classic Tetris World Championship | Oct 2023 | A level 39 "super killscreen" at twice level 29's speed | Accepted as the way to end marathons | E3 [V, E3, S61] | A top speed is an end only until skill beats it |
| 12 | Unnamed freemium puzzle game | Field test, paper 2023-2025 | Difficulty lowered for players predicted to churn, against a random holdout, over 300,000 players | Retention and engagement up; revenue figures only secondhand | E1 [V, E1, S82] | Easing the curve for at-risk players pays in who stays |
| 13 | Candy Crush Saga | Mar 2024 | Fun measured by time to pass plus time to abandon; the 100 least fun levels rebuilt | A "very significant uplift" in engagement, no number given | E2 [V, E2, S47] | Measure abandonment, and keep hard beats short |
| 14 | Balatro | Apr 2024, 1.0.1f | Middle antes lowered, late antes raised on harder stakes | Press said it "should make winning easier"; exact numbers conflict across sources | E3 [V, E3, S29] | Smooth the stall step and keep the end hard |
| 15 | Peglin | 2024, 1.0 and v1.0.6 | Cruciball 17-20 added; v1.0.6 limited step 19's extra enemies | Step 19 was walked back within patches | E2 [V, E2, S32] | Cap the worst random combination of modifiers |
| 16 | MatchRPG (ours) | 28 Oct 2026, v0.6.6 | `COMBO_STEP` 0.875 to 0.7, cascade multiplier −9% at ×2 to −16% at ×5 | Lab saw no change past noise; the live window also had a potion buff and 6 players | E1 [K, E1, S3, S4] | Ship one change per build, or the data cannot tell them apart |
| 17 | MatchRPG (ours) | 29 Oct 2026, v0.7 | Ogre King loses 15% HP per loss to 60%; a Health potion at the first elite hit | Ogre King win rate 89.7% on v0.6 and 87.0% on v0.7, with a different player mix; median 3 attempts | E1 [K, E1, S3, S4] | Mercy at the small wall does not reach the big one |
| 18 | MatchRPG (ours) | 4-5 Nov 2026, v0.7.4 to v0.7.8 | The chain survives world bosses, chain stops removed, the chain clock waits on the board | Lab median best chain 40-48 to 57-77; the live window's world 1 boss win rate 71.1% at a median lifetime run of 90 | E1 [K, E1, S3, S4] | Raw version windows measure who was playing |
| 19 | MatchRPG (ours) | 5 Nov 2026, v0.7.9 | A run's XP past its first level counts a third, never told | Aimed at the 8% of v0.7 runs that brought 2-3 levels; effect not separable in the window | E1 [K, E1, S3, S4] | A hidden cut aimed at good players should at least be shown |
| 20 | MatchRPG (ours) | 7 Nov 2026, v0.7.12 and v0.7.13 | Gold and diamond lines +0.02 moves/s; the Sleeper's warp warning 1.5 s to 0.8 s; disarming 1 s to 0.5 s | 2 players moved from diamond to gold; dark deaths at start level 21+ rose 20% to 36% on 22 runs and 3 players | E1 [K, E1, S3, S4] | A flag for the next data pull; restore the warning first |

The chart places each experiment by scope area and by how players reacted.

@@FIG:experiments@@

Our own rows need one warning. Raw version comparisons mostly measure who was playing. The world 1 boss win rate climbs from 52.6% on v0.6.0-v0.6.2 to 88.0% on v0.7.12-v0.7.14, while the median player's lifetime runs climb from 12 to 158 [K, E1]. Inside start-level bands the gaps shrink and partly reverse, and no window has more than 12 players. That is why F2 asks for a switchback.

### Recurring lessons

1. A hard beat must be short, and abandonment is the measure, not deaths alone (#3, #13) [I].
2. A wall loses the least persistent players, so ease the first wall before any later one (#3, #12, #14) [I].
3. Hidden help for a struggling player is forgiven; hidden taxes on good play are not (#1, #2, #6) [I].
4. Raise difficulty after the first clear by opt-in, smooth the gaps, and cap the worst stacked case (#8, #10, #15) [I].
5. A speed cap ends play only until skill beats it (#11), and board speed is capped by readability (#5) [I].
6. Ship one curve change per build and test it within players (#16 to #20) [I].

---

## 10. Anti-patterns

Each anti-pattern names the twin that showed it. Five describe MatchRPG today.

### X1. A wall that is also long

King's level 65 was hard and long and became its biggest churn point [V, E2, S47, S48]. MatchRPG's world 1 boss fight is the longest wall in the game (38 s median) and the one that takes the most attempts (7) [K, E1].

### X2. A speed ramp nobody tuned

NES Tetris's level 29 was where the table ran out, not a designed end [V, E1, S18, S19]. MatchRPG's scroll constants are the first commit's, and their top speed arrives in world 4, which 5% of story runs reach [K, E1].

### X3. Mercy that stops before the biggest wall

MatchRPG wounds the Ogre King, gifts a Health potion and halves lost-fight XP, and none of it reaches Old Mossback, which costs twice the attempts [K, E1].

### X4. A tier where dropping pays

Marvel Puzzle Quest players talked of dropping clearance once scaling followed progress [V, E3, S52], and Lichess marks accounts that lose on purpose [V, E3, S63]. In MatchRPG a demotion buys a slower clock [K, E1; I].

### X5. Scaling enemies to the player's visible power

Marvel Puzzle Quest's roster-based scaling made growth feel taxed [V, E3, S51]. MatchRPG's clock follows pace, which players cannot see. Keep hero level and gear out of it [I].

### X6. A post-game that is more of the same

Redwood called 10000000's endless "a bit of a cop out" [V, E2, S7]. MatchRPG's endless lap 1 keeps story stats, so a hero who can win walks through five minutes [K, E1].

### X7. Raising the base curve to serve experts

Luck be a Landlord moved its forced rent into opt-in floors after players found it less fun [V, E2, S37].

### X8. Stacked random modifiers

Peglin's cruciball 19 could roll several hard enemies into one fight and was capped in v1.0.6 [V, E2, S32].

### X9. Silent jumps and silent cuts

Gems of War's Underspire enemies went from levels 10-20 to 14-33 with no notice, and players filed it as a bug [V, E4, S54]. MatchRPG's XP soft cap applies without a word, and v0.7.13 halved the Sleeper's warning [K, E1].

### X10. A record that vanishes on demotion

MatchRPG hides a best left on a former tier [K]. Hearthstone and Clash Royale add floors instead [V, E2, S64, S66].

### Cost of failure, in minutes

Juul splits failure into energy, life, setback and termination punishment [V, E2, S1]. MatchRPG has energy punishment in fights, no life layer, and termination with persistent progression; the death penalty is the run's minutes plus the belt's potions [K, E1]. The minutes are small. The median story run lasts 177 s, death to control takes about 6 s plus two taps, and the median gap between runs in a sitting is 53 s [K, E1]. That sits between Super Hexagon's sub-second restart and a 24-27 minute Hearthguard run [V, E2, S43; K, S1]. A sitting ends after 27% of non-best runs and 25% of bests [K, E1]. The cost of failure is not the problem. The number of failures at one wall is.

---

## 11. Curve Spec for MatchRPG

The Curve Spec is the smallest set of rules that should produce the feelings in §3. It is a design proposal, tested so far only in our curve model [I]. Lower layers set the frame for the upper ones; change them first and least often.

**Layers, bottom to top.**
1. **Run length and walls.** Five worlds of 36 encounters, elites at 12 and 24 and a boss at 36; story runs of 1.5 to 6 minutes and a retry under a minute. Each wall has a win-rate band and a length (A1).
2. **Depth stairs.** `DEPTH_POWER` 0.45 every `DEPTH_EVERY` 12 encounters, with a three-encounter landing after each wall so the stairs become a sawtooth with the set being 12 encounters (A2).
3. **Wall stats.** Elite and boss HP and damage tuned into their bands one knob per build; Old Mossback eased from 765 to 650 HP, every later boss untouched (A1, A3).
4. **Scroll ramp.** `BASE_SCROLL` 18, `SCROLL_ACCEL` 0.22, `MAX_SCROLL` 60, so top speed arrives by the world 3 boss; the first run keeps ×0.6 (B1).
5. **Warnings and mercy.** Each death channel gives at least 2 s of warning before 95% of deaths; edge mercy stays at 0.45; a capped wound at the first two walls (B2, C2).
6. **Tier clock.** Pace places the tier and the tier sets a hidden clock; dropping never pays, a promotion gets one midpoint run, and an opt-in tier up pays (D1, D2).
7. **Meta power between runs.** Every run banks something the results screen names; a lost wall fight pays in full; the XP soft cap stays and is shown (C1, C3).
8. **Endless.** Lap 1 lifted ×1.5 in worlds 1 to 3, ×1.12 per 12 encounters past the bottom, and one new beat per lap (E2).
9. **Ladder.** Ten one-knob steps after the first clear, total stat inflation at most +40% (E1).

**Formulas.**

Current, from the repo [K, E1]:

    scroll(t_d)      = min(18 + 0.15 × t_d, 60)                  # px per dungeon s; first run 0.15 × 0.6
    t_d              = real s × CLOCK[tier], paused in elite fights and arenas
    CLOCK            = 0.65, 0.85, 1.1, 1.25                     # bronze, silver, gold, diamond
    view_mult(d)     = lerp(1, 0.45, d²)                         # d = edge danger over the last 260 px
    view in elites   = × 0.4
    depth_power(n)   = 1 + 0.45 × floor(n / 12)                  # n ≤ 180
    depth_power(n)   = 7.75 × 1.12^(floor(n / 12) − 15)          # n > 180, endless
    enemy_hp(n)      = base_hp × depth_power(n) × lift
    enemy_atk(n)     = base_atk × lift × (0.5 + 0.5 × depth_power(n))
    boss_hp          = 765, 2,000, 3,105, 4,560, 5,160           # lap 1; laps 2+ × depth_power(n) / 7.75
    wound(k)         = Ogre King HP × (1 − min(0.15 × k, 0.6))   # k = losses, until beaten once
    xp_to_next(L)    = 40L + 2L × max(0, L − 8)                  # cap 40
    banked_xp        = XP to the first level + rest / 3
    lost_fight_xp    = 0.5 × fight XP × share of HP taken off
    lap 1 lift       = story stats for the slot

Proposed [I, model]:

    scroll(t_d)      = min(18 + 0.22 × t_d, 60)                  # first run 0.22 × 0.6
    CLOCK            = 0.65, 0.80, 1.1, 1.25                     # silver tested in the lab first
    first run after a promotion: clock = (old + new) / 2
    step(n)          = floor(n / 12), minus 1 when n mod 12 is 1, 2 or 3 and n > 12
    depth_power(n)   = 1 + 0.45 × step(n)                        # n ≤ 180
    boss_hp          = 650, 2,000, 3,105, 4,560, 5,160
    wound(k)         = Ogre King: min(0.15k, 0.6); Old Mossback: min(0.05k, 0.25)
    lost_fight_xp    = 1.0 × fight XP × share of HP taken off
    lap 1 lift       = × 1.5 in worlds 1-3 of an endless run
    wall bands       : elite 80-90%, boss 65-75%, boss fight 20-40 s

In the model the proposal puts the scroll at 0.35 of its range at the world 1 boss, 0.82 at the world 2 boss and at full speed by the world 3 boss [I, model]. Lost-fight XP at 1.0 adds 14 XP to an Ogre King death and 25 to an Old Mossback death [I, model]. Trust the bot over the model where they disagree.

| Knob | Where | Now | Proposed | Range | Moves |
|---|---|---|---|---|---|
| `BASE_SCROLL` | `scripts/runner/runner.gd:67` | 18 px/s | 18 px/s | 12-30 | Starting pressure and slack in world 1 |
| `SCROLL_ACCEL` | `scripts/runner/runner.gd:68` | 0.15 px/s² | 0.22 px/s² | 0.10-0.35 | Where in the descent the tempo peaks (B1) |
| `MAX_SCROLL` | `scripts/runner/runner.gd:69` | 60 px/s | 60 px/s | 45-80 | Top tempo; edge slack at full speed |
| `FIRST_RUN_ACCEL` | `scripts/runner/runner.gd:200` | 0.6 | 0.6 | 0.4-1.0 | The first run's ramp, the newcomer guard |
| `EDGE_MERCY` | `scripts/runner/runner.gd:197` | 0.45 | 0.45 | 0.30-0.70 | Hidden slack near the edge; a ladder step can lower it |
| `ELITE_SCROLL` | `scripts/runner/runner.gd:87` | 0.4 | 0.4 | 0.2-0.6 | Edge pressure during elite fights |
| `DEPTH_EVERY` | `scripts/runner/runner.gd:75` | 12 | 12 | 6-18 | Stair length, and whether steps land on the walls |
| `DEPTH_POWER` | `scripts/runner/runner.gd:76` | 0.45 | 0.45 | 0.30-0.60 | Stair height in the story descent |
| `LANDING` (new) | `scripts/runner/runner.gd:1748-1753` | 0 encounters | 3 encounters | 0-5 | The relief after each wall (A2) |
| World boss HP | `scripts/data/enemy_defs.gd:156-167` | 765, 2,000, 3,105, 4,560, 5,160 | 650, 2,000, 3,105, 4,560, 5,160 | Mossback 550-765 | The stall wall and the boss peaks (A3) |
| `WOUND_STEP`, `WOUND_MAX` | `scripts/autoload/game_state.gd:994-995` | 0.15, 0.6, Ogre King only | Ogre King 0.15, 0.6; Old Mossback 0.05, 0.25 | step 0-0.2, cap 0-0.6 | Hidden stacking assist at the first walls (C2) |
| `LOST_FIGHT_XP` | `scripts/runner/runner.gd:109` | 0.5 | 1.0 | 0.5-1.0 | XP from a lost wall fight (C1) |
| `XP_PAST_LEVEL` | `scripts/autoload/game_state.gd:257` | 1/3 | 1/3, shown on the results screen | 1/4-1/2 | Levels per run for strong runs |
| `TierDefs.CLOCK` | `scripts/data/tier_defs.gd:25` | 0.65, 0.85, 1.1, 1.25 | 0.65, 0.80, 1.1, 1.25 | silver 0.75-0.85 | Dungeon tempo per tier, and silver's gap (D1) |
| `ENDLESS_POWER` | `scripts/runner/runner.gd:77` | 0.12 | 0.12 | 0.08-0.20 | Compound growth past the bottom |
| Lap 1 lift | `scripts/data/world_defs.gd:168-185` | 1.0, story stats | 1.5 in worlds 1-3 | 1.0-2.0 | The endless lap 1 plateau (E2) |

---
## 12. The curve lab

The curve lab, `curves-matchrpg-lab.html`, plots the Curve Spec with one slider for each knob in the §11 table [K, S5]. It is a model, not the game. It knows the constants and the measured shape of real runs (where fights pause the ramp, how long walls take, which tier plays which clock), and reads hero power from the run data instead of simulating talents, relics, items and the town [I].

The sliders are exactly the §11 knobs. `BASE_SCROLL`, `SCROLL_ACCEL`, `MAX_SCROLL` and `FIRST_RUN_ACCEL` set the ramp. `EDGE_MERCY` and `ELITE_SCROLL` set the edge's slack. `DEPTH_EVERY`, `DEPTH_POWER` and `LANDING` set the stairs. World boss HP and `WOUND_STEP` and `WOUND_MAX` set the walls. `LOST_FIGHT_XP` and `XP_PAST_LEVEL` set meta power per run. `TierDefs.CLOCK` sets the four clocks. `ENDLESS_POWER` and the lap 1 lift set endless. Each slider starts at "Now", has a button for "Proposed", and is bounded by "Range".

It draws five panels. Enemy power against hero power over encounters 1 to 180. The scroll's share of its range at each wall, per tier, with the story median and p90 marked. Edge slack at each wall, with and without mercy. Levels by run for a player stuck at each world 1 wall. And endless depth and boss power from encounter 180 to 540.

What to watch [I]:

1. **The world 2 boss's scroll share.** It should land between 0.75 and 0.85 on gold and diamond. If silver lands above gold at the same wall, silver's clock is too fast.
2. **Edge slack at full speed.** Below about 6 s with mercy, the dark becomes a reflex test rather than a board test.
3. **The step on each elite.** With `LANDING` 3 the HP curve should drop right after each wall.
4. **Old Mossback against the Warden.** Mossback's HP over hero attack at run 10 should not sit above the Warden's at run 20. Today it does.
5. **The XP lines.** Moving `LOST_FIGHT_XP` from 0.5 to 1.0 barely moves them. XP does not fix a wall; the wall's own numbers do.
6. **Endless doubling.** If the lap 1 lift puts the death peak before lap 2, the lift is too high.

To use it, pick one hypothesis from §3, move one knob until its panel hits the target, run `dev/balance_sim.gd` with `--gaps-file` on 20 seeds at that value, and trust the bot if it disagrees with the lab by more than one wall. Then ship the value as a switchback (F2) and keep it only if it holds in the live data for two weeks and in two collective sessions [I].

---

## 13. Instrumentation and playtest protocol

MatchRPG's payload is already richer than most indie telemetry. Each run sends where and why it ended, per-world seconds, moves, HP lost and traps, a line for every elite and boss fight, run totals of `edge_seconds` and `low_hp_seconds`, pace, tier and lifetime run number (`scripts/ui/run_upload.gd:80-135`, `scripts/ui/run_log.gd`) [K, E1]. That supports a survival curve, hazard per wall, the death split and a learning curve today. Every studio in our notes measured the same short list, a pass rate per stage with attempts as the denominator, where players die, and when they abandon [V, E2, S47; V, E1, S81].

### Events to add

| # | Event or field | Data | Why | Cost |
|---|---|---|---|---|
| A1 | `session`, `session_run`, `since_last_run_s` | A UUID in session storage at page load | Time to retry, runs per sitting, quits after a bad run | S |
| A2 | Encounter timeline | Per encounter `[n, kind, t_start, t_end, lead_start, hurt]` | Hazard for normal encounters, traps and chests; the landing test (H3) | S |
| A3 | Edge lead over time | `lead` in px every 5 s | The pressure curve inside a run, and when mercy engages | S |
| A4 | Warnings shown and reacted | Per warning id, shown, reacted within 2 s, median ms | Tests the pillar that warnings reach the board (H5) | M |
| A5 | Abandoned run | On next launch, a row with `reason = "abandoned"` and play seconds | Time to abandon; today a closed tab vanishes | S |
| A6 | Felt difficulty | One tap 1-7 on 1 run in 3, and at "World cleared" | Perceived beside actual difficulty, per world | S |
| A7 | `variant` | The knob values the run used | Switchbacks (F2) | S |
| A8 | `clock` | `TierDefs.CLOCK[tier]` as applied | The hidden clock may change between versions | S |

### The dashboard

Eight charts over story runs. Filters are version, tier, device and a bot flag. Every band is a 2,000-sample player bootstrap, and any cell under 3 players or 30 runs is hidden, which is the privacy rule and the statistics rule at once [I].

| # | Chart | Definition | Needs |
|---|---|---|---|
| D1 | Survival by encounter | S(k) = Π over j ≤ k of (1 − d_j / n_j), wins censored, resumed runs entering late; a dashed bot line | now |
| D2 | Hazard by encounter | h(k) = d_k / n_k as bars, walls coloured, A1 bands drawn | now; A2 for normals |
| D3 | End cause by world | HP at an elite, a boss or a normal encounter, the dark, retreat, abandoned | now; A5 |
| D4 | Learning curve | Median world reached by story run index for players with 20+ story runs, plus a per-player normalised panel | now |
| D5 | Attempts to first clear | Per wall, median and IQR of the run index of the first clear | now |
| D6 | Pressure inside the run | Edge seconds per minute per world; deaths with no warning in the last 5 s | now; A3, A4 |
| D7 | Retry and abandon | Time to retry by end encounter; chance the sitting ends by end cause | A1, A5 |
| D8 | Felt against measured | Median 1-7 rating per world against D2's world hazard | A6 |

Every reach and win-rate chart shows the run-weighted and player-weighted lines together. The gap is large at the opening, where 43.9% of runs but 28.4% of a typical player's runs reach world 2, and small at the median, where both sit on Old Mossback (1,315 m and 1,310 m) [K, E1].

@@FIG:weights@@

### Session protocol for five players

Use the five testers for "why" and the live data for "how often" [I]. Before the session, run the bot on the build at the live gap distribution, write one hypothesis from §3 with a numeric target, and note the lab's prediction. Each tester plays their own save for 30 to 45 minutes, screen-recorded, with no think-aloud, since the board takes all of the player's attention.

After every run, on the results screen:

1. "How hard was that run?" 1 (far too easy) to 7 (far too hard), 4 is about right.
2. "Did you see your death coming?" Yes, only just, or no.
3. "What ended it?" The dark, the enemy, I gave up, or not sure. A tester who says "the enemy" when the payload says "Caught by the dark" did not read the edge.

Once per session:

1. "Was the loss your fault, the game's, or luck?"
2. "Draw how interested you felt across worlds 1 to 5," a 0-10 line.
3. "Did you know the dungeon runs faster on higher tiers? Would you play slower to drop one?"

The 1-7 item, the fault question and the drawn line come from Hearthguard's protocol (Valve, Juul, Schell) [V, E2, S1]. The third question is new and tests D1's risk directly [I].

### Decision rules

A rule fires only if it holds in the live data for two weeks and in two collective sessions on the same build [I].

| # | Signal | Threshold | Action |
|---|---|---|---|
| R1 | Wall win rate | Below its A1 band with 30+ attempts and 10+ players, and the bot also fails | Number problem. Ease that wall 10-15% |
| R2 | Wall win rate | Below band, and the bot clears it | Reading problem. Check A4 and the telegraph first |
| R3 | Normal-encounter loss | Above 2% in any world | A spike between walls. Check the timeline (A2) |
| R4 | Attempts to first clear | Median above 4 at any wall | A3 at that wall, then C2 |
| R5 | HP deaths with 1 s or less of low HP | Above 5% at any boss | Burst blow. Cap or telegraph it (B2) |
| R6 | Dark share of endings | Above 35% in any world | Lower `SCROLL_ACCEL` there or raise `EDGE_MERCY` |
| R7 | Felt difficulty against hazard | Median 6-7 with hazard under 10% | Clarity problem. Fix warnings before balance |
| R8 | Tester would play slow to drop a tier | 2 of 5 | Ship D1's fixes and D2 before touching the clock |
| R9 | Switchback result | One-sided sign test p ≤ 0.05 across 10+ players, same direction in the bot | Keep the better arm |

### A/B with 21 players

Depth is a poor metric for small tests. Its SD is 1,294 m against a median of 1,316 m, and 85% of its variance is run-to-run noise inside a player [K, E1]. Runs from one player are not independent, so every interval must resample players; with 5 to 30 clusters, standard tests reject a true null about 10% of the time at 5% [V, E1, S89].

A between-player split, 10 against 11 with 30 runs each, detects about 700 m by Lehr's rule, more than half a world, and the four heavy players land in one arm by chance [I, E1 arithmetic; V, E1, S90]. A within-player switchback, where the knob flips per run on a seeded coin, detects about 500 m with 10 runs per arm and 360 m with 20, on 10 active players [I, E1 arithmetic; V, E2, S91].

@@FIG:abtest@@

Lower-noise metrics do better still. Hazard at the targeted wall, `edge_seconds` per minute and `low_hp_seconds` all move far less than depth [I]. Expect to detect only about a quarter of a world in depth, or about 10 points of hazard at a boss with 150+ runs at risk per arm; smaller tuning belongs to the bot sweep. Freeze tier changes during a scroll test, since pace moves the tier. Fix the length before starting. Use switchbacks only for in-run knobs. Report one difference per player before any pooled number [I].

---

## 14. Backlog: ranked by fun impact ÷ cost

Fun impact is 1-5; cost S, M or L counts as 1, 2 or 3; score is impact divided by cost. Ties are broken by impact, then by order of dependency.

| Rank | Change | Cards | Fun impact | Cost | Score | Hypothesis |
|---|---|---|---|---|---|---|
| 1 | Old Mossback 765 to 650 HP, alone in one build | A3 | 5 | S | 5.0 | H1 |
| 2 | Wall bands as dashboard flags, and restore the Sleeper's 1.5 s warning | A1, B2 | 4 | S | 4.0 | H2, H5 |
| 3 | `SCROLL_ACCEL` 0.15 to 0.22, shipped as a switchback | B1, F2 | 4 | S | 4.0 | H4 |
| 4 | `LOST_FIGHT_XP` 0.5 to 1.0, and a results screen that names the next buy | C1 | 4 | S | 4.0 | H6 |
| 5 | Wound Old Mossback 5% per loss to 25%, only if rank 1 leaves attempts above 4 | C2 | 4 | S | 4.0 | H1 |
| 6 | Session id, encounter timeline, abandoned runs, variant and clock fields, and dashboard D1-D5 | F1, F2 | 3 | S | 3.0 | H1, H3, H4 |
| 7 | A three-encounter landing after each wall | A2 | 3 | S | 3.0 | H3 |
| 8 | Elite warning on the board and the wall record on the results screen | C3 | 3 | S | 3.0 | H6 |
| 9 | Demoted players keep their best, one midpoint run after a promotion, silver 0.80 in the lab | D1 | 3 | S | 3.0 | H8 |
| 10 | Endless lap 1 lifted ×1.5 in worlds 1-3 | E2 | 3 | S | 3.0 | H10 |
| 11 | Hero-side cap or telegraph for blows over 35% of max HP, with warnings shown and reacted | B2 | 4 | M | 2.0 | H5 |
| 12 | One new named beat per endless lap | E2 | 3 | M | 1.5 | H10 |
| 13 | An opt-in "One tier up" toggle with a 20% bank reward | D2 | 3 | M | 1.5 | H8 |
| 14 | Stop time paid by combos | B3 | 3 | M | 1.5 | H7 |
| 15 | A ten-step ladder after the first clear | E1 | 4 | L | 1.3 | H9 |

Rank 6 goes out first in practice, since without the variant field no other row can be judged [I]. Ranks 1 and 3 ship in separate builds. Rank 5 waits on rank 1's result, and rank 15 waits until the base descent sits inside its bands.

---

## 15. "See it in action" index

One row per game example, from the research notes.

| # | Game | Curve idea | URL |
|---|---|---|---|
| 1 | 10000000 | Sliding board, scrolling dungeon, loot that comes home | https://en.wikipedia.org/wiki/10000000_(video_game) |
| 2 | You Must Build A Boat | No fail state; every go pays | https://www.pocketgamer.biz/making-of-you-must-build-a-boat/ |
| 3 | Puzzle Quest | Players must be luckier than the AI to call it fair | https://kotaku.com/the-match-3-rpg-that-started-it-all-is-back-and-we-talk-to-its-legendary-creator-2000626834 |
| 4 | Dungeon Raid | Chain matching with monsters that level up | http://www.148apps.com/reviews/dungeon-raid-review/ |
| 5 | Bejeweled Blitz | Session length tested down to 60 s | https://gamedeveloper.com/game-platforms/gdc-europe-popcap-s-kapalka-talks-i-bejeweled-blitz-i-origins-calls-social-games-a-bit-evil- |
| 6 | NES Tetris | The speed table and level 29 | https://tetris.wiki/Tetris_(NES,_Nintendo) |
| 7 | Tetris The Grand Master | Speed that rises and falls, and 20G | https://tetris.wiki/Tetris_The_Grand_Master |
| 8 | Tetris Attack | A rising stack and Stop time | https://www.mariowiki.com/Tetris_Attack |
| 9 | Canabalt | Speed ramp numbers and hidden forgiveness | https://gamedeveloper.com/design/tuning-canabalt |
| 10 | Candy Crush Saga | Time to pass, time to abandon, harder means shorter | https://mobilegamer.biz/how-king-defines-a-good-candy-crush-saga-level-and-why-it-constantly-prunes-the-bad-ones/ |
| 11 | Candy Crush Saga | Level 65 eased | https://www.pocketgamer.biz/king-on-finding-the-fun-in-candy-crush |
| 12 | Candy Crush Saga | The complexity staircase, hard then lighter | https://www.pocketgamer.biz/crafting-candy-crushs-difficulty-blockers-level-design-ai-and-the-complexity-staircase/ |
| 13 | Marvel Puzzle Quest | Enemy scaling tied to the player's roster | https://forums.d3go.com/discussion/41413/pve-scaling-testing-enemy-of-the-state-03-17-16 |
| 14 | Gems of War | Board speed against readability | https://community.gemsofwar.com/t/the-1-0-7-speed-change-complaint-dogpile-thread/1119 |
| 15 | Balatro | Posted score targets per ante | https://balatrowiki.org/w/Blinds_and_Antes |
| 16 | Peglin | The cruciball ladder | https://peglin.wiki.gg/wiki/Cruciball |
| 17 | Slay the Spire | Ascension steps by type | https://www.hermitgamer.com/slay-the-spire-ascension/ |
| 18 | Brotato | The Danger ladder | https://brotato.wiki.spellsandguns.com/Dangers |
| 19 | Dead Cells | Smoothing the ladder's walls | https://dead-cells.com/patchnotes/19 |
| 20 | Luck be a Landlord | A fairness floor, one coin on zero | https://blog.trampolinetales.com/questions-and-danswers/ |
| 21 | Vampire Survivors | Curse, pressure that pays | https://vampire.survivors.wiki/w/Curse |
| 22 | Super Hexagon | Instant retry, music from a random point | https://www.engadget.com/2012-09-21-terry-cavanagh-goes-inside-super-hexagon.html |
| 23 | Resident Evil 4 | A hidden rank, found years later | https://www.engadget.com/2015-06-03-resident-evil-4-difficulty.html |
| 24 | Crash Bandicoot | A failure-count mask and checkpoints | https://cogconnected.com/2017/07/crash-bandicoot-difficulty-vv/ |
| 25 | Hearthstone | Rank floors and a star bonus | https://hearthstone.blizzard.com/en-us/news/23319441/welcome-to-the-year-of-the-phoenix |
| 26 | Clash Royale | Trophy gates you cannot fall below | https://supercell.com/en/games/clashroyale/blog/release-notes/new-update-feature-enter-the-trophy-road |
| 27 | Lichess | Ratings per time control and a sandbagging rule | https://lichess.org/faq |
| 28 | Spelunky and Dead Cells | Daily seeded runs | https://www.gamedeveloper.com/design/the-24-hour-ticket-examining-daily-runs- |

---

## 16. What remains unverified (and corrections)

### Corrections made during the study

- **The shape of the story curve.** One research note read the runs-by-world counts (410, 215, 127, 58, 49) as "each world keeps about half the runs that reach it". Those counts mixed endless and story runs and summed whole worlds. Per encounter, bosses end 30% to 42% of the runs that reach them, elites 12% to 22% and normal encounters about 1% [K, E1, S4]. The study uses the wall reading.
- **Story run count.** The brief gave 667 story runs. The telemetry note leaves out 21 challenge runs and counts 651 from 18 players [K, E1]. Where notes disagree on our data, the telemetry note wins.
- **Tier changes.** One note counted 15 (9 up, 6 down), including moves from the silver start. The telemetry note counts 9 up and 5 down across 817 run pairs [K, E1].
- **Time between runs.** One note gave a median 139 s over all gaps; inside a sitting it is 53 s [K, E1]. We use 53 s.
- **Dungeon Raid.** Released by Fireflame Games in November 2010, not 2011 and not by Firebrand [V, E3, S15].
- **Balatro 1.0.1f.** Dated April 2024 by the article we cite and May 2024 in one note; the beta and final ante lists conflict [U, S29].

### Still unverified

- **MatchRPG v0.7.** The changelog lists v0.7 as a hero redraw with no rule change, while git dates the Ogre King wound to commit 561628a on 29 October [K]. §9 row 17 treats it as part of v0.7.
- **The last window's dark-death rise** (20% to 36% at start level 21+) rests on 22 runs and 3 players [K, E1].
- **Silver's gap** rests on 9 players; bronze has 2 story players [K, E1].
- **Power against skill.** Depth rises with start level and run number together, and the data cannot separate them [K].
- **The curve model** reads hero power from end-of-run stats and uses median fight pauses for the scroll [I].
- **Hidden mercy's effect.** No field records seconds under edge mercy or the wound applied [K].
- **10000000's scroll speed and "never unlucky" rule.** Redwood discussed the second on a podcast with no transcript [V, E2 for the topic, S11].
- **Royal Match's cadence** comes from an analyst's teardown [U, E3, S56]. **The field test's revenue figures** come from search summaries [U, S82]. **Hearthstone's 9-10x Legend count** is confounded by an expansion [V, E1, S65]. **Keller and Bless 2008**'s sample and speed rule were not read [U, S72].

### Blocked sources

Fandom wikis returned HTTP 402, so numbers came from wiki.gg, balatrowiki.org, the Brotato wiki and search extracts. archive.org was blocked. TouchArcade, gamegeeker.com, speedrun.com and the Columbia Business School brief returned 403. A PC Gamer interview with poncle loaded without its body.

### Open gaps

- No paper tests a tempo DDA placed between sessions and held fixed during a run; every Tetris DDA paper adapts inside a session [I].
- No peer-reviewed study of meta-progression in roguelites turned up; those claims rest on designers and our data [I].
- No twin publishes a hazard by floor, a death split by channel, or a ladder where rank sets a harsher clock [I].
- Whether players know the hidden clock exists is unknown; §13 asks [I].

---

## 17. Sources

Numbered for the [S#] references. All URLs come from the research notes. "Excerpt", "snippet" or "not read" marks a page read only in part.

**Series and Kingsfoil**

1. Hearthguard difficulty and learning curves (Curves #1), with its sources on Juul, Linehan, Hades, Smeddinck, Denisova and Cairns, Valve and Schell: https://kingsfoil-artifacts.netlify.app/curves-hearthguard
2. MatchRPG, live web build: https://matchrpg.vercel.app
3. MatchRPG repo at main 82b7eb2 (v0.7.14), with CLAUDE.md, CHANGELOG.md and the in-repo analyses in docs/ (local checkout, read-only)
4. MatchRPG run data, matchrpg-runs-v06-v07, 859 runs from 21 anonymous players, 23 October to 10 November 2026, aggregates only
5. The curve lab, curves-matchrpg-lab.html (companion page)

**Direct ancestors and classic twins**

6. 10000000, Wikipedia: https://en.wikipedia.org/wiki/10000000_(video_game)
7. Game Informer, Afterwords: 10000000 (Dec 2012): https://gameinformer.com/b/features/archive/2012/12/26/afterwords-10000000.aspx
8. Game Informer, Moments: scoring 10000000 (Dec 2012): https://www.gameinformer.com/b/features/archive/2012/12/24/moments-scoring-10000000.aspx
9. No Don't Die, Luca Redwood interview (May 2015): https://nodontdie.com/interviews/luca-redwood
10. PocketGamer.biz, Against the current: the making of You Must Build a Boat (Aug 2015): https://www.pocketgamer.biz/making-of-you-must-build-a-boat/
11. Designer Notes 66, Luca Redwood (2019, no transcript): https://designer-notes.com/designer-notes-66-luca-redwood
12. Puzzle Quest: Challenge of the Warlords, Wikipedia: https://en.wikipedia.org/wiki/Puzzle_Quest:_Challenge_of_the_Warlords
13. Kotaku, interview with the creator of Puzzle Quest (Sep 2025): https://kotaku.com/the-match-3-rpg-that-started-it-all-is-back-and-we-talk-to-its-legendary-creator-2000626834
14. Soren Johnson, Our Cheatin' Hearts (2009): https://www.gamedeveloper.com/game-platforms/analysis-game-ai-our-cheatin-hearts
15. 148Apps, Dungeon Raid review: http://www.148apps.com/reviews/dungeon-raid-review/
16. Game Developer, Kapalka at GDC Europe on Bejeweled Blitz: https://gamedeveloper.com/game-platforms/gdc-europe-popcap-s-kapalka-talks-i-bejeweled-blitz-i-origins-calls-social-games-a-bit-evil-
17. Bejeweled Blitz, Bejeweled Wiki: https://bejeweled.wiki.gg/wiki/Bejeweled_Blitz
18. NES Tetris gravity table, Tetris Wiki: https://tetris.wiki/Tetris_(NES,_Nintendo)
19. NES Tetris, Wikipedia (kill screen and scoring): https://en.wikipedia.org/wiki/Tetris_(NES_video_game)
20. Tetris The Grand Master, Tetris Wiki: https://tetris.wiki/Tetris_The_Grand_Master
21. Tetris Attack, Super Mario Wiki: https://www.mariowiki.com/Tetris_Attack
22. Game Developer, Tuning Canabalt: https://gamedeveloper.com/design/tuning-canabalt
23. Destructoid, Canabalt GDC 2010 postmortem: https://www.destructoid.com/gdc-10-falling-to-your-death-the-canabalt-postmortem/
24. Rogue, Wikipedia: https://en.wikipedia.org/wiki/Rogue_(video_game)
25. Zoo Keeper, Wikipedia (with Columns for the pruned lineage): https://en.wikipedia.org/wiki/Zoo_Keeper_(2003_video_game) https://en.wikipedia.org/wiki/Columns_(video_game)
26. PC Gamer, a 13-year-old reaches the NES Tetris crash (Jan 2024): https://www.pcgamer.com/after-34-years-a-13-year-old-prodigy-has-become-the-first-person-to-beat-tetris-by-reaching-the-holy-grail-of-high-level-play-a-true-killscreen/

**Modern twins and ladders**

27. Balatro Wiki, Blinds and Antes: https://balatrowiki.org/w/Blinds_and_Antes
28. Balatro Wiki, Stakes: https://balatrowiki.org/w/Stakes
29. Press Start, Balatro's latest update should make winning easier (Apr 2024): https://press-start.com.au/news/2024/04/08/the-latest-balatro-update-has-some-massive-changes-that-should-make-winning-easier/
30. Peglin Wiki, Cruciball: https://peglin.wiki.gg/wiki/Cruciball
31. Red Nexus, the first cruciball levels, v0.7.20 (May 2022): https://gedig.itch.io/peglin/devlog/383097/the-first-cruciball-levels-are-here-v0720
32. PC Gamer, Peglin is finished, and SteamDB patch notes for v1.0.6: https://pcgamer.com/games/goblin-pachinko-roguelike-peglin-is-finished-complete-with-some-clutch-reworks https://steamdb.info/patchnotes/16449497
33. Hermit Gamer, Slay the Spire ascension list: https://www.hermitgamer.com/slay-the-spire-ascension/
34. Brotato Wiki, Dangers: https://brotato.wiki.spellsandguns.com/Dangers
35. Brotato Wiki, Endless Mode: https://brotato.wiki.spellsandguns.com/Endless_Mode
36. Luck be a Landlord Wiki, Rent (search extract): https://luck-be-a-landlord.fandom.com/wiki/Rent
37. SteamDB, Luck be a Landlord patch notes: https://steamdb.info/patchnotes/9723615
38. TrampolineTales, Questions and Danswers (May 2023): https://blog.trampolinetales.com/questions-and-danswers/
39. Dead Cells, Update 19 patch notes (2020): https://dead-cells.com/patchnotes/19
40. Destructoid, Dead Cells smoothed out its difficulty curve: https://destructoid.com/?p=252740
41. Rogue Legacy 2, v1.2.1 patch notes, and Game Rant on House Rules: https://roguelegacy2.com/patchnotes/v121 https://gamerant.com/rogue-legacy-2-difficulty-house-rules-achievements/
42. Vampire Survivors Wiki, Curse: https://vampire.survivors.wiki/w/Curse
43. Engadget, Terry Cavanagh goes inside Super Hexagon (Sep 2012): https://www.engadget.com/2012-09-21-terry-cavanagh-goes-inside-super-hexagon.html
44. Game Developer, Terry Cavanagh and the heart of Super Hexagon: https://gamedeveloper.com/design/terry-cavanagh-and-the-heart-of-i-super-hexagon-i-
45. itch.io, developer reply on Subway Surfers-style speed: https://itch.io/post/1997398
46. Game Developer, 10 ways to retain your players (missions): https://gamedeveloper.com/design/10-ways-to-retain-your-players

**Match-3 data and live games**

47. mobilegamer.biz, How King defines a good Candy Crush Saga level (GDC 2024): https://mobilegamer.biz/how-king-defines-a-good-candy-crush-saga-level-and-why-it-constantly-prunes-the-bad-ones/
48. PocketGamer.biz, King on finding the fun in Candy Crush: https://www.pocketgamer.biz/king-on-finding-the-fun-in-candy-crush
49. PocketGamer.biz, Crafting Candy Crush's difficulty (Jan 2026): https://www.pocketgamer.biz/crafting-candy-crushs-difficulty-blockers-level-design-ai-and-the-complexity-staircase/
50. Deceptive Patterns, Candy Crush Saga impossible levels (2016): https://deceptive.design/articles/candy-crush-saga-impossible-levels
51. D3 Go forums, PvE scaling testing (Mar 2016): https://forums.d3go.com/discussion/41413/pve-scaling-testing-enemy-of-the-state-03-17-16
52. D3 Go forums, scaling tied to clearance levels (May 2017): https://forums.d3go.com/discussion/comment/686619
53. Gems of War forum, 1.0.7 speed change thread (Oct 2015): https://community.gemsofwar.com/t/the-1-0-7-speed-change-complaint-dogpile-thread/1119
54. Gems of War forum, large difficulty increase for Underspire battles: https://community.gemsofwar.com/t/investigating-large-difficulty-increase-for-underspire-battles/81241
55. Deconstructor of Fun, How Puzzle & Dragons does it (2013): https://www.deconstructoroffun.com/blog//2013/02/how-puzzle-dragons-does-it.html
56. Wallace, Royal Kingdom teardown (Medium): https://medium.com/@chrisjameswallace/royal-kingdom-the-next-puzzle-hit-from-dream-games-c7395e26b185

**Hidden adjustment, ladders and daily runs**

57. Engadget, Resident Evil 4 secretly adjusted its difficulty (Jun 2015): https://www.engadget.com/2015-06-03-resident-evil-4-difficulty.html
58. COGconnected, Why Crash N. Sane Trilogy is so difficult (2017): https://cogconnected.com/2017/07/crash-bandicoot-difficulty-vv/
59. PC Gamer, class action over EA's dynamic difficulty: https://www.pcgamer.com/class-action-lawsuit-claims-eas-dynamic-difficulty-tech-encourages-loot-box-spending
60. MacRumors, Flappy Bird pulled as "an addictive product" (Feb 2014): https://www.macrumors.com/2014/02/11/flappy-bird-pulled-addictive-product/
61. Classic Tetris World Championship, Wikipedia: https://en.wikipedia.org/wiki/Classic_Tetris_World_Championship
62. Lichess FAQ: https://lichess.org/faq
63. Lichess forum, sandbagging: https://lichess.org/forum/general-chess-discussion/sandbagging-11?page=1
64. Blizzard, Hearthstone Year of the Phoenix ranked changes (2020): https://hearthstone.blizzard.com/en-us/news/23319441/welcome-to-the-year-of-the-phoenix
65. PC Gamer, Hearthstone's new ladder creates almost 10 times as many Legend players: https://www.pcgamer.com/hearthstones-new-ladder-system-is-creating-almost-10-times-as-many-legend-rank-players
66. Supercell, Clash Royale trophy road (Apr 2019): https://supercell.com/en/games/clashroyale/blog/release-notes/new-update-feature-enter-the-trophy-road
67. EA Help, Apex Legends ranked: https://help.ea.com/en/articles/apex-legends/ranked/
68. Game Developer, The 24-hour ticket: examining daily runs: https://www.gamedeveloper.com/design/the-24-hour-ticket-examining-daily-runs-
69. Steam discussion, Crypt of the NecroDancer faster-BPM boards: https://steamcommunity.com/app/247080/discussions/2/4352240180490041353/
70. Tetris 99, Tetris Wiki: https://tetris.wiki/Tetris_99
71. Wordle, Wikipedia: https://en.wikipedia.org/wiki/Wordle

**Papers**

72. Keller and Bless, Flow and regulatory compatibility, PSPB 2008 (abstract): https://pubmed.ncbi.nlm.nih.gov/18212330/
73. Baumann, Lürig and Engeser, Flow and enjoyment beyond skill-demand balance (2016): https://www.uni-trier.de/fileadmin/fb1/prof/PSY/PGA/unterlagen/BaumannL%C3%BCrigEngeser_Flow_MOEM_2016.pdf
74. Natalizio et al., real-time EEG engagement in Tetris, J. Neural Engineering 2024 (abstract level): https://iris.polito.it/retrieve/2dfab91e-6177-4252-be23-f4bffdc0c9c4/Natalizio_2024_J._Neural_Eng._21_016014.pdf
75. Lindstedt and Gray, Distinguishing experts from novices, Cognitive Psychology 2019: https://read.qxmd.com/read/30543908/distinguishing-experts-from-novices-by-the-mind-s-hand-and-mind-s-eye
76. Stafford and Dewar, Tracing the trajectory of skill learning, Psychological Science 2014: https://eprints.whiterose.ac.uk/id/eprint/83582/1/stafford_and_dewar_postprint.pdf
77. Huang et al., Mastering the art of war, CHI 2013: https://thomas-zimmermann.com/publications/files/huang-chi-2013.pdf
78. Gudmundsson et al., Human-like playtesting with deep learning, IEEE CIG 2018: https://www.gwern.net/doc/reinforcement-learning/imitation-learning/2018-gudmundsson.pdf
79. Roohi et al., Predicting game difficulty and churn without players, CHI PLAY 2020: https://arxiv.org/abs/2008.12937
80. Kristensen, Valdivia and Burelli, Statistical modelling of level difficulty in puzzle games, IEEE CoG 2021: https://arxiv.org/html/2107.03305v2
81. Reguera et al., Candy Crush pass and abandon times, Scientific Reports 2020: https://pmc.ncbi.nlm.nih.gov/articles/PMC7058085
82. Ascarza, Netzer and Runge, field experiment on difficulty and churn (working paper): https://business.columbia.edu/sites/default/files-efs/citation_file_upload/ascarza_netzer_runge_2023-12-04.pdf
83. Kang, Suh and Kim, Match experiences affect interest, Heliyon 2024: https://visualize.jove.com/38318006
84. Larche, Musielak and Dixon, The Candy Crush Sweet Tooth, J. Gambling Studies 2017: https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5445157/
85. Zhang et al., Input-output randomness and satisfaction in card games (2021): https://arxiv.org/abs/2107.08437
86. Jensen, Dixen and Burelli, Hades again and again (2024): https://arxiv.org/abs/2401.14878
87. Robertson, Cardona-Rivera and Young, invisible dynamic mechanics adjustment (2020, abstract level): https://qed.games.utah.edu/wp-content/uploads/sites/71/2025/07/robertson2020invisible.pdf
88. Heathcote, Brown and Mewhort, The power law repealed (2000): https://link.springer.com/article/10.3758/BF03196105
89. Cameron, Gelbach and Miller, Bootstrap-based improvements for inference with clustered errors (2008): https://www.nber.org/papers/t0344
90. Lehr's rule, sample size 16 s² / d²: https://jhanley.biostat.mcgill.ca/c607/ch07/16_s_sq_over_d_sq.pdf
91. DoorDash Engineering, switchback tests: https://careersatdoordash.com/?p=11043
92. Bertens et al., survival ensembles for churn level (2017): https://arxiv.org/abs/1710.02262
93. Kaplan-Meier estimator, Wikipedia: https://en.wikipedia.org/wiki/Kaplan%E2%80%93Meier_estimator
94. GameAnalytics mobile benchmarks via GameDev Reports (vendor): https://gamedevreports.substack.com/p/gameanalytics-benchmarks-in-mobile
95. GamingBolt, Slay the Spire 2 launch week runs: https://gamingbolt.com/slay-the-spire-2-sells-3-million-copies-in-first-week-over-25-million-runs-recorded
