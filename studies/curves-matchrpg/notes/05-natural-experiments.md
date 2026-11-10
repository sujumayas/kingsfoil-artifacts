# 05. Natural experiments: curve changes in match-3, roguelites and speed games

Angle: documented changes to difficulty, learning or power curves in games that share MatchRPG's conditions, each
paired with the measured or widely reported reaction. Tool budget used: about 31 calls. Tags follow `CONTEXT.md`
([V/I/U/K] plus E1-E4). Source keys like [S3] point to the Sources list at the end.

No overlap with Curves #1. Hearthguard's `04-natural-experiments.md` covered Diablo 3/4, Helldivers 2, Path of
Exile 2, Nightreign, Risk of Rain 2, Back 4 Blood, Vermintide 2, Monster Hunter Wilds, Aghanim's Labyrinth, Kingdom
Rush and Deep Rock Galactic. Its report covered L4D, Celeste, Hades God Mode and PvZ. None of those appear here.

Why these twins. Candy Crush and Angry Birds Dream Blast share touch match-3, many short attempts a day and
published per-level telemetry, so they are the best match for MatchRPG's run data. Gems of War and Marvel Puzzle
Quest share match-3 combat against enemies whose level scales. Balatro, Peglin, Luck be a Landlord, Dead Cells and
Rogue Legacy 2 share short runs, high randomness and meta-progression between runs, plus a post-win ladder. NES
Tetris shares a speed ramp that the player meets on a board, with a fixed top speed. Resident Evil 4, Crash
Bandicoot and the EA patent are the hidden-DDA cases, chosen because MatchRPG's mastery tiers are a hidden
pace-based DDA (stat-like change to the clock, driven by measured moves per second). Flappy Bird is the control
case of a game with no curve at all.

## Experiments table

