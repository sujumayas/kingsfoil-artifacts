# 08. Session, platform and social conditions

Researcher 6. Angle: how MatchRPG's conditions (solo, phone browser, 3-minute runs many times a day, a board per version and tier, hidden-clock mastery tiers) shape its curves. Twins here are chosen by those conditions, not by genre. Hearthguard's notes already cover the L4D director, Celeste assists, Hades God Mode and Risk of Rain 2; this note does not repeat them.

MatchRPG rule under study ([K], `scripts/data/tier_defs.gd`, `server/api/_lib.js`, CLAUDE.md). This is a pacing DDA that changes the tempo of the dungeon from measured moves per second. It is not a pacing director.
- Pace = moves / seconds of a run. Runs under 30 s (`MIN_SECONDS`) do not count.
- Tier lines (`TIER_FROM`): bronze 0, silver 0.30, gold 0.40, diamond 0.50 moves/s. Clocks (`CLOCK`): 0.65, 0.85, 1.1, 1.25.
- New players play at silver, listed "unranked". The first run that counts places them, up or down (`PLACE_RUNS` 1).
- After that the tier is read from the median of the last 10 runs (`WINDOW`), once 5 runs count (`MIN_RUNS`). Up at once. Down one step only when that median is 0.02 under the line (`DROP`) and the last 5 runs in a row were under it (`DROP_RUNS`).
- A new major version (first two numbers) opens new boards. A returning player carries the tier they left with (`carriedTier`) and gets no placing run.
- Each version has one board per tier ("v0.7/gold"). Ranks' "All" tab lists every tier together, deepest first, each with its mark.
- The player sees the tier, an "i" that explains each tier's pace and how it is won and lost, and never the clock.

## Q1. How do short mobile sessions pace a run and a day?

### Takeaway
MatchRPG's run is shorter than the mobile median session, and players already chain runs. The day, not the run, is the unit to design for. Our own data shows a median of 2 runs per sitting and 3.5 runs per active day, with a median of 139 s between the end of one run and the start of the next. The fast-retry path matters more than anything a run does in minute 3.

### Cited findings
- GameAnalytics (vendor, flag): Q1 2024 global median session about 4.45 min, most genres 4 to 5 sessions a day. [V, E1 vendor] https://gamedevreports.substack.com/p/gameanalytics-benchmarks-in-mobile
- GameAnalytics 2025 report (vendor, flag): top-tier games average 8 to 9 min sessions, median-tier 5 to 6 min. [V, E1 vendor] https://investgame.net/wp-content/uploads/2025/02/2025-GameAnalytics-Mobile-Gaming-Benchmarks.pdf
- An AppFollow puzzle figure of about 40 min per session conflicts with GameAnalytics by a factor of 8. Treat as unreliable. [U, E4] https://appfollow.io/blog/mobile-game-analytics-with-ioana-hreninciuc
- Super Hexagon restarts in under a second, and Terry Cavanagh tuned the restart time on purpose. The music restarts at a random point. Engadget ties its iPhone-first launch to "play it quickly and restart a few times". [V, E2] https://www.engadget.com/2012-09-21-terry-cavanagh-goes-inside-super-hexagon.html ; review: https://www.videogamer.com/reviews/super-hexagon-review
- Apple's App Store editorial credits Super Hexagon with popularising "the ultra-quick restart time after failure" in mobile arcade games. [V, E3] https://apps.apple.com/nz/story/id1322079568
- Wordle: Josh Wardle kept one puzzle a day to create scarcity and keep play near "three minutes a day". One shared word made the social layer. [V, E2, secondary quote] https://en.wikipedia.org/wiki/Wordle ; https://time.com/6143715/wordle-sale-josh-wardle-interview
- Bejeweled Blitz: a 60-second run with a weekly leaderboard that resets every Tuesday. [V, E2] https://forums.battlefield.com/games/bejeweled/bejeweled-blitz/news/introducing-blitz-champions
- MatchRPG data, aggregates only, 21 players, 859 runs, v0.6 to v0.7 [K, E1]:
  - Runs per active player-day: median 3.5, p75 8, p90 16 (134 player-days).
  - Sittings (a break over 30 min starts a new one): 304 sittings, median 2 runs, p90 7.
  - Time from one run's end to the next run's start: median 139 s, p25 37 s. 36% of next runs start within 60 s, 63% within 10 min. This gap includes town, talents and menus.
  - Distinct days played per player: median 4, max 16. 13 players played on 3 or more days.
  - Story run median 177 s (from CONTEXT headline).

