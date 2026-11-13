# 13. Gap research: procedural layouts, missing level data, vector and procedural rigs, grass and speed cues

Agent 13, 13 Nov 2026. Fills gaps left by notes 03, 06 and 07. Tags: [C] cited, [I] inference, [K] Kingsfoil fact from
notes/01-current-build.md, [G] gap. About 34 tool calls. Scratch (two extracted paper texts) in `scratch-13/`.

---

## Q1. Procedural layouts for a seeded daily time-attack map

### Takeaway
The runners that generate well all do the same two things: they author small chunks by hand and tag each with a
difficulty, then pick from the tagged pool following a designer-drawn difficulty-over-distance curve. Only one
published generator makes solvability a construction property instead of a test: Launchpad (Smith et al. 2009)
generates the player's input rhythm first and builds geometry that fits it, so a valid input sequence exists before
the level does. For SpeedRunner, whose physics is a deterministic 120 Hz fixed step [K], the cheapest fair daily map
is "rhythm first, geometry second, then replay the rhythm with a headless bot as the proof". Spelunky's daily
(same seed, one try, 24 h) and Trackmania's Track of the Day (same community map, Cup of the Day on top) are the
social wrapper.

### Cited findings
**Canabalt (Adam Saltsman, "Tuning Canabalt", Flash version) [C][S1]**
- Speed: starts at 100 px/s, top speed 800 px/s. Acceleration steps down with speed: 50 px/s² (0 to 100), 30 (100 to
  250), 20 (250 to 400), 10 (400 to 800). Hitting a box or chair cuts speed by 30% and resets acceleration to 30.
- Jump: hold-to-rise, vy = -300 px/s while held, max hold 0.35 s and the hold window shrinks as run speed rises;
  a tap under 0.08 s gives vy 200 instead of 300 (hop).
- Buildings are generated one at a time from the current speed: max gap width is about two thirds of the horizontal
  speed (px per px/s); hallway (window) height 48 px under 320 px/s to 96 px over 640 px/s; minimum next-building
  width = screen width minus gap, floor 96 px; max width = 2x min; roof drop capped at 160 px (one screen height).
- Pacing: a "special" building (bombs, cranes, collapse) every 3 to 8 normal buildings, about 6 on average, so over
  4000 px between events, about 10 s at a 400 px/s median speed.
- Geometry: view 480x160 px; runner sprite 24x24 but hitbox 12x14 snapped to the feet; obstacle hitbox 2 px tall.
- Saltsman said he dislikes memorisation games, so the challenge is procedural to build skill [S2]. The generator is
  speed-driven, so a slowdown also makes the next buildings easier [S3].

**Jetpack Joyride chunk model as reconstructed by Carvalho et al., SBGames 2013 (built for "Boney the Runner",
explicitly modelled on Jetpack Joyride) [C][S4]**
- Chunks are fixed-size playable segments: exactly 1536x640 px, i.e. 1.6 screens of a 960x640 iPod Touch 4 in
  landscape; the extra width gives designers room.
- Four-step process: (1) designer draws a difficulty-over-chunk-number curve, (2) chunks are authored in a chunk
  editor, (3) each chunk is classified Easy / Medium / Hard / Bonus, (4) at runtime the curve gives the wanted
  difficulty and a random chunk of that class is drawn from its pool. Chunks are placed independently (no memory
  of previous chunks).
- Library at the paper's date: 230 chunks, 99 Easy, 62 Medium, 55 Hard, 14 Bonus (rest zones with no danger).
- Designers first tried continuous difficulty values, then fell back to four discrete classes because continuous
  tagging was too hard to agree on.