| # | Game | When | Change (before -> after) | Reaction | Grade | Lesson |
|---|---|---|---|---|---|---|
| 1 | Candy Crush Saga | Level shipped 2012 as the last level of update 2; eased later (talk at GDC 2016) | Level 65 built "especially hard" as a finale, then made easier using win/loss/attempt data. | Became the highest-converting level and "made the most revenue ever", and also caused the most churn. King says players enjoy the eased version more. | [V, E2] | A wall at a planned end converts payers and loses everyone else. With no store, MatchRPG gets only the churn half. |
| 2 | Candy Crush Saga | GDC, Mar 2024 | King replaced pass rate alone with a fun metric that combines time to pass and time to abandon. Found max level length depends on difficulty. Pruned the 100 least fun levels. | Designer quote: "crazy hard levels never pay off". | [V, E2] | Hard is fine if short. Measure abandon, not only deaths. |
| 3 | Candy Crush Saga | Paper 2020, data on about 12 million players | Modelled each level as a race between attempts to pass and attempts to abandon. | Hard or "traumatic" early levels caused large churn. | [V, E1] | Early walls cost the most players. Use attempts-to-abandon per stage as the churn measure. |
| 4 | Angry Birds Dream Blast | arXiv, Aug 2020 | 168 levels, 95,266 players. Pass rate plotted against 7-day churn. Simulated agents predicted both. | Less persistent and less skilled players are most sensitive to hard levels and churn early. | [V, E1] | The players a hard stage loses are the slow ones. Bronze-tier players are the canaries. |
| 5 | Freemium mobile puzzle game (unnamed) | Field experiment, 12 weeks, paper 2023-2025 | Difficulty lowered for players predicted to churn, against a random holdout. Over 300,000 players. | Retention and engagement up. Ad revenue +21%, purchase revenue up to +79% (from a secondary write-up). | [V, E1]; numbers [U] secondhand | Easing the curve for at-risk players is supply or stat DDA that pays. The effect is on who stays, not on one level. |
| 6 | Candy Crush Saga | Interview, 16 Jan 2026 | Over 20,000 levels. "Complexity staircase": new blockers reach players who have passed more levels. A hard level is often followed by a lighter one. Bots predict pass rates before release. | Designer statement, no public reaction data. | [V, E2] | Sawtooth by level set, with relief after each peak. Bots find outliers but not feel. |
| 7 | Candy Crush Saga | Dark-pattern catalogue entry, 9 Nov 2016 | Claim that some levels are impossible to push boosters, and that non-payers get easier levels over time. | Widely believed, never shown with data. The catalogue says entries are unverified. | [U, E4] | Any unexplained hardness gets read as rigging. Hidden adjustment invites the suspicion even when innocent. |
| 8 | Balatro | 1.0.1f, Apr 2024 | Ante score scaling lowered on higher stakes. Orange Stake pack costs stop rising per ante. Perishable and Rental Joker stickers added to high stakes. | Press framed it as "should make winning easier". Exact stake/ante numbers conflict across sources. | [V, E3] change; [U] numbers | Tune the post-win ladder by the score target per ante, one knob at a time. |
| 9 | Peglin | 1.0 (2024) then v1.0.6 | Cruciball 17-20 added. C19 adds extra enemies to easy battles, C20 makes bosses harder. v1.0.6 limited the extra enemies and removed the chance of several hard enemies in one fight. | Press called 1.0 "a little less frustrating" (Leshy boss rework). C19 had to be walked back within patches. | [V, E2] change; [I] reaction | A stacking modifier that can roll several hard draws into one fight produces a spike nobody designed. Cap the worst draw. |
| 10 | Luck be a Landlord | Early Access patch (date not found) | Higher rent forced on all players -> base game returned to earlier difficulty, the extra challenge moved into opt-in apartment floors (20 floors). | Developer cited player feedback that forced rent was less enjoyable. | [V, E2] | Raise difficulty through an opt-in ladder after the first win, not by raising the base curve. |
| 11 | Dead Cells | Update 19 "Update of Plenty", 28 May to 6 Jul 2020 (19.0-19.7) | Boss Cell tiers smoothed. BC0 harder, BC1-3 easier, BC1+ mob density down, BC2+ enemy damage down. Free amulet granted per BC. Harder biomes give more cells. | Press headline "smoothed out its difficulty curve". Dev goal "without the big walls we had before". | [V, E2] | Make the first step harder so the second is not a wall. Smooth the gaps between ladder tiers. |
| 12 | Rogue Legacy 2 | v0.6.0 (EA, 2021) and v1.2.1 | House Rules added. Enemy HP and damage sliders (launch range reported 50-200%), no contact damage, flight. v1.2.1 lowered the enemy HP floor 50% -> 25%. Achievements still unlock. | Reviewers praised it as accessibility that also lets players raise challenge. | [V, E3] | Named, visible sliders with no penalty were welcomed. Visible beats hidden for opt-in easing. |
| 13 | NES Tetris (CTWC) | Rolling technique spreads from 2020; CTWC 13-15 Oct 2023 adds level 39 | Level 29 was the designed top speed and practical end. Rolling made level 29 survivable, so games ran on. CTWC added a "super killscreen" at level 39 at twice the level 29 speed. Dec 2023, players first reached the game's crash. | The 39 rule was accepted as the way to end marathons and reward Tetrises over singles. | [V, E3] | A top speed that skill can beat stops being an end. If endless must end, design the end. |
| 14 | Gems of War | 1.0.7, 31 Oct 2015 | Gem falls, shifts and matches sped up. Spell animations and AI turns kept old speed. | Split. Some called it "the best change ever", others could not follow cascades. Many asked for a speed toggle. Dev cited limits on what could change. | [V, E3] | Board animation speed is a tempo knob. Faster falls hide cascades, so readability limits speed. |
| 15 | Gems of War | Update 4.5 and an Underspire update (dates not found) | 4.5 began a difficulty rework, quest battles auto-scale by kingdom group. Later, Underspire first-section enemy levels went from 10-20 to 14-33. | Bug report tagged [Investigating]. A commenter called the scaling "neither fun nor fair". | [V, E4] | A silent jump in enemy level reads as a bug. Announce scaling changes. |
| 16 | Marvel Puzzle Quest | R69 19 Jan 2015; Mar 2016; 25 May 2017 | 2015 fix stopped 1-3 star characters scaling past their caps. 2016 story difficulty changed to favour beating hard nodes over racing. 2017 test tied enemy scaling to S.H.I.E.L.D. clearance level. | Players said they would drop to a lower clearance to keep clear times short. Complaints about level-400 enemies on easy nodes. | [V, E3/E4] | Scaling that rises with player progress invites sandbagging. Players game the meter. |
| 17 | Resident Evil 4 | 2005 game; widely publicised 2015 | Hidden difficulty rank moves up and down with performance. Enemies get slower and clumsier when the player struggles. Capcom never announced it. | Press: "secretly adjusted its difficulty for you". Reception was curiosity, not anger. | [V, E3] | Hidden mercy that only helps a struggling player is tolerated even when found. |
| 18 | Crash Bandicoot 2 and N. Sane Trilogy | 1997; remaster 30 Jun 2017 | After about 6 deaths in a section, an Aku Aku mask appears; after about 6 more, some crates become checkpoints. Obstacles slow after each death. The remaster added this DDA to the first game. | Players rarely noticed. The remaster was still called hard, for other reasons (jump physics). | [V, E2/E3] | Failure-count supply DDA with a cap works quietly. It does not rescue a feel problem. |
| 19 | EA (FIFA, Madden, NHL) | EOMM paper 2017; DDA patents; class action Nov 2020, dropped 2021 | Research on matchmaking tuned for engagement or spending, plus patents for DDA that could be "undetectable by a user". | Suit alleged DDA pushed loot box spending. EA denied use. Suit dropped after plaintiffs got access to the tech. Long-running "scripting" suspicion among players. | [V, E3] | Hidden adjustment tied to money, or that taxes skilled play, becomes a trust problem even when denied. |
| 20 | Flappy Bird | Pulled 9-10 Feb 2014 | No change in difficulty. Flat high difficulty from the first pipe, instant retry. Pulled at a reported (unconfirmed) $50,000 a day in ad revenue. | Designer called it "an addictive product". | [V, E2]; revenue [U] | The control case. A flat curve with a 1-second retry is compulsive. The only power curve is the player's own best. |

