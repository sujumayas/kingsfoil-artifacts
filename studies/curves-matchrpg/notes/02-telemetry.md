# 02. Real player telemetry (researcher 0b)

Scope. What MatchRPG's own run log says about the four curves of this study. Data: `matchrpg-runs-v06-v07`, every run sent on v0.6.x and v0.7.x, 2026-10-23 to 2026-11-10. 859 runs, 21 anonymous players. 651 story runs (18 players), 192 endless runs (11 players), 21 challenge runs (left out of everything below). 6 wins by 6 players.

Privacy. Aggregates only. No ids, names or per-player traces. Every published cell has at least 3 distinct players; smaller cells are blank in the tables and `null` in the JSON.

Method. Plain Python over `runs.jsonl`, sorted by `at`. A story run is not endless and not a challenge. `reached` is the number of encounters cleared, so a run that did not win ended at encounter `reached + 1`. Win rate by stage = runs that clear encounter n / runs that arrive at it (attempts are the denominator). Endings: "hp" = reason "Slain by X"; "dark" = "Caught by the dark"; "other" = empty reason (retreats arrive blank, 9 story runs). Run number is the payload's lifetime `run_no`, which counts runs played before v0.6. `data.fights` holds elite and boss fights only (never regular enemies). 92 runs (10.7%) were resumed from a checkpoint after the page was killed and log only the part after the resume, so they are left out of every pace and pressure metric.

Files.
- Script: `/private/tmp/claude-501/-Users-esenespinosa-Development-personal-games-kingsfoil-artifacts/a74d8fa3-59f2-446d-a70a-8da29b61d576/scratchpad/analysis/curves_telemetry.py` (run `python3 -I curves_telemetry.py <runs.jsonl> <out.json>`), text output in `/private/tmp/claude-501/-Users-esenespinosa-Development-personal-games-kingsfoil-artifacts/a74d8fa3-59f2-446d-a70a-8da29b61d576/scratchpad/analysis/out.txt`.
- Plot-ready aggregates: `studies/curves-matchrpg/notes/telemetry-aggregates.json`, one key per question (`q1_funnel` ... `q9_quality`), each table with `unit`, `n`, `columns`, `rows`. The full 180-encounter survival curve is `q1_funnel.every_encounter`.

All numbers are [K, E1] unless marked [I].

## Takeaways

