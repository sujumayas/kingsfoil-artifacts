# 05. Physics and input verbs of the named games

Scope: the verbs that do not live on a jump button. Getting Over It's hammer (and the Jump King and Pogostuck
successors), Solipskier's drawn slope (and Tiny Wings, Alto, Line Rider), Jetpack Joyride's one-button thrust (and
Flappy Bird, the Helicopter game), Doodle Jump's tilt and shoot and its item verbs, Fall Guys' jump, dive and grab,
and Cat Mario's anti-verbs. The Mechanics #1 dossiers (`studies/mechanics-speedrunner/notes/10-named-games.md`,
cited as [S4-10]) already hold release dates, sales and the "transfers" list for each game; this note adds verb
detail only. Units: SpeedRunner's hero is 20x46 u, 1 BL = 46 u, jumpVel 830 u/s, gravity 2500 u/s² (time to apex
332 ms, apex 3.0 BL) [K, 01-current-build.md].

Source access this session: speedrun.com (403), every Fandom wiki (402), Epic's help centre (403) and GamesRadar
(truncated) were unreachable, so several community numbers below are marked [memory] or [gap] instead of cited.
Everything marked [memory] is the author's recollection of play or of community pages and must be verified
before it reaches the report.

---

## 1. Getting Over It's hammer (2017, Bennett Foddy)

### Takeaway
One continuous analog verb with no jump. The cursor is the hammer head; the body is a passive mass in a pot. Every
"move" (hook, pull, vault, pogo) is a pattern the player discovers in the same mapping, which is why one verb
carried 2.7 M players [S4-10]. For SpeedRunner it is the strongest argument for depth inside a single input, and the
weakest candidate for literal transfer, because an analog pointer cannot be replayed from a two-button keyboard log.

### Cited findings
- Input: "a mouse or trackpad to move the character's upper body and sledgehammer, which grip objects and pull him
  up the mountain". Controllers supported but "considerably harder" because of joystick precision [1].
- The hero: Diogenes "lives in a large metal cauldron and wields a Yosemite hammer" [1]. Engine Unity (infobox) [1].
- Foddy on the lineage: Sexy Hiking (Jazzuo, 2002) reached him in 2007 through Derek Yu's TIGSource post; Adam
  Saltsman called it "the single worst game I have ever played"; after showing it to NYU students Foddy "realized
  how timeless the design was"; the students "were polarized" like indie devs in 2007 [1][2]. The B-games piece
  names "a hammer controlled by a mouse" as the shared verb of Sexy Hiking and Getting Over It [2].
- Foddy on why it hurts: made for "a certain kind of person, to hurt them"; he is a fan of "messy, realtime physics
  puzzle games" [1]. On stakes: when progress "can be taken away and you might have to do it again, that adds a
  sense of importance and high stakes" [3]. On his own play: "I would feel myself tensing up and I'd be too
  careful" [3]. On frustration as a pattern: "maybe it's richer and more interesting than people have given it
  credit for" [4]. QWOP is Foddy's earlier one-mapping physics game (Q, W, O, P drive the runner's thigh and calf
  muscles) [4].
- Foddy's own time on camera: 34 minutes (Kotaku video), previous best four and a half hours [3].
- Speedrun community vocabulary (titles only, pages 403): speedrun.com hosts a "15 Speedrunning Techniques" guide
  and an "anvil slam pogo guide"; the technique video's chapters are Swing / Windmill, Simple Repositioning, Pogo,
  Bounce / Tunnel Climbing [5]. A Snake% rule reads "You must ride the snake once and then complete the game" [6].
