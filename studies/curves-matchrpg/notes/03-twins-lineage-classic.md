# 03. Twins and lineage A: the classic era (1980-2015)

Researcher 1. Angle: which older games share MatchRPG's structural conditions, and where its key curve patterns first appeared.
Scope is the classic era (Rogue 1980 as a precursor, then 1989-2015). Modern twins (Puzzle & Dragons, Candy Crush, Hades,
Slay the Spire, Vampire Survivors and others) belong to other researchers. Hearthguard's report already covers the L4D
director, Celeste assists, Hades God Mode, Risk of Rain 2 difficulty over time, PvZ onboarding and Juul's punishment types,
so this note does not repeat them.

Tags follow CONTEXT.md. [V] verified, [I] inference, [U] unverified or contested, [K] Kingsfoil fact. Grades E1 data, E2 designer
statement, E3 community consensus, E4 anecdote.

---

## Q1. Which classic games are structural twins of MatchRPG?

### Takeaway

Only two classic games match MatchRPG on input, session and cost of failure at once. They are 10000000 (2012) and its sequel
You Must Build A Boat (2015). Everything else is a twin for one pattern only. Tetris and Tetris Attack lend the speed tables and
the pushing edge. Bejeweled Blitz lends the time-boxed session. Puzzle Quest and Dungeon Raid lend match power feeding combat.
Canabalt lends the touch speed ramp. Rogue lends the depth goal and termination. Columns, Bejeweled Classic and Zoo Keeper are
lineage only and get pruned from the twin table.

### Twin table

MatchRPG reference conditions ([K], CONTEXT.md): touch sliding match-3 with an auto-walking hero; runs of 1.5-6 min (story median
177 s), endless median 559 s; high randomness; medium cost of failure (run ends, meta carries over); solo with a per-version
leaderboard and mastery tiers; mobile web first.

● same / ◐ partly / ○ different versus MatchRPG.

| Twin (year) | Input | Session | Randomness | Cost of failure | Social | Platform | Why chosen |
|---|---|---|---|---|---|---|---|
| 10000000 (2012) | ● slide rows and columns on a 7x8 grid, auto-running hero | ● runs of 2-5 min, designed for 2-3 min commutes | ● tile drops, room and enemy draws, 3 random goals per run | ● run ends, loot comes home and buys castle rooms | ◐ score chase, Game Center era [I] | ● iOS first, then PC, Android | The direct ancestor. MatchRPG's CLAUDE.md says "The goal is depth, as 10000000's was its score" [K] |
| You Must Build A Boat (2015) | ● same sliding board and runner | ◐ short bursts; a 30 s session must still advance the game | ● plus per-run dungeon modifiers | ◐ lower. "There is no fail state" | ○ solo | ● iOS, Android, Steam | The sequel, and a natural experiment. The same designer removed failure and added quests and crew |
| Puzzle Quest: Challenge of the Warlords (2007) | ◐ swap match-3, turn-based, no clock | ◐ one battle per encounter, long campaign | ● random refills, the root of "the AI cheats" | ◐ a lost battle is retried, hero XP persists [U] | ○ solo vs AI (versus mode exists) | ◐ DS, PSP, then PC, XBLA, iOS | First commercial hit to turn match power into RPG combat and levels |
| Dungeon Raid (2010) | ◐ trace chains of 3+ on a grid, turn-based | ◐ one run, length set by survival | ● | ○ higher. Permadeath, no meta, score only | ◐ OpenFeint and Game Center scores | ● iOS | Match power feeds combat on a phone; monsters scale as the run goes |
| Bejeweled Blitz (2008) | ◐ swap match-3, real time | ◐ exactly 60 s | ● | ○ lower. Nothing is lost | ● weekly friends leaderboard, reset on Tuesdays | ● Facebook browser, then mobile | The best-documented tuning of session length in match-3 |
| Tetris, NES (1989) | ○ d-pad, falling pieces | ◐ a marathon of 10-40 min [I] | ● piece draw | ○ termination, nothing kept | ◐ score, later the CTWC | ○ console | The canonical speed table and the kill screen |
| Tetris The Grand Master (1998) | ○ arcade stick | ◐ up to 13:30 for a GM run | ● | ○ termination | ◐ grade as public rank | ○ arcade | Speed that rises and falls inside one game, 20G, a grade earned by score and time |
| Tetris Attack / Panel de Pon (1995/1996) | ◐ cursor swaps on a grid, real time | ◐ endless until top-out | ● | ○ termination | ◐ versus | ○ console | The rising stack is a pushing edge you hold back by matching; chains buy "Stop" time |
| Canabalt (2009) | ◐ one touch, real time, auto-run | ● runs of about a minute or less [U] | ● building generator | ○ termination, no meta | ◐ distance shared as score | ● Flash browser, then iOS | Touch speed ramp with published numbers and hidden forgiveness |
| Rogue (1980) | ○ keyboard, turn-based | ○ long | ● procedural floors | ○ permadeath | ○ | ○ Unix | Origin of the depth goal and of termination as design |

