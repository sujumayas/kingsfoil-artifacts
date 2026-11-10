# 09. Measurement with live telemetry (researcher 7)

Scope. How to measure MatchRPG's difficulty, learning and pressure curves from the run payload it already sends (859 runs, 21 players), what that payload cannot see, how to add the missing events cheaply, and how to run playtests and knob tests with 5 testers plus 21 live players. General playtest method (PENS, CORGIS, miniPXI, drawn interest curves, think-aloud, RITE, Nielsen's 5 users, Wilson intervals for tiny N, King's "time to abandon", Valve's 1-7 item) is in Hearthguard's `studies/curves-hearthguard/notes/08-measurement-playtest.md` and is cited here as [HG08], not repeated.

Privacy. Every number from the player data below is an aggregate with at least 3 players per cell (checked). No ids, names or per-player traces. The in-repo docs name players; this note does not.

Tool budget used: about 30 calls. Blocked or not found: gamegeeker.com (403), Spirelogs (no live page found), Playrix and Rovio dashboards (no public material found), Motion Twin and Supergiant telemetry (none published). Listed in Gaps.

## Takeaways

1. MatchRPG's payload is already richer than most indie telemetry. It has the end encounter (`reached`), the cause (`reason`), per-world seconds, moves, hurt and traps, a full line for every elite and boss fight (edge seconds, lead in px, potions, hits), run-level `edge_seconds` and `low_hp_seconds`, pace, tier and run number. That supports a survival curve by encounter, hazard per boss, death-cause mix and a learning curve today. [K, E1]
2. The right difficulty chart for a run-based game is a hazard by encounter, not a depth histogram. On story runs the world bosses at encounters 36, 72 and 108 end 37%, 30% and 42% of the runs that reach them. The first elite (encounter 24) ends 14%. That is a sawtooth with the set = world, and the boss is the peak. [K, E1]
3. Heavy players dominate counts but not variance. The top 3 players made 46% of runs and the top 5 made 65%. Yet only 15% of the variance in story depth lies between players; 85% is run-to-run noise inside a player. So every interval must resample players, not runs, and depth is a noisy A/B metric (SD 1,294 m against a median of 1,316 m). [K, E1] [I]
4. With 21 players, test a knob within players. Randomise the knob per run (a switchback), analyse per-player differences, and fix the length in advance. A between-player split (10 vs 11) can only detect about a 700 m change in mean story depth, more than half a world. A per-run switchback with 20 runs per arm per player detects about 360 m on 10 active players. [I, E1 arithmetic]
5. Six cheap additions close the main gaps. A session id, a timeline of every encounter, edge-lead samples, a warnings shown-vs-reacted counter, an abandoned-run row on the next launch, and a sampled one-tap difficulty rating. All but the warnings counter are size S. [K] [I]
6. The balance sim already reads real human gaps (`--gaps-file`). Run it on each version with the live gap distribution per tier and overlay its hazard on the human hazard. Where humans die far more than the bot at the same encounter, suspect reading and warnings, not numbers (King uses bots the same way). [K, E1] [V, E2]

## Q1. How do match-3 and roguelite studios measure stage and run difficulty?

### Takeaway
Match-3 studios measure each level by pass rate (passes per 100 attempts), attempts to pass and churn at the level. King's own scientists model a level as a race between two clocks, time to pass and time to abandon. Roguelite studios publish win rate by ascension and per-card or per-enemy stats. For MatchRPG the stage is the encounter and the world, and an attempt is a run that reaches it.