### Inferences
- [I] At a median of 177 s per run and 2 runs per sitting, a sitting lasts about 6 min plus menus, close to the GameAnalytics median session. The curve a player feels in one sitting is "run, short town stop, run". Two runs is where the interest curve of a sitting must peak.
- [I] The 139 s median gap is long next to Super Hexagon's sub-second restart. MatchRPG has meta-progression to spend between runs, so some gap is wanted. The question is whether the 64% of gaps over 60 s are spending (good) or friction (bad). Measure town time separately from death screen time.
- [I] Wordle and Blitz show the other way to pace a day: a scarce daily or weekly shared event. MatchRPG has neither. A daily seeded descent would give the 3.5-runs-a-day player one comparable run.

### Gaps
- No genre-specific puzzle session numbers outside vendor PDFs I did not open.
- No telemetry yet splits death screen, town and menu seconds. The gap above is coarse.

## Q2. Ranked ladders and tier systems as curves

### Takeaway
Every successful ladder pairs a soft entry (provisional or placement) with a floor that stops loss from feeling like falling. MatchRPG has both: a one-run placement and a slow, 5-run demotion. Its unusual part is that the tier does not measure winning. It measures speed, and a higher tier is a harder clock. So "up at once" is both a reward (label) and a threat (clock). No ladder twin found works that way. The nearest are chess time controls, where speed is chosen, not measured.

