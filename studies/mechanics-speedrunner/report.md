# SpeedRunner mechanics: movement, animation, elements, enemies, maps, curves and the race, from the games that did it best

**Kingsfoil Studios · Research study · November 2026**

---

## Context

This is study #1 of the **Game mechanics** series in our library [S1]. The Curves series gave us the vocabulary for difficulty (sawtooth, skill atom, teach-test-twist, cost of failure, time to retry) [S4], and Combat juice gave us hitstop, shake and WebAudio voices [S5]. This study covers the whole mechanical kit of one Kingsfoil game, SpeedRunner, and asks one question. What made the kits of games like ours feel great, and which of those techniques should SpeedRunner adopt, in what order?

SpeedRunner today is a single-file Canvas2D JavaScript game of about 115 KB, served from Vercel with one `/api/lb` function [K]. Pick a map, wait through a 3-2-1 countdown, run left to right to the flag. Any death restarts the whole map after 0.38 s and another 3 s countdown, so death to control is about 3.4 s [K]. The movement kit is complete: a 1/120 s step with interpolation, 420 u/s, a 3.0 BL jump with a cut and an apex hang at 0.55 gravity, 1.65 fall gravity, 100 ms coyote, a 130 ms buffer, a wall slide at 115 u/s after a 100 ms stick, two wall jumps, a roll after a 230 u fall [K]. The hero is a procedurally posed 20x46 u stick samurai in black ink on white paper with one red [K]. There are four maps and a locked card, four split-only checkpoints per map, a 30 Hz local ghost (about 100 KB per minute as JSON by the build's own estimate; the figures and the Sandbox measure the same format at 139 to 144 KB), a 3.7 s duel against it at the flag, a per-map board paged by 7, seasons, a device-token name claim and a sanity check rejecting runs under 6 s; no enemies, items, springs, timed blocks, touch, gamepad, friends board or telemetry beyond starts and finishes [K].

The user asked for "smooth and great mechanics" from Getting Over It, Doodle Jump, Jetpack Joyride, Solipskier, LittleBigPlanet, Cat Mario (Syobon Action), Fall Guys, Super Mario Maker and Ultimate Chicken Horse, in seven areas. Animations, elements, enemies, movement, map design, difficulty curve and social mechanics. We added three the game needs and the user did not name. Race infrastructure (timers, splits, ghosts, replays, restart, validation), camera, feedback and audio, and controls (keyboard, gamepad, touch). We extended the list with the structural twins that publish numbers: Celeste, Super Meat Boy, N and N++, Trackmania, Neon White, VVVVVV, Canabalt, SpeedRunners and Dustforce.

This is the first study of a new series and a new format, `mechanics-playable`. The run was unattended, so the series name and the format were chosen without asking. The user confirms both on the pull request.

**Five equal priorities.**
- **Feel.** How good a technique is in the hands at 60 fps rendering over a 120 Hz step. Timing in ms and physics steps, heights in body lengths.
- **Readability.** How fast a player understands it on first sight, at 420 u/s, in black ink on white paper.
- **Run fit.** How well it serves a restart-heavy, deterministic, time-attack game with a leaderboard and a ghost.
- **Cheapness.** What it costs a five-person collective writing hand-rolled Canvas2D JavaScript with no engine and no budget for middleware.
- **Evidence.** How strong the sources are. Source code or a designer statement scores 5, community consensus 3, a single post 1.

**Targets.**
- The live game at `speedrunner-tau.vercel.app` [S2], desktop browser with keyboard today, phones later.
- World units u, 1 body length (BL) = 46 u, a 970x545 u view, ground at y 600, fixed step 1/120 s.
- A reader who can open the Sandbox [S3], play the recommended kit, and switch each technique off to feel what it does.

**Sources.** Fourteen research notes, a verification note and the SpeedRunner Mechanics Sandbox [S3]. The hardest numbers come from source code: Celeste's published `Player.cs`, the SMB1 disassembly, the nclone N++ reimplementation, livesplit-core, the Mario Kart Wii ghost format, the dustmaker replay schema and SpeedRunner's own served bundle. Every Sandbox number comes from a JavaScript prototype, not from the game.

---

## 1. Executive summary

**Movement and controls.**

1. **The jump already sits in the canon; the gap is corner correction.** SpeedRunner's jump reaches 138 u = 3.0 BL with the apex at 332 ms analytic and 350 ms stepped with the band, Celeste's 28 px = 3.5 tiles = 2.5 BL at 361 ms, SMB1's about 67 px = 4.2 blocks at 444 ms, and coyote time is 100 ms in Celeste and SpeedRunner against N++'s 83 ms [K; V, S7, S10, S12; I]. Celeste nudges the player up to 4 px sideways (half a body width) instead of bonking a ceiling corner; SpeedRunner has no corner correction and we settle 8 u, about 0.4 body widths [V, S7; I].
2. **There is no speed tech to learn.** Celeste's tech tree falls out of three constants plus overspeed decaying at 400 px/s²; SpeedRunner's 500 u/s² decay (0.19x its ground acceleration) carries nothing because its roll keeps 280 u/s, under the 420 u/s cap [V, S7; K; I]. A roll-jump hyper at 1.3x maxRun inside the first 100 ms of a roll is the smallest addition that creates a ceiling [I].
3. **A phone build is a different game.** Super Mario Run, Super Meat Boy Forever, Jetpack Joyride and Geometry Dash all dropped an input axis and auto-ran, so SpeedRunner's touch mode is auto-run plus tap-to-jump with its own map ids and board [V, S91, S76, S74; I]. Browser latency is 50 to 200 ms keypress to photon on laptops, so the 120 Hz step and the 130 ms buffer are the right levers [V, S126; I].

**Animation, camera and feedback.**

4. **Three procedural layers beat frames.** Celeste stretches to (0.6, 1.4) on every jump, squashes toward (1.6, 0.4) by fall speed, recovers at 1.75 scale units per second, and bursts 4 dust on a jump and 8 on a landing only at half of max fall [V, S7]. SpeedRunner's rig blends 10 angles with a 38 ms constant and a 160/14 kimono spring and lacks the stretch, the gated landing and foot planting [K; I].
5. **The camera is right and one rule is missing.** A hard horizontal lock with a 120 u look-ahead is the Super Meat Boy and Celeste choice; shipped forward focus sits at 15 to 25% of the view, SpeedRunner's at 12% [K; V, S59, S7]. Celeste clamps the camera so a killbox never enters the view (`camera.Y <= killbox.Top - 180`); SpeedRunner needs the same, since terminal fall crosses the 545 u view in 0.47 s [V, S7; K; I].

**Elements and enemies.**

6. **Every good element has a clock and a pre-animation.** Celeste's spring launches at 185 px/s against a 105 px/s jump (1.76x) with auto-jump semantics, and Mega Man's appearing blocks run a 5-tick loop of about 1 s per tick with 2 ticks visible [V, S7, S159]. SpeedRunner's movers already run on run time, and we settle a 1.45x spring and a 0.5 s block tick [K; I].
7. **Enemies belong only as deterministic route tools.** A Goomba walks at 1/5 of Mario's run speed and a kicked shell at 1.2x, N's chase drone doubles its speed on sight, Dustforce attacks never cost forward speed, and Shovel Knight's drop bounce gives about 4.5 tiles [V, S9, S160, S206, S93]. A clock patroller at 85 u/s, a bounce enemy that returns a full jump and a 100 ms slash that never clamps vx fit SpeedRunner; health bars and RNG do not [I].

**Map design and difficulty.**

8. **The maps are the right length and lack a ladder.** Trackmania caps Weekly Shorts at a 20 s author time, Neon White levels run "often under 30 seconds", Mario Maker settled on the 20 s minimum timer, and SpeedRunner's maps are 10.9 to 20.7 s of flat running [V, S25, S66, S175; K]. Trackmania's default medals are gold 1.06x, silver 1.2x and bronze 1.5x of the author time, and about 29% of finishers on one Cup of the Day map had gold or better [V, S34, S177, S176].
9. **Restart cost is the whole excess.** McMillen's rule is "the penalty is how much time it takes to start playing again"; Super Meat Boy, Celeste, N++, VVVVVV and Trackmania restart under about 1 s, Hollow Knight waits a hard-coded 2.85 s [V, S57, S209, S13; I]. SpeedRunner's 3.4 s is the 3 s countdown, 13% of a session at one death per 20 s, and the Sandbox's in-place reset takes 0.1 to 0.2 ms against 3,400 ms for the countdown replay [K; I; V, S3].
10. **Trolls are a one-time comedy.** Syobon Action, IWBTG and kaizo wrote the same fairness rule: the surprise is allowed once, then the level must be readable with the answer visible [V, S88, S89, S151]. On a leaderboard the surprise is a memory item after the first death, so SAMURAI TRIAL should be honest kaizo with jokes only in the lobby [I].

**Social and the race.**

11. **A five-player board is a feed, not a ranking.** Trackmania layers world, continent, country and region ladders under a 3-month season board, and Neon White hides friend times until you have run the level [V, S26, S31, S66]. With 5 names the top-7 page never pages; show the date, the delta since the previous holder and a "rival beaten" line [K; I].
12. **Inputs are the right ghost format.** SpeedRunner stores about 100 KB per minute as JSON by its own low estimate, 139 to 144 KB measured, while a Mario Kart Wii ghost is a fixed 10,240 bytes of run-length inputs for a 2 to 3 minute race, Dustforce stores 11 intent streams plus a drift fix every 8 frames, and Trackmania stores inputs with timestamps at 100 Hz [K; V, S14, S15, S169]. SpeedRunner's input log is 1 byte per step, 7.2 KB per minute raw and about 1 KB deflated, and the Sandbox's input log came to 110 bytes run-length encoded for 2,148 steps (about 369 bytes per minute) against 143.8 KB per minute for a 30 Hz full-pose JSON track, 35.5 KB delta-quantised, and 3.8 KB for a 15 Hz position track [I; V, S3].
13. **Re-simulation is the only strong check.** Neon White's boards filled with 0.06 s times within days, and Nadeo's 2021 sweep of over 400,000 records traced most cheats to 10 logins after the community found steering spikes of 9 to 19 per second against a 3 per second baseline [V, S173, S171, S169]. A deterministic 120 Hz step makes server re-simulation cheap if `Math.sin` leaves the mover code, and the Sandbox re-simulated 2,098 to 2,148 recorded inputs in about 6.7 ms with PASS at 120 Hz, 60 Hz and the "SpeedRunner today" preset [I; V, S124, S125, S3].
14. **The timer should count steps.** Celeste stores time as 100 ns ticks per fixed frame and its IGT does not change at 61 fps [V, S17, S167]. Store the integer step count with its DT, and show two decimals during the run and three on the board [I].
15. **Live ghosts need almost no bandwidth.** A 10 byte state at 10 Hz is 100 B/s per racer; Cloudflare's free Durable Objects tier bills incoming messages 20:1 and covers about 3,000 two-player races a day, Supabase's free tier allows 200 connections [V, vendor, S41, S42; I]. Vercel Functions serve WebSockets in public beta as of July 2026, pinned to one instance and closing at the function's max duration [V, vendor, S40].

**Recommendation for SpeedRunner** [I]. Drop the countdown on death and on `R`, start the timer and the level clock on the first input, and keep the 0.38 s death beat skippable. Add corner correction (8 u), a wall reach (7 u) and a roll-jump hyper. Record inputs at 1 byte per step as the canonical ghost, re-simulate on the server, and keep a 15 Hz position track for the duel. Put four medal times on every map at 1.06x, 1.2x and 1.5x of a recorded author run. Add one spring, one timed block cycle and one one-way switch per map, all on the level clock, each with a 150 to 300 ms pre-animation. Add a clock patroller, a bounce enemy and a 100 ms slash that never slows the hero, and save the lethal self-shadow chaser for SAMURAI TRIAL. Make the friends board the default view with a season column over a permanent board. Ship a one-thumb touch mode as its own game. Build a seeded daily map from 30 to 40 hand-authored chunks proved by a headless bot. §7 has the layers, §8 the Sandbox, §13 the ranked backlog.

**The top five of the backlog, one sentence each** [I]. Instant restart with the timer on first input removes 3 s from every one of the hundreds of attempts a hard map takes. Corner correction removes the most common unfair death in a jump-heavy game for about 20 lines of code. An input log with server re-simulation gives a 1 KB ghost, a share link and the only anti-cheat that works, in one change. A friends and around-me board with a rival toast turns five names into a reason to open the game. A medal ladder per map gives a first-clear player a target that is not a friend's time.

---

## 2. How to read this study

| Tag | Meaning |
|---|---|
| **[V]** | Verified in a source our researchers read: code, docs, wiki or article. "[V, vendor]" and "[V, self-reported]" mark figures reported by their own authors. |
| **[I]** | Author inference or design proposal. Untested unless it says "Sandbox", and then tested only in our JavaScript prototype. |
| **[U]** | Unverified: memory, a search snippet, a single secondary source, or a page that could not be fetched. Treat it as a lead. |
| **[K]** | Kingsfoil fact read from SpeedRunner's served bundle on 13 Nov 2026 (`notes/01-current-build.md`). |

- [S#] refers to §14. "[I, note 0X]" is an inference made by the researcher in that note.
- Ratings (1 to 5) are author judgement, in this order: **Feel · Readability · Run fit · Cheapness · Evidence**.
- **Feel** is how good it is in the hands at 60 fps rendering over a 120 Hz physics step. **Readability** is how fast a player understands it on first sight. **Run fit** is how well it serves a restart-heavy, deterministic time attack with a leaderboard and a ghost. **Cheapness** is the cost for a five-person team in hand-written Canvas2D JavaScript. **Evidence** is the strength of the sources. Telemetry, code or a designer statement scores 5, community consensus 3, a single post 1.
- Units are world units u. The hero is 20x46 u, so 1 body length (BL) = 46 u. The view is 970x545 u at 1280x720 and zoom 1.32. Frames are at 60 fps unless stated. Physics steps are at 120 Hz, 8.33 ms each.
- Published values are converted to body lengths so they compare. Celeste's Madeline has an 8x11 px hitbox on 8 px tiles, so 1 BL = 11 px and 1 tile = 0.73 BL. Small Mario is 16 px tall on 16 px blocks, so 1 BL = 1 block. N++'s ninja has a 10 px radius on 24 px tiles. Celeste runs at 60 fps with speeds in px/s.
- "Death to control" is the time from the killing contact to the first step that reads input again. "Author time" is a recorded developer run on the intended route, not the world record.

---

## 3. Generations: a timeline

**Gen 1: the 8-bit canon (1983–1990)**
- **1983** Mario Bros. shakes the screen on a hit, the earliest camera shake Keren found [V, S59]. **1985** Super Mario Bros. moves in 16 subpixels per pixel, walks a Goomba at 0.5 px/frame against Mario's 2.5 px/frame run, rounds level ends to a 21-frame rule, and samples enemy contact at 30 Hz [V, S9, S11].
- **1985** Mario's jump reads about 4.2 blocks high with fall gravity about 3.5x rise gravity, and a one-frame A press is the minimum jump [V, S10, S11; I]. **1987** Mega Man's Appearing Blocks run a fixed pattern of about 1 s per tick [V, S159].

**Gen 2: Flash and indie precision (2004–2010)**
- **2004** N (Metanet) starts a 90 s timer and adds 2 s per gold, with five drone types on surface-following patterns [V, S160]. **Feb 2007** Syobon Action ships four stages of betrayed Mario conventions; its first stage took three days [V, S143]. **2007** I Wanna Be the Guy and Kaizo Mario World formalise honest impossible difficulty [V, S150, S151].
- **2008** LittleBigPlanet makes a physics-first platformer whose floaty jump players complained about for six years [V, S80, S81]. **2009** Canabalt generates buildings from the current speed, with a max gap of two thirds of horizontal speed and a jump hold capped at 0.35 s [V, S77].
- **2010** Super Meat Boy ships "almost instantaneous" respawns and over 150 light and 150 dark levels [V, S57]. **2010** VVVVVV spreads checkpoints across single screens with zero-time restarts [V, S209]. **Aug 2010** Solipskier lets the finger draw the slope and previews the next gate's altitude at the right edge [V, S141].

**Gen 3: the mobile runners (2009–2016)**
- **2009** Doodle Jump pairs each new power-up with one new hazard and shows other players' heights as live markers [V, S79]. **Sep 2011** Jetpack Joyride ships as a one-button game with three hazard families and three visible missions [V, S140, S75].
- **2013** Geometry Dash is tap-to-jump with autoscroll [U]. **2016** Super Mario Run is built around one hand, tap to jump and hold for height, in portrait [V, S91]. **2020** Super Meat Boy Forever cuts Meat Boy to two buttons, jump and slide, then **Apr 2023** reaches phones at 0.99 [V, S76].

**Gen 4: makers, parties and ghosts (2008–2020)**
- **2008** Mario Kart Wii downloads rival and friend ghosts and gates unlocks on beating staff ghosts [V, S158]. **2013** SpeedRunners races four players on one screen and eliminates whoever falls off its edge [V, S152]. **Aug 2013** Spelunky's Daily Challenge gives everyone the same seed, one attempt and its own board [V, S86, S208].
- **Sep 2015** Super Mario Maker requires makers to clear a course before uploading it [V, S51]. **Nov 2015** its update adds the Checkpoint Flag, up to 2 per course [V, S155]. **Mar 2016** Ultimate Chicken Horse scores no points when everyone or nobody finishes [V, S146].
- **Jul 2020** Trackmania's first 3-month seasonal campaign, 25 maps and 100 medals, with Cup of the Day on a daily track [V, S26, S27]. **Aug 2020** Fall Guys ships 60-player shows whose designer wants losing to feel "like it was your fault" [V, S144, S83]. **Oct 2020** Super Mario Bros. 35 mails your stomped enemies to another player's course [V, S157].

**Gen 5: modern precision, race plumbing and trust (2015–2026)**
- **2015** N++ ships about 1,000 levels in a 5x20 grid rated on an 8-step scale, with 20 episodes open at a time [V, S63]. **Jan 2018** Celeste ships 100 ms coyote time, 4 px corner correction, a 0.2 s pinned jump and an Assist Mode, and later publishes `Player.cs` under MIT [V, S7, S8, S70].
- **Jun 2019** Super Mario Maker 2, then **Dec 2019** Ninji Speedruns against other players' ghosts and **Apr 2020** World Maker [V, S156, S145]. **May 2021** Nadeo sweeps over 400,000 Trackmania records after replay analysis exposes slowdown cheats [V, S171, S169].
- **Jun 2022** Neon White launches with Bronze, Silver, Gold, Ace and hidden Red medals set from dev ghosts with injected hesitation, and its boards fill with 0.06 s cheats within days [V, S66, S173]. **Mar 2024** Team 0% clears the last uncleared Super Mario Maker course before the **Apr 2024** Wii U shutdown [V, S147].
- **Mar 2025** Trackmania caps Weekly Shorts at a 20 s author time [V, S25, S55]. **Jan 2026** Cup of the Week documents its knockout counts [V, S33]. **May 2026** Ultimate Chicken Horse's tenth-anniversary update adds a falling block and a dance mover [V, S23, S56]. **Jul 2026** Vercel documents WebSockets in Functions as a public beta [V, vendor, S40]. **Nov 2026** this study and its Sandbox [S3].

---
## 4. Technique profiles

There are eight families:

- **A.** Movement and controls
- **B.** Animation, camera and feedback
- **C.** Elements
- **D.** Enemies
- **E.** Map design
- **F.** Difficulty curve
- **G.** Social
- **H.** Race infrastructure

A to G are the seven areas the user named, with camera, feedback, audio and controls folded into A and B; H is the area the study added, because timers, ghosts, replays and validation are the social mechanics of a time attack. Each profile ends with ratings for **Feel · Readability · Run fit · Cheapness · Evidence** (1 = poor, 5 = excellent; author judgement) and maps its finding onto SpeedRunner's constants [K] in "How it feels" or "Risks".

### Family A: Movement and controls

### A1. The jump from height and apex time: variable height, jump cut and the apex hang

*In plain words.* Pick the jump's height and time to apex, derive gravity and launch speed, and let an early release shorten the jump.

*How it works (technical).*
- g = 2h/t² and v0 = 2h/t [V, S60]; SpeedRunner's constants solve to h = 138 u and t = 332 ms, so `gravity 2500` and `jumpVel 830` sit at 3.0 BL and a third of a second [K; I].
- Celeste pins `Speed.Y` at 105 px/s for up to `VarJumpTime 0.2` s then applies `Gravity 900` both ways, 1 tile minimum to 3.5 tiles (28 px, 2.5 BL) held, apex at 361 ms [V, S7; I]. SpeedRunner multiplies vy by `jumpCut 0.45`, a 0.6 BL minimum at 150 ms [K; I]. SMB1's minimum is a 1-frame A press, with 0x30 rising against 0xA8 falling gravity, near 3.5 [V, S10, S11].
- Apex hang. Celeste halves gravity while |vy| < 40 px/s with jump held; SpeedRunner uses 0.55 inside 90 u/s of the apex, about 30 ms of extra hang analytic and about 25 ms stepped at 1/120 s (350 ms against 325 ms, the stepped apex 3 to 4 u under the analytic 138 u) [V, S7; K; I].

*Cost / performance.* Two constants and a flag.

*Games that used it.*
- Celeste (`VarJumpTime`, `HalfGravThreshold`): https://github.com/NoelFB/Celeste/blob/master/Source/Player/Player.cs
- Super Mario Bros. (hold-dependent gravity): https://datacrystal.tcrf.net/wiki/Super_Mario_Bros.:Notes
- Kyle Pittman, Building a Better Jump: https://www.gdcvault.com/play/1023559/Math-for-Game-Programmers-Building

*How it feels.* The measurable jumps converge on an apex at 330 to 450 ms, 0.6 s in the air and 2.5 to 4.2 BL, so SpeedRunner's numbers need no change [V, S7, S10; K; I]. Expose a `jumpHeightBL` and `apexMs` pair so playtesters tune feel without touching gravity [I].

*Risks.* LittleBigPlanet's ragdoll jump was called floaty for six years until Sumo said "It has been addressed" [V, S80, S81]. A time-attack jump must be a designed constant.

*Ratings 1–5 (author judgement):* Feel 5 · Readability 5 · Run fit 5 · Cheapness 5 · Evidence 5

### A2. Forgiveness: coyote time, jump buffer, corner correction and wall grace

*In plain words.* Accept presses a few frames early or late and bodies a few units off, so the player blames the level, not the controls.

*How it works (technical).*
- Table 6b holds the windows: coyote 83 to 100 ms across Celeste (`JumpGraceTime 0.1`), N++ (5 frames) and SpeedRunner (12 steps); buffers from Hollow Knight's 40 ms (`JUMP_QUEUE_STEPS = 2` at 50 Hz) to SpeedRunner's 130 ms; Celeste's buffer sits in `Input.cs` [V, S7, S12, S13; K; U].
- Corner correction. Celeste `UpwardCornerCorrection 4` px tries 1 to 4 px sideways before cancelling a jump into a ceiling, `DashCornerCorrection 4` in both axes, half a body width on an 8 px hitbox [V, S7]. For a 20 u hero that is 8 to 10 u; we settle 8 u, upward and onto ledge tops [I].
- Wall grace. Celeste `WallJumpCheckDist 3` px, `WallSpeedRetentionTime 0.06` s, `CeilingVarJumpGrace 0.05` s [V, S7]; Super Meat Boy added "about 1/20 of a second" after leaving a wall [V, S201]; SpeedRunner uses an 80 ms wall coyote and a 2 u probe [K]; N++ nudges the ninja by the jump impulse for one frame [V, S12; I].

*Cost / performance.* About 20 lines for corner correction. No render cost.

*Games that used it.*
- Celeste (grace, corner correction, wall reach): https://github.com/NoelFB/Celeste/blob/master/Source/Player/Player.cs
- N++ (nclone, 5-frame buffers): https://github.com/SimonV42/nclone/blob/master/nsim.py
- Super Meat Boy (1/20 s wall grace): https://www.scribd.com/document/624520952/paper-248-1

*How it feels.* Three unrelated games put their grace windows within 17 ms of each other, 83 to 100 ms, so SpeedRunner's need no tuning [V, S7, S12; K]. Corner correction is the one visible omission; one-way roof tiles pass from below, so the case that stops a runner dead at 420 u/s is the sideways one, running onto the next tile whose top sits a few units higher, and that lip reads as a controls failure [I].

*Risks.* Longer grace reads as floaty. At 120 Hz a frame-perfect trick is 8.3 ms, so new tech should be specified in ms and kept at least 33 to 50 ms wide [I].

*Ratings 1–5 (author judgement):* Feel 5 · Readability 4 · Run fit 5 · Cheapness 5 · Evidence 5

### A3. Momentum and air control: fall gravity, slow overspeed decay, jump boost and lift boost

*In plain words.* Overspeed bleeds slowly, the fall is heavier than the rise, and jumping off a mover keeps its push.

*How it works (technical).*
- Celeste approaches `MaxRun 90` at `RunAccel 1000` px/s² but bleeds overspeed at `RunReduce 400`, so 260 px/s falls to 90 in 0.43 s; air control is x`AirMult 0.65` [V, S7]. SpeedRunner's `overspeedDecay 500` u/s² is 0.19x its `groundAccel 2700`, so 700 u/s lasts 0.56 s; 0 to maxRun takes 156 ms analytic and 19 steps (158 ms) stepped, maxRun to 0 at `groundFric 3000` takes 140 ms analytic and 17 steps [K; I].
- Celeste adds `JumpHBoost 40` px/s per jump (a running jump leaves at 130 px/s, 1.44x run) and mover velocity capped at 130 up and 250 sideways; SpeedRunner adds neither [V, S7; K].
- Fall gravity: SpeedRunner x1.65 (4125 u/s², max fall 1150 u/s = 25 BL/s), SMB1 about x3.5, Celeste x1.0 with the pinned launch; both fall from the apex in 0.26 s [K; V, S10, S7; I]. Super Meat Boy has almost no air friction [V, S97]; Canabalt steps acceleration 50, 30, 20, 10 px/s² as speed rises [V, S77].

*Cost / performance.* Constants only.

*Games that used it.*
- Celeste (`RunReduce`, `JumpHBoost`, `LiftBoost`): https://github.com/NoelFB/Celeste/blob/master/Source/Player/Player.cs
- Super Meat Boy (air friction): https://juicybeast.com/2014/02/12/the-making-of-toto-temple-deluxe-platforming-part-1/
- Canabalt (speed-stepped acceleration 50/30/20/10): https://gamedeveloper.com/design/tuning-canabalt

*How it feels.* Slow decay is what makes a trick worth learning [I]. Add a capped lift boost (about 250 u/s sideways, 130 up) and a 40 u/s jump boost so a running jump reads faster than a standing one [I].

*Risks.* A lift boost makes every mover a speed source, so test the m4 maze with the cap, and a jump boost re-derives the body-length table (E4) [I].

*Ratings 1–5 (author judgement):* Feel 4 · Readability 3 · Run fit 5 · Cheapness 5 · Evidence 5

### A4. The wall kit: stick, slide ramp, two wall jumps and the same-wall penalty

*In plain words.* A wall holds you briefly, then you slide faster; a jump pushes away or climbs; the same wall twice gives less.

*How it works (technical).*
- Celeste's slide cap lerps from `WallSlideStartMax 20` px/s to `MaxFall 160` over `WallSlideTime 1.2` s, dust only in the first 35% [V, S7]. SpeedRunner caps vy at 25 u/s for `wallStick 0.10` s, then 115 u/s (2.5 BL/s) [K].
- Celeste's wall jump leaves at 130 px/s sideways and 105 up with a 160 ms lock (1.44x run sideways); SpeedRunner's at 440/790 u/s with a 150 ms lock (1.05x run), or 190 u/s sideways with more height when holding in, and `wallJumpSameY 330` on a repeat [V, S7; K; I].
- Celeste limits same-wall chains with stamina (`ClimbMaxStamina 110`, 45.5 per second climbing, 10 hanging, 27.5 per climb-jump, slipping below 20); SpeedRunner's reduced height does it in one constant [V, S7; K; I]. N++ leaves a wall at 60 px/s out and 84 up (54 degrees) with a 5-frame wall buffer [V, S12; I].

*Cost / performance.* Constants and one timer.

*Games that used it.*
- Celeste (slide ramp, stamina): https://github.com/NoelFB/Celeste/blob/master/Source/Player/Player.cs
- N++ (wall jump vectors): https://github.com/SimonV42/nclone/blob/master/nsim.py
- Super Meat Boy (wall as a glass ceiling): https://maryrosecook.com/blog/post/deft-and-intuitive-player-character-movement-in-a-2d-platformer

*How it feels.* SpeedRunner's kit is richer than most 2D runners and its strong-up weak-out jump suits its chimneys [K; I]. The one Celeste idea worth a toggle is the ramp, 25 to 115 u/s over 0.8 s, which punishes hesitation less abruptly than a 100 ms stick and a cliff [I].

*Risks.* The 150 to 160 ms locks stop a wall jump cancelling into the same wall; shorten them and chimneys become ladders [I].

*Ratings 1–5 (author judgement):* Feel 5 · Readability 4 · Run fit 5 · Cheapness 4 · Evidence 5

### A5. Speed tech: the roll-jump hyper, the slide-jump, the dash, and the one-input body

*In plain words.* One deliberate move with a cost that puts the player above top speed, with a rule that lets it chain. Physics games get their feel from one input moving one visible body.

*How it works (technical).*
- Celeste's tech tree is three constants, `DashSpeed 240` for 0.15 s (36 px, 4.5 tiles), `SuperJumpH 260` on a jump during a grounded dash, x1.25 (325 px/s) with half height when ducking; a dash is 2.67x run speed, a super 2.9x, a hyper 3.6x [V, S7; I]. SpeedRunners players report a slide-jump keeps more momentum [U]; Dustforce lists dash-jumps and air charges [V, S206].
- SpeedRunner's overspeed sources are the roll (at least 280 u/s, under maxRun) and the wall jump (440 u/s), so nothing on flat ground exceeds 420 u/s [K; I]. A roll-jump hyper, a jump in the first 100 ms of a roll leaving at 1.3x maxRun (546 u/s) with a lower arc at 0.75 x jumpVel (622 u/s, the figures' value, a design proposal), is carried by the 500 u/s² decay for about 0.25 s; across the canon the gain is 20 to 60%, never 200% [I].
- One input, one body. Getting Over It's hammer "follows the mouse cursor" with no hidden state [V, S71]; Jetpack Joyride is "a 1 button game" [V, S74]; Solipskier's finger draws the slope, the skier speeds up over time and the music cuts to wind [V, S141].

*Cost / performance.* One flag and a timer. A physics element is a small verlet body, deterministic at 120 Hz.

*Games that used it.*
- Celeste (dash, super, hyper): https://github.com/NoelFB/Celeste/blob/master/Source/Player/Player.cs
- SpeedRunners (slide-jump, community): https://en.wikipedia.org/wiki/SpeedRunners
- Getting Over It (cursor hammer): https://www.gamedeveloper.com/design/pain-difficulty-and-getting-over-it
- Solipskier (drawn slope): https://en.wikipedia.org/wiki/Solipskier

*How it feels.* A hyper is the moment a player learns the game has a second floor. The roll already exists after a 230 u fall, so the hyper costs no new input and reuses the 0.42 s roll window [K; I].

*Risks.* Too much overspeed breaks every gap in E4. Getting Over It's loss model does not transfer, because SpeedRunner's cost is the clock [V, S71; I].

*Ratings 1–5 (author judgement):* Feel 5 · Readability 3 · Run fit 5 · Cheapness 4 · Evidence 4

### A6. Controls: step-aligned input, gamepad, rebinding and a one-thumb touch mode

*In plain words.* Read keys once per step, treat a gamepad as another key source, and build the phone version as a one-thumb game.

*How it works (technical).*
- Fixed step with consumed one-shot input, as SpeedRunner already does with `DT 1/120`, a 0.1 s clamp and `jumpPressed` [V, S120, S121; K]. Keypress to photon is 50 to 200 ms on laptops with about 2.5 frames in the display pipeline, Chrome budgets 50 ms per key, and SpeedRunner's own share is at most 8.3 ms of interpolation plus 0 to 8.3 ms to the next step, so expect 60 to 80 ms at 60 Hz with a floor near 40 [V, S126, S49; K; I].
- Gamepad. Poll `navigator.getGamepads()` per step, d-pad at buttons 12 to 15, bottom face button 0, stick x past ±0.5 as direction; Firefox hides pads until touched [V, S46; I]. speedrun.com disallows turbo by default and calls one button to many inputs a macro, so store `{action: [codes]}` by `KeyboardEvent.code` [V, S128, S207; I].
- Touch. Miyamoto built Super Mario Run so "you don't have to swipe up", hold for height, portrait [V, S91]. Super Meat Boy Forever is two buttons, jump and slide [V, S76]. Jetpack Joyride is one finger [V, S74]. Chrome 32 removed the 300 to 350 ms tap delay for `width=device-width` pages; use `pointerdown` [V, S48]. `navigator.vibrate()` is missing in Safari [V, S47]; device touch latency is 70 to 120 ms [V, S126].

*Cost / performance.* A gamepad reader is 30 lines. A one-thumb mode is a design project.

*Games that used it.*
- Super Mario Run (one hand, tap and hold): https://www.shacknews.com/article/96686/shigeru-miyamoto-on-super-mario-run-were-not-just-making-a-simple-or-easy-mario-game
- Super Meat Boy Forever (two buttons): https://www.pcgamesinsider.biz/indie-interview/66238/we-wanted-it-to-have-two-buttons-and-still-feel-and-play-like-super-meat-boy/
- Jetpack Joyride (one button): https://www.gdcvault.com/play/1015527/
- Doodle Jump (tilt and tap): https://en.wikipedia.org/wiki/Doodle_Jump

*How it feels.* Every shipped mobile platformer with a clock gave up an input axis [V, S91, S76, S74]. SpeedRunner's one-thumb mode is auto-run at 420 u/s, tap jumps with the 0.45 cut, hold through the apex band, a tap on a wall as a wall jump, with its own map ids and board and `inputDevice` on submit [K; I].

*Risks.* Tilt (Doodle Jump) adds about 100 ms of filter latency and swipes register after 50 to 150 px, so both are late inputs for wall flips [I].

*Ratings 1–5 (author judgement):* Feel 4 · Readability 4 · Run fit 4 · Cheapness 3 · Evidence 4

### Family B: Animation, camera and feedback

### B1. The procedural rig: two poses, a 38 ms blend, foot planting and springs

*In plain words.* The character is a few angles chasing a target pose, a two-pose cycle, springs for cloth, and a planted foot.

*How it works (technical).*
- Overgrowth animates everything from "13 keyframes in total" [V, S61]; Rain World's slugcat is two spherical chunks at a fixed distance with code-driven limbs, "a bunch of points in space" [V, S62].
- SpeedRunner blends hip, lean and eight limb angles with `1 - exp(-26·dt)` (38 ms), advances the run phase `|vx|·dt·0.042` (a stride per 150 u, 2.8 per second at top speed) and springs the kimono at stiffness 160, damping 14, ratio 0.55 [K; I]. Celeste's `1 - pow(0.01, dt)` is a 217 ms constant, right for a camera and 6x too slow for limbs [V, S7; I]. SMB1's walk cycle runs 5, 3 or 2 frames per step, a full cycle in 250, 150 or 100 ms [V, S10].
- Foot planting is two `atan2` calls per leg with the foot locked during the stance half; a critically damped spring step (Juckett) is stable at any dt [V, S122; I].

*Cost / performance.* Ten angles and a spring per frame, render only.

*Games that used it.*
- Overgrowth (Rosen, GDC 2014): https://gdcvault.com/play/1020583/Animation-Bootcamp-An-Indie-Approach
- Rain World (GDC 2016): https://www.youtube.com/watch?v=sVntwsrjNe4
- Super Mario Bros. (speed-driven frame delay): https://datacrystal.tcrf.net/wiki/Super_Mario_Bros./RAM_map

*How it feels.* A stick figure reads at 9 BL/s when the torso leans 10 to 18 degrees into velocity, the trailing leg smears to 1.5x on lift-off and the arms never cross the torso at the apex [I]. SpeedRunner lacks foot planting, a 2 to 4 u `sin(2·phase)` bob and the same spring on the sheath [K; I].

*Risks.* Wind-up frames cost 2 to 4 frames of latency; lerp smoothing lags fast bodies (Keren), so keep the 38 ms constant [V, S59; I].

*Ratings 1–5 (author judgement):* Feel 4 · Readability 4 · Run fit 4 · Cheapness 4 · Evidence 3

### B2. Squash, stretch, gated dust, trails and the death burst

*In plain words.* Stretch on take-off, squash by fall speed, dust only where it means something, after-images at speed, a short death burst.

*How it works (technical).*
- Celeste sets `Sprite.Scale = (0.6, 1.4)` on every jump; on landing `squish = min(Speed.Y / FastMaxFall 240, 1)` scales toward (1.6, 0.4), about (1.4, 0.6) at 160 px/s, recovering at 1.75 scale units per second (229 ms from 1.4, 343 ms from 0.4) [V, S7].
- Celeste bursts 4 dust on a jump, 4 on a wall jump, 8 on a landing only when `Speed.Y >= MaxFall / 2`, 1 every 10 ms in the first 35% of a slide, an after-image every 80 ms on a dash (19 px apart at 240 px/s), and flashes the hair white for 120 ms on a dash-count change (red, blue, pink by dashes) [V, S7]. SpeedRunner spawns 7 on a jump, 9 on a wall jump, 6 on any landing over 50 u, 10 on a roll, 1 per 90 ms over 260 u/s and 22 on death [K].
- Celeste's death swaps in a dead body with a 0.6 s revive; Super Meat Boy keeps the body on screen and replays 40-plus attempts at once; Katana ZERO freezes the action while particles keep running [V, S7, S57, S96]. Combat juice has the hitstop and shake profiles [S5].

*Cost / performance.* One `ctx.scale` about the feet, a particle pool, a pose ring buffer; under 0.2 ms [I].

*Games that used it.*
- Celeste (scale, dust gates, trail, hair): https://github.com/NoelFB/Celeste/blob/master/Source/Player/Player.cs
- Super Meat Boy (death stays on screen, replay pile): https://www.gamedeveloper.com/game-platforms/-i-super-meat-boy-i-s-mcmillen-explains-why-so-hard-
- Katana ZERO (hit-stop, particles keep running): https://gmtk.substack.com/p/how-to-make-a-good-2d-camera

*How it feels.* Stretch sells the jump with zero latency because it lands on the step the jump fires [I]. Add the (0.6, 1.4) stretch, scale the 130 ms squash by `min(vy / maxFall, 1)` toward (1.4, 0.6), gate landing dust on vy >= 575 u/s, half of maxFall, which at 4125 u/s² of fall gravity is a 40 u (0.87 BL) drop, so it swaps the 50 u distance rule for a speed rule rather than tightening it (a 2 BL drop lands at about 870 u/s, the gate to pick if dust should mark only big landings), flash the kimono for 120 ms when roll or wall coyote becomes available, and ragdoll the 10 angles for 0.3 s on death [K; I].

*Risks.* Dust on every hop is noise, and any freeze or flash over about two frames reads as lag while a timer runs [I].

*Ratings 1–5 (author judgement):* Feel 5 · Readability 4 · Run fit 4 · Cheapness 5 · Evidence 5

### B3. Camera: a hard horizontal lock with look-ahead, platform snap, a killbox clamp and zones

*In plain words.* Lock sideways with a little look-ahead, move vertically only on a new landing, keep the kill line off screen, let the level set offsets.

*How it works (technical).*
- Keren's taxonomy names SpeedRunner's camera, position lock with a static forward focus and platform snapping with a dead zone [V, S59; K]. Defender focuses about 25% ahead, SMB pushes from about 25% off centre, Celeste's red bubble adds 48 px (15% of 320); SpeedRunner's 120 u is 12% [V, S59, S7; K].
- Celeste targets the player minus (160, 90) plus a per-room `CameraOffset`, smooths with `1 - pow(0.01, dt)` and clamps `camera.Y <= killbox.Top - 180` [V, S7]. SpeedRunner's vertical reference updates on landing or wall slide, moves on climbs only after 60 u, lerps at 5 per second (9 on walls) and clamps to `top` and `floorView` [K]. DKC Tropical Freeze, Rayman Legends, Shovel Knight and Hollow Knight each pick one rule [V, S96]; Sonic looks up 104 px and down 88 at 2 px per step [U].
- 621 u (13.5 BL, 1.48 s) is visible ahead, 6x the 105 u a 250 ms reaction needs; vertically, terminal fall crosses the 545 u view in 0.47 s and 250 ms is 288 u [K; I].

*Cost / performance.* Two lerps and three clamps.

*Games that used it.*
- Itay Keren, Scroll Back (taxonomy): https://www.gamedeveloper.com/design/scroll-back-the-theory-and-practice-of-cameras-in-side-scrollers
- Celeste (`CameraOffset`, killbox clamp): https://github.com/NoelFB/Celeste/blob/master/Source/Player/Player.cs
- Super Meat Boy, DKC, Rayman Legends (GMTK survey): https://gmtk.substack.com/p/how-to-make-a-good-2d-camera

*How it feels.* A hard lock is right when the view is crossed in 2.3 s [K; I]. Worth a toggle: a forward focus from 120 u to about 200 u (20% of view) at overspeed, a downward look-ahead of vy x 0.25 s capped at 200 u, and camera zones `[x, y, w, h, offsetX, offsetY]` for the m4 roof maze and the m3 climbs [I].

*Risks.* A window camera cannot keep up with a body at its own max speed [V, S96]; a `deathY` clamp must not fight the `floorView` clamp [K; I].

*Ratings 1–5 (author judgement):* Feel 4 · Readability 5 · Run fit 5 · Cheapness 5 · Evidence 4

### B4. Synth audio: pitch jitter, footsteps as cadence, and music that never stops

*In plain words.* Every sound is synthesised and varied a little, tied to the rig; the music survives deaths and thins at speed.

*How it works (technical).*
- SpeedRunner's voices: jump 420 to 760 Hz triangle 90 ms, wall jump square plus noise, land noise 80 ms, roll noise 220 ms, die sawtooth 300 to 70 Hz over 300 ms, checkpoint 880 to 1320 Hz sine 120 ms, finish arpeggio 523, 659, 784, 1046 Hz at 80 ms, countdown beeps, slash and sheath [K]. jsfxr (Unlicense) is the sfxr vocabulary and ZzFX (MIT) a 20-parameter vector per sound in about 1 KB [V, S110, S111].
- McMillen's brief: "the action never stop, even when the player was killed" [V, S57]. A critic notes Celeste's music runs through deaths [U]. Solipskier drops the music to wind when the skier loses the headphones at speed [V, S141].

*Cost / performance.* An oscillator and a gain per voice, a cap of 8.

*Games that used it.*
- Super Meat Boy (action never stops): https://www.gamedeveloper.com/game-platforms/-i-super-meat-boy-i-s-mcmillen-explains-why-so-hard-
- Solipskier (music cuts to wind): https://en.wikipedia.org/wiki/Solipskier
- Celeste (FMOD project public): https://gamedeveloper.com/audio/-i-celeste-s-i-audio-files-are-now-publicly-available-for-devs
- jsfxr: https://github.com/chr15m/jsfxr

*How it feels.* Randomise base frequency ±4% (about 0.7 semitone) on jump, land and footsteps and keep checkpoint and finish fixed; fire a 20 ms noise burst per foot plant, 10% lower when overspeed; never restart the track on death or `R`; duck to one note for the 3.7 s duel [K; I].

*Risks.* The Super Meat Boy music detail is consensus around a statement about action (Evidence 3). Footsteps at 5.6 per second need the voice cap [I].

*Ratings 1–5 (author judgement):* Feel 4 · Readability 3 · Run fit 5 · Cheapness 5 · Evidence 3

### B5. UI motion: countdown digits, split deltas, results bars and an input display

*In plain words.* Timer, deltas and results use the colours and timings runners read, every number tweens, an input strip shows what the simulation saw.

*How it works (technical).*
- LiveSplit shows splits against the personal best and Sum of Best as the sum of golds; green ahead, red behind, gold a best segment, and gold overrides because it describes the segment [V, S106, S186, S187]. Neon White shows the next medal time and hides friend times until you have run the level [V, S69, S66]. Celeste's hair flashes white for 0.12 s on a state change [V, S7].
- NohBoard is the default overlay, speedrun.com ships a Celeste starter kit, CelesteTAS shows inputs per frame [V, S119; U]. SpeedRunner shows the delta against `pbSplits` and green minus, red plus on the results [K].

*Cost / performance.* Rectangles and text; one `fillRect` per key per frame.

*Games that used it.*
- LiveSplit (components, colours): https://livesplit.org/components/
- Neon White (next medal on the board): https://www.gonintendo.com/contents/6282-neon-white-dev-discusses-how-the-game-s-leaderboards-came-to-be
- NohBoard (input display): https://github.com/ThoNohT/NohBoard

*How it feels.* Show the delta for 1.5 s then fade, slide digits over 100 ms, gold a section that beat its best regardless of the run, scale countdown digits 1.4 to 1 over 150 ms, play results bars in under 1 s with a 60 ms stagger, tick the death counter with a 120 ms flash, and draw four 24 px glyphs (left, right, jump, R) from the `keys` map after the step with a 120 ms release fade [K; I].

*Risks.* A running HUD holds one delta at a time; the input strip is a cheat tool only if recorded into the ghost (H2) [I].

*Ratings 1–5 (author judgement):* Feel 3 · Readability 5 · Run fit 5 · Cheapness 5 · Evidence 3

### Family C: Elements

### C1. Springs and side boosters: 1.45x the jump with auto-jump semantics

*In plain words.* A pad that throws you higher or further than a jump, squashed before it fires, with no jump cut afterwards.

*How it works (technical).*
- Celeste's spring sets `Speed.Y = -185` against a 105 px/s jump (1.76x speed, about 3.1x height), zeroes X, sets `varJumpTimer 0.2` and `AutoJump`, scales to (0.5, 1.5); the side spring gives 240 px/s sideways and 140 up with 0.3 s forced movement, a bumper 200 px/s, the Launched state 280 px/s; springs refill the dash [V, S7, S161].
- At SpeedRunner's scale 1.5x `jumpVel` is 1245 u/s and a 310 u apex (6.7 BL), 1.76x is 1460 u/s and 426 u (9.3 BL); we settle 1.45x (1204 u/s, 290 u = 6.3 BL) with the apex band and no cut [K; I]. A 600 u/s side boost bleeds to 420 in 0.36 s (about 180 u) unless a 0.3 s launched flag holds it [K; I]. LittleBigPlanet's bounce pads and Doodle Jump's springs and trampolines are the same tool [U; V, S79].

*Cost / performance.* A one-way tile with a launch vector and a 150 ms compressed frame.

*Games that used it.*
- Celeste (`SuperBounce`, `SideBounce`, `PointBounce`): https://github.com/NoelFB/Celeste/blob/master/Source/Player/Player.cs
- Doodle Jump (springs, trampolines, jetpacks): https://en.wikipedia.org/wiki/Doodle_Jump
- Celeste speedrun wiki (springs refill dash): https://cc-wiki.duckdns.org/wiki/Spring

*How it feels.* A spring is the cheapest "whoa" and the cleanest route tool [I]. A faint target line above it telegraphs the launch, Solipskier's gate preview in a different coat [V, S141; I].

*Risks.* A 6 BL launch leaves the 545 u view without a camera zone (B3); without auto-jump players cut the spring by reflex [I].

*Ratings 1–5 (author judgement):* Feel 5 · Readability 5 · Run fit 4 · Cheapness 5 · Evidence 5

### C2. Elements on the level clock: one-way tiles, movers, wheels, timed blocks, switches and the record format

*In plain words.* Everything that moves or changes state reads the run clock, and each element is one record with a period, a phase and a link.

*How it works (technical).*
- SpeedRunner's roof tiles and movers are landable from above when `vy > 0` within 3 u of the top; m4 runs three movers at 2.6 to 3.2 s and three wheels of radius 92 u with 4 tiles at 3.6 to 4.2 s, all on run time [K].
- Mega Man's Appearing Blocks run a 5-tick loop of about 1 s per tick, 2 ticks visible, one sequence number per block [V, S159]; at 420 u/s a 1 s tick covers 9 BL, so we settle a 0.5 s tick on a 4-tick cycle with a 0.3 s pre-shake [I]. Mario Maker 2's Donut Blocks fall after a stand timer and its On/Off switches drive the 20-second trend; Ultimate Chicken Horse added about 7 blocks per major update from 2017 to 2026 [V, S156, S175, S23].
- Super Mario Maker's `.cdt` is 86,016 bytes with 2,600 objects of 32 bytes and a link id each; an SMM2 course of 0x5BFD bytes gzips to about 3 KB [V, S18, S19, S20]. SpeedRunner's `[x, y, w, h, tag]` gains a sixth slot, `{period, phase, dir, link}` [K; I].

*Cost / performance.* One integer phase per element and a `t -> state` function per type.

*Games that used it.*
- Mega Man (Appearing Blocks): https://megaman.fandom.com/wiki/Appearing_Block
- Super Mario Maker 2 (terrain parts, On/Off): https://www.mariowiki.com/Super_Mario_Maker_2
- Ultimate Chicken Horse (changelog of blocks): https://www.cleverendeavourgames.com/changelog
- Super Mario Maker (.cdt format): https://wiiubrew.org/wiki/Cdt

*How it feels.* A timed block is a metronome learned in one death [I]. The cheapest additions are a timed hazard and a switch that opens a shortcut door, with the level clock starting on the first input (H4) [K; I].

*Risks.* UCH's bug notes (saws glued to movers, blowers through their own platform) show how block systems break; add one element at a time [V, S23; I].

*Ratings 1–5 (author judgement):* Feel 4 · Readability 4 · Run fit 5 · Cheapness 4 · Evidence 4

### C3. Hazards and telegraphs: spikes, saws, pre-shakes and the 1 s warning rule

*In plain words.* A hazard has a fixed silhouette, a pre-animation and a drawn range; anything closing faster than the runner gets a warning a second ahead.

*How it works (technical).*
- Jetpack Joyride's zappers are static, its missiles come with an icon and a siren, its lasers charge up and are "very predictable" [V, S75, S140]. Solipskier previews the next gate's altitude and distance at the right edge [V, S141]. Fall Guys' obstacles read "from afar" [V, S82, S83]. Trackmania requires "jumps must be clear, with the landing visible" [V, S25].
- Celeste's spring squashes, Mario's Donut Block shakes, Mega Man's block sparkles, Kevin shakes before charging, 150 to 300 ms of warning each [V, S7, S156, S159; I]. SpeedRunner's spikes are 16 u tall and inset 4 u per side [K].
- The view shows 621 u ahead (1.48 s), so a hazard closing at more than about 200 u/s (420 + 201 u/s eats 621 u in a second) is visible for under 1 s and needs a cue 420 u ahead or must be learnable; no floor spike within 300 u of a landing not visible from the ledge (288 u at the 1150 u/s fall) [K; I].

*Cost / performance.* One idle animation, one pre-animation and one synth voice per type.

*Games that used it.*
- Jetpack Joyride (zapper, missile, laser): https://adriancrook.com/?p=4709
- Solipskier (next-gate preview): https://en.wikipedia.org/wiki/Solipskier
- Fall Guys (obstacles first): https://gamedeveloper.com/design/q-a-designing-for-seasons-in-bumbling-platform-royale-i-fall-guys-i-
- Trackmania Weekly Shorts (landing visible): https://doc.trackmania.com/create/map-review/weekly-shorts-guidelines/

*How it feels.* A hazard read from afar makes death the player's fault, which Juul's players rated highest [V, S212]. With black, white and one red on the kimono, keep death black, make the sawtooth the only hazard silhouette drawn 1 u wider than its hitbox, and give helpers the accent [K; I].

*Risks.* Trolls break the pre-animation rule on purpose (F3); Syobon Action's dropping clouds and flying blocks are the anti-pattern, and a surprise death costs 3.4 s plus the section [V, S143; K; I].

*Ratings 1–5 (author judgement):* Feel 4 · Readability 5 · Run fit 5 · Cheapness 5 · Evidence 4

### C4. Collectibles as route choice: time currency, or off the record

*In plain words.* A pickup pays in seconds, so the detour is a bet, or stays off the timed route on a second board.

*How it works (technical).*
- N starts a 90 s timer and adds 2 s per gold; N++ carries leftover time across an episode's 5 levels [V, S160, S63]. A 1 s pickup pays only if the detour costs under 420 u (9 BL) [I].
- Celeste has 202 strawberries (175 red, 26 golden, 1 moon), optional and off the record [V, S70; U]. Dustforce grades Finesse and Completion separately for an S/S key [V, S94]. Jetpack Joyride's spin token is one spin or 100 coins, with three live missions [V, S140, S75]. Super Mario Bros. 35 pays 2 to 5 s per stomp on a 400 s cap [V, S157]. LittleBigPlanet's score bubbles chain and its race gates score inversely to time [U]. Mario Maker speedrun courses are pure time at the 20 s minimum [V, S175, S174].

*Cost / performance.* One pickup type and an integer on the results.

*Games that used it.*
- N (gold adds 2 s): https://n.fandom.com/wiki/Timer
- Celeste (strawberries off the record): https://www.vice.com/en/article/celeste-difficulty-assist-mode
- Dustforce (two grades): https://gamedeveloper.com/design/speed-cleaning-an-analysis-of-dustforce
- Jetpack Joyride (spin tokens, missions): https://en.wikipedia.org/wiki/Jetpack_Joyride

*How it feels.* N's model creates the risk-reward line the brief asked for; Celeste's is cheaper and safer [I]. A middle path is an "all berries" column and a "clean" grade (no deaths, or all grass cut), with the bonus route recorded in the ghost [K; I].

*Risks.* A time bonus compares two routes on one board; tune the 1 s against the 420 u detour or it is mandatory or ignored [I].

*Ratings 1–5 (author judgement):* Feel 3 · Readability 4 · Run fit 4 · Cheapness 5 · Evidence 4

### C5. Checkpoints: splits only, respawn, or Trackmania's both

*In plain words.* A checkpoint marks a split, respawns the player, or both; keep splits for the record and offer respawn as unranked practice.

*How it works (technical).*
- Respawn: Super Mario Maker since 4 Nov 2015, up to 2 per course, one per area, with a course clearable from its checkpoint before upload; Celeste every room; VVVVVV several per screen [V, S155, S209]. Split only: SpeedRunner's 4 per map, Trackmania's checkpoint times [K; U]. Trackmania mixes both, Backspace respawns with the timer running, Delete gives up, a double press stands still, and a plugin times no-respawn runs [V, S194, S54, S35]. Super Meat Boy and N++ have none and keep levels short [V, S57, S63].
- Respawn at the last split would cut SpeedRunner's retry cost per section to about a quarter of the map [K; I].

*Cost / performance.* One saved position per checkpoint and a flag.

*Games that used it.*
- Trackmania (respawn with timer running): https://steamcommunity.com/app/228760/discussions/2/2961642818658406421
- Super Mario Maker (Checkpoint Flag, 2 per course): https://www.mariowiki.com/Checkpoint_Flag
- VVVVVV (liberal checkpoints): https://boingboing.net/2010/01/13/get-this-flipping-ou.html

*How it feels.* A checkpoint chime ends each skill atom (F2) [I]. Add "respawn at last checkpoint" with the timer running and the run unsubmittable, said before the run starts, speedrun.com's rule against Save-and-Quit retries [V, S162; I].

*Risks.* A fixed penalty (plus 3 s) keeps one board; a category keeps records pure; Trackmania chose lost time and its community built no-respawn tooling [V, S35; I].

*Ratings 1–5 (author judgement):* Feel 3 · Readability 4 · Run fit 5 · Cheapness 4 · Evidence 4

### Family D: Enemies

### D1. Clock patrollers and lenient contact

*In plain words.* An enemy whose position is a function of the level clock, slow enough to read, with a hitbox smaller than its art.

*How it works (technical).*
- SMB1 walks a Goomba at 0.5 px/frame (30 px/s, 1.9 BL/s) against Mario's 2.5, 0.75 in the second quest; a Bullet Bill 1.5, a kicked shell 3.0 (1.2x run) [V, S9]. Hitboxes are 10x12 or 12x12 px in a 16x16 cell; contact is sampled at 30 Hz and damage needs two consecutive frames [V, S9, S11].
- N's zap drones follow six surface patterns, Rayman Legends places enemies on the beat, Jetpack Joyride's scientists are props [V, S160, S101, S75]. At 420 u/s a Goomba-class patroller walks at 85 u/s (1.8 BL/s) and crosses a 2-tile gap in 1.1 s; a 3 u inset and 2 consecutive steps (16.7 ms) copy SMB's leniency [I].

*Cost / performance.* One AABB on a `t -> x` path.

*Games that used it.*
- Super Mario Bros. (speed table, hitboxes, 30 Hz contact): https://6502disassembly.com/nes-smb/SuperMarioBros.html
- N (drones on patterns): https://n.fandom.com/wiki/Zap_and_Chase_drones
- Rayman Legends (enemies on the beat): https://gamedeveloper.com/audio/the-musical-box-27-game-music-level-design

*How it feels.* A slow clock enemy is a timing puzzle solved once and played by rhythm; SMB runners route around frame-exact spawns [V, S164]. The Sandbox settles 85 u/s, a 3 u inset and the two-step rule [I].

*Risks.* Any RNG enemy breaks the 30 Hz duel both ways, and seeded-per-attempt RNG diverges once timing changes the consumer order [K; I].

*Ratings 1–5 (author judgement):* Feel 3 · Readability 5 · Run fit 4 · Cheapness 5 · Evidence 5

### D2. Chasers and bosses as races, and why Fall Guys and Trackmania have none

*In plain words.* The best boss in a speed game is a clock you must outrun; party and racing games skip enemies because another person is the threat.

*How it works (technical).*
- Celeste's Badeline chasers replay Madeline's positions on about a 1.55 s delay; its Seeker spots within about 160 px and charges at 180 to 260 px/s, between the 90 px/s run and the 240 px/s dash [U]. N's chase drone doubles its speed on sight [V, S160]. Super Meat Boy's Brownie is a race against a clone, Little Horn ends after three headbutts, and a framerate bug ran those fights too fast, so they are clock-driven [V, S189, S57; U]. Neon White's tripwires die when they kill you [V, S191].
- Fall Guys has no enemies, an obstacle library at about 80% skill and 20% chaos, competing "against a system rather than each other" [V, S83, S82]. Trackmania and Trials have none; SpeedRunners' threats are items and the screen edge [V, S152]. Super Mario Bros. 35 mails kills to an opponent [V, S157].

*Cost / performance.* A path-replay chaser is a ghost with a hitbox; a charger is three states.

*Games that used it.*
- N (chase drone doubles speed): https://n.fandom.com/wiki/Zap_and_Chase_drones
- Super Meat Boy (Little Horn, Brownie): https://giantbomb.com/little-horn/3005-17018/
- Fall Guys (no enemies, 80/20): https://gamesradar.com/fall-guys-interview
- Super Mario Bros. 35 (kill to send): https://www.mariowiki.com/Super_Mario_Bros_35

*How it feels.* A chaser makes a slow section cost the run visibly [I]. The Sandbox's chaser spawns at the last split 1.5 s behind at 0.85x maxRun (357 u/s); for SAMURAI TRIAL the player's own PB shadow made lethal is deterministic and self-scaling [K; I].

*Risks.* The Celeste constants are recalled from decompiled code [U]. Health-bar bosses with RNG do not fit a board [I].

*Ratings 1–5 (author judgement):* Feel 4 · Readability 4 · Run fit 5 · Cheapness 4 · Evidence 3

### D3. Enemies as tools: the stomp bounce, resource refunds and the shell platform

*In plain words.* An enemy gives something back when hit right, so the enemy line is faster and the safe line slower.

*How it works (technical).*
- SMB1's rule is "moving downward kills" (the player's y plus 12 px against the enemy's y) and a rising Koopa stomp keeps Mario rising; `StompChainCounter` scales points [V, S11, S9]. Shovel Knight's drop bounce adds "about 4.5 tiles" with "frustration-free" invulnerability [V, S93]. Celeste's `Bounce` sets vy to -140 (1.33x jump) with the 0.2 s window [V, S7].
- Dustforce resets dash and double jump when an attack lands, a Celeste seeker refills the dash, Downwell's stomps recharge the gunboots, which solved a pacing problem [U; V, S102]. Mario Maker's shell jump makes a thrown shell a step, taught by GrandPOOBear [V, S188]. Pizza Tower's Mach 2 grab swings an enemy and Mach 3 barrels through, with a 7 s combo [V, S190].

*Cost / performance.* A one-way tile that sets vy when landed on with vy > 0, reusing the mover landing code [K; I].

*Games that used it.*
- Super Mario Bros. (stomp rule): https://tasvideos.org/GameResources/NES/SuperMarioBros
- Shovel Knight (4.5-tile drop bounce): https://yachtclubgames.com/blog/plague-knight-mobility-design
- Super Mario Maker (shell jump): https://shacknews.com/article/113025/how-to-shell-jump-in-super-mario-maker-2-grand-poobear-guide
- Pizza Tower (Mach grab, 7 s combo): https://tvtropes.org/pmwiki/pmwiki.php/VideoGame/PizzaTower

*How it feels.* A refund is a route choice with texture [I]. A kill could reset `wallJumpSameY` (330 against 790) or set vx above maxRun for the 500 u/s² decay to bleed; the bounce is settled at a full `jumpVel` (830 u/s) with the apex band [K; I].

*Risks.* An enemy at hero height on the main line is a stop sign, so bounce enemies sit below the line and cuttable ones in it (D4); Hollow Knight's pogo window is unsourced [U; I].

*Ratings 1–5 (author judgement):* Feel 5 · Readability 4 · Run fit 5 · Cheapness 4 · Evidence 4

### D4. The one-button slash that keeps momentum

*In plain words.* The katana is a short hitbox ahead, active a few steps, cancelable into a jump, never touching vx.

*How it works (technical).*
- Katana ZERO deflects bullets with the slash at full speed and rolls with invulnerability [V, S154]. Dustforce's attack direction is independent of momentum and barely affects forward speed [V, S206]. Pizza Tower's Mach 2 grab preserves momentum [V, S190].
- Spec: a 50 u by 40 u hitbox, a 2-step wind-up (17 ms), 4 active steps (33 ms), 100 ms before the next press, air usable, jump cancels it, vx untouched; the spec started at 120 ms and 40 u [I]. The katana appears today only in the duel, blades crossing at 1.33 s of 3.7 s [K]. A slash must fit 2 to 3 ghost samples at 30 Hz, so record a slash flag [K; I].

*Cost / performance.* One AABB test for 4 steps and a white arc.

*Games that used it.*
- Katana ZERO (deflect at full speed): https://primagames.com/featured/katana-zero-preview-bleeding-cool
- Dustforce (attack independent of momentum): https://axebps-redlib.hf.space/r/dustforce/wiki/terms
- Pizza Tower (Mach grab): https://gamedeveloper.com/design/how-speedy-implementation-high-paced-platformer-pizza-tower

*How it feels.* A free slash turns an enemy into a thing cut on the way past and a cuttable bamboo into a route marker [I].

*Risks.* Katana ZERO's 3 to 4 active frames are recalled [U]. Any attack that clamps vx even for 2 steps reads as a stop sign at 420 u/s; the Sandbox's "slash stops you" toggle shows why [I].

*Ratings 1–5 (author judgement):* Feel 5 · Readability 4 · Run fit 4 · Cheapness 4 · Evidence 3

### Family E: Map design

### E1. Level length and the medal ladder: author time x1.06, x1.2, x1.5

*In plain words.* Keep a map to 20 to 35 s of clean play, record a developer run as the author time, and hang three medals off it.

*How it works (technical).*
- Trackmania's Weekly Shorts: "Track length should not be longer than an Author Medal of 20 seconds", from a 10 to 35 s range, since 10 Mar 2025 [V, S25, S55]. Neon White levels run "often under 30 seconds"; N++ episodes are 5 levels in about 5 minutes; Mario Maker's 20 s minimum timer became a format [V, S66, S63, S175].
- Nadeo's defaults are gold 1.06x, silver 1.2x, bronze 1.5x author, rounded up; one Track of the Day shows 58.055 s author, 1:02, 1:10, 1:28; about 2,309 of roughly 8,000 finishers (29%) had gold or author on one Cup of the Day map [V, S34, S177, S176]. Neon White: Silver is the intended path with mistakes, Gold clean, Ace the designed skip, a hidden Red beats the designer; dev ghosts replayed with injected hesitation came out "surprisingly close" to players [V, S66, S68].
- SpeedRunner's maps are 6830, 8700, 4580 and 6550 u wide, 10.9 to 20.7 s of flat running (THE DUNGEON's 4580 u are 10.9 s plus 1350 u of climbing); clean runs at 1.3 to 1.6x give author times of 22 to 35 s [K; I].

