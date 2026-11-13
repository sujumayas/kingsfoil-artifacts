# 06. Map and level design for time attack

Researcher 06. Scope: how levels for restart-heavy time-attack platformers are sized, routed, taught and tuned, and
what that says about SpeedRunner's 4 hand-placed maps (16 to 20 s of pure running at 420 u/s, one route each,
4 split checkpoints, no respawn checkpoints, full-map restart costing about 3.4 s). Every SpeedRunner number below
is from `01-current-build.md` ([K]). Fan-wiki figures are flagged (fandom). Vendor or developer self-reports are
flagged (vendor). About 30 tool calls were spent; gaps are listed rather than guessed.

Shorthand: BL = body length = 46 u. View = 970x545 u. Top speed 420 u/s = 9.1 BL/s.

---

## Q1. Level length and rhythm for time attack

### Takeaway
The genre converged on a "short unit" of 15 to 60 s of clean play, chained into sets of 3 to 5. Trackmania's
Weekly Shorts cap the author time at 20 s. Neon White levels "usually take under a minute, often under 30
seconds". N++ builds episodes of 5 single-screen levels that take about 5 minutes with retries under a shared
90 s clock. Mario Maker's speedrun culture settled on 20 s, the shortest timer the editor allows. SpeedRunner's
16 to 20 s of pure running is in the right band; what is missing is a graded target time per map (medals) and a
set structure (episodes or a campaign total) so a 20 s map has a reason to be replayed.

### Cited findings
- Trackmania Weekly Shorts (official mapping guidelines): "Track length should not be longer than an Author
  Medal of 20 seconds"; an earlier version allowed about 35 s. Five fixed styles per week (Wide, Slow, Puzzle,
  Fast, LOL). Review labels that reduce selection odds include "Hard AT", "Too Long", "Confusing Path",
  "Speedcheck" (sections too hard for low-skill players), "Too Intense". [S6]