### Cited findings
- King measures difficulty by pass rate, or average attempts before passing or quitting. Level 65 churned 50% of the players who reached it. Already in [HG08] (Darley, Business of Software). https://businessofsoftware.org/talks/how-to-make-sense-of-big-data/ [V, E2]
- King today counts passes per 100 attempts among other factors (AP via MarketBeat, May 2025). https://www.marketbeat.com/articles/how-candy-crush-uses-ai-to-keep-players-coming-back-to-its-puzzles-2025-05-11 [V, E2]
- Reguera, Colomer-de-Simón, Encinas, Sort, Wedekind and Boguñá (King and Universitat de Barcelona), *Scientific Reports* 2020. A weekly install cohort of 11,836,502 Candy Crush Saga players followed for two years. Each level is two competing exponential times, time to pass and time to abandon; a player passes if the pass time comes first. After the first 10-20 levels the mean abandon time grows as a power of level with exponent α about 1.1 (1.0-1.5), and the mean pass time with β 0.1-0.5. If α − β > 1 a fraction of players never quits; the games sit just below that line. The same law held in Farm Heroes, Papa Pear, Soda and Pyramid Solitaire. https://pmc.ncbi.nlm.nih.gov/articles/PMC7058085 , preprint https://arxiv.org/abs/1911.01864 [V, E1]
- Slay the Spire 2 Early Access. Coverage of Mega Crit's May 2026 "Neow Dispatch" reports Ascension 0 win rate 16% (9% in the first game) and Ascension 10 about 17%, against 3% at Ascension 20 in the first game. A "240 million runs, 25% overall" figure circulates without a Mega Crit primary source. The original page (gamegeeker.com) returned 403 to fetch; figures come from search snippets. https://gamegeeker.com/fr/news/slay-the-spire-2-may-neows-news-update?market=FR [U, E3]. Mega Crit reported 25 million runs in launch week. https://gamingbolt.com/slay-the-spire-2-sells-3-million-copies-in-first-week-over-25-million-runs-recorded [V, E2]
- Community stats sites (MetaBot, BrokenBuilds) state their win rates are community aggregates, and MetaBot's per-class rates rest on about 28-49 tracked runs per class. https://metabot.gg/en/slay-the-spire-2/classes/win-rate , https://brokenbuilds.gg/slay-the-spire-2/guides/slay-the-spire-2-meta-snapshot-v0-102-0 [V, E3]
- Spirelogs grouped ascensions into brackets and moved its top bracket to 17+ because the 16 to 17 step was the largest jump in difficulty (search snippet only; the site itself was not found live). [U, E4]
- Mega Crit's metric server and card pick and win stats are in [HG08]. [V, E2]

### Inferences
- [I] The King model maps directly onto MatchRPG if "level" becomes "encounter" and "time" becomes "runs". A run either clears encounter k or ends there. Abandonment of the game is a separate clock that the payload sees only as a player who stops sending runs.
- [I] The StS2 numbers show why studios publish win rate by ladder rung, not overall. MatchRPG's equivalent rung is the world (story) and the lap (endless), and the tier is a second axis (see Q3).
- [I] Community-site cautions apply to MatchRPG's 21 players at a smaller scale. A rate from 28 runs is as shaky as one from MetaBot's thinnest class.

### Gaps
- Playrix and Rovio funnel dashboards. No public talk or article found within budget.
- Hades, Dead Cells and Balatro. No published telemetry found. Motion Twin's privacy policy says it collects anonymous data to improve the game, with no detail. https://dead-cells.com/privacy [V, E2]
- Spirelogs win rates by ascension not verified.

## Q2. Survival analysis for runs: how to show a spike

