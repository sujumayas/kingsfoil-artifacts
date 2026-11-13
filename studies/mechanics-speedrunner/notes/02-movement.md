# 02. Movement mechanics: the platformer feel canon and physics-based movement

Research agent 02, 13 Nov 2026. SpeedRunner facts come from `01-current-build.md` ([K]). Units: SpeedRunner uses
world units (u), hero 20x46 u, so 1 BL = 46 u. Celeste uses pixels at 60 Hz, Madeline's hitbox is 8x11 px
(`normalHitbox = new Hitbox(8, 11, -4, -11)`, S1) and a tile is 8 px, so 1 BL (hitbox) = 11 px. SMB1 small Mario is
16 px tall and a block is 16 px, so 1 BL = 1 block.

Source quality legend used below: [S] primary source code or designer statement, [C] community guide or wiki,
[I] my inference or arithmetic, [U] number I recall from a source I could not fetch this session (treat as unverified).

Access notes: Medium (Maddy Thorson's two posts) returned 403 on direct and mirror fetches. The Sonic Physics Guide
(info.sonicretro.org) is behind Anubis bot protection and returned "Access Denied". Fandom was not tried. The
Celeste `Player.cs` on GitHub fetched fine and is the backbone of this file (scratch copy in `scratch-02/Player.cs`).

---

## Q1. Jump curves

### Takeaway
The three jumps I could measure or compute converge on the same shape: apex in roughly 330 to 450 ms, total air
time about 0.6 s, height 2.5 to 4 body lengths, and a fall that is faster than the rise. SpeedRunner's full jump
(3.0 BL, 361 ms to apex with the apex band, 0.26 s fall) is within a few percent of Celeste's (3.5 tiles, 361 ms,
0.26 s). The mechanisms differ. Celeste holds the launch speed for 0.2 s while jump is held and uses the same
gravity both ways; SpeedRunner and SMB1 use heavier gravity on the way down (x1.65 and about x3.5).

### Cited findings
- Celeste constants (S1, `Player.cs` lines 23 to 138): `Gravity 900`, `HalfGravThreshold 40` (gravity x0.5 while
  |vy| < 40 px/s and jump held, line 2952), `MaxFall 160`, `FastMaxFall 240` (holding down), `MaxRun 90`,
  `RunAccel 1000`, `RunReduce 400`, `AirMult 0.65`, `JumpSpeed -105`, `JumpHBoost 40`, `VarJumpTime 0.2`,
  `CeilingVarJumpGrace 0.05`, `JumpGraceTime 0.1`, `WalkSpeed 64`.
- Celeste variable jump (S1, line 2961): while `varJumpTimer > 0` and jump is held, `Speed.Y` is pinned to the
  launch speed. Releasing sets the timer to 0, so the player decelerates from wherever they are. Hitting a ceiling
  inside the first 50 ms does not cancel the hold (`CeilingVarJumpGrace`, line 2614).
- SMB1 (S2, Data Crystal notes): vertical velocity whole pixels at RAM 0x009F, fraction at 0x0433, gravity at
  0x0709/070A. Example jump impulse 0xFB (= -5 px/frame as a signed byte), gravity "0x30 (weaker) when going up"
  and "0xA8 (stronger) when falling down", vertical velocity clamped to +5 px/frame. The page says both the impulse
  and the gravity vary with horizontal speed and that the exact algorithm is not documented there.
- SMB1 (S3, TASVideos): 16 horizontal subpixels per pixel; a minimal-height jump is "hold A for one frame"; the
  21-frame rule rounds level-end progress to the next 21-frame boundary.
- Hypertextbook fall measurement (S4): Super Mario Bros. fall 292 px in 15 frames of 30 fps video (0.5 s), Mario
  measured 39 px tall in a scaled capture, giving 9.31 g with Mario at 1.524 m. Same method for SMB3 9.42 g, Super
  Mario World 6.32 g, Mario 64 7.06 g, Sunshine 4.4 g. Coarse (30 fps video, no terminal-velocity check) but it is
  the most quoted "Mario gravity" source.
- N (2008, Metanet) community frame measurements (S5): a full-screen free fall takes 96 frames, the ninja reaches
  top running speed around frame 52 and max fall speed around frame 46. No N++ constants found.
- Critical Points "5 games 5 jumps" (S6): Mega Man sets velocity to a slight negative on release (instant drop);
  Super Mario uses lower gravity while A is held and heavier gravity after release or at apex; Sonic release
  reduces upward speed to a small value; Smash and KoF have two fixed heights chosen before leaving the ground.
  All at 60 fps, no constants given.
- Super Meat Boy: Tommy Refenes said there are no formulas, the system is "a big huge hack", and the controls took
  two months (S7 search snippet, the Game Developer blog URL did not resolve, see gaps). Meat Boy has almost no air
  friction so holding a position in the air is hard (S8, Juicy Beast).
- Hollow Knight and Mario Odyssey: no numeric jump data found this session (S9, S10 are qualitative).

### Inferences (arithmetic from the cited constants)
Celeste full jump, jump held the whole way: 0.2 s at 105 px/s = 21.0 px, then 105 to 40 px/s at 900 = 5.2 px, then
40 to 0 at 450 = 1.8 px. Height 28.0 px = 3.5 tiles = 2.5 BL (hitbox) or 1.75 BL if you use the 16 px sprite.
Time to apex 0.200 + 0.072 + 0.089 = 0.361 s. Fall from 28 px with g 900 and cap 160: 0.264 s. Air time about
0.62 s. Minimum jump (release on frame 1): about 1.75 + 6.1 = 8 px, one tile. Fall gravity multiplier 1.0 (Celeste
gets its "snappy fall" from the hold-then-release, not from heavier gravity).

