# 04. Elements: obstacles, items and interactive parts

Research agent 04. Area: the vocabulary of level elements in precision platformers, runners and platformer
makers, how each is telegraphed and timed, and how the games store them. SpeedRunner today has ground, bushes,
trees, one-way roof tiles, moving platforms (periods 2.6 to 3.2 s), wheels (radius 92 u, 4 tiles, periods 3.6 to
4.2 s), floor and ceiling spikes (16 u hitbox inset 4 u), 4 split-only checkpoints and a flag (see 01-current-build.md).
Units for SpeedRunner are world units (u), 1 body length (BL) = 46 u, top run speed 420 u/s, full jump 830 u/s
(apex 138 u = 3.0 BL). Celeste numbers are px/s with 8 px tiles. Tool budget hit at 33 calls; gaps are listed per
question rather than guessed.

Legend: [C] cited finding with a numbered source, [I] inference by the researcher, [K] Kingsfoil fact from the build.

---

## Q1. The element catalogues of the makers

### Takeaway
A maker's catalogue is large (SMM2 has 18 terrain parts alone, with gizmos the biggest growth category over
updates; UCH shipped about 7 new blocks per major update from 2017 to 2026), but the parts that matter for a time
attack are the few that put a clock into the level: On/Off switches, tracks, conveyors, donut blocks, dash blocks
and twisters in Mario Maker, and movers, conveyors, saws and timed traps in UCH. SpeedRunner has only the mover
family. The maker lesson is to add elements one at a time, each with one readable rule, and to give each a
pre-animation.

### Cited findings
- SMM2 released worldwide on 28 Jun 2019 (Switch); announced 13 Feb 2019. Version 2.0.0 added Ninji Speedruns and
  3.0.0 added World Maker. Parts are picked from category wheels with recent parts on top and pinning. [1]
- SMM2 Terrain category, complete list, 18 parts: Ground, Steep Slope, Gentle Slope, Pipe, Clear Pipe, Spike Trap,
  Mushroom Platform, Semisolid Platform, Bridge, Block, ? Block, Hard Block, Hidden Block, Donut Block, Note Block,
  Music Block, Cloud Block, Ice Block. Donut Block rule as written: "falls if players stand on it long enough".
  Clear Pipe: "a transparent tube players can enter to travel between different parts of the same area". Items
  table starts Coin, Frozen Coin, 10-Coin (table cut off in our fetch). [1]
- SMM2 Checkpoint Flag gives "no power-up effect by default in Course Maker"; the maker can load it with a power-up
  (Fire Flower, Super Star) that is granted when activated; it rotates in 4 directions. [2]
- SMM (Wii U) Checkpoint Flag arrived in the update of 4 Nov 2015; max 2 per course (1 in the main area, 1 in the
  sub-area); a course with a checkpoint must also be clearable from the checkpoint before upload. [2]
- Speedrun courses in SMM2: per-course fastest-clear records exist for every course; the "20-second level" is a
  popular trend because 20 s is the shortest time limit a course can be set to; in user speedrun levels the norm is
  to run and jump with precision, not to slow down. [3]
- Nintendo's own speedrun series is Ninji Speedruns (2.0.0); separate from user courses. [1][4]
- UCH changelog, block additions by version and date: 1.4.161 (12 Dec 2017) Paper Airplane Thrower, Wrecking Ball,
  Up-Blower, Pressure Trigger Spikes, Gear, Scaffolding, long-distance and diagonal movers; 1.6.040 (4 Mar 2019)
  Jetpack and Jetpack Dispenser, Paintbrush recolour tool, most blocks rotate and flip, crumbling-block damage
  selectable; 1.6.050 (27 Mar 2019) jetpack dispenser made infinite (was 4 per round); 1.7.027 (12 Mar 2020)
  beehives, cannons, flamethrowers, one-way gates; 1.8.22 (20 Sep 2021) bees give trap points, Parkour preset
  removes trap blocks; 1.13.13 (19 May 2026) falling block, dance mover, "True Random Party box" rule. Console
  release (PS4, Switch, PC build 1.5.064) dated 13 Nov 2018 on the changelog. [5]
- UCH party box rules on the changelog: modes Standard, Disabled, Auto-Pick (1.6.040); Double Party Box for any
  player count (1.6.040); in two-player games each player gets an extra party box per round (1.4.161). [5]
- UCH trap sizes from a community guide: Dynamite blows a 1x1 area, Bomb 3x3, Nuke 5x5; Slowwatch halves time for
  5 to 7 s; black holes and fans redirect arrows and tennis balls but not hockey pucks; honey is the binding block
  used with glue to build contraptions. Guide is old, numbers may have changed. [6]
