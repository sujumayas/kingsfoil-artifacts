# 07. Difficulty curve, failure and assists

Researcher 07. Scope: difficulty in restart-heavy precision platformers and runners, the troll lineage, assists,
skill ceiling vs floor, telemetry, onboarding. Vocabulary follows the Curves glossary in
`docs/formats/design-curves.md` (sawtooth, skill atom, cost of failure, time to retry, assist mode, failure as
information, Juul's four punishment types). Already-researched items (Celeste Assist Mode options, Hades God Mode
numbers, Juul's punishment types, the Left 4 Dead director) are cited from
`studies/curves-hearthguard/notes/00a-glossary-theory.md` and `00b-glossary-practice.md` instead of re-researched.

Labels: [K] Kingsfoil fact from `01-current-build.md`; [V, En] verified against a source with evidence grade n
(E1 telemetry or code, E2 designer statement, E3 community consensus, E4 single post or critic); [I] inference;
[U] unverified search snippet. Sources are numbered [Sn] at the end.

SpeedRunner baseline for every question [K]: death freezes the hero 0.38 s, then the whole map restarts through the
3-2-1 countdown, so time to retry is about 3.4 s. `R` also goes through the countdown. Checkpoints are splits only.
FIRST STEPS is 6830 u wide, at least 16 s of pure running at 420 u/s. No telemetry beyond starts and finishes.

---

## Q1. Cost of failure and time to retry

**Takeaway.** Every structural twin that is restart-heavy puts time to retry under about half a second, and the
designers say so in the same words: "the penalty is how much time it takes to start playing again" (McMillen).
SpeedRunner's 3.4 s is 7 to 10 times the genre norm, and the 3 s countdown is the whole excess. Drop the countdown on
death and on `R` (keep it for the very first attempt of a session if you want a ritual), and the cost of failure
becomes exactly what it should be in a time attack: the seconds of the run you lose, not a wait.

**Cited findings.**
- Super Meat Boy. McMillen: "The time it takes for Meat Boy to die and respawn is almost instantaneous." Levels are
  "bite-sized"; "It was imperative that the action never stop, even when the player was killed." The team's core idea:
  "Remove lives, reduce respawn time, keep the levels short and keep the goal always in sight." Frustration without a
  lives system: "the penalty is how much time it takes to start playing again." Cut-scenes and transitions were sped up
  so "the game never stops". [V, E2] [S1] [S2] [S3] The Curves practice glossary already records "near-zero retry
  cost" and a critic's objection that zero delay leaves no time to reflect. [V, E4] [S4]
- Celeste. No developer number for the death-to-control time was found. A juice-analysis article estimates the whole
  death (pink burst, flash, respawn at the room entrance) at "under 0.5 seconds" and argues death downtime "is
  frustration amplification time". [U, E4] [S5] A Steam thread asks to skip the death animation to "save 1 second"
  (player impression). [U, E4] [S6] A critic notes the music never stops on death. [V, E4] [S7] speedrun.com IL rules
  ban "Save and Quits to replace retries", which only matters because the normal retry is already so fast. [V, E3] [S8]
- N++. Metanet describes the series as "a delicate balance of frustration and satisfaction" and wants failure to be
  "your fault". Race levels "usually assume a few lives will be spent retrying"; some levels keep state across lives
  (cleared mines stay cleared). Episodes are "about 5-minute challenges" of 5 levels. No checkpoints are mentioned
  anywhere; death restarts the level. [V, E2] [S9]
- VVVVVV (Cavanagh, 2010). Reviews agree: "liberally littered with save points (sometimes multiple on one screen)",
  respawn "instantly", "no other penalty"; Boing Boing calls it "liberal checkpoints and zero-time restart". Cavanagh:
  "one of those design things that feels obvious in hindsight". [V, E3] [S10] [S11] [S12]
- Getting Over It (Foddy, 2017). No death, no checkpoints, no save. Foddy: falling is "emotionally different to having
  to pick yourself up again"; the fall "escapes your grasp more than if you just restart"; he wants stakes "from the
  effort you're putting into the game". He himself kept "getting right to the top and falling right down" before
  release; his first full clear took four and a half hours, a later one 34 minutes. Sexy Hiking (Jazzuo) is the model;
  its separate levels meant no "sensation of falling back from my current position". [V, E2] [S13] Google Design
  Notes quotes the trailer: "capricious ... bracing and inhumane". [V, E2] [S14]
- I Wanna Be the Guy (Kayin, 2007). Every death is a "Game Over" screen but attempts are infinite; progress is held by
  save points (Wikipedia). [V, E3] [S15] Kayin's design FAQ: traps must be "tuned to how often the player is expected
  to die"; constant deaths make players apathetic, "They need room to breath." [V, E2] [S16]
- Syobon Action / Cat Mario (Chiku, Feb 2007). Freeware, four stages; stage 1 took Chiku three days; "ostensibly
  innocuous objects that kill the character in ways unforeseeable". Inspired by the 2channel game Owata (about a year
  earlier), the same game Kayin names as "stupid-hard". [V, E3] [S17] [S16]
- Kaizo Mario World (T. Takemoto, 2007). "Missing a jump or getting hit by an enemy results in a death"; "many hacks
  impose no penalty beyond a restart" (that is, a savestate restart). [V, E3] [S18]
