# 07. Papers applied to MatchRPG

Researcher 5. Theory and papers, used only where they explain a case in MatchRPG's twins or its telemetry.

Not repeated here (already in Curves #1, cite from there): Xue et al. 2017 (EA seed DDA, +4.4% to +7.9% rounds,
the (level, trial) churn state), Cox et al. 2012 (Bejeweled timed vs untimed, time pressure raised immersion),
Klarkowski et al. 2016 (overload beats boredom), Allart et al. 2017 (survival analysis on Ubisoft telemetry),
Denisova & Cairns 2015 (placebo difficulty), Hunicke's Hamlet, Booth's director. See
`studies/curves-hearthguard/notes/06-papers-applied.md` and `00a-glossary-theory.md`.

Kingsfoil numbers below marked [K, E1] come from a quick aggregate of `matchrpg-runs-v06-v07` (859 runs, 21 players).
Agent 0b owns the full analysis. These are aggregates only, every published cell has 3 or more players, and the
bucket of career runs 64+ (2 players) is left out.

Proven vs suggestive, in one table:

| Claim | Status | Paper |
|---|---|---|
| Scores rise with practice for 100+ plays, and spacing practice helps a little (d = 0.11) | Proven at scale, one game | Stafford & Dewar 2014 |
| Players who play more per week end up more skilled even though each game teaches less | Proven at scale, one game | Huang et al. 2013 |
| A bot trained on human moves predicts match-3 level pass rate to 4.0% MAE | Proven, vendor's own data | Gudmundsson et al. 2018 |
| Hard levels drive churn mostly in early, less persistent players; later populations are survivors | Proven correlation, model fit | Roohi et al. 2020 |
| Win streaks reduce churn and being outmatched raises it | Proven correlation, competitive game | Kang et al. 2024 |
| Near misses are the most frustrating outcome and raise the urge to keep playing | Proven in lab, 60 players | Larche et al. 2017 |
| Adaptive Tetris speed produces more flow than too slow or too fast | Proven only against extreme conditions | Keller & Bless 2008 |
| Randomness before the decision lowers satisfaction | Suggestive, 18 players, one card game | Zhang et al. 2021 |
| Meta-progression changes motivation in roguelites | No peer-reviewed evidence found | gap |

---

## Q1. Pace-based DDA. What does Tetris research say about the tier clock?

### Takeaway
MatchRPG's tier clock is the Keller & Bless paradigm shipped as a feature. They adapted Tetris drop speed to the
player and got more flow than fixed slow or fixed fast speed. But they only beat extremes, and later work says a
slight overload is better than an exact match. The newest EEG work (2024) finds slow Tetris less engaging than medium
or fast, with no difference between medium and fast. So the clock's job is mainly to stop bronze and silver players
facing an impossible pace, not to hit a precise speed. Our own data adds one fact the papers do not have. Moves per
second barely change with practice, so the tier measures a stable trait, not skill growth.

In the glossary's words, the tier clock is DDA that changes tempo (it scales every timer by `TierDefs.CLOCK`). It is
not a pacing director, because it changes how fast threats act, not when or how many arrive. Closest glossary kind is
stat DDA applied to tempo. See "Glossary additions".

### Cited findings
- Keller & Bless, "Flow and regulatory compatibility", Personality and Social Psychology Bulletin 34(2), 196-209,
  2008. https://pubmed.ncbi.nlm.nih.gov/18212330/ [V, E1]
  - Three Tetris conditions. Boredom (very slow drop regardless of skill), overload (fast base speed that kept
    rising), adaptive (speed follows performance). Described in Baumann, Lürig & Engeser 2016,
    https://www.uni-trier.de/fileadmin/fb1/prof/PSY/PGA/unterlagen/BaumannL%C3%BCrigEngeser_Flow_MOEM_2016.pdf [V, E1]
  - Adaptive gave more flow, more enjoyment, and shorter felt time than both other conditions.
  - Critique in the same secondary sources. Balance was only tested against strong overload and strong boredom, and
    later work finds slight overload helps flow. [V, E1]
  - Sample sizes and the exact speed rule not read (full text paywalled; core.ac.uk mirror returned 403). [U]