SpeedRunner (K): without the apex band, 830²/(2·2500) = 138 u, 332 ms. With the band (gravity 1375 inside 90 u/s):
(830²-90²)/5000 = 136.2 u + 90²/2750 = 2.9 u, total 139 u = 3.0 BL, apex at 0.296 + 0.065 = 0.361 s. Fall from
139 u at 4125 u/s² takes 0.26 s (peak 1070 u/s, under maxFall 1150). Air time 0.62 s. Min jump with jumpCut 0.45:
(0.45·830)²/5000 = 28 u = 0.6 BL, 150 ms to apex.

SMB1 with the Data Crystal pair (v0 5 px/f, g up 0x30/256 = 0.1875 px/f², g down 0xA8/256 = 0.656 px/f², cap 5):
height 25/(2·0.1875) = 66.7 px = 4.2 blocks = 4.2 small-Mario BL, apex at 26.7 frames = 444 ms, fall 14.3 frames =
238 ms (velocity reaches 5 px/f cap at frame 7.6, so slightly longer, about 15.5 frames). Fall/rise gravity ratio
3.5. The widely quoted "5 times his height" (S4 intro) is the running jump; the pair above is probably the running
tier because 0xFB is the largest impulse. Treat the tier table as a gap.

Comparison table (I):

| Game | Height | Time to apex | Fall time | Fall/rise g | Min jump |
|---|---|---|---|---|---|
| SpeedRunner (K) | 139 u = 3.0 BL (hero 46 u) | 361 ms (332 without band) | 260 ms | 1.65 | 0.6 BL |
| Celeste (S1) | 28 px = 3.5 tiles = 2.5 BL | 361 ms | 264 ms | 1.0 (hold 0.2 s instead) | about 1 tile |
| SMB1 (S2) | 67 px = 4.2 blocks = 4.2 BL | 444 ms | about 250 ms | 3.5 | 1 frame of A |
| N (S5) | n/a | n/a | full screen 96 f = 1.6 s | n/a | n/a |

The reading for SpeedRunner is that its jump already sits in the canon. The one thing it lacks is Celeste's
"hold pins velocity" model, which makes jump height a function of hold time rather than a multiplicative cut.
Both are valid; the Celeste model gives a continuous height range (1 to 3.5 tiles), the cut model gives two main
heights with a short ramp between them.

### Gaps
- Jdaster64's SMB1 physics sheet with the three horizontal-speed tiers (impulses 0xFC/0xFC/0xFB, hold gravities
  around 0x20/0x1E/0x28 and release gravities around 0x70/0x60/0x90 as I recall them, [U]) was not fetched;
  smbpedia.github.io pages 404 and Data Crystal gives only one pair. The "Mario's jump depends on run speed" rule
  is confirmed qualitatively by S2 and S6 but not with the tier numbers.
- No frame data for Super Meat Boy, N++, Hollow Knight, Mario Odyssey. Hollow Knight tile heights and the Odyssey
  move set numbers need a dedicated search (speedrun.com guides and the Rochester essay were qualitative).
- Celeste's jump buffer length lives in `Input.cs` (`VirtualButton` buffer time), which is not in the published
  file. Community wikis quote it, I did not verify it.

---

## Q2. Forgiveness

### Takeaway
Celeste's published numbers are the benchmark: 100 ms coyote (6 frames), 4 px upward and dash corner correction
(half a body width), a 3 px wall-jump reach, a 60 ms "wall speed retention", a 50 ms ceiling grace on the variable
jump, and a 160 ms horizontal lock after a wall jump. SpeedRunner already matches coyote (100 ms) and beats most
games on buffer (130 ms) and wall memory (80 ms); it has no corner correction, which is the one visible omission.

### Cited findings
- Celeste `JumpGraceTime 0.1` (S1 line 48), set when on ground (line 717) and decremented in the air (line 720).
- Celeste `UpwardCornerCorrection 4` (line 53): when moving up into a ceiling, the code tries shifting the player
  1 to 4 px sideways before cancelling the jump (lines 2591 to 2603). `DashCornerCorrection 4` does the same for
  dashes in both axes (lines 2408, 2511, 2524, 2668, 2682). `DuckCorrectCheck 4` / `DuckCorrectSlide 50` nudge a
  ducking player 4 px to fit under a ledge.
- Celeste `WallJumpCheckDist 3` (line 56): a wall jump fires if a solid is within 3 px of the hitbox edge (line
  1733), so you can wall jump from up to 3 px away.
- Celeste `WallSpeedRetentionTime 0.06` (line 54): after running into a wall, the lost X speed is kept for 60 ms
  and restored if you leave the wall (line 806), so a jump 1 to 3 frames late off a wall keeps your speed.
- Celeste `CeilingVarJumpGrace 0.05` (line 52): bonking a ceiling in the first 50 ms of a jump does not kill the
  variable jump (line 2614).
- Celeste `WallJumpForceTime 0.16` (line 57): horizontal input ignored for 160 ms after a wall jump.
- Celeste `DashHJumpThruNudge 6`, `DashVFloorSnapDist 3` (lines 81, 83): a horizontal dash that clips a one-way
  platform gets nudged up to 6 px; a vertical dash snaps to a floor within 3 px.