- UCH bug and fix notes show the physics interactions that cause trouble in a block system: teleporters re-firing
  after respawn, saw blades glued to movers, up-blowers blowing through their own platform, pressure spikes fired by
  a teleporting player before the teleport completes, crumbling blocks loading with the wrong damage level. [5]

### Inferences
- [I] A maker catalogue grows along four axes: solid/one-way terrain, movers (track, conveyor, snake), state
  switches (On/Off, P switch, pressure trigger) and timed hazards (donut, Yoku block, saw on a path). SpeedRunner
  has the first two; the cheapest additions are a timed hazard (a saw or a block on a fixed cycle) and a state
  switch that opens a shortcut, both deterministic because they can be driven by run time like the existing movers.
- [I] The SMM1 rule "clearable from the checkpoint before upload" is a validation rule SpeedRunner can borrow when
  it adds respawn checkpoints or an editor: the author must finish from every checkpoint.
- [I] UCH's trap-point rule (bees give points when they kill) shows how a party game pays authors for hazards; a
  solo time attack has no author to pay, so hazards should pay the runner instead (a faster line).

### Gaps
- Full SMM2 part table (Items, Enemies, Gizmos counts, On/Off Switch, Track, Twister, Dash Block, Conveyor, Snake
  Block, Dotted-Line Block, P Switch, P Block, Arrow text) sits past offset 300000 of the Super Mario Wiki page [1]
  and was not fetched. Dates of SMM2 2.0.0 and 3.0.0 not read from a source.
- No data on which parts appear most in top-rated speedrun courses. The 26.6 M level dataset [7] could answer it.
- UCH fandom wiki returned HTTP 402; the full block list and item-shelf rules (how many items are offered, who
  picks) are unverified. LittleBigPlanet tool list (bounce pads, grab, grapple, bolts, pistons, winches, elastic,
  tags, sensors) was not reached within budget.

---

## Q2. Precision-platformer hazards and helpers with their timings

### Takeaway
Celeste's shipped Player.cs gives the clearest numbers in the genre: a spring launches at 185 px/s up against a
jump of 105 px/s (1.76x), a side spring gives 240 px/s sideways and 140 px/s up, a bumper 200 px/s radial, and a
Badeline-style launch 280 px/s. Refills do nothing to speed, they only reset the dash count. Mega Man's appearing
blocks run a 5-tick loop of about 1 s per tick with each block visible for 2 ticks. Every one of these elements
is colour-coded and most have a pre-animation (spring compresses, block sparkles, Kevin shakes) before they act.

### Cited findings
Celeste (Player.cs as published by the developers) [8]:
- JumpSpeed -105; DashSpeed 240; EndDashSpeed 160; MaxFall 160; DreamDashSpeed = DashSpeed (240).
- Spring (SuperBounce): Speed.X = 0, Speed.Y = SuperBounceSpeed = -185, varJumpTimer 0.2 s, AutoJump on,
  sprite scale (0.5, 1.5) squash, state reset to Normal, `launched = false`.
- Side spring (SideBounce): Speed.X = 240 * dir, Speed.Y = BounceSpeed = -140, forceMoveX for 0.3 s.
- Enemy / block bounce (Bounce): Speed.Y = -140, varJumpTimer 0.2 s, AutoJumpTimer 0.1 s.
- Bumper (PointBounce): 200 px/s along the vector from the bumper, X then x1.2, minimum |X| 120.
- Launched state (Badeline booster, bumpers, Kevin/crush block push): LaunchSpeed 280, LaunchCancelThreshold 220,
  LaunchedMinSpeedSq 140², LaunchedDoubleSpeedSq 150², launch particles after 0.5 s.
- Rebound off a wall: ReboundSpeedX 120, ReboundSpeedY -120; ReflectBoundSpeed 220; SuperJumpH 260; SuperWallJumpSpeed
  -160; lift from a moving platform capped at LiftYCap -130 and LiftXCap 250 (the carry you keep when leaving a
  mover).
- RefillDash: `if (Dashes < MaxDashes) Dashes = MaxDashes`. UseRefill also refills stamina when below the climb-tired
  threshold. No velocity change. Chapter 8 (Core) removes dash recharge on landing, so refills become the only
  recharge besides room transitions. [9]
- Springs also recharge the dash on contact (speedrun community wiki). [10]
Mega Man appearing blocks (Yoku blocks) [11][12]:
- Origin Mega Man 1 (1987). Official name Appearing Block; "Yoku Block" is the fan name. They appear and disappear in
  a set pattern at a set interval, usually about one second. In Mega Man 1 blocks appear in order with up to two
  on screen at a time, then the sequence repeats. [11]