- Natalizio et al., J. Neural Engineering 21, 016014, 2024. Real-time EEG engagement estimator tested on Tetris at
  slow, medium and fast speeds. Felt and estimated engagement were higher at medium and fast than slow, and medium and
  fast did not differ. https://iris.polito.it/retrieve/2dfab91e-6177-4252-be23-f4bffdc0c9c4/Natalizio_2024_J._Neural_Eng._21_016014.pdf [V, E1] (abstract level; N not read)
- Frontiers in Human Neuroscience 2025, 30 participants, Tetris Easy, Hard and Ramp. Workload raised cognitive load
  and stress only up to a threshold. https://www.frontiersin.org/articles/10.3389/fnhum.2025.1459653/full [V, E1] (abstract level)
- Lindstedt & Gray, "Distinguishing experts from novices by the Mind's Hand and Mind's Eye", Cognitive Psychology
  109, 2019, doi 10.1016/j.cogpsych.2018.11.003. 240 players, one hour each, 39 features per piece across up to 16
  speed levels. Three principal components separated experts from novices using only level-1 data. Validated at a
  Tetris tournament. https://read.qxmd.com/read/30543908/distinguishing-experts-from-novices-by-the-mind-s-hand-and-mind-s-eye [V, E1]
- Sweeny lab (UC Riverside), Tetris at low, adaptive or high difficulty while waiting for bad news. Too slow bored,
  too fast frustrated, moderate challenge cut felt worry. Reported N is 309 (Mental Floss) or 290 (Vice).
  https://www.newswise.com/articles/gaming-research-may-unlock-secrets-of-‘flow’ [V, E3] (press only; paper not read)