*Cost / performance.* Four numbers per map and an icon; the author ghost exists at 30 Hz [K].

*Games that used it.*
- Trackmania (Weekly Shorts 20 s, default medals): https://doc.trackmania.com/create/map-review/weekly-shorts-guidelines/
- Neon White (medal rules, injected hesitation): https://www.vice.com/en/article/neon-whites-developers-being-too-good-at-their-own-game-caused-real-problems/
- vjeux (medal distribution on a COTD map): https://blog.vjeux.com/2021/javascript/trackmania-medal-distribution.html

*How it feels.* A medal ladder is a difficulty curve for one level [I]. The Sandbox's 20 s level settles gold 21.2 s, silver 24 s, bronze 30 s; a sum of PBs across four maps gives N++'s episode feel for free [I].

*Risks.* The world record is the wrong author time; Esposito's team "struggled to generate fair medal times" [V, S68]. Hand-set medals come from a clean, a casual and a sloppy run [V, S105].

*Ratings 1–5 (author judgement):* Feel 3 · Readability 5 · Run fit 5 · Cheapness 5 · Evidence 5

### E2. Teach, develop, twist, resolve across the map set

*In plain words.* One idea per screen, used safely, then combined, then twisted, with the campaign's shape visible.

*How it works (technical).*
- Hayashida's kishotenketsu: introduction, development, twist, resolution [V, S85]. SMB 1-1's first Goomba "approaches slowly" so the jump is taught by a cheap failure [V, S185]. N++ shows one element per level on an 8-step scale in a 5x20 grid rising diagonally, 20 episodes open [V, S63]. Celeste treats each room as a small story [V, S65].
- SpeedRunner's m1 teaches 7 atoms in 6830 u (rock, steps, momentum gap, chimney, drop, three narrow platforms, ledge); m2 stacks a pillar run, a low cave, a 600 u climb (13 BL, about 3 wall jumps) and a double roll; m3 twists wall jumps under spike ceilings; m4 twists one-way tiles and movers nothing taught [K; I].