- Celeste `JumpThruAssistSpeed -40` (line 127): a small upward speed when dropping through one-way platforms.
- Celeste `LiftBoost` caps (lines 124, 125): speed inherited from a moving platform capped at -130 px/s up and
  250 px/s sideways, added on every jump (`Speed += LiftBoost`, lines 1672, 1707, 1762, 1797).
- SMB1 wall-jump setup is frame-specific (hold Left 6 to 7 frames, release 1 frame, press Left; a 3 px minimum wall
  entry) and a minimum jump is a 1-frame A press (S3). This is the opposite of forgiveness and is why SMB1 tech is
  TAS-grade.
- SMB1 damage requires two consecutive frames of enemy overlap and enemy hitboxes act every other frame (S3), an
  early example of hit forgiveness.

### Inferences
- Celeste's 4 px correction on an 8 px hitbox is half a body width. The SpeedRunner equivalent is 10 u on a 20 u
  hero (or 8 u to be conservative). The 3 px wall reach is 0.375 body widths, about 7 u for SpeedRunner; today the
  wall probe is 2 u wide (K), so SpeedRunner relies on the 80 ms wall coyote instead. Both approaches work; the
  distance version also helps when you approach a wall slowly.
- SpeedRunner's buffer (130 ms, about 8 frames at 60) is long by Celeste standards and is probably why the game
  feels responsive on web with its extra input latency (see Q6). Keep it.
- Frames at 60 for the record: Celeste coyote 6 f, wall speed retention about 4 f, ceiling grace 3 f, wall-jump
  lock about 10 f; SpeedRunner coyote 6 f, buffer about 8 f, wall stick 6 f, wall coyote about 5 f, wall lock 9 f.

### Gaps
- Maddy Thorson's "Celeste forgiveness" post (the designer's own list, including the semi-solid and dash leniency
  wording) was 403 on Medium and the mirrors. Everything above comes from the code instead, which is stronger
  evidence but misses the designer's framing.
- No frame windows for Super Meat Boy or N++ forgiveness (both are believed to use small coyote windows, [U]).

---

## Q3. Momentum and speed tech

### Takeaway
Skill ceilings in the canon come from a small number of rules that compose. Celeste's whole tech tree (super,
hyper, wavedash, extended hyper) falls out of three constants (`DashSpeed 240`, `SuperJumpH 260`, `DuckSuperJumpXMult
1.25`) plus "jumping adds 40 px/s" and "speed above max decays slowly". SpeedRunner already has the slow overspeed
decay (500 u/s²) and two overspeed sources (roll, wall jump). The missing piece for a speed-tech ceiling is one
deliberate speed-gain move with a cost, and a rule that chains it.

### Cited findings
- Celeste run model (S1 lines 2884 to 2894): approach `MaxRun` at `RunAccel 1000` px/s²; if above max, approach at
  `RunReduce 400` instead. In the air both are multiplied by `AirMult 0.65`. So 0 to 90 px/s takes 90 ms on the
  ground, and speed above 90 bleeds at only 400 px/s² (260 to 90 takes 0.43 s), which is what makes hypers carry.
- Celeste jump adds `JumpHBoost 40` in the move direction (line 50), so a running jump leaves at 130 px/s.
- Celeste dash (S1 lines 75 to 84): `DashSpeed 240` for `DashTime 0.15` s, then `EndDashSpeed 160` (x0.75 if
  upward), `DashCooldown 0.2`, `DashRefillCooldown 0.1`. `DashAttackTime 0.3`.
- Celeste super jump (S1, `SuperJump()` around line 1697): jumping during a grounded horizontal dash sets `Speed.X =
  SuperJumpH 260` and `Speed.Y = JumpSpeed -105`. If ducking it becomes a hyper: `Speed.X *= 1.25` (325 px/s) and
  `Speed.Y *= 0.5`. Super wall jump: `SuperWallJumpH = 170`, `SuperWallJumpSpeed -160`, var time 0.25 s.
- Celeste `DodgeSlideSpeedMult 1.2` and `DuckFriction 500` (lines 40, 44) govern the crouch slide.
- Celeste speed is rounded to whole pixels in some paths (`Speed.X = (int)Math.Round(Speed.X)`, line 1574) and the
  engine moves actors pixel by pixel with a subpixel remainder (Thorson's physics post, not fetchable, [U]).
- Sonic (S11, Sonic Physics Guide, fetch blocked, values from memory [U]): top speed 6 px/f, acceleration
  0.046875 px/f², deceleration 0.5, friction 0.046875, jump force 6.5 px/f, gravity 0.21875, release caps upward
  speed at 4 px/f, slope factor 0.125 running, 0.3125 downhill and 0.078125 uphill while rolling, roll friction
  half of running. Rolling downhill is the only way past top speed, which is Sonic's whole momentum game.
- Super Meat Boy: almost no air friction (S8); "jump-height curving" and wall sliding are listed as advanced tactics
  by Refenes (S7 snippet).
- SpeedRunners (2013): a slide followed by a jump at its end ("slide-jump") preserves momentum better than a plain
  jump; wall jump plus grapple gives large speed gains; releasing the hook at the peak of the swing keeps the most
  speed; boosting into a grapple while falling gives more speed (S12, S13, community, low to medium authority).
- Dustforce community glossary lists dashjump, air charge, momentum cancel and wall-adjacent tricks (S14), no
  numbers.
- Neon White: reviewers describe long hang time and long jump distances that give room to react, "low floor, high
  ceiling", bullet boosts and trick jumps, and movement abilities gained by discarding cards (S15, S16). The
  developers say speedrunner feedback shaped it (S15).
- Jetpack Joyride is "a 1 button game with extremely high player engagement" per the GDC 2012 talk description (S17).

### Inferences
- Ratios that transfer: Celeste dash is 2.67x run speed for 0.15 s (36 px, 4.5 tiles, 3.3 BL); a super is 2.9x run
  speed; a hyper 3.6x. Overspeed bleed is 0.4x the ground acceleration. SpeedRunner's overspeedDecay of 500 u/s²
  is 0.19x its groundAccel (2700), so carried speed lasts even longer there (from 700 to 420 u/s takes 0.56 s).
- SpeedRunner's two overspeed sources today are the roll (keeps at least 280 u/s, which is under maxRun, so it is
  not a speed gain) and the wall jump (440 u/s, barely over 420). There is no move that puts you clearly above
  maxRun on flat ground, so there is no speed tech to learn. Candidates with the smallest code footprint: a
  Celeste-style hyper from the existing roll (roll + jump in the first 100 ms = 1.3x maxRun, lower arc), or slope
  acceleration on the existing bamboo/rock geometry (Sonic/Tiny Wings model).