## Per-experiment notes

### 1-3, 6-7. Candy Crush Saga (2012-2026)

Takeaway. King's own evidence says the cost of a hard stage is churn, that a hard stage must be short, and that
abandonment is the measure to watch.

Cited findings.
- Level 65 was made hard because it was the last level of the second update [S2][S3] [V, E2]. It became the
  highest-converting level, made "the most revenue ever", and caused the most churn [S1] [V, E2]. King eased it and
  says players enjoy it more [S2][S3] [V, E2].
- GDC 2024 (Wedekind, Guardiola): fun measured by time to pass and time to abandon; recommended max level length
  depends on difficulty; 100 least fun levels identified and fixed. Quote "crazy hard levels never pay off" [S1] [V, E2].
- Scientific Reports paper on about 12 million players: pass and abandon as competing processes; hard early stages
  cause large churn [S4] [V, E1].
- 2026 interview (John Davies): over 20,000 levels, a "complexity staircase" of blockers, hard levels often followed
  by lighter ones, bots predict pass rates but not feel [S5] [V, E2].
- The "impossible levels" claim is a 2016 catalogue entry with no evidence; the page says entries are unverified [S6] [U, E4].

Inferences. King's short-if-hard rule maps to elite and boss fights. A fight that takes long and is hard costs the
most players. [I]

Gaps. No public per-level pass-rate table. The 2013-2014 "level redesign" episode could not be dated beyond level 65.

### 4-5. Rovio and the field experiment

- Angry Birds Dream Blast: 168 levels, 95,266 players, pass rate against 7-day churn; low-persistence, low-skill
  players churn early on hard levels [S7] [V, E1].
- Ascarza, Netzer and Runge: over 300,000 players, 12 weeks, difficulty lowered for at-risk players against a random
  holdout. Engagement and retention up. The Columbia brief reports +21% ad revenue and up to +79% purchase revenue,
  mostly from content-access items [S8][S9] [V, E1]; the brief returned 403 to direct fetch, so the percentages are
  from search summaries [U]. Venue reported as International Journal of Research in Marketing, not verified.

### 8-12. Roguelites after the first win

