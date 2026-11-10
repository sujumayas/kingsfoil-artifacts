# 06 Designer sources (E2)

Researcher 4. Angle: what designers of MatchRPG's twins said about difficulty, pacing and learning curves, and why.
About 28 tool calls. Hearthguard already covers Slay the Spire ascension (Giovannetti GDC 2019), Hades God Mode and
Heat, King's level 65 and pass rate, King's bots, Celeste, L4D. I cite those from Hearthguard's report instead of
re-researching them (`studies/curves-hearthguard/report.md`, sources S34-S37, S46, S48).

Scope areas, used as tags below: **S1** story descent, **S2** endless, **S3** learning across runs, **S4** board pressure.

---

## Q1. What did the direct ancestors' designer (Luca Redwood) say about run length, pressure and upgrades?

**Takeaway.** Redwood designed for short goes that always pay something, a fixed goal with an ending, and real time
pressure that touch and mouse players feel differently. He called his own post-ending endless mode "a bit of a cop
out". He never published a rule for his difficulty curve beyond "slightly easier at the start, slightly more
difficult at the end" for the PC version.

**Cited findings**
- Every go must progress the game "a little bit", even a 30-second session. A run with no completed objectives
  still earns money for a small upgrade. Runs load in the background for "next to no load time". [V, E2]
  PocketGamer.biz, 5 Aug 2015. https://www.pocketgamer.biz/making-of-you-must-build-a-boat/ (S3)
- You Must Build A Boat is "incredibly time sensitive with a lot of time pressure". Touch players are faster early,
  mouse players slightly faster by the end. Balancing the two input methods was the hardest design problem. [V, E2]
  Same source. (S4)
- The PC difficulty curve is "slightly easier at the start, and slightly more difficult at the end". He balanced
  against a target list with playtesters and admits "a lot of variability" and a skew from "thousands of hours" of
  his own play. Good players must not overpower their characters and plow through. [V, E2] Same source. (S1, S3)
- Tiles are tight verbs (swords physical, staffs magic, keys chests, shields defence). He dropped generic tiles that
  could do anything. He cut the top running strip at one point (turned into a pet battler) and cut a
  choose-your-own-adventure layer with hundreds of encounters. He rejected free-to-play because buying past the
  journey would have "short circuited" the game. [V, E2] Same source. (S4)
- 10000000 averages "6-8 hours" to finish. "The biggest praise and the biggest criticism... is that it ends." The
  post-game "Endless Mode Unlocked" was "a bit of a cop out"; he planned refit challenges and leaderboards instead.
  He rejects about 95% of feature ideas. Sales: about 10,000 in the first days, over 50,000 in the first month. [V, E2]
  Game Informer, 26 Dec 2012. https://gameinformer.com/b/features/archive/2012/12/26/afterwords-10000000.aspx (S1, S2)
- Why 10,000,000: the title states the goal up front, against free-to-play games where "you don't know what you're
  getting". The 10000000 Steam port took about three months because many numbers had to change to match the touch
  version. [V, E2] No Don't Die interview, 17 May 2015. https://nodontdie.com/interviews/luca-redwood (S1, S4)
- Designer Notes 66 (Soren Johnson, recorded 18 Mar 2019) covers "how he makes sure the player never gets unlucky".
  The page has no transcript. [V, E2 for the topic only] https://designer-notes.com/designer-notes-66-luca-redwood (S4)

**Inferences**
- MatchRPG's `LOST_FIGHT_XP` 0.5 and the gold/wood/stone carry-over follow the "every go pays" rule [I]. The telemetry
  can check it: a story run of 177 s median [K] should always end with at least one affordable upgrade or visible
  progress for runs 1-20.
- Redwood's touch-versus-mouse finding is a direct warning for the tier clock. MatchRPG measures pace in moves per
  second; if desktop and phone players differ in early and late speed, a single pace number may put a mouse player in
  the wrong tier early and a touch player in the wrong tier late [I]. Agent 0b could split tier placement by platform
  if the data has it.