Pruned to lineage only. Columns (1989) is a falling match-3 with a speed ramp and a Time Trial in some ports, but it adds no
pattern Tetris does not already show [V, E3] (https://en.wikipedia.org/wiki/Columns_(video_game)). Bejeweled Classic (2001) has
no clock in its main mode and a long session. Zoo Keeper (2003) is the first swap match-3 where quotas rise while the time limit
falls level by level, and its Time Attack runs 6 min with reduced quotas [V, E3]
(https://en.wikipedia.org/wiki/Zoo_Keeper_(2003_video_game)). Keep it as a footnote for the time attack pattern.

### Cited findings

- 10000000: released on iOS 29 Aug 2012, Windows and Mac 15 Jan 2013, Linux and Android 14 Mar 2013. Slide rows or columns on a
  7x8 grid; tiles wrap. If the player fails to match, the scrolling dungeon pushes the hero off the screen, and the hero returns
  to the starting room with the run's loot. Three random goals per run. Higher ranks unlock harder runs with bigger rewards.
  Upgrades can change the matching rules. Designed for 2-3 minute sessions. Redwood prototyped a physical card version and
  says he personally disliked tile matching [V, E2/E3] (https://en.wikipedia.org/wiki/10000000_(video_game)).
- 10000000 sold over 50,000 copies in its first month and about 330,000 across platforms by GDC 2014, about $500,000 [V, E1,
  developer-reported] (same URL). Redwood quoted "an average of 6-8 hours of entertainment" for the whole game, and called the
  post-game Endless Mode "a bit of a cop out" [V, E2] (https://gameinformer.com/b/features/archive/2012/12/26/afterwords-10000000.aspx).
- Run length: reviews say each run "only takes about 2-5 minutes" [V, E3] (https://www.gameskinny.com/reviews/10000000-review-freedom-at-last/,
  via search summary). That lands on MatchRPG's story median of 177 s [K].
- You Must Build A Boat: "There is no fail state." Redwood wanted a 30-second session to still advance the game, and runs load in
  the background so the next one starts almost at once. His hardest tuning job was keeping good players from overpowering the
  game [V, E2] (https://www.pocketgamer.biz/making-of-you-must-build-a-boat/). Up to 2 quests per run, chosen by the game, and
  per-dungeon modifiers [V, E3] (https://www.gamezebo.com/reviews/you-must-build-a-boat-review-ship-of-dreams/).
- Puzzle Quest: released 20 Mar 2007 (NA) on DS and PSP. Skulls deal direct damage, colours give mana, a match of 4+ grants an
  extra turn. Metacritic 82 (DS) to 87 (Xbox 360). The first 40,000 DS units sold out in a week, per Fawkner [V, E2/E3]
  (https://en.wikipedia.org/wiki/Puzzle_Quest:_Challenge_of_the_Warlords). Enemies scale to the hero's level in the story
  campaign [V, E3] (https://www.tvtropes.org/pmwiki/pmwiki.php/VideoGame/PuzzleQuest).
- Dungeon Raid: Fireflame Games, iOS, Nov 2010 (not 2011, not Firebrand). Drag to chain matching tiles. Swords plus skulls in
  one chain hit harder; monsters level up alongside the player [V, E3] (http://www.148apps.com/reviews/dungeon-raid-review/,
  https://www.giantbomb.com/games/3030-34229/).
- Canabalt: built for the Experimental Gameplay Project with one button. Saltsman first built difficulty on distance, then
  reworked it to scale with running speed, which gave players some control of their own pace [V, E2]
  (https://www.destructoid.com/gdc-10-falling-to-your-death-the-canabalt-postmortem/).
- Bejeweled Blitz: launched on Facebook in December 2008 with a 60 s clock [V, E3]
  (https://bejeweled.wiki.gg/wiki/Bejeweled_Blitz). See Q2 for the tuning story.

### Inferences

- [I] 10000000 is a closer twin than any modern match-3 because it shares the one thing that makes MatchRPG unusual: a clock
  that is not a timer but a moving edge, beaten by matching faster. Candy Crush and Puzzle Quest have no such clock.
- [I] YMBAB is the in-family natural experiment. Same input, same designer, three years later, and the answer to "medium cost
  of failure feels bad" was to drop failure and keep progress. MatchRPG kept failure (the dark ends the run). That is a
  deliberate fork worth naming in the report.

### Gaps

- No source gives 10000000's scroll speed, its rank thresholds or castle room costs. The TouchArcade review (403) and archive.org
  (blocked for this tool) could not be read. A play session or the Designer Notes 66 podcast (135 min) is the next step
  (https://designer-notes.com/designer-notes-66-luca-redwood). Redwood there discusses "how he makes sure the player never
  gets unlucky", which is directly relevant to hidden mercy, but I could not get a transcript.
- Canabalt run length and Puzzle Quest's battle-loss penalty are unverified.

---

## Q2. Where did each key pattern first appear, and how was it refined?

### Takeaway

Every MatchRPG pressure knob has a classic ancestor with published numbers. The cleanest lessons are three. Tetris showed that a
monotone speed table ends in an unplayable wall (level 29), and TGM fixed it by making speed rise and fall and by changing the
skill at the top instead of ending play. Bejeweled Blitz measured session length and landed on the shortest one that still
rewards skill. Puzzle Quest showed that random refills read as cheating unless help only ever goes the player's way.

### Cited findings

**Speed ramp by level**
- NES Tetris gravity, frames per cell at 60.0988 fps: level 0 is 48, level 5 is 23, level 8 is 8, level 9 is 6, levels 10-12
  are 5, 13-15 are 4, 16-18 are 3, 19-28 are 2, 29+ is 1. Level advances every 10 lines after the first transition
  [V, E1] (https://tetris.wiki/Tetris_(NES,_Nintendo)).
  Converted for a 20-row field: about 16 s per full drop at level 0, 2.0 s at 9, 1.0 s at 18, 0.67 s at 19, 0.33 s at 29 [I, arithmetic].
  The curve is a ramp of 5 frames per level to level 8, then a cliff (8 to 6), then long plateaus with single-frame steps.
- TGM internal gravity in 1/256 G: 4 at level 0, 64 at 90, 144 at 170, then back to 4 at level 200. It climbs to 1G at 251,
  5G at 400, drops to 4G at 420 and 3G at 450, then jumps to 20G at 500 for the rest of the game [V, E1]
  (https://tetris.wiki/Tetris_The_Grand_Master). Speed rises and falls inside one game; level 200 is a planned relief beat.
- Tetris Attack: the player picks a speed level 1-99, the stack rises faster the longer they survive, and chains and combos
  trigger a Stop that briefly halts the rise [V, E3] (https://www.mariowiki.com/Tetris_Attack,
  https://www.harddrop.com/wiki/Tetris_Attack).
- Canabalt (Flash numbers): start 100 px/s, max 800 px/s. Acceleration is +50 px/s² up to 100, +30 to 250, +20 to 400, +10 to 800,
  so "the faster you go, the slower you speed up". An obstacle cuts speed by 30%. Gaps are at most two-thirds of horizontal
  speed. At top speed the 480 px view leaves about 0.6 s to react. Special buildings appear every 3-8 buildings, about 10 s
  apart at a median 400 px/s. Numbers were tuned by feel, not derived [V, E2] (https://gamedeveloper.com/design/tuning-canabalt).

**Kill screen**
- NES level 29 is 1 frame per cell, too fast for normal tapping. Thor Aackerlund showed it could be beaten in 2011 by hypertapping.
  The highest level reached was 95 by 2022. On 21 Dec 2023 Blue Scuti (13) crashed the game at level 157 after 1,511 lines
  in about 40 min [V, E1/E3] (https://en.wikipedia.org/wiki/Tetris_(NES_video_game),
  https://www.pcgamer.com/after-34-years-a-13-year-old-prodigy-has-become-the-first-person-to-beat-tetris-by-reaching-the-holy-grail-of-high-level-play-a-true-killscreen/).
  Level 29 was never meant as an ending; it is where the table runs out.
- TGM made max speed deliberate. 20G from level 500 means pieces appear already at the bottom, so the skill changes from
  steering to placing. The fan game Shimizu Tetris (TETRIS SEMIPRO-68k) introduced 20G first [V, E3]
  (https://tetris.wiki/Tetris_The_Grand_Master).

**Time attack and earned grade**
- TGM's Grand Master grade needs score and time together: Grade 1 (12,000) by level 300 in under 4:15, S4 (40,000) by 500 in
  under 7:30, and 126,000 by 999 in under 13:30 [V, E1] (https://tetris.wiki/Tetris_The_Grand_Master).
- Bejeweled Blitz: PopCap tried 5, 4, 3 and 2 minute timers; Kapalka called five minutes "quite long, and pretty boring". A 10 s
  test showed players liked short sessions, and one minute "seemed to be the perfect match". Multiplier gems and a speed bonus
  were added so skill still mattered in 60 s. A two-week leaderboard let players sit on a good score and stop returning, so the
  board resets weekly, with a surge every Tuesday [V, E2]
  (https://gamedeveloper.com/game-platforms/gdc-europe-popcap-s-kapalka-talks-i-bejeweled-blitz-i-origins-calls-social-games-a-bit-evil-).
- Zoo Keeper: quota rises and the time limit falls each level; Time Attack is 6 min [V, E3] (Wikipedia URL above). Columns ports
  add a Time Trial [V, E3].

**Run-ending dark edge (a pushing boundary)**
- Tetris Attack: the stack rises from below and the game ends when it tops out; matching holds it back and chains buy Stop time
  [V, E3] (mariowiki URL above).
- 10000000: the scrolling dungeon pushes the hero off the screen if the player fails to match [V, E3] (Wikipedia URL above).
  Wikipedia does not say "left edge"; MatchRPG's left-edge dark is the same rule [K].
- Canabalt: the fall is the edge; speed is the threat, and stumbling (−30%) is both penalty and relief [V, E2] (tuning URL above).

**Meta upgrades between runs**
- Rogue (1980) had none. Toy and Wichman deleted the save on reload to stop save-scumming; Wichman called the idea
  "consequence persistence" [V, E2] (https://en.wikipedia.org/wiki/Rogue_(video_game)).
- Puzzle Quest (2007) kept hero XP, levels, gold and spells across battles inside a campaign; enemies scaled to the hero
  [V, E3] (Wikipedia and TV Tropes URLs above).
- 10000000 (2012) put both together on a phone: a run ends in death, the loot is spent on castle rooms, items and skills, and
  the player keeps "all of your upgrades and even unused items" [V, E3] (https://toucharcade.com/2012/07/26/10000000-review/, via search
  summary; the page itself returned 403). Upgrades raise rank and the score multiplier [V, E3] (https://steamdata.ai/game/227580).
- YMBAB (2015) kept the upgrades and dropped failure [V, E2] (pocketgamer.biz URL above).

**Fixed goal depth**
- Rogue: the Amulet of Yendor is on the lowest floor; Rog-O-Matic found it on level 26. Score rewarded depth [V, E3] (Rogue URL above).
- TGM: the game ends at level 999 [V, E1].
- 10000000: "the aim of the game is to get 10-million points. That's it." [V, E2] (https://nodontdie.com/interviews/luca-redwood).
  Game Informer's writer needed "weeks" of sessions, maxed every upgrade and rank, and only crossed the line by turning on every
  score-boost potion, which makes enemies tougher. The winning run scored 16,034,334. Afterwards "there's nothing meaningful left
  to do" [V, E4] (https://www.gameinformer.com/b/features/archive/2012/12/24/moments-scoring-10000000.aspx).

**Match power feeding combat**
- Shariki (1994, MS-DOS; written 1988 per some sources) is the first swap match-3; PopCap's Diamond Mine (2000) became
  Bejeweled (2001) [V, E3] (https://en.wikipedia.org/wiki/Shariki).
- Puzzle Quest (2007): Fawkner got hooked on Bejeweled and mixed it with Magic: The Gathering and Final Fantasy Tactics. Skulls
  hit, colours charge spells, match-4 gives an extra turn [V, E2] (Wikipedia URL above).
- Dungeon Raid (2010): chains of swords plus skulls hit harder the longer they are [V, E3].
- 10000000 (2012) took it to real time. YMBAB made each tile "verby" (sword for physical, staff for magic, key for chests, shield
  for defence) so the board and the run read as one action [V, E2] (pocketgamer.biz URL above). MatchRPG uses the same tile set [K].

**Perceived fairness of random refills**
- Puzzle Quest drew "the AI cheats" complaints because refills sometimes give free cascades; three in a row of one colour is about
  a 2% event. Soren Johnson: "The human mind is notoriously bad at grasping probability." He argues hidden adjustments should only
  ever favour the player, and the AI should be balanced through visible gear and spells [V, E2]
  (https://www.gamedeveloper.com/game-platforms/analysis-game-ai-our-cheatin-hearts). A second-hand forum report says Fawkner
  described the AI as simply looking ahead at the tiles about to drop [U, E4] (https://forums.505go.com/t/cascade-percentage-based-on-level/590).

### Lineage table

| Pattern | First seen | Refined by | Why the refinement |
|---|---|---|---|
| Speed ramp by level | Tetris speed levels; NES table 1989 | TGM 1998 (rise and fall, 20G), Tetris Attack (speed level climbs with time), Canabalt 2009 (diminishing acceleration, speed lost on mistakes), 10000000 2012 (scroll) | A monotone table runs out of room. Later games give relief inside the ramp or tie speed to the player's own play |
| Kill screen | NES Tetris level 29 (accidental) | TGM 20G (intentional, playable by design) | An unplanned wall ends play; a planned top speed changes the skill instead |
| Time attack | Columns Time Trial, Zoo Keeper Time Attack 6 min (2003) | Bejeweled Blitz 60 s (2008), TGM time gates for grades | Short fixed sessions fit social and mobile play; skill has to be rewarded inside the box (multipliers, speed bonus) |
| Run-ending pushing edge | Tetris Attack's rising stack (1995) [I as first] | 10000000 scroll (2012), MatchRPG dark plus EDGE_MERCY [K] | The threat is spatial and visible, and matching is the only way to push it back |
| Meta upgrades between runs | Puzzle Quest campaign XP (2007), 10000000 castle (2012) | YMBAB crew and no fail state (2015); Rogue Legacy 2013 (other researcher) | Softens termination; Redwood's open problem was good players overpowering the game |
| Fixed goal depth | Rogue's Amulet on the deepest floor (1980) | TGM level 999, 10000000's 10,000,000 points | A finite target gives the run a story; the post-goal mode is the weak point in both 10000000 and its reviews |
| Match power feeds combat | Puzzle Quest (2007) | Dungeon Raid chains (2010), 10000000 real time (2012), YMBAB "verby" tiles (2015) | Each step removed a layer between the match and the hit |
| Fair-looking randomness | Puzzle Quest complaints (2007) | Johnson's rule (2009): help only the player, in secret | Players read unseen refills as cheating |

### Inferences

- [I] MatchRPG's scroll is a Canabalt-style ramp on a 10000000 board. BASE_SCROLL 18 to MAX_SCROLL 60 at SCROLL_ACCEL 0.15 [K]
  is a 3.3x range. NES Tetris covers 48x (48 to 1 frames) and Canabalt 8x (100 to 800 px/s). A 3.3x range is mild; the pressure
  in MatchRPG comes from encounters stopping the hero, not from raw scroll speed.
- [I] Canabalt's −30% on a stumble is a self-correcting curve: mistakes lower the pressure. MatchRPG's EDGE_MERCY 0.45 [K] does the
  same job in space instead of on error. Both are Johnson's rule in practice: help that only ever favours the player and is
  hard to see.
- [I] Tetris Attack's Stop is the ancestor of MatchRPG's held timers. MatchRPG holds the chain clock while the board resolves or
  cannot be played (`Runner.chain_waits`, `Runner.board_waiting`) [K]. Tetris Attack goes further and pauses the threat itself
  as a reward for chains. That is a cheap, legible relief beat MatchRPG does not have.
- [I] TGM's level 200 drop (144/256 back to 4/256) is a sawtooth inside one run with the set being 100-200 levels. MatchRPG's
  per-world sawtooth (worlds of 36 encounters, elites at 12 and 24) [K] is the same shape. TGM shows it works even in a pure
  speed game.

### Gaps

- Original 1984 Tetris speed rules and the Game Boy table were not checked.
- No developer source for why TGM's curve dips or why 20G starts at 500. Only fan commentary was found.
- "First" pushing edge is an inference. Forced-scroll platformers and shooters may predate Tetris Attack; not researched.

---

## Q3. What do the classic twins say about cost of failure and session length?

### Takeaway

The classic record brackets MatchRPG. Rogue, Tetris and Dungeon Raid end the run and keep nothing. YMBAB keeps everything and
never fails. 10000000 sits in the middle, and so does MatchRPG. On session length, Bejeweled Blitz and 10000000 converge on
1-3 minutes for a phone, measured in Blitz's case. MatchRPG's story median of 177 s is in that band; the endless median of 559 s
is three times longer and has no classic twin that tuned for it.

### Cited findings

- Blitz: 5 min "quite long, and pretty boring", 1 min "the perfect match" [V, E2] (Kapalka URL above).
- 10000000: designed for 2-3 min sessions; runs of 2-5 min [V, E2/E3] (Wikipedia, GameSkinny).
- YMBAB: a 30 s session must advance the game, so no fail state [V, E2] (pocketgamer.biz).
- Redwood called the post-goal endless mode "a bit of a cop out" [V, E2]; a reviewer found replays stale because upgrades and
  enemy difficulty stopped scaling [V, E4] (https://dorkadia.com/2013/08/06/10000000-review, via search summary).

### Inferences

- [I] Endless in 10000000 failed because nothing kept scaling. MatchRPG's ENDLESS_POWER 0.12 and the world shuffle [K] answer the
  difficulty half of that review. The power half (upgrades capped) is still open and belongs to the endless researcher.
- [I] The 6-8 hour total for 10000000 is a useful benchmark for MatchRPG's time to first clear. With 6 wins in 667 story runs [K],
  agent 0b can compute minutes to first win and compare.

### Gaps

- No classic twin publishes a depth or death funnel. These games give rules and session numbers, not telemetry.

---

## Pattern cards

### 1. Speed table with plateaus and a cliff
- Lineage: NES Tetris 1989 -> TGM 1998 -> Canabalt 2009 -> 10000000 2012. Later games add relief and tie speed to play.
- Feeling: Challenge. Each step is felt as a new tier; plateaus let players grok a speed.
- Mechanism: a lookup table speed[level]. NES: 48, 43, 38, 33, 28, 23, 18, 13, 8, 6, 5, 5, 5, 4, 4, 4, 3, 3, 3, 2 (x10), 1 frames per cell.
- Works when the player can read the level change. Breaks when the table runs out (level 29) or the cliff is too steep (8 to 6).
- Evidence: [V, E1] https://tetris.wiki/Tetris_(NES,_Nintendo)
- Cost: S. Knobs are the table values and the level step (10 lines).
- MatchRPG: SCROLL_ACCEL is a continuous ramp, not a table [K]. A table by encounter count would be easier to read in telemetry
  (death rate per speed step) and to tune with 5 players.
- See it in action: https://tetris.wiki/Tetris_(NES,_Nintendo)

### 2. Planned top speed that changes the skill (anti-kill-screen)
- Lineage: NES level 29, accidental -> Shimizu Tetris 20G -> TGM 20G at level 500.
- Feeling: Challenge, then fiero at mastery.
- Mechanism: cap speed at a value where play is still possible but different (TGM pieces spawn at the floor; placement replaces steering).
- Works with a long skill ceiling. Breaks if the cap arrives before players learn the new skill.
- Evidence: [V, E1/E3] https://tetris.wiki/Tetris_The_Grand_Master ; kill screen history [V, E1] https://en.wikipedia.org/wiki/Tetris_(NES_video_game)
- Cost: S. Knob is the cap and when it arrives.
- MatchRPG: MAX_SCROLL 60 [K] is the cap. Check in telemetry whether endless deaths cluster at the cap (a wall) or spread out (a skill).
- See it in action: https://www.pcgamer.com/after-34-years-a-13-year-old-prodigy-has-become-the-first-person-to-beat-tetris-by-reaching-the-holy-grail-of-high-level-play-a-true-killscreen/

### 3. In-run sawtooth of speed
- Lineage: TGM 1998 (gravity drops at 200 and at 420-450).
- Feeling: Challenge with relief beats inside one run.
- Mechanism: gravity[level] is not monotone. 144/256 at 170, 4/256 at 200; 5G at 400, 3G at 450, then 20G at 500.
- Works in runs over a few minutes. Breaks in 60 s sessions, where there is no room for a dip.
- Evidence: [V, E1] https://tetris.wiki/Tetris_The_Grand_Master
- Cost: S.
- MatchRPG: the world boss already resets the set [K]. A scroll dip after each elite, set = world, is the TGM move.
- See it in action: https://tetris.wiki/Tetris_The_Grand_Master

### 4. Self-correcting speed (mistakes lower pressure)
- Lineage: Canabalt 2009 (difficulty moved from distance to speed) -> MatchRPG EDGE_MERCY [K].
- Feeling: Sensation and Challenge without sudden death.
- Mechanism: acceleration falls as speed rises (+50, +30, +20, +10 px/s²); a hit costs 30% speed and raises acceleration again.
- Works when the player controls speed through skill. Breaks if the slowdown is visible enough to feel patronising.
- Evidence: [V, E2] https://gamedeveloper.com/design/tuning-canabalt ; https://www.destructoid.com/gdc-10-falling-to-your-death-the-canabalt-postmortem/
- Cost: S. Knobs are the acceleration tiers and the penalty.
- MatchRPG: a scroll that drops briefly after the hero takes a hit would be the same rule tied to error instead of position.
- See it in action: https://en.wikipedia.org/wiki/Canabalt

### 5. Forgiving hitboxes (hidden mercy at the edge)
- Lineage: Canabalt 2009.
- Feeling: "I made it" moments that feel earned.
- Mechanism: 12x14 hitbox on a 24x24 sprite, 2 px obstacle hitboxes, 8 px extra ledge on the right for late jumps.
- Works when nobody notices. Breaks if players find it and exploit it.
- Evidence: [V, E2] https://gamedeveloper.com/design/tuning-canabalt
- Cost: S.
- MatchRPG: the dark's catch point could sit a few pixels behind the visual edge. Same family as EDGE_MERCY [K].
- See it in action: https://en.wikipedia.org/wiki/Canabalt

### 6. Pushing edge held back by matches, with Stop on chains
- Lineage: Tetris Attack 1995/1996 -> 10000000 2012 -> MatchRPG dark [K].
- Feeling: Challenge as tug of war; relief earned by skill.
- Mechanism: the threat advances at speed[level]; a chain or combo pauses it for a short Stop.
- Works when matching is the only counter. Breaks if the player cannot see the edge while watching the board.
- Evidence: [V, E3] https://www.mariowiki.com/Tetris_Attack ; https://www.harddrop.com/wiki/Tetris_Attack
- Cost: S. Knobs are Stop length per chain size.
- MatchRPG: holds already freeze clocks when the board cannot be played [K]. A short scroll Stop on big combos would turn a held
  timer into a reward. Test against `Runner.CHAIN_STOPS` history so it does not repeat v0.7.5's cut [K].
- See it in action: https://www.mariowiki.com/Tetris_Attack

### 7. Measured session box
- Lineage: Zoo Keeper Time Attack 6 min (2003) -> Bejeweled Blitz 60 s (2008).
- Feeling: Challenge, short and repeatable.
- Mechanism: one fixed clock; multipliers and speed bonus keep skill visible inside it.
- Works for social score races. Breaks when a run needs build-up (power curve) to matter.
- Evidence: [V, E2] Kapalka at GDC Europe 2010, https://gamedeveloper.com/game-platforms/gdc-europe-popcap-s-kapalka-talks-i-bejeweled-blitz-i-origins-calls-social-games-a-bit-evil-
- Cost: S.
- MatchRPG: not a clock, but the method applies. PopCap tested 5, 4, 3, 2 min and 10 s. MatchRPG can test FIRST_RUN_ACCEL and
  SCROLL_ACCEL settings by their effect on median run length against the 177 s baseline [K].
- See it in action: https://bejeweled.wiki.gg/wiki/Bejeweled_Blitz

### 8. Weekly leaderboard reset
- Lineage: Bejeweled Blitz (two-week board replaced by weekly).
- Feeling: Fellowship and Challenge; a fresh chance every week.
- Mechanism: reset the board on a fixed weekday.
- Works with a returning population. Breaks with very few players (21 in MatchRPG's data [K]).
- Evidence: [V, E2] Kapalka, same URL.
- Cost: S.
- MatchRPG: the per-version board already resets on each release [K]. That is a reset at release cadence; weekly would add a
  Tuesday-style return beat.
- See it in action: https://bejeweled.wiki.gg/wiki/Bejeweled_Blitz

### 9. Earned grade by score and time
- Lineage: TGM 1998.
- Feeling: Challenge and fiero; a rank that means mastery.
- Mechanism: grade from score thresholds (9 at 0 up to S9 at 120,000) plus time gates (level 300 under 4:15, 500 under 7:30, 999 under 13:30).
- Works when the grade is public and rare. Breaks if the gate is opaque.
- Evidence: [V, E1] https://tetris.wiki/Tetris_The_Grand_Master
- Cost: M.
- MatchRPG: tiers come from pace (moves per second), a pacing DDA, and are visible while the clock is not [K]. TGM's grade is
  earned and changes nothing. The contrast is worth keeping in the report: MatchRPG's tier both names and adjusts.
- See it in action: https://tetris.wiki/Tetris_The_Grand_Master

### 10. Loot comes home (meta upgrades between short runs)
- Lineage: Rogue 1980 (none, consequence persistence) -> Puzzle Quest 2007 (campaign XP) -> 10000000 2012 (castle) -> YMBAB 2015 (crew, no fail).
- Feeling: Challenge plus Submission; a bad run still pays.
- Mechanism: run loot converts to permanent upgrades that raise rank, multiplier and starting power.
- Works with 2-5 min runs. Breaks when good players overpower the content (Redwood) or when upgrades cap out (10000000 endless).
- Evidence: [V, E2] https://www.pocketgamer.biz/making-of-you-must-build-a-boat/ ; [V, E3] https://en.wikipedia.org/wiki/10000000_(video_game)
- Cost: M.
- MatchRPG: town, talents, hero level [K]. The open risk is the same as Redwood's: track depth vs hero level by tier.
- See it in action: https://en.wikipedia.org/wiki/10000000_(video_game)

### 11. One fixed goal, then endless
- Lineage: Rogue's Amulet (1980) -> TGM level 999 -> 10000000's 10,000,000 points.
- Feeling: Narrative and fiero at the goal.
- Mechanism: a single number ends the story mode; the post-game is endless scoring.
- Works for the first clear. Breaks after it: "a bit of a cop out" (Redwood), "nothing meaningful left to do" (Game Informer).
- Evidence: [V, E2] https://gameinformer.com/b/features/archive/2012/12/26/afterwords-10000000.aspx ; [V, E4] https://www.gameinformer.com/b/features/archive/2012/12/24/moments-scoring-10000000.aspx
- Cost: S for the goal, L for a good post-game.
- MatchRPG: 6666 m and Astaroth [K]. Endless with ENDLESS_POWER is the answer to 10000000's flat replay; verify with endless run lengths.
- See it in action: https://en.wikipedia.org/wiki/10000000_(video_game)

### 12. Match power feeds combat
- Lineage: Puzzle Quest 2007 -> Dungeon Raid 2010 -> 10000000 2012 -> YMBAB 2015 "verby" tiles.
- Feeling: Fantasy and Expression on a puzzle board.
- Mechanism: tile type maps to one verb (sword hits, staff casts, shield blocks, key opens); bigger matches hit harder.
- Works when each tile has one clear verb. Breaks when tiles carry several meanings.
- Evidence: [V, E2] https://en.wikipedia.org/wiki/Puzzle_Quest:_Challenge_of_the_Warlords ; https://www.pocketgamer.biz/making-of-you-must-build-a-boat/
- Cost: M.
- MatchRPG: same tile set [K].
- See it in action: https://en.wikipedia.org/wiki/Puzzle_Quest:_Challenge_of_the_Warlords ; https://www.giantbomb.com/games/3030-34229/

### 13. Help only goes the player's way (anti "the AI cheats")
- Lineage: Puzzle Quest complaints 2007 -> Soren Johnson's column 2009 -> MatchRPG "Mercy is hidden" [K].
- Feeling: protects perceived fairness.
- Mechanism: hidden adjustments may help the player and never the enemy; enemy strength changes only through visible stats.
- Works always. Breaks when a hidden help is found and feels like condescension (DDA paradox).
- Evidence: [V, E2] https://www.gamedeveloper.com/game-platforms/analysis-game-ai-our-cheatin-hearts
- Cost: S (a rule, not a system).
- MatchRPG: EDGE_MERCY obeys it [K]. The tier clock speeds the dungeon up for quick players, which is a hidden adjustment against
  them. Johnson's rule says to keep that legible (the tier name does part of this).
- See it in action: https://en.wikipedia.org/wiki/Puzzle_Quest:_Challenge_of_the_Warlords

---

## Fun hypotheses

- Players in their first 5 runs should feel Challenge at minute 2-3, because MatchRPG runs end near 10000000's 2-3 min design
  target and Blitz's measured sweet spot is short. If the story median drifts past 5 min, expect Blitz's "long and boring" finding.
- Players at MAX_SCROLL in endless should feel the speed as a new skill, as TGM 20G players do, and not as a wall. Endless deaths
  spread evenly after the cap mean skill; a spike at the cap means a kill screen.
- A big combo should feel like it bought time (Tetris Attack Stop). Today it buys damage and a held clock but not distance from the dark.

## Anti-patterns

- Accidental kill screen: a speed table that runs out (NES level 29).
- Flat post-game: endless with capped upgrades and no new scaling (10000000 reviews).
- Hidden help for the enemy, or randomness that looks like it: the Puzzle Quest "AI cheats" perception.
- Long session in a box format: Blitz at 5 min.
- Good players outgrowing the content through meta-progression (Redwood's YMBAB problem).

## Glossary additions

| Term | Meaning | Source |
|---|---|---|
| Kill screen | The point where a game becomes unplayable or crashes because a table or counter runs out. Not a designed ending. | NES Tetris |
| Gravity (G) | Falling speed in cells per frame. 1G is one cell per frame; 20G is instant. | Tetris The Grand Master |
| Top speed (cap) | A designed maximum of a speed ramp, playable by design. Contrast with kill screen. | TGM; MatchRPG MAX_SCROLL |
| Pushing edge | A visible boundary that advances and ends the run on contact, held back by play. | Tetris Attack, 10000000 |
| Stop time | A short pause of the pushing edge earned by a chain or combo. A relief beat paid by skill. | Tetris Attack |
| Time attack | A mode with one fixed clock; score within it. | Zoo Keeper, Bejeweled Blitz |

## Sources

1. NES Tetris gravity table, Tetris Wiki: https://tetris.wiki/Tetris_(NES,_Nintendo)
2. Tetris The Grand Master speed and grades, Tetris Wiki: https://tetris.wiki/Tetris_The_Grand_Master
3. NES Tetris kill screen history, Wikipedia: https://en.wikipedia.org/wiki/Tetris_(NES_video_game)
4. PC Gamer on Blue Scuti, Jan 2024: https://www.pcgamer.com/after-34-years-a-13-year-old-prodigy-has-become-the-first-person-to-beat-tetris-by-reaching-the-holy-grail-of-high-level-play-a-true-killscreen/
5. 10000000, Wikipedia: https://en.wikipedia.org/wiki/10000000_(video_game)
6. Game Informer, Afterwords 10000000 (Dec 2012): https://gameinformer.com/b/features/archive/2012/12/26/afterwords-10000000.aspx
7. Game Informer, Moments: scoring 10000000 (Dec 2012): https://www.gameinformer.com/b/features/archive/2012/12/24/moments-scoring-10000000.aspx
8. No Don't Die interview with Luca Redwood: https://nodontdie.com/interviews/luca-redwood
9. Pocket Gamer.biz, Making of You Must Build A Boat: https://www.pocketgamer.biz/making-of-you-must-build-a-boat/
10. Gamezebo YMBAB review: https://www.gamezebo.com/reviews/you-must-build-a-boat-review-ship-of-dreams/
11. GameSkinny 10000000 review (run length, search summary): https://www.gameskinny.com/reviews/10000000-review-freedom-at-last/
12. TouchArcade 10000000 review (403 on fetch, search summary only): https://toucharcade.com/2012/07/26/10000000-review/
13. Dorkadia 10000000 review (search summary only): https://dorkadia.com/2013/08/06/10000000-review
14. Steamdata 10000000 listing: https://steamdata.ai/game/227580
15. Designer Notes 66, Luca Redwood (not transcribed): https://designer-notes.com/designer-notes-66-luca-redwood
16. Puzzle Quest, Wikipedia: https://en.wikipedia.org/wiki/Puzzle_Quest:_Challenge_of_the_Warlords
17. Puzzle Quest, TV Tropes: https://www.tvtropes.org/pmwiki/pmwiki.php/VideoGame/PuzzleQuest
18. Soren Johnson, Our Cheatin' Hearts (2009): https://www.gamedeveloper.com/game-platforms/analysis-game-ai-our-cheatin-hearts
19. 505 Games forum, cascade thread: https://forums.505go.com/t/cascade-percentage-based-on-level/590
20. Dungeon Raid review, 148Apps: http://www.148apps.com/reviews/dungeon-raid-review/
21. Dungeon Raid, Giant Bomb: https://www.giantbomb.com/games/3030-34229/
22. Bejeweled Blitz, Bejeweled Wiki: https://bejeweled.wiki.gg/wiki/Bejeweled_Blitz
23. Kapalka at GDC Europe, Game Developer: https://gamedeveloper.com/game-platforms/gdc-europe-popcap-s-kapalka-talks-i-bejeweled-blitz-i-origins-calls-social-games-a-bit-evil-
24. Tuning Canabalt, Game Developer: https://gamedeveloper.com/design/tuning-canabalt
25. Canabalt GDC 2010 postmortem, Destructoid: https://www.destructoid.com/gdc-10-falling-to-your-death-the-canabalt-postmortem/
26. Canabalt, Wikipedia: https://en.wikipedia.org/wiki/Canabalt
27. Tetris Attack, Super Mario Wiki: https://www.mariowiki.com/Tetris_Attack
28. Tetris Attack, Hard Drop: https://www.harddrop.com/wiki/Tetris_Attack
29. Columns, Wikipedia: https://en.wikipedia.org/wiki/Columns_(video_game)
30. Zoo Keeper, Wikipedia: https://en.wikipedia.org/wiki/Zoo_Keeper_(2003_video_game)
31. Rogue, Wikipedia: https://en.wikipedia.org/wiki/Rogue_(video_game)
32. Shariki, Wikipedia: https://en.wikipedia.org/wiki/Shariki
33. MatchRPG CLAUDE.md and CONTEXT.md [K]: /Users/esenespinosa/Development/personal/games/matchRPG/CLAUDE.md