### Cited findings
- Lichess: every rating starts at 1500 with a confidence of plus or minus 1000. A "?" shows while Glicko-2 deviation is over 110, and returns after about a year away. [V, E2] https://lichess.org/faq
- Lichess rates each time control separately. A control is placed by estimated duration = initial seconds + 40 x increment. Bullet is up to 179 s, blitz to 479 s, rapid to 1499 s. [V, E2] https://lichess.org/faq
- Chess.com sets the first rating from a self-reported level (forum-quoted support values: New 400, Beginner 800, Intermediate 1200, Advanced 1600, Expert 2000). [U, E3, values conflict across posts] https://support.chess.com/en/articles/8566476-what-is-the-glicko-rating-system ; https://chess.com/forum/view/community/how-does-chess-com-decide-initial-ratings
- Clash Royale trophy gates (April 2019): passing a gate means "you will NOT drop below that threshold". No gates above 4000 trophies. [V, E2] https://supercell.com/en/games/clashroyale/blog/release-notes/new-update-feature-enter-the-trophy-road
- Clash Royale rework (26 Oct 2022): trophy floors on all arenas, so a player cannot return to the previous arena. Road ends at 7500 trophies (Arena 20). [V, E3] https://mobilematters.gg/clash-royale/clash-royale-trophy-road-rework-level-gates-trophy-floors-champions
- Hearthstone ranked rework (April 2020): 5 leagues x 10 ranks, 3 stars per rank, floors at rank 10 and rank 5 of each league where losses cannot drop a rank. A star bonus multiplier from last season's finish (up to about 10x to 11x for Legend) speeds the climb; each floor passed lowers the bonus by 1. [V, E2] https://hearthstone.blizzard.com/en-us/news/23319441/welcome-to-the-year-of-the-phoenix
- Natural experiment: about 9 to 10 times as many players reached Legend in the first month of the new system as in the last month of the old one. PC Gamer credits the MMR focus and star bonus. Confounded by a rotation and a new expansion the same month. [V, E1 secondary] https://www.pcgamer.com/hearthstones-new-ladder-system-is-creating-almost-10-times-as-many-legend-rank-players ; https://www.hearthstonetopdecks.com/hearthstones-ranked-mode-overhaul-two-months-in-how-good-is-it/
- Baseline before: Legend about 0.5% of players (2014). [V, E1] https://www.engadget.com/2014/09/19/most-hearthstone-players-dont-surpass-rank-15/
- Critique: TheGamer argued the rework offers "nothing positive to the majority" of players. [V, E4] https://www.thegamer.com/hearthstone-new-rank-mode-bad-casual/
- Apex Legends: demotion protection starts when one match could drop a rank and gives 3 demotion shields; it ends when the shields are spent or RP climbs out of danger. Rookie tiers get no reset at splits. Splits reset rank twice a season. [V, E2] https://help.ea.com/en/articles/apex-legends/ranked/ ; [V, E3] https://sportskeeda.com/esports/all-major-ranked-changes-apex-legends-season-24-split-2
- Rocket League: soft reset each season, MMR carries over, 10 placement matches per playlist. Placement games reported at about +/-16 MMR versus +/-9 in normal games. [U, E3 single source for the MMR swing] https://theglobalgaming.com/rocket-league/soft-hard-rank-reset-season
- Resident Evil 4's hidden "game rank" adjusted difficulty from performance and was never announced. Its 2015 exposure (Game Maker's Toolkit, Engadget) drew mixed reaction, many players had never known. [V, E3] https://www.engadget.com/2015-06-03-resident-evil-4-difficulty.html ; https://critpoints.net/2016/01/16/adaptive-difficulty-in-resident-evil-4
- Lichess forbids sandbagging, losing on purpose to lower a rating; accounts get marked. [V, E3 via forum quotes of the terms] https://lichess.org/forum/general-chess-discussion/sandbagging-11?page=1
- MatchRPG data [K, E1]: 15 tier changes across 859 runs (9 up, 6 down), in 9 of 21 players. The count includes moves from the silver start to the placed tier. Run tier mix: gold 384, diamond 380, silver 81, bronze 14.

### Comparison table (rules as curves)

| System | Entry | Promotion | Demotion | Floor | Reset |
|---|---|---|---|---|---|
| Lichess | 1500 +/-1000, "?" until RD 110 | continuous | continuous | none | none, "?" after ~1 yr away |
| Chess.com | self-reported level | continuous | continuous | none | none |
| Clash Royale | Arena 1 | trophies | trophies | every arena (2022) | season trophies above road |
| Hearthstone 2020 | Bronze 10 + star bonus | 3 stars a rank | stars | rank 10 and 5 of each league | monthly |
| Apex | Rookie | RP | RP, 3 shields | Rookie, shields | 2 splits a season |
| Rocket League | 10 placements | MMR | MMR | none | soft, each season |
| MatchRPG | silver play, placed by 1 run | at once on the 10-run median | 1 step after 5 slow runs in a row | none, but the 5-run rule acts as one | new major version, tier carried |

### Inferences
- [I] MatchRPG's 5-run demotion rule is a soft floor, like Apex shields but counted in runs. At 3.5 runs a day, a player has to play slow for about 1.5 days of play to drop. That fits "a few slow runs don't take a tier away".
- [I] The incentive is inverted. In chess or Hearthstone, demotion is loss. In MatchRPG demotion buys a slower clock, an easier dungeon. If players learn the clock exists, slow play is the cheap path to depth. The 5-run rule makes it cost about 5 bad runs, which is the right shape. Lichess's sandbagging rule shows the social cost: once a hidden factor is known, a share of players will game it and others will resent them. The DDA paradox predicts it.
- [I] "Up at once" is safe in Hearthstone because promotion is pure reward. In MatchRPG promotion is a harder clock with no warning beyond "UP TO GOLD MASTERY". A player promoted from gold (1.1) to diamond (1.25) faces a 14% faster dungeon on the next run. That is a spike, set by the player's own skill. A first run on the new tier with a gentler clock (halfway) would turn the spike into a ramp.
- [I] The one-run placement is braver than any twin. Lichess needs many games, Rocket League 10. The repo explains why: five runs at silver let quick players go deep on a too-slow clock. One run is fine while placement can go down at once ("the first reading drops at once"), which the code does.
- [I] RE4 shows hidden adjustment survives being exposed if the player still felt in charge. MatchRPG already names the tier and explains it on the "i". The clock is the hidden part.