- Mega Man Maker implementation: a loop of 5 ticks, each tick roughly 1 s; a block appears on its assigned tick (1 to
  5) and stays for 2 ticks; 16 visual styles; the only authoring control is the sequence number. [12]
N (Metanet) timer [13]:
- The level timer starts at 90 s and counts down; each piece of gold adds 2 s.
Fall Guys (readability of obstacles) [14][15]:
- Lead designer Joe Walsh: obstacles come first, then levels are built from them; obstacles should "create great
  stories" and allow emergent play. [14]
- Analysis: obstacles are "readable from afar, and easy to react to reflexively". [15]

### Inferences
- [I] Ratio transfer to SpeedRunner. Celeste spring/jump speed ratio is 1.76, height ratio about 3.1x. With jumpVel
  830 u/s a 1.5x spring (1245 u/s, apex 310 u = 6.7 BL) already clears the 545 u visible height more than half way;
  1.76x (1460 u/s, apex 426 u = 9.3 BL) needs camera room. Start at 1.4 to 1.5x and keep AutoJump semantics (no
  jump-cut on a spring, Celeste sets varJumpTimer 0.2 s so holding adds height).
- [I] Celeste's side spring keeps 240 px/s sideways for 0.3 s of forced movement; SpeedRunner's equivalent is a
  horizontal booster that sets vx above maxRun (420) and lets overspeedDecay (500 u/s²) bleed it. A boost to 600 u/s
  decays back to 420 in 0.36 s, about 180 u of extra ground. Tune the decay or add a "launched" flag that suspends
  decay for 0.3 s like Celeste's forceMoveXTimer.
- [I] A refill-style element for SpeedRunner would be a mid-air "second jump" crystal (the build has no dash). It
  changes nothing about speed, only the move budget, which is why Celeste can place it in open air without hiding
  the route.
- [I] Timed block for SpeedRunner. Mega Man's 1 s tick at Mega Man's walk speed (about 1.3 tiles/s at 16 px tiles)
  covers about 1.3 tiles per tick. At 420 u/s SpeedRunner covers 9 BL per second, so a 1 s tick is too long for
  stepping stones; a 0.5 s tick (210 u, about 4.5 BL per tick) with 2 ticks visible is a closer analogue. Drive the
  phase from run time so the cycle is identical every attempt (as the movers already are).
- [I] Mega Man Maker's "sequence number only" authoring is the right level of control for SpeedRunner's arrays: one
  extra integer per timed block, global period per map.

### Gaps
- Celeste Spring.cs, ZipMover.cs, CrushBlock.cs (Kevin), DreamBlock.cs, FlyFeather (StarFly) speeds, Badeline booster
  speed were not fetched; only Player.cs constants above are confirmed. Player.cs past 100000 characters (ExplodeLaunch,
  FinalBossPushLaunch, StarFly constants) not read.
- Super Meat Boy saw/missile/fan speeds, N++ mine/thwump/bounce-block/launch-pad numbers, VVVVVV gravity lines and
  conveyors, Dustforce dust, Shovel Knight, Hollow Knight, Mario P-switch and note-block timings: not reached.
  Frame-exact Mega Man 1 Yoku timing not found (a disassembly or TAS resource would give it).

---

## Q3. Runner elements

### Takeaway
Endless runners use a small fixed vocabulary and pace it by distance and speed, not by hand placement. Jetpack
Joyride has three hazards (zappers, missiles, lasers), one collectible (coins), one meta token (spin token, worth
100 coins), vehicles and gadgets, and a mission system of 3 live missions worth 1 to 3 stars. Doodle Jump has
about six power-ups and three hazard types. Solipskier shows the next gate's altitude and distance at the right
edge before it arrives. The lesson for SpeedRunner is the warning channel: a hazard that enters at speed needs
an on-screen cue before it can be reacted to.

### Cited findings
Jetpack Joyride [16][17][18]:
- Hazards: zappers (electric), missiles, high-intensity laser beams; "contact with any of these obstacles would
  result in instant death", after which the body slides on for extra distance. [16]
- Spin tokens: 1 slot spin each or cashed for 100 coins. Puzzle pieces "S", "A", "M" (3 per day) unlock the S.A.M.
  vehicle; S.A.M. meets only missiles, which it deflects with its arm (update reported 2 Dec 2013). [16]
- Vehicles from rainbow gear boxes, each lasts until it hits an obstacle: Bad As Hog, Mr. Cuddles, Crazy Freaking
  Teleporter, Gravity Suit, Profit Bird, Lil Stomper, Wave Rider, Sleigh of Awesome plus event vehicles; most have
  Magnetic and Golden upgrades. [16]