1. The difficulty curve is a sawtooth with the set = world, and the peak is always the world boss. A world boss ends 30-42% of the runs that reach it. An elite ends 12-22%. A regular encounter ends 0.2-1.2%. The W1 boss (Old Mossback) is the churn point. 69% of story runs reach it, 37% of those die there, and only 44% of all story runs get past it.
2. The median story run (1,315 m) ends at the W1 boss, and the median depth climbs the W1 walls one by one with experience. Lifetime runs 1-3 die at the first elite (median 441 m), runs 4-10 at the second (879 m), runs 11-25 at the boss (1,315 m), and runs 26-50 reach W2-W3 (2,644 m). The learning curve is a staircase of three walls.
3. The two death channels split by encounter kind. Elites and bosses kill by HP (94% and 100% of runs that end there). Runs that end between fights end by the dark (86%). The dark's share of endings rises from 10% in W1 to 33% in W3 as the scroll reaches `MAX_SCROLL` by W4.
4. The dark warns, HP mostly warns. Dark deaths have a median 7 s of edge danger before the end and only 2% have 1 s or less. HP deaths have a median 5 s of low HP and 10% have 1 s or less.
5. Depth tracks power, not pace. Story pace stays at 0.45-0.48 moves/s from run 1 to run 50+, while start level, town levels and talent rows rise in step with depth (start level 1-2: 441 m; 21+: 2,640 m).
6. The tier clock (a pacing DDA, it changes the dungeon's tempo from measured pace) equalises gold and diamond almost exactly. Median depth 1,316 m vs 1,317 m, reach W2 46.2% vs 46.3%, dark deaths 14% vs 17%, while diamond players move 14% faster. Silver does not catch up (median 882 m), mostly because silver runs are early, low-level runs.
7. Endless runs last a median 559 s and reach 9,295 m. 62% end on the second lap or later. Past 10,000 m 96% of endless deaths are HP deaths, so `ENDLESS_POWER` turns endless into an HP wall.
8. Four players made 58% of all runs and 74% of endless runs. Player-weighted, only 28% of story runs reach W2 (run-weighted 44%). The median depth is robust to this (1,310 m vs 1,315 m) because both sit on the W1 boss.

## Q1. Story-run depth funnel and win rate by stage

### Takeaway
A clean sawtooth by world. Regular encounters barely kill. Each elite takes 12-22% of its attempts and each world boss 30-42%. The W1 boss is the biggest single drop in the game because 69% of runs arrive there. The W5 elites have never been lost (10 of 10 cleared), so the last world is a plateau up to Astaroth.

### Cited findings
Funnel at the key stages (651 story runs, 18 players):

| Stage | Encounter | Attempts | Reach % of story runs | Win rate % | Reach % player-weighted | Win rate % player-weighted | Players |
|---|---|---|---|---|---|---|---|
| W1 elite | 12 | 639 | 98.2 | 87.5 | 90.8 | 65.7 | 17 |
| W1 elite | 24 | 545 | 83.7 | 86.1 | 57.0 | 75.9 | 15 |
| W1 boss | 36 | 451 | 69.3 | 63.4 | 42.2 | 67.4 | 11 |
| W2 start | 37 | 286 | 43.9 | 100 | 28.4 | 100 | 10 |
| W2 elite | 48 | 279 | 42.9 | 87.1 | 27.7 | 88.7 | 10 |
| W2 elite | 60 | 226 | 34.7 | 79.2 | 22.8 | 78.7 | 10 |
| W2 boss | 72 | 175 | 26.9 | 70.3 | 17.6 | 74.7 | 10 |
| W3 elite | 84 | 114 | 17.5 | 82.5 | 12.2 | 85.2 | 10 |
| W3 elite | 96 | 85 | 13.1 | 78.8 | 9.5 | 75.7 | 10 |
| W3 boss | 108 | 60 | 9.2 | 58.3 | 6.5 | 61.6 | 10 |
| W4 elite | 120 | 32 | 4.9 | 78.1 | 3.7 | 80.8 | 10 |
| W4 elite | 132 | 22 | 3.4 | 86.4 | 2.7 | 87.3 | 8 |
| W4 boss | 144 | 19 | 2.9 | 57.9 | 2.3 | 62.5 | 7 |
| W5 elites | 156, 168 | 10 | 1.5 | 100 | 1.3 | 100 | 6 |
| Astaroth | 180 | 10 | 1.5 | 60.0 | 1.3 | 57.8 | 6 |

Loss per encounter attempt by segment (%):

| World | Regular 1-11 | Elite 12 | Regular 13-23 | Elite 24 | Regular 25-35 | Boss 36 |
|---|---|---|---|---|---|---|
| W1 | 0.17 | 12.5 | 0.23 | 13.9 | 0.35 | 36.6 |
| W2 | 0.23 | 12.9 | 0.65 | 20.8 | 0.21 | 29.7 |
| W3 | 0.68 | 17.5 | 0.91 | 21.2 | 1.01 | 41.7 |
| W4 | 0.82 | 21.9 | 1.17 | 13.6 | 0.00 | 42.1 |
| W5 | 0.89 | 0.0 | 0.0 | 0.0 | 0.0 | 40.0 |

W4 and W5 rest on 7-10 players and 10-35 attempts per stage.

Attempts to the first clear, per player (King's "attempts to pass", dump window only):

| Stage | Players who cleared | Median attempts | p75 | Never cleared |
|---|---|---|---|---|
| W1 elite 12 (Ogre King) | 15 | 3 | 4 | 2 |
| W1 elite 24 (Broodmother) | 11 | 2 | 4.5 | 4 |
| W1 boss (Old Mossback) | 10 | 7 | 8.5 | 1 |
| W2 boss (The Warden) | 10 | 3 | 4.75 | 0 |
| W3 boss (The Deep Wyrm) | 10 | 2 | 2.75 | 0 |
| W4 boss | 7 | 1 | 2.5 | 0 |

Endings of story runs: HP 531 (81.6%), dark 105 (16.1%), other 9 (1.4%), won 6 (0.9%). Player-weighted: 79.8 / 11.7 / 7.8 / 0.7.

Top killers by world (HP deaths, cells with 3+ players):

| World | Killer (share of the world's HP deaths) |
|---|---|
| W1 | Old Mossback 51%, Ogre King 24%, Broodmother 23% |
| W2 | The Warden 40%, Orc Warlord 34%, Lich 25% |
| W3 | The Deep Wyrm 42%, Myconid Matriarch 29%, Crystal Golem 29% |
| W4 | The Sleeper Below 44%, The Hierophant 39%, Shoggoth 17% |

No story run in the data ended "Killed by a trap".

### Inferences
- [I] The walls are the curve. 84% of story runs that did not win ended at an elite or a boss (541 of 645). Regular encounters are a relief beat in loss terms, even though they carry the dark's pressure (Q2).
- [I] The boss peaks do not rise from W1 to W3 in loss terms (37%, 30%, 42%), but the players who face them are stronger each time. So the felt difficulty of the W1 boss is the highest in the game. It is the first boss, met by the weakest heroes, and it takes a median 7 attempts against 3 for the W2 boss.
- [I] Old Mossback's 7 attempts sit where King's level 65 churned half its reachers (see 09-measurement Q1). Of the 10 players who stopped more than 3 days before the dump ended, 7 stopped in W1 (Q3).
- [I] W5 is a plateau. Its elites never stopped anyone in 10 attempts, so the only challenge left in the last world is Astaroth.

### Gaps
- Regular encounters are not logged one by one, so a loss at a regular encounter cannot be tied to its enemy, trap or chest except through `reason`.
- The W4 and W5 cells rest on fewer than 35 attempts each.

## Q2. Death type over depth: HP vs the dark

### Takeaway
Fights kill by HP, the walk between fights kills by the dark. The dark's share grows with depth and scroll speed. By tier the split is almost the same, which is what a pace-clocked dungeon should produce.

### Cited findings

| Group | Runs | HP % | Dark % | Other % | Won % | Players |
|---|---|---|---|---|---|---|
| Ended in W1 | 365 | 87.9 | 9.9 | 2.2 | 0 | 18 |
| Ended in W2 | 163 | 79.1 | 20.2 | 0.6 | 0 | 10 |
| Ended in W3 | 88 | 67.0 | 33.0 | 0 | 0 | 10 |
| Ended in W4 | 24 | 75.0 | 25.0 | 0 | 0 | 8 |
| Ended in W5 | 11 | 36.4 | 9.1 | 0 | 54.5 | 7 |
| Silver | 78 | 78.2 | 19.2 | 2.6 | 0 | 9 |
| Gold | 292 | 83.2 | 14.4 | 1.7 | 0.7 | 8 |
| Diamond | 268 | 81.0 | 16.8 | 0.7 | 1.5 | 7 |
| Ended at a regular encounter | 104 | 7.7 | 85.6 | 6.7 | 0 | 15 |
| Ended at an elite | 287 | 93.7 | 5.6 | 0.7 | 0 | 17 |
| Ended at a boss | 254 | 100 | 0 | 0 | 0 | 11 |

Bronze (13 story runs) has only 2 players and is suppressed. By world and tier the cells that pass the 3-player rule show the same rise: gold dark 5.7% / 19.7% / 34.1% in W1 / W2 / W3, diamond 13.2% / 19.5% / 25.8%.

Warning before the end (story runs not resumed):

| Ending | Runs | Median edge-danger s | p75 | Median low-HP s | Runs with <= 1 s edge danger | Runs with <= 1 s low HP | Ended inside an elite or boss fight | Players |
|---|---|---|---|---|---|---|---|---|
| HP | 491 | 1 | 5 | 5 | 55.6% | 9.6% | 98.4% | 17 |
| Dark | 91 | 7 | 10 | 0 | 2.2% | 73.6% | 15.4% | 12 |

Danger counts seconds with `edge_danger` or `hp_danger` >= 0.5 (`run_log.gd` `DANGER_LINE`). Only 19 elite or boss fights in the whole data ended by the dark.

Scroll at the start of each elite or boss fight, on the `BASE_SCROLL`..`MAX_SCROLL` range (0 to 1, `Runner.pace()`): W1 0.23, W2 0.55, W3 0.82-0.86, W4 1.0, W5 1.0 (gold and diamond alike).

### Inferences
- [I] Juul's punishment types map onto the two channels. HP loss is energy punishment inside fights; the dark is a termination punishment for a slow board between fights. Players meet the dark mostly in W2-W4, after the scroll has doubled.
- [I] The "dying without warning is not" pillar holds for the dark (98% of dark deaths had more than 1 s of edge danger). About 1 HP death in 10 came with 1 s or less of low HP, which points at burst hits at elites and bosses. That share is the number to watch per boss.
- [I] Scroll saturates at W4 (1.0 at every W4 fight). From there on the dark's pressure stops rising, which fits the drop of the dark's share from 33% in W3 to 25% in W4. Any later rise in difficulty must come from HP.

### Gaps
- `low_hp_seconds` and `edge_seconds` are run totals. The payload has no time stamp for the last warning before death, so "seconds of warning just before the end" is approximated by the run total.
- The tier split rests on 7-9 players per tier.

## Q3. Learning across runs

### Takeaway
The median run climbs the W1 walls one at a time. New players reach W2 around their 20th lifetime run, W3 around their 30th, and the 4 players who won inside the window took a median 36.5 runs. Sessions are short: 2 runs, 12 minutes, under a minute between runs.

### Cited findings
Story depth by lifetime run number (`run_no`):

| Runs | Story runs | Median m | p75 m | Median of player medians m | Reach W2 % | Players |
|---|---|---|---|---|---|---|
| 1-3 | 57 | 441 | 441 | 441 | 0.0 | 18 |
| 4-10 | 95 | 879 | 1,161 | 878 | 3.2 | 12 |
| 11-25 | 191 | 1,315 | 2,218 | 1,314 | 41.9 | 11 |
| 26-50 | 180 | 2,644 | 3,551 | 3,003 | 73.3 | 10 |
| 51+ | 128 | 1,774 | 2,757 | 3,790 | 55.5 | 3 |

441 m is encounter 12 (Ogre King), 879 m encounter 24, 1,315 m encounter 36 (Old Mossback). The 51+ row rests on 3 players and has many endless-era story runs mixed in.

Same table on the 11 players seen from their first runs (first dump run at `run_no` <= 3): runs 1-3 441 m (11 players), 4-10 876 m (5), 11-25 1,313 m (4), 26-50 3,105 m (3).

Run number that first pushed the lifetime deepest (`stats.deepest`) past each milestone, for players whose crossing happened inside the window:

| Milestone | Players | Median run_no | p25 | p75 | Already past on their first dump run |
|---|---|---|---|---|---|
| W2 (1,333 m) | 6 | 19.5 | 16 | 29.75 | 7 |
| W3 | 5 | 31 | 26 | 32 | 7 |
| W4 | 5 | 42 | 30 | 43 | 7 |
| W5 | 4 | 36.5 | 33.5 | 40 | 7 |
| First win | 4 | 36.5 | 33.5 | 40 | 7 |

Every player who first reached W5 inside the window won in that same run. The W4 row has a different player set from W5.

Sessions (a gap over 30 min between uploads starts a new one; 304 sessions):

| Measure | Median | p25 | p75 | p90 |
|---|---|---|---|---|
| Runs per session | 2 | 1 | 3 | 6.7 |
| Session minutes | 11.9 | 6.0 | 22.7 | 41.9 |
| Seconds between runs inside a session | 53 | 24 | 134 | 400 |
| Sessions per player | 5 | 1 | 19 | 43 |

Players by runs in the window: 1-3 runs 6, 4-10 runs 4, 11-50 runs 3, 51-100 runs 5, 101+ runs 3.

Churn (each player's last run). 10 players sent no run in the last 3 days of the window. Their last runs had a median depth of 659 m, they had a median 2.5 runs, and 7 of the 10 ended that last run in W1. The 11 still active had a median 57 runs and a last-run depth of 7,104 m (mostly endless).

### Inferences
- [I] Onboarding fails at the W1 walls, not inside regular play. 10 of 21 players made 10 runs or fewer in the window. Only 4 of them ever cleared encounter 24 and 3 the W1 boss. The time to retry is short (median 53 s between runs), so the cost of failure is mostly the 1-3 minutes of the run, not the restart.
- [I] Old Mossback is the churn point for new players: 7 attempts at the median to clear, and 7 of the 10 lapsed players stopped in W1.
- [I] The staircase means three skill atoms (or three power thresholds) gate the first world. Q5 and Q6 suggest power, not speed, carries the climb.

### Gaps
- No session id. Sessions come from upload times, which include results, town and Prepare time.
- 11 of 21 players already had pre-v0.6 runs, so their first steps are not in the data. The new-player panel is 11 players and thins to 3-5 after run 10.
- `run_no` restarted for 4 players inside the window (lost save or new device), which puts some veterans back in the low run-number bins.
- Lapsed players are censored. A player who stopped 3 days before the dump may still come back.

## Q4. Tiers and the hidden clock

### Takeaway
Tiers barely move (9 ups and 5 downs in 817 consecutive run pairs). The clock does what it promises for gold and diamond. They reach the same depth with different pace, and the dungeon runs about 17% faster in real seconds for diamond. Silver and bronze stay behind, but they are mostly early, low-level runs. Pace does not grow with experience.

### Cited findings

| Tier | Runs | Story runs | Story median m | p75 m | Median moves/s | Story s per 1,000 m | Reach W2 % | Players |
|---|---|---|---|---|---|---|---|---|
| Bronze | 14 | 13 | - | - | 0.305 | - | - | 3 (2 in story) |
| Silver | 81 | 78 | 882 | 1,661 | 0.353 | 161 | 25.6 | 11 |
| Gold | 384 | 292 | 1,316 | 2,642 | 0.443 | 125 | 46.2 | 8 |
| Diamond | 380 | 268 | 1,317 | 2,640 | 0.506 | 107 | 46.3 | 8 |

Median run seconds when the boss fight starts: gold W1 114 s, W2 264 s, W3 404 s; diamond 101 s, 209 s, 304 s (W4 401 s, W5 474 s). The W1 ratio 114/101 = 1.13 matches the clock ratio 1.25/1.1 = 1.14 (`TierDefs.CLOCK`).

Depth by tier inside start-level bands:

| Start level | Tier | Runs | Median m | p75 m | Reach W2 % | Players |
|---|---|---|---|---|---|---|
| 1-10 | Silver | 47 | 441 | 879 | 0 | 9 |
| 1-10 | Gold | 84 | 880 | 1,023 | 3.6 | 8 |
| 1-10 | Diamond | 70 | 880 | 1,309 | 2.9 | 6 |
| 11-20 | Gold | 80 | 1,316 | 2,211 | 40.0 | 5 |
| 11-20 | Diamond | 92 | 1,768 | 2,218 | 54.3 | 7 |
| 21+ | Gold | 128 | 2,643 | 3,551 | 78.1 | 4 |
| 21+ | Diamond | 106 | 2,638 | 3,551 | 67.9 | 7 |

Tier changes: 817 consecutive run pairs, 9 up, 5 down; 8 of 21 players ever changed tier.

Story pace by lifetime run number (moves/s, median): runs 1-3 0.461, 4-10 0.475, 11-25 0.464, 26-50 0.450, 51+ 0.448. Tier mix shifts from 30% silver in runs 1-3 to 2% in runs 51+. Within the 3 new-panel players with runs on both sides, the median change from runs 1-5 to runs 21+ is +0.014 moves/s.

### Inferences
- [I] The clock equalises the gold and diamond depth curves almost to the metre, and the dark's share too (14% vs 17%). That is strong evidence that a pace-based pacing DDA can hide a 14% pace gap.
- [I] Silver's shortfall at levels 1-10 (441 m vs 880 m) is not removed by its slower clock (0.85). Either silver players are weaker in ways pace does not measure, or 0.85 is still too fast for them. The cell has 9 players, so it is worth a lab check.
- [I] Pace is a trait, not a skill that grows. It barely moves over 50 runs. So tiers placed on pace are stable (few moves), and the learning curve must live in decisions and power, not in speed.
- [I] The tier mix of runs shifts toward gold and diamond with experience partly because silver players stop playing, not because players get quicker.

### Gaps
- Bronze has 14 runs and 2 story players. Nothing can be said about it.
- The payload does not send the clock value, only the tier. The clock is inferred from `TierDefs.CLOCK`.
- v0.7.12 moved the gold and diamond lines (0.38 to 0.40, 0.48 to 0.50). Only 31 story runs came after it.

## Q5. Board pressure inside a run

### Takeaway
The board's tempo is flat. Moves per second (0.43-0.49), hesitations (about 4 a minute) and the longest pause (6-10 s) barely change from 0 m to 6,666 m. What grows is attrition. Players arrive at bosses with less HP each world, use about one more potion per 500 m, and lose a median 98-119% of their arrival HP in a boss fight (healing included).

### Cited findings
Medians per story run (not resumed), by end depth. Full table in `q5_board_pressure.by_depth_band`.

| End depth m | Runs | Seconds | Moves | Moves/s | Low-HP s | Edge s | Hesitations | Hesitations/min | Longest gap s | Potions used (mean) | Potions found (mean) | Refused (mean) | Traps sprung (mean) | Kits short (mean) | Paused s | Players |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 0-500 | 96 | 64 | 28 | 0.44 | 3 | 0 | 4 | 4.7 | 5.5 | 0.28 | 0.39 | 0 | 1.11 | 1.29 | 0 | 18 |
| 500-1000 | 91 | 101 | 46 | 0.45 | 2 | 2 | 7 | 4.4 | 6.0 | 1.09 | 1.63 | 0.01 | 1.58 | 1.79 | 1.5 | 15 |
| 1000-1500 | 181 | 168 | 75 | 0.46 | 6 | 0 | 11 | 4.2 | 7.7 | 2.39 | 2.86 | 0.05 | 1.82 | 2.01 | 2.4 | 11 |
| 1500-2000 | 47 | 202 | 97 | 0.47 | 2 | 4 | 13 | 4.0 | 7.6 | 2.70 | 4.32 | 0.04 | 1.87 | 2.06 | 9.7 | 10 |
| 2000-2500 | 61 | 243 | 111 | 0.47 | 3 | 3 | 15 | 3.8 | 7.7 | 2.98 | 5.61 | 0.11 | 1.80 | 2.08 | 13.0 | 10 |
| 2500-3000 | 59 | 294 | 130 | 0.45 | 8 | 4 | 20 | 4.0 | 8.3 | 5.75 | 6.68 | 0.10 | 1.64 | 1.86 | 14.0 | 10 |
| 3000-3500 | 30 | 342 | 151 | 0.44 | 4 | 5 | 27 | 4.9 | 8.6 | 6.00 | 7.70 | 0.17 | 1.60 | 1.73 | 21.1 | 10 |
| 3500-4000 | 51 | 379 | 184 | 0.45 | 6 | 5 | 25 | 4.4 | 8.7 | 7.27 | 9.41 | 0.20 | 1.51 | 1.76 | 26.1 | 10 |
| 4000-4500 | 11 | 458 | 199 | 0.43 | 4 | 5 | 34 | 4.2 | 9.9 | 8.82 | 12.55 | 0.82 | 2.18 | 2.27 | 48.4 | 7 |
| 4500-5000 | 5 | 399 | 204 | 0.43 | 4 | 7 | 22 | 4.2 | 8.6 | 9.6 | 11.4 | 0.2 | 0.8 | 0.8 | 29.0 | 3 |
| 5000-5500 | 9 | 388 | 234 | 0.49 | 16 | 3 | 16 | 3.5 | 7.6 | 8.78 | 9.89 | 0 | 1.44 | 1.67 | 44.0 | 4 |
| 6,666 (won) | 6 | 537 | 275 | 0.47 | 3.5 | 2 | 31.5 | 3.9 | 8.4 | 14.17 | 15.67 | 0 | 2.17 | 2.5 | 63.1 | 6 |

No story run ended between 5,500 m and 6,665 m. Median lowest HP is 0% in every band that dies (an HP death) and 4% in won runs.

Per world of a story run (`data.worlds`), worlds the run completed:

| World | n | Median s | Moves/s | Median HP lost | HP lost % of end max HP | Traps sprung (mean) | Traps disarmed (mean) | Players |
|---|---|---|---|---|---|---|---|---|
| W1 | 262 | 145.6 | 0.465 | 202 | 64 | 1.50 | 6.44 | 10 |
| W2 | 109 | 140.1 | 0.444 | 443 | 119 | 0.24 | 8.48 | 10 |
| W3 | 31 | 128.4 | 0.490 | 682 | 151 | 0.26 | 6.97 | 9 |
| W4 | 10 | 105.0 | 0.489 | 640 | 149 | 0.20 | 8.20 | 6 |
| W5 | 5 | 128.9 | 0.493 | 694 | 165 | 0.60 | 8.20 | 5 |

HP lost can pass 100% because campfires and potions heal inside a world.

Elite and boss fights (story):

| World | Slot | Fights | Median s to kill | p75 s | Median HP lost % of arrival HP | Median arrival HP % of max | Fight ended the run by HP % | By dark % | Players |
|---|---|---|---|---|---|---|---|---|---|
| W1 | Elite 12 | 597 | 8.3 | 12.1 | 13.7 | 99.9 | 12.7 | 0.5 | 17 |
| W1 | Elite 24 | 509 | 7.9 | 11.9 | 28.8 | 99.9 | 14.3 | 0.6 | 15 |
| W1 | Boss | 428 | 37.8 | 46.7 | 97.9 | 96.8 | 38.6 | 0 | 11 |
| W2 | Elite 12 | 260 | 7.3 | 10.2 | 37.9 | 90.4 | 12.3 | 1.5 | 10 |
| W2 | Elite 24 | 208 | 7.8 | 11.3 | 60.8 | 90.4 | 21.2 | 1.0 | 10 |
| W2 | Boss | 164 | 33.2 | 43.4 | 102.4 | 85.4 | 31.7 | 0 | 10 |
| W3 | Elite 12 | 108 | 9.5 | 13.4 | 41.8 | 79.8 | 15.7 | 2.8 | 10 |
| W3 | Elite 24 | 81 | 5.9 | 8.4 | 47.4 | 84.5 | 21.0 | 1.2 | 10 |
| W3 | Boss | 56 | 30.5 | 36.8 | 108.5 | 78.8 | 44.6 | 0 | 10 |
| W4 | Elite 12 | 30 | 6.7 | 8.5 | 57.8 | 78.7 | 23.3 | 0 | 9 |
| W4 | Elite 24 | 20 | 4.5 | 7.0 | 35.8 | 54.4 | 15.0 | 0 | 7 |
| W4 | Boss | 18 | 19.6 | 24.6 | 117.0 | 55.8 | 44.4 | 0 | 6 |
| W5 | Boss | 10 | 24.1 | 26.7 | 118.7 | 85.2 | 40.0 | 0 | 6 |

"Max" here is the run's end max HP, so arrival HP slightly overstates early-run health.

### Inferences
- [I] The tempo the player must keep (moves/s) is constant, so the difficulty curve over a run is attrition plus scroll, not a faster board. That fits "the player watches the board". The rise lives in HP lost per fight (W1 elite 14% of arrival HP to W4 elite 58%) and arrival HP at bosses (97% at W1, 56% at W4).
- [I] Boss fights are the build-up and peak, at 20-38 s each. Elites are short spikes of 5-10 s. Regular play between them is the relief beat. There is no measured relief after a boss beyond the walk to the next world.
- [I] Time to kill a boss falls with depth (W1 38 s, W4 20 s) while the scroll rises. Power outgrows the bosses' HP, and the bosses still kill 40-45% of reachers through damage, so the late bosses are burst checks, not endurance checks.
- [I] Potions are found faster than they are used (15.7 vs 14.2 in won runs) and almost never refused. The potion supply is not a constraint by the measures available.
- [I] Traps spring about 1.5 times per run in W1 and 0.2-0.3 per world after it. Traps are a W1 lesson that players then master (disarms 6-8 per world).

### Gaps
- No per-encounter time line for regular encounters, so the curve between walls is only per world.
- No record of when a warning was shown or whether the player reacted to it.
- `paused` rises with depth (63 s in won runs). It is time with the game held, probably cards and menus; the payload does not say why.

## Q6. Power curve

### Takeaway
Depth climbs with every power measure, and the steps line up with the W1 walls. Start level 1-2 dies at the first elite, 6-10 at the second, 11-15 at the boss, 21+ reaches W3. Town upgrades and talent rows tell the same story. The data cannot separate power from player skill because both grow with runs.

### Cited findings
Depth by start level (meta-progression):

| Start level | Runs | Median m | p75 m | Reach W3 % | Won % | Players |
|---|---|---|---|---|---|---|
| 1-2 | 47 | 441 | 441 | 0 | 0 | 16 |
| 3-5 | 66 | 718 | 885 | 0 | 0 | 13 |
| 6-10 | 94 | 885 | 1,310 | 0 | 0 | 12 |
| 11-15 | 95 | 1,313 | 1,774 | 1.1 | 0 | 10 |
| 16-20 | 95 | 1,774 | 2,218 | 8.4 | 0 | 10 |
| 21-25 | 72 | 2,640 | 3,551 | 43.1 | 0 | 10 |
| 26+ | 182 | 2,649 | 3,939 | 45.6 | 3.3 | 10 |

Depth by town building levels (sum at run end): 0-4 885 m (268 runs, 18 players), 5-14 1,305 m, 15-29 1,848 m, 30-44 2,650 m, 45+ 3,844 m (65 runs, 7 players). Depth by talent rows: 0 rows 441 m, 1 row 1,303 m, 2 rows 1,312 m, 3 rows 1,957 m, 4 rows 3,107 m, 5 rows 3,979 m.

End-of-run stats by end depth (medians): 0-500 m level 3, HP 117, ATK 9.8, DEF 6.0; 1,000-1,500 m level 15, HP 224, ATK 26.4, DEF 12.7; 2,500-3,000 m level 27, HP 304, ATK 39.8, DEF 20.0; won runs level 34, HP 438, ATK 57.8, MAG 64.0, DEF 27.0, town levels 47.5. Start and end level differ by 0-2 inside a run: the run's XP is mostly banked for the next one.

### Inferences
- [I] The power curve between runs is the main driver of depth. Felt difficulty at a wall drops because the hero arrives stronger, which makes MatchRPG closer to Rogue Legacy than to Spelunky. A player who loses to Old Mossback is told by the numbers to come back stronger.
- [I] 1 and 2 talent rows reach the same depth (1,303 m vs 1,312 m), both stuck at the W1 boss. The second row does not move the W1 wall; the third does (1,957 m).
- [I] Level 21-25 and 26+ have the same median (2,640 m vs 2,649 m). Past level 21 the median stops rising, so the W3-W4 walls need more than levels (decisions, build, or time).

### Gaps
- Power and skill are confounded. A within-player comparison at equal run number with different levels would need a lab or an A/B with forced loadouts.
- Talent branches (`talents` per branch) and items were not broken down; with 8-10 players per cell a per-branch table would fall under the 3-player rule fast.

## Q7. Endless

### Takeaway
Endless is played by 11 players, and 4 of them made 74% of its runs. A typical endless run lasts 9 minutes and passes the bottom once. Its depth keeps rising with endless runs played (5,309 m on the first, about 10,000 m from the 4th on). Short endless runs end by retreat, mid-depth ones often by the dark, and past 10,000 m HP kills almost everything.

### Cited findings

| Measure | Median | p25 | p75 | p90 |
|---|---|---|---|---|
| Depth m | 9,295 | 3,974 | 11,972 | 13,306 |
| Seconds | 559 | 172 | 871 | 1,044 |
| Encounters cleared | 250.5 | 107 | 323 | 359 |

Laps: ended in lap 1 (0-6,666 m) 73 runs (8 players), lap 2 106 runs (9 players), lap 3 13 runs (5 players). Endings: HP 63.0%, dark 15.1%, other 21.9%.

| End depth m | Runs | HP % | Dark % | Other % | Players |
|---|---|---|---|---|---|
| 0-2,000 | 38 | 2.6 | 5.3 | 92.1 | 4 |
| 2,000-4,000 | 15 | 46.7 | 26.7 | 26.7 | 5 |
| 4,000-6,000 | 11 | 36.4 | 45.5 | 18.2 | 6 |
| 6,000-8,000 | 23 | 56.5 | 39.1 | 4.3 | 7 |
| 8,000-10,000 | 18 | 66.7 | 33.3 | 0 | 7 |
| 10,000-12,000 | 50 | 96.0 | 4.0 | 0 | 7 |
| 12,000-14,000 | 26 | 96.2 | 3.8 | 0 | 5 |
| 14,000-16,000 | 10 | 100 | 0 | 0 | 3 |

| Endless run no | Runs | Median m | p75 m | Median s | HP % | Dark % | Other % | Players |
|---|---|---|---|---|---|---|---|---|
| 1 | 10 | 5,309 | 8,639 | 398 | 80.0 | 0 | 20.0 | 10 |
| 2-3 | 17 | 7,103 | 9,316 | 478 | 70.6 | 17.6 | 11.8 | 9 |
| 4-10 | 50 | 9,764 | 11,969 | 703 | 70.0 | 24.0 | 6.0 | 8 |
| 11-25 | 57 | 10,217 | 12,433 | 585 | 64.9 | 10.5 | 24.6 | 6 |

Endless killers (3+ players): Astaroth 20, The Sleeper Below 19, The Warden 14, Old Mossback 11, The Deep Wyrm 11, Orc Warlord 8.

### Inferences
- [I] Endless has its own sawtooth with the set = lap, and the second lap is where it bites. 10,000-12,000 m is the most common place to die (50 runs), which is early in lap 2 after `ENDLESS_POWER` has stacked for 3,300 m or more past the bottom.
- [I] The dark matters mid-endless (33-46% of endings at 4,000-10,000 m) and then vanishes, because the scroll has long been at `MAX_SCROLL` while foe HP and damage keep growing. Late endless is a pure stat race.
- [I] The 38 endless runs that end before 2,000 m by retreat look like players starting endless to do something else (bank, test a build, quit). Their share should be left out of any endless depth curve.
- [I] Depth gain flattens after about 10 endless runs (9,764 m to 10,217 m), the point where interest may fade if nothing new appears. Run count per endless player is too small to say more.

### Gaps
- Retreats arrive with an empty reason, so a retreat cannot be told apart from another blank ending.
- 11 players, 4 of whom dominate. Endless results are close to a case study of 4 players.

## Q8. Version natural experiments

### Takeaway
Raw version comparisons mostly measure who was playing. Later windows look much easier (W1 boss win rate 53% on v0.6.0-v0.6.2.x, 88% on v0.7.12-v0.7.14), but the median player in the last window had 158 runs against 12 in the first. Inside start-level bands the differences shrink and partly reverse. The one signal that holds after control is a rise of dark deaths in the latest window.

### Cited findings
Story runs by version (versions with 30+ story runs and 3+ players, plus the majors):

| Version | Story runs | Median m | Reach W2 % | W1 e12 win % | W1 e24 win % | W1 boss win % | HP % | Dark % | Median run_no | Players |
|---|---|---|---|---|---|---|---|---|---|---|
| v0.6.x | 117 | 1,513 | 50.4 | 89.7 | 90.3 | 64.8 | 78.6 | 19.7 | 17 | 8 |
| v0.7.x | 534 | 1,314 | 42.5 | 87.0 | 85.1 | 63.1 | 82.2 | 15.4 | 50.5 | 16 |
| v0.7 | 30 | 877 | 10.0 | 73.3 | 55.6 | 30.0 | 90.0 | 6.7 | 30.5 | 4 |
| v0.7.2.2 | 50 | 883 | 16.0 | 72.0 | 48.5 | 53.3 | 86.0 | 14.0 | 39.5 | 8 |
| v0.7.2.4 | 198 | 1,316 | 41.9 | 93.3 | 92.2 | 52.2 | 85.9 | 13.6 | 54 | 12 |
| v0.7.11.2 | 65 | 1,314 | 43.1 | 88.5 | 90.6 | 62.2 | 75.4 | 16.9 | 122 | 10 |

By version window:

| Window | Story runs | Median m | Reach W2 % | W1 boss win % | Dark % | Median run_no | Players |
|---|---|---|---|---|---|---|---|
| v0.6.0-v0.6.2.x (to 10-25) | 80 | 1,312 | 37.5 | 52.6 | 22.5 | 12 | 5 |
| v0.6.3-v0.6.9.x (10-26 to 10-28) | 37 | 2,643 | 78.4 | 85.3 | 13.5 | 36 | 6 |
| v0.7-v0.7.2.x (10-29 to 11-03) | 396 | 1,312 | 38.1 | 58.3 | 14.1 | 43 | 12 |
| v0.7.4-v0.7.11.x (11-04 to 11-05) | 107 | 1,773 | 50.5 | 71.1 | 15.9 | 90 | 12 |
| v0.7.12-v0.7.14 (11-07 to 11-09) | 31 | 2,218 | 71.0 | 88.0 | 29.0 | 158 | 6 |

Inside start-level bands (cells with 3+ players):

| Start level | Window | Runs | Median m | Reach W2 % | Dark % | Players |
|---|---|---|---|---|---|---|
| 1-10 | v0.6.0-v0.6.2.x | 31 | 884 | 0 | 6.5 | 4 |
| 1-10 | v0.7-v0.7.2.x | 149 | 878 | 3.4 | 10.1 | 12 |
| 1-10 | v0.7.4-v0.7.11.x | 22 | 441 | 0 | 13.6 | 6 |
| 11-20 | v0.6.0-v0.6.2.x | 30 | 1,314 | 36.7 | 23.3 | 3 |
| 11-20 | v0.7-v0.7.2.x | 134 | 1,317 | 44.8 | 14.2 | 9 |
| 11-20 | v0.7.4-v0.7.11.x | 16 | 2,218 | 75.0 | 0 | 3 |
| 21+ | v0.6.3-v0.6.9.x | 31 | 3,103 | 90.3 | 16.1 | 3 |
| 21+ | v0.7-v0.7.2.x | 113 | 2,649 | 76.1 | 19.5 | 7 |
| 21+ | v0.7.4-v0.7.11.x | 69 | 2,210 | 60.9 | 20.3 | 5 |
| 21+ | v0.7.12-v0.7.14 | 22 | 2,646 | 77.3 | 36.4 | 3 |

Within players with 3+ story runs on both majors (4 players), the median change in story depth from v0.6 to v0.7 is -160 m (3 shallower, 1 deeper).

Endless by window: v0.6.0-v0.6.2.x median 10,426 m (dark 9.5%), v0.6.3-v0.6.9.x 10,671 m (10.0%), v0.7-v0.7.2.x 3,982 m (15.4%, 13 runs), v0.7.4-v0.7.11.x 6,557 m (23.7%), v0.7.12-v0.7.14 9,318 m (35.3%).

What changed, from `CHANGELOG.md` [K]:
- v0.6.3-v0.6.9 (10-26 to 10-28). Seven potions moved from uncommon to common, potions come home after a retreat or a win, drink before the first move, drop weights per potion, and `COMBO_STEP` cut from 0.875 to 0.7 in v0.6.6.
- v0.7 (10-29). Heroes redrawn, no rule changes. v0.7.1 Tinker becomes a 12% trap dodge per level. v0.7.1.1 menu redesign only. No changelog entry exists for v0.7.2.x.
- v0.7.4-v0.7.11 (11-04 and 11-05). The chain carries through world bosses (v0.7.4), stops removed again (v0.7.7), the chain clock waits on the board (v0.7.8), the second level in a run counts a third (v0.7.9), broken tiles pay (v0.7.10, v0.7.11).
- v0.7.12-v0.7.14 (11-07 to 11-09). Gold and diamond lines moved up 0.02 moves/s, the Sleeper Below warns 0.8 s ahead (was 1.5 s), disarming takes 0.5 s (was 1 s), the armour-breaking blow stops there.

### Inferences
- [I] v0.7 and v0.7.2.2 look like spikes (W1 boss 30% and W1 e24 49% win rates), but v0.7 has 4 players and no rule change. Treat them as player-mix noise until a lab replay says otherwise.
- [I] The v0.6.3-v0.6.9 window's high numbers (85% W1 boss win) come from 6 players and 37 runs, with the potion buff and the combo nerf landing together. It cannot separate them.
- [I] In the latest window, dark deaths doubled at levels 21+ (20% to 36%) and in endless (24% to 35%). The v0.7.12 tier lines moved two players from diamond to gold, which gives them a slower clock, so the clock does not explain it. The halved Sleeper warning (1.5 s to 0.8 s) is a candidate for the deep runs. Only 22 story runs and 3 players, so this is a flag for the next dump, not a finding.
- [I] Version effects are smaller than the run-to-run noise at this sample size. The useful natural experiment here is the within-player switchback suggested in 09-measurement, not version windows.

### Gaps
- No version window has more than 12 players, and most sub-versions are under 30 runs.
- No changelog entry for v0.7.2.x, which holds 335 story runs.

## Q9. Data quality

### Takeaway
A rich payload with a thin and lopsided player base. Four players carry 58% of runs and 74% of endless runs. Player-weighting changes the funnel's reach numbers a lot but leaves the median depth and the death split nearly where they are.

### Cited findings
Top 4 players by runs: 57.6% of all runs, 52.7% of story runs, 74.0% of endless runs.

| Result | Run-weighted | Player-weighted | Without the top 4 players |
|---|---|---|---|
| Story median depth m | 1,315 | 1,310 | 1,313 |
| Reach W2 % | 43.9 | 28.4 | 42.2 |
| Reach W3 % | 18.9 | 13.1 | 20.8 |
| HP deaths % | 81.6 | 79.8 | 80.2 |
| Dark deaths % | 16.1 | 11.7 | 16.9 |
| Story moves/s | 0.455 | 0.458 | 0.448 |
| Story seconds | 177 | 160 | 159 |

Player-weighted shares give each player's runs a total weight of 1; player-weighted medians are the median of per-player medians. Without the top 4: 308 story runs, 14 players.

Other issues:
- 92 runs (10.7%) were resumed from a checkpoint and log only the part after the resume.
- 11 of 21 players had runs before v0.6, so their first runs are missing. `run_no` restarted for 4 players inside the window.
- 747 of 859 runs came from touch devices.
- Bronze has 14 runs. The W4-W5 and endless cells rest on 3-10 players.
- Retreats arrive with an empty `reason`.
- The window ends while 11 players are still active, so churn is right-censored.

What the payload cannot answer:
- Regular encounters one by one (only elites and bosses are in `fights`, the last 40 of them).
- A session id, or runs abandoned without an upload (page closed with no checkpoint resume).
- When a warning was shown and whether the player reacted.
- Perceived difficulty, the aesthetic the player felt, and why a player stopped.
- The tier clock value actually applied.
- Pre-v0.6 history for veterans.

### Inferences
- [I] The reach-W2 gap (44% vs 28%) is the main heavy-player bias. Heavy players pass the W1 boss much more often. Any funnel shown on the site should show the player-weighted line next to the run-weighted one.
- [I] Results that sit on a wall (median depth, death split) are robust to weighting. Results about the deep game (W3+, endless) are a study of about 4-10 players.

## Pattern cards the data suggests

### World-boss wall sawtooth
- Lineage: arcade boss stages -> 10000000 and You Must Build A Boat (bosses per run, power between runs) -> MatchRPG (5 worlds, elites at 12 and 24, boss at 36).
- Feeling: Challenge and fiero at each world boss, relief in regular play.
- Mechanism: loss per attempt about 0.2-1% at regular encounters, 12-22% at elites, 30-42% at bosses. Set = world.
- Conditions: works while players arrive at bosses with power that rises run over run. Breaks when the first boss needs many attempts before the power curve catches up (W1 boss: median 7 attempts).
- Evidence: Q1 tables [K, E1].
- Cost: S. Knobs are boss HP and damage, `ELITE_HIT`, and campfire HP before the boss.
- MatchRPG: the W1 boss is the churn point. Lowering its loss toward the W2 boss's 30%, or adding a visible catch-up after 3 losses there, targets the 7-attempt median.

### Split punishment by encounter kind
- Lineage: Juul's energy vs termination punishment -> endless runners (the chaser) -> 10000000's left edge -> MatchRPG's dark.
- Feeling: two kinds of tension. Fights test the build (Challenge), the walk tests the board's tempo.
- Mechanism: elites and bosses end runs by HP (94-100%), regular stretches by the dark (86%). The dark's share grows with scroll (10% in W1 to 33% in W3) and stops rising once scroll hits `MAX_SCROLL` (W4).
- Conditions: works while the dark warns (median 7 s of edge danger, 98% of dark deaths had more than 1 s). Breaks if both channels peak at once.
- Evidence: Q2 [K, E1].
- Cost: S. Knobs are `SCROLL_ACCEL`, `MAX_SCROLL`, `EDGE_MERCY`.
- MatchRPG: report both channels per world on every balance pass. The latest window's rise in dark deaths is the first thing to check in the next dump.

### Pace-clocked tiers (pacing DDA)
- Lineage: speed levels in Tetris -> ranked ladders -> MatchRPG tiers with `TierDefs.CLOCK`.
- Feeling: everyone feels the same pressure per move. The tier is a badge, the clock is hidden mercy.
- Mechanism: the dungeon runs on the tier's clock (gold 1.1, diamond 1.25); seconds to the W1 boss differ by 1.13x, the clock ratio is 1.14x.
- Conditions: works between tiers whose players differ only in pace (gold and diamond reach the same depth, 1,316 m vs 1,317 m). Breaks for the slowest tier, where slow pace comes with other gaps (silver at levels 1-10: 441 m vs 880 m).
- Evidence: Q4 [K, E1].
- Cost: already built. Knobs are `CLOCK` and `FROM` per tier.
- MatchRPG: test a slower silver clock (0.75) in the lab with silver gap distributions before touching gold and diamond.

### Staircase learning carried by meta-progression
- Lineage: Rogue Legacy (persistent power) -> Hades (mirror) -> MatchRPG (levels, town, talent rows).
- Feeling: Challenge plus Discovery at each new wall; a sense of building toward the next step.
- Mechanism: median depth steps from encounter 12 to 24 to 36 over lifetime runs 1-3, 4-10, 11-25, while pace stays at 0.45-0.48 moves/s. Depth rises with start level, town levels and talent rows.
- Conditions: works while each wall falls within a few sessions (2 runs a session, 12 minutes). Breaks when a wall takes more sessions than a casual player gives (the 7 of 10 lapsed players who stopped in W1).
- Evidence: Q3, Q6 [K, E1].
- Cost: M. Knobs are XP per run, `LOST_FIGHT_XP`, building costs, talent row unlock levels.
- MatchRPG: the second talent row does not move the W1 boss (1,303 m vs 1,312 m). Making row 2 count at the boss would turn a flat step into a visible one.

### Endless HP wall
- Lineage: Risk of Rain 2 difficulty over time -> Vampire Survivors' late scaling -> MatchRPG `ENDLESS_POWER` 0.12 past the bottom.
- Feeling: Submission and Challenge for a few laps, then a stat race.
- Mechanism: dark endings at 33-46% between 4,000 and 10,000 m, then 96-100% HP deaths past 10,000 m.
- Conditions: works as a clear ending for long runs (median 559 s). Breaks when depth gains flatten (after about 10 endless runs) and nothing new appears.
- Evidence: Q7 [K, E1], 11 players.
- Cost: S. Knobs are `ENDLESS_POWER` and the lap shuffle.
- MatchRPG: one new beat per lap (a modifier, a lap boss) could keep the interest curve rising after endless run 10.

## Fun hypotheses the data supports or contradicts

- "Pressure is good, dying without warning is not" (CLAUDE.md pillar). Supported for the dark: 98% of dark deaths had more than 1 s of edge danger, median 7 s. Partly contradicted for HP: about 10% of HP deaths had 1 s or less of low HP in the whole run, which reads as burst deaths at elites and bosses.
- "The player watches the board, not the dungeon." Supported. Board tempo is flat (0.43-0.49 moves/s, about 4 hesitations a minute at every depth), and the dark kills mostly away from fights where the board is the only thing that matters.
- "Move for move the game asks the same of slow and quick players." Supported for gold vs diamond (same depth curve, same death split). Contradicted for silver, whose low-level runs reach half the depth.
- "Players of MatchRPG should feel fiero at the first world boss around run 10." Supported in timing but costly: clearing Old Mossback takes a median 7 attempts, and the median player clears it around lifetime run 20. The 7 of 10 lapsed players who stopped in W1 never got that fiero.
- "Players get better at the board over runs." Contradicted if "better" means faster. Pace does not rise over 50 runs. Supported if it means deeper, which tracks power.
- "Endless stays interesting for many runs." Partly supported. Endless depth rises over the first 10 endless runs, then flattens, and 4 players made 74% of endless runs.
- "Mercy is hidden." Supported by the tier clock, which players never see and which still lines up gold and diamond.

## Glossary additions
- Attempts to first clear: per player, the attempts at a stage up to and including the first clear. King's "attempts to pass". Median over players who cleared, plus the count who never did.
- Player-weighted rate: a rate where each player's runs sum to a weight of 1, shown next to the run-weighted rate when a few players make most of the runs.

## Sources
- Run data: `matchrpg-runs-v06-v07` (local, untrusted), 859 runs, 21 players, 2026-10-23 to 2026-11-10. [K, E1]
- Field meanings: `/Users/esenespinosa/Development/personal/games/matchRPG/scripts/ui/run_log.gd` (`DANGER_LINE` 0.5, `HESITATION` 3.0 s, `FIGHTS_SENT` 40, fights logged for elites and bosses only), `scripts/ui/run_upload.gd` (payload), `scripts/runner/runner.gd` (`pace()`, `LEFT_BEHIND`, `_end` reasons), `dev/runs_load.py` (data traps). [K]
- Version changes: `/Users/esenespinosa/Development/personal/games/matchRPG/CHANGELOG.md`, v0.6.0.1 to v0.7.14. [K, E2]
- Analysis script: `/private/tmp/claude-501/-Users-esenespinosa-Development-personal-games-kingsfoil-artifacts/a74d8fa3-59f2-446d-a70a-8da29b61d576/scratchpad/analysis/curves_telemetry.py`.
- Aggregates: `studies/curves-matchrpg/notes/telemetry-aggregates.json`.