- Trackmania default medal formula (Openplanet "Default Medals" plugin, which reproduces Nadeo's calculation):
  gold = 1.06 x author time, silver = 1.2 x, bronze = 1.5 x, rounded up to the next thousandth or whole second.
  Example TOTD: author 36.458 s, gold 39.000, silver 44.000, bronze 55.000. Mappers may edit medals (the plugin
  exists to flag edited ones). [S4][S5] Vendor-adjacent: plugin author's description, not a Nadeo doc.
- Trackmania Cup of the Day (vjeux's data pull): 15 min qualifying, players grouped in 64s, "most tracks are
  finished by around 8k players". On one map a 1:03.012 run sat at position 2310, so about 2309 of ~8000
  finishers (roughly 29%) had gold or author. [S7]
- Neon White medal rules (Vice, developer interview): Silver = intended path, no optimizations, some mistakes;
  Gold = intended path, no optimizations, no mistakes; Ace = designed shortcut, no optimizations, no mistakes.
  The devs were too fast to be the baseline, so Russell Honor modified the ghost recorder to replay their runs
  with injected hesitation and cancelled simultaneous inputs; the resulting times were "surprisingly close to
  real-world player times". Shortcut hints unlock after Gold. A hidden red medal beats Ben Esposito's own best
  on every level. Levels "usually take under a minute, often under 30 seconds". [S8] Esposito: "We struggled to
  generate 'fair' medal times throughout development." [S10]
- N++ (Metanet on the PlayStation Blog, 2015): episodes are groups of 5 levels and "~5 minute challenges"; an
  easy episode is 3 easy + 1 easy-medium + 1 medium; levels are rated on an 8-step difficulty scale; episodes
  sit in a 5 x 20 grid with difficulty rising diagonally; 20 episodes (about 20%) are open at any time; about
  2000 levels built, cut to about 1000; a level takes "five minutes to an hour" to make; race mode "assumes a
  few lives will be spent retrying". [S2] Episode clock: 90 s shared across the 5 levels, +2 s per gold, leftover
  time carries to the next level (fandom). [S3]
- Super Mario Maker 2 (arXiv paper, 26.6 M levels, Feb 2022 snapshot): the editor's shortest timer is 20 s and
  "20-second gauntlets" became a trend; the "Celestial Sprint Speedrun" was at one point the most-played level
  in the game. Median timer on uploaded levels is 300 s (editor default). Longer world-record times correlate
  with lower clear rates. [S11][S12][S13]
- Super Meat Boy: an A+ is awarded for finishing a level "within a certain time", and A+ unlocks the dark-world
  twin of that level. [S1] No developer statement on how par times were set was found.
- Celeste chapter 1 (Forsaken City) individual-level record: 1:01.897 (Hornlitz, 30 May 2018), about 55 s by
  2019 (fandom, stale). [S17] Full-game any% record 25:55.262 (7 Jan 2023, Guinness citing speedrun.com). [S18]
- Dustforce: two grades per level, Finesse (combo meter, reset on a hit or slowing down) and Completion (all dust
  and enemies). S/S needs both perfect; an S/S gives a key that unlocks more of the overworld. [S26]

### Inferences
- SpeedRunner's 4 maps are 16.3 s (m1, 6830 u), 20.7 s (m2, 8700 u), about 11 s plus 1350 u of climbing (m3) and
  15.6 s plus 1250 u of climbing (m4) at 420 u/s with no jumps. A clean human run is probably 1.3 to 1.6 x that
  (jumps, wall climbs, chimneys), so author times of roughly 22 to 35 s per map. That is exactly the Weekly Shorts
  and Neon White band, so the length is right.
- A per-map medal set from the Trackmania ratio on a 25 s author time: gold 26.5 s, silver 30 s, bronze 37.5 s.
  Alternatively the Neon White rule set maps directly onto SpeedRunner's splits: Silver = finished with deaths-free
  but sloppy run on the main route, Gold = clean main route, Ace = clean run using the map's one designed skip.
- The "author time" should be a recorded developer run through the intended route, not the WR. Neon White's
  trick (replay the dev ghost with injected hesitation) is cheap here: SpeedRunner already records ghosts at 30 Hz.
- A total-campaign time across the 4 maps (sum of PBs) gives the "episode" feel N++ uses without new content.

### Gaps
- No primary source on how Super Meat Boy par times were chosen. No official Nadeo page for the 1.06/1.2/1.5 ratio.
- Celeste per-chapter room counts and first-clear times were not found in open sources this session (fandom
  returned data only for chapter records; the GDC talk page lists "300+ stages" for the whole game). [S16]
- Trials medal time rules: not covered (search budget).

---

## Q2. Routing and shortcuts

### Takeaway
The designers who get this right build one obvious safe route and then add at least one deliberate skip that
saves "significant time, even if not executed perfectly" (Neon White). Unintended skips are either welcomed
(Trackmania cut culture, Celeste community tech) or removed only when they bypass the challenge entirely. The
key design knob is the gap between safe-route time and skip-route time relative to the cost of failure, which in
SpeedRunner is the whole run plus 3.4 s.

### Cited findings
- Neon White: encounters are blocked out in isolation, then assembled into the layout, and "the assembly often
  creates shortcut opportunities" that become the designed skip. Late in development the team added shortcuts
  so every level had at least one that saved significant time. Shortcut hints are shown only after Gold. [S8][S9]
- Trackmania: official guidelines put "intended alternate strategies and routes" into a specific weekly style
  (Puzzle, track 3) and require pathfinding maps to "still include a straight forward path to reach the finish".
  [S6] Mapper culture: one mapper made "the lazy route narrower" so players would take the skip; another withheld
  the author replay so players find the route themselves; a Mania Exchange contest judges that "cuts should be
  difficult to spot". [S20][S21] Unintended cuts live for years: a cut on TMNF's D06 Obstacle was found 13 years
  after release. [S22] A community theory post frames the author's "driving line" as the mapper's hypothesis that
  players are invited to refute. [S19]
- Mirror's Edge: the speedrun wiki describes an "advanced route" built from the hardest shortcuts and glitches
  and advises learning the level before routing; a Catalyst time-trial guide warns the in-game guide path
  "usually takes you along a far slower route". [S23][S24]
- Super Meat Boy's dark world is the structural twin of Celeste's B-sides: the same layout family, harder,
  unlocked by a time grade (A+). [S1]

### Inferences
- Risk-reward arithmetic for a full-restart game. A skip that saves s seconds and fails with probability p costs,
  on failure, the time already spent t plus the 3.4 s restart. Over many attempts the skip pays off when
  s x (1 - p) > p x (t + 3.4). A skip near the finish (t about 25 s) at p = 0.3 needs to save about 12 s to break
  even per attempt; the same skip at the start (t about 2 s) needs only about 2.3 s. So place designed skips
  early in the map where they are cheap to attempt, and put the one late skip in m4 only if it is near-certain for
  a practiced player.
- A healthy ratio from the Neon White rules: safe clean run = Gold, skip clean run = Ace. If the skip saves less
  than the Trackmania gold band (6% of author time, about 1.5 s on a 25 s map) nobody bothers; if it saves more
  than 20% the safe route dies. Aim for 8 to 15% (2 to 4 s on 25 s).
- SpeedRunner already has the tools for a designed skip without new code: one-way roof tiles (m4 maze), the roll
  that keeps 280 u/s after a 230 u fall, and the wall-climb variant. A "ceiling route" over a cave (m2) that
  needs 2 clean wall jumps is the cheapest skip to author.
- Prevent only skips that bypass the map's test. `deathY` is already a kill plane; the camera clamp to `top` is a
  soft ceiling. Because movers are driven by run time, a skip's timing is deterministic, which makes routing
  learnable the Trackmania way.

### Gaps
- No published number for "safe to fast ratio" in any of these games; the 8 to 15% band is an inference from
  the medal ratios.
- No statement from Celeste's developers on community tech acceptance was fetched this session.

---

## Q3. Teaching structure

### Takeaway
Every strong platformer campaign introduces one idea per screen, lets it be used safely, then combines it, then
twists it. Hayashida's four-step kishotenketsu (introduction, development, twist, resolution) is the Nintendo
version; N++ "showcases one element or move" per level and combines later; Celeste's talk frames each room as a
"small, self-contained story"; SMB 1-1 opens with a slow Goomba so the jump is taught by a cheap failure.
SpeedRunner's m1 already runs an SMB 1-1 style introduction list (rock, steps, gap, chimney, drop, narrow
platforms, ledge). What it lacks is the "development and twist" halves: no map re-tests a skill in combination
under speed, and m3 and m4 jump to Hard without a Medium that combines m1 and m2 skills.

### Cited findings
- Hayashida (Super Mario 3D Land/World director) describes level design as kishotenketsu drawn from four-panel
  manga: introduction, development, twist, resolution. [S14][S15] GMTK's video on 3D World popularised the
  "four steps" reading. [S15]
- SMB World 1-1: the first Goomba "approaches slowly" and can be jumped, but is "likely to defeat a new player";
  the level teaches by making the player interact with each object while advancing; uniform brick patterns keep
  attention on where to jump. [S27][S28]
- N++: single-player levels "often showcase one element or move", later levels combine; the 5 x 20 grid ramps
  diagonally; some levels stay locked "so players aren't frustrated too early"; the design goal is "fair and
  predictable" so failure feels like the player's own fault. [S2]
- Celeste: GDC 2017 "Level Design Workshop: Designing Celeste" covers "300+ hardcore platformer stages"; the
  talk's framing is rooms as stories rather than single-solution puzzles; the game's opening teaches the dash on
  the next screen after the climb is shown. [S16][S29] The Chapter 9 design post (Extremely OK Games) is the
  team's own write-up of how a late chapter was structured. [S30]
- Super Meat Boy: light world then dark world twin of each level, unlocked by A+. [S1]
- Super Mario Maker 2 story mode: each Nintendo course "is typically based around a specific mechanic";
  producer Tezuka published 5 course-creation tips (text not retrieved). [S31][S32]

### Inferences (SpeedRunner mapped onto teach-test-twist)
- m1 FIRST STEPS is a pure "teach" list: 7 setpieces in 6830 u, each introduced once (rock big enough to need a
  real jump = jump height; steps = short hops; momentum gap = run speed matters; chimney = wall jump; high drop =
  roll; 3 narrow platforms = air control; ledge = coyote). That is the SMB 1-1 pattern and it is good.
- m2 ROCKY MOUNTAIN labels its first setpiece "SKILL 1 rising steps" in the source and then stacks a pillar run,
  a low-ceiling cave ("small hops only" = jump cut), a 600 u wall climb (13 BL, about 3 wall jumps at 790 u/s)
  and a double roll chain. It is the "development" step, but it also introduces 2 new atoms (jump cut, chained
  wall climb) without a safe first use. Suggest a free-standing low ceiling before the cave.
- m3 THE DUNGEON is generated (halls + 4 climbs with ceiling spikes). It is a "twist" (wall jumps under a spike
  ceiling) without a "development" of the wall-jump-with-ceiling idea. m4 is a twist on one-way tiles and
  movers, mechanics m1 and m2 never taught. Missing: a Medium map that uses movers and roof tiles safely, and a
  "resolution" map (SAMURAI TRIAL) that chains everything at speed with no new atoms.
- Checkpoints as splits already sit at the top of each m3 climb, so the split screen is a natural per-section
  teaching readout; the results screen could name the skill each section tests.

### Gaps
- Hayashida's original 2012 Gamasutra interview text was not fetched; the four-step wording is from secondary
  coverage. Tezuka's 5 tips text was not retrieved.

---

## Q4. Procedural and endless layouts

### Takeaway
Endless runners generate from a library of pre-authored chunks sequenced by distance (the approach the Mawhorter
and Mateas paper calls chunk-based generation, and the approach a Game Developer article on Sure Footing
describes for runners), while Spelunky's Daily Challenge uses one seed per day, one attempt, and a score board
instead of a time board. A seeded daily map is a good SpeedRunner mode if the generator is chunk-based with
hand-authored chunks, the seed is fixed for 24 h, attempts are unlimited, and the board is per-day.

### Cited findings
- Chunk-based generation: "assembling a level using chunks from a library is a common approach" (Mawhorter and
  Mateas, 2010, which proposes occupancy-regulated extension as an alternative). [S33] Sure Footing's developer
  describes a runner generator built from pre-authored segments and credits Jetpack Joyride with popularising
  the form in the west. [S34]
- Jetpack Joyride: Luke Muscat's GDC 2012 talk "Depth in Simplicity" is listed as a design postmortem; one-button
  control was chosen for inexperienced players; a design breakdown praises its "tension rise & release ramp" for
  short mobile sessions. Specific chunk and zapper rules were not in the retrievable text. [S35][S36][S37]
- Canabalt: levels are procedurally generated at runtime so each run has a different arrangement of ledges,
  gaps and obstacles (Wikipedia). [S38] Gap and speed formulas not found.
- Spelunky HD Daily Challenge: one generated level shared by everyone that day, one attempt, scored by money and
  depth, no times or replays recorded, seeds differ between Steam and PSN; it formalised a daily ritual two
  players (Doug and Nifflas) had invented. [S39][S40][S41]
- N++ makes a point of never generating: it is single-screen so "players never make leaps where they can't see
  what's below". [S2]
- Trackmania Track of the Day: a hand-made community map selected daily, with Cup of the Day run on it (about
  8k finishers per map). [S7] (The query about randomly generated "Royal" maps was not confirmed; treated as a gap.)

### Inferences
- SpeedRunner's determinism (movers and wheels driven by run time, fixed 1/120 step) means a seeded map replays
  identically on every device, which is the hard part of a fair daily board already solved.
- Recommended shape: 8 to 12 hand-authored chunks per skill atom (each 600 to 1200 u wide, entry and exit at
  ground y 600 or at a documented ledge height), a seeded sequence of 6 to 8 chunks with difficulty rising by
  index (N++'s diagonal), total 5000 to 8000 u (12 to 19 s running). Reuse the 4 split checkpoints at chunk
  boundaries 2, 4, 6. Keep the Spelunky rule "same for everyone today" but drop "one attempt": a time-attack
  needs retries, and the board can show attempts as a second column.
- Doodle Jump style height-driven gap growth is the wrong model here (vertical, infinite); the Jetpack chunk
  model is right (horizontal, finite, authored).

### Gaps
- No primary Halfbrick numbers on chunk lengths or spawn rules; no Doodle Jump spawn formula found in open sources.
- Canabalt gap and speed curve not found. Trackmania "Royal" generation not verified.

---

## Q5. Camera and framing as level design

### Takeaway
A runner needs at least reaction time x speed of visible track ahead, and designers add a planning margin on top.
At 420 u/s a 250 ms reaction is 105 u (2.3 BL); SpeedRunner shows 621 u ahead (about 1.48 s of running), which is
generous. The weak axis is vertical: terminal fall is 1150 u/s, so a blind drop covers the whole 545 u screen in
0.47 s, and 250 ms of reaction is 288 u, more than half the view. Celeste and N++ avoid this with single-screen
rooms; Mario-style scrollers mark drops with coin trails and arrows.

### Cited findings
- 2D camera practice (GMTK "How to make a good 2D camera"; Game Developer "Camera logic in a 2D platformer"):
  centre on the player plus an offset in the movement direction, smoothed; show the direction of travel because
  "the player wants to plan ahead"; a window camera cannot keep up when the character moves as fast as the
  camera's max speed. [S42][S43][S44]
- N++ is single-screen so no leap is blind. [S2] Trackmania Weekly Shorts require "jumps must be clear, with the
  landing visible" and the track to be readable without reading signs. [S6]
- Itay Keren's "Scroll Back" (Game Developer, 2015) is the standard taxonomy (lerp smoothing, camera window,
  platform snapping, forward focus, cue focus). Not fetched this session; listed for the report writer. [S45]

### Inferences from the SpeedRunner constants
- Horizontal: player at 0.36 of view width, 120 u fixed look-ahead; 970 x 0.64 = 621 u visible ahead = 13.5 BL
  = 1.48 s at top speed. Reaction need at 250 ms = 105 u. Margin is about 6x, so horizontal blind spots are not a
  camera problem; they come from level geometry (a hazard hidden behind a wall or under a one-way tile).
- Vertical: dead zone 60 u on climb, lerp 5/s (9/s on walls). A 230 u roll-drop takes 0.33 s under fall gravity
  (4125 u/s^2 from rest, ignoring the apex band); a 600 u drop reaches about 1150 u/s and is off-screen in under
  0.6 s. Rule for the maps: any drop over one screen height minus the player's screen position (about 400 u from
  a mid-screen stance) is blind unless the camera leads downward or the landing is pre-shown.