- Community reimplementations (not Foddy's values, useful as a starting tune): a Godot clone clamps the cursor
  target to a 110-unit reach around the body, moves the head toward the cursor with a 0.59 responsiveness factor
  per step, and gives the body angular damping 100 and linear damping 1 [7]. A VR analysis describes the game as
  2D rotation "about the collision point of the hammer as the vertex" [8].

### Inferences
- Mapping, as far as play and the clones show: the hammer head targets the cursor, clamped to a circle around the
  pot (reach about 2 pot diameters), and is driven there by a stiff spring or joint motor rather than teleported,
  so the head lags fast swings. That lag is the skill: a slow pull is a hook, a fast flick is a swing. Pot mass,
  joint type and motor force are not published [gap].
- Verbs players named [memory, verify on speedrun.com when reachable]: the hook-and-pull (hammer head over a
  ledge, drag the cursor down), the "pole vault" (plant the head below and behind, sweep the cursor over the top
  so the body arcs over the hammer), the pogo (repeated plants against a floor to bounce), the windmill (continuous
  circular swing for speed on flat ground), tunnel climbing (alternating plants on both walls of a narrow shaft).
  "Orange hell", "the snake" (a long slide that drops you several screens), the anvil and the church are route
  landmarks, not verbs. A "mushroom skip" was not found in any page fetched [gap].
- Top any% times near one minute [S4-10, uncited]; a 2-minute "no skip" run is referenced by a low-quality page
  [uncited]. Treat as unknown until speedrun.com/goiwbf is read.
- Animation read: no poses. The read is the hammer's shaft angle and the pot's rotation; the sound is impact and
  scrape on the material under the head. Readability comes from the world (every surface is a known hold).

### Successors
- Jump King (Nexile, 3 May 2019 PC; consoles 9 Jun 2020; MonoGame): "jumps can be charged, which affects how far
  the player moves each time", no checkpoints, falls cost "a significant portion of their progress" [9]. Hold to
  charge, release to jump, no mid-air control (playpile summary) [10]; height "dependent on the time spent
  charging" [11]. Community table (hold frames to height in blocks) is on the Fandom wiki, which returned 402
  [gap]. From play [memory]: full charge is about 0.6 s (around 35 frames at 60 fps), a full jump is about one
  screen tall, direction is locked at release, a long fall ends in a splat with roughly 1 s of stun.
- Pogostuck (Superku, 28 Feb 2019): "Tilt the character, jump, use momentum" and "360° powerboosts"; keyboard,
  mouse or gamepad; Map 2 is a "1000-meter-deep chasm" [12]. The pogo verb: hold to compress, release at the
  moment of contact, tilt in the air to aim the next bounce; a full spin mid-air adds a boost [memory].
- Sexy Hiking (2002) and QWOP (2008) are the lineage: a single analog mapping onto a ragdoll, no jump [1][2][4].

### Transfer to a samurai time attack
- As a core verb: no. Deterministic input replays and ghosts (settled in #1) need discrete inputs; a pointer path
  at 120 Hz is replayable but not comparable across players, and the game is keyboard-only today [K].
- As a section: a "charged jump" (Jump King) fits. Hold jump to charge 0 to 600 ms, release for 0.6 to 3.0 BL,
  no air control. It is one button, deterministic, and gives a map author a precise-height gate. Cost: it fights
  the variable jump already on the same key (jumpCut 0.45) [K]; it needs its own context (a "crouch-charge" only
  while standing still) or its own button.
- As a power-up: a hook or grapple point with a one-button "plant and vault" could keep the pole-vault feeling with
  a discrete input; see the grapple research in the other files.
- Profile candidates: "Charged jump (Jump King)" and "One-verb depth (Foddy)" as a design note, not a toggle.

### See it
- https://en.wikipedia.org/wiki/Getting_Over_It_with_Bennett_Foddy [1]
- https://gamedeveloper.com/design/how-b-games-influenced-the-design-of-i-getting-over-it-i- [2]
- https://en.wikipedia.org/wiki/Jump_King [9]
- https://store.steampowered.com/app/688130/Pogostuck_Rage_With_Your_Friends/ [12]

---

## 2. Solipskier's draw-the-slope (2010, Mikengreg)

### Takeaway
The finger is the level. The skier's speed is a function of the slope the player is drawing under it right now,
and lifting the finger removes the ground, so "jump" is the absence of input. No designer interview was reachable
in budget; the mechanics below rest on the Wikipedia description, the sibling games' pages and play memory.

### Cited findings
- Solipskier: draw the slope; the skier rides through gates, tunnels and walls; inclines launch tricks, downhill
  adds speed; the skier gets faster over time; consecutive gate passes earn bonus points; upcoming obstacles show
  on the right with required altitude and distance; endless until a crash. Boxleiter proposed players could
  "paint the terrain" to control speed; the prototype took hours; no tutorial, the game starts on the first click
  [S4-10 citing Wikipedia].
- Tiny Wings (Andreas Illiger, 2011): the player taps and holds "in order to make the bird drop"; the loop is
  "use hills to gain speed" by sliding down and flying up; the mechanic was inspired by Nathan McCoy's Wavespark;
  about seven months of development; Illiger designed for "a 1.5-year-old child" to be able to play [13].
- Alto's Adventure (Team Alto, iOS 19 Feb 2015): auto-run right; tap once to jump, hold while airborne to backflip;
  quick successions of tricks are "combos"; 180 goals, three active at a time; grinding across rooftops; a wingsuit
  late in the game [14].
- Line Rider (Boštjan Čadež, first upload 23 Sep 2006 on DeviantArt): draw lines with the mouse, press Play and
  "Bosh" rides them; the track must be smooth or the rider falls off the sled; Beta 3 (23 Oct 2009) added
  deceleration lines, dual players, a camera and trapdoors; Silverlight replaced Flash on 1 Jul 2008 [15].

### Inferences
- Sampling [memory, matches the Flash build]: the line is a polyline of pointer samples per frame; the skier's
  foot is snapped to the segment under its x; velocity along the segment grows with the downhill component
  (gravity projected onto the slope) and is capped by a global speed that rises with distance. Lift the finger and
  the skier keeps its launch vector; a steeper up-ramp at release gives more air. Drawing the line through a red
  cable or wall kills; blue gates must be crossed by the line itself, so gates are height checks on the drawing,
  not on the skier.
- Tiny Wings is the same physics with the input inverted: hold adds downward force (dive) so the bird hugs the
  valley and gains speed, release lets the hill launch it. "Perfect slide" bonuses and fever mode are not in the
  Wikipedia text fetched [gap].
- Alto reduces the slope verb to a trick system: slope is authored, the player only times jump and hold, and the
  reward for a landed trick is a speed boost [memory; not in the page fetched].
- Line Rider is the pure drawing verb with no runtime input, which is the difference between an authoring tool and
  a verb.

### Transfer to a samurai time attack
- As a core verb: no (the player authors the route, so times are not comparable) [S4-10].
- As a section: a "slide slope" tile set where a crouch-slide on a down-ramp adds speed (gravity along the slope,
  as SpeedRunner already has slopes? No: today's solids are AABB only [K]). Slopes are a map feature first, then a
  verb (crouch to slide, release at the lip to launch). Roughly: on a 30° down-slope the hero gains
  g·sin(30°) = 1250 u/s² while sliding, so 1 s of slide from a stand gives 1250 u/s, three times maxRun, which is
  why slopes need a cap like overspeedDecay 500 u/s² [K].
- As a power-up: "Tiny Wings dive" maps to a hold-down in the air that adds downward force (fast fall) so the hero
  hits a down-slope sooner; a fast-fall is a common speedrunner verb and is cheap (one constant: extra gravity
  while down is held).
- Profile candidates: "Slope slide and lip launch" and "Fast fall (hold down)".

### See it
- https://en.wikipedia.org/wiki/Solipskier (via [S4-10])
- https://en.wikipedia.org/wiki/Tiny_Wings [13]
- https://en.wikipedia.org/wiki/Alto%27s_Adventure [14]
- https://en.wikipedia.org/wiki/Line_Rider [15]

---

## 3. Jetpack Joyride's one-button thrust (2011, Halfbrick)

### Takeaway
Hold to thrust up, release to fall, auto-run. The verb is a continuous vertical control on one button; the whole
game is a corridor whose hazards differ by lead time [S4-10]. Inside a platformer it is a section type, not a core
verb, and its cousin (tap to flap) is the cheapest "no gravity exploit" test of a corridor.

### Cited findings
- Jetpack Joyride: one-touch thrust; coins, zappers, missiles, lasers; vehicles swap the verb; jetpacks are
  cosmetic and "do not change physics"; one tap from death to replay; Luke Muscat chose one button because it
  "would appeal to even the most inexperienced players" [S4-10 citing 17, 18, 20 of that file]. The Fandom wiki
  with the per-distance speed table returned 402 [gap]. No community measurement of thrust acceleration vs gravity
  was found [gap].
- Helicopter game (Flash, about 2002 to 2004, authorship disputed): hold the mouse button to rise, release to fall,
  through a narrowing cave; multiple near-identical builds spread across portals without credit [16][17].
- Flappy Bird (2013) uses tap-to-flap (an impulse) instead of hold-to-rise, and vertical pipes instead of a cave
  [17]. Original constants are not published; reimplementations use: gravity 750 px/s² and flap -280 px/s [18];
  gravity 1000 px/s², impulse -400 px/s, scroll 220 px/s, pipe gap 150 px, spawn every 1400 ms [19]; gravity 600,
  flap -250, gap 140 px [20]; per-frame variants gravity 0.35 px/frame² and flap -6.5 px/frame with pipes at
  2.4 px/frame [21]. Several run physics at a fixed 50 Hz [21].

### Inferences
- The Flappy clones agree on a flap time-to-apex of 0.37 to 0.42 s (v/g: 280/750, 400/1000, 250/600), close to
  SpeedRunner's 0.33 s jump apex [K]. The gap (140 to 150 px) is about 4 bird heights, and the pipe pair arrives
  every 1.4 s at 220 px/s, about 310 px apart [19].
- Jetpack Joyride's thrust is an acceleration while held, with a terminal climb speed, and the fall is gravity with
  a terminal speed; the sprite is a lean-forward run on the floor and a straight body with a flame trail in the
  air [memory]. The hazard grammar (zapper static, missile with siren and icon, laser with a charge line) is in
  [S4-10].

### Transfer to a samurai time attack
- As a section: yes. A "wind tunnel" or "kite" section where jump becomes hold-to-thrust (acceleration about
  1.4 g, so 3500 u/s² up while held against 2500 down, terminal 600 u/s both ways) and the run is auto-scrolled at
  maxRun. Deterministic, one button, keyboard-only, and the ghost still works. Ceiling and floor spikes replace
  zappers.
- As a power-up: a 3 s jetpack pickup that changes the jump key into thrust is the Doodle Jump jetpack, see section 4.
- As a core verb: no; it removes the jump and the wall kit.
- Flappy-style tap-to-flap is the same section with an impulse (vy = -830 on every tap, no ground); it is harsher
  and reads worse at 420 u/s.
- Profile candidates: "Hold-to-thrust corridor" and "Tap-to-flap corridor" (one profile, two tunings).

### See it
- https://www.gdcvault.com/play/1015527/Depth-in-Simplicity-The-Making (via [S4-10])
- https://otherstrangeness.com/?p=55 (Helicopter game origins) [16]
- https://dinogame.gg/blog/history-of-helicopter-game/ [17]
- https://dev.to/shaishav_patel_271fdcd61a/building-flappy-bird-in-react-canvas-raf-physics-gravity-pipe-generation-and-speed-25fd [19]

---

## 4. Doodle Jump's tilt steering and shoot (2009, Lima Sky)

### Takeaway
Steering is analog (tilt), jumping is automatic (every platform bounces), the only discrete verb is shoot (tap),
and the items are temporary verb swaps with fixed heights. Pusenjak credited "intuitive and precise tilt controls"
[S4-10]. For a side-view time attack the items are the useful part: a spring, a trampoline and a timed flight
power-up are each one profile.

### Cited findings
- Core: guide the Doodler up "a never-ending series of platforms without falling" [22]; power-ups are propeller
  hats, jetpacks, rockets, springs, trampolines and invulnerability shields (shields "some levels only") [22].
- Item values (community guide, points): propeller hat about 1200 to 1500, jetpack about 2800 to 3000, rocket
  about 6000 to 7000, the rocket only in the space theme [23]. Trampoline "4x height boost" and the propeller hat
  "slower and easier to steer" than the jetpack (single-source fan walkthrough, unverified) [24].
- Controls [S4-10 and 22]: tilt to steer, tap to shoot upward, the Doodler wraps from one screen edge to the other.
  The Fandom wiki with per-item pages returned 402 [gap].

### Inferences
- Score in Doodle Jump is height climbed in screen pixels of the original 320x480 iPhone layout [memory]. If so,
  the propeller hat is about 2.5 to 3 screens, the jetpack about 6 screens and the rocket 12 to 15 screens of
  flight; a normal bounce is roughly 1/3 of a screen, so a spring (about 2x) is 2/3 of a screen and a trampoline
  (4x) is 1.3 screens [inference on 23, 24].
- Tilt mapping [memory]: horizontal speed proportional to device angle with a dead zone, saturating near 30°; no
  inertia on reversal. On keyboard the same verb is left/right at a fixed speed, which is already SpeedRunner's run.
- Shoot [memory]: tap anywhere fires a nose ball straight up (slight aim by tap x), unlimited, cooldown about
  150 ms; monsters die in one hit; a shot has no effect on movement. It is the "one-button slash" of a vertical
  game and SpeedRunner's slash is already settled in #1 (D4: 100 ms, 50x40 u, momentum kept) [CONTEXT].
- Animation read: the Doodler never animates the jump, the item animates (hat spins, jetpack flame, rocket smoke);
  the read is the item's sound loop and its remaining-time implied by height gained.

### Transfer to a samurai time attack
- As map elements: spring (set vy to 2x jumpVel, about 1660 u/s, apex 12 BL) and trampoline (4x, impractical at
  2500 u/s² gravity: 3320 u/s gives a 100 BL apex, so a trampoline becomes a "launch to the next section"
  element). Both are deterministic, keyboard-free, and reward the approach speed if horizontal speed is kept.
  Elements were covered in #1 as a category; the numbers here are the Doodle Jump ratios.
- As a timed power-up: propeller hat (3 s of slow rise at about 300 u/s with full air control), jetpack (2 s of
  1000 u/s rise, air control halved), rocket (1 s of 2000 u/s, no control). Each is a verb swap with a fixed
  duration and a clear sound, and the duration sets the height a map author can require. Ghosts still work because
  the pickup position is fixed.
- Screen wrap: a vertical "well" section with wrap is cheap (x modulo width) and fits a vertical map like m3 THE
  DUNGEON [K]; it changes routing because the fastest line can leave one side and enter the other.
- Tilt steering: no (keyboard only, no gyro on desktop; on mobile a future touch build could map tilt to run).
- Profile candidates: "Spring and trampoline (x2, x4)", "Timed flight power-up (hat, jetpack, rocket)", "Screen wrap well".

### See it
- https://en.wikipedia.org/wiki/Doodle_Jump [22]
- https://www.gamerevolution.com/guides/56951-doodle-jump-how-much-points-you-get-with-special-items [23]
- https://dinogame.gg/blog/doodle-jump-strategy-tips/ [24]

---

## 5. Fall Guys' jump, dive and grab (2020, Mediatonic)

### Takeaway
Three verbs, each deliberately floppy: a short jump, a dive that extends the jump and ends face down, and a grab
that holds a ledge, an object or another bean. Walsh's target was "about 80 percent skill and a 20 percent
sprinkling of chaos" [25]. The dive is the only one a solo time attack can keep: it turns every gap into a
jump-or-jump-dive decision and adds a recovery cost that punishes greed.

### Cited findings
- Joe Walsh (lead designer): "As soon as you lose the ragdoll-ness of the character, you lose the comedy";
  "Everything you simulate with the character multiplies by 60"; "we don't want players who speedrun games to win
  every single time"; "about 80 percent skill and a 20 percent sprinkling of chaos"; "It felt super-chaotic, even
  with 30 people" [25]. Jeff Tanton (creative director): "Falling over is basically [the characters'] superpower";
  "We had to make sure falling over was always slapstick funny"; "sometimes you know as a designer that the thing
  they're angry at is not the thing they think they're angry at" [25].
- Walsh elsewhere: rounds must be "simple, replayable", and the ideal is "you always feel like it was your fault
  that you failed" [S4-10]. A developer describes the dive as "essentially a dodge roll" that players know from
  other games, restyled for the cartoon [26].
- Inputs: grab is R2 (PlayStation), RT (Xbox), ZR (Switch), Shift (PC); grab "extends the bean's arms in front"
  [27]. A dive dodges projectiles, extends air time "for a longer jump" and lunges at the finish line [28]. On
  consoles and PC a second jump press in the air dives automatically and this can be turned off in settings (Epic
  help article title; body 403) [29]. Season 3 "Sunken Secrets" added dive sliding on slime or ice paths [30].
- Published physics numbers (dive distance, grab duration, jump height): none found. The Fandom "Dive" page
  returned 402 and GamesRadar's how-to was truncated [gap]. A Steam thread has players hold grab "from the dive
  until landing" to catch a ledge, with disagreement on the order [31].

### Inferences
- From play [memory]: the jump is about one bean tall (1 BL), a dive adds about one bean of horizontal reach and
  about 0.3 s of air, and ends in a face-down recovery of roughly 1 s on flat ground (shorter if the player mashes
  jump); the grab holds a player for about 1 to 2 s before the grabbed player breaks free, holds a ledge
  indefinitely until the player pulls up, and slows the grabber's run. A dive that lands on a slope slides.
- The imprecision is in the ragdoll's landing, not in the input: inputs are read exactly, the body then settles
  by physics, so the same input gives slightly different outcomes. That is what Walsh calls the 20 percent.
- Animation read: dive is a full-body horizontal pose with arms forward; recovery is a face-down ragdoll that gets
  up; grab is both arms extended with a hold loop. The read is unmistakable at 60 players, which is the design
  requirement.

### Transfer to a samurai time attack
- Dive: yes, as a mode or as a late-map verb. One button in the air (the second jump press, as Fall Guys does on
  consoles), 120 ms startup, +250 u/s horizontal, vy clamped to 0 at start, body goes horizontal, landing from a
  dive costs 250 ms of prone (versus the 130 ms land squash today) unless it chains into the existing roll (the
  roll already keeps 280 u/s after a 230 u fall) [K]. A dive-into-roll keeps speed; a dive onto a short landing
  eats time. That trade is the routing content.
- Dive slide: a dive onto a slope or ice keeps sliding; pairs with section 2's slopes.
- Grab: a ledge grab and mantle is covered by another researcher. Grabbing other players: only in a live race
  (not built) and it fights "it was your fault". Grabbing objects: no objects today.
- Deliberate ragdoll: no. SpeedRunner is deterministic and the ghost compares frames; ragdoll noise breaks both.
- Profile candidates: "Dive (second jump press in the air)", "Dive slide".

### See it
- https://gamesbeat.com/fall-guys-ultimate-knockout-how-mediatonic-crafted-a-cute-battle-royale/ [25]
- https://digitallydownloaded.net/?p=42226 [26]
- https://www.androidcentral.com/fall-guys-ultimate-knockout-how-dive-and-push [28]
- https://en.wikipedia.org/wiki/Fall_Guys [30]

---

## 6. Cat Mario / Syobon Action's anti-verbs (2007, Chiku)

### Takeaway
No new verb; the game runs on SMB1's run and jump and breaks every promise the level makes. The trick vocabulary
is listed once below. A time attack keeps none of it on the main maps (betrayal is a one-time joke, and a time
attack is played a hundred times), but one comedy map or one betrayed element in an expert map can keep the
lesson about shape and trust [S4-10].

### Cited findings
- Controls: jump with Z or Up; the "4 stage" version is the one the official site hosts; stages 5 to 8 belong to a
  different build [32]. The TAS of the 4-stage version is 1:51.63 by jlun2, Hourglass r71, 30 FPS, "fastest time
  for real, no deaths, minor glitch abuse" [32].
- Tricks in the TAS: wall jumping ("with enough horizontal speed, the player turns around for about one frame to
  clip into a wall, then holds jump to jump again from inside the wall") and a one-frame quick turn by bumping a
  wall, used once in 1-1 [32].
- speedrun.com has Any% and "Any% No Spacebar" categories and three guides (page 403; titles from search) [33].
- Memetic record: Cat Mario, Neko Mario, the rage-face retexture, Open Syobon Action, Syobon Action 2 and 3; the
  first stage was made in three days [S4-10].

### Trick vocabulary (one list, [memory] except where cited; verify against the TVTropes page when reachable [34])
1. Fake solid: a block or ground that falls the moment it is stepped on (the first gap of 1-1 has a hidden one).
2. Hidden block: an invisible block over a gap that stops the jump and drops the player into the pit.
3. Falling cloud: a decorative cloud that drops like a weight when the player passes under it.
4. Hostile power-up: the mushroom that kills, the item box that spawns an enemy, the "flower" that attacks.
5. Moving goal: the flag pole that runs away or sinks into the ground when approached; the fake castle.
6. Betrayed enemy: the Goomba that cannot be stomped, the one that flies, the one that is a block.
7. Wrong pipe: pipes that spit the player back or swallow them into a spike pit.
8. Falling ceiling and falling sky: the level itself drops a slab on the known safe spot.
9. Spike pop: spikes rise from flat ground after a fixed delay on a known line.
10. Trust-then-punish rhythm: every trick is placed where SMB1 taught the player to stand or jump.

### Inferences
- The run route is a memorised list of which conventions are lies, so the skill ceiling is near zero after the
  first clear (the TAS gains only on the wall clip and turn). This is the opposite of a time attack verb.
- Real anti-verbs here are two: the one-frame wall clip (a collision-order bug that becomes a verb) and the quick
  turn. Both are "glitch verbs", and speedrun.com's "No Spacebar" category shows the community splitting on a
  rebind trick rather than on the level content [33].

### Transfer to a samurai time attack
- Main maps: nothing. Deterministic, replayable maps and a 3.4 s restart make betrayal cost nothing after one death
  and teach nothing after the second.
- Comedy map: yes, one, outside the season leaderboard, with the vocabulary above used once each and a visible
  "trap" counter. Also the "betrayed shape, once" idea for an expert map is already in [S4-10].
- Glitch verbs: a one-frame wall clip is a bug, not a feature, and SpeedRunner's separate-axis collision with 6
  iterations is built to prevent it [K]. Keep it out.
- Profile candidate: "Anti-verb comedy map" (a map, not a verb). The wall clip is a test case for the sandbox's
  collision, not a profile.

### See it
- https://tasvideos.org/Forum/Posts/287303 [32]
- https://en.wikipedia.org/wiki/Syobon_Action (via [S4-10])
- https://tvtropes.org/pmwiki/pmwiki.php/VideoGame/SyobonAction (403 this session) [34]

---

## Candidate technique profiles from this file
| Name | One line | Games | Key numbers |
|---|---|---|---|
| Charged jump | Hold jump while standing to charge, release for 0.6 to 3.0 BL, direction locked at release | Jump King, Pogostuck | charge 0 to about 600 ms [memory]; no air control [10] |
| Slope slide and lip launch | Crouch on a down-slope to slide (g·sin θ), release at the lip to launch | Solipskier, Tiny Wings, Alto | 30° slope adds 1250 u/s² [inference on K] |
| Fast fall (hold down) | Extra gravity while down is held in the air | Tiny Wings (hold to dive) | Tiny Wings: hold "to make the bird drop" [13] |
| Hold-to-thrust corridor | Jump key becomes thrust, auto-scroll section, no ground | Jetpack Joyride, Helicopter game | thrust about 1.4 g, terminal 600 u/s [proposal]; Flappy clones apex 0.37 to 0.42 s [18][19][20] |
| Spring and trampoline | Set vy to 2x or 4x jumpVel on contact | Doodle Jump | 2x = 1660 u/s, apex 12 BL; 4x is a section launch [23][24 inference] |
| Timed flight power-up | Pickup swaps jump for a fixed-duration rise with a sound loop | Doodle Jump hat, jetpack, rocket | about 3, 6 and 12 to 15 screens [23 inference] |
| Screen wrap well | Vertical section where x wraps | Doodle Jump | x modulo width; routing leaves one side, enters the other |
| Dive | Second jump press in the air; +250 u/s, body horizontal, prone 250 ms or chain into roll | Fall Guys | about +1 bean reach, about 1 s prone [memory]; 80/20 skill-chaos [25] |
| Dive slide | A dive onto a slope or ice keeps sliding | Fall Guys Season 3 | [30] |
| One-verb depth (design note) | One analog mapping, many discovered moves | Getting Over It, Sexy Hiking, QWOP | 2.7 M players [S4-10]; cursor reach about 110 units in a clone [7] |
| Anti-verb comedy map (map, not verb) | One map that uses each Syobon trick once | Syobon Action | TAS 1:51.63 on 4 stages [32] |

## Gaps
- Getting Over It: pot mass, joint type, motor force, cursor reach and sensitivity settings (not published; clones
  only). speedrun.com guides and the current any% record (403). The "pole vault", "snake" and "mushroom skip"
  definitions from the community (not fetched; "Snake%" is a category rule only).
- Jump King: the community hold-frames-to-height table (Fandom 402).
- Solipskier: any Boxleiter or Wohlwend statement beyond Wikipedia (three searches found nothing); the sampling
  and speed-cap details; gate colours.
- Jetpack Joyride: thrust acceleration, terminal speeds and the speed-by-distance table (Fandom 402; no
  community measurement found). Flappy Bird's original constants (only clones).
- Doodle Jump: item heights from the wiki (402); whether score equals pixels climbed; shoot cooldown.
- Fall Guys: dive distance, prone recovery, grab break-free time, jump height (Fandom 402, Epic 403, GamesRadar
  truncated).
- Syobon Action: the trap list from TVTropes (403) and the speedrun.com guides (403).

## Sources
1. https://en.wikipedia.org/wiki/Getting_Over_It_with_Bennett_Foddy
2. https://gamedeveloper.com/design/how-b-games-influenced-the-design-of-i-getting-over-it-i-
3. https://www.gamedeveloper.com/design/designer-interview-the-aesthetics-of-frustration-in-i-getting-over-it-i-
4. https://design.google/library/bennett-foddy-getting-over-it-interview (Design Notes episode 7, Mar 2018)
5. https://yt.d0.cx/v/yt/JxlHa42RlEk ("15 SPEEDRUNNING Techniques", chapter titles from search; page 530)
6. https://www.speedrun.com/goiwbf/forums/bty9q (Snake% rule, from search snippet; page 403)
7. https://itch.io/post/14305571 (Godot clone constants, from search snippet)
8. https://devforum.roblox.com/t/replicating-physics-movement-from-getting-over-it/1133174
9. https://en.wikipedia.org/wiki/Jump_King
10. https://playpile.gg/games/jump-king
11. https://dgmiwiki.wpi.edu/mechanic/jump
12. https://store.steampowered.com/app/688130/Pogostuck_Rage_With_Your_Friends/
13. https://en.wikipedia.org/wiki/Tiny_Wings
14. https://en.wikipedia.org/wiki/Alto%27s_Adventure
15. https://en.wikipedia.org/wiki/Line_Rider
16. https://otherstrangeness.com/?p=55
17. https://dinogame.gg/blog/history-of-helicopter-game/
18. https://kavindutharushan.pages.dev/coolstuff/flappy.html
19. https://dev.to/shaishav_patel_271fdcd61a/building-flappy-bird-in-react-canvas-raf-physics-gravity-pipe-generation-and-speed-25fd
20. https://sorceress.games/blog/flap-how-to-make-flappy-bird-browser-loop-2026
21. https://athanasopoulos.is-a.dev/blog/building-flappy-bird
22. https://en.wikipedia.org/wiki/Doodle_Jump
23. https://www.gamerevolution.com/guides/56951-doodle-jump-how-much-points-you-get-with-special-items (403 on fetch; numbers from search snippet)
24. https://dinogame.gg/blog/doodle-jump-strategy-tips/
25. https://gamesbeat.com/fall-guys-ultimate-knockout-how-mediatonic-crafted-a-cute-battle-royale/
26. https://digitallydownloaded.net/?p=42226
27. https://progameguides.com/fall-guys/how-to-grab-in-fall-guys-explained
28. https://www.androidcentral.com/fall-guys-ultimate-knockout-how-dive-and-push
29. https://www.epicgames.com/help/en-US/c-Category_FallGuys/c-FallGuys_Gameplay/why-am-i-diving-when-i-double-jump-in-fall-guys-a000091536 (403; title only)
30. https://en.wikipedia.org/wiki/Fall_Guys
31. https://steamcommunity.com/app/1097150/discussions/0/2844543519797088630
32. https://tasvideos.org/Forum/Posts/287303
33. https://www.speedrun.com/syobonaction (403; categories from search snippet)
34. https://tvtropes.org/pmwiki/pmwiki.php/VideoGame/SyobonAction (403)
- [S4-10] studies/mechanics-speedrunner/notes/10-named-games.md
- [K] studies/mechanics-speedrunner-verbs/notes/01-current-build.md