*Cost / performance.* Authoring; standable words exist in the lobby [K].

*Games that used it.*
- Super Mario 3D World (Hayashida's four steps): https://www.engadget.com/2015/03/17/super-mario-3d-world-design/
- N++ (one element per level, diagonal grid): https://blog.playstation.com/?p=145712
- Celeste (rooms as stories): https://gdcvault.com/play/1024307/Level-Design-Workshop-Designing-Celeste

*How it feels.* The missing halves are development and resolution: a low ceiling before m2's cave, a Medium map with movers and roof tiles before m4, a SAMURAI TRIAL with no new atoms, and standable prompts ("JUMP", an arrow on the chimney) that vanish after the first clear [K; I].

*Risks.* Seven atoms in a 16 s map with full restart replay five atoms on the first chimney death; treat m1 as a tutorial with respawn until cleared once [I].

*Ratings 1–5 (author judgement):* Feel 4 · Readability 5 · Run fit 4 · Cheapness 4 · Evidence 4

### E3. One designed skip per map, placed early, hinted after gold

*In plain words.* One safe route and one deliberate shortcut, placed where failing is cheap, shown after gold.

*How it works (technical).*
- Neon White assembles encounters and "the assembly often creates shortcut opportunities"; every level got a skip that saves real time, hinted after Gold [V, S66, S67]. Trackmania's Puzzle style keeps "a straight forward path" beside the cuts, mappers narrow the lazy route, and a cut on TMNF's D06 surfaced 13 years later [V, S25, S172].
- A skip saving s seconds with failure p pays when s(1 - p) > p(t + 3.4): near the finish (t about 25 s, p 0.3) it must save about 12 s, at the start (t about 2 s) about 2.3 s [K; I]. Aim for 8 to 15% of the author time (2 to 4 s on 25 s); under the 6% gold band nobody bothers, over 20% the safe route dies [I].

*Cost / performance.* Authoring with the one-way roof tiles, the 280 u/s roll and the climb variant [K].

*Games that used it.*
- Neon White (shortcuts, hints after Gold): https://www.gamedeveloper.com/road-to-igf-2023/-neon-white-and-designing-for-player-creativity
- Trackmania (cut culture, a 13-year shortcut): https://kotaku.com/the-incredible-story-of-a-trackmania-shortcut-13-years-1846524325
- Trackmania Weekly Shorts (Puzzle style rules): https://doc.trackmania.com/create/map-review/weekly-shorts-guidelines/

*How it feels.* A visible risky shortcut is a discoverable ceiling, Neon White's Red medal rather than hidden frame tech [I]. A ceiling route over m2's cave needing two clean wall jumps is the cheapest skip; the late skip belongs in m4 only if near-certain [I].

*Risks.* Prevent only skips that bypass the map's test; `deathY` and the camera clamp bound the space, and level-clock movers keep skip timing learnable [K].

*Ratings 1–5 (author judgement):* Feel 5 · Readability 3 · Run fit 5 · Cheapness 4 · Evidence 4

### E4. Readability in body lengths: gaps, platforms, blind drops and framing

*In plain words.* Size gaps and platforms in body lengths from the jump numbers, never hide a landing, keep the hazard silhouette unique.

*How it works (technical).*
- Measured by running the game's `step()` headless in the readability figure: a jump held from the edge at 420 u/s with the apex band clears up to 6.25 BL (288 u), a standing jump that starts moving at the edge clears about 4.75 BL under the 1900 u/s² air acceleration, and the widest gap in the current maps is the 180 u momentum gap, under 4 BL [K; I]. Rules: safe gaps at most 4 BL (184 u), momentum gaps 4 to 5.5 BL (184 to 253 u), never above 6 BL (276 u); main-route platforms at least 2 BL (92 u), skips 1 BL, N++'s one-tile tier [V, S63; I].
- Trackmania: a first-timer follows the path, "jumps must be clear, with the landing visible", nothing hidden, no tricks required [V, S25]. N++ is single-screen so no leap is blind [V, S63]. SMB 1-1's uniform bricks focus attention on the jump [V, S185]. With the feet at 62% of the 545 u view, 207 u is visible below the feet when the camera is settled, and the 5 per second vertical lerp lets the hero sink toward the bottom of the view during a fall, so a drop much past about 400 u lands off screen without a marker or the vy x 0.25 s downward look-ahead (B3); m3's climbs exit through two drops each into halls with 9 spike strips [K; I]. Canabalt caps drops at one screen [V, S77].

*Cost / performance.* A checklist and landing markers (cut-grass tufts, an ink smear).

*Games that used it.*
- Trackmania Weekly Shorts (readability review labels): https://doc.trackmania.com/create/map-review/weekly-shorts-guidelines/
- N++ (single screen, fair and predictable): https://blog.playstation.com/?p=145712
- Canabalt (drop capped at one screen): https://gamedeveloper.com/design/tuning-canabalt

*How it feels.* Black on white reads as silhouette if the red stays on the hero and spikes stay the only sawtooth [K; I]. The Sandbox draws the dead zone and the visible-landing line as an overlay.

*Risks.* The sizes derive from SpeedRunner's constants (Evidence 3) and change with `jumpVel`, `gravity` or a jump boost (A3) [I].

*Ratings 1–5 (author judgement):* Feel 4 · Readability 5 · Run fit 5 · Cheapness 5 · Evidence 3

### E5. A seeded daily map: rhythm first, tagged chunks, bot proof

*In plain words.* Author 30 to 40 chunks, tag each with a skill and a cost, sequence 6 to 8 from a daily seed, prove the map with a bot.

*How it works (technical).*
- The Jetpack Joyride model as reconstructed for Boney the Runner: fixed 1536x640 px chunks (1.6 screens), four classes, 230 chunks split 99 Easy, 62 Medium, 55 Hard, 14 Bonus, picked by class from a drawn curve [V, S214]. Sure Footing uses an action grammar with costs and over 30 parameters [V, S78]. Canabalt derives gaps from speed (two thirds of horizontal speed) and spaces specials every 3 to 8 buildings [V, S77]. Launchpad generates the input rhythm first (5 to 20 s groups) so a valid input sequence exists before the level [V, S213]; MarioGPT validated 88.4% of levels with A* against about 31% [V, S217].
- Spelunky's daily is one seed, one attempt, 24 h, its own board; Trackmania's Track of the Day is curated and Royal is authored [V, S86, S208, S29]. Doodle Jump's spawn rules are unpublished [U]. Budget: 5,000 to 11,000 u, 4 to 8 chunks of about 1,450 u plus 300 u start and 400 u flag pads, a cost ramp 1, 1, 2, 2, 3, 2, 4, rest, a rest chunk every 3 to 8, the bot run as author time [K; I].

*Cost / performance.* A chunk editor (LDtk exports to `[x, y, w, h, tag]` in about 40 lines), a generator, a headless bot [V, S116; I]. The largest backlog item.

*Games that used it.*
- Jetpack Joyride (chunk pools by class): https://www.sbgames.org/sbgames2013/proceedings/comp/23-full-paper.pdf
- Canabalt (speed-coupled generation): https://gamedeveloper.com/design/tuning-canabalt
- Spelunky (daily seed wrapper): https://gamedeveloper.com/business/-i-spelunky-i-s-new-daily-challenge-destined-to-infuriate-engage-players
- Launchpad (rhythm-first): https://expressiveintelligence.github.io/papers/smith-fdg-09.pdf

*How it feels.* A daily gives five friends a reason to open the game the same day [I]. Start by reusing THE DUNGEON's generator with the date as seed, unlimited practice, one counted try [K; I].

*Risks.* Doodle Jump's vertical infinite model is wrong here; the horizontal authored Jetpack model is right [I]. A daily under 5% clear rate is Super Expert and empties the board [V, S216; I].

*Ratings 1–5 (author judgement):* Feel 4 · Readability 4 · Run fit 5 · Cheapness 2 · Evidence 4

### E6. Maker grammar: the 20-second Mario Maker level and UCH's one piece per round

*In plain words.* The most-played maker levels are short, single-idea and never stop; the party builder grows a level one piece per player.

*How it works (technical).*
- Across 26.6 M SMM2 levels the median clear rate is 25% (p25 10%, p75 50%), tags Easy 33%, Normal 44%, Expert 16%, Super Expert 8%, Super Expert rarely above 2%, speed words in 4.45% of Super Expert titles against 1.90% of Easy [V, S216]. 20-second On/Off gauntlets became a trend and "Celestial Sprint Speedrun" was the most-played level for a time [V, S175, S174]. The 2015 rule: "prove that you can clear it" before upload [V, S51].
- Ultimate Chicken Horse's default is 5 points over 12 rounds; Goal 1 (reach the goal alive), Solo 3 (the only player to reach it), Postmortem 2 (reach it after dying, with Respawn on), Trap 1 (each player who dies on your trap), Coin 3 (reach the goal after collecting the coin), Comeback 4 (reach it as an Underdog, after 2 or more turns without a goal while others scored); "If nobody reaches the goal, or everyone does, no one scores" [V, S24, S146]. LittleBigPlanet reached over 8 million levels with hearts and Mm Picks [V, S197, S198].

*Cost / performance.* Authoring rules; a weekly add-one-piece mode needs a shared record and a vote.

*Games that used it.*
- Super Mario Maker 2 (20-second gauntlets): https://www.vice.com/en/article/20-second-gauntlets-of-death-are-the-hottest-trend-in-mario-maker-levels/
- Ultimate Chicken Horse (scoring rules): https://cleverendeavourgames.freshdesk.com/support/solutions/articles/32000028991-custom-rules-and-presets
- LittleBigPlanet (Mm Picks): https://www.mediamolecule.com/blog/article/mm_picks5

*How it feels.* One idea per screen, a cued input, a flag visible early, death that teaches the next input; a SpeedRunner map in this grammar is 20 to 30 s with 4 to 6 cues and nothing that asks the player to stop, which today only m2's cave hops do [K; I]. UCH's rule becomes "a split counts only if a friend missed it" [I].

*Risks.* First-session clears should land in Mario Maker's 10 to 30% band and converge to 60% or more; clear rate per attempt and per player are different numbers [I].

*Ratings 1–5 (author judgement):* Feel 4 · Readability 5 · Run fit 4 · Cheapness 4 · Evidence 4

### Family F: Difficulty curve

### F1. Cost of failure: a countdown-free restart with death to control under 0.5 s

*In plain words.* The only penalty a death should carry is the run time lost; the restart itself must be nearly free.

*How it works (technical).*
- McMillen: "The time it takes for Meat Boy to die and respawn is almost instantaneous" and "the penalty is how much time it takes to start playing again" [V, S57]. VVVVVV respawns instantly, N++ resets with no fade, Hollow Knight waits `DEATH_WAIT = 2.85f`, one analyst puts Celeste's death under 0.5 s and calls downtime "frustration amplification time" [V, S209, S63, S13; U, S195]. Jetpack Joyride is one tap from death to replay [V, S75].
- SpeedRunner is dead 0.38 s then replays a 3 s countdown, 3.4 s death to control, 7 to 10 times the norm, 13% of a session at one death per 20 s and 2.5 minutes over a 50-attempt map [K; I]. Juul's players rate games highest when failure is their own; a flat time penalty teaches nothing [V, S212; I]. Getting Over It's fall "escapes your grasp more than if you just restart", a model that needs no clock [V, S72; I].

*Cost / performance.* Negative, it deletes code (H4).

*Games that used it.*
- Super Meat Boy (almost instantaneous): https://www.gamedeveloper.com/game-platforms/-i-super-meat-boy-i-s-mcmillen-explains-why-so-hard-
- VVVVVV (zero-time restart): https://boingboing.net/2010/01/13/get-this-flipping-ou.html
- Hollow Knight (`DEATH_WAIT 2.85`): https://github.com/AminSedaghaty/HK-Source/blob/f516282143970c48bcb25b695489ec0855b3b837/CSharp/HeroController.cs
- Jetpack Joyride (one tap to replay): https://adriancrook.com/?p=4709

*How it feels.* Players read a slow restart as "the game feels slow" [I]. Target death to control under 500 ms and `R` under 150 ms, keep the 0.38 s beat with the camera on the death spot, skippable, and the countdown only on the first attempt after map select [K; I].

*Risks.* One critic says zero delay leaves no time to reflect; the 0.38 s beat and 22 dust particles are that reflection [V, S4; K; I].

*Ratings 1–5 (author judgement):* Feel 5 · Readability 5 · Run fit 5 · Cheapness 5 · Evidence 5

### F2. Ramps: a visible ladder with a sideways step, the hard part early, a sprint finish

*In plain words.* Show the campaign's shape, let a stuck player step sideways, and put the hardest section early in a full-restart map.

*How it works (technical).*
- N++ opens 20 episodes at a time so a stuck player can "move to the next column and return later", re-rates every level, follows intense levels with calm ones [V, S63]. Super Meat Boy's dark world "starts where the main game's difficulty leaves off" [V, S57]. Trackmania gates Blue, Red and Black on 10 bronze, 10 silver, 10 gold in 2026 [V, S30]; Mario Maker's Endless tiers are chosen by the player [V, S192].
- SpeedRunner's hazards run 2, 2, 9, 1 spike strips across maps 1 to 4, map 3 also the shortest (4580 u) and most vertical (top -1350), a spike not a sawtooth [K; I]. Defender1031 puts the hard part right before a checkpoint; inverted for full restarts the hard part belongs early, where a retry costs 3 s not 15; a 10% failure at the last jump of a 20 s map wastes 0.1 x (20 + 3.4) = 2.3 s of expected run per attempt, counting the 3.4 s restart, and 0.1 x 3.4 = 0.3 s at the start [V, S89; I].

*Cost / performance.* Card order and four medal numbers.

*Games that used it.*
- N++ (grid, sideways step): https://blog.playstation.com/?p=145712
- Trackmania (medal-gated tiers): https://blog.trackmania.com/?p=8948
- Trolling for Dummies (checkpoint placement rule): https://docs.google.com/document/d/13ZoqeblLs45HuEfTtsOrq6X0LAuEnA8nB721_doxE38/mobilebasic

*How it feels.* Swap maps 3 and 4 or add a Medium so the ramp reads 2, 2, 1, 9, and unlock SAMURAI TRIAL on 3 of 4 golds [K; I]. Inside a 30 s map, three or four one-atom sections ending on a chime, 2 to 3 s of flat running between, the peak in section 2 or 3, a fast readable finish [I].

*Risks.* "Hard finish is cruel" was not found written anywhere; it is inferred from the checkpoint rule and the restart arithmetic [I].

*Ratings 1–5 (author judgement):* Feel 4 · Readability 4 · Run fit 5 · Cheapness 5 · Evidence 4

### F3. Honest expert, not troll: the SAMURAI TRIAL question

*In plain words.* A troll level is funny once, for an audience; a ranked map must be hard and honest, and jokes go where there is no clock.

*How it works (technical).*
- The lineage: Owata (about 2006), Syobon Action (Feb 2007, four stages of "innocuous objects that kill the character in ways unforeseeable", first stage in three days, the clone downloaded over 150,000 times), I Wanna Be the Guy (2007), Kaizo Mario World (2007) [V, S143, S150, S151].
- Its rules. Kayin: "Random traps are NOT a crutch", traps tuned to expected deaths, "They need room to breath" [V, S88]. Defender1031: laughter never frustration, a fair troll "punishes that expectation with humor, and then shows the correct action", no softlocks, no coin flips, hints "impossible to mistake for part of the level", 6 to 10 trolls per checkpoint [V, S89]. Modern kaizo: "Missing a jump or getting hit by an enemy results in a death", "first and foremost fair" [V, S151].

*Cost / performance.* Zero; a rule for one locked card.

*Games that used it.*
- Syobon Action (Cat Mario): https://en.wikipedia.org/wiki/Syobon_Action
- I Wanna Be the Guy (Kayin's FAQ): https://kayin.moe/iwbtg/faq.html
- Kaizo Mario World: https://en.wikipedia.org/wiki/Kaizo

*How it feels.* Trolls work on stream because the audience knows the trap; a board never shares a first blind run, so a troll is a hidden spike paid alone and then a memory item [I]. SAMURAI TRIAL is honest kaizo with its skip hinted, and the comedy lives in the lobby's standable title letters [K; I].

*Risks.* Cat Mario and Fall Guys clips spread because priors are violated in 2 seconds, marketing value not board value; one betrayed shape in the trial must be identical on every attempt [I].

*Ratings 1–5 (author judgement):* Feel 3 · Readability 4 · Run fit 5 · Cheapness 5 · Evidence 4

### F4. Assists and practice modes behind an unranked flag

*In plain words.* Practice tools and assists are free and mark the run unranked, said before the run; the board keeps one ruleset.

*How it works (technical).*
- Celeste's Assist Mode (speed, invincibility, infinite stamina, chapter skip) is explained up front; Thorson called reception "overwhelmingly positive" and said it "breaks the game" without undermining intent [V, S70, S4]. Hades' God Mode starts at 20% resistance, +2% per death, cap 80% [V, S4]. Super Meat Boy, N++, Neon White and Dustforce ship no options; Neon White gives infinite retries and medals [V, S63, S196].
- speedrun.com bans assist mode and Save-and-Quit retries on Celeste IL boards; Trackmania's respawn keeps the timer running [V, S162, S194]. Cost order: practice from checkpoint (one flag, one position), 50% slow motion as one accumulator multiplier, the medal ladder (E1), a Celeste-style menu only when phones arrive [I].

*Cost / performance.* A flag and a UI line.

*Games that used it.*
- Celeste (Assist Mode): https://www.vice.com/en/article/celeste-difficulty-assist-mode
- Hades (God Mode, via the Curves glossary): https://kingsfoil-artifacts.netlify.app/curves-hearthguard.html
- Trackmania (practice respawn): https://openplanet.dev/plugin/norespawntimer

*How it feels.* An unranked assist keeps the board honest and the player learning [I]. The Sandbox's slow motion, invincible and infinite coyote flag the run "assisted" and the friends board rejects it [V, S3].

*Risks.* Assists without a ranked consequence become the default; say the rule before the run, not after a rejected submit [I].

*Ratings 1–5 (author judgement):* Feel 4 · Readability 4 · Run fit 4 · Cheapness 4 · Evidence 5

### F5. Telemetry five testers can collect: deaths by section, a funnel and the replay pile

*In plain words.* Log where each attempt died, in which split, and how many attempts a clear took; five people can see a wall.

*How it works (technical).*
- Mario Maker shows clears over attempts, median 25% [V, S216]. vjeux counted Trackmania finishers per medal [V, S176]. Celeste shows per-chapter deaths; first playthroughs reach 15,000 to 20,000 and one player cut a chapter by 30x [U, S181]. Shadow Blade overlaid death frequency on the geometry; Super Meat Boy replays 40-plus attempts at once [V, S90, S57]. The SMM2 dataset holds 564 million deaths with positions under CC BY-NC-SA [V, S19].
- SpeedRunner's server sees starts and finishes; `splits[i]` gives the section at death, so post `{map, section, x, y, cause, attempt}` (about 20 bytes) or a `deaths` count on submit [K; I]. Thresholds for five testers: a section with median deaths over 3x the others, attempts to first clear above 15 (Easy) or 40 (Hard), a quit before checkpoint 2 on a map started 3 or more times; rate perceived difficulty 1 to 7 [I].

*Cost / performance.* One field on `submit`; ink smears in the dev build.

*Games that used it.*
- Super Mario Maker 2 (clear rate per course): https://arxiv.org/html/2507.21078v1
- Shadow Blade (death overlay): https://gamedeveloper.com/design/closing-the-loop-validating-design-decisions-using-player-data-for-a-platformer
- Super Meat Boy (replay pile): https://www.pcgamer.com/uk/super-meat-boy-review

*How it feels.* The replay pile is a heatmap the player sees as a reward [V, S57]. Replaying every failed attempt from the H2 format on the results screen is nearly free; a faint "x" at the last death spot is a one-item heatmap [K; I].

*Risks.* Five players give walls, not statistics; move thresholds after the first session. "Fun at 70% completion" has no primary source [U].

*Ratings 1–5 (author judgement):* Feel 3 · Readability 4 · Run fit 5 · Cheapness 5 · Evidence 4

### Family G: Social

### G1. Boards for a small group: friends first, around me, a season column over a permanent board

*In plain words.* With five names the rank stops mattering; show history, keep all-time records under a season column, give every player a next target.

*How it works (technical).*
- Trackmania ranks 10 categories up to "World 1", layers world, continent, country and region ladders, rotates 25 maps and 100 medals every 3 months, and keeps permanent per-map boards when a season closes [V, S31, S26]. Steam offers a Friends-only read filter and 64 int32s of detail per entry [V, S37]. Neon White hides friend and medal times until you have attempted the level [V, S67, S66]. Mirror's Edge ranked a star total with achievements at 20, 35, 50 and 90 [V, S199].
- SpeedRunner pages by 7 with your rank and the WR; `SEASON = 2` wipes scores and local ghosts [K]. With 5 players the page never pages, and percentiles need about 50 players [I].

*Cost / performance.* A friends list, date and delta columns, a season column; the server knows the previous holder [K; I].

*Games that used it.*
- Trackmania (zone ladders, seasons): https://doc.trackmania.com/play/what-is-a-seasonal-campaign/
- Steamworks (Friends read filter): https://partner.steamgames.com/doc/features/leaderboards
- Neon White (friend times after first attempt): https://www.vice.com/en/article/neon-whites-developers-being-too-good-at-their-own-game-caused-real-problems/

*How it feels.* Make friends the default with global as a tab, show "2nd of 5" and the gap in ms, the date and the delta since the previous holder, keep all-time and reset only "this season", show the next medal time beside friends [K; I].

*Risks.* A daily board with 2 entries looks dead, so weekly beats daily at five; wiping local ghosts on a season change throws away the duel's history [K; I].

*Ratings 1–5 (author judgement):* Feel 3 · Readability 5 · Run fit 5 · Cheapness 5 · Evidence 4

### G2. Ghosts and rivals as social objects: a pickable shadow, owner colours, a rival toast

*In plain words.* Let the player choose whose ghost to race, in that player's colours, and tell them when a friend beats their time.

*How it works (technical).*
- Trackmania loads any record's ghost with one click and any ghost file downloads from trackmania.io [V, S28]. Mario Kart Wii downloaded rival and friend ghosts and unlocked Funky Kong, Baby Luigi and vehicles at 4, 8, 12 and 24 expert ghosts beaten [V, S158]. Mirror's Edge raced a friend's ghost from a tapped time [V, S199]. Neon White's board began when a friend sent back best times an hour after the prototype; a friend's name after each level motivates "to do a tiny bit better" [V, S69]. SMM2's Ninji Speedruns race other players' ghosts [V, S156].
- Doodle Jump drew other players' heights as live markers, the first mainstream asynchronous race UI; horizontally that is a pace line [V, S79; I]. SpeedRunner's shadow is only your own best at 10% alpha, 37.5% in the 3.7 s duel, with customisable hat and kimono colours [K].

*Cost / performance.* A second ghost slot and one GET under 5 KB (H2); a rival toast is a diff on submit.

*Games that used it.*
- Trackmania (load any record's ghost): https://doc.trackmania.com/play/watch-replays
- Mario Kart Wii (rival and friend ghosts): https://www.mariowiki.com/Ghost_(Mario_Kart_series)
- Doodle Jump (live height markers): https://www.pocketgamer.biz/bouncing-ever-upwards-the-making-of-doodle-jump/

*How it feels.* The duel already turns minus 0.4 s into a falling head [K]. Add "race: my best / friend X / WR / author", draw friends in their colours by opt-in, put "X beat your ROCKY MOUNTAIN by 0.42 s" with a race button on the title screen, unlock colours from medals [K; V, S26; I].

*Risks.* Trackmania withholds the author ghost; for five friends show it [I]. A ghost over a screen ahead should fade, SpeedRunners' shrinking window for ghosts [I].

*Ratings 1–5 (author judgement):* Feel 5 · Readability 4 · Run fit 5 · Cheapness 4 · Evidence 4

### G3. Async and live races: a weekly seed, a knockout room, a two-player ghost race

*In plain words.* Async races need a seed and a deadline; live races need a lobby, a synced start and one-way state, never shared physics.

*How it works (technical).*
- SpeedRunners races 4 on one screen that follows the leader, eliminates at the edge, with a boost meter and a contracting screen [V, S152], which needs shared physics [I]. Trackmania's Cup of the Day is a 10-minute qualifier then divisions of up to 64; Cup of the Week removes 4 per round from 64 to 17, 2 from 16 to 9, 1 from 8 to 2 [V, S27, S33]. racetime.gg: everyone clicks Ready, then about 15 s of countdown LiveSplit can start on [V, S109].
- Fall Guys cut 60 to about 40 per course round down to a final of about 10, Season 3 capped lobbies at 40 [V, S144; U]. Super Mario Bros. 35 ran 35 players from Oct 2020 to Mar 2021 [V, S157]. Ultimate Chicken Horse's Solo and "Too Easy, No Points" rules reward a split only some friends made [V, S24].

*Cost / performance.* A weekly seed is a date and a board; a live room needs a relay (H5).

*Games that used it.*
- SpeedRunners (screen-edge elimination): https://en.wikipedia.org/wiki/SpeedRunners
- Trackmania Cup of the Day (knockout rounds): https://doc.trackmania.com/play/how-to-play-cotd/
- racetime.gg (Ready and countdown): https://racetime.gg/about/help
- Ultimate Chicken Horse (only-finisher scoring): https://cleverendeavourgames.freshdesk.com/support/solutions/articles/32000028991-custom-rules-and-presets

*How it feels.* For five friends: a Ready room, a shared 3-2-1 from the server, each client on its own deterministic sim, positions at 10 to 15 Hz as shadows with no collisions, or input streams re-simulated locally so the result is verified free [K; I]. The weekly challenge closes Sunday and the winner's ghost becomes next week's author [I].

*Risks.* SpeedRunners-style items belong in a separate ruleset and board [I]. racetime.gg's countdown is a help-page figure [V, S109].

*Ratings 1–5 (author judgement):* Feel 4 · Readability 3 · Run fit 5 · Cheapness 3 · Evidence 4

### G4. Sharing and trust: clear before publish, course codes, share cards and a two-tier board

*In plain words.* A level publishes with its author's clear, a run shares as a code or card, a time is unverified until a friend watched the ghost or the server replayed it.

*How it works (technical).*
- Super Mario Maker: "Before you can upload a course, you'll have to prove that you can clear it"; Nintendo blocked rule breakers in 2016; SMM2 raised slots 32 to 64 (Jul 2019) to 100 (Jan 2020, 10 million courses) with course IDs [V, S51, S52, S145; U]. Team 0% cleared the last of 41,113 uncleared courses on 15 Mar 2024 [V, S147]. LittleBigPlanet passed 8 million levels with hearts and Mm Picks [V, S197, S198].
- Nadeo's 2021 sweep checked over 400,000 records and traced most cheats to 10 logins; before that, verification meant downloading a replay and guessing [V, S171, S169]. speedrun.com moderators may demand "demonstration of skill over a period of time via streaming" [V, S127]. Wordle's share grid (16 Dec 2021) is the model for a run text, map, time and five squares by split delta; a card is one `canvas.toDataURL` [U; I]. A map of a few hundred `[x, y, w, h, tag]` solids fits a URL hash after lz-string [K; V, S117; I].

*Cost / performance.* A "looks legit" button, a share string, a clear-rate column from existing starts and submits [K].

*Games that used it.*
- Super Mario Maker (clear before upload): https://microsite.nintendo-europe.com/super-mario-maker-manual/enGB/page_05.html
- Team 0% (community verification): https://en.wikipedia.org/wiki/Team_0%25
- LittleBigPlanet (8 million levels, hearts): https://games.softpedia.com/blog/Little-Big-Planet-Has-8-Million-Community-Created-Levels-364874.shtml
- Trackmania (400,000 records swept): https://www.pcgamer.com/trackmania-dev-analyses-15-years-worth-of-records-to-root-out-the-cheaters

*How it feels.* At five players verification is one click; a row shows "unverified" until re-simulated (H3) or tapped by a friend, names are an allowlist, and "has anyone finished SAMURAI TRIAL?" is a Team 0% goal [K; I].

*Risks.* The LBP "10 million" figure is unverified; 8 million is sourced [U, S197]. Adopt clear-before-publish before any editor exists [I].

*Ratings 1–5 (author judgement):* Feel 3 · Readability 4 · Run fit 5 · Cheapness 4 · Evidence 4

### Family H: Race infrastructure

### H1. The step-count timer, in-game time, and the splits model in LiveSplit colours

*In plain words.* Store the run as an integer count of physics steps shown as ms; keep per-section bests and colour deltas as every stream does.

*How it works (technical).*
- N steps at `DT = 1/120` is N x 8.333 ms, exact and frame-rate independent [K; I]. Celeste stores 100 ns ticks per fixed frame and its IGT does not change at 61 fps [V, S17, S167]. Boards time RTA, load-removed or IGT per game; a browser game owning its clock needs only IGT [V, S50; I].
- LiveSplit's model: PB splits, golds, sum of best, attempt history, four delta shades; livesplit-core defaults are gold (255,213,0), ahead gaining (0,204,54), ahead losing (97,209,127), behind gaining (209,97,97), behind losing (204,0,0), PB blue (20,165,255); golds update on every completed segment [V, S16, S106, S187; I]. SpeedRunner stores `splits[i]` against `pbSplits` with green minus and red plus and lacks golds, sum of best and the losing-while-ahead shade; PB, golds and 50 attempts per map is about 1 KB [K; I].

*Cost / performance.* An integer and an array per map; the float sum drifts about 1e-12 s over 7,200 steps [I].

*Games that used it.*
- Celeste (100 ns ticks per fixed frame): https://frissyn.gitbook.io/celeste-saves/topics/filetime
- LiveSplit (components and colours): https://livesplit.org/components/
- livesplit-core (default colours in source): https://raw.githubusercontent.com/LiveSplit/livesplit-core/master/src/layout/general_settings.rs

*How it feels.* Gold says a section was your best ever regardless of the run [I]. Store `{steps, dt}` so a 240 Hz step never corrupts old times, show two decimals in the run and three on the board, export `.lss` for LiveSplit One [V, S108; I].

*Risks.* Any future freeze must decide whether it advances the step counter, as Celeste's IGT pauses in freezes [V, S21]. Never time from the accumulator or wall clock [I].

*Ratings 1–5 (author judgement):* Feel 4 · Readability 5 · Run fit 5 · Cheapness 5 · Evidence 5

### H2. Ghost formats and byte budgets: inputs as truth, a rig-replayed track for the duel

*In plain words.* Record inputs per step as the real ghost and let the rig pose the shadow from a small state track.

*How it works (technical).*
- SpeedRunner stores 18 numbers at 30 Hz (x, y, facing, rotation, pivot, scale x and y, flap, 10 angles), about 100 KB per minute as JSON by the build's estimate, 139 to 144 KB when the figures and the Sandbox record the same format [K; V, S3]. Mario Kart Wii's RKG is 10,240 bytes fixed, a 136-byte header, three run-length input streams of 2-byte entries, a CRC-32 and 5 lap splits for a 2 to 3 minute race [V, S14]. Dustforce stores 11 intent streams at 2 to 4 bits plus desync data "every 8 frames" at 0.1 px; Trackmania stores inputs with timestamps at 100 Hz and Validate re-runs them [V, S15, S169].
- The rig takes (state, vx, vy, phase, onWall, rolling) and produces the angles, so a ghost fed the recorded state poses itself and the kimono spring runs live [K; I]. At 10 Hz samples sit at most 42 u (0.9 BL) apart and a 332 ms apex is caught within 50 ms; 15 Hz halves that for the 37.5% alpha duel [I]. Table 6d has the budgets.

*Cost / performance.* Under 1 KB per minute for inputs, 4 to 6 KB for a 15 Hz track; `CompressionStream` is Baseline since May 2023 [V, S45]. The Sandbox's 17.48 s run logged 2,148 steps as 2.1 KB raw and 110 bytes run-length encoded, about 369 bytes per minute, against 143.8 KB per minute for the 30 Hz full-pose JSON track (35.5 KB delta-quantised) and 3.8 KB for the 15 Hz position track [V, S3].

*Games that used it.*
- Mario Kart Wii (RKG inputs, 10,240 bytes): https://mkwiiki.org/wiki/RKG_(File_Format)
- Dustforce (intent streams plus desync data): https://dustmaker.readthedocs.io/en/stable/_modules/dustmaker/replay.html
- Trackmania (inputs with timestamps): https://donadigo.com/tmx1

*How it feels.* The shadow looks identical at 20 to 400 times fewer bytes [I; V, S3]. The Sandbox settles inputs at 1 byte per step as canonical, a derived 15 Hz track for the duel and a record `{v, mapHash, physHash, dt, steps, inputs, track}`, dropping the track when the physics hash matches; a slash flag and an input byte per sample feed the input display (B5) [I].

*Risks.* An input ghost ties to the map and `PHYS` hashes (H5); keep the pose format as a fallback for the first season [I].

*Ratings 1–5 (author judgement):* Feel 4 · Readability 3 · Run fit 5 · Cheapness 4 · Evidence 4

### H3. Deterministic replays, server re-simulation and the plausibility ladder

*In plain words.* Make the simulation bit-identical across browsers, send the input log with every run, replay it on the server; everything else is a cheap filter in front.

*How it works (technical).*
- IEEE-754 `+ - * /` and `Math.sqrt` are exact across engines; `Math.sin`, `cos`, `exp` and `pow` are not, and a per-step integrator using `Math.sin` diverged between Node 20 and a newer Chrome, both V8; trigfills exists because Firefox and Chrome differed, Rapier warns the same [V, S125, S123, S124]. SpeedRunner's wheels and movers are the risk if they use `Math.sin(game.time * w)`: use a table built with `Math.fround` or quantise to 1/256 u, sample keys at the top of `step()`, seed any gameplay RNG, keep `performance.now()` out of the step, drive phase from the integer step count [K; I]. Record inputs, not outcomes, so a divergence "clearly indicates tampering" [V, S202].
- The ladder is table 6e, cheapest first [K; I]: the built run id; bounds (`steps >= floor(mapWidth / maxRun x 120)`, per-split minimums, monotonic splits, a wall-clock window of run time minus 2 s); stripping `window.__sr`; an HMAC on the device token; rate limits; re-simulating the 0.6 to 3 KB input replay and rejecting on a finish-step mismatch or no flag, 1 to 2 days; a slowdown flag above 1.05; input statistics as a review flag, never an auto-ban. Neon White's boards held 0.06 s times within days; the Trackmania investigation of 19,977 replays found steering spikes of 9 to 19 per second against 2.9 to 3.0, reproduced only by slowdown software; Nadeo validates TM2 top 10 nightly; Tracer (2025) detects fraud from replays [V, S173, S169, S36, S218].

*Cost / performance.* 7,200 steps of AABB physics per minute is milliseconds of CPU; the Sandbox re-simulated 2,098 to 2,148 recorded inputs in about 6.7 ms and reported PASS at 120 Hz, at 60 Hz and under the "SpeedRunner today" preset [V, S3].

*Games that used it.*
- Trackmania (deterministic inputs, Validate, the 2021 investigation): https://donadigo.com/tmx1
- Revalidate (replay validation by game): https://github.com/BigBang1112/revalidate
- Neon White (0.06 s cheats): https://kotaku.com/neon-white-speedrunning-cheaters-annapurna-interactive-1849115456

*How it feels.* Invisible when it works [I]. Record 20 input runs with a per-step hash of `(x, y, vx, vy, state)`, replay headless in Node and in Chrome, Firefox and Safari, fail CI on a mismatch; the same function is the validator and the Sandbox's PASS panel [I].

*Risks.* A crude `__sr.PHYS.maxRun = 2000` in devtools finishes under the flat-out minimum and the bounds reject it; a pace-preserving edit such as `jumpVel = 1000` passes the bounds and only step 6, the replay, catches it [K; I]. Local PBs cannot be protected; the server copy is truth [I].

*Ratings 1–5 (author judgement):* Feel 3 · Readability 2 · Run fit 5 · Cheapness 3 · Evidence 4

### H4. Instant restart engineering: reset in place, timer on first input

*In plain words.* Restart by resetting state in memory, never reloading, and start the clock on the first move.

*How it works (technical).*
- Re-initialising from the static `MAPS` array, resetting the hero, clearing pools with `length = 0` and `steps = 0` is microseconds; the costs are allocations and GC, so never `fetch` or rebuild DOM [K; I]. Trackmania's clock runs when the car leaves the block and Backspace or Delete restart in place; N++ respawns immediately; players ask for "celeste-like fast respawn" over games that wait "like 1 second" [V, S194; U].
- Start the timer on the first horizontal or jump input and the level clock with it, or a player could wait for a favourable wheel phase (m4's wheels run 3.6 to 4.2 s) [K; I]. `R` is a tap, since a mistaken tap costs under a second; keep the WebAudio context alive and turn the beeps into one "set" tick; the 0.38 s beat is skippable [K; I].

*Cost / performance.* Negative, as F1. The Sandbox measured its in-place reset at 0.1 to 0.2 ms against 3,400 ms for the countdown replay, and a whole frame at 0.2 to 0.5 ms [V, S3].

*Games that used it.*
- Trackmania (start block, in-place respawn): https://steamcommunity.com/app/228760/discussions/2/2961642818658406421
- Super Meat Boy (almost instantaneous): https://www.gamedeveloper.com/game-platforms/-i-super-meat-boy-i-s-mcmillen-explains-why-so-hard-
- Hotline Miami (R restarts the floor): https://giantbomb.com/wiki/Concepts/Instant_Respawn

*How it feels.* Death to control drops from 3.4 s to 0.38 s, shorter than Celeste's [K; I]. Keep the countdown as a one-time ceremony when a map is first opened in a session [I].

*Risks.* Super Meat Boy, Celeste, N++ and Hotline Miami restart times are estimates; a frame count from capture is a 30-minute task [U; I]. On a phone never bind restart next to movement zones [I].

*Ratings 1–5 (author judgement):* Feel 5 · Readability 5 · Run fit 5 · Cheapness 5 · Evidence 4

### H5. Live ghost plumbing, content-hash board keys and share links

*In plain words.* A live ghost is a one-way stream of tiny states behind a 100 ms buffer; boards are keyed by what changes times; a run shares as a URL.

*How it works (technical).*
- Per racer `{step u32, x i16 (0.1 u), y i16, state u8, phase u8}` is 10 bytes at 10 Hz, 100 B/s, about 12 KB each way per 60 s race; 100 to 300 ms of latency is invisible behind a 100 ms buffer because nothing interacts [I].
- Vercel Functions serve WebSockets in public beta (docs 6 Jul 2026), need Fluid Compute (default since 23 Apr 2025), pin to one instance and close at the max duration, about 5 minutes in one test; a community weekly claimed GA in Oct 2026 [V, vendor, S40; V, S203; U, S204]. Cloudflare Durable Objects: 100,000 free requests a day, incoming WebSocket messages billed 20:1, outgoing free, so 600 messages per racer per minute is 30 requests and about 3,000 two-player races a day are free [V, vendor, S41; I]. Supabase Realtime free: 200 connections, 100 messages per second [V, vendor, S42, S43]. PeerJS over WebRTC is free but 10 to 20% of home NAT pairs need a paid TURN relay [V, S114; I].
- Keys: `mapHash = sha256(solids, checkpoints, finish, deathY, movers).slice(0, 12)`, `physHash = sha256(PHYS, DT).slice(0, 8)`, board key `mapId:mapHash:physHash:season`, so a map edit or physics tweak opens a new board and `SEASON` stays the human reset [K; I]; Trackmania keys replays to the map header and Mario Kart Wii stores course and time with a CRC-32 [V, S36, S14]. A share link `#r=<mapId>.<mapHash>.<base64url(deflate-raw(inputs))>` is about 700 bytes raw, 500 deflated, 670 characters, under the 2,000-character guideline (Safari about 80,000, Chrome about 2 MB) [V, S205; I].

*Cost / performance.* Free tiers cover five friends; `localStorage` at about 5 MB holds 50-attempt histories for 5 maps plus tracks in under 50 KB [I].

*Games that used it.*
- Trackmania (replays keyed to the map): https://github.com/BigBang1112/revalidate
- Mario Kart Wii (course and CRC in the header): https://mkwiiki.org/wiki/RKG_(File_Format)
- Vercel WebSockets (public beta): https://vercel.com/docs/functions/websockets

*How it feels.* A link that replays a friend's run with no server round trip is the cheapest share [I]. Send input logs over the relay and re-simulate the friend locally; use the fragment so the server never logs the run, or a query parameter for a verified badge [I].

*Risks.* Polling a Vercel function at 10 Hz is 600 invocations per racer per minute; Ably's free caps were not visible [I; U].

*Ratings 1–5 (author judgement):* Feel 4 · Readability 3 · Run fit 4 · Cheapness 3 · Evidence 4

---
## 5. Comparison scorecard

Author judgement, copied from the profiles: Feel · Readability · Run fit · Cheapness · Evidence.

| # | Technique | Feel | Read. | Run fit | Cheap | Evid. | Sum |
|---|---|---|---|---|---|---|---|
| A1 | Jump from height and apex time, cut, apex hang | 5 | 5 | 5 | 5 | 5 | 25 |
| A2 | Forgiveness: coyote, buffer, corner correction, wall grace | 5 | 4 | 5 | 5 | 5 | 24 |
| A3 | Momentum: fall gravity, slow decay, jump and lift boost | 4 | 3 | 5 | 5 | 5 | 22 |
| A4 | Wall kit: stick, slide ramp, two jumps, same-wall penalty | 5 | 4 | 5 | 4 | 5 | 23 |
| A5 | Speed tech: roll-jump hyper, slide-jump, dash, one-input body | 5 | 3 | 5 | 4 | 4 | 21 |
| A6 | Controls: step input, gamepad, rebinding, one-thumb touch | 4 | 4 | 4 | 3 | 4 | 19 |
| B1 | Procedural rig: two poses, 38 ms blend, foot planting, springs | 4 | 4 | 4 | 4 | 3 | 19 |
| B2 | Squash, stretch, gated dust, trails, death burst | 5 | 4 | 4 | 5 | 5 | 23 |
| B3 | Camera: lock, look-ahead, platform snap, killbox clamp, zones | 4 | 5 | 5 | 5 | 4 | 23 |
| B4 | Synth audio: pitch jitter, footsteps, music never stops | 4 | 3 | 5 | 5 | 3 | 20 |
| B5 | UI motion: digits, deltas, results bars, input display | 3 | 5 | 5 | 5 | 3 | 21 |
| C1 | Springs and side boosters at 1.45x | 5 | 5 | 4 | 5 | 5 | 24 |
| C2 | Elements on the level clock and the record format | 4 | 4 | 5 | 4 | 4 | 21 |
| C3 | Hazards and telegraphs, the 1 s warning rule | 4 | 5 | 5 | 5 | 4 | 23 |
| C4 | Collectibles as route choice | 3 | 4 | 4 | 5 | 4 | 20 |
| C5 | Checkpoints: splits, respawn, or both | 3 | 4 | 5 | 4 | 4 | 20 |
| D1 | Clock patrollers and lenient contact | 3 | 5 | 4 | 5 | 5 | 22 |
| D2 | Chasers and bosses as races | 4 | 4 | 5 | 4 | 3 | 20 |
| D3 | Enemies as tools: bounce, refunds, shell | 5 | 4 | 5 | 4 | 4 | 22 |
| D4 | One-button slash that keeps momentum | 5 | 4 | 4 | 4 | 3 | 20 |
| E1 | Level length and the medal ladder | 3 | 5 | 5 | 5 | 5 | 23 |
| E2 | Teach, develop, twist, resolve | 4 | 5 | 4 | 4 | 4 | 21 |
| E3 | One designed skip per map | 5 | 3 | 5 | 4 | 4 | 21 |
| E4 | Readability in body lengths, blind drops | 4 | 5 | 5 | 5 | 3 | 22 |
| E5 | Seeded daily map from tagged chunks | 4 | 4 | 5 | 2 | 4 | 19 |
| E6 | Maker grammar: 20-second levels, one piece per round | 4 | 5 | 4 | 4 | 4 | 21 |
| F1 | Cost of failure: countdown-free restart | 5 | 5 | 5 | 5 | 5 | 25 |
| F2 | Ramps: visible ladder, hard part early | 4 | 4 | 5 | 5 | 4 | 22 |
| F3 | Honest expert, not troll | 3 | 4 | 5 | 5 | 4 | 21 |
| F4 | Assists and practice behind an unranked flag | 4 | 4 | 4 | 4 | 5 | 21 |
| F5 | Telemetry five testers can collect | 3 | 4 | 5 | 5 | 4 | 21 |
| G1 | Boards for a small group, season column | 3 | 5 | 5 | 5 | 4 | 22 |
| G2 | Ghosts and rivals as social objects | 5 | 4 | 5 | 4 | 4 | 22 |
| G3 | Async and live races | 4 | 3 | 5 | 3 | 4 | 19 |
| G4 | Sharing and trust: clear before publish, two-tier board | 3 | 4 | 5 | 4 | 4 | 20 |
| H1 | Step-count timer, IGT, splits in LiveSplit colours | 4 | 5 | 5 | 5 | 5 | 24 |
| H2 | Ghost formats: inputs as truth, rig-replayed track | 4 | 3 | 5 | 4 | 4 | 20 |
| H3 | Deterministic replays, re-simulation, plausibility ladder | 3 | 2 | 5 | 3 | 4 | 17 |
| H4 | Instant restart engineering, timer on first input | 5 | 5 | 5 | 5 | 4 | 24 |
| H5 | Live ghost plumbing, hash keys, share links | 4 | 3 | 4 | 3 | 4 | 18 |

**Reading the table.** Run fit separates least, because the whole study was filtered for a time attack; only the controls and the live plumbing drop to 4. Cheapness is where SpeedRunner's situation shows. The two rows at 25, the jump (A1) and the countdown-free restart (F1), cost nothing because one is already built and the other deletes code. The high-impact rows that cost real work are the daily map (E5, Cheapness 2) and the re-simulation validator (H3, Cheapness 3), and H3 also scores lowest on Readability because players never see it. Evidence is highest where source code exists (Celeste, SMB1, N++, livesplit-core, the ghost formats) and lowest where the finding rests on community reading of a game (the rig at B1, audio at B4, the chaser constants at D2, the slash at D4). Six rows tie at 23 or 24 and together they are the first month of the backlog: forgiveness (A2), the wall kit (A4), squash and dust (B2), the camera (B3), springs (C1), hazards (C3), the medal ladder (E1), the timer (H1) and the restart engineering (H4) [I].

---

## 6. Deep dives

### 6a. Jump arcs across games

Heights are converted to body lengths with the conversions in §2. SpeedRunner's apex time includes the apex band.

| Game | Jump height | Apex time | Fall gravity | Coyote | Buffer | Corner correction | Source |
|---|---|---|---|---|---|---|---|
| SpeedRunner | 138 u = 3.0 BL analytic, 135 u stepped | 332 ms analytic; stepped 350 ms with the band, 325 ms without | x1.65, max fall 1150 u/s | 100 ms | 130 ms | none today, 8 u proposed | [K; I] |
| Celeste | 28 px = 3.5 tiles = 2.5 BL | 361 ms | x1.0, launch speed pinned 0.2 s | 100 ms | in `Input.cs`, unread | 4 px = 0.5 body width | [V, S7; U] |
| Super Mario Bros. | about 67 px = 4.2 blocks = 4.2 BL | 444 ms | about x3.5 | none | none (1-frame minimum jump) | none | [V, S10, S11; I] |
| N++ | 96 px = 4.0 tiles held, 30 px = 1.25 tiles tapped | 1,125 ms held, 500 ms tapped | 6:1 held to fall gravity for up to 45 frames | 83 ms (5 frames) | 83 ms | position nudged by the jump impulse | [V, S12; I] |
| Canabalt | hold to rise at 300 px/s for up to 0.35 s; tap under 0.08 s hops at 200 | by hold | n/a | n/a | n/a | n/a | [V, S77] |
| Hollow Knight | JUMP_SPEED 16.65 u/s, prefab value | n/a | n/a | n/a | 2 steps at 50 Hz = 40 ms | n/a | [V, S13; U] |

### 6b. Forgiveness and wall windows

| Window | Celeste | N++ | SpeedRunner today | SpeedRunner proposed | Source |
|---|---|---|---|---|---|
| Coyote time | 100 ms (`JumpGraceTime`) | 83 ms (5 frames) | 100 ms (12 steps) | keep | [V, S7, S12; K] |
| Jump buffer | unread (`Input.cs`) | 83 ms | 130 ms | keep | [V, S12; K; U] |
| Wall memory | 3 px reach (0.375 body width) | 83 ms wall buffer | 80 ms wall coyote, 2 u probe | add a 7 u reach | [V, S7, S12; K; I] |
| Wall speed retention | 60 ms | n/a | none | 60 ms | [V, S7; I] |
| Ceiling grace on variable jump | 50 ms | n/a | none | 50 ms | [V, S7; I] |
| Corner correction | 4 px up and on dash (half body width) | impulse nudge for one frame | none | 8 u up and sideways (0.4 body width) | [V, S7, S12; I] |
| Air lock after wall jump | 160 ms | n/a | 150 ms | keep | [V, S7; K] |
| Wall slide profile | 20 to 160 px/s ramp over 1.2 s | friction 0.9113 per frame | 25 u/s for 100 ms, then 115 u/s flat | toggle a 25 to 115 u/s ramp over 0.8 s | [V, S7, S12; K; I] |

### 6c. Restart cost and level length

"Death to control" is measured or labelled an estimate; medal ratios are multiples of the author or par time.

| Game | Death to control | Level unit | Medal or par ratios | Source |
|---|---|---|---|---|
| Super Meat Boy | "almost instantaneous", about 0.5 s with the splat (estimate) | 10 to 20 s micro-levels, 150 light plus 150 dark | A+ par unlocks the dark twin | [V, S57, S148; I] |
| Celeste | about 1 s death animation plus room reload (estimate) | one room, respawn per room | none; strawberries and B-sides instead | [U, S195, S182; I] |
| N++ | level reset with no fade, under 0.5 s (estimate) | single screen, 5 per 5-minute episode, 90 s shared clock plus 2 s per gold | per-level gold | [V, S63, S160; I] |
| VVVVVV | instant, checkpoints several per screen | one screen | none | [V, S209] |
| Hollow Knight | `DEATH_WAIT 2.85 s` plus fade, about 3 s | rooms with benches | none | [V, S13; I] |
| Trackmania | respawn or restart in place, run starts on the next input, about 1 s | 20 s author cap (Weekly Shorts), 25-map campaigns | gold 1.06x, silver 1.2x, bronze 1.5x author | [V, S194, S25, S34; I] |
| Neon White | reset reloads the level, about 1 s (estimate) | under a minute, often under 30 s | Silver sloppy, Gold clean, Ace skip, Red beats the dev | [V, S66, S153; I] |
| Jetpack Joyride | one tap after death to replay, not timed | endless, chunked | missions, not medals | [V, S75] |
| SpeedRunner today | 0.38 s beat plus 3 s countdown = 3.4 s | 10.9 to 20.7 s of flat running, 4 maps | none | [K] |
| SpeedRunner proposed | 0.38 s beat, skippable; `R` under 150 ms | 22 to 35 s author times | gold 1.06x, silver 1.2x, bronze 1.5x author | [I] |

### 6d. Ghost and replay byte budgets

Budgets are for a 60 s run of 7,200 physics steps unless the row names a different race length.

| Method | Rate | Bytes per minute | Verifiable by re-simulation | Survives a physics patch | Source |
|---|---|---|---|---|---|
| SpeedRunner today, 18 floats as JSON | 30 Hz | about 100 KB estimated, 139 to 144 KB measured | no | yes | [K; V, S3] |
| Sandbox, full pose, JSON against delta-quantised | 30 Hz | 143.8 KB against 35.5 KB | no | yes | [V, S3] |
| Sandbox, position-only, JSON against delta-quantised | 30 Hz / 15 Hz | 27.7 KB against 7.6 KB / 13.5 KB against 3.8 KB | no | yes | [V, S3] |
| Packed state (dx, dy varints, state, phase, flags) | 30 Hz | 12.6 KB raw, 6 to 8 KB deflated | no | yes | [I] |
| Packed state, interpolated on draw | 10 Hz | 4.2 KB raw, 2.5 to 3.5 KB deflated | no | yes | [I] |
| Input run-length (3-bit state, duration varint) | per change, 2 to 5 per second | about 0.9 KB raw, 0.6 to 0.8 KB deflated | yes | no, needs map and physics hash | [I] |
| Input bitmap | 3 bits per step | 2.7 KB raw, 0.3 to 0.6 KB deflated | yes | no | [I] |
| Mario Kart Wii RKG | run-length per frame | 10,240 bytes fixed for a 2 to 3 minute race | yes (console side) | no | [V, S14] |
| Dustforce replay | 11 intent streams at 2 to 4 bits, desync data every 8 frames | not published | yes, with drift correction | partly | [V, S15] |
| Trackmania replay | inputs with timestamps, 100 Hz physics | not published | yes, in-game Validate | no | [V, S169] |

### 6e. Leaderboard and trust ladder

Cost is for the current build. S is under an hour, M a day, L several days.

| Layer | What it stops | Cost | Who does it | Source |
|---|---|---|---|---|
| Run id issued at start, quoted at submit, expires in 30 min | replayed POSTs, fabricated submits | built | server | [K] |
| Server bounds: minimum steps per map and per split, monotonic splits, wall-clock window | devtools speed edits, teleports, pasted old runs | S | server | [I] |
| Strip `window.__sr` from production | copy-paste cheats from forum posts | S | build flag | [K; I] |
| HMAC the device token into a server session | impersonation, not time cheats | S | server | [I] |
| Rate limit per token and IP | spam | S | Vercel firewall or Upstash | [V, S115, S137; I] |
| Input replay re-simulated with the same `step()` | every client-side physics or speed hack | M to L | server (Node) | [V, S169, S202; I] |
| Slowdown ratio: wall-clock over simulated time above 1.05 | Cheat Engine slowdown, the Trackmania 2021 class | S after re-simulation | server, review flag | [V, S169; I] |
| Input statistics (changes per second, frame-perfect patterns) | TAS-assisted submits | M | review flag, never auto-ban | [V, S169, S218; I] |
| A friend taps "looks legit" after watching the ghost | everything, at five players | S | the collective | [V, S127; I] |

**What it means.** Three numbers decide the race layer. The step is 8.33 ms, so an integer step count is the exact time and the only value worth sorting on. An input byte per step is 7.2 KB per minute raw and under 1 KB deflated, so the ghost, the share link and the anti-cheat record are the same file. And the restart arithmetic is brutal. The twins all restart under about 1 s and SpeedRunner's 3.4 s is the countdown, so the cheapest change in the whole study removes 3 s from every attempt. On the movement side, four unrelated games chose grace windows within 17 ms of each other, so SpeedRunner's numbers need no tuning, only a corner correction of about half a body width, which Celeste proves at 4 px and this study settles at 8 u. The byte table says the current ghost (100 KB per minute estimated, 139 to 144 KB measured) is the outlier by a factor of 20 to 400 and that inputs, not poses, are what every shipped race game stores; the Sandbox confirms the ratio, 143.8 KB per minute for the 30 Hz full pose against 3.8 KB for a 15 Hz delta-quantised position track and about 369 bytes for the input log, and its 0.1 to 0.2 ms restart against 3,400 ms [K; V, S3, S7, S12, S14, S15, S169; I].

---

## 7. Combinations: a layered architecture for SpeedRunner (Canvas2D JavaScript, 120 Hz step)

All of this section is design proposal [I], built from the cited parts. The SpeedRunner Mechanics Sandbox (§8) plays it. The architecture keeps the game's idiom. One file, a `PHYS` object for constants, a `step(dt)` that reads inputs once, run-time-driven elements, a `TUNING` object the Sandbox exposes as sliders.

**Layers, bottom to top.**
1. **Fixed-step simulation and input.** A 1/120 s step with an accumulator clamped at 0.1 s and render interpolation, as today. Keys are sampled once at the top of `step()`, one-shot presses stay sticky until a step consumes them, a level clock in integer steps drives every mover and enemy, and a seeded RNG is used for cosmetics only. No `Math.sin` in the simulated path (A6, H3).
2. **Movement kit.** The current `PHYS` numbers plus corner correction of 8 u, a 7 u wall reach, 60 ms wall speed retention, 50 ms ceiling grace, an optional slide ramp from 25 to 115 u/s over 0.8 s, a roll-jump hyper at 1.3x maxRun inside the first 100 ms of a roll, a capped lift boost from movers and a 40 u/s jump boost (A1 to A5).
3. **Collision and elements.** AABB solids with the 6-iteration resolve, one-way tiles landable from above within 3 u, movers and wheels carrying the player, a spring at 1.45x jumpVel with auto-jump, timed blocks on a 0.5 s tick with a 0.3 s pre-shake, a switch and its linked door, spikes with a 4 u inset, split checkpoints, the flag and the kill plane. Each element is `[x, y, w, h, tag, {period, phase, dir, link}]` (C1 to C5).
4. **Enemies on the level clock.** A patroller at 85 u/s with a 3 u hitbox inset and a two-step contact rule, a bounce enemy that returns a full jump, a chaser spawning at the last split 1.5 s behind at 0.85x maxRun, and a 100 ms slash with a 50x40 u hitbox that never touches vx. All reset with the run (D1 to D4).
5. **Camera.** Horizontal lock with a forward focus from 120 u at rest to 200 u at overspeed, vertical platform snap with a 60 u dead zone and a 200 ms lerp, a downward look-ahead of vy x 0.25 s capped at 200 u, a killbox clamp on `deathY`, and per-map camera zones (B3).
6. **Animation and feedback.** The stick rig with its 38 ms blend, foot planting, a (0.6, 1.4) jump stretch, a landing squash scaled by fall speed toward (1.4, 0.6) recovering at 1.75 per second, dust gated on landing speed (vy >= 575 u/s, a 40 u fall), speed lines above 0.9x maxRun, a 120 ms state flash on the kimono, a 0.3 s ragdoll on death (B1, B2).
7. **Audio.** WebAudio synth only with the current voices, ±4% pitch jitter on repeated sounds, a footstep tick per foot plant, an 8-voice cap, and a music loop that never restarts on death or `R` and ducks to one note for the duel (B4).
8. **Race loop.** An integer step timer shown to two decimals in the run and three on the board, splits with PB, golds and sum of best in LiveSplit colours, a countdown only on the first attempt after map select, timer and level clock starting together on the first input, an in-place restart under 100 ms, a 1-byte-per-step input log as the canonical ghost with a derived 15 Hz state track for the duel, a medal ladder at 1.06x, 1.2x and 1.5x of the author run, a results screen with per-section deltas and the replay pile (E1, F1, H1, H2, H4).
9. **Leaderboard and trust.** A friends board as the default view with a season column over a permanent board, a rival toast on the title screen, a pickable ghost slot in the owner's colours, content-hash board keys, server re-simulation of the submitted input log with the plausibility ladder in front of it, an unranked flag for every assist, and a share link that encodes the run in the URL fragment (F4, G1 to G4, H3, H5).

**Pseudocode.**

Constants live in one object the game already exposes as `PHYS`; the new knobs sit beside them so the Sandbox can slide them:
```js
const PHYS = {
  maxRun: 420, groundAccel: 2700, turnAccel: 5200, groundFric: 3000, overspeedDecay: 500,
  airAccel: 1900, airDrag: 160, gravity: 2500, fallMult: 1.65, apexMult: 0.55, apexBand: 90,
  maxFall: 1150, jumpVel: 830, jumpCut: 0.45, coyote: 0.10, buffer: 0.13,
  wallSlideMax: 115, wallStick: 0.10, wallCoyote: 0.08, wallJumpX: 440, wallJumpY: 790,
  wallJumpSameY: 330, wallLock: 0.15, rollFall: 230, rollTime: 0.42, rollMinSpeed: 280,
};
const TUNING = {                      // new, all toggleable in the Sandbox
  cornerCorrect: 8, wallReach: 7, wallRetain: 0.06, ceilingGrace: 0.05,
  slideRamp: false, slideRampTime: 0.8, hyperMult: 1.3, hyperWindow: 0.10,
  jumpHBoost: 40, liftCapX: 250, liftCapY: 130,
  springMult: 1.45, blockTick: 0.5, preShake: 0.3,
  patrolSpeed: 85, chaserMult: 0.85, chaserDelay: 1.5, slashMs: 100, slashW: 50, slashH: 40,
  startOnInput: true, deathBeat: 0.38, ghostHz: 15, medals: [1.06, 1.2, 1.5],
};
const DT = 1 / 120;
```

The step reads input once, consumes the one-shot press, and tries the corner nudge before cancelling a jump into a ceiling:
```js
function step(g) {
  const k = sampleKeys();                       // once per step; the render never reads keys
  const p = g.player;
  if (!g.started && (k.left || k.right || k.jumpPressed)) g.started = true;   // timer and level clock start here
  if (g.started) g.steps++;                     // integer time; ms = steps * 1000 / 120
  inputLog.push((k.left) | (k.right << 1) | (k.jump << 2) | (k.jumpPressed << 3));
  // ... run, coyote, buffer, wall logic as in the current build ...
  p.vy += gravityFor(p, k) * DT;
  moveY(p, p.vy * DT);
}

function moveY(p, dy) {
  if (!collides(p, 0, dy)) { p.y += dy; return; }
  if (dy < 0) {                                 // rising into a ceiling: try a sideways nudge first
    for (let n = 1; n <= TUNING.cornerCorrect; n++) {
      if (!collides(p, +n, dy)) { p.x += n; p.y += dy; return; }
      if (!collides(p, -n, dy)) { p.x -= n; p.y += dy; return; }
    }
  }
  resolveY(p, dy);                              // the existing bounded AABB resolve (6 iterations)
}

function moveX(p, dx) {                         // the roof-tile case: a lip a few units above the feet
  if (!collides(p, dx, 0)) { p.x += dx; return; }
  const lip = lipHeight(p, dx);                 // top of the blocking solid, relative to the feet
  if (p.vy >= 0 && lip > 0 && lip <= TUNING.cornerCorrect) { p.y -= lip; p.x += dx; return; }   // step up instead of stopping
  resolveX(p, dx);
}
```
Both nudges run before any speed is lost, so a jump that clips a ceiling corner by up to 8 u continues as if the corner were not there, and a run onto a roof tile whose top sits up to 8 u higher steps up instead of stopping. Celeste does the ceiling case with 4 px [V, S7].

Elements and enemies are pure functions of the level clock, so a replay through the same steps sees the same world:
```js
function moverPos(m, steps) {                   // no Math.sin in the sim: a 4096-entry table built with Math.fround
  const t = steps * DT;
  const ph = ((t / m.period) + m.phase) % 1;
  return m.x0 + m.dx * sinTable(ph);
}
function timedBlockSolid(b, steps) {           // 4-tick cycle: visible 2 ticks, gone 2 ticks
  const tick = Math.floor(steps * DT / TUNING.blockTick);
  return ((tick + b.seq) % 4) < 2;             // one integer per block, as in Mega Man Maker [V, S159]
}
function patrolX(e, steps) {                    // triangle wave between e.x0 and e.x1 at TUNING.patrolSpeed
  const span = e.x1 - e.x0, period = 2 * span / TUNING.patrolSpeed;
  const u = ((steps * DT) / period) % 1;
  return e.x0 + span * (u < 0.5 ? u * 2 : 2 - u * 2);
}
```

The ghost is the input log. Run-length encode it at the finish, and derive the duel track by replaying it headless:
```js
function encodeInputs(log) {                    // (state, duration) pairs, duration as a varint
  const out = []; let cur = log[0], run = 0;
  for (const b of log) {
    if (b === cur && run < 0x3fff) { run++; continue; }
    pushPair(out, cur, run); cur = b; run = 1;
  }
  pushPair(out, cur, run);
  return new Uint8Array(out);                   // a human changes input 2 to 5 times a second, about 300 pairs per minute; the Sandbox bot changed about 50 times in 20 s (110 bytes)
}
function deriveTrack(inputs, map, hz) {        // 15 Hz state track for the duel ghost
  const g = newGame(map), every = Math.round(120 / hz), track = [];
  for (let s = 0; s < inputs.length; s++) {
    stepWith(g, inputs[s]);
    if (s % every === 0) track.push(g.player.x, g.player.y, g.player.state, g.player.phase);
  }
  return track;                                 // the rig re-poses the ghost from state, vx and phase
}
```

Validation is the same `step()` in Node. The finish step must match the claimed time and the hero must reach the flag:
```js
function validateRun(sub, maps) {               // runs in /api/lb on submit
  const map = maps[sub.mapId];
  if (hashMap(map) !== sub.mapHash || hashPhys(PHYS) !== sub.physHash) return 'STALE';
  const g = newGame(map), inputs = decodeInputs(sub.inputs);
  for (let s = 0; s < inputs.length && !g.finished; s++) stepWith(g, inputs[s]);
  if (!g.finished) return 'NO_FINISH';
  if (g.steps !== sub.steps) return 'STEP_MISMATCH';
  for (let i = 0; i < 4; i++) if (g.splits[i] !== sub.splits[i]) return 'SPLIT_MISMATCH';
  return 'OK';
}
```

Plausibility checks run before the replay so the server never simulates garbage:
```js
function plausible(sub, map, startedAt, now) {
  const minSteps = Math.floor((map.finish.x - map.start.x) / PHYS.maxRun * 120);   // flat-out distance to the flag, not the map width (m1: 5760 u, 13.7 s)
  if (sub.steps < minSteps) return false;                     // faster than running flat out
  if (sub.splits.some((s, i) => i && s <= sub.splits[i - 1])) return false;
  // map.minSplitSteps[i] = floor(segmentDistance[i] / PHYS.maxRun * 120), start to checkpoint 1 then checkpoint to checkpoint;
  // the Sandbox allows a 1.6x slack because wall jumps (440 u/s) and the roll floor run a segment above maxRun for a few steps
  if (sub.splits.some((s, i) => s < map.minSplitSteps[i])) return false;
  const wall = (now - startedAt) / 1000, sim = sub.steps / 120;
  if (wall < sim - 2) return false;                           // submitted before the run could have ended
  sub.slowFlag = wall / sim > 1.05;                           // review, never auto-reject
  return true;
}
```

**Knobs.** The values the Sandbox exposes, with the current build's constants where they exist [K] and the proposed value [I].

| Knob | Now | Proposed | Range | What it moves |
|---|---|---|---|---|
| `jumpVel` / `gravity` | 830 u/s / 2500 u/s² | same | 700 to 950 / 2000 to 3200 | jump height (3.0 BL) and apex time (332 ms) |
| `cornerCorrect` | 0 | 8 u | 0 to 12 u | ceiling and ledge clips that no longer stop the run |
| `wallReach` / `wallRetain` | 2 u probe / none | 7 u / 60 ms | 0 to 12 u / 0 to 120 ms | wall jumps from a distance, speed kept after a wall hit |
| `wallStick` or slide ramp | 100 ms stick then 115 u/s | toggle, ramp 25 to 115 u/s over 0.8 s | 0.4 to 1.2 s | cost of hesitating on a wall |
| `hyperMult` / `hyperWindow` | none | 1.3x / 100 ms | 1.1 to 1.6 / 50 to 200 ms | the speed ceiling |
| `springMult` | none | 1.45x jumpVel | 1.2 to 1.8 | spring apex (6.3 BL) |
| `blockTick` / `preShake` | none | 0.5 s / 0.3 s | 0.25 to 1.0 s / 0.1 to 0.5 s | timed block rhythm and warning |
| `patrolSpeed` / `chaserMult` / `chaserDelay` | none | 85 u/s / 0.85 / 1.5 s | 40 to 200 / 0.6 to 1.0 / 0.5 to 3 s | enemy readability and pace pressure |
| `slashMs` / `slashW` x `slashH` | duel only | 100 ms / 50x40 u | 60 to 160 ms | how much a cut costs (nothing) |
| start mode / `deathBeat` | 3 s countdown / 0.38 s | first input / 0.38 s skippable | countdown or input / 0 to 0.6 s | death to control (3.4 s to 0.38 s) |
| `ghostHz` and format | 30 Hz, 18 floats | inputs plus a 15 Hz state track | 10 to 60 Hz | ghost smoothness against bytes (139 to 144 KB to about 5 KB) |
| `medals` | none | 1.06 / 1.2 / 1.5 of author | 1.0 to 2.0 | the ladder under the world record |
| camera focus / fall look-ahead | 120 u fixed / none | 120 to 200 u by speed / vy x 0.25 s, cap 200 u | 60 to 300 u | what the player sees ahead and below |
| landing dust gate | any fall over 50 u | vy >= 575 u/s (a 40 u fall; about 870 u/s for 2 BL) | 0 to 1150 u/s | which landings get dust |

---

## 8. Reference implementation: the SpeedRunner Mechanics Sandbox

`mechanics-speedrunner-sandbox.html` [S3] is one hand-written page of plain JavaScript, 112 KB with system fonts and no external assets, on a 640x360 canvas drawn as vector ink in the game's style, white paper, black solids, one red kimono, a grey ghost, not pixelated. It plays the nine layers of §7 with all 17 settled numbers applied, shows each layer's cost live, and runs with zero console errors and no horizontal overflow at a 390 px viewport [V, S3]. Its design choices are ours [I], every number is illustrative, and simulation numbers are in world units at a draw scale of 640/970 (the hero about 13x30 px) so constants copy back into the game.

**The level.** One hand-placed map about 20 s long at top speed, in teach-test-twist order: a rock, a gap and rising steps; a spring at 1.45x jumpVel with auto-jump and a 150 ms compressed frame, built as a touch trigger because a 20 u solid blocked the runner; a row of one-way roof tiles and a moving platform on the level clock; a chimney and a ledge drop that rolls; timed blocks on a 0.5 s tick, 2 ticks on and 2 off, one `seq` integer each, pre-shake in the last 0.3 s, under a spike ceiling; a patroller at 85 u/s with a 3 u inset and two-step contact, slashable (100 ms, 50x40 u, air usable, jump cancels) or stompable at full jumpVel; a chaser at 0.85x maxRun spawning at checkpoint 4 1.5 s after the split; a flag, four split checkpoints and a kill plane. A tiny practice room (one gap, one wall) sits behind a button [V, S3].

**Toggles and presets.** 73 buttons, each clicked once in the test. Every §7 technique switches off: coyote, buffer, variable jump, apex hang, fall gravity, corner correction (8 u), wall reach (7 u), 60 ms wall speed retention (the pre-impact |vx| kept for the next wall jump), 50 ms ceiling grace (a bump that keeps vy), the slide ramp (off by default), roll-jump hyper, lift and jump boosts, the spring, the timed block, enemies, slash-stops-you, each camera rule (focus 120 to 200 u, downward look-ahead vy x 0.25 s capped at 200 u, deathY clamp), each feedback layer with a Juice slider, music-restarts-on-death, the 60 Hz step. Presets: "SpeedRunner today" (countdown restart, no corner correction, no enemies, 30 Hz ghost), "Recommended", "No forgiveness", "Floaty" (gravity x0.6, no fall multiplier) and "Heavy". Slow motion, invincible and infinite coyote keep simulated time on the timer, flag the run "assisted", and the board rejects it [V, S3].

**The race loop.** An integer step timer (two decimals in the run, three on results and the board), timer and level clock starting on the first horizontal or jump input, the countdown only on the first attempt after map select, a skippable death beat, `R` resetting in place in 0.1 to 0.2 ms against 3,400 ms for the countdown-replay mode. Splits in LiveSplit colours against the session best. The canonical ghost is the run-length input log, 2,148 steps = 2.1 KB raw and 110 bytes encoded for a 17.48 s run (about 369 bytes per minute), with a drawn track at 15 Hz by default and 10, 20, 30 or 60 Hz, position-only (a grey capsule) or full pose, JSON or delta-quantised, with a live byte counter: 15 Hz position 13.5 KB per minute as JSON and 3.8 KB quantised, full pose 70.1 and 19.1 KB; 30 Hz full pose 143.8 and 35.5 KB; 60 Hz 287 and 69.3 KB. Medals 30 / 24 / 21.2 / 20 s [V, S3].

**The board and the validation panel.** A friends board of five seeded names showing "n of N", the gap in ms, the date and the input device, with a "rival beaten" toast. The validation panel runs the plausibility checks (minimum-steps bound, per-split minimums, maximum speed, step count against time, the slowdown ratio flagged above 1.05) and re-simulates the recorded inputs headless at the finish; 2,098 to 2,148 inputs replayed in about 6.7 ms with PASS at 120 Hz, at 60 Hz and under the "SpeedRunner today" preset. A share button encodes map id, time and splits as base64url in the URL hash [V, S3].

**Controls, views and HUD.** A/D or arrows, Space/W/Up jump, X or J slash, R restart, P pause, M slow motion, V cycles views (normal, hitboxes with the camera dead zone and the visible-landing line, an input strip, cost), G toggles the ghost; touch zones and buttons on coarse pointers. Per-layer timings against a 16.7 ms bar: a frame costs 0.2 to 0.5 ms on an Apple M4 Pro in headless Chromium, simulation and collision under 0.05 ms each, render 0.15, UI 0.07 to 0.12, plus counters for steps per frame, particles, ghost bytes, inputs recorded and the replay check [V, S3].

**Thumbnail.** The `data-demo="showcase"` button forces juice and animation on, freezes a frame mid wall jump off the chimney with dust and speed lines, the grey ghost one step behind, the timer and a green split delta, then restores the toggles.

**Simplifications (honest list)** [I]. One page plays client and server; validation re-simulates locally and bytes are counted, not sent. The friends are seeded names. One level, so medal ratios are illustrative. The rig is a simplified copy of the game's. The autopilot's slowdown ratio reads 0.015 because it runs faster than real time; a real player sits near 1.0. All figures are one desktop machine; no phone was measured.

---

## 9. Gem findings

Licences and maturity figures come from the GitHub REST API (`license.spdx_id`, stars, `pushed_at`) and the npm registry on 13 Nov 2026, with LICENSE text read where GitHub reports `NOASSERTION` [V, S6]. Three traps. Celeste's `Player.cs` is MIT but the licence "does not include the actual commercial Celeste game or assets" [V, S8]. The Mario reimplementations that teach the most (Mari0, meth-meth-method's super-mario) have no LICENSE file, so read them and copy nothing. The Mario Maker 2 dataset is CC BY-NC-SA, non-commercial and share-alike. Licences were read from LICENSE files on 13 Nov 2026. **Flags:** **Low** = MIT/BSD/Apache/CC0; **LGPL** = fine as a separate library; **Copyleft** = GPL/AGPL/CC BY-SA, study and re-implement; **None** = no licence, study only.

| Name | URL | Licence | Maturity | Good for | Flag |
|---|---|---|---|---|---|
| Celeste Player.cs | https://github.com/NoelFB/Celeste | MIT (code only, not game assets) | 4,002 stars, archived Oct 2022 | Every movement constant: coyote 0.1 s, corner correction 4 px, apex half-gravity 40 px/s, wall lock 0.16 s | Low |
| LittleJS | https://github.com/KilledByAPixel/LittleJS | MIT | 4,383 stars, npm 1.30.1 Nov 2026 | Dependency-free platformer example with tiles and movers, the closest architecture to SpeedRunner's | Low |
| collision-2d | https://github.com/mreinstein/collision-2d | MIT | 142 stars, pushed Aug 2026 | A swept AABB function small enough to copy | Low |
| mariohtml5 | https://github.com/robertkleffner/mariohtml5 | Unlicense | 534 stars, pushed Dec 2022 | Infinite Mario in Canvas JS, copyable | Low |
| Mari0 | https://github.com/Stabyourself/mari0 | No LICENSE file | 785 stars, pushed Nov 2026 | SMB-faithful physics and an in-game editor, reading only | None |
| nclone | https://github.com/SimonV42/nclone | Not checked (see §12) | N++ reimplementation in Python | Published ninja constants: 83 ms buffers, 6:1 held gravity, wall jump vectors | None |
| livesplit-core | https://github.com/LiveSplit/livesplit-core | MIT or Apache-2.0 | 230 stars, pushed Nov 2026; npm 0.10.2 stale (2018) | WASM timer, parsers for 16 split formats including `.lss`, default colours | Low |
| LiveSplit One | https://github.com/LiveSplit/LiveSplitOne | MIT | 306 stars, pushed Nov 2026 | Web timer UI reference, comparisons PB, best segments, average | Low |
| racetime.gg | https://github.com/racetimeGG/racetime-app | GPL-3.0 | 48 stars, pushed Feb 2023 | Race rooms, ready checks, countdowns, finish ordering | Copyleft |
| speedrun.com API | https://github.com/speedruncomorg/api | Docs: no LICENSE; data CC BY-NC 4.0 | 380 stars, pushed Oct 2026 | World records of twin games, 100 requests per minute per IP, 200 per page | Copyleft (NC) |
| bryc PRNGs | https://github.com/bryc/code | Public domain (LICENSE.md) | 345 stars, pushed Jan 2026 | mulberry32, sfc32, xoshiro128** as one-liners for a seeded daily | Low |
| netplayjs | https://github.com/rameshvarun/netplayjs | ISC | 577 stars, pushed Oct 2024 | Lockstep and rollback patterns, state checksums for input-stream replays | Low |
| BizHawk .bk2 | https://tasvideos.org/Bizhawk/BK2Format | BizHawk MIT | 2,820 stars, pushed Nov 2026 | A text input-log format model, one line per frame | Low |
| @upstash/redis | https://github.com/upstash/redis-js | MIT | 985 stars, npm 1.41.0 Nov 2026 | `ZADD`, `ZRANK`, `ZRANGE` leaderboard over HTTP from a Vercel function; free 500K commands a month | Low |
| @upstash/ratelimit | https://github.com/upstash/ratelimit-js | MIT | 2,052 stars, npm 2.2.1 Nov 2026 | Sliding-window limits in edge functions | Low |
| Supabase | https://github.com/supabase/supabase | Apache-2.0 | 114,974 stars; free 500 MB, 200 realtime connections | Postgres board with seasons as a column, Realtime Broadcast for live ghosts | Low |
| obscenity | https://github.com/jo3-l/obscenity | MIT | 188 stars, npm 0.4.6 Jan 2026 | Leetspeak-aware name filter for the name claim | Low |
| PartyKit | https://github.com/partykit/partykit | MIT | 5,747 stars, pushed Oct 2026 | Rooms on your own Cloudflare account (hosted status unconfirmed, §12) | Low |
| PeerJS | https://github.com/peers/peerjs | MIT | 13,515 stars, npm 1.5.5 Jun 2025 | Serverless two-player ghost race over WebRTC data channels | Low |
| ZzFX | https://github.com/KilledByAPixel/ZzFX | MIT | 813 stars, npm 1.4.0 Oct 2026 | Tiny SFX synth, a 20-parameter array per sound, web designer | Low |
| jsfxr | https://github.com/chr15m/jsfxr | Unlicense | 466 stars, npm 1.4.1 May 2026 | sfxr designer and player, URL-shareable presets | Low |
| LDtk | https://github.com/deepnight/ldtk | MIT | 4,921 stars, pushed Nov 2026 | Level editor with a single JSON file that exports to `[x, y, w, h, tag]` in about 40 lines | Low |
| Tiled | https://github.com/mapeditor/tiled | GPL app, BSD libtiled | 13,058 stars, pushed Nov 2026 | Editor and documented JSON map format; copying app code is GPL | Copyleft (app) |
| lz-string | https://github.com/pieroxy/lz-string | MIT | 4,446 stars, npm 1.5.0 Mar 2023 | `compressToEncodedURIComponent` for level sharing in a URL hash | Low |
| Loenn | https://github.com/CelestialCartographers/Loenn | MIT | 240 stars, pushed Nov 2026 | Celeste's `.bin` map format and entity set | Low |
| Playwright | https://github.com/microsoft/playwright | Apache-2.0 | 100,092 stars, npm 1.65.0 Nov 2026 | Drive `__sr.step` bot runs in CI as TAS-style regression tests | Low |
| Mario Maker 2 dataset | https://huggingface.co/datasets/TheGreatRambler/mm2_level | CC BY-NC-SA 4.0 | 26.5 M levels, 564 M deaths with positions, Feb 2022 | Death positions against level grammar, the only heatmap-scale source found | Copyleft (NC-SA) |

---
## 10. Learnings and anti-patterns

1. **Design the jump from height and apex time, then leave it alone** [V, S60; K]. Anti-pattern: the LittleBigPlanet ragdoll jump, floaty for six years [V, S81].
2. **Forgive a few frames and half a body width, never more** [V, S7, S12]. Anti-pattern: SMB1's frame-exact wall jump [V, S11].
3. **Make the restart free and the run time the only penalty** [V, S57]. Anti-pattern: a 3 s countdown on every death [K; I].
4. **Give the player one speed move with a cost and let overspeed decay slowly** [V, S7]. Anti-pattern: a roll that keeps 280 u/s under a 420 u/s cap [K; I].
5. **Stretch on take-off, squash by fall speed, dust only on real landings** [V, S7]. Anti-pattern: dust on every hop and a 2 to 4 frame wind-up before the jump [I].
6. **Lock the camera sideways, snap it vertically, and never let the kill line into the view** [V, S7, S59]. Anti-pattern: a lerped horizontal camera that hides the next hazard at 420 u/s [I].
7. **Put every element on the level clock with a pre-animation and one readable rule** [V, S159; K]. Anti-pattern: a random enemy, unfair to the ghost duel [I].
8. **Add enemies only as tools that give something back** [V, S93, S9]. Anti-pattern: a health bar on a boss in a leaderboard game [I].
9. **Record a developer run as the author time and hang 1.06x, 1.2x and 1.5x medals off it** [V, S34, S66]. Anti-pattern: medals set from the world record [V, S68].
10. **Introduce one atom per screen and put the hard part early in a full-restart map** [V, S85, S63, S89]. Anti-pattern: a 9-spike map after two maps with 2 spikes each [K; I].
11. **Keep trolls in the lobby and make the expert map honest kaizo** [V, S88, S89, S151]. Anti-pattern: a surprise death that teaches memorisation instead of skill [I].
12. **Store inputs as the ghost, re-simulate on the server, and keep `Math.sin` out of the physics** [V, S14, S169, S125]. Anti-pattern: trusting a `ms` number from the browser [V, S173].
13. **Treat five names as a feed with medals, a weekly seed and a rival toast** [V, S26, S66]. Anti-pattern: a daily board with two entries, which looks dead [I].
14. **Build the phone version as a one-thumb game with its own board** [V, S91, S76]. Anti-pattern: a virtual d-pad under a 100 ms coyote window [I].

---

## 11. "See it in action" index

| # | Game | Mechanic idea | URL |
|---|---|---|---|
| 1 | Celeste | Coyote 100 ms, corner correction 4 px, pinned 0.2 s jump, wall slide ramp | https://github.com/NoelFB/Celeste/blob/master/Source/Player/Player.cs |
| 2 | Celeste | Stretch (0.6, 1.4), fall-scaled squash, dust gated on half max fall | https://github.com/NoelFB/Celeste/blob/master/Source/Player/Player.cs |
| 3 | Celeste | Assist Mode as named options, unranked by rule | https://www.vice.com/en/article/celeste-difficulty-assist-mode |
| 4 | Super Mario Bros. | Goomba at 1/5 run speed, 30 Hz contact, 21-frame rule | https://6502disassembly.com/nes-smb/SuperMarioBros.html |
| 5 | Super Mario Bros. | Hold-dependent gravity, 4.2-block jump | https://datacrystal.tcrf.net/wiki/Super_Mario_Bros.:Notes |
| 6 | N and N++ | 83 ms grace windows, 6:1 held gravity, 90 s clock plus 2 s per gold | https://github.com/SimonV42/nclone/blob/master/nsim.py |
| 7 | N++ | One element per level, 5x20 grid, 20 episodes open | https://blog.playstation.com/?p=145712 |
| 8 | Super Meat Boy | Almost instantaneous respawn, action never stops, replay pile | https://www.gamedeveloper.com/game-platforms/-i-super-meat-boy-i-s-mcmillen-explains-why-so-hard- |
| 9 | Super Meat Boy Forever | Two buttons, jump and slide, on phones | https://www.pcgamesinsider.biz/indie-interview/66238/we-wanted-it-to-have-two-buttons-and-still-feel-and-play-like-super-meat-boy/ |
| 10 | Getting Over It | Cursor hammer, one input one body, no checkpoints | https://www.gamedeveloper.com/design/pain-difficulty-and-getting-over-it |
| 11 | Getting Over It | The fall as the cost, encouraging narration | https://www.gamedeveloper.com/design/designer-interview-the-aesthetics-of-frustration-in-i-getting-over-it-i- |
| 12 | Doodle Jump | One new power-up per new hazard, live height markers | https://www.pocketgamer.biz/bouncing-ever-upwards-the-making-of-doodle-jump/ |
| 13 | Doodle Jump | Tilt and tap, springs and trampolines | https://en.wikipedia.org/wiki/Doodle_Jump |
| 14 | Jetpack Joyride | One button, three hazards with distinct warnings, three missions | https://www.gdcvault.com/play/1015527/ |
| 15 | Jetpack Joyride | Mission ladder by session length, one tap to replay | https://adriancrook.com/?p=4709 |
| 16 | Solipskier | Finger draws the slope, next gate previewed, music cuts to wind | https://en.wikipedia.org/wiki/Solipskier |
| 17 | LittleBigPlanet | Physics-first character, the floaty jump | https://www.gamedeveloper.com/game-platforms/gdc-how-sackboy-learned-to-love-physics |
| 18 | LittleBigPlanet | Hearts and Mm Picks as curation, 8 million levels | https://www.mediamolecule.com/blog/article/mm_picks5 |
| 19 | Cat Mario / Syobon Action | Betrayed conventions, learned once | https://en.wikipedia.org/wiki/Syobon_Action |
| 20 | I Wanna Be the Guy | Traps tuned to expected deaths, room to breathe | https://kayin.moe/iwbtg/faq.html |
| 21 | Kaizo Mario World | Hard and honest, every miss a death | https://en.wikipedia.org/wiki/Kaizo |
| 22 | Fall Guys | Obstacles first, readable from afar, 80% skill 20% chaos, no enemies | https://gamesradar.com/fall-guys-interview |
| 23 | Fall Guys | 60-player shows, qualifying cuts, seasons | https://en.wikipedia.org/wiki/Fall_Guys |
| 24 | Super Mario Maker | Clear it before you upload it | https://microsite.nintendo-europe.com/super-mario-maker-manual/enGB/page_05.html |
| 25 | Super Mario Maker | Checkpoint Flag, 2 per course since Nov 2015 | https://www.mariowiki.com/Checkpoint_Flag |
| 26 | Super Mario Maker 2 | 20-second speedrun levels on the On/Off switch | https://www.vice.com/en/article/20-second-gauntlets-of-death-are-the-hottest-trend-in-mario-maker-levels/ |
| 27 | Super Mario Maker 2 | Clear rate median 25%, 26.6 M levels | https://arxiv.org/html/2507.21078v1 |
| 28 | Super Mario Maker (Team 0%) | A community verifies every uncleared course | https://en.wikipedia.org/wiki/Team_0%25 |
| 29 | Ultimate Chicken Horse | One piece per round, no points if all or none finish | https://cleverendeavourgames.freshdesk.com/support/solutions/articles/32000028991-custom-rules-and-presets |
| 30 | Ultimate Chicken Horse | Seven new blocks per major update | https://www.cleverendeavourgames.com/changelog |
| 31 | Trackmania | Weekly Shorts 20 s author cap, landing visible | https://doc.trackmania.com/create/map-review/weekly-shorts-guidelines/ |
| 32 | Trackmania | Medals at 1.06x, 1.2x, 1.5x author | https://openplanet.dev/plugin/defaultmedals |
| 33 | Trackmania | Load any record's ghost with one click | https://doc.trackmania.com/play/watch-replays |
| 34 | Trackmania | Inputs as replays, Validate, the 2021 slowdown investigation | https://donadigo.com/tmx1 |
| 35 | Trackmania | Cup of the Day knockout rounds | https://doc.trackmania.com/play/how-to-play-cotd/ |
| 36 | Neon White | Medals from dev ghosts with injected hesitation, skips hinted after Gold | https://www.vice.com/en/article/neon-whites-developers-being-too-good-at-their-own-game-caused-real-problems/ |
| 37 | Neon White | Friend times after the first attempt, 0.06 s cheats at launch | https://kotaku.com/neon-white-speedrunning-cheaters-annapurna-interactive-1849115456 |
| 38 | SpeedRunners | Four racers, screen-edge elimination, catch-up items | https://en.wikipedia.org/wiki/SpeedRunners |
| 39 | VVVVVV | Checkpoints several per screen, zero-time restart | https://boingboing.net/2010/01/13/get-this-flipping-ou.html |
| 40 | Canabalt | Gaps from speed, jump hold 0.35 s, specials every 3 to 8 buildings | https://gamedeveloper.com/design/tuning-canabalt |
| 41 | Mega Man | Appearing Blocks on a 1 s tick | https://megaman.fandom.com/wiki/Appearing_Block |
| 42 | Mario Kart Wii | 10,240-byte input ghosts, rival and friend ghosts | https://mkwiiki.org/wiki/RKG_(File_Format) |
| 43 | Dustforce | Attack independent of momentum, intent-stream replays | https://dustmaker.readthedocs.io/en/stable/_modules/dustmaker/replay.html |
| 44 | Shovel Knight | 4.5-tile drop bounce, frustration-free rules | https://yachtclubgames.com/blog/plague-knight-mobility-design |
| 45 | Katana ZERO | Deflect at full speed, roll invulnerability | https://primagames.com/featured/katana-zero-preview-bleeding-cool |
| 46 | Hollow Knight | 40 ms jump queue, 2.85 s hazard death wait | https://github.com/AminSedaghaty/HK-Source/blob/f516282143970c48bcb25b695489ec0855b3b837/CSharp/HeroController.cs |
| 47 | Spelunky | Daily seed, one attempt, own board | https://gamedeveloper.com/business/-i-spelunky-i-s-new-daily-challenge-destined-to-infuriate-engage-players |
| 48 | Super Mario Run | One hand, tap to jump, hold for height | https://www.shacknews.com/article/96686/shigeru-miyamoto-on-super-mario-run-were-not-just-making-a-simple-or-easy-mario-game |
| 49 | LiveSplit | Golds, sum of best, four delta colours | https://livesplit.org/components/ |
| 50 | SpeedRunner | The game today: 120 Hz step, 3.0 BL jump, 3.4 s restart, 30 Hz ghost | https://speedrunner-tau.vercel.app/ |

---

## 12. What remains unverified (and corrections)

**Corrections made during research** (checked in the verification note)
1. **Super Mario Maker checkpoints.** The brief said one Checkpoint Flag per course in SMM1. The update of 4 Nov 2015 allows 2 per course, one in the main area and one in the sub-area, and a course with a checkpoint must be clearable from it before upload [V, S155].
2. **Vercel WebSockets.** One note called them "available on all plans". Vercel's docs (updated 6 Jul 2026) describe WebSocket support in Functions as a public beta that needs Fluid Compute, pins a connection to one instance and closes it at the function's max duration; a GA claim appears only in a community weekly [V, vendor, S40; U, S204].
3. **PartyKit.** The gems note reported a hosted-platform shutdown on 23 Oct 2026. No shutdown notice could be confirmed; Cloudflare acquired PartyKit and said existing projects keep working, and the code is MIT and runs on your own Cloudflare account [V, S53, S137; U].
4. **LittleBigPlanet level count.** "10 million levels" could not be sourced; over 8 million across the series is the best verified figure, and Wikipedia says "over 10 million" at shutdown [V, S197; U, S142].
5. **Trackmania Royal.** One note called Royal maps generated. They are authored sections of rising difficulty, not procedural [V, S29].
6. **Ultimate Chicken Horse 2026 update.** Version 1.13.13 is the May 2026 tenth-anniversary update (a falling block, a dance mover, new characters); Ultimate Sheep Raccoon (Dec 2025) is a different game and its block numbers are not mixed in [V, S23, S56].
7. **Trackmania Weekly Shorts.** The 20 s author cap is confirmed and dated 10 Mar 2025, down from a 10 to 35 s range [V, S25, S55].
8. **Sandbox spec.** This report changes several spec numbers (spring 1.45x, block tick 0.5 s, patroller 85 u/s, chaser delay 1.5 s, slash 100 ms and 50x40 u, bounce at full jumpVel, ghost as inputs plus a 15 Hz track, medals 1.06/1.2/1.5, restart on first input, dust gate, slide ramp toggle); the dated list is at the end of `SANDBOX-SPEC.md`. The built Sandbox records its deviations: the spring is a touch trigger, ceiling grace is a bump in the first 50 ms that keeps vy, wall speed retention keeps the pre-impact |vx| for 60 ms for the next wall jump, the chaser checkpoint sits in `TUNING.en.chaserCp`, the position-only ghost draws as a grey capsule, and assisted runs are flagged and rejected by the board [V, S3].

**Corrections from the figures** (two figure agents ported the §7 pseudocode and the game's constants and ran them headless)
1. The analytic jump height is 830² / (2 x 2500) = 138 u, not 139; §1 and 6a now say 138 u.
2. Stepped at 1/120 s with gravity applied in the launch step, the apex sits at 350 ms with the band and 325 ms without (135 and 134 u), so the band adds about 25 ms stepped; 332 ms is the analytic figure. A1, §1 and 6a say which is which.
3. One-way roof tiles pass from below, so SpeedRunner's corner case is a raised lip when running onto the next tile, not a ceiling clip; A2 and §7 now say so, and `moveX` in §7 steps up onto a lip within 8 u.
4. 6c marks Jetpack Joyride's one-tap replay "not timed".
5. The 575 u/s dust gate is reached after a 40 u (0.87 BL) fall, not 2 BL, so it replaces the 50 u rule with a speed rule rather than tightening it; a 2 BL drop lands at about 870 u/s. §1, B2, §7 layer 6 and the knob table are consistent.
6. A3 notes the stepped 19 and 17 steps beside the analytic 156 and 140 ms.
7. A5 states the hyper's lower arc as 0.75 x jumpVel (622 u/s), the figures' value, a design proposal.
8. E4's gap tiers were wrong: a held full-speed jump clears 6.25 BL (288 u), a standing jump from the edge about 4.75 BL under air acceleration, and the widest gap in the current maps is 180 u; the tiers are now safe at most 4 BL, momentum 4 to 5.5 BL, never above 6 BL.
9. E4's blind-drop rule names the mechanism, the 5 per second camera lerp with 207 u visible below the feet when settled.
10. `plausible()` derives `minSteps` from `map.finish.x - map.start.x`, since every finish sits inside the width (m1 would have rejected a 13.7 s flat-out run against a 16.3 s minimum), and defines `map.minSplitSteps[i]` with the Sandbox's 1.6x slack for wall jumps.
11. The bounds catch crude speed hacks such as `maxRun = 2000`; only a pace-preserving edit such as `jumpVel = 1000` needs the replay (H3 against 6e).
12. `encodeInputs` labels "about 300 pairs" a human estimate; the Sandbox bot changed input about 50 times in 20 s.
13. The game's 30 Hz ghost measures 139 to 144 KB per minute; the 100 KB figure was the build's low estimate (Context, H2, 6d, §1).
14. C3's warning threshold is about 200 u/s of closing speed for under 1 s of visibility, not 400 u/s.
15. F2's waste arithmetic includes the 3.4 s restart and now says so.
16. THE DUNGEON is 4580 u, 10.9 s flat and vertical, so the map range is 10.9 to 20.7 s (Context, §1, E1, 6c).
17. E6 defines Ultimate Chicken Horse's Postmortem, Coin and Comeback rules.

**Single-source and derived values.** Celeste's jump height, apex and fall times are arithmetic from its constants; SMB1's jump uses one gravity pair, the speed tiers unfetched [I; U]. The body-length table (E4) derives from `PHYS` [I]. The 6d budgets are arithmetic except the Mario Kart Wii file size [I; V, S14]. The Trackmania medal ratios come from a plugin description and one Track of the Day post [V, S34, S177].

**Still unverified [U]**
- Celeste's Seeker constants (patrol 25 px/s, sight 160 px, charge 180 to 260 px/s) and the Badeline chaser delay of about 1.55 s, recalled from decompiled code.
- Celeste's jump buffer (`Input.cs`), `PlayerDeadBody` timings and `CameraOffsetTrigger` units.
- Measured death-to-control for Super Meat Boy, Celeste, N++, Hotline Miami, Trackmania 2020 and Neon White; 6c labels them estimates.
- Sonic's camera window sizes, slope factors and after-image rules (Sonic Retro was behind a bot wall).
- Katana ZERO's slash frames and roll invulnerability; Hollow Knight's prefab speeds (RUN_SPEED 8.3, JUMP_SPEED 16.65, DASH_SPEED 20) and pogo window.
- Dustforce's refund rule and in-game replay browsing of any board entry; Downwell's recharge numbers.
- Super Meat Boy's par derivation, particle counts and wall-slide numbers; only the 1/20 s wall grace is published.
- Doodle Jump's spawn rules and jump height; Jetpack Joyride's own chunk sizes and speed ramp (the chunk numbers are an academic reconstruction); Canabalt's figures are for the Flash version.
- Mario Maker's Endless cutoffs, Yamamura's Dojo lesson count, part counts per version, death-marker rules.
- Fall Guys' qualifying table per round, jump and dive numbers, and camera statements.
- LittleBigPlanet's race gate formula and jump numbers; Ultimate Chicken Horse's level sharing and block count.
- Trackmania's ghost sample period (often quoted as 100 ms), finish-time interpolation, and Nadeo's documentation of the zone ladders.
- racetime.gg's countdown as a rule; Ably's free caps; PeerJS server limits; Vercel's Hobby max duration for WebSockets.
- "Fun at 70% completion" has no primary source; Super Meat Boy's music continuity is consensus around McMillen's statement about action.
- speedrun.com's Getting Over It board returned 403; the any% times near one minute are approximate.
- nclone's licence file was not checked; treat it as read-only until it is.
- No phone, gamepad, Firefox or Safari run was measured; the Sandbox figures are desktop Chromium.

---

## 13. Prototype roadmap for SpeedRunner: a ranked backlog

Impact is 1 to 5 for the game's feel and its race loop. Cost is S (about a day), M (about a week) or L (several weeks), scored 1, 2, 3. Score is Impact divided by Cost. Author judgement [I].

| Rank | Change | Profiles | Impact | Cost | Score | Why |
|---|---|---|---|---|---|---|
| 1 | Instant restart without the countdown; timer and level clock start on first input; 0.38 s death beat skippable | F1, H4 | 5 | S | 5.0 | Removes 3 s from every attempt; the genre norm is under 1 s |
| 2 | Corner correction 8 u, wall reach 7 u, 60 ms wall speed retention, 50 ms ceiling grace | A2 | 4 | S | 4.0 | The one visible omission in the forgiveness set; about 20 lines |
| 3 | Step-count timer, golds and sum of best, LiveSplit colours, `.lss` export | H1, B5 | 4 | S | 4.0 | Exact time, the convention every runner reads |
| 4 | Medal ladder per map from a recorded author run at 1.06x, 1.2x, 1.5x; unlock SAMURAI TRIAL on golds | E1, F2 | 4 | S | 4.0 | A target for everyone who is not the record holder |
| 5 | Friends board as default, around-me row, season column over a permanent board, rival toast | G1, G2 | 4 | S | 4.0 | Five names become a feed |
| 6 | Jump stretch, fall-scaled squash, dust gated on half max fall, 120 ms state flash | B2 | 3 | S | 3.0 | Celeste's three layers on a rig that already poses itself |
| 7 | Section death telemetry on submit, death heatmap in the dev build, replay pile on results | F5 | 3 | S | 3.0 | Five testers can see a wall after one night |
| 8 | Roll-jump hyper at 1.3x maxRun, capped lift boost, 40 u/s jump boost | A5, A3 | 3 | S | 3.0 | Creates a speed ceiling with no new input |
| 9 | Practice from checkpoint and slow motion behind an unranked flag | C5, F4 | 3 | S | 3.0 | Cuts retry cost for learners without touching the board |
| 10 | Input log at 1 byte per step, deterministic sin, server re-simulation, plausibility bounds | H2, H3 | 5 | M | 2.5 | One change gives the 1 KB ghost, the share link and the only real anti-cheat |
| 11 | A chaser or clock enemy, a bounce enemy, lenient contact | D1, D2, D3 | 4 | M | 2.0 | Pace pressure and route tools, deterministic on the level clock |
| 12 | Spring 1.45x, timed block on a 0.5 s tick, switch and door, the element record format | C1, C2, C3 | 4 | M | 2.0 | New elements with clocks and pre-animations |
| 13 | Pickable friend ghost in owner colours, rig-replayed from a 15 Hz track | G2, H2 | 4 | M | 2.0 | The duel against a friend's shadow |
| 14 | One-button slash with a cuttable element | D4 | 3 | M | 1.5 | The katana earns its place outside the duel |
| 15 | One-thumb touch mode with its own maps and board, gamepad support | A6 | 4 | L | 1.3 | The phone build is a different game and needs its own board |
| 16 | Seeded daily map from 30 to 40 tagged chunks, proved by a headless bot | E5, E6 | 4 | L | 1.3 | A reason for five friends to open the game on the same day |

**The first four weeks.** Week one is ranks 1 to 3: delete the countdown, add the forgiveness constants, switch the timer to steps, measure death to control with a 240 fps phone camera before and after. Week two is ranks 4 to 6: author runs and medals on the four maps, the card order, the stretch and dust gate, the friends board. Week three is rank 10, the input log and Node validator with the determinism test in CI, since everything social depends on a trustworthy ghost. Week four is ranks 7 to 9 plus a playtest night for the first death heatmap. Enemies, elements, the slash, touch and the daily map follow, each with a Sandbox toggle before a map [I].

---

## 14. Sources

Numbered for [S#] references, all from research notes 00 to 13 and the lead's verification note. "Snippet" means the page was not read in full. Code and docs were read on 13 Nov 2026.

**Series and Kingsfoil**
1. Kingsfoil Artifacts library: https://kingsfoil-artifacts.netlify.app
2. SpeedRunner, live build, bundle read 13 Nov 2026: https://speedrunner-tau.vercel.app/
3. SpeedRunner Mechanics Sandbox: `mechanics-speedrunner-sandbox.html` (companion page)
4. Curves #1 Hearthguard and the Curves glossary: https://kingsfoil-artifacts.netlify.app/curves-hearthguard.html
5. Game feel #2, Combat juice: https://kingsfoil-artifacts.netlify.app/feel-combat-juice-topdown-pixel.html
6. Research notes 00 to 13 of this study (verification, current build, movement, animation and camera and audio, elements, enemies, map design, difficulty, social, race infrastructure, named games, gems, controls, procgen and rigs): `studies/mechanics-speedrunner/notes/`

**Primary code and data**
7. Celeste `Player.cs` (NoelFB/Celeste, MIT): https://github.com/NoelFB/Celeste/blob/master/Source/Player/Player.cs
8. NoelFB/Celeste README and licence note: https://github.com/NoelFB/Celeste
9. Doppelganger's commented Super Mario Bros. disassembly: https://6502disassembly.com/nes-smb/SuperMarioBros.html
10. Data Crystal, Super Mario Bros. RAM map and notes: https://datacrystal.tcrf.net/wiki/Super_Mario_Bros./RAM_map ; https://datacrystal.tcrf.net/wiki/Super_Mario_Bros.:Notes
11. TASVideos, Super Mario Bros. game resources: https://tasvideos.org/GameResources/NES/SuperMarioBros
12. nclone, N++ physics reimplementation (`nsim.py`): https://github.com/SimonV42/nclone/blob/master/nsim.py
13. Hollow Knight `HeroController.cs` decompile mirror: https://github.com/AminSedaghaty/HK-Source/blob/f516282143970c48bcb25b695489ec0855b3b837/CSharp/HeroController.cs
14. Mario Kart Wii RKG ghost file format: https://mkwiiki.org/wiki/RKG_(File_Format)
15. dustmaker replay module (Dustforce intent streams): https://dustmaker.readthedocs.io/en/stable/_modules/dustmaker/replay.html
16. livesplit-core `general_settings.rs` (default colours): https://raw.githubusercontent.com/LiveSplit/livesplit-core/master/src/layout/general_settings.rs
17. Celeste save file docs, FileTime (100 ns ticks): https://frissyn.gitbook.io/celeste-saves/topics/filetime
18. WiiUBrew, Cdt (Super Mario Maker course format): https://wiiubrew.org/wiki/Cdt
19. TheGreatRambler, Mario Maker 2 level and deaths datasets: https://huggingface.co/datasets/TheGreatRambler/mm2_level ; https://huggingface.co/datasets/TheGreatRambler/mm2_level_deaths
20. Phrack 72, SMM2 course size and Kaitai spec: https://phrack.org/issues/72/18
21. TASVideos submission 6217, Celeste TAS (Speedrun Clock File mode, freezes): https://tasvideos.org/6217S
22. TASVideos, BizHawk .bk2 movie format: https://tasvideos.org/Bizhawk/BK2Format
23. Clever Endeavour Games, Ultimate Chicken Horse change log: https://www.cleverendeavourgames.com/changelog
24. Clever Endeavour support, custom rules and presets: https://cleverendeavourgames.freshdesk.com/support/solutions/articles/32000028991-custom-rules-and-presets
25. Ubisoft Nadeo, Weekly Shorts mapping guidelines: https://doc.trackmania.com/create/map-review/weekly-shorts-guidelines/
26. Trackmania docs, what is a seasonal campaign: https://doc.trackmania.com/play/what-is-a-seasonal-campaign/
27. Trackmania docs, how to play Cup of the Day: https://doc.trackmania.com/play/how-to-play-cotd/
28. Trackmania docs, watch replays: https://doc.trackmania.com/play/watch-replays
29. Trackmania docs, what is Royal: https://doc.trackmania.com/play/what-is-royal/
30. Trackmania blog, Update 2026 (medal unlock thresholds): https://blog.trackmania.com/?p=8948
31. Trackmania news, the ranking system: https://www.trackmania.com/news/1020?lang=en
32. Trackmania 12 March 2021 changelog (Cup of the Day three times a day): https://devtrackers.gg/trackmania/p/344aa8e2-12-03-2021-new-update-changelog
33. Trackmania blog, Cup of the Week (26 Jan 2026): https://blog.trackmania.com/2026/01/26/cup-of-the-week/
34. Openplanet, Default Medals plugin (gold 1.06, silver 1.2, bronze 1.5): https://openplanet.dev/plugin/defaultmedals
35. Openplanet, No-Respawn Timer plugin: https://openplanet.dev/plugin/norespawntimer
36. Revalidate README (Trackmania replay validation by game): https://github.com/BigBang1112/revalidate
37. Steamworks documentation, Leaderboards: https://partner.steamgames.com/doc/features/leaderboards
38. speedrun.com API, Celeste categories and variables: https://www.speedrun.com/api/v1/games/celeste/categories ; https://www.speedrun.com/api/v1/games/celeste/variables
39. speedrun.com API docs and throttling: https://github.com/speedruncomorg/api/blob/master/README.md ; https://github.com/speedruncomorg/api/blob/master/throttling.md
40. Vercel docs, WebSockets in Vercel Functions (updated 6 Jul 2026): https://vercel.com/docs/functions/websockets
41. Cloudflare Durable Objects pricing: https://developers.cloudflare.com/durable-objects/platform/pricing/
42. Supabase Realtime limits: https://supabase.com/docs/guides/realtime/limits
43. Supabase pricing: https://supabase.com/pricing
44. Upstash Redis pricing: https://upstash.com/pricing/redis
45. MDN, CompressionStream: https://developer.mozilla.org/en-US/docs/Web/API/CompressionStream
46. MDN, Using the Gamepad API: https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API/Using_the_Gamepad_API
47. MDN, Navigator.vibrate(): https://developer.mozilla.org/en-US/docs/Web/API/Navigator/vibrate
48. Chrome Developers, 300 ms tap delay, gone away: https://developer.chrome.com/blog/300ms-tap-delay-gone-away
49. web.dev, responsiveness metric (50 ms keyboard budget): https://web.dev/articles/responsiveness
50. Celeste community rules page (IGT timing): https://challenge-run-community.pages.dev/games/celeste
51. Nintendo, Super Mario Maker manual, uploading courses: https://microsite.nintendo-europe.com/super-mario-maker-manual/enGB/page_05.html
52. Nintendo, Super Mario Maker 2 upload limit raised to 100: https://supermariomaker.nintendo.com/news/course-upload-limit-increase
53. PartyKit site and Cloudflare acquisition post: https://www.partykit.io/ ; https://blog.cloudflare.com/cloudflare-acquires-partykit
54. Trackmania wiki, Nadeo importer, creating waypoints (respawn): https://wiki.trackmania.io/en/content-creation/nadeo-importer/Creating-Waypoints
55. Trackmania news, Weekly Shorts guideline update (20 s author time): https://www.trackmania.com/news/8560
56. Clever Endeavour Games, Annifursary update (v1.13.13, May 2026): https://www.cleverendeavourgames.com/annifursary-update

**Designer talks and postmortems**
57. McMillen, "Super Meat Boy's McMillen explains 'Why so hard?'" (Game Developer): https://www.gamedeveloper.com/game-platforms/-i-super-meat-boy-i-s-mcmillen-explains-why-so-hard-
58. Game Developer, Postmortem: Team Meat's Super Meat Boy: https://www.gamedeveloper.com/audio/postmortem-team-meat-s-i-super-meat-boy-i-
59. Keren, "Scroll Back: The Theory and Practice of Cameras in Side-Scrollers" (GDC 2015): https://www.gamedeveloper.com/design/scroll-back-the-theory-and-practice-of-cameras-in-side-scrollers
60. Pittman, "Math for Game Programmers: Building a Better Jump" (GDC 2016): https://www.gdcvault.com/play/1023559/Math-for-Game-Programmers-Building
61. Rosen, "Animation Bootcamp: An Indie Approach to Procedural Animation" (GDC 2014): https://gdcvault.com/play/1020583/Animation-Bootcamp-An-Indie-Approach
62. Jakobsson and Therrien, "The Rain World Animation Process" (GDC 2016): https://www.youtube.com/watch?v=sVntwsrjNe4 ; https://www.gamedeveloper.com/art/video-animating-i-rain-world-i-and-its-many-squishy-stretchy-creatures
63. Metanet, "The Ins and Outs of Designing N++ Levels" (PlayStation Blog, 2015): https://blog.playstation.com/?p=145712
64. GDC Vault, "Empowering the Player: Level Design in N++" (2016): https://gdcvault.com/play/1023282/
65. GDC Vault, "Level Design Workshop: Designing Celeste" (2017): https://gdcvault.com/play/1024307/Level-Design-Workshop-Designing-Celeste
66. Vice, Neon White's developers being too good at their own game: https://www.vice.com/en/article/neon-whites-developers-being-too-good-at-their-own-game-caused-real-problems/
67. Game Developer, Neon White and designing for player creativity: https://www.gamedeveloper.com/road-to-igf-2023/-neon-white-and-designing-for-player-creativity
68. TheGamer, Neon White devs on fair medal times: https://www.thegamer.com/neon-white-devs-fair-medal-times/
69. GoNintendo, how Neon White's leaderboards came to be: https://www.gonintendo.com/contents/6282-neon-white-dev-discusses-how-the-game-s-leaderboards-came-to-be
70. Vice, Celeste difficulty and Assist Mode (Thorson interviews): https://www.vice.com/en/article/celeste-difficulty-assist-mode ; https://www.vice.com/en/article/celeste-assist-mode-change-and-accessibility
71. Doucet, "Pain, difficulty, and Getting Over It" (Game Developer, 6 Dec 2017): https://www.gamedeveloper.com/design/pain-difficulty-and-getting-over-it
72. Game Developer, "The aesthetics of frustration in Getting Over It" (Foddy interview): https://www.gamedeveloper.com/design/designer-interview-the-aesthetics-of-frustration-in-i-getting-over-it-i-
73. Design Notes podcast, Bennett Foddy (13 Mar 2018): https://designnotes.libsyn.com/bennett-foddy
74. Muscat, "Depth in Simplicity: The Making of Jetpack Joyride" (GDC 2012): https://www.gdcvault.com/play/1015527/
75. Adrian Crook, Jetpack Joyride design breakdown: https://adriancrook.com/?p=4709
76. PCGamesInsider, Refenes on Super Meat Boy Forever's two buttons: https://www.pcgamesinsider.biz/indie-interview/66238/we-wanted-it-to-have-two-buttons-and-still-feel-and-play-like-super-meat-boy/
77. Saltsman, "Tuning Canabalt" (Game Developer): https://gamedeveloper.com/design/tuning-canabalt
78. Thompson, "Keep Running: procedural level generation in Sure Footing" (27 Jun 2018): https://gamedeveloper.com/design/keep-running-procedural-level-generation-in-sure-footing
79. Pocket Gamer, "Bouncing ever upwards: the making of Doodle Jump": https://www.pocketgamer.biz/bouncing-ever-upwards-the-making-of-doodle-jump/
80. Game Developer, "GDC: How Sackboy learned to love physics" (Media Molecule, 2009): https://www.gamedeveloper.com/game-platforms/gdc-how-sackboy-learned-to-love-physics
81. GamingBolt, LittleBigPlanet 3 interview ("It has been addressed"): https://gamingbolt.com/littlebigplanet-3-interview-sackboy-is-back-but-this-time-he-is-not-alone
82. Game Developer, Q&A: designing for seasons in Fall Guys (Joe Walsh): https://gamedeveloper.com/design/q-a-designing-for-seasons-in-bumbling-platform-royale-i-fall-guys-i-
83. GamesRadar, Fall Guys interview (Joe Walsh, Megan Ralph): https://gamesradar.com/fall-guys-interview
84. Nintendo Life, Tezuka's 5 tips for creating courses (Jul 2019): https://www.nintendolife.com/news/2019/07/super_mario_maker_2_producer_takashi_tezuka_shares_5_tips_for_creating_courses
85. Engadget, "This is why Mario levels are brilliant" (Hayashida, four-panel manga): https://www.engadget.com/2015/03/17/super-mario-3d-world-design/
86. Game Developer, Spelunky's Daily Challenge: https://gamedeveloper.com/business/-i-spelunky-i-s-new-daily-challenge-destined-to-infuriate-engage-players
87. Game Developer, "The 24-hour ticket: examining daily runs": https://gamedeveloper.com/design/the-24-hour-ticket-examining-daily-runs-
88. Kayin, I Wanna Be the Guy FAQ (design section): https://kayin.moe/iwbtg/faq.html
89. Defender1031, "Trolling for Dummies" (Mario Maker troll design guide): https://docs.google.com/document/d/13ZoqeblLs45HuEfTtsOrq6X0LAuEnA8nB721_doxE38/mobilebasic
90. Game Developer, "Closing the loop: validating design decisions using player data" (Shadow Blade): https://gamedeveloper.com/design/closing-the-loop-validating-design-decisions-using-player-data-for-a-platformer
91. Shacknews, Miyamoto on Super Mario Run (2016): https://www.shacknews.com/article/96686/shigeru-miyamoto-on-super-mario-run-were-not-just-making-a-simple-or-easy-mario-game
92. Game Developer, Pizza Tower postmortem: https://gamedeveloper.com/design/how-speedy-implementation-high-paced-platformer-pizza-tower
93. Yacht Club Games, Plague Knight mobility design (Shovel Drop 4.5 tiles): https://yachtclubgames.com/blog/plague-knight-mobility-design
94. Game Developer, "Speed Cleaning: an analysis of Dustforce": https://gamedeveloper.com/design/speed-cleaning-an-analysis-of-dustforce
95. Mary Rose Cook, deft and intuitive player movement in a 2D platformer: https://maryrosecook.com/blog/post/deft-and-intuitive-player-character-movement-in-a-2d-platformer
96. Game Maker's Toolkit, "How to make a good 2D camera": https://gmtk.substack.com/p/how-to-make-a-good-2d-camera
97. Juicy Beast, "The making of Toto Temple Deluxe: platforming part 1" (Super Meat Boy air friction): https://juicybeast.com/2014/02/12/the-making-of-toto-temple-deluxe-platforming-part-1/
98. Critical Points, "5 games 5 jumps" (18 May 2015): https://critpoints.net/2015/05/18/5-games-5-jumps/
99. CGMagazine, Richard Atlas interview (Ultimate Chicken Horse): https://www.cgmagonline.com/interviews/making-the-ultimate-party-game-an-interview-with-richard-atlas
100. Thumbsticks, Casper van Est interview (SpeedRunners): https://www.thumbsticks.com/interview-bringing-the-speedrunners-party-to-nintendo-switch/
101. Game Developer, "The Musical Box 27: game music level design" (Rayman Legends): https://gamedeveloper.com/audio/the-musical-box-27-game-music-level-design
102. Kill Screen, the tricky brilliance of Downwell's gunboots: https://www.killscreen.com/the-tricky-brilliance-of-downwells-gunboots.md
103. Eiserloh, "Math for Game Programmers: Juicing Your Cameras With Math" (GDC 2016): https://www.gdcvault.com/play/1023220/Math-for-Game-Programmers-Juicing
104. Game Developer, Celeste's audio files are publicly available: https://gamedeveloper.com/audio/-i-celeste-s-i-audio-files-are-now-publicly-available-for-devs
105. Mania Exchange blog, "What do you think? Medal times" (2015): https://tm.mania-exchange.com/blogs/entry/569/what-do-you-think-medal-times

**Docs and tools**
106. LiveSplit components documentation: https://livesplit.org/components/
107. livesplit-core (Rust, MIT or Apache-2.0): https://github.com/LiveSplit/livesplit-core
108. LiveSplit One (web timer): https://github.com/LiveSplit/LiveSplitOne
109. racetime.gg help and LiveSplit integration: https://racetime.gg/about/help ; https://racetime.gg/about/livesplit
110. jsfxr (chr15m fork, Unlicense): https://github.com/chr15m/jsfxr
111. ZzFX (MIT): https://github.com/KilledByAPixel/ZzFX
112. LittleJS platformer example: https://github.com/KilledByAPixel/LittleJS/tree/main/examples/platformer
113. bryc, PRNGs in JavaScript (mulberry32, sfc32, xoshiro128**): https://github.com/bryc/code/blob/master/jshash/PRNGs.md
114. PeerJS: https://github.com/peers/peerjs
115. @upstash/redis: https://github.com/upstash/redis-js
116. LDtk level editor and JSON schema: https://github.com/deepnight/ldtk ; https://ldtk.io/json/
117. lz-string: https://github.com/pieroxy/lz-string
118. Playwright: https://github.com/microsoft/playwright
119. NohBoard (keyboard input display, GPL-2.0): https://github.com/ThoNohT/NohBoard
120. Fiedler, "Fix Your Timestep": https://gafferongames.com/post/fix_your_timestep/
121. Tomšů, "Input in fixed timestep": https://jakubtomsu.github.io/posts/input_in_fixed_timestep
122. Juckett, "Damped Springs": https://www.ryanjuckett.com/damped-springs/
123. trigfills on npm (cross-browser trig): https://www.npmjs.com/package/trigfills
124. Rapier, determinism docs (Math.sin and Math.cos not cross-platform): https://rapier.rs/docs/user_guides/javascript/determinism
125. perplexdotgg/bounce issue 8, simulation diverges between JS engines: https://codeberg.org/perplexdotgg/bounce/issues/8
126. Dan Luu, "Computer latency: 1977-2017": https://danluu.com/input-lag/
127. speedrun.com, moderation rules: https://www.speedrun.com/support/learn/moderation-rules
128. speedrun.com, site rules (turbo, non-native controller functions): https://speedrun.com/support/learn/site-rules
129. Tiled (licences and JSON map format): https://github.com/mapeditor/tiled ; https://doc.mapeditor.org/en/stable/reference/json-map-format/
130. collision-2d (swept AABB): https://github.com/mreinstein/collision-2d
131. Loenn (Celeste map editor): https://github.com/CelestialCartographers/Loenn
132. obscenity (name filter): https://github.com/jo3-l/obscenity
133. netplayjs (lockstep and rollback): https://github.com/rameshvarun/netplayjs
134. Kaplay examples (platformer, one-way effector): https://github.com/kaplayjs/kaplay/tree/master/examples
135. Mari0 (no licence file): https://github.com/Stabyourself/mari0
136. mariohtml5 (Unlicense): https://github.com/robertkleffner/mariohtml5
137. @upstash/ratelimit: https://github.com/upstash/ratelimit-js

**Community, wikis and press**
138. Wikipedia, Getting Over It with Bennett Foddy: https://en.wikipedia.org/wiki/Getting_Over_It_with_Bennett_Foddy
139. Wikipedia, Doodle Jump: https://en.wikipedia.org/wiki/Doodle_Jump
140. Wikipedia, Jetpack Joyride: https://en.wikipedia.org/wiki/Jetpack_Joyride
141. Wikipedia, Solipskier: https://en.wikipedia.org/wiki/Solipskier
142. Wikipedia, LittleBigPlanet 3: https://en.wikipedia.org/wiki/LittleBigPlanet_3
143. Wikipedia, Syobon Action: https://en.wikipedia.org/wiki/Syobon_Action
144. Wikipedia, Fall Guys: https://en.wikipedia.org/wiki/Fall_Guys
145. Wikipedia, Super Mario Maker 2: https://en.wikipedia.org/wiki/Super_Mario_Maker_2
146. Wikipedia, Ultimate Chicken Horse: https://en.wikipedia.org/wiki/Ultimate_Chicken_Horse
147. Wikipedia, Team 0%: https://en.wikipedia.org/wiki/Team_0%25
148. Wikipedia, Super Meat Boy: https://en.wikipedia.org/wiki/Super_Meat_Boy
149. Wikipedia, Canabalt: https://en.wikipedia.org/wiki/Canabalt
150. Wikipedia, I Wanna Be the Guy: https://en.wikipedia.org/wiki/I_Wanna_Be_the_Guy
151. Wikipedia, Kaizo: https://en.wikipedia.org/wiki/Kaizo
152. Wikipedia, SpeedRunners: https://en.wikipedia.org/wiki/SpeedRunners
153. Wikipedia, Neon White: https://en.wikipedia.org/wiki/Neon_White
154. Wikipedia, Katana Zero: https://en.wikipedia.org/wiki/Katana_Zero
155. Super Mario Wiki, Checkpoint Flag: https://www.mariowiki.com/Checkpoint_Flag
156. Super Mario Wiki, Super Mario Maker 2 (parts, Ninji Speedruns, World Maker): https://www.mariowiki.com/Super_Mario_Maker_2
157. Super Mario Wiki, Super Mario Bros. 35: https://www.mariowiki.com/Super_Mario_Bros_35
158. Super Mario Wiki, Ghost (Mario Kart series): https://www.mariowiki.com/Ghost_(Mario_Kart_series)
159. MMKB, Appearing Block ; Mega Man Maker Wiki, Yoku Block: https://megaman.fandom.com/wiki/Appearing_Block ; https://wiki.megamanmaker.com/index.php/Yoku_Block
160. N wiki, Timer, Episode, Zap and Chase drones: https://n.fandom.com/wiki/Timer ; https://n.fandom.com/wiki/Episode ; https://n.fandom.com/wiki/Zap_and_Chase_drones
161. Celeste speedrun community wiki, Spring ; Celeste Wiki, Chapter 8: Core: https://cc-wiki.duckdns.org/wiki/Spring ; https://celestegame.fandom.com/wiki/Chapter_8:_Core
162. speedrun.com Celeste news, IL rule on Save and Quit: https://www.speedrun.com/celeste/news/z3z9gvxd
163. speedrun.com, "[RULE UPDATE] Framerate cap of 60 required": https://speedrun.com/posts/tgzr2
164. speedrun.com, "Framerules and Enemy Spawns": https://www.speedrun.com/post/rid2d
165. TASVideos, Luck Manipulation: https://tasvideos.org/LuckManipulation
166. TASVideos forum, Celeste speed units (60 speed = 1 px/frame): https://tasvideos.org/Forum/Posts/489980
167. speedrun.com Celeste forum, 61 fps bug and IGT: https://www.speedrun.com/posts/jo2ud
168. r/TrackMania, why times are not measured to the thousandth (100 Hz tick): https://lr.eu.psf.lt/r/TrackMania/comments/1jww598/why_dont_trackmania_race_times_measure_to_the
169. donadigo and Wirtual, TMX replay investigation (inputs, Validate, spikes per second): https://donadigo.com/tmx1
170. PC Gamer, cheating allegations catch up with Trackmania's fastest drivers: https://www.pcgamer.com/cheating-allegations-catch-up-with-some-of-trackmanias-fastest-drivers
171. PC Gamer, Trackmania dev analyses 15 years of records to root out cheaters: https://www.pcgamer.com/trackmania-dev-analyses-15-years-worth-of-records-to-root-out-the-cheaters
172. Kotaku, the incredible story of a Trackmania shortcut, 13 years later: https://kotaku.com/the-incredible-story-of-a-trackmania-shortcut-13-years-1846524325
173. Kotaku, Neon White speedrunning cheaters (June 2022): https://kotaku.com/neon-white-speedrunning-cheaters-annapurna-interactive-1849115456
174. Kotaku, Mario Maker 2 lets you feel like a speedrunner (Celestial Sprint): https://kotaku.com/mario-maker-2-lets-you-feel-like-a-speedrunner-1836220745
175. Vice, 20-second gauntlets of death in Mario Maker levels: https://www.vice.com/en/article/20-second-gauntlets-of-death-are-the-hottest-trend-in-mario-maker-levels/
176. vjeux, "Trackmania Medal Distribution" (2021): https://blog.vjeux.com/2021/javascript/trackmania-medal-distribution.html
177. Trackmania Track of the Day, 20 May 2023 discussion (medal times): https://devtrackers.gg/trackmania/p/92351a6c-totd-20-05-2023-seasonal-sprint-by-evo-xlrb-discussion
178. Hypertextbook, acceleration due to gravity in Super Mario Brothers (2007): https://hypertextbook.com/facts/2007/mariogravity.shtml
179. Critical-Gaming, Super Meat Boy pt. 1 and pt. 3 (2011): https://critical-gaming.squarespace.com/blog/2011/1/5/super-meat-boy-pt1.html ; https://critical-gaming.squarespace.com/blog/2011/1/6/super-meat-boy-pt3.html
180. PC Gamer, Super Meat Boy review (about 100 Meat Boys replayed): https://www.pcgamer.com/uk/super-meat-boy-review
181. Steam Community, Celeste death count thread: https://steamcommunity.com/app/504230/discussions/0/1628538707074318672
182. Steam Community, Celeste death animation thread: https://steamcommunity.com/app/504230/discussions/0/3106888980062841603
183. GamesRadar, Super Meat Boy deathless after 700 hours and 100,000 deaths (2025): https://www.gamesradar.com/games/platformer/15-years-later-after-700-hours-of-grinding-and-at-least-100-000-deaths-speedrunner-finally-beats-all-of-super-meat-boy-without-dying-earning-a-congrats-from-co-creator-edmund-mcmillen
184. Guinness World Records, fastest any% completion of Celeste: https://www.guinnessworldrecords.com/world-records/525519-fastest-any-completion-of-celeste
185. Wikipedia, World 1-1: https://en.wikipedia.org/wiki/World_1-1
186. trysdyn, LiveSplit colour conventions: https://trysdyn.dreamwidth.org/3515.html
187. speedrun.com Ori DE LiveSplit guide (gold split, sum of best): https://www.speedrun.com/ori_de/guide/k29yz
188. Shacknews, how to shell jump in Super Mario Maker 2 (GrandPOOBear): https://shacknews.com/article/113025/how-to-shell-jump-in-super-mario-maker-2-grand-poobear-guide
189. Giant Bomb, Little Horn (Super Meat Boy): https://giantbomb.com/little-horn/3005-17018/
190. TV Tropes, Pizza Tower (Mach grab, 7 s combo): https://tvtropes.org/pmwiki/pmwiki.php/VideoGame/PizzaTower
191. 80.lv, breakdown of level design in Neon White: https://80.lv/articles/breakdown-level-design-in-annapurna-s-neon-white
192. GameFAQs, Super Mario Maker 2 difficulty cutoffs (community): https://gamefaqs.gamespot.com/boards/258608-super-mario-maker-2/77832879
193. keithyipkw, 1000 Endless Expert levels without skipping: https://keithyipkw.github.io/blog/no_skip_smm
194. Steam Community, TrackMania² respawn keys thread: https://steamcommunity.com/app/228760/discussions/2/2961642818658406421
195. gamejuice, "Platformer juice: the Celeste model" (death downtime estimate): https://gamejuice.pages.dev/articles/platformer-juice-celeste-model
196. Attack of the Fanboy, Neon White medals and leaderboards: https://attackofthefanboy.com/?p=841732
197. Softpedia, LittleBigPlanet has 8 million community levels: https://games.softpedia.com/blog/Little-Big-Planet-Has-8-Million-Community-Created-Levels-364874.shtml
198. Media Molecule blog, Mm Picks (Dec 2009): https://www.mediamolecule.com/blog/article/mm_picks5
199. TrueAchievements, Mirror's Edge Time Trials walkthrough: https://www.trueachievements.com/game/Mirrors-Edge/walkthrough/4
200. GINX, Fall Guys free-to-play Season 1 rewards: https://www.ginx.tv/en/?p=32879
201. Scribd, 2D platformer design paper quoting Refenes on the 1/20 s wall grace: https://www.scribd.com/document/624520952/paper-248-1
202. bugnet, how to fix replay verification failing from nondeterministic simulation: https://bugnet.io/blog/how-to-fix-replay-verification-failing-from-nondeterministic-simulation
203. Classmethod, Vercel Functions WebSocket public beta verification (5-minute cap): https://dev.classmethod.jp/en/articles/vercel-functions-websocket-public-beta-verification/
204. Vercel community weekly, 16 to 23 Oct 2026 ("WebSocket Support Goes GA"): https://community.vercel.com/t/vercel-weekly-october-26-2026/51439
205. Baeldung, maximum URL length: https://www.baeldung.com/cs/max-url-length
206. r/dustforce wiki, mechanics, tricks and terminology (mirror): https://axebps-redlib.hf.space/r/dustforce/wiki/terms
207. speedrun.com forum, macro definition (one button, many inputs): https://www.speedrun.com/post/9vgf3
208. Spelunky Wiki, Daily Challenge Mode (HD): https://spelunky.fandom.com/wiki/Daily_Challenge_Mode_(HD)
209. Boing Boing, VVVVVV (13 Jan 2010): https://boingboing.net/2010/01/13/get-this-flipping-ou.html
210. Community Trackmania server rulebook (respawn rule for maps over 35 s): https://docs.google.com/document/d/1hB_dZHk9OYu_GghrEHvVd4eELX-eT5oQ4WZCj2yGbr4/export?format=pdf
211. PlayStation Blog, LittleBigPlanet "Two Million Levels" edition: https://blog.playstation.com/?p=25109

**Papers**
212. Juul, "Fear of Failing? The Many Meanings of Difficulty in Video Games" (2009): https://www.jesperjuul.net/text/fearoffailing/
213. Smith, Treanor, Whitehead, Mateas, "Rhythm-Based Level Generation for 2D Platformers" (FDG 2009): https://expressiveintelligence.github.io/papers/smith-fdg-09.pdf
214. Carvalho et al., "A Generic Framework for Procedural Generation of Gameplay Sessions" (SBGames 2013): https://www.sbgames.org/sbgames2013/proceedings/comp/23-full-paper.pdf
215. Mawhorter and Mateas, "Procedural Level Generation Using Occupancy-Regulated Extension" (2010): https://www.cs.hmc.edu/~pmawhorter/research/papers/procedural_level_generation_using_occupancy_regulated_extension-Mawhorter_Mateas-2010.pdf
216. arXiv 2507.21078, "What Makes a Level Hard in Super Mario Maker 2?" (2025): https://arxiv.org/html/2507.21078v1
217. Sudhakaran et al., "MarioGPT" (arXiv 2302.05981): https://arxiv.org/pdf/2302.05981
218. Tracer, a forensic framework for detecting fraudulent speedruns from replays (arXiv 2025): https://arxiv.org/html/2509.10848v1