### Gaps
- No twin found where rank measures speed and sets a harsher clock. Tetris 99 and Tetris Effect Connected have no published hidden ladder (searched, nothing). Puyo Puyo rating not researched.
- No data on whether MatchRPG players know the clock exists. A 5-player survey question would answer it.

## Q3. Boards per version and season resets

### Takeaway
Seasons and daily seeds give a returning player a fresh, winnable board. MatchRPG resets boards with each major version, which is a season with an irregular length set by the developer. It carries the tier, like Rocket League's soft reset. What it lacks is a short, shared, fixed-seed board, which the daily-run designers call the fairness tool.

### Cited findings
- Spelunky (HD) daily challenge: one world a day, everyone plays the same one, one attempt, the board ranks money and level. A later patch stopped seeds repeating. [V, E3] https://spelunky.fandom.com/wiki/Daily_Challenge_Mode_(HD)
- The Ludite argues Spelunky's money score pushes risky play against the game's own risk-management. [V, E4] https://theludite.com/2014/06/23/spelunky-when-scoring-goes-bad/
- Game Developer's survey of daily runs: the only shared rule is "a shared seed, and that it changes every day" (Will Lewis, Caveblazers). Caveblazers allows one attempt; Dead Cells allows unlimited and keeps the best, and Sébastien Bénard says one attempt "drastically raises the stakes". OlliOlli let players practise freely, only one committed run counted. Dead Cells logged about 7,000 daily runs a day. Caveblazers built its daily in about one weekend. [V, E2] https://www.gamedeveloper.com/design/the-24-hour-ticket-examining-daily-runs-
- Bejeweled Blitz weekly board resets every Tuesday. [V, E2] https://forums.battlefield.com/games/bejeweled/bejeweled-blitz/news/introducing-blitz-champions
- Hearthstone resets monthly with a star bonus from last season's finish. Rocket League soft-resets each season. Apex resets twice a season. [V, sources above]
- MatchRPG [K]: one board per version's first two numbers and per tier. A player is listed on one tier only, the one of their last run, and a best left on a former tier is hidden. A new release carries the tier.

### Inferences
- [I] Version boards reset the felt curve for returners: a fresh v0.8 board is empty, so a returning player can be on page one after a few runs. That is the Hearthstone monthly effect without a calendar. The cost is that version length is irregular, so players cannot plan around it.
- [I] Hiding a best on a former tier means a demoted player loses their visible record. In Hearthstone terms, this is a demotion with no floor for the record. It may feel worse than the clock change. Consider showing "best this version" on the player card regardless of tier.
- [I] A daily seed fits MatchRPG well. Runs are 3 min, randomness is high (tile drops, encounter draws), and a seed removes most luck from comparison. Dead Cells' unlimited-attempts form suits a game played 3.5 times a day. It would still run on each tier's clock, so it needs per-tier boards too.

### Gaps
- Downwell and Balatro were on the list. Balatro has seeded runs but no official daily board as far as found; not confirmed. Downwell daily not researched.
- Tetris 99 events (Maximus Cup) not researched.

## Q4. Separating pace from skill