- Cheap fixes used by the genre: a "look down" camera when standing still at a ledge (Celeste), a downward
  look-ahead proportional to vy when falling (shift the vertical reference by vy x 0.25 s, capped at 200 u), and
  landing markers (cut-grass tufts or a dark ink smear) at the landing spot so the drop reads before it is taken.
- m3's "needle-capped climbs" exit through doorways and 2 drops each; those drops into halls with 9 spike strips
  are the highest blind-drop risk in the current content.

### Gaps
- No published Sonic camera constants were found; no measured Celeste camera values fetched (the player
  constants are known to other researchers; camera rules are not in Player.cs).

---

## Q6. Level grammar from makers

### Takeaway
Mario Maker's most-played levels are short, single-idea, and "don't stop" (hold right, jump on cue); 20 s became
the speedrun unit. Nintendo's own guidance is one mechanic per course. Ultimate Chicken Horse grows a level one
piece per round with a scoring preset (default 5 points to win over 12 rounds) that rewards both finishing and
killing. The grammar that feels fair and fast: one idea per screen, a forced input that the level itself cues,
a finish that is visible early, and death that teaches the next input.

### Cited findings
- SMM2 at scale (arXiv): 26.6 M levels; clear rate median 25% (p25 10%, p75 50%); tags Easy 33%, Normal 44%,
  Expert 16%, Super Expert 8%; relative to Easy, clear rate is 54% lower for Normal, 84% lower for Expert, 98%
  lower for Super Expert; "unusual to find a super expert level with a clear rate much higher than 2%"; median
  plays 54, median clears 10, median players 21; "levels that generate a lot of plays tend to be harder"; a
  title topic of speed/speedrun/run/seconds appears in 1.90% of Easy and 4.45% of Super Expert levels. [S11]