- Cox et al. 2012 (in Curves #1 notes) found timed Bejeweled raised immersion with no score change. The match-3
  version of the same claim.

### Kingsfoil data
- Median moves per second on story runs by career run number (`run_no`) [K, E1]

  | Career runs | Story runs | Players | Median moves/s | Median depth (m) |
  |---|---|---|---|---|
  | 1 | 23 | 18 | 0.45 | 441 |
  | 2-3 | 34 | 15 | 0.46 | 441 |
  | 4-7 | 55 | 12 | 0.46 | 811 |
  | 8-15 | 108 | 11 | 0.48 | 1304 |
  | 16-31 | 188 | 10 | 0.46 | 1904 |
  | 32-63 | 148 | 10 | 0.44 | 2651 |

  A log-log fit across these six cells gives a moves/s exponent of about 0.00 and a depth exponent of about 0.51.
  Moves/s here is real moves over real seconds, so it is the player's own tempo, not the clock.

### Inferences
- [I] Moves per second is flat (0.44-0.48) while depth grows six-fold. In this data pace is a trait (how a person
  slides), not a skill that grows with runs. That is good for a placement metric, since the tier will not drift with
  learning. It also means the tier is not a skill rating. A quick, careless player lands in diamond. Lindstedt & Gray
  show the better expertise signal is a bundle of decision and perception features, and that it is readable from the
  first level.
- [I] Natalizio's flat medium-to-fast result suggests the gap between gold (1.1) and diamond (1.25) matters less to
  engagement than the gap between bronze (0.65) and silver (0.85). Only 14 of 859 runs were bronze [K], so the slow
  end is where any test would have too few players.
- [I] Keller & Bless only proved "adapted beats extreme". MatchRPG's clock aims at "the same per move", which the
  papers did not test. Slight overload (clock a little above the measured pace) has better support than exact match.

### Gaps
- No paper tests a tempo DDA that is placed between sessions and held fixed during the run, as MatchRPG's is. All
  Tetris DDA papers adapt inside a session.
- Keller & Bless N and speed rule unread.

---

## Q2. Learning across runs. Power law of practice, frequency and breaks

### Takeaway
Two very large datasets set the shape of a game learning curve. Stafford & Dewar (854,064 Axon players) show scores
rise with each play for 100 plays, and that the best players are already better on play 1. Huang et al. (3.2 million
Halo Reach players) show that more games per week beats fewer, even though each game teaches less, and that a 30-day
break costs about 10 matches. MatchRPG's depth curve is steeper than a skill curve should be (exponent about 0.5),
because depth mixes skill with meta-progression power. The papers give a rule for separating the two.

### Cited findings
- Stafford & Dewar, "Tracing the trajectory of skill learning with a very large sample of online game players",
  Psychological Science 25(2), 511-518, 2014 (online 2013). Postprint
  https://eprints.whiterose.ac.uk/id/eprint/83582/1/stafford_and_dewar_postprint.pdf, data and code
  https://github.com/tomstafford/axongame [V, E1]
  - 854,064 players, 14 March to 13 May 2012. Modal number of plays is 1.
  - Scores rise with each play up to 100 plays. Among the 45,672 who played 9+ times, grouping by best score shows
    the top groups score higher from the first plays.
  - Spacing. Of 21,575 players with 14+ plays, those who spread plays 1-10 over more than 24 hours scored 47,264 on
    plays 11-15, against 44,050 for those who massed them in 24 hours (t(20354) = 6.22, Cohen's d = 0.11).
  - Exploration. Variance in plays 1-5 correlates with later mean score, r = 0.59 (bootstrap null CI ±0.009).
  - Limits. A "player" is a machine id. Score in a 30-second reflex game, not a strategy game. Correlational.
- Huang, Zimmermann, Nagappan, Harrison, Phillips, "Mastering the art of war: how patterns of gameplay influence skill
  in Halo", CHI 2013, pp. 695-704. https://thomas-zimmermann.com/publications/files/huang-chi-2013.pdf [V, E1]
  - Seven months of games from 3.2 million players, skill as TrueSkill (hidden from players).
  - Per game, 4-8 games a week learned fastest. Over calendar time, players with more than 8 a week passed them.
    The 32-64 and 64+ groups started less skilled and improved fastest.
  - Breaks. The game before a break shows a skill drop (a loss). A 30-day break costs about 10 matches (about 3 hours)
    to recover. 60 days does not cost twice as much.
  - Survey. Players said they stop for boredom and life, rarely skill, and declining skill did not cut games played.
  - Limits. Competitive shooter, matchmade, hidden rating.

### Kingsfoil data
- Depth by career run number is in the Q1 table [K, E1]. Run 1 and runs 2-3 both have median 441 m, then depth
  roughly doubles every doubling of runs until 32-63 (2651 m). All 6 wins come at career run 32 or later [K, E1].
- Runs per player in the window. Median 13, 10 players with 20+ runs, 8 with 50+ [K, E1].

### Inferences
- [I] A power-law skill curve usually has an exponent well below 0.5 on score. MatchRPG's 0.51 on depth, with flat
  pace, says much of the gain is power (hero level, town, talents) and route knowledge, not hand speed. To separate
  them, regress depth on run number and on starting hero level (`data.start.level`) together. Agent 0b has the data.
- [I] The flat 441 m over runs 1-3 is the onboarding plateau. Stafford's "best players are better from play 1" means
  a placing run could be shorter. Combined with Lindstedt & Gray, a first-run tier guess from the first 60 seconds of
  features is plausible.
- [I] Huang's break result supports the tier rule "down only after 5 slow runs". A player back after a break is
  slow for a few runs (Halo needed about 10 matches) and the rule keeps them from being demoted on rust alone.
- [I] MatchRPG is played in many runs a day, which is massed practice. Stafford's spacing effect is small (d = 0.11),
  so do not design against it. It is not a reason for energy systems.

### Gaps
- No paper on learning curves in a game with strong meta-progression, where skill and power grow together.

---

## Q3. Difficulty prediction in match-3 and puzzle games

### Takeaway
King, Rovio and Tactile all predict level difficulty with bots before players see a level, and all calibrate the bot
against real player pass rates. The numbers are good enough to replace most playtesting for level-based games (King
reports 4.0% mean absolute error and under a minute per level, against 7 days of playtests per 15 levels).
MatchRPG already has bots (`dev/balance_sim.gd`, `dev/career_lab.py`). The transferable rule is the calibration step,
not the network.

### Cited findings
- Gudmundsson et al. (King), "Human-like playtesting with deep learning", IEEE CIG 2018, doi 10.1109/CIG.2018.8490442.
  https://www.gwern.net/doc/reinforcement-learning/imitation-learning/2018-gudmundsson.pdf [V, E1]
  - A CNN learns the most common human move from player data in Candy Crush Saga (CCS) and Soda Saga (CCSS).
    Trained on 800 levels, tested on 200 unseen ones.
  - Player success rate is modelled from agent success rate by binomial regression on the logit scale, with board
    features as covariates and random effects for overdispersion.
  - MAE of predicted player success rate. CNN with 1,000 attempts per level 4.0% (CCS), 5.7% (CCSS). CNN with 100
    attempts 4.9%. MCTS with 100 attempts 5.4%, but MCTS stays inside its prediction band (4% out of band against
    11-24% for CNN), so it copes better with new game elements.
  - Used on 1,000+ new CCS levels over a year. Under a minute per level, against 7 days of playtests per 15-level
    episode.
  - Limits. Vendor data. Real player rates were hidden from the plots. Level-based, no real-time pressure.
- Roohi, Relas, Takatalo, Heiskanen, Hämäläinen, "Predicting Game Difficulty and Churn Without Players", CHI PLAY 2020.
  https://arxiv.org/abs/2008.12937 [V, E1]
  - Angry Birds Dream Blast, 168 levels, 95,266 players. Churn is no play for 7 days.
  - Pass rate against churn rate. Spearman r = -0.144 overall, but r = -0.586 when churn counts only players who
    quit without beating the level.
  - A deep RL agent plays each level. A population model with skill, persistence and boredom carries players across
    levels, and the less skilled and less persistent leave first. Validation MAE for churn fell from 0.0087 to 0.0061
    with the population model. Pass-rate MAE stayed about 0.11.
  - Low pass rate causes less churn in later levels, because the remaining players are the persistent ones.
- Kristensen, Valdivia, Burelli, "Statistical Modelling of Level Difficulty in Puzzle Games", IEEE CoG 2021.
  https://arxiv.org/html/2107.03305v2 [V, E1]
  - Lily's Garden (Tactile), 4,000 levels, about 350,000 successful attempts per level.
  - Moves to finish follow a negative binomial for about 85% of levels. Predicted and observed completion correlate
    at 0.83.
  - Designer rule. Completion changes about 2% per move of limit, and removing moves changes it more than adding.
- Kristensen & Burelli, "Difficulty Modelling in Mobile Puzzle Games", 2024, doi 10.1155/2024/5592373.
  https://arxiv.org/abs/2401.17436v1 [V, E1] Models trained on cohort statistics plus simulated data were the most
  accurate in all scenarios. (abstract level)
- Lily's Garden RL agent, arXiv 2306.14626. The best single predictor of player completion was the moves the agent's
  best ~5% of runs needed. https://www.emergentmind.com/papers/2306.14626 [V, E1] (abstract level)

### Kingsfoil data
- Runs by world reached. 0: 410, 1: 215, 2: 127, 3: 58, 4: 49 [K, E1, CONTEXT]. This is the per-stage
  survival curve to calibrate a bot against.

### Inferences
- [I] MatchRPG has no levels, but each world's elites (encounters 12, 24) and boss (36) are fixed stages with a
  win rate per attempt. Gudmundsson's model is cheap to copy. Log the bot's clear rate per stage from `balance_sim`,
  log the players' clear rate per stage from telemetry, and fit one logit line. After that, a balance change can be
  scored by the bot alone. With 21 players the fit is rough but it gets better each version.
- [I] Roohi's split matters for reading our funnel. Counting all runs, a hard world looks like it causes few
  session ends. Counting only players who stopped without ever clearing it, the link is much stronger. And the
  players left in worlds 3-4 are survivors, so a world 3 wall that real data calls "fine" may still be too hard for a
  new player.
- [I] The "best 5% of agent runs" result fits MatchRPG's pace tiers. A diamond player is close to a bot's best runs,
  a bronze player is not. Calibrate per tier, not overall.

### Gaps
- No published difficulty model for real-time match-3 with a scrolling clock. All of the above are turn-based level
  puzzles.
- No 2025-2026 match-3 difficulty paper found in budget. A 2026 GAT vs BERT Candy Crush preprint is listed at
  https://tldr.takara.ai/p/2607.11501 but was not read. [U]

---

## Q4. Churn, failure streaks and near misses

### Takeaway
The large-sample evidence says winning streaks keep players and being outmatched loses them, and that a near miss
is the most frustrating outcome and the one that most makes players want another go. In MatchRPG's own data, the
chance a session ends after a story run does not rise with the number of runs since the last personal best. Our
sample is small (14 players), but it fits Huang's survey. Players stop for boredom and life more than for losing.

### Cited findings
- Kang, Suh, Kim, "Match experiences affect interest: Impacts of matchmaking and performance on churn in a
  competitive game", Heliyon 10(3), e24891, February 2024. https://visualize.jove.com/38318006 [V, E1]
  - Everybody's Marble, 42 days of server logs, about 6 million matches, 262,000+ players.
  - Frequent and consecutive wins lower churn. Being matched with stronger opponents raises churn. Being matched with
    weaker opponents lowers churn more than a fair match does. The effect of losing streaks differs by skill level.
  - Limits. Competitive, matchmade. Full text and streak breakdown not read.
- Larche, Musielak, Dixon, "The Candy Crush Sweet Tooth", Journal of Gambling Studies 33(2), 599-615, 2017.
  https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5445157/ [V, E1]
  - 60 avid Candy Crush players, 30 minutes, heart rate, skin conductance and self-report.
  - Near misses raised heart rate and felt arousal more than losses. They were rated the most frustrating outcome
    and gave the strongest urge to keep playing, stronger than wins.
  - Limits. Lab, avid players only, a gambling-research frame.
- Huang et al. 2013 (Q2). Skill drop in the game before a break, but players report boredom as the main reason to stop.
- Xue et al. 2017 (Curves #1 notes). A small difficulty rise at level 21 caused a large drop. Population flat above
  level 80.

### Kingsfoil data
- Share of story runs followed by a gap of 30+ minutes or the end of the window ("session end") [K, E1]

  | After a story run that was | Runs | Players | Session ends |
  |---|---|---|---|
  | a new personal best depth | 69 | 14 | 25% |
  | not a personal best | 598 | 14 | 27% |
  | 1 run since best | 46 | 11 | 30% |
  | 2-5 runs since best | 98 | 9 | 21% |
  | 6+ runs since best | 454 | 10 | 28% |
  | a win | 6 | 6 | 50% |

  The end of the data window counts as a session end, which pushes all rates up a little. Small sample.

### Inferences
- [I] No losing-streak cliff in MatchRPG so far. A run that is not a best ends the session 27% of the time, the same
  as a best. With 3-minute runs and carried rewards, failure is cheap enough that streaks do not push players out.
  Re-check when there are 50+ players.
- [I] A win ends the session half the time (3 of 6). That is the clear point of a story game, and it is where
  endless has to hook the player. Kang's win-streak finding says the first endless laps should be winnable.
- [I] Kang's "weaker opponents keep players more than fair ones" is the closest field evidence for MatchRPG's clock
  choice. A clock set slightly below what a player can handle is the retention-safe side. It conflicts with the
  "slight overload" flow result in Q1. Pick per tier, and test.
- [I] Larche explains why "Slain by Ogre King" at 1316 m next to a best of 1400 m pulls players back in. The death
  screen already reports depth. Showing the distance to the best or to the next boss is a near-miss cue. It is
  cheap, and it is the mechanism slot machines exploit. Use it only for real distances, never manufactured ones.

### Gaps
- No single-player puzzle paper on fail streaks with numbers was found. The escholarship dissertation with a
  "Difficulty and Hopelessness" churn chapter (https://escholarship.org/content/qt6k3357qx/qt6k3357qx_noSplash_e2ae5fd978a8faedfecdb4cf93a7420e.pdf)
  was not read.

---

## Q5. Hidden adaptation, randomness and fairness

### Takeaway
MatchRPG hides two helpers (edge mercy and the clock behind the tier). Research on hidden adaptation is still
thin. The best field case (EA's seed DDA) stayed hidden on purpose, and lab work says players notice mid-play shifts.
Randomness research is thinner still. One 18-player study found randomness that changes the options before the
decision hurt satisfaction while randomness in outcomes did not. Its definitions differ from the board-game usage,
so read it with care.

### Cited findings
- Robertson, Cardona-Rivera, Young 2020, on invisible dynamic mechanics adjustment. Players notice mechanic shifts in
  real time, and the authors propose a way to keep changes unnoticed.
  https://qed.games.utah.edu/wp-content/uploads/sites/71/2025/07/robertson2020invisible.pdf [V, E1] (abstract level)
- Robb & Zhang 2022, performance-based DDA in a 2D game. No significant difference in enjoyment or flow.
  https://actaludologica.com/performance-based-dynamic-difficulty-adjustment-and-player-experience-in-a-2d-digital-game-a-controlled-experiment/ [V, E1]
  (already cited in Curves #1 glossary notes)
- A November 2025 preprint reports players value transparency and that hidden adjustment can cut trust.
  https://www.preprints.org/manuscript/202511.2251/v1/download [U, E1] (not peer reviewed; not read)
- Zhang, Monteiro, Liang, Ma, Baghaei, "Effect of Input-output Randomness on Gameplay Satisfaction in Collectable Card
  Games", 2021. https://arxiv.org/abs/2107.08437 [V, E1]
  - 18 college-age players, four conditions over four days, Latin square, about 15 minutes each.
  - "Input randomness" here means unknown mystery cards entering the hand. "Output randomness" means a card's effect
    is uncertain.
  - Conditions without input randomness scored 22.99 satisfaction against 21.84 with it, F(1,15) = 6.28,
    p = 0.024, partial eta squared 0.30. Output randomness had no effect (F(1,15) = 0.33). Interviews said the
    certain conditions left room for planning.
  - Limits. 18 players, one self-made game, preprint.
- Jensen, Dixen, Burelli, "Hades Again and Again", 2024. https://arxiv.org/abs/2401.14878 [V, E1]
  - 20 players, Hades, questionnaires, gameplay and heart rate.
  - Frustration tolerance did not correlate strongly with experience or behaviour. Deepest chamber reached plus
    heart rate correlated with felt competence at r > 0.7 (p < .001).

### Inferences
- [I] MatchRPG's tile drops are seen before the slide, which is input randomness in the board-game sense. In
  Zhang's sense they are closer to a known deck, because the tile set is fixed and visible. What Zhang calls input
  randomness (unknown things arriving in your options) is closest to MatchRPG's encounter draws and chest loot. The
  result is a hint, not a rule. Keep what a draw does readable on the board before it matters.
- [I] MatchRPG's tier is shown and the clock is hidden. That sits between Xue's fully hidden lever and a player-steered
  mode. Robertson's "players notice shifts in real time" is not a risk here, because the clock never changes inside a
  run. The tier mark tells the player the game is fitted to them, which by Denisova & Cairns' placebo result may do
  part of the clock's work for free.
- [I] Jensen et al. support using depth as a competence signal. Their deepest-chamber number is MatchRPG's depth.

### Gaps
- No peer-reviewed study on roguelite meta-progression and motivation turned up in two searches. A 2025 FDG paper
  defines "extra-run progression" as a category (https://dl.acm.org/doi/pdf/10.1145/3723498.3723721), and a Swedish
  thesis compares two meta-progression designs (https://his.diva-portal.org/smash/get/diva2:2072480/FULLTEXT01.pdf).
  Neither was read. Meta-progression claims in this study rest on designer statements and our own data.
- No study on players' views of rigged or seeded puzzle boards found in budget.

---

## Pattern cards

### P-1. Bot-to-player calibration line
- Lineage: King CNN agent (Gudmundsson 2018) -> Rovio population model (Roohi 2020) -> Tactile cohort plus
  simulation (Kristensen & Burelli 2024). Each step added real-player data to fix what bots miss.
- Feeling it produces. None directly. It lets the team tune walls without waiting for players.
- Mechanism. Per stage s (elite 12, elite 24, boss 36, per world), log bot clear rate b_s and player clear rate p_s
  per attempt. Fit logit(p_s) = a + k * logit(b_s), one line per tier. Predict a change by rerunning the bot only.
- Conditions. Works when the bot's mistakes are steady. Breaks when a new mechanic appears (King's CNN went out of
  band on new elements, MCTS did not). Retrain then.
- Evidence. [V, E1] Gudmundsson 2018, MAE 4.0%. Kristensen & Burelli 2024.
- Cost. S. Knobs are the bot's attempts per stage (100 vs 1,000 changed MAE from 4.9% to 4.0% at King).
- MatchRPG. `dev/balance_sim.gd` is the bot. Telemetry has world and fights per run. 15 stages x 4 tiers is too many
  cells for 21 players. Start with one line, all tiers.

### P-2. Read churn on non-finishers, and expect survivors
- Lineage: Xue 2017 (churn per level and trial) -> Roohi 2020 (churn without completing, persistence model).
- Feeling it guards. Challenge for those still in, without losing new players to the first wall.
- Mechanism. For each world w, churn_w = players whose last run ended in w and who never cleared w, over players
  who reached w. Read it next to clear rate per attempt. Expect later worlds to look easier than they are.
- Conditions. Needs a churn window (Roohi used 7 days) and enough players per world (3+ by our privacy rule).
- Evidence. [V, E1] Roohi 2020, r = -0.586 vs -0.144.
- Cost. S. Knob is the churn window.
- MatchRPG. Feed to agent 0b. World 0 to 1 is the likely cliff (410 vs 215 runs reach them).

### P-3. Hold the tier through rust
- Lineage: Huang 2013 (30-day break costs about 10 matches) -> MatchRPG's `tierAfter` (down one step only after 5
  slow runs).
- Feeling it protects. Competence on return.
- Mechanism. Promote at once, demote only after N slow runs in a row. N at or above the recovery length after a break.
- Conditions. Works when slow runs after a break are rust, not a lasting change. Breaks for players who switch
  device (touch to mouse changes pace).
- Evidence. [V, E1] Huang 2013 for recovery. MatchRPG's N = 5 is shorter than Halo's 10, but a run is not a match.
- Cost. S, already built. Knob is N.
- MatchRPG. Keep. Log days since previous run at each demotion to check.

### P-4. Honest near-miss line on the death screen
- Lineage: slot-machine near misses -> Larche 2017 in Candy Crush -> common in runners ("you beat 80% of your best").
- Feeling. Fiero on the next run. A strong pull to retry.
- Mechanism. On death show the real distance to the personal best and to the next boss. Never invent closeness.
- Conditions. Works when retry is cheap (MatchRPG, median run 177 s). Becomes a dark pattern if paired with paid
  continues or with fake numbers.
- Evidence. [V, E1] Larche 2017, 60 players, lab.
- Cost. S. Knob is when to show it (only within, say, 15% of best).
- MatchRPG. Ties to the pillar "warnings must reach the player". Check against the codex and the run summary
  already shown.

### P-5. Placement from early features, not only pace
- Lineage: Lindstedt & Gray 2019 (expertise readable at level 1 in Tetris) -> ranked placement matches.
- Feeling. Felt fairness, the first run already fits.
- Mechanism. Score the first run on a few features (moves/s, best chain, damage taken per encounter, encounters
  per minute) and seed the tier from it. Keep moves/s as the clock input.
- Conditions. Needs a few dozen players per tier to fit. Our moves/s is flat with practice, so it is a stable input,
  but it does not measure decision skill.
- Evidence. [V, E1] Lindstedt & Gray 2019, 240 players. [K, E1] flat moves/s.
- Cost. M. Knob is the feature weights.
- MatchRPG. Only if bronze and silver keep showing poor early runs. 95 of 859 runs are bronze or silver [K].

---

## Glossary additions
- Tempo DDA. DDA that scales how fast threats act (timers, scroll, attack speed) from measured player pace. A kind
  of stat DDA on tempo. MatchRPG's tier clock. Not a pacing director. (proposed)
- Power law of practice. Performance improves fast at first, then slower, following a power function of practice
  count. Newell & Rosenbloom 1981, tested at scale by Stafford & Dewar 2014.
- Spacing effect. The same practice spread over more time gives better later performance. Small in games
  (d = 0.11, Stafford & Dewar 2014).
- Near miss. A failure that ends close to success. More arousing and frustrating than a clear loss, and raises the
  urge to retry (Larche et al. 2017).
- Input / output randomness. Chance that changes the options before the player decides / chance that changes
  the result after. Usage differs between authors (Zhang et al. 2021 use input for unknown cards entering the hand).
- Survivor drift. Later stages are played by a filtered population of persistent players, so their win rates
  understate difficulty for a new player (Roohi et al. 2020).

## Sources
- Keller & Bless 2008. https://pubmed.ncbi.nlm.nih.gov/18212330/
- Baumann, Lürig & Engeser 2016. https://www.uni-trier.de/fileadmin/fb1/prof/PSY/PGA/unterlagen/BaumannL%C3%BCrigEngeser_Flow_MOEM_2016.pdf
- Natalizio et al. 2024. https://iris.polito.it/retrieve/2dfab91e-6177-4252-be23-f4bffdc0c9c4/Natalizio_2024_J._Neural_Eng._21_016014.pdf
- Tetris workload ramp 2025. https://www.frontiersin.org/articles/10.3389/fnhum.2025.1459653/full
- Lindstedt & Gray 2019. https://read.qxmd.com/read/30543908/distinguishing-experts-from-novices-by-the-mind-s-hand-and-mind-s-eye
- Sweeny lab press. https://www.newswise.com/articles/gaming-research-may-unlock-secrets-of-‘flow’
- Stafford & Dewar 2014. https://eprints.whiterose.ac.uk/id/eprint/83582/1/stafford_and_dewar_postprint.pdf
- Huang et al. 2013. https://thomas-zimmermann.com/publications/files/huang-chi-2013.pdf
- Gudmundsson et al. 2018. https://www.gwern.net/doc/reinforcement-learning/imitation-learning/2018-gudmundsson.pdf
- Roohi et al. 2020. https://arxiv.org/abs/2008.12937
- Kristensen, Valdivia, Burelli 2021. https://arxiv.org/html/2107.03305v2
- Kristensen & Burelli 2024. https://arxiv.org/abs/2401.17436v1
- Lily's Garden RL agent. https://www.emergentmind.com/papers/2306.14626
- Kang, Suh, Kim 2024. https://visualize.jove.com/38318006
- Larche, Musielak, Dixon 2017. https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5445157/
- Robertson, Cardona-Rivera, Young 2020. https://qed.games.utah.edu/wp-content/uploads/sites/71/2025/07/robertson2020invisible.pdf
- Robb & Zhang 2022. https://actaludologica.com/performance-based-dynamic-difficulty-adjustment-and-player-experience-in-a-2d-digital-game-a-controlled-experiment/
- Transparency preprint 2025. https://www.preprints.org/manuscript/202511.2251/v1/download
- Zhang et al. 2021. https://arxiv.org/abs/2107.08437
- Jensen, Dixen, Burelli 2024. https://arxiv.org/abs/2401.14878
- FDG 2025 roguelike taxonomy. https://dl.acm.org/doi/pdf/10.1145/3723498.3723721
- Meta-progression thesis. https://his.diva-portal.org/smash/get/diva2:2072480/FULLTEXT01.pdf
- Curves #1 papers note. `studies/curves-hearthguard/notes/06-papers-applied.md`