### Takeaway
Games that let players pick speed reward the faster pick with points (NES Tetris) or keep fast play on its own board (NecroDancer, chess time controls). MatchRPG instead measures speed and sets it, then hides it. That is the only design here where a slow player is never shown that they are on a slower game. It keeps the Challenge aesthetic equal per move, which is the goal. It gives up the Expression a player gets from choosing a faster game.

### Cited findings
- NES Tetris: start level 0 to 19 (hold A to add 10). Points per clear scale with level, a Tetris is 12,000 at level 9 and 36,000 at level 29. Classic Tetris World Championship matches all start at level 18. [V, E3] https://en.wikipedia.org/wiki/Tetris_(NES_video_game)
- Speed is a reward there. Starting high pays more per line, so skilled players opt in to the threat. [I from the scoring table]
- Crypt of the NecroDancer: the Hatsune Miku soundtrack has a faster BPM, and runs with it go to a separate set of leaderboards. [V, E4 single Steam thread] https://steamcommunity.com/app/247080/discussions/2/4352240180490041353/
- Lichess separates ratings by time control (bullet, blitz, rapid, classical), so a player's speed band is chosen and rated on its own. [V, E2] https://lichess.org/faq
- Tetris 99: gravity rises as the field shrinks, community sources say from 50 players left, near instant drops by the last 10. The ramp is shared, not per player. [V, E3, thresholds disputed] https://tetris.wiki/Tetris_99 ; https://harddrop.com/wiki/Tetris_99
- Bejeweled Blitz fixes the clock at 60 s for everyone and lets skill show as score. [V, E3] https://bejeweled.wiki.gg/wiki/Bejeweled_Blitz

### Inferences
- [I] Speed as threat vs speed as reward. In Tetris 99 speed is a threat everyone faces. In NES Tetris it is a reward a player opts into. In MatchRPG it is a threat that the player earns without choosing, labelled as a reward ("Diamond mastery"). That mix is the risk: the label says reward and the body feels threat.
- [I] A visible, opt-in "play one tier up" switch on the run screen would add NES Tetris's opt-in at low cost. It keeps the hidden measured tier as the default. This is player-steered difficulty layered on the pacing DDA.
- [I] NecroDancer's split board for a faster BPM is the same choice MatchRPG made with per-tier boards. MatchRPG's "All" tab then remixes them, which NecroDancer does not do.

### Gaps
- Bejeweled Blitz's speed scaling, if any, not found. Rhythm-game difficulty lanes not researched.

## Q5. Social comparison and fairness

### Takeaway
Per-tier boards are fair by construction. The "All" tab, which ranks every tier by depth, is fair only if the talent-lab claim holds that each tier's clock evens out depth. The repo says the clocks were set so Astaroth falls in 4% of capped runs at 0.24, 0.32 and 0.39 moves/s alike. If that holds in live data, depth is comparable across tiers and "All" is fair. If not, "All" favours whichever tier's clock is most generous. The fix twins use is separate boards, not a normalised score.

### Cited findings
- Shared seeds are the fairness tool for daily runs: no one gets better or worse conditions. [V, E2] https://www.gamedeveloper.com/design/the-24-hour-ticket-examining-daily-runs-
- Hades has no global in-game leaderboard. Community speedruns (speedrun.com) keep categories apart, with "Any Heat" the main one; speedrun.com returned 403 when fetched. Some heat settings speed up runs, so heat and time are not monotone. [V, E3] https://www.speedrun.com/hades/guide/5km0y ; https://kotaku.com/how-hades-speedrunners-clear-the-game-in-under-eight-mi-1845352749
- NecroDancer and Lichess split boards and ratings by speed rather than normalise. [V, sources above]
- MatchRPG [K]: TierDefs comment, clocks were set so that "Astaroth falls to 4% of runs at the cap" for 0.24, 0.32 and 0.39 moves/s, where at the game's clock it was 0, 0 and 17%. Run tier mix in live data: gold 384, diamond 380, silver 81, bronze 14.