- 20-second gauntlets built on the on/off switch are a trend; "Celestial Sprint Speedrun" was the most-played
  level for a time. [S12][S13] Speedrun levels "still have to be fun to play"; the community norm is "running
  and jumping with precision" rather than slowdowns. [S46]
- Team 0% clears every uncleared level (Wikipedia). [S47] A no-skip Expert Endless write-up expects levels with
  clear rates "as low as 2%". [S48]
- Ultimate Chicken Horse: default party preset is 5 points, 12 rounds, all blocks; players place one piece per
  round and the level grows; extra point types include solo (only finisher), postmortem and comeback; Race preset
  scores reaching the end before opponents; a reviewer criticises underdog points as too generous. [S49][S50][S51]
- N++: 1000 levels shipped from 2000 built; one element per level then combinations; 5 min to 1 h to author a
  level. [S2]
- Dustforce S/S: combo (speed and no hits) and completion graded separately. [S26]

### Inferences
- A SpeedRunner map authored to Mario Maker speedrun grammar: 20 to 30 s, 4 to 6 "cues" (a jump the geometry
  forces at a specific x, a wall the player must climb, a roll drop), a visible flag on the last screen, and no
  element that asks the player to stop. The current maps already avoid stopping except m2's cave hops.
- Clear-rate target: for a time-attack with full restart, the first-clear funnel should look like Mario Maker's
  Normal to Expert band on first session (10 to 30% of attempts clear) and converge to 60%+ for returning
  players; a daily map below 5% is Super Expert territory and will empty the board.