- Balatro 1.0.1f (Apr 2024) lowered ante scaling in later stakes, removed Orange Stake pack cost scaling, and
  added Perishable and Rental stickers [S10][S11] [V, E3]. Reported per-ante numbers conflict between beta 1.0.1c and
  final 1.0.1f lists [U].
- Peglin 1.0 added Cruciball 17-20; v1.0.6 limited C19's extra enemies and removed multiple hard spawns in one
  fight [S12][S13] [V, E2]. 1.0 date and reaction volume not verified [U].
- Luck be a Landlord moved added difficulty from the base game into apartment floors after feedback that forced
  rent was less fun [S14] [V, E2]; 20 floors, each unlocked by paying rent 12 times [S15] [V, E3].
- Dead Cells Update 19 (19.0 to 19.7, 28 May to 6 Jul 2020): BC0 harder, BC1-3 easier, density and damage cuts,
  free amulet per BC, stated aim "without the big walls" [S16][S17] [V, E2]. A later "Whack-a-Mole" update added
  health fountains in every BC0 transition and every other BC1 transition [S18] [V, E3]; its date was not verified.
- Rogue Legacy 2 House Rules: framed as accessibility in v0.6.0; enemy HP floor lowered from 50% to 25% in v1.2.1;
  achievements still unlock [S19][S20][S21] [V, E2/E3].

### 13. NES Tetris and the level 39 rule

- Level 29 doubles fall speed and was the designed end. The rolling technique let top players survive it, so CTWC
  2023 (Portland, 13-15 Oct) added a level 39 "super killscreen" at twice level 29 speed, to end games and reward
  Tetrises [S22][S23] [V, E3]. In Dec 2023 players first reached the game's crash, with others following [S24] [V, E3].
- Inference. The speed cap was a curve end only while human skill could not beat it. A skill breakthrough turned
  "endless" into "unbounded" and organisers had to add a new end. [I]

### 14-16. Gems of War and Marvel Puzzle Quest

- Gems of War 1.0.7 (thread opened 31 Oct 2015): faster gem movement only; split reaction; toggle requested; dev
  cited "some limitations" [S25] [V, E3]. No confirmed follow-up toggle in what was read [U].
- Gems of War Underspire levels 10-20 -> 14-33 [S26] [V, E4]; 4.5 update began a difficulty rework, quest battles
  auto-scale by kingdom group [S27] [V, E2].
- MPQ: R69 (19 Jan 2015) fixed over-scaling of 1-3 star characters [S28]; March 2016 story difficulty change [S29];
  May 2017 scaling tied to clearance level, with players saying they would drop clearance to keep clear times
  short [S30] [V, E3/E4].

### 17-19. Hidden DDA found or suspected

- Resident Evil 4: hidden rank that eases enemies when the player fails; Capcom never stated it; publicised in 2015
  [S31][S32] [V, E3]. Remake status unclear [U].
- Crash Bandicoot 2: mask after about 6 deaths, checkpoint crates after about 6 more; remaster added DDA to Crash 1
  [S33][S34] [V, E2/E3]. Andy Gavin's own posts were not retrieved; whether Crash 1 had DDA conflicts across sources [U].
- EA: EOMM research (2017) can be tuned for "in-game time, or even spending"; patents describe DDA "undetectable by a
  user"; a class action alleged use in FIFA, Madden and NHL; the suit was dropped after plaintiffs got access to the
  tech [S35][S36][S37] [V, E3].

### 20. Flappy Bird

- Pulled in Feb 2014; Nguyen called it "an addictive product"; $50,000 a day was an estimate he did not confirm
  [S38][S39] [V, E2]; revenue [U].

## Key questions

### Q1. What happens at a planned wall in a short-session puzzle game?
Takeaway. It converts payers and churns everyone else, and the churn falls on slow, less persistent players.
Evidence #1, #3, #4. King's response was to shorten and ease the wall, then measure abandonment (#2).