- A neural net trained on player data (metric GF_TD: time the player needed minus the chunk's "regular" time)
  reclassified chunks and matched human labels on 90% of chunks with the best feature set, 52% with the worst.
- Halfbrick's own GDC 2012 talk "Depth in Simplicity: The Making of Jetpack Joyride" (Luke Muscat) exists on the
  GDC Vault [S5] but its text was not reachable this session; the chunk numbers above are from the academic model,
  not Halfbrick.

**Launchpad (Smith, Treanor, Whitehead, Mateas, FDG 2009) [C][S6]**
- Levels are chains of "rhythm groups" joined by a rest-area platform. A rhythm group is first a timed list of
  player verbs (`move t0 t1`, `jump t t+hold`), then a grammar turns that rhythm into geometry (flat_gap, gap or
  no_gap with jump_up, down, spring or fall; sloped steep or gradual).
- Rhythm parameters: length 5, 10, 15 or 20 s; density low, medium, high; beat type regular, random or swing.
  Jump hold times are part of the rhythm (0.25 s = short hop in the paper's example) because hold time sets height.
- Candidate levels are scored by critics: a line-distance critic (fit to a designer-drawn path) and a component
  style critic. The paper claims every generated level is "fully playable" because geometry is derived from jump
  types the avatar can make.

**Sure Footing (Table Flip Games), described by Tommy Thompson, 27 Jun 2018 [C][S7]**
- Uses a Launchpad-style grammar: a lexicon of actions plus construction rules that forbid repeats inside a sprint
  and forbid specific action-to-action transitions. 3 geometry generators and 17 action generators at the time.
- Every geometry variant carries a hand-tuned cost; sprints have a budget that starts constrained and relaxes with
  survival time, which is how new tools and harder patterns unlock. Over 30 tunable parameters. No automated
  playability check; designer playtesting only.

**Agent validation (Mario AI framework lineage) [C]**
- Standard Mario AI framework level is 150x16 tiles with a forward model and Robin Baumgarten's 2009 A* agent [S8].
- MarioGPT (Sudhakaran et al., 2023) ran the A* agent on 250 generated levels, 5 runs each: 88.4% of its levels
  were completable versus about 31% for the best baseline (LSTM) [S9].
- Volz et al. 2018 (DCGAN latent space) argue tile statistics do not predict playability and use the A* agent's
  result as the fitness function for CMA-ES search [S10].

**Daily "same map for everyone" wrappers [C]**
- Spelunky HD Daily Challenge: one generation seed shared by all players for 24 h, one attempt, no restart, a
  per-day leaderboard ranked by money and depth (not time); Steam and PSN seeds differ [S11][S12].
- Trackmania: Track of the Day is a community map renewed daily; Cup of the Day runs on it 3 times a day at 8 h
  intervals, with a 10 min qualifying window plus 5 min to improve, then knockout rounds [S13][S14]. Royal maps
  are authored, not generated: 5 sections of rising difficulty coloured white, green, blue, red, black [S15].
  "Royal generation" from note 06 is therefore wrong: Royal is curated, not procedural.
- Alto's Adventure and Super Mario Run: no primary source on their chunk or grammar rules was reached [G].
- Doodle Jump: no developer statement of spawn rules found; only strategy blogs say platform types
  (moving, breakable, disappearing, springs, trampolines) and monster frequency rise with height [S16] [G].

### Inferences for a seeded 20 to 40 s SpeedRunner daily [I]
Uses [K] constants: hero 46 u = 1 BL, maxRun 420 u/s (9.1 BL/s), full jump apex 138 u (3 BL), time to apex
332 ms, fall from apex with 1.65x gravity about 260 ms, so a full-speed flat jump covers about 250 u (5.4 BL) in
0.59 s before the apex band is counted.
1. **Length budget.** 20 to 40 s at a realistic 60 to 70% of top speed is about 5000 to 11 000 u, i.e. 4 to 8
   chunks of 1.5 screens (1450 u) like Boney's 1.6-screen chunks, plus a 300 u start pad and a 400 u flag pad.
2. **Chunk library tagged by skill atom**, not by a single difficulty number: `run-gap`, `step-up`, `chimney`
   (wall jumps), `drop-roll`, `one-way-tiles`, `mover`, `wheel`, `spike-corridor`, `rest`. Each variant carries a
   cost 1 to 4 as in Sure Footing. Start with 30 to 40 chunks (Boney shipped 230 after a full production; four
   classes of 99/62/55/14 is a 43/27/24/6 split you can copy for the pool proportions).
3. **Ramp curve per chunk index**, drawn by hand as in Carvalho et al.: cost 1, 1, 2, 2, 3, 2, 4, rest. Put the
   cost-4 chunk before the last checkpoint, never as the final chunk (the final chunk should be a flow run so a
   good run ends fast, which keeps the duel legible).
4. **Solvability by construction then by proof.** Generate the rhythm first (Launchpad): a list of
   `run / jump(hold ms) / wallkick / wait` with timestamps, then pick geometry whose gaps fit the kit (max flat gap
   two thirds of the jump reach, Canabalt's rule, so 165 u at full speed, 110 u at 280 u/s roll speed). Then run a
   headless bot that replays the rhythm's inputs through the same 120 Hz step (`window.__sr.step`) and reject the
   seed if the bot dies or exceeds the target time. The bot's run doubles as the author ghost and the author time.
5. **No blind drops.** Reject any chunk whose landing is below the current view bottom (545 u visible [K]) unless
   the drop lands on a platform at most 1 view height down and at least 2 BL wide; cap roof drops at one view
   height as Canabalt caps at one screen (160 px of a 160 px view).
6. **Rest cadence.** One no-hazard chunk every 3 to 8 chunks (Canabalt's special-event spacing inverted), which
   also hosts the checkpoint marker.
7. **Seed and wrapper.** Seed = hash(date, map version); one try counts for the daily board (Spelunky) but allow
   unlimited practice on the same seed with a separate "practice" flag (Cup of the Day's 10 + 5 min window is a
   friendlier middle). Rotate at a fixed UTC hour; show "today's map" medals from the bot time (see Q2 ratios).

### Gaps
- [G] Halfbrick's own chunk sizes, tagging and distance speed ramp (talk text unreachable). Doodle Jump spawn
  formula. Alto's and Super Mario Run grammars. Trackmania TOTD selection rules (community vote process) not read.
- [G] No paper found that validates a side-view *wall-jump* platformer with an agent; the Mario lineage only.

---

## Q2. Missing level data: Celeste, Super Meat Boy, Trackmania, medal ratios

### Takeaway
Primary per-chapter room counts and developer death averages for Celeste were not reachable (fan wiki 402). What
is citable: Celeste any% world record 25:55.262 (7 Jan 2023) against about 47 min in the game's first weeks of 2018,
and chapter 1 clear records of 1:01.9 (2018) falling to about 55 s (2019). Trackmania's ratio is confirmed from a
live Track of the Day post (gold 1.068x, silver 1.21x, bronze 1.52x author) and from the Openplanet default-medals
plugin (1.06 / 1.2 / 1.5). Super Meat Boy par rationale is still uncited.

### Cited findings
- Celeste any%: fastest completion 25 min 55.262 s by "secureaccount", 7 Jan 2023 (Guinness, citing speedrun.com)
  [S17]. In early 2018 the best run was about 47 min [S18].
- Celeste chapter 1 (1A) clear records: Hornlitz 1:01.897 on 30 May 2018; a 55 s run by Zkad stood in Oct 2019
  (fan wiki text seen only as a search snippet) [S19]. A full-game first clear is reported at about 10 h with
  "upwards of 3000 deaths" by one PC Gamer writer [S18]; other single reports: 12 000 deaths in 43 h, 11 000 in 42 h,
  20 018 total on one save [S20][S21]. None is a developer average.
- Super Meat Boy: a deathless full-game run took about 700 h of practice and at least 100 000 deaths (GamesRadar,
  2025) [S22]. No developer statement on how A+ par times were set was found [G].
- Trackmania Track of the Day post (20 May 2023, "Seasonal Sprint" by Evo): author 58.055, gold 1:02.000, silver
  1:10.000, bronze 1:28.000, so gold = 1.068x, silver = 1.206x, bronze = 1.516x author [S23]. Openplanet "Default
  Medals" plugin describes Nadeo's defaults as gold 1.06 AT, silver 1.2 AT, bronze 1.5 AT [S24]. A Mania Exchange
  mapper describes setting medal times by driving three kinds of run (clean, casual, sloppy) [S25]. Author medal is
  defined as beating the author's own time [S26].
- Launchpad's rest-area rule and Boney's 14 bonus chunks in 230 (6%) give a citable "rest share" for a time attack.

### Inferences: ratios a small team can copy [I]
- Author time = the bot run (daily) or the designer's clean run (hand maps). Gold 1.06x, silver 1.20x, bronze 1.50x.
  SpeedRunner already shows a WR; show medals too so a first-clear player has a near target.
- First clear vs WR: Celeste anecdotes give 10 h / 26 min = about 23x for the whole game, which is a learning curve
  figure, not a single-level one. For one 20 to 40 s SpeedRunner map, expect first clears at 3x to 6x WR including
  deaths, and a clean-but-slow lap at about 1.5x WR (bronze). This band is an inference; instrument it (note 07 Q7).
- Deaths per first clear: Celeste's 3000 deaths over about 300 rooms is about 10 deaths per room for a careful
  first run. A SpeedRunner map with 6 to 8 chunks would then expect 60 to 80 deaths for a first clear if each chunk
  is as hard as a Celeste room, which is far too many for a 3.4 s restart [K]; aim for 10 to 20 deaths per first
  clear on easy and medium maps, and cut restart cost (note 07 profile 1).

### Gaps
- [G] Celeste room counts per chapter (fandom 402; GDC talk says "300+ stages" whole game, note 06). Developer
  death averages (none found; Thorson's posts not retrievable). SMB par derivation and par vs WR table.
  Neon White nothing new, skip.

---

## Q3. Procedural, vector and stick-figure rigs in shipped 2D games

### Takeaway
The talks exist but their numbers live inside the videos, not on any page this session could read. Two citable
facts anchor the family: Overgrowth's rig runs on "13 keyframes in total for everything" (Rosen, GDC 2014), and
Rain World's slugcat is two spherical body chunks held at a fixed distance with limbs that are code-driven points,
not frames (Jakobsson and Therrien, GDC 2016). Gang Beasts keeps a ragdoll upright with "virtual forces" rather
than animation. SpeedRunner's rig (10 angles blended with a 38 ms time constant, a 160/14 kimono spring [K]) is
already in this family; what it lacks is the Rosen-style two-pose cycle with a physics bounce and limb smears at
speed.

### Cited findings
- **Overgrowth / David Rosen, "Animation Bootcamp: An Indie Approach to Procedural Animation", GDC 2014, about
  25 to 30 min, free on the Vault [S27][S28].** The talk's premise: fluid interactive animation from very few
  keyframes, examples from Overgrowth, Receiver and Black Shades; "13 keyframes in total for everything" (thread
  OP quoting the talk) [S29]. Responsiveness is built into the physics first and animation layered on top; the
  character is moved by its own physics, not root motion [S29]. Lugaru's released code has the values hard-coded
  [S29]. (From memory of the talk, flagged [I] because no page confirmed it: walk and run cycles are 2 keyframes
  each, mirrored for the other leg and interpolated with a sine; a vertical bounce is added procedurally; ears,
  tail and cloth are springs driven by body velocity; ragdoll blends in by matching the pose the physics landed
  in; feet are placed with IK.)
- **Rain World, Joar Jakobsson and James Therrien, GDC 2016 Animation Bootcamp, free on the GDC YouTube channel
  [S30][S31].** The approach is "working with a bunch of points in space" rather than frames; the slugcat is two
  spherical chunks locked at a fixed distance so it can tumble; limbs are code-driven; the team mixed classical and
  procedural early on and moved toward procedural; Jakobsson was a non-animator who made limbs move with code
  because code is how things move in a game [S31][S32].
- **Gang Beasts (Boneloaf):** a ragdoll kept standing by "virtual forces" not tied to ground contact, which let a
  character stand and rebalance when undisturbed; a Unite 2015 talk is the cited source [S33]. Secondhand: a ball
  collider between the legs helps balance and mass [S34]. Fall Guys: full-time ragdoll for every move and fall
  (WPI wiki) [S35]; no Mediatonic technical talk reached [G].
- **Getting Over It:** a cauldron hides the legs, which Foddy says the pot is there to protect; a hammer grips the
  world and moves the body; lineage Sexy Hiking (2002) [S36][S37].
- **Fancy Pants Adventures (Brad Borne):** solo Flash ActionScript project, graphics by a non-artist which gave the
  sketchy look; the PC Gamer 2025 piece describes 18 years of legacy code being ported to Steam [S38][S39]. A
  low-quality mirror claims World 2 used "tile-based physics" bent for non-orthogonal movement [S40] (weak).
- **N++ ragdoll, Stick Fight, Line Rider, Jump King, Spelunky ropes:** no primary technical source reached [G].

### Inferences for SpeedRunner's rig [I]
- A two-pose run cycle is enough when the blend is a smooth periodic interpolation: pose A (right foot contact,
  left arm forward) and its mirror; the body bob is `sin(2·phase)` at 2 to 4 u amplitude. SpeedRunner's
  `phase += |vx|·dt·0.042` gives 2.8 strides/s at 420 u/s [K], so one stride is 357 ms; blend time constant 38 ms
  [K] is fast enough to not smear poses (it is about 1/9 of a stride).
- Keep secondary motion as springs: SpeedRunner's kimono (k 160, c 14 gives a damping ratio c/(2·sqrt(k)) =
  0.55, under-damped, visible flutter) is the right class; the same spring on the katana sheath and a hair knot
  adds speed reading for free.
- Readability at 9 BL/s on white paper: lean the torso 10 to 18 degrees into velocity (Rosen-style tilt by
  acceleration), stretch the trailing leg into a smear line of 1.5x length on the frame the foot leaves the
  ground, and never let the silhouette's arm cross the torso at the apex (both arms up reads as "jump" at a glance).
- Ragdoll for death only: switch the 10 angles to a 2-link verlet chain for 0.38 s [K]; Gang Beasts' virtual-force
  standing is not needed because the hero never has to recover.

### Gaps
- [G] Pose blending time constants, spring values and IK method (two-bone analytic vs FABRIK) for any shipped
  2D game were not found on a readable page; the Rosen and Rain World videos are the next step (watch and
  timestamp). N++ ninja, Stick Fight, Line Rider, Jump King, Spelunky rope: not researched within budget.

---

## Q4. Grass and ground interaction; cheap speed cues

### Takeaway
No readable source on how Okami, Ghost of Tsushima, Katana ZERO or Celeste implement grass was reached (budget);
what the search returned was engine tutorials. The common recipe is the same in 2D and 3D: a per-blade bend driven
by the player's position within a radius, and cutting as a state swap (uncut mesh to cut mesh plus a particle burst).
SpeedRunner already cuts grass [K]; the cheap upgrades are bend-before-cut and a clipping particle.

### Cited findings
- Bending: send the player position to the grass material and bend blades within a sphere mask radius (UE4
  tutorial, Godot 2D version) [S41][S42]. Cutting as a two-mesh swap (uncut, cut) is the standard answer for the
  Zelda-style burst [S43]. A 2D destructible-grass devlog hooks destruction into the melee hit system and uses
  scale timelines for cheap destruction [S44]. A UE5 trimmer demo stores blade height in a render target that
  drives both the opacity mask and the cut particles [S45].

### Inferences for SpeedRunner [I]
- Grass blades as 2 to 4 segment polylines with a lean angle; bend toward velocity for blades within 1 BL of the
  hero (lean = clamp(vx/420, -1, 1)·35 degrees), recover with a spring (k 120, c 8, under-damped so it wobbles).
  Cut when the katana line (hand to tip) crosses a blade's top: replace the blade with its lower half and spawn
  2 to 3 clipping particles that fall with gravity. Cost is a loop over on-screen blades only.
- Speed cues already cheap in Canvas2D: parallax at 3 layers (0.15, 0.4, 0.7 of camera speed), a ground-line speed
  streak behind the hero when vx > 360 u/s (3 to 5 short lines, 20 to 40 u, alpha 0.3, 80 ms life), background
  blur faked by drawing the far layer twice with a 2 to 4 px horizontal offset at alpha 0.5 when vx > 300 u/s.
  Celeste and Katana ZERO use speed lines on dashes only [I]. These are inferences; note 03 Q2 covers trails.

### Gaps
- [G] Okami's brush grass, Ghost of Tsushima's grass cut, Katana ZERO and Celeste foliage: no source reached.

---

## Candidate technique profiles

1. **Rhythm-first seeded map.** Generate input rhythm, then geometry, then prove it with a headless bot on the
   deterministic 120 Hz step; reject if the bot dies. Launchpad 2009, Sure Footing 2018, MarioGPT (88.4% playable
   with A*). Key numbers: rhythm groups 5/10/15/20 s; max flat gap two thirds of jump reach (Canabalt); chunk
   1.6 screens (Boney).
2. **Tagged chunk pool with a drawn ramp.** Four classes E/M/H/Bonus, random pick per class from a hand-drawn
   difficulty-over-index curve; 230 chunks split 99/62/55/14; rest chunk every 3 to 8. Jetpack Joyride model, Canabalt.
3. **Speed-coupled difficulty.** Gap and obstacle sizes derived from current speed, so a mistake self-corrects.
   Canabalt: gap <= 2/3 speed, hallway 48 to 96 px, obstacle -30% speed, accel 50/30/20/10.
4. **Daily seed wrapper.** Same seed for 24 h, one counted try plus free practice, per-day board; medals from the
   bot's author time at 1.06 / 1.2 / 1.5. Spelunky Daily, Trackmania TOTD and COTD (10 + 5 min qualifying).
5. **Two-pose procedural cycle with physics secondary motion.** 13 keyframes for a whole character (Overgrowth);
   points-in-space rig (Rain World, 2 chunks at fixed distance); springs for cloth (SpeedRunner k 160 c 14, zeta 0.55).
6. **Grass bend-then-cut.** Sphere-mask bend within 1 BL, two-state blade swap on katana line crossing, 2 to 3
   clipping particles; parallax 3 layers and 80 ms speed streaks above 360 u/s.

---

## Sources
1. Saltsman, "Tuning Canabalt", Game Developer. https://gamedeveloper.com/design/tuning-canabalt
2. Pocket Gamer interview with Adam Saltsman (procedural to build skill). https://www.pocketgamer.com/gravity-hook-hd/canabalt-creator-adam-saltsman-talks-indie-games-learning-curves-and-30-hour-ipa
3. Game Developer, "The tip of the iceberg: storytelling and reactive design in Canabalt and Capsule". https://gamedeveloper.com/design/the-tip-of-the-iceberg-storytelling-and-reactive-design-in-i-canabalt-i-and-i-capsule-i-
4. Carvalho, Moreira, Filho, Albuquerque, Ramalho, "A Generic Framework for Procedural Generation of Gameplay Sessions", SBGames 2013. https://www.sbgames.org/sbgames2013/proceedings/comp/23-full-paper.pdf
5. Muscat, "Depth in Simplicity: The Making of Jetpack Joyride", GDC 2012, GDC Vault. https://gamedeveloper.com/design/video-depth-in-simplicity-the-making-of-i-jetpack-joyride-i-
6. Smith, Treanor, Whitehead, Mateas, "Rhythm-Based Level Generation for 2D Platformers", FDG 2009. https://expressiveintelligence.github.io/papers/smith-fdg-09.pdf
7. Thompson, "Keep Running: Procedural Level Generation in Sure Footing", Game Developer, 27 Jun 2018. https://gamedeveloper.com/design/keep-running-procedural-level-generation-in-sure-footing
8. Mario AI framework course lab (150x16 levels, A* agent). https://docs.google.com/presentation/d/11jGyHMx1zbALiUlzbIqpe9YZ_gL40SbW/htmlpresent
9. Sudhakaran et al., "MarioGPT", arXiv 2302.05981. https://arxiv.org/pdf/2302.05981
10. Volz et al., "Evolving Mario Levels in the Latent Space of a DCGAN", arXiv 1805.00728. https://arxiv.org/pdf/1805.00728
11. Spelunky Wiki, Daily Challenge Mode (HD). https://spelunky.fandom.com/wiki/Daily_Challenge_Mode_(HD)
12. Game Developer, "The 24-hour ticket: examining daily runs". https://gamedeveloper.com/design/the-24-hour-ticket-examining-daily-runs-
13. Trackmania docs, "How to play Cup of the Day". https://doc.trackmania.com/play/how-to-play-cotd/
14. Trackmania news, "Cup of the Day is now available three times a day". https://www.trackmania.com/news/1814?lang=en
15. Trackmania docs, "What is Royal?". https://doc.trackmania.com/play/what-is-royal/
16. Doodle Jump strategy blog (platform types, no numbers). https://dinogame.gg/blog/doodle-jump-strategy-tips/
17. Guinness World Records, fastest any% completion of Celeste. https://www.guinnessworldrecords.com/world-records/525519-fastest-any-completion-of-celeste
18. PC Gamer, "The best Celeste speedrun so far beats the game in 47 minutes" (2018). https://www.pcgamer.com/the-best-celeste-speedrun-so-far-beats-the-game-in-47-minutes
19. Celeste fan wiki, Chapter 1: Forsaken City (402 on fetch; records seen as search snippet). https://celestegame.fandom.com/wiki/Chapter_1:_Forsaken_City
20. Defector, "It is in fact possible to get too good at a video game" (12 000 deaths, 43 h). https://defector.com/it-is-in-fact-possible-to-get-too-good-at-a-video-game
21. Cadence blog, Celeste speedruns (20 018 deaths). https://cadence.moe/blog/2020-06-12-celeste-speedruns
22. GamesRadar, Super Meat Boy deathless after 700 h and 100 000 deaths. https://www.gamesradar.com/games/platformer/15-years-later-after-700-hours-of-grinding-and-at-least-100-000-deaths-speedrunner-finally-beats-all-of-super-meat-boy-without-dying-earning-a-congrats-from-co-creator-edmund-mcmillen
23. Trackmania TOTD 20 May 2023 discussion with medal times. https://devtrackers.gg/trackmania/p/92351a6c-totd-20-05-2023-seasonal-sprint-by-evo-xlrb-discussion
24. Openplanet "Default Medals" plugin (1.06 / 1.2 / 1.5 AT). https://openplanet.dev/plugin/defaultmedals
25. Mania Exchange blog, "What do you think? Medal times" (2015). https://tm.mania-exchange.com/blogs/entry/569/what-do-you-think-medal-times
26. GGRecon, Trackmania author medals guide. https://ggrecon.com/guides/trackmania-author-medals
27. GDC Vault, Rosen, "Animation Bootcamp: An Indie Approach to Procedural Animation" (2014). https://gdcvault.com/play/1020583/Animation-Bootcamp-An-Indie-Approach
28. Game Developer write-up of the Rosen talk. https://gamedeveloper.com/design/video-an-indie-approach-to-procedural-animation
29. Unity discussions thread on the Rosen talk (13 keyframes quote). https://discussions.unity.com/t/an-indie-approach-to-procedural-animation-gdc-video-talk/538228
30. GDC YouTube, "The Rain World Animation Process" (GDC 2016). https://www.youtube.com/watch?v=sVntwsrjNe4
31. Game Developer, "Video: Animating Rain World and its many squishy, stretchy creatures" (17 Jul 2017). https://gamedeveloper.com/art/video-animating-i-rain-world-i-and-its-many-squishy-stretchy-creatures
32. Unity blog, "Exploring procedural design in Rain World: The Watcher". https://unity.com/blog/exploring-procedural-design-rain-world
33. Unreal forums, Gang Beasts "virtual forces" explanation with Boneloaf Unite 2015 talk link. https://forums.unrealengine.com/t/gang-beasts-human-fall-flat-ragdoll-characters-in-ue4/155641
34. Unity discussions, ragdoll blending (secondhand Gang Beasts detail). https://discussions.unity.com/t/how-to-blend-ragdoll-physics-with-animation/734320
35. WPI DGMI wiki, Ragdoll physics (Fall Guys). https://dgmiwiki.wpi.edu/mechanic/ragdoll_physics
36. Wikipedia, Getting Over It with Bennett Foddy. https://en.wikipedia.org/wiki/Getting_Over_It_with_Bennett_Foddy
37. Game Developer, "Designer interview: the aesthetics of frustration in Getting Over It" (Jan 2018). https://gamedeveloper.com/design/designer-interview-the-aesthetics-of-frustration-in-i-getting-over-it-i-
38. Wikipedia, Fancy Pants (video game series). https://en.wikipedia.org/wiki/Fancy_Pants_(video_game_series)
39. PC Gamer, "This Flash developer is battling 18 years of legacy code..." https://www.pcgamer.com/games/action/this-flash-developer-is-battling-18-years-of-legacy-code-to-bring-my-childhood-favorite-platformers-to-steam
40. Mirror page on Fancy Pants World 2 "tile-based physics" (weak source). https://presentationbuilder.internationaltrucks.com/fancy-pants-world-2-game
41. Kodeco, "Creating Interactive Grass in Unreal Engine 4". https://www.kodeco.com/6314-creating-interactive-grass-in-unreal-engine-4?page=1
42. Godot forum, 2D grass that bends and can be cut. https://forum.godotengine.org/t/how-to-make-a-grass-that-interact-with-bodies-be-able-to-cut-it/5992
43. Blender Artists, "Cutting grass" (two-mesh swap). https://blenderartists.org/t/cutting-grass/509060
44. itch.io devlog, destructible grass hooked to melee hits. https://avirahmandev.itch.io/cube-knight-adventure/devlog/348894/added-grass-objects
45. 80.lv, grass trimming mechanic with render-target height. https://80.lv/articles/why-touch-grass-when-you-can-cut-it-check-out-this-neat-grass-trimming-mechanic