- Skill ceiling without a cliff, pattern across the sources: the basic input (run, jump) completes the level; the
  advanced input is the same buttons with timing (dash then jump within 0.15 s, slide then jump at the end,
  release at the peak of the swing); the gain is 20 to 60 percent, not 200; and overspeed decays slowly so one
  trick buys several seconds. Neon White's long hang time is the same idea in 3D: more time to decide means a
  lower floor at the same ceiling.

### Gaps
- No primary Dustforce, OlliOlli, Mirror's Edge or SpeedRunners developer sources found; OlliOlli (perfect landing
  timing window) and Mirror's Edge ("flow" and speed preserved through vaults) need their own searches.
- The Sonic Physics Guide numbers must be re-verified once the site is reachable.

---

## Q4. Wall mechanics

### Takeaway
Celeste defines two separate wall systems and both are published: a passive wall slide whose speed ramps from
20 px/s to 160 px/s over 1.2 s, and an active climb with a 110 stamina budget (2.2 s of climbing, 11 s of hanging,
4 climb-jumps). SpeedRunner's wall kit (100 ms stick at 25 u/s, then 115 u/s slide, 80 ms wall coyote, two jump
variants, same-wall penalty) is already richer than most 2D runners; the one Celeste idea worth borrowing is the
slide speed ramp (fast decisions are rewarded with more height, hesitating costs it).

### Cited findings
- Celeste wall slide (S1 lines 60, 61, 2935 to 2947): `WallSlideStartMax 20` px/s; while sliding, max fall speed is
  `Lerp(MaxFall 160, 20, wallSlideTimer / WallSlideTime 1.2)`, so the slide speeds up from 20 to 160 px/s over
  1.2 s. Timer resets on ground and on every jump. Slide dust plays only while the timer is above 65 percent.
- Celeste wall jump (S1 lines 56 to 58, 1739 to 1762): `WallJumpHSpeed = MaxRun + JumpHBoost = 130` px/s away from
  the wall, `JumpSpeed -105` up, 160 ms forced horizontal, 3 px reach. Each wall jump also refunds `ClimbJumpCost`
  stamina (line 695) in one branch and costs it when climb-jumping (line 1817).
- Celeste climb (S1 lines 102 to 119): `ClimbMaxStamina 110`, `ClimbUpCost 100/2.2` per second (45.5/s), `ClimbStillCost
  100/10` per second (10/s), `ClimbJumpCost 110/4` (27.5), `ClimbTiredThreshold 20` (below it you slip at
  `ClimbSlipSpeed 30` and cannot refill dashes, line 2015), `ClimbUpSpeed -45`, `ClimbDownSpeed 80`, `ClimbHopY -120`
  / `ClimbHopX 100` when hopping over a ledge, `ClimbNoMoveTime 0.1`, `ClimbCheckDist 2`.
- Celeste `WallBooster` (lines 3093 to 3098, the Core moving-wall mechanic): boost speed -160, lift -80, accel 600,
  hop horizontal 100, over-the-top -180.
- SMB1 has an accidental wall jump that requires frame-exact setup and a 3 px wall entry (S3).
- SpeedRunners: wall jump into grapple is a standard speed line (S12).

### Inferences
- Same-wall penalty: Celeste has none in the slide/jump path (you can chain the same wall only by regrabbing and
  spending stamina), SpeedRunner uses a reduced vertical speed (330 vs 790 u/s). Celeste's equivalent limiter is
  the stamina cost of climb-jumps (4 per refill). Both solve "infinite same-wall climb". SpeedRunner's version is
  cheaper and readable, keep it.
- In body lengths: Celeste slide 1.8 to 14.5 BL/s over 1.2 s, wall jump 1.44x run speed sideways. SpeedRunner
  slide 0.54 BL/s for 100 ms then 2.5 BL/s constant, wall jump 1.05x run speed sideways, 0.95x jump speed up.
  SpeedRunner's wall jump is weak sideways and strong upward relative to Celeste, which suits its chimneys.
- The 100 ms stick (vy capped at 25 u/s) is in effect a very short version of Celeste's ramp. A ramp over 0.6 to
  1.0 s from 25 to 115 u/s would read the same and punish hesitation less abruptly.

### Gaps
- No frame data for Super Meat Boy or N++ wall slides and jumps (both are known for wall-jump chains, [U]).
- Hollow Knight's Mantis Claw numbers (slide speed, jump vector) not found.

---

## Q5. Physics-based movement feel