- Missions: 3 active at a time, 1 to 3 stars each, completing one spawns another; level-ups pay coins; at the top
  level one of 125 badges and a reset; skipping a mission costs 500 coins per star. Gadgets: 2 equipped, 3 after a
  purchase. [16]
- Release iOS 1 Sep 2011 (developed as Machine Gun Jetpack), Android 28 Sep 2012, PS4 26 Apr 2016. Metacritic 90. [16]
- Design reading: near-miss missions change how players see zappers, they start "collecting" them; lasers are
  "very predictable" and work as a break in the run. [17] Luke Muscat's GDC talk "Depth in Simplicity: The Making of
  Jetpack Joyride" is free on GDC Vault. [18]
Doodle Jump [19]:
- Released iOS March 2009; Android and BlackBerry 2 Mar 2010; many ports. Power-ups: propeller hats, jetpacks,
  rockets, springs, trampolines, invulnerability shields. Hazards: monsters (avoid, shoot or jump on), UFOs that
  abduct, black holes that end the game. Sold 25,000 copies a day for four months; 10 M copies by 2011.
Solipskier [20]:
- Flash and iOS 29 Aug 2010 (Mikengreg, Michael Boxleiter and Greg Wohlwend; Kongregate). The player draws the slope;
  an incline launches, a downhill accelerates. Upcoming obstacles appear at the right of the screen with their
  required altitude and distance. Tunnels were implemented as a series of gates. A streak of gates earns a bonus.
  Speed rises over time; at high speed the skier loses the headphones and the music cuts to wind. No tutorial, the
  game starts on the first click. Walls are listed as obstacles.

### Inferences
- [I] Jetpack Joyride's missile warning (an on-screen indicator before the missile enters) is the canonical
  "telegraph a fast hazard" pattern for a right-scrolling game. SpeedRunner's camera leads by 120 u and the view
  is 970 u wide at 420 u/s, so anything that moves faster than about 400 u/s toward the player gives under 1 s of
  reaction once visible; a static hazard is fine, a moving one needs a cue 1 s ahead (about 420 u) or should be
  deterministic and learnable.
- [I] Solipskier's "next gate shows altitude and distance" is the same job as Mario Maker's track preview: show the
  target before the player must commit. For SpeedRunner a faint target line above a spring or a dotted arc would
  telegraph a launch without text.
- [I] Endless runners pace by distance because they cannot hand-place; SpeedRunner has fixed maps, so its pacing
  tool is the checkpoint split: each of the 4 sections can carry one new element.

### Gaps
- Jetpack Joyride element spacing by distance and speed (the spawn tables), Canabalt crane/bomb/window pacing, Alto
  and Tiny Wings elements: not reached. Doodle Jump breaking and moving platform rules not in the Wikipedia article.
  Solipskier blue vs red gate scoring not confirmed.

---

## Q4. Items in races