### Q2. How should difficulty rise after the first clear?
Takeaway. Through an opt-in ladder, tuned per step, with the worst stacking case capped. Forced base-curve raises
were reverted (#10). Stacking modifiers had to be capped (#9). Ladder gaps were smoothed (#11). A designed end was
added when skill beat the old one (#13).

### Q3. How do players react to hidden adjustment?
Takeaway. It depends on direction and motive. Failure-triggered help that is capped went unnoticed or was forgiven
when found (#17, #18). Adjustment suspected of serving money, or of taxing good play, became a lasting trust problem
(#7, #19). Progress-linked scaling made players sandbag (#16).

### Q4. What does board tempo do?
Takeaway. Speeding up board animation splits players; readability of cascades is the limit (#14). A speed cap
works as an end only while skill cannot beat it (#13). A flat curve with instant retry is compelling on its own (#20).

## Recurring lessons

1. Hard beats must be short. Length times difficulty is the cost (#1, #2).
2. Measure abandonment per stage, not only deaths per stage (#2, #3, #4).
3. The players a spike loses are the slow and less persistent ones (#4, #5).
4. Raise post-win difficulty through an opt-in ladder; do not raise the base (#8, #10, #12).
5. Cap the worst random combination of modifiers (#9).
6. Make step 1 harder so step 2 is not a wall (#11).
7. Hidden help for strugglers is tolerated; hidden taxes on skill are not (#16-#19).
8. A top speed is an end only until skill beats it (#13).
9. Board speed is limited by readability, and players want a choice (#14).

## Pattern cards

### PC-NE7. Short hard beat
- Lineage. Candy Crush level 65 (2012) -> King's time-to-abandon metric and difficulty-dependent max length
  (GDC 2024). Why: long hard levels drove churn.
- Feeling. Challenge (MDA) that ends before frustration sets in.
- Mechanism. Max beat length L_max = f(difficulty), falling as difficulty rises. Hard elite = short elite.
- Works when attempts are cheap and many. Breaks when the hard beat is also a long gate.
- Evidence. #1, #2 [V, E2]; #3 [V, E1].
- Cost S. Knobs: elite and boss HP against damage, so time to kill drops while threat rises.
- MatchRPG. Elites at encounters 12 and 24 and the boss at 36 should be the most dangerous and among the shortest
  fights. Check median fight seconds per elite and boss in the run data.

### PC-NE8. Pass and abandon dashboard
- Lineage. King GDC talks (2016, 2024) -> Scientific Reports model (2020) -> Rovio Dream Blast (2020).
- Feeling. None directly. A measurement pattern.
- Mechanism. Per stage, track attempts to pass and attempts (or days) to abandon. A stage with high abandon and low
  pass is a wall; high pass and high abandon is boring.
- Works with many attempts per player. Breaks below about 20 players without pooling.
- Evidence. #2-#4 [V, E1/E2].
- Cost S. Uses existing run rows: world reached, run count per player, days since last run.
- MatchRPG. 859 runs by world reached 410/215/127/58/49 [K]. Runs reaching world 1+, 2+, 3+, 4: 52%, 27%, 12%, 6%.
  Each world keeps about half of the runs that reach it (52%, 52%, 46%, 46%) [K computed]. That reads as steady
  attrition, not one wall [I]. Runs ending is not churn: add "last run reached world N" per player, aggregated with
  min cell 3.

### PC-NE9. Opt-in ladder after the clear, worst case capped
- Lineage. Slay the Spire ascension -> Peglin Cruciball, Balatro stakes, Luck be a Landlord floors -> Peglin v1.0.6
  and Balatro 1.0.1f tuning.
- Feeling. Challenge and Discovery for players who want them; the base game stays tuned.
- Mechanism. Numbered levels, each adds one modifier. Rule: no combination may put more than K hard draws in one
  encounter.
- Breaks when a step is a big jump or modifiers stack into unplanned spikes.
- Evidence. #8-#11 [V, E2/E3].
- Cost M. Knobs: modifier per step, the cap K, reward per step.
- MatchRPG. Endless is one forced ramp (ENDLESS_POWER 0.12 per step past the bottom) [K]. A small opt-in ladder of
  named endless modifiers would replace part of that forced ramp, matching what LBAL's developer did.

### PC-NE10. Failure-triggered capped mercy
- Lineage. Crash Bandicoot 2 (1997) -> Resident Evil 4 (2005) -> N. Sane Trilogy (2017).
- Feeling. Relief and persistence without being told "you are bad".
- Mechanism. After N failures in a section, add one help (mask, checkpoint, slower obstacle). Cap at a few steps.
  Never raise difficulty from good performance in a way the player can feel as a tax.
- Breaks when players learn it and either sandbag or feel patronised, or when it is linked to spending.
- Evidence. #17, #18 [V, E2/E3]; failure case #19 [V, E3]; sandbagging #16 [V, E3/E4].
- Cost S.
- MatchRPG. EDGE_MERCY is this kind (supply-free pacing mercy near the edge) [K]. The mastery tier is the other
  kind: a pace-based DDA that raises the clock for quick players. Its "up at once, down after 5 slow runs" rule is
  where MPQ-style sandbagging and EA-style suspicion would come from [I].

### PC-NE11. Designed end for a speed ramp
- Lineage. NES Tetris level 29 (1989) -> rolling (2020) -> CTWC level 39 (2023).
- Feeling. Tension that resolves, versus fatigue in a run that will not end.
- Mechanism. A final speed step set above the best human tempo, reached at a known point.
- Breaks when skill or builds beat it, then the run turns into a marathon.
- Evidence. #13 [V, E3].
- Cost S. Knobs: MAX_SCROLL, the step past it, where it starts.
- MatchRPG. MAX_SCROLL 60 is a cap, not an end [K]. Endless median 559 s against story median 177 s [K]. If late
  endless runs drag, a "dark rush" step past a depth is the Tetris answer.

### PC-NE12. Board tempo with readability floor
- Lineage. Bejeweled cascades -> Gems of War 1.0.7 speed-up (2015).
- Feeling. Snappy board versus lost cascades.
- Mechanism. Animation speed for falls and matches set so the slowest-reading player can follow a cascade; offer a
  speed option rather than a single global change.
- Evidence. #14 [V, E3].
- Cost S.
- MatchRPG. The tier clock speeds the dungeon, not the board [K]. Keep board animation speed separate from the
  clock and consider a player option.

## Lessons for MatchRPG's four scope areas

1. Story run to the first clear. Treat elites and bosses with the short-hard rule (PC-NE7). The world funnel keeps
   about half the runs per world [K], which suggests no single wall [I]. Next check is per-player abandonment by
   last world reached, since King and Rovio show churn sits on slow players at the hard stage (#3, #4).
2. Endless after the win. Opt-in ladders were kept and forced raises reverted (#8-#11). ENDLESS_POWER compounding is
   a forced ramp [K]. Cap the worst shuffle combination (#9) and decide whether endless needs a designed end (#13).
3. Learning across runs. Hidden help for strugglers was forgiven (#17, #18); hidden adjustment seen as a tax or a
   money lever was not (#7, #16, #19). The tier raises the clock for quick players, and runs sit mostly on the fast
   tiers (gold 384, diamond 380, silver 81, bronze 14) [K]. Watch for sandbagging (deliberately slow runs) and frame
   the tier as a rank earned, never as a hidden handicap. Placebo framing is free (glossary).
4. Board pressure inside a run. EDGE_MERCY matches Crash's slowing obstacle [I]. MAX_SCROLL 60 is a cap that skill
   may beat (#13). Board animation tempo is limited by cascade readability (#14).

## Fun hypotheses

- A player meeting a world 1 elite in run 3 should feel a sharp, short spike (Challenge) that ends in under about
  20 s, because PC-NE7 says length times difficulty is what drives abandonment. [I]
- A diamond player told "Diamond: the dungeon runs faster for you" should feel status, not tax, because RE4 and
  Crash show framing and direction decide whether adjustment is resented. [I]

## Anti-patterns

- A finale-hard stage that is also long (Candy Crush 65 before the eased version).
- Raising the base curve for everyone to serve experts (Luck be a Landlord, before floors).
- Stacked random modifiers that can roll several hard threats at once (Peglin C19 before v1.0.6).
- Silent enemy level jumps (Gems of War Underspire).
- Scaling tied to progress that rewards playing badly (MPQ clearance scaling).
- Hidden adjustment with a plausible money motive (EA, Candy Crush suspicion).

## Glossary additions

- Pass rate. Share of attempts at a stage that succeed. King and Rovio's base difficulty measure.
- Time to abandon. Attempts or days before a player stops playing at a stage. King's engagement measure.
- Sandbagging. Playing below ability to stay on an easier tier or scaling band (MPQ 2017).
- Kill screen. A speed step meant to end the run; here, level 29 and level 39 in NES Tetris.

## Gaps

- Puzzle & Dragons stamina and rank changes: no dated change with reaction found in one search.
- Empires & Puzzles: no difficulty-scaling backlash found.
- Slay the Spire ascension and Heart win rates: only anecdotes; a "3%" A20 figure has no clear source.
- Hades heat, Vampire Survivors curse and hyper, Tetris 99, Subway Surfers and Temple Run speed changes: nothing
  dated and measured found.
- Balatro 1.0.1f exact stake numbers conflict. Peglin 1.0 date, Dead Cells Whack-a-Mole date, Gems of War 4.5 and
  Underspire dates not verified.
- Columbia brief and Slay the Spire 2 win-rate article returned 403; figures are from search summaries.

## See it in action

- Candy Crush level 65: https://www.pocketgamer.biz/king-on-finding-the-fun-in-candy-crush
- Balatro 1.0.1: https://www.videogameschronicle.com/news/balatros-first-major-update-tweaks-difficulty-adds-new-joker-types
- Peglin Cruciball: https://peglin.wiki.gg/wiki/The_Cruciballic_Cauldron
- Dead Cells Update 19: https://dead-cells.com/patchnotes/19
- CTWC level 39: https://en.wikipedia.org/wiki/Classic_Tetris_World_Championship
- Resident Evil 4 hidden difficulty: https://www.engadget.com/2015-06-03-resident-evil-4-difficulty.html
- Gems of War 1.0.7 thread: https://community.gemsofwar.com/t/the-1-0-7-speed-change-complaint-dogpile-thread/1119

## Sources

- [S1] mobilegamer.biz, How King defines a good Candy Crush Saga level, 27 Mar 2024. https://mobilegamer.biz/how-king-defines-a-good-candy-crush-saga-level-and-why-it-constantly-prunes-the-bad-ones/
- [S2] Pocket Gamer.biz, King on finding the fun in Candy Crush. https://www.pocketgamer.biz/king-on-finding-the-fun-in-candy-crush
- [S3] Apple App Store story, Behind the scenes (Candy Crush level 65). https://apps.apple.com/no/story/id1297938529
- [S4] Scientific Reports, s41598-020-60742-8 (Candy Crush pass and abandon). https://link.springer.com/10.1038/s41598-020-60742-8 ; PMC copy https://pmc.ncbi.nlm.nih.gov/articles/PMC7058085
- [S5] Pocket Gamer.biz, Crafting Candy Crush's difficulty, 16 Jan 2026. https://www.pocketgamer.biz/crafting-candy-crushs-difficulty-blockers-level-design-ai-and-the-complexity-staircase/
- [S6] Deceptive Patterns, Candy Crush Saga impossible levels, 9 Nov 2016. https://deceptive.design/articles/candy-crush-saga-impossible-levels
- [S7] Roohi et al., Predicting Game Difficulty and Churn Without Players, arXiv 2008.12937. https://arxiv.org/abs/2008.12937
- [S8] Columbia Business School brief, Easier games, more revenue. https://business.columbia.edu/research-brief/digital-future/easier-games-more-revenue
- [S9] Ascarza, Netzer, Runge working paper. https://business.columbia.edu/sites/default/files-efs/citation_file_upload/ascarza_netzer_runge_2023-12-04.pdf
- [S10] VGC, Balatro's first major update. https://www.videogameschronicle.com/news/balatros-first-major-update-tweaks-difficulty-adds-new-joker-types
- [S11] Press Start, Balatro update makes winning easier, 8 Apr 2024. https://press-start.com.au/news/2024/04/08/the-latest-balatro-update-has-some-massive-changes-that-should-make-winning-easier/
- [S12] PC Gamer, Peglin is finished. https://pcgamer.com/games/goblin-pachinko-roguelike-peglin-is-finished-complete-with-some-clutch-reworks
- [S13] SteamDB Peglin patch notes. https://steamdb.info/patchnotes/15508145 ; https://steamdb.info/patchnotes/16449497
- [S14] Trampoline Tales / SteamDB Luck be a Landlord patch notes. https://steamdb.info/patchnotes/9723615
- [S15] Rogueliker, Luck be a Landlord review. https://rogueliker.com/luck-be-a-landlord-review/
- [S16] Dead Cells patch notes, Update 19. https://dead-cells.com/patchnotes/19
- [S17] Destructoid, Dead Cells smoothed out its difficulty curve. https://destructoid.com/?p=252740
- [S18] Destructoid, Dead Cells has a new difficulty curve (Whack-a-Mole). https://www.destructoid.com/dead-cells-has-a-new-difficulty-curve-and-more-mutations-to-play-around-with/
- [S19] Rogue Legacy 2 v0.6.0 patch notes. https://roguelegacy2.com/patchnotes/v060
- [S20] Rogue Legacy 2 v1.2.1 patch notes. https://roguelegacy2.com/patchnotes/v121
- [S21] Game Rant, Rogue Legacy 2 House Rules and achievements. https://gamerant.com/rogue-legacy-2-difficulty-house-rules-achievements/
- [S22] Wikipedia, Classic Tetris World Championship. https://en.wikipedia.org/wiki/Classic_Tetris_World_Championship
- [S23] Tetris Interest, Alex T wins 2024 CTWC. https://tetrisinterest.com/alex-t-wins-the-2024-classic-tetris-world-championship
- [S24] Tetris Interest, Fractal and PixelAndy become second and third to beat NES Tetris. https://tetrisinterest.com/?p=2575
- [S25] Gems of War forum, 1.0.7 speed change thread, Oct-Nov 2015. https://community.gemsofwar.com/t/the-1-0-7-speed-change-complaint-dogpile-thread/1119
- [S26] Gems of War forum, Large difficulty increase for Underspire battles. https://community.gemsofwar.com/t/investigating-large-difficulty-increase-for-underspire-battles/81241
- [S27] Gems of War, 4.5 Update. https://gemsofwar.com/4-5-update/
- [S28] D3 Go forums, R69 patch notes 19 Jan 2015. https://forums.d3go.com/discussion/22348/all-new-r69-patch-notes-1-19-15
- [S29] D3 Go forums, New mission difficulty for all story events. https://forums.d3go.com/discussion/47761/new-mission-difficulty-for-all-story-events-updated
- [S30] D3 Go forums, Scaling tied to S.H.I.E.L.D. clearance levels, 25 May 2017. https://forums.d3go.com/discussion/comment/686619
- [S31] Engadget, Resident Evil 4 secretly adjusted its difficulty, 3 Jun 2015. https://www.engadget.com/2015-06-03-resident-evil-4-difficulty.html
- [S32] SVG, Does Resident Evil 4 Remake still feature dynamic difficulty. https://svg.com/1239602/does-resident-evil-4-remake-still-feature-the-originals-dynamic-difficulty
- [S33] CGMagazine/COGconnected, Why Crash N. Sane Trilogy is so difficult. https://cogconnected.com/2017/07/crash-bandicoot-difficulty-vv/
- [S34] Wikipedia, Crash Bandicoot (video game). https://en.wikipedia.org/wiki/Crash_Bandicoot_(video_game)
- [S35] PC Gamer, Class action lawsuit claims EA's dynamic difficulty tech encourages loot box spending. https://www.pcgamer.com/class-action-lawsuit-claims-eas-dynamic-difficulty-tech-encourages-loot-box-spending
- [S36] TechRaptor, EA patent on engagement matchmaking. https://techraptor.net/content/ea-filed-patent-online-matchmaking-algorithm-focusing-player-engagement
- [S37] TheGamer, EA loot box lawsuit dropped. https://www.thegamer.com/ea-loot-box-lawsuit-dropped-after-company-gives-plaintiffs-tech-access/
- [S38] MacRumors, Flappy Bird pulled, addictive product, 11 Feb 2014. https://www.macrumors.com/2014/02/11/flappy-bird-pulled-addictive-product/
- [S39] MacRumors, Flappy Bird creator interview, 11 Mar 2014. https://www.macrumors.com/2014/03/11/flappy-bird-dong-nguyen-interview