- Trackmania. Keyboard: Backspace respawns at the last checkpoint, Delete gives up (full restart); the two are
  separately bindable and the timer keeps running after a checkpoint respawn. A "secondary respawn" that restarts
  instantly with zero speed exists (a bug report when it broke). [V, E3] [S19] [S20] No source for the Enter key was
  found; the modern default is Backspace/Delete.
- Hades God Mode and Celeste Assist Mode (already in the Curves glossary): God Mode 20% damage resistance, +2% per
  death, cap 80%, keeps the failure loop. [V, E2] [S4]
- Juul 2009: energy, life, setback and termination punishment; players rate games highest when they failed some and
  then won, and when they blame themselves. [V, E1] [S21]

**Inferences.**
- [I] In Juul's terms SpeedRunner's death is a setback punishment (replay the whole map) plus a 3.4 s time penalty.
  The twins keep setback (SMB, N++ restart the level) but delete the time penalty. The setback is fine for a 16 to 40 s
  map; the time penalty is not, because it is paid on every attempt and does not teach anything.
- [I] A fair target: death to control under 500 ms, `R` under 150 ms (no animation at all, the player chose it).
  The 0.38 s death freeze is good "failure as information" time if the camera stays on the death spot; keep it.
- [I] The countdown exists so the timer starts fairly. The twins solve that without a wait: the timer starts on the
  first input (Trackmania starts on the gate, SMB and Celeste's in-game timers start on control). SpeedRunner can
  start `game.time` on the first horizontal input or jump, with the hero standing still at the start line.
- [I] Getting Over It and Jump King do not apply to a time attack. Their "the fall is the cost" only works because
  there is no clock. For a leaderboard game, the clock already is the cost.
- [I] A death late in FIRST STEPS costs about 13 s of run plus 3.4 s of wait (at about 80% of a 16 s run). Cutting the
  wait reduces the cost of a late death by 20%; cutting the setback with respawning checkpoints would change the game
  (see Q3 and Q5 for the practice-mode answer that keeps the leaderboard honest).

**Gaps.** No developer-stated Celeste death-to-control time (the 0.5 s figure is one analyst's estimate). No source
reached for Hotline Miami's R restart timing, Jetpack Joyride's or Doodle Jump's one-life softening, or Fall Guys
elimination (searched once, not found; Jetpack Joyride's GDC talk [S22] exists but its text was not reachable).

---

## Q2. Difficulty ramps across a campaign

**Takeaway.** The twins publish their ramp as a grid or a ladder the player can see, and they let the player step
sideways at a wall: N++ unlocks 20 episodes at a time and says "move to the next column and return later";
Super Meat Boy's dark world "starts where the main game's difficulty leaves off"; Trackmania gates Black on 10 gold
medals, not on finishing Red. SpeedRunner's five cards (Easy, Medium, Hard, Hard, Expert) are a ladder with no
sideways step and a locked top. The first wall will be THE DUNGEON (9 spike strips, 4 on ceilings, after two maps with
2 each): plan what the player does there before adding a sixth map.

**Cited findings.**
- N++ (Metanet, 2015). Every level rated on an "8-level scale", re-rated after each change. Episodes are 5 levels mixing
  difficulties ("3 easy, 1 easy-medium and maybe 1 medium") so even an easy episode has an arc. Grid of 5 rows x 20
  columns; difficulty rises "diagonally down and to the right"; columns re-ordered by play to "make sure there aren't
  many huge spikes". Finishing an episode unlocks the one below; 20 episodes open at any time ("a respectable 20%").
  "If a level is too hard, players can move to the next column and return later." They "almost never need to make a
  level harder". About 2000 levels made for N++, about 1000 shipped at launch; the Ultimate Edition has 4340 levels and
  "took 10,000 hours". Calm "straight person" levels give breathing room after intense ones. [V, E2] [S9] [S23] A Steam
  dev post says the N++ curve was made "much more gradual" than N+ with new easier and harder levels at both ends.
  [U, E2] [S24] The GDC 2016 talk "Empowering the Player" is about serving new players and veterans in the same levels.
  [V, E2] [S25]
- Super Meat Boy (Team Meat, 2010). "more than 150 main game levels" and "more than 150 expert levels". Dark world
  versions unlock by finishing the light level "under a set par" (the A+ grade). The dark world "starts where the main
  game's difficulty leaves off": dark 1-5 is "almost as difficult as level 3-5" of the light world. [V, E2] [S2]
- Trackmania (Nadeo). Seasonal campaigns: 25 maps in 5 colour tiers White, Green, Blue, Red, Black (5 each). Unlock
  rule in 2023: Blue at 10 bronze medals, Red at 15 silver, Black at 20 gold; the 2026 update: Blue 10 bronze, Red 10
  silver, Black 10 gold, White and Green free. From 2026 the Black maps are the esports qualification maps. Nations
  Forever (2008) had 15 tracks each in White, Green, Blue, Red and 5 Black. [V, E3] [S26] [S27] [S28]
- Super Mario Maker 2 (Nintendo, 2019). Endless Challenge has four tiers, Easy, Normal, Expert, Super Expert, assigned
  automatically from clear rate (clears / attempts). Nintendo has never published the cutoffs. Fan-measured bands:
  Easy above 20% (another post says above 30%), Normal 10-20% (or 10-30%), Expert 3-10%, Super Expert below 3% (most
  "2% or lower"); uncleared levels sometimes appear as Expert; the creator's own death count on upload may be a second
  input. [U, E3] [S29] [S30] A 2025 arXiv study of SMM2 levels: the median level is rated Normal with a clear rate of
  0.25; a Normal level's clear rate is 54% lower than an Easy one's, Expert 84% lower, Super Expert 98% lower. [V, E1]
  [S31]
- Geometry Dash (RobTop, 2013). Official rating document: Normal 3 stars, Hard 4-5, Harder 6-7, Insane 8-9, Demon 10;
  Auto is 1 star and Easy 2 (guide sources). Demon sub-tiers (Easy, Medium, Hard, Insane, Extreme Demon) are
  community votes that change only the face icon, not rewards; the community Demon Ladder splits demons into 39 tiers.
  [V, E2 for the official ranges, E3 for sub-tiers] [S32] [S33]
- Celeste. Chapters 1-7 plus 8 and 9 (Farewell); each chapter has a B-side unlocked by a cassette and a C-side after
  all B-sides; strawberries are optional. Vice lists "strawberries, b-sides, and assist mode" as the systems that let
  players "find their own challenge level". [V, E3] [S34] No Thorson quote on B-side difficulty targets was reached.

**Inferences.**
- [I] "How many levels before the first wall" in the twins: N++ puts no wall in the first row (the first column's five
  episodes are rated easy and the player can step sideways); SMB's first wall is the chapter 2 boss or the first dark
  level; Trackmania's is the first Red track (track 16 of 25); Mario Maker Endless lets the player choose the tier so
  the wall is self-selected. The common rule is that the wall is reachable only after 10 to 15 cleared levels and never
  blocks the only path.
- [I] SpeedRunner's ramp by hazards is 2, 2, 9, 1 spike strips over maps 1-4, with map 3 also the shortest (4580 u) and
  the most vertical (top -1350). That is a spike, not a sawtooth. Two cheap fixes: swap maps 3 and 4 in the card
  order (STAIRWAY teaches movers and wheels with one strip, then THE DUNGEON combines ceilings and climbs), or add a
  fifth "Medium" map so the ramp reads 2, 2, 1, 9. Name the set when you describe the sawtooth: here the set is the
  map.
- [I] A visible ladder costs nothing: show a par time (a "gold") per map card and unlock SAMURAI TRIAL on, say, 3 of 4
  golds instead of on finishing map 4. This is the Trackmania rule and it turns the wall into a choice.

**Gaps.** Official Mario Maker cutoffs do not exist publicly. Dustforce's campaign structure (the hub and the
SS-rank door gates) was not researched within the call budget. N++'s GDC transcript was not read.

---

## Q3. Inside one level: deaths by section, sawtooth, where the hard part goes

**Takeaway.** The one explicit written rule found is from the troll community, and it is the opposite of what a
time attack wants on its face: "Put long waits, tedious tricks, and hard execution right before a checkpoint, so
they're done once or twice, not many times" (Trolling for Dummies). Translated to a game with full restarts, the hard
part belongs early, where a retry costs 3 s of run, not late, where it costs 15 s. Super Meat Boy's micro-levels make
the question moot (the whole level is the hard part, 10 to 20 s long). Celeste makes it moot with per-room respawn.
SpeedRunner has neither, so section order is its main lever: FIRST STEPS already puts the chimney and the void
platforms late (after checkpoint 3), which is where a first-time player pays most.

**Cited findings.**
- Super Meat Boy's replay pile: after a clear "your past 40-plus attempts all playing at once". [V, E2] [S2] The
  level is the unit; "keep the goal always in sight". [V, E2] [S3]
- Celeste's in-game chapter stats count total deaths across attempts, not the best run (itch.io player note). Full
  first playthroughs land at about 15,000 to 20,000 deaths (Steam thread, personal blogs); one player cut Chapter 4
  deaths "by a factor of more than 30x" on replay. [U, E3] [S35] [S36] No official per-room counts were published.
- Trolling for Dummies (Defender1031, Mario Maker): "Always remember that your goal is to make the player laugh and
  never to frustrate them." "A checkpoint resets the player's frustration." Back-to-CP1 trolls "no more than one or
  two"; keep the middle section "relatively short and straightforward"; puzzling sections "near a spawn point or
  nonlethal"; 6 to 10 trolls per checkpoint section; a level over an hour "is probably too long". [V, E3] [S37]
- Kayin on pacing inside IWBTG: constant deaths make players apathetic, "They need room to breath"; traps tuned to
  expected death frequency. [V, E2] [S16]
- N++ episodes mix "3 easy, 1 easy-medium and maybe 1 medium" so the five-level set has an arc, and calm levels follow
  intense ones. [V, E2] [S9] Booth's L4D director cycle (build up, peak 3-5 s, fade, relax 30-45 s) is the measured form
  of a rest beat. [V, E2] [S4]
- Juul: failure players blame on themselves raises ratings; failure as information. [V, E1] [S21]

**Inferences.**
- [I] The sawtooth inside a 30 s map: three or four sections, each a skill atom (one new thing), each ending on a
  checkpoint chime, with a flat 2 to 3 s run between them as the relief beat. Peak the difficulty in section 2 or 3,
  not 4. The last section should be fast and readable so the finish feels like a sprint, and so a world-record chaser's
  time is decided by the route, not by a late coin flip.
- [I] "Hard finish is cruel" (the Trackmania mapping folklore the brief asked about) was not found as a written rule;
  treat it as [I]. The mechanism is the same as Defender1031's checkpoint rule: the cost of a late failure is the
  whole run, so late precision multiplies attempts. In SpeedRunner, a 10% fail chance at the last jump of a 20 s map
  adds about 2.3 s of expected wasted run per attempt; the same jump at the start adds 0.3 s.
- [I] Deaths by section is the one metric SpeedRunner can log for free (it already knows which split window the hero
  is in). See Q7.

**Gaps.** No SMB or Celeste designer statement on hard-part placement was reached (the Celeste GDC 2017 talk [S38] and
the Game Informer SMB postmortem [S39] exist but were not read). The claim that Celeste or SMB "put the hard part
first" is not supported here.

---

## Q4. Troll difficulty and fairness

**Takeaway.** The troll lineage (Owata 2006 -> Syobon Action Feb 2007 -> IWBTG 2007 -> Kaizo Mario World 2007 ->
Mario Maker trolls 2015+) has written its own fairness rules, and they all reduce to one: the surprise is allowed
once, and after it the level must be readable and the answer visible. That makes a troll level a one-time comedy
and a poor time attack. Once learned, a troll adds nothing to the route and the time is decided elsewhere; the
streaming value is the first blind run, which a leaderboard game never gets to show. SAMURAI TRIAL should be an
expert level in the kaizo sense (hard, honest, "missing a jump results in a death"), with at most one or two
signposted jokes in the lobby, not in the timed map.

**Cited findings.**
- Syobon Action: Feb 2007, Chiku, four stages, "innocuous objects that kill the character in ways unforeseeable";
  inspired by Owata (2channel, about a year earlier); the open-source clone was downloaded over 150,000 times
  2010-2020. [V, E3] [S17]
- IWBTG: 2007, Kayin; each death is a Game Over with infinite attempts; save points carry progress. [V, E3] [S15]
  Kayin: "I Wanna be the Guy is a game about subversion"; design is predicting player actions "to maximize surprise,
  humor, and frustration"; "Random traps are NOT a crutch"; "They need room to breath"; pain makes the humour better.
  Owata was "stupid-hard like this" and IWBTG then motivated Owata's author to finish his game. [V, E2] [S16]
- Kaizo Mario World: 2007, T. Takemoto, Niconico; introduced invisible "kaizo blocks", auto-scrollers and post-goal
  "kaizo traps". Modern kaizo: "Missing a jump or getting hit by an enemy results in a death"; death is "part of the
  learning process"; dram55 finished Kaizo Mario World 1 in 24:36 at AGDQ 2015, after which speedrunners adopted the
  form; GrandPooBear's Grand Poo World hacks (2017, 2019, 2023). [V, E3] [S18]
- Mario Maker troll etiquette (Defender1031, "Trolling for Dummies", linked from the Kaizo Mario Maker Wiki): goal is
  laughter, never frustration; a fair troll "makes the player expect something, punishes that expectation with humor,
  and then shows the correct action"; "Players should be able to tell where to go"; no softlocks ("always include some
  form of death"); no "pick-a-path" coin flips; hints "rare, simple, and impossible to mistake for part of the level";
  "Err on the side of too easy"; "Fix all cheese"; no obscure tech as the required solution; 6 to 10 trolls per
  checkpoint; branching 2 to 3 options; dev exits only when unavoidable and "much harder than the intended route";
  play through dying to every troll once and time it; a full troll level takes "three or four weeks". [V, E3] [S37]
  Community framing: "Modern kaizo levels are first and foremost fair"; trolls aim to "subvert expectations"; good
  trolls "have their rules" and are not "soft-lock-filled". [V, E3] [S40] Nintendo itself published a 2015 pigeon comic
  on how not to be "a horrible troll". [V, E3] [S41]
- Juul: self-blame raises ratings; a death the player cannot have foreseen is blamed on the game. [V, E1] [S21]

**Inferences.**
- [I] Why trolls work on stream: the audience knows the trap and the player does not; the payoff is the reaction.
  That requires a first blind run, which an asynchronous leaderboard game with a lobby and no editor never gets to
  share. Without spectators, a troll is a hidden spike (Juul's game-blamed failure) that each player pays alone.
- [I] What a troll destroys in a time attack: SpeedRunner's deterministic movers and ghost mean every surprise is a
  one-time cost; after it the "troll" is just a route memory item. The leaderboard then rewards having watched a
  video, not skill. The fairness rules above (readable, visible answer, no coin flips) are exactly the kaizo rules
  minus the joke, so the expert map can adopt them wholesale.
- [I] Place humour where it is free: the lobby already has standable words; a fake button or a collapsing title
  letter in the lobby is a troll with zero cost of failure (no clock). Keep the timed maps honest.

**Gaps.** Trap Adventure 2 (2016, Hiroyoshi Oshiba) was not reached. No GDC/YouTube troll analysis was read; the
EGM and Medium troll articles were seen only as search results [S40] [S42].

---

## Q5. Assists and difficulty options

**Takeaway.** The precision-platformer twins split into two camps: no options at all (Super Meat Boy, N++, Neon White,
Dustforce) and Celeste-style named assists. Neither camp uses difficulty modes. What they all share is a practice
loop: instant retry, and in Celeste, Trackmania and Trials a way to restart from a checkpoint without losing the
level. For a leaderboard game the clean split is: assists and practice tools are free to use and mark the run as
unranked; the ranked board stays one ruleset. SpeedRunner's cheapest high-value assist is "practice from checkpoint"
(respawn at the last split marker, run unranked), which costs one flag and one respawn position.

**Cited findings.**
- Celeste Assist Mode (Curves glossary): game speed, invincibility, infinite stamina (and air dashes), chapter skip;
  first called "Cheat Mode", renamed as "judgmental"; the game recommends a first play without it. Thorson: assists
  belong in the main menu, explained up front, adjustable mid-run. [V, E2] [S4] Thorson a year later: reception
  "overwhelmingly positive"; "Assist Mode breaks the game" but does not undermine authorial intent. [V, E2] [S34] No
  usage statistics were published; one essay observes anecdotally that many finished without it. [U, E4] [S43]
- Hades God Mode (glossary): 20% resistance, +2% per death, cap 80%, "immediately palpable". [V, E2] [S4]
- speedrun.com Celeste: modifications to the executable "are banned (among cheat and assist mode)"; debug mode was
  debated because it does not modify the .exe; "Save and Quits to replace retries ... are banned" on IL boards; DTS and
  no-DTS runs share one board. [V, E3] [S8] [S44]
- Trackmania: respawn at checkpoint (Backspace) with the timer running, give up (Delete) for a fresh attempt. [V, E3]
  [S19] [S20] Medals (bronze, silver, gold, author) per map. [V, E3] [S26]
- Neon White: infinite retries; players "retry levels over and over again to try to get the fastest speed"; medals
  Bronze, Silver, Gold, Ace and a hidden Red; a Red usually needs "the shortcut hinted at in-game" after Gold; an
  achievement for 50% of all Ace medals. [V, E3] [S45] [S46]
- Super Meat Boy and N++: no difficulty options; N++ gates by the grid and says locked levels avoid frustrating
  players "too early". [V, E2] [S9] [S2]
- Super Mario Maker 2 Endless: the player picks the tier and may skip courses. [V, E3] [S47]

**Inferences.**
- [I] What a tiny team can ship, in cost order: (1) practice-from-checkpoint toggle, unranked, respawn at the last
  split marker with the recorded split speed zeroed; (2) a "ghost only" toggle already exists, add "slow motion 50%"
  as an unranked variant for learning a section (one multiplier on `DT` accumulation, the physics stay deterministic);
  (3) a per-map medal ladder (bronze = first clear, silver = within 150% of author time, gold = within 115%, author =
  the dev's best) that works as a visible difficulty ladder (Q6); (4) a Celeste-style assist menu (invincible spikes,
  infinite coyote) only if phones arrive, because touch is the accessibility case.
- [I] Leaderboard rule to copy from Celeste: any assist or practice flag makes the run unsubmittable, said in the UI
  before the run starts, not after.

**Gaps.** Hollow Knight and Dustforce assist details were not researched. Celeste "variant mode" (the 1.4 update's
mirror, 360 dashing, etc.) was not sourced. Trials' checkpoint-and-fault scoring was not sourced.

---

## Q6. Skill ceiling vs floor

**Takeaway.** The twins keep both audiences on the same level by putting the first clear on the floor and hiding the
real curve in a ladder of times or ranks over that same level: SMB's A+ par and dark world, Trackmania's four medals
per map, Neon White's Ace and hidden Red, Celeste's strawberries and B/C-sides, N++'s per-level gold and the 20%
open grid. A medal ladder is a difficulty curve for one level. SpeedRunner has the ingredients (splits, PB, world
record, shadow duel) and lacks the ladder; the duel against your own shadow is already a self-scaling ceiling, and a
par-time medal would be the floor-to-ceiling bridge.

**Cited findings.**
- SMB: dark world unlocks per level by beating the par (A+); dark 1-5 is "almost as difficult as level 3-5". [V, E2]
  [S2] Replay pile shows 40+ attempts at once. [V, E2] [S2]
- N++: 8-level difficulty scale, grid with 20 open episodes, locked levels "until you've earned your way to them";
  GDC 2016 talk on supporting new players and veterans in the same levels. [V, E2] [S9] [S25]
- Trackmania: bronze/silver/gold/author medals; tier unlocks need 10 bronze, 10 silver, 10 gold (2026). [V, E3] [S27]
- Neon White: Bronze, Silver, Gold, Ace, hidden Red; Red requires the hinted shortcut; "50% of the total Ace medals"
  achievement. [V, E3] [S45] [S46]
- Celeste: strawberries optional, B-sides via cassettes, C-sides after B-sides; "find their own challenge level". [V,
  E3] [S34] Full-run death totals of 15,000-20,000 for first clears vs low hundreds for strong players show the ceiling
  gap inside one content set. [U, E3] [S35] [S36]
- Geometry Dash: the 10-star Demon tier is subdivided by community vote into 5 Demon tiers and by the Demon Ladder
  into 39, i.e. the ceiling is so far above the official scale that the community built its own ladder. [V, E3] [S32]
  [S33]
- Mario Maker: the per-level "world record" time and "first clear" are shown on every course. [V, E3] [S47]

**Inferences.**
- [I] Medal ladder for a SpeedRunner map: Clear (any time), Silver (beat the dev's time x1.5), Gold (x1.15), Samurai
  (beat the dev's time or the season's top 1%), plus the existing shadow duel which is always "beat yourself". Four
  rungs cost four numbers per map and one icon.
- [I] The ceiling in SpeedRunner is route plus movement tech (wall climb variant, roll carry at 280 u/s, apex hang).
  As in Neon White's Red medals, the expert rung should require a route the map hints at (a visible but risky
  shortcut), so the ceiling is discoverable rather than hidden frame tech.

**Gaps.** No Neon White per-level Ace time list was read (one exists [S46]). No Dustforce SS-rank data.

---

## Q7. Telemetry and tuning

**Takeaway.** The twins that publish numbers publish ratios: Mario Maker's clear rate (clears / attempts) and world
record per level, Trackmania's medal counts, Celeste's per-chapter death counter shown to the player. A 5-player
collective cannot get statistical clear rates, but it can get the same four numbers per playtester per map, which is
enough to see a wall: deaths per section, attempts to first clear, time to first clear, and the section where a
player quit. SpeedRunner's server sees starts and finishes only; add deaths with the split index to the existing
`start`/`submit` handshake and the death heatmap by section is free.

**Cited findings.**
- Mario Maker 2 clear rate = clears / attempts; the median level has 0.25; difficulty tiers derive from it (plus,
  per community, the creator's upload deaths). [V, E1] [S31] [U, E3] [S29] [S30] Courses show world record and first
  clear. [V, E3] [S47]
- Celeste shows per-chapter death totals across all attempts in the chapter menu; players use them as a progress
  metric (one player: 15,000+ deaths first run; another cut a chapter by 30x on replay). [U, E3] [S35] [S36]
- SMB's replay pile is a per-level death heatmap shown to the player (40+ attempts at once). [V, E2] [S2]
- Metanet watched "players of varying skill levels" for a year and re-rated levels after every change; the 8-level
  scale is their tuning instrument. [V, E2] [S9]
- Trackmania publishes medal unlock thresholds per tier (10/10/10 in 2026). [V, E3] [S27]
- Halfbrick ran an analytics programme tracking "money spent, social virality, retention, and engagement"; Jetpack
  Joyride is listed at 5-10% paying users in third-party decks. No run-length numbers found. [U, E4] [S48] [S49]
- Curves measuring glossary: funnel, win rate by stage (attempts as denominator), death heatmap, completion rate,
  perceived vs actual difficulty. [V] [S50]

**Inferences.**
- [I] Thresholds that signal a wall for 5 testers: a section where median deaths per clear exceed 3x the map's other
  sections; attempts to first clear above 15 for an Easy card or above 40 for Hard; any tester quitting before
  checkpoint 2 on a map they started 3+ times. Those are starting cutoffs, to be moved after the first session.
- [I] Instrumentation in the current build: `splits[i]` already gives the section index at death; post
  `{map, section, x, attempt_n}` on death to `/api/lb` (or batch at submit). One extra field, `deaths`, on `submit`
  gives attempts per clear with no new endpoint.
- [I] Perceived difficulty: after each session ask the 5 testers to rate each map 1 to 7 (CORGIS-style performative
  challenge) and compare with deaths. A map rated hard with few deaths is a readability problem, not a difficulty one.

**Gaps.** No Doodle Jump score distributions, no Halfbrick GDC numbers, no Trackmania finish-percentage data were
reached.

---

## Q8. Onboarding: the first 60 seconds

**Takeaway.** Super Meat Boy, Celeste, N++ and VVVVVV all teach by placing one obstacle that needs the one new
input, with the goal visible and death costing nothing. FIRST STEPS already follows this shape in its source comments
("big enough to need a real jump", steps, a momentum gap, a chimney). What is missing is the death: a 3.4 s wait on
the first failure is the opposite of VVVVVV's "death as a learning experience" with zero-time restart, and the first
map has no in-world prompt for the wall jump or the roll, the two inputs a platformer player would not guess.

**Cited findings.**
- SMB: "keep the goal always in sight", micro-levels, action never stops. [V, E2] [S3] [S2]
- N++: single-player levels "often showcase one element at a time"; later levels combine. [V, E2] [S9]
- VVVVVV: checkpoints "sometimes multiple on one screen", death "a learning experience rather than a punishment".
  [V, E3] [S10] [S11]
- Kayin: tune traps to expected deaths; give room to breathe. [V, E2] [S16]
- Celeste's GDC 2017 talk: each level "a very small, self-contained story"; the designer includes skips for skilled
  players; hard additions come only once the layout is "110% finalised" (secondhand notes). [U, E3] [S38] [S51]
- Trolling for Dummies: hints "rare, simple, and impossible to mistake for part of the level"; failure should "clearly
  show what went wrong". [V, E3] [S37]
- Curves glossary: onboarding is a funnel; gating holds a mechanic back until earlier ones are learned; a skill atom is
  act, update, feedback, model. [V] [S50]

**Inferences.**
- [I] FIRST STEPS as a skill chain: run -> jump (rock) -> variable jump (steps) -> momentum gap -> wall jump
  (chimney) -> roll (high drop) -> precision (3 narrow platforms). That is seven atoms in one 16 s+ map with a full
  restart on any miss, so the first death in the chimney replays five learned atoms. Either respawn at the split in the
  first map only (treat FIRST STEPS as a tutorial, unranked until cleared once) or split it into two maps.
- [I] Input prompts drawn in the world (the game already draws solid words you can stand on): a "JUMP" word before
  the rock, a "W+D" arrow on the chimney wall, a down-arrow at the drop. Cost: a few text solids. Show them only until
  the map is cleared once.
- [I] The first death should be cheap and informative: no countdown, camera holds the death spot for the 0.38 s, the
  22 dust particles already mark it. The second time through a section, draw a faint "x" at the death spot (a one-item
  local death heatmap, the SMB replay pile at zero cost).

**Gaps.** Mario Maker's course maker tutorials (Yamamura's Dojo) and Trackmania's first-minute tutorial were not
researched. Celeste chapter 1 prologue timing (the first 60 s) not sourced.

---

## Candidate technique profiles

1. Zero-wait restart. Death to control under 0.5 s, `R` under 150 ms, timer starts on first input instead of a
   countdown. SMB, Celeste, N++, VVVVVV, Trackmania. Key numbers: SMB "almost instantaneous"; Celeste about 0.5 s
   (estimate); SpeedRunner today 3.4 s. Removes 3 s per attempt.
2. Practice from checkpoint (unranked). Respawn at the last split marker with the timer running, run flagged
   unsubmittable. Trackmania Backspace respawn; Celeste room respawn; speedrun.com's Save-and-Quit ban as the rule
   model. Cost: one flag and a respawn position.
3. Medal ladder per map. Clear / Silver (1.5x dev) / Gold (1.15x dev) / Samurai (dev time), gating the expert card on
   medal counts (Trackmania 10/10/10, SMB A+ par to dark world, Neon White Ace and Red).
4. Hard part early, sprint finish. Peak the section difficulty in section 2 or 3 of 4; flat 2-3 s relief runs between
   sections; last section fast and readable. Defender1031's checkpoint rule inverted for full-restart maps.
5. Honest expert, not troll. SAMURAI TRIAL under kaizo rules: every death readable, no blind traps, no coin flips,
   shortcuts hinted. Trolls only in the lobby (no clock).
6. Section death telemetry. Log `{map, section, x, attempt}` on death; thresholds: median deaths per section > 3x the
   rest, attempts to first clear > 15 (Easy) or > 40 (Hard), quits before checkpoint 2.
7. In-world input prompts and a local death mark. Standable words as prompts (the lobby already does this), a faint x
   at your last death spot, both hidden after first clear.
8. Visible ramp with a sideways step. Unlock the next card on any clear, unlock the expert card on medals; order
   hazards 2, 2, 1, 9 (swap maps 3 and 4 or add a medium map) so the ramp is a sawtooth with the map as the set.

## Glossary additions (proposed)
- Clear rate: clears divided by attempts for one level, the Mario Maker measure; the series' "win rate by stage" for
  user levels. (Nintendo; arXiv 2507.21078)
- Troll (level): a level whose difficulty is surprise rather than execution; fair when the surprise is shown once
  and the answer is then visible (Defender1031). Contrast kaizo: hard, honest execution.
- Medal ladder: several time or score thresholds over one level that act as a difficulty curve for that level
  (Trackmania, Neon White, SMB A+).

## Sources
- [S1] Game Developer, Postmortem: Team Meat's Super Meat Boy. https://www.gamedeveloper.com/audio/postmortem-team-meat-s-i-super-meat-boy-i-
- [S2] Game Developer, Super Meat Boy's McMillen Explains 'Why So Hard?'. https://www.gamedeveloper.com/game-platforms/-i-super-meat-boy-i-s-mcmillen-explains-why-so-hard-
- [S3] Mod DB / Design3, Raw Meat: game design tips from Edmund McMillen. https://www.gamedeveloper.com/design/raw-meat-game-design-tips-from-team-meat-s-edmund-mcmillen
- [S4] Curves glossary notes: studies/curves-hearthguard/notes/00b-glossary-practice.md (Super Meat Boy, Hades God Mode, Celeste Assist Mode, L4D director) and 00a-glossary-theory.md.
- [S5] Platformer juice: the Celeste model (death downtime estimate). https://gamejuice.pages.dev/articles/platformer-juice-celeste-model
- [S6] Steam Community, Celeste discussion on skipping the death animation. https://steamcommunity.com/app/504230/discussions/0/3106888980062841603
- [S7] Hypercritic, The psychological value of failing in Celeste. https://hypercritic.org/collection/extremely-ok-games-celeste-2018-review
- [S8] speedrun.com Celeste news, IL rule on Save and Quit. https://www.speedrun.com/celeste/news/z3z9gvxd
- [S9] PlayStation Blog, Metanet: The Ins and Outs of Designing N++ Levels. https://blog.playstation.com/?p=145712
- [S10] Tap-Repeatedly, VVVVVV review. https://tap-repeatedly.com/?p=12471
- [S11] Boing Boing, VVVVVV (13 Jan 2010). https://boingboing.net/2010/01/13/get-this-flipping-ou.html
- [S12] PC Gamer, How Terry Cavanagh bet it all on the simple joy of platforming. https://www.pcgamer.com/how-terry-cavanagh-bet-it-all-on-the-simple-joy-of-platforming
- [S13] Game Developer, Designer Interview: The aesthetics of frustration in Getting Over It (5 Jan 2018). https://www.gamedeveloper.com/design/designer-interview-the-aesthetics-of-frustration-in-i-getting-over-it-i-
- [S14] Google Design Notes, Bennett Foddy episode. https://design.google/library/bennett-foddy-getting-over-it-interview
- [S15] Wikipedia, I Wanna Be the Guy. https://en.wikipedia.org/wiki/I_Wanna_Be_the_Guy
- [S16] Kayin, IWBTG FAQ (design section). https://kayin.moe/iwbtg/faq.html
- [S17] Wikipedia, Syobon Action. https://en.wikipedia.org/wiki/Syobon_Action
- [S18] Wikipedia, Kaizo. https://en.wikipedia.org/wiki/Kaizo
- [S19] Steam Community, TrackMania² Canyon respawn keys thread. https://steamcommunity.com/app/228760/discussions/2/2961642818658406421
- [S20] devtrackers.gg, Trackmania secondary respawn bug report. https://devtrackers.gg/trackmania/p/e3b53ddc-secondary-respawn-instant-no-speed-respawn-broken-since-update
- [S21] Juul, J. (2009). Fear of Failing? https://www.jesperjuul.net/text/fearoffailing/
- [S22] GDC Vault, Depth in Simplicity: The Making of Jetpack Joyride (Luke Muscat, 2012). https://www.gdcvault.com/play/1015527/
- [S23] PlayStation Blog, N++ Ultimate Edition: 4,340 levels, 10,000 hours (11 Jan 2018). https://blog.playstation.com/archive/2018/01/11/ns-new-ultimate-edition-includes-4340-levels-and-took-10000-hours-to-create/
- [S24] Steam Community, N++ developer post on the difficulty curve. https://steamcommunity.com/app/230270/discussions/1/361787186428715043
- [S25] GDC Vault, Empowering the Player: Level Design in N++ (2016). https://gdcvault.com/play/1023282/Empowering-the-Player-Level-Design
- [S26] Trackmania docs, What is a seasonal campaign? https://doc.trackmania.com/play/what-is-a-seasonal-campaign/
- [S27] Trackmania blog, Trackmania Update 2026 (unlock thresholds, Black tracks for esports). https://blog.trackmania.com/?p=8948
- [S28] Trackmania Wiki (Fandom), Trackmania Nations Forever track counts. https://trackmania.fandom.com/wiki/Trackmania_Nations_Forever
- [S29] GameFAQs, So what are the cutoff % for difficulty levels? (SMM2). https://gamefaqs.gamespot.com/boards/258608-super-mario-maker-2/77832879
- [S30] GameFAQs, What is the criteria for super expert levels? https://gamefaqs.gamespot.com/switch/258608-super-mario-maker-2/answers/536030-what-is-the-criteria-for-super-expert-levels
- [S31] arXiv 2507.21078, What Makes a Level Hard in Super Mario Maker 2? (2025). https://arxiv.org/html/2507.21078
- [S32] RobTop Games, GD rating document. https://robtopgames.com/files/GDRating.pdf
- [S33] ludo.guide, Geometry Dash level rating system. https://www.ludo.guide/guide/geometry-dash/community-online-levels/level-rating-system
- [S34] Vice, Celeste difficulty and Assist Mode (Thorson interviews). https://www.vice.com/en/article/celeste-difficulty-assist-mode and https://www.vice.com/en/article/celeste-assist-mode-change-and-accessibility
- [S35] Steam Community, Celeste death count thread. https://steamcommunity.com/app/504230/discussions/0/1628538707074318672
- [S36] Aditya Sengupta, Celeste death log by chapter. https://aditya-sengupta.github.io/celeste
- [S37] Defender1031, Trolling for Dummies (Mario Maker troll design guide). https://docs.google.com/document/d/13ZoqeblLs45HuEfTtsOrq6X0LAuEnA8nB721_doxE38/mobilebasic
- [S38] GDC Vault, Level Design Workshop: Designing Celeste (Thorson, 2017). https://gdcvault.com/play/1024307/Level-Design-Workshop-Designing-Celeste
- [S39] Game Informer, Extensive Super Meat Boy postmortem interview (2011). https://gameinformer.com/b/news/archive/2011/04/16/extensive-super-meat-boy-postmortem-interview
- [S40] Kevin Hainline, Super Mario Maker and the Devious Joy of the Troll Level. https://medium.com/@KevinHainline/super-mario-maker-and-the-devious-joy-of-the-troll-level-fdb1894aa7e1
- [S41] SoraNews24, Nintendo pigeon comic on troll levels (Oct 2015). https://soranews24.com/2015/10/27/troll-levels-still-abound-in-mario-maker-nintendo-releases-another-sassy-pigeon-comic-to-help/
- [S42] EGM, These Super Mario Maker Level Designers Have Elevated Trolling Into an Artform. https://egmnow.com/?p=7446
- [S43] University of Melbourne (UMSU), Climbing the Mountain: Overcoming Adversity in Celeste. https://umsu.unimelb.edu.au/news/article/7797/Climbing-the-Mountain-Overcoming-Adversity-in-Celeste/
- [S44] speedrun.com Celeste forum, Debug Mode Ruling. https://www.speedrun.com/celeste/forums/98h4c
- [S45] Attack of the Fanboy, Neon White medals and leaderboards. https://attackofthefanboy.com/?p=841732
- [S46] GamePretty, Neon White: complete list of all Red Medal times. https://gamepretty.com/neon-white-all-red-medal-time-list/
- [S47] GamesBeat, Super Mario Maker 2's Endless Challenge lets you skip levels. https://gamesbeat.com/super-mario-maker-2s-endless-challenge-lets-you-skip-levels
- [S48] SlideShare, Game analytics @ Halfbrick. https://pt.slideshare.net/AndrewSaul1/game-analytics-halfbrick
- [S49] GAMESbrief, Benchmarks and metrics deck (Jetpack Joyride 5-10% payers). https://www.slideshare.net/gamesbrief/benchmarks-and-metrics
- [S50] docs/formats/design-curves.md, Glossary (Measuring, Learning, Failure tables).
- [S51] PrimedPixel, Lessons I've Learnt From Celeste's Level Design (notes on the GDC talk). https://primedpixel.github.io/posts/lessons-ive-learnt-from-celestes-level-design/