### Inferences
- [I] No twin found normalises scores across difficulty with a formula. They split boards (Lichess, NecroDancer, speedrun categories) or fix conditions (Spelunky seed, Blitz 60 s). MatchRPG already does both splitting (tier boards) and mixing (All). Keep "All" only if agent 0b's depth-by-tier medians are close. Otherwise make the tier tab the default view.
- [I] Bronze has 14 runs. A bronze board will look empty, which is its own social signal ("few play here"). With 21 players, per-tier boards have fewer than 3 players in some tiers, so they read as solo lists.
- [I] The hidden clock is not unfair between players if depth is level across tiers. It becomes unfair when a player finds it and slows down on purpose. The 5-run demotion rule is the main guard.

### Gaps
- No published normalised cross-difficulty leaderboard found (Geometry Wars not researched).
- Depth by tier from live data belongs to agent 0b.

## Pattern cards

### P1. Soft demotion counted in attempts
- Lineage: Hearthstone rank floors (2014 every 5 ranks, kept in the 2020 rework) -> Clash Royale trophy gates (2019), floors on every arena (2022) -> Apex demotion shields (3 losses). Why: losing rank in a short session felt like losing the whole sitting.
- Feeling: safety to experiment, so Challenge without dread.
- Mechanism: drop only after N consecutive below-line results, and only one step. MatchRPG: N = 5, step = 1 tier, line minus 0.02.
- Works when results are noisy (high randomness, short runs). Breaks when demotion is a benefit (MatchRPG's slower clock), because it invites slow play to drop.
- Evidence: Hearthstone and Apex official rules [V, E2]; Legend count about 9 to 10x after the 2020 rework [V, E1 secondary, confounded].
- Cost S. Knobs: N, step size, margin.
- MatchRPG: already built. Keep N at 5 and log every demotion with the 5 paces' spread to spot deliberate slow play.

### P2. Placement in few attempts, corrected fast
- Lineage: Elo provisional ratings -> Glicko RD and Lichess "?" (RD over 110) -> Rocket League 10 placements with larger swings -> MatchRPG 1 run.
- Feeling: the game knows me quickly, Competence from run 2.
- Mechanism: high uncertainty early, wide moves, narrowing with data.
- Works when the measure is cheap and direct (moves/s is). Breaks when early runs are atypical (first-ever run is also tutorial-like).
- Evidence: Lichess FAQ [V, E2]; Rocket League [U, E3].
- Cost S. Knobs: PLACE_RUNS, MIN_RUNS, WINDOW.
- MatchRPG: the first counting run places. Check with agent 0b whether run-1 pace predicts run-10 pace. If run 1 is slow (learning the board), placement under-tiers quick learners, and the "up at once" rule fixes it at run 5.

### P3. Promotion step with a buffer run
- Lineage: Apex entry cost and demotion protection on entering a tier; Hearthstone star bonus easing the climb. No exact twin for a harder clock on promotion.
- Feeling: earned promotion, not a sudden punishment.
- Mechanism: first run after promotion runs at the midpoint clock (gold to diamond: 1.175 instead of 1.25), then the full clock.
- Works when the tier sets the challenge. Breaks if players notice a pattern and read it as rubber banding.
- Evidence: [I], built from P1 sources.
- Cost S. Knob: buffer runs, fraction.
- MatchRPG: optional. Test whether depth drops on the first run after a promotion (agent 0b can check across the 9 promotions, though n is small).

### P4. Shared daily seed
- Lineage: Spelunky (2012 PC, daily challenge) -> Isaac, Caveblazers, Dead Cells, OlliOlli Daily Grind; Wordle (2021) for one shared puzzle a day on the web.
- Feeling: fair comparison and a reason to come back, Fellowship without co-op.
- Mechanism: seed = date; one board per day (per tier here); one attempt or best of many.
- Works with high randomness and short runs. Breaks when a fixed seed can be scouted by video (Bénard's warning) and attempts are unlimited.
- Evidence: Game Developer survey [V, E2]; Dead Cells about 7,000 daily runs a day [V, E1 developer figure]; Caveblazers built in a weekend [V, E2].
- Cost M (seeded RNG for tiles and draws, a daily board). Knobs: attempts, score metric (depth, time), modifiers.
- MatchRPG: seeds exist for tests. A daily descent with best-of-many fits a 3.5-runs-a-day habit.

### P5. Speed split, not normalised
- Lineage: chess time controls -> Lichess ratings per control by estimated duration -> NecroDancer faster-BPM boards -> speedrun categories per heat.
- Feeling: fair comparison among equals.
- Mechanism: one board per speed band; do not mix bands in one ranking.
- Works when bands have enough players. Breaks with few players (MatchRPG bronze, 14 runs).
- Evidence: Lichess FAQ [V, E2]; NecroDancer [V, E4].
- Cost S. Knob: which tab is default.
- MatchRPG: already per-tier boards. The "All" tab is the exception, keep it only if depth by tier is level.

### P6. Opt-in speed as reward
- Lineage: NES Tetris start level (1989) -> CTWC standard 18 start -> MatchRPG candidate.
- Feeling: Expression and fiero from choosing a harder game.
- Mechanism: a faster clock pays more (NES Tetris scales points with level).
- Works when the score rewards the risk. Breaks if the reward is not visible.
- Evidence: Wikipedia NES Tetris scoring [V, E3].
- Cost S. Knob: clock offset, reward multiplier (gold, XP, a board mark).
- MatchRPG: a "one tier up" toggle that plays the next clock and posts on that tier's board.

### P7. Sub-second retry
- Lineage: Super Hexagon (2012) restart under 1 s -> Super Meat Boy, Downwell, mobile arcade games.
- Feeling: Challenge without downtime, "one more go".
- Mechanism: death screen to control in under 1 to 2 s, with the option to skip summaries.
- Works for runs without meta spending. Breaks when the game needs a town stop.
- Evidence: Engadget interview, App Store editorial [V, E2/E3].
- Cost S. Knob: seconds from death to next run.
- MatchRPG: median 139 s between runs, 36% under 60 s [K, E1]. Add a "run again" button on the result screen that skips town when nothing is affordable.

## Fun hypotheses
- A player who is promoted should feel pride on the result screen and should not feel the next run collapse. If depth drops more than about 20% on the first run after a promotion, the promotion reads as punishment.
- A player on their third run of a sitting should be able to start it within 30 s of dying when they have nothing to spend.
- A player who learns the clock exists should still prefer their higher tier. If any of the 5 playtesters says they would play slow to drop, the label needs a reward beyond the board.

## Anti-patterns seen in twins
- Score metrics that reward risky play against the game's spirit (Spelunky daily money, per The Ludite).
- A record that vanishes on demotion (MatchRPG hides a best on a former tier; no twin does this to records).
- Hidden adjustment that reverses the meaning of rank (MatchRPG's slower clock for a lower tier, Lichess bans the equivalent).

## Glossary additions
- Rank floor: a rank or threshold a player cannot drop below once reached. Hearthstone, Clash Royale. Distinct from MatchRPG's soft demotion, which has no floor but a delay.
- Soft demotion: demotion that waits for N consecutive below-line results and drops one step.
- Placement: the first results that set a player's starting tier or rating, with wider moves than later ones.
- Sandbagging: playing worse on purpose to lower a rating or tier and face easier conditions.
- Sitting: consecutive runs with no break over 30 min. Used here for our data; "session" in vendor reports may mean one app open.

## Sources
- https://gamedevreports.substack.com/p/gameanalytics-benchmarks-in-mobile
- https://investgame.net/wp-content/uploads/2025/02/2025-GameAnalytics-Mobile-Gaming-Benchmarks.pdf
- https://appfollow.io/blog/mobile-game-analytics-with-ioana-hreninciuc
- https://www.engadget.com/2012-09-21-terry-cavanagh-goes-inside-super-hexagon.html
- https://www.videogamer.com/reviews/super-hexagon-review
- https://apps.apple.com/nz/story/id1322079568
- https://en.wikipedia.org/wiki/Wordle
- https://time.com/6143715/wordle-sale-josh-wardle-interview
- https://forums.battlefield.com/games/bejeweled/bejeweled-blitz/news/introducing-blitz-champions
- https://bejeweled.wiki.gg/wiki/Bejeweled_Blitz
- https://lichess.org/faq
- https://lichess.org/forum/general-chess-discussion/sandbagging-11?page=1
- https://support.chess.com/en/articles/8566476-what-is-the-glicko-rating-system
- https://chess.com/forum/view/community/how-does-chess-com-decide-initial-ratings
- https://supercell.com/en/games/clashroyale/blog/release-notes/new-update-feature-enter-the-trophy-road
- https://mobilematters.gg/clash-royale/clash-royale-trophy-road-rework-level-gates-trophy-floors-champions
- https://hearthstone.blizzard.com/en-us/news/23319441/welcome-to-the-year-of-the-phoenix
- https://www.pcgamer.com/hearthstones-new-ladder-system-is-creating-almost-10-times-as-many-legend-rank-players
- https://www.hearthstonetopdecks.com/hearthstones-ranked-mode-overhaul-two-months-in-how-good-is-it/
- https://www.engadget.com/2014/09/19/most-hearthstone-players-dont-surpass-rank-15/
- https://www.thegamer.com/hearthstone-new-rank-mode-bad-casual/
- https://help.ea.com/en/articles/apex-legends/ranked/
- https://sportskeeda.com/esports/all-major-ranked-changes-apex-legends-season-24-split-2
- https://theglobalgaming.com/rocket-league/soft-hard-rank-reset-season
- https://www.engadget.com/2015-06-03-resident-evil-4-difficulty.html
- https://critpoints.net/2016/01/16/adaptive-difficulty-in-resident-evil-4
- https://spelunky.fandom.com/wiki/Daily_Challenge_Mode_(HD)
- https://theludite.com/2014/06/23/spelunky-when-scoring-goes-bad/
- https://www.gamedeveloper.com/design/the-24-hour-ticket-examining-daily-runs-
- https://en.wikipedia.org/wiki/Tetris_(NES_video_game)
- https://steamcommunity.com/app/247080/discussions/2/4352240180490041353/
- https://tetris.wiki/Tetris_99
- https://harddrop.com/wiki/Tetris_99
- https://www.speedrun.com/hades/guide/5km0y (speedrun.com main page returned 403)
- https://kotaku.com/how-hades-speedrunners-clear-the-game-in-under-eight-mi-1845352749
- [K] MatchRPG repo: `scripts/data/tier_defs.gd`, `server/api/_lib.js`, `CLAUDE.md` (tiers, boards); run data `matchrpg-runs-v06-v07` (aggregates only).

### See it in action
- Super Hexagon restart: https://www.engadget.com/2012-09-21-terry-cavanagh-goes-inside-super-hexagon.html
- Spelunky daily: https://spelunky.fandom.com/wiki/Daily_Challenge_Mode_(HD)
- Clash Royale trophy road: https://supercell.com/en/games/clashroyale/blog/release-notes/new-update-feature-enter-the-trophy-road
- Hearthstone 2020 ladder: https://hearthstone.blizzard.com/en-us/news/23319441/welcome-to-the-year-of-the-phoenix
- Apex ranked: https://help.ea.com/en/articles/apex-legends/ranked/
- Lichess ratings: https://lichess.org/faq
- NES Tetris levels: https://en.wikipedia.org/wiki/Tetris_(NES_video_game)
- Tetris 99: https://tetris.wiki/Tetris_99
- RE4 hidden rank: https://critpoints.net/2016/01/16/adaptive-difficulty-in-resident-evil-4
- Wordle: https://en.wikipedia.org/wiki/Wordle