### Takeaway
Physics movement reads as fair when the control maps one input to one body part with no hidden state (Getting
Over It's hammer follows the cursor; Jetpack Joyride is one button; Solipskier is one finger drawing the ground),
when the simulation is deterministic, and when every failure can be traced to the player's own last input. The
cost of failure is then carried entirely by the level (no checkpoints in Getting Over It), not by the controls.

### Cited findings
- Getting Over It (S18, Lars Doucet, Game Developer, 6 Dec 2017): the hammer "follows the mouse cursor"; the
  controls are "smooth in a strange sort of way"; frustration comes from the hammer not reaching where the player
  wants, not from unexpected motion; the player always places it, even when wrongly. No checkpoints, aggressive
  autosave prevents save-scumming. Foddy's stated intent, "I created this game for a certain kind of person. To
  hurt them." The game is a homage to Jazzuo's Sexy Hiking, same cursor-following sledgehammer mechanic.
- Getting Over It (S19, Wikipedia): the game popularised "rage games" and the "Foddian" label (Jump King, Only Up!).
  The narration was first meant to be more sarcastic (S19 and S20).
- Foddy's GDC 2015 physics talk is about Super Pole Riders' pole and ball physics problems (S21), the closest
  primary physics talk; no Getting Over It postmortem found.
- Jetpack Joyride (S17, GDC 2012, Luke Muscat, "Depth in Simplicity"): a "4 week game gone catastrophically wrong",
  a 1-button game built on short casual sessions and a reward structure. One finger controls the game (S22).
- Tiny Wings' core mechanic is inspired by Nathan McCoy's Wavespark (S23); Illiger said the idea came from "hard,
  dry work" not a stroke of genius (S24).
- Happy Wheels is a 2D ragdoll physics side-scroller by Jim Bonacci whose appeal is momentum, collision and
  character-specific vehicles (S25). Trials Evolution interviews cover the difficulty curve and physics changes from
  Trials HD (S26), no numbers.
- Solipskier: only basic facts found (Mikengreg, 2010, S27). No design interview.

### Inferences
- The common property is a direct, continuous mapping with zero buffering: cursor to hammer, finger to ground
  height, touch to thrust. Discrete platformers add buffers and coyote time because their inputs are discrete.
  SpeedRunner is discrete, so Q2 applies to it and Q5 mostly applies if it ever adds a physics element (a swing, a
  rolling log, a pole). For such an element the rule is one input, one visible body, deterministic (SpeedRunner's
  fixed 120 Hz step and run-time-driven movers already give determinism, K).
- Getting Over It's "no checkpoints, progress is height" is the same cost-of-failure dial SpeedRunner turns with
  full-map restart; the difference is Getting Over It has no timer, so the loss is spatial rather than temporal.

### Gaps
- No primary Foddy talk on the hammer (the Design Notes podcast S20 and Google Design interview may hold it, not
  fetched). No Solipskier or Tiny Wings slope-physics description. No Happy Wheels or Trials physics numbers.

---

## Q6. Input and timing

### Takeaway
At 60 Hz the floor for input-to-photon latency is one frame (16.7 ms) and reviewer tiers put under 30 ms as
excellent and 45 to 60 ms as usable. SpeedRunner's 120 Hz fixed step with interpolation already halves the
simulation quantisation; the remaining latency is the browser's (input event to rAF to compositor, two to three
frames). Speedrun communities handle frame windows by capping at 60 fps and requiring an fps display, which is a
real argument for keeping the simulation fixed and showing it.

### Cited findings
- "Fix Your Timestep" (S28, Glenn Fiedler): accumulate real time, run fixed ticks, render by blending the previous
  and current state with the leftover fraction; cap the accumulator to avoid the spiral of death (S29, S30).
  SpeedRunner implements exactly this with DT 1/120 and a 0.1 s clamp (K).
- Input in a fixed timestep (S31, Jakub Tomšů): how to feed edge-triggered input into fixed ticks so presses are
  not lost between ticks. SpeedRunner's one-shot `jumpPressed` flag consumed by the next step is this pattern (K).