- Elements with two independent grades (Dustforce) suggest a cheap second axis for SpeedRunner: time plus
  "clean" (no deaths before this clear, or all grass cut).
- UCH's loop is not a direct fit (no editor, async only) but its "one piece per round" is a cheap community mode:
  the weekly map gets one new element voted in each week.

### Gaps
- Nintendo's SMM course design blog text and LittleBigPlanet "Mm Picks" criteria were not retrieved; the
  "don't stop" convention is community usage, not a documented rule.

---

## Q7. Readability rules

### Takeaway
The genre's readability rules are about contrast, consistent scale and placement. Trackmania's official review
labels (Confusing Path, Speedcheck) and N++'s "fair and predictable" test are the same idea: the player should
fail because of their input, never because they could not read the level. SpeedRunner's ink-on-paper look is an
advantage here, provided the single red is reserved for danger and solids are measured in body lengths.

### Cited findings
- Trackmania Weekly Shorts: a first-time player should follow the path without confusion; "Jumps must be
  clear, with the landing visible"; signs are clarification only, scenery must guide; default checkpoints and
  finish, "without hiding them or making them hard to see"; tricks must not be required. [S6]
- N++: "fair and predictable", failure should feel like the player's fault; single-screen so no blind leaps;
  levels are "open and expansive" or "cramped" by design. [S2]
- SMB 1-1: uniform brick pattern keeps attention on where Mario should jump. [S28]
- Neon White Ace medals require the designed shortcut, and hints for it are hidden until Gold, so the readable
  route is the intended one and the skip is deliberately less readable. [S8]

### Inferences for an ink-on-paper SpeedRunner
- Danger colour: spikes are 16 u tall hitboxes inset 4 u. The only red today is the kimono. Keep red for the hero
  and use a second rule for hazards: spikes are the only black shape with a sawtooth top, drawn 1 u wider than
  their hitbox (the 4 u inset already makes the hitbox forgiving).
- Sizing in body lengths: full jump apex 138 u = 3.0 BL; a running jump at 420 u/s with 332 ms to apex covers
  about 280 u horizontally to apex and about 500 u to land at the same height (less with fall gravity x1.65), so
  the practical max gap at full speed is about 9 to 10 BL; a standing jump clears about 1.2 BL of gap. Rule set:
  "safe" gaps at most 6 BL (280 u), "momentum" gaps 7 to 9 BL, never a 10 BL gap. Minimum landing platform
  width 2 BL (92 u, 4.6 player widths) on the main route, 1 BL (46 u) only on designed skips, matching N++'s
  one-tile platforms as the hard tier.
- Hazard placement: never a spike within 250 ms x speed of a blind landing. At 420 u/s that is 105 u; at the
  1150 u/s fall it is 288 u. So no floor spike within 300 u of any drop whose landing is not on screen at the
  moment of leaving the ledge. m3 (9 spike strips, 2 drops per climb) should be checked against this rule.
- White space: a black-on-white map reads as silhouette, so keep a 1 BL (46 u) clear band above every run
  surface on the main route and reserve low ceilings (m2 cave) for places where the jump cut is being taught.
  Trees, bushes and bamboo are decoration and should never overlap a hazard's silhouette.

### Gaps
- No published platform-size tables for Mario in tiles were fetched; the numbers above are derived from
  SpeedRunner's own constants, not from a cited source.

---

## Q8. Metrics designers use to tune a level

### Takeaway
The practical toolkit is death position overlays (Shadow Blade's death-frequency overlay on the level geometry,
Super Meat Boy's replay pile of every attempt, Celeste's per-chapter death counter), completion funnels
(Mario Maker shows clears/attempts on every level), and medal distributions (vjeux counted Trackmania finishers
per medal threshold). The "fun is at 70% completion" claim could not be traced to a primary source. SpeedRunner's
server sees only starts and finishes, so the first metric to add is death position per map per attempt.

### Cited findings
- Shadow Blade postmortem (Game Developer): overlaying "the frequency of player deaths laid out in the level
  geometry" located the hardest spots. [S52]