- Redwood's own verdict on endless (cop out) is the strongest designer warning for scope 2. He wanted challenges and
  leaderboards after the ending, not more of the same [I].

**Gaps.** The "never unlucky" mechanism in 10000000 is unconfirmed (audio only). No Redwood statement on the scroll
speed, the left-edge catch-up, or any hidden mercy was found. TouchArcade's development notes
(https://toucharcade.com/2015/05/07/luca-redwoods-10000000-development-notes) were not read.

---

## Q2. Puzzle Quest: what did Infinite Interactive learn about luck and AI on a shared board?

**Takeaway.** Players only call a match-3 fight fair when they are lucky two to three times more often than the AI.
Fawkner's team patched the game to quietly reduce the AI's luck and made the AI miss chances on purpose.

**Cited findings**
- Focus testing said the enemy "always felt like it was cheating". The team tracked lucky events (skull drops,
  four-of-a-kind setups). Lucky events for the player felt natural; the same events for the AI felt like cheating.
  Players need to be lucky 2-3x more often than the CPU before a game feels fair. A post-launch patch sometimes swapped
  the AI's lucky cascade for a less useful one; the player's grid never got that change. [V, E2] Kotaku, 19 Sep 2025.
  https://kotaku.com/the-match-3-rpg-that-started-it-all-is-back-and-we-talk-to-its-legendary-creator-2000626834 (S4)
- The AI was programmed to make mistakes and miss chances; more mistakes made it feel more human. [V, E2] Same source.
- The Immortal Edition remake turned "Mana Drain" (both sides lose all mana when the board locks) into "Mana Storm"
  (mana split between sides) because the old rule "always felt bad". [V, E2] Same source. (S4)
- For Puzzle Quest 2 and Galactrix the AI and gem code was published so players could check there was no cheating.
  [U, E2] Reported in search summaries of Fawkner's "Sirrian" forum posts; not opened.
  https://infinityplus2.freshdesk.com/support/solutions/articles/150000205918-ai-cheating-in-gems-of-war (S4)

**Inferences**
- MatchRPG has no AI opponent, but enemy encounters and traps are the "opponent's luck". The pillar "Mercy is hidden"
  matches Puzzle Quest's fix exactly. Bias the random draw for the player, never against [I].
- A rule that wipes the player's resources on a stuck board reads as punishment. If MatchRPG ever reshuffles a locked
  board, it should keep the player's charge [I].

---

## Q3. King, Dream Games and match-3 level designers: cadence, length, pruning

**Takeaway.** King varies difficulty on purpose (a hard level is often followed by an easier one), keeps hard levels
short, measures fun as time-to-abandon and time-to-pass, and prunes its 100 least fun levels. Long-term retention beat
short-term conversion in its first A/B test.

**Cited findings**
- Fun is a mix of "time to abandon" and "time to pass". Hard levels can be fun; easy levels can be dull. Churn alone
  cannot tell bad from hard. Players are profiled by wins, losses and attempts per level. [V, E2] Wedekind and
  Guardiola at GDC 2024, reported by mobilegamer.biz, 27 Mar 2024.
  https://mobilegamer.biz/how-king-defines-a-good-candy-crush-saga-level-and-why-it-constantly-prunes-the-bad-ones/ (S1, S3)
- "The longer the level is, the less likely it is to be fun." Harder levels should be shorter. "Crazy hard levels
  never pay off, at least in the long term." [V, E2] Same source. (S1, S4)
- King's first post-launch A/B test: harder raised short-term conversion, easier kept players longer and they later
  spent more. King fixes its 100 least fun levels and calls the uplift "very significant" (no number given; vendor
  claim). [V, E2] Same source. (S1)
- "There's a deliberate effort to vary difficulty." A hard level is often followed by an easier one. A "complexity
  staircase" gives new players simple blockers and long-term players complex ones. New blockers have no fixed cadence.
  Bots predict pass rates but not feel. Candy Crush has over 20,000 levels. [V, E2] John Davies (King), PocketGamer.biz,
  16 Jan 2026. https://www.pocketgamer.biz/crafting-candy-crushs-difficulty-blockers-level-design-ai-and-the-complexity-staircase/ (S1, S3)
- Royal Match: Hard and Super Hard labels arrive at levels 45 and 59, about one of each every 10 levels, with an easy
  "blasty" level after each Super Hard. Analyst teardown, not Dream Games. Another analysis puts the first label at 39.
  [U, E3] https://medium.com/@chrisjameswallace/royal-kingdom-the-next-puzzle-hit-from-dream-games-c7395e26b185 (S1)
- About 80% of match-3 revenue comes from buying moves after a loss (analyst estimate). [U, E3] Same source.

**Inferences**
- MatchRPG's elites at encounters 12 and 24 and a boss at 36 are a world sawtooth with a fixed cadence of 12 [K]. King
  and Royal Match add a relief beat after each peak; MatchRPG should check that encounters 13 and 25 are easy [I].
- "Harder means shorter" applies to elite and boss fights. Measure fight seconds at elites and bosses against normal
  encounters; a long, hard fight is the worst case in King's model [I].
- Time-to-abandon and time-to-pass translate directly. Per world and per elite, compute seconds until death and
  seconds until clear from `runs.jsonl` [I]. King prunes the bottom 100 of 20,000 levels (0.5%); MatchRPG has 180 story
  encounters, so "prune the worst 3-5 encounter types" is the matching scale [I].
- Labels like "Hard level" are a cheap telegraph. MatchRPG could show an elite or boss warning on the board, which
  also fits the pillar that warnings must reach the board [I].

**Gaps.** No primary Dream Games, Peak or Playrix talk on difficulty was found. Lucien Chen's GDC "Blockers" talk
(https://gdcvault.com/play/1026813/Blockers-Analyzing-Difficulty-Drivers-in) was seen as a listing only.

---

## Q4. Roguelite designers: ladders, fairness floors, short retries

**Takeaway.** The roguelite designers who touched difficulty in public did three things. They smoothed the middle of
the ladder, guaranteed the player can always keep playing, and removed any signal that a retry is a loss.

**Cited findings**
- Balatro 1.0.1f (May 2024) lowered early and mid antes and raised late ones on harder stakes. White ante 3 went
  2800 to 2000 and ante 4 6000 to 5000. Green ante 3 3200 to 2600, ante 8 90,000 to 100,000. Purple ante 3 3600 to 3200,
  ante 8 180,000 to 200,000. The article quotes no rationale from LocalThunk. [V, E1 for the numbers, patch-note level]
  https://press-start.com.au/news/2024/04/08/the-latest-balatro-update-has-some-massive-changes-that-should-make-winning-easier/ (S1, S2)
- Super Hexagon: the music "starts in a random place" after each death, because a restart from the top would make the
  player feel they had lost. Restarts are short so "you just go right back into it". Failure should not feel like a
  loss. [V, E2] Cavanagh, Fantastic Arcade panel via Engadget, 21 Sep 2012.
  https://www.engadget.com/2012-09-21-terry-cavanagh-goes-inside-super-hexagon.html (S3, S4)
- Luck be a Landlord: if paying rent leaves 0 coins, the game gives one coin so the player can still spin. DiIorio
  aims that players never think the game is not fair. He also makes forced strategies succeed less often.
  [V, E2] TrampolineTales blog, 29 May 2023. https://blog.trampolinetales.com/questions-and-danswers/ (S4)
- Peglin's Cruciball is an "unlockable difficulty ladder" that appears after a base-run win. 7 levels shipped in
  v0.7.20 (19 May 2022), 8-12 planned. [V, E2] https://gedig.itch.io/peglin/devlog/383097/the-first-cruciball-levels-are-here-v0720
  One player calls it a jump from "extremely easy" to an "RNG fest" in a few levels. [V, E4]
  https://steamcommunity.com/app/1296610/discussions/0/7336985071474236410 (S2)
- Slay the Spire's balance on base difficulty with 20 ascensions on top, Hades Heat inspired by Ascension, and Hades
  God Mode (20% plus 2% per death, cap 80%) are in Hearthguard [V, E2, Hearthguard S34-S36].

**Inferences**
- Balatro's change is the model for an endless lap curve. Flatten the step where players first stall, steepen the
  end. In MatchRPG, the runs-by-world funnel (410, 215, 127, 58, 49 [K]) shows the steepest drop from world 0 to 1 and
  2 to 3; those are the "antes 3-4" to look at first [I].
- Super Hexagon's music trick is a free way to cut felt cost of failure. MatchRPG could avoid a "you lost" screen beat
  that resets the music, and land the player back in the descent map quickly [I].
- LBaL's coin-on-zero is a hidden floor of the same family as `EDGE_MERCY`. Both are fixed rules, not DDA, since they
  do not measure performance over time [I].
- MatchRPG endless after the win has `ENDLESS_POWER` 0.12 per step but no player-chosen ladder [K]. Every twin here
  (Peglin, Spire, Hades, Balatro stakes) adds an opt-in numbered ladder after the first clear [I].

**Gaps.** No primary LocalThunk rationale for the ante curve was found. Dicey Dungeons and Mega Crit were not
searched beyond Hearthguard. poncle's PC Gamer interview did not load (body cut off). Vampire Survivors run lengths
(15, 20, 30 minutes) are in Hearthguard [V, E3, Hearthguard S90].

---

## Q5. Endless runners, Tetris, Puzzle & Dragons

**Takeaway.** Designer statements on the endless-runner speed ramp were not found. Only community and secondary
sources describe Temple Run's speed-up and TGM's grading. Treat this area as E3 at best.

**Cited findings**
- Luke Muscat's GDC 2012 talk "Depth in Simplicity: The Making of Jetpack Joyride" is a design postmortem of a
  one-button game. Contents on missions not confirmed. [V, E2 listing only] https://www.gdcvault.com/play/1015527/
- Missions systems usually keep three active at once and work well in endless games (Jetpack Joyride named).
  [V, E3] https://gamedeveloper.com/design/10-ways-to-retain-your-players (S2, S3)
- Temple Run 2 was rebuilt "from the ground up" (Keith Shepherd); nothing on speed. [V, E2]
  https://www.pocketgamer.biz/interview/47968/starting-from-scratch-how-imangi-studios-set-out-to-top-temple-run/
- TGM's fall speed reaches 20G at level 500; grades run 9 to 1, then S1 to S9. Mihara reportedly took 20G from
  Shimizu Tetris (single forum post). [V, E3; U for the origin] https://tetris.wiki/TGM (S4, S3)
- Puzzle & Dragons: Morishita credits a very easy start where you level up enough to recover stamina. [V, E2]
  https://www.siliconera.com/gungho-ceo-talks-about-picotto-knights-working-with-grasshopper-manufacture/ (S1, S3)

**Inferences**
- TGM's grade is the closest twin to MatchRPG's visible tier. A grade measures skill as a reward, while MatchRPG's
  tier also sets a hidden clock [K]. TGM keeps speed visible and fixed by level; MatchRPG's clock is hidden [I].
- Missions give endless a goal list. Redwood's planned refit challenges and Jetpack's three missions point the same
  way for MatchRPG's endless (scope 2) [I].

**Gaps.** No Imangi, Halfbrick or SYBO statement on speed ramps, no Arika interview text, no Small Giant talk, no
Daisuke Yamamoto statement on dungeon difficulty. No designer statement on hidden rubber banding in casual puzzle
games beyond Puzzle Quest's AI-luck patch.

---

## Pattern cards

### P1. Player-favoured luck bias
- Lineage: Puzzle Quest focus tests (2007) -> post-launch AI-luck patch -> Gems of War code-sharing (Infinity Plus 2).
- Feeling: Challenge without suspicion. The player credits wins to skill.
- Mechanism: when the opponent or hazard rolls a lucky cascade, sometimes reroll it. Never reroll the player's. Target
  player luck at 2-3x the opponent's.
- Works when the board is shared or hazards are random. Breaks if players notice a pattern.
- Evidence: Fawkner, Kotaku 2025 [V, E2].
- Cost: S. Knob: reroll chance on hazard draws.
- MatchRPG: apply to trap and elite draws on the board, never to the player's tile drops. Fits "Mercy is hidden".
- See it in action: https://kotaku.com/the-match-3-rpg-that-started-it-all-is-back-and-we-talk-to-its-legendary-creator-2000626834

### P2. Every go pays
- Lineage: 10000000 (2012) -> You Must Build A Boat (2015) -> roguelite meta-progression generally.
- Feeling: Submission and steady progress. No wasted run.
- Mechanism: a failed run with zero objectives still earns enough for one small upgrade. Load the next run at once.
- Breaks when the upgrade is too small to notice, or so big it replaces skill.
- Evidence: Redwood, PocketGamer.biz 2015 [V, E2].
- Cost: S. Knobs: `LOST_FIGHT_XP`, minimum gold per run.
- MatchRPG: check in telemetry that every run in runs 1-20 ends with an affordable upgrade.
- See it in action: https://www.pocketgamer.biz/making-of-you-must-build-a-boat/

### P3. Hard then easy (relief beat after a peak)
- Lineage: Candy Crush varied levels -> Royal Match Hard/Super Hard every ~10 with an easy level after.
- Feeling: Challenge, then relief.
- Mechanism: after each spike place a short, easy beat. Label the spike.
- Breaks with no warning, or if the easy beat is too long and dull.
- Evidence: Davies (King) 2026 [V, E2]; Royal Match cadence [U, E3].
- Cost: S. Knobs: encounter weights for slots 13, 25 and the first steps of a new world.
- MatchRPG: guarantee easy encounters after elites 12 and 24 and after each boss. Put an elite warning on the board.
- See it in action: https://www.pocketgamer.biz/crafting-candy-crushs-difficulty-blockers-level-design-ai-and-the-complexity-staircase/

### P4. Harder means shorter
- Lineage: King GDC 2024 (Guardiola).
- Feeling: Challenge without tedium.
- Mechanism: cap a beat's length by its difficulty. A hard fight is short and sharp.
- Breaks when a long fight is the only way to show a boss's scale.
- Evidence: [V, E2] mobilegamer.biz 2024.
- Cost: S. Knobs: elite and boss HP against `ELITE_HIT`.
- MatchRPG: measure fight seconds at elites and bosses against loss rate there.
- See it in action: https://mobilegamer.biz/how-king-defines-a-good-candy-crush-saga-level-and-why-it-constantly-prunes-the-bad-ones/

### P5. Time-to-abandon and pruning the worst beats
- Lineage: King pass rate and attempts (Hearthguard S46) -> time-to-abandon / time-to-pass, bottom-100 pruning (2024).
- Feeling: none directly. A measurement pattern.
- Mechanism: per beat, record seconds until quit or death and seconds until clear. Fix the bottom few each version.
- Works with enough plays per beat. With 21 players MatchRPG needs encounter types, not single slots.
- Evidence: [V, E2] King 2024.
- Cost: S (data exists).
- MatchRPG: rank encounter types by deaths per appearance and seconds stuck, fix the worst 3-5 per version.
- See it in action: same URL as P4.

### P6. Retry without a loss signal
- Lineage: Super Meat Boy instant respawn (Hearthguard S32) -> Super Hexagon random music start (2012).
- Feeling: Challenge with low felt cost of failure.
- Mechanism: restart in about a second; keep music and mood running instead of resetting.
- Breaks when meta-progression needs a results screen to show rewards.
- Evidence: Cavanagh via Engadget 2012 [V, E2].
- Cost: S. Knob: seconds from death to control.
- MatchRPG: show rewards briefly, then return to the descent map fast. Measure time to retry.
- See it in action: https://www.engadget.com/2012-09-21-terry-cavanagh-goes-inside-super-hexagon.html

### P7. Fairness floor
- Lineage: Luck be a Landlord coin-on-zero (2021-23) -> related to Hades God Mode (stacking assist, different kind).
- Feeling: Challenge felt as fair.
- Mechanism: when a rule would end the run with no choice left, grant the minimum to keep playing.
- Breaks when players learn to exploit it.
- Evidence: DiIorio 2023 [V, E2].
- Cost: S.
- MatchRPG: `EDGE_MERCY` is already this family. Check low-HP seconds for a similar floor (for example a last potion
  nudge on the board).
- See it in action: https://blog.trampolinetales.com/questions-and-danswers/

### P8. Smooth the stall step, steepen the end
- Lineage: Balatro 1.0.1f stake rebalance (May 2024).
- Feeling: Challenge that rises without a wall in the middle.
- Mechanism: lower the targets where most runs first die, raise the final ones to keep the ceiling.
- Evidence: patch numbers [V, E1]; rationale not found.
- Cost: S. Knobs: `DEPTH_POWER`, per-world multipliers, `ENDLESS_POWER`.
- MatchRPG: the funnel shows world 0 to 1 and 2 to 3 as the big drops; soften those, keep world 4 and the boss hard.
- See it in action: https://press-start.com.au/news/2024/04/08/the-latest-balatro-update-has-some-massive-changes-that-should-make-winning-easier/

### P9. Opt-in ladder after the first clear
- Lineage: Diablo 3 Monster Power -> Slay the Spire Ascension -> Hades Heat (Hearthguard) -> Peglin Cruciball (2022).
- Feeling: Challenge, Expression.
- Mechanism: after the first win, unlock numbered levels, each adding one modifier.
- Breaks when steps are uneven (Cruciball complaint).
- Evidence: Red Nexus devlog 2022 [V, E2]; player complaint [V, E4].
- Cost: M.
- MatchRPG: an endless ladder of named modifiers on top of `ENDLESS_POWER` gives the "challenges" Redwood wanted.
- See it in action: https://gedig.itch.io/peglin/devlog/383097/the-first-cruciball-levels-are-here-v0720

### P10. Ending first, endless as a goal list
- Lineage: 10000000's ending and its "cop out" endless mode (2012) -> Jetpack Joyride missions (2011) -> refit challenges planned by Redwood.
- Feeling: Narrative (the ending), then Challenge.
- Mechanism: after the win, give endless named goals (3 active missions, leaderboards) instead of only more scaling.
- Evidence: Redwood 2012 [V, E2]; missions [V, E3].
- Cost: M.
- MatchRPG: endless median is 559 s [K]; add 3 rotating endless goals and check if endless runs per player rise.
- See it in action: https://gameinformer.com/b/features/archive/2012/12/26/afterwords-10000000.aspx

### P11. Input-aware pacing
- Lineage: 10000000 touch-to-PC port (three months of number changes) -> YMBAB built for both from day one.
- Feeling: Challenge matched to the device.
- Mechanism: tune or measure pace per input method; early and late speeds differ by device.
- Evidence: Redwood 2015 [V, E2].
- Cost: S to M.
- MatchRPG: the tier clock is a pace-based DDA. Check whether tier placement differs by platform before trusting one
  pace number for both.
- See it in action: https://nodontdie.com/interviews/luca-redwood

## Glossary additions
- Player-favoured luck bias. A fixed rule that rerolls the opponent's or hazard's lucky draws, never the player's.
  Not DDA, because it does not measure performance. Source: Fawkner 2025.
- Time to abandon / time to pass. Seconds a player spends on a beat before quitting or before clearing it. King's
  fun measure. Source: King GDC 2024.
- Difficulty label. A visible tag on a hard beat ("Hard level") that tells the player the spike is intended. Source:
  match-3 practice (Royal Match).

## Sources
1. PocketGamer.biz, Against the current: the making of You Must Build a Boat, 5 Aug 2015. https://www.pocketgamer.biz/making-of-you-must-build-a-boat/
2. Game Informer, Afterwords: 10000000, 26 Dec 2012. https://gameinformer.com/b/features/archive/2012/12/26/afterwords-10000000.aspx
3. No Don't Die, Luca Redwood interview, 17 May 2015. https://nodontdie.com/interviews/luca-redwood
4. Designer Notes 66, Luca Redwood, recorded 18 Mar 2019. https://designer-notes.com/designer-notes-66-luca-redwood
5. Kotaku, Puzzle Quest creator interview, 19 Sep 2025. https://kotaku.com/the-match-3-rpg-that-started-it-all-is-back-and-we-talk-to-its-legendary-creator-2000626834
6. Infinity Plus 2, AI cheating in Gems of War (not opened). https://infinityplus2.freshdesk.com/support/solutions/articles/150000205918-ai-cheating-in-gems-of-war
7. mobilegamer.biz, How King defines a good Candy Crush Saga level, 27 Mar 2024. https://mobilegamer.biz/how-king-defines-a-good-candy-crush-saga-level-and-why-it-constantly-prunes-the-bad-ones/
8. PocketGamer.biz, Crafting Candy Crush's difficulty, 16 Jan 2026. https://www.pocketgamer.biz/crafting-candy-crushs-difficulty-blockers-level-design-ai-and-the-complexity-staircase/
9. GDC Vault, Blockers: Analyzing Difficulty Drivers in Candy Crush Games (listing). https://gdcvault.com/play/1026813/Blockers-Analyzing-Difficulty-Drivers-in
10. Wallace, Royal Kingdom teardown (Medium). https://medium.com/@chrisjameswallace/royal-kingdom-the-next-puzzle-hit-from-dream-games-c7395e26b185
11. Press Start, Balatro 1.0.1 ante changes, 2024. https://press-start.com.au/news/2024/04/08/the-latest-balatro-update-has-some-massive-changes-that-should-make-winning-easier/
12. Engadget, Terry Cavanagh goes inside Super Hexagon, 21 Sep 2012. https://www.engadget.com/2012-09-21-terry-cavanagh-goes-inside-super-hexagon.html
13. TrampolineTales, Questions and Danswers, 29 May 2023. https://blog.trampolinetales.com/questions-and-danswers/
14. Red Nexus, Cruciball devlog v0.7.20, 19 May 2022. https://gedig.itch.io/peglin/devlog/383097/the-first-cruciball-levels-are-here-v0720
15. Steam discussion on Cruciball steps. https://steamcommunity.com/app/1296610/discussions/0/7336985071474236410
16. GDC Vault, Depth in Simplicity: The Making of Jetpack Joyride (Muscat, 2012). https://www.gdcvault.com/play/1015527/
17. Game Developer, 10 ways to retain your players. https://gamedeveloper.com/design/10-ways-to-retain-your-players
18. PocketGamer.biz, Imangi on Temple Run 2. https://www.pocketgamer.biz/interview/47968/starting-from-scratch-how-imangi-studios-set-out-to-top-temple-run/
19. Tetris Wiki, TGM. https://tetris.wiki/TGM
20. Siliconera, Morishita on Picotto Knights and Puzzle & Dragons. https://www.siliconera.com/gungho-ceo-talks-about-picotto-knights-working-with-grasshopper-manufacture/
21. TouchArcade, 10000000 development notes (not read). https://toucharcade.com/2015/05/07/luca-redwoods-10000000-development-notes
22. Hearthguard Curves report (Spire, Hades, King level 65, bots, Vampire Survivors). `studies/curves-hearthguard/report.md`

Blocked or empty: PC Gamer poncle interview (body cut off). Designer Notes episode has no transcript.