- Latency tiers (S32, Tom's Hardware, one reviewer's experience): under 30 ms input-to-photon excellent, 30 to 45
  great, 45 to 60 usable. A 60 Hz display sets a floor around 16.67 ms (S33). A dev blog claims 40 ms is the
  threshold most players cannot perceive below, unsourced (S34). Measurement methods: high-speed camera frame
  counting, or NVIDIA FrameView / Intel PresentMon (S34, S35, libretro's method of 25 samples per case, S36).
- Speedrun.com rule examples: a community required a 60 fps cap and an on-screen fps display (S37); tricks that
  only work in an fps range are why runners cap (S38).
- SMB1 frame windows (S3): minimum jump 1 frame, wall jump setup 6 to 7 frames held then 1 frame released, the
  21-frame framerule.
- Game Feel (Swink): the book's "real-time control" definition is quoted in an academic paper (S39); secondary
  sources disagree on the threshold, one gives 100 ms as where control breaks (S40), another gives 240 ms as the
  cutoff for real-time control with 100 ms where lag starts to show (S41). Swink's own articles (S42, S43) carry
  the framework without the number.

### Inferences
- SpeedRunner at 120 Hz: a press is consumed within 8.3 ms of arriving; at 60 fps rendering with interpolation, the
  visible response is one render frame later (16.7 ms) plus browser compositing. Expect 35 to 60 ms end to end on
  a 60 Hz monitor, which is in the "great to usable" band. There is no code change that beats the monitor, so
  the 130 ms jump buffer and 100 ms coyote are the right levers and are already generous.
- "Restart latency" belongs to movement feel because it is the same loop: press, see result. Death to control is
  about 3.4 s (K) against an input latency budget measured in tens of ms; the countdown dominates everything else
  in this file. (Agent 08 covers the fix; the number is recorded here because players perceive it as "the game
  feels slow".)
- Frame windows in a 120 Hz game: a "frame-perfect" trick is a 8.3 ms window, which is tighter than any 60 fps
  canon game. Any tech SpeedRunner adds should be specified in ms and checked to be at least 2 to 3 render frames
  (33 to 50 ms) wide, otherwise it will be inconsistent across 60, 120 and 144 Hz displays.

### Gaps
- No peer-reviewed latency perception study surfaced (the Jota et al. "How fast is fast enough" dragging study and
  the Ivkovic et al. game latency studies exist, [U], not fetched). Swink's threshold needs the book itself.
- Gamepad vs keyboard for platformers: no source gathered this session.

---

## Q7. Reference implementations

### Takeaway
The best open reference is Celeste's `Player.cs` itself (5471 lines, MIT-licensed repo NoelFB/Celeste, S1). For the
"design the jump from height and time" method, Kyle Pittman's GDC 2016 talk (S44) and the GMTK Platformer Toolkit
(S45) are the two teaching references; the kinematics are two lines.

### Cited findings
- Celeste Player class published by Matt Thorson and Noel Berry, about 5400 lines of C# covering input, movement
  and states (S46, S47).
- Kyle Pittman, "Math for Game Programmers: Building a Better Jump", GDC 2016 (S44): build jump trajectories from
  "designer-friendly input like desired height and distance", with variants for variable height and faster
  falling after the peak.
- GMTK Platformer Toolkit (S45): interactive essay with over 30 movement variables (max speed, jump height, squash
  and stretch, coyote time, air acceleration, air control, air brake), v1.1 June 2022, Unity character controller
  scripts downloadable (11 kB), licence not stated, additional code credited to Tarodev and others.
- Fukuchi's JumpLab (S48): a browser lab for jump settings (jumpVelocity and friends).
- "Physics for Game Dev, a platformer physics cheatsheet" (S49, Medium) relates height, time and gravity.
- Game Developer, "Platformer controls: how to avoid limpness and rigidity" (S50) cites Super Meat Boy as
  jump-centric with mid-air jump cut essential.
- "2D Platformer Controls" (S51, Medium) and Juicy Beast's Toto Temple Deluxe platforming series (S8) are
  practitioner write-ups of the same constants.
- Tyler Glaiel, "How to make your game run at 60fps" (S52) and the "golden 4.8537 ms" fixed step article (S53) are
  the two practical fixed-step references besides S28.

### Inferences
- Kinematics for a designer-facing jump (standard, used by S44 and S49): given apex height h and time to apex t,
  g = 2h/t² and v0 = 2h/t. Check against SpeedRunner: h 138 u, t 0.332 s gives g 2504 and v0 831, i.e. the current
  constants were chosen (or happen to be) at h = 3 BL and t = 1/3 s. A tunable `jumpHeightBL` and `apexMs` pair
  would let playtesters change feel without touching gravity.
- Godot and Phaser: not fetched this session; both ship CharacterBody2D / Arcade Physics platformer demos but they
  carry no canon numbers of their own, so they rank below S1 and S45 as references.

### Gaps
- Pittman's slides (the vault page only has the description). Godot/Phaser demos not fetched.

---

## Candidate technique profiles

| # | Name | One line | Games | Key numbers |
|---|---|---|---|---|
| T1 | Designer-facing jump (height, apex time) | Derive g and v0 from h and t; g = 2h/t², v0 = 2h/t | Pittman GDC 2016, GMTK toolkit, SpeedRunner implicitly | SR h 3.0 BL, t 332 ms; Celeste 3.5 tiles, 361 ms; SMB1 4.2 blocks, 444 ms |
| T2 | Fall gravity multiplier vs hold-pinned jump | Two ways to get a snappy fall | SMB1 (x3.5), SpeedRunner (x1.65), Celeste (x1.0 with 0.2 s pinned launch speed) | Celeste VarJumpTime 0.2 s, SR fallMult 1.65 |
| T3 | Apex hang (half gravity near apex while held) | Gravity x0.5 inside a speed band | Celeste, SpeedRunner | Celeste band 40 px/s x0.5; SR 90 u/s x0.55; adds about 30 ms of apex |
| T4 | Jump cut | Release shortens the jump | Mega Man (instant), Sonic (cap at 4 px/f), SR (vy x0.45), Celeste (timer to 0) | SR min jump 0.6 BL; Celeste min about 1 tile |
| T5 | Coyote time | Jump allowed after leaving a ledge | Celeste 0.1 s, SR 0.10 s | 6 frames at 60 |
| T6 | Jump buffer | Early press kept until grounded | SR 0.13 s; Celeste (Input.cs, unverified) | SR about 8 frames at 60 |
| T7 | Corner correction | Nudge sideways up to N px instead of bonking | Celeste 4 px up and dash, 4 px duck | SR candidate 8 to 10 u (half body width) |
| T8 | Wall reach and wall speed retention | Wall jump from a few px away; keep speed 60 ms after hitting a wall | Celeste 3 px, 0.06 s; SR wallCoyote 0.08 s | |
| T9 | Ceiling grace on variable jump | Bonk in the first 50 ms does not cancel the hold | Celeste 0.05 s | |
| T10 | Wall slide speed ramp | Slide speed lerps from slow to terminal over 1.2 s | Celeste 20 to 160 px/s; SR stick 25 u/s for 0.1 s then 115 | SR candidate ramp 25 to 115 over 0.6 to 1.0 s |
| T11 | Climb stamina | 110 units, 2.2 s up, 11 s still, 4 climb-jumps, slip below 20 | Celeste | |
| T12 | Same-wall penalty | Less height on repeated same-wall jumps | SR 330 vs 790 u/s | Celeste uses stamina instead |
| T13 | Slow overspeed decay | Speed above max bleeds slowly so tech carries | Celeste RunReduce 400 (0.4x accel); SR 500 (0.19x accel) | 260 to 90 px/s in 0.43 s |
| T14 | Dash with cooldown | Fixed-speed burst, refilled on ground | Celeste 240 px/s, 0.15 s, 0.2 s cooldown, 36 px | 2.67x run speed, 4.5 tiles |
| T15 | Super / hyper (dash-jump) | Jump during grounded dash: 260 px/s; ducking 325 px/s with half height | Celeste | 2.9x and 3.6x run speed |
| T16 | Slide-jump momentum carry | Jump at the end of a slide keeps more speed | SpeedRunners (2013), Celeste dodge slide x1.2 | SR candidate: roll + jump |
| T17 | Slope momentum (roll) | Only slopes exceed top speed | Sonic (slope factors 0.125 / 0.3125 / 0.078125, [U]), Tiny Wings, Solipskier | |
| T18 | Jump horizontal boost | Jumping adds speed in the input direction | Celeste JumpHBoost 40 (1.44x run on leaving ground) | |
| T19 | Lift boost from movers | Inherit platform velocity on jump, capped | Celeste -130 up / 250 side | SR movers give no extra speed today (K) |
| T20 | One input, one body (physics feel) | Direct continuous mapping, no hidden state, deterministic | Getting Over It, Jetpack Joyride, Solipskier | Getting Over It: no checkpoints |
| T21 | Fixed step with interpolation and consumed one-shot input | Deterministic sim, smooth render, no lost presses | Fiedler, Tomšů, SpeedRunner 1/120 s | 60 Hz floor 16.7 ms; under 30 ms excellent |
| T22 | Frame-window spec in ms | Define every tech window in ms, at least 33 to 50 ms wide | speedrun.com fps caps, SMB1 1-frame jump | 120 Hz frame = 8.3 ms |

---

## Sources

1. Celeste `Player.cs`, NoelFB/Celeste on GitHub (constants lines 23 to 138, hitbox line 263, SuperJump about line 1697, wall slide lines 2935 to 2952). https://github.com/NoelFB/Celeste/blob/master/Source/Player/Player.cs (raw: https://raw.githubusercontent.com/NoelFB/Celeste/master/Source/Player/Player.cs)
2. Data Crystal, Super Mario Bros.: Notes (vertical physics RAM and gravity values). https://datacrystal.tcrf.net/wiki/Super_Mario_Bros.:Notes
3. TASVideos, Super Mario Bros. game resources (subpixels, 21-frame rule, wall jump setup, minimal jump). https://tasvideos.org/GameResources/NES/SuperMarioBros
4. Hypertextbook, "Acceleration due to gravity: Super Mario Brothers" (2007). https://hypertextbook.com/facts/2007/mariogravity.shtml
5. N community forum, "The importance of math and science in N" (frame measurements). https://forum.droni.es/viewtopic.php?p=46097
6. Critical Points, "5 games 5 jumps" (18 May 2015). https://critpoints.net/2015/05/18/5-games-5-jumps/
7. Tommy Refenes 2013 Game Developer blog on Super Meat Boy controls (snippet only; URL not resolved this session). Lead: https://www.gamedeveloper.com/
8. Juicy Beast, "The making of Toto Temple Deluxe: platforming part 1" (12 Feb 2014). https://juicybeast.com/2014/02/12/the-making-of-toto-temple-deluxe-platforming-part-1/
9. Speedrun.com, Hollow Knight Any% NMG text guide. https://www.speedrun.com/hollowknight/guide/j234z
10. Byron Fong, University of Rochester, Super Mario Odyssey essay (triple jump, wall jump). https://ivc.lib.rochester.edu/?p=7376
11. Sonic Physics Guide (Jumping, Running). Blocked by Anubis this session. https://info.sonicretro.org/SPG:Jumping and https://info.sonicretro.org/SPG:Running
12. SpeedRunners items and mechanics (fan page, low authority). https://shapes.inc/fandom/speedrunners/items-and-mechanics
13. r/SpeedRunnersGame, "New and need tips" (6 Nov 2023). https://redlib.hbubli.cc/r/SpeedRunnersGame/comments/17pgfdc/new_and_need_tips
14. r/dustforce wiki, mechanics, tricks and terminology. https://axebps-redlib.hf.space/r/dustforce/wiki/terms
15. GamesRadar, "Neon White's slick gameplay was influenced by speedrunners". https://gamesradar.com/neon-whites-slick-gameplay-was-influenced-by-speedrunners
16. Slant Magazine, Neon White review. https://slantmagazine.com/games/neon-white-review
17. GDC Vault, "Depth in Simplicity: The Making of Jetpack Joyride", Luke Muscat, GDC 2012. https://www.gdcvault.com/play/1015527/
18. Lars Doucet, "Pain, difficulty, and Getting Over It", Game Developer, 6 Dec 2017. https://www.gamedeveloper.com/design/pain-difficulty-and-getting-over-it
19. Wikipedia, Getting Over It with Bennett Foddy. https://en.wikipedia.org/wiki/Getting_Over_It_with_Bennett_Foddy
20. Design Notes podcast, Bennett Foddy (13 Mar 2018). https://designnotes.libsyn.com/bennett-foddy
21. Game Developer, "Video: the physics of proper pole control in Super Pole Riders" (Foddy GDC 2015). https://gamedeveloper.com/design/video-the-physics-of-proper-pole-control-in-i-super-pole-riders-i-
22. O'Reilly, Swipe This!, "Game design spotlight 4: Jetpack Joyride". https://www.oreilly.com/library/view/swipe-this-the/9781119940531/19_9781119940531-pp08.ef.html
23. Wikipedia, Tiny Wings. https://en.wikipedia.org/wiki/Tiny_Wings
24. Kill Screen, Andreas Illiger interview. https://killscreen.com/one-andreas-illiger
25. Vice, "Severed limbs and slam-dunked toddlers: an interview with the creator of Happy Wheels". https://www.vice.com/en/article/severed-limbs-and-slam-dunked-toddlers-an-interview-with-the-creator-of-happy-wheels
26. PC Invasion, Trials Evolution interview with Antti Ilvessuo. https://www.pcinvasion.com/?p=11741
27. Wikipedia, Solipskier. https://en.wikipedia.org/wiki/Solipskier
28. Glenn Fiedler, "Fix Your Timestep". https://gafferongames.com/post/fix_your_timestep/
29. GameDev.net blog, "Thoughts on fix your timestep and the spiral of death". https://www.gamedev.net/blogs/entry/2262574-thoughts-on-fix-your-timestep-and-the-spiral-of-death
30. GameDev.net forum, "Fix your timestep" thread. https://gamedev.net/forums/topic/691776-fix-your-timestep
31. Jakub Tomšů, "Input in fixed timestep". https://jakubtomsu.github.io/posts/input_in_fixed_timestep
32. Tom's Hardware, "Input latency is the all-too-frequently missing piece of framegen analysis". https://www.tomshardware.com/pc-components/gpus/input-latency-is-the-all-too-frequently-missing-piece-of-framegen-enhanced-gaming-performance-analysis
33. Emulation General Wiki, Input lag. https://emulation.gametechwiki.com/index.php/Input_lag
34. Bugnet, "How to measure input latency in your game". https://bugnet.io/blog/how-to-measure-input-latency-in-your-game
35. RTINGS, input lag test method. https://www.rtings.com/projector/tests/inputs/input-lag
36. Libretro forums, "An input lag investigation". https://forums.libretro.com/t/an-input-lag-investigation/4407/588
37. Speedrun.com, "[RULE UPDATE] Framerate cap of 60 required". https://speedrun.com/posts/tgzr2
38. Speedrun.com, "60 FPS vs variable/high framerate". https://www.speedrun.com/posts/ch2ib
39. arXiv 2011.09201 (quotes Swink's definition of game feel). https://arxiv.org/pdf/2011.09201
40. Wayline, "Art of input buffering" (100 ms claim, secondary). https://www.wayline.io/blog/art-of-input-buffering
41. r/GameDevelopment Game Feel book club post (240 ms claim, secondary). https://redlib.hackliberty.org/r/GameDevelopment/comments/1kg51wo/better_game_design_with_a_book_club_game_feel
42. Steve Swink, "Game Feel: The Secret Ingredient", Gamasutra. https://GamaSutra.com/design/game-feel-the-secret-ingredient
43. Steve Swink, "Principles of Virtual Sensation", Game Developer. https://www.gamedeveloper.com/design/principles-of-virtual-sensation
44. GDC Vault, Kyle Pittman, "Math for Game Programmers: Building a Better Jump", GDC 2016. https://www.gdcvault.com/play/1023559/Math-for-Game-Programmers-Building
45. Game Maker's Toolkit, Platformer Toolkit (v1.1 June 2022). https://gmtk.itch.io/platformer-toolkit
46. 80.lv, "Celeste's movement code available on GitHub". https://80.lv/articles/celestes-movement-code-available-on-github
47. notapixel, "Celeste: open-source Player class" devlog. https://notapixel.itch.io/platformer-test/devlog/729893/celeste-open-source-player-class
48. Fukuchi, JumpLab jump settings. https://fukuchi.org/works/jumplab/settings-jump.html.en
49. brazmogu, "Physics for game dev, a platformer physics cheatsheet", Medium. https://medium.com/@brazmogu/physics-for-game-dev-a-platformer-physics-cheatsheet-f34b09064558
50. Game Developer, "Platformer controls: how to avoid limpness and rigidity feelings". https://gamedeveloper.com/design/platformer-controls-how-to-avoid-limpness-and-rigidity-feelings
51. Medium, "2D Platformer Controls". https://medium.com/developing-developers/2d-platformer-controls-2af59b243808
52. Tyler Glaiel, "How to make your game run at 60fps", Medium. https://medium.com/@tglaiel/how-to-make-your-game-run-at-60fps-24c61210fe75
53. Game Developer, "Fixing your time step the easy way with the golden 4.8537 ms". https://www.gamedeveloper.com/programming/fixing-your-time-step-the-easy-way-with-the-golden-4-8537-ms-
54. Maddy Thorson, "Celeste and TowerFall physics" (403 this session). https://maddythorson.medium.com/celeste-and-towerfall-physics-56fdd6a9fff6
55. Maddy Thorson, "Celeste forgiveness" (403 this session). https://maddythorson.medium.com/celeste-forgiveness-31e4a40399f1