### Takeaway
Treat each story run as a life that ends at an encounter. Plot the survival curve S(k), the share of runs still alive after encounter k, and under it the hazard h(k), the share of runs that reach k and end there. A spike is a hazard bar that stands well above its neighbours with an interval that does not overlap them. Use runs as the denominator for hazard (King's "attempts") and players as the resampling unit for intervals.

### Cited findings
- Kaplan-Meier estimator: S(k) = Π over j ≤ k of (1 − d_j / n_j), with d_j events and n_j at risk at step j; censored lives leave the risk set without counting as events. https://en.wikipedia.org/wiki/Kaplan%E2%80%93Meier_estimator [V, E3]
- Bertens et al. (Silicon Studio) predict the level at which a mobile player churns with survival ensembles. Integrated Brier score 0.025 against 0.054 for Cox regression and 0.127 for plain Kaplan-Meier, so KM is a baseline for description, not a predictor. https://arxiv.org/abs/1710.02262 [V, E1]
- Periáñez et al. use KM curves split by player type and the last level reached as the first split of a survival tree. https://arxiv.org/abs/1710.02264 [V, E1]
- Khan's World of Warcraft churn study compares KM curves with the log-rank test and restricted mean survival time (RMST). https://arxiv.org/abs/2006.15735 [V, E1]

### MatchRPG today (aggregates, story runs, challenges excluded, n = 651 runs, 18 players)
- [K, E1] Hazard by world (runs that end in world w / runs that enter it): world 1 0.56 (651 at risk), world 2 0.57 (286), world 3 0.72 (123), world 4 0.69 (35). World 5 is below a safe cell size here; agent 0b owns it.
- [K, E1] Hazard at the marked encounters (runs ended there / runs at risk, players at risk):

| Encounter | Slot | Hazard | Runs ended / at risk | Players at risk |
|---|---|---|---|---|
| 24 | world 1 elite | 0.14 | 76 / 545 | 15 |
| 36 | world 1 boss | 0.37 | 165 / 451 | 11 |
| 60 | world 2 elite | 0.21 | 47 / 226 | 10 |
| 72 | world 2 boss | 0.30 | 52 / 175 | 10 |
| 108 | world 3 boss | 0.42 | 25 / 60 | 10 |

  These are the eight highest hazards with at least 30 runs at risk; normal encounters sit far lower. [I] I read `reached` as encounters cleared, so a run with `reached` = 35 ended at encounter 36. Agent 0b should confirm.
- [K, E1] End causes over all 859 runs: "Slain by Old Mossback" 177, "Caught by the dark" 139, Ogre King 81, Broodmother 79, The Warden 70, empty reason 56 (52 lost, 4 won), Orc Warlord 52, Lich 38. The empty reason is probably the retreat path (`Run._retreat`), unconfirmed. [U]

### Inferences
- [I] Censoring rules. Wins are censored at encounter 180. Runs with `resumed_from` ≥ 0 start late (left truncation): enter them into the risk set only from the resume encounter. Endless runs get their own curve per lap. Challenge runs are excluded or plotted apart because the seed is fixed.
- [I] Spike rule. Flag encounter k if h(k) is at least twice the median hazard of the normal encounters in its world and the lower end of a player-bootstrap 95% interval exceeds the upper end of that median. With these counts the three bosses pass and the elites are borderline.
- [I] A single number for A/B. Restricted mean depth (RMST up to encounter 108, the area under S(k)) uses every run, including the many short ones, and moves more smoothly than median depth, which jumps between boss plateaus.
- [I] Depth is lumpy. The median story depth (1,316 m) sits on the world 1 boss, so its player-bootstrap interval is 1,310 m to 1,774 m, two plateaus apart. Report hazard and RMST, not median depth, for changes.

### Gaps
- No public roguelite publishes hazard by floor. The method is borrowed from churn-per-level work.

## Q3. Learning curves across runs, with 21 players

### Takeaway
Plot run index (the player's n-th story run) on the x axis, never calendar time. Show only players who reached that index, label n players per point, and add a per-player normalised curve so persistent players do not create a fake slope. Fit exponentials per player, not a power law to the average.

### Cited findings
- Stafford and Dewar, *Psychological Science* 2014, 854,064 players of the online game Axon. Practice amount and spacing both relate lawfully to later score, and players with more varied early scores reached higher later scores. Data and code are public. https://eprints.whiterose.ac.uk/id/eprint/83582/ [V, E1]
- Heathcote, Brown and Mewhort 2000 fit 7,910 learning series from 475 subjects. An exponential fit unaveraged data better in every dataset; averaging biases the fit towards a power law. https://link.springer.com/article/10.3758/BF03196105 [V, E1]. Averaging individual exponentials can yield an averaged power curve (Anderson 2001, cited in a 2011 review). https://dx.doi.org/10.3758/s13423-011-0076-y [V, E1]
- Cameron, Gelbach and Miller 2008. With 5-30 clusters, standard cluster-robust tests reject a true null about 10% of the time at a nominal 5%. A wild cluster bootstrap brings that back near 5%. https://www.nber.org/papers/t0344 [V, E1]

### MatchRPG today (aggregates)
- [K, E1] Median story depth by run index: runs 1-5 441 m (18 players, 75 runs), runs 6-20 1,310 m (12 players, 160 runs), runs 21+ 1,774 m (10 players, 416 runs).
- [K, E1] Runs per player: median 13; 10 players have 20 or more, 9 have 5 or fewer. Top 3 players made 46% of all runs, top 5 made 65%.
- [K, E1] Between-player share of story-depth variance 0.15. Median within-player SD of depth 1,258 m, total SD 1,294 m.
- [K] `dev/runs_load.py` already adds `nth` (run index per player, challenges left out) and warns that `id` must not be sorted as text.

### Inferences
- [I] The 441 to 1,774 m rise mixes learning with survivorship. The 21+ bucket holds only the 10 players who stayed. Two fixes. (a) Cohort the curve by total runs played (players with 20+ runs only, plotted from run 1). (b) Normalise per player, depth at run n divided by that player's median depth over their last 10 runs, so each curve ends near 1.0.
- [I] Fit per player y(n) = a − b·e^(−n/τ) on depth or on world reached, for players with 10+ runs. Report median τ (runs to reach 63% of the plateau) across players. Do not fit a power law to the pooled median curve (Heathcote).
- [I] Meta-progression and skill are confounded in run index. The payload holds both, so split them. Plot depth against run index and against hero `level`, and compare players at the same level but different run counts.
- [I] How few players are enough. For a rate per world, 10 players is the working floor, and every interval must be a player-level (cluster) bootstrap, ideally wild. With 18 story players a run-level interval would be far too narrow, because 85% of variance is inside players but runs from one player are not independent of that player's skill and build.
- [I] Heavy-player rule. Show every chart twice, run-weighted (what the game hands out) and player-weighted (median of per-player medians: 1,310 m, interval 441-1,322 m). If they disagree, the heavy players are steering the picture.

### Gaps
- No published learning curve for a match-3 roguelite by run index.

## Q4. Bots as a floor, and bot curves vs human curves

### Takeaway
A bot that plays at the measured human pace gives the "numbers only" hazard. Human hazard well above bot hazard at an encounter points at reading, warnings or learning. Equal hazards point at numbers. King uses bots to predict pass rates but keeps humans for feel.

### Cited findings
- Gudmundsson et al. (King) 2018, "Human-Like Playtesting with Deep Learning". A CNN trained on human moves in Candy Crush Saga and Soda Saga predicts level difficulty, correlates better with average human difficulty than MCTS at a fraction of the compute. Estimates that took about 7 days of human playtesting per 15-level episode now take under a minute (as reported). https://www.gwern.net/doc/reinforcement-learning/imitation-learning/2018-gudmundsson.pdf , summary https://koaning.io/posts/playtesting [V, E1; full accuracy figures not read]
- King's AI Labs lead claims the bot cut manual level adjustments by 95% (company claim, vendor-reported). https://wnhub.io/news/Generative_AI/item-43934 [V, E2]
- King says bots miss how a level feels; already in [HG08]. [V, E2]

### MatchRPG today
- [K, E1] `dev/balance_sim.gd` plays a whole career with a greedy bot, buys the cheapest upgrade between runs, and takes `--mps`, `--gap`, `--pause` and `--gaps-file` (real players' move gaps). Each run prints a RUN line with cause (edge, slain:<enemy>, retreat).
- [K, E1] `docs/flow-balance-2026-11-04.md` fits the talent lab to humans. Players make 0.46 moves per second with 15% of gaps 3 s or more; quick diamond players 0.54 with 9%. Even fitted, the lab's Flow chains stay under real players' (55-63 at 300 moves against 75-98).
- [K, E1] `docs/run-analysis-2026-10-13.md`. The talent lab bot ends 82% of runs at the edge. On v0.6-v0.7, "Caught by the dark" is the reason on 139 of 859 human runs (16%). Versions differ, so this is a lead, not a finding. [I]

### Inferences
- [I] Bot floor protocol per version. Export the live gap distribution per tier (moves and gaps already in the payload; `hesitations` and `longest_gap` too), run `balance_sim` with `--gaps-file` per tier on 20 fixed seeds per class, and compute the same hazard table. Store with a `bot` flag and the version.
- [I] Read the overlay three ways. Human hazard > 2× bot at k: a warning or reading problem (pillar "dying without warning is not"). Both high: a number spike. Human hazard < bot: players use something the bot does not (potions, retreat, talents), which is good.
- [I] The bot is also the only way to sweep a knob over many values. Humans then test two settings picked from the sweep (Q6).

## Q5. What the payload can and cannot measure

### Takeaway
It measures where and why a run ended, per-world effort and per-elite pressure well. It cannot see what happened between elites, how close the edge came over time, whether a warning reached the player, sessions, quits that close the tab, or how hard it felt.

### Cited findings (all [K, E1], from `scripts/ui/run_upload.gd`, `scripts/ui/run_log.gd`, `server/api/run.js`, `server/schema.sql`)
- Columns. `at`, `player`, `version`, `depth`, `reached`, `world`, `reason`, `won`, `endless`, `level`, `run_no`, `seconds`, `moves`, `suspect`, and `data` (jsonb, everything sent).
- In `data`. `foe`, `resumed_from`, `killed_before`, `tier`, `shuffle`, stats (hp, atk, mag, def), kills, elites, bosses, chests, traps, best chain and combo, gold, wood, stone, xp, xp lost to the cap, `lost_xp`, belt cost, bank at start, upgrades, talents, rows, signs, items, achievements, device and phone vitals, start seed, lifetime stats, and the run log text.
- From `RunLog.stats()`. `seconds`, `paused`, `busy`, `waiting`, `moves`, `rejected`, `matches`, `hesitations` (gaps ≥ 3 s), `longest_gap`, hits, hurt, blocked, `end_hp`, `lowest_hp`, `edge_seconds` (danger above 0.5), `low_hp_seconds`, traps sprung and kits (spent, wanted, short, held), potions (packed, found, used, per-use time, HP and foe, refused, swapped, left behind), campfires, and `worlds` (per world: start encounter, lap, seconds, moves, hurt, disarmed, sprung).
- `fights`. One record per elite and boss fight: `at`, `seconds`, `lead` and `lead_low` (px ahead of the edge), `edge_seconds`, `start_hp`, `hero_hp`, `lowest_hp`, moves, attack moves, dry seconds, blows, hits, hurt, blocked, potions and their times, enraged, braced, `end` (killed or not) and `foe_left`. Oldest fights are dropped if the body passes 46 KB (`SEND_MOST`).
- The run is posted on `run_banked`. A run whose page is killed is resumed from a checkpoint (`RunCheckpoint`, `Session`); a run abandoned by closing the tab is never posted. `Session` already records whether the page closed in the usual way (`matchrpg.closed`).
- HP is sampled every 15 s into a text line (`HP_SAMPLE`). The last 20 s of events go into the text log (`LAST_SECONDS`).

### Missing events and the cheapest way to add each

| # | Missing | Why it matters | Cheapest way | Cost |
|---|---|---|---|---|
| A1 | Session id and run index in session | Time to retry, runs per sitting, quits after a bad run | A UUID in `sessionStorage` at page load (the `Session` JS already wraps storage); send `session`, `session_run`, and `since_last_run_s` | S |
| A2 | Timeline of every encounter | Hazard and time-per-encounter for normal fights, traps, chests, not only elites | In `RunLog`, append `[n, kind, t_start, t_end, lead_start, hurt]` per encounter as int arrays; 180 rows of about 20 bytes fit inside `SEND_MOST` | S |
| A3 | Edge lead over time | The pressure curve inside a run, and whether `EDGE_MERCY` engages | Sample `lead` (px) every 5 s into an int array next to the HP samples | S |
| A4 | Warnings shown vs reacted | Tests the pillar that warnings must reach the board | On each warning (edge danger cue, trap telegraph, boss move, enrage) count `shown`, and `reacted` if a relevant move or potion follows within 2 s; send `{warning_id: [shown, reacted, median_ms]}` | M |
| A5 | Quit mid-run (tab closed) | King's time to abandon; today these runs vanish | On next launch, if the note says a run was on and `matchrpg.closed` was set, post a small row with `reason = "abandoned"`, the checkpoint depth and play seconds | S |
| A6 | Felt difficulty | Perceived vs actual difficulty, per world | One tap 1-7 on the results screen, shown on 1 run in 3; optional one tap at the "World cleared" pause | S |
| A7 | Knob variant | A/B tests | Send `variant` and the knob values the run used | S |
| A8 | Clock used | The tier's hidden clock may change between versions | Send `TierDefs.CLOCK[tier]` as `clock` | S |

## Q6. Playtest protocol: 5 testers plus 21 live players

### Takeaway
Use the 5 testers for "why" (felt difficulty per world, did they see the death coming) and the live data for "how often" (hazard, learning). Test knobs with a per-run switchback inside players, players as the unit of analysis, a fixed length, and tier held fixed or stratified.

### After a 3-minute run (results screen, 20-30 s, testers every run, live players 1 in 3)
1. "How hard was that run?" 1 (far too easy) to 7 (far too hard), 4 = about right. Valve's 1-7 format [HG08].
2. "Did you see your death coming?" Yes / Only just / No. This is the pillar test and needs no other instrument.
3. "What ended it?" The dark / the enemy / I gave up / not sure. Compare with `reason`: a player who answers "the enemy" when the payload says "Caught by the dark" did not read the edge.
4. Testers only, once per session. "Your fault, the game's, or luck?" (Juul, [HG08]) and draw the interest curve over worlds 1-5 [HG08].

### Felt difficulty per world
- [I] One tap at the "World cleared" pause (it already exists and does not cost play time) plus the results-screen item, which counts for the world the run ended in. Chart median rating per world against hazard per world. A world rated 6-7 with low hazard has a clarity problem; a world rated 3 with high hazard means players accept the boss wall.

### A/B a knob with 21 players
- Between-player (each player gets A or B for the whole test). [I, E1 arithmetic] Using the live variance (between-player SD of story depth about 500 m, within-player SD 1,258 m) and 30 runs per player, the SD of a player's mean depth is about 550 m. Lehr's rule n = 16 s²/d² per group for 80% power at two-sided 5% gives d = 4 · 550 / √10 ≈ 700 m with 10 players per arm. Too coarse, and the heavy players land in one arm by chance. Lehr's rule: https://jhanley.biostat.mcgill.ca/c607/ch07/16_s_sq_over_d_sq.pdf [V, E1]
- Within-player switchback (the knob flips per run by a seeded coin on `run_no`). [I, E1 arithmetic] Per-player difference SD = 1,258 · √(2/m) for m runs per arm. Paired rule n = 8 s²/d². With 10 active players and m = 10, d ≈ 500 m; with m = 20, d ≈ 360 m. Switchbacks trade power for freedom from carryover; DoorDash notes they have few independent units and low power, so pick a lower-noise metric. https://careersatdoordash.com/?p=11043 , https://careersatdoordash.com/?p=5557 [V, E2]
- [I] Better metrics than depth. Hazard at the targeted encounter (binary per run that reaches it), `edge_seconds` per minute, `low_hp_seconds`, per-fight `edge_seconds`. These have far lower noise than depth for a knob such as `EDGE_MERCY` or `ELITE_SCROLL`.
- [I] Pace-based DDA interaction. A scroll knob changes pace, and pace moves the tier and its clock. Freeze tier changes for the test window or analyse within tier (gold and diamond hold 89% of runs). Say which DDA (pacing via the tier clock) in the write-up.
- [I] Analysis. One difference per player, then a sign test or paired t across players, or a wild cluster bootstrap on run rows (Cameron et al.). Never a t-test on runs as if independent.
- [I] Stopping rule. Fix the length (for example 14 days or 20 runs per arm per player, whichever comes first) before starting. Peeking and stopping on a good day inflates false positives [HG08].
- [I] Minimum detectable effect, rule of thumb for this player base. Expect to detect only changes of about a quarter of a world in depth, or about 10 points of hazard at a boss with 150+ runs at risk per arm. Smaller tuning belongs to the bot sweep.

## Pattern cards

### M1. Hazard by encounter (survival by depth)
- Lineage. Actuarial life tables -> Kaplan and Meier's estimator (1958) -> churn per level in mobile games (King Level 65; Bertens et al. 2017) -> King's competing pass and abandon times (Reguera et al. 2020). Why. Run-based games end each attempt at a stage, which is exactly a life ending at an age.
- Feeling it protects. Challenge without unfair walls. Shows the world sawtooth and where a boss is a wall.
- Mechanism. h(k) = runs ending at encounter k / runs reaching k; S(k) = Π(1 − h(j)); player-bootstrap 95% band; flag h(k) ≥ 2× world median of normal encounters.
- Works with many runs per stage. Breaks past the depth where fewer than 10 players or 30 runs are at risk.
- Evidence. [V, E1] Bertens, Periáñez, Reguera; [K, E1] boss hazards 0.37, 0.30, 0.42.
- Cost S (SQL or Python on `reached`, `won`, `resumed_from`). Knobs. Flag ratio, minimum at risk.
- MatchRPG. Dashboard chart D1 and D2; split by version, tier and bot.

### M2. Player-clustered intervals and two weightings
- Lineage. Cluster-robust inference in econometrics -> wild cluster bootstrap for few clusters (Cameron, Gelbach, Miller 2008). Why. Runs from one player are not independent.
- Feeling it protects. None directly; it protects decisions from one heavy player's taste.
- Mechanism. Resample players with replacement, recompute the metric, take the 2.5 and 97.5 percentiles. Show run-weighted and player-weighted values side by side.
- Works from about 10 players. Breaks below 5 clusters.
- Evidence. [V, E1] Cameron et al.; [K, E1] top 5 players = 65% of runs.
- Cost S. Knobs. Number of resamples (2,000).
- MatchRPG. Every chart's band.

### M3. Run-index learning curve, normalised per player
- Lineage. Power law of practice -> Heathcote 2000 (exponential per individual) -> Stafford and Dewar 2014 (854,064 game players).
- Feeling it measures. Competence growth; whether the run-5 player feels progress.
- Mechanism. x = story run index; y = depth or world reached; cohort by total runs; per-player curve divided by own plateau; per-player fit a − b·e^(−n/τ), report median τ.
- Works with 10+ runs per player. Breaks when meta-progression is the real driver (split by hero level).
- Evidence. [V, E1] Heathcote, Stafford and Dewar; [K, E1] 441 m, 1,310 m, 1,774 m by run bucket.
- Cost S. Knobs. Plateau window, bucket edges.
- MatchRPG. Chart D4.

### M4. Within-player switchback A/B
- Lineage. Crossover trials -> marketplace switchbacks (DoorDash 2019). Why. Few units, so each unit must see both arms.
- Feeling it protects. Avoids shipping a change that felt better to two people.
- Mechanism. Knob value = hash(player, run_no) mod 2; one mean difference per player; sign test or paired t across players; fixed length.
- Works for in-run knobs with no carryover (scroll, mercy, trap timing). Breaks for meta knobs (town costs, talents) that carry over, and when the knob moves the tier.
- Evidence. [V, E2] DoorDash; [I, E1] MDE about 360-500 m vs 700 m between players.
- Cost S (A7 plus a flag). Knobs. Runs per arm, metric.
- MatchRPG. First candidates `EDGE_MERCY` and `ELITE_SCROLL`, metric `edge_seconds` per minute and boss hazard.

### M5. Bot floor overlay
- Lineage. Automated playtesting -> King's imitation-learning agent (Gudmundsson 2018) -> Hearthguard's `sim_bot` [HG08] -> MatchRPG `balance_sim --gaps-file`.
- Feeling it protects. "Dying without warning is not" (finds deaths that only humans suffer).
- Mechanism. Same hazard table from bot runs at the human gap distribution per tier; ratio human/bot per encounter.
- Works when the bot's pace matches humans. Breaks on choices the bot does not model (potions, retreat).
- Evidence. [V, E1/E2] King; [K, E1] lab fitted to 0.46 and 0.54 moves per second.
- Cost S to M. Knobs. Seeds, gap file, class mix.
- MatchRPG. Overlay on D1 and D2.

### M6. Warning shown vs reacted
- Lineage. Telegraph (glossary) -> TRUE's pairing of event logs with context (Kim et al. 2008, in [HG08]). New here as a counter.
- Feeling it protects. Fair pressure; the hero dies with warning.
- Mechanism. Per warning id, shown count, reacted within 2 s, median reaction ms; deaths with no warning shown in the last 5 s.
- Works when the "relevant reaction" is well defined (a potion, an attack move during a boss move). Breaks for warnings with no clear response.
- Evidence. [I]; pillar in MatchRPG `CLAUDE.md` [K].
- Cost M. Knobs. Reaction window.
- MatchRPG. Chart D6.

### M7. Session-scoped abandon and retry
- Lineage. King's time to abandon and time to pass ([HG08] P2) -> run-based retry loops. Here adapted with a session id.
- Feeling it measures. The "one more run" pull vs frustration after a bad death.
- Mechanism. Time to retry = `at` of next run minus end of this run within a session; P(session ends | run ended at encounter k); abandoned runs from A5.
- Works for many short sessions. Breaks when real life ends sessions (sample size helps).
- Evidence. [V, E2] King via [HG08]; [I].
- Cost S (A1, A5). Knobs. Session gap cut-off (for example 30 min).
- MatchRPG. Chart D7.

### M8. Sampled one-tap felt difficulty
- Lineage. Valve's 1-7 per-enemy item -> [HG08] campfire item -> here sampled on live players.
- Feeling it measures. Perceived difficulty against actual difficulty.
- Mechanism. 1-7 on 1 run in 3 at the results screen and at "World cleared"; median per world against hazard per world.
- Works with a stable prompt. Breaks if shown every run (fatigue) or after wins only.
- Evidence. [V, E2] Valve via [HG08]; [I] sampling rate.
- Cost S. Knobs. Sampling rate, wording.
- MatchRPG. Chart D8.

## Recommended dashboard (8 charts, story runs unless stated)

Common filters: version, tier, platform (`device`), bot flag. Every band is a 2,000-sample player bootstrap. Hide any cell with fewer than 3 players or 30 runs.

| # | Chart | Exact definition | Needs |
|---|---|---|---|
| D1 | Survival by encounter | S(k) = Π_{j≤k}(1 − d_j/n_j) for k = 1..180. d_j = runs with `reached` = j − 1 and `won` false; n_j = runs with `reached` ≥ j − 1 that entered at or before j (resumed runs enter at their resume encounter); wins censored at 180. Lines per version; dashed bot line | now |
| D2 | Hazard by encounter | h(k) = d_k / n_k as bars, elites and bosses coloured, 95% band; flag h(k) ≥ 2× median of normal encounters in the world | now (A2 adds normals in detail) |
| D3 | End cause by world | For runs ending in world w, share by cause class: dark (`reason` = "Caught by the dark"), elite, boss, normal enemy (from `foe` and slot), retreat, abandoned (A5) | now, A5 |
| D4 | Learning curve | Median `world` reached by story run index n (from `runs_load.nth`) for players with 20+ story runs, n = 1..30; second panel per-player normalised depth (depth / own median over last 10 runs); label players per point | now |
| D5 | Attempts to first boss kill | For each world boss b, per player the story run index of the first run with `reached` ≥ boss encounter; plot median and IQR across players, and the share of players who have it | now |
| D6 | Pressure inside the run | Per world, median `edge_seconds` / world `seconds` (now from run totals and fight records), and once A3 lands the median lead (px) curve over play seconds; deaths with no warning in the last 5 s (A4) | now, A3, A4 |
| D7 | Retry and abandon | Median time to retry by end encounter bucket; P(session ends after this run) by end cause | A1, A5 |
| D8 | Felt vs measured | Median 1-7 rating per world (x = world) against D2's world hazard; points sized by players | A6 |

## Glossary additions
| Term | Meaning | Source |
|---|---|---|
| Hazard (per encounter) | Share of runs that reach a stage and end there. Runs are the denominator. | survival analysis; this note |
| Survival curve (by depth) | Share of runs still alive after each stage, the product of (1 − hazard). | Kaplan and Meier 1958 |
| Censored run | A run whose end is not a failure at that stage (a win, a resume). It leaves the risk set without counting. | survival analysis |
| Restricted mean depth | Area under the survival curve up to a fixed stage. One number for A/B. | RMST; Khan 2020 |
| Switchback test | A/B where the setting flips per run inside each player. | DoorDash 2019 |
| Minimum detectable effect | The smallest change a test can find with 80% power at 5%. | Lehr 1992 |
| Player bootstrap | Interval from resampling players, not runs. | Cameron et al. 2008 |

## Sources
- [HG08] `studies/curves-hearthguard/notes/08-measurement-playtest.md`
- Darley, Business of Software: https://businessofsoftware.org/talks/how-to-make-sense-of-big-data/
- AP via MarketBeat, May 2025: https://www.marketbeat.com/articles/how-candy-crush-uses-ai-to-keep-players-coming-back-to-its-puzzles-2025-05-11
- Reguera et al. 2020, Scientific Reports: https://pmc.ncbi.nlm.nih.gov/articles/PMC7058085 ; arXiv: https://arxiv.org/abs/1911.01864
- Gudmundsson et al. 2018: https://www.gwern.net/doc/reinforcement-learning/imitation-learning/2018-gudmundsson.pdf ; https://koaning.io/posts/playtesting
- King AI Labs claim: https://wnhub.io/news/Generative_AI/item-43934
- StS2 Neow Dispatch coverage (403 on fetch): https://gamegeeker.com/fr/news/slay-the-spire-2-may-neows-news-update?market=FR
- StS2 launch week: https://gamingbolt.com/slay-the-spire-2-sells-3-million-copies-in-first-week-over-25-million-runs-recorded
- MetaBot: https://metabot.gg/en/slay-the-spire-2/classes/win-rate ; BrokenBuilds: https://brokenbuilds.gg/slay-the-spire-2/guides/slay-the-spire-2-meta-snapshot-v0-102-0
- Dead Cells privacy: https://dead-cells.com/privacy
- Kaplan-Meier: https://en.wikipedia.org/wiki/Kaplan%E2%80%93Meier_estimator
- Bertens et al.: https://arxiv.org/abs/1710.02262 ; Periáñez et al.: https://arxiv.org/abs/1710.02264 ; Khan: https://arxiv.org/abs/2006.15735
- Stafford and Dewar 2014: https://eprints.whiterose.ac.uk/id/eprint/83582/
- Heathcote et al. 2000: https://link.springer.com/article/10.3758/BF03196105 ; 2011 review: https://dx.doi.org/10.3758/s13423-011-0076-y
- Cameron, Gelbach, Miller 2008: https://www.nber.org/papers/t0344
- Lehr's rule: https://jhanley.biostat.mcgill.ca/c607/ch07/16_s_sq_over_d_sq.pdf
- DoorDash switchbacks: https://careersatdoordash.com/?p=11043 ; https://careersatdoordash.com/?p=5557
- MatchRPG [K]: `scripts/ui/run_upload.gd`, `scripts/ui/run_log.gd`, `scripts/core/session.gd`, `scripts/runner/runner.gd`, `server/api/run.js`, `server/schema.sql`, `dev/balance_sim.gd`, `dev/runs_load.py`, `docs/flow-balance-2026-11-04.md`, `docs/run-analysis-2026-10-13.md`; player data `matchrpg-runs-v06-v07` (aggregates computed by researcher 7, script in the session scratchpad).