### Takeaway
Items are a catch-up device for live multiplayer races (SpeedRunners 2013, Mario Kart, Fall Guys' grab). A solo
time attack with a leaderboard has no one to catch up to and a determinism requirement, so items that affect
other players have no place; only self-affecting pickups that are placed in the map (a boost pad, a refill) fit.
Fall Guys' designers describe their obstacles as story generators, which is a party goal, not a time-attack one.

### Cited findings
- SpeedRunners (DoubleDutch Games, published by tinyBuild) is described by its wiki as a 4-player competitive running
  game whose competitive fun comes from weapons and hazards: rockets, bombs, grappling hooks, spikes. One item drops
  three crates. [21][22]
- Fall Guys: Mediatonic starts from obstacles "we've always wanted to test players with", then builds rounds; wrecking
  balls (Hit Parade), oversized hammers (Fall Mountain), axes and drawbridges (Knight Fever). [14] The beans are
  "designed to have the least practical shape for the tasks". [23]
- UCH pays authors trap points when their trap kills (1.8.22, bees). [5]

### Inferences
- [I] Should a solo time attack have items at all? Nothing cited argues for it. The deterministic-run requirement
  (SpeedRunner's movers are driven by run time) excludes random item boxes outright, and position-based catch-up
  items (Mario Kart style) have no opponent to target. Fixed map pickups that change the runner's own state (boost
  pad, jump refill, key that opens a shortcut door) are the only "items" that keep a leaderboard comparable.
- [I] If a live race mode arrives (agent 07's area), SpeedRunners-style items should be a separate ruleset with its
  own leaderboard, never mixed into the solo times.

### Gaps
- speedrunners.wiki.gg/wiki/Items returned 404; the exact item list (missile, crate, bomb, ice, golden hook, drill,
  fireworks) and the position-based item roll are unverified. Mario Kart item-probability tables and Fall Guys
  obstacle rhythm (hammer periods, see-saw tilt rates, tile fall delays) not reached. No designer statement for or
  against items in solo time attack was found.

---

## Q5. Checkpoints and flags

### Takeaway
Three checkpoint contracts exist. Respawn checkpoints (Mario Maker: 2 per course, 1 main area + 1 sub-area since
4 Nov 2015; Celeste: every room) cut the cost of failure. Split-only checkpoints (SpeedRunner, Trackmania's
checkpoint times) give information without changing the run. Trackmania mixes both: checkpoints are splits, and
you may respawn to the last one at the cost of your own lost time, with two respawn kinds (rolling, or stand-still
on a double press). Super Meat Boy and N++ have none per level and keep levels short instead.

### Cited findings
- SMM (Wii U): Checkpoint Flag added 4 Nov 2015; max 2 per course (1 main, 1 sub); must be clearable from the
  checkpoint to upload. SMM2: no power-up by default, maker can attach one. [2]
- The brief said "one per level in MM1". The wiki says two (one per area) in MM1 and the SMM2 count is not stated
  on the page we read. [2]
- Trackmania: a community server rulebook requires that longer maps (35+ s) be re-spawnable with the double-respawn
  (stand-still respawn) near the end. [24] Nadeo's importer wiki: the respawn socket restarts the car from a
  checkpoint when the respawn button has been pressed twice. [25] A rolling respawn is the default, and a visual bug
  report confirms the two kinds exist. [26] A community plugin exists to time runs with no respawns (No-Respawn
  Timer). [27]
- Celeste refills dashes on room transitions (Chapter 8 removes landing recharge, leaving refills and screen
  transitions). [9]
- SpeedRunner today: 4 checkpoints per map, splits only, death restarts the whole map after 0.38 s plus a 3 s
  countdown (about 3.4 s death to control). [K, 01-current-build.md]

### Inferences
- [I] Trackmania's model fits SpeedRunner best: keep checkpoints as splits for the record run, add an optional
  "respawn at last checkpoint" that keeps the run timer running (lost time is the penalty) and flags the run as
  "with respawn" on the leaderboard, or simply excludes it from the record. This is the "practice from checkpoint"
  mode players ask for in restart-heavy games, and it costs one saved position per checkpoint.
- [I] Respawn penalty debate in one line: a fixed penalty (e.g. +3 s) makes respawn a tactical choice and keeps
  one leaderboard; a separate category keeps records pure. Trackmania chose "no penalty beyond lost time, but you
  keep your run time"; the community then built no-respawn tooling, which shows players want both.
- [I] With a 3.4 s death-to-control cost and maps of 16 s or more of pure running, the checkpoint respawn would cut
  the average retry cost per section from the full map to about a quarter of it.

### Gaps
- Trials checkpoint rules, Trackmania official rules text on respawn timing, Celeste designer statements on
  per-room respawn, Super Meat Boy and N++ designer statements on "no checkpoints": not reached. Player-reaction
  threads on the respawn penalty were not found.

---

## Q6. Telegraphing and readability (element design side only)

### Takeaway
Across the catalogues every element obeys three rules. One, a fixed colour and silhouette per behaviour (Celeste
green refill crystal, grey/red Kevin, Mario Maker's red/blue On/Off blocks). Two, a pre-animation before the
element acts (Celeste spring compresses, Mario donut block shakes before it drops, Mega Man block sparkles, Kevin
shakes before charging). Three, the element's range is drawn (Mario Maker shows tracks as lines, Solipskier shows
the next gate's altitude). Fall Guys puts legibility first so obstacles read "from afar" and can be answered by
reflex.

### Cited findings
- Donut Block falls "if players stand on it long enough" (a stand-timer with a shake). [1]
- Celeste SuperBounce squashes the sprite to (0.5, 1.5) on launch, a readable stretch. [8]
- Solipskier previews upcoming gates with altitude and distance at the right edge. [20]
- Jetpack Joyride lasers are "very predictable" and read as a break; near-miss missions reframe zappers. [17]
- Fall Guys: obstacles "readable from afar, and easy to react to reflexively". [15]
- Mega Man appearing blocks run on a fixed audible/visual interval of about 1 s. [11][12]

### Inferences
- [I] SpeedRunner's ink style has a built-in colour budget: black solids, white paper, one red. Red is already the
  kimono, so "red = death" conflicts with the hero. Options: keep death black (spikes already are) and give helpers
  (springs, refills) the single accent colour, or add one more ink (vermilion for hazards, indigo for helpers).
  Agent 01 (animation) owns the exact palette.
- [I] Every new element should ship with three things: an idle animation that states its type (a spring bobs, a
  timed block flickers), a pre-animation of 150 to 300 ms before it acts, and a sound. The build's audio is synth
  only, so each element also needs one synth voice.
- [I] Troll elements (other agent) break rule two on purpose; a time attack should never, because a surprise death
  on attempt 1 is a reset of 3.4 s plus the whole section.

### Gaps
- Mario Maker's pre-shake timings (donut block delay, falling icicle warning) and UCH's trap arrows were not fetched
  as numbers. Silhouette and contrast rules from a primary design source (GDC talk) were not found within budget.

---

## Q7. Collectibles in a time attack

### Takeaway
Collectibles make routes. Celeste has 202 strawberries (175 red, 26 golden, 1 moon) and a golden berry is a
no-death run of a chapter; Metanet's N adds 2 s per gold to a 90 s timer, so gold is a time currency; Jetpack
Joyride's spin token is worth 100 coins; Mario Maker speedrun courses are pure time, often at the 20 s minimum.
A time attack should either make collectibles pay in time (N) or keep them off the record route (Celeste).

### Cited findings
- Celeste: 202 strawberries total, 175 red across A and B sides, 26 golden, 1 moon berry (only in the last
  sub-chapter of Chapter 9). The winged golden strawberry at the end of Chapter 1 requires no dash in the whole
  chapter unless you die before leaving its room. [28][29]
- N (Metanet): timer starts at 90 s, each gold adds 2 s. [13]
- Jetpack Joyride: spin token = 1 spin or 100 coins; coins buy gadgets (2 equipped, 3 with purchase). [16]
- Super Mario Maker 2 speedrun courses: 20 s is the shortest time limit a course can be set to and is a popular
  format. [3]

### Inferences
- [I] For SpeedRunner the N model ("gold = time") is the only one that keeps a single leaderboard honest: a
  collectible that subtracts, say, 0.5 to 1.0 s from the run time only pays if the detour costs less than that at
  420 u/s (a 1 s bonus is worth a 420 u detour, about 9 BL). It also creates the risk-reward line the brief asks
  for: the bonus route is longer or harder but net faster for good players.
- [I] The Celeste model (collectible off the record, shown on the results screen) is cheaper and safer: no timer
  arithmetic, no "collectible route" rules disputes. A middle path is a separate "all berries" board per map.
- [I] Record in the ghost whether a run took the bonus so the duel shadow can show the alternate line.

### Gaps
- N++ race mode gold rule (the brief's "minus 2 s per piece in time trials") not verified for N++ itself; only the
  original N timer page states +2 s per gold. Super Meat Boy bandage count per chapter not reached. Celeste
  strawberry counts per chapter not fetched.

---

## Q8. Data representation

### Takeaway
Makers store elements as fixed-size records. Super Mario Maker (Wii U) .cdt is an 86,016 byte big-endian file with
a 2,600-object region of 32 bytes per object, a 300-entry sound-effect region of 8 bytes each, a uint16 time limit
at 0x70 and an object count at 0xEC. SMM2 courses gzip from about 23.5 KB (0x5BFD) to about 3 KB, and a dataset of
26.6 M of them exists. Celeste maps are a "CELESTE MAP" BinaryElement tree (.bin, with a -B.bin companion). N's
grid is 42x23 one-byte tiles plus entity records (unverified byte count). SpeedRunner's `[x, y, w, h, tag]` arrays
are the same shape as these; what they lack is a per-element parameter slot.

### Cited findings
- SMM (Wii U) .cdt: big-endian; header version at 0x00 (always 11); CRC32 at 0x08 over bytes from 0x10; creation
  date fields 0x10 to 0x15; upload Data ID at 0x18; UTF-16 course name at 0x28; game mode at 0x6A (M1, M3, MW, WU);
  theme at 0x6D (0 overworld, 1 underground, 2 castle, 3 airship, 4 water, 5 ghost house); time limit uint16 at
  0x70; autoscroll at 0x72 (0 none, 1 slow, 2 medium, 3 fast); deaths at 0xDC; object count at 0xEC; objects at
  0xF0, 83,200 bytes = 2,600 objects x 32 bytes; sound effects at 0x145F0, 2,400 bytes = 300 x 8 bytes; 176 bytes
  padding at 0x14F50; total 0x15000 = 86,016 bytes. [30]
- SMM2: level data is gzip-compressed binary equal to Nintendo's in-game format, read with a Kaitai `level.ksy`;
  `level.overworld.object_count` and `level.overworld.objects[i]` with `x`, `y`, `id`; the objects array is fixed
  size so readers iterate to object_count. Dataset: 26.6 M levels, about 100 GB, collected in February 2022. [7]
  A course file of 0x5BFD bytes gzips to about 3 KB, "an eighth the size". [31]
- Celeste: map binaries start with the string "CELESTE MAP" and use the BinaryElement tree format; maps ship as
  pairs such as YourMap.bin and YourMap-B.bin; community loaders (celeste_rs, strawberride) load and save them
  losslessly. [32][33][34]
- SpeedRunner: solids are `[x, y, w, h, tag]`, ground top at y 600, movers and wheels are driven by run time. [K]

### Inferences
- [I] 32 bytes per object (SMM1) vs SpeedRunner's JSON `[x,y,w,h,tag]` at about 25 to 30 characters per element:
  the text form is already compact enough for a few hundred elements per map (m1 has about 6830 u of width; at
  roughly one element per 100 u that is under 100 elements, a few KB).
- [I] Add a sixth optional slot, an object: `[x, y, w, h, tag, {period, phase, dir, link}]`. `period` and `phase`
  cover movers, wheels, timed blocks and conveyors; `dir` covers springs and one-way gates; `link` covers a switch
  and the door it opens (SMM1 has a link id per object for the same reason). Everything stays deterministic because
  the phase is read against run time.
- [I] Keep ids small and stable (SMM2 uses a numeric `id` per object); a tag string is fine for a hand-edited map but
  a numeric id costs less if a ghost or a level-share payload ever has to carry element state.
- [I] For a future share format, gzip of JSON text at SMM2's ratio (about 8:1) would put a 10 KB map under 2 KB,
  small enough for a URL fragment or a leaderboard record.

### Gaps
- SMM1 object field layout (x, y, z, width, height, flags, type, child type, link id, effect index, transform id)
  is not on the wiiubrew page; the smm-course-viewer FORMAT.md and the Kaitai `level.ksy` would give it. N++ tile
  and entity byte layout unverified (the 42x23 = 966 one-byte grid is arithmetic, not a citation). UCH level-sharing
  payload not found.

---

## Candidate technique profiles

1. **Spring / bounce pad.** Launch at 1.4 to 1.8x jump speed with auto-jump semantics and a squash sprite.
   Celeste: 185 vs 105 px/s, varJumpTimer 0.2 s, scale (0.5, 1.5). SpeedRunner start: vy 1200 to 1460 u/s.
2. **Side booster.** Horizontal launch with a forced-move window. Celeste side spring 240 px/s for 0.3 s; the
   build's overspeedDecay 500 u/s² would bleed a 600 u/s boost in 0.36 s.
3. **Timed (appearing) block.** Fixed cycle driven by run time, pre-sparkle, sequence index per block. Mega Man 1
   (1987) 5-tick loop, 1 s per tick, 2 ticks visible; SpeedRunner 0.5 s tick proposed.
4. **Donut / crumble block.** Falls after a stand timer with a shake. SMM2 Donut Block; UCH crumbling block with
   selectable damage level (1.6.040).
5. **Refill crystal (second jump).** No speed change, resets a move budget; respawns on a timer. Celeste
   RefillDash; Chapter 8 makes it the only recharge.
6. **On/Off switch and linked door.** A state toggle that opens a shortcut; needs a `link` field. SMM2 On/Off
   Switch (text not fetched), UCH pressure trigger spikes (1.4.161), SMM1 link id per object.
7. **Conveyor / track mover.** Already half built (movers, wheels); add a conveyor that adds vx while standing.
   SMM2 Conveyor Belt and Track; UCH long-distance and diagonal movers (2017), dance mover (2026).
8. **Moving saw on a path.** The classic SMB hazard; a deterministic hazard that is both obstacle and metronome.
   UCH linear saw blade (not glueable since 1.5.064).
9. **Respawn-at-checkpoint practice mode.** Trackmania contract: keep the timer running, separate or flagged
   leaderboard, author must be able to finish from each checkpoint (SMM1 upload rule).
10. **Time-currency collectible.** N: +2 s per gold on a 90 s timer. SpeedRunner: -0.5 to -1.0 s per pickup, so a
    1 s pickup is worth at most a 420 u detour.
11. **Hazard warning cue.** Jetpack Joyride missile indicator; Solipskier next-gate preview with altitude and
    distance. Needed only for anything that moves toward the player faster than about 400 u/s.
12. **Element record with a parameter slot.** `[x, y, w, h, tag, {period, phase, dir, link}]`, numeric ids, gzip
    for sharing (SMM2 about 8:1, 0x5BFD bytes to 3 KB).

---

## Sources

1. Super Mario Wiki, Super Mario Maker 2. https://www.mariowiki.com/Super_Mario_Maker_2
2. Super Mario Wiki, Checkpoint Flag. https://www.mariowiki.com/Checkpoint_Flag
3. Multiplayer.it, Super Mario Maker 2 speciale livelli speedrun. https://multiplayer.it/articoli/super-mario-maker-2-speciale-livelli-speedrun.html
4. Nintendo Wire, new Ninji Speedrun course (22 Jan 2021). https://nintendowire.com/news/2021/01/22/new-ninji-speedrun-course-in-super-mario-maker-2-wants-to-know-if-you-can-dig-it/
5. Clever Endeavour Games, Ultimate Chicken Horse change log (all platforms). https://www.cleverendeavourgames.com/changelog
6. Gameplay.tips, Ultimate Chicken Horse tips, tricks and usage. https://gameplay.tips/guides/3511-ultimate-chicken-horse.html
7. TheGreatRambler, mm2_level dataset README (Hugging Face). https://huggingface.co/datasets/TheGreatRambler/mm2_level/blob/main/README.md
8. NoelFB/Celeste, Player.cs (published by the developers). https://github.com/NoelFB/Celeste/blob/master/Source/Player/Player.cs
9. Celeste Wiki, Chapter 8: Core. https://celestegame.fandom.com/wiki/Chapter_8:_Core
10. Celeste speedrun community wiki, Spring. https://cc-wiki.duckdns.org/wiki/Spring
11. MMKB, Appearing Block / Yoku Block. https://megaman.fandom.com/wiki/Appearing_Block
12. Mega Man Maker Wiki, Yoku Block. https://wiki.megamanmaker.com/index.php/Yoku_Block
13. N Wiki, Timer. https://n.fandom.com/wiki/Timer
14. Game Developer, Q&A: designing for seasons in Fall Guys (Joe Walsh). https://gamedeveloper.com/design/q-a-designing-for-seasons-in-bumbling-platform-royale-i-fall-guys-i-
15. Edge via PressReader, "The King Of The Castles" (10 Sep 2020). https://www.pressreader.com/australia/edge/20200910/283553748016109
16. Wikipedia, Jetpack Joyride. https://en.wikipedia.org/wiki/Jetpack_Joyride
17. Adrian Crook, Design breakdown: Jetpack Joyride. https://adriancrook.com/?p=4709
18. GDC Vault, Depth in Simplicity: The Making of Jetpack Joyride (Luke Muscat). https://www.gdcvault.com/play/1015527/
19. Wikipedia, Doodle Jump. https://en.wikipedia.org/wiki/Doodle_Jump
20. Wikipedia, Solipskier. https://en.wikipedia.org/wiki/Solipskier
21. SpeedRunners Wiki (wiki.gg), main page. https://speedrunners.wiki.gg
22. TV Tropes, SpeedRunners. https://tvtropes.org/pmwiki/pmwiki.php/VideoGame/SpeedRunners
23. GGRecon, Fall Guys developers on the beans. https://www.ggrecon.com/articles/fall-guys-developers-reveal-what-makes-their-jelly-beans-so-lovable
24. Community Trackmania server rulebook (Google Doc, PDF export). https://docs.google.com/document/d/1hB_dZHk9OYu_GghrEHvVd4eELX-eT5oQ4WZCj2yGbr4/export?format=pdf
25. Trackmania wiki, Nadeo importer, Creating Waypoints. https://wiki.trackmania.io/en/content-creation/nadeo-importer/Creating-Waypoints
26. DevTrackers, Trackmania "wrong rolling respawn animation" report. https://devtrackers.gg/trackmania/p/2a9341a7-major-visual-bug-wrong-rolling-respawn-animation
27. Openplanet, No-Respawn Timer plugin. https://openplanet.dev/plugin/norespawntimer
28. Gameplay.tips, Celeste 100% completion guide. https://gameplay.tips/guides/celeste-100-completion-guide.html
29. Celeste Wiki, Celeste (strawberry totals). https://celestegame.fandom.com/wiki/Celeste
30. WiiUBrew, Cdt (Super Mario Maker course format). https://wiiubrew.org/wiki/Cdt
31. Phrack 72, "the feed is ours" (SMM2 course size and Kaitai spec). https://phrack.org/issues/72/18
32. docs.rs, celeste crate (BinaryElement format). https://docs.rs/celeste/latest/celeste/
33. Everest resources wiki, Mapping FAQ. https://github.com/everestapi/resources/wiki/Mapping-FAQ
34. docs.rs, strawberride (Celeste map loader). https://docs.rs/crate/strawberride/0.1.2
35. Super Mario Wiki, Super Mario Maker 2 release and Ninji Speedruns (same page as 1).