- Super Meat Boy replay: after a level, every attempt replays simultaneously, "about 100 Meat Boys" in one
  reviewer's run; reviewers call it turning death into reward; one critic notes it exposes an inefficient learning
  process. [S53][S54]
- Celeste community death totals: 15k to 20k deaths for a full game with most strawberries; 563 deaths on
  chapter 8 A-side for one player; 1,914 across two chapters for another (Steam forum, anecdotal). [S55]
- Mario Maker clear rate = clears / attempts, shown on every level; median 25% across 26.6 M levels; Super
  Expert rarely above 2%. [S11] Forum players argue for 80 to 90% on their own levels or for 20%; the term is
  ambiguous between per-attempt and per-player. [S56]
- Trackmania medal funnel: vjeux counted finishers per medal threshold on Cup of the Day maps to see "how hard a
  map was in practice"; about 8k finishers per track. [S7]
- "70%" claims: an escape-room designer argues 70% escape rate is too easy and suggests 10 to 20% for
  non-beginner rooms, 70% for beginner rooms; a Game Developer article reports 70 to 80% of players picking the
  easiest difficulty setting (about difficulty selection, not completion); no primary game-design source for a
  70% completion sweet spot was found. [S57][S58]
- Neon White used injected-error dev ghosts rather than playtest data to set medals; Esposito acknowledged a
  "data-driven way" existed and was not used. [S8]

### Inferences for SpeedRunner
- Add to the `/api/lb` start/submit handshake an `attempt` event with map, death x and y, run time at death,
  and death cause (spike or deathY). About 20 bytes per death; a 5-person playtest night produces a usable
  heatmap. Render it in the dev build as ink smears on the map (the game already has the drawing primitives).
- Funnel per map: starts, reached checkpoint 1 to 4, finished, beat PB. With 4 checkpoints this is a 6-step
  funnel; the step with the biggest drop is the section to retune.
- A Super Meat Boy style "all attempts at once" replay is nearly free: the ghost recorder already captures 18
  numbers at 30 Hz; recording each failed attempt until death (short, a few KB) and replaying them all on the
  results screen is a visible version of the heatmap and a social hook.
- Targets to tune toward, by analogy: first-session clear per attempt in the 10 to 30% band (Mario Maker Normal
  to Expert), author-medal share near Trackmania's observed 29% of finishers with gold or better on a mid
  difficulty map.

### Gaps
- No RedLynx (Trials) telemetry or heatmap source was found. No source for "fun at 70%".
- Celeste's own per-room death data is not published; only the in-game chapter counter and anecdotes.

---

## Candidate technique profiles (for the report)

1. **Author time and medal ladder.** One recorded developer run on the intended route is the author time;
   gold 1.06x, silver 1.2x, bronze 1.5x (Trackmania default); or Neon White's rule set (Silver sloppy intended,
   Gold clean intended, Ace clean skip). Games: Trackmania, Neon White, Super Meat Boy (A+), Dustforce (S/S).
   Key numbers: 20 s author cap (Weekly Shorts), levels under 30 s (Neon White), 29% of finishers at gold or
   better on one COTD map.
2. **Injected-error dev ghost for fair targets.** Replay the dev ghost with added hesitation to simulate a good
   player. Game: Neon White. SpeedRunner already has a 30 Hz ghost.
3. **One designed skip per map, hinted after gold.** Skip saves 8 to 15% of author time, placed early where the
   restart cost is low. Games: Neon White, Trackmania Puzzle style, Mirror's Edge time trials.
4. **Teach, develop, twist, resolve across the map set.** Kishotenketsu (Hayashida), N++ one element per level
   then combinations, SMB 1-1 slow Goomba. Numbers: N++ 5 levels per episode, 8-step difficulty scale, 5 x 20
   grid, 20% open at a time.
5. **Dark-world twin maps.** Same geometry, more hazards, unlocked by a time grade. Games: Super Meat Boy dark
   world, Celeste B-sides. Cheapest new content for SpeedRunner's 4 maps.
6. **Seeded daily chunk map.** 6 to 8 hand-authored chunks (600 to 1200 u) sequenced by a daily seed, unlimited
   attempts, per-day board. Games: Spelunky Daily (one attempt, score), Jetpack Joyride chunks, Trackmania TOTD
   (about 8k finishers). Needs the determinism SpeedRunner already has.
7. **Visible-landing rule and look-down camera.** No drop longer than the on-screen distance without a landing
   marker or a downward look-ahead (vy x 0.25 s, cap 200 u). Games: N++ single screen, Trackmania "landing
   visible", Celeste look-down. Numbers: 621 u (1.48 s) visible ahead horizontally vs 545 u (0.47 s at terminal
   fall) vertically.
8. **Body-length sizing table.** Safe gap at most 6 BL, momentum gap 7 to 9 BL, main-route platform at least
   2 BL, skip platform 1 BL, no spike within 300 u of a blind landing. Derived from PHYS; cite N++ one-tile
   platforms as the hard tier.
9. **Death heatmap and replay pile.** Log death x, y, time, cause per attempt; render as ink smears; replay all
   attempts on the results screen. Games: Shadow Blade overlay, Super Meat Boy replay (about 100 attempts shown),
   Celeste death counter. Mario Maker clear rate median 25% as a reference funnel.
