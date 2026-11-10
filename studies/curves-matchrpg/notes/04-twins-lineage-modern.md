# 04. Twin lineage B: modern twins (2012-2026)

Researcher 2. Scope is how modern games refined the classic curve patterns. Tetris, Bejeweled, Puzzle Quest,
Dungeon Raid, 10000000 and You Must Build A Boat belong to researcher 1 and are only named here as ancestors.
Hearthguard (Curves #1) already covered Hades God Mode, Risk of Rain 2 difficulty over time, the L4D director,
Celeste assists and the ascension ladder as a glossary term. This note cites those rather than re-researching them.

Tags follow CONTEXT.md. Verification [V] [I] [U] [K], grade E1-E4. Fandom wikis returned HTTP 402 during this
session, so numbers come from wiki.gg, balatrowiki.org, the Brotato wiki on spellsandguns.com,
vampire.survivors.wiki, search-result extracts of fandom pages (marked as such) and press.

## Structural conditions table

Symbols compare each twin to MatchRPG. ● same, ◐ partly, ○ different.
MatchRPG baseline: touch sliding match-3 with auto-walking hero; 1.5-6 min story runs (median 177 s), about 9 min
endless; high randomness; medium cost of failure (run ends, meta carries); solo with leaderboard and tiers;
mobile web first [K].

| Twin (year) | Input | Session | Randomness | Cost of failure | Social | Platform | Why chosen |
|---|---|---|---|---|---|---|---|
| Puzzle & Dragons (2012) | ◐ touch, drag orbs on a grid, turn-based | ◐ dungeon of a few minutes, stamina-gated | ● orb drops | ○ stamina spent, no run meta | ◐ friend helpers, rankings | ● phone | Match-3 combat on phones with a stamina gate on sessions |
| Marvel Puzzle Quest (2013) | ◐ swap match-3, turn-based | ◐ one fight 2-5 min | ● | ◐ health and time, roster persists | ◐ PvE event ladders | ● phone, PC | Documented natural experiment with enemy level scaling against player roster |
| Empires & Puzzles (2017) | ◐ swap match-3, turn-based | ◐ short stages, energy-gated | ● | ◐ energy spent, heroes persist | ◐ alliances | ● phone | Mobile match-3 RPG with a long hero-ascension wall |
| Candy Crush Saga (2012) | ◐ swap match-3, no hero | ◐ one level 1-3 min | ● | ◐ a life spent, map progress kept | ◐ friends map | ● phone | The best published data on per-level difficulty and churn |
| Peglin (2022) | ○ aim and shoot pachinko | ◐ run 30-60 min [U] | ● | ◐ run ends, unlocks persist | ○ solo | ◐ PC, phone | Puzzle-board-powers-combat loop with a 20-step opt-in ladder |
| Luck be a Landlord (2021) | ○ press spin, pick symbols | ◐ run about 20-40 min [U] | ● | ◐ run ends, little meta | ○ solo | ◐ PC, phone | The cleanest published ramp table: rent due every N spins |
| Balatro (2024) | ○ choose cards | ○ run 30-60+ min | ● | ◐ run ends, unlocks persist | ○ solo | ◐ PC, phone | Fixed exponential score target per ante, stakes ladder, an endless with a known formula |
| Slay the Spire (2019) | ○ choose cards | ○ run 45-90 min | ● | ◐ run ends, unlocks persist | ○ solo | ◐ | The origin of the numbered ascension ladder |
| Vampire Survivors (2022) | ◐ one-thumb movement, auto attack | ◐ 30 min fixed run | ● | ◐ run ends, gold buys upgrades | ○ solo | ● PC, phone | Power fantasy with density over real minutes and a hard 30:00 end |
| Brotato (2022) | ◐ one-stick movement, auto attack | ● waves of 20-90 s, run about 20 min | ● | ◐ run ends, unlocks | ○ solo | ● PC, phone | Short fixed waves, a Danger ladder and a published endless formula |
| Dead Cells (2018) | ○ action platformer | ◐ run 30-60 min | ● | ◐ | ○ | ◐ | Boss Cell ladder that removes healing rather than buffing stats |
| Super Hexagon (2012) | ◐ two-button rotate under pressure | ● runs of seconds | ◐ pattern draws | ● run ends, instant retry | ◐ best time | ● phone first | Time to retry near zero, difficulty as named modes |
| Crossy Road (2014), Temple Run (2011), Subway Surfers (2012) | ◐ tap or swipe under a scrolling camera | ● 1-5 min | ● | ◐ run ends, coins persist | ◐ score | ● phone | A chaser behind the player, like MatchRPG's dark |

Twins pruned for lack of data in this pass (see Gaps): Gems of War, Legend of Solgard, Puzzle Combat, Hero Wars,
Backpack Hero, Dicey Dungeons, Rogue Legacy, Downwell, Tetris Effect and Tetris 99, Jetpack Joyride.

---

## Q1. How do modern twins ramp challenge inside a run?

### Takeaway
The modern standard is a fixed, published target table that grows faster than linear and that the player reads
before acting. Balatro and Luck be a Landlord put the next target on screen. Brotato and Vampire Survivors tie the
ramp to real seconds. MatchRPG's ramp is a scroll speed and a depth power, both hidden from the player [K]. The
twins suggest showing the next pressure step, not the formula.

### Cited findings
- Balatro base chip target per ante, white stake: 300, 800, 2,000, 5,000, 11,000, 20,000, 35,000, 50,000 for
  antes 1-8. Green stake ante 8 is 100,000, purple 200,000. Small blind 1x, big blind 1.5x, most boss blinds 2x,
  The Wall 4x, Violet Vessel 6x [V, E3] https://balatrowiki.org/w/Blinds_and_Antes
  Ratio between antes at white stake is 2.7, 2.5, 2.5, 2.2, 1.8, 1.75, 1.43. The growth slows near the end of the
  story run [I from the table].
- Balatro endless (ante 9+) is far steeper: 110,000 at ante 9, 7.2 million at ante 11, 8.6e20 at ante 16, and the
  number overflows at ante 39 [V, E3] https://balatrowiki.org/w/Blinds_and_Antes
- Luck be a Landlord rent schedule on floor 1: 25 coins after 5 spins, 50/5, 100/6, 150/6, 225/7, 275/7, 325/8,
  375/8, 500/9, 550/9, 650/10, and a 12th payment reported as 777. Twelve payments win the run. Higher floors add
  25 coins to single payments (floor 2 raises rent 7, floor 3 raises rent 8) [V, E3 for 1-11 via a search
  extract of the fandom Rent page; U for 777] https://luck-be-a-landlord.fandom.com/wiki/Rent ,
  https://luck-be-a-landlord.fandom.com/wiki/Floors
- Brotato wave 1 lasts 20 s and each wave adds 5 s up to 60 s. Wave 20 (boss) is listed at 90 s [V, E3]
  https://brotato.wiki.spellsandguns.com/Waves
- Brotato endless past wave 20: Endless_factor = (w(w+1)/2)/100 × mult, with w = wave - 20 and mult = 2.0 plus
  0.2 per wave past 35. Damage × (1 + factor), HP × (1 + 2.25 × factor), speed capped at 2.75x. At wave 30 that is
  +110% damage and +248% HP; at wave 40, +630% and +1418% [V, E3]
  https://brotato.wiki.spellsandguns.com/Endless_Mode
- Vampire Survivors runs end at 30:00 when the Reaper arrives. One more Reaper spawns each minute after 30. Each
  hit deals 65,535 [V, E3 for timing; U, E4 for HP of 65,535 × player level from a Steam thread]
  https://steamcommunity.com/app/1794680/discussions/0/3473981814925100952 ,
  https://www.gameskinny.com/tips/vampire-survivors-how-to-beat-red-death/
- Vampire Survivors on-screen enemies are capped at 500 regardless of Curse [V, E3]
  https://vampire.survivors.wiki/w/Curse
- Subway Surfers speed rises with distance, and a developer reply on itch.io says max speed is set by upgrades
  rather than time. No published speed table found [U, E4] https://itch.io/post/1997398

### Inferences
- [I] Two shapes exist. Story ramps (Balatro antes 1-8, Landlord rents 1-12, Brotato waves 1-20) grow about
  1.5-2.5x per step and are tuned so a good build keeps up. Endless ramps (Balatro 9+, Brotato 21+, Vampire
  Survivors after 30:00) switch to super-exponential or a kill wall so runs end. MatchRPG's endless uses
  ENDLESS_POWER 0.12 per step past the bottom [K], which is gentle by comparison. Endless runs median 559 s [K],
  so the gentle ramp may be what keeps endless at 9 minutes. Agent 0b can check whether endless deaths cluster
  or spread.
- [I] Landlord adds a spin to the deadline every second payment. The time to pay grows while the amount grows
  faster. That is a sawtooth inside the run with the set being one rent period. MatchRPG's elite at encounters
  12 and 24 and boss at 36 is the same shape with the set being a world [K].

### Gaps
- No primary source for Vampire Survivors per-minute wave tables; the fandom Stages page was blocked.
- No speed tables for Subway Surfers, Temple Run or Jetpack Joyride.

---

## Q2. How do opt-in ladders refine difficulty after the first clear?

### Takeaway
Every modern roguelite twin adds a numbered ladder that unlocks after a clear. Slay the Spire set the template
(20 steps, each stacking). Peglin and Balatro copied the count and stacking rule. The ladders mostly do three
things in a fixed mix: enemy stats up, player healing or economy down, and late steps that add new behaviour.
MatchRPG's endless is a lap ramp, not a ladder [K]. A ladder fits its post-win state.

### Cited findings
- Slay the Spire ascension 1-20: 1 more elites (about 60% more), 2-4 normal/elite/boss damage up, 5 heal 75% of
  missing HP after a boss, 6 start at 90% HP, 7-9 normal/elite/boss HP up, 10 Ascender's Bane curse, 11 one fewer
  potion slot, 12 fewer upgraded cards (25% less in Act 2, 50% less in Act 3), 13 bosses drop 25% less gold,
  14 lower max HP, 15 worse events, 16 shops 10% dearer, 17-19 new movesets, 20 double final boss [V, E3]
  https://www.hermitgamer.com/slay-the-spire-ascension/
- Peglin cruciball 1-20: 1 extra weak orb, 2 minibosses in ? nodes, 3 one fewer crit peg, 4 misnavigation
  damage 4, 5 one fewer refresh peg, 6 enemy HP up, 7 post-battle heal 15%, 8 no starting gold and fights pay
  40 instead of 50, 9 bomb self-damage 5, 10 boss HP up, 11 and 16 start with a cursed orb, 12 bombs -10 damage,
  13 boss heal 50%, 14 -15% max HP, 15 enemies act during reload, 17 miniboss damage up, 18 shop prices up,
  19 extra enemies in normal fights, 20 per-boss new behaviours [V, E3] https://peglin.wiki.gg/wiki/Cruciball
- Peglin added the first cruciball levels in v0.7.20 (early access devlog) [V, E2]
  https://gedig.itch.io/peglin/devlog/383097/the-first-cruciball-levels-are-here-v0720
- Balatro's 8 stakes: white base, red removes small blind cash, green steeper ante scaling, black eternal
  jokers, blue -1 discard, purple steeper scaling again, orange perishable jokers, gold rental jokers. Each
  includes the ones before [V, E3] https://balatrowiki.org/w/Stakes
- Brotato Danger 0-5: Danger 1-2 add new enemy types, Danger 3 +12% enemy damage and HP, Danger 4 +26%,
  Danger 5 +40% and two bosses at 75% HP each. Elites or hordes appear in round 11-12 from Danger 2 and in three
  rounds between 11 and 18 from Danger 4. Percentages are totals, not cumulative [V, E3]
  https://brotato.wiki.spellsandguns.com/Dangers
- Dead Cells Boss Cells 1-5 (unlocked by beating the final boss) raise enemy tier and density, remove healing
  fountains and add Malaise, which kills at 10 stacks [V, E3]
  https://deadcells.wiki.gg/wiki/BSC , https://www.gamesradar.com/uk/dead-cells-is-getting-an-easy-mode-and-im-redownloading-it-after-rage-quitting-years-ago
- Hades Pact of Punishment: 15 conditions (16 in Hell Mode), each rank adds Heat, max 63 or 64 [V, E3]
  https://rpgsite.net/feature/10287-hades-pact-of-punishment-heat-modifiers-and-how-to-maximize-your-rewards
  Hearthguard's E2 card covers the player-picked version.

### Inferences
- [I] Count the step types. Slay the Spire: 9 of 20 are stat bumps, 6 cut healing or economy, 4 add behaviour,
  1 is structural. Peglin: 4 stat bumps, 9 cut the player's tools or economy, 5 add behaviour or enemies.
  Brotato needs only 6 steps because it starts from short waves. A 10-step ladder of 1 knob each is enough for a
  game with 5 worlds and 3-minute runs.
- [I] Healing cuts are the cheapest high-impact steps. Peglin 7 and 13 and Slay the Spire 5 each change felt
  difficulty a lot with one number. MatchRPG has potions, belt and a kit heal [K]; a "one fewer belt slot"
  step is the Slay the Spire 11 analogue.
- [I] Brotato and Peglin both cap a step at around +40% enemy stats across the whole ladder, then change
  behaviour instead. More stat inflation reads as grind.

### Gaps
- Exact Peglin percentages for steps 6 and 10 are not given on the wiki.
- No published win rate per ascension or cruciball level. Steam global achievement rates would give a funnel
  but were not fetched in this pass.

---

## Q3. How do mobile match-3 RPGs scale enemy power against team power, and gate sessions?

### Takeaway
They gate sessions with a regenerating energy bar and scale enemies to the roster. When enemy level followed the
player's own strength, players called it punishment for growing. Marvel Puzzle Quest is the long-running natural
experiment. MatchRPG's tier clock follows pace, not power [K], and players never see it. That avoids MPQ's
complaint but keeps the DDA paradox risk.

### Cited findings
- Puzzle & Dragons: stamina regenerated 1 point per 3 minutes in the US build around version 8.6, refills fully
  on rank up, and the cap grows with rank. Tougher dungeons cost more stamina, which limits experienced players'
  sessions [V, E3] https://www.instructables.com/Puzzle-and-Dragons-beginners-guide ,
  https://www.deconstructoroffun.com/blog//2013/02/how-puzzle-dragons-does-it.html
- P&D version 7.2 (2014) shortened the stamina refresh time [V, E3]
  https://www.gamenguide.com/articles/13239/20140917/puzzle-and-dragons-update-details-7-2-version-adds-coin-dungeons-decreases-stamina-refresh-time.htm
- Marvel Puzzle Quest PvE used personal scaling (enemy level from the player's roster) and community scaling
  (node level rose with how all players did). Players reported a single 5-star cover pushed enemy levels up
  sharply, and strong rosters felt behind at event start. Developers ran public scaling tests in March 2016 and
  turned community scaling off later [V, E3]
  https://forums.d3go.com/discussion/41413/pve-scaling-testing-enemy-of-the-state-03-17-16 ,
  https://forums.d3go.com/discussion/comment/529739 , https://forums.d3go.com/discussion/comment/399402
- Empires & Puzzles has separate world, raid and titan energy, refilled by time or flasks. Some ascension
  materials only come from events and alliance titans [V, E3]
  https://empuzzled.com/farming-guide , https://www.bluestacks.com/blog/game-guides/empires-puzzles-rpg-quest/eap-farming-guide-en.html
- King's 2024 GDC talk (Jan Wedekind, Xavier Guardiola) on Candy Crush Saga level 65: originally the last level,
  the highest-converting level ever and the biggest churn point. Raising difficulty lifted short-term conversion;
  easing it kept players longer and paid more later. The harder a level, the shorter it should be. King
  measures fun with "time to abandon" and "time to pass" and rebuilt its 100 least fun levels, with a
  significant engagement uplift. Quote: "Crazy hard levels never pay off" [V, E2, vendor-reported figures]
  https://mobilegamer.biz/how-king-defines-a-good-candy-crush-saga-level-and-why-it-constantly-prunes-the-bad-ones/
- Candy Crush per-level difficulty is set by an automatic script after a few weeks of play, per community
  moderators [U, E4] https://community.king.com/en/candy-crush-saga/discussion/513381/how-does-the-game-determine-level-difficulty
- Fan wiki ratings show hard levels cluster unevenly inside 15-level episodes (one episode lists 1 hard,
  3 extremely hard and 4 nearly impossible) [V, E3] https://candycrush.fandom.com/wiki/Difficulty (search extract)

### Inferences
- [I] MPQ is the anti-pattern of a stat DDA tied to visible power. Players could see their roster grow and the
  enemies grow with it. MatchRPG's tier clock is pacing-side (pace-based DDA on the scroll clock) and tied to
  moves per second, which players cannot see. Keep it that way; never key the clock to hero level or gear.
- [I] King's "harder means shorter" rule maps to MatchRPG elites and bosses. A world-36 boss that takes long
  under heavy scroll stacks length and difficulty. Agent 0b can test time-in-boss against abandon rate.
- [I] Energy gates are a monetisation tool, not a curve tool. MatchRPG has no energy gate [K]; the twins give no
  reason to add one.

### Gaps
- Gems of War, Legend of Solgard, Puzzle Combat and Hero Wars were not researched in this pass.
- No public E&P data on how long the 3-star to 4-star ascension wall lasts.

---

## Q4. Power curve and density: how do the power fantasy games keep the player ahead?

### Takeaway
Vampire Survivors and Brotato let player power outrun enemy density for most of a run, then end the run with a
fixed wall (Reaper, wave 20 boss). They also let the player raise density on purpose (Curse) for more XP. That is
player-steered difficulty that pays. MatchRPG's mow beats would come from the same trade.

### Cited findings
- Vampire Survivors Curse raises enemy HP, speed, spawn quantity and spawn frequency by its percentage, with no
  cap. Spawn interval divides by total Curse. Sources: PowerUp 5 ranks of +10%, Skull O'Maniac +10% per level to
  +50%, Gold Ring and Metaglio Right +5% per level, Torrona's Box +100% at max [V, E3]
  https://vampire.survivors.wiki/w/Curse , https://www.siliconera.com/what-does-curse-do-in-vampire-survivors/
- More enemies give more XP, which speeds weapon evolutions. Charm raises count without raising stats [V, E3]
  https://www.siliconera.com/what-does-curse-do-in-vampire-survivors/
- Stage cycles (after a stage loops) add +100% base HP, +50% spawn frequency and quantity, +25% damage per cycle
  [V, E3, search extract of the fandom Stages page] https://vampire-survivors.fandom.com/wiki/Stages
- PC Gamer describes the late-run "DPS singularity" where the screen clears as fast as it fills [V, E4]
  https://www.pcgamer.com/great-moments-in-pc-gaming-reaching-the-dps-singularity-in-vampire-survivors

### Inferences
- [I] The Curse trade is "more pressure, faster power". MatchRPG's version would be a visible risk toggle per
  run (say +15% scroll for +20% gold), which is a Hearthguard B3 player-steered pressure card in a solo frame.
- [I] Both games end the run at a fixed moment rather than letting it die slowly. MatchRPG story ends at 6666 m
  [K]. Endless has no end wall; it relies on ENDLESS_POWER. Brotato's endless formula is quadratic in waves
  past 20; an endless MatchRPG lap with a quadratic term would end runs nearer a target length.

---

## Q5. Short retries and chasers

### Takeaway
Super Hexagon and the endless runners prove that runs of seconds to minutes need near-zero time to retry. The
runners also use a chaser behind the player, the same role as MatchRPG's dark. Their chaser closes in after a
mistake and backs off when the player runs clean.

### Cited findings
- Super Hexagon came from Hexagon, made in a 12-hour jam in early 2012. Its modes are Hexagon, Hexagoner and
  Hexagonest ("hard, harder and hardest"). Surviving 60 s on Hexagonest unlocks Hyperhexagonest. Cavanagh:
  "the first two modes are just practice" [V, E2]
  https://gamedeveloper.com/design/terry-cavanagh-and-the-heart-of-i-super-hexagon-i- ,
  https://en.wikipedia.org/wiki/Super_Hexagon
- Cavanagh said the game "doesn't hate you" [V, E2] https://mcvuk.com/?p=92095
- Crossy Road's eagle takes the player who idles or steps back too far; Temple Run's monkeys close in after a
  stumble [U, E3, from memory of community wikis; not re-verified this session]

### Inferences
- [I] Super Hexagon makes the first two named modes practice for the third, with one clean 60 s goal per mode.
  MatchRPG's worlds could carry an equivalent visible goal ("survive the elite"), so a failed run reports a
  step reached, not only a depth.
- [I] The runner chaser and MatchRPG's EDGE_MERCY 0.45 [K] are the same rubber band. Temple Run shows the monkeys
  on screen. MatchRPG shows the dark only in the dungeon strip while the player watches the board [K]. The
  warning must reach the board, as the design pillars already say.

### Gaps
- No verified time-to-retry numbers for Super Hexagon, Downwell or the runners. Measure from video.

---

## Natural experiments found

| Game | Change | Date / version | Before -> after | Reaction |
|---|---|---|---|---|
| Balatro | Ante targets cut on white, green, purple; late green and purple raised | 1.0.1f, May 2024 (1.0.1c beta first) | White ante 3 2,800 -> 2,000, ante 4 6,000 -> 5,000; green ante 8 90,000 -> 100,000; purple ante 8 180,000 -> 200,000 | Press called it a fix for a "huge difficulty spike" [V, E3] https://press-start.com.au/news/2024/04/08/the-latest-balatro-update-has-some-massive-changes-that-should-make-winning-easier/ |
| Candy Crush | Level 65 eased after A/B test | early post-launch | Hard version converted more short-term; easy version retained and earned more later | King GDC 2024 [V, E2, vendor] |
| Candy Crush | 100 least fun levels rebuilt | before 2024 | "very significant uplift in engagement", no number given | King GDC 2024 [V, E2, vendor] |
| Marvel Puzzle Quest | Community scaling tested, then turned off | 2016 | No numbers published; player analysis over 471 battles | Mixed; players split [V, E3] |
| Puzzle & Dragons | Stamina refresh shortened | v7.2, Sept 2014 | Shorter regen | Not measured [V, E3] |
| Peglin | First cruciball levels added | v0.7.20, 2022 | 0 -> a few levels, later 20 | Devlog only [V, E2] |

Lesson [I]. The Balatro patch moved the mid-story spike (antes 3-4) down and the end (ante 8) up on harder
stakes. It flattened the middle and kept the peak. MatchRPG's world funnel (410, 215, 127, 58, 49 runs by world
reached [K]) shows the biggest relative drop between worlds 2 and 3. The Balatro move is to ease that step and
leave the final boss alone.

---

## Pattern cards

### M1. Posted target table
- Lineage: arcade score targets -> Luck be a Landlord rent (2021) -> Balatro ante chips (2024). Refined by putting
  the next target on screen before the player commits, so failure reads as "my build was short".
- Feeling: Challenge with clear stakes; failure as information.
- Mechanism: a table of N targets, each 1.5-2.5x the last, shown before each set. Landlord pairs it with a
  deadline that grows by 1 spin every second step.
- Works when the player's growth is also visible as a number. Breaks when the target hides behind randomness
  the player cannot read.
- Evidence: [V, E3] balatrowiki, Landlord wiki; Balatro patch as natural experiment.
- Cost: S. Knobs: base, ratio, deadline step.
- MatchRPG: show "Elite in 4 encounters" and the elite's power on the board, plus a depth target per world.

### M2. Numbered opt-in ladder with one knob per step
- Lineage: Slay the Spire ascension (2017 early access) -> Peglin cruciball (2022) -> Balatro stakes (2024),
  Brotato Danger (2022). Refined from 20 steps down to 6-8 in shorter games. See Hearthguard E2.
- Feeling: Challenge, Expression through the step chosen.
- Mechanism: step k unlocks on clearing step k-1. Each step adds one change. Mix about 40% stat bumps, 40% cuts to
  healing or economy, 20% new behaviour. Keep total stat inflation near +40%.
- Works after a first clear. Breaks when a step is pure HP padding that only lengthens runs.
- Evidence: [V, E3] wikis above.
- Cost: S-M. Knobs: step order, per-step size.
- MatchRPG: a 10-step "Sign" ladder unlocked by beating Astaroth, used instead of or beside endless. Candidate
  steps: +elite cadence, -1 belt slot, kit heal 50%, +10% ELITE_HIT, edge mercy 0.45 -> 0.30, boss behaviour.

### M3. Endless switch to a super-linear term
- Lineage: Tetris level 29 kill screen -> Brotato endless (quadratic factor) -> Balatro endless (formula past
  ante 8) -> Vampire Survivors Reaper at 30:00.
- Feeling: Challenge with a known horizon; a run that ends instead of fading.
- Mechanism: past the story end, factor = w(w+1)/200 × 2; HP × (1 + 2.25 factor), damage × (1 + factor),
  speed capped. Or a fixed kill wall at a time.
- Works when the leaderboard measures distance past the switch. Breaks if the switch lands before the player's
  build can show off (no mow).
- Evidence: [V, E3] Brotato and Balatro wikis.
- Cost: S. Knobs: coefficient, cap.
- MatchRPG: add a quadratic term to ENDLESS_POWER after lap 2 and check endless median moves toward a target.

### M4. Paid pressure (Curse)
- Lineage: risk-reward modifiers in arcade games -> Vampire Survivors Curse (2022), Hades Heat for rewards.
- Feeling: Expression, Sensation (more on screen, faster power).
- Mechanism: a player-set percentage raises enemy stats and count by the same percentage and pays more XP or gold.
- Works when the reward compounds within the run. Breaks if the reward is only score.
- Evidence: [V, E3] vampire.survivors.wiki.
- Cost: S. Knobs: rate, reward.
- MatchRPG: a pre-run "Torch" toggle (+15% scroll, +20% gold). Tier clock unchanged.

### M5. Don't scale enemies to visible power
- Lineage: Oblivion level scaling (2006, see researcher 1 if covered) -> Marvel Puzzle Quest personal and
  community scaling (2014-2016) -> MPQ rollbacks.
- Feeling when broken: the opposite of Competence; growth feels taxed.
- Mechanism: if adapting, adapt on hidden pace or supply, not on gear or level the player can see.
- Evidence: [V, E3] d3go forums.
- Cost: S (a rule). Knob: none.
- MatchRPG: the tier clock already follows moves per second. Keep hero level and gear out of the clock formula.

### M6. Harder means shorter
- Lineage: arcade boss fights -> King's Candy Crush level data (GDC 2024).
- Feeling: Challenge without fatigue.
- Mechanism: cap the expected length of a hard beat. King rates by time to abandon and time to pass.
- Evidence: [V, E2, vendor] mobilegamer.biz.
- Cost: S. Knob: boss HP vs boss damage.
- MatchRPG: measure seconds in elite and boss encounters vs death there. If long and lethal, trade HP for damage.

### M7. Named practice modes with one clean goal
- Lineage: arcade difficulty select -> Super Hexagon (2012) "hard, harder, hardest", 60 s each.
- Feeling: Challenge, Fiero at each 60 s.
- Mechanism: each mode has one survival target that unlocks the next.
- Cost: S. MatchRPG: a per-world goal shown on death ("World 2 elite: beaten 3 of 7 tries").

---

## Fun hypotheses
- Players who beat Astaroth should feel Challenge rise again at their first ladder step, within the first
  3-minute run after the win, because of M2.
- Players at minute 2 of a story run should feel a deadline, not surprise, because the next elite is posted (M1).
- Endless players should feel a run end near 9-12 minutes, not trail off, because of M3.

## Anti-patterns seen
- MPQ: enemy level tied to the player's own roster. Growth felt punished.
- Candy Crush level 65: a spike that made money short-term and lost players.
- Balatro pre-1.0.1f: mid-story spike at antes 3-4, fixed by flattening the middle.
- Stat-only ladder steps that make runs longer without new decisions (the twins cap stat steps near +40%).

## Glossary additions
- Posted target: a pressure number shown to the player before the set that it ends (Balatro blind, Landlord rent).
- Kill wall: a fixed point that ends any run (Vampire Survivors Reaper at 30:00). Different from a spike because
  it is not meant to be passed.
- Personal scaling: enemy strength set from the player's visible power. A stat DDA keyed to progression. Avoid.

## Gaps (overall)
- Fandom wikis were blocked (HTTP 402). Vampire Survivors per-minute tables, Candy Crush episode analysis and
  Luck be a Landlord's 12th rent remain partly unverified.
- Not covered: Gems of War, Legend of Solgard, Puzzle Combat, Hero Wars, Backpack Hero, Dicey Dungeons, Rogue
  Legacy, Downwell, Tetris Effect and Tetris 99, Jetpack Joyride speed tables, Crossy Road eagle timer.
- No ladder win-rate funnels (Steam achievement percentages would supply them).

## See it in action
- Balatro: https://balatrowiki.org/w/Blinds_and_Antes
- Luck be a Landlord: https://luck-be-a-landlord.fandom.com/wiki/Rent
- Peglin: https://peglin.wiki.gg/wiki/Cruciball
- Slay the Spire: https://www.hermitgamer.com/slay-the-spire-ascension/
- Brotato: https://brotato.wiki.spellsandguns.com/Endless_Mode
- Vampire Survivors: https://www.pcgamer.com/great-moments-in-pc-gaming-reaching-the-dps-singularity-in-vampire-survivors
- Dead Cells: https://deadcells.wiki.gg/wiki/BSC
- Hades: https://rpgsite.net/feature/10287-hades-pact-of-punishment-heat-modifiers-and-how-to-maximize-your-rewards
- Super Hexagon: https://gamedeveloper.com/design/terry-cavanagh-and-the-heart-of-i-super-hexagon-i-
- Candy Crush: https://mobilegamer.biz/how-king-defines-a-good-candy-crush-saga-level-and-why-it-constantly-prunes-the-bad-ones/
- Marvel Puzzle Quest: https://forums.d3go.com/discussion/41413/pve-scaling-testing-enemy-of-the-state-03-17-16
- Puzzle & Dragons: https://www.deconstructoroffun.com/blog//2013/02/how-puzzle-dragons-does-it.html

## Sources
- https://balatrowiki.org/w/Blinds_and_Antes
- https://balatrowiki.org/w/Stakes
- https://press-start.com.au/news/2024/04/08/the-latest-balatro-update-has-some-massive-changes-that-should-make-winning-easier/
- https://peglin.wiki.gg/wiki/Cruciball
- https://gedig.itch.io/peglin/devlog/383097/the-first-cruciball-levels-are-here-v0720
- https://luck-be-a-landlord.fandom.com/wiki/Rent (via search extract)
- https://luck-be-a-landlord.fandom.com/wiki/Floors (via search extract)
- https://www.hermitgamer.com/slay-the-spire-ascension/
- https://brotato.wiki.spellsandguns.com/Dangers
- https://brotato.wiki.spellsandguns.com/Endless_Mode
- https://brotato.wiki.spellsandguns.com/Waves
- https://vampire.survivors.wiki/w/Curse
- https://www.siliconera.com/what-does-curse-do-in-vampire-survivors/
- https://vampire-survivors.fandom.com/wiki/Stages (via search extract)
- https://steamcommunity.com/app/1794680/discussions/0/3473981814925100952
- https://www.gameskinny.com/tips/vampire-survivors-how-to-beat-red-death/
- https://www.pcgamer.com/great-moments-in-pc-gaming-reaching-the-dps-singularity-in-vampire-survivors
- https://deadcells.wiki.gg/wiki/BSC
- https://www.gamesradar.com/uk/dead-cells-is-getting-an-easy-mode-and-im-redownloading-it-after-rage-quitting-years-ago
- https://rpgsite.net/feature/10287-hades-pact-of-punishment-heat-modifiers-and-how-to-maximize-your-rewards
- https://gamedeveloper.com/design/terry-cavanagh-and-the-heart-of-i-super-hexagon-i-
- https://en.wikipedia.org/wiki/Super_Hexagon
- https://mcvuk.com/?p=92095
- https://itch.io/post/1997398
- https://mobilegamer.biz/how-king-defines-a-good-candy-crush-saga-level-and-why-it-constantly-prunes-the-bad-ones/
- https://community.king.com/en/candy-crush-saga/discussion/513381/how-does-the-game-determine-level-difficulty
- https://candycrush.fandom.com/wiki/Difficulty (via search extract)
- https://www.instructables.com/Puzzle-and-Dragons-beginners-guide
- https://www.deconstructoroffun.com/blog//2013/02/how-puzzle-dragons-does-it.html
- https://www.gamenguide.com/articles/13239/20140917/puzzle-and-dragons-update-details-7-2-version-adds-coin-dungeons-decreases-stamina-refresh-time.htm
- https://forums.d3go.com/discussion/41413/pve-scaling-testing-enemy-of-the-state-03-17-16
- https://forums.d3go.com/discussion/comment/529739
- https://forums.d3go.com/discussion/comment/399402
- https://empuzzled.com/farming-guide
- https://www.bluestacks.com/blog/game-guides/empires-puzzles-rpg-quest/eap-farming-guide-en.html