10. **20-second "don't stop" grammar.** 4 to 6 forced cues, visible flag, no stopping element. Games: Mario Maker
    2 speedrun levels (20 s minimum timer, Celestial Sprint), Trackmania Fast style.

---

## Sources

- [S1] Wikipedia, Super Meat Boy (A+ within a set time unlocks the dark world): https://en.wikipedia.org/wiki/Super_Meat_Boy
- [S2] Metanet Software, "The Ins and Outs (and Ups and Downs (and Lefts and Rights)) of Designing N++ Levels", PlayStation Blog, 2015: https://blog.playstation.com/?p=145712
- [S3] N wiki, Episode (90 s timer, +2 s per gold) (fandom): https://n.fandom.com/wiki/Episode ; also https://en.wikipedia.org/wiki/N_(video_game)
- [S4] Openplanet, Default Medals plugin (gold 1.06x, silver 1.2x, bronze 1.5x author time): https://openplanet.dev/plugin/defaultmedals
- [S5] Track of the Day medal posts (author 36.458 / 39.000 / 44.000 / 55.000 example): https://devtrackers.gg/trackmania/p/92351a6c-totd-20-05-2023-seasonal-sprint-by-evo-xlrb-discussion and https://devtrackers.gg/trackmania/p/92c45d30-totd-17-05-2023-desert-spine-by-thechraz-discussion
- [S6] Ubisoft Nadeo, Weekly Shorts guidelines: https://doc.trackmania.com/create/map-review/weekly-shorts-guidelines/
- [S7] vjeux, "Trackmania Medal Distribution", 2021: https://blog.vjeux.com/2021/javascript/trackmania-medal-distribution.html
- [S8] Vice, "Neon White's developers being too good at their own game caused real problems": https://www.vice.com/en/article/neon-whites-developers-being-too-good-at-their-own-game-caused-real-problems/
- [S9] Game Developer, "Neon White and designing for player creativity": https://www.gamedeveloper.com/business/-neon-white-and-designing-for-player-creativity
- [S10] TheGamer, Neon White devs on fair medal times: https://www.thegamer.com/neon-white-devs-fair-medal-times/
- [S11] arXiv 2507.21078, Super Mario Maker 2 level data analysis (26.6 M levels): https://arxiv.org/html/2507.21078v1
- [S12] Vice, "20-second gauntlets of death are the hottest trend in Mario Maker levels": https://www.vice.com/en/article/20-second-gauntlets-of-death-are-the-hottest-trend-in-mario-maker-levels/
- [S13] Kotaku, "Mario Maker 2 lets you feel like a speedrunner" (Celestial Sprint Speedrun): https://kotaku.com/mario-maker-2-lets-you-feel-like-a-speedrunner-1836220745
- [S14] Engadget, "This is why Mario levels are brilliant" (Hayashida, four-panel manga): https://www.engadget.com/2015/03/17/super-mario-3d-world-design/
- [S15] MCV, "Nintendo's level design secrets in four steps" (GMTK on 3D World): https://www.mcvuk.com/development/video-nintendos-level-design-secrets-in-four-steps ; Gigazine summary: https://gigazine.net/gsc_news/en/20160920-super-mario-3d-world-4-step-level-design
- [S16] GDC Vault, "Level Design Workshop: Designing Celeste" (2017): https://gdcvault.com/play/1024307/Level-Design-Workshop-Designing-Celeste
- [S17] Celeste wiki, Chapter 1: Forsaken City (record table, stale) (fandom): https://celestegame.fandom.com/wiki/Chapter_1:_Forsaken_City
- [S18] Guinness World Records, fastest any% completion of Celeste: https://www.guinnessworldrecords.com/world-records/525519-fastest-any-completion-of-celeste
- [S19] TM Theory, "Driving Lines & Player Agency": https://ski-freak.github.io/site/notes/Posts/TM-Theory/TM-Theory---Driving-Lines-&-Player-Agency
- [S20] Trackmania Exchange map pages with mapper notes on intended cuts: https://trackmania.exchange/maps/26622 and https://next.mania.exchange/tracks/view/49199/i-think-i-see-a-shortcut
- [S21] Mania Exchange cut contest listing: https://tm.mania-exchange.com/s/ft/1066
- [S22] Kotaku, "The incredible story of a Trackmania shortcut, 13 years later": https://kotaku.com/the-incredible-story-of-a-trackmania-shortcut-13-years-1846524325
- [S23] Mirror's Edge wiki, Speedrunning (fandom): https://mirrorsedge.fandom.com/wiki/Speedrunning
- [S24] Twinfinite, Mirror's Edge Catalyst time trial tips: https://twinfinite.net/ps4/5-tips-for-mirrors-edge-catalysts-time-trials/4/
- [S26] Wikipedia, Dustforce: https://en.wikipedia.org/wiki/Dustforce ; Game Developer, "Speed Cleaning: an analysis of Dustforce": https://gamedeveloper.com/design/speed-cleaning-an-analysis-of-dustforce
- [S27] Wikipedia, World 1-1: https://en.wikipedia.org/wiki/World_1-1
- [S28] Medium, "Analysis of Super Mario Bros. 1-1": https://medium.com/creating-immersive-worlds/analysis-of-super-mario-bros-1-1-2eb9a70fbeb4
- [S29] Game Developer, video: the level design of Celeste: https://gamedeveloper.com/design/video-the-level-design-of-i-celeste-i-
- [S30] Extremely OK Games, Chapter 9 design post (2019): https://exok.com/posts/2019-11-25-chapter-9-design/
- [S31] Nintendo Life, Tezuka's 5 course-creation tips: https://www.nintendolife.com/news/2019/07/super_mario_maker_2_producer_takashi_tezuka_shares_5_tips_for_creating_courses
- [S32] SUPERJUMP, "Creating Better Courses in Super Mario Maker 2": https://www.superjumpmagazine.com/creating-better-courses-in-super-mario-maker-2/
- [S33] Mawhorter and Mateas, "Procedural Level Generation Using Occupancy-Regulated Extension" (2010): https://www.cs.hmc.edu/~pmawhorter/research/papers/procedural_level_generation_using_occupancy_regulated_extension-Mawhorter_Mateas-2010.pdf
- [S34] Game Developer, "Keep running: procedural level generation in Sure Footing": https://gamedeveloper.com/design/keep-running-procedural-level-generation-in-sure-footing
- [S35] GDC Vault, "Depth in Simplicity: The Making of Jetpack Joyride" (Luke Muscat, 2012): https://www.gdcvault.com/play/1015527/
- [S36] AppSpy summary of the talk: https://www.appspy.com/news/depth-in-simplicity-the-making-of-jetpack-joyride/
- [S37] Adrian Crook, Jetpack Joyride design breakdown: https://adriancrook.com/?p=4709
- [S38] Wikipedia, Canabalt: https://en.wikipedia.org/wiki/Canabalt
- [S39] Game Developer, "The understated genius of the Spelunky daily challenge": https://gamedeveloper.com/design/the-understated-genius-of-the-i-spelunky-i-daily-challenge
- [S40] PC Gamer, "Now playing: the Spelunky daily challenge": https://pcgamer.com/now-playing-the-spelunky-daily-challenge
- [S41] Spelunky wiki, Daily Challenge Mode (HD) (fandom): https://spelunky.fandom.com/wiki/Daily_Challenge_Mode_(HD)
- [S42] GMTK, "How to make a good 2D camera": https://gmtk.substack.com/p/how-to-make-a-good-2d-camera
- [S43] Game Developer, "Camera logic in a 2D platformer": https://gamedeveloper.com/design/camera-logic-in-a-2d-platformer
- [S44] NESdev forum on window cameras at max speed: https://nesdev.nes.science/f2/t8197.xhtml
- [S45] Itay Keren, "Scroll Back: The Theory and Practice of Cameras in Side-Scrollers" (not fetched this session): https://www.gamedeveloper.com/design/scroll-back-the-theory-and-practice-of-cameras-in-side-scrollers
- [S46] Multiplayer.it, Super Mario Maker 2 speedrun levels special: https://multiplayer.it/articoli/super-mario-maker-2-speciale-livelli-speedrun.html
- [S47] Wikipedia, Team 0%: https://en.wikipedia.org/wiki/Team_0%25
- [S48] "How difficult is 1000 Endless Expert levels without skipping": https://keithyipkw.github.io/blog/no_skip_smm
- [S49] Ultimate Chicken Horse wiki, Rules and modifiers (fandom): https://ultimate-chicken-horse.fandom.com/wiki/File:Rules_-_Modifiers.png
- [S50] Clever Endeavour support, custom rules and presets: https://cleverendeavourgames.freshdesk.com/support/solutions/articles/32000028991-custom-rules-and-presets
- [S51] Wikipedia, Ultimate Chicken Horse: https://en.wikipedia.org/wiki/Ultimate_Chicken_Horse
- [S52] Game Developer, "Closing the loop: validating design decisions using player data for a platformer" (Shadow Blade): https://gamedeveloper.com/design/closing-the-loop-validating-design-decisions-using-player-data-for-a-platformer
- [S53] PC Gamer, Super Meat Boy review (replay of about 100 Meat Boys): https://www.pcgamer.com/uk/super-meat-boy-review
- [S54] Critical-Gaming, Super Meat Boy pt. 3: https://critical-gaming.squarespace.com/blog/2011/1/6/super-meat-boy-pt3.html
- [S55] Steam Community, Celeste death-count thread: https://steamcommunity.com/app/504230/discussions/0/1628538707074318672
- [S56] GameSpot forum, "Mario Maker 2: what's your preferred clear rate": https://gamespot.com/forums/nintendo-fan-club-1000001/mario-maker-2-whats-your-preferred-clear-rate-33465811/
- [S57] Room Escape Artist, "How difficult should an escape game be": https://roomescapeartist.com/2015/03/29/how-difficult-should-an-escape-game-be/
- [S58] Game Developer, "Difficulty levels: do they really represent how our players experience our games?": https://gamedeveloper.com/design/difficulty-levels-do-they-really-represent-how-our-players-experience-our-games-
- [S59] Entertainium, "How N++ avoids frustration through non-linear progression": https://entertainium.co/2016/10/01/thinking-outside-the-box-how-n-avoids-frustration-through-non-linear-progression/ ; GDC Vault, "Empowering the Player: Level Design in N++": https://gdcvault.com/play/1023282/
